'use client';

import React, { useState } from 'react';
import { recallItems, getAvatarColor, formatDate, formatCurrency } from '../data/mockData';
import { IconMessage, IconPhone, IconSmartRecall, IconCheck, IconWarning, IconCash, IconPlus, IconArrowRight, IconClose } from '../components/Icons';

interface RecallStep {
  stepNumber: number;
  channel: 'WhatsApp' | 'SMS' | 'Arama' | 'Mektup';
  status: 'Tamamlandı' | 'Bekliyor' | 'Atlandı';
  date: string | null;
  messagePreview?: string;
}

interface EnhancedRecallItem {
  id: string;
  patientName: string;
  reason: string;
  dueDate: string;
  currentStep: number;
  steps: RecallStep[];
  estimatedRevenue: number;
  probability: string;
}

const enhancedRecallData: EnhancedRecallItem[] = [
  {
    id: 'r1',
    patientName: 'Ayşe Yılmaz',
    reason: 'SGK Yenileme',
    dueDate: '2026-06-20',
    currentStep: 1,
    steps: [
      { stepNumber: 1, channel: 'WhatsApp', status: 'Bekliyor', date: null, messagePreview: 'Merhaba Ayşe Hanım, SGK işitme cihazı yenileme hakkınız açılmıştır. Ücretsiz kontrol randevusu oluşturmak ister misiniz?' },
      { stepNumber: 2, channel: 'SMS', status: 'Bekliyor', date: null, messagePreview: 'Değerli hastamız Ayşe Yılmaz, SGK hakkınızla yeni cihaz almak için şubemize davetlisiniz.' },
      { stepNumber: 3, channel: 'Arama', status: 'Bekliyor', date: null },
    ],
    estimatedRevenue: 75000,
    probability: 'Yüksek Olasılık'
  },
  {
    id: 'r2',
    patientName: 'Ali Demir',
    reason: 'SGK Yenileme',
    dueDate: '2026-03-05',
    currentStep: 3,
    steps: [
      { stepNumber: 1, channel: 'WhatsApp', status: 'Tamamlandı', date: '2026-07-01', messagePreview: 'Merhaba Ali Bey, SGK hakkınız açılmıştır...' },
      { stepNumber: 2, channel: 'SMS', status: 'Tamamlandı', date: '2026-07-04', messagePreview: 'Değerli hastamız Ali Demir...' },
      { stepNumber: 3, channel: 'Arama', status: 'Tamamlandı', date: '2026-07-08' },
    ],
    estimatedRevenue: 75000,
    probability: 'Yüksek Olasılık'
  },
  {
    id: 'r3',
    patientName: 'Hasan Çelik',
    reason: 'Pil Siparişi',
    dueDate: '2026-07-15',
    currentStep: 2,
    steps: [
      { stepNumber: 1, channel: 'WhatsApp', status: 'Tamamlandı', date: '2026-07-05', messagePreview: 'Merhaba Hasan Bey, pil sipariş süreniz yaklaşmaktadır...' },
      { stepNumber: 2, channel: 'SMS', status: 'Bekliyor', date: null, messagePreview: 'Hasan Bey, pilleriniz şubemize ulaşmıştır. Gelip teslim alabilirsiniz.' },
    ],
    estimatedRevenue: 1200,
    probability: 'Yüksek Olasılık'
  },
  {
    id: 'r4',
    patientName: 'Fatma Özkan',
    reason: 'Yıllık Kontrol',
    dueDate: '2026-08-01',
    currentStep: 1,
    steps: [
      { stepNumber: 1, channel: 'WhatsApp', status: 'Bekliyor', date: null, messagePreview: 'Merhaba Fatma Hanım, yıllık işitme kontrol zamanınız gelmiştir.' },
      { stepNumber: 2, channel: 'SMS', status: 'Bekliyor', date: null },
      { stepNumber: 3, channel: 'Arama', status: 'Bekliyor', date: null },
    ],
    estimatedRevenue: 3500,
    probability: 'Orta Olasılık'
  },
  {
    id: 'r5',
    patientName: 'Mehmet Kaya',
    reason: 'Cihaz Denedi Almadı',
    dueDate: '2026-07-28',
    currentStep: 2,
    steps: [
      { stepNumber: 1, channel: 'WhatsApp', status: 'Tamamlandı', date: '2026-07-07', messagePreview: 'Merhaba Mehmet Bey, yıllık işitme cihazı kontrolünüz yaklaşmaktadır.' },
      { stepNumber: 2, channel: 'SMS', status: 'Bekliyor', date: null, messagePreview: 'Mehmet Bey, yarınki kontrol randevunuzu onaylıyor musunuz?' },
      { stepNumber: 3, channel: 'Arama', status: 'Bekliyor', date: null },
    ],
    estimatedRevenue: 85000,
    probability: 'Orta Olasılık'
  },
  {
    id: 'r6',
    patientName: 'Mehmet Kaya',
    reason: 'Pil Siparişi',
    dueDate: '2026-07-21',
    currentStep: 1,
    steps: [
      { stepNumber: 1, channel: 'WhatsApp', status: 'Bekliyor', date: null, messagePreview: 'Merhaba Mehmet Bey, pillerinizin tahmini bitiş tarihi yaklaşmaktadır.' },
      { stepNumber: 2, channel: 'SMS', status: 'Bekliyor', date: null },
    ],
    estimatedRevenue: 1200,
    probability: 'Yüksek Olasılık'
  }
];

import { useApp } from '../context/AppContext';
import { useBranch } from '../context/BranchContext';
import { BranchService } from '../services/BranchService';

export default function RecallPage() {
  const { addToast, addAppointment, setCurrentPage, setSelectedPatientId, setActiveDetailTab } = useApp();
  const { activeBranch } = useBranch();
  const [filterStatus, setFilterStatus] = useState('Tümü');
  const [selectedChain, setSelectedChain] = useState<EnhancedRecallItem | null>(null);
  const [recallChains, setRecallChains] = useState<EnhancedRecallItem[]>(enhancedRecallData);
  const [showFastAppointmentModal, setShowFastAppointmentModal] = useState<EnhancedRecallItem | null>(null);

  // Olasılığa göre ağırlıklı gelir hesabı
  // Yüksek: %80, Orta: %50, Düşük: %20
  const getProbabilityWeight = (prob: string) => {
    if (prob === 'Yüksek Olasılık') return 0.8;
    if (prob === 'Orta Olasılık') return 0.5;
    return 0.2;
  };

  const branchFilteredChains = React.useMemo(() => {
    return recallChains.filter((r, idx) => 
      BranchService.matchesBranch((r as any).branch, (r as any).branchId, activeBranch, idx)
    );
  }, [recallChains, activeBranch]);

  const filtered = branchFilteredChains.filter(r => {
    if (filterStatus === 'Tümü') return true;
    if (filterStatus === 'Bekleyenler') return r.steps.some(s => s.status === 'Bekliyor');
    if (filterStatus === 'Pil Yenileme') return r.reason === 'Pil Siparişi';
    if (filterStatus === 'Tamamlanan Adımlar') return r.steps.some(s => s.status === 'Tamamlandı');
    return true;
  });

  const totalFirsat = branchFilteredChains.reduce((sum, r) => sum + r.estimatedRevenue, 0);
  const weightedRevenue = branchFilteredChains.reduce((sum, r) => sum + (r.estimatedRevenue * getProbabilityWeight(r.probability)), 0);

  const handleTriggerRecallAction = (chain: EnhancedRecallItem) => {
    const updatedChains = recallChains.map(c => {
      if (c.id === chain.id) {
        const nextSteps = c.steps.map(s => {
          if (s.stepNumber === c.currentStep) {
            return { ...s, status: 'Tamamlandı' as const, date: '2026-07-10' };
          }
          return s;
        });
        return {
          ...c,
          currentStep: Math.min(c.steps.length, c.currentStep + 1),
          steps: nextSteps
        };
      }
      return c;
    });
    setRecallChains(updatedChains);
    setSelectedChain(null);

    addToast({
      type: 'success',
      message: `${chain.patientName} için WhatsApp hatırlatma mesajı başarıyla gönderildi!`
    });

    setTimeout(() => {
      setShowFastAppointmentModal(chain);
    }, 800);
  };

  return (
    <div className="page">
      <div className="page-header">
        <div className="page-header-left">
          <h2>Akıllı Hatırlatma Zinciri</h2>
          <p>Çok kanallı otomatik geri kazanım ve pil abonelik takibi</p>
        </div>
        <div className="page-header-actions">
          <button className="btn btn-primary" onClick={() => addToast({ type: 'success', message: 'Tüm bekleyen hatırlatma zinciri otomatik olarak tetiklendi.' })}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <IconSmartRecall size={16} strokeWidth={1.8} /> Otomatik Zinciri Başlat
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon primary">
            <IconSmartRecall size={20} strokeWidth={1.6} />
          </div>
          <div className="stat-content">
            <div className="stat-label">Aktif Hatırlatma Zinciri</div>
            <div className="stat-value">{recallChains.length} Fırsat</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon info">
            <IconMessage size={20} strokeWidth={1.6} />
          </div>
          <div className="stat-content">
            <div className="stat-label">Toplam İletişim Gönderimi</div>
            <div className="stat-value">14 Gönderim</div>
            <span className="stat-change up" style={{ fontSize: '0.72rem' }}>Başarı Oranı: %72</span>
          </div>
        </div>
        <div className="stat-card" style={{ background: 'var(--accent-50)', color: 'var(--accent-700)' }}>
          <div className="stat-icon warning" style={{ background: 'white' }}>
            <IconCash size={20} strokeWidth={1.6} />
          </div>
          <div className="stat-content">
            <div className="stat-label">Toplam Gelir Fırsatı</div>
            <div className="stat-value">{formatCurrency(totalFirsat)}</div>
            <span className="stat-change warning" style={{ fontSize: '0.72rem' }}>Beklemede</span>
          </div>
        </div>
        <div className="stat-card" style={{ background: 'var(--primary-50)', color: 'var(--primary-700)' }}>
          <div className="stat-icon success" style={{ background: 'white' }}>
            <IconCash size={20} strokeWidth={1.6} />
          </div>
          <div className="stat-content">
            <div className="stat-label">Beklenen Net Gelir (Ağırlıklı)</div>
            <div className="stat-value">{formatCurrency(weightedRevenue)}</div>
            <span className="stat-change success" style={{ fontSize: '0.72rem' }}>Olasılık Çarpanlı</span>
          </div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-body" style={{ display: 'flex', gap: 12 }}>
          <div className="tabs">
            {['Tümü', 'Bekleyenler', 'Pil Yenileme', 'Tamamlanan Adımlar'].map(s => (
              <button
                key={s}
                className={`tab ${filterStatus === s ? 'active' : ''}`}
                onClick={() => setFilterStatus(s)}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="table-container">
          <table className="mobile-cards">
            <thead>
              <tr>
                <th>Hasta</th>
                <th>Sebep</th>
                <th>Güven / Olasılık</th>
                <th>Fırsat Değeri</th>
                <th>İletişim Adımları / İlerleme</th>
                <th>İşlem</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(item => {
                return (
                  <tr key={item.id}>
                    <td data-label="Hasta">
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div className="avatar" style={{ background: getAvatarColor(item.patientName), width: 32, height: 32, borderRadius: '50%', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 700 }}>
                          {item.patientName.split(' ').map(n => n[0]).join('')}
                        </div>
                        <span className="td-primary">{item.patientName}</span>
                      </div>
                    </td>
                    <td data-label="Sebep">
                      <span className={`badge badge-${
                        item.reason === 'SGK Yenileme' ? 'success' :
                        item.reason === 'Pil Siparişi' ? 'warning' : 'info'
                      }`}>{item.reason}</span>
                    </td>
                    <td data-label="Güven / Olasılık">
                      <span className={`badge badge-${
                        item.probability === 'Yüksek Olasılık' ? 'success' :
                        item.probability === 'Orta Olasılık' ? 'warning' : 'neutral'
                      }`}>{item.probability}</span>
                    </td>
                    <td data-label="Fırsat Değeri" style={{ fontWeight: 700, color: 'var(--accent-600)' }}>
                      {formatCurrency(item.estimatedRevenue)}
                    </td>
                    <td data-label="İlerleme">
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        {item.steps.map((step, idx) => {
                          const isDone = step.status === 'Tamamlandı';
                          const isCurrent = item.currentStep === step.stepNumber;
                          return (
                            <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                              <span
                                className={`badge badge-${isDone ? 'success' : isCurrent ? 'warning' : 'neutral'}`}
                                style={{
                                  fontSize: '0.72rem',
                                  padding: '4px 8px',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 4,
                                  border: isCurrent ? '1.5px solid var(--warning-500)' : 'none'
                                }}
                                title={step.messagePreview || step.channel}
                              >
                                {step.channel === 'WhatsApp' ? (
                                  <IconMessage size={12} strokeWidth={2} />
                                ) : step.channel === 'SMS' ? (
                                  <IconMessage size={12} strokeWidth={2} />
                                ) : (
                                  <IconPhone size={12} strokeWidth={2} />
                                )}
                                {step.stepNumber}. Adım
                              </span>
                              {idx < item.steps.length - 1 && <span style={{ color: 'var(--gray-300)' }}>➔</span>}
                            </div>
                          );
                        })}
                      </div>
                    </td>
                    <td data-label="İşlem">
                      <button className="btn btn-sm btn-secondary"
                        style={{ display: 'flex', alignItems: 'center', gap: 4 }}
                        onClick={() => setSelectedChain(item)}>
                        Zincir Detayı <IconArrowRight size={13} strokeWidth={1.8} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Chain Detail Modal */}
      {selectedChain && (
        <div className="modal-overlay" onClick={() => setSelectedChain(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 640 }}>
            <div className="modal-header">
              <span className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <IconSmartRecall size={18} strokeWidth={1.8} />
                Otomasyon Zincir Detayı — {selectedChain.patientName}
              </span>
              <button className="modal-close" onClick={() => setSelectedChain(null)} aria-label="Kapat">
                <IconClose size={16} strokeWidth={2} />
              </button>
            </div>
            <div className="modal-body">
              <div style={{ marginBottom: 20 }}>
                <span className="badge badge-info">{selectedChain.reason}</span>
                <span style={{ marginLeft: 8, fontSize: '0.82rem', color: 'var(--gray-500)' }}>
                  Hedef Tarih: {formatDate(selectedChain.dueDate)}
                </span>
              </div>

              {/* Timeline layout */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16, position: 'relative', paddingLeft: 20 }}>
                {/* Timeline connector line */}
                <div style={{
                  position: 'absolute',
                  left: 30,
                  top: 20,
                  bottom: 20,
                  width: 2,
                  backgroundColor: 'var(--gray-200)',
                  zIndex: 0
                }} />

                {selectedChain.steps.map((step, idx) => {
                  const isDone = step.status === 'Tamamlandı';
                  const isCurrent = selectedChain.currentStep === step.stepNumber;
                  return (
                    <div key={idx} style={{ display: 'flex', gap: 16, zIndex: 1, position: 'relative' }}>
                      {/* Circle indicator */}
                      <div style={{
                        width: 24,
                        height: 24,
                        borderRadius: '50%',
                        backgroundColor: isDone ? 'var(--success-500)' : isCurrent ? 'var(--warning-500)' : 'var(--gray-300)',
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                        fontSize: '0.78rem'
                      }}>
                        {step.stepNumber}
                      </div>

                      {/* Content Card */}
                      <div style={{
                        flex: 1,
                        padding: 12,
                        borderRadius: 'var(--radius-lg)',
                        border: `1px solid ${isCurrent ? 'var(--warning-200)' : 'var(--gray-200)'}`,
                        backgroundColor: isCurrent ? 'var(--warning-50)' : 'white'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                          <span style={{ fontWeight: 700, fontSize: '0.88rem' }}>
                            {step.channel} Adımı
                          </span>
                          <span className={`badge badge-${isDone ? 'success' : isCurrent ? 'warning' : 'neutral'}`} style={{ fontSize: '0.7rem' }}>
                            {isDone ? 'Tamamlandı' : isCurrent ? 'Sıradaki / Bekliyor' : 'Kilitli'}
                          </span>
                        </div>
                        {step.date && (
                          <div style={{ fontSize: '0.72rem', color: 'var(--gray-500)', marginBottom: 6 }}>
                            Tarih: {formatDate(step.date)}
                          </div>
                        )}
                        {step.messagePreview && (
                          <div style={{
                            padding: 8,
                            background: 'var(--gray-50)',
                            borderRadius: 'var(--radius-md)',
                            fontSize: '0.82rem',
                            color: 'var(--gray-600)',
                            fontStyle: 'italic',
                            marginTop: 6
                          }}>
                            &quot;{step.messagePreview}&quot;
                          </div>
                        )}
                        {isCurrent && (
                          <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                            <button className="btn btn-sm btn-primary" onClick={() => handleTriggerRecallAction(selectedChain)}>Hemen Gönder</button>
                            <button className="btn btn-sm btn-secondary" onClick={() => {
                              setSelectedChain(null);
                              addToast({ type: 'info', message: 'Hatırlatma görevi 2 gün süreyle ertelendi.' });
                            }}>2 Gün Ertele</button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setSelectedChain(null)}>Kapat</button>
            </div>
          </div>
        </div>
      )}

      {/* Hızlı Randevu Simülasyon Modalı */}
      {showFastAppointmentModal && (
        <div className="modal-overlay" onClick={() => setShowFastAppointmentModal(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 500 }}>
            <div className="modal-header">
              <span className="modal-title">Hatırlatma Sonrası Hızlı Randevu</span>
              <button className="modal-close" onClick={() => setShowFastAppointmentModal(null)}>✕</button>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <p style={{ fontSize: '0.84rem', color: 'var(--gray-600)' }}>
                <strong>{showFastAppointmentModal.patientName}</strong> hatırlatma mesajına yanıt verdi ve randevu talep ediyor. Hızlıca randevu kaydı oluşturabilirsiniz:
              </p>
              <div className="form-group">
                <label className="form-label">Randevu Nedeni</label>
                <input className="form-input" defaultValue={showFastAppointmentModal.reason === 'SGK Yenileme' ? 'SGK Cihaz Yenileme Kontrolü' : 'Cihaz Kontrolü & Ayar'} />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Tarih</label>
                  <input className="form-input" type="date" defaultValue="2026-07-11" />
                </div>
                <div className="form-group">
                  <label className="form-label">Saat</label>
                  <input className="form-input" type="time" defaultValue="14:00" />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowFastAppointmentModal(null)}>Daha Sonra</button>
              <button className="btn btn-primary" onClick={() => {
                const newAppoint = {
                  id: `ap-${Date.now()}`,
                  patientId: showFastAppointmentModal.id === 'r1' ? 'p1' : 'p2',
                  patientName: showFastAppointmentModal.patientName,
                  date: '2026-07-11',
                  time: '14:00',
                  type: (showFastAppointmentModal.reason === 'SGK Yenileme' ? 'SGK Yenileme' : 'Kontrol') as any,
                  status: 'Bekliyor' as const,
                  audiologist: 'Dr. Elif Arslan',
                  branch: 'Merkez 1 - Kadıköy',
                  notes: 'Recall otomasyonu üzerinden randevu talebi.'
                };
                addAppointment(newAppoint);
                setShowFastAppointmentModal(null);
                addToast({
                  type: 'success',
                  message: `${showFastAppointmentModal.patientName} için randevu oluşturuldu! Randevular sayfasına yönlendiriliyorsunuz.`
                });
                setTimeout(() => {
                  setCurrentPage('appointments');
                }, 1500);
              }}>Randevuyu Onayla</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
