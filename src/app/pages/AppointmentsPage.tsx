'use client';

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useBranch } from '../context/BranchContext';
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
  const { appointmentsList: rawAppointmentsList, patientsList, addAppointment, updateAppointmentStatus, addToast } = useApp();
  const { activeBranch } = useBranch();

  const appointmentsList = React.useMemo(() => {
    return rawAppointmentsList.filter(a => activeBranch.mode === 'single' ? (a.branch || '').includes(activeBranch.branch?.name || activeBranch.slug) : true);
  }, [rawAppointmentsList, activeBranch]);
  
  const stats = React.useMemo(() => {
    const total = appointmentsList.length;
    const planlandi = appointmentsList.filter(a => a.status === 'Bekliyor' || a.status === 'Hatırlatıldı').length;
    const tamamlanan = appointmentsList.filter(a => a.status === 'Geldi').length;
    const iptal = appointmentsList.filter(a => a.status === 'İptal' || a.status === 'Gelmedi').length;
    return { total, planlandi, tamamlanan, iptal };
  }, [appointmentsList]);

  const [view, setView] = useState<'list' | 'calendar'>('list');
  const [filterAudiologist, setFilterAudiologist] = useState('Tümü');
  const [statusWidgetFilter, setStatusWidgetFilter] = useState<'all' | 'planlandi' | 'tamamlanan' | 'iptal'>('all');
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

  const filtered = appointmentsList.filter(a => {
    const matchAudiologist = filterAudiologist === 'Tümü' || a.audiologist === filterAudiologist;
    let matchWidget = true;
    if (statusWidgetFilter === 'planlandi') {
      matchWidget = a.status === 'Bekliyor' || a.status === 'Hatırlatıldı';
    } else if (statusWidgetFilter === 'tamamlanan') {
      matchWidget = a.status === 'Geldi';
    } else if (statusWidgetFilter === 'iptal') {
      matchWidget = a.status === 'İptal' || a.status === 'Gelmedi';
    }
    return matchAudiologist && matchWidget;
  });

  return (
    <div className="page">
      <div className="page-header">
        <div className="page-header-left">
          <h2>Randevu Takvimi</h2>
          <p>{appointmentsList.length} randevu kayıtlı {statusWidgetFilter !== 'all' && `(${filtered.length} filtreli gösteriliyor)`}</p>
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

      {/* İstatistik Kartları (Filtreleme Widget'ları) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 20, marginBottom: 20 }}>
        
        {/* Toplam Randevu */}
        <div 
          className="card" 
          onClick={() => setStatusWidgetFilter('all')}
          style={{ 
            cursor: 'pointer', 
            transition: 'all 0.2s ease',
            border: statusWidgetFilter === 'all' ? '2px solid var(--primary-600)' : '1px solid var(--gray-200)',
            boxShadow: statusWidgetFilter === 'all' ? '0 4px 12px rgba(var(--primary-rgb), 0.15)' : undefined,
            transform: statusWidgetFilter === 'all' ? 'translateY(-2px)' : undefined
          }}
          title="Tüm Randevuları Listele"
        >
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
        <div 
          className="card"
          onClick={() => setStatusWidgetFilter('planlandi')}
          style={{ 
            cursor: 'pointer', 
            transition: 'all 0.2s ease',
            border: statusWidgetFilter === 'planlandi' ? '2px solid var(--info-600)' : '1px solid var(--gray-200)',
            boxShadow: statusWidgetFilter === 'planlandi' ? '0 4px 12px rgba(var(--info-rgb), 0.15)' : undefined,
            transform: statusWidgetFilter === 'planlandi' ? 'translateY(-2px)' : undefined
          }}
          title="Sadece Bekleyen / Planlanan Randevuları Listele"
        >
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
        <div 
          className="card"
          onClick={() => setStatusWidgetFilter('tamamlanan')}
          style={{ 
            cursor: 'pointer', 
            transition: 'all 0.2s ease',
            border: statusWidgetFilter === 'tamamlanan' ? '2px solid var(--success-600)' : '1px solid var(--gray-200)',
            boxShadow: statusWidgetFilter === 'tamamlanan' ? '0 4px 12px rgba(var(--success-rgb), 0.15)' : undefined,
            transform: statusWidgetFilter === 'tamamlanan' ? 'translateY(-2px)' : undefined
          }}
          title="Sadece Tamamlanan Randevuları Listele"
        >
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
        <div 
          className="card"
          onClick={() => setStatusWidgetFilter('iptal')}
          style={{ 
            cursor: 'pointer', 
            transition: 'all 0.2s ease',
            border: statusWidgetFilter === 'iptal' ? '2px solid var(--danger-600)' : '1px solid var(--gray-200)',
            boxShadow: statusWidgetFilter === 'iptal' ? '0 4px 12px rgba(var(--danger-rgb), 0.15)' : undefined,
            transform: statusWidgetFilter === 'iptal' ? 'translateY(-2px)' : undefined
          }}
          title="Sadece İptal Edilen / Gelmeyen Randevuları Listele"
        >
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
        <NewAppointmentModal
          onClose={() => setShowAddModal(false)}
          onSave={(newApt) => {
            addAppointment(newApt);
            setShowAddModal(false);
          }}
          patientsList={patientsList}
          addToast={addToast}
        />
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════
// Gelişmiş "Yeni Randevu" Modal Bileşeni
// ═══════════════════════════════════════════════
export function NewAppointmentModal({
  onClose,
  onSave,
  patientsList,
  addToast
}: {
  onClose: () => void;
  onSave: (apt: any) => void;
  patientsList: any[];
  addToast?: any;
}) {
  // Patient Search & Selection State
  const [patientSearch, setPatientSearch] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<{ id: string; name: string; phone: string } | null>(null);
  const [isPatientDropdownOpen, setIsPatientDropdownOpen] = useState(false);
  const [isAddingNewPatient, setIsAddingNewPatient] = useState(false);
  const [newPatientName, setNewPatientName] = useState('');
  const [newPatientPhone, setNewPatientPhone] = useState('');

  // Date & Time State
  const [selectedDate, setSelectedDate] = useState<Date>(new Date(2026, 6, 22, 9, 0));
  const [showPicker, setShowPicker] = useState(false);
  const [pickerMonth, setPickerMonth] = useState(6); // July (0-indexed)
  const [pickerYear, setPickerYear] = useState(2026);

  // Appointment Type State
  const [aptType, setAptType] = useState('Muayene');
  const [isTypeDropdownOpen, setIsTypeDropdownOpen] = useState(false);

  // Audiologist & Branch
  const [audiologist, setAudiologist] = useState('Dr. Elif Arslan');
  const [branch, setBranch] = useState('Merkez 1 - Kadıköy');

  // Notes
  const [notes, setNotes] = useState('');

  // Takip Planı
  const [createFollowupPlan, setCreateFollowupPlan] = useState(false);
  const [followupNote, setFollowupNote] = useState('');
  const [selectedPeriods, setSelectedPeriods] = useState<string[]>([
    '1 Hafta Kontrol',
    '1 Ay Kontrol',
    '3 Ay Kontrol',
    '6 Ay Kontrol',
    '1 Yıl Kontrol'
  ]);

  // WhatsApp Reminders
  const [sendWhatsappReminder, setSendWhatsappReminder] = useState(true);
  const [reminders, setReminders] = useState<string[]>(['1 saat önce', '2 saat önce']);
  const [customVal, setCustomVal] = useState(30);
  const [customUnit, setCustomUnit] = useState<'Dakika' | 'Saat' | 'Gün'>('Dakika');

  // WhatsApp Message on Create
  const [sendWhatsappOnCreate, setSendWhatsappOnCreate] = useState(false);

  // Filter Patients
  const filteredPatients = (patientsList || []).filter((p) => {
    const fullName = `${p.firstName || ''} ${p.lastName || ''}`.trim();
    const query = patientSearch.toLowerCase();
    return (
      fullName.toLowerCase().includes(query) ||
      (p.phone && p.phone.includes(query)) ||
      (p.tc && p.tc.includes(query))
    );
  });

  const aptTypeOptions = [
    { label: 'Muayene', color: '#2563eb' },
    { label: 'Kontrol', color: '#16a34a' },
    { label: 'Test', color: '#9333ea' },
    { label: 'Cihaz Denemesi', color: '#db2777' },
    { label: 'Cihaz Teslim', color: '#ea580c' },
    { label: 'Servis', color: '#0891b2' },
  ];

  const currentTypeOption = aptTypeOptions.find(o => o.label === aptType) || aptTypeOptions[0];

  // Date picker calendar logic
  const monthNames = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
  const monthShortNames = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
  
  const firstDayOfMonth = new Date(pickerYear, pickerMonth, 1);
  const startDayOfWeek = (firstDayOfMonth.getDay() + 6) % 7; // Monday = 0
  const daysInMonth = new Date(pickerYear, pickerMonth + 1, 0).getDate();
  const prevMonthDays = new Date(pickerYear, pickerMonth, 0).getDate();

  const calendarDays = [];
  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    calendarDays.push({ num: prevMonthDays - i, isCurrent: false });
  }
  for (let i = 1; i <= daysInMonth; i++) {
    calendarDays.push({ num: i, isCurrent: true });
  }
  const remainingCells = (calendarDays.length <= 35 ? 35 : 42) - calendarDays.length;
  for (let i = 1; i <= remainingCells; i++) {
    calendarDays.push({ num: i, isCurrent: false });
  }

  const formatDisplayDateTime = (d: Date) => {
    const dayStr = d.getDate().toString().padStart(2, '0');
    const monthStr = (d.getMonth() + 1).toString().padStart(2, '0');
    const yearStr = d.getFullYear();
    const hourStr = d.getHours().toString().padStart(2, '0');
    const minStr = d.getMinutes().toString().padStart(2, '0');
    return `${dayStr}.${monthStr}.${yearStr} ${hourStr}:${minStr}`;
  };

  const handleQuickAddReminder = (item: string) => {
    if (!reminders.includes(item)) {
      setReminders([...reminders, item]);
    }
  };

  const handleAddCustomReminder = () => {
    const newItem = `${customVal} ${customUnit.toLowerCase()} önce`;
    if (!reminders.includes(newItem)) {
      setReminders([...reminders, newItem]);
    }
  };

  const handleRemoveReminder = (index: number) => {
    setReminders(reminders.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let patientNameFinal = '';
    let patientIdFinal = 'p-unknown';

    if (isAddingNewPatient) {
      if (!newPatientName.trim()) {
        alert('Lütfen yeni hasta adı girin.');
        return;
      }
      patientNameFinal = newPatientName.trim();
    } else if (selectedPatient) {
      patientNameFinal = selectedPatient.name;
      patientIdFinal = selectedPatient.id;
    } else if (patientSearch.trim()) {
      patientNameFinal = patientSearch.trim();
    } else {
      alert('Lütfen bir hasta seçin veya yeni hasta adı girin.');
      return;
    }

    const yearStr = selectedDate.getFullYear();
    const monthStr = (selectedDate.getMonth() + 1).toString().padStart(2, '0');
    const dayStr = selectedDate.getDate().toString().padStart(2, '0');
    const dateStr = `${yearStr}-${monthStr}-${dayStr}`;

    const hourStr = selectedDate.getHours().toString().padStart(2, '0');
    const minStr = selectedDate.getMinutes().toString().padStart(2, '0');
    const timeStr = `${hourStr}:${minStr}`;

    const newApt = {
      id: `apt-${Date.now().toString().slice(-6)}`,
      patientId: patientIdFinal,
      patientName: patientNameFinal,
      date: dateStr,
      time: timeStr,
      type: aptType as any,
      audiologist,
      branch: branch as any,
      status: 'Bekliyor' as const,
      notes: notes,
      followupPlan: createFollowupPlan,
      followupPeriods: createFollowupPlan ? selectedPeriods : [],
      followupNote: createFollowupPlan ? followupNote : '',
      whatsappReminders: sendWhatsappReminder ? reminders : [],
      sendWhatsappOnCreate
    };

    onSave(newApt);
  };

  return (
    <div 
      className="modal-overlay" 
      onClick={onClose}
      style={{
        position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
        background: 'rgba(15, 23, 42, 0.45)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
        padding: 16
      }}
    >
      <div 
        className="modal" 
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#ffffff', borderRadius: 16, width: '100%', maxWidth: 580,
          maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 40px -10px rgba(0, 0, 0, 0.15)',
          display: 'flex', flexDirection: 'column'
        }}
      >
        {/* Modal Header */}
        <div style={{
          padding: '18px 24px', borderBottom: '1px solid #f1f5f9',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          position: 'sticky', top: 0, background: '#ffffff', zIndex: 10
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '1.15rem', fontWeight: 700, color: '#0f172a' }}>
            <span>📅</span>
            <span>Yeni Randevu</span>
          </div>
          <button 
            onClick={onClose}
            style={{
              background: 'transparent', border: 'none', fontSize: '1.2rem', color: '#64748b',
              cursor: 'pointer', padding: 4, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
          
          {/* Hasta Seçimi */}
          <div style={{ position: 'relative' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.86rem', fontWeight: 600, color: '#334155', marginBottom: 6 }}>
              <span style={{ color: '#ef4444' }}>*</span>
              <span>👤 Hasta</span>
            </label>

            {!isAddingNewPatient ? (
              <>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Hasta seçin veya arayın..."
                    value={selectedPatient ? `${selectedPatient.name} - ${selectedPatient.phone || ''}` : patientSearch}
                    onChange={(e) => {
                      setSelectedPatient(null);
                      setPatientSearch(e.target.value);
                      setIsPatientDropdownOpen(true);
                    }}
                    onFocus={() => setIsPatientDropdownOpen(true)}
                    style={{
                      width: '100%', padding: '10px 36px 10px 14px', borderRadius: 10,
                      border: isPatientDropdownOpen ? '2px solid #3b82f6' : '1px solid #cbd5e1',
                      fontSize: '0.9rem', outline: 'none', background: '#ffffff'
                    }}
                  />
                  <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none' }}>
                    {selectedPatient ? '✓' : '🔍'}
                  </span>
                </div>

                {/* Patient Search Dropdown */}
                {isPatientDropdownOpen && (
                  <div style={{
                    position: 'absolute', top: '100%', left: 0, width: '100%', marginTop: 6,
                    background: '#ffffff', borderRadius: 12, border: '1px solid #e2e8f0',
                    boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)', zIndex: 100, overflow: 'hidden', padding: 6
                  }}>
                    <div style={{ maxHeight: 200, overflowY: 'auto' }}>
                      {filteredPatients.length > 0 ? (
                        filteredPatients.map((p) => {
                          const fullName = `${p.firstName || ''} ${p.lastName || ''}`.trim();
                          return (
                            <div
                              key={p.id}
                              onClick={() => {
                                setSelectedPatient({ id: p.id, name: fullName, phone: p.phone || '' });
                                setIsPatientDropdownOpen(false);
                              }}
                              style={{
                                padding: '10px 12px', borderRadius: 8, cursor: 'pointer',
                                fontSize: '0.88rem', fontWeight: 500, color: '#334155',
                                background: '#f8fafc', marginBottom: 4, transition: 'all 0.15s'
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.background = '#f1f5f9'}
                              onMouseLeave={(e) => e.currentTarget.style.background = '#f8fafc'}
                            >
                              {fullName} {p.phone && ` - ${p.phone}`}
                            </div>
                          );
                        })
                      ) : (
                        <div style={{ padding: '10px 12px', fontSize: '0.85rem', color: '#94a3b8' }}>
                          Aranan hasta bulunamadı.
                        </div>
                      )}
                    </div>

                    <div
                      onClick={() => {
                        setIsAddingNewPatient(true);
                        setIsPatientDropdownOpen(false);
                      }}
                      style={{
                        padding: '10px', marginTop: 4, borderRadius: 8, border: '1.5px dashed #cbd5e1',
                        textAlign: 'center', fontSize: '0.88rem', fontWeight: 600, color: '#334155',
                        cursor: 'pointer', background: '#ffffff', transition: 'all 0.15s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
                      onMouseLeave={(e) => e.currentTarget.style.background = '#ffffff'}
                    >
                      + 👤 Yeni Hasta Ekle
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div style={{ background: '#f8fafc', padding: 12, borderRadius: 10, border: '1px solid #cbd5e1', display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.84rem', fontWeight: 600, color: '#3b82f6' }}>
                  <span>Yeni Hasta Kaydı</span>
                  <button type="button" onClick={() => setIsAddingNewPatient(false)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '0.8rem' }}>
                    İptal / Listeden Seç
                  </button>
                </div>
                <input
                  type="text"
                  placeholder="Hasta Adı Soyadı *"
                  className="form-input"
                  value={newPatientName}
                  onChange={(e) => setNewPatientName(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 6, fontSize: '0.88rem' }}
                />
                <input
                  type="text"
                  placeholder="Telefon (Örn: 0555...)"
                  className="form-input"
                  value={newPatientPhone}
                  onChange={(e) => setNewPatientPhone(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 6, fontSize: '0.88rem' }}
                />
              </div>
            )}
          </div>

          {/* Tarih ve Saat + Randevu Tipi Row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            
            {/* Tarih ve Saat Picker */}
            <div style={{ position: 'relative' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.86rem', fontWeight: 600, color: '#334155', marginBottom: 6 }}>
                <span style={{ color: '#ef4444' }}>*</span>
                <span>📅 Tarih ve Saat</span>
              </label>

              <div 
                onClick={() => setShowPicker(!showPicker)}
                style={{
                  width: '100%', padding: '10px 14px', borderRadius: 10,
                  border: showPicker ? '2px solid #3b82f6' : '1px solid #cbd5e1',
                  fontSize: '0.9rem', cursor: 'pointer', background: '#ffffff',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#0f172a'
                }}
              >
                <span>{formatDisplayDateTime(selectedDate)}</span>
                <span style={{ color: '#94a3b8' }}>📅</span>
              </div>

              {/* Date Time Picker Popover */}
              {showPicker && (
                <div style={{
                  position: 'absolute', top: '100%', left: 0, marginTop: 6,
                  background: '#ffffff', borderRadius: 14, border: '1px solid #e2e8f0',
                  boxShadow: '0 15px 35px -5px rgba(0,0,0,0.18)', zIndex: 120, padding: 14,
                  display: 'flex', flexDirection: 'column', gap: 12, width: 340
                }}>
                  <div style={{ display: 'flex', gap: 12 }}>
                    
                    {/* Left: Calendar */}
                    <div style={{ flex: 1 }}>
                      {/* Month Year Nav */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                        <div style={{ display: 'flex', gap: 4 }}>
                          <button type="button" onClick={() => setPickerYear(pickerYear - 1)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px 4px', color: '#64748b' }}>«</button>
                          <button type="button" onClick={() => setPickerMonth(pickerMonth === 0 ? 11 : pickerMonth - 1)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px 4px', color: '#64748b' }}>‹</button>
                        </div>
                        <span style={{ fontWeight: 700, fontSize: '0.88rem', color: '#0f172a' }}>
                          {monthShortNames[pickerMonth]} {pickerYear}
                        </span>
                        <div style={{ display: 'flex', gap: 4 }}>
                          <button type="button" onClick={() => setPickerMonth(pickerMonth === 11 ? 0 : pickerMonth + 1)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px 4px', color: '#64748b' }}>›</button>
                          <button type="button" onClick={() => setPickerYear(pickerYear + 1)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px 4px', color: '#64748b' }}>»</button>
                        </div>
                      </div>

                      {/* Day Names */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', textAlign: 'center', fontSize: '0.72rem', fontWeight: 600, color: '#64748b', marginBottom: 6 }}>
                        {['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'].map(d => <div key={d}>{d}</div>)}
                      </div>

                      {/* Calendar Days */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2, textAlign: 'center' }}>
                        {calendarDays.map((cell, idx) => {
                          const isSelected = cell.isCurrent && selectedDate.getDate() === cell.num && selectedDate.getMonth() === pickerMonth && selectedDate.getFullYear() === pickerYear;
                          return (
                            <div
                              key={idx}
                              onClick={() => {
                                if (cell.isCurrent) {
                                  const newD = new Date(selectedDate);
                                  newD.setFullYear(pickerYear);
                                  newD.setMonth(pickerMonth);
                                  newD.setDate(cell.num);
                                  setSelectedDate(newD);
                                }
                              }}
                              style={{
                                padding: '5px 0', fontSize: '0.8rem', borderRadius: 6,
                                cursor: cell.isCurrent ? 'pointer' : 'default',
                                color: !cell.isCurrent ? '#cbd5e1' : isSelected ? '#ffffff' : '#334155',
                                background: isSelected ? '#3b82f6' : 'transparent',
                                fontWeight: isSelected ? 700 : 400
                              }}
                            >
                              {cell.num}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Right: Time picker */}
                    <div style={{ width: 75, borderLeft: '1px solid #f1f5f9', paddingLeft: 8, display: 'flex', flexDirection: 'column', height: 180, overflowY: 'auto' }}>
                      <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', marginBottom: 4, textTransform: 'uppercase' }}>Saat</div>
                      {['08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30', '18:00'].map((timeStr) => {
                        const [h, m] = timeStr.split(':').map(Number);
                        const isTimeSelected = selectedDate.getHours() === h && selectedDate.getMinutes() === m;
                        return (
                          <div
                            key={timeStr}
                            onClick={() => {
                              const newD = new Date(selectedDate);
                              newD.setHours(h);
                              newD.setMinutes(m);
                              setSelectedDate(newD);
                            }}
                            style={{
                              padding: '4px 6px', fontSize: '0.78rem', borderRadius: 4, cursor: 'pointer',
                              background: isTimeSelected ? '#e0f2fe' : 'transparent',
                              color: isTimeSelected ? '#0284c7' : '#475569',
                              fontWeight: isTimeSelected ? 700 : 400, marginBottom: 2
                            }}
                          >
                            {timeStr}
                          </div>
                        );
                      })}
                    </div>

                  </div>

                  {/* Popover Footer */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f1f5f9', paddingTop: 8 }}>
                    <button
                      type="button"
                      onClick={() => {
                        const now = new Date();
                        setSelectedDate(now);
                        setPickerMonth(now.getMonth());
                        setPickerYear(now.getFullYear());
                      }}
                      style={{ background: 'none', border: 'none', color: '#3b82f6', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer' }}
                    >
                      Şimdi
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowPicker(false)}
                      style={{ background: '#f1f5f9', border: 'none', padding: '5px 14px', borderRadius: 6, color: '#334155', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer' }}
                    >
                      Tamam
                    </button>
                  </div>

                </div>
              )}
            </div>

            {/* Randevu Tipi Dropdown */}
            <div style={{ position: 'relative' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.86rem', fontWeight: 600, color: '#334155', marginBottom: 6 }}>
                <span style={{ color: '#ef4444' }}>*</span>
                <span>🏥 Randevu Tipi</span>
              </label>

              <div
                onClick={() => setIsTypeDropdownOpen(!isTypeDropdownOpen)}
                style={{
                  width: '100%', padding: '10px 14px', borderRadius: 10,
                  border: isTypeDropdownOpen ? '2px solid #3b82f6' : '1px solid #cbd5e1',
                  fontSize: '0.9rem', cursor: 'pointer', background: '#ffffff',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600, color: '#0f172a' }}>
                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: currentTypeOption.color }} />
                  <span>{aptType}</span>
                </div>
                <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>▼</span>
              </div>

              {isTypeDropdownOpen && (
                <div style={{
                  position: 'absolute', top: '100%', left: 0, width: '100%', marginTop: 6,
                  background: '#ffffff', borderRadius: 12, border: '1px solid #e2e8f0',
                  boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)', zIndex: 100, overflow: 'hidden', padding: 6
                }}>
                  {aptTypeOptions.map((opt) => (
                    <div
                      key={opt.label}
                      onClick={() => {
                        setAptType(opt.label);
                        setIsTypeDropdownOpen(false);
                      }}
                      style={{
                        padding: '10px 12px', borderRadius: 8, cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.88rem',
                        fontWeight: aptType === opt.label ? 700 : 500,
                        color: '#334155', background: aptType === opt.label ? '#e0f2fe' : 'transparent',
                        marginBottom: 2
                      }}
                      onMouseEnter={(e) => { if (aptType !== opt.label) e.currentTarget.style.background = '#f8fafc'; }}
                      onMouseLeave={(e) => { if (aptType !== opt.label) e.currentTarget.style.background = 'transparent'; }}
                    >
                      <span style={{ width: 10, height: 10, borderRadius: '50%', background: opt.color }} />
                      <span>{opt.label}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

          {/* Notlar */}
          <div>
            <label style={{ display: 'block', fontSize: '0.86rem', fontWeight: 600, color: '#334155', marginBottom: 6 }}>
              Notlar
            </label>
            <textarea
              className="form-textarea"
              placeholder="Randevu ile ilgili notlar..."
              maxLength={500}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              style={{
                width: '100%', minHeight: 70, borderRadius: 10, border: '1px solid #cbd5e1',
                padding: 12, fontSize: '0.88rem', outline: 'none', resize: 'vertical'
              }}
            />
            <div style={{ textAlign: 'right', fontSize: '0.74rem', color: '#94a3b8', marginTop: 4 }}>
              {notes.length} / 500
            </div>
          </div>

          {/* Divider 1: Takip Planı */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '6px 0 14px' }}>
              <div style={{ flex: 1, height: 1, background: '#e2e8f0' }} />
              <span style={{ fontSize: '0.84rem', fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 6 }}>
                <span>📅</span> Takip Planı
              </span>
              <div style={{ flex: 1, height: 1, background: '#e2e8f0' }} />
            </div>

            <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={createFollowupPlan}
                onChange={(e) => setCreateFollowupPlan(e.target.checked)}
                style={{ width: 18, height: 18, marginTop: 2, accentColor: '#2563eb' }}
              />
              <div>
                <div style={{ fontSize: '0.88rem', fontWeight: 600, color: '#1e293b' }}>Takip planı oluştur</div>
                <div style={{ fontSize: '0.78rem', color: '#64748b' }}>Randevu tarihinden itibaren periyodik kontrol hatırlatmaları oluşturulur</div>
              </div>
            </label>

            {createFollowupPlan && (() => {
              const formatFollowupDate = (addDays: number, addMonths: number, addYears: number) => {
                const d = new Date(selectedDate);
                if (addDays) d.setDate(d.getDate() + addDays);
                if (addMonths) d.setMonth(d.getMonth() + addMonths);
                if (addYears) d.setFullYear(d.getFullYear() + addYears);

                const dayStr = d.getDate().toString().padStart(2, '0');
                const monthStr = (d.getMonth() + 1).toString().padStart(2, '0');
                const yearStr = d.getFullYear();
                const dayNames = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
                const dayName = dayNames[d.getDay()];

                return `${dayStr}.${monthStr}.${yearStr} ${dayName}`;
              };

              const periodsConfig = [
                { key: '1 Hafta Kontrol', label: '1 Hafta Kontrol', dateText: formatFollowupDate(7, 0, 0) },
                { key: '1 Ay Kontrol', label: '1 Ay Kontrol', dateText: formatFollowupDate(0, 1, 0) },
                { key: '3 Ay Kontrol', label: '3 Ay Kontrol', dateText: formatFollowupDate(0, 3, 0) },
                { key: '6 Ay Kontrol', label: '6 Ay Kontrol', dateText: formatFollowupDate(0, 6, 0) },
                { key: '1 Yıl Kontrol', label: '1 Yıl Kontrol', dateText: formatFollowupDate(0, 0, 1) },
              ];

              return (
                <div style={{
                  background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12,
                  padding: 16, marginTop: 12, display: 'flex', flexDirection: 'column', gap: 14
                }}>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#1e293b' }}>
                    Kontrol Dönemleri
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {periodsConfig.map((item) => {
                      const isChecked = selectedPeriods.includes(item.key);
                      return (
                        <label key={item.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedPeriods([...selectedPeriods, item.key]);
                                } else {
                                  setSelectedPeriods(selectedPeriods.filter(p => p !== item.key));
                                }
                              }}
                              style={{ width: 17, height: 17, accentColor: '#2563eb' }}
                            />
                            <span style={{ fontSize: '0.88rem', fontWeight: 600, color: '#334155' }}>
                              {item.label}
                            </span>
                          </div>
                          <span style={{ fontSize: '0.82rem', color: '#94a3b8', fontWeight: 500 }}>
                            {item.dateText}
                          </span>
                        </label>
                      );
                    })}
                  </div>

                  {/* Takip Notu (opsiyonel) */}
                  <div style={{ marginTop: 4 }}>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: '#64748b', fontWeight: 500, marginBottom: 4 }}>
                      Takip Notu (opsiyonel)
                    </label>
                    <textarea
                      className="form-textarea"
                      placeholder="Takip planı için not..."
                      maxLength={500}
                      value={followupNote}
                      onChange={(e) => setFollowupNote(e.target.value)}
                      style={{
                        width: '100%', minHeight: 60, borderRadius: 8, border: '1px solid #cbd5e1',
                        padding: 10, fontSize: '0.86rem', outline: 'none', resize: 'vertical', background: '#ffffff'
                      }}
                    />
                    <div style={{ textAlign: 'right', fontSize: '0.74rem', color: '#94a3b8', marginTop: 2 }}>
                      {followupNote.length} / 500
                    </div>
                  </div>

                  {/* Info Banner */}
                  <div style={{
                    background: '#e0f2fe', borderRadius: 8, padding: '10px 14px',
                    display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.78rem', color: '#0369a1', lineHeight: 1.4
                  }}>
                    <span style={{ fontSize: '0.9rem' }}>🗓️</span>
                    <span>Seçilen dönemlerde personele hatırlatma bildirimi gönderilir. Aynı gün randevu hatırlatması varsa çift mesaj gitmez.</span>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Divider 2: WhatsApp Hatırlatma */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '6px 0 14px' }}>
              <div style={{ flex: 1, height: 1, background: '#e2e8f0' }} />
              <span style={{ fontSize: '0.84rem', fontWeight: 700, color: '#16a34a', display: 'flex', alignItems: 'center', gap: 6 }}>
                <span>💬</span> WhatsApp Hatırlatma
              </span>
              <div style={{ flex: 1, height: 1, background: '#e2e8f0' }} />
            </div>

            {/* Toggle switch */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <span style={{ fontSize: '0.88rem', fontWeight: 600, color: '#334155' }}>Hatırlatma Gönder</span>
              <div
                onClick={() => setSendWhatsappReminder(!sendWhatsappReminder)}
                style={{
                  width: 44, height: 24, borderRadius: 12,
                  background: sendWhatsappReminder ? '#2563eb' : '#cbd5e1',
                  position: 'relative', cursor: 'pointer', transition: 'all 0.2s'
                }}
              >
                <div style={{
                  width: 20, height: 20, borderRadius: '50%', background: '#ffffff',
                  position: 'absolute', top: 2, left: sendWhatsappReminder ? 22 : 2,
                  transition: 'all 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
                }} />
              </div>
            </div>

            {sendWhatsappReminder && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {/* Hızlı Ekle */}
                <div>
                  <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b', marginBottom: 6 }}>Hızlı Ekle:</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {['15 dakika önce', '30 dakika önce', '1 saat önce', '2 saat önce', '1 gün önce'].map((chip) => (
                      <button
                        key={chip}
                        type="button"
                        onClick={() => handleQuickAddReminder(chip)}
                        style={{
                          padding: '5px 10px', borderRadius: 6, border: '1px solid #cbd5e1',
                          background: reminders.includes(chip) ? '#e0f2fe' : '#ffffff',
                          borderColor: reminders.includes(chip) ? '#38bdf8' : '#cbd5e1',
                          color: reminders.includes(chip) ? '#0284c7' : '#475569',
                          fontSize: '0.8rem', fontWeight: 500, cursor: 'pointer'
                        }}
                      >
                        {chip}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Özel Zaman Ekle */}
                <div>
                  <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b', marginBottom: 6 }}>Özel Zaman Ekle:</div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <input
                      type="number"
                      value={customVal}
                      onChange={(e) => setCustomVal(Number(e.target.value))}
                      style={{ width: 65, padding: '6px 10px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: '0.88rem' }}
                    />
                    <select
                      value={customUnit}
                      onChange={(e) => setCustomUnit(e.target.value as any)}
                      style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: '0.88rem', background: '#fff' }}
                    >
                      <option value="Dakika">Dakika</option>
                      <option value="Saat">Saat</option>
                      <option value="Gün">Gün</option>
                    </select>
                    <button
                      type="button"
                      onClick={handleAddCustomReminder}
                      style={{
                        padding: '6px 14px', borderRadius: 8, border: '1px solid #cbd5e1',
                        background: '#ffffff', color: '#0f172a', fontWeight: 600, fontSize: '0.84rem', cursor: 'pointer'
                      }}
                    >
                      + Ekle
                    </button>
                  </div>
                </div>

                {/* Seçili Hatırlatmalar Box */}
                <div style={{ background: '#f8fafc', border: '1px solid #f1f5f9', borderRadius: 10, padding: 14 }}>
                  <div style={{ fontSize: '0.84rem', fontWeight: 700, color: '#0f172a', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span>🕒</span> Seçili Hatırlatmalar ({reminders.length})
                  </div>
                  {reminders.length === 0 ? (
                    <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Henüz hatırlatma eklenmedi.</div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {reminders.map((rem, idx) => (
                        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#ffffff', padding: '8px 12px', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                          <span style={{ fontSize: '0.84rem', fontWeight: 500, color: '#334155', display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span>🔔</span> {rem}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveReminder(idx)}
                            style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: 2, display: 'flex', alignItems: 'center' }}
                            title="Sil"
                          >
                            🗑️
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Sky blue info banner */}
                <div style={{ background: '#e0f2fe', borderRadius: 8, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.8rem', color: '#0369a1' }}>
                  <span style={{ fontSize: '1rem' }}>💬</span>
                  <span>Hatırlatmalar seçilen zamanlarda WhatsApp üzerinden hastanın telefonuna gönderilecektir.</span>
                </div>
              </div>
            )}
          </div>

          {/* Divider 3: Randevu Mesajı */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '6px 0 14px' }}>
              <div style={{ flex: 1, height: 1, background: '#e2e8f0' }} />
              <span style={{ fontSize: '0.84rem', fontWeight: 700, color: '#10b981', display: 'flex', alignItems: 'center', gap: 6 }}>
                <span>✈️</span> Randevu Mesajı
              </span>
              <div style={{ flex: 1, height: 1, background: '#e2e8f0' }} />
            </div>

            {/* Warning banner */}
            <div style={{ background: '#fffbe6', border: '1px solid #ffe58f', borderRadius: 10, padding: 14, marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#d97706', fontWeight: 700, fontSize: '0.86rem', marginBottom: 6 }}>
                <span>⚠️</span> WhatsApp bağlı değil — bilgilendirme mesajı gönderilmeyecek
              </div>
              <div style={{ fontSize: '0.8rem', color: '#78350f', lineHeight: 1.4 }}>
                Bu şubede WhatsApp entegrasyonu kapalı. Randevu normal şekilde kaydedilir, ancak hastaya otomatik mesaj gitmez. Mesaj göndermek için Uyarlamalar &gt; WhatsApp bölümünden bağlantı kurun.
              </div>
            </div>

            {/* Toggle switch */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.88rem', fontWeight: 600, color: '#334155' }}>Oluştururken WhatsApp Mesajı Gönder</span>
              <div
                onClick={() => setSendWhatsappOnCreate(!sendWhatsappOnCreate)}
                style={{
                  width: 44, height: 24, borderRadius: 12,
                  background: sendWhatsappOnCreate ? '#2563eb' : '#cbd5e1',
                  position: 'relative', cursor: 'pointer', transition: 'all 0.2s'
                }}
              >
                <div style={{
                  width: 20, height: 20, borderRadius: '50%', background: '#ffffff',
                  position: 'absolute', top: 2, left: sendWhatsappOnCreate ? 22 : 2,
                  transition: 'all 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
                }} />
              </div>
            </div>
          </div>

          {/* Modal Footer Buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, borderTop: '1px solid #f1f5f9', paddingTop: 18, marginTop: 10 }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '9px 18px', borderRadius: 8, border: '1px solid #cbd5e1',
                background: '#ffffff', color: '#475569', fontSize: '0.88rem', fontWeight: 600, cursor: 'pointer'
              }}
            >
              Vazgeç
            </button>
            <button
              type="submit"
              style={{
                padding: '9px 20px', borderRadius: 8, border: 'none',
                background: '#2563eb', color: '#ffffff', fontSize: '0.88rem', fontWeight: 600,
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)'
              }}
            >
              <span>📅</span> Randevu Oluştur
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
