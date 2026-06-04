/**
 * 從中英混雜文字中萃取英文片段
 * Luna 常回「Of course! 當然可以！ Try saying 'I'd like a latte.'」
 * 這時用英文 voice 念整段會把中文也念成英文 → 鬼畜
 * 解法：只挑出英文片段 + 標點，丟給 TTS
 */

export function extractEnglish(text: string): string {
  // 1. 移除程式碼框（避免念符號）
  let t = text.replace(/```[\s\S]*?```/g, ' ');
  // 2. 移除中文字（保留標點、英文、數字、空白）
  t = t.replace(/[一-鿿　-〿＀-￯]/g, ' ');
  // 3. 收摺多餘空白
  t = t.replace(/\s+/g, ' ').trim();
  // 4. 去掉孤立的標點（沒有英文字母的純標點段）
  t = t.replace(/(?:^|\s)[\.\,\!\?\;\:\-\—]+(?=\s|$)/g, '');
  return t.trim();
}

/** 若文字夠長且含英文，回 true */
export function hasEnglish(text: string): boolean {
  const en = extractEnglish(text);
  return en.length >= 3 && /[a-zA-Z]/.test(en);
}
