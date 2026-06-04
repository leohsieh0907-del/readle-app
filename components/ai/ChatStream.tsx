'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Send, User, Volume2 } from 'lucide-react';
import { getProvider } from '@/lib/ai';
import type { ChatMessage } from '@/lib/ai';
import { speak } from '@/lib/speech/tts';
import { bumpQuota } from '@/lib/ai/provider';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  streaming?: boolean;
}

interface ChatStreamProps {
  systemPrompt: string;
  greeting?: string;
  placeholder?: string;
  ttsAssistant?: boolean;
}

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

export default function ChatStream({
  systemPrompt,
  greeting,
  placeholder = '輸入訊息…',
  ttsAssistant = false,
}: ChatStreamProps) {
  const [messages, setMessages] = useState<Message[]>(() =>
    greeting
      ? [{ id: uid(), role: 'assistant', content: greeting }]
      : [],
  );
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const send = async () => {
    const text = input.trim();
    if (!text || busy) return;
    const userMsg: Message = { id: uid(), role: 'user', content: text };
    const assistantId = uid();
    setMessages((prev) => [
      ...prev,
      userMsg,
      { id: assistantId, role: 'assistant', content: '', streaming: true },
    ]);
    setInput('');
    setBusy(true);
    bumpQuota();

    const provider = getProvider();
    const history: ChatMessage[] = [
      ...messages.map((m) => ({
        role: (m.role === 'assistant' ? 'assistant' : 'user') as 'assistant' | 'user',
        content: m.content,
      })),
      { role: 'user', content: text },
    ];

    try {
      if (provider.chatStream) {
        let acc = '';
        for await (const chunk of provider.chatStream({
          messages: history,
          systemPrompt,
        })) {
          acc += chunk;
          setMessages((prev) =>
            prev.map((m) => (m.id === assistantId ? { ...m, content: acc } : m)),
          );
        }
        setMessages((prev) =>
          prev.map((m) => (m.id === assistantId ? { ...m, streaming: false } : m)),
        );
        if (ttsAssistant) speak({ text: acc });
      } else {
        const res = await provider.chat({ messages: history, systemPrompt });
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId ? { ...m, content: res.content, streaming: false } : m,
          ),
        );
        if (ttsAssistant) speak({ text: res.content });
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : '發生錯誤';
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId
            ? { ...m, content: `⚠️ ${msg}\n（已自動切到 Mock 模式，請到設定檢查）`, streaming: false }
            : m,
        ),
      );
    }
    setBusy(false);
  };

  return (
    <div className="flex h-[70vh] flex-col gap-3">
      <div
        ref={scrollRef}
        className="glass-card flex-1 space-y-4 overflow-y-auto rounded-2xl p-5"
      >
        {messages.length === 0 && (
          <div className="flex h-full items-center justify-center text-sm text-[var(--color-text-tertiary)]">
            開始對話吧
          </div>
        )}
        {messages.map((m) => (
          <Bubble key={m.id} m={m} ttsAssistant={ttsAssistant} />
        ))}
      </div>

      <div className="flex items-end gap-2 rounded-2xl bg-white/60 p-2 ring-1 ring-inset ring-black/5">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
          placeholder={placeholder}
          rows={1}
          className="max-h-32 flex-1 resize-none bg-transparent px-3 py-2 text-[15px] outline-none placeholder:text-[var(--color-text-tertiary)]"
        />
        <button
          type="button"
          onClick={send}
          disabled={!input.trim() || busy}
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#7C7CFF] to-[#5B5BF0] text-white shadow-card transition hover:scale-105 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:scale-100"
        >
          <Send size={16} />
        </button>
      </div>
    </div>
  );
}

function Bubble({ m, ttsAssistant }: { m: Message; ttsAssistant: boolean }) {
  const isUser = m.role === 'user';
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex gap-2 ${isUser ? 'justify-end' : 'justify-start'}`}
    >
      {!isUser && (
        <div className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#7C7CFF] to-[#5B5BF0] text-white">
          <Sparkles size={13} />
        </div>
      )}
      <div className={`max-w-[80%] ${isUser ? 'order-1' : ''}`}>
        <div
          className={`whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-[14.5px] leading-relaxed ${
            isUser
              ? 'bg-gradient-to-br from-[#7C7CFF] to-[#5B5BF0] text-white shadow-card'
              : 'bg-white/70 text-[var(--color-text-primary)] ring-1 ring-inset ring-black/5'
          }`}
        >
          {m.content}
          {m.streaming && (
            <span className="ml-0.5 inline-block h-3 w-1 animate-pulse bg-current align-middle" />
          )}
        </div>
        {!isUser && !m.streaming && ttsAssistant && m.content && (
          <button
            type="button"
            onClick={() => speak({ text: m.content })}
            className="mt-1 inline-flex items-center gap-1 rounded-full bg-[#5B5BF0]/10 px-2 py-0.5 text-[10px] text-[#5B5BF0] hover:bg-[#5B5BF0]/20"
          >
            <Volume2 size={10} /> 朗讀
          </button>
        )}
      </div>
      {isUser && (
        <div className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-white/60 ring-1 ring-inset ring-black/5">
          <User size={13} />
        </div>
      )}
    </motion.div>
  );
}
