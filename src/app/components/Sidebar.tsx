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
      { id: 'recall'  as const, label: 'Recall',          badge: '5' },
      { id: 'sgk'     as const, label: 'SGK & Reçete',    badge: null },
      { id: 'stock'   as const, label: 'Stok & Aksesuar', badge: null },
      { id: 'cash'    as const, label: 'Kasa & Tahsilat', badge: null },
      { id: 'service' as const, label: 'Teknik Servis',   badge: null },
    ],
  },
  {
    title: 'Yönetim',
    items: [
      { id: 'reports'  as const, label: 'Raporlar',          badge: null },
      { id: 'branches' as const, label: 'Şubeler & Yetki',   badge: null },
      { id: 'settings' as const, label: 'Ayarlar',           badge: null },
    ],
  },
];

export default function Sidebar() {
  const { currentPage, setCurrentPage, sidebarOpen, setSidebarOpen } = useApp();

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
        {menuSections.map((section) => {
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
          <div className="sidebar-user">
            <div className="sidebar-user-avatar">EA</div>
            <div className="sidebar-user-info">
              <div className="sidebar-user-name">Dr. Elif Arslan</div>
              <div className="sidebar-user-role">Odyolog · Kadıköy</div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
