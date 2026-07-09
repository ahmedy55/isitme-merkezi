'use client';

import React from 'react';
import { useApp } from '../context/AppContext';

export default function Sidebar() {
  const { currentPage, setCurrentPage } = useApp();

  const menuSections = [
    {
      title: 'Ana Menü',
      items: [
        { id: 'dashboard' as const, icon: '📊', label: 'Dashboard' },
        { id: 'patients' as const, icon: '👤', label: 'Hastalar', badge: null },
        { id: 'appointments' as const, icon: '📅', label: 'Randevular', badge: '4' },
      ],
    },
    {
      title: 'İşlemler',
      items: [
        { id: 'recall' as const, icon: '🔄', label: 'Recall', badge: '5' },
        { id: 'sgk' as const, icon: '📋', label: 'SGK & Reçete', badge: null },
        { id: 'stock' as const, icon: '📦', label: 'Stok & Aksesuar', badge: null },
        { id: 'cash' as const, icon: '💰', label: 'Kasa & Tahsilat', badge: null },
        { id: 'service' as const, icon: '🔧', label: 'Teknik Servis', badge: null },
      ],
    },
    {
      title: 'Yönetim',
      items: [
        { id: 'reports' as const, icon: '📈', label: 'Raporlar', badge: null },
        { id: 'branches' as const, icon: '🏢', label: 'Şubeler & Yetki', badge: null },
        { id: 'settings' as const, icon: '⚙️', label: 'Ayarlar', badge: null },
      ],
    },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">🦻</div>
        <div className="sidebar-logo-text">
          <h1>AudioPro</h1>
          <span>İşitme Merkezi Yönetimi</span>
        </div>
      </div>

      {menuSections.map((section) => (
        <div key={section.title} className="sidebar-section">
          <div className="sidebar-section-title">{section.title}</div>
          <nav className="sidebar-nav">
            {section.items.map((item) => (
              <button
                key={item.id}
                className={`sidebar-link ${currentPage === item.id ? 'active' : ''}`}
                onClick={() => setCurrentPage(item.id)}
              >
                <span className="sidebar-link-icon">{item.icon}</span>
                {item.label}
                {item.badge && (
                  <span className="sidebar-link-badge">{item.badge}</span>
                )}
              </button>
            ))}
          </nav>
        </div>
      ))}

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
  );
}
