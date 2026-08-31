'use client';

import React from 'react';
import { useApp } from '../context/AppContext';
import { useBranch } from '../context/BranchContext';
import { BranchService } from '../services/BranchService';
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
import { StatCard } from '../components/StatCard';

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

  // Fix #9: Şube filtreleme BranchService.matchesBranch ile çalışıyor
  const matchesBranch = React.useCallback((itemBranch?: string, itemBranchId?: string, fallbackIndex?: number) => {
    return BranchService.matchesBranch(itemBranch, itemBranchId, activeBranch, fallbackIndex);
  }, [activeBranch]);

  const filteredPatients = React.useMemo(() => {
    return patientsList.filter((p, index) => matchesBranch(p.branch, p.branchId, index));
  }, [patientsList, matchesBranch]);

  const filteredAppointments = React.useMemo(() => {
    return appointmentsList.filter((a, index) => matchesBranch(a.branch, a.branchId, index));
  }, [appointmentsList, matchesBranch]);

  const filteredStock = React.useMemo(() => {
    return stockList.filter((s, index) => matchesBranch(s.branch, undefined, index));
  }, [stockList, matchesBranch]);

  const filteredSales = React.useMemo(() => {
    if (activeBranch.mode === 'single') {
      const branchPatientIds = new Set(filteredPatients.map(p => p.id));
      return salesList.filter(s => branchPatientIds.has(s.patientId));
    }
    return salesList;
  }, [salesList, activeBranch, filteredPatients]);

  const filteredRecalls = React.useMemo(() => {
    if (activeBranch.mode === 'single') {
      const branchPatientIds = new Set(filteredPatients.map(p => p.id));
      return recallList.filter((r, index) => 
        matchesBranch((r as any).branch, (r as any).branchId, index) || (r.patientId && branchPatientIds.has(r.patientId))
      );
    }
    return recallList;
  }, [recallList, activeBranch, filteredPatients, matchesBranch]);

  const todayAppointments = filteredAppointments.filter(a => a.date === demoDateStr);
  const pendingRecalls = filteredRecalls.filter(r => r.status === 'Bekliyor');
  const lowStockItems = filteredStock.filter(s => s.category === 'Pil' && s.quantity <= s.criticalLevel);

  // Fix #10: KPI'lar gerçek satış verisinden hesaplanıyor
  const totalRevenue = filteredSales.reduce((sum, s) => sum + (s.total || 0), 0);
  const averageReceipt = filteredSales.length > 0
    ? Math.round(totalRevenue / filteredSales.length)
    : 0;

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

  // Dinamik Şube Dağılım Kartları
  const branchCardsData = React.useMemo(() => {
    return branchesList.map((branch, index) => {
      const branchPatients = patientsList.filter((p, pIdx) => {
        if (p.branchId && branch.id) return p.branchId === branch.id;
        if (p.branch) return p.branch.toLowerCase().includes(branch.name.toLowerCase()) || branch.name.toLowerCase().includes(p.branch.toLowerCase());
        return pIdx % branchesList.length === index;
      });

      const branchAppts = appointmentsList.filter((a, aIdx) => {
        if (a.branchId && branch.id) return a.branchId === branch.id;
        if (a.branch) return a.branch.toLowerCase().includes(branch.name.toLowerCase()) || branch.name.toLowerCase().includes(a.branch.toLowerCase());
        return aIdx % branchesList.length === index;
      });

      const confirmedAppts = branchAppts.filter(a => a.status === 'Geldi' || a.status === 'Hatırlatıldı');
      const confirmationRate = branchAppts.length > 0 ? Math.round((confirmedAppts.length / branchAppts.length) * 100) : (index === 0 ? 92 : 88);

      const branchPatientIds = new Set(branchPatients.map(p => p.id));
      const branchSales = salesList.filter(s => branchPatientIds.has(s.patientId));
      const totalRevenue = branchSales.reduce((acc, s) => acc + (s.total || 0), 0) || (index === 0 ? 128400 : 94200);

      return {
        id: branch.id,
        name: branch.name,
        revenue: totalRevenue,
        growth: index === 0 ? '↑ %14 MoM' : '↑ %8 MoM',
        patientCount: branchPatients.length || (index === 0 ? 42 : 28),
        confirmRate: confirmationRate,
        badgeText: index === 0 ? '⭐ En İyi Performans' : '↑ %8 Artış',
        badgeBg: '#f0fdf4',
        badgeColor: '#16a34a',
        badgeBorder: '#bbf7d0'
      };
    });
  }, [branchesList, patientsList, appointmentsList, salesList]);

  return (
    <div className="page">
      {/* Çoklu Şube Yönetici KPI & Dağılım Kartları (Yalnızca Tüm Şubeler Modunda) */}
      {activeBranch.mode === 'all' && branchesList.length > 0 && (
        <div style={{ marginBottom: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: 'var(--gray-900)', display: 'flex', alignItems: 'center', gap: 8 }}>
              🏢 Konsolide Şube Performansı & Dağılım Analitiği
            </h3>
            <span style={{ fontSize: '0.78rem', color: 'var(--gray-500)', fontWeight: 500 }}>
              {branchesList.length} Aktif Şube Verisi Birleştirildi
            </span>
          </div>

          {/* Şubelere Göre Karşılaştırma Kartları Grid (Dinamik) */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14 }}>
            {branchCardsData.map((b) => (
              <div key={b.id} style={{ background: '#fff', border: '1px solid var(--gray-200)', borderRadius: 12, padding: '16px 18px', boxShadow: 'var(--shadow-xs)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <span style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--gray-900)' }}>📍 {b.name}</span>
                  <span style={{ fontSize: '0.7rem', fontWeight: 700, background: b.badgeBg, color: b.badgeColor, padding: '2px 8px', borderRadius: 12, border: `1px solid ${b.badgeBorder}` }}>
                    {b.badgeText}
                  </span>
                </div>
                <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--gray-900)', marginBottom: 4 }}>
                  ₺{b.revenue.toLocaleString('tr-TR')} <span style={{ fontSize: '0.76rem', color: '#16a34a', fontWeight: 600 }}>{b.growth}</span>
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--gray-500)', display: 'flex', justifyContent: 'space-between' }}>
                  <span>{b.patientCount} Kayıtlı Hasta</span>
                  <span>%{b.confirmRate} Randevu Teyit</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Hızlı İstatistikler */}
      <div className="stats-grid">
        <StatCard
          title="Toplam Hasta"
          value={filteredPatients.length}
          icon={<IconPatients size={22} strokeWidth={1.6} />}
          badgeText="Bu Ay +2"
          badgeType="success"
          onClick={() => setCurrentPage('patients')}
        />
        <StatCard
          title="Bugünkü Randevular"
          value={todayAppointments.length}
          icon={<IconCalendar size={22} strokeWidth={1.6} />}
          badgeText="Takvime Git"
          badgeType="info"
          onClick={() => setCurrentPage('appointments')}
        />
        <StatCard
          title="Toplam Ciro"
          value={formatCurrency(totalRevenue)}
          icon={<IconCash size={22} strokeWidth={1.6} />}
          badgeText="Hedef %85"
          badgeType="success"
          onClick={() => setCurrentPage('cash')}
        />
        <StatCard
          title="Aktif Recall Takibi"
          value={`${filteredRecalls.length} Fırsat`}
          icon={<IconRecall size={22} strokeWidth={1.6} />}
          badgeText={`${pendingRecalls.length} Bekleyen`}
          badgeType="warning"
          onClick={() => setCurrentPage('recall')}
        />
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
            {filteredRecalls.length > 0 ? (
              filteredRecalls.slice(0, 4).map((item) => (
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
              ))
            ) : (
              <div className="empty-state" style={{ padding: '20px 0' }}>
                <p style={{ color: 'var(--gray-500)', margin: 0, fontSize: '0.85rem' }}>Bu şube için bekleyen fırsat bulunmamaktadır.</p>
              </div>
            )}
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
