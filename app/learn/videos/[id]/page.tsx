'use client';

import { use, useEffect, useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, BookOpen } from 'lucide-react';
import { findVideo } from '@/lib/mock/seed-videos';
import GlassCard from '@/components/ui/GlassCard';
import MockVideoPlayer from '@/components/video/MockVideoPlayer';
import YouTubePlayer, { type YouTubeHandle } from '@/components/video/YouTubePlayer';
import DualSubtitle, { type SubtitleMode } from '@/components/video/DualSubtitle';
import PlayerControls from '@/components/video/PlayerControls';
import SubtitleTimeline from '@/components/video/SubtitleTimeline';
import FollowReadPanel from '@/components/video/FollowReadPanel';
import WordPopup from '@/components/video/WordPopup';
import type { SubtitleLine } from '@/lib/readle-types';

const SUBTITLE_CACHE_PREFIX = 'readle.subs.';

export default function VideoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  // 支援 YouTube 搜尋結果（id 格式：yt-YOUTUBE_ID）
  const isYTSearch = id.startsWith('yt-');
  const ytSearchId = isYTSearch ? id.slice(3) : null;

  const video = isYTSearch
    ? ({
        id,
        youtubeId: ytSearchId!,
        title: 'YouTube 影片',
        titleZh: '（字幕自動生成中…）',
        durationSec: 0,
        level: 'B1' as const,
        category: 'daily' as const,
        thumbnail: 'gradient-1',
        views: 0,
        keyWords: [],
        subtitles: [],
      })
    : findVideo(id);

  if (!video) notFound();

  const isYouTube = !!video.youtubeId;
  const ytRef = useRef<YouTubeHandle>(null);

  const [currentTime, setCurrentTime] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1.0);
  const [duration, setDuration] = useState(video.durationSec);
  // 預設關閉浮層字幕（旁邊字幕面板已有中英對照）；要開自己切，且記住選擇
  const [subtitleMode, setSubtitleMode] = useState<SubtitleMode>('off');
  useEffect(() => {
    const saved = window.localStorage.getItem('readle.subtitle_mode') as SubtitleMode | null;
    if (saved && ['both', 'en', 'zh', 'off'].includes(saved)) setSubtitleMode(saved);
  }, []);
  const changeSubtitleMode = (m: SubtitleMode) => {
    setSubtitleMode(m);
    window.localStorage.setItem('readle.subtitle_mode', m);
  };

  // 字幕：先用 JSON 裡的，沒有就自動抓（含 YouTube 搜尋結果）
  const [subtitles, setSubtitles] = useState<SubtitleLine[]>(video.subtitles ?? []);
  const [subLoading, setSubLoading] = useState(false);
  const [subError, setSubError] = useState<string | null>(null);
  const [videoTitle, setVideoTitle] = useState(video.title);
  const [videoTitleZh, setVideoTitleZh] = useState(video.titleZh);
  const [keywords, setKeywords] = useState<string[]>(video.keyWords ?? []);
  const cachedTitleRef = useRef<string>('');

  /** 抓字幕（可手動觸發）— 會先確認影片標題再生成 */
  const fetchSubtitles = useCallback(async (force = false) => {
    if (!video.youtubeId) return;
    const cacheKey = SUBTITLE_CACHE_PREFIX + video.youtubeId;

    if (!force) {
      // 非強制時先查快取
      try {
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
          const parsed = JSON.parse(cached) as SubtitleLine[];
          if (parsed.length > 0) { setSubtitles(parsed); return; }
        }
      } catch { /* ignore */ }
    }

    setSubLoading(true);
    setSubError(null);

    try {
      // Step 1：取得真實影片標題（搜尋結果才需要）
      let ytTitle = cachedTitleRef.current || videoTitle;
      if (isYTSearch && (!ytTitle || ytTitle === 'YouTube 影片')) {
        try {
          const metaRes = await fetch(`/api/video-meta?v=${video.youtubeId}`);
          if (metaRes.ok) {
            const meta = await metaRes.json() as { title?: string; titleZh?: string };
            if (meta.title) {
              ytTitle = meta.title;
              cachedTitleRef.current = meta.title;
              setVideoTitle(meta.title);
            }
            if (meta.titleZh) setVideoTitleZh(meta.titleZh);
          }
        } catch { /* ignore */ }
      }

      // Step 2：生成字幕（YouTube 抓取 → timedtext → Gemini 依標題生成）
      // explain=1 同時提取重點字
      const res = await fetch(
        `/api/subtitles?v=${video.youtubeId}&title=${encodeURIComponent(ytTitle)}&explain=1`
      );
      const data = await res.json() as {
        subtitles?: SubtitleLine[];
        keyWords?: { word: string; zh: string; pos: string }[];
        error?: string;
        reason?: string;
      };

      if (data.subtitles && data.subtitles.length > 0) {
        setSubtitles(data.subtitles);
        try { localStorage.setItem(cacheKey, JSON.stringify(data.subtitles)); } catch { /* quota */ }
        setSubError(null);
        if (data.keyWords && data.keyWords.length > 0) {
          setKeywords(data.keyWords.map(k => k.word));
        }
      } else {
        setSubError(data.reason ?? data.error ?? '字幕不可用');
      }
    } catch {
      setSubError('字幕載入失敗，請稍後再試');
    } finally {
      setSubLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [video.youtubeId, videoTitle, isYTSearch]);

  useEffect(() => {
    if (!video.youtubeId || subtitles.length > 0) return;
    fetchSubtitles(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [video.youtubeId]);
  const [abPoints, setAbPoints] = useState<{ a?: number; b?: number }>({});
  const [followRead, setFollowRead] = useState(false);
  const [followTarget, setFollowTarget] = useState<number | null>(null);
  const [wordPopup, setWordPopup] = useState<string | null>(null);

  const abMode: 'idle' | 'a-set' | 'b-set' =
    abPoints.a == null ? 'idle' : abPoints.b == null ? 'a-set' : 'b-set';

  /** 統一播放控制（YouTube 用 ref，mock 用 state） */
  const startPlayback = useCallback(() => {
    if (isYouTube) ytRef.current?.play();
    else setPlaying(true);
  }, [isYouTube]);
  const pausePlayback = useCallback(() => {
    if (isYouTube) ytRef.current?.pause();
    else setPlaying(false);
  }, [isYouTube]);
  const togglePlay = useCallback(() => {
    if (playing) pausePlayback();
    else startPlayback();
  }, [playing, pausePlayback, startPlayback]);

  /** 取得當前句索引 */
  const activeIdx = subtitles.findIndex(
    (s) => currentTime >= s.startSec && currentTime < s.endSec,
  );

  /** AB Repeat 自動循環 */
  useEffect(() => {
    if (abMode !== 'b-set' || !playing) return;
    if (abPoints.b != null && currentTime >= abPoints.b) {
      const a = abPoints.a ?? 0;
      setCurrentTime(a);
      if (isYouTube) ytRef.current?.seek(a);
    }
  }, [currentTime, abMode, abPoints, playing, isYouTube]);

  /** 跟讀模式：到達句尾自動暫停 */
  const lastTriggeredRef = useRef<number>(-1);
  useEffect(() => {
    if (!followRead || followTarget != null) return;
    const cur = subtitles[activeIdx];
    if (!cur) return;
    // 句尾 0.2s 內觸發
    if (currentTime >= cur.endSec - 0.15 && lastTriggeredRef.current !== activeIdx) {
      lastTriggeredRef.current = activeIdx;
      pausePlayback();
      setFollowTarget(activeIdx);
    }
  }, [currentTime, followRead, activeIdx, subtitles, followTarget, pausePlayback]);

  /** 跳到指定時間 */
  const seekTo = useCallback((t: number) => {
    setCurrentTime(t);
    lastTriggeredRef.current = -1;
    if (isYouTube) ytRef.current?.seek(t);
  }, [isYouTube]);

  /** AB 按鈕邏輯 */
  const handleAB = () => {
    if (abMode === 'idle') {
      setAbPoints({ a: currentTime });
    } else if (abMode === 'a-set') {
      setAbPoints((p) => ({ ...p, b: currentTime }));
    } else {
      setAbPoints({});
    }
  };

  /** 速度切換（同步給 YouTube） */
  const changeSpeed = useCallback((s: number) => {
    setSpeed(s);
    if (isYouTube) ytRef.current?.setRate(s);
  }, [isYouTube]);

  /** 重播本句 */
  const replaySentence = useCallback(() => {
    const cur = subtitles[activeIdx];
    if (cur) seekTo(cur.startSec + 0.05);
  }, [subtitles, activeIdx, seekTo]);

  /** 跟讀完成跳到下一句 */
  const followNext = () => {
    if (followTarget != null) {
      const nextIdx = followTarget + 1;
      const next = subtitles[nextIdx];
      if (next) {
        seekTo(next.startSec + 0.05);
      }
    }
    setFollowTarget(null);
    startPlayback();
  };

  /** 鍵盤快捷鍵 */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.code === 'Space') {
        e.preventDefault();
        togglePlay();
      } else if (e.code === 'ArrowLeft') {
        seekTo(Math.max(0, currentTime - 5));
      } else if (e.code === 'ArrowRight') {
        seekTo(Math.min(duration, currentTime + 5));
      } else if (e.key.toLowerCase() === 'r') {
        replaySentence();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [currentTime, replaySentence, duration, togglePlay, seekTo]);

  return (
    <div className="space-y-4">
      <Link
        href="/learn/videos"
        className="inline-flex items-center gap-1 text-sm text-[var(--color-text-secondary)] hover:text-[#5B5BF0]"
      >
        <ArrowLeft size={14} /> 回到影片列表
      </Link>

      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <div>
          {/* 播放器 + 字幕 overlay */}
          <div className="relative">
            {isYouTube ? (
              <YouTubePlayer
                ref={ytRef}
                youtubeId={video.youtubeId!}
                onTimeUpdate={setCurrentTime}
                onPlayingChange={setPlaying}
                onDuration={setDuration}
              />
            ) : (
              <MockVideoPlayer
                video={video}
                currentTime={currentTime}
                playing={playing}
                speed={speed}
                onTimeUpdate={setCurrentTime}
                onPlayingChange={setPlaying}
              />
            )}
            {/* 字幕載入中提示 */}
            {subLoading && (
              <div className="absolute left-1/2 top-4 z-20 -translate-x-1/2 rounded-full bg-black/60 px-3 py-1 text-xs text-white backdrop-blur-sm">
                ⏳ 字幕生成中…
              </div>
            )}
            <DualSubtitle
              subtitles={subtitles}
              currentTime={currentTime}
              mode={subtitleMode}
              videoId={video.id}
            />
            {/* AB 標記 */}
            {abPoints.a != null && (
              <div
                className="absolute bottom-0 z-20 h-2 w-1 bg-[#FFB84D] ring-1 ring-white"
                style={{ left: `${(abPoints.a / duration) * 100}%` }}
                title="A 點"
              />
            )}
            {abPoints.b != null && (
              <div
                className="absolute bottom-0 z-20 h-2 w-1 bg-[#FFB84D] ring-1 ring-white"
                style={{ left: `${(abPoints.b / duration) * 100}%` }}
                title="B 點"
              />
            )}
          </div>

          <PlayerControls
            playing={playing}
            currentTime={currentTime}
            duration={duration}
            speed={speed}
            subtitleMode={subtitleMode}
            abMode={abMode}
            followRead={followRead}
            onTogglePlay={togglePlay}
            onSeek={seekTo}
            onSpeedChange={changeSpeed}
            onSubtitleModeChange={changeSubtitleMode}
            onABToggle={handleAB}
            onFollowReadToggle={() => setFollowRead((v) => !v)}
            onReplaySentence={replaySentence}
          />

          {/* AB 提示 */}
          {abMode !== 'idle' && (
            <div className="mt-2 rounded-xl bg-[#FFB84D]/10 px-3 py-2 text-xs text-[#9A6B12] ring-1 ring-inset ring-[#FFB84D]/30">
              {abMode === 'a-set' && '已標記 A 點，再按一次 A-B 設定 B 點'}
              {abMode === 'b-set' && `A-B 循環中：${fmt(abPoints.a ?? 0)} ↔ ${fmt(abPoints.b ?? 0)}（再按取消）`}
            </div>
          )}

          {/* 影片資訊 */}
          <GlassCard className="mt-4 p-5">
            <h1 className="text-xl font-bold leading-tight">{videoTitle || video.title}</h1>
            {(videoTitleZh || video.titleZh) && (
              <p className="mt-1 text-sm text-[var(--color-text-secondary)]">{videoTitleZh || video.titleZh}</p>
            )}
            <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-[var(--color-text-tertiary)]">
              <span>{video.views.toLocaleString()} 次觀看</span>
              <span>·</span>
              <span>等級 {video.level}</span>
              <span>·</span>
              <span>{fmt(duration)}</span>
            </div>
            {subError && !subLoading && (
              <div className="mt-3 rounded-xl bg-[#FFB84D]/10 px-4 py-3 ring-1 ring-inset ring-[#FFB84D]/20">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-xs text-[#9A6B12]">
                    <span className="font-medium">字幕尚未生成</span>
                    <span className="ml-1 opacity-70">（YouTube 鎖定字幕，將改用 AI 依影片主題生成）</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => fetchSubtitles(true)}
                    disabled={subLoading}
                    className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#FFB84D] to-[#FF9A1F] px-3 py-1.5 text-xs font-semibold text-white shadow-card transition hover:scale-105 disabled:opacity-50"
                  >
                    <span>✨</span> 一鍵生成字幕
                  </button>
                </div>
              </div>
            )}
            {subLoading && !subtitles.length && (
              <div className="mt-3 flex items-center gap-2 rounded-xl bg-[#5B5BF0]/8 px-4 py-3 text-xs text-[#5B5BF0] ring-1 ring-inset ring-[#5B5BF0]/15">
                <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-[#5B5BF0]/30 border-t-[#5B5BF0]" />
                AI 正在生成字幕（約 15-30 秒）…
              </div>
            )}
            <div className="mt-3 text-xs text-[var(--color-text-tertiary)]">
              💡 快捷鍵：<kbd className="font-mono">空白</kbd> 播放／暫停 ·
              <kbd className="font-mono"> ←→ </kbd> ±5 秒 ·
              <kbd className="font-mono"> R </kbd> 重播本句
            </div>
          </GlassCard>
        </div>

        {/* 側欄 */}
        <div className="space-y-3">
          <KeyWordsCard
            words={keywords}
            onPick={(w) => setWordPopup(w)}
          />
          <SubtitleTimeline
            subtitles={subtitles}
            currentTime={currentTime}
            onJumpTo={seekTo}
          />
        </div>
      </div>

      {/* 跟讀面板 */}
      {followTarget != null && subtitles[followTarget] && (
        <FollowReadPanel
          target={subtitles[followTarget]}
          onNext={followNext}
          onClose={() => {
            setFollowTarget(null);
            setPlaying(true);
          }}
        />
      )}

      {/* 字典彈窗（從側欄重點字） */}
      {wordPopup && (
        <WordPopup word={wordPopup} videoId={video.id} onClose={() => setWordPopup(null)} />
      )}
    </div>
  );
}

function KeyWordsCard({ words, onPick }: { words: string[]; onPick: (w: string) => void }) {
  return (
    <GlassCard className="p-4">
      <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)]">
        <BookOpen size={12} /> 本片重點字
      </div>
      <div className="flex flex-wrap gap-1.5">
        {words.map((w) => (
          <button
            key={w}
            type="button"
            onClick={() => onPick(w)}
            className="inline-flex h-8 items-center gap-1 rounded-full bg-[#5B5BF0]/10 px-3 text-sm font-medium text-[#5B5BF0] ring-1 ring-inset ring-[#5B5BF0]/15 hover:bg-[#5B5BF0]/20"
          >
            {w}
          </button>
        ))}
      </div>
    </GlassCard>
  );
}

function fmt(sec: number) {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}
