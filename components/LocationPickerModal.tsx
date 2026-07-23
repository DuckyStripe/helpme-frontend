'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { MapPin, Loader2, Send, X, AlertTriangle } from 'lucide-react';

const LocationMap = dynamic(() => import('./LocationMap'), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full flex items-center justify-center bg-gray-100">
      <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
    </div>
  ),
});

async function reverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
      { headers: { 'Accept-Language': 'es' } }
    );
    if (!res.ok) throw new Error('geocode failed');
    const data = await res.json();
    const road = data.address?.road || '';
    const houseNumber = data.address?.house_number || '';
    const suburb = data.address?.suburb || '';
    const city = data.address?.city || data.address?.town || data.address?.village || '';
    const state = data.address?.state || '';

    let address = '';
    if (road) {
      address = road;
      if (houseNumber) address += ` ${houseNumber}`;
    }
    if (suburb) address += `, ${suburb}`;
    if (city) address += `, ${city}`;
    if (state) address += `, ${state}`;

    return address || `Lat: ${lat.toFixed(5)}, Lng: ${lng.toFixed(5)}`;
  } catch {
    return `Lat: ${lat.toFixed(5)}, Lng: ${lng.toFixed(5)}`;
  }
}

interface LocationPickerModalProps {
  initialLat: number;
  initialLng: number;
  contactName: string;
  approximate?: boolean;
  onConfirm: (location: { lat: number; lng: number; address: string }) => Promise<void>;
  onCancel: () => void;
}

export default function LocationPickerModal({
  initialLat,
  initialLng,
  contactName,
  approximate,
  onConfirm,
  onCancel,
}: LocationPickerModalProps) {
  const [lat, setLat] = useState(initialLat);
  const [lng, setLng] = useState(initialLng);
  const [address, setAddress] = useState('Buscando dirección...');
  const [loadingAddress, setLoadingAddress] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoadingAddress(true);
    reverseGeocode(lat, lng).then((result) => {
      if (!cancelled) {
        setAddress(result);
        setLoadingAddress(false);
      }
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lat, lng]);

  function handleMove(newLat: number, newLng: number) {
    setLat(newLat);
    setLng(newLng);
  }

  async function handleConfirm() {
    setSending(true);
    setError(null);
    try {
      await onConfirm({ lat, lng, address });
    } catch (err: any) {
      setError(err?.message || 'No se pudo enviar la alerta. Intenta de nuevo.');
      setSending(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white w-full sm:max-w-md sm:rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        <div className="px-5 pt-5 pb-3 flex items-center justify-between border-b border-gray-100">
          <div>
            <h2 className="font-bold text-gray-900">Confirmar ubicación</h2>
            <p className="text-xs text-gray-500">Ajusta el pin si no está en el lugar exacto</p>
          </div>
          <button
            onClick={onCancel}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
            aria-label="Cancelar"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="h-64 sm:h-80 relative">
          <LocationMap lat={lat} lng={lng} onChange={handleMove} />
        </div>

        <div className="px-5 py-4 space-y-3">
          {approximate && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-amber-800 leading-snug">
                No pudimos detectar tu ubicación exacta (permiso denegado o no disponible). El
                pin está en un punto de referencia, <strong>muévelo al lugar real</strong> antes
                de enviar.
              </p>
            </div>
          )}
          <div className="bg-gray-50 rounded-xl p-3 flex items-start gap-2">
            <MapPin className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-gray-800 leading-snug">
              {loadingAddress ? 'Buscando dirección...' : address}
            </p>
          </div>
          <p className="text-[11px] text-gray-400 leading-snug">
            La dirección aproximada se obtiene mediante el servicio de mapas OpenStreetMap
            (Nominatim), al que se envían únicamente las coordenadas mostradas. El mensaje se
            envía desde el servidor de HelpMe (vía OpenWA) directamente al contacto de confianza.
          </p>
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700 leading-snug">{error}</p>
            </div>
          )}
          <button
            onClick={handleConfirm}
            disabled={sending}
            className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white font-bold py-3.5 rounded-2xl shadow-lg shadow-green-600/30 active:scale-95 transition-all"
          >
            {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
            Enviar ubicación a {contactName}
          </button>
        </div>
      </div>
    </div>
  );
}
