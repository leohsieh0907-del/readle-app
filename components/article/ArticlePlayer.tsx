'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, ChevronLeft, ChevronRight, Languages } from 'lucide-react';
import { getPreferredVoice } from '@/lib/speech/tts';

const SPEED_OPTIONS = [0.6, 0.8, 1.0, 1.2, 1.5, 1.8];

export type DisplayMode = 'en' | 'both';

interface ArticlePlayerProps {
  sentences: string[];
  paragraphBoundaries: number[];
  onSentenceChange?: (idx: number) => void;
  onModeChange?: (mode: DisplayMode) => void;
}

const isBrowser = () => typeof window !== 'undefined' && 'speechSynthesis' in window;

export default function ArticlePlayer({
  sentences,
  paragraphBoundaries,
  onSentenceChange,
  onModeChange,
}: ArticlePlayerProps) {
  const [playing, setPlaying] = useState(false);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [speed, setSpeed] = useState(1.0);
  const [displayMode, setDisplayMode] = useState<DisplayMode>('en');
  const speedIdx = SPEED_OPTIONS.indexOf(speed);

  const isPlayingRef = useRef(false);
  const currentIdxRef = useRef(0);
  const speedRef = useRef(1.0);

  useEffect(() => { speedRef.current = speed; }, [speed]);

  const stopSpeaking = useCallback(() => {
    isPlayingRef.current = false;
    if (isBrowser()) window.speechSynthesis.cancel();
  }, []);

  /**
   * 核心朗讀：一次把 startIdx 之後的句子全部 queue 進 speechSynthesis
   * 瀏覽器自己銜接，沒有句子間的間隙
   */
  const playFrom = useCallback((startIdx: number) => {
    if (!isBrowser()) return;
    window.speechSynthesis.cancel();

    // 預熱語音引擎（消除第一句的啟動延遲）
    const warmup = new SpeechSynthesisUtterance('');
    warmup.volume = 0;
    warmup.onend = () => { /* silent warmup done */ };
    window.speechSynthesis.speak(warmup);
    window.speechSynthesis.cancel();

    isPlayingRef.current = true;
    setPlaying(true);
    setCurrentIdx(startIdx);
    currentIdxRef.current = startIdx;
    onSentenceChange?.(startIdx);

    const slice = sentences.slice(startIdx);
    const voice = getPreferredVoice(); // 全站同一把（Edge 神經語音）

    slice.forEach((sentence, relIdx) => {
      const absIdx = startIdx + relIdx;
      const u = new SpeechSynthesisUtterance(sentence);
      u.lang = 'en-US';
      u.rate = speedRef.current;
      u.pitch = 1;
      if (voice) u.voice = voice;

      u.onstart = () => {
        // 若已被 cancel，不更新狀態
        if (!isPlayingRef.current) return;
        setCurrentIdx(absIdx);
        currentIdxRef.current = absIdx;
        onSentenceChange?.(absIdx);
      };

      // 最後一句結束時收尾
      if (absIdx === sentences.length - 1) {
        u.onend = () => {
          isPlayingRef.current = false;
          setPlaying(false);
        };
      }

      window.speechSynthesis.speak(u);
    });
  }, [sentences, onSentenceChange]);

  // 頁面載入時預先載入語音清單（避免首次發音有載入延遲）
  useEffect(() => {
    if (!isBrowser()) return;
    window.speechSynthesis.getVoices(); // 強制載入
    const onVoices = () => window.speechSynthesis.getVoices();
    window.speechSynthesis.addEventListener?.('voiceschanged', onVoices);
    return () => window.speechSynthesis.removeEventListener?.('voiceschanged', onVoices);
  }, []);

  // 監聽頁面點句跳轉事件
  useEffect(() => {
    if (!isBrowser()) return;
    const handler = (e: Event) => {
      const idx = (e as CustomEvent<{ idx: number }>).detail.idx;
      playFrom(idx);
    };
    window.addEventListener('article:jump', handler);
    return () => window.removeEventListener('article:jump', handler);
  }, [playFrom]);

  // 離開時停止
  useEffect(() => () => { stopSpeaking(); }, [stopSpeaking]);

  const togglePlay = () => {
    if (playing) { stopSpeaking(); setPlaying(false); }
    else playFrom(currentIdx);
  };

  const replayCurrent = () => playFrom(currentIdx);

  const changeSpeed = (delta: 1 | -1) => {
    const next = SPEED_OPTIONS[Math.max(0, Math.min(SPEED_OPTIONS.length - 1, speedIdx + delta))];
    setSpeed(next);
    speedRef.current = next;
    // 重新 queue（套用新速度）
    if (isPlayingRef.current) playFrom(currentIdxRef.current);
  };

  const toggleMode = () => {
    const next: DisplayMode = displayMode === 'en' ? 'both' : 'en';
    setDisplayMode(next);
    onModeChange?.(next);
  };

  const progress = sentences.length > 0 ? (currentIdx / Math.max(sentences.length - 1, 1)) * 100 : 0;

  return (
    <div className="rounded-2xl bg-white p-3 shadow-[0_4px_24px_rgba(15,15,25,0.08)] ring-1 ring-inset ring-black/[0.05)] sm:p-4">
      {/* 進度條 */}
      <div className="mb-3 flex items-center gap-3 px-1">
        <span className="w-8 shrink-0 text-right font-mono text-xs text-[var(--color-text-secondary)]">
          {currentIdx + 1}
        </span>
        <div className="relative flex-1">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-black/[0.06]">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#7C7CFF] to-[#5B5BF0] transition-all duration-150"
              style={{ width: `${progress}%` }}
            />
          </div>
          <input
            type="range" min={0} max={Math.max(sentences.length - 1, 0)} value={currentIdx}
            onChange={e => {
              const idx = Number(e.target.value);
              setCurrentIdx(idx);
              if (isPlayingRef.current) playFrom(idx);
              else { setCurrentIdx(idx); onSentenceChange?.(idx); }
            }}
            className="absolute inset-0 w-full cursor-pointer opacity-0"
          />
        </div>
        <span className="w-8 shrink-0 font-mono text-xs text-[var(--color-text-tertiary)]">
          {sentences.length}
        </span>
      </div>

      {/* 控制列 */}
      <div className="flex flex-wrap items-center gap-2">
        {/* 播放 */}
        <button type="button" onClick={togglePlay}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#7C7CFF] to-[#5B5BF0] text-white shadow-card transition hover:scale-105">
          {playing ? <Pause size={18} fill="white" /> : <Play size={18} fill="white" />}
        </button>

        {/* 重播 */}
        <button type="button" onClick={replayCurrent}
          className="btn-ghost flex h-10 items-center gap-1.5 rounded-xl px-3 text-sm">
          <RotateCcw size={15} /> 重播
        </button>

        {/* 速度 */}
        <div className="flex h-10 items-center rounded-xl bg-white/50 ring-1 ring-inset ring-black/5">
          <button type="button" onClick={() => changeSpeed(-1)} disabled={speedIdx <= 0}
            className="flex h-full items-center px-2 text-[var(--color-text-secondary)] hover:text-[#5B5BF0] disabled:opacity-25">
            <ChevronLeft size={16} />
          </button>
          <span className="min-w-[46px] text-center font-mono text-xs font-semibold">
            {speed.toFixed(1)}x
          </span>
          <button type="button" onClick={() => changeSpeed(1)} disabled={speedIdx >= SPEED_OPTIONS.length - 1}
            className="flex h-full items-center px-2 text-[var(--color-text-secondary)] hover:text-[#5B5BF0] disabled:opacity-25">
            <ChevronRight size={16} />
          </button>
        </div>

        {/* 中英切換 */}
        <button type="button" onClick={toggleMode}
          className={`flex h-10 items-center gap-1.5 rounded-xl px-3 text-sm font-medium transition ${
            displayMode === 'both'
              ? 'bg-gradient-to-r from-[#06B6D4] to-[#3B82F6] text-white shadow-card'
              : 'btn-ghost'
          }`}
          title="切換中英顯示">
          <Languages size={15} />
          {displayMode === 'both' ? '中英' : '英文'}
        </button>

        {playing && (
          <span className="text-xs text-[var(--color-text-tertiary)]">朗讀中…</span>
        )}
      </div>
    </div>
  );
}
