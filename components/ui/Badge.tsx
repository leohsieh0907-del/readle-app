import type { ReactNode } from 'react';

type Tier = 'bronze' | 'silver' | 'gold' | 'diamond' | 'locked';

interface BadgeProps {
  icon: ReactNode;
  label: string;
  tier?: Tier;
  unlocked?: boolean;
}

const tierClass: Record<Tier, string> = {
  bronze: 'from-[#CD7F32] to-[#A0522D]',
  silver: 'from-[#C0C0C0] to-[#8E8E93]',
  gold: 'from-[#FFD700] to-[#FFB84D]',
  diamond: 'from-[#B9F2FF] to-[#5BC0EB]',
  locked: 'from-[#D4D4DC] to-[#9090A3]',
};

export default function Badge({ icon, label, tier = 'bronze', unlocked = true }: BadgeProps) {
  const t = unlocked ? tier : 'locked';
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div
        className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${tierClass[t]} text-white shadow-card ${!unlocked ? 'opacity-40 grayscale' : ''}`}
      >
        {icon}
      </div>
      <span className="text-xs text-[var(--color-text-secondary)]">{label}</span>
    </div>
  );
}
