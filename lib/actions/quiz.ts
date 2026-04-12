'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

export async function saveQuizScore(topicId: string, subjectId: string, score: number, total: number) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from('topics')
    .update({
      last_quiz_score: score,
      last_quiz_total: total,
      last_quiz_at: new Date().toISOString(),
    })
    .eq('id', topicId);

  revalidatePath(`/subjects/${subjectId}`);
}
