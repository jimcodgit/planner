'use client';

import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { PastPaperForm } from '@/components/past-papers/PastPaperForm';
import { PastPaperTable } from '@/components/past-papers/PastPaperTable';
import type { PastPaperAttempt, Subject } from '@/types/database';

interface Props {
  attempts: PastPaperAttempt[];
  subjects: Subject[];
  subjectsById: Record<string, Subject>;
  isParent: boolean;
}

export function PastPapersClient({ attempts, subjects, subjectsById, isParent }: Props) {
  const [showForm, setShowForm] = useState(false);

  return (
    <>
      {!isParent && (
        <div className="flex justify-end mb-4">
          <Button onClick={() => setShowForm(true)}>Log past paper</Button>
        </div>
      )}

      <PastPaperTable
        attempts={attempts}
        subjectsById={subjectsById}
        isParent={isParent}
      />

      <Modal open={showForm} title="Log past paper attempt" onClose={() => setShowForm(false)}>
        <PastPaperForm
          subjects={subjects}
          onSuccess={() => setShowForm(false)}
        />
      </Modal>
    </>
  );
}
