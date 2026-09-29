'use client';

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { IconSearch } from '../components/Icons';
import { useBranchScope } from '../hooks/useBranchScope';

export default function SGKPage() {
  const { addToast, setCurrentPage, patientsList: allPatients, approveSGKPrescription } = useApp();
  const { matches } = useBranchScope();
  const patientsList = React.useMemo(() => allPatients.filter(p => matches(p.branch, p.branchId)), [allPatients, matches]);
  const [tc, setTc] = useState('');
  const [queryResult, setQueryResult] = useState<null | 'success' | 'not-found'>(null);
  const [matchedPatient, setMatchedPatient] = useState<any | null>(null);
  const [prescriptionNo, setPrescriptionNo] = useState('');
  const [reportNo, setReportNo] = useState('');

  // Expanded Medula states
  const [activeTab, setActiveTab] = useState<'sorgu' | 'oranlar' | 'evrak' | 'medula-log'>('sorgu');

  const handleQuery = () => {
    if (tc.length !== 11) return;
    const matched = patientsList.find(patient => patient.tc === tc);
    setMatchedPatient(matched ? { ...matched, tc } : null);
    setQueryResult(matched ? 'success' : 'not-found');
    setPrescriptionNo(matched?.prescriptionNo || '');
    setReportNo(matched?.reportNo || '');
  };

  const savePrescriptionNumbers = async () => {
    if (!matchedPatient) return;
    try {
      await approveSGKPrescription(matchedPatient.id, prescriptionNo, reportNo);
    } catch (error) {
      addToast({ type: 'error', message: error instanceof Error ? error.message : 'Reçete bilgileri kaydedilemedi.' });
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <div className="page-header-left">
          <h2>SGK & Reçete Kayıtları</h2>
          <p>Kayıtlı hastanın reçete ve rapor numaraları. Medula sorgusu bu uygulamada etkin değildir.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-body" style={{ padding: '8px 16px' }}>
          <div className="tabs" style={{ border: 'none', margin: 0 }}>
            <button className={`tab ${activeTab === 'sorgu' ? 'active' : ''}`} onClick={() => setActiveTab('sorgu')}>
              🔍 Hasta / Reçete Kaydı
            </button>
            <button className={`tab ${activeTab === 'oranlar' ? 'active' : ''}`} onClick={() => setActiveTab('oranlar')}>
              📋 SGK Dönem Faturaları
            </button>
            <button className={`tab ${activeTab === 'evrak' ? 'active' : ''}`} onClick={() => setActiveTab('evrak')}>
              📂 Evrak & Rapor Takibi
            </button>
            <button className={`tab ${activeTab === 'medula-log' ? 'active' : ''}`} onClick={() => setActiveTab('medula-log')}>
              🕒 Medula Entegrasyon Durumu
            </button>
          </div>
        </div>
      </div>

      {/* Content tabs */}
      {activeTab === 'sorgu' && (
        <>
          <div className="card" style={{ marginBottom: 20 }}>
            <div className="card-header">
              <span className="card-title">Kayıtlı Hastayı Bul</span>
            </div>
            <div className="card-body">
              <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end' }}>
                <div className="form-group" style={{ flex: 1, margin: 0 }}>
                  <label className="form-label">TC Kimlik Numarası</label>
                  <input
                    className="form-input"
                    placeholder="11 haneli TC kimlik numarası girin"
                    maxLength={11}
                    value={tc}
                    onChange={(e) => {
                      setTc(e.target.value.replace(/\D/g, ''));
                      setQueryResult(null);
                    }}
                  />
                </div>
                <button
                  className="btn btn-primary btn-lg"
                  onClick={handleQuery}
                  disabled={tc.length !== 11}
                  style={{ opacity: tc.length !== 11 ? 0.5 : 1, display: 'flex', alignItems: 'center', gap: 7 }}
                >
                  <IconSearch size={16} strokeWidth={2} /> Hasta Bul
                </button>
              </div>

              <p style={{ marginTop: 12, color: 'var(--warning-700)', fontSize: '0.82rem' }}>
                Bu arama yalnızca kayıtlı hastayı bulur. Sistem Medula&apos;ya bağlı değildir ve SGK hak sahipliğini doğrulamaz.
              </p>

              {queryResult === 'not-found' && <div className="empty-state" style={{ padding: 20 }}>Bu şubede bu T.C. kimlik numarasına ait hasta bulunamadı.</div>}

              {queryResult === 'success' && matchedPatient && (
                <div style={{ marginTop: 24 }}>
                  <div style={{ padding: '14px 18px', background: 'var(--warning-50)', border: '1px solid var(--warning-200)', borderRadius: 'var(--radius-lg)', marginBottom: 16 }}>
                    <strong style={{ color: 'var(--warning-700)' }}>Hasta kaydı bulundu; SGK uygunluğu doğrulanmadı.</strong>
                  </div>

                  <div className="responsive-grid-2" style={{ gap: 16 }}>
                    <div className="card" style={{ border: '1px solid var(--gray-200)' }}>
                      <div className="card-body">
                        <div style={{ fontWeight: 700, color: 'var(--gray-700)', marginBottom: 8, fontSize: '0.9rem' }}>Hasta Detayları</div>
                        <div style={{ display: 'grid', gap: 6, fontSize: '0.86rem' }}>
                          <div><span style={{ color: 'var(--gray-500)' }}>Ad Soyad:</span> <strong>{matchedPatient.firstName} {matchedPatient.lastName}</strong></div>
                          <div><span style={{ color: 'var(--gray-500)' }}>TCKN:</span> <strong style={{ fontFamily: 'monospace' }}>{matchedPatient.tc}</strong></div>
                          <div><span style={{ color: 'var(--gray-500)' }}>Doğum Tarihi:</span> <strong>{matchedPatient.birthDate}</strong></div>
                          <div><span style={{ color: 'var(--gray-500)' }}>Kayıtlı SGK durumu:</span> <strong>{matchedPatient.sgkStatus || 'Belirtilmemiş'}</strong></div>
                        </div>
                      </div>
                    </div>

                    <div className="card" style={{ border: '1px solid var(--gray-200)' }}>
                      <div className="card-body">
                        <div style={{ fontWeight: 700, color: 'var(--gray-700)', marginBottom: 8, fontSize: '0.9rem' }}>Reçete / Rapor Bilgileri</div>
                        <div style={{ display: 'grid', gap: 6, fontSize: '0.86rem' }}>
                          <div><span style={{ color: 'var(--gray-500)' }}>Reçete numarası:</span> <strong>{matchedPatient.prescriptionNo || 'Belirtilmemiş'}</strong></div>
                          <div><span style={{ color: 'var(--gray-500)' }}>Rapor numarası:</span> <strong>{matchedPatient.reportNo || 'Belirtilmemiş'}</strong></div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="responsive-grid-2" style={{ marginTop: 20, gap: 12 }}>
                    <label className="form-group">Reçete numarası<input className="form-input" value={prescriptionNo} onChange={event => setPrescriptionNo(event.target.value)} /></label>
                    <label className="form-group">Rapor numarası<input className="form-input" value={reportNo} onChange={event => setReportNo(event.target.value)} /></label>
                  </div>
                  <div style={{ marginTop: 12, display: 'flex', gap: 10 }}>
                    <button className="btn btn-primary" onClick={savePrescriptionNumbers} disabled={!prescriptionNo.trim() || !reportNo.trim()}>
                      Reçete / rapor numaralarını kaydet
                    </button>
                    <button className="btn btn-secondary" onClick={() => setCurrentPage('appointments')}>
                      Randevu Planla
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="card">
            <div className="card-body" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
              <span>SGK dönem faturalarını ve yaklaşık tahsilat ayını takip edin. Gerçek tahsilatlar bu ekranda SGK&apos;dan otomatik alınmaz.</span>
              <button className="btn btn-secondary" onClick={() => setCurrentPage('sgk-receivables')}>Ödeme takvimine git</button>
            </div>
          </div>
        </>
      )}

      {activeTab === 'oranlar' && (
        <div className="card">
          <div className="card-header">
            <span className="card-title">SGK dönem faturaları</span>
          </div>
          <div className="card-body">
            <p>SGK&apos;ya kesilen dönem faturası ve tahmini tahsilat tarihleri manuel olarak kaydedilir. SGK&apos;dan alınmış ödeme, kesinti veya hak ediş bilgisi bu sistemde otomatik sorgulanmaz.</p>
            <button className="btn btn-primary" onClick={() => setCurrentPage('sgk-receivables')}>SGK Ödeme Takvimini Aç</button>
          </div>
        </div>
      )}

      {activeTab === 'evrak' && (
        <div className="card">
          <div className="card-header">
            <span className="card-title">Evrak & Rapor Süreç Takibi</span>
          </div>
          <div className="card-body">
            <div className="empty-state">Henüz kalıcı SGK evrak kaydı yok. Bu modülde evrak yükleme ve durum takibi henüz etkin değil.</div>
          </div>
        </div>
      )}

      {activeTab === 'medula-log' && (
        <div className="card">
          <div className="card-header">
            <span className="card-title">Medula Entegrasyon Durumu</span>
          </div>
          <div className="card-body">
            <div className="empty-state">Medula bağlantısı olmadığından sistem bildirimi veya sorgu günlüğü bulunmuyor.</div>
          </div>
        </div>
      )}
    </div>
  );
}
