/**
 * LLMProvider 抽象 — 切換 Gemini / Groq / Mock
 * 設定頁可選 provider，所有 AI 呼叫透過此層
 */

export type ProviderName = 'mock' | 'gemini' | 'groq';

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ChatRequest {
  messages: ChatMessage[];
  /** 0-2，預設 0.7 */
  temperature?: number;
  /** 系統角色提示，會合併到 messages */
  systemPrompt?: string;
  /** 要求 JSON 輸出（會在 prompt 加 instruction） */
  jsonMode?: boolean;
  /** 最大 token */
  maxTokens?: number;
}

export interface ChatResponse {
  content: string;
  usage?: { in: number; out: number };
}

export interface LLMProvider {
  name: ProviderName;
  chat(req: ChatRequest): Promise<ChatResponse>;
  /** Server-sent stream 版本，回傳 async iterator of text chunks */
  chatStream?(req: ChatRequest): AsyncIterable<string>;
}

/* ============== 配額追蹤（簡易版） ============== */

const QUOTA_KEY = 'readle.ai_quota';

interface QuotaState {
  date: string; // YYYY-MM-DD
  callsToday: number;
}

export function getQuotaToday(): QuotaState {
  if (typeof window === 'undefined') return { date: '', callsToday: 0 };
  const today = new Date().toISOString().slice(0, 10);
  const raw = localStorage.getItem(QUOTA_KEY);
  if (!raw) return { date: today, callsToday: 0 };
  try {
    const q = JSON.parse(raw) as QuotaState;
    if (q.date !== today) return { date: today, callsToday: 0 };
    return q;
  } catch {
    return { date: today, callsToday: 0 };
  }
}

export function bumpQuota(): void {
  if (typeof window === 'undefined') return;
  const q = getQuotaToday();
  q.callsToday += 1;
  localStorage.setItem(QUOTA_KEY, JSON.stringify(q));
}

/** Gemini Flash 免費上限：每天 1500 次 */
export const DAILY_QUOTA = 1500;
