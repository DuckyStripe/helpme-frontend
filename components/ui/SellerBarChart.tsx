'use client';

interface SellerBarChartProps {
  sellers: Array<{ id: string; name: string; active: number; tagCount: number }>;
}

export default function SellerBarChart({ sellers }: SellerBarChartProps) {
  const top = [...sellers].sort((a, b) => b.tagCount - a.tagCount).slice(0, 6);
  if (!top.length) {
    return <div className="text-center text-gray-500 text-sm py-8">Sin datos de vendedores</div>;
  }

  const maxCount = Math.max(...top.map(s => s.tagCount), 1);

  return (
    <div className="space-y-4">
      {top.map(s => {
        const activePct = (s.active / maxCount) * 100;
        const restPct = ((s.tagCount - s.active) / maxCount) * 100;
        return (
          <div key={s.id}>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-gray-700 dark:text-gray-300 truncate">{s.name}</span>
              <span className="text-gray-500 dark:text-gray-400 shrink-0 ml-2">{s.active}/{s.tagCount}</span>
            </div>
            <div className="h-3 flex gap-0.5">
              <div
                className="bg-emerald-500 rounded-sm"
                style={{ width: `${activePct}%` }}
                title={`${s.active} activos`}
              />
              <div
                className="bg-gray-300 dark:bg-gray-600 rounded-sm"
                style={{ width: `${restPct}%` }}
                title={`${s.tagCount - s.active} sin activar`}
              />
            </div>
          </div>
        );
      })}
      <div className="flex items-center gap-4 pt-2 text-xs text-gray-500 dark:text-gray-400">
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Activos</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-gray-300 dark:bg-gray-600" /> Resto</span>
      </div>
    </div>
  );
}
