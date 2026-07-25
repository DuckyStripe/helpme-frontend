'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { pinApi } from '@/lib/api';
import { toast } from '@/lib/toast';
import {
  Shield, Lock, Activity, Plus, Trash2, Save, CheckCircle, Loader2, AlertTriangle,
  User, FileText, Eye, EyeOff, ChevronDown, ChevronUp,
  Stethoscope, AlertCircle, Contact, Camera, X, MessageCircle,
} from 'lucide-react';
import OwnerView from '@/components/OwnerView';

type TagStatus = 'VIRGIN' | 'INCOMPLETE' | 'ACTIVE' | 'SUSPENDED';

export interface Contact {
  id?: string;
  name: string;
  relationship: string;
  phone: string;
  verified?: boolean;
  lastVerificationAt?: string;
}

export interface MedicalData {
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
  photo: string;
  pacemakerICD: string;
  implantContraceptive: string;
  implantMammary: string;
  orthopedicImplants: string;
  cochlearImplant: string;
  ocularProsthesis: string;
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
  photo: '',
  pacemakerICD: '',
  implantContraceptive: '',
  implantMammary: '',
  orthopedicImplants: '',
  cochlearImplant: '',
  ocularProsthesis: '',
};

function resizeImageToDataUrl(file: File, maxSize: number, quality: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new window.Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > height && width > maxSize) {
          height = Math.round((height * maxSize) / width);
          width = maxSize;
        } else if (height >= width && height > maxSize) {
          width = Math.round((width * maxSize) / height);
          height = maxSize;
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas no soportado'));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = () => reject(new Error('No se pudo leer la imagen'));
      img.src = reader.result as string;
    };
    reader.onerror = () => reject(new Error('No se pudo leer el archivo'));
    reader.readAsDataURL(file);
  });
}

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

// El backend/visor esperan la fecha en formato DD/MM/YYYY (ver lib/utils.ts calculateAge)
function dobToInputValue(dob: string): string {
  const parts = dob.split('/');
  if (parts.length !== 3) return '';
  const [d, m, y] = parts;
  if (!d || !m || !y) return '';
  return `${y.padStart(4, '0')}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
}

function inputValueToDob(value: string): string {
  const parts = value.split('-');
  if (parts.length !== 3) return '';
  const [y, m, d] = parts;
  if (!y || !m || !d) return '';
  return `${parseInt(d, 10)}/${parseInt(m, 10)}/${y}`;
}

const todayInputValue = new Date().toISOString().split('T')[0];
const minDobInputValue = `${new Date().getFullYear() - 100}-01-01`;

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
  complete,
  highlight,
}: {
  icon: React.ElementType;
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  complete?: boolean;
  highlight?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div
      className={`bg-white rounded-2xl shadow-sm border overflow-hidden transition-all duration-300 ${
        highlight ? 'border-red-400 ring-2 ring-red-400/40' : 'border-gray-100'
      }`}
    >
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
          {complete && (
            <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" aria-label="Seccion completa" />
          )}
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

const InputField = React.forwardRef<
  HTMLInputElement,
  {
    label: string;
    required?: boolean;
    error?: string;
  } & React.InputHTMLAttributes<HTMLInputElement>
>(function InputField({ label, required, error, ...props }, ref) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-semibold text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <input
        {...props}
        ref={ref}
        aria-invalid={!!error}
        className={`w-full h-12 px-4 border rounded-xl text-sm bg-gray-50/50 focus:bg-white focus:outline-none focus:ring-2 transition-all ${
          error
            ? 'border-red-400 focus:ring-red-500/30 focus:border-red-500'
            : 'border-gray-200 focus:ring-red-500/30 focus:border-red-500'
        } ${props.className || ''}`}
      />
      {error && (
        <div role="alert" className="flex items-center gap-1.5 text-red-600 text-xs font-medium pt-0.5">
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
});

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
  const [hasPacemaker, setHasPacemaker] = useState<boolean | null>(null);
  const [pacemakerDetails, setPacemakerDetails] = useState('');
  const [hasImplantContraceptive, setHasImplantContraceptive] = useState<boolean | null>(null);
  const [implantContraceptiveDetails, setImplantContraceptiveDetails] = useState('');
  const [hasImplantMammary, setHasImplantMammary] = useState<boolean | null>(null);
  const [implantMammaryDetails, setImplantMammaryDetails] = useState('');
  const [hasOrthopedicImplants, setHasOrthopedicImplants] = useState<boolean | null>(null);
  const [orthopedicImplantsDetails, setOrthopedicImplantsDetails] = useState('');
  const [hasCochlearImplant, setHasCochlearImplant] = useState<boolean | null>(null);
  const [cochlearImplantDetails, setCochlearImplantDetails] = useState('');
  const [hasOcularProsthesis, setHasOcularProsthesis] = useState<boolean | null>(null);
  const [ocularProsthesisDetails, setOcularProsthesisDetails] = useState('');
  const [errors, setErrors] = useState<Partial<Record<'userName' | 'dob' | 'bloodType' | 'emergencyPhone', string>>>({});
  const [contactErrors, setContactErrors] = useState<Record<number, string>>({});
  const [contactVerified, setContactVerified] = useState<
    Record<number, { phone: string; status: 'verifying' | 'success' | 'error' | 'verified'; error?: string; cooldownUntil?: number }>
  >({});
  const [personalOpenKey, setPersonalOpenKey] = useState(0);
  const [isMinor, setIsMinor] = useState(false);
  const [consentAccepted, setConsentAccepted] = useState(false);
  const [consentError, setConsentError] = useState('');
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [editMode, setEditMode] = useState(false);
  const [photoProcessing, setPhotoProcessing] = useState(false);

  const personalSectionRef = useRef<HTMLDivElement>(null);
  const userNameRef = useRef<HTMLInputElement>(null);
  const dobRef = useRef<HTMLInputElement>(null);
  const emergencyPhoneRef = useRef<HTMLInputElement>(null);
  const bloodTypeRef = useRef<HTMLDivElement>(null);

  const requiredFields: (keyof MedicalData)[] = ['userName', 'dob', 'bloodType', 'emergencyPhone'];
  const completedRequiredCount = requiredFields.filter((f) => !!medicalData[f]).length;
  const progressPercent = Math.round((completedRequiredCount / requiredFields.length) * 100);

  useEffect(() => {
    loadTagStatus();

    // Solo el dueño (autenticado con su PIN en esta pantalla) puede instalar
    // la ficha como respaldo en su teléfono.
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uuid]);

  const [cooldownTick, setCooldownTick] = useState(0);
  useEffect(() => {
    const hasAnyCooldown = Object.values(contactVerified).some((v) => v.cooldownUntil && v.cooldownUntil > Date.now());
    if (!hasAnyCooldown) return;
    const interval = setInterval(() => setCooldownTick((t) => t + 1), 1000);
    return () => clearInterval(interval);
  }, [contactVerified, cooldownTick]);

  async function handleInstallApp() {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    } else {
      alert('Para agregar esta página a tu pantalla de inicio:\n\n• En Android: Menú (⋮) → "Agregar a pantalla de inicio"\n• En iPhone: Compartir → "Agregar a pantalla de inicio"');
    }
  }

  async function handleDownloadImage() {
    if (!pinToken) return;
    try {
      await pinApi.downloadCardImage(uuid, pinToken);
    } catch (err: any) {
      toast.error(err.message || 'No se pudo descargar la imagen');
    }
  }

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
          if (json.data.medicalData.pacemakerICD) {
            if (json.data.medicalData.pacemakerICD === 'No') {
              setHasPacemaker(false);
            } else {
              setHasPacemaker(true);
              setPacemakerDetails(json.data.medicalData.pacemakerICD);
            }
          }
          if (json.data.medicalData.implantContraceptive) {
            if (json.data.medicalData.implantContraceptive === 'No') {
              setHasImplantContraceptive(false);
            } else {
              setHasImplantContraceptive(true);
              setImplantContraceptiveDetails(json.data.medicalData.implantContraceptive);
            }
          }
          if (json.data.medicalData.implantMammary) {
            if (json.data.medicalData.implantMammary === 'No') {
              setHasImplantMammary(false);
            } else {
              setHasImplantMammary(true);
              setImplantMammaryDetails(json.data.medicalData.implantMammary);
            }
          }
          if (json.data.medicalData.orthopedicImplants) {
            if (json.data.medicalData.orthopedicImplants === 'No') {
              setHasOrthopedicImplants(false);
            } else {
              setHasOrthopedicImplants(true);
              setOrthopedicImplantsDetails(json.data.medicalData.orthopedicImplants);
            }
          }
          if (json.data.medicalData.cochlearImplant) {
            if (json.data.medicalData.cochlearImplant === 'No') {
              setHasCochlearImplant(false);
            } else {
              setHasCochlearImplant(true);
              setCochlearImplantDetails(json.data.medicalData.cochlearImplant);
            }
          }
          if (json.data.medicalData.ocularProsthesis) {
            if (json.data.medicalData.ocularProsthesis === 'No') {
              setHasOcularProsthesis(false);
            } else {
              setHasOcularProsthesis(true);
              setOcularProsthesisDetails(json.data.medicalData.ocularProsthesis);
            }
          }
        }
        if (json.data.contacts && json.data.contacts.length > 0) {
          setContacts(json.data.contacts);
          const verifiedMap: Record<number, { phone: string; status: 'verifying' | 'success' | 'error' | 'verified'; error?: string; cooldownUntil?: number }> = {};
          json.data.contacts.forEach((c: any, idx: number) => {
            if (c.verified) {
              verifiedMap[idx] = { phone: c.phone, status: 'verified' };
            }
          });
          if (Object.keys(verifiedMap).length > 0) {
            setContactVerified((prev) => ({ ...prev, ...verifiedMap }));
          }
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
      await loadConfigData(loginRes.token);
      setEditMode(true);
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
      const hasData = await loadConfigData(res.token);
      setEditMode(!hasData);
      toast.success('Acceso concedido');
      setTimeout(() => setFormTransition(true), 100);
    } catch (err: any) {
      toast.error(err.message || 'PIN incorrecto');
      setPinError('PIN incorrecto');
    }
  }

  async function loadConfigData(token: string): Promise<boolean> {
    try {
      const data = await pinApi.getConfigData(uuid, token);
      if (data.medicalData) {
        setMedicalData({ ...emptyMedicalData, ...data.medicalData });
        if (data.medicalData.gender && !genders.includes(data.medicalData.gender)) {
          setCustomGender(data.medicalData.gender);
          updateMedicalField('gender', 'Otro');
        }
        if (data.medicalData.religion && !religions.includes(data.medicalData.religion)) {
          setCustomReligion(data.medicalData.religion);
          updateMedicalField('religion', 'Otra');
        }
        if (data.medicalData.umf && !umfClinics.includes(data.medicalData.umf)) {
          setCustomUmf(data.medicalData.umf);
          updateMedicalField('umf', 'Otra');
        }
        if (data.medicalData.allergies) {
          if (data.medicalData.allergies === 'Ninguna conocida') {
            setHasAllergies(false);
            setSelectedAllergies([]);
          } else {
            setHasAllergies(true);
            const allergies = data.medicalData.allergies.split('|').filter((a: string) => a.trim());
            setSelectedAllergies(allergies);
          }
        }
        if (data.medicalData.hereditaryConditions) {
          const items = data.medicalData.hereditaryConditions.split('|').filter((h: string) => h.trim());
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
        if (data.medicalData.pacemakerICD) {
          if (data.medicalData.pacemakerICD === 'No') {
            setHasPacemaker(false);
          } else {
            setHasPacemaker(true);
            setPacemakerDetails(data.medicalData.pacemakerICD);
          }
        }
        if (data.medicalData.implantContraceptive) {
          if (data.medicalData.implantContraceptive === 'No') {
            setHasImplantContraceptive(false);
          } else {
            setHasImplantContraceptive(true);
            setImplantContraceptiveDetails(data.medicalData.implantContraceptive);
          }
        }
        if (data.medicalData.implantMammary) {
          if (data.medicalData.implantMammary === 'No') {
            setHasImplantMammary(false);
          } else {
            setHasImplantMammary(true);
            setImplantMammaryDetails(data.medicalData.implantMammary);
          }
        }
        if (data.medicalData.orthopedicImplants) {
          if (data.medicalData.orthopedicImplants === 'No') {
            setHasOrthopedicImplants(false);
          } else {
            setHasOrthopedicImplants(true);
            setOrthopedicImplantsDetails(data.medicalData.orthopedicImplants);
          }
        }
        if (data.medicalData.cochlearImplant) {
          if (data.medicalData.cochlearImplant === 'No') {
            setHasCochlearImplant(false);
          } else {
            setHasCochlearImplant(true);
            setCochlearImplantDetails(data.medicalData.cochlearImplant);
          }
        }
        if (data.medicalData.ocularProsthesis) {
          if (data.medicalData.ocularProsthesis === 'No') {
            setHasOcularProsthesis(false);
          } else {
            setHasOcularProsthesis(true);
            setOcularProsthesisDetails(data.medicalData.ocularProsthesis);
          }
        }
      }
      if (data.contacts && data.contacts.length > 0) {
        setContacts(data.contacts);
        const verifiedMap: Record<number, { phone: string; status: 'verifying' | 'success' | 'error' | 'verified'; error?: string; cooldownUntil?: number }> = {};
        data.contacts.forEach((c: any, idx: number) => {
          if (c.verified) {
            verifiedMap[idx] = { phone: c.phone, status: 'verified' };
          }
        });
        if (Object.keys(verifiedMap).length > 0) {
          setContactVerified((prev) => ({ ...prev, ...verifiedMap }));
        }
      }
      return Boolean(data.medicalData?.userName);
    } catch {
      // Si falla, continuar con datos vacíos
      return false;
    }
  }

  function updateMedicalField(field: keyof MedicalData, value: string) {
    setMedicalData((prev) => ({ ...prev, [field]: value }));
    if (field === 'userName' || field === 'dob' || field === 'bloodType' || field === 'emergencyPhone') {
      setErrors((prev) => {
        if (!prev[field]) return prev;
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  }

  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('El archivo debe ser una imagen');
      return;
    }

    setPhotoProcessing(true);
    try {
      const dataUrl = await resizeImageToDataUrl(file, 480, 0.8);
      updateMedicalField('photo', dataUrl);
    } catch {
      toast.error('No se pudo procesar la imagen');
    } finally {
      setPhotoProcessing(false);
    }
  }

  function handleRemovePhoto() {
    updateMedicalField('photo', '');
  }

  function addContact() {
    setContacts((prev) => [...prev, { name: '', relationship: '', phone: '' }]);
  }

  function removeContact(index: number) {
    if (contacts.length > 1) {
      setContacts((prev) => prev.filter((_, i) => i !== index));
      // Los índices se recorren al quitar un elemento; en vez de arrastrar
      // estados mal alineados con el contacto equivocado, se limpian y el
      // usuario vuelve a verificar/corregir si hacía falta.
      setContactErrors({});
      setContactVerified({});
    }
  }

  function updateContact(index: number, field: keyof Contact, value: string) {
    setContacts((prev) =>
      prev.map((c, i) => (i === index ? { ...c, [field]: value } : c))
    );
    if (field === 'phone') {
      setContactVerified((prev) => {
        if (!prev[index]) return prev;
        const next = { ...prev };
        delete next[index];
        return next;
      });
    }
  }

  const VERIFY_COOLDOWN_MS = 30_000;
  const GLOBAL_COOLDOWN_MS = 10_000;
  const [globalCooldownUntil, setGlobalCooldownUntil] = useState(0);

  function sanitizeUserError(_error: string | undefined): string {
    return 'No se pudo verificar el número. Intenta nuevamente más tarde.';
  }

  async function handleVerifyContact(index: number) {
    const contact = contacts[index];
    if (!contact || contact.phone.length !== 10) {
      toast.error('Ingresa un teléfono de 10 dígitos antes de verificar');
      return;
    }
    if (!pinToken) return;

    const now = Date.now();
    if (globalCooldownUntil > now) {
      const secondsLeft = Math.ceil((globalCooldownUntil - now) / 1000);
      toast.error(`Espera ${secondsLeft} segundos antes de verificar otro contacto`);
      return;
    }

    const existing = contactVerified[index];
    if (existing?.cooldownUntil && existing.cooldownUntil > now) {
      const secondsLeft = Math.ceil((existing.cooldownUntil - now) / 1000);
      toast.error(`Espera ${secondsLeft} segundos antes de reintentar`);
      return;
    }

    setContactVerified((prev) => ({ ...prev, [index]: { phone: contact.phone, status: 'verifying' } }));
    try {
      const result = await pinApi.verifyContact(pinToken, contact.phone, medicalData.userName || undefined);
      const cooldownUntil = now + VERIFY_COOLDOWN_MS;
      setGlobalCooldownUntil(now + GLOBAL_COOLDOWN_MS);
      if (result.success) {
        // Actualizar estado del contacto en la lista
        setContacts((prev) => prev.map((c, i) => 
          i === index ? { ...c, verified: true, lastVerificationAt: new Date().toISOString() } : c
        ));
        setContactVerified((prev) => ({ ...prev, [index]: { phone: contact.phone, status: 'verified', cooldownUntil } }));
        toast.success(`Se envió un mensaje de prueba a ${contact.name || 'este contacto'} por WhatsApp`);
      } else {
        const sanitizedError = sanitizeUserError(result.error);
        setContactVerified((prev) => ({ ...prev, [index]: { phone: contact.phone, status: 'error', error: sanitizedError, cooldownUntil } }));
        toast.error(sanitizedError);
      }
    } catch (err: any) {
      const cooldownUntil = now + VERIFY_COOLDOWN_MS;
      setGlobalCooldownUntil(now + GLOBAL_COOLDOWN_MS);
      const sanitizedError = sanitizeUserError(err.message);
      setContactVerified((prev) => ({ ...prev, [index]: { phone: contact.phone, status: 'error', error: sanitizedError, cooldownUntil } }));
      toast.error(sanitizedError);
    }
  }

  async function handleResendVerification(index: number) {
    const contact = contacts[index];
    if (!contact || !contact.verified) return;
    if (!pinToken) return;

    const now = Date.now();
    if (globalCooldownUntil > now) {
      const secondsLeft = Math.ceil((globalCooldownUntil - now) / 1000);
      toast.error(`Espera ${secondsLeft} segundos antes de reenviar`);
      return;
    }

    setContactVerified((prev) => ({ ...prev, [index]: { phone: contact.phone, status: 'verifying' } }));
    try {
      const result = await pinApi.resendContactVerification(
        pinToken,
        contact.id || '',
        contact.phone,
        medicalData.userName || undefined
      );
      const cooldownUntil = now + VERIFY_COOLDOWN_MS;
      setGlobalCooldownUntil(now + GLOBAL_COOLDOWN_MS);
      if (result.success) {
        setContacts((prev) => prev.map((c, i) => 
          i === index ? { ...c, lastVerificationAt: new Date().toISOString() } : c
        ));
        setContactVerified((prev) => ({ ...prev, [index]: { phone: contact.phone, status: 'verified', cooldownUntil } }));
        toast.success(`Mensaje reenviado a ${contact.name || 'este contacto'}`);
      } else {
        const sanitizedError = sanitizeUserError(result.error);
        setContactVerified((prev) => ({ ...prev, [index]: { phone: contact.phone, status: 'error', error: sanitizedError, cooldownUntil } }));
        toast.error(sanitizedError);
      }
    } catch (err: any) {
      const cooldownUntil = now + VERIFY_COOLDOWN_MS;
      setGlobalCooldownUntil(now + GLOBAL_COOLDOWN_MS);
      const sanitizedError = sanitizeUserError(err.message);
      setContactVerified((prev) => ({ ...prev, [index]: { phone: contact.phone, status: 'error', error: sanitizedError, cooldownUntil } }));
      toast.error(sanitizedError);
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();

    const newErrors: typeof errors = {};
    if (!medicalData.userName.trim()) newErrors.userName = 'Ingresa el nombre completo';
    if (!medicalData.dob) newErrors.dob = 'Selecciona la fecha de nacimiento';
    if (!medicalData.bloodType) newErrors.bloodType = 'Selecciona el tipo de sangre';
    if (!medicalData.emergencyPhone.trim()) newErrors.emergencyPhone = 'Ingresa un telefono de emergencia';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setPersonalOpenKey((k) => k + 1);
      toast.error('Completa los campos marcados en rojo');
      setTimeout(() => {
        personalSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        const firstErrorRef = newErrors.userName
          ? userNameRef
          : newErrors.dob
          ? dobRef
          : newErrors.bloodType
          ? bloodTypeRef
          : emergencyPhoneRef;
        firstErrorRef.current?.focus();
      }, 150);
      return;
    }

    const filledContacts = contacts
      .map((c, index) => ({ ...c, index }))
      .filter((c) => c.name.trim() || c.phone.trim());

    const newContactErrors: Record<number, string> = {};
    filledContacts.forEach((c) => {
      if (!c.name.trim() || c.name.trim().length < 2) {
        newContactErrors[c.index] = 'Ingresa el nombre completo del contacto';
      } else if (c.phone.length !== 10) {
        newContactErrors[c.index] = 'El teléfono debe tener 10 dígitos';
      }
    });

    if (Object.keys(newContactErrors).length > 0) {
      setContactErrors(newContactErrors);
      toast.error('Revisa los datos de tus contactos de emergencia');
      return;
    }

    const unverified = filledContacts.filter((c) => {
      const v = contactVerified[c.index];
      return !v || v.phone !== c.phone || v.status !== 'verified';
    });
    if (unverified.length > 0) {
      const unverifiedErrors: Record<number, string> = {};
      unverified.forEach((c) => {
        unverifiedErrors[c.index] = 'Verifica este número por WhatsApp antes de guardar';
      });
      setContactErrors(unverifiedErrors);
      toast.error('Verifica el número de tus contactos de emergencia antes de guardar (botón "Verificar")');
      return;
    }
    setContactErrors({});

    if (!consentAccepted) {
      setConsentError('Debes aceptar el Aviso de Privacidad para guardar tus datos');
      toast.error('Debes aceptar el Aviso de Privacidad para continuar');
      return;
    }

    if (!pinToken) {
      toast.error('No hay sesion activa');
      return;
    }

    const contactsToSubmit = filledContacts.map(({ index: _index, ...c }) => c);

    setSaving(true);
    try {
      await pinApi.updateMedicalData(pinToken, medicalData, contactsToSubmit, { isMinor, consentAccepted });
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
                  onClick={() => {
                    setShowSuccess(false);
                    setEditMode(false);
                  }}
                  className="w-full flex items-center justify-center gap-2 bg-red-600 text-white font-semibold py-3.5 px-6 rounded-xl hover:bg-red-700 transition-colors shadow-lg shadow-red-600/20 min-h-[44px]"
                >
                  <Activity className="w-5 h-5" />
                  Ver mi Ficha
                </button>

                <button
                  onClick={() => setShowSuccess(false)}
                  className="w-full flex items-center justify-center gap-2 bg-gray-100 text-gray-700 font-semibold py-3.5 px-6 rounded-xl hover:bg-gray-200 transition-colors min-h-[44px]"
                >
                  <Save className="w-5 h-5" />
                  Seguir Editando
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (pinToken && formTransition && !editMode) {
    return (
      <OwnerView
        medicalData={medicalData}
        contacts={contacts}
        onEdit={() => setEditMode(true)}
        onInstallApp={handleInstallApp}
        onDownloadImage={handleDownloadImage}
      />
    );
  }

  if (pinToken && formTransition && editMode) {
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

              <div className="mt-4 max-w-xs mx-auto">
                <div className="flex items-center justify-between text-xs text-red-100 mb-1.5">
                  <span>Datos obligatorios</span>
                  <span className="font-semibold">{completedRequiredCount}/{requiredFields.length}</span>
                </div>
                <div className="h-1.5 bg-white/20 rounded-full overflow-hidden" role="progressbar" aria-valuenow={progressPercent} aria-valuemin={0} aria-valuemax={100}>
                  <div
                    className="h-full bg-white rounded-full transition-all duration-500"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
            </div>

            <form onSubmit={handleSave} className="p-4 sm:p-6 space-y-4">
              <div ref={personalSectionRef}>
              <SectionCard
                key={personalOpenKey}
                icon={User}
                title="Informacion Personal"
                defaultOpen={true}
                highlight={Object.keys(errors).length > 0}
              >
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="relative w-20 h-20 flex-shrink-0">
                      {medicalData.photo ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={medicalData.photo}
                          alt="Foto"
                          className="w-20 h-20 rounded-full object-cover border-2 border-gray-200"
                        />
                      ) : (
                        <div className="w-20 h-20 rounded-full bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center">
                          <Camera className="w-7 h-7 text-gray-400" />
                        </div>
                      )}
                      {photoProcessing && (
                        <div className="absolute inset-0 bg-white/70 rounded-full flex items-center justify-center">
                          <Loader2 className="w-6 h-6 animate-spin text-red-600" />
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="cursor-pointer inline-flex items-center gap-2 text-sm font-semibold text-red-600 hover:text-red-700">
                        <Camera className="w-4 h-4" />
                        {medicalData.photo ? 'Cambiar foto' : 'Agregar foto'}
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handlePhotoChange}
                          className="hidden"
                          disabled={photoProcessing}
                        />
                      </label>
                      {medicalData.photo && (
                        <button
                          type="button"
                          onClick={handleRemovePhoto}
                          className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-700"
                        >
                          <X className="w-3.5 h-3.5" />
                          Quitar foto
                        </button>
                      )}
                    </div>
                  </div>

                  <InputField
                    ref={userNameRef}
                    label="Nombre Completo"
                    required
                    type="text"
                    value={medicalData.userName}
                    onChange={(e) => updateMedicalField('userName', e.target.value)}
                    error={errors.userName}
                  />

                  <InputField
                    ref={dobRef}
                    label="Fecha Nacimiento"
                    required
                    type="date"
                    value={dobToInputValue(medicalData.dob)}
                    max={todayInputValue}
                    min={minDobInputValue}
                    onChange={(e) => updateMedicalField('dob', inputValueToDob(e.target.value))}
                    error={errors.dob}
                  />

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
                    <div className="space-y-1.5" ref={bloodTypeRef} tabIndex={-1}>
                      <label className="block text-sm font-semibold text-gray-700">
                        Tipo de Sangre <span className="text-red-500">*</span>
                      </label>
                      <div className={`grid grid-cols-4 gap-2 rounded-xl ${errors.bloodType ? 'ring-2 ring-red-400 p-1.5 -m-1.5' : ''}`}>
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
                      {errors.bloodType && (
                        <div role="alert" className="flex items-center gap-1.5 text-red-600 text-xs font-medium pt-0.5">
                          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                          <span>{errors.bloodType}</span>
                        </div>
                      )}
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
                      ref={emergencyPhoneRef}
                      label="Telefono Emergencia"
                      required
                      type="tel"
                      inputMode="numeric"
                      value={medicalData.emergencyPhone}
                      onChange={(e) => updateMedicalField('emergencyPhone', e.target.value.replace(/\D/g, '').slice(0, 10))}
                      placeholder="10 digitos"
                      maxLength={10}
                      error={errors.emergencyPhone}
                    />
                  </div>
                </div>
              </SectionCard>
              </div>

              <SectionCard
                icon={FileText}
                title="Datos IMSS"
                defaultOpen={false}
                complete={!!medicalData.curp || !!medicalData.nss}
              >
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

              <SectionCard
                icon={Stethoscope}
                title="Informacion Medica"
                defaultOpen={false}
                complete={hasAllergies !== null && hasHereditary !== null}
              >
                <div className="space-y-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-2">
                    <p className="text-xs font-semibold text-blue-800 mb-1">Dispositivos Medicos Implantados</p>
                    <p className="text-[11px] text-blue-600">Estos dispositivos pueden interferir con procedimientos de emergencia como RCP, desfibrilacion o inmovilizacion.</p>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-sm font-semibold text-gray-700">Marcapasos o Cardiodesfibrilador Implantable</label>
                    <div className="flex gap-2">
                      {['Si', 'No'].map((opt) => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => {
                            if (opt === 'Si') {
                              setHasPacemaker(true);
                            } else {
                              setHasPacemaker(false);
                              setPacemakerDetails('');
                              updateMedicalField('pacemakerICD', 'No');
                            }
                          }}
                          className={`flex-1 h-11 rounded-xl text-sm font-medium transition-all border ${
                            (opt === 'Si' && hasPacemaker === true) || (opt === 'No' && hasPacemaker === false)
                              ? opt === 'Si'
                                ? 'bg-red-600 text-white border-red-600 shadow-md shadow-red-600/20'
                                : 'bg-green-600 text-white border-green-600 shadow-md shadow-green-600/20'
                              : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                    {hasPacemaker === true && (
                      <textarea
                        value={pacemakerDetails}
                        onChange={(e) => {
                          setPacemakerDetails(e.target.value);
                          updateMedicalField('pacemakerICD', e.target.value);
                        }}
                        rows={2}
                        placeholder="Tipo, modelo, fecha de implante, lado..."
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm bg-gray-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500 transition-all mt-2 resize-none"
                      />
                    )}
                    {hasPacemaker === false && (
                      <div className="flex items-center gap-2 text-green-700 bg-green-50 px-4 py-3 rounded-xl border border-green-100 mt-2">
                        <CheckCircle className="w-4 h-4 flex-shrink-0" />
                        <span className="text-sm font-medium">Sin marcapasos</span>
                      </div>
                    )}
                  </div>

                  {medicalData.gender === 'Femenino' && (
                    <>
                      <div className="space-y-1.5">
                        <label className="block text-sm font-semibold text-gray-700">Implante Anticonceptivo Subdermico</label>
                        <div className="flex gap-2">
                          {['Si', 'No'].map((opt) => (
                            <button
                              key={opt}
                              type="button"
                              onClick={() => {
                                if (opt === 'Si') {
                                  setHasImplantContraceptive(true);
                                } else {
                                  setHasImplantContraceptive(false);
                                  setImplantContraceptiveDetails('');
                                  updateMedicalField('implantContraceptive', 'No');
                                }
                              }}
                              className={`flex-1 h-11 rounded-xl text-sm font-medium transition-all border ${
                                (opt === 'Si' && hasImplantContraceptive === true) || (opt === 'No' && hasImplantContraceptive === false)
                                  ? opt === 'Si'
                                    ? 'bg-red-600 text-white border-red-600 shadow-md shadow-red-600/20'
                                    : 'bg-green-600 text-white border-green-600 shadow-md shadow-green-600/20'
                                  : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-gray-300'
                              }`}
                            >
                              {opt}
                            </button>
                          ))}
                        </div>
                        {hasImplantContraceptive === true && (
                          <textarea
                            value={implantContraceptiveDetails}
                            onChange={(e) => {
                              setImplantContraceptiveDetails(e.target.value);
                              updateMedicalField('implantContraceptive', e.target.value);
                            }}
                            rows={2}
                            placeholder="Lado del brazo, fecha de colocacion..."
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm bg-gray-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500 transition-all mt-2 resize-none"
                          />
                        )}
                        {hasImplantContraceptive === false && (
                          <div className="flex items-center gap-2 text-green-700 bg-green-50 px-4 py-3 rounded-xl border border-green-100 mt-2">
                            <CheckCircle className="w-4 h-4 flex-shrink-0" />
                            <span className="text-sm font-medium">Sin implante anticonceptivo</span>
                          </div>
                        )}
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-sm font-semibold text-gray-700">Implantes Mamarios</label>
                        <div className="flex gap-2">
                          {['Si', 'No'].map((opt) => (
                            <button
                              key={opt}
                              type="button"
                              onClick={() => {
                                if (opt === 'Si') {
                                  setHasImplantMammary(true);
                                } else {
                                  setHasImplantMammary(false);
                                  setImplantMammaryDetails('');
                                  updateMedicalField('implantMammary', 'No');
                                }
                              }}
                              className={`flex-1 h-11 rounded-xl text-sm font-medium transition-all border ${
                                (opt === 'Si' && hasImplantMammary === true) || (opt === 'No' && hasImplantMammary === false)
                                  ? opt === 'Si'
                                    ? 'bg-red-600 text-white border-red-600 shadow-md shadow-red-600/20'
                                    : 'bg-green-600 text-white border-green-600 shadow-md shadow-green-600/20'
                                  : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-gray-300'
                              }`}
                            >
                              {opt}
                            </button>
                          ))}
                        </div>
                        {hasImplantMammary === true && (
                          <textarea
                            value={implantMammaryDetails}
                            onChange={(e) => {
                              setImplantMammaryDetails(e.target.value);
                              updateMedicalField('implantMammary', e.target.value);
                            }}
                            rows={2}
                            placeholder="Tipo, fecha de colocacion..."
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm bg-gray-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500 transition-all mt-2 resize-none"
                          />
                        )}
                        {hasImplantMammary === false && (
                          <div className="flex items-center gap-2 text-green-700 bg-green-50 px-4 py-3 rounded-xl border border-green-100 mt-2">
                            <CheckCircle className="w-4 h-4 flex-shrink-0" />
                            <span className="text-sm font-medium">Sin implantes mamarios</span>
                          </div>
                        )}
                      </div>
                    </>
                  )}

                  <div className="space-y-1.5">
                    <label className="block text-sm font-semibold text-gray-700">Implantes Ortopedicos Metalicos o Neuroestimuladores</label>
                    <div className="flex gap-2">
                      {['Si', 'No'].map((opt) => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => {
                            if (opt === 'Si') {
                              setHasOrthopedicImplants(true);
                            } else {
                              setHasOrthopedicImplants(false);
                              setOrthopedicImplantsDetails('');
                              updateMedicalField('orthopedicImplants', 'No');
                            }
                          }}
                          className={`flex-1 h-11 rounded-xl text-sm font-medium transition-all border ${
                            (opt === 'Si' && hasOrthopedicImplants === true) || (opt === 'No' && hasOrthopedicImplants === false)
                              ? opt === 'Si'
                                ? 'bg-red-600 text-white border-red-600 shadow-md shadow-red-600/20'
                                : 'bg-green-600 text-white border-green-600 shadow-md shadow-green-600/20'
                              : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                    {hasOrthopedicImplants === true && (
                      <textarea
                        value={orthopedicImplantsDetails}
                        onChange={(e) => {
                          setOrthopedicImplantsDetails(e.target.value);
                          updateMedicalField('orthopedicImplants', e.target.value);
                        }}
                        rows={2}
                        placeholder="Ubicacion, tipo de implante..."
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm bg-gray-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500 transition-all mt-2 resize-none"
                      />
                    )}
                    {hasOrthopedicImplants === false && (
                      <div className="flex items-center gap-2 text-green-700 bg-green-50 px-4 py-3 rounded-xl border border-green-100 mt-2">
                        <CheckCircle className="w-4 h-4 flex-shrink-0" />
                        <span className="text-sm font-medium">Sin implantes ortopedicos</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-sm font-semibold text-gray-700">Implante Coclear u Otro Dispositivo Auditivo</label>
                    <div className="flex gap-2">
                      {['Si', 'No'].map((opt) => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => {
                            if (opt === 'Si') {
                              setHasCochlearImplant(true);
                            } else {
                              setHasCochlearImplant(false);
                              setCochlearImplantDetails('');
                              updateMedicalField('cochlearImplant', 'No');
                            }
                          }}
                          className={`flex-1 h-11 rounded-xl text-sm font-medium transition-all border ${
                            (opt === 'Si' && hasCochlearImplant === true) || (opt === 'No' && hasCochlearImplant === false)
                              ? opt === 'Si'
                                ? 'bg-red-600 text-white border-red-600 shadow-md shadow-red-600/20'
                                : 'bg-green-600 text-white border-green-600 shadow-md shadow-green-600/20'
                              : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                    {hasCochlearImplant === true && (
                      <textarea
                        value={cochlearImplantDetails}
                        onChange={(e) => {
                          setCochlearImplantDetails(e.target.value);
                          updateMedicalField('cochlearImplant', e.target.value);
                        }}
                        rows={2}
                        placeholder="Lado (izquierdo/derecho/ambos), tipo..."
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm bg-gray-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500 transition-all mt-2 resize-none"
                      />
                    )}
                    {hasCochlearImplant === false && (
                      <div className="flex items-center gap-2 text-green-700 bg-green-50 px-4 py-3 rounded-xl border border-green-100 mt-2">
                        <CheckCircle className="w-4 h-4 flex-shrink-0" />
                        <span className="text-sm font-medium">Sin implante coclear</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-sm font-semibold text-gray-700">Protesis Ocular</label>
                    <div className="flex gap-2">
                      {['Si', 'No'].map((opt) => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => {
                            if (opt === 'Si') {
                              setHasOcularProsthesis(true);
                            } else {
                              setHasOcularProsthesis(false);
                              setOcularProsthesisDetails('');
                              updateMedicalField('ocularProsthesis', 'No');
                            }
                          }}
                          className={`flex-1 h-11 rounded-xl text-sm font-medium transition-all border ${
                            (opt === 'Si' && hasOcularProsthesis === true) || (opt === 'No' && hasOcularProsthesis === false)
                              ? opt === 'Si'
                                ? 'bg-red-600 text-white border-red-600 shadow-md shadow-red-600/20'
                                : 'bg-green-600 text-white border-green-600 shadow-md shadow-green-600/20'
                              : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                    {hasOcularProsthesis === true && (
                      <textarea
                        value={ocularProsthesisDetails}
                        onChange={(e) => {
                          setOcularProsthesisDetails(e.target.value);
                          updateMedicalField('ocularProsthesis', e.target.value);
                        }}
                        rows={2}
                        placeholder="Ojo afectado (izquierdo/derecho)..."
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm bg-gray-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500 transition-all mt-2 resize-none"
                      />
                    )}
                    {hasOcularProsthesis === false && (
                      <div className="flex items-center gap-2 text-green-700 bg-green-50 px-4 py-3 rounded-xl border border-green-100 mt-2">
                        <CheckCircle className="w-4 h-4 flex-shrink-0" />
                        <span className="text-sm font-medium">Sin protesis ocular</span>
                      </div>
                    )}
                  </div>

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

              <SectionCard
                icon={Contact}
                title="Contactos de Emergencia"
                defaultOpen={false}
                complete={contacts.some((c) => c.name && c.phone)}
              >
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
                        inputMode="numeric"
                        value={contact.phone}
                        onChange={(e) => {
                          updateContact(index, 'phone', e.target.value.replace(/\D/g, '').slice(0, 10));
                          if (contactErrors[index]) {
                            setContactErrors((prev) => {
                              const next = { ...prev };
                              delete next[index];
                              return next;
                            });
                          }
                        }}
                        placeholder="10 digitos"
                        maxLength={10}
                        error={contactErrors[index]}
                      />
                      <div className="flex items-center gap-2">
                        {contact.verified ? (
                          <div className="flex items-center gap-2">
                            <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700">
                              <CheckCircle className="w-3.5 h-3.5" /> Verificado
                            </span>
                            <button
                              type="button"
                              onClick={() => handleResendVerification(index)}
                              disabled={
                                contactVerified[index]?.status === 'verifying' ||
                                Boolean(contactVerified[index]?.cooldownUntil && contactVerified[index].cooldownUntil > Date.now())
                              }
                              className="text-xs text-blue-600 hover:text-blue-800 underline disabled:opacity-50 disabled:hover:text-blue-600"
                            >
                              {contactVerified[index]?.status === 'verifying'
                                ? 'Enviando...'
                                : contactVerified[index]?.cooldownUntil && contactVerified[index].cooldownUntil > Date.now()
                                  ? `Reenviar (${Math.ceil((contactVerified[index].cooldownUntil - Date.now()) / 1000)}s)`
                                  : 'Reenviar mensaje'}
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleVerifyContact(index)}
                            disabled={
                              contact.phone.length !== 10 ||
                              contactVerified[index]?.status === 'verifying' ||
                              Boolean(contactVerified[index]?.cooldownUntil && contactVerified[index].cooldownUntil > Date.now())
                            }
                            className="flex items-center gap-1.5 text-xs font-semibold text-green-700 bg-green-50 hover:bg-green-100 border border-green-200 disabled:opacity-50 disabled:hover:bg-green-50 px-3 py-2 rounded-lg transition-colors min-h-[36px]"
                          >
                            {contactVerified[index]?.status === 'verifying' ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <MessageCircle className="w-3.5 h-3.5" />
                            )}
                            {contactVerified[index]?.status === 'verifying'
                              ? 'Verificando...'
                              : contactVerified[index]?.cooldownUntil && contactVerified[index].cooldownUntil > Date.now()
                                ? `Reintentar (${Math.ceil((contactVerified[index].cooldownUntil - Date.now()) / 1000)}s)`
                                : 'Verificar por WhatsApp'}
                          </button>
                        )}
                        {contactVerified[index]?.phone === contact.phone && contactVerified[index]?.status === 'error' && (!contactVerified[index]?.cooldownUntil || contactVerified[index].cooldownUntil <= Date.now()) && (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-red-600">
                            <AlertCircle className="w-3.5 h-3.5" /> {contactVerified[index]?.error || 'No se pudo verificar'}
                          </span>
                        )}
                      </div>
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

              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-3">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isMinor}
                    onChange={(e) => setIsMinor(e.target.checked)}
                    className="mt-1 w-4 h-4 accent-red-600"
                  />
                  <span className="text-sm text-gray-700">
                    Estos datos corresponden a un <strong>menor de edad</strong> y yo soy su
                    madre, padre o tutor legal.
                  </span>
                </label>

                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={consentAccepted}
                    onChange={(e) => {
                      setConsentAccepted(e.target.checked);
                      if (e.target.checked) setConsentError('');
                    }}
                    className="mt-1 w-4 h-4 accent-red-600"
                  />
                  <span className="text-sm text-gray-700">
                    {isMinor ? (
                      <>En mi calidad de madre, padre o tutor legal, he leído el{' '}</>
                    ) : (
                      <>He leído el{' '}</>
                    )}
                    <a
                      href="/aviso-de-privacidad"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-red-600 underline font-semibold"
                    >
                      Aviso de Privacidad
                    </a>{' '}
                    y otorgo mi consentimiento expreso para el tratamiento de estos datos
                    sensibles, incluyendo su despliegue a cualquier persona que escanee este tag
                    en caso de emergencia.
                  </span>
                </label>
                {consentError && (
                  <p className="text-sm text-red-600 font-medium">{consentError}</p>
                )}
              </div>

              <div className="pt-2 no-print space-y-2">
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
                {isActive && (
                  <button
                    type="button"
                    onClick={() => setEditMode(false)}
                    disabled={saving}
                    className="w-full flex items-center justify-center gap-2 bg-gray-100 text-gray-700 font-semibold py-3 px-6 rounded-xl hover:bg-gray-200 transition-colors disabled:opacity-50 min-h-[44px]"
                  >
                    Cancelar
                  </button>
                )}
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
