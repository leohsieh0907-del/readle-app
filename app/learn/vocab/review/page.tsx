'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Volume2, Check, RotateCcw } from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';
import ProgressBar from '@/components/ui/ProgressBar';
import SoftButton from '@/components/ui/SoftButton';
import { vocabRepo } from '@/lib/storage/repos';
import { getDueWordIds, type SRSResponse } from '@/lib/srs/sm2';
import { markReview } from '@/lib/storage/vocab-actions';
import { speak } from '@/lib/speech/tts';
import type { VocabEntry } from '@/lib/readle-types';

const responses: { id: SRSResponse; label: string; sub: string; color: string }[] = [
  { id: 'forgot', label: '忘了', sub: '<1d', color: 'from-[#F87171] to-[#EF4444]' },
  { id: 'vague', label: '模糊', sub: '~2d', color: 'from-[#FBBF24] to-[#F59E0B]' },
  { id: 'remember', label: '記得', sub: '~5d', color: 'from-[#4ADE80] to-[#22C55E]' },
  { id: 'easy', label: '太簡單', sub: '~10d', color: 'from-[#06B6D4] to-[#0891B2]' },
];

interface RoundStat {
  correct: number;
  vague: number;
  forgot: number;
}

export default function ReviewPage() {
  const [dueIds, setDueIds] = useState<string[]>([]);
  const [entries, setEntries] = useState<Record<string, VocabEntry>>({});
  const [idx, setIdx] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [stat, setStat] = useState<RoundStat>({ correct: 0, vague: 0, forgot: 0 });
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    const s = vocabRepo.get();
    setEntries(s.entries);
    setDueIds(getDueWordIds(s.entries));
  }, []);

  const total = dueIds.length;
  const current: VocabEntry | undefined = entries[dueIds[idx]];

  const handleAnswer = (resp: SRSResponse) => {
    if (!current) return;
    const updated = markReview(current.id, resp);
    if (updated) setEntries((e) => ({ ...e, [updated.id]: updated }));

    setStat((s) => ({
      correct: s.correct + (resp === 'remember' || resp === 'easy' ? 1 : 0),
      vague: s.vague + (resp === 'vague' ? 1 : 0),
      forgot: s.forgot + (resp === 'forgot' ? 1 : 0),
    }));

    setRevealed(false);
    if (idx + 1 >= total) {
      setFinished(true);
    } else {
      setIdx((i) => i + 1);
    }
  };

  if (total === 0) {
    return (
      <EmptyState />
    );
  }

  if (finished) {
    return <FinishedScreen total={total} stat={stat} />;
  }

  if (!current) return null;

  const progress = ((idx + 1) / total) * 100;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Link
          href="/learn/vocab"
          className="inline-flex items-center gap-1 text-sm text-[var(--color-text-secondary)] hover:text-[#5B5BF0]"
        >
          <ArrowLeft size={14} /> 結束複習
        </Link>
        <div className="text-sm font-medium text-[var(--color-text-secondary)]">
          {idx + 1} / {total}
        </div>
      </div>

      <ProgressBar value={progress} height={6} />

      <div className="mx-auto max-w-xl">
        <AnimatePresence mode="wait">
          <motion.div
            key={current.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
          >
            <GlassCard className="glass-strong rounded-3xl p-8">
              <div className="flex items-start justify-between">
                <div className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)]">
                  你還記得這個字嗎？
                </div>
                <button
                  type="button"
                  onClick={() => speak({ text: current.word })}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-[#5B5BF0]/10 text-[#5B5BF0] hover:bg-[#5B5BF0]/20"
                >
                  <Volume2 size={15} />
                </button>
              </div>

              <div className="mt-6 text-center">
                <div className="text-4xl font-bold tracking-tight sm:text-5xl">{current.word}</div>
                <div className="mt-2 font-mono text-sm text-[var(--color-text-tertiary)]">
                  {current.phonetic}
                </div>
              </div>

              <AnimatePresence>
                {revealed ? (
                  <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-6 rounded-2xl bg-white/50 p-4 ring-1 ring-inset ring-black/5"
                  >
                    <div className="text-[15px] font-semibold leading-snug">
                      {current.meaning}
                    </div>
                    {current.examples[0] && (
                      <div className="mt-2 text-sm leading-snug text-[var(--color-text-secondary)]">
                        {current.examples[0].en}
                      </div>
                    )}
                  </motion.div>
                ) : (
                  <div className="mt-6 flex justify-center">
                    <button
                      type="button"
                      onClick={() => setRevealed(true)}
                      className="btn-secondary inline-flex h-11 items-center gap-2 rounded-xl px-6 text-sm font-medium"
                    >
                      看答案
                    </button>
                  </div>
                )}
              </AnimatePresence>
            </GlassCard>
          </motion.div>
        </AnimatePresence>

        {/* 回應按鈕 */}
        {revealed && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 grid grid-cols-4 gap-2"
          >
            {responses.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => handleAnswer(r.id)}
                className={`flex flex-col items-center gap-0.5 rounded-2xl bg-gradient-to-br ${r.color} px-3 py-3.5 text-white shadow-card transition hover:scale-105`}
              >
                <span className="text-sm font-bold">{r.label}</span>
                <span className="text-[10px] opacity-90">{r.sub}</span>
              </button>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <GlassCard className="mx-auto max-w-md p-8 text-center">
      <div className="mb-3 text-5xl">🎉</div>
      <h2 className="text-lg font-bold">今天沒有要複習的單字</h2>
      <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
        記憶曲線安排你明天再來。要不要去學新單字？
      </p>
      <div className="mt-5 flex flex-col items-center gap-2 sm:flex-row sm:justify-center">
        <Link href="/learn/vocab/cards">
          <SoftButton variant="primary" size="md">看單字卡</SoftButton>
        </Link>
        <Link href="/learn/videos">
          <SoftButton variant="secondary" size="md">看影片</SoftButton>
        </Link>
      </div>
    </GlassCard>
  );
}

function FinishedScreen({ total, stat }: { total: number; stat: RoundStat }) {
  const accuracy = total > 0 ? Math.round((stat.correct / total) * 100) : 0;
  return (
    <GlassCard className="glass-strong mx-auto max-w-md p-8 text-center">
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 240, damping: 18 }}
        className="mb-4 inline-flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-[#4ADE80] to-[#22C55E] text-white shadow-card"
      >
        <Check size={40} strokeWidth={3} />
      </motion.div>
      <h2 className="text-2xl font-bold">複習完成！</h2>
      <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
        今天又把記憶往前推了一步
      </p>

      <div className="mt-5 grid grid-cols-3 gap-2 text-center">
        <Stat label="記得" value={stat.correct} color="text-[#15803d]" />
        <Stat label="模糊" value={stat.vague} color="text-[#9A6B12]" />
        <Stat label="忘了" value={stat.forgot} color="text-[#B91C1C]" />
      </div>

      <div className="mt-5 rounded-xl bg-[#5B5BF0]/8 p-3 ring-1 ring-inset ring-[#5B5BF0]/15">
        <div className="text-xs uppercase tracking-wider text-[#5B5BF0]">正確率</div>
        <div className="text-3xl font-bold text-[#5B5BF0]">{accuracy}%</div>
      </div>

      <div className="mt-5 flex flex-col items-center gap-2 sm:flex-row sm:justify-center">
        <Link href="/learn/vocab">
          <SoftButton variant="ghost" size="md" leftIcon={<RotateCcw size={14} />}>
            回到單字本
          </SoftButton>
        </Link>
        <Link href="/">
          <SoftButton variant="primary" size="md">回首頁</SoftButton>
        </Link>
      </div>
    </GlassCard>
  );
}

function Stat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="rounded-xl bg-white/50 p-3 ring-1 ring-inset ring-black/5">
      <div className={`text-2xl font-bold ${color}`}>{value}</div>
      <div className="text-xs text-[var(--color-text-tertiary)]">{label}</div>
    </div>
  );
}
