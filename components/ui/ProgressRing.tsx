interface ProgressRingProps {
  value: number; // 0-100
  size?: number; // px
  stroke?: number; // px
  showLabel?: boolean;
  label?: string;
  sublabel?: string;
}

export default function ProgressRing({
  value,
  size = 120,
  stroke = 10,
  showLabel = true,
  label,
  sublabel,
}: ProgressRingProps) {
  const clamped = Math.max(0, Math.min(100, value));
  const radius = (size - stroke) / 2;
  const circ = 2 * Math.PI * radius;
  const offset = circ * (1 - clamped / 100);

  return (
    <div
      className="relative inline-flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90">
        <defs>
          <linearGradient id="ring-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#7C7CFF" />
            <stop offset="100%" stopColor="#5B5BF0" />
          </linearGradient>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(91,91,240,0.10)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="url(#ring-grad)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 600ms cubic-bezier(0.32, 0.72, 0, 1)' }}
        />
      </svg>
      {showLabel && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="text-2xl font-bold text-[var(--color-text-primary)]">
            {label ?? `${Math.round(clamped)}%`}
          </div>
          {sublabel && (
            <div className="mt-0.5 text-xs text-[var(--color-text-tertiary)]">
              {sublabel}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
