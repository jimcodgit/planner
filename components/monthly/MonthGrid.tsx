'use client';

import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { SessionForm } from '@/components/sessions/SessionForm';
import { MarkDoneButton } from '@/components/sessions/MarkDoneButton';
import { SkipSessionModal } from '@/components/sessions/SkipSessionModal';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { deleteSession } from '@/lib/actions/sessions';
import type { RevisionSession, Subject, Topic, ExamDate } from '@/types/database';
import {
  format,
  parseISO,
  addWeeks,
  subWeeks,
  isToday,
  isSameDay,
} from '@/lib/utils/dates';
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  addMonths,
  subMonths,
  isSameMonth,
} from 'date-fns';
import { toISODate } from '@/lib/utils/dates';
import { minutesToHours } from '@/lib/utils/time';
import { cn } from '@/lib/utils/cn';

interface ExamMarker {
  date: string;
  label: string;
  subjectName: string;
  color: string;
}

interface MonthGridProps {
  initialSessions: RevisionSession[];
  subjects: Subject[];
  topicsBySubject: Record<string, Topic[]>;
  topicsById: Record<string, Topic>;
  subjectsById: Record<string, Subject>;
  examMarkers: ExamMarker[];
  isParent: boolean;
}

const DAY_HEADERS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export function MonthGrid({
  initialSessions,
  subjects,
  topicsBySubject,
  topicsById,
  subjectsById,
  examMarkers,
  isParent,
}: MonthGridProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [showAddSession, setShowAddSession] = useState(false);
  const [skipSessionId, setSkipSessionId] = useState<string | null>(null);
  const [skipSessionDate, setSkipSessionDate] = useState<string>('');
  const [editingSession, setEditingSession] = useState<RevisionSession | null>(null);

  // Build calendar grid: full weeks covering the month
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: gridStart, end: gridEnd });

  // Index sessions by date
  const sessionsByDate: Record<string, RevisionSession[]> = {};
  for (const s of initialSessions) {
    sessionsByDate[s.date] = [...(sessionsByDate[s.date] ?? []), s];
  }

  // Index exam markers by date
  const examsByDate: Record<string, ExamMarker[]> = {};
  for (const e of examMarkers) {
    examsByDate[e.date] = [...(examsByDate[e.date] ?? []), e];
  }

  // Monthly stats
  const monthSessions = initialSessions.filter((s) => {
    const d = parseISO(s.date);
    return isSameMonth(d, currentDate);
  });
  const doneMins = monthSessions
    .filter((s) => s.status === 'Done')
    .reduce((sum, s) => sum + s.duration_minutes, 0);
  const plannedMins = monthSessions
    .filter((s) => s.status === 'Planned' || s.status === 'Done')
    .reduce((sum, s) => sum + s.duration_minutes, 0);

  const selectedDateStr = selectedDay ? toISODate(selectedDay) : null;
  const selectedSessions = selectedDateStr ? (sessionsByDate[selectedDateStr] ?? []) : [];

  async function handleDeleteSession(id: string) {
    if (!confirm('Delete this session?')) return;
    await deleteSession(id);
  }

  return (
    <div className="space-y-4">
      {/* Month navigation */}
      <div className="flex items-center justify-between">
        <Button variant="secondary" size="sm" onClick={() => setCurrentDate((d) => subMonths(d, 1))}>
          ← Prev
        </Button>
        <div className="text-center">
          <div className="text-lg font-bold text-gray-900">
            {format(currentDate, 'MMMM yyyy')}
          </div>
          <div className="text-xs text-gray-500">
            {minutesToHours(doneMins)} done · {minutesToHours(plannedMins)} planned
          </div>
        </div>
        <Button variant="secondary" size="sm" onClick={() => setCurrentDate((d) => addMonths(d, 1))}>
          Next →
        </Button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 gap-px">
        {DAY_HEADERS.map((d) => (
          <div key={d} className="text-center text-xs font-medium text-gray-500 py-1">
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-px bg-gray-200 rounded-xl overflow-hidden border border-gray-200">
        {days.map((day) => {
          const dateStr = toISODate(day);
          const daySessions = sessionsByDate[dateStr] ?? [];
          const dayExams = examsByDate[dateStr] ?? [];
          const inMonth = isSameMonth(day, currentDate);
          const today = isToday(day);
          const selected = selectedDay ? isSameDay(day, selectedDay) : false;
          const doneSessions = daySessions.filter((s) => s.status === 'Done');
          const plannedSessions = daySessions.filter((s) => s.status === 'Planned');

          return (
            <button
              key={dateStr}
              onClick={() => setSelectedDay(selected ? null : day)}
              className={cn(
                'min-h-[80px] p-1.5 text-left transition-colors relative',
                inMonth ? 'bg-white hover:bg-indigo-50' : 'bg-gray-50 hover:bg-gray-100',
                selected && 'bg-indigo-50 ring-2 ring-inset ring-indigo-400',
                today && !selected && 'bg-blue-50'
              )}
            >
              {/* Day number */}
              <div
                className={cn(
                  'text-xs font-semibold w-6 h-6 flex items-center justify-center rounded-full mb-1',
                  today ? 'bg-indigo-600 text-white' : inMonth ? 'text-gray-700' : 'text-gray-300'
                )}
              >
                {format(day, 'd')}
              </div>

              {/* Exam markers */}
              {dayExams.map((exam, i) => (
                <div
                  key={i}
                  className="text-xs px-1 py-0.5 rounded font-medium truncate mb-0.5"
                  style={{ backgroundColor: exam.color + '33', color: exam.color }}
                  title={`${exam.subjectName}: ${exam.label}`}
                >
                  📝 {exam.subjectName}
                </div>
              ))}

              {/* Session dots */}
              {daySessions.length > 0 && (
                <div className="flex flex-wrap gap-0.5 mt-0.5">
                  {daySessions.slice(0, 4).map((s) => (
                    <div
                      key={s.id}
                      className={cn(
                        'w-2 h-2 rounded-full',
                        s.status === 'Done' && 'opacity-100',
                        s.status === 'Skipped' && 'opacity-30',
                        s.status === 'Planned' && 'opacity-70'
                      )}
                      style={{ backgroundColor: subjectsById[s.subject_id]?.color ?? '#6366f1' }}
                      title={`${subjectsById[s.subject_id]?.name} — ${s.status}`}
                    />
                  ))}
                  {daySessions.length > 4 && (
                    <span className="text-xs text-gray-400">+{daySessions.length - 4}</span>
                  )}
                </div>
              )}

              {/* Done count badge */}
              {doneSessions.length > 0 && (
                <div className="absolute top-1 right-1 text-xs text-green-600 font-medium">
                  ✓{doneSessions.length}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Selected day panel */}
      {selectedDay && (
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-900">
              {format(selectedDay, 'EEEE d MMMM')}
            </h3>
            {!isParent && (
              <Button size="sm" onClick={() => setShowAddSession(true)}>
                + Add session
              </Button>
            )}
          </div>

          {/* Exam markers for selected day */}
          {(examsByDate[selectedDateStr!] ?? []).map((exam, i) => (
            <div
              key={i}
              className="mb-2 px-3 py-2 rounded-lg text-sm font-medium"
              style={{ backgroundColor: exam.color + '22', color: exam.color }}
            >
              📝 Exam: {exam.subjectName} — {exam.label}
            </div>
          ))}

          {selectedSessions.length === 0 && (examsByDate[selectedDateStr!] ?? []).length === 0 ? (
            <p className="text-sm text-gray-400">No sessions planned</p>
          ) : (
            <div className="space-y-2">
              {selectedSessions.map((session) => {
                const subject = subjectsById[session.subject_id];
                const topic = session.topic_id ? topicsById[session.topic_id] : null;
                return (
                  <div
                    key={session.id}
                    className={cn(
                      'flex items-center gap-3 p-3 rounded-lg border text-sm',
                      session.status === 'Done' ? 'bg-green-50 border-green-200' :
                      session.status === 'Skipped' ? 'bg-gray-50 border-gray-200 opacity-60' :
                      'bg-white border-gray-200'
                    )}
                  >
                    <div
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: subject?.color }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900">{subject?.name}</div>
                      {topic && <div className="text-gray-500 text-xs">{topic.name}</div>}
                      <div className="text-gray-400 text-xs">
                        {session.start_time?.slice(0, 5) && `${session.start_time.slice(0, 5)} · `}
                        {minutesToHours(session.duration_minutes)} · {session.type}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {session.status === 'Done' && <Badge variant="green">Done</Badge>}
                      {session.status === 'Skipped' && <Badge variant="gray">Skipped</Badge>}
                      {!isParent && session.status === 'Planned' && (
                        <>
                          <MarkDoneButton sessionId={session.id} topicId={session.topic_id} />
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => {
                              setSkipSessionId(session.id);
                              setSkipSessionDate(session.date);
                            }}
                          >
                            Skip
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setEditingSession(session)}
                          >
                            ✎
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteSession(session.id)}
                          >
                            ✕
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Add session modal */}
      <Modal
        open={showAddSession}
        onClose={() => setShowAddSession(false)}
        title={`Add session — ${selectedDay ? format(selectedDay, 'EEE d MMM') : ''}`}
      >
        <SessionForm
          subjects={subjects}
          topicsBySubject={topicsBySubject}
          defaultDate={selectedDateStr ?? toISODate(new Date())}
          onSuccess={() => setShowAddSession(false)}
        />
      </Modal>

      {/* Edit session modal */}
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

      {/* Skip session modal */}
      {skipSessionId && (
        <SkipSessionModal
          open={!!skipSessionId}
          onClose={() => setSkipSessionId(null)}
          sessionId={skipSessionId}
          sessionDate={skipSessionDate}
        />
      )}
    </div>
  );
}
