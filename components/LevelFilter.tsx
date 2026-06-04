'use client';

import { useEffect, useState } from 'react';
import type { CEFRLevel } from '@/lib/types';
import { getLevelFilter, setLevelFilter } from '@/lib/storage';

const LEVELS: CEFRLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1'];

export default function LevelFilter({
  onChange,
}: {
  onChange: (selected: CEFRLevel[]) => void;
}) {
  const [selected, setSelected] = useState<CEFRLevel[]>([]);

  useEffect(() => {
    const saved = getLevelFilter() as CEFRLevel[];
    setSelected(saved);
    onChange(saved);
    // intentionally fire only on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function toggle(level: CEFRLevel) {
    const next = selected.includes(level)
      ? selected.filter((l) => l !== level)
      : [...selected, level];
    setSelected(next);
    setLevelFilter(next);
    onChange(next);
  }

  function clear() {
    setSelected([]);
    setLevelFilter([]);
    onChange([]);
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-sm font-medium text-stone-600">Level:</span>
      {LEVELS.map((level) => {
        const active = selected.includes(level);
        return (
          <button
            key={level}
            type="button"
            onClick={() => toggle(level)}
            className={`rounded-full px-3 py-1 text-xs font-semibold ring-1 transition ${
              active
                ? 'bg-stone-900 text-white ring-stone-900'
                : 'bg-white text-stone-700 ring-stone-300 hover:bg-stone-50'
            }`}
          >
            {level}
          </button>
        );
      })}
      {selected.length > 0 && (
        <button
          type="button"
          onClick={clear}
          className="text-xs text-stone-500 underline-offset-2 hover:underline"
        >
          Clear
        </button>
      )}
    </div>
  );
}
