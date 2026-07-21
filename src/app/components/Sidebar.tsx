'use client';

import React from 'react';
import { useApp } from '../context/AppContext';
import { IconLogo, IconClose, navIcons } from './Icons';

const menuSections = [
  {
    title: 'Ana Menü',
    items: [
      { id: 'dashboard'    as const, label: 'Dashboard' },
      { id: 'patients'     as const, label: 'Hastalar',      badge: null },
      { id: 'appointments' as const, label: 'Randevular',    badge: '4' },
    ],
  },
  {
    title: 'İşlemler',
    items: [
      { id: 'recall'          as const, label: 'Recall',              badge: '5' },
      { id: 'activity-log'    as const, label: 'Aktivite Kaydı',      badge: null },
      { id: 'sgk'             as const, label: 'SGK & Reçete',        badge: null },
      { id: 'sgk-receivables' as const, label: 'SGK Katkı Alacakları', badge: null },
      { id: 'stock'           as const, label: 'Stok & Aksesuar',     badge: null },
      { id: 'assets'          as const, label: 'Demirbaşlar',         badge: null },
      { id: 'cash'            as const, label: 'Kasa & Tahsilat',     badge: null },
      { id: 'service'         as const, label: 'Teknik Servis',       badge: null },
      { id: 'suppliers'       as const, label: 'Tedarikçiler',        badge: null },
      { id: 'expenses'        as const, label: 'Masraflar',           badge: null },
    ],
  },
  {
    title: 'Yönetim',
    items: [
      { id: 'reports'           as const, label: 'Raporlar',          badge: null },
      { id: 'branches'          as const, label: 'Şubeler & Yetki',   badge: null },
      { id: 'branch-activities' as const, label: 'Şube Aktiviteleri', badge: null },
      { id: 'audit-log'         as const, label: 'İşlem Kayıtları',   badge: null },
      { id: 'settings'          as const, label: 'Ayarlar',           badge: null },
      { id: 'support'           as const, label: 'Destek',            badge: null },
    ],
  },
];

export default function Sidebar() {
  const { currentPage, setCurrentPage, sidebarOpen, setSidebarOpen, currentUser, logout, isPlatformAdmin } = useApp();

  const activeSections = React.useMemo(() => {
    if (isPlatformAdmin) {
      return [
        ...menuSections,
        {
          title: 'SaaS Yönetimi',
          items: [
            { id: 'super-admin' as const, label: 'SaaS Panel', badge: null }
          ]
        }
      ];
    }
    return menuSections;
  }, [isPlatformAdmin, menuSections]);

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
                      onClick={() => setCurrentPage(item.id)}
                      title={item.label}
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
                {currentUser 
                  ? `${currentUser.user_metadata?.first_name?.[0] || ''}${currentUser.user_metadata?.last_name?.[0] || ''}`.toUpperCase() || 'U'
                  : 'EA'}
              </div>
              <div className="sidebar-user-info">
                <div className="sidebar-user-name" style={{ color: 'var(--gray-200)', fontWeight: 600, fontSize: '0.82rem' }}>
                  {currentUser 
                    ? `${currentUser.user_metadata?.first_name || ''} ${currentUser.user_metadata?.last_name || ''}`.trim() || currentUser.email 
                    : 'Dr. Elif Arslan'}
                </div>
                <div className="sidebar-user-role" style={{ fontSize: '0.7rem', color: 'var(--gray-400)' }}>
                  {currentUser 
                    ? (currentUser.user_metadata?.role || 'Odyolog') 
                    : 'Odyolog · Kadıköy'}
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
