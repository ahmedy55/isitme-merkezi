'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { getDisplayName, getUserRole, getUserInitials } from '../lib/userHelpers';
import { countOpenAppointments } from '../lib/appointmentStatus';
import { useBranch } from '../context/BranchContext';
import styles from './Sidebar.module.css';

interface NavItemDef {
  id: string;
  label: string;
  badge?: string | number | null;
  icon: React.ReactNode;
  requiredRoles?: string[];
}

interface NavSectionDef {
  title?: string;
  items: NavItemDef[];
}

export default function Sidebar() {
  const {
    currentPage,
    setCurrentPage,
    sidebarOpen,
    setSidebarOpen,
    currentUser,
    logout,
    loggingOut,
    usersList,
    appointmentsList,
  } = useApp();
  const { activeBranch } = useBranch();
  const pendingAppointmentsCount = useMemo(
    () => countOpenAppointments(appointmentsList, activeBranch),
    [appointmentsList, activeBranch],
  );

  const [searchQuery, setSearchQuery] = useState('');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcut: Ctrl+K or Cmd+K focuses menu search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Icon definitions matching the exact screenshot
  const icons = useMemo(() => ({
    dashboard: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1.5"></rect>
        <rect x="14" y="3" width="7" height="7" rx="1.5"></rect>
        <rect x="3" y="14" width="7" height="7" rx="1.5"></rect>
        <rect x="14" y="14" width="7" height="7" rx="1.5"></rect>
      </svg>
    ),
    patients: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
        <circle cx="9" cy="7" r="4"></circle>
        <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
      </svg>
    ),
    appointments: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
        <line x1="16" y1="2" x2="16" y2="6"></line>
        <line x1="8" y1="2" x2="8" y2="6"></line>
        <line x1="3" y1="10" x2="21" y2="10"></line>
      </svg>
    ),
    recall: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"></circle>
        <polyline points="12 6 12 12 16 14"></polyline>
      </svg>
    ),
    activity: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
      </svg>
    ),
    sgk: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
        <polyline points="14 2 14 8 20 8"></polyline>
        <line x1="16" y1="13" x2="8" y2="13"></line>
        <line x1="16" y1="17" x2="8" y2="17"></line>
        <polyline points="10 9 9 9 8 9"></polyline>
      </svg>
    ),
    sgkReceivables: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
        <polyline points="9 12 11 14 15 10"></polyline>
      </svg>
    ),
    stock: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
        <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
        <line x1="12" y1="22.08" x2="12" y2="12"></line>
      </svg>
    ),
    assets: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="3" width="20" height="14" rx="2"></rect>
        <line x1="8" y1="21" x2="16" y2="21"></line>
        <line x1="12" y1="17" x2="12" y2="21"></line>
      </svg>
    ),
    cash: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="6" width="20" height="12" rx="2"></rect>
        <circle cx="12" cy="12" r="2"></circle>
        <path d="M6 12h.01M18 12h.01"></path>
      </svg>
    ),
    service: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path>
      </svg>
    ),
    suppliers: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="1" y="3" width="15" height="13"></rect>
        <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon>
        <circle cx="5.5" cy="18.5" r="2.5"></circle>
        <circle cx="18.5" cy="18.5" r="2.5"></circle>
      </svg>
    ),
    reports: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="10"></line>
        <line x1="12" y1="20" x2="12" y2="4"></line>
        <line x1="6" y1="20" x2="6" y2="14"></line>
      </svg>
    ),
    branches: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="4" y="2" width="16" height="20" rx="2"></rect>
        <line x1="9" y1="22" x2="9" y2="18"></line>
        <line x1="15" y1="22" x2="15" y2="18"></line>
        <line x1="9" y1="18" x2="15" y2="18"></line>
        <line x1="8" y1="6" x2="8.01" y2="6"></line>
        <line x1="16" y1="6" x2="16.01" y2="6"></line>
        <line x1="8" y1="10" x2="8.01" y2="10"></line>
        <line x1="16" y1="10" x2="16.01" y2="10"></line>
        <line x1="8" y1="14" x2="8.01" y2="14"></line>
        <line x1="16" y1="14" x2="16.01" y2="14"></line>
      </svg>
    ),
    branchActivities: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2"></rect>
        <line x1="12" y1="3" x2="12" y2="21"></line>
      </svg>
    ),
    auditLog: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
        <polyline points="14 2 14 8 20 8"></polyline>
        <line x1="16" y1="13" x2="8" y2="13"></line>
        <line x1="16" y1="17" x2="8" y2="17"></line>
        <polyline points="10 9 9 9 8 9"></polyline>
      </svg>
    ),
    settings: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3"></circle>
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
      </svg>
    ),
    support: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 18v-6a9 9 0 0 1 18 0v6"></path>
        <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"></path>
        <path d="M12 21a9.004 9.004 0 0 1-9-9"></path>
      </svg>
    ),
  }), []);

  // Sections and navigation list matching exact hierarchy in screenshot
  const navSections: NavSectionDef[] = useMemo(() => [
    {
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: icons.dashboard },
        { id: 'patients', label: 'Hastalar', icon: icons.patients },
        { id: 'appointments', label: 'Randevular', badge: pendingAppointmentsCount || null, icon: icons.appointments },
      ],
    },
    {
      title: 'İŞLEMLER',
      items: [
        { id: 'recall', label: 'Recall', badge: 2, icon: icons.recall },
        { id: 'activity-log', label: 'Aktivite Kaydı', icon: icons.activity },
        { id: 'sgk', label: 'SGK & Reçete', icon: icons.sgk },
        { id: 'sgk-receivables', label: 'SGK Ödeme Takvimi', icon: icons.sgkReceivables },
        { id: 'stock', label: 'Stok & Aksesuar', icon: icons.stock },
        { id: 'assets', label: 'Demirbaşlar', icon: icons.assets },
        { id: 'cash', label: 'Kasa, Tahsilat & Masraflar', icon: icons.cash },
        { id: 'service', label: 'Teknik Servis', icon: icons.service },
        { id: 'suppliers', label: 'Tedarikçiler', icon: icons.suppliers },
      ],
    },
    {
      title: 'YÖNETİM',
      items: [
        { id: 'reports', label: 'Raporlar', icon: icons.reports },
        { id: 'branches', label: 'Şubeler & Yetki', icon: icons.branches },
        { id: 'branch-activities', label: 'Şube Aktiviteleri', icon: icons.branchActivities },
        { id: 'audit-log', label: 'İşlem Kayıtları', icon: icons.auditLog },
        { id: 'settings', label: 'Ayarlar', icon: icons.settings },
        { id: 'support', label: 'Destek', icon: icons.support },
      ],
    },
  ], [icons, pendingAppointmentsCount]);

  // Filter sections by search query
  const filteredSections = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return navSections;

    return navSections
      .map(sec => ({
        ...sec,
        items: sec.items.filter(item => item.label.toLowerCase().includes(q)),
      }))
      .filter(sec => sec.items.length > 0);
  }, [navSections, searchQuery]);

  return (
    <>
      {/* Mobile Dark Overlay */}
      <div
        className={`${styles.mobileOverlay} ${sidebarOpen ? styles.overlayVisible : ''}`}
        onClick={() => setSidebarOpen(false)}
        aria-hidden="true"
      />

      <aside className={`${styles.sidebarContainer} ${sidebarOpen ? styles.sidebarOpenMobile : ''}`}>
        {/* ── Brand Header ── */}
        <div className={styles.brandHeader}>
          <div className={styles.brandLeft}>
            {/* Orange Gradient Logo Mark with Sound Wave */}
            <div className={styles.logoSquare}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
                <line x1="6" y1="10" x2="6" y2="14" />
                <line x1="10" y1="6" x2="10" y2="18" />
                <line x1="14" y1="8" x2="14" y2="16" />
                <line x1="18" y1="11" x2="18" y2="13" />
              </svg>
            </div>
            <div className={styles.brandCopy}>
              <span className={styles.brandName}>AudiPro</span>
              <span className={styles.brandDesc}>İşitme Merkezi Yönetimi</span>
            </div>
          </div>

          {/* Collapse Button « */}
          <button
            type="button"
            className={styles.btnCollapse}
            onClick={() => setSidebarOpen(false)}
            title="Menüyü Daralt"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="11 17 6 12 11 7"></polyline>
              <polyline points="18 17 13 12 18 7"></polyline>
            </svg>
          </button>
        </div>

        {/* ── Search Bar Input ── */}
        <div className={styles.searchWrap}>
          <span className={styles.searchIcon}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
          </span>
          <input
            ref={searchInputRef}
            type="text"
            className={styles.searchInput}
            placeholder="Menüde ara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <span className={styles.shortcutBadge}>Ctrl + K</span>
        </div>

        {/* ── Scrollable Nav Area ── */}
        <nav className={styles.navScrollArea}>
          {filteredSections.map((sec, idx) => (
            <div key={sec.title || `sec-${idx}`} className={styles.sectionBlock}>
              {sec.title && (
                <div className={styles.sectionHeader}>
                  <span>{sec.title}</span>
                  <span className={styles.sectionDivider} />
                </div>
              )}
              <div className={styles.menuList}>
                {sec.items.map((item) => {
                  const isActive = currentPage === item.id;
                  const hasBadge = item.badge !== undefined && item.badge !== null;

                  return (
                    <button
                      key={item.id}
                      type="button"
                      className={`${styles.menuItem} ${isActive ? styles.itemActive : ''} ${!hasBadge ? styles.menuItemWithoutBadge : ''}`}
                      onClick={() => {
                        setCurrentPage(item.id as any);
                        setSidebarOpen(false);
                      }}
                      title={item.label}
                    >
                      <span className={styles.menuItemIcon}>{item.icon}</span>
                      <span className={styles.menuItemLabel}>{item.label}</span>

                      {hasBadge && (
                        <span className={styles.menuItemBadge}>{item.badge}</span>
                      )}

                      <span className={styles.menuItemChevron}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="9 18 15 12 9 6"></polyline>
                        </svg>
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* ── Footer: User Profile & Logout ── */}
        <div className={styles.sidebarFooter}>
          <button
            type="button"
            className={styles.userProfileBtn}
            onClick={() => setShowUserMenu(!showUserMenu)}
          >
            <div className={styles.avatarWrap}>
              <div className={styles.avatarCircle}>
                {getUserInitials(getDisplayName(currentUser, usersList) || 'Ahmet')}
              </div>
              <span className={styles.onlineDot} />
            </div>

            <div className={styles.userInfo}>
              <span className={styles.userName}>
                {getDisplayName(currentUser, usersList) || 'Ahmet'}
              </span>
              <span className={styles.userRole}>
                {getUserRole(currentUser, usersList) || 'Firma Yöneticisi'}
              </span>
            </div>
          </button>

          {/* User Popover Menu */}
          {showUserMenu && (
            <div className={styles.userPopupMenu}>
              <button
                type="button"
                className={styles.popupMenuItem}
                onClick={() => {
                  setCurrentPage('profile');
                  setShowUserMenu(false);
                  setSidebarOpen(false);
                }}
              >
                Profilim
              </button>
              <button
                type="button"
                className={styles.popupMenuItem}
                onClick={() => {
                  setCurrentPage('org-select');
                  setShowUserMenu(false);
                  setSidebarOpen(false);
                }}
              >
                Klinik Değiştir
              </button>
              <button
                type="button"
                className={styles.popupMenuItem}
                disabled={loggingOut}
                onClick={() => {
                  setShowUserMenu(false);
                  void logout();
                }}
              >
                {loggingOut ? 'Çıkış yapılıyor...' : 'Çıkış Yap'}
              </button>
            </div>
          )}

          {/* Quick Exit Button */}
          <button
            type="button"
            className={styles.btnLogout}
            title={loggingOut ? 'Çıkış yapılıyor...' : 'Güvenli Çıkış'}
            disabled={loggingOut}
            onClick={() => void logout()}
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
              <polyline points="16 17 21 12 16 7"></polyline>
              <line x1="21" y1="12" x2="9" y2="12"></line>
            </svg>
          </button>
        </div>
      </aside>
    </>
  );
}
