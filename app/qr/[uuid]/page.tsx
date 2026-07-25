'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { tagsApi, scanApi } from '@/lib/api';
import LocationPickerModal from '@/components/LocationPickerModal';
import LongPressButton from '@/components/ui/LongPressButton';
import {
  Shield, AlertTriangle, Loader2, AlertCircle, CheckCircle,
  MapPin, RefreshCw,
} from 'lucide-react';

const DEFAULT_MAP_CENTER = { lat: 19.4326, lng: -99.1332 };

interface QrViewerData {
  uuid: string;
  status: string;
  ownerName?: string;
  hasContacts: boolean;
  contactCount: number;
}

interface AlertFeedback {
  type: 'success' | 'error';
  message: string;
}

export default function QrViewerPage() {
  const params = useParams();
  const uuid = params.uuid as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [data, setData] = useState<QrViewerData | null>(null);
  const [alertSending, setAlertSending] = useState(false);
  const [locationPicker, setLocationPicker] = useState<{
    lat: number;
    lng: number;
    approximate: boolean;
  } | null>(null);
  const [alertFeedback, setAlertFeedback] = useState<AlertFeedback | null>(null);
  const [rescuerName, setRescuerName] = useState('');
  const [rescuerPhone, setRescuerPhone] = useState('');
  const [rescuerComment, setRescuerComment] = useState('');
  const [showRescuerInfo, setShowRescuerInfo] = useState(false);

  useEffect(() => {
    if (!alertFeedback) return;
    const timeout = setTimeout(() => setAlertFeedback(null), 5000);
    return () => clearTimeout(timeout);
  }, [alertFeedback]);

  useEffect(() => {
    loadQrViewer();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uuid]);

  async function loadQrViewer() {
    try {
      const response = await tagsApi.getQrViewer(uuid);
      setData(response);
      triggerScanRegistration();
    } catch (err: any) {
      if (err.message?.includes('suspended')) {
        setError('suspended');
      } else {
        setError(err.message || 'Tag no encontrado');
      }
    } finally {
      setLoading(false);
    }
  }

  function triggerScanRegistration() {
    const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : undefined;
    scanApi.registerQrScan(uuid, { userAgent });
  }

  async function detectPosition(): Promise<{ lat: number; lng: number; approximate: boolean; error?: string }> {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      return { ...DEFAULT_MAP_CENTER, approximate: true, error: 'Geolocalización no disponible' };
    }

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (position) => resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          approximate: false,
        }),
        async (error) => {
          if (error.code === error.TIMEOUT || error.code === error.POSITION_UNAVAILABLE) {
            navigator.geolocation.getCurrentPosition(
              (position) => resolve({
                lat: position.coords.latitude,
                lng: position.coords.longitude,
                approximate: true,
              }),
              () => resolve({
                ...DEFAULT_MAP_CENTER,
                approximate: true,
                error: error.code === error.PERMISSION_DENIED
                  ? 'Permiso de ubicación denegado'
                  : 'No se pudo obtener ubicación',
              }),
              { enableHighAccuracy: false, timeout: 15000, maximumAge: 60000 },
            );
          } else {
            resolve({
              ...DEFAULT_MAP_CENTER,
              approximate: true,
              error: error.code === error.PERMISSION_DENIED
                ? 'Permiso de ubicación denegado'
                : 'No se pudo obtener ubicación',
            });
          }
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
      );
    });
  }

  async function handleLongPress() {
    setShowRescuerInfo(true);
  }

  async function handleRescuerInfoConfirm() {
    setShowRescuerInfo(false);
    const pos = await detectPosition();
    if (pos.error) {
      console.warn('Location detection:', pos.error);
    }
    setLocationPicker({ lat: pos.lat, lng: pos.lng, approximate: pos.approximate });
  }

  async function handleLocationConfirm(location: { lat: number; lng: number; address: string }) {
    if (!locationPicker) return;

    const rescuerPhoneDigits = rescuerPhone.replace(/\D/g, '');
    const rescuerPhoneFormatted = rescuerPhoneDigits.length > 0 ? rescuerPhone : undefined;
    const rescuerCommentText = rescuerComment.trim().length > 0 ? rescuerComment.trim() : undefined;

    setAlertSending(true);
    try {
      const result = await tagsApi.sendQrAlert(uuid, location, rescuerPhoneFormatted, rescuerCommentText);
      setLocationPicker(null);
      setRescuerName('');
      setRescuerPhone('');
      setRescuerComment('');

      const succeeded = result.results.filter((r) => r.success);
      const failed = result.results.filter((r) => !r.success);

      let message: string;
      if (failed.length === 0) {
        message = `Verificación enviada a ${succeeded.map((r) => r.contactName).join(', ')}`;
      } else if (succeeded.length === 0) {
        message = `No se pudo enviar a ningún contacto (${failed.map((r) => r.contactName).join(', ')})`;
      } else {
        message = `Enviada a ${succeeded.map((r) => r.contactName).join(', ')}. No se pudo avisar a ${failed.map((r) => r.contactName).join(', ')}.`;
      }

      setAlertFeedback({ type: succeeded.length > 0 ? 'success' : 'error', message });
    } catch (err: any) {
      setAlertFeedback({ type: 'error', message: err.message || 'Error al enviar la alerta' });
    } finally {
      setAlertSending(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-red-600" />
      </div>
    );
  }

  if (error === 'suspended') {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl p-8 text-center max-w-sm">
          <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-gray-500" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Tag Inactivo</h1>
          <p className="text-gray-600">Este tag ha sido dado de baja del sistema.</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl p-8 text-center max-w-sm">
          <div className="bg-red-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Tag No Encontrado</h1>
          <p className="text-gray-600 mb-4">No se encontró información para este código.</p>
          <button
            onClick={() => window.location.reload()}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="min-h-screen bg-gray-100">
      <main className="max-w-md mx-auto bg-white min-h-screen shadow-xl">
        {/* HEADER */}
        <header className="bg-gradient-to-br from-red-600 to-red-700 text-white px-5 pt-8 pb-6 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-2xl backdrop-blur-sm mb-4">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-black tracking-tight">HelpMe</h1>
          <p className="text-red-100 text-sm mt-1">Verificación de estado</p>
        </header>

        {/* INFO */}
        <section className="px-5 pt-6 pb-4">
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 mb-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-amber-800 mb-1">¿Encontraste este tag?</p>
                <p className="text-xs text-amber-700 leading-relaxed">
                  Al presionar el botón de abajo, se enviará un mensaje a los contactos de emergencia
                  para que verifiquen el estado de salud del propietario. Esto ayuda a evitar falsas alarmas.
                </p>
              </div>
            </div>
          </div>

          {data.ownerName && (
            <div className="bg-gray-50 rounded-2xl p-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="bg-gray-200 w-10 h-10 rounded-xl flex items-center justify-center">
                  <Shield className="w-5 h-5 text-gray-500" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-bold uppercase tracking-wide">Propietario</p>
                  <p className="text-sm font-bold text-gray-900">{data.ownerName}</p>
                </div>
              </div>
            </div>
          )}

          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 mb-4">
            <div className="flex items-center gap-2 mb-2">
              <MapPin className="w-4 h-4 text-blue-600" />
              <p className="text-xs font-bold text-blue-800">Se solicitará tu ubicación</p>
            </div>
            <p className="text-[11px] text-blue-600 leading-relaxed">
              Para enviar la alerta, necesitaremos acceso a tu ubicación. Esto ayuda a los contactos
              a saber dónde se escaneó el tag.
            </p>
          </div>
        </section>

        {/* BOTÓN DE ALERTA */}
        {data.hasContacts && (
          <section className="px-5 pb-6 space-y-3">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
              Verificar Estado del Propietario
            </p>
            <LongPressButton
              duration={3000}
              onLongPress={handleLongPress}
              disabled={alertSending}
              loading={alertSending}
              label="Mantener presionado para verificar"
              countdownLabel="Verificando..."
            />
            <p className="text-xs text-center text-gray-400">
              Se enviará a los {data.contactCount} contacto{data.contactCount > 1 ? 's' : ''} de emergencia
            </p>
          </section>
        )}

        {!data.hasContacts && (
          <section className="px-5 pb-6">
            <div className="bg-gray-50 border border-gray-200 rounded-2xl p-5 text-center">
              <AlertCircle className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm font-bold text-gray-600">Sin contactos de emergencia</p>
              <p className="text-xs text-gray-500 mt-1">
                Este tag aún no tiene contactos configurados.
              </p>
            </div>
          </section>
        )}

        {/* FEEDBACK */}
        {alertFeedback && (
          <div className="px-5 pb-4">
            <div className={`rounded-2xl p-4 flex items-start gap-3 ${
              alertFeedback.type === 'success'
                ? 'bg-green-50 border border-green-200'
                : 'bg-red-50 border border-red-200'
            }`}>
              {alertFeedback.type === 'success' ? (
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              )}
              <p className={`text-sm font-medium ${
                alertFeedback.type === 'success' ? 'text-green-800' : 'text-red-800'
              }`}>
                {alertFeedback.message}
              </p>
            </div>
          </div>
        )}

        {/* FOOTER */}
        <footer className="bg-gray-50 border-t border-gray-200 p-5 mt-5 flex flex-col items-center gap-2 text-gray-500">
          <p className="text-[10px] text-gray-400 text-center">
            Esta verificación ayuda a confirmar el estado de salud del propietario.
          </p>
          <p className="text-[10px] text-gray-300">HelpMe - Sistema de Emergencia</p>
        </footer>
      </main>

      {/* MODAL INFO RESCATISTA */}
      {showRescuerInfo && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-4" onClick={() => setShowRescuerInfo(false)}>
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6 sm:p-8" onClick={(e) => e.stopPropagation()}>
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-14 h-14 bg-amber-100 rounded-2xl mb-4">
                <AlertTriangle className="w-7 h-7 text-amber-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Verificar Estado del Propietario</h3>
              <p className="text-sm text-gray-500 mt-2">Se enviará un mensaje a los contactos para que verifiquen el estado de salud. Los datos opcionales ayudan a la familia a contactarte.</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tu nombre (opcional)</label>
                <input
                  type="text"
                  value={rescuerName}
                  onChange={(e) => setRescuerName(e.target.value)}
                  placeholder="Ej: Paramédico Juan"
                  className="w-full h-12 px-4 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tu teléfono (opcional)</label>
                <input
                  type="tel"
                  value={rescuerPhone}
                  onChange={(e) => setRescuerPhone(e.target.value)}
                  placeholder="Ej: +52 55 1234 5678"
                  className="w-full h-12 px-4 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Comentario (opcional)</label>
                <textarea
                  value={rescuerComment}
                  onChange={(e) => setRescuerComment(e.target.value)}
                  placeholder="Ej: Persona consciente, accidente vehicular..."
                  rows={2}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all resize-none"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowRescuerInfo(false)}
                  className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleRescuerInfoConfirm}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-600 text-white font-medium rounded-lg hover:bg-amber-700 transition-colors"
                >
                  <MapPin className="w-4 h-4" />
                  Continuar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* LOCATION PICKER */}
      {locationPicker && (
        <LocationPickerModal
          initialLat={locationPicker.lat}
          initialLng={locationPicker.lng}
          approximate={locationPicker.approximate}
          onConfirm={handleLocationConfirm}
          onCancel={() => setLocationPicker(null)}
        />
      )}
    </div>
  );
}
