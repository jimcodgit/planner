'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/Button';
import { createSession, updateSession } from '@/lib/actions/sessions';
import type { Subject, Topic, RevisionSession, SessionType } from '@/types/database';
import { toISODate } from '@/lib/utils/dates';
import { cn } from '@/lib/utils/cn';

interface SessionFormProps {
  subjects: Subject[];
  topicsBySubject: Record<string, Topic[]>;
  session?: RevisionSession;
  defaultDate?: string;
  onSuccess?: () => void;
}

const SESSION_TYPES: { value: SessionType; label: string; icon: string; color: string }[] = [
  { value: 'Topic Review',       label: 'Topic Review',       icon: '📖', color: 'border-indigo-300 bg-indigo-50 text-indigo-700' },
  { value: 'Practice Questions', label: 'Practice Questions', icon: '✍️', color: 'border-amber-300 bg-amber-50 text-amber-700' },
  { value: 'Practice Paper',     label: 'Practice Paper',     icon: '📝', color: 'border-emerald-300 bg-emerald-50 text-emerald-700' },
];

export function SessionForm({
  subjects,
  topicsBySubject,
  session,
  defaultDate,
  onSuccess,
}: SessionFormProps) {
  const [subjectId, setSubjectId] = useState(session?.subject_id ?? subjects[0]?.id ?? '');
  const [topicId, setTopicId] = useState(session?.topic_id ?? '');
  const [date, setDate] = useState(session?.date ?? defaultDate ?? toISODate(new Date()));
  const [startTime, setStartTime] = useState(
    session?.start_time ? session.start_time.slice(0, 5) : ''
  );
  const [duration, setDuration] = useState(session?.duration_minutes ?? 30);
  const [type, setType] = useState<SessionType>(session?.type ?? 'Topic Review');
  const [notes, setNotes] = useState(session?.notes ?? '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const topics = topicsBySubject[subjectId] ?? [];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const data = {
        subject_id: subjectId,
        topic_id: topicId || null,
        date,
        start_time: startTime || null,
        duration_minutes: duration,
        type,
        notes,
      };
      if (session) {
        await updateSession(session.id, data);
      } else {
        await createSession(data);
      }
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Select
        id="subject"
        label="Subject"
        value={subjectId}
        onChange={(e) => {
          setSubjectId(e.target.value);
          setTopicId('');
        }}
        required
      >
        {subjects.map((s) => (
          <option key={s.id} value={s.id}>{s.name}</option>
        ))}
      </Select>

      <Select
        id="topic"
        label="Topic (optional)"
        value={topicId}
        onChange={(e) => setTopicId(e.target.value)}
      >
        <option value="">— No specific topic —</option>
        {topics.map((t) => (
          <option key={t.id} value={t.id}>{t.name}</option>
        ))}
      </Select>

      <div className="grid grid-cols-2 gap-3">
        <Input
          id="date"
          label="Date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          required
        />
        <Input
          id="startTime"
          label="Start time (optional)"
          type="time"
          value={startTime}
          onChange={(e) => setStartTime(e.target.value)}
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-gray-700">Duration: {duration} min</label>
        <input
          type="range"
          min="15"
          max="180"
          step="15"
          value={duration}
          onChange={(e) => setDuration(Number(e.target.value))}
          className="w-full accent-indigo-600"
        />
        <div className="flex justify-between text-xs text-gray-400">
          <span>15m</span>
          <span>3h</span>
        </div>
      </div>

      <div>
        <label className="text-sm font-medium text-gray-700 block mb-2">Session type</label>
        <div className="grid grid-cols-3 gap-2">
          {SESSION_TYPES.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => setType(t.value)}
              className={cn(
                'flex flex-col items-center gap-1 rounded-lg border-2 px-2 py-3 text-xs font-medium transition-colors',
                type === t.value
                  ? t.color + ' border-2'
                  : 'border-gray-200 bg-white text-gray-500 hover:bg-gray-50'
              )}
            >
              <span className="text-lg">{t.icon}</span>
              <span className="text-center leading-tight">{t.label}</span>
            </button>
          ))}
        </div>
      </div>

      <Textarea
        id="session-notes"
        label="Notes (optional)"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="What to focus on…"
      />

      {error && <p className="text-sm text-red-600">{error}</p>}
      <Button type="submit" disabled={loading} className="w-full">
        {loading ? 'Saving…' : session ? 'Update session' : 'Add session'}
      </Button>
    </form>
  );
}
