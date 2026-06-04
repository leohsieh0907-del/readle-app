import type { NotebookEntry, DictEntry } from './types';

const NOTEBOOK_KEY = 'readle:notebook';
const PROGRESS_KEY = 'readle:progress';
const QUIZ_KEY = 'readle:quiz';
const LEVEL_KEY = 'readle:level-filter';

function isBrowser() {
  return typeof window !== 'undefined';
}

function safeRead<T>(key: string, fallback: T): T {
  if (!isBrowser()) return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function safeWrite<T>(key: string, value: T) {
  if (!isBrowser()) return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* quota or disabled storage — silently ignore */
  }
}

export function getNotebook(): NotebookEntry[] {
  return safeRead<NotebookEntry[]>(NOTEBOOK_KEY, []);
}

export function saveToNotebook(entry: DictEntry, articleId: string) {
  const list = getNotebook();
  if (list.some((e) => e.word === entry.word)) return list;
  const next: NotebookEntry[] = [
    ...list,
    { ...entry, savedAt: Date.now(), fromArticleId: articleId },
  ];
  safeWrite(NOTEBOOK_KEY, next);
  return next;
}

export function removeFromNotebook(word: string) {
  const next = getNotebook().filter((e) => e.word !== word);
  safeWrite(NOTEBOOK_KEY, next);
  return next;
}

export function isInNotebook(word: string): boolean {
  return getNotebook().some((e) => e.word === word);
}

export function setReadingProgress(articleId: string, seconds: number) {
  const all = safeRead<Record<string, number>>(PROGRESS_KEY, {});
  all[articleId] = seconds;
  safeWrite(PROGRESS_KEY, all);
}

export function getReadingProgress(articleId: string): number {
  const all = safeRead<Record<string, number>>(PROGRESS_KEY, {});
  return all[articleId] ?? 0;
}

export function setQuizScore(articleId: string, score: number, total: number) {
  const all = safeRead<Record<string, { score: number; total: number; at: number }>>(
    QUIZ_KEY,
    {},
  );
  all[articleId] = { score, total, at: Date.now() };
  safeWrite(QUIZ_KEY, all);
}

export function getQuizScore(articleId: string) {
  const all = safeRead<Record<string, { score: number; total: number; at: number }>>(
    QUIZ_KEY,
    {},
  );
  return all[articleId];
}

export function getLevelFilter(): string[] {
  return safeRead<string[]>(LEVEL_KEY, []);
}

export function setLevelFilter(levels: string[]) {
  safeWrite(LEVEL_KEY, levels);
}
