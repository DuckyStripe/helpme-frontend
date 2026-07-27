'use client';

import Link from 'next/link';
import { Cross, ArrowLeft } from 'lucide-react';

export default function TerminosCondicionesPage() {
  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-red-600 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 rounded-lg px-2 py-1"
            aria-label="Volver al inicio"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm font-medium">Inicio</span>
          </Link>
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
          Términos y Condiciones
        </h1>
        <p className="text-sm text-gray-500 mb-12">
          Última actualización: [DÍA] de [MES] de 2025
        </p>

        <div className="space-y-10">
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              1. Aceptación de los Términos
            </h2>
            <p className="text-gray-700 leading-relaxed">
              Al adquirir, activar o utilizar cualquier producto o servicio de <strong>HelpMe</strong>,
              usted acepta quedar vinculado por los presentes Términos y Condiciones.
              Si no está de acuerdo, deberá abstenerse de usar nuestros servicios.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              2. Descripción del Servicio
            </h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              HelpMe es un sistema de identificación médica de emergencia para motociclistas
              que consiste en:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-1">
              <li>Un paquete físico compuesto por: tarjeta NFC con QR impreso, pegatina NFC
                para casco, sticker de ubicación y tarjeta de instrucciones</li>
              <li>Una plataforma digital donde el usuario registra y administra
                su información médica de emergencia</li>
              <li>Acceso público a dicha información mediante escaneo de NFC o QR
                por parte de personal de emergencias</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              3. Proceso de Compra y Entrega
            </h2>
            <ul className="list-disc list-inside text-gray-700 space-y-1">
              <li>Las ventas se realizan exclusivamente mediante WhatsApp al número <strong>5530541062</strong></li>
              <li>Las entregas son <strong>personales en CDMX</strong>, coordinadas directamente con el comprador</li>
              <li>El pago se realiza previo a la entrega en la modalidad acordada con el vendedor</li>
              <li>HelpMe se reserva el derecho de rechazar pedidos sin necesidad de justificación</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              4. Activación del Producto
            </h2>
            <ul className="list-disc list-inside text-gray-700 space-y-1">
              <li>Cada paquete contiene una etiqueta única identificada por un código QR y NFC</li>
              <li>El usuario es el único responsable de crear y resguardar su PIN de acceso</li>
              <li>HelpMe no almacena ni tiene acceso al PIN del usuario</li>
              <li>En caso de olvido del PIN, el usuario deberá contactar soporte vía WhatsApp
                para iniciar el proceso de recuperación de acceso</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              5. Responsabilidad del Usuario
            </h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              El usuario se compromete a:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-1 mb-4">
              <li>Proporcionar información médica veraz y actualizada</li>
              <li>Mantener su PIN de acceso seguro y confidencial</li>
              <li>Actualizar su información ante cualquier cambio médico relevante</li>
              <li>No utilizar el servicio para fines distintos a los establecidos</li>
            </ul>
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <p className="text-sm text-red-800 leading-relaxed">
                <strong>HelpMe no se responsabiliza por consecuencias derivadas de información
                médica incorrecta, desactualizada o incompleta proporcionada por el usuario.</strong>
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              6. Limitación de Responsabilidad
            </h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              HelpMe no garantiza ni se responsabiliza por:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-1 mb-4">
              <li>Que el personal de emergencias cuente con dispositivos compatibles con NFC o QR</li>
              <li>Interrupciones del servicio por causas de fuerza mayor o fallas técnicas ajenas</li>
              <li>El uso indebido que terceros hagan de la información pública del tag</li>
              <li>Resultados médicos derivados del uso o no uso de la información mostrada</li>
            </ul>
            <p className="text-gray-700 leading-relaxed">
              El servicio se proporciona como una <strong>herramienta de apoyo informativo</strong>
              para situaciones de emergencia, sin sustituir la responsabilidad
              del personal médico profesional.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              7. Propiedad Intelectual
            </h2>
            <p className="text-gray-700 leading-relaxed">
              Todos los elementos del sitio web, plataforma y marca HelpMe —incluyendo
              logotipos, diseños, código fuente y contenido— son propiedad exclusiva de
              <strong>[NOMBRE COMPLETO O RAZÓN SOCIAL]</strong> y están protegidos por las leyes
              de propiedad intelectual vigentes en México.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              8. Cancelaciones y Devoluciones
            </h2>
            <ul className="list-disc list-inside text-gray-700 space-y-1">
              <li>Una vez entregado el paquete físico, <strong>no se aceptan devoluciones</strong> salvo
                defecto de fabricación comprobable</li>
              <li>En caso de defecto, el usuario tiene <strong>7 días naturales</strong> desde la entrega
                para reportarlo vía WhatsApp al <strong>5530541062</strong></li>
              <li>HelpMe evaluará cada caso y determinará si procede reposición o reembolso</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              9. Modificaciones al Servicio
            </h2>
            <p className="text-gray-700 leading-relaxed">
              HelpMe se reserva el derecho de modificar, suspender o descontinuar
              cualquier parte del servicio en cualquier momento, notificando
              a los usuarios con al menos <strong>15 días de anticipación</strong> mediante
              el sitio web o WhatsApp.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              10. Legislación Aplicable
            </h2>
            <p className="text-gray-700 leading-relaxed">
              Los presentes Términos y Condiciones se rigen por las leyes de los
              <strong>Estados Unidos Mexicanos</strong>. Para cualquier controversia, las partes
              se someten a la jurisdicción de los tribunales competentes de la
              <strong>Ciudad de México</strong>, renunciando a cualquier otro fuero que pudiera
              corresponderles.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              11. Contacto
            </h2>
            <p className="text-gray-700 leading-relaxed">
              Para dudas sobre estos Términos y Condiciones:
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
