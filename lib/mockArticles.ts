import type { Article } from './types';

// SoundHelix CORS-safe demo MP3s (placeholders; replace with real narration later)
const AUDIO_A2 = 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3';
const AUDIO_B2 = 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3';

export const mockArticles: Article[] = [
  {
    id: 'coffee-around-the-world',
    title: 'Coffee Around the World',
    level: 'A2',
    category: 'Culture',
    coverImage:
      'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=1200&q=80',
    readingMinutes: 3,
    audioUrl: AUDIO_A2,
    paragraphs: [
      [
        'Coffee is one of the most popular drinks in the world.',
        'People drink it every day, often in the morning.',
        'It helps them feel awake and ready to work.',
      ],
      [
        'In Italy, people drink small, strong cups of espresso.',
        'In Turkey, the coffee is thick and very sweet.',
        'In the United States, many people enjoy a big cup with milk.',
      ],
      [
        'Coffee is more than a drink for many cultures.',
        'It is a way to meet friends and share stories.',
        'A simple cup can bring people together.',
      ],
    ],
    timestamps: [
      { sentenceIndex: 0, start: 0, end: 5 },
      { sentenceIndex: 1, start: 5, end: 9 },
      { sentenceIndex: 2, start: 9, end: 14 },
      { sentenceIndex: 3, start: 14, end: 19 },
      { sentenceIndex: 4, start: 19, end: 23 },
      { sentenceIndex: 5, start: 23, end: 28 },
      { sentenceIndex: 6, start: 28, end: 32 },
      { sentenceIndex: 7, start: 32, end: 36 },
      { sentenceIndex: 8, start: 36, end: 41 },
    ],
    keyVocabulary: [
      {
        word: 'popular',
        def: 'liked by many people',
        example: 'Pizza is a popular food.',
      },
      {
        word: 'awake',
        def: 'not sleeping',
        example: 'A cold shower keeps me awake.',
      },
      {
        word: 'culture',
        def: 'the ideas and habits of a group of people',
        example: 'Each country has its own culture.',
      },
    ],
    grammarNotes: [
      {
        title: 'Simple Present for Habits',
        body: 'Use the Simple Present to talk about things people do regularly. "People drink it every day." The verb takes -s with he/she/it: "She drinks coffee."',
      },
    ],
    quizzes: [
      {
        id: 'q1',
        question: 'Why do people drink coffee in the morning?',
        options: [
          'To feel awake and ready to work',
          'To go to sleep faster',
          'Because it is cold',
        ],
        correctAnswerIndex: 0,
        explanation:
          'The article says coffee "helps them feel awake and ready to work".',
      },
      {
        id: 'q2',
        question: 'What kind of coffee do people drink in Turkey?',
        options: ['Big cups with milk', 'Thick and very sweet', 'Cold and bitter'],
        correctAnswerIndex: 1,
        explanation: 'In Turkey, the coffee is thick and very sweet.',
      },
      {
        id: 'q3',
        question: 'According to the article, coffee is also a way to ___.',
        options: [
          'lose weight',
          'meet friends and share stories',
          'learn a new language',
        ],
        correctAnswerIndex: 1,
        explanation:
          'The last paragraph says coffee is a way to meet friends and share stories.',
      },
    ],
  },

  {
    id: 'quiet-revolution-electric-cars',
    title: 'The Quiet Revolution of Electric Cars',
    level: 'B2',
    category: 'Science',
    coverImage:
      'https://images.unsplash.com/photo-1593941707882-a5bba14938c7?w=1200&q=80',
    readingMinutes: 6,
    audioUrl: AUDIO_B2,
    paragraphs: [
      [
        'For more than a century, the internal combustion engine has dominated the streets of every major city.',
        'Now, almost silently, electric vehicles are beginning to take its place.',
        'Sales have surged in the past five years, and several governments have announced plans to phase out gasoline cars entirely.',
      ],
      [
        'The shift is being driven by a combination of climate policy, falling battery prices, and consumer demand for cleaner technology.',
        'Lithium-ion batteries, which once cost more than a thousand dollars per kilowatt-hour, are now available for roughly a tenth of that price.',
        'This dramatic decline has made electric cars affordable to a much wider audience than was once thought possible.',
      ],
      [
        'However, the transition is far from straightforward.',
        'Charging infrastructure remains uneven, particularly in rural areas, and the mining of raw materials raises serious environmental concerns.',
        'Whether the revolution will be remembered as quiet or merely overlooked depends on how thoughtfully it is managed in the years ahead.',
      ],
    ],
    timestamps: [
      { sentenceIndex: 0, start: 0, end: 7 },
      { sentenceIndex: 1, start: 7, end: 13 },
      { sentenceIndex: 2, start: 13, end: 21 },
      { sentenceIndex: 3, start: 21, end: 30 },
      { sentenceIndex: 4, start: 30, end: 40 },
      { sentenceIndex: 5, start: 40, end: 48 },
      { sentenceIndex: 6, start: 48, end: 53 },
      { sentenceIndex: 7, start: 53, end: 63 },
      { sentenceIndex: 8, start: 63, end: 73 },
    ],
    keyVocabulary: [
      {
        word: 'dominated',
        def: 'controlled or had the most influence',
        example: 'A few large firms dominated the industry for decades.',
      },
      {
        word: 'surged',
        def: 'increased suddenly and strongly',
        example: 'Demand surged after the new model was released.',
      },
      {
        word: 'phase out',
        def: 'gradually stop using something',
        example: 'The country plans to phase out single-use plastics.',
      },
      {
        word: 'infrastructure',
        def: 'the basic systems and services a country needs',
        example: 'Better infrastructure attracts more investment.',
      },
    ],
    grammarNotes: [
      {
        title: 'Present Perfect for Recent Change',
        body: 'Use the Present Perfect (have/has + past participle) to describe changes whose effects continue now. "Sales have surged" and "governments have announced plans" both link past action to the present moment.',
      },
      {
        title: 'Passive Voice',
        body: 'When the agent is unknown or unimportant, English often uses the passive: "The shift is being driven by..." The focus stays on what is changing, not who is doing it.',
      },
    ],
    quizzes: [
      {
        id: 'q1',
        question: 'What has happened to lithium-ion battery prices?',
        options: [
          'They have stayed the same',
          'They have fallen sharply',
          'They have doubled',
        ],
        correctAnswerIndex: 1,
        explanation:
          'The article notes battery prices are now roughly a tenth of what they once were.',
      },
      {
        id: 'q2',
        question: 'Which of the following is NOT mentioned as a challenge?',
        options: [
          'Uneven charging infrastructure',
          'Environmental concerns about mining',
          'Driver licence regulations',
        ],
        correctAnswerIndex: 2,
        explanation:
          'The article mentions infrastructure and mining, but not licence regulations.',
      },
      {
        id: 'q3',
        question: 'The author\'s overall tone could best be described as:',
        options: ['Cautiously optimistic', 'Strongly negative', 'Completely neutral'],
        correctAnswerIndex: 0,
        explanation:
          'The author highlights progress (falling prices, rising sales) while pointing to real challenges — a cautiously optimistic view.',
      },
    ],
  },
];

export function getArticleById(id: string): Article | undefined {
  return mockArticles.find((a) => a.id === id);
}
