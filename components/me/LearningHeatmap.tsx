'use client';

import { useState } from 'react';
import type { ProgressStore } from '@/lib/readle-types';

interface LearningHeatmapProps {
  daily: ProgressStore['daily'];
}

/** 365 天熱力圖：周為列、月為欄 */
export default function LearningHeatmap({ daily }: LearningHeatmapProps) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const start = new Date(today);
  start.setDate(start.getDate() - 364);
  // 對齊到週日
  while (start.getDay() !== 0) start.setDate(start.getDate() - 1);

  const weeks: { date: Date; minutes: number; iso: string }[][] = [];
  let cur = new Date(start);
  while (cur <= today) {
    const week: { date: Date; minutes: number; iso: string }[] = [];
    for (let i = 0; i < 7; i++) {
      const iso = cur.toISOString().slice(0, 10);
      week.push({ date: new Date(cur), minutes: daily[iso]?.minutesLearned ?? 0, iso });
      cur.setDate(cur.getDate() + 1);
    }
    weeks.push(week);
  }

  const [hover, setHover] = useState<{ iso: string; min: number } | null>(null);

  const colorFor = (m: number) => {
    if (m === 0) return 'bg-black/[0.04] dark:bg-white/[0.04]';
    if (m < 10) return 'bg-[#5B5BF0]/25';
    if (m < 20) return 'bg-[#5B5BF0]/50';
    if (m < 40) return 'bg-[#5B5BF0]/75';
    return 'bg-[#5B5BF0]';
  };

  return (
    <div>
      <div className="flex gap-[3px] overflow-x-auto pb-1">
        {weeks.map((w, wi) => (
          <div key={wi} className="flex flex-col gap-[3px]">
            {w.map((d) => (
              <div
                key={d.iso}
                onMouseEnter={() => setHover({ iso: d.iso, min: d.minutes })}
                onMouseLeave={() => setHover(null)}
                className={`h-3 w-3 rounded-[3px] ${colorFor(d.minutes)} ${
                  d.date > today ? 'opacity-0' : ''
                }`}
                title={`${d.iso} · ${d.minutes} 分鐘`}
              />
            ))}
          </div>
        ))}
      </div>
      <div className="mt-2 flex items-center justify-between text-[10px] text-[var(--color-text-tertiary)]">
        <span>{hover ? `${hover.iso} · ${hover.min} 分鐘` : '過去 365 天'}</span>
        <div className="flex items-center gap-1">
          <span>少</span>
          {[0, 10, 20, 40, 60].map((m) => (
            <div key={m} className={`h-2.5 w-2.5 rounded-[2px] ${colorFor(m)}`} />
          ))}
          <span>多</span>
        </div>
      </div>
    </div>
  );
}
