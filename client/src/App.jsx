import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import MainLayout from './components/layout/MainLayout';
import StudentManagementPage from './pages/StudentManagementPage';

// Auth Components
import AdminLoginPage from './pages/auth/AdminLoginPage';
import StudentLoginPage from './pages/auth/StudentLoginPage';
import StudentRegisterPage from './pages/auth/StudentRegisterPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import ResetPasswordPage from './pages/auth/ResetPasswordPage';
import ProtectedRoute from './components/auth/ProtectedRoute';
import PublicRoute from './components/auth/PublicRoute';

import StudentDashboard from './pages/StudentDashboard';
import AdminScanStation from './pages/AdminScanStation';

function App() {
  return (
    <>
      <Toaster position="top-right" reverseOrder={false} />
      
      <Routes>
        {/* Public Auth Routes */}
        <Route element={<PublicRoute />}>
          <Route path="/login" element={<StudentLoginPage />} />
          <Route path="/register" element={<StudentRegisterPage />} />
          <Route path="/admin/login" element={<AdminLoginPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
        </Route>

        {/* Protected Admin Routes */}
        <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
          <Route element={<MainLayout />}>
            <Route path="/admin/dashboard" element={<div className="text-white p-6 leading-relaxed">
              <h2 className="text-3xl font-bold mb-4">Command Center</h2>
              <p className="text-gray-400">Registry nodes active. Secure communications established.</p>
            </div>} />
            <Route path="/admin/students" element={<StudentManagementPage />} />
            <Route path="/admin/scan-station" element={<AdminScanStation />} />
            <Route path="/admin/*" element={<Navigate to="/admin/dashboard" replace />} />
          </Route>
        </Route>

        {/* Protected Student Routes */}
        <Route element={<ProtectedRoute allowedRoles={['student']} />}>
          <Route path="/student/portal" element={<StudentDashboard />} />
        </Route>

        {/* Global Entry Redirect */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </>
  );
}

export default App;
