# 01 · 網站架構

## 1.1 頁面樹（Sitemap）

```
Readle
│
├── /                          首頁 Dashboard
│   ├── Hero（AI 助教介紹 + 主 CTA）
│   ├── 今日連續學習 / 進度環
│   ├── 今日單字卡（5 張）
│   ├── 熱門影片推薦輪播
│   ├── AI 推薦課程（依等級）
│   └── 最近學習紀錄
│
├── /learn                     學習中心
│   ├── /learn/videos          影片列表
│   │   └── /learn/videos/[id] 影片學習頁
│   │       ├── 中英雙字幕
│   │       ├── 點字幕查單字
│   │       ├── 播放速度（0.5x – 2x）
│   │       ├── AB Repeat
│   │       ├── 自動跟讀模式
│   │       └── AI 發音評分（錄音對比）
│   │
│   ├── /learn/vocab           單字總覽
│   │   ├── /learn/vocab/cards     單字卡模式
│   │   ├── /learn/vocab/review    SRS 今日複習
│   │   ├── /learn/vocab/list/[category] 分類列表
│   │   │   ├── toeic   多益
│   │   │   ├── daily   日常
│   │   │   └── business 商業
│   │   └── /learn/vocab/word/[id] 單字詳情頁
│   │
│   └── /learn/articles        文章閱讀（沿用現有 readle）
│
├── /ai                        AI 助教專區
│   ├── /ai/chat               對話練習（情境角色扮演）
│   ├── /ai/writing            AI 寫作助手
│   ├── /ai/grammar            AI 文法檢查
│   └── /ai/speaking           AI 口說評分
│
├── /quiz                      測驗中心
│   ├── /quiz                  測驗總覽
│   ├── /quiz/listening        聽力測驗
│   ├── /quiz/cloze            填空題
│   ├── /quiz/vocab            單字測驗
│   ├── /quiz/ai-gen           AI 自動出題（依弱點）
│   └── /quiz/result/[id]      測驗結果分析
│
├── /me                        個人中心
│   ├── 連續學習日 / 等級 / XP
│   ├── 學習熱力圖（GitHub 風格）
│   ├── 成就徽章牆
│   ├── 收藏單字本
│   └── 測驗紀錄
│
└── /settings                  設定
    ├── 帳號（暱稱、頭像、目標等級）
    ├── 學習偏好（每日目標、提醒時間）
    ├── 播放偏好（預設語速、字幕大小）
    └── AI 偏好（模型、回覆風格、學習程度）
```

## 1.2 全域 UI 元素

```
┌──────────────────────────────────────────────────┐
│  TopBar：Logo · 搜尋 · 連續火焰 · XP · 頭像        │
├──────────┬───────────────────────────────────────┤
│ SideNav  │                                       │
│ 首頁     │                                       │
│ 學習     │            主內容區                    │
│ AI 助教  │                                       │
│ 測驗     │                                       │
│ 我的     │                                       │
│          │                                       │
├──────────┴───────────────────────────────────────┤
│   AI 助教浮動按鈕（右下，常駐）                   │
└──────────────────────────────────────────────────┘
```

- **TopBar**：玻璃擬態 sticky header
- **SideNav**：桌面顯示，手機收進漢堡選單
- **AI 浮動按鈕**：所有頁面右下角，點擊展開對話面板
- **手機底部 TabBar**：手機版替代 SideNav（首頁／學習／測驗／我的）

## 1.3 技術選型

| 層級 | 選用 | 理由 |
|---|---|---|
| 框架 | Next.js 16（App Router）+ React 19 | 已有，最新版 |
| 樣式 | Tailwind CSS 4 | 已有，原子化 + 玻璃擬態好寫 |
| 動畫 | Framer Motion 11 | React 19 相容；卡片進場、頁面切換 |
| 圖示 | lucide-react | 已有，風格一致清爽 |
| 狀態 | Zustand | 比 Redux 輕；單字本、播放器、AI session |
| 表單 | React Hook Form + Zod | 設定頁與測驗答題 |
| 圖表 | Recharts | 學習熱力圖、進度趨勢 |
| AI | Google Gemini API (免費額度) | Phase 3 接入；Phase 1–2 用 mock |
| 語音 | Web Speech API（瀏覽器內建）| TTS 與基礎語音識別，零成本 |
| SRS | 自寫 SM-2 | ~80 行程式碼，無外部依賴 |
| 儲存 | LocalStorage + 自寫 ORM | Phase 1 起手；介面預留將來換 Prisma |

### 1.3.1 為什麼用 LocalStorage 起手？

- **零後端**：完全靜態，可直接部署到 Vercel / GitHub Pages
- **快**：所有讀寫同步、無網路延遲
- **私密**：學習資料不離開使用者瀏覽器
- **可離線**：通勤地鐵上沒網路也能用

代價：換裝置或清快取會遺失。Phase 5（如果做）再加雲端同步。

### 1.3.2 為什麼選 Gemini（免費方案）

| 候選 | 免費額度 | 中文能力 | Streaming | 備註 |
|---|---|---|---|---|
| **Gemini 1.5 Flash** | 每分鐘 15 次、每天 1500 次 | 優 | ✅ | 首選 |
| Groq (Llama 3.3 70B) | 慷慨但有 rate limit | 中 | ✅ | 速度極快，備援 |
| Mistral free | 每月限額 | 中 | ✅ | 第三選擇 |
| 本地 Web Speech | 無限 | 中文 OK | 無 | TTS / 基礎發音用 |

Phase 3 實作時抽象成 `LLMProvider` 介面，可隨時切換。

## 1.4 目錄結構

```
readle-app/
├── app/
│   ├── (marketing)/page.tsx         # 首頁
│   ├── learn/
│   │   ├── videos/page.tsx
│   │   ├── videos/[id]/page.tsx
│   │   ├── vocab/page.tsx
│   │   ├── vocab/cards/page.tsx
│   │   └── vocab/review/page.tsx
│   ├── ai/
│   │   ├── chat/page.tsx
│   │   ├── writing/page.tsx
│   │   ├── grammar/page.tsx
│   │   └── speaking/page.tsx
│   ├── quiz/...
│   ├── me/page.tsx
│   ├── settings/page.tsx
│   ├── layout.tsx
│   └── globals.css
│
├── components/
│   ├── ui/                          # 設計系統原子組件
│   │   ├── GlassCard.tsx
│   │   ├── SoftButton.tsx
│   │   ├── ProgressRing.tsx
│   │   ├── StreakFlame.tsx
│   │   └── WordChip.tsx
│   ├── nav/
│   │   ├── TopBar.tsx
│   │   ├── SideNav.tsx
│   │   └── MobileTabBar.tsx
│   ├── ai-tutor/                    # AI 助教浮動面板
│   │   ├── AITutorButton.tsx
│   │   ├── AITutorPanel.tsx
│   │   └── ChatMessage.tsx
│   ├── video/
│   │   ├── VideoPlayer.tsx
│   │   ├── DualSubtitle.tsx
│   │   ├── ABRepeat.tsx
│   │   └── PronunciationScorer.tsx
│   ├── vocab/
│   │   ├── WordCard.tsx
│   │   ├── FlashcardDeck.tsx
│   │   └── SRSReviewSession.tsx
│   └── quiz/
│       ├── QuestionCard.tsx
│       └── ResultChart.tsx
│
├── lib/
│   ├── storage/                     # LocalStorage 抽象層
│   │   ├── repo.ts                  # 通用 CRUD
│   │   ├── user-repo.ts
│   │   ├── word-repo.ts
│   │   ├── progress-repo.ts
│   │   └── seed.ts                  # 預設 mock 資料
│   ├── srs/
│   │   └── sm2.ts                   # 記憶曲線演算法
│   ├── ai/
│   │   ├── provider.ts              # LLMProvider 介面
│   │   ├── gemini.ts                # Gemini 實作
│   │   ├── mock.ts                  # 開發用假回應
│   │   └── prompts.ts               # Prompt 模板
│   ├── speech/
│   │   ├── tts.ts                   # Web Speech API 朗讀
│   │   └── score.ts                 # 發音評分
│   ├── mock/                        # 假資料
│   │   ├── videos.ts
│   │   ├── words.ts
│   │   └── articles.ts
│   └── types.ts
│
├── stores/                          # Zustand
│   ├── useUserStore.ts
│   ├── useVocabStore.ts
│   └── useAITutorStore.ts
│
└── docs/                            # 本目錄
```

## 1.5 部署

| 環境 | 平台 | 說明 |
|---|---|---|
| 開發 | localhost:3000 | `npm run dev` |
| 預覽 | Vercel Preview | PR 自動部署 |
| 正式 | Vercel / Cloudflare Pages | 純靜態 + Edge Functions（AI proxy） |

AI API key 用 Vercel Edge Function 代理，避免暴露在前端。
