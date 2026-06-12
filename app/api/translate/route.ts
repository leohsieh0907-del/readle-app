/**
 * 翻譯代理 — Google 翻譯免費端點（en → zh-TW）
 *
 * 為何不用 Gemini/Lingva 當主力：
 * - Gemini 句子翻譯慢（~11s）且吃配額，配額用完就停。
 * - Lingva 公用實例已失效（zh-TW 回 400、zh 回 500）。
 * - Google translate_a 免費、免金鑰、~1.3s/句、品質佳——但無 CORS 標頭，
 *   故必須由後端代打（瀏覽器直連會被 CORS 擋）。
 */

import type { NextRequest } from 'next/server';
import { apiGuard } from '@/lib/api-guard';

const GT = 'https://translate.googleapis.com/translate_a/single';

async function translateOne(text: string): Promise<string> {
  const t = text.trim();
  if (!t) return '';
  const url = `${GT}?client=gtx&sl=en&tl=zh-TW&dt=t&q=${encodeURIComponent(t.slice(0, 1000))}`;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return '';
    // 回傳格式：[[["翻譯","原文",...], ...], ...]，data[0] 各段 seg[0] 串接即完整譯文
    const data = (await res.json()) as unknown;
    const segs = Array.isArray(data) && Array.isArray(data[0]) ? data[0] : [];
    return segs.map((s) => (Array.isArray(s) ? String(s[0] ?? '') : '')).join('').trim();
  } catch {
    return '';
  }
}

/** 並發上限的批次處理 */
async function mapLimited<T, R>(items: T[], limit: number, fn: (x: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let i = 0;
  async function worker() {
    while (i < items.length) {
      const idx = i++;
      out[idx] = await fn(items[idx]);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return out;
}

export async function POST(req: NextRequest) {
  const blocked = apiGuard(req);
  if (blocked) return blocked;

  let body: { texts?: string[] };
  try {
    body = (await req.json()) as { texts?: string[] };
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), { status: 400 });
  }

  const texts = (body.texts ?? []).slice(0, 60);
  if (texts.length === 0) return Response.json({ translations: [] });

  const translations = await mapLimited(texts, 8, translateOne);
  return Response.json({ translations });
}
