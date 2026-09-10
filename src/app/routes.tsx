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

export const AppRoutes = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />

        {/* Routes protégées avec le Layout partagé */}
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
        
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
};