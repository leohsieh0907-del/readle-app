import type { Category } from '@/lib/readle-types';

type Status = 'new' | 'learning' | 'mastered';

interface WordChipProps {
  word: string;
  category?: Category;
  status?: Status;
  onClick?: () => void;
}

const catColor: Record<Category, string> = {
  toeic: 'bg-[#6366F1]/10 text-[#6366F1] ring-[#6366F1]/25',
  business: 'bg-[#8B5CF6]/10 text-[#8B5CF6] ring-[#8B5CF6]/25',
  daily: 'bg-[#06B6D4]/10 text-[#06B6D4] ring-[#06B6D4]/25',
  travel: 'bg-[#10B981]/10 text-[#10B981] ring-[#10B981]/25',
  tech: 'bg-[#F59E0B]/10 text-[#F59E0B] ring-[#F59E0B]/25',
};

const statusDot: Record<Status, string> = {
  new: 'bg-[#9090A3]',
  learning: 'bg-[#FBBF24]',
  mastered: 'bg-[#4ADE80]',
};

export default function WordChip({
  word,
  category = 'daily',
  status = 'new',
  onClick,
}: WordChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-sm font-medium ring-1 ring-inset transition hover:scale-105 ${catColor[category]}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${statusDot[status]}`} />
      {word}
    </button>
  );
}
