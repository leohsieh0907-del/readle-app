'use client';

import { useEffect, useState } from 'react';
import { Volume2, Sparkles, Info } from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';
import {
  listEnglishVoices, hasNeuralVoice, setVoiceByName, getCurrentVoiceName,
  setSpeechRate, getSpeechRate, speak, unlockSpeech,
} from '@/lib/speech/tts';

interface VoiceItem { name: string; lang: string; neural: boolean }

export default function VoiceSettings() {
  const [voices, setVoices] = useState<VoiceItem[]>([]);
  const [current, setCurrent] = useState('');
  const [rate, setRate] = useState(0.95);
  const [neural, setNeural] = useState(true);

  // 語音清單非同步載入，voiceschanged 後重抓
  useEffect(() => {
    const refresh = () => {
      setVoices(listEnglishVoices());
      setCurrent(getCurrentVoiceName());
      setNeural(hasNeuralVoice());
    };
    refresh();
    setRate(getSpeechRate());
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.addEventListener?.('voiceschanged', refresh);
      const t = setTimeout(refresh, 800);
      return () => {
        window.speechSynthesis.removeEventListener?.('voiceschanged', refresh);
        clearTimeout(t);
      };
    }
  }, []);

  const onPickVoice = (name: string) => {
    setVoiceByName(name);
    setCurrent(name);
  };
  const onRate = (r: number) => {
    setRate(r);
    setSpeechRate(r);
  };
  const preview = () => {
    unlockSpeech();
    speak({ text: 'Hello! This is how I sound.', rate });
  };

  return (
    <GlassCard className="p-5">
      <div className="mb-1 flex items-center gap-2 font-bold">
        <Volume2 size={16} className="text-[#5B5BF0]" /> 發音設定
      </div>
      <p className="mb-4 text-xs text-[var(--color-text-tertiary)]">
        全站發音（單字、例句、Luna、朗讀）都用這裡的設定
      </p>

      {/* 沒有神經語音 → 建議用 Edge */}
      {!neural && (
        <div className="mb-4 flex items-start gap-2 rounded-xl bg-[#FFB84D]/12 p-3 text-xs text-[#92560a] ring-1 ring-inset ring-[#FFB84D]/30">
          <Info size={14} className="mt-0.5 shrink-0" />
          <span>目前沒偵測到「神經語音」。用 <b>Microsoft Edge</b> 開啟本站可獲得更自然的語音（Aria 等 Natural 語音）。</span>
        </div>
      )}

      {/* 語音選擇 */}
      <label className="mb-1.5 block text-xs font-semibold text-[var(--color-text-secondary)]">語音</label>
      <select
        value={current}
        onChange={(e) => onPickVoice(e.target.value)}
        className="mb-4 w-full rounded-xl bg-white/70 px-3 py-2.5 text-sm ring-1 ring-inset ring-black/8 outline-none focus:ring-[#5B5BF0]/40"
      >
        {voices.length === 0 && <option>載入語音中…</option>}
        {voices.map((v) => (
          <option key={v.name} value={v.name}>
            {v.neural ? '✨ ' : ''}{v.name} ({v.lang})
          </option>
        ))}
      </select>

      {/* 語速 */}
      <div className="mb-4">
        <div className="mb-1.5 flex items-center justify-between text-xs font-semibold text-[var(--color-text-secondary)]">
          <span>語速</span>
          <span className="font-mono text-[#5B5BF0]">{rate.toFixed(2)}x</span>
        </div>
        <input
          type="range" min={0.6} max={1.3} step={0.05} value={rate}
          onChange={(e) => onRate(Number(e.target.value))}
          className="w-full accent-[#5B5BF0]"
        />
        <div className="mt-1 flex justify-between text-[10px] text-[var(--color-text-tertiary)]">
          <span>🐢 慢</span><span>正常</span><span>快 🐇</span>
        </div>
      </div>

      {/* 試聽 */}
      <button
        type="button"
        onClick={preview}
        className="btn-primary inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl text-sm font-medium"
      >
        <Sparkles size={15} /> 試聽
      </button>

      <p className="mt-2 text-center text-[10px] text-[var(--color-text-tertiary)]">
        ✨ = 神經/自然語音（音質較佳）
      </p>
    </GlassCard>
  );
}
