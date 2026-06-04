import { notFound } from 'next/navigation';
import { getArticleById, mockArticles } from '@/lib/mockArticles';
import ReaderClient from '@/components/ReaderClient';

export function generateStaticParams() {
  return mockArticles.map((a) => ({ id: a.id }));
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const article = getArticleById(id);
  if (!article) notFound();
  return <ReaderClient article={article} />;
}
