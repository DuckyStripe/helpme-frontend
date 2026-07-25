import { useState, useRef, useEffect } from 'react';
import { calculateAge } from '@/lib/utils';
import type { MedicalData, Contact, Vehicle } from '@/app/l/[uuid]/config/page';
import { getPlanLimits, type PlanType, PLAN_LABELS } from '@/lib/plans';
import { pinApi } from '@/lib/api';
import { toast } from '@/lib/toast';
import {
  Activity, Droplet, AlertTriangle, ShieldPlus, Contact as ContactIcon,
  Phone, Stethoscope, Pill, User, Calendar, Printer, Download, Pencil,
  Heart, CheckCircle, PhoneCall, Smartphone, Loader2, Cpu, Eye, Car, ShieldOff,
  Siren, Lock, MapPin, Send, MoreVertical,
} from 'lucide-react';

interface OwnerViewProps {
  medicalData: MedicalData;
  contacts: Contact[];
  vehicles?: Vehicle[];
  userDisabled?: boolean;
  onTogglePrivacy?: () => void;
  togglingPrivacy?: boolean;
  hasVerifiedContacts?: boolean;
  onSendAlert?: (comment: string, location: { lat: number; lng: number; address?: string }) => Promise<void>;
  sendingAlert?: boolean;
  onChangePin?: () => void;
  alerts?: Array<{
    id: string;
    sentAt: string;
    contacts: string[];
    location?: { lat: number; lng: number; address?: string } | null;
    comment?: string | null;
    senderType: string;
    rescuerPhone?: string | null;
    rescuerComment?: string | null;
    successCount: number;
    failCount: number;
  }>;
  onEdit: () => void;
  onInstallApp: () => void;
  onDownloadImage: () => Promise<void>;
  tagPlan?: PlanType;
  tagUuid?: string;
  previousPlan?: PlanType | null;
  expiresAt?: string | null;
}

export default function OwnerView({ medicalData: md, contacts, vehicles = [], userDisabled = false, onTogglePrivacy, togglingPrivacy = false, hasVerifiedContacts = false, onSendAlert, sendingAlert = false, onChangePin, alerts = [], onEdit, onInstallApp, onDownloadImage, tagPlan = 'PRINCIPAL', tagUuid, previousPlan, expiresAt }: OwnerViewProps) {
  const limits = getPlanLimits(tagPlan);
  const age = calculateAge(md.dob);
  const hasAllergies = md.allergies && md.allergies !== 'Ninguna conocida' && md.allergies !== 'Ninguna';
  const hasConditions = md.conditions && md.conditions.trim().length > 0;
  const hasMedications = md.medications && md.medications.trim().length > 0;
  const hasHereditary = md.hereditaryConditions && md.hereditaryConditions.trim().length > 0;
  const hasPacemaker = md.pacemakerICD && md.pacemakerICD !== 'No';
  const hasImplantContraceptive = md.implantContraceptive && md.implantContraceptive !== 'No';
  const hasImplantMammary = md.implantMammary && md.implantMammary !== 'No';
  const hasOrthopedicImplants = md.orthopedicImplants && md.orthopedicImplants !== 'No';
  const hasCochlearImplant = md.cochlearImplant && md.cochlearImplant !== 'No';
  const hasOcularProsthesis = md.ocularProsthesis && md.ocularProsthesis !== 'No';
  const hasAnyDevice = hasPacemaker || hasImplantContraceptive || hasImplantMammary || hasOrthopedicImplants || hasCochlearImplant || hasOcularProsthesis;
  const realContacts = contacts.filter((c) => c.name.trim() || c.phone.trim());
  const [downloading, setDownloading] = useState(false);
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [alertComment, setAlertComment] = useState('');
  const [alertLocation, setAlertLocation] = useState('');
  const [holdProgress, setHoldProgress] = useState(0);
  const [isHolding, setIsHolding] = useState(false);
  const [geolocationError, setGeolocationError] = useState(false);
  const holdTimerRef = useRef<NodeJS.Timeout | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const moreMenuRef = useRef<HTMLDivElement>(null);

  const [showRouteModal, setShowRouteModal] = useState(false);
  const [routeOrigin, setRouteOrigin] = useState('');
  const [routeDestination, setRouteDestination] = useState('');
  const [routeMinutes, setRouteMinutes] = useState(30);
  const [routeLoading, setRouteLoading] = useState(false);
  const [activeRoute, setActiveRoute] = useState<any | null>(null);

  async function loadActiveRoute() {
    if (!tagUuid) return;
    try {
      const stored = typeof window !== 'undefined' ? localStorage.getItem('pin_token') : null;
      if (!stored) return;
      const result = await pinApi.getActiveRoute(tagUuid, stored);
      setActiveRoute(result.activeRoute);
    } catch { /* not active */ }
  }

  useEffect(() => {
    if (limits.hasRouteMode && tagUuid) loadActiveRoute();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [limits.hasRouteMode, tagUuid]);

  async function handleStartRoute() {
    if (!routeOrigin.trim() || !routeDestination.trim() || !tagUuid) return;
    setRouteLoading(true);
    try {
      const stored = typeof window !== 'undefined' ? localStorage.getItem('pin_token') : null;
      if (!stored) { toast.error('Sesión expirada'); return; }
      await pinApi.startRoute(tagUuid, stored, routeOrigin, routeDestination, routeMinutes);
      toast.success('Ruta iniciada. Tus contactos han sido notificados.');
      setShowRouteModal(false);
      setRouteOrigin('');
      setRouteDestination('');
      setRouteMinutes(30);
      await loadActiveRoute();
    } catch (err: any) {
      toast.error(err.message || 'Error al iniciar ruta');
    } finally {
      setRouteLoading(false);
    }
  }

  async function handleConfirmRoute() {
    if (!tagUuid) return;
    setRouteLoading(true);
    try {
      const stored = typeof window !== 'undefined' ? localStorage.getItem('pin_token') : null;
      if (!stored) { toast.error('Sesión expirada'); return; }
      await pinApi.confirmRoute(tagUuid, stored);
      toast.success('Llegada confirmada. Tus contactos han sido notificados.');
      setActiveRoute(null);
    } catch (err: any) {
      toast.error(err.message || 'Error al confirmar llegada');
    } finally {
      setRouteLoading(false);
    }
  }

  async function handleCancelRoute() {
    if (!tagUuid) return;
    setRouteLoading(true);
    try {
      const stored = typeof window !== 'undefined' ? localStorage.getItem('pin_token') : null;
      if (!stored) { toast.error('Sesión expirada'); return; }
      await pinApi.cancelRoute(tagUuid, stored);
      toast.success('Ruta cancelada');
      setActiveRoute(null);
    } catch (err: any) {
      toast.error(err.message || 'Error al cancelar ruta');
    } finally {
      setRouteLoading(false);
    }
  }

  async function handleDownload() {
    setDownloading(true);
    try {
      await onDownloadImage();
    } finally {
      setDownloading(false);
    }
  }

  function startHold() {
    setIsHolding(true);
    setHoldProgress(0);
    let progress = 0;
    progressIntervalRef.current = setInterval(() => {
      progress += 100 / 30;
      if (progress >= 100) {
        progress = 100;
        if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
      }
      setHoldProgress(progress);
    }, 100);
    holdTimerRef.current = setTimeout(() => {
      if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
      setIsHolding(false);
      setShowAlertModal(true);
    }, 3000);
  }

  function cancelHold() {
    setIsHolding(false);
    setHoldProgress(0);
    if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
    if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
  }

  useEffect(() => {
    return () => {
      if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    };
  }, []);

  useEffect(() => {
    if (!showMoreMenu) return;
    function handleClickOutside(e: MouseEvent) {
      if (moreMenuRef.current && !moreMenuRef.current.contains(e.target as Node)) {
        setShowMoreMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showMoreMenu]);

  function requestGeolocation(): Promise<{ lat: number; lng: number } | null> {
    return new Promise((resolve) => {
      if (typeof navigator === 'undefined' || !navigator.geolocation) {
        setGeolocationError(true);
        resolve(null);
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => {
          setGeolocationError(true);
          resolve(null);
        },
        { enableHighAccuracy: false, timeout: 10000 }
      );
    });
  }

  async function handleSendAlert() {
    if (!onSendAlert) return;

    let location: { lat: number; lng: number; address?: string } | null = null;
    if (!geolocationError) {
      const geo = await requestGeolocation();
      if (geo) {
        location = geo;
      }
    }

    if (!location && alertLocation.trim()) {
      location = { lat: 0, lng: 0, address: alertLocation.trim() };
    }

    if (!location) {
      return;
    }

    await onSendAlert(alertComment.trim(), location);
    setShowAlertModal(false);
    setAlertComment('');
    setAlertLocation('');
    setGeolocationError(false);
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
              {tagUuid && (
                <button
                  onClick={() => {
                    const url = `${window.location.origin}/l/${tagUuid}`;
                    const text = `Mira mi perfil de emergencia: ${url}`;
                    const waUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
                    try {
                      window.open(waUrl, '_blank');
                    } catch {
                      navigator.clipboard.writeText(text).then(() => {
                        toast.success('Link copiado al portapapeles');
                      }).catch(() => {
                        toast.error('No se pudo compartir');
                      });
                    }
                  }}
                  className="p-2 bg-white/10 hover:bg-white/20 rounded-xl transition-colors active:scale-95 [touch-action:manipulation]"
                  aria-label="Compartir perfil por WhatsApp"
                  title="Compartir perfil"
                >
                  <Phone className="w-5 h-5" />
                </button>
              )}
              <div className="relative" ref={moreMenuRef}>
                <button
                  onClick={() => setShowMoreMenu((v) => !v)}
                  className="p-2 bg-white/10 hover:bg-white/20 rounded-xl transition-colors active:scale-95 [touch-action:manipulation]"
                  aria-label="Más opciones"
                  aria-haspopup="menu"
                  aria-expanded={showMoreMenu}
                  title="Más opciones"
                >
                  <MoreVertical className="w-5 h-5" />
                </button>
                {showMoreMenu && (
                  <div
                    role="menu"
                    className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl shadow-2xl border border-gray-100 py-2 z-20 text-gray-700"
                  >
                    {tagUuid && (
                      <button
                        role="menuitem"
                        onClick={() => { setShowMoreMenu(false); window.open(`/l/${tagUuid}`, '_blank'); }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium hover:bg-gray-50 transition-colors [touch-action:manipulation]"
                      >
                        <Eye className="w-4 h-4 text-gray-400" />
                        Vista previa del rescatista
                      </button>
                    )}
                    <button
                      role="menuitem"
                      onClick={() => { setShowMoreMenu(false); onInstallApp(); }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium hover:bg-gray-50 transition-colors [touch-action:manipulation]"
                    >
                      <Smartphone className="w-4 h-4 text-gray-400" />
                      Agregar a pantalla de inicio
                    </button>
                    {limits.hasDownloads && (
                      <button
                        role="menuitem"
                        onClick={() => { setShowMoreMenu(false); handleDownload(); }}
                        disabled={downloading}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium hover:bg-gray-50 transition-colors disabled:opacity-60 [touch-action:manipulation]"
                      >
                        {downloading ? <Loader2 className="w-4 h-4 animate-spin text-gray-400" /> : <Download className="w-4 h-4 text-gray-400" />}
                        Descargar imagen
                      </button>
                    )}
                    <button
                      role="menuitem"
                      onClick={() => { setShowMoreMenu(false); window.print(); }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium hover:bg-gray-50 transition-colors [touch-action:manipulation]"
                    >
                      <Printer className="w-4 h-4 text-gray-400" />
                      Imprimir
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {previousPlan && (
            <div className="mb-3 bg-amber-500/20 backdrop-blur-sm border border-amber-400/30 rounded-xl p-3">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-300 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-amber-200">Plan degradado</p>
                  <p className="text-xs text-amber-300/80 mt-0.5">
                    Tu plan {PLAN_LABELS[previousPlan]} venció. Ahora tienes funciones del plan Principal.
                    {expiresAt && ` Venció el ${new Date(expiresAt).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })}.`}
                  </p>
                  <p className="text-xs text-amber-200 mt-1 font-medium">
                    Renueva para recuperar todas las funciones de {PLAN_LABELS[previousPlan]}.
                  </p>
                </div>
              </div>
            </div>
          )}

          {onTogglePrivacy && limits.hasPrivateMode && (
            <div className="mb-3 bg-white/10 backdrop-blur-sm rounded-xl p-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                {userDisabled ? (
                  <ShieldOff className="w-4 h-4 text-amber-300" />
                ) : (
                  <CheckCircle className="w-4 h-4 text-green-300" />
                )}
                <span className="text-xs font-semibold">
                  {userDisabled ? 'Ficha bloqueada' : 'Ficha pública'}
                </span>
              </div>
              <button
                onClick={onTogglePrivacy}
                disabled={togglingPrivacy}
                className={`relative w-11 h-6 rounded-full transition-colors disabled:opacity-50 ${
                  userDisabled ? 'bg-amber-500' : 'bg-green-500'
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                    userDisabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          )}

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

            {hasAnyDevice && (
              <div className="bg-slate-50 border-2 border-slate-200 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Cpu className="w-5 h-5 text-slate-600" />
                  <p className="text-[10px] font-bold uppercase tracking-wide text-slate-700">Dispositivos Medicos Implantados</p>
                </div>
                <div className="space-y-2">
                  {hasPacemaker && (
                    <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 border border-red-200">
                      <Activity className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-bold text-red-900">Marcapasos / Cardiodesfibrilador</p>
                        {md.pacemakerICD && md.pacemakerICD !== 'Si' && <p className="text-xs text-red-700 mt-0.5">{md.pacemakerICD}</p>}
                        <p className="text-[10px] text-red-600 mt-1 font-medium">Interfiere con colocacion de paletas o parches de desfibrilacion</p>
                      </div>
                    </div>
                  )}
                  {hasImplantContraceptive && (
                    <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200">
                      <ShieldPlus className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-bold text-amber-900">Implante Anticonceptivo Subdermico</p>
                        {md.implantContraceptive && md.implantContraceptive !== 'Si' && <p className="text-xs text-amber-700 mt-0.5">{md.implantContraceptive}</p>}
                        <p className="text-[10px] text-amber-600 mt-1 font-medium">Interfiere con vias IV y manguito de presion arterial</p>
                      </div>
                    </div>
                  )}
                  {hasImplantMammary && (
                    <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200">
                      <ShieldPlus className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-bold text-amber-900">Implantes Mamarios</p>
                        {md.implantMammary && md.implantMammary !== 'Si' && <p className="text-xs text-amber-700 mt-0.5">{md.implantMammary}</p>}
                        <p className="text-[10px] text-amber-600 mt-1 font-medium">Interfiere con RCP y parches de desfibrilacion por impedancia</p>
                      </div>
                    </div>
                  )}
                  {hasOrthopedicImplants && (
                    <div className="flex items-start gap-2 p-3 rounded-lg bg-orange-50 border border-orange-200">
                      <ShieldPlus className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-bold text-orange-900">Implantes Ortopedicos / Neuroestimuladores</p>
                        {md.orthopedicImplants && md.orthopedicImplants !== 'Si' && <p className="text-xs text-orange-700 mt-0.5">{md.orthopedicImplants}</p>}
                        <p className="text-[10px] text-orange-600 mt-1 font-medium">Interfiere con manipulacion de extremidades y equipos electromagneticos</p>
                      </div>
                    </div>
                  )}
                  {hasCochlearImplant && (
                    <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-50 border border-blue-200">
                      <Cpu className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-bold text-blue-900">Implante Coclear / Dispositivo Auditivo</p>
                        {md.cochlearImplant && md.cochlearImplant !== 'Si' && <p className="text-xs text-blue-700 mt-0.5">{md.cochlearImplant}</p>}
                        <p className="text-[10px] text-blue-600 mt-1 font-medium">Interfiere con collares cervicales e inmovilizadores de cabeza</p>
                      </div>
                    </div>
                  )}
                  {hasOcularProsthesis && (
                    <div className="flex items-start gap-2 p-3 rounded-lg bg-indigo-50 border border-indigo-200">
                      <Eye className="w-4 h-4 text-indigo-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-bold text-indigo-900">Protesis Ocular</p>
                        {md.ocularProsthesis && md.ocularProsthesis !== 'Si' && <p className="text-xs text-indigo-700 mt-0.5">{md.ocularProsthesis}</p>}
                        <p className="text-[10px] text-indigo-600 mt-1 font-medium">Interfiere con evaluacion neurologica (reflejos pupilares)</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
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

        {limits.hasVehicles && vehicles.length > 0 && (
          <section className="px-5 pt-5 pb-5">
            <h2 className="text-xs font-black text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Car className="w-4 h-4" />
              Mis Vehículos
            </h2>
            <div className="space-y-3">
              {vehicles.map((vehicle, index) => (
                <div key={vehicle.id || index} className="bg-gray-50 border-2 border-gray-200 rounded-2xl p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      vehicle.type === 'AUTO' ? 'bg-blue-100' : vehicle.type === 'MOTO' ? 'bg-amber-100' : 'bg-green-100'
                    }`}>
                      <Car className={`w-5 h-5 ${
                        vehicle.type === 'AUTO' ? 'text-blue-600' : vehicle.type === 'MOTO' ? 'text-amber-600' : 'text-green-600'
                      }`} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900">
                        {vehicle.brand} {vehicle.model}
                      </p>
                      <p className="text-xs text-gray-500">
                        {vehicle.type === 'AUTO' ? 'Auto' : vehicle.type === 'MOTO' ? 'Moto' : 'Bicicleta'}
                        {vehicle.year ? ` · ${vehicle.year}` : ''}
                        {vehicle.color ? ` · ${vehicle.color}` : ''}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2 text-xs text-gray-600">
                    {vehicle.plate && (
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-700">Placa:</span>
                        <span className="font-mono bg-gray-100 px-2 py-0.5 rounded">{vehicle.plate}</span>
                      </div>
                    )}
                    {vehicle.type === 'MOTO' && vehicle.cylinder && (
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-700">Cilindraje:</span>
                        <span>{vehicle.cylinder}</span>
                      </div>
                    )}
                    {vehicle.type === 'BICICLETA' && vehicle.bikeType && (
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-700">Tipo:</span>
                        <span>{vehicle.bikeType}</span>
                      </div>
                    )}
                    {vehicle.insurer && (
                      <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 mt-2">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-semibold text-blue-900">{vehicle.insurer.name}</p>
                            {vehicle.policyNumber && (
                              <p className="text-xs text-blue-700">Póliza: {vehicle.policyNumber}</p>
                            )}
                          </div>
                          <a
                            href={`tel:${vehicle.insurer.phone}`}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 active:scale-95 transition-all"
                          >
                            <Phone className="w-3.5 h-3.5" />
                            Llamar
                          </a>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {limits.hasAlertHistory && alerts.length > 0 && (
          <section className="px-5 pt-5 pb-5">
            <h2 className="text-xs font-black text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Siren className="w-4 h-4" />
              Historial de Alertas
            </h2>
            <div className="space-y-2">
              {alerts.slice(0, 10).map((alert) => {
                const date = new Date(alert.sentAt);
                const dateStr = date.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });
                const timeStr = date.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
                return (
                  <div key={alert.id} className="bg-gray-50 border border-gray-200 rounded-xl p-3">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                          alert.senderType === 'OWNER'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-blue-100 text-blue-700'
                        }`}>
                          {alert.senderType === 'OWNER' ? '🔴 Dueño' : '🔵 Rescatista'}
                        </span>
                        <span className="text-xs text-gray-500">{dateStr} {timeStr}</span>
                      </div>
                      <div className="flex items-center gap-1 text-xs">
                        <span className="text-green-600 font-medium">{alert.successCount}✓</span>
                        {alert.failCount > 0 && (
                          <span className="text-red-500 font-medium">{alert.failCount}✗</span>
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-gray-600">
                      Enviada a: {alert.contacts.join(', ')}
                    </p>
                    {alert.location?.address && (
                      <p className="text-xs text-gray-500 mt-1">📍 {alert.location.address}</p>
                    )}
                    {(alert.comment || alert.rescuerComment) && (
                      <p className="text-xs text-gray-500 mt-1 italic">
                        &ldquo;{alert.comment || alert.rescuerComment}&rdquo;
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}

        <section className="no-print px-5 pb-5 space-y-3">
          {hasVerifiedContacts && onSendAlert && (
            <div className="relative">
              <button
                onMouseDown={startHold}
                onMouseUp={cancelHold}
                onMouseLeave={cancelHold}
                onTouchStart={startHold}
                onTouchEnd={cancelHold}
                onTouchCancel={cancelHold}
                disabled={sendingAlert}
                className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white font-bold py-4 px-6 rounded-2xl shadow-lg shadow-red-600/30 active:scale-95 transition-all disabled:opacity-50 relative overflow-hidden min-h-[56px] [touch-action:manipulation]"
              >
                {isHolding && (
                  <div
                    className="absolute left-0 top-0 h-full bg-red-800/30 transition-all duration-100"
                    style={{ width: `${holdProgress}%` }}
                  />
                )}
                {sendingAlert ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Siren className="w-5 h-5" />
                )}
                <span>{isHolding ? 'Mantén presionado...' : '🚨 Enviar Alerta de Emergencia'}</span>
              </button>
              {isHolding && holdProgress < 100 && (
                <div className="mt-1 h-1 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-red-600 rounded-full transition-all duration-100"
                    style={{ width: `${holdProgress}%` }}
                  />
                </div>
              )}
            </div>
          )}

          <button
            onClick={onEdit}
            className="w-full flex items-center justify-center gap-2 bg-gray-900 hover:bg-gray-800 text-white font-semibold py-3.5 px-6 rounded-xl transition-colors min-h-[48px] [touch-action:manipulation]"
          >
            <Pencil className="w-4 h-4" />
            <span>Editar mis Datos</span>
          </button>

          {onChangePin && limits.hasPrivateMode && (
            <button
              onClick={onChangePin}
              className="w-full flex items-center justify-center gap-1.5 text-gray-500 hover:text-gray-700 font-medium text-sm py-2 transition-colors [touch-action:manipulation]"
            >
              <Lock className="w-3.5 h-3.5" />
              Cambiar PIN
            </button>
          )}
        </section>

        {limits.hasRouteMode && (
          <section className="px-5 pb-5 no-print border-t border-gray-100 pt-5">
            {activeRoute ? (
              <div className="bg-emerald-50 border-2 border-emerald-200 rounded-2xl p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                    <MapPin className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-emerald-800">Ruta Activa</p>
                    <p className="text-xs text-emerald-600">{activeRoute.origin} → {activeRoute.destination}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleConfirmRoute}
                    disabled={routeLoading}
                    className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2.5 px-4 rounded-xl transition-colors disabled:opacity-50 text-sm"
                  >
                    {routeLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                    Confirmar Llegada
                  </button>
                  <button
                    onClick={handleCancelRoute}
                    disabled={routeLoading}
                    className="flex items-center justify-center gap-2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-2.5 px-4 rounded-xl transition-colors disabled:opacity-50 text-sm"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowRouteModal(true)}
                className="w-full flex items-center justify-center gap-2 bg-white border-2 border-blue-200 hover:bg-blue-50 text-blue-700 font-semibold py-3 px-6 rounded-xl transition-colors min-h-[48px] [touch-action:manipulation]"
              >
                <MapPin className="w-5 h-5" />
                Modo Ruta
              </button>
            )}
          </section>
        )}

        <footer className="bg-gray-50 border-t border-gray-200 p-5 flex flex-col items-center gap-2 text-gray-500">
          <p className="text-xs font-medium">Esta es tu ficha, tal como la verá quien te asista en una emergencia.</p>
        </footer>
      </main>

      {showAlertModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-4" onClick={() => setShowAlertModal(false)}>
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6 sm:p-8" onClick={(e) => e.stopPropagation()}>
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-14 h-14 bg-red-100 rounded-2xl mb-4">
                <Siren className="w-7 h-7 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Enviar Alerta de Emergencia</h3>
              <p className="text-sm text-gray-500 mt-2">Se enviará tu información médica y ubicación a tus contactos de emergencia.</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">¿Qué está pasando? (opcional)</label>
                <textarea
                  value={alertComment}
                  onChange={(e) => setAlertComment(e.target.value)}
                  rows={2}
                  placeholder="Ej: Me siento mal, necesito ayuda..."
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500 transition-all resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {geolocationError ? 'Ubicación aproximada (obligatorio)' : 'Ubicación aproximada (opcional)'}
                </label>
                <div className="flex gap-2">
                  <MapPin className="w-5 h-5 text-gray-400 mt-3 flex-shrink-0" />
                  <input
                    type="text"
                    value={alertLocation}
                    onChange={(e) => setAlertLocation(e.target.value)}
                    placeholder="Ej: Calle Reforma 123, CDMX"
                    className="flex-1 h-12 px-4 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500 transition-all"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => { setShowAlertModal(false); setAlertComment(''); setAlertLocation(''); setGeolocationError(false); }}
                className="flex-1 py-3 px-4 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSendAlert}
                disabled={sendingAlert || (!alertLocation.trim() && !geolocationError)}
                className="flex-1 py-3 px-4 bg-red-600 text-white font-semibold rounded-xl hover:bg-red-700 transition-colors shadow-lg shadow-red-600/30 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {sendingAlert ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                Enviar Alerta
              </button>
            </div>
          </div>
        </div>
      )}

      {showRouteModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-4" onClick={() => setShowRouteModal(false)}>
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6 sm:p-8" onClick={(e) => e.stopPropagation()}>
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-14 h-14 bg-blue-100 rounded-2xl mb-4">
                <MapPin className="w-7 h-7 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Modo Ruta</h3>
              <p className="text-sm text-gray-500 mt-2">Tus contactos serán notificados cuando inicies y confirmes tu llegada.</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Origen</label>
                <input
                  type="text"
                  value={routeOrigin}
                  onChange={(e) => setRouteOrigin(e.target.value)}
                  placeholder="Ej: Casa, Oficina..."
                  className="w-full h-12 px-4 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Destino</label>
                <input
                  type="text"
                  value={routeDestination}
                  onChange={(e) => setRouteDestination(e.target.value)}
                  placeholder="Ej: Casa, Gimnasio..."
                  className="w-full h-12 px-4 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tiempo estimado (minutos)</label>
                <input
                  type="number"
                  min={5}
                  max={480}
                  value={routeMinutes}
                  onChange={(e) => setRouteMinutes(parseInt(e.target.value) || 30)}
                  className="w-full h-12 px-4 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
                />
                <p className="text-xs text-gray-400 mt-1">Se agregará un buffer de ±10 minutos para la alerta automática</p>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowRouteModal(false)}
                className="flex-1 py-3 px-4 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleStartRoute}
                disabled={routeLoading || !routeOrigin.trim() || !routeDestination.trim()}
                className="flex-1 py-3 px-4 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/30 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {routeLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                Iniciar Ruta
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
