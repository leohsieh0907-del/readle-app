'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, Sparkles, Send, Mic, X, Plus, Volume2, VolumeX, MicOff } from 'lucide-react';
import { getGreeting, getMockReply } from './mock-replies';
import { getProvider } from '@/lib/ai';
import { lunaTutorPrompt } from '@/lib/ai/prompts';
import { bumpQuota } from '@/lib/ai/provider';
import { speak, stopSpeaking } from '@/lib/speech/tts';
import { extractEnglish, hasEnglish } from '@/lib/speech/extract';
import { settingsRepo } from '@/lib/storage/repos';
import { isRecognitionAvailable, recognize } from '@/lib/speech/score';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  quickReplies?: string[];
  streaming?: boolean;
}

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

type MicState = 'idle' | 'listening' | 'processing';

export default function AITutor() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [micState, setMicState] = useState<MicState>('idle');
  const [autoTTS, setAutoTTS] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // 載入 autoTTS 設定
  useEffect(() => {
    setAutoTTS(settingsRepo.get().ai.autoTTS);
  }, []);

  const toggleAutoTTS = () => {
    const next = !autoTTS;
    setAutoTTS(next);
    settingsRepo.update((s) => ({ ...s, ai: { ...s.ai, autoTTS: next } }));
    if (!next) stopSpeaking();
  };

  // 朗讀只挑英文片段，避免中文用英文 voice 念
  const speakSmart = (text: string) => {
    const en = extractEnglish(text);
    if (en.length >= 3) speak({ text: en });
  };

  useEffect(() => {
    if (open && messages.length === 0) {
      const g = getGreeting();
      setMessages([
        {
          id: uid(),
          role: 'assistant',
          content: g.content,
          quickReplies: g.quickReplies,
        },
      ]);
    }
  }, [open, messages.length]);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: 'smooth',
    });
  }, [messages]);

  // 鍵盤 Cmd/Ctrl+K 開關
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen((v) => !v);
      }
      if (e.key === 'Escape' && open) setOpen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open]);

  /** 語音輸入 — 按麥克風後說話，說完自動傳給 Luna */
  const startVoice = async () => {
    if (micState !== 'idle' || busy) return;
    if (!isRecognitionAvailable()) {
      alert('你的瀏覽器不支援語音辨識，請使用 Chrome 或 Edge');
      return;
    }
    setMicState('listening');
    try {
      // 辨識中英文（設 zh-TW 讓使用者也可說中文問問題）
      const { transcript } = await recognize({ lang: 'zh-TW', timeoutMs: 12000 });
      setMicState('processing');
      if (transcript.trim()) {
        setInput(transcript.trim());
        // 短暫讓使用者看到辨識結果後自動送出
        await new Promise((r) => setTimeout(r, 300));
        await send(transcript.trim());
      }
    } catch {
      /* 使用者沒說話或瀏覽器拒絕麥克風 */
    } finally {
      setMicState('idle');
      setInput('');
    }
  };

  const send = async (text: string) => {
    if (!text.trim() || busy) return;
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
    const history = [
      ...messages
        .filter((m) => !m.streaming)
        .map((m) => ({ role: m.role, content: m.content })),
      { role: 'user' as const, content: text },
    ];

    try {
      if (provider.chatStream) {
        let acc = '';
        for await (const chunk of provider.chatStream({
          messages: history,
          systemPrompt: lunaTutorPrompt(),
        })) {
          acc += chunk;
          setMessages((prev) =>
            prev.map((m) => (m.id === assistantId ? { ...m, content: acc } : m)),
          );
        }
        // 從 mock 撈 quick replies（真 Gemini 模式 quickReplies 為空，使用者直接打字）
        const mockHints = getMockReply(text);
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? { ...m, streaming: false, quickReplies: provider.name === 'mock' ? mockHints.quickReplies : undefined }
              : m,
          ),
        );
        if (autoTTS) speakSmart(acc);
      } else {
        const res = await provider.chat({
          messages: history,
          systemPrompt: lunaTutorPrompt(),
        });
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId ? { ...m, content: res.content, streaming: false } : m,
          ),
        );
        if (autoTTS) speakSmart(res.content);
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'AI 暫時離線';
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId
            ? { ...m, content: `⚠️ ${msg}\n（自動降回 Mock 模式）`, streaming: false }
            : m,
        ),
      );
    }
    setBusy(false);
  };

  return (
    <>
      {/* 浮動按鈕 */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`fixed bottom-20 right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-[#7C7CFF] to-[#5B5BF0] text-white shadow-hover transition lg:bottom-6 lg:right-6 ${
          open ? 'scale-0 opacity-0' : 'anim-pulse-glow hover:scale-110'
        }`}
        aria-label="開啟 AI 助教"
      >
        <Bot size={26} strokeWidth={2} />
      </button>

      {/* 對話面板 */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
              onClick={() => setOpen(false)}
            />

            <motion.aside
              initial={{ x: '100%', opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: '100%', opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
              className="fixed inset-x-0 bottom-0 z-50 flex h-[88vh] flex-col rounded-t-3xl bg-white shadow-[0_-8px_48px_rgba(0,0,0,0.12)] sm:inset-x-auto sm:right-4 sm:bottom-4 sm:top-4 sm:h-auto sm:w-[420px] sm:rounded-3xl sm:shadow-[0_8px_48px_rgba(15,15,25,0.18)]"
            >
              {/* Header */}
              <header className="flex items-center justify-between border-b border-black/5 px-5 py-4">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-[#7C7CFF] to-[#5B5BF0] text-white shadow-card">
                      <Sparkles size={18} strokeWidth={2.5} />
                    </div>
                    <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white bg-[#4ADE80]" />
                  </div>
                  <div>
                    <div className="text-[15px] font-bold">Luna</div>
                    <div className="text-xs text-[var(--color-text-tertiary)]">
                      AI 英語助教 · 線上
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={toggleAutoTTS}
                    className={`rounded-full p-2 transition ${
                      autoTTS
                        ? 'bg-[#5B5BF0]/15 text-[#5B5BF0]'
                        : 'text-[var(--color-text-secondary)] hover:bg-black/5'
                    }`}
                    title={autoTTS ? 'Luna 自動朗讀英文（開）' : 'Luna 自動朗讀英文（關）'}
                  >
                    {autoTTS ? <Volume2 size={16} /> : <VolumeX size={16} />}
                  </button>
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="rounded-full p-2 text-[var(--color-text-secondary)] hover:bg-black/5"
                  >
                    <X size={18} />
                  </button>
                </div>
              </header>

              {/* Messages */}
              <div
                ref={scrollRef}
                className="flex-1 space-y-4 overflow-y-auto px-4 py-5"
              >
                {messages.map((m) => (
                  <MessageBubble
                    key={m.id}
                    message={m}
                    onQuickReply={(t) => send(t)}
                    onSpeak={() => speakSmart(m.content)}
                  />
                ))}
              </div>

              {/* Input */}
              <div className="border-t border-black/5 p-3">
                <div className="flex items-end gap-2 rounded-2xl bg-[#F5F5FA] p-2 ring-1 ring-inset ring-black/8">
                  {/* 語音輸入按鈕 */}
                  <button
                    type="button"
                    onClick={startVoice}
                    disabled={busy}
                    title={
                      micState === 'idle' ? '點擊說話' :
                      micState === 'listening' ? '聆聽中…' : '辨識中…'
                    }
                    className={`relative rounded-xl p-2 transition ${
                      micState === 'idle'
                        ? 'text-[var(--color-text-tertiary)] hover:bg-black/5 hover:text-[#5B5BF0]'
                        : micState === 'listening'
                        ? 'bg-[#F87171]/20 text-[#EF4444]'
                        : 'bg-[#5B5BF0]/15 text-[#5B5BF0]'
                    }`}
                  >
                    {micState === 'listening' ? (
                      <span className="relative flex h-[18px] w-[18px] items-center justify-center">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#EF4444] opacity-40" />
                        <Mic size={14} />
                      </span>
                    ) : micState === 'processing' ? (
                      <MicOff size={18} className="animate-pulse" />
                    ) : (
                      <Mic size={18} />
                    )}
                  </button>
                  <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        send(input);
                      }
                    }}
                    placeholder={
                      micState === 'listening' ? '🎙 聆聽中，請說話…' :
                      micState === 'processing' ? '⏳ 辨識中…' :
                      '輸入或按 🎙 說話…'
                    }
                    readOnly={micState !== 'idle'}
                    rows={1}
                    className="max-h-32 flex-1 resize-none bg-transparent px-1 py-1.5 text-[15px] outline-none placeholder:text-[var(--color-text-tertiary)]"
                  />
                  <button
                    type="button"
                    onClick={() => send(input)}
                    disabled={!input.trim() || busy}
                    className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#7C7CFF] to-[#5B5BF0] text-white shadow-card transition hover:scale-105 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:scale-100"
                  >
                    <Send size={15} />
                  </button>
                </div>
                <p className="mt-2 text-center text-[10px] text-[var(--color-text-tertiary)]">
                  ⌘K 呼叫 · 🎙 說話傳訊 · {autoTTS ? '🔊 自動朗讀' : '🔇 文字模式'}
                </p>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

function MessageBubble({
  message,
  onQuickReply,
  onSpeak,
}: {
  message: Message;
  onQuickReply: (text: string) => void;
  onSpeak: () => void;
}) {
  const isUser = message.role === 'user';
  const [playing, setPlaying] = useState(false);

  // 抽出英文部分，用 Gemini TTS 朗讀（真人聲音）
  const handleSpeak = async () => {
    if (playing) {
      stopSpeaking();
      setPlaying(false);
      return;
    }
    const enText = extractEnglish(message.content);
    if (!enText || enText.length < 3) return;
    setPlaying(true);
    try {
      // 優先用後端 Gemini TTS
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: enText }),
      });
      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);
        audio.onended = () => { setPlaying(false); URL.revokeObjectURL(url); };
        audio.onerror = () => { setPlaying(false); speak({ text: enText }); };
        await audio.play();
        return;
      }
    } catch { /* fall through */ }
    // 後備：Web Speech API
    speak({ text: enText });
    setPlaying(false);
  };

  const canSpeak = !isUser && !message.streaming && hasEnglish(message.content);

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
      <div className={`max-w-[78%] ${isUser ? 'order-1' : ''}`}>
        <div
          className={`whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-[14.5px] leading-relaxed ${
            isUser
              ? 'bg-gradient-to-br from-[#7C7CFF] to-[#5B5BF0] text-white shadow-card'
              : 'bg-[#F5F5FA] text-[var(--color-text-primary)] ring-1 ring-inset ring-black/8'
          }`}
        >
          {message.content}
          {message.streaming && (
            <span className="ml-0.5 inline-block h-3 w-1 animate-pulse bg-current align-middle" />
          )}
        </div>

        {/* 發音按鈕 + Quick replies */}
        {!message.streaming && (
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            {canSpeak && (
              <button
                type="button"
                onClick={handleSpeak}
                className={`inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-xs font-semibold transition ${
                  playing
                    ? 'bg-[#5B5BF0] text-white shadow-card'
                    : 'bg-[#5B5BF0]/12 text-[#5B5BF0] hover:bg-[#5B5BF0]/25'
                }`}
                title={playing ? '停止播放' : '朗讀英文部分（Gemini 真人聲音）'}
              >
                {playing ? (
                  <>
                    <span className="flex items-end gap-[2px] h-3">
                      {[0,1,2].map(i => (
                        <span
                          key={i}
                          className="w-[3px] rounded-full bg-white animate-bounce"
                          style={{ height: `${8 + i * 3}px`, animationDelay: `${i * 0.15}s` }}
                        />
                      ))}
                    </span>
                    播放中
                  </>
                ) : (
                  <>
                    <Volume2 size={13} /> 聽發音
                  </>
                )}
              </button>
            )}
            {message.quickReplies?.map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => onQuickReply(q)}
                className="rounded-full border border-[#5B5BF0]/25 bg-[#5B5BF0]/8 px-3 py-1 text-xs font-medium text-[#5B5BF0] transition hover:bg-[#5B5BF0]/15"
              >
                {q}
              </button>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}
