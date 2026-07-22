'use client';

import { UserMinus, Ban, Play, X } from 'lucide-react';

interface BulkActionsBarProps {
  selectedCount: number;
  onAssign: () => void;
  onSuspend: () => void;
  onResume: () => void;
  onClear: () => void;
  sellers?: Array<{ id: string; name: string }>;
}

export default function BulkActionsBar({ selectedCount, onAssign, onSuspend, onResume, onClear }: BulkActionsBarProps) {
  if (selectedCount === 0) return null;

  return (
    <div className="bg-red-600/10 border border-red-500/20 rounded-xl px-6 py-3 flex items-center justify-between">
      <span className="text-sm text-red-300">
        <span className="font-semibold">{selectedCount}</span> tag{selectedCount > 1 ? 's' : ''} seleccionado{selectedCount > 1 ? 's' : ''}
      </span>
      <div className="flex items-center gap-2">
        <button
          onClick={onAssign}
          className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-amber-300 hover:bg-amber-500/10 rounded-lg transition-colors"
        >
          <UserMinus className="w-4 h-4" />
          Asignar vendedor
        </button>
        <button
          onClick={onSuspend}
          className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
        >
          <Ban className="w-4 h-4" />
          Suspender
        </button>
        <button
          onClick={onResume}
          className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-emerald-300 hover:bg-emerald-500/10 rounded-lg transition-colors"
        >
          <Play className="w-4 h-4" />
          Reanudar
        </button>
        <button
          onClick={onClear}
          className="p-1.5 text-gray-500 hover:text-gray-300 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
