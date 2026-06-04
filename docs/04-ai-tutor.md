# 04 · AI 英語助教

> 全站常駐的智慧夥伴 — 隨叫隨到、不打擾節奏、能執行動作。

## 4.1 定位

不是一個獨立的「AI 聊天頁」，而是**滲透到全站每個學習場景的助教**：
- 在影片頁 → 解釋這句話
- 在單字卡 → 幫我造例句
- 在測驗結果 → 分析我哪裡弱
- 在首頁 → 告訴我今天學什麼

## 4.2 觸發入口

| 入口 | 行為 |
|---|---|
| 右下角浮動按鈕 🤖 | 點擊展開全頁面 60% 寬度的對話面板 |
| 任何文字選取 | 浮現 mini 工具列：「解釋」「翻譯」「加入單字本」 |
| 影片字幕點擊 | `WordPopup` 內含「問 AI」按鈕 |
| 測驗結果頁 | 「請 AI 分析弱點」按鈕 |
| 單字卡背面 | 「再生一句例句」按鈕 |
| 鍵盤快捷 | `⌘ + K` / `Ctrl + K` 隨處呼叫 |

## 4.3 AI 助教面板

```
╭────────────── AI 英語助教 ──────────╮
│ 👤 嘿，我想練面試對話                │
│                                     │
│ 🤖 好啊！你想練哪種職位？我可以扮演  │
│    面試官。給我 3 個選擇：           │
│    · 行銷專員                       │
│    · 軟體工程師                     │
│    · 顧問                          │
│                                     │
│ [選 軟體工程師]                     │
│                                     │
│ 🤖 OK！我們開始。                   │
│    "Hi, thanks for coming in. Could │
│     you tell me a bit about your    │
│     background?"                    │
│    🔊 [聽發音]  [中譯]              │
│                                     │
│ 👤 [錄音中... ░░░░░░ 3.2s]         │
│                                     │
│ 🤖 不錯！但有 2 個小地方可以調整：   │
│    1. "I've been working" 比        │
│       "I work" 更自然                │
│    2. 把 "good at" 改成 "skilled    │
│       in" 更專業                    │
│                                     │
├─────────────────────────────────────┤
│  [+] [🎙]  輸入或說話...   [➤ 傳送] │
╰─────────────────────────────────────╯
```

### 4.3.1 介面元素

- **頂部**：助教頭像 + 名稱（可自訂）+ 模式標籤（一般／面試／旅遊）
- **訊息區**：Streaming 顯示（打字機效果）
- **訊息卡片**：可包含按鈕、選項、單字卡（rich content）
- **底部輸入**：文字、語音、附件（截圖等）

### 4.3.2 訊息類型

| 類型 | 範例 |
|---|---|
| 純文字 | 一般回覆 |
| Quick replies | 「選 軟體工程師」「選 行銷」按鈕列 |
| Word card | 嵌入單字卡（可直接加入單字本） |
| Audio | TTS 按鈕（瀏覽器 Web Speech 朗讀） |
| Action card | 「為你出 5 題」「加入今日複習」 |
| Code block | 顯示文法規則 / 句型結構 |
| Recording prompt | 「換你說」+ 錄音框 |

## 4.4 七大核心能力

### 4.4.1 情境對話練習

選擇情境後 AI 扮演角色：

| 情境 | 角色 | 場景 |
|---|---|---|
| 咖啡廳點餐 | Barista | Starbucks 點餐 |
| 機場通關 | 海關官員 | 入境問答 |
| 商務面試 | Hiring Manager | 面試問答 |
| 餐廳訂位 | 餐廳服務生 | 電話訂位 |
| 看醫生 | 醫生 | 描述症狀 |
| 飯店入住 | 櫃台人員 | Check-in |
| 開會討論 | 同事 | 提案討論 |
| 朋友閒聊 | 朋友 | 自由話題 |

對話進行中：
- AI 會根據使用者程度調整詞彙複雜度
- 每 3–5 輪會給一次即時反饋
- 可隨時暫停 → 看翻譯 / 解釋 / 換句話說

### 4.4.2 AI 糾正文法

使用者輸入英文句子，AI 回傳：
```
原句：I have went to Tokyo last year.
                                  
修正：I went to Tokyo last year.

說明：
· "have went" 應為 "went"
· "last year" 是過去時間 → 用過去式
· 完成式不能與明確過去時間連用

更自然的說法：
· I visited Tokyo last year.
· I traveled to Tokyo last year.
```

### 4.4.3 AI 發音分析

使用者錄音 → AI 分析：
- 整體分數（0–100）
- 音素分析（哪幾個音不準）
- 節奏分析（語速、停頓）
- 重音分析（哪個音節重了或弱了）
- 推薦練習：類似句子 3 句

> **免費方案實作**：先用 Web Speech API 的 `SpeechRecognition` 做基礎 transcription，比對相似度給分。Phase 3 視需要接入專業發音 API。

### 4.4.4 AI 口說評分

完整段落朗讀（如多益口說 Part 3 仿真）：
- 上傳錄音
- AI 給多益口說評分（0–200）
- 詳細評語（內容、文法、發音、流暢度）

### 4.4.5 AI 寫作助手

使用者寫一段英文：
- 即時錯誤標示（紅波浪）
- 滑鼠 hover → 顯示修正建議
- 整段「優化」→ 給出 3 種改寫版本（口語 / 正式 / 簡潔）
- Email / 履歷 / 學術 三種文體模式

### 4.4.6 個人化學習路徑

> 「請 AI 看看我的學習資料，告訴我接下來該做什麼。」

AI 讀取：
- 最近 7 天學習紀錄
- 測驗錯題分布
- 收藏單字分類

回覆：
```
你最近最弱的是「商業 Email 慣用語」，
連兩次測驗都錯 2 題以上。

建議今天：
1. 複習這 8 個單字（5 分鐘）→ [開始]
2. 看影片「Business Email Phrases」（10 分鐘）→ [看影片]
3. 做專屬測驗（5 題）→ [出題]

整體用時：20 分鐘。要開始嗎？
```

點擊按鈕 → AI 透過 **Tool Use** 真的呼叫對應動作（不只是建議）。

### 4.4.7 即時生成測驗

> 「給我出 5 題單字測驗，題目要關於旅遊」

AI 即時生成 → 渲染成 `QuestionCard` 序列 → 答完直接給分析。

## 4.5 Tool Use 設計

AI 可調用的前端動作：

```typescript
const tutorTools = {
  add_word_to_vocab(word: string, category?: string),
  schedule_review_now(wordIds: string[]),
  generate_quiz(topic: string, count: number, type: QuestionType),
  play_pronunciation(text: string, accent?: 'us' | 'uk'),
  navigate_to(path: string),
  start_video(videoId: string, startAt?: number),
  highlight_subtitle_at(time: number),
  open_word_card(wordId: string),
  set_daily_goal(minutes: number),
  show_learning_stats(range: '7d' | '30d' | '90d')
}
```

AI 回應的 JSON 範例：
```json
{
  "content": "好的，我把這 3 個單字加入你的單字本了。",
  "actions": [
    { "tool": "add_word_to_vocab", "args": { "word": "elaborate", "category": "toeic" } },
    { "tool": "add_word_to_vocab", "args": { "word": "subsequently", "category": "toeic" } },
    { "tool": "add_word_to_vocab", "args": { "word": "in lieu of", "category": "business" } }
  ]
}
```

## 4.6 Prompt 工程要點

### 4.6.1 System Prompt 結構

```
你是 Readle 英文學習平台的 AI 助教，名字叫「Luna」。

你的個性：
- 溫暖、有耐心、像一位優秀的家教
- 鼓勵為主，但會清楚指出錯誤
- 用學習者母語（繁體中文）做解釋，但盡量用英文示範

學習者資料：
- 暱稱：{user.nickname}
- 等級：{user.cefrLevel}     // A1 / A2 / B1 / B2 / C1 / C2
- 目標：{user.goal}            // toeic_750 / business / daily
- 最近 7 天錯題：{recentMistakes}
- 收藏單字總數：{vocabCount}

回覆規則：
1. 用詞複雜度配合 {user.cefrLevel}
2. 例句用學習者已收藏的單字
3. 解釋語法時引用學習者「最近錯過」的相關規則
4. 可用 tools，當使用者請求「加入單字本」「出題」等動作時務必使用
5. 回覆長度：對話 < 80 字；解釋 < 200 字；除非使用者明確要長文
```

### 4.6.2 對話歷史管理

- 每場對話最多保留 20 輪訊息
- 超過後對最早 10 輪做摘要 → 塞回 system prompt
- 每場對話有 `mode`（一般 / 情境練習 / 文法批改）影響 system prompt

## 4.7 隱私與成本控制

### 4.7.1 隱私

- 對話內容存 LocalStorage，不上傳伺服器（除了當下傳給 AI 的 API call）
- 使用者可一鍵清空全部對話紀錄
- 錄音檔處理完即刻丟棄

### 4.7.2 成本（免費方案）

**Gemini 1.5 Flash 免費額度**：
- 15 RPM（每分鐘 15 次請求）
- 1500 RPD（每天 1500 次請求）

**節流策略**：
- 同一 prompt 在 1 秒內重複按鈕只送一次（debounce）
- Quick replies 預先快取在前端，不打 API
- 字幕點字查單字優先用本地字典（`lib/dictionary.ts`），找不到才打 AI
- 顯示「今日已用：12 / 1500」在設定頁透明告知

**降級策略**：
- 配額用完 → 自動切換到 Groq（備援）
- Groq 也 down → 切換到 Mock 模式 + 提示

## 4.8 Mock 模式（Phase 1–2 用）

`lib/ai/mock.ts` 提供假回應，讓 UI 開發不依賴真 API：

```typescript
const mockResponses = {
  "解釋這句": "這句話的意思是…（mock 回應）",
  "造例句": "Here's an example: ...（mock 回應）",
  "出 5 題": [/* 5 道假題目 */],
}
```

切換方式：環境變數 `NEXT_PUBLIC_AI_PROVIDER=mock | gemini | groq`

## 4.9 失敗 / 錯誤狀態

| 狀態 | UI 表現 |
|---|---|
| API 連線失敗 | Toast「AI 暫時離線，已切換到本地模式」+ 用 mock 回應 |
| 配額用完 | 對話框顯示「今日額度已用完，明天再來吧」+ 顯示重置時間 |
| 回應卡住（> 10s） | 顯示「重新生成」按鈕 |
| 內容被擋（safety filter） | 「這個話題我沒辦法回答，換個主題吧」 |
