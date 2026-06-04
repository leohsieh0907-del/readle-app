interface ProgressBarProps {
  value: number; // 0-100
  height?: number;
  showLabel?: boolean;
  label?: string;
}

export default function ProgressBar({
  value,
  height = 8,
  showLabel = false,
  label,
}: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div className="w-full">
      <div
        className="relative w-full overflow-hidden rounded-full bg-[rgba(91,91,240,0.10)]"
        style={{ height }}
      >
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-[#7C7CFF] to-[#5B5BF0]"
          style={{
            width: `${clamped}%`,
            transition: 'width 600ms cubic-bezier(0.32, 0.72, 0, 1)',
          }}
        />
      </div>
      {showLabel && (
        <div className="mt-1.5 flex justify-between text-xs text-[var(--color-text-tertiary)]">
          <span>{label}</span>
          <span>{Math.round(clamped)}%</span>
        </div>
      )}
    </div>
  );
}
