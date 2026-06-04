'use client';

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';

/* ---------- YouTube IFrame API 最小型別 ---------- */
interface YTPlayer {
  playVideo(): void;
  pauseVideo(): void;
  seekTo(seconds: number, allowSeekAhead: boolean): void;
  setPlaybackRate(rate: number): void;
  getCurrentTime(): number;
  getDuration(): number;
  getPlayerState(): number;
  destroy(): void;
}
interface YTNamespace {
  Player: new (
    el: HTMLElement | string,
    opts: {
      videoId: string;
      playerVars?: Record<string, number | string>;
      events?: {
        onReady?: () => void;
        onStateChange?: (e: { data: number }) => void;
      };
    },
  ) => YTPlayer;
  PlayerState: { PLAYING: number; PAUSED: number; ENDED: number };
}
declare global {
  interface Window {
    YT?: YTNamespace;
    onYouTubeIframeAPIReady?: () => void;
  }
}

export interface YouTubeHandle {
  play(): void;
  pause(): void;
  seek(t: number): void;
  setRate(r: number): void;
}

interface YouTubePlayerProps {
  youtubeId: string;
  onTimeUpdate: (t: number) => void;
  onPlayingChange: (playing: boolean) => void;
  onDuration?: (d: number) => void;
  onReady?: () => void;
}

let apiLoading: Promise<void> | null = null;

function loadAPI(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve();
  if (window.YT && window.YT.Player) return Promise.resolve();
  if (apiLoading) return apiLoading;
  apiLoading = new Promise<void>((resolve) => {
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    document.head.appendChild(tag);
    window.onYouTubeIframeAPIReady = () => resolve();
  });
  return apiLoading;
}

const YouTubePlayer = forwardRef<YouTubeHandle, YouTubePlayerProps>(function YouTubePlayer(
  { youtubeId, onTimeUpdate, onPlayingChange, onDuration, onReady },
  ref,
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YTPlayer | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [loading, setLoading] = useState(true);

  useImperativeHandle(ref, () => ({
    play: () => playerRef.current?.playVideo(),
    pause: () => playerRef.current?.pauseVideo(),
    seek: (t: number) => playerRef.current?.seekTo(t, true),
    setRate: (r: number) => playerRef.current?.setPlaybackRate(r),
  }));

  useEffect(() => {
    let cancelled = false;
    loadAPI().then(() => {
      if (cancelled || !containerRef.current || !window.YT) return;
      playerRef.current = new window.YT.Player(containerRef.current, {
        videoId: youtubeId,
        playerVars: {
          rel: 0,
          modestbranding: 1,
          cc_load_policy: 0,
          playsinline: 1,
        },
        events: {
          onReady: () => {
            setLoading(false);
            onReady?.();
            const d = playerRef.current?.getDuration() ?? 0;
            if (d) onDuration?.(d);
          },
          onStateChange: (e) => {
            const YT = window.YT!;
            if (e.data === YT.PlayerState.PLAYING) {
              onPlayingChange(true);
              startPoll();
            } else if (e.data === YT.PlayerState.PAUSED || e.data === YT.PlayerState.ENDED) {
              onPlayingChange(false);
              stopPoll();
            }
          },
        },
      });
    });

    function startPoll() {
      stopPoll();
      pollRef.current = setInterval(() => {
        const t = playerRef.current?.getCurrentTime?.();
        if (typeof t === 'number') onTimeUpdate(t);
      }, 150);
    }
    function stopPoll() {
      if (pollRef.current) clearInterval(pollRef.current);
      pollRef.current = null;
    }

    return () => {
      cancelled = true;
      stopPoll();
      playerRef.current?.destroy();
      playerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [youtubeId]);

  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-black">
      <div ref={containerRef} className="h-full w-full" />
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[#7C7CFF] to-[#5B5BF0]">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-white/30 border-t-white" />
        </div>
      )}
    </div>
  );
});

export default YouTubePlayer;
