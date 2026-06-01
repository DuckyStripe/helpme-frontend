'use client';

interface ActivationChartProps {
  data: Array<{ date: string; count: number }>;
  period: '7d' | '30d' | '90d';
}

export default function ActivationChart({ data, period }: ActivationChartProps) {
  if (!data.length) return null;

  const maxCount = Math.max(...data.map(d => d.count), 1);
  const displayData = period === '7d' ? data : period === '30d' ? data.filter((_, i) => i % 2 === 0 || i === data.length - 1) : data.filter((_, i) => i % 5 === 0 || i === data.length - 1);

  return (
    <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-6">
      <h3 className="text-sm font-medium text-gray-400 mb-6">Activaciones por día</h3>
      <div className="flex items-end gap-1 h-40">
        {displayData.map((d, i) => {
          const height = (d.count / maxCount) * 100;
          const date = new Date(d.date);
          const label = period === '7d'
            ? date.toLocaleDateString('es-MX', { weekday: 'short' })
            : date.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' });

          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
              <div className="relative w-full flex justify-center">
                <div
                  className="w-full max-w-[24px] bg-red-500/20 rounded-t-sm group-hover:bg-red-500/40 transition-colors"
                  style={{ height: `${Math.max(height, 4)}%` }}
                />
                {d.count > 0 && (
                  <div className="absolute -top-6 opacity-0 group-hover:opacity-100 transition-opacity text-xs text-gray-300 whitespace-nowrap bg-gray-700 px-2 py-0.5 rounded">
                    {d.count}
                  </div>
                )}
              </div>
              <span className="text-[10px] text-gray-600 truncate w-full text-center">{label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
