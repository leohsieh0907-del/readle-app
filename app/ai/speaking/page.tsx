'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Mic, Volume2, RotateCcw } from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';
import SoftButton from '@/components/ui/SoftButton';
import { speak } from '@/lib/speech/tts';
import {
  isRecognitionAvailable,
  recognize,
  scoreTranscript,
  type SpeechResult,
} from '@/lib/speech/score';

const presets = [
  'Could you elaborate on your proposal?',
  'I would appreciate your prompt response.',
  'We need to leverage our existing network.',
  'Let me know if you need any clarification.',
];

export default function SpeakingPage() {
  const [target, setTarget] = useState(presets[0]);
  const [custom, setCustom] = useState('');
  const [stage, setStage] = useState<'idle' | 'listening' | 'scoring' | 'done'>('idle');
  const [result, setResult] = useState<SpeechResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const available = isRecognitionAvailable();

  const startRecord = async () => {
    if (!available) {
      setError('你的瀏覽器不支援錄音識別，建議用 Chrome / Edge');
      return;
    }
    setError(null);
    setStage('listening');
    try {
      const { transcript, confidence } = await recognize({ lang: 'en-US', timeoutMs: 10000 });
      setStage('scoring');
      await new Promise((r) => setTimeout(r, 500));
      const r = scoreTranscript(target, transcript, confidence);
      setResult(r);
      setStage('done');
    } catch (e) {
      setError(e instanceof Error ? e.message : '錄音失敗');
      setStage('idle');
    }
  };

  const reset = () => {
    setResult(null);
    setStage('idle');
  };

  return (
    <div className="space-y-5">
      <header className="px-1">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">AI 口說評分</h1>
        <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
          選或輸入一句英文 · 念出來 · AI 打分 + 回饋
        </p>
      </header>

      <GlassCard className="p-5">
        <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)]">
          目標句子
        </label>
        <textarea
          value={custom || target}
          onChange={(e) => {
            setCustom(e.target.value);
            setTarget(e.target.value);
            reset();
          }}
          rows={2}
          className="w-full rounded-xl border border-[var(--color-border)] bg-white/60 p-3 text-[15px] outline-none focus:border-[#5B5BF0] focus:ring-2 focus:ring-[#5B5BF0]/20"
        />

        <div className="mt-2 flex flex-wrap gap-1.5">
          {presets.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => { setCustom(''); setTarget(p); reset(); }}
              className="rounded-full bg-white/50 px-2.5 py-1 text-xs text-[var(--color-text-secondary)] ring-1 ring-inset ring-black/5 hover:bg-white/70"
            >
              {p.slice(0, 24)}…
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => speak({ text: target })}
          className="mt-3 inline-flex h-9 items-center gap-1.5 rounded-full bg-[#5B5BF0]/10 px-3 text-sm font-medium text-[#5B5BF0] hover:bg-[#5B5BF0]/20"
        >
          <Volume2 size={14} /> 聽原音
        </button>
      </GlassCard>

      <GlassCard className="glass-strong p-7 text-center">
        {stage === 'idle' && (
          <button
            type="button"
            onClick={startRecord}
            className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-[#FF6B9D] to-[#D946EF] text-white shadow-hover transition hover:scale-105 mx-auto"
          >
            <Mic size={40} />
          </button>
        )}
        {stage === 'listening' && (
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-[#FF6B9D] to-[#D946EF] text-white anim-pulse-glow mx-auto">
            <Mic size={40} />
          </div>
        )}
        {stage === 'scoring' && (
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-[#7C7CFF] to-[#5B5BF0] text-white mx-auto">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/30 border-t-white" />
          </div>
        )}
        {stage === 'done' && result && (
          <motion.div
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 240, damping: 18 }}
            className="inline-flex flex-col items-center"
          >
            <div
              className="flex h-24 w-24 items-center justify-center rounded-full text-4xl font-bold text-white shadow-card"
              style={{
                background: `linear-gradient(135deg, ${
                  result.score >= 80 ? '#4ADE80' : result.score >= 60 ? '#FBBF24' : '#F87171'
                }cc, ${result.score >= 80 ? '#22C55E' : result.score >= 60 ? '#F59E0B' : '#EF4444'})`,
              }}
            >
              {result.score}
            </div>
          </motion.div>
        )}

        <div className="mt-4 text-sm text-[var(--color-text-secondary)]">
          {stage === 'idle' && '點按鈕開始錄音'}
          {stage === 'listening' && '正在聽…說完會自動停止'}
          {stage === 'scoring' && '分析中…'}
          {stage === 'done' && result && (
            <>
              <div className="font-bold">{result.feedback}</div>
              <div className="mt-1 text-xs text-[var(--color-text-tertiary)]">
                你說了：「{result.transcript || '(沒聽到聲音)'}」
              </div>
            </>
          )}
          {error && <span className="text-[#F87171]">{error}</span>}
        </div>

        {stage === 'done' && (
          <div className="mt-5 flex flex-col items-center gap-2 sm:flex-row sm:justify-center">
            <SoftButton variant="secondary" size="md" onClick={() => speak({ text: target })} leftIcon={<Volume2 size={14} />}>
              再聽原音
            </SoftButton>
            <SoftButton variant="primary" size="md" onClick={reset} leftIcon={<RotateCcw size={14} />}>
              再試一次
            </SoftButton>
          </div>
        )}
      </GlassCard>
    </div>
  );
}
