'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { tagsApi, scanApi } from '@/lib/api';
import { calculateAge } from '@/lib/utils';
import LocationPickerModal from '@/components/LocationPickerModal';
import {
  Activity, Droplet, AlertTriangle, ShieldPlus, Contact,
  Phone, Stethoscope, Pill, ShieldCheck, Loader2, AlertCircle,
  Heart, User, Calendar, PhoneCall, MessageCircle,
  CheckCircle, Clock, RefreshCw,
} from 'lucide-react';

// Ventana de exposición: tras este tiempo la ficha se oculta del DOM y hay
// que recargar (nuevo tap/petición) para volver a verla.
const VIEW_SESSION_MS = 5 * 60 * 1000;

// Centro de la CDMX: usado como punto de partida del mapa cuando el
// navegador del rescatista no comparte o no tiene ubicación disponible.
const DEFAULT_MAP_CENTER = { lat: 19.4326, lng: -99.1332 };

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
    pob?: string;
    umf?: string;
    hereditaryConditions?: string;
  } | null;
  contacts: {
    id: string;
    name: string;
    relationship: string;
    phone: string;
  }[];
}

interface AlertFeedback {
  type: 'success' | 'error';
  message: string;
}

export default function ViewerPage() {
  const params = useParams();
  const uuid = params.uuid as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [data, setData] = useState<ViewerData | null>(null);
  const [expired, setExpired] = useState(false);
  const [remainingSec, setRemainingSec] = useState<number | null>(null);
  const [locationPicker, setLocationPicker] = useState<{
    contactId: string;
    contactName: string;
    lat: number;
    lng: number;
  } | null>(null);
  const [alertFeedback, setAlertFeedback] = useState<AlertFeedback | null>(null);

  useEffect(() => {
    if (!alertFeedback) return;
    const timeout = setTimeout(() => setAlertFeedback(null), 5000);
    return () => clearTimeout(timeout);
  }, [alertFeedback]);

  useEffect(() => {
    loadViewer();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uuid]);

  useEffect(() => {
    if (!data || expired) return;

    const deadline = Date.now() + VIEW_SESSION_MS;
    setRemainingSec(Math.round(VIEW_SESSION_MS / 1000));

    const interval = setInterval(() => {
      const secondsLeft = Math.max(0, Math.round((deadline - Date.now()) / 1000));
      setRemainingSec(secondsLeft);
      if (secondsLeft <= 0) {
        clearInterval(interval);
        setExpired(true);
        setData(null);
      }
    }, 1000);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  async function loadViewer() {
    try {
      const response = await tagsApi.getViewer(uuid);
      setExpired(false);
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

  async function handleReload() {
    setLoading(true);
    setError('');
    await loadViewer();
  }

  function triggerScanRegistration() {
    const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : undefined;
    scanApi.registerScan(uuid, { userAgent });
  }

  async function detectPosition(): Promise<{ lat: number; lng: number }> {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      return DEFAULT_MAP_CENTER;
    }

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (position) => resolve({ lat: position.coords.latitude, lng: position.coords.longitude }),
        () => resolve(DEFAULT_MAP_CENTER),
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    });
  }

  async function handleWhatsAppAlert(contactId: string, contactName: string) {
    const pos = await detectPosition();
    setLocationPicker({ contactId, contactName, lat: pos.lat, lng: pos.lng });
  }

  async function handleLocationConfirm(location: { lat: number; lng: number; address: string }) {
    if (!locationPicker) return;
    const { contactId, contactName } = locationPicker;
    await tagsApi.sendAlert(uuid, contactId, location);
    setLocationPicker(null);
    setAlertFeedback({ type: 'success', message: `Alerta enviada a ${contactName}` });
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
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  if (expired) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl p-8 text-center max-w-sm">
          <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <Clock className="w-8 h-8 text-gray-500" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Sesión Expirada</h1>
          <p className="text-gray-600 mb-4">Por seguridad, la ficha médica se oculta después de un tiempo. Vuelve a escanear el tag o recarga para verla de nuevo.</p>
          <button
            onClick={handleReload}
            className="inline-flex items-center gap-2 px-6 py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-colors active:scale-95"
          >
            <RefreshCw className="w-4 h-4" />
            Ver ficha de nuevo
          </button>
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
  const hasAllergies = md.allergies && md.allergies !== 'Ninguna conocida' && md.allergies !== 'Ninguna';
  const hasConditions = md.conditions && md.conditions.trim() !== '';
  const hasMedications = md.medications && md.medications.trim() !== '';
  const hasHereditary = md.hereditaryConditions && md.hereditaryConditions.trim() !== '';

  return (
    <div className="min-h-screen bg-gray-100 text-gray-900 flex items-start justify-center p-0 sm:p-4 sm:items-center">
      <style>{`
        @media print {
          body { background: white !important; }
          .no-print { display: none !important; }
          main { box-shadow: none !important; border: none !important; }
        }
      `}</style>
      <main className="w-full max-w-md bg-white sm:rounded-3xl shadow-2xl overflow-hidden relative z-10 min-h-screen sm:min-h-0">
        
        {/* HERO - Información crítica inmediata */}
        <header className="bg-gradient-to-br from-red-600 via-red-700 to-red-800 text-white px-5 pt-6 pb-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="bg-white/20 backdrop-blur-sm p-2 rounded-xl">
                <Activity className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-red-100">Ficha Médica</p>
                <p className="text-[9px] text-red-200 uppercase tracking-widest">Emergencia</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {remainingSec !== null && (
                <div className="no-print flex items-center gap-1 bg-white/10 px-2.5 py-1.5 rounded-xl" title="Esta ficha se oculta automáticamente por seguridad">
                  <Clock className="w-3.5 h-3.5 text-red-100" />
                  <span className="text-xs font-mono font-bold text-red-100">
                    {String(Math.floor(remainingSec / 60)).padStart(2, '0')}:{String(remainingSec % 60).padStart(2, '0')}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Nombre y datos básicos */}
          <div className="mb-4">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight mb-1">
              {md.userName || 'Paciente'}
            </h1>
            <div className="flex items-center gap-3 text-red-100 text-sm">
              {age !== null && (
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  {age} años
                </span>
              )}
              {md.gender && (
                <span className="flex items-center gap-1">
                  <User className="w-3.5 h-3.5" />
                  {md.gender}
                </span>
              )}
            </div>
          </div>

          {/* Tipo de sangre - DESTACADO */}
          <div className="bg-white/15 backdrop-blur-sm rounded-2xl p-4 flex items-center justify-between border border-white/20">
            <div className="flex items-center gap-3">
              <div className="bg-white p-2.5 rounded-xl shadow-lg">
                <Droplet className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-red-100">Tipo de Sangre</p>
                <p className="text-3xl font-black tracking-tight">{md.bloodType}</p>
              </div>
            </div>
            {md.organDonor === 'Si' && (
              <div className="bg-green-500/90 px-3 py-1.5 rounded-lg">
                <p className="text-[10px] font-bold uppercase text-white">Donador</p>
              </div>
            )}
          </div>
        </header>

        {/* ALERTAS CRÍTICAS - Inmediatamente visibles */}
        <section className="px-5 -mt-3 relative z-10">
          <div className="grid grid-cols-2 gap-3">
            {/* Alergias */}
            <div className={`rounded-2xl p-4 border-2 shadow-lg ${
              hasAllergies 
                ? 'bg-amber-50 border-amber-300' 
                : 'bg-green-50 border-green-200'
            }`}>
              <div className="flex items-center gap-1.5 mb-2">
                <AlertTriangle className={`w-4 h-4 ${hasAllergies ? 'text-amber-600' : 'text-green-600'}`} />
                <span className={`text-[10px] font-bold uppercase tracking-wide ${hasAllergies ? 'text-amber-700' : 'text-green-700'}`}>
                  Alergias
                </span>
              </div>
              <p className={`text-sm font-bold leading-tight ${hasAllergies ? 'text-amber-900' : 'text-green-800'}`}>
                {hasAllergies ? md.allergies : 'Ninguna'}
              </p>
            </div>

            {/* Teléfono de emergencia personal */}
            {md.emergencyPhone && (
              <div className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-4 shadow-lg">
                <div className="flex items-center gap-1.5 mb-2">
                  <Phone className="w-4 h-4 text-blue-600" />
                  <span className="text-[10px] font-bold uppercase tracking-wide text-blue-700">
                    Tel. Personal
                  </span>
                </div>
                <a 
                  href={`tel:+52${md.emergencyPhone}`}
                  className="text-sm font-bold text-blue-900 font-mono tracking-wide hover:underline block"
                >
                  {md.emergencyPhone}
                </a>
              </div>
            )}
          </div>
        </section>

        {/* INFORMACIÓN PERSONAL - Debajo de tipo de sangre */}
        <section className="px-5 pt-5">
          <h2 className="text-xs font-black text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
            <User className="w-4 h-4" />
            Información Personal
          </h2>
          
          <div className="bg-gray-50 rounded-2xl p-4 border border-gray-200">
            <div className="grid grid-cols-2 gap-3">
              {md.dob && (
                <div>
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wide mb-0.5">Fecha Nacimiento</p>
                  <p className="text-sm font-bold text-gray-900">{md.dob}</p>
                </div>
              )}
              {md.pob && (
                <div>
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wide mb-0.5">Lugar Nacimiento</p>
                  <p className="text-sm font-bold text-gray-900">{md.pob}</p>
                </div>
              )}
              {md.religion && (
                <div>
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wide mb-0.5">Religión</p>
                  <p className="text-sm font-bold text-gray-900">{md.religion}</p>
                </div>
              )}
              {md.organDonor && (
                <div>
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wide mb-0.5">Donador de Órganos</p>
                  <p className={`text-sm font-bold ${md.organDonor === 'Si' ? 'text-green-600' : 'text-gray-600'}`}>
                    {md.organDonor}
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* SEGURIDAD SOCIAL - Después de información personal */}
        {md.nss && (
          <section className="px-5 pt-5">
            <h2 className="text-xs font-black text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
              <ShieldPlus className="w-4 h-4" />
              Seguridad Social
            </h2>
            
            <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-5 shadow-xl shadow-blue-600/20">
              <div className="flex items-center gap-3 mb-3">
                <div className="bg-white/20 p-2.5 rounded-xl backdrop-blur-sm">
                  <ShieldPlus className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-[10px] text-blue-200 font-bold uppercase tracking-wider">NSS</p>
                  <p className="text-xl font-mono font-black text-white tracking-wider">{md.nss}</p>
                </div>
              </div>
              
              {(md.curp || md.umf) && (
                <div className="pt-3 border-t border-white/20 grid grid-cols-2 gap-3">
                  {md.curp && (
                    <div>
                      <p className="text-[10px] text-blue-200 font-bold uppercase tracking-wider mb-0.5">CURP</p>
                      <p className="text-xs font-mono font-bold text-white">{md.curp}</p>
                    </div>
                  )}
                  {md.umf && (
                    <div className="text-right">
                      <p className="text-[10px] text-blue-200 font-bold uppercase tracking-wider mb-0.5">UMF</p>
                      <p className="text-xs font-bold text-white">{md.umf}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </section>
        )}

        {/* PERFIL MÉDICO */}
        <section className="px-5 pt-5">
          <h2 className="text-xs font-black text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
            <Stethoscope className="w-4 h-4" />
            Perfil Médico
          </h2>
          
          <div className="space-y-2.5">
            {/* Condiciones crónicas */}
            <div className={`rounded-xl p-4 border-2 flex items-start gap-3 ${
              hasConditions 
                ? 'bg-red-50 border-red-200' 
                : 'bg-gray-50 border-gray-100'
            }`}>
              <Stethoscope className={`w-5 h-5 flex-shrink-0 mt-0.5 ${hasConditions ? 'text-red-500' : 'text-gray-400'}`} />
              <div className="flex-1 min-w-0">
                <p className={`text-[10px] font-bold uppercase tracking-wide mb-1 ${hasConditions ? 'text-red-700' : 'text-gray-500'}`}>
                  Condiciones Crónicas
                </p>
                <p className={`text-sm font-semibold ${hasConditions ? 'text-red-900' : 'text-gray-500'}`}>
                  {hasConditions ? md.conditions : 'Ninguna'}
                </p>
              </div>
            </div>

            {/* Medicamentos */}
            <div className={`rounded-xl p-4 border-2 flex items-start gap-3 ${
              hasMedications 
                ? 'bg-purple-50 border-purple-200' 
                : 'bg-gray-50 border-gray-100'
            }`}>
              <Pill className={`w-5 h-5 flex-shrink-0 mt-0.5 ${hasMedications ? 'text-purple-500' : 'text-gray-400'}`} />
              <div className="flex-1 min-w-0">
                <p className={`text-[10px] font-bold uppercase tracking-wide mb-1 ${hasMedications ? 'text-purple-700' : 'text-gray-500'}`}>
                  Medicamentos Actuales
                </p>
                <p className={`text-sm font-semibold ${hasMedications ? 'text-purple-900' : 'text-gray-500'}`}>
                  {hasMedications ? md.medications : 'Ninguno'}
                </p>
              </div>
            </div>

            {/* Antecedentes heredofamiliares - Con indicador de si padece o no */}
            {hasHereditary && (
              <div className="bg-orange-50 border-2 border-orange-200 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Heart className="w-5 h-5 text-orange-500" />
                  <p className="text-[10px] font-bold uppercase tracking-wide text-orange-700">
                    Antecedentes Heredofamiliares
                  </p>
                </div>
                <div className="space-y-2">
                  {md.hereditaryConditions && md.hereditaryConditions.split('|').map((item, idx) => {
                    const parts = item.split(' - ');
                    const name = parts[0] || '';
                    const line = parts[1] || '';
                    const isActive = parts[2] === 'si';
                    return (
                      <div 
                        key={idx} 
                        className={`flex items-center justify-between p-3 rounded-lg border-2 ${
                          isActive 
                            ? 'bg-red-100 border-red-300' 
                            : 'bg-gray-100 border-gray-200'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          {isActive ? (
                            <AlertTriangle className="w-4 h-4 text-red-600" />
                          ) : (
                            <CheckCircle className="w-4 h-4 text-gray-500" />
                          )}
                          <div>
                            <p className={`text-sm font-bold ${isActive ? 'text-red-900' : 'text-gray-700'}`}>
                              {name}
                            </p>
                            <p className="text-[10px] text-gray-500 uppercase">Línea {line}</p>
                          </div>
                        </div>
                        <div className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase ${
                          isActive 
                            ? 'bg-red-600 text-white' 
                            : 'bg-gray-300 text-gray-600'
                        }`}>
                          {isActive ? 'Lo padece' : 'No lo padece'}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* CONTACTOS DE EMERGENCIA - Al final */}
        {data.contacts.length > 0 && (
          <section className="px-5 pt-5">
            <h2 className="text-xs font-black text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
              <PhoneCall className="w-4 h-4" />
              Contactos de Emergencia
            </h2>
            <div className="space-y-2.5">
              {data.contacts.map((contact, index) => (
                <div 
                  key={index} 
                  className="bg-emerald-50 border-2 border-emerald-200 rounded-2xl p-4 flex items-center justify-between shadow-sm"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="bg-emerald-600 p-2.5 rounded-xl text-white flex-shrink-0">
                      <Contact className="w-5 h-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-emerald-900 truncate">
                        {contact.name}
                      </p>
                      <p className="text-[11px] text-emerald-600 font-medium">
                        {contact.relationship}
                      </p>
                    </div>
                  </div>
                  <a 
                    href={`tel:+52${contact.phone.replace('+', '')}`} 
                    className="bg-emerald-600 hover:bg-emerald-700 text-white p-3.5 rounded-xl shadow-lg shadow-emerald-600/30 active:scale-95 transition-all flex-shrink-0 ml-3"
                    aria-label={`Llamar a ${contact.name}`}
                  >
                    <Phone className="w-5 h-5" />
                  </a>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* BOTONES DE ACCIÓN */}
        <section className="px-5 pt-5 space-y-3 no-print">
          {/* Botones de WhatsApp por contacto */}
          {data.contacts.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                Enviar Alerta por WhatsApp
              </p>
              {data.contacts.map((contact, index) => (
                <button
                  key={index}
                  onClick={() => handleWhatsAppAlert(contact.id, contact.name)}
                  className="w-full flex items-center justify-between gap-3 bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-5 rounded-2xl shadow-lg shadow-green-600/30 active:scale-95 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <MessageCircle className="w-6 h-6" />
                    <div className="text-left">
                      <p className="text-sm font-bold">Alertar a {contact.name}</p>
                      <p className="text-xs font-normal opacity-90">{contact.relationship}</p>
                    </div>
                  </div>
                  <Phone className="w-5 h-5" />
                </button>
              ))}
            </div>
          )}

        </section>

        {/* FOOTER */}
        <footer className="bg-gray-50 border-t border-gray-200 p-5 mt-5 flex flex-col items-center gap-2 text-gray-500">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-green-500" />
            <p className="text-xs font-medium">Datos verificados por el paciente</p>
          </div>
          <p className="text-[10px] text-gray-400 text-center">
            Esta información es proporcionada por el paciente para fines de primeros auxilios.
          </p>
        </footer>
      </main>

      {locationPicker && (
        <LocationPickerModal
          initialLat={locationPicker.lat}
          initialLng={locationPicker.lng}
          contactName={locationPicker.contactName}
          onConfirm={handleLocationConfirm}
          onCancel={() => setLocationPicker(null)}
        />
      )}

      {alertFeedback && (
        <div
          className={`fixed bottom-5 left-1/2 -translate-x-1/2 z-[60] max-w-[90vw] px-5 py-3 rounded-2xl shadow-xl font-bold text-sm flex items-center gap-2 ${
            alertFeedback.type === 'success'
              ? 'bg-green-600 text-white'
              : 'bg-red-600 text-white'
          }`}
        >
          {alertFeedback.type === 'success' ? (
            <CheckCircle className="w-5 h-5 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
          )}
          {alertFeedback.message}
        </div>
      )}
    </div>
  );
}
