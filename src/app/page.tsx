'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { AppProvider, useApp } from './context/AppContext';
import { BranchProvider, useBranch } from './context/BranchContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { NetworkStatusNotifier } from './components/NetworkStatusNotifier';
import { PatientProvider } from './context/PatientContext';
import { StockProvider } from './context/StockContext';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import BottomNav from './components/BottomNav';
import { IconCheck, IconWarning, IconClose } from './components/Icons';
const pageLoading = () => <p role="status" style={{ padding: 24 }}>Ekran yükleniyor…</p>;
const DashboardPage = dynamic(() => import('./pages/DashboardPage'), { loading: pageLoading });
const PatientsPage = dynamic(() => import('./pages/PatientsPage'), { loading: pageLoading });
const PatientDetailPage = dynamic(() => import('./pages/PatientDetailPage'), { loading: pageLoading });
const AppointmentsPage = dynamic(() => import('./pages/AppointmentsPage'), { loading: pageLoading });
const RecallPage = dynamic(() => import('./pages/RecallPage'), { loading: pageLoading });
const SGKPage = dynamic(() => import('./pages/SGKPage'), { loading: pageLoading });
const StockPage = dynamic(() => import('./pages/StockPage'), { loading: pageLoading });
const FinancePage = dynamic(() => import('./pages/FinancePage'), { loading: pageLoading });
const ServicePage = dynamic(() => import('./pages/ServicePage'), { loading: pageLoading });
const ReportsPage = dynamic(() => import('./pages/ReportsPage'), { loading: pageLoading });
const BranchesPage = dynamic(() => import('./pages/BranchesPage'), { loading: pageLoading });
const SettingsPage = dynamic(() => import('./pages/SettingsPage'), { loading: pageLoading });
const SuppliersPage = dynamic(() => import('./pages/SuppliersPage'), { loading: pageLoading });
const AuditLogPage = dynamic(() => import('./pages/AuditLogPage'), { loading: pageLoading });
const SgkReceivablesPage = dynamic(() => import('./pages/SgkReceivablesPage'), { loading: pageLoading });
const AssetsPage = dynamic(() => import('./pages/AssetsPage'), { loading: pageLoading });
const SupportPage = dynamic(() => import('./pages/SupportPage'), { loading: pageLoading });
const ActivityLogPage = dynamic(() => import('./pages/ActivityLogPage'), { loading: pageLoading });
const BranchActivitiesPage = dynamic(() => import('./pages/BranchActivitiesPage'), { loading: pageLoading });
const LoginPage = dynamic(() => import('./pages/LoginPage'), { loading: pageLoading });
const OrgSelectPage = dynamic(() => import('./pages/OrgSelectPage'), { loading: pageLoading });

function ToastIcon({ type }: { type: string }) {
  if (type === 'success') return <IconCheck size={16} strokeWidth={2} />;
  if (type === 'error' || type === 'warning') return <IconWarning size={16} strokeWidth={2} />;
  return null;
}

function AppContent() {
  const { currentPage, toasts, removeToast, currentUser, currentOrgId, dataLoading } = useApp();

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
    if (!currentUser || !currentOrgId || dataLoading) return <p>Oturum ve firma verileri yükleniyor…</p>;
    const roles: string[]=currentUser.membership?.roles || [];
    const manager=roles.includes('Firma Yöneticisi');
    const management=['branches','settings','suppliers','audit-log','branch-activities'];
    const financial=['cash','expenses','reports','sgk-receivables','assets'];
    if ((!manager && management.includes(currentPage)) ||
      (!manager && financial.includes(currentPage) && !roles.some(r=>['Şube Yöneticisi','Muhasebe'].includes(r)))) return <p>Bu modül için yetkiniz yok.</p>;
    switch (currentPage) {
      case 'dashboard':         return <DashboardPage />;
      case 'patients':          return <PatientsPage />;
      case 'patient-detail':    return <PatientDetailPage />;
      case 'appointments':      return <AppointmentsPage />;
      case 'recall':            return <RecallPage />;
      case 'sgk':               return <SGKPage />;
      case 'stock':             return <StockPage />;
      case 'cash':              return <FinancePage />;
      case 'service':           return <ServicePage />;
      case 'reports':           return <ReportsPage />;
      case 'branches':          return <BranchesPage />;
      case 'settings':          return <SettingsPage />;
      case 'suppliers':         return <SuppliersPage />;
      case 'expenses':          return <FinancePage />;
      case 'audit-log':         return <AuditLogPage />;
      case 'sgk-receivables':   return <SgkReceivablesPage />;
      case 'assets':            return <AssetsPage />;
      case 'support':           return <SupportPage />;
      case 'activity-log':      return <ActivityLogPage />;
      case 'branch-activities': return <BranchActivitiesPage />;
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

      {/* Çevrimdışı / Network Durum Takipçisi */}
      <NetworkStatusNotifier />
    </div>
  );
}

function BranchWrapper({ children }: { children: React.ReactNode }) {
  const { branchesList, currentUser, currentOrgId, addToast } = useApp();

  return (
    <BranchProvider
      key={`${currentUser?.id || "anonymous"}:${currentOrgId || "none"}`}
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
        <PatientProvider>
          <StockProvider>
            <BranchWrapper>
              <AppContent />
            </BranchWrapper>
          </StockProvider>
        </PatientProvider>
      </AppProvider>
    </ErrorBoundary>
  );
}
