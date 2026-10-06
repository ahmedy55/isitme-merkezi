'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { useBranch } from '../context/BranchContext';
import { BranchService } from '../services/BranchService';
import { isClosedAppointment, isOpenAppointment } from '../lib/appointmentStatus';
import { filterAppointmentsForDay } from '../lib/appointmentFilters';
import { validateAppointmentDateTime } from '../lib/validation';
import { parseAppointmentDateTime } from '../lib/appointmentDateTime';
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

const DAYS = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cts', 'Paz'];
const formatCalendarDate = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
const getIstanbulDate = (date = new Date()) => {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Istanbul', year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(date);
  const part = (type: Intl.DateTimeFormatPartTypes) => Number(parts.find(item => item.type === type)?.value);
  return new Date(part('year'), part('month') - 1, part('day'), 12);
};

interface ShowcaseSlot {
  id: string;
  date?: string;
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



export default function AppointmentsPage() {
  const { appointmentsList: rawAppointmentsList, patientsList, branchesList, usersList, addAppointment, updateAppointment, updateAppointmentStatus, addToast, currentOrgId, appointmentCreatePatientId, clearAppointmentCreationRequest } = useApp();
  const { activeBranch } = useBranch();

  const appointmentsList = useMemo(() => {
    return rawAppointmentsList.filter(a => BranchService.matchesBranch(a.branch, a.branchId, activeBranch));
  }, [rawAppointmentsList, activeBranch]);
  const audiologists = useMemo(() => [...new Set([
    ...usersList.filter(user => user.status === 'Aktif').map(user => `${user.firstName} ${user.lastName}`.trim()),
    ...appointmentsList.map(appointment => appointment.audiologist).filter(Boolean),
  ])], [usersList, appointmentsList]);

  // View mode: 'takvim' (schedule + widgets), 'liste' (table), 'gun', 'hafta', 'ay'
  const [viewMode, setViewMode] = useState<'takvim' | 'liste' | 'gun' | 'hafta' | 'ay'>('takvim');

  // Selected date state (defaults to 12 Eylül 2025 as in mockup, or dynamic)
  const [currentDate, setCurrentDate] = useState<Date>(() => getIstanbulDate());
  const [calendarViewMonth, setCalendarViewMonth] = useState<number>(() => getIstanbulDate().getMonth());
  const [calendarViewYear, setCalendarViewYear] = useState<number>(() => getIstanbulDate().getFullYear());

  // Filters
  const [filterAudiologist, setFilterAudiologist] = useState('Tümü');
  const [filterBranch, setFilterBranch] = useState('All');
  const [filterTimeRange, setFilterTimeRange] = useState('Tüm Gün');
  const [dateInputVal, setDateInputVal] = useState(() => formatCalendarDate(getIstanbulDate()));
  const [statusFilter, setStatusFilter] = useState<'all' | 'bekleyen' | 'tamamlanan' | 'iptal'>('all');
  const [serverNow, setServerNow] = useState<Date>(() => new Date());

  // Modals and action dropdown
  const [updatingAppointmentIds, setUpdatingAppointmentIds] = useState<Set<string>>(() => new Set());
  const [showAddModal, setShowAddModal] = useState(false);
  const [newAppointmentPatientId, setNewAppointmentPatientId] = useState<string | null>(null);
  const [editingAppointment, setEditingAppointment] = useState<any | null>(null);
  const [selectedDetailSlot, setSelectedDetailSlot] = useState<ShowcaseSlot | null>(null);
  const [activeSlotMenu, setActiveSlotMenu] = useState<{ id: string; top: number; right: number; patientName: string; phone?: string } | null>(null);
  const slotMenuRef = useRef<HTMLDivElement>(null);
  const hasUserSelectedDate = useRef(false);

  useEffect(() => {
    if (!appointmentCreatePatientId) return;
    setNewAppointmentPatientId(appointmentCreatePatientId);
    setShowAddModal(true);
    clearAppointmentCreationRequest();
  }, [appointmentCreatePatientId, clearAppointmentCreationRequest]);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/system-time', { cache: 'no-store' })
      .then(response => {
        if (!response.ok) throw new Error('Sunucu saati alınamadı');
        return response.json() as Promise<{ now: string }>;
      })
      .then(({ now }) => {
        if (cancelled || !now) return;
        setServerNow(new Date(now));
        if (hasUserSelectedDate.current) return;
        const today = getIstanbulDate(new Date(now));
        setCurrentDate(today);
        setDateInputVal(formatCalendarDate(today));
        setCalendarViewMonth(today.getMonth());
        setCalendarViewYear(today.getFullYear());
      })
      .catch(() => {
        // Browser's Istanbul-local date remains the fallback if server time is unavailable.
      });
    return () => { cancelled = true; };
  }, []);

  const handleAppointmentStatusChange = async (id: string, status: 'Geldi' | 'İptal' | 'Hatırlatıldı') => {
    if (updatingAppointmentIds.has(id)) return false;
    setUpdatingAppointmentIds(prev => new Set(prev).add(id));
    try {
      return await updateAppointmentStatus(id, status);
    } finally {
      setUpdatingAppointmentIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

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
    hasUserSelectedDate.current = true;
    setCurrentDate(prev => {
      const next = new Date(prev);
      next.setDate(next.getDate() - 1);
      setDateInputVal(formatCalendarDate(next));
      setCalendarViewMonth(next.getMonth());
      setCalendarViewYear(next.getFullYear());
      return next;
    });
  };
  const handleNextDay = () => {
    hasUserSelectedDate.current = true;
    setCurrentDate(prev => {
      const next = new Date(prev);
      next.setDate(next.getDate() + 1);
      setDateInputVal(formatCalendarDate(next));
      setCalendarViewMonth(next.getMonth());
      setCalendarViewYear(next.getFullYear());
      return next;
    });
  };
  const handleToday = async () => {
    hasUserSelectedDate.current = true;
    let today = getIstanbulDate();
    try {
      const response = await fetch('/api/system-time', { cache: 'no-store' });
      if (response.ok) {
        const { now } = await response.json() as { now: string };
        if (now) {
          setServerNow(new Date(now));
          today = getIstanbulDate(new Date(now));
        }
      }
    } catch {
      // Fall back to the browser's clock if the server clock cannot be reached.
    }
    setCurrentDate(today);
    setDateInputVal(formatCalendarDate(today));
    setCalendarViewMonth(today.getMonth());
    setCalendarViewYear(today.getFullYear());
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

  // Takvim sadece seçili güne ait veritabanı randevularını gösterir.
  const selectedDateStr = useMemo(() => {
    const y = currentDate.getFullYear();
    const m = (currentDate.getMonth() + 1).toString().padStart(2, '0');
    const d = currentDate.getDate().toString().padStart(2, '0');
    return `${y}-${m}-${d}`;
  }, [currentDate]);

  const scopedAppointments = useMemo(() => appointmentsList.filter(appointment => {
    if (filterAudiologist !== 'Tümü' && appointment.audiologist !== filterAudiologist) return false;
    if (filterBranch !== 'All' && appointment.branchId !== filterBranch) return false;
    return true;
  }), [appointmentsList, filterAudiologist, filterBranch]);

  const visibleAppointments = useMemo(() => scopedAppointments.filter(appointment => {
    if (statusFilter === 'bekleyen') return ['Bekliyor', 'Hatırlatıldı'].includes(appointment.status);
    if (statusFilter === 'tamamlanan') return ['Tamamlandı', 'Geldi'].includes(appointment.status);
    if (statusFilter === 'iptal') return ['İptal', 'Gelmedi'].includes(appointment.status);
    // In active schedule view ('all'), filter out cancelled appointments so they don't linger in the active schedule
    return !['İptal', 'Gelmedi'].includes(appointment.status);
  }), [scopedAppointments, statusFilter]);

  const aptToSlot = (apt: any): ShowcaseSlot => {
    const patient = patientsList.find(p => p.id === apt.patientId || `${p.firstName} ${p.lastName}` === apt.patientName);
    return {
      id: apt.id,
      date: apt.date,
      hour: apt.time?.split(':')[0] ? `${apt.time.split(':')[0]}:00` : '—',
      timeRange: apt.time?.slice(0, 5) || '—',
      patientName: apt.patientName,
      patientInitials: getInitials(apt.patientName, ''),
      avatarColor: getAvatarColor(apt.patientName),
      type: apt.type,
      duration: '30 dk',
      phone: patient?.phone || '—',
      device: patient?.currentDevice || '—',
      status: (apt.status === 'Hatırlatıldı' ? 'Randevu Onayı' : apt.status) as any,
    };
  };

  const timelineSlots = useMemo<ShowcaseSlot[]>(() => {
    const liveForDay = visibleAppointments.filter(a => a.date === selectedDateStr);
    return liveForDay.map(aptToSlot);
  }, [selectedDateStr, visibleAppointments, patientsList]);

  const calendarStatusDots = useMemo(() => {
    const colorsByDate = new Map<string, Set<string>>();
    for (const appointment of visibleAppointments) {
      const color = ['Bekliyor', 'Hatırlatıldı'].includes(appointment.status)
        ? '#f97316'
        : ['Tamamlandı', 'Geldi'].includes(appointment.status)
          ? '#10b981'
          : '#ef4444';
      const colors = colorsByDate.get(appointment.date) ?? new Set<string>();
      colors.add(color);
      colorsByDate.set(appointment.date, colors);
    }
    return colorsByDate;
  }, [visibleAppointments]);

  const selectedDayAppointments = filterAppointmentsForDay(visibleAppointments, selectedDateStr);
  const selectedDateScopedAppointments = filterAppointmentsForDay(scopedAppointments, selectedDateStr);
  const todayDateStr = formatCalendarDate(getIstanbulDate(serverNow));
  const todaySummaryAppointments = appointmentsList.filter(appointment =>
    appointment.date === todayDateStr &&
    (filterAudiologist === 'Tümü' || appointment.audiologist === filterAudiologist) &&
    (filterBranch === 'All' || appointment.branchId === filterBranch)
  );
  const todaySummaryCounts = {
    total: todaySummaryAppointments.length,
    pending: todaySummaryAppointments.filter(appointment => ['Bekliyor', 'Hatırlatıldı'].includes(appointment.status)).length,
    completed: todaySummaryAppointments.filter(appointment => ['Tamamlandı', 'Geldi'].includes(appointment.status)).length,
    canceled: todaySummaryAppointments.filter(appointment => appointment.status === 'İptal').length,
    noShow: todaySummaryAppointments.filter(appointment => appointment.status === 'Gelmedi').length,
  };
  const upcomingAppointments = appointmentsList
    .filter(appointment =>
      isOpenAppointment(appointment.status) &&
      (filterAudiologist === 'Tümü' || appointment.audiologist === filterAudiologist) &&
      (filterBranch === 'All' || appointment.branchId === filterBranch) &&
      Date.parse(`${appointment.date}T${appointment.time}:00+03:00`) > serverNow.getTime()
    )
    .sort((a, b) => `${a.date}T${a.time}`.localeCompare(`${b.date}T${b.time}`))
    .slice(0, 3);
  const weekStart = getIstanbulDate(serverNow);
  weekStart.setDate(weekStart.getDate() - ((weekStart.getDay() + 6) % 7));
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 7);
  const weekStartStr = formatCalendarDate(weekStart);
  const weekEndStr = formatCalendarDate(weekEnd);
  const weeklyAppointments = scopedAppointments
    .filter(appointment => appointment.date >= weekStartStr && appointment.date < weekEndStr)
    .sort((a, b) => `${a.date}T${a.time}`.localeCompare(`${b.date}T${b.time}`));
  const filteredWeeklyAppointments = weeklyAppointments.filter(appointment => {
    if (statusFilter === 'bekleyen') return ['Bekliyor', 'Hatırlatıldı'].includes(appointment.status);
    if (statusFilter === 'tamamlanan') return ['Tamamlandı', 'Geldi'].includes(appointment.status);
    if (statusFilter === 'iptal') return ['İptal', 'Gelmedi'].includes(appointment.status);
    return true;
  });
  const weeklyCount = weeklyAppointments.length;
  const metricAppointments = viewMode === 'hafta' ? weeklyAppointments : selectedDateScopedAppointments;
  const dailyCompletedCount = selectedDateScopedAppointments.filter(appointment => ['Tamamlandı', 'Geldi'].includes(appointment.status)).length;
  const dailyPendingCount = selectedDateScopedAppointments.filter(appointment => ['Bekliyor', 'Hatırlatıldı'].includes(appointment.status)).length;
  const completedCount = metricAppointments.filter(appointment => ['Tamamlandı', 'Geldi'].includes(appointment.status)).length;
  const pendingCount = metricAppointments.filter(appointment => ['Bekliyor', 'Hatırlatıldı'].includes(appointment.status)).length;
  const canceledCount = metricAppointments.filter(appointment => ['İptal', 'Gelmedi'].includes(appointment.status)).length;

  const handleShowThisWeek = () => {
    setStatusFilter('all');
    setViewMode('hafta');
  };

  const handleShowSelectedDay = () => {
    setStatusFilter('all');
    setViewMode('takvim');
  };

  const visibleTimelineSlots = useMemo(() => timelineSlots.filter(slot => {
    if (slot.isBreak) return filterTimeRange === 'Tüm Gün';
    const hour = Number((slot.timeRange || slot.hour).slice(0, 2));
    if (filterTimeRange === 'Sabah' && (hour < 9 || hour >= 13)) return false;
    if (filterTimeRange === 'Öğleden Sonra' && (hour < 13 || hour >= 18)) return false;
    if (filterAudiologist !== 'Tümü') {
      const appointment = appointmentsList.find(item => item.id === slot.id);
      if (!appointment || appointment.audiologist !== filterAudiologist) return false;
    }
    if (filterBranch !== 'All') {
      const appointment = appointmentsList.find(item => item.id === slot.id);
      if (!appointment || appointment.branchId !== filterBranch) return false;
    }
    if (statusFilter === 'bekleyen' && !['Bekliyor', 'Hatırlatıldı', 'Randevu Onayı'].includes(slot.status || '')) return false;
    if (statusFilter === 'tamamlanan' && !['Tamamlandı', 'Geldi'].includes(slot.status || '')) return false;
    if (statusFilter === 'iptal' && !['İptal', 'Gelmedi'].includes(slot.status || '')) return false;
    return true;
  }), [timelineSlots, filterTimeRange, filterAudiologist, filterBranch, statusFilter, appointmentsList]);

  const detailAppointment = selectedDetailSlot
    ? appointmentsList.find(appointment => appointment.id === selectedDetailSlot.id)
    : undefined;
  const detailPatient = selectedDetailSlot
    ? patientsList.find(patient => patient.id === detailAppointment?.patientId || `${patient.firstName} ${patient.lastName}` === selectedDetailSlot.patientName)
    : undefined;
  const detailBranch = detailAppointment?.branch
    || branchesList.find(branch => branch.id === detailAppointment?.branchId)?.name
    || '—';

  useEffect(() => {
    if (!selectedDetailSlot) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setSelectedDetailSlot(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedDetailSlot]);

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
          className={`${styles.statCard} ${statusFilter === 'all' && viewMode !== 'hafta' ? styles.statCardActive : ''}`}
          onClick={handleShowSelectedDay}
        >
          <div className={`${styles.statIcon} ${styles.iconGreen}`}>
            <IconCalendarCard size={22} />
          </div>
          <div>
            <span>Seçili Gün Randevuları</span>
            <strong>{selectedDateScopedAppointments.length}</strong>
            <small><span style={{ color: '#0b8463', fontWeight: 600 }}>{dailyCompletedCount}</span> tamamlandı • <span style={{ color: '#d97706', fontWeight: 600 }}>{dailyPendingCount}</span> bekliyor</small>
          </div>
        </div>

        {/* 2. Bu Hafta */}
        <div className={`${styles.statCard} ${viewMode === 'hafta' && statusFilter === 'all' ? styles.statCardActive : ''}`} onClick={handleShowThisWeek} role="button" aria-pressed={viewMode === 'hafta' && statusFilter === 'all'} tabIndex={0} onKeyDown={event => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            handleShowThisWeek();
          }
        }}>
          <div className={`${styles.statIcon} ${styles.iconBlue}`}>
            <IconCalendarCard size={22} />
          </div>
          <div>
            <span>Bu Hafta</span>
            <strong>{weeklyCount}</strong>
            <div className={styles.statChangeUp}>
              <span>Seçilen haftadaki toplam</span>
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
            <strong>{pendingCount}</strong>
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
            <strong>{completedCount}</strong>
            <div className={styles.statChangeUp}>
              <span>Seçili aralıktaki toplam</span>
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
            <strong>{canceledCount}</strong>
            <div className={styles.statChangeDown}>
              <span>Seçili aralıktaki toplam</span>
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
                hasUserSelectedDate.current = true;
                const val = e.target.value;
                setDateInputVal(val);
                if (val) {
                  const parts = val.split('-').map(Number);
                  if (parts[0] && parts[1]) {
                          const next = new Date(parts[0], parts[1] - 1, parts[2] || 1, 12);
                          setCurrentDate(next);
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
      {viewMode === 'hafta' ? (
        <div className="card">
          <div className="card-body">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700 }}>Bu Haftaki Randevular</h2>
                <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '0.82rem' }}>
                  {weekStart.toLocaleDateString('tr-TR')} – {new Date(weekEnd.getTime() - 86_400_000).toLocaleDateString('tr-TR')} · {weeklyCount} randevu
                </p>
              </div>
              <button type="button" className="btn btn-sm btn-secondary" onClick={() => setViewMode('takvim')}>Günlük görünüme dön</button>
            </div>
            <div style={{ display: 'grid', gap: 8 }}>
              {Array.from({ length: 7 }, (_, index) => {
                const day = new Date(weekStart);
                day.setDate(weekStart.getDate() + index);
                const dateKey = formatCalendarDate(day);
                const dayAppointments = filteredWeeklyAppointments.filter(appointment => appointment.date === dateKey);
                return (
                  <div key={dateKey} style={{ display: 'grid', gridTemplateColumns: 'minmax(145px, 190px) minmax(0, 1fr)', gap: 12, alignItems: 'start', padding: 12, border: '1px solid #e2e8f0', borderRadius: 10, background: '#fff' }}>
                    <button
                      type="button"
                      onClick={() => {
                        setCurrentDate(day);
                        setDateInputVal(dateKey);
                        setCalendarViewMonth(day.getMonth());
                        setCalendarViewYear(day.getFullYear());
                        setViewMode('takvim');
                      }}
                      style={{ border: 0, background: 'transparent', textAlign: 'left', color: '#173042', cursor: 'pointer', fontWeight: 650, padding: 0 }}
                    >
                      {day.toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long' })}
                      <span style={{ display: 'block', color: '#64748b', fontSize: '0.75rem', fontWeight: 400 }}>{dayAppointments.length} randevu</span>
                    </button>
                    <div style={{ display: 'grid', gap: 6 }}>
                      {dayAppointments.length === 0 ? <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>Randevu yok</span> : dayAppointments.map(appointment => (
                        <div key={appointment.id} style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 10px', alignItems: 'center', fontSize: '0.82rem' }}>
                          <strong style={{ color: '#08785b', minWidth: 42 }}>{appointment.time}</strong>
                          <span style={{ fontWeight: 600 }}>{appointment.patientName}</span>
                          <span style={{ color: '#64748b' }}>{appointment.type}</span>
                          <span style={{ color: appointment.status === 'İptal' || appointment.status === 'Gelmedi' ? '#dc2626' : ['Geldi', 'Tamamlandı'].includes(appointment.status) ? '#08785b' : '#c46b0b' }}>{appointment.status}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : viewMode !== 'liste' && viewMode !== 'ay' ? (
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
              {visibleTimelineSlots.map((slot) => {
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
                    <div
                      className={styles.slotItemCard}
                      style={{ cursor: 'pointer' }}
                      onClick={() => setSelectedDetailSlot(slot)}
                    >
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

                        <div className={styles.slotActions} onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            className={styles.slotActionBtn}
                            title="Randevu Detayı"
                            aria-label={`${slot.patientName} randevu detayını aç`}
                            onClick={() => setSelectedDetailSlot(slot)}
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
                  const dateKey = c.isCurrentMonth
                    ? `${calendarViewYear}-${String(calendarViewMonth + 1).padStart(2, '0')}-${String(c.dayNum).padStart(2, '0')}`
                    : '';
                  const statusDots = [...(calendarStatusDots.get(dateKey) ?? [])];

                  return (
                    <div
                      key={idx}
                      className={`${styles.miniDayCell} ${!c.isCurrentMonth ? styles.miniDayOtherMonth : ''} ${isSelected ? styles.miniDaySelected : ''}`}
                      onClick={() => {
                        if (c.isCurrentMonth) {
                          hasUserSelectedDate.current = true;
                          const next = new Date(calendarViewYear, calendarViewMonth, c.dayNum, 12);
                          setCurrentDate(next);
                          setDateInputVal(formatCalendarDate(next));
                        }
                      }}
                    >
                      <span>{c.dayNum}</span>
                      {statusDots.length > 0 && !isSelected && (
                        <span style={{ display: 'flex', gap: 2, marginTop: 2 }} aria-label={`${statusDots.length} randevu durumu`}>
                          {statusDots.map(color => <span key={color} className={styles.miniDayDot} style={{ background: color, marginTop: 0 }} />)}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Calendar Legend */}
              <div className={styles.miniCalendarLegend}>
                <span className={styles.legendItem}><span className={styles.legendDot} style={{ background: '#f97316' }} /> Bekleyen</span>
                <span className={styles.legendItem}><span className={styles.legendDot} style={{ background: '#10b981' }} /> Tamamlanan</span>
                <span className={styles.legendItem}><span className={styles.legendDot} style={{ background: '#ef4444' }} /> İptal / Gelmedi</span>
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
                  <strong>{todaySummaryCounts.total}</strong>
                  <span>Toplam randevu</span>
                </div>
                <div className={styles.summaryRow}>
                  <div className={styles.summaryIconBadge} style={{ background: '#fef3c7', color: '#d97706' }}>🕒</div>
                  <strong>{todaySummaryCounts.pending}</strong>
                  <span>Bekleyen</span>
                </div>
                <div className={styles.summaryRow}>
                  <div className={styles.summaryIconBadge} style={{ background: '#dcfce7', color: '#16a34a' }}>✓</div>
                  <strong>{todaySummaryCounts.completed}</strong>
                  <span>Tamamlanan</span>
                </div>
                <div className={styles.summaryRow}>
                  <div className={styles.summaryIconBadge} style={{ background: '#fee2e2', color: '#dc2626' }}>✕</div>
                  <strong>{todaySummaryCounts.canceled}</strong>
                  <span>İptal</span>
                </div>
                <div className={styles.summaryRow}>
                  <div className={styles.summaryIconBadge} style={{ background: '#fee2e2', color: '#991b1b' }}>🚫</div>
                  <strong>{todaySummaryCounts.noShow}</strong>
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
                {upcomingAppointments.length === 0 ? (
                  <p className={styles.upcomingTime}>Yaklaşan randevu bulunmuyor.</p>
                ) : upcomingAppointments.map(appointment => {
                  const [year, month, day] = appointment.date.split('-').map(Number);
                  const today = getIstanbulDate(serverNow);
                  const dayDifference = Math.round((Date.UTC(year, month - 1, day) - Date.UTC(today.getFullYear(), today.getMonth(), today.getDate())) / 86_400_000);
                  const dateLabel = dayDifference === 0
                    ? 'Bugün'
                    : dayDifference === 1
                      ? 'Yarın'
                      : `${day} ${['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'][month - 1]}`;
                  return (
                    <div className={styles.upcomingItem} key={appointment.id}>
                      <div className={styles.upcomingAvatar} style={{ background: getAvatarColor(appointment.patientName) }}>
                        {getInitials(appointment.patientName, '')}
                      </div>
                      <div className={styles.upcomingInfo}>
                        <span className={styles.upcomingName}>{appointment.patientName}</span>
                        <span className={styles.upcomingTime}>{dateLabel} {appointment.time} - {appointment.type}</span>
                      </div>
                    </div>
                  );
                })}
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
                {selectedDayAppointments.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '28px 16px', color: 'var(--text-muted)' }}>
                      Seçili tarihte randevu bulunamadı. Başka bir tarih seçebilir veya filtreleri değiştirebilirsiniz.
                    </td>
                  </tr>
                ) : selectedDayAppointments.map((apt) => (
                  <tr
                    key={apt.id}
                    style={{ cursor: 'pointer' }}
                    onClick={() => setSelectedDetailSlot(aptToSlot(apt))}
                  >
                    <td data-label="Saat" style={{ fontFamily: 'var(--font-mono)', color: 'var(--primary-600)', fontWeight: 600 }}>
                      {apt.time?.slice(0, 5)}
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
                    <td data-label="Şube" style={{ fontSize: '0.78rem' }}>{apt.branch || branchesList.find(branch => branch.id === apt.branchId)?.name || '—'}</td>
                    <td data-label="Durum">
                      <span className={`badge badge-${apt.status === 'Geldi' ? 'success' : isOpenAppointment(apt.status) ? 'warning' : isClosedAppointment(apt.status) ? (apt.status === 'İptal' || apt.status === 'Gelmedi' ? 'danger' : 'success') : 'neutral'}`}>
                        {apt.status}
                      </span>
                    </td>
                    <td data-label="İşlem" onClick={(e) => e.stopPropagation()}>
                      {isOpenAppointment(apt.status) ? <div style={{ display: 'flex', gap: 4 }}>
                        <button
                          type="button"
                          className="btn btn-sm btn-primary"
                          disabled={updatingAppointmentIds.has(apt.id)}
                          onClick={() => void handleAppointmentStatusChange(apt.id, 'Geldi')}
                          style={{ display: 'flex', alignItems: 'center', gap: 4 }}
                        >
                          <IconCheck size={12} /> Geldi
                        </button>
                        <button
                          type="button"
                          className="btn btn-sm btn-danger"
                          disabled={updatingAppointmentIds.has(apt.id)}
                          onClick={() => void handleAppointmentStatusChange(apt.id, 'İptal')}
                        >
                          İptal Et
                        </button>
                      </div> : <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>İşlem tamamlandı</span>}
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
                    hasUserSelectedDate.current = true;
                    const next = new Date(calendarViewYear, calendarViewMonth, cell.dayNum, 12);
                        setCurrentDate(next);
                        setDateInputVal(formatCalendarDate(next));
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
          {appointmentsList.find(appointment => appointment.id === activeSlotMenu.id) && (
            <button
              type="button"
              className={styles.actionDropdownItem}
              onClick={() => {
                const appointment = appointmentsList.find(item => item.id === activeSlotMenu.id);
                if (appointment) setEditingAppointment(appointment);
                setActiveSlotMenu(null);
              }}
            >
              <IconFileText size={14} />
              <span>Randevuyu Düzenle</span>
            </button>
          )}
          <button
            type="button"
            className={styles.actionDropdownItem}
            onClick={() => {
              updateAppointmentStatus(activeSlotMenu.id, 'Geldi');
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
              updateAppointmentStatus(activeSlotMenu.id, 'Hatırlatıldı');
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
              if (activeSlotMenu.phone) {
                const clean = activeSlotMenu.phone.replace(/\D/g, '');
                window.open(`https://wa.me/${clean.startsWith('90') ? clean : '90' + clean}`, '_blank');
              } else {
                addToast({ type: 'warning', message: 'Telefon numarası bulunamadı.' });
              }
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
              updateAppointmentStatus(activeSlotMenu.id, 'İptal');
              setActiveSlotMenu(null);
            }}
          >
            <IconClose size={14} />
            <span>Randevuyu İptal Et</span>
          </button>
        </div>
      )}

      {/* ── CRITICAL: Preserved New Appointment Modal ── */}
      {selectedDetailSlot && (
        <div
          className="modal-overlay"
          role="presentation"
          onMouseDown={event => {
            if (event.target === event.currentTarget) setSelectedDetailSlot(null);
          }}
        >
          <section className="modal" role="dialog" aria-modal="true" aria-labelledby="appointment-detail-title" style={{ width: 'min(100%, 560px)', borderRadius: 16, alignSelf: 'center' }}>
            <div className="modal-header">
              <div>
                <div className="modal-title" id="appointment-detail-title">Randevu Detayı</div>
                <span style={{ display: 'block', marginTop: 4, fontSize: '0.78rem', color: '#64748b' }}>{selectedDetailSlot.patientName}</span>
              </div>
              <button type="button" className="modal-close" aria-label="Detay penceresini kapat" onClick={() => setSelectedDetailSlot(null)}>×</button>
            </div>
            <div className="modal-body">
              <dl className="profile-details" style={{ marginBottom: 0 }}>
                <div><dt>Tarih</dt><dd>{new Date(`${selectedDetailSlot.date || selectedDateStr}T12:00:00`).toLocaleDateString('tr-TR')}</dd></div>
                <div><dt>Saat</dt><dd>{selectedDetailSlot.timeRange || selectedDetailSlot.hour}</dd></div>
                <div><dt>Randevu Türü</dt><dd>{selectedDetailSlot.type || '—'}</dd></div>
                <div><dt>Durum</dt><dd>{selectedDetailSlot.status || '—'}</dd></div>
                <div><dt>Odyolog</dt><dd>{detailAppointment?.audiologist || '—'}</dd></div>
                <div><dt>Şube</dt><dd>{detailBranch}</dd></div>
                <div><dt>Telefon</dt><dd>{detailPatient?.phone || selectedDetailSlot.phone || '—'}</dd></div>
                <div><dt>Cihaz</dt><dd>{detailPatient?.currentDevice || selectedDetailSlot.device || '—'}</dd></div>
                <div style={{ gridColumn: '1 / -1' }}><dt>Not</dt><dd>{detailAppointment?.notes || 'Randevu için not eklenmemiş.'}</dd></div>
              </dl>
            </div>
            <div className="modal-footer">
              {detailAppointment && (
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => {
                    setEditingAppointment(detailAppointment);
                    setSelectedDetailSlot(null);
                  }}
                >
                  Randevuyu Düzenle
                </button>
              )}
              <button type="button" className="btn btn-secondary" onClick={() => setSelectedDetailSlot(null)}>Kapat</button>
            </div>
          </section>
        </div>
      )}

      {showAddModal && (
        <NewAppointmentModal
          initialPatientId={newAppointmentPatientId}
          onClose={() => { setShowAddModal(false); setNewAppointmentPatientId(null); }}
          onSave={async (newApt) => {
            await addAppointment(newApt);
            setShowAddModal(false);
            setNewAppointmentPatientId(null);
          }}
          patientsList={patientsList}
          addToast={addToast}
        />
      )}
      {editingAppointment && (
        <NewAppointmentModal
          initialAppointment={editingAppointment}
          onClose={() => setEditingAppointment(null)}
          onSave={async updatedAppointment => {
            const saved = await updateAppointment(updatedAppointment);
            if (saved) setEditingAppointment(null);
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
  addToast,
  initialAppointment,
  initialPatientId
}: {
  onClose: () => void;
  onSave: (apt: any) => void | Promise<void>;
  patientsList: any[];
  addToast?: any;
  initialAppointment?: any;
  initialPatientId?: string | null;
}) {
  const { addPatient } = useApp();
  const [savingAppointment, setSavingAppointment] = useState(false);
  const getNextAppointmentSlot = (from = new Date()) => {
    const slot = new Date(from);
    slot.setSeconds(0, 0);
    let minutes = Math.ceil((slot.getHours() * 60 + slot.getMinutes()) / 30) * 30;
    if (minutes < 8 * 60) minutes = 8 * 60;
    if (minutes >= 18 * 60) {
      slot.setDate(slot.getDate() + 1);
      minutes = 8 * 60;
    }
    slot.setHours(Math.floor(minutes / 60), minutes % 60, 0, 0);
    return slot;
  };

  // Patient Search & Selection State
  const initialPatient = patientsList.find(patient => patient.id === initialPatientId);
  const [patientSearch, setPatientSearch] = useState(initialAppointment?.patientName || (initialPatient ? `${initialPatient.firstName} ${initialPatient.lastName}`.trim() : ''));
  const [selectedPatient, setSelectedPatient] = useState<{ id: string; name: string; phone: string } | null>(() => initialAppointment ? {
    id: initialAppointment.patientId,
    name: initialAppointment.patientName,
    phone: patientsList.find(patient => patient.id === initialAppointment.patientId)?.phone || ''
  } : initialPatient ? { id: initialPatient.id, name: `${initialPatient.firstName} ${initialPatient.lastName}`.trim(), phone: initialPatient.phone || '' } : null);
  const [isPatientDropdownOpen, setIsPatientDropdownOpen] = useState(false);
  const [isAddingNewPatient, setIsAddingNewPatient] = useState(false);
  const [newPatientName, setNewPatientName] = useState('');
  const [newPatientPhone, setNewPatientPhone] = useState('');

  // Date & Time State
  const initialAppointmentDate = initialAppointment
    ? parseAppointmentDateTime(initialAppointment.date, initialAppointment.time)
    : null;
  const [selectedDate, setSelectedDate] = useState<Date>(() => initialAppointmentDate || getNextAppointmentSlot());
  const [showPicker, setShowPicker] = useState(false);
  const [pickerMonth, setPickerMonth] = useState(() => initialAppointmentDate?.getMonth() ?? new Date().getMonth());
  const [pickerYear, setPickerYear] = useState(() => initialAppointmentDate?.getFullYear() ?? new Date().getFullYear());
  const [serverNow, setServerNow] = useState(() => new Date());
  const hasAdjustedAppointmentDate = useRef(Boolean(initialAppointment));

  useEffect(() => {
    let cancelled = false;
    fetch('/api/system-time', { cache: 'no-store' })
      .then(response => response.ok ? response.json() as Promise<{ now: string }> : Promise.reject())
      .then(({ now }) => {
        if (cancelled || !now) return;
        const current = new Date(now);
        setServerNow(current);
        if (!hasAdjustedAppointmentDate.current) {
          const nextSlot = getNextAppointmentSlot(current);
          setSelectedDate(nextSlot);
          setPickerMonth(nextSlot.getMonth());
          setPickerYear(nextSlot.getFullYear());
        }
      })
      .catch(() => {
        // Keep the browser clock as a fallback if server time is unavailable.
      });
    return () => { cancelled = true; };
  }, []);

  // Appointment Type State
  const [aptType, setAptType] = useState(initialAppointment?.type || 'Muayene');
  const [isTypeDropdownOpen, setIsTypeDropdownOpen] = useState(false);

  // Audiologist & Branch
  const [audiologist, setAudiologist] = useState(initialAppointment?.audiologist || '');
  const { branchesList, usersList } = useApp();
  const availableAudiologists = [...new Set([
    ...usersList.filter(user => user.status === 'Aktif').map(user => `${user.firstName} ${user.lastName}`.trim()),
    ...(initialAppointment?.audiologist ? [initialAppointment.audiologist] : []),
  ])];
  const { activeBranch } = useBranch();
  const [branch, setBranch] = useState(initialAppointment?.branchId || (activeBranch.mode === 'single' ? activeBranch.branchId : ''));
  const activeBranches = useMemo(() => branchesList.filter(item => item.status === 'Aktif' || (item.status as string) === 'active'), [branchesList]);

  // Branch data can arrive after this modal mounts. Keep a valid selectable
  // branch in state without ever falling back to an inactive/archived row.
  useEffect(() => {
    const singleBranchId = activeBranch.mode === 'single' ? activeBranch.branchId : '';
    const currentId = initialAppointment?.branchId || singleBranchId || branch;
    if (activeBranches.some(item => item.id === currentId)) {
      if (branch !== currentId) setBranch(currentId);
      return;
    }
    if (singleBranchId && activeBranches.some(item => item.id === singleBranchId)) {
      setBranch(singleBranchId);
    } else if (activeBranches.length === 1) {
      setBranch(activeBranches[0].id);
    } else if (branch && !activeBranches.some(item => item.id === branch)) {
      setBranch('');
    }
  }, [activeBranches, activeBranch, initialAppointment?.branchId, branch]);

  // Notes
  const [notes, setNotes] = useState(initialAppointment?.notes || '');

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
  if (initialAppointment?.type && !aptTypeOptions.some(option => option.label === initialAppointment.type)) {
    aptTypeOptions.push({ label: initialAppointment.type, color: '#64748b' });
  }

  const currentTypeOption = aptTypeOptions.find(o => o.label === aptType) || aptTypeOptions[0];

  // Date picker calendar logic
  const monthNames = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
  const monthShortNames = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
  
  const firstDayOfMonth = new Date(pickerYear, pickerMonth, 1);
  const startDayOfWeek = (firstDayOfMonth.getDay() + 6) % 7; // Monday = 0
  const daysInMonth = new Date(pickerYear, pickerMonth + 1, 0).getDate();
  const prevMonthDays = new Date(pickerYear, pickerMonth, 0).getDate();

  const calendarDays: { num: number; monthOffset: -1 | 0 | 1 }[] = [];
  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    calendarDays.push({ num: prevMonthDays - i, monthOffset: -1 });
  }
  for (let i = 1; i <= daysInMonth; i++) {
    calendarDays.push({ num: i, monthOffset: 0 });
  }
  const remainingCells = (calendarDays.length <= 35 ? 35 : 42) - calendarDays.length;
  for (let i = 1; i <= remainingCells; i++) {
    calendarDays.push({ num: i, monthOffset: 1 });
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
    if (savingAppointment) return;
    const appointmentDate = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`;
    const appointmentTime = `${String(selectedDate.getHours()).padStart(2, '0')}:${String(selectedDate.getMinutes()).padStart(2, '0')}`;
    const dateTimeValidation = validateAppointmentDateTime(appointmentDate, appointmentTime);
    const scheduleChanged = initialAppointment && (appointmentDate !== initialAppointment.date || appointmentTime !== initialAppointment.time);
    if (!dateTimeValidation.isValid && (!initialAppointment || scheduleChanged)) {
      addToast?.({ type: 'error', message: dateTimeValidation.error || 'Geçmiş bir saate randevu oluşturulamaz.' });
      return;
    }
    let patientNameFinal = '';
    let patientIdFinal = '';

    if (isAddingNewPatient) {
      if (!newPatientName.trim()) {
        addToast?.({ type: 'error', message: 'Lütfen yeni hasta adı girin.' });
        return;
      }
      patientNameFinal = newPatientName.trim();
    } else if (selectedPatient) {
      patientNameFinal = selectedPatient.name;
      patientIdFinal = selectedPatient.id;
    } else if (patientSearch.trim()) {
      addToast?.({ type: 'error', message: 'Arama sonucundan kayıtlı hastayı seçin veya Yeni Hasta seçeneğini kullanın.' });
      return;
    } else {
      addToast?.({ type: 'error', message: 'Lütfen bir hasta seçin veya yeni hasta adı girin.' });
      return;
    }

    const yearStr = selectedDate.getFullYear();
    const monthStr = (selectedDate.getMonth() + 1).toString().padStart(2, '0');
    const dayStr = selectedDate.getDate().toString().padStart(2, '0');
    const dateStr = `${yearStr}-${monthStr}-${dayStr}`;

    const hourStr = selectedDate.getHours().toString().padStart(2, '0');
    const minStr = selectedDate.getMinutes().toString().padStart(2, '0');
    const timeStr = `${hourStr}:${minStr}`;

    const linkedPatient = patientsList.find(p => p.id === patientIdFinal);
    const defaultBranchId = activeBranch.mode === 'single' ? activeBranch.branchId : '';
    const defaultBranch = activeBranches.find(item => item.id === defaultBranchId) || activeBranches[0];
    const requestedBranchId = activeBranch.mode === 'single'
      ? activeBranch.branchId
      : (initialAppointment ? (branch || initialAppointment.branchId) : (linkedPatient?.branchId || branch));
    const assignedBranch = activeBranches.find(item => item.id === requestedBranchId) || defaultBranch;
    if (!assignedBranch) { addToast?.({ type: 'error', message: 'Randevu için geçerli bir şube bulunamadı.' }); return; }
    const assignedBranchId = assignedBranch.id;
    setSavingAppointment(true);
    if (isAddingNewPatient) {
      try {
        const parts = patientNameFinal.split(/\s+/);
        const created = await addPatient({ firstName: parts.slice(0, -1).join(' ') || parts[0], lastName: parts.length > 1 ? parts[parts.length - 1] : '', tc: '', phone: newPatientPhone.trim(), branchId: assignedBranchId, branch: assignedBranch.name, patientStatus: 'Potansiyel' });
        patientIdFinal = created.id;
        setSelectedPatient({ id: created.id, name: patientNameFinal, phone: created.phone || '' });
        setIsAddingNewPatient(false);
      } catch {
        setSavingAppointment(false);
        return;
      }
    }
    const newApt = {
      ...(initialAppointment || {}),
      id: initialAppointment?.id || `apt-${Date.now().toString().slice(-6)}`,
      patientId: patientIdFinal,
      patientName: patientNameFinal,
      date: dateStr,
      time: timeStr,
      type: aptType as any,
      audiologist,
      branch: assignedBranch.name as any,
      branchId: assignedBranchId,
      status: initialAppointment?.status || 'Bekliyor',
      notes: notes,
      followupPlan: createFollowupPlan,
      followupPeriods: createFollowupPlan ? selectedPeriods : [],
      followupNote: createFollowupPlan ? followupNote : '',
      whatsappReminders: sendWhatsappReminder ? reminders : [],
      sendWhatsappOnCreate
    };

    try { await onSave(newApt); }
    catch { /* Keep the form open when persistence fails. */ }
    finally { setSavingAppointment(false); }
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
            <span>{initialAppointment ? 'Randevuyu Düzenle' : 'Yeni Randevu'}</span>
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
                    readOnly={Boolean(initialAppointment)}
                    onChange={(e) => {
                      setSelectedPatient(null);
                      setPatientSearch(e.target.value);
                      setIsPatientDropdownOpen(true);
                    }}
                    onFocus={() => { if (!initialAppointment) setIsPatientDropdownOpen(true); }}
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
                          <button type="button" onClick={() => {
                            const previousMonth = new Date(pickerYear, pickerMonth - 1, 1);
                            setPickerMonth(previousMonth.getMonth());
                            setPickerYear(previousMonth.getFullYear());
                          }} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px 4px', color: '#64748b' }}>‹</button>
                        </div>
                        <span style={{ fontWeight: 700, fontSize: '0.88rem', color: '#0f172a' }}>
                          {monthShortNames[pickerMonth]} {pickerYear}
                        </span>
                        <div style={{ display: 'flex', gap: 4 }}>
                          <button type="button" onClick={() => {
                            const nextMonth = new Date(pickerYear, pickerMonth + 1, 1);
                            setPickerMonth(nextMonth.getMonth());
                            setPickerYear(nextMonth.getFullYear());
                          }} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px 4px', color: '#64748b' }}>›</button>
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
                          const cellDate = new Date(pickerYear, pickerMonth + cell.monthOffset, cell.num, 12);
                          const selectedDay = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate(), 12);
                          const todayStart = getIstanbulDate(serverNow);
                          const isSelected = cellDate.getTime() === selectedDay.getTime();
                          const isPastDay = cellDate < todayStart;
                          const isOtherMonth = cell.monthOffset !== 0;
                          return (
                            <button
                              type="button"
                              key={idx}
                              disabled={isPastDay}
                              onClick={() => {
                                hasAdjustedAppointmentDate.current = true;
                                const newD = new Date(pickerYear, pickerMonth + cell.monthOffset, cell.num, selectedDate.getHours(), selectedDate.getMinutes());
                                setSelectedDate(newD);
                                setPickerMonth(newD.getMonth());
                                setPickerYear(newD.getFullYear());
                              }}
                              style={{
                                padding: '5px 0', fontSize: '0.8rem', borderRadius: 6,
                                cursor: isPastDay ? 'not-allowed' : 'pointer',
                                color: isPastDay ? '#cbd5e1' : isSelected ? '#ffffff' : isOtherMonth ? '#94a3b8' : '#334155',
                                background: isSelected ? '#3b82f6' : isPastDay ? '#f8fafc' : 'transparent',
                                border: 0, fontWeight: isSelected ? 700 : 400,
                                opacity: isPastDay ? 0.55 : 1
                              }}
                              aria-label={`${cell.num} ${monthShortNames[(pickerMonth + cell.monthOffset + 12) % 12]}${isPastDay ? ', geçmiş tarih, seçilemez' : ''}`}
                            >
                              {cell.num}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Right: Time picker */}
                    <div style={{ width: 75, borderLeft: '1px solid #f1f5f9', paddingLeft: 8, display: 'flex', flexDirection: 'column', height: 180, overflowY: 'auto' }}>
                      <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', marginBottom: 4, textTransform: 'uppercase' }}>Saat</div>
                      {['08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30', '18:00']
                        .filter(timeStr => {
                          const [h, m] = timeStr.split(':').map(Number);
                          const optionDate = new Date(selectedDate);
                          optionDate.setHours(h, m, 0, 0);
                          return optionDate > serverNow;
                        })
                        .map((timeStr) => {
                        const [h, m] = timeStr.split(':').map(Number);
                        const isTimeSelected = selectedDate.getHours() === h && selectedDate.getMinutes() === m;
                        return (
                          <button
                            key={timeStr}
                            type="button"
                            onClick={() => {
                              hasAdjustedAppointmentDate.current = true;
                              const newD = new Date(selectedDate);
                              newD.setHours(h);
                              newD.setMinutes(m);
                              setSelectedDate(newD);
                            }}
                            style={{
                              padding: '4px 6px', fontSize: '0.78rem', borderRadius: 4, cursor: 'pointer',
                              border: 0, textAlign: 'left',
                              color: isTimeSelected ? '#0284c7' : '#475569',
                              fontWeight: isTimeSelected ? 700 : 400, marginBottom: 2,
                              background: isTimeSelected ? '#e0f2fe' : 'transparent'
                            }}
                          >
                            {timeStr}
                          </button>
                        );
                      })}
                    </div>

                  </div>

                  {/* Popover Footer */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f1f5f9', paddingTop: 8 }}>
                    <button
                      type="button"
                      onClick={() => {
                        hasAdjustedAppointmentDate.current = true;
                        const nextSlot = getNextAppointmentSlot(serverNow);
                        setSelectedDate(nextSlot);
                        setPickerMonth(nextSlot.getMonth());
                        setPickerYear(nextSlot.getFullYear());
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

          {initialAppointment && (
            <label className="form-group">Odyolog
              <select className="form-select" value={audiologist} onChange={event => setAudiologist(event.target.value)}>
                <option value="" disabled>Personel seçin</option>
                {availableAudiologists.map(name => <option key={name} value={name}>{name}</option>)}
              </select>
            </label>
          )}

          {activeBranch.mode === 'all' && activeBranches.length > 1 && <label className="form-group">Kayıt şubesi<select className="form-select" value={branch} onChange={event => setBranch(event.target.value)}><option value="">Şube seçin</option>{activeBranches.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>}

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
              disabled={savingAppointment}
              style={{
                padding: '9px 20px', borderRadius: 8, border: 'none',
                background: '#2563eb', color: '#ffffff', fontSize: '0.88rem', fontWeight: 600,
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)'
              }}
            >
              <span>📅</span> {initialAppointment ? 'Değişiklikleri Kaydet' : 'Randevu Oluştur'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
