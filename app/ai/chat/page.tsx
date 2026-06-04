'use client';

import { useState } from 'react';
import GlassCard from '@/components/ui/GlassCard';
import ChatStream from '@/components/ai/ChatStream';
import { scenarios, scenarioPrompt, lunaTutorPrompt, type Scenario } from '@/lib/ai/prompts';

export default function AIChatPage() {
  const [scenario, setScenario] = useState<Scenario | null>(null);

  return (
    <div className="space-y-5">
      <header className="px-1">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">情境對話練習</h1>
        <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
          選一個情境 · Luna 扮演對方 · 邊聊邊糾錯
        </p>
      </header>

      {!scenario ? (
        <GlassCard className="p-5">
          <div className="mb-3 text-xs font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)]">
            選擇情境
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {scenarios.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setScenario(s)}
                className="flex items-center gap-3 rounded-2xl bg-white/50 p-3 text-left ring-1 ring-inset ring-black/5 transition hover:bg-white/70 hover:shadow-card"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#5B5BF0]/10 text-xl">
                  {s.emoji}
                </div>
                <div>
                  <div className="text-sm font-bold">{s.title}</div>
                  <div className="text-[11px] text-[var(--color-text-tertiary)]">
                    {s.opening.slice(0, 38)}{s.opening.length > 38 ? '…' : ''}
                  </div>
                </div>
              </button>
            ))}
            <button
              type="button"
              onClick={() => setScenario({ id: 'general', emoji: '💬', title: '自由聊天', role: 'Luna', opening: '嗨！想聊什麼？' })}
              className="flex items-center gap-3 rounded-2xl bg-gradient-to-r from-[#7C7CFF]/15 to-[#5B5BF0]/10 p-3 text-left ring-1 ring-inset ring-[#5B5BF0]/20 transition hover:shadow-card sm:col-span-2"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#5B5BF0]/15 text-xl">
                💬
              </div>
              <div>
                <div className="text-sm font-bold">自由聊天</div>
                <div className="text-[11px] text-[var(--color-text-tertiary)]">不限主題，跟 Luna 聊任何事</div>
              </div>
            </button>
          </div>
        </GlassCard>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between rounded-2xl bg-white/50 px-4 py-2 ring-1 ring-inset ring-black/5">
            <div className="flex items-center gap-2">
              <span className="text-xl">{scenario.emoji}</span>
              <span className="text-sm font-bold">{scenario.title}</span>
            </div>
            <button
              type="button"
              onClick={() => setScenario(null)}
              className="text-xs text-[#5B5BF0] hover:underline"
            >
              換情境
            </button>
          </div>
          <ChatStream
            key={scenario.id}
            systemPrompt={scenario.id === 'general' ? lunaTutorPrompt() : scenarioPrompt(scenario)}
            greeting={scenario.opening}
            placeholder="用英文回應…"
            ttsAssistant
          />
        </div>
      )}
    </div>
  );
}
