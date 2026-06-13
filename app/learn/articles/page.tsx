'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Clock, BookOpen, Sparkles, Filter, Loader2, Bookmark, BookmarkCheck } from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';
import SoftButton from '@/components/ui/SoftButton';
import { mockArticles } from '@/lib/mockArticles';
import type { Article } from '@/lib/types';
import type { CEFRLevel } from '@/lib/types';
import { getSavedIds, toggleSaveArticle } from '@/lib/storage/article-actions';

const catColor: Record<string, string> = {
  Culture: 'from-[#FFB84D] to-[#FF6B6B]',
  Science: 'from-[#06B6D4] to-[#3B82F6]',
  Business: 'from-[#8B5CF6] to-[#7C3AED]',
  Daily: 'from-[#10B981] to-[#059669]',
  News: 'from-[#6366F1] to-[#4F46E5]',
  Story: 'from-[#F59E0B] to-[#D97706]',
};

const levelColor: Record<string, string> = {
  A1: 'bg-[#4ADE80]/20 text-[#15803d]',
  A2: 'bg-[#4ADE80]/20 text-[#15803d]',
  B1: 'bg-[#60A5FA]/20 text-[#1d4ed8]',
  B2: 'bg-[#818CF8]/20 text-[#4338ca]',
  C1: 'bg-[#F87171]/20 text-[#b91c1c]',
};

type GenStatus = 'idle' | 'generating' | 'done';

const AI_TOPICS = [
  { label: '商務會議', level: 'B1', category: 'Business', prompt: 'Write a 200-word B1 article about preparing for a business meeting in English. Include 3 paragraphs.' },
  { label: '旅遊英文', level: 'A2', category: 'Daily', prompt: 'Write a 150-word A2 article about traveling to a new city and asking for directions. Include 3 paragraphs.' },
  { label: '科技趨勢', level: 'B2', category: 'Science', prompt: 'Write a 250-word B2 article about how artificial intelligence is changing daily life. Include 3 paragraphs.' },
  { label: '健康生活', level: 'A2', category: 'Daily', prompt: 'Write a 150-word A2 article about the importance of exercise and sleep for good health. Include 3 paragraphs.' },
  { label: '環境保護', level: 'B1', category: 'Science', prompt: 'Write a 200-word B1 article about small steps individuals can take to protect the environment. Include 3 paragraphs.' },
];

interface GeneratedArticle extends Omit<Article, 'timestamps' | 'audioUrl'> {
  generated?: boolean;
}

const STORAGE_KEY = 'readle.generated_articles';

function loadGenerated(): GeneratedArticle[] {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]') as GeneratedArticle[]; }
  catch { return []; }
}

export default function ArticlesPage() {
  const [levelFilter, setLevelFilter] = useState<CEFRLevel | 'all'>('all');
  const [savedOnly, setSavedOnly] = useState(false);
  const [allArticles, setAllArticles] = useState<(Article | GeneratedArticle)[]>(mockArticles);
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [genStatus, setGenStatus] = useState<GenStatus>('idle');
  const [genTopic, setGenTopic] = useState('');

  useEffect(() => {
    const gen = loadGenerated();
    if (gen.length > 0) setAllArticles([...mockArticles, ...gen]);
    setSavedIds(getSavedIds());
  }, []);

  const handleToggleSave = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    toggleSaveArticle(id);
    setSavedIds(getSavedIds());
  };

  const filtered = allArticles.filter(a => {
    if (levelFilter !== 'all' && a.level !== levelFilter) return false;
    if (savedOnly && !savedIds.includes(a.id)) return false;
    return true;
  });

  const generateArticle = async (topic: typeof AI_TOPICS[0]) => {
    setGenStatus('generating');
    setGenTopic(topic.label);
    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{
            role: 'user',
            content: `${topic.prompt}

Return ONLY a JSON object with this structure:
{
  "title": "Article Title",
  "titleZh": "中文標題",
  "paragraphs": [["sentence1", "sentence2", "sentence3"], ["sentence4", "sentence5", "sentence6"], ["sentence7", "sentence8", "sentence9"]],
  "keyVocabulary": [{"word": "...", "def": "English definition", "zh": "中文意思", "example": "..."}],
  "quizzes": [{"id": "q1", "question": "...", "options": ["A","B","C"], "correctAnswerIndex": 0, "explanation": "..."}]
}
Include 3 vocabulary items and 2 quiz questions.`,
          }],
          temperature: 0.7,
          maxTokens: 2000,
          jsonMode: true,
        }),
      });
      const data = await res.json() as { content?: string };
      const parsed = JSON.parse(data.content ?? '{}') as {
        title?: string; titleZh?: string;
        paragraphs?: string[][];
        keyVocabulary?: { word: string; def: string; zh?: string; example: string }[];
        quizzes?: Article['quizzes'];
      };

      const newArt: GeneratedArticle = {
        id: `gen-${Date.now()}`,
        title: parsed.title ?? topic.label,
        level: topic.level as CEFRLevel,
        category: topic.category as Article['category'],
        coverImage: `https://source.unsplash.com/featured/800x400/?${encodeURIComponent(topic.label)}`,
        readingMinutes: 3,
        paragraphs: parsed.paragraphs ?? [],
        keyVocabulary: (parsed.keyVocabulary ?? []).map(v => ({
          word: v.word, def: v.def + (v.zh ? ` (${v.zh})` : ''), example: v.example,
        })),
        grammarNotes: [],
        quizzes: parsed.quizzes ?? [],
        generated: true,
      };

      const updated = loadGenerated();
      updated.push(newArt);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      setAllArticles([...mockArticles, ...updated]);
      setGenStatus('done');
    } catch {
      setGenStatus('idle');
    }
  };

  const levels: (CEFRLevel | 'all')[] = ['all', 'A2', 'B1', 'B2'];

  return (
    <div className="space-y-6">
      <header className="px-1">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">文章閱讀</h1>
        <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
          短篇英文文章 · 點字查詞 · 語音朗讀 · 閱讀測驗
        </p>
      </header>

      {/* 篩選 */}
      <div className="flex flex-wrap items-center gap-2 px-1">
        <Filter size={14} className="text-[var(--color-text-tertiary)]" />
        {levels.map(l => (
          <button key={l} type="button" onClick={() => setLevelFilter(l)}
            className={`h-8 rounded-full px-3 text-xs font-medium transition ${
              levelFilter === l
                ? 'bg-gradient-to-r from-[#7C7CFF] to-[#5B5BF0] text-white shadow-card'
                : 'bg-white/50 text-[var(--color-text-secondary)] ring-1 ring-inset ring-black/5 hover:bg-white/70'
            }`}>
            {l === 'all' ? '全部' : l}
          </button>
        ))}
        {/* 已收藏篩選 */}
        <button type="button" onClick={() => setSavedOnly(v => !v)}
          className={`inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-xs font-medium transition ${
            savedOnly
              ? 'bg-gradient-to-r from-[#FFB84D] to-[#FF9A1F] text-white shadow-card'
              : 'bg-white/50 text-[var(--color-text-secondary)] ring-1 ring-inset ring-black/5 hover:bg-white/70'
          }`}>
          <Bookmark size={11} fill={savedOnly ? 'white' : 'none'} /> 已收藏 {savedIds.length > 0 && `(${savedIds.length})`}
        </button>
      </div>

      {/* 文章卡片 */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map(article => (
          <Link key={article.id} href={`/learn/articles/${article.id}`} className="group">
            <GlassCard className="h-full overflow-hidden p-0 transition group-hover:shadow-hover">
              <div className="relative h-36 overflow-hidden">
                {article.coverImage ? (
                  <img src={article.coverImage} alt={article.title}
                    className="h-full w-full object-cover transition group-hover:scale-105" />
                ) : (
                  <div className={`h-full w-full bg-gradient-to-br ${catColor[article.category] ?? 'from-[#7C7CFF] to-[#5B5BF0]'}`} />
                )}
                {/* 漸層遮罩 */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                <div className="absolute bottom-2 left-3 right-3 flex items-center justify-between">
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${levelColor[article.level] ?? 'bg-white/20 text-white'}`}>
                    {article.level}
                  </span>
                  <span className="rounded-full bg-black/40 px-2 py-0.5 font-mono text-[10px] text-white backdrop-blur-sm">
                    {article.readingMinutes} min
                  </span>
                </div>
                {/* 收藏按鈕 */}
                <button
                  type="button"
                  onClick={e => handleToggleSave(e, article.id)}
                  className={`absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full backdrop-blur-sm transition hover:scale-110 ${
                    savedIds.includes(article.id)
                      ? 'bg-[#FFB84D] text-white shadow-card'
                      : 'bg-black/30 text-white hover:bg-[#FFB84D]'
                  }`}
                  title={savedIds.includes(article.id) ? '取消收藏' : '收藏文章'}
                >
                  {savedIds.includes(article.id)
                    ? <BookmarkCheck size={15} />
                    : <Bookmark size={15} />}
                </button>
                {'generated' in article && (article as GeneratedArticle).generated && (
                  <div className="absolute left-2 top-2 rounded-full bg-[#5B5BF0] px-2 py-0.5 text-[10px] font-bold text-white">
                    AI
                  </div>
                )}
              </div>
              <div className="p-4">
                <div className="mb-1 flex items-center gap-1.5">
                  <span className={`inline-flex items-center gap-1 rounded-full bg-gradient-to-r ${catColor[article.category] ?? 'from-[#7C7CFF] to-[#5B5BF0]'} px-2 py-0.5 text-[10px] font-bold text-white`}>
                    {article.category}
                  </span>
                </div>
                <h3 className="font-bold leading-snug line-clamp-2">{article.title}</h3>
                <div className="mt-2 flex items-center gap-3 text-xs text-[var(--color-text-tertiary)]">
                  <span className="inline-flex items-center gap-1">
                    <Clock size={11} /> {article.readingMinutes} 分鐘
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <BookOpen size={11} /> {article.quizzes.length} 題測驗
                  </span>
                </div>
              </div>
            </GlassCard>
          </Link>
        ))}
      </div>

      {/* AI 生成文章 */}
      <GlassCard className="p-5">
        <div className="mb-3 flex items-center gap-2">
          <Sparkles size={16} className="text-[#5B5BF0]" />
          <h2 className="font-bold">AI 生成新文章</h2>
          <span className="text-xs text-[var(--color-text-tertiary)]">自動生成含單字 + 測驗的短文</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {AI_TOPICS.map(t => (
            <button key={t.label} type="button"
              onClick={() => generateArticle(t)}
              disabled={genStatus === 'generating'}
              className={`inline-flex h-9 items-center gap-1.5 rounded-xl px-3.5 text-sm font-medium transition ${
                genStatus === 'generating' && genTopic === t.label
                  ? 'bg-[#5B5BF0] text-white shadow-card'
                  : 'bg-white/60 text-[var(--color-text-primary)] ring-1 ring-inset ring-black/5 hover:bg-[#5B5BF0]/10 hover:text-[#5B5BF0] disabled:opacity-40'
              }`}>
              {genStatus === 'generating' && genTopic === t.label ? (
                <><Loader2 size={13} className="animate-spin" /> 生成中…</>
              ) : (
                <><Sparkles size={13} /> {t.label} <span className="text-[10px] opacity-60">{t.level}</span></>
              )}
            </button>
          ))}
        </div>
        {genStatus === 'done' && (
          <p className="mt-2 text-xs text-[#15803d]">✅ 新文章已加入列表！</p>
        )}
      </GlassCard>
    </div>
  );
}
