'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { createSubject, updateSubject } from '@/lib/actions/subjects';
import type { Subject, ExamDate } from '@/types/database';

const PRESET_COLORS = [
  '#6366f1', '#ec4899', '#f59e0b', '#10b981', '#3b82f6',
  '#8b5cf6', '#ef4444', '#14b8a6', '#f97316', '#84cc16',
];

interface SubjectFormProps {
  subject?: Subject;
  onSuccess?: () => void;
}

export function SubjectForm({ subject, onSuccess }: SubjectFormProps) {
  const [name, setName] = useState(subject?.name ?? '');
  const [examBoard, setExamBoard] = useState(subject?.exam_board ?? '');
  const [color, setColor] = useState(subject?.color ?? PRESET_COLORS[0]);
  const [weeklyTarget, setWeeklyTarget] = useState(subject?.weekly_target_hours ?? 1);
  const [examDates, setExamDates] = useState<ExamDate[]>(subject?.exam_dates ?? []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function addExamDate() {
    setExamDates([...examDates, { label: '', date: '' }]);
  }

  function removeExamDate(i: number) {
    setExamDates(examDates.filter((_, idx) => idx !== i));
  }

  function updateExamDate(i: number, field: keyof ExamDate, value: string) {
    setExamDates(examDates.map((ed, idx) => (idx === i ? { ...ed, [field]: value } : ed)));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const data = {
        name,
        exam_board: examBoard,
        exam_dates: examDates.filter((ed) => ed.date),
        color,
        weekly_target_hours: weeklyTarget,
      };

      if (subject) {
        await updateSubject(subject.id, data);
      } else {
        await createSubject(data);
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
      <Input
        id="name"
        label="Subject name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="e.g. Mathematics"
        required
      />
      <Input
        id="examBoard"
        label="Exam board (optional)"
        value={examBoard}
        onChange={(e) => setExamBoard(e.target.value)}
        placeholder="e.g. AQA, Edexcel"
      />
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-gray-700">Weekly target (hours)</label>
        <input
          type="number"
          min="0.5"
          max="20"
          step="0.5"
          value={weeklyTarget}
          onChange={(e) => setWeeklyTarget(Number(e.target.value))}
          className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-gray-700">Colour</label>
        <div className="flex gap-2 flex-wrap">
          {PRESET_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              className="w-7 h-7 rounded-full border-2 transition-transform hover:scale-110"
              style={{
                backgroundColor: c,
                borderColor: color === c ? '#1e1b4b' : 'transparent',
              }}
            />
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-gray-700">Exam dates</label>
          <Button type="button" variant="ghost" size="sm" onClick={addExamDate}>
            + Add date
          </Button>
        </div>
        {examDates.map((ed, i) => (
          <div key={i} className="flex gap-2 items-end">
            <Input
              label="Label"
              value={ed.label}
              onChange={(e) => updateExamDate(i, 'label', e.target.value)}
              placeholder="Paper 1"
              className="flex-1"
            />
            <Input
              label="Date"
              type="date"
              value={ed.date}
              onChange={(e) => updateExamDate(i, 'date', e.target.value)}
              className="flex-1"
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => removeExamDate(i)}
              className="mb-0.5 text-red-500"
            >
              ✕
            </Button>
          </div>
        ))}
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex gap-2 pt-2">
        <Button type="submit" disabled={loading} className="flex-1">
          {loading ? 'Saving…' : subject ? 'Update subject' : 'Create subject'}
        </Button>
      </div>
    </form>
  );
}
