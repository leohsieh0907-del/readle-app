/**
 * Gemini 1.5 Flash provider
 * 透過 Next.js Route Handler 代理（/api/ai/chat），不直接從前端打 Google API（保護 key）
 *
 * 環境變數（.env.local）：
 *   GEMINI_API_KEY=your-key-from-aistudio.google.com
 */

import type { LLMProvider, ChatRequest, ChatResponse, ChatMessage } from './provider';

const API_ENDPOINT = '/api/ai/chat';

function compileMessages(req: ChatRequest): ChatMessage[] {
  const out: ChatMessage[] = [];
  if (req.systemPrompt) out.push({ role: 'system', content: req.systemPrompt });
  out.push(...req.messages);
  return out;
}

export const geminiProvider: LLMProvider = {
  name: 'gemini',

  async chat(req: ChatRequest): Promise<ChatResponse> {
    const res = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: compileMessages(req),
        temperature: req.temperature ?? 0.7,
        jsonMode: req.jsonMode ?? false,
        maxTokens: req.maxTokens ?? 1024,
        stream: false,
      }),
    });
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Gemini error: ${res.status} ${err}`);
    }
    const json = (await res.json()) as { content: string; usage?: { in: number; out: number } };
    return { content: json.content, usage: json.usage };
  },

  async *chatStream(req: ChatRequest): AsyncIterable<string> {
    const res = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: compileMessages(req),
        temperature: req.temperature ?? 0.7,
        jsonMode: req.jsonMode ?? false,
        maxTokens: req.maxTokens ?? 1024,
        stream: true,
      }),
    });
    if (!res.ok || !res.body) {
      throw new Error(`Gemini stream error: ${res.status}`);
    }
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      // 以 \n 分行解析 SSE-style chunks
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';
      for (const line of lines) {
        if (!line.startsWith('data:')) continue;
        const data = line.slice(5).trim();
        if (!data || data === '[DONE]') continue;
        try {
          const parsed = JSON.parse(data) as { text?: string };
          if (parsed.text) yield parsed.text;
        } catch {
          /* skip */
        }
      }
    }
  },
};
