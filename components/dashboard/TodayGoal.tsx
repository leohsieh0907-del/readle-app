'use client';

import Link from 'next/link';
import { ArrowRight, Clock, Target } from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';
import ProgressRing from '@/components/ui/ProgressRing';
import SoftButton from '@/components/ui/SoftButton';

interface TodayGoalProps {
  learnedMin: number;
  goalMin: number;
  streak: number;
}

export default function TodayGoal({ learnedMin, goalMin, streak }: TodayGoalProps) {
  const pct = goalMin > 0 ? (learnedMin / goalMin) * 100 : 0;
  return (
    <GlassCard className="p-6 sm:p-7">
      <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-5">
          <ProgressRing
            value={pct}
            size={108}
            label={`${learnedMin}`}
            sublabel={`/ ${goalMin} 分`}
          />
          <div>
            <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)]">
              <Target size={12} /> 今日目標
            </div>
            <div className="mt-1 text-xl font-bold">
              {pct >= 100
                ? '✅ 已完成！'
                : learnedMin === 0
                  ? '點亮你的第一天 🔥'
                  : `差 ${goalMin - learnedMin} 分鐘`}
            </div>
            <div className="mt-1.5 flex items-center gap-3 text-sm text-[var(--color-text-secondary)]">
              <span className="inline-flex items-center gap-1">
                <Clock size={13} />
                {streak > 0 ? `連續 ${streak} 天` : '完成今日目標即開始連續紀錄'}
              </span>
            </div>
          </div>
        </div>
        <Link href="/learn/videos">
          <SoftButton variant="primary" size="lg" rightIcon={<ArrowRight size={18} />}>
            繼續今日學習
          </SoftButton>
        </Link>
      </div>
    </GlassCard>
  );
}
