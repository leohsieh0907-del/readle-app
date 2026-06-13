/**
 * 用 Gemini 生成 Luna 頭像，存成 public/luna.png
 * 執行：node scripts/gen-luna.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

function getKey() {
  const env = fs.readFileSync(path.join(ROOT, '.env.local'), 'utf8');
  const m = /GEMINI_API_KEY=(.+)/.exec(env);
  return m[1].trim();
}

const PROMPT = `A cute friendly female AI English tutor character named Luna, shown as a front-facing head-and-shoulders portrait.
Style: modern clean flat vector illustration / app mascot, soft rounded shapes.
Appearance: friendly young woman with a warm gentle smile, big sparkly expressive eyes, neat purple/indigo hair, light lavender skin tone glow.
Color scheme: purple and lavender gradient (#7C7CFF, #5B5BF0), soft and premium.
Background: simple solid soft lavender, centered, lots of padding.
Mood: warm, approachable, intelligent, adorable. High quality, crisp, suitable as a chat assistant avatar.`;

async function gen(model, key) {
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: PROMPT }] }],
      generationConfig: { responseModalities: ['IMAGE'] },
    }),
  });
  const txt = await res.text();
  if (!res.ok) throw new Error(`${model} ${res.status}: ${txt.slice(0, 200)}`);
  const d = JSON.parse(txt);
  const parts = d.candidates?.[0]?.content?.parts ?? [];
  const img = parts.find((p) => p.inlineData);
  if (!img) throw new Error(`no image: ${txt.slice(0, 200)}`);
  return Buffer.from(img.inlineData.data, 'base64');
}

async function main() {
  const key = getKey();
  const models = ['gemini-2.5-flash-image', 'gemini-3.1-flash-image', 'imagen-4.0-fast-generate-001'];
  for (const model of models) {
    try {
      console.log(`嘗試 ${model}…`);
      const buf = await gen(model, key);
      const out = path.join(ROOT, 'public', 'luna.png');
      fs.writeFileSync(out, buf);
      console.log(`成功！存到 public/luna.png (${(buf.length / 1024).toFixed(0)} KB) via ${model}`);
      return;
    } catch (e) {
      console.warn(`  失敗：${e.message}`);
    }
  }
  console.error('全部模型都失敗');
  process.exit(1);
}
main();
