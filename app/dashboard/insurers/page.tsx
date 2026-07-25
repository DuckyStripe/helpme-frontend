'use client';

import { useState, useEffect } from 'react';
import { insurersApi } from '@/lib/api';
import { toast } from '@/lib/toast';
import {
  Car, Plus, Edit2, Trash2, Phone, Shield, Loader2, AlertCircle, CheckCircle, X,
} from 'lucide-react';
import Modal from '@/components/ui/Modal';

interface Insurer {
  id: string;
  name: string;
  phone: string;
  active: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export default function InsurersPage() {
  const [insurers, setInsurers] = useState<Insurer[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Insurer | null>(null);
  const [formName, setFormName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; phone?: string }>({});

  useEffect(() => {
    loadInsurers();
  }, []);

  async function loadInsurers() {
    try {
      const res = await insurersApi.listAll();
      setInsurers(res.insurers || []);
    } catch {
      toast.error('Error al cargar aseguradoras');
    } finally {
      setLoading(false);
    }
  }

  function openCreate() {
    setEditing(null);
    setFormName('');
    setFormPhone('');
    setErrors({});
    setModalOpen(true);
  }

  function openEdit(insurer: Insurer) {
    setEditing(insurer);
    setFormName(insurer.name);
    setFormPhone(insurer.phone);
    setErrors({});
    setModalOpen(true);
  }

  function validate() {
    const newErrors: typeof errors = {};
    if (!formName.trim()) newErrors.name = 'El nombre es requerido';
    if (!formPhone.trim()) newErrors.phone = 'El teléfono es requerido';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSave() {
    if (!validate()) return;
    setSaving(true);
    try {
      if (editing) {
        await insurersApi.update(editing.id, { name: formName.trim(), phone: formPhone.trim() });
        toast.success('Aseguradora actualizada');
      } else {
        await insurersApi.create({ name: formName.trim(), phone: formPhone.trim() });
        toast.success('Aseguradora creada');
      }
      setModalOpen(false);
      await loadInsurers();
    } catch (err: any) {
      toast.error(err.message || 'Error al guardar');
    } finally {
      setSaving(false);
    }
  }

  async function handleToggle(id: string) {
    try {
      await insurersApi.toggleActive(id);
      await loadInsurers();
      toast.success('Estado actualizado');
    } catch (err: any) {
      toast.error(err.message || 'Error al actualizar');
    }
  }

  async function handleDelete(id: string) {
    try {
      await insurersApi.remove(id);
      await loadInsurers();
      toast.success('Aseguradora deshabilitada');
    } catch (err: any) {
      toast.error(err.message || 'Error al eliminar');
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-red-500" />
      </div>
    );
  }

  const activeCount = insurers.filter(i => i.active).length;
  const inactiveCount = insurers.filter(i => !i.active).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-100">Aseguradoras</h1>
          <p className="text-sm text-gray-400 mt-1">Gestiona las aseguradoras disponibles para los usuarios</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-semibold py-2.5 px-4 rounded-xl transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nueva Aseguradora
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-100">{activeCount}</p>
              <p className="text-xs text-gray-400">Activas</p>
            </div>
          </div>
        </div>
        <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gray-500/10 flex items-center justify-center">
              <X className="w-5 h-5 text-gray-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-100">{inactiveCount}</p>
              <p className="text-xs text-gray-400">Inactivas</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-700/50">
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Teléfono</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700/30">
              {insurers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-gray-400">
                    <Car className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>No hay aseguradoras registradas</p>
                    <button onClick={openCreate} className="text-red-400 hover:text-red-300 text-sm mt-2">
                      Crear la primera
                    </button>
                  </td>
                </tr>
              ) : (
                insurers.map(insurer => (
                  <tr key={insurer.id} className="hover:bg-gray-700/20 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Shield className="w-4 h-4 text-gray-500 flex-shrink-0" />
                        <span className="font-medium text-gray-200">{insurer.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-gray-400">
                        <Phone className="w-3.5 h-3.5" />
                        <span className="font-mono text-sm">{insurer.phone}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleToggle(insurer.id)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                          insurer.active
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20'
                            : 'bg-gray-500/10 text-gray-400 border-gray-500/20 hover:bg-gray-500/20'
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${insurer.active ? 'bg-emerald-400' : 'bg-gray-500'}`} />
                        {insurer.active ? 'Activa' : 'Inactiva'}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEdit(insurer)}
                          className="p-1.5 text-gray-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors"
                          title="Editar"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        {insurer.active && (
                          <button
                            onClick={() => handleDelete(insurer.id)}
                            className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                            title="Deshabilitar"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Editar Aseguradora' : 'Nueva Aseguradora'}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Nombre</label>
            <input
              type="text"
              value={formName}
              onChange={(e) => { setFormName(e.target.value); setErrors(prev => ({ ...prev, name: undefined })); }}
              placeholder="Ej: GNP Seguros"
              className={`w-full h-12 px-4 border rounded-xl text-sm bg-gray-800 text-gray-200 focus:bg-gray-700 focus:outline-none focus:ring-2 transition-all ${
                errors.name ? 'border-red-400 focus:ring-red-500/30' : 'border-gray-600 focus:ring-red-500/30 focus:border-red-500'
              }`}
            />
            {errors.name && (
              <div className="flex items-center gap-1.5 text-red-400 text-xs mt-1">
                <AlertCircle className="w-3.5 h-3.5" />
                {errors.name}
              </div>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Teléfono de Emergencia</label>
            <input
              type="tel"
              value={formPhone}
              onChange={(e) => { setFormPhone(e.target.value); setErrors(prev => ({ ...prev, phone: undefined })); }}
              placeholder="Ej: 55-5169-0000"
              className={`w-full h-12 px-4 border rounded-xl text-sm bg-gray-800 text-gray-200 focus:bg-gray-700 focus:outline-none focus:ring-2 transition-all ${
                errors.phone ? 'border-red-400 focus:ring-red-500/30' : 'border-gray-600 focus:ring-red-500/30 focus:border-red-500'
              }`}
            />
            {errors.phone && (
              <div className="flex items-center gap-1.5 text-red-400 text-xs mt-1">
                <AlertCircle className="w-3.5 h-3.5" />
                {errors.phone}
              </div>
            )}
          </div>
          <div className="flex gap-3 pt-2">
            <button
              onClick={() => setModalOpen(false)}
              className="flex-1 py-3 px-4 bg-gray-700 text-gray-300 font-semibold rounded-xl hover:bg-gray-600 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 py-3 px-4 bg-red-600 text-white font-semibold rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {saving ? 'Guardando...' : editing ? 'Actualizar' : 'Crear'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
