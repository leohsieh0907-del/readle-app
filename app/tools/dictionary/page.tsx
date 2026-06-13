'use client';

import { useState, useRef } from 'react';
import { Search, Volume2, Loader2, BookA, ArrowLeftRight } from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';
import { speak } from '@/lib/speech/tts';

interface DictGroup { pos: string; terms: { term: string; reverse: string[] }[] }
interface EnDef { pos: string; items: { def: string; example?: string; synonyms?: string[] }[] }
interface DictResult {
  query: string;
  direction: 'en2zh' | 'zh2en';
  translation: string;
  romanization?: string;
  groups: DictGroup[];
  enWord: string;
  phonetic: string;
  audio: { us?: string; uk?: string };
  enDefs: EnDef[];
}

const POS_ZH: Record<string, string> = {
  noun: '名詞 n.', verb: '動詞 v.', adjective: '形容詞 adj.', adverb: '副詞 adv.',
  pronoun: '代名詞 pron.', preposition: '介系詞 prep.', conjunction: '連接詞 conj.',
  interjection: '感嘆詞 interj.', determiner: '限定詞 det.', exclamation: '感嘆詞',
  abbreviation: '縮寫', phrase: '片語', numeral: '數詞',
};
const posLabel = (p: string) => POS_ZH[p.toLowerCase()] ?? p;

const EXAMPLES = ['efficient', 'recipient', 'salutation', '效率', '收件人', 'run'];

function audioUrl(u?: string): string {
  if (!u) return '';
  return u.startsWith('//') ? `https:${u}` : u;
}

export default function DictionaryPage() {
  const [q, setQ] = useState('');
  const [result, setResult] = useState<DictResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const lookup = async (term: string) => {
    const word = term.trim();
    if (!word) return;
    setLoading(true);
    setError(false);
    setResult(null);
    try {
      const res = await fetch('/api/dictionary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ q: word }),
      });
      if (!res.ok) throw new Error('fail');
      const data = (await res.json()) as DictResult;
      if (!data.translation && data.enDefs.length === 0 && data.groups.length === 0) throw new Error('empty');
      setResult(data);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = (e: React.FormEvent) => { e.preventDefault(); lookup(q); };

  const play = (text: string, url?: string) => {
    const u = audioUrl(url);
    if (u) { try { new Audio(u).play(); return; } catch { /* fall through */ } }
    speak({ text });
  };

  const isZh = result?.direction === 'zh2en';

  return (
    <div className="mx-auto max-w-3xl" data-no-lookup>
      {/* 標題 */}
      <div className="mb-5">
        <div className="flex items-center gap-2 text-2xl font-extrabold">
          <BookA className="text-[#5B5BF0]" size={26} /> 字典
        </div>
        <p className="mt-1 text-sm text-[var(--color-text-tertiary)]">英漢・漢英雙語查詢 — 音標、發音、詞性、釋義、例句</p>
      </div>

      {/* 搜尋列 */}
      <form onSubmit={onSubmit}>
        <GlassCard className="flex items-center gap-2 p-2">
          <Search size={18} className="ml-2 shrink-0 text-[var(--color-text-tertiary)]" />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="輸入英文或中文…"
            className="min-w-0 flex-1 bg-transparent py-2 text-[15px] outline-none placeholder:text-[var(--color-text-tertiary)]"
            autoFocus
          />
          <button type="submit" disabled={loading}
            className="shrink-0 rounded-xl bg-gradient-to-r from-[#7C7CFF] to-[#5B5BF0] px-4 py-2 text-sm font-semibold text-white shadow-card transition hover:scale-[1.02] disabled:opacity-50">
            {loading ? <Loader2 size={16} className="animate-spin" /> : '查詢'}
          </button>
        </GlassCard>
      </form>

      {/* 範例詞（未查詢時）*/}
      {!result && !loading && !error && (
        <div className="mt-5">
          <div className="mb-2 text-xs text-[var(--color-text-tertiary)]">試試這些：</div>
          <div className="flex flex-wrap gap-2">
            {EXAMPLES.map((ex) => (
              <button key={ex} onClick={() => { setQ(ex); lookup(ex); }}
                className="rounded-full bg-white/60 px-3 py-1.5 text-sm ring-1 ring-inset ring-black/5 transition hover:bg-[#5B5BF0]/10 hover:text-[#5B5BF0]">
                {ex}
              </button>
            ))}
          </div>
        </div>
      )}

      {loading && (
        <div className="mt-10 flex flex-col items-center gap-3 text-[var(--color-text-tertiary)]">
          <Loader2 size={28} className="animate-spin text-[#5B5BF0]" />
          <span className="text-sm">查詢中…</span>
        </div>
      )}

      {error && (
        <GlassCard className="mt-5 p-6 text-center">
          <div className="mb-1 text-3xl">🔍</div>
          <p className="text-sm text-[var(--color-text-secondary)]">查不到「{q}」，換個拼法或詞試試</p>
        </GlassCard>
      )}

      {result && (
        <div className="mt-5 space-y-4">
          {/* 頭詞區 */}
          <GlassCard className="p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <span className="break-words text-[28px] font-extrabold leading-tight">{result.query}</span>
                  {isZh && result.romanization && (
                    <span className="text-sm text-[var(--color-text-tertiary)]">{result.romanization}</span>
                  )}
                </div>

                {/* 英文字的音標（en2zh：query；zh2en：翻出來的英文字）*/}
                {result.phonetic && (
                  <div className="mt-1 text-sm text-[var(--color-text-tertiary)]">
                    {isZh && <span className="mr-1.5 font-semibold text-[var(--color-text-secondary)]">{result.enWord}</span>}
                    {result.phonetic}
                  </div>
                )}
              </div>

              {/* 發音按鈕 */}
              <div className="flex shrink-0 gap-1.5">
                {result.enWord && (
                  <button onClick={() => play(result.enWord, result.audio?.us)}
                    className="flex items-center gap-1 rounded-xl bg-[#5B5BF0]/10 px-2.5 py-2 text-xs font-medium text-[#5B5BF0] transition hover:bg-[#5B5BF0]/20"
                    title="美式發音">
                    <Volume2 size={15} /> US
                  </button>
                )}
                {result.audio?.uk && (
                  <button onClick={() => play(result.enWord, result.audio?.uk)}
                    className="flex items-center gap-1 rounded-xl bg-black/[0.04] px-2.5 py-2 text-xs font-medium text-[var(--color-text-secondary)] transition hover:bg-black/[0.08]"
                    title="英式發音">
                    <Volume2 size={15} /> UK
                  </button>
                )}
              </div>
            </div>

            {/* 主翻譯 */}
            {result.translation && (
              <div className="mt-3 rounded-xl bg-gradient-to-r from-[#7C7CFF]/10 to-[#5B5BF0]/5 p-3">
                <div className="text-lg font-bold text-[#4338ca]">{result.translation}</div>
              </div>
            )}
          </GlassCard>

          {/* 分詞性釋義（Google bd）*/}
          {result.groups.length > 0 && (
            <GlassCard className="p-5">
              <div className="mb-3 flex items-center gap-1.5 font-bold">
                <ArrowLeftRight size={15} className="text-[#5B5BF0]" /> 詞性釋義
              </div>
              <div className="space-y-3">
                {result.groups.map((g, i) => (
                  <div key={i}>
                    <span className="rounded-md bg-[#5B5BF0]/10 px-2 py-0.5 text-[11px] font-semibold text-[#5B5BF0]">{posLabel(g.pos)}</span>
                    <div className="mt-1.5 space-y-1">
                      {g.terms.map((t, j) => (
                        <div key={j} className="flex flex-wrap items-baseline gap-x-2 text-sm">
                          <span className="font-semibold text-[var(--color-text-primary)]">{t.term}</span>
                          {t.reverse.length > 0 && (
                            <span className="text-xs text-[var(--color-text-tertiary)]">{t.reverse.slice(0, 5).join(', ')}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </GlassCard>
          )}

          {/* 英英定義（Free Dictionary）*/}
          {result.enDefs.length > 0 && (
            <GlassCard className="p-5">
              <div className="mb-3 font-bold">英英定義</div>
              <div className="space-y-4">
                {result.enDefs.map((m, i) => (
                  <div key={i}>
                    <span className="rounded-md bg-black/[0.05] px-2 py-0.5 text-[11px] font-semibold italic text-[var(--color-text-secondary)]">{posLabel(m.pos)}</span>
                    <ol className="mt-2 space-y-2">
                      {m.items.map((d, j) => (
                        <li key={j} className="text-sm">
                          <span className="text-[var(--color-text-secondary)]">{j + 1}. {d.def}</span>
                          {d.example && (
                            <div className="mt-0.5 flex items-start gap-1.5 pl-4">
                              <span className="flex-1 text-xs italic text-[var(--color-text-tertiary)]">&ldquo;{d.example}&rdquo;</span>
                              <button onClick={() => play(d.example!)}
                                className="shrink-0 rounded-full p-1 text-[var(--color-text-tertiary)] hover:bg-[#5B5BF0]/10 hover:text-[#5B5BF0]">
                                <Volume2 size={12} />
                              </button>
                            </div>
                          )}
                          {d.synonyms && d.synonyms.length > 0 && (
                            <div className="mt-1 flex flex-wrap gap-1 pl-4">
                              {d.synonyms.map((s) => (
                                <button key={s} onClick={() => { setQ(s); lookup(s); }}
                                  className="rounded-full bg-[#5B5BF0]/[0.07] px-2 py-0.5 text-[11px] text-[#5B5BF0] hover:bg-[#5B5BF0]/15">
                                  {s}
                                </button>
                              ))}
                            </div>
                          )}
                        </li>
                      ))}
                    </ol>
                  </div>
                ))}
              </div>
            </GlassCard>
          )}

          <p className="px-1 text-center text-[11px] text-[var(--color-text-tertiary)]">
            資料來源：Google 翻譯 · Free Dictionary（免費，無 AI 配額限制）
          </p>
        </div>
      )}
    </div>
  );
}
