'use client';

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { IconSearch, IconCheck, IconWarning, IconRefresh, IconDownload, IconPlus, IconClose } from '../components/Icons';

export default function SGKPage() {
  const { addToast, setCurrentPage, patientsList, approveSGKPrescription } = useApp();
  const [tc, setTc] = useState('');
  const [queryResult, setQueryResult] = useState<null | 'success' | 'loading'>(null);
  const [matchedPatient, setMatchedPatient] = useState<any | null>(null);

  // Expanded Medula states
  const [activeTab, setActiveTab] = useState<'sorgu' | 'oranlar' | 'evrak' | 'medula-log'>('sorgu');

  // Simulated SGK Documents
  const [documents, setDocuments] = useState([
    { id: 'doc-1', patient: 'Kamil Yılmaz', type: 'KBB Raporu', status: 'Teslim Edildi', date: '2026-07-02' },
    { id: 'doc-2', patient: 'Ayşe Güler', type: 'E-Reçete', status: 'Onaylandı (GİB)', date: '2026-06-25' },
    { id: 'doc-3', patient: 'Mehmet Kaya', type: 'Odyogram Raporu', status: 'İncelemede', date: '2026-06-18' },
    { id: 'doc-4', patient: 'Ali Öztürk', type: 'KBB Raporu', status: 'Bekliyor', date: '2026-07-05' }
  ]);

  // Medula logs
  const [medulaLogs, setMedulaLogs] = useState([
    { id: 'log-1', timestamp: '2026-07-20 14:32:11', event: 'Provizyon Sorgulama', tc: '12345678901', status: 'Başarılı', details: 'Hak sahipliği mevcut. Kalan süre: 5 yıl dolmuş.' },
    { id: 'log-2', timestamp: '2026-07-20 11:15:04', event: 'Reçete Gönderimi', tc: '23456789012', status: 'Başarılı', details: 'E-reçete onaylandı. GİB kayıt numarası oluşturuldu.' },
    { id: 'log-3', timestamp: '2026-07-19 16:45:22', event: 'Provizyon Sorgulama', tc: '45678901234', status: 'Hata', details: 'Hak bulunmamaktadır. Son cihaz tarihi: 15.09.2024 (Süre dolmamış).' }
  ]);

  const handleQuery = () => {
    if (tc.length === 11) {
      setQueryResult('loading');
      setTimeout(() => {
        const matched = patientsList.find(p => p.tc === tc);
        let status = 'Pasif';
        let name = 'Bilinmeyen';
        let surname = 'Hasta';
        let bDate = '1965-01-01';

        if (matched) {
          name = matched.firstName;
          surname = matched.lastName;
          bDate = matched.birthDate;
          status = matched.sgkStatus || 'Pasif';
        } else {
          // Simulation
          const isEligible = Number(tc[10]) % 2 === 0;
          name = isEligible ? 'Saniye' : 'Kemal';
          surname = 'Öztürk';
          bDate = '1959-11-12';
          status = isEligible ? 'Yenileme Hakkı Var' : 'Pasif';
        }

        setMatchedPatient({
          firstName: name,
          lastName: surname,
          tc: tc,
          birthDate: bDate,
          sgkStatus: status
        });

        // Add log
        const newLog = {
          id: 'log-' + Date.now(),
          timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
          event: 'Provizyon Sorgulama',
          tc: tc,
          status: status === 'Yenileme Hakkı Var' ? 'Başarılı' : 'Hata',
          details: status === 'Yenileme Hakkı Var' ? 'Hak sahipliği mevcut.' : 'Son cihaz alım süresi dolmamış.'
        };
        setMedulaLogs(prev => [newLog, ...prev]);

        setQueryResult('success');
      }, 1200);
    }
  };

  const handleDocumentStatusChange = (id: string, newStatus: string) => {
    setDocuments(prev => prev.map(doc => {
      if (doc.id === id) {
        return { ...doc, status: newStatus };
      }
      return doc;
    }));
    addToast({ type: 'success', message: 'Evrak durumu başarıyla güncellendi.' });
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', minimumFractionDigits: 0 }).format(val);
  };

  return (
    <div className="page">
      <div className="page-header">
        <div className="page-header-left">
          <h2>SGK Medula & Reçete Portalı</h2>
          <p>Hasta provizyon sorgulamaları, evrak takipleri ve SGK geri ödeme referans listeleri</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-body" style={{ padding: '8px 16px' }}>
          <div className="tabs" style={{ border: 'none', margin: 0 }}>
            <button className={`tab ${activeTab === 'sorgu' ? 'active' : ''}`} onClick={() => setActiveTab('sorgu')}>
              🔍 Medula Hak Sorgulama
            </button>
            <button className={`tab ${activeTab === 'oranlar' ? 'active' : ''}`} onClick={() => setActiveTab('oranlar')}>
              📋 SGK Ödeme Oranları
            </button>
            <button className={`tab ${activeTab === 'evrak' ? 'active' : ''}`} onClick={() => setActiveTab('evrak')}>
              📂 Evrak & Rapor Takibi
            </button>
            <button className={`tab ${activeTab === 'medula-log' ? 'active' : ''}`} onClick={() => setActiveTab('medula-log')}>
              🕒 Medula Bildirim Günlüğü
            </button>
          </div>
        </div>
      </div>

      {/* Content tabs */}
      {activeTab === 'sorgu' && (
        <>
          <div className="card" style={{ marginBottom: 20 }}>
            <div className="card-header">
              <span className="card-title">Hasta Hak Sahipliği Doğrulama (Provizyon)</span>
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
                  <IconSearch size={16} strokeWidth={2} /> Sorgula
                </button>
              </div>

              {queryResult === 'loading' && (
                <div style={{ marginTop: 30, padding: 20, textAlign: 'center', color: 'var(--gray-500)' }}>
                  <div style={{ fontSize: '2rem', animation: 'pulse 1.5s infinite', display: 'flex', justifyContent: 'center' }}>
                    <IconRefresh size={36} strokeWidth={1.4} />
                  </div>
                  <p style={{ marginTop: 8 }}>Medula sistemine bağlanılıyor, TC hak durumu doğrulanıyor...</p>
                </div>
              )}

              {queryResult === 'success' && matchedPatient && (
                <div style={{ marginTop: 24 }}>
                  {matchedPatient.sgkStatus === 'Yenileme Hakkı Var' ? (
                    <div style={{
                      padding: '16px 20px',
                      background: 'var(--success-50)',
                      border: '1px solid var(--success-200)',
                      borderRadius: 'var(--radius-lg)',
                      marginBottom: 16,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10
                    }}>
                      <span style={{ color: 'var(--success-600)' }}><IconCheck size={20} strokeWidth={2.2} /></span>
                      <div>
                        <div style={{ fontWeight: 700, color: 'var(--success-700)' }}>Hak Sahipliği Doğrulandı</div>
                        <div style={{ fontSize: '0.82rem', color: 'var(--success-600)' }}>Hasta SGK kapsamındadır ve yeni bir işitme cihazı alma hakkı mevcuttur.</div>
                      </div>
                    </div>
                  ) : (
                    <div style={{
                      padding: '16px 20px',
                      background: 'var(--warning-50)',
                      border: '1px solid var(--warning-200)',
                      borderRadius: 'var(--radius-lg)',
                      marginBottom: 16,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10
                    }}>
                      <span style={{ color: 'var(--warning-600)' }}><IconWarning size={20} strokeWidth={2.2} /></span>
                      <div>
                        <div style={{ fontWeight: 700, color: 'var(--warning-700)' }}>Cihaz Yenileme Hakkı Yok</div>
                        <div style={{ fontSize: '0.82rem', color: 'var(--warning-600)' }}>Son cihaz alım tarihi üzerinden 5 yıllık yasal süre dolmamıştır.</div>
                      </div>
                    </div>
                  )}

                  <div className="responsive-grid-2" style={{ gap: 16 }}>
                    <div className="card" style={{ border: '1px solid var(--gray-200)' }}>
                      <div className="card-body">
                        <div style={{ fontWeight: 700, color: 'var(--gray-700)', marginBottom: 8, fontSize: '0.9rem' }}>Hasta Detayları</div>
                        <div style={{ display: 'grid', gap: 6, fontSize: '0.86rem' }}>
                          <div><span style={{ color: 'var(--gray-500)' }}>Ad Soyad:</span> <strong>{matchedPatient.firstName} {matchedPatient.lastName}</strong></div>
                          <div><span style={{ color: 'var(--gray-500)' }}>TCKN:</span> <strong style={{ fontFamily: 'monospace' }}>{matchedPatient.tc}</strong></div>
                          <div><span style={{ color: 'var(--gray-500)' }}>Doğum Tarihi:</span> <strong>{matchedPatient.birthDate}</strong></div>
                          <div><span style={{ color: 'var(--gray-500)' }}>Sigorta Grubu:</span> <strong>Emekli (4/B)</strong></div>
                        </div>
                      </div>
                    </div>

                    <div className="card" style={{ border: '1px solid var(--gray-200)' }}>
                      <div className="card-body">
                        <div style={{ fontWeight: 700, color: 'var(--gray-700)', marginBottom: 8, fontSize: '0.9rem' }}>Kapsam ve Süre Bilgisi</div>
                        <div style={{ display: 'grid', gap: 6, fontSize: '0.86rem' }}>
                          <div><span style={{ color: 'var(--gray-500)' }}>Son Cihaz Tarihi:</span> <strong>{matchedPatient.sgkStatus === 'Yenileme Hakkı Var' ? '12.04.2020' : '22.09.2024'}</strong></div>
                          <div><span style={{ color: 'var(--gray-500)' }}>Kalan Süre:</span> <strong>{matchedPatient.sgkStatus === 'Yenileme Hakkı Var' ? 'Yasal limit doldu (Alabilir)' : '3 Yıl, 2 Ay'}</strong></div>
                          <div><span style={{ color: 'var(--gray-500)' }}>Hak Ediş Tutarı:</span> <strong style={{ color: 'var(--primary-600)', fontSize: '1rem' }}>{matchedPatient.sgkStatus === 'Yenileme Hakkı Var' ? formatCurrency(6200) : '₺0 (Süre Yetersiz)'}</strong></div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div style={{ marginTop: 20, display: 'flex', gap: 10 }}>
                    <button className="btn btn-primary" onClick={() => {
                      approveSGKPrescription(matchedPatient.id, `REC-2026-${Math.floor(1000 + Math.random() * 9000)}`, `RAP-2026-${Math.floor(1000 + Math.random() * 9000)}`);
                    }}>
                      Reçete/Rapor Bağla (5 Yıllık Otomatik Recall Kur)
                    </button>
                    <button className="btn btn-secondary" onClick={() => setCurrentPage('appointments')}>
                      Randevu Planla
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Quick Stats bottom cards */}
          <div className="responsive-grid-2" style={{ gap: 16 }}>
            <div className="card">
              <div className="card-header"><span className="card-title">Son İşlemler</span></div>
              <div className="card-body" style={{ padding: 0 }}>
                {[
                  { patient: 'Ziya Kaya', date: '2026-07-20', device: 'Phonak Audéo L90', status: 'Onaylandı' },
                  { patient: 'Ayşe Güler', date: '2026-07-19', device: 'Oticon More 1', status: 'Bekliyor' },
                  { patient: 'Kamil Yılmaz', date: '2026-07-18', device: 'Signia Active Pro', status: 'Onaylandı' }
                ].map((item, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px', borderBottom: i < 2 ? '1px solid var(--surface-border-light)' : 'none' }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.86rem' }}>{item.patient}</div>
                      <div style={{ fontSize: '0.76rem', color: 'var(--gray-400)' }}>{item.device}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span className={`badge badge-${item.status === 'Onaylandı' ? 'success' : 'warning'}`} style={{ fontSize: '0.74rem' }}>{item.status}</span>
                      <div style={{ fontSize: '0.74rem', color: 'var(--gray-400)', marginTop: 2 }}>{item.date}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="card">
              <div className="card-header"><span className="card-title">Hak Ediş İstatistikleri</span></div>
              <div className="card-body" style={{ display: 'grid', gap: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: 'var(--success-50)', borderRadius: 4 }}>
                  <span style={{ fontSize: '0.84rem', color: 'var(--gray-700)' }}>Tahsil Edilen (2026)</span>
                  <strong style={{ color: 'var(--success-700)' }}>{formatCurrency(43400)}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: 'var(--info-50)', borderRadius: 4 }}>
                  <span style={{ fontSize: '0.84rem', color: 'var(--gray-700)' }}>Bekleyen Devlet Katkısı</span>
                  <strong style={{ color: 'var(--info-600)' }}>{formatCurrency(12400)}</strong>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {activeTab === 'oranlar' && (
        <div className="card">
          <div className="card-header">
            <span className="card-title">SGK İşitme Cihazı Ödeme Tutarları & Oran Referans Listesi</span>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            <table className="table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: 'var(--gray-50)', borderBottom: '1px solid var(--surface-border)' }}>
                  <th style={{ padding: '12px 16px', fontWeight: 600, fontSize: '0.84rem' }}>Hasta Grubu</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600, fontSize: '0.84rem' }}>Çalışan Katkısı (%20)</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600, fontSize: '0.84rem' }}>Emekli Katkısı (%10)</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600, fontSize: '0.84rem' }}>Net SGK Ödemesi</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600, fontSize: '0.84rem' }}>Yasal Yenileme Süresi</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: '1px solid var(--surface-border-light)' }}>
                  <td style={{ padding: '14px 16px', fontWeight: 600 }}>Yetişkin (18+ Yaş)</td>
                  <td style={{ padding: '14px 16px' }}>₺4.960</td>
                  <td style={{ padding: '14px 16px' }}>₺5.580</td>
                  <td style={{ padding: '14px 16px', fontWeight: 700, color: 'var(--primary-600)' }}>₺6.200</td>
                  <td style={{ padding: '14px 16px' }}>5 Yıl</td>
                </tr>
                <tr style={{ borderBottom: '1px solid var(--surface-border-light)' }}>
                  <td style={{ padding: '14px 16px', fontWeight: 600 }}>Çocuk (0-4 Yaş)</td>
                  <td style={{ padding: '14px 16px' }}>₺8.960</td>
                  <td style={{ padding: '14px 16px' }}>₺10.080</td>
                  <td style={{ padding: '14px 16px', fontWeight: 700, color: 'var(--primary-600)' }}>₺11.200</td>
                  <td style={{ padding: '14px 16px' }}>5 Yıl</td>
                </tr>
                <tr style={{ borderBottom: '1px solid var(--surface-border-light)' }}>
                  <td style={{ padding: '14px 16px', fontWeight: 600 }}>Çocuk (5-12 Yaş)</td>
                  <td style={{ padding: '14px 16px' }}>₺7.960</td>
                  <td style={{ padding: '14px 16px' }}>₺8.950</td>
                  <td style={{ padding: '14px 16px', fontWeight: 700, color: 'var(--primary-600)' }}>₺9.950</td>
                  <td style={{ padding: '14px 16px' }}>5 Yıl</td>
                </tr>
                <tr style={{ borderBottom: '1px solid var(--surface-border-light)' }}>
                  <td style={{ padding: '14px 16px', fontWeight: 600 }}>Genç (13-18 Yaş)</td>
                  <td style={{ padding: '14px 16px' }}>₺6.960</td>
                  <td style={{ padding: '14px 16px' }}>₺7.830</td>
                  <td style={{ padding: '14px 16px', fontWeight: 700, color: 'var(--primary-600)' }}>₺8.700</td>
                  <td style={{ padding: '14px 16px' }}>5 Yıl</td>
                </tr>
              </tbody>
            </table>
            <div style={{ padding: 16, fontSize: '0.8rem', color: 'var(--gray-500)', lineHeight: 1.4 }}>
              * Fiyatlar SGK Sağlık Uygulama Tebliği (SUT) uyarınca güncellenmiştir. Çift kulak cihaz alımlarında, her iki kulak için ayrı hak ediş tanımlanmaktadır.
            </div>
          </div>
        </div>
      )}

      {activeTab === 'evrak' && (
        <div className="card">
          <div className="card-header">
            <span className="card-title">Evrak & Rapor Süreç Takibi</span>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            <table className="table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: 'var(--gray-50)', borderBottom: '1px solid var(--surface-border)' }}>
                  <th style={{ padding: '12px 16px', fontWeight: 600, fontSize: '0.84rem' }}>Hasta</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600, fontSize: '0.84rem' }}>Belge Türü</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600, fontSize: '0.84rem' }}>Giriş Tarihi</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600, fontSize: '0.84rem' }}>Süreç Durumu</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600, fontSize: '0.84rem', textAlign: 'right' }}>İşlem</th>
                </tr>
              </thead>
              <tbody>
                {documents.map((doc) => (
                  <tr key={doc.id} style={{ borderBottom: '1px solid var(--surface-border-light)' }}>
                    <td style={{ padding: '14px 16px', fontWeight: 600 }}>{doc.patient}</td>
                    <td style={{ padding: '14px 16px', fontSize: '0.86rem' }}>{doc.type}</td>
                    <td style={{ padding: '14px 16px', fontSize: '0.86rem' }}>{doc.date}</td>
                    <td style={{ padding: '14px 16px' }}>
                      <span className={`badge badge-${
                        doc.status === 'Onaylandı (GİB)' ? 'success' :
                        doc.status === 'İncelemede' ? 'info' :
                        doc.status === 'Bekliyor' ? 'warning' : 'neutral'
                      }`} style={{ fontSize: '0.8rem' }}>
                        {doc.status}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                      <select
                        className="form-input"
                        value={doc.status}
                        onChange={(e) => handleDocumentStatusChange(doc.id, e.target.value)}
                        style={{ margin: 0, width: 140, padding: '4px 8px', fontSize: '0.78rem', height: 28 }}
                      >
                        <option value="Bekliyor">Bekliyor</option>
                        <option value="Teslim Edildi">Teslim Edildi</option>
                        <option value="İncelemede">İncelemede</option>
                        <option value="Onaylandı (GİB)">Onaylandı</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'medula-log' && (
        <div className="card">
          <div className="card-header">
            <span className="card-title">Medula Sistem Bildirim Günlüğü</span>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            <table className="table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: 'var(--gray-50)', borderBottom: '1px solid var(--surface-border)' }}>
                  <th style={{ padding: '12px 16px', fontWeight: 600, fontSize: '0.84rem' }}>Tarih / Saat</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600, fontSize: '0.84rem' }}>İşlem Türü</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600, fontSize: '0.84rem' }}>Hasta TC</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600, fontSize: '0.84rem' }}>Durum</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600, fontSize: '0.84rem' }}>Detay / Hata Açıklaması</th>
                </tr>
              </thead>
              <tbody>
                {medulaLogs.map((log) => (
                  <tr key={log.id} style={{ borderBottom: '1px solid var(--surface-border-light)' }}>
                    <td style={{ padding: '14px 16px', fontSize: '0.82rem', fontFamily: 'monospace' }}>{log.timestamp}</td>
                    <td style={{ padding: '14px 16px', fontWeight: 600, fontSize: '0.86rem' }}>{log.event}</td>
                    <td style={{ padding: '14px 16px', fontFamily: 'monospace', fontSize: '0.86rem' }}>{log.tc}</td>
                    <td style={{ padding: '14px 16px' }}>
                      <span className={`badge badge-${log.status === 'Başarılı' ? 'success' : 'danger'}`} style={{ fontSize: '0.78rem' }}>
                        {log.status}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: '0.82rem', color: 'var(--gray-600)' }}>{log.details}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
