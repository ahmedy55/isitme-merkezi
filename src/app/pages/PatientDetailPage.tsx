'use client';

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  patients, appointments, sales,
  getAvatarColor, getInitials, formatDate, formatCurrency, calculateAge,
} from '../data/mockData';

const FREQUENCIES = [250, 500, 1000, 2000, 3000, 4000, 6000, 8000];

export default function PatientDetailPage() {
  const { selectedPatientId, setCurrentPage } = useApp();
  const [activeTab, setActiveTab] = useState('genel');

  const patient = patients.find(p => p.id === selectedPatientId);
  if (!patient) {
    return (
      <div className="page">
        <div className="empty-state">
          <div className="empty-state-icon">👤</div>
          <h3>Hasta bulunamadı</h3>
          <button className="btn btn-primary" onClick={() => setCurrentPage('patients')}>
            ← Hasta Listesine Dön
          </button>
        </div>
      </div>
    );
  }

  const patientAppointments = appointments.filter(a => a.patientId === patient.id);
  const patientSales = sales.filter(s => s.patientId === patient.id);

  return (
    <div className="page">
      {/* Back Button */}
      <button
        className="btn btn-ghost"
        onClick={() => setCurrentPage('patients')}
        style={{ marginBottom: 16 }}
      >
        ← Hasta Listesine Dön
      </button>

      {/* Patient Header */}
      <div className="patient-header">
        <div
          className="avatar avatar-xl"
          style={{ background: getAvatarColor(patient.firstName) }}
        >
          {getInitials(patient.firstName, patient.lastName)}
        </div>
        <div className="patient-header-info">
          <h2>{patient.firstName} {patient.lastName}</h2>
          <div className="patient-header-meta">
            <span>🪪 {patient.tc}</span>
            <span>📞 {patient.phone}</span>
            <span>🎂 {calculateAge(patient.birthDate)} yaşında</span>
            <span>📍 {patient.address}</span>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <span className={`badge badge-${
              patient.hearingLoss === 'Hafif' ? 'success' :
              patient.hearingLoss === 'Orta' ? 'warning' : 'danger'
            }`}>
              {patient.hearingLoss} İşitme Kaybı · {patient.hearingLossSide}
            </span>
            <span className={`badge badge-${
              patient.sgkStatus === 'Aktif' ? 'success' :
              patient.sgkStatus === 'Yenileme Hakkı Var' ? 'warning' : 'neutral'
            }`}>
              SGK: {patient.sgkStatus}
            </span>
          </div>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          <button className="btn btn-secondary">✏️ Düzenle</button>
          <button className="btn btn-primary">📅 Randevu Oluştur</button>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs">
        {[
          { id: 'genel', label: '📋 Genel Bilgiler' },
          { id: 'odyogram', label: '🎧 Odyogram' },
          { id: 'cihaz-onerisi', label: '🤖 Akıllı Cihaz Önerisi' },
          { id: 'randevular', label: '📅 Randevular' },
          { id: 'satis', label: '💰 Satışlar' },
          { id: 'notlar', label: '📝 Notlar' },
        ].map((tab) => (
          <button
            key={tab.id}
            className={`tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="patient-tabs-content">
        {activeTab === 'genel' && (
          <div className="dashboard-grid">
            <div className="card">
              <div className="card-header">
                <span className="card-title">👤 Kişisel Bilgiler</span>
              </div>
              <div className="card-body">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px 24px' }}>
                  <div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--gray-500)', marginBottom: 2 }}>Ad Soyad</div>
                    <div style={{ fontWeight: 600 }}>{patient.firstName} {patient.lastName}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--gray-500)', marginBottom: 2 }}>TC Kimlik</div>
                    <div style={{ fontWeight: 600, fontFamily: 'monospace' }}>{patient.tc}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--gray-500)', marginBottom: 2 }}>Doğum Tarihi</div>
                    <div style={{ fontWeight: 600 }}>{formatDate(patient.birthDate)} ({calculateAge(patient.birthDate)} yaş)</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--gray-500)', marginBottom: 2 }}>Cinsiyet</div>
                    <div style={{ fontWeight: 600 }}>{patient.gender}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--gray-500)', marginBottom: 2 }}>Telefon</div>
                    <div style={{ fontWeight: 600 }}>{patient.phone}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--gray-500)', marginBottom: 2 }}>E-posta</div>
                    <div style={{ fontWeight: 600 }}>{patient.email}</div>
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <div style={{ fontSize: '0.72rem', color: 'var(--gray-500)', marginBottom: 2 }}>Adres</div>
                    <div style={{ fontWeight: 600 }}>{patient.address}</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card-header">
                <span className="card-title">🦻 Cihaz Bilgileri</span>
              </div>
              <div className="card-body">
                <div style={{ display: 'grid', gap: '14px' }}>
                  <div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--gray-500)', marginBottom: 2 }}>İşitme Kaybı</div>
                    <div style={{ fontWeight: 600 }}>{patient.hearingLoss} · {patient.hearingLossSide}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--gray-500)', marginBottom: 2 }}>Mevcut Cihaz</div>
                    <div style={{ fontWeight: 600 }}>{patient.currentDevice || 'Cihaz yok'}</div>
                  </div>
                  {patient.deviceDate && (
                    <div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--gray-500)', marginBottom: 2 }}>Cihaz Alım Tarihi</div>
                      <div style={{ fontWeight: 600 }}>{formatDate(patient.deviceDate)}</div>
                    </div>
                  )}
                  <div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--gray-500)', marginBottom: 2 }}>SGK Durumu</div>
                    <div style={{ fontWeight: 600 }}>{patient.sgkStatus}</div>
                  </div>
                  {patient.sgkRenewalDate && (
                    <div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--gray-500)', marginBottom: 2 }}>SGK Yenileme Tarihi</div>
                      <div style={{ fontWeight: 600 }}>{formatDate(patient.sgkRenewalDate)}</div>
                    </div>
                  )}
                  <div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--gray-500)', marginBottom: 2 }}>Kayıt Tarihi</div>
                    <div style={{ fontWeight: 600 }}>{formatDate(patient.createdAt)}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--gray-500)', marginBottom: 2 }}>Son Ziyaret</div>
                    <div style={{ fontWeight: 600 }}>{formatDate(patient.lastVisit)}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'odyogram' && (
          <div className="card">
            <div className="card-header">
              <span className="card-title">🎧 Odyogram Sonuçları</span>
              <button className="btn btn-sm btn-primary">📤 Yeni Test Ekle</button>
            </div>
            <div className="card-body">
              {/* Simple Audiogram Visualization */}
              <div style={{ overflowX: 'auto' }}>
                <table>
                  <thead>
                    <tr>
                      <th>Frekans (Hz)</th>
                      {FREQUENCIES.map(f => (
                        <th key={f} style={{ textAlign: 'center' }}>{f}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="td-primary">
                        <span style={{ color: 'var(--danger-500)' }}>● </span>Sağ Kulak (dB)
                      </td>
                      {patient.audiogramRight.map((val, i) => (
                        <td key={i} style={{ textAlign: 'center', fontWeight: 600 }}>{val}</td>
                      ))}
                    </tr>
                    <tr>
                      <td className="td-primary">
                        <span style={{ color: 'var(--info-500)' }}>✕ </span>Sol Kulak (dB)
                      </td>
                      {patient.audiogramLeft.map((val, i) => (
                        <td key={i} style={{ textAlign: 'center', fontWeight: 600 }}>{val}</td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Visual Bar Representation */}
              <div style={{ marginTop: 24 }}>
                <h4 style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: 12, color: 'var(--gray-700)' }}>Görsel Temsil</h4>
                <div style={{ display: 'flex', gap: 24 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--danger-500)', marginBottom: 8 }}>● Sağ Kulak</div>
                    <div style={{ display: 'flex', gap: 4, alignItems: 'flex-end', height: 120 }}>
                      {patient.audiogramRight.map((val, i) => (
                        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                          <div style={{
                            width: '100%',
                            height: `${(val / 120) * 100}%`,
                            background: `linear-gradient(180deg, ${val > 60 ? 'var(--danger-400)' : val > 40 ? 'var(--warning-400)' : 'var(--success-400)'}, ${val > 60 ? 'var(--danger-200)' : val > 40 ? 'var(--warning-200)' : 'var(--success-200)'})`,
                            borderRadius: '3px 3px 0 0',
                            minHeight: 4,
                          }} />
                          <span style={{ fontSize: '0.6rem', color: 'var(--gray-500)' }}>{FREQUENCIES[i]}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--info-500)', marginBottom: 8 }}>✕ Sol Kulak</div>
                    <div style={{ display: 'flex', gap: 4, alignItems: 'flex-end', height: 120 }}>
                      {patient.audiogramLeft.map((val, i) => (
                        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                          <div style={{
                            width: '100%',
                            height: `${(val / 120) * 100}%`,
                            background: `linear-gradient(180deg, ${val > 60 ? 'var(--danger-400)' : val > 40 ? 'var(--warning-400)' : 'var(--info-400)'}, ${val > 60 ? 'var(--danger-200)' : val > 40 ? 'var(--warning-200)' : 'var(--info-200)'})`,
                            borderRadius: '3px 3px 0 0',
                            minHeight: 4,
                          }} />
                          <span style={{ fontSize: '0.6rem', color: 'var(--gray-500)' }}>{FREQUENCIES[i]}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Hearing Loss Legend */}
              <div style={{ marginTop: 20, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                <span className="badge badge-success">0–25 dB: Normal</span>
                <span className="badge badge-warning">26–40 dB: Hafif Kayıp</span>
                <span className="badge badge-warning" style={{ background: 'var(--accent-50)', color: 'var(--accent-600)' }}>41–60 dB: Orta Kayıp</span>
                <span className="badge badge-danger">61–80 dB: İleri Kayıp</span>
                <span className="badge badge-danger" style={{ background: '#4a0404', color: '#fecaca' }}>80+ dB: Çok İleri</span>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'cihaz-onerisi' && (() => {
          // Dynamic calculation based on patient profile
          const leftAvg = patient.audiogramLeft.reduce((s,v) => s+v, 0) / patient.audiogramLeft.length;
          const rightAvg = patient.audiogramRight.reduce((s,v) => s+v, 0) / patient.audiogramRight.length;
          const worstAvg = Math.max(leftAvg, rightAvg);
          const age = calculateAge(patient.birthDate);

          // Build suggestions logic
          let suggestedPower = 'M (Standard)';
          let suggestedType = 'RIC (Hoparlör Kulak İçi)';
          let matchingBrands: { name: string; matchPct: number; features: string[]; price: number; reason: string }[] = [];

          if (worstAvg > 80) {
            suggestedPower = 'UP (Ultra Power)';
            suggestedType = 'BTE (Kulak Arkası)';
            matchingBrands = [
              { name: 'Phonak Naída P70 UP', matchPct: 98, price: 72000, features: ['Maksimum kazanç', 'Suya dayanıklılık', 'Yüksek pil ömrü (675)'], reason: 'İleri derece kayıp için güçlü çıkış gücü ve dayanıklı BTE kasa tipi gereklidir.' },
              { name: 'Oticon Xceed 1', matchPct: 92, price: 88000, features: ['BrainHearing™ teknolojisi', '360° ses deneyimi', 'Süper yönlülük'], reason: 'Beyin öncelikli işleme sayesinde çok ileri kayıplarda dahi konuşma anlaşılırlığını korur.' }
            ];
          } else if (worstAvg > 60) {
            suggestedPower = 'P (Power)';
            suggestedType = 'RIC (Hoparlör Kulak İçi) veya BTE';
            matchingBrands = [
              { name: 'Oticon More 1 (P Alıcı)', matchPct: 96, price: 92000, features: ['DNN (Derin Yapay Sinir Ağı)', 'Bluetooth streaming', 'Şarj Edilebilir'], reason: 'Derin Yapay Sinir Ağı, ileri derece kayıplarda gürültü baskılamayı en doğal şekilde yapar.' },
              { name: 'Phonak Audéo P90-R', matchPct: 94, price: 85000, features: ['AutoSense OS 4.0', 'Çift Bluetooth bağlantısı', 'Tap Control'], reason: 'Otomatik ortam adaptasyonu yaşlı hastalarda manuel ayar ihtiyacını ortadan kaldırır.' }
            ];
          } else {
            suggestedPower = 'S (Standard) veya M';
            suggestedType = 'RIC veya IIC (Kanal İçi Görünmez)';
            matchingBrands = [
              { name: 'Signia Pure 7Nx', matchPct: 95, price: 68000, features: ['Kendi sesini doğal işitme (OVP)', 'Ultra küçük tasarım', 'Uzaktan ayar desteği'], reason: 'Hafif-orta kayıplarda hastanın kendi sesinden rahatsız olmasını engelleyen OVP teknolojisine sahiptir.' },
              { name: 'Phonak Audéo P70', matchPct: 91, price: 64000, features: ['Hafif gövde', 'Yüksek konfor', 'Net konuşma sesi'], reason: 'Estetik kaygısı olan ve hafif/orta düzeyde kayba sahip hastalar için konforlu kullanım sağlar.' }
            ];
          }

          return (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 20 }}>
              {/* Left Column: Rules & Diagnosis Summary */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div className="card" style={{ border: '1px solid var(--gray-200)' }}>
                  <div className="card-header">
                    <span className="card-title">🔬 Hasta Profili Analizi</span>
                  </div>
                  <div className="card-body" style={{ display: 'grid', gap: 10 }}>
                    <div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--gray-500)' }}>Sol Kulak Ortalaması</div>
                      <div style={{ fontWeight: 700, color: 'var(--info-600)' }}>{leftAvg.toFixed(1)} dB</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--gray-500)' }}>Sağ Kulak Ortalaması</div>
                      <div style={{ fontWeight: 700, color: 'var(--danger-600)' }}>{rightAvg.toFixed(1)} dB</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--gray-500)' }}>Önerilen Alıcı Gücü (Receiver)</div>
                      <span className="badge badge-warning" style={{ fontWeight: 600 }}>{suggestedPower}</span>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--gray-500)' }}>Önerilen Kasa Tipi</div>
                      <span className="badge badge-info" style={{ fontWeight: 600 }}>{suggestedType}</span>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--gray-500)' }}>SGK Geri Ödeme Hakkı</div>
                      <span className={`badge badge-${patient.sgkStatus === 'Yenileme Hakkı Var' ? 'success' : 'neutral'}`}>
                        {patient.sgkStatus === 'Yenileme Hakkı Var' ? 'Mevcut (₺6.200 Desteği Açık)' : 'Yok'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="card" style={{ background: 'var(--primary-50)', border: '1px solid var(--primary-100)' }}>
                  <div className="card-body">
                    <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--primary-700)', marginBottom: 6 }}>💡 Odyolog Tavsiye Notu</h4>
                    <p style={{ fontSize: '0.78rem', color: 'var(--primary-600)', lineHeight: 1.5 }}>
                      Hastanın yaş grubu ({age} yaş) ve el motor becerileri göz önüne alındığında, pil değişimi gerektirmeyen <strong>şarj edilebilir (rechargeable)</strong> modeller ve otomatik ortam algılama özellikli (AutoSense/BrainHearing) cihazlar önceliklendirilmelidir.
                    </p>
                  </div>
                </div>
              </div>

              {/* Right Column: AI Suggestions list */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div className="card">
                  <div className="card-header">
                    <span className="card-title">🤖 Uyuşan En İyi Modeller</span>
                  </div>
                  <div className="card-body" style={{ display: 'grid', gap: 14 }}>
                    {matchingBrands.map((brand, idx) => (
                      <div key={idx} style={{
                        padding: 16,
                        border: '1px solid var(--gray-200)',
                        borderRadius: 'var(--radius-lg)',
                        background: idx === 0 ? 'linear-gradient(to right, white, var(--success-50))' : 'white',
                        position: 'relative'
                      }}>
                        {idx === 0 && (
                          <span className="badge badge-success" style={{ position: 'absolute', top: 12, right: 12 }}>
                            ⭐ En Yüksek Eşleşme
                          </span>
                        )}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                          <h4 style={{ fontSize: '1rem', fontWeight: 700 }}>{brand.name}</h4>
                          <span style={{ color: 'var(--success-600)', fontWeight: 700, fontSize: '1.1rem' }}>%{brand.matchPct} Uyum</span>
                        </div>
                        <p style={{ fontSize: '0.82rem', color: 'var(--gray-600)', marginBottom: 12 }}>
                          {brand.reason}
                        </p>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
                          {brand.features.map(f => (
                            <span key={f} className="badge badge-neutral" style={{ fontSize: '0.7rem' }}>✓ {f}</span>
                          ))}
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--gray-100)', paddingTop: 10 }}>
                          <div>
                            <span style={{ fontSize: '0.72rem', color: 'var(--gray-500)' }}>Brüt Fiyat: </span>
                            <span style={{ fontWeight: 600 }}>{formatCurrency(brand.price)}</span>
                          </div>
                          <div>
                            <span style={{ fontSize: '0.72rem', color: 'var(--gray-500)' }}>SGK Sonrası Hasta Payı: </span>
                            <span style={{ fontWeight: 700, color: 'var(--primary-600)', fontSize: '1.05rem' }}>
                              {patient.sgkStatus === 'Yenileme Hakkı Var' ? formatCurrency(brand.price - 6200) : formatCurrency(brand.price)}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

        {activeTab === 'randevular' && (
          <div className="card">
            <div className="card-header">
              <span className="card-title">📅 Randevu Geçmişi</span>
              <button className="btn btn-sm btn-primary">📅 Yeni Randevu</button>
            </div>
            <div className="card-body">
              {patientAppointments.length > 0 ? (
                <div className="table-container">
                  <table>
                    <thead>
                      <tr>
                        <th>Tarih</th>
                        <th>Saat</th>
                        <th>Tür</th>
                        <th>Odyolog</th>
                        <th>Şube</th>
                        <th>Durum</th>
                      </tr>
                    </thead>
                    <tbody>
                      {patientAppointments.map((apt) => (
                        <tr key={apt.id}>
                          <td className="td-primary">{formatDate(apt.date)}</td>
                          <td>{apt.time}</td>
                          <td><span className="badge badge-info">{apt.type}</span></td>
                          <td>{apt.audiologist}</td>
                          <td>{apt.branch}</td>
                          <td>
                            <span className={`badge badge-${
                              apt.status === 'Geldi' ? 'success' :
                              apt.status === 'Bekliyor' ? 'warning' :
                              apt.status === 'Hatırlatıldı' ? 'info' : 'danger'
                            }`}>{apt.status}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="empty-state">
                  <div className="empty-state-icon">📅</div>
                  <h3>Randevu kaydı yok</h3>
                  <p>Bu hasta için henüz randevu oluşturulmamış.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'satis' && (
          <div className="card">
            <div className="card-header">
              <span className="card-title">💰 Satış Geçmişi</span>
            </div>
            <div className="card-body">
              {patientSales.length > 0 ? (
                patientSales.map((sale) => (
                  <div key={sale.id} style={{
                    padding: '14px',
                    border: '1px solid var(--gray-200)',
                    borderRadius: 'var(--radius-lg)',
                    marginBottom: 12,
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                      <div>
                        <div style={{ fontWeight: 600 }}>{formatDate(sale.date)}</div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--gray-500)' }}>{sale.paymentMethod}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{formatCurrency(sale.total)}</div>
                        <span className={`badge badge-${sale.status === 'Tahsil Edildi' ? 'success' : 'warning'}`}>
                          {sale.status}
                        </span>
                      </div>
                    </div>
                    {sale.items.map((item, i) => (
                      <div key={i} style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontSize: '0.82rem',
                        padding: '4px 0',
                        color: 'var(--gray-600)',
                      }}>
                        <span>{item.name} ×{item.quantity}</span>
                        <span>{formatCurrency(item.price)}</span>
                      </div>
                    ))}
                    {sale.sgkAmount > 0 && (
                      <div style={{
                        marginTop: 8,
                        paddingTop: 8,
                        borderTop: '1px solid var(--gray-100)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontSize: '0.82rem',
                      }}>
                        <span style={{ color: 'var(--success-600)' }}>SGK Karşıladığı:</span>
                        <span style={{ color: 'var(--success-600)', fontWeight: 600 }}>{formatCurrency(sale.sgkAmount)}</span>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="empty-state">
                  <div className="empty-state-icon">💰</div>
                  <h3>Satış kaydı yok</h3>
                  <p>Bu hasta için henüz satış kaydedilmemiş.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'notlar' && (
          <div className="card">
            <div className="card-header">
              <span className="card-title">📝 Notlar</span>
              <button className="btn btn-sm btn-primary">➕ Not Ekle</button>
            </div>
            <div className="card-body">
              {patient.notes ? (
                <div style={{
                  padding: '14px',
                  background: 'var(--gray-50)',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.88rem',
                  lineHeight: 1.7,
                  color: 'var(--gray-700)',
                }}>
                  {patient.notes}
                </div>
              ) : (
                <div className="empty-state">
                  <div className="empty-state-icon">📝</div>
                  <h3>Not yok</h3>
                  <p>Bu hasta için not eklenmemiş.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
