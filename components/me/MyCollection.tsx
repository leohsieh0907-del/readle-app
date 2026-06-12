'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Bookmark, FileText, BookOpen, PlayCircle, Volume2 } from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';
import { getSavedIds } from '@/lib/storage/article-actions';
import { getSavedVideoIds } from '@/lib/storage/video-actions';
import { vocabRepo } from '@/lib/storage/repos';
import { mockArticles } from '@/lib/mockArticles';
import { seedVideos } from '@/lib/mock/seed-videos';
import { speak } from '@/lib/speech/tts';
import type { Article } from '@/lib/types';
import type { VocabEntry, MockVideo } from '@/lib/readle-types';

type Tab = 'articles' | 'words' | 'videos';

const GEN_KEY = 'readle.generated_articles';

export default function MyCollection() {
  const [tab, setTab] = useState<Tab>('articles');
  const [articles, setArticles] = useState<Article[]>([]);
  const [words, setWords] = useState<VocabEntry[]>([]);
  const [videos, setVideos] = useState<MockVideo[]>([]);

  useEffect(() => {
    // 文章（含 AI 生成的）
    let gen: Article[] = [];
    try { gen = JSON.parse(localStorage.getItem(GEN_KEY) ?? '[]') as Article[]; } catch { /* ignore */ }
    const allArticles = [...mockArticles, ...gen];
    const savedA = getSavedIds();
    setArticles(savedA.map(id => allArticles.find(a => a.id === id)).filter(Boolean) as Article[]);

    // 單字（單字本就是收藏的字）
    setWords(Object.values(vocabRepo.get().entries));

    // 影片
    const savedV = getSavedVideoIds();
    setVideos(savedV.map(id => seedVideos.find(v => v.id === id)).filter(Boolean) as MockVideo[]);
  }, []);

  const tabs: { id: Tab; label: string; icon: typeof FileText; count: number }[] = [
    { id: 'articles', label: '文章', icon: FileText, count: articles.length },
    { id: 'words', label: '單字', icon: BookOpen, count: words.length },
    { id: 'videos', label: '影片', icon: PlayCircle, count: videos.length },
  ];

  return (
    <section>
      <div className="mb-3 flex items-center gap-2 px-1">
        <Bookmark size={16} className="text-[#5B5BF0]" />
        <h2 className="text-lg font-bold tracking-tight">我的收藏</h2>
      </div>

      <GlassCard className="p-4">
        {/* 分頁 */}
        <div className="mb-4 flex gap-2">
          {tabs.map(t => (
            <button key={t.id} type="button" onClick={() => setTab(t.id)}
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition ${
                tab === t.id
                  ? 'bg-gradient-to-r from-[#7C7CFF] to-[#5B5BF0] text-white shadow-card'
                  : 'bg-white/50 text-[var(--color-text-secondary)] ring-1 ring-inset ring-black/5 hover:bg-white/70'
              }`}>
              <t.icon size={14} /> {t.label}
              <span className={tab === t.id ? 'text-white/80' : 'text-[var(--color-text-tertiary)]'}>{t.count}</span>
            </button>
          ))}
        </div>

        {/* 文章 */}
        {tab === 'articles' && (
          articles.length === 0 ? <Empty hint="在文章列表點書籤即可收藏" />
          : <div className="space-y-2">
              {articles.map(a => (
                <Link key={a.id} href={`/learn/articles/${a.id}`}
                  className="flex items-center gap-3 rounded-xl bg-white/50 p-3 ring-1 ring-inset ring-black/5 transition hover:bg-white/80">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#5B5BF0]/10 text-[#5B5BF0]"><FileText size={15} /></div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold">{a.title}</div>
                    <div className="text-xs text-[var(--color-text-tertiary)]">{a.level} · {a.readingMinutes} min</div>
                  </div>
                </Link>
              ))}
            </div>
        )}

        {/* 單字 */}
        {tab === 'words' && (
          words.length === 0 ? <Empty hint="查詞卡點「加入單字本」即可收藏" />
          : <div className="space-y-2">
              {words.slice(0, 50).map(w => (
                <div key={w.id} className="flex items-center gap-3 rounded-xl bg-white/50 p-3 ring-1 ring-inset ring-black/5">
                  <button type="button" onClick={() => speak({ text: w.word })}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#5B5BF0]/10 text-[#5B5BF0] hover:bg-[#5B5BF0]/20" title="聽發音">
                    <Volume2 size={15} />
                  </button>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold">{w.word} <span className="font-mono text-xs text-[var(--color-text-tertiary)]">{w.phonetic}</span></div>
                    <div className="truncate text-xs text-[var(--color-text-secondary)]">{w.meaning}</div>
                  </div>
                </div>
              ))}
              <Link href="/learn/vocab" className="block pt-1 text-center text-xs font-medium text-[#5B5BF0] hover:underline">
                到單字本看全部 →
              </Link>
            </div>
        )}

        {/* 影片 */}
        {tab === 'videos' && (
          videos.length === 0 ? <Empty hint="在影片列表點書籤即可收藏" />
          : <div className="space-y-2">
              {videos.map(v => (
                <Link key={v.id} href={`/learn/videos/${v.id}`}
                  className="flex items-center gap-3 rounded-xl bg-white/50 p-3 ring-1 ring-inset ring-black/5 transition hover:bg-white/80">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#5B5BF0]/10 text-[#5B5BF0]"><PlayCircle size={15} /></div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold">{v.title}</div>
                    <div className="truncate text-xs text-[var(--color-text-tertiary)]">{v.titleZh}</div>
                  </div>
                </Link>
              ))}
            </div>
        )}
      </GlassCard>
    </section>
  );
}

function Empty({ hint }: { hint: string }) {
  return (
    <div className="py-8 text-center">
      <div className="mb-2 text-3xl">🔖</div>
      <p className="text-sm text-[var(--color-text-tertiary)]">還沒有收藏</p>
      <p className="mt-0.5 text-xs text-[var(--color-text-tertiary)]">{hint}</p>
    </div>
  );
}
