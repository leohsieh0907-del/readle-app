/**
 * 例句快取 — 同一個字的例句內容固定，第一次產生後就永久存起來
 * 之後查同字 → 直接讀快取，完全不打 Gemini（解決 429 配額用完的根因）
 */

const PREFIX = 'readle.ex:';

export interface CachedExample { en: string; zh: string }

function key(word: string) { return PREFIX + word.toLowerCase().trim(); }

export function getCachedExamples(word: string): CachedExample[] | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(key(word));
    if (!raw) return null;
    const arr = JSON.parse(raw) as CachedExample[];
    return Array.isArray(arr) && arr.length > 0 ? arr : null;
  } catch { return null; }
}

export function setCachedExamples(word: string, examples: CachedExample[]): void {
  if (typeof window === 'undefined') return;
  const valid = (examples ?? []).filter((e) => e?.en?.trim()).slice(0, 2);
  if (valid.length === 0) return;
  try { window.localStorage.setItem(key(word), JSON.stringify(valid)); } catch { /* 配額滿就算了 */ }
}
