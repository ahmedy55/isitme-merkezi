'use client';

import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { useBranchScope } from '../hooks/useBranchScope';
import { createActivity, fetchActivities } from '../repositories/OperationsRepository';
import { IconSearch, IconPlus, IconCheck, IconClose, IconPhone, IconMail, IconCalendar } from '../components/Icons';
import { calculateAge, getAvatarColor, getInitials } from '../data/mockData';
import styles from './ActivityLogPage.module.css';

/* ── Inline SVG Icons ── */
function IconActivityPulse({ size = 26 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
    </svg>
  );
}

function IconClockSmall({ size = 13 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <polyline points="12 6 12 12 16 14"/>
    </svg>
  );
}

function IconDotsVertical({ size = 15 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="5" r="1"/>
      <circle cx="12" cy="12" r="1"/>
      <circle cx="12" cy="19" r="1"/>
    </svg>
  );
}

function IconFilterFunnel({ size = 13 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
    </svg>
  );
}

function IconRefresh({ size = 13 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/>
      <path d="M21 3v5h-5"/>
      <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/>
      <path d="M8 16H3v5"/>
    </svg>
  );
}

export interface ActivityRecord {
  id: string;
  timestamp: string;
  dateStr: string;
  timeStr: string;
  patientId?: string;
  patientName: string;
  patientAge: number;
  patientGender: string;
  patientAvatarColor: string;
  patientInitials: string;
  patientPhone: string;
  type: 'Telefon Araması' | 'Yüz Yüze Görüşme' | 'Not Ekleme' | 'Randevu İşlemi' | 'Cihaz İşlemi' | 'Yeni Hasta' | 'Diğer';
  description: string;
  staffName: string;
  staffInitials: string;
  staffAvatarColor: string;
  branchName: string;
  relatedAppointment?: {
    date: string;
    type: string;
    branch: string;
  };
}
const todayISO = () => new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Istanbul' }).format(new Date());



export default function ActivityLogPage() {
  const { addToast, currentOrgId, currentUser, dataLoading, branchesList, usersList, patientsList, setCurrentPage, setSelectedPatientId } = useApp();
  const { activeBranchId, matches } = useBranchScope();

  // Active category filter tab
  const [activeTab, setActiveTab] = useState<string>('Tümü');

  // Search and select filters
  const [searchQuery, setSearchQuery] = useState('');
  const todayDate = new Date();
  const todayDateLabel = new Intl.DateTimeFormat('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'Europe/Istanbul' }).format(todayDate);
  const [dateRange, setDateRange] = useState(`${todayDateLabel} - ${todayDateLabel}`);
  const [filterType, setFilterType] = useState('Tümü');
  const [filterStaff, setFilterStaff] = useState('Tümü');
  const [filterBranch, setFilterBranch] = useState('Tümü');
  const [sortBy, setSortBy] = useState('Tarih (Yeni → Eski)');

  // Selected row and detail drawer
  const [selectedActId, setSelectedActId] = useState<string | null>(null);
  const [showDetailPanel, setShowDetailPanel] = useState<boolean>(false);
  const [panelTab, setPanelTab] = useState<'Genel' | 'Tüm Aktiviteleri'>('Genel');
  const [activeActionMenu, setActiveActionMenu] = useState<{ id: string; top: number; left: number } | null>(null);
  const actionMenuRef = useRef<HTMLDivElement>(null);

  // Checkbox multi-select
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());
  const [currentPageIndex, setCurrentPageIndex] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // Modal for new activity
  const [showModal, setShowModal] = useState(false);
  const [formPatientName, setFormPatientName] = useState('');
  const [formPatientId, setFormPatientId] = useState<string | null>(null);
  const [isPatientSuggestionsOpen, setIsPatientSuggestionsOpen] = useState(false);
  const [activePatientSuggestionIndex, setActivePatientSuggestionIndex] = useState(-1);
  const [formType, setFormType] = useState<ActivityRecord['type']>('Telefon Araması');
  const [formDescription, setFormDescription] = useState('');
  const [formStaffId, setFormStaffId] = useState('');
  const [formBranchId, setFormBranchId] = useState('');

  // Live activities from repository
  const [activities, setActivities] = useState<ActivityRecord[]>([]);

  useEffect(() => {
    if (!activeActionMenu) return;
    const closeOnOutsideClick = (event: MouseEvent) => {
      if (!actionMenuRef.current?.contains(event.target as Node)) setActiveActionMenu(null);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setActiveActionMenu(null);
    };
    document.addEventListener('pointerdown', closeOnOutsideClick);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('pointerdown', closeOnOutsideClick);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [activeActionMenu]);

  useEffect(() => {
    let cancelled = false;
    if (currentOrgId) {
      fetchActivities()
        .then(rows => {
          if (!cancelled) {
            const mapped: ActivityRecord[] = (rows as any[]).map((r, idx) => ({
              id: r.id || `act-live-${idx}`,
              timestamp: r.timestamp,
              dateStr: new Intl.DateTimeFormat('tr-TR', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(r.timestamp)),
              timeStr: new Intl.DateTimeFormat('tr-TR', { hour: '2-digit', minute: '2-digit' }).format(new Date(r.timestamp)),
              patientId: r.patientId,
              patientName: r.patientName,
              patientAge: (() => { const patient = patientsList.find(item => item.id === r.patientId); return patient?.birthDate ? calculateAge(patient.birthDate) : 0; })(),
              patientGender: patientsList.find(item => item.id === r.patientId)?.gender || 'Belirtilmemiş',
              patientAvatarColor: getAvatarColor(r.patientName),
              patientInitials: getInitials(r.patientName, ''),
              patientPhone: patientsList.find(item => item.id === r.patientId)?.phone || '—',
              type: r.type === 'Arama' ? 'Telefon Araması' : r.type === 'Randevu' ? 'Randevu İşlemi' : 'Not Ekleme',
              description: r.description || '',
              staffName: r.userName || 'Personel',
              staffInitials: (r.userName || 'PE').slice(0, 2).toUpperCase(),
              staffAvatarColor: '#3b82f6',
              branchName: r.branchName || branchesList.find(branch => branch.id === r.branchId)?.name || '—'
            }));
            setActivities(mapped);
          }
        })
        .catch(() => { if (!cancelled) setActivities([]); });
    } else {
      setActivities([]);
    }
    return () => { cancelled = true; };
  }, [currentOrgId, patientsList, branchesList]);

  const toggleCheck = (id: string) => {
    setCheckedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleAll = (allIds: string[]) => {
    setCheckedIds(prev => prev.size === allIds.length ? new Set() : new Set(allIds));
  };

  // Filtered rows
  const filteredActivities = useMemo(() => {
    const [fromDate, toDate] = dateRange.split('-').map(value => value.trim().split('.').reverse().join('-'));
    return activities.filter(act => {
      // Category tab
      if (activeTab !== 'Tümü' && act.type !== activeTab) {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const m1 = act.patientName.toLowerCase().includes(q);
        const m2 = act.description.toLowerCase().includes(q);
        const m3 = act.patientPhone.includes(q);
        const m4 = act.staffName.toLowerCase().includes(q);
        if (!m1 && !m2 && !m3 && !m4) return false;
      }

      // Type filter
      if (filterType !== 'Tümü' && act.type !== filterType) return false;

      // Staff filter
      if (filterStaff !== 'Tümü' && act.staffName !== filterStaff) return false;

      // Branch filter
      if (filterBranch !== 'Tümü' && act.branchName !== filterBranch) return false;

      const activityDate = act.timestamp.slice(0, 10);
      if (fromDate && /^\d{4}-\d{2}-\d{2}$/.test(fromDate) && activityDate < fromDate) return false;
      if (toDate && /^\d{4}-\d{2}-\d{2}$/.test(toDate) && activityDate > toDate) return false;

      return true;
    });
  }, [activities, activeTab, searchQuery, filterType, filterStaff, filterBranch, dateRange]);

  const sortedActivities = useMemo(() => [...filteredActivities].sort((a, b) => {
    const direction = sortBy === 'Tarih (Eski → Yeni)' ? 1 : -1;
    return a.timestamp.localeCompare(b.timestamp) * direction;
  }), [filteredActivities, sortBy]);
  const pageCount = Math.ceil(sortedActivities.length / pageSize);
  const pagedActivities = sortedActivities.slice((currentPageIndex - 1) * pageSize, currentPageIndex * pageSize);
  const visiblePageNumbers = pageCount <= 5
    ? Array.from({ length: pageCount }, (_, index) => index + 1)
    : Array.from(new Set([1, currentPageIndex - 1, currentPageIndex, currentPageIndex + 1, pageCount])).filter(page => page >= 1 && page <= pageCount).sort((a, b) => a - b);

  useEffect(() => {
    setCurrentPageIndex(1);
  }, [activeTab, searchQuery, filterType, filterStaff, filterBranch, dateRange, pageSize]);

  useEffect(() => {
    if (currentPageIndex > Math.max(pageCount, 1)) setCurrentPageIndex(Math.max(pageCount, 1));
  }, [currentPageIndex, pageCount]);

  useEffect(() => {
    const visibleIds = new Set(filteredActivities.map(activity => activity.id));
    setCheckedIds(previous => new Set([...previous].filter(id => visibleIds.has(id))));
    if (selectedActId && !visibleIds.has(selectedActId)) {
      setSelectedActId(null);
      setShowDetailPanel(false);
      setActiveActionMenu(null);
    }
  }, [filteredActivities, selectedActId]);

  const todayKey = todayISO();
  const todaysActivities = activities.filter(activity => activity.timestamp.slice(0, 10) === todayKey);
  const activityCount = (type: ActivityRecord['type']) => todaysActivities.filter(activity => activity.type === type).length;

  const activeRecord = selectedActId ? filteredActivities.find(a => a.id === selectedActId) : undefined;
  const activityBranches = branchesList.filter(branch => (branch.status === 'Aktif' || (branch.status as string) === 'active') && matches(branch.name, branch.id));
  const activityStaff = usersList.filter(user => (user.status === 'Aktif' || (user.status as string) === 'active')
    && (!user.branchId || !formBranchId || user.branchId === formBranchId));

  useEffect(() => {
    if (activityBranches.length === 0 || activityBranches.some(branch => branch.id === formBranchId)) return;
    const preferredBranch = activityBranches.find(branch => branch.id === activeBranchId) || activityBranches[0];
    setFormBranchId(preferredBranch.id);
  }, [activityBranches, activeBranchId, formBranchId]);

  useEffect(() => {
    if (activityStaff.length === 0 || activityStaff.some(user => user.id === formStaffId)) return;
    const currentMembership = activityStaff.find(user => user.userId === currentUser?.id);
    setFormStaffId((currentMembership || activityStaff[0]).id);
  }, [activityStaff, currentUser?.id, formStaffId]);
  const patientSuggestions = useMemo(() => {
    const query = formPatientName.trim().toLocaleLowerCase('tr-TR');
    if (!query) return [];
    return patientsList.filter(patient => `${patient.firstName} ${patient.lastName}`.toLocaleLowerCase('tr-TR').includes(query)
      || (patient.phone || '').includes(query)).slice(0, 7);
  }, [formPatientName, patientsList]);

  const selectActivityPatient = (patientId: string) => {
    const patient = patientsList.find(item => item.id === patientId);
    if (!patient) return;
    setFormPatientId(patient.id);
    setFormPatientName(`${patient.firstName} ${patient.lastName}`.trim());
    setIsPatientSuggestionsOpen(false);
    setActivePatientSuggestionIndex(-1);
  };

  const handleCreateActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formPatientName.trim() || !formDescription.trim()) {
      addToast({ type: 'warning', message: 'Lütfen hasta adı ve açıklama alanlarını doldurun.' });
      return;
    }

    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    const selectedPatient = patientsList.find(patient => patient.id === formPatientId)
      || patientsList.find(patient => `${patient.firstName} ${patient.lastName}`.trim().toLocaleLowerCase('tr-TR') === formPatientName.trim().toLocaleLowerCase('tr-TR'));
    const selectedStaff = usersList.find(user => user.id === formStaffId);
    const selectedBranch = branchesList.find(branch => branch.id === formBranchId);
    if (!selectedStaff || !selectedBranch) {
      addToast({ type: 'warning', message: 'Aktivite kaydı için geçerli personel ve şube seçin.' });
      return;
    }
    const newRecord: ActivityRecord = {
      id: `act-${Date.now()}`,
      timestamp: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${timeStr}`,
      dateStr: new Intl.DateTimeFormat('tr-TR', { day: '2-digit', month: 'short', year: 'numeric' }).format(now),
      timeStr,
      patientName: formPatientName,
      patientId: selectedPatient?.id,
      patientAge: selectedPatient ? calculateAge(selectedPatient.birthDate) : 0,
      patientGender: selectedPatient?.gender || 'Belirtilmemiş',
      patientAvatarColor: getAvatarColor(formPatientName),
      patientInitials: selectedPatient ? getInitials(selectedPatient.firstName, selectedPatient.lastName) : getInitials(formPatientName, ''),
      patientPhone: selectedPatient?.phone || '—',
      type: formType,
      description: formDescription,
      staffName: `${selectedStaff.firstName} ${selectedStaff.lastName}`.trim(),
      staffInitials: getInitials(selectedStaff.firstName, selectedStaff.lastName),
      staffAvatarColor: '#0f766e',
      branchName: selectedBranch.name
    };

    const activityType: Record<ActivityRecord['type'], string> = {
      'Telefon Araması': 'Arama',
      'Yüz Yüze Görüşme': 'Not Ekleme',
      'Not Ekleme': 'Not Ekleme',
      'Randevu İşlemi': 'Randevu',
      'Cihaz İşlemi': 'Not Ekleme',
      'Yeni Hasta': 'Hasta Girişi',
      'Diğer': 'Not Ekleme',
    };
    try {
      await createActivity({
        branchId: selectedBranch.id,
        patientName: selectedPatient ? `${selectedPatient.firstName} ${selectedPatient.lastName}`.trim() : formPatientName.trim(),
        patientId: selectedPatient?.id,
        type: activityType[formType],
        description: formDescription.trim(),
      });
      const rows = await fetchActivities();
      const created = rows[0];
      if (!created) throw new Error('Kaydedilen aktivite yeniden yüklenemedi.');
      setActivities(previous => [{ ...newRecord, id: created.id, timestamp: created.timestamp }, ...previous]);
      setSelectedActId(created.id);
    } catch (error) {
      addToast({ type: 'error', message: error instanceof Error ? error.message : 'Aktivite kaydedilemedi.' });
      return;
    }
    setShowModal(false);
    setFormPatientName('');
    setFormPatientId(null);
    setIsPatientSuggestionsOpen(false);
    setActivePatientSuggestionIndex(-1);
    setFormDescription('');
    addToast({ type: 'success', message: 'Yeni aktivite kaydı başarıyla kaydedildi.' });
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setActiveTab('Tümü');
    setFilterType('Tümü');
    setFilterStaff('Tümü');
    setFilterBranch('Tümü');
    addToast({ type: 'info', message: 'Filtreler temizlendi.' });
  };

  return (
    <div className={`page ${styles.activityPage}`}>
      {/* ── Page Header ── */}
      <div className={styles.pageHeading}>
        <div className={styles.headingCopy}>
          <div className={styles.headingIcon}>
            <IconActivityPulse size={28} />
          </div>
          <div>
            <div className={styles.breadcrumb}>
              Aktivite Kaydı <span>&gt;</span> Günlük Aktiviteler
            </div>
            <h1>Günlük Aktivite Kayıtları</h1>
            <p>Personellerin hastalarla gerçekleştirdiği telefon aramaları, görüşmeler ve diğer işlemler.</p>
          </div>
        </div>

        <div className={styles.headerActions}>
          <button
            type="button"
            className={styles.btnNewActivity}
            onClick={() => setShowModal(true)}
            id="btn-new-activity"
          >
            <IconPlus size={15} strokeWidth={2.5} /> Yeni Aktivite Gir
          </button>
        </div>
      </div>

      {/* ── 5 Stat Metric Cards ── */}
      <div className={styles.statsGrid}>
        {/* 1. Bugünkü Toplam Aktivite */}
        <div className={styles.statCard} onClick={() => setActiveTab('Tümü')}>
          <div className={`${styles.statIcon} ${styles.iconGreen}`}>
            <IconPhone size={20} />
          </div>
          <div>
            <span>Bugünkü Toplam Aktivite</span>
            <strong>{todaysActivities.length}</strong>
            <div className={styles.statChangeUp}>Bugün kaydedilen</div>
          </div>
        </div>

        {/* 2. Telefon Görüşmeleri */}
        <div className={styles.statCard} onClick={() => setActiveTab('Telefon Araması')}>
          <div className={`${styles.statIcon} ${styles.iconBlue}`}>
            <IconPhone size={20} />
          </div>
          <div>
            <span>Telefon Görüşmeleri</span>
            <strong>{activityCount('Telefon Araması')}</strong>
            <div className={styles.statChangeUp}>Bugün kaydedilen</div>
          </div>
        </div>

        {/* 3. Yüz Yüze Görüşmeler */}
        <div className={styles.statCard} onClick={() => setActiveTab('Yüz Yüze Görüşme')}>
          <div className={`${styles.statIcon} ${styles.iconEmerald}`}>
            <span style={{ fontSize: '18px' }}>👥</span>
          </div>
          <div>
            <span>Yüz Yüze Görüşmeler</span>
            <strong>{activityCount('Yüz Yüze Görüşme')}</strong>
            <div className={styles.statChangeUp}>Bugün kaydedilen</div>
          </div>
        </div>

        {/* 4. Not / Diğer İşlemler */}
        <div className={styles.statCard} onClick={() => setActiveTab('Not Ekleme')}>
          <div className={`${styles.statIcon} ${styles.iconRed}`}>
            <span style={{ fontSize: '18px' }}>📝</span>
          </div>
          <div>
            <span>Not / Diğer İşlemler</span>
            <strong>{activityCount('Not Ekleme') + activityCount('Diğer')}</strong>
            <div className={styles.statChangeDown}>Bugün kaydedilen</div>
          </div>
        </div>

        {/* 5. Yeni Hasta Kaydı */}
        <div className={styles.statCard} onClick={() => setActiveTab('Yeni Hasta')}>
          <div className={`${styles.statIcon} ${styles.iconBlue}`}>
            <span style={{ fontSize: '18px' }}>👤</span>
          </div>
          <div>
            <span>Yeni Hasta Kaydı</span>
            <strong>{activityCount('Yeni Hasta')}</strong>
            <div className={styles.statChangeUp}>Bugün kaydedilen</div>
          </div>
        </div>
      </div>

      {/* ── Filters Section ── */}
      <div className={styles.filterCard}>
        {/* Top Search Inputs Row */}
        <div className={styles.filterInputsRow}>
          <div className={styles.searchInputWrap}>
            <span className={styles.searchIcon}><IconSearch size={15} /></span>
            <input
              type="text"
              className={styles.searchInput}
              placeholder="Hasta adı, telefon, TC veya açıklama ile ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <input
            type="text"
            className={styles.dateRangeInput}
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            placeholder="Tarih Aralığı"
          />

          <select
            className={styles.filterSelect}
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            aria-label="Aktivite Türü"
          >
            <option value="Tümü">Aktivite Türü: Tümü</option>
            <option value="Telefon Araması">Telefon Araması</option>
            <option value="Yüz Yüze Görüşme">Yüz Yüze Görüşme</option>
            <option value="Not Ekleme">Not Ekleme</option>
            <option value="Randevu İşlemi">Randevu İşlemi</option>
            <option value="Cihaz İşlemi">Cihaz İşlemi</option>
            <option value="Yeni Hasta">Yeni Hasta</option>
          </select>

          <select
            className={styles.filterSelect}
            value={filterStaff}
            onChange={(e) => setFilterStaff(e.target.value)}
            aria-label="Personel"
          >
            <option value="Tümü">Personel: Tümü</option>
            {[...new Set(usersList.filter(user => user.status === 'Aktif').map(user => `${user.firstName} ${user.lastName}`.trim()))].map(name => <option key={name} value={name}>{name}</option>)}
          </select>

          <select
            className={styles.filterSelect}
            value={filterBranch}
            onChange={(e) => setFilterBranch(e.target.value)}
            aria-label="Şube"
          >
            <option value="Tümü">Şube: Tümü</option>
            {branchesList.filter(branch => branch.status === 'Aktif').map(branch => <option key={branch.id} value={branch.name}>{branch.name}</option>)}
          </select>

          <div className={styles.filterBtnsWrap}>
            <button
              type="button"
              className={styles.btnApplyFilter}
              onClick={() => addToast({ type: 'info', message: 'Filtreler uygulandı.' })}
            >
              <IconFilterFunnel size={13} /> Filtrele
            </button>
            <button
              type="button"
              className={styles.btnClearFilter}
              onClick={handleResetFilters}
            >
              <IconRefresh size={13} /> Temizle
            </button>
          </div>
        </div>

        {/* Category Tabs Row */}
        <div className={styles.categoryTabsRow}>
          <div className={styles.categoryTabs}>
            {(['Tümü', 'Telefon Araması', 'Yüz Yüze Görüşme', 'Not Ekleme', 'Randevu İşlemi', 'Cihaz İşlemi', 'Yeni Hasta', 'Diğer'] as const).map(tab => (
              <button
                key={tab}
                type="button"
                className={`${styles.categoryTabBtn} ${activeTab === tab ? styles.categoryTabBtnActive : ''}`}
                onClick={() => setActiveTab(tab)}
              >
                {tab}
              </button>
            ))}
          </div>

          <select
            className={styles.sortSelect}
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="Tarih (Yeni → Eski)">Tarih (Yeni → Eski)</option>
            <option value="Tarih (Eski → Yeni)">Tarih (Eski → Yeni)</option>
          </select>
        </div>
      </div>

      {/* ── Main Workspace (2-Column Layout) ── */}
      <div className={styles.workspaceLayout}>
        {/* Left Column: Activity Table */}
        <div className={styles.tableCard}>
          <div className={styles.tableContainer}>
            <table className={styles.activityTable}>
              <thead>
                <tr>
                  <th style={{ width: 34, textAlign: 'center' }}>
                    <input
                      type="checkbox"
                      checked={checkedIds.size === filteredActivities.length && filteredActivities.length > 0}
                      onChange={() => toggleAll(filteredActivities.map(a => a.id))}
                      style={{ width: 14, height: 14, accentColor: '#08785b', cursor: 'pointer' }}
                      aria-label="Tümünü seç"
                    />
                  </th>
                  <th>⇅ Tarih / Saat</th>
                  <th>Hasta</th>
                  <th>Aktivite Türü</th>
                  <th>Açıklama</th>
                  <th>Personel</th>
                  <th>Şube</th>
                  <th style={{ textAlign: 'center', width: 60 }}>İşlemler</th>
                </tr>
              </thead>
              <tbody>
                {pagedActivities.map((act) => {
                  const isSelected = selectedActId === act.id;
                  const isChecked = checkedIds.has(act.id);

                  const typePillClass = act.type === 'Telefon Araması' ? styles.typeCall
                    : act.type === 'Yüz Yüze Görüşme' ? styles.typeMeeting
                    : act.type === 'Not Ekleme' ? styles.typeNote
                    : act.type === 'Randevu İşlemi' ? styles.typeAppointment
                    : act.type === 'Cihaz İşlemi' ? styles.typeDevice
                    : styles.typeNewPatient;

                  const typeIcon = act.type === 'Telefon Araması' ? '📞'
                    : act.type === 'Yüz Yüze Görüşme' ? '👥'
                    : act.type === 'Not Ekleme' ? '📝'
                    : act.type === 'Randevu İşlemi' ? '📅'
                    : act.type === 'Cihaz İşlemi' ? '🦻'
                    : '👤';

                  return (
                    <tr
                      key={act.id}
                      className={isSelected ? styles.selectedRow : ''}
                      onClick={() => {
                        setSelectedActId(act.id);
                        setShowDetailPanel(true);
                      }}
                      style={{ cursor: 'pointer' }}
                    >
                      {/* Checkbox */}
                      <td style={{ textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleCheck(act.id)}
                          style={{ width: 14, height: 14, accentColor: '#08785b', cursor: 'pointer' }}
                          aria-label={`${act.patientName} aktivitesini seç`}
                        />
                      </td>

                      {/* Tarih / Saat */}
                      <td>
                        <div className={styles.timeCell}>
                          <div className={styles.timeIconBadge} style={{ background: '#eaf7f2', color: '#08785b' }}>
                            <IconClockSmall size={14} />
                          </div>
                          <div className={styles.timeText}>
                            <span className={styles.timeDate}>{act.dateStr}</span>
                            <span className={styles.timeHour}>{act.timeStr}</span>
                          </div>
                        </div>
                      </td>

                      {/* Hasta */}
                      <td>
                        <div className={styles.patientCell}>
                          <div className={styles.patientAvatar} style={{ background: act.patientAvatarColor }}>
                            {act.patientInitials}
                          </div>
                          <div className={styles.patientInfo}>
                            <span className={styles.patientName}>{act.patientName}</span>
                            <span className={styles.patientMeta}>{act.patientAge} yaş • {act.patientGender}</span>
                          </div>
                        </div>
                      </td>

                      {/* Aktivite Türü */}
                      <td>
                        <span className={`${styles.typePill} ${typePillClass}`}>
                          <span>{typeIcon}</span> {act.type}
                        </span>
                      </td>

                      {/* Açıklama */}
                      <td>
                        <div className={styles.descText} title={act.description}>
                          {act.description}
                        </div>
                      </td>

                      {/* Personel */}
                      <td>
                        <div className={styles.staffCell}>
                          <div className={styles.staffAvatar} style={{ background: act.staffAvatarColor }}>
                            {act.staffInitials}
                          </div>
                          <span className={styles.staffName}>{act.staffName}</span>
                        </div>
                      </td>

                      {/* Şube */}
                      <td>
                        <span className={styles.branchText}>{act.branchName}</span>
                      </td>

                      {/* İşlemler */}
                      <td style={{ textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          className={styles.actionBtnDots}
                          title="İşlem menüsünü aç"
                          aria-label={`${act.patientName} aktivite işlemleri`}
                          aria-haspopup="menu"
                          aria-expanded={activeActionMenu?.id === act.id}
                          onClick={(event) => {
                            if (activeActionMenu?.id === act.id) {
                              setActiveActionMenu(null);
                              return;
                            }
                            const rect = event.currentTarget.getBoundingClientRect();
                            const menuHeight = 88;
                            setActiveActionMenu({
                              id: act.id,
                              top: Math.max(8, Math.min(rect.bottom + 4, window.innerHeight - menuHeight - 8)),
                              left: Math.max(8, Math.min(rect.right - 184, window.innerWidth - 192)),
                            });
                          }}
                        >
                          <IconDotsVertical size={14} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Table Bottom Pagination Bar */}
          <div className={styles.tableBottomBar}>
            <div>
              Toplam <strong>{filteredActivities.length}</strong> kayıt | <strong>{checkedIds.size}</strong> kayıt seçili
            </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                {pageCount > 0 && <div className={styles.pagination}>
                  <button type="button" className={styles.pageBtn} disabled={currentPageIndex === 1} onClick={() => setCurrentPageIndex(1)} aria-label="İlk sayfa">«</button>
                  <button type="button" className={styles.pageBtn} disabled={currentPageIndex === 1} onClick={() => setCurrentPageIndex(page => Math.max(1, page - 1))} aria-label="Önceki sayfa">‹</button>
                  {visiblePageNumbers.map((page, index) => <React.Fragment key={page}>
                    {index > 0 && page - visiblePageNumbers[index - 1] > 1 && <span style={{ padding: '0 4px', color: '#94a3b8' }}>…</span>}
                    <button type="button" className={`${styles.pageBtn} ${currentPageIndex === page ? styles.pageBtnActive : ''}`} onClick={() => setCurrentPageIndex(page)} aria-current={currentPageIndex === page ? 'page' : undefined}>{page}</button>
                  </React.Fragment>)}
                  <button type="button" className={styles.pageBtn} disabled={currentPageIndex === pageCount} onClick={() => setCurrentPageIndex(page => Math.min(pageCount, page + 1))} aria-label="Sonraki sayfa">›</button>
                  <button type="button" className={styles.pageBtn} disabled={currentPageIndex === pageCount} onClick={() => setCurrentPageIndex(pageCount)} aria-label="Son sayfa">»</button>
                </div>}
                {filteredActivities.length > 0 && <select className={styles.sortSelect} value={pageSize} onChange={event => setPageSize(Number(event.target.value))} aria-label="Sayfa başına kayıt sayısı">
                  <option value={20}>20 / sayfa</option>
                  <option value={50}>50 / sayfa</option>
                </select>}
              </div>
          </div>

          {activeActionMenu && (() => {
            const menuRecord = activities.find(activity => activity.id === activeActionMenu.id);
            if (!menuRecord) return null;
            return <div
              ref={actionMenuRef}
              className={styles.rowActionMenu}
              role="menu"
              aria-label={`${menuRecord.patientName} aktivite işlemleri`}
              style={{ top: activeActionMenu.top, left: activeActionMenu.left }}
              onClick={event => event.stopPropagation()}
            >
              <button type="button" role="menuitem" onClick={() => {
                setSelectedActId(menuRecord.id);
                setShowDetailPanel(true);
                setActiveActionMenu(null);
              }}>Aktivite detayını gör</button>
              <button type="button" role="menuitem" disabled={!menuRecord.patientId} onClick={() => {
                if (menuRecord.patientId) {
                  setSelectedPatientId(menuRecord.patientId);
                  setCurrentPage('patient-detail');
                }
                setActiveActionMenu(null);
              }}>Hasta detayına git</button>
            </div>;
          })()}
        </div>

        {/* Right Column: Selected Patient Activity Detail Panel */}
        {showDetailPanel && activeRecord && (
          <aside className={styles.detailPanel} aria-label={`${activeRecord.patientName} aktivite detayı`}>
            {/* Header */}
            <div className={styles.panelHeader}>
              <div className={styles.panelHeaderIdentity}>
                <div className={styles.patientAvatar} style={{ background: activeRecord.patientAvatarColor }}>
                  {activeRecord.patientInitials}
                </div>
                <div className={styles.panelHeaderInfo}>
                  <strong>{activeRecord.patientName}</strong>
                  <span>{activeRecord.patientAge} yaş • {activeRecord.patientGender}</span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <button
                  type="button"
                  className={styles.btnPatientDetail}
                  onClick={() => {
                    if (activeRecord.patientId) setSelectedPatientId(activeRecord.patientId);
                    setCurrentPage('patient-detail');
                  }}
                >
                  Hasta Detayı
                </button>
                <button
                  type="button"
                  className={styles.panelCloseBtn}
                  onClick={() => setShowDetailPanel(false)}
                  title="Kapat"
                >
                  <IconClose size={14} />
                </button>
              </div>
            </div>

            {/* Tabs */}
            <nav className={styles.panelTabs}>
              <button
                type="button"
                className={`${styles.panelTab} ${panelTab === 'Genel' ? styles.panelTabActive : ''}`}
                onClick={() => setPanelTab('Genel')}
              >
                Genel
              </button>
              <button
                type="button"
                className={`${styles.panelTab} ${panelTab === 'Tüm Aktiviteleri' ? styles.panelTabActive : ''}`}
                onClick={() => setPanelTab('Tüm Aktiviteleri')}
              >
                Tüm Aktiviteleri (18)
              </button>
            </nav>

            {/* 1. Aktivite Detayı */}
            <div className={styles.panelSection}>
              <div className={styles.panelSectionHeader}>
                <span className={styles.panelSectionTitle}>Aktivite Detayı</span>
                <button
                  type="button"
                  className={styles.panelLinkBtn}
                  onClick={() => addToast({ type: 'info', message: 'Aktivite düzenleme penceresi açılıyor.' })}
                >
                  Düzenle
                </button>
              </div>

              <div className={styles.detailFieldList}>
                <div className={styles.detailFieldRow}>
                  <span className={styles.fieldLabel}>Tarih / Saat</span>
                  <span className={styles.fieldValue}>📅 {activeRecord.dateStr}, {activeRecord.timeStr}</span>
                </div>
                <div className={styles.detailFieldRow}>
                  <span className={styles.fieldLabel}>Aktivite Türü</span>
                  <span className={styles.fieldValue}>📞 {activeRecord.type}</span>
                </div>
                <div className={styles.detailFieldRow}>
                  <span className={styles.fieldLabel}>Personel</span>
                  <span className={styles.fieldValue}>👤 {activeRecord.staffName}</span>
                </div>
                <div className={styles.detailFieldRow}>
                  <span className={styles.fieldLabel}>Şube</span>
                  <span className={styles.fieldValue}>🏢 {activeRecord.branchName}</span>
                </div>
                <div className={styles.detailFieldRow}>
                  <span className={styles.fieldLabel}>Açıklama</span>
                  <span className={styles.fieldValue} style={{ fontSize: '10.5px', lineHeight: 1.4, color: '#4a5c68' }}>
                    📄 {activeRecord.description}
                  </span>
                </div>
              </div>
            </div>

            {/* 2. İlgili Randevu */}
            <div className={styles.panelSection}>
              <div className={styles.panelSectionHeader}>
                <span className={styles.panelSectionTitle}>İlgili Randevu</span>
                <button
                  type="button"
                  className={styles.panelLinkBtn}
                  onClick={() => setCurrentPage('appointments')}
                >
                  Görüntüle
                </button>
              </div>

              <div className={styles.relatedAptBox}>
                <div className={styles.relatedAptIcon}>
                  <IconCalendar size={15} />
                </div>
                <div className={styles.relatedAptText}>
                  <strong>{activeRecord.relatedAppointment?.date || '20 Eyl 2025, 15:00'}</strong>
                  <span>{activeRecord.relatedAppointment?.type || 'Kontrol'} - {activeRecord.relatedAppointment?.branch || activeRecord.branchName}</span>
                </div>
              </div>
            </div>

            {/* 3. Hızlı İşlemler (2x2 Grid) */}
            <div className={styles.panelSection} style={{ borderBottom: 'none' }}>
              <div className={styles.panelSectionHeader}>
                <span className={styles.panelSectionTitle}>Hızlı İşlemler</span>
              </div>

              <div className={styles.quickActionsGrid}>
                {/* 1. Tekrar Ara */}
                <button
                  type="button"
                  className={`${styles.btnQuickAction} ${styles.btnActionCall}`}
                  onClick={() => window.open(`tel:${activeRecord.patientPhone}`)}
                >
                  📞 Tekrar Ara
                </button>

                {/* 2. Randevu Oluştur */}
                <button
                  type="button"
                  className={`${styles.btnQuickAction} ${styles.btnActionApt}`}
                  onClick={() => {
                    if (activeRecord.patientId) setSelectedPatientId(activeRecord.patientId);
                    setCurrentPage('appointments');
                  }}
                >
                  📅 Randevu Oluştur
                </button>

                {/* 3. Not Ekle */}
                <button
                  type="button"
                  className={`${styles.btnQuickAction} ${styles.btnActionNote}`}
                  onClick={() => addToast({ type: 'info', message: `${activeRecord.patientName} için not ekleme açıldı.` })}
                >
                  📝 Not Ekle
                </button>

                {/* 4. WhatsApp Gönder */}
                <button
                  type="button"
                  className={`${styles.btnQuickAction} ${styles.btnActionWa}`}
                  onClick={() => {
                    const cleanPhone = activeRecord.patientPhone.replace(/\D/g, '');
                    window.open(`https://wa.me/${cleanPhone}`, '_blank');
                  }}
                >
                  💬 WhatsApp Gönder
                </button>
              </div>
            </div>
          </aside>
        )}
      </div>

      {/* ── Modal for New Activity ── */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" role="dialog" aria-modal="true" aria-labelledby="activity-create-title" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 480 }}>
            <div className="modal-header">
              <h3 id="activity-create-title">Yeni Aktivite Kaydı Gir</h3>
              <button type="button" className="btn btn-ghost btn-sm btn-icon" onClick={() => setShowModal(false)}>
                <IconClose size={16} />
              </button>
            </div>
            <form onSubmit={handleCreateActivity}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label htmlFor="activity-patient-search" style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#4a5c68', marginBottom: 4 }}>
                    Hasta Adı Soyadı *
                  </label>
                  <div className={styles.activityPatientSearch}>
                    <input
                      id="activity-patient-search"
                      type="text"
                      className="form-input"
                      placeholder="Hasta adı veya telefonuyla arayın..."
                      value={formPatientName}
                      onChange={(event) => {
                        setFormPatientName(event.target.value);
                        setFormPatientId(null);
                        setActivePatientSuggestionIndex(-1);
                        setIsPatientSuggestionsOpen(true);
                      }}
                      onFocus={() => { if (formPatientName.trim()) setIsPatientSuggestionsOpen(true); }}
                      onKeyDown={(event) => {
                        if (!isPatientSuggestionsOpen || patientSuggestions.length === 0) return;
                        if (event.key === 'ArrowDown') {
                          event.preventDefault();
                          setActivePatientSuggestionIndex(index => Math.min(index + 1, patientSuggestions.length - 1));
                        } else if (event.key === 'ArrowUp') {
                          event.preventDefault();
                          setActivePatientSuggestionIndex(index => Math.max(index - 1, 0));
                        } else if (event.key === 'Enter') {
                          event.preventDefault();
                          selectActivityPatient(patientSuggestions[Math.max(activePatientSuggestionIndex, 0)].id);
                        } else if (event.key === 'Escape') {
                          setIsPatientSuggestionsOpen(false);
                        }
                      }}
                      role="combobox"
                      aria-autocomplete="list"
                      aria-expanded={isPatientSuggestionsOpen && patientSuggestions.length > 0}
                      aria-controls="activity-patient-options"
                      aria-activedescendant={activePatientSuggestionIndex >= 0 && patientSuggestions[activePatientSuggestionIndex] ? `activity-patient-option-${patientSuggestions[activePatientSuggestionIndex].id}` : undefined}
                      autoComplete="off"
                      required
                      style={{ width: '100%', height: 38 }}
                    />
                    {isPatientSuggestionsOpen && formPatientName.trim() && <>
                      {patientSuggestions.length > 0 ? <div id="activity-patient-options" className={styles.activityPatientSuggestions} role="listbox">
                        {patientSuggestions.map((patient, index) => {
                          const fullName = `${patient.firstName} ${patient.lastName}`.trim();
                          return <button
                            key={patient.id}
                            id={`activity-patient-option-${patient.id}`}
                            type="button"
                            role="option"
                            aria-selected={activePatientSuggestionIndex === index}
                            className={`${styles.activityPatientSuggestion} ${activePatientSuggestionIndex === index ? styles.activityPatientSuggestionActive : ''}`}
                            onClick={() => selectActivityPatient(patient.id)}
                          >
                            <span className={styles.activityPatientAvatar} style={{ background: getAvatarColor(fullName) }}>{getInitials(patient.firstName, patient.lastName)}</span>
                            <span className={styles.activityPatientSuggestionInfo}><strong>{fullName}</strong><small>{patient.phone || 'Telefon bilgisi yok'}</small></span>
                          </button>;
                        })}
                      </div> : <div className={styles.activityPatientNoResults}>Eşleşen kayıtlı hasta bulunamadı. İsterseniz adı serbestçe girebilirsiniz.</div>}
                    </>}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#4a5c68', marginBottom: 4 }}>
                      Aktivite Türü *
                    </label>
                    <select
                      className="form-select"
                      value={formType}
                      onChange={(e) => setFormType(e.target.value as any)}
                      style={{ width: '100%', height: 38 }}
                    >
                      <option value="Telefon Araması">Telefon Araması</option>
                      <option value="Yüz Yüze Görüşme">Yüz Yüze Görüşme</option>
                      <option value="Not Ekleme">Not Ekleme</option>
                      <option value="Randevu İşlemi">Randevu İşlemi</option>
                      <option value="Cihaz İşlemi">Cihaz İşlemi</option>
                      <option value="Yeni Hasta">Yeni Hasta</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="activity-form-staff" style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#4a5c68', marginBottom: 4 }}>
                      Personel *
                    </label>
                    <select
                      id="activity-form-staff"
                      aria-label="Personel"
                      className="form-select"
                      value={formStaffId}
                      onChange={(e) => setFormStaffId(e.target.value)}
                      style={{ width: '100%', height: 38 }}
                      required
                      disabled={activityStaff.length === 0}
                    >
                      <option value="">{dataLoading ? 'Personeller yükleniyor…' : 'Aktif personel seçin'}</option>
                      {activityStaff.map(user => <option key={user.id} value={user.id}>{user.firstName} {user.lastName}</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <label htmlFor="activity-form-branch" style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#4a5c68', marginBottom: 4 }}>
                    Şube *
                  </label>
                  <select
                    id="activity-form-branch"
                    aria-label="Şube"
                    className="form-select"
                      value={formBranchId}
                      onChange={(e) => setFormBranchId(e.target.value)}
                    style={{ width: '100%', height: 38 }}
                      required
                      disabled={activityBranches.length === 0}
                  >
                    <option value="">{dataLoading ? 'Şubeler yükleniyor…' : activityBranches.length ? 'Şube seçin' : 'Önce Şube Yönetimi’nden şube ekleyin'}</option>
                    {activityBranches.map(branch => <option key={branch.id} value={branch.id}>{branch.name}</option>)}
                  </select>
                  {!dataLoading && activityBranches.length === 0 && (
                    <button
                      type="button"
                      className="btn btn-secondary"
                      style={{ marginTop: 8 }}
                      onClick={() => { setShowModal(false); setCurrentPage('branches'); }}
                    >
                      Şube Yönetimine Git
                    </button>
                  )}
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#4a5c68', marginBottom: 4 }}>
                    Açıklama / Not *
                  </label>
                  <textarea
                    className="form-input"
                    rows={3}
                    placeholder="Görüşme veya işlem özetini girin..."
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    required
                    style={{ width: '100%', resize: 'none' }}
                  />
                </div>
              </div>

              <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 16 }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Vazgeç
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ background: '#08785b', borderColor: '#08785b' }}
                >
                  Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
