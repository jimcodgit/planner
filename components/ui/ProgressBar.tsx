import { cn } from '@/lib/utils/cn';

interface ProgressBarProps {
  value: number; // 0–100
  className?: string;
  colorClass?: string;
}

export function ProgressBar({ value, className, colorClass = 'bg-indigo-500' }: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, value));
  return (
    <div className={cn('w-full bg-gray-200 rounded-full h-2', className)}>
      <div
        className={cn('h-2 rounded-full transition-all duration-300', colorClass)}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}
