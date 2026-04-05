'use server';

import { createClient } from '@/lib/supabase/server';
import type { ShareToken } from '@/types/database';

export async function getOrCreateShareToken(): Promise<{ token?: string; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  // Check existing
  const { data: existing } = await supabase
    .from('share_tokens')
    .select('token')
    .eq('user_id', user.id)
    .single();

  if (existing) return { token: existing.token };

  // Create new
  const { data: created, error } = await supabase
    .from('share_tokens')
    .insert({ user_id: user.id })
    .select('token')
    .single();

  if (error) return { error: error.message };
  return { token: (created as ShareToken).token };
}

export async function revokeShareToken(): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  const { error } = await supabase
    .from('share_tokens')
    .delete()
    .eq('user_id', user.id);

  if (error) return { error: error.message };
  return {};
}
