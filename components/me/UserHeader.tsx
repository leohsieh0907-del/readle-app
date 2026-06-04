'use client';

import type { ProgressStore, User } from '@/lib/readle-types';
import GlassCard from '@/components/ui/GlassCard';
import ProgressBar from '@/components/ui/ProgressBar';
import StreakFlame from '@/components/ui/StreakFlame';
import { progressToNextLevel, xpForLevel } from '@/lib/storage/progress-actions';

interface UserHeaderProps {
  user: User;
  progress: ProgressStore;
}

export default function UserHeader({ user, progress }: UserHeaderProps) {
  const pct = progressToNextLevel(progress.totalXP, progress.level);
  const nextXP = xpForLevel(progress.level + 1);

  return (
    <GlassCard className="glass-strong p-6 sm:p-7">
      <div className="flex flex-col items-center gap-5 sm:flex-row">
        <div className="relative">
          <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-[#7C7CFF]/20 to-[#5B5BF0]/15 text-4xl ring-2 ring-[#5B5BF0]/30">
            {user.avatar}
          </div>
          <div className="absolute -bottom-1 -right-1 rounded-full bg-gradient-to-br from-[#FFB84D] to-[#FF6B6B] px-2 py-0.5 text-[10px] font-bold text-white shadow-card">
            Lv {progress.level}
          </div>
        </div>
        <div className="flex-1 text-center sm:text-left">
          <div className="text-xl font-bold tracking-tight">{user.nickname || '學習者'}</div>
          <div className="mt-0.5 text-xs text-[var(--color-text-tertiary)]">
            等級 {user.cefrLevel} · 目標 {goalLabel(user.goal)}
          </div>
          <div className="mt-3 flex items-center justify-center gap-3 sm:justify-start">
            <StreakFlame days={progress.currentStreak} size="sm" />
            <div className="rounded-full bg-[#FFB84D]/12 px-2.5 py-1 text-xs font-semibold text-[#FF9A1F] ring-1 ring-inset ring-[#FFB84D]/25">
              ⭐ {progress.totalXP.toLocaleString()} XP
            </div>
            <div className="text-xs text-[var(--color-text-tertiary)]">
              累計 {progress.totalMinutes} 分
            </div>
          </div>
          <div className="mt-3">
            <div className="mb-1 flex justify-between text-[10px] text-[var(--color-text-tertiary)]">
              <span>距下一級</span>
              <span>{progress.totalXP} / {nextXP} XP</span>
            </div>
            <ProgressBar value={pct} height={6} />
          </div>
        </div>
      </div>
    </GlassCard>
  );
}

function goalLabel(g: string): string {
  const map: Record<string, string> = {
    toeic_550: '多益 550',
    toeic_750: '多益 750',
    toeic_900: '多益 900',
    business: '商業溝通',
    daily: '日常聊天',
    travel: '出國旅遊',
  };
  return map[g] ?? g;
}
