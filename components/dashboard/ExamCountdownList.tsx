import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import type { Subject } from '@/types/database';
import { daysUntil, formatDisplayDate } from '@/lib/utils/dates';

interface ExamCountdownListProps {
  subjects: Subject[];
}

interface ExamEntry {
  subjectName: string;
  color: string;
  label: string;
  date: string;
  days: number;
}

export function ExamCountdownList({ subjects }: ExamCountdownListProps) {
  const upcoming: ExamEntry[] = [];

  for (const subject of subjects) {
    for (const ed of subject.exam_dates) {
      const days = daysUntil(ed.date);
      if (days >= 0) {
        upcoming.push({
          subjectName: subject.name,
          color: subject.color,
          label: ed.label,
          date: ed.date,
          days,
        });
      }
    }
  }

  upcoming.sort((a, b) => a.days - b.days);

  return (
    <Card>
      <CardHeader>
        <h3 className="font-semibold text-gray-900">Upcoming exams</h3>
      </CardHeader>
      <CardContent className="py-2">
        {upcoming.length === 0 ? (
          <p className="text-sm text-gray-400 py-2">No upcoming exams</p>
        ) : (
          <div className="space-y-2">
            {upcoming.slice(0, 8).map((exam, i) => {
              const variant =
                exam.days < 7 ? 'red' : exam.days < 30 ? 'yellow' : 'green';
              return (
                <div key={i} className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: exam.color }}
                    />
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-gray-900 truncate">
                        {exam.subjectName}
                      </div>
                      <div className="text-xs text-gray-400">{exam.label} · {formatDisplayDate(exam.date)}</div>
                    </div>
                  </div>
                  <Badge variant={variant}>
                    {exam.days === 0 ? 'Today' : exam.days === 1 ? 'Tomorrow' : `${exam.days}d`}
                  </Badge>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
