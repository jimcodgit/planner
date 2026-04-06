import { Card, CardContent } from '@/components/ui/Card';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { minutesToHours } from '@/lib/utils/time';

interface WeeklyProgressBarProps {
  doneMinutes: number;
  targetMinutes: number;
  plannedMinutes: number;
}

export function WeeklyProgressBar({ doneMinutes, targetMinutes, plannedMinutes }: WeeklyProgressBarProps) {
  const pct = targetMinutes > 0 ? Math.min(100, Math.round((doneMinutes / targetMinutes) * 100)) : 0;
  const behindTarget = doneMinutes < targetMinutes * 0.5;
  const color = pct >= 100 ? 'bg-green-500' : behindTarget ? 'bg-amber-500' : 'bg-indigo-500';

  return (
    <Card>
      <CardContent className="py-4">
        <div className="flex items-baseline justify-between mb-3">
          <h3 className="font-semibold text-gray-900">This week</h3>
          <div className="flex items-baseline gap-1">
            <span className="text-xl font-bold text-gray-900">{minutesToHours(doneMinutes)}</span>
            <span className="text-sm text-gray-400">/ {minutesToHours(targetMinutes)}</span>
          </div>
        </div>
        <ProgressBar value={pct} colorClass={color} />
        <div className="flex justify-between mt-2 text-xs text-gray-400">
          <span>{pct}% of weekly target</span>
          <span>{minutesToHours(plannedMinutes)} planned</span>
        </div>
        {behindTarget && doneMinutes < targetMinutes && (
          <div className="mt-2 text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-md px-3 py-1.5">
            Behind target — {minutesToHours(targetMinutes - doneMinutes)} still needed
          </div>
        )}
      </CardContent>
    </Card>
  );
}
