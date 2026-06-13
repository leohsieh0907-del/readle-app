'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Loader2, Check, X, RotateCcw, ChevronDown, Volume2 } from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';
import { speak } from '@/lib/speech/tts';

interface Question {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

interface ArticleQuizAIProps {
  articleText: string; // 全文（段落合併）
  level: string;
}

export default function ArticleQuizAI({ articleText, level }: ArticleQuizAIProps) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [generating, setGenerating] = useState(false);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [open, setOpen] = useState(false);
  const [error, setError] = useState('');

  const generate = async () => {
    setGenerating(true);
    setError('');
    setAnswers({});
    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{
            role: 'user',
            content: `根據以下英文文章，出 3 道閱讀理解題（${level} 程度），題型多樣（主旨/細節/推論）。

文章：
${articleText.slice(0, 2000)}

回傳 JSON 陣列，每題格式：
{"question":"問題","options":["A","B","C","D"],"correctIndex":0,"explanation":"為什麼這個是正確答案的說明（繁體中文）"}

只輸出 JSON 陣列，不要其他說明。`,
          }],
          temperature: 0.5,
          maxTokens: 2000,
          jsonMode: true,
        }),
      });
      const data = await res.json() as { content?: string };
      const text = (data.content ?? '').trim();
      // 抽取 JSON array
      const m = text.match(/\[[\s\S]*\]/);
      if (!m) throw new Error('no json');
      const parsed = JSON.parse(m[0]) as Question[];
      if (!Array.isArray(parsed) || parsed.length === 0) throw new Error('empty');
      setQuestions(parsed.slice(0, 3));
      setOpen(true);
    } catch {
      setError('生成失敗，請稍後再試');
    }
    setGenerating(false);
  };

  const score = questions.filter((_, i) => answers[i] === questions[i]?.correctIndex).length;
  const allAnswered = questions.length > 0 && Object.keys(answers).length >= questions.length;

  return (
    <GlassCard className="p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles size={15} className="text-[#5B5BF0]" />
          <span className="font-bold">AI 出更多題</span>
          <span className="text-xs text-[var(--color-text-tertiary)]">每次都不一樣</span>
        </div>
        <div className="flex items-center gap-2">
          {questions.length > 0 && !generating && (
            <button type="button" onClick={() => setOpen(v => !v)}
              className="text-xs text-[var(--color-text-tertiary)] hover:text-[#5B5BF0]">
              {open ? '收起' : `查看 ${questions.length} 題`}
              <ChevronDown size={13} className={`inline ml-1 transition-transform ${open ? 'rotate-180' : ''}`} />
            </button>
          )}
          <button type="button" onClick={generate} disabled={generating}
            className={`inline-flex h-9 items-center gap-1.5 rounded-xl px-3.5 text-sm font-medium transition ${
              generating
                ? 'bg-[#5B5BF0]/10 text-[#5B5BF0]'
                : 'btn-primary'
            } disabled:opacity-70`}>
            {generating ? (
              <><Loader2 size={14} className="animate-spin" /> 生成中…</>
            ) : (
              <><Sparkles size={14} /> {questions.length > 0 ? '再出一組' : '開始出題'}</>
            )}
          </button>
        </div>
      </div>
      {error && <p className="mt-2 text-xs text-[#F87171]">{error}</p>}

      <AnimatePresence>
        {open && questions.length > 0 && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <div className="mt-4 space-y-5">
              {questions.map((q, qi) => {
                const picked = answers[qi];
                const done = picked !== undefined;
                return (
                  <div key={qi}>
                    <div className="mb-2 flex items-start gap-1.5 text-sm font-semibold">
                      <span className="mt-0.5 shrink-0 rounded bg-[#5B5BF0]/10 px-1.5 py-0.5 text-[10px] font-bold text-[#5B5BF0]">
                        Q{qi + 1}
                      </span>
                      <span className="flex-1">{q.question}</span>
                      <button type="button" onClick={() => speak({ text: q.question })}
                        className="shrink-0 rounded-full p-1 text-[var(--color-text-tertiary)] hover:bg-[#5B5BF0]/10 hover:text-[#5B5BF0]"
                        title="聽題目">
                        <Volume2 size={13} />
                      </button>
                    </div>
                    <div className="space-y-1.5">
                      {q.options.map((opt, idx) => {
                        const isCorrect = idx === q.correctIndex;
                        const isPicked = picked === idx;
                        let cls = 'bg-white/50 ring-1 ring-inset ring-black/5 hover:bg-white/70';
                        if (done) {
                          if (isCorrect) cls = 'bg-[#4ADE80]/15 ring-2 ring-[#4ADE80]';
                          else if (isPicked) cls = 'bg-[#F87171]/15 ring-2 ring-[#F87171]';
                          else cls = 'bg-white/30 ring-1 ring-inset ring-black/5 opacity-50';
                        }
                        return (
                          <button key={idx} type="button"
                            onClick={() => !done && setAnswers(a => ({ ...a, [qi]: idx }))}
                            disabled={done}
                            className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm transition ${cls}`}>
                            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-black/[0.05] text-xs font-bold">
                              {String.fromCharCode(65 + idx)}
                            </span>
                            {opt}
                            {done && isCorrect && <Check size={14} className="ml-auto text-[#15803d]" />}
                            {done && isPicked && !isCorrect && <X size={14} className="ml-auto text-[#b91c1c]" />}
                          </button>
                        );
                      })}
                    </div>
                    {done && q.explanation && (
                      <div className="mt-1.5 rounded-lg bg-[#5B5BF0]/8 px-3 py-2 text-xs text-[#5B5BF0] ring-1 ring-inset ring-[#5B5BF0]/15">
                        💡 {q.explanation}
                      </div>
                    )}
                  </div>
                );
              })}

              {allAnswered && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  className="flex items-center justify-between rounded-2xl bg-gradient-to-r from-[#7C7CFF]/10 to-[#5B5BF0]/5 p-4 ring-1 ring-inset ring-[#5B5BF0]/20">
                  <div>
                    <div className="text-lg font-bold text-[#5B5BF0]">{score} / {questions.length}</div>
                    <div className="text-xs text-[var(--color-text-secondary)]">
                      {score === questions.length ? '🎉 全對！' : score > 0 ? '👍 不錯！' : '再讀一次試試'}
                    </div>
                  </div>
                  <button type="button" onClick={() => setAnswers({})}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-white/60 px-3 py-1.5 text-xs font-medium ring-1 ring-inset ring-black/5 hover:bg-white/80">
                    <RotateCcw size={12} /> 重試
                  </button>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </GlassCard>
  );
}
