'use client';

import { useEffect, useRef, useState } from 'react';

type Phase = 'listening' | 'thinking' | 'speaking' | 'idle';

interface LunaFaceProps {
  phase: Phase;
  text?: string;   // 正在念的句子（用來估算嘴型序列）
  rate?: number;   // 語速（影響嘴型節奏）
  size?: number;
}

/** 嘴型（viseme）路徑表 — 對應母音/子音的口型 */
const SHAPES: Record<string, { cav: string; lt: string; lb: string; teeth: number; tongue: number }> = {
  rest:  { cav: 'M-13 0 Q0 2 13 0 Q0 3 -13 0 Z', lt: 'M-15 -1 Q0 -4 15 -1 Q0 1 -15 -1 Z', lb: 'M-15 1 Q0 7 15 1 Q0 3 -15 1 Z', teeth: 0, tongue: 0 },
  closed:{ cav: 'M-11 0 Q0 0 11 0 Q0 0 -11 0 Z', lt: 'M-14 0 Q0 -2 14 0 Q0 1 -14 0 Z', lb: 'M-14 0 Q0 3 14 0 Q0 1 -14 0 Z', teeth: 0, tongue: 0 },
  open:  { cav: 'M-15 -6 Q0 4 15 -6 Q0 16 -15 -6 Z', lt: 'M-17 -7 Q0 -9 17 -7 Q0 -3 -17 -7 Z', lb: 'M-17 -6 Q0 16 17 -6 Q0 8 -17 -6 Z', teeth: 0, tongue: 1 },
  mid:   { cav: 'M-13 -2 Q0 2 13 -2 Q0 8 -13 -2 Z', lt: 'M-15 -2 Q0 -4 15 -2 Q0 0 -15 -2 Z', lb: 'M-15 -1 Q0 8 15 -1 Q0 4 -15 -1 Z', teeth: 1, tongue: 0 },
  wide:  { cav: 'M-18 -2 Q0 1 18 -2 Q0 5 -18 -2 Z', lt: 'M-20 -2 Q0 -3 20 -2 Q0 -1 -20 -2 Z', lb: 'M-20 0 Q0 5 20 0 Q0 2 -20 0 Z', teeth: 1, tongue: 0 },
  round: { cav: 'M-8 -4 Q0 0 8 -4 Q0 12 -8 -4 Z', lt: 'M-10 -4 Q0 -6 10 -4 Q0 -2 -10 -4 Z', lb: 'M-10 -2 Q0 12 10 -2 Q0 6 -10 -2 Z', teeth: 0, tongue: 0 },
  small: { cav: 'M-6 -2 Q0 0 6 -2 Q0 6 -6 -2 Z', lt: 'M-8 -3 Q0 -6 8 -3 Q0 -3 -8 -3 Z', lb: 'M-8 -1 Q0 7 8 -1 Q0 3 -8 -1 Z', teeth: 0, tongue: 0 },
  teethV:{ cav: 'M-12 0 Q0 0 12 0 Q0 1 -12 0 Z', lt: 'M-14 1 Q0 -1 14 1 Q0 2 -14 1 Z', lb: 'M-14 1 Q0 4 14 1 Q0 2 -14 1 Z', teeth: 1, tongue: 0 },
};

function charToViseme(c: string): string {
  c = c.toLowerCase();
  if ('a'.includes(c)) return 'open';
  if ('eiy'.includes(c)) return 'wide';
  if ('o'.includes(c)) return 'round';
  if ('uw'.includes(c)) return 'small';
  if ('mbp'.includes(c)) return 'closed';
  if ('fv'.includes(c)) return 'teethV';
  if (' .,!?'.includes(c)) return 'rest';
  return 'mid';
}

export default function LunaFace({ phase, text = '', rate = 0.95, size = 230 }: LunaFaceProps) {
  const [shape, setShape] = useState('rest');
  const [blink, setBlink] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 眨眼
  useEffect(() => {
    const id = setInterval(() => {
      setBlink(true);
      setTimeout(() => setBlink(false), 120);
    }, 4200);
    return () => clearInterval(id);
  }, []);

  // 嘴型同步：speaking 時依文字逐字切換口型
  useEffect(() => {
    if (timer.current) { clearTimeout(timer.current); timer.current = null; }
    if (phase !== 'speaking' || !text) { setShape('rest'); return; }

    const seq = [...text].map((c) => ({
      v: charToViseme(c),
      d: (' .,!?'.includes(c) ? 150 : 'aeiouwy'.includes(c.toLowerCase()) ? 115 : 65) / rate,
    }));
    let i = 0;
    const step = () => {
      if (i >= seq.length) { setShape('rest'); return; }
      setShape(seq[i].v);
      timer.current = setTimeout(step, seq[i].d);
      i++;
    };
    step();
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, [phase, text, rate]);

  const s = SHAPES[shape] ?? SHAPES.rest;
  const eyeScaleY = blink ? 0.08 : 1;

  return (
    <svg width={size} height={size} viewBox="0 0 220 220" aria-label="Luna">
      <defs>
        <radialGradient id="lf-bg" cx="50%" cy="42%" r="62%"><stop offset="0%" stopColor="#EFEAFF" /><stop offset="100%" stopColor="#FBFAFF" /></radialGradient>
        <linearGradient id="lf-skin" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#FBE0CE" /><stop offset="100%" stopColor="#F3C6A8" /></linearGradient>
        <linearGradient id="lf-hair" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#7E6CF2" /><stop offset="100%" stopColor="#4A38AE" /></linearGradient>
        <radialGradient id="lf-iris" cx="50%" cy="40%" r="60%"><stop offset="0%" stopColor="#9B86FF" /><stop offset="60%" stopColor="#5B4BD6" /><stop offset="100%" stopColor="#36287A" /></radialGradient>
        <linearGradient id="lf-lip" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#D87A92" /><stop offset="100%" stopColor="#B85070" /></linearGradient>
        <radialGradient id="lf-cheek" cx="50%" cy="50%" r="50%"><stop offset="0%" stopColor="#F9A6B6" stopOpacity=".6" /><stop offset="100%" stopColor="#F9A6B6" stopOpacity="0" /></radialGradient>
      </defs>

      <circle cx="110" cy="110" r="105" fill="url(#lf-bg)" />
      {/* 兩側頭髮 + 衣領 */}
      <path d="M48 100 Q36 168 64 200 L84 200 Q66 150 70 100 Z" fill="url(#lf-hair)" />
      <path d="M172 100 Q184 168 156 200 L136 200 Q154 150 150 100 Z" fill="url(#lf-hair)" />
      <path d="M44 210 Q110 158 176 210 Z" fill="#8E80F2" />
      <path d="M86 188 Q110 174 134 188 L134 210 L86 210 Z" fill="#fff" opacity=".22" />
      {/* 脖子 */}
      <path d="M96 138 Q96 156 110 158 Q124 156 124 138 L124 130 L96 130 Z" fill="#E3A988" />
      <path d="M96 138 Q110 150 124 138 L124 132 L96 132 Z" fill="#000" opacity=".06" />
      {/* 臉 */}
      <path d="M64 96 Q64 52 110 52 Q156 52 156 96 Q156 132 132 150 Q110 166 88 150 Q64 132 64 96 Z" fill="url(#lf-skin)" />
      <path d="M66 100 Q72 130 92 146 Q78 130 74 100 Z" fill="#000" opacity=".05" />
      <path d="M154 100 Q148 130 128 146 Q142 130 146 100 Z" fill="#000" opacity=".05" />
      {/* 耳朵 + 耳環 */}
      <ellipse cx="64" cy="104" rx="7" ry="11" fill="#F3C6A8" /><circle cx="64" cy="116" r="2.6" fill="#FFD86B" />
      <ellipse cx="156" cy="104" rx="7" ry="11" fill="#F3C6A8" /><circle cx="156" cy="116" r="2.6" fill="#FFD86B" />
      {/* 腮紅 */}
      <ellipse cx="84" cy="116" rx="12" ry="8" fill="url(#lf-cheek)" />
      <ellipse cx="136" cy="116" rx="12" ry="8" fill="url(#lf-cheek)" />
      {/* 眉毛（thinking 上挑） */}
      <path d="M78 84 Q90 77 102 83" stroke="#5034B0" strokeWidth="3.4" fill="none" strokeLinecap="round" opacity=".85" transform={phase === 'thinking' ? 'translate(0,-4)' : ''} />
      <path d="M118 83 Q130 77 142 84" stroke="#5034B0" strokeWidth="3.4" fill="none" strokeLinecap="round" opacity=".85" transform={phase === 'thinking' ? 'translate(0,-4)' : ''} />
      {/* 眼睛（會眨） */}
      <g transform={`translate(87,95) scale(1,${eyeScaleY}) translate(-87,-95)`}>
        <path d="M73 95 Q86 86 99 95 Q86 103 73 95 Z" fill="#fff" />
        <circle cx="87" cy={phase === 'thinking' ? 92 : 95} r="6.6" fill="url(#lf-iris)" />
        <circle cx="87" cy={phase === 'thinking' ? 92 : 95} r="3" fill="#241a4d" />
        <circle cx="89.4" cy="92.6" r="1.8" fill="#fff" />
      </g>
      <g transform={`translate(133,95) scale(1,${eyeScaleY}) translate(-133,-95)`}>
        <path d="M121 95 Q134 86 147 95 Q134 103 121 95 Z" fill="#fff" />
        <circle cx="133" cy={phase === 'thinking' ? 92 : 95} r="6.6" fill="url(#lf-iris)" />
        <circle cx="133" cy={phase === 'thinking' ? 92 : 95} r="3" fill="#241a4d" />
        <circle cx="135.4" cy="92.6" r="1.8" fill="#fff" />
      </g>
      {/* 鼻 */}
      <path d="M108 100 Q104 114 110 118 Q114 116 113 114" stroke="#E3A988" strokeWidth="2" fill="none" strokeLinecap="round" opacity=".7" />
      {/* 嘴巴（同步動）*/}
      <g transform="translate(110,132)" style={{ transition: 'all .07s ease-out' }}>
        <path d={s.cav} fill="#6E2238" />
        <rect x="-11" y="-6" width="22" height="5" rx="2" fill="#FDFBFF" opacity={s.teeth} />
        <ellipse cx="0" cy="4" rx="7" ry="2" fill="#D86A7E" opacity={s.tongue} />
        <path d={s.lt} fill="url(#lf-lip)" />
        <path d={s.lb} fill="url(#lf-lip)" />
      </g>
      {/* 瀏海 */}
      <path d="M58 98 Q52 48 110 46 Q168 48 162 98 Q154 66 130 62 Q150 78 138 88 Q126 64 110 64 Q94 64 82 88 Q70 78 90 62 Q66 66 58 98 Z" fill="url(#lf-hair)" />
      <path d="M110 46 Q150 50 158 92 Q150 64 122 60 Q140 76 130 84 Q120 62 110 62 Z" fill="#9486FF" opacity=".5" />
      {/* 亮點 */}
      <path d="M150 64 l3 6 6 3 -6 3 -3 6 -3 -6 -6 -3 6 -3 z" fill="#FFD86B" />
    </svg>
  );
}
