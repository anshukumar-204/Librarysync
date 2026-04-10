import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';

export default function PublicRoute() {
  const { user, token } = useSelector((state) => state.adminAuth);

  if (token && user) {
    if (user.role === 'admin') return <Navigate to="/admin/dashboard" replace />;
    if (user.role === 'student') return <Navigate to="/student/portal" replace />;
    return <Navigate to="/admin/dashboard" replace />;
  }

  return <Outlet />;
}
