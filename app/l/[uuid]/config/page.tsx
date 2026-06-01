'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { pinApi } from '@/lib/api';
import { toast } from '@/lib/toast';
import {
  Shield, Lock, Activity, Plus, Trash2, Save, CheckCircle, Loader2, AlertTriangle,
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
  curp: '',
  nss: '',
  pob: '',
  umf: '',
};

const bloodTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

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
      return 'El PIN debe tener al menos 4 dígitos';
    }
    return '';
  }

  async function handleCreatePin(e: React.FormEvent) {
    e.preventDefault();
    setPinError('');

    const err = validatePin(pin);
    if (err) {
      setPinError(err);
      return;
    }
    if (pin !== confirmPin) {
      setPinError('Los PIN no coinciden');
      return;
    }

    try {
      await pinApi.setPin(uuid, pin);
      toast.success('PIN creado exitosamente');
      const loginRes = await pinApi.pinLogin(uuid, pin);
      setPinToken(loginRes.token);
      setStatus(loginRes.status as TagStatus);
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
      toast.error('Completa los campos obligatorios: Nombre, Fecha de nacimiento, Tipo de sangre, Teléfono de emergencia');
      return;
    }

    if (!pinToken) {
      toast.error('No hay sesión activa');
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-red-600" />
      </div>
    );
  }

  if (status === 'SUSPENDED') {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl p-8 text-center max-w-sm">
          <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 text-gray-500" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Tag Inactivo</h1>
          <p className="text-gray-600">Este tag ha sido dado de baja del sistema.</p>
        </div>
      </div>
    );
  }

  if (showSuccess) {
    return (
      <div className="min-h-screen bg-gray-100 p-4 sm:p-6">
        <div className="max-w-md mx-auto">
          <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
            <header className="bg-gradient-to-br from-green-600 to-green-800 text-white p-8 text-center">
              <div className="mx-auto w-16 h-16 mb-4 flex items-center justify-center">
                <div className="bg-white text-green-600 p-3 rounded-full shadow-lg">
                  <CheckCircle className="w-10 h-10" />
                </div>
              </div>
              <h1 className="text-2xl font-extrabold tracking-tight">¡Datos Guardados!</h1>
              <p className="text-green-100 text-sm mt-2">Tu información médica de emergencia está lista</p>
            </header>

            <div className="p-6 space-y-5">
              <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4">
                <h2 className="text-sm font-bold text-blue-900 mb-2 flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  ¿Cómo modificar tus datos después?
                </h2>
                <ol className="space-y-2 text-sm text-blue-800">
                  <li className="flex gap-2">
                    <span className="font-bold text-blue-600">1.</span>
                    <span>Escanea el QR o acerca el NFC de tu tag</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="font-bold text-blue-600">2.</span>
                    <span>Ingresa tu PIN de 4 dígitos que acabas de crear</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="font-bold text-blue-600">3.</span>
                    <span>Edita tus datos médicos y guarda los cambios</span>
                  </li>
                </ol>
              </div>

              <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4">
                <h2 className="text-sm font-bold text-amber-900 mb-2 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  Importante
                </h2>
                <ul className="space-y-1 text-sm text-amber-800">
                  <li>• Mantén tu tag NFC/QR en un lugar accesible de tu casco</li>
                  <li>• No compartas tu PIN con nadie</li>
                  <li>• Actualiza tus datos cuando haya cambios importantes</li>
                </ul>
              </div>

              <div className="space-y-3">
                <button
                  onClick={() => setShowSuccess(false)}
                  className="w-full flex items-center justify-center gap-2 bg-gray-100 text-gray-700 font-bold py-3 px-6 rounded-xl hover:bg-gray-200 transition-colors"
                >
                  <Save className="w-5 h-5" />
                  Volver a Editar Datos
                </button>

                <a
                  href={`/L/${uuid}`}
                  className="w-full flex items-center justify-center gap-2 bg-red-600 text-white font-bold py-3 px-6 rounded-xl hover:bg-red-700 transition-colors shadow-lg shadow-red-600/20"
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

  if (pinToken) {
    return (
      <div className="min-h-screen bg-gray-100 p-4 sm:p-6">
        <div className="max-w-md mx-auto">
          <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
            <header className="bg-gradient-to-br from-red-600 to-red-800 text-white p-6 text-center relative">
              <div className="mx-auto w-12 h-12 mb-3 flex items-center justify-center">
                <div className="bg-white text-red-600 p-2 rounded-full shadow-lg">
                  <Shield className="w-6 h-6" />
                </div>
              </div>
              <h1 className="text-xl font-extrabold tracking-tight">Configurar mi Tag</h1>
              <p className="text-red-100 text-xs mt-1">Datos médicos de emergencia</p>
              {isActive && (
                <div className="mt-3 inline-flex items-center gap-1.5 bg-green-500/20 backdrop-blur-sm text-green-100 px-3 py-1 rounded-full text-xs font-bold">
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>Tag activo</span>
                </div>
              )}
            </header>

            <form onSubmit={handleSave} className="p-5 space-y-5">
              <div className="space-y-2">
                <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                  <span className="h-px bg-gray-200 flex-1"></span>
                  Informacion Personal
                  <span className="h-px bg-gray-200 flex-1"></span>
                </h2>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Nombre Completo <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={medicalData.userName}
                      onChange={(e) => updateMedicalField('userName', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">
                        Fecha Nacimiento <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={medicalData.dob}
                        onChange={(e) => updateMedicalField('dob', e.target.value)}
                        placeholder="DD/MM/AAAA"
                        className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">Genero</label>
                      <select
                        value={medicalData.gender}
                        onChange={(e) => updateMedicalField('gender', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent bg-white"
                      >
                        <option value="">Seleccionar</option>
                        <option value="Masculino">Masculino</option>
                        <option value="Femenino">Femenino</option>
                        <option value="Otro">Otro</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">
                        Tipo de Sangre <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={medicalData.bloodType}
                        onChange={(e) => updateMedicalField('bloodType', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent bg-white"
                        required
                      >
                        <option value="">Seleccionar</option>
                        {bloodTypes.map((bt) => (
                          <option key={bt} value={bt}>{bt}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">Religion</label>
                      <input
                        type="text"
                        value={medicalData.religion}
                        onChange={(e) => updateMedicalField('religion', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">Donador de Organos</label>
                      <select
                        value={medicalData.organDonor}
                        onChange={(e) => updateMedicalField('organDonor', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent bg-white"
                      >
                        <option value="Si">Si</option>
                        <option value="No">No</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">
                        Telefono Emergencia <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="tel"
                        value={medicalData.emergencyPhone}
                        onChange={(e) => updateMedicalField('emergencyPhone', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                        required
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                  <span className="h-px bg-gray-200 flex-1"></span>
                  Datos IMSS
                  <span className="h-px bg-gray-200 flex-1"></span>
                </h2>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">CURP</label>
                    <input
                      type="text"
                      value={medicalData.curp}
                      onChange={(e) => updateMedicalField('curp', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent uppercase"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">NSS</label>
                    <input
                      type="text"
                      value={medicalData.nss}
                      onChange={(e) => updateMedicalField('nss', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Pais de Nacimiento</label>
                    <input
                      type="text"
                      value={medicalData.pob}
                      onChange={(e) => updateMedicalField('pob', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">UMF</label>
                    <input
                      type="text"
                      value={medicalData.umf}
                      onChange={(e) => updateMedicalField('umf', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                  <span className="h-px bg-gray-200 flex-1"></span>
                  Informacion Medica
                  <span className="h-px bg-gray-200 flex-1"></span>
                </h2>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Alergias</label>
                    <textarea
                      value={medicalData.allergies}
                      onChange={(e) => updateMedicalField('allergies', e.target.value)}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                      placeholder="Medicamentos, alimentos, picaduras..."
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Condiciones Medicas</label>
                    <textarea
                      value={medicalData.conditions}
                      onChange={(e) => updateMedicalField('conditions', e.target.value)}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                      placeholder="Diabetes, hipertension, asma..."
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Medicamentos Actuales</label>
                    <textarea
                      value={medicalData.medications}
                      onChange={(e) => updateMedicalField('medications', e.target.value)}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                      placeholder="Nombre, dosis, frecuencia..."
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                  <span className="h-px bg-gray-200 flex-1"></span>
                  Contactos de Emergencia
                  <span className="h-px bg-gray-200 flex-1"></span>
                </h2>

                <div className="space-y-3">
                  {contacts.map((contact, index) => (
                    <div key={index} className="bg-gray-50 rounded-xl p-3 border border-gray-100 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-gray-500">Contacto {index + 1}</span>
                        {contacts.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeContact(index)}
                            className="text-red-500 hover:text-red-700 p-1"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          value={contact.name}
                          onChange={(e) => updateContact(index, 'name', e.target.value)}
                          placeholder="Nombre"
                          className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                        />
                        <input
                          type="text"
                          value={contact.relationship}
                          onChange={(e) => updateContact(index, 'relationship', e.target.value)}
                          placeholder="Parentesco"
                          className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                        />
                      </div>
                      <input
                        type="tel"
                        value={contact.phone}
                        onChange={(e) => updateContact(index, 'phone', e.target.value)}
                        placeholder="Telefono"
                        className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      />
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addContact}
                    className="w-full flex items-center justify-center gap-2 py-2 border-2 border-dashed border-gray-300 rounded-xl text-sm font-bold text-gray-500 hover:border-red-400 hover:text-red-500 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Agregar contacto
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full flex items-center justify-center gap-2 bg-red-600 text-white font-bold py-3 px-6 rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-red-600/20"
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
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-sm w-full">
        <div className="text-center mb-6">
          <div className="bg-red-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-1">
            {pinMode === 'create' ? 'Crear PIN' : 'Ingresar PIN'}
          </h1>
          <p className="text-gray-600 text-sm">
            {pinMode === 'create'
              ? 'Crea un PIN de al menos 4 digitos para proteger tus datos'
              : 'Ingresa tu PIN para editar tus datos medicos'}
          </p>
        </div>

        <form onSubmit={pinMode === 'create' ? handleCreatePin : handlePinLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">PIN</label>
            <input
              type="password"
              inputMode="numeric"
              pattern="[0-9]*"
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-center text-2xl tracking-widest font-mono"
              placeholder="****"
              maxLength={8}
              required
            />
          </div>

          {pinMode === 'create' && (
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Confirmar PIN</label>
              <input
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                value={confirmPin}
                onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-center text-2xl tracking-widest font-mono"
                placeholder="****"
                maxLength={8}
                required
              />
            </div>
          )}

          {pinError && (
            <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 px-3 py-2 rounded-lg">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>{pinError}</span>
            </div>
          )}

          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 bg-red-600 text-white font-bold py-3 px-6 rounded-xl hover:bg-red-700 transition-colors shadow-lg shadow-red-600/20"
          >
            <Activity className="w-5 h-5" />
            {pinMode === 'create' ? 'Crear PIN' : 'Acceder'}
          </button>
        </form>
      </div>
    </div>
  );
}
