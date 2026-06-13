/**
 * TTS（文字轉語音）
 *
 * 優先順序：
 * 1. 後端 /api/tts（Edge TTS 或 Google Cloud TTS）→ 最自然
 * 2. 瀏覽器 Web Speech API → 備援
 *
 * 音檔快取在記憶體，同樣的字不重複打 API。
 */

export interface SpeakOptions {
  text: string;
  rate?: number;
  pitch?: number;
  accent?: 'us' | 'uk';
  useBackend?: boolean; // 強制用後端（預設 true）
}

// 記憶體快取（key = text，value = Blob URL）
const audioCache = new Map<string, string>();

function pickVoice(accent: 'us' | 'uk' = 'us'): SpeechSynthesisVoice | null {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return null;
  const all = window.speechSynthesis.getVoices();
  const lang = accent === 'uk' ? 'en-GB' : 'en-US';
  return (
    all.find((v) => v.lang === lang && v.name.toLowerCase().includes('google')) ??
    all.find((v) => v.lang === lang) ??
    all.find((v) => v.lang.startsWith('en')) ??
    null
  );
}

let currentAudio: HTMLAudioElement | null = null;

/** 用後端 TTS API 播放（Edge TTS / Google Neural2） */
async function speakWithBackend(text: string): Promise<void> {
  const key = text.toLowerCase().trim();

  // 快取命中
  if (audioCache.has(key)) {
    const url = audioCache.get(key)!;
    currentAudio?.pause();
    currentAudio = new Audio(url);
    await currentAudio.play();
    return;
  }

  const res = await fetch('/api/tts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  });
  if (!res.ok) throw new Error(`TTS API ${res.status}`);

  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  // 快取（最多保留 100 個）
  if (audioCache.size > 100) {
    const firstKey = audioCache.keys().next().value;
    if (firstKey) {
      URL.revokeObjectURL(audioCache.get(firstKey)!);
      audioCache.delete(firstKey);
    }
  }
  audioCache.set(key, url);

  currentAudio?.pause();
  currentAudio = new Audio(url);
  await currentAudio.play();
}

/** 瀏覽器 Web Speech API 備援 */
function speakWithBrowser(opts: SpeakOptions): void {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(opts.text);
  u.lang = opts.accent === 'uk' ? 'en-GB' : 'en-US';
  u.rate = opts.rate ?? 0.95;
  u.pitch = opts.pitch ?? 1;
  const v = pickVoice(opts.accent);
  if (v) u.voice = v;
  window.speechSynthesis.speak(u);
}

/** 主要發音函式 */
export function speak(opts: SpeakOptions): void {
  const useBackend = opts.useBackend !== false;
  if (useBackend && typeof window !== 'undefined') {
    speakWithBackend(opts.text).catch(() => speakWithBrowser(opts));
  } else {
    speakWithBrowser(opts);
  }
}

export function stopSpeaking(): void {
  currentAudio?.pause();
  currentAudio = null;
  if (typeof window !== 'undefined') window.speechSynthesis.cancel();
}

export function isSpeechAvailable(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}
