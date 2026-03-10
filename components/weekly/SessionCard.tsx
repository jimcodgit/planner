'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/Badge';
import { MarkDoneButton } from '@/components/sessions/MarkDoneButton';
import { SkipSessionModal } from '@/components/sessions/SkipSessionModal';
import { Button } from '@/components/ui/Button';
import { deleteSession } from '@/lib/actions/sessions';
import type { RevisionSession, Subject, Topic } from '@/types/database';
import { minutesToHours, formatTime } from '@/lib/utils/time';
import { cn } from '@/lib/utils/cn';

interface SessionCardProps {
  session: RevisionSession;
  subject: Subject;
  topic?: Topic;
  onEdit?: () => void;
  isParent?: boolean;
}

const STATUS_STYLE: Record<string, string> = {
  Done: 'bg-green-50 border-green-200 opacity-75',
  Skipped: 'bg-gray-50 border-gray-200 opacity-60',
  Moved: 'bg-blue-50 border-blue-200 opacity-60',
  Planned: 'bg-white border-gray-200',
};

export function SessionCard({ session, subject, topic, onEdit, isParent }: SessionCardProps) {
  const [skipOpen, setSkipOpen] = useState(false);

  async function handleDelete() {
    if (!confirm('Delete this session?')) return;
    await deleteSession(session.id);
  }

  return (
    <>
      <div
        className={cn(
          'rounded-lg border p-2.5 text-xs group',
          STATUS_STYLE[session.status] ?? STATUS_STYLE.Planned
        )}
      >
        <div className="flex items-start justify-between gap-1 mb-1">
          <div className="flex items-center gap-1.5 min-w-0">
            <div
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{ backgroundColor: subject.color }}
            />
            <span className="font-semibold text-gray-900 truncate">{subject.name}</span>
          </div>
          <Badge
            variant={
              session.status === 'Done'
                ? 'green'
                : session.status === 'Skipped'
                ? 'gray'
                : 'default'
            }
          >
            {session.status}
          </Badge>
        </div>

        {topic && <div className="text-gray-600 truncate mb-1">{topic.name}</div>}

        <div className="text-gray-500">
          {formatTime(session.start_time) && `${formatTime(session.start_time)} · `}
          {minutesToHours(session.duration_minutes)} · {session.type}
        </div>

        {session.skipped_count > 0 && (
          <div className="text-amber-600 mt-0.5">Skipped {session.skipped_count}×</div>
        )}

        {!isParent && (
          <div className="flex gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
            {session.status === 'Planned' && (
              <>
                <MarkDoneButton sessionId={session.id} topicId={session.topic_id} />
                <Button size="sm" variant="secondary" onClick={() => setSkipOpen(true)}>
                  Skip
                </Button>
              </>
            )}
            {onEdit && (
              <Button size="sm" variant="ghost" onClick={onEdit}>✎</Button>
            )}
            <Button size="sm" variant="danger" onClick={handleDelete}>Delete</Button>
          </div>
        )}
      </div>

      <SkipSessionModal
        open={skipOpen}
        onClose={() => setSkipOpen(false)}
        sessionId={session.id}
        sessionDate={session.date}
      />
    </>
  );
}
