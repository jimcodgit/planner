'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

type State = 'loading' | 'ready' | 'error';

export function ResetPasswordForm() {
  const [state, setState] = useState<State>('loading');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const supabase = createClient();
  const ready = useRef(false);

  useEffect(() => {
    // Listen for PASSWORD_RECOVERY — fires automatically when Supabase
    // detects the recovery token in the URL (works for both implicit
    // hash-based tokens and PKCE code exchange on same device)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        ready.current = true;
        setState('ready');
      }
    });

    // Also check for an existing recovery session (e.g. page refresh)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session && !ready.current) {
        ready.current = true;
        setState('ready');
      }
    });

    // After 6 seconds with no recovery event, show an error
    const timeout = setTimeout(() => {
      if (!ready.current) {
        setState('error');
      }
    }, 6000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
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

  if (state === 'loading') {
    return (
      <div className="text-center py-6 text-sm text-gray-500">
        Verifying reset link…
      </div>
    );
  }

  if (state === 'error') {
    return (
      <div className="space-y-4 text-center">
        <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
          This reset link has expired or already been used.
        </p>
        <a href="/forgot-password" className="text-sm text-indigo-600 hover:underline block">
          Request a new reset link
        </a>
      </div>
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
