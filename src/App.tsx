/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './AuthContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import LoginPage from './pages/LoginPage';

const DashboardTeacher = lazy(() => import('./pages/DashboardTeacher'));
const DashboardStudent = lazy(() => import('./pages/DashboardStudent'));

// Komponen loading fallback untuk UX pada jaringan lambat
const LoadingScreen = () => (
  <div className="min-h-screen bg-slate-50 flex items-center justify-center">
    <div className="flex flex-col items-center gap-4">
      <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      <p className="text-slate-500 font-medium animate-pulse">Memuat aplikasi...</p>
    </div>
  </div>
);

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <BrowserRouter>
          <Suspense fallback={<LoadingScreen />}>
            <Routes>
              <Route path="/" element={<LoginPage />} />
              <Route path="/dashboard/teacher" element={<DashboardTeacher />} />
              <Route path="/dashboard/student" element={<DashboardStudent />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </AuthProvider>
    </ErrorBoundary>
  );
}
