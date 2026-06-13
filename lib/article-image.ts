/**
 * 文章情境封面圖
 * - 有 coverImage 就用它
 * - 沒有 → 從標題/關鍵字取「情境照片」（loremflickr，免金鑰，依關鍵字配圖）
 */

const STOP = new Set([
  'your', 'guide', 'with', 'from', 'this', 'that', 'will', 'into', 'about', 'their',
  'what', 'when', 'where', 'which', 'these', 'those', 'have', 'they', 'them', 'english',
  'learn', 'tips', 'steps', 'common', 'phrases',
]);

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

/** 從標題抽 1–2 個關鍵字 */
function keywordsFromTitle(title: string): string {
  const words = title.toLowerCase().replace(/[^a-z\s]/g, ' ').split(/\s+/)
    .filter((w) => w.length > 3 && !STOP.has(w));
  return words.slice(0, 2).join(',') || 'study,learning';
}

interface CoverInput { id: string; coverImage?: string; title: string; imageKeyword?: string }

export function articleCover(a: CoverInput): string {
  if (a.coverImage) return a.coverImage;
  const kw = (a.imageKeyword?.trim()) || keywordsFromTitle(a.title);
  const lock = hash(a.id) % 1000;
  return `https://loremflickr.com/800/400/${encodeURIComponent(kw)}?lock=${lock}`;
}
