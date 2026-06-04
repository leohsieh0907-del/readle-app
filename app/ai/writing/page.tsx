'use client';

import { useState } from 'react';
import { Sparkles, Mail, FileText, GraduationCap, Coffee } from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';
import SoftButton from '@/components/ui/SoftButton';
import { getProvider } from '@/lib/ai';
import { writingAssistantPrompt } from '@/lib/ai/prompts';
import { bumpQuota } from '@/lib/ai/provider';

type Style = 'email' | 'resume' | 'academic' | 'casual';

const styles: { id: Style; label: string; icon: React.ReactNode }[] = [
  { id: 'email', label: 'Email', icon: <Mail size={14} /> },
  { id: 'resume', label: '履歷', icon: <FileText size={14} /> },
  { id: 'academic', label: '學術', icon: <GraduationCap size={14} /> },
  { id: 'casual', label: '口語', icon: <Coffee size={14} /> },
];

interface Result {
  errors?: { original: string; corrected: string; reason: string }[];
  rewrites?: string[];
  tip?: string;
  raw?: string;
}

export default function WritingPage() {
  const [input, setInput] = useState('');
  const [style, setStyle] = useState<Style>('email');
  const [result, setResult] = useState<Result | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    const text = input.trim();
    if (!text) return;
    setBusy(true);
    setResult(null);
    bumpQuota();
    try {
      const provider = getProvider();
      const res = await provider.chat({
        messages: [{ role: 'user', content: text }],
        systemPrompt: writingAssistantPrompt(style),
        jsonMode: true,
      });
      try {
        const parsed = JSON.parse(res.content) as Result;
        setResult(parsed);
      } catch {
        setResult({ raw: res.content });
      }
    } catch (e) {
      setResult({ raw: `⚠️ ${e instanceof Error ? e.message : '錯誤'}` });
    }
    setBusy(false);
  };

  return (
    <div className="space-y-5">
      <header className="px-1">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">AI 寫作助手</h1>
        <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
          AI 標出錯誤 · 給 3 種改寫風格
        </p>
      </header>

      <GlassCard className="p-5">
        <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)]">
          你寫的英文（可多句）
        </label>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          rows={6}
          placeholder="貼上你的英文段落，AI 會幫你優化…"
          className="w-full rounded-xl border border-[var(--color-border)] bg-white/60 p-3 text-[15px] outline-none focus:border-[#5B5BF0] focus:ring-2 focus:ring-[#5B5BF0]/20"
        />

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="text-xs text-[var(--color-text-tertiary)]">風格：</span>
          {styles.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setStyle(s.id)}
              className={`inline-flex h-8 items-center gap-1 rounded-full px-3 text-xs font-medium transition ${
                style === s.id
                  ? 'bg-gradient-to-r from-[#7C7CFF] to-[#5B5BF0] text-white shadow-card'
                  : 'bg-white/50 text-[var(--color-text-secondary)] ring-1 ring-inset ring-black/5 hover:bg-white/70'
              }`}
            >
              {s.icon} {s.label}
            </button>
          ))}
        </div>

        <div className="mt-3">
          <SoftButton
            variant="primary"
            size="md"
            onClick={submit}
            disabled={!input.trim() || busy}
            leftIcon={<Sparkles size={14} />}
          >
            {busy ? 'AI 優化中…' : '開始優化'}
          </SoftButton>
        </div>
      </GlassCard>

      {result && (
        <div className="space-y-3">
          {result.errors && result.errors.length > 0 && (
            <GlassCard className="p-5">
              <h3 className="mb-2 text-sm font-bold">錯誤與修正</h3>
              <div className="space-y-2">
                {result.errors.map((e, i) => (
                  <div key={i} className="rounded-xl bg-white/50 p-3 ring-1 ring-inset ring-black/5">
                    <div className="text-xs">
                      <span className="rounded bg-[#F87171]/15 px-2 py-0.5 font-mono text-[#B91C1C]">
                        {e.original}
                      </span>
                      <span className="mx-2 text-[var(--color-text-tertiary)]">→</span>
                      <span className="rounded bg-[#4ADE80]/15 px-2 py-0.5 font-mono text-[#15803d]">
                        {e.corrected}
                      </span>
                    </div>
                    <div className="mt-1.5 text-xs text-[var(--color-text-secondary)]">{e.reason}</div>
                  </div>
                ))}
              </div>
            </GlassCard>
          )}

          {result.rewrites && result.rewrites.length > 0 && (
            <GlassCard className="p-5">
              <h3 className="mb-2 text-sm font-bold">3 種改寫版本</h3>
              <div className="space-y-2">
                {result.rewrites.map((r, i) => (
                  <div
                    key={i}
                    className="rounded-xl bg-gradient-to-r from-[#5B5BF0]/8 to-[#7C7CFF]/4 p-3 text-sm leading-relaxed ring-1 ring-inset ring-[#5B5BF0]/15"
                  >
                    <span className="mr-2 font-bold text-[#5B5BF0]">v{i + 1}</span>
                    {r}
                  </div>
                ))}
              </div>
            </GlassCard>
          )}

          {result.tip && (
            <GlassCard className="p-4 text-sm leading-relaxed">💡 {result.tip}</GlassCard>
          )}

          {result.raw && (
            <GlassCard className="p-5 whitespace-pre-wrap text-sm">{result.raw}</GlassCard>
          )}
        </div>
      )}
    </div>
  );
}
