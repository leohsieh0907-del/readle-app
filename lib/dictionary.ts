import type { DictEntry } from './types';

const dict: Record<string, Omit<DictEntry, 'word'>> = {
  coffee: { pos: 'n.', level: 'A1', zh: '咖啡', example: 'I drink coffee every morning.' },
  popular: { pos: 'adj.', level: 'A2', zh: '受歡迎的', example: 'This song is very popular.' },
  drink: { pos: 'v. / n.', level: 'A1', zh: '喝；飲料', example: 'She drinks tea, not coffee.' },
  morning: { pos: 'n.', level: 'A1', zh: '早晨', example: 'I run in the morning.' },
  awake: { pos: 'adj.', level: 'A2', zh: '清醒的', example: 'Are you awake yet?' },
  ready: { pos: 'adj.', level: 'A1', zh: '準備好的', example: 'I am ready to start.' },
  espresso: { pos: 'n.', level: 'B1', zh: '濃縮咖啡', example: 'He ordered a double espresso.' },
  thick: { pos: 'adj.', level: 'A2', zh: '濃稠的；厚的', example: 'The soup is thick.' },
  sweet: { pos: 'adj.', level: 'A1', zh: '甜的', example: 'This cake is too sweet.' },
  milk: { pos: 'n.', level: 'A1', zh: '牛奶', example: 'Add milk to your coffee.' },
  culture: { pos: 'n.', level: 'B1', zh: '文化', example: 'Japanese culture is rich.' },
  friends: { pos: 'n.', level: 'A1', zh: '朋友（複數）', example: 'She has many friends.' },
  share: { pos: 'v.', level: 'A2', zh: '分享', example: 'Share your snacks with me.' },
  stories: { pos: 'n.', level: 'A1', zh: '故事（複數）', example: 'Grandma tells stories.' },
  bring: { pos: 'v.', level: 'A1', zh: '帶來', example: 'Music brings people together.' },
  together: { pos: 'adv.', level: 'A2', zh: '一起', example: 'We work together.' },

  century: { pos: 'n.', level: 'B1', zh: '世紀', example: 'The 21st century has just begun.' },
  internal: { pos: 'adj.', level: 'B2', zh: '內部的', example: 'It is an internal matter.' },
  combustion: { pos: 'n.', level: 'C1', zh: '燃燒', example: 'Combustion releases energy.' },
  engine: { pos: 'n.', level: 'A2', zh: '引擎', example: 'The engine started smoothly.' },
  dominated: { pos: 'v.', level: 'B2', zh: '支配；主導', example: 'Big tech dominated the market.' },
  silently: { pos: 'adv.', level: 'B1', zh: '安靜地', example: 'She left the room silently.' },
  electric: { pos: 'adj.', level: 'A2', zh: '電動的', example: 'I bought an electric bike.' },
  vehicles: { pos: 'n.', level: 'B1', zh: '車輛（複數）', example: 'Heavy vehicles are not allowed.' },
  sales: { pos: 'n.', level: 'A2', zh: '銷售量', example: 'Sales rose last quarter.' },
  surged: { pos: 'v.', level: 'C1', zh: '激增', example: 'Demand surged overnight.' },
  governments: { pos: 'n.', level: 'B1', zh: '政府（複數）', example: 'Governments must cooperate.' },
  announced: { pos: 'v.', level: 'B1', zh: '宣布', example: 'They announced a new policy.' },
  gasoline: { pos: 'n.', level: 'B2', zh: '汽油', example: 'Gasoline prices keep rising.' },
  entirely: { pos: 'adv.', level: 'B2', zh: '完全地', example: 'I am entirely sure.' },
  shift: { pos: 'n.', level: 'B2', zh: '轉變；輪班', example: 'A cultural shift is happening.' },
  climate: { pos: 'n.', level: 'B1', zh: '氣候', example: 'Climate change is urgent.' },
  policy: { pos: 'n.', level: 'B1', zh: '政策', example: 'The new policy starts in June.' },
  battery: { pos: 'n.', level: 'A2', zh: '電池', example: 'The battery is almost empty.' },
  consumer: { pos: 'n.', level: 'B2', zh: '消費者', example: 'Consumer trust matters.' },
  technology: { pos: 'n.', level: 'A2', zh: '科技', example: 'Technology is evolving fast.' },
  thousand: { pos: 'num.', level: 'A1', zh: '一千', example: 'There were a thousand people.' },
  kilowatt: { pos: 'n.', level: 'C1', zh: '千瓦', example: 'The motor uses two kilowatts.' },
  roughly: { pos: 'adv.', level: 'B2', zh: '大約', example: 'It costs roughly fifty dollars.' },
  dramatic: { pos: 'adj.', level: 'B2', zh: '戲劇性的；劇烈的', example: 'A dramatic improvement.' },
  decline: { pos: 'n. / v.', level: 'B2', zh: '下降；衰退', example: 'A sharp decline in sales.' },
  affordable: { pos: 'adj.', level: 'B1', zh: '負擔得起的', example: 'Affordable housing is rare.' },
  audience: { pos: 'n.', level: 'B1', zh: '受眾；觀眾', example: 'A wider audience is needed.' },
  transition: { pos: 'n.', level: 'B2', zh: '過渡；轉換', example: 'A smooth transition is hard.' },
  straightforward: { pos: 'adj.', level: 'B2', zh: '直接的；簡單明瞭的', example: 'The plan looks straightforward.' },
  charging: { pos: 'n. / v.', level: 'B1', zh: '充電', example: 'Charging takes two hours.' },
  infrastructure: { pos: 'n.', level: 'C1', zh: '基礎建設', example: 'Aging infrastructure is risky.' },
  uneven: { pos: 'adj.', level: 'B2', zh: '不平均的', example: 'Growth has been uneven.' },
  rural: { pos: 'adj.', level: 'B2', zh: '鄉村的', example: 'I grew up in a rural town.' },
  mining: { pos: 'n.', level: 'B1', zh: '採礦', example: 'Mining damages ecosystems.' },
  materials: { pos: 'n.', level: 'A2', zh: '材料（複數）', example: 'Raw materials are expensive.' },
  serious: { pos: 'adj.', level: 'A2', zh: '嚴重的；認真的', example: 'A serious mistake.' },
  environmental: { pos: 'adj.', level: 'B1', zh: '環境的', example: 'Environmental laws are strict.' },
  concerns: { pos: 'n.', level: 'B1', zh: '擔憂', example: 'I share your concerns.' },
  revolution: { pos: 'n.', level: 'B1', zh: '革命', example: 'A digital revolution is underway.' },
  remembered: { pos: 'v.', level: 'A2', zh: '被記得', example: 'He will be remembered fondly.' },
  quiet: { pos: 'adj.', level: 'A1', zh: '安靜的', example: 'A quiet evening at home.' },
  overlooked: { pos: 'v.', level: 'B2', zh: '被忽視', example: 'A small detail was overlooked.' },
  thoughtfully: { pos: 'adv.', level: 'B2', zh: '深思熟慮地', example: 'She answered thoughtfully.' },
  managed: { pos: 'v.', level: 'A2', zh: '管理；設法做到', example: 'They managed the project well.' },
};

export function lookupWord(raw: string): DictEntry | null {
  const word = raw.toLowerCase().replace(/[^a-z'-]/g, '');
  if (!word) return null;
  const entry = dict[word];
  if (entry) return { word, ...entry };
  const singular = word.replace(/s$/, '');
  if (singular !== word && dict[singular]) {
    return { word, ...dict[singular] };
  }
  return null;
}
