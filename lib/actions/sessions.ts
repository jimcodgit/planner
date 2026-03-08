'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import type { SessionType, SessionStatus } from '@/types/database';

export interface SessionFormData {
  subject_id: string;
  topic_id: string | null;
  date: string;
  start_time: string | null;
  duration_minutes: number;
  type: SessionType;
  notes: string;
}

export async function createSession(data: SessionFormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase.from('revision_sessions').insert({
    user_id: user.id,
    subject_id: data.subject_id,
    topic_id: data.topic_id || null,
    date: data.date,
    start_time: data.start_time || null,
    duration_minutes: data.duration_minutes,
    type: data.type,
    notes: data.notes || null,
    status: 'Planned',
  });
  if (error) throw new Error(error.message);
  revalidatePath('/weekly');
  revalidatePath('/daily');
  revalidatePath('/');
}

export async function updateSessionStatus(
  id: string,
  status: SessionStatus,
  topicId?: string | null
) {
  const supabase = await createClient();
  const updates: Record<string, unknown> = { status };

  if (status === 'Skipped') {
    // Increment skipped_count
    const { data: session } = await supabase
      .from('revision_sessions')
      .select('skipped_count')
      .eq('id', id)
      .single();
    updates.skipped_count = (session?.skipped_count ?? 0) + 1;
  }

  const { error } = await supabase.from('revision_sessions').update(updates).eq('id', id);
  if (error) throw new Error(error.message);

  // Update topic last_revised_at when marked done
  if (status === 'Done' && topicId) {
    await supabase
      .from('topics')
      .update({ last_revised_at: new Date().toISOString() })
      .eq('id', topicId);
  }

  revalidatePath('/weekly');
  revalidatePath('/daily');
  revalidatePath('/');
}

export async function rescheduleSession(id: string, newDate: string, newStartTime: string | null) {
  const supabase = await createClient();
  const { error } = await supabase
    .from('revision_sessions')
    .update({ date: newDate, start_time: newStartTime || null, status: 'Planned' })
    .eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/weekly');
  revalidatePath('/daily');
}

export async function updateSession(id: string, data: Partial<SessionFormData>) {
  const supabase = await createClient();
  const { error } = await supabase.from('revision_sessions').update(data).eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/weekly');
  revalidatePath('/daily');
  revalidatePath('/');
}

export async function deleteSession(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from('revision_sessions').delete().eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/weekly');
  revalidatePath('/daily');
  revalidatePath('/');
}

export async function setWeeklyTarget(subjectId: string | null, hours: number) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  if (subjectId) {
    const { error } = await supabase
      .from('weekly_targets')
      .upsert({ set_by: user.id, subject_id: subjectId, hours }, { onConflict: 'subject_id' });
    if (error) throw new Error(error.message);
  } else {
    // Global target — upsert by set_by
    const { data: existing } = await supabase
      .from('weekly_targets')
      .select('id')
      .eq('set_by', user.id)
      .is('subject_id', null)
      .single();

    if (existing) {
      const { error } = await supabase
        .from('weekly_targets')
        .update({ hours })
        .eq('id', existing.id);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await supabase
        .from('weekly_targets')
        .insert({ set_by: user.id, subject_id: null, hours });
      if (error) throw new Error(error.message);
    }
  }

  revalidatePath('/parent');
  revalidatePath('/');
}
