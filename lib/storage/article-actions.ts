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
