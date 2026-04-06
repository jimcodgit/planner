import { Card, CardContent } from '@/components/ui/Card';

interface StreakCardProps {
  streak: number;
}

export function StreakCard({ streak }: StreakCardProps) {
  const message =
    streak === 0 ? 'Mark a session done to start' :
    streak < 3  ? 'Good start — keep it up' :
    streak < 7  ? 'Building momentum' :
    streak < 14 ? 'One week strong!' :
    'Unstoppable!';

  return (
    <Card>
      <CardContent className="py-4 flex items-center gap-4">
        <div
          className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0 ${
            streak > 0 ? 'bg-orange-100' : 'bg-gray-100'
          }`}
        >
          {streak > 0 ? '🔥' : '💤'}
        </div>
        <div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl font-bold text-gray-900 leading-none">{streak}</span>
            <span className="text-sm text-gray-500 font-medium">
              {streak === 1 ? 'day' : 'days'}
            </span>
          </div>
          <p className="text-xs text-gray-400 mt-0.5">{message}</p>
        </div>
      </CardContent>
    </Card>
  );
}
