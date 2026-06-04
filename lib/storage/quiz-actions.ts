/**
 * 測驗紀錄寫入
 */

import { Repo } from './repo';
import type { Category } from '../readle-types';

export type QuizType = 'listening' | 'cloze' | 'vocab' | 'ai_gen';
export type SkillTag = 'listening' | 'vocab' | 'grammar' | 'idiom' | 'spelling';

export interface QuizQuestionRecord {
  id: string;
  stem: string;
  options: string[];
  correctIndex: number;
  audio?: string;
  explanation?: string;
  skillTag: SkillTag;
  relatedWord?: string;
}

export interface QuizAnswer {
  questionId: string;
  selectedIndex: number;
  correct: boolean;
  timeSpentSec: number;
}

export interface QuizRecord {
  id: string;
  type: QuizType;
  topic?: string;
  category?: Category;
  questions: QuizQuestionRecord[];
  answers: QuizAnswer[];
  score: number;
  durationSec: number;
  takenAt: string;
}

interface QuizStore {
  records: QuizRecord[];
  _version: 1;
}

export const quizRepo = new Repo<QuizStore>('readle.quiz_records', {
  records: [],
  _version: 1,
});

export function saveQuizRecord(rec: QuizRecord): void {
  quizRepo.update((s) => ({ ...s, records: [rec, ...s.records].slice(0, 100) }));
}

export function getQuizRecord(id: string): QuizRecord | undefined {
  return quizRepo.get().records.find((r) => r.id === id);
}

export function quizXP(score: number): number {
  // 完成基本 30 XP + 準確率加成最高 50 XP
  return Math.round(30 + (score / 100) * 50);
}
