'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { MapPin, Loader2, Send, X, AlertTriangle, RefreshCw } from 'lucide-react';

const LocationMap = dynamic(() => import('./LocationMap'), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full flex items-center justify-center bg-gray-100 dark:bg-gray-800">
      <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
    </div>
  ),
});

// Coordenadas de CDMX (fallback cuando no se puede detectar ubicación)
const DEFAULT_LOCATION = { lat: 19.4326, lng: -99.1332 };

async function reverseGeocode(lat: number, lng: number, retries = 2): Promise<string> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);

  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&zoom=19&addressdetails=1`,
      { 
        headers: { 'Accept-Language': 'es' },
        signal: controller.signal
      }
    );
    clearTimeout(timeoutId);
    
    if (!res.ok) throw new Error('geocode failed');
    const data = await res.json();
    const a = data.address || {};
    const road = a.road || a.pedestrian || '';
    const houseNumber = a.house_number || '';
    const nearby = a.amenity || a.shop || a.building || '';
    const neighbourhood = a.neighbourhood || a.quarter || a.suburb || '';
    const city = a.city || a.town || a.village || '';
    const state = a.state || '';

    let address = '';
    if (nearby) address += `${nearby}, `;
    if (road) {
      address += road;
      if (houseNumber) address += ` ${houseNumber}`;
    } else if (nearby) {
      address = address.replace(/, $/, '');
    }
    if (neighbourhood) address += `, ${neighbourhood}`;
    if (city) address += `, ${city}`;
    if (state) address += `, ${state}`;

    return address || '';
  } catch {
    clearTimeout(timeoutId);
    if (retries > 0) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      return reverseGeocode(lat, lng, retries - 1);
    }
    return '';
  }
}

function isDefaultLocation(lat: number, lng: number): boolean {
  return Math.abs(lat - DEFAULT_LOCATION.lat) < 0.001 && 
         Math.abs(lng - DEFAULT_LOCATION.lng) < 0.001;
}

interface LocationPickerModalProps {
  initialLat: number;
  initialLng: number;
  recipientLabel: string;
  approximate?: boolean;
  onConfirm: (location: { lat: number; lng: number; address: string }) => Promise<void>;
  onCancel: () => void;
}

export default function LocationPickerModal({
  initialLat,
  initialLng,
  recipientLabel,
  approximate,
  onConfirm,
  onCancel,
}: LocationPickerModalProps) {
  const [lat, setLat] = useState(initialLat);
  const [lng, setLng] = useState(initialLng);
  const [address, setAddress] = useState('');
  const [loadingAddress, setLoadingAddress] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [geocodeError, setGeocodeError] = useState(false);
  const [needsConfirm, setNeedsConfirm] = useState(false);

  const isDefault = isDefaultLocation(lat, lng);
  const showWarning = approximate || isDefault;

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onCancel();
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onCancel]);

  useEffect(() => {
    let cancelled = false;
    setLoadingAddress(true);
    setGeocodeError(false);
    
    reverseGeocode(lat, lng).then((result) => {
      if (!cancelled) {
        setAddress(result);
        setGeocodeError(!result);
        setLoadingAddress(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [lat, lng]);

  function handleMove(newLat: number, newLng: number) {
    setLat(newLat);
    setLng(newLng);
    setNeedsConfirm(false);
  }

  function handleRetryGeocode() {
    setLoadingAddress(true);
    setGeocodeError(false);
    reverseGeocode(lat, lng).then((result) => {
      setAddress(result);
      setGeocodeError(!result);
      setLoadingAddress(false);
    });
  }

  async function handleConfirm() {
    if (showWarning && isDefault && !needsConfirm) {
      setNeedsConfirm(true);
      return;
    }

    setSending(true);
    setError(null);
    try {
      // El pin GPS (lat/lng) es siempre la fuente exacta; la calle es solo referencia
      // (OpenStreetMap no siempre tiene el número de casa registrado en México).
      const coordsLine = `📍 GPS: ${lat.toFixed(5)}, ${lng.toFixed(5)} (exacto)`;
      const finalAddress = address ? `${coordsLine}\nReferencia: ${address}` : coordsLine;
      await onConfirm({ lat, lng, address: finalAddress });
    } catch (err: any) {
      setError(err?.message || 'No se pudo enviar la alerta. Intenta de nuevo.');
      setSending(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div role="dialog" aria-modal="true" aria-labelledby="location-picker-title" className="bg-white dark:bg-gray-900 w-full sm:max-w-md sm:rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh] overscroll-contain">
        <div className="px-5 pt-5 pb-3 flex items-center justify-between border-b border-gray-100 dark:border-gray-800">
          <div>
            <h2 id="location-picker-title" className="font-bold text-gray-900 dark:text-gray-100">Confirmar ubicación</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">Ajusta el pin si no está en el lugar exacto</p>
          </div>
          <button
            onClick={onCancel}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors"
            aria-label="Cancelar"
          >
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        <div className="h-64 sm:h-80 relative">
          <LocationMap lat={lat} lng={lng} onChange={handleMove} />
        </div>

        <div className="px-5 py-4 space-y-3">
          {showWarning && (
            <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 rounded-xl p-3 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-amber-800 dark:text-amber-300 leading-snug">
                {isDefault
                  ? 'La ubicación actual es un punto de referencia. '
                  : 'No pudimos detectar tu ubicación exacta. '
                }
                <strong>Mueve el pin al lugar real</strong> antes de enviar.
              </p>
            </div>
          )}
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-3 flex items-start gap-2">
            <MapPin className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-gray-900 dark:text-gray-100 leading-snug">
                GPS confirmado: {lat.toFixed(5)}, {lng.toFixed(5)}
              </p>
              {loadingAddress ? (
                <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mt-1">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  <span>Buscando calle de referencia…</span>
                </div>
              ) : (
                <div className="flex items-start justify-between gap-2 mt-1">
                  <p className="text-xs text-gray-500 dark:text-gray-400 leading-snug break-words">
                    {geocodeError
                      ? '⚠️ Sin calle de referencia disponible (el pin sigue siendo exacto)'
                      : address
                      ? `Referencia: ${address}`
                      : 'Sin calle de referencia en el mapa (el pin sigue siendo exacto)'}
                  </p>
                  {geocodeError && (
                    <button
                      onClick={handleRetryGeocode}
                      className="flex-shrink-0 p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
                      title="Reintentar"
                    >
                      <RefreshCw className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400" />
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
          <p className="text-[11px] text-gray-400 dark:text-gray-500 leading-snug">
            El pin del mapa (coordenadas GPS) es lo que abre el rescatista en Google Maps y siempre
            es exacto. La calle es solo una referencia y puede faltar en zonas sin datos de OpenStreetMap.
          </p>
          {error && (
            <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-xl p-3 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700 dark:text-red-400 leading-snug">{error}</p>
            </div>
          )}
          {needsConfirm && (
            <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 rounded-xl p-3 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-amber-800 dark:text-amber-300 leading-snug">
                La ubicación es aproximada. Te recomendamos ajustar el pin al lugar exacto. Presiona de nuevo para enviarla así.
              </p>
            </div>
          )}
          <button
            onClick={handleConfirm}
            disabled={sending || loadingAddress}
            className={`w-full flex items-center justify-center gap-2 disabled:opacity-60 text-white font-bold py-3.5 rounded-2xl shadow-lg active:scale-95 transition-transform ${
              needsConfirm ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-600/30' : 'bg-green-600 hover:bg-green-700 shadow-green-600/30'
            }`}
          >
            {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
            {sending ? 'Enviando…' : needsConfirm ? 'Confirmar y enviar de todas formas' : `Enviar a ${recipientLabel}`}
          </button>
        </div>
      </div>
    </div>
  );
}
