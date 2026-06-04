/**
 * Readle 全部 LocalStorage Repos 與預設值
 */

import { Repo } from './repo';
import type {
  User,
  VocabStore,
  ProgressStore,
  HistoryStore,
  AIStore,
  Settings,
} from '../readle-types';

const today = () => new Date().toISOString().slice(0, 10);

/* ---------------- 預設值 ---------------- */

export const defaultUser: User = {
  id: '',
  nickname: '',
  avatar: '🦉',
  cefrLevel: 'B1',
  goal: 'toeic_750',
  interests: ['toeic', 'daily'],
  dailyGoalMinutes: 20,
  createdAt: new Date().toISOString(),
  _version: 1,
};

export const defaultVocab: VocabStore = {
  entries: {},
  _version: 1,
};

export const defaultProgress: ProgressStore = {
  currentStreak: 0,
  longestStreak: 0,
  lastActiveDate: today(),
  totalMinutes: 0,
  totalXP: 0,
  level: 1,
  daily: {},
  _version: 1,
};

export const defaultHistory: HistoryStore = {
  activities: [],
  _version: 1,
};

export const defaultAI: AIStore = {
  sessions: {},
  activeSessionId: undefined,
  totalCallsToday: 0,
  callsResetAt: today(),
  _version: 1,
};

export const defaultSettings: Settings = {
  theme: 'system',
  fontScale: 'md',
  reduceMotion: false,
  player: {
    defaultSpeed: 1.0,
    defaultSubtitleMode: 'both',
    subtitleFontSize: 'md',
  },
  ai: {
    provider: 'gemini',
    tone: 'friendly',
    explainLanguage: 'zh-TW',
    autoTTS: false,
  },
  _version: 1,
};

/* ---------------- Repo 實例 ---------------- */

export const userRepo = new Repo<User>('readle.user', defaultUser);
export const vocabRepo = new Repo<VocabStore>('readle.vocab', defaultVocab);
export const progressRepo = new Repo<ProgressStore>('readle.progress', defaultProgress);
export const historyRepo = new Repo<HistoryStore>('readle.history', defaultHistory);
export const aiRepo = new Repo<AIStore>('readle.ai_sessions', defaultAI);
export const settingsRepo = new Repo<Settings>('readle.settings', defaultSettings);

/** 判斷使用者是否已完成 onboarding */
export function hasOnboarded(): boolean {
  return !!userRepo.get().id;
}
