'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { updateExamDates } from '@/lib/actions/subjects';
import type { ExamDate } from '@/types/database';

interface ExamDatesFormProps {
  subjectId: string;
  subjectName: string;
  initialDates: ExamDate[];
  onSuccess?: () => void;
}

export function ExamDatesForm({
  subjectId,
  subjectName,
  initialDates,
  onSuccess,
}: ExamDatesFormProps) {
  const [dates, setDates] = useState<ExamDate[]>(
    initialDates.length > 0 ? initialDates : [{ label: '', date: '', time: '', duration_minutes: undefined }]
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function addDate() {
    setDates([...dates, { label: '', date: '', time: '', duration_minutes: undefined }]);
  }

  function removeDate(i: number) {
    setDates(dates.filter((_, idx) => idx !== i));
  }

  function update(i: number, field: keyof ExamDate, value: string | number | undefined) {
    setDates(dates.map((d, idx) => (idx === i ? { ...d, [field]: value } : d)));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const cleaned = dates
        .filter((d) => d.date)
        .map((d) => ({
          label: d.label,
          date: d.date,
          ...(d.time ? { time: d.time } : {}),
          ...(d.duration_minutes ? { duration_minutes: d.duration_minutes } : {}),
        }));
      await updateExamDates(subjectId, cleaned);
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="text-sm text-gray-500">
        Editing exam dates for <strong>{subjectName}</strong>
      </p>

      <div className="space-y-3">
        {dates.map((d, i) => (
          <div key={i} className="bg-gray-50 rounded-lg p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-500">Paper {i + 1}</span>
              <button
                type="button"
                onClick={() => removeDate(i)}
                className="text-xs text-red-500 hover:text-red-700"
              >
                Remove
              </button>
            </div>
            <Input
              label="Label"
              value={d.label}
              onChange={(e) => update(i, 'label', e.target.value)}
              placeholder="e.g. Paper 1, Written Exam"
            />
            <div className="grid grid-cols-2 gap-2">
              <Input
                label="Date"
                type="date"
                value={d.date}
                onChange={(e) => update(i, 'date', e.target.value)}
                required
              />
              <Input
                label="Start time"
                type="time"
                value={d.time ?? ''}
                onChange={(e) => update(i, 'time', e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Duration (minutes)</label>
              <input
                type="number"
                min="15"
                max="360"
                step="5"
                value={d.duration_minutes ?? ''}
                onChange={(e) =>
                  update(i, 'duration_minutes', e.target.value ? Number(e.target.value) : undefined)
                }
                placeholder="e.g. 90"
                className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>
        ))}
      </div>

      <Button type="button" variant="secondary" size="sm" onClick={addDate} className="w-full">
        + Add exam paper
      </Button>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <Button type="submit" disabled={loading} className="w-full">
        {loading ? 'Saving…' : 'Save exam dates'}
      </Button>
    </form>
  );
}
