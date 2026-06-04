/**
 * 進度更新操作
 */

import { progressRepo, historyRepo } from './repos';
import type { Activity } from '../readle-types';

const todayISO = () => new Date().toISOString().slice(0, 10);

function calcLevel(xp: number): number {
  // Level N 需要 floor(100 * N^1.5) XP
  let lv = 1;
  while (Math.floor(100 * Math.pow(lv + 1, 1.5)) <= xp) lv++;
  return lv;
}

/** 增加今日學習時間 + XP + 更新連續天數 */
export function addLearningSession(opts: {
  minutes: number;
  xp: number;
  type: Activity['type'];
  title: string;
  detail: string;
  refId?: string;
}): void {
  const today = todayISO();
  progressRepo.update((p) => {
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    let streak = p.currentStreak;
    if (p.lastActiveDate === today) {
      // 同一天，streak 不變
    } else if (p.lastActiveDate === yesterday) {
      streak += 1;
    } else {
      streak = 1; // 中斷重啟
    }

    const newDaily = { ...p.daily };
    const cur = newDaily[today] ?? {
      date: today,
      minutesLearned: 0,
      xpEarned: 0,
      videosWatched: 0,
      wordsReviewed: 0,
      quizzesTaken: 0,
      goalMet: false,
    };
    cur.minutesLearned += opts.minutes;
    cur.xpEarned += opts.xp;
    if (opts.type === 'video') cur.videosWatched += 1;
    if (opts.type === 'vocab_review') cur.wordsReviewed += 1;
    if (opts.type === 'quiz') cur.quizzesTaken += 1;
    newDaily[today] = cur;

    const totalXP = p.totalXP + opts.xp;
    return {
      ...p,
      currentStreak: streak,
      longestStreak: Math.max(p.longestStreak, streak),
      lastActiveDate: today,
      totalMinutes: p.totalMinutes + opts.minutes,
      totalXP,
      level: calcLevel(totalXP),
      daily: newDaily,
    };
  });

  // 加進活動歷史
  historyRepo.update((h) => {
    const activity: Activity = {
      id: crypto.randomUUID(),
      type: opts.type,
      title: opts.title,
      detail: opts.detail,
      xpEarned: opts.xp,
      duration: opts.minutes * 60,
      refId: opts.refId,
      at: new Date().toISOString(),
    };
    const next = [activity, ...h.activities].slice(0, 200);
    return { ...h, activities: next };
  });
}

/** Level N 完成需要的累計 XP */
export function xpForLevel(level: number): number {
  return Math.floor(100 * Math.pow(level, 1.5));
}

/** 取得目前到下一級的進度（0-100） */
export function progressToNextLevel(xp: number, level: number): number {
  const cur = xpForLevel(level);
  const next = xpForLevel(level + 1);
  if (xp <= cur) return 0;
  return ((xp - cur) / (next - cur)) * 100;
}
