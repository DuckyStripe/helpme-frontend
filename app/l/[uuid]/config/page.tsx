'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { pinApi, insurersApi, tagsApi } from '@/lib/api';
import { toast } from '@/lib/toast';
import { getPlanLimits, type PlanType } from '@/lib/plans';
import { calculateAge } from '@/lib/utils';
import {
  Shield, Lock, Activity, Plus, Trash2, Save, CheckCircle, Loader2, AlertTriangle,
  User, Eye, EyeOff, ChevronDown, ChevronUp,
  Stethoscope, AlertCircle, Contact, Camera, X, MessageCircle, Car, Phone,
} from 'lucide-react';
import OwnerView from '@/components/OwnerView';
import ThemeToggle from '@/components/ui/ThemeToggle';

type TagStatus = 'VIRGIN' | 'INCOMPLETE' | 'ACTIVE' | 'SUSPENDED';

export interface Contact {
  id?: string;
  name: string;
  relationship: string;
  phone: string;
  verified?: boolean;
  lastVerificationAt?: string;
}

export interface Vehicle {
  id?: string;
  type: 'AUTO' | 'MOTO' | 'BICICLETA';
  brand: string;
  model: string;
  year?: string;
  color: string;
  plate?: string;
  insurerId?: string;
  insurer?: { id: string; name: string; phone: string } | null;
  policyNumber?: string;
  cylinder?: string;
  bikeType?: string;
}

export interface MedicalData {
  ownerPhone: string;
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
  insuranceType: string;
  insuranceIdentifier: string;
  insuranceDetails: string;
  insurancePolicyNumber: string;
  insuranceCompany: string;
  insurancePhone: string;
  previousHospitalizations: string;
  previousSurgeries: string;
  previousTrauma: string;
  wantsPublicCare: boolean;
}

const emptyMedicalData: MedicalData = {
  ownerPhone: '',
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
  insuranceType: '',
  insuranceIdentifier: '',
  insuranceDetails: '',
  insurancePolicyNumber: '',
  insuranceCompany: '',
  insurancePhone: '',
  previousHospitalizations: '',
  previousSurgeries: '',
  previousTrauma: '',
  wantsPublicCare: false,
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
              ? 'border-red-500 bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 scale-105 shadow-md shadow-red-500/20'
              : i === value.length
              ? 'border-red-400 bg-white dark:bg-gray-900 animate-pulse'
              : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900'
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
        maxLength={length}
        aria-label="PIN input"
      />
    </div>
  );
}

function AnimatedCheckmark() {
  return (
    <div className="relative w-20 h-20 mx-auto">
      <div className="absolute inset-0 bg-green-500 rounded-full animate-ping opacity-20 motion-safe:animate-ping" />
      <div className="absolute inset-0 bg-green-500 rounded-full animate-pulse opacity-30 motion-safe:animate-pulse" />
      <div className="relative bg-gradient-to-br from-green-500 to-green-600 rounded-full w-20 h-20 flex items-center justify-center shadow-xl shadow-green-500/30">
        <CheckCircle className="w-10 h-10 text-white motion-safe:animate-bounce" />
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
      className={`bg-white dark:bg-gray-900 rounded-2xl shadow-sm border overflow-hidden ${
        highlight ? 'border-red-400 ring-2 ring-red-400/40' : 'border-gray-100 dark:border-gray-800'
      }`}
    >
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-4 sm:p-5 hover:bg-gray-50/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-500/10 flex items-center justify-center flex-shrink-0">
            <Icon className="w-5 h-5 text-red-600 dark:text-red-400" />
          </div>
          <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">{title}</h3>
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
        <div className="px-4 sm:px-5 pb-4 sm:pb-5 pt-0 space-y-4 border-t border-gray-100 dark:border-gray-800">
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
      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <input
        {...props}
        ref={ref}
        aria-invalid={!!error}
        className={`w-full h-12 px-4 border rounded-xl text-sm bg-gray-50/50 dark:bg-gray-800/50 text-gray-900 dark:text-gray-100 focus:bg-white dark:focus:bg-gray-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500/30 focus-visible:border-red-500 transition-colors ${
          error
            ? 'border-red-400 ring-1 ring-red-400'
            : 'border-gray-200 dark:border-gray-700'
        } ${props.className || ''}`}
      />
      {error && (
        <div role="alert" className="flex items-center gap-1.5 text-red-600 dark:text-red-400 text-xs font-medium pt-0.5">
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
});


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
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
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
  const [hasHospitalizations, setHasHospitalizations] = useState<boolean | null>(null);
  const [hasSurgeries, setHasSurgeries] = useState<boolean | null>(null);
  const [hasTrauma, setHasTrauma] = useState<boolean | null>(null);
  const [hasMedications, setHasMedications] = useState<boolean | null>(null);
  const [hasReligion, setHasReligion] = useState<boolean | null>(null);
  const [hasOrganDonor, setHasOrganDonor] = useState<boolean | null>(null);
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
  const [errors, setErrors] = useState<Partial<Record<'ownerPhone' | 'userName' | 'dob' | 'bloodType' | 'emergencyPhone', string>>>({});
  const [contactErrors, setContactErrors] = useState<Record<number, string>>({});
  const [contactVerified, setContactVerified] = useState<
    Record<number, { phone: string; status: 'verifying' | 'success' | 'error' | 'verified'; error?: string; cooldownUntil?: number }>
  >({});
  const [personalOpenKey, setPersonalOpenKey] = useState(0);
  const age = calculateAge(medicalData.dob);
  const isMinor = age !== null && age < 18;
  const [consentAccepted, setConsentAccepted] = useState(false);
  const [consentError, setConsentError] = useState('');
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [editMode, setEditMode] = useState(false);
  const [photoProcessing, setPhotoProcessing] = useState(false);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [vehicleSectionEnabled, setVehicleSectionEnabled] = useState(false);
  const [insurers, setInsurers] = useState<Array<{ id: string; name: string; phone: string }>>([]);
  const [userDisabled, setUserDisabled] = useState(false);
  const [togglingPrivacy, setTogglingPrivacy] = useState(false);
  const [tagPlan, setTagPlan] = useState<PlanType>('PRINCIPAL');
  const [previousPlan, setPreviousPlan] = useState<PlanType | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);

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
    loadInsurers();

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

  useEffect(() => {
    if (pinToken && formTransition) {
      loadAlerts();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pinToken, formTransition]);

  useEffect(() => {
    if (!hasUnsavedChanges) return;
    function handleBeforeUnload(e: BeforeUnloadEvent) {
      e.preventDefault();
      e.returnValue = '';
    }
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

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

  async function loadInsurers() {
    try {
      const list = await insurersApi.listActive();
      setInsurers(list);
    } catch {
      // Silencioso
    }
  }

  async function loadTagStatus() {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/tags/${uuid}/view`);
      const json = await res.json();
      if (res.ok) {
        setStatus(json.data.status);
        if (json.data.plan) setTagPlan(json.data.plan);
        if (json.data.previousPlan) setPreviousPlan(json.data.previousPlan);
        if (json.data.expiresAt) setExpiresAt(json.data.expiresAt);
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
          if (json.data.medicalData.nss && !json.data.medicalData.insuranceType) {
            updateMedicalField('insuranceType', 'IMSS');
          }
          if (json.data.medicalData.religion) {
            setHasReligion(true);
          }
          if (json.data.medicalData.organDonor) {
            setHasOrganDonor(json.data.medicalData.organDonor === 'Si');
          }
          if (json.data.medicalData.previousHospitalizations) {
            setHasHospitalizations(true);
          }
          if (json.data.medicalData.previousSurgeries) {
            setHasSurgeries(true);
          }
          if (json.data.medicalData.previousTrauma) {
            setHasTrauma(true);
          }
          if (json.data.medicalData.medications) {
            setHasMedications(true);
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
    if (!/^\d{6}$/.test(value)) {
      return 'El PIN debe tener exactamente 6 digitos';
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
      if (typeof window !== 'undefined') {
        localStorage.setItem('pin_token', loginRes.token);
        localStorage.setItem('last_active_tag_uuid', uuid);
      }
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
      if (typeof window !== 'undefined') {
        localStorage.setItem('pin_token', res.token);
        localStorage.setItem('last_active_tag_uuid', uuid);
      }
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
        if (data.medicalData.nss && !data.medicalData.insuranceType) {
          updateMedicalField('insuranceType', 'IMSS');
        }
        if (data.medicalData.religion) {
          setHasReligion(true);
        }
        if (data.medicalData.organDonor) {
          setHasOrganDonor(data.medicalData.organDonor === 'Si');
        }
        if (data.medicalData.previousHospitalizations) {
          setHasHospitalizations(true);
        }
        if (data.medicalData.previousSurgeries) {
          setHasSurgeries(true);
        }
        if (data.medicalData.previousTrauma) {
          setHasTrauma(true);
        }
        if (data.medicalData.medications) {
          setHasMedications(true);
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
      if (data.vehicles && data.vehicles.length > 0) {
        setVehicles(data.vehicles);
        setVehicleSectionEnabled(true);
      }
      if (typeof data.userDisabled === 'boolean') {
        setUserDisabled(data.userDisabled);
      }
      return Boolean(data.medicalData?.userName);
    } catch {
      // Si falla, continuar con datos vacíos
      return false;
    }
  }

  function updateMedicalField<K extends keyof MedicalData>(field: K, value: MedicalData[K]) {
    setMedicalData((prev) => ({ ...prev, [field]: value }));
    setHasUnsavedChanges(true);
    if (field === 'userName' || field === 'dob' || field === 'bloodType' || field === 'emergencyPhone') {
      const errorField = field as 'userName' | 'dob' | 'bloodType' | 'emergencyPhone';
      setErrors((prev) => {
        if (!prev[errorField]) return prev;
        const next = { ...prev };
        delete next[errorField];
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
    const limits = getPlanLimits(tagPlan);
    if (contacts.length >= limits.maxContacts) {
      toast.error(`Tu plan permite máximo ${limits.maxContacts} contacto${limits.maxContacts > 1 ? 's' : ''}`);
      return;
    }
    setContacts((prev) => [...prev, { name: '', relationship: '', phone: '' }]);
  }

  function addVehicle() {
    const limits = getPlanLimits(tagPlan);
    if (vehicles.length >= limits.maxVehicles) return;
    setVehicles((prev) => [...prev, { type: 'AUTO', brand: '', model: '', year: '', color: '', plate: '', insurerId: '', policyNumber: '', cylinder: '', bikeType: '' }]);
  }

  function removeVehicle(index: number) {
    setVehicles((prev) => prev.filter((_, i) => i !== index));
  }

  function updateVehicle(index: number, field: keyof Vehicle, value: string) {
    setVehicles((prev) =>
      prev.map((v, i) => (i === index ? { ...v, [field]: value } : v))
    );
  }

  async function handleTogglePrivacy() {
    if (!pinToken) return;
    setTogglingPrivacy(true);
    try {
      const result = await pinApi.toggleUserDisabled(uuid, pinToken, !userDisabled);
      setUserDisabled(result.userDisabled);
      toast.success(result.userDisabled
        ? 'Modo privado activado. Tus contactos han recibido el código de emergencia.'
        : 'Modo privado desactivado. Tu ficha es pública de nuevo.'
      );
    } catch (err: any) {
      toast.error(err.message || 'Error al cambiar el modo privado');
    } finally {
      setTogglingPrivacy(false);
    }
  }

  const [sendingAlert, setSendingAlert] = useState(false);

  async function handleSendAlert(comment: string, location: { lat: number; lng: number; address?: string }) {
    setSendingAlert(true);
    try {
      const result = await tagsApi.sendAlertToAll(uuid, location, undefined, comment);
      const succeeded = result.results.filter((r) => r.success);
      const failed = result.results.filter((r) => !r.success);
      if (failed.length === 0) {
        toast.success(`Alerta enviada a ${succeeded.map((r) => r.contactName).join(', ')}`);
      } else if (succeeded.length === 0) {
        toast.error(`No se pudo enviar la alerta a ningún contacto`);
      } else {
        toast.success(`Alerta enviada a ${succeeded.map((r) => r.contactName).join(', ')}. Falló: ${failed.map((r) => r.contactName).join(', ')}`);
      }
    } catch (err: any) {
      toast.error(err.message || 'No se pudo enviar la alerta');
    } finally {
      setSendingAlert(false);
    }
  }

  const [changingPin, setChangingPin] = useState(false);
  const [changePinCurrent, setChangePinCurrent] = useState('');
  const [changePinNew, setChangePinNew] = useState('');
  const [changePinConfirm, setChangePinConfirm] = useState('');
  const [changePinError, setChangePinError] = useState('');
  const [showChangePinModal, setShowChangePinModal] = useState(false);
  const [alerts, setAlerts] = useState<any[]>([]);

  async function handleChangePin() {
    setChangePinError('');
    if (changePinCurrent.length !== 6 || !/^\d+$/.test(changePinCurrent)) {
      setChangePinError('El PIN actual debe tener 6 dígitos');
      return;
    }
    if (changePinNew.length !== 6 || !/^\d+$/.test(changePinNew)) {
      setChangePinError('El nuevo PIN debe tener 6 dígitos');
      return;
    }
    if (changePinNew !== changePinConfirm) {
      setChangePinError('Los nuevos PIN no coinciden');
      return;
    }
    if (changePinCurrent === changePinNew) {
      setChangePinError('El nuevo PIN debe ser diferente al actual');
      return;
    }

    setChangingPin(true);
    try {
      await pinApi.changePin(uuid, pinToken!, changePinCurrent, changePinNew);
      toast.success('PIN cambiado exitosamente');
      setShowChangePinModal(false);
      setChangePinCurrent('');
      setChangePinNew('');
      setChangePinConfirm('');
    } catch (err: any) {
      setChangePinError(err.message || 'Error al cambiar el PIN');
    } finally {
      setChangingPin(false);
    }
  }

  async function loadAlerts() {
    try {
      if (!pinToken) return;
      const res = await pinApi.getOwnerAlerts(uuid, pinToken);
      setAlerts(res.alerts || []);
    } catch {
      // Silencioso
    }
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
        if (prev[index].phone === value) return prev;
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
    if (!medicalData.ownerPhone.trim() || medicalData.ownerPhone.length !== 10) newErrors.ownerPhone = 'Ingresa tu numero de 10 digitos';
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
      const alreadyVerified = c.verified === true && v?.phone === c.phone;
      if (alreadyVerified) return false;
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

    const vehiclesToSubmit = vehicleSectionEnabled
      ? vehicles.filter((v) => v.brand.trim() || v.model.trim() || v.color.trim())
      : [];

    setSaving(true);
    try {
      await pinApi.updateMedicalData(pinToken, medicalData, contactsToSubmit, { isMinor, consentAccepted }, vehiclesToSubmit);
      toast.success('Datos guardados exitosamente');
      setIsActive(true);
      setStatus('ACTIVE');
      setShowSuccess(true);
      setHasUnsavedChanges(false);
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
      <div className="relative min-h-screen bg-gradient-to-br from-gray-50 via-red-50/30 to-gray-50 dark:from-gray-950 dark:via-red-950/10 dark:to-gray-950 flex items-center justify-center">
        <div className="absolute top-4 right-4">
          <ThemeToggle />
        </div>
        <div className="text-center">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-red-200 dark:border-red-500/30 rounded-full animate-spin border-t-red-600" />
          </div>
          <p className="mt-4 text-sm font-medium text-gray-500 dark:text-gray-400">Cargando configuracion…</p>
        </div>
      </div>
    );
  }

  if (status === 'SUSPENDED') {
    return (
      <div className="relative min-h-screen bg-gradient-to-br from-gray-50 via-red-50/30 to-gray-50 dark:from-gray-950 dark:via-red-950/10 dark:to-gray-950 flex items-center justify-center p-4">
        <div className="absolute top-4 right-4">
          <ThemeToggle />
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-xl p-8 text-center max-w-sm w-full border border-gray-100 dark:border-gray-800">
          <div className="bg-gray-100 dark:bg-gray-800 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 text-gray-500 dark:text-gray-400" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">Tag Inactivo</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">Este tag ha sido dado de baja del sistema.</p>
        </div>
      </div>
    );
  }

  if (showSuccess) {
    return (
      <div className="relative min-h-screen bg-gradient-to-br from-gray-50 via-green-50/30 to-gray-50 dark:from-gray-950 dark:via-green-950/10 dark:to-gray-950 p-4 sm:p-6">
        <div className="absolute top-4 right-4 sm:top-6 sm:right-6">
          <ThemeToggle />
        </div>
        <div className="max-w-md mx-auto pt-8">
          <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-xl overflow-hidden border border-gray-100 dark:border-gray-800">
            <div className="bg-gradient-to-br from-green-500 to-green-700 p-8 text-center">
              <AnimatedCheckmark />
              <h1 className="text-2xl font-bold text-white mt-6">Datos Guardados!</h1>
              <p className="text-green-100 text-sm mt-2">Tu informacion medica de emergencia esta lista</p>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/30 rounded-2xl p-4">
                <h2 className="text-sm font-bold text-blue-900 dark:text-blue-300 mb-3 flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  Como modificar tus datos despues?
                </h2>
                <ol className="space-y-3 text-sm text-blue-800 dark:text-blue-400">
                  {[
                    'Escanea el QR o acerca el NFC de tu tag',
                    'Ingresa tu PIN de 4 digitos que acabas de crear',
                    'Edita tus datos medicos y guarda los cambios',
                  ].map((step, i) => (
                    <li key={i} className="flex gap-3 items-start">
                      <span className="w-6 h-6 rounded-full bg-blue-200 text-blue-700 dark:text-blue-400 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                        {i + 1}
                      </span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>
              </div>

              <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-500/30 rounded-2xl p-4">
                <h2 className="text-sm font-bold text-amber-900 dark:text-amber-300 mb-2 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  Importante
                </h2>
                <ul className="space-y-1.5 text-sm text-amber-800 dark:text-amber-400">
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
                  className="w-full flex items-center justify-center gap-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-semibold py-3.5 px-6 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors min-h-[44px]"
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
    const limits = getPlanLimits(tagPlan);
    const verifiedContacts = contacts.filter((c) => c.verified && (c.name.trim() || c.phone.trim()));
    return (
      <OwnerView
        medicalData={medicalData}
        contacts={contacts}
        vehicles={vehicles}
        userDisabled={userDisabled}
        onTogglePrivacy={limits.hasPrivateMode ? handleTogglePrivacy : undefined}
        togglingPrivacy={togglingPrivacy}
        hasVerifiedContacts={verifiedContacts.length > 0}
        onSendAlert={limits.hasRescuerAlert ? handleSendAlert : undefined}
        sendingAlert={sendingAlert}
        onChangePin={limits.hasPrivateMode ? () => setShowChangePinModal(true) : undefined}
        alerts={limits.hasAlertHistory ? alerts : []}
        onEdit={() => setEditMode(true)}
        onInstallApp={handleInstallApp}
        onDownloadImage={handleDownloadImage}
        tagPlan={tagPlan}
        tagUuid={uuid}
        previousPlan={previousPlan}
        expiresAt={expiresAt}
      />
    );
  }

  if (pinToken && formTransition && editMode) {
    const limits = getPlanLimits(tagPlan);
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-red-50/20 to-gray-50 dark:from-gray-950 dark:via-red-950/10 dark:to-gray-950 p-4 sm:p-6">
        <div className="max-w-lg mx-auto">
          <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-xl overflow-hidden border border-gray-100 dark:border-gray-800">
            <div className="bg-gradient-to-br from-red-600 to-red-800 p-6 text-center relative">
              <div className="absolute top-3 right-3">
                <ThemeToggle />
              </div>
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
                    className="h-full bg-white rounded-full transition-[width] duration-500"
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
                          alt="Foto de perfil"
                          width={80}
                          height={80}
                          className="w-20 h-20 rounded-full object-cover border-2 border-gray-200 dark:border-gray-700"
                        />
                      ) : (
                        <div className="w-20 h-20 rounded-full bg-gray-100 dark:bg-gray-800 border-2 border-dashed border-gray-300 dark:border-gray-700 flex items-center justify-center">
                          <Camera className="w-7 h-7 text-gray-400" />
                        </div>
                      )}
                      {photoProcessing && (
                        <div className="absolute inset-0 bg-white/70 dark:bg-gray-900/70 rounded-full flex items-center justify-center">
                          <Loader2 className="w-6 h-6 animate-spin text-red-600 dark:text-red-400" />
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="cursor-pointer inline-flex items-center gap-2 text-sm font-semibold text-red-600 dark:text-red-400 hover:text-red-700">
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
                          className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                        >
                          <X className="w-3.5 h-3.5" />
                          Quitar foto
                        </button>
                      )}
                    </div>
                  </div>

                  <InputField
                    label="Mi Telefono"
                    required
                    name="owner-phone"
                    autoComplete="tel"
                    type="tel"
                    inputMode="numeric"
                    value={medicalData.ownerPhone}
                    onChange={(e) => updateMedicalField('ownerPhone', e.target.value.replace(/\D/g, '').slice(0, 10))}
                    placeholder="10 digitos de tu numero personal"
                    maxLength={10}
                    error={errors.ownerPhone}
                  />

                  <InputField
                    ref={userNameRef}
                    label="Nombre Completo"
                    required
                    name="user-name"
                    autoComplete="name"
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
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Genero</label>
                      <div className="flex gap-2 flex-wrap" role="radiogroup" aria-label="Genero">
                        {genders.map((g) => (
                          <button
                            key={g}
                            type="button"
                            role="radio"
                            aria-checked={medicalData.gender === g}
                            onClick={() => updateMedicalField('gender', g)}
                            className={`flex-1 min-w-[80px] h-11 rounded-xl text-sm font-medium transition-colors border ${
                              medicalData.gender === g
                                ? 'bg-red-600 text-white border-red-600 shadow-md shadow-red-600/20'
                                : 'bg-gray-50 dark:bg-gray-900 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:border-red-300 dark:hover:border-red-500/40 hover:bg-red-50 dark:hover:bg-red-500/10'
                            }`}
                          >
                            {g}
                          </button>
                        ))}
                      </div>
                    {medicalData.gender === 'Otro' && (
                      <input
                        type="text"
                        name="gender-custom"
                        autoComplete="off"
                        value={customGender}
                        onChange={(e) => {
                          setCustomGender(e.target.value);
                          updateMedicalField('gender', e.target.value);
                        }}
                        placeholder="Especifica tu genero"
                        className="w-full h-12 px-4 border border-gray-200 dark:border-gray-700 rounded-xl text-sm bg-gray-50/50 dark:bg-gray-800/50 text-gray-900 dark:text-gray-100 focus:bg-white dark:focus:bg-gray-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500/30 focus-visible:border-red-500 transition-colors mt-2"
                      />
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5" ref={bloodTypeRef} tabIndex={-1}>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                        Tipo de Sangre <span className="text-red-500">*</span>
                      </label>
                      <div className={`grid grid-cols-4 gap-2 rounded-xl ${errors.bloodType ? 'ring-2 ring-red-400 p-1.5 -m-1.5' : ''}`} role="radiogroup" aria-label="Tipo de sangre">
                        {bloodTypes.map((bt) => (
                          <button
                            key={bt}
                            type="button"
                            role="radio"
                            aria-checked={medicalData.bloodType === bt}
                            onClick={() => updateMedicalField('bloodType', bt)}
                            className={`h-11 rounded-xl text-sm font-bold transition-colors border ${
                              medicalData.bloodType === bt
                                ? 'bg-red-600 text-white border-red-600 shadow-md shadow-red-600/20'
                                : 'bg-gray-50 dark:bg-gray-900 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-red-300 dark:hover:border-red-500/40 hover:bg-red-50 dark:hover:bg-red-500/10'
                            }`}
                          >
                            {bt}
                          </button>
                        ))}
                      </div>
                      {errors.bloodType && (
                        <div role="alert" className="flex items-center gap-1.5 text-red-600 dark:text-red-400 text-xs font-medium pt-0.5">
                          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                          <span>{errors.bloodType}</span>
                        </div>
                      )}
                    </div>

                  <div className="space-y-1.5">
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Religion</label>
                    <div className="flex gap-2">
                      {(['Si', 'No'] as const).map((opt) => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => {
                            if (opt === 'Si') {
                              setHasReligion(true);
                            } else {
                              setHasReligion(false);
                              updateMedicalField('religion', '');
                              setCustomReligion('');
                            }
                          }}
                          className={`flex-1 h-11 rounded-xl text-sm font-medium transition-colors border ${
                            (opt === 'Si' && hasReligion === true) || (opt === 'No' && hasReligion === false)
                              ? opt === 'Si'
                                ? 'bg-red-600 text-white border-red-600 shadow-md shadow-red-600/20'
                                : 'bg-green-600 text-white border-green-600 shadow-md shadow-green-600/20'
                              : 'bg-gray-50 dark:bg-gray-900 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                          }`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                    {hasReligion === true && (
                      <div className="mt-2">
                        <select
                          value={religions.includes(medicalData.religion) ? medicalData.religion : (medicalData.religion ? 'Otra' : '')}
                          onChange={(e) => {
                            const selected = e.target.value;
                            updateMedicalField('religion', selected);
                            if (selected !== 'Otra') {
                              setCustomReligion('');
                            }
                          }}
                          name="religion"
                          autoComplete="off"
                          className="w-full h-12 px-4 border border-gray-200 dark:border-gray-700 rounded-xl text-sm bg-gray-50/50 dark:bg-gray-800/50 text-gray-900 dark:text-gray-100 focus:bg-white dark:focus:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500 transition-colors"
                        >
                          <option value="">Seleccionar religion</option>
                          {religions.map((r) => (
                            <option key={r} value={r}>{r}</option>
                          ))}
                        </select>
                        {medicalData.religion === 'Otra' && (
                          <input
                            type="text"
                            name="religion-custom"
                            autoComplete="off"
                            value={customReligion}
                            onChange={(e) => {
                              setCustomReligion(e.target.value);
                              updateMedicalField('religion', e.target.value);
                            }}
                            placeholder="Especifica tu religion"
                            className="w-full h-12 px-4 border border-gray-200 dark:border-gray-700 rounded-xl text-sm bg-gray-50/50 dark:bg-gray-800/50 text-gray-900 dark:text-gray-100 focus:bg-white dark:focus:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500 transition-colors mt-2"
                          />
                        )}
                      </div>
                    )}
                    {hasReligion === false && (
                      <div className="flex items-center gap-2 text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-500/10 px-4 py-3 rounded-xl border border-green-100 dark:border-green-500/30 mt-2">
                        <CheckCircle className="w-4 h-4 flex-shrink-0" />
                        <span className="text-sm font-medium">Sin religion</span>
                      </div>
                    )}
                  </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Donador de Organos</label>
                      <div className="flex gap-2">
                        {(['Si', 'No'] as const).map((opt) => (
                          <button
                            key={opt}
                            type="button"
                            onClick={() => {
                              updateMedicalField('organDonor', opt);
                              setHasOrganDonor(opt === 'Si');
                            }}
                            className={`flex-1 h-11 rounded-xl text-sm font-medium transition-colors border ${
                              medicalData.organDonor === opt
                                ? opt === 'Si'
                                  ? 'bg-green-600 text-white border-green-600 shadow-md shadow-green-600/20'
                                  : 'bg-gray-600 text-white border-gray-600 dark:border-gray-500 shadow-md shadow-gray-600/20'
                                : 'bg-gray-50 dark:bg-gray-900 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                            }`}
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                      {hasOrganDonor === false && medicalData.organDonor === 'No' && (
                        <div className="flex items-center gap-2 text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-500/10 px-4 py-3 rounded-xl border border-green-100 dark:border-green-500/30 mt-2">
                          <CheckCircle className="w-4 h-4 flex-shrink-0" />
                          <span className="text-sm font-medium">No es donador de organos</span>
                        </div>
                      )}
                    </div>

                    <InputField
                      ref={emergencyPhoneRef}
                      label="Telefono Emergencia"
                      required
                      name="emergency-phone"
                      autoComplete="tel"
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
                icon={Shield}
                title="Seguridad Social"
                defaultOpen={false}
                complete={!!medicalData.insuranceType && medicalData.insuranceType !== 'SIN_SEGURO'}
              >
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Tipo de Seguro</label>
                    <select
                      name="insurance-type"
                      autoComplete="off"
                      value={medicalData.insuranceType}
                      onChange={(e) => {
                        updateMedicalField('insuranceType', e.target.value);
                        if (e.target.value !== 'IMSS' && e.target.value !== 'ISSSTE' && e.target.value !== 'IMSS-BIENESTAR') {
                          updateMedicalField('nss', '');
                          updateMedicalField('umf', '');
                        }
                        if (e.target.value !== 'SEGURO_PRIVADO') {
                          updateMedicalField('insurancePolicyNumber', '');
                          updateMedicalField('insuranceCompany', '');
                          updateMedicalField('insurancePhone', '');
                        }
                      }}
                      className="w-full h-12 px-4 border border-gray-200 dark:border-gray-700 rounded-xl text-sm bg-gray-50/50 dark:bg-gray-800/50 text-gray-900 dark:text-gray-100 focus:bg-white dark:focus:bg-gray-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500/30 focus-visible:border-red-500 transition-colors"
                    >
                      <option value="">Seleccionar</option>
                      <option value="IMSS">IMSS</option>
                      <option value="ISSSTE">ISSSTE</option>
                      <option value="IMSS-BIENESTAR">IMSS Bienestar</option>
                      <option value="SEGURO_PRIVADO">Seguro Privado</option>
                      <option value="SIN_SEGURO">Sin seguro</option>
                    </select>
                  </div>

                  {medicalData.insuranceType === 'IMSS' && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <InputField
                          label="NSS (Numero de Seguridad Social)"
                          name="nss"
                          autoComplete="off"
                          type="text"
                          value={medicalData.nss}
                          onChange={(e) => updateMedicalField('nss', e.target.value.replace(/\D/g, '').slice(0, 11))}
                          placeholder="11 digitos"
                          maxLength={11}
                        />
                        <InputField
                          label="CURP"
                          name="curp"
                          autoComplete="off"
                          type="text"
                          value={medicalData.curp}
                          onChange={(e) => updateMedicalField('curp', e.target.value.toUpperCase())}
                          className="uppercase"
                          maxLength={18}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">UMF / Clinica</label>
                        <select
                          name="umf"
                          autoComplete="off"
                          value={umfClinics.includes(medicalData.umf) ? medicalData.umf : (medicalData.umf ? 'Otra' : '')}
                          onChange={(e) => {
                            const selected = e.target.value;
                            updateMedicalField('umf', selected);
                            if (selected !== 'Otra') setCustomUmf('');
                          }}
                          className="w-full h-12 px-4 border border-gray-200 dark:border-gray-700 rounded-xl text-sm bg-gray-50/50 dark:bg-gray-800/50 text-gray-900 dark:text-gray-100 focus:bg-white dark:focus:bg-gray-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500/30 focus-visible:border-red-500 transition-colors"
                        >
                          <option value="">Seleccionar</option>
                          {umfClinics.map((c) => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                        {medicalData.umf === 'Otra' && (
                          <input
                            type="text"
                            name="umf-custom"
                            autoComplete="off"
                            value={customUmf}
                            onChange={(e) => {
                              setCustomUmf(e.target.value);
                              updateMedicalField('umf', e.target.value);
                            }}
                            placeholder="Especifica tu UMF o clinica"
                            className="w-full h-12 px-4 border border-gray-200 dark:border-gray-700 rounded-xl text-sm bg-gray-50/50 dark:bg-gray-800/50 text-gray-900 dark:text-gray-100 focus:bg-white dark:focus:bg-gray-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500/30 focus-visible:border-red-500 transition-colors mt-2"
                          />
                        )}
                      </div>
                    </div>
                  )}

                  {medicalData.insuranceType === 'ISSSTE' && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <InputField
                          label="Numero de Expediente / RFC"
                          name="insurance-identifier"
                          autoComplete="off"
                          type="text"
                          value={medicalData.insuranceIdentifier}
                          onChange={(e) => updateMedicalField('insuranceIdentifier', e.target.value.toUpperCase())}
                          placeholder="Expediente o RFC con homoclave"
                          maxLength={20}
                        />
                        <InputField
                          label="CURP"
                          name="curp-issste"
                          autoComplete="off"
                          type="text"
                          value={medicalData.curp}
                          onChange={(e) => updateMedicalField('curp', e.target.value.toUpperCase())}
                          className="uppercase"
                          maxLength={18}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Dependencia / Clinica</label>
                        <input
                          type="text"
                          name="insurance-details"
                          autoComplete="off"
                          value={medicalData.insuranceDetails}
                          onChange={(e) => updateMedicalField('insuranceDetails', e.target.value)}
                          placeholder="Ej: ISSSTE Clinica Central, SEP, etc."
                          className="w-full h-12 px-4 border border-gray-200 dark:border-gray-700 rounded-xl text-sm bg-gray-50/50 dark:bg-gray-800/50 text-gray-900 dark:text-gray-100 focus:bg-white dark:focus:bg-gray-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500/30 focus-visible:border-red-500 transition-colors"
                        />
                      </div>
                    </div>
                  )}

                  {medicalData.insuranceType === 'IMSS-BIENESTAR' && (
                    <div className="space-y-4">
                      <div className="bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/30 rounded-xl p-4">
                        <p className="text-xs font-semibold text-blue-800 dark:text-blue-400 mb-1">Identificador: CURP</p>
                        <p className="text-[11px] text-blue-600">IMSS Bienestar utiliza tu CURP como identificador unico para la atencion medica.</p>
                      </div>
                      <InputField
                        label="CURP"
                        type="text"
                        value={medicalData.curp}
                        onChange={(e) => updateMedicalField('curp', e.target.value.toUpperCase())}
                        className="uppercase"
                        maxLength={18}
                      />
                      <div className="space-y-1.5">
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">UMF / Centro de Salud</label>
                        <select
                          name="umf-bienestar"
                          autoComplete="off"
                          value={umfClinics.includes(medicalData.umf) ? medicalData.umf : (medicalData.umf ? 'Otra' : '')}
                          onChange={(e) => {
                            const selected = e.target.value;
                            updateMedicalField('umf', selected);
                            if (selected !== 'Otra') setCustomUmf('');
                          }}
                          className="w-full h-12 px-4 border border-gray-200 dark:border-gray-700 rounded-xl text-sm bg-gray-50/50 dark:bg-gray-800/50 text-gray-900 dark:text-gray-100 focus:bg-white dark:focus:bg-gray-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500/30 focus-visible:border-red-500 transition-colors"
                        >
                          <option value="">Seleccionar</option>
                          {umfClinics.map((c) => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                        {medicalData.umf === 'Otra' && (
                          <input
                            type="text"
                            name="umf-bienestar-custom"
                            autoComplete="off"
                            value={customUmf}
                            onChange={(e) => {
                              setCustomUmf(e.target.value);
                              updateMedicalField('umf', e.target.value);
                            }}
                            placeholder="Especifica tu centro de salud"
                            className="w-full h-12 px-4 border border-gray-200 dark:border-gray-700 rounded-xl text-sm bg-gray-50/50 dark:bg-gray-800/50 text-gray-900 dark:text-gray-100 focus:bg-white dark:focus:bg-gray-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500/30 focus-visible:border-red-500 transition-colors mt-2"
                          />
                        )}
                      </div>
                    </div>
                  )}

                  {medicalData.insuranceType === 'SEGURO_PRIVADO' && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <InputField
                          label="Nombre de la Aseguradora"
                          name="insurance-company"
                          autoComplete="off"
                          type="text"
                          value={medicalData.insuranceCompany}
                          onChange={(e) => updateMedicalField('insuranceCompany', e.target.value)}
                          placeholder="Ej: GNP, AXA, MetLife"
                        />
                        <InputField
                          label="Numero de Poliza"
                          name="insurance-policy"
                          autoComplete="off"
                          type="text"
                          value={medicalData.insurancePolicyNumber}
                          onChange={(e) => updateMedicalField('insurancePolicyNumber', e.target.value)}
                          placeholder="No. de poliza o certificado"
                        />
                      </div>
                      <InputField
                        label="Telefono de Asistencia Medica"
                        name="insurance-phone"
                        autoComplete="off"
                        type="tel"
                        inputMode="numeric"
                        value={medicalData.insurancePhone}
                        onChange={(e) => updateMedicalField('insurancePhone', e.target.value.replace(/\D/g, '').slice(0, 10))}
                        placeholder="Linea de emergencia de la aseguradora"
                        maxLength={10}
                      />
                    </div>
                  )}

                  {medicalData.insuranceType === 'SIN_SEGURO' && (
                    <div className="space-y-4">
                      <div className="bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/30 rounded-xl p-4">
                        <p className="text-xs font-semibold text-green-800 dark:text-green-400 mb-2">Atención de Urgencia Obligatoria</p>
                        <p className="text-[11px] text-green-700 dark:text-green-400 leading-relaxed">
                          Por ley, los hospitales públicos (IMSS-Bienestar, Secretaría de Salud / SESA) y las áreas de
                          urgencias de hospitales privados están obligados a brindar atención médica inmediata si la vida
                          está en riesgo, sin condicionarla a pagos o afiliación previa.
                        </p>
                        <p className="text-[11px] text-green-700 dark:text-green-400 leading-relaxed mt-2">
                          Una vez estabilizado, si no cuentas con seguridad social, serás canalizado al sistema
                          IMSS-Bienestar o a hospitales de la red pública local para continuar tu tratamiento de manera
                          gratuita o con cuotas de recuperación basadas en un estudio socioeconómico.
                        </p>
                      </div>

                      <label className="flex items-start gap-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-4 cursor-pointer">
                        <input
                          type="checkbox"
                          id="wantsPublicCare"
                          name="wants-public-care"
                          checked={medicalData.wantsPublicCare}
                          onChange={(e) => updateMedicalField('wantsPublicCare', e.target.checked)}
                          className="mt-0.5 w-5 h-5 text-green-600 border-gray-300 dark:border-gray-700 rounded focus:ring-2 focus:ring-green-500/30 focus:ring-offset-0"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                          Acepto ser canalizado a la red publica de salud (IMSS-Bienestar, SESA, etc.) para recibir
                          atencion medica gratuita tras una emergencia.
                        </span>
                      </label>
                    </div>
                  )}
                </div>
              </SectionCard>

              <SectionCard
                icon={Activity}
                title="Antecedentes Medicos"
                defaultOpen={false}
                complete={hasHospitalizations !== null || hasSurgeries !== null || hasTrauma !== null}
              >
                <div className="space-y-4">
                  <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 rounded-xl p-4">
                    <p className="text-xs font-semibold text-amber-800 dark:text-amber-400 mb-1">Importancia en Emergencias</p>
                    <p className="text-[11px] text-amber-600">Estos antecedentes ayudan al personal medico a tomar decisiones rapidas y precisas en situaciones criticas.</p>
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Hospitalizaciones Previas</label>
                    <div className="flex gap-2">
                      {(['Si', 'No'] as const).map((opt) => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => {
                            if (opt === 'Si') {
                              setHasHospitalizations(true);
                            } else {
                              setHasHospitalizations(false);
                              updateMedicalField('previousHospitalizations', '');
                            }
                          }}
                          className={`flex-1 h-11 rounded-xl text-sm font-medium transition-colors border ${
                            (opt === 'Si' && hasHospitalizations === true) || (opt === 'No' && hasHospitalizations === false)
                              ? opt === 'Si'
                                ? 'bg-amber-500 text-white border-amber-500 shadow-md shadow-amber-500/20'
                                : 'bg-green-600 text-white border-green-600 shadow-md shadow-green-600/20'
                              : 'bg-gray-50 dark:bg-gray-900 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                          }`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                    {hasHospitalizations === true && (
                      <textarea
                        name="previous-hospitalizations"
                        autoComplete="off"
                        value={medicalData.previousHospitalizations}
                        onChange={(e) => updateMedicalField('previousHospitalizations', e.target.value)}
                        placeholder="Ej: Hospitalizacion por neumonia en 2022, apendicitis en 2019..."
                        rows={3}
                        className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl text-sm bg-gray-50/50 dark:bg-gray-800/50 text-gray-900 dark:text-gray-100 focus:bg-white dark:focus:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500 transition-colors resize-none mt-2"
                      />
                    )}
                    {hasHospitalizations === false && (
                      <div className="flex items-center gap-2 text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-500/10 px-4 py-3 rounded-xl border border-green-100 dark:border-green-500/30 mt-2">
                        <CheckCircle className="w-4 h-4 flex-shrink-0" />
                        <span className="text-sm font-medium">Sin hospitalizaciones previas</span>
                      </div>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Cirugias Previas</label>
                    <div className="flex gap-2">
                      {(['Si', 'No'] as const).map((opt) => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => {
                            if (opt === 'Si') {
                              setHasSurgeries(true);
                            } else {
                              setHasSurgeries(false);
                              updateMedicalField('previousSurgeries', '');
                            }
                          }}
                          className={`flex-1 h-11 rounded-xl text-sm font-medium transition-colors border ${
                            (opt === 'Si' && hasSurgeries === true) || (opt === 'No' && hasSurgeries === false)
                              ? opt === 'Si'
                                ? 'bg-amber-500 text-white border-amber-500 shadow-md shadow-amber-500/20'
                                : 'bg-green-600 text-white border-green-600 shadow-md shadow-green-600/20'
                              : 'bg-gray-50 dark:bg-gray-900 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                          }`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                    {hasSurgeries === true && (
                      <textarea
                        name="previous-surgeries"
                        autoComplete="off"
                        value={medicalData.previousSurgeries}
                        onChange={(e) => updateMedicalField('previousSurgeries', e.target.value)}
                        placeholder="Ej: Apendicectomia 2019, cirugia de rodilla 2021..."
                        rows={3}
                        className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl text-sm bg-gray-50/50 dark:bg-gray-800/50 text-gray-900 dark:text-gray-100 focus:bg-white dark:focus:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500 transition-colors resize-none mt-2"
                      />
                    )}
                    {hasSurgeries === false && (
                      <div className="flex items-center gap-2 text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-500/10 px-4 py-3 rounded-xl border border-green-100 dark:border-green-500/30 mt-2">
                        <CheckCircle className="w-4 h-4 flex-shrink-0" />
                        <span className="text-sm font-medium">Sin cirugias previas</span>
                      </div>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Traumatismo Previo</label>
                    <div className="flex gap-2">
                      {(['Si', 'No'] as const).map((opt) => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => {
                            if (opt === 'Si') {
                              setHasTrauma(true);
                            } else {
                              setHasTrauma(false);
                              updateMedicalField('previousTrauma', '');
                            }
                          }}
                          className={`flex-1 h-11 rounded-xl text-sm font-medium transition-colors border ${
                            (opt === 'Si' && hasTrauma === true) || (opt === 'No' && hasTrauma === false)
                              ? opt === 'Si'
                                ? 'bg-amber-500 text-white border-amber-500 shadow-md shadow-amber-500/20'
                                : 'bg-green-600 text-white border-green-600 shadow-md shadow-green-600/20'
                              : 'bg-gray-50 dark:bg-gray-900 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                          }`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                    {hasTrauma === true && (
                      <textarea
                        name="previous-trauma"
                        autoComplete="off"
                        value={medicalData.previousTrauma}
                        onChange={(e) => updateMedicalField('previousTrauma', e.target.value)}
                        placeholder="Ej: Fractura de femur 2020, traumatismo craneal 2018..."
                        rows={3}
                        className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl text-sm bg-gray-50/50 dark:bg-gray-800/50 text-gray-900 dark:text-gray-100 focus:bg-white dark:focus:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500 transition-colors resize-none mt-2"
                      />
                    )}
                    {hasTrauma === false && (
                      <div className="flex items-center gap-2 text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-500/10 px-4 py-3 rounded-xl border border-green-100 dark:border-green-500/30 mt-2">
                        <CheckCircle className="w-4 h-4 flex-shrink-0" />
                        <span className="text-sm font-medium">Sin traumatismo previo</span>
                      </div>
                    )}
                  </div>
                </div>
              </SectionCard>

              <SectionCard
                icon={Stethoscope}
                title="Informacion Medica"
                defaultOpen={false}
                complete={hasAllergies !== null && hasHereditary !== null && hasMedications !== null}
              >
                <div className="space-y-4">
                  <div className="bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/30 rounded-xl p-4 mb-2">
                    <p className="text-xs font-semibold text-blue-800 dark:text-blue-400 mb-1">Dispositivos Medicos Implantados</p>
                    <p className="text-[11px] text-blue-600">Estos dispositivos pueden interferir con procedimientos de emergencia como RCP, desfibrilacion o inmovilizacion.</p>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Marcapasos o Cardiodesfibrilador Implantable</label>
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
                              : 'bg-gray-50 dark:bg-gray-900 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
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
                        className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl text-sm bg-gray-50/50 dark:bg-gray-800/50 text-gray-900 dark:text-gray-100 focus:bg-white dark:focus:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500 transition-all mt-2 resize-none"
                      />
                    )}
                    {hasPacemaker === false && (
                      <div className="flex items-center gap-2 text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-500/10 px-4 py-3 rounded-xl border border-green-100 dark:border-green-500/30 mt-2">
                        <CheckCircle className="w-4 h-4 flex-shrink-0" />
                        <span className="text-sm font-medium">Sin marcapasos</span>
                      </div>
                    )}
                  </div>

                  {medicalData.gender === 'Femenino' && (
                    <>
                      <div className="space-y-1.5">
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Implante Anticonceptivo Subdermico</label>
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
                                  : 'bg-gray-50 dark:bg-gray-900 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
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
                            className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl text-sm bg-gray-50/50 dark:bg-gray-800/50 text-gray-900 dark:text-gray-100 focus:bg-white dark:focus:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500 transition-all mt-2 resize-none"
                          />
                        )}
                        {hasImplantContraceptive === false && (
                          <div className="flex items-center gap-2 text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-500/10 px-4 py-3 rounded-xl border border-green-100 dark:border-green-500/30 mt-2">
                            <CheckCircle className="w-4 h-4 flex-shrink-0" />
                            <span className="text-sm font-medium">Sin implante anticonceptivo</span>
                          </div>
                        )}
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Implantes Mamarios</label>
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
                                  : 'bg-gray-50 dark:bg-gray-900 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
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
                            className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl text-sm bg-gray-50/50 dark:bg-gray-800/50 text-gray-900 dark:text-gray-100 focus:bg-white dark:focus:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500 transition-all mt-2 resize-none"
                          />
                        )}
                        {hasImplantMammary === false && (
                          <div className="flex items-center gap-2 text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-500/10 px-4 py-3 rounded-xl border border-green-100 dark:border-green-500/30 mt-2">
                            <CheckCircle className="w-4 h-4 flex-shrink-0" />
                            <span className="text-sm font-medium">Sin implantes mamarios</span>
                          </div>
                        )}
                      </div>
                    </>
                  )}

                  <div className="space-y-1.5">
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Implantes Ortopedicos Metalicos o Neuroestimuladores</label>
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
                              : 'bg-gray-50 dark:bg-gray-900 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
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
                        className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl text-sm bg-gray-50/50 dark:bg-gray-800/50 text-gray-900 dark:text-gray-100 focus:bg-white dark:focus:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500 transition-all mt-2 resize-none"
                      />
                    )}
                    {hasOrthopedicImplants === false && (
                      <div className="flex items-center gap-2 text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-500/10 px-4 py-3 rounded-xl border border-green-100 dark:border-green-500/30 mt-2">
                        <CheckCircle className="w-4 h-4 flex-shrink-0" />
                        <span className="text-sm font-medium">Sin implantes ortopedicos</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Implante Coclear u Otro Dispositivo Auditivo</label>
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
                              : 'bg-gray-50 dark:bg-gray-900 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
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
                        className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl text-sm bg-gray-50/50 dark:bg-gray-800/50 text-gray-900 dark:text-gray-100 focus:bg-white dark:focus:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500 transition-all mt-2 resize-none"
                      />
                    )}
                    {hasCochlearImplant === false && (
                      <div className="flex items-center gap-2 text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-500/10 px-4 py-3 rounded-xl border border-green-100 dark:border-green-500/30 mt-2">
                        <CheckCircle className="w-4 h-4 flex-shrink-0" />
                        <span className="text-sm font-medium">Sin implante coclear</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Protesis Ocular</label>
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
                              : 'bg-gray-50 dark:bg-gray-900 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
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
                        className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl text-sm bg-gray-50/50 dark:bg-gray-800/50 text-gray-900 dark:text-gray-100 focus:bg-white dark:focus:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500 transition-all mt-2 resize-none"
                      />
                    )}
                    {hasOcularProsthesis === false && (
                      <div className="flex items-center gap-2 text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-500/10 px-4 py-3 rounded-xl border border-green-100 dark:border-green-500/30 mt-2">
                        <CheckCircle className="w-4 h-4 flex-shrink-0" />
                        <span className="text-sm font-medium">Sin protesis ocular</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Alergias</label>
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
                              : 'bg-gray-50 dark:bg-gray-900 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
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
                                className="inline-flex items-center gap-1.5 bg-amber-50 dark:bg-amber-500/10 text-amber-800 dark:text-amber-400 border border-amber-200 dark:border-amber-500/30 px-3 py-1.5 rounded-lg text-sm font-medium"
                              >
                                {allergy}
                                <button
                                  type="button"
                                  onClick={() => {
                                    const updated = selectedAllergies.filter((_, i) => i !== idx);
                                    setSelectedAllergies(updated);
                                    updateMedicalField('allergies', updated.length > 0 ? updated.join('|') : 'Ninguna conocida');
                                  }}
                                  className="ml-0.5 text-amber-600 hover:text-amber-800 dark:hover:text-amber-400 p-0.5 rounded"
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
                              className="w-full h-12 px-4 border border-gray-200 dark:border-gray-700 rounded-xl text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500/30 focus-visible:border-red-500 transition-colors"
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
                                  className="flex-1 h-12 px-4 border border-gray-200 dark:border-gray-700 rounded-xl text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500/30 focus-visible:border-red-500 transition-colors"
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
                              className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                            >
                              Cancelar
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setShowAllergySelect(true)}
                            className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl text-sm font-semibold text-gray-500 dark:text-gray-400 hover:border-red-400 dark:hover:border-red-500/40 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50/50 dark:hover:bg-red-500/10 transition-all min-h-[44px]"
                          >
                            <Plus className="w-4 h-4" />
                            {selectedAllergies.length === 0 ? 'Agregar alergia' : 'Agregar otra alergia'}
                          </button>
                        )}
                      </div>
                    )}
                    {hasAllergies === false && (
                      <div className="flex items-center gap-2 text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-500/10 px-4 py-3 rounded-xl border border-green-100 dark:border-green-500/30 mt-2">
                        <CheckCircle className="w-4 h-4 flex-shrink-0" />
                        <span className="text-sm font-medium">Ninguna alergia conocida</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Medicamentos Actuales</label>
                    <div className="flex gap-2">
                      {(['Si', 'No'] as const).map((opt) => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => {
                            if (opt === 'Si') {
                              setHasMedications(true);
                            } else {
                              setHasMedications(false);
                              updateMedicalField('medications', '');
                            }
                          }}
                          className={`flex-1 h-11 rounded-xl text-sm font-medium transition-colors border ${
                            (opt === 'Si' && hasMedications === true) || (opt === 'No' && hasMedications === false)
                              ? opt === 'Si'
                                ? 'bg-amber-500 text-white border-amber-500 shadow-md shadow-amber-500/20'
                                : 'bg-green-600 text-white border-green-600 shadow-md shadow-green-600/20'
                              : 'bg-gray-50 dark:bg-gray-900 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                          }`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                    {hasMedications === true && (
                      <textarea
                        name="medications"
                        autoComplete="off"
                        value={medicalData.medications}
                        onChange={(e) => updateMedicalField('medications', e.target.value)}
                        placeholder="Nombre, dosis, frecuencia..."
                        rows={3}
                        className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl text-sm bg-gray-50/50 dark:bg-gray-800/50 text-gray-900 dark:text-gray-100 focus:bg-white dark:focus:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500 transition-colors resize-none mt-2"
                      />
                    )}
                    {hasMedications === false && (
                      <div className="flex items-center gap-2 text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-500/10 px-4 py-3 rounded-xl border border-green-100 dark:border-green-500/30 mt-2">
                        <CheckCircle className="w-4 h-4 flex-shrink-0" />
                        <span className="text-sm font-medium">Sin medicamentos actuales</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Antecedentes Heredofamiliares</label>
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
                              : 'bg-gray-50 dark:bg-gray-900 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
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
                                    ? 'bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/30'
                                    : 'bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700'
                                }`}
                              >
                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${item.isActive ? 'bg-red-500' : 'bg-gray-400 dark:bg-gray-500'}`} />
                                  <div className="min-w-0">
                                    <span className={`text-sm font-medium ${item.isActive ? 'text-red-800 dark:text-red-400' : 'text-gray-700 dark:text-gray-300'}`}>
                                      {item.name}
                                    </span>
                                    <span className="text-xs text-gray-500 dark:text-gray-400 ml-1.5">Linea {item.line}</span>
                                    {item.isActive && (
                                      <span className="ml-1.5 text-xs font-semibold text-red-600 dark:text-red-400">Lo padezco</span>
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
                                        : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-gray-600'
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
                                    className="p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
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
                              className="w-full h-12 px-4 border border-gray-200 dark:border-gray-700 rounded-xl text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500/30 focus-visible:border-red-500 transition-colors"
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
                                  className="flex-1 h-12 px-4 border border-gray-200 dark:border-gray-700 rounded-xl text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500/30 focus-visible:border-red-500 transition-colors"
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
                                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400">Linea familiar</label>
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
                                      className="flex-1 h-10 rounded-lg text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400 transition-colors"
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
                              className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                            >
                              Cancelar
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setShowHereditarySelect(true)}
                            className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl text-sm font-semibold text-gray-500 dark:text-gray-400 hover:border-red-400 dark:hover:border-red-500/40 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50/50 dark:hover:bg-red-500/10 transition-all min-h-[44px]"
                          >
                            <Plus className="w-4 h-4" />
                            {selectedHereditary.length === 0 ? 'Agregar antecedente' : 'Agregar otro antecedente'}
                          </button>
                        )}
                      </div>
                    )}
                    {hasHereditary === false && (
                      <div className="flex items-center gap-2 text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-500/10 px-4 py-3 rounded-xl border border-green-100 dark:border-green-500/30 mt-2">
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
                    <div key={index} className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4 border border-gray-100 dark:border-gray-800 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-500/10 flex items-center justify-center">
                            <Contact className="w-4 h-4 text-red-600 dark:text-red-400" />
                          </div>
                          <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Contacto {index + 1}</span>
                        </div>
                        {contacts.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeContact(index)}
                            className="text-red-400 hover:text-red-600 dark:hover:text-red-400 p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <InputField
                          label="Nombre"
                          name={`contact-name-${index}`}
                          autoComplete="name"
                          type="text"
                          value={contact.name}
                          onChange={(e) => updateContact(index, 'name', e.target.value)}
                          placeholder="Nombre completo"
                        />
                        <InputField
                          label="Parentesco"
                          name={`contact-relationship-${index}`}
                          autoComplete="off"
                          type="text"
                          value={contact.relationship}
                          onChange={(e) => updateContact(index, 'relationship', e.target.value)}
                          placeholder="Esposo, Hijo, etc."
                        />
                      </div>
                      <InputField
                        label="Telefono"
                        name={`contact-phone-${index}`}
                        autoComplete="tel"
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
                            <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 dark:text-green-400">
                              <CheckCircle className="w-3.5 h-3.5" /> Verificado
                            </span>
                            <button
                              type="button"
                              onClick={() => handleResendVerification(index)}
                              disabled={
                                contactVerified[index]?.status === 'verifying' ||
                                Boolean(contactVerified[index]?.cooldownUntil && contactVerified[index].cooldownUntil > Date.now())
                              }
                              className="text-xs text-blue-600 hover:text-blue-800 dark:hover:text-blue-300 underline disabled:opacity-50 disabled:hover:text-blue-600 dark:hover:text-blue-400"
                            >
                              {contactVerified[index]?.status === 'verifying'
                                ? 'Enviando…'
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
                            className="flex items-center gap-1.5 text-xs font-semibold text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-500/10 hover:bg-green-100 dark:hover:bg-green-500/20 border border-green-200 dark:border-green-500/30 disabled:opacity-50 disabled:hover:bg-green-50 dark:hover:bg-green-500/10 px-3 py-2 rounded-lg transition-colors min-h-[36px]"
                          >
                            {contactVerified[index]?.status === 'verifying' ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <MessageCircle className="w-3.5 h-3.5" />
                            )}
                            {contactVerified[index]?.status === 'verifying'
                              ? 'Verificando…'
                              : contactVerified[index]?.cooldownUntil && contactVerified[index].cooldownUntil > Date.now()
                                ? `Reintentar (${Math.ceil((contactVerified[index].cooldownUntil - Date.now()) / 1000)}s)`
                                : 'Verificar por WhatsApp'}
                          </button>
                        )}
                        {contactVerified[index]?.phone === contact.phone && contactVerified[index]?.status === 'error' && (!contactVerified[index]?.cooldownUntil || contactVerified[index].cooldownUntil <= Date.now()) && (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-red-600 dark:text-red-400">
                            <AlertCircle className="w-3.5 h-3.5" /> {contactVerified[index]?.error || 'No se pudo verificar'}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                  {(() => {
                    const limits = getPlanLimits(tagPlan);
                    if (contacts.length < limits.maxContacts) {
                      return (
                        <button
                          type="button"
                          onClick={addContact}
                          className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl text-sm font-semibold text-gray-500 dark:text-gray-400 hover:border-red-400 dark:hover:border-red-500/40 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50/50 dark:hover:bg-red-500/10 transition-all min-h-[44px]"
                        >
                          <Plus className="w-4 h-4" />
                          Agregar contacto
                        </button>
                      );
                    }
                    return (
                      <p className="text-center text-xs text-gray-400 py-2">
                        Límite de {limits.maxContacts} contacto{limits.maxContacts > 1 ? 's' : ''} alcanzado
                      </p>
                    );
                  })()}
                </div>
              </SectionCard>

              {(() => {
                const limits = getPlanLimits(tagPlan);
                if (!limits.hasVehicles) return null;
                return (
              <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
                <label className="flex items-center justify-between p-4 sm:p-5 cursor-pointer hover:bg-gray-50/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                      <Car className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">Mis Vehículos</h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Hasta 3 vehículos</p>
                    </div>
                  </div>
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={vehicleSectionEnabled}
                      onChange={(e) => {
                        setVehicleSectionEnabled(e.target.checked);
                        if (!e.target.checked) setVehicles([]);
                      }}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 dark:bg-gray-700 peer-focus:outline-none peer-focus-visible:ring-2 peer-focus-visible:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </div>
                </label>

                {vehicleSectionEnabled && (
                  <div className="px-4 sm:px-5 pb-4 sm:pb-5 space-y-4 border-t border-gray-100 dark:border-gray-800 pt-4">
                    {vehicles.map((vehicle, index) => (
                      <div key={index} className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4 border border-gray-100 dark:border-gray-800 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                              <Car className="w-4 h-4 text-blue-600" />
                            </div>
                            <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Vehículo {index + 1}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeVehicle(index)}
                            className="text-red-400 hover:text-red-600 dark:hover:text-red-400 p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="space-y-1.5">
                          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Tipo de Vehiculo</label>
                          <div className="flex gap-2" role="radiogroup" aria-label="Tipo de vehiculo">
                            {(['AUTO', 'MOTO', 'BICICLETA'] as const).map((t) => (
                              <button
                                key={t}
                                type="button"
                                role="radio"
                                aria-checked={vehicle.type === t}
                                onClick={() => updateVehicle(index, 'type', t)}
                                className={`flex-1 h-10 rounded-xl text-sm font-medium transition-colors border ${
                                  vehicle.type === t
                                    ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-600/20'
                                    : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-500/40 hover:bg-blue-50 dark:hover:bg-blue-500/10'
                                }`}
                              >
                                {t === 'AUTO' ? 'Auto' : t === 'MOTO' ? 'Moto' : 'Bicicleta'}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <InputField
                            label="Marca"
                            name={`vehicle-brand-${index}`}
                            autoComplete="off"
                            type="text"
                            value={vehicle.brand}
                            onChange={(e) => updateVehicle(index, 'brand', e.target.value)}
                            placeholder="Ej: Honda, Toyota"
                          />
                          <InputField
                            label="Modelo"
                            name={`vehicle-model-${index}`}
                            autoComplete="off"
                            type="text"
                            value={vehicle.model}
                            onChange={(e) => updateVehicle(index, 'model', e.target.value)}
                            placeholder="Ej: Civic, Corolla"
                          />
                        </div>

                        {vehicle.type !== 'BICICLETA' && (
                          <InputField
                            label="Año"
                            name={`vehicle-year-${index}`}
                            autoComplete="off"
                            type="text"
                            inputMode="numeric"
                            value={vehicle.year || ''}
                            onChange={(e) => updateVehicle(index, 'year', e.target.value.replace(/\D/g, '').slice(0, 4))}
                            placeholder="Ej: 2024"
                          />
                        )}

                        <InputField
                          label="Color"
                          name={`vehicle-color-${index}`}
                          autoComplete="off"
                          type="text"
                          value={vehicle.color}
                          onChange={(e) => updateVehicle(index, 'color', e.target.value)}
                          placeholder="Ej: Rojo, Negro"
                        />

                        {vehicle.type !== 'BICICLETA' && (
                          <InputField
                            label="Placa"
                            name={`vehicle-plate-${index}`}
                            autoComplete="off"
                            type="text"
                            value={vehicle.plate || ''}
                            onChange={(e) => updateVehicle(index, 'plate', e.target.value.toUpperCase())}
                            placeholder="Ej: ABC-1234"
                          />
                        )}

                        {vehicle.type === 'MOTO' && (
                          <InputField
                            label="Cilindraje (opcional)"
                            name={`vehicle-cylinder-${index}`}
                            autoComplete="off"
                            type="text"
                            value={vehicle.cylinder || ''}
                            onChange={(e) => updateVehicle(index, 'cylinder', e.target.value)}
                            placeholder="Ej: 150cc, 250cc"
                          />
                        )}

                        {vehicle.type === 'BICICLETA' && (
                          <div className="space-y-1.5">
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Tipo de Bicicleta</label>
                            <div className="flex gap-2 flex-wrap" role="radiogroup" aria-label="Tipo de bicicleta">
                              {['Montaña', 'Ruta', 'Urbana', 'Electrica'].map((bt) => (
                                <button
                                  key={bt}
                                  type="button"
                                  role="radio"
                                  aria-checked={vehicle.bikeType === bt}
                                  onClick={() => updateVehicle(index, 'bikeType', bt)}
                                  className={`flex-1 min-w-[80px] h-10 rounded-xl text-sm font-medium transition-colors border ${
                                    vehicle.bikeType === bt
                                      ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-600/20'
                                      : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-500/40 hover:bg-blue-50 dark:hover:bg-blue-500/10'
                                  }`}
                                >
                                  {bt}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        {vehicle.type !== 'BICICLETA' && (
                          <>
                            <div className="space-y-1.5">
                              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Aseguradora</label>
                              <select
                                name={`vehicle-insurer-${index}`}
                                autoComplete="off"
                                value={vehicle.insurerId || ''}
                                onChange={(e) => updateVehicle(index, 'insurerId', e.target.value)}
                                className="w-full h-12 px-4 border border-gray-200 dark:border-gray-700 rounded-xl text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:bg-white dark:focus:bg-gray-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/30 focus-visible:border-blue-500 transition-colors"
                              >
                                <option value="">Sin aseguradora</option>
                                {insurers.map((ins) => (
                                  <option key={ins.id} value={ins.id}>{ins.name}</option>
                                ))}
                              </select>
                              {vehicle.insurerId && (
                                <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-3 py-2 rounded-lg">
                                  <Phone className="w-3.5 h-3.5" />
                                  <span>
                                    Emergencias: {insurers.find(i => i.id === vehicle.insurerId)?.phone || '—'}
                                  </span>
                                </div>
                              )}
                            </div>
                            <InputField
                              label="Numero de Poliza"
                              name={`vehicle-policy-${index}`}
                              autoComplete="off"
                              type="text"
                              value={vehicle.policyNumber || ''}
                              onChange={(e) => updateVehicle(index, 'policyNumber', e.target.value)}
                              placeholder="Ej: POL-123456"
                            />
                          </>
                        )}
                      </div>
                    ))}

                    {(() => {
                      const limits = getPlanLimits(tagPlan);
                      return vehicles.length < limits.maxVehicles && (
                        <button
                          type="button"
                          onClick={addVehicle}
                          className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl text-sm font-semibold text-gray-500 dark:text-gray-400 hover:border-blue-400 dark:hover:border-blue-500/40 hover:text-blue-500 dark:hover:text-blue-400 hover:bg-blue-50/50 dark:hover:bg-blue-500/10 transition-all min-h-[44px]"
                        >
                          <Plus className="w-4 h-4" />
                          {vehicles.length === 0 ? 'Agregar mi primer vehículo' : 'Agregar otro vehículo'}
                        </button>
                      );
                    })()}
                  </div>
                )}
              </div>
                );
              })()}

              <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-4 space-y-3">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    name="consent-accepted"
                    checked={consentAccepted}
                    onChange={(e) => {
                      setConsentAccepted(e.target.checked);
                      if (e.target.checked) setConsentError('');
                    }}
                    className="mt-1 w-4 h-4 accent-red-600 focus:ring-2 focus:ring-red-500/30"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {isMinor ? (
                      <>En mi calidad de madre, padre o tutor legal, he leído el{' '}</>
                    ) : (
                      <>He leído el{' '}</>
                    )}
                    <a
                      href="/aviso-de-privacidad"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-red-600 dark:text-red-400 underline font-semibold"
                    >
                      Aviso de Privacidad
                    </a>{' '}
                    y otorgo mi consentimiento expreso para el tratamiento de estos datos
                    sensibles, incluyendo su despliegue a cualquier persona que escanee este tag
                    en caso de emergencia.
                  </span>
                </label>
                {consentError && (
                  <p className="text-sm text-red-600 dark:text-red-400 font-medium">{consentError}</p>
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
                      Guardando…
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5" />
                      Guardar Datos
                    </>
                  )}
                </button>
                {limits.hasPrivateMode && (
                  <button
                    type="button"
                    onClick={() => setShowChangePinModal(true)}
                    className="w-full flex items-center justify-center gap-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-semibold py-3 px-6 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors min-h-[44px]"
                  >
                    <Lock className="w-4 h-4" />
                    Cambiar PIN
                  </button>
                )}
                {isActive && (
                  <button
                    type="button"
                    onClick={() => setEditMode(false)}
                    disabled={saving}
                    className="w-full flex items-center justify-center gap-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-semibold py-3 px-6 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 min-h-[44px]"
                  >
                    Cancelar
                  </button>
                )}
              </div>

              {showChangePinModal && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-4" onClick={() => setShowChangePinModal(false)}>
                  <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-sm p-6" onClick={(e) => e.stopPropagation()}>
                    <div className="text-center mb-6">
                      <div className="inline-flex items-center justify-center w-14 h-14 bg-gray-100 dark:bg-gray-800 rounded-2xl mb-4">
                        <Lock className="w-7 h-7 text-gray-600 dark:text-gray-400" />
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">Cambiar PIN</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Ingresa tu PIN actual y el nuevo PIN</p>
                    </div>

                    <div className="space-y-3">
                      <label htmlFor="change-pin-current" className="sr-only">PIN actual</label>
                      <input
                        id="change-pin-current"
                        type="password"
                        inputMode="numeric"
                        maxLength={6}
                        value={changePinCurrent}
                        onChange={(e) => { setChangePinCurrent(e.target.value.replace(/\D/g, '')); setChangePinError(''); }}
                        placeholder="PIN actual"
                        aria-label="PIN actual"
                        className="w-full h-12 px-4 border border-gray-200 dark:border-gray-700 rounded-xl text-sm bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:bg-white dark:focus:bg-gray-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500/30 focus-visible:border-red-500 transition-colors font-mono text-center text-lg tracking-widest"
                      />
                      <label htmlFor="change-pin-new" className="sr-only">Nuevo PIN</label>
                      <input
                        id="change-pin-new"
                        type="password"
                        inputMode="numeric"
                        maxLength={6}
                        value={changePinNew}
                        onChange={(e) => { setChangePinNew(e.target.value.replace(/\D/g, '')); setChangePinError(''); }}
                        placeholder="Nuevo PIN"
                        aria-label="Nuevo PIN"
                        className="w-full h-12 px-4 border border-gray-200 dark:border-gray-700 rounded-xl text-sm bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:bg-white dark:focus:bg-gray-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500/30 focus-visible:border-red-500 transition-colors font-mono text-center text-lg tracking-widest"
                      />
                      <label htmlFor="change-pin-confirm" className="sr-only">Confirmar nuevo PIN</label>
                      <input
                        id="change-pin-confirm"
                        type="password"
                        inputMode="numeric"
                        maxLength={6}
                        value={changePinConfirm}
                        onChange={(e) => { setChangePinConfirm(e.target.value.replace(/\D/g, '')); setChangePinError(''); }}
                        placeholder="Confirmar nuevo PIN"
                        aria-label="Confirmar nuevo PIN"
                        className="w-full h-12 px-4 border border-gray-200 dark:border-gray-700 rounded-xl text-sm bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:bg-white dark:focus:bg-gray-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500/30 focus-visible:border-red-500 transition-colors font-mono text-center text-lg tracking-widest"
                      />
                    </div>

                    {changePinError && (
                      <div className="flex items-center gap-1.5 text-red-600 dark:text-red-400 text-xs font-medium mt-3">
                        <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                        {changePinError}
                      </div>
                    )}

                    <div className="flex gap-3 mt-6">
                      <button
                        type="button"
                        onClick={() => { setShowChangePinModal(false); setChangePinCurrent(''); setChangePinNew(''); setChangePinConfirm(''); setChangePinError(''); }}
                        className="flex-1 py-3 px-4 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-semibold rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors min-h-[44px]"
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        onClick={handleChangePin}
                        disabled={changingPin}
                        className="flex-1 py-3 px-4 bg-red-600 text-white font-semibold rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 min-h-[44px]"
                      >
                        {changingPin ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Cambiar'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </form>
          </div>
        </div>
      </div>
    );
  }

  // PIN Screen
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-red-50/30 to-gray-50 dark:from-gray-950 dark:via-red-950/10 dark:to-gray-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: 'radial-gradient(circle, #dc2626 1px, transparent 1px)',
        backgroundSize: '24px 24px',
      }} />

      <div className="absolute top-4 right-4 z-20">
        <ThemeToggle />
      </div>

      <div className="relative z-10 w-full max-w-sm">
        <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl p-8 border border-gray-100 dark:border-gray-800">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="relative mx-auto w-16 h-16 mb-4">
              <div className="absolute inset-0 bg-red-100 dark:bg-red-500/10 rounded-2xl rotate-6" />
              <div className="relative bg-gradient-to-br from-red-500 to-red-700 w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg shadow-red-600/30">
                <Lock className="w-7 h-7 text-white" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {pinMode === 'create' ? (pinStep === 'enter' ? 'Crear PIN' : 'Confirmar PIN') : 'Ingresar PIN'}
            </h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-2">
               {pinMode === 'create'
                ? pinStep === 'enter'
                  ? 'Crea un PIN de 6 digitos para proteger tus datos'
                  : 'Repite tu PIN para confirmar'
                : 'Ingresa tu PIN de 6 digitos para editar tus datos medicos'}
            </p>
          </div>

          {/* PIN Input */}
          <form onSubmit={pinMode === 'create' ? handleCreatePin : handlePinLogin} className="space-y-6">
            <div className="relative">
              <PinInput
                length={6}
                value={pinMode === 'create' && pinStep === 'confirm' ? confirmPin : pin}
                onChange={pinMode === 'create' && pinStep === 'confirm' ? handleConfirmPinChange : handlePinChange}
                showPin={showPin}
              />
                <button
                  type="button"
                  onClick={() => setShowPin(!showPin)}
                  className="absolute right-0 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500/30"
                >
                {showPin ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            {/* PIN length indicator */}
            <div className="flex justify-center gap-1">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className={`h-1 rounded-full transition-all duration-200 ${
                    (pinMode === 'create' && pinStep === 'confirm' ? confirmPin : pin).length >= i + 1
                      ? 'w-6 bg-red-500'
                      : 'w-6 bg-gray-200 dark:bg-gray-700'
                  }`}
                />
              ))}
            </div>

            {/* Error message */}
            {pinError && (
              <div className="flex items-center gap-2 text-red-600 dark:text-red-400 text-sm bg-red-50 dark:bg-red-500/10 px-4 py-3 rounded-xl border border-red-100 dark:border-red-500/30">
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
                className="w-full text-center text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 py-2 transition-colors min-h-[44px] flex items-center justify-center"
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
