'use client';

import { useEffect, useState } from 'react';
import { CheckCircle, XCircle, Info } from 'lucide-react';
import { subscribeToasts, getToasts, type ToastItem } from '@/lib/toast';

const icons = {
  success: <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />,
  error: <XCircle className="w-5 h-5 text-red-500 shrink-0" />,
  info: <Info className="w-5 h-5 text-blue-500 shrink-0" />,
};

const borders = {
  success: 'border-l-emerald-500',
  error: 'border-l-red-500',
  info: 'border-l-blue-500',
};

export default function ToastContainer() {
  const [toasts, setToasts] = useState<ToastItem[]>(getToasts);

  useEffect(() => subscribeToasts(setToasts), []);

  if (toasts.length === 0) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-2 w-full max-w-sm"
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`flex items-center gap-3 bg-white rounded-xl shadow-lg border border-gray-100 border-l-4 ${borders[t.type]} px-4 py-3 animate-slide-in`}
        >
          {icons[t.type]}
          <p className="text-sm font-medium text-gray-800 flex-1">{t.message}</p>
        </div>
      ))}
    </div>
  );
}
