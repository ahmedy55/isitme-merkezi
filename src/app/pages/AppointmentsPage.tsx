'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { useBranch } from '../context/BranchContext';
import { BranchService } from '../services/BranchService';
import { getAvatarColor, getInitials } from '../data/mockData';
import { IconPlus, IconCalendar, IconCheck, IconClose, IconSearch, IconPhone, IconMail } from '../components/Icons';
import styles from './AppointmentsPage.module.css';

/* ── Inline SVG Icons ── */
function IconDotsVertical({ size = 15 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="5" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="12" cy="19" r="1"/></svg>;
}
function IconPhoneCall({ size = 15 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M15.05 5A5 5 0 0 1 19 8.95M15.05 1A9 9 0 0 1 23 8.94m-1 7.98v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92Z"/></svg>;
}
function IconFileText({ size = 15 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" x2="8" y1="13" y2="13"/><line x1="16" x2="8" y1="17" y2="17"/><line x1="10" x2="8" y1="9" y2="9"/></svg>;
}
function IconChevronDown({ size = 14 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>;
}
function IconChevronLeft({ size = 14 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>;
}
function IconChevronRight({ size = 14 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>;
}
function IconTrendUp({ size = 12 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>;
}
function IconTrendDown({ size = 12 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/><polyline points="17 18 23 18 23 12"/></svg>;
}
function IconFilter({ size = 15 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>;
}
function IconCalendarCard({ size = 20 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>;
}
function IconClockCard({ size = 20 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>;
}
function IconCheckCard({ size = 20 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>;
}
function IconCrossCard({ size = 20 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;
}

const audiologists = ['Dr. Elif Arslan', 'Dr. Can Yılmaz'];
const DAYS = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cts', 'Paz'];

// Default Showcase Schedule items for the screenshot design
interface ShowcaseSlot {
  id: string;
  hour: string;
  timeRange: string;
  isBreak?: boolean;
  patientName?: string;
  patientInitials?: string;
  avatarColor?: string;
  type?: string;
  duration?: string;
  phone?: string;
  device?: string;
  status?: 'Geldi' | 'Bekliyor' | 'Tamamlandı' | 'Randevu Onayı' | 'İptal';
}

const defaultShowcaseSlots: ShowcaseSlot[] = [
  {
    id: 's1',
    hour: '09:00',
    timeRange: '09:00-09:30',
    patientName: 'Ayşe Yılmaz',
    patientInitials: 'AY',
    avatarColor: '#8b5cf6',
    type: 'Kontrol',
    duration: '30 dk',
    phone: '+90 532 123 45 67',
    device: 'Oticon More 1',
    status: 'Geldi',
  },
  {
    id: 's2',
    hour: '10:00',
    timeRange: '09:30-10:15',
    patientName: 'Mehmet Demir',
    patientInitials: 'MD',
    avatarColor: '#3b82f6',
    type: 'Cihaz Teslimi',
    duration: '45 dk',
    phone: '+90 545 987 65 43',
    device: 'Phonak Audeo L',
    status: 'Bekliyor',
  },
  {
    id: 's3',
    hour: '11:00',
    timeRange: '10:30-11:00',
    patientName: 'Fatma Kaya',
    patientInitials: 'FK',
    avatarColor: '#ec4899',
    type: 'İlk Muayene',
    duration: '30 dk',
    phone: '+90 533 444 22 11',
    device: '—',
    status: 'Bekliyor',
  },
  {
    id: 's4',
    hour: '12:00',
    timeRange: '11:00-11:30',
    patientName: 'Ali Çetin',
    patientInitials: 'AÇ',
    avatarColor: '#f59e0b',
    type: 'Cihaz Ayarı',
    duration: '30 dk',
    phone: '+90 505 333 21 09',
    device: 'Signia Pure 312',
    status: 'Tamamlandı',
  },
  {
    id: 'break',
    hour: '13:00',
    timeRange: '12:00-13:00',
    isBreak: true,
  },
  {
    id: 's5',
    hour: '14:00',
    timeRange: '13:00-13:30',
    patientName: 'Zeynep Arslan',
    patientInitials: 'ZA',
    avatarColor: '#ef4444',
    type: 'Kontrol',
    duration: '30 dk',
    phone: '+90 542 222 11 00',
    device: '—',
    status: 'Bekliyor',
  },
  {
    id: 's6',
    hour: '15:00',
    timeRange: '14:00-14:45',
    patientName: 'Hasan Yıldız',
    patientInitials: 'HY',
    avatarColor: '#6366f1',
    type: 'Pil Değişimi',
    duration: '45 dk',
    phone: '+90 530 777 88 99',
    device: 'Widex Moment',
    status: 'Bekliyor',
  },
  {
    id: 's7',
    hour: '16:00',
    timeRange: '15:00-15:30',
    patientName: 'Emine Doğan',
    patientInitials: 'ED',
    avatarColor: '#10b981',
    type: 'Kontrol',
    duration: '30 dk',
    phone: '+90 536 999 00 11',
    device: 'Resound Nexia',
    status: 'Randevu Onayı',
  },
  {
    id: 's8',
    hour: '17:00',
    timeRange: '16:00-16:30',
    patientName: 'Mustafa Acar',
    patientInitials: 'MA',
    avatarColor: '#8b5cf6',
    type: 'Teknik Servis',
    duration: '30 dk',
    phone: '+90 533 123 67 89',
    device: 'Starkey Evolv AI',
    status: 'İptal',
  },
];

export default function AppointmentsPage() {
  const { appointmentsList: rawAppointmentsList, patientsList, branchesList, addAppointment, updateAppointmentStatus, addToast } = useApp();
  const { activeBranch } = useBranch();

  const appointmentsList = useMemo(() => {
    return rawAppointmentsList.filter(a => BranchService.matchesBranch(a.branch, a.branchId, activeBranch));
  }, [rawAppointmentsList, activeBranch]);

  // View mode: 'takvim' (schedule + widgets), 'liste' (table), 'gun', 'hafta', 'ay'
  const [viewMode, setViewMode] = useState<'takvim' | 'liste' | 'gun' | 'hafta' | 'ay'>('takvim');

  // Selected date state (defaults to 12 Eylül 2025 as in mockup, or dynamic)
  const [currentDate, setCurrentDate] = useState<Date>(() => new Date(2025, 8, 12));
  const [calendarViewMonth, setCalendarViewMonth] = useState<number>(8); // September (0-indexed = 8)
  const [calendarViewYear, setCalendarViewYear] = useState<number>(2025);

  // Filters
  const [filterAudiologist, setFilterAudiologist] = useState('Tümü');
  const [filterBranch, setFilterBranch] = useState('All');
  const [filterTimeRange, setFilterTimeRange] = useState('Tüm Gün');
  const [dateInputVal, setDateInputVal] = useState('2025-09-12');
  const [statusFilter, setStatusFilter] = useState<'all' | 'bekleyen' | 'tamamlanan' | 'iptal'>('all');

  // Modals and action dropdown
  const [showAddModal, setShowAddModal] = useState(false);
  const [activeSlotMenu, setActiveSlotMenu] = useState<{ id: string; top: number; right: number; patientName: string; phone?: string } | null>(null);
  const slotMenuRef = useRef<HTMLDivElement>(null);

  // Close slot action menu on outside click or scroll
  useEffect(() => {
    if (!activeSlotMenu) return;
    function handleDocClick(e: MouseEvent) {
      if (slotMenuRef.current && !slotMenuRef.current.contains(e.target as Node)) {
        setActiveSlotMenu(null);
      }
    }
    function handleScroll() {
      setActiveSlotMenu(null);
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setActiveSlotMenu(null);
    }
    document.addEventListener('mousedown', handleDocClick);
    window.addEventListener('scroll', handleScroll, true);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleDocClick);
      window.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [activeSlotMenu]);

  // Navigation handlers
  const handlePrevDay = () => {
    setCurrentDate(prev => {
      const next = new Date(prev);
      next.setDate(next.getDate() - 1);
      return next;
    });
  };
  const handleNextDay = () => {
    setCurrentDate(prev => {
      const next = new Date(prev);
      next.setDate(next.getDate() + 1);
      return next;
    });
  };
  const handleToday = () => {
    setCurrentDate(new Date(2025, 8, 12));
    setCalendarViewMonth(8);
    setCalendarViewYear(2025);
  };

  // Format date display (e.g. "12 Eylül 2025, Cuma")
  const formattedDayTitle = useMemo(() => {
    const monthNamesTr = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
    const dayNamesTr = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
    const d = currentDate.getDate();
    const m = monthNamesTr[currentDate.getMonth()];
    const y = currentDate.getFullYear();
    const w = dayNamesTr[currentDate.getDay()];
    return `${d} ${m} ${y}, ${w}`;
  }, [currentDate]);

  // Format mini calendar month title
  const miniCalendarMonthTitle = useMemo(() => {
    const monthNamesTr = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
    return `${monthNamesTr[calendarViewMonth]} ${calendarViewYear}`;
  }, [calendarViewMonth, calendarViewYear]);

  // Mini calendar cells
  const miniCalendarDays = useMemo(() => {
    const firstDay = new Date(calendarViewYear, calendarViewMonth, 1);
    const startDayOfWeek = (firstDay.getDay() + 6) % 7; // Monday = 0
    const daysInMonth = new Date(calendarViewYear, calendarViewMonth + 1, 0).getDate();
    const prevMonthDays = new Date(calendarViewYear, calendarViewMonth, 0).getDate();

    const cells: { dayNum: number; isCurrentMonth: boolean; fullDateStr: string }[] = [];
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      cells.push({ dayNum: prevMonthDays - i, isCurrentMonth: false, fullDateStr: '' });
    }
    for (let i = 1; i <= daysInMonth; i++) {
      const mm = (calendarViewMonth + 1).toString().padStart(2, '0');
      const dd = i.toString().padStart(2, '0');
      cells.push({ dayNum: i, isCurrentMonth: true, fullDateStr: `${calendarViewYear}-${mm}-${dd}` });
    }
    const remaining = (cells.length <= 35 ? 35 : 42) - cells.length;
    for (let i = 1; i <= remaining; i++) {
      cells.push({ dayNum: i, isCurrentMonth: false, fullDateStr: '' });
    }
    return cells;
  }, [calendarViewMonth, calendarViewYear]);

  // Combine showcase slots with live appointments for selected date
  const selectedDateStr = useMemo(() => {
    const y = currentDate.getFullYear();
    const m = (currentDate.getMonth() + 1).toString().padStart(2, '0');
    const d = currentDate.getDate().toString().padStart(2, '0');
    return `${y}-${m}-${d}`;
  }, [currentDate]);

  const timelineSlots = useMemo<ShowcaseSlot[]>(() => {
    // If date is 2025-09-12 (the showcase date from screenshot), use default slots
    // plus any dynamically added live appointments
    const liveForDay = appointmentsList.filter(a => a.date === selectedDateStr);
    
    if (selectedDateStr === '2025-09-12') {
      if (liveForDay.length === 0) return defaultShowcaseSlots;
      // Merge live appointments
      const extraSlots: ShowcaseSlot[] = liveForDay.map(apt => {
        const patient = patientsList.find(p => p.id === apt.patientId || `${p.firstName} ${p.lastName}` === apt.patientName);
        return {
          id: apt.id,
          hour: apt.time?.split(':')[0] ? `${apt.time.split(':')[0]}:00` : '09:00',
          timeRange: `${apt.time || '10:00'}-${(parseInt(apt.time?.split(':')[1] || '0') + 30).toString().padStart(2, '0')}`,
          patientName: apt.patientName,
          patientInitials: getInitials(apt.patientName, ''),
          avatarColor: getAvatarColor(apt.patientName),
          type: apt.type,
          duration: '30 dk',
          phone: patient?.phone || '+90 532 000 00 00',
          device: patient?.currentDevice || '—',
          status: (apt.status === 'Hatırlatıldı' ? 'Randevu Onayı' : apt.status) as any,
        };
      });
      return [...defaultShowcaseSlots, ...extraSlots];
    }

    // For any other date, show live appointments or fallback
    if (liveForDay.length > 0) {
      return liveForDay.map((apt): ShowcaseSlot => {
        const patient = patientsList.find(p => p.id === apt.patientId || `${p.firstName} ${p.lastName}` === apt.patientName);
        return {
          id: apt.id,
          hour: apt.time?.split(':')[0] ? `${apt.time.split(':')[0]}:00` : '10:00',
          timeRange: `${apt.time || '10:00'}`,
          patientName: apt.patientName,
          patientInitials: getInitials(apt.patientName, ''),
          avatarColor: getAvatarColor(apt.patientName),
          type: apt.type,
          duration: '30 dk',
          phone: patient?.phone || '+90 532 000 00 00',
          device: patient?.currentDevice || '—',
          status: (apt.status === 'Hatırlatıldı' ? 'Randevu Onayı' : apt.status) as any,
        };
      });
    }

    return defaultShowcaseSlots;
  }, [selectedDateStr, appointmentsList, patientsList]);

  // Open slot action dropdown
  const handleOpenSlotMenu = (e: React.MouseEvent, slot: ShowcaseSlot) => {
    e.stopPropagation();
    if (activeSlotMenu?.id === slot.id) {
      setActiveSlotMenu(null);
      return;
    }
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setActiveSlotMenu({
      id: slot.id,
      patientName: slot.patientName || '',
      phone: slot.phone,
      top: rect.bottom + 6,
      right: Math.max(12, window.innerWidth - rect.right),
    });
  };

  return (
    <div className={`page ${styles.appointmentsPage}`}>
      {/* ── Page Header ── */}
      <div className={styles.pageHeading}>
        <div className={styles.headingCopy}>
          <div className={styles.headingIcon}>
            <IconCalendar size={28} />
          </div>
          <div>
            <div className={styles.breadcrumb}>
              Randevular <span>&gt;</span> Randevu Takvimi
            </div>
            <h1>Randevu Yönetimi</h1>
            <p>Tüm randevularınızı görüntüleyin, planlayın ve yönetin.</p>
          </div>
        </div>

        <div className={styles.headerActions}>
          <button
            type="button"
            className={styles.actionButton}
            onClick={() => addToast({ type: 'info', message: 'Geçmiş randevu aktarım penceresi açılıyor.' })}
          >
            <IconCalendarCard size={15} /> Geçmiş Aktar
          </button>
          <button
            type="button"
            className={styles.actionButton}
            onClick={() => addToast({ type: 'info', message: 'Toplu randevu ekleme penceresi açılıyor.' })}
          >
            <IconFileText size={15} /> Toplu Ekle
          </button>
          {/* Critical: New Appointment button triggering NewAppointmentModal */}
          <button
            type="button"
            className={`${styles.actionButton} ${styles.btnAddAppointment}`}
            onClick={() => setShowAddModal(true)}
            id="btn-new-appointment"
          >
            <IconPlus size={15} strokeWidth={2.5} /> Yeni Randevu <IconChevronDown size={13} />
          </button>
        </div>
      </div>

      {/* ── 5 Stat Metric Cards ── */}
      <div className={styles.statsGrid}>
        {/* 1. Bugünkü Randevular */}
        <div
          className={`${styles.statCard} ${statusFilter === 'all' ? styles.statCardActive : ''}`}
          onClick={() => setStatusFilter('all')}
        >
          <div className={`${styles.statIcon} ${styles.iconGreen}`}>
            <IconCalendarCard size={22} />
          </div>
          <div>
            <span>Bugünkü Randevular</span>
            <strong>12</strong>
            <small><span style={{ color: '#0b8463', fontWeight: 600 }}>3</span> tamamlandı • <span style={{ color: '#d97706', fontWeight: 600 }}>7</span> bekliyor</small>
          </div>
        </div>

        {/* 2. Bu Hafta */}
        <div className={styles.statCard} onClick={() => setViewMode('hafta')}>
          <div className={`${styles.statIcon} ${styles.iconBlue}`}>
            <IconCalendarCard size={22} />
          </div>
          <div>
            <span>Bu Hafta</span>
            <strong>48</strong>
            <div className={styles.statChangeUp}>
              <IconTrendUp size={11} /> %12 artış
            </div>
          </div>
        </div>

        {/* 3. Bekleyen */}
        <div
          className={`${styles.statCard} ${statusFilter === 'bekleyen' ? styles.statCardActive : ''}`}
          onClick={() => setStatusFilter('bekleyen')}
        >
          <div className={`${styles.statIcon} ${styles.iconOrange}`}>
            <IconClockCard size={22} />
          </div>
          <div>
            <span>Bekleyen</span>
            <strong>7</strong>
            <small style={{ color: '#d97706', fontWeight: 600 }}>● onay bekliyor</small>
          </div>
        </div>

        {/* 4. Tamamlanan */}
        <div
          className={`${styles.statCard} ${statusFilter === 'tamamlanan' ? styles.statCardActive : ''}`}
          onClick={() => setStatusFilter('tamamlanan')}
        >
          <div className={`${styles.statIcon} ${styles.iconEmerald}`}>
            <IconCheckCard size={22} />
          </div>
          <div>
            <span>Tamamlanan</span>
            <strong>38</strong>
            <div className={styles.statChangeUp}>
              <IconTrendUp size={11} /> %18 artış
            </div>
          </div>
        </div>

        {/* 5. İptal / Gelmedi */}
        <div
          className={`${styles.statCard} ${statusFilter === 'iptal' ? styles.statCardActive : ''}`}
          onClick={() => setStatusFilter('iptal')}
        >
          <div className={`${styles.statIcon} ${styles.iconRed}`}>
            <IconCrossCard size={22} />
          </div>
          <div>
            <span>İptal / Gelmedi</span>
            <strong>3</strong>
            <div className={styles.statChangeDown}>
              <IconTrendDown size={11} /> %25 azalış
            </div>
          </div>
        </div>
      </div>

      {/* ── Filter and View Mode Bar ── */}
      <div className={styles.filterCard}>
        <div className={styles.filterBarInner}>
          {/* Segmented View Mode Tabs */}
          <div className={styles.viewModePills}>
            <button
              type="button"
              className={`${styles.viewModeBtn} ${viewMode === 'takvim' ? styles.viewModeBtnActive : ''}`}
              onClick={() => setViewMode('takvim')}
            >
              Takvim
            </button>
            <button
              type="button"
              className={`${styles.viewModeBtn} ${viewMode === 'liste' ? styles.viewModeBtnActive : ''}`}
              onClick={() => setViewMode('liste')}
            >
              Liste
            </button>
            <button
              type="button"
              className={`${styles.viewModeBtn} ${viewMode === 'gun' ? styles.viewModeBtnActive : ''}`}
              onClick={() => setViewMode('gun')}
            >
              Gün
            </button>
            <button
              type="button"
              className={`${styles.viewModeBtn} ${viewMode === 'hafta' ? styles.viewModeBtnActive : ''}`}
              onClick={() => setViewMode('hafta')}
            >
              Hafta
            </button>
            <button
              type="button"
              className={`${styles.viewModeBtn} ${viewMode === 'ay' ? styles.viewModeBtnActive : ''}`}
              onClick={() => setViewMode('ay')}
            >
              Ay
            </button>
          </div>

          {/* Right Selects and Date Picker */}
          <div className={styles.filterControls}>
            <select
              className={styles.filterSelect}
              value={filterAudiologist}
              onChange={(e) => setFilterAudiologist(e.target.value)}
              aria-label="Doktor Seçimi"
            >
              <option value="Tümü">Tüm Doktorlar</option>
              {audiologists.map(doc => <option key={doc} value={doc}>{doc}</option>)}
            </select>

            <select
              className={styles.filterSelect}
              value={filterBranch}
              onChange={(e) => setFilterBranch(e.target.value)}
              aria-label="Şube Seçimi"
            >
              <option value="All">Tüm Şubeler</option>
              {branchesList.filter(b => b.status === 'Aktif').map(branch => (
                <option key={branch.id} value={branch.id}>{branch.name}</option>
              ))}
            </select>

            <input
              type="date"
              className={styles.filterDateInput}
              value={dateInputVal}
              onChange={(e) => {
                const val = e.target.value;
                setDateInputVal(val);
                if (val) {
                  const parts = val.split('-').map(Number);
                  if (parts[0] && parts[1]) {
                    setCurrentDate(new Date(parts[0], parts[1] - 1, parts[2] || 1));
                    setCalendarViewMonth(parts[1] - 1);
                    setCalendarViewYear(parts[0]);
                  }
                }
              }}
              aria-label="Randevu Tarihi"
            />

            <button
              type="button"
              className={styles.btnFilterApply}
              onClick={() => addToast({ type: 'info', message: 'Filtreler uygulandı.' })}
            >
              <IconFilter size={14} /> Filtrele
            </button>
          </div>
        </div>
      </div>

      {/* ── Main Workspace: 2 Column Layout ── */}
      {viewMode !== 'liste' && viewMode !== 'ay' ? (
        <div className={styles.workspaceLayout}>
          {/* Left Column: Timeline Schedule */}
          <div className={styles.timelineCard}>
            <div className={styles.timelineHeader}>
              <div className={styles.timelineNav}>
                <button type="button" className={styles.timelineNavBtn} onClick={handlePrevDay} title="Önceki Gün">
                  <IconChevronLeft size={16} />
                </button>
                <button type="button" className={styles.timelineNavBtn} onClick={handleNextDay} title="Sonraki Gün">
                  <IconChevronRight size={16} />
                </button>
                <span className={styles.timelineDateLabel}>{formattedDayTitle}</span>
                <button type="button" className={styles.btnToday} onClick={handleToday}>
                  Bugün
                </button>
              </div>

              <select
                className={styles.timelineDayFilter}
                value={filterTimeRange}
                onChange={(e) => setFilterTimeRange(e.target.value)}
              >
                <option value="Tüm Gün">Tüm Gün</option>
                <option value="Sabah">Sabah (09:00 - 13:00)</option>
                <option value="Öğleden Sonra">Öğleden Sonra (13:00 - 18:00)</option>
              </select>
            </div>

            {/* Hourly Slot Rows */}
            <div className={styles.slotList}>
              {timelineSlots.map((slot) => {
                if (slot.isBreak) {
                  return (
                    <div key={slot.id} className={styles.slotRow}>
                      <div className={styles.slotHourLabel}>{slot.hour}</div>
                      <div className={styles.breakSlotCard}>
                        <span className={styles.breakTimeRange}>{slot.timeRange}</span>
                        <span>🍽️ Öğle Arası</span>
                      </div>
                    </div>
                  );
                }

                const statusPillClass = slot.status === 'Geldi' ? styles.statusGeldi
                  : slot.status === 'Bekliyor' ? styles.statusBekliyor
                  : slot.status === 'Tamamlandı' ? styles.statusTamamlandi
                  : slot.status === 'Randevu Onayı' ? styles.statusOnay
                  : styles.statusIptal;

                return (
                  <div key={slot.id} className={styles.slotRow}>
                    <div className={styles.slotHourLabel}>{slot.hour}</div>
                    <div className={styles.slotItemCard}>
                      <div className={styles.slotItemLeft}>
                        <span className={styles.slotTimeRange}>{slot.timeRange}</span>
                        <div className={styles.slotAvatar} style={{ background: slot.avatarColor || '#3b82f6' }}>
                          {slot.patientInitials}
                        </div>
                        <span className={styles.slotPatientName}>{slot.patientName}</span>
                        <span className={styles.slotTypeBadge}>{slot.type}</span>
                        <span className={styles.slotDuration}>{slot.duration}</span>
                        <span className={styles.slotPhone}>{slot.phone}</span>
                        <span className={styles.slotDevice}>{slot.device}</span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <span className={`${styles.slotStatusPill} ${statusPillClass}`}>
                          {slot.status}
                        </span>

                        <div className={styles.slotActions}>
                          <button
                            type="button"
                            className={styles.slotActionBtn}
                            title="Dosya / Detay"
                            onClick={() => addToast({ type: 'info', message: `${slot.patientName} randevu detayları açılıyor.` })}
                          >
                            <IconFileText size={14} />
                          </button>
                          <button
                            type="button"
                            className={styles.slotActionBtn}
                            title="Ara / İletişim"
                            onClick={() => {
                              if (slot.phone) window.open(`tel:${slot.phone}`);
                              else addToast({ type: 'warning', message: 'Telefon numarası bulunamadı.' });
                            }}
                          >
                            <IconPhoneCall size={14} />
                          </button>
                          <button
                            type="button"
                            className={styles.slotActionBtn}
                            title="İşlemler"
                            onClick={(e) => handleOpenSlotMenu(e, slot)}
                          >
                            <IconDotsVertical size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Widgets */}
          <div className={styles.sideWidgets}>
            {/* Widget 1: Mini Calendar */}
            <div className={styles.miniCalendarCard}>
              <div className={styles.miniCalendarHeader}>
                <strong>{miniCalendarMonthTitle}</strong>
                <div className={styles.miniCalendarNav}>
                  <button
                    type="button"
                    className={styles.miniCalendarNavBtn}
                    onClick={() => {
                      if (calendarViewMonth === 0) {
                        setCalendarViewMonth(11);
                        setCalendarViewYear(y => y - 1);
                      } else {
                        setCalendarViewMonth(m => m - 1);
                      }
                    }}
                    title="Önceki Ay"
                  >
                    <IconChevronLeft size={13} />
                  </button>
                  <button
                    type="button"
                    className={styles.miniCalendarNavBtn}
                    onClick={() => {
                      if (calendarViewMonth === 11) {
                        setCalendarViewMonth(0);
                        setCalendarViewYear(y => y + 1);
                      } else {
                        setCalendarViewMonth(m => m + 1);
                      }
                    }}
                    title="Sonraki Ay"
                  >
                    <IconChevronRight size={13} />
                  </button>
                </div>
              </div>

              {/* Day Names */}
              <div className={styles.miniCalendarDaysRow}>
                {DAYS.map(d => <span key={d}>{d}</span>)}
              </div>

              {/* Calendar Grid */}
              <div className={styles.miniCalendarGrid}>
                {miniCalendarDays.map((c, idx) => {
                  const isSelected = c.isCurrentMonth && c.dayNum === currentDate.getDate() && calendarViewMonth === currentDate.getMonth() && calendarViewYear === currentDate.getFullYear();
                  const hasDot = c.isCurrentMonth && [3, 8, 10, 12, 18, 24, 26].includes(c.dayNum);
                  const dotColor = c.dayNum === 12 ? '#10b981' : c.dayNum === 3 || c.dayNum === 18 ? '#f59e0b' : c.dayNum === 8 ? '#f97316' : '#ef4444';

                  return (
                    <div
                      key={idx}
                      className={`${styles.miniDayCell} ${!c.isCurrentMonth ? styles.miniDayOtherMonth : ''} ${isSelected ? styles.miniDaySelected : ''}`}
                      onClick={() => {
                        if (c.isCurrentMonth) {
                          setCurrentDate(new Date(calendarViewYear, calendarViewMonth, c.dayNum));
                        }
                      }}
                    >
                      <span>{c.dayNum}</span>
                      {hasDot && !isSelected && (
                        <span className={styles.miniDayDot} style={{ background: dotColor }} />
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Calendar Legend */}
              <div className={styles.miniCalendarLegend}>
                <span className={styles.legendItem}><span className={styles.legendDot} style={{ background: '#f59e0b' }} /> Dolu</span>
                <span className={styles.legendItem}><span className={styles.legendDot} style={{ background: '#f97316' }} /> Bekleyen</span>
                <span className={styles.legendItem}><span className={styles.legendDot} style={{ background: '#10b981' }} /> Tamamlanan</span>
                <span className={styles.legendItem}><span className={styles.legendDot} style={{ background: '#ef4444' }} /> İptal</span>
                <span className={styles.legendItem}><span className={styles.legendDot} style={{ background: '#94a3b8' }} /> Randevu yok</span>
              </div>
            </div>

            {/* Widget 2: Bugünün Özeti */}
            <div className={styles.summaryWidgetCard}>
              <div className={styles.widgetHeader}>
                <div className={styles.widgetHeaderTitle}>
                  <span>📋</span> Bugünün Özeti
                </div>
                <button
                  type="button"
                  className={styles.widgetHeaderLink}
                  onClick={() => setViewMode('liste')}
                >
                  Tümünü Gör
                </button>
              </div>

              <div className={styles.summaryList}>
                <div className={styles.summaryRow}>
                  <div className={styles.summaryIconBadge} style={{ background: '#e0f2fe', color: '#0284c7' }}>👥</div>
                  <strong>12</strong>
                  <span>Toplam randevu</span>
                </div>
                <div className={styles.summaryRow}>
                  <div className={styles.summaryIconBadge} style={{ background: '#fef3c7', color: '#d97706' }}>🕒</div>
                  <strong>7</strong>
                  <span>Bekleyen</span>
                </div>
                <div className={styles.summaryRow}>
                  <div className={styles.summaryIconBadge} style={{ background: '#dcfce7', color: '#16a34a' }}>✓</div>
                  <strong>3</strong>
                  <span>Tamamlanan</span>
                </div>
                <div className={styles.summaryRow}>
                  <div className={styles.summaryIconBadge} style={{ background: '#fee2e2', color: '#dc2626' }}>✕</div>
                  <strong>1</strong>
                  <span>İptal</span>
                </div>
                <div className={styles.summaryRow}>
                  <div className={styles.summaryIconBadge} style={{ background: '#fee2e2', color: '#991b1b' }}>🚫</div>
                  <strong>1</strong>
                  <span>Gelmedi</span>
                </div>
              </div>
            </div>

            {/* Widget 3: Yaklaşan Randevular */}
            <div className={styles.upcomingWidgetCard}>
              <div className={styles.widgetHeader}>
                <div className={styles.widgetHeaderTitle}>
                  Yaklaşan Randevular
                </div>
                <button
                  type="button"
                  className={styles.widgetHeaderLink}
                  onClick={() => setViewMode('liste')}
                >
                  Tümünü Gör
                </button>
              </div>

              <div className={styles.upcomingList}>
                <div className={styles.upcomingItem}>
                  <div className={styles.upcomingAvatar} style={{ background: '#3b82f6' }}>MD</div>
                  <div className={styles.upcomingInfo}>
                    <span className={styles.upcomingName}>Mehmet Demir</span>
                    <span className={styles.upcomingTime}>Yarın 10:00 - Cihaz Teslimi</span>
                  </div>
                </div>

                <div className={styles.upcomingItem}>
                  <div className={styles.upcomingAvatar} style={{ background: '#ef4444' }}>ZA</div>
                  <div className={styles.upcomingInfo}>
                    <span className={styles.upcomingName}>Zeynep Arslan</span>
                    <span className={styles.upcomingTime}>Yarın 11:30 - Kontrol</span>
                  </div>
                </div>

                <div className={styles.upcomingItem}>
                  <div className={styles.upcomingAvatar} style={{ background: '#6366f1' }}>HY</div>
                  <div className={styles.upcomingInfo}>
                    <span className={styles.upcomingName}>Hasan Yıldız</span>
                    <span className={styles.upcomingTime}>Yarın 14:00 - Pil Değişimi</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : viewMode === 'liste' ? (
        /* ── Full Table List View ── */
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
                {appointmentsList.map((apt) => (
                  <tr key={apt.id}>
                    <td data-label="Saat" style={{ fontFamily: 'var(--font-mono)', color: 'var(--primary-600)', fontWeight: 600 }}>
                      {apt.time}
                    </td>
                    <td data-label="Hasta">
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div className="avatar" style={{ background: getAvatarColor(apt.patientName) }}>
                          {getInitials(apt.patientName, '')}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, color: '#13232c' }}>{apt.patientName}</div>
                          <div style={{ fontSize: '0.72rem', color: '#7c8991' }}>{apt.notes || '—'}</div>
                        </div>
                      </div>
                    </td>
                    <td data-label="Tür">
                      <span className="badge badge-info">{apt.type}</span>
                    </td>
                    <td data-label="Odyolog">{apt.audiologist}</td>
                    <td data-label="Şube" style={{ fontSize: '0.78rem' }}>{apt.branch}</td>
                    <td data-label="Durum">
                      <span className={`badge badge-${apt.status === 'Geldi' ? 'success' : apt.status === 'Bekliyor' ? 'warning' : 'neutral'}`}>
                        {apt.status}
                      </span>
                    </td>
                    <td data-label="İşlem">
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button
                          type="button"
                          className="btn btn-sm btn-primary"
                          onClick={() => updateAppointmentStatus(apt.id, 'Geldi')}
                          style={{ display: 'flex', alignItems: 'center', gap: 4 }}
                        >
                          <IconCheck size={12} /> Geldi
                        </button>
                        <button
                          type="button"
                          className="btn btn-sm btn-danger"
                          onClick={() => updateAppointmentStatus(apt.id, 'İptal')}
                        >
                          İptal
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* ── Monthly Grid View ── */
        <div className="card">
          <div className="card-body">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontWeight: 700, fontSize: '1.1rem', color: '#13232c' }}>{miniCalendarMonthTitle}</h3>
              <div style={{ display: 'flex', gap: 6 }}>
                <button
                  type="button"
                  className="btn btn-sm btn-secondary"
                  onClick={() => setCalendarViewMonth(m => m === 0 ? 11 : m - 1)}
                >
                  ◀ Önceki Ay
                </button>
                <button
                  type="button"
                  className="btn btn-sm btn-secondary"
                  onClick={() => setCalendarViewMonth(m => m === 11 ? 0 : m + 1)}
                >
                  Sonraki Ay ▶
                </button>
              </div>
            </div>

            <div className="calendar-grid">
              {DAYS.map(day => (
                <div key={day} className="calendar-header-cell">{day}</div>
              ))}
              {miniCalendarDays.map((cell, idx) => {
                const dayAppointments = cell.isCurrentMonth
                  ? appointmentsList.filter(a => a.date === cell.fullDateStr)
                  : [];
                return (
                  <div
                    key={idx}
                    className={`calendar-cell ${!cell.isCurrentMonth ? 'other-month' : ''}`}
                    onClick={() => {
                      if (cell.isCurrentMonth) {
                        setCurrentDate(new Date(calendarViewYear, calendarViewMonth, cell.dayNum));
                        setViewMode('takvim');
                      }
                    }}
                    style={{ cursor: cell.isCurrentMonth ? 'pointer' : 'default', minHeight: 70 }}
                  >
                    <div className="day-number" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>{cell.dayNum}</span>
                      {dayAppointments.length > 0 && (
                        <span style={{ fontSize: '0.68rem', background: '#e5f4ef', color: '#08785b', padding: '1px 5px', borderRadius: 8, fontWeight: 700 }}>
                          {dayAppointments.length}
                        </span>
                      )}
                    </div>
                    {dayAppointments.slice(0, 2).map(apt => (
                      <div key={apt.id} className="calendar-event test" style={{ fontSize: '0.68rem' }}>
                        {apt.time} {apt.patientName.split(' ')[0]}
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── Slot Action Dropdown Menu ── */}
      {activeSlotMenu && (
        <div
          ref={slotMenuRef}
          className={styles.actionDropdown}
          style={{ top: activeSlotMenu.top, right: activeSlotMenu.right }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            className={styles.actionDropdownItem}
            onClick={() => {
              addToast({ type: 'success', message: `${activeSlotMenu.patientName} 'Geldi' olarak güncellendi.` });
              setActiveSlotMenu(null);
            }}
          >
            <IconCheck size={14} />
            <span>Geldi olarak işaretle</span>
          </button>
          <button
            type="button"
            className={styles.actionDropdownItem}
            onClick={() => {
              addToast({ type: 'info', message: `${activeSlotMenu.patientName} için WhatsApp hatırlatması gönderildi.` });
              setActiveSlotMenu(null);
            }}
          >
            <IconPhoneCall size={14} />
            <span>Hatırlatıldı olarak işaretle</span>
          </button>
          <div className={styles.actionDropdownDivider} />
          <button
            type="button"
            className={styles.actionDropdownItem}
            onClick={() => {
              if (activeSlotMenu.phone) window.open(`https://wa.me/${activeSlotMenu.phone.replace(/\D/g, '')}`, '_blank');
              else addToast({ type: 'warning', message: 'Telefon numarası bulunamadı.' });
              setActiveSlotMenu(null);
            }}
          >
            <IconMail size={14} />
            <span>WhatsApp Mesajı Gönder</span>
          </button>
          <div className={styles.actionDropdownDivider} />
          <button
            type="button"
            className={`${styles.actionDropdownItem} ${styles.actionItemDanger}`}
            onClick={() => {
              addToast({ type: 'warning', message: `${activeSlotMenu.patientName} randevusu iptal edildi.` });
              setActiveSlotMenu(null);
            }}
          >
            <IconClose size={14} />
            <span>Randevuyu İptal Et</span>
          </button>
        </div>
      )}

      {/* ── CRITICAL: Preserved New Appointment Modal ── */}
      {showAddModal && (
        <NewAppointmentModal
          onClose={() => setShowAddModal(false)}
          onSave={async (newApt) => {
            await addAppointment(newApt);
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
  onSave: (apt: any) => void | Promise<void>;
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
  const [selectedDate, setSelectedDate] = useState<Date>(() => { const now = new Date(); return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 9, 0); });
  const [showPicker, setShowPicker] = useState(false);
  const [pickerMonth, setPickerMonth] = useState(() => new Date().getMonth());
  const [pickerYear, setPickerYear] = useState(() => new Date().getFullYear());

  // Appointment Type State
  const [aptType, setAptType] = useState('Muayene');
  const [isTypeDropdownOpen, setIsTypeDropdownOpen] = useState(false);

  // Audiologist & Branch
  const [audiologist, setAudiologist] = useState('Dr. Elif Arslan');
  const { branchesList } = useApp();
  const { activeBranch } = useBranch();
  const [branch, setBranch] = useState(activeBranch.mode === 'single' ? activeBranch.branchId : '');

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

  const handleSubmit = async (e: React.FormEvent) => {
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

    const linkedPatient = patientsList.find(patient => patient.id === patientIdFinal);
    if (linkedPatient && !linkedPatient.branchId) { addToast?.({ type: 'error', message: 'Bu hastanın şube bilgisi eksik. Önce hasta kaydını düzeltin.' }); return; }
    const assignedBranchId = activeBranch.mode === 'single' ? activeBranch.branchId : linkedPatient?.branchId || branch;
    const assignedBranch = branchesList.find(item => item.id === assignedBranchId);
    if (!assignedBranchId || !assignedBranch) { addToast?.({ type: 'error', message: 'Randevu için şube seçin.' }); return; }
    const newApt = {
      id: `apt-${Date.now().toString().slice(-6)}`,
      patientId: patientIdFinal,
      patientName: patientNameFinal,
      date: dateStr,
      time: timeStr,
      type: aptType as any,
      audiologist,
      branch: assignedBranch.name as any,
      branchId: assignedBranchId,
      status: 'Bekliyor' as const,
      notes: notes,
      followupPlan: createFollowupPlan,
      followupPeriods: createFollowupPlan ? selectedPeriods : [],
      followupNote: createFollowupPlan ? followupNote : '',
      whatsappReminders: sendWhatsappReminder ? reminders : [],
      sendWhatsappOnCreate
    };

    try { await onSave(newApt); }
    catch { /* Keep the form open when persistence fails. */ }
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

          {activeBranch.mode === 'all' && branchesList.filter(item => item.status === 'Aktif').length > 1 && <label className="form-group">Kayıt şubesi<select className="form-select" value={patientsList.find(patient => patient.id === selectedPatient?.id)?.branchId || branch} disabled={Boolean(selectedPatient)} onChange={event => setBranch(event.target.value)}><option value="">Şube seçin</option>{branchesList.filter(item => item.status === 'Aktif').map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>}

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
