/**
 * 雙語字典聚合 — 全部用免費來源（不碰 Gemini 配額）
 *
 * 來源：
 * 1. Google translate_a（dt=t 翻譯 / dt=bd 分詞性釋義+反查 / dt=rm 拼音）— 後端代打避 CORS
 * 2. Free Dictionary API — IPA 音標、US/UK 真人發音、英英定義、例句、同義詞
 *
 * 方向自動判斷：含中日韓字 → 中翻英，否則英翻中。
 */

import type { NextRequest } from 'next/server';
import { apiGuard } from '@/lib/api-guard';

const asArr = (x: unknown): unknown[] => (Array.isArray(x) ? x : []);
const asStr = (x: unknown): string => (typeof x === 'string' ? x : '');

interface DictGroup { pos: string; terms: { term: string; reverse: string[] }[] }
interface EnDef { pos: string; items: { def: string; example?: string; synonyms?: string[] }[] }

// ── Google translate_a ──
async function google(q: string, sl: string, tl: string) {
  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sl}&tl=${tl}&dt=t&dt=bd&dt=rm&q=${encodeURIComponent(q.slice(0, 200))}`;
  const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
  if (!res.ok) throw new Error('google_fail');
  const data = asArr(await res.json());

  const seg0 = asArr(data[0]);
  let translation = '';
  let romanization = '';
  for (const s of seg0) {
    const seg = asArr(s);
    if (asStr(seg[0])) translation += asStr(seg[0]);
    if (asStr(seg[3])) romanization = asStr(seg[3]); // 拼音/羅馬拼音段
  }

  const groups: DictGroup[] = [];
  for (const g of asArr(data[1])) {
    const arr = asArr(g);
    const pos = asStr(arr[0]);
    const terms = asArr(arr[2]).map((e) => {
      const ea = asArr(e);
      return { term: asStr(ea[0]), reverse: asArr(ea[1]).map(asStr).filter(Boolean) };
    }).filter((t) => t.term);
    if (pos && terms.length) groups.push({ pos, terms });
  }
  return { translation: translation.trim(), romanization: romanization.trim(), groups };
}

// ── Free Dictionary（英文字的音標/發音/定義）──
interface FDPhon { text?: string; audio?: string }
interface FDDef { definition?: string; example?: string; synonyms?: string[] }
interface FDMean { partOfSpeech?: string; definitions?: FDDef[]; synonyms?: string[] }
interface FDEntry { word?: string; phonetic?: string; phonetics?: FDPhon[]; meanings?: FDMean[] }

async function freeDict(word: string) {
  const clean = word.toLowerCase().replace(/[^a-z'-]/g, '');
  if (!clean) return null;
  try {
    const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(clean)}`, {
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as FDEntry[];
    const entry = Array.isArray(data) ? data[0] : null;
    if (!entry) return null;

    const phonetic = entry.phonetic || entry.phonetics?.find((p) => p.text)?.text || '';
    const audios = (entry.phonetics ?? []).filter((p) => p.audio);
    const pick = (tag: string) => audios.find((p) => (p.audio ?? '').includes(`-${tag}.`))?.audio;
    const us = pick('us') || audios[0]?.audio || '';
    const uk = pick('uk') || '';

    const enDefs: EnDef[] = (entry.meanings ?? []).map((m) => ({
      pos: m.partOfSpeech ?? '',
      items: (m.definitions ?? []).slice(0, 4).map((d) => ({
        def: d.definition ?? '',
        example: d.example,
        synonyms: (d.synonyms && d.synonyms.length ? d.synonyms : m.synonyms)?.slice(0, 6),
      })).filter((d) => d.def),
    })).filter((m) => m.items.length);

    return { word: entry.word ?? clean, phonetic, audio: { us, uk }, enDefs };
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  const blocked = apiGuard(req);
  if (blocked) return blocked;

  let body: { q?: string };
  try {
    body = (await req.json()) as { q?: string };
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), { status: 400 });
  }

  const q = (body.q ?? '').trim();
  if (!q) return Response.json({ error: 'empty' }, { status: 400 });

  const isZh = /[一-鿿぀-ヿ]/.test(q);
  const direction = isZh ? 'zh2en' : 'en2zh';

  try {
    const g = isZh ? await google(q, 'zh-TW', 'en') : await google(q, 'en', 'zh-TW');
    // 英文字：英翻中用 query 本身；中翻英用主翻譯結果
    const enWord = isZh ? (g.translation || g.groups[0]?.terms[0]?.term || '') : q;
    const fd = await freeDict(enWord);

    return Response.json({
      query: q,
      direction,
      translation: g.translation,
      romanization: g.romanization || undefined,
      groups: g.groups,
      enWord: fd?.word || enWord,
      phonetic: fd?.phonetic || '',
      audio: fd?.audio || { us: '', uk: '' },
      enDefs: fd?.enDefs || [],
    });
  } catch {
    return Response.json({ error: 'lookup_failed' }, { status: 502 });
  }
}
