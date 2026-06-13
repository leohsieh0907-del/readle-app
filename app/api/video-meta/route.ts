/**
 * GET /api/video-meta?v=YOUTUBE_ID
 * 從 YouTube API 拿影片標題，並用 Gemini 翻譯成中文
 * Key 在後端，不暴露給前端
 */

import type { NextRequest } from 'next/server';

export async function GET(req: NextRequest) {
  const videoId = req.nextUrl.searchParams.get('v');
  if (!videoId) return Response.json({ error: 'Missing ?v=' }, { status: 400 });

  const ytKey = process.env.YOUTUBE_API_KEY;
  const geminiKey = process.env.GEMINI_API_KEY;

  if (!ytKey) return Response.json({ error: 'no youtube key' }, { status: 503 });

  try {
    const res = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoId}&key=${ytKey}`,
    );
    if (!res.ok) throw new Error(`YouTube ${res.status}`);

    const data = await res.json() as {
      items?: { snippet?: { title?: string; channelTitle?: string; description?: string } }[];
    };
    const snippet = data.items?.[0]?.snippet;
    const title = snippet?.title ?? '';
    const channel = snippet?.channelTitle ?? '';

    // 翻譯標題成中文
    let titleZh = '';
    if (title && geminiKey) {
      try {
        const tr = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ role: 'user', parts: [{ text: `把以下 YouTube 影片標題翻成繁體中文（簡短自然），只輸出翻譯結果：${title}` }] }],
              generationConfig: { temperature: 0.2, maxOutputTokens: 80, thinkingConfig: { thinkingBudget: 0 } },
            }),
          },
        );
        if (tr.ok) {
          const td = await tr.json() as { candidates?: { content?: { parts?: { text?: string }[] } }[] };
          titleZh = td.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? '';
        }
      } catch { /* ignore */ }
    }

    return Response.json({ videoId, title, titleZh, channel });
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 503 });
  }
}
