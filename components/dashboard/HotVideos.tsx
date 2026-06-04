'use client';

import Link from 'next/link';
import { Play, Eye } from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';
import type { MockVideo } from '@/lib/readle-types';

const gradients: Record<string, string> = {
  'gradient-1': 'from-[#7C7CFF] via-[#5B5BF0] to-[#FF6B9D]',
  'gradient-2': 'from-[#10B981] via-[#06B6D4] to-[#3B82F6]',
  'gradient-3': 'from-[#FFB84D] via-[#FF6B6B] to-[#D946EF]',
  'gradient-4': 'from-[#8B5CF6] via-[#6366F1] to-[#06B6D4]',
  'gradient-5': 'from-[#F59E0B] via-[#FB923C] to-[#F87171]',
};

function formatDuration(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

interface HotVideosProps {
  videos: MockVideo[];
}

export default function HotVideos({ videos }: HotVideosProps) {
  const [big, ...rest] = videos;
  if (!big) return null;

  return (
    <section>
      <div className="mb-3 flex items-end justify-between px-1">
        <div>
          <h2 className="text-lg font-bold tracking-tight">🔥 熱門影片</h2>
          <p className="text-xs text-[var(--color-text-tertiary)]">
            今週最多人看的英文學習影片
          </p>
        </div>
        <Link
          href="/learn/videos"
          className="text-sm font-medium text-[#5B5BF0] hover:underline"
        >
          看全部 →
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Link
          href={`/learn/videos/${big.id}`}
          className="group sm:col-span-2 sm:row-span-2"
        >
          <GlassCard className="overflow-hidden p-0 transition group-hover:shadow-hover">
            <div
              className={`relative flex aspect-video items-center justify-center bg-gradient-to-br ${gradients[big.thumbnail]}`}
            >
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/30 backdrop-blur-md transition group-hover:scale-110">
                <Play size={28} fill="white" color="white" />
              </div>
              <div className="absolute bottom-2 right-2 rounded-md bg-black/50 px-2 py-0.5 text-xs font-mono text-white">
                {formatDuration(big.durationSec)}
              </div>
              <div className="absolute left-3 top-3 rounded-full bg-white/85 px-2 py-0.5 text-[10px] font-bold uppercase text-[#5B5BF0]">
                {big.level}
              </div>
            </div>
            <div className="p-4">
              <h3 className="font-bold leading-snug line-clamp-2">{big.title}</h3>
              <p className="mt-1 text-sm text-[var(--color-text-secondary)] line-clamp-2">
                {big.titleZh}
              </p>
              <div className="mt-3 flex items-center gap-3 text-xs text-[var(--color-text-tertiary)]">
                <span className="inline-flex items-center gap-1">
                  <Eye size={12} /> {big.views.toLocaleString()}
                </span>
              </div>
            </div>
          </GlassCard>
        </Link>

        {rest.slice(0, 2).map((v) => (
          <Link key={v.id} href={`/learn/videos/${v.id}`} className="group">
            <GlassCard className="flex h-full gap-3 overflow-hidden p-3 transition group-hover:shadow-hover sm:block sm:p-0">
              <div
                className={`relative flex h-20 w-28 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${gradients[v.thumbnail]} sm:h-auto sm:w-full sm:rounded-none sm:aspect-video`}
              >
                <Play size={20} fill="white" color="white" className="opacity-90" />
                <div className="absolute bottom-1 right-1 rounded bg-black/50 px-1.5 py-0.5 text-[10px] font-mono text-white">
                  {formatDuration(v.durationSec)}
                </div>
              </div>
              <div className="min-w-0 sm:p-3">
                <h3 className="text-sm font-semibold leading-snug line-clamp-2">{v.title}</h3>
                <p className="mt-0.5 text-xs text-[var(--color-text-tertiary)] line-clamp-1">
                  {v.titleZh}
                </p>
              </div>
            </GlassCard>
          </Link>
        ))}
      </div>
    </section>
  );
}
