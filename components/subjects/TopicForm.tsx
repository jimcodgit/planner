'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/Button';
import { createTopic, updateTopic } from '@/lib/actions/topics';
import type { Topic, TopicStatus, TopicPriority } from '@/types/database';

interface TopicFormProps {
  subjectId: string;
  topic?: Topic;
  onSuccess?: () => void;
}

export function TopicForm({ subjectId, topic, onSuccess }: TopicFormProps) {
  const [name, setName] = useState(topic?.name ?? '');
  const [status, setStatus] = useState<TopicStatus>(topic?.status ?? 'Not Started');
  const [difficulty, setDifficulty] = useState(topic?.difficulty ?? 3);
  const [priority, setPriority] = useState<TopicPriority>(topic?.priority ?? 'Normal');
  const [notes, setNotes] = useState(topic?.notes ?? '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (topic) {
        await updateTopic(topic.id, { name, status, difficulty, priority, notes, subject_id: subjectId });
      } else {
        await createTopic({ subject_id: subjectId, name, status, difficulty, priority, notes });
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
        id="topic-name"
        label="Topic name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="e.g. Algebra"
        required
      />
      <div className="grid grid-cols-2 gap-3">
        <Select
          id="topic-status"
          label="Status"
          value={status}
          onChange={(e) => setStatus(e.target.value as TopicStatus)}
        >
          <option>Not Started</option>
          <option>Learning</option>
          <option>Revising</option>
          <option>Confident</option>
        </Select>
        <Select
          id="topic-priority"
          label="Priority"
          value={priority}
          onChange={(e) => setPriority(e.target.value as TopicPriority)}
        >
          <option>Low</option>
          <option>Normal</option>
          <option>High</option>
        </Select>
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-gray-700">
          Difficulty: {difficulty}/5
        </label>
        <input
          type="range"
          min="1"
          max="5"
          value={difficulty}
          onChange={(e) => setDifficulty(Number(e.target.value))}
          className="w-full accent-indigo-600"
        />
      </div>
      <Textarea
        id="topic-notes"
        label="Notes (optional)"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Key points to remember…"
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <Button type="submit" disabled={loading} className="w-full">
        {loading ? 'Saving…' : topic ? 'Update topic' : 'Add topic'}
      </Button>
    </form>
  );
}
