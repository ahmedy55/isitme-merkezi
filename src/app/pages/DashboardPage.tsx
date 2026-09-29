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
    appointmentsList, 
    patientsList, 
    stockList, 
    salesList, 
    expensesList,
    recallList,
    updateAppointmentStatus,
    updateRecallItemStatus,
    branchesList
  } = useApp();

  const { activeBranch } = useBranch();

  const today = new Date();
  const todayDateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  // Fix #9: Şube filtreleme BranchService.matchesBranch ile çalışıyor
  const matchesBranch = React.useCallback((itemBranch?: string, itemBranchId?: string) => {
    return BranchService.matchesBranch(itemBranch, itemBranchId, activeBranch);
  }, [activeBranch]);

  const filteredPatients = React.useMemo(() => {
    return patientsList.filter(p => matchesBranch(p.branch, p.branchId));
  }, [patientsList, matchesBranch]);

  const filteredAppointments = React.useMemo(() => {
    return appointmentsList.filter(a => matchesBranch(a.branch, a.branchId));
  }, [appointmentsList, matchesBranch]);

  const filteredStock = React.useMemo(() => {
    return stockList.filter(s => matchesBranch(s.branch, s.branchId));
  }, [stockList, matchesBranch]);

  const filteredSales = React.useMemo(() => {
    if (activeBranch.mode === 'single') {
    return salesList.filter(s => s.branchId === activeBranch.branchId);
    }
    return salesList;
  }, [salesList, activeBranch]);

  const filteredRecalls = React.useMemo(() => {
    if (activeBranch.mode === 'single') {
      const branchPatientIds = new Set(filteredPatients.map(p => p.id));
      return recallList.filter(r => (r as any).branchId
        ? matchesBranch(undefined, (r as any).branchId)
        : Boolean(r.patientId && branchPatientIds.has(r.patientId)));
    }
    return recallList;
  }, [recallList, activeBranch, filteredPatients, matchesBranch]);

  const todayAppointments = filteredAppointments.filter(a => a.date === todayDateStr);
  const pendingRecalls = filteredRecalls.filter(r => r.status === 'Bekliyor');
  const lowStockItems = filteredStock.filter(s => s.category === 'Pil' && s.quantity <= s.criticalLevel);

  // Fix #10: KPI'lar gerçek satış verisinden hesaplanıyor
  const totalRevenue = filteredSales.reduce((sum, s) => sum + (s.total || 0), 0);
  const averageReceipt = filteredSales.length > 0
    ? Math.round(totalRevenue / filteredSales.length)
    : 0;

  // Randevuyu 'Geldi' olarak işaretleme fonksiyonu (Dinamik demo)
  const handleAptArrived = (id: string) => {
    updateAppointmentStatus(id, 'Geldi');
  };

  const handleSendRecall = (id: string) => {
    updateRecallItemStatus(id, 'Gönderildi');
  };

  // Dinamik Şube Dağılım Kartları
  const branchCardsData = React.useMemo(() => {
    return branchesList.filter(branch => branch.status === 'Aktif').map(branch => {
      const branchPatients = patientsList.filter(p => p.branchId === branch.id);
      const branchAppts = appointmentsList.filter(a => a.branchId === branch.id);

      const confirmedAppts = branchAppts.filter(a => a.status === 'Geldi' || a.status === 'Hatırlatıldı');
      const confirmationRate = branchAppts.length > 0 ? Math.round((confirmedAppts.length / branchAppts.length) * 100) : null;

      const branchSales = salesList.filter(s => s.branchId === branch.id);
      const totalRevenue = branchSales.reduce((acc, s) => acc + (s.total || 0), 0);

      return {
        id: branch.id,
        name: branch.name,
        revenue: totalRevenue,
        patientCount: branchPatients.length,
        confirmRate: confirmationRate,
      };
    });
  }, [branchesList, patientsList, appointmentsList, salesList]);

  const visibleBranchCards = activeBranch.mode === 'all' && branchCardsData.length > 1 ? branchCardsData : [];

  const unassignedCounts = React.useMemo(() => ({
    patients: patientsList.filter(row => !row.branchId).length,
    appointments: appointmentsList.filter(row => !row.branchId).length,
    stock: stockList.filter(row => !row.branchId).length,
    sales: salesList.filter(row => !row.branchId).length,
    expenses: expensesList.filter(row => !row.branchId && row.branch !== 'Genel').length,
  }), [patientsList, appointmentsList, stockList, salesList, expensesList]);

  const unassignedRows = React.useMemo(() => [
    { label: 'Hastalar', page: 'patients' as const, rows: patientsList.filter(row => !row.branchId).map(row => `${row.firstName} ${row.lastName} · ${row.id}`) },
    { label: 'Randevular', page: 'appointments' as const, rows: appointmentsList.filter(row => !row.branchId).map(row => `${row.patientName} · ${row.date} · ${row.id}`) },
    { label: 'Stok', page: 'stock' as const, rows: stockList.filter(row => !row.branchId).map(row => `${row.name} · ${row.serialNo || row.barcode || row.id}`) },
    { label: 'Satışlar', page: 'cash' as const, rows: salesList.filter(row => !row.branchId).map(row => `${row.patientName} · ${row.date} · ${row.id}`) },
    { label: 'Giderler', page: 'expenses' as const, rows: expensesList.filter(row => !row.branchId && row.branch !== 'Genel').map(row => `${row.description} · ${row.date} · ${row.id}`) },
  ], [patientsList, appointmentsList, stockList, salesList, expensesList]);

  return (
    <div className="page">
      {/* Multi-branch consolidated comparison; single-branch keeps the business overview below. */}
      {visibleBranchCards.length > 0 && (
        <div style={{ marginBottom: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: 'var(--gray-900)', display: 'flex', alignItems: 'center', gap: 8 }}>
              🏢 {activeBranch.mode === 'all' ? 'Şubelere Göre Performans' : 'Şube Özeti'}
            </h3>
            <span style={{ fontSize: '0.78rem', color: 'var(--gray-500)', fontWeight: 500 }}>
              {visibleBranchCards.length} aktif şube
            </span>
          </div>

          {/* Şubelere Göre Karşılaştırma Kartları Grid (Dinamik) */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14 }}>
            {visibleBranchCards.map((b) => (
              <div key={b.id} style={{ background: '#fff', border: '1px solid var(--gray-200)', borderRadius: 12, padding: '16px 18px', boxShadow: 'var(--shadow-xs)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <span style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--gray-900)' }}>📍 {b.name}</span>
                  <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--gray-500)' }}>Tüm dönem</span>
                </div>
                <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--gray-900)', marginBottom: 4 }}>
                  ₺{b.revenue.toLocaleString('tr-TR')}
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--gray-500)', display: 'flex', justifyContent: 'space-between' }}>
                  <span>{b.patientCount} Kayıtlı Hasta</span>
                  <span>{b.confirmRate === null ? 'Randevu verisi yok' : `%${b.confirmRate} randevu teyit`}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {Object.values(unassignedCounts).some(count => count > 0) && activeBranch.mode === 'all' && (
        <div className="card" role="status" style={{ marginBottom: 18, borderColor: 'var(--warning-300)' }}>
          <div className="card-body" style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
            <div>
              <strong>Şube bilgisi eksik kayıtlar</strong>
              <div style={{ color: 'var(--gray-600)', fontSize: '0.85rem', marginTop: 4 }}>
                Bu kayıtlar şube cirosu ve karşılaştırmalarına tahmini olarak dağıtılmıyor. Düzeltilmeden şube raporlarında yer almaz.
              </div>
              <div style={{ color: 'var(--gray-600)', fontSize: '0.8rem', marginTop: 6 }}>
                {unassignedCounts.patients} hasta · {unassignedCounts.appointments} randevu · {unassignedCounts.stock} stok · {unassignedCounts.sales} satış · {unassignedCounts.expenses} gider
              </div>
            </div>
            <button className="btn btn-secondary" onClick={() => setCurrentPage('patients')}>Kayıtları incele</button>
            <details style={{ flexBasis: '100%' }}>
              <summary style={{ cursor: 'pointer', color: 'var(--primary-700)', fontWeight: 600 }}>Eksik şube bilgili kayıt listesi</summary>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12, marginTop: 12 }}>
                {unassignedRows.filter(group => group.rows.length > 0).map(group => <div key={group.label}>
                  <button className="btn btn-sm btn-ghost" onClick={() => setCurrentPage(group.page)}>{group.label} ({group.rows.length})</button>
                  <ul style={{ margin: '6px 0', paddingLeft: 20, color: 'var(--gray-700)', fontSize: '0.78rem' }}>
                    {group.rows.slice(0, 10).map(row => <li key={row}>{row}</li>)}
                    {group.rows.length > 10 && <li>… ve {group.rows.length - 10} kayıt daha</li>}
                  </ul>
                </div>)}
              </div>
            </details>
          </div>
        </div>
      )}

      {/* Hızlı İstatistikler */}
      <div className="stats-grid">
        <StatCard
          title="Toplam Hasta"
          value={filteredPatients.length}
          icon={<IconPatients size={22} strokeWidth={1.6} />}
          onClick={() => setCurrentPage('patients')}
        />
        <StatCard
          title="Bugünkü Randevular"
          value={todayAppointments.length}
          icon={<IconCalendar size={22} strokeWidth={1.6} />}
          onClick={() => setCurrentPage('appointments')}
        />
        <StatCard
          title="Tüm Dönem Satış Cirosu"
          value={formatCurrency(totalRevenue)}
          icon={<IconCash size={22} strokeWidth={1.6} />}
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
                      <button className="btn btn-sm btn-primary" onClick={() => handleAptArrived(apt.id)}>
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
                    <button className="btn btn-sm btn-primary" onClick={() => handleSendRecall(item.id)}>Gönderildi işaretle</button>
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
            
          </div>
        </div>
      </div>
    </div>
  );
}
