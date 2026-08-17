import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom'; // ou votre système de routing
import { api } from '../../../shared/api/axiosInstance';

export const AdminLayout: React.FC = () => {
  const [currentAdmin, setCurrentAdmin] = useState<{ firstName?: string; lastName?: string; email?: string } | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Récupérer les informations de l'administrateur connecté une seule fois au chargement du layout
  useEffect(() => {
    const fetchCurrentAdmin = async () => {
      try {
        const response = await api.get('/me'); // Endpoint de votre profil admin
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
    localStorage.removeItem('token');
    localStorage.removeItem('admin_user');
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden">
      
      {/* 1. Sidebar Fixe à gauche (votre menu actuel) */}
      <aside className="w-64 bg-[#0B0F19] text-white flex flex-col justify-between p-6">
        <div className="space-y-8">
          <h1 className="text-xl font-bold tracking-wider text-purple-400">LocaCar Admin</h1>
          
          <nav className="space-y-2">
            <a href="/admin/dashboard" className={`block px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${location.pathname.includes('dashboard') ? 'bg-purple-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
              Dashboard
            </a>
            <a href="/admin/categories" className={`block px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${location.pathname.includes('categories') ? 'bg-purple-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
              Categories
            </a>
            <a href="/admin/agencies" className={`block px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${location.pathname.includes('agencies') ? 'bg-purple-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
              Agencies
            </a>
            <a href="/admin/fleet" className={`block px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${location.pathname.includes('fleet') ? 'bg-purple-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
              Fleet Management
            </a>
            <a href="/admin/reservations" className={`block px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${location.pathname.includes('reservations') ? 'bg-purple-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
              Reservations
            </a>
          </nav>
        </div>

        <div>
          <button 
            onClick={handleLogout}
            className="text-red-400 hover:text-red-300 text-sm font-medium transition-colors cursor-pointer"
          >
            Logout
          </button>
        </div>
      </aside>

      {/* 2. Zone Principale (Header + Contenu de la page active) */}
      <div className="flex-1 flex flex-col overflow-hidden">
        
        {/* Top Header Global avec l'Admin connecté en haut à droite */}
        <header className="bg-white border-b border-slate-200 px-8 py-4 flex justify-between items-center shadow-2xs z-10">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Back-Office Panel</span>
          </div>

          {/* Badge Admin Connecté */}
          <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 px-4 py-2 rounded-xl">
            <div className="w-9 h-9 rounded-full bg-purple-600 text-white flex items-center justify-center font-bold text-sm shadow-sm">
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

        {/* Contenu dynamique de la page actuelle (Reservations, Agences, etc.) */}
        <main className="flex-1 overflow-y-auto bg-slate-50 p-6">
          <Outlet />
        </main>

      </div>
    </div>
  );
};