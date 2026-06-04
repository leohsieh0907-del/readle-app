/**
 * Phase 1 AI 助教 Mock 回應
 * Phase 4 替換成 Gemini 真實 API call
 */

export interface MockReply {
  content: string;
  quickReplies?: string[];
}

interface Match {
  triggers: RegExp[];
  reply: MockReply;
}

const matches: Match[] = [
  {
    triggers: [/面試|interview/i],
    reply: {
      content: '好啊！想練哪種職位？我可以扮演面試官，給你問問題。',
      quickReplies: ['軟體工程師', '行銷專員', '產品經理', '隨機'],
    },
  },
  {
    triggers: [/咖啡|點餐|cafe/i],
    reply: {
      content: '😄 沒問題！我們在 Starbucks 點餐吧。\n\nBarista: "Hi! What can I get for you today?"\n\n👉 換你回應，可以打字或按 🎙 錄音。',
    },
  },
  {
    triggers: [/單字|vocabulary|背/],
    reply: {
      content: '想多背點單字嗎？我推薦你從這個方向開始：',
      quickReplies: ['多益高頻 100 字', '商業 Email 用詞', '日常對話必備'],
    },
  },
  {
    triggers: [/文法|grammar/i],
    reply: {
      content: '丟一句英文給我，我幫你看文法。或者你想學哪個文法主題？',
      quickReplies: ['完成式 vs 過去式', '虛擬語氣', '分詞構句'],
    },
  },
  {
    triggers: [/發音|pronunciation|口說/i],
    reply: {
      content: '想練發音的話，跟讀模式很適合。或者你想對著我說一句，我給你打分？',
      quickReplies: ['開始跟讀練習', '錄音給我聽聽', '練多益口說'],
    },
  },
  {
    triggers: [/寫作|writing|作文/i],
    reply: {
      content: '把你寫的英文貼上來，我會：\n· 標出錯誤\n· 提供 3 種改寫版本\n· 教你更道地的說法',
    },
  },
  {
    triggers: [/弱點|加強|建議/],
    reply: {
      content: '看了你最近的學習資料，建議今天先：\n1. 複習 8 個忘了的單字（5 分）\n2. 看「商業 Email 慣用語」影片（10 分）\n3. 做 5 題小測驗\n\n總共 20 分鐘左右，要開始嗎？',
      quickReplies: ['好，從第 1 步開始', '改成 10 分鐘版本', '我自己挑'],
    },
  },
];

const defaultReply: MockReply = {
  content: '我是 Luna 🌙 你的 AI 英語助教。試試問我：\n\n· 「我想練面試對話」\n· 「幫我看這句文法對不對」\n· 「我哪裡需要加強？」',
  quickReplies: ['練口說', '練文法', '推薦影片', '看我的弱點'],
};

const greeting: MockReply = {
  content: '嗨 👋 我是 Luna，你的 AI 英語助教。\n\n今天想練哪一塊？或者直接告訴我你想學什麼。',
  quickReplies: ['情境對話', '文法檢查', '發音練習', '看我的學習狀況'],
};

export function getGreeting(): MockReply {
  return greeting;
}

export function getMockReply(userText: string): MockReply {
  for (const m of matches) {
    if (m.triggers.some((re) => re.test(userText))) {
      return m.reply;
    }
  }
  return defaultReply;
}
