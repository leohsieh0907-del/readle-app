'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Toaster() {
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const handler = (e: Event) => {
      const m = (e as CustomEvent<{ message: string }>).detail?.message;
      if (!m) return;
      setMsg(m);
      clearTimeout(timer);
      timer = setTimeout(() => setMsg(null), 1800);
    };
    window.addEventListener('readle:toast', handler);
    return () => { window.removeEventListener('readle:toast', handler); clearTimeout(timer); };
  }, []);

  return (
    <AnimatePresence>
      {msg && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.95 }}
          className="pointer-events-none fixed bottom-24 left-1/2 z-[90] -translate-x-1/2 rounded-full bg-[#0F0F19]/90 px-4 py-2.5 text-sm font-medium text-white shadow-modal backdrop-blur-md lg:bottom-8"
        >
          {msg}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
