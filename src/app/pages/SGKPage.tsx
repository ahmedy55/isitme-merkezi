'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { useBranchScope } from '../hooks/useBranchScope';
import styles from './SGKPage.module.css';

interface SGKPrescriptionItem {
  id: string;
  patientId?: string;
  patientName: string;
  avatarInitials: string;
  avatarColor: string;
  age: number;
  gender: 'Kadın' | 'Erkek';
  tc: string;
  phone: string;
  email: string;
  address: string;
  birthDate: string;
  prescriptionNo: string;
  reportNo: string;
  date: string;
  deviceOperation: string;
  status: 'Onaylandı' | 'İşlemde' | 'Reddedildi';
  period: string; // e.g. 2025/09
  branch: string;
  notes?: string;
  doctorName?: string;
  hospitalName?: string;
  icdCode?: string;
  provisionNo?: string;
}

const INITIAL_SGK_LIST: SGKPrescriptionItem[] = [
  {
    id: 'sgk-1',
    patientName: 'Ayşe Yılmaz',
    avatarInitials: 'AY',
    avatarColor: styles.avatarPurple,
    age: 62,
    gender: 'Kadın',
    tc: '12345678901',
    phone: '+90 532 123 45 67',
    email: 'ayse.yilmaz@email.com',
    address: 'Atatürk Bulvarı No: 123, Çankaya / Ankara',
    birthDate: '01.03.1963',
    prescriptionNo: 'R-2025-1024',
    reportNo: 'RAP-2025-8821',
    date: '12 Eyl 2025',
    deviceOperation: 'Oticon More 1 (2 adet)',
    status: 'Onaylandı',
    period: '2025/09',
    branch: 'Merkez',
    doctorName: 'Prof. Dr. Haluk Özcan',
    hospitalName: 'Ankara Şehir Hastanesi',
    icdCode: 'H90.3 - Sensorinöral İşitme Kaybı (Bilateral)',
    provisionNo: 'PRV-982341'
  },
  {
    id: 'sgk-2',
    patientName: 'Mehmet Demir',
    avatarInitials: 'MD',
    avatarColor: styles.avatarBlue,
    age: 75,
    gender: 'Erkek',
    tc: '98765432109',
    phone: '+90 533 234 56 78',
    email: 'mehmet.demir@email.com',
    address: 'Tunalı Hilmi Cad. No: 45, Çankaya / Ankara',
    birthDate: '15.06.1950',
    prescriptionNo: 'R-2025-1023',
    reportNo: 'RAP-2025-8815',
    date: '10 Eyl 2025',
    deviceOperation: 'Phonak Audeo L (2 adet)',
    status: 'İşlemde',
    period: '2025/09',
    branch: 'Merkez',
    doctorName: 'Doç. Dr. Serkan Aksoy',
    hospitalName: 'Hacettepe Tıp Fakültesi',
    icdCode: 'H90.0 - İletim Tipi İşitme Kaybı',
    provisionNo: 'PRV-982312'
  },
  {
    id: 'sgk-3',
    patientName: 'Fatma Kaya',
    avatarInitials: 'FK',
    avatarColor: styles.avatarPink,
    age: 68,
    gender: 'Kadın',
    tc: '45678912345',
    phone: '+90 535 345 67 89',
    email: 'fatma.kaya@email.com',
    address: 'Mithatpaşa Cad. No: 88, Kızılay / Ankara',
    birthDate: '20.08.1957',
    prescriptionNo: 'R-2025-1022',
    reportNo: 'RAP-2025-8801',
    date: '08 Eyl 2025',
    deviceOperation: 'Widex Moment (1 adet)',
    status: 'Reddedildi',
    period: '2025/09',
    branch: 'Çankaya',
    doctorName: 'Uzm. Dr. Burak Keskin',
    hospitalName: 'Gazi Hastanesi',
    icdCode: 'H91.1 - Presbiakuzi',
    provisionNo: 'PRV-982190'
  },
  {
    id: 'sgk-4',
    patientName: 'Ali Çetin',
    avatarInitials: 'AÇ',
    avatarColor: styles.avatarOrange,
    age: 70,
    gender: 'Erkek',
    tc: '32165498701',
    phone: '+90 536 456 78 90',
    email: 'ali.cetin@email.com',
    address: 'Bağdat Cad. No: 12, Kadıköy / İstanbul',
    birthDate: '11.02.1955',
    prescriptionNo: 'R-2025-1021',
    reportNo: 'RAP-2025-8794',
    date: '05 Eyl 2025',
    deviceOperation: 'Signia Pure 312 (2 adet)',
    status: 'Onaylandı',
    period: '2025/08',
    branch: 'Merkez',
    doctorName: 'Prof. Dr. Nermin Şahin',
    hospitalName: 'İbni Sina Hastanesi',
    icdCode: 'H90.3 - Sensorinöral İşitme Kaybı',
    provisionNo: 'PRV-981944'
  },
  {
    id: 'sgk-5',
    patientName: 'Zeynep Arslan',
    avatarInitials: 'ZA',
    avatarColor: styles.avatarTeal,
    age: 55,
    gender: 'Kadın',
    tc: '65432198706',
    phone: '+90 537 567 89 01',
    email: 'zeynep.arslan@email.com',
    address: 'Gazi Mustafa Kemal Bulv. No: 76, Maltepe / Ankara',
    birthDate: '05.09.1970',
    prescriptionNo: 'R-2025-1020',
    reportNo: 'RAP-2025-8772',
    date: '02 Eyl 2025',
    deviceOperation: 'Cochlear Aksesuar (1 adet)',
    status: 'İşlemde',
    period: '2025/08',
    branch: 'Çankaya',
    doctorName: 'Doç. Dr. Emre Erdem',
    hospitalName: 'Başkent Üniversitesi Hastanesi',
    icdCode: 'H90.5 - Sensorinöral İşitme Kaybı, Tanımlanmamış',
    provisionNo: 'PRV-981801'
  },
  {
    id: 'sgk-6',
    patientName: 'Hasan Yıldız',
    avatarInitials: 'HY',
    avatarColor: styles.avatarIndigo,
    age: 66,
    gender: 'Erkek',
    tc: '78912345603',
    phone: '+90 538 678 90 12',
    email: 'hasan.yildiz@email.com',
    address: 'İnönü Cad. No: 23, Konak / İzmir',
    birthDate: '18.04.1959',
    prescriptionNo: 'R-2025-1019',
    reportNo: 'RAP-2025-8750',
    date: '28 Ağu 2025',
    deviceOperation: 'Bakım / Pil (4 adet)',
    status: 'Onaylandı',
    period: '2025/08',
    branch: 'Merkez',
    doctorName: 'Uzm. Dr. Kemal Vural',
    hospitalName: 'Ankara Eğitim ve Araştırma Hastanesi',
    icdCode: 'Z97.4 - İşitme Cihazı Varlığı / Bakımı',
    provisionNo: 'PRV-981655'
  },
  {
    id: 'sgk-7',
    patientName: 'Emine Doğan',
    avatarInitials: 'ED',
    avatarColor: styles.avatarGreen,
    age: 72,
    gender: 'Kadın',
    tc: '15935748620',
    phone: '+90 539 789 01 23',
    email: 'emine.dogan@email.com',
    address: 'Dikmen Cad. No: 104, Çankaya / Ankara',
    birthDate: '24.11.1953',
    prescriptionNo: 'R-2025-1018',
    reportNo: 'RAP-2025-8720',
    date: '25 Ağu 2025',
    deviceOperation: 'Oticon Real (2 adet)',
    status: 'Reddedildi',
    period: '2025/08',
    branch: 'Çankaya',
    doctorName: 'Prof. Dr. Metin Yücel',
    hospitalName: 'Numune Hastanesi',
    icdCode: 'H90.3 - Sensorinöral İşitme Kaybı',
    provisionNo: 'PRV-981504'
  },
  {
    id: 'sgk-8',
    patientName: 'Mustafa Acar',
    avatarInitials: 'MA',
    avatarColor: styles.avatarViolet,
    age: 59,
    gender: 'Erkek',
    tc: '75395148629',
    phone: '+90 540 890 12 34',
    email: 'mustafa.acar@email.com',
    address: 'Esat Cad. No: 56, Çankaya / Ankara',
    birthDate: '14.07.1966',
    prescriptionNo: 'R-2025-1017',
    reportNo: 'RAP-2025-8702',
    date: '21 Ağu 2025',
    deviceOperation: 'Cihaz Tamir (1 adet)',
    status: 'Onaylandı',
    period: '2025/07',
    branch: 'Merkez',
    doctorName: 'Doç. Dr. Selin Doğan',
    hospitalName: 'Şehir Hastanesi',
    icdCode: 'H90.8 - Mikst İletim ve Sensorinöral İşitme Kaybı',
    provisionNo: 'PRV-981410'
  }
];

export default function SGKPage() {
  const { addToast, setCurrentPage, patientsList: allPatients, branchesList, setSelectedPatientId, approveSGKPrescription, updatePatient, currentOrgId } = useApp();
  const { matches } = useBranchScope();

  // Navigation tab states
  const [mainTab, setMainTab] = useState<'records' | 'invoices' | 'documents' | 'medula'>('records');

  // Search & filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('Tüm Şubeler');
  const [selectedStatus, setSelectedStatus] = useState('Tüm Durumlar');
  const [dateRange, setDateRange] = useState('');
  const [tablePage, setTablePage] = useState(1);
  const tablePageSize = 10;

  // Items list
  const [items, setItems] = useState<SGKPrescriptionItem[]>(currentOrgId ? [] : INITIAL_SGK_LIST);

  // Selection states
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [activeItem, setActiveItem] = useState<SGKPrescriptionItem | null>(currentOrgId ? null : INITIAL_SGK_LIST[0]);
  const [drawerTab, setDrawerTab] = useState<'genel' | 'recete' | 'surec' | 'evrak' | 'islemler'>('genel');

  // Modals & Menu states
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [activeActionMenuId, setActiveActionMenuId] = useState<string | null>(null);

  useEffect(() => {
    setItems(currentOrgId ? [] : INITIAL_SGK_LIST);
    setSelectedIds([]);
    setActiveItem(currentOrgId ? null : INITIAL_SGK_LIST[0]);
  }, [currentOrgId]);

  // New Prescription Form state
  const [formData, setFormData] = useState({
    patientName: '',
    tc: '',
    phone: '',
    prescriptionNo: '',
    reportNo: '',
    deviceOperation: 'Oticon More 1 (2 adet)',
    period: '2025/09',
    status: 'İşlemde' as 'Onaylandı' | 'İşlemde' | 'Reddedildi',
    branch: 'Merkez',
    notes: ''
  });

  // Filtered List
  const filteredList = useMemo(() => {
    return items.filter(item => {
      // Scope match
      if (!matches(item.branch)) return false;

      // Search match
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchName = item.patientName.toLowerCase().includes(q);
        const matchTc = item.tc.includes(q);
        const matchPresc = item.prescriptionNo.toLowerCase().includes(q);
        const matchDev = item.deviceOperation.toLowerCase().includes(q);
        if (!matchName && !matchTc && !matchPresc && !matchDev) return false;
      }

      // Branch match
      if (selectedBranch !== 'Tüm Şubeler' && item.branch !== selectedBranch) {
        return false;
      }

      // Status match
      if (selectedStatus !== 'Tüm Durumlar' && item.status !== selectedStatus) {
        return false;
      }

      return true;
    });
  }, [items, searchTerm, selectedBranch, selectedStatus, matches]);
  useEffect(() => setTablePage(1), [searchTerm, selectedBranch, selectedStatus, dateRange]);
  const tablePageCount = Math.max(1, Math.ceil(filteredList.length / tablePageSize));
  const pagedList = useMemo(() => filteredList.slice((tablePage - 1) * tablePageSize, tablePage * tablePageSize), [filteredList, tablePage, tablePageSize]);

  // Statistics counts
  const totalCount = filteredList.length;
  const approvedCount = items.filter(i => i.status === 'Onaylandı').length;
  const pendingCount = items.filter(i => i.status === 'İşlemde').length;
  const rejectedCount = items.filter(i => i.status === 'Reddedildi').length;

  // Toggle selection
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(filteredList.map(i => i.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleToggleSelect = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedIds(prev => {
      if (prev.includes(id)) {
        return prev.filter(x => x !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  const handleRowClick = (item: SGKPrescriptionItem) => {
    setActiveItem(item);
    if (!selectedIds.includes(item.id)) {
      setSelectedIds([item.id]);
    }
  };

  // Status badge helper
  const renderStatusBadge = (status: SGKPrescriptionItem['status']) => {
    if (status === 'Onaylandı') {
      return <span className={`${styles.badgeStatus} ${styles.badgeApproved}`}>Onaylandı</span>;
    }
    if (status === 'İşlemde') {
      return <span className={`${styles.badgeStatus} ${styles.badgePending}`}>İşlemde</span>;
    }
    return <span className={`${styles.badgeStatus} ${styles.badgeRejected}`}>Reddedildi</span>;
  };

  // Submit new prescription
  const handleCreatePrescription = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.patientName.trim() || !formData.tc.trim() || !formData.prescriptionNo.trim()) {
      addToast({ type: 'error', message: 'Lütfen zorunlu alanları (Hasta adı, TC, Reçete no) doldurun.' });
      return;
    }

    const matchedPat = allPatients.find(p => p.tc === formData.tc || `${p.firstName} ${p.lastName}`.toLowerCase() === formData.patientName.toLowerCase());
    const reportNoGenerated = formData.reportNo || `RAP-${Math.floor(1000 + Math.random() * 9000)}`;

    const newItem: SGKPrescriptionItem = {
      id: `sgk-${Date.now()}`,
      patientId: matchedPat?.id,
      patientName: formData.patientName,
      avatarInitials: formData.patientName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase(),
      avatarColor: styles.avatarTeal,
      age: 60,
      gender: 'Kadın',
      tc: formData.tc,
      phone: formData.phone || '+90 555 000 00 00',
      email: `${formData.patientName.toLowerCase().replace(/\s+/g, '.')}@email.com`,
      address: 'Merkez Mah. No: 1, Ankara',
      birthDate: '01.01.1965',
      prescriptionNo: formData.prescriptionNo,
      reportNo: reportNoGenerated,
      date: 'Bugün',
      deviceOperation: formData.deviceOperation,
      status: formData.status,
      period: formData.period,
      branch: formData.branch,
      notes: formData.notes,
      doctorName: 'Uzm. Dr. Odyolog',
      hospitalName: 'Devlet Hastanesi',
      icdCode: 'H90.3 - Sensorinöral İşitme Kaybı',
      provisionNo: `PRV-${Math.floor(100000 + Math.random() * 900000)}`
    };

    if (matchedPat && formData.prescriptionNo) {
      try {
        await approveSGKPrescription(matchedPat.id, formData.prescriptionNo, reportNoGenerated);
      } catch {
        // Fallback silently if offline
      }
    }

    setItems(prev => [newItem, ...prev]);
    setActiveItem(newItem);
    setSelectedIds([newItem.id]);
    setIsNewModalOpen(false);
    setFormData({
      patientName: '',
      tc: '',
      phone: '',
      prescriptionNo: '',
      reportNo: '',
      deviceOperation: 'Oticon More 1 (2 adet)',
      period: '2025/09',
      status: 'İşlemde',
      branch: 'Merkez',
      notes: ''
    });
    addToast({ type: 'success', message: `${newItem.prescriptionNo} numaralı reçete başarıyla kaydedildi.` });
  };

  const handleUpdateStatus = (id: string, newStatus: SGKPrescriptionItem['status']) => {
    setItems(prev => prev.map(item => item.id === id ? { ...item, status: newStatus } : item));
    const targetItem = items.find(i => i.id === id);
    if (activeItem && activeItem.id === id) {
      setActiveItem({ ...activeItem, status: newStatus });
    }
    if (targetItem && newStatus === 'Onaylandı') {
      const pat = allPatients.find(p => p.tc === targetItem.tc || `${p.firstName} ${p.lastName}`.toLowerCase() === targetItem.patientName.toLowerCase());
      if (pat) {
        updatePatient({
          ...pat,
          prescriptionStatus: 'SGK Onaylı',
          sgkStatus: 'Yenileme Hakkı Var',
          prescriptionNo: targetItem.prescriptionNo,
          reportNo: targetItem.reportNo
        });
      }
    }
    setActiveActionMenuId(null);
    addToast({ type: 'success', message: `Reçete durumu "${newStatus}" olarak güncellendi ve hasta kaydıyla senkronize edildi.` });
  };

  const handleDeleteItem = (id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
    if (activeItem && activeItem.id === id) {
      setActiveItem(null);
    }
    setSelectedIds(prev => prev.filter(x => x !== id));
    setActiveActionMenuId(null);
    addToast({ type: 'success', message: 'Reçete kaydı silindi.' });
  };

  const handleQueryMedula = (item: SGKPrescriptionItem) => {
    addToast({
      type: 'warning',
      message: currentOrgId
        ? 'Medula bağlantısı yapılandırılmadı; provizyon durumu doğrulanamadı.'
        : `Demo ortamı: ${item.prescriptionNo} için gerçek Medula sorgusu yapılmadı.`
    });
  };

  return (
    <div className={styles.sgkPage}>
      {/* ── Breadcrumb & Top Page Heading ── */}
      <div className={styles.breadcrumb}>
        SGK & Reçete <span>›</span> Hasta / Reçete Kayıtları
      </div>

      <div className={styles.pageHeading}>
        <div className={styles.headingCopy}>
          <div className={styles.headingIcon}>
            {/* SVG Document / Prescription icon */}
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </svg>
          </div>
          <div>
            <h1>SGK & Reçete</h1>
            <p>Hasta reçete kayıtlarını, SGK durumlarını ve ödeme süreçlerini yönetin.</p>
          </div>
        </div>

        <div className={styles.headerActions}>
          <button
            className={styles.btnCalendarLink}
            onClick={() => setCurrentPage('sgk-receivables')}
          >
            {/* Calendar / Schedule Icon */}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            Ödeme takvimine git
          </button>

          <button
            className={styles.btnNewPrescription}
            onClick={() => setIsNewModalOpen(true)}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Yeni Reçete Kaydı
          </button>
        </div>
      </div>

      {/* ── 4 Stat Cards ── */}
      <div className={styles.statsGrid}>
        {/* Card 1: Toplam Reçete */}
        <div
          className={`${styles.statCard} ${selectedStatus === 'Tüm Durumlar' ? styles.statCardActive : ''}`}
          onClick={() => setSelectedStatus('Tüm Durumlar')}
        >
          <div className={`${styles.statIcon} ${styles.iconGreen}`}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
            </svg>
          </div>
          <div>
            <span>Toplam Reçete</span>
            <strong>{totalCount}</strong>
            <div className={styles.statTrend}>
              <span className={styles.trendUpGreen}>↗ %12</span>
              <span className={styles.statSubtext}>bu ay</span>
            </div>
          </div>
        </div>

        {/* Card 2: SGK Onaylandı */}
        <div
          className={`${styles.statCard} ${selectedStatus === 'Onaylandı' ? styles.statCardActive : ''}`}
          onClick={() => setSelectedStatus('Onaylandı')}
        >
          <div className={`${styles.statIcon} ${styles.iconBlue}`}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          </div>
          <div>
            <span>SGK Onaylandı</span>
            <strong>{approvedCount}</strong>
            <div className={styles.statTrend}>
              <span className={styles.trendUpGreen}>↗ %28</span>
              <span className={styles.statSubtext}>bu ay</span>
            </div>
          </div>
        </div>

        {/* Card 3: İşlemde */}
        <div
          className={`${styles.statCard} ${selectedStatus === 'İşlemde' ? styles.statCardActive : ''}`}
          onClick={() => setSelectedStatus('İşlemde')}
        >
          <div className={`${styles.statIcon} ${styles.iconOrange}`}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          </div>
          <div>
            <span>İşlemde</span>
            <strong>{pendingCount}</strong>
            <div className={styles.statTrend}>
              <span className={styles.trendDownGreen}>↘ %5</span>
              <span className={styles.statSubtext}>bu ay</span>
            </div>
          </div>
        </div>

        {/* Card 4: Reddedildi */}
        <div
          className={`${styles.statCard} ${selectedStatus === 'Reddedildi' ? styles.statCardActive : ''}`}
          onClick={() => setSelectedStatus('Reddedildi')}
        >
          <div className={`${styles.statIcon} ${styles.iconRed}`}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
          </div>
          <div>
            <span>Reddedildi</span>
            <strong>{rejectedCount}</strong>
            <div className={styles.statTrend}>
              <span className={styles.trendUpRed}>↗ %22</span>
              <span className={styles.statSubtext}>bu ay</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Sub Navigation Tabs ── */}
      <div className={styles.navTabs}>
        <button
          className={`${styles.navTabBtn} ${mainTab === 'records' ? styles.navTabBtnActive : ''}`}
          onClick={() => setMainTab('records')}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
          </svg>
          Hasta / Reçete Kayıtları
        </button>

        <button
          className={`${styles.navTabBtn} ${mainTab === 'invoices' ? styles.navTabBtnActive : ''}`}
          onClick={() => setMainTab('invoices')}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="2" y="4" width="20" height="16" rx="2" />
            <line x1="2" y1="10" x2="22" y2="10" />
          </svg>
          SGK Dönem Faturaları
        </button>

        <button
          className={`${styles.navTabBtn} ${mainTab === 'documents' ? styles.navTabBtnActive : ''}`}
          onClick={() => setMainTab('documents')}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
          </svg>
          Evrak & Rapor Takibi
        </button>

        <button
          className={`${styles.navTabBtn} ${mainTab === 'medula' ? styles.navTabBtnActive : ''}`}
          onClick={() => setMainTab('medula')}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
            <path d="M2 12h20" />
          </svg>
          Medula Entegrasyon Durumu
        </button>
      </div>

      {/* ── TAB 1: Hasta / Reçete Kayıtları ── */}
      {mainTab === 'records' && (
        <>
          {/* Filter Bar */}
          <div className={styles.filterBar}>
            <div className={styles.searchBox}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="text"
                placeholder="Hasta adı, TC, reçete no ile ara..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>

            <select
              className={styles.filterSelect}
              value={selectedBranch}
              onChange={e => setSelectedBranch(e.target.value)}
            >
              <option value="Tüm Şubeler">Tüm Şubeler</option>
              {branchesList.map((b: { id?: string; name: string }) => (
                <option key={b.id || b.name} value={b.name}>{b.name}</option>
              ))}
            </select>

            <select
              className={styles.filterSelect}
              value={selectedStatus}
              onChange={e => setSelectedStatus(e.target.value)}
            >
              <option value="Tüm Durumlar">Tüm Durumlar</option>
              <option value="Onaylandı">Onaylandı</option>
              <option value="İşlemde">İşlemde</option>
              <option value="Reddedildi">Reddedildi</option>
            </select>

            <div className={styles.dateInput}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              <input
                type="text"
                placeholder="Tarih Aralığı"
                value={dateRange}
                onChange={e => setDateRange(e.target.value)}
              />
            </div>

            <button
              className={styles.btnFilter}
              onClick={() => addToast({ type: 'info', message: 'Filtreler uygulandı.' })}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
              </svg>
              Filtrele
            </button>

            <button
              className={styles.btnClear}
              onClick={() => {
                setSearchTerm('');
                setSelectedBranch('Tüm Şubeler');
                setSelectedStatus('Tüm Durumlar');
                setDateRange('');
              }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="23 4 23 10 17 10" />
                <polyline points="1 20 1 14 7 14" />
                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
              </svg>
              Temizle
            </button>
          </div>

          {/* Content Layout: Table + Right Drawer */}
          <div className={styles.contentLayout}>
            {/* Table Card */}
            <div className={styles.tableSection}>
              <div className={styles.tableWrap}>
                <table className={styles.sgkTable}>
                  <thead>
                    <tr>
                      <th style={{ width: 40, textAlign: 'center' }}>
                        <input
                          type="checkbox"
                          checked={selectedIds.length > 0 && selectedIds.length === filteredList.length}
                          onChange={e => handleSelectAll(e.target.checked)}
                        />
                      </th>
                      <th>Tarih ⇅</th>
                      <th>Hasta</th>
                      <th>TC Kimlik</th>
                      <th>Reçete No</th>
                      <th>Cihaz / İşlem</th>
                      <th>Durum</th>
                      <th>SGK Dönemi</th>
                      <th style={{ textAlign: 'center' }}>İşlemler</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredList.length === 0 ? (
                      <tr>
                        <td colSpan={9} style={{ textAlign: 'center', padding: '40px 20px', color: '#64748b' }}>
                          Aradığınız kriterlere uygun SGK reçete kaydı bulunamadı.
                        </td>
                      </tr>
                    ) : (
                      pagedList.map(item => {
                        const isSelected = selectedIds.includes(item.id);
                        const isActive = activeItem?.id === item.id;
                        return (
                          <tr
                            key={item.id}
                            className={isActive ? styles.selectedRow : ''}
                            onClick={() => handleRowClick(item)}
                            style={{ cursor: 'pointer' }}
                          >
                            <td style={{ textAlign: 'center' }} onClick={e => e.stopPropagation()}>
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={e => handleToggleSelect(item.id, e as any)}
                              />
                            </td>
                            <td style={{ whiteSpace: 'nowrap' }}>{item.date}</td>
                            <td>
                              <div className={styles.patientCell}>
                                <div className={`${styles.avatar} ${item.avatarColor}`}>
                                  {item.avatarInitials}
                                </div>
                                <div className={styles.patientInfo}>
                                  <span className={styles.patientName}>{item.patientName}</span>
                                  <span className={styles.patientMeta}>{item.age} yaş · {item.gender}</span>
                                </div>
                              </div>
                            </td>
                            <td className={styles.tcCell}>{item.tc}</td>
                            <td className={styles.recipeNoCell}>{item.prescriptionNo}</td>
                            <td className={styles.deviceCell}>{item.deviceOperation}</td>
                            <td>{renderStatusBadge(item.status)}</td>
                            <td className={styles.periodCell}>{item.period}</td>
                            <td style={{ textAlign: 'center' }} onClick={e => e.stopPropagation()}>
                              <div className={styles.actionBtns} style={{ justifyContent: 'center', position: 'relative' }}>
                                {/* Document view button */}
                                <button
                                  className={styles.btnActionIcon}
                                  title="Reçete Belgesi"
                                  onClick={() => {
                                    setActiveItem(item);
                                    setIsPreviewModalOpen(true);
                                  }}
                                >
                                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                    <polyline points="14 2 14 8 20 8" />
                                    <line x1="16" y1="13" x2="8" y2="13" />
                                  </svg>
                                </button>

                                {/* Quick preview / Eye button */}
                                <button
                                  className={styles.btnActionIcon}
                                  title="Detay İncele"
                                  onClick={() => setActiveItem(item)}
                                >
                                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                    <circle cx="12" cy="12" r="3" />
                                  </svg>
                                </button>

                                {/* Three dots vertical dropdown button */}
                                <div style={{ position: 'relative' }}>
                                  <button
                                    className={styles.btnActionIcon}
                                    title="Diğer İşlemler"
                                    onClick={() => setActiveActionMenuId(activeActionMenuId === item.id ? null : item.id)}
                                  >
                                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                      <circle cx="12" cy="12" r="1" />
                                      <circle cx="12" cy="5" r="1" />
                                      <circle cx="12" cy="19" r="1" />
                                    </svg>
                                  </button>

                                  {activeActionMenuId === item.id && (
                                    <div className={styles.dropdownMenu}>
                                      <button
                                        className={styles.dropdownItem}
                                        onClick={() => {
                                          handleUpdateStatus(item.id, 'Onaylandı');
                                        }}
                                      >
                                        ✓ Onaylandı Yap
                                      </button>
                                      <button
                                        className={styles.dropdownItem}
                                        onClick={() => {
                                          handleUpdateStatus(item.id, 'İşlemde');
                                        }}
                                      >
                                        ⏳ İşlemde Yap
                                      </button>
                                      <button
                                        className={styles.dropdownItem}
                                        onClick={() => {
                                          handleUpdateStatus(item.id, 'Reddedildi');
                                        }}
                                      >
                                        ✕ Reddedildi Yap
                                      </button>
                                      <hr style={{ margin: '4px 0', border: 'none', borderTop: '1px solid #e2e8f0' }} />
                                      <button
                                        className={styles.dropdownItem}
                                        onClick={() => {
                                          setActiveActionMenuId(null);
                                          setIsUploadModalOpen(true);
                                        }}
                                      >
                                        ⬆ Evrak Yükle
                                      </button>
                                      <button
                                        className={styles.dropdownItem}
                                        onClick={() => {
                                          setActiveActionMenuId(null);
                                          handleQueryMedula(item);
                                        }}
                                      >
                                        🔗 Medula Sorgula
                                      </button>
                                      <button
                                        className={`${styles.dropdownItem} ${styles.dropdownItemDanger}`}
                                        onClick={() => handleDeleteItem(item.id)}
                                      >
                                        🗑 Kaydı Sil
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Table Footer */}
              <div className={styles.tableFooter}>
                <div>
                  Toplam {totalCount} kayıt | {selectedIds.length} kayıt seçili
                </div>

                <div className={styles.pagination}>
                  <button type="button" className={styles.pageBtn} aria-label="Önceki sayfa" disabled={tablePage <= 1} onClick={() => setTablePage(page => Math.max(1, page - 1))}>‹</button>
                  {Array.from({ length: tablePageCount }, (_, index) => index + 1).map(page => <button type="button" key={page} className={`${styles.pageBtn} ${tablePage === page ? styles.pageBtnActive : ''}`} aria-current={tablePage === page ? 'page' : undefined} onClick={() => setTablePage(page)}>{page}</button>)}
                  <button type="button" className={styles.pageBtn} aria-label="Sonraki sayfa" disabled={tablePage >= tablePageCount} onClick={() => setTablePage(page => Math.min(tablePageCount, page + 1))}>›</button>
                </div>
              </div>
            </div>

            {/* Right Detail Drawer */}
            {activeItem && (
              <div className={styles.detailDrawer}>
                {/* Header */}
                <div className={styles.drawerHeader}>
                  <div className={styles.drawerHeaderLeft}>
                    <div className={`${styles.drawerAvatar} ${activeItem.avatarColor}`}>
                      {activeItem.avatarInitials}
                    </div>
                    <div>
                      <div className={styles.drawerPatientName}>{activeItem.patientName}</div>
                      <div className={styles.drawerPatientMeta}>
                        {activeItem.age} yaş · {activeItem.gender}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {renderStatusBadge(activeItem.status)}
                    <button
                      className={styles.drawerCloseBtn}
                      onClick={() => setActiveItem(null)}
                      title="Kapat"
                    >
                      ✕
                    </button>
                  </div>
                </div>

                {/* Drawer Tabs */}
                <div className={styles.drawerTabs}>
                  <button
                    className={`${styles.drawerTabBtn} ${drawerTab === 'genel' ? styles.drawerTabBtnActive : ''}`}
                    onClick={() => setDrawerTab('genel')}
                  >
                    Genel
                  </button>
                  <button
                    className={`${styles.drawerTabBtn} ${drawerTab === 'recete' ? styles.drawerTabBtnActive : ''}`}
                    onClick={() => setDrawerTab('recete')}
                  >
                    Reçete Bilgileri
                  </button>
                  <button
                    className={`${styles.drawerTabBtn} ${drawerTab === 'surec' ? styles.drawerTabBtnActive : ''}`}
                    onClick={() => setDrawerTab('surec')}
                  >
                    SGK Süreci
                  </button>
                  <button
                    className={`${styles.drawerTabBtn} ${drawerTab === 'evrak' ? styles.drawerTabBtnActive : ''}`}
                    onClick={() => setDrawerTab('evrak')}
                  >
                    Evraklar
                  </button>
                  <button
                    className={`${styles.drawerTabBtn} ${drawerTab === 'islemler' ? styles.drawerTabBtnActive : ''}`}
                    onClick={() => setDrawerTab('islemler')}
                  >
                    İşlemler
                  </button>
                </div>

                {/* Drawer Content */}
                <div className={styles.drawerBody}>
                  {drawerTab === 'genel' && (
                    <>
                      {/* Section: Hasta Bilgileri */}
                      <div className={styles.drawerSection}>
                        <div className={styles.sectionHeader}>
                          <span className={styles.sectionTitle}>Hasta Bilgileri</span>
                          <button
                            className={styles.btnDetailLink}
                            onClick={() => {
                              const match = allPatients.find(p => p.tc === activeItem.tc || `${p.firstName} ${p.lastName}` === activeItem.patientName);
                              if (match) {
                                setSelectedPatientId(match.id);
                                setCurrentPage('patient-detail');
                              } else {
                                addToast({ type: 'info', message: 'Hasta kartı açılıyor...' });
                              }
                            }}
                          >
                            Detay
                          </button>
                        </div>

                        <div className={styles.infoGrid}>
                          <div className={styles.infoRow}>
                            <svg className={styles.infoIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                              <circle cx="12" cy="7" r="4" />
                            </svg>
                            <span>{activeItem.patientName}</span>
                          </div>

                          <div className={styles.infoRow}>
                            <svg className={styles.infoIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                              <line x1="16" y1="2" x2="16" y2="6" />
                              <line x1="8" y1="2" x2="8" y2="6" />
                              <line x1="3" y1="10" x2="21" y2="10" />
                            </svg>
                            <span>{activeItem.birthDate} ({activeItem.age} yaş)</span>
                          </div>

                          <div className={styles.infoRow}>
                            <svg className={styles.infoIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                            </svg>
                            <span>{activeItem.phone}</span>
                          </div>

                          <div className={styles.infoRow}>
                            <svg className={styles.infoIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                              <polyline points="22,6 12,13 2,6" />
                            </svg>
                            <span style={{ color: '#0284c7' }}>{activeItem.email}</span>
                          </div>

                          <div className={styles.infoRow}>
                            <svg className={styles.infoIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                              <circle cx="12" cy="10" r="3" />
                            </svg>
                            <span>{activeItem.address}</span>
                          </div>
                        </div>
                      </div>

                      {/* Section: Son Reçete */}
                      <div className={styles.drawerSection}>
                        <span className={styles.sectionTitle}>Son Reçete</span>
                        <div className={styles.prescriptionBox}>
                          <div className={styles.prescriptionRow}>
                            <span className={styles.prescriptionLabel}>Reçete No</span>
                            <span className={styles.prescriptionVal}>{activeItem.prescriptionNo}</span>
                          </div>
                          <div className={styles.prescriptionRow}>
                            <span className={styles.prescriptionLabel}>Tarih</span>
                            <span className={styles.prescriptionVal}>{activeItem.date}</span>
                          </div>
                          <div className={styles.prescriptionRow}>
                            <span className={styles.prescriptionLabel}>Cihaz / İşlem</span>
                            <span className={styles.prescriptionVal}>{activeItem.deviceOperation}</span>
                          </div>
                          <div className={styles.prescriptionRow}>
                            <span className={styles.prescriptionLabel}>SGK Dönemi</span>
                            <span className={styles.prescriptionVal}>{activeItem.period}</span>
                          </div>
                          <div className={styles.prescriptionRow}>
                            <span className={styles.prescriptionLabel}>Durum</span>
                            <span>{renderStatusBadge(activeItem.status)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Section: Hızlı İşlemler */}
                      <div className={styles.drawerSection}>
                        <span className={styles.sectionTitle}>Hızlı İşlemler</span>
                        <div className={styles.quickActionsGrid}>
                          <button
                            className={styles.quickActionBtn}
                            onClick={() => setIsPreviewModalOpen(true)}
                          >
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                              <polyline points="14 2 14 8 20 8" />
                            </svg>
                            Reçete görüntüle
                          </button>

                          <button
                            className={styles.quickActionBtn}
                            onClick={() => {
                              const match = allPatients.find(p => p.tc === activeItem.tc);
                              if (match) {
                                setSelectedPatientId(match.id);
                                setCurrentPage('patient-detail');
                              } else {
                                addToast({ type: 'info', message: 'Hasta detay ekranı yükleniyor...' });
                              }
                            }}
                          >
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                              <circle cx="12" cy="7" r="4" />
                            </svg>
                            Hasta bilgisi
                          </button>

                          <button
                            className={styles.quickActionBtn}
                            onClick={() => setIsUploadModalOpen(true)}
                          >
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                              <polyline points="17 8 12 3 7 8" />
                              <line x1="12" y1="3" x2="12" y2="15" />
                            </svg>
                            Evrak yükle
                          </button>

                          <button
                            className={styles.quickActionBtn}
                            onClick={() => handleQueryMedula(activeItem)}
                          >
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                            </svg>
                            Medula sorgula
                          </button>
                        </div>
                      </div>
                    </>
                  )}

                  {drawerTab === 'recete' && (
                    <div style={{ display: 'grid', gap: 12, fontSize: 13 }}>
                      <div className={styles.prescriptionBox}>
                        <div className={styles.prescriptionRow}>
                          <span className={styles.prescriptionLabel}>Doktor:</span>
                          <strong>{activeItem.doctorName || 'Prof. Dr. Haluk Özcan'}</strong>
                        </div>
                        <div className={styles.prescriptionRow}>
                          <span className={styles.prescriptionLabel}>Hastane:</span>
                          <span>{activeItem.hospitalName || 'Ankara Şehir Hastanesi'}</span>
                        </div>
                        <div className={styles.prescriptionRow}>
                          <span className={styles.prescriptionLabel}>Rapor No:</span>
                          <span style={{ fontFamily: 'monospace' }}>{activeItem.reportNo}</span>
                        </div>
                        <div className={styles.prescriptionRow}>
                          <span className={styles.prescriptionLabel}>Provizyon No:</span>
                          <span style={{ fontFamily: 'monospace' }}>{activeItem.provisionNo}</span>
                        </div>
                      </div>
                      <div style={{ padding: 12, background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                        <div style={{ fontWeight: 600, color: '#475569', marginBottom: 4 }}>ICD-10 Tanı Kodu:</div>
                        <div style={{ color: '#0f172a' }}>{activeItem.icdCode || 'H90.3 - Sensorinöral İşitme Kaybı'}</div>
                      </div>
                    </div>
                  )}

                  {drawerTab === 'surec' && (
                    <div style={{ display: 'grid', gap: 14 }}>
                      {[
                        { title: 'Reçete Medula Girişi', desc: 'Reçete sisteme kaydedildi ve Medula provizyonu alındı.', date: activeItem.date, done: true },
                        { title: 'Odyometri Raporu Doğrulandı', desc: 'İşitme kaybı eşik değerleri SGK protokolüne uygun.', date: activeItem.date, done: true },
                        { title: 'Fatura Dönemine Eklendi', desc: `Dönem: ${activeItem.period} SGK İcmal Listesi`, date: 'Dönem Sonu', done: activeItem.status !== 'Reddedildi' },
                        { title: 'SGK İnceleme & Kesinti Kontrolü', desc: 'GSS Daire Başkanlığı inceleme aşaması.', date: 'Bekleniyor', done: activeItem.status === 'Onaylandı' }
                      ].map((step, idx) => (
                        <div key={idx} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                          <div style={{
                            width: 22, height: 22, borderRadius: '50%',
                            background: step.done ? '#e6f7f0' : '#f1f5f9',
                            color: step.done ? '#08785b' : '#94a3b8',
                            display: 'grid', placeItems: 'center', fontSize: 11, fontWeight: 700, flex: '0 0 auto'
                          }}>
                            {step.done ? '✓' : idx + 1}
                          </div>
                          <div>
                            <div style={{ fontWeight: 650, fontSize: 13, color: '#1e293b' }}>{step.title}</div>
                            <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{step.desc}</div>
                            <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{step.date}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {drawerTab === 'evrak' && (
                    <div style={{ display: 'grid', gap: 8 }}>
                      {[
                        { name: 'E-Reçete Çıktısı.pdf', size: '245 KB', date: activeItem.date },
                        { name: 'Odyometri Raporu.pdf', size: '1.2 MB', date: activeItem.date },
                        { name: 'Kimlik Fotokopisi.pdf', size: '420 KB', date: activeItem.date },
                        { name: 'SGK Taahhütnamesi.pdf', size: '180 KB', date: activeItem.date }
                      ].map((doc, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: 8, background: '#f8fafc' }}>
                          <div>
                            <div style={{ fontWeight: 600, fontSize: 12.5, color: '#0f172a' }}>{doc.name}</div>
                            <div style={{ fontSize: 11, color: '#64748b' }}>{doc.size} · {doc.date}</div>
                          </div>
                          <button
                            className={styles.btnDetailLink}
                            onClick={() => addToast({ type: 'success', message: `${doc.name} indiriliyor...` })}
                          >
                            İndir
                          </button>
                        </div>
                      ))}
                      <button
                        className={styles.btnFilter}
                        style={{ marginTop: 8, justifyContent: 'center' }}
                        onClick={() => setIsUploadModalOpen(true)}
                      >
                        + Yeni Evrak Yükle
                      </button>
                    </div>
                  )}

                  {drawerTab === 'islemler' && (
                    <div style={{ display: 'grid', gap: 12 }}>
                      <div style={{ fontWeight: 600, fontSize: 13, color: '#475569' }}>Durum Değiştir:</div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button
                          className={styles.btnFilter}
                          style={{ flex: 1, justifyContent: 'center' }}
                          onClick={() => handleUpdateStatus(activeItem.id, 'Onaylandı')}
                        >
                          ✓ Onayla
                        </button>
                        <button
                          className={styles.btnClear}
                          style={{ flex: 1, justifyContent: 'center' }}
                          onClick={() => handleUpdateStatus(activeItem.id, 'İşlemde')}
                        >
                          ⏳ İşlemde
                        </button>
                        <button
                          className={styles.btnClear}
                          style={{ flex: 1, justifyContent: 'center', color: '#dc2626' }}
                          onClick={() => handleUpdateStatus(activeItem.id, 'Reddedildi')}
                        >
                          ✕ Reddet
                        </button>
                      </div>
                      <hr style={{ border: 'none', borderTop: '1px solid #e2e8f0', margin: '8px 0' }} />
                      <button
                        className={styles.btnClear}
                        style={{ color: '#dc2626', borderColor: '#fca5a5', justifyContent: 'center' }}
                        onClick={() => handleDeleteItem(activeItem.id)}
                      >
                        🗑 Reçete Kaydını Kalıcı Sil
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* ── TAB 2: SGK Dönem Faturaları ── */}
      {mainTab === 'invoices' && (
        <div style={{ background: '#ffffff', border: '1px solid var(--sgk-border)', borderRadius: 14, padding: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div>
              <h3 style={{ margin: 0, fontSize: 18, color: '#0f172a' }}>SGK Dönem İcmal & Fatura Listesi</h3>
              <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: 13 }}>
                Aylık SGK faturalandırma dönemleri ve hak ediş tahsilat takibi.
              </p>
            </div>
            <button
              className={styles.btnCalendarLink}
              onClick={() => setCurrentPage('sgk-receivables')}
            >
              📅 SGK Ödeme Takvimini Aç
            </button>
          </div>

          <div className={styles.tableWrap}>
            <table className={styles.sgkTable}>
              <thead>
                <tr>
                  <th>Dönem</th>
                  <th>Reçete Sayısı</th>
                  <th>Toplam Cihaz Bedeli</th>
                  <th>SGK Katkı Payı</th>
                  <th>Hasta Katkı Payı</th>
                  <th>Tahmini Tahsilat Tarihi</th>
                  <th>Fatura Durumu</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { period: '2025/09', count: 48, total: '₺428.000', sgk: '₺164.200', patient: '₺263.800', date: '15 Kasım 2025', status: 'Hazırlanıyor' },
                  { period: '2025/08', count: 52, total: '₺468.000', sgk: '₺178.500', patient: '₺289.500', date: '15 Ekim 2025', status: 'SGK İncelemede' },
                  { period: '2025/07', count: 41, total: '₺365.000', sgk: '₺139.000', patient: '₺226.000', date: '15 Eylül 2025', status: 'Ödendi' },
                  { period: '2025/06', count: 39, total: '₺342.000', sgk: '₺131.000', patient: '₺211.000', date: '15 Ağustos 2025', status: 'Ödendi' }
                ].map((row, idx) => (
                  <tr key={idx}>
                    <td style={{ fontWeight: 700, color: '#0f172a' }}>{row.period}</td>
                    <td>{row.count} adet</td>
                    <td style={{ fontWeight: 600 }}>{row.total}</td>
                    <td style={{ color: '#08785b', fontWeight: 650 }}>{row.sgk}</td>
                    <td>{row.patient}</td>
                    <td>{row.date}</td>
                    <td>
                      <span className={`${styles.badgeStatus} ${row.status === 'Ödendi' ? styles.badgeApproved : styles.badgePending}`}>
                        {row.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── TAB 3: Evrak & Rapor Takibi ── */}
      {mainTab === 'documents' && (
        <div style={{ background: '#ffffff', border: '1px solid var(--sgk-border)', borderRadius: 14, padding: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div>
              <h3 style={{ margin: 0, fontSize: 18, color: '#0f172a' }}>Evrak & Sağlık Kurulu Rapor Takibi</h3>
              <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: 13 }}>
                Hastaların 6 aylık rapor geçerlilik süreleri ve eksik evrak takipleri.
              </p>
            </div>
            <button className={styles.btnNewPrescription} onClick={() => setIsUploadModalOpen(true)}>
              ⬆ Evrak Yükle
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
            {[
              { type: 'Sağlık Kurulu Raporu', patient: 'Ayşe Yılmaz', date: '12 Eyl 2025', daysLeft: 164, status: 'Geçerli' },
              { type: 'Odyogram Raporu', patient: 'Mehmet Demir', date: '10 Eyl 2025', daysLeft: 158, status: 'Geçerli' },
              { type: 'KBB Uzman Reçetesi', patient: 'Fatma Kaya', date: '08 Eyl 2025', daysLeft: 8, status: 'Süresi Yaklaşıyor' },
              { type: 'SGK Cihaz Teslim Belgesi', patient: 'Ali Çetin', date: '05 Eyl 2025', daysLeft: 0, status: 'Tamamlandı' }
            ].map((card, i) => (
              <div key={i} style={{ padding: 16, border: '1px solid #e2e8f0', borderRadius: 12, background: '#fafbfc' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#08785b' }}>{card.type}</span>
                  <span className={`${styles.badgeStatus} ${card.status === 'Geçerli' ? styles.badgeApproved : card.status === 'Tamamlandı' ? styles.badgePending : styles.badgeRejected}`}>
                    {card.status}
                  </span>
                </div>
                <div style={{ fontSize: 14, fontWeight: 650, color: '#0f172a' }}>{card.patient}</div>
                <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>Kayıt Tarihi: {card.date}</div>
                <div style={{ fontSize: 12, color: card.daysLeft < 15 ? '#dc2626' : '#08785b', fontWeight: 600, marginTop: 6 }}>
                  {card.daysLeft > 0 ? `Kalan Geçerlilik: ${card.daysLeft} gün` : 'Arşivlendi'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── TAB 4: Medula Entegrasyon Durumu ── */}
      {mainTab === 'medula' && (
        <div style={{ background: '#ffffff', border: '1px solid var(--sgk-border)', borderRadius: 14, padding: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div>
              <h3 style={{ margin: 0, fontSize: 18, color: '#0f172a' }}>SGK Medula Web Servis Durumu</h3>
              <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: 13 }}>
                GSS Medula-Optik / Medula-Eczane web servis bağlantı ve provizyon kontrol günlüğü.
              </p>
            </div>
            <button
              className={styles.btnFilter}
              onClick={() => addToast({ type: 'warning', message: 'Medula bağlantı testi bu ortamda yapılandırılmadı; canlı bağlantı doğrulanamadı.' })}
            >
              🔄 Bağlantı Durumunu Kontrol Et
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
            <div style={{ padding: 16, borderRadius: 12, background: '#f0fdf8', border: '1px solid #bbf7d0' }}>
              <div style={{ fontSize: 12, color: '#08785b', fontWeight: 600 }}>MEDULA SERVİSİ</div>
              <div style={{ fontSize: 17, fontWeight: 750, color: '#b45309', marginTop: 4 }}>Yapılandırılmadı</div>
              <div style={{ fontSize: 11.5, color: '#92400e', marginTop: 4 }}>Canlı servis bağlantısı doğrulanmadı</div>
            </div>

            <div style={{ padding: 16, borderRadius: 12, background: '#eff6ff', border: '1px solid #bfdbfe' }}>
              <div style={{ fontSize: 12, color: '#1d4ed8', fontWeight: 600 }}>GÜNLÜK PROVİZYON</div>
              <div style={{ fontSize: 17, fontWeight: 750, color: '#1e40af', marginTop: 4 }}>Gerçek veri yok</div>
              <div style={{ fontSize: 11.5, color: '#2563eb', marginTop: 4 }}>Canlı istek geçmişi gösterilmiyor</div>
            </div>

            <div style={{ padding: 16, borderRadius: 12, background: '#faf5ff', border: '1px solid #e9d5ff' }}>
              <div style={{ fontSize: 12, color: '#7e22ce', fontWeight: 600 }}>E-REÇETE SENKRONİZASYONU</div>
              <div style={{ fontSize: 17, fontWeight: 750, color: '#6b21a8', marginTop: 4 }}>Etkin değil</div>
              <div style={{ fontSize: 11.5, color: '#9333ea', marginTop: 4 }}>Eşitleme yapılandırılmadı</div>
            </div>
          </div>

          <div style={{ fontWeight: 650, fontSize: 14, color: '#0f172a', marginBottom: 10 }}>Son Medula İstek Günlükleri:</div>
          <div style={{ padding: 16, borderRadius: 8, background: '#fffbeb', border: '1px solid #fde68a', color: '#92400e', fontSize: 13 }}>
            Bu ortamda doğrulanmış Medula istek günlüğü bulunmuyor. Hasta kimlik bilgileri için örnek/sabit kayıt gösterilmez.
          </div>
        </div>
      )}

      {/* ── MODAL: Yeni Reçete Kaydı ── */}
      {isNewModalOpen && (
        <div className={styles.modalBackdrop} onClick={() => setIsNewModalOpen(false)}>
          <div className={styles.modalBox} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div className={styles.modalTitle}>Yeni SGK Reçete Kaydı</div>
              <button className={styles.modalClose} onClick={() => setIsNewModalOpen(false)}>✕</button>
            </div>

            <form onSubmit={handleCreatePrescription}>
              <div className={styles.modalBody}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#334155', marginBottom: 6 }}>
                      Hasta Adı Soyadı *
                    </label>
                    <input
                      className={styles.searchBox}
                      style={{ width: '100%' }}
                      required
                      placeholder="Örn: Ayşe Yılmaz"
                      value={formData.patientName}
                      onChange={e => setFormData({ ...formData, patientName: e.target.value })}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#334155', marginBottom: 6 }}>
                      T.C. Kimlik Numarası *
                    </label>
                    <input
                      className={styles.searchBox}
                      style={{ width: '100%' }}
                      required
                      maxLength={11}
                      placeholder="11 haneli TC no"
                      value={formData.tc}
                      onChange={e => setFormData({ ...formData, tc: e.target.value.replace(/\D/g, '') })}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#334155', marginBottom: 6 }}>
                      Telefon Numarası
                    </label>
                    <input
                      className={styles.searchBox}
                      style={{ width: '100%' }}
                      placeholder="+90 5XX XXX XX XX"
                      value={formData.phone}
                      onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#334155', marginBottom: 6 }}>
                      Şube
                    </label>
                    <select
                      className={styles.filterSelect}
                      style={{ width: '100%' }}
                      value={formData.branch}
                      onChange={e => setFormData({ ...formData, branch: e.target.value })}
                    >
                      {branchesList.map((b: { id?: string; name: string }) => (
                        <option key={b.id || b.name} value={b.name}>{b.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#334155', marginBottom: 6 }}>
                      Reçete No *
                    </label>
                    <input
                      className={styles.searchBox}
                      style={{ width: '100%' }}
                      required
                      placeholder="R-2025-XXXX"
                      value={formData.prescriptionNo}
                      onChange={e => setFormData({ ...formData, prescriptionNo: e.target.value })}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#334155', marginBottom: 6 }}>
                      Rapor No
                    </label>
                    <input
                      className={styles.searchBox}
                      style={{ width: '100%' }}
                      placeholder="RAP-2025-XXXX"
                      value={formData.reportNo}
                      onChange={e => setFormData({ ...formData, reportNo: e.target.value })}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#334155', marginBottom: 6 }}>
                      Cihaz / İşlem
                    </label>
                    <input
                      className={styles.searchBox}
                      style={{ width: '100%' }}
                      placeholder="Örn: Oticon More 1 (2 adet)"
                      value={formData.deviceOperation}
                      onChange={e => setFormData({ ...formData, deviceOperation: e.target.value })}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#334155', marginBottom: 6 }}>
                      SGK Dönemi
                    </label>
                    <input
                      className={styles.searchBox}
                      style={{ width: '100%' }}
                      placeholder="2025/09"
                      value={formData.period}
                      onChange={e => setFormData({ ...formData, period: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#334155', marginBottom: 6 }}>
                    SGK Başlangıç Durumu
                  </label>
                  <select
                    className={styles.filterSelect}
                    style={{ width: '100%' }}
                    value={formData.status}
                    onChange={e => setFormData({ ...formData, status: e.target.value as any })}
                  >
                    <option value="İşlemde">İşlemde (SGK Onayı Bekleniyor)</option>
                    <option value="Onaylandı">Onaylandı (Hak Ediş Tamamlandı)</option>
                    <option value="Reddedildi">Reddedildi</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#334155', marginBottom: 6 }}>
                    Açıklama / Notlar
                  </label>
                  <textarea
                    rows={2}
                    className={styles.searchBox}
                    style={{ width: '100%', height: 'auto', padding: '8px 12px' }}
                    placeholder="Doktor notu, ICD-10 teşhisi veya özel açıklama..."
                    value={formData.notes}
                    onChange={e => setFormData({ ...formData, notes: e.target.value })}
                  />
                </div>
              </div>

              <div className={styles.modalFooter}>
                <button
                  type="button"
                  className={styles.btnClear}
                  onClick={() => setIsNewModalOpen(false)}
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  className={styles.btnNewPrescription}
                >
                  Reçeteyi Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: Reçete Detayı / Önizleme ── */}
      {isPreviewModalOpen && activeItem && (
        <div className={styles.modalBackdrop} onClick={() => setIsPreviewModalOpen(false)}>
          <div className={styles.modalBox} style={{ maxWidth: 620 }} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div className={styles.modalTitle}>T.C. Sosyal Güvenlik Kurumu — E-Reçete Belgesi</div>
              <button className={styles.modalClose} onClick={() => setIsPreviewModalOpen(false)}>✕</button>
            </div>

            <div className={styles.modalBody}>
              <div style={{ padding: 18, border: '2px dashed #cbd5e1', borderRadius: 12, background: '#f8fafc' }}>
                <div style={{ textAlign: 'center', marginBottom: 14 }}>
                  <div style={{ fontWeight: 800, fontSize: 15, color: '#0f172a' }}>T.C. SAĞLIK BAKANLIĞI & SGK</div>
                  <div style={{ fontSize: 12, color: '#64748b' }}>MEDULA İŞİTME CİHAZI E-REÇETE DÖKÜMÜ</div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, fontSize: 12.5, borderTop: '1px solid #e2e8f0', paddingTop: 12 }}>
                  <div><span style={{ color: '#64748b' }}>Hasta Adı Soyadı:</span> <strong>{activeItem.patientName}</strong></div>
                  <div><span style={{ color: '#64748b' }}>T.C. Kimlik No:</span> <strong style={{ fontFamily: 'monospace' }}>{activeItem.tc}</strong></div>
                  <div><span style={{ color: '#64748b' }}>E-Reçete No:</span> <strong style={{ fontFamily: 'monospace' }}>{activeItem.prescriptionNo}</strong></div>
                  <div><span style={{ color: '#64748b' }}>Rapor No:</span> <strong style={{ fontFamily: 'monospace' }}>{activeItem.reportNo}</strong></div>
                  <div><span style={{ color: '#64748b' }}>Reçete Tarihi:</span> <strong>{activeItem.date}</strong></div>
                  <div><span style={{ color: '#64748b' }}>Provizyon No:</span> <strong style={{ fontFamily: 'monospace' }}>{activeItem.provisionNo}</strong></div>
                  <div><span style={{ color: '#64748b' }}>Hekim:</span> <strong>{activeItem.doctorName}</strong></div>
                  <div><span style={{ color: '#64748b' }}>Hastane:</span> <strong>{activeItem.hospitalName}</strong></div>
                </div>

                <div style={{ marginTop: 14, padding: 10, background: '#ffffff', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }}>
                  <div style={{ fontWeight: 650, color: '#475569' }}>Cihaz & Teşhis Bilgisi:</div>
                  <div style={{ color: '#0f172a', marginTop: 2 }}>{activeItem.deviceOperation}</div>
                  <div style={{ color: '#64748b', marginTop: 2 }}>{activeItem.icdCode}</div>
                </div>

                <div style={{ marginTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12 }}>
                  <span style={{ color: '#64748b' }}>SGK Katkı Durumu:</span>
                  {renderStatusBadge(activeItem.status)}
                </div>
              </div>
            </div>

            <div className={styles.modalFooter}>
              <button
                className={styles.btnClear}
                onClick={() => addToast({ type: 'success', message: 'Reçete PDF olarak yazdırılıyor...' })}
              >
                🖨 Yazdır
              </button>
              <button
                className={styles.btnNewPrescription}
                onClick={() => setIsPreviewModalOpen(false)}
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: Evrak Yükle ── */}
      {isUploadModalOpen && (
        <div className={styles.modalBackdrop} onClick={() => setIsUploadModalOpen(false)}>
          <div className={styles.modalBox} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div className={styles.modalTitle}>SGK & Hasta Evrağı Yükle</div>
              <button className={styles.modalClose} onClick={() => setIsUploadModalOpen(false)}>✕</button>
            </div>

            <div className={styles.modalBody}>
              <div>
                <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#334155', marginBottom: 6 }}>
                  İlgili Hasta
                </label>
                <input
                  className={styles.searchBox}
                  style={{ width: '100%' }}
                  disabled
                  value={activeItem ? `${activeItem.patientName} (${activeItem.tc})` : 'Hasta Seçilmedi'}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#334155', marginBottom: 6 }}>
                  Evrak Türü
                </label>
                <select className={styles.filterSelect} style={{ width: '100%' }}>
                  <option>KBB Sağlık Kurulu Heyet Raporu</option>
                  <option>Odyometri Test Sonucu (Odyogram)</option>
                  <option>E-Reçete Resmi Çıktısı</option>
                  <option>Hasta Kimlik Fotokopisi</option>
                  <option>SGK Cihaz Taahhütnamesi</option>
                </select>
              </div>

              <div style={{
                border: '2px dashed #cbd5e1',
                borderRadius: 12,
                padding: '30px 20px',
                textAlign: 'center',
                background: '#f8fafc',
                cursor: 'pointer'
              }}>
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.7" style={{ margin: '0 auto 8px' }}>
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
                <div style={{ fontWeight: 650, color: '#334155', fontSize: 13 }}>Dosyayı buraya sürükleyin veya seçin</div>
                <div style={{ color: '#94a3b8', fontSize: 11.5, marginTop: 4 }}>PDF, PNG, JPG (Maks. 15 MB)</div>
              </div>
            </div>

            <div className={styles.modalFooter}>
              <button className={styles.btnClear} onClick={() => setIsUploadModalOpen(false)}>Vazgeç</button>
              <button
                className={styles.btnNewPrescription}
                onClick={() => {
                  setIsUploadModalOpen(false);
                  addToast({ type: 'success', message: 'Evrak başarıyla yüklendi ve hasta dosyasına eklendi.' });
                }}
              >
                Yüklemeyi Tamamla
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
