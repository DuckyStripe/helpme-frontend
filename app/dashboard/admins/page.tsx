'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authApi, adminsApi, usersApi } from '@/lib/api';
import { toast } from '@/lib/toast';
import type { User } from '@/types';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import Modal from '@/components/ui/Modal';
import EmptyState from '@/components/ui/EmptyState';
import { CardSkeleton, PageLoader } from '@/components/ui/Skeleton';
import {
  Shield, Plus, Loader2, Search, Ban, Key, Pencil, Trash2,
} from 'lucide-react';

interface AdminData {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

export default function AdminsPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [admins, setAdmins] = useState<AdminData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const [showCreate, setShowCreate] = useState(false);
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formConfirmPassword, setFormConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [showEdit, setShowEdit] = useState(false);
  const [editAdmin, setEditAdmin] = useState<AdminData | null>(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editing, setEditing] = useState(false);

  const [showResetPassword, setShowResetPassword] = useState(false);
  const [resetAdmin, setResetAdmin] = useState<AdminData | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [resetting, setResetting] = useState(false);

  const [showDelete, setShowDelete] = useState(false);
  const [deleteAdmin, setDeleteAdmin] = useState<AdminData | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    checkAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function checkAuth() {
    try {
      const meData = await authApi.me();
      if (meData.user.role !== 'ADMIN') {
        router.push('/dashboard');
        return;
      }
      setUser(meData.user);
      loadAdmins();
    } catch {
      router.push('/login');
    }
  }

  async function loadAdmins() {
    setLoading(true);
    try {
      const data = await adminsApi.list();
      setAdmins(data.admins.map((a: any) => ({
        id: a.id,
        name: a.name,
        email: a.email,
        createdAt: a.createdAt,
      })));
    } catch (err: any) {
      toast.error(err.message || 'Error al cargar administradores');
    } finally {
      setLoading(false);
    }
  }

  const filteredAdmins = admins.filter(a =>
    a.name.toLowerCase().includes(search.toLowerCase()) ||
    a.email.toLowerCase().includes(search.toLowerCase())
  );

  async function handleCreate() {
    if (!formName.trim() || !formEmail.trim()) {
      toast.error('Nombre y email son obligatorios');
      return;
    }
    if (formPassword.length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres');
      return;
    }
    if (formPassword !== formConfirmPassword) {
      toast.error('Las contraseñas no coinciden');
      return;
    }
    setSubmitting(true);
    try {
      await adminsApi.create(formName.trim(), formEmail.trim(), formPassword);
      toast.success('Administrador creado exitosamente');
      setShowCreate(false);
      setFormName('');
      setFormEmail('');
      setFormPassword('');
      setFormConfirmPassword('');
      loadAdmins();
    } catch (err: any) {
      toast.error(err.message || 'Error al crear administrador');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleEdit() {
    if (!editAdmin) return;
    if (!editName.trim() || !editEmail.trim()) {
      toast.error('Nombre y email son obligatorios');
      return;
    }
    setEditing(true);
    try {
      await adminsApi.update(editAdmin.id, { name: editName.trim(), email: editEmail.trim() });
      toast.success('Administrador actualizado');
      setShowEdit(false);
      setEditAdmin(null);
      loadAdmins();
    } catch (err: any) {
      toast.error(err.message || 'Error al actualizar administrador');
    } finally {
      setEditing(false);
    }
  }

  async function handleResetPassword() {
    if (!resetAdmin) return;
    if (newPassword.length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      toast.error('Las contraseñas no coinciden');
      return;
    }
    setResetting(true);
    try {
      await usersApi.resetPassword(resetAdmin.id, newPassword);
      toast.success('Contraseña actualizada');
      setShowResetPassword(false);
      setNewPassword('');
      setConfirmNewPassword('');
      setResetAdmin(null);
    } catch (err: any) {
      toast.error(err.message || 'Error al cambiar contraseña');
    } finally {
      setResetting(false);
    }
  }

  async function handleDelete() {
    if (!deleteAdmin) return;
    setDeleting(true);
    try {
      await adminsApi.remove(deleteAdmin.id);
      toast.success('Administrador eliminado');
      setShowDelete(false);
      loadAdmins();
    } catch (err: any) {
      toast.error(err.message || 'Error al eliminar administrador');
    } finally {
      setDeleting(false);
    }
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  if (loading && !user) return <PageLoader />;
  if (!user) return null;

  return (
    <DashboardLayout user={user}>
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-100">Administradores</h1>
          <p className="text-sm text-gray-500 mt-1">Gestiona los administradores del sistema</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nuevo Admin
        </button>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar administrador…"
            className="w-full pl-10 pr-4 py-2.5 bg-gray-800/50 border border-gray-700/50 rounded-lg text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500/50"
          />
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => <CardSkeleton key={i} />)}
        </div>
      ) : filteredAdmins.length === 0 ? (
        <EmptyState
          icon={Shield}
          title="No hay administradores"
          description={search ? 'No se encontraron administradores con esa búsqueda' : 'Crea tu primer administrador'}
          action={{ label: 'Nuevo Admin', onClick: () => setShowCreate(true) }}
        />
      ) : (
        <div className="bg-gray-800/30 border border-gray-700/50 rounded-xl overflow-hidden">
          {/* Table header */}
          <div className="hidden md:grid grid-cols-12 gap-4 px-5 py-3 border-b border-gray-700/50 text-xs font-medium text-gray-500 uppercase tracking-wider">
            <div className="col-span-4">Nombre</div>
            <div className="col-span-4">Email</div>
            <div className="col-span-2">Creado</div>
            <div className="col-span-2 text-right">Acciones</div>
          </div>

          {/* Table rows */}
          <div className="divide-y divide-gray-700/30">
            {filteredAdmins.map(admin => (
              <div
                key={admin.id}
                className="grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-4 px-5 py-4 hover:bg-gray-700/20 transition-colors"
              >
                {/* Name */}
                <div className="md:col-span-4 flex items-center gap-3">
                  <div className="w-9 h-9 bg-red-600/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-bold text-red-400">{admin.name.charAt(0).toUpperCase()}</span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-200 truncate">{admin.name}</p>
                    <p className="text-xs text-gray-500 md:hidden truncate">{admin.email}</p>
                  </div>
                </div>

                {/* Email */}
                <div className="hidden md:flex md:col-span-4 items-center">
                  <p className="text-sm text-gray-400 truncate">{admin.email}</p>
                </div>

                {/* Created */}
                <div className="hidden md:flex md:col-span-2 items-center">
                  <p className="text-sm text-gray-500">{formatDate(admin.createdAt)}</p>
                </div>

                {/* Actions */}
                <div className="md:col-span-2 flex items-center justify-end gap-1">
                  <button
                    onClick={() => {
                      setEditAdmin(admin);
                      setEditName(admin.name);
                      setEditEmail(admin.email);
                      setShowEdit(true);
                    }}
                    className="p-2 text-gray-500 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors"
                    title="Editar"
                    aria-label="Editar"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      setResetAdmin(admin);
                      setNewPassword('');
                      setConfirmNewPassword('');
                      setShowResetPassword(true);
                    }}
                    className="p-2 text-gray-500 hover:text-amber-400 hover:bg-amber-500/10 rounded-lg transition-colors"
                    title="Resetear contraseña"
                    aria-label="Restablecer contraseña"
                  >
                    <Key className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      setDeleteAdmin(admin);
                      setShowDelete(true);
                    }}
                    disabled={admins.length <= 1}
                    className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-gray-500"
                    title={admins.length <= 1 ? 'No se puede eliminar el último administrador' : 'Eliminar'}
                    aria-label={admins.length <= 1 ? 'No se puede eliminar el último administrador' : 'Eliminar'}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Create Modal */}
      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Nuevo Administrador" size="sm">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Nombre</label>
            <input
              type="text"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              autoComplete="name"
              className="w-full px-4 py-2.5 bg-gray-800/50 border border-gray-700/50 rounded-lg text-gray-200 focus:outline-none focus:ring-2 focus:ring-red-500/50"
              placeholder="Nombre completo"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Email</label>
            <input
              type="email"
              value={formEmail}
              onChange={(e) => setFormEmail(e.target.value)}
              autoComplete="email"
              className="w-full px-4 py-2.5 bg-gray-800/50 border border-gray-700/50 rounded-lg text-gray-200 focus:outline-none focus:ring-2 focus:ring-red-500/50"
              placeholder="email@ejemplo.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Contraseña</label>
            <input
              type="password"
              value={formPassword}
              onChange={(e) => setFormPassword(e.target.value)}
              autoComplete="new-password"
              className="w-full px-4 py-2.5 bg-gray-800/50 border border-gray-700/50 rounded-lg text-gray-200 focus:outline-none focus:ring-2 focus:ring-red-500/50"
              placeholder="Mínimo 6 caracteres"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Confirmar Contraseña</label>
            <input
              type="password"
              value={formConfirmPassword}
              onChange={(e) => setFormConfirmPassword(e.target.value)}
              className="w-full px-4 py-2.5 bg-gray-800/50 border border-gray-700/50 rounded-lg text-gray-200 focus:outline-none focus:ring-2 focus:ring-red-500/50"
              placeholder="Repite la contraseña"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button
              onClick={() => setShowCreate(false)}
              className="flex-1 px-4 py-2.5 border border-gray-700 text-gray-300 font-medium rounded-lg hover:bg-gray-700/50 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleCreate}
              disabled={submitting}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              Crear
            </button>
          </div>
        </div>
      </Modal>

      {/* Edit Modal */}
      <Modal isOpen={showEdit} onClose={() => setShowEdit(false)} title="Editar Administrador" size="sm">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Nombre</label>
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="w-full px-4 py-2.5 bg-gray-800/50 border border-gray-700/50 rounded-lg text-gray-200 focus:outline-none focus:ring-2 focus:ring-red-500/50"
              placeholder="Nombre completo"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Email</label>
            <input
              type="email"
              value={editEmail}
              onChange={(e) => setEditEmail(e.target.value)}
              className="w-full px-4 py-2.5 bg-gray-800/50 border border-gray-700/50 rounded-lg text-gray-200 focus:outline-none focus:ring-2 focus:ring-red-500/50"
              placeholder="email@ejemplo.com"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button
              onClick={() => setShowEdit(false)}
              className="flex-1 px-4 py-2.5 border border-gray-700 text-gray-300 font-medium rounded-lg hover:bg-gray-700/50 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleEdit}
              disabled={editing}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {editing && <Loader2 className="w-4 h-4 animate-spin" />}
              Guardar
            </button>
          </div>
        </div>
      </Modal>

      {/* Reset Password Modal */}
      <Modal isOpen={showResetPassword} onClose={() => setShowResetPassword(false)} title="Cambiar Contraseña" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-gray-400">
            Nueva contraseña para <strong className="text-gray-200">{resetAdmin?.name}</strong>
          </p>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Nueva Contraseña</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-4 py-2.5 bg-gray-800/50 border border-gray-700/50 rounded-lg text-gray-200 focus:outline-none focus:ring-2 focus:ring-red-500/50"
              placeholder="Mínimo 6 caracteres"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Confirmar Contraseña</label>
            <input
              type="password"
              value={confirmNewPassword}
              onChange={(e) => setConfirmNewPassword(e.target.value)}
              className="w-full px-4 py-2.5 bg-gray-800/50 border border-gray-700/50 rounded-lg text-gray-200 focus:outline-none focus:ring-2 focus:ring-red-500/50"
              placeholder="Repite la contraseña"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button
              onClick={() => setShowResetPassword(false)}
              className="flex-1 px-4 py-2.5 border border-gray-700 text-gray-300 font-medium rounded-lg hover:bg-gray-700/50 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleResetPassword}
              disabled={resetting}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-600 text-white font-medium rounded-lg hover:bg-amber-700 transition-colors disabled:opacity-50"
            >
              {resetting && <Loader2 className="w-4 h-4 animate-spin" />}
              Cambiar
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete Modal */}
      <Modal isOpen={showDelete} onClose={() => setShowDelete(false)} title="Eliminar Administrador" size="sm">
        <div className="text-center">
          <div className="mx-auto w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center mb-4">
            <Ban className="w-6 h-6 text-red-400" />
          </div>
          <p className="text-gray-300 mb-2">
            ¿Eliminar a <strong>{deleteAdmin?.name}</strong>?
          </p>
          <p className="text-sm text-gray-500 mb-6">
            Esta acción no se puede deshacer. El administrador perderá acceso al sistema.
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => setShowDelete(false)}
              className="flex-1 px-4 py-2.5 border border-gray-700 text-gray-300 font-medium rounded-lg hover:bg-gray-700/50 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
            >
              {deleting && <Loader2 className="w-4 h-4 animate-spin" />}
              Eliminar
            </button>
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  );
}
