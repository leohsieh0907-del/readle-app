'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { BookOpen, RefreshCw, ArrowRight, Sparkles } from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';
import SoftButton from '@/components/ui/SoftButton';
import ProgressBar from '@/components/ui/ProgressBar';
import { vocabRepo } from '@/lib/storage/repos';
import { getDueWordIds } from '@/lib/srs/sm2';
import type { Category, VocabEntry } from '@/lib/readle-types';

const catLabel: Record<Category, string> = {
  toeic: '多益',
  business: '商業',
  daily: '日常',
  travel: '旅遊',
  tech: '科技',
};

const catColor: Record<Category, string> = {
  toeic: 'from-[#6366F1] to-[#4F46E5]',
  business: 'from-[#8B5CF6] to-[#7C3AED]',
  daily: 'from-[#06B6D4] to-[#0891B2]',
  travel: 'from-[#10B981] to-[#059669]',
  tech: 'from-[#F59E0B] to-[#D97706]',
};

const catEmoji: Record<Category, string> = {
  toeic: '🎯',
  business: '💼',
  daily: '☕',
  travel: '✈️',
  tech: '💻',
};

export default function VocabPage() {
  const [entries, setEntries] = useState<VocabEntry[]>([]);
  const [dueCount, setDueCount] = useState(0);

  useEffect(() => {
    const s = vocabRepo.get();
    const list = Object.values(s.entries);
    setEntries(list);
    setDueCount(getDueWordIds(s.entries).length);
  }, []);

  const total = entries.length;
  const mastered = entries.filter((e) => e.srs.status === 'mastered').length;
  const byCat: Record<Category, number> = { toeic: 0, business: 0, daily: 0, travel: 0, tech: 0 };
  entries.forEach((e) => (byCat[e.category] += 1));

  return (
    <div className="space-y-6">
      <header className="px-1">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">我的單字本</h1>
        <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
          收藏 {total} · 已掌握 {mastered}
        </p>
      </header>

      {/* 單字太少時顯示提示 */}
      {total <= 5 && (
        <GlassCard className="p-4">
          <div className="flex items-start gap-3">
            <span className="text-2xl">💡</span>
            <div>
              <div className="text-sm font-semibold">如何增加單字？</div>
              <div className="mt-1 text-xs text-[var(--color-text-secondary)] leading-relaxed">
                現在只有起始示範字。去看影片、把滑鼠移到任何英文字上，按「加入單字本」就能慢慢收藏自己學過的字。
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                <Link href="/learn/videos"
                  className="inline-flex h-7 items-center gap-1 rounded-full bg-[#5B5BF0]/10 px-2.5 text-xs font-medium text-[#5B5BF0] hover:bg-[#5B5BF0]/20">
                  🎬 去看影片
                </Link>
                <Link href="/ai/chat"
                  className="inline-flex h-7 items-center gap-1 rounded-full bg-[#8B5CF6]/10 px-2.5 text-xs font-medium text-[#8B5CF6] hover:bg-[#8B5CF6]/20">
                  🤖 跟 Luna 練對話
                </Link>
              </div>
            </div>
          </div>
        </GlassCard>
      )}

      {/* 今日複習卡 */}
      <GlassCard className="p-6">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#7C7CFF] to-[#5B5BF0] text-white shadow-card">
              <RefreshCw size={24} />
            </div>
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)]">
                記憶曲線複習
              </div>
              <div className="mt-0.5 text-xl font-bold">
                今日待複習 {dueCount} 個
              </div>
              <div className="mt-1 text-sm text-[var(--color-text-secondary)]">
                {dueCount > 0 ? '把握黃金時間複習，記憶最牢' : '今天沒有需要複習的單字 🎉'}
              </div>
            </div>
          </div>
          {dueCount > 0 ? (
            <Link href="/learn/vocab/review">
              <SoftButton variant="primary" size="lg" rightIcon={<ArrowRight size={16} />}>
                開始複習
              </SoftButton>
            </Link>
          ) : (
            <Link href="/learn/vocab/cards">
              <SoftButton variant="secondary" size="lg" rightIcon={<ArrowRight size={16} />}>
                看單字卡
              </SoftButton>
            </Link>
          )}
        </div>
        {total > 0 && (
          <div className="mt-5">
            <div className="mb-1 flex justify-between text-xs text-[var(--color-text-tertiary)]">
              <span>掌握進度</span>
              <span>{mastered} / {total}</span>
            </div>
            <ProgressBar value={total > 0 ? (mastered / total) * 100 : 0} height={8} />
          </div>
        )}
      </GlassCard>

      {/* 分類 */}
      <section>
        <h2 className="mb-3 px-1 text-lg font-bold">依分類瀏覽</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {(Object.keys(byCat) as Category[]).map((c) => (
            <GlassCard key={c} className="overflow-hidden p-0">
              <div className={`flex items-center justify-between bg-gradient-to-r ${catColor[c]} px-4 py-3 text-white`}>
                <div className="flex items-center gap-2">
                  <span className="text-xl">{catEmoji[c]}</span>
                  <span className="font-bold">{catLabel[c]}</span>
                </div>
                <span className="rounded-full bg-white/25 px-2 py-0.5 text-xs font-bold backdrop-blur-sm">
                  {byCat[c]} 字
                </span>
              </div>
              <div className="p-4">
                {byCat[c] === 0 ? (
                  <div className="text-xs text-[var(--color-text-tertiary)]">尚無單字</div>
                ) : (
                  <div className="flex flex-wrap gap-1">
                    {entries
                      .filter((e) => e.category === c)
                      .slice(0, 6)
                      .map((e) => (
                        <span
                          key={e.id}
                          className="rounded-full bg-black/[0.04] px-2 py-0.5 text-xs text-[var(--color-text-secondary)]"
                        >
                          {e.word}
                        </span>
                      ))}
                    {byCat[c] > 6 && (
                      <span className="rounded-full bg-black/[0.04] px-2 py-0.5 text-xs text-[var(--color-text-tertiary)]">
                        +{byCat[c] - 6}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </GlassCard>
          ))}
        </div>
      </section>

      {/* 模式 */}
      <section className="grid gap-3 sm:grid-cols-2">
        <Link href="/learn/vocab/cards" className="group">
          <GlassCard className="p-5 transition group-hover:shadow-hover">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#FFB84D] to-[#FF6B6B] text-white">
                <BookOpen size={22} />
              </div>
              <div className="flex-1">
                <div className="font-bold">單字卡模式</div>
                <div className="text-xs text-[var(--color-text-secondary)]">翻面看釋義 · 一張一張練</div>
              </div>
              <ArrowRight size={18} className="text-[var(--color-text-tertiary)] group-hover:text-[#5B5BF0]" />
            </div>
          </GlassCard>
        </Link>
        <Link href="/learn/vocab/review" className="group">
          <GlassCard className="p-5 transition group-hover:shadow-hover">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#7C7CFF] to-[#5B5BF0] text-white">
                <Sparkles size={22} />
              </div>
              <div className="flex-1">
                <div className="font-bold">SRS 智慧複習</div>
                <div className="text-xs text-[var(--color-text-secondary)]">記憶曲線排程 · 該複習的才複習</div>
              </div>
              <ArrowRight size={18} className="text-[var(--color-text-tertiary)] group-hover:text-[#5B5BF0]" />
            </div>
          </GlassCard>
        </Link>
      </section>
    </div>
  );
}
