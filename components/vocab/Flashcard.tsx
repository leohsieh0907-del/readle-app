'use client';

import { useState } from 'react';
import { Volume2 } from 'lucide-react';
import { speak } from '@/lib/speech/tts';
import type { VocabEntry } from '@/lib/readle-types';

const catColor: Record<string, string> = {
  toeic: 'from-[#6366F1] to-[#4F46E5]',
  business: 'from-[#8B5CF6] to-[#7C3AED]',
  daily: 'from-[#06B6D4] to-[#0891B2]',
  travel: 'from-[#10B981] to-[#059669]',
  tech: 'from-[#F59E0B] to-[#D97706]',
};

const catLabel: Record<string, string> = {
  toeic: '多益',
  business: '商業',
  daily: '日常',
  travel: '旅遊',
  tech: '科技',
};

interface FlashcardProps {
  word: VocabEntry;
  flipped: boolean;
  onFlip: () => void;
}

export default function Flashcard({ word, flipped, onFlip }: FlashcardProps) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onFlip}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onFlip();
        }
      }}
      className="relative h-[380px] w-full cursor-pointer select-none outline-none"
      style={{ perspective: 1200 }}
    >
      <div
        className="relative h-full w-full transition-transform duration-500"
        style={{
          transformStyle: 'preserve-3d',
          transform: flipped ? 'rotateY(180deg)' : 'rotateY(0)',
        }}
      >
        {/* 正面 */}
        <div
          className="glass-strong absolute inset-0 flex flex-col items-center justify-center rounded-3xl p-8"
          style={{ backfaceVisibility: 'hidden' }}
        >
          <div className="absolute left-4 top-4">
            <span
              className={`rounded-full bg-gradient-to-r ${catColor[word.category]} px-2.5 py-1 text-[10px] font-bold uppercase text-white shadow-card`}
            >
              {catLabel[word.category]}
            </span>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              speak({ text: word.word });
            }}
            className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-[#5B5BF0]/10 text-[#5B5BF0] hover:bg-[#5B5BF0]/20"
            title="聽發音"
          >
            <Volume2 size={16} />
          </button>

          <div className="text-center">
            <div className="text-4xl font-bold tracking-tight sm:text-5xl">{word.word}</div>
            <div className="mt-2 font-mono text-sm text-[var(--color-text-tertiary)]">
              {word.phonetic}
            </div>
            <div className="mt-3 text-xs uppercase tracking-wider text-[var(--color-text-tertiary)]">
              {word.partOfSpeech}
            </div>
          </div>

          <div className="absolute bottom-5 text-xs text-[var(--color-text-tertiary)]">
            點擊翻面看釋義
          </div>
        </div>

        {/* 背面 */}
        <div
          className="glass-strong absolute inset-0 flex flex-col rounded-3xl p-6"
          style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
        >
          <div
            className={`mb-3 inline-flex w-fit rounded-full bg-gradient-to-r ${catColor[word.category]} px-2.5 py-1 text-[10px] font-bold uppercase text-white`}
          >
            {catLabel[word.category]}
          </div>
          <div className="text-lg font-bold leading-snug">{word.word}</div>
          <div className="mt-3 rounded-xl bg-white/40 p-3 ring-1 ring-inset ring-black/5">
            <div className="text-[15px] font-semibold leading-snug">{word.meaning}</div>
          </div>

          {word.examples[0] && (
            <div className="mt-3 space-y-1 rounded-xl bg-white/40 p-3 ring-1 ring-inset ring-black/5">
              <div className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)]">
                例句
              </div>
              <div className="text-sm leading-snug">{word.examples[0].en}</div>
              {word.examples[0].zh && (
                <div className="text-xs leading-snug text-[var(--color-text-tertiary)]">
                  {word.examples[0].zh}
                </div>
              )}
            </div>
          )}

          <div className="mt-auto text-center text-xs text-[var(--color-text-tertiary)]">
            點擊翻回正面
          </div>
        </div>
      </div>
    </div>
  );
}
