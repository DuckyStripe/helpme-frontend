'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Activity, Shield, Phone, AlertTriangle, Heart, Users, ChevronRight } from 'lucide-react';
import { isAuthenticated, plansApi } from '@/lib/api';

const FEATURES = [
  { icon: Shield, title: 'Datos Médicos', desc: 'Almacena tu tipo de sangre, alergias y condiciones' },
  { icon: Phone, title: 'Contactos de Emergencia', desc: 'Notifica a tus familiares instantly' },
  { icon: AlertTriangle, title: 'Alertas GPS', desc: 'Comparte tu ubicación en emergencias' },
  { icon: Heart, title: 'Donador de Órganos', desc: 'Indica tu preferencia para donación' },
];

export default function LandingPage() {
  const router = useRouter();
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isAuthenticated()) {
      router.push('/dashboard');
      return;
    }
    loadPlans();
  }, [router]);

  async function loadPlans() {
    try {
      const data = await plansApi.getPlans();
      setPlans(data.plans || []);
    } catch {
      setPlans([]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <header className="bg-white shadow-sm">
        <nav className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-red-600 p-2 rounded-xl">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <span className="font-bold text-xl text-gray-900">HelpMe</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-gray-600 hover:text-gray-900 font-medium">
              Iniciar Sesión
            </Link>
            <Link href="/register" className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors">
              Crear Cuenta
            </Link>
          </div>
        </nav>
      </header>

      <main>
        <section className="max-w-6xl mx-auto px-4 py-20 text-center">
          <div className="inline-flex items-center gap-2 bg-red-100 text-red-700 px-4 py-2 rounded-full text-sm font-bold mb-6">
            <AlertTriangle className="w-4 h-4" />
            Para motociclistas
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold text-gray-900 mb-6 leading-tight">
            Tu Ficha Médica<br />
            <span className="text-red-600">Siempre Contigo</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-10">
            En caso de accidente, los servicios de emergencia podrán escanear tu código QR 
            y acceder a tu información médica vital al instante.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register" className="bg-red-600 hover:bg-red-700 text-white px-8 py-4 rounded-xl font-bold text-lg transition-all inline-flex items-center justify-center gap-2 shadow-lg shadow-red-600/20">
              Crear Mi Ficha Gratis
              <ChevronRight className="w-5 h-5" />
            </Link>
            <Link href="/l/demo" className="bg-white hover:bg-gray-50 text-gray-700 px-8 py-4 rounded-xl font-bold text-lg transition-all border border-gray-200 inline-flex items-center justify-center gap-2">
              Ver Demo
            </Link>
          </div>
        </section>

        <section className="bg-white py-20">
          <div className="max-w-6xl mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-extrabold text-gray-900 mb-4">¿Por qué HelpMe?</h2>
              <p className="text-gray-600 max-w-xl mx-auto">
                Diseñado específicamente para motociclistas que circulan por la ciudad
              </p>
            </div>
            <div className="grid md:grid-cols-4 gap-8">
              {FEATURES.map((f, i) => (
                <div key={i} className="text-center p-6 rounded-2xl bg-gray-50 border border-gray-100">
                  <div className="bg-red-100 w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <f.icon className="w-7 h-7 text-red-600" />
                  </div>
                  <h3 className="font-bold text-gray-900 mb-2">{f.title}</h3>
                  <p className="text-gray-600 text-sm">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20">
          <div className="max-w-6xl mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-extrabold text-gray-900 mb-4">Planes Simples</h2>
              <p className="text-gray-600">Elige el plan que mejor se adapte a tus necesidades</p>
            </div>
            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {loading ? (
                <div className="col-span-3 text-center py-12 text-gray-500">Cargando planes...</div>
              ) : plans.length === 0 ? (
                <>
                  <div className="bg-white rounded-2xl p-8 border-2 border-gray-200">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Free</h3>
                    <div className="text-4xl font-extrabold text-gray-900 mb-4">$0<span className="text-lg font-normal text-gray-500">/mes</span></div>
                    <ul className="space-y-3 text-left mb-8">
                      <li className="flex items-center gap-2 text-gray-600"><ChevronRight className="w-4 h-4 text-green-500" /> 1 ficha médica</li>
                      <li className="flex items-center gap-2 text-gray-600"><ChevronRight className="w-4 h-4 text-green-500" /> Datos básicos</li>
                    </ul>
                    <Link href="/register" className="block text-center bg-gray-900 hover:bg-gray-800 text-white px-6 py-3 rounded-xl font-bold transition-colors">
                      Empezar Gratis
                    </Link>
                  </div>
                </>
              ) : (
                plans.map((plan: any) => (
                  <div key={plan.id} className={`bg-white rounded-2xl p-8 border-2 ${plan.popular ? 'border-red-600 shadow-xl shadow-red-600/10' : 'border-gray-200'}`}>
                    {plan.popular && <span className="inline-block bg-red-600 text-white text-xs font-bold px-3 py-1 rounded-full mb-4">Más Popular</span>}
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                    <div className="text-4xl font-extrabold text-gray-900 mb-4">${plan.price}<span className="text-lg font-normal text-gray-500">/mes</span></div>
                    <ul className="space-y-3 text-left mb-8">
                      <li className="flex items-center gap-2 text-gray-600"><ChevronRight className="w-4 h-4 text-green-500" /> {plan.linksLimit} fichas médicas</li>
                      {plan.features?.map((feature: string, i: number) => (
                        <li key={i} className="flex items-center gap-2 text-gray-600"><ChevronRight className="w-4 h-4 text-green-500" /> {feature}</li>
                      ))}
                    </ul>
                    <Link href="/register" className={`block text-center px-6 py-3 rounded-xl font-bold transition-colors ${plan.popular ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-gray-900 hover:bg-gray-800 text-white'}`}>
                      Empezar
                    </Link>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>

        <section className="bg-red-600 py-20">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <Users className="w-16 h-16 text-red-200 mx-auto mb-6" />
            <h2 className="text-3xl font-extrabold text-white mb-4">¿Listo para protegerte?</h2>
            <p className="text-red-100 text-lg mb-8">
              Crea tu ficha médica en menos de 2 minutos y compártela con tus seres queridos.
            </p>
            <Link href="/register" className="inline-flex items-center gap-2 bg-white text-red-600 px-8 py-4 rounded-xl font-bold text-lg hover:bg-red-50 transition-colors">
              Crear Mi Ficha Ahora
            </Link>
          </div>
        </section>
      </main>

      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="bg-red-600 p-2 rounded-xl">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl text-white">HelpMe</span>
          </div>
          <p className="text-sm">© 2024 HelpMe. Todos los derechos reservados.</p>
        </div>
      </footer>
    </div>
  );
}
