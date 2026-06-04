'use client';

import { useMemo } from 'react';
import QuizSession from '@/components/quiz/QuizSession';
import { generateQuiz } from '@/lib/mock/quiz-bank';

export default function ListeningQuizPage() {
  const questions = useMemo(() => generateQuiz('listening', 5), []);
  return <QuizSession type="listening" topic="聽力測驗" questions={questions} />;
}
