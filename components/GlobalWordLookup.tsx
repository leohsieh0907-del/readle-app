'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import WordPopup from '@/components/video/WordPopup';
import { quickTranslateZh } from '@/lib/dictionary/lookup';
import { lookupBuiltin } from '@/lib/dictionary/builtin';
import { unlockSpeech } from '@/lib/speech/tts';

/**
 * 全站單字查詢
 * - 滑鼠移到英文單字 → 底線 + 小翻譯泡泡
 * - 單擊 → 完整 WordPopup（音標、英英、發音、加入單字本）
 */

interface TooltipState {
  word: string;
  zh: string;
  x: number;
  y: number;
}

interface PopupState {
  word: string;
  context: string;
}

const isWordChar = (c: string) => /[a-zA-Z'-]/.test(c);

function wordAtPoint(x: number, y: number): { word: string; sentence: string; node: Node; start: number; end: number } | null {
  const doc = document as Document & {
    caretPositionFromPoint?: (x: number, y: number) => { offsetNode: Node; offset: number } | null;
    caretRangeFromPoint?: (x: number, y: number) => Range | null;
  };
  let caretNode: Node | null = null;
  let caretOffset = 0;
  if (doc.caretPositionFromPoint) {
    const p = doc.caretPositionFromPoint(x, y);
    if (p) { caretNode = p.offsetNode; caretOffset = p.offset; }
  }
  if (!caretNode && doc.caretRangeFromPoint) {
    const r = doc.caretRangeFromPoint(x, y);
    if (r) { caretNode = r.startContainer; caretOffset = r.startOffset; }
  }
  if (!caretNode || caretNode.nodeType !== Node.TEXT_NODE) return null;
  const text = caretNode.textContent ?? '';
  let start = Math.min(caretOffset, text.length - 1);
  let end = start;
  while (start > 0 && isWordChar(text[start - 1])) start--;
  while (end < text.length && isWordChar(text[end])) end++;
  const word = text.slice(start, end).replace(/^[-']+|[-']+$/g, '');
  // 最少 4 個字母才觸發（避免 UI 標籤如 verb/adj/pos 等）
  if (!/^[a-zA-Z][a-zA-Z'-]{3,30}$/.test(word)) return null;
  return { word, sentence: text.replace(/\s+/g, ' ').trim().slice(0, 200), node: caretNode, start, end };
}

function wordRect(node: Node, start: number, end: number): DOMRect | null {
  try {
    const r = document.createRange();
    r.setStart(node, start);
    r.setEnd(node, end);
    return r.getBoundingClientRect();
  } catch {
    return null;
  }
}

const zhCache: Record<string, string> = {};

export default function GlobalWordLookup() {
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);
  const [popup, setPopup] = useState<PopupState | null>(null);
  const [underlineStyle, setUnderlineStyle] = useState<{ left: number; top: number; width: number } | null>(null);
  const moveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const currentWord = useRef<string>('');

  // 首次點擊/觸碰解鎖手機/Safari 語音引擎
  useEffect(() => {
    const h = () => unlockSpeech();
    document.addEventListener('click', h, { once: true });
    document.addEventListener('touchstart', h, { once: true });
    return () => {
      document.removeEventListener('click', h);
      document.removeEventListener('touchstart', h);
    };
  }, []);

  const clearTooltip = useCallback(() => {
    if (moveTimer.current) clearTimeout(moveTimer.current);
    setTooltip(null);
    setUnderlineStyle(null);
    currentWord.current = '';
  }, []);

  const fetchZh = useCallback(async (word: string, context?: string) => {
    const key = word.toLowerCase();
    if (zhCache[key]) return zhCache[key];
    // 1. 內建字典（瞬間，不打 API）
    const builtin = lookupBuiltin(word);
    if (builtin?.zh) { zhCache[key] = builtin.zh; return builtin.zh; }
    // 2. Google 免費端點（未知字）— 快且穩定，~1.3s
    const zh = await quickTranslateZh(word);
    if (zh) zhCache[key] = zh;
    return zh ?? '';
  }, []);

  useEffect(() => {
    // Hover 排除：只排除輸入框和彈窗本身，其他都允許（包含 Link、button 裡的文字）
    const HOVER_EXCLUDED = 'input,textarea,[contenteditable],[data-no-lookup],[data-wordpopup]';
    // Click 排除：額外排除 a（避免衝突導航）和 button（避免觸發 UI 動作）
    const CLICK_EXCLUDED = `${HOVER_EXCLUDED},a,[role=button],button`;

    const onMove = async (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target || target.closest(HOVER_EXCLUDED)) { clearTooltip(); return; }
      if (popup) return; // 彈窗開著時不顯示 tooltip

      const hit = wordAtPoint(e.clientX, e.clientY);
      if (!hit) { clearTooltip(); return; }
      if (hit.word === currentWord.current) {
        setTooltip((prev) => prev ? { ...prev, x: e.clientX, y: e.clientY } : prev);
        return;
      }
      currentWord.current = hit.word;

      const rect = wordRect(hit.node, hit.start, hit.end);
      if (rect && rect.width > 0) {
        setUnderlineStyle({ left: rect.left, top: rect.bottom, width: rect.width });
      }

      setTooltip({ word: hit.word, zh: '…', x: e.clientX, y: e.clientY });

      if (moveTimer.current) clearTimeout(moveTimer.current);
      const w = hit.word;
      const ctx = hit.sentence;
      moveTimer.current = setTimeout(async () => {
        if (currentWord.current !== w) return;
        const zh = await fetchZh(w, ctx);
        if (currentWord.current === w && zh) {
          setTooltip((prev) => prev?.word === w ? { ...prev, zh } : prev);
        }
      }, 400);
    };

    const onLeave = () => clearTooltip();

    const onClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target || target.closest(CLICK_EXCLUDED)) return;
      if (target.closest('[data-wordpopup]')) return;
      const hit = wordAtPoint(e.clientX, e.clientY);
      if (!hit) return;
      e.stopPropagation();
      clearTooltip();
      setPopup({ word: hit.word, context: hit.sentence });
    };

    // 雙擊也能開 popup（對 Link/Button 裡的字有效）
    const onDblClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target || target.closest(HOVER_EXCLUDED)) return;
      if (target.closest('[data-wordpopup]')) return;
      const hit = wordAtPoint(e.clientX, e.clientY);
      if (!hit) return;
      e.preventDefault(); // 防止雙擊選字
      clearTooltip();
      setPopup({ word: hit.word, context: hit.sentence });
    };

    document.addEventListener('mousemove', onMove, { passive: true });
    document.addEventListener('mouseleave', onLeave);
    document.addEventListener('click', onClick, { capture: true });
    document.addEventListener('dblclick', onDblClick, { capture: true });
    return () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseleave', onLeave);
      document.removeEventListener('click', onClick, { capture: true });
      document.removeEventListener('dblclick', onDblClick, { capture: true });
    };
  }, [clearTooltip, fetchZh, popup]);

  return (
    <>
      {/* 底線 */}
      {underlineStyle && !popup && (
        <div
          className="pointer-events-none fixed z-[70]"
          style={{
            left: underlineStyle.left,
            top: underlineStyle.top,
            width: underlineStyle.width,
            height: 2,
            background: 'linear-gradient(90deg,#7C7CFF,#5B5BF0)',
            borderRadius: 1,
          }}
        />
      )}

      {/* Hover 翻譯泡泡 */}
      {tooltip && !popup && (
        <div
          data-no-lookup
          className="pointer-events-none fixed z-[75] max-w-xs rounded-2xl bg-[#0F0F19]/90 px-3 py-2.5 text-xs text-white shadow-modal backdrop-blur-md"
          style={{
            left: Math.min(tooltip.x + 16, window.innerWidth - 230),
            top: Math.max(4, tooltip.y - 60),
          }}
        >
          <div className="font-bold tracking-wide">{tooltip.word}</div>
          <div className="mt-0.5 text-white/80">
            {tooltip.zh === '…' ? (
              <span className="inline-flex items-center gap-1 text-white/50">
                <span className="h-1 w-1 animate-bounce rounded-full bg-white/50" style={{ animationDelay: '0ms' }} />
                <span className="h-1 w-1 animate-bounce rounded-full bg-white/50" style={{ animationDelay: '150ms' }} />
                <span className="h-1 w-1 animate-bounce rounded-full bg-white/50" style={{ animationDelay: '300ms' }} />
              </span>
            ) : tooltip.zh}
          </div>
          <div className="mt-1 text-[10px] text-white/40">點一下看詳細 🔊</div>
        </div>
      )}

      {/* 詳細彈窗（單擊） */}
      {popup && (
        <WordPopup
          word={popup.word}
          context={popup.context}
          onClose={() => setPopup(null)}
        />
      )}
    </>
  );
}
