'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Activity, Eye, EyeOff, Loader2 } from 'lucide-react';
import { authApi } from '@/lib/api';
import ThemeToggle from '@/components/ui/ThemeToggle';

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await authApi.register(name, email, password);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Error al registrar');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900 flex items-center justify-center p-4">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <div className="bg-red-600 p-2 rounded-xl">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <span className="font-bold text-xl text-gray-900 dark:text-gray-100">HelpMe</span>
          </Link>
          <h1 className="text-2xl font-extrabold text-gray-900 dark:text-gray-100">Crear Cuenta</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Regístrate para crear tu ficha médica</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl dark:border dark:border-gray-800 p-8 space-y-6">
          {error && (
            <div role="alert" aria-live="polite" className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 text-red-700 dark:text-red-400 px-4 py-3 rounded-xl text-sm font-medium">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="name" className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
              Nombre Completo
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
              className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:border-red-500 focus:ring-0 outline-none transition-colors"
              placeholder="Tu nombre"
              required
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
              Correo Electrónico
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:border-red-500 focus:ring-0 outline-none transition-colors"
              placeholder="tu@email.com"
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
              Contraseña
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:border-red-500 focus:ring-0 outline-none transition-colors pr-12"
                placeholder="Mínimo 6 caracteres"
                minLength={6}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white py-3 rounded-xl font-bold transition-colors flex items-center justify-center gap-2"
          >
            {loading && <Loader2 className="w-5 h-5 animate-spin" />}
            {loading ? 'Creando cuenta…' : 'Crear Cuenta'}
          </button>

          <div className="text-center">
            <p className="text-gray-600 dark:text-gray-400">
              ¿Ya tienes cuenta?{' '}
              <Link href="/login" className="text-red-600 dark:text-red-400 font-bold hover:underline">
                Inicia sesión
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
