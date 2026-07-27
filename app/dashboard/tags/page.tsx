'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { authApi, tagsApi, usersApi, clearTokens } from '@/lib/api';
import { toast } from '@/lib/toast';
import type { User, TagStatus, Tag } from '@/types';
import { type PlanType, PLAN_LABELS, PLAN_COLORS } from '@/lib/plans';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import StatusBadge from '@/components/ui/StatusBadge';
import FilterBar from '@/components/ui/FilterBar';
import Pagination from '@/components/ui/Pagination';
import BulkActionsBar from '@/components/ui/BulkActionsBar';
import Modal from '@/components/ui/Modal';
import EmptyState from '@/components/ui/EmptyState';
import { TableSkeleton, PageLoader } from '@/components/ui/Skeleton';
import {
  QrCode, Plus, Copy, ExternalLink, Ban, Play, Loader2, Check,
  UserMinus, Hash, Calendar, Eye, ScanLine, Unlock, CreditCard,
  MessageCircle,
} from 'lucide-react';

export default function TagsPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [tags, setTags] = useState<Tag[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ status: 'ALL', sellerId: '', search: '', dateFrom: '', dateTo: '', plan: '' });
  const [sellers, setSellers] = useState<any[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [vendorStats, setVendorStats] = useState({ total: 0, virgin: 0, activated: 0 });

  const [showCreate, setShowCreate] = useState(false);
  const [createQty, setCreateQty] = useState(10);
  const [createSellerId, setCreateSellerId] = useState('');
  const [createPlan, setCreatePlan] = useState<PlanType>('PRINCIPAL');
  const [createOwnerPhone, setCreateOwnerPhone] = useState('');
  const [creating, setCreating] = useState(false);

  const [showAssign, setShowAssign] = useState(false);
  const [assignSellerId, setAssignSellerId] = useState('');
  const [assigning, setAssigning] = useState(false);

  const [showChangePlan, setShowChangePlan] = useState(false);
  const [changePlanTag, setChangePlanTag] = useState<{ id: string; uuid: string; plan: PlanType } | null>(null);
  const [newPlan, setNewPlan] = useState<PlanType>('PRINCIPAL');
  const [changingPlan, setChangingPlan] = useState(false);

  const [showSendInstructions, setShowSendInstructions] = useState(false);
  const [sendInstructionsTag, setSendInstructionsTag] = useState<{ id: string; uuid: string; plan: PlanType } | null>(null);
  const [sendInstructionsPhone, setSendInstructionsPhone] = useState('');
  const [sendingInstructions, setSendingInstructions] = useState(false);

  const [confirmSuspendId, setConfirmSuspendId] = useState<string | null>(null);
  const [confirmBulkSuspend, setConfirmBulkSuspend] = useState(false);

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (user) loadTags();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, filters, user]);

  async function loadData() {
    try {
      const meData = await authApi.me();
      setUser(meData.user);
      if (meData.user.role === 'ADMIN') {
        const sellersData = await usersApi.list();
        setSellers(sellersData.sellers);
      } else {
        const allData = await loadAllTagsForVendor();
        setVendorStats({
          total: allData.total || 0,
          virgin: allData.counts?.VIRGIN || 0,
          activated: (allData.counts?.INCOMPLETE || 0) + (allData.counts?.ACTIVE || 0),
        });
      }
    } catch {
      clearTokens();
      router.push('/login');
    } finally {
      setLoading(false);
    }
  }

  async function loadTags() {
    setLoading(true);
    try {
      const params: any = { page, limit };
      if (filters.status !== 'ALL' && filters.status !== 'SENT') params.status = filters.status;
      if (filters.sellerId) params.sellerId = filters.sellerId;
      if (filters.search) params.search = filters.search;
      if (filters.dateFrom) params.dateFrom = filters.dateFrom;
      if (filters.dateTo) params.dateTo = filters.dateTo;
      if (filters.plan) params.plan = filters.plan;

      const data = await tagsApi.list(params);
      let filteredTags = data.tags;
      if (filters.status === 'SENT') {
        filteredTags = data.tags.filter((t: Tag) => t.status === 'VIRGIN' && t.instructionsSentAt);
      }
      setTags(filteredTags);
      setCounts(data.counts);
      setTotal(filters.status === 'SENT' ? filteredTags.length : data.total);
      setTotalPages(filters.status === 'SENT' ? Math.ceil(filteredTags.length / limit) : data.totalPages);
      setSelected(new Set());
    } catch (err: any) {
      toast.error(err.message || 'Error al cargar tags');
    } finally {
      setLoading(false);
    }
  }

  async function loadAllTagsForVendor() {
    try {
      const data = await tagsApi.list({ limit: 1000 });
      return data;
    } catch {
      return { counts: {} as Record<string, number>, total: 0, tags: [], page: 1, limit: 1000, totalPages: 1 };
    }
  }

  const handleFilterChange = useCallback((f: any) => {
    setFilters(f);
    setPage(1);
  }, []);

  async function handleCreate() {
    if (createQty < 1 || createQty > 500) {
      toast.error('Cantidad debe ser entre 1 y 500');
      return;
    }
    if (createQty === 1 && createOwnerPhone && !/^\d{10}$/.test(createOwnerPhone)) {
      toast.error('El teléfono debe tener 10 dígitos');
      return;
    }
    setCreating(true);
    try {
      const res = await tagsApi.create(createQty, createSellerId || undefined, createPlan, createQty === 1 ? createOwnerPhone : undefined);
      toast.success(`${createQty} tag${createQty > 1 ? 's' : ''} creado${createQty > 1 ? 's' : ''} exitosamente`);
      if (res.whatsappStatus === 'sent') {
        toast.success(res.whatsappMessage);
      } else if (res.whatsappStatus === 'failed') {
        toast.error(`No se enviaron instrucciones por WhatsApp: ${res.whatsappMessage}`);
      } else if (createQty === 1 && !createOwnerPhone) {
        toast.info('No se enviaron instrucciones porque no se proporcionó un teléfono de destinatario.');
      }
      setShowCreate(false);
      setCreateQty(10);
      setCreateSellerId('');
      setCreatePlan('PRINCIPAL');
      setCreateOwnerPhone('');
      loadTags();
    } catch (err: any) {
      toast.error(err.message || 'Error al crear tags');
    } finally {
      setCreating(false);
    }
  }

  function openSendInstructions(tag: any) {
    setSendInstructionsTag({ id: tag.id, uuid: tag.uuid, plan: tag.plan || 'PRINCIPAL' });
    setSendInstructionsPhone('');
    setShowSendInstructions(true);
  }

  async function handleSendInstructions() {
    if (!sendInstructionsTag || !/^\d{10}$/.test(sendInstructionsPhone)) {
      toast.error('Ingresa un teléfono válido de 10 dígitos');
      return;
    }
    setSendingInstructions(true);
    try {
      const res = await tagsApi.sendInstructions(sendInstructionsTag.id, sendInstructionsPhone);
      if (res.whatsappStatus === 'sent') {
        toast.success(res.whatsappMessage);
      } else {
        toast.error(`No se enviaron instrucciones por WhatsApp: ${res.whatsappMessage}`);
      }
      setShowSendInstructions(false);
      setSendInstructionsTag(null);
      setSendInstructionsPhone('');
    } catch (err: any) {
      toast.error(err.message || 'Error al enviar instrucciones');
    } finally {
      setSendingInstructions(false);
    }
  }

  async function handleSuspend(id: string) {
    try {
      await tagsApi.suspend(id);
      toast.success('Tag suspendido');
      loadTags();
    } catch (err: any) {
      toast.error(err.message || 'Error al suspender tag');
    } finally {
      setConfirmSuspendId(null);
    }
  }

  async function handleResume(id: string) {
    try {
      await tagsApi.resume(id);
      toast.success('Tag reanudado');
      loadTags();
    } catch (err: any) {
      toast.error(err.message || 'Error al reanudar tag');
    }
  }

  async function handleUnlockPin(id: string) {
    try {
      await tagsApi.unlockPin(id);
      toast.success('PIN desbloqueado');
      loadTags();
    } catch (err: any) {
      toast.error(err.message || 'Error al desbloquear PIN');
    }
  }

  async function handleBulkAssign() {
    if (!assignSellerId) {
      toast.error('Selecciona un vendedor');
      return;
    }
    setAssigning(true);
    try {
      await tagsApi.bulkAssign(Array.from(selected), assignSellerId);
      toast.success(`${selected.size} tag${selected.size > 1 ? 's' : ''} asignados`);
      setShowAssign(false);
      setSelected(new Set());
      loadTags();
    } catch (err: any) {
      toast.error(err.message || 'Error al asignar tags');
    } finally {
      setAssigning(false);
    }
  }

  async function handleBulkSuspend() {
    try {
      await tagsApi.bulkSuspend(Array.from(selected));
      toast.success(`${selected.size} tag${selected.size > 1 ? 's' : ''} suspendidos`);
      setSelected(new Set());
      loadTags();
    } catch (err: any) {
      toast.error(err.message || 'Error al suspender tags');
    } finally {
      setConfirmBulkSuspend(false);
    }
  }

  async function handleBulkResume() {
    try {
      await tagsApi.bulkResume(Array.from(selected));
      toast.success(`${selected.size} tag${selected.size > 1 ? 's' : ''} reanudados`);
      setSelected(new Set());
      loadTags();
    } catch (err: any) {
      toast.error(err.message || 'Error al reanudar tags');
    }
  }

  function openChangePlan(tag: any) {
    setChangePlanTag({ id: tag.id, uuid: tag.uuid, plan: tag.plan });
    setNewPlan(tag.plan || 'PRINCIPAL');
    setShowChangePlan(true);
  }

  async function handleChangePlan() {
    if (!changePlanTag) return;
    if (newPlan === changePlanTag.plan) {
      toast.info('El plan ya es el mismo');
      return;
    }
    setChangingPlan(true);
    try {
      await tagsApi.renewPlan(changePlanTag.id, newPlan);
      toast.success(`Plan cambiado a ${PLAN_LABELS[newPlan]}`);
      setShowChangePlan(false);
      setChangePlanTag(null);
      loadTags();
    } catch (err: any) {
      toast.error(err.message || 'Error al cambiar plan');
    } finally {
      setChangingPlan(false);
    }
  }

  function toggleSelect(id: string) {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  }

  function toggleSelectAll() {
    if (selected.size === tags.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(tags.map(t => t.id)));
    }
  }

  function copyLink(uuid: string) {
    navigator.clipboard.writeText(`${window.location.origin}/L/${uuid}`);
    toast.success('Link copiado');
  }

  function shortUuid(uuid: string) {
    return `${uuid.substring(0, 8)}…${uuid.substring(uuid.length - 4)}`;
  }

  if (loading && !user) return <PageLoader />;
  if (!user) return null;

  const isAdmin = user.role === 'ADMIN';

  return (
    <DashboardLayout user={user}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-100">Tags</h1>
          <p className="text-sm text-gray-500 mt-1">Gestiona los tags NFC/QR del sistema</p>
        </div>
        {isAdmin && (
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors sm:w-auto w-full"
          >
            <Plus className="w-4 h-4" />
            Crear Tags
          </button>
        )}
      </div>

      {!isAdmin && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-5">
            <p className="text-sm text-gray-500 mb-1">Total asignados</p>
            <p className="text-3xl font-bold text-gray-200">{vendorStats.total}</p>
          </div>
          <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-5">
            <p className="text-sm text-gray-500 mb-1">Disponibles</p>
            <p className="text-3xl font-bold text-emerald-400">{vendorStats.virgin}</p>
          </div>
          <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-5">
            <p className="text-sm text-gray-500 mb-1">Activados</p>
            <p className="text-3xl font-bold text-amber-400">{vendorStats.activated}</p>
          </div>
        </div>
      )}

      {isAdmin && (
        <div className="flex gap-2 mb-6 overflow-x-auto pb-1 sm:flex-wrap sm:gap-4">
          <button
            onClick={() => handleFilterChange({ ...filters, status: 'ALL' })}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors shrink-0 ${
              filters.status === 'ALL' ? 'bg-gray-700/50 text-gray-200' : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            <span className="font-medium">Todos</span>
            <span className="font-medium">{Object.values(counts).reduce((a, b) => a + b, 0)}</span>
          </button>
          {Object.entries(counts).map(([status, count]) => {
            if (status === 'VIRGIN' && count > 0) {
              const sentCount = tags.filter(t => t.status === 'VIRGIN' && t.instructionsSentAt).length;
              const pendingCount = count - sentCount;
              return (
                <div key={status} className="flex gap-2 shrink-0">
                  {pendingCount > 0 && (
                    <button
                      onClick={() => handleFilterChange({ ...filters, status: filters.status === status ? 'ALL' : status })}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors shrink-0 ${
                        filters.status === status ? 'bg-gray-700/50 text-gray-200' : 'text-gray-500 hover:text-gray-300'
                      }`}
                    >
                      <StatusBadge status={status as TagStatus} />
                      <span className="font-medium">{pendingCount}</span>
                    </button>
                  )}
                  {sentCount > 0 && (
                    <button
                      onClick={() => handleFilterChange({ ...filters, status: filters.status === 'SENT' ? 'ALL' : 'SENT' })}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors shrink-0 ${
                        filters.status === 'SENT' ? 'bg-gray-700/50 text-gray-200' : 'text-gray-500 hover:text-gray-300'
                      }`}
                    >
                      <StatusBadge status="VIRGIN" isSent />
                      <span className="font-medium">{sentCount}</span>
                    </button>
                  )}
                </div>
              );
            }
            return (
              <button
                key={status}
                onClick={() => handleFilterChange({ ...filters, status: filters.status === status ? 'ALL' : status })}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors shrink-0 ${
                  filters.status === status ? 'bg-gray-700/50 text-gray-200' : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                <StatusBadge status={status as TagStatus} />
                <span className="font-medium">{count}</span>
              </button>
            );
          })}
        </div>
      )}

      <div className="mb-4">
        <FilterBar
          onFilterChange={handleFilterChange}
          sellers={isAdmin ? sellers.map(s => ({ id: s.id, name: s.name })) : []}
          adminId={isAdmin ? user.id : undefined}
          adminName={isAdmin ? user.name : undefined}
          plans={['PRINCIPAL', 'PRO', 'ULTRA']}
        />
      </div>

      {isAdmin && (
        <div className="mb-4">
          <BulkActionsBar
            selectedCount={selected.size}
            onAssign={() => setShowAssign(true)}
            onSuspend={() => setConfirmBulkSuspend(true)}
            onResume={handleBulkResume}
            onClear={() => setSelected(new Set())}
          />
        </div>
      )}

      {loading ? (
        <TableSkeleton rows={5} />
      ) : tags.length === 0 ? (
        <EmptyState
          icon={QrCode}
          title="No hay tags"
          description={filters.status !== 'ALL' || filters.search || filters.plan ? 'No se encontraron tags con los filtros aplicados' : 'Crea tu primer tag para comenzar'}
          action={isAdmin ? { label: 'Crear Tags', onClick: () => setShowCreate(true) } : undefined}
        />
      ) : (
        <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[800px]">
              <thead>
                <tr className="border-b border-gray-700/50">
                  {isAdmin && (
                    <th className="px-4 py-3 text-left w-10">
                      <input
                        type="checkbox"
                        checked={selected.size === tags.length && tags.length > 0}
                        onChange={toggleSelectAll}
                        className="w-4 h-4 rounded border-gray-600 bg-gray-700/50 text-red-600 focus:ring-red-500/50 focus:ring-offset-0 cursor-pointer"
                      />
                    </th>
                  )}
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <span className="flex items-center gap-1.5"><Hash className="w-3.5 h-3.5" /> UUID</span>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <span className="flex items-center gap-1.5"><MessageCircle className="w-3.5 h-3.5" /> Teléfono</span>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <span className="flex items-center gap-1.5"><UserMinus className="w-3.5 h-3.5" /> Dueño</span>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Plan</th>
                  {isAdmin && (
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <span className="flex items-center gap-1.5"><UserMinus className="w-3.5 h-3.5" /> Vendedor</span>
                    </th>
                  )}
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <span className="flex items-center justify-center gap-1.5"><Eye className="w-3.5 h-3.5" /> Vistas</span>
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <span className="flex items-center justify-center gap-1.5"><ScanLine className="w-3.5 h-3.5" /> Escaneos</span>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> Creado</span>
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700/30">
                {tags.map(tag => (
                  <tr key={tag.id} className="hover:bg-gray-700/20 transition-colors">
                    {isAdmin && (
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selected.has(tag.id)}
                          onChange={() => toggleSelect(tag.id)}
                          className="w-4 h-4 rounded border-gray-600 bg-gray-700/50 text-red-600 focus:ring-red-500/50 focus:ring-offset-0 cursor-pointer"
                        />
                      </td>
                    )}
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs text-gray-300 cursor-help" title={tag.uuid}>{shortUuid(tag.uuid)}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <StatusBadge status={tag.status} isSent={!!tag.instructionsSentAt} />
                        {tag.status === 'ACTIVE' && tag.userDisabled && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-full" title="Modo privado activado por el dueño">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                            Privado
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-400">{tag.ownerPhone || '—'}</td>
                    <td className="px-4 py-3 text-sm text-gray-400">{tag.ownerName || '—'}</td>
                    <td className="px-4 py-3">
                      {tag.plan ? (
                        <span className={`inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-full ${PLAN_COLORS[tag.plan as PlanType]?.bg || 'bg-gray-100'} ${PLAN_COLORS[tag.plan as PlanType]?.text || 'text-gray-700'}`}>
                          {PLAN_LABELS[tag.plan as PlanType] || tag.plan}
                        </span>
                      ) : (
                        <span className="text-gray-500 text-xs">—</span>
                      )}
                    </td>
                    {isAdmin && (
                      <td className="px-4 py-3 text-sm text-gray-400">{tag.seller?.name || '—'}</td>
                    )}
                    <td className="px-4 py-3 text-sm text-gray-400 text-center">{tag.viewCount}</td>
                    <td className="px-4 py-3 text-sm text-gray-400 text-center">{tag.scanCount}</td>
                    <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">{new Date(tag.createdAt).toLocaleDateString('es-MX')}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => copyLink(tag.uuid)}
                          className="flex items-center gap-1 px-2 py-1.5 text-xs font-medium text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 rounded-lg transition-colors"
                          title="Copiar URL para NFC"
                          aria-label="Copiar URL para NFC"
                        >
                          <Copy className="w-3.5 h-3.5" />
                          <span className="hidden lg:inline">Copiar URL</span>
                        </button>
                        {tag.status === 'VIRGIN' && (
                          <button
                            onClick={() => openSendInstructions(tag)}
                            className="p-1.5 text-gray-500 hover:text-sky-400 hover:bg-sky-500/10 rounded-lg transition-colors"
                            title="Enviar instrucciones por WhatsApp"
                            aria-label="Enviar instrucciones por WhatsApp"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <a
                          href={`/L/${tag.uuid}`}
                          target="_blank"
                          className="p-1.5 text-gray-500 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-colors"
                          title="Ver tag"
                          aria-label="Ver tag"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                        {isAdmin && (
                          <button
                            onClick={() => openChangePlan(tag)}
                            className="p-1.5 text-gray-500 hover:text-purple-400 hover:bg-purple-500/10 rounded-lg transition-colors"
                            title="Cambiar plan"
                            aria-label="Cambiar plan"
                          >
                            <CreditCard className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {isAdmin && tag.status !== 'VIRGIN' && tag.status !== 'SUSPENDED' && (
                          <button
                            onClick={() => handleUnlockPin(tag.id)}
                            className="p-1.5 text-gray-500 hover:text-amber-400 hover:bg-amber-500/10 rounded-lg transition-colors"
                            title="Desbloquear PIN"
                            aria-label="Desbloquear PIN"
                          >
                            <Unlock className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {isAdmin && tag.status !== 'SUSPENDED' && (
                          <button
                            onClick={() => setConfirmSuspendId(tag.id)}
                            className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                            title="Suspender"
                            aria-label="Suspender"
                          >
                            <Ban className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {isAdmin && tag.status === 'SUSPENDED' && (
                          <button
                            onClick={() => handleResume(tag.id)}
                            className="p-1.5 text-gray-500 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-colors"
                            title="Reanudar"
                            aria-label="Reanudar"
                          >
                            <Play className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Pagination page={page} totalPages={totalPages} total={total} onPageChange={setPage} />
        </div>
      )}

      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Crear Tags" size="sm">
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Plan</label>
            <select
              value={createPlan}
              onChange={(e) => setCreatePlan(e.target.value as PlanType)}
              className="w-full px-4 py-2.5 bg-gray-800/50 border border-gray-700/50 rounded-lg text-gray-200 focus:outline-none focus:ring-2 focus:ring-red-500/50"
            >
              <option value="PRINCIPAL">Principal ($149)</option>
              <option value="PRO">Pro ($449)</option>
              <option value="ULTRA">Ultra ($699)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Cantidad de tags</label>
            <input
              type="number"
              min={1}
              max={500}
              value={createQty}
              onChange={(e) => setCreateQty(parseInt(e.target.value) || 1)}
              className="w-full px-4 py-2.5 bg-gray-800/50 border border-gray-700/50 rounded-lg text-gray-200 focus:outline-none focus:ring-2 focus:ring-red-500/50"
            />
            <p className="text-xs text-gray-500 mt-1">Máximo 500 tags por lote</p>
          </div>
          {createQty === 1 && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Teléfono del destinatario <span className="text-gray-500">(opcional)</span>
              </label>
              <input
                type="tel"
                inputMode="numeric"
                maxLength={10}
                placeholder="10 dígitos, ej: 5512345678"
                value={createOwnerPhone}
                onChange={(e) => setCreateOwnerPhone(e.target.value.replace(/\D/g, ''))}
                className="w-full px-4 py-2.5 bg-gray-800/50 border border-gray-700/50 rounded-lg text-gray-200 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-red-500/50"
              />
              <p className="text-xs text-gray-500 mt-1">Se enviarán instrucciones de configuración por WhatsApp. Este número NO se guarda en el sistema.</p>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Asignar a</label>
            <select
              value={createSellerId}
              onChange={(e) => setCreateSellerId(e.target.value)}
              className="w-full px-4 py-2.5 bg-gray-800/50 border border-gray-700/50 rounded-lg text-gray-200 focus:outline-none focus:ring-2 focus:ring-red-500/50"
            >
              <option value="">Admin (yo)</option>
              {sellers.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
            {sellers.length === 0 && (
              <p className="text-xs text-gray-500 mt-1">No hay vendedores registrados. Los tags se asignarán a tu cuenta.</p>
            )}
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowCreate(false)}
              className="flex-1 px-4 py-2.5 border border-gray-700 text-gray-300 font-medium rounded-lg hover:bg-gray-700/50 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleCreate}
              disabled={creating}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
            >
              {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Crear {createQty} tag{createQty > 1 ? 's' : ''}
            </button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={showAssign} onClose={() => setShowAssign(false)} title="Asignar Vendedor" size="sm">
        <div className="space-y-5">
          <p className="text-sm text-gray-400">Asignar {selected.size} tag{selected.size > 1 ? 's' : ''} a:</p>
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
          <div className="flex gap-3">
            <button
              onClick={() => setShowAssign(false)}
              className="flex-1 px-4 py-2.5 border border-gray-700 text-gray-300 font-medium rounded-lg hover:bg-gray-700/50 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleBulkAssign}
              disabled={assigning || !assignSellerId}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-600 text-white font-medium rounded-lg hover:bg-amber-700 transition-colors disabled:opacity-50"
            >
              {assigning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              Asignar
            </button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={showChangePlan} onClose={() => setShowChangePlan(false)} title="Cambiar Plan del Tag" size="sm">
        <div className="space-y-5">
          <div className="bg-gray-800/50 border border-gray-700/50 rounded-lg p-3">
            <p className="text-xs text-gray-500 mb-1">Tag</p>
            <p className="font-mono text-sm text-gray-200">{changePlanTag?.uuid ? shortUuid(changePlanTag.uuid) : ''}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Plan actual</label>
            <span className={`inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-full ${PLAN_COLORS[changePlanTag?.plan as PlanType]?.bg || 'bg-gray-100'} ${PLAN_COLORS[changePlanTag?.plan as PlanType]?.text || 'text-gray-700'}`}>
              {PLAN_LABELS[changePlanTag?.plan as PlanType] || changePlanTag?.plan || 'Sin plan'}
            </span>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Nuevo plan</label>
            <select
              value={newPlan}
              onChange={(e) => setNewPlan(e.target.value as PlanType)}
              className="w-full px-4 py-2.5 bg-gray-800/50 border border-gray-700/50 rounded-lg text-gray-200 focus:outline-none focus:ring-2 focus:ring-red-500/50"
            >
              <option value="PRINCIPAL">Principal ($149)</option>
              <option value="PRO">Pro ($449)</option>
              <option value="ULTRA">Ultra ($699)</option>
            </select>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowChangePlan(false)}
              className="flex-1 px-4 py-2.5 border border-gray-700 text-gray-300 font-medium rounded-lg hover:bg-gray-700/50 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleChangePlan}
              disabled={changingPlan || newPlan === changePlanTag?.plan}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
            >
              {changingPlan ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
              {changingPlan ? 'Cambiando…' : 'Cambiar Plan'}
            </button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={showSendInstructions} onClose={() => setShowSendInstructions(false)} title="Enviar Instrucciones por WhatsApp" size="sm">
        <div className="space-y-5">
          <div className="bg-gray-800/50 border border-gray-700/50 rounded-lg p-3">
            <p className="text-xs text-gray-500 mb-1">Tag</p>
            <p className="font-mono text-sm text-gray-200">{sendInstructionsTag?.uuid ? shortUuid(sendInstructionsTag.uuid) : ''}</p>
            <p className="text-xs text-gray-400 mt-1">Plan: {PLAN_LABELS[sendInstructionsTag?.plan as PlanType] || sendInstructionsTag?.plan || 'Sin plan'}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Teléfono del destinatario</label>
            <input
              type="tel"
              inputMode="numeric"
              maxLength={10}
              placeholder="10 dígitos, ej: 5512345678"
              value={sendInstructionsPhone}
              onChange={(e) => setSendInstructionsPhone(e.target.value.replace(/\D/g, ''))}
              className="w-full px-4 py-2.5 bg-gray-800/50 border border-gray-700/50 rounded-lg text-gray-200 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-sky-500/50"
            />
            <p className="text-xs text-gray-500 mt-1">Se enviarán instrucciones de configuración. Este número NO se guarda en el sistema.</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowSendInstructions(false)}
              className="flex-1 px-4 py-2.5 border border-gray-700 text-gray-300 font-medium rounded-lg hover:bg-gray-700/50 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSendInstructions}
              disabled={sendingInstructions || sendInstructionsPhone.length !== 10}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-sky-600 text-white font-medium rounded-lg hover:bg-sky-700 transition-colors disabled:opacity-50"
            >
              {sendingInstructions ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageCircle className="w-4 h-4" />}
              {sendingInstructions ? 'Enviando…' : 'Enviar instrucciones'}
            </button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={!!confirmSuspendId} onClose={() => setConfirmSuspendId(null)} title="Suspender Tag" size="sm">
        <div className="text-center">
          <div className="mx-auto w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center mb-4">
            <Ban className="w-6 h-6 text-red-400" />
          </div>
          <p className="text-gray-300 mb-6">¿Suspender este tag?</p>
          <div className="flex gap-3">
            <button
              onClick={() => setConfirmSuspendId(null)}
              className="flex-1 px-4 py-2.5 border border-gray-700 text-gray-300 font-medium rounded-lg hover:bg-gray-700/50 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={() => confirmSuspendId && handleSuspend(confirmSuspendId)}
              className="flex-1 px-4 py-2.5 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors"
            >
              Suspender
            </button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={confirmBulkSuspend} onClose={() => setConfirmBulkSuspend(false)} title="Suspender Tags" size="sm">
        <div className="text-center">
          <div className="mx-auto w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center mb-4">
            <Ban className="w-6 h-6 text-red-400" />
          </div>
          <p className="text-gray-300 mb-6">¿Suspender {selected.size} tag{selected.size > 1 ? 's' : ''}?</p>
          <div className="flex gap-3">
            <button
              onClick={() => setConfirmBulkSuspend(false)}
              className="flex-1 px-4 py-2.5 border border-gray-700 text-gray-300 font-medium rounded-lg hover:bg-gray-700/50 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleBulkSuspend}
              className="flex-1 px-4 py-2.5 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors"
            >
              Suspender
            </button>
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  );
}
