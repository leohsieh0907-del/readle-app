import { Flame } from 'lucide-react';

interface StreakFlameProps {
  days: number;
  size?: 'sm' | 'md' | 'lg';
}

export default function StreakFlame({ days, size = 'md' }: StreakFlameProps) {
  const dim = {
    sm: { wrap: 'h-8 px-2.5 text-sm', icon: 14 },
    md: { wrap: 'h-10 px-3.5 text-[15px]', icon: 16 },
    lg: { wrap: 'h-12 px-4 text-base', icon: 20 },
  }[size];

  return (
    <div
      className={`inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-[#FFB84D]/15 to-[#FF6B6B]/15 font-semibold text-[#FF6B6B] ring-1 ring-inset ring-[#FF6B6B]/20 ${dim.wrap}`}
    >
      <Flame
        size={dim.icon}
        strokeWidth={2.4}
        className="anim-flicker"
        fill="#FFB84D"
        color="#FF6B6B"
      />
      <span>{days}</span>
    </div>
  );
}
