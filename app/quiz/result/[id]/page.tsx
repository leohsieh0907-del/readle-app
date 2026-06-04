'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { motion } from 'framer-motion';
import { Check, X, Sparkles, RotateCcw, Home } from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';
import SoftButton from '@/components/ui/SoftButton';
import ResultRadar from '@/components/quiz/ResultRadar';
import { getQuizRecord } from '@/lib/storage/quiz-actions';
import type { QuizRecord, SkillTag } from '@/lib/storage/quiz-actions';

const skillLabel: Record<SkillTag, string> = {
  listening: '聽力',
  vocab: '字彙',
  grammar: '文法',
  idiom: '慣用語',
  spelling: '拼字',
};

export default function ResultPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [record, setRecord] = useState<QuizRecord | null>(null);
  const [animScore, setAnimScore] = useState(0);

  useEffect(() => {
    const r = getQuizRecord(id);
    if (!r) {
      // 找不到就 404
      return;
    }
    setRecord(r);

    // 分數動畫
    let cur = 0;
    const target = r.score;
    const step = () => {
      cur = Math.min(target, cur + Math.max(1, Math.round((target - cur) / 8)));
      setAnimScore(cur);
      if (cur < target) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [id]);

  if (record === null) {
    return (
      <GlassCard className="mx-auto max-w-md p-8 text-center">
        <div className="mb-3 text-5xl">🔍</div>
        <p className="text-sm text-[var(--color-text-secondary)]">找不到這份測驗紀錄</p>
        <Link href="/quiz" className="mt-3 inline-block">
          <SoftButton variant="primary" size="md">回到測驗中心</SoftButton>
        </Link>
      </GlassCard>
    );
  }

  const correctCount = record.answers.filter((a) => a.correct).length;
  const wrongAnswers = record.answers
    .map((a, i) => ({ ans: a, q: record.questions[i] }))
    .filter(({ ans }) => !ans.correct);

  // 雷達圖資料：依 skillTag 統計正確率
  const skillMap: Record<SkillTag, { correct: number; total: number }> = {
    listening: { correct: 0, total: 0 },
    vocab: { correct: 0, total: 0 },
    grammar: { correct: 0, total: 0 },
    idiom: { correct: 0, total: 0 },
    spelling: { correct: 0, total: 0 },
  };
  record.answers.forEach((a, i) => {
    const tag = record.questions[i].skillTag;
    skillMap[tag].total += 1;
    if (a.correct) skillMap[tag].correct += 1;
  });
  const radarData = (Object.keys(skillMap) as SkillTag[])
    .filter((k) => skillMap[k].total > 0)
    .map((k) => ({
      skill: skillLabel[k],
      score: Math.round((skillMap[k].correct / skillMap[k].total) * 100),
    }));

  const tip =
    record.score >= 90
      ? '🎉 表現出色！這次的內容你掌握得很好。'
      : record.score >= 70
      ? '👏 不錯！再針對錯題複習就更穩了。'
      : record.score >= 50
      ? '加油！錯題已加進你的單字本，明天記得回來複習。'
      : '別灰心，這是學習的最佳時機。把錯題逐一搞清楚最有效。';

  return (
    <div className="space-y-5">
      <GlassCard className="glass-strong p-7 text-center">
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 18 }}
          className="mx-auto flex h-28 w-28 items-center justify-center rounded-full bg-gradient-to-br from-[#7C7CFF] to-[#5B5BF0] text-white shadow-card"
        >
          <div className="text-4xl font-bold">{animScore}</div>
        </motion.div>
        <div className="mt-3 text-sm font-medium text-[var(--color-text-tertiary)]">
          {correctCount} / {record.questions.length} 答對
        </div>
        <h1 className="mt-3 text-2xl font-bold tracking-tight">{record.topic}</h1>
        <p className="mt-1 text-sm text-[var(--color-text-secondary)]">{tip}</p>
      </GlassCard>

      {radarData.length >= 3 && (
        <GlassCard className="p-5">
          <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)]">
            技能分析
          </div>
          <ResultRadar data={radarData} />
        </GlassCard>
      )}

      {wrongAnswers.length > 0 && (
        <GlassCard className="p-5">
          <div className="mb-3 flex items-center gap-1.5">
            <X size={16} className="text-[#EF4444]" />
            <h2 className="font-bold">你錯的題目（{wrongAnswers.length}）</h2>
          </div>
          <div className="space-y-2">
            {wrongAnswers.map(({ q, ans }) => (
              <div key={q.id} className="rounded-xl bg-white/50 p-3 ring-1 ring-inset ring-black/5">
                <div className="text-sm font-semibold leading-snug">{q.stem}</div>
                <div className="mt-1.5 flex items-center gap-2 text-xs">
                  <span className="rounded bg-[#F87171]/15 px-2 py-0.5 text-[#B91C1C]">
                    你選：{q.options[ans.selectedIndex]}
                  </span>
                  <span className="rounded bg-[#4ADE80]/15 px-2 py-0.5 text-[#15803d]">
                    正解：{q.options[q.correctIndex]}
                  </span>
                </div>
                {q.explanation && (
                  <div className="mt-1.5 text-xs text-[var(--color-text-tertiary)]">
                    💡 {q.explanation}
                  </div>
                )}
              </div>
            ))}
          </div>
          {wrongAnswers.some((w) => w.q.relatedWord) && (
            <div className="mt-3 rounded-xl bg-[#5B5BF0]/8 p-3 text-xs ring-1 ring-inset ring-[#5B5BF0]/15">
              <Sparkles size={12} className="mr-1 inline text-[#5B5BF0]" />
              這些單字已自動加入你的單字本，等你回去複習。
            </div>
          )}
        </GlassCard>
      )}

      <div className="flex flex-col items-center justify-center gap-2 sm:flex-row">
        <Link href="/quiz">
          <SoftButton variant="ghost" size="md" leftIcon={<RotateCcw size={14} />}>
            再做一份
          </SoftButton>
        </Link>
        <Link href="/">
          <SoftButton variant="primary" size="md" leftIcon={<Home size={14} />}>
            回首頁
          </SoftButton>
        </Link>
      </div>
    </div>
  );
}
