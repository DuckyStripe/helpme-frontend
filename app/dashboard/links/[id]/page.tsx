'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Activity, Loader2, Plus, Trash2, ArrowLeft, Save } from 'lucide-react';
import { linksApi } from '@/lib/api';

export default function LinkEditorPage() {
  const router = useRouter();
  const params = useParams();
  const linkId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [linkName, setLinkName] = useState('Mi Ficha');

  const [medicalData, setMedicalData] = useState({
    userName: '',
    dob: '',
    curp: '',
    nss: '',
    pob: '',
    gender: '',
    religion: '',
    organDonor: 'No',
    umf: '',
    bloodType: '',
    allergies: '',
    conditions: '',
    medications: '',
    emergencyPhone: '',
    hereditaryBackground: {} as Record<string, string>,
  });

  const [contacts, setContacts] = useState([
    { name: '', relationship: '', phone: '' },
  ]);

  const [hereditaryKeys, setHereditaryKeys] = useState<string[]>([]);
  const [hereditaryValues, setHereditaryValues] = useState<string[]>([]);

  useEffect(() => {
    loadLink();
  }, [linkId]);

  async function loadLink() {
    try {
      const data = await linksApi.getLink(linkId);
      setLinkName(data.name || 'Mi Ficha');

      if (data.medicalData) {
        setMedicalData({
          userName: data.medicalData.userName || '',
          dob: data.medicalData.dob || '',
          curp: data.medicalData.curp || '',
          nss: data.medicalData.nss || '',
          pob: data.medicalData.pob || '',
          gender: data.medicalData.gender || '',
          religion: data.medicalData.religion || '',
          organDonor: data.medicalData.organDonor || 'No',
          umf: data.medicalData.umf || '',
          bloodType: data.medicalData.bloodType || '',
          allergies: data.medicalData.allergies || '',
          conditions: data.medicalData.conditions || '',
          medications: data.medicalData.medications || '',
          emergencyPhone: data.medicalData.emergencyPhone || '',
          hereditaryBackground: data.medicalData.hereditaryBackground || {},
        });

        const entries = Object.entries(data.medicalData.hereditaryBackground || {}) as [string, string][];
        setHereditaryKeys(entries.map(([k]) => k));
        setHereditaryValues(entries.map(([, v]) => v));
      }

      if (data.contacts && data.contacts.length > 0) {
        setContacts(data.contacts.map((c: any) => ({ name: c.name, relationship: c.relationship, phone: c.phone })));
      }
    } catch (err: any) {
      alert(err.message || 'Error al cargar');
      router.push('/dashboard');
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!medicalData.userName || !medicalData.dob || !medicalData.bloodType || !medicalData.emergencyPhone) {
      alert('Completa los campos requeridos: Nombre, Fecha de nacimiento, Tipo de sangre y Teléfono de emergencia');
      return;
    }

    setSaving(true);
    try {
      const hereditary: Record<string, string> = {};
      hereditaryKeys.forEach((key, i) => {
        if (key.trim() && hereditaryValues[i]?.trim()) {
          hereditary[key.trim()] = hereditaryValues[i].trim();
        }
      });

      await linksApi.updateLink(linkId, {
        name: linkName,
        medicalData: {
          ...medicalData,
          hereditaryBackground: hereditary,
        },
        contacts: contacts.filter((c) => c.name.trim() && c.phone.trim()),
      });

      alert('¡Guardado!');
      router.push('/dashboard');
    } catch (err: any) {
      alert(err.message || 'Error al guardar');
    } finally {
      setSaving(false);
    }
  }

  function updateMedicalData(field: string, value: string) {
    setMedicalData((prev) => ({ ...prev, [field]: value }));
  }

  function updateContact(index: number, field: string, value: string) {
    setContacts((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  }

  function addContact() {
    setContacts((prev) => [...prev, { name: '', relationship: '', phone: '' }]);
  }

  function removeContact(index: number) {
    setContacts((prev) => prev.filter((_, i) => i !== index));
  }

  function addHereditary() {
    setHereditaryKeys((prev) => [...prev, '']);
    setHereditaryValues((prev) => [...prev, '']);
  }

  function removeHereditary(index: number) {
    setHereditaryKeys((prev) => prev.filter((_, i) => i !== index));
    setHereditaryValues((prev) => prev.filter((_, i) => i !== index));
  }

  function updateHereditaryKey(index: number, value: string) {
    setHereditaryKeys((prev) => {
      const updated = [...prev];
      updated[index] = value;
      return updated;
    });
  }

  function updateHereditaryValue(index: number, value: string) {
    setHereditaryValues((prev) => {
      const updated = [...prev];
      updated[index] = value;
      return updated;
    });
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-red-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
            <ArrowLeft className="w-5 h-5" />
            <span>Volver</span>
          </Link>
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white px-4 py-2 rounded-lg font-bold transition-colors flex items-center gap-2"
          >
            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
            {saving ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 mb-1">Editar Ficha</h1>
          <input
            type="text"
            value={linkName}
            onChange={(e) => setLinkName(e.target.value)}
            className="text-lg font-medium text-gray-600 w-full bg-transparent border-b-2 border-gray-200 focus:border-red-500 outline-none pb-1"
          />
        </div>

        <section className="bg-white rounded-2xl shadow-sm p-6 space-y-4">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Activity className="w-5 h-5 text-red-600" />
            Datos Personales
          </h2>

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-bold text-gray-700 mb-1">Nombre Completo *</label>
              <input
                type="text"
                value={medicalData.userName}
                onChange={(e) => updateMedicalData('userName', e.target.value)}
                className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-red-500 outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Fecha de Nacimiento *</label>
              <input
                type="text"
                value={medicalData.dob}
                onChange={(e) => updateMedicalData('dob', e.target.value)}
                placeholder="dd/mm/yyyy"
                className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-red-500 outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Género</label>
              <select
                value={medicalData.gender}
                onChange={(e) => updateMedicalData('gender', e.target.value)}
                className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-red-500 outline-none"
              >
                <option value="">Seleccionar</option>
                <option value="Hombre">Hombre</option>
                <option value="Mujer">Mujer</option>
                <option value="Otro">Otro</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Religión</label>
              <input
                type="text"
                value={medicalData.religion}
                onChange={(e) => updateMedicalData('religion', e.target.value)}
                className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-red-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Donador de Órganos</label>
              <select
                value={medicalData.organDonor}
                onChange={(e) => updateMedicalData('organDonor', e.target.value)}
                className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-red-500 outline-none"
              >
                <option value="Si">Sí</option>
                <option value="No">No</option>
              </select>
            </div>
          </div>
        </section>

        <section className="bg-white rounded-2xl shadow-sm p-6 space-y-4">
          <h2 className="text-lg font-bold text-gray-900">Datos Médicos</h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Tipo de Sangre *</label>
              <select
                value={medicalData.bloodType}
                onChange={(e) => updateMedicalData('bloodType', e.target.value)}
                className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-red-500 outline-none"
                required
              >
                <option value="">Seleccionar</option>
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
                <option value="O+">O+</option>
                <option value="O-">O-</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Teléfono de Emergencia *</label>
              <input
                type="tel"
                value={medicalData.emergencyPhone}
                onChange={(e) => updateMedicalData('emergencyPhone', e.target.value)}
                className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-red-500 outline-none"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Alergias</label>
            <input
              type="text"
              value={medicalData.allergies}
              onChange={(e) => updateMedicalData('allergies', e.target.value)}
              placeholder="Negadas si no hay"
              className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-red-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Condiciones Crónicas</label>
            <input
              type="text"
              value={medicalData.conditions}
              onChange={(e) => updateMedicalData('conditions', e.target.value)}
              placeholder="Negadas si no hay"
              className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-red-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Medicamentos Actuales</label>
            <input
              type="text"
              value={medicalData.medications}
              onChange={(e) => updateMedicalData('medications', e.target.value)}
              placeholder="Negados si no hay"
              className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-red-500 outline-none"
            />
          </div>
        </section>

        <section className="bg-white rounded-2xl shadow-sm p-6 space-y-4">
          <h2 className="text-lg font-bold text-gray-900">IMSS / Seguridad Social</h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">NSS (Número de Seguro Social)</label>
              <input
                type="text"
                value={medicalData.nss}
                onChange={(e) => updateMedicalData('nss', e.target.value)}
                className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-red-500 outline-none font-mono"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">CURP</label>
              <input
                type="text"
                value={medicalData.curp}
                onChange={(e) => updateMedicalData('curp', e.target.value.toUpperCase())}
                className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-red-500 outline-none font-mono uppercase"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Lugar de Nacimiento</label>
              <input
                type="text"
                value={medicalData.pob}
                onChange={(e) => updateMedicalData('pob', e.target.value)}
                className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-red-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">UMF (Clínica)</label>
              <input
                type="text"
                value={medicalData.umf}
                onChange={(e) => updateMedicalData('umf', e.target.value)}
                className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-red-500 outline-none"
              />
            </div>
          </div>
        </section>

        <section className="bg-white rounded-2xl shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900">Contactos de Emergencia</h2>
            <button
              onClick={addContact}
              className="text-red-600 hover:text-red-700 font-bold text-sm flex items-center gap-1"
            >
              <Plus className="w-4 h-4" /> Agregar
            </button>
          </div>

          {contacts.map((contact, index) => (
            <div key={index} className="grid grid-cols-3 gap-3 p-4 bg-gray-50 rounded-xl">
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">Nombre</label>
                <input
                  type="text"
                  value={contact.name}
                  onChange={(e) => updateContact(index, 'name', e.target.value)}
                  className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-red-500 outline-none text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">Parentesco</label>
                <input
                  type="text"
                  value={contact.relationship}
                  onChange={(e) => updateContact(index, 'relationship', e.target.value)}
                  className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-red-500 outline-none text-sm"
                />
              </div>
              <div className="flex items-end gap-2">
                <div className="flex-1">
                  <label className="block text-xs font-bold text-gray-500 mb-1">Teléfono</label>
                  <input
                    type="tel"
                    value={contact.phone}
                    onChange={(e) => updateContact(index, 'phone', e.target.value)}
                    className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-red-500 outline-none text-sm"
                  />
                </div>
                {contacts.length > 1 && (
                  <button
                    onClick={() => removeContact(index)}
                    className="text-gray-400 hover:text-red-600 p-2"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </section>

        <section className="bg-white rounded-2xl shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900">Antecedentes Heredofamiliares</h2>
            <button
              onClick={addHereditary}
              className="text-red-600 hover:text-red-700 font-bold text-sm flex items-center gap-1"
            >
              <Plus className="w-4 h-4" /> Agregar
            </button>
          </div>

          {hereditaryKeys.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-4">
              Sin antecedentes heredo-familiares registrados
            </p>
          ) : (
            hereditaryKeys.map((_, index) => (
              <div key={index} className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  value={hereditaryKeys[index]}
                  onChange={(e) => updateHereditaryKey(index, e.target.value)}
                  placeholder="Condición (ej: Diabetes)"
                  className="px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-red-500 outline-none text-sm"
                />
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={hereditaryValues[index]}
                    onChange={(e) => updateHereditaryValue(index, e.target.value)}
                    placeholder="Detalle"
                    className="flex-1 px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-red-500 outline-none text-sm"
                  />
                  <button
                    onClick={() => removeHereditary(index)}
                    className="text-gray-400 hover:text-red-600 p-2"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </section>

        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white py-4 rounded-xl font-bold transition-colors flex items-center justify-center gap-2"
        >
          {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
          {saving ? 'Guardando...' : 'Guardar Cambios'}
        </button>
      </main>
    </div>
  );
}
