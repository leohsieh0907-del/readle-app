/**
 * 成就解鎖引擎 — 每次活動結束呼叫 checkAndUnlock，回傳新解鎖的成就
 */

import { Repo } from '../storage/repo';
import { vocabRepo, progressRepo, historyRepo } from '../storage/repos';
import { achievements, type AchievementDef } from './registry';

interface AchievementsStore {
  unlocked: Record<string, { id: string; unlockedAt: string }>;
  _version: 1;
}

export const achievementsRepo = new Repo<AchievementsStore>('readle.achievements', {
  unlocked: {},
  _version: 1,
});

export function checkAndUnlock(): AchievementDef[] {
  const progress = progressRepo.get();
  const vocab = vocabRepo.get();
  const history = historyRepo.get();
  const store = achievementsRepo.get();
  const now = new Date().toISOString();

  const newly: AchievementDef[] = [];
  const updated = { ...store.unlocked };

  for (const a of achievements) {
    if (updated[a.id]) continue;
    if (a.check({ progress, vocab, history })) {
      updated[a.id] = { id: a.id, unlockedAt: now };
      newly.push(a);
    }
  }

  if (newly.length > 0) {
    achievementsRepo.set({ ...store, unlocked: updated });
  }
  return newly;
}

export function getUnlockedIds(): Set<string> {
  return new Set(Object.keys(achievementsRepo.get().unlocked));
}
