'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { setWeeklyTarget } from '@/lib/actions/sessions';

interface WeeklyTargetSetterProps {
  currentTarget: number;
}

export function WeeklyTargetSetter({ currentTarget }: WeeklyTargetSetterProps) {
  const [hours, setHours] = useState(currentTarget);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    try {
      await setWeeklyTarget(null, hours);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <h3 className="font-semibold text-gray-900">Weekly target</h3>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <label className="text-sm text-gray-600 mb-1 block">
              Total hours per week: <strong>{hours}h</strong>
            </label>
            <input
              type="range"
              min="1"
              max="40"
              step="0.5"
              value={hours}
              onChange={(e) => setHours(Number(e.target.value))}
              className="w-full accent-indigo-600"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>1h</span>
              <span>40h</span>
            </div>
          </div>
          <Button onClick={handleSave} disabled={saving} size="sm">
            {saving ? '…' : saved ? '✓ Saved' : 'Save'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
