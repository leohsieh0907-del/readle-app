/**
 * 9 個成就徽章定義 + 解鎖判斷規則
 */

import type { ProgressStore, VocabStore, HistoryStore } from '../readle-types';

export type AchievementTier = 'bronze' | 'silver' | 'gold' | 'diamond';

export interface AchievementDef {
  id: string;
  icon: string;
  label: string;
  desc: string;
  tier: AchievementTier;
  check: (ctx: { progress: ProgressStore; vocab: VocabStore; history: HistoryStore }) => boolean;
}

const vocabCount = (v: VocabStore) => Object.keys(v.entries).length;
const masteredCount = (v: VocabStore) =>
  Object.values(v.entries).filter((e) => e.srs.status === 'mastered').length;
const activityCount = (h: HistoryStore, type?: string) =>
  type ? h.activities.filter((a) => a.type === type).length : h.activities.length;

export const achievements: AchievementDef[] = [
  {
    id: 'first_step',
    icon: '🌱',
    label: '初心者',
    desc: '完成首次學習活動',
    tier: 'bronze',
    check: ({ history }) => activityCount(history) >= 1,
  },
  {
    id: 'streak_7',
    icon: '🔥',
    label: '七日連續',
    desc: '連續學習 7 天',
    tier: 'bronze',
    check: ({ progress }) => progress.currentStreak >= 7 || progress.longestStreak >= 7,
  },
  {
    id: 'streak_30',
    icon: '🔥',
    label: '三十日連續',
    desc: '連續學習 30 天',
    tier: 'silver',
    check: ({ progress }) => progress.currentStreak >= 30 || progress.longestStreak >= 30,
  },
  {
    id: 'streak_100',
    icon: '🔥',
    label: '百日達人',
    desc: '連續學習 100 天',
    tier: 'gold',
    check: ({ progress }) => progress.currentStreak >= 100 || progress.longestStreak >= 100,
  },
  {
    id: 'vocab_100',
    icon: '📚',
    label: '單字收藏家',
    desc: '收藏 100 個單字',
    tier: 'bronze',
    check: ({ vocab }) => vocabCount(vocab) >= 100,
  },
  {
    id: 'vocab_mastered_50',
    icon: '🧠',
    label: '記憶大師',
    desc: '掌握 50 個單字',
    tier: 'silver',
    check: ({ vocab }) => masteredCount(vocab) >= 50,
  },
  {
    id: 'shadow_50',
    icon: '🎙',
    label: '跟讀達人',
    desc: '完成 50 次跟讀練習',
    tier: 'silver',
    check: ({ history }) => activityCount(history, 'video') >= 50,
  },
  {
    id: 'quiz_perfect',
    icon: '🎯',
    label: '測驗滿分',
    desc: '任一測驗答對全部',
    tier: 'gold',
    check: ({ history }) =>
      history.activities.some((a) => a.type === 'quiz' && a.detail.includes('100%')),
  },
  {
    id: 'xp_10000',
    icon: '⭐',
    label: 'XP 萬人',
    desc: '累積 10,000 XP',
    tier: 'diamond',
    check: ({ progress }) => progress.totalXP >= 10000,
  },
];
