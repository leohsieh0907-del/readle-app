'use client';

import { useState } from 'react';
import { BookOpen, GraduationCap } from 'lucide-react';
import type { Article } from '@/lib/types';

export default function VocabAndGrammarTabs({ article }: { article: Article }) {
  const [tab, setTab] = useState<'vocab' | 'grammar'>('vocab');

  return (
    <section className="mt-12 rounded-2xl bg-white p-6 ring-1 ring-stone-200">
      <div className="mb-5 flex gap-2">
        <button
          type="button"
          onClick={() => setTab('vocab')}
          className={`inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-semibold transition ${
            tab === 'vocab'
              ? 'bg-stone-900 text-white'
              : 'text-stone-600 hover:bg-stone-100'
          }`}
        >
          <BookOpen className="h-4 w-4" />
          Key Vocabulary
        </button>
        <button
          type="button"
          onClick={() => setTab('grammar')}
          className={`inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-semibold transition ${
            tab === 'grammar'
              ? 'bg-stone-900 text-white'
              : 'text-stone-600 hover:bg-stone-100'
          }`}
        >
          <GraduationCap className="h-4 w-4" />
          Grammar Notes
        </button>
      </div>

      {tab === 'vocab' && (
        <ul className="divide-y divide-stone-100">
          {article.keyVocabulary.map((v) => (
            <li key={v.word} className="py-3 first:pt-0 last:pb-0">
              <div className="flex items-baseline gap-2">
                <span className="font-serif text-lg font-semibold text-stone-900">
                  {v.word}
                </span>
              </div>
              <p className="mt-0.5 text-sm text-stone-700">{v.def}</p>
              <p className="mt-1 border-l-2 border-stone-200 pl-3 text-sm italic text-stone-500">
                {v.example}
              </p>
            </li>
          ))}
        </ul>
      )}

      {tab === 'grammar' && (
        <div className="space-y-4">
          {article.grammarNotes.map((g, idx) => (
            <div
              key={idx}
              className="rounded-xl border-l-4 border-indigo-300 bg-indigo-50/60 p-4"
            >
              <h4 className="mb-1 font-semibold text-indigo-900">{g.title}</h4>
              <p className="text-sm leading-relaxed text-stone-700">{g.body}</p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
