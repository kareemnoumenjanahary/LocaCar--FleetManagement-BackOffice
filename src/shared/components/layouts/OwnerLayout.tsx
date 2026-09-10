import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Sun, Moon } from 'lucide-react';
import { api } from '../../api/axiosInstance';

export const OwnerLayout = () => {
  const [currentOwner, setCurrentOwner] = useState<{ firstName?: string; lastName?: string; email?: string } | null>(null);
  const [isDark, setIsDark] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;

    const saved = window.localStorage.getItem('theme');
    if (saved === 'dark' || saved === 'light') return saved === 'dark';

    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });
  const location = useLocation();

  const applyTheme = (dark: boolean) => {
    const root = document.documentElement;
    
    root.classList.toggle('dark', dark);
    root.style.colorScheme = dark ? 'dark' : 'light';
    window.localStorage.setItem('theme', dark ? 'dark' : 'light');
  };

  useEffect(() => {
    applyTheme(isDark);
  }, [isDark]);

  const toggleTheme = () => {
    setIsDark((previous) => {
      const next = !previous;
      applyTheme(next);
      return next;
    });
  };

  useEffect(() => {
    const fetchCurrentOwner = async () => {
      try {
        const response = await api.get('/users/me');
        setCurrentOwner(response.data);
      } catch (err) {
        const cachedOwner = localStorage.getItem('owner_user') || localStorage.getItem('admin_user');
        if (cachedOwner) {
          setCurrentOwner(JSON.parse(cachedOwner));
        } else {
          setCurrentOwner({ firstName: 'Owner', lastName: 'LocaCar', email: 'owner@locacar.com' });
        }
      }
    };
    fetchCurrentOwner();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('owner_token');
    localStorage.removeItem('admin_user');
    localStorage.removeItem('owner_user');
    window.location.href = '/login';
  };

  return (
    <div className="flex h-screen bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-slate-100 overflow-hidden transition-colors">
      <aside className="w-64 bg-slate-900 text-slate-100 p-6 flex flex-col justify-between shadow-xl">
        <div>
          <h1 className="text-xl font-bold mb-8 text-purple-400">LocaCar Owner</h1>
          <nav className="space-y-2">
            <Link to="/dashboard" className={`block px-3 py-2.5 rounded-xl transition font-medium ${location.pathname === '/dashboard' ? 'bg-purple-600 text-white' : 'hover:bg-slate-800'}`}>📊 Dashboard</Link>
            <Link to="/categories" className={`block px-3 py-2.5 rounded-xl transition font-medium ${location.pathname === '/categories' ? 'bg-purple-600 text-white' : 'hover:bg-slate-800'}`}>📁 Categories</Link>
            <Link to="/agencies" className={`block px-3 py-2.5 rounded-xl transition font-medium ${location.pathname === '/agencies' ? 'bg-purple-600 text-white' : 'hover:bg-slate-800'}`}>🏢 Agencies</Link>
            <Link to="/vehicles" className={`block px-3 py-2.5 rounded-xl transition font-medium ${location.pathname === '/vehicles' ? 'bg-purple-600 text-white' : 'hover:bg-slate-800'}`}>🚗 Fleet Management</Link>
            <Link to="/reservations" className={`block px-3 py-2.5 rounded-xl transition font-medium ${location.pathname === '/reservations' ? 'bg-purple-600 text-white' : 'hover:bg-slate-800'}`}>📅 Reservations</Link>
          </nav>
        </div>
        <button
          onClick={handleLogout}
          className="w-full py-2.5 text-left px-3 text-red-400 hover:bg-red-500/10 rounded-xl transition font-medium cursor-pointer"
        >
          Logout
        </button>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-8 py-3.5 flex justify-end items-center gap-4 shadow-2xs z-10 transition-colors">
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={isDark ? 'Passer en mode clair' : 'Passer en mode sombre'}
            className="w-9 h-9 flex items-center justify-center rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-600 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors cursor-pointer"
            title={isDark ? 'Passer en mode clair' : 'Passer en mode sombre'}
          >
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 px-4 py-1.5 rounded-xl transition-colors">
            <div className="w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center font-bold text-xs shadow-sm">
              {currentOwner?.firstName ? currentOwner.firstName.charAt(0).toUpperCase() : 'O'}
            </div>
            <div className="text-left">
              <div className="text-xs font-bold text-slate-800 dark:text-slate-100">
                {currentOwner ? `${currentOwner.firstName || ''} ${currentOwner.lastName || ''}`.trim() : 'Loading...'}
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                {currentOwner?.email || 'owner@locacar.com'}
              </div>
            </div>
            <span className="ml-2 w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="Online"></span>
          </div>
        </header>

        <main className="flex-1 p-8 overflow-y-auto bg-slate-50 dark:bg-slate-900 transition-colors">
          <Outlet />
        </main>
      </div>
    </div>
  );
};