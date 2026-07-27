'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { authApi } from '@/lib/api';
import {
  LayoutDashboard, QrCode, Users, LogOut, Shield, UserCog, Settings, Menu, X, Car,
} from 'lucide-react';
import type { User } from '@/types';
import ThemeToggle from '@/components/ui/ThemeToggle';

interface DashboardLayoutProps {
  user: User;
  children: React.ReactNode;
}

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['ADMIN'] },
  { href: '/dashboard/tags', label: 'Tags', icon: QrCode, roles: ['ADMIN', 'VENDEDOR'] },
  { href: '/dashboard/sellers', label: 'Vendedores', icon: Users, roles: ['ADMIN'] },
  { href: '/dashboard/admins', label: 'Administradores', icon: UserCog, roles: ['ADMIN'] },
  { href: '/dashboard/insurers', label: 'Aseguradoras', icon: Car, roles: ['ADMIN'] },
  { href: '/dashboard/settings', label: 'Configuración', icon: Settings, roles: ['ADMIN'] },
];

export default function DashboardLayout({ user, children }: DashboardLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const isAdmin = user.role === 'ADMIN';
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  async function handleLogout() {
    await authApi.logout();
    router.push('/login');
  }

  const visibleNavItems = navItems.filter(item => item.roles.includes(user.role));

  useEffect(() => {
    if (!mobileNavOpen) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setMobileNavOpen(false);
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mobileNavOpen]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 md:flex">
      {/* Mobile top bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 md:hidden">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center shrink-0">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-lg font-bold text-gray-900 dark:text-gray-100">HelpMe</h1>
        </div>
        <div className="flex items-center gap-1">
          <ThemeToggle />
          <button
            onClick={() => setMobileNavOpen(true)}
            className="p-2 text-gray-500 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
            aria-label="Abrir menú"
          >
            <Menu className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Mobile drawer overlay */}
      {mobileNavOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 md:hidden"
          onClick={() => setMobileNavOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`w-64 max-w-[80vw] bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col fixed h-full z-50 transition-transform duration-200 md:translate-x-0 ${
          mobileNavOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Logo */}
        <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center shrink-0">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div className="min-w-0">
                <h1 className="text-lg font-bold text-gray-900 dark:text-gray-100">HelpMe</h1>
                <span className={`text-xs font-medium px-1.5 py-0.5 rounded-full ${isAdmin ? 'bg-red-500/10 text-red-600 dark:text-red-400' : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'}`}>
                  {isAdmin ? 'Admin' : 'Vendedor'}
                </span>
              </div>
            </div>
            <button
              onClick={() => setMobileNavOpen(false)}
              className="p-1.5 text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-200 rounded-lg md:hidden"
              aria-label="Cerrar menú"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {visibleNavItems.map(item => {
            const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileNavOpen(false)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-red-600/10 text-red-600 dark:text-red-400'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800/50'
                }`}
              >
                <item.icon className="w-5 h-5 shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Theme toggle (desktop) */}
        <div className="hidden md:flex items-center justify-between px-6 py-3 border-t border-gray-200 dark:border-gray-800">
          <span className="text-xs font-medium text-gray-400 dark:text-gray-500">Tema</span>
          <ThemeToggle />
        </div>

        {/* User */}
        <div className="px-3 py-4 border-t border-gray-200 dark:border-gray-800">
          <div className="flex items-center justify-between px-3 py-2">
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{user.name}</p>
              <p className="text-xs text-gray-500 truncate">{user.email}</p>
            </div>
            <button
              onClick={handleLogout}
              className="p-1.5 text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors shrink-0"
              title="Cerrar sesión"
              aria-label="Cerrar sesión"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 md:ml-64 min-w-0">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 sm:py-8">
          {children}
        </div>
      </main>
    </div>
  );
}
