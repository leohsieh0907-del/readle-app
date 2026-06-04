/**
 * 50 個高頻多益 / 商業 / 日常單字種子資料
 */

import type { VocabEntry, Category } from '../readle-types';

interface SeedWord {
  word: string;
  phonetic: string;
  partOfSpeech: string;
  meaning: string;
  example: { en: string; zh: string };
  category: Category;
}

export const seedWords: SeedWord[] = [
  // TOEIC 高頻
  { word: 'elaborate', phonetic: '/ɪˈlæbəreɪt/', partOfSpeech: 'verb', meaning: '詳細闡述；精心製作', example: { en: 'Could you elaborate on your proposal?', zh: '你能對你的提案做進一步說明嗎？' }, category: 'toeic' },
  { word: 'subsequently', phonetic: '/ˈsʌbsɪkwəntli/', partOfSpeech: 'adv', meaning: '隨後；後來', example: { en: 'He subsequently joined our team.', zh: '他隨後加入了我們團隊。' }, category: 'toeic' },
  { word: 'allocate', phonetic: '/ˈæləkeɪt/', partOfSpeech: 'verb', meaning: '分配；撥出', example: { en: 'We need to allocate more budget to marketing.', zh: '我們需要分配更多預算給行銷。' }, category: 'toeic' },
  { word: 'comprehensive', phonetic: '/ˌkɒmprɪˈhensɪv/', partOfSpeech: 'adj', meaning: '全面的；綜合的', example: { en: 'This is a comprehensive report.', zh: '這是一份全面的報告。' }, category: 'toeic' },
  { word: 'inevitable', phonetic: '/ɪnˈevɪtəbl/', partOfSpeech: 'adj', meaning: '不可避免的', example: { en: 'Change is inevitable.', zh: '改變是不可避免的。' }, category: 'toeic' },

  // Business
  { word: 'leverage', phonetic: '/ˈliːvərɪdʒ/', partOfSpeech: 'verb', meaning: '善用；發揮槓桿作用', example: { en: 'We can leverage our existing network.', zh: '我們可以善用既有人脈。' }, category: 'business' },
  { word: 'streamline', phonetic: '/ˈstriːmlaɪn/', partOfSpeech: 'verb', meaning: '簡化流程', example: { en: 'We need to streamline our workflow.', zh: '我們需要簡化工作流程。' }, category: 'business' },
  { word: 'stakeholder', phonetic: '/ˈsteɪkhəʊldə(r)/', partOfSpeech: 'noun', meaning: '利害關係人', example: { en: 'All stakeholders should be informed.', zh: '所有利害關係人都應該被通知。' }, category: 'business' },
  { word: 'synergy', phonetic: '/ˈsɪnədʒi/', partOfSpeech: 'noun', meaning: '綜效；協同效應', example: { en: 'The merger created great synergy.', zh: '這次合併產生了極大的綜效。' }, category: 'business' },
  { word: 'deliverable', phonetic: '/dɪˈlɪvərəbl/', partOfSpeech: 'noun', meaning: '交付物；可交付成果', example: { en: 'What are the key deliverables?', zh: '主要的交付物是什麼？' }, category: 'business' },

  // Daily
  { word: 'awkward', phonetic: '/ˈɔːkwəd/', partOfSpeech: 'adj', meaning: '尷尬的；笨拙的', example: { en: 'That was an awkward moment.', zh: '那是個尷尬的時刻。' }, category: 'daily' },
  { word: 'cozy', phonetic: '/ˈkəʊzi/', partOfSpeech: 'adj', meaning: '舒適的；溫馨的', example: { en: 'This cafe is so cozy.', zh: '這家咖啡店真舒適。' }, category: 'daily' },
  { word: 'hangout', phonetic: '/ˈhæŋaʊt/', partOfSpeech: 'noun', meaning: '常去的地方；聚會', example: { en: 'This is our usual hangout.', zh: '這是我們常聚的地方。' }, category: 'daily' },
  { word: 'vibe', phonetic: '/vaɪb/', partOfSpeech: 'noun', meaning: '氛圍；感覺', example: { en: 'I love the vibe here.', zh: '我喜歡這裡的氛圍。' }, category: 'daily' },
  { word: 'broke', phonetic: '/brəʊk/', partOfSpeech: 'adj', meaning: '沒錢的；破產的', example: { en: 'I am totally broke this month.', zh: '我這個月完全沒錢。' }, category: 'daily' },

  // Travel
  { word: 'itinerary', phonetic: '/aɪˈtɪnərəri/', partOfSpeech: 'noun', meaning: '行程表', example: { en: 'Send me your itinerary.', zh: '把你的行程表傳給我。' }, category: 'travel' },
  { word: 'layover', phonetic: '/ˈleɪəʊvə(r)/', partOfSpeech: 'noun', meaning: '中途停留', example: { en: 'I have a 6-hour layover in Tokyo.', zh: '我在東京有 6 小時中停。' }, category: 'travel' },
  { word: 'jetlag', phonetic: '/ˈdʒetlæɡ/', partOfSpeech: 'noun', meaning: '時差', example: { en: 'I am still recovering from jetlag.', zh: '我還在調時差。' }, category: 'travel' },

  // Tech
  { word: 'deploy', phonetic: '/dɪˈplɔɪ/', partOfSpeech: 'verb', meaning: '部署；發佈', example: { en: 'We deploy every Friday.', zh: '我們每週五部署。' }, category: 'tech' },
  { word: 'refactor', phonetic: '/ˌriːˈfæktə(r)/', partOfSpeech: 'verb', meaning: '重構（程式碼）', example: { en: 'This module needs to be refactored.', zh: '這個模組需要重構。' }, category: 'tech' },
];

/**
 * 新使用者起始的 5 個示範單字（一個分類各一個）
 * 複習日期分散在今天 + 未來 4 天，不會全堆在同一天
 * 其餘單字靠使用者自己從影片、查詢功能加入
 */
export const starterWords: SeedWord[] = [
  { word: 'elaborate',  phonetic: '/ɪˈlæbəreɪt/',   partOfSpeech: 'verb', meaning: '詳細闡述；精心製作', example: { en: 'Could you elaborate on your proposal?', zh: '你能對你的提案做進一步說明嗎？' }, category: 'toeic' },
  { word: 'leverage',   phonetic: '/ˈliːvərɪdʒ/',    partOfSpeech: 'verb', meaning: '善用；發揮槓桿作用', example: { en: 'We can leverage our existing network.', zh: '我們可以善用既有人脈。' }, category: 'business' },
  { word: 'cozy',       phonetic: '/ˈkəʊzi/',         partOfSpeech: 'adj',  meaning: '舒適的；溫馨的',     example: { en: 'This cafe is so cozy.',              zh: '這家咖啡店真舒適。' }, category: 'daily' },
  { word: 'itinerary',  phonetic: '/aɪˈtɪnərəri/',   partOfSpeech: 'noun', meaning: '行程表',             example: { en: 'Send me your itinerary.',             zh: '把你的行程表傳給我。' }, category: 'travel' },
  { word: 'deploy',     phonetic: '/dɪˈplɔɪ/',        partOfSpeech: 'verb', meaning: '部署；發佈',         example: { en: 'We deploy every Friday.',             zh: '我們每週五部署。' }, category: 'tech' },
];

/** 把種子單字轉成 VocabEntry（只建 5 個示範字，複習日期分散） */
export function buildSeedVocab(): Record<string, VocabEntry> {
  const entries: Record<string, VocabEntry> = {};
  const now = new Date().toISOString();

  const addDays = (days: number) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return d.toISOString().slice(0, 10);
  };

  starterWords.forEach((w, idx) => {
    const id = `seed-${idx.toString().padStart(3, '0')}`;
    entries[id] = {
      id,
      word: w.word,
      phonetic: w.phonetic,
      partOfSpeech: w.partOfSpeech,
      meaning: w.meaning,
      examples: [w.example],
      category: w.category,
      tags: [],
      srs: {
        easeFactor: 2.5,
        interval: 1,
        repetitions: 0,
        // 分散在今天 + 未來 4 天（每天 1 個），不堆在同一天
        nextReviewAt: addDays(idx),
        status: 'new',
      },
      addedAt: now,
    };
  });

  return entries;
}
