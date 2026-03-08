'use client';

import { useState } from 'react';
import { SessionCard } from './SessionCard';
import { Modal } from '@/components/ui/Modal';
import { SessionForm } from '@/components/sessions/SessionForm';
import { Button } from '@/components/ui/Button';
import type { RevisionSession, Subject, Topic } from '@/types/database';
import { isToday, format, parseISO } from '@/lib/utils/dates';
import { cn } from '@/lib/utils/cn';

interface DayColumnProps {
  date: string;
  sessions: RevisionSession[];
  subjects: Subject[];
  topicsBySubject: Record<string, Topic[]>;
  topicsById: Record<string, Topic>;
  subjectsById: Record<string, Subject>;
  isParent: boolean;
}

export function DayColumn({
  date,
  sessions,
  subjects,
  topicsBySubject,
  topicsById,
  subjectsById,
  isParent,
}: DayColumnProps) {
  const [showAdd, setShowAdd] = useState(false);
  const [editingSession, setEditingSession] = useState<RevisionSession | null>(null);

  const parsedDate = parseISO(date);
  const today = isToday(parsedDate);

  const totalPlanned = sessions
    .filter((s) => s.status !== 'Skipped')
    .reduce((sum, s) => sum + s.duration_minutes, 0);

  const totalDone = sessions
    .filter((s) => s.status === 'Done')
    .reduce((sum, s) => sum + s.duration_minutes, 0);

  return (
    <div
      className={cn(
        'flex flex-col gap-1 min-h-[120px] rounded-xl p-2',
        today ? 'bg-indigo-50 ring-1 ring-indigo-200' : 'bg-gray-50'
      )}
    >
      <div className="text-center mb-1">
        <div className={cn('text-xs font-medium', today ? 'text-indigo-700' : 'text-gray-500')}>
          {format(parsedDate, 'EEE')}
        </div>
        <div className={cn('text-sm font-bold', today ? 'text-indigo-900' : 'text-gray-700')}>
          {format(parsedDate, 'd')}
        </div>
        {totalPlanned > 0 && (
          <div className="text-xs text-gray-400">
            {Math.round(totalPlanned / 60 * 10) / 10}h
          </div>
        )}
      </div>

      <div className="flex flex-col gap-1 flex-1">
        {sessions.map((session) => (
          <SessionCard
            key={session.id}
            session={session}
            subject={subjectsById[session.subject_id]}
            topic={session.topic_id ? topicsById[session.topic_id] : undefined}
            onEdit={() => setEditingSession(session)}
            isParent={isParent}
          />
        ))}
      </div>

      {!isParent && (
        <Button
          variant="ghost"
          size="sm"
          className="text-gray-400 hover:text-indigo-600 text-xs w-full"
          onClick={() => setShowAdd(true)}
        >
          + Add
        </Button>
      )}

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title={`Add session — ${format(parsedDate, 'EEE d MMM')}`}>
        <SessionForm
          subjects={subjects}
          topicsBySubject={topicsBySubject}
          defaultDate={date}
          onSuccess={() => setShowAdd(false)}
        />
      </Modal>

      <Modal
        open={!!editingSession}
        onClose={() => setEditingSession(null)}
        title="Edit session"
      >
        {editingSession && (
          <SessionForm
            subjects={subjects}
            topicsBySubject={topicsBySubject}
            session={editingSession}
            onSuccess={() => setEditingSession(null)}
          />
        )}
      </Modal>
    </div>
  );
}
