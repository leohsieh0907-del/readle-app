'use client';

import Link from 'next/link';
import { GraduationCap, ChevronRight, BookOpen, ListChecks } from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';
import { EXAM_COURSES } from '@/lib/exam/courses';

export default function ExamPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-5">
        <div className="flex items-center gap-2 text-2xl font-extrabold">
          <GraduationCap className="text-[#5B5BF0]" size={26} /> 考試準備
        </div>
        <p className="mt-1 text-sm text-[var(--color-text-tertiary)]">多益・全民英檢 — 課程教學 + 模擬練習，全部免費、零等待</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {EXAM_COURSES.map((c) => (
          <Link key={c.id} href={`/exam/${c.id}`} className="group">
            <GlassCard className="h-full overflow-hidden p-0 transition group-hover:shadow-hover">
              <div className={`bg-gradient-to-br ${c.gradient} p-5 text-white`}>
                <div className="text-3xl">{c.emoji}</div>
                <div className="mt-2 text-xl font-extrabold">{c.name}</div>
                <div className="mt-0.5 text-xs text-white/80">{c.tagline}</div>
              </div>
              <div className="p-4">
                <div className="flex items-center gap-4 text-xs text-[var(--color-text-secondary)]">
                  <span className="inline-flex items-center gap-1"><BookOpen size={13} /> {c.lessons.length} 堂課</span>
                  <span className="inline-flex items-center gap-1"><ListChecks size={13} /> {c.questions.length} 練習題</span>
                </div>
                <div className="mt-3 flex items-center justify-between text-sm font-semibold text-[#5B5BF0]">
                  開始學習
                  <ChevronRight size={16} className="transition group-hover:translate-x-1" />
                </div>
              </div>
            </GlassCard>
          </Link>
        ))}
      </div>
    </div>
  );
}
