const MILESTONES = [
  { pct: 0,   label: 'Getting started' },
  { pct: 25,  label: 'Halfway there' },
  { pct: 50,  label: 'Good progress' },
  { pct: 75,  label: 'Nearly there' },
  { pct: 100, label: 'Exam ready' },
];

interface WallMilestoneStripProps {
  totalTopics: number;
  confidentTopics: number;
  subjectCount: number;
}

export function WallMilestoneStrip({ totalTopics, confidentTopics, subjectCount }: WallMilestoneStripProps) {
  const overallPct = totalTopics > 0 ? Math.round((confidentTopics / totalTopics) * 100) : 0;

  return (
    <div>
      {/* Bar */}
      <div className="relative w-full" style={{ height: '32px' }}>
        {/* Track */}
        <div className="absolute left-0 right-0 bg-gray-100 rounded-full" style={{ top: '10px', height: '8px' }} />
        {/* Fill */}
        <div
          className="absolute bg-indigo-500 rounded-full"
          style={{ top: '10px', height: '8px', width: `${overallPct}%`, transition: 'width 0.3s' }}
        />
        {/* Milestone markers */}
        {MILESTONES.map(({ pct, label }) => (
          <div key={pct} className="absolute" style={{ left: `${pct}%`, top: 0 }}>
            <div
              className="absolute w-px bg-gray-300"
              style={{ top: '8px', height: '16px', transform: 'translateX(-50%)' }}
            />
            <span
              className="absolute text-gray-400 whitespace-nowrap"
              style={{
                fontSize: '8px',
                top: '24px',
                transform: 'translateX(-50%)',
                textAlign: 'center',
              }}
            >
              {pct}% {label}
            </span>
          </div>
        ))}
        {/* "You are here" marker */}
        <div
          className="absolute"
          style={{ left: `${overallPct}%`, top: 0, transform: 'translateX(-50%)' }}
        >
          {/* Triangle */}
          <div
            style={{
              width: 0,
              height: 0,
              borderLeft: '5px solid transparent',
              borderRight: '5px solid transparent',
              borderBottom: '8px solid #6366f1',
              marginTop: '2px',
            }}
          />
        </div>
      </div>

      {/* Summary */}
      <p className="text-center text-gray-500 mt-6" style={{ fontSize: '9px' }}>
        <span className="font-semibold text-indigo-600">{confidentTopics}</span> of{' '}
        <span className="font-semibold">{totalTopics}</span> topics confident across{' '}
        <span className="font-semibold">{subjectCount}</span> subjects —{' '}
        <span className="font-semibold text-indigo-600">{overallPct}%</span> overall
      </p>
    </div>
  );
}
