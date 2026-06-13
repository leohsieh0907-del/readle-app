/**
 * 文章收藏 — LocalStorage
 */

const KEY = 'readle.saved_articles';

export function getSavedIds(): string[] {
  if (typeof window === 'undefined') return [];
  try { return JSON.parse(window.localStorage.getItem(KEY) ?? '[]') as string[]; }
  catch { return []; }
}

export function isArticleSaved(id: string): boolean {
  return getSavedIds().includes(id);
}

export function toggleSaveArticle(id: string): boolean {
  const ids = getSavedIds();
  const idx = ids.indexOf(id);
  let saved: boolean;
  if (idx >= 0) { ids.splice(idx, 1); saved = false; }
  else { ids.unshift(id); saved = true; }
  window.localStorage.setItem(KEY, JSON.stringify(ids));
  return saved;
}

// ── 已讀標記 ──
const READ_KEY = 'readle.read_articles';

export function getReadIds(): string[] {
  if (typeof window === 'undefined') return [];
  try { return JSON.parse(window.localStorage.getItem(READ_KEY) ?? '[]') as string[]; }
  catch { return []; }
}

export function isArticleRead(id: string): boolean {
  return getReadIds().includes(id);
}

export function markArticleRead(id: string): void {
  if (typeof window === 'undefined') return;
  const ids = getReadIds();
  if (ids.includes(id)) return;
  ids.push(id);
  window.localStorage.setItem(READ_KEY, JSON.stringify(ids));
}
