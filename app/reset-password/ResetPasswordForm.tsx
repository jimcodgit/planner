'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

export function ResetPasswordForm() {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);
  const [initError, setInitError] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  useEffect(() => {
    const code = searchParams.get('code');

    if (code) {
      // PKCE flow — exchange the code for a live session
      supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
        if (error) {
          setInitError('This reset link has expired or already been used. Please request a new one.');
        } else {
          setSessionReady(true);
        }
      });
    } else {
      // Implicit / token-hash flow — session already set, check it exists
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) {
          setSessionReady(true);
        } else {
          setInitError('No valid session found. Please request a new reset link.');
        }
      });
    }
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (password !== confirm) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    router.push('/');
    router.refresh();
  }

  if (initError) {
    return (
      <div className="space-y-4 text-center">
        <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{initError}</p>
        <a href="/forgot-password" className="text-sm text-indigo-600 hover:underline block">
          Request a new reset link
        </a>
      </div>
    );
  }

  if (!sessionReady) {
    return (
      <div className="text-center text-sm text-gray-500 py-4">Verifying reset link…</div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        id="password"
        label="New password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="At least 8 characters"
        required
        autoComplete="new-password"
      />
      <Input
        id="confirm"
        label="Confirm password"
        type="password"
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
        placeholder="Repeat your password"
        required
        autoComplete="new-password"
      />
      {error && (
        <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
      )}
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? 'Saving…' : 'Set new password'}
      </Button>
    </form>
  );
}
