import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../../shared/api/axiosInstance';

export const SuperAdminDashboardPage: React.FC = () => {
  const [adminInfo, setAdminInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSuperAdminData = async () => {
      try {
        const response = await api.get('/users/me');
        setAdminInfo(response.data);
      } catch (err) {
        localStorage.removeItem('owner_token');
        navigate('/login');
      } finally {
        setLoading(false);
      }
    };

    fetchSuperAdminData();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('owner_token');
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <p className="text-slate-600 font-medium">Loading Super Admin Panel...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      {/* Navbar Supérieure */}
      <header className="bg-slate-900 text-white shadow-md px-8 py-4 flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <span className="text-2xl">⚡</span>
          <h1 className="text-xl font-bold tracking-wide">
            LocaCar <span className="text-purple-400">Super Admin Center</span>
          </h1>
        </div>
        <div className="flex items-center space-x-4">
          <span className="text-sm text-slate-300">
            {adminInfo?.email}
          </span>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-sm font-semibold rounded-xl transition duration-200 shadow-sm"
          >
            Logout
          </button>
        </div>
      </header>

      {/* Contenu Principal - Gestion Globale */}
      <main className="flex-1 p-8 max-w-7xl mx-auto w-full space-y-6">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-2xl font-bold text-slate-900 mb-2">
            Platform Overview 📊
          </h2>
          <p className="text-slate-500 text-sm">
            Manage platform owners, monitor active subscriptions, and track overall financial billing across LocaCar.
          </p>
        </div>

        {/* Grille des statistiques clés (Owners, Abonnements, Factures) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md transition">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Platform Owners</h3>
              <span className="text-2xl">👥</span>
            </div>
            <p className="text-3xl font-extrabold text-slate-900">--</p>
            <p className="text-xs text-purple-600 font-medium mt-2">Manage registered owners & agencies</p>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md transition">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Active Subscriptions</h3>
              <span className="text-2xl">💳</span>
            </div>
            <p className="text-3xl font-extrabold text-slate-900">--</p>
            <p className="text-xs text-indigo-600 font-medium mt-2">Monitor plans & renewals</p>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md transition">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Invoices & Billing</h3>
              <span className="text-2xl">📄</span>
            </div>
            <p className="text-3xl font-extrabold text-slate-900">--</p>
            <p className="text-xs text-emerald-600 font-medium mt-2">View system revenue & receipts</p>
          </div>
        </div>

        {/* Section rapide de gestion (Tableau ou liste des Owners par exemple) */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-4">
          <h3 className="text-lg font-bold text-slate-900">Recent Owners Management</h3>
          <div className="border border-dashed border-slate-300 rounded-xl p-8 text-center text-slate-400 text-sm">
            Owner listing and subscription tables will be displayed here.
          </div>
        </div>
      </main>
    </div>
  );
};