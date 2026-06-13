'use client';

import { useEffect, useState } from 'react';
import { Activity, BookOpen, Clock } from 'lucide-react';
import HeroGreeting from '@/components/dashboard/HeroGreeting';
import TodayGoal from '@/components/dashboard/TodayGoal';
import TodayWords from '@/components/dashboard/TodayWords';
import HotVideos from '@/components/dashboard/HotVideos';
import AIRecommend from '@/components/dashboard/AIRecommend';
import GlassCard from '@/components/ui/GlassCard';
import { progressRepo, userRepo, vocabRepo } from '@/lib/storage/repos';
import { seedVideos } from '@/lib/mock/seed-videos';
import type { VocabEntry } from '@/lib/readle-types';

export default function HomePage() {
  const [nickname, setNickname] = useState('');
  const [learnedMin, setLearnedMin] = useState(12);
  const [goalMin, setGoalMin] = useState(20);
  const [streak, setStreak] = useState(0);
  const [todayWords, setTodayWords] = useState<VocabEntry[]>([]);

  useEffect(() => {
    const u = userRepo.get();
    const p = progressRepo.get();
    const v = vocabRepo.get();
    setNickname(u.nickname);
    setGoalMin(u.dailyGoalMinutes);
    setStreak(p.currentStreak);
    const today = new Date().toISOString().slice(0, 10);
    setLearnedMin(p.daily[today]?.minutesLearned ?? 12);
    setTodayWords(Object.values(v.entries).slice(0, 5));
  }, []);

  return (
    <div className="space-y-8">
      <HeroGreeting nickname={nickname} />
      <TodayGoal learnedMin={learnedMin} goalMin={goalMin} streak={streak} />
      {todayWords.length > 0 && <TodayWords words={todayWords} />}
      <HotVideos videos={seedVideos.slice(0, 3)} />
      <AIRecommend />
      <RecentActivities />
    </div>
  );
}

function RecentActivities() {
  const items = [
    {
      icon: <BookOpen size={16} />,
      title: '完成 SRS 複習',
      detail: '23 字 · +35 XP',
      time: '今天 09:42',
    },
    {
      icon: <Activity size={16} />,
      title: '看了《商業 Email 慣用語》',
      detail: '12 分鐘 · 學會 4 個新單字',
      time: '昨天 21:15',
    },
    {
      icon: <Clock size={16} />,
      title: '單字測驗 8/10',
      detail: '正確率 80% · +44 XP',
      time: '昨天 20:30',
    },
  ];

  return (
    <section>
      <div className="mb-3 flex items-end justify-between px-1">
        <div>
          <h2 className="text-lg font-bold tracking-tight">最近紀錄</h2>
          <p className="text-xs text-[var(--color-text-tertiary)]">你的學習足跡</p>
        </div>
      </div>
      <GlassCard className="divide-y divide-black/[0.04] overflow-hidden">
        {items.map((it, i) => (
          <div key={i} className="flex items-center gap-3 p-4 transition hover:bg-white/30">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#5B5BF0]/10 text-[#5B5BF0]">
              {it.icon}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold">{it.title}</div>
              <div className="text-xs text-[var(--color-text-tertiary)]">{it.detail}</div>
            </div>
            <div className="shrink-0 text-xs text-[var(--color-text-tertiary)]">{it.time}</div>
          </div>
        ))}
      </GlassCard>
    </section>
  );
}
