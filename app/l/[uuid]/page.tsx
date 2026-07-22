'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { tagsApi, scanApi } from '@/lib/api';
import { calculateAge } from '@/lib/utils';
import {
  Activity, Droplet, AlertTriangle, ShieldPlus, Contact,
  Phone, Stethoscope, Pill, ShieldCheck, Loader2, AlertCircle,
} from 'lucide-react';

interface ViewerData {
  uuid: string;
  status: string;
  viewCount: number;
  medicalData: {
    userName?: string;
    dob?: string;
    bloodType: string;
    emergencyPhone?: string;
    allergies?: string;
    conditions?: string;
    medications?: string;
    curp?: string;
    nss?: string;
    gender?: string;
    religion?: string;
    organDonor?: string;
    umf?: string;
  } | null;
  contacts: {
    name: string;
    relationship: string;
    phone: string;
  }[];
}

export default function ViewerPage() {
  const params = useParams();
  const uuid = params.uuid as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [data, setData] = useState<ViewerData | null>(null);

  useEffect(() => {
    loadViewer();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uuid]);

  async function loadViewer() {
    try {
      const response = await tagsApi.getViewer(uuid);
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

    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      scanApi.registerScan(uuid, { userAgent });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        let city: string | undefined;
        let country: string | undefined;
        try {
          const geoRes = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
            { headers: { 'Accept-Language': 'es' } }
          );
          if (geoRes.ok) {
            const geoData = await geoRes.json();
            city = geoData.address?.city || geoData.address?.town || geoData.address?.village || undefined;
            country = geoData.address?.country || undefined;
          }
        } catch { /* ignore */ }

        scanApi.registerScan(uuid, { latitude: lat, longitude: lng, city, country, userAgent });
      },
      () => {
        scanApi.registerScan(uuid, { userAgent });
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 }
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-red-600" />
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
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  if (data.status === 'VIRGIN' || data.status === 'INCOMPLETE') {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl p-8 text-center max-w-sm">
          <div className="bg-yellow-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <ShieldPlus className="w-8 h-8 text-yellow-600" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Tag Sin Configurar</h1>
          <p className="text-gray-600 mb-4">Este tag aún no ha sido activado por su dueño.</p>
          <a
            href={`/L/${uuid}/config`}
            className="inline-block px-6 py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-colors"
          >
            Activar mi Tag
          </a>
        </div>
      </div>
    );
  }

  const md = data.medicalData;
  if (!md) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl p-8 text-center max-w-sm">
          <p className="text-gray-600">Sin datos médicos disponibles.</p>
        </div>
      </div>
    );
  }

  const age = calculateAge(md.dob);
  const hasPersonalInfo = !!(md.userName || md.dob || md.religion || md.organDonor);

  return (
    <div className="min-h-screen bg-gray-100 text-gray-800 font-sans flex items-start justify-center p-4 sm:items-center sm:p-6">
      <style>{`
        @media print {
          body { background: white !important; }
          .no-print { display: none !important; }
          main { box-shadow: none !important; border: 1px solid #e5e7eb !important; }
        }
      `}</style>
      <main className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100 relative z-10">
        <header className="bg-gradient-to-br from-red-600 to-red-800 text-white text-center p-6 relative overflow-hidden">
          <div className="relative mx-auto w-12 h-12 mb-3 flex items-center justify-center">
            <div className="absolute inset-0 bg-white opacity-25 rounded-full animate-ping"></div>
            <div className="relative z-10 bg-white text-red-600 p-2 rounded-full shadow-lg">
              <Activity className="w-6 h-6" />
            </div>
          </div>
          <h1 className="text-xl font-extrabold tracking-tight mb-1">Ficha Médica</h1>
          <p className="text-red-100 text-[10px] font-bold uppercase tracking-widest opacity-90">EMERGENCIA / EMERGENCY</p>
        </header>

        <section className="p-5 space-y-6">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-red-50 border border-red-100 rounded-2xl p-4 text-center shadow-sm">
              <div className="flex items-center justify-center gap-1.5 text-red-600 font-bold text-[10px] uppercase mb-1">
                <Droplet className="w-3.5 h-3.5" />
                <label>Sangre</label>
              </div>
              <p className="text-4xl font-black text-red-700 tracking-tighter">{md.bloodType}</p>
            </div>
            <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 text-center shadow-sm">
              <div className="flex items-center justify-center gap-1.5 text-amber-700 font-bold text-[10px] uppercase mb-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                <label>Alergias</label>
              </div>
              <p className="text-sm font-bold text-amber-900 leading-tight">{md.allergies || 'Ninguna'}</p>
            </div>
          </div>

          {hasPersonalInfo && (
            <div className="space-y-3">
              <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2">
                <span className="h-px bg-gray-200 flex-1"></span>
                <span>Información Personal</span>
                <span className="h-px bg-gray-200 flex-1"></span>
              </h2>

              <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 space-y-3">
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <p className="text-[10px] text-gray-500 font-bold uppercase mb-0.5">Nombre Completo</p>
                    <p className="text-base font-extrabold text-gray-900 leading-tight">{md.userName || 'No especificado'}</p>
                  </div>
                  {age !== null && (
                    <div className="text-right whitespace-nowrap">
                      <p className="text-[10px] text-gray-500 font-bold uppercase mb-0.5">Edad</p>
                      <p className="text-base font-extrabold text-gray-900">{age} años</p>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-gray-100">
                  <div>
                    <p className="text-[10px] text-gray-500 font-bold uppercase mb-0.5">Nacimiento</p>
                    <p className="text-[11px] font-bold text-gray-800">{md.dob || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-500 font-bold uppercase mb-0.5">Religión</p>
                    <p className="text-[11px] font-bold text-gray-800">{md.religion || 'N/A'}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-gray-500 font-bold uppercase mb-0.5">Donador</p>
                    <p className="text-[11px] font-bold text-red-600">{md.organDonor || 'No'}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {md.nss && (
            <div className="space-y-3">
              <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2">
                <span className="h-px bg-gray-200 flex-1"></span>
                <span>Seguridad Social (IMSS)</span>
                <span className="h-px bg-gray-200 flex-1"></span>
              </h2>

              <div className="bg-blue-600 rounded-2xl p-5 shadow-xl shadow-blue-600/20 space-y-4">
                <div className="flex items-center gap-4">
                  <div className="bg-white/20 p-2.5 rounded-xl backdrop-blur-sm shadow-inner">
                    <ShieldPlus className="w-6 h-6 text-white" />
                  </div>
                  <div className="w-full">
                    <p className="text-[10px] text-blue-100 font-bold uppercase tracking-wider mb-0.5">NSS</p>
                    <p className="text-2xl font-mono font-black text-white tracking-[0.1em]">{md.nss}</p>
                  </div>
                </div>
                {md.curp && (
                  <div className="flex justify-between items-end pt-3 border-t border-white/20">
                    <div>
                      <p className="text-[10px] text-blue-100 font-bold uppercase mb-0.5">CURP</p>
                      <p className="text-xs font-mono font-bold text-blue-50">{md.curp}</p>
                    </div>
                    {md.umf && (
                      <div className="text-right">
                        <p className="text-[10px] text-blue-100 font-bold uppercase mb-0.5">UMF</p>
                        <p className="text-xs font-bold text-blue-50">{md.umf}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="space-y-3">
            <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2">
              <span className="h-px bg-gray-200 flex-1"></span>
              <span>Contactos de Emergencia</span>
              <span className="h-px bg-gray-200 flex-1"></span>
            </h2>

            {data.contacts.map((contact, index) => (
              <div key={index} className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-emerald-600 p-2 rounded-lg text-white">
                    <Contact className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-emerald-900 leading-none mb-0.5">
                      {contact.name}
                      <span className="text-[9px] font-normal opacity-60 ml-1">({contact.relationship})</span>
                    </p>
                    <p className="text-[11px] font-bold text-emerald-700/70 font-mono tracking-wider">{contact.phone}</p>
                  </div>
                </div>
                <a href={`tel:+${contact.phone.replace('+', '')}`} className="bg-emerald-600 text-white p-2.5 rounded-full shadow-lg shadow-emerald-600/20 active:scale-95 transition-transform">
                  <Phone className="w-4 h-4" />
                </a>
              </div>
            ))}
          </div>

          <div className="space-y-3">
            <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2">
              <span className="h-px bg-gray-200 flex-1"></span>
              <span>Perfil Médico</span>
              <span className="h-px bg-gray-200 flex-1"></span>
            </h2>

            <div className="space-y-2">
              <div className="bg-gray-50 flex items-center gap-3 p-3 rounded-xl border border-gray-100">
                <Stethoscope className="w-4 h-4 text-gray-400" />
                <div className="w-full">
                  <p className="text-[10px] text-gray-500 font-bold uppercase leading-none mb-1">Condiciones Crónicas</p>
                  <p className="text-xs font-bold text-gray-900">{md.conditions || 'No especificadas'}</p>
                </div>
              </div>
              <div className="bg-gray-50 flex items-center gap-3 p-3 rounded-xl border border-gray-100">
                <Pill className="w-4 h-4 text-gray-400" />
                <div className="w-full">
                  <p className="text-[10px] text-gray-500 font-bold uppercase leading-none mb-1">Medicamentos Actuales</p>
                  <p className="text-xs font-bold text-gray-900">{md.medications || 'No especificados'}</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="px-5 pb-6 space-y-3 no-print">
          <button
            onClick={() => window.print()}
            className="w-full flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2.5 px-6 rounded-xl text-sm font-bold transition-all active:scale-95"
          >
            <span>Imprimir / Guardar PDF</span>
          </button>
        </section>

        <footer className="bg-gray-50 border-t border-gray-100 p-4 flex flex-col items-center gap-2 text-gray-400">
          <ShieldCheck className="w-5 h-5 opacity-50" />
          <p className="text-xs font-medium text-center">Datos provistos por el paciente para primeros auxilios.</p>
        </footer>
      </main>
    </div>
  );
}
