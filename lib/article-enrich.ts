/**
 * 文章補強 — 為「沒有文法筆記 / 單字缺詞性」的文章（mock + 舊生成）補上內容。
 *
 * 配額意識（Gemini 免費層每天僅 20 次）：
 * - 詞性：用 Free Dictionary API（免費、無配額）→ 一定有。
 * - 文法 + 用法：需 LLM，用 Gemini best-effort；**只在文章缺文法時才花這次呼叫**
 *   （已有文法的文章只補免費詞性，不浪費配額）。配額用完就略過，不卡死。
 * - 結果一律存 localStorage，避免重複呼叫（也避免配額用完時每次開都慢）。
 */

import type { Article, GrammarNote } from '@/lib/types';
import { lookupOnline } from '@/lib/dictionary/lookup';
import { detectGrammar } from '@/lib/grammar-detect';

export interface Enrichment {
  grammarNotes: GrammarNote[];
  vocab: Record<string, { pos: string; usage: string }>; // key = word.toLowerCase()
}

type Articleish = Pick<Article, 'id' | 'paragraphs' | 'keyVocabulary' | 'grammarNotes'>;

/** 缺文法，或任一單字缺詞性 → 需要補強 */
export function needsEnrichment(a: Articleish): boolean {
  const noGrammar = !a.grammarNotes || a.grammarNotes.length === 0;
  const posMissing = (a.keyVocabulary ?? []).some((v) => !v.pos);
  return noGrammar || posMissing;
}

const POS_ABBR: Record<string, string> = {
  noun: 'n.', verb: 'v.', adjective: 'adj.', adverb: 'adv.', preposition: 'prep.',
  pronoun: 'pron.', conjunction: 'conj.', interjection: 'interj.', determiner: 'det.', numeral: 'num.',
};
const posAbbr = (p: string) => POS_ABBR[p.toLowerCase()] ?? p;

/** 免費詞性（Free Dictionary API，無配額）*/
async function freePos(words: string[]): Promise<Record<string, string>> {
  const out: Record<string, string> = {};
  await Promise.all(words.map(async (w) => {
    const r = await lookupOnline(w);
    if (r?.partOfSpeech) out[w.toLowerCase()] = posAbbr(r.partOfSpeech);
  }));
  return out;
}

export async function ensureEnrichment(a: Articleish, force = false): Promise<Enrichment | null> {
  if (typeof window === 'undefined') return null;
  const KEY = `readle.article_enrich:${a.id}`;

  if (!force) {
    try {
      const cached = JSON.parse(window.localStorage.getItem(KEY) ?? 'null') as Enrichment | null;
      if (cached && Array.isArray(cached.grammarNotes) && cached.vocab) {
        // 之前配額用完存了「空文法」的舊快取 → 不採用，往下重生（規則版保底）
        const needGrammar = !a.grammarNotes || a.grammarNotes.length === 0;
        if (!needGrammar || cached.grammarNotes.length > 0) return cached;
      }
    } catch { /* 壞了就重產 */ }
  }

  const words = (a.keyVocabulary ?? []).map((v) => v.word);

  // 1) 免費詞性（一定做）
  const posMap = await freePos(words);

  // 2) 文法 + 用法：只在「缺文法」時才花 Gemini（省配額）
  const noGrammar = !a.grammarNotes || a.grammarNotes.length === 0;
  let grammarNotes: GrammarNote[] = [];
  const gemVocab: Record<string, { pos?: string; usage?: string }> = {};

  if (noGrammar && words.length > 0) {
    const text = a.paragraphs.map((p) => p.join(' ')).join('\n').slice(0, 1500);
    const prompt =
      `針對以下英文文章，產出 JSON（繁體中文）：\n` +
      `1. grammarNotes：2-3 個與文章相關的文法重點，title 是文法名稱（如 Present Simple），body 是繁體中文解釋＋從文章舉一個例子。\n` +
      `2. vocab：對這些單字各給 usage（繁體中文一句用法或常見搭配）。單字：[${words.join(', ')}]\n\n` +
      `只輸出 JSON：{"grammarNotes":[{"title":"...","body":"..."}],"vocab":[{"word":"...","usage":"..."}]}\n\n` +
      `文章：\n${text}`;
    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.3, maxTokens: 1500, jsonMode: true,
        }),
        signal: AbortSignal.timeout(20000),
      });
      if (res.ok) {
        const data = (await res.json()) as { content?: string };
        const raw = (data.content ?? '').trim();
        const jsonText = raw.match(/\{[\s\S]*\}/)?.[0] ?? raw;
        const parsed = JSON.parse(jsonText) as {
          grammarNotes?: { title?: string; body?: string }[];
          vocab?: { word?: string; usage?: string }[];
        };
        grammarNotes = (parsed.grammarNotes ?? []).filter((g): g is GrammarNote => !!(g?.title && g?.body));
        for (const v of parsed.vocab ?? []) {
          if (v?.word) gemVocab[String(v.word).toLowerCase()] = { usage: v.usage ?? '' };
        }
      }
    } catch { /* 配額用完/逾時 → 略過 */ }

    // Gemini 沒生出文法（配額/失敗）→ 規則式偵測保底（零配額、瞬間）
    if (grammarNotes.length === 0) {
      grammarNotes = detectGrammar(a.paragraphs);
    }
  }

  const vocab: Enrichment['vocab'] = {};
  for (const w of words) {
    const k = w.toLowerCase();
    vocab[k] = { pos: posMap[k] ?? '', usage: gemVocab[k]?.usage ?? '' };
  }

  const result: Enrichment = { grammarNotes, vocab };
  try { window.localStorage.setItem(KEY, JSON.stringify(result)); } catch { /* 滿了忽略 */ }
  return result;
}
