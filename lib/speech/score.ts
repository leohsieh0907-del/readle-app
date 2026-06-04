/**
 * 簡易發音評分
 * 用 Web Speech Recognition 拿 transcript，與目標句子做字串相似度比對
 * Phase 1–2 用這個免費方案，Phase 4 可換成 AI 評分
 */

/* ------- Web Speech API 最小型別宣告（瀏覽器內建但 TS lib 沒有）------- */
interface SRResultAlt { transcript: string; confidence: number }
interface SRResult { 0: SRResultAlt; readonly length: number; isFinal: boolean }
interface SRResultList { 0: SRResult; readonly length: number }
interface SREvent extends Event { results: SRResultList; resultIndex: number }
interface SRErrorEvent extends Event { error: string }
interface SR extends EventTarget {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  onresult: ((e: SREvent) => void) | null;
  onerror: ((e: SRErrorEvent) => void) | null;
  onend: (() => void) | null;
}
type SRCtor = new () => SR;

declare global {
  interface Window {
    SpeechRecognition?: SRCtor;
    webkitSpeechRecognition?: SRCtor;
  }
}

export interface SpeechResult {
  transcript: string;
  confidence: number;
  score: number; // 0–100
  feedback: string;
}

const normalize = (s: string) =>
  s.toLowerCase().replace(/[^\w\s']/g, '').replace(/\s+/g, ' ').trim();

/** Levenshtein 距離 */
function lev(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  const dp = Array.from({ length: m + 1 }, (_, i) => [i, ...Array(n).fill(0)]);
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost);
    }
  }
  return dp[m][n];
}

export function scoreTranscript(target: string, transcript: string, confidence = 1): SpeechResult {
  const a = normalize(target);
  const b = normalize(transcript);
  const distance = lev(a, b);
  const maxLen = Math.max(a.length, b.length, 1);
  const similarity = 1 - distance / maxLen;
  const raw = similarity * 0.7 + confidence * 0.3; // 70% 文字相似 + 30% 信心
  const score = Math.round(Math.max(0, Math.min(1, raw)) * 100);

  let feedback = '';
  if (score >= 90) feedback = '完美！像母語者一樣自然 👏';
  else if (score >= 75) feedback = '非常好，幾乎正確 ✨';
  else if (score >= 60) feedback = '不錯，再多練一次會更順';
  else if (score >= 40) feedback = '有點接近，注意重音與發音';
  else feedback = '建議再聽一次原音跟著念';

  return { transcript, confidence, score, feedback };
}

export function isRecognitionAvailable(): boolean {
  if (typeof window === 'undefined') return false;
  return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
}

/** 開始錄音並回傳 Promise，超時或結束自動 resolve */
export function recognize(opts: { lang?: string; timeoutMs?: number } = {}): Promise<{
  transcript: string;
  confidence: number;
}> {
  const { lang = 'en-US', timeoutMs = 8000 } = opts;
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') return reject(new Error('no window'));
    const Ctor = window.SpeechRecognition ?? window.webkitSpeechRecognition;
    if (!Ctor) return reject(new Error('SpeechRecognition not supported'));

    const rec = new Ctor();
    rec.lang = lang;
    rec.interimResults = false;
    rec.maxAlternatives = 1;

    let done = false;
    const finish = (transcript: string, confidence: number) => {
      if (done) return;
      done = true;
      try {
        rec.stop();
      } catch {}
      resolve({ transcript, confidence });
    };

    rec.onresult = (e: SREvent) => {
      const r = e.results[0]?.[0];
      if (r) finish(r.transcript, r.confidence);
    };
    rec.onerror = (e: SRErrorEvent) => {
      if (!done) {
        done = true;
        reject(new Error(e.error ?? 'recognition error'));
      }
    };
    rec.onend = () => {
      if (!done) finish('', 0);
    };

    setTimeout(() => finish('', 0), timeoutMs);
    rec.start();
  });
}
