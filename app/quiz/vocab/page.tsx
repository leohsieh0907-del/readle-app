'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import QuizSession from '@/components/quiz/QuizSession';
import GlassCard from '@/components/ui/GlassCard';
import SoftButton from '@/components/ui/SoftButton';
import { generateQuiz } from '@/lib/mock/quiz-bank';
import { vocabRepo } from '@/lib/storage/repos';

export default function VocabQuizPage() {
  const [hasEnough, setHasEnough] = useState<boolean | null>(null);
  const questions = useMemo(() => generateQuiz('vocab', 5), []);

  useEffect(() => {
    const n = Object.keys(vocabRepo.get().entries).length;
    setHasEnough(n >= 4);
  }, []);

  if (hasEnough === null) return null;

  if (!hasEnough) {
    return (
      <GlassCard className="mx-auto max-w-md p-8 text-center">
        <div className="mb-3 text-5xl">📚</div>
        <h2 className="text-lg font-bold">單字本不夠 4 個字</h2>
        <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
          至少要收藏 4 個字才能出單字測驗。先去看影片或加入字吧。
        </p>
        <div className="mt-4 flex flex-col items-center gap-2 sm:flex-row sm:justify-center">
          <Link href="/learn/videos">
            <SoftButton variant="primary" size="md">看影片</SoftButton>
          </Link>
          <Link href="/learn/vocab">
            <SoftButton variant="secondary" size="md">回單字本</SoftButton>
          </Link>
        </div>
      </GlassCard>
    );
  }

  return <QuizSession type="vocab" topic="單字測驗" questions={questions} />;
}
