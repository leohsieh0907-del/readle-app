/**
 * GET /api/youtube-search?q=QUERY&level=B1
 *
 * 搜尋英文學習 YouTube 影片
 * 優先：YouTube Data API v3（需啟用）
 * 備用：Gemini 推薦相關影片 ID（完全免費，即時可用）
 */

import type { NextRequest } from 'next/server';
import { apiGuard } from '@/lib/api-guard';

interface VideoResult {
  id: string;
  title: string;
  titleZh: string;
  channelTitle: string;
  thumbnail: string;
  durationHint: string;
  level?: string;
}

// ─── YouTube Data API v3 ──────────────────────────────

async function searchYouTube(q: string, key: string): Promise<VideoResult[]> {
  const params = new URLSearchParams({
    part: 'snippet',
    q: `${q} english learning`,
    type: 'video',
    maxResults: '10',
    relevanceLanguage: 'en',
    key,
  });
  const res = await fetch(`https://www.googleapis.com/youtube/v3/search?${params}`);
  if (!res.ok) throw new Error(`YouTube API ${res.status}`);
  const data = await res.json() as {
    items?: {
      id: { videoId?: string };
      snippet: { title: string; channelTitle: string; thumbnails: { medium?: { url: string } } };
    }[];
  };
  return (data.items ?? [])
    .filter(i => i.id.videoId)
    .map(i => ({
      id: i.id.videoId!,
      title: i.snippet.title,
      titleZh: '',
      channelTitle: i.snippet.channelTitle,
      thumbnail: i.snippet.thumbnails.medium?.url ?? '',
      durationHint: '~5 min',
    }));
}

// ─── Gemini 備援推薦 ──────────────────────────────────

async function searchWithGemini(q: string, key: string): Promise<VideoResult[]> {
  const prompt = `I need English learning YouTube video recommendations for the query: "${q}"

Return a JSON array of 6 real YouTube videos about this topic (choose well-known English learning channels like engVid, BBC Learning English, English with Lucy, mmmEnglish, JamesESL, etc.)

Each item: {"id":"11-char-youtube-id","title":"exact video title","channelTitle":"channel name","level":"A2|B1|B2|C1","durationHint":"~X min"}

Return ONLY the JSON array. Make sure the YouTube IDs are real and the videos exist.`;

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.2, maxOutputTokens: 1500, thinkingConfig: { thinkingBudget: 0 } },
      }),
    },
  );
  if (!res.ok) throw new Error(`Gemini ${res.status}`);
  const data = await res.json() as { candidates?: { content?: { parts?: { text?: string }[] } }[] };
  const text = data.candidates?.[0]?.content?.parts?.map(p => p.text ?? '').join('') ?? '';
  const m = text.match(/\[[\s\S]*\]/);
  if (!m) throw new Error('no json array');
  const parsed = JSON.parse(m[0]) as Partial<VideoResult>[];
  return parsed
    .filter(v => v.id && v.title)
    .map(v => ({
      id: v.id!,
      title: v.title!,
      titleZh: '',
      channelTitle: v.channelTitle ?? '',
      thumbnail: `https://img.youtube.com/vi/${v.id}/mqdefault.jpg`,
      durationHint: v.durationHint ?? '~5 min',
      level: v.level,
    }));
}

// ─── 用 Gemini 翻譯標題成中文 ─────────────────────────

async function translateTitles(videos: VideoResult[], key: string): Promise<VideoResult[]> {
  if (videos.length === 0) return videos;
  const titles = videos.map((v, i) => `${i + 1}. ${v.title}`).join('\n');
  const prompt = `翻譯以下 YouTube 影片標題成繁體中文（簡短，保留關鍵詞），每行一個，只輸出翻譯結果（番號.空格翻譯）：\n\n${titles}`;
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.2, maxOutputTokens: 800, thinkingConfig: { thinkingBudget: 0 } },
        }),
      },
    );
    if (!res.ok) return videos;
    const d = await res.json() as { candidates?: { content?: { parts?: { text?: string }[] } }[] };
    const text = d.candidates?.[0]?.content?.parts?.map(p => p.text ?? '').join('') ?? '';
    const lines = text.split('\n').filter(l => l.trim());
    return videos.map((v, i) => {
      const line = lines[i] ?? '';
      const m = line.match(/^\d+\.\s*(.+)/);
      return { ...v, titleZh: m ? m[1].trim() : '' };
    });
  } catch {
    return videos;
  }
}

export async function GET(req: NextRequest) {
  const blocked = apiGuard(req);
  if (blocked) return blocked;

  const q = req.nextUrl.searchParams.get('q')?.trim();
  if (!q || q.length < 2) return Response.json({ error: 'query too short' }, { status: 400 });

  const geminiKey = process.env.GEMINI_API_KEY;
  const ytKey = process.env.YOUTUBE_API_KEY ?? process.env.GEMINI_API_KEY;

  let results: VideoResult[] = [];
  let source = '';

  // 嘗試 YouTube Data API
  if (ytKey) {
    try {
      results = await searchYouTube(q, ytKey);
      source = 'youtube';
    } catch { /* 未啟用，fallback */ }
  }

  // Gemini 備援推薦
  if (results.length === 0 && geminiKey) {
    try {
      results = await searchWithGemini(q, geminiKey);
      source = 'gemini_recommend';
    } catch (e) {
      return Response.json({ error: String(e) }, { status: 503 });
    }
  }

  // 翻譯標題（有 Gemini key 就翻）
  if (geminiKey && results.length > 0) {
    results = await translateTitles(results, geminiKey);
  }

  return Response.json({ results, source, count: results.length });
}
