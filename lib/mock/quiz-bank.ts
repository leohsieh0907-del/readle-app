/**
 * Mock 題庫產生器
 * Phase 3 用這個假題目，Phase 4 改成 AI 動態生成
 */

import { vocabRepo } from '../storage/repos';
import type { QuizQuestionRecord, QuizType, SkillTag } from '../storage/quiz-actions';

function uid() {
  return 'q-' + crypto.randomUUID().slice(0, 8);
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/* ---------------- 預備假題 ---------------- */

const listeningQuestions: Omit<QuizQuestionRecord, 'id'>[] = [
  {
    stem: '請聽：The meeting has been rescheduled to next Friday.',
    options: ['會議延到下週五', '會議取消了', '會議改到上週五', '會議照常進行'],
    correctIndex: 0,
    audio: 'The meeting has been rescheduled to next Friday.',
    skillTag: 'listening',
    explanation: 'rescheduled 表示「重新安排時間」。',
  },
  {
    stem: '請聽：I would appreciate your prompt response.',
    options: ['希望盡快收到回覆', '不用回我也沒關係', '我會盡快回你', '請等我回覆'],
    correctIndex: 0,
    audio: 'I would appreciate your prompt response.',
    skillTag: 'listening',
    explanation: '商業 Email 常用句，prompt 表示「迅速的」。',
  },
  {
    stem: '請聽：Could you elaborate on your proposal?',
    options: ['可以詳細說明你的提案嗎', '可以收回你的提案嗎', '可以投票表決嗎', '可以重做提案嗎'],
    correctIndex: 0,
    audio: 'Could you elaborate on your proposal?',
    skillTag: 'listening',
    explanation: 'elaborate 表示「詳細闡述」。',
  },
  {
    stem: '請聽：Let me know if you need any clarification.',
    options: ['有需要說明的地方告訴我', '我需要進一步說明', '請保持安靜', '不需要再說了'],
    correctIndex: 0,
    audio: 'Let me know if you need any clarification.',
    skillTag: 'listening',
    explanation: 'clarification 表示「澄清、說明」。',
  },
  {
    stem: '請聽：The deadline has been moved up by two days.',
    options: ['期限提前兩天', '期限延後兩天', '取消期限', '期限維持原本'],
    correctIndex: 0,
    audio: 'The deadline has been moved up by two days.',
    skillTag: 'listening',
    explanation: 'move up 表示「提前」。',
  },
];

const clozeQuestions: Omit<QuizQuestionRecord, 'id'>[] = [
  {
    stem: 'We need to ______ our workflow to save time.',
    options: ['streamline', 'pretend', 'elaborate', 'cancel'],
    correctIndex: 0,
    skillTag: 'vocab',
    relatedWord: 'streamline',
    explanation: 'streamline = 簡化流程',
  },
  {
    stem: 'Could you please ______ on your last point?',
    options: ['elaborate', 'destroy', 'borrow', 'allocate'],
    correctIndex: 0,
    skillTag: 'vocab',
    relatedWord: 'elaborate',
    explanation: 'elaborate on = 詳細說明',
  },
  {
    stem: 'The team needs to ______ resources more effectively.',
    options: ['allocate', 'forget', 'delete', 'avoid'],
    correctIndex: 0,
    skillTag: 'vocab',
    relatedWord: 'allocate',
    explanation: 'allocate = 分配',
  },
  {
    stem: 'I have a 6-hour ______ in Tokyo before my next flight.',
    options: ['layover', 'jetlag', 'itinerary', 'boarding'],
    correctIndex: 0,
    skillTag: 'vocab',
    relatedWord: 'layover',
    explanation: 'layover = 中途停留',
  },
  {
    stem: 'We deploy new features every Friday and ______ legacy code on Mondays.',
    options: ['refactor', 'sleep', 'admire', 'pretend'],
    correctIndex: 0,
    skillTag: 'vocab',
    relatedWord: 'refactor',
    explanation: 'refactor = 重構程式碼',
  },
];

/* ---------------- 題目生成函式 ---------------- */

export function generateQuiz(type: QuizType, count: number = 5): QuizQuestionRecord[] {
  switch (type) {
    case 'listening':
      return shuffle(listeningQuestions)
        .slice(0, count)
        .map((q) => ({ ...q, id: uid(), options: shuffleWithCorrect(q.options, q.correctIndex).options, correctIndex: shuffleWithCorrect(q.options, q.correctIndex).correctIndex }));

    case 'cloze':
      return shuffle(clozeQuestions)
        .slice(0, count)
        .map((q) => {
          const s = shuffleWithCorrect(q.options, q.correctIndex);
          return { ...q, id: uid(), options: s.options, correctIndex: s.correctIndex };
        });

    case 'vocab':
      return generateVocabQuiz(count);

    case 'ai_gen':
      // 混合題型（mock 版本：對半混 listening + cloze + vocab）
      return shuffle([
        ...generateQuiz('listening', Math.ceil(count / 3)),
        ...generateQuiz('cloze', Math.ceil(count / 3)),
        ...generateQuiz('vocab', Math.ceil(count / 3)),
      ]).slice(0, count);
  }
}

/** 從使用者單字本中產生「中譯英」測驗 */
function generateVocabQuiz(count: number): QuizQuestionRecord[] {
  const all = Object.values(vocabRepo.get().entries);
  if (all.length < 4) {
    // 單字不夠 → 退回 cloze
    return generateQuiz('cloze', count);
  }
  const shuffled = shuffle(all).slice(0, Math.min(count, all.length));

  return shuffled.map((target) => {
    // 從其他單字中挑 3 個干擾項
    const others = shuffle(all.filter((e) => e.id !== target.id)).slice(0, 3);
    const opts = shuffle([target.word, ...others.map((o) => o.word)]);
    const correctIndex = opts.indexOf(target.word);
    return {
      id: uid(),
      stem: `「${target.meaning}」對應的英文是？`,
      options: opts,
      correctIndex,
      skillTag: 'vocab' as SkillTag,
      relatedWord: target.word,
      explanation: target.examples[0]?.en ?? '',
    };
  });
}

function shuffleWithCorrect(opts: string[], correctIdx: number): { options: string[]; correctIndex: number } {
  const correct = opts[correctIdx];
  const shuffled = shuffle(opts);
  return { options: shuffled, correctIndex: shuffled.indexOf(correct) };
}
