'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Play, Pause } from 'lucide-react';
import type { MockVideo } from '@/lib/readle-types';

const gradients: Record<string, string> = {
  'gradient-1': 'from-[#7C7CFF] via-[#5B5BF0] to-[#FF6B9D]',
  'gradient-2': 'from-[#10B981] via-[#06B6D4] to-[#3B82F6]',
  'gradient-3': 'from-[#FFB84D] via-[#FF6B6B] to-[#D946EF]',
  'gradient-4': 'from-[#8B5CF6] via-[#6366F1] to-[#06B6D4]',
  'gradient-5': 'from-[#F59E0B] via-[#FB923C] to-[#F87171]',
};

interface MockVideoPlayerProps {
  video: MockVideo;
  currentTime: number;
  playing: boolean;
  speed: number;
  onTimeUpdate: (t: number) => void;
  onPlayingChange: (playing: boolean) => void;
}

/**
 * 模擬影片播放器 — 沒有真實影片源，只用漸層背景 + 時間軸 ticker
 * 顯示中央 Play/Pause 與大時間碼
 */
export default function MockVideoPlayer({
  video,
  currentTime,
  playing,
  speed,
  onTimeUpdate,
  onPlayingChange,
}: MockVideoPlayerProps) {
  const rafRef = useRef<number | null>(null);
  const lastTickRef = useRef<number>(0);
  const [showControls, setShowControls] = useState(true);

  // ticker：每幀依速度推進 currentTime
  useEffect(() => {
    if (!playing) {
      lastTickRef.current = 0;
      return;
    }
    const tick = (ts: number) => {
      if (lastTickRef.current === 0) lastTickRef.current = ts;
      const dt = (ts - lastTickRef.current) / 1000;
      lastTickRef.current = ts;
      const next = currentTime + dt * speed;
      if (next >= video.durationSec) {
        onTimeUpdate(video.durationSec);
        onPlayingChange(false);
      } else {
        onTimeUpdate(next);
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, speed]);

  // 同步外部 currentTime 變動時 reset tick
  useEffect(() => {
    lastTickRef.current = 0;
  }, [currentTime]);

  const toggle = useCallback(() => {
    if (currentTime >= video.durationSec) {
      onTimeUpdate(0);
      onPlayingChange(true);
    } else {
      onPlayingChange(!playing);
    }
  }, [currentTime, video.durationSec, playing, onTimeUpdate, onPlayingChange]);

  // 滑鼠進入顯示控制
  useEffect(() => {
    if (!playing) {
      setShowControls(true);
      return;
    }
    const timer = setTimeout(() => setShowControls(false), 2000);
    return () => clearTimeout(timer);
  }, [playing, currentTime]);

  return (
    <div
      onMouseMove={() => setShowControls(true)}
      onClick={toggle}
      className={`relative aspect-video w-full overflow-hidden rounded-2xl bg-gradient-to-br ${gradients[video.thumbnail] ?? gradients['gradient-1']} cursor-pointer select-none`}
    >
      {/* 模擬動態效果：漂浮光斑 */}
      <div className="absolute inset-0 opacity-60">
        <div className="absolute h-40 w-40 animate-pulse rounded-full bg-white/30 blur-3xl" style={{ top: '20%', left: '15%' }} />
        <div className="absolute h-32 w-32 animate-pulse rounded-full bg-white/20 blur-2xl" style={{ top: '60%', right: '20%', animationDelay: '1s' }} />
      </div>

      {/* 中央大時間碼（標示 Mock 模式）*/}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
        <div className="font-mono text-5xl font-bold tracking-tight drop-shadow-lg sm:text-6xl">
          {formatTime(currentTime)}
        </div>
        <div className="mt-1 text-xs uppercase tracking-widest text-white/70">
          {video.level} · Mock Mode
        </div>
      </div>

      {/* 中央 Play 按鈕 */}
      <div
        className={`absolute inset-0 flex items-center justify-center transition ${
          showControls || !playing ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white/25 backdrop-blur-md transition hover:scale-110">
          {playing ? <Pause size={36} fill="white" color="white" /> : <Play size={36} fill="white" color="white" />}
        </div>
      </div>

      {/* 進度條 */}
      <div className="absolute inset-x-0 bottom-0 h-1 bg-white/20">
        <div
          className="h-full bg-white/90"
          style={{ width: `${(currentTime / video.durationSec) * 100}%` }}
        />
      </div>
    </div>
  );
}

function formatTime(sec: number) {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}
