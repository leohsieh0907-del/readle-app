'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ChevronLeft, ChevronRight, Shuffle } from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';
import Flashcard from '@/components/vocab/Flashcard';
import { vocabRepo } from '@/lib/storage/repos';
import type { VocabEntry } from '@/lib/readle-types';

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function FlashcardsPage() {
  const [list, setList] = useState<VocabEntry[]>([]);
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);

  useEffect(() => {
    const s = vocabRepo.get();
    setList(Object.values(s.entries));
  }, []);

  const current = list[idx];
  const total = list.length;

  const goNext = () => {
    setFlipped(false);
    setIdx((i) => Math.min(total - 1, i + 1));
  };
  const goPrev = () => {
    setFlipped(false);
    setIdx((i) => Math.max(0, i - 1));
  };
  const reshuffle = () => {
    setList((l) => shuffle(l));
    setIdx(0);
    setFlipped(false);
  };

  // 鍵盤
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.code === 'ArrowLeft') goPrev();
      else if (e.code === 'ArrowRight') goNext();
      else if (e.code === 'Space') {
        e.preventDefault();
        setFlipped((f) => !f);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [total]);

  if (total === 0) {
    return (
      <EmptyState />
    );
  }

  return (
    <div className="space-y-4">
      <Link
        href="/learn/vocab"
        className="inline-flex items-center gap-1 text-sm text-[var(--color-text-secondary)] hover:text-[#5B5BF0]"
      >
        <ArrowLeft size={14} /> 回到單字本
      </Link>

      <div className="flex items-center justify-between px-1">
        <div>
          <h1 className="text-xl font-bold">單字卡模式</h1>
          <p className="text-xs text-[var(--color-text-tertiary)]">
            空白翻面 · ←→ 切換 · 點 🔊 聽發音
          </p>
        </div>
        <button
          type="button"
          onClick={reshuffle}
          className="btn-ghost inline-flex h-9 items-center gap-1.5 rounded-xl px-3 text-sm"
        >
          <Shuffle size={14} /> 洗牌
        </button>
      </div>

      <div className="mx-auto max-w-xl">
        <AnimatePresence mode="wait">
          <motion.div
            key={current.id}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.25 }}
          >
            <Flashcard
              word={current}
              flipped={flipped}
              onFlip={() => setFlipped((f) => !f)}
            />
          </motion.div>
        </AnimatePresence>

        {/* 控制列 */}
        <div className="mt-5 flex items-center justify-between">
          <button
            type="button"
            onClick={goPrev}
            disabled={idx === 0}
            className="btn-ghost flex h-11 w-11 items-center justify-center rounded-full disabled:opacity-30"
          >
            <ChevronLeft size={20} />
          </button>
          <div className="text-sm font-medium text-[var(--color-text-secondary)]">
            {idx + 1} / {total}
          </div>
          <button
            type="button"
            onClick={goNext}
            disabled={idx === total - 1}
            className="btn-ghost flex h-11 w-11 items-center justify-center rounded-full disabled:opacity-30"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <GlassCard className="mx-auto max-w-md p-8 text-center">
      <div className="mb-3 text-5xl">📚</div>
      <h2 className="text-lg font-bold">單字本還空空的</h2>
      <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
        去看幾部影片、點字幕加幾個單字吧
      </p>
      <Link href="/learn/videos" className="mt-4 inline-block">
        <span className="btn-primary inline-flex h-10 items-center gap-2 rounded-xl px-5 text-sm font-medium">
          看影片
        </span>
      </Link>
    </GlassCard>
  );
}
