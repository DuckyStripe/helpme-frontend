'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { pinApi } from '@/lib/api';
import { toast } from '@/lib/toast';
import {
  Shield, Lock, Activity, Plus, Trash2, Save, CheckCircle, Loader2, AlertTriangle,
  User, FileText, Eye, EyeOff, ChevronDown, ChevronUp,
  Stethoscope, AlertCircle, Contact,
} from 'lucide-react';

type TagStatus = 'VIRGIN' | 'INCOMPLETE' | 'ACTIVE' | 'SUSPENDED';

interface Contact {
  name: string;
  relationship: string;
  phone: string;
}

interface MedicalData {
  userName: string;
  dob: string;
  gender: string;
  religion: string;
  organDonor: string;
  bloodType: string;
  emergencyPhone: string;
  allergies: string;
  conditions: string;
  medications: string;
  hereditaryConditions: string;
  curp: string;
  nss: string;
  pob: string;
  umf: string;
}

const emptyMedicalData: MedicalData = {
  userName: '',
  dob: '',
  gender: '',
  religion: '',
  organDonor: 'No',
  bloodType: '',
  emergencyPhone: '',
  allergies: '',
  conditions: '',
  medications: '',
  hereditaryConditions: '',
  curp: '',
  nss: '',
  pob: '',
  umf: '',
};

const bloodTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const genders = ['Masculino', 'Femenino', 'Otro'];

const religions = [
  'Catolica',
  'Cristiana',
  'Evangelica',
  'Protestante',
  'Judia',
  'Musulmana',
  'Hindu',
  'Budista',
  'Testigo de Jehova',
  'Mormona',
  'Atea',
  'Agnostica',
  'Otra',
];

const days = Array.from({ length: 31 }, (_, i) => i + 1);
const months = [
  { value: 1, label: 'Enero' },
  { value: 2, label: 'Febrero' },
  { value: 3, label: 'Marzo' },
  { value: 4, label: 'Abril' },
  { value: 5, label: 'Mayo' },
  { value: 6, label: 'Junio' },
  { value: 7, label: 'Julio' },
  { value: 8, label: 'Agosto' },
  { value: 9, label: 'Septiembre' },
  { value: 10, label: 'Octubre' },
  { value: 11, label: 'Noviembre' },
  { value: 12, label: 'Diciembre' },
];
const currentYear = new Date().getFullYear();
const years = Array.from({ length: 100 }, (_, i) => currentYear - i);

const umfClinics = [
  'UMF 1',
  'UMF 2',
  'UMF 3',
  'UMF 4',
  'UMF 5',
  'UMF 6',
  'UMF 7',
  'UMF 8',
  'UMF 9',
  'UMF 10',
  'UMF 11',
  'UMF 12',
  'UMF 13',
  'UMF 14',
  'UMF 15',
  'UMF 16',
  'UMF 17',
  'UMF 18',
  'UMF 19',
  'UMF 20',
  'UMF 21',
  'UMF 22',
  'UMF 23',
  'UMF 24',
  'UMF 25',
  'UMF 26',
  'UMF 27',
  'UMF 28',
  'UMF 29',
  'UMF 30',
  'UMF 31',
  'UMF 32',
  'UMF 33',
  'UMF 34',
  'UMF 35',
  'Otra',
];

const hereditaryConditions = [
  'Diabetes',
  'Hipertension',
  'Cancer',
  'Asma',
  'Epilepsia',
  'Enfermedad cardiaca',
  'Enfermedad renal',
  'Artritis',
  'Obesidad',
  'Depresion',
  'Alzheimer',
  'Parkinson',
  'Osteoporosis',
  'Glaucoma',
  'Hemofilia',
  'Otra',
];

function PinInput({ length, value, onChange, showPin }: { length: number; value: string; onChange: (v: string) => void; showPin: boolean }) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleClick = () => inputRef.current?.focus();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '');
    onChange(raw.slice(0, length));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && value.length === 0) return;
    if (e.key === 'Backspace') {
      e.preventDefault();
      onChange(value.slice(0, -1));
    }
  };

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  return (
    <div className="flex justify-center gap-3 cursor-pointer" onClick={handleClick}>
      {Array.from({ length }).map((_, i) => (
        <div
          key={i}
          className={`w-12 h-14 sm:w-14 sm:h-16 rounded-xl border-2 flex items-center justify-center text-2xl font-bold transition-all duration-200 ${
            i < value.length
              ? 'border-red-500 bg-red-50 text-red-700 scale-105 shadow-md shadow-red-500/20'
              : i === value.length
              ? 'border-red-400 bg-white animate-pulse'
              : 'border-gray-200 bg-gray-50'
          }`}
        >
          {i < value.length ? (showPin ? value[i] : '•') : ''}
        </div>
      ))}
      <input
        ref={inputRef}
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        className="absolute opacity-0 w-0 h-0"
        autoFocus
        maxLength={length}
        aria-label="PIN input"
      />
    </div>
  );
}

function AnimatedCheckmark() {
  return (
    <div className="relative w-20 h-20 mx-auto">
      <div className="absolute inset-0 bg-green-500 rounded-full animate-ping opacity-20" />
      <div className="absolute inset-0 bg-green-500 rounded-full animate-pulse opacity-30" />
      <div className="relative bg-gradient-to-br from-green-500 to-green-600 rounded-full w-20 h-20 flex items-center justify-center shadow-xl shadow-green-500/30">
        <CheckCircle className="w-10 h-10 text-white animate-bounce" />
      </div>
    </div>
  );
}

function SectionCard({
  icon: Icon,
  title,
  children,
  defaultOpen = true,
}: {
  icon: React.ElementType;
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden transition-all duration-300">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-4 sm:p-5 hover:bg-gray-50/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center flex-shrink-0">
            <Icon className="w-5 h-5 text-red-600" />
          </div>
          <h3 className="text-base font-bold text-gray-900">{title}</h3>
        </div>
        {open ? (
          <ChevronUp className="w-5 h-5 text-gray-400 flex-shrink-0" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />
        )}
      </button>
      <div
        className={`transition-all duration-300 ease-in-out ${
          open ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'
        } overflow-hidden`}
      >
        <div className="px-4 sm:px-5 pb-4 sm:pb-5 pt-0 space-y-4 border-t border-gray-100">
          <div className="pt-4">{children}</div>
        </div>
      </div>
    </div>
  );
}

function InputField({
  label,
  required,
  ...props
}: {
  label: string;
  required?: boolean;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-semibold text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <input
        {...props}
        className={`w-full h-12 px-4 border border-gray-200 rounded-xl text-sm bg-gray-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500 transition-all ${props.className || ''}`}
      />
    </div>
  );
}

function TextAreaField({
  label,
  ...props
}: {
  label: string;
} & React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-semibold text-gray-700">{label}</label>
      <textarea
        {...props}
        className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm bg-gray-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500 transition-all resize-none"
      />
    </div>
  );
}

export default function ConfigPage() {
  const params = useParams();
  const uuid = params.uuid as string;

  const [status, setStatus] = useState<TagStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [pinError, setPinError] = useState('');
  const [pinMode, setPinMode] = useState<'create' | 'login'>('login');
  const [pinToken, setPinToken] = useState<string | null>(null);
  const [medicalData, setMedicalData] = useState<MedicalData>(emptyMedicalData);
  const [contacts, setContacts] = useState<Contact[]>([{ name: '', relationship: '', phone: '' }]);
  const [saving, setSaving] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showPin, setShowPin] = useState(false);
  const [pinStep, setPinStep] = useState<'enter' | 'confirm'>('enter');
  const [formTransition, setFormTransition] = useState(false);
  const [customGender, setCustomGender] = useState('');
  const [customReligion, setCustomReligion] = useState('');
  const [customUmf, setCustomUmf] = useState('');
  const [allergyInput, setAllergyInput] = useState('');
  const [selectedAllergies, setSelectedAllergies] = useState<string[]>([]);
  const [hereditaryInput, setHereditaryInput] = useState('');
  const [selectedHereditary, setSelectedHereditary] = useState<{ name: string; line: 'materna' | 'paterna' | 'ambas'; isActive: boolean }[]>([]);
  const [showAllergySelect, setShowAllergySelect] = useState(false);
  const [showHereditarySelect, setShowHereditarySelect] = useState(false);
  const [customAllergy, setCustomAllergy] = useState('');
  const [customHereditary, setCustomHereditary] = useState('');
  const [hasAllergies, setHasAllergies] = useState<boolean | null>(null);
  const [hasHereditary, setHasHereditary] = useState<boolean | null>(null);

  useEffect(() => {
    loadTagStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uuid]);

  async function loadTagStatus() {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/tags/${uuid}/view`);
      const json = await res.json();
      if (res.ok) {
        setStatus(json.data.status);
        if (json.data.status === 'VIRGIN') {
          setPinMode('create');
        } else {
          setPinMode('login');
        }
        if (json.data.medicalData) {
          setMedicalData({ ...emptyMedicalData, ...json.data.medicalData });
          if (json.data.medicalData.gender && !genders.includes(json.data.medicalData.gender)) {
            setCustomGender(json.data.medicalData.gender);
            updateMedicalField('gender', 'Otro');
          }
          if (json.data.medicalData.religion && !religions.includes(json.data.medicalData.religion)) {
            setCustomReligion(json.data.medicalData.religion);
            updateMedicalField('religion', 'Otra');
          }
          if (json.data.medicalData.umf && !umfClinics.includes(json.data.medicalData.umf)) {
            setCustomUmf(json.data.medicalData.umf);
            updateMedicalField('umf', 'Otra');
          }
          if (json.data.medicalData.allergies) {
            if (json.data.medicalData.allergies === 'Ninguna conocida') {
              setHasAllergies(false);
              setSelectedAllergies([]);
            } else {
              setHasAllergies(true);
              const allergies = json.data.medicalData.allergies.split('|').filter((a: string) => a.trim());
              setSelectedAllergies(allergies);
            }
          }
          if (json.data.medicalData.hereditaryConditions) {
            const items = json.data.medicalData.hereditaryConditions.split('|').filter((h: string) => h.trim());
            if (items.length > 0) {
              setHasHereditary(true);
              const parsed = items.map((item: string) => {
                const parts = item.split(' - ');
                return {
                  name: parts[0] || '',
                  line: (parts[1] as 'materna' | 'paterna' | 'ambas') || 'materna',
                  isActive: parts[2] === 'si',
                };
              });
              setSelectedHereditary(parsed);
            }
          }
        }
        if (json.data.contacts && json.data.contacts.length > 0) {
          setContacts(json.data.contacts);
        }
      } else {
        toast.error(json.error?.message || 'Tag no encontrado');
      }
    } catch {
      toast.error('Error al cargar el tag');
    } finally {
      setLoading(false);
    }
  }

  function validatePin(value: string) {
    if (!/^\d{4,}$/.test(value)) {
      return 'El PIN debe tener al menos 4 digitos';
    }
    return '';
  }

  async function handleCreatePin(e: React.FormEvent) {
    e.preventDefault();
    setPinError('');

    if (pinStep === 'enter') {
      const err = validatePin(pin);
      if (err) {
        setPinError(err);
        return;
      }
      setPinStep('confirm');
      setPinError('');
      return;
    }

    const err = validatePin(pin);
    if (err) {
      setPinError(err);
      return;
    }
    if (pin !== confirmPin) {
      setPinError('Los PIN no coinciden');
      setPinStep('enter');
      return;
    }

    try {
      await pinApi.setPin(uuid, pin);
      toast.success('PIN creado exitosamente');
      const loginRes = await pinApi.pinLogin(uuid, pin);
      setPinToken(loginRes.token);
      setStatus(loginRes.status as TagStatus);
      setTimeout(() => setFormTransition(true), 100);
    } catch (err: any) {
      toast.error(err.message || 'Error al crear el PIN');
    }
  }

  async function handlePinLogin(e: React.FormEvent) {
    e.preventDefault();
    setPinError('');

    const err = validatePin(pin);
    if (err) {
      setPinError(err);
      return;
    }

    try {
      const res = await pinApi.pinLogin(uuid, pin);
      setPinToken(res.token);
      setStatus(res.status as TagStatus);
      toast.success('Acceso concedido');
      setTimeout(() => setFormTransition(true), 100);
    } catch (err: any) {
      toast.error(err.message || 'PIN incorrecto');
      setPinError('PIN incorrecto');
    }
  }

  function updateMedicalField(field: keyof MedicalData, value: string) {
    setMedicalData((prev) => ({ ...prev, [field]: value }));
  }

  function addContact() {
    setContacts((prev) => [...prev, { name: '', relationship: '', phone: '' }]);
  }

  function removeContact(index: number) {
    if (contacts.length > 1) {
      setContacts((prev) => prev.filter((_, i) => i !== index));
    }
  }

  function updateContact(index: number, field: keyof Contact, value: string) {
    setContacts((prev) =>
      prev.map((c, i) => (i === index ? { ...c, [field]: value } : c))
    );
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();

    if (!medicalData.userName || !medicalData.dob || !medicalData.bloodType || !medicalData.emergencyPhone) {
      toast.error('Completa los campos obligatorios: Nombre, Fecha de nacimiento, Tipo de sangre, Telefono de emergencia');
      return;
    }

    if (!pinToken) {
      toast.error('No hay sesion activa');
      return;
    }

    setSaving(true);
    try {
      await pinApi.updateMedicalData(pinToken, medicalData, contacts);
      toast.success('Datos guardados exitosamente');
      setIsActive(true);
      setStatus('ACTIVE');
      setShowSuccess(true);
    } catch (err: any) {
      toast.error(err.message || 'Error al guardar los datos');
    } finally {
      setSaving(false);
    }
  }

  const handlePinChange = useCallback((value: string) => {
    setPin(value);
    setPinError('');
  }, []);

  const handleConfirmPinChange = useCallback((value: string) => {
    setConfirmPin(value);
    setPinError('');
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-red-50/30 to-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-red-200 rounded-full animate-spin border-t-red-600" />
          </div>
          <p className="mt-4 text-sm font-medium text-gray-500">Cargando configuracion...</p>
        </div>
      </div>
    );
  }

  if (status === 'SUSPENDED') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-red-50/30 to-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-xl p-8 text-center max-w-sm w-full border border-gray-100">
          <div className="bg-gray-100 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 text-gray-500" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Tag Inactivo</h1>
          <p className="text-gray-500 text-sm">Este tag ha sido dado de baja del sistema.</p>
        </div>
      </div>
    );
  }

  if (showSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-green-50/30 to-gray-50 p-4 sm:p-6">
        <div className="max-w-md mx-auto pt-8">
          <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
            <div className="bg-gradient-to-br from-green-500 to-green-700 p-8 text-center">
              <AnimatedCheckmark />
              <h1 className="text-2xl font-bold text-white mt-6">Datos Guardados!</h1>
              <p className="text-green-100 text-sm mt-2">Tu informacion medica de emergencia esta lista</p>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4">
                <h2 className="text-sm font-bold text-blue-900 mb-3 flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  Como modificar tus datos despues?
                </h2>
                <ol className="space-y-3 text-sm text-blue-800">
                  {[
                    'Escanea el QR o acerca el NFC de tu tag',
                    'Ingresa tu PIN de 4 digitos que acabas de crear',
                    'Edita tus datos medicos y guarda los cambios',
                  ].map((step, i) => (
                    <li key={i} className="flex gap-3 items-start">
                      <span className="w-6 h-6 rounded-full bg-blue-200 text-blue-700 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                        {i + 1}
                      </span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>
              </div>

              <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4">
                <h2 className="text-sm font-bold text-amber-900 mb-2 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  Importante
                </h2>
                <ul className="space-y-1.5 text-sm text-amber-800">
                  <li>Manten tu tag NFC/QR en un lugar accesible de tu casco</li>
                  <li>No compartas tu PIN con nadie</li>
                  <li>Actualiza tus datos cuando haya cambios importantes</li>
                </ul>
              </div>

              <div className="space-y-3 pt-2">
                <button
                  onClick={() => setShowSuccess(false)}
                  className="w-full flex items-center justify-center gap-2 bg-gray-100 text-gray-700 font-semibold py-3.5 px-6 rounded-xl hover:bg-gray-200 transition-colors min-h-[44px]"
                >
                  <Save className="w-5 h-5" />
                  Volver a Editar Datos
                </button>

                <a
                  href={`/L/${uuid}`}
                  className="w-full flex items-center justify-center gap-2 bg-red-600 text-white font-semibold py-3.5 px-6 rounded-xl hover:bg-red-700 transition-colors shadow-lg shadow-red-600/20 min-h-[44px]"
                >
                  <Activity className="w-5 h-5" />
                  Ver mi Tag Activo
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (pinToken && formTransition) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-red-50/20 to-gray-50 p-4 sm:p-6">
        <div className="max-w-lg mx-auto">
          <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
            <div className="bg-gradient-to-br from-red-600 to-red-800 p-6 text-center relative">
              <div className="bg-white/10 backdrop-blur-sm w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-xl font-bold text-white">Configurar mi Tag</h1>
              <p className="text-red-100 text-sm mt-1">Datos medicos de emergencia</p>
              {isActive && (
                <div className="mt-3 inline-flex items-center gap-1.5 bg-green-400/20 backdrop-blur-sm text-green-100 px-3 py-1 rounded-full text-xs font-semibold">
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>Tag activo</span>
                </div>
              )}
            </div>

            <form onSubmit={handleSave} className="p-4 sm:p-6 space-y-4">
              <SectionCard icon={User} title="Informacion Personal" defaultOpen={true}>
                <div className="space-y-4">
                  <InputField
                    label="Nombre Completo"
                    required
                    type="text"
                    value={medicalData.userName}
                    onChange={(e) => updateMedicalField('userName', e.target.value)}
                  />

                  <div className="space-y-1.5">
                    <label className="block text-sm font-semibold text-gray-700">
                      Fecha Nacimiento <span className="text-red-500">*</span>
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      <select
                        value={medicalData.dob ? parseInt(medicalData.dob.split('/')[0]) || '' : ''}
                        onChange={(e) => {
                          const day = e.target.value;
                          const parts = medicalData.dob.split('/');
                          const newDob = day ? `${day}/${parts[1] || '01'}/${parts[2] || '1990'}` : '';
                          updateMedicalField('dob', newDob);
                        }}
                        className="h-12 px-3 border border-gray-200 rounded-xl text-sm bg-gray-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500 transition-all"
                      >
                        <option value="">Dia</option>
                        {days.map((d) => (
                          <option key={d} value={d}>{d}</option>
                        ))}
                      </select>
                      <select
                        value={medicalData.dob ? parseInt(medicalData.dob.split('/')[1]) || '' : ''}
                        onChange={(e) => {
                          const month = e.target.value;
                          const parts = medicalData.dob.split('/');
                          const newDob = month ? `${parts[0] || '01'}/${month}/${parts[2] || '1990'}` : '';
                          updateMedicalField('dob', newDob);
                        }}
                        className="h-12 px-3 border border-gray-200 rounded-xl text-sm bg-gray-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500 transition-all"
                      >
                        <option value="">Mes</option>
                        {months.map((m) => (
                          <option key={m.value} value={m.value}>{m.label}</option>
                        ))}
                      </select>
                      <select
                        value={medicalData.dob ? parseInt(medicalData.dob.split('/')[2]) || '' : ''}
                        onChange={(e) => {
                          const year = e.target.value;
                          const parts = medicalData.dob.split('/');
                          const newDob = year ? `${parts[0] || '01'}/${parts[1] || '01'}/${year}` : '';
                          updateMedicalField('dob', newDob);
                        }}
                        className="h-12 px-3 border border-gray-200 rounded-xl text-sm bg-gray-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500 transition-all"
                      >
                        <option value="">Año</option>
                        {years.map((y) => (
                          <option key={y} value={y}>{y}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-sm font-semibold text-gray-700">Genero</label>
                    <div className="flex gap-2 flex-wrap">
                      {genders.map((g) => (
                        <button
                          key={g}
                          type="button"
                          onClick={() => updateMedicalField('gender', g)}
                          className={`flex-1 min-w-[80px] h-11 rounded-xl text-sm font-medium transition-all border ${
                            medicalData.gender === g
                              ? 'bg-red-600 text-white border-red-600 shadow-md shadow-red-600/20'
                              : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-red-300 hover:bg-red-50'
                          }`}
                        >
                          {g}
                        </button>
                      ))}
                    </div>
                    {medicalData.gender === 'Otro' && (
                      <input
                        type="text"
                        value={customGender}
                        onChange={(e) => {
                          setCustomGender(e.target.value);
                          updateMedicalField('gender', e.target.value);
                        }}
                        placeholder="Especifica tu genero"
                        className="w-full h-12 px-4 border border-gray-200 rounded-xl text-sm bg-gray-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500 transition-all mt-2"
                      />
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="block text-sm font-semibold text-gray-700">
                        Tipo de Sangre <span className="text-red-500">*</span>
                      </label>
                      <div className="grid grid-cols-4 gap-2">
                        {bloodTypes.map((bt) => (
                          <button
                            key={bt}
                            type="button"
                            onClick={() => updateMedicalField('bloodType', bt)}
                            className={`h-11 rounded-xl text-sm font-bold transition-all border ${
                              medicalData.bloodType === bt
                                ? 'bg-red-600 text-white border-red-600 shadow-md shadow-red-600/20'
                                : 'bg-gray-50 text-gray-700 border-gray-200 hover:border-red-300 hover:bg-red-50'
                            }`}
                          >
                            {bt}
                          </button>
                        ))}
                      </div>
                    </div>

                  <div className="space-y-1.5">
                    <label className="block text-sm font-semibold text-gray-700">Religion</label>
                    <select
                      value={religions.includes(medicalData.religion) ? medicalData.religion : (medicalData.religion ? 'Otra' : '')}
                      onChange={(e) => {
                        const selected = e.target.value;
                        updateMedicalField('religion', selected);
                        if (selected !== 'Otra') {
                          setCustomReligion('');
                        }
                      }}
                      className="w-full h-12 px-4 border border-gray-200 rounded-xl text-sm bg-gray-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500 transition-all"
                    >
                      <option value="">Seleccionar</option>
                      {religions.map((r) => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                    {medicalData.religion === 'Otra' && (
                      <input
                        type="text"
                        value={customReligion}
                        onChange={(e) => {
                          setCustomReligion(e.target.value);
                          updateMedicalField('religion', e.target.value);
                        }}
                        placeholder="Especifica tu religion"
                        className="w-full h-12 px-4 border border-gray-200 rounded-xl text-sm bg-gray-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500 transition-all mt-2"
                      />
                    )}
                  </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="block text-sm font-semibold text-gray-700">Donador de Organos</label>
                      <div className="flex gap-2">
                        {['Si', 'No'].map((opt) => (
                          <button
                            key={opt}
                            type="button"
                            onClick={() => updateMedicalField('organDonor', opt)}
                            className={`flex-1 h-11 rounded-xl text-sm font-medium transition-all border ${
                              medicalData.organDonor === opt
                                ? opt === 'Si'
                                  ? 'bg-green-600 text-white border-green-600 shadow-md shadow-green-600/20'
                                  : 'bg-gray-600 text-white border-gray-600 shadow-md shadow-gray-600/20'
                                : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                    </div>

                    <InputField
                      label="Telefono Emergencia"
                      required
                      type="tel"
                      value={medicalData.emergencyPhone}
                      onChange={(e) => updateMedicalField('emergencyPhone', e.target.value)}
                      placeholder="10 digitos"
                    />
                  </div>
                </div>
              </SectionCard>

              <SectionCard icon={FileText} title="Datos IMSS" defaultOpen={false}>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <InputField
                      label="CURP"
                      type="text"
                      value={medicalData.curp}
                      onChange={(e) => updateMedicalField('curp', e.target.value.toUpperCase())}
                      className="uppercase"
                      maxLength={18}
                    />
                    <InputField
                      label="NSS"
                      type="text"
                      value={medicalData.nss}
                      onChange={(e) => updateMedicalField('nss', e.target.value)}
                      maxLength={11}
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <InputField
                      label="Pais de Nacimiento"
                      type="text"
                      value={medicalData.pob}
                      onChange={(e) => updateMedicalField('pob', e.target.value)}
                    />
                  <div className="space-y-1.5">
                    <label className="block text-sm font-semibold text-gray-700">UMF</label>
                    <select
                      value={umfClinics.includes(medicalData.umf) ? medicalData.umf : (medicalData.umf ? 'Otra' : '')}
                      onChange={(e) => {
                        const selected = e.target.value;
                        updateMedicalField('umf', selected);
                        if (selected !== 'Otra') {
                          setCustomUmf('');
                        }
                      }}
                      className="w-full h-12 px-4 border border-gray-200 rounded-xl text-sm bg-gray-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500 transition-all"
                    >
                      <option value="">Seleccionar</option>
                      {umfClinics.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                    {medicalData.umf === 'Otra' && (
                      <input
                        type="text"
                        value={customUmf}
                        onChange={(e) => {
                          setCustomUmf(e.target.value);
                          updateMedicalField('umf', e.target.value);
                        }}
                        placeholder="Especifica tu UMF o clinica"
                        className="w-full h-12 px-4 border border-gray-200 rounded-xl text-sm bg-gray-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500 transition-all mt-2"
                      />
                    )}
                  </div>
                  </div>
                </div>
              </SectionCard>

              <SectionCard icon={Stethoscope} title="Informacion Medica" defaultOpen={false}>
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="block text-sm font-semibold text-gray-700">Alergias</label>
                    <div className="flex gap-2">
                      {['Si', 'No'].map((opt) => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => {
                            if (opt === 'Si') {
                              setHasAllergies(true);
                            } else {
                              setHasAllergies(false);
                              setSelectedAllergies([]);
                              updateMedicalField('allergies', 'Ninguna conocida');
                            }
                          }}
                          className={`flex-1 h-11 rounded-xl text-sm font-medium transition-all border ${
                            (opt === 'Si' && hasAllergies === true) || (opt === 'No' && hasAllergies === false)
                              ? opt === 'Si'
                                ? 'bg-amber-500 text-white border-amber-500 shadow-md shadow-amber-500/20'
                                : 'bg-green-600 text-white border-green-600 shadow-md shadow-green-600/20'
                              : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                    {hasAllergies === true && (
                      <div className="mt-3">
                        {selectedAllergies.length > 0 && (
                          <div className="flex flex-wrap gap-2 mb-2">
                            {selectedAllergies.map((allergy, idx) => (
                              <span
                                key={idx}
                                className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-800 border border-amber-200 px-3 py-1.5 rounded-lg text-sm font-medium"
                              >
                                {allergy}
                                <button
                                  type="button"
                                  onClick={() => {
                                    const updated = selectedAllergies.filter((_, i) => i !== idx);
                                    setSelectedAllergies(updated);
                                    updateMedicalField('allergies', updated.length > 0 ? updated.join('|') : 'Ninguna conocida');
                                  }}
                                  className="ml-0.5 text-amber-600 hover:text-amber-800 p-0.5 rounded"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </span>
                            ))}
                          </div>
                        )}
                        {showAllergySelect ? (
                          <div className="space-y-2">
                            <select
                              value={allergyInput}
                              onChange={(e) => {
                                setAllergyInput(e.target.value);
                                if (e.target.value && e.target.value !== 'custom') {
                                  const updated = [...selectedAllergies, e.target.value];
                                  setSelectedAllergies(updated);
                                  updateMedicalField('allergies', updated.join('|'));
                                  setAllergyInput('');
                                  setShowAllergySelect(false);
                                }
                              }}
                              className="w-full h-12 px-4 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500 transition-all"
                              autoFocus
                            >
                              <option value="">Seleccionar alergia</option>
                              <option value="Penicilina">Penicilina</option>
                              <option value="Sulfas">Sulfas</option>
                              <option value="Aspirina">Aspirina</option>
                              <option value="Mariscos">Mariscos</option>
                              <option value="Cacahuate">Cacahuate</option>
                              <option value="Lacteos">Lacteos</option>
                              <option value="Huevo">Huevo</option>
                              <option value="Gluten">Gluten</option>
                              <option value="Picaduras de abeja">Picaduras de abeja</option>
                              <option value="Latex">Latex</option>
                              <option value="Polen">Polen</option>
                              <option value="custom">Otra (escribir)</option>
                            </select>
                            {allergyInput === 'custom' && (
                              <div className="flex gap-2">
                                <input
                                  type="text"
                                  value={customAllergy}
                                  onChange={(e) => setCustomAllergy(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter' && customAllergy.trim()) {
                                      const updated = [...selectedAllergies, customAllergy.trim()];
                                      setSelectedAllergies(updated);
                                      updateMedicalField('allergies', updated.join('|'));
                                      setCustomAllergy('');
                                    }
                                  }}
                                  placeholder="Especifica la alergia"
                                  className="flex-1 h-12 px-4 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500 transition-all"
                                  autoFocus
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (customAllergy.trim()) {
                                      const updated = [...selectedAllergies, customAllergy.trim()];
                                      setSelectedAllergies(updated);
                                      updateMedicalField('allergies', updated.join('|'));
                                      setCustomAllergy('');
                                    }
                                  }}
                                  className="h-12 px-4 bg-red-600 text-white rounded-xl text-sm font-medium hover:bg-red-700 transition-colors"
                                >
                                  Agregar
                                </button>
                              </div>
                            )}
                            <button
                              type="button"
                              onClick={() => {
                                setShowAllergySelect(false);
                                setAllergyInput('');
                                setCustomAllergy('');
                              }}
                              className="text-sm text-gray-500 hover:text-gray-700"
                            >
                              Cancelar
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setShowAllergySelect(true)}
                            className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-gray-300 rounded-xl text-sm font-semibold text-gray-500 hover:border-red-400 hover:text-red-500 hover:bg-red-50/50 transition-all min-h-[44px]"
                          >
                            <Plus className="w-4 h-4" />
                            {selectedAllergies.length === 0 ? 'Agregar alergia' : 'Agregar otra alergia'}
                          </button>
                        )}
                      </div>
                    )}
                    {hasAllergies === false && (
                      <div className="flex items-center gap-2 text-green-700 bg-green-50 px-4 py-3 rounded-xl border border-green-100 mt-2">
                        <CheckCircle className="w-4 h-4 flex-shrink-0" />
                        <span className="text-sm font-medium">Ninguna alergia conocida</span>
                      </div>
                    )}
                  </div>

                  <TextAreaField
                    label="Medicamentos Actuales"
                    value={medicalData.medications}
                    onChange={(e) => updateMedicalField('medications', e.target.value)}
                    rows={2}
                    placeholder="Nombre, dosis, frecuencia..."
                  />

                  <div className="space-y-1.5">
                    <label className="block text-sm font-semibold text-gray-700">Antecedentes Heredofamiliares</label>
                    <div className="flex gap-2">
                      {['Si', 'No'].map((opt) => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => {
                            if (opt === 'Si') {
                              setHasHereditary(true);
                            } else {
                              setHasHereditary(false);
                              setSelectedHereditary([]);
                              updateMedicalField('hereditaryConditions', '');
                            }
                          }}
                          className={`flex-1 h-11 rounded-xl text-sm font-medium transition-all border ${
                            (opt === 'Si' && hasHereditary === true) || (opt === 'No' && hasHereditary === false)
                              ? opt === 'Si'
                                ? 'bg-amber-500 text-white border-amber-500 shadow-md shadow-amber-500/20'
                                : 'bg-green-600 text-white border-green-600 shadow-md shadow-green-600/20'
                              : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                    {hasHereditary === true && (
                      <div className="mt-3">
                        {selectedHereditary.length > 0 && (
                          <div className="space-y-2 mb-2">
                            {selectedHereditary.map((item, idx) => (
                              <div
                                key={idx}
                                className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                                  item.isActive
                                    ? 'bg-red-50 border-red-200'
                                    : 'bg-gray-50 border-gray-200'
                                }`}
                              >
                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${item.isActive ? 'bg-red-500' : 'bg-gray-400'}`} />
                                  <div className="min-w-0">
                                    <span className={`text-sm font-medium ${item.isActive ? 'text-red-800' : 'text-gray-700'}`}>
                                      {item.name}
                                    </span>
                                    <span className="text-xs text-gray-500 ml-1.5">Linea {item.line}</span>
                                    {item.isActive && (
                                      <span className="ml-1.5 text-xs font-semibold text-red-600">Lo padezco</span>
                                    )}
                                  </div>
                                </div>
                                <div className="flex items-center gap-1 flex-shrink-0">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const updated = [...selectedHereditary];
                                      updated[idx].isActive = !updated[idx].isActive;
                                      setSelectedHereditary(updated);
                                      const serialized = updated.map(h => `${h.name} - ${h.line} - ${h.isActive ? 'si' : 'no'}`).join('|');
                                      updateMedicalField('hereditaryConditions', serialized);
                                    }}
                                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                                      item.isActive
                                        ? 'bg-red-600 text-white'
                                        : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                                    }`}
                                  >
                                    {item.isActive ? 'Lo padezco' : 'No lo padezco'}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const updated = selectedHereditary.filter((_, i) => i !== idx);
                                      setSelectedHereditary(updated);
                                      const serialized = updated.map(h => `${h.name} - ${h.line} - ${h.isActive ? 'si' : 'no'}`).join('|');
                                      updateMedicalField('hereditaryConditions', serialized || '');
                                    }}
                                    className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                        {showHereditarySelect ? (
                          <div className="space-y-2">
                            <select
                              value={hereditaryInput}
                              onChange={(e) => {
                                setHereditaryInput(e.target.value);
                              }}
                              className="w-full h-12 px-4 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500 transition-all"
                              autoFocus
                            >
                              <option value="">Seleccionar enfermedad</option>
                              {hereditaryConditions.filter(c => c !== 'Otra' && !selectedHereditary.find(h => h.name === c)).map((c) => (
                                <option key={c} value={c}>{c}</option>
                              ))}
                              <option value="custom">Otra (escribir)</option>
                            </select>
                            {hereditaryInput === 'custom' && (
                              <div className="flex gap-2">
                                <input
                                  type="text"
                                  value={customHereditary}
                                  onChange={(e) => setCustomHereditary(e.target.value)}
                                  placeholder="Especifica la enfermedad"
                                  className="flex-1 h-12 px-4 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500 transition-all"
                                  autoFocus
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (customHereditary.trim()) {
                                      setCustomHereditary('');
                                      setHereditaryInput(customHereditary.trim());
                                    }
                                  }}
                                  className="h-12 px-4 bg-red-600 text-white rounded-xl text-sm font-medium hover:bg-red-700 transition-colors"
                                >
                                  Agregar
                                </button>
                              </div>
                            )}
                            {hereditaryInput && hereditaryInput !== 'custom' && (
                              <div className="space-y-2">
                                <label className="block text-xs font-semibold text-gray-600">Linea familiar</label>
                                <div className="flex gap-2">
                                  {(['materna', 'paterna', 'ambas'] as const).map((line) => (
                                    <button
                                      key={line}
                                      type="button"
                                      onClick={() => {
                                        const newItem = { name: hereditaryInput, line, isActive: false };
                                        const updated = [...selectedHereditary, newItem];
                                        setSelectedHereditary(updated);
                                        const serialized = updated.map(h => `${h.name} - ${h.line} - ${h.isActive ? 'si' : 'no'}`).join('|');
                                        updateMedicalField('hereditaryConditions', serialized);
                                        setHereditaryInput('');
                                        setShowHereditarySelect(false);
                                      }}
                                      className="flex-1 h-10 rounded-lg text-xs font-medium bg-gray-100 text-gray-700 hover:bg-red-50 hover:text-red-600 transition-colors"
                                    >
                                      {line.charAt(0).toUpperCase() + line.slice(1)}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}
                            <button
                              type="button"
                              onClick={() => {
                                setShowHereditarySelect(false);
                                setHereditaryInput('');
                                setCustomHereditary('');
                              }}
                              className="text-sm text-gray-500 hover:text-gray-700"
                            >
                              Cancelar
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setShowHereditarySelect(true)}
                            className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-gray-300 rounded-xl text-sm font-semibold text-gray-500 hover:border-red-400 hover:text-red-500 hover:bg-red-50/50 transition-all min-h-[44px]"
                          >
                            <Plus className="w-4 h-4" />
                            {selectedHereditary.length === 0 ? 'Agregar antecedente' : 'Agregar otro antecedente'}
                          </button>
                        )}
                      </div>
                    )}
                    {hasHereditary === false && (
                      <div className="flex items-center gap-2 text-green-700 bg-green-50 px-4 py-3 rounded-xl border border-green-100 mt-2">
                        <CheckCircle className="w-4 h-4 flex-shrink-0" />
                        <span className="text-sm font-medium">Sin antecedentes heredofamiliares</span>
                      </div>
                    )}
                  </div>
                </div>
              </SectionCard>

              <SectionCard icon={Contact} title="Contactos de Emergencia" defaultOpen={false}>
                <div className="space-y-3">
                  {contacts.map((contact, index) => (
                    <div key={index} className="bg-gray-50 rounded-xl p-4 border border-gray-100 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
                            <Contact className="w-4 h-4 text-red-600" />
                          </div>
                          <span className="text-sm font-semibold text-gray-700">Contacto {index + 1}</span>
                        </div>
                        {contacts.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeContact(index)}
                            className="text-red-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <InputField
                          label="Nombre"
                          type="text"
                          value={contact.name}
                          onChange={(e) => updateContact(index, 'name', e.target.value)}
                          placeholder="Nombre completo"
                        />
                        <InputField
                          label="Parentesco"
                          type="text"
                          value={contact.relationship}
                          onChange={(e) => updateContact(index, 'relationship', e.target.value)}
                          placeholder="Esposo, Hijo, etc."
                        />
                      </div>
                      <InputField
                        label="Telefono"
                        type="tel"
                        value={contact.phone}
                        onChange={(e) => updateContact(index, 'phone', e.target.value)}
                        placeholder="10 digitos"
                      />
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addContact}
                    className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-gray-300 rounded-xl text-sm font-semibold text-gray-500 hover:border-red-400 hover:text-red-500 hover:bg-red-50/50 transition-all min-h-[44px]"
                  >
                    <Plus className="w-4 h-4" />
                    Agregar contacto
                  </button>
                </div>
              </SectionCard>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full flex items-center justify-center gap-2 bg-red-600 text-white font-semibold py-4 px-6 rounded-xl hover:bg-red-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-red-600/25 min-h-[52px] active:scale-[0.98]"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5" />
                      Guardar Datos
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // PIN Screen
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-red-50/30 to-gray-50 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: 'radial-gradient(circle, #dc2626 1px, transparent 1px)',
        backgroundSize: '24px 24px',
      }} />

      <div className="relative z-10 w-full max-w-sm">
        <div className="bg-white rounded-3xl shadow-2xl p-8 border border-gray-100">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="relative mx-auto w-16 h-16 mb-4">
              <div className="absolute inset-0 bg-red-100 rounded-2xl rotate-6" />
              <div className="relative bg-gradient-to-br from-red-500 to-red-700 w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg shadow-red-600/30">
                <Lock className="w-7 h-7 text-white" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">
              {pinMode === 'create' ? (pinStep === 'enter' ? 'Crear PIN' : 'Confirmar PIN') : 'Ingresar PIN'}
            </h1>
            <p className="text-gray-500 text-sm mt-2">
              {pinMode === 'create'
                ? pinStep === 'enter'
                  ? 'Crea un PIN de 4 a 8 digitos para proteger tus datos'
                  : 'Repite tu PIN para confirmar'
                : 'Ingresa tu PIN para editar tus datos medicos'}
            </p>
          </div>

          {/* PIN Input */}
          <form onSubmit={pinMode === 'create' ? handleCreatePin : handlePinLogin} className="space-y-6">
            <div className="relative">
              <PinInput
                length={pinMode === 'create' && pinStep === 'confirm' ? pin.length || 4 : 8}
                value={pinMode === 'create' && pinStep === 'confirm' ? confirmPin : pin}
                onChange={pinMode === 'create' && pinStep === 'confirm' ? handleConfirmPinChange : handlePinChange}
                showPin={showPin}
              />
              <button
                type="button"
                onClick={() => setShowPin(!showPin)}
                className="absolute right-0 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-gray-600 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
              >
                {showPin ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            {/* PIN length indicator */}
            <div className="flex justify-center gap-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className={`h-1 rounded-full transition-all duration-200 ${
                    i === 0
                      ? 'w-8 bg-red-500'
                      : (pinMode === 'create' && pinStep === 'confirm' ? confirmPin : pin).length >= i + 4
                      ? 'w-4 bg-red-400'
                      : 'w-4 bg-gray-200'
                  }`}
                />
              ))}
            </div>

            {/* Error message */}
            {pinError && (
              <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 px-4 py-3 rounded-xl border border-red-100">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{pinError}</span>
              </div>
            )}

            {/* Submit button */}
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 bg-red-600 text-white font-semibold py-4 px-6 rounded-xl hover:bg-red-700 transition-all shadow-lg shadow-red-600/25 min-h-[52px] active:scale-[0.98]"
            >
              <Activity className="w-5 h-5" />
              {pinMode === 'create'
                ? pinStep === 'enter'
                  ? 'Continuar'
                  : 'Confirmar PIN'
                : 'Acceder'}
            </button>

            {/* Back button for create confirm step */}
            {pinMode === 'create' && pinStep === 'confirm' && (
              <button
                type="button"
                onClick={() => {
                  setPinStep('enter');
                  setConfirmPin('');
                  setPinError('');
                }}
                className="w-full text-center text-sm text-gray-500 hover:text-gray-700 py-2 transition-colors min-h-[44px] flex items-center justify-center"
              >
                Volver a ingresar PIN
              </button>
            )}
          </form>
        </div>

        {/* Footer hint */}
        <p className="text-center text-xs text-gray-400 mt-6">
          {pinMode === 'create'
            ? 'Tu PIN protege la informacion medica de tu tag'
            : 'Contacta a soporte si olvidaste tu PIN'}
        </p>
      </div>
    </div>
  );
}
