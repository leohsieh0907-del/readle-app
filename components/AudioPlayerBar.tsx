'use client';

import { Play, Pause, Gauge } from 'lucide-react';

const SPEEDS = [0.8, 1.0, 1.2] as const;
export type PlaybackSpeed = (typeof SPEEDS)[number];

function formatTime(s: number): string {
  if (!isFinite(s) || s < 0) s = 0;
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

export interface AudioPlayerBarProps {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  speed: PlaybackSpeed;
  onTogglePlay: () => void;
  onSeek: (seconds: number) => void;
  onSpeedChange: (speed: PlaybackSpeed) => void;
}

export default function AudioPlayerBar({
  isPlaying,
  currentTime,
  duration,
  speed,
  onTogglePlay,
  onSeek,
  onSpeedChange,
}: AudioPlayerBarProps) {
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-stone-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-3xl items-center gap-4 px-4 py-3">
        <button
          type="button"
          onClick={onTogglePlay}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-stone-900 text-white transition hover:bg-stone-700"
          aria-label={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? (
            <Pause className="h-5 w-5" />
          ) : (
            <Play className="h-5 w-5 translate-x-0.5" />
          )}
        </button>

        <div className="flex flex-1 items-center gap-3">
          <span className="font-mono text-xs tabular-nums text-stone-600">
            {formatTime(currentTime)}
          </span>
          <input
            type="range"
            min={0}
            max={duration || 0}
            step={0.1}
            value={currentTime}
            onChange={(e) => onSeek(Number(e.target.value))}
            className="flex-1 accent-stone-900"
            style={{
              background: `linear-gradient(to right, #1c1917 0%, #1c1917 ${progress}%, #e7e5e4 ${progress}%, #e7e5e4 100%)`,
              height: 4,
              borderRadius: 4,
              appearance: 'none',
              outline: 'none',
            }}
            aria-label="Seek"
          />
          <span className="font-mono text-xs tabular-nums text-stone-600">
            {formatTime(duration)}
          </span>
        </div>

        <div className="flex items-center gap-1 rounded-full bg-stone-100 p-1">
          <Gauge className="ml-1.5 h-3.5 w-3.5 text-stone-500" />
          {SPEEDS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => onSpeedChange(s)}
              className={`rounded-full px-2 py-0.5 text-xs font-semibold transition ${
                speed === s
                  ? 'bg-stone-900 text-white'
                  : 'text-stone-600 hover:bg-stone-200'
              }`}
            >
              {s.toFixed(1)}×
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export { SPEEDS };
