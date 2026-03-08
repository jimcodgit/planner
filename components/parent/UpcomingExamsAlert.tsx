import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import type { Subject, Topic } from '@/types/database';
import { daysUntil, formatDisplayDate } from '@/lib/utils/dates';

interface UpcomingExamsAlertProps {
  subjects: Subject[];
  topicsBySubject: Record<string, Topic[]>;
}

export function UpcomingExamsAlert({ subjects, topicsBySubject }: UpcomingExamsAlertProps) {
  const alerts: {
    subject: Subject;
    daysLeft: number;
    label: string;
    date: string;
    pctConfident: number;
    isAtRisk: boolean;
  }[] = [];

  for (const subject of subjects) {
    const topics = topicsBySubject[subject.id] ?? [];
    const confidentCount = topics.filter((t) => t.status === 'Confident').length;
    const pctConfident = topics.length > 0 ? Math.round((confidentCount / topics.length) * 100) : 0;

    for (const ed of subject.exam_dates) {
      const days = daysUntil(ed.date);
      if (days >= 0 && days <= 30) {
        alerts.push({
          subject,
          daysLeft: days,
          label: ed.label,
          date: ed.date,
          pctConfident,
          isAtRisk: pctConfident < 60,
        });
      }
    }
  }

  alerts.sort((a, b) => a.daysLeft - b.daysLeft);

  return (
    <Card>
      <CardHeader>
        <h3 className="font-semibold text-gray-900">Exams within 30 days</h3>
      </CardHeader>
      <CardContent className="py-2">
        {alerts.length === 0 ? (
          <p className="text-sm text-gray-400 py-2">No exams in the next 30 days</p>
        ) : (
          <div className="space-y-2">
            {alerts.map((alert, i) => (
              <div
                key={i}
                className={`p-3 rounded-lg border text-sm ${
                  alert.isAtRisk
                    ? 'bg-red-50 border-red-200'
                    : 'bg-amber-50 border-amber-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: alert.subject.color }}
                    />
                    <span className="font-medium text-gray-900">{alert.subject.name}</span>
                  </div>
                  <Badge variant={alert.daysLeft < 7 ? 'red' : 'yellow'}>
                    {alert.daysLeft}d
                  </Badge>
                </div>
                <div className="text-gray-500 text-xs mt-1">
                  {alert.label} · {formatDisplayDate(alert.date)} · {alert.pctConfident}% confident
                </div>
                {alert.isAtRisk && (
                  <div className="text-red-700 text-xs mt-1 font-medium">
                    ⚠️ Low coverage — needs attention
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
