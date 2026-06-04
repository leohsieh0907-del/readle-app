'use client';

import { useState } from 'react';
import { Link2, Sparkles, Copy, Check, Download, BookOpen } from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';
import SoftButton from '@/components/ui/SoftButton';
import { speak } from '@/lib/speech/tts';

interface SubtitleLine {
  startSec: number;
  endSec: number;
  en: string;
  zh: string;
}

interface WordNote {
  word: string;
  zh: string;
  pos: string;
}

function extractVideoId(input: string): string | null {
  input = input.trim();
  // 完整網址
  const m1 = input.match(/(?:youtube\.com\/watch\?.*v=|youtu\.be\/|youtube\.com\/embed\/)([A-Za-z0-9_-]{11})/);
  if (m1) return m1[1];
  // 純 ID
  if (/^[A-Za-z0-9_-]{11}$/.test(input)) return input;
  return null;
}

function fmt(sec: number) {
  const m = Math.floor(sec / 60), s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

const posLabel: Record<string, string> = {
  verb: '動詞', noun: '名詞', adj: '形容詞', adv: '副詞', phrase: '片語',
};

type Mode = 'url' | 'paste';

export default function SubtitleGenPage() {
  const [mode, setMode] = useState<Mode>('url');
  const [urlInput, setUrlInput] = useState('');
  const [pasteInput, setPasteInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [subtitles, setSubtitles] = useState<SubtitleLine[]>([]);
  const [keyWords, setKeyWords] = useState<WordNote[]>([]);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  // ─── URL 模式（自動抓）───────────────────────────────
  const fetchByUrl = async () => {
    const vid = extractVideoId(urlInput);
    if (!vid) { setError('無法解析 YouTube 網址，請確認網址格式正確'); return; }
    setError('');
    setLoading(true);
    setStatus('抓取字幕中…');
    setSubtitles([]);
    setKeyWords([]);

    try {
      const res = await fetch(`/api/subtitles?v=${vid}&explain=1`);
      const data = await res.json() as {
        subtitles?: SubtitleLine[];
        keyWords?: WordNote[];
        error?: string;
        reason?: string;
      };

      if (!res.ok || data.error) {
        setError(data.reason ?? data.error ?? '無法取得字幕');
        return;
      }

      setStatus(`✅ 取得 ${data.subtitles?.length ?? 0} 句字幕，AI 翻譯中…`);
      setSubtitles(data.subtitles ?? []);
      setKeyWords(data.keyWords ?? []);
      setStatus(`✅ 完成！共 ${data.subtitles?.length ?? 0} 句，${data.keyWords?.length ?? 0} 個重點字`);
    } catch (e) {
      setError(`發生錯誤：${String(e)}`);
    } finally {
      setLoading(false);
    }
  };

  // ─── 貼文字模式（手動貼字幕）───────────────────────
  const isSRT = pasteInput.includes('-->');

  function parseSRT(srt: string): SubtitleLine[] {
    const blocks = srt.trim().split(/\n\s*\n/);
    const result: SubtitleLine[] = [];
    for (const block of blocks) {
      const lines = block.trim().split('\n');
      const timeLine = lines.find((l) => l.includes('-->'));
      if (!timeLine) continue;
      const [startStr, endStr] = timeLine.split('-->').map((s) => s.trim());
      const toSec = (t: string) => {
        const m = t.replace(',', '.').match(/(\d+):(\d+):(\d+\.?\d*)/);
        return m ? +m[1] * 3600 + +m[2] * 60 + +m[3] : 0;
      };
      const text = lines.filter((l) => l.trim() && !l.includes('-->') && !/^\d+$/.test(l.trim()))
        .join(' ').replace(/<[^>]+>/g, '').trim();
      if (text) result.push({ startSec: toSec(startStr), endSec: toSec(endStr), en: text, zh: '' });
    }
    return result;
  }

  function parsePlain(text: string): SubtitleLine[] {
    const lines = text.split('\n').filter((l) => l.trim());
    let t = 0;
    return lines.map((line) => {
      const dur = Math.max(2, line.trim().split(/\s+/).length * 0.4);
      const item: SubtitleLine = { startSec: Math.round(t * 10) / 10, endSec: Math.round((t + dur) * 10) / 10, en: line.trim(), zh: '' };
      t += dur;
      return item;
    });
  }

  const translatePaste = async () => {
    if (!pasteInput.trim()) return;
    const parsed = isSRT ? parseSRT(pasteInput) : parsePlain(pasteInput);
    setError('');
    setLoading(true);
    setStatus('AI 翻譯中…');
    setSubtitles(parsed);
    setKeyWords([]);

    const sentences = parsed.map((p) => p.en);
    const BATCH = 50;
    const allZh: string[] = [];
    try {
      for (let i = 0; i < sentences.length; i += BATCH) {
        const chunk = sentences.slice(i, i + BATCH);
        const numbered = chunk.map((s, idx) => `${i + idx + 1}. ${s}`).join('\n');
        const res = await fetch('/api/ai/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: [{ role: 'user', content: `把以下英文句子翻成繁體中文，保持番號順序，每行一句，只輸出番號.空格翻譯：\n\n${numbered}` }],
            temperature: 0.2, maxTokens: 4096,
          }),
        });
        const data = await res.json() as { content?: string };
        for (const line of (data.content ?? '').split('\n')) {
          const m = line.match(/^\d+\.\s*(.+)/);
          if (m) allZh.push(m[1].trim());
        }
        while (allZh.length < i + chunk.length) allZh.push('');
      }
    } catch { /* 翻譯失敗不影響英文 */ }

    const done = parsed.map((p, i) => ({ ...p, zh: allZh[i] ?? '' }));
    setSubtitles(done);

    // 提取關鍵字
    try {
      const fullText = done.map((s) => s.en).join(' ').slice(0, 2000);
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: `從以下英文字幕找出 8 個值得學習的單字或片語（B1-C1），回傳 JSON 陣列 [{"word":"...","zh":"繁中意思","pos":"verb/noun/adj/adv/phrase"}]，只輸出 JSON：\n\n${fullText}` }],
          temperature: 0.3, maxTokens: 1024, jsonMode: true,
        }),
      });
      const data = await res.json() as { content?: string };
      const kw = JSON.parse(data.content ?? '[]') as WordNote[];
      if (Array.isArray(kw)) setKeyWords(kw.slice(0, 12));
    } catch { /* ignore */ }

    setStatus(`✅ 完成！共 ${done.length} 句`);
    setLoading(false);
  };

  // ─── 輸出 ──────────────────────────────────────────
  const jsonOutput = JSON.stringify(subtitles, null, 2);

  const copyJson = () => {
    navigator.clipboard.writeText(jsonOutput);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadJson = () => {
    const vid = extractVideoId(urlInput) ?? 'video';
    const blob = new Blob([jsonOutput], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `subtitles-${vid}.json`;
    a.click();
  };

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <header className="px-1">
        <h1 className="text-2xl font-bold tracking-tight">字幕產生器</h1>
        <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
          貼網址或貼字幕 → AI 自動翻中文 + 解析重點字
        </p>
      </header>

      {/* 模式切換 */}
      <div className="flex gap-2">
        {(['url', 'paste'] as Mode[]).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            className={`h-9 rounded-full px-4 text-sm font-medium transition ${
              mode === m
                ? 'bg-gradient-to-r from-[#7C7CFF] to-[#5B5BF0] text-white shadow-card'
                : 'bg-white/50 text-[var(--color-text-secondary)] ring-1 ring-inset ring-black/5 hover:bg-white/70'
            }`}
          >
            {m === 'url' ? '🔗 貼網址（自動抓）' : '📋 貼字幕文字'}
          </button>
        ))}
      </div>

      <GlassCard className="p-5">
        {mode === 'url' ? (
          <>
            <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)]">
              <Link2 size={12} /> YouTube 網址
            </div>
            <div className="flex gap-2">
              <input
                type="url"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') fetchByUrl(); }}
                placeholder="https://www.youtube.com/watch?v=..."
                className="h-10 flex-1 rounded-xl border border-[var(--color-border)] bg-white/60 px-3 text-sm outline-none focus:border-[#5B5BF0] focus:ring-2 focus:ring-[#5B5BF0]/20"
              />
              <SoftButton variant="primary" size="md" onClick={fetchByUrl} disabled={!urlInput.trim() || loading} leftIcon={<Sparkles size={14} />}>
                {loading ? '處理中…' : '自動產生'}
              </SoftButton>
            </div>
            <p className="mt-2 text-xs text-[var(--color-text-tertiary)]">
              ⚠️ 部分 YouTube 影片（如 TED）關閉了字幕抓取，若失敗請改用「貼字幕文字」模式
            </p>
          </>
        ) : (
          <>
            <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)]">
              貼入 YouTube 字幕（SRT 格式或純文字）
            </div>
            <div className="mb-2 rounded-xl bg-[#5B5BF0]/8 p-3 text-xs ring-1 ring-inset ring-[#5B5BF0]/15">
              📌 如何複製：影片下方「…」→「開啟文字記錄」→ 全選複製
            </div>
            <textarea
              value={pasteInput}
              onChange={(e) => setPasteInput(e.target.value)}
              rows={8}
              placeholder={`支援 SRT（含時間碼）：
1
00:00:13,280 --> 00:00:16,680
How do you explain when things don't go as we assume?

或純文字（一行一句）：
How do you explain when things don't go?`}
              className="w-full rounded-xl border border-[var(--color-border)] bg-white/60 p-3 font-mono text-xs outline-none focus:border-[#5B5BF0]"
            />
            <div className="mt-2">
              <SoftButton variant="primary" size="md" onClick={translatePaste} disabled={!pasteInput.trim() || loading} leftIcon={<Sparkles size={14} />}>
                {loading ? 'AI 翻譯中…' : `產生字幕（${isSRT ? 'SRT' : '純文字'}）`}
              </SoftButton>
            </div>
          </>
        )}

        {status && <p className="mt-3 text-sm text-[#15803d]">{status}</p>}
        {error && <p className="mt-3 text-sm text-[#B91C1C]">⚠️ {error}</p>}
      </GlassCard>

      {/* 重點字解釋 */}
      {keyWords.length > 0 && (
        <GlassCard className="p-5">
          <div className="mb-3 flex items-center gap-1.5 text-sm font-bold">
            <BookOpen size={16} className="text-[#5B5BF0]" /> 重點字彙解釋
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {keyWords.map((kw, i) => (
              <div key={i} className="flex items-start justify-between gap-2 rounded-xl bg-white/50 p-3 ring-1 ring-inset ring-black/5">
                <div>
                  <button
                    type="button"
                    onClick={() => speak({ text: kw.word })}
                    className="text-[15px] font-bold text-[#5B5BF0] hover:underline"
                  >
                    {kw.word}
                  </button>
                  <span className="ml-1.5 rounded bg-[#5B5BF0]/10 px-1.5 py-0.5 text-[10px] text-[#5B5BF0]">
                    {posLabel[kw.pos] ?? kw.pos}
                  </span>
                  <div className="mt-0.5 text-sm text-[var(--color-text-secondary)]">{kw.zh}</div>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      )}

      {/* 字幕預覽 */}
      {subtitles.length > 0 && (
        <GlassCard className="p-5">
          <div className="mb-3 flex items-center justify-between">
            <div className="text-sm font-bold">字幕預覽（{subtitles.length} 句）</div>
            <div className="flex gap-2">
              <button type="button" onClick={copyJson} className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-[#5B5BF0]/10 px-3 text-xs font-medium text-[#5B5BF0] hover:bg-[#5B5BF0]/20">
                {copied ? <Check size={12} /> : <Copy size={12} />} {copied ? '已複製' : '複製 JSON'}
              </button>
              <button type="button" onClick={downloadJson} className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-white/50 px-3 text-xs font-medium ring-1 ring-inset ring-black/5 hover:bg-white/70">
                <Download size={12} /> 下載
              </button>
            </div>
          </div>

          <div className="max-h-80 space-y-1 overflow-y-auto">
            {subtitles.slice(0, 30).map((s, i) => (
              <div key={i} className="flex gap-3 rounded-lg px-2 py-1.5 hover:bg-white/30">
                <span className="w-12 shrink-0 font-mono text-[10px] text-[var(--color-text-tertiary)]">
                  {fmt(s.startSec)}
                </span>
                <div className="min-w-0">
                  <div className="text-sm leading-snug">{s.en}</div>
                  {s.zh && <div className="text-xs leading-snug text-[var(--color-text-tertiary)]">{s.zh}</div>}
                </div>
              </div>
            ))}
            {subtitles.length > 30 && (
              <p className="px-2 py-1 text-xs text-[var(--color-text-tertiary)]">
                …還有 {subtitles.length - 30} 句（下載 JSON 查看完整）
              </p>
            )}
          </div>

          <div className="mt-4 rounded-xl bg-[#4ADE80]/8 p-3 text-xs ring-1 ring-inset ring-[#4ADE80]/20">
            <div className="mb-1 font-semibold text-[#15803d]">✅ 如何加到影片</div>
            <ol className="space-y-0.5 text-[var(--color-text-secondary)]">
              <li>1. 點「複製 JSON」</li>
              <li>2. 開 <code className="rounded bg-black/8 px-1">readle-app/data/videos.json</code></li>
              <li>3. 找對應影片的 <code className="rounded bg-black/8 px-1">"subtitles": []</code> → 換成複製的 JSON</li>
              <li>4. 存檔就完成了</li>
            </ol>
          </div>
        </GlassCard>
      )}
    </div>
  );
}
