'use client';

import { useRouter } from 'next/navigation';
import { Cross, ArrowLeft } from 'lucide-react';

export default function AvisoPrivacidadPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-4">
          <button
            onClick={() => router.push('/')}
            className="inline-flex items-center gap-2 text-gray-600 hover:text-red-600 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 rounded-lg px-2 py-1"
            aria-label="Volver al inicio"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm font-medium">Inicio</span>
          </button>
          <div className="flex items-center gap-2 ml-auto">
            <div className="flex items-center justify-center w-9 h-9 bg-red-600 rounded-lg">
              <Cross className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">HelpMe</span>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-4">
          Aviso de Privacidad
        </h1>
        <p className="text-sm text-gray-500 mb-12">
          Última actualización: [DÍA] de [MES] de 2025
        </p>

        <div className="space-y-10">
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              1. Identidad y Domicilio del Responsable
            </h2>
            <p className="text-gray-700 leading-relaxed">
              <strong>[NOMBRE COMPLETO O RAZÓN SOCIAL]</strong>, con domicilio en <strong>[DIRECCIÓN COMPLETA, CDMX]</strong>,
              en adelante &quot;HelpMe&quot;, es el responsable del tratamiento de sus datos personales,
              de conformidad con la Ley Federal de Protección de Datos Personales en Posesión
              de los Particulares (LFPDPPP) y su Reglamento.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              2. Datos Personales que Recabamos
            </h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              HelpMe recaba las siguientes categorías de datos personales:
            </p>
            <h3 className="font-semibold text-gray-900 mb-2">Datos de identificación:</h3>
            <ul className="list-disc list-inside text-gray-700 space-y-1 mb-4">
              <li>Nombre completo</li>
              <li>Ciudad de residencia</li>
              <li>Número de teléfono (para contacto vía WhatsApp)</li>
            </ul>
            <h3 className="font-semibold text-gray-900 mb-2">Datos médicos y de salud (datos sensibles):</h3>
            <ul className="list-disc list-inside text-gray-700 space-y-1 mb-4">
              <li>Tipo de sangre</li>
              <li>Alergias</li>
              <li>Medicamentos de uso regular</li>
              <li>Condiciones médicas preexistentes</li>
              <li>Contactos de emergencia</li>
            </ul>
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <p className="text-sm text-amber-800 leading-relaxed">
                Estos datos son considerados <strong>datos sensibles</strong> conforme al artículo 3,
                fracción VI de la LFPDPPP y reciben protección reforzada.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              3. Finalidades del Tratamiento
            </h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Sus datos personales serán utilizados para las siguientes finalidades <strong>primarias</strong>
              (necesarias para la prestación del servicio):
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-1 mb-6">
              <li>Registrar y activar su etiqueta de identificación de emergencia HelpMe</li>
              <li>Mostrar su información médica a personal de emergencias (paramédicos, policías,
                personal de rescate) ante un accidente</li>
              <li>Permitirle actualizar su información médica mediante su PIN de acceso</li>
              <li>Brindarle soporte técnico relacionado con su producto</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mb-4">
              <strong>Finalidades secundarias</strong> (no necesarias para el servicio, puede negarse):
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-1 mb-4">
              <li>Envío de comunicados sobre nuevos productos o actualizaciones de HelpMe</li>
            </ul>
            <p className="text-gray-700 leading-relaxed">
              Para negarse al tratamiento de finalidades secundarias, escríbanos a:
              📱 WhatsApp: <strong>5530541062</strong>
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              4. Transferencia de Datos
            </h2>
            <p className="text-gray-700 leading-relaxed">
              HelpMe <strong>no vende, cede ni transfiere</strong> sus datos personales a terceros,
              salvo en los siguientes casos permitidos por ley:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-1 mt-4">
              <li>Cuando sea requerido por autoridad competente mediante orden judicial</li>
              <li>Cuando sea necesario para proteger su vida o integridad física</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              5. Seguridad de los Datos
            </h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              HelpMe implementa las siguientes medidas de seguridad para proteger
              sus datos personales:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-1">
              <li>Cifrado AES-256-GCM para datos médicos almacenados</li>
              <li>PIN de acceso personal protegido con hash bcrypt</li>
              <li>Transmisión de datos bajo protocolo HTTPS/TLS</li>
              <li>Acceso restringido a la información mediante autenticación</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              6. Derechos ARCO
            </h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Usted tiene derecho a <strong>Acceder, Rectificar, Cancelar u Oponerse (ARCO)</strong>
              al tratamiento de sus datos personales. Para ejercer estos derechos:
            </p>
            <p className="text-gray-700 leading-relaxed mb-4">
              📱 Escríbanos por WhatsApp al <strong>5530541062</strong> indicando:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-1 mb-4">
              <li>Nombre completo</li>
              <li>Derecho que desea ejercer</li>
              <li>Descripción clara de lo que solicita</li>
            </ul>
            <p className="text-gray-700 leading-relaxed">
              Responderemos en un plazo máximo de <strong>20 días hábiles.</strong>
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              7. Uso de Cookies y Tecnologías de Rastreo
            </h2>
            <p className="text-gray-700 leading-relaxed">
              Nuestro sitio web puede utilizar cookies de sesión estrictamente necesarias
              para su funcionamiento. No utilizamos cookies de rastreo publicitario.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              8. Cambios al Aviso de Privacidad
            </h2>
            <p className="text-gray-700 leading-relaxed">
              Nos reservamos el derecho de modificar este Aviso de Privacidad en cualquier
              momento. Cualquier cambio será publicado en nuestro sitio web con la fecha
              de actualización correspondiente.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              9. Contacto
            </h2>
            <p className="text-gray-700 leading-relaxed">
              Para cualquier duda relacionada con el tratamiento de sus datos personales:
            </p>
            <p className="text-gray-700 mt-2">
              📱 WhatsApp: <strong>5530541062</strong>
              <br />
              🌐 <strong>[URL DEL SITIO WEB]</strong>
            </p>
          </section>
        </div>
      </main>

      <footer className="border-t border-gray-100 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 text-center text-sm text-gray-500">
          <p>© {new Date().getFullYear()} HelpMe · Todos los derechos reservados · CDMX</p>
        </div>
      </footer>
    </div>
  );
}
