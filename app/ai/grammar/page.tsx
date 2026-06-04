'use client';

import { useState } from 'react';
import { Sparkles, CheckCircle2 } from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';
import SoftButton from '@/components/ui/SoftButton';
import { getProvider } from '@/lib/ai';
import { grammarCheckPrompt } from '@/lib/ai/prompts';
import { bumpQuota } from '@/lib/ai/provider';

export default function GrammarPage() {
  const [input, setInput] = useState('');
  const [result, setResult] = useState('');
  const [busy, setBusy] = useState(false);

  const check = async () => {
    const text = input.trim();
    if (!text) return;
    setBusy(true);
    setResult('');
    bumpQuota();
    try {
      const provider = getProvider();
      if (provider.chatStream) {
        let acc = '';
        for await (const chunk of provider.chatStream({
          messages: [{ role: 'user', content: text }],
          systemPrompt: grammarCheckPrompt(),
        })) {
          acc += chunk;
          setResult(acc);
        }
      } else {
        const res = await provider.chat({
          messages: [{ role: 'user', content: text }],
          systemPrompt: grammarCheckPrompt(),
        });
        setResult(res.content);
      }
    } catch (e) {
      setResult(`⚠️ ${e instanceof Error ? e.message : '錯誤'}`);
    }
    setBusy(false);
  };

  const samples = [
    'I have went to Tokyo last year.',
    'She don\'t like coffee very much.',
    'If I would have known, I would told you.',
  ];

  return (
    <div className="space-y-5">
      <header className="px-1">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">AI 文法檢查</h1>
        <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
          貼上英文句子 · AI 找錯 · 給修正與解釋
        </p>
      </header>

      <GlassCard className="p-5">
        <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)]">
          你的英文句子
        </label>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          rows={4}
          placeholder="例如：I have went to Tokyo last year."
          className="w-full rounded-xl border border-[var(--color-border)] bg-white/60 p-3 text-[15px] outline-none focus:border-[#5B5BF0] focus:ring-2 focus:ring-[#5B5BF0]/20"
        />

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <SoftButton
            variant="primary"
            size="md"
            onClick={check}
            disabled={!input.trim() || busy}
            leftIcon={<Sparkles size={14} />}
          >
            {busy ? '檢查中…' : '檢查文法'}
          </SoftButton>
          <span className="text-xs text-[var(--color-text-tertiary)]">或試試：</span>
          {samples.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setInput(s)}
              className="rounded-full bg-white/50 px-2.5 py-1 text-xs text-[var(--color-text-secondary)] ring-1 ring-inset ring-black/5 hover:bg-white/70"
            >
              {s.slice(0, 28)}…
            </button>
          ))}
        </div>
      </GlassCard>

      {result && (
        <GlassCard className="p-5">
          <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#5B5BF0]">
            <CheckCircle2 size={14} /> AI 修正
          </div>
          <div className="whitespace-pre-wrap rounded-xl bg-white/50 p-4 text-sm leading-relaxed ring-1 ring-inset ring-black/5">
            {result}
            {busy && <span className="ml-0.5 inline-block h-3 w-1 animate-pulse bg-current align-middle" />}
          </div>
        </GlassCard>
      )}
    </div>
  );
}
