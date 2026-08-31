'use client';

import React from 'react';
import { useApp } from '../context/AppContext';
import { IconLogo, IconClose, navIcons } from './Icons';
import { getDisplayName, getUserRole, getUserInitials } from '../lib/userHelpers';

export default function Sidebar() {
  const { currentPage, setCurrentPage, sidebarOpen, setSidebarOpen, currentUser, logout, isPlatformAdmin, appointmentsList, recallList, usersList } = useApp();

  const pendingAppointmentsCount = React.useMemo(() => {
    return (appointmentsList || []).filter(a => a.status === 'Bekliyor').length;
  }, [appointmentsList]);

  const pendingRecallCount = React.useMemo(() => {
    return (recallList || []).filter(r => r.status === 'Bekliyor').length;
  }, [recallList]);

  const activeSections = React.useMemo(() => {
    // Kullanıcı rolünü belirle
    const userRole = getUserRole(currentUser, usersList);
    const userRoles: string[] = Array.isArray(currentUser?.user_metadata?.roles)
      ? currentUser.user_metadata.roles
      : (currentUser?.user_metadata?.role ? [currentUser.user_metadata.role] : [userRole]);

    // Güvenli tam eşleşme: substring yok, sadece exact match veya Platform/Firma Yöneticisi bypass
    const hasRole = (required?: string[]) => {
      if (!required || required.length === 0) return true;
      if (isPlatformAdmin) return true;
      // Sadece 'Firma Yöneticisi' tam eşleşmesi bypass verir — 'Şube Yöneticisi' vermez
      if (userRoles.includes('Firma Yöneticisi')) return true;
      return required.some(req =>
        userRoles.some(ur => ur.trim().toLowerCase() === req.trim().toLowerCase())
      );
    };

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
          { id: 'sgk-receivables' as const, label: 'SGK Katkı Alacakları', badge: null, requiredRoles: ['Firma Yöneticisi', 'Şube Yöneticisi', 'Muhasebe'] },
          { id: 'stock'           as const, label: 'Stok & Aksesuar', badge: null, requiredRoles: ['Firma Yöneticisi', 'Şube Yöneticisi', 'Odyometrist', 'Odyolog', 'Sekreter', 'Muhasebe'] },
          { id: 'assets'          as const, label: 'Demirbaşlar', badge: null, requiredRoles: ['Firma Yöneticisi', 'Şube Yöneticisi', 'Odyometrist', 'Odyolog', 'Muhasebe'] },
          { id: 'cash'            as const, label: 'Kasa & Tahsilat', badge: null, requiredRoles: ['Firma Yöneticisi', 'Şube Yöneticisi', 'Muhasebe'] },
          { id: 'service'         as const, label: 'Teknik Servis', badge: null, requiredRoles: ['Firma Yöneticisi', 'Şube Yöneticisi', 'Odyometrist', 'Odyolog'] },
          { id: 'suppliers'       as const, label: 'Tedarikçiler', badge: null, requiredRoles: ['Firma Yöneticisi', 'Şube Yöneticisi', 'Muhasebe'] },
          { id: 'expenses'        as const, label: 'Masraflar', badge: null, requiredRoles: ['Firma Yöneticisi', 'Şube Yöneticisi', 'Muhasebe'] },
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
        ].filter(item => hasRole((item as any).requiredRoles)),
      },
    ];

    if (isPlatformAdmin) {
      return [
        ...dynamicSections,
        {
          title: 'SaaS Yönetimi',
          items: [
            { id: 'super-admin' as const, label: 'SaaS Panel', badge: null }
          ]
        }
      ];
    }
    return dynamicSections;
  }, [isPlatformAdmin, pendingAppointmentsCount, pendingRecallCount, currentUser]);

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
          <div className="sidebar-user" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
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
            </div>

            {/* Çıkış Butonu */}
            {currentUser && (
              <button
                onClick={logout}
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
                title="Güvenli Çıkış"
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
