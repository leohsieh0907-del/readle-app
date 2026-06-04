import Link from 'next/link';
import { Clock } from 'lucide-react';
import type { Article, CEFRLevel } from '@/lib/types';

const LEVEL_COLORS: Record<CEFRLevel, string> = {
  A1: 'bg-emerald-100 text-emerald-700 ring-emerald-200',
  A2: 'bg-teal-100 text-teal-700 ring-teal-200',
  B1: 'bg-sky-100 text-sky-700 ring-sky-200',
  B2: 'bg-indigo-100 text-indigo-700 ring-indigo-200',
  C1: 'bg-purple-100 text-purple-700 ring-purple-200',
};

export default function ArticleCard({ article }: { article: Article }) {
  return (
    <Link
      href={`/article/${article.id}`}
      className="group flex flex-col overflow-hidden rounded-2xl bg-white ring-1 ring-stone-200 transition hover:-translate-y-0.5 hover:shadow-lg hover:ring-stone-300"
    >
      <div className="relative aspect-[16/9] w-full overflow-hidden bg-stone-100">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={article.coverImage}
          alt={article.title}
          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
        />
        <span
          className={`absolute left-3 top-3 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${LEVEL_COLORS[article.level]}`}
        >
          {article.level}
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-2 p-5">
        <span className="text-xs font-medium uppercase tracking-wider text-stone-500">
          {article.category}
        </span>
        <h3 className="font-serif text-xl font-semibold leading-snug text-stone-900 group-hover:text-stone-700">
          {article.title}
        </h3>
        <p className="line-clamp-2 text-sm text-stone-600">
          {article.paragraphs[0]?.join(' ')}
        </p>
        <div className="mt-auto flex items-center gap-1.5 pt-2 text-xs text-stone-500">
          <Clock className="h-3.5 w-3.5" />
          <span>{article.readingMinutes} min read</span>
        </div>
      </div>
    </Link>
  );
}
