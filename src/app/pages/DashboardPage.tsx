'use client';

import React from 'react';
import { useApp } from '../context/AppContext';
import { useBranch } from '../context/BranchContext';
import { getAvatarColor, formatCurrency } from '../data/mockData';

const statusColors: Record<string, string> = {
  'Bekliyor': 'warning',
  'Geldi': 'success',
  'Gelmedi': 'danger',
  'İptal': 'neutral'
};
import {
  IconPatients, IconCalendar, IconCash, IconRecall,
  IconPlus, IconSGK, IconArrowRight,
  IconTrendUp, IconWarning, IconCheck, IconReports,
} from '../components/Icons';

export default function DashboardPage() {
  const { 
    setCurrentPage, 
    addToast, 
    appointmentsList, 
    patientsList, 
    stockList, 
    salesList, 
    recallList,
    updateAppointmentStatus,
    updateRecallItemStatus,
    branchesList
  } = useApp();

  const { activeBranch } = useBranch();

  // Demo günü tarihi: 10.07.2026
  const demoDateStr = '2026-07-10';

  const filteredPatients = React.useMemo(() => {
    if (activeBranch.mode === 'all') return patientsList;
    const isKadikoy = activeBranch.mode === 'single' && (activeBranch.branchId === 'br-1' || activeBranch.slug.includes('kadikoy'));
    return patientsList.filter((p, i) => isKadikoy ? i % 2 === 0 : i % 2 !== 0);
  }, [patientsList, activeBranch]);

  const filteredAppointments = React.useMemo(() => {
    if (activeBranch.mode === 'all') return appointmentsList;
    const isKadikoy = activeBranch.mode === 'single' && (activeBranch.branchId === 'br-1' || activeBranch.slug.includes('kadikoy'));
    return appointmentsList.filter(a => isKadikoy ? (a.branch || '').includes('Kadıköy') : (a.branch || '').includes('Beşiktaş'));
  }, [appointmentsList, activeBranch]);

  const filteredStock = React.useMemo(() => {
    if (activeBranch.mode === 'all') return stockList;
    const isKadikoy = activeBranch.mode === 'single' && (activeBranch.branchId === 'br-1' || activeBranch.slug.includes('kadikoy'));
    return stockList.filter(s => isKadikoy ? (s.branch || '').includes('Kadıköy') : (s.branch || '').includes('Beşiktaş'));
  }, [stockList, activeBranch]);

  const filteredSales = React.useMemo(() => {
    if (activeBranch.mode === 'all') return salesList;
    const isKadikoy = activeBranch.mode === 'single' && (activeBranch.branchId === 'br-1' || activeBranch.slug.includes('kadikoy'));
    return salesList.filter((s, i) => isKadikoy ? i % 2 === 0 : i % 2 !== 0);
  }, [salesList, activeBranch]);

  const todayAppointments = filteredAppointments.filter(a => a.date === demoDateStr);
  const pendingRecalls = recallList.filter(r => r.status === 'Bekliyor');
  const lowStockItems = filteredStock.filter(s => s.category === 'Pil' && s.quantity <= s.criticalLevel);

  // Dynamic branch-linked financial figures
  const totalRevenue = activeBranch.mode === 'all'
    ? 295100 // 128400 (Kadıköy) + 94200 (Beşiktaş) + 72500 (İzmir)
    : (activeBranch.mode === 'single' && (activeBranch.branchId === 'br-1' || activeBranch.slug.includes('kadikoy'))
        ? 128400
        : (activeBranch.mode === 'single' && (activeBranch.branchId === 'br-2' || activeBranch.slug.includes('besiktas'))
            ? 94200
            : 72500));

  const averageReceipt = activeBranch.mode === 'all'
    ? 3315
    : (activeBranch.mode === 'single' && (activeBranch.branchId === 'br-1' || activeBranch.slug.includes('kadikoy'))
        ? 3057
        : (activeBranch.mode === 'single' && (activeBranch.branchId === 'br-2' || activeBranch.slug.includes('besiktas'))
            ? 3364
            : 3815));

  // Randevuyu 'Geldi' olarak işaretleme fonksiyonu (Dinamik demo)
  const handleAptArrived = (id: string, name: string) => {
    updateAppointmentStatus(id, 'Geldi');
    addToast({
      type: 'success',
      message: `${name} randevuya katıldı olarak işaretlendi.`
    });
  };

  const handleSendRecall = (id: string, name: string, reason: string) => {
    updateRecallItemStatus(id, 'Gönderildi');
    addToast({
      type: 'success',
      message: `${name} için ${reason} şablonu WhatsApp üzerinden gönderildi. Randevu bekleniyor.`
    });
  };

  return (
    <div className="page">
      {/* Çoklu Şube Yönetici KPI & Dağılım Kartları (Yalnızca Tüm Şubeler Modunda) */}
      {activeBranch.mode === 'all' && (
        <div style={{ marginBottom: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: 'var(--gray-900)', display: 'flex', alignItems: 'center', gap: 8 }}>
              🏢 Konsolide Şube Performansı & Dağılım Analitiği
            </h3>
            <span style={{ fontSize: '0.78rem', color: 'var(--gray-500)', fontWeight: 500 }}>
              {branchesList.length} Aktif Şube Verisi Birleştirildi
            </span>
          </div>

          {/* Şubelere Göre Karşılaştırma Kartları Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14 }}>
            {/* Kadıköy */}
            <div style={{ background: '#fff', border: '1px solid var(--gray-200)', borderRadius: 12, padding: '16px 18px', boxShadow: 'var(--shadow-xs)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <span style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--gray-900)' }}>📍 Kadıköy Merkez</span>
                <span style={{ fontSize: '0.7rem', fontWeight: 700, background: '#f0fdf4', color: '#16a34a', padding: '2px 8px', borderRadius: 12, border: '1px solid #bbf7d0' }}>
                  ⭐ En İyi Performans
                </span>
              </div>
              <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--gray-900)', marginBottom: 4 }}>
                ₺128,400 <span style={{ fontSize: '0.76rem', color: '#16a34a', fontWeight: 600 }}>↑ %14 MoM</span>
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--gray-500)', display: 'flex', justifyContent: 'space-between' }}>
                <span>42 Kayıtlı Hasta</span>
                <span>%92 Randevu Teyit</span>
              </div>
            </div>

            {/* Beşiktaş */}
            <div style={{ background: '#fff', border: '1px solid var(--gray-200)', borderRadius: 12, padding: '16px 18px', boxShadow: 'var(--shadow-xs)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <span style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--gray-900)' }}>📍 Beşiktaş Şubesi</span>
                <span style={{ fontSize: '0.7rem', fontWeight: 700, background: '#f0fdf4', color: '#16a34a', padding: '2px 8px', borderRadius: 12, border: '1px solid #bbf7d0' }}>
                  ↑ %8 Artış
                </span>
              </div>
              <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--gray-900)', marginBottom: 4 }}>
                ₺94,200 <span style={{ fontSize: '0.76rem', color: '#16a34a', fontWeight: 600 }}>↑ %8 MoM</span>
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--gray-500)', display: 'flex', justifyContent: 'space-between' }}>
                <span>28 Kayıtlı Hasta</span>
                <span>%88 Randevu Teyit</span>
              </div>
            </div>

            {/* İzmir */}
            <div style={{ background: '#fff', border: '1px solid #fecaca', borderRadius: 12, padding: '16px 18px', boxShadow: 'var(--shadow-xs)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <span style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--gray-900)' }}>📍 İzmir Şubesi</span>
                <span style={{ fontSize: '0.7rem', fontWeight: 700, background: '#fef2f2', color: '#dc2626', padding: '2px 8px', borderRadius: 12, border: '1px solid #fca5a5' }}>
                  ⚠️ İnceleme Öneriliyor
                </span>
              </div>
              <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--gray-900)', marginBottom: 4 }}>
                ₺72,500 <span style={{ fontSize: '0.76rem', color: '#dc2626', fontWeight: 600 }}>↓ %4 MoM</span>
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--gray-500)', display: 'flex', justifyContent: 'space-between' }}>
                <span>19 Kayıtlı Hasta</span>
                <span style={{ color: '#dc2626', fontWeight: 600 }}>%18 İptal Oranı</span>
              </div>
            </div>
          </div>

          {/* Aksiyona Dönüştürülebilir Yönetici İkazı */}
          <div style={{
            background: '#fffbe8',
            border: '1px solid #ffe58f',
            borderRadius: 10,
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            fontSize: '0.83rem',
            color: '#714b00'
          }}>
            <span style={{ fontSize: '1.1rem' }}>💡</span>
            <div>
              <strong>Aksiyon Önerisi (İzmir Şubesi):</strong> Bu ay İzmir şubesinde randevu iptal oranı %18 seviyesinde seyrediyor. Müşteri ilişkileri ekibinin randevu teyit aramalarını ve hatırlatma mesaj zamanlamasını incelemesi tavsiye edilmektedir.
            </div>
          </div>
        </div>
      )}

      {/* Hızlı İstatistikler */}
      <div className="stats-grid">
        <div className="stat-card" onClick={() => setCurrentPage('patients')} style={{ cursor: 'pointer' }}>
          <div className="stat-icon primary">
            <IconPatients size={22} strokeWidth={1.6} />
          </div>
          <div className="stat-content">
            <div className="stat-label">Toplam Hasta</div>
            <div className="stat-value">{filteredPatients.length}</div>
            <span className="stat-change up">
              <IconTrendUp size={12} /> Bu Ay +2
            </span>
          </div>
        </div>

        <div className="stat-card" onClick={() => setCurrentPage('appointments')} style={{ cursor: 'pointer' }}>
          <div className="stat-icon success">
            <IconCalendar size={22} strokeWidth={1.6} />
          </div>
          <div className="stat-content">
            <div className="stat-label">Bugünkü Randevular</div>
            <div className="stat-value">{todayAppointments.length}</div>
            <span className="stat-change info">Takvime Git</span>
          </div>
        </div>

        <div className="stat-card" onClick={() => setCurrentPage('cash')} style={{ cursor: 'pointer' }}>
          <div className="stat-icon warning">
            <IconCash size={22} strokeWidth={1.6} />
          </div>
          <div className="stat-content">
            <div className="stat-label">Toplam Ciro</div>
            <div className="stat-value">{formatCurrency(totalRevenue)}</div>
            <span className="stat-change up">
              <IconTrendUp size={12} /> Hedef %85
            </span>
          </div>
        </div>

        <div className="stat-card" onClick={() => setCurrentPage('recall')} style={{ cursor: 'pointer' }}>
          <div className="stat-icon info">
            <IconRecall size={22} strokeWidth={1.6} />
          </div>
          <div className="stat-content">
            <div className="stat-label">Aktif Recall Takibi</div>
            <div className="stat-value">{recallList.length} Fırsat</div>
            <span className="stat-change warning">
              {pendingRecalls.length} Bekleyen
            </span>
          </div>
        </div>
      </div>

      {/* Ana Grid */}
      <div className="dashboard-grid">
        {/* Bugünkü Randevular */}
        <div className="card">
          <div className="card-header">
            <span className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <IconCalendar size={16} strokeWidth={1.7} />
              Bugünkü Randevular
            </span>
            <button className="btn btn-sm btn-ghost" onClick={() => setCurrentPage('appointments')}
              style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              Tümü <IconArrowRight size={14} strokeWidth={1.8} />
            </button>
          </div>
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {todayAppointments.length > 0 ? (
              todayAppointments.map((apt) => (
                <div key={apt.id} className="appointment-item" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--surface-border-light)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div className="appointment-time" style={{ fontWeight: 700, color: 'var(--primary-600)', fontFamily: 'var(--font-mono)' }}>{apt.time}</div>
                    <div className="avatar" style={{ background: getAvatarColor(apt.patientName), width: 32, height: 32, borderRadius: '50%', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 700 }}>
                      {apt.patientName.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <div className="appointment-name" style={{ fontWeight: 600, fontSize: '0.9rem' }}>{apt.patientName}</div>
                      <div className="appointment-type" style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>{apt.type}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span className={`badge badge-${statusColors[apt.status] || 'neutral'}`}>
                      {apt.status}
                    </span>
                    {apt.status !== 'Geldi' && apt.status !== 'İptal' && (
                      <button className="btn btn-sm btn-primary" onClick={() => handleAptArrived(apt.id, apt.patientName)}>
                        Geldi
                      </button>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="empty-state">
                <div className="empty-state-icon">
                  <IconCalendar size={40} strokeWidth={1.2} />
                </div>
                <h3>Bugün randevu yok</h3>
                <p>Takvimden yeni randevu oluşturabilirsiniz.</p>
              </div>
            )}
          </div>
        </div>

        {/* Recall Sırası (Gelir Fırsatları) */}
        <div className="card">
          <div className="card-header">
            <span className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <IconRecall size={16} strokeWidth={1.7} />
              Hatırlatma ve Fırsat Sırası
              <span className="badge badge-danger">{pendingRecalls.length} Bekleyen</span>
            </span>
            <button className="btn btn-sm btn-ghost" onClick={() => setCurrentPage('recall')}
              style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              Fırsat Yönetimi <IconArrowRight size={14} strokeWidth={1.8} />
            </button>
          </div>
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {recallList.slice(0, 4).map((item) => (
              <div key={item.id} className="recall-item" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--surface-border-light)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div className="avatar" style={{ background: getAvatarColor(item.patientName), width: 32, height: 32, borderRadius: '50%', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 700 }}>
                    {item.patientName.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <div className="recall-name" style={{ fontWeight: 600, fontSize: '0.9rem' }}>{item.patientName}</div>
                    <div className="recall-reason" style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>{item.reason} · <span style={{ fontWeight: 600, color: 'var(--accent-600)' }}>{formatCurrency(item.estimatedRevenue)}</span></div>
                  </div>
                </div>
                {item.status === 'Bekliyor' ? (
                  <button className="btn btn-sm btn-primary" onClick={() => handleSendRecall(item.id, item.patientName, item.reason)}>Gönder</button>
                ) : (
                  <span className={`badge badge-${item.status === 'Randevu Alındı' ? 'success' : 'info'}`}>
                    {item.status}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Kritik Envanter & Uyarılar */}
        <div className="card">
          <div className="card-header">
            <span className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <IconWarning size={16} strokeWidth={1.7} />
              Kritik Envanter Seviyeleri
            </span>
            <button className="btn btn-sm btn-ghost" onClick={() => setCurrentPage('stock')}
              style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              Stok Yönetimi <IconArrowRight size={14} strokeWidth={1.8} />
            </button>
          </div>
          <div className="card-body">
            {lowStockItems.length > 0 ? (
              lowStockItems.map((item) => (
                <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--surface-border-light)' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>{item.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>Seri: {item.serialNo} · Konum: {item.location}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 700, color: 'var(--danger-600)' }}>{item.quantity} Adet Kalan</div>
                    <span className="badge badge-danger">Kritik Limit: {item.criticalLevel}</span>
                  </div>
                </div>
              ))
            ) : (
              <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--success-600)' }}>
                <IconCheck size={32} strokeWidth={1.5} />
                <p style={{ marginTop: 8, fontSize: '0.84rem' }}>Tüm stok seviyeleri güvenli limitlerde.</p>
              </div>
            )}
          </div>
        </div>

        {/* Aylık Ciro Grafiği */}
        <div className="card">
          <div className="card-header">
            <span className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <IconReports size={16} strokeWidth={1.7} />
              Finansal Durum
            </span>
            <button className="btn btn-sm btn-ghost" onClick={() => setCurrentPage('reports')}
              style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              Analitik Git <IconArrowRight size={14} strokeWidth={1.8} />
            </button>
          </div>
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100%', minHeight: 180 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
              <div>
                <span style={{ fontSize: '0.78rem', color: 'var(--gray-500)' }}>Toplam Satış</span>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--primary-700)', marginTop: 2 }}>
                  {formatCurrency(totalRevenue)}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--gray-500)' }}>Ortalama Fiş</span>
                <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--gray-800)', marginTop: 2 }}>
                  {formatCurrency(averageReceipt)}
                </div>
              </div>
            </div>
            
            {/* Basit progress bar grafik */}
            <div style={{ marginTop: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--gray-600)', marginBottom: 4 }}>
                <span>Aylık Ciro Hedefi</span>
                <span>%85</span>
              </div>
              <div className="progress-bar" style={{ height: 10 }}>
                <div className="progress-fill primary" style={{ width: '85%' }} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
