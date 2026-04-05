'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/Button';
import { createPastPaperAttempt } from '@/lib/actions/past-papers';
import { toISODate } from '@/lib/utils/dates';
import type { Subject } from '@/types/database';

interface PastPaperFormProps {
  subjects: Subject[];
  onSuccess: () => void;
}

export function PastPaperForm({ subjects, onSuccess }: PastPaperFormProps) {
  const [subjectId, setSubjectId] = useState(subjects[0]?.id ?? '');
  const [paperLabel, setPaperLabel] = useState('');
  const [attemptedDate, setAttemptedDate] = useState(toISODate(new Date()));
  const [scoreRaw, setScoreRaw] = useState('');
  const [scoreMax, setScoreMax] = useState('');
  const [grade, setGrade] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    const result = await createPastPaperAttempt({
      subject_id: subjectId,
      paper_label: paperLabel,
      attempted_date: attemptedDate,
      score_raw: scoreRaw ? Number(scoreRaw) : null,
      score_max: scoreMax ? Number(scoreMax) : null,
      grade: grade || null,
      notes: notes || null,
    });
    setLoading(false);
    if (result.error) { setError(result.error); return; }
    onSuccess();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Select id="pp-subject" label="Subject" value={subjectId} onChange={(e) => setSubjectId(e.target.value)} required>
        {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
      </Select>

      <Input
        id="pp-label"
        label="Paper label"
        placeholder="e.g. AQA Nov 2023 Paper 1"
        value={paperLabel}
        onChange={(e) => setPaperLabel(e.target.value)}
        required
      />

      <Input
        id="pp-date"
        label="Date attempted"
        type="date"
        value={attemptedDate}
        onChange={(e) => setAttemptedDate(e.target.value)}
        required
      />

      <div className="grid grid-cols-3 gap-3">
        <Input
          id="pp-score"
          label="Score"
          type="number"
          min="0"
          placeholder="e.g. 68"
          value={scoreRaw}
          onChange={(e) => setScoreRaw(e.target.value)}
        />
        <Input
          id="pp-max"
          label="Out of"
          type="number"
          min="1"
          placeholder="e.g. 80"
          value={scoreMax}
          onChange={(e) => setScoreMax(e.target.value)}
        />
        <Input
          id="pp-grade"
          label="Grade"
          placeholder="e.g. 7"
          value={grade}
          onChange={(e) => setGrade(e.target.value)}
        />
      </div>

      <Textarea
        id="pp-notes"
        label="Notes (optional)"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Topics to improve, time management notes…"
      />

      {error && <p className="text-sm text-red-600">{error}</p>}
      <Button type="submit" disabled={loading} className="w-full">
        {loading ? 'Saving…' : 'Log past paper'}
      </Button>
    </form>
  );
}
