import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LoginPage } from '../features/auth/components/LoginPage';
import { CategoriesPage } from '../features/categories/components/CategoriesPage';
import { AgenciesPage } from '../features/agency/components/AgenciesPage';

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
  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    window.location.href = '/login';
  };

  return (
    <div className="flex h-screen bg-slate-100 text-slate-800">
      <aside className="w-64 bg-slate-900 text-slate-100 p-6 flex flex-col justify-between shadow-xl">
        <div>
          <h1 className="text-xl font-bold mb-8 text-purple-400">LocaCar Admin</h1>
          <nav className="space-y-2">
            <a href="/dashboard" className="block px-3 py-2.5 rounded-xl hover:bg-slate-800 transition font-medium">📊 Dashboard</a>
            <a href="/categories" className="block px-3 py-2.5 rounded-xl hover:bg-slate-800 transition font-medium">📁 Categories</a>
            <a href="/agencies" className="block px-3 py-2.5 rounded-xl hover:bg-slate-800 transition font-medium">🏢 Agencies</a>
            <a href="/vehicles" className="block px-3 py-2.5 rounded-xl hover:bg-slate-800 transition font-medium">🚗 Fleet Management</a>
            <a href="/reservations" className="block px-3 py-2.5 rounded-xl hover:bg-slate-800 transition font-medium">📅 Reservations</a>
          </nav>
        </div>
        <button
          onClick={handleLogout}
          className="w-full py-2.5 text-left px-3 text-red-400 hover:bg-red-500/10 rounded-xl transition font-medium"
        >
          Logout
        </button>
      </aside>
      <main className="flex-1 p-8 overflow-y-auto">{children}</main>
    </div>
  );
};

export const AppRoutes = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <AdminLayout>
                <DashboardPage />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/categories"
          element={
            <ProtectedRoute>
              <AdminLayout>
                <CategoriesPage />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/agencies"
          element={
            <ProtectedRoute>
              <AdminLayout>
                <AgenciesPage />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/vehicles"
          element={
            <ProtectedRoute>
              <AdminLayout>
                <div className="text-2xl font-bold text-slate-800">Fleet Management Panel</div>
              </AdminLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/reservations"
          element={
            <ProtectedRoute>
              <AdminLayout>
                <div className="text-2xl font-bold text-slate-800">Reservations Panel</div>
              </AdminLayout>
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
};