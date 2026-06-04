'use client';

import { useEffect, useState } from 'react';
import { Sparkles } from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';

function greet(hour: number) {
  if (hour < 5) return '夜深了';
  if (hour < 11) return '早安';
  if (hour < 14) return '午安';
  if (hour < 18) return '下午好';
  if (hour < 22) return '晚安';
  return '深夜了';
}

const tips = [
  '今天從一個影片開始，10 分鐘就好。',
  '昨天的單字還記得幾個？來複習吧。',
  '今天適合練口說，Luna 陪你聊一段。',
  '商業 Email 慣用語影片，剛上線。',
  '連續學習是最好的英文老師。',
];

interface HeroGreetingProps {
  nickname: string;
}

export default function HeroGreeting({ nickname }: HeroGreetingProps) {
  const [hour, setHour] = useState(() => new Date().getHours());
  const [tip, setTip] = useState(tips[0]);

  useEffect(() => {
    setHour(new Date().getHours());
    setTip(tips[Math.floor(Math.random() * tips.length)]);
  }, []);

  return (
    <GlassCard className="anim-fade-in-up overflow-hidden p-6 sm:p-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-[var(--color-text-tertiary)]">
            {greet(hour)}
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
            {nickname || '學習者'}，<span className="text-gradient">繼續加油</span> 👋
          </h1>
          <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#5B5BF0]/8 px-3 py-1.5 text-sm text-[#5B5BF0] ring-1 ring-inset ring-[#5B5BF0]/15">
            <Sparkles size={14} />
            <span className="font-medium">Luna：</span>
            <span>{tip}</span>
          </div>
        </div>
        <div className="text-5xl sm:text-6xl">🌅</div>
      </div>
    </GlassCard>
  );
}
