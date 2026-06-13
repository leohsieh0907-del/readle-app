'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Search, Sparkles } from 'lucide-react';
import StreakFlame from '@/components/ui/StreakFlame';
import SearchPanel from '@/components/nav/SearchPanel';
import { progressRepo, userRepo } from '@/lib/storage/repos';

export default function TopBar() {
  const [nickname, setNickname] = useState('');
  const [avatar, setAvatar] = useState('🦉');
  const [streak, setStreak] = useState(0);
  const [xp, setXP] = useState(0);
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    const u = userRepo.get();
    const p = progressRepo.get();
    setNickname(u.nickname);
    setAvatar(u.avatar);
    setStreak(p.currentStreak);
    setXP(p.totalXP);
  }, []);

  // ⌘K / Ctrl+K 開啟搜尋（只在 AI 助教沒開著的時候）
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        const aiPanel = document.querySelector('aside[class*="fixed"]');
        if (aiPanel) return; // AI 助教已開，讓它處理
        e.preventDefault();
        setSearchOpen(v => !v);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  return (
    <>
      <header className="sticky top-0 z-40 bg-[#FAFAFC]/95 px-4 pt-3 pb-2 backdrop-blur-md sm:px-6">
        <div className="mx-auto flex h-12 max-w-7xl items-center justify-between rounded-2xl bg-white px-4 shadow-[0_2px_12px_rgba(15,15,25,0.06)] ring-1 ring-inset ring-black/[0.04] sm:px-5">
          <Link href="/" className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-[#7C7CFF] to-[#5B5BF0] text-white shadow-card">
              <Sparkles size={16} strokeWidth={2.5} />
            </span>
            <span className="text-[15px] font-bold tracking-tight">Happy English</span>
          </Link>

          {/* 桌面版搜尋框 */}
          <div className="mx-4 hidden flex-1 max-w-md md:block">
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className="flex h-9 w-full cursor-text items-center gap-2 rounded-full bg-[#F5F5FA] px-3.5 text-sm text-[var(--color-text-tertiary)] ring-1 ring-inset ring-black/[0.05] transition hover:bg-[#EDEDF5] hover:text-[var(--color-text-secondary)]"
            >
              <Search size={15} />
              <span className="flex-1 text-left">搜尋影片、單字、文章…</span>
              <kbd className="hidden rounded-md bg-black/[0.06] px-1.5 py-0.5 font-mono text-[10px] sm:block">
                ⌘K
              </kbd>
            </button>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* 手機版搜尋 icon */}
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className="flex h-9 w-9 items-center justify-center rounded-full text-[var(--color-text-secondary)] hover:bg-black/5 md:hidden"
            >
              <Search size={18} />
            </button>

            <StreakFlame days={streak} size="sm" />
            <div className="hidden items-center gap-1 rounded-full bg-[#FFB84D]/12 px-2.5 py-1 text-sm font-semibold text-[#FF9A1F] ring-1 ring-inset ring-[#FFB84D]/25 sm:inline-flex">
              ⭐ {xp.toLocaleString()}
            </div>
            <Link
              href="/me"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-[#7C7CFF]/20 to-[#5B5BF0]/20 text-lg ring-1 ring-inset ring-[#5B5BF0]/30"
              title={nickname || 'Profile'}
            >
              {avatar}
            </Link>
          </div>
        </div>
      </header>

      <SearchPanel open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
