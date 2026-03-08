'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { SubjectForm } from '@/components/subjects/SubjectForm';

export function AddSubjectButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)}>+ Add subject</Button>
      <Modal open={open} onClose={() => setOpen(false)} title="Add subject">
        <SubjectForm onSuccess={() => setOpen(false)} />
      </Modal>
    </>
  );
}
