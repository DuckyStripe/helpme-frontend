'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { authApi, tagsApi, clearTokens } from '@/lib/api';
import { toast } from '@/lib/toast';
import type { User, TagStatus, EmergencyContact } from '@/types';
import { type PlanType, PLAN_LABELS, PLAN_COLORS } from '@/lib/plans';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import StatusBadge from '@/components/ui/StatusBadge';
import Modal from '@/components/ui/Modal';
import { PageLoader } from '@/components/ui/Skeleton';
import {
  ArrowLeft, Copy, ExternalLink, Ban, Play, Shield, Unlock,
  Calendar, MapPin, Smartphone, Eye, ScanLine, User as UserIcon,
  Siren,
} from 'lucide-react';

function parseDevice(userAgent: string): string {
  if (!userAgent) return 'Desconocido';
  if (/mobile/i.test(userAgent)) {
    if (/iphone/i.test(userAgent)) return 'iPhone';
    if (/android/i.test(userAgent)) return 'Android';
    return 'Mobile';
  }
  if (/tablet|ipad/i.test(userAgent)) return 'Tablet';
  if (/windows/i.test(userAgent)) return 'Windows';
  if (/macintosh|mac os/i.test(userAgent)) return 'macOS';
  if (/linux/i.test(userAgent)) return 'Linux';
  return 'Desktop';
}

export default function TagDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [user, setUser] = useState<User | null>(null);
  const [tag, setTag] = useState<any>(null);
  const [viewerData, setViewerData] = useState<any>(null);
  const [scans, setScans] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmAction, setConfirmAction] = useState<'suspend' | 'resume' | null>(null);

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadData() {
    try {
      const meData = await authApi.me();
      setUser(meData.user);

      const [tagData, scansData, alertsData] = await Promise.all([
        tagsApi.get(id),
        tagsApi.getScans(id),
        tagsApi.getAlerts(id),
      ]);
      setTag(tagData);
      setScans(scansData.scans || []);
      setAlerts(alertsData.alerts || []);

      if (tagData.status === 'ACTIVE') {
        try {
          const viewer = await tagsApi.getViewer(tagData.uuid);
          setViewerData(viewer);
        } catch {
          // Viewer data may not be available
        }
      }
    } catch {
      clearTokens();
      router.push('/login');
    } finally {
      setLoading(false);
    }
  }

  async function handleSuspend() {
    try {
      await tagsApi.suspend(id);
      toast.success('Tag suspendido');
      loadData();
    } catch (err: any) {
      toast.error(err.message || 'Error al suspender tag');
    } finally {
      setConfirmAction(null);
    }
  }

  async function handleResume() {
    try {
      await tagsApi.resume(id);
      toast.success('Tag reanudado');
      loadData();
    } catch (err: any) {
      toast.error(err.message || 'Error al reanudar tag');
    } finally {
      setConfirmAction(null);
    }
  }

  async function handleUnlockPin() {
    try {
      await tagsApi.unlockPin(id);
      toast.success('PIN desbloqueado');
      loadData();
    } catch (err: any) {
      toast.error(err.message || 'Error al desbloquear PIN');
    }
  }

  async function handleRenew(newPlan: PlanType) {
    try {
      await tagsApi.renewPlan(id, newPlan);
      toast.success(`Plan actualizado a ${PLAN_LABELS[newPlan]}`);
      loadData();
    } catch (err: any) {
      toast.error(err.message || 'Error al renovar plan');
    }
  }

  function copyLink() {
    if (!tag) return;
    navigator.clipboard.writeText(`${window.location.origin}/L/${tag.uuid}`);
    toast.success('Link copiado');
  }

  function openViewer() {
    if (!tag) return;
    window.open(`/L/${tag.uuid}`, '_blank');
  }

  if (loading || !user) return <PageLoader />;
  if (!tag) return null;

  const statusMessages: Record<TagStatus, { text: string; color: string }> = {
    VIRGIN: { text: 'Este tag aún no ha sido activado. Comparte el link con el cliente.', color: 'text-gray-400' },
    INCOMPLETE: { text: 'El cliente ha creado su PIN pero aún no completa sus datos.', color: 'text-amber-400' },
    ACTIVE: { text: 'Tag operativo. Los datos médicos están disponibles para paramédicos.', color: 'text-emerald-400' },
    SUSPENDED: { text: 'Tag dado de baja.', color: 'text-red-400' },
  };

  const isAdmin = user?.role === 'ADMIN';
  const msg = statusMessages[tag.status as TagStatus];

  return (
    <DashboardLayout user={user}>
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-4 min-w-0">
          <button
            onClick={() => router.back()}
            aria-label="Volver"
            className="p-2 text-gray-500 hover:text-gray-300 hover:bg-gray-700/50 rounded-lg transition-colors shrink-0 focus-visible:ring-2 focus-visible:ring-red-500 focus:outline-none"
          >
            <ArrowLeft className="w-5 h-5" aria-hidden="true" />
          </button>
          <div className="min-w-0">
            <h1 className="text-2xl font-bold text-gray-100">Detalle del Tag</h1>
            <p className="font-mono text-sm text-gray-500 truncate">{tag.uuid}</p>
          </div>
        </div>
        <StatusBadge status={tag.status} size="md" />
      </div>

      {/* Status Message */}
      <div className={`rounded-xl p-4 border mb-6 ${
        tag.status === 'VIRGIN' ? 'bg-gray-800/30 border-gray-700/50' :
        tag.status === 'INCOMPLETE' ? 'bg-amber-500/5 border-amber-500/20' :
        tag.status === 'ACTIVE' ? 'bg-emerald-500/5 border-emerald-500/20' :
        'bg-red-500/5 border-red-500/20'
      }`}>
        <div className="flex items-start gap-3">
          <Shield className={`w-5 h-5 mt-0.5 ${msg.color}`} />
          <p className={`text-sm ${msg.color}`}>{msg.text}</p>
        </div>
      </div>

      {/* Info Grid */}
      <div className="grid lg:grid-cols-3 gap-6 mb-6">
        {/* Tag Info */}
        <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-6">
          <h2 className="text-sm font-medium text-gray-400 mb-4">Información</h2>
          <div className="space-y-4">
            <div>
              <p className="text-xs text-gray-500 mb-1">Vendedor</p>
              <p className="text-sm text-gray-200 flex items-center gap-2">
                <UserIcon className="w-3.5 h-3.5 text-gray-500" />
                {tag.seller?.name || 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Creado</p>
              <p className="text-sm text-gray-200 flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5 text-gray-500" />
                {new Date(tag.createdAt).toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500 mb-1">Vistas</p>
                <p className="text-xl font-bold text-gray-200 flex items-center gap-2">
                  <Eye className="w-4 h-4 text-gray-500" />
                  {tag.viewCount}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Escaneos</p>
                <p className="text-xl font-bold text-gray-200 flex items-center gap-2">
                  <ScanLine className="w-4 h-4 text-gray-500" />
                  {tag.scanCount}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-6">
          <h2 className="text-sm font-medium text-gray-400 mb-4">Acciones</h2>
          <div className="space-y-2">
            <button
              onClick={copyLink}
              className="w-full flex items-center gap-3 px-4 py-3 bg-blue-500/10 text-blue-400 font-medium rounded-lg hover:bg-blue-500/20 transition-colors"
            >
              <Copy className="w-4 h-4" />
              Copiar Link
            </button>
            <button
              onClick={openViewer}
              className="w-full flex items-center gap-3 px-4 py-3 bg-emerald-500/10 text-emerald-400 font-medium rounded-lg hover:bg-emerald-500/20 transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              Abrir Viewer
            </button>
            {tag.status !== 'VIRGIN' && tag.status !== 'SUSPENDED' && isAdmin && (
              <button
                onClick={handleUnlockPin}
                className="w-full flex items-center gap-3 px-4 py-3 bg-amber-500/10 text-amber-400 font-medium rounded-lg hover:bg-amber-500/20 transition-colors"
              >
                <Unlock className="w-4 h-4" />
                Desbloquear PIN
              </button>
            )}
            {tag.status !== 'SUSPENDED' && isAdmin && (
              <button
                onClick={() => setConfirmAction('suspend')}
                className="w-full flex items-center gap-3 px-4 py-3 bg-red-500/10 text-red-400 font-medium rounded-lg hover:bg-red-500/20 transition-colors"
              >
                <Ban className="w-4 h-4" />
                Suspender Tag
              </button>
            )}
            {tag.status === 'SUSPENDED' && isAdmin && (
              <button
                onClick={() => setConfirmAction('resume')}
                className="w-full flex items-center gap-3 px-4 py-3 bg-emerald-500/10 text-emerald-400 font-medium rounded-lg hover:bg-emerald-500/20 transition-colors"
              >
                <Play className="w-4 h-4" />
                Reanudar Tag
              </button>
            )}
          </div>
        </div>

        {/* Medical Data Summary - solo admin */}
        {isAdmin && tag.status === 'ACTIVE' && viewerData?.medicalData && (
          <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-6">
            <h2 className="text-sm font-medium text-gray-400 mb-4">Datos Médicos</h2>
            <div className="space-y-3">
              {viewerData.medicalData.userName && (
                <div>
                  <p className="text-xs text-gray-500">Nombre</p>
                  <p className="text-sm text-gray-200">{viewerData.medicalData.userName}</p>
                </div>
              )}
              {viewerData.medicalData.bloodType && (
                <div>
                  <p className="text-xs text-gray-500">Tipo de Sangre</p>
                  <p className="text-sm text-gray-200">{viewerData.medicalData.bloodType}</p>
                </div>
              )}
              {viewerData.medicalData.allergies && (
                <div>
                  <p className="text-xs text-gray-500">Alergias</p>
                  <p className="text-sm text-gray-200">{viewerData.medicalData.allergies}</p>
                </div>
              )}
              {viewerData.medicalData.conditions && (
                <div>
                  <p className="text-xs text-gray-500">Condiciones</p>
                  <p className="text-sm text-gray-200">{viewerData.medicalData.conditions}</p>
                </div>
              )}
              {viewerData.medicalData.medications && (
                <div>
                  <p className="text-xs text-gray-500">Medicamentos</p>
                  <p className="text-sm text-gray-200">{viewerData.medicalData.medications}</p>
                </div>
              )}
              {viewerData.contacts && viewerData.contacts.length > 0 && (
                <div className="pt-3 border-t border-gray-700/50">
                  <p className="text-xs text-gray-500 mb-2">Contactos de Emergencia</p>
                  <div className="space-y-2">
                    {viewerData.contacts.map((contact: EmergencyContact, i: number) => (
                      <div key={i} className="text-sm">
                        <span className="text-gray-200">{contact.name}</span>
                        <span className="text-gray-500 mx-1">({contact.relationship})</span>
                        <span className="text-gray-400">{contact.phone}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Plan Info */}
      {isAdmin && (
        <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-6 mb-6">
          <h2 className="text-sm font-medium text-gray-400 mb-4">Plan y Vencimiento</h2>
          <div className="flex flex-wrap items-center gap-4 mb-4">
            <div>
              <p className="text-xs text-gray-500 mb-1">Plan actual</p>
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${PLAN_COLORS[tag.plan as PlanType]?.bg || 'bg-gray-100'} ${PLAN_COLORS[tag.plan as PlanType]?.text || 'text-gray-700'}`}>
                {PLAN_LABELS[tag.plan as PlanType] || tag.plan || 'N/A'}
              </span>
            </div>
            {tag.previousPlan && (
              <div>
                <p className="text-xs text-gray-500 mb-1">Plan anterior</p>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-amber-500/10 text-amber-400">
                  {PLAN_LABELS[tag.previousPlan as PlanType] || tag.previousPlan} (degradado)
                </span>
              </div>
            )}
            <div>
              <p className="text-xs text-gray-500 mb-1">Vencimiento</p>
              <p className="text-sm text-gray-200">
                {tag.expiresAt
                  ? new Date(tag.expiresAt).toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' })
                  : 'Sin activar'}
              </p>
            </div>
            {tag.expiresAt && (() => {
              const now = new Date();
              const exp = new Date(tag.expiresAt);
              const diffDays = Math.ceil((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
              return (
                <div>
                  <p className="text-xs text-gray-500 mb-1">Estado</p>
                  <p className={`text-sm font-medium ${diffDays > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {diffDays > 0 ? `${diffDays} días restantes` : 'Vencido'}
                  </p>
                </div>
              );
            })()}
          </div>

          <div className="border-t border-gray-700/50 pt-4 mt-4">
            <p className="text-xs text-gray-500 mb-3">Renovar / Cambiar plan</p>
            <div className="grid sm:grid-cols-3 gap-3">
              <button
                onClick={() => handleRenew('PRINCIPAL')}
                className="px-4 py-2.5 bg-gray-700/50 hover:bg-gray-700 text-gray-300 text-sm font-medium rounded-lg transition-colors"
              >
                Principal — $99/año
              </button>
              <button
                onClick={() => handleRenew('PRO')}
                className="px-4 py-2.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 text-sm font-medium rounded-lg transition-colors"
              >
                Pro — $299/año
              </button>
              <button
                onClick={() => handleRenew('ULTRA')}
                className="px-4 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-sm font-medium rounded-lg transition-colors"
              >
                Ultra — $449/año
              </button>
            </div>
            <p className="text-xs text-gray-600 mt-2">El nuevo año corre desde la fecha de renovación. Si el tag estaba degradado, se restaura el plan original.</p>
          </div>
        </div>
      )}

      {/* Scan History - solo admin */}
      {isAdmin && (
      <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-700/50">
          <h2 className="text-sm font-medium text-gray-400">Historial de Escaneos</h2>
        </div>
        {scans.length === 0 ? (
          <div className="px-6 py-8 text-center text-gray-500 text-sm">Sin escaneos registrados</div>
        ) : (
          <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[560px]">
            <thead>
              <tr className="border-b border-gray-700/50">
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ubicación</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Dispositivo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700/30">
              {scans.map((scan: any) => (
                <tr key={scan.id} className="hover:bg-gray-700/20">
                  <td className="px-6 py-3 text-gray-300 flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-gray-500" />
                    {new Date(scan.scannedAt).toLocaleDateString('es-MX', {
                      year: 'numeric', month: 'short', day: 'numeric',
                      hour: '2-digit', minute: '2-digit',
                    })}
                  </td>
                  <td className="px-6 py-3 text-gray-400 flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-gray-500" />
                    {scan.city || 'N/A'}{scan.country ? `, ${scan.country}` : ''}
                  </td>
                  <td className="px-6 py-3 text-gray-400 flex items-center gap-2">
                    <Smartphone className="w-3.5 h-3.5 text-gray-500" />
                    {parseDevice(scan.userAgent || '')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}
      </div>
      )}

      {/* Alert History - solo admin */}
      {isAdmin && (
      <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl overflow-hidden mt-6">
        <div className="px-6 py-4 border-b border-gray-700/50">
          <h2 className="text-sm font-medium text-gray-400 flex items-center gap-2">
            <Siren className="w-4 h-4" />
            Historial de Alertas
          </h2>
        </div>
        {alerts.length === 0 ? (
          <div className="px-6 py-8 text-center text-gray-500 text-sm">Sin alertas registradas</div>
        ) : (
          <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[640px]">
            <thead>
              <tr className="border-b border-gray-700/50">
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Origen</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contactos</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Resultado</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ubicación</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700/30">
              {alerts.map((alert: any) => (
                <tr key={alert.id} className="hover:bg-gray-700/20">
                  <td className="px-6 py-3 text-gray-300 flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-gray-500" />
                    {new Date(alert.sentAt).toLocaleDateString('es-MX', {
                      year: 'numeric', month: 'short', day: 'numeric',
                      hour: '2-digit', minute: '2-digit',
                    })}
                  </td>
                  <td className="px-6 py-3">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                      alert.senderType === 'OWNER'
                        ? 'bg-red-500/10 text-red-400'
                        : 'bg-blue-500/10 text-blue-400'
                    }`}>
                      {alert.senderType === 'OWNER' ? 'Dueño' : 'Rescatista'}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-gray-400 max-w-[200px] truncate">
                    {alert.contacts.join(', ')}
                  </td>
                  <td className="px-6 py-3">
                    <div className="flex items-center gap-2">
                      <span className="text-green-400 text-xs">{alert.successCount}✓</span>
                      {alert.failCount > 0 && (
                        <span className="text-red-400 text-xs">{alert.failCount}✗</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-3 text-gray-400 flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-gray-500" />
                    {alert.location?.address
                      || (alert.location?.lat != null && alert.location?.lng != null
                        ? `${alert.location.lat.toFixed(2)}, ${alert.location.lng.toFixed(2)}`
                        : 'N/A')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}
      </div>
      )}

      <Modal
        isOpen={confirmAction !== null}
        onClose={() => setConfirmAction(null)}
        title={confirmAction === 'suspend' ? 'Dar de baja tag' : 'Reanudar tag'}
        size="sm"
      >
        <p className="text-sm text-gray-300 mb-6">
          {confirmAction === 'suspend'
            ? '¿Dar de baja este tag? Esta acción no se puede deshacer.'
            : '¿Reanudar este tag? El tag volverá a estar activo.'}
        </p>
        <div className="flex gap-3">
          <button
            onClick={() => setConfirmAction(null)}
            className="flex-1 py-2.5 px-4 bg-gray-700/50 text-gray-300 font-medium rounded-lg hover:bg-gray-700 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={confirmAction === 'suspend' ? handleSuspend : handleResume}
            className={`flex-1 py-2.5 px-4 font-medium rounded-lg transition-colors ${
              confirmAction === 'suspend'
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white'
            }`}
          >
            {confirmAction === 'suspend' ? 'Suspender Tag' : 'Reanudar Tag'}
          </button>
        </div>
      </Modal>
    </DashboardLayout>
  );
}
