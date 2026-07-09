'use client';

import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import {
  patients, getAvatarColor, getInitials, formatDate, calculateAge,
  type Patient,
} from '../data/mockData';

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
  const { setCurrentPage, setSelectedPatientId } = useApp();
  const [search, setSearch] = useState('');
  const [filterLoss, setFilterLoss] = useState('Tümü');
  const [showAddModal, setShowAddModal] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const filtered = patients.filter((p) => {
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
          cmp = (hearingLossOrder[a.hearingLoss] || 0) - (hearingLossOrder[b.hearingLoss] || 0);
          break;
        case 'device':
          cmp = (a.currentDevice || '').localeCompare(b.currentDevice || '', 'tr');
          break;
        case 'sgkStatus':
          cmp = (sgkStatusOrder[a.sgkStatus] || 0) - (sgkStatusOrder[b.sgkStatus] || 0);
          break;
        case 'lastVisit':
          cmp = new Date(a.lastVisit).getTime() - new Date(b.lastVisit).getTime();
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
          <p>{patients.length} kayıtlı hasta</p>
        </div>
        <div className="page-header-actions">
          <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
            ➕ Yeni Hasta Ekle
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-body" style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <div className="header-search" style={{ flex: 1 }}>
            <span className="header-search-icon">🔍</span>
            <input
              type="text"
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
          <table>
            <thead>
              <tr>
                <th style={thStyle} onClick={() => handleSort('name')}>Hasta <SortIcon column="name" sortKey={sortKey} sortDir={sortDir} /></th>
                <th style={thStyle} onClick={() => handleSort('tc')}>TC Kimlik <SortIcon column="tc" sortKey={sortKey} sortDir={sortDir} /></th>
                <th style={thStyle} onClick={() => handleSort('phone')}>Telefon <SortIcon column="phone" sortKey={sortKey} sortDir={sortDir} /></th>
                <th style={thStyle} onClick={() => handleSort('age')}>Yaş <SortIcon column="age" sortKey={sortKey} sortDir={sortDir} /></th>
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
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div
                        className="avatar"
                        style={{ background: getAvatarColor(patient.firstName) }}
                      >
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
                  <td style={{ fontFamily: 'monospace', fontSize: '0.82rem' }}>{patient.tc}</td>
                  <td>{patient.phone}</td>
                  <td>{calculateAge(patient.birthDate)}</td>
                  <td>
                    <span className={`badge badge-${
                      patient.hearingLoss === 'Hafif' ? 'success' :
                      patient.hearingLoss === 'Orta' ? 'warning' :
                      patient.hearingLoss === 'İleri' ? 'danger' : 'danger'
                    }`}>
                      {patient.hearingLoss} · {patient.hearingLossSide}
                    </span>
                  </td>
                  <td>{patient.currentDevice || <span style={{ color: 'var(--gray-400)' }}>—</span>}</td>
                  <td>
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
                  <td>{formatDate(patient.lastVisit)}</td>
                  <td>
                    <button className="btn btn-sm btn-ghost" onClick={(e) => { e.stopPropagation(); handlePatientClick(patient.id); }}>
                      Detay →
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="empty-state">
            <div className="empty-state-icon">🔍</div>
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
              <span className="modal-title">➕ Yeni Hasta Ekle</span>
              <button className="modal-close" onClick={() => setShowAddModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">TC Kimlik No</label>
                  <input className="form-input" placeholder="11 haneli TC kimlik numarası" maxLength={11} />
                </div>
                <div className="form-group">
                  <label className="form-label">Cinsiyet</label>
                  <select className="form-select">
                    <option>Erkek</option>
                    <option>Kadın</option>
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Ad</label>
                  <input className="form-input" placeholder="Hastanın adı" />
                </div>
                <div className="form-group">
                  <label className="form-label">Soyad</label>
                  <input className="form-input" placeholder="Hastanın soyadı" />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Telefon</label>
                  <input className="form-input" placeholder="0532 123 4567" />
                </div>
                <div className="form-group">
                  <label className="form-label">Doğum Tarihi</label>
                  <input className="form-input" type="date" />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">E-posta</label>
                <input className="form-input" placeholder="email@adres.com" />
              </div>
              <div className="form-group">
                <label className="form-label">Adres</label>
                <input className="form-input" placeholder="İlçe, Şehir" />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">İşitme Kaybı Derecesi</label>
                  <select className="form-select">
                    <option>Hafif</option>
                    <option>Orta</option>
                    <option>İleri</option>
                    <option>Çok İleri</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">İşitme Kaybı Tarafı</label>
                  <select className="form-select">
                    <option>Sol</option>
                    <option>Sağ</option>
                    <option>Her İki Kulak</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Notlar</label>
                <textarea className="form-textarea" placeholder="Hasta hakkında notlar..." />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowAddModal(false)}>İptal</button>
              <button className="btn btn-primary" onClick={() => setShowAddModal(false)}>💾 Kaydet</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
