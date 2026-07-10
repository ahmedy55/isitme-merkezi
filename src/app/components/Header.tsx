'use client';

import React from 'react';
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
  const { currentPage, toggleSidebar } = useApp();
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
        <div className="header-search">
          <span className="header-search-icon">
            <IconSearch size={16} strokeWidth={1.7} />
          </span>
          <input
            type="search"
            placeholder="Hasta, TC veya telefon ara..."
            aria-label="Arama"
          />
        </div>
        <button className="header-btn" title="Bildirimler" aria-label="Bildirimler">
          <IconBell size={18} strokeWidth={1.7} />
          <span className="header-btn-badge" aria-hidden="true" />
        </button>
      </div>
    </header>
  );
}
