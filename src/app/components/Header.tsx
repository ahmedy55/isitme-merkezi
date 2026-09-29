'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { useBranch } from '../context/BranchContext';
import { useBranchScope } from '../hooks/useBranchScope';
import { getDisplayName, getUserRole, getUserInitials } from '../lib/userHelpers';
import styles from './Header.module.css';

export default function Header() {
  const {
    toggleSidebar,
    patientsList: allPatients,
    setSelectedPatientId,
    setCurrentPage,
    currentUser,
    branchesList,
    stockList: allStock,
    usersList,
    logout,
    loggingOut,
    addToast
  } = useApp();

  const { activeBranch, selectBranchBySlug, allowedBranches } = useBranch();
  const { matches } = useBranchScope();

  const patientsList = useMemo(() => allPatients.filter(p => matches(p.branch, p.branchId)), [allPatients, matches]);
  const stockList = useMemo(() => allStock.filter(s => matches(s.branch, s.branchId)), [allStock, matches]);

  const [showNotifications, setShowNotifications] = useState(false);
  const [showBranchDropdown, setShowBranchDropdown] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Dropdown outside click handler
  const branchDropdownRef = useRef<HTMLDivElement | null>(null);
  const notifDropdownRef = useRef<HTMLDivElement | null>(null);
  const profileDropdownRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (branchDropdownRef.current && !branchDropdownRef.current.contains(event.target as Node)) {
        setShowBranchDropdown(false);
      }
      if (notifDropdownRef.current && !notifDropdownRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Search submit handler
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;
    const phoneQuery = searchTerm.replace(/\D/g, '');
    const foundPatient = patientsList.find(p => 
      `${p.firstName} ${p.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.tc.includes(searchTerm) || (phoneQuery.length >= 3 && p.phone.replace(/\D/g, '').includes(phoneQuery))
    );

    if (foundPatient) {
      setSelectedPatientId(foundPatient.id);
      setCurrentPage('patient-detail');
      setSearchTerm('');
    } else {
      setCurrentPage('patients');
    }
  };

  // Dynamic branch label
  const branchButtonLabel = useMemo(() => {
    if (activeBranch.mode === 'all') return 'Tüm Şubeler (Konsolide)';
    if (activeBranch.mode === 'single') {
      const b = branchesList.find(x => x.id === activeBranch.branchId);
      return b ? b.name : 'Seçili Şube';
    }
    return 'Şube Seçin';
  }, [activeBranch, branchesList]);

  // Notifications
  const notifications = useMemo(() => [
    { id: 1, title: 'Kritik Stok Uyarısı', desc: 'Oticon More 1 stok seviyesi 2 adede düştü.', time: '10 dk önce', page: 'stock' },
    { id: 2, title: 'Yeni Randevu Talebi', desc: 'Ayşe Yılmaz yarın 14:30 için randevu oluşturdu.', time: '25 dk önce', page: 'appointments' },
    { id: 3, title: 'SGK Reçete Onayı', desc: '5 adet reçete onay bekliyor.', time: '1 saat önce', page: 'sgk' },
  ], []);

  const userName = getDisplayName(currentUser, usersList) || 'Ahmet Yılmaz';
  const userInitials = getUserInitials(userName) || 'AH';
  const userRole = getUserRole(currentUser, usersList) || 'Firma Yöneticisi';
  const userEmail = (currentUser as any)?.email || 'ahmet@isitemerkezi.com';

  return (
    <header className={styles.headerContainer}>
      {/* ── Left Side: Mobile Menu Button & Search Input ── */}
      <div className={styles.headerLeft}>
        <button
          type="button"
          className={styles.hamburgerBtn}
          onClick={toggleSidebar}
          aria-label="Menüyü aç/kapat"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="12" x2="21" y2="12"></line>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <line x1="3" y1="18" x2="21" y2="18"></line>
          </svg>
        </button>

        <form className={styles.searchForm} onSubmit={handleSearchSubmit}>
          <span className={styles.searchIcon}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
          </span>
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Hasta, TC veya telefon ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <kbd className={styles.shortcutKbd}>Ctrl + K</kbd>
        </form>
      </div>

      {/* ── Right Side Controls ── */}
      <div className={styles.headerRight}>
        {/* Branch Selector Pill */}
        <div ref={branchDropdownRef} style={{ position: 'relative' }}>
          <button
            type="button"
            className={styles.branchSelectBtn}
            onClick={() => setShowBranchDropdown(!showBranchDropdown)}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="4" y="2" width="16" height="20" rx="2"></rect>
              <line x1="9" y1="22" x2="9" y2="18"></line>
              <line x1="15" y1="22" x2="15" y2="18"></line>
              <line x1="9" y1="18" x2="15" y2="18"></line>
              <line x1="8" y1="6" x2="8.01" y2="6"></line>
              <line x1="16" y1="6" x2="16.01" y2="6"></line>
              <line x1="8" y1="10" x2="8.01" y2="10"></line>
              <line x1="16" y1="10" x2="16.01" y2="10"></line>
            </svg>
            <span>{branchButtonLabel}</span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </button>

          {showBranchDropdown && (
            <div className={styles.branchDropdown}>
              <button
                type="button"
                className={`${styles.branchItem} ${activeBranch.mode === 'all' ? styles.branchItemActive : ''}`}
                onClick={() => {
                  selectBranchBySlug('all');
                  setShowBranchDropdown(false);
                }}
              >
                <span>Tüm Şubeler (Konsolide)</span>
                {activeBranch.mode === 'all' && <span>✓</span>}
              </button>

              {branchesList
                .filter(b => allowedBranches === null || allowedBranches.includes(b.id))
                .map(branch => (
                  <button
                    key={branch.id}
                    type="button"
                    className={`${styles.branchItem} ${activeBranch.mode === 'single' && activeBranch.branchId === branch.id ? styles.branchItemActive : ''}`}
                    onClick={() => {
                      selectBranchBySlug(branch.slug || branch.id);
                      setShowBranchDropdown(false);
                    }}
                  >
                    <span>{branch.name}</span>
                    {activeBranch.mode === 'single' && activeBranch.branchId === branch.id && <span>✓</span>}
                  </button>
                ))}
            </div>
          )}
        </div>

        {/* Notification Bell */}
        <div ref={notifDropdownRef} style={{ position: 'relative' }}>
          <button
            type="button"
            className={styles.bellBtn}
            onClick={() => setShowNotifications(!showNotifications)}
            title="Bildirimler"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
            </svg>
            <span className={styles.bellBadge}>3</span>
          </button>

          {showNotifications && (
            <div className={styles.notifDropdown}>
              <div className={styles.notifHeader}>
                <span className={styles.notifTitle}>Bildirimler (3)</span>
                <span className={styles.notifClear} onClick={() => addToast({ type: 'info', message: 'Tüm bildirimler okundu olarak işaretlendi.' })}>
                  Tümünü Oku
                </span>
              </div>
              <div>
                {notifications.map(n => (
                  <div
                    key={n.id}
                    className={styles.notifItem}
                    onClick={() => {
                      setCurrentPage(n.page as any);
                      setShowNotifications(false);
                    }}
                  >
                    <div className={styles.notifItemTitle}>{n.title}</div>
                    <div className={styles.notifItemDesc}>{n.desc}</div>
                    <div className={styles.notifItemTime}>{n.time}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── User Profile Trigger & Rich Dropdown Card ── */}
        <div ref={profileDropdownRef} style={{ position: 'relative' }}>
          <button
            type="button"
            className={styles.profileTriggerBtn}
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            aria-expanded={showProfileMenu}
          >
            <div className={styles.triggerAvatar}>
              {userInitials}
            </div>

            <div className={styles.triggerInfo}>
              <span className={styles.triggerName}>{userName.split(' ')[0]}</span>
              <span className={styles.triggerRole}>{userRole}</span>
            </div>

            <span className={styles.triggerChevron}>
              {showProfileMenu ? (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="18 15 12 9 6 15"></polyline>
                </svg>
              ) : (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              )}
            </span>
          </button>

          {/* ── Floating Profile Card Matching Screenshot Exactly ── */}
          {showProfileMenu && (
            <div className={styles.profileCard}>
              {/* Header Info */}
              <div className={styles.profileCardTop}>
                <div className={styles.profileCardUser}>
                  <div className={styles.cardAvatarWrap}>
                    <div className={styles.cardAvatar}>
                      {userInitials}
                    </div>
                    <span className={styles.cardOnlineDot} />
                  </div>

                  <div className={styles.cardUserDetails}>
                    <span className={styles.cardUserName}>{userName}</span>
                    <span className={styles.cardRoleBadge}>{userRole}</span>
                    <span className={styles.cardUserEmail}>{userEmail}</span>
                  </div>
                </div>

                <button
                  type="button"
                  className={styles.btnEditProfile}
                  title="Profili Düzenle"
                  onClick={() => {
                    setCurrentPage('profile');
                    setShowProfileMenu(false);
                  }}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 20h9"></path>
                    <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
                  </svg>
                </button>
              </div>

              {/* Navigation List */}
              <div className={styles.profileNavList}>
                {/* 1. Profilim */}
                <button
                  type="button"
                  className={styles.profileNavItem}
                  onClick={() => {
                    setCurrentPage('profile');
                    setShowProfileMenu(false);
                  }}
                >
                  <div className={`${styles.itemIconBox} ${styles.iconMint}`}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                      <circle cx="12" cy="7" r="4"></circle>
                    </svg>
                  </div>
                  <div className={styles.itemContent}>
                    <span className={styles.itemTitle}>Profilim</span>
                    <span className={styles.itemSubtitle}>Kişisel bilgilerinizi görüntüleyin ve düzenleyin.</span>
                  </div>
                  <span className={styles.itemChevron}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="9 18 15 12 9 6"></polyline>
                    </svg>
                  </span>
                </button>

                {/* 2. Klinik değiştir */}
                <button
                  type="button"
                  className={styles.profileNavItem}
                  onClick={() => {
                    setCurrentPage('org-select');
                    setShowProfileMenu(false);
                  }}
                >
                  <div className={`${styles.itemIconBox} ${styles.iconBlue}`}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="4" y="2" width="16" height="20" rx="2"></rect>
                      <line x1="9" y1="22" x2="9" y2="18"></line>
                      <line x1="15" y1="22" x2="15" y2="18"></line>
                      <line x1="9" y1="18" x2="15" y2="18"></line>
                      <line x1="8" y1="6" x2="8.01" y2="6"></line>
                      <line x1="16" y1="6" x2="16.01" y2="6"></line>
                      <line x1="8" y1="10" x2="8.01" y2="10"></line>
                      <line x1="16" y1="10" x2="16.01" y2="10"></line>
                    </svg>
                  </div>
                  <div className={styles.itemContent}>
                    <span className={styles.itemTitle}>Klinik değiştir</span>
                    <span className={styles.itemSubtitle}>Farklı bir klinikte oturum açın.</span>
                  </div>
                  <span className={styles.itemChevron}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="9 18 15 12 9 6"></polyline>
                    </svg>
                  </span>
                </button>

                {/* 3. Ayarlar */}
                <button
                  type="button"
                  className={styles.profileNavItem}
                  onClick={() => {
                    setCurrentPage('settings');
                    setShowProfileMenu(false);
                  }}
                >
                  <div className={`${styles.itemIconBox} ${styles.iconGray}`}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="3"></circle>
                      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                    </svg>
                  </div>
                  <div className={styles.itemContent}>
                    <span className={styles.itemTitle}>Ayarlar</span>
                    <span className={styles.itemSubtitle}>Sistem tercihleri ve bildirim ayarları.</span>
                  </div>
                  <span className={styles.itemChevron}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="9 18 15 12 9 6"></polyline>
                    </svg>
                  </span>
                </button>

                {/* 4. Yardım & Destek */}
                <button
                  type="button"
                  className={styles.profileNavItem}
                  onClick={() => {
                    setCurrentPage('support');
                    setShowProfileMenu(false);
                  }}
                >
                  <div className={`${styles.itemIconBox} ${styles.iconAmber}`}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"></circle>
                      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
                      <line x1="12" y1="17" x2="12.01" y2="17"></line>
                    </svg>
                  </div>
                  <div className={styles.itemContent}>
                    <span className={styles.itemTitle}>Yardım & Destek</span>
                    <span className={styles.itemSubtitle}>Kılavuzlar, sık sorulan sorular.</span>
                  </div>
                  <span className={styles.itemChevron}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="9 18 15 12 9 6"></polyline>
                    </svg>
                  </span>
                </button>

                {/* 5. Oturum Geçmişi */}
                <button
                  type="button"
                  className={styles.profileNavItem}
                  onClick={() => {
                    setCurrentPage('audit-log');
                    setShowProfileMenu(false);
                  }}
                >
                  <div className={`${styles.itemIconBox} ${styles.iconPurple}`}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                      <polyline points="14 2 14 8 20 8"></polyline>
                      <line x1="16" y1="13" x2="8" y2="13"></line>
                      <line x1="16" y1="17" x2="8" y2="17"></line>
                    </svg>
                  </div>
                  <div className={styles.itemContent}>
                    <span className={styles.itemTitle}>Oturum Geçmişi</span>
                    <span className={styles.itemSubtitle}>Son girişler ve aktif oturumlar.</span>
                  </div>
                  <span className={styles.itemChevron}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="9 18 15 12 9 6"></polyline>
                    </svg>
                  </span>
                </button>

                {/* 6. Çıkış yap */}
                <button
                  type="button"
                  className={styles.profileNavItem}
                  disabled={loggingOut}
                  onClick={() => {
                    setShowProfileMenu(false);
                    void logout();
                  }}
                >
                  <div className={`${styles.itemIconBox} ${styles.iconRed}`}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                      <polyline points="16 17 21 12 16 7"></polyline>
                      <line x1="21" y1="12" x2="9" y2="12"></line>
                    </svg>
                  </div>
                  <div className={styles.itemContent}>
                    <span className={`${styles.itemTitle} ${styles.itemTitleDanger}`}>
                      {loggingOut ? 'Çıkış yapılıyor...' : 'Çıkış yap'}
                    </span>
                    <span className={styles.itemSubtitle}>Sistemden güvenli şekilde çıkış yapın.</span>
                  </div>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
