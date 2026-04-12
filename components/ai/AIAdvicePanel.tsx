'use client';

import { useState } from 'react';
import { useCompletion } from '@ai-sdk/react';
import { Card, CardContent } from '@/components/ui/Card';
import type { Subject, Topic } from '@/types/database';
import { differenceInDays } from 'date-fns';

interface AIAdvicePanelProps {
  subject: Subject;
  topics: Topic[];
  weeklyTargetHours: number;
}

export function AIAdvicePanel({ subject, topics, weeklyTargetHours }: AIAdvicePanelProps) {
  const [open, setOpen] = useState(false);

  const { completion, complete, isLoading, error } = useCompletion({
    api: '/api/ai/plan',
    streamProtocol: 'text',
  });

  function buildPayload() {
    const now = new Date();
    const examDates = (subject.exam_dates ?? [])
      .map((e) => ({ label: e.label, days: differenceInDays(new Date(e.date), now) }))
      .filter((e) => e.days >= 0)
      .sort((a, b) => a.days - b.days);

    const topicsPayload = topics.map((t) => ({
      name: t.name,
      status: t.status,
      daysSince: t.last_revised_at
        ? differenceInDays(now, new Date(t.last_revised_at))
        : null,
      difficulty: t.difficulty,
    }));

    return { topics: topicsPayload, subjectName: subject.name, examDates, weeklyTargetHours };
  }

  async function handleOpen() {
    setOpen(true);
    if (!completion) {
      await complete('', { body: buildPayload() });
    }
  }

  async function handleRefresh() {
    await complete('', { body: buildPayload() });
  }

  if (!open) {
    return (
      <button
        onClick={handleOpen}
        className="flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-800 font-medium"
      >
        <SparkleIcon />
        AI advice
      </button>
    );
  }

  return (
    <Card className="border-indigo-100 bg-indigo-50/40">
      <CardContent className="py-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1.5 text-sm font-semibold text-indigo-800">
            <SparkleIcon />
            AI revision advice
          </div>
          <div className="flex items-center gap-3">
            {!isLoading && completion && (
              <button
                onClick={handleRefresh}
                className="text-xs text-indigo-500 hover:text-indigo-700"
              >
                Refresh
              </button>
            )}
            <button
              onClick={() => setOpen(false)}
              className="text-gray-400 hover:text-gray-600 text-sm"
            >
              ✕
            </button>
          </div>
        </div>

        {isLoading && !completion && (
          <div className="flex items-center gap-2 text-sm text-indigo-600">
            <LoadingDots />
            Analysing your topics…
          </div>
        )}

        {error && (
          <p className="text-sm text-red-600">
            {error.message.includes('GROQ_API_KEY')
              ? 'Add GROQ_API_KEY to your environment variables to enable AI advice.'
              : `Error: ${error.message}`}
          </p>
        )}

        {completion && (
          <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">
            {completion}
          </p>
        )}

        <p className="text-xs text-indigo-400 mt-3">Powered by Llama 3.3 via Groq</p>
      </CardContent>
    </Card>
  );
}

function SparkleIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 20 20" fill="none" className="flex-shrink-0">
      <path
        d="M10 2l1.5 5.5L17 9l-5.5 1.5L10 16l-1.5-5.5L3 9l5.5-1.5L10 2z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function LoadingDots() {
  return (
    <span className="inline-flex gap-0.5">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce"
          style={{ animationDelay: `${i * 0.15}s` }}
        />
      ))}
    </span>
  );
}
