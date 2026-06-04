'use client';

import { useMemo } from 'react';
import QuizSession from '@/components/quiz/QuizSession';
import { generateQuiz } from '@/lib/mock/quiz-bank';

export default function AIGenQuizPage() {
  const questions = useMemo(() => generateQuiz('ai_gen', 6), []);
  return <QuizSession type="ai_gen" topic="AI 綜合測驗" questions={questions} />;
}
