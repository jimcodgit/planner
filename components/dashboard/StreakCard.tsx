import { Card, CardContent } from '@/components/ui/Card';

interface StreakCardProps {
  streak: number;
}

export function StreakCard({ streak }: StreakCardProps) {
  return (
    <Card>
      <CardContent className="text-center py-5">
        <div className="text-4xl mb-1">{streak > 0 ? '🔥' : '💤'}</div>
        <div className="text-3xl font-bold text-gray-900">{streak}</div>
        <div className="text-sm text-gray-500 mt-1">
          {streak === 1 ? 'day streak' : 'day streak'}
        </div>
        {streak === 0 && (
          <div className="text-xs text-gray-400 mt-1">Mark a session done to start</div>
        )}
      </CardContent>
    </Card>
  );
}
