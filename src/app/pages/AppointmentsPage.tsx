'use client';

import React, { useState } from 'react';
import {
  appointments, audiologists, branches,
  getAvatarColor, statusColors,
} from '../data/mockData';

const DAYS = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];

export default function AppointmentsPage() {
  const [view, setView] = useState<'list' | 'calendar'>('list');
  const [filterAudiologist, setFilterAudiologist] = useState('Tümü');
  const [showAddModal, setShowAddModal] = useState(false);

  const filtered = appointments.filter(a =>
    filterAudiologist === 'Tümü' || a.audiologist === filterAudiologist
  );

  return (
    <div className="page">
      <div className="page-header">
        <div className="page-header-left">
          <h2>Randevu Takvimi</h2>
          <p>{appointments.length} randevu kayıtlı</p>
        </div>
        <div className="page-header-actions">
          <div className="tabs">
            <button className={`tab ${view === 'list' ? 'active' : ''}`} onClick={() => setView('list')}>📋 Liste</button>
            <button className={`tab ${view === 'calendar' ? 'active' : ''}`} onClick={() => setView('calendar')}>📅 Takvim</button>
          </div>
          <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
            ➕ Yeni Randevu
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-body" style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <div className="form-group" style={{ margin: 0 }}>
            <select
              className="form-select"
              value={filterAudiologist}
              onChange={(e) => setFilterAudiologist(e.target.value)}
              style={{ width: 220 }}
            >
              <option>Tümü</option>
              {audiologists.map(a => <option key={a}>{a}</option>)}
            </select>
          </div>
          <div className="form-group" style={{ margin: 0 }}>
            <select className="form-select" style={{ width: 220 }}>
              <option>Tüm Şubeler</option>
              {branches.map(b => <option key={b}>{b}</option>)}
            </select>
          </div>
          <div className="form-group" style={{ margin: 0 }}>
            <input className="form-input" type="date" defaultValue="2026-07-09" style={{ width: 180 }} />
          </div>
        </div>
      </div>

      {view === 'list' ? (
        <div className="card">
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Saat</th>
                  <th>Hasta</th>
                  <th>Tür</th>
                  <th>Odyolog</th>
                  <th>Şube</th>
                  <th>Durum</th>
                  <th>İşlem</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((apt) => (
                  <tr key={apt.id}>
                    <td className="td-primary" style={{ fontSize: '1rem', color: 'var(--primary-600)' }}>
                      {apt.time}
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div className="avatar" style={{ background: getAvatarColor(apt.patientName) }}>
                          {apt.patientName.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                          <div className="td-primary">{apt.patientName}</div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--gray-500)' }}>{apt.notes || '—'}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`badge badge-${
                        apt.type === 'İşitme Testi' ? 'info' :
                        apt.type === 'Cihaz Denemesi' ? 'info' :
                        apt.type === 'Kontrol' ? 'warning' :
                        apt.type === 'SGK Yenileme' ? 'success' : 'neutral'
                      }`}>{apt.type}</span>
                    </td>
                    <td>{apt.audiologist}</td>
                    <td style={{ fontSize: '0.78rem' }}>{apt.branch}</td>
                    <td>
                      <span className={`badge badge-${statusColors[apt.status] || 'neutral'}`}>
                        {apt.status}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 4 }}>
                        {apt.status === 'Bekliyor' && (
                          <>
                            <button className="btn btn-sm btn-primary">✓ Geldi</button>
                            <button className="btn btn-sm btn-ghost">✕</button>
                          </>
                        )}
                        {apt.status === 'Hatırlatıldı' && (
                          <button className="btn btn-sm btn-primary">✓ Geldi</button>
                        )}
                        {apt.status === 'Geldi' && (
                          <span style={{ fontSize: '0.78rem', color: 'var(--success-600)' }}>✓ Tamamlandı</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="card">
          <div className="card-body">
            <div className="calendar-grid">
              {DAYS.map(day => (
                <div key={day} className="calendar-header-cell">{day}</div>
              ))}
              {Array.from({ length: 35 }, (_, i) => {
                const day = i - 1; // offset for July 2026 starting on Wednesday
                const dateNum = day;
                const isCurrentMonth = dateNum >= 1 && dateNum <= 31;
                const isToday = dateNum === 9;
                const dayAppointments = isCurrentMonth
                  ? appointments.filter(a => {
                      const d = new Date(a.date).getDate();
                      return d === dateNum;
                    })
                  : [];

                return (
                  <div
                    key={i}
                    className={`calendar-cell ${isToday ? 'today' : ''} ${!isCurrentMonth ? 'other-month' : ''}`}
                  >
                    {isCurrentMonth && (
                      <>
                        <div className="day-number">
                          {isToday ? <span>{dateNum}</span> : dateNum}
                        </div>
                        {dayAppointments.map(apt => (
                          <div key={apt.id} className={`calendar-event ${
                            apt.type === 'İşitme Testi' ? 'test' :
                            apt.type === 'Cihaz Denemesi' ? 'fitting' :
                            apt.type === 'Kontrol' ? 'control' : 'sgk'
                          }`}>
                            {apt.time} {apt.patientName.split(' ')[0]}
                          </div>
                        ))}
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Add Appointment Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">📅 Yeni Randevu Oluştur</span>
              <button className="modal-close" onClick={() => setShowAddModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Hasta</label>
                <input className="form-input" placeholder="Hasta adı veya TC ile ara..." />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Tarih</label>
                  <input className="form-input" type="date" />
                </div>
                <div className="form-group">
                  <label className="form-label">Saat</label>
                  <input className="form-input" type="time" />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Randevu Türü</label>
                  <select className="form-select">
                    <option>İşitme Testi</option>
                    <option>Cihaz Denemesi</option>
                    <option>Kontrol</option>
                    <option>SGK Yenileme</option>
                    <option>Kalıp Alma</option>
                    <option>Pil Değişimi</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Odyolog</label>
                  <select className="form-select">
                    {audiologists.map(a => <option key={a}>{a}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Şube</label>
                <select className="form-select">
                  {branches.map(b => <option key={b}>{b}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Notlar</label>
                <textarea className="form-textarea" placeholder="Randevu hakkında not..." />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowAddModal(false)}>İptal</button>
              <button className="btn btn-primary" onClick={() => setShowAddModal(false)}>📅 Randevu Oluştur</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
