'use client';

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { IconSearch, IconCheck, IconWarning, IconSGK, IconRefresh } from '../components/Icons';

export default function SGKPage() {
  const { addToast, setCurrentPage } = useApp();
  const [tc, setTc] = useState('');
  const [queryResult, setQueryResult] = useState<null | 'success' | 'loading'>(null);

  const handleQuery = () => {
    if (tc.length === 11) {
      setQueryResult('loading');
      setTimeout(() => setQueryResult('success'), 1500);
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <div className="page-header-left">
          <h2>SGK & Reçete İşlemleri</h2>
          <p>Medula entegrasyonu ve hak ediş sorgulama</p>
        </div>
      </div>

      {/* SGK Query */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-header">
          <span className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <IconSearch size={16} strokeWidth={1.7} />
            Hasta Hak Sahipliği Sorgulama
          </span>
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
              <IconSearch size={16} strokeWidth={1.8} /> Sorgula
            </button>
          </div>

          {queryResult === 'loading' && (
            <div style={{
              marginTop: 20,
              padding: 20,
              textAlign: 'center',
              color: 'var(--gray-500)',
            }}>
              <div style={{ fontSize: '2rem', animation: 'pulse 1.5s infinite', display: 'flex', justifyContent: 'center' }}>
                <IconRefresh size={36} strokeWidth={1.4} />
              </div>
              <p style={{ marginTop: 8 }}>Medula sistemi sorgulanıyor...</p>
            </div>
          )}

          {queryResult === 'success' && (
            <div style={{ marginTop: 20 }}>
              <div style={{
                padding: '16px 20px',
                background: 'var(--success-50)',
                border: '1px solid var(--success-200)',
                borderRadius: 'var(--radius-lg)',
                marginBottom: 16,
                display: 'flex',
                alignItems: 'center',
                gap: 10,
              }}>
                <span style={{ color: 'var(--success-600)', flexShrink: 0 }}>
                  <IconCheck size={20} strokeWidth={2} />
                </span>
                <div>
                  <div style={{ fontWeight: 700, color: 'var(--success-700)' }}>Hak Sahipliği Doğrulandı</div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--success-600)' }}>SGK Genel Sağlık Sigortası aktif</div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div className="card" style={{ border: '1px solid var(--gray-200)' }}>
                  <div className="card-body">
                    <div style={{ fontSize: '0.72rem', color: 'var(--gray-500)', marginBottom: 4 }}>Hasta Bilgileri</div>
                    <div style={{ display: 'grid', gap: 8 }}>
                      <div>
                        <span style={{ fontSize: '0.78rem', color: 'var(--gray-500)' }}>Ad Soyad: </span>
                        <span style={{ fontWeight: 600 }}>Ayşe Yılmaz</span>
                      </div>
                      <div>
                        <span style={{ fontSize: '0.78rem', color: 'var(--gray-500)' }}>TC: </span>
                        <span style={{ fontWeight: 600, fontFamily: 'monospace' }}>{tc}</span>
                      </div>
                      <div>
                        <span style={{ fontSize: '0.78rem', color: 'var(--gray-500)' }}>Doğum Tarihi: </span>
                        <span style={{ fontWeight: 600 }}>15.03.1958</span>
                      </div>
                      <div>
                        <span style={{ fontSize: '0.78rem', color: 'var(--gray-500)' }}>Sigorta Türü: </span>
                        <span style={{ fontWeight: 600 }}>4/A (SSK)</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="card" style={{ border: '1px solid var(--gray-200)' }}>
                  <div className="card-body">
                    <div style={{ fontSize: '0.72rem', color: 'var(--gray-500)', marginBottom: 4 }}>İşitme Cihazı Hak Durumu</div>
                    <div style={{ display: 'grid', gap: 8 }}>
                      <div>
                        <span style={{ fontSize: '0.78rem', color: 'var(--gray-500)' }}>Son Cihaz Tarihi: </span>
                        <span style={{ fontWeight: 600 }}>20.06.2021</span>
                      </div>
                      <div>
                        <span style={{ fontSize: '0.78rem', color: 'var(--gray-500)' }}>Yenileme Hakkı: </span>
                        <span className="badge badge-success">✓ Hakkı Açık</span>
                      </div>
                      <div>
                        <span style={{ fontSize: '0.78rem', color: 'var(--gray-500)' }}>Kalan Süre: </span>
                        <span style={{ fontWeight: 600 }}>5 yıl doldu</span>
                      </div>
                      <div>
                        <span style={{ fontSize: '0.78rem', color: 'var(--gray-500)' }}>SGK Karşılama: </span>
                        <span style={{ fontWeight: 700, color: 'var(--primary-600)' }}>₺6.200</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

               <div style={{ marginTop: 16, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                 <button className="btn btn-primary" onClick={() => addToast({ type: 'success', message: 'Medula sisteminde e-reçete kaydı başarıyla oluşturuldu.' })}>
                   Reçete Oluştur
                 </button>
                 <button className="btn btn-secondary" onClick={() => setCurrentPage('appointments')}>
                   Randevu Oluştur
                 </button>
                 <button className="btn btn-secondary" onClick={() => addToast({ type: 'success', message: 'Doğrulanan Medula bilgileri hastanın profiline başarıyla kaydedildi.' })}>
                   Hastaya Kaydet
                 </button>
               </div>
            </div>
          )}
        </div>
      </div>

      {/* Recent SGK Operations */}
      <div className="dashboard-grid">
        <div className="card">
          <div className="card-header">
            <span className="card-title">📋 Son Reçeteler</span>
          </div>
          <div className="card-body">
            {[
              { patient: 'Mehmet Kaya', date: '05.07.2026', device: 'Oticon More 1', status: 'Onaylandı' },
              { patient: 'Ali Demir', date: '10.06.2026', device: 'Phonak Naída P70', status: 'Bekliyor' },
              { patient: 'Fatma Özkan', date: '12.09.2022', device: 'Signia Pure 7Nx', status: 'Onaylandı' },
            ].map((item, i) => (
              <div key={i} style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 0',
                borderBottom: i < 2 ? '1px solid var(--gray-100)' : 'none',
              }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>{item.patient}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>{item.device}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.78rem', color: 'var(--gray-500)' }}>{item.date}</div>
                  <span className={`badge badge-${item.status === 'Onaylandı' ? 'success' : 'warning'}`}>
                    {item.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <span className="card-title">💰 Hak Ediş Özeti</span>
          </div>
          <div className="card-body">
            <div style={{ display: 'grid', gap: 12 }}>
              <div style={{
                padding: '12px 16px',
                background: 'var(--success-50)',
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--gray-700)' }}>Temmuz 2026 SGK Alacak</span>
                <span style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--success-700)' }}>₺6.200</span>
              </div>
              <div style={{
                padding: '12px 16px',
                background: 'var(--info-50)',
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--gray-700)' }}>Haziran 2026 SGK Alacak</span>
                <span style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--info-600)' }}>₺12.400</span>
              </div>
              <div style={{
                padding: '12px 16px',
                background: 'var(--gray-50)',
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--gray-700)' }}>Toplam Tahsil Edilen (2026)</span>
                <span style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--gray-800)' }}>₺43.400</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
