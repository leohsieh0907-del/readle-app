'use client';

import { Play, Pause, RotateCcw, ChevronLeft, ChevronRight, Subtitles, Repeat, Mic } from 'lucide-react';
import type { SubtitleMode } from './DualSubtitle';

const SPEED_OPTIONS = [0.5, 0.75, 1.0, 1.25, 1.5, 1.75, 2.0];
const SUB_MODE_LABEL: Record<SubtitleMode, string> = {
  both: '中英',
  en: '僅英',
  zh: '僅中',
  off: '無',
};

interface PlayerControlsProps {
  playing: boolean;
  currentTime: number;
  duration: number;
  speed: number;
  subtitleMode: SubtitleMode;
  abMode: 'idle' | 'a-set' | 'b-set';
  followRead: boolean;
  onTogglePlay: () => void;
  onSeek: (t: number) => void;
  onSpeedChange: (s: number) => void;
  onSubtitleModeChange: (m: SubtitleMode) => void;
  onABToggle: () => void;
  onFollowReadToggle: () => void;
  onReplaySentence: () => void;
}

export default function PlayerControls({
  playing,
  currentTime,
  duration,
  speed,
  subtitleMode,
  abMode,
  followRead,
  onTogglePlay,
  onSeek,
  onSpeedChange,
  onSubtitleModeChange,
  onABToggle,
  onFollowReadToggle,
  onReplaySentence,
}: PlayerControlsProps) {
  const speedIdx = SPEED_OPTIONS.indexOf(speed);

  const slowDown = () => {
    if (speedIdx <= 0) return;
    onSpeedChange(SPEED_OPTIONS[speedIdx - 1]);
  };
  const speedUp = () => {
    if (speedIdx >= SPEED_OPTIONS.length - 1) return;
    onSpeedChange(SPEED_OPTIONS[speedIdx + 1]);
  };

  const cycleSubtitleMode = () => {
    const order: SubtitleMode[] = ['both', 'en', 'zh', 'off'];
    const idx = order.indexOf(subtitleMode);
    onSubtitleModeChange(order[(idx + 1) % order.length]);
  };

  return (
    <div className="glass-card mt-3 rounded-2xl p-3 sm:p-4">
      {/* 進度條 */}
      <div className="mb-3 flex items-center gap-3 px-1">
        <span className="w-10 shrink-0 font-mono text-xs text-[var(--color-text-secondary)]">
          {fmt(currentTime)}
        </span>
        <input
          type="range"
          min={0}
          max={duration}
          step={0.1}
          value={currentTime}
          onChange={(e) => onSeek(Number(e.target.value))}
          className="flex-1 accent-[#5B5BF0]"
        />
        <span className="w-10 shrink-0 text-right font-mono text-xs text-[var(--color-text-tertiary)]">
          {fmt(duration)}
        </span>
      </div>

      {/* 按鈕列 */}
      <div className="flex flex-wrap items-center gap-2">
        {/* 播放 / 暫停 */}
        <button
          type="button"
          onClick={onTogglePlay}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#7C7CFF] to-[#5B5BF0] text-white shadow-card transition hover:scale-105"
          title="播放 / 暫停（空白）"
        >
          {playing ? <Pause size={18} fill="white" /> : <Play size={18} fill="white" />}
        </button>

        {/* 重播本句 */}
        <button
          type="button"
          onClick={onReplaySentence}
          className="btn-ghost flex h-10 items-center gap-1.5 rounded-xl px-3 text-sm"
          title="重播本句（R）"
        >
          <RotateCcw size={16} /> 重播
        </button>

        {/* 語速 — 左右箭頭 */}
        <div className="flex h-10 items-center rounded-xl bg-white/50 ring-1 ring-inset ring-black/5">
          <button
            type="button"
            onClick={slowDown}
            disabled={speedIdx <= 0}
            className="flex h-full items-center px-2 text-[var(--color-text-secondary)] transition hover:text-[#5B5BF0] disabled:opacity-25"
            title="減慢"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="min-w-[46px] text-center font-mono text-xs font-semibold text-[var(--color-text-primary)]">
            {speed.toFixed(2)}x
          </span>
          <button
            type="button"
            onClick={speedUp}
            disabled={speedIdx >= SPEED_OPTIONS.length - 1}
            className="flex h-full items-center px-2 text-[var(--color-text-secondary)] transition hover:text-[#5B5BF0] disabled:opacity-25"
            title="加快"
          >
            <ChevronRight size={16} />
          </button>
        </div>

        {/* 字幕模式 */}
        <button
          type="button"
          onClick={cycleSubtitleMode}
          className="btn-ghost flex h-10 items-center gap-1.5 rounded-xl px-3 text-sm"
          title="切換字幕模式"
        >
          <Subtitles size={16} /> {SUB_MODE_LABEL[subtitleMode]}
        </button>

        {/* AB Repeat */}
        <button
          type="button"
          onClick={onABToggle}
          className={`flex h-10 items-center gap-1.5 rounded-xl px-3 text-sm font-medium ${
            abMode === 'idle'
              ? 'btn-ghost'
              : 'bg-[#FFB84D]/20 text-[#FF9A1F] ring-1 ring-inset ring-[#FFB84D]/40'
          }`}
          title="A-B 循環"
        >
          <Repeat size={16} />
          {abMode === 'idle' ? 'A-B' : abMode === 'a-set' ? '設定 B' : '循環中'}
        </button>

        {/* 跟讀 */}
        <button
          type="button"
          onClick={onFollowReadToggle}
          className={`flex h-10 items-center gap-1.5 rounded-xl px-3 text-sm font-medium ${
            followRead
              ? 'bg-gradient-to-r from-[#FF6B9D] to-[#D946EF] text-white shadow-card'
              : 'btn-ghost'
          }`}
          title="跟讀模式"
        >
          <Mic size={16} /> 跟讀
        </button>
      </div>
    </div>
  );
}

function fmt(sec: number) {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}
