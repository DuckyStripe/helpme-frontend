'use client';

import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  color?: 'red' | 'emerald' | 'amber' | 'blue' | 'gray';
  trend?: { value: number; label: string };
}

const colors = {
  red: { bg: 'bg-red-500/10', text: 'text-red-400', icon: 'text-red-400' },
  emerald: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', icon: 'text-emerald-400' },
  amber: { bg: 'bg-amber-500/10', text: 'text-amber-400', icon: 'text-amber-400' },
  blue: { bg: 'bg-blue-500/10', text: 'text-blue-400', icon: 'text-blue-400' },
  gray: { bg: 'bg-gray-500/10', text: 'text-gray-400', icon: 'text-gray-400' },
};

export default function StatCard({ label, value, icon: Icon, color = 'gray', trend }: StatCardProps) {
  const c = colors[color];
  return (
    <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-5 hover:border-gray-600/50 transition-colors">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-400 mb-1">{label}</p>
          <p className={`text-3xl font-bold ${c.text}`}>{value}</p>
          {trend && (
            <p className="text-xs text-gray-500 mt-2">
              <span className={trend.value >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                {trend.value >= 0 ? '+' : ''}{trend.value}%
              </span>
              {' '}{trend.label}
            </p>
          )}
        </div>
        <div className={`p-3 rounded-lg ${c.bg}`}>
          <Icon className={`w-5 h-5 ${c.icon}`} />
        </div>
      </div>
    </div>
  );
}
