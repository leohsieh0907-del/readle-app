'use client';

import { useMemo, useRef, useState } from 'react';
import type { SubtitleLine } from '@/lib/readle-types';
import WordPopup from './WordPopup';
import { translateToZh } from '@/lib/dictionary/lookup';
import { lookupBuiltin } from '@/lib/dictionary/builtin';

export type SubtitleMode = 'both' | 'en' | 'zh' | 'off';

interface DualSubtitleProps {
  subtitles: SubtitleLine[];
  currentTime: number;
  mode: SubtitleMode;
  fontSize?: 'sm' | 'md' | 'lg';
  videoId?: string;
}

const fontMap = {
  sm: { en: 'text-base', zh: 'text-sm' },
  md: { en: 'text-lg', zh: 'text-base' },
  lg: { en: 'text-xl', zh: 'text-lg' },
};

const zhCache: Record<string, string> = {};

export default function DualSubtitle({
  subtitles,
  currentTime,
  mode,
  fontSize = 'md',
  videoId,
}: DualSubtitleProps) {
  const [popup, setPopup] = useState<{ word: string; context: string } | null>(null);
  const [hoverWord, setHoverWord] = useState<string | null>(null);
  const [hoverZh, setHoverZh] = useState<string>('');
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const active = useMemo(
    () => subtitles.find((s) => currentTime >= s.startSec && currentTime < s.endSec),
    [subtitles, currentTime],
  );

  if (mode === 'off' || !active) return null;

  const font = fontMap[fontSize];

  const handleMouseEnter = async (word: string, context: string) => {
    setHoverWord(word);
    setHoverZh('');
    if (hoverTimer.current) clearTimeout(hoverTimer.current);

    // 先查內建字典（瞬間）
    const key = word.toLowerCase();
    if (zhCache[key]) { setHoverZh(zhCache[key]); return; }
    const builtin = lookupBuiltin(word);
    if (builtin?.zh) { zhCache[key] = builtin.zh; setHoverZh(builtin.zh); return; }

    // 未知字 → 0.12s 後打 Gemini
    hoverTimer.current = setTimeout(async () => {
      const zh = await translateToZh(word, context);
      if (zh) { zhCache[key] = zh; setHoverZh(zh); }
    }, 120);
  };

  const handleMouseLeave = () => {
    if (hoverTimer.current) clearTimeout(hoverTimer.current);
    setHoverWord(null);
    setHoverZh('');
  };

  const renderEn = (text: string, contextSentence: string) => {
    const tokens = text.split(/(\s+)/);
    return tokens.map((tok, i) => {
      if (/^\s+$/.test(tok)) return <span key={i}>{tok}</span>;
      const isHover = hoverWord === tok;
      return (
        <span
          key={i}
          onMouseEnter={() => handleMouseEnter(tok, contextSentence)}
          onMouseLeave={handleMouseLeave}
          onClick={(e) => {
            e.stopPropagation();
            handleMouseLeave();
            setPopup({ word: tok, context: contextSentence });
          }}
          className={`cursor-pointer rounded transition-all duration-150 ${
            isHover
              ? 'bg-[#FFB84D]/40 text-white underline decoration-[#FFB84D] decoration-2 underline-offset-2'
              : 'hover:bg-[#FFB84D]/20'
          }`}
        >
          {tok}
        </span>
      );
    });
  };

  return (
    <>
      <div className="pointer-events-auto absolute inset-x-0 bottom-6 z-10 px-4 sm:bottom-10 sm:px-12">
        <div className="mx-auto max-w-3xl rounded-2xl bg-black/65 p-3 text-center backdrop-blur-md sm:p-4">
          {(mode === 'both' || mode === 'en') && (
            <div className={`${font.en} font-semibold leading-snug text-white drop-shadow`}>
              {renderEn(active.en, active.en)}
            </div>
          )}
          {/* hover 翻譯泡泡 */}
          {hoverWord && (
            <div className="mt-1.5 rounded-lg bg-white/15 px-2 py-1 text-xs text-white/90 backdrop-blur-sm">
              <span className="font-semibold">{hoverWord}</span>
              {hoverZh && <span className="ml-2 text-white/70">{hoverZh}</span>}
              {!hoverZh && (
                <span className="ml-2 inline-flex items-center gap-0.5 text-white/40">
                  <span className="h-1 w-1 animate-bounce rounded-full bg-white/50" style={{ animationDelay: '0ms' }} />
                  <span className="h-1 w-1 animate-bounce rounded-full bg-white/50" style={{ animationDelay: '150ms' }} />
                  <span className="h-1 w-1 animate-bounce rounded-full bg-white/50" style={{ animationDelay: '300ms' }} />
                </span>
              )}
              <span className="ml-2 text-white/30">· 單擊查詳細</span>
            </div>
          )}
          {(mode === 'both' || mode === 'zh') && (
            <div className={`${font.zh} mt-1 leading-snug text-white/85 drop-shadow`}>
              {active.zh}
            </div>
          )}
        </div>
      </div>

      {popup && (
        <WordPopup
          word={popup.word}
          context={popup.context}
          videoId={videoId}
          onClose={() => setPopup(null)}
        />
      )}
    </>
  );
}
