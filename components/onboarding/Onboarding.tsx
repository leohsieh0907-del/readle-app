'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ArrowRight, Check } from 'lucide-react';
import { userRepo, vocabRepo, defaultUser } from '@/lib/storage/repos';
import { buildSeedVocab } from '@/lib/mock/seed-words';
import type { CEFR, Category, Goal } from '@/lib/readle-types';
import SoftButton from '@/components/ui/SoftButton';

interface OnboardingProps {
  onDone: () => void;
}

const levels: { id: CEFR; label: string; desc: string }[] = [
  { id: 'A2', label: '初級', desc: '能應付日常簡單對話' },
  { id: 'B1', label: '中級', desc: '看得懂大部分文章' },
  { id: 'B2', label: '中高', desc: '能流暢討論工作話題' },
  { id: 'C1', label: '高級', desc: '接近母語者程度' },
];

const interestsOptions: { id: Category; label: string; emoji: string }[] = [
  { id: 'toeic', label: '多益準備', emoji: '🎯' },
  { id: 'business', label: '商業職場', emoji: '💼' },
  { id: 'daily', label: '日常對話', emoji: '☕' },
  { id: 'travel', label: '旅遊英語', emoji: '✈️' },
  { id: 'tech', label: '科技英語', emoji: '💻' },
];

const goals: { id: Goal; label: string }[] = [
  { id: 'toeic_550', label: '多益 550' },
  { id: 'toeic_750', label: '多益 750' },
  { id: 'toeic_900', label: '多益 900' },
  { id: 'business', label: '商業溝通' },
  { id: 'daily', label: '日常聊天' },
  { id: 'travel', label: '出國旅遊' },
];

const dailyMinutes = [10, 20, 30, 60];

const avatars = ['🦉', '🐱', '🦊', '🐼', '🐰', '🦁', '🐢', '🐧'];

export default function Onboarding({ onDone }: OnboardingProps) {
  const [step, setStep] = useState(0);
  const [nickname, setNickname] = useState('');
  const [avatar, setAvatar] = useState('🦉');
  const [level, setLevel] = useState<CEFR>('B1');
  const [interests, setInterests] = useState<Category[]>(['toeic', 'daily']);
  const [goal, setGoal] = useState<Goal>('toeic_750');
  const [minutes, setMinutes] = useState(20);

  const toggleInterest = (id: Category) => {
    setInterests((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  };

  const finish = () => {
    userRepo.set({
      ...defaultUser,
      id: crypto.randomUUID(),
      nickname: nickname || '學習者',
      avatar,
      cefrLevel: level,
      goal,
      interests: interests.length > 0 ? interests : ['daily'],
      dailyGoalMinutes: minutes,
      createdAt: new Date().toISOString(),
    });
    // 注入種子單字
    vocabRepo.set({ entries: buildSeedVocab(), _version: 1 });
    onDone();
  };

  const steps = [
    {
      title: '歡迎來到 Happy English 👋',
      subtitle: '先告訴我們你的暱稱和頭像',
      content: (
        <div className="space-y-6">
          <div>
            <label className="mb-2 block text-sm font-medium text-[var(--color-text-secondary)]">
              暱稱
            </label>
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="例如：庭晰"
              maxLength={20}
              className="h-12 w-full rounded-xl border border-[var(--color-border)] bg-white/60 px-4 text-[15px] outline-none transition focus:border-[#5B5BF0] focus:ring-2 focus:ring-[#5B5BF0]/20"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-[var(--color-text-secondary)]">
              選個頭像
            </label>
            <div className="grid grid-cols-8 gap-2">
              {avatars.map((a) => (
                <button
                  key={a}
                  type="button"
                  onClick={() => setAvatar(a)}
                  className={`flex h-12 items-center justify-center rounded-xl text-2xl transition ${
                    avatar === a
                      ? 'bg-gradient-to-br from-[#7C7CFF]/25 to-[#5B5BF0]/15 ring-2 ring-[#5B5BF0]'
                      : 'bg-white/40 ring-1 ring-inset ring-black/5 hover:bg-white/70'
                  }`}
                >
                  {a}
                </button>
              ))}
            </div>
          </div>
        </div>
      ),
    },
    {
      title: '你的英文程度？',
      subtitle: '幫助我們推薦適合的內容',
      content: (
        <div className="grid grid-cols-2 gap-3">
          {levels.map((l) => (
            <button
              key={l.id}
              type="button"
              onClick={() => setLevel(l.id)}
              className={`flex flex-col items-start gap-1 rounded-2xl p-4 text-left transition ${
                level === l.id
                  ? 'bg-gradient-to-br from-[#7C7CFF]/20 to-[#5B5BF0]/10 ring-2 ring-[#5B5BF0]'
                  : 'bg-white/40 ring-1 ring-inset ring-black/5 hover:bg-white/70'
              }`}
            >
              <div className="text-base font-bold">
                {l.label} <span className="text-xs text-[var(--color-text-tertiary)]">{l.id}</span>
              </div>
              <div className="text-xs text-[var(--color-text-secondary)]">{l.desc}</div>
            </button>
          ))}
        </div>
      ),
    },
    {
      title: '你的學習目標？',
      subtitle: '可多選你感興趣的領域',
      content: (
        <div className="space-y-5">
          <div>
            <div className="mb-2 text-sm font-medium text-[var(--color-text-secondary)]">
              我的目標
            </div>
            <div className="grid grid-cols-2 gap-2">
              {goals.map((g) => (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => setGoal(g.id)}
                  className={`h-11 rounded-xl text-sm font-medium transition ${
                    goal === g.id
                      ? 'bg-gradient-to-r from-[#7C7CFF] to-[#5B5BF0] text-white shadow-card'
                      : 'bg-white/50 text-[var(--color-text-primary)] ring-1 ring-inset ring-black/5 hover:bg-white/70'
                  }`}
                >
                  {g.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <div className="mb-2 text-sm font-medium text-[var(--color-text-secondary)]">
              我想學的領域（多選）
            </div>
            <div className="flex flex-wrap gap-2">
              {interestsOptions.map((opt) => {
                const active = interests.includes(opt.id);
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => toggleInterest(opt.id)}
                    className={`inline-flex h-9 items-center gap-1.5 rounded-full px-3.5 text-sm font-medium transition ${
                      active
                        ? 'bg-gradient-to-r from-[#7C7CFF] to-[#5B5BF0] text-white shadow-card'
                        : 'bg-white/50 text-[var(--color-text-primary)] ring-1 ring-inset ring-black/5 hover:bg-white/70'
                    }`}
                  >
                    <span>{opt.emoji}</span>
                    {opt.label}
                    {active && <Check size={14} strokeWidth={3} />}
                  </button>
                );
              })}
            </div>
          </div>
          <div>
            <div className="mb-2 text-sm font-medium text-[var(--color-text-secondary)]">
              每日學習目標
            </div>
            <div className="grid grid-cols-4 gap-2">
              {dailyMinutes.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMinutes(m)}
                  className={`h-11 rounded-xl text-sm font-bold transition ${
                    minutes === m
                      ? 'bg-gradient-to-r from-[#7C7CFF] to-[#5B5BF0] text-white shadow-card'
                      : 'bg-white/50 text-[var(--color-text-primary)] ring-1 ring-inset ring-black/5 hover:bg-white/70'
                  }`}
                >
                  {m} 分
                </button>
              ))}
            </div>
          </div>
        </div>
      ),
    },
  ];

  const current = steps[step];
  const isLast = step === steps.length - 1;

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/30 backdrop-blur-sm sm:items-center">
      <motion.div
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.35, ease: [0.32, 0.72, 0, 1] }}
        className="glass-strong w-full max-w-md rounded-t-3xl p-6 sm:rounded-3xl"
      >
        <div className="mb-5 flex items-center gap-2">
          <Sparkles size={18} className="text-[#5B5BF0]" />
          <span className="text-xs font-semibold uppercase tracking-wider text-[#5B5BF0]">
            Step {step + 1} / {steps.length}
          </span>
        </div>
        <h2 className="text-2xl font-bold tracking-tight">{current.title}</h2>
        <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
          {current.subtitle}
        </p>

        <div className="mt-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -20, opacity: 0 }}
              transition={{ duration: 0.25 }}
            >
              {current.content}
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="mt-7 flex items-center justify-between gap-3">
          <SoftButton
            variant="ghost"
            size="md"
            onClick={() => setStep(Math.max(0, step - 1))}
            disabled={step === 0}
            className={step === 0 ? 'invisible' : ''}
          >
            上一步
          </SoftButton>

          {isLast ? (
            <SoftButton variant="primary" size="md" onClick={finish}>
              開始學習 <ArrowRight size={16} />
            </SoftButton>
          ) : (
            <SoftButton variant="primary" size="md" onClick={() => setStep(step + 1)}>
              下一步 <ArrowRight size={16} />
            </SoftButton>
          )}
        </div>
      </motion.div>
    </div>
  );
}
