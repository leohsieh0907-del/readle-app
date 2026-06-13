'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Activity, BookOpen, ClipboardCheck, Award } from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';
import UserHeader from '@/components/me/UserHeader';
import LearningHeatmap from '@/components/me/LearningHeatmap';
import AchievementWall from '@/components/me/AchievementWall';
import CategoryPie from '@/components/me/CategoryPie';
import { userRepo, progressRepo, vocabRepo, historyRepo } from '@/lib/storage/repos';
import { checkAndUnlock } from '@/lib/achievements/engine';
import { quizRepo } from '@/lib/storage/quiz-actions';
import type { User, ProgressStore, Category } from '@/lib/readle-types';
import type { Activity as ActivityType } from '@/lib/readle-types';

export default function MePage() {
  const [user, setUser] = useState<User | null>(null);
  const [progress, setProgress] = useState<ProgressStore | null>(null);
  const [vocabCount, setVocabCount] = useState(0);
  const [byCat, setByCat] = useState<Record<Category, number>>({
    toeic: 0, business: 0, daily: 0, travel: 0, tech: 0,
  });
  const [activities, setActivities] = useState<ActivityType[]>([]);
  const [quizCount, setQuizCount] = useState(0);

  useEffect(() => {
    setUser(userRepo.get());
    setProgress(progressRepo.get());
    const v = vocabRepo.get();
    setVocabCount(Object.keys(v.entries).length);
    const cats: Record<Category, number> = { toeic: 0, business: 0, daily: 0, travel: 0, tech: 0 };
    Object.values(v.entries).forEach((e) => (cats[e.category] += 1));
    setByCat(cats);
    setActivities(historyRepo.get().activities.slice(0, 8));
    setQuizCount(quizRepo.get().records.length);
    // 順便檢查成就
    checkAndUnlock();
  }, []);

  if (!user || !progress) return null;

  return (
    <div className="space-y-5">
      <UserHeader user={user} progress={progress} />

      {/* 三個摘要卡 */}
      <div className="grid grid-cols-3 gap-3">
        <SummaryCard
          icon={<BookOpen size={18} />}
          label="收藏單字"
          value={vocabCount}
          color="from-[#7C7CFF] to-[#5B5BF0]"
          href="/learn/vocab"
        />
        <SummaryCard
          icon={<ClipboardCheck size={18} />}
          label="完成測驗"
          value={quizCount}
          color="from-[#FF6B9D] to-[#D946EF]"
          href="/quiz"
        />
        <SummaryCard
          icon={<Activity size={18} />}
          label="學習活動"
          value={activities.length}
          color="from-[#FFB84D] to-[#FF6B6B]"
        />
      </div>

      {/* 熱力圖 */}
      <GlassCard className="p-5">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h2 className="font-bold">學習熱力圖</h2>
            <p className="text-xs text-[var(--color-text-tertiary)]">過去 365 天的學習軌跡</p>
          </div>
          <div className="text-right text-xs text-[var(--color-text-tertiary)]">
            <div>最長連續</div>
            <div className="text-base font-bold text-[#FF6B6B]">{progress.longestStreak} 天</div>
          </div>
        </div>
        <LearningHeatmap daily={progress.daily} />
      </GlassCard>

      {/* 雙欄：徽章 + 圓餅 */}
      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <GlassCard className="p-5">
          <div className="mb-4 flex items-center gap-1.5">
            <Award size={16} className="text-[var(--color-text-tertiary)]" />
            <h2 className="font-bold">成就徽章</h2>
          </div>
          <AchievementWall />
        </GlassCard>

        <GlassCard className="p-5">
          <div className="mb-2">
            <h2 className="font-bold">單字分佈</h2>
            <p className="text-xs text-[var(--color-text-tertiary)]">依分類</p>
          </div>
          <CategoryPie data={byCat} />
        </GlassCard>
      </div>

      {/* 最近活動 */}
      <GlassCard className="overflow-hidden p-0">
        <div className="border-b border-black/[0.04] px-5 py-3 font-bold">最近活動</div>
        {activities.length === 0 ? (
          <div className="p-6 text-center text-sm text-[var(--color-text-tertiary)]">
            還沒有學習紀錄
          </div>
        ) : (
          <div className="divide-y divide-black/[0.04]">
            {activities.map((a) => (
              <div key={a.id} className="flex items-center gap-3 p-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#5B5BF0]/10 text-[#5B5BF0]">
                  {iconFor(a.type)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold">{a.title}</div>
                  <div className="text-xs text-[var(--color-text-tertiary)]">{a.detail}</div>
                </div>
                <div className="text-xs text-[var(--color-text-tertiary)]">
                  {timeAgo(a.at)}
                </div>
              </div>
            ))}
          </div>
        )}
      </GlassCard>
    </div>
  );
}

function SummaryCard({
  icon, label, value, color, href,
}: { icon: React.ReactNode; label: string; value: number; color: string; href?: string }) {
  const inner = (
    <GlassCard className="p-4 transition hover:shadow-hover">
      <div className={`mb-2 flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br ${color} text-white`}>
        {icon}
      </div>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-xs text-[var(--color-text-tertiary)]">{label}</div>
    </GlassCard>
  );
  return href ? <Link href={href}>{inner}</Link> : inner;
}

function iconFor(t: string) {
  if (t === 'video') return '🎬';
  if (t === 'vocab_review') return '📚';
  if (t === 'quiz') return '✏️';
  if (t === 'ai_chat') return '🤖';
  return '✨';
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return '剛剛';
  if (m < 60) return `${m} 分鐘前`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} 小時前`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d} 天前`;
  return new Date(iso).toLocaleDateString('zh-TW');
}
