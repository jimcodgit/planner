import { cn } from '@/lib/utils/cn';

interface ProgressBarProps {
  value: number; // 0–100
  className?: string;
  colorClass?: string;
  height?: 'sm' | 'md';
}

export function ProgressBar({ value, className, colorClass = 'bg-indigo-500', height = 'md' }: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, value));
  const h = height === 'sm' ? 'h-1.5' : 'h-3';
  return (
    <div className={cn(`w-full bg-gray-200 rounded-full ${h}`, className)}>
      <div
        className={cn(`${h} rounded-full transition-all duration-300`, colorClass)}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}
