/**
 * Mock Provider — 無 API key 時使用，給開發 / 離線使用 / 配額用完備援
 * 比 Phase 1 的 regex 表面，這版會根據 prompt 內容做更聰明的假回應
 */

import type { LLMProvider, ChatRequest, ChatResponse } from './provider';

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

function detectIntent(text: string): string {
  const t = text.toLowerCase();
  if (/interview|面試/i.test(t)) return 'interview';
  if (/cafe|coffee|咖啡|點餐/i.test(t)) return 'cafe';
  if (/grammar|文法/i.test(t)) return 'grammar';
  if (/writing|email|寫作|作文/i.test(t)) return 'writing';
  if (/pronounce|發音|口說/i.test(t)) return 'speaking';
  if (/quiz|測驗|出題/i.test(t)) return 'quiz';
  if (/弱點|加強|建議/i.test(t)) return 'analysis';
  if (/單字|vocabulary|例句/i.test(t)) return 'vocab';
  return 'general';
}

const replies: Record<string, string[]> = {
  interview: [
    '好啊！我們來練面試對話。我先扮演面試官：\n\n"Hi, thanks for coming in today. Could you tell me a bit about yourself?"\n\n👉 換你回答，可以打字或按 🎙 錄音。',
  ],
  cafe: [
    '我們在 Starbucks 點餐吧。\n\n☕ Barista: "Hi! Welcome to Starbucks. What can I get for you today?"\n\n👉 試著用英文點一杯飲料！',
  ],
  grammar: [
    '丟一句英文給我，我幫你看文法。\n\n例如：「I have went to Tokyo last year.」\n→ "I went to Tokyo last year."（last year 是明確過去 → 用過去式）',
  ],
  writing: [
    '把你想寫的英文貼上來，我會：\n\n· 標出錯誤\n· 提供 3 種改寫版本\n· 教你更道地的說法\n\n💡 可指定文體：Email / 履歷 / 學術',
  ],
  speaking: [
    '想練發音？開影片頁的「跟讀模式」最有效。\n\n或在這裡打一句英文，我給你發音提示。',
  ],
  quiz: [
    '我幫你出 5 題。你想要哪種？\n\n· 聽力（TTS 念題）\n· 填空（看句子選字）\n· 單字（中英互譯）\n· 綜合（混合題型）',
  ],
  analysis: [
    '看了你最近的資料，建議今天先：\n\n1. 複習 8 個忘了的單字（5 分鐘）\n2. 看「商業 Email 慣用語」影片（10 分鐘）\n3. 做 5 題小測驗\n\n總共 ~20 分鐘。要開始嗎？',
  ],
  vocab: [
    '想練單字嗎？\n\n· 從你的單字本出題（中英互譯）\n· AI 即時生成例句（單字卡背面按「再生一句」）\n· 商業 / 多益 / 日常分類複習',
  ],
  general: [
    '我是 Luna 🌙，你的 AI 英語助教。\n\n試試問我：\n· 「我想練面試對話」\n· 「幫我看這句文法對不對」\n· 「我哪裡需要加強？」',
  ],
};

/** 從 prompt 萃取「最後一則 user 訊息」做意圖判斷 */
function lastUser(messages: ChatRequest['messages']): string {
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].role === 'user') return messages[i].content;
  }
  return '';
}

export const mockProvider: LLMProvider = {
  name: 'mock',

  async chat(req: ChatRequest): Promise<ChatResponse> {
    await wait(400);
    const intent = detectIntent(lastUser(req.messages));
    const pool = replies[intent] ?? replies.general;
    const pick = pool[Math.floor(Math.random() * pool.length)];

    // JSON 模式：產 mock structured output
    if (req.jsonMode) {
      const sample = {
        ok: true,
        intent,
        message: pick,
        suggestions: ['練口說', '練文法', '看推薦影片'],
      };
      return { content: JSON.stringify(sample), usage: { in: 50, out: 80 } };
    }

    return { content: pick, usage: { in: 50, out: 80 } };
  },

  async *chatStream(req: ChatRequest): AsyncIterable<string> {
    const intent = detectIntent(lastUser(req.messages));
    const pool = replies[intent] ?? replies.general;
    const text = pool[Math.floor(Math.random() * pool.length)];

    await wait(250);
    // 一段一段吐
    const chunkSize = 3;
    for (let i = 0; i < text.length; i += chunkSize) {
      yield text.slice(i, i + chunkSize);
      await wait(25 + Math.random() * 25);
    }
  },
};
