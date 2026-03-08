'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import type { TopicStatus, TopicPriority } from '@/types/database';

export interface TopicFormData {
  subject_id: string;
  name: string;
  status: TopicStatus;
  difficulty: number;
  priority: TopicPriority;
  notes: string;
}

export async function createTopic(data: TopicFormData) {
  const supabase = await createClient();
  const { error } = await supabase.from('topics').insert({
    subject_id: data.subject_id,
    name: data.name,
    status: data.status,
    difficulty: data.difficulty,
    priority: data.priority,
    notes: data.notes || null,
  });
  if (error) throw new Error(error.message);
  revalidatePath(`/subjects/${data.subject_id}`);
}

export async function updateTopicStatus(id: string, status: TopicStatus, subjectId: string) {
  const supabase = await createClient();
  const updates: Record<string, unknown> = { status };
  if (status === 'Revising' || status === 'Confident') {
    updates.last_revised_at = new Date().toISOString();
  }
  const { error } = await supabase.from('topics').update(updates).eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath(`/subjects/${subjectId}`);
  revalidatePath('/');
}

export async function updateTopic(id: string, data: Partial<TopicFormData>) {
  const supabase = await createClient();
  const { error } = await supabase.from('topics').update(data).eq('id', id);
  if (error) throw new Error(error.message);
  if (data.subject_id) revalidatePath(`/subjects/${data.subject_id}`);
}

export async function deleteTopic(id: string, subjectId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from('topics').delete().eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath(`/subjects/${subjectId}`);
}
