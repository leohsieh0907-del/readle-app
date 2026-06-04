'use client';

import { useState } from 'react';
import { CheckCircle2, XCircle, Trophy, RotateCcw, Sparkles } from 'lucide-react';
import type { Article } from '@/lib/types';
import { setQuizScore } from '@/lib/storage';

export default function ArticleQuiz({ article }: { article: Article }) {
  const [started, setStarted] = useState(false);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>(
    article.quizzes.map(() => null),
  );
  const [revealed, setRevealed] = useState<boolean[]>(
    article.quizzes.map(() => false),
  );
  const [done, setDone] = useState(false);

  const total = article.quizzes.length;
  const score = answers.reduce<number>(
    (acc, a, i) => (a === article.quizzes[i].correctAnswerIndex ? acc + 1 : acc),
    0,
  );

  function selectOption(optionIdx: number) {
    if (revealed[step]) return;
    const nextAnswers = [...answers];
    nextAnswers[step] = optionIdx;
    const nextRevealed = [...revealed];
    nextRevealed[step] = true;
    setAnswers(nextAnswers);
    setRevealed(nextRevealed);
  }

  function next() {
    if (step < total - 1) {
      setStep(step + 1);
    } else {
      setDone(true);
      setQuizScore(article.id, score, total);
    }
  }

  function reset() {
    setStarted(false);
    setStep(0);
    setAnswers(article.quizzes.map(() => null));
    setRevealed(article.quizzes.map(() => false));
    setDone(false);
  }

  if (!started) {
    return (
      <section className="mt-10 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 p-8 text-center ring-1 ring-amber-200">
        <Sparkles className="mx-auto mb-3 h-8 w-8 text-amber-500" />
        <h3 className="font-serif text-2xl font-semibold text-stone-900">
          Test Your Understanding
        </h3>
        <p className="mt-2 text-sm text-stone-600">
          {total} quick questions to check what you learned.
        </p>
        <button
          type="button"
          onClick={() => setStarted(true)}
          className="mt-5 rounded-full bg-stone-900 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-stone-700"
        >
          Start Quiz
        </button>
      </section>
    );
  }

  if (done) {
    const pct = Math.round((score / total) * 100);
    return (
      <section className="mt-10 rounded-2xl bg-white p-8 text-center ring-1 ring-stone-200">
        <Trophy
          className={`mx-auto mb-3 h-10 w-10 ${
            pct >= 70 ? 'text-amber-500' : 'text-stone-400'
          }`}
        />
        <h3 className="font-serif text-2xl font-semibold text-stone-900">
          You scored {score} / {total}
        </h3>
        <p className="mt-2 text-sm text-stone-600">
          {pct >= 70
            ? 'Great job — your comprehension is strong!'
            : 'Keep practising — try re-reading the article and giving it another shot.'}
        </p>
        <button
          type="button"
          onClick={reset}
          className="mt-5 inline-flex items-center gap-1.5 rounded-full bg-stone-900 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-stone-700"
        >
          <RotateCcw className="h-4 w-4" />
          Try Again
        </button>
      </section>
    );
  }

  const q = article.quizzes[step];
  const userAnswer = answers[step];
  const isRevealed = revealed[step];
  const isCorrect = userAnswer === q.correctAnswerIndex;

  return (
    <section className="mt-10 rounded-2xl bg-white p-6 ring-1 ring-stone-200 sm:p-8">
      <div className="mb-4 flex items-center justify-between text-xs font-medium text-stone-500">
        <span>
          Question {step + 1} of {total}
        </span>
        <span>Score: {score}</span>
      </div>

      <h4 className="font-serif text-xl font-semibold text-stone-900">
        {q.question}
      </h4>

      <div className="mt-5 space-y-2.5">
        {q.options.map((opt, idx) => {
          const isUser = userAnswer === idx;
          const isAnswer = q.correctAnswerIndex === idx;
          let style = 'border-stone-200 hover:border-stone-400 hover:bg-stone-50';
          if (isRevealed) {
            if (isAnswer) {
              style = 'border-emerald-300 bg-emerald-50 text-emerald-900';
            } else if (isUser) {
              style = 'border-red-300 bg-red-50 text-red-900';
            } else {
              style = 'border-stone-200 opacity-60';
            }
          }
          return (
            <button
              key={idx}
              type="button"
              onClick={() => selectOption(idx)}
              disabled={isRevealed}
              className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left text-sm font-medium transition ${style}`}
            >
              <span>{opt}</span>
              {isRevealed && isAnswer && (
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              )}
              {isRevealed && isUser && !isAnswer && (
                <XCircle className="h-5 w-5 text-red-600" />
              )}
            </button>
          );
        })}
      </div>

      {isRevealed && (
        <div
          className={`mt-4 rounded-xl border-l-4 p-4 text-sm ${
            isCorrect
              ? 'border-emerald-400 bg-emerald-50 text-emerald-900'
              : 'border-red-400 bg-red-50 text-red-900'
          }`}
        >
          <p className="font-semibold">
            {isCorrect ? 'Correct!' : 'Not quite.'}
          </p>
          <p className="mt-1 leading-relaxed">{q.explanation}</p>
        </div>
      )}

      <div className="mt-5 flex justify-end">
        <button
          type="button"
          onClick={next}
          disabled={!isRevealed}
          className="rounded-full bg-stone-900 px-6 py-2 text-sm font-semibold text-white transition hover:bg-stone-700 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {step === total - 1 ? 'See Result' : 'Next Question'}
        </button>
      </div>
    </section>
  );
}
