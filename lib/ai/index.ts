/**
 * AI Provider 入口 — 依設定切換
 */

import { settingsRepo } from '../storage/repos';
import type { LLMProvider, ProviderName } from './provider';
import { mockProvider } from './mock';
import { geminiProvider } from './gemini';

const providers: Record<ProviderName, LLMProvider> = {
  mock: mockProvider,
  gemini: geminiProvider,
  groq: mockProvider, // TODO Phase 4.5：實作 Groq
};

/**
 * 取得目前 provider
 * 伺服器已設定 Gemini key，預設一律使用 Gemini（真實 AI）。
 * mock 已退役為內部後備，不再是使用者預設。
 */
export function getProvider(): LLMProvider {
  if (typeof window === 'undefined') return geminiProvider;
  const name = settingsRepo.get().ai.provider;
  if (name === 'groq') return providers.groq;
  return geminiProvider;
}

/** 強制使用特定 provider（用於設定頁測試） */
export function getProviderByName(name: ProviderName): LLMProvider {
  return providers[name] ?? mockProvider;
}

export type { LLMProvider, ProviderName, ChatRequest, ChatResponse, ChatMessage } from './provider';
