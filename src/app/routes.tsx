import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LoginPage } from '../features/auth/components/LoginPage';
import { ProtectedRoute } from '../shared/components/ProtectedRoute';
import { OwnerLayout } from '../shared/components/layouts/OwnerLayout';
import { DashboardPage } from '../features/dashboard/components/DashboardPage';
import { CategoriesPage } from '../features/categories/components/CategoriesPage';
import { AgenciesPage } from '../features/agency/components/AgenciesPage';
import { VehiclesPage } from '../features/vehicles/components/VehiclesPage';
import { ReservationsPage } from '../features/reservations/components/ReservationsPage';
import { CustomersPage } from '../features/Customer/components/CustomersPage';
import EmployeesPage from '../features/Employee/components/EmployeesPage';
import { SuperAdminPage } from '../features/superAdmin/components/SuperAdminDashboardPage';

export const AppRoutes = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route path="/" element={<Navigate to="/login" replace />} />

        <Route
          path="/superadmin/dashboard"
          element={
            <ProtectedRoute>
              <SuperAdminPage />
            </ProtectedRoute>
          }
        />

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

          <Route path="/employees" element={<EmployeesPage />} />

          <Route path="/customers" element={<CustomersPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
};