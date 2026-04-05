'use client';

import { useState } from 'react';
import { saveExamReflection } from '@/lib/actions/reflections';
import type { Subject, ExamDate } from '@/types/database';

interface PastExam {
  subject: Subject;
  exam: ExamDate;
  daysAgo: number;
}

interface Props {
  pastExams: PastExam[];
  existingReflectionKeys: Set<string>; // "subjectId|examDate|examLabel"
}

function ReflectionForm({ exam, subject, onDone }: { exam: ExamDate; subject: Subject; onDone: () => void }) {
  const [rating, setRating] = useState(3);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await saveExamReflection({
      subject_id: subject.id,
      exam_label: exam.label,
      exam_date: exam.date,
      prepared_rating: rating,
      notes: notes || null,
    });
    setSaving(false);
    onDone();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 mt-3">
      <div>
        <label className="text-sm text-gray-700 font-medium block mb-1">
          How prepared did you feel? (1 = not at all, 5 = very prepared)
        </label>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setRating(n)}
              className={`w-9 h-9 rounded-full text-sm font-semibold border-2 transition-colors ${
                rating === n
                  ? 'bg-indigo-600 border-indigo-600 text-white'
                  : 'border-gray-300 text-gray-600 hover:border-indigo-400'
              }`}
            >
              {n}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="text-sm text-gray-700 font-medium block mb-1">Notes (optional)</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="How did it go? Any topics you wish you'd revised more?"
          className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 resize-none"
          rows={2}
        />
      </div>
      <button
        type="submit"
        disabled={saving}
        className="px-4 py-1.5 text-sm rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"
      >
        {saving ? 'Saving…' : 'Save reflection'}
      </button>
    </form>
  );
}

export function ExamReflectionBanner({ pastExams, existingReflectionKeys }: Props) {
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [expanded, setExpanded] = useState<string | null>(null);

  const pending = pastExams.filter((pe) => {
    const key = `${pe.subject.id}|${pe.exam.date}|${pe.exam.label}`;
    return !existingReflectionKeys.has(key) && !dismissed.has(key);
  });

  if (pending.length === 0) return null;

  return (
    <div className="space-y-3 mb-6">
      {pending.map((pe) => {
        const key = `${pe.subject.id}|${pe.exam.date}|${pe.exam.label}`;
        return (
          <div key={key} className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: pe.subject.color }} />
                  <p className="font-semibold text-blue-900 text-sm">
                    {pe.subject.name} — {pe.exam.label}
                  </p>
                </div>
                <p className="text-xs text-blue-600 mt-0.5">
                  Exam was {pe.daysAgo === 0 ? 'today' : `${pe.daysAgo} day${pe.daysAgo === 1 ? '' : 's'} ago`}.
                  How did it go?
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => setExpanded(expanded === key ? null : key)}
                  className="text-xs font-medium text-blue-700 hover:text-blue-900 border border-blue-300 rounded px-2 py-1"
                >
                  {expanded === key ? 'Cancel' : 'Reflect'}
                </button>
                <button
                  onClick={() => setDismissed((d) => new Set([...d, key]))}
                  className="text-blue-400 hover:text-blue-600 text-sm"
                  aria-label="Dismiss"
                >
                  ✕
                </button>
              </div>
            </div>

            {expanded === key && (
              <ReflectionForm
                exam={pe.exam}
                subject={pe.subject}
                onDone={() => {
                  setExpanded(null);
                  setDismissed((d) => new Set([...d, key]));
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
