'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Activity, Check, Loader2, ArrowLeft, Zap, Star } from 'lucide-react';
import { isAuthenticated, plansApi, subscriptionApi, authApi } from '@/lib/api';
import { toast } from '@/lib/toast';

interface Plan {
  id: string;
  name: string;
  linksLimit: number;
  price: number;
}

export default function PlansPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [currentPlanId, setCurrentPlanId] = useState<string>('free');
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }

    if (searchParams.get('canceled') === 'true') {
      toast.error('Pago cancelado. Puedes intentarlo de nuevo cuando quieras.');
    }

    loadData();
  }, [router, searchParams]);

  async function loadData() {
    try {
      const [plansData, userData] = await Promise.all([
        plansApi.getPlans(),
        authApi.me(),
      ]);
      setPlans((plansData as any).plans ?? plansData);
      setCurrentPlanId(userData.subscription?.planId ?? 'free');
    } catch {
      toast.error('Error al cargar los planes');
    } finally {
      setLoading(false);
    }
  }

  async function handleUpgrade(plan: Plan) {
    setUpgrading(plan.id);
    try {
      const result = await subscriptionApi.checkout(plan.id);
      if (result.url) {
        window.location.href = result.url;
      } else {
        toast.error('No se pudo iniciar el pago. Intenta de nuevo.');
      }
    } catch (err: any) {
      toast.error(err.message || 'Error al procesar el pago');
    } finally {
      setUpgrading(false as any);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-red-600" />
      </div>
    );
  }

  const formatPrice = (price: number) => {
    if (price === 0) return 'Gratis';
    return `$${(price / 100).toFixed(0)} MXN/mes`;
  };

  const FEATURES: Record<string, string[]> = {
    free:      ['1 ficha de emergencia', 'Código QR incluido', 'Alerta WhatsApp + GPS'],
    basico:    ['1 ficha de emergencia', 'Código QR incluido', 'Alerta WhatsApp + GPS', 'Soporte por correo'],
    estandar:  ['3 fichas de emergencia', 'Código QR incluido', 'Alerta WhatsApp + GPS', 'Soporte por correo', 'Comparte con tu familia'],
    pro:       ['7 fichas de emergencia', 'Código QR incluido', 'Alerta WhatsApp + GPS', 'Soporte prioritario', 'Comparte con tu familia', 'Historial de escaneos'],
    flota:     ['15 fichas de emergencia', 'Código QR incluido', 'Alerta WhatsApp + GPS', 'Soporte prioritario', 'Ideal para flotas o empresas', 'Historial de escaneos', 'Dashboard grupal'],
  };

  const POPULAR = 'estandar';

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="bg-red-600 p-2 rounded-xl">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <span className="font-bold text-xl text-gray-900">HelpMe</span>
          </Link>
          <Link href="/dashboard" className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors text-sm font-medium">
            <ArrowLeft className="w-4 h-4" />
            Volver al dashboard
          </Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-12">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Elige tu plan</h1>
          <p className="text-gray-600">Protege a más personas con más fichas médicas de emergencia</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
          {plans.filter((p) => p.id !== 'free').map((plan) => {
            const isCurrent = plan.id === currentPlanId;
            const isPaid = plan.price > 0;
            const isPopular = plan.id === POPULAR;
            const features = FEATURES[plan.id] ?? [];

            return (
              <div
                key={plan.id}
                className={`bg-white rounded-2xl border-2 p-6 flex flex-col transition-shadow hover:shadow-md relative ${
                  isPopular
                    ? 'border-red-500 shadow-lg shadow-red-100'
                    : isCurrent
                    ? 'border-gray-400'
                    : 'border-gray-100'
                }`}
              >
                {isPopular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-red-600 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full flex items-center gap-1">
                      <Star className="w-3 h-3" /> Más popular
                    </span>
                  </div>
                )}

                {isCurrent && !isPopular && (
                  <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">
                    Plan actual
                  </span>
                )}

                <h2 className="text-base font-extrabold text-gray-900 mb-1 mt-1">{plan.name}</h2>
                <p className="text-2xl font-black text-gray-900">{formatPrice(plan.price)}</p>
                <p className="text-xs text-gray-400 mb-5">
                  {plan.linksLimit} {plan.linksLimit === 1 ? 'ficha médica' : 'fichas médicas'}
                </p>

                <ul className="space-y-2 flex-1 mb-6">
                  {features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-xs text-gray-700">
                      <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                      {f}
                    </li>
                  ))}
                </ul>

                {isCurrent ? (
                  <button disabled className="w-full py-2.5 rounded-xl bg-gray-100 text-gray-400 font-bold text-sm cursor-not-allowed">
                    Plan actual
                  </button>
                ) : (
                  <button
                    onClick={() => handleUpgrade(plan)}
                    disabled={!!upgrading || !isPaid}
                    className={`w-full py-2.5 rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-2 ${
                      isPopular
                        ? 'bg-red-600 hover:bg-red-700 text-white disabled:bg-gray-200 disabled:text-gray-400'
                        : 'bg-gray-900 hover:bg-gray-700 text-white disabled:bg-gray-200 disabled:text-gray-400'
                    }`}
                  >
                    {upgrading === plan.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Zap className="w-4 h-4" />
                        {isPaid ? 'Suscribirme' : 'Gratis'}
                      </>
                    )}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
