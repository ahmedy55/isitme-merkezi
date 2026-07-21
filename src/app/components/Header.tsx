'use client';

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { IconMenu, IconSearch, IconBell } from './Icons';

const pageTitles: Record<string, { title: string; subtitle: string }> = {
  dashboard:        { title: 'Dashboard',            subtitle: 'Merkezin genel durumu' },
  patients:         { title: 'Hastalar',              subtitle: 'Hasta kayıtları ve odyogram yönetimi' },
  'patient-detail': { title: 'Hasta Detay',           subtitle: 'Hasta bilgileri ve geçmişi' },
  appointments:     { title: 'Randevular',            subtitle: 'Takvim ve randevu yönetimi' },
  recall:           { title: 'Recall Otomasyonu',     subtitle: 'Yenileme ve hatırlatma fırsatları' },
  sgk:              { title: 'SGK & Reçete',          subtitle: 'Medula entegrasyonu ve hak ediş takibi' },
  stock:            { title: 'Stok & Aksesuar',       subtitle: 'Cihaz, pil ve aksesuar envanter yönetimi' },
  cash:             { title: 'Kasa & Tahsilat',       subtitle: 'Satış, tahsilat ve prim takibi' },
  service:          { title: 'Teknik Servis',         subtitle: 'Cihaz tamir, bakım ve servis takibi' },
  reports:          { title: 'Raporlama & Analitik',  subtitle: 'Performans ve finansal raporlar' },
  branches:         { title: 'Şubeler & Yetki',       subtitle: 'Çoklu şube ve rol yönetimi' },
  settings:         { title: 'Ayarlar',               subtitle: 'Sistem ve entegrasyon ayarları' },
};

export default function Header() {
  const { currentPage, toggleSidebar, patientsList, setSelectedPatientId, setCurrentPage } = useApp();
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
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
    
    const foundPatient = patientsList.find(p => 
      `${p.firstName} ${p.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.tc.includes(searchTerm)
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
        <div ref={dropdownRef} style={{ position: 'relative' }}>
          <button 
            className="header-btn" 
            title="Bildirimler" 
            aria-label="Bildirimler"
            onClick={() => setShowNotifications(!showNotifications)}
          >
            <IconBell size={18} strokeWidth={1.7} />
            <span className="header-btn-badge" aria-hidden="true" />
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
                <span style={{ fontSize: '0.72rem', color: 'var(--primary-600)', cursor: 'pointer' }} onClick={() => setShowNotifications(false)}>Tümünü Oku</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  { id: 1, title: 'SGK Yenileme Hakkı', desc: 'Ayşe Yılmaz\'ın SGK yenileme hakkı açıldı.', time: '1 saat önce', page: 'sgk' as const },
                  { id: 2, title: 'Pil Yenileme Uyarısı', desc: 'Hasan Çelik\'in pil bitişi (15 Temmuz) yaklaşıyor.', time: '3 saat önce', page: 'recall' as const },
                  { id: 3, title: 'Kritik Stok Uyarısı', desc: 'Mikrofon stok seviyesi kritik düzeyde (2 adet kaldı).', time: 'Dün', page: 'stock' as const }
                ].map((notif, index, arr) => (
                  <div 
                    key={notif.id} 
                    onClick={() => {
                      setCurrentPage(notif.page);
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
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, borderLeft: '1px solid var(--gray-200)', paddingLeft: 12, marginLeft: 4 }}>
          <div style={{ textAlign: 'right' }} className="hide-tablet">
            <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--gray-800)', lineHeight: '1.2' }}>Dr. Elif Arslan</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--gray-500)', lineHeight: '1.2' }}>Odyolog · Kadıköy</div>
          </div>
          <div 
            className="avatar avatar-sm" 
            style={{ 
              background: 'linear-gradient(135deg, var(--primary-500), var(--primary-600))', 
              color: 'white', 
              fontWeight: 600, 
              fontSize: '0.8rem',
              width: 32,
              height: 32,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: 'var(--shadow-xs)'
            }}
          >
            EA
          </div>
        </div>
      </div>
    </header>
  );
}
