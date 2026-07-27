'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authApi, usersApi, tagsApi } from '@/lib/api';
import { toast } from '@/lib/toast';
import type { User } from '@/types';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import Modal from '@/components/ui/Modal';
import EmptyState from '@/components/ui/EmptyState';
import { CardSkeleton, PageLoader } from '@/components/ui/Skeleton';
import {
  Users, Plus, Loader2, Search, Ban, ChevronRight, Mail, Tag, Key,
} from 'lucide-react';

interface SellerData {
  id: string;
  name: string;
  email: string;
  tagCount: number;
  active: number;
  virgin: number;
  incomplete: number;
  suspended: number;
  createdAt: string;
}

export default function SellersPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [sellers, setSellers] = useState<SellerData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Create modal
  const [showCreate, setShowCreate] = useState(false);
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formConfirmPassword, setFormConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Detail modal
  const [showDetail, setShowDetail] = useState(false);
  const [selectedSeller, setSelectedSeller] = useState<SellerData | null>(null);
  const [sellerTags, setSellerTags] = useState<any[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);

  // Assign tags modal
  const [showAssign, setShowAssign] = useState(false);
  const [assignQty, setAssignQty] = useState(10);
  const [assignSellerId, setAssignSellerId] = useState('');
  const [assigning, setAssigning] = useState(false);

  // Delete modal
  const [showDelete, setShowDelete] = useState(false);
  const [deleteSeller, setDeleteSeller] = useState<SellerData | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Reset password modal
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [resetSeller, setResetSeller] = useState<SellerData | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [resetting, setResetting] = useState(false);

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
      loadSellers();
    } catch {
      router.push('/login');
    }
  }

  async function loadSellers() {
    setLoading(true);
    try {
      const [sellersData, tagsData] = await Promise.all([
        usersApi.list(),
        tagsApi.list({ limit: 1 }),
      ]);

      const mapped = sellersData.sellers.map((s: any) => {
        const sellerTags = tagsData.tags?.filter((t: any) => t.seller?.id === s.id) || [];
        return {
          id: s.id,
          name: s.name,
          email: s.email,
          tagCount: s.tagCount || 0,
          active: sellerTags.filter((t: any) => t.status === 'ACTIVE').length,
          virgin: sellerTags.filter((t: any) => t.status === 'VIRGIN').length,
          incomplete: sellerTags.filter((t: any) => t.status === 'INCOMPLETE').length,
          suspended: sellerTags.filter((t: any) => t.status === 'SUSPENDED').length,
          createdAt: s.createdAt,
        };
      });

      setSellers(mapped);
    } catch (err: any) {
      toast.error(err.message || 'Error al cargar vendedores');
    } finally {
      setLoading(false);
    }
  }

  const filteredSellers = sellers.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.email.toLowerCase().includes(search.toLowerCase())
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
      await usersApi.create(formName.trim(), formEmail.trim(), formPassword);
      toast.success('Vendedor creado exitosamente');
      setShowCreate(false);
      setFormName('');
      setFormEmail('');
      setFormPassword('');
      setFormConfirmPassword('');
      loadSellers();
    } catch (err: any) {
      toast.error(err.message || 'Error al crear vendedor');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!deleteSeller) return;
    setDeleting(true);
    try {
      await usersApi.remove(deleteSeller.id);
      toast.success('Vendedor eliminado');
      setShowDelete(false);
      loadSellers();
    } catch (err: any) {
      toast.error(err.message || 'Error al eliminar vendedor');
    } finally {
      setDeleting(false);
    }
  }

  async function handleAssignTags() {
    if (!assignSellerId || assignQty < 1) {
      toast.error('Selecciona un vendedor y cantidad válida');
      return;
    }
    setAssigning(true);
    try {
      await tagsApi.create(assignQty, assignSellerId);
      toast.success(`${assignQty} tags asignados`);
      setShowAssign(false);
      setAssignQty(10);
      setAssignSellerId('');
      loadSellers();
    } catch (err: any) {
      toast.error(err.message || 'Error al asignar tags');
    } finally {
      setAssigning(false);
    }
  }

  async function loadSellerDetail(seller: SellerData) {
    setSelectedSeller(seller);
    setShowDetail(true);
    setDetailLoading(true);
    try {
      const data = await tagsApi.list({ sellerId: seller.id, limit: 50 });
      setSellerTags(data.tags);
    } catch (err: any) {
      toast.error(err.message || 'Error al cargar tags del vendedor');
    } finally {
      setDetailLoading(false);
    }
  }

  function getActivationRate(seller: SellerData) {
    if (seller.tagCount === 0) return 0;
    return Math.round((seller.active / seller.tagCount) * 100);
  }

  async function handleResetPassword() {
    if (!resetSeller) return;
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
      await usersApi.resetPassword(resetSeller.id, newPassword);
      toast.success('Contraseña actualizada');
      setShowResetPassword(false);
      setNewPassword('');
      setConfirmNewPassword('');
      setResetSeller(null);
    } catch (err: any) {
      toast.error(err.message || 'Error al cambiar contraseña');
    } finally {
      setResetting(false);
    }
  }

  if (loading && !user) return <PageLoader />;
  if (!user) return null;

  return (
    <DashboardLayout user={user}>
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-100">Vendedores</h1>
          <p className="text-sm text-gray-500 mt-1">Gestiona los vendedores y sus tags asignados</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:gap-3">
          <button
            onClick={() => setShowAssign(true)}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-700/50 text-gray-300 text-sm font-medium rounded-lg hover:bg-gray-700 transition-colors border border-gray-600/50"
          >
            <Tag className="w-4 h-4" />
            Asignar Tags
          </button>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Nuevo Vendedor
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar vendedor…"
            className="w-full pl-10 pr-4 py-2.5 bg-gray-800/50 border border-gray-700/50 rounded-lg text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500/50"
          />
        </div>
      </div>

      {/* Seller Cards */}
      {loading ? (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <CardSkeleton key={i} />)}
        </div>
      ) : filteredSellers.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No hay vendedores"
          description={search ? 'No se encontraron vendedores con esa búsqueda' : 'Crea tu primer vendedor para comenzar'}
          action={{ label: 'Nuevo Vendedor', onClick: () => setShowCreate(true) }}
        />
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredSellers.map(seller => {
            const rate = getActivationRate(seller);
            return (
              <div
                key={seller.id}
                className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-5 hover:border-gray-600/50 transition-colors group"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-red-600/10 rounded-lg flex items-center justify-center">
                      <span className="text-sm font-bold text-red-400">{seller.name.charAt(0).toUpperCase()}</span>
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-gray-200">{seller.name}</h3>
                      <p className="text-xs text-gray-500 flex items-center gap-1">
                        <Mail className="w-3 h-3" />
                        {seller.email}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => loadSellerDetail(seller)}
                    className="p-1.5 text-gray-600 hover:text-gray-300 hover:bg-gray-700/50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                    aria-label="Ver detalle"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-4 gap-3 mb-4">
                  <div className="text-center">
                    <p className="text-lg font-bold text-gray-200">{seller.tagCount}</p>
                    <p className="text-[10px] text-gray-500 uppercase">Total</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-emerald-400">{seller.active}</p>
                    <p className="text-[10px] text-gray-500 uppercase">Activos</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-gray-400">{seller.virgin}</p>
                    <p className="text-[10px] text-gray-500 uppercase">Vírgenes</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-red-400">{seller.suspended}</p>
                    <p className="text-[10px] text-gray-500 uppercase">Baja</p>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="mb-4">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="text-gray-500">Tasa de activación</span>
                    <span className="text-gray-300 font-medium">{rate}%</span>
                  </div>
                  <div className="h-2 bg-gray-700/50 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-red-600 to-emerald-500 rounded-full transition-[width]"
                      style={{ width: `${rate}%` }}
                    />
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-3 border-t border-gray-700/30">
                  <button
                    onClick={() => {
                      setAssignSellerId(seller.id);
                      setShowAssign(true);
                    }}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-amber-400 hover:bg-amber-500/10 rounded-lg transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Asignar tags
                  </button>
                  <button
                    onClick={() => {
                      setResetSeller(seller);
                      setNewPassword('');
                      setConfirmNewPassword('');
                      setShowResetPassword(true);
                    }}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors"
                  >
                    <Key className="w-3.5 h-3.5" />
                    Contraseña
                  </button>
                  <button
                    onClick={() => {
                      setDeleteSeller(seller);
                      setShowDelete(true);
                    }}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Modal */}
      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Nuevo Vendedor" size="sm">
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

      {/* Delete Modal */}
      <Modal isOpen={showDelete} onClose={() => setShowDelete(false)} title="Eliminar Vendedor" size="sm">
        <div className="text-center">
          <div className="mx-auto w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center mb-4">
            <Ban className="w-6 h-6 text-red-400" />
          </div>
          <p className="text-gray-300 mb-2">
            ¿Eliminar a <strong>{deleteSeller?.name}</strong>?
          </p>
          <p className="text-sm text-gray-500 mb-6">
            Esta acción no se puede deshacer. El vendedor perderá acceso al sistema.
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

      {/* Assign Tags Modal */}
      <Modal isOpen={showAssign} onClose={() => setShowAssign(false)} title="Asignar Tags" size="sm">
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Vendedor</label>
            <select
              value={assignSellerId}
              onChange={(e) => setAssignSellerId(e.target.value)}
              className="w-full px-4 py-2.5 bg-gray-800/50 border border-gray-700/50 rounded-lg text-gray-200 focus:outline-none focus:ring-2 focus:ring-red-500/50"
            >
              <option value="">Seleccionar vendedor...</option>
              {sellers.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Cantidad de tags</label>
            <input
              type="number"
              min={1}
              max={500}
              value={assignQty}
              onChange={(e) => setAssignQty(parseInt(e.target.value) || 1)}
              className="w-full px-4 py-2.5 bg-gray-800/50 border border-gray-700/50 rounded-lg text-gray-200 focus:outline-none focus:ring-2 focus:ring-red-500/50"
            />
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowAssign(false)}
              className="flex-1 px-4 py-2.5 border border-gray-700 text-gray-300 font-medium rounded-lg hover:bg-gray-700/50 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleAssignTags}
              disabled={assigning || !assignSellerId}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-600 text-white font-medium rounded-lg hover:bg-amber-700 transition-colors disabled:opacity-50"
            >
              {assigning && <Loader2 className="w-4 h-4 animate-spin" />}
              Asignar
            </button>
          </div>
        </div>
      </Modal>

      {/* Reset Password Modal */}
      <Modal isOpen={showResetPassword} onClose={() => setShowResetPassword(false)} title="Cambiar Contraseña" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-gray-400">
            Nueva contraseña para <strong className="text-gray-200">{resetSeller?.name}</strong>
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
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {resetting && <Loader2 className="w-4 h-4 animate-spin" />}
              Cambiar
            </button>
          </div>
        </div>
      </Modal>

      {/* Detail Modal */}
      <Modal isOpen={showDetail} onClose={() => setShowDetail(false)} title={`Tags de ${selectedSeller?.name}`} size="xl">
        {detailLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-red-500" />
          </div>
        ) : sellerTags.length === 0 ? (
          <div className="text-center py-8 text-gray-500 text-sm">Este vendedor no tiene tags asignados</div>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {/* Summary */}
            {selectedSeller && (
              <div className="grid grid-cols-4 gap-3 mb-4 p-4 bg-gray-800/50 rounded-lg">
                <div className="text-center">
                  <p className="text-xl font-bold text-gray-200">{selectedSeller.tagCount}</p>
                  <p className="text-xs text-gray-500">Total</p>
                </div>
                <div className="text-center">
                  <p className="text-xl font-bold text-emerald-400">{selectedSeller.active}</p>
                  <p className="text-xs text-gray-500">Activos</p>
                </div>
                <div className="text-center">
                  <p className="text-xl font-bold text-gray-400">{selectedSeller.virgin}</p>
                  <p className="text-xs text-gray-500">Vírgenes</p>
                </div>
                <div className="text-center">
                  <p className="text-xl font-bold text-amber-400">{selectedSeller.incomplete}</p>
                  <p className="text-xs text-gray-500">Incompletos</p>
                </div>
              </div>
            )}
            {/* Tags list */}
            <div className="grid grid-cols-2 gap-2">
              {sellerTags.map(tag => (
                <div key={tag.id} className="flex items-center justify-between px-3 py-2 bg-gray-800/30 rounded-lg">
                  <span className="font-mono text-xs text-gray-400 truncate flex-1">{tag.uuid.substring(0, 16)}…</span>
                  <span className={`ml-2 px-2 py-0.5 text-[10px] font-medium rounded-full ${
                    tag.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-400' :
                    tag.status === 'VIRGIN' ? 'bg-gray-500/10 text-gray-400' :
                    tag.status === 'INCOMPLETE' ? 'bg-amber-500/10 text-amber-400' :
                    'bg-red-500/10 text-red-400'
                  }`}>
                    {tag.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </Modal>
    </DashboardLayout>
  );
}
