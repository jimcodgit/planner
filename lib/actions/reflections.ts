'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

export interface ReflectionFormData {
  subject_id: string;
  exam_label: string;
  exam_date: string;
  prepared_rating: number;
  notes: string | null;
}

export async function saveExamReflection(data: ReflectionFormData): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  const { error } = await supabase.from('exam_reflections').upsert({
    user_id: user.id,
    subject_id: data.subject_id,
    exam_label: data.exam_label,
    exam_date: data.exam_date,
    prepared_rating: data.prepared_rating,
    notes: data.notes,
  }, {
    onConflict: 'user_id,subject_id,exam_date,exam_label',
  });

  if (error) return { error: error.message };
  revalidatePath('/');
  return {};
}
