'use client';

import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { IconSearch, IconPlus, IconCheck, IconWarning, IconRefresh } from '../components/Icons';
import { formatCurrency } from '../data/mockData';
import { useBranchScope } from '../hooks/useBranchScope';
import { fetchBranchTransfers, transferPatient } from '../repositories/OperationsRepository';

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
  const { addToast, branchesList: allBranches, usersList, salesList, appointmentsList, patientsList, currentOrgId, refreshOrganizationData } = useApp();
  const { matches } = useBranchScope();
  const branchesList = React.useMemo(() => allBranches.filter(branch => matches(branch.name, branch.id)), [allBranches, matches]);

  // Branch Performance Analysis
  // Calculate dynamic data per branch from AppContext
  const getBranchStats = (branchName: string) => {
    // Staff count
    const branch = allBranches.find(item => item.name === branchName);
    const staff = usersList.filter(u => u.branchId === branch?.id || u.branch === branchName || u.branch === 'Tüm Şubeler').length;
    // Sales count and revenue
    const branchPatientIds = new Set(patientsList.filter(patient => patient.branchId === branch?.id || patient.branch === branchName).map(patient => patient.id));
    const branchSales = salesList.filter(sale => branchPatientIds.has(sale.patientId));
    const revenue = branchSales.reduce((acc, curr) => acc + curr.total, 0);
    const salesCount = branchSales.length;

    // Appointments count
    const appointments = appointmentsList.filter(a => a.branchId === branch?.id || a.branch === branchName).length;

    return { staff, revenue, salesCount, appointments };
  };

  // Simulated transfers history
  const [transfers, setTransfers] = useState<TransferRecord[]>((process.env.NEXT_PUBLIC_DEMO_MODE === 'true' && !process.env.NEXT_PUBLIC_SUPABASE_URL ? [
    { id: 'trf-1', patientName: 'Ahmet Yılmaz', fromBranch: 'Merkez 2 - Beşiktaş', toBranch: 'Merkez 1 - Kadıköy', date: '2026-07-20', approvedBy: 'Dr. Elif Arslan', status: 'Tamamlandı' },
    { id: 'trf-2', patientName: 'Saniye Öztürk', fromBranch: 'Merkez 1 - Kadıköy', toBranch: 'Merkez 2 - Beşiktaş', date: '2026-07-15', approvedBy: 'Sek. Zeynep Acar', status: 'Tamamlandı' }
  ] : []));
  useEffect(() => {
    let cancelled = false;
    if (currentOrgId) {
      setTransfers([]);
      fetchBranchTransfers().then(rows => { if (!cancelled) setTransfers(rows as TransferRecord[]); }).catch(e => { if (!cancelled) addToast({type:'error',message:e.message}); });
    }
    return () => { cancelled = true; };
  }, [currentOrgId]);

  // Transfer Form State
  const [formPatientId, setFormPatientId] = useState('');
  const [formToBranchId, setFormToBranchId] = useState('');
  const [savingTransfer, setSavingTransfer] = useState(false);
  const [transferRequestId, setTransferRequestId] = useState(() => crypto.randomUUID());

  const handleCreateTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    const patient = patientsList.find(p => p.id === formPatientId);
    const target = allBranches.find(b => b.id === formToBranchId);
    if (!patient || !patient.branchId || !target || patient.branchId === target.id || savingTransfer) { addToast({type:'error',message:'Kayıtlı hasta ve farklı, aktif hedef şube seçin.'}); return; }
    if (!currentOrgId) { addToast({type:'error',message:'Aktif firma gerekli.'}); return; }
    setSavingTransfer(true);
    const requestId = transferRequestId;
    try { await transferPatient(patient.id, target.id, requestId); }
    catch(e) { addToast({type:'error',message:(e as Error).message}); setSavingTransfer(false); return; }

    const newTransfer: TransferRecord = {
      id: requestId,
      patientName: patient.firstName + ' ' + patient.lastName,
      fromBranch: allBranches.find(b => b.id === patient.branchId)?.name || '',
      toBranch: target.name,
      date: new Date().toISOString().split('T')[0],
      approvedBy: 'Dr. Elif Arslan',
      status: 'Tamamlandı'
    };

    setTransfers(prev => [newTransfer, ...prev.filter(t => t.id !== requestId)]);
    setFormPatientId('');
    setTransferRequestId(crypto.randomUUID());
    await refreshOrganizationData();
    setSavingTransfer(false);
    addToast({
      type: 'success',
      message: `${patient.firstName} ${patient.lastName} adlı hastanın şubesi güncellendi; işlem transfer günlüğüne kaydedildi.`
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
                <select className="form-input" value={formPatientId} onChange={e => { setFormPatientId(e.target.value); setFormToBranchId(''); }} required>
                  <option value="">Hasta seçin</option>
                  {patientsList.filter(p => p.branchId).map(p => <option key={p.id} value={p.id}>{p.firstName} {p.lastName} · {allBranches.find(b => b.id === p.branchId)?.name}</option>)}
                </select>
              </div>

              <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
                <div className="form-group" style={{ flex: 1, margin: 0 }}>
                  <label className="form-label">Mevcut Şubesi</label>
                  <select
                    className="form-input"
                    value={allBranches.find(b => b.id === patientsList.find(p => p.id === formPatientId)?.branchId)?.name || ''}
                    disabled
                  >
                    <option value="">Hasta seçin</option>
                    {allBranches.map(b => <option key={b.id} value={b.name}>{b.name}</option>)}
                  </select>
                </div>
                <div className="form-group" style={{ flex: 1, margin: 0 }}>
                  <label className="form-label">Hedef Şubesi</label>
                  <select
                    className="form-input"
                    value={formToBranchId}
                    onChange={(e) => setFormToBranchId(e.target.value)}
                  >
                    <option value="">Hedef şube seçin</option>
                    {allBranches.filter(b => b.id !== patientsList.find(p => p.id === formPatientId)?.branchId && b.status !== 'Pasif' && String(b.status) !== 'inactive').map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </div>
              </div>

              <button type="submit" disabled={savingTransfer} className="btn btn-primary" style={{ width: '100%' }}>
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
