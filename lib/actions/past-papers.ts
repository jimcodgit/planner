'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

export interface PastPaperFormData {
  subject_id: string;
  paper_label: string;
  attempted_date: string;
  score_raw: number | null;
  score_max: number | null;
  grade: string | null;
  notes: string | null;
}

export async function createPastPaperAttempt(data: PastPaperFormData): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  const { error } = await supabase.from('past_paper_attempts').insert({
    user_id: user.id,
    ...data,
  });
  if (error) return { error: error.message };
  revalidatePath('/past-papers');
  return {};
}

export async function deletePastPaperAttempt(id: string): Promise<void> {
  const supabase = await createClient();
  await supabase.from('past_paper_attempts').delete().eq('id', id);
  revalidatePath('/past-papers');
}
