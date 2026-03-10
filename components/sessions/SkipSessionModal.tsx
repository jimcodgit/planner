'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { updateSessionStatus, rescheduleSession } from '@/lib/actions/sessions';
import { toISODate } from '@/lib/utils/dates';
import { addDays } from 'date-fns';

interface SkipSessionModalProps {
  open: boolean;
  onClose: () => void;
  sessionId: string;
  sessionDate: string;
}

export function SkipSessionModal({ open, onClose, sessionId, sessionDate }: SkipSessionModalProps) {
  const tomorrow = toISODate(addDays(new Date(), 1));
  const [rescheduleDate, setRescheduleDate] = useState(tomorrow);
  const [rescheduleTime, setRescheduleTime] = useState('');
  const [mode, setMode] = useState<'skip' | 'reschedule'>('reschedule');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleConfirm() {
    setLoading(true);
    try {
      if (mode === 'skip') {
        await updateSessionStatus(sessionId, 'Skipped');
      } else {
        await updateSessionStatus(sessionId, 'Skipped');
        await rescheduleSession(sessionId, rescheduleDate, rescheduleTime || null);
      }
      router.refresh();
      onClose();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Skip session">
      <div className="space-y-4">
        <p className="text-sm text-gray-600">Would you like to reschedule this session or just skip it?</p>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setMode('reschedule')}
            className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-colors ${
              mode === 'reschedule'
                ? 'bg-indigo-50 border-indigo-300 text-indigo-700'
                : 'border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            Reschedule
          </button>
          <button
            type="button"
            onClick={() => setMode('skip')}
            className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-colors ${
              mode === 'skip'
                ? 'bg-red-50 border-red-300 text-red-700'
                : 'border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            Just skip
          </button>
        </div>

        {mode === 'reschedule' && (
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="New date"
              type="date"
              value={rescheduleDate}
              onChange={(e) => setRescheduleDate(e.target.value)}
              min={toISODate(new Date())}
            />
            <Input
              label="Time (optional)"
              type="time"
              value={rescheduleTime}
              onChange={(e) => setRescheduleTime(e.target.value)}
            />
          </div>
        )}

        <div className="flex gap-2 pt-2">
          <Button variant="secondary" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={loading}
            variant={mode === 'skip' ? 'danger' : 'primary'}
            className="flex-1"
          >
            {loading ? '…' : mode === 'skip' ? 'Skip session' : 'Reschedule'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
