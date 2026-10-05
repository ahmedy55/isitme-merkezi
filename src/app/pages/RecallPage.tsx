'use client';

import React, { useMemo, useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { getAvatarColor, getInitials, calculateAge, formatCurrency, formatDate, type RecallItem } from '../data/mockData';
import { IconCalendar, IconCheck, IconSearch, IconClose, IconPlus, IconPhone, IconMail } from '../components/Icons';
import { getRecallCounts, isRecallOverdue } from '../lib/recallStats';
import styles from './RecallPage.module.css';

/* ── Inline SVG Icons ── */
function IconAlarmClock({ size = 26 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="13" r="8"/>
      <path d="M12 9v4l2 2"/>
      <path d="M5 3L2 6"/>
      <path d="M22 6l-3-3"/>
      <path d="M6.38 18.7 4 21"/>
      <path d="M17.64 18.67 20 21"/>
    </svg>
  );
}

function IconCalendarSmall({ size = 15 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect width="18" height="18" x="3" y="4" rx="2" ry="2"/>
      <line x1="16" x2="16" y1="2" y2="6"/>
      <line x1="8" x2="8" y1="2" y2="6"/>
      <line x1="3" x2="21" y1="10" y2="10"/>
    </svg>
  );
}

function IconPhoneCall({ size = 15 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15.05 5A5 5 0 0 1 19 8.95M15.05 1A9 9 0 0 1 23 8.94m-1 7.98v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92Z"/>
    </svg>
  );
}

function IconWhatsApp({ size = 15 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#25d366" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
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

function IconAlertTriangle({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
      <line x1="12" y1="9" x2="12" y2="13"/>
      <line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  );
}

function IconChevronDown({ size = 13 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9"/>
    </svg>
  );
}

function IconFilter({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
    </svg>
  );
}

function IconHearingDevice({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 8.5a6.5 6.5 0 1 1 13 0c0 6-6 6-6 10a3.5 3.5 0 1 1-7 0"/>
      <path d="M15 8.5a2.5 2.5 0 0 0-5 0v2"/>
    </svg>
  );
}

interface ShowcaseRecall {
  id: string;
  patientId: string;
  patientName: string;
  patientAge: number;
  patientGender: string;
  patientPhone: string;
  patientEmail: string;
  patientAddress: string;
  patientDevice: string;
  patientDeviceSn: string;
  patientInitials: string;
  avatarColor: string;
  typeTitle: string;
  typeSub: string;
  planDate: string;
  planTime: string;
  overdueText?: string;
  status: 'Tarihi Geçti' | 'Bekliyor' | 'Gönderildi' | 'Randevu Alındı' | 'Tamamlandı' | 'İptal Edildi';
  branchName?: string;
  lastAction: string;
}



export default function RecallPage() {
  const { recallList, patientsList, appointmentsList, stockList, salesList, branchesList, currentOrgId, addToast, setCurrentPage, setSelectedPatientId, requestAppointmentCreation, addRecallItem, updateRecallItemStatus } = useApp();

  // Selected tab: 'Tümü' | 'Bekliyor' | 'Gönderildi' | 'Randevu Alındı' | 'Tamamlandı' | 'İptal Edildi'
  const [activeTab, setActiveTab] = useState<'Tümü' | 'Bekliyor' | 'Gönderildi' | 'Randevu Alındı' | 'Tamamlandı' | 'İptal Edildi' | 'Tarihi Geçen'>('Tümü');

  // Search & Filter fields
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('Tümü');
  const [filterBranch, setFilterBranch] = useState('Tümü');
  const [filterDateRange, setFilterDateRange] = useState('');
  const [recallPageNumber, setRecallPageNumber] = useState(1);
  const pageSize = 10;
  const todayDate = new Date();
  const todayDateKey = `${todayDate.getFullYear()}-${String(todayDate.getMonth() + 1).padStart(2, '0')}-${String(todayDate.getDate()).padStart(2, '0')}`;

  // Selected patient for detail drawer
  const [selectedRecallId, setSelectedRecallId] = useState<string>('');
  const [showDetailPanel, setShowDetailPanel] = useState<boolean>(false);
  const [panelTab, setPanelTab] = useState<'Genel' | 'Cihazlar' | 'Hatırlatmalar' | 'Randevular' | 'İşlemler'>('Genel');

  // Checkbox selections
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set(['rec-1']));

  // Modal for New Recall
  const [showNewModal, setShowNewModal] = useState<boolean>(false);
  const [newPatientId, setNewPatientId] = useState('');
  const [newPatientName, setNewPatientName] = useState('');
  const [isPatientSearchOpen, setIsPatientSearchOpen] = useState(false);
  const [activePatientSuggestionIndex, setActivePatientSuggestionIndex] = useState(-1);
  const [newRecallType, setNewRecallType] = useState('Pil değişimi');
  const [newDueDate, setNewDueDate] = useState('');
  const [newNotes, setNewNotes] = useState('');

  // Dropdown for row action
  const [activeActionMenuId, setActiveActionMenuId] = useState<string | null>(null);
  const actionMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!activeActionMenuId) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (!actionMenuRef.current?.contains(event.target as Node)) setActiveActionMenuId(null);
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setActiveActionMenuId(null);
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [activeActionMenuId]);

  const toggleCheck = (id: string) => {
    setCheckedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleAllChecks = (allIds: string[]) => {
    setCheckedIds(prev => prev.size === allIds.length ? new Set() : new Set(allIds));
  };

  // Convert live recallList items to ShowcaseRecall format and merge
  const allRecalls = useMemo<ShowcaseRecall[]>(() => {
    const liveConverted: ShowcaseRecall[] = recallList.map(item => {
      const p = patientsList.find(pt => pt.id === item.patientId || `${pt.firstName} ${pt.lastName}` === item.patientName);
      return {
        id: item.id,
        patientId: item.patientId,
        patientName: item.patientName,
        patientAge: p?.birthDate ? calculateAge(p.birthDate) : 0,
        patientGender: p?.gender || 'Belirtilmemiş',
        patientPhone: p?.phone || '—',
        patientEmail: p?.email || '',
        patientAddress: p?.address || '—',
        patientDevice: p?.currentDevice || '—',
        patientDeviceSn: '—',
        patientInitials: getInitials(item.patientName, ''),
        avatarColor: getAvatarColor(item.patientName),
        typeTitle: item.reason,
        typeSub: `(${item.probability || 'Planlandı'})`,
        planDate: item.dueDate || '—',
        planTime: '10:00',
        status: item.status as ShowcaseRecall['status'],
        branchName: p?.branch || '',
        lastAction: item.lastContact ? `Son temas: ${item.lastContact}` : '—',
      };
    });
    return liveConverted;
  }, [recallList, patientsList]);

  // Filtered rows
  const filteredRecalls = useMemo(() => {
    return allRecalls.filter(item => {
      // Tab filter
      if (activeTab !== 'Tümü') {
        if (activeTab === 'Tarihi Geçen') {
          if (!isRecallOverdue(item, todayDateKey)) return false;
        } else if (activeTab === 'Bekliyor') {
          if (item.status !== 'Bekliyor' || isRecallOverdue(item, todayDateKey)) return false;
        } else if (item.status !== activeTab) {
          return false;
        }
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = item.patientName.toLowerCase().includes(q);
        const matchPhone = item.patientPhone.includes(q);
        const matchDevice = item.patientDevice.toLowerCase().includes(q) || item.patientDeviceSn.toLowerCase().includes(q);
        if (!matchName && !matchPhone && !matchDevice) return false;
      }

      // Type filter
      if (filterType !== 'Tümü') {
        if (!item.typeTitle.toLowerCase().includes(filterType.toLowerCase())) return false;
      }

      if (filterBranch !== 'Tümü' && item.branchName !== filterBranch) return false;

      if (filterDateRange.trim()) {
        const [from, to] = filterDateRange.split('→').map(value => value.trim());
        const toISO = (value: string) => {
          const parsed = Date.parse(value);
          return Number.isNaN(parsed) ? '' : new Date(parsed).toISOString().slice(0, 10);
        };
        const recallDate = /^\d{4}-\d{2}-\d{2}$/.test(item.planDate) ? item.planDate : toISO(item.planDate);
        const fromISO = toISO(from || '');
        const toDateISO = toISO(to || '');
        if (fromISO && recallDate < fromISO) return false;
        if (toDateISO && recallDate > toDateISO) return false;
      }

      return true;
    });
  }, [allRecalls, activeTab, searchQuery, filterType, filterBranch, filterDateRange, todayDateKey]);

  const recallCounts = useMemo(() => getRecallCounts(allRecalls, todayDateKey), [allRecalls, todayDateKey]);
  const patientSuggestions = useMemo(() => {
    const query = newPatientName.trim().toLocaleLowerCase('tr-TR');
    if (!query) return [];
    const digits = query.replace(/\D/g, '');
    return patientsList
      .filter(patient => {
        const name = `${patient.firstName} ${patient.lastName}`.toLocaleLowerCase('tr-TR');
        const phone = (patient.phone || '').replace(/\D/g, '');
        return name.includes(query) || (digits.length >= 3 && phone.includes(digits));
      })
      .slice(0, 8);
  }, [newPatientName, patientsList]);
  const pageCount = Math.max(1, Math.ceil(filteredRecalls.length / pageSize));
  const paginatedRecalls = filteredRecalls.slice((recallPageNumber - 1) * pageSize, recallPageNumber * pageSize);

  useEffect(() => {
    setRecallPageNumber(1);
  }, [activeTab, searchQuery, filterType, filterBranch, filterDateRange]);

  useEffect(() => {
    if (recallPageNumber > pageCount) setRecallPageNumber(pageCount);
  }, [recallPageNumber, pageCount]);

  const activeRecall = allRecalls.find(r => r.id === selectedRecallId) || allRecalls[0];
  const activePatient = activeRecall ? patientsList.find(patient => patient.id === activeRecall.patientId) : undefined;
  const patientDevices = activeRecall ? stockList.filter(item => item.assignedPatientId === activeRecall.patientId) : [];
  const patientAppointments = activeRecall
    ? appointmentsList.filter(item => item.patientId === activeRecall.patientId).sort((a, b) => `${b.date} ${b.time}`.localeCompare(`${a.date} ${a.time}`))
    : [];
  const patientRecalls = activeRecall
    ? recallList.filter(item => item.patientId === activeRecall.patientId || (!item.patientId && item.patientName === activeRecall.patientName)).sort((a, b) => b.dueDate.localeCompare(a.dueDate))
    : [];
  const patientSales = activeRecall
    ? salesList.filter(item => item.patientId === activeRecall.patientId).sort((a, b) => b.date.localeCompare(a.date))
    : [];

  const handleOpenAppointment = (patientId: string) => {
    setSelectedPatientId(patientId);
    requestAppointmentCreation(patientId);
    setCurrentPage('appointments');
  };

  const handleSendReminder = (patientName: string) => {
    if (activeRecall) {
      updateRecallItemStatus(activeRecall.id, 'Gönderildi');
    }
    addToast({ type: 'success', message: `${patientName} için hatırlatma bildirimi başarıyla gönderildi.` });
  };

  return (
    <div className={`page ${styles.recallPage}`}>
      {/* ── Page Header ── */}
      <div className={styles.pageHeading}>
        <div className={styles.headingCopy}>
          <div className={styles.headingIcon}>
            <IconAlarmClock size={28} />
          </div>
          <div>
            <div className={styles.breadcrumb}>
              Recall <span>&gt;</span> Recall / Hatırlatmalar
            </div>
            <h1>Recall / Hatırlatmalar</h1>
            <p>Hasta kayıtlarına bağlı hatırlatma ve takip süreçlerini yönetin.</p>
          </div>
        </div>

        <div className={styles.headerActions}>
          <button
            type="button"
            className={styles.btnNewRecall}
            onClick={() => setShowNewModal(true)}
            id="btn-new-recall"
          >
            <IconPlus size={15} strokeWidth={2.5} /> Yeni Hatırlatma <IconChevronDown size={13} />
          </button>
        </div>
      </div>

      {/* ── 4 Stat Metric Cards ── */}
      <div className={styles.statsGrid}>
        {/* 1. Toplam Hatırlatma */}
        <div className={styles.statCard} onClick={() => setActiveTab('Tümü')}>
          <div className={`${styles.statIcon} ${styles.iconBlue}`}>
            <IconCalendarSmall size={22} />
          </div>
          <div>
            <span>Toplam Hatırlatma</span>
            <strong>{recallCounts.total}</strong>
          </div>
        </div>

        {/* 2. Bekleyen */}
        <div className={styles.statCard} onClick={() => setActiveTab('Bekliyor')}>
          <div className={`${styles.statIcon} ${styles.iconOrange}`}>
            <IconAlarmClock size={22} />
          </div>
          <div>
            <span>Bekleyen</span>
            <strong>{recallCounts.pending}</strong>
            <small style={{ color: '#d97706', fontWeight: 600 }}>● hatırlatılacak</small>
          </div>
        </div>

        {/* 3. Gönderildi */}
        <div className={styles.statCard} onClick={() => setActiveTab('Gönderildi')}>
          <div className={`${styles.statIcon} ${styles.iconGreen}`}>
            <IconCheck size={22} />
          </div>
          <div>
            <span>Gönderildi</span>
            <strong>{recallCounts.sent}</strong>
            <small>Gönderilen kayıtlar</small>
          </div>
        </div>

        {/* 4. Tarihi Geçen */}
        <div className={styles.statCard} onClick={() => setActiveTab('Tarihi Geçen')}>
          <div className={`${styles.statIcon} ${styles.iconRed}`}>
            <IconAlertTriangle size={22} />
          </div>
          <div>
            <span>Tarihi Geçen</span>
            <strong style={{ color: '#df4c4c' }}>{recallCounts.overdue}</strong>
            <small style={{ color: '#ef4444', fontWeight: 600 }}>● acil işlem gerekli</small>
          </div>
        </div>
      </div>

      {/* ── Filter Tabs & Search Bar ── */}
      <div className={styles.filterCard}>
        {/* Status Tabs */}
        <div className={styles.statusTabsRow}>
          <div className={styles.statusTabs}>
            {(['Tümü', 'Bekliyor', 'Gönderildi', 'Randevu Alındı', 'Tamamlandı', 'İptal Edildi', 'Tarihi Geçen'] as const).map(tab => (
              <button
                key={tab}
                type="button"
                className={`${styles.statusTabBtn} ${activeTab === tab ? styles.statusTabBtnActive : ''}`}
                onClick={() => setActiveTab(tab)}
              >
                {tab}
              </button>
            ))}
          </div>

          <button
            type="button"
            className={styles.btnMoreFilters}
            onClick={() => addToast({ type: 'info', message: 'Filtre seçenekleri görüntülendi.' })}
          >
            <IconFilter size={13} /> Filtrele <IconChevronDown size={12} />
          </button>
        </div>

        {/* Search & Select Inputs */}
        <div className={styles.searchInputsRow}>
          <div className={styles.searchInputWrap}>
            <span className={styles.searchIcon}><IconSearch size={15} /></span>
            <input
              type="text"
              className={styles.searchInput}
              placeholder="Hasta adı, telefon, TC veya cihaz seri no..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <select
            className={styles.filterSelect}
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            aria-label="Hatırlatma Türü"
          >
            <option value="Tümü">Hatırlatma Türü: Tümü</option>
            <option value="Pil">Pil Değişimi</option>
            <option value="Cihaz">Cihaz Kontrolü / Ayarı</option>
            <option value="Temizlik">Temizlik & Bakım</option>
            <option value="Muayene">Kontrol Muayenesi</option>
            <option value="Servis">Teknik Servis</option>
          </select>

          <select
            className={styles.filterSelect}
            value={filterBranch}
            onChange={(e) => setFilterBranch(e.target.value)}
            aria-label="Şube Seçimi"
          >
            <option value="Tümü">Şube: Tümü</option>
            {branchesList.map(b => (
              <option key={b.id} value={b.name}>{b.name}</option>
            ))}
          </select>

          <input
            type="text"
            className={styles.dateRangeInput}
            placeholder="Tarih Aralığı: Başlangıç → Bitiş 📅"
            value={filterDateRange}
            onChange={(e) => setFilterDateRange(e.target.value)}
          />
        </div>
      </div>

      {/* ── Main Workspace (2-Column Layout) ── */}
      <div className={styles.workspaceLayout}>
        {/* Left Column: Recall Table */}
        <div className={styles.tableCard}>
          <div className={styles.tableContainer}>
            <table className={styles.recallTable}>
              <thead>
                <tr>
                  <th style={{ width: 36, textAlign: 'center' }}>
                    <input
                      type="checkbox"
                      checked={checkedIds.size === filteredRecalls.length && filteredRecalls.length > 0}
                      onChange={() => toggleAllChecks(filteredRecalls.map(r => r.id))}
                      style={{ width: 15, height: 15, accentColor: '#08785b', cursor: 'pointer' }}
                      aria-label="Tümünü seç"
                    />
                  </th>
                  <th>Hasta</th>
                  <th>Hatırlatma Türü</th>
                  <th>Planlanan Tarih</th>
                  <th>Durum</th>
                  <th>Son İşlem</th>
                  <th style={{ textAlign: 'center', width: 140 }}>İşlemler</th>
                </tr>
              </thead>
              <tbody>
                {filteredRecalls.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '28px 16px', color: 'var(--text-muted)' }}>
                      Filtrelere uyan hatırlatma bulunamadı.
                    </td>
                  </tr>
                ) : paginatedRecalls.map((recall) => {
                  const isSelected = selectedRecallId === recall.id;
                  const isChecked = checkedIds.has(recall.id);
                  const recallIsOverdue = isRecallOverdue(recall, todayDateKey);

                  const statusClass = recallIsOverdue ? styles.statusOverdue
                    : recall.status === 'Bekliyor' ? styles.statusBekliyor
                    : recall.status === 'Randevu Alındı' ? styles.statusRandevu
                    : recall.status === 'Tamamlandı' ? styles.statusDone
                    : styles.statusCanceled;

                  return (
                    <tr
                      key={recall.id}
                      className={isSelected ? styles.selectedRow : ''}
                      onClick={() => {
                        setSelectedRecallId(recall.id);
                        setShowDetailPanel(true);
                      }}
                      style={{ cursor: 'pointer' }}
                    >
                      {/* Checkbox */}
                      <td style={{ textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleCheck(recall.id)}
                          style={{ width: 15, height: 15, accentColor: '#08785b', cursor: 'pointer' }}
                          aria-label={`${recall.patientName} seç`}
                        />
                      </td>

                      {/* Hasta */}
                      <td>
                        <div className={styles.patientCell}>
                          <div className={styles.patientAvatar} style={{ background: recall.avatarColor }}>
                            {recall.patientInitials}
                          </div>
                          <div className={styles.patientInfo}>
                            <span className={styles.patientName}>{recall.patientName}</span>
                            <span className={styles.patientMeta}>{recall.patientAge} yaş • {recall.patientGender}</span>
                            <span className={styles.patientPhone}>📞 {recall.patientPhone}</span>
                          </div>
                        </div>
                      </td>

                      {/* Hatırlatma Türü */}
                      <td>
                        <div className={styles.recallTypeTitle}>{recall.typeTitle}</div>
                        <div className={styles.recallTypeSub}>{recall.typeSub}</div>
                      </td>

                      {/* Planlanan Tarih */}
                      <td>
                        <div className={styles.planDate}>{recall.planDate}</div>
                        <div className={styles.planTime}>{recall.planTime}</div>
                        {recall.overdueText && (
                          <div className={styles.planOverdue}>● {recall.overdueText}</div>
                        )}
                      </td>

                      {/* Durum */}
                      <td>
                        <span className={`${styles.statusPill} ${statusClass}`}>
                          {recallIsOverdue ? 'Tarihi Geçti' : recall.status}
                        </span>
                      </td>

                      {/* Son İşlem */}
                      <td style={{ fontSize: '11px', color: '#51636d' }}>
                        {recall.lastAction}
                      </td>

                      {/* 4 İşlem Butonları */}
                      <td style={{ textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                        <div className={styles.actionBtnGroup}>
                          {/* 1. Takvim / Randevu */}
                          <button
                            type="button"
                            className={styles.actionBtn}
                            title="Randevu Oluştur"
                            onClick={() => handleOpenAppointment(recall.patientId)}
                          >
                            <IconCalendarSmall size={14} />
                          </button>
                          {/* 2. Telefon */}
                          <button
                            type="button"
                            className={styles.actionBtn}
                            title="Ara"
                            onClick={() => window.open(`tel:${recall.patientPhone}`)}
                          >
                            <IconPhoneCall size={14} />
                          </button>
                          {/* 3. WhatsApp (Yeşil) */}
                          <button
                            type="button"
                            className={`${styles.actionBtn} ${styles.actionBtnWa}`}
                            title="WhatsApp Gönder"
                            onClick={() => {
                              const cleanPhone = recall.patientPhone.replace(/\D/g, '');
                              window.open(`https://wa.me/${cleanPhone}`, '_blank');
                            }}
                          >
                            <IconWhatsApp size={14} />
                          </button>
                          {/* 4. Üç Nokta */}
                          <div className={styles.actionMenuWrap} ref={activeActionMenuId === recall.id ? actionMenuRef : undefined}>
                            <button
                              type="button"
                              className={styles.actionBtn}
                              title="Diğer İşlemler"
                              aria-label={`${recall.patientName} için diğer işlemler`}
                              aria-haspopup="menu"
                              aria-expanded={activeActionMenuId === recall.id}
                              onClick={() => setActiveActionMenuId(current => current === recall.id ? null : recall.id)}
                            >
                              <IconDotsVertical size={14} />
                            </button>
                            {activeActionMenuId === recall.id && (
                              <div className={styles.actionMenu} role="menu" aria-label={`${recall.patientName} hatırlatma işlemleri`}>
                                <button
                                  type="button"
                                  role="menuitem"
                                  onClick={() => {
                                    setSelectedRecallId(recall.id);
                                    setShowDetailPanel(true);
                                    setActiveActionMenuId(null);
                                  }}
                                >Detayları Gör</button>
                                {recall.status !== 'Gönderildi' && recall.status !== 'Tamamlandı' && (
                                  <button
                                    type="button"
                                    role="menuitem"
                                    onClick={() => {
                                      updateRecallItemStatus(recall.id, 'Gönderildi');
                                      addToast({ type: 'success', message: `${recall.patientName} için hatırlatma bildirimi başarıyla gönderildi.` });
                                      setActiveActionMenuId(null);
                                    }}
                                  >Hatırlatmayı Gönderildi İşaretle</button>
                                )}
                                {recall.status !== 'Tamamlandı' && (
                                  <button
                                    type="button"
                                    role="menuitem"
                                    onClick={() => {
                                      updateRecallItemStatus(recall.id, 'Tamamlandı');
                                      addToast({ type: 'success', message: `${recall.patientName} hatırlatması tamamlandı olarak işaretlendi.` });
                                      setActiveActionMenuId(null);
                                    }}
                                  >Tamamlandı Olarak İşaretle</button>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Bottom Count and Pagination Bar */}
          <div className={styles.tableBottomBar}>
            <div>
              Toplam <strong>{filteredRecalls.length}</strong> kayıt | Sayfada <strong>{paginatedRecalls.length}</strong> kayıt gösteriliyor
            </div>
            {pageCount > 1 && <div className={styles.pagination}>
              <button type="button" className={styles.pageBtn} disabled={recallPageNumber === 1} onClick={() => setRecallPageNumber(page => Math.max(1, page - 1))} aria-label="Önceki sayfa">&lt;</button>
              {Array.from({ length: pageCount }, (_, index) => index + 1).map(page => (
                <button key={page} type="button" className={`${styles.pageBtn} ${recallPageNumber === page ? styles.pageBtnActive : ''}`} onClick={() => setRecallPageNumber(page)} aria-current={recallPageNumber === page ? 'page' : undefined}>{page}</button>
              ))}
              <button type="button" className={styles.pageBtn} disabled={recallPageNumber === pageCount} onClick={() => setRecallPageNumber(page => Math.min(pageCount, page + 1))} aria-label="Sonraki sayfa">&gt;</button>
            </div>}
          </div>
        </div>

        {/* Right Column: Selected Patient Detail Drawer */}
        {showDetailPanel && activeRecall && (
          <aside className={styles.detailPanel} aria-label={`${activeRecall.patientName} detayları`}>
            {/* Header */}
            <div className={styles.panelHeader}>
              <div className={styles.panelHeaderIdentity}>
                <div className={styles.patientAvatar} style={{ background: activeRecall.avatarColor }}>
                  {activeRecall.patientInitials}
                </div>
                <div className={styles.panelHeaderInfo}>
                  <strong>{activeRecall.patientName}</strong>
                  <span>{activeRecall.patientAge} yaş • {activeRecall.patientGender}</span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className="badge badge-success" style={{ borderRadius: 12, padding: '2px 8px', fontSize: '10px' }}>
                  Aktif
                </span>
                <button
                  type="button"
                  className={styles.panelCloseBtn}
                  onClick={() => setShowDetailPanel(false)}
                  title="Paneli Kapat"
                >
                  <IconClose size={14} />
                </button>
              </div>
            </div>

            {/* Tabs */}
            <nav className={styles.panelTabs} role="tablist" aria-label="Hasta detay sekmeleri">
              {(['Genel', 'Cihazlar', 'Hatırlatmalar', 'Randevular', 'İşlemler'] as const).map(tab => (
                <button
                  key={tab}
                  type="button"
                  role="tab"
                  aria-selected={panelTab === tab}
                  id={`recall-patient-tab-${tab}`}
                  aria-controls="recall-patient-tabpanel"
                  className={`${styles.panelTab} ${panelTab === tab ? styles.panelTabActive : ''}`}
                  onClick={() => setPanelTab(tab)}
                >
                  {tab}
                </button>
              ))}
            </nav>

            <div id="recall-patient-tabpanel" role="tabpanel" aria-labelledby={`recall-patient-tab-${panelTab}`} className={styles.panelTabPanel}>
            {panelTab === 'Genel' && <>
            {/* 1. İletişim Bilgileri */}
            <div className={styles.panelSection}>
              <div className={styles.panelSectionHeader}>
                <span className={styles.panelSectionTitle}>İletişim Bilgileri</span>
                <button
                  type="button"
                  className={styles.panelLinkBtn}
                  onClick={() => {
                    setSelectedPatientId(activeRecall.patientId);
                    setCurrentPage('patient-detail');
                  }}
                >
                  Düzenle
                </button>
              </div>
              <div className={styles.contactList}>
                <div className={styles.contactItem}>
                  <IconPhone size={13} />
                  <span>{activeRecall.patientPhone}</span>
                </div>
                <div className={styles.contactItem}>
                  <IconMail size={13} />
                  <span>{activeRecall.patientEmail || 'E-posta bilgisi yok'}</span>
                </div>
                <div className={styles.contactItem}>
                  <span style={{ fontSize: '12px' }}>📍</span>
                  <span>{activeRecall.patientAddress && activeRecall.patientAddress !== '—' ? activeRecall.patientAddress : 'Adres bilgisi yok'}</span>
                </div>
              </div>
            </div>

            {/* 2. Cihaz Bilgileri */}
            <div className={styles.panelSection}>
              <div className={styles.panelSectionHeader}>
                <span className={styles.panelSectionTitle}>Cihaz Bilgileri</span>
                <button
                  type="button"
                  className={styles.panelLinkBtn}
                  onClick={() => {
                    setSelectedPatientId(activeRecall.patientId);
                    setCurrentPage('patient-detail');
                  }}
                >
                  Tümünü Gör
                </button>
              </div>
              <div className={styles.deviceBox}>
                <div className={styles.deviceInfo}>
                  <IconHearingDevice size={22} />
                  <div>
                    <div className={styles.deviceName}>{activeRecall.patientDevice}</div>
                    <div className={styles.deviceSn}>SN: {activeRecall.patientDeviceSn}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 4 }}>
                  <span className="badge badge-info" style={{ fontSize: '9px', padding: '1px 5px' }}>Sağ</span>
                  <span className="badge badge-success" style={{ fontSize: '9px', padding: '1px 5px' }}>Aktif</span>
                </div>
              </div>
            </div>

            {/* 3. Yaklaşan Hatırlatma */}
            <div className={styles.panelSection}>
              <div className={styles.panelSectionHeader}>
                <span className={styles.panelSectionTitle}>Yaklaşan Hatırlatma</span>
                  <button type="button" className={styles.panelLinkBtn} onClick={() => setPanelTab('Hatırlatmalar')}>
                  Detay <IconChevronDown size={11} />
                </button>
              </div>

              <div className={styles.upcomingCard}>
                <div className={styles.upcomingCardTop}>
                  <div className={styles.upcomingCardLeft}>
                    <div className={styles.upcomingIcon}>
                      <IconCalendarSmall size={16} />
                    </div>
                    <div>
                      <div className={styles.upcomingTitle}>{activeRecall.typeTitle}</div>
                      <div className={styles.upcomingSub}>{activeRecall.typeSub}</div>
                      <div className={styles.upcomingDate}>{activeRecall.planDate}, {activeRecall.planTime}</div>
                    </div>
                  </div>
                  {activeRecall.overdueText && (
                    <span className={styles.upcomingOverdueBadge}>
                      {activeRecall.overdueText}
                    </span>
                  )}
                </div>

                <div className={styles.upcomingActions}>
                  <button
                    type="button"
                    className={styles.btnCreateAppointment}
                    onClick={() => handleOpenAppointment(activeRecall.patientId)}
                  >
                    <IconCalendarSmall size={12} /> Randevu Oluştur
                  </button>
                  <button
                    type="button"
                    className={styles.btnSendReminder}
                    onClick={() => handleSendReminder(activeRecall.patientName)}
                  >
                    🔔 Hatırlatmayı Gönder
                  </button>
                  <button
                    type="button"
                    style={{ fontSize: '11px', fontWeight: 600, padding: '7px 12px', background: '#10b981', color: '#fff', border: 'none', borderRadius: 7, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
                    onClick={() => {
                      updateRecallItemStatus(activeRecall.id, 'Tamamlandı');
                      addToast({ type: 'success', message: `${activeRecall.patientName} hatırlatması tamamlandı olarak işaretlendi.` });
                    }}
                  >
                    ✓ Tamamlandı
                  </button>
                </div>
              </div>
            </div>

            {/* 4. Son İşlemler */}
            <div className={styles.panelSection} style={{ borderBottom: 'none' }}>
              <div className={styles.panelSectionHeader}>
                <span className={styles.panelSectionTitle}>Son İşlemler</span>
                <button
                  type="button"
                  className={styles.panelLinkBtn}
                  onClick={() => {
                    setSelectedPatientId(activeRecall.patientId);
                    setCurrentPage('patient-detail');
                  }}
                >
                  Tümünü Gör
                </button>
              </div>

              <div className={styles.actionTimeline}>
                {activeRecall.lastAction && activeRecall.lastAction !== '—' ? (
                  <div className={styles.actionTimelineItem}>
                    <div className={styles.actionTimelineIcon}>◷</div>
                    <div className={styles.actionTimelineText}>
                      <strong>Hatırlatma için son temas</strong>
                      <span>{activeRecall.lastAction.replace('Son temas: ', '')}</span>
                    </div>
                  </div>
                ) : <p className={styles.panelEmptyState}>Bu hatırlatma için henüz işlem kaydı yok.</p>}
              </div>
            </div>
            </>}

            {panelTab === 'Cihazlar' && <div className={styles.panelSection}>
              <div className={styles.panelSectionHeader}><span className={styles.panelSectionTitle}>Kayıtlı Cihazlar</span><span className={styles.panelCount}>{patientDevices.length || (activePatient?.currentDevice ? 1 : 0)}</span></div>
              {patientDevices.length > 0 ? <div className={styles.panelRecordList}>{patientDevices.map(device => (
                <article key={device.id} className={styles.panelRecordCard}>
                  <div className={styles.panelRecordHeader}><strong>{device.brand} {device.model || device.name}</strong><span className="badge badge-success">{device.status}</span></div>
                  <div className={styles.panelRecordMeta}>Seri No: {device.serialNo || '—'} · Kulak: {device.assignedEar || 'Belirtilmemiş'}</div>
                  <div className={styles.panelRecordMeta}>Şube: {device.branch || '—'}</div>
                </article>
              ))}</div> : activePatient?.currentDevice ? <div className={styles.deviceBox}><div className={styles.deviceInfo}><IconHearingDevice size={22}/><div><div className={styles.deviceName}>{activePatient.currentDevice}</div><div className={styles.deviceSn}>Seri No: —</div></div></div><span className="badge badge-success">Aktif</span></div> : <p className={styles.panelEmptyState}>Bu hasta için kayıtlı cihaz bulunmuyor.</p>}
            </div>}

            {panelTab === 'Hatırlatmalar' && <div className={styles.panelSection}>
              <div className={styles.panelSectionHeader}><span className={styles.panelSectionTitle}>Hatırlatma Geçmişi</span><span className={styles.panelCount}>{patientRecalls.length}</span></div>
              {patientRecalls.length ? <div className={styles.panelRecordList}>{patientRecalls.map(item => (
                <article key={item.id} className={styles.panelRecordCard}>
                  <div className={styles.panelRecordHeader}><strong>{item.reason}</strong><span className={styles.panelStatus}>{item.status}</span></div>
                  <div className={styles.panelRecordMeta}>Planlanan: {formatDate(item.dueDate)}</div>
                  {item.lastContact && <div className={styles.panelRecordMeta}>Son temas: {item.lastContact}</div>}
                </article>
              ))}</div> : <p className={styles.panelEmptyState}>Bu hasta için hatırlatma kaydı bulunmuyor.</p>}
            </div>}

            {panelTab === 'Randevular' && <div className={styles.panelSection}>
              <div className={styles.panelSectionHeader}><span className={styles.panelSectionTitle}>Randevu Geçmişi</span><span className={styles.panelCount}>{patientAppointments.length}</span></div>
              {patientAppointments.length ? <div className={styles.panelRecordList}>{patientAppointments.map(item => (
                <article key={item.id} className={styles.panelRecordCard}>
                  <div className={styles.panelRecordHeader}><strong>{formatDate(item.date)} · {item.time}</strong><span className={styles.panelStatus}>{item.status}</span></div>
                  <div className={styles.panelRecordMeta}>{item.type} · {item.audiologist || 'Uzman belirtilmemiş'}</div>
                  <div className={styles.panelRecordMeta}>Şube: {item.branch || '—'}</div>
                </article>
              ))}</div> : <p className={styles.panelEmptyState}>Bu hasta için randevu kaydı bulunmuyor.</p>}
            </div>}

            {panelTab === 'İşlemler' && <div className={styles.panelSection}>
              <div className={styles.panelSectionHeader}><span className={styles.panelSectionTitle}>Satış ve Tahsilat İşlemleri</span><span className={styles.panelCount}>{patientSales.length}</span></div>
              {patientSales.length ? <div className={styles.panelRecordList}>{patientSales.map(sale => (
                <article key={sale.id} className={styles.panelRecordCard}>
                  <div className={styles.panelRecordHeader}><strong>{formatDate(sale.date)}</strong><span className={styles.panelMoney}>{formatCurrency(sale.total)}</span></div>
                  <div className={styles.panelRecordMeta}>{sale.items.map(item => `${item.name}${item.quantity > 1 ? ` ×${item.quantity}` : ''}`).join(', ') || 'Ürün bilgisi yok'}</div>
                  <div className={styles.panelRecordMeta}>{sale.paymentMethod} · {sale.status}</div>
                </article>
              ))}</div> : <p className={styles.panelEmptyState}>Bu hasta için satış veya tahsilat işlemi bulunmuyor.</p>}
            </div>}
            </div>
          </aside>
        )}
      </div>

      {/* ── Modal for New Recall ── */}
      {showNewModal && (
        <div className={styles.recallModalOverlay} onClick={() => setShowNewModal(false)}>
          <div className={styles.recallModal} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="new-recall-title">
            <div className={styles.recallModalHeader}>
              <h3 id="new-recall-title">Yeni Hatırlatma Ekle</h3>
              <button type="button" className="btn btn-ghost btn-sm btn-icon" onClick={() => setShowNewModal(false)}>
                <IconClose size={16} />
              </button>
            </div>
            <div className={styles.recallModalBody}>
              <div>
                <label htmlFor="recall-patient-search" style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#4a5c68', marginBottom: 4 }}>
                  Hasta Adı *
                </label>
                <div className={styles.patientSearch}>
                  <input
                    id="recall-patient-search"
                    type="text"
                    className="form-input"
                    placeholder="Hasta adı yazın veya arayın..."
                    value={newPatientName}
                    role="combobox"
                    aria-autocomplete="list"
                    aria-expanded={isPatientSearchOpen && patientSuggestions.length > 0}
                    aria-controls="recall-patient-suggestions"
                    aria-activedescendant={activePatientSuggestionIndex >= 0 && patientSuggestions[activePatientSuggestionIndex] ? `recall-patient-option-${patientSuggestions[activePatientSuggestionIndex].id}` : undefined}
                    onFocus={() => setIsPatientSearchOpen(true)}
                    onChange={(event) => {
                      setNewPatientName(event.target.value);
                      setNewPatientId('');
                      setActivePatientSuggestionIndex(-1);
                      setIsPatientSearchOpen(true);
                    }}
                    onKeyDown={(event) => {
                      if (event.key === 'ArrowDown' && patientSuggestions.length > 0) {
                        event.preventDefault();
                        setIsPatientSearchOpen(true);
                        setActivePatientSuggestionIndex(index => Math.min(index + 1, patientSuggestions.length - 1));
                      } else if (event.key === 'ArrowUp' && patientSuggestions.length > 0) {
                        event.preventDefault();
                        setActivePatientSuggestionIndex(index => Math.max(index - 1, 0));
                      } else if (event.key === 'Enter' && isPatientSearchOpen && patientSuggestions.length > 0) {
                        event.preventDefault();
                        const patient = patientSuggestions[Math.max(activePatientSuggestionIndex, 0)];
                        setNewPatientId(patient.id);
                        setNewPatientName(`${patient.firstName} ${patient.lastName}`);
                        setIsPatientSearchOpen(false);
                        setActivePatientSuggestionIndex(-1);
                      } else if (event.key === 'Escape') {
                        setIsPatientSearchOpen(false);
                        setActivePatientSuggestionIndex(-1);
                      }
                    }}
                    style={{ width: '100%', height: 40 }}
                  />
                  {isPatientSearchOpen && newPatientName.trim() && (
                    <div className={styles.patientSuggestions} id="recall-patient-suggestions" role="listbox" aria-label="Hasta arama sonuçları">
                      {patientSuggestions.length > 0 ? patientSuggestions.map((patient, index) => (
                        <button
                          key={patient.id}
                          id={`recall-patient-option-${patient.id}`}
                          type="button"
                          role="option"
                          aria-selected={activePatientSuggestionIndex === index}
                          className={`${styles.patientSuggestion} ${activePatientSuggestionIndex === index ? styles.patientSuggestionActive : ''}`}
                          onMouseDown={(event) => event.preventDefault()}
                          onClick={() => {
                            setNewPatientId(patient.id);
                            setNewPatientName(`${patient.firstName} ${patient.lastName}`);
                            setIsPatientSearchOpen(false);
                            setActivePatientSuggestionIndex(-1);
                          }}
                        >
                          <span className={styles.patientSuggestionAvatar}>{getInitials(patient.firstName, patient.lastName)}</span>
                          <span className={styles.patientSuggestionInfo}>
                            <strong>{patient.firstName} {patient.lastName}</strong>
                            <small>{patient.phone || 'Telefon bilgisi yok'}</small>
                          </span>
                        </button>
                      )) : (
                        <div className={styles.patientSuggestionsEmpty}>Eşleşen kayıt bulunamadı. İsterseniz bu adı serbest metin olarak kullanabilirsiniz.</div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#4a5c68', marginBottom: 4 }}>
                  Hatırlatma Türü *
                </label>
                <select
                  className="form-select"
                  value={newRecallType}
                  onChange={(e) => setNewRecallType(e.target.value)}
                  style={{ width: '100%', height: 38 }}
                >
                  <option value="Pil değişimi">Pil Değişimi</option>
                  <option value="Cihaz kontrolü">Cihaz Kontrolü</option>
                  <option value="Temizlik & Bakım">Temizlik & Bakım</option>
                  <option value="Kontrol muayenesi">Kontrol Muayenesi</option>
                  <option value="Cihaz ayarı">Cihaz Ayarı</option>
                  <option value="SGK Yenileme">SGK Yenileme Takibi</option>
                  <option value="Teknik servis">Teknik Servis</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#4a5c68', marginBottom: 4 }}>
                  Planlanan Tarih *
                </label>
                <input
                  type="date"
                  className="form-input"
                  value={newDueDate}
                  onChange={(e) => setNewDueDate(e.target.value)}
                  style={{ width: '100%', height: 38 }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#4a5c68', marginBottom: 4 }}>
                  Notlar (Opsiyonel)
                </label>
                <textarea
                  className="form-input"
                  rows={3}
                  placeholder="Hatırlatma ile ilgili özel not..."
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  style={{ width: '100%' }}
                />
              </div>
            </div>
            <div className={styles.recallModalFooter}>
              <button type="button" className="btn btn-secondary" onClick={() => setShowNewModal(false)}>
                Vazgeç
              </button>
              <button
                type="button"
                className="btn btn-primary"
                style={{ background: '#08785b', borderColor: '#08785b' }}
                onClick={async () => {
                  if (!newPatientName.trim()) {
                    addToast({ type: 'warning', message: 'Lütfen hasta adı girin.' });
                    return;
                  }
                  const matchedPat = patientsList.find(p => p.id === newPatientId || `${p.firstName} ${p.lastName}`.toLowerCase() === newPatientName.trim().toLowerCase());
                  if (!matchedPat) {
                    addToast({ type: 'warning', message: 'Hatırlatma eklemek için kayıtlı bir hasta seçin.' });
                    return;
                  }
                  const newRecall: RecallItem = {
                    id: 'pending',
                    patientId: matchedPat.id,
                    patientName: newPatientName.trim(),
                    reason: (newRecallType === 'SGK Yenileme' ? 'SGK Yenileme' : 'Yıllık Kontrol') as any,
                    dueDate: newDueDate || new Date().toISOString().split('T')[0],
                    status: 'Bekliyor',
                    lastContact: null,
                    estimatedRevenue: 15000,
                    probability: 'Yüksek Olasılık',
                    notes: newNotes.trim() || undefined
                  };
                  await addRecallItem(newRecall);
                  setShowNewModal(false);
                  setNewPatientId('');
                  setNewPatientName('');
                  setNewDueDate('');
                  setNewNotes('');
                }}
              >
                Kaydet
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
