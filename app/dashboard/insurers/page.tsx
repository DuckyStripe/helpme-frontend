'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authApi, insurersApi, clearTokens } from '@/lib/api';
import { toast } from '@/lib/toast';
import type { User } from '@/types';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import Modal from '@/components/ui/Modal';
import { TableSkeleton, PageLoader } from '@/components/ui/Skeleton';
import EmptyState from '@/components/ui/EmptyState';
import {
  Car, Plus, Edit2, Trash2, Phone, Shield, Loader2, AlertCircle,
} from 'lucide-react';

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
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [insurers, setInsurers] = useState<Insurer[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Insurer | null>(null);
  const [formName, setFormName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; phone?: string }>({});

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadData() {
    try {
      const meData = await authApi.me();
      setUser(meData.user);
      await loadInsurers();
    } catch {
      clearTokens();
      router.push('/login');
    } finally {
      setLoading(false);
    }
  }

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

  if (loading && !user) return <PageLoader />;
  if (!user) return null;

  const activeCount = insurers.filter(i => i.active).length;
  const inactiveCount = insurers.filter(i => !i.active).length;

  return (
    <DashboardLayout user={user}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-100">Aseguradoras</h1>
          <p className="text-sm text-gray-500 mt-1">Gestiona las aseguradoras disponibles para los usuarios</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors sm:w-auto w-full"
        >
          <Plus className="w-4 h-4" />
          Nueva Aseguradora
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-5">
          <p className="text-sm text-gray-500 mb-1">Activas</p>
          <p className="text-3xl font-bold text-emerald-400">{activeCount}</p>
        </div>
        <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-5">
          <p className="text-sm text-gray-500 mb-1">Inactivas</p>
          <p className="text-3xl font-bold text-gray-400">{inactiveCount}</p>
        </div>
      </div>

      {loading ? (
        <TableSkeleton rows={5} />
      ) : insurers.length === 0 ? (
        <EmptyState
          icon={Car}
          title="No hay aseguradoras"
          description="Crea tu primera aseguradora para comenzar"
          action={{ label: 'Nueva Aseguradora', onClick: openCreate }}
        />
      ) : (
        <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[600px]">
              <thead>
                <tr className="border-b border-gray-700/50">
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <span className="flex items-center gap-1.5"><Shield className="w-3.5 h-3.5" /> Nombre</span>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <span className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" /> Teléfono</span>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700/30">
                {insurers.map(insurer => (
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
                          className="p-1.5 text-gray-500 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors"
                          title="Editar"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        {insurer.active && (
                          <button
                            onClick={() => handleDelete(insurer.id)}
                            className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                            title="Deshabilitar"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Editar Aseguradora' : 'Nueva Aseguradora'} size="sm">
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Nombre</label>
            <input
              type="text"
              value={formName}
              onChange={(e) => { setFormName(e.target.value); setErrors(prev => ({ ...prev, name: undefined })); }}
              placeholder="Ej: GNP Seguros"
              className={`w-full px-4 py-2.5 bg-gray-800/50 border rounded-lg text-sm text-gray-200 focus:outline-none focus:ring-2 transition-all ${
                errors.name ? 'border-red-400 focus:ring-red-500/30' : 'border-gray-700/50 focus:ring-red-500/50 focus:border-red-500'
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
            <label className="block text-sm font-medium text-gray-300 mb-2">Teléfono de Emergencia</label>
            <input
              type="tel"
              value={formPhone}
              onChange={(e) => { setFormPhone(e.target.value); setErrors(prev => ({ ...prev, phone: undefined })); }}
              placeholder="Ej: 55-5169-0000"
              className={`w-full px-4 py-2.5 bg-gray-800/50 border rounded-lg text-sm text-gray-200 focus:outline-none focus:ring-2 transition-all ${
                errors.phone ? 'border-red-400 focus:ring-red-500/30' : 'border-gray-700/50 focus:ring-red-500/50 focus:border-red-500'
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
              className="flex-1 px-4 py-2.5 border border-gray-700 text-gray-300 font-medium rounded-lg hover:bg-gray-700/50 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {saving ? 'Guardando...' : editing ? 'Actualizar' : 'Crear'}
            </button>
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  );
}
