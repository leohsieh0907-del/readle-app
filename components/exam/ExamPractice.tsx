'use client';

import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, RotateCcw, Volume2, Trophy } from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';
import { speak } from '@/lib/speech/tts';
import type { ExamQuestion } from '@/lib/exam/courses';

/** 簡單洗牌（不依賴 Math.random 的 seed 問題；這裡用 Fisher–Yates 即可）*/
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function ExamPractice({ questions, accent }: { questions: ExamQuestion[]; accent: string }) {
  const [round, setRound] = useState(0); // 換一批時 +1，觸發重洗
  const quiz = useMemo(() => shuffle(questions).slice(0, 10), [questions, round]);
  const [answers, setAnswers] = useState<Record<string, number>>({});

  const score = quiz.filter((q) => answers[q.id] === q.correctIndex).length;
  const allDone = Object.keys(answers).length >= quiz.length;

  const reset = (next = false) => {
    setAnswers({});
    if (next) setRound((r) => r + 1);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-sm text-[var(--color-text-tertiary)]">
          共 {quiz.length} 題 · 已作答 {Object.keys(answers).length}
        </div>
        <button type="button" onClick={() => reset(true)}
          className="inline-flex items-center gap-1.5 rounded-xl bg-white/60 px-3 py-1.5 text-xs font-medium ring-1 ring-inset ring-black/5 hover:bg-white/80">
          <RotateCcw size={12} /> 換一批題
        </button>
      </div>

      {quiz.map((q, qi) => {
        const picked = answers[q.id];
        const done = picked !== undefined;
        return (
          <GlassCard key={q.id} className="p-4">
            <div className="mb-2 flex items-start gap-2">
              <span className="mt-0.5 shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold text-white" style={{ background: accent }}>
                {q.tag}
              </span>
              <span className="flex-1 text-sm font-semibold leading-relaxed">{qi + 1}. {q.question}</span>
              <button type="button" onClick={() => speak({ text: q.question.replace(/_+/g, ' blank ') })}
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
                    onClick={() => !done && setAnswers((a) => ({ ...a, [q.id]: idx }))}
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
            {done && (
              <div className="mt-2 rounded-lg bg-[#5B5BF0]/8 px-3 py-2 text-xs text-[#5B5BF0] ring-1 ring-inset ring-[#5B5BF0]/15">
                💡 {q.explanation}
              </div>
            )}
          </GlassCard>
        );
      })}

      <AnimatePresence>
        {allDone && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            className="sticky bottom-4 flex items-center justify-between rounded-2xl bg-gradient-to-r from-[#7C7CFF]/15 to-[#5B5BF0]/10 p-4 shadow-card ring-1 ring-inset ring-[#5B5BF0]/20 backdrop-blur-md">
            <div className="flex items-center gap-3">
              <Trophy size={22} className="text-[#5B5BF0]" />
              <div>
                <div className="text-lg font-bold text-[#5B5BF0]">{score} / {quiz.length}</div>
                <div className="text-xs text-[var(--color-text-secondary)]">
                  {score === quiz.length ? '🎉 滿分！太強了' : score >= quiz.length * 0.6 ? '👍 不錯，繼續加油' : '多看課程再練一次'}
                </div>
              </div>
            </div>
            <button type="button" onClick={() => reset(true)}
              className="rounded-xl bg-[#5B5BF0] px-4 py-2 text-sm font-semibold text-white shadow-card transition hover:scale-[1.02]">
              再練一批
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
