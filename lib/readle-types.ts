/**
 * Readle 平台 v2 資料型別
 * （沿用 lib/types.ts 既有 readle 閱讀器型別，這裡是新增）
 */

export type CEFR = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
export type Category = 'toeic' | 'business' | 'daily' | 'travel' | 'tech';
export type Goal =
  | 'toeic_550'
  | 'toeic_750'
  | 'toeic_900'
  | 'business'
  | 'daily'
  | 'travel';

/* ---------------- User ---------------- */
export interface User {
  id: string;
  nickname: string;
  avatar: string; // emoji
  cefrLevel: CEFR;
  goal: Goal;
  interests: Category[];
  dailyGoalMinutes: number;
  reminderTime?: string;
  createdAt: string;
  _version: 1;
}

/* ---------------- Vocab ---------------- */
export type SRSStatus = 'new' | 'learning' | 'review' | 'mastered';

export interface SRSState {
  easeFactor: number;
  interval: number;
  repetitions: number;
  nextReviewAt: string;
  lastReviewedAt?: string;
  status: SRSStatus;
}

export interface VocabExample {
  en: string;
  zh: string;
  generatedByAI?: boolean;
}

export interface VocabEntry {
  id: string;
  word: string;
  phonetic?: string;
  partOfSpeech: string;
  meaning: string;
  examples: VocabExample[];
  category: Category;
  tags: string[];
  srs: SRSState;
  addedAt: string;
}

export interface VocabStore {
  entries: Record<string, VocabEntry>;
  _version: 1;
}

/* ---------------- Progress ---------------- */
export interface DailyProgress {
  date: string;
  minutesLearned: number;
  xpEarned: number;
  videosWatched: number;
  wordsReviewed: number;
  quizzesTaken: number;
  goalMet: boolean;
}

export interface ProgressStore {
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: string;
  totalMinutes: number;
  totalXP: number;
  level: number;
  daily: Record<string, DailyProgress>;
  _version: 1;
}

/* ---------------- Activity ---------------- */
export interface Activity {
  id: string;
  type: 'video' | 'vocab_review' | 'quiz' | 'ai_chat' | 'reading';
  title: string;
  detail: string;
  xpEarned: number;
  duration: number;
  refId?: string;
  at: string;
}

export interface HistoryStore {
  activities: Activity[];
  _version: 1;
}

/* ---------------- AI Tutor ---------------- */
export type AIRole = 'user' | 'assistant';
export type AIMode = 'general' | 'scenario' | 'grammar' | 'writing';

export interface ToolCall {
  tool: string;
  args: Record<string, unknown>;
  status: 'pending' | 'success' | 'failed';
  result?: unknown;
}

export interface AIMessage {
  id: string;
  role: AIRole;
  content: string;
  quickReplies?: string[];
  actions?: ToolCall[];
  at: string;
}

export interface AISession {
  id: string;
  title: string;
  mode: AIMode;
  scenarioId?: string;
  messages: AIMessage[];
  createdAt: string;
  updatedAt: string;
}

export interface AIStore {
  sessions: Record<string, AISession>;
  activeSessionId?: string;
  totalCallsToday: number;
  callsResetAt: string;
  _version: 1;
}

/* ---------------- Settings ---------------- */
export interface Settings {
  theme: 'light' | 'dark' | 'system';
  fontScale: 'sm' | 'md' | 'lg';
  reduceMotion: boolean;
  player: {
    defaultSpeed: number;
    defaultSubtitleMode: 'both' | 'en' | 'zh' | 'off';
    subtitleFontSize: 'sm' | 'md' | 'lg';
  };
  ai: {
    provider: 'gemini' | 'groq' | 'mock';
    tone: 'strict' | 'friendly' | 'humorous';
    explainLanguage: 'zh-TW' | 'en';
    autoTTS: boolean;
  };
  _version: 1;
}

/* ---------------- Mock Video ---------------- */
export interface SubtitleLine {
  startSec: number;
  endSec: number;
  en: string;
  zh: string;
}

export interface MockVideo {
  id: string;
  title: string;
  titleZh: string;
  durationSec: number;
  level: CEFR;
  category: Category;
  thumbnail: string;
  views: number;
  subtitles: SubtitleLine[];
  keyWords: string[];
  /** YouTube 影片 ID，有填就播真實影片；沒填則用 mock 模擬器 */
  youtubeId?: string;
}
