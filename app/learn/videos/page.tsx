'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Play, Eye, Filter, Search, Loader2, Sparkles, Tv2, Clock, X } from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';
import { seedVideos } from '@/lib/mock/seed-videos';
import type { Category, CEFR } from '@/lib/readle-types';

const gradients: Record<string, string> = {
  'gradient-1': 'from-[#7C7CFF] via-[#5B5BF0] to-[#FF6B9D]',
  'gradient-2': 'from-[#10B981] via-[#06B6D4] to-[#3B82F6]',
  'gradient-3': 'from-[#FFB84D] via-[#FF6B6B] to-[#D946EF]',
  'gradient-4': 'from-[#8B5CF6] via-[#6366F1] to-[#06B6D4]',
  'gradient-5': 'from-[#F59E0B] via-[#FB923C] to-[#F87171]',
};

const randomGrad = (id: string) => {
  const g = ['gradient-1','gradient-2','gradient-3','gradient-4','gradient-5'];
  return g[id.charCodeAt(0) % g.length];
};

const catLabel: Record<Category, string> = {
  toeic: '多益', business: '商業', daily: '日常', travel: '旅遊', tech: '科技',
};

const levels: ('all' | CEFR)[] = ['all', 'A2', 'B1', 'B2'];
const cats: ('all' | Category)[] = ['all', 'toeic', 'business', 'daily', 'travel', 'tech'];

interface YTResult {
  id: string; title: string; titleZh: string;
  channelTitle: string; thumbnail: string; durationHint: string; level?: string;
}

function fmt(sec: number) {
  const m = Math.floor(sec / 60), s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function VideosPage() {
  const [level, setLevel] = useState<'all' | CEFR>('all');
  const [cat, setCat] = useState<'all' | Category>('all');
  const [searchQ, setSearchQ] = useState('');
  const [searching, setSearching] = useState(false);
  const [ytResults, setYtResults] = useState<YTResult[]>([]);
  const [searchSource, setSearchSource] = useState('');
  const [searchErr, setSearchErr] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  const HISTORY_KEY = 'readle.video_search_history';

  const loadHistory = () => {
    try { return JSON.parse(localStorage.getItem(HISTORY_KEY) ?? '[]') as string[]; }
    catch { return []; }
  };

  const saveHistory = (q: string) => {
    const prev = loadHistory().filter(s => s !== q);
    const next = [q, ...prev].slice(0, 5);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
    setHistory(next);
  };

  const removeHistory = (q: string) => {
    const next = loadHistory().filter(s => s !== q);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
    setHistory(next);
  };

  useEffect(() => {
    setHistory(loadHistory());
    // 點外面關閉歷史下拉
    const handler = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setShowHistory(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = seedVideos.filter(
    v => (level === 'all' || v.level === level) && (cat === 'all' || v.category === cat),
  );

  const doSearch = async (q: string) => {
    if (q.trim().length < 2) { setYtResults([]); setSearchErr(''); return; }
    setSearching(true);
    setSearchErr('');
    setShowHistory(false);
    saveHistory(q.trim());
    try {
      const res = await fetch(`/api/youtube-search?q=${encodeURIComponent(q)}`);
      const data = await res.json() as { results?: YTResult[]; source?: string; error?: string };
      if (data.error) { setSearchErr(data.error); setYtResults([]); }
      else { setYtResults(data.results ?? []); setSearchSource(data.source ?? ''); }
    } catch { setSearchErr('搜尋失敗'); }
    finally { setSearching(false); }
  };

  const handleInput = (q: string) => {
    setSearchQ(q);
    setShowHistory(false);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(q), 700);
  };

  const handleFocus = () => {
    setHistory(loadHistory());
    if (!searchQ.trim()) setShowHistory(true);
  };

  const isSearchMode = searchQ.trim().length >= 2;

  return (
    <div className="space-y-6">
      <header className="px-1">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">影片學習</h1>
        <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
          中英雙字幕 · 點字查單字 · AB Repeat · AI 跟讀評分
        </p>
      </header>

      {/* 搜尋框 */}
      <GlassCard className="p-4">
        <div ref={wrapRef} className="relative">
          <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center">
            {searching
              ? <Loader2 size={16} className="animate-spin text-[#5B5BF0]" />
              : <Search size={16} className="text-[var(--color-text-tertiary)]" />
            }
          </div>
          <input
            ref={inputRef}
            type="search"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
            value={searchQ}
            onChange={e => handleInput(e.target.value)}
            onFocus={handleFocus}
            onKeyDown={e => { if (e.key === 'Enter' && searchQ.trim()) doSearch(searchQ.trim()); }}
            placeholder="搜尋 YouTube 英文學習影片，例如：business email, pronunciation, IELTS…"
            className="h-11 w-full rounded-xl border border-[var(--color-border)] bg-white/60 pl-10 pr-4 text-[15px] outline-none transition focus:border-[#5B5BF0] focus:ring-2 focus:ring-[#5B5BF0]/20 [&::-webkit-search-cancel-button]:hidden"
          />

          {/* 歷史紀錄下拉 */}
          {showHistory && history.length > 0 && (
            <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-50 overflow-hidden rounded-2xl bg-white/90 shadow-modal backdrop-blur-md ring-1 ring-inset ring-black/5">
              <div className="flex items-center justify-between px-4 py-2.5">
                <span className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)]">
                  <Clock size={11} /> 最近搜尋
                </span>
                <button
                  type="button"
                  onClick={() => { localStorage.removeItem(HISTORY_KEY); setHistory([]); setShowHistory(false); }}
                  className="text-[10px] text-[var(--color-text-tertiary)] hover:text-[#F87171]"
                >
                  清除
                </button>
              </div>
              {history.map(q => (
                <div key={q} className="flex items-center gap-2 px-2">
                  <button
                    type="button"
                    onClick={() => { setSearchQ(q); doSearch(q); }}
                    className="flex flex-1 items-center gap-2.5 rounded-xl px-2 py-2.5 text-left text-sm hover:bg-[#5B5BF0]/8"
                  >
                    <Clock size={13} className="shrink-0 text-[var(--color-text-tertiary)]" />
                    {q}
                  </button>
                  <button
                    type="button"
                    onClick={() => removeHistory(q)}
                    className="rounded-full p-1.5 text-[var(--color-text-tertiary)] hover:bg-black/5 hover:text-[#F87171]"
                    title="刪除這筆"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
              <div className="h-2" />
            </div>
          )}
        </div>

        {!isSearchMode && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {['business email','pronunciation','TOEIC listening','daily conversation','job interview'].map(s => (
              <button key={s} type="button" onClick={() => { setSearchQ(s); doSearch(s); }}
                className="rounded-full bg-[#5B5BF0]/8 px-2.5 py-1 text-xs text-[#5B5BF0] hover:bg-[#5B5BF0]/15">
                {s}
              </button>
            ))}
          </div>
        )}
      </GlassCard>

      {/* YouTube 搜尋結果 */}
      {isSearchMode && (
        <section>
          <div className="mb-3 flex items-center gap-2 px-1">
            <Tv2 size={16} className="text-[#EF4444]" />
            <h2 className="text-lg font-bold">
              「{searchQ}」搜尋結果
            </h2>
            {searchSource === 'gemini_recommend' && (
              <span className="inline-flex items-center gap-1 rounded-full bg-[#5B5BF0]/10 px-2 py-0.5 text-[10px] font-semibold text-[#5B5BF0]">
                <Sparkles size={10} /> AI 推薦
              </span>
            )}
          </div>

          {searching && (
            <div className="py-12 text-center text-sm text-[var(--color-text-tertiary)]">
              <Loader2 size={20} className="mx-auto mb-2 animate-spin" />
              搜尋中…
            </div>
          )}

          {searchErr && !searching && (
            <GlassCard className="p-6 text-center text-sm text-[var(--color-text-tertiary)]">
              ⚠️ {searchErr}
            </GlassCard>
          )}

          {!searching && ytResults.length > 0 && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {ytResults.map(v => (
                <Link key={v.id} href={`/learn/videos/yt-${v.id}`} className="group">
                  <GlassCard className="h-full overflow-hidden p-0 transition group-hover:shadow-hover">
                    <div className="relative aspect-video overflow-hidden">
                      {v.thumbnail ? (
                        <img src={v.thumbnail} alt={v.title}
                          className="h-full w-full object-cover transition group-hover:scale-105" />
                      ) : (
                        <div className={`h-full w-full bg-gradient-to-br ${randomGrad(v.id)} flex items-center justify-center`}>
                          <Play size={32} fill="white" color="white" className="opacity-80" />
                        </div>
                      )}
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 transition group-hover:opacity-100">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/30 backdrop-blur-md">
                          <Play size={20} fill="white" color="white" />
                        </div>
                      </div>
                      {v.level && (
                        <div className="absolute left-2 top-2 rounded-full bg-white/85 px-2 py-0.5 text-[10px] font-bold uppercase text-[#5B5BF0]">
                          {v.level}
                        </div>
                      )}
                      <div className="absolute bottom-2 right-2 rounded bg-black/60 px-1.5 py-0.5 font-mono text-[10px] text-white">
                        {v.durationHint}
                      </div>
                    </div>
                    <div className="p-4">
                      <h3 className="font-bold leading-snug line-clamp-2">{v.title}</h3>
                      {v.titleZh && (
                        <p className="mt-1 text-sm text-[var(--color-text-secondary)] line-clamp-1">{v.titleZh}</p>
                      )}
                      <div className="mt-2 text-xs text-[var(--color-text-tertiary)]">
                        📺 {v.channelTitle}
                      </div>
                    </div>
                  </GlassCard>
                </Link>
              ))}
            </div>
          )}

          {!searching && ytResults.length === 0 && !searchErr && (
            <GlassCard className="p-8 text-center">
              <div className="mb-2 text-3xl">🔍</div>
              <p className="text-sm text-[var(--color-text-tertiary)]">沒有找到相關影片</p>
            </GlassCard>
          )}
        </section>
      )}

      {/* 本站影片（非搜尋模式顯示篩選器） */}
      {!isSearchMode && (
        <>
          <GlassCard className="p-4">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)]">
              <Filter size={12} /> 等級
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {levels.map(l => (
                <button key={l} type="button" onClick={() => setLevel(l)}
                  className={`h-8 rounded-full px-3 text-xs font-medium transition ${
                    level === l
                      ? 'bg-gradient-to-r from-[#7C7CFF] to-[#5B5BF0] text-white shadow-card'
                      : 'bg-white/50 text-[var(--color-text-secondary)] ring-1 ring-inset ring-black/5 hover:bg-white/70'
                  }`}>
                  {l === 'all' ? '全部' : l}
                </button>
              ))}
            </div>
            <div className="mt-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)]">
              <Filter size={12} /> 分類
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {cats.map(c => (
                <button key={c} type="button" onClick={() => setCat(c)}
                  className={`h-8 rounded-full px-3 text-xs font-medium transition ${
                    cat === c
                      ? 'bg-gradient-to-r from-[#7C7CFF] to-[#5B5BF0] text-white shadow-card'
                      : 'bg-white/50 text-[var(--color-text-secondary)] ring-1 ring-inset ring-black/5 hover:bg-white/70'
                  }`}>
                  {c === 'all' ? '全部' : catLabel[c as Category]}
                </button>
              ))}
            </div>
          </GlassCard>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.length === 0 ? (
              <GlassCard className="col-span-full p-10 text-center text-sm text-[var(--color-text-tertiary)]">
                這個分類還沒有影片
              </GlassCard>
            ) : filtered.map(v => (
              <Link key={v.id} href={`/learn/videos/${v.id}`} className="group">
                <GlassCard className="h-full overflow-hidden p-0 transition group-hover:shadow-hover">
                  <div className={`relative flex aspect-video items-center justify-center bg-gradient-to-br ${gradients[v.thumbnail] ?? gradients['gradient-1']}`}>
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/30 backdrop-blur-md transition group-hover:scale-110">
                      <Play size={24} fill="white" color="white" />
                    </div>
                    <div className="absolute bottom-2 right-2 rounded bg-black/50 px-2 py-0.5 font-mono text-xs text-white">{fmt(v.durationSec)}</div>
                    <div className="absolute left-3 top-3 inline-flex items-center gap-1.5">
                      <span className="rounded-full bg-white/85 px-2 py-0.5 text-[10px] font-bold uppercase text-[#5B5BF0]">{v.level}</span>
                      <span className="rounded-full bg-white/85 px-2 py-0.5 text-[10px] font-bold uppercase text-[#5B5BF0]">{catLabel[v.category]}</span>
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="font-bold leading-snug line-clamp-2">{v.title}</h3>
                    <p className="mt-1 text-sm text-[var(--color-text-secondary)] line-clamp-1">{v.titleZh}</p>
                    <div className="mt-3 flex items-center gap-2 text-xs text-[var(--color-text-tertiary)]">
                      <span className="inline-flex items-center gap-1"><Eye size={12} /> {v.views.toLocaleString()}</span>
                      <span>·</span>
                      <span>{v.keyWords.length} 重點字</span>
                    </div>
                  </div>
                </GlassCard>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
