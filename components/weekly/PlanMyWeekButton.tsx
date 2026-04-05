'use client';

import { useState } from 'react';
import { planMyWeek } from '@/lib/actions/planner';

export function PlanMyWeekButton() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  async function handleClick() {
    if (!confirm('Auto-generate sessions for this week based on topic priorities? This will add sessions alongside any you already have.')) return;
    setLoading(true);
    setResult(null);
    try {
      const { count, error } = await planMyWeek();
      if (error) {
        setResult(`Error: ${error}`);
      } else if (count === 0) {
        setResult('No new sessions needed — your week is already planned!');
      } else {
        setResult(`Added ${count} session${count === 1 ? '' : 's'} to your week.`);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        onClick={handleClick}
        disabled={loading}
        className="px-3 py-1.5 text-sm font-medium rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"
      >
        {loading ? 'Planning…' : 'Plan my week'}
      </button>
      {result && (
        <p className="text-xs text-gray-500 max-w-xs text-right">{result}</p>
      )}
    </div>
  );
}
