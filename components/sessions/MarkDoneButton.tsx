'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { updateSessionStatus } from '@/lib/actions/sessions';

interface MarkDoneButtonProps {
  sessionId: string;
  topicId: string | null;
  disabled?: boolean;
}

export function MarkDoneButton({ sessionId, topicId, disabled }: MarkDoneButtonProps) {
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    try {
      await updateSessionStatus(sessionId, 'Done', topicId);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      size="sm"
      onClick={handleClick}
      disabled={loading || disabled}
      className="bg-green-600 hover:bg-green-700 text-white"
    >
      {loading ? '…' : '✓ Done'}
    </Button>
  );
}
