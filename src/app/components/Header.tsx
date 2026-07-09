'use client';

import React from 'react';
import { useApp } from '../context/AppContext';

const pageTitles: Record<string, { title: string; subtitle: string }> = {
  dashboard: { title: 'Dashboard', subtitle: 'Merkezinizin genel durumu' },
  patients: { title: 'Hastalar', subtitle: 'Hasta kayıtları ve odyogram yönetimi' },
  'patient-detail': { title: 'Hasta Detay', subtitle: 'Hasta bilgileri ve geçmişi' },
  appointments: { title: 'Randevular', subtitle: 'Takvim ve randevu yönetimi' },
  recall: { title: 'Recall Otomasyonu', subtitle: 'Yenileme ve hatırlatma fırsatları' },
  sgk: { title: 'SGK & Reçete', subtitle: 'Medula entegrasyonu ve hak ediş takibi' },
  stock: { title: 'Stok & Aksesuar', subtitle: 'Cihaz, pil ve aksesuar envanter yönetimi' },
  cash: { title: 'Kasa & Tahsilat', subtitle: 'Satış, tahsilat ve prim takibi' },
  service: { title: 'Teknik Servis', subtitle: 'Cihaz tamir, bakım ve servis takibi' },
  reports: { title: 'Raporlama & Analitik', subtitle: 'Performans ve finansal raporlar' },
  branches: { title: 'Şubeler & Yetki', subtitle: 'Çoklu şube ve rol yönetimi' },
  settings: { title: 'Ayarlar', subtitle: 'Sistem ve entegrasyon ayarları' },
};

export default function Header() {
  const { currentPage } = useApp();
  const pageInfo = pageTitles[currentPage] || pageTitles.dashboard;

  return (
    <header className="header">
      <div className="header-left">
        <div>
          <div className="header-title">{pageInfo.title}</div>
          <div className="header-subtitle">{pageInfo.subtitle}</div>
        </div>
      </div>
      <div className="header-right">
        <div className="header-search">
          <span className="header-search-icon">🔍</span>
          <input type="text" placeholder="Hasta, TC veya telefon ara..." />
        </div>
        <button className="header-btn" title="Bildirimler">
          🔔
          <span className="header-btn-badge"></span>
        </button>
        <button className="header-btn" title="Yardım">
          ❓
        </button>
      </div>
    </header>
  );
}
