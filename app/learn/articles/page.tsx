'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Clock, BookOpen, Sparkles, Filter, Loader2, Bookmark, BookmarkCheck, CheckCircle2 } from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';
import SoftButton from '@/components/ui/SoftButton';
import { mockArticles } from '@/lib/mockArticles';
import type { Article } from '@/lib/types';
import type { CEFRLevel } from '@/lib/types';
import { getSavedIds, toggleSaveArticle, getReadIds } from '@/lib/storage/article-actions';
import { toast } from '@/lib/toast';
import { articleCover } from '@/lib/article-image';

const catColor: Record<string, string> = {
  Culture: 'from-[#FFB84D] to-[#FF6B6B]',
  Science: 'from-[#06B6D4] to-[#3B82F6]',
  Business: 'from-[#8B5CF6] to-[#7C3AED]',
  Daily: 'from-[#10B981] to-[#059669]',
  News: 'from-[#6366F1] to-[#4F46E5]',
  Story: 'from-[#F59E0B] to-[#D97706]',
};

const catLabel: Record<string, string> = {
  Culture: '文化', Science: '科學', Business: '商業',
  Daily: '日常', News: '新聞', Story: '故事',
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
  // 商業 / 職場
  { label: '商務會議', level: 'B1', category: 'Business', prompt: 'preparing for and running an effective business meeting (agenda, roles, follow-up)' },
  { label: '職場 Email', level: 'B1', category: 'Business', prompt: 'writing clear and polite professional emails at work, with useful phrases and etiquette' },
  { label: '求職面試', level: 'B2', category: 'Business', prompt: 'succeeding in an English job interview: common questions, the STAR method, and confidence tips' },
  { label: '簡報技巧', level: 'B2', category: 'Business', prompt: 'giving a confident, well-structured business presentation in English' },
  { label: '投資理財', level: 'B2', category: 'Business', prompt: 'basic personal investing: stocks, diversification, compound interest, and long-term thinking' },

  // 日常生活
  { label: '旅遊英文', level: 'A2', category: 'Daily', prompt: 'traveling to a new city: asking for directions, transport, and useful traveler phrases' },
  { label: '餐廳點餐', level: 'A2', category: 'Daily', prompt: 'ordering food at a restaurant in English, from booking a table to paying the bill' },
  { label: '購物英文', level: 'A1', category: 'Daily', prompt: 'shopping for clothes: asking about price, size, color, and trying things on (use simple sentences)' },
  { label: '看醫生', level: 'A2', category: 'Daily', prompt: 'visiting a doctor: describing symptoms, understanding advice, and getting medicine' },
  { label: '電話英文', level: 'B1', category: 'Daily', prompt: 'making and answering phone calls in English, with polite phrases and how to leave a message' },
  { label: '健康生活', level: 'A2', category: 'Daily', prompt: 'building a healthy lifestyle through exercise, sleep, and balanced eating' },

  // 科學 / 自我成長
  { label: '科技趨勢', level: 'B2', category: 'Science', prompt: 'how artificial intelligence is changing daily life, work, and education' },
  { label: '環境保護', level: 'B1', category: 'Science', prompt: 'practical steps individuals can take to protect the environment in everyday life' },
  { label: '習慣養成', level: 'B2', category: 'Science', prompt: 'the science of building good habits and breaking bad ones (cues, routines, rewards)' },
  { label: '太空探索', level: 'B2', category: 'Science', prompt: 'recent space exploration and why humans want to reach the Moon and Mars' },

  // 文化 / 故事
  { label: '咖啡文化', level: 'A2', category: 'Culture', prompt: 'coffee culture around the world and how different countries enjoy their coffee' },
  { label: '美國節慶', level: 'B1', category: 'Culture', prompt: 'popular American holidays and how people celebrate them, with their history' },
  { label: '名人故事', level: 'B1', category: 'Story', prompt: 'an inspiring short biography of a famous person and the lessons we can learn from their life' },
  { label: '新聞時事', level: 'C1', category: 'News', prompt: 'a current global trend or issue, discussed with nuanced, sophisticated vocabulary' },
];

interface GeneratedArticle extends Omit<Article, 'timestamps' | 'audioUrl'> {
  generated?: boolean;
}

const STORAGE_KEY = 'readle.generated_articles';

function loadGenerated(): GeneratedArticle[] {
  try {
    const all = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]') as GeneratedArticle[];
    // 過濾掉舊版本存到的空文章（沒有正文）
    const valid = all.filter(a => Array.isArray(a.paragraphs) && a.paragraphs.flat().length > 0);
    if (valid.length !== all.length) localStorage.setItem(STORAGE_KEY, JSON.stringify(valid));
    return valid;
  } catch { return []; }
}

export default function ArticlesPage() {
  const [levelFilter, setLevelFilter] = useState<CEFRLevel | 'all'>('all');
  const [savedOnly, setSavedOnly] = useState(false);
  const [catFilter, setCatFilter] = useState<string>('all');
  const [allArticles, setAllArticles] = useState<(Article | GeneratedArticle)[]>(mockArticles);
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [readIds, setReadIds] = useState<string[]>([]);
  const [genStatus, setGenStatus] = useState<GenStatus>('idle');
  const [genTopic, setGenTopic] = useState('');

  useEffect(() => {
    const gen = loadGenerated();
    if (gen.length > 0) setAllArticles([...mockArticles, ...gen]);
    setSavedIds(getSavedIds());
    setReadIds(getReadIds());
  }, []);

  const handleToggleSave = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    const saved = toggleSaveArticle(id);
    setSavedIds(getSavedIds());
    toast(saved ? '已加入收藏 🔖' : '已取消收藏');
  };

  // 出現過的主題（給篩選用）
  const categories = ['all', ...Array.from(new Set(allArticles.map(a => a.category)))];

  const filtered = allArticles.filter(a => {
    if (levelFilter !== 'all' && a.level !== levelFilter) return false;
    if (catFilter !== 'all' && a.category !== catFilter) return false;
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
            content: `Write a detailed English reading article for ${topic.level}-level learners about: ${topic.prompt}.

LENGTH REQUIREMENTS (important — this is a reading lesson, not a summary):
- 500 to 700 words total.
- 6 to 8 paragraphs, each paragraph 4 to 6 complete sentences.
- Natural, engaging, and educational; use vocabulary suitable for ${topic.level} level.

Return ONLY a JSON object with this structure:
{
  "title": "Article Title",
  "titleZh": "中文標題",
  "imageKeyword": "2 English nouns describing a photo scene for this article, comma-separated (e.g. restaurant,food)",
  "paragraphs": [["sentence1", "sentence2", "sentence3", "sentence4"], ["..."], ["..."], ["..."], ["..."], ["..."]],
  "keyVocabulary": [{"word": "...", "pos": "詞性縮寫（n./v./adj./adv./prep. 等）", "def": "English definition", "zh": "中文意思", "usage": "繁體中文一句說明用法或常見搭配", "example": "..."}],
  "grammarNotes": [{"title": "文法重點名稱（如 Present Continuous）", "body": "繁體中文解釋 + 從文章中舉一個例子"}],
  "quizzes": [{"id": "q1", "question": "...", "options": ["A","B","C","D"], "correctAnswerIndex": 0, "explanation": "..."}]
}
"paragraphs" must be an array of 6-8 paragraphs; each paragraph is an array of its sentence strings.
Include 6 vocabulary items, 2-3 grammarNotes (用繁體中文解釋，貼合 ${topic.level} 程度), and 4 quiz questions.`,
          }],
          temperature: 0.7,
          maxTokens: 6000,
          jsonMode: true,
        }),
      });

      // API 錯誤（502/503/429 等）→ 不要存空文章
      if (!res.ok) throw new Error('AI 暫時無法生成，請稍後再試');
      const data = await res.json() as { content?: string; error?: string };
      const raw = (data.content ?? '').trim();
      if (!raw) throw new Error('AI 回傳空白，請再試一次');

      // 抽出 JSON（去除可能的 ```json 圍欄）
      const jsonText = (raw.match(/\{[\s\S]*\}/)?.[0]) ?? raw;
      const parsed = JSON.parse(jsonText) as {
        title?: string; titleZh?: string; imageKeyword?: string;
        paragraphs?: unknown;
        keyVocabulary?: { word: string; pos?: string; def: string; zh?: string; usage?: string; example: string }[];
        grammarNotes?: { title: string; body: string }[];
        quizzes?: Article['quizzes'];
      };

      // 正規化 paragraphs：支援 string[][]（標準）或 string[]（每段一字串 → 切句）
      const normParagraphs = (p: unknown): string[][] => {
        if (!Array.isArray(p)) return [];
        return p
          .map(para => Array.isArray(para)
            ? para.map(String).filter(s => s.trim())
            : String(para).split(/(?<=[.!?])\s+/).map(s => s.trim()).filter(Boolean))
          .filter(arr => arr.length > 0);
      };
      const paragraphs = normParagraphs(parsed.paragraphs);

      // 沒有正文 → 視為失敗，不要存空文章
      if (paragraphs.length === 0) throw new Error('生成的文章沒有內容，請再試一次');

      const artId = `gen-${Date.now()}`;
      const newArt: GeneratedArticle = {
        id: artId,
        title: parsed.title ?? topic.label,
        level: topic.level as CEFRLevel,
        category: topic.category as Article['category'],
        coverImage: articleCover({ id: artId, title: parsed.title ?? topic.label, imageKeyword: parsed.imageKeyword }),
        readingMinutes: Math.max(1, Math.round(paragraphs.flat().length / 8)),
        paragraphs,
        keyVocabulary: (parsed.keyVocabulary ?? []).map(v => ({
          word: v.word, pos: v.pos, def: v.def + (v.zh ? ` (${v.zh})` : ''), usage: v.usage, example: v.example,
        })),
        grammarNotes: (parsed.grammarNotes ?? []).filter(g => g?.title && g?.body),
        quizzes: parsed.quizzes ?? [],
        generated: true,
      };

      const updated = loadGenerated();
      updated.push(newArt);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      setAllArticles([...mockArticles, ...updated]);
      setGenStatus('done');
    } catch (e) {
      setGenStatus('idle');
      alert(e instanceof Error ? e.message : 'AI 生成失敗，請再試一次');
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

      {/* 主題篩選 */}
      <div className="flex flex-wrap items-center gap-2 px-1">
        <span className="text-xs text-[var(--color-text-tertiary)]">主題</span>
        {categories.map(c => (
          <button key={c} type="button" onClick={() => setCatFilter(c)}
            className={`h-8 rounded-full px-3 text-xs font-medium transition ${
              catFilter === c
                ? 'bg-[#5B5BF0] text-white shadow-card'
                : 'bg-white/50 text-[var(--color-text-secondary)] ring-1 ring-inset ring-black/5 hover:bg-white/70'
            }`}>
            {c === 'all' ? '全部' : (catLabel[c] ?? c)}
          </button>
        ))}
      </div>

      {/* 文章卡片 */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map(article => (
          <Link key={article.id} href={`/learn/articles/${article.id}`} className="group" data-no-lookup>
            <GlassCard className="h-full overflow-hidden p-0 transition group-hover:shadow-hover">
              <div className="relative h-36 overflow-hidden">
                {/* 漸層底（圖載入失敗時露出）*/}
                <div className={`absolute inset-0 bg-gradient-to-br ${catColor[article.category] ?? 'from-[#7C7CFF] to-[#5B5BF0]'}`} />
                <img src={articleCover(article)} alt={article.title} loading="lazy"
                  className="relative h-full w-full object-cover transition group-hover:scale-105"
                  onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                {/* 漸層遮罩 */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                <div className="absolute bottom-2 left-3 right-3 flex items-center justify-between">
                  <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-extrabold text-[#2A2440] shadow-card">
                    {article.level}
                  </span>
                  <span className="rounded-full bg-black/45 px-2 py-0.5 font-mono text-[10px] text-white backdrop-blur-sm">
                    {article.readingMinutes} min
                  </span>
                </div>
                {/* 已讀標記 */}
                {readIds.includes(article.id) && (
                  <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-[#4ADE80] px-2 py-0.5 text-[10px] font-bold text-white shadow-card">
                    <CheckCircle2 size={11} /> 已讀
                  </span>
                )}
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
