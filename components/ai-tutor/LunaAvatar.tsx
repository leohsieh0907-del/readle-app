'use client';

import { motion } from 'framer-motion';

type Phase = 'listening' | 'thinking' | 'speaking' | 'idle';

interface LunaAvatarProps {
  phase: Phase;
  size?: number;
}

/**
 * Luna 真人頭像（圓形照片 + 狀態動畫）
 * - 靜態真人照片無法對嘴，故 speaking 時用「聲波等化器 + 光暈」表示說話（同 ChatGPT 語音、Gemini Live）
 * - listening：柔和呼吸光暈
 * - thinking：旋轉虛線環
 * - 圓形遮罩會自然蓋掉照片角落的浮水印
 */
export default function LunaAvatar({ phase, size = 150 }: LunaAvatarProps) {
  const speaking = phase === 'speaking';
  const thinking = phase === 'thinking';

  const ring =
    speaking ? '0 0 0 4px rgba(91,91,240,0.35), 0 10px 36px rgba(91,91,240,0.45)'
    : thinking ? '0 0 0 3px rgba(245,158,11,0.35)'
    : '0 0 0 3px rgba(74,222,128,0.30), 0 8px 28px rgba(0,0,0,0.12)';

  return (
    <div className="relative" style={{ width: size, height: size }}>
      {/* 呼吸 / 脈動光暈 */}
      <motion.div
        className="absolute inset-0 rounded-full"
        animate={speaking ? { scale: [1, 1.04, 1] } : { scale: [1, 1.02, 1] }}
        transition={{ repeat: Infinity, duration: speaking ? 0.8 : 2.4 }}
        style={{ boxShadow: ring }}
      />

      {/* thinking 旋轉虛線環 */}
      {thinking && (
        <motion.div
          className="absolute -inset-1.5 rounded-full border-2 border-dashed border-[#F59E0B]/60"
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 2.5, ease: 'linear' }}
        />
      )}

      {/* 真人照片 */}
      <img
        src="/luna.jpg"
        alt="Luna"
        className="h-full w-full rounded-full object-cover"
        style={{ objectPosition: '50% 35%' }}
        draggable={false}
      />

      {/* 說話時：底部聲波等化器 */}
      {speaking && (
        <div className="absolute -bottom-1 left-1/2 flex -translate-x-1/2 items-end gap-[3px] rounded-full bg-[#5B5BF0] px-3 py-2 shadow-[0_4px_16px_rgba(91,91,240,0.5)]">
          {[0, 1, 2, 3, 4].map((i) => (
            <motion.span
              key={i}
              className="w-[3px] rounded-full bg-white"
              animate={{ height: [5, 14, 7, 16, 5] }}
              transition={{ repeat: Infinity, duration: 0.7, delay: i * 0.1, ease: 'easeInOut' }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
