'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { updateSessionStatus } from '@/lib/actions/sessions';
import { cn } from '@/lib/utils/cn';

interface MarkDoneButtonProps {
  sessionId: string;
  topicId: string | null;
  disabled?: boolean;
  className?: string;
}

export function MarkDoneButton({ sessionId, topicId, disabled, className }: MarkDoneButtonProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleClick() {
    setLoading(true);
    try {
      await updateSessionStatus(sessionId, 'Done', topicId);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      size="sm"
      onClick={handleClick}
      disabled={loading || disabled}
      className={cn('bg-green-600 hover:bg-green-700 text-white', className)}
    >
      {loading ? '…' : '✓ Done'}
    </Button>
  );
}
