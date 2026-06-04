'use client';

import Link from 'next/link';
import { Bot, Mic, PenLine, ArrowUpRight } from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';

const recos = [
  {
    icon: <Bot size={20} />,
    title: '練面試英文',
    desc: 'Luna 扮演面試官，5 分鐘暖身',
    href: '/ai/chat',
    grad: 'from-[#7C7CFF] to-[#5B5BF0]',
    tag: 'AI 對話',
  },
  {
    icon: <Mic size={20} />,
    title: '今日跟讀挑戰',
    desc: '商業 Email 影片精選 3 句',
    href: '/learn/videos/v001',
    grad: 'from-[#FF6B9D] to-[#D946EF]',
    tag: '跟讀',
  },
  {
    icon: <PenLine size={20} />,
    title: 'AI 批改作文',
    desc: '寫 3 句英文，3 秒拿回饋',
    href: '/ai/writing',
    grad: 'from-[#FFB84D] to-[#FF6B6B]',
    tag: '寫作',
  },
];

export default function AIRecommend() {
  return (
    <section>
      <div className="mb-3 flex items-end justify-between px-1">
        <div>
          <h2 className="text-lg font-bold tracking-tight">✨ Luna 的推薦</h2>
          <p className="text-xs text-[var(--color-text-tertiary)]">根據你最近的學習挑的</p>
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        {recos.map((r) => (
          <Link key={r.href} href={r.href} className="group">
            <GlassCard className="relative h-full overflow-hidden p-4 transition group-hover:shadow-hover">
              <div className="flex items-start justify-between">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${r.grad} text-white shadow-card`}
                >
                  {r.icon}
                </div>
                <ArrowUpRight
                  size={18}
                  className="text-[var(--color-text-tertiary)] transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-[#5B5BF0]"
                />
              </div>
              <div className="mt-4 text-[15px] font-bold">{r.title}</div>
              <div className="mt-1 text-xs text-[var(--color-text-secondary)]">{r.desc}</div>
              <div className="mt-3 inline-block rounded-full bg-black/[0.04] px-2 py-0.5 text-[10px] font-medium uppercase text-[var(--color-text-tertiary)]">
                {r.tag}
              </div>
            </GlassCard>
          </Link>
        ))}
      </div>
    </section>
  );
}
