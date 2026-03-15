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

export async function createSession(data: SessionFormData): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

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
  if (error) return { error: error.message };
  revalidatePath('/weekly');
  revalidatePath('/daily');
  revalidatePath('/subjects');
  revalidatePath('/exams');
  revalidatePath('/');
  return {};
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
  revalidatePath('/subjects');
  revalidatePath('/exams');
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
  revalidatePath('/subjects');
  revalidatePath('/exams');
}

export async function updateSession(id: string, data: Partial<SessionFormData>): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase.from('revision_sessions').update(data).eq('id', id);
  if (error) return { error: error.message };
  revalidatePath('/weekly');
  revalidatePath('/daily');
  revalidatePath('/subjects');
  revalidatePath('/exams');
  revalidatePath('/');
  return {};
}

export async function deleteSession(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from('revision_sessions').delete().eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/weekly');
  revalidatePath('/daily');
  revalidatePath('/subjects');
  revalidatePath('/exams');
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

export async function copyPreviousWeek(targetWeekStart: string): Promise<number> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // Source week = 7 days before target week start
  const targetDate = new Date(targetWeekStart);
  const sourceDate = new Date(targetDate);
  sourceDate.setDate(sourceDate.getDate() - 7);

  const sourceStart = sourceDate.toISOString().slice(0, 10);
  const sourceEnd = new Date(sourceDate.getTime() + 6 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);
  const targetEnd = new Date(targetDate.getTime() + 6 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);

  // Fetch source week sessions (exclude Skipped)
  const { data: sourceSessions, error: fetchError } = await supabase
    .from('revision_sessions')
    .select('*')
    .eq('user_id', user.id)
    .gte('date', sourceStart)
    .lte('date', sourceEnd)
    .neq('status', 'Skipped');

  if (fetchError) throw new Error(fetchError.message);
  if (!sourceSessions || sourceSessions.length === 0) return 0;

  // Fetch existing sessions in target week to avoid duplicates
  const { data: existingSessions } = await supabase
    .from('revision_sessions')
    .select('date, start_time, subject_id')
    .eq('user_id', user.id)
    .gte('date', targetWeekStart)
    .lte('date', targetEnd);

  const existingKeys = new Set(
    (existingSessions ?? []).map((s) => `${s.date}-${s.subject_id}-${s.start_time}`)
  );

  // Map each source session to the same day of the following week
  const newSessions = sourceSessions
    .map((s) => {
      const sourceSessionDate = new Date(s.date);
      const newDate = new Date(sourceSessionDate.getTime() + 7 * 24 * 60 * 60 * 1000)
        .toISOString()
        .slice(0, 10);

      const key = `${newDate}-${s.subject_id}-${s.start_time}`;
      if (existingKeys.has(key)) return null;

      return {
        user_id: user.id,
        subject_id: s.subject_id,
        topic_id: s.topic_id,
        date: newDate,
        start_time: s.start_time,
        duration_minutes: s.duration_minutes,
        type: s.type,
        status: 'Planned' as SessionStatus,
        skipped_count: 0,
        notes: s.notes,
      };
    })
    .filter(Boolean);

  if (newSessions.length === 0) return 0;

  const { error: insertError } = await supabase
    .from('revision_sessions')
    .insert(newSessions);

  if (insertError) throw new Error(insertError.message);

  revalidatePath('/weekly');
  revalidatePath('/subjects');
  revalidatePath('/exams');
  revalidatePath('/');
  return newSessions.length;
}
