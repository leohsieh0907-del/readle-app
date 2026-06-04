/**
 * SM-2 記憶曲線演算法（精簡版）
 *
 * 4 種回應對應 SuperMemo 的品質分：
 *   0 = forgot    忘了（重來）
 *   3 = vague     模糊（重複 + 小幅延後）
 *   4 = remember  記得（按 ease 倍率延後）
 *   5 = easy      太簡單（按 ease × 1.3 延後）
 *
 * 公式來源：https://en.wikipedia.org/wiki/SuperMemo#Description_of_SM-2_algorithm
 */

import type { SRSState } from '../readle-types';

export type SRSResponse = 'forgot' | 'vague' | 'remember' | 'easy';

const QUALITY: Record<SRSResponse, number> = {
  forgot: 0,
  vague: 3,
  remember: 4,
  easy: 5,
};

const todayISO = () => new Date().toISOString().slice(0, 10);
const addDays = (iso: string, days: number) => {
  const d = new Date(iso);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
};

export function updateSRS(prev: SRSState, response: SRSResponse): SRSState {
  const q = QUALITY[response];
  const now = todayISO();

  let { easeFactor, interval, repetitions } = prev;

  if (q < 3) {
    // 忘了 → 重新開始
    repetitions = 0;
    interval = 1;
  } else {
    repetitions += 1;
    if (repetitions === 1) interval = 1;
    else if (repetitions === 2) interval = 3;
    else interval = Math.round(interval * easeFactor);
  }

  // 更新 ease factor
  easeFactor = easeFactor + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));
  if (easeFactor < 1.3) easeFactor = 1.3;

  // easy 多加碼一次
  if (response === 'easy') interval = Math.round(interval * 1.3);

  const nextReviewAt = addDays(now, interval);

  // 狀態升級
  let status: SRSState['status'] = prev.status;
  if (response === 'forgot') status = 'learning';
  else if (repetitions >= 5 && easeFactor > 2.5) status = 'mastered';
  else if (repetitions >= 1) status = 'review';

  return {
    easeFactor,
    interval,
    repetitions,
    nextReviewAt,
    lastReviewedAt: now,
    status,
  };
}

/** 取出今日該複習的單字 ID */
export function getDueWordIds(
  entries: Record<string, { id: string; srs: SRSState }>,
  today: string = todayISO(),
): string[] {
  return Object.values(entries)
    .filter((e) => e.srs.status !== 'mastered' && e.srs.nextReviewAt <= today)
    .sort((a, b) => a.srs.nextReviewAt.localeCompare(b.srs.nextReviewAt))
    .map((e) => e.id);
}
