'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import QRCode from 'qrcode';
import { authApi, settingsApi, type WhatsappStatus } from '@/lib/api';
import { toast } from '@/lib/toast';
import type { User } from '@/types';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { PageLoader } from '@/components/ui/Skeleton';
import { MessageCircle, Loader2, CheckCircle2, LogOut, QrCode } from 'lucide-react';

const POLL_INTERVAL_MS = 3000;

const STATUS_LABEL: Record<WhatsappStatus, string> = {
  starting: 'Iniciando…',
  qr: 'Esperando escaneo del QR',
  authenticated: 'Autenticado, sincronizando…',
  ready: 'Conectado',
  disconnected: 'Desconectado',
};

export default function SettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const [status, setStatus] = useState<WhatsappStatus>('starting');
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);
  const pollTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const pollStatus = useCallback(async () => {
    try {
      const data = await settingsApi.getWhatsappStatus();
      setStatus(data.status);

      if (data.status === 'qr' && data.hasQr) {
        try {
          const { qr } = await settingsApi.getWhatsappQr();
          const dataUrl = await QRCode.toDataURL(qr, { width: 280, margin: 1 });
          setQrDataUrl(dataUrl);
        } catch {
          // El QR pudo haber rotado entre el status check y este fetch; se reintenta en el próximo poll.
        }
      } else {
        setQrDataUrl(null);
      }
    } catch (err: any) {
      toast.error(err.message || 'No se pudo obtener el estado de WhatsApp');
    } finally {
      pollTimer.current = setTimeout(pollStatus, POLL_INTERVAL_MS);
    }
  }, []);

  useEffect(() => {
    checkAuth();
    return () => {
      if (pollTimer.current) clearTimeout(pollTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function checkAuth() {
    try {
      const meData = await authApi.me();
      if (meData.user.role !== 'ADMIN') {
        router.push('/dashboard');
        return;
      }
      setUser(meData.user);
      setLoading(false);
      pollStatus();
    } catch {
      router.push('/login');
    }
  }

  async function handleLogout() {
    if (!confirm('¿Cerrar la sesión de WhatsApp? Habrá que escanear un nuevo QR para volver a vincularla.')) return;
    setLoggingOut(true);
    try {
      await settingsApi.logoutWhatsapp();
      toast.success('Sesión de WhatsApp cerrada');
      setQrDataUrl(null);
    } catch (err: any) {
      toast.error(err.message || 'No se pudo cerrar la sesión');
    } finally {
      setLoggingOut(false);
    }
  }

  if (loading && !user) return <PageLoader />;
  if (!user) return null;

  return (
    <DashboardLayout user={user}>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Configuración</h1>
        <p className="text-sm text-gray-500 mt-1">
          Ajustes de infraestructura que no requieren un redeploy
        </p>
      </div>

      <div className="bg-gray-50 dark:bg-gray-800/30 border border-gray-200 dark:border-gray-700/50 rounded-xl p-6 max-w-2xl">
        <div className="flex items-start gap-3 mb-6">
          <div className="w-10 h-10 bg-green-600/10 rounded-lg flex items-center justify-center flex-shrink-0">
            <MessageCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">Sesión de WhatsApp</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              El backend envía las alertas de emergencia usando esta sesión de WhatsApp Web. La
              sesión vive en el propio servidor y sobrevive a reinicios; solo hace falta re-escanear
              el QR si se cierra sesión desde el teléfono o desde aquí.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 mb-4">
          <span
            className={`w-2.5 h-2.5 rounded-full ${
              status === 'ready'
                ? 'bg-green-500'
                : status === 'qr'
                  ? 'bg-amber-500'
                  : status === 'disconnected'
                    ? 'bg-red-500'
                    : 'bg-gray-400'
            }`}
          />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{STATUS_LABEL[status]}</span>
        </div>

        {status === 'ready' && (
          <div className="flex flex-col items-start gap-4">
            <div className="flex items-center gap-2 text-sm text-green-700 dark:text-green-400 bg-green-600/10 border border-green-600/30 rounded-lg px-3 py-2">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>WhatsApp conectado y listo para enviar alertas.</span>
            </div>
            <button
              onClick={handleLogout}
              disabled={loggingOut}
              className="flex items-center gap-2 px-4 py-2.5 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
            >
              {loggingOut ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />}
              Cerrar sesión
            </button>
          </div>
        )}

        {status !== 'ready' && (
          <div className="flex flex-col items-center gap-4 py-4">
            {qrDataUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={qrDataUrl} alt="QR de WhatsApp" width={280} height={280} className="rounded-lg border border-gray-200 dark:border-gray-700" />
            ) : (
              <div className="w-[280px] h-[280px] flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-gray-300 dark:border-gray-700 text-gray-400">
                {status === 'starting' || status === 'authenticated' ? (
                  <Loader2 className="w-8 h-8 animate-spin" />
                ) : (
                  <QrCode className="w-8 h-8" />
                )}
                <span className="text-xs">{STATUS_LABEL[status]}</span>
              </div>
            )}
            <p className="text-xs text-gray-500 text-center max-w-sm">
              Abre WhatsApp en el teléfono que enviará las alertas → Dispositivos vinculados → Vincular
              un dispositivo, y escanea este código.
            </p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
