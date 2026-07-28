'use client';

import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { BranchProvider, useBranch } from './context/BranchContext';
import { ErrorBoundary } from './components/ErrorBoundary';
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
import SuppliersPage from './pages/SuppliersPage';
import ExpensesPage from './pages/ExpensesPage';
import AuditLogPage from './pages/AuditLogPage';
import SgkReceivablesPage from './pages/SgkReceivablesPage';
import AssetsPage from './pages/AssetsPage';
import SupportPage from './pages/SupportPage';
import ActivityLogPage from './pages/ActivityLogPage';
import BranchActivitiesPage from './pages/BranchActivitiesPage';
import LoginPage from './pages/LoginPage';
import OrgSelectPage from './pages/OrgSelectPage';
import SuperAdminPage from './pages/SuperAdminPage';

function ToastIcon({ type }: { type: string }) {
  if (type === 'success') return <IconCheck size={16} strokeWidth={2} />;
  if (type === 'error' || type === 'warning') return <IconWarning size={16} strokeWidth={2} />;
  return null;
}

function AppContent() {
  const { currentPage, toasts, removeToast } = useApp();

  React.useEffect(() => {
    window.scrollTo({ top: 0, left: 0 });
  }, [currentPage]);

  // Giriş ve Klinik seçim ekranları için ana tasarımı (Sidebar/Header) render etme
  if (currentPage === 'login') {
    return (
      <>
        <LoginPage />
        {/* Toast Bildirimleri */}
        {toasts.length > 0 && renderToastContainer()}
      </>
    );
  }

  if (currentPage === 'org-select') {
    return (
      <>
        <OrgSelectPage />
        {/* Toast Bildirimleri */}
        {toasts.length > 0 && renderToastContainer()}
      </>
    );
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':         return <DashboardPage />;
      case 'patients':          return <PatientsPage />;
      case 'patient-detail':    return <PatientDetailPage />;
      case 'appointments':      return <AppointmentsPage />;
      case 'recall':            return <RecallPage />;
      case 'sgk':               return <SGKPage />;
      case 'stock':             return <StockPage />;
      case 'cash':              return <CashPage />;
      case 'service':           return <ServicePage />;
      case 'reports':           return <ReportsPage />;
      case 'branches':          return <BranchesPage />;
      case 'settings':          return <SettingsPage />;
      case 'suppliers':         return <SuppliersPage />;
      case 'expenses':          return <ExpensesPage />;
      case 'audit-log':         return <AuditLogPage />;
      case 'sgk-receivables':   return <SgkReceivablesPage />;
      case 'assets':            return <AssetsPage />;
      case 'support':           return <SupportPage />;
      case 'activity-log':      return <ActivityLogPage />;
      case 'branch-activities': return <BranchActivitiesPage />;
      case 'super-admin':       return <SuperAdminPage />;
      default:                  return <DashboardPage />;
    }
  };

  function renderToastContainer() {
    return (
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
    );
  }

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
      {toasts.length > 0 && renderToastContainer()}
    </div>
  );
}

function BranchWrapper({ children }: { children: React.ReactNode }) {
  const { branchesList, currentUser, currentOrgId, addToast } = useApp();

  return (
    <BranchProvider
      branchesList={branchesList}
      currentUser={currentUser}
      currentOrgId={currentOrgId}
    >
      <BranchInnerWrapper addToast={addToast}>
        {children}
      </BranchInnerWrapper>
    </BranchProvider>
  );
}

function BranchInnerWrapper({ children, addToast }: { children: React.ReactNode; addToast: any }) {
  const { isFallbackRedirected, fallbackMessage, clearFallbackMessage } = useBranch();

  React.useEffect(() => {
    if (isFallbackRedirected && fallbackMessage) {
      addToast({ type: 'warning', message: fallbackMessage });
      clearFallbackMessage();
    }
  }, [isFallbackRedirected, fallbackMessage]);

  return <>{children}</>;
}

export default function Home() {
  return (
    <ErrorBoundary>
      <AppProvider>
        <BranchWrapper>
          <AppContent />
        </BranchWrapper>
      </AppProvider>
    </ErrorBoundary>
  );
}
