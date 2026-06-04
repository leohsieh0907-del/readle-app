'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, PlayCircle, ClipboardCheck, User } from 'lucide-react';

const items = [
  { href: '/', label: '首頁', icon: Home },
  { href: '/learn/videos', label: '學習', icon: PlayCircle },
  { href: '/quiz', label: '測驗', icon: ClipboardCheck },
  { href: '/me', label: '我的', icon: User },
];

export default function MobileTabBar() {
  const pathname = usePathname();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 px-3 pb-3 lg:hidden">
      <div className="glass-strong mx-auto flex h-16 max-w-md items-center justify-around rounded-2xl px-2">
        {items.map(({ href, label, icon: Icon }) => {
          const active = href === '/' ? pathname === '/' : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-1 flex-col items-center justify-center gap-0.5 py-1.5 text-[11px] font-medium transition ${
                active
                  ? 'text-[#5B5BF0]'
                  : 'text-[var(--color-text-tertiary)]'
              }`}
            >
              <Icon size={22} strokeWidth={active ? 2.5 : 2} />
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
