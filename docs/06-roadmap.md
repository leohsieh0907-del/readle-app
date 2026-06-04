# 06 · 實作路線圖

## 6.1 總覽

| Phase | 範圍 | 估時 | 交付物 |
|---|---|---|---|
| **P1** | 設計系統 + 首頁 + 全域導航 + AI 助教 UI（mock） | 1 天 | 可走 demo 的首頁與導航 |
| **P2** | 影片學習 + 單字卡 + SRS | 1.5 天 | 完整學習核心功能 |
| **P3** | 測驗中心 + 個人中心 | 1 天 | 測驗、進度、徽章 |
| **P4** | 接入真 AI（Gemini）+ 發音評分 + 微調 | 1 天 | 正式可用版本 |
| **P5（選）** | 雲端同步、PWA 離線、社群功能 | TBD | — |

---

## 6.2 Phase 1：基礎升級（1 天）

### 目標
建立設計系統，把首頁與導航做到位，AI 助教 UI 可開啟對話但用 mock 回應。

### 任務清單

**設計系統**
- [ ] 設定 Tailwind 4 主題（顏色、字型、陰影、圓角 token）
- [ ] 建立 `globals.css` 玻璃擬態 utility classes
- [ ] 引入 Inter / Noto Sans TC 字型
- [ ] 安裝 Framer Motion、Zustand

**UI 原子組件**（`components/ui/`）
- [ ] `GlassCard`
- [ ] `SoftButton`
- [ ] `ProgressRing`
- [ ] `ProgressBar`
- [ ] `StreakFlame`
- [ ] `WordChip`
- [ ] `Badge`
- [ ] `Modal` / `Toast`

**全域導航**
- [ ] `TopBar`（桌面）
- [ ] `SideNav`（桌面）
- [ ] `MobileTabBar`（手機）
- [ ] 響應式切換邏輯

**首頁 Dashboard**
- [ ] Hero 問候卡（含時間判斷）
- [ ] 今日目標進度卡
- [ ] 今日單字橫滑（5 張 mock）
- [ ] 熱門影片卡片組（1 大 + 2 小）
- [ ] AI 推薦卡 ×3
- [ ] 最近紀錄列表

**AI 助教（UI only）**
- [ ] 右下浮動按鈕（含脈動動畫）
- [ ] 點擊展開全屏面板（手機）/ 側拉面板（桌面）
- [ ] Mock 訊息流（打字機效果）
- [ ] 文字輸入框 + 麥克風按鈕（功能 Phase 4 再做）
- [ ] Quick replies 按鈕列

**LocalStorage 基礎**
- [ ] `lib/storage/repo.ts` 通用 CRUD
- [ ] `userRepo` / `settingsRepo`
- [ ] 首次進站 onboarding 流程（3 步驟）
- [ ] Seed 資料注入

**首次進站體驗**
- [ ] 引導 3 步驟（等級 / 興趣 / 目標）
- [ ] 寫入 `user` + 首頁渲染個人化內容

### 交付驗收
- 進站可走完 onboarding → 看到首頁 → 點各區塊有反應
- AI 助教浮動按鈕可開關 → 可發訊息（mock 回應）
- 亮 / 暗模式切換正常
- 手機版 + 桌面版皆可用

---

## 6.3 Phase 2：學習核心（1.5 天）

### 目標
完成影片學習與單字系統，包含 SRS 記憶曲線。

### 任務清單

**影片學習頁** (`/learn/videos/[id]`)
- [ ] `VideoPlayer`（YouTube iframe 嵌入 + 自訂控制列）
- [ ] `DualSubtitle`（中英雙字幕同步顯示）
- [ ] 字幕點擊 → `WordPopup`（沿用現有 readle 元件升級）
- [ ] 播放速度切換（0.5x – 2x，7 段）
- [ ] `ABRepeat`（A 點 / B 點 / 循環次數）
- [ ] 自動跟讀模式（每句暫停 → 錄音 → 下一句）
- [ ] 字幕全文側欄（可滾動，跳轉時間）
- [ ] 本片重要單字側欄
- [ ] 快捷鍵綁定（空白 / 方向鍵 / R）

**影片列表頁** (`/learn/videos`)
- [ ] 分類篩選（多益 / 商業 / 日常 …）
- [ ] 等級篩選（A1–C2）
- [ ] 影片卡（縮圖、標題、時長、等級徽章）

**單字卡模式** (`/learn/vocab/cards`)
- [ ] `WordCard` 3D 翻面動畫
- [ ] 滑動手勢（左 = 忘了 / 右 = 記得 / 上 = 已掌握）
- [ ] 一副 20 張為一個 session
- [ ] Session 結束統計（記得 / 模糊 / 忘了 各幾個）

**SRS 引擎** (`lib/srs/sm2.ts`)
- [ ] SM-2 演算法實作
- [ ] `getDueWords(today)` 取得今日待複習
- [ ] `updateAfterReview(word, response)` 更新狀態

**SRS 複習頁** (`/learn/vocab/review`)
- [ ] 載入今日 due words
- [ ] 4 選 1 / 看中文選英文 / 看英文選中文
- [ ] 答對答錯動畫
- [ ] 完成後總結

**單字本總覽** (`/learn/vocab`)
- [ ] 收藏統計
- [ ] 分類卡片
- [ ] 「今日複習 N 個」CTA

**AI 例句生成**
- [ ] 單字卡背面「再生一句」按鈕（mock 模式可運作）

### 交付驗收
- 進入影片頁可看影片、雙字幕同步、點字查單字
- AB Repeat 可正確循環指定段
- 跟讀模式錄音可播放
- 單字卡可滑動、翻面、加入單字本
- 每日 SRS 複習能取出正確單字

---

## 6.4 Phase 3：測驗 + 個人中心（1 天）

### 目標
完成測驗中心與個人化資料展示。

### 任務清單

**測驗類型**
- [ ] 聽力測驗（TTS 念題 → 4 選 1）
- [ ] 填空題
- [ ] 單字測驗（中英互譯）
- [ ] AI 自動出題（Phase 4 接 AI，先用 mock 題庫）

**測驗答題介面** (`/quiz/[type]`)
- [ ] `QuestionCard` 通用組件
- [ ] 計時器
- [ ] 答對 / 答錯動畫回饋
- [ ] 進度顯示（Q3 / 10）

**結果分析頁** (`/quiz/result/[id]`)
- [ ] 總分 + 動畫上數
- [ ] 技能雷達圖（Recharts）
- [ ] 錯題回顧 → 自動加入單字本 / 複習池
- [ ] AI 建議區塊（mock）

**個人中心** (`/me`)
- [ ] 頂部資訊卡（頭像、等級、XP 條、連續火焰）
- [ ] 學習熱力圖（365 天）
- [ ] 成就徽章牆（已解鎖彩色 / 未解鎖灰階）
- [ ] 學習統計圖表（折線、圓餅）
- [ ] 收藏單字本入口
- [ ] 測驗紀錄列表

**設定頁** (`/settings`)
- [ ] 帳號 / 偏好 / 播放 / AI / 介面 / 資料 / 關於
- [ ] 資料匯出 / 匯入
- [ ] 清除全部資料（含二次確認）

**成就引擎** (`lib/achievements.ts`)
- [ ] 每次活動結束 → 檢查是否解鎖
- [ ] 解鎖時 → Toast 動畫 + 寫入 `achievements`

### 交付驗收
- 可完整跑完測驗流程並看到結果
- 個人中心顯示真實學習資料
- 設定變更立即生效
- 成就可正確解鎖並顯示

---

## 6.5 Phase 4：真 AI 接入（1 天）

### 目標
把 Mock AI 替換成 Gemini，並完成發音評分 / 寫作助手 / 對話練習。

### 任務清單

**LLM Provider 抽象層** (`lib/ai/`)
- [ ] `LLMProvider` 介面
- [ ] `GeminiProvider`（含 streaming）
- [ ] `GroqProvider`（備援）
- [ ] `MockProvider`（保留）
- [ ] 根據 `settings.ai.provider` 自動選用

**Edge Function 代理**
- [ ] `app/api/ai/chat/route.ts` — 代理 API key
- [ ] Rate limit（前端 + 後端雙重）
- [ ] 錯誤處理與降級

**Prompt 模板** (`lib/ai/prompts.ts`)
- [ ] System prompt（含使用者 context 注入）
- [ ] 情境對話 prompt（8 種情境）
- [ ] 文法批改 prompt
- [ ] 寫作助手 prompt
- [ ] 出題 prompt（含 JSON 輸出格式）
- [ ] 學習路徑推薦 prompt

**Tool Use 實作**
- [ ] 前端 tool registry（10 種動作）
- [ ] AI 回應 JSON 解析 → 觸發前端動作
- [ ] 動作執行結果回饋給 AI（下一輪）

**AI 對話頁** (`/ai/chat`)
- [ ] 情境選單（8 種）
- [ ] 完整對話流（含錄音、TTS、quick replies）
- [ ] 對話歷史側欄（切換不同 session）

**AI 寫作助手** (`/ai/writing`)
- [ ] 寫作編輯器（含即時錯誤標示）
- [ ] 「優化」按鈕 → 3 種改寫
- [ ] Email / 履歷 / 學術 三種模式

**AI 文法檢查** (`/ai/grammar`)
- [ ] 貼上句子 → 修正 + 解釋
- [ ] 歷史檢查紀錄

**AI 口說 / 發音評分**
- [ ] Web Speech API 錄音
- [ ] `SpeechRecognition` 取得 transcript
- [ ] 比對相似度 → 給分（0–100）
- [ ] AI 文字回饋（哪個音節需加強）

**配額與降級**
- [ ] 每次 API call 寫入 `aiStore.totalCallsToday`
- [ ] 配額用完 UI 提示
- [ ] 自動降級到 Mock 模式

### 交付驗收
- AI 助教所有對話皆走真 Gemini
- 7 大能力（情境對話 / 糾錯 / 發音 / 口說 / 寫作 / 個人化 / 出題）皆可用
- Tool use 能真正執行前端動作
- 配額管理運作正常

---

## 6.6 風險與緩解

| 風險 | 影響 | 緩解 |
|---|---|---|
| Gemini 免費配額不夠 | AI 功能無法用 | 三層降級：Gemini → Groq → Mock |
| Web Speech 跨瀏覽器相容性差 | 跟讀 / 發音評分壞掉 | 偵測 + Fallback 到「請手動標記發音 OK / 需重練」 |
| LocalStorage 滿 | 寫入失敗 | 容量監控 + 自動清除舊資料提醒匯出 |
| YouTube 嵌入被擋 / 限制 | 影片看不了 | Phase 1–2 用本地 mp4，Phase 4 再評估 |
| Tailwind 4 與 Framer Motion 11 相容問題 | 動畫不順 | 先做 spike 測試，必要時降版 |
| Next.js 16 是新版可能 API 改變 | 寫法不對 | 開工前讀 `node_modules/next/dist/docs/` |

## 6.7 Phase 5（未來考慮，非本期）

- 雲端同步（Supabase 免費方案）
- PWA + Service Worker 離線使用
- 社群功能（學習小組、單字本分享）
- 多語言介面（簡中、英文 UI）
- 自訂單字本匯入（CSV、Quizlet 匯入）
- 行動 App（Capacitor 包裝）

## 6.8 開工檢核

正式進入 Phase 1 前須確認：

- [ ] 設計文件全部讀過並認可
- [ ] 確認 Gemini API key 取得方式（或先用 mock）
- [ ] 確認 mock 影片來源（本地 mp4 vs YouTube）
- [ ] 確認字體授權（Inter、Noto Sans TC 皆 OFL，OK）
- [ ] `node_modules/next/dist/docs/` 已閱讀（AGENTS.md 提醒）

---

*這份路線圖是建議節奏，可依實際進度與想看的功能順序調整。每個 Phase 完成都應該是一個可 demo 的版本。*
