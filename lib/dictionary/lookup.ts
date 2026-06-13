/**
 * 單字查詢 — 免費線上字典 + AI 中文翻譯
 *
 * 翻譯優先順序：
 * 1. 後端 Gemini（高品質，有配額限制）
 * 2. Lingva Translate（完全免費，無需 key，Google Translate 代理）
 * 3. 返回 null
 */

export interface DictResult {
  word: string;
  phonetic?: string;
  audioUrl?: string;
  partOfSpeech?: string;
  enDefinition?: string;
  example?: string;
}

// ─── Free Dictionary API ──────────────────────────────────

interface FreeDictPhonetic { text?: string; audio?: string }
interface FreeDictDef { definition?: string; example?: string }
interface FreeDictMeaning { partOfSpeech?: string; definitions?: FreeDictDef[] }
interface FreeDictEntry {
  word?: string; phonetic?: string;
  phonetics?: FreeDictPhonetic[]; meanings?: FreeDictMeaning[];
}

export async function lookupOnline(word: string): Promise<DictResult | null> {
  const clean = word.toLowerCase().replace(/[^a-z'-]/g, '');
  if (!clean) return null;
  try {
    const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(clean)}`);
    if (!res.ok) return null;
    const data = (await res.json()) as FreeDictEntry[];
    const entry = Array.isArray(data) ? data[0] : null;
    if (!entry) return null;
    const phonetic = entry.phonetic || entry.phonetics?.find(p => p.text)?.text;
    const audioUrl = entry.phonetics?.find(p => p.audio && p.audio.length > 0)?.audio || undefined;
    const meaning = entry.meanings?.[0];
    const def = meaning?.definitions?.[0];
    return { word: entry.word ?? clean, phonetic, audioUrl, partOfSpeech: meaning?.partOfSpeech, enDefinition: def?.definition, example: def?.example };
  } catch { return null; }
}

// ─── Google 翻譯（免費、免金鑰、~1.3s/句，主力）──────────────
// 經後端 /api/translate 代打（Google 端點無 CORS 標頭，瀏覽器不能直連）

export async function googleTranslate(texts: string[]): Promise<string[]> {
  if (texts.length === 0) return [];
  try {
    const res = await fetch('/api/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ texts }),
    });
    if (!res.ok) return texts.map(() => '');
    const data = (await res.json()) as { translations?: string[] };
    return Array.isArray(data.translations) ? data.translations : texts.map(() => '');
  } catch {
    return texts.map(() => '');
  }
}

/** Gemini 句子翻譯（備援，品質好但慢/吃配額）→ 對齊原句數的結果陣列 */
async function geminiTranslateChunk(chunk: string[], offset: number): Promise<string[]> {
  const numbered = chunk.map((s, idx) => `${offset + idx + 1}. ${s}`).join('\n');
  const out: string[] = chunk.map(() => '');
  try {
    const res = await fetch('/api/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [{ role: 'user', content: `把以下英文句子翻成自然的繁體中文，保持番號順序，每行一句，只輸出番號.空格翻譯：\n\n${numbered}` }],
        temperature: 0.2,
        maxTokens: 2000,
      }),
    });
    if (res.ok) {
      const data = await res.json() as { content?: string };
      for (const line of (data.content ?? '').split('\n')) {
        const m = line.match(/^(\d+)\.\s*(.+)/);
        if (m) {
          const rel = Number(m[1]) - 1 - offset;
          if (rel >= 0 && rel < chunk.length) out[rel] = m[2].trim();
        }
      }
    }
  } catch { /* 留空 */ }
  return out;
}

// ─── 批次翻譯句子（for 文章中英模式）──────────────────────

/**
 * 批次翻譯句子陣列
 * 主力 Google 翻譯（快、免配額、可靠）→ 有缺漏時用 Gemini 補
 */
export async function batchTranslateSentences(
  sentences: string[],
  onBatchDone?: (startIdx: number, results: string[]) => void,
): Promise<string[]> {
  const BATCH = 10;
  const all: string[] = sentences.map(() => '');

  for (let i = 0; i < sentences.length; i += BATCH) {
    const chunk = sentences.slice(i, i + BATCH);

    // 1) 主力：Google 翻譯
    let results = await googleTranslate(chunk);

    // 2) 有缺漏 → Gemini 補上
    if (results.filter(Boolean).length < chunk.length) {
      const gem = await geminiTranslateChunk(chunk, i);
      results = results.map((t, idx) => t || gem[idx] || '');
    }

    results.forEach((t, relIdx) => { if (t) all[i + relIdx] = t; });
    onBatchDone?.(i, results);
  }

  return all;
}

// ─── 單字中文翻譯（帶 Lingva 備援）────────────────────────

export async function translateToZh(word: string, context?: string): Promise<string | null> {
  const ctxLine = context ? `（出現在句子：${context}）\n` : '';
  const prompt =
    `把英文單字翻成繁體中文意思，只輸出中文詞語（多個義項用、分隔），不要造句、不要英文、不要日文。\n\n` +
    `範例：\n` +
    `elaborate => 詳細闡述、精心製作\n` +
    `happy => 快樂的、高興的\n\n` +
    `${ctxLine}${word} =>`;

  // 1. 嘗試 Gemini
  try {
    const res = await fetch('/api/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: [{ role: 'user', content: prompt }], temperature: 0.2, maxTokens: 60 }),
    });
    if (res.ok) {
      const data = (await res.json()) as { content?: string };
      const t = (data.content ?? '').trim().replace(/^=>\s*/, '').replace(/^["「『]/, '').replace(/["」』]$/, '').split('\n')[0].trim();
      if (t) return t;
    }
  } catch { /* fall through */ }

  // 2. Google 翻譯備援（免費，可靠）
  const [g] = await googleTranslate([word]);
  if (g) return g;

  return null;
}

/**
 * 快速單字翻譯（for hover 泡泡）
 * 直接走 Google 免費端點（~1.3s、穩定），不等慢且飄移的 Gemini
 */
export async function quickTranslateZh(word: string): Promise<string> {
  const [g] = await googleTranslate([word]);
  return g || '';
}
