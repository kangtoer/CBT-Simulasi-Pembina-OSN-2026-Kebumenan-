/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './components/AuthProvider';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import StudentDashboard from './pages/StudentDashboard';
import ExamInterface from './pages/ExamInterface';
import AdminDashboard from './pages/AdminDashboard';
import Reports from './pages/Reports';

function PrivateRoute({ children, role }: { children: React.ReactNode, role?: 'admin' | 'student' }) {
  const { user, profile, loading } = useAuth();
  
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
    </div>
  );
  
  if (!user) return <Navigate to="/login" />;
  if (role && profile?.role !== role) return <Navigate to="/" />;
  
  return <>{children}</>;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          <Route path="/" element={
            <PrivateRoute>
              <Layout>
                <StudentDashboard />
              </Layout>
            </PrivateRoute>
          } />
          
          <Route path="/exam/:examId" element={
            <PrivateRoute>
              <ExamInterface />
            </PrivateRoute>
          } />
          
          <Route path="/admin/*" element={
            <PrivateRoute role="admin">
              <Layout>
                <AdminDashboard />
              </Layout>
            </PrivateRoute>
          } />

          <Route path="/reports" element={
             <PrivateRoute role="admin">
              <Layout>
                <Reports />
              </Layout>
            </PrivateRoute>
          } />

          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

