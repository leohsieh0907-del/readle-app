'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft, Volume2, ChevronDown, BookOpen, ListChecks, Lightbulb } from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';
import ExamPractice from '@/components/exam/ExamPractice';
import { getExamCourse, type ExamLesson } from '@/lib/exam/courses';
import { speak } from '@/lib/speech/tts';
import { addWord, findWord } from '@/lib/storage/vocab-actions';
import { toast } from '@/lib/toast';

const ACCENT: Record<string, string> = { toeic: '#5B5BF0', gept: '#22C55E' };

export default function ExamDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const course = getExamCourse(id);
  const [tab, setTab] = useState<'lessons' | 'practice'>('lessons');
  const [openLesson, setOpenLesson] = useState<string | null>(null);
  const [, force] = useState(0);

  if (!course) {
    return (
      <div className="py-20 text-center">
        <div className="mb-3 text-4xl">🔍</div>
        <p className="text-sm text-[var(--color-text-tertiary)]">找不到這個課程</p>
        <Link href="/exam" className="mt-4 inline-block text-sm text-[#5B5BF0] hover:underline">← 回到考試準備</Link>
      </div>
    );
  }
  const accent = ACCENT[course.id] ?? '#5B5BF0';

  const saveVocab = (v: { word: string; pos: string; zh: string; example: string }) => {
    if (findWord(v.word)) return;
    addWord({
      word: v.word, partOfSpeech: v.pos, meaning: v.zh,
      examples: [{ en: v.example, zh: '' }],
      category: course.id === 'toeic' ? 'toeic' : 'daily', source: 'manual',
    });
    toast('已加入單字本 📖');
    force((n) => n + 1);
  };

  const renderLesson = (l: ExamLesson) => {
    const open = openLesson === l.id;
    return (
      <GlassCard key={l.id} className="overflow-hidden p-0">
        <button type="button" onClick={() => setOpenLesson(open ? null : l.id)}
          className="flex w-full items-center justify-between gap-2 p-4 text-left">
          <span className="flex items-center gap-2 font-bold">
            {l.kind === 'vocab' && <BookOpen size={16} style={{ color: accent }} />}
            {l.kind === 'grammar' && <ListChecks size={16} style={{ color: accent }} />}
            {l.kind === 'tips' && <Lightbulb size={16} style={{ color: accent }} />}
            {l.title}
          </span>
          <ChevronDown size={18} className={`shrink-0 text-[var(--color-text-tertiary)] transition ${open ? 'rotate-180' : ''}`} />
        </button>

        {open && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-4 pb-4">
            {l.intro && <p className="mb-3 text-sm text-[var(--color-text-tertiary)]">{l.intro}</p>}

            {/* 單字 */}
            {l.vocab && (
              <div className="space-y-2">
                {l.vocab.map((v, i) => {
                  const saved = !!findWord(v.word);
                  return (
                    <div key={i} className="rounded-xl bg-white/50 p-3 ring-1 ring-inset ring-black/5">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <button type="button" onClick={() => speak({ text: v.word })}
                              className="text-[15px] font-bold text-[#5B5BF0] hover:underline">{v.word}</button>
                            <span className="rounded-md bg-[#5B5BF0]/10 px-1.5 py-0.5 text-[10px] font-semibold italic text-[#5B5BF0]">{v.pos}</span>
                            <span className="text-sm text-[var(--color-text-secondary)]">{v.zh}</span>
                          </div>
                          <div className="mt-1 flex items-start gap-1.5">
                            <span className="flex-1 text-xs italic text-[var(--color-text-tertiary)]">&ldquo;{v.example}&rdquo;</span>
                            <button type="button" onClick={() => speak({ text: v.example })}
                              className="shrink-0 rounded-full p-1 text-[var(--color-text-tertiary)] hover:bg-[#5B5BF0]/10 hover:text-[#5B5BF0]">
                              <Volume2 size={12} />
                            </button>
                          </div>
                        </div>
                        <button type="button" onClick={() => saveVocab(v)} disabled={saved}
                          className={`shrink-0 rounded-lg px-2.5 py-1 text-[10px] font-medium transition ${
                            saved ? 'bg-[#4ADE80]/15 text-[#15803d]' : 'bg-[#5B5BF0]/10 text-[#5B5BF0] hover:bg-[#5B5BF0]/20'
                          }`}>
                          {saved ? '✓ 已收藏' : '+ 收藏'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* 文法重點 */}
            {l.points && (
              <div className="space-y-3">
                {l.points.map((p, i) => (
                  <div key={i}>
                    <div className="mb-0.5 text-sm font-semibold text-[#5B5BF0]">{p.title}</div>
                    <div className="text-sm leading-relaxed text-[var(--color-text-secondary)]">{p.body}</div>
                  </div>
                ))}
              </div>
            )}

            {/* 技巧 */}
            {l.tips && (
              <ul className="space-y-2">
                {l.tips.map((t, i) => (
                  <li key={i} className="flex gap-2 text-sm text-[var(--color-text-secondary)]">
                    <span className="shrink-0" style={{ color: accent }}>▸</span>{t}
                  </li>
                ))}
              </ul>
            )}
          </motion.div>
        )}
      </GlassCard>
    );
  };

  return (
    <div className="mx-auto max-w-3xl">
      <Link href="/exam" className="mb-3 inline-flex items-center gap-1.5 text-sm text-[var(--color-text-tertiary)] hover:text-[#5B5BF0]">
        <ArrowLeft size={15} /> 回到考試準備
      </Link>

      {/* 頭部 */}
      <GlassCard className="overflow-hidden p-0">
        <div className={`bg-gradient-to-br ${course.gradient} p-5 text-white`}>
          <div className="flex items-center gap-3">
            <span className="text-4xl">{course.emoji}</span>
            <div>
              <div className="text-2xl font-extrabold">{course.name}</div>
              <div className="text-xs text-white/80">{course.nameEn}</div>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 p-4 sm:grid-cols-4">
          {course.format.map((f, i) => (
            <div key={i} className="rounded-xl bg-white/50 p-2.5 ring-1 ring-inset ring-black/5">
              <div className="text-[11px] font-semibold text-[var(--color-text-tertiary)]">{f.label}</div>
              <div className="mt-0.5 text-xs leading-snug text-[var(--color-text-secondary)]">{f.value}</div>
            </div>
          ))}
        </div>
      </GlassCard>

      {/* 分頁 */}
      <div className="my-4 flex gap-2">
        <button type="button" onClick={() => setTab('lessons')}
          className={`flex-1 rounded-xl py-2.5 text-sm font-semibold transition ${
            tab === 'lessons' ? 'bg-gradient-to-r from-[#7C7CFF] to-[#5B5BF0] text-white shadow-card' : 'bg-white/60 text-[var(--color-text-secondary)] ring-1 ring-inset ring-black/5'
          }`}>
          📚 課程（{course.lessons.length}）
        </button>
        <button type="button" onClick={() => setTab('practice')}
          className={`flex-1 rounded-xl py-2.5 text-sm font-semibold transition ${
            tab === 'practice' ? 'bg-gradient-to-r from-[#7C7CFF] to-[#5B5BF0] text-white shadow-card' : 'bg-white/60 text-[var(--color-text-secondary)] ring-1 ring-inset ring-black/5'
          }`}>
          ✏️ 練習（{course.questions.length}）
        </button>
      </div>

      {tab === 'lessons' ? (
        <div className="space-y-3">{course.lessons.map(renderLesson)}</div>
      ) : (
        <ExamPractice questions={course.questions} accent={accent} />
      )}
    </div>
  );
}
