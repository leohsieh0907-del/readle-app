'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  PlayCircle,
  Bot,
  ClipboardCheck,
  User,
  Settings,
  BookOpen,
  Captions,
  FileText,
} from 'lucide-react';

const items = [
  { href: '/', label: '首頁', icon: Home },
  { href: '/learn/videos', label: '影片學習', icon: PlayCircle },
  { href: '/learn/videos/subtitle-gen', label: '字幕產生器', icon: Captions },
  { href: '/learn/articles', label: '文章閱讀', icon: FileText },
  { href: '/learn/vocab', label: '單字本', icon: BookOpen },
  { href: '/ai', label: 'AI 助教', icon: Bot },
  { href: '/quiz', label: '測驗', icon: ClipboardCheck },
  { href: '/me', label: '我的', icon: User },
];

export default function SideNav() {
  const pathname = usePathname();

  return (
    <aside className="sticky top-24 hidden h-[calc(100vh-7rem)] w-56 shrink-0 px-2 lg:block">
      <nav className="glass-card flex h-full flex-col gap-1 rounded-2xl p-3">
        {items.map(({ href, label, icon: Icon }) => {
          const active =
            href === '/' ? pathname === '/' : pathname.startsWith(href);
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
        <div className="mt-auto">
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
