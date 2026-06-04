'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, Check, X, Zap, PlayCircle, BookOpen, Trophy, Sparkles } from 'lucide-react';
import seedVideosData from '@/data/videos.json';
import type { MockVideo } from '@/lib/readle-types';
import { vocabRepo, progressRepo, historyRepo } from '@/lib/storage/repos';
import { checkAndUnlock } from '@/lib/achievements/engine';

const videos = seedVideosData as MockVideo[];
const SUBTITLE_CACHE_PREFIX = 'readle.subs.';

interface TaskResult {
  id: string;
  label: string;
  status: 'pending' | 'running' | 'ok' | 'fail' | 'skip';
  detail?: string;
}

const SECTIONS = [
  { id: 'subtitles', label: '影片字幕',    icon: <PlayCircle size={14} />, color: 'text-[#5B5BF0]' },
  { id: 'vocab',     label: '單字 AI 例句', icon: <BookOpen size={14} />,   color: 'text-[#8B5CF6]' },
  { id: 'quiz',      label: '測驗弱點分析', icon: <Sparkles size={14} />,   color: 'text-[#06B6D4]' },
  { id: 'achieve',   label: '成就徽章',     icon: <Trophy size={14} />,     color: 'text-[#FFB84D]' },
] as const;

function sleep(ms: number) {
  return new Promise(r => setTimeout(r, ms));
}

export default function ContentRefresher() {
  const [open, setOpen] = useState(false);
  const [running, setRunning] = useState(false);
  const [tasks, setTasks] = useState<TaskResult[]>([]);
  const [phase, setPhase] = useState('');
  const [overallProgress, setOverallProgress] = useState(0);
  const [done, setDone] = useState(false);
  // 勾選的項目（預設全選）
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(SECTIONS.map(s => s.id))
  );

  const toggleSelect = (id: string) => {
    if (running) return;
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) { if (next.size > 1) next.delete(id); }
      else next.add(id);
      return next;
    });
  };

  const setTask = (id: string, patch: Partial<TaskResult>) =>
    setTasks(prev => prev.map(t => t.id === id ? { ...t, ...patch } : t));

  // ── 1. 影片字幕 ──────────────────────────────────────────
  const updateSubtitles = async () => {
    const ytVideos = videos.filter(v => v.youtubeId);
    for (let i = 0; i < ytVideos.length; i++) {
      const v = ytVideos[i];
      setTask('subtitles', { status: 'running', detail: `${i + 1}/${ytVideos.length} ${v.title.slice(0, 25)}…` });
      try {
        localStorage.removeItem(SUBTITLE_CACHE_PREFIX + v.youtubeId);
        const res = await fetch(`/api/subtitles?v=${v.youtubeId}&title=${encodeURIComponent(v.title)}`);
        const data = await res.json() as { subtitles?: unknown[]; error?: string };
        if (data.subtitles && data.subtitles.length > 0) {
          localStorage.setItem(SUBTITLE_CACHE_PREFIX + v.youtubeId, JSON.stringify(data.subtitles));
        }
      } catch { /* 繼續下一部 */ }
      if (i < ytVideos.length - 1) await sleep(1500);
    }
    setTask('subtitles', { status: 'ok', detail: `${ytVideos.length} 部影片字幕已更新` });
  };

  // ── 2. 單字 AI 例句 ──────────────────────────────────────
  const updateVocabExamples = async () => {
    const vocab = vocabRepo.get();
    const entries = Object.values(vocab.entries);
    const noExample = entries.filter(e => e.examples.length === 0 || !e.examples[0]?.zh);
    if (noExample.length === 0) {
      setTask('vocab', { status: 'skip', detail: '所有單字都已有例句' });
      return;
    }
    const batch = noExample.slice(0, 5);
    setTask('vocab', { status: 'running', detail: `補充 ${batch.length} 個單字的例句…` });
    try {
      const prompt = `為以下英文單字各生成一個自然例句，附上繁體中文翻譯。
回傳 JSON 陣列：[{"word":"...","en":"English sentence.","zh":"中文翻譯"}]
只輸出 JSON，不要其他說明。

單字：${batch.map(e => e.word).join(', ')}`;
      const res = await fetch('/api/ai/chat', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [{ role: 'user', content: prompt }], temperature: 0.3, maxTokens: 1500, jsonMode: true }),
      });
      const data = await res.json() as { content?: string };
      const parsed = JSON.parse(data.content ?? '[]') as { word: string; en: string; zh: string }[];
      if (Array.isArray(parsed) && parsed.length > 0) {
        vocabRepo.update(s => {
          const updated = { ...s.entries };
          for (const e of parsed) {
            const found = Object.values(updated).find(v => v.word.toLowerCase() === e.word.toLowerCase());
            if (found) {
              updated[found.id] = { ...found, examples: [{ en: e.en, zh: e.zh, generatedByAI: true }, ...found.examples.slice(0, 2)] };
            }
          }
          return { ...s, entries: updated };
        });
        setTask('vocab', { status: 'ok', detail: `已為 ${parsed.length} 個單字補充 AI 例句` });
      } else {
        setTask('vocab', { status: 'skip', detail: '例句已是最新' });
      }
    } catch {
      setTask('vocab', { status: 'fail', detail: 'AI 服務暫時忙碌，稍後再試' });
    }
  };

  // ── 3. 測驗弱點分析 ──────────────────────────────────────
  const updateQuizAnalysis = async () => {
    const history = historyRepo.get();
    const quizActs = history.activities.filter(a => a.type === 'quiz');
    if (quizActs.length === 0) {
      setTask('quiz', { status: 'skip', detail: '還沒有測驗紀錄，先去做幾題吧' });
      return;
    }
    setTask('quiz', { status: 'running', detail: '分析測驗表現…' });
    try {
      const recentScores = quizActs.slice(0, 10).map(a => a.detail).join('\n');
      const prompt = `根據以下學習者的測驗紀錄，用繁體中文給出 1 句具體的學習建議（直接說建議，不要編號）：\n\n${recentScores}`;
      const res = await fetch('/api/ai/chat', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [{ role: 'user', content: prompt }], temperature: 0.4, maxTokens: 150 }),
      });
      const data = await res.json() as { content?: string };
      const tip = (data.content ?? '').trim().slice(0, 80);
      setTask('quiz', { status: 'ok', detail: tip || `分析了 ${quizActs.length} 筆測驗紀錄` });
    } catch {
      setTask('quiz', { status: 'fail', detail: 'AI 暫時忙碌' });
    }
  };

  // ── 4. 成就徽章 ──────────────────────────────────────────
  const updateAchievements = async () => {
    setTask('achieve', { status: 'running', detail: '檢查解鎖條件…' });
    const newly = checkAndUnlock();
    if (newly.length > 0) {
      setTask('achieve', { status: 'ok', detail: `🎉 解鎖了 ${newly.length} 個新徽章：${newly.map(a => a.icon + a.label).join(' ')}` });
    } else {
      const p = progressRepo.get();
      setTask('achieve', { status: 'ok', detail: `已是最新（連續 ${p.currentStreak} 天 · 等級 ${p.level}）` });
    }
  };

  // ── 主流程（只執行勾選的項目）────────────────────────────
  const start = async () => {
    setRunning(true);
    setDone(false);
    setOverallProgress(0);

    const allSteps: { id: string; fn: () => Promise<void> }[] = [
      { id: 'subtitles', fn: updateSubtitles },
      { id: 'vocab',     fn: updateVocabExamples },
      { id: 'quiz',      fn: updateQuizAnalysis },
      { id: 'achieve',   fn: updateAchievements },
    ];
    const steps = allSteps.filter(s => selected.has(s.id));

    // 只初始化選中的任務
    setTasks(SECTIONS
      .filter(s => selected.has(s.id))
      .map(s => ({ id: s.id, label: s.label, status: 'pending' as const }))
    );

    for (let i = 0; i < steps.length; i++) {
      const { id, fn } = steps[i];
      setPhase(SECTIONS.find(s => s.id === id)?.label ?? '');
      setOverallProgress(Math.round((i / steps.length) * 100));
      try { await fn(); } catch { setTask(id, { status: 'fail', detail: '執行失敗' }); }
    }

    setOverallProgress(100);
    setPhase('');
    setRunning(false);
    setDone(true);
  };

  const okCount = tasks.filter(t => t.status === 'ok').length;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full items-center justify-between rounded-xl bg-white/50 px-4 py-3 text-left ring-1 ring-inset ring-black/5 hover:bg-white/70 transition"
      >
        <div>
          <div className="flex items-center gap-1.5 text-sm font-semibold">
            <Zap size={14} className="text-[#FFB84D]" /> 一鍵更新全站內容
          </div>
          <div className="mt-0.5 text-xs text-[var(--color-text-tertiary)]">
            影片字幕 · 單字例句 · 測驗分析 · 成就徽章
          </div>
        </div>
        <RefreshCw size={16} className="text-[var(--color-text-secondary)]" />
      </button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => !running && setOpen(false)}
              className="fixed inset-0 z-[90] bg-black/30 backdrop-blur-sm" />

            <motion.div
              initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }}
              className="glass-strong fixed inset-x-4 bottom-4 z-[91] rounded-3xl p-6 sm:inset-x-auto sm:left-1/2 sm:w-[500px] sm:-translate-x-1/2"
            >
              {/* 標題 */}
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <div className="text-lg font-bold">一鍵更新全站內容</div>
                  <div className="text-xs text-[var(--color-text-tertiary)]">自動更新所有學習素材</div>
                </div>
                {!running && (
                  <button type="button" onClick={() => setOpen(false)}
                    className="rounded-full p-2 text-[var(--color-text-secondary)] hover:bg-black/5">
                    <X size={18} />
                  </button>
                )}
              </div>

              {/* 整體進度條 */}
              {(running || done) && (
                <div className="mb-4">
                  <div className="mb-1 flex justify-between text-xs text-[var(--color-text-tertiary)]">
                    <span>{running ? `正在更新：${phase}…` : `完成！${okCount}/${SECTIONS.length} 項成功`}</span>
                    <span>{overallProgress}%</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-black/[0.06]">
                    <div className="h-full rounded-full bg-gradient-to-r from-[#7C7CFF] to-[#5B5BF0] transition-all duration-500"
                      style={{ width: `${overallProgress}%` }} />
                  </div>
                </div>
              )}

              {/* 項目列表：待執行時勾選框，執行中/完成後狀態 */}
              <div className="mb-5 space-y-2">
                {SECTIONS.map(sec => {
                  const task = tasks.find(t => t.id === sec.id);
                  const isSelected = selected.has(sec.id);
                  const isIdle = !running && !done;

                  // 執行中 / 完成：顯示狀態
                  if (!isIdle && task) {
                    const detail = task.detail;
                    return (
                      <div key={sec.id} className={`flex items-start gap-3 rounded-xl p-3 transition ${
                        task.status === 'ok'        ? 'bg-[#4ADE80]/10 ring-1 ring-inset ring-[#4ADE80]/20'
                        : task.status === 'fail'    ? 'bg-[#F87171]/10 ring-1 ring-inset ring-[#F87171]/20'
                        : task.status === 'running' ? 'bg-[#5B5BF0]/8 ring-1 ring-inset ring-[#5B5BF0]/20'
                        : task.status === 'skip'    ? 'bg-black/[0.02] ring-1 ring-inset ring-black/5 opacity-70'
                        : 'bg-black/[0.02] ring-1 ring-inset ring-black/5 opacity-40'
                      }`}>
                        <span className={`mt-0.5 ${sec.color}`}>{sec.icon}</span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold">{sec.label}</span>
                            {task.status === 'running' && <span className="h-3 w-3 animate-spin rounded-full border-2 border-[#5B5BF0]/30 border-t-[#5B5BF0]" />}
                            {task.status === 'ok'   && <Check size={13} className="text-[#15803d]" />}
                            {task.status === 'fail' && <X size={13} className="text-[#B91C1C]" />}
                            {task.status === 'skip' && <span className="text-[10px] text-[var(--color-text-tertiary)]">略過</span>}
                          </div>
                          {detail && <div className="mt-0.5 text-xs text-[var(--color-text-tertiary)]">{detail}</div>}
                        </div>
                      </div>
                    );
                  }

                  // 未執行：勾選框樣式
                  return (
                    <button
                      key={sec.id}
                      type="button"
                      onClick={() => toggleSelect(sec.id)}
                      className={`flex w-full items-center gap-3 rounded-xl p-3 text-left transition ${
                        isSelected
                          ? 'bg-[#5B5BF0]/8 ring-1 ring-inset ring-[#5B5BF0]/20'
                          : 'bg-black/[0.02] ring-1 ring-inset ring-black/5 opacity-50'
                      }`}
                    >
                      {/* 勾選框 */}
                      <div className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md transition ${
                        isSelected
                          ? 'bg-[#5B5BF0] shadow-card'
                          : 'bg-black/[0.06]'
                      }`}>
                        {isSelected && <Check size={12} strokeWidth={3} className="text-white" />}
                      </div>
                      <span className={`${sec.color}`}>{sec.icon}</span>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-semibold">{sec.label}</div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* 按鈕 */}
              <div className="flex gap-2">
                {!running && !done && (
                  <button type="button" onClick={start} disabled={selected.size === 0}
                    className="btn-primary flex-1 inline-flex h-11 items-center justify-center gap-2 rounded-xl font-medium disabled:opacity-40">
                    <RefreshCw size={16} />
                    開始更新（{selected.size} 項）
                  </button>
                )}
                {!running && done && (
                  <>
                    <button type="button" onClick={() => { setDone(false); setTasks([]); setSelected(new Set(SECTIONS.map(s => s.id))); }}
                      className="btn-secondary flex-1 inline-flex h-10 items-center justify-center gap-1.5 rounded-xl text-sm font-medium">
                      <RefreshCw size={14} /> 重新執行
                    </button>
                    <button type="button" onClick={() => setOpen(false)}
                      className="btn-primary flex-1 inline-flex h-10 items-center justify-center rounded-xl text-sm font-medium">
                      完成
                    </button>
                  </>
                )}
              </div>
              {!running && !done && (
                <p className="mt-2 text-center text-[10px] text-[var(--color-text-tertiary)]">
                  影片字幕約 1-2 分鐘 · 其餘各項 5-10 秒
                </p>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

