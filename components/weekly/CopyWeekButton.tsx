'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { copyPreviousWeek } from '@/lib/actions/sessions';

interface CopyWeekButtonProps {
  targetWeekStart: string;
  previousWeekStart: string;
}

export function CopyWeekButton({ targetWeekStart, previousWeekStart }: CopyWeekButtonProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<number | null>(null);
  const router = useRouter();

  async function handleCopy() {
    setLoading(true);
    try {
      const count = await copyPreviousWeek(targetWeekStart);
      setResult(count);
      if (count > 0) {
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  }

  function handleClose() {
    setOpen(false);
    setResult(null);
  }

  const prevWeekDate = new Date(previousWeekStart);
  const prevWeekEnd = new Date(prevWeekDate.getTime() + 6 * 24 * 60 * 60 * 1000);
  const fmt = (d: Date) =>
    d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });

  return (
    <>
      <Button variant="secondary" size="sm" onClick={() => setOpen(true)}>
        Copy previous week
      </Button>

      <Modal open={open} onClose={handleClose} title="Copy previous week">
        {result === null ? (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              This will copy all planned sessions from{' '}
              <strong>{fmt(prevWeekDate)} – {fmt(prevWeekEnd)}</strong> into the current week,
              keeping the same subjects, topics, times and durations.
            </p>
            <p className="text-sm text-gray-500">
              Sessions that already exist in the current week will not be duplicated.
              Skipped sessions will not be copied.
            </p>
            <div className="flex gap-2 pt-2">
              <Button variant="secondary" onClick={handleClose} className="flex-1">
                Cancel
              </Button>
              <Button onClick={handleCopy} disabled={loading} className="flex-1">
                {loading ? 'Copying…' : 'Copy sessions'}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4 text-center">
            {result === 0 ? (
              <>
                <div className="text-4xl">📭</div>
                <p className="text-gray-700 font-medium">Nothing to copy</p>
                <p className="text-sm text-gray-500">
                  No sessions were found in the previous week, or they all already exist this week.
                </p>
              </>
            ) : (
              <>
                <div className="text-4xl">✅</div>
                <p className="text-gray-700 font-medium">
                  {result} session{result !== 1 ? 's' : ''} copied
                </p>
                <p className="text-sm text-gray-500">
                  Sessions have been added to this week as Planned.
                </p>
              </>
            )}
            <Button onClick={handleClose} className="w-full">Done</Button>
          </div>
        )}
      </Modal>
    </>
  );
}
