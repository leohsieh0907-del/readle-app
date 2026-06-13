/**
 * 影片收藏 — LocalStorage
 */

const KEY = 'readle.saved_videos';

export function getSavedVideoIds(): string[] {
  if (typeof window === 'undefined') return [];
  try { return JSON.parse(window.localStorage.getItem(KEY) ?? '[]') as string[]; }
  catch { return []; }
}

export function isVideoSaved(id: string): boolean {
  return getSavedVideoIds().includes(id);
}

export function toggleSaveVideo(id: string): boolean {
  const ids = getSavedVideoIds();
  const idx = ids.indexOf(id);
  let saved: boolean;
  if (idx >= 0) { ids.splice(idx, 1); saved = false; }
  else { ids.unshift(id); saved = true; }
  window.localStorage.setItem(KEY, JSON.stringify(ids));
  return saved;
}
