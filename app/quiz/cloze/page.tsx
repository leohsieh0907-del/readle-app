'use client';

import { useMemo } from 'react';
import QuizSession from '@/components/quiz/QuizSession';
import { generateQuiz } from '@/lib/mock/quiz-bank';

export default function ClozeQuizPage() {
  const questions = useMemo(() => generateQuiz('cloze', 5), []);
  return <QuizSession type="cloze" topic="填空測驗" questions={questions} />;
}
