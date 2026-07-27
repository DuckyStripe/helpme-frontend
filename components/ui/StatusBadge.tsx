'use client';

import type { TagStatus } from '@/types';

interface StatusBadgeProps {
  status: TagStatus;
  size?: 'sm' | 'md';
  isSent?: boolean;
}

const config: Record<TagStatus, { label: string; classes: string; dot: string }> = {
  VIRGIN: { label: 'Sin activar', classes: 'bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/20', dot: 'bg-gray-500' },
  INCOMPLETE: { label: 'Incompleto', classes: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20', dot: 'bg-amber-500' },
  ACTIVE: { label: 'Activo', classes: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20', dot: 'bg-emerald-500' },
  SUSPENDED: { label: 'Suspendido', classes: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20', dot: 'bg-red-500' },
};

export default function StatusBadge({ status, size = 'sm', isSent }: StatusBadgeProps) {
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm';

  if (status === 'VIRGIN' && isSent) {
    return (
      <span className={`inline-flex items-center gap-1.5 font-medium rounded-full border bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20 ${sizeClasses}`}>
        <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
        Enviado
      </span>
    );
  }

  const c = config[status];

  return (
    <span className={`inline-flex items-center gap-1.5 font-medium rounded-full border ${c.classes} ${sizeClasses}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {c.label}
    </span>
  );
}
