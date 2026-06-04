/**
 * 單字本常用操作
 */

import { vocabRepo } from './repos';
import type { VocabEntry, Category, SRSState } from '../readle-types';
import { updateSRS, type SRSResponse } from '../srs/sm2';

const todayISO = () => new Date().toISOString().slice(0, 10);

export function addWord(input: {
  word: string;
  phonetic?: string;
  partOfSpeech?: string;
  meaning: string;
  examples?: { en: string; zh: string }[];
  category?: Category;
  source?: 'video' | 'article' | 'ai' | 'manual';
}): VocabEntry {
  const id = `usr-${crypto.randomUUID().slice(0, 8)}`;
  const now = new Date().toISOString();
  const initSRS: SRSState = {
    easeFactor: 2.5,
    interval: 0,
    repetitions: 0,
    nextReviewAt: todayISO(),
    status: 'new',
  };
  const entry: VocabEntry = {
    id,
    word: input.word.trim(),
    phonetic: input.phonetic,
    partOfSpeech: input.partOfSpeech ?? 'unknown',
    meaning: input.meaning,
    examples: input.examples ?? [],
    category: input.category ?? 'daily',
    tags: [],
    srs: initSRS,
    addedAt: now,
  };
  vocabRepo.update((s) => ({ ...s, entries: { ...s.entries, [id]: entry } }));
  return entry;
}

export function findWord(word: string): VocabEntry | undefined {
  const s = vocabRepo.get();
  const lower = word.toLowerCase();
  return Object.values(s.entries).find((e) => e.word.toLowerCase() === lower);
}

export function markReview(id: string, response: SRSResponse): VocabEntry | undefined {
  let updated: VocabEntry | undefined;
  vocabRepo.update((s) => {
    const e = s.entries[id];
    if (!e) return s;
    const nextSRS = updateSRS(e.srs, response);
    updated = { ...e, srs: nextSRS };
    return { ...s, entries: { ...s.entries, [id]: updated } };
  });
  return updated;
}

export function removeWord(id: string): void {
  vocabRepo.update((s) => {
    const { [id]: _, ...rest } = s.entries;
    return { ...s, entries: rest };
  });
}

export function countByCategory(): Record<Category, number> {
  const out: Record<Category, number> = {
    toeic: 0,
    business: 0,
    daily: 0,
    travel: 0,
    tech: 0,
  };
  const s = vocabRepo.get();
  Object.values(s.entries).forEach((e) => {
    out[e.category] = (out[e.category] ?? 0) + 1;
  });
  return out;
}

export function countByStatus(): { new: number; learning: number; review: number; mastered: number } {
  const out = { new: 0, learning: 0, review: 0, mastered: 0 };
  const s = vocabRepo.get();
  Object.values(s.entries).forEach((e) => {
    out[e.srs.status] += 1;
  });
  return out;
}
