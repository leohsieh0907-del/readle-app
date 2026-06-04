# 影片資料夾

這個資料夾放所有影片資料，只要編輯 JSON 檔就能新增 / 修改影片，**不需要碰程式碼**。

## 如何新增影片

打開 `videos.json`，在最外層的陣列 `[ ... ]` 末端（最後一個 `}` 之後加逗號）貼上新影片：

```json
{
  "id": "v007",
  "title": "Your English Title",
  "titleZh": "中文標題",
  "durationSec": 60,
  "level": "B1",
  "category": "business",
  "thumbnail": "gradient-2",
  "views": 0,
  "keyWords": ["word1", "word2"],
  "subtitles": [
    { "startSec": 0, "endSec": 4, "en": "First sentence.", "zh": "第一句中文。" },
    { "startSec": 4, "endSec": 8, "en": "Second sentence.", "zh": "第二句中文。" }
  ]
}
```

存檔後 dev server 會自動 reload，影片就出現在 `/learn/videos` 列表了。

## 欄位說明

| 欄位 | 必填 | 說明 |
|---|---|---|
| `id` | ✅ | 唯一識別碼，建議 `v001` 開始遞增。重複會被覆蓋 |
| `youtubeId` | ⭐ | YouTube 影片 ID（網址 `watch?v=` 後面那串）。**有填就播放真實 YouTube 影片**；不填則用 mock 模擬器 |
| `title` | ✅ | 影片英文標題 |
| `titleZh` | ✅ | 影片中文標題 |
| `durationSec` | ✅ | 影片總長（秒）。YouTube 模式下會自動以真實時長覆蓋，這裡填大概值即可 |
| `level` | ✅ | CEFR 等級：`A1` / `A2` / `B1` / `B2` / `C1` / `C2` |
| `category` | ✅ | 分類，5 選 1：`toeic` / `business` / `daily` / `travel` / `tech` |
| `thumbnail` | ✅ | 縮圖漸層，5 選 1：見下方「縮圖選項」 |
| `views` | ✅ | 觀看數（隨意填，純展示用） |
| `keyWords` | ✅ | 字串陣列，本片重點英文單字（最多 5–8 個） |
| `subtitles` | ✅ | 字幕陣列，每句一個物件 |

## 縮圖選項（5 種漸層）

| 名稱 | 配色 |
|---|---|
| `gradient-1` | 紫 → 粉紅（Business / Tech 系） |
| `gradient-2` | 綠 → 藍（成長 / 自然系） |
| `gradient-3` | 橙 → 紅 → 紫（活潑 / 日常） |
| `gradient-4` | 紫 → 藍（旅遊 / 商務） |
| `gradient-5` | 橙 → 紅（多益 / 重點） |

## 怎麼找 YouTube ID

YouTube 網址長這樣：`https://www.youtube.com/watch?v=qp0HIF3SfI4`
→ `youtubeId` 就填 **`qp0HIF3SfI4`**（`v=` 後面那串）

⚠️ 有些影片設定不允許嵌入。驗證方法：把 `https://www.youtube.com/embed/你的ID` 貼到瀏覽器，能播就能用。

## 字幕與真實影片的時間對齊

字幕的 `startSec` / `endSec` 是**影片的實際秒數**。如果雙字幕跟影片對不上：
1. 播放影片、記下某句實際出現的秒數
2. 在 `videos.json` 調整該句的 `startSec` / `endSec`
3. 存檔 → 重新整理

> 內建的 6 部 TED 演講字幕只涵蓋開頭精華段（約前 60 秒），你可以自行往後補。

## 字幕格式

每句字幕的物件：
```json
{ "startSec": 0, "endSec": 4, "en": "Hello.", "zh": "你好。" }
```

| 欄位 | 說明 |
|---|---|
| `startSec` | 句子起始秒（小數可，例如 8.5） |
| `endSec` | 句子結束秒。**下一句的 `startSec` 必須等於這一句的 `endSec`**，不要留空檔 |
| `en` | 英文字幕（若包含雙引號 `"`，要寫成 `\"`） |
| `zh` | 中文字幕 |

## 編輯小撇步

1. **VS Code 自動驗證**：JSON 語法錯誤會立刻被標紅
2. **不要忘了逗號**：每個物件之間要逗號，**最後一個物件後面不要加逗號**
3. **字幕別重疊**：每句的 `endSec` 必須等於下一句的 `startSec`，否則中間會沒字幕
4. **善用搜尋取代**：要批次調整時間軸，用編輯器的 regex replace

## 範本：最小可用影片

```json
{
  "id": "v999",
  "title": "Test Video",
  "titleZh": "測試影片",
  "durationSec": 12,
  "level": "A2",
  "category": "daily",
  "thumbnail": "gradient-3",
  "views": 0,
  "keyWords": ["hello"],
  "subtitles": [
    { "startSec": 0, "endSec": 4, "en": "Hello, world!", "zh": "你好世界！" },
    { "startSec": 4, "endSec": 8, "en": "This is a test.", "zh": "這是一個測試。" },
    { "startSec": 8, "endSec": 12, "en": "Goodbye!", "zh": "再見！" }
  ]
}
```

## 注意

- App 用 **build 時 import** 載入 JSON，所以**改完要重新整理瀏覽器**才會看到新影片（dev server 會自動觸發）
- 正式部署時影片資料會打包進 build，不需要另外上傳
- 未來如果改用線上 CMS，這份 JSON 結構就是 schema 規範
