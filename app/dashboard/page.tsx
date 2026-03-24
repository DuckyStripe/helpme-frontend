'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Activity, Plus, Loader2, ExternalLink, Copy, LogOut, Trash2, Eye } from 'lucide-react';
import { isAuthenticated, authApi, linksApi } from '@/lib/api';
import { toast } from '@/lib/toast';

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [subscription, setSubscription] = useState<any>(null);
  const [links, setLinks] = useState<any[]>([]);
  const [usage, setUsage] = useState<any>(null);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }
    loadData();
  }, [router]);

  async function loadData() {
    try {
      const [userData, linksData] = await Promise.all([
        authApi.me(),
        linksApi.getLinks().catch(() => ({ links: [], usage: { total: 0, limit: 1, remaining: 1, used: 0 } })),
      ]);
      setUser(userData.user);
      setSubscription(userData.subscription);
      setLinks(linksData.links || []);
      setUsage(linksData.usage);
    } catch {
      router.push('/login');
    } finally {
      setLoading(false);
    }
  }

  async function createLink() {
    setCreating(true);
    try {
      const newLink = await linksApi.createLink('Mi Ficha');
      router.push(`/dashboard/links/${newLink.id}`);
    } catch (err: any) {
      toast.error(err.message || 'Error al crear ficha');
    } finally {
      setCreating(false);
    }
  }

  async function deleteLink(id: string) {
    if (!confirm('¿Estás seguro de eliminar esta ficha?')) return;
    setDeleting(id);
    try {
      await linksApi.deleteLink(id);
      setLinks(links.filter((l) => l.id !== id));
    } catch (err: any) {
      toast.error(err.message || 'Error al eliminar');
    } finally {
      setDeleting(null);
    }
  }

  async function copyLink(token: string) {
    const url = `${window.location.origin}/l/${token}`;
    await navigator.clipboard.writeText(url);
    toast.success('¡Link copiado al portapapeles!');
  }

  async function logout() {
    await authApi.logout();
    router.push('/');
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-red-600" />
      </div>
    );
  }

  const canCreate = !usage || usage.remaining > 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="bg-red-600 p-2 rounded-xl">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <span className="font-bold text-xl text-gray-900">HelpMe</span>
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-gray-600 text-sm">{user?.email}</span>
            <button onClick={logout} className="text-gray-500 hover:text-red-600 transition-colors">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900">Mis Fichas Médicas</h1>
            <p className="text-gray-600">Gestiona tus fichas de emergencia</p>
          </div>
          <div className="flex items-center gap-4">
            {usage && (
              <div className="bg-gray-100 px-4 py-2 rounded-lg">
                <span className="font-bold text-gray-900">{usage.used}/{usage.limit}</span>
                <span className="text-gray-500 text-sm ml-1">fichas</span>
              </div>
            )}
            <button
              onClick={createLink}
              disabled={!canCreate || creating}
              className="bg-red-600 hover:bg-red-700 disabled:bg-gray-300 text-white px-4 py-2 rounded-lg font-bold transition-colors flex items-center gap-2"
            >
              {creating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
              Nueva Ficha
            </button>
          </div>
        </div>

        {subscription && subscription.status !== 'active' && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-8">
            <p className="text-amber-800 font-medium">
              Tu suscripción está inactiva. <Link href="/plans" className="underline font-bold">Actualiza tu plan</Link> para crear más fichas.
            </p>
          </div>
        )}

        {links.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
            <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Activity className="w-8 h-8 text-gray-400" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">No tienes fichas yet</h2>
            <p className="text-gray-600 mb-6">Crea tu primera ficha médica de emergencia</p>
            <button
              onClick={createLink}
              disabled={!canCreate || creating}
              className="bg-red-600 hover:bg-red-700 disabled:bg-gray-300 text-white px-6 py-3 rounded-xl font-bold transition-colors inline-flex items-center gap-2"
            >
              {creating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
              Crear Mi Primera Ficha
            </button>
          </div>
        ) : (
          <div className="grid gap-4">
            {links.map((link) => (
              <div key={link.id} className="bg-white rounded-xl shadow-sm p-6 flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-bold text-gray-900">{link.name}</h3>
                    <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-0.5 rounded">
                      {link.viewCount} vistas
                    </span>
                  </div>
                  <p className="text-gray-500 text-sm font-mono">{link.token}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Link
                    href={`/dashboard/links/${link.id}`}
                    className="bg-gray-100 hover:bg-gray-200 text-gray-700 p-2 rounded-lg transition-colors"
                    title="Editar"
                  >
                    <Eye className="w-5 h-5" />
                  </Link>
                  <Link
                    href={`/l/${link.token}`}
                    target="_blank"
                    className="bg-gray-100 hover:bg-gray-200 text-gray-700 p-2 rounded-lg transition-colors"
                    title="Ver"
                  >
                    <ExternalLink className="w-5 h-5" />
                  </Link>
                  <button
                    onClick={() => copyLink(link.token)}
                    className="bg-gray-100 hover:bg-gray-200 text-gray-700 p-2 rounded-lg transition-colors"
                    title="Copiar link"
                  >
                    <Copy className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => deleteLink(link.id)}
                    disabled={deleting === link.id}
                    className="bg-gray-100 hover:bg-red-100 text-gray-700 hover:text-red-600 p-2 rounded-lg transition-colors"
                    title="Eliminar"
                  >
                    {deleting === link.id ? <Loader2 className="w-5 h-5 animate-spin" /> : <Trash2 className="w-5 h-5" />}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
