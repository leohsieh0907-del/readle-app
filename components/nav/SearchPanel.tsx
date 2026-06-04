'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, PlayCircle, BookOpen, FileText, Clock } from 'lucide-react';
import videosData from '@/data/videos.json';
import { vocabRepo } from '@/lib/storage/repos';
import type { MockVideo } from '@/lib/readle-types';

const videos = videosData as MockVideo[];

const catLabel: Record<string, string> = {
  toeic: '多益', business: '商業', daily: '日常', travel: '旅遊', tech: '科技',
};

interface Result {
  type: 'video' | 'word' | 'article';
  id: string;
  title: string;
  subtitle: string;
  href: string;
  tag?: string;
}

const RECENT_KEY = 'readle.search_recent';
const MAX_RECENT = 6;

function getRecent(): string[] {
  try { return JSON.parse(localStorage.getItem(RECENT_KEY) ?? '[]') as string[]; } catch { return []; }
}
function addRecent(q: string) {
  const prev = getRecent().filter(s => s !== q);
  localStorage.setItem(RECENT_KEY, JSON.stringify([q, ...prev].slice(0, MAX_RECENT)));
}

function search(q: string): Result[] {
  const lower = q.toLowerCase().trim();
  if (!lower) return [];
  const results: Result[] = [];

  // 搜尋影片
  for (const v of videos) {
    if (
      v.title.toLowerCase().includes(lower) ||
      v.titleZh.includes(q) ||
      v.keyWords.some(k => k.toLowerCase().includes(lower))
    ) {
      results.push({
        type: 'video', id: v.id,
        title: v.title,
        subtitle: `${v.titleZh} · ${v.level} · ${catLabel[v.category] ?? v.category}`,
        href: `/learn/videos/${v.id}`,
        tag: catLabel[v.category],
      });
    }
  }

  // 搜尋單字本
  const vocab = vocabRepo.get();
  for (const e of Object.values(vocab.entries)) {
    if (e.word.toLowerCase().includes(lower) || e.meaning.includes(q)) {
      results.push({
        type: 'word', id: e.id,
        title: e.word,
        subtitle: `${e.meaning} · ${e.partOfSpeech}`,
        href: '/learn/vocab',
        tag: catLabel[e.category],
      });
      if (results.length >= 12) break;
    }
  }

  return results.slice(0, 10);
}

interface SearchPanelProps {
  open: boolean;
  onClose: () => void;
}

export default function SearchPanel({ open, onClose }: SearchPanelProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Result[]>([]);
  const [recent, setRecent] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (open) {
      setQuery('');
      setResults([]);
      setRecent(getRecent());
      setTimeout(() => inputRef.current?.focus(), 80);
    }
  }, [open]);

  useEffect(() => {
    if (!query.trim()) { setResults([]); return; }
    setResults(search(query));
  }, [query]);

  const go = (href: string, q?: string) => {
    if (q) addRecent(q);
    else if (query.trim()) addRecent(query.trim());
    onClose();
    router.push(href);
  };

  const typeIcon = (type: Result['type']) => {
    if (type === 'video') return <PlayCircle size={14} className="text-[#5B5BF0]" />;
    if (type === 'word') return <BookOpen size={14} className="text-[#8B5CF6]" />;
    return <FileText size={14} className="text-[#06B6D4]" />;
  };

  const typeLabel = (type: Result['type']) => {
    if (type === 'video') return '影片';
    if (type === 'word') return '單字';
    return '文章';
  };

  // 鍵盤導航
  const [cursor, setCursor] = useState(-1);
  useEffect(() => { setCursor(-1); }, [results]);

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') { onClose(); return; }
    if (e.key === 'ArrowDown') { e.preventDefault(); setCursor(c => Math.min(c + 1, results.length - 1)); }
    if (e.key === 'ArrowUp') { e.preventDefault(); setCursor(c => Math.max(c - 1, -1)); }
    if (e.key === 'Enter' && cursor >= 0 && results[cursor]) {
      go(results[cursor].href);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* 背景遮罩 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[60] bg-black/25 backdrop-blur-sm"
          />

          {/* 搜尋面板 */}
          <motion.div
            initial={{ opacity: 0, y: -12, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.18, ease: [0.32, 0.72, 0, 1] }}
            className="glass-strong fixed left-1/2 top-5 z-[61] w-full max-w-xl -translate-x-1/2 overflow-hidden rounded-2xl shadow-modal"
          >
            {/* 輸入框 */}
            <div className="flex items-center gap-3 border-b border-black/[0.06] px-4 py-3.5">
              <Search size={18} className="shrink-0 text-[var(--color-text-tertiary)]" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={handleKey}
                placeholder="搜尋影片、單字、文章…"
                className="flex-1 bg-transparent text-[15px] outline-none placeholder:text-[var(--color-text-tertiary)]"
              />
              {query && (
                <button type="button" onClick={() => setQuery('')}
                  className="rounded-full p-1 text-[var(--color-text-tertiary)] hover:bg-black/5">
                  <X size={15} />
                </button>
              )}
              <kbd className="hidden rounded-lg bg-black/[0.06] px-2 py-1 font-mono text-[10px] text-[var(--color-text-tertiary)] sm:block">
                ESC
              </kbd>
            </div>

            {/* 結果 / 最近 */}
            <div className="max-h-[420px] overflow-y-auto">
              {!query && recent.length > 0 && (
                <div className="px-4 pt-3 pb-1">
                  <div className="mb-2 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)]">
                    <Clock size={11} /> 最近搜尋
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {recent.map(r => (
                      <button key={r} type="button"
                        onClick={() => setQuery(r)}
                        className="rounded-full bg-black/[0.04] px-3 py-1 text-xs text-[var(--color-text-secondary)] hover:bg-[#5B5BF0]/10 hover:text-[#5B5BF0]">
                        {r}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {!query && (
                <div className="px-4 pt-3 pb-2">
                  <div className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)]">
                    快速跳轉
                  </div>
                  {[
                    { href: '/learn/videos', label: '影片學習', icon: <PlayCircle size={14} /> },
                    { href: '/learn/vocab', label: '我的單字本', icon: <BookOpen size={14} /> },
                    { href: '/quiz', label: '測驗中心', icon: <FileText size={14} /> },
                    { href: '/ai/chat', label: 'AI 對話練習', icon: <Search size={14} /> },
                  ].map(item => (
                    <button key={item.href} type="button" onClick={() => go(item.href)}
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm hover:bg-black/[0.04]">
                      <span className="text-[#5B5BF0]">{item.icon}</span>
                      {item.label}
                    </button>
                  ))}
                </div>
              )}

              {query && results.length === 0 && (
                <div className="py-10 text-center text-sm text-[var(--color-text-tertiary)]">
                  找不到「{query}」的相關結果
                </div>
              )}

              {results.length > 0 && (
                <div className="px-2 py-2">
                  {results.map((r, i) => (
                    <button key={r.id + r.type} type="button"
                      onClick={() => go(r.href)}
                      className={`flex w-full items-start gap-3 rounded-xl px-3 py-2.5 text-left transition ${
                        i === cursor ? 'bg-[#5B5BF0]/10' : 'hover:bg-black/[0.04]'
                      }`}
                    >
                      <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-black/[0.04]">
                        {typeIcon(r.type)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="truncate text-sm font-semibold">{r.title}</span>
                          <span className="shrink-0 rounded-full bg-black/[0.04] px-1.5 py-0.5 text-[10px] text-[var(--color-text-tertiary)]">
                            {typeLabel(r.type)}
                          </span>
                        </div>
                        <div className="mt-0.5 truncate text-xs text-[var(--color-text-tertiary)]">
                          {r.subtitle}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* 底部提示 */}
              <div className="border-t border-black/[0.04] px-4 py-2 text-[10px] text-[var(--color-text-tertiary)]">
                ↑↓ 選擇 · Enter 跳轉 · ESC 關閉
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
