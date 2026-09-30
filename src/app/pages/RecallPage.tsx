'use client';

import React, { useMemo, useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { useBranchScope } from '../hooks/useBranchScope';
import { getAvatarColor, getInitials, calculateAge, type RecallItem } from '../data/mockData';
import { IconCalendar, IconCheck, IconSearch, IconClose, IconPlus, IconPhone, IconMail } from '../components/Icons';
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

const defaultShowcaseRecalls: ShowcaseRecall[] = [
  {
    id: 'rec-1',
    patientId: 'p1',
    patientName: 'Ayşe Yılmaz',
    patientAge: 62,
    patientGender: 'Kadın',
    patientPhone: '+90 532 123 45 67',
    patientEmail: 'ayse.yilmaz@email.com',
    patientAddress: 'Atatürk Bulvarı No: 123, Çankaya / Ankara',
    patientDevice: 'Oticon More 1',
    patientDeviceSn: 'ABC123456',
    patientInitials: 'AY',
    avatarColor: '#8b5cf6',
    typeTitle: 'Pil değişimi',
    typeSub: '(İşitme cihazı)',
    planDate: '12 Eyl 2025',
    planTime: '09:00',
    overdueText: '2 gün geçti',
    status: 'Tarihi Geçti',
    lastAction: '—',
  },
  {
    id: 'rec-2',
    patientId: 'p2',
    patientName: 'Mehmet Demir',
    patientAge: 75,
    patientGender: 'Erkek',
    patientPhone: '+90 545 987 65 43',
    patientEmail: 'mehmet.demir@email.com',
    patientAddress: 'Mithatpaşa Cad. No: 45, Kızılay / Ankara',
    patientDevice: 'Phonak Audeo L',
    patientDeviceSn: 'XY2987654',
    patientInitials: 'MD',
    avatarColor: '#3b82f6',
    typeTitle: 'Cihaz kontrolü',
    typeSub: '(Rutin kontrol)',
    planDate: '15 Eyl 2025',
    planTime: '10:00',
    status: 'Bekliyor',
    lastAction: '5 gün önce SMS gönderildi',
  },
  {
    id: 'rec-3',
    patientId: 'p3',
    patientName: 'Fatma Kaya',
    patientAge: 68,
    patientGender: 'Kadın',
    patientPhone: '+90 533 444 22 11',
    patientEmail: 'fatma.kaya@email.com',
    patientAddress: 'Tunalı Hilmi Cad. No: 88, Çankaya / Ankara',
    patientDevice: 'Signia Pure 312',
    patientDeviceSn: 'SG887211',
    patientInitials: 'FK',
    avatarColor: '#ec4899',
    typeTitle: 'Temizlik & Bakım',
    typeSub: '(Cihaz bakımı)',
    planDate: '20 Eyl 2025',
    planTime: '11:30',
    status: 'Randevu Alındı',
    lastAction: '3 gün önce Randevu oluşturuldu',
  },
  {
    id: 'rec-4',
    patientId: 'p4',
    patientName: 'Ali Çetin',
    patientAge: 70,
    patientGender: 'Erkek',
    patientPhone: '+90 505 333 21 09',
    patientEmail: 'ali.cetin@email.com',
    patientAddress: 'Gazi Mustafa Kemal Bulvarı No: 12, Maltepe / Ankara',
    patientDevice: 'Signia Pure 312',
    patientDeviceSn: 'DEF456789',
    patientInitials: 'AÇ',
    avatarColor: '#f59e0b',
    typeTitle: 'Kontrol muayenesi',
    typeSub: '(Periyodik)',
    planDate: '25 Eyl 2025',
    planTime: '15:00',
    status: 'Tamamlandı',
    lastAction: '1 gün önce Muayene yapıldı',
  },
  {
    id: 'rec-5',
    patientId: 'p5',
    patientName: 'Zeynep Arslan',
    patientAge: 55,
    patientGender: 'Kadın',
    patientPhone: '+90 542 222 11 00',
    patientEmail: 'zeynep.arslan@email.com',
    patientAddress: 'Bahçelievler 7. Cadde No: 34, Çankaya / Ankara',
    patientDevice: 'Widex Moment',
    patientDeviceSn: 'WX109823',
    patientInitials: 'ZA',
    avatarColor: '#ef4444',
    typeTitle: 'Cihaz ayarı',
    typeSub: '(Ayar kontrolü)',
    planDate: '28 Eyl 2025',
    planTime: '10:00',
    status: 'Bekliyor',
    lastAction: '—',
  },
  {
    id: 'rec-6',
    patientId: 'p6',
    patientName: 'Hasan Yıldız',
    patientAge: 66,
    patientGender: 'Erkek',
    patientPhone: '+90 530 777 88 99',
    patientEmail: 'hasan.yildiz@email.com',
    patientAddress: 'İnönü Bulvarı No: 56, Yenimahalle / Ankara',
    patientDevice: 'Widex Moment',
    patientDeviceSn: 'WM998124',
    patientInitials: 'HY',
    avatarColor: '#6366f1',
    typeTitle: 'Pil değişimi',
    typeSub: '(İşitme cihazı)',
    planDate: '01 Eki 2025',
    planTime: '14:00',
    status: 'Bekliyor',
    lastAction: '—',
  },
  {
    id: 'rec-7',
    patientId: 'p7',
    patientName: 'Emine Doğan',
    patientAge: 72,
    patientGender: 'Kadın',
    patientPhone: '+90 536 999 00 11',
    patientEmail: 'emine.dogan@email.com',
    patientAddress: 'Turan Güneş Bulvarı No: 78, Oran / Ankara',
    patientDevice: 'Resound Nexia',
    patientDeviceSn: 'RN552190',
    patientInitials: 'ED',
    avatarColor: '#0ea5e9',
    typeTitle: 'Rutin kontrol',
    typeSub: '(Periyodik)',
    planDate: '03 Eki 2025',
    planTime: '09:30',
    status: 'İptal Edildi',
    lastAction: 'Hasta tarafından iptal edildi (02 Eki 2025)',
  },
  {
    id: 'rec-8',
    patientId: 'p8',
    patientName: 'Mustafa Acar',
    patientAge: 59,
    patientGender: 'Erkek',
    patientPhone: '+90 533 123 67 89',
    patientEmail: 'mustafa.acar@email.com',
    patientAddress: 'Eskişehir Yolu 9. Km No: 14, Çankaya / Ankara',
    patientDevice: 'Starkey Evolv AI',
    patientDeviceSn: 'SE881923',
    patientInitials: 'MA',
    avatarColor: '#8b5cf6',
    typeTitle: 'Teknik servis',
    typeSub: '(Cihaz arızası)',
    planDate: '05 Eki 2025',
    planTime: '13:00',
    status: 'Bekliyor',
    lastAction: '—',
  },
];

export default function RecallPage() {
  const { recallList, patientsList, branchesList, currentOrgId, addToast, setCurrentPage, setSelectedPatientId, addRecallItem, updateRecallItemStatus } = useApp();
  const { matches } = useBranchScope();

  // Selected tab: 'Tümü' | 'Bekliyor' | 'Gönderildi' | 'Randevu Alındı' | 'Tamamlandı' | 'İptal Edildi'
  const [activeTab, setActiveTab] = useState<'Tümü' | 'Bekliyor' | 'Gönderildi' | 'Randevu Alındı' | 'Tamamlandı' | 'İptal Edildi'>('Tümü');

  // Search & Filter fields
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('Tümü');
  const [filterBranch, setFilterBranch] = useState('Tümü');
  const [filterDateRange, setFilterDateRange] = useState('');

  // Selected patient for detail drawer
  const [selectedRecallId, setSelectedRecallId] = useState<string>('rec-1');
  const [showDetailPanel, setShowDetailPanel] = useState<boolean>(true);
  const [panelTab, setPanelTab] = useState<'Genel' | 'Cihazlar' | 'Hatırlatmalar' | 'Randevular' | 'İşlemler'>('Genel');

  // Checkbox selections
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set(['rec-1']));

  // Modal for New Recall
  const [showNewModal, setShowNewModal] = useState<boolean>(false);
  const [newPatientId, setNewPatientId] = useState('');
  const [newPatientName, setNewPatientName] = useState('');
  const [newRecallType, setNewRecallType] = useState('Pil değişimi');
  const [newDueDate, setNewDueDate] = useState('');
  const [newNotes, setNewNotes] = useState('');

  // Dropdown for row action
  const [activeActionMenuId, setActiveActionMenuId] = useState<string | null>(null);

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
        patientAge: p ? calculateAge(p.birthDate) : 60,
        patientGender: p?.gender || 'Belirtilmemiş',
        patientPhone: p?.phone || '+90 500 000 00 00',
        patientEmail: p?.email || '',
        patientAddress: p?.address || '—',
        patientDevice: p?.currentDevice || '—',
        patientDeviceSn: '—',
        patientInitials: getInitials(item.patientName, ''),
        avatarColor: getAvatarColor(item.patientName),
        typeTitle: item.reason,
        typeSub: `(${item.probability || 'Planlandı'})`,
        planDate: item.dueDate || new Date().toISOString().split('T')[0],
        planTime: '10:00',
        status: item.status as ShowcaseRecall['status'],
        branchName: p?.branch || '',
        lastAction: item.lastContact ? `Son temas: ${item.lastContact}` : '—',
      };
    });
    return currentOrgId ? liveConverted : [...liveConverted, ...defaultShowcaseRecalls];
  }, [recallList, patientsList, currentOrgId]);

  // Filtered rows
  const filteredRecalls = useMemo(() => {
    return allRecalls.filter(item => {
      // Tab filter
      if (activeTab !== 'Tümü') {
        if (item.status !== activeTab) {
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
  }, [allRecalls, activeTab, searchQuery, filterType, filterBranch, filterDateRange]);

  const activeRecall = allRecalls.find(r => r.id === selectedRecallId) || allRecalls[0] || (!currentOrgId ? defaultShowcaseRecalls[0] : undefined);

  const handleOpenAppointment = (patientId: string) => {
    setSelectedPatientId(patientId);
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
            <strong>247</strong>
          </div>
        </div>

        {/* 2. Bekleyen */}
        <div className={styles.statCard} onClick={() => setActiveTab('Bekliyor')}>
          <div className={`${styles.statIcon} ${styles.iconOrange}`}>
            <IconAlarmClock size={22} />
          </div>
          <div>
            <span>Bekleyen</span>
            <strong>86</strong>
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
            <strong>152</strong>
            <small>— son 30 gün</small>
          </div>
        </div>

        {/* 4. Tarihi Geçen */}
        <div className={styles.statCard} onClick={() => setActiveTab('Tümü')}>
          <div className={`${styles.statIcon} ${styles.iconRed}`}>
            <IconAlertTriangle size={22} />
          </div>
          <div>
            <span>Tarihi Geçen</span>
            <strong style={{ color: '#df4c4c' }}>9</strong>
            <small style={{ color: '#ef4444', fontWeight: 600 }}>● acil işlem gerekli</small>
          </div>
        </div>
      </div>

      {/* ── Filter Tabs & Search Bar ── */}
      <div className={styles.filterCard}>
        {/* Status Tabs */}
        <div className={styles.statusTabsRow}>
          <div className={styles.statusTabs}>
            {(['Tümü', 'Bekliyor', 'Gönderildi', 'Randevu Alındı', 'Tamamlandı', 'İptal Edildi'] as const).map(tab => (
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
                {filteredRecalls.map((recall) => {
                  const isSelected = selectedRecallId === recall.id;
                  const isChecked = checkedIds.has(recall.id);

                  const statusClass = recall.status === 'Tarihi Geçti' ? styles.statusOverdue
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
                          {recall.status}
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
                          <button
                            type="button"
                            className={styles.actionBtn}
                            title="Diğer İşlemler"
                            onClick={() => {
                              setSelectedRecallId(recall.id);
                              setShowDetailPanel(true);
                            }}
                          >
                            <IconDotsVertical size={14} />
                          </button>
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
              Toplam <strong>247</strong> kayıt | Sayfada <strong>10</strong> kayıt gösteriliyor
            </div>
            <div className={styles.pagination}>
              <button type="button" className={styles.pageBtn}>&lt;</button>
              <button type="button" className={`${styles.pageBtn} ${styles.pageBtnActive}`}>1</button>
              <button type="button" className={styles.pageBtn}>2</button>
              <button type="button" className={styles.pageBtn}>3</button>
              <button type="button" className={styles.pageBtn}>4</button>
              <button type="button" className={styles.pageBtn}>5</button>
              <span style={{ padding: '0 4px', color: '#94a3b8' }}>...</span>
              <button type="button" className={styles.pageBtn}>25</button>
              <button type="button" className={styles.pageBtn}>&gt;</button>
            </div>
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
            <nav className={styles.panelTabs}>
              {(['Genel', 'Cihazlar', 'Hatırlatmalar', 'Randevular', 'İşlemler'] as const).map(tab => (
                <button
                  key={tab}
                  type="button"
                  className={`${styles.panelTab} ${panelTab === tab ? styles.panelTabActive : ''}`}
                  onClick={() => setPanelTab(tab)}
                >
                  {tab}
                </button>
              ))}
            </nav>

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
                  <span>{activeRecall.patientEmail}</span>
                </div>
                <div className={styles.contactItem}>
                  <span style={{ fontSize: '12px' }}>📍</span>
                  <span>{activeRecall.patientAddress}</span>
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
                <button type="button" className={styles.panelLinkBtn}>
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
                <div className={styles.actionTimelineItem}>
                  <div className={styles.actionTimelineIcon}>💬</div>
                  <div className={styles.actionTimelineText}>
                    <strong>SMS gönderildi</strong>
                    <span>07 Eyl 2025, 10:24</span>
                  </div>
                </div>
                <div className={styles.actionTimelineItem}>
                  <div className={styles.actionTimelineIcon}>📝</div>
                  <div className={styles.actionTimelineText}>
                    <strong>Not eklendi</strong>
                    <span>05 Eyl 2025, 16:30</span>
                  </div>
                </div>
                <div className={styles.actionTimelineItem}>
                  <div className={styles.actionTimelineIcon}>⚙</div>
                  <div className={styles.actionTimelineText}>
                    <strong>Cihaz ayarı yapıldı</strong>
                    <span>12 Ağu 2025, 11:20</span>
                  </div>
                </div>
              </div>
            </div>
          </aside>
        )}
      </div>

      {/* ── Modal for New Recall ── */}
      {showNewModal && (
        <div className="modal-overlay" onClick={() => setShowNewModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 480 }}>
            <div className="modal-header">
              <h3>Yeni Hatırlatma Ekle</h3>
              <button type="button" className="btn btn-ghost btn-sm btn-icon" onClick={() => setShowNewModal(false)}>
                <IconClose size={16} />
              </button>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#4a5c68', marginBottom: 4 }}>
                  Kayıtlı Hasta Seçimi (veya serbest yazın) *
                </label>
                <select
                  className="form-select"
                  style={{ width: '100%', height: 38, marginBottom: 6 }}
                  value={newPatientId}
                  onChange={(e) => {
                    const id = e.target.value;
                    setNewPatientId(id);
                    const found = patientsList.find(p => p.id === id);
                    if (found) setNewPatientName(`${found.firstName} ${found.lastName}`);
                  }}
                >
                  <option value="">-- Kayıtlı Hastalardan Seçin --</option>
                  {patientsList.map(p => (
                    <option key={p.id} value={p.id}>{p.firstName} {p.lastName} ({p.phone || p.tc || 'Kayıtlı'})</option>
                  ))}
                </select>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Veya serbest hasta adı yazın..."
                  value={newPatientName}
                  onChange={(e) => setNewPatientName(e.target.value)}
                  style={{ width: '100%', height: 38 }}
                />
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
            <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 16 }}>
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
                  const newRecall: RecallItem = {
                    id: `rec-${Date.now().toString().slice(-6)}`,
                    patientId: matchedPat?.id || `pat-${Date.now().toString().slice(-4)}`,
                    patientName: newPatientName.trim(),
                    reason: (newRecallType === 'SGK Yenileme' ? 'SGK Yenileme' : 'Yıllık Kontrol') as any,
                    dueDate: newDueDate || new Date().toISOString().split('T')[0],
                    status: 'Bekliyor',
                    lastContact: null,
                    estimatedRevenue: 15000,
                    probability: 'Yüksek Olasılık'
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
