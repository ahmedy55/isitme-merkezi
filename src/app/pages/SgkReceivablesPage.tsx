'use client';

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { IconSearch, IconCheck, IconWarning, IconRefresh, IconDownload } from '../components/Icons';

interface SgkReceivable {
  id: string;
  patientName: string;
  tc: string;
  prescriptionNo: string;
  prescriptionDate: string;
  deviceInfo: string;
  amount: number;
  status: 'Beklemede' | 'Onaylandı' | 'Ödendi' | 'Red';
  rejectReason?: string;
}

export default function SgkReceivablesPage() {
  const { addToast } = useApp();

  // Mock data for SGK receivables
  const [receivables, setReceivables] = useState<SgkReceivable[]>([
    {
      id: 'sgk-rec-1',
      patientName: 'Kamil Yılmaz',
      tc: '12345678901',
      prescriptionNo: 'REC-2026-0988',
      prescriptionDate: '2026-07-02',
      deviceInfo: 'Phonak Audéo L90',
      amount: 6200,
      status: 'Beklemede'
    },
    {
      id: 'sgk-rec-2',
      patientName: 'Ayşe Güler',
      tc: '23456789012',
      prescriptionNo: 'REC-2026-0941',
      prescriptionDate: '2026-06-25',
      deviceInfo: 'Oticon More 1',
      amount: 6200,
      status: 'Onaylandı'
    },
    {
      id: 'sgk-rec-3',
      patientName: 'Mehmet Kaya',
      tc: '34567890123',
      prescriptionNo: 'REC-2026-0812',
      prescriptionDate: '2026-06-18',
      deviceInfo: 'Signia Active Pro',
      amount: 5800,
      status: 'Ödendi'
    },
    {
      id: 'sgk-rec-4',
      patientName: 'Fatma Çelik',
      tc: '45678901234',
      prescriptionNo: 'REC-2026-0722',
      prescriptionDate: '2026-06-10',
      deviceInfo: 'Phonak Slim L70',
      amount: 6200,
      status: 'Red',
      rejectReason: 'Evrak Eksikliği: KBB hekim raporu aslı eklenmemiş.'
    },
    {
      id: 'sgk-rec-5',
      patientName: 'Ali Öztürk',
      tc: '56789012345',
      prescriptionNo: 'REC-2026-0699',
      prescriptionDate: '2026-07-05',
      deviceInfo: 'Widex Moment 440',
      amount: 6200,
      status: 'Beklemede'
    }
  ]);

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  // Interactive functions
  const handleUpdateStatus = (id: string, newStatus: SgkReceivable['status']) => {
    let reason = '';
    if (newStatus === 'Red') {
      const promptReason = prompt('Lütfen red gerekçesini yazın:');
      if (promptReason === null) return;
      reason = promptReason || 'Gerekçe belirtilmedi';
    }

    setReceivables(prev => prev.map(rec => {
      if (rec.id === id) {
        return {
          ...rec,
          status: newStatus,
          rejectReason: newStatus === 'Red' ? reason : undefined
        };
      }
      return rec;
    }));

    addToast({
      type: newStatus === 'Ödendi' ? 'success' : newStatus === 'Red' ? 'error' : 'info',
      message: `Alacak durumu '${newStatus}' olarak güncellendi.`
    });
  };

  const handleBatchApprove = () => {
    setReceivables(prev => prev.map(rec => {
      if (rec.status === 'Beklemede') {
        return { ...rec, status: 'Onaylandı' };
      }
      return rec;
    }));
    addToast({
      type: 'success',
      message: 'Beklemedeki tüm alacaklar SGK tarafından toplu olarak onaylandı.'
    });
  };

  const handleReceivePayment = () => {
    setReceivables(prev => prev.map(rec => {
      if (rec.status === 'Onaylandı') {
        return { ...rec, status: 'Ödendi' };
      }
      return rec;
    }));
    addToast({
      type: 'success',
      message: 'Onaylanmış tüm SGK alacaklarının ödemesi banka hesabımıza tahsil edildi.'
    });
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', minimumFractionDigits: 0 }).format(val);
  };

  // Filter Logic
  const filteredReceivables = receivables.filter(rec => {
    const matchesSearch = 
      rec.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rec.tc.includes(searchTerm) ||
      rec.prescriptionNo.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'All' || rec.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Calculate summary metrics
  const totalPending = receivables.filter(r => r.status === 'Beklemede').reduce((sum, r) => sum + r.amount, 0);
  const totalApproved = receivables.filter(r => r.status === 'Onaylandı').reduce((sum, r) => sum + r.amount, 0);
  const totalPaid = receivables.filter(r => r.status === 'Ödendi').reduce((sum, r) => sum + r.amount, 0);
  const totalRejected = receivables.filter(r => r.status === 'Red').reduce((sum, r) => sum + r.amount, 0);

  return (
    <div className="page">
      <div className="page-header">
        <div className="page-header-left">
          <h2>SGK Katkı Alacakları</h2>
          <p>Devlet katkısı geri ödemeleri ve fatura onay takip süreci</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-secondary" onClick={handleReceivePayment} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            Toplu Ödeme Al
          </button>
          <button className="btn btn-primary" onClick={handleBatchApprove} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            Toplu SGK Onayı Al
          </button>
        </div>
      </div>

      {/* Summary stats */}
      <div className="stats-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 20 }}>
        <div className="card">
          <div className="card-body" style={{ padding: '16px 20px' }}>
            <div style={{ fontSize: '0.82rem', color: 'var(--gray-500)', fontWeight: 500 }}>Fatura Edilen (Bekliyor)</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--warning-600)', marginTop: 4 }}>
              {formatCurrency(totalPending)}
            </div>
            <div style={{ fontSize: '0.74rem', color: 'var(--gray-400)', marginTop: 2 }}>SGK onay aşamasında</div>
          </div>
        </div>
        <div className="card">
          <div className="card-body" style={{ padding: '16px 20px' }}>
            <div style={{ fontSize: '0.82rem', color: 'var(--gray-500)', fontWeight: 500 }}>Onaylanan (Ödeme Bekleyen)</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--info-600)', marginTop: 4 }}>
              {formatCurrency(totalApproved)}
            </div>
            <div style={{ fontSize: '0.74rem', color: 'var(--gray-400)', marginTop: 2 }}>Ödeme listesinde</div>
          </div>
        </div>
        <div className="card">
          <div className="card-body" style={{ padding: '16px 20px' }}>
            <div style={{ fontSize: '0.82rem', color: 'var(--gray-500)', fontWeight: 500 }}>Ödenen (Tahsil Edilen)</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--success-600)', marginTop: 4 }}>
              {formatCurrency(totalPaid)}
            </div>
            <div style={{ fontSize: '0.74rem', color: 'var(--gray-400)', marginTop: 2 }}>Banka hesabına yatan</div>
          </div>
        </div>
        <div className="card">
          <div className="card-body" style={{ padding: '16px 20px' }}>
            <div style={{ fontSize: '0.82rem', color: 'var(--gray-500)', fontWeight: 500 }}>Reddedilen Tutar</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--danger-600)', marginTop: 4 }}>
              {formatCurrency(totalRejected)}
            </div>
            <div style={{ fontSize: '0.74rem', color: 'var(--gray-400)', marginTop: 2 }}>Revize edilmesi gereken</div>
          </div>
        </div>
      </div>

      {/* Filter and search */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-body" style={{ padding: 16 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
            <div style={{ flex: 1, minWidth: 240, position: 'relative' }}>
              <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-400)' }}>
                <IconSearch size={18} />
              </span>
              <input
                className="form-input"
                placeholder="Hasta adı, TC veya Reçete No ile ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ paddingLeft: 38, width: '100%', margin: 0 }}
              />
            </div>

            <div style={{ minWidth: 160 }}>
              <select className="form-input" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ margin: 0 }}>
                <option value="All">Tüm Durumlar</option>
                <option value="Beklemede">Beklemede</option>
                <option value="Onaylandı">Onaylandı</option>
                <option value="Ödendi">Ödendi</option>
                <option value="Red">Reddedilen</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Receivables list */}
      <div className="card">
        <div className="card-body" style={{ padding: 0, overflowX: 'auto' }}>
          <table className="table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: 'var(--gray-50)', borderBottom: '1px solid var(--surface-border)' }}>
                <th style={{ padding: '12px 16px', fontWeight: 600, fontSize: '0.84rem', color: 'var(--gray-600)' }}>Hasta Bilgileri</th>
                <th style={{ padding: '12px 16px', fontWeight: 600, fontSize: '0.84rem', color: 'var(--gray-600)' }}>Reçete / Evrak No</th>
                <th style={{ padding: '12px 16px', fontWeight: 600, fontSize: '0.84rem', color: 'var(--gray-600)' }}>Tarih</th>
                <th style={{ padding: '12px 16px', fontWeight: 600, fontSize: '0.84rem', color: 'var(--gray-600)' }}>Cihaz Bilgisi</th>
                <th style={{ padding: '12px 16px', fontWeight: 600, fontSize: '0.84rem', color: 'var(--gray-600)' }}>SGK Tutar</th>
                <th style={{ padding: '12px 16px', fontWeight: 600, fontSize: '0.84rem', color: 'var(--gray-600)' }}>Durum</th>
                <th style={{ padding: '12px 16px', fontWeight: 600, fontSize: '0.84rem', color: 'var(--gray-600)', textAlign: 'right' }}>İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {filteredReceivables.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: 40, textAlign: 'center', color: 'var(--gray-400)' }}>
                    Filtrelere uygun SGK alacak kaydı bulunamadı.
                  </td>
                </tr>
              ) : (
                filteredReceivables.map((rec) => (
                  <tr key={rec.id} style={{ borderBottom: '1px solid var(--surface-border-light)' }}>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ fontWeight: 600, color: 'var(--gray-800)' }}>{rec.patientName}</div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--gray-400)', fontFamily: 'monospace' }}>TC: {rec.tc}</div>
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: '0.86rem', color: 'var(--gray-700)', fontFamily: 'monospace' }}>
                      {rec.prescriptionNo}
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: '0.86rem', color: 'var(--gray-700)' }}>
                      {new Date(rec.prescriptionDate).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: '0.86rem', color: 'var(--gray-700)' }}>
                      {rec.deviceInfo}
                    </td>
                    <td style={{ padding: '14px 16px', fontWeight: 700, color: 'var(--primary-600)' }}>
                      {formatCurrency(rec.amount)}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <span className={`badge badge-${
                          rec.status === 'Ödendi' ? 'success' :
                          rec.status === 'Onaylandı' ? 'info' :
                          rec.status === 'Red' ? 'danger' : 'warning'
                        }`} style={{ padding: '4px 8px', borderRadius: 4, width: 'fit-content' }}>
                          {rec.status === 'Ödendi' ? 'Ödendi' :
                           rec.status === 'Onaylandı' ? 'Onaylandı' :
                           rec.status === 'Red' ? 'Reddedildi' : 'Onay Bekliyor'}
                        </span>
                        {rec.rejectReason && (
                          <span style={{ fontSize: '0.74rem', color: 'var(--danger-600)', fontStyle: 'italic', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={rec.rejectReason}>
                            {rec.rejectReason}
                          </span>
                        )}
                      </div>
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6 }}>
                        {rec.status === 'Beklemede' && (
                          <>
                            <button
                              className="btn btn-sm btn-secondary"
                              onClick={() => handleUpdateStatus(rec.id, 'Onaylandı')}
                              style={{ padding: '2px 6px', fontSize: '0.78rem' }}
                            >
                              Onayla
                            </button>
                            <button
                              className="btn btn-sm btn-secondary"
                              onClick={() => handleUpdateStatus(rec.id, 'Red')}
                              style={{ padding: '2px 6px', fontSize: '0.78rem', color: 'var(--danger-600)' }}
                            >
                              Reddet
                            </button>
                          </>
                        )}
                        {rec.status === 'Onaylandı' && (
                          <button
                            className="btn btn-sm btn-primary"
                            onClick={() => handleUpdateStatus(rec.id, 'Ödendi')}
                            style={{ padding: '2px 6px', fontSize: '0.78rem' }}
                          >
                            Ödendi İşaretle
                          </button>
                        )}
                        {rec.status === 'Red' && (
                          <button
                            className="btn btn-sm btn-secondary"
                            onClick={() => handleUpdateStatus(rec.id, 'Beklemede')}
                            style={{ padding: '2px 6px', fontSize: '0.78rem' }}
                          >
                            Yeniden Gönder
                          </button>
                        )}
                        {rec.status === 'Ödendi' && (
                          <span style={{ fontSize: '0.8rem', color: 'var(--success-600)', fontWeight: 600 }}>✓ Tamamlandı</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
