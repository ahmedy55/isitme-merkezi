'use client';

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { IconSearch, IconPlus, IconCheck, IconWarning } from '../components/Icons';

interface Activity {
  id: string;
  timestamp: string;
  userName: string;
  userRole: string;
  type: 'Arama' | 'Randevu' | 'Not Ekleme' | 'Satış' | 'Hasta Girişi';
  patientName: string;
  description: string;
  duration?: string; // Görüşme süresi örn: "4 dk"
}

export default function ActivityLogPage() {
  const { addToast } = useApp();

  const [activities, setActivities] = useState<Activity[]>([
    {
      id: 'act-1',
      timestamp: '2026-07-21 10:15',
      userName: 'Ody. Hasan Kaya',
      userRole: 'Odyometrist',
      type: 'Arama',
      patientName: 'Kemal Deniz',
      description: 'Hasta aranarak sol kulak cihaz adaptasyonu hakkında geri bildirim alındı.',
      duration: '5 dk'
    },
    {
      id: 'act-2',
      timestamp: '2026-07-21 09:40',
      userName: 'Sek. Zeynep Acar',
      userRole: 'Sekreter',
      type: 'Randevu',
      patientName: 'Hanım Saraç',
      description: 'Kontrol randevusu oluşturuldu (Tarih: 23.07.2026 14:00).',
    },
    {
      id: 'act-3',
      timestamp: '2026-07-20 16:10',
      userName: 'Dr. Elif Arslan',
      userRole: 'Firma Yöneticisi',
      type: 'Satış',
      patientName: 'Ahmet Yılmaz',
      description: 'Phonak Audéo L90-R işitme cihazı satışı ve teslimatı yapıldı.',
    },
    {
      id: 'act-4',
      timestamp: '2026-07-20 11:22',
      userName: 'Sek. Zeynep Acar',
      userRole: 'Sekreter',
      type: 'Hasta Girişi',
      patientName: 'Saniye Öztürk',
      description: 'Yeni hasta profili oluşturuldu, TC sorgulaması yapıldı.',
    },
    {
      id: 'act-5',
      timestamp: '2026-07-19 14:35',
      userName: 'Ody. Hasan Kaya',
      userRole: 'Odyometrist',
      type: 'Not Ekleme',
      patientName: 'Kamil Yılmaz',
      description: 'Cihaz deneme sürecinde sol kulakta hafif kaşıntı şikayeti olduğu not düşüldü.',
    }
  ]);

  // Filters State
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [roleFilter, setRoleFilter] = useState('All');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [formPatientName, setFormPatientName] = useState('');
  const [formType, setFormType] = useState<'Arama' | 'Randevu' | 'Not Ekleme' | 'Satış' | 'Hasta Girişi'>('Arama');
  const [formDescription, setFormDescription] = useState('');
  const [formDuration, setFormDuration] = useState('');

  const handleSaveActivity = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formPatientName.trim() || !formDescription.trim()) {
      alert('Hasta adı ve açıklama zorunludur');
      return;
    }

    const newActivity: Activity = {
      id: 'act-' + Date.now(),
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
      userName: 'Dr. Elif Arslan',
      userRole: 'Firma Yöneticisi',
      type: formType,
      patientName: formPatientName,
      description: formDescription,
      duration: formType === 'Arama' && formDuration ? formDuration + ' dk' : undefined
    };

    setActivities(prev => [newActivity, ...prev]);
    setShowModal(false);
    setFormPatientName('');
    setFormDescription('');
    setFormDuration('');
    addToast({ type: 'success', message: 'Aktivite kaydı başarıyla eklendi.' });
  };

  // Filter Logic
  const filteredActivities = activities.filter(act => {
    const matchesSearch = 
      act.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      act.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      act.userName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType = typeFilter === 'All' || act.type === typeFilter;
    const matchesRole = roleFilter === 'All' || act.userRole === roleFilter;

    return matchesSearch && matchesType && matchesRole;
  });

  return (
    <div className="page">
      <div className="page-header">
        <div className="page-header-left">
          <h2>Günlük Aktivite Kayıtları</h2>
          <p>Personellerin hastalarla gerçekleştirdiği telefon aramaları, görüşme notları ve işlemler</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <IconPlus size={16} strokeWidth={2} /> Yeni Aktivite Gir
        </button>
      </div>

      {/* Stats Cards */}
      <div className="stats-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 20 }}>
        <div className="card">
          <div className="card-body" style={{ padding: 16 }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--gray-500)' }}>Bugünkü Toplam Aktivite</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--primary-600)', marginTop: 4 }}>
              {activities.length} işlem
            </div>
          </div>
        </div>
        <div className="card">
          <div className="card-body" style={{ padding: 16 }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--gray-500)' }}>Telefon Görüşmeleri</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--accent-500)', marginTop: 4 }}>
              {activities.filter(a => a.type === 'Arama').length} arama
            </div>
          </div>
        </div>
        <div className="card">
          <div className="card-body" style={{ padding: 16 }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--gray-500)' }}>Hasta Kabul & Giriş</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--success-500)', marginTop: 4 }}>
              {activities.filter(a => a.type === 'Hasta Girişi').length} yeni kayıt
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-body" style={{ padding: 16 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
            <div style={{ flex: 1, minWidth: 240, position: 'relative' }}>
              <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-400)' }}>
                <IconSearch size={18} />
              </span>
              <input
                className="form-input"
                placeholder="Hasta adı, açıklama veya personel ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ paddingLeft: 38, width: '100%', margin: 0 }}
              />
            </div>

            <div style={{ minWidth: 150 }}>
              <select className="form-input" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} style={{ margin: 0 }}>
                <option value="All">Tüm Aktivite Türleri</option>
                <option value="Arama">Telefon Araması</option>
                <option value="Randevu">Randevu Değişikliği</option>
                <option value="Not Ekleme">Not Ekleme</option>
                <option value="Satış">Cihaz Satışı</option>
                <option value="Hasta Girişi">Hasta Kabul</option>
              </select>
            </div>

            <div style={{ minWidth: 150 }}>
              <select className="form-input" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} style={{ margin: 0 }}>
                <option value="All">Tüm Personel Rolleri</option>
                <option value="Firma Yöneticisi">Firma Yöneticisi</option>
                <option value="Odyometrist">Odyometrist</option>
                <option value="Sekreter">Sekreter</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Activity Timeline List */}
      <div className="card">
        <div className="card-body" style={{ padding: 20 }}>
          {filteredActivities.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--gray-400)' }}>
              Kriterlere uygun aktivite kaydı bulunamadı.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {filteredActivities.map((act) => (
                <div key={act.id} style={{
                  display: 'flex',
                  gap: 16,
                  paddingBottom: 16,
                  borderBottom: '1px solid var(--surface-border-light)',
                  alignItems: 'flex-start'
                }}>
                  {/* Left avatar/initial */}
                  <div style={{
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    background: 'var(--primary-50)',
                    color: 'var(--primary-700)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: '0.9rem',
                    flexShrink: 0
                  }}>
                    {act.userName[0] + (act.userName.split(' ')[1]?.[0] || '')}
                  </div>

                  {/* Right description info */}
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 4 }}>
                      <div>
                        <strong>{act.userName}</strong> 
                        <span style={{ fontSize: '0.78rem', color: 'var(--gray-400)', marginLeft: 6 }}>({act.userRole})</span>
                      </div>
                      <span style={{ fontSize: '0.8rem', color: 'var(--gray-400)' }}>{act.timestamp}</span>
                    </div>

                    <div style={{ marginTop: 6, fontSize: '0.88rem', color: 'var(--gray-700)' }}>
                      <span style={{ color: 'var(--primary-600)', fontWeight: 700, marginRight: 6 }}>
                        [{act.type}]
                      </span>
                      <strong>{act.patientName}</strong>: {act.description}
                    </div>

                    {act.duration && (
                      <div style={{ marginTop: 4, display: 'inline-block', fontSize: '0.76rem', background: 'var(--gray-100)', padding: '2px 6px', borderRadius: 4, color: 'var(--gray-600)' }}>
                        📞 Görüşme Süresi: {act.duration}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add Activity Modal */}
      {showModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          backgroundColor: 'rgba(0,0,0,0.4)',
          backdropFilter: 'blur(3px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 9999
        }}>
          <div className="card" style={{ width: 460, maxWidth: '90%' }}>
            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid var(--surface-border)' }}>
              <span className="card-title" style={{ fontSize: '1.15rem', fontWeight: 700 }}>Yeni Aktivite Kaydı Oluştur</span>
              <button onClick={() => setShowModal(false)} style={{ color: 'var(--gray-400)', fontSize: '1.4rem' }}>&times;</button>
            </div>
            <form onSubmit={handleSaveActivity}>
              <div className="card-body" style={{ padding: 20 }}>
                <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
                  <div className="form-group" style={{ flex: 1, margin: 0 }}>
                    <label className="form-label">Hasta Adı Soyadı</label>
                    <input
                      className="form-input"
                      value={formPatientName}
                      onChange={(e) => setFormPatientName(e.target.value)}
                      required
                      placeholder="Örn: Hanım Saraç"
                    />
                  </div>
                  <div className="form-group" style={{ flex: 1, margin: 0 }}>
                    <label className="form-label">Aktivite Türü</label>
                    <select
                      className="form-input"
                      value={formType}
                      onChange={(e) => setFormType(e.target.value as any)}
                    >
                      <option value="Arama">Telefon Araması</option>
                      <option value="Randevu">Randevu Değişikliği</option>
                      <option value="Not Ekleme">Not Ekleme</option>
                      <option value="Satış">Cihaz Satışı</option>
                      <option value="Hasta Girişi">Hasta Kabul</option>
                    </select>
                  </div>
                </div>

                {formType === 'Arama' && (
                  <div className="form-group" style={{ marginBottom: 12 }}>
                    <label className="form-label">Görüşme Süresi (Dakika)</label>
                    <input
                      type="number"
                      className="form-input"
                      value={formDuration}
                      onChange={(e) => setFormDuration(e.target.value)}
                      placeholder="Örn: 5"
                    />
                  </div>
                )}

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Açıklama / Detay</label>
                  <textarea
                    className="form-input"
                    rows={3}
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    required
                    placeholder="Görüşme içeriğini veya yapılan işlemi kısaca özetleyin..."
                    style={{ resize: 'none' }}
                  />
                </div>
              </div>
              <div className="card-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, padding: '12px 20px', borderTop: '1px solid var(--surface-border)' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>İptal</button>
                <button type="submit" className="btn btn-primary">Kaydı Kaydet</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
