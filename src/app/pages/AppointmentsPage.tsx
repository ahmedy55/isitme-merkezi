'use client';

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { getAvatarColor } from '../data/mockData';
import { IconPlus, IconSGK, IconCalendar, IconCheck, IconClose } from '../components/Icons';

const branches = ['Merkez 1 - Kadıköy', 'Merkez 2 - Beşiktaş'];
const audiologists = ['Dr. Elif Arslan', 'Dr. Can Yılmaz'];
const statusColors: Record<string, string> = {
  'Bekliyor': 'warning',
  'Geldi': 'success',
  'Gelmedi': 'danger',
  'İptal': 'neutral'
};

const DAYS = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];

export default function AppointmentsPage() {
  const { appointmentsList, addAppointment, updateAppointmentStatus } = useApp();
  
  const stats = React.useMemo(() => {
    const total = appointmentsList.length;
    const planlandi = appointmentsList.filter(a => a.status === 'Bekliyor' || a.status === 'Hatırlatıldı').length;
    const tamamlanan = appointmentsList.filter(a => a.status === 'Geldi').length;
    const iptal = appointmentsList.filter(a => a.status === 'İptal' || a.status === 'Gelmedi').length;
    return { total, planlandi, tamamlanan, iptal };
  }, [appointmentsList]);

  const [view, setView] = useState<'list' | 'calendar'>('list');
  const [filterAudiologist, setFilterAudiologist] = useState('Tümü');
  const [showAddModal, setShowAddModal] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date(2026, 6, 9));

  const [formData, setFormData] = useState({
    patientName: '',
    date: '2026-07-10',
    time: '10:00',
    type: 'İşitme Testi',
    audiologist: 'Dr. Elif Arslan',
    branch: 'Merkez 1 - Kadıköy',
    notes: ''
  });

  const handleSave = () => {
    if (!formData.patientName) {
      alert('Lütfen hasta adı girin.');
      return;
    }
    const newApt = {
      id: `apt-${Date.now().toString().slice(-6)}`,
      patientId: 'p-unknown',
      patientName: formData.patientName,
      date: formData.date,
      time: formData.time,
      type: formData.type as any,
      audiologist: formData.audiologist,
      branch: formData.branch as any,
      status: 'Bekliyor' as const,
      notes: formData.notes
    };
    addAppointment(newApt);
    setShowAddModal(false);
    setFormData({
      patientName: '',
      date: '2026-07-10',
      time: '10:00',
      type: 'İşitme Testi',
      audiologist: 'Dr. Elif Arslan',
      branch: 'Merkez 1 - Kadıköy',
      notes: ''
    });
  };

  const filtered = appointmentsList.filter(a =>
    filterAudiologist === 'Tümü' || a.audiologist === filterAudiologist
  );

  return (
    <div className="page">
      <div className="page-header">
        <div className="page-header-left">
          <h2>Randevu Takvimi</h2>
          <p>{appointmentsList.length} randevu kayıtlı</p>
        </div>
        <div className="page-header-actions">
          <div className="tabs">
            <button className={`tab ${view === 'list' ? 'active' : ''}`} onClick={() => setView('list')}>Liste</button>
            <button className={`tab ${view === 'calendar' ? 'active' : ''}`} onClick={() => setView('calendar')}>Takvim</button>
          </div>
          <button className="btn btn-primary" onClick={() => setShowAddModal(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <IconPlus size={15} strokeWidth={2} /> Yeni Randevu
          </button>
        </div>
      </div>

      {/* İstatistik Kartları */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 20, marginBottom: 20 }}>
        
        {/* Toplam Randevu */}
        <div className="card">
          <div className="card-body" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{
              width: 48,
              height: 48,
              borderRadius: 'var(--radius-lg)',
              background: 'var(--primary-100)',
              color: 'var(--primary-600)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.4rem',
              boxShadow: 'var(--shadow-xs)'
            }}>
              📅
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Toplam Randevu</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--gray-900)', fontFamily: 'var(--font-display)', lineHeight: 1.2 }}>{stats.total}</div>
            </div>
          </div>
        </div>

        {/* Planlandı */}
        <div className="card">
          <div className="card-body" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{
              width: 48,
              height: 48,
              borderRadius: 'var(--radius-lg)',
              background: 'var(--info-50)',
              color: 'var(--info-600)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.4rem',
              boxShadow: 'var(--shadow-xs)'
            }}>
              🕒
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Planlandı</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--info-600)', fontFamily: 'var(--font-display)', lineHeight: 1.2 }}>{stats.planlandi}</div>
            </div>
          </div>
        </div>

        {/* Tamamlanan */}
        <div className="card">
          <div className="card-body" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{
              width: 48,
              height: 48,
              borderRadius: 'var(--radius-lg)',
              background: 'var(--success-50)',
              color: 'var(--success-600)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.4rem',
              boxShadow: 'var(--shadow-xs)'
            }}>
              ✅
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Tamamlanan</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--success-600)', fontFamily: 'var(--font-display)', lineHeight: 1.2 }}>{stats.tamamlanan}</div>
            </div>
          </div>
        </div>

        {/* İptal Edilen */}
        <div className="card">
          <div className="card-body" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{
              width: 48,
              height: 48,
              borderRadius: 'var(--radius-lg)',
              background: 'var(--danger-50)',
              color: 'var(--danger-600)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.4rem',
              boxShadow: 'var(--shadow-xs)'
            }}>
              ❌
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>İptal Edilen</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--danger-600)', fontFamily: 'var(--font-display)', lineHeight: 1.2 }}>{stats.iptal}</div>
            </div>
          </div>
        </div>

      </div>

      {/* Filters */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-body" style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <div className="form-group" style={{ margin: 0, flex: '1 1 200px' }}>
            <select
              className="form-select"
              value={filterAudiologist}
              onChange={(e) => setFilterAudiologist(e.target.value)}
              style={{ width: '100%' }}
            >
              <option>Tümü</option>
              {audiologists.map(a => <option key={a}>{a}</option>)}
            </select>
          </div>
          <div className="form-group" style={{ margin: 0, flex: '1 1 200px' }}>
            <select className="form-select" style={{ width: '100%' }}>
              <option>Tüm Şubeler</option>
              {branches.map(b => <option key={b}>{b}</option>)}
            </select>
          </div>
          <div className="form-group" style={{ margin: 0, flex: '1 1 150px' }}>
            <input className="form-input" type="date" defaultValue="2026-07-09" style={{ width: '100%' }} />
          </div>
        </div>
      </div>

      {view === 'list' ? (
        <div className="card">
          <div className="table-container">
            <table className="mobile-cards">
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
                    <td data-label="Saat" className="td-primary"
                      style={{ fontFamily: 'var(--font-mono)', color: 'var(--primary-600)' }}>
                      {apt.time}
                    </td>
                    <td data-label="Hasta">
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
                    <td data-label="Tür">
                      <span className={`badge badge-${
                        apt.type === 'İşitme Testi' ? 'info' :
                        apt.type === 'Cihaz Denemesi' ? 'info' :
                        apt.type === 'Kontrol' ? 'warning' :
                        apt.type === 'SGK Yenileme' ? 'success' : 'neutral'
                      }`}>{apt.type}</span>
                    </td>
                    <td data-label="Odyolog">{apt.audiologist}</td>
                    <td data-label="Ŝube" style={{ fontSize: '0.78rem' }}>{apt.branch}</td>
                    <td data-label="Durum">
                      <span className={`badge badge-${statusColors[apt.status] || 'neutral'}`}>
                        {apt.status}
                      </span>
                    </td>
                    <td data-label="">
                      <div style={{ display: 'flex', gap: 4 }}>
                        {apt.status === 'Bekliyor' && (
                          <>
                            <button className="btn btn-sm btn-primary"
                              onClick={() => updateAppointmentStatus(apt.id, 'Geldi')}
                              style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                              <IconCheck size={12} strokeWidth={2} /> Geldi
                            </button>
                            <button className="btn btn-sm btn-ghost btn-icon"
                              onClick={() => updateAppointmentStatus(apt.id, 'İptal')}
                              aria-label="İptal">
                              <IconClose size={13} strokeWidth={2} />
                            </button>
                          </>
                        )}
                        {apt.status === 'Hatırlatıldı' && (
                          <button className="btn btn-sm btn-primary"
                            onClick={() => updateAppointmentStatus(apt.id, 'Geldi')}
                            style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <IconCheck size={12} strokeWidth={2} /> Geldi
                          </button>
                        )}
                        {apt.status === 'Geldi' && (
                          <span style={{ fontSize: '0.78rem', color: 'var(--success-600)', display: 'flex', alignItems: 'center', gap: 4 }}>
                            <IconCheck size={12} strokeWidth={2} /> Tamamlandı
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (() => {
        const monthNames = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
        const currentMonthName = monthNames[currentDate.getMonth()];
        const currentYear = currentDate.getFullYear();
        
        const firstDay = new Date(currentYear, currentDate.getMonth(), 1);
        const startDayOfWeek = (firstDay.getDay() + 6) % 7; // Pazartesi = 0
        const daysInMonth = new Date(currentYear, currentDate.getMonth() + 1, 0).getDate();
        
        const cells = [];
        
        // Önceki aydan taşan günler
        const prevMonthDays = new Date(currentYear, currentDate.getMonth(), 0).getDate();
        for (let i = startDayOfWeek - 1; i >= 0; i--) {
          cells.push({ dateNum: prevMonthDays - i, isCurrentMonth: false, fullDate: '' });
        }
        
        // Bu ayın günleri
        for (let i = 1; i <= daysInMonth; i++) {
          const dayStr = i.toString().padStart(2, '0');
          const monthStr = (currentDate.getMonth() + 1).toString().padStart(2, '0');
          cells.push({
            dateNum: i,
            isCurrentMonth: true,
            fullDate: `${currentYear}-${monthStr}-${dayStr}`
          });
        }
        
        // Sonraki aydan taşan günler
        const remainingCells = (cells.length <= 35 ? 35 : 42) - cells.length;
        for (let i = 1; i <= remainingCells; i++) {
          cells.push({ dateNum: i, isCurrentMonth: false, fullDate: '' });
        }

        return (
          <div className="card">
            <div className="card-body">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
                <h3 style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--gray-800)' }}>
                  {currentMonthName} {currentYear}
                </h3>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button className="btn btn-sm btn-secondary" onClick={() => setCurrentDate(new Date(currentYear, currentDate.getMonth() - 1, 1))}>
                    ◀ Önceki Ay
                  </button>
                  <button className="btn btn-sm btn-secondary" onClick={() => setCurrentDate(new Date(currentYear, currentDate.getMonth() + 1, 1))}>
                    Sonraki Ay ▶
                  </button>
                </div>
              </div>
              
              <div className="calendar-grid">
                {DAYS.map(day => (
                  <div key={day} className="calendar-header-cell">{day}</div>
                ))}
                {cells.map((cell, idx) => {
                  const isToday = cell.isCurrentMonth && cell.dateNum === 9 && currentDate.getMonth() === 6 && currentYear === 2026;
                  const dayAppointments = cell.isCurrentMonth
                    ? appointmentsList.filter(a => a.date === cell.fullDate)
                    : [];
                    
                  return (
                    <div
                      key={idx}
                      className={`calendar-cell ${isToday ? 'today' : ''} ${!cell.isCurrentMonth ? 'other-month' : ''}`}
                    >
                      <div className="day-number">
                        {isToday ? <span>{cell.dateNum}</span> : cell.dateNum}
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
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        );
      })()}

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
                <input
                  className="form-input"
                  placeholder="Hasta adı veya TC ile ara..."
                  value={formData.patientName}
                  onChange={(e) => setFormData({ ...formData, patientName: e.target.value })}
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Tarih</label>
                  <input
                    className="form-input"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Saat</label>
                  <input
                    className="form-input"
                    type="time"
                    value={formData.time}
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Randevu Türü</label>
                  <select
                    className="form-select"
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  >
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
                  <select
                    className="form-select"
                    value={formData.audiologist}
                    onChange={(e) => setFormData({ ...formData, audiologist: e.target.value })}
                  >
                    {audiologists.map(a => <option key={a}>{a}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Şube</label>
                <select
                  className="form-select"
                  value={formData.branch}
                  onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                >
                  {branches.map(b => <option key={b}>{b}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Notlar</label>
                <textarea
                  className="form-textarea"
                  placeholder="Randevu hakkında not..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowAddModal(false)}>İptal</button>
              <button className="btn btn-primary" onClick={handleSave}>📅 Randevu Oluştur</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
