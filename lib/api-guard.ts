/**
 * API 守衛 — 擋掉外人盜用你的金鑰/配額
 *
 * 1. 來源檢查：只放行「同網域」的請求（你自己的網站）。外部直接打 API → 403。
 *    - POST（Gemini 等貴的）：瀏覽器一定帶 Origin，沒帶就擋。
 *    - GET（較便宜）：同網域 GET 可能不帶 Origin，故只在「有來源且不符」時才擋。
 * 2. 流量限制：每 IP 每分鐘上限，擋暴衝濫用。
 *
 * 注意：記憶體版流量限制在 serverless 多實例下非完美，但足以擋掉一般盜用。
 * 要更嚴謹可換 Vercel KV / Upstash。
 */

import type { NextRequest } from 'next/server';

function hostOf(value: string | null): string | null {
  if (!value) return null;
  try { return new URL(value).host.toLowerCase(); } catch { return null; }
}

// ── 流量限制（每 IP / 視窗）──
const WINDOW_MS = 60_000;
const MAX_HITS = 40;
const hits = new Map<string, number[]>();

function underLimit(req: NextRequest): boolean {
  const ip = (req.headers.get('x-forwarded-for') ?? 'unknown').split(',')[0].trim();
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);
  if (hits.size > 5000) hits.clear(); // 防記憶體無限成長
  return recent.length <= MAX_HITS;
}

function deny(status: number, error: string): Response {
  return new Response(JSON.stringify({ error }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

/** 回傳 Response 代表擋下；回傳 null 代表放行 */
export function apiGuard(req: NextRequest): Response | null {
  const reqHost = (req.headers.get('host') ?? '').toLowerCase();
  const isLocal = /^(localhost|127\.0\.0\.1)(:|$)/.test(reqHost);
  const srcHost = hostOf(req.headers.get('origin')) ?? hostOf(req.headers.get('referer'));

  if (!isLocal) {
    if (srcHost) {
      if (srcHost !== reqHost) return deny(403, 'forbidden_origin');
    } else if (req.method === 'POST') {
      // POST 沒帶來源 = 非瀏覽器或被偽造 → 擋
      return deny(403, 'forbidden_origin');
    }
  }

  if (!underLimit(req)) return deny(429, 'rate_limited');
  return null;
}
