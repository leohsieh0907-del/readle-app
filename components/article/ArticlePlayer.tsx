'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, ChevronLeft, ChevronRight } from 'lucide-react';

const SPEED_OPTIONS = [0.6, 0.8, 1.0, 1.2, 1.5, 1.8];

interface ArticlePlayerProps {
  sentences: string[];
  paragraphBoundaries: number[];
  onSentenceChange?: (idx: number) => void;
}

const isBrowser = () => typeof window !== 'undefined';

export default function ArticlePlayer({ sentences, onSentenceChange }: ArticlePlayerProps) {
  const [playing, setPlaying] = useState(false);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [speed, setSpeed] = useState(1.0);
  const speedIdx = SPEED_OPTIONS.indexOf(speed);

  const isPlayingRef = useRef(false);
  const currentIdxRef = useRef(0);
  const speedRef = useRef(1.0);

  useEffect(() => { currentIdxRef.current = currentIdx; }, [currentIdx]);
  useEffect(() => { speedRef.current = speed; }, [speed]);

  const stopSpeaking = useCallback(() => {
    isPlayingRef.current = false;
    if (isBrowser() && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }, []);

  const readSentence = useCallback((text: string): Promise<void> => {
    return new Promise((resolve) => {
      if (!isPlayingRef.current || !isBrowser()) { resolve(); return; }
      if (!('speechSynthesis' in window)) { resolve(); return; }

      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = 'en-US';
      u.rate = speedRef.current;
      u.pitch = 1;
      u.onend = () => resolve();
      u.onerror = () => resolve();
      window.speechSynthesis.speak(u);
    });
  }, []);

  const playFrom = useCallback(async (startIdx: number) => {
    stopSpeaking();
    await new Promise(r => setTimeout(r, 100));
    if (!isPlayingRef.current) {
      isPlayingRef.current = true;
    }
    setPlaying(true);
    setCurrentIdx(startIdx);
    onSentenceChange?.(startIdx);

    for (let i = startIdx; i < sentences.length; i++) {
      if (!isPlayingRef.current) break;
      setCurrentIdx(i);
      currentIdxRef.current = i;
      onSentenceChange?.(i);
      await readSentence(sentences[i]);
    }

    if (isPlayingRef.current) {
      isPlayingRef.current = false;
      setPlaying(false);
    }
  }, [sentences, stopSpeaking, readSentence, onSentenceChange]);

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
    if (playing) {
      stopSpeaking();
      setPlaying(false);
    } else {
      isPlayingRef.current = false; // reset before playFrom sets it
      playFrom(currentIdx);
    }
  };

  const replayCurrent = () => {
    isPlayingRef.current = false;
    playFrom(currentIdx);
  };

  const changeSpeed = (delta: 1 | -1) => {
    const next = SPEED_OPTIONS[Math.max(0, Math.min(SPEED_OPTIONS.length - 1, speedIdx + delta))];
    setSpeed(next);
    speedRef.current = next;
    if (isPlayingRef.current) {
      isPlayingRef.current = false;
      playFrom(currentIdxRef.current);
    }
  };

  const progress = sentences.length > 0 ? (currentIdx / (sentences.length - 1)) * 100 : 0;

  return (
    <div className="glass-card rounded-2xl p-3 sm:p-4">
      {/* 進度條 */}
      <div className="mb-3 flex items-center gap-3 px-1">
        <span className="w-8 shrink-0 text-right font-mono text-xs text-[var(--color-text-secondary)]">
          {currentIdx + 1}
        </span>
        <div className="relative flex-1">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-black/[0.06]">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#7C7CFF] to-[#5B5BF0] transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <input
            type="range" min={0} max={Math.max(sentences.length - 1, 0)} value={currentIdx}
            onChange={e => {
              const idx = Number(e.target.value);
              setCurrentIdx(idx);
              if (playing) {
                isPlayingRef.current = false;
                playFrom(idx);
              }
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
        <button type="button" onClick={togglePlay}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#7C7CFF] to-[#5B5BF0] text-white shadow-card transition hover:scale-105">
          {playing ? <Pause size={18} fill="white" /> : <Play size={18} fill="white" />}
        </button>

        <button type="button" onClick={replayCurrent}
          className="btn-ghost flex h-10 items-center gap-1.5 rounded-xl px-3 text-sm">
          <RotateCcw size={15} /> 重播
        </button>

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

        <span className="text-xs text-[var(--color-text-tertiary)]">
          {playing ? '朗讀中…' : '▶ 開始 · 點句子跳轉'}
        </span>
      </div>
    </div>
  );
}
