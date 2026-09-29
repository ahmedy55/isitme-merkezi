'use client';

import React from 'react';
import { useApp } from '../context/AppContext';
import { IconLogo, IconClose, navIcons } from './Icons';
import { getDisplayName, getUserRole, getUserInitials } from '../lib/userHelpers';
import { useBranchScope } from '../hooks/useBranchScope';

export default function Sidebar() {
  const { currentPage, setCurrentPage, sidebarOpen, setSidebarOpen, currentUser, logout, loggingOut, appointmentsList, recallList, patientsList, usersList, branchesList } = useApp();
  const { matches } = useBranchScope();
  const [showUserMenu, setShowUserMenu] = React.useState(false);

  const pendingAppointmentsCount = React.useMemo(() => {
    // Keep the navigation badge in sync with the "Planlandı" metric on the appointments page.
    return (appointmentsList || []).filter(a =>
      (a.status === 'Bekliyor' || a.status === 'Hatırlatıldı') && matches(a.branch, a.branchId)
    ).length;
  }, [appointmentsList, matches]);

  const pendingRecallCount = React.useMemo(() => {
    const visiblePatientIds = new Set(patientsList.filter(patient => matches(patient.branch, patient.branchId)).map(patient => patient.id));
    return (recallList || []).filter(r => r.status === 'Bekliyor' && visiblePatientIds.has(r.patientId)).length;
  }, [recallList, patientsList, matches]);

  const activeSections = React.useMemo(() => {
    const userRoles: string[] = currentUser?.membership?.roles || [];
    const hasRole = (required?: string[]) => !required?.length || userRoles.includes('Firma Yöneticisi') || required.some(r=>userRoles.includes(r));
    const dynamicSections = [
      {
        title: 'Ana Menü',
        items: [
          { id: 'dashboard'    as const, label: 'Dashboard', badge: null },
          { id: 'patients'     as const, label: 'Hastalar', badge: null, requiredRoles: ['Firma Yöneticisi', 'Şube Yöneticisi', 'Odyometrist', 'Odyolog', 'Sekreter', 'Resepsiyon'] },
          { id: 'appointments' as const, label: 'Randevular', badge: pendingAppointmentsCount > 0 ? String(pendingAppointmentsCount) : null, requiredRoles: ['Firma Yöneticisi', 'Şube Yöneticisi', 'Odyometrist', 'Odyolog', 'Sekreter', 'Resepsiyon'] },
        ].filter(item => hasRole((item as any).requiredRoles)),
      },
      {
        title: 'İşlemler',
        items: [
          { id: 'recall'          as const, label: 'Recall', badge: pendingRecallCount > 0 ? String(pendingRecallCount) : null, requiredRoles: ['Firma Yöneticisi', 'Şube Yöneticisi', 'Odyometrist', 'Odyolog', 'Sekreter', 'Resepsiyon'] },
          { id: 'activity-log'    as const, label: 'Aktivite Kaydı', badge: null, requiredRoles: ['Firma Yöneticisi', 'Şube Yöneticisi', 'Odyometrist', 'Odyolog', 'Sekreter', 'Resepsiyon'] },
          { id: 'sgk'             as const, label: 'SGK & Reçete', badge: null, requiredRoles: ['Firma Yöneticisi', 'Şube Yöneticisi', 'Odyometrist', 'Odyolog'] },
          { id: 'sgk-receivables' as const, label: 'SGK Ödeme Takvimi', badge: null, requiredRoles: ['Firma Yöneticisi', 'Şube Yöneticisi', 'Muhasebe'] },
          { id: 'stock'           as const, label: 'Stok & Aksesuar', badge: null, requiredRoles: ['Firma Yöneticisi', 'Şube Yöneticisi', 'Odyometrist', 'Odyolog', 'Sekreter', 'Muhasebe'] },
          { id: 'assets'          as const, label: 'Demirbaşlar', badge: null, requiredRoles: ['Firma Yöneticisi', 'Şube Yöneticisi', 'Odyometrist', 'Odyolog', 'Muhasebe'] },
          { id: 'cash'            as const, label: 'Kasa, Tahsilat & Masraflar', badge: null, requiredRoles: ['Firma Yöneticisi', 'Şube Yöneticisi', 'Muhasebe'] },
          { id: 'service'         as const, label: 'Teknik Servis', badge: null, requiredRoles: ['Firma Yöneticisi', 'Şube Yöneticisi', 'Odyometrist', 'Odyolog'] },
          { id: 'suppliers' as const, label: 'Tedarikçiler', badge: null, requiredRoles: ['Firma Yöneticisi'] },
        ].filter(item => hasRole((item as any).requiredRoles)),
      },
      {
        title: 'Yönetim',
        items: [
          { id: 'reports'           as const, label: 'Raporlar', badge: null, requiredRoles: ['Firma Yöneticisi', 'Şube Yöneticisi', 'Muhasebe'] },
          { id: 'branches'          as const, label: 'Şubeler & Yetki', badge: null, requiredRoles: ['Firma Yöneticisi'] },
          { id: 'branch-activities' as const, label: 'Şube Aktiviteleri', badge: null, requiredRoles: ['Firma Yöneticisi'] },
          { id: 'audit-log'         as const, label: 'İşlem Kayıtları', badge: null, requiredRoles: ['Firma Yöneticisi'] },
          { id: 'settings'          as const, label: 'Ayarlar', badge: null, requiredRoles: ['Firma Yöneticisi'] },
          { id: 'support'           as const, label: 'Destek', badge: null },
        ].filter(item => (item.id !== 'branch-activities' || branchesList.filter(branch => branch.status === 'Aktif').length > 1) && hasRole((item as any).requiredRoles)),
      },
    ];

    return dynamicSections;
  }, [pendingAppointmentsCount, pendingRecallCount, currentUser, branchesList]);

  return (
    <>
      {/* Overlay — Mobilde sidebar açıkken arka planı karartır */}
      <div
        className={`sidebar-overlay ${sidebarOpen ? 'visible' : ''}`}
        onClick={() => setSidebarOpen(false)}
        aria-hidden="true"
      />

      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        {/* Logo & Kapat Butonu */}
        <div className="sidebar-logo">
          <div className="sidebar-logo-mark">
            <IconLogo size={22} strokeWidth={1.8} />
          </div>
          <div className="sidebar-logo-text">
            <h1>AudiPro</h1>
            <span>İşitme Merkezi Yönetimi</span>
          </div>
          {/* Mobilde kapat butonu */}
          <button
            onClick={() => setSidebarOpen(false)}
            style={{
              marginLeft: 'auto',
              width: 28, height: 28,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              borderRadius: 6,
              color: 'rgba(255,255,255,0.4)',
              transition: 'all 140ms',
            }}
            className="sidebar-close-btn"
            aria-label="Menüyü kapat"
          >
            <IconClose size={16} />
          </button>
        </div>

        {/* Navigasyon */}
        {activeSections.map((section) => {
          const NavIcon = navIcons;
          return (
            <div key={section.title} className="sidebar-section">
              <div className="sidebar-section-title">{section.title}</div>
              <nav className="sidebar-nav">
                {section.items.map((item) => {
                  const Icon = NavIcon[item.id as keyof typeof NavIcon];
                  return (
                    <button
                      key={item.id}
                      className={`sidebar-link ${currentPage === item.id ? 'active' : ''}`}
                      onClick={() => { setCurrentPage(item.id); setSidebarOpen(false); }}
                      title={item.label}
                      aria-label={item.label}
                      aria-current={currentPage === item.id ? 'page' : undefined}
                    >
                      <span className="sidebar-link-icon">
                        {Icon && <Icon size={17} strokeWidth={1.7} />}
                      </span>
                      <span>{item.label}</span>
                      {item.badge && (
                        <span className="sidebar-link-badge">{item.badge}</span>
                      )}
                    </button>
                  );
                })}
              </nav>
            </div>
          );
        })}

        {/* Kullanıcı */}
        <div className="sidebar-footer">
          <div className="sidebar-user" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', position: 'relative' }}>
            <button type="button" className="sidebar-profile-trigger" onClick={() => setShowUserMenu(open => !open)} aria-label="Kullanıcı menüsünü aç" aria-expanded={showUserMenu}>
              <div className="sidebar-user-avatar" style={{ background: 'var(--primary-600)', color: 'white', fontWeight: 600 }}>
                {getUserInitials(getDisplayName(currentUser, usersList))}
              </div>
              <div className="sidebar-user-info">
                <div className="sidebar-user-name" style={{ color: 'var(--gray-200)', fontWeight: 600, fontSize: '0.82rem' }}>
                  {getDisplayName(currentUser, usersList)}
                </div>
                <div className="sidebar-user-role" style={{ fontSize: '0.7rem', color: 'var(--gray-400)' }}>
                  {getUserRole(currentUser, usersList)}
                </div>
              </div>
            </button>

            {showUserMenu && <div role="menu" style={{ position: 'absolute', bottom: 'calc(100% + 8px)', left: 10, right: 10, background: 'var(--surface-white)', border: '1px solid var(--surface-border-light)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-lg)', zIndex: 1000, padding: 6 }}>
              <button role="menuitem" type="button" className="profile-menu-item" onClick={() => { setCurrentPage('profile'); setSidebarOpen(false); setShowUserMenu(false); }}>Profilim</button>
              {currentUser?.membership?.roles?.includes('Firma Yöneticisi') && <button role="menuitem" type="button" className="profile-menu-item" onClick={() => { setCurrentPage('org-select'); setSidebarOpen(false); setShowUserMenu(false); }}>Klinik değiştir</button>}
              <button role="menuitem" type="button" className="profile-menu-item" disabled={loggingOut} onClick={() => { setShowUserMenu(false); void logout(); }}>{loggingOut ? 'Çıkış yapılıyor…' : 'Çıkış yap'}</button>
            </div>}

            {/* Çıkış Butonu */}
            {currentUser && (
              <button
                onClick={() => void logout()}
                disabled={loggingOut}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--gray-400)',
                  cursor: 'pointer',
                  padding: 4,
                  borderRadius: 6,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s',
                  marginLeft: 'auto'
                }}
                className="sidebar-logout-btn"
                title={loggingOut ? 'Çıkış yapılıyor…' : 'Güvenli Çıkış'}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" x2="9" y1="12" y2="12" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
