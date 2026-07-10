'use client';

import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import BottomNav from './components/BottomNav';
import { IconCheck, IconWarning, IconClose } from './components/Icons';
import DashboardPage from './pages/DashboardPage';
import PatientsPage from './pages/PatientsPage';
import PatientDetailPage from './pages/PatientDetailPage';
import AppointmentsPage from './pages/AppointmentsPage';
import RecallPage from './pages/RecallPage';
import SGKPage from './pages/SGKPage';
import StockPage from './pages/StockPage';
import CashPage from './pages/CashPage';
import ServicePage from './pages/ServicePage';
import ReportsPage from './pages/ReportsPage';
import BranchesPage from './pages/BranchesPage';
import SettingsPage from './pages/SettingsPage';

function ToastIcon({ type }: { type: string }) {
  if (type === 'success') return <IconCheck size={16} strokeWidth={2} />;
  if (type === 'error' || type === 'warning') return <IconWarning size={16} strokeWidth={2} />;
  return null;
}

function AppContent() {
  const { currentPage, toasts, removeToast } = useApp();

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':      return <DashboardPage />;
      case 'patients':       return <PatientsPage />;
      case 'patient-detail': return <PatientDetailPage />;
      case 'appointments':   return <AppointmentsPage />;
      case 'recall':         return <RecallPage />;
      case 'sgk':            return <SGKPage />;
      case 'stock':          return <StockPage />;
      case 'cash':           return <CashPage />;
      case 'service':        return <ServicePage />;
      case 'reports':        return <ReportsPage />;
      case 'branches':       return <BranchesPage />;
      case 'settings':       return <SettingsPage />;
      default:               return <DashboardPage />;
    }
  };

  return (
    <div className="app-layout">
      <Sidebar />

      <main className="main-content">
        <Header />
        {renderPage()}
      </main>

      {/* Alt Navigasyon — Sadece Mobilde Görünür */}
      <BottomNav />

      {/* Toast Bildirimleri */}
      {toasts.length > 0 && (
        <div className="toast-container" role="alert" aria-live="polite">
          {toasts.map((toast) => (
            <div key={toast.id} className={`toast ${toast.type}`}>
              <span style={{ color: 'var(--primary-600)', flexShrink: 0 }}>
                <ToastIcon type={toast.type} />
              </span>
              <span style={{ flex: 1, fontSize: '0.84rem', color: 'var(--gray-800)' }}>
                {toast.message}
              </span>
              <button
                onClick={() => removeToast(toast.id)}
                style={{ opacity: 0.4, flexShrink: 0 }}
                aria-label="Bildirimi kapat"
              >
                <IconClose size={14} strokeWidth={2} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Home() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
