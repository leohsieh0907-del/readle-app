'use client';

import { achievements, type AchievementTier } from '@/lib/achievements/registry';
import { getUnlockedIds } from '@/lib/achievements/engine';
import { useEffect, useState } from 'react';

const tierClass: Record<AchievementTier, string> = {
  bronze: 'from-[#CD7F32] to-[#A0522D]',
  silver: 'from-[#C0C0C0] to-[#8E8E93]',
  gold: 'from-[#FFD700] to-[#FFB84D]',
  diamond: 'from-[#B9F2FF] to-[#5BC0EB]',
};

const tierLabel: Record<AchievementTier, string> = {
  bronze: '銅',
  silver: '銀',
  gold: '金',
  diamond: '鑽',
};

export default function AchievementWall() {
  const [unlocked, setUnlocked] = useState<Set<string>>(new Set());

  useEffect(() => {
    setUnlocked(getUnlockedIds());
  }, []);

  return (
    <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
      {achievements.map((a) => {
        const isUnlocked = unlocked.has(a.id);
        return (
          <div
            key={a.id}
            className="flex flex-col items-center gap-1.5 text-center"
            title={a.desc}
          >
            <div
              className={`flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br text-2xl text-white shadow-card transition ${
                isUnlocked
                  ? tierClass[a.tier]
                  : 'from-[#D4D4DC] to-[#9090A3] opacity-40 grayscale'
              }`}
            >
              {a.icon}
            </div>
            <div className="text-xs font-semibold">{a.label}</div>
            <div className="text-[10px] text-[var(--color-text-tertiary)]">
              {isUnlocked ? tierLabel[a.tier] : a.desc}
            </div>
          </div>
        );
      })}
    </div>
  );
}
