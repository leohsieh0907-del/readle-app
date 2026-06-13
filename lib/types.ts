export type CEFRLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1';

export type Category = 'News' | 'Culture' | 'Story' | 'Science' | 'Business';

export interface AudioTimestamp {
  sentenceIndex: number;
  start: number;
  end: number;
}

export interface DictEntry {
  word: string;
  pos: string;
  level: CEFRLevel;
  zh: string;
  example?: string;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
}

export interface VocabItem {
  word: string;
  pos?: string;     // 詞性，如 n. / v. / adj. / adv.
  def: string;
  usage?: string;   // 用法/搭配提示（繁中一句）
  example: string;
}

export interface GrammarNote {
  title: string;
  body: string;
}

export interface Article {
  id: string;
  title: string;
  level: CEFRLevel;
  category: Category;
  coverImage?: string;
  readingMinutes: number;
  audioUrl: string;
  paragraphs: string[][];
  timestamps: AudioTimestamp[];
  keyVocabulary: VocabItem[];
  grammarNotes: GrammarNote[];
  quizzes: QuizQuestion[];
}

export interface NotebookEntry extends DictEntry {
  savedAt: number;
  fromArticleId: string;
}
