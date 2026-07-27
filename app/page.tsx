'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { isAuthenticated } from '@/lib/api';
import {
  Shield,
  Activity,
  MapPin,
  QrCode,
  Nfc,
  Lock,
  Smartphone,
  Database,
  RefreshCw,
  HardHat,
  ChevronDown,
  ChevronUp,
  MessageCircle,
  AlertTriangle,
  CheckCircle2,
  Cross,
  User,
  Phone,
  FileText,
  Siren,
  Unlock,
  Hand,
  HeartPulse,
  BadgeCheck,
} from 'lucide-react';

const WHATSAPP_NUMBER = '525530541062';
const WHATSAPP_MESSAGE = encodeURIComponent('Hola, quiero comprar mi paquete HelpMe 🏍️');
const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}?text=${WHATSAPP_MESSAGE}`;

function FloatingWhatsAppButton() {
  return (
    <a
      href={WHATSAPP_URL}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-50 flex items-center justify-center w-14 h-14 bg-green-500 rounded-full shadow-lg hover:bg-green-600 hover:scale-105 transition-[transform,background-color] duration-200 focus:outline-none focus:ring-4 focus:ring-green-300"
      aria-label="Contactar por WhatsApp"
    >
      <MessageCircle className="w-7 h-7 text-white" />
    </a>
  );
}

function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);

  const navLinks = [
    { href: '#problema', label: 'Problema' },
    { href: '#solucion', label: 'Solución' },
    { href: '#alerta-sos', label: 'Alerta SOS' },
    { href: '#como-funciona', label: 'Cómo Funciona' },
    { href: '#beneficios', label: 'Beneficios' },
    { href: '#precio', label: 'Precio' },
    { href: '#faq', label: 'FAQ' },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-white/90 backdrop-blur-md border-b border-gray-100">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
        <a href="#" className="flex items-center gap-2 group" aria-label="HelpMe - Inicio">
          <div className="flex items-center justify-center w-9 h-9 bg-red-600 rounded-lg group-hover:bg-red-700 transition-colors">
            <Cross className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold text-gray-900">HelpMe</span>
        </a>

        <nav className="hidden lg:flex items-center gap-6" aria-label="Navegación principal">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-gray-600 hover:text-red-600 transition-colors"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="lg:hidden inline-flex items-center justify-center w-10 h-10 rounded-lg hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500"
          aria-label="Abrir menú"
          aria-expanded={mobileOpen}
        >
          <svg className="w-6 h-6 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            {mobileOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {mobileOpen && (
        <div className="lg:hidden bg-white border-t border-gray-100">
          <nav className="max-w-6xl mx-auto px-4 py-4 flex flex-col gap-2" aria-label="Navegación móvil">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="px-4 py-3 text-base font-medium text-gray-700 hover:text-red-600 hover:bg-gray-50 rounded-lg transition-colors"
              >
                {link.label}
              </a>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}

function HeroSection() {
  return (
    <section className="relative pt-28 pb-20 sm:pt-36 sm:pb-28 bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 overflow-hidden">
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-red-600 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-red-500 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-600/20 border border-red-500/30 rounded-full mb-8">
          <AlertTriangle className="w-4 h-4 text-red-400" />
          <span className="text-sm font-medium text-red-300">Identificación de emergencia para bikers</span>
        </div>

        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white mb-6 leading-tight">
          En un accidente, los primeros
          <span className="block text-red-500">minutos son vitales</span>
        </h1>

        <p className="text-lg sm:text-xl text-gray-300 max-w-2xl mx-auto mb-10 leading-relaxed">
          HelpMe lleva tus datos médicos siempre contigo. Sin app. Sin registro. Solo escanea.
        </p>

        <a
          href={WHATSAPP_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-3 px-8 py-4 bg-red-600 text-white font-bold text-lg rounded-xl hover:bg-red-700 hover:scale-105 transition-[transform,background-color] duration-200 shadow-lg shadow-red-600/30 focus:outline-none focus:ring-4 focus:ring-red-400 focus:ring-offset-2 focus:ring-offset-gray-900"
        >
          <MessageCircle className="w-5 h-5" />
          Quiero mi HelpMe
        </a>

        <div className="mt-16 grid grid-cols-3 gap-6 max-w-lg mx-auto">
          {[
            { icon: Nfc, label: 'NFC' },
            { icon: QrCode, label: 'QR' },
            { icon: Shield, label: 'Cifrado' },
          ].map(({ icon: Icon, label }) => (
            <div key={label} className="flex flex-col items-center gap-2">
              <div className="flex items-center justify-center w-12 h-12 bg-white/10 rounded-xl">
                <Icon className="w-6 h-6 text-red-400" />
              </div>
              <span className="text-sm font-medium text-gray-400">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ProblemSection() {
  return (
    <section id="problema" className="py-20 sm:py-28 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-6">
            Estás inconsciente. El paramédico
            <span className="text-red-600"> no sabe nada de ti.</span>
          </h2>
          <p className="text-lg text-gray-600 leading-relaxed">
            No saben tu tipo de sangre, a qué eres alérgico, qué medicamentos tomas ni a quién llamar. Cada segundo cuenta y la información no está disponible.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          {[
            {
              icon: Database,
              title: 'Sin tipo de sangre registrado',
            },
            {
              icon: Phone,
              title: 'Sin contacto de emergencia localizable',
            },
            {
              icon: FileText,
              title: 'Sin historial médico disponible',
            },
          ].map(({ icon: Icon, title }) => (
            <div
              key={title}
              className="bg-red-50 border border-red-100 rounded-2xl p-8 text-center hover:shadow-lg transition-shadow duration-300"
            >
              <div className="inline-flex items-center justify-center w-14 h-14 bg-red-100 rounded-xl mb-6">
                <Icon className="w-7 h-7 text-red-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">{title}</h3>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function SolutionSection() {
  return (
    <section id="solucion" className="py-20 sm:py-28 bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-100 rounded-2xl mb-8">
            <CheckCircle2 className="w-8 h-8 text-emerald-600" />
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-6">
            HelpMe lo resuelve en segundos
          </h2>
          <p className="text-lg text-gray-600 leading-relaxed">
            Un paquete con tecnología NFC y QR que cualquier rescatista puede escanear para ver tus datos médicos al instante. Sin app, sin registro, sin internet.
          </p>
          <p className="text-base text-gray-500 leading-relaxed mt-4">
            Tu perfil incluye tipo de sangre, alergias, medicamentos, CURP, NSS, clínica del IMSS/UMF, antecedentes heredofamiliares, donación de órganos y foto de identificación. Si no cuentas con seguro médico, te canalizamos automáticamente a la red pública de salud más cercana.
          </p>
        </div>

        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8 sm:p-12 max-w-3xl mx-auto">
          <h3 className="text-xl font-bold text-gray-900 mb-8 text-center">Contenido del paquete</h3>
          <div className="grid sm:grid-cols-2 gap-6">
            {[
              { icon: QrCode, text: 'Tarjeta NFC con QR impreso' },
              { icon: HardHat, text: 'Pegatina NFC para tu casco' },
              { icon: MapPin, text: 'Sticker de ubicación para el NFC' },
              { icon: FileText, text: 'Tarjeta de instrucciones' },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                <div className="flex items-center justify-center w-10 h-10 bg-red-100 rounded-lg flex-shrink-0">
                  <Icon className="w-5 h-5 text-red-600" />
                </div>
                <span className="font-medium text-gray-900">{text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function RescuerAlertSection() {
  const steps = [
    {
      icon: QrCode,
      title: 'El rescatista escanea',
      description: 'Cualquier persona que te encuentre, aunque no te conozca, escanea tu NFC o QR.',
    },
    {
      icon: Hand,
      title: 'Mantiene presionado el botón de alerta',
      description: 'Confirmación de larga duración: evita alertas falsas o accidentales.',
    },
    {
      icon: MessageCircle,
      title: 'HelpMe avisa a tus contactos',
      description: 'Enviamos WhatsApp con tu ubicación en tiempo real desde un número de HelpMe, no del rescatista.',
    },
  ];

  return (
    <section id="alerta-sos" className="py-20 sm:py-28 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-2xl mb-8">
            <Siren className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-6">
            Cualquiera puede alertar a tus contactos, sin dar su número
          </h2>
          <p className="text-lg text-gray-600 leading-relaxed">
            No solo tú recibes avisos: si un rescatista te encuentra, puede notificar a toda tu red de emergencia en segundos con tu ubicación exacta. Disponible en planes Pro y Ultra.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {steps.map(({ icon: Icon, title, description }) => (
            <div
              key={title}
              className="bg-gray-50 border border-gray-100 rounded-2xl p-8 text-center hover:shadow-lg transition-shadow duration-300"
            >
              <div className="inline-flex items-center justify-center w-14 h-14 bg-red-600 rounded-xl mb-6">
                <Icon className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">{title}</h3>
              <p className="text-gray-600">{description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function HowItWorksSection() {
  const steps = [
    {
      number: 1,
      icon: MessageCircle,
      title: 'Escríbenos por WhatsApp',
      description: 'Escríbenos por WhatsApp y coordina tu entrega en CDMX. Recibes bienvenida e instrucciones automáticas.',
    },
    {
      number: 2,
      icon: QrCode,
      title: 'Escanea el QR',
      description: 'Escanea el QR de tu tarjeta NFC.',
    },
    {
      number: 3,
      icon: Lock,
      title: 'Crea tu PIN',
      description: 'Crea tu PIN secreto y llena tus datos médicos.',
    },
    {
      number: 4,
      icon: Shield,
      title: 'Listo',
      description: 'Tu información viaja contigo siempre.',
    },
  ];

  return (
    <section id="como-funciona" className="py-20 sm:py-28 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-4">
            Actívalo en 4 pasos
          </h2>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <div key={step.number} className="relative">
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-12 left-full w-full h-0.5 bg-gray-200 -translate-y-1/2 z-0" />
              )}
              <div className="relative bg-white border border-gray-200 rounded-2xl p-8 text-center hover:shadow-lg hover:border-red-200 transition-[box-shadow,border-color] duration-300">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-red-600 rounded-xl mb-6">
                  <span className="text-lg font-bold text-white">{step.number}</span>
                </div>
                <div className="inline-flex items-center justify-center w-14 h-14 bg-gray-100 rounded-xl mb-4">
                  <step.icon className="w-7 h-7 text-gray-700" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{step.title}</h3>
                <p className="text-gray-600">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function BenefitsSection() {
  const benefits = [
    {
      icon: Smartphone,
      title: 'Sin app',
      description: 'Cualquier celular puede escanear tu NFC o QR.',
    },
    {
      icon: Lock,
      title: 'Cifrado de extremo a extremo',
      description: 'AES-256-GCM para datos médicos, geolocalización y tokens de sesión.',
    },
    {
      icon: Activity,
      title: 'Acceso inmediato',
      description: 'Paramédicos, policías, cualquier rescatista.',
    },
    {
      icon: RefreshCw,
      title: 'Siempre actualizable',
      description: 'Cambia tus datos cuando quieras con tu PIN.',
    },
    {
      icon: HardHat,
      title: 'Resistente',
      description: 'Materiales pensados para uso diario en moto.',
    },
    {
      icon: Nfc,
      title: 'Sin registro',
      description: 'No necesitas crear cuenta. Solo escanea y listo.',
    },
    {
      icon: Shield,
      title: 'Datos médicos protegidos',
      description: 'Tu información médica, contactos y ubicación viajan encriptados en nuestra base de datos.',
    },
    {
      icon: Database,
      title: 'Anti-filtración',
      description: 'Si roban nuestra base de datos, solo verán datos cifrados imposibles de leer sin la clave maestra.',
    },
    {
      icon: CheckCircle2,
      title: 'Alertas de dispositivos implantados',
      description: 'Marcapasos, implantes y prótesis visibles para paramédicos con advertencias de interferencia.',
    },
    {
      icon: MessageCircle,
      title: 'Alertas desde HelpMe, no desde tu celular',
      description: 'Los mensajes de emergencia se envían desde números de HelpMe a tus contactos. El paramédico no necesita dar su número ni usar su WhatsApp.',
    },
    {
      icon: Unlock,
      title: 'Código de desbloqueo de emergencia',
      description: 'Si activas el modo privado, tus contactos de confianza tienen un código propio para desbloquear tus datos ante un paramédico. Te avisamos cuando se usa.',
    },
    {
      icon: BadgeCheck,
      title: 'Contactos verificados',
      description: 'Confirmamos por WhatsApp que el número de cada contacto de emergencia es real antes de que quede registrado.',
    },
    {
      icon: HeartPulse,
      title: 'Modo Ruta',
      description: 'En viajes largos, HelpMe puede enviar alertas automáticas a tus contactos si algo no marcha bien en el camino.',
    },
    {
      icon: Hand,
      title: 'Sin seguro médico, igual te cubrimos',
      description: 'Si no tienes aseguradora registrada, canalizamos automáticamente al rescatista hacia la red pública de salud más cercana.',
    },
  ];

  return (
    <section id="beneficios" className="py-20 sm:py-28 bg-gray-950">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4">
            ¿Por qué elegir HelpMe?
          </h2>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {benefits.map(({ icon: Icon, title, description }) => (
            <div
              key={title}
              className="bg-gray-900 border border-gray-800 rounded-2xl p-6 hover:border-red-600/50 hover:shadow-lg hover:shadow-red-600/10 transition-[box-shadow,border-color] duration-300"
            >
              <div className="inline-flex items-center justify-center w-12 h-12 bg-red-600/20 rounded-xl mb-4">
                <Icon className="w-6 h-6 text-red-500" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
              <p className="text-gray-400">{description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function PricingSection() {
  const plans = [
    {
      name: 'Principal',
      price: '$149',
      period: 'MXN',
      hardware: 'Digital',
      hardwareDesc: 'Sin NFC físico',
      cta: 'Pedir Plan Principal',
      popular: false,
      features: [
        { text: 'Perfil médico completo', included: true },
        { text: 'Datos hereditarios e implantes', included: true },
        { text: '1 contacto de emergencia', included: true },
        { text: 'Botón SOS con GPS + WhatsApp', included: true },
        { text: 'Vista pública para rescatistas', included: true },
        { text: 'QR visible en pantalla', included: true },
        { text: 'Tarjeta médica visible', included: true },
        { text: 'Compartir perfil por WhatsApp', included: true },
        { text: 'Instalable como PWA', included: true },
        { text: 'NFC físico', included: false },
        { text: 'Modo privado con PIN', included: false },
        { text: 'Historial de alertas', included: false },
        { text: 'Descarga de QR/tarjeta', included: false },
      ],
    },
    {
      name: 'Pro',
      price: '$449',
      period: 'MXN',
      hardware: '1 NFC + 1 QR',
      hardwareDesc: 'Tag físico + sticker',
      cta: 'Pedir Plan Pro',
      popular: true,
      features: [
        { text: 'Todo lo del Principal', included: true },
        { text: 'Hasta 3 contactos de emergencia', included: true },
        { text: '1 tag NFC físico', included: true },
        { text: '1 sticker QR de respaldo', included: true },
        { text: 'Modo privado con PIN de 6 dígitos', included: true },
        { text: 'Alerta desde rescatista', included: true },
        { text: 'Historial de alertas', included: true },
        { text: 'Historial de escaneos', included: true },
        { text: 'Notificación al escanear', included: true },
        { text: 'QR descargable (PNG)', included: true },
        { text: 'Tarjeta médica descargable', included: true },
      ],
    },
    {
      name: 'Ultra',
      price: '$699',
      period: 'MXN',
      hardware: '4 NFC + 4 QR',
      hardwareDesc: 'Máxima protección',
      cta: 'Pedir Plan Ultra',
      popular: false,
      features: [
        { text: 'Todo lo del Pro', included: true },
        { text: 'Hasta 5 contactos de emergencia', included: true },
        { text: '4 tags NFC + 4 stickers QR', included: true },
        { text: 'Hasta 3 vehículos con aseguradora', included: true },
        { text: 'Modo Ruta con alertas automáticas', included: true },
        { text: 'Recordatorio semestral de datos', included: true },
        { text: 'Reporte mensual de actividad', included: true },
      ],
    },
  ];

  return (
    <section id="precio" className="py-20 sm:py-28 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-4">
            Elige tu nivel de protección
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Todos los planes incluyen perfil médico cifrado y vista para rescatistas.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative rounded-3xl p-8 flex flex-col ${
                plan.popular
                  ? 'bg-gradient-to-br from-red-600 to-red-700 text-white shadow-2xl shadow-red-600/30 scale-105 border-2 border-red-500'
                  : 'bg-white border border-gray-200 shadow-lg'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="bg-red-500 text-white text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-wide">
                    Más popular
                  </span>
                </div>
              )}

              <div className="mb-6">
                <h3 className={`text-xl font-bold mb-2 ${plan.popular ? 'text-white' : 'text-gray-900'}`}>
                  Plan {plan.name}
                </h3>
                <div className="flex items-baseline gap-2">
                  <span className={`text-4xl font-extrabold ${plan.popular ? 'text-white' : 'text-gray-900'}`}>
                    {plan.price}
                  </span>
                  <span className={`text-sm ${plan.popular ? 'text-red-200' : 'text-gray-500'}`}>
                    {plan.period}
                  </span>
                </div>
                <div className={`mt-2 text-sm font-medium ${plan.popular ? 'text-red-200' : 'text-gray-600'}`}>
                  {plan.hardware} · {plan.hardwareDesc}
                </div>
              </div>

              <ul className="space-y-3 mb-8 flex-grow">
                {plan.features.map((feature) => (
                  <li key={feature.text} className="flex items-start gap-2">
                    {feature.included ? (
                      <CheckCircle2 className={`w-5 h-5 flex-shrink-0 mt-0.5 ${plan.popular ? 'text-red-200' : 'text-emerald-500'}`} />
                    ) : (
                      <svg className={`w-5 h-5 flex-shrink-0 mt-0.5 ${plan.popular ? 'text-red-300' : 'text-gray-300'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    )}
                    <span className={`text-sm ${plan.popular ? 'text-red-100' : 'text-gray-700'} ${!feature.included ? 'opacity-50' : ''}`}>
                      {feature.text}
                    </span>
                  </li>
                ))}
              </ul>

              <a
                href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(`Hola, quiero el Plan ${plan.name} 🏍️`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className={`block w-full py-3.5 font-bold text-center text-lg rounded-xl transition-[transform,background-color] duration-200 focus:outline-none focus:ring-4 ${
                  plan.popular
                    ? 'bg-white text-red-600 hover:bg-gray-100 hover:scale-105 focus:ring-white/50'
                    : 'bg-red-600 text-white hover:bg-red-700 hover:scale-105 focus:ring-red-400'
                }`}
              >
                {plan.cta}
              </a>
            </div>
          ))}
        </div>

        <p className="mt-12 text-center text-sm text-gray-500">
          Entregas personales en CDMX · Coordinamos por WhatsApp
        </p>
      </div>
    </section>
  );
}

function TestimonialSection() {
  return (
    <section className="py-20 sm:py-28 bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-4">
            Por qué creé HelpMe
          </h2>
        </div>

        <div className="max-w-3xl mx-auto">
          <blockquote className="bg-white border border-gray-200 rounded-3xl p-8 sm:p-12 shadow-sm">
            <div className="flex items-center gap-1 mb-6">
              {[...Array(5)].map((_, i) => (
                <svg key={i} className="w-5 h-5 text-yellow-400 fill-current" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>
            <p className="text-lg sm:text-xl text-gray-700 leading-relaxed mb-8 italic">
              &quot;Soy biker desde hace 5 años y he visto innumerables tipos de accidentes. Los que parecen leves pueden complicarse en segundos cuando el rescatista no tiene información. Vi esa necesidad de primera mano y creé HelpMe para que ningún biker esté desprotegido en la carretera.&quot;
            </p>
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center w-12 h-12 bg-red-100 rounded-full">
                <User className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <p className="font-bold text-gray-900">Fundador de HelpMe</p>
                <p className="text-sm text-gray-500">CDMX</p>
              </div>
            </div>
          </blockquote>
        </div>
      </div>
    </section>
  );
}

function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const faqs = [
    {
      question: '¿Necesito descargar una app para que vean mis datos?',
      answer: 'No. Cualquier celular con cámara o NFC puede acceder a tus datos. Sin apps, sin registro.',
    },
    {
      question: '¿Qué pasa si olvido mi PIN?',
      answer: 'Escríbenos por WhatsApp al 5530541062 y te ayudamos a recuperar el acceso.',
    },
    {
      question: '¿Mis datos médicos están seguros?',
      answer: 'Sí. Usamos cifrado AES-256, el mismo estándar de la banca. Nadie puede leer tu información sin tu PIN.',
    },
    {
      question: '¿Funciona con cualquier celular?',
      answer: 'El QR funciona con cualquier celular con cámara. El NFC funciona con la mayoría de smartphones modernos.',
    },
    {
      question: '¿Cómo recibo mi paquete?',
      answer: 'Las entregas son personales en CDMX. Coordinamos día, hora y punto de entrega por WhatsApp.',
    },
    {
      question: '¿Puedo actualizar mis datos después?',
      answer: 'Sí, cuantas veces quieras. Solo entra a tu enlace de configuración e ingresa tu PIN.',
    },
    {
      question: '¿Las alertas se envían desde el celular del paramédico?',
      answer: 'No. Las alertas se envían desde números de HelpMe directamente a tus contactos de emergencia. El paramédico solo escanea y presiona "Enviar alerta" — no necesita usar su WhatsApp ni dar su número personal.',
    },
    {
      question: '¿Qué pasa si alguien más escanea mi tag y quiere ayudarme?',
      answer: 'Cualquier persona que te encuentre puede mantener presionado el botón de alerta (evita alertas accidentales) para notificar a todos tus contactos de emergencia con tu ubicación en tiempo real, sin dar su número personal.',
    },
    {
      question: '¿Cómo sé que mis contactos de emergencia van a recibir la alerta?',
      answer: 'Al registrar un contacto, le enviamos un mensaje de prueba por WhatsApp para confirmar que el número es real y está activo antes de guardarlo.',
    },
    {
      question: '¿Qué pasa si no tengo seguro médico?',
      answer: 'No hay problema. Si no registras una aseguradora, HelpMe canaliza automáticamente al rescatista hacia la red pública de salud más cercana.',
    },
  ];

  return (
    <section id="faq" className="py-20 sm:py-28 bg-white">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-4">
            Preguntas frecuentes
          </h2>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="border border-gray-200 rounded-2xl overflow-hidden hover:border-gray-300 transition-colors"
            >
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full flex items-center justify-between p-6 text-left focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-inset"
                aria-expanded={openIndex === index}
              >
                <span className="font-semibold text-gray-900 pr-4">{faq.question}</span>
                {openIndex === index ? (
                  <ChevronUp className="w-5 h-5 text-gray-500 flex-shrink-0" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-500 flex-shrink-0" />
                )}
              </button>
              {openIndex === index && (
                <div className="px-6 pb-6">
                  <p className="text-gray-600 leading-relaxed">{faq.answer}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FinalCTASection() {
  return (
    <section className="py-20 sm:py-28 bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 text-center">
        <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-6">
          No esperes a que pase algo
        </h2>
        <p className="text-lg sm:text-xl text-gray-300 max-w-2xl mx-auto mb-10 leading-relaxed">
          Protege tu vida hoy. Tu información puede salvarla mañana.
        </p>
        <a
          href={WHATSAPP_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-3 px-8 py-4 bg-red-600 text-white font-bold text-lg rounded-xl hover:bg-red-700 hover:scale-105 transition-[transform,background-color] duration-200 shadow-lg shadow-red-600/30 focus:outline-none focus:ring-4 focus:ring-red-400 focus:ring-offset-2 focus:ring-offset-gray-900"
        >
          <MessageCircle className="w-5 h-5" />
          Quiero mi HelpMe ahora
        </a>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="bg-gray-950 border-t border-gray-800 py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-8 h-8 bg-red-600 rounded-lg">
              <Cross className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-bold text-white">HelpMe</span>
          </div>

          <div className="flex items-center gap-6 text-sm text-gray-400">
            <a href="/aviso-de-privacidad" className="hover:text-white transition-colors">
              Aviso de Privacidad
            </a>
            <span>·</span>
            <a href="/terminos-y-condiciones" className="hover:text-white transition-colors">
              Términos y Condiciones
            </a>
          </div>
        </div>

        <div className="mt-4 pt-6 border-t border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-gray-500">
            © {new Date().getFullYear()} HelpMe · Todos los derechos reservados · CDMX
          </p>
          <Link
            href="/login"
            className="text-sm text-gray-500 hover:text-gray-300 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 rounded px-2 py-1"
          >
            Acceso Vendedores / Admin
          </Link>
        </div>
      </div>
    </footer>
  );
}

export default function LandingPage() {
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated()) {
      router.push('/dashboard');
    }
  }, [router]);

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main>
        <HeroSection />
        <ProblemSection />
        <SolutionSection />
        <RescuerAlertSection />
        <HowItWorksSection />
        <BenefitsSection />
        <PricingSection />
        <TestimonialSection />
        <FAQSection />
        <FinalCTASection />
      </main>
      <Footer />
      <FloatingWhatsAppButton />
    </div>
  );
}
