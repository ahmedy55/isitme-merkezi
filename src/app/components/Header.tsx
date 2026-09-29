'use client';

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useBranch } from '../context/BranchContext';
import { useBranchScope } from '../hooks/useBranchScope';
import { BranchService } from '../services/BranchService';
import { IconMenu, IconSearch, IconBell } from './Icons';

import { getDisplayName, getUserRole, getUserInitials } from '../lib/userHelpers';

const pageTitles: Record<string, { title: string; subtitle: string }> = {
  dashboard:        { title: 'Dashboard',            subtitle: 'Merkezin genel durumu' },
  patients:         { title: 'Hastalar',              subtitle: 'Hasta kayıtları ve odyogram yönetimi' },
  'patient-detail': { title: 'Hasta Detay',           subtitle: 'Hasta bilgileri ve geçmişi' },
  appointments:     { title: 'Randevular',            subtitle: 'Takvim ve randevu yönetimi' },
  recall:           { title: 'Recall Otomasyonu',     subtitle: 'Yenileme ve hatırlatma fırsatları' },
  sgk:              { title: 'SGK & Reçete',          subtitle: 'Hasta reçete ve hak ediş kayıtları' },
  'sgk-receivables': { title: 'SGK Ödeme Takvimi',    subtitle: 'Dönem faturaları ve beklenen ödeme ayları' },
  stock:            { title: 'Stok & Aksesuar',       subtitle: 'Cihaz, pil ve aksesuar envanter yönetimi' },
  cash:             { title: 'Kasa & Tahsilat',       subtitle: 'Satış, tahsilat ve prim takibi' },
  expenses:         { title: 'Kasa, Tahsilat & Masraflar', subtitle: 'Finansal hareketler ve masraflar' },
  service:          { title: 'Teknik Servis',         subtitle: 'Cihaz tamir, bakım ve servis takibi' },
  reports:          { title: 'Raporlama & Analitik',  subtitle: 'Performans ve finansal raporlar' },
  branches:         { title: 'Şubeler & Yetki',       subtitle: 'Çoklu şube ve rol yönetimi' },
  settings:         { title: 'Ayarlar',               subtitle: 'Sistem ve entegrasyon ayarları' },
  assets:           { title: 'Demirbaşlar',           subtitle: 'Şube demirbaşları ve bakımları' },
  suppliers:        { title: 'Tedarikçiler',          subtitle: 'Tedarikçi ve alış kayıtları' },
  'activity-log':   { title: 'Aktivite Kaydı',        subtitle: 'Hasta ve şube aktiviteleri' },
  'branch-activities': { title: 'Şube Aktiviteleri', subtitle: 'Şubeler arası hareketler' },
  'audit-log':      { title: 'İşlem Kayıtları',      subtitle: 'Kullanıcı ve sistem işlem geçmişi' },
  support:          { title: 'Destek',                subtitle: 'Destek talepleri ve yardım' },
  profile:          { title: 'Profilim',              subtitle: 'Hesap ve erişim bilgileriniz' },
};

export default function Header() {
  const { currentPage, toggleSidebar, patientsList: allPatients, setSelectedPatientId, setCurrentPage, currentUser, currentOrgId, branchesList, stockList: allStock, usersList, logout, loggingOut } = useApp();
  const { activeBranch, selectBranchBySlug, isLoadingBranch, allowedBranches } = useBranch();
  const { matches } = useBranchScope();
  const patientsList = React.useMemo(() => allPatients.filter(p => matches(p.branch, p.branchId)), [allPatients, matches]);
  const stockList = React.useMemo(() => allStock.filter(s => matches(s.branch, s.branchId)), [allStock, matches]);

  const [showNotifications, setShowNotifications] = useState(false);
  const [hasUnreadNotifications, setHasUnreadNotifications] = useState(true);
  const [showBranchDropdown, setShowBranchDropdown] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Fix #8: Dinamik bildirimler — stok, recall, randevu durumundan hesaplanır
  const dynamicNotifications = React.useMemo(() => {
    const notifs: { id: number; title: string; desc: string; time: string; page: string }[] = [];
    let idCounter = 1;

    // Kritik stok uyarıları
    const lowStockItems = stockList.filter(s => s.category === 'Pil' && s.quantity <= s.criticalLevel);
    lowStockItems.forEach(item => {
      notifs.push({
        id: idCounter++,
        title: 'Kritik Stok Uyarısı',
        desc: `${item.name} stok seviyesi kritik düzeyde (${item.quantity} adet kaldı).`,
        time: 'Şimdi',
        page: 'stock'
      });
    });

    // SGK yenileme fırsatları
    const renewalPatients = patientsList.filter(p => p.sgkStatus === 'Yenileme Hakkı Var');
    renewalPatients.slice(0, 2).forEach(p => {
      notifs.push({
        id: idCounter++,
        title: 'SGK Yenileme Hakkı',
        desc: `${p.firstName} ${p.lastName}'ın SGK yenileme hakkı açıldı.`,
        time: 'Bugün',
        page: 'sgk'
      });
    });

    // Hiç bildirim yoksa varsayılan
    if (notifs.length === 0) {
      notifs.push({ id: 1, title: 'Bildirim Yok', desc: 'Şu anda bekleyen bildiriminiz bulunmuyor.', time: '', page: 'dashboard' });
    }

    return notifs;
  }, [stockList, patientsList]);

  React.useEffect(() => {
    setHasUnreadNotifications(dynamicNotifications.some(notification => notification.title !== 'Bildirim Yok'));
  }, [dynamicNotifications]);

  const dropdownRef = React.useRef<HTMLDivElement | null>(null);
  const branchDropdownRef = React.useRef<HTMLDivElement | null>(null);
  const profileDropdownRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
      if (branchDropdownRef.current && !branchDropdownRef.current.contains(event.target as Node)) {
        setShowBranchDropdown(false);
      }
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
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

  const pageInfo = pageTitles[currentPage] || pageTitles.dashboard;

  return (
    <header className="header">
      {/* Hamburger — Mobil & Tablet */}
      <button
        className="header-hamburger"
        onClick={toggleSidebar}
        aria-label="Menüyü aç"
      >
        <IconMenu size={20} strokeWidth={1.7} />
      </button>

      {/* Başlık */}
      <div className="header-left">
        <div>
          <div className="header-title">{pageInfo.title}</div>
          <div className="header-subtitle">{pageInfo.subtitle}</div>
        </div>
      </div>

      {/* Sağ Taraf */}
      <div className="header-right">
        <form onSubmit={handleSearchSubmit} className="header-search">
          <span className="header-search-icon">
            <IconSearch size={16} strokeWidth={1.7} />
          </span>
          <input
            type="search"
            placeholder="Hasta, TC veya telefon ara..."
            aria-label="Arama"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </form>
        {/* Şube Seçici Dropdown */}
        {allowedBranches === null && branchesList.filter(branch => branch.status === 'Aktif').length > 1 && <div ref={branchDropdownRef} style={{ position: 'relative' }}>
          <button
            type="button"
            onClick={() => setShowBranchDropdown(!showBranchDropdown)}
            aria-label="Aktif şube seçin"
            aria-expanded={showBranchDropdown}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              background: '#f8fafc',
              border: '1px solid var(--gray-200)',
              borderRadius: 8,
              padding: '6px 14px',
              fontSize: '0.84rem',
              fontWeight: 600,
              color: activeBranch.mode === 'all' ? '#0284c7' : 'var(--gray-800)',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <span>{activeBranch.mode === 'all' ? '🏢' : '📍'}</span>
            <span>
              {activeBranch.mode === 'all'
                ? 'Tüm Şubeler (Konsolide)'
                : activeBranch.mode === 'single'
                ? (activeBranch.branch?.name || activeBranch.slug)
                : 'Şube'}
            </span>
            <span style={{ fontSize: '0.7rem', opacity: 0.6 }}>▼</span>
          </button>

          {showBranchDropdown && (
            <div style={{
              position: 'absolute',
              top: '44px',
              right: 0,
              width: 250,
              backgroundColor: '#fff',
              border: '1px solid var(--gray-200)',
              borderRadius: 10,
              boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
              zIndex: 1000,
              padding: '8px 0',
              overflow: 'hidden'
            }}>
              <div style={{ padding: '6px 14px 8px', fontSize: '0.74rem', fontWeight: 700, color: 'var(--gray-400)', textTransform: 'uppercase', borderBottom: '1px solid var(--gray-100)' }}>
                Aktif Şube Seçimi
              </div>

              <div style={{ maxHeight: 240, overflowY: 'auto' }}>
                {/* 1. Tüm Şubeler (if permitted) */}
                {(
                  <button
                    type="button"
                    onClick={() => {
                      selectBranchBySlug('all');
                      setShowBranchDropdown(false);
                    }}
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      padding: '10px 14px',
                      border: 'none',
                      background: activeBranch.mode === 'all' ? '#f0f9ff' : 'transparent',
                      color: activeBranch.mode === 'all' ? '#0284c7' : 'var(--gray-800)',
                      fontWeight: activeBranch.mode === 'all' ? 700 : 500,
                      fontSize: '0.84rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: 'pointer'
                    }}
                  >
                    <span>🏢 Tüm Şubeler (Konsolide)</span>
                    {activeBranch.mode === 'all' && <span style={{ fontSize: '0.8rem', color: '#0284c7' }}>✓</span>}
                  </button>
                )}

                {/* 2. Branches list */}
                {branchesList.filter(branch => branch.status === 'Aktif').map(b => {
                  const slug = BranchService.generateSlug(b);
                  const isSelected = activeBranch.mode === 'single' && (activeBranch.branchId === b.id || activeBranch.slug === slug);
                  return (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => {
                        selectBranchBySlug(slug);
                        setShowBranchDropdown(false);
                      }}
                      style={{
                        width: '100%',
                        textAlign: 'left',
                        padding: '10px 14px',
                        border: 'none',
                        background: isSelected ? '#f0f9ff' : 'transparent',
                        color: isSelected ? '#0284c7' : 'var(--gray-800)',
                        fontWeight: isSelected ? 700 : 500,
                        fontSize: '0.84rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        cursor: 'pointer'
                      }}
                    >
                      <span>📍 {b.name}</span>
                      {isSelected && <span style={{ fontSize: '0.8rem', color: '#0284c7' }}>✓</span>}
                    </button>
                  );
                })}
              </div>

              {currentUser?.membership?.roles?.includes('Firma Yöneticisi') && <div style={{ borderTop: '1px solid var(--gray-100)', padding: '6px 14px 2px', marginTop: 4 }}>
                <button
                  type="button"
                  onClick={() => {
                    setCurrentPage('branches');
                    setShowBranchDropdown(false);
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#0284c7',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    padding: 0
                  }}
                >
                  ⚙️ Şube Yönetimi ➔
                </button>
              </div>}
            </div>
          )}
        </div>}

        <div ref={dropdownRef} style={{ position: 'relative' }}>
          <button 
            className="header-btn" 
            title="Bildirimler" 
            aria-label="Bildirimler"
            aria-expanded={showNotifications}
            onClick={() => setShowNotifications(!showNotifications)}
          >
            <IconBell size={18} strokeWidth={1.7} />
            {hasUnreadNotifications && <span className="header-btn-badge" aria-hidden="true" />}
          </button>

          {showNotifications && (
            <div style={{
              position: 'absolute',
              top: '46px',
              right: '0',
              width: '320px',
              backgroundColor: 'var(--surface-white)',
              border: '1px solid var(--surface-border-light)',
              borderRadius: 'var(--radius-lg)',
              boxShadow: 'var(--shadow-lg)',
              zIndex: 1000,
              padding: '12px 16px',
              textAlign: 'left'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, borderBottom: '1px solid var(--surface-border-light)', paddingBottom: 8 }}>
                <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--gray-800)' }}>Bildirimler</span>
                <span 
                  style={{ fontSize: '0.72rem', color: 'var(--primary-600)', cursor: 'pointer' }} 
                  onClick={() => {
                    setHasUnreadNotifications(false);
                    setShowNotifications(false);
                  }}
                >
                  Tümünü Oku
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {dynamicNotifications.map((notif, index, arr) => (
                  <div 
                    key={notif.id} 
                    onClick={() => {
                      setCurrentPage(notif.page as any);
                      setShowNotifications(false);
                    }}
                    style={{ 
                      fontSize: '0.8rem', 
                      borderBottom: index < arr.length - 1 ? '1px solid var(--gray-50)' : 'none', 
                      paddingBottom: index < arr.length - 1 ? 8 : 0,
                      cursor: 'pointer',
                      padding: '4px',
                      borderRadius: 'var(--radius-sm)',
                      transition: 'background 0.15s ease'
                    }}
                    className="notification-item"
                  >
                    <div style={{ color: 'var(--gray-800)', fontWeight: 600 }}>{notif.title}</div>
                    <div style={{ color: 'var(--gray-600)', fontSize: '0.75rem', marginTop: 2 }}>{notif.desc}</div>
                    <div style={{ color: 'var(--gray-400)', fontSize: '0.68rem', marginTop: 4 }}>{notif.time}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Kullanıcı Profili */}
        <div ref={profileDropdownRef} style={{ position: 'relative', borderLeft: '1px solid var(--gray-200)', paddingLeft: 12, marginLeft: 4 }}>
          <button type="button" onClick={() => setShowProfileMenu(open => !open)} aria-label="Kullanıcı menüsünü aç" aria-expanded={showProfileMenu}
            style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'transparent', border: 0, cursor: 'pointer', padding: 0, color: 'inherit' }}>
            <span style={{ textAlign: 'right' }} className="hide-tablet">
              <span style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', color: 'var(--gray-800)', lineHeight: '1.2' }}>{getDisplayName(currentUser, usersList)}</span>
              <span style={{ display: 'block', fontSize: '0.72rem', color: 'var(--gray-500)', lineHeight: '1.2' }}>{getUserRole(currentUser, usersList)}</span>
            </span>
            <span className="avatar avatar-sm" style={{ background: 'linear-gradient(135deg, var(--primary-500), var(--primary-600))', color: 'white', fontWeight: 600, fontSize: '0.8rem', width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--shadow-xs)' }}>
              {getUserInitials(getDisplayName(currentUser, usersList))}
            </span>
          </button>
          {showProfileMenu && <div role="menu" style={{ position: 'absolute', top: 44, right: 0, width: 210, background: 'var(--surface-white)', border: '1px solid var(--surface-border-light)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-lg)', zIndex: 1000, padding: 6 }}>
            <button role="menuitem" type="button" className="profile-menu-item" onClick={() => { setCurrentPage('profile'); setShowProfileMenu(false); }}>Profilim</button>
            <button role="menuitem" type="button" className="profile-menu-item" disabled={loggingOut} onClick={() => { setShowProfileMenu(false); void logout(); }}>{loggingOut ? 'Çıkış yapılıyor…' : 'Çıkış yap'}</button>
          </div>}
        </div>
      </div>
    </header>
  );
}
