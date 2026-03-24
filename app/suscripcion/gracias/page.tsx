'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, Loader2, Activity, ArrowRight } from 'lucide-react';
import { isAuthenticated, authApi } from '@/lib/api';

export default function GraciasPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [planName, setPlanName] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }
    loadSubscription();
  }, [router]);

  async function loadSubscription() {
    try {
      const userData = await authApi.me();
      setPlanName(userData.subscription?.planName ?? null);
    } catch {
      // No crítico — igual mostramos la página
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-red-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md text-center">

        <div className="bg-white rounded-3xl shadow-xl p-10 flex flex-col items-center gap-6">
          {/* Ícono animado */}
          <div className="relative">
            <div className="absolute inset-0 bg-emerald-400 rounded-full animate-ping opacity-20" />
            <div className="relative bg-emerald-100 p-5 rounded-full">
              <CheckCircle className="w-12 h-12 text-emerald-600" />
            </div>
          </div>

          {/* Texto principal */}
          <div className="space-y-2">
            <h1 className="text-2xl font-extrabold text-gray-900">
              ¡Pago exitoso!
            </h1>
            {planName && (
              <p className="text-gray-500 text-sm">
                Tu plan <span className="font-bold text-gray-700">{planName}</span> ya está activo.
              </p>
            )}
            <p className="text-gray-500 text-sm">
              MercadoPago puede tardar unos minutos en confirmar la suscripción.
              Si no ves los cambios de inmediato, recarga el dashboard.
            </p>
          </div>

          {/* CTA */}
          <Link
            href="/dashboard"
            className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            Ir a mi dashboard
            <ArrowRight className="w-5 h-5" />
          </Link>

          <Link
            href="/plans"
            className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
          >
            Ver todos los planes
          </Link>
        </div>

        {/* Branding */}
        <div className="mt-6 flex items-center justify-center gap-2 text-gray-400">
          <div className="bg-red-600 p-1.5 rounded-lg">
            <Activity className="w-4 h-4 text-white" />
          </div>
          <span className="text-sm font-bold">HelpMe</span>
        </div>

      </div>
    </div>
  );
}
