import type { Timeline } from '@/lib/logic/timeline';

interface WallTimelineProps {
  timeline: Timeline;
}

export function WallTimeline({ timeline }: WallTimelineProps) {
  const { totalDays, weeks, examMarkers, revisionWindows } = timeline;

  function pct(days: number) {
    return `${Math.min(100, Math.max(0, (days / (totalDays - 1)) * 100)).toFixed(2)}%`;
  }

  return (
    <div className="mb-1">
      {/* Timeline container */}
      <div className="relative w-full" style={{ height: '80px' }}>
        {/* Base track */}
        <div className="absolute left-0 right-0 bg-gray-200 rounded" style={{ top: '38px', height: '4px' }} />

        {/* Revision windows */}
        {revisionWindows.map((w, i) => {
          const left = pct(w.windowStartDays);
          const right = pct(w.examDays);
          const width = `${Math.max(0, ((w.examDays - w.windowStartDays) / (totalDays - 1)) * 100).toFixed(2)}%`;
          return (
            <div
              key={i}
              className="absolute rounded"
              style={{
                left,
                width,
                top: '30px',
                height: '20px',
                backgroundColor: w.color,
                opacity: 0.15,
              }}
            />
          );
        })}

        {/* Week lines */}
        {weeks.map((week) => (
          <div key={week.startDate} style={{ position: 'absolute', left: pct(week.daysFromStart), top: 0, bottom: 0 }}>
            <div className="absolute w-px bg-gray-200" style={{ top: '32px', height: '16px' }} />
            <span
              className="absolute text-gray-400 whitespace-nowrap"
              style={{ fontSize: '8px', top: '52px', transform: 'translateX(-50%)' }}
            >
              {week.label}
            </span>
          </div>
        ))}

        {/* Today line */}
        <div className="absolute" style={{ left: '0%', top: 0, bottom: 0 }}>
          <div className="absolute w-0.5 bg-gray-800" style={{ top: '24px', height: '28px' }} />
          <span className="absolute text-gray-700 font-semibold whitespace-nowrap" style={{ fontSize: '8px', top: '14px', transform: 'translateX(-50%)' }}>
            Today
          </span>
        </div>

        {/* Exam markers */}
        {examMarkers.map((marker, i) => (
          <div key={i} className="absolute" style={{ left: pct(marker.daysFromStart), top: 0, bottom: 0 }}>
            {/* Vertical bar */}
            <div
              className="absolute w-0.5"
              style={{ backgroundColor: marker.color, top: '26px', height: '24px' }}
            />
            {/* Diamond */}
            <div
              className="absolute w-2 h-2 rotate-45"
              style={{ backgroundColor: marker.color, top: '34px', transform: 'translateX(-50%) rotate(45deg)' }}
            />
            {/* Label */}
            <div
              className="absolute whitespace-nowrap"
              style={{
                fontSize: '8px',
                fontWeight: 600,
                color: marker.color,
                top: marker.stackAbove ? '4px' : '58px',
                transform: 'translateX(-50%)',
                maxWidth: '60px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                textAlign: 'center',
              }}
            >
              {marker.subjectName.split(' ')[0]}
            </div>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-1" style={{ fontSize: '8px', color: '#9ca3af' }}>
        <span className="flex items-center gap-1">
          <span className="inline-block w-3 h-1.5 rounded opacity-30 bg-indigo-500" />
          Revision window (21 days pre-exam)
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-0.5 h-3 bg-gray-800" />
          Today
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-2 h-2 rotate-45 bg-gray-500" style={{ transform: 'rotate(45deg)' }} />
          Exam date
        </span>
      </div>
    </div>
  );
}
