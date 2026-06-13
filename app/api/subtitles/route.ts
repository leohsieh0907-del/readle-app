/**
 * GET /api/subtitles?v=YOUTUBE_ID[&explain=1]
 *
 * 三層策略：
 * 1. youtube-transcript 直接抓（本機 dev 能用，Vercel 被擋）
 * 2. timedtext API + proxy 備援
 * 3. Gemini 用內建知識生成（最後手段，適合知名演講）
 *
 * 成功後：Gemini 批次翻譯中文 + 可選重點字解釋
 */

import type { NextRequest } from 'next/server';

interface SubLine { startSec: number; endSec: number; en: string; zh: string }
interface WordNote { word: string; zh: string; pos: string }
interface ApiResp {
  videoId: string; subtitles: SubLine[]; count: number; keyWords?: WordNote[]; source?: string;
}

type RawChunk = { text: string; offset: number; duration: number };

// ─── Layer 1: youtube-transcript ───────────────────────

async function fetchYoutubeTranscript(videoId: string): Promise<RawChunk[]> {
  const { YoutubeTranscript } = await import('youtube-transcript');
  try {
    const t = await YoutubeTranscript.fetchTranscript(videoId, { lang: 'en' });
    if (t.length > 0) return t.map(c => ({ text: c.text, offset: c.offset, duration: c.duration }));
  } catch { /* try auto */ }
  const t = await YoutubeTranscript.fetchTranscript(videoId);
  return t.map(c => ({ text: c.text, offset: c.offset, duration: c.duration }));
}

// ─── Layer 2: timedtext API ────────────────────────────

async function fetchTimedText(videoId: string): Promise<RawChunk[]> {
  const urls = [
    `https://www.youtube.com/api/timedtext?v=${videoId}&lang=en&fmt=json3`,
    `https://api.allorigins.win/raw?url=${encodeURIComponent(`https://www.youtube.com/api/timedtext?v=${videoId}&lang=en&fmt=json3`)}`,
  ];
  for (const url of urls) {
    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/124' },
      });
      if (!res.ok) continue;
      type E = { tText?: string; tStartMs?: number; dDurationMs?: number };
      const data = await res.json() as { events?: E[] };
      const chunks = (data.events ?? []).filter(e => e.tText)
        .map(e => ({ text: e.tText!, offset: e.tStartMs ?? 0, duration: e.dDurationMs ?? 3000 }));
      if (chunks.length > 0) return chunks;
    } catch { /* next */ }
  }
  throw new Error('timedtext_failed');
}

// ─── Layer 3: Gemini knowledge-based generation ───────

const KNOWN_VIDEOS: Record<string, string> = {
  'qp0HIF3SfI4': "Simon Sinek's TED talk 'How Great Leaders Inspire Action / Start With Why'",
  'arj7oStGLkU': "Tim Urban's TED talk 'Inside the Mind of a Master Procrastinator'",
  'H14bBuluwB8': "Angela Duckworth's TED talk 'Grit: The Power of Passion and Perseverance'",
  'RcGyVTAoXEU': "Kelly McGonigal's TED talk 'How to Make Stress Your Friend'",
  '5MgBikgcWnY': "Josh Kaufman's TEDx talk 'The First 20 Hours: How to Learn Anything'",
  'Ks-_Mh1QhMc': "Amy Cuddy's TED talk 'Your Body Language May Shape Who You Are'",
};

async function generateWithGemini(videoId: string, key: string): Promise<RawChunk[]> {
  const videoDesc = KNOWN_VIDEOS[videoId];
  if (!videoDesc) throw new Error('unknown_video');

  const prompt = `Generate 20 subtitle lines for ${videoDesc}.
Return ONLY a JSON array. Each item must have these exact keys:
{"startSec": number, "endSec": number, "en": "English sentence from the speech"}

Rules:
- Use actual quotes from the real speech (you know this talk well)
- startSec starts at 0, each sentence 4-8 seconds
- Cover the most educational/impactful parts
- No markdown, no explanation, pure JSON array only`;

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.2, maxOutputTokens: 3000, thinkingConfig: { thinkingBudget: 0 } },
      }),
    },
  );
  if (!res.ok) throw new Error(`gemini_gen_${res.status}`);
  const data = await res.json() as { candidates?: { content?: { parts?: { text?: string }[] } }[] };
  const text = data.candidates?.[0]?.content?.parts?.map(p => p.text ?? '').join('') ?? '';

  // 抽取 JSON array
  const m = text.match(/\[[\s\S]*\]/);
  if (!m) throw new Error('no_json_array');
  const parsed = JSON.parse(m[0]) as { startSec?: number; endSec?: number; en?: string }[];
  return parsed
    .filter(p => p.en)
    .map(p => ({
      text: p.en!,
      offset: (p.startSec ?? 0) * 1000,
      duration: ((p.endSec ?? (p.startSec ?? 0) + 5) - (p.startSec ?? 0)) * 1000,
    }));
}

// ─── Gemini：用影片標題生成（用於任意 YouTube 搜尋結果）──

async function generateWithGeminiByTitle(titleOrId: string, key: string): Promise<RawChunk[]> {
  const isTitle = titleOrId.length > 15 || /[a-zA-Z\s]{6,}/.test(titleOrId);
  const desc = isTitle
    ? `the YouTube video titled "${titleOrId}"`
    : `the YouTube video with ID ${titleOrId}`;

  const prompt = `Generate 50 educational subtitle lines for ${desc}.

Rules:
- Cover the topic comprehensively from introduction to conclusion
- Each line: 1 short, clear sentence (max 12 words per line, B1-B2 level)
- startSec starts at 8, evenly spaced to cover about 5 minutes (300 seconds)
- Each line is 5-6 seconds (endSec = startSec + 5)
- Include vocabulary explanations, examples, and tips about the topic
- No markdown, no explanation

Return ONLY a JSON array: [{"startSec": 8, "endSec": 13, "en": "Short sentence here."}]`;

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.3, maxOutputTokens: 8000, thinkingConfig: { thinkingBudget: 0 } },
      }),
    },
  );
  if (!res.ok) throw new Error(`gemini_title_${res.status}`);
  const data = await res.json() as { candidates?: { content?: { parts?: { text?: string }[] } }[] };
  const text = data.candidates?.[0]?.content?.parts?.map(p => p.text ?? '').join('') ?? '';
  const m = text.match(/\[[\s\S]*\]/);
  if (!m) throw new Error('no_json');
  const parsed = JSON.parse(m[0]) as { startSec?: number; endSec?: number; en?: string }[];
  return parsed.filter(p => p.en).map(p => ({
    text: p.en!,
    offset: (p.startSec ?? 0) * 1000,
    duration: ((p.endSec ?? (p.startSec ?? 0) + 5) - (p.startSec ?? 0)) * 1000,
  }));
}

// ─── Merge & translate ─────────────────────────────────

function merge(raw: RawChunk[]): RawChunk[] {
  const out: RawChunk[] = [];
  let acc: RawChunk | null = null;
  for (const item of raw) {
    const c = item.text.replace(/\n/g, ' ').replace(/\[.*?\]/g, '').trim();
    if (!c) continue;
    if (!acc) { acc = { text: c, offset: item.offset, duration: item.duration }; continue; }
    acc.text += ' ' + c;
    acc.duration += item.duration;
    if (/[.!?]$/.test(c) || acc.text.length > 100) { out.push(acc); acc = null; }
  }
  if (acc) out.push(acc);
  return out;
}

async function batchTranslate(sentences: string[], key: string): Promise<string[]> {
  const BATCH = 60, all: string[] = [];
  for (let i = 0; i < sentences.length; i += BATCH) {
    const chunk = sentences.slice(i, i + BATCH);
    const numbered = chunk.map((s, idx) => `${i + idx + 1}. ${s}`).join('\n');
    const prompt = `把以下英文句子翻成繁體中文，保持番號順序，每行一句，只輸出番號.空格翻譯：\n\n${numbered}`;
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`,
        { method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ role: 'user', parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.2, maxOutputTokens: 4096, thinkingConfig: { thinkingBudget: 0 } } }) },
      );
      if (res.ok) {
        const d = await res.json() as { candidates?: { content?: { parts?: { text?: string }[] } }[] };
        const text = d.candidates?.[0]?.content?.parts?.map(p => p.text ?? '').join('') ?? '';
        for (const line of text.split('\n')) { const m = line.match(/^\d+\.\s*(.+)/); if (m) all.push(m[1].trim()); }
        while (all.length < i + chunk.length) all.push('');
      } else { chunk.forEach(() => all.push('')); }
    } catch { chunk.forEach(() => all.push('')); }
  }
  return all;
}

async function extractKeyWords(subtitles: SubLine[], key: string): Promise<WordNote[]> {
  const text = subtitles.map(s => s.en).join(' ').slice(0, 1500);
  const prompt = `從以下英文字幕找出 8 個值得學習的單字或片語（B1-C1），回傳 JSON 陣列 [{"word":"...","zh":"繁中意思","pos":"verb/noun/adj/adv/phrase"}]，只輸出 JSON：\n\n${text}`;
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`,
      { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.3, maxOutputTokens: 800, thinkingConfig: { thinkingBudget: 0 },
            responseMimeType: 'application/json' } }) },
    );
    if (!res.ok) return [];
    const d = await res.json() as { candidates?: { content?: { parts?: { text?: string }[] } }[] };
    const t = d.candidates?.[0]?.content?.parts?.map(p => p.text ?? '').join('') ?? '';
    const parsed = JSON.parse(t) as WordNote[];
    return Array.isArray(parsed) ? parsed.slice(0, 10) : [];
  } catch { return []; }
}

// ─── Main ──────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const videoId = req.nextUrl.searchParams.get('v');
  const withExplain = req.nextUrl.searchParams.get('explain') === '1';
  const videoTitle = req.nextUrl.searchParams.get('title') ?? ''; // 從搜尋結果帶入標題
  if (!videoId) return Response.json({ error: 'Missing ?v=' }, { status: 400 });

  const key = process.env.GEMINI_API_KEY;
  let raw: RawChunk[] = [];
  let source = 'unknown';

  // 嘗試三層：youtube-transcript → timedtext → Gemini 生成
  try { raw = await fetchYoutubeTranscript(videoId); source = 'youtube'; }
  catch {
    try { raw = await fetchTimedText(videoId); source = 'timedtext'; }
    catch {
      if (key) {
        try {
          // 若有影片標題（從搜尋結果帶入），用標題生成更精準的字幕
          const effectiveId = videoTitle ? `TITLE:${videoTitle}` : videoId;
          raw = await generateWithGeminiByTitle(videoTitle || videoId, key);
          source = 'gemini_generated';
        } catch (e) {
          return Response.json({ error: '無法取得字幕', reason: '這部影片的字幕功能已被停用，且 Gemini 無法辨識此影片', detail: String(e) }, { status: 404 });
        }
      } else {
        return Response.json({ error: '字幕不可用' }, { status: 404 });
      }
    }
  }

  const merged = merge(raw);
  const en = merged.map(c => c.text);
  let zh = en.map(() => '');
  if (key) { try { zh = await batchTranslate(en, key); } catch {} }

  const subtitles: SubLine[] = merged.map((c, i) => ({
    startSec: Math.round(c.offset / 100) / 10,
    endSec: Math.round((c.offset + c.duration) / 100) / 10,
    en: en[i], zh: zh[i] ?? '',
  }));

  const resp: ApiResp = { videoId, subtitles, count: subtitles.length, source };
  if (withExplain && key && subtitles.length > 0) {
    try { resp.keyWords = await extractKeyWords(subtitles, key); } catch {}
  }

  return Response.json(resp, { headers: { 'Cache-Control': 'public, max-age=86400, s-maxage=86400' } });
}
