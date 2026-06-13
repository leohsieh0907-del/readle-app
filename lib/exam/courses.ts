/**
 * 考試準備 — 多益 TOEIC + 全民英檢 GEPT
 * 課程內容與題庫皆為靜態（零 AI 配額、永遠可用）。
 */

export interface ExamVocab { word: string; pos: string; zh: string; example: string }
export interface ExamPoint { title: string; body: string }
export interface ExamLesson {
  id: string;
  title: string;
  kind: 'vocab' | 'grammar' | 'tips';
  intro?: string;
  vocab?: ExamVocab[];
  points?: ExamPoint[];
  tips?: string[];
}
export interface ExamQuestion {
  id: string;
  tag: string;            // 題型標籤，如 Part 5・文法、初級・詞彙
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}
export interface ExamCourse {
  id: 'toeic' | 'gept';
  name: string;
  nameEn: string;
  emoji: string;
  gradient: string;
  tagline: string;
  format: { label: string; value: string }[];
  lessons: ExamLesson[];
  questions: ExamQuestion[];
}

// ─────────────────────────── 多益 TOEIC ───────────────────────────
const TOEIC: ExamCourse = {
  id: 'toeic',
  name: '多益 TOEIC',
  nameEn: 'Test of English for International Communication',
  emoji: '💼',
  gradient: 'from-[#7C7CFF] to-[#5B5BF0]',
  tagline: '職場商務英語・990 滿分',
  format: [
    { label: '聽力', value: '100 題 / 約 45 分鐘（Part 1–4）' },
    { label: '閱讀', value: '100 題 / 75 分鐘（Part 5–7）' },
    { label: '滿分', value: '990 分（聽力 495 + 閱讀 495）' },
    { label: '情境', value: '辦公室、商務、財經、旅遊、人事' },
  ],
  lessons: [
    {
      id: 'toeic-vocab-office',
      title: '必考商務單字 ①：辦公室與會議',
      kind: 'vocab',
      intro: '多益最常出現的辦公室情境字，先掌握這些。',
      vocab: [
        { word: 'schedule', pos: 'n./v.', zh: '時間表；安排', example: 'Let me check my schedule for next week.' },
        { word: 'deadline', pos: 'n.', zh: '截止期限', example: 'The deadline for the report is Friday.' },
        { word: 'agenda', pos: 'n.', zh: '議程', example: 'The first item on the agenda is the budget.' },
        { word: 'colleague', pos: 'n.', zh: '同事', example: 'I discussed it with my colleagues.' },
        { word: 'memo', pos: 'n.', zh: '備忘錄', example: 'Please read the memo about the new policy.' },
        { word: 'attend', pos: 'v.', zh: '出席、參加', example: 'All managers must attend the meeting.' },
      ],
    },
    {
      id: 'toeic-vocab-business',
      title: '必考商務單字 ②：交易與財務',
      kind: 'vocab',
      intro: '商務與財經情境的高頻字。',
      vocab: [
        { word: 'invoice', pos: 'n.', zh: '發票、請款單', example: 'The invoice should be paid within 30 days.' },
        { word: 'negotiate', pos: 'v.', zh: '協商、談判', example: 'We need to negotiate a better price.' },
        { word: 'revenue', pos: 'n.', zh: '營收', example: 'Annual revenue increased by 20%.' },
        { word: 'contract', pos: 'n.', zh: '合約', example: 'Both parties signed the contract.' },
        { word: 'client', pos: 'n.', zh: '客戶', example: 'We met with an important client today.' },
        { word: 'shipment', pos: 'n.', zh: '貨運、出貨', example: 'The shipment will arrive within two days.' },
      ],
    },
    {
      id: 'toeic-vocab-career',
      title: '必考商務單字 ③：人事與求職',
      kind: 'vocab',
      intro: '招募、升遷、人事相關字。',
      vocab: [
        { word: 'resume', pos: 'n.', zh: '履歷', example: 'Please send your resume by email.' },
        { word: 'qualified', pos: 'adj.', zh: '合格的、有資格的', example: 'She is highly qualified for the position.' },
        { word: 'promotion', pos: 'n.', zh: '升遷；促銷', example: 'He received a promotion last month.' },
        { word: 'apply', pos: 'v.', zh: '申請', example: 'I want to apply for the marketing job.' },
        { word: 'candidate', pos: 'n.', zh: '應徵者、候選人', example: 'We interviewed three candidates.' },
        { word: 'salary', pos: 'n.', zh: '薪水', example: 'The salary is negotiable.' },
      ],
    },
    {
      id: 'toeic-grammar',
      title: 'Part 5 文法重點',
      kind: 'grammar',
      intro: '閱讀 Part 5（單句填空）最常考的文法觀念。',
      points: [
        { title: '介系詞 by / until / within', body: 'by 表「在…之前完成」（by Friday）；until 表「持續到…」（wait until 5pm）；within 表「在…之內」（within 30 days）。' },
        { title: '詞性判斷', body: '空格看前後決定詞性：冠詞後接名詞、be 動詞後常接形容詞/過去分詞、動詞前接副詞。如 a ___ candidate → 形容詞 qualified。' },
        { title: '被動語態 be + p.p.', body: '主詞是「被動作的對象」時用被動：The room is located on the 3rd floor.（房間被定位）。' },
        { title: '主謂一致', body: '主詞單複數決定動詞：The manager leads…（單數+s）；Employees provide…（複數無 s）。' },
        { title: '連接詞 vs 介系詞', body: 'because（連接詞）後接句子；because of（介系詞）後接名詞。although vs despite 同理。' },
      ],
    },
    {
      id: 'toeic-tips',
      title: '應試技巧',
      kind: 'tips',
      tips: [
        'Part 5 一題約 20 秒：先看空格前後，多數靠文法/詞性就能選，不必讀懂全句。',
        '聽力 Part 2 問句開頭（What/Where/When/Who）決定答案方向，先抓疑問詞。',
        '閱讀 Part 7 先看題目再回文章找關鍵字，不要先全文精讀。',
        '時間分配：閱讀 75 分鐘，Part 5+6 控制在 20 分鐘內，留時間給 Part 7 長文。',
        '不倒扣，務必每題都猜一個，空白沒有分。',
      ],
    },
  ],
  questions: [
    { id: 't1', tag: 'Part 5・文法', question: 'Please submit your report ___ Friday afternoon.', options: ['until', 'by', 'at', 'in'], correctIndex: 1, explanation: 'by 表「在某時間點之前完成」；until 是「持續到」，不符「繳交」的語意。' },
    { id: 't2', tag: 'Part 5・詞性', question: 'The conference room is ___ on the third floor.', options: ['locate', 'located', 'locating', 'location'], correctIndex: 1, explanation: 'be 動詞 is 後用過去分詞構成被動：「房間被設置在」→ is located。' },
    { id: 't3', tag: 'Part 5・文法', question: 'All employees must ___ their ID badges at all times.', options: ['wears', 'wearing', 'wear', 'worn'], correctIndex: 2, explanation: '情態動詞 must 後一律接原形動詞 wear。' },
    { id: 't4', tag: 'Part 5・介系詞', question: 'Sales have increased ___ 15% compared to last year.', options: ['by', 'of', 'to', 'for'], correctIndex: 0, explanation: 'increase by + 幅度，表「增加了多少」。' },
    { id: 't5', tag: 'Part 5・介系詞', question: 'The shipment will arrive ___ two business days.', options: ['on', 'at', 'within', 'since'], correctIndex: 2, explanation: 'within + 時間長度，表「在…之內」。' },
    { id: 't6', tag: 'Part 5・詞性', question: 'We are looking for a ___ candidate for the manager role.', options: ['qualify', 'qualified', 'qualifying', 'qualification'], correctIndex: 1, explanation: '冠詞 a 與名詞 candidate 之間需形容詞，qualified（合格的）。' },
    { id: 't7', tag: 'Part 5・詞彙', question: 'We need to ___ the deadline because of the delay.', options: ['expand', 'extend', 'expense', 'expect'], correctIndex: 1, explanation: 'extend a deadline = 延長期限；expand 是「擴大（規模）」。' },
    { id: 't8', tag: 'Part 5・介系詞', question: 'Ms. Chen is responsible ___ managing the annual budget.', options: ['of', 'for', 'to', 'with'], correctIndex: 1, explanation: 'be responsible for + 事物，固定搭配。' },
    { id: 't9', tag: 'Part 5・文法', question: 'The proposal was approved ___ the board of directors.', options: ['by', 'from', 'of', 'with'], correctIndex: 0, explanation: '被動語態中，動作執行者用 by 帶出：被董事會核准。' },
    { id: 't10', tag: 'Part 5・詞彙', question: 'Our products are known ___ their reliability.', options: ['as', 'for', 'by', 'to'], correctIndex: 1, explanation: 'be known for + 特點（以…聞名）；be known as 是「被稱為…」。' },
    { id: 't11', tag: 'Part 5・文法', question: 'If you ___ any questions, please contact the HR department.', options: ['has', 'having', 'have', 'had'], correctIndex: 2, explanation: '主詞 you 用原形 have；這是現在事實的條件句。' },
    { id: 't12', tag: 'Part 5・詞性', question: 'Please make sure the form is ___ before submitting it.', options: ['complete', 'completely', 'completion', 'completing'], correctIndex: 0, explanation: 'be 動詞 is 後接形容詞 complete（完整的）描述狀態。' },
    { id: 't13', tag: 'Part 5・詞彙', question: 'Employees are encouraged to ___ feedback through the survey.', options: ['provides', 'provided', 'provide', 'providing'], correctIndex: 2, explanation: 'to + 原形動詞 provide（不定詞）。' },
    { id: 't14', tag: 'Part 5・介系詞', question: 'The invoice must be paid ___ 30 days of receipt.', options: ['by', 'until', 'within', 'for'], correctIndex: 2, explanation: 'within 30 days = 30 天之內，強調期間。' },
    { id: 't15', tag: 'Part 5・文法', question: 'The new manager ___ the weekly team meeting.', options: ['lead', 'leads', 'leading', 'to lead'], correctIndex: 1, explanation: '單數主詞 The manager 配第三人稱單數動詞 leads。' },
  ],
};

// ─────────────────────────── 全民英檢 GEPT ───────────────────────────
const GEPT: ExamCourse = {
  id: 'gept',
  name: '全民英檢 GEPT',
  nameEn: 'General English Proficiency Test',
  emoji: '🎓',
  gradient: 'from-[#4ADE80] to-[#22C55E]',
  tagline: '聽說讀寫四項・分級檢定',
  format: [
    { label: '分級', value: '初級 / 中級 / 中高級 / 高級 / 優級' },
    { label: '項目', value: '聽力、閱讀（第一階段）＋ 寫作、口說（第二階段）' },
    { label: '初級程度', value: '約國中畢業，日常生活基本溝通' },
    { label: '中級程度', value: '約高中畢業，處理日常與部分職場情境' },
  ],
  lessons: [
    {
      id: 'gept-vocab-basic',
      title: '初級必備單字：日常生活',
      kind: 'vocab',
      intro: '初級檢定最常見的生活字彙。',
      vocab: [
        { word: 'weather', pos: 'n.', zh: '天氣', example: 'The weather is nice today.' },
        { word: 'breakfast', pos: 'n.', zh: '早餐', example: 'I have breakfast at seven.' },
        { word: 'weekend', pos: 'n.', zh: '週末', example: 'We go hiking on weekends.' },
        { word: 'favorite', pos: 'adj.', zh: '最喜愛的', example: 'Blue is my favorite color.' },
        { word: 'borrow', pos: 'v.', zh: '借（入）', example: 'Can I borrow your pen?' },
        { word: 'careful', pos: 'adj.', zh: '小心的', example: 'Be careful on the stairs.' },
      ],
    },
    {
      id: 'gept-vocab-inter',
      title: '中級必備單字：觀點與描述',
      kind: 'vocab',
      intro: '中級常用的描述與意見字彙。',
      vocab: [
        { word: 'environment', pos: 'n.', zh: '環境', example: 'We should protect the environment.' },
        { word: 'opinion', pos: 'n.', zh: '意見', example: 'In my opinion, the plan is good.' },
        { word: 'experience', pos: 'n./v.', zh: '經驗；經歷', example: 'She has a lot of teaching experience.' },
        { word: 'improve', pos: 'v.', zh: '改善、提升', example: 'I want to improve my English.' },
        { word: 'suggest', pos: 'v.', zh: '建議', example: 'He suggested going by train.' },
        { word: 'although', pos: 'conj.', zh: '雖然', example: 'Although it was raining, we went out.' },
      ],
    },
    {
      id: 'gept-grammar',
      title: '常考文法重點',
      kind: 'grammar',
      intro: '初級到中級最常考的文法觀念。',
      points: [
        { title: '比較級與最高級', body: 'tall→taller→tallest；長形容詞用 more/most：more beautiful。than 用於兩者比較。' },
        { title: '現在完成式 have/has + p.p.', body: '表「從過去到現在」：I have lived here since 2010 / for 5 years。since 接時間點，for 接時間長度。' },
        { title: '條件句（第一類）', body: 'If + 現在式, will + 原形：If it rains tomorrow, we will stay home.（注意 if 子句不用 will）' },
        { title: '動名詞 vs 不定詞', body: 'enjoy/suggest/finish 後接 V-ing；want/decide/hope 後接 to V。' },
        { title: '關係代名詞 who / which', body: 'who 代替人、which 代替物，引導子句修飾名詞：The man who helped me…' },
      ],
    },
    {
      id: 'gept-tips',
      title: '應試技巧',
      kind: 'tips',
      tips: [
        '初級聽力：看圖題先看圖片差異，鎖定關鍵名詞再聽。',
        '閱讀克漏字：先讀完整句再選，注意前後文邏輯（時態、連接詞）。',
        '寫作：先列大綱再寫，句型力求正確簡單，勝過用錯的難句。',
        '口說：回答時用完整句，先給觀點再給一個理由（because…）。',
        '兩階段制：第一階段（聽讀）通過才考第二階段（寫說），先穩拿聽讀。',
      ],
    },
  ],
  questions: [
    { id: 'g1', tag: '初級・文法', question: 'I usually ___ to school by bus.', options: ['go', 'goes', 'going', 'went'], correctIndex: 0, explanation: '主詞 I 用原形 go；usually 表習慣，用現在簡單式。' },
    { id: 'g2', tag: '初級・比較級', question: 'My brother is ___ than me.', options: ['tall', 'taller', 'tallest', 'more tall'], correctIndex: 1, explanation: '兩者比較用比較級 taller，搭配 than。' },
    { id: 'g3', tag: '初級・文法', question: 'There ___ some milk in the fridge.', options: ['is', 'are', 'have', 'has'], correctIndex: 0, explanation: 'milk 不可數視為單數，用 There is。' },
    { id: 'g4', tag: '初級・介系詞', question: 'He has studied English ___ 2015.', options: ['for', 'since', 'at', 'in'], correctIndex: 1, explanation: 'since + 時間點（2015）；for 接時間長度（five years）。' },
    { id: 'g5', tag: '初級・詞彙', question: 'Can I ___ your dictionary for a moment?', options: ['lend', 'borrow', 'bring', 'take'], correctIndex: 1, explanation: 'borrow 是「向別人借入」；lend 是「借出給別人」。' },
    { id: 'g6', tag: '初級・介系詞', question: "I'm interested ___ learning Japanese.", options: ['in', 'on', 'at', 'for'], correctIndex: 0, explanation: 'be interested in + 名詞/動名詞，固定搭配。' },
    { id: 'g7', tag: '中級・條件句', question: 'If it ___ tomorrow, we will cancel the picnic.', options: ['rain', 'rains', 'rained', 'will rain'], correctIndex: 1, explanation: '第一類條件句：if 子句用現在式，主詞 it 用 rains。' },
    { id: 'g8', tag: '中級・被動', question: 'This novel ___ by millions of readers.', options: ['reads', 'is read', 'reading', 'has read'], correctIndex: 1, explanation: '小說「被閱讀」，用被動 is read（be + p.p.）。' },
    { id: 'g9', tag: '中級・動名詞', question: 'She suggested ___ a taxi to the airport.', options: ['take', 'to take', 'taking', 'took'], correctIndex: 2, explanation: 'suggest 後接動名詞 V-ing（taking）。' },
    { id: 'g10', tag: '中級・時態', question: 'By the time we arrived, the train ___.', options: ['left', 'has left', 'had left', 'leaves'], correctIndex: 2, explanation: '過去某動作之前已完成，用過去完成式 had left。' },
    { id: 'g11', tag: '中級・關係代名詞', question: "He's the teacher ___ helped me with my essay.", options: ['which', 'who', 'whose', 'what'], correctIndex: 1, explanation: '先行詞是人（teacher），主格關係代名詞用 who。' },
    { id: 'g12', tag: '中級・連接詞', question: '___ it was expensive, she decided to buy it.', options: ['Because', 'Although', 'So', 'Unless'], correctIndex: 1, explanation: '前後語意相反（貴卻買），用 Although（雖然）。' },
  ],
};

export const EXAM_COURSES: ExamCourse[] = [TOEIC, GEPT];
export const getExamCourse = (id: string): ExamCourse | undefined => EXAM_COURSES.find((c) => c.id === id);
