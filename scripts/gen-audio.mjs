/**
 * 預先產生核心單字的發音 MP3（Duolingo 模式）
 * 音源：Google Translate TTS（免費、快、穩、~10KB/字）
 * 輸出：public/audio/{word}.mp3 + public/audio/manifest.json
 *
 * 執行：node scripts/gen-audio.mjs
 * 可重複執行（已存在的檔案會跳過，方便中斷後續跑）
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const OUT_DIR = path.join(ROOT, 'public', 'audio');
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36';

function slug(w) {
  return w.toLowerCase().trim().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
}

const TOP_N = 5000; // 常用字數量
const FREQ_URL = 'https://raw.githubusercontent.com/first20hours/google-10000-english/master/google-10000-english-usa.txt';

/** 從原始碼 + 常用字頻率表收集單字 */
async function collectWords() {
  const set = new Set();

  // seed-words.ts：word: 'xxx'
  const seed = fs.readFileSync(path.join(ROOT, 'lib/mock/seed-words.ts'), 'utf8');
  for (const m of seed.matchAll(/word:\s*'([^']+)'/g)) set.add(m[1].trim().toLowerCase());

  // builtin.ts：  word: { zh: ... }
  const builtin = fs.readFileSync(path.join(ROOT, 'lib/dictionary/builtin.ts'), 'utf8');
  for (const m of builtin.matchAll(/^\s+([a-zA-Z][a-zA-Z'-]*):\s*\{/gm)) set.add(m[1].trim().toLowerCase());

  // 常用字（Google 字頻表，依頻率排序取前 N）— 重試 + 備援 URL
  const FREQ_URLS = [
    FREQ_URL,
    'https://cdn.jsdelivr.net/gh/first20hours/google-10000-english@master/google-10000-english-usa.txt',
    'https://raw.githubusercontent.com/first20hours/google-10000-english/master/google-10000-english.txt',
  ];
  let loaded = false;
  for (const url of FREQ_URLS) {
    for (let attempt = 0; attempt < 2 && !loaded; attempt++) {
      try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const txt = await res.text();
        const top = txt.split('\n').map((l) => l.trim()).filter(Boolean).slice(0, TOP_N);
        for (const w of top) set.add(w.toLowerCase());
        console.log(`字頻表載入（${url.split('/')[2]}）：取前 ${top.length} 字`);
        loaded = true;
      } catch (e) {
        console.warn(`  字頻表嘗試失敗 ${url.split('/')[2]}: ${e.message}`);
        await sleep(800);
      }
    }
    if (loaded) break;
  }
  if (!loaded) console.warn('⚠️ 字頻表全部失敗，這次只處理 seed+builtin（manifest 會保留硬碟上既有檔）');

  // 只留單一英文字（跳過片語/含空白/太短）
  return [...set].filter((w) => /^[a-z][a-z'-]{1,30}$/.test(w));
}

async function fetchTTS(word) {
  const url = `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=en&q=${encodeURIComponent(word)}`;
  const res = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length < 500) throw new Error('too small');
  return buf;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const words = await collectWords();
  console.log(`共 ${words.length} 個單字要處理`);

  const manifest = [];
  let done = 0, skip = 0, fail = 0;

  for (const word of words) {
    const s = slug(word);
    const file = path.join(OUT_DIR, `${s}.mp3`);
    if (fs.existsSync(file)) { manifest.push(s); skip++; continue; }
    try {
      const buf = await fetchTTS(word);
      fs.writeFileSync(file, buf);
      manifest.push(s);
      done++;
      if (done % 20 === 0) console.log(`  已產生 ${done} 個…`);
      await sleep(280);
    } catch (e) {
      fail++;
      console.warn(`  ✗ ${word}: ${e.message}`);
      await sleep(800);
    }
  }

  // manifest 從「硬碟上實際存在的 mp3」重建 → 即使字頻表抓取失敗也不會縮水
  const onDisk = fs.readdirSync(OUT_DIR)
    .filter((f) => f.endsWith('.mp3'))
    .map((f) => f.replace(/\.mp3$/, ''));
  const uniq = [...new Set(onDisk)].sort();
  fs.writeFileSync(path.join(OUT_DIR, 'manifest.json'), JSON.stringify(uniq));
  console.log(`\n完成：新增 ${done}、跳過 ${skip}、失敗 ${fail}、manifest ${uniq.length} 字（依硬碟實檔）`);
}

main();
