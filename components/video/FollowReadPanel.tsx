'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, Volume2, RotateCcw, ArrowRight, X } from 'lucide-react';
import { speak } from '@/lib/speech/tts';
import { isRecognitionAvailable, recognize, scoreTranscript, type SpeechResult } from '@/lib/speech/score';
import type { SubtitleLine } from '@/lib/readle-types';

interface FollowReadPanelProps {
  target: SubtitleLine;
  onNext: () => void;
  onClose: () => void;
}

type Stage = 'idle' | 'listening' | 'scoring' | 'done';

export default function FollowReadPanel({ target, onNext, onClose }: FollowReadPanelProps) {
  const [stage, setStage] = useState<Stage>('idle');
  const [result, setResult] = useState<SpeechResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const available = isRecognitionAvailable();

  const playOriginal = () => speak({ text: target.en });

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
      // 一點動畫感
      await new Promise((r) => setTimeout(r, 500));
      const r = scoreTranscript(target.en, transcript, confidence);
      setResult(r);
      setStage('done');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'recording failed');
      setStage('idle');
    }
  };

  const reset = () => {
    setResult(null);
    setStage('idle');
  };

  // 進場自動朗讀目標句
  useEffect(() => {
    const t = setTimeout(() => playOriginal(), 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target.en]);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[80] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      >
        <motion.div
          initial={{ y: 30, opacity: 0, scale: 0.96 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 20, opacity: 0 }}
          className="glass-strong w-full max-w-md rounded-3xl p-6"
        >
          <div className="mb-4 flex items-center justify-between">
            <div className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#FF6B9D]/20 to-[#D946EF]/20 px-3 py-1 text-xs font-bold text-[#D946EF]">
              <Mic size={12} /> 跟讀練習
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full p-2 text-[var(--color-text-tertiary)] hover:bg-black/5"
            >
              <X size={18} />
            </button>
          </div>

          <div className="rounded-2xl bg-white/50 p-4 ring-1 ring-inset ring-black/5">
            <div className="text-[15px] font-semibold leading-relaxed">{target.en}</div>
            <div className="mt-1 text-xs text-[var(--color-text-tertiary)]">{target.zh}</div>
          </div>

          <button
            type="button"
            onClick={playOriginal}
            className="mt-3 inline-flex h-10 items-center gap-1.5 rounded-full bg-[#5B5BF0]/10 px-4 text-sm font-medium text-[#5B5BF0] hover:bg-[#5B5BF0]/20"
          >
            <Volume2 size={15} /> 再聽一次原音
          </button>

          {/* 錄音狀態 */}
          <div className="mt-5 flex flex-col items-center">
            {stage === 'idle' && (
              <button
                type="button"
                onClick={startRecord}
                className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-[#FF6B9D] to-[#D946EF] text-white shadow-hover transition hover:scale-105"
              >
                <Mic size={32} />
              </button>
            )}
            {stage === 'listening' && (
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-[#FF6B9D] to-[#D946EF] text-white anim-pulse-glow">
                <Mic size={32} />
              </div>
            )}
            {stage === 'scoring' && (
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-[#7C7CFF] to-[#5B5BF0] text-white">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              </div>
            )}
            {stage === 'done' && result && (
              <ScoreDisplay result={result} />
            )}

            <div className="mt-3 text-center text-xs text-[var(--color-text-secondary)]">
              {stage === 'idle' && '點擊按鈕開始錄音'}
              {stage === 'listening' && '正在聽...請說出上面那句'}
              {stage === 'scoring' && '分析中...'}
              {stage === 'done' && result && (
                <span className="font-medium">「{result.transcript || '(沒聽到聲音)'}」</span>
              )}
              {error && <span className="text-[#F87171]">{error}</span>}
            </div>
          </div>

          {/* 動作按鈕 */}
          <div className="mt-5 flex items-center justify-end gap-2">
            {stage === 'done' && (
              <>
                <button
                  type="button"
                  onClick={reset}
                  className="btn-ghost flex h-10 items-center gap-1.5 rounded-xl px-4 text-sm font-medium"
                >
                  <RotateCcw size={14} /> 再試一次
                </button>
                <button
                  type="button"
                  onClick={onNext}
                  className="btn-primary inline-flex h-10 items-center gap-1.5 rounded-xl px-5 text-sm font-medium"
                >
                  下一句 <ArrowRight size={14} />
                </button>
              </>
            )}
            {stage !== 'done' && (
              <button
                type="button"
                onClick={onNext}
                className="btn-ghost flex h-10 items-center gap-1.5 rounded-xl px-4 text-sm"
              >
                跳過 <ArrowRight size={14} />
              </button>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function ScoreDisplay({ result }: { result: SpeechResult }) {
  const color =
    result.score >= 80 ? '#4ADE80' : result.score >= 60 ? '#FBBF24' : '#F87171';
  return (
    <motion.div
      initial={{ scale: 0.7, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 240, damping: 18 }}
      className="flex flex-col items-center"
    >
      <div
        className="flex h-20 w-20 items-center justify-center rounded-full text-3xl font-bold text-white shadow-card"
        style={{ background: `linear-gradient(135deg, ${color}cc, ${color})` }}
      >
        {result.score}
      </div>
      <div className="mt-2 text-sm font-semibold" style={{ color }}>
        {result.feedback}
      </div>
    </motion.div>
  );
}
