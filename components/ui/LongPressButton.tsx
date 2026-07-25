'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';

interface LongPressButtonProps {
  duration?: number;
  onLongPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  label?: string;
  countdownLabel?: string;
  className?: string;
}

export default function LongPressButton({
  duration = 3000,
  onLongPress,
  disabled = false,
  loading = false,
  label = 'Mantener presionado para alertar',
  countdownLabel = 'Enviando alerta...',
  className = '',
}: LongPressButtonProps) {
  const [isPressed, setIsPressed] = useState(false);
  const [progress, setProgress] = useState(0);
  const [countdown, setCountdown] = useState(Math.ceil(duration / 1000));
  const [completed, setCompleted] = useState(false);
  const timerRef = useRef<number | null>(null);
  const intervalRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);

  const cleanup = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  const startPress = useCallback(() => {
    if (disabled || loading || completed) return;
    if (timerRef.current || intervalRef.current) return;

    setIsPressed(true);
    setProgress(0);
    setCountdown(Math.ceil(duration / 1000));
    startTimeRef.current = Date.now();

    if (navigator.vibrate) {
      navigator.vibrate(50);
    }

    intervalRef.current = window.setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      const pct = Math.min(100, (elapsed / duration) * 100);
      setProgress(pct);
      const secsLeft = Math.max(0, Math.ceil((duration - elapsed) / 1000));
      setCountdown(secsLeft);
    }, 50);

    timerRef.current = window.setTimeout(() => {
      cleanup();
      setCompleted(true);
      if (navigator.vibrate) {
        navigator.vibrate([100, 50, 100]);
      }
      onLongPress();
    }, duration);
  }, [disabled, loading, completed, duration, onLongPress, cleanup]);

  const cancelPress = useCallback(() => {
    cleanup();
    setIsPressed(false);
    setProgress(0);
    setCountdown(Math.ceil(duration / 1000));
  }, [cleanup, duration]);

  const resetCompleted = useCallback(() => {
    setCompleted(false);
    setProgress(0);
    setCountdown(Math.ceil(duration / 1000));
  }, [duration]);

  useEffect(() => {
    if (!loading && completed) {
      const timeout = setTimeout(resetCompleted, 2000);
      return () => clearTimeout(timeout);
    }
  }, [loading, completed, resetCompleted]);

  const circumference = 2 * Math.PI * 46;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <button
      type="button"
      disabled={disabled || loading}
      style={{ touchAction: 'none' }}
      onPointerDown={(e) => {
        e.preventDefault();
        startPress();
      }}
      onPointerUp={cancelPress}
      onPointerLeave={cancelPress}
      onPointerCancel={cancelPress}
      className={`relative w-full flex items-center justify-center gap-3 font-bold py-4 px-5 rounded-2xl shadow-lg active:scale-95 transition-all select-none ${
        completed
          ? 'bg-green-600 text-white shadow-green-600/30'
          : disabled || loading
          ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
          : 'bg-red-600 hover:bg-red-700 text-white shadow-red-600/30'
      } ${className}`}
    >
      <svg
        className="absolute left-5 w-10 h-10 -rotate-90"
        viewBox="0 0 100 100"
      >
        <circle
          cx="50"
          cy="50"
          r="46"
          fill="none"
          stroke="rgba(255,255,255,0.2)"
          strokeWidth="4"
        />
        <circle
          cx="50"
          cy="50"
          r="46"
          fill="none"
          stroke="white"
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className="transition-none"
        />
      </svg>

      {loading ? (
        <Loader2 className="w-6 h-6 animate-spin relative z-10" />
      ) : completed ? (
        <CheckCircle className="w-6 h-6 relative z-10" />
      ) : isPressed ? (
        <span className="text-2xl font-black relative z-10">{countdown}</span>
      ) : (
        <AlertTriangle className="w-6 h-6 relative z-10" />
      )}

      <div className="text-left relative z-10">
        <p className="text-sm font-bold">
          {completed ? 'Alerta enviada' : loading ? 'Enviando...' : isPressed ? countdownLabel : label}
        </p>
        {!completed && !isPressed && !loading && (
          <p className="text-xs font-normal opacity-90">3 segundos para confirmar</p>
        )}
      </div>
    </button>
  );
}
