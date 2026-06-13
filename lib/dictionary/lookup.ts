/**
 * 單字查詢 — 免費線上字典 + AI 中文翻譯
 *
 * 1. Free Dictionary API（無需 key、免費、CORS 開放）
 *    → 音標、真人發音音檔、英英釋義
 * 2. Gemini（若已設定）→ 中文釋義
 */

export interface DictResult {
  word: string;
  phonetic?: string;
  audioUrl?: string; // 真人發音 mp3
  partOfSpeech?: string;
  enDefinition?: string;
  example?: string;
}

interface FreeDictPhonetic {
  text?: string;
  audio?: string;
}
interface FreeDictDef {
  definition?: string;
  example?: string;
}
interface FreeDictMeaning {
  partOfSpeech?: string;
  definitions?: FreeDictDef[];
}
interface FreeDictEntry {
  word?: string;
  phonetic?: string;
  phonetics?: FreeDictPhonetic[];
  meanings?: FreeDictMeaning[];
}

/** 查線上英英字典（音標 + 發音 + 英文釋義） */
export async function lookupOnline(word: string): Promise<DictResult | null> {
  const clean = word.toLowerCase().replace(/[^a-z'-]/g, '');
  if (!clean) return null;
  try {
    const res = await fetch(
      `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(clean)}`,
    );
    if (!res.ok) return null;
    const data = (await res.json()) as FreeDictEntry[];
    const entry = Array.isArray(data) ? data[0] : null;
    if (!entry) return null;

    const phonetic = entry.phonetic || entry.phonetics?.find((p) => p.text)?.text;
    const audioUrl =
      entry.phonetics?.find((p) => p.audio && p.audio.length > 0)?.audio || undefined;
    const meaning = entry.meanings?.[0];
    const def = meaning?.definitions?.[0];

    return {
      word: entry.word ?? clean,
      phonetic,
      audioUrl,
      partOfSpeech: meaning?.partOfSpeech,
      enDefinition: def?.definition,
      example: def?.example,
    };
  } catch {
    return null;
  }
}

/**
 * 用 AI 取得中文釋義
 * 直接打後端 /api/ai/chat（伺服器端用 Gemini），不受前端 provider 設定影響。
 * 這樣即使使用者設定是 mock，查單字仍能拿到真實中文翻譯。
 */
export async function translateToZh(word: string, context?: string): Promise<string | null> {
  // few-shot 範例格式 → 強制只輸出繁體中文詞義，避免被當成指令或回成日文/英文
  const ctxLine = context ? `（出現在句子：${context}）\n` : '';
  const prompt =
    `把英文單字翻成繁體中文意思，只輸出中文詞語（多個義項用、分隔），不要造句、不要英文、不要日文。\n\n` +
    `範例：\n` +
    `elaborate => 詳細闡述、精心製作\n` +
    `happy => 快樂的、高興的\n\n` +
    `${ctxLine}${word} =>`;
  try {
    const res = await fetch('/api/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.2,
        maxTokens: 60,
      }),
    });
    if (!res.ok) return null; // 沒設 key（503）或錯誤 → 沒中文，但仍有英英
    const data = (await res.json()) as { content?: string };
    const t = (data.content ?? '')
      .trim()
      .replace(/^=>\s*/, '')
      .replace(/^["「『]/, '')
      .replace(/["」』]$/, '')
      .split('\n')[0]
      .trim();
    return t || null;
  } catch {
    return null;
  }
}
