'use client';

import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import {
  getAvatarColor, getInitials, formatDate, calculateAge,
  type Patient,
} from '../data/mockData';
import { IconPlus, IconSearch, IconArrowRight, IconClose } from '../components/Icons';

type SortKey = 'name' | 'tc' | 'phone' | 'age' | 'hearingLoss' | 'device' | 'sgkStatus' | 'lastVisit';
type SortDir = 'asc' | 'desc';

const hearingLossOrder: Record<string, number> = { 'Hafif': 1, 'Orta': 2, 'İleri': 3, 'Çok İleri': 4 };
const sgkStatusOrder: Record<string, number> = { 'Aktif': 1, 'Yenileme Hakkı Var': 2, 'Pasif': 3 };

function SortIcon({ column, sortKey, sortDir }: { column: SortKey; sortKey: SortKey | null; sortDir: SortDir }) {
  const isActive = sortKey === column;
  return (
    <span style={{
      display: 'inline-flex',
      flexDirection: 'column',
      marginLeft: 4,
      verticalAlign: 'middle',
      lineHeight: 1,
      gap: 1,
    }}>
      <svg width="8" height="5" viewBox="0 0 8 5" style={{ opacity: isActive && sortDir === 'asc' ? 1 : 0.25 }}>
        <path d="M4 0L8 5H0L4 0Z" fill={isActive && sortDir === 'asc' ? 'var(--primary-500)' : 'currentColor'} />
      </svg>
      <svg width="8" height="5" viewBox="0 0 8 5" style={{ opacity: isActive && sortDir === 'desc' ? 1 : 0.25 }}>
        <path d="M4 5L0 0H8L4 5Z" fill={isActive && sortDir === 'desc' ? 'var(--primary-500)' : 'currentColor'} />
      </svg>
    </span>
  );
}

export default function PatientsPage() {
  const { setCurrentPage, setSelectedPatientId, patientsList, addPatient } = useApp();
  const [search, setSearch] = useState('');
  const [filterLoss, setFilterLoss] = useState('Tümü');
  const [showAddModal, setShowAddModal] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  const [formData, setFormData] = useState({
    tc: '',
    gender: 'Erkek',
    firstName: '',
    lastName: '',
    phone: '',
    birthDate: '',
    email: '',
    address: '',
    hearingLoss: 'Hafif',
    hearingLossSide: 'Sol',
    notes: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    prescriptionNo: '',
    reportNo: '',
    sgkInsuranceStatus: 'Belirtilmemiş',
    patientStatus: 'Potansiyel',
    source: 'Tavsiye'
  });

  const handleSave = () => {
    if (!formData.firstName.trim() || !formData.lastName.trim() || !formData.tc.trim() || !formData.phone.trim() || !formData.address.trim()) {
      alert('Lütfen zorunlu alanları (* işaretli: Ad, Soyad, TC Kimlik No, Telefon, Adres) doldurunuz.');
      return;
    }
    const newPatient: Patient = {
      id: `p-${Date.now().toString().slice(-6)}`,
      firstName: formData.firstName,
      lastName: formData.lastName,
      tc: formData.tc,
      phone: formData.phone,
      gender: formData.gender as any,
      birthDate: formData.birthDate,
      email: formData.email || `${formData.firstName.toLowerCase()}@example.com`,
      address: formData.address,
      hearingLoss: formData.hearingLoss as any,
      hearingLossSide: formData.hearingLossSide as any,
      sgkStatus: 'Aktif',
      lastVisit: new Date().toISOString().split('T')[0],
      emergencyContactName: formData.emergencyContactName,
      emergencyContactPhone: formData.emergencyContactPhone,
      emergencyContactRelation: 'Yakını',
      prescriptionNo: formData.prescriptionNo,
      reportNo: formData.reportNo,
      sgkInsuranceStatus: formData.sgkInsuranceStatus as any,
      patientStatus: formData.patientStatus as any,
      source: formData.source as any,
      notes: formData.notes,
      timeline: [
        { date: '11.07.2026', action: 'Hasta kaydı oluşturuldu.', icon: 'Plus' }
      ]
    };
    addPatient(newPatient);
    setShowAddModal(false);
    // Reset form
    setFormData({
      tc: '',
      gender: 'Erkek',
      firstName: '',
      lastName: '',
      phone: '',
      birthDate: '',
      email: '',
      address: '',
      hearingLoss: 'Hafif',
      hearingLossSide: 'Sol',
      notes: '',
      emergencyContactName: '',
      emergencyContactPhone: '',
      prescriptionNo: '',
      reportNo: '',
      sgkInsuranceStatus: 'Belirtilmemiş',
      patientStatus: 'Potansiyel',
      source: 'Tavsiye'
    });
  };

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const filtered = patientsList.filter((p) => {
    const matchSearch =
      `${p.firstName} ${p.lastName}`.toLowerCase().includes(search.toLowerCase()) ||
      p.tc.includes(search) ||
      p.phone.includes(search);
    const matchFilter = filterLoss === 'Tümü' || p.hearingLoss === filterLoss;
    return matchSearch && matchFilter;
  });

  const sorted = useMemo(() => {
    if (!sortKey) return filtered;

    return [...filtered].sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case 'name':
          cmp = `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`, 'tr');
          break;
        case 'tc':
          cmp = a.tc.localeCompare(b.tc);
          break;
        case 'phone':
          cmp = a.phone.localeCompare(b.phone);
          break;
        case 'age':
          cmp = calculateAge(a.birthDate) - calculateAge(b.birthDate);
          break;
        case 'hearingLoss':
          cmp = (hearingLossOrder[a.hearingLoss || 'Hafif'] || 0) - (hearingLossOrder[b.hearingLoss || 'Hafif'] || 0);
          break;
        case 'device':
          cmp = (a.currentDevice || '').localeCompare(b.currentDevice || '', 'tr');
          break;
        case 'sgkStatus':
          cmp = (sgkStatusOrder[a.sgkStatus || 'Aktif'] || 0) - (sgkStatusOrder[b.sgkStatus || 'Aktif'] || 0);
          break;
        case 'lastVisit':
          cmp = new Date(a.lastVisit || '').getTime() - new Date(b.lastVisit || '').getTime();
          break;
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [filtered, sortKey, sortDir]);

  const handlePatientClick = (patientId: string) => {
    setSelectedPatientId(patientId);
    setCurrentPage('patient-detail');
  };

  const thStyle: React.CSSProperties = { cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap' };

  return (
    <div className="page">
      <div className="page-header">
        <div className="page-header-left">
          <h2>Hasta Listesi</h2>
          <p>{patientsList.length} kayıtlı hasta</p>
        </div>
        <div className="page-header-actions">
          <button className="btn btn-primary" onClick={() => setShowAddModal(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <IconPlus size={16} strokeWidth={2} /> Yeni Hasta Ekle
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-body" style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <div className="header-search" style={{ flex: 1, minWidth: 200 }}>
            <span className="header-search-icon">
              <IconSearch size={15} strokeWidth={1.7} />
            </span>
            <input
              type="search"
              placeholder="Ad, TC veya telefon ile ara..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: '100%' }}
            />
          </div>
          <div className="tabs">
            {['Tümü', 'Hafif', 'Orta', 'İleri', 'Çok İleri'].map((loss) => (
              <button
                key={loss}
                className={`tab ${filterLoss === loss ? 'active' : ''}`}
                onClick={() => setFilterLoss(loss)}
              >
                {loss}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Patient Table */}
      <div className="card">
        <div className="table-container">
          <table className="mobile-cards">
            <thead>
              <tr>
                <th style={thStyle} onClick={() => handleSort('name')}>Hasta <SortIcon column="name" sortKey={sortKey} sortDir={sortDir} /></th>
                <th style={thStyle} className="hide-tablet" onClick={() => handleSort('tc')}>TC Kimlik <SortIcon column="tc" sortKey={sortKey} sortDir={sortDir} /></th>
                <th style={thStyle} className="hide-tablet" onClick={() => handleSort('phone')}>Telefon <SortIcon column="phone" sortKey={sortKey} sortDir={sortDir} /></th>
                <th style={thStyle} className="hide-tablet" onClick={() => handleSort('age')}>Yaş <SortIcon column="age" sortKey={sortKey} sortDir={sortDir} /></th>
                <th style={thStyle} onClick={() => handleSort('hearingLoss')}>İşitme Kaybı <SortIcon column="hearingLoss" sortKey={sortKey} sortDir={sortDir} /></th>
                <th style={thStyle} onClick={() => handleSort('device')}>Mevcut Cihaz <SortIcon column="device" sortKey={sortKey} sortDir={sortDir} /></th>
                <th style={thStyle} onClick={() => handleSort('sgkStatus')}>SGK Durumu <SortIcon column="sgkStatus" sortKey={sortKey} sortDir={sortDir} /></th>
                <th style={thStyle} onClick={() => handleSort('lastVisit')}>Son Ziyaret <SortIcon column="lastVisit" sortKey={sortKey} sortDir={sortDir} /></th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((patient) => (
                <tr
                  key={patient.id}
                  style={{ cursor: 'pointer' }}
                  onClick={() => handlePatientClick(patient.id)}
                >
                  <td data-label="Hasta">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div className="avatar" style={{ background: getAvatarColor(patient.firstName) }}>
                        {getInitials(patient.firstName, patient.lastName)}
                      </div>
                      <div>
                        <div className="td-primary">{patient.firstName} {patient.lastName}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--gray-500)' }}>
                          {patient.gender} · {patient.address}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td data-label="TC Kimlik" className="hide-tablet" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem' }}>{patient.tc}</td>
                  <td data-label="Telefon" className="hide-tablet">{patient.phone}</td>
                  <td data-label="Yaş" className="hide-tablet">{calculateAge(patient.birthDate)}</td>
                  <td data-label="İşitme Kaybı">
                    <span className={`badge badge-${
                      patient.hearingLoss === 'Hafif' ? 'success' :
                      patient.hearingLoss === 'Orta' ? 'warning' : 'danger'
                    }`}>
                      {patient.hearingLoss} · {patient.hearingLossSide}
                    </span>
                  </td>
                  <td data-label="Cihaz">{patient.currentDevice || <span style={{ color: 'var(--gray-400)' }}>—</span>}</td>
                  <td data-label="SGK Durumu">
                    <span className={`badge badge-${
                      patient.sgkStatus === 'Aktif' ? 'success' :
                      patient.sgkStatus === 'Yenileme Hakkı Var' ? 'warning' : 'neutral'
                    }`}>
                      <span className={`badge-dot ${
                        patient.sgkStatus === 'Aktif' ? 'success' :
                        patient.sgkStatus === 'Yenileme Hakkı Var' ? 'warning' : ''
                      }`} />
                      {patient.sgkStatus}
                    </span>
                  </td>
                  <td data-label="Son Ziyaret">{formatDate(patient.lastVisit || '')}</td>
                  <td data-label="">
                    <button className="btn btn-sm btn-ghost"
                      style={{ display: 'flex', alignItems: 'center', gap: 4 }}
                      onClick={(e) => { e.stopPropagation(); handlePatientClick(patient.id); }}>
                      Detay <IconArrowRight size={13} strokeWidth={1.8} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="empty-state">
            <div className="empty-state-icon"><IconSearch size={40} strokeWidth={1.2} /></div>
            <h3>Sonuç bulunamadı</h3>
            <p>Arama kriterlerinizi değiştirmeyi deneyin.</p>
          </div>
        )}
      </div>


      {/* Add Patient Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 640 }}>
            <div className="modal-header">
              <span className="modal-title">Yeni Hasta Ekle</span>
              <button className="modal-close" onClick={() => setShowAddModal(false)} aria-label="Kapat">
                <IconClose size={16} strokeWidth={2} />
              </button>
            </div>
            <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto', paddingRight: 8 }}>
              {/* Temel Bilgiler */}
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label"><span style={{ color: 'var(--danger-500)', marginRight: 2 }}>*</span> Ad</label>
                  <input
                    className="form-input"
                    placeholder="Ad"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label"><span style={{ color: 'var(--danger-500)', marginRight: 2 }}>*</span> Soyad</label>
                  <input
                    className="form-input"
                    placeholder="Soyad"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label"><span style={{ color: 'var(--danger-500)', marginRight: 2 }}>*</span> TC Kimlik No</label>
                  <input
                    className="form-input"
                    placeholder="TC Kimlik No"
                    maxLength={11}
                    value={formData.tc}
                    onChange={(e) => setFormData({ ...formData, tc: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Cinsiyet</label>
                  <select
                    className="form-select"
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                  >
                    <option>Erkek</option>
                    <option>Kadın</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label"><span style={{ color: 'var(--danger-500)', marginRight: 2 }}>*</span> Telefon</label>
                  <input
                    className="form-input"
                    placeholder="05XX XXX XX XX"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Doğum Tarihi</label>
                  <input
                    className="form-input"
                    type="date"
                    value={formData.birthDate}
                    onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label"><span style={{ color: 'var(--danger-500)', marginRight: 2 }}>*</span> Adres</label>
                <textarea
                  className="form-textarea"
                  placeholder="Adres"
                  rows={2}
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
              </div>

              {/* Ekstra Bilgiler (Mevcut Alanlar) */}
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">E-posta (İsteğe Bağlı)</label>
                  <input
                    className="form-input"
                    placeholder="email@adres.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">İşitme Kaybı Derecesi</label>
                  <select
                    className="form-select"
                    value={formData.hearingLoss}
                    onChange={(e) => setFormData({ ...formData, hearingLoss: e.target.value })}
                  >
                    <option>Hafif</option>
                    <option>Orta</option>
                    <option>İleri</option>
                    <option>Çok İleri</option>
                  </select>
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">İşitme Kaybı Tarafı</label>
                  <select
                    className="form-select"
                    value={formData.hearingLossSide}
                    onChange={(e) => setFormData({ ...formData, hearingLossSide: e.target.value })}
                  >
                    <option>Sol</option>
                    <option>Sağ</option>
                    <option>Her İki Kulak</option>
                  </select>
                </div>
                <div className="form-group" style={{ visibility: 'hidden' }} />
              </div>

              {/* Hasta Yakını İletişim */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 24, marginBottom: 16 }}>
                <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--gray-700)', whiteSpace: 'nowrap' }}>Hasta Yakını İletişim</span>
                <div style={{ flex: 1, height: 1, background: 'var(--gray-200)' }} />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Yakın Adı</label>
                  <input
                    className="form-input"
                    placeholder="Örn: Eşim Ayşe Hanım"
                    value={formData.emergencyContactName}
                    onChange={(e) => setFormData({ ...formData, emergencyContactName: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Yakın Telefon</label>
                  <input
                    className="form-input"
                    placeholder="05XX XXX XX XX"
                    value={formData.emergencyContactPhone}
                    onChange={(e) => setFormData({ ...formData, emergencyContactPhone: e.target.value })}
                  />
                </div>
              </div>

              {/* E-Reçete / SGK Kodları */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 24, marginBottom: 16 }}>
                <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--gray-700)', whiteSpace: 'nowrap' }}>E-Reçete / SGK Kodları</span>
                <div style={{ flex: 1, height: 1, background: 'var(--gray-200)' }} />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Reçete No</label>
                  <input
                    className="form-input"
                    placeholder="E-Reçete numarası"
                    value={formData.prescriptionNo}
                    onChange={(e) => setFormData({ ...formData, prescriptionNo: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Rapor No</label>
                  <input
                    className="form-input"
                    placeholder="Rapor numarası"
                    value={formData.reportNo}
                    onChange={(e) => setFormData({ ...formData, reportNo: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">
                    SGK Sigorta Durumu 
                    <span style={{ color: 'var(--gray-400)', cursor: 'help', marginLeft: 4 }} title="Hastanın SGK güvence tipini seçin.">ⓘ</span>
                  </label>
                  <select
                    className="form-select"
                    value={formData.sgkInsuranceStatus}
                    onChange={(e) => setFormData({ ...formData, sgkInsuranceStatus: e.target.value })}
                  >
                    <option>Belirtilmemiş</option>
                    <option>Çalışan (sigortalı)</option>
                    <option>Emekli</option>
                    <option>Diğer / Kapsam dışı</option>
                  </select>
                </div>
                
                {/* SGK warning box */}
                {!formData.birthDate ? (
                  <div style={{
                    background: '#fef8ec',
                    border: '1px solid #fcebc6',
                    borderRadius: 'var(--radius-md)',
                    padding: '10px 14px',
                    color: '#b87214',
                    fontSize: '0.8rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    height: 'fit-content',
                    alignSelf: 'end',
                    marginBottom: 8,
                    flex: 1
                  }}>
                    <span style={{ fontSize: '1rem', lineHeight: 1 }}>ⓘ</span>
                    <span>SGK katkısı için hastanın <strong>doğum tarihi</strong> girilmelidir.</span>
                  </div>
                ) : (
                  <div className="form-group" style={{ flex: 1 }} />
                )}
              </div>

              {/* Hasta Durumu */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 24, marginBottom: 16 }}>
                <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--gray-700)', whiteSpace: 'nowrap' }}>Hasta Durumu</span>
                <div style={{ flex: 1, height: 1, background: 'var(--gray-200)' }} />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Durum</label>
                  <select
                    className="form-select"
                    value={formData.patientStatus}
                    onChange={(e) => setFormData({ ...formData, patientStatus: e.target.value })}
                  >
                    <option>Potansiyel</option>
                    <option>Deneme Yapıldı</option>
                    <option>Müşteri</option>
                    <option>Satın Almayanlar</option>
                    <option>Genel</option>
                    <option>Tamir için gelen</option>
                    <option>Kalıp Hastası</option>
                    <option>Pil Hastası</option>
                  </select>
                </div>
                
                <div className="form-group">
                  <label className="form-label">Nasıl Duydunuz? (Referans Kaynağı)</label>
                  <select
                    className="form-select"
                    value={formData.source}
                    onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                  >
                    <option value="Doktor">Doktor Yönlendirmesi</option>
                    <option value="Sosyal Medya">Sosyal Medya</option>
                    <option value="Tavsiye">Hasta Tavsiyesi</option>
                    <option value="Yürüyerek">Yürüyerek (Walk-in)</option>
                    <option value="Web">Web Sitesi</option>
                  </select>
                </div>
              </div>

              {/* Hasta Notu */}
              <div className="form-group" style={{ marginTop: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <label className="form-label" style={{ marginBottom: 0 }}>Hasta Notu</label>
                  <span style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>{formData.notes.length} / 50000</span>
                </div>
                <textarea
                  className="form-textarea"
                  placeholder="Hasta hakkında notlar..."
                  maxLength={50000}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowAddModal(false)}>İptal</button>
              <button className="btn btn-primary" onClick={handleSave}>Tamam</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
