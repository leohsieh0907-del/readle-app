'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Headphones, FileText, BookOpen, Sparkles, History as HistoryIcon } from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';
import { quizRepo, type QuizRecord } from '@/lib/storage/quiz-actions';

const quizTypes = [
  {
    href: '/quiz/listening',
    label: '聽力測驗',
    desc: 'TTS 念題 → 4 選 1',
    icon: <Headphones size={22} />,
    grad: 'from-[#06B6D4] to-[#0891B2]',
  },
  {
    href: '/quiz/cloze',
    label: '填空題',
    desc: '挖空 → 從選項挑',
    icon: <FileText size={22} />,
    grad: 'from-[#FFB84D] to-[#FF6B6B]',
  },
  {
    href: '/quiz/vocab',
    label: '單字測驗',
    desc: '從你的單字本出題',
    icon: <BookOpen size={22} />,
    grad: 'from-[#8B5CF6] to-[#7C3AED]',
  },
  {
    href: '/quiz/ai-gen',
    label: 'AI 自動出題',
    desc: '混合題型 · 根據你的程度',
    icon: <Sparkles size={22} />,
    grad: 'from-[#7C7CFF] to-[#5B5BF0]',
  },
];

const typeLabel: Record<string, string> = {
  listening: '聽力',
  cloze: '填空',
  vocab: '單字',
  ai_gen: 'AI 自動',
};

export default function QuizCenterPage() {
  const [records, setRecords] = useState<QuizRecord[]>([]);

  useEffect(() => {
    setRecords(quizRepo.get().records);
  }, []);

  return (
    <div className="space-y-6">
      <header className="px-1">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">測驗中心</h1>
        <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
          選一種題型開始 · 每場 5 題 · 答完看雷達分析
        </p>
      </header>

      <div className="grid gap-3 sm:grid-cols-2">
        {quizTypes.map((t) => (
          <Link key={t.href} href={t.href} className="group">
            <GlassCard className="p-5 transition group-hover:shadow-hover">
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${t.grad} text-white shadow-card`}
                >
                  {t.icon}
                </div>
                <div className="flex-1">
                  <div className="text-[15px] font-bold">{t.label}</div>
                  <div className="text-xs text-[var(--color-text-secondary)]">{t.desc}</div>
                </div>
              </div>
            </GlassCard>
          </Link>
        ))}
      </div>

      <section>
        <div className="mb-3 flex items-center gap-1.5 px-1">
          <HistoryIcon size={16} className="text-[var(--color-text-tertiary)]" />
          <h2 className="text-lg font-bold">最近紀錄</h2>
        </div>
        {records.length === 0 ? (
          <GlassCard className="p-8 text-center">
            <div className="mb-2 text-4xl">📋</div>
            <p className="text-sm text-[var(--color-text-secondary)]">
              還沒有測驗紀錄。挑一個題型來試試吧。
            </p>
          </GlassCard>
        ) : (
          <GlassCard className="divide-y divide-black/[0.04] overflow-hidden">
            {records.slice(0, 8).map((r) => (
              <Link
                key={r.id}
                href={`/quiz/result/${r.id}`}
                className="flex items-center gap-3 p-4 transition hover:bg-white/30"
              >
                <div className={`flex h-9 w-9 items-center justify-center rounded-xl text-sm font-bold ${
                  r.score >= 80
                    ? 'bg-[#4ADE80]/15 text-[#15803d]'
                    : r.score >= 60
                    ? 'bg-[#FBBF24]/15 text-[#9A6B12]'
                    : 'bg-[#F87171]/15 text-[#B91C1C]'
                }`}>
                  {r.score}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold">
                    {typeLabel[r.type]}測驗 · {r.answers.filter((a) => a.correct).length} / {r.questions.length}
                  </div>
                  <div className="text-xs text-[var(--color-text-tertiary)]">
                    {new Date(r.takenAt).toLocaleString('zh-TW', { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' })}
                    {' · '}
                    {Math.floor(r.durationSec / 60)}:{(r.durationSec % 60).toString().padStart(2, '0')}
                  </div>
                </div>
                <div className="text-xs text-[#5B5BF0]">查看 →</div>
              </Link>
            ))}
          </GlassCard>
        )}
      </section>
    </div>
  );
}
