import { cn } from '@/lib/utils/cn';
import { minutesToHours } from '@/lib/utils/time';
import type { Subject, RevisionSession } from '@/types/database';

interface WallTargetBarsProps {
  subjects: Subject[];
  sessionsBySubject: Record<string, RevisionSession[]>;
  weekStart: string;
  weekEnd: string;
}

export function WallTargetBars({ subjects, sessionsBySubject, weekStart, weekEnd }: WallTargetBarsProps) {
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-2">
      {subjects.map((subject) => {
        const sessions = sessionsBySubject[subject.id] ?? [];
        const targetMinutes = subject.weekly_target_hours * 60;

        const doneMinutes = sessions
          .filter((s) => s.status === 'Done' && s.date >= weekStart && s.date <= weekEnd)
          .reduce((sum, s) => sum + s.duration_minutes, 0);

        const plannedMinutes = sessions
          .filter((s) => s.status === 'Planned' && s.date >= weekStart && s.date <= weekEnd)
          .reduce((sum, s) => sum + s.duration_minutes, 0);

        const donePct = targetMinutes > 0 ? Math.min(100, (doneMinutes / targetMinutes) * 100) : 0;
        const plannedPct = targetMinutes > 0
          ? Math.min(100 - donePct, (plannedMinutes / targetMinutes) * 100)
          : 0;

        return (
          <div key={subject.id}>
            <div className="flex items-center justify-between mb-0.5">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: subject.color }} />
                <span className="font-medium text-gray-800 truncate" style={{ fontSize: '9px', maxWidth: '80px' }}>
                  {subject.name}
                </span>
              </div>
              <span className="text-gray-400" style={{ fontSize: '8px' }}>
                {minutesToHours(doneMinutes)} / {subject.weekly_target_hours}h
              </span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2 flex overflow-hidden">
              <div className="h-2 bg-green-500 rounded-l-full" style={{ width: `${donePct}%` }} />
              <div className="h-2 bg-indigo-300" style={{ width: `${plannedPct}%` }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
