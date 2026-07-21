'use client';

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { IconSearch, IconPlus, IconCheck, IconWarning, IconRefresh } from '../components/Icons';
import { formatCurrency } from '../data/mockData';

interface TransferRecord {
  id: string;
  patientName: string;
  fromBranch: string;
  toBranch: string;
  date: string;
  approvedBy: string;
  status: 'Tamamlandı' | 'Beklemede';
}

export default function BranchActivitiesPage() {
  const { addToast, branchesList, usersList, salesList, appointmentsList } = useApp();

  // Branch Performance Analysis
  // Calculate dynamic data per branch from AppContext
  const getBranchStats = (branchName: string) => {
    // Staff count
    const staff = usersList.filter(u => u.branch === branchName || u.branch === 'Tüm Şubeler').length;
    // Sales count and revenue
    // We map branch mapping. (Wait! In mockData, stock items have branch, sales have no branch explicitly but we can assume or link it,
    // let's count sales by matching audiologist or simply split them for Kadıköy and Beşiktaş for this simulation/analysis view)
    const isKadikoy = branchName.includes('Kadıköy');
    const branchSales = salesList.filter((s, i) => isKadikoy ? i % 2 === 0 : i % 2 !== 0);
    const revenue = branchSales.reduce((acc, curr) => acc + curr.total, 0);
    const salesCount = branchSales.length;

    // Appointments count
    const appointments = appointmentsList.filter(a => a.branch === branchName).length;

    return { staff, revenue, salesCount, appointments };
  };

  // Simulated transfers history
  const [transfers, setTransfers] = useState<TransferRecord[]>([
    { id: 'trf-1', patientName: 'Ahmet Yılmaz', fromBranch: 'Merkez 2 - Beşiktaş', toBranch: 'Merkez 1 - Kadıköy', date: '2026-07-20', approvedBy: 'Dr. Elif Arslan', status: 'Tamamlandı' },
    { id: 'trf-2', patientName: 'Saniye Öztürk', fromBranch: 'Merkez 1 - Kadıköy', toBranch: 'Merkez 2 - Beşiktaş', date: '2026-07-15', approvedBy: 'Sek. Zeynep Acar', status: 'Tamamlandı' }
  ]);

  // Transfer Form State
  const [formPatientName, setFormPatientName] = useState('');
  const [formFromBranch, setFormFromBranch] = useState('Merkez 1 - Kadıköy');
  const [formToBranch, setFormToBranch] = useState('Merkez 2 - Beşiktaş');

  const handleCreateTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formPatientName.trim()) {
      alert('Lütfen hasta adı girin.');
      return;
    }
    if (formFromBranch === formToBranch) {
      alert('Başlangıç ve hedef şube aynı olamaz.');
      return;
    }

    const newTransfer: TransferRecord = {
      id: 'trf-' + Date.now(),
      patientName: formPatientName,
      fromBranch: formFromBranch,
      toBranch: formToBranch,
      date: new Date().toISOString().split('T')[0],
      approvedBy: 'Dr. Elif Arslan',
      status: 'Tamamlandı'
    };

    setTransfers(prev => [newTransfer, ...prev]);
    setFormPatientName('');
    addToast({
      type: 'success',
      message: `${formPatientName} adlı hastanın şube ataması başarıyla güncellendi ve dosya transferi tamamlandı.`
    });
  };

  return (
    <div className="page">
      <div className="page-header">
        <div className="page-header-left">
          <h2>Şube Performansı & Aktivite Analizi</h2>
          <p>Şubeler arası karşılaştırmalar, ciro dağılımları ve hasta transfer geçmişi</p>
        </div>
      </div>

      {/* Grid of branches performance */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20, marginBottom: 24 }}>
        {branchesList.map((branch) => {
          const stats = getBranchStats(branch.name);
          return (
            <div className="card" key={branch.id} style={{ borderTop: '4px solid var(--primary-500)' }}>
              <div className="card-header" style={{ borderBottom: '1px solid var(--surface-border-light)' }}>
                <span className="card-title" style={{ fontSize: '1.05rem', fontWeight: 700 }}>
                  {branch.name}
                </span>
                <span className="badge badge-success" style={{ fontSize: '0.76rem' }}>Aktif</span>
              </div>
              <div className="card-body" style={{ padding: 20 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px 20px' }}>
                  <div>
                    <span style={{ fontSize: '0.78rem', color: 'var(--gray-500)' }}>Toplam Ciro</span>
                    <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--gray-900)', marginTop: 2 }}>
                      {formatCurrency(stats.revenue)}
                    </div>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.78rem', color: 'var(--gray-500)' }}>Hasta Sayısı</span>
                    <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--gray-900)', marginTop: 2 }}>
                      {branch.patientsCount} hasta
                    </div>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.78rem', color: 'var(--gray-500)' }}>Randevu Trafiği</span>
                    <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--gray-800)', marginTop: 2 }}>
                      {stats.appointments} randevu
                    </div>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.78rem', color: 'var(--gray-500)' }}>Cihaz Satış Adedi</span>
                    <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--gray-800)', marginTop: 2 }}>
                      {stats.salesCount} adet
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="responsive-grid-2" style={{ gap: 20 }}>
        {/* Left Side: Inter-branch Patient Transfer form */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">🔄 Şubeler Arası Hasta Transfer Girişi</span>
          </div>
          <form onSubmit={handleCreateTransfer}>
            <div className="card-body" style={{ padding: 20 }}>
              <div className="form-group" style={{ marginBottom: 12 }}>
                <label className="form-label">Hasta Adı Soyadı</label>
                <input
                  className="form-input"
                  placeholder="Şubesi değiştirilecek hastanın adı"
                  value={formPatientName}
                  onChange={(e) => setFormPatientName(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
                <div className="form-group" style={{ flex: 1, margin: 0 }}>
                  <label className="form-label">Mevcut Şubesi</label>
                  <select
                    className="form-input"
                    value={formFromBranch}
                    onChange={(e) => setFormFromBranch(e.target.value)}
                  >
                    <option value="Merkez 1 - Kadıköy">Merkez 1 - Kadıköy</option>
                    <option value="Merkez 2 - Beşiktaş">Merkez 2 - Beşiktaş</option>
                  </select>
                </div>
                <div className="form-group" style={{ flex: 1, margin: 0 }}>
                  <label className="form-label">Hedef Şubesi</label>
                  <select
                    className="form-input"
                    value={formToBranch}
                    onChange={(e) => setFormToBranch(e.target.value)}
                  >
                    <option value="Merkez 2 - Beşiktaş">Merkez 2 - Beşiktaş</option>
                    <option value="Merkez 1 - Kadıköy">Merkez 1 - Kadıköy</option>
                  </select>
                </div>
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                Hasta Dosyasını ve Kaydını Transfer Et
              </button>
            </div>
          </form>
        </div>

        {/* Right Side: Transfer logs history */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">📋 Şube Transfer Günlüğü</span>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            {transfers.length === 0 ? (
              <div style={{ padding: 30, textAlign: 'center', color: 'var(--gray-400)' }}>
                Kayıtlı transfer işlemi bulunmamaktadır.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {transfers.map((trf, i) => (
                  <div key={trf.id} style={{
                    padding: '12px 16px',
                    borderBottom: i < transfers.length - 1 ? '1px solid var(--surface-border-light)' : 'none',
                    fontSize: '0.86rem'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <strong>{trf.patientName}</strong>
                      <span style={{ fontSize: '0.78rem', color: 'var(--gray-400)' }}>{trf.date}</span>
                    </div>
                    <div style={{ color: 'var(--gray-600)' }}>
                      {trf.fromBranch} ➜ {trf.toBranch}
                    </div>
                    <div style={{ fontSize: '0.76rem', color: 'var(--gray-400)', marginTop: 2 }}>
                      Onaylayan: {trf.approvedBy} · Durum: <span style={{ color: 'var(--success-600)', fontWeight: 600 }}>{trf.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
