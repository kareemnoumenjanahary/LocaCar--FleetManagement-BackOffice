import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { LoginPage } from '../features/auth/components/LoginPage';
import { CategoriesPage } from '../features/categories/components/CategoriesPage';
import { AgenciesPage } from '../features/agency/components/AgenciesPage';
import { VehiclesPage } from '../features/vehicles/components/VehiclesPage';
import { ReservationsPage } from '../features/reservations/components/ReservationsPage';
import { api } from '../shared/api/axiosInstance';

const DashboardPage = () => {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-4 text-slate-800">Dashboard Overview</h2>
      <p className="text-slate-600">Welcome back to your LocaCar administration space.</p>
    </div>
  );
};

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const token = localStorage.getItem('admin_token');
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

const AdminLayout = ({ children }: { children: React.ReactNode }) => {
  const [currentAdmin, setCurrentAdmin] = useState<{ firstName?: string; lastName?: string; email?: string } | null>(null);
  const location = useLocation();

  useEffect(() => {
    const fetchCurrentAdmin = async () => {
      try {
        const response = await api.get('/me');
        setCurrentAdmin(response.data);
      } catch (err) {
        const cachedAdmin = localStorage.getItem('admin_user');
        if (cachedAdmin) {
          setCurrentAdmin(JSON.parse(cachedAdmin));
        } else {
          setCurrentAdmin({ firstName: 'Admin', lastName: 'LocaCar', email: 'admin@locacar.com' });
        }
      }
    };
    fetchCurrentAdmin();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    window.location.href = '/login';
  };

  return (
    <div className="flex h-screen bg-slate-100 text-slate-800 overflow-hidden">
      <aside className="w-64 bg-slate-900 text-slate-100 p-6 flex flex-col justify-between shadow-xl">
        <div>
          <h1 className="text-xl font-bold mb-8 text-purple-400">LocaCar Admin</h1>
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
        <header className="bg-white border-b border-slate-200 px-8 py-3.5 flex justify-end items-center shadow-2xs z-10">
          <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 px-4 py-1.5 rounded-xl">
            <div className="w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center font-bold text-xs shadow-sm">
              {currentAdmin?.firstName ? currentAdmin.firstName.charAt(0).toUpperCase() : 'A'}
            </div>
            <div className="text-left">
              <div className="text-xs font-bold text-slate-800">
                {currentAdmin ? `${currentAdmin.firstName || ''} ${currentAdmin.lastName || ''}`.trim() : 'Loading...'}
              </div>
              <div className="text-[11px] text-slate-500 font-medium">
                {currentAdmin?.email || 'admin@locacar.com'}
              </div>
            </div>
            <span className="ml-2 w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="Online"></span>
          </div>
        </header>

        <main className="flex-1 p-8 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
};

export const AppRoutes = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        
        {/* Redirection automatique de la racine vers /dashboard */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />

        <Route path="/dashboard" element={<ProtectedRoute><AdminLayout><DashboardPage /></AdminLayout></ProtectedRoute>} />
        <Route path="/categories" element={<ProtectedRoute><AdminLayout><CategoriesPage /></AdminLayout></ProtectedRoute>} />
        <Route path="/agencies" element={<ProtectedRoute><AdminLayout><AgenciesPage /></AdminLayout></ProtectedRoute>} />
        <Route path="/vehicles" element={<ProtectedRoute><AdminLayout><VehiclesPage /></AdminLayout></ProtectedRoute>} />
        <Route path="/reservations" element={<ProtectedRoute><AdminLayout><ReservationsPage /></AdminLayout></ProtectedRoute>} />
        
        {/* Route catch-all pour rediriger les URL inconnues */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
};