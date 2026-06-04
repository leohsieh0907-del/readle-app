# 02 · 設計系統

## 2.1 設計哲學

> **Apple 的克制 × Notion 的清爽 × Duolingo 的遊戲化**

- **Apple**：留白、圓角、玻璃擬態、柔和陰影、SF 字型感
- **Notion**：資訊密度低、極簡 icon、灰階層次清楚
- **Duolingo**：連續火焰、成就徽章、進度回饋立即且明顯，但**降低飽和度**

不要的：Duolingo 那種 #58CC02 螢光綠、滿版插畫、跳動的角色。

## 2.2 顏色系統

### 2.2.1 中性色（背景與容器）

```
亮色模式
─────────────────────────────────────
背景主色  bg-base        #FAFAFC
背景次色  bg-elevated    #FFFFFF
玻璃卡    bg-glass       rgba(255,255,255,0.6)
邊框      border         rgba(15,15,25,0.06)
文字主    text-primary   #0F0F19
文字次    text-secondary #5B5B6E
文字弱    text-tertiary  #9090A3

暗色模式
─────────────────────────────────────
背景主色  bg-base        #0A0A0F
背景次色  bg-elevated    #14141C
玻璃卡    bg-glass       rgba(255,255,255,0.04)
邊框      border         rgba(255,255,255,0.08)
文字主    text-primary   #F5F5FA
文字次    text-secondary #A3A3B5
文字弱    text-tertiary  #6B6B7D
```

### 2.2.2 主題色

```
主色       primary        #5B5BF0   柔和靛藍（按鈕、連結、進度）
主色淺     primary-soft   #EEEEFE   背景襯底
強調色     accent         #FFB84D   橙（CTA、火焰、徽章）
正確       success        #4ADE80   柔和綠
錯誤       danger         #F87171   柔和紅
警示       warning        #FBBF24   黃

漸層
─────────────────────────────────────
主漸層    from-#7C7CFF to-#5B5BF0
火焰     from-#FFB84D to-#FF6B6B
成就金   from-#FFD700 to-#FFB84D
```

### 2.2.3 分類色（單字 / 影片）

```
多益 TOEIC      #6366F1  靛
商業 Business   #8B5CF6  紫
日常 Daily      #06B6D4  青
旅遊 Travel     #10B981  翠綠
科技 Tech       #F59E0B  琥珀
```

## 2.3 字型

```
英文：Inter（後備 SF Pro Display）
中文：Noto Sans TC
等寬：JetBrains Mono（程式碼、發音音標）

字重：400 / 500 / 600 / 700

尺寸刻度（rem）
─────────────────────────────────────
display   3.5   重要標題
h1        2.25  頁面標題
h2        1.75  區塊標題
h3        1.25  卡片標題
body      1.0   內文
small     0.875 次要說明
tiny      0.75  標籤

行高：標題 1.2 / 內文 1.6
```

## 2.4 玻璃擬態（Glassmorphism）規範

```css
.glass-card {
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.8);
  border-radius: 20px;
  box-shadow:
    0 8px 32px rgba(91, 91, 240, 0.06),
    inset 0 1px 0 rgba(255, 255, 255, 0.9);
}

/* 暗色模式 */
.dark .glass-card {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow:
    0 8px 32px rgba(0, 0, 0, 0.4),
    inset 0 1px 0 rgba(255, 255, 255, 0.06);
}
```

**三種變體**：
- `glass-card`     一般卡片（blur 20）
- `glass-strong`   彈窗、AI 面板（blur 30 + 更高不透明度）
- `glass-subtle`   背景裝飾（blur 10 + 極低不透明度）

**避免事項**：
- 不要在玻璃卡內再放玻璃卡（會視覺糊掉）
- 玻璃卡背後一定要有色彩變化的背景（漸層、模糊光斑）才美

## 2.5 圓角

```
button-sm     8px
button-md     12px
button-lg     999px  膠囊
card-sm       14px
card-md       20px
card-lg       28px
modal         24px
input         12px
```

## 2.6 陰影

```
shadow-soft     0 2px 8px rgba(15,15,25,0.04)
shadow-card     0 8px 32px rgba(91,91,240,0.06)
shadow-hover    0 12px 40px rgba(91,91,240,0.12)
shadow-modal    0 24px 64px rgba(15,15,25,0.18)
inset-soft      inset 0 1px 0 rgba(255,255,255,0.9)
```

## 2.7 間距

```
4px → 8px → 12px → 16px → 24px → 32px → 48px → 64px → 96px
(Tailwind: 1   2   3    4    6    8    12   16   24)

卡片內邊距    20px / 24px
卡片間距      16px / 24px
區塊間距      48px / 64px
頁面 max-w    1280px（桌面） / 100%（手機）
```

## 2.8 動畫

```
快  150ms  hover、按鈕反饋
中  300ms  卡片進場、頁面元素
慢  500ms  頁面切換、Hero 動畫

緩動：cubic-bezier(0.32, 0.72, 0, 1)  Apple 的標準緩動
```

**標準動畫模式**：
- **進場**：opacity 0→1 + translateY 12px→0
- **退場**：opacity 1→0 + translateY 0→-8px
- **正確回饋**：scale 1→1.15→1 + 綠色閃光
- **錯誤回饋**：translateX shake（-8, 8, -4, 4, 0）+ 紅色閃光
- **連續火焰**：火焰圖標脈動 + 飄字「+1 day」

## 2.9 組件清單

### 2.9.1 原子組件（components/ui/）

| 組件 | 用途 | 變體 |
|---|---|---|
| `GlassCard` | 通用玻璃卡 | card / strong / subtle |
| `SoftButton` | 主按鈕 | primary / secondary / ghost / icon |
| `ProgressRing` | 圓形進度 | sm / md / lg；可顯示中央數字 |
| `ProgressBar` | 線性進度 | 含 striped 動畫變體 |
| `StreakFlame` | 連續火焰 | 含日數 + 脈動動畫 |
| `WordChip` | 單字標籤 | 已收藏 / 未學 / 已掌握 三狀態 |
| `Badge` | 成就徽章 | 6 種等級色（銅銀金鑽紫紅） |
| `Avatar` | 使用者頭像 | 含等級邊框光暈 |
| `Tab` | 分頁切換 | underline / pill 兩種 |
| `Tooltip` | 提示框 | 玻璃擬態 |
| `Toast` | 訊息提示 | success / error / info |
| `Modal` | 彈窗 | center / sheet（手機從下） |

### 2.9.2 組合組件（components/...）

| 組件 | 用途 |
|---|---|
| `VideoPlayer` | YouTube 嵌入 + 自訂控制列 |
| `DualSubtitle` | 中英雙字幕，點字查單字 |
| `ABRepeat` | A-B 點循環控制 |
| `PronunciationScorer` | 錄音 + 比對 + 分數動畫 |
| `WordCard` | 單字卡（翻轉動畫） |
| `FlashcardDeck` | 整副單字卡 + 滑動切換 |
| `SRSReviewSession` | 今日複習流程（記得 / 模糊 / 忘了） |
| `QuestionCard` | 測驗題卡（4 選 1 / 填空） |
| `ResultChart` | 測驗結果雷達圖 |
| `LearningHeatmap` | 學習熱力圖（GitHub 風格） |
| `AITutorPanel` | AI 助教對話面板 |

## 2.10 響應式斷點

```
sm   640px   手機橫 / 小平板
md   768px   平板直
lg   1024px  平板橫 / 小筆電
xl   1280px  桌面
2xl  1536px  大桌面

設計優先序：手機（< 640）→ 桌面（≥ 1024）→ 平板補強
```

## 2.11 範例：首頁 Dashboard 視覺（ASCII 線框）

```
╭────────────────────────────────────────────────────────╮
│  🦉 Readle    [Search]      🔥 12  ⭐ 2,340  [Avatar] │  ← Sticky TopBar
├──────────┬─────────────────────────────────────────────┤
│          │                                             │
│  🏠 首頁 │   早安，庭晰 👋                              │
│  📺 學習 │   ╭──────────────────────────────╮          │
│  🤖 AI   │   │  今日目標   ◐ 23/30 min      │          │
│  ✏️ 測驗 │   │  ───────────────────────     │          │
│  👤 我的 │   │  [繼續今日學習 →]            │          │
│          │   ╰──────────────────────────────╯          │
│          │                                             │
│          │   今日單字 ────────────────                  │
│          │   [card][card][card][card][card]            │
│          │                                             │
│          │   熱門影片 ────────────────                  │
│          │   [影片卡 大][影片卡 小][影片卡 小]          │
│          │                                             │
│          │   AI 推薦 ────────────────                   │
│          │   [推薦卡][推薦卡][推薦卡]                   │
│          │                                             │
│          │                                       🤖 ↗ │  ← AI 助教浮動鈕
╰──────────┴─────────────────────────────────────────────╯
```

背景：左上 → 右下 的柔和漸層 + 兩個模糊光斑（紫、藍），玻璃卡疊在上面才會有層次。
