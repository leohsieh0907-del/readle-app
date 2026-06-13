'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Volume2, Plus, Check, Loader2 } from 'lucide-react';
import { speak } from '@/lib/speech/tts';
import { addWord, findWord } from '@/lib/storage/vocab-actions';
import { lookupOnline, translateToZh, type DictResult } from '@/lib/dictionary/lookup';
import { lookupBuiltin } from '@/lib/dictionary/builtin';
import { getCachedExamples, setCachedExamples } from '@/lib/dictionary/example-cache';
import { toast } from '@/lib/toast';

interface WordPopupProps {
  word: string;
  context?: string; // 出現的句子
  meaning?: string;
  phonetic?: string;
  videoId?: string;
  onClose: () => void;
}

/** 本地迷你字典（最快，有中文）*/
const miniDict: Record<string, { phonetic: string; meaning: string; pos: string }> = {
  elaborate: { phonetic: '/ɪˈlæbəreɪt/', meaning: '詳細闡述；精心製作', pos: 'verb' },
  leverage: { phonetic: '/ˈliːvərɪdʒ/', meaning: '善用；發揮槓桿作用', pos: 'verb' },
  streamline: { phonetic: '/ˈstriːmlaɪn/', meaning: '簡化流程', pos: 'verb' },
  comprehensive: { phonetic: '/ˌkɒmprɪˈhensɪv/', meaning: '全面的；綜合的', pos: 'adj' },
  subsequently: { phonetic: '/ˈsʌbsɪkwəntli/', meaning: '隨後；後來', pos: 'adv' },
  itinerary: { phonetic: '/aɪˈtɪnərəri/', meaning: '行程表', pos: 'noun' },
  layover: { phonetic: '/ˈleɪəʊvə(r)/', meaning: '中途停留', pos: 'noun' },
  allocate: { phonetic: '/ˈæləkeɪt/', meaning: '分配；撥出', pos: 'verb' },
  deploy: { phonetic: '/dɪˈplɔɪ/', meaning: '部署；發佈', pos: 'verb' },
  refactor: { phonetic: '/ˌriːˈfæktə(r)/', meaning: '重構（程式碼）', pos: 'verb' },
  awkward: { phonetic: '/ˈɔːkwəd/', meaning: '尷尬的；笨拙的', pos: 'adj' },
  cozy: { phonetic: '/ˈkəʊzi/', meaning: '舒適的；溫馨的', pos: 'adj' },
  inspire: { phonetic: '/ɪnˈspaɪə(r)/', meaning: '激勵；鼓舞', pos: 'verb' },
  assume: { phonetic: '/əˈsjuːm/', meaning: '假設；認為', pos: 'verb' },
  achieve: { phonetic: '/əˈtʃiːv/', meaning: '達成；實現', pos: 'verb' },
  leader: { phonetic: '/ˈliːdə(r)/', meaning: '領導者', pos: 'noun' },
  loyal: { phonetic: '/ˈlɔɪəl/', meaning: '忠誠的', pos: 'adj' },
  major: { phonetic: '/ˈmeɪdʒə(r)/', meaning: '主修；主要的', pos: 'noun/adj' },
  deadline: { phonetic: '/ˈdedlaɪn/', meaning: '截止期限', pos: 'noun' },
  panic: { phonetic: '/ˈpænɪk/', meaning: '恐慌', pos: 'noun/verb' },
  rational: { phonetic: '/ˈræʃnəl/', meaning: '理性的', pos: 'adj' },
  demanding: { phonetic: '/dɪˈmɑːndɪŋ/', meaning: '要求高的；費力的', pos: 'adj' },
  perseverance: { phonetic: '/ˌpɜːsɪˈvɪərəns/', meaning: '毅力；不屈不撓', pos: 'noun' },
  passion: { phonetic: '/ˈpæʃn/', meaning: '熱情', pos: 'noun' },
  predict: { phonetic: '/prɪˈdɪkt/', meaning: '預測', pos: 'verb' },
  talent: { phonetic: '/ˈtælənt/', meaning: '才能；天賦', pos: 'noun' },
  confession: { phonetic: '/kənˈfeʃn/', meaning: '坦白；告白', pos: 'noun' },
  stress: { phonetic: '/stres/', meaning: '壓力', pos: 'noun' },
  harmful: { phonetic: '/ˈhɑːmfl/', meaning: '有害的', pos: 'adj' },
  belief: { phonetic: '/bɪˈliːf/', meaning: '信念；相信', pos: 'noun' },
  practice: { phonetic: '/ˈpræktɪs/', meaning: '練習', pos: 'noun/verb' },
  skill: { phonetic: '/skɪl/', meaning: '技能', pos: 'noun' },
  frustrating: { phonetic: '/frʌˈstreɪtɪŋ/', meaning: '令人沮喪的', pos: 'adj' },
  barrier: { phonetic: '/ˈbæriə(r)/', meaning: '障礙；屏障', pos: 'noun' },
  improve: { phonetic: '/ɪmˈpruːv/', meaning: '改善；進步', pos: 'verb' },
  posture: { phonetic: '/ˈpɒstʃə(r)/', meaning: '姿勢', pos: 'noun' },
  powerful: { phonetic: '/ˈpaʊəfl/', meaning: '強而有力的', pos: 'adj' },
  confident: { phonetic: '/ˈkɒnfɪdənt/', meaning: '自信的', pos: 'adj' },
  impression: { phonetic: '/ɪmˈpreʃn/', meaning: '印象', pos: 'noun' },
  behavior: { phonetic: '/bɪˈheɪvjə(r)/', meaning: '行為；舉止', pos: 'noun' },
};

interface ExampleSentence {
  en: string;
  zh: string;
}

export default function WordPopup({ word, context, meaning, phonetic, videoId, onClose }: WordPopupProps) {
  const cleaned = word.replace(/[^\w'-]/g, '');
  const local = miniDict[cleaned.toLowerCase()];
  const builtin = lookupBuiltin(cleaned);
  const existing = findWord(cleaned);

  const initialZh = meaning ?? local?.meaning ?? builtin?.zh ?? existing?.meaning ?? '';
  const [added, setAdded] = useState(!!existing);
  const [zhMeaning, setZhMeaning] = useState<string>(initialZh);
  const [online, setOnline] = useState<DictResult | null>(null);
  const [loading, setLoading] = useState(!initialZh);
  const [translating, setTranslating] = useState(false);
  const [examples, setExamples] = useState<ExampleSentence[]>(
    existing?.examples.slice(0, 2).map(e => ({ en: e.en, zh: e.zh })) ?? []
  );
  const [exLoading, setExLoading] = useState(false);
  const [exError, setExError] = useState(false);
  const [speakingIdx, setSpeakingIdx] = useState<number | null>(null);

  const displayPhonetic = phonetic ?? local?.phonetic ?? builtin?.phonetic ?? online?.phonetic ?? '';
  const displayPos = local?.pos ?? builtin?.pos ?? online?.partOfSpeech ?? '';

  /** 唸單字發音（即時本地語音，零延遲） */
  const pronounce = () => {
    speak({ text: cleaned });
  };

  /** 唸例句（即時 Web Speech，本地語音零延遲） */
  const speakExample = (text: string, idx: number) => {
    setSpeakingIdx(idx);
    speak({ text });
    // 估算唸完時間，重置 icon 狀態
    const ms = Math.max(1200, text.split(/\s+/).length * 380);
    window.setTimeout(() => setSpeakingIdx(null), ms);
  };

  /** 用 Gemini 生成 2 個例句 */
  const generateExamples = async (w: string, cancelled: () => boolean) => {
    if (examples.length >= 2) return;
    setExLoading(true);
    setExError(false);
    try {
      const prompt = `為英文單字「${w}」生成 2 個自然例句，附上繁體中文翻譯。
回傳 JSON 陣列：[{"en":"Example sentence 1.","zh":"中文翻譯"},{"en":"Example sentence 2.","zh":"中文翻譯"}]
只輸出 JSON，不要其他說明。`;
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [{ role: 'user', content: prompt }], temperature: 0.5, maxTokens: 400, jsonMode: true }),
      });
      if (cancelled()) return;
      if (!res.ok) throw new Error('ai unavailable');
      const data = await res.json() as { content?: string };
      const text = (data.content ?? '').trim();
      const jsonText = text.match(/\[[\s\S]*\]/)?.[0] ?? text;
      const parsed = JSON.parse(jsonText || '[]') as ExampleSentence[];
      if (!cancelled() && Array.isArray(parsed) && parsed.length > 0) {
        const slim = parsed.slice(0, 2);
        setExamples(slim);
        setCachedExamples(w, slim); // 寫入快取 → 下次查同字免打 API
      } else if (examples.length === 0) {
        setExError(true);
      }
    } catch {
      if (!cancelled() && examples.length === 0) setExError(true);
    }
    if (!cancelled()) setExLoading(false);
  };

  const retryExamples = () => { void generateExamples(cleaned, () => false); };

  // 打開時：查線上字典 + AI 翻中文 + 生成例句 + 自動唸發音
  useEffect(() => {
    let isCancelled = false;
    const cancelled = () => isCancelled;

    // 開窗瞬間用本地語音發音（零延遲，不等網路）
    speak({ text: cleaned });
    const t = 0;

    // 1) 例句快取命中 → 直接用，完全不打 API
    const cachedEx = getCachedExamples(cleaned);
    if (cachedEx) setExamples(cachedEx);

    (async () => {
      // 查線上字典（音標 + 可能的英文例句當墊檔）
      const result = await lookupOnline(cleaned);
      if (isCancelled) return;
      if (result) {
        setOnline(result);
        if (result.example && !cachedEx && examples.length === 0) {
          setExamples([{ en: result.example, zh: '' }]); // 字典例句先墊著（Gemini 掛掉時的降級）
        }
      }
      setLoading(false);

      // 補中文釋義
      if (!zhMeaning) {
        setTranslating(true);
        const zh = await translateToZh(cleaned, context);
        if (!isCancelled && zh) setZhMeaning(zh);
        if (!isCancelled) setTranslating(false);
      }

      // 2) 快取沒有 → 才呼叫 Gemini 生成（成功後寫入快取；失敗/429 → 友善訊息）
      if (!cachedEx) await generateExamples(cleaned, cancelled);
    })();

    return () => {
      isCancelled = true;
      clearTimeout(t);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cleaned]);

  const handleAdd = () => {
    if (added) return;
    addWord({
      word: cleaned,
      phonetic: displayPhonetic,
      partOfSpeech: displayPos,
      meaning: zhMeaning || online?.enDefinition || cleaned,
      examples: examples.length > 0 ? examples.map(e => ({ en: e.en, zh: e.zh })) : context ? [{ en: context, zh: '' }] : [],
      source: 'video',
    });
    setAdded(true);
    toast('已加入單字本 📖');
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-[80] flex items-end justify-center bg-black/30 backdrop-blur-sm sm:items-center"
      >
        <motion.div
          data-wordpopup
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 20, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="glass-strong w-full max-w-sm rounded-t-3xl p-6 sm:rounded-3xl"
        >
          {/* 標題列 */}
          <div className="mb-2 flex items-start justify-between">
            <div>
              <div className="text-2xl font-bold tracking-tight">{cleaned}</div>
              <div className="mt-1 flex items-center gap-2">
                <span className="font-mono text-sm text-[var(--color-text-tertiary)]">
                  {displayPhonetic || (loading ? '查詢中…' : '')}
                </span>
                {displayPos && (
                  <span className="rounded bg-[#5B5BF0]/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-[#5B5BF0]">
                    {displayPos}
                  </span>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full p-2 text-[var(--color-text-tertiary)] hover:bg-black/5"
            >
              <X size={18} />
            </button>
          </div>

          {/* 發音按鈕 */}
          <button
            type="button"
            onClick={pronounce}
            className="mb-3 inline-flex h-9 items-center gap-1.5 rounded-full bg-[#5B5BF0]/10 px-3 text-sm font-medium text-[#5B5BF0] hover:bg-[#5B5BF0]/20"
          >
            <Volume2 size={14} /> {online?.audioUrl ? '真人發音' : '聽發音'}
          </button>

          {/* 中文釋義 */}
          <div className="rounded-xl bg-white/50 p-3 ring-1 ring-inset ring-black/5">
            <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)]">
              中文
            </div>
            <div className="text-[15px] font-semibold leading-snug">
              {zhMeaning ? (
                zhMeaning
              ) : translating ? (
                <span className="inline-flex items-center gap-1.5 text-[var(--color-text-tertiary)]">
                  <Loader2 size={14} className="animate-spin" /> Luna 翻譯中…
                </span>
              ) : (
                <span className="text-[var(--color-text-tertiary)]">
                  {loading ? '查詢中…' : '（暫無中文釋義）'}
                </span>
              )}
            </div>
          </div>

          {/* Examples - 2 sentences with audio */}
          <div className="mt-2">
            <div className="mb-1.5 flex items-center justify-between">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)]">
                例句
              </div>
              {exLoading && (
                <span className="inline-flex items-center gap-1 text-[10px] text-[var(--color-text-tertiary)]">
                  <Loader2 size={10} className="animate-spin" /> AI 生成中…
                </span>
              )}
            </div>
            <div className="space-y-2">
              {examples.length === 0 && !exLoading && exError && (
                <div className="flex items-center justify-between gap-2 rounded-xl bg-white/50 p-3 text-xs text-[var(--color-text-tertiary)] ring-1 ring-inset ring-black/5">
                  <span>AI 例句暫時忙碌（配額繁忙）</span>
                  <button type="button" onClick={retryExamples}
                    className="shrink-0 rounded-lg bg-[#5B5BF0]/10 px-2.5 py-1 font-medium text-[#5B5BF0] hover:bg-[#5B5BF0]/20">
                    重試
                  </button>
                </div>
              )}
              {examples.length === 0 && !exLoading && !exError && (
                <div className="rounded-xl bg-white/50 p-3 text-xs text-[var(--color-text-tertiary)] ring-1 ring-inset ring-black/5">
                  載入中…
                </div>
              )}
              {examples.map((ex, i) => (
                <div key={i} className="rounded-xl bg-white/50 p-3 ring-1 ring-inset ring-black/5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="text-sm leading-relaxed font-medium">{ex.en}</div>
                      {ex.zh && (
                        <div className="mt-1 text-xs leading-relaxed text-[var(--color-text-tertiary)]">
                          {ex.zh}
                        </div>
                      )}
                    </div>
                    <SpeakButton
                      playing={speakingIdx === i}
                      disabled={speakingIdx !== null}
                      onClick={() => speakExample(ex.en, i)}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 出現在（原句） */}
          {context && context !== examples[0]?.en && (
            <div className="mt-2">
              <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)]">
                出現在
              </div>
              <div className="rounded-xl bg-white/50 p-3 text-sm leading-relaxed ring-1 ring-inset ring-black/5">
                {context}
              </div>
            </div>
          )}

          {/* 加入單字本 */}
          <button
            type="button"
            onClick={handleAdd}
            disabled={added}
            className={`mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl font-medium transition ${
              added
                ? 'bg-[#4ADE80]/20 text-[#15803d] ring-1 ring-inset ring-[#4ADE80]/30'
                : 'btn-primary'
            }`}
          >
            {added ? (
              <>
                <Check size={16} /> 已加入單字本
              </>
            ) : (
              <>
                <Plus size={16} /> 加入單字本
              </>
            )}
          </button>

          <p className="mt-3 text-center text-[10px] text-[var(--color-text-tertiary)]">
            💡 在任何頁面雙擊英文單字都能這樣查
          </p>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function SpeakButton({ playing, disabled, onClick }: { playing: boolean; disabled: boolean; onClick: () => void }) {
  const base = 'mt-0.5 shrink-0 flex h-8 w-8 items-center justify-center rounded-full transition disabled:opacity-50';
  const cls = playing ? `${base} bg-[#5B5BF0] text-white shadow-card` : `${base} bg-[#5B5BF0]/10 text-[#5B5BF0] hover:bg-[#5B5BF0]/20`;
  return (
    <button type="button" onClick={onClick} disabled={disabled} className={cls} title="聽例句發音">
      {playing ? (
        <span className="flex h-3 items-end gap-[2px]">
          {[0, 1, 2].map(j => (
            <span key={j} className="w-[2px] animate-bounce rounded-full bg-white"
              style={{ height: `${6 + j * 3}px`, animationDelay: `${j * 0.15}s` }} />
          ))}
        </span>
      ) : (
        <Volume2 size={14} />
      )}
    </button>
  );
}
