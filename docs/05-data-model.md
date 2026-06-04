# 05 · 資料模型（LocalStorage Schema）

## 5.1 設計原則

- **單一入口**：所有讀寫透過 `lib/storage/repo.ts`，方便將來換 Prisma
- **以 ID 索引**：實體用 `Record<id, Entity>` 而非陣列，存取 O(1)
- **版本欄位**：每個 schema 帶 `_version`，方便 migration
- **大小控制**：LocalStorage 上限 ~5MB，需注意對話歷史與 mock 影片資料的容量

## 5.2 Top-level Keys

```
localStorage:
  readle.user            使用者個資與偏好
  readle.vocab           單字本（含 SRS 狀態）
  readle.progress        學習進度與統計
  readle.history         學習活動歷史
  readle.achievements    成就解鎖紀錄
  readle.ai_sessions     AI 對話歷史
  readle.quiz_records    測驗紀錄
  readle.settings        UI / AI 偏好設定
  readle._meta           schema 版本、最後同步時間
```

## 5.3 TypeScript Schema

### 5.3.1 User

```typescript
interface User {
  id: string;              // uuid，首次進站生成
  nickname: string;
  avatar: string;          // emoji
  cefrLevel: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
  goal: 'toeic_550' | 'toeic_750' | 'toeic_900' | 'business' | 'daily' | 'travel';
  interests: Category[];   // ['toeic', 'business', ...]
  dailyGoalMinutes: number;
  reminderTime?: string;   // 'HH:mm'
  createdAt: string;       // ISO
  _version: 1;
}

type Category = 'toeic' | 'business' | 'daily' | 'travel' | 'tech';
```

### 5.3.2 Vocab（單字本）

```typescript
interface VocabEntry {
  id: string;
  word: string;
  phonetic?: string;       // /ɪˈlæbəreɪt/
  partOfSpeech: string;    // 'verb' | 'noun' | ...
  definitions: Definition[];
  examples: Example[];
  category: Category;
  tags: string[];          // 使用者自訂

  // SRS 狀態
  srs: {
    easeFactor: number;        // 預設 2.5
    interval: number;          // 下次複習相隔天數
    repetitions: number;       // 連續答對次數
    nextReviewAt: string;      // ISO date
    lastReviewedAt?: string;
    status: 'new' | 'learning' | 'review' | 'mastered';
  };

  addedAt: string;
  source?: {                   // 從哪裡加入的
    type: 'video' | 'article' | 'ai' | 'manual';
    id?: string;               // videoId / articleId
  };
}

interface Definition {
  meaning: string;             // 中文釋義
  synonyms?: string[];
}

interface Example {
  en: string;
  zh: string;
  generatedByAI?: boolean;
}

type VocabStore = {
  entries: Record<string, VocabEntry>;
  _version: 1;
}
```

### 5.3.3 Progress（學習進度）

```typescript
interface DailyProgress {
  date: string;                // 'YYYY-MM-DD'
  minutesLearned: number;
  xpEarned: number;
  videosWatched: number;
  wordsReviewed: number;
  quizzesTaken: number;
  goalMet: boolean;
}

interface ProgressStore {
  // 連續學習
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: string;

  // 累計
  totalMinutes: number;
  totalXP: number;
  level: number;               // 由 XP 計算

  // 每日紀錄（最多保留 365 天）
  daily: Record<string, DailyProgress>;  // key: 'YYYY-MM-DD'

  _version: 1;
}
```

**等級計算**：
```
Level 1: 0 XP
Level N: floor(100 * N ^ 1.5)
舉例 Level 10 需 ~3162 XP
```

**XP 取得**：
- 看完 1 個影片片段：+10 XP
- 複習對 1 個單字：+5 XP
- 完成 1 場測驗：+30 XP + (準確率 × 50)
- 跟讀評分 ≥ 80：+15 XP
- 連續 7 天：+100 XP

### 5.3.4 Activity History

```typescript
interface Activity {
  id: string;
  type: 'video' | 'vocab_review' | 'quiz' | 'ai_chat' | 'reading';
  title: string;               // 「看了《商業 Email 慣用語》」
  detail: string;              // 「12 分鐘 / 學會 5 個新單字」
  xpEarned: number;
  duration: number;            // 秒
  refId?: string;              // 對應的 videoId / quizId
  at: string;                  // ISO
}

interface HistoryStore {
  activities: Activity[];      // 最多保留 200 筆，超過丟最舊
  _version: 1;
}
```

### 5.3.5 Achievements

```typescript
interface AchievementUnlock {
  id: AchievementId;
  unlockedAt: string;
  tier?: 'bronze' | 'silver' | 'gold' | 'diamond';
}

type AchievementId =
  | 'first_step'
  | 'streak_7'
  | 'streak_30'
  | 'streak_100'
  | 'vocab_100'
  | 'vocab_500'
  | 'vocab_1000'
  | 'shadow_50'
  | 'quiz_perfect'
  | 'ai_friend_100'
  | 'xp_10000';

interface AchievementStore {
  unlocked: Record<AchievementId, AchievementUnlock>;
  _version: 1;
}
```

### 5.3.6 AI Sessions

```typescript
interface AIMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  actions?: ToolCall[];        // AI 觸發的 tool calls
  audio?: string;              // base64 錄音（暫存，發送後清除）
  at: string;
}

interface AISession {
  id: string;
  title: string;               // AI 自動命名，如「面試對話練習」
  mode: 'general' | 'scenario' | 'grammar' | 'writing';
  scenarioId?: string;         // 若 mode = scenario
  messages: AIMessage[];       // 單場最多保留 20 輪
  createdAt: string;
  updatedAt: string;
}

interface AIStore {
  sessions: Record<string, AISession>;
  activeSessionId?: string;
  totalCallsToday: number;     // 配額追蹤
  callsResetAt: string;
  _version: 1;
}

interface ToolCall {
  tool: string;
  args: Record<string, unknown>;
  status: 'pending' | 'success' | 'failed';
  result?: unknown;
}
```

### 5.3.7 Quiz Records

```typescript
interface QuizRecord {
  id: string;
  type: 'listening' | 'cloze' | 'vocab' | 'ai_gen';
  topic?: string;
  questions: QuizQuestion[];
  answers: QuizAnswer[];
  score: number;               // 0–100
  durationSec: number;
  takenAt: string;
}

interface QuizQuestion {
  id: string;
  stem: string;
  options: string[];
  correctIndex: number;
  audioUrl?: string;
  explanation?: string;
  skillTag: 'listening' | 'vocab' | 'grammar' | 'idiom' | 'spelling';
  relatedWordId?: string;
}

interface QuizAnswer {
  questionId: string;
  selectedIndex: number;
  correct: boolean;
  timeSpentSec: number;
}

interface QuizStore {
  records: QuizRecord[];       // 最多 100 筆
  _version: 1;
}
```

### 5.3.8 Settings

```typescript
interface Settings {
  theme: 'light' | 'dark' | 'system';
  fontScale: 'sm' | 'md' | 'lg';
  reduceMotion: boolean;

  player: {
    defaultSpeed: number;        // 1.0
    defaultSubtitleMode: 'both' | 'en' | 'zh' | 'off';
    subtitleFontSize: 'sm' | 'md' | 'lg';
  };

  ai: {
    provider: 'gemini' | 'groq' | 'mock';
    tone: 'strict' | 'friendly' | 'humorous';
    explainLanguage: 'zh-TW' | 'en';
    autoTTS: boolean;            // AI 回覆是否自動朗讀
  };

  notifications: {
    daily: boolean;
    streakRisk: boolean;         // 連續快斷時提醒
  };

  _version: 1;
}
```

## 5.4 Repository 介面

```typescript
// lib/storage/repo.ts

export class Repo<T extends { _version: number }> {
  constructor(private key: string, private defaultValue: T) {}

  get(): T {
    if (typeof window === 'undefined') return this.defaultValue;
    const raw = localStorage.getItem(this.key);
    if (!raw) return this.defaultValue;
    return this.migrate(JSON.parse(raw));
  }

  set(value: T): void {
    localStorage.setItem(this.key, JSON.stringify(value));
  }

  update(patcher: (current: T) => T): void {
    this.set(patcher(this.get()));
  }

  clear(): void {
    localStorage.removeItem(this.key);
  }

  private migrate(data: any): T {
    // 比對 _version，做版本升級
    return data;
  }
}

// 使用
export const userRepo = new Repo<UserStore>('readle.user', defaultUserStore);
export const vocabRepo = new Repo<VocabStore>('readle.vocab', { entries: {}, _version: 1 });
// ...
```

## 5.5 Mock 種子資料

啟動時若 LocalStorage 為空，從 `lib/storage/seed.ts` 載入：

### 5.5.1 影片（10 部）

```typescript
const mockVideos = [
  {
    id: 'v001',
    title: 'Business Email Phrases You Need to Know',
    titleZh: '你必須知道的商業 Email 慣用語',
    youtubeId: 'mockYTID1',     // 假 ID（Phase 2 用本地 mp4 或佔位）
    durationSec: 412,
    level: 'B1',
    category: 'business',
    thumbnail: '/mock/v001.jpg',
    subtitles: [
      { startSec: 0, endSec: 3.2, en: 'Hello everyone, welcome back.', zh: '大家好，歡迎回來。' },
      { startSec: 3.2, endSec: 6.8, en: 'Today we\'ll talk about email phrases.', zh: '今天我們要談談 Email 慣用語。' },
      // ...
    ],
    keyWords: ['phrase', 'casual', 'formal', 'sincerely'],
  },
  // 其他 9 部涵蓋多益、日常、旅遊、科技
];
```

### 5.5.2 單字（種子 50 個 + 使用者收藏）

```typescript
const seedWords = [
  { word: 'elaborate', phonetic: '/ɪˈlæbəreɪt/', category: 'toeic', /* ... */ },
  { word: 'subsequently', phonetic: '/ˈsʌbsɪkwəntli/', category: 'toeic', /* ... */ },
  // 50 個高頻多益單字
];
```

### 5.5.3 假進度（首次進站可選「展示模式」）

提供 demo data：30 天的學習熱力圖、解鎖 5 個徽章、3 場測驗紀錄。方便看 UI 效果。

## 5.6 容量管理

| Key | 預估大小 | 上限策略 |
|---|---|---|
| user | < 1 KB | — |
| vocab | 1000 個單字 ≈ 500 KB | 無限，但 > 2000 時提示匯出 |
| progress | 365 天 ≈ 50 KB | 自動刪除 > 1 年舊紀錄 |
| history | 200 筆 ≈ 30 KB | FIFO |
| achievements | < 5 KB | — |
| ai_sessions | 20 場 × 20 訊息 ≈ 200 KB | 超過 20 場時刪最舊 |
| quiz_records | 100 筆 ≈ 100 KB | FIFO |
| settings | < 2 KB | — |
| **總計** | **< 1 MB** | 安全 |

## 5.7 匯出 / 匯入

`/settings → 資料` 提供：
- **匯出**：把所有 `readle.*` 打包成 JSON 下載
- **匯入**：上傳 JSON 還原（含 schema 版本檢查）
- **清除**：確認彈窗 → 全部刪除

格式：
```json
{
  "readleExport": true,
  "version": 1,
  "exportedAt": "2026-05-28T10:00:00Z",
  "data": {
    "user": { ... },
    "vocab": { ... },
    // ...
  }
}
```
