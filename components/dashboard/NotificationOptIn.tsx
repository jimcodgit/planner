'use client';

import { useState, useEffect } from 'react';

export function NotificationOptIn() {
  const [status, setStatus] = useState<'unknown' | 'unsupported' | 'denied' | 'granted' | 'default'>('unknown');
  const [subscribing, setSubscribing] = useState(false);

  useEffect(() => {
    if (!('Notification' in window) || !('serviceWorker' in navigator)) {
      setStatus('unsupported');
    } else {
      setStatus(Notification.permission as typeof status);
    }
  }, []);

  if (status === 'unsupported' || status === 'granted' || status === 'unknown') return null;
  if (status === 'denied') {
    return (
      <p className="text-xs text-gray-400">
        Notifications blocked. Enable them in browser settings to get daily revision reminders.
      </p>
    );
  }

  async function handleEnable() {
    setSubscribing(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        setStatus('granted');
        // Subscribe to push (requires VAPID_PUBLIC_KEY in env)
        const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
        if (!vapidKey) return;

        const reg = await navigator.serviceWorker.ready;
        const sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidKey),
        });

        await fetch('/api/notifications/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(sub.toJSON()),
        });
      } else {
        setStatus(permission as typeof status);
      }
    } catch {
      // ignore — push subscribe failed (VAPID not set up)
      setStatus('granted');
    } finally {
      setSubscribing(false);
    }
  }

  return (
    <div className="flex items-center justify-between gap-3 bg-indigo-50 border border-indigo-100 rounded-lg px-3 py-2">
      <p className="text-sm text-indigo-800">Get daily revision reminders</p>
      <button
        onClick={handleEnable}
        disabled={subscribing}
        className="text-xs font-medium text-indigo-700 border border-indigo-300 rounded px-2 py-1 hover:bg-indigo-100 disabled:opacity-50 whitespace-nowrap"
      >
        {subscribing ? 'Enabling…' : 'Enable'}
      </button>
    </div>
  );
}

function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray.buffer as ArrayBuffer;
}
