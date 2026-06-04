'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from 'recharts';
import type { Category } from '@/lib/readle-types';

const catLabel: Record<Category, string> = {
  toeic: '多益',
  business: '商業',
  daily: '日常',
  travel: '旅遊',
  tech: '科技',
};

const catColor: Record<Category, string> = {
  toeic: '#6366F1',
  business: '#8B5CF6',
  daily: '#06B6D4',
  travel: '#10B981',
  tech: '#F59E0B',
};

interface CategoryPieProps {
  data: Record<Category, number>;
}

export default function CategoryPie({ data }: CategoryPieProps) {
  const arr = (Object.keys(data) as Category[])
    .filter((k) => data[k] > 0)
    .map((k) => ({ name: catLabel[k], value: data[k], color: catColor[k] }));

  if (arr.length === 0) {
    return (
      <div className="flex h-44 items-center justify-center text-sm text-[var(--color-text-tertiary)]">
        還沒有單字
      </div>
    );
  }

  return (
    <div className="h-44 w-full">
      <ResponsiveContainer>
        <PieChart>
          <Pie data={arr} dataKey="value" innerRadius={36} outerRadius={64} paddingAngle={3}>
            {arr.map((entry) => (
              <Cell key={entry.name} fill={entry.color} />
            ))}
          </Pie>
          <Legend
            verticalAlign="middle"
            align="right"
            layout="vertical"
            iconType="circle"
            iconSize={8}
            formatter={(v) => <span className="text-xs">{v}</span>}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
