'use client';

import Link from 'next/link';
import { MessageSquare, PenLine, CheckCircle2, Mic, ArrowUpRight } from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';

const apps = [
  {
    href: '/ai/chat',
    label: '情境對話',
    desc: '8 種情境 · 角色扮演 · 即時糾錯',
    icon: <MessageSquare size={22} />,
    grad: 'from-[#7C7CFF] to-[#5B5BF0]',
  },
  {
    href: '/ai/writing',
    label: '寫作助手',
    desc: '錯誤標示 · 3 種改寫風格',
    icon: <PenLine size={22} />,
    grad: 'from-[#FFB84D] to-[#FF6B6B]',
  },
  {
    href: '/ai/grammar',
    label: '文法檢查',
    desc: '貼上句子 · 立刻看修正',
    icon: <CheckCircle2 size={22} />,
    grad: 'from-[#4ADE80] to-[#22C55E]',
  },
  {
    href: '/ai/speaking',
    label: '口說評分',
    desc: '錄音 · AI 分析發音流暢度',
    icon: <Mic size={22} />,
    grad: 'from-[#FF6B9D] to-[#D946EF]',
  },
];

export default function AIHubPage() {
  return (
    <div className="space-y-6">
      <header className="px-1">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">AI 助教專區</h1>
        <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
          Luna 駐站，協助你練口說、糾文法、改作文
        </p>
      </header>

      <div className="grid gap-3 sm:grid-cols-2">
        {apps.map((a) => (
          <Link key={a.href} href={a.href} className="group">
            <GlassCard className="p-5 transition group-hover:shadow-hover">
              <div className="flex items-start justify-between">
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${a.grad} text-white shadow-card`}
                >
                  {a.icon}
                </div>
                <ArrowUpRight
                  size={18}
                  className="text-[var(--color-text-tertiary)] transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-[#5B5BF0]"
                />
              </div>
              <div className="mt-4 text-[15px] font-bold">{a.label}</div>
              <div className="mt-1 text-xs text-[var(--color-text-secondary)]">{a.desc}</div>
            </GlassCard>
          </Link>
        ))}
      </div>

      <GlassCard className="p-4 text-xs text-[var(--color-text-tertiary)]">
        💡 <b>提示</b>：所有 AI 功能可透過設定頁切換 Provider（Mock / Gemini / Groq）。
        Mock 模式無需 API key，可離線使用。
      </GlassCard>
    </div>
  );
}
