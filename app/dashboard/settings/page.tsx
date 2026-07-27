'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authApi, settingsApi } from '@/lib/api';
import { toast } from '@/lib/toast';
import type { User } from '@/types';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { PageLoader } from '@/components/ui/Skeleton';
import { MessageCircle, Loader2, Save, Eye, EyeOff, CheckCircle2, Wifi, AlertTriangle, KeyRound } from 'lucide-react';

export default function SettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const [baseUrl, setBaseUrl] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [hasApiKey, setHasApiKey] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [generatingKey, setGeneratingKey] = useState(false);
  const [revealingKey, setRevealingKey] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null);

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
      loadSettings();
    } catch {
      router.push('/login');
    }
  }

  async function loadSettings() {
    setLoading(true);
    try {
      const data = await settingsApi.getOpenwa();
      setBaseUrl(data.baseUrl || '');
      setSessionId(data.sessionId || '');
      setHasApiKey(data.hasApiKey);
      setUpdatedAt(data.updatedAt);
    } catch (err: any) {
      toast.error(err.message || 'Error al cargar la configuración');
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!baseUrl.trim() || !sessionId.trim()) {
      toast.error('La URL base y el ID de sesión son obligatorios');
      return;
    }
    if (!hasApiKey && !apiKey.trim()) {
      toast.error('La API Key es obligatoria para poder enviar alertas');
      return;
    }
    setSaving(true);
    setTestResult(null);
    try {
      const data = await settingsApi.updateOpenwa({
        baseUrl: baseUrl.trim(),
        sessionId: sessionId.trim(),
        apiKey: apiKey.trim() || undefined,
      });
      setHasApiKey(data.hasApiKey);
      setUpdatedAt(data.updatedAt);
      setApiKey('');
      toast.success('Configuración de OpenWA actualizada');
    } catch (err: any) {
      toast.error(err.message || 'Error al guardar la configuración');
    } finally {
      setSaving(false);
    }
  }

  async function handleTest() {
    setTesting(true);
    setTestResult(null);
    try {
      const result = await settingsApi.testOpenwa();
      setTestResult(result);
    } catch (err: any) {
      setTestResult({ ok: false, message: err.message || 'No se pudo probar la conexión' });
    } finally {
      setTesting(false);
    }
  }

  async function handleGenerateKey() {
    setGeneratingKey(true);
    setTestResult(null);
    try {
      const result = await settingsApi.generateOpenwaKey();
      if (result.ok && result.apiKey) {
        setApiKey(result.apiKey);
        setTestResult({ ok: true, message: 'Nueva API Key generada. Guárdala inmediatamente antes de cambiar de página.' });
      } else {
        setTestResult({ ok: false, message: result.message || 'No se pudo generar la API Key' });
      }
    } catch (err: any) {
      setTestResult({ ok: false, message: err.message || 'No se pudo generar la API Key' });
    } finally {
      setGeneratingKey(false);
    }
  }

  async function handleRevealKey() {
    setRevealingKey(true);
    setTestResult(null);
    try {
      const result = await settingsApi.revealOpenwaKey();
      if (result.ok && result.apiKey) {
        setApiKey(result.apiKey);
        setShowApiKey(true);
        setTestResult({ ok: true, message: 'API Key obtenida. Cópiala ahora.' });
      } else {
        setTestResult({ ok: false, message: result.message || 'No hay API Key configurada' });
      }
    } catch (err: any) {
      setTestResult({ ok: false, message: err.message || 'No se pudo obtener la API Key' });
    } finally {
      setRevealingKey(false);
    }
  }

  function formatDate(dateStr: string | null) {
    if (!dateStr) return 'Nunca';
    return new Date(dateStr).toLocaleString('es-MX', {
      year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
    });
  }

  if (loading && !user) return <PageLoader />;
  if (!user) return null;

  return (
    <DashboardLayout user={user}>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-100">Configuración</h1>
        <p className="text-sm text-gray-500 mt-1">
          Ajustes de infraestructura que no requieren un redeploy
        </p>
      </div>

      <div className="bg-gray-800/30 border border-gray-700/50 rounded-xl p-6 max-w-2xl">
        <div className="flex items-start gap-3 mb-6">
          <div className="w-10 h-10 bg-green-600/10 rounded-lg flex items-center justify-center flex-shrink-0">
            <MessageCircle className="w-5 h-5 text-green-400" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-gray-100">Sesión de WhatsApp (OpenWA)</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              El backend envía las alertas de emergencia usando esta sesión. Si la sesión se cae o
              se reemplaza el número, cambia el ID aquí — se aplica de inmediato, sin necesidad de
              hacer rebuild.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="w-6 h-6 animate-spin text-gray-500" />
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">URL base de OpenWA</label>
              <input
                type="text"
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
                placeholder="https://openwa.codelabs.com.mx"
                autoComplete="off"
                className="w-full px-4 py-2.5 bg-gray-800/50 border border-gray-700/50 rounded-lg text-gray-200 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-red-500/50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">ID de sesión</label>
              <input
                type="text"
                value={sessionId}
                onChange={(e) => setSessionId(e.target.value)}
                placeholder="73fc17b3-1aa1-426a-89a1-fe7655cd9a7f"
                autoComplete="off"
                className="w-full px-4 py-2.5 bg-gray-800/50 border border-gray-700/50 rounded-lg text-gray-200 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-red-500/50 font-mono text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                API Key <span className="text-red-400">*</span>
                {hasApiKey && (
                  <span className="ml-2 inline-flex items-center gap-1 text-xs text-green-400 font-normal">
                    <CheckCircle2 className="w-3.5 h-3.5" /> configurada
                  </span>
                )}
              </label>
              <div className="relative">
                <input
                  type={showApiKey ? 'text' : 'password'}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder={hasApiKey ? 'Dejar vacío para no cambiarla' : 'Requerida por OpenWA para enviar mensajes'}
                  autoComplete="off"
                  className="w-full px-4 py-2.5 pr-11 bg-gray-800/50 border border-gray-700/50 rounded-lg text-gray-200 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-red-500/50 font-mono text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                  aria-label={showApiKey ? 'Ocultar clave' : 'Mostrar clave'}
                >
                  {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <div className="flex items-center gap-2 mt-1.5">
                <p className="text-xs text-gray-500">
                  Obligatoria: OpenWA requiere esta key en cada llamada.
                </p>
                {hasApiKey && (
                  <button
                    type="button"
                    onClick={handleRevealKey}
                    disabled={revealingKey}
                    className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Revelar la API Key guardada en la base de datos"
                  >
                    {revealingKey ? <Loader2 className="w-3 h-3 animate-spin" /> : <Eye className="w-3 h-3" />}
                    {revealingKey ? 'Obteniendo…' : 'Revelar guardada'}
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleGenerateKey}
                  disabled={generatingKey || !hasApiKey}
                  className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Generar nueva API Key desde el portal de OpenWA"
                >
                  {generatingKey ? <Loader2 className="w-3 h-3 animate-spin" /> : <KeyRound className="w-3 h-3" />}
                  {generatingKey ? 'Generando…' : 'Generar desde portal'}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1.5">
                Obligatoria: OpenWA requiere esta key en cada llamada (además de la URL base y el ID
                de sesión). Por seguridad nunca se muestra una vez guardada; deja el campo vacío en
                futuras ediciones para conservar la que ya está configurada.
              </p>
            </div>

            {testResult && (
              <div
                className={`rounded-lg p-3 flex items-start gap-2 text-sm ${
                  testResult.ok
                    ? 'bg-green-600/10 border border-green-600/30 text-green-400'
                    : 'bg-red-600/10 border border-red-600/30 text-red-400'
                }`}
              >
                {testResult.ok ? (
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                )}
                <span>{testResult.message}</span>
              </div>
            )}

            <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-gray-500">Última actualización: {formatDate(updatedAt)}</p>
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={handleTest}
                  disabled={testing}
                  className="flex items-center gap-2 px-4 py-2.5 bg-gray-700/50 text-gray-200 text-sm font-medium rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50"
                >
                  {testing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wifi className="w-4 h-4" />}
                  Probar conexión
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-2 px-4 py-2.5 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Guardar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
