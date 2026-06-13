/**
 * 規則式文法偵測 — 零 AI 配額的文法筆記產生器
 *
 * 文法句型是固定模式（have+p.p.、be+p.p.、比較級…），用 regex 偵測文章句子，
 * 配預寫的繁中解釋 + 文章內的實際例句。Gemini 配額用完時的可靠後盾。
 */

import type { GrammarNote } from '@/lib/types';

interface Rule { title: string; explain: string; re: RegExp }

const RULES: Rule[] = [
  {
    title: 'Present Simple 現在簡單式（習慣）',
    re: /\b(every day|every morning|usually|often|always|sometimes|never)\b/i,
    explain: '一般現在式搭配頻率副詞（every day、often、always…）描述習慣或常態。',
  },
  {
    title: 'Present Perfect 現在完成式',
    re: /\b(have|has)\s+(been|become|made|done|gone|taken|seen|found|grown|changed|\w+ed)\b/i,
    explain: '「have/has + 過去分詞」表示從過去持續到現在、或剛完成的事，強調對現在的影響。',
  },
  {
    title: 'Passive Voice 被動語態',
    re: /\b(is|are|was|were|been|being)\s+(made|done|given|taken|found|known|used|called|seen|built|written|sold|grown|held|served|\w+ed)\b/i,
    explain: '「be + 過去分詞」把焦點放在「被做的事」而非做的人，常用於描述事實或流程。',
  },
  {
    title: 'Modal Verbs 情態動詞',
    re: /\b(can|could|should|must|may|might|would)\s+[a-z]+/i,
    explain: 'can（能力）、should（建議）、must（必須）、might（可能）等情態動詞後面接原形動詞。',
  },
  {
    title: 'Superlative 最高級',
    re: /\bthe\s+(most\s+\w+|\w{3,}est)\b/i,
    explain: '「the most + 形容詞」或「the + 形容詞-est」表示「最…的」，三者以上比較時使用。',
  },
  {
    title: 'Comparative 比較級',
    re: /\b(more\s+\w+\s+than|\w{3,}er\s+than)\b/i,
    explain: '「形容詞-er than」或「more + 形容詞 + than」用來比較兩者的差異。',
  },
  {
    title: 'Conditional 條件句',
    re: /\bif\b[^.!?]*\b(will|can|would|could)\b/i,
    explain: '「If + 條件, 主句」表示在某條件下會發生的事；主句常用 will/can。',
  },
  {
    title: 'There is / There are 存在句',
    re: /\bthere\s+(is|are|was|were)\b/i,
    explain: '「There is/are…」表示「有…存在」；單數用 is、複數用 are。',
  },
  {
    title: 'Future: be going to 未來式',
    re: /\b(am|is|are)\s+going\s+to\s+[a-z]+/i,
    explain: '「be going to + 原形動詞」表示計畫好的未來或可預見的事。',
  },
  {
    title: 'Relative Clause 關係子句',
    re: /\b\w+\s+(who|which)\s+\w+/i,
    explain: '用 who（人）/ which（物）引導子句來補充說明前面的名詞，把兩句合成一句。',
  },
  {
    title: 'Imperative 祈使句',
    re: /^(don't|let's|remember|try|make|keep|start|always|never|ask)\b/i,
    explain: '祈使句省略主詞、動詞用原形，用來給指示或建議；否定用 Don\'t 開頭。',
  },
  {
    title: 'Gerund 動名詞',
    re: /^[A-Z]\w+ing\s+\w+/,
    explain: '動詞加 -ing 變成動名詞，可以當主詞或受詞使用，如 "Learning English takes time."',
  },
];

/** 從文章句子偵測文法重點，回傳最多 max 則（含文章內例句） */
export function detectGrammar(paragraphs: string[][], max = 3): GrammarNote[] {
  const sentences = paragraphs.flat().filter((s) => s.trim().length > 10);
  const notes: GrammarNote[] = [];
  for (const rule of RULES) {
    if (notes.length >= max) break;
    const hit = sentences.find((s) => rule.re.test(s));
    if (hit) notes.push({ title: rule.title, body: `${rule.explain}\n例：${hit.trim()}` });
  }
  return notes;
}
