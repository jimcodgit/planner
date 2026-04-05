'use client';

import { useEffect, useState, useCallback } from 'react';
import { updateSessionStatus } from '@/lib/actions/sessions';

interface SessionTimerProps {
  sessionId: string;
  topicId: string | null;
  durationMinutes: number;
  subjectName: string;
  topicName?: string;
  onClose: () => void;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function SessionTimer({
  sessionId,
  topicId,
  durationMinutes,
  subjectName,
  topicName,
  onClose,
}: SessionTimerProps) {
  const totalSeconds = durationMinutes * 60;
  const [remaining, setRemaining] = useState(totalSeconds);
  const [running, setRunning] = useState(true);
  const [done, setDone] = useState(false);
  const [marking, setMarking] = useState(false);

  useEffect(() => {
    if (!running || done) return;
    const id = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(id);
          setRunning(false);
          setDone(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [running, done]);

  const progress = (totalSeconds - remaining) / totalSeconds;

  const handleMarkDone = useCallback(async () => {
    setMarking(true);
    await updateSessionStatus(sessionId, 'Done', topicId);
    onClose();
  }, [sessionId, topicId, onClose]);

  const circumference = 2 * Math.PI * 54;
  const dashOffset = circumference * (1 - progress);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-80 flex flex-col items-center gap-4">
        <div className="text-center">
          <p className="font-semibold text-gray-900">{subjectName}</p>
          {topicName && <p className="text-sm text-gray-500">{topicName}</p>}
        </div>

        <div className="relative w-36 h-36">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
            <circle cx="60" cy="60" r="54" fill="none" stroke="#e5e7eb" strokeWidth="8" />
            <circle
              cx="60" cy="60" r="54"
              fill="none"
              stroke={done ? '#22c55e' : '#6366f1'}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              className="transition-all duration-1000"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-mono font-bold text-gray-900">
              {formatTime(remaining)}
            </span>
            <span className="text-xs text-gray-400">remaining</span>
          </div>
        </div>

        {done && (
          <p className="text-green-700 font-semibold text-sm">Time&apos;s up! Great work.</p>
        )}

        <div className="flex gap-2 w-full">
          {!done && (
            <button
              onClick={() => setRunning((r) => !r)}
              className="flex-1 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50"
            >
              {running ? 'Pause' : 'Resume'}
            </button>
          )}
          <button
            onClick={handleMarkDone}
            disabled={marking}
            className="flex-1 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
          >
            {marking ? 'Saving…' : 'Mark done'}
          </button>
        </div>

        <button
          onClick={onClose}
          className="text-xs text-gray-400 hover:text-gray-600"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}
