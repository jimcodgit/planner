'use client';

import { deletePastPaperAttempt } from '@/lib/actions/past-papers';
import type { PastPaperAttempt, Subject } from '@/types/database';

interface Props {
  attempts: PastPaperAttempt[];
  subjectsById: Record<string, Subject>;
  isParent: boolean;
}

function percentage(raw: number | null, max: number | null): string | null {
  if (raw === null || max === null || max === 0) return null;
  return `${Math.round((raw / max) * 100)}%`;
}

function scoreColor(pct: number): string {
  if (pct >= 70) return 'text-green-700';
  if (pct >= 50) return 'text-amber-600';
  return 'text-red-600';
}

export function PastPaperTable({ attempts, subjectsById, isParent }: Props) {
  if (attempts.length === 0) {
    return (
      <p className="text-sm text-gray-400 py-8 text-center">
        No past papers logged yet. Add your first attempt above.
      </p>
    );
  }

  async function handleDelete(id: string, label: string) {
    if (!confirm(`Delete attempt "${label}"?`)) return;
    await deletePastPaperAttempt(id);
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200 text-left">
            <th className="pb-2 font-medium text-gray-500">Date</th>
            <th className="pb-2 font-medium text-gray-500">Subject</th>
            <th className="pb-2 font-medium text-gray-500">Paper</th>
            <th className="pb-2 font-medium text-gray-500">Score</th>
            <th className="pb-2 font-medium text-gray-500">Grade</th>
            <th className="pb-2 font-medium text-gray-500">Notes</th>
            {!isParent && <th className="pb-2" />}
          </tr>
        </thead>
        <tbody>
          {attempts.map((a) => {
            const pctStr = percentage(a.score_raw, a.score_max);
            const pctNum = a.score_raw !== null && a.score_max !== null && a.score_max > 0
              ? (a.score_raw / a.score_max) * 100
              : null;
            const subject = subjectsById[a.subject_id];

            return (
              <tr key={a.id} className="border-b border-gray-100 last:border-0">
                <td className="py-2 text-gray-600 whitespace-nowrap">{a.attempted_date}</td>
                <td className="py-2">
                  <div className="flex items-center gap-2">
                    {subject && (
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: subject.color }} />
                    )}
                    <span className="text-gray-900">{subject?.name ?? '—'}</span>
                  </div>
                </td>
                <td className="py-2 text-gray-900">{a.paper_label}</td>
                <td className="py-2">
                  {a.score_raw !== null && a.score_max !== null ? (
                    <span className={pctNum !== null ? scoreColor(pctNum) : ''}>
                      {a.score_raw}/{a.score_max}
                      {pctStr && <span className="ml-1 text-xs">({pctStr})</span>}
                    </span>
                  ) : (
                    <span className="text-gray-400">—</span>
                  )}
                </td>
                <td className="py-2">
                  {a.grade ? (
                    <span className="font-semibold text-gray-900">{a.grade}</span>
                  ) : (
                    <span className="text-gray-400">—</span>
                  )}
                </td>
                <td className="py-2 text-gray-500 max-w-xs truncate">
                  {a.notes ?? '—'}
                </td>
                {!isParent && (
                  <td className="py-2">
                    <button
                      onClick={() => handleDelete(a.id, a.paper_label)}
                      className="text-gray-400 hover:text-red-600 text-xs"
                    >
                      ✕
                    </button>
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
