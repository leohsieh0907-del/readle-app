'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, Volume2 } from 'lucide-react';
import { speak } from '@/lib/speech/tts';
import type { QuizQuestionRecord } from '@/lib/storage/quiz-actions';

interface QuestionCardProps {
  q: QuizQuestionRecord;
  index: number;
  total: number;
  onAnswer: (selected: number, timeSpentSec: number) => void;
}

export default function QuestionCard({ q, index, total, onAnswer }: QuestionCardProps) {
  const [selected, setSelected] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [startAt] = useState(() => Date.now());

  // 進場若有音檔自動播放
  useEffect(() => {
    if (q.audio) {
      const t = setTimeout(() => speak({ text: q.audio! }), 400);
      return () => clearTimeout(t);
    }
  }, [q.audio]);

  const handlePick = (idx: number) => {
    if (selected !== null) return;
    setSelected(idx);
    setRevealed(true);
    const dt = Math.round((Date.now() - startAt) / 1000);
    setTimeout(() => onAnswer(idx, dt), 1100);
  };

  const isShake = revealed && selected !== q.correctIndex;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={isShake ? { x: [-8, 8, -4, 4, 0] } : { opacity: 1, y: 0 }}
      transition={isShake ? { duration: 0.35 } : { duration: 0.3 }}
      className="glass-strong rounded-3xl p-6 sm:p-8"
    >
      <div className="flex items-center justify-between">
        <div className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)]">
          Q{index + 1} / {total}
        </div>
        {q.audio && (
          <button
            type="button"
            onClick={() => speak({ text: q.audio! })}
            className="flex h-9 items-center gap-1.5 rounded-full bg-[#5B5BF0]/10 px-3 text-sm font-medium text-[#5B5BF0] hover:bg-[#5B5BF0]/20"
          >
            <Volume2 size={14} /> 重播音檔
          </button>
        )}
      </div>

      <div className="mt-4 text-lg font-bold leading-snug sm:text-xl">{q.stem}</div>

      <div className="mt-5 space-y-2">
        {q.options.map((opt, i) => {
          const isCorrect = i === q.correctIndex;
          const isPicked = i === selected;
          let style = 'bg-white/50 ring-1 ring-inset ring-black/5 hover:bg-white/70';
          if (revealed) {
            if (isCorrect) style = 'bg-gradient-to-r from-[#4ADE80]/30 to-[#22C55E]/20 ring-2 ring-[#22C55E]';
            else if (isPicked) style = 'bg-gradient-to-r from-[#F87171]/30 to-[#EF4444]/20 ring-2 ring-[#EF4444]';
            else style = 'bg-white/30 ring-1 ring-inset ring-black/5 opacity-50';
          }
          return (
            <button
              key={i}
              type="button"
              onClick={() => handlePick(i)}
              disabled={revealed}
              className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3.5 text-left text-[15px] font-medium transition ${style}`}
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-black/[0.06] text-xs font-bold">
                {String.fromCharCode(65 + i)}
              </span>
              <span className="flex-1">{opt}</span>
              {revealed && isCorrect && <Check size={18} className="text-[#22C55E]" />}
              {revealed && isPicked && !isCorrect && <X size={18} className="text-[#EF4444]" />}
            </button>
          );
        })}
      </div>

      <AnimatePresence>
        {revealed && q.explanation && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 rounded-xl bg-[#5B5BF0]/8 p-3 text-sm leading-snug ring-1 ring-inset ring-[#5B5BF0]/15"
          >
            💡 {q.explanation}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
