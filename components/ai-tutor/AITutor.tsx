'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, Sparkles, Send, Mic, X, Plus, Volume2, VolumeX, MicOff, Phone, PhoneOff } from 'lucide-react';
import { getGreeting, getMockReply } from './mock-replies';
import { getProvider } from '@/lib/ai';
import { lunaTutorPrompt } from '@/lib/ai/prompts';
import { bumpQuota } from '@/lib/ai/provider';
import { speak, speakNatural, stopSpeaking } from '@/lib/speech/tts';
import { extractEnglish, hasEnglish } from '@/lib/speech/extract';
import { settingsRepo } from '@/lib/storage/repos';
import { isRecognitionAvailable, recognize } from '@/lib/speech/score';
import LunaFace from './LunaFace';

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
type CallPhase = 'listening' | 'thinking' | 'speaking';

export default function AITutor() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [micState, setMicState] = useState<MicState>('idle');
  const [autoTTS, setAutoTTS] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // 語音通話模式（雙向對話）
  const [callMode, setCallMode] = useState(false);
  const [callPhase, setCallPhase] = useState<CallPhase>('listening');
  const [callHeard, setCallHeard] = useState('');     // 最近聽到的使用者語句
  const [callReply, setCallReply] = useState('');      // Luna 最近的回覆
  const callRef = useRef(false);                       // 控制迴圈是否繼續
  const messagesRef = useRef<Message[]>([]);
  useEffect(() => { messagesRef.current = messages; }, [messages]);

  // Luna 語音速度（母語自然發音，可調速）
  const SPEEDS = [0.7, 0.85, 1.0, 1.15, 1.3];
  const [speed, setSpeed] = useState(1.0);
  const speedRef = useRef(1.0);
  useEffect(() => {
    const saved = typeof window !== 'undefined' ? Number(localStorage.getItem('readle.luna_speed')) : NaN;
    if (SPEEDS.includes(saved)) { setSpeed(saved); speedRef.current = saved; }
  }, []);
  const changeSpeed = (delta: 1 | -1) => {
    const idx = SPEEDS.indexOf(speed);
    const next = SPEEDS[Math.max(0, Math.min(SPEEDS.length - 1, idx + delta))];
    setSpeed(next);
    speedRef.current = next;
    if (typeof window !== 'undefined') localStorage.setItem('readle.luna_speed', String(next));
  };
  const speakLuna = (text: string) => speakNatural({ text, rate: speedRef.current });

  // 元件卸載時，停止通話迴圈與發音（避免背景持續錄音/播放）
  useEffect(() => () => { callRef.current = false; stopSpeaking(); }, []);

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

  // ─── 語音通話模式：聽 → 想 → 說 → 自動再聽 ────────────────
  const startCall = () => {
    if (callRef.current) return;
    if (!isRecognitionAvailable()) {
      alert('你的瀏覽器不支援語音辨識，請使用 Chrome 或 Edge');
      return;
    }
    stopSpeaking();
    callRef.current = true;
    setCallMode(true);
    setCallHeard('');
    setCallReply('');
    bumpQuota();
    runCallLoop();
  };

  const endCall = () => {
    callRef.current = false;
    setCallMode(false);
    stopSpeaking();
  };

  /** 取得 Luna 回覆（通話模式：簡短口語） */
  const askLuna = async (userText: string): Promise<string> => {
    const provider = getProvider();
    const history = [
      ...messagesRef.current
        .filter((m) => !m.streaming)
        .map((m) => ({ role: m.role, content: m.content })),
      { role: 'user' as const, content: userText },
    ];
    const systemPrompt =
      lunaTutorPrompt() +
      `\n\n[語音對話模式 — 嚴格規則]
你正在跟學生「講電話」。回覆必須：
1. 極短：1 句英文，最多 20 個字。
2. 純對話，像朋友聊天，結尾常帶一個簡短問句延續對話。
3. 絕對不要：列點、星號、編號、中文翻譯、長篇解釋、給選項清單。
範例好回覆：「That sounds great! What did you eat?」
範例壞回覆：列出一堆句型或解釋文法。
保持自然、簡短、口語。`;
    try {
      const res = await provider.chat({ messages: history, systemPrompt });
      return res.content;
    } catch {
      return "Sorry, I didn't catch that. Could you say it again?";
    }
  };

  const runCallLoop = async () => {
    // 開場白
    if (callRef.current) {
      const opener = "Hi! I'm Luna. What would you like to talk about today?";
      setCallReply(opener);
      setCallPhase('speaking');
      setMessages((prev) => [...prev, { id: uid(), role: 'assistant', content: opener }]);
      await speakLuna(opener);
    }

    while (callRef.current) {
      // 1. 聽
      setCallPhase('listening');
      setCallHeard('');
      let transcript = '';
      try {
        const r = await recognize({ lang: 'en-US', timeoutMs: 12000 });
        transcript = r.transcript.trim();
      } catch (e) {
        // 麥克風被拒 → 結束通話，不要無限重試
        const msg = e instanceof Error ? e.message : '';
        if (/not-allowed|denied|service-not-allowed/i.test(msg)) {
          alert('需要麥克風權限才能語音通話，請在瀏覽器允許後再試');
          endCall();
          break;
        }
      }
      if (!callRef.current) break;
      if (!transcript) {
        await new Promise((r) => setTimeout(r, 600)); // 避免空轉，喘口氣再聽
        continue;
      }

      setCallHeard(transcript);
      setMessages((prev) => [...prev, { id: uid(), role: 'user', content: transcript }]);

      // 2. 想
      setCallPhase('thinking');
      const reply = await askLuna(transcript);
      if (!callRef.current) break;
      setCallReply(reply);
      setMessages((prev) => [...prev, { id: uid(), role: 'assistant', content: reply }]);

      // 3. 說（唸完才換使用者）
      setCallPhase('speaking');
      const en = extractEnglish(reply);
      await speakLuna(en.length >= 3 ? en : reply);
      if (!callRef.current) break;

      await new Promise((r) => setTimeout(r, 350));
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
                  {/* 語音通話模式 */}
                  <button
                    type="button"
                    onClick={callMode ? endCall : startCall}
                    className={`rounded-full p-2 transition ${
                      callMode
                        ? 'bg-[#EF4444] text-white'
                        : 'bg-[#4ADE80]/15 text-[#15803d] hover:bg-[#4ADE80]/25'
                    }`}
                    title={callMode ? '結束通話' : '語音通話（跟 Luna 用講的對話）'}
                  >
                    {callMode ? <PhoneOff size={16} /> : <Phone size={16} />}
                  </button>
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
                    onClick={() => { endCall(); setOpen(false); }}
                    className="rounded-full p-2 text-[var(--color-text-secondary)] hover:bg-black/5"
                  >
                    <X size={18} />
                  </button>
                </div>
              </header>

              {/* 語音通話覆蓋層 */}
              <AnimatePresence>
                {callMode && (
                  <CallOverlay
                    phase={callPhase}
                    heard={callHeard}
                    reply={callReply}
                    onHangup={endCall}
                    speed={speed}
                    onSlower={() => changeSpeed(-1)}
                    onFaster={() => changeSpeed(1)}
                  />
                )}
              </AnimatePresence>

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

function CallOverlay({
  phase,
  heard,
  reply,
  onHangup,
  speed,
  onSlower,
  onFaster,
}: {
  phase: CallPhase;
  heard: string;
  reply: string;
  onHangup: () => void;
  speed: number;
  onSlower: () => void;
  onFaster: () => void;
}) {
  const cfg = {
    listening: { label: '聆聽中…請說話', sub: '用英文跟 Luna 說說看', color: '#EF4444', ring: 'bg-[#EF4444]' },
    thinking: { label: 'Luna 思考中…', sub: '正在組織回覆', color: '#F59E0B', ring: 'bg-[#F59E0B]' },
    speaking: { label: 'Luna 說話中…', sub: '仔細聽她怎麼說', color: '#5B5BF0', ring: 'bg-[#5B5BF0]' },
  }[phase];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-10 flex flex-col items-center justify-between bg-white px-6 py-10"
    >
      {/* 標題 + 語音模式開關 */}
      <div className="flex flex-col items-center gap-3">
        <div className="text-center">
          <div className="text-sm font-bold text-[var(--color-text-secondary)]">語音通話中</div>
          <div className="mt-1 text-xs text-[var(--color-text-tertiary)]">跟 Luna 用講的對話 · 全程免打字</div>
        </div>
        {/* 語速調節 */}
        <div className="flex items-center gap-2 rounded-full bg-[#F5F5FA] px-2 py-1 ring-1 ring-inset ring-black/8">
          <span className="pl-1 text-xs text-[var(--color-text-tertiary)]">語速</span>
          <button type="button" onClick={onSlower} disabled={speed <= 0.7}
            className="flex h-7 w-7 items-center justify-center rounded-full text-[var(--color-text-secondary)] hover:bg-black/5 disabled:opacity-30"
            title="放慢">
            🐢
          </button>
          <span className="min-w-[44px] text-center font-mono text-sm font-bold text-[#5B5BF0]">{speed.toFixed(2)}x</span>
          <button type="button" onClick={onFaster} disabled={speed >= 1.3}
            className="flex h-7 w-7 items-center justify-center rounded-full text-[var(--color-text-secondary)] hover:bg-black/5 disabled:opacity-30"
            title="加快">
            🐇
          </button>
        </div>
      </div>

      {/* 中央動畫球 */}
      <div className="flex flex-col items-center gap-6">
        <div className="relative flex h-44 w-44 items-center justify-center">
          {/* 外圈脈動 */}
          {(phase === 'listening' || phase === 'speaking') && (
            <>
              <span className={`absolute inline-flex h-40 w-40 animate-ping rounded-full ${cfg.ring} opacity-15`} />
              <span className={`absolute inline-flex h-32 w-32 animate-ping rounded-full ${cfg.ring} opacity-20`} style={{ animationDelay: '0.4s' }} />
            </>
          )}
          {/* Luna 人像（會動嘴型、眨眼，看口型學發音） */}
          <div className="relative z-10 drop-shadow-[0_8px_24px_rgba(91,91,240,0.4)]">
            <LunaFace phase={phase} text={reply} rate={speed} size={172} />
          </div>
        </div>

        <div className="text-center">
          <div className="text-lg font-bold" style={{ color: cfg.color }}>{cfg.label}</div>
          <div className="mt-1 text-xs text-[var(--color-text-tertiary)]">{cfg.sub}</div>
        </div>

        {/* 最近對話 */}
        <div className="min-h-[60px] w-full max-w-[300px] space-y-2 text-center">
          {heard && (
            <div className="rounded-2xl bg-[#5B5BF0]/10 px-3 py-2 text-sm text-[#5B5BF0]">
              你：{heard}
            </div>
          )}
          {reply && phase !== 'thinking' && (
            <div className="rounded-2xl bg-[#F5F5FA] px-3 py-2 text-sm text-[var(--color-text-primary)] ring-1 ring-inset ring-black/5">
              {reply}
            </div>
          )}
        </div>
      </div>

      {/* 掛斷 */}
      <button
        type="button"
        onClick={onHangup}
        className="flex h-16 w-16 items-center justify-center rounded-full bg-[#EF4444] text-white shadow-hover transition hover:scale-105"
        title="結束通話"
      >
        <PhoneOff size={26} />
      </button>
    </motion.div>
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

  // 抽出英文部分，走全站語音模組（Edge 神經語音）
  const handleSpeak = async () => {
    if (playing) {
      stopSpeaking();
      setPlaying(false);
      return;
    }
    const enText = extractEnglish(message.content);
    if (!enText || enText.length < 3) return;
    setPlaying(true);
    await speakNatural({ text: enText });
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
