'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import { Activity, Droplet, AlertTriangle, ShieldPlus, Star, Contact, Phone, Stethoscope, Pill, ShieldCheck, BellRing, Loader2, Siren, CheckCircle } from 'lucide-react';
import { linksApi } from '@/lib/api';
import { calculateAge, isNegados } from '@/lib/utils';
import { toast } from '@/lib/toast';

interface ViewerData {
  name: string;
  viewCount: number;
  medicalData: {
    userName: string;
    dob: string;
    bloodType: string;
    emergencyPhone: string;
    allergies?: string;
    conditions?: string;
    medications?: string;
    curp?: string;
    nss?: string;
    pob?: string;
    gender?: string;
    religion?: string;
    organDonor?: string;
    umf?: string;
    hereditaryBackground?: Record<string, string>;
  };
  contacts: {
    id?: string;
    name: string;
    relationship: string;
    phone: string;
  }[];
}

export default function ViewerPage() {
  const params = useParams();
  const token = params.token as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [data, setData] = useState<ViewerData | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [note, setNote] = useState('');
  const [confirming, setConfirming] = useState(false);
  const [alertSent, setAlertSent] = useState(false);

  const modalContentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadViewer();
  }, [token]);

  useEffect(() => {
    if (modalOpen && modalContentRef.current) {
      modalContentRef.current.classList.remove('scale-95');
      modalContentRef.current.classList.add('scale-100');
    }
  }, [modalOpen]);

  async function loadViewer() {
    try {
      const response = await linksApi.getViewer(token);
      setData(response);
    } catch (err: any) {
      setError(err.message || 'Ficha no encontrada');
    } finally {
      setLoading(false);
    }
  }

  function openModal() {
    setModalOpen(true);
    setNote('');
  }

  function closeModal() {
    setModalOpen(false);
    if (modalContentRef.current) {
      modalContentRef.current.classList.remove('scale-100');
      modalContentRef.current.classList.add('scale-95');
    }
    setNote('');
  }

  function confirmAlert() {
    setConfirming(true);

    if (!navigator.geolocation) {
      toast.info('Tu navegador no soporta geolocalización. Abriendo WhatsApp sin GPS.');
      sendToWhatsApp(null);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        sendToWhatsApp({ lat: position.coords.latitude, lng: position.coords.longitude });
      },
      () => {
        toast.info('No se pudo obtener la ubicación. Abriendo WhatsApp de todas formas.');
        sendToWhatsApp(null);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }

  function sendToWhatsApp(coords: { lat: number; lng: number } | null) {
    if (!data) return;

    closeModal();
    setConfirming(false);
    setAlertSent(true);

    const alertBtn = document.getElementById('alert-btn');
    const statusMsg = document.getElementById('status-msg');

    if (alertBtn) {
      alertBtn.classList.replace('bg-red-600', 'bg-emerald-600');
      alertBtn.classList.replace('hover:bg-red-700', 'hover:bg-emerald-700');
      alertBtn.innerHTML = '<svg class="w-6 h-6" data-lucide="check-circle"></svg><span>WhatsApp Abierto</span>';
    }
    if (statusMsg) {
      statusMsg.innerText = 'Sigue las instrucciones en WhatsApp.';
    }

    let textMsg = `🚨 *¡EMERGENCIA MÉDICA!* 🚨\n`;
    textMsg += `Se ha escaneado el código de *${data.medicalData.userName}*.\n\n`;

    if (note.trim()) {
      textMsg += `*Reporte de estado:* ${note.trim()}\n\n`;
    } else {
      textMsg += `*Reporte de estado:* Requiere asistencia inmediata.\n\n`;
    }

    if (coords) {
      textMsg += `📍 *Ubicación actual:*\n`;
      textMsg += `https://www.google.com/maps?q=${coords.lat},${coords.lng}\n\n`;
    } else {
      textMsg += `📍 *Ubicación:* No disponible.\n\n`;
    }

    textMsg += `📋 *Ficha Médica Digital:*\n`;
    textMsg += `${window.location.href}\n`;

    const waUrl = `https://wa.me/${data.medicalData.emergencyPhone}?text=${encodeURIComponent(textMsg)}`;
    window.open(waUrl, '_blank');
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-red-600" />
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
          <h1 className="text-xl font-bold text-gray-900 mb-2">Ficha No Encontrada</h1>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const age = calculateAge(data.medicalData.dob);
  const hereditaryEntries = Object.entries(data.medicalData.hereditaryBackground || {});

  return (
    <div className="min-h-screen bg-gray-100 text-gray-800 font-sans flex items-start justify-center p-4 sm:items-center sm:p-6">
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
              <p className="text-4xl font-black text-red-700 tracking-tighter">{data.medicalData.bloodType}</p>
            </div>
            <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 text-center shadow-sm">
              <div className="flex items-center justify-center gap-1.5 text-amber-700 font-bold text-[10px] uppercase mb-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                <label>Alergias</label>
              </div>
              <p className="text-sm font-bold text-amber-900 leading-tight">{data.medicalData.allergies || 'Ninguna'}</p>
            </div>
          </div>

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
                  <p className="text-base font-extrabold text-gray-900 leading-tight">{data.medicalData.userName}</p>
                </div>
                <div className="text-right whitespace-nowrap">
                  <p className="text-[10px] text-gray-500 font-bold uppercase mb-0.5">Edad</p>
                  <p className="text-base font-extrabold text-gray-900">{age} años</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-gray-100">
                <div>
                  <p className="text-[10px] text-gray-500 font-bold uppercase mb-0.5">Nacimiento</p>
                  <p className="text-[11px] font-bold text-gray-800">{data.medicalData.dob}</p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-500 font-bold uppercase mb-0.5">Religión</p>
                  <p className="text-[11px] font-bold text-gray-800">{data.medicalData.religion || 'N/A'}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-gray-500 font-bold uppercase mb-0.5">Donador</p>
                  <p className="text-[11px] font-bold text-red-600">{data.medicalData.organDonor || 'No'}</p>
                </div>
              </div>
            </div>
          </div>

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
                  <p className="text-[10px] text-blue-100 font-bold uppercase tracking-wider mb-0.5">Número de Seguridad Social (NSS)</p>
                  <p className="text-2xl font-mono font-black text-white tracking-[0.1em]">{data.medicalData.nss || 'N/A'}</p>
                </div>
              </div>
              <div className="flex justify-between items-end pt-3 border-t border-white/20">
                <div>
                  <p className="text-[10px] text-blue-100 font-bold uppercase mb-0.5">CURP</p>
                  <p className="text-xs font-mono font-bold text-blue-50">{data.medicalData.curp || 'N/A'}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-blue-100 font-bold uppercase mb-0.5">Clínica/UMF</p>
                  <p className="text-xs font-bold text-blue-50">{data.medicalData.umf || 'N/A'}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2">
              <span className="h-px bg-gray-200 flex-1"></span>
              <span>Contactos de Emergencia</span>
              <span className="h-px bg-gray-200 flex-1"></span>
            </h2>

            {data.contacts.map((contact, index) => (
              <div key={contact.id || index} className={`bg-emerald-50 border border-emerald-100 rounded-2xl p-4 flex items-center justify-between ${index === 0 ? 'ring-2 ring-emerald-500/20' : ''}`}>
                <div className="flex items-center gap-3">
                  <div className="bg-emerald-600 p-2 rounded-lg text-white">
                    {index === 0 ? <Star className="w-5 h-5" /> : <Contact className="w-5 h-5" />}
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
                  <p className={`text-xs font-bold ${isNegados(data.medicalData.conditions) ? 'text-gray-400 italic' : 'text-gray-900'}`}>
                    {data.medicalData.conditions || 'No especificadas'}
                  </p>
                </div>
              </div>
              <div className="bg-gray-50 flex items-center gap-3 p-3 rounded-xl border border-gray-100">
                <Pill className="w-4 h-4 text-gray-400" />
                <div className="w-full">
                  <p className="text-[10px] text-gray-500 font-bold uppercase leading-none mb-1">Medicamentos Actuales</p>
                  <p className={`text-xs font-bold ${isNegados(data.medicalData.medications) ? 'text-gray-400 italic' : 'text-gray-900'}`}>
                    {data.medicalData.medications || 'No especificados'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {hereditaryEntries.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2">
                <span className="h-px bg-gray-200 flex-1"></span>
                <span>Antecedentes Heredofamiliares</span>
                <span className="h-px bg-gray-200 flex-1"></span>
              </h2>

              <div className="bg-orange-50/30 rounded-2xl p-4 border border-orange-100/50 space-y-2">
                {hereditaryEntries.map(([tipo, valor]) => (
                  <div key={tipo} className="flex justify-between items-baseline py-1 border-b border-orange-100/30 last:border-0 last:pb-0">
                    <span className="text-[10px] font-bold text-orange-800 uppercase">{tipo}:</span>
                    <span className="text-[10px] font-medium text-orange-950 text-right ml-4">{valor}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        <section className="px-5 pb-6 space-y-3">
          <button
            id="alert-btn"
            onClick={openModal}
            disabled={alertSent}
            className="w-full flex items-center justify-center gap-3 bg-red-600 hover:bg-red-700 disabled:bg-emerald-600 text-white py-3.5 px-6 rounded-xl text-base font-bold transition-all active:scale-95 shadow-lg shadow-red-500/20"
          >
            {alertSent ? <CheckCircle className="w-6 h-6" /> : <BellRing className="w-5 h-5" />}
            <span>{alertSent ? 'WhatsApp Abierto' : 'Avisar Familiares (GPS)'}</span>
          </button>
          <p id="status-msg" className="text-center text-[10px] font-bold text-gray-400 uppercase tracking-wider">Confirmar emergencia vía WhatsApp</p>
        </section>

        <footer className="bg-gray-50 border-t border-gray-100 p-4 flex flex-col items-center gap-2 text-gray-400">
          <ShieldCheck className="w-5 h-5 opacity-50" />
          <p className="text-xs font-medium text-center">Datos provistos por el paciente para primeros auxilios.</p>
        </footer>
      </main>

      <div
        id="emergency-modal"
        className={`fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 transition-opacity duration-300 ${modalOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={(e) => {
          if (e.target === e.currentTarget) closeModal();
        }}
      >
        <div
          id="modal-content"
          ref={modalContentRef}
          className={`bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl transform transition-transform duration-300 scale-95`}
        >
          <div className="flex flex-col items-center text-center mb-5">
            <div className="bg-red-100 text-red-600 p-3 rounded-full mb-3">
              <Siren className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-extrabold text-gray-900">Confirmar Emergencia</h3>
            <p className="text-sm text-gray-500 mt-1">¿El paciente requiere asistencia médica inmediata?</p>
          </div>

          <div className="mb-5 text-left">
            <label htmlFor="emergency-note" className="block text-xs font-bold text-gray-700 uppercase mb-2">Nota del estado (Opcional)</label>
            <textarea
              id="emergency-note"
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-red-500 focus:ring-0 outline-none transition-colors resize-none text-sm text-gray-800"
              placeholder="Ej: Accidente vial, persona desmayada..."
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              id="cancel-modal"
              onClick={closeModal}
              className="py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold rounded-xl transition-colors active:scale-95"
            >
              Cancelar
            </button>
            <button
              id="confirm-alert"
              onClick={confirmAlert}
              disabled={confirming}
              className="py-3 px-4 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white font-bold rounded-xl shadow-lg shadow-red-600/20 transition-colors active:scale-95 flex justify-center items-center"
            >
              {confirming ? <Loader2 className="w-5 h-5 animate-spin" /> : <span>Confirmar</span>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
