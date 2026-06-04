'use client';

import { useMemo, useState, type MouseEvent } from 'react';
import type { Article, DictEntry } from '@/lib/types';
import { lookupWord } from '@/lib/dictionary';
import WordPopup from './WordPopup';

export interface ReaderContentProps {
  article: Article;
  currentSentenceIndex: number;
  onSentenceClick: (sentenceIndex: number) => void;
}

interface FlatSentence {
  paragraphIndex: number;
  sentenceIndex: number; // global index across all paragraphs
  text: string;
}

function flatten(paragraphs: string[][]): FlatSentence[] {
  const flat: FlatSentence[] = [];
  let globalIdx = 0;
  paragraphs.forEach((p, pIdx) => {
    p.forEach((sentence) => {
      flat.push({ paragraphIndex: pIdx, sentenceIndex: globalIdx++, text: sentence });
    });
  });
  return flat;
}

export default function ReaderContent({
  article,
  currentSentenceIndex,
  onSentenceClick,
}: ReaderContentProps) {
  const [popup, setPopup] = useState<{
    entry: DictEntry | null;
    raw: string;
    pos: { x: number; y: number };
  } | null>(null);

  const flat = useMemo(() => flatten(article.paragraphs), [article.paragraphs]);

  // Group sentences back into paragraphs for rendering
  const grouped: FlatSentence[][] = useMemo(() => {
    const groups: FlatSentence[][] = [];
    flat.forEach((s) => {
      if (!groups[s.paragraphIndex]) groups[s.paragraphIndex] = [];
      groups[s.paragraphIndex].push(s);
    });
    return groups;
  }, [flat]);

  function handleWordClick(e: MouseEvent<HTMLSpanElement>, word: string) {
    e.stopPropagation();
    const entry = lookupWord(word);
    setPopup({
      entry,
      raw: word,
      pos: { x: e.clientX, y: e.clientY },
    });
  }

  function renderSentence(sentence: FlatSentence) {
    const tokens = sentence.text.split(/(\s+)/);
    const isActive = sentence.sentenceIndex === currentSentenceIndex;
    return (
      <span
        key={sentence.sentenceIndex}
        onClick={() => onSentenceClick(sentence.sentenceIndex)}
        className={`cursor-pointer rounded transition-colors duration-200 ${
          isActive
            ? 'bg-amber-100 px-1 py-0.5 text-stone-900 shadow-sm'
            : 'hover:bg-stone-100'
        }`}
      >
        {tokens.map((tok, i) => {
          if (/^\s+$/.test(tok)) return <span key={i}>{tok}</span>;
          const clean = tok.replace(/[^A-Za-z'-]/g, '');
          if (!clean) return <span key={i}>{tok}</span>;
          return (
            <span
              key={i}
              onClick={(e) => handleWordClick(e, clean)}
              className="cursor-pointer hover:text-sky-700 hover:underline decoration-dotted underline-offset-4"
            >
              {tok}
            </span>
          );
        })}
        {' '}
      </span>
    );
  }

  return (
    <>
      <article className="font-serif text-lg leading-loose text-stone-800 sm:text-xl">
        {grouped.map((paragraph, idx) => (
          <p key={idx} className="mb-6">
            {paragraph.map(renderSentence)}
          </p>
        ))}
      </article>

      {popup && (
        <WordPopup
          entry={popup.entry}
          rawWord={popup.raw}
          articleId={article.id}
          position={popup.pos}
          onClose={() => setPopup(null)}
        />
      )}
    </>
  );
}
