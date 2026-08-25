import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { LoginPage } from '../features/auth/components/LoginPage';
import { CategoriesPage } from '../features/categories/components/CategoriesPage';
import { AgenciesPage } from '../features/agency/components/AgenciesPage';
import { VehiclesPage } from '../features/vehicles/components/VehiclesPage';
import { ReservationsPage } from '../features/reservations/components/ReservationsPage';
import { api } from '../shared/api/axiosInstance';
import { Calendar, Car, Wallet, AlertTriangle } from 'lucide-react';

const DashboardPage = () => {
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/dashboard/stats')
      .then((res) => {
        if (res.data.success) {
          setDashboardData(res.data.data);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Erreur lors du chargement du dashboard :", err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <div className="p-6 text-center text-slate-500">Chargement du tableau de bord...</div>;
  }

  if (!dashboardData) {
    return <div className="p-6 text-center text-red-500">Erreur de chargement des données.</div>;
  }

  const { fleet, reservations, recentReservations } = dashboardData;

  const totalVehicles = fleet.total || 1;
  const availablePct = Math.round((fleet.available / totalVehicles) * 100);
  const rentedPct = Math.round((fleet.rented / totalVehicles) * 100);
  const maintenancePct = Math.round((fleet.maintenance / totalVehicles) * 100);

  return (
    <div className="space-y-6 pb-8">
      {/* En-tête */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Bonjour, Administrateur 👋</h1>
          <p className="text-sm text-slate-500">Voici l'activité de votre agence aujourd'hui</p>
        </div>
      </div>

      {/* 1. CARTES DE STATISTIQUES */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Réservations totales</span>
            <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600">
              <Calendar className="w-5 h-5" />
            </div>
          </div>
          <div>
            <span className="text-2xl font-bold text-slate-900">{reservations.totalReservations}</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Véhicules disponibles</span>
            <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600">
              <Car className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-900">{fleet.available}</span>
              <span className="text-xs text-slate-400">sur {fleet.total} véhicules</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">En attente</span>
            <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div>
            <span className="text-2xl font-bold text-slate-900">{reservations.pendingReservations}</span>
            <span className="text-xs text-slate-400 ml-2">à traiter</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Agences partenaires</span>
            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600">
              <Wallet className="w-5 h-5" />
            </div>
          </div>
          <div>
            <span className="text-2xl font-bold text-slate-900">{dashboardData.agenciesCount}</span>
          </div>
        </div>
      </div>

      {/* 2. SECTION ETAT DE LA FLOTTE & GRAPHIQUE */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-slate-900">Revenus et réservations</h3>
            <span className="text-xs font-medium text-slate-500 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-200">12 derniers mois ▾</span>
          </div>
          <div className="h-64 flex items-center justify-center bg-slate-50/50 rounded-xl border border-dashed border-slate-200 text-slate-400 text-sm">
            [Zone Graphique]
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
          <h3 className="font-bold text-slate-900 mb-4">État de la flotte</h3>
          <div className="flex flex-col items-center justify-center my-auto py-4">
            <div className="relative w-36 h-36 rounded-full border-8 border-indigo-500 border-t-cyan-400 border-r-amber-400 flex items-center justify-center">
              <div className="text-center">
                <span className="text-2xl font-bold text-slate-900">{fleet.total}</span>
                <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Véhicules</p>
              </div>
            </div>
          </div>
          <div className="space-y-2 pt-4 border-t border-slate-100 text-xs">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 font-medium text-slate-600"><span className="w-2.5 h-2.5 rounded-full bg-cyan-500"></span> Disponibles</span>
              <span className="font-bold text-slate-900">{fleet.available} ({availablePct}%)</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 font-medium text-slate-600"><span className="w-2.5 h-2.5 rounded-full bg-indigo-500"></span> En location</span>
              <span className="font-bold text-slate-900">{fleet.rented} ({rentedPct}%)</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 font-medium text-slate-600"><span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span> Maintenance</span>
              <span className="font-bold text-slate-900">{fleet.maintenance} ({maintenancePct}%)</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. TABLEAU DES RÉSERVATIONS RÉCENTES */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-slate-900">Réservations récentes</h3>
          <Link 
            to="/reservations" 
            className="text-xs font-semibold text-purple-600 hover:text-purple-700 transition-colors flex items-center gap-1"
          >
            Voir tout →
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                <th className="pb-3">Client</th>
                <th className="pb-3">Véhicule</th>
                <th className="pb-3">Départ</th>
                <th className="pb-3">Retour</th>
                <th className="pb-3">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-xs">
              {recentReservations.map((res: any) => (
                <tr key={res.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-3.5 font-medium text-slate-900">
                    {res.client ? res.client.email : 'Client inconnu'}
                  </td>
                  <td className="py-3.5">
                    <div className="font-medium text-slate-900">
                      {res.vehicle ? `${res.vehicle.brand} ${res.vehicle.model}` : 'Véhicule supprimé'}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      {res.vehicle?.licensePlate}
                    </div>
                  </td>
                  <td className="py-3.5 text-slate-600">{res.startDate}</td>
                  <td className="py-3.5 text-slate-600">{res.endDate}</td>
                  <td className="py-3.5">
                    <span className="px-2.5 py-1 rounded-full font-medium bg-slate-100 text-slate-700">
                      {res.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
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
        const response = await api.get('/users/me');
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
        
        <Route path="/" element={<Navigate to="/dashboard" replace />} />

        <Route path="/dashboard" element={<ProtectedRoute><AdminLayout><DashboardPage /></AdminLayout></ProtectedRoute>} />
        <Route path="/categories" element={<ProtectedRoute><AdminLayout><CategoriesPage /></AdminLayout></ProtectedRoute>} />
        <Route path="/agencies" element={<ProtectedRoute><AdminLayout><AgenciesPage /></AdminLayout></ProtectedRoute>} />
        <Route path="/vehicles" element={<ProtectedRoute><AdminLayout><VehiclesPage /></AdminLayout></ProtectedRoute>} />
        <Route path="/reservations" element={<ProtectedRoute><AdminLayout><ReservationsPage /></AdminLayout></ProtectedRoute>} />
        
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
};