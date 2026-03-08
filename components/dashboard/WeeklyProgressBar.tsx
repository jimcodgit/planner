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

  return (
    <Card>
      <CardContent className="py-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-gray-900">This week</h3>
          <span className="text-sm text-gray-500">
            {minutesToHours(doneMinutes)} / {minutesToHours(targetMinutes)}
          </span>
        </div>
        <ProgressBar
          value={pct}
          colorClass={pct >= 100 ? 'bg-green-500' : behindTarget ? 'bg-amber-500' : 'bg-indigo-500'}
        />
        <div className="flex justify-between mt-2 text-xs text-gray-400">
          <span>{pct}% complete</span>
          <span>{minutesToHours(plannedMinutes)} planned total</span>
        </div>
        {behindTarget && doneMinutes < targetMinutes && (
          <div className="mt-2 text-xs text-amber-600 bg-amber-50 rounded-md px-2 py-1">
            Behind target — {minutesToHours(targetMinutes - doneMinutes)} remaining
          </div>
        )}
      </CardContent>
    </Card>
  );
}
