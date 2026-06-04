'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Clock } from 'lucide-react';
import ProgressBar from '@/components/ui/ProgressBar';
import QuestionCard from './QuestionCard';
import {
  saveQuizRecord,
  quizXP,
  type QuizQuestionRecord,
  type QuizType,
  type QuizAnswer,
  type QuizRecord,
} from '@/lib/storage/quiz-actions';
import { addLearningSession } from '@/lib/storage/progress-actions';
import { addWord } from '@/lib/storage/vocab-actions';

interface QuizSessionProps {
  type: QuizType;
  topic: string;
  questions: QuizQuestionRecord[];
}

export default function QuizSession({ type, topic, questions }: QuizSessionProps) {
  const router = useRouter();
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState<QuizAnswer[]>([]);
  const [startAt] = useState(() => Date.now());
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setElapsed(Math.floor((Date.now() - startAt) / 1000)), 1000);
    return () => clearInterval(t);
  }, [startAt]);

  const handleAnswer = (selected: number, timeSpentSec: number) => {
    const q = questions[idx];
    const correct = selected === q.correctIndex;
    const ans: QuizAnswer = { questionId: q.id, selectedIndex: selected, correct, timeSpentSec };

    const newAnswers = [...answers, ans];
    setAnswers(newAnswers);

    if (idx + 1 >= questions.length) {
      finishQuiz(newAnswers);
    } else {
      setIdx(idx + 1);
    }
  };

  const finishQuiz = (allAnswers: QuizAnswer[]) => {
    const correctCount = allAnswers.filter((a) => a.correct).length;
    const score = Math.round((correctCount / questions.length) * 100);
    const durationSec = Math.floor((Date.now() - startAt) / 1000);
    const xp = quizXP(score);

    // 錯題自動加入單字本
    allAnswers.forEach((a) => {
      if (a.correct) return;
      const q = questions.find((qq) => qq.id === a.questionId);
      if (!q?.relatedWord) return;
      addWord({
        word: q.relatedWord,
        meaning: q.explanation ?? q.relatedWord,
        source: 'manual',
      });
    });

    const record: QuizRecord = {
      id: 'qr-' + crypto.randomUUID().slice(0, 8),
      type,
      topic,
      questions,
      answers: allAnswers,
      score,
      durationSec,
      takenAt: new Date().toISOString(),
    };
    saveQuizRecord(record);

    // 寫進度
    addLearningSession({
      minutes: Math.max(1, Math.round(durationSec / 60)),
      xp,
      type: 'quiz',
      title: `${labelOf(type)}測驗 ${correctCount}/${questions.length}`,
      detail: `正確率 ${score}% · +${xp} XP`,
      refId: record.id,
    });

    router.push(`/quiz/result/${record.id}`);
  };

  const q = questions[idx];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <ProgressBar value={(idx / questions.length) * 100} height={6} />
        <div className="inline-flex items-center gap-1 rounded-full bg-white/50 px-3 py-1 font-mono text-xs text-[var(--color-text-secondary)] ring-1 ring-inset ring-black/5">
          <Clock size={12} /> {fmtTime(elapsed)}
        </div>
      </div>

      <div className="mx-auto max-w-2xl">
        <QuestionCard
          key={q.id}
          q={q}
          index={idx}
          total={questions.length}
          onAnswer={handleAnswer}
        />
      </div>
    </div>
  );
}

function labelOf(t: QuizType): string {
  return { listening: '聽力', cloze: '填空', vocab: '單字', ai_gen: 'AI 自動出題' }[t];
}

function fmtTime(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}
