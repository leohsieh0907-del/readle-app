'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Download, Trash2, AlertTriangle } from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';
import SoftButton from '@/components/ui/SoftButton';
import ContentRefresher from '@/components/ContentRefresher';
import VoiceSettings from '@/components/settings/VoiceSettings';
import { userRepo, settingsRepo } from '@/lib/storage/repos';
import { exportAll, clearAll } from '@/lib/storage/repo';
import type { Settings, User } from '@/lib/readle-types';

const avatars = ['🦉', '🐱', '🦊', '🐼', '🐰', '🦁', '🐢', '🐧'];

export default function SettingsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);

  useEffect(() => {
    setUser(userRepo.get());
    setSettings(settingsRepo.get());
  }, []);

  if (!user || !settings) return null;

  const updateUser = (patch: Partial<User>) => {
    const next = { ...user, ...patch };
    setUser(next);
    userRepo.set(next);
  };
  const updateSettings = (patch: Partial<Settings>) => {
    const next = { ...settings, ...patch };
    setSettings(next);
    settingsRepo.set(next);
  };
  const updatePlayer = (patch: Partial<Settings['player']>) => {
    updateSettings({ player: { ...settings.player, ...patch } });
  };
  const updateAI = (patch: Partial<Settings['ai']>) => {
    updateSettings({ ai: { ...settings.ai, ...patch } });
  };

  const handleExport = () => {
    const blob = new Blob([exportAll()], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `readle-export-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleClear = () => {
    if (!confirmClear) {
      setConfirmClear(true);
      setTimeout(() => setConfirmClear(false), 5000);
      return;
    }
    clearAll();
    location.href = '/';
  };

  return (
    <div className="space-y-5">
      <header className="px-1">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">設定</h1>
        <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
          所有變更即時生效並儲存到本地
        </p>
      </header>

      {/* 帳號 */}
      <Section title="帳號">
        <Field label="暱稱">
          <input
            type="text"
            value={user.nickname}
            onChange={(e) => updateUser({ nickname: e.target.value })}
            maxLength={20}
            className="h-10 w-full rounded-xl border border-[var(--color-border)] bg-white/60 px-3 text-sm outline-none focus:border-[#5B5BF0] focus:ring-2 focus:ring-[#5B5BF0]/20"
          />
        </Field>
        <Field label="頭像">
          <div className="grid grid-cols-8 gap-1.5">
            {avatars.map((a) => (
              <button
                key={a}
                type="button"
                onClick={() => updateUser({ avatar: a })}
                className={`flex h-9 items-center justify-center rounded-lg text-xl transition ${
                  user.avatar === a
                    ? 'bg-[#5B5BF0]/15 ring-2 ring-[#5B5BF0]'
                    : 'bg-white/40 ring-1 ring-inset ring-black/5 hover:bg-white/70'
                }`}
              >
                {a}
              </button>
            ))}
          </div>
        </Field>
        <Field label="每日學習目標">
          <select
            value={user.dailyGoalMinutes}
            onChange={(e) => updateUser({ dailyGoalMinutes: Number(e.target.value) })}
            className="h-10 w-full rounded-xl border border-[var(--color-border)] bg-white/60 px-3 text-sm"
          >
            {[10, 20, 30, 60].map((m) => (
              <option key={m} value={m}>
                {m} 分鐘 / 天
              </option>
            ))}
          </select>
        </Field>
      </Section>

      {/* 影片偏好 */}
      <Section title="影片偏好">
        <Field label={`預設播放速度（目前 ${settings.player.defaultSpeed.toFixed(2)}x）`}>
          <input
            type="range"
            min={0.5}
            max={2}
            step={0.25}
            value={settings.player.defaultSpeed}
            onChange={(e) => updatePlayer({ defaultSpeed: Number(e.target.value) })}
            className="w-full"
          />
        </Field>
        <Field label="預設字幕模式">
          <div className="grid grid-cols-4 gap-1.5">
            {(['both', 'en', 'zh', 'off'] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => updatePlayer({ defaultSubtitleMode: m })}
                className={`h-9 rounded-lg text-xs font-medium transition ${
                  settings.player.defaultSubtitleMode === m
                    ? 'bg-gradient-to-r from-[#7C7CFF] to-[#5B5BF0] text-white'
                    : 'bg-white/50 ring-1 ring-inset ring-black/5 hover:bg-white/70'
                }`}
              >
                {{ both: '中英', en: '僅英', zh: '僅中', off: '無' }[m]}
              </button>
            ))}
          </div>
        </Field>
      </Section>

      {/* AI 助教 */}
      <Section title="AI 助教">
        <Field label="模型提供者">
          <div className="grid grid-cols-3 gap-1.5">
            {(['mock', 'gemini', 'groq'] as const).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => updateAI({ provider: p })}
                className={`h-9 rounded-lg text-xs font-medium transition ${
                  settings.ai.provider === p
                    ? 'bg-gradient-to-r from-[#7C7CFF] to-[#5B5BF0] text-white'
                    : 'bg-white/50 ring-1 ring-inset ring-black/5 hover:bg-white/70'
                }`}
              >
                {{ mock: 'Mock', gemini: 'Gemini', groq: 'Groq' }[p]}
              </button>
            ))}
          </div>
          <p className="mt-1 text-xs text-[var(--color-text-tertiary)]">
            Phase 1 階段預設使用 Mock。Phase 4 接入 Gemini 後可切換。
          </p>
        </Field>
        <Field label="回覆語氣">
          <div className="grid grid-cols-3 gap-1.5">
            {(['strict', 'friendly', 'humorous'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => updateAI({ tone: t })}
                className={`h-9 rounded-lg text-xs font-medium transition ${
                  settings.ai.tone === t
                    ? 'bg-gradient-to-r from-[#7C7CFF] to-[#5B5BF0] text-white'
                    : 'bg-white/50 ring-1 ring-inset ring-black/5 hover:bg-white/70'
                }`}
              >
                {{ strict: '嚴格', friendly: '友善', humorous: '幽默' }[t]}
              </button>
            ))}
          </div>
        </Field>
      </Section>

      {/* 發音 */}
      <VoiceSettings />

      {/* 資料 */}
      <Section title="資料">
        <ContentRefresher />

        <button
          type="button"
          onClick={handleExport}
          className="flex w-full items-center justify-between rounded-xl bg-white/50 px-4 py-3 text-left ring-1 ring-inset ring-black/5 hover:bg-white/70"
        >
          <div>
            <div className="text-sm font-semibold">匯出我的資料</div>
            <div className="text-xs text-[var(--color-text-tertiary)]">下載 JSON 備份檔</div>
          </div>
          <Download size={18} className="text-[var(--color-text-secondary)]" />
        </button>

        <button
          type="button"
          onClick={handleClear}
          className={`flex w-full items-center justify-between rounded-xl px-4 py-3 text-left ring-1 ring-inset transition ${
            confirmClear
              ? 'bg-[#F87171]/15 ring-[#EF4444]/40 text-[#B91C1C]'
              : 'bg-white/50 ring-black/5 hover:bg-[#F87171]/8'
          }`}
        >
          <div>
            <div className="flex items-center gap-1.5 text-sm font-semibold">
              {confirmClear && <AlertTriangle size={14} />}
              {confirmClear ? '再按一次以確認清除全部資料' : '清除全部資料'}
            </div>
            <div className="text-xs opacity-80">
              {confirmClear ? '此操作無法復原' : '會刪除單字本、紀錄、設定、進度'}
            </div>
          </div>
          <Trash2 size={18} className={confirmClear ? 'text-[#B91C1C]' : 'text-[var(--color-text-secondary)]'} />
        </button>
      </Section>

      <GlassCard className="p-5 text-center text-xs text-[var(--color-text-tertiary)]">
        Readle v0.3.0 · Phase 3 · 你的資料儲存在本機，不會上傳
      </GlassCard>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <GlassCard className="p-5">
      <div className="mb-3 text-xs font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)]">
        {title}
      </div>
      <div className="space-y-4">{children}</div>
    </GlassCard>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-[var(--color-text-secondary)]">
        {label}
      </label>
      {children}
    </div>
  );
}
