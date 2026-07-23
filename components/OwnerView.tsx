'use client';

import { useState } from 'react';
import { calculateAge } from '@/lib/utils';
import type { MedicalData, Contact } from '@/app/l/[uuid]/config/page';
import {
  Activity, Droplet, AlertTriangle, ShieldPlus, Contact as ContactIcon,
  Phone, Stethoscope, Pill, User, Calendar, Printer, Download, Pencil,
  Heart, CheckCircle, PhoneCall, Smartphone, Loader2,
} from 'lucide-react';

interface OwnerViewProps {
  medicalData: MedicalData;
  contacts: Contact[];
  onEdit: () => void;
  onInstallApp: () => void;
  onDownloadImage: () => Promise<void>;
}

export default function OwnerView({ medicalData: md, contacts, onEdit, onInstallApp, onDownloadImage }: OwnerViewProps) {
  const age = calculateAge(md.dob);
  const hasAllergies = md.allergies && md.allergies !== 'Ninguna conocida' && md.allergies !== 'Ninguna';
  const hasConditions = md.conditions && md.conditions.trim().length > 0;
  const hasMedications = md.medications && md.medications.trim().length > 0;
  const hasHereditary = md.hereditaryConditions && md.hereditaryConditions.trim().length > 0;
  const realContacts = contacts.filter((c) => c.name.trim() || c.phone.trim());
  const [downloading, setDownloading] = useState(false);

  async function handleDownload() {
    setDownloading(true);
    try {
      await onDownloadImage();
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 text-gray-900 flex items-start justify-center p-0 sm:p-4 sm:items-center">
      <style>{`
        @media print {
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
          body { background: white !important; }
          .no-print { display: none !important; }
          main { box-shadow: none !important; border: none !important; }
        }
      `}</style>
      <main className="w-full max-w-md bg-white sm:rounded-3xl shadow-2xl overflow-hidden relative z-10 min-h-screen sm:min-h-0">
        <header className="bg-gradient-to-br from-red-600 via-red-700 to-red-800 text-white px-5 pt-6 pb-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="bg-white/20 backdrop-blur-sm p-2 rounded-xl">
                <Activity className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-red-100">Ficha Médica</p>
                <p className="text-[9px] text-red-200 uppercase tracking-widest">Mi respaldo</p>
              </div>
            </div>
            <div className="no-print flex items-center gap-2">
              <button
                onClick={onInstallApp}
                className="p-2 bg-white/10 hover:bg-white/20 rounded-xl transition-colors active:scale-95"
                aria-label="Agregar a pantalla de inicio"
                title="Agregar a pantalla de inicio"
              >
                <Smartphone className="w-5 h-5" />
              </button>
              <button
                onClick={handleDownload}
                disabled={downloading}
                className="p-2 bg-white/10 hover:bg-white/20 rounded-xl transition-colors active:scale-95 disabled:opacity-60"
                aria-label="Descargar imagen de mi ficha"
                title="Descargar imagen"
              >
                {downloading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
              </button>
              <button
                onClick={() => window.print()}
                className="p-2 bg-white/10 hover:bg-white/20 rounded-xl transition-colors active:scale-95"
                aria-label="Imprimir ficha"
                title="Imprimir"
              >
                <Printer className="w-5 h-5" />
              </button>
              <button
                onClick={onEdit}
                className="p-2 bg-white/10 hover:bg-white/20 rounded-xl transition-colors active:scale-95"
                aria-label="Editar mis datos"
                title="Editar"
              >
                <Pencil className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="mb-4 flex items-center gap-4">
            {md.photo && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={md.photo}
                alt={md.userName || 'Foto del paciente'}
                className="w-24 h-24 rounded-full object-cover border-2 border-white/40 flex-shrink-0"
              />
            )}
            <div>
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
          </div>

          <div className="bg-white/15 backdrop-blur-sm rounded-2xl p-4 flex items-center justify-between border border-white/20">
            <div className="flex items-center gap-3">
              <div className="bg-white p-2.5 rounded-xl shadow-lg">
                <Droplet className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-red-100">Tipo de Sangre</p>
                <p className="text-3xl font-black tracking-tight">{md.bloodType || '—'}</p>
              </div>
            </div>
            {md.organDonor === 'Si' && (
              <div className="bg-green-500/90 px-3 py-1.5 rounded-lg">
                <p className="text-[10px] font-bold uppercase text-white">Donador</p>
              </div>
            )}
          </div>
        </header>

        <section className="px-5 -mt-3 relative z-10">
          <div className="grid grid-cols-2 gap-3">
            <div className={`rounded-2xl p-4 border-2 shadow-lg ${hasAllergies ? 'bg-amber-50 border-amber-300' : 'bg-green-50 border-green-200'}`}>
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

            {md.emergencyPhone && (
              <div className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-4 shadow-lg">
                <div className="flex items-center gap-1.5 mb-2">
                  <Phone className="w-4 h-4 text-blue-600" />
                  <span className="text-[10px] font-bold uppercase tracking-wide text-blue-700">Tel. Personal</span>
                </div>
                <a href={`tel:+52${md.emergencyPhone}`} className="text-sm font-bold text-blue-900 font-mono tracking-wide hover:underline block">
                  {md.emergencyPhone}
                </a>
              </div>
            )}
          </div>
        </section>

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
                  <p className={`text-sm font-bold ${md.organDonor === 'Si' ? 'text-green-600' : 'text-gray-600'}`}>{md.organDonor}</p>
                </div>
              )}
            </div>
          </div>
        </section>

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

        <section className="px-5 pt-5">
          <h2 className="text-xs font-black text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
            <Stethoscope className="w-4 h-4" />
            Perfil Médico
          </h2>
          <div className="space-y-2.5">
            <div className={`rounded-xl p-4 border-2 flex items-start gap-3 ${hasConditions ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-100'}`}>
              <Stethoscope className={`w-5 h-5 flex-shrink-0 mt-0.5 ${hasConditions ? 'text-red-500' : 'text-gray-400'}`} />
              <div className="flex-1 min-w-0">
                <p className={`text-[10px] font-bold uppercase tracking-wide mb-1 ${hasConditions ? 'text-red-700' : 'text-gray-500'}`}>Condiciones Crónicas</p>
                <p className={`text-sm font-semibold ${hasConditions ? 'text-red-900' : 'text-gray-500'}`}>{hasConditions ? md.conditions : 'Ninguna'}</p>
              </div>
            </div>

            <div className={`rounded-xl p-4 border-2 flex items-start gap-3 ${hasMedications ? 'bg-purple-50 border-purple-200' : 'bg-gray-50 border-gray-100'}`}>
              <Pill className={`w-5 h-5 flex-shrink-0 mt-0.5 ${hasMedications ? 'text-purple-500' : 'text-gray-400'}`} />
              <div className="flex-1 min-w-0">
                <p className={`text-[10px] font-bold uppercase tracking-wide mb-1 ${hasMedications ? 'text-purple-700' : 'text-gray-500'}`}>Medicamentos Actuales</p>
                <p className={`text-sm font-semibold ${hasMedications ? 'text-purple-900' : 'text-gray-500'}`}>{hasMedications ? md.medications : 'Ninguno'}</p>
              </div>
            </div>

            {hasHereditary && (
              <div className="bg-orange-50 border-2 border-orange-200 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Heart className="w-5 h-5 text-orange-500" />
                  <p className="text-[10px] font-bold uppercase tracking-wide text-orange-700">Antecedentes Heredofamiliares</p>
                </div>
                <div className="space-y-2">
                  {md.hereditaryConditions.split('|').map((item, idx) => {
                    const parts = item.split(' - ');
                    const name = parts[0] || '';
                    const line = parts[1] || '';
                    const isActive = parts[2] === 'si';
                    return (
                      <div key={idx} className={`flex items-center justify-between p-3 rounded-lg border-2 ${isActive ? 'bg-red-100 border-red-300' : 'bg-gray-100 border-gray-200'}`}>
                        <div className="flex items-center gap-2">
                          {isActive ? <AlertTriangle className="w-4 h-4 text-red-600" /> : <CheckCircle className="w-4 h-4 text-gray-500" />}
                          <div>
                            <p className={`text-sm font-bold ${isActive ? 'text-red-900' : 'text-gray-700'}`}>{name}</p>
                            <p className="text-[10px] text-gray-500 uppercase">Línea {line}</p>
                          </div>
                        </div>
                        <div className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase ${isActive ? 'bg-red-600 text-white' : 'bg-gray-300 text-gray-600'}`}>
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

        {realContacts.length > 0 && (
          <section className="px-5 pt-5 pb-5">
            <h2 className="text-xs font-black text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
              <PhoneCall className="w-4 h-4" />
              Contactos de Emergencia
            </h2>
            <div className="space-y-2.5">
              {realContacts.map((contact, index) => (
                <div key={index} className="bg-emerald-50 border-2 border-emerald-200 rounded-2xl p-4 flex items-center justify-between shadow-sm">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="bg-emerald-600 p-2.5 rounded-xl text-white flex-shrink-0">
                      <ContactIcon className="w-5 h-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-emerald-900 truncate">{contact.name}</p>
                      <p className="text-[11px] text-emerald-600 font-medium">{contact.relationship}</p>
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

        <section className="no-print px-5 pb-5">
          <button
            onClick={onEdit}
            className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white font-bold py-4 px-6 rounded-2xl shadow-lg shadow-red-600/30 active:scale-95 transition-all"
          >
            <Pencil className="w-5 h-5" />
            <span>Editar mis Datos</span>
          </button>
        </section>

        <footer className="bg-gray-50 border-t border-gray-200 p-5 flex flex-col items-center gap-2 text-gray-500">
          <p className="text-xs font-medium">Esta es tu ficha, tal como la verá quien te asista en una emergencia.</p>
        </footer>
      </main>
    </div>
  );
}
