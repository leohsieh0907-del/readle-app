'use client';

import { useEffect, useState } from 'react';
import TopBar from '@/components/nav/TopBar';
import SideNav from '@/components/nav/SideNav';
import MobileTabBar from '@/components/nav/MobileTabBar';
import AITutor from '@/components/ai-tutor/AITutor';
import Onboarding from '@/components/onboarding/Onboarding';
import GlobalWordLookup from '@/components/GlobalWordLookup';
import { hasOnboarded } from '@/lib/storage/repos';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [needOnboarding, setNeedOnboarding] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setNeedOnboarding(!hasOnboarded());
  }, []);

  return (
    <>
      <TopBar />
      <div className="mx-auto flex max-w-7xl gap-4 px-4 pt-4 sm:px-6">
        <SideNav />
        <main className="min-w-0 flex-1 pb-28 lg:pb-12">{children}</main>
      </div>
      <MobileTabBar />
      <AITutor />
      <GlobalWordLookup />
      {mounted && needOnboarding && (
        <Onboarding onDone={() => setNeedOnboarding(false)} />
      )}
    </>
  );
}
