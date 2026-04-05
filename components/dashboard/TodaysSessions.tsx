'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { MarkDoneButton } from '@/components/sessions/MarkDoneButton';
import { SessionTimer } from '@/components/sessions/SessionTimer';
import { Badge } from '@/components/ui/Badge';
import type { RevisionSession, Subject, Topic } from '@/types/database';
import { minutesToHours, formatTime } from '@/lib/utils/time';

interface TodaysSessionsProps {
  sessions: RevisionSession[];
  subjectsById: Record<string, Subject>;
  topicsById: Record<string, Topic>;
}

export function TodaysSessions({ sessions, subjectsById, topicsById }: TodaysSessionsProps) {
  const [activeTimer, setActiveTimer] = useState<RevisionSession | null>(null);

  const sorted = [...sessions].sort((a, b) =>
    (a.start_time ?? '').localeCompare(b.start_time ?? '')
  );

  const nextSession = sorted.find((s) => s.status === 'Planned');

  return (
    <>
      {activeTimer && (
        <SessionTimer
          sessionId={activeTimer.id}
          topicId={activeTimer.topic_id}
          durationMinutes={activeTimer.duration_minutes}
          subjectName={subjectsById[activeTimer.subject_id]?.name ?? 'Session'}
          topicName={activeTimer.topic_id ? topicsById[activeTimer.topic_id]?.name : undefined}
          onClose={() => setActiveTimer(null)}
        />
      )}

      <Card>
        <CardHeader>
          <h3 className="font-semibold text-gray-900">Today</h3>
        </CardHeader>
        <CardContent className="py-2">
          {sessions.length === 0 ? (
            <p className="text-sm text-gray-400 py-2">No sessions planned for today</p>
          ) : (
            <div className="space-y-2">
              {sorted.map((session) => {
                const subject = subjectsById[session.subject_id];
                const topic = session.topic_id ? topicsById[session.topic_id] : null;
                const isNext = session.id === nextSession?.id;

                return (
                  <div
                    key={session.id}
                    className={`flex items-center gap-3 py-2 px-3 rounded-lg ${
                      isNext ? 'bg-indigo-50 border border-indigo-200' : 'bg-gray-50'
                    }`}
                  >
                    <div
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: subject?.color }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm text-gray-900">{subject?.name}</span>
                        {isNext && <Badge>Next up</Badge>}
                      </div>
                      {topic && <div className="text-xs text-gray-500">{topic.name}</div>}
                      <div className="text-xs text-gray-400">
                        {formatTime(session.start_time) && `${formatTime(session.start_time)} · `}
                        {minutesToHours(session.duration_minutes)} · {session.type}
                      </div>
                    </div>
                    <div className="flex-shrink-0 flex items-center gap-2">
                      {session.status === 'Done' ? (
                        <Badge variant="green">Done</Badge>
                      ) : session.status === 'Skipped' ? (
                        <Badge variant="gray">Skipped</Badge>
                      ) : (
                        <>
                          <button
                            onClick={() => setActiveTimer(session)}
                            className="text-xs font-medium text-indigo-600 hover:text-indigo-800 border border-indigo-200 rounded px-2 py-1"
                          >
                            Start
                          </button>
                          <MarkDoneButton sessionId={session.id} topicId={session.topic_id} />
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
