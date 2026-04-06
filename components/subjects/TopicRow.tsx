'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/Badge';
import { Select } from '@/components/ui/Select';
import { deleteTopic, updateTopicStatus } from '@/lib/actions/topics';
import type { Topic, TopicStatus } from '@/types/database';
import { formatDisplayDate } from '@/lib/utils/dates';

interface TopicRowProps {
  topic: Topic & { priorityScore: number };
  subjectId: string;
  onEdit: (topic: Topic) => void;
}

const STATUS_OPTIONS: TopicStatus[] = ['Not Started', 'Wobbly', 'Brush Up', 'Confident'];

const STATUS_BADGE: Record<TopicStatus, 'gray' | 'orange' | 'yellow' | 'green'> = {
  'Not Started': 'gray',
  'Wobbly': 'orange',
  'Brush Up': 'yellow',
  'Confident': 'green',
};

export function TopicRow({ topic, subjectId, onEdit }: TopicRowProps) {
  const [updating, setUpdating] = useState(false);
  const [showNotes, setShowNotes] = useState(false);

  async function handleStatusChange(newStatus: TopicStatus) {
    setUpdating(true);
    try {
      await updateTopicStatus(topic.id, newStatus, subjectId);
    } finally {
      setUpdating(false);
    }
  }

  async function handleDelete() {
    if (!confirm(`Delete topic "${topic.name}"?`)) return;
    await deleteTopic(topic.id, subjectId);
  }

  const difficultyDots = Array.from({ length: 5 }, (_, i) => (
    <span
      key={i}
      className={`inline-block w-2 h-2 rounded-full ${i < topic.difficulty ? 'bg-indigo-500' : 'bg-gray-200'}`}
    />
  ));

  return (
    <div className="border-b border-gray-100 last:border-0">
      <div className="flex items-center gap-3 py-2.5 group">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-gray-900 text-sm truncate">{topic.name}</span>
            {topic.priority === 'High' && <Badge variant="red">High priority</Badge>}
            {topic.priority === 'Low' && <Badge variant="gray">Low</Badge>}
            {topic.notes && (
              <button
                onClick={() => setShowNotes((v) => !v)}
                className="text-xs text-gray-400 hover:text-indigo-600"
                aria-label="Toggle notes"
              >
                {showNotes ? '▲ notes' : '▼ notes'}
              </button>
            )}
          </div>
          <div className="flex items-center gap-3 mt-1">
            <span className="flex gap-0.5">{difficultyDots}</span>
            <span className="text-xs text-gray-400">
              Score: {topic.priorityScore}
            </span>
            {topic.last_revised_at && (
              <span className="text-xs text-gray-400">
                Last: {formatDisplayDate(topic.last_revised_at)}
              </span>
            )}
            {!topic.last_revised_at && (
              <span className="text-xs text-amber-500">Never revised</span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <Badge variant={STATUS_BADGE[topic.status]}>{topic.status}</Badge>
          <Select
            value={topic.status}
            onChange={(e) => handleStatusChange(e.target.value as TopicStatus)}
            disabled={updating}
            className="text-xs py-1 w-36"
            aria-label="Update status"
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </Select>
          <button
            onClick={() => onEdit(topic)}
            className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-indigo-600 transition-opacity text-sm"
            aria-label="Edit topic"
          >
            ✎
          </button>
          <button
            onClick={handleDelete}
            className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-600 transition-opacity text-sm"
            aria-label="Delete topic"
          >
            ✕
          </button>
        </div>
      </div>
      {showNotes && topic.notes && (
        <div className="pb-2.5 px-1">
          <p className="text-xs text-gray-600 bg-gray-50 rounded px-3 py-2 whitespace-pre-wrap">
            {topic.notes}
          </p>
        </div>
      )}
    </div>
  );
}
