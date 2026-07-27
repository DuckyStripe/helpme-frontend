'use client';

interface StatusDonutProps {
  statusCounts: Record<string, number>;
}

const SEGMENTS: Array<{ key: string; label: string; color: string; text: string }> = [
  { key: 'VIRGIN', label: 'Sin activar', color: '#6b7280', text: 'text-gray-500 dark:text-gray-400' },
  { key: 'INCOMPLETE', label: 'Incompleto', color: '#f59e0b', text: 'text-amber-600 dark:text-amber-400' },
  { key: 'ACTIVE', label: 'Activo', color: '#10b981', text: 'text-emerald-600 dark:text-emerald-400' },
  { key: 'SUSPENDED', label: 'Suspendido', color: '#dc2626', text: 'text-red-600 dark:text-red-400' },
];

const RADIUS = 60;
const STROKE = 22;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const GAP = 4;

export default function StatusDonut({ statusCounts }: StatusDonutProps) {
  const total = SEGMENTS.reduce((sum, s) => sum + (statusCounts[s.key] || 0), 0);
  if (total === 0) {
    return <div className="text-center text-gray-500 text-sm py-8">Sin tags registrados</div>;
  }

  let cumulative = 0;
  const arcs = SEGMENTS.map(s => {
    const count = statusCounts[s.key] || 0;
    const fraction = count / total;
    const arcLength = Math.max(fraction * CIRCUMFERENCE - GAP, 0);
    const offset = CIRCUMFERENCE - cumulative;
    cumulative += fraction * CIRCUMFERENCE;
    return { ...s, count, fraction, arcLength, offset };
  });

  return (
    <div className="flex items-center gap-6">
      <svg width={2 * (RADIUS + STROKE / 2)} height={2 * (RADIUS + STROKE / 2)} viewBox={`0 0 ${2 * (RADIUS + STROKE / 2)} ${2 * (RADIUS + STROKE / 2)}`}>
        <g transform={`translate(${RADIUS + STROKE / 2}, ${RADIUS + STROKE / 2}) rotate(-90)`}>
          {arcs.map(a => (
            <circle
              key={a.key}
              r={RADIUS}
              fill="none"
              stroke={a.color}
              strokeWidth={STROKE}
              strokeLinecap="round"
              strokeDasharray={`${a.arcLength} ${CIRCUMFERENCE - a.arcLength}`}
              strokeDashoffset={a.offset}
            />
          ))}
        </g>
        <text x="50%" y="47%" textAnchor="middle" className="fill-gray-900 dark:fill-gray-100" style={{ fontSize: 22, fontWeight: 700 }}>
          {total}
        </text>
        <text x="50%" y="60%" textAnchor="middle" className="fill-gray-500 dark:fill-gray-400" style={{ fontSize: 11 }}>
          tags
        </text>
      </svg>
      <div className="space-y-2 flex-1">
        {arcs.map(a => (
          <div key={a.key} className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: a.color }} />
              <span className="text-gray-600 dark:text-gray-400 truncate">{a.label}</span>
            </div>
            <span className={`font-medium ml-3 ${a.text}`}>{a.count} ({Math.round(a.fraction * 100)}%)</span>
          </div>
        ))}
      </div>
    </div>
  );
}
