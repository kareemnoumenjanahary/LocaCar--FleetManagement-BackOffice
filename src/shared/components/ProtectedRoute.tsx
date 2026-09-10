import React from 'react';
import { Navigate } from 'react-router-dom';

export const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const token = localStorage.getItem('owner_token') || localStorage.getItem('admin_token');
  
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
};