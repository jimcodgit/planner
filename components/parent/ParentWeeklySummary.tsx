import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Badge } from '@/components/ui/Badge';
import type { Subject, RevisionSession } from '@/types/database';
import { minutesToHours } from '@/lib/utils/time';

interface ParentWeeklySummaryProps {
  subjects: Subject[];
  weekSessions: RevisionSession[];
  targetMinutes: number;
}

export function ParentWeeklySummary({
  subjects,
  weekSessions,
  targetMinutes,
}: ParentWeeklySummaryProps) {
  const doneMinutes = weekSessions
    .filter((s) => s.status === 'Done')
    .reduce((sum, s) => sum + s.duration_minutes, 0);

  const pct = targetMinutes > 0 ? Math.min(100, Math.round((doneMinutes / targetMinutes) * 100)) : 0;

  // Per-subject breakdown
  const subjectMinutes: Record<string, { done: number; target: number }> = {};
  for (const s of subjects) {
    subjectMinutes[s.id] = { done: 0, target: s.weekly_target_hours * 60 };
  }
  for (const session of weekSessions) {
    if (session.status === 'Done' && subjectMinutes[session.subject_id]) {
      subjectMinutes[session.subject_id].done += session.duration_minutes;
    }
  }

  const belowTarget = subjects.filter(
    (s) => subjectMinutes[s.id]?.done < subjectMinutes[s.id]?.target * 0.8
  );

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">Weekly overview</h3>
            <span className="text-sm text-gray-500">
              {minutesToHours(doneMinutes)} / {minutesToHours(targetMinutes)}
            </span>
          </div>
        </CardHeader>
        <CardContent>
          <ProgressBar
            value={pct}
            colorClass={pct >= 80 ? 'bg-green-500' : pct >= 50 ? 'bg-amber-500' : 'bg-red-500'}
          />
          <p className="text-sm text-gray-500 mt-2">{pct}% of weekly target complete</p>

          {belowTarget.length > 0 && (
            <div className="mt-3 p-3 bg-amber-50 rounded-lg">
              <p className="text-sm font-medium text-amber-800 mb-2">
                Subjects below target:
              </p>
              <div className="flex flex-wrap gap-1.5">
                {belowTarget.map((s) => (
                  <Badge key={s.id} variant="yellow">
                    {s.name} ({minutesToHours(subjectMinutes[s.id]?.done ?? 0)} /{' '}
                    {s.weekly_target_hours}h)
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Per-subject breakdown */}
      <Card>
        <CardHeader>
          <h3 className="font-semibold text-gray-900">Per-subject progress</h3>
        </CardHeader>
        <CardContent className="py-3">
          <div className="space-y-3">
            {subjects.map((s) => {
              const { done, target } = subjectMinutes[s.id] ?? { done: 0, target: 0 };
              const sPct = target > 0 ? Math.min(100, Math.round((done / target) * 100)) : 0;
              return (
                <div key={s.id}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
                      <span className="text-sm font-medium text-gray-700">{s.name}</span>
                    </div>
                    <span className="text-xs text-gray-500">
                      {minutesToHours(done)} / {s.weekly_target_hours}h
                    </span>
                  </div>
                  <ProgressBar
                    value={sPct}
                    colorClass={sPct >= 80 ? 'bg-green-400' : sPct >= 40 ? 'bg-amber-400' : 'bg-red-400'}
                  />
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
