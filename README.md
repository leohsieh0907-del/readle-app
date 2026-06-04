# Readle — AI 英文學習平台

> 用 AI 助教，把英文學習變成每天 10 分鐘的優雅習慣。

🌐 **線上版**：[readle-app.vercel.app](https://readle-app.vercel.app)

---

## 功能特色

### 📺 影片學習
- YouTube 真實影片播放
- 中英雙字幕（AI 自動生成 + 翻譯）
- 點字幕英文字 → 即時查字義 + 真人發音
- AB Repeat 循環播放
- 自動跟讀模式 + AI 評分
- 播放速度調整（◀ 0.5x ~ 2.0x ▶）

### 📚 單字學習系統
- 收藏單字（從影片、任意頁面雙擊加入）
- 單字卡翻面模式
- **SM-2 記憶曲線 SRS**（科學複習排程）
- AI 自動生成例句
- 多益 / 商業 / 日常 / 旅遊 / 科技 5 分類

### 🤖 AI 助教 Luna
- Gemini 2.5 Flash 真實對話
- 8 種情境對話練習（面試、咖啡廳、機場…）
- AI 文法檢查
- AI 寫作助手（4 種風格）
- 語音輸入（說話傳訊）
- 真人發音朗讀（Gemini TTS）

### ✏️ 測驗中心
- 聽力測驗（TTS 念題）
- 填空題
- 單字測驗（從你的單字本出題）
- AI 自動出題
- 測驗結果雷達圖分析

### 👤 個人中心
- 連續學習天數 + XP 等級系統
- 365 天學習熱力圖
- 9 個成就徽章
- 學習統計

### 🔍 YouTube 搜尋
- 搜尋任何英文學習影片
- 搜尋結果自動生成中英字幕
- 最近搜尋記錄

---

## 技術架構

| 層級 | 技術 |
|---|---|
| 框架 | Next.js 16（App Router）+ React 19 |
| 樣式 | Tailwind CSS 4 + 玻璃擬態設計系統 |
| 動畫 | Framer Motion |
| AI 對話 / 字幕 | Google Gemini 2.5 Flash |
| 真人 TTS | Gemini TTS API |
| 影片搜尋 | YouTube Data API v3 |
| 發音評分 | Web Speech API |
| 資料儲存 | LocalStorage（零後端，可離線） |
| 部署 | Vercel（Edge Functions） |

---

## 快速開始

### 1. 安裝依賴

```bash
cd readle-app
npm install
```

### 2. 設定環境變數

複製 `.env.example` 為 `.env.local`：

```bash
cp .env.example .env.local
```

填入你的 API keys：

```env
# 從 https://aistudio.google.com/apikey 取得（免費）
GEMINI_API_KEY=AIzaSy...

# 從 Google Cloud Console 取得（免費 10,000 次/天）
YOUTUBE_API_KEY=AIzaSy...
```

### 3. 啟動開發伺服器

```bash
npm run dev
```

打開 http://localhost:3000

---

## 新增影片

編輯 `data/videos.json`：

```json
{
  "id": "v007",
  "youtubeId": "YouTube影片ID（11字元）",
  "title": "English Title",
  "titleZh": "中文說明",
  "durationSec": 300,
  "level": "B1",
  "category": "business",
  "thumbnail": "gradient-1",
  "views": 0,
  "keyWords": ["word1", "word2"],
  "subtitles": []
}
```

`subtitles: []` 讓系統自動用 AI 生成字幕。

---

## 部署

```bash
# 安裝 Vercel CLI
npm install -g vercel

# 登入
vercel login

# 部署到正式環境
vercel --prod --yes
```

記得在 Vercel Dashboard 設定環境變數：
- `GEMINI_API_KEY`
- `YOUTUBE_API_KEY`

---

## 專案結構

```
readle-app/
├── app/                    # Next.js App Router 頁面
│   ├── page.tsx           # 首頁 Dashboard
│   ├── learn/videos/      # 影片學習
│   ├── learn/vocab/       # 單字本
│   ├── ai/                # AI 助教功能頁
│   ├── quiz/              # 測驗中心
│   ├── me/                # 個人中心
│   ├── settings/          # 設定
│   └── api/               # 後端 API Routes（代理 key）
├── components/            # React 組件
├── lib/                   # 共用邏輯（AI/SRS/字典/存儲）
├── data/
│   └── videos.json        # 影片內容（可直接編輯）
└── docs/                  # 設計文件
```

---

## 設計理念

**Apple 的克制 × Notion 的清爽 × Duolingo 的遊戲化**

- 玻璃擬態（Glassmorphism）卡片 UI
- 柔和陰影 + 圓角設計
- 流暢動畫
- 手機優先（通勤使用情境）

---

## License

MIT
