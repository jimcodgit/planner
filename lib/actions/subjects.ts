'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import type { ExamDate } from '@/types/database';

export interface SubjectFormData {
  name: string;
  exam_board: string;
  exam_dates: ExamDate[];
  color: string;
  weekly_target_hours: number;
}

export async function createSubject(data: SubjectFormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase.from('subjects').insert({
    user_id: user.id,
    name: data.name,
    exam_board: data.exam_board || null,
    exam_dates: data.exam_dates,
    color: data.color,
    weekly_target_hours: data.weekly_target_hours,
  });

  if (error) throw new Error(error.message);
  revalidatePath('/subjects');
  revalidatePath('/');
}

export async function updateSubject(id: string, data: Partial<SubjectFormData>) {
  const supabase = await createClient();
  const { error } = await supabase.from('subjects').update(data).eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/subjects');
  revalidatePath(`/subjects/${id}`);
  revalidatePath('/');
}

export async function deleteSubject(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from('subjects').delete().eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/subjects');
  revalidatePath('/');
}
