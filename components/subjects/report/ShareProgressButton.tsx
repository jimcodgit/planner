'use client';

import { useState } from 'react';
import { getOrCreateShareToken, revokeShareToken } from '@/lib/actions/share';

export function ShareProgressButton() {
  const [loading, setLoading] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function handleShare() {
    setLoading(true);
    const { token, error } = await getOrCreateShareToken();
    setLoading(false);
    if (error || !token) return;
    const url = `${window.location.origin}/share/${token}`;
    setShareUrl(url);
  }

  async function handleCopy() {
    if (!shareUrl) return;
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleRevoke() {
    if (!confirm('Revoke this link? Anyone with it will no longer be able to view your progress.')) return;
    setLoading(true);
    await revokeShareToken();
    setLoading(false);
    setShareUrl(null);
  }

  if (shareUrl) {
    return (
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <input
            readOnly
            value={shareUrl}
            className="text-xs border border-gray-200 rounded px-2 py-1 flex-1 min-w-0 bg-gray-50"
          />
          <button
            onClick={handleCopy}
            className="text-xs px-2 py-1 rounded bg-indigo-600 text-white hover:bg-indigo-700"
          >
            {copied ? 'Copied!' : 'Copy'}
          </button>
          <button
            onClick={handleRevoke}
            className="text-xs px-2 py-1 rounded border border-gray-200 text-gray-500 hover:text-red-600"
          >
            Revoke
          </button>
        </div>
        <p className="text-xs text-gray-400">
          Anyone with this link can view your progress (read-only, no login needed).
        </p>
      </div>
    );
  }

  return (
    <button
      onClick={handleShare}
      disabled={loading}
      className="text-sm text-indigo-600 hover:text-indigo-800 disabled:opacity-50"
    >
      {loading ? 'Generating link…' : 'Share progress link'}
    </button>
  );
}
