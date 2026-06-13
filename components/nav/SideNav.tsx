'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home, PlayCircle, Bot, ClipboardCheck, User, Settings,
  BookOpen, FileText, BookA, GraduationCap,
} from 'lucide-react';

const groups: { title?: string; items: { href: string; label: string; icon: typeof Home }[] }[] = [
  { items: [{ href: '/', label: '首頁', icon: Home }] },
  {
    title: '學習',
    items: [
      { href: '/learn/videos', label: '影片學習', icon: PlayCircle },
      { href: '/learn/articles', label: '文章閱讀', icon: FileText },
      { href: '/learn/vocab', label: '單字本', icon: BookOpen },
      { href: '/exam', label: '考試準備', icon: GraduationCap },
      { href: '/quiz', label: '測驗', icon: ClipboardCheck },
    ],
  },
  {
    title: '工具',
    items: [
      { href: '/tools/dictionary', label: '字典', icon: BookA },
    ],
  },
  {
    title: '我的',
    items: [
      { href: '/ai', label: 'AI 助教', icon: Bot },
      { href: '/me', label: '我的', icon: User },
    ],
  },
];

export default function SideNav() {
  const pathname = usePathname();
  const isActive = (href: string) => (href === '/' ? pathname === '/' : pathname.startsWith(href));

  return (
    <aside className="sticky top-24 hidden h-[calc(100vh-7rem)] w-56 shrink-0 px-2 lg:block">
      <nav className="glass-card flex h-full flex-col gap-0.5 overflow-y-auto rounded-2xl p-3">
        {groups.map((g, gi) => (
          <div key={gi} className={gi > 0 ? 'mt-3' : ''}>
            {g.title && (
              <div className="mb-1 px-3 text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)]">
                {g.title}
              </div>
            )}
            {g.items.map(({ href, label, icon: Icon }) => {
              const active = isActive(href);
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex h-11 items-center gap-3 rounded-xl px-3 text-[15px] font-medium transition ${
                    active
                      ? 'bg-gradient-to-r from-[#7C7CFF]/15 to-[#5B5BF0]/10 text-[#5B5BF0] shadow-soft'
                      : 'text-[var(--color-text-secondary)] hover:bg-black/[0.04] hover:text-[var(--color-text-primary)] dark:hover:bg-white/[0.06]'
                  }`}
                >
                  <Icon size={18} strokeWidth={active ? 2.5 : 2} />
                  {label}
                </Link>
              );
            })}
          </div>
        ))}
        <div className="mt-auto pt-3">
          <Link
            href="/settings"
            className="flex h-11 items-center gap-3 rounded-xl px-3 text-[15px] font-medium text-[var(--color-text-tertiary)] hover:bg-black/[0.04] hover:text-[var(--color-text-primary)] dark:hover:bg-white/[0.06]"
          >
            <Settings size={18} />
            設定
          </Link>
        </div>
      </nav>
    </aside>
  );
}
