'use client';

import { use, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, BookOpen, CheckCircle2, XCircle,
  ChevronRight, Loader2, Clock, RotateCcw,
  Bookmark, BookmarkCheck, Volume2
} from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';
import ArticlePlayer, { type DisplayMode } from '@/components/article/ArticlePlayer';
import ArticleQuizAI from '@/components/article/ArticleQuizAI';
import WordPopup from '@/components/video/WordPopup';
import { mockArticles } from '@/lib/mockArticles';
import type { Article } from '@/lib/types';
import { speak, prefetchAll } from '@/lib/speech/tts';
import { addWord, findWord } from '@/lib/storage/vocab-actions';
import { isArticleSaved, toggleSaveArticle, markArticleRead } from '@/lib/storage/article-actions';
import { toast } from '@/lib/toast';
import { articleCover } from '@/lib/article-image';
import { lookupBuiltin } from '@/lib/dictionary/builtin';
import { translateToZh, batchTranslateSentences } from '@/lib/dictionary/lookup';
import { ensureEnrichment, needsEnrichment, type Enrichment } from '@/lib/article-enrich';

const STORAGE_KEY = 'readle.generated_articles';
type GeneratedArticle = Omit<Article, 'timestamps' | 'audioUrl'> & { generated?: boolean };

const levelColor: Record<string, string> = {
  A1: 'bg-[#4ADE80]/20 text-[#15803d]',
  A2: 'bg-[#4ADE80]/20 text-[#15803d]',
  B1: 'bg-[#60A5FA]/20 text-[#1d4ed8]',
  B2: 'bg-[#818CF8]/20 text-[#4338ca]',
  C1: 'bg-[#F87171]/20 text-[#b91c1c]',
};

interface WordTip { word: string; zh: string; x: number; y: number }

export default function ArticlePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  const [article, setArticle] = useState<Article | GeneratedArticle | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [saved, setSaved] = useState(false);
  const [activeSentenceIdx, setActiveSentenceIdx] = useState(-1);
  const [displayMode, setDisplayMode] = useState<DisplayMode>('en');
  const [zhSentences, setZhSentences] = useState<string[]>([]);
  const [translating, setTranslating] = useState(false);
  const [wordTip, setWordTip] = useState<WordTip | null>(null);
  const [lookupWord, setLookupWord] = useState<{ word: string; context: string } | null>(null);
  const [quizOpen, setQuizOpen] = useState(false);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [enrich, setEnrich] = useState<Enrichment | null>(null);
  const [enrichLoading, setEnrichLoading] = useState(false);
  const sentenceRefs = useRef<(HTMLSpanElement | null)[]>([]);

  // 從 mockArticles 或 localStorage 取文章（全在 client side）
  useEffect(() => {
    const found = mockArticles.find(a => a.id === id);
    if (found) { setArticle(found); setSaved(isArticleSaved(id)); markArticleRead(id); return; }
    try {
      if (typeof window === 'undefined') return;
      const gen = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? '[]') as GeneratedArticle[];
      const genFound = gen.find(a => a.id === id);
      if (genFound) { setArticle(genFound); setSaved(isArticleSaved(id)); markArticleRead(id); return; }
    } catch { /* ignore */ }
    setNotFound(true);
  }, [id]);

  // 預先快取重點單字 + 例句音檔
  useEffect(() => {
    if (!article) return;
    const texts = article.keyVocabulary.flatMap(v => [v.word, ...(v.example ? [v.example] : [])]);
    if (texts.length) prefetchAll(texts);
  }, [article]);

  // 補強：缺文法 / 單字缺詞性 → 補上並快取（詞性免費；文法用 Gemini best-effort）
  useEffect(() => {
    setEnrich(null);
    setEnrichLoading(false);
    if (!article || !needsEnrichment(article)) return;
    let alive = true;
    setEnrichLoading(true);
    ensureEnrichment(article).then(e => { if (alive) { setEnrich(e); setEnrichLoading(false); } });
    return () => { alive = false; };
  }, [article]);

  const regenGrammar = async () => {
    if (!article) return;
    setEnrichLoading(true);
    const e = await ensureEnrichment(article, true);
    setEnrich(e);
    setEnrichLoading(false);
    if (!e?.grammarNotes.length) toast('AI 配額用完了，晚點再試 🙏');
  };

  // 高亮句子自動捲動
  useEffect(() => {
    if (activeSentenceIdx < 0) return;
    sentenceRefs.current[activeSentenceIdx]?.scrollIntoView({
      behavior: 'smooth', block: 'center',
    });
  }, [activeSentenceIdx]);

  if (notFound) {
    return (
      <div className="py-20 text-center">
        <div className="mb-3 text-4xl">🔍</div>
        <p className="text-sm text-[var(--color-text-tertiary)]">找不到這篇文章</p>
        <Link href="/learn/articles" className="mt-4 inline-block text-sm text-[#5B5BF0] hover:underline">
          回到文章列表
        </Link>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="flex h-60 items-center justify-center">
        <Loader2 size={22} className="animate-spin text-[#5B5BF0]" />
      </div>
    );
  }

  // 內容生成失敗（空文章）→ 提示重新生成，不要顯示空白
  if (!article.paragraphs || article.paragraphs.flat().length === 0) {
    return (
      <div className="py-20 text-center">
        <div className="mb-3 text-4xl">📄</div>
        <p className="text-sm text-[var(--color-text-tertiary)]">這篇文章內容生成失敗（沒有正文）</p>
        <Link href="/learn/articles" className="mt-4 inline-block text-sm text-[#5B5BF0] hover:underline">
          回文章列表重新生成一篇
        </Link>
      </div>
    );
  }

  // 展平句子
  const allSentences: string[] = [];
  const paragraphBoundaries: number[] = [];
  article.paragraphs.forEach(para => {
    paragraphBoundaries.push(allSentences.length);
    para.forEach(s => allSentences.push(s));
  });

  // 點句跳轉
  const handleSentenceClick = (globalIdx: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('article:jump', { detail: { idx: globalIdx } }));
    }
  };

  // Hover 查字（只顯示翻譯泡泡，不自動發音）
  const handleWordHover = async (word: string, e: React.MouseEvent) => {
    const cleaned = word.replace(/[^\w'-]/g, '');
    if (cleaned.length < 4) return;
    e.stopPropagation();
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    setWordTip({ word: cleaned, zh: '…', x: rect.left, y: rect.bottom + 8 });
    // 不自動發音 — 使用者可在泡泡出現後點擊單字來聽

    const builtin = lookupBuiltin(cleaned);
    if (builtin?.zh) { setWordTip(t => t ? { ...t, zh: builtin.zh } : null); return; }
    const zh = await translateToZh(cleaned);
    setWordTip(t => t?.word === cleaned ? { ...t, zh: zh || cleaned } : t);
  };

  const addToVocab = (word: string, def: string) => {
    if (findWord(word)) return;
    addWord({ word, meaning: def, partOfSpeech: '', source: 'article' });
  };

  /** 中英切換：首次切到「中英」時批次翻譯所有句子 */
  const handleModeChange = async (mode: DisplayMode) => {
    setDisplayMode(mode);
    if (mode !== 'both' || translating) return;
    if (zhSentences.length >= allSentences.length) return; // 已翻譯完

    // 快取命中（這篇之前翻過）→ 瞬間顯示、零 API
    const CACHE_KEY = `readle.article_zh:${id}`;
    try {
      const cached = JSON.parse(window.localStorage.getItem(CACHE_KEY) ?? 'null') as string[] | null;
      if (cached && cached.length === allSentences.length && cached.every(Boolean)) {
        setZhSentences(cached);
        return;
      }
    } catch { /* 快取壞了就重翻 */ }

    setTranslating(true);

    // Step 1：先用內建字典給關鍵字提示（瞬間顯示）
    const initZh = allSentences.map(sentence => {
      const words = sentence.split(/\s+/);
      const known = words
        .map(w => ({ w, b: lookupBuiltin(w.replace(/[^\w'-]/g, '')) }))
        .filter(x => x.b?.zh)
        .slice(0, 2)
        .map(x => x.b!.zh.split('；')[0]);
      return known.length > 0 ? `（${known.join('、')}）` : '…';
    });
    setZhSentences(initZh);

    // Step 2：Google 翻譯（→ 缺漏 Gemini 補），即時更新
    const finalZh = [...initZh];
    try {
      await batchTranslateSentences(allSentences, (startIdx, results) => {
        results.forEach((t, relIdx) => { if (t) finalZh[startIdx + relIdx] = t; });
        setZhSentences([...finalZh]);
      });
      // 全數翻完 → 寫快取，下次瞬間
      if (finalZh.length === allSentences.length && finalZh.every(Boolean)) {
        window.localStorage.setItem(CACHE_KEY, JSON.stringify(finalZh));
      }
    } catch { /* 保留關鍵字提示 */ }
    setTranslating(false);
  };

  const score = article.quizzes.filter(q => answers[q.id] === q.correctAnswerIndex).length;

  // 渲染句子（可點擊跳轉 + hover 查字 + 選擇性顯示中文）
  const renderSentence = (sentence: string, globalIdx: number) => {
    const isActive = activeSentenceIdx === globalIdx;
    const zh = zhSentences[globalIdx] ?? '';
    const showZh = displayMode === 'both';

    return (
      <span
        key={globalIdx}
        ref={el => { sentenceRefs.current[globalIdx] = el; }}
        onClick={(e) => handleSentenceClick(globalIdx, e)}
        className={`inline-block cursor-pointer rounded-lg px-1 py-0.5 transition-colors duration-150 ${
          isActive
            ? 'bg-[#5B5BF0]/12 underline decoration-[#5B5BF0]/40 decoration-2 underline-offset-2'
            : 'hover:bg-[#FFB84D]/10'
        }`}
      >
        {/* 英文 */}
        <span className={isActive ? 'text-[#5B5BF0]' : ''}>
          {sentence.split(/(\s+)/).map((tok, ti) => {
            if (/^\s+$/.test(tok)) return <span key={ti}>{tok}</span>;
            const clean = tok.replace(/[^\w'-]/g, '');
            if (clean.length < 4) return <span key={ti}>{tok}</span>;
            return (
              <span key={ti}
                onMouseEnter={e => { e.stopPropagation(); handleWordHover(tok, e); }}
                onMouseLeave={() => setWordTip(null)}
                onClick={e => {
                  e.stopPropagation(); // 不要觸發整句朗讀
                  setWordTip(null);
                  setLookupWord({ word: clean, context: sentence });
                }}
                className="cursor-pointer rounded px-0.5 hover:bg-[#5B5BF0]/10 hover:text-[#5B5BF0]"
              >{tok}</span>
            );
          })}
        </span>
        {/* 中文（中英模式才顯示）*/}
        {showZh && (
          <span className={`ml-1 text-sm ${zh ? 'text-[var(--color-text-tertiary)]' : 'text-[var(--color-text-tertiary)] opacity-40'}`}>
            {zh || (translating ? '…' : '')}
          </span>
        )}
        {' '}
      </span>
    );
  };

  let globalIdxCounter = 0;
  const renderParagraphs = () =>
    article.paragraphs.map((para, pi) => (
      <p key={pi} className="mb-5 text-[17px] leading-[2.0] text-[var(--color-text-primary)]">
        {para.map(sentence => {
          const idx = globalIdxCounter++;
          return renderSentence(sentence, idx);
        })}
      </p>
    ));

  return (
    <div className="mx-auto max-w-2xl space-y-5" onClick={() => setWordTip(null)}>
      <Link href="/learn/articles"
        className="inline-flex items-center gap-1 text-sm text-[var(--color-text-secondary)] hover:text-[#5B5BF0]">
        <ArrowLeft size={14} /> 回到文章列表
      </Link>

      {/* 封面 + 標題 */}
      <GlassCard className="overflow-hidden p-0">
        <div className="relative h-48 w-full overflow-hidden sm:h-56">
          <div className="absolute inset-0 bg-gradient-to-br from-[#7C7CFF] to-[#5B5BF0]" />
          <img src={articleCover(article)} alt={article.title}
            className="relative h-full w-full object-cover"
            onError={(e) => { e.currentTarget.style.display = 'none'; }} />
        </div>
        <div className="p-5 sm:p-6">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${levelColor[article.level] ?? ''}`}>
              {article.level}
            </span>
            <span className="rounded-full bg-[#5B5BF0]/10 px-2.5 py-0.5 text-xs font-bold text-[#5B5BF0]">
              {article.category}
            </span>
            <span className="inline-flex items-center gap-1 text-xs text-[var(--color-text-tertiary)]">
              <Clock size={11} /> {article.readingMinutes} min
            </span>
            {'generated' in article && (article as GeneratedArticle).generated && (
              <span className="rounded-full bg-gradient-to-r from-[#7C7CFF] to-[#5B5BF0] px-2 py-0.5 text-[10px] font-bold text-white">
                AI 生成
              </span>
            )}
          </div>
          <div className="flex items-start justify-between gap-3">
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{article.title}</h1>
            <button
              type="button"
              onClick={() => { const next = toggleSaveArticle(article.id); setSaved(next); toast(next ? '已加入收藏 🔖' : '已取消收藏'); }}
              className={`shrink-0 mt-1 flex h-10 w-10 items-center justify-center rounded-full transition hover:scale-110 ${
                saved
                  ? 'bg-[#FFB84D] text-white shadow-card'
                  : 'bg-black/[0.06] text-[var(--color-text-secondary)] hover:bg-[#FFB84D] hover:text-white'
              }`}
              title={saved ? '取消收藏' : '收藏文章'}
            >
              {saved ? <BookmarkCheck size={18} /> : <Bookmark size={18} />}
            </button>
          </div>
          <p className="mt-2 text-xs text-[var(--color-text-tertiary)]">
            💡 點 ▶ 朗讀 · 點句子從那句開始 · hover 英文字查翻譯
          </p>
        </div>
      </GlassCard>

      {/* 播放控制列（sticky） */}
      <div className="sticky top-16 z-30 bg-[#FAFAFC]/95 py-2 backdrop-blur-sm -mx-1 px-1">
        <ArticlePlayer
          sentences={allSentences}
          paragraphBoundaries={paragraphBoundaries}
          onSentenceChange={setActiveSentenceIdx}
          onModeChange={handleModeChange}
        />
      </div>

      {/* 正文（停用全站查字，只用文章自己的 hover 翻譯，避免兩套泡泡重疊）*/}
      <GlassCard className="p-6 sm:p-8">
        <div data-no-lookup>{renderParagraphs()}</div>
      </GlassCard>

      {/* 重點單字 */}
      {article.keyVocabulary.length > 0 && (
        <GlassCard className="p-5">
          <div className="mb-3 flex items-center gap-1.5 font-bold">
            <BookOpen size={15} className="text-[#5B5BF0]" /> 重點單字
          </div>
          <div className="space-y-2">
            {article.keyVocabulary.map((v, i) => {
              const pos = v.pos || enrich?.vocab[v.word.toLowerCase()]?.pos;
              const usage = v.usage || enrich?.vocab[v.word.toLowerCase()]?.usage;
              return (
              <div key={i} className="flex items-start justify-between gap-3 rounded-xl bg-white/50 p-3 ring-1 ring-inset ring-black/5">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <button type="button" onClick={() => speak({ text: v.word })}
                      className="text-[15px] font-bold text-[#5B5BF0] hover:underline">{v.word}</button>
                    {pos && (
                      <span className="rounded-md bg-[#5B5BF0]/10 px-1.5 py-0.5 text-[10px] font-semibold italic text-[#5B5BF0]">{pos}</span>
                    )}
                  </div>
                  <div className="mt-0.5 text-sm text-[var(--color-text-secondary)]">{v.def}</div>
                  {usage && (
                    <div className="mt-1 text-xs text-[var(--color-text-tertiary)]">💡 {usage}</div>
                  )}
                  {v.example && (
                    <div className="mt-1 flex items-start gap-1.5">
                      <span className="flex-1 text-xs italic text-[var(--color-text-tertiary)]">"{v.example}"</span>
                      <button type="button" onClick={() => speak({ text: v.example! })}
                        className="shrink-0 rounded-full p-1 text-[var(--color-text-tertiary)] hover:bg-[#5B5BF0]/10 hover:text-[#5B5BF0]"
                        title="聽例句">
                        <Volume2 size={12} />
                      </button>
                    </div>
                  )}
                </div>
                <button type="button" onClick={() => addToVocab(v.word, v.def)}
                  disabled={!!findWord(v.word)}
                  className={`shrink-0 rounded-lg px-2.5 py-1 text-[10px] font-medium transition ${
                    findWord(v.word) ? 'bg-[#4ADE80]/15 text-[#15803d]' : 'bg-[#5B5BF0]/10 text-[#5B5BF0] hover:bg-[#5B5BF0]/20'
                  }`}>
                  {findWord(v.word) ? '✓ 已收藏' : '+ 收藏'}
                </button>
              </div>
              );
            })}
          </div>
        </GlassCard>
      )}

      {/* 文法筆記（文章自帶；沒有則用 AI 補強的）*/}
      {(() => {
        const notes = (article.grammarNotes?.length ? article.grammarNotes : enrich?.grammarNotes) ?? [];
        const hasOwn = !!article.grammarNotes?.length;
        // 載入中，或補強跑完但 Gemini 沒生出文法（配額用完）→ 顯示提示
        if (notes.length === 0 && !enrichLoading) {
          if (hasOwn || !needsEnrichment(article)) return null;
          // 補強過但拿不到文法（配額）→ 給重試入口
          return (
            <GlassCard className="p-5">
              <div className="mb-2 font-bold">📖 文法筆記</div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm text-[var(--color-text-tertiary)]">AI 配額用完，暫時無法整理文法（每天 20 次，明天重置）</span>
                <button type="button" onClick={regenGrammar}
                  className="shrink-0 rounded-lg bg-[#5B5BF0]/10 px-2.5 py-1 text-xs font-medium text-[#5B5BF0] hover:bg-[#5B5BF0]/20">
                  ↻ 重試
                </button>
              </div>
            </GlassCard>
          );
        }
        return (
          <GlassCard className="p-5">
            <div className="mb-3 font-bold">📖 文法筆記</div>
            {enrichLoading && notes.length === 0 ? (
              <div className="flex items-center gap-2 text-sm text-[var(--color-text-tertiary)]">
                <Loader2 size={14} className="animate-spin" /> AI 正在整理文法重點…
              </div>
            ) : notes.map((g, i) => (
              <div key={i} className="mb-3 last:mb-0">
                <div className="mb-1 text-sm font-semibold text-[#5B5BF0]">{g.title}</div>
                <div className="text-sm leading-relaxed text-[var(--color-text-secondary)]">{g.body}</div>
              </div>
            ))}
          </GlassCard>
        );
      })()}

      {/* 測驗 */}
      {article.quizzes.length > 0 && (
        <GlassCard className="p-5">
          <button type="button" onClick={() => setQuizOpen(v => !v)}
            className="flex w-full items-center justify-between">
            <div className="flex items-center gap-2 font-bold">
              📝 閱讀測驗
              <span className="text-xs text-[var(--color-text-tertiary)]">{article.quizzes.length} 題</span>
            </div>
            <ChevronRight size={16} className={`transition-transform ${quizOpen ? 'rotate-90' : ''} text-[var(--color-text-tertiary)]`} />
          </button>
          <AnimatePresence>
            {quizOpen && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                <div className="mt-4 space-y-5">
                  {article.quizzes.map(q => {
                    const picked = answers[q.id];
                    const done = picked !== undefined;
                    return (
                      <div key={q.id}>
                        <div className="mb-2 text-sm font-semibold">{q.question}</div>
                        <div className="space-y-1.5">
                          {q.options.map((opt, idx) => {
                            const isCorrect = idx === q.correctAnswerIndex;
                            const isPicked = picked === idx;
                            let cls = 'bg-white/50 ring-1 ring-inset ring-black/5 hover:bg-white/70';
                            if (done) {
                              if (isCorrect) cls = 'bg-[#4ADE80]/15 ring-2 ring-[#4ADE80]';
                              else if (isPicked) cls = 'bg-[#F87171]/15 ring-2 ring-[#F87171]';
                              else cls = 'bg-white/30 ring-1 ring-inset ring-black/5 opacity-50';
                            }
                            return (
                              <button key={idx} type="button"
                                onClick={() => !done && setAnswers(a => ({ ...a, [q.id]: idx }))}
                                disabled={done}
                                className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm transition ${cls}`}>
                                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-black/[0.05] text-xs font-bold">
                                  {String.fromCharCode(65 + idx)}
                                </span>
                                {opt}
                                {done && isCorrect && <CheckCircle2 size={14} className="ml-auto text-[#15803d]" />}
                                {done && isPicked && !isCorrect && <XCircle size={14} className="ml-auto text-[#b91c1c]" />}
                              </button>
                            );
                          })}
                        </div>
                        {done && (
                          <div className="mt-2 rounded-lg bg-[#5B5BF0]/8 px-3 py-2 text-xs text-[#5B5BF0] ring-1 ring-inset ring-[#5B5BF0]/15">
                            💡 {q.explanation}
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {Object.keys(answers).length === article.quizzes.length && (
                    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                      className="rounded-2xl bg-gradient-to-r from-[#7C7CFF]/10 to-[#5B5BF0]/5 p-4 text-center ring-1 ring-inset ring-[#5B5BF0]/20">
                      <div className="text-2xl font-bold text-[#5B5BF0]">{score} / {article.quizzes.length}</div>
                      <div className="mt-1 text-sm text-[var(--color-text-secondary)]">
                        {score === article.quizzes.length ? '🎉 全對！太棒了' : score > 0 ? '👍 繼續加油' : '再讀一次試試看'}
                      </div>
                      <button type="button" onClick={() => setAnswers({})}
                        className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-white/60 px-3 py-1.5 text-xs font-medium ring-1 ring-inset ring-black/5 hover:bg-white/80">
                        <RotateCcw size={12} /> 重新作答
                      </button>
                    </motion.div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </GlassCard>
      )}

      {/* AI 自動出題 */}
      <ArticleQuizAI
        articleText={allSentences.join(' ')}
        level={article.level}
      />

      {/* 單字 Tooltip */}
      <AnimatePresence>
        {wordTip && (
          <motion.div
            initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            data-no-lookup
            className="pointer-events-none fixed z-[80] max-w-[200px] rounded-xl bg-[#0F0F19]/90 px-3 py-2 text-xs text-white shadow-modal backdrop-blur-sm"
            style={{
              left: typeof window !== 'undefined' ? Math.min(wordTip.x, window.innerWidth - 220) : wordTip.x,
              top: wordTip.y
            }}
          >
            <div className="font-bold">{wordTip.word}</div>
            <div className="mt-0.5 text-white/80">{wordTip.zh}</div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 點擊單字 → 完整查詢彈窗（音標/發音/中文/AI 例句/加入單字本）*/}
      {lookupWord && (
        <WordPopup
          word={lookupWord.word}
          context={lookupWord.context}
          onClose={() => setLookupWord(null)}
        />
      )}
    </div>
  );
}
