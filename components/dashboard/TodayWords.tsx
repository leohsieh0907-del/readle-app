'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Volume2, Plus, BookOpen, Check, RefreshCw } from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';
import type { VocabEntry } from '@/lib/readle-types';
import { addWord, findWord } from '@/lib/storage/vocab-actions';
import { vocabRepo } from '@/lib/storage/repos';

interface TodayWordsProps {
  words: VocabEntry[];
}

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

function AddToVocabButton({ word }: { word: VocabEntry }) {
  const [added, setAdded] = useState(() => !!findWord(word.word));

  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (added) return;
    addWord({
      word: word.word,
      phonetic: word.phonetic,
      partOfSpeech: word.partOfSpeech,
      meaning: word.meaning,
      examples: word.examples,
      category: word.category,
      source: 'manual',
    });
    setAdded(true);
  };

  return (
    <button
      type="button"
      onClick={handleAdd}
      className={`mt-auto inline-flex h-8 w-full items-center justify-center gap-1.5 rounded-xl text-xs font-medium transition ${
        added
          ? 'bg-[#4ADE80]/20 text-[#15803d] ring-1 ring-inset ring-[#4ADE80]/30'
          : 'bg-[#5B5BF0]/10 text-[#5B5BF0] hover:bg-[#5B5BF0]/20'
      }`}
    >
      {added ? (
        <><Check size={12} /> 已加入單字本</>
      ) : (
        <><BookOpen size={12} /> 加入單字本</>
      )}
    </button>
  );
}

function pickRandom(all: VocabEntry[], count: number, exclude: string[] = []): VocabEntry[] {
  const pool = all.filter(w => !exclude.includes(w.id));
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

export default function TodayWords({ words: initialWords }: TodayWordsProps) {
  const [displayWords, setDisplayWords] = useState<VocabEntry[]>(initialWords);
  const [flipped, setFlipped] = useState<Record<string, boolean>>({});
  const [spinning, setSpinning] = useState(false);

  const shuffle = () => {
    setSpinning(true);
    const all = Object.values(vocabRepo.get().entries);
    if (all.length <= displayWords.length) {
      // 字太少，全部重新打亂
      setDisplayWords([...all].sort(() => Math.random() - 0.5).slice(0, 5));
    } else {
      // 換掉目前顯示的，挑新的
      const newWords = pickRandom(all, displayWords.length, displayWords.map(w => w.id));
      setDisplayWords(newWords);
    }
    setFlipped({});
    setTimeout(() => setSpinning(false), 600);
  };

  const words = displayWords;

  const speak = (text: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'en-US';
    u.rate = 0.95;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
  };

  return (
    <section>
      <div className="mb-3 flex items-end justify-between px-1">
        <div>
          <h2 className="text-lg font-bold tracking-tight">今日單字</h2>
          <p className="text-xs text-[var(--color-text-tertiary)]">點卡片翻面 · 點 🔊 聽發音</p>
        </div>
        <button
          type="button"
          onClick={shuffle}
          className="inline-flex items-center gap-1 rounded-full bg-[#5B5BF0]/8 px-2.5 py-1 text-xs font-medium text-[#5B5BF0] hover:bg-[#5B5BF0]/15 transition"
          title="換一批單字"
        >
          <RefreshCw size={11} className={spinning ? 'animate-spin' : ''} />
          換一批
        </button>
      </div>

      <div className="no-scrollbar flex gap-3 overflow-x-auto px-1 pb-2">
        {words.map((w) => {
          const isFlip = !!flipped[w.id];
          return (
            <motion.div
              key={w.id}
              role="button"
              tabIndex={0}
              onClick={() => setFlipped({ ...flipped, [w.id]: !isFlip })}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setFlipped({ ...flipped, [w.id]: !isFlip });
                }
              }}
              whileHover={{ y: -2 }}
              className="relative min-h-[170px] w-[210px] shrink-0 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-[#5B5BF0]/40 rounded-[20px]"
              style={{ perspective: 1000 }}
            >
              <div
                className="relative h-full w-full transition-transform duration-500"
                style={{
                  transformStyle: 'preserve-3d',
                  transform: isFlip ? 'rotateY(180deg)' : 'rotateY(0)',
                }}
              >
                {/* 正面 */}
                <GlassCard
                  className="absolute inset-0 flex flex-col p-4 text-left"
                  style={{ backfaceVisibility: 'hidden' }}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`rounded-full bg-gradient-to-r ${catColor[w.category]} px-2 py-0.5 text-[10px] font-bold uppercase text-white`}
                    >
                      {catLabel[w.category]}
                    </span>
                    <span
                      role="button"
                      tabIndex={0}
                      onClick={(e) => {
                        e.stopPropagation();
                        speak(w.word);
                      }}
                      className="rounded-full p-1.5 text-[var(--color-text-tertiary)] hover:bg-black/5"
                    >
                      <Volume2 size={15} />
                    </span>
                  </div>
                  <div className="mt-3 text-xl font-bold tracking-tight">{w.word}</div>
                  <div className="mt-1 font-mono text-xs text-[var(--color-text-tertiary)]">
                    {w.phonetic}
                  </div>
                  <div className="mt-auto text-xs text-[var(--color-text-tertiary)]">
                    {w.partOfSpeech} · 點擊翻面
                  </div>
                </GlassCard>

                {/* 背面 */}
                <GlassCard
                  className="absolute inset-0 flex flex-col p-4 text-left"
                  style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
                >
                  <div className="text-[15px] font-bold leading-snug">{w.meaning}</div>
                  {w.examples[0] && (
                    <div className="mt-3 space-y-0.5 text-xs">
                      <div className="leading-snug text-[var(--color-text-primary)]">
                        {w.examples[0].en}
                      </div>
                      <div className="leading-snug text-[var(--color-text-tertiary)]">
                        {w.examples[0].zh}
                      </div>
                    </div>
                  )}
                  <AddToVocabButton word={w} />
                </GlassCard>
              </div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
