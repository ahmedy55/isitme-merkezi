'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { AppProvider, useApp } from './context/AppContext';
import { BranchProvider, useBranch } from './context/BranchContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { NetworkStatusNotifier } from './components/NetworkStatusNotifier';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import BottomNav from './components/BottomNav';
import { IconCheck, IconWarning, IconClose } from './components/Icons';
import { canAccessPage } from './lib/pageAuthorization';
import { getUserRole } from './lib/userHelpers';
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
const ProfilePage = dynamic(() => import('./pages/ProfilePage'), { loading: pageLoading });
const LoginPage = dynamic(() => import('./pages/LoginPage'), { loading: pageLoading });
const PasswordRecoveryPage = dynamic(() => import('./pages/PasswordRecoveryPage'), { loading: pageLoading });
const OrgSelectPage = dynamic(() => import('./pages/OrgSelectPage'), { loading: pageLoading });

function ToastIcon({ type }: { type: string }) {
  if (type === 'success') return <IconCheck size={16} strokeWidth={2} />;
  if (type === 'error' || type === 'warning') return <IconWarning size={16} strokeWidth={2} />;
  return null;
}

function AppContent() {
  const { currentPage, toasts, removeToast, currentUser, currentOrgId, dataLoading, selectedPatientId, setSelectedPatientId, setCurrentPage, usersList } = useApp();
  const { activeBranch } = useBranch();
  const previousBranchScope = React.useRef<string | null>(null);
  const branchScopeKey = activeBranch.mode === 'single' ? `single:${activeBranch.branchId}` : activeBranch.mode === 'region' ? `region:${activeBranch.regionId}` : 'all';

  React.useEffect(() => {
    if (previousBranchScope.current && previousBranchScope.current !== branchScopeKey) {
      if (selectedPatientId) setSelectedPatientId(null);
      if (currentPage === 'patient-detail') setCurrentPage('patients', true);
    }
    previousBranchScope.current = branchScopeKey;
  }, [branchScopeKey, selectedPatientId, currentPage, setSelectedPatientId, setCurrentPage]);

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

  if (currentPage === 'password-recovery') {
    return (
      <>
        <PasswordRecoveryPage />
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
    const effectiveOrgId = currentOrgId ||
      currentUser?.membership?.organization_id ||
      currentUser?.app_metadata?.organization_id ||
      currentUser?.user_metadata?.organization_id ||
      (typeof window !== 'undefined' ? localStorage.getItem('selected_organization_id') || localStorage.getItem('current_org_id') : null);

    if (!currentUser) return <LoginPage />;
    if (!effectiveOrgId) return <OrgSelectPage />;

    const roles: string[] = (currentUser.membership?.roles && currentUser.membership.roles.length > 0)
      ? currentUser.membership.roles
      : (currentUser.roles || currentUser.app_metadata?.roles || currentUser.user_metadata?.roles || [getUserRole(currentUser, usersList)]);

    if (!canAccessPage(currentPage, roles)) {
      return (
        <div style={{ padding: '3rem 2rem', textAlign: 'center' }} data-testid="unauthorized-message">
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--gray-800)', marginBottom: '0.5rem' }}>Erişim Yetkisi Yok</h2>
          <p style={{ color: 'var(--gray-500)', fontSize: '0.95rem' }}>Bu modül için yetkiniz yok.</p>
        </div>
      );
    }
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
      case 'profile':           return <ProfilePage />;
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
        <div key={branchScopeKey}>{renderPage()}</div>
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
        <BranchWrapper>
          <AppContent />
        </BranchWrapper>
      </AppProvider>
    </ErrorBoundary>
  );
}
