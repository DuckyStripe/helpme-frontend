export type ToastType = 'success' | 'error' | 'info';

export interface ToastItem {
  id: number;
  message: string;
  type: ToastType;
}

type Listener = (toasts: ToastItem[]) => void;

let toasts: ToastItem[] = [];
let listeners: Listener[] = [];
let nextId = 0;

function notify() {
  listeners.forEach((l) => l([...toasts]));
}

export function toast(message: string, type: ToastType = 'info') {
  const id = nextId++;
  toasts = [...toasts, { id, message, type }];
  notify();
  setTimeout(() => {
    toasts = toasts.filter((t) => t.id !== id);
    notify();
  }, 3500);
}

toast.success = (message: string) => toast(message, 'success');
toast.error = (message: string) => toast(message, 'error');
toast.info = (message: string) => toast(message, 'info');

export function subscribeToasts(listener: Listener) {
  listeners = [...listeners, listener];
  return () => {
    listeners = listeners.filter((l) => l !== listener);
  };
}

export function getToasts() {
  return toasts;
}
