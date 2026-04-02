'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { TopicRow } from '@/components/subjects/TopicRow';
import { TopicForm } from '@/components/subjects/TopicForm';
import { SubjectForm } from '@/components/subjects/SubjectForm';
import { ExamDatesForm } from '@/components/subjects/ExamDatesForm';
import { deleteSubject } from '@/lib/actions/subjects';
import type { Subject, Topic } from '@/types/database';
import { daysUntil, formatDisplayDate } from '@/lib/utils/dates';
import { useRouter } from 'next/navigation';
import { minutesToHours } from '@/lib/utils/time';

interface SubjectDetailClientProps {
  subject: Subject;
  topics: (Topic & { priorityScore: number })[];
  isParent: boolean;
}

export function SubjectDetailClient({ subject, topics, isParent }: SubjectDetailClientProps) {
  const [showAddTopic, setShowAddTopic] = useState(false);
  const [editingTopic, setEditingTopic] = useState<Topic | null>(null);
  const [showEditSubject, setShowEditSubject] = useState(false);
  const [showEditExamDates, setShowEditExamDates] = useState(false);
  const router = useRouter();

  const confidentCount = topics.filter((t) => t.status === 'Confident').length;
  const inProgressCount = topics.filter((t) => t.status === 'Learning' || t.status === 'Revising').length;
  const notStartedCount = topics.filter((t) => t.status === 'Not Started').length;
  const pctDone = topics.length > 0 ? Math.round((confidentCount / topics.length) * 100) : 0;
  const pctInProgress = topics.length > 0 ? Math.round((inProgressCount / topics.length) * 100) : 0;
  const neverRevised = topics.filter((t) => !t.last_revised_at);

  async function handleDeleteSubject() {
    if (!confirm(`Delete subject "${subject.name}" and all its topics?`)) return;
    await deleteSubject(subject.id);
    router.push('/subjects');
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div
              className="w-4 h-4 rounded-full"
              style={{ backgroundColor: subject.color }}
            />
            <h1 className="text-2xl font-bold text-gray-900">{subject.name}</h1>
            {subject.exam_board && <Badge variant="gray">{subject.exam_board}</Badge>}
          </div>
          <div className="mt-2 space-y-2">
            {/* Stacked topic progress bar */}
            {topics.length > 0 && (
              <div className="w-full bg-gray-200 rounded-full h-2 flex overflow-hidden max-w-xs">
                <div className="h-2 bg-green-500" style={{ width: `${pctDone}%` }} />
                <div className="h-2 bg-amber-400" style={{ width: `${pctInProgress}%` }} />
              </div>
            )}
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <span className="flex items-center gap-1.5">
                <span className="inline-block w-2.5 h-2.5 rounded-full bg-green-500" />
                Done: <strong>{confidentCount}</strong> ({pctDone}%)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="inline-block w-2.5 h-2.5 rounded-full bg-amber-400" />
                In progress: <strong>{inProgressCount}</strong> ({pctInProgress}%)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="inline-block w-2.5 h-2.5 rounded-full bg-gray-300" />
                Not started: <strong>{notStartedCount}</strong>
              </span>
            </div>
            <p className="text-xs text-gray-400">Target: {subject.weekly_target_hours}h/week</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link
            href={`/subjects/${subject.id}/report`}
            className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-indigo-600 bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-100 transition-colors"
          >
            Report
          </Link>
          {!isParent && (
            <>
              <Button variant="secondary" size="sm" onClick={() => setShowEditSubject(true)}>
                Edit
              </Button>
              <Button variant="danger" size="sm" onClick={handleDeleteSubject}>
                Delete
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Exam dates */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Exam dates</h2>
            <Button variant="secondary" size="sm" onClick={() => setShowEditExamDates(true)}>
              {subject.exam_dates.length > 0 ? 'Edit' : '+ Add dates'}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="py-3">
          {subject.exam_dates.length === 0 ? (
            <p className="text-sm text-gray-400">No exam dates added yet</p>
          ) : (
            <div className="space-y-2">
              {subject.exam_dates.map((ed, i) => {
                const days = daysUntil(ed.date);
                const variant = days < 0 ? 'gray' : days < 7 ? 'red' : days < 30 ? 'yellow' : 'green';
                return (
                  <div key={i} className="flex items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-900">{ed.label}</span>
                        <Badge variant={variant}>
                          {days < 0 ? 'Past' : days === 0 ? 'Today' : `${days}d`}
                        </Badge>
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5 flex gap-3">
                        <span>{formatDisplayDate(ed.date)}</span>
                        {ed.time && <span>🕐 {ed.time}</span>}
                        {ed.duration_minutes && <span>⏱ {minutesToHours(ed.duration_minutes)}</span>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Never revised warning */}
      {neverRevised.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm text-amber-800">
          ⚠️ {neverRevised.length} topic{neverRevised.length > 1 ? 's' : ''} never revised:{' '}
          {neverRevised.slice(0, 3).map((t) => t.name).join(', ')}
          {neverRevised.length > 3 && ` +${neverRevised.length - 3} more`}
        </div>
      )}

      {/* Topics */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">
              Topics ({topics.length})
            </h2>
            {!isParent && (
              <Button size="sm" onClick={() => setShowAddTopic(true)}>
                + Add topic
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="py-0">
          {topics.length === 0 ? (
            <div className="py-8 text-center text-gray-400 text-sm">
              No topics yet. Add your first topic above.
            </div>
          ) : (
            <div>
              {topics.map((topic) => (
                <TopicRow
                  key={topic.id}
                  topic={topic}
                  subjectId={subject.id}
                  onEdit={isParent ? () => {} : setEditingTopic}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Back link */}
      <Link href="/subjects" className="text-sm text-indigo-600 hover:underline">
        ← All subjects
      </Link>

      {/* Modals */}
      <Modal open={showAddTopic} onClose={() => setShowAddTopic(false)} title="Add topic">
        <TopicForm subjectId={subject.id} onSuccess={() => setShowAddTopic(false)} />
      </Modal>

      <Modal open={!!editingTopic} onClose={() => setEditingTopic(null)} title="Edit topic">
        {editingTopic && (
          <TopicForm
            subjectId={subject.id}
            topic={editingTopic}
            onSuccess={() => setEditingTopic(null)}
          />
        )}
      </Modal>

      <Modal open={showEditSubject} onClose={() => setShowEditSubject(false)} title="Edit subject">
        <SubjectForm subject={subject} onSuccess={() => setShowEditSubject(false)} />
      </Modal>

      <Modal
        open={showEditExamDates}
        onClose={() => setShowEditExamDates(false)}
        title={`Exam dates — ${subject.name}`}
      >
        <ExamDatesForm
          subjectId={subject.id}
          subjectName={subject.name}
          initialDates={subject.exam_dates}
          onSuccess={() => setShowEditExamDates(false)}
        />
      </Modal>
    </div>
  );
}
