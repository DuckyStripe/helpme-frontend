'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authApi, metricsApi, clearTokens } from '@/lib/api';
import { toast } from '@/lib/toast';
import type { User } from '@/types';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import StatCard from '@/components/ui/StatCard';
import ActivationChart from '@/components/ui/ActivationChart';
import StatusBadge from '@/components/ui/StatusBadge';
import { CardSkeleton, PageLoader } from '@/components/ui/Skeleton';
import {
  QrCode, Activity, Users, ShieldCheck, Zap, ArrowUpRight,
  Clock, MapPin, Ban,
} from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [metrics, setMetrics] = useState<any>(null);
  const [period, setPeriod] = useState<'7d' | '30d' | '90d'>('7d');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (user?.role === 'ADMIN') loadMetrics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period, user]);

  async function loadData() {
    try {
      const meData = await authApi.me();
      setUser(meData.user);
      if (meData.user.role === 'VENDEDOR') {
        router.push('/dashboard/tags');
      }
    } catch {
      clearTokens();
      router.push('/login');
    } finally {
      setLoading(false);
    }
  }

  async function loadMetrics() {
    try {
      const data = await metricsApi.get(period);
      setMetrics(data);
    } catch (err: any) {
      toast.error(err.message || 'Error al cargar métricas');
    }
  }

  if (loading || !user) return <PageLoader />;
  if (user.role !== 'ADMIN') return null;

  const sc = metrics?.statusCounts || {};
  const totalActivations = metrics?.activationSeries?.reduce((sum: number, d: any) => sum + d.count, 0) || 0;

  return (
    <DashboardLayout user={user}>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-100">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Resumen general del sistema HelpMe</p>
      </div>

      {/* Stat Cards */}
      {metrics ? (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <StatCard label="Total Tags" value={metrics.totalTags} icon={QrCode} color="blue" />
          <StatCard label="Activos" value={sc.ACTIVE || 0} icon={ShieldCheck} color="emerald" />
          <StatCard label="Sin activar" value={sc.VIRGIN || 0} icon={Activity} color="gray" />
          <StatCard label="Suspendidos" value={sc.SUSPENDED || 0} icon={Ban} color="red" />
          <StatCard label="Vendedores" value={metrics.totalSellers} icon={Users} color="amber" />
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          {[...Array(5)].map((_, i) => <CardSkeleton key={i} />)}
        </div>
      )}

      {/* Chart + Quick Actions */}
      <div className="grid lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2">
          {metrics ? (
            <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-400">Escaneos</h3>
                  <p className="text-2xl font-bold text-gray-100 mt-1">{metrics.totalScans}</p>
                </div>
                <div className="flex bg-gray-700/50 rounded-lg p-0.5">
                  {(['7d', '30d', '90d'] as const).map(p => (
                    <button
                      key={p}
                      onClick={() => setPeriod(p)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                        period === p ? 'bg-red-600 text-white' : 'text-gray-400 hover:text-gray-200'
                      }`}
                    >
                      {p === '7d' ? '7 días' : p === '30d' ? '30 días' : '3 meses'}
                    </button>
                  ))}
                </div>
              </div>
              <ActivationChart data={metrics.activationSeries || []} period={period} />
            </div>
          ) : (
            <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-6">
              <div className="animate-pulse h-52 bg-gray-700/50 rounded-lg" />
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-6">
          <h3 className="text-sm font-medium text-gray-400 mb-4">Accesos rápidos</h3>
          <div className="space-y-2">
            <button
              onClick={() => router.push('/dashboard/tags')}
              className="w-full flex items-center justify-between px-4 py-3 bg-gray-700/30 hover:bg-gray-700/50 rounded-lg transition-colors group"
            >
              <div className="flex items-center gap-3">
                <QrCode className="w-4 h-4 text-gray-400 group-hover:text-red-400 transition-colors" />
                <span className="text-sm text-gray-300">Gestionar tags</span>
              </div>
              <ArrowUpRight className="w-4 h-4 text-gray-600 group-hover:text-gray-400 transition-colors" />
            </button>
            <button
              onClick={() => router.push('/dashboard/sellers')}
              className="w-full flex items-center justify-between px-4 py-3 bg-gray-700/30 hover:bg-gray-700/50 rounded-lg transition-colors group"
            >
              <div className="flex items-center gap-3">
                <Users className="w-4 h-4 text-gray-400 group-hover:text-red-400 transition-colors" />
                <span className="text-sm text-gray-300">Vendedores</span>
              </div>
              <ArrowUpRight className="w-4 h-4 text-gray-600 group-hover:text-gray-400 transition-colors" />
            </button>
            <button
              onClick={() => router.push('/dashboard/tags?action=create')}
              className="w-full flex items-center justify-between px-4 py-3 bg-red-600/10 hover:bg-red-600/20 rounded-lg transition-colors group"
            >
              <div className="flex items-center gap-3">
                <Zap className="w-4 h-4 text-red-400" />
                <span className="text-sm text-red-300">Crear tags</span>
              </div>
              <ArrowUpRight className="w-4 h-4 text-red-400/60 group-hover:text-red-400 transition-colors" />
            </button>
          </div>

          {/* Mini stats */}
          {metrics && (
            <div className="mt-6 pt-4 border-t border-gray-700/50 space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Activaciones ({period})</span>
                <span className="text-gray-200 font-medium">{totalActivations}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Tasa de activación</span>
                <span className="text-gray-200 font-medium">
                  {metrics.totalTags > 0 ? Math.round(((sc.ACTIVE || 0) / metrics.totalTags) * 100) : 0}%
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Activations */}
        <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-700/50">
            <h3 className="text-sm font-medium text-gray-400 flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Activaciones recientes
            </h3>
          </div>
          {metrics?.recentActivations?.length === 0 ? (
            <div className="px-6 py-8 text-center text-gray-500 text-sm">Sin activaciones recientes</div>
          ) : (
            <div className="divide-y divide-gray-700/30">
              {metrics?.recentActivations?.slice(0, 5).map((act: any, i: number) => (
                <div key={i} className="px-6 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <StatusBadge status={act.status} />
                    <span className="font-mono text-xs text-gray-400 truncate">{act.uuid.substring(0, 12)}...</span>
                  </div>
                  <div className="text-right ml-4">
                    <p className="text-xs text-gray-300">{act.sellerName}</p>
                    <p className="text-[10px] text-gray-600">{new Date(act.updatedAt).toLocaleDateString('es-MX')}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Scans */}
        <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-700/50">
            <h3 className="text-sm font-medium text-gray-400 flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Escaneos recientes
            </h3>
          </div>
          {metrics?.recentScans?.length === 0 ? (
            <div className="px-6 py-8 text-center text-gray-500 text-sm">Sin escaneos registrados</div>
          ) : (
            <div className="divide-y divide-gray-700/30">
              {metrics?.recentScans?.slice(0, 5).map((scan: any, i: number) => (
                <div key={i} className="px-6 py-3 flex items-center justify-between">
                  <div className="min-w-0">
                    <p className="text-xs text-gray-300">{scan.sellerName}</p>
                    <p className="font-mono text-[10px] text-gray-600 truncate">{scan.tagUuid.substring(0, 16)}...</p>
                  </div>
                  <div className="text-right ml-4">
                    <p className="text-xs text-gray-400 flex items-center gap-1 justify-end">
                      <Clock className="w-3 h-3" />
                      {new Date(scan.scannedAt).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}
                    </p>
                    <p className="text-[10px] text-gray-600">{scan.city || 'N/A'}, {scan.country || ''}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
