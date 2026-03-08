import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import type { Topic, Subject } from '@/types/database';

interface NeverRevisedTopicsProps {
  topics: (Topic & { subject_name?: string })[];
  subjectsById: Record<string, Subject>;
}

export function NeverRevisedTopics({ topics, subjectsById }: NeverRevisedTopicsProps) {
  const neverRevised = topics.filter((t) => !t.last_revised_at && t.status !== 'Confident');

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">Never revised</h3>
          {neverRevised.length > 0 && (
            <Badge variant="yellow">{neverRevised.length}</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="py-2">
        {neverRevised.length === 0 ? (
          <p className="text-sm text-green-600 py-2">All topics have been revised ✓</p>
        ) : (
          <div className="space-y-1 max-h-52 overflow-y-auto">
            {neverRevised.slice(0, 20).map((t) => {
              const subject = subjectsById[t.subject_id];
              return (
                <div key={t.id} className="flex items-center justify-between py-1 text-sm">
                  <div className="flex items-center gap-2 min-w-0">
                    {subject && (
                      <div
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ backgroundColor: subject.color }}
                      />
                    )}
                    <span className="text-gray-700 truncate">{t.name}</span>
                    {subject && (
                      <span className="text-gray-400 text-xs hidden sm:block">({subject.name})</span>
                    )}
                  </div>
                  <Badge variant="gray">{t.status}</Badge>
                </div>
              );
            })}
            {neverRevised.length > 20 && (
              <p className="text-xs text-gray-400 pt-1">
                +{neverRevised.length - 20} more
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
