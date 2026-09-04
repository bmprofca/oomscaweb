import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

const ProtectedRoute = ({ children }) => {
  let parsed = null;
  try {
    const raw = localStorage.getItem('ooms_user_data');
    parsed = raw ? JSON.parse(raw) : null;
  } catch {
    parsed = null;
  }

  if (!parsed?.token) {
    return <Navigate to="/login" replace />;
  }

  // Token without username/branch is allowed so MainLayout can force branch selection
  return children ? children : <Outlet />;
};

export default ProtectedRoute;
