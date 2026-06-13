/**
 * Gemini Flash 代理 — 保護 API key 不曝露在前端
 *
 * 環境變數：GEMINI_API_KEY（從 https://aistudio.google.com/apikey 取得）
 *
 * 沒有 key 時自動回 503，前端應降級到 mock
 */

import type { NextRequest } from 'next/server';
import { apiGuard } from '@/lib/api-guard';

interface GeminiMessage {
  role: 'user' | 'model';
  parts: { text: string }[];
}

interface ChatBody {
  messages: { role: 'system' | 'user' | 'assistant'; content: string }[];
  temperature?: number;
  jsonMode?: boolean;
  maxTokens?: number;
  stream?: boolean;
}

const MODEL = 'gemini-2.5-flash';
const BASE = 'https://generativelanguage.googleapis.com/v1beta/models';

/** 把 OpenAI 風格訊息轉成 Gemini 風格 */
function toGemini(msgs: ChatBody['messages']): {
  contents: GeminiMessage[];
  systemInstruction?: { parts: { text: string }[] };
} {
  const contents: GeminiMessage[] = [];
  let systemText = '';
  for (const m of msgs) {
    if (m.role === 'system') {
      systemText += (systemText ? '\n\n' : '') + m.content;
    } else {
      contents.push({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.content }],
      });
    }
  }
  return {
    contents,
    systemInstruction: systemText ? { parts: [{ text: systemText }] } : undefined,
  };
}

export async function POST(req: NextRequest) {
  const blocked = apiGuard(req);
  if (blocked) return blocked;

  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    return new Response(
      JSON.stringify({ error: 'GEMINI_API_KEY not set. Falling back to mock.' }),
      { status: 503, headers: { 'Content-Type': 'application/json' } },
    );
  }

  let body: ChatBody;
  try {
    body = (await req.json()) as ChatBody;
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), { status: 400 });
  }

  const { contents, systemInstruction } = toGemini(body.messages);
  const payload = {
    contents,
    systemInstruction,
    generationConfig: {
      temperature: body.temperature ?? 0.7,
      maxOutputTokens: body.maxTokens ?? 2048,
      // Gemini 2.5+ 預設開啟 thinking，會吃掉大量 token 才回覆
      // 對話型助教不需要 — 關掉確保回應穩定且快
      thinkingConfig: { thinkingBudget: 0 },
      ...(body.jsonMode ? { responseMimeType: 'application/json' } : {}),
    },
  };

  if (body.stream) {
    return streamGemini(key, payload);
  }
  return generateGemini(key, payload);
}

async function generateGemini(key: string, payload: unknown): Promise<Response> {
  const url = `${BASE}/${MODEL}:generateContent?key=${key}`;

  // 503（塞車）或 429（超配額，等待後重試）自動重試最多 2 次
  let res: globalThis.Response | null = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (res.status !== 503 && res.status !== 429) break;
    if (attempt < 2) {
      // 429：從回應的 retryDelay 或預設等 30s（但最多等 10s 避免 timeout）
      const wait = res.status === 429 ? 10000 : 600 * (attempt + 1);
      await new Promise((r) => setTimeout(r, wait));
    }
  }
  if (!res || !res.ok) {
    const err = res ? await res.text() : 'no response';
    return new Response(JSON.stringify({ error: `Gemini ${res?.status}: ${err}` }), { status: 502 });
  }
  const data = (await res.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
    usageMetadata?: { promptTokenCount?: number; candidatesTokenCount?: number };
  };
  const content = data.candidates?.[0]?.content?.parts?.map((p) => p.text ?? '').join('') ?? '';
  return Response.json({
    content,
    usage: {
      in: data.usageMetadata?.promptTokenCount ?? 0,
      out: data.usageMetadata?.candidatesTokenCount ?? 0,
    },
  });
}

async function streamGemini(key: string, payload: unknown): Promise<Response> {
  const url = `${BASE}/${MODEL}:streamGenerateContent?alt=sse&key=${key}`;

  let upstream: globalThis.Response | null = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    upstream = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (upstream.status !== 503) break;
    if (attempt < 2) await new Promise((r) => setTimeout(r, 600 * (attempt + 1)));
  }
  if (!upstream || !upstream.ok || !upstream.body) {
    const err = upstream ? await upstream.text() : 'no response';
    return new Response(`event: error\ndata: ${err}\n\n`, {
      status: 502,
      headers: { 'Content-Type': 'text/event-stream' },
    });
  }

  // Pipe upstream SSE → 我們自定義輕量 JSON-per-line 格式
  const reader = upstream.body.getReader();
  const decoder = new TextDecoder();
  let leftover = '';

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const enc = new TextEncoder();
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          leftover += decoder.decode(value, { stream: true });
          const lines = leftover.split('\n');
          leftover = lines.pop() ?? '';
          for (const line of lines) {
            if (!line.startsWith('data:')) continue;
            const data = line.slice(5).trim();
            if (!data) continue;
            try {
              const parsed = JSON.parse(data) as {
                candidates?: { content?: { parts?: { text?: string }[] } }[];
              };
              const text =
                parsed.candidates?.[0]?.content?.parts?.map((p) => p.text ?? '').join('') ?? '';
              if (text) {
                controller.enqueue(enc.encode(`data: ${JSON.stringify({ text })}\n\n`));
              }
            } catch {
              /* skip */
            }
          }
        }
        controller.enqueue(enc.encode('data: [DONE]\n\n'));
        controller.close();
      } catch (e) {
        controller.error(e);
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}
