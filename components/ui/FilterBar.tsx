'use client';

import { Search, Filter, X } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';

interface FilterBarProps {
  onFilterChange: (filters: {
    status: string;
    sellerId: string;
    search: string;
    dateFrom: string;
    dateTo: string;
    plan: string;
  }) => void;
  sellers?: Array<{ id: string; name: string }>;
  adminId?: string;
  adminName?: string;
  plans?: string[];
}

export default function FilterBar({ onFilterChange, sellers = [], adminId, adminName: _adminName, plans = [] }: FilterBarProps) {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState('ALL');
  const [sellerId, setSellerId] = useState('');
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [plan, setPlan] = useState('');
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    onFilterChange({ status, sellerId, search, dateFrom, dateTo, plan });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, sellerId, dateFrom, dateTo, plan]);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      onFilterChange({ status, sellerId, search, dateFrom, dateTo, plan });
    }, 300);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  function clearFilters() {
    setStatus('ALL');
    setSellerId('');
    setSearch('');
    setDateFrom('');
    setDateTo('');
    setPlan('');
  }

  const hasFilters = status !== 'ALL' || sellerId || search || dateFrom || dateTo || plan;

  return (
    <div className="space-y-3">
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por UUID…"
            aria-label="Buscar por UUID"
            autoComplete="off"
            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-800/50 border border-gray-300 dark:border-gray-700/50 rounded-lg text-sm text-gray-800 dark:text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500/50"
          />
        </div>
        <button
          onClick={() => setOpen(!open)}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
            open || hasFilters
              ? 'bg-red-600/10 text-red-600 dark:text-red-400 border border-red-500/20'
              : 'bg-white dark:bg-gray-800/50 border border-gray-300 dark:border-gray-700/50 text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
          }`}
        >
          <Filter className="w-4 h-4" />
          Filtros
          {hasFilters && <span className="w-2 h-2 bg-red-500 rounded-full" />}
        </button>
        {hasFilters && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-1 px-3 py-2.5 text-sm text-gray-500 hover:text-gray-800 dark:hover:text-gray-300 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
            Limpiar
          </button>
        )}
      </div>

      {open && (
        <div className="bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700/50 rounded-xl p-4 grid grid-cols-2 md:grid-cols-4 gap-3">
          <div>
            <label htmlFor="filter-status" className="block text-xs text-gray-500 mb-1">Estado</label>
            <select
              id="filter-status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-900/50 border border-gray-300 dark:border-gray-700/50 rounded-lg text-sm text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-red-500/50"
            >
              <option value="ALL">Todos</option>
              <option value="VIRGIN">Sin activar</option>
              <option value="INCOMPLETE">Incompleto</option>
              <option value="ACTIVE">Activo</option>
              <option value="SUSPENDED">Suspendido</option>
            </select>
          </div>
          <div>
            <label htmlFor="filter-seller" className="block text-xs text-gray-500 mb-1">Asignado a</label>
            <select
              id="filter-seller"
              value={sellerId}
              onChange={(e) => setSellerId(e.target.value)}
              className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-900/50 border border-gray-300 dark:border-gray-700/50 rounded-lg text-sm text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-red-500/50"
            >
              <option value="">Todos</option>
              {adminId && (
                <option value={adminId}>Admin (yo)</option>
              )}
              {sellers.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="filter-plan" className="block text-xs text-gray-500 mb-1">Plan</label>
            <select
              id="filter-plan"
              value={plan}
              onChange={(e) => setPlan(e.target.value)}
              className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-900/50 border border-gray-300 dark:border-gray-700/50 rounded-lg text-sm text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-red-500/50"
            >
              <option value="">Todos</option>
              {plans.map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="filter-date-from" className="block text-xs text-gray-500 mb-1">Desde</label>
            <input
              id="filter-date-from"
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-900/50 border border-gray-300 dark:border-gray-700/50 rounded-lg text-sm text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-red-500/50"
            />
          </div>
          <div>
            <label htmlFor="filter-date-to" className="block text-xs text-gray-500 mb-1">Hasta</label>
            <input
              id="filter-date-to"
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-900/50 border border-gray-300 dark:border-gray-700/50 rounded-lg text-sm text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-red-500/50"
            />
          </div>
        </div>
      )}
    </div>
  );
}
