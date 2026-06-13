/**
 * TTS（文字轉語音）— 快取優先策略
 *
 * - 已快取（IndexedDB/記憶體）→ 瞬間播放 Gemini 高音質音檔（<50ms）
 * - 未快取 → 立刻用 Web Speech 頂著，同時背景下載並永久快取，下次秒開
 * - 頁面載入時 prefetchAll() 先把畫面上的字備好 → 第一次點就是瞬間
 */

import { getCachedBlob, putCachedBlob } from './audio-cache';

export interface SpeakOptions {
  text: string;
  rate?: number;
  pitch?: number;
  accent?: 'us' | 'uk';
  useBackend?: boolean; // 保留相容；新版一律走快取優先
}

const VOICE_KEY = 'readle.tts_voice';
const RATE_KEY = 'readle.tts_rate';

let voicesReady = false;
let cachedVoice: SpeechSynthesisVoice | null = null;
let userRate = typeof window !== 'undefined'
  ? (() => { const r = parseFloat(localStorage.getItem(RATE_KEY) ?? ''); return r >= 0.5 && r <= 1.5 ? r : 0.95; })()
  : 0.95;

/** 是否為「神經/自然」語音（Edge 的 Online (Natural)、Google 等，比機械音自然）*/
function isNeural(v: SpeechSynthesisVoice): boolean {
  return /Natural|Neural|Online \(Natural\)/i.test(v.name) || v.name.includes('Google');
}

function allEnVoices(): SpeechSynthesisVoice[] {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return [];
  return window.speechSynthesis.getVoices().filter((v) => /^en/i.test(v.lang));
}

/** 挑語音：使用者指定 → 神經(Aria/en-US) → 任何神經 → 本地快速 → 任何英文 */
function pickVoice(accent: 'us' | 'uk' = 'us'): SpeechSynthesisVoice | null {
  const en = allEnVoices();
  if (!en.length) return null;
  const lang = accent === 'uk' ? 'en-GB' : 'en-US';
  const saved = typeof window !== 'undefined' ? localStorage.getItem(VOICE_KEY) : null;
  const neural = en.filter(isNeural);
  return (
    (saved ? en.find((v) => v.name === saved) : null) ||
    neural.find((v) => /Aria/i.test(v.name) && v.lang === lang) ||
    neural.find((v) => v.lang === lang) ||
    neural[0] ||
    en.find((v) => v.localService && v.lang === lang) ||
    en.find((v) => v.lang === lang) ||
    en[0] || null
  );
}

function loadVoices(accent: 'us' | 'uk' = 'us'): SpeechSynthesisVoice | null {
  return pickVoice(accent);
}

function warmUp() {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  if (voicesReady) return;
  const tryLoad = () => {
    cachedVoice = pickVoice('us');
    if (cachedVoice) voicesReady = true;
  };
  tryLoad();
  if (!voicesReady) window.speechSynthesis.onvoiceschanged = tryLoad;
}

// ── 手勢解鎖（手機/Safari 第一次需使用者手勢才會出聲）──
let unlocked = false;
export function unlockSpeech(): void {
  if (unlocked || typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  try { window.speechSynthesis.speak(new SpeechSynthesisUtterance('')); } catch { /* ignore */ }
  unlocked = true;
}

// ── 發音設定 API（給設定面板用）──
export function hasNeuralVoice(): boolean { return allEnVoices().some(isNeural); }
export function listEnglishVoices(): { name: string; lang: string; neural: boolean }[] {
  return allEnVoices()
    .map((v) => ({ name: v.name, lang: v.lang, neural: isNeural(v) }))
    .sort((a, b) => Number(b.neural) - Number(a.neural));
}
export function setVoiceByName(name: string): void {
  if (typeof window !== 'undefined') localStorage.setItem(VOICE_KEY, name);
  cachedVoice = pickVoice('us');
}
export function getCurrentVoiceName(): string { return cachedVoice?.name ?? ''; }
export function setSpeechRate(r: number): void {
  userRate = r;
  if (typeof window !== 'undefined') localStorage.setItem(RATE_KEY, String(r));
}
export function getSpeechRate(): number { return userRate; }

if (typeof window !== 'undefined') {
  warmUp();
}

let currentAudio: HTMLAudioElement | null = null;
let kaTimer: ReturnType<typeof setInterval> | null = null;

/** Chrome 長句保活：念的時候每 5 秒 pause/resume，防 15 秒被自動截斷 */
function keepAlive() {
  if (typeof window === 'undefined') return;
  if (kaTimer) clearInterval(kaTimer);
  kaTimer = setInterval(() => {
    const s = window.speechSynthesis;
    if (!s.speaking) { if (kaTimer) { clearInterval(kaTimer); kaTimer = null; } return; }
    s.pause(); s.resume();
  }, 5000);
}

/** Web Speech API — 神經語音優先；長句切短逐句念；保活防截斷 */
function speakWithBrowser(opts: SpeakOptions): void {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  const synth = window.speechSynthesis;
  if (synth.speaking || synth.pending) synth.cancel();

  const voice = (opts.accent === 'uk' ? pickVoice('uk') : cachedVoice) ?? pickVoice(opts.accent ?? 'us');
  const rate = opts.rate ?? userRate;
  const lang = opts.accent === 'uk' ? 'en-GB' : 'en-US';
  const chunks = opts.text.match(/[^.!?。！？]+[.!?。！？]?/g) ?? [opts.text];
  for (const c of chunks) {
    const u = new SpeechSynthesisUtterance(c);
    u.lang = lang;
    u.rate = rate;
    u.pitch = opts.pitch ?? 1;
    if (voice) u.voice = voice;
    synth.speak(u);
  }
  synth.resume();
  keepAlive();
}

// ─── 預先快取 + 瞬間播放（終極方案）─────────────────────────
const memUrl = new Map<string, string>();   // text → blob URL（記憶體，最快）
const inflight = new Set<string>();          // 正在下載中的字，避免重複
const MEM_MAX = 200;                          // 記憶體 blob URL 上限

/** 寫入 memUrl，超過上限就釋放最舊的 blob URL（避免記憶體洩漏）*/
function setMemUrl(key: string, url: string) {
  if (memUrl.size >= MEM_MAX) {
    const oldest = memUrl.keys().next().value;
    if (oldest) { URL.revokeObjectURL(memUrl.get(oldest)!); memUrl.delete(oldest); }
  }
  memUrl.set(key, url);
}

function norm(text: string) { return text.toLowerCase().trim(); }

// ── 靜態預產音檔（Duolingo 模式：CDN + 瀏覽器快取，瞬間、不碰 Gemini）──
const staticSet = new Set<string>();
function staticSlug(text: string): string {
  return text.toLowerCase().trim().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
}
function staticUrl(text: string): string | null {
  const s = staticSlug(text);
  return staticSet.has(s) ? `/audio/${s}.mp3` : null;
}
// 載入清單（哪些字有預產檔）
if (typeof window !== 'undefined') {
  fetch('/audio/manifest.json')
    .then((r) => (r.ok ? r.json() : []))
    .then((list: string[]) => { for (const s of list) staticSet.add(s); })
    .catch(() => {});
}

function playUrl(url: string) {
  currentAudio?.pause();
  currentAudio = new Audio(url);
  currentAudio.play().catch(() => {});
}

/**
 * 預先快取音檔（背景執行，不發聲）
 * 流程：記憶體有 → 跳過；IndexedDB 有 → 載入記憶體；都沒有 → 跟 Gemini 要一次並永久存起來
 */
export async function prefetchAudio(text: string): Promise<void> {
  if (typeof window === 'undefined') return;
  const key = norm(text);
  if (!key || memUrl.has(key) || inflight.has(key)) return;
  if (staticUrl(text)) return; // 已有靜態檔，免下載
  inflight.add(key);
  try {
    // 1. IndexedDB 已有 → 直接用（不打 API）
    const cached = await getCachedBlob(key);
    if (cached) { setMemUrl(key, URL.createObjectURL(cached)); return; }
    // 2. 跟 Gemini 要一次，存進 IndexedDB（永久）
    const res = await fetch('/api/tts', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });
    if (!res.ok) return;
    const blob = await res.blob();
    await putCachedBlob(key, blob);
    setMemUrl(key, URL.createObjectURL(blob));
  } catch { /* 失敗就算了，speak 會用 Web Speech 頂著 */ }
  finally { inflight.delete(key); }
}

/** 批次預先快取（循序、有間隔，避免把 Gemini 打到限流）*/
export async function prefetchAll(texts: string[]): Promise<void> {
  for (const t of texts) {
    await prefetchAudio(t);
    await new Promise((r) => setTimeout(r, 250));
  }
}

/**
 * 主要發音函式（全站唯一入口）
 * - 單字有靜態 MP3 → 瞬間播放（即時，最重要）
 * - 記憶體快取 → 瞬間
 * - 沒靜態檔（句子/罕見字）→ Web Speech（Edge 上是神經語音，自然）並背景快取
 *
 * ⚠️ 神經語音是網路語音、每次有延遲，故只用於句子；單字一律走靜態 MP3 保持「點了立刻響」。
 */
export function speak(opts: SpeakOptions): void {
  if (typeof window === 'undefined') return;
  const key = norm(opts.text);

  // 1. 靜態 MP3（單字，瞬間）
  const su = staticUrl(opts.text);
  if (su) { playUrl(su); return; }
  // 2. 記憶體快取（瞬間）
  if (memUrl.has(key)) { playUrl(memUrl.get(key)!); return; }
  // 3. 句子/罕見字 → Web Speech（Edge 神經語音）+ 背景快取
  speakWithBrowser(opts);
  (async () => {
    const cached = await getCachedBlob(key);
    if (cached) { setMemUrl(key, URL.createObjectURL(cached)); return; }
    prefetchAudio(opts.text);
  })();
}

let sentenceToken = 0;

/**
 * 整句自然發音（Luna 通話用）— 像母語人士一樣連貫，不拆字，唸完才 resolve
 * - 有神經語音（Edge）→ 直接用神經語音 Web Speech（自然、即時、不耗 Gemini 配額）
 * - 無神經語音 → Gemini 整句（Aoede）→ 失敗退回 Web Speech
 * rate：0.5–1.5，1 為正常。
 */
export function speakNatural(opts: { text: string; rate?: number }): Promise<void> {
  const rate = opts.rate ?? userRate;
  const myToken = ++sentenceToken;            // 新句子會讓舊的停止
  const superseded = () => myToken !== sentenceToken;

  return new Promise((resolve) => {
    if (typeof window === 'undefined') { resolve(); return; }

    const webSpeech = () => {
      if (superseded()) { resolve(); return; }
      if (!('speechSynthesis' in window)) { resolve(); return; }
      const synth = window.speechSynthesis;
      if (synth.speaking || synth.pending) synth.cancel();
      const voice = cachedVoice ?? pickVoice('us');
      const chunks = opts.text.match(/[^.!?。！？]+[.!?。！？]?/g) ?? [opts.text];
      let done = false;
      const finish = () => { if (!done) { done = true; resolve(); } };
      chunks.forEach((c, i) => {
        const u = new SpeechSynthesisUtterance(c);
        u.lang = 'en-US';
        u.rate = rate;
        if (voice) u.voice = voice;
        if (i === chunks.length - 1) { u.onend = finish; u.onerror = finish; }
        synth.speak(u);
      });
      synth.resume();
      keepAlive();
      setTimeout(finish, Math.max(3000, (opts.text.split(/\s+/).length * 480) / rate) + 1500);
    };

    // Edge 神經語音 → 直接用（自然、即時、不耗配額）
    if (hasNeuralVoice()) { webSpeech(); return; }

    // 無神經語音 → Gemini 整句 → 失敗退 Web Speech
    (async () => {
      try {
        const res = await fetch('/api/tts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: opts.text }),
        });
        if (superseded()) { resolve(); return; }
        if (!res.ok) { webSpeech(); return; }
        const blob = await res.blob();
        if (superseded()) { resolve(); return; }
        const url = URL.createObjectURL(blob);
        currentAudio?.pause();
        const a = new Audio(url);
        a.playbackRate = rate;
        currentAudio = a;
        const cleanup = () => URL.revokeObjectURL(url);
        a.onended = () => { cleanup(); resolve(); };
        a.onerror = () => { cleanup(); webSpeech(); };
        a.play().catch(() => { cleanup(); webSpeech(); });
      } catch {
        webSpeech();
      }
    })();
  });
}

/** 給 ArticlePlayer 等需要自管佇列的元件取用同一把語音/語速 */
export function getPreferredVoice(): SpeechSynthesisVoice | null {
  return cachedVoice ?? pickVoice('us');
}

export function stopSpeaking(): void {
  sentenceToken++; // 中止整句播放
  currentAudio?.pause();
  currentAudio = null;
  if (typeof window !== 'undefined') window.speechSynthesis.cancel();
}

export function isSpeechAvailable(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}
