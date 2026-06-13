/**
 * POST /api/tts
 * Body: { text: string }
 *
 * 優先順序：
 * 1. Gemini TTS（gemini-2.5-flash-preview-tts）— 用現有 GEMINI_API_KEY，真人聲音
 * 2. Google Cloud TTS Neural2（若另設 GOOGLE_CLOUD_TTS_API_KEY）
 * 3. 回 501 → 前端降級到 Web Speech API
 *
 * 回傳 WAV/MP3，快取 24 小時
 */

import type { NextRequest } from 'next/server';
import { apiGuard } from '@/lib/api-guard';

const GEMINI_TTS_MODEL = 'gemini-2.5-flash-preview-tts';
const GEMINI_VOICE = 'Aoede'; // 女聲，自然流暢，適合英文教學
const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';

/** 從 mimeType 例如 "audio/L16;codec=pcm;rate=24000" 取出取樣率 */
function parseRate(mime: string): number {
  const m = /rate=(\d+)/.exec(mime);
  return m ? parseInt(m[1], 10) : 24000;
}

/** 把 raw PCM (16-bit, mono) 包上 44-byte WAV 檔頭 → 變成瀏覽器可播的 WAV */
function pcmToWav(pcm: Uint8Array, sampleRate: number): Uint8Array {
  const numChannels = 1;
  const bitsPerSample = 16;
  const byteRate = sampleRate * numChannels * (bitsPerSample / 8);
  const blockAlign = numChannels * (bitsPerSample / 8);
  const dataLen = pcm.length;
  const buf = new ArrayBuffer(44 + dataLen);
  const view = new DataView(buf);
  const writeStr = (off: number, s: string) => { for (let i = 0; i < s.length; i++) view.setUint8(off + i, s.charCodeAt(i)); };
  writeStr(0, 'RIFF');
  view.setUint32(4, 36 + dataLen, true);
  writeStr(8, 'WAVE');
  writeStr(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);            // PCM
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);
  writeStr(36, 'data');
  view.setUint32(40, dataLen, true);
  new Uint8Array(buf, 44).set(pcm);
  return new Uint8Array(buf);
}

async function ttsWithGemini(text: string, key: string): Promise<{ data: Uint8Array; mime: string }> {
  const res = await fetch(`${GEMINI_BASE}/${GEMINI_TTS_MODEL}:generateContent?key=${key}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text }] }],
      generationConfig: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName: GEMINI_VOICE } },
        },
      },
    }),
  });
  if (!res.ok) throw new Error(`Gemini TTS ${res.status}: ${await res.text()}`);

  const json = (await res.json()) as {
    candidates?: { content?: { parts?: { inlineData?: { data?: string; mimeType?: string } }[] } }[];
  };
  const part = json.candidates?.[0]?.content?.parts?.[0]?.inlineData;
  if (!part?.data) throw new Error('no audio data in response');

  const raw = atob(part.data);
  const bytes = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);

  const mime = part.mimeType ?? 'audio/wav';
  // Gemini 回傳 raw PCM（L16）→ 包成 WAV 才能在瀏覽器播放
  if (/L16|pcm/i.test(mime)) {
    return { data: pcmToWav(bytes, parseRate(mime)), mime: 'audio/wav' };
  }
  return { data: bytes, mime };
}

async function ttsWithGoogle(text: string, key: string): Promise<Uint8Array> {
  const res = await fetch(`https://texttospeech.googleapis.com/v1/text:synthesize?key=${key}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      input: { text },
      voice: { languageCode: 'en-US', name: 'en-US-Neural2-C' },
      audioConfig: { audioEncoding: 'MP3', speakingRate: 0.92 },
    }),
  });
  if (!res.ok) throw new Error(`Google TTS ${res.status}`);
  const d = (await res.json()) as { audioContent?: string };
  if (!d.audioContent) throw new Error('empty');
  const raw = atob(d.audioContent);
  const bytes = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
  return bytes;
}

export async function POST(req: NextRequest) {
  const blocked = apiGuard(req);
  if (blocked) return blocked;

  const body = await req.json().catch(() => ({})) as { text?: string };
  const text = (body.text ?? '').trim().slice(0, 300);
  if (!text) return Response.json({ error: 'text required' }, { status: 400 });

  const cache = { 'Content-Type': '', 'Cache-Control': 'public, max-age=86400' };

  // 1. Gemini TTS（現有 key，最優先）
  const geminiKey = process.env.GEMINI_API_KEY;
  if (geminiKey) {
    try {
      const { data, mime } = await ttsWithGemini(text, geminiKey);
      cache['Content-Type'] = mime;
      return new Response(data.buffer as ArrayBuffer, {
        headers: { ...cache, 'X-TTS': 'gemini' },
      });
    } catch (e) {
      console.warn('[TTS] Gemini failed, trying Google:', String(e).slice(0, 120));
    }
  }

  // 2. Google Cloud TTS（若另外設了 key）
  const googleKey = process.env.GOOGLE_CLOUD_TTS_API_KEY;
  if (googleKey) {
    try {
      const data = await ttsWithGoogle(text, googleKey);
      cache['Content-Type'] = 'audio/mpeg';
      return new Response(data.buffer as ArrayBuffer, {
        headers: { ...cache, 'X-TTS': 'google' },
      });
    } catch (e) {
      console.warn('[TTS] Google failed:', String(e).slice(0, 80));
    }
  }

  // 3. 降級 → 前端用 Web Speech
  return Response.json({ error: 'no_key', fallback: 'web-speech' }, { status: 501 });
}
