'use client';

import { useEffect, useRef, useState } from 'react';
import type { SubtitleLine } from '@/lib/readle-types';

type DisplayMode = 'both' | 'en' | 'zh';

interface SubtitleTimelineProps {
  subtitles: SubtitleLine[];
  currentTime: number;
  onJumpTo: (t: number) => void;
}

export default function SubtitleTimeline({ subtitles, currentTime, onJumpTo }: SubtitleTimelineProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const activeIdx = subtitles.findIndex((s) => currentTime >= s.startSec && currentTime < s.endSec);
  const [mode, setMode] = useState<DisplayMode>('both');
  const hasZh = subtitles.some(s => s.zh);

  useEffect(() => {
    if (activeIdx < 0) return;
    const el = containerRef.current?.querySelector(`[data-idx="${activeIdx}"]`) as HTMLElement | null;
    el?.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }, [activeIdx]);

  const modeOptions: { id: DisplayMode; label: string }[] = [
    { id: 'both', label: '中英' },
    { id: 'en', label: '英文' },
    { id: 'zh', label: '中文' },
  ];

  if (subtitles.length === 0) {
    return (
      <div className="glass-card rounded-2xl p-5 text-center text-sm text-[var(--color-text-tertiary)]">
        字幕全文
        <div className="mt-2 text-xs">尚無字幕</div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="glass-card max-h-[420px] overflow-y-auto rounded-2xl p-2 lg:max-h-[560px]"
    >
      {/* 標題 + 切換按鈕 */}
      <div className="sticky top-0 z-10 flex items-center justify-between rounded-xl bg-white/70 px-3 py-2 backdrop-blur-sm">
        <span className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)]">
          字幕全文
        </span>
        {hasZh && (
          <div className="flex gap-1">
            {modeOptions.map(opt => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setMode(opt.id)}
                className={`h-6 rounded-full px-2 text-[10px] font-medium transition ${
                  mode === opt.id
                    ? 'bg-[#5B5BF0] text-white'
                    : 'text-[var(--color-text-tertiary)] hover:bg-black/5'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 字幕列表 */}
      <div className="mt-1 space-y-0.5">
        {subtitles.map((s, i) => {
          const active = i === activeIdx;
          return (
            <button
              key={i}
              type="button"
              data-idx={i}
              onClick={() => onJumpTo(s.startSec + 0.05)}
              className={`block w-full rounded-xl px-3 py-2.5 text-left transition ${
                active
                  ? 'bg-gradient-to-r from-[#7C7CFF]/15 to-[#5B5BF0]/8 ring-1 ring-inset ring-[#5B5BF0]/25'
                  : 'hover:bg-black/[0.04]'
              }`}
            >
              <div className="flex items-baseline gap-2">
                <span className="shrink-0 font-mono text-[10px] text-[var(--color-text-tertiary)]">
                  {fmt(s.startSec)}
                </span>
                <div className="min-w-0 flex-1">
                  {/* 英文 */}
                  {(mode === 'both' || mode === 'en') && (
                    <div className={`text-sm font-medium leading-snug ${active ? 'text-[#5B5BF0]' : ''}`}>
                      {s.en}
                    </div>
                  )}
                  {/* 中文 */}
                  {(mode === 'both' || mode === 'zh') && s.zh && (
                    <div className={`mt-0.5 text-xs leading-snug ${
                      mode === 'zh'
                        ? `text-sm font-medium ${active ? 'text-[#5B5BF0]' : 'text-[var(--color-text-primary)]'}`
                        : 'text-[var(--color-text-tertiary)]'
                    }`}>
                      {s.zh}
                    </div>
                  )}
                  {/* 中文 loading 中（英文有但中文空） */}
                  {(mode === 'both' || mode === 'zh') && !s.zh && (
                    <div className="mt-0.5 text-[10px] text-[var(--color-text-tertiary)] opacity-50">
                      …翻譯中
                    </div>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function fmt(sec: number) {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}
