'use client';

import { useEffect, useState } from 'react';
import { BookmarkPlus, BookmarkCheck, X } from 'lucide-react';
import type { DictEntry } from '@/lib/types';
import { isInNotebook, saveToNotebook, removeFromNotebook } from '@/lib/storage';

export interface WordPopupProps {
  entry: DictEntry | null;
  rawWord: string | null;
  articleId: string;
  position: { x: number; y: number } | null;
  onClose: () => void;
}

export default function WordPopup({
  entry,
  rawWord,
  articleId,
  position,
  onClose,
}: WordPopupProps) {
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (entry) setSaved(isInNotebook(entry.word));
  }, [entry]);

  if (!position) return null;

  function toggleSave() {
    if (!entry) return;
    if (saved) {
      removeFromNotebook(entry.word);
      setSaved(false);
    } else {
      saveToNotebook(entry, articleId);
      setSaved(true);
    }
  }

  const left = Math.max(12, Math.min(position.x - 140, window.innerWidth - 296));
  const top = position.y + 12;

  return (
    <div
      className="fixed z-50 w-72 rounded-xl bg-white p-4 shadow-2xl ring-1 ring-stone-200"
      style={{ left, top }}
      role="dialog"
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute right-2 top-2 rounded p-1 text-stone-400 hover:bg-stone-100 hover:text-stone-600"
        aria-label="Close"
      >
        <X className="h-4 w-4" />
      </button>

      {entry ? (
        <>
          <div className="mb-1 flex items-baseline gap-2">
            <h4 className="font-serif text-xl font-semibold text-stone-900">
              {entry.word}
            </h4>
            <span className="rounded bg-stone-100 px-1.5 py-0.5 text-[10px] font-semibold text-stone-600">
              {entry.level}
            </span>
          </div>
          <p className="text-xs italic text-stone-500">{entry.pos}</p>
          <p className="mt-2 text-sm text-stone-800">{entry.zh}</p>
          {entry.example && (
            <p className="mt-2 border-l-2 border-stone-200 pl-2 text-xs text-stone-500">
              {entry.example}
            </p>
          )}
          <button
            type="button"
            onClick={toggleSave}
            className={`mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition ${
              saved
                ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200'
                : 'bg-stone-900 text-white hover:bg-stone-800'
            }`}
          >
            {saved ? (
              <>
                <BookmarkCheck className="h-4 w-4" />
                Saved to notebook
              </>
            ) : (
              <>
                <BookmarkPlus className="h-4 w-4" />
                Save to Notebook
              </>
            )}
          </button>
        </>
      ) : (
        <>
          <h4 className="font-serif text-lg font-semibold text-stone-900">
            {rawWord}
          </h4>
          <p className="mt-2 text-sm text-stone-500">
            No dictionary entry yet for this word.
          </p>
        </>
      )}
    </div>
  );
}
