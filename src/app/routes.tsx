import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LoginPage } from '../features/auth/components/LoginPage';
import { ProtectedRoute } from '../shared/components/ProtectedRoute';
import { OwnerLayout } from '../shared/components/layouts/OwnerLayout';
import { DashboardPage } from '../features/dashboard/components/DashboardPage';
import { CategoriesPage } from '../features/categories/components/CategoriesPage';
import { AgenciesPage } from '../features/agency/components/AgenciesPage';
import { VehiclesPage } from '../features/vehicles/components/VehiclesPage';
import { ReservationsPage } from '../features/reservations/components/ReservationsPage';
import { SuperAdminDashboardPage } from '../features/superAdmin/components/SuperAdminDashboardPage';

export const AppRoutes = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        
        {/* ⚡ Redirection directe vers la page de login à l'ouverture de l'app */}
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* Route Super Admin (Isolée, sans le menu latéral des Owners) */}
        <Route
          path="/superadmin/dashboard"
          element={
            <ProtectedRoute>
              <SuperAdminDashboardPage />
            </ProtectedRoute>
          }
        />

        {/* Routes protégées réservées aux Owners avec le Layout Owner */}
        <Route
          element={
            <ProtectedRoute>
              <OwnerLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/categories" element={<CategoriesPage />} />
          <Route path="/agencies" element={<AgenciesPage />} />
          <Route path="/vehicles" element={<VehiclesPage />} />
          <Route path="/reservations" element={<ReservationsPage />} />
        </Route>
        
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
};