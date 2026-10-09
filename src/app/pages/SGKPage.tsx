'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { useBranchScope } from '../hooks/useBranchScope';
import { supabase } from '../lib/supabase';
import { dbInsertAuditLog } from '../lib/database';
import { createActivity } from '../repositories/OperationsRepository';
import { formatDate, type Patient } from '../data/mockData';
import { parseRecallDateRange, isDateKeyInRange, toDateKey } from '../lib/recallDateRange';
import styles from './SGKPage.module.css';

interface SGKPeriodInvoice {
  id: string;
  branch_id: string;
  invoice_month: string;
  expected_month: string;
  invoice_no: string;
  amount: number;
  notes: string;
  created_at: string;
  branchName: string;
}

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
  dateKey?: string;
  deviceOperation: string;
  status: 'Onaylandı' | 'İşlemde' | 'Reddedildi';
  period: string; // e.g. 2025/09
  branch: string;
  branchId?: string;
  notes?: string;
  doctorName?: string;
  hospitalName?: string;
  icdCode?: string;
  provisionNo?: string;
}



export default function SGKPage() {
  const { addToast, setCurrentPage, patientsList: allPatients, branchesList, setSelectedPatientId, currentOrgId, approveSGKPrescription, updatePatient } = useApp();
  const { matches } = useBranchScope();

  const items = useMemo<SGKPrescriptionItem[]>(() => allPatients
    .filter(patient => Boolean(patient.prescriptionNo?.trim()) || Boolean(patient.reportNo?.trim()) || ['Reçete Yazıldı', 'SGK Onaylı', 'Reçete Reddedildi', 'İşlemde', 'Onaylandı', 'Reddedildi', 'Bekliyor'].includes(patient.prescriptionStatus || ''))
    .map(patient => {
      const name = `${patient.firstName} ${patient.lastName}`.trim();
      const prescStatus = (patient.prescriptionStatus as string) || '';
      const status: SGKPrescriptionItem['status'] =
        prescStatus === 'SGK Onaylı' || prescStatus === 'Onaylandı'
          ? 'Onaylandı'
          : prescStatus === 'Reçete Reddedildi' || prescStatus === 'Reddedildi'
            ? 'Reddedildi'
            : 'İşlemde';
      const birthDate = patient.birthDate ? new Date(`${patient.birthDate.slice(0, 10)}T12:00:00`) : null;
      const age = birthDate && !Number.isNaN(birthDate.getTime())
        ? Math.max(0, new Date().getFullYear() - birthDate.getFullYear() - (new Date().getMonth() < birthDate.getMonth() || (new Date().getMonth() === birthDate.getMonth() && new Date().getDate() < birthDate.getDate()) ? 1 : 0))
        : 0;
      const rawDate = (patient as any).prescriptionDate
        || patient.deviceDate
        || patient.sgkRenewalDate
        || patient.lastVisit
        || patient.createdAt
        || patient.consentDate
        || '2026-06-15';

      const formatted = formatDate(rawDate);
      const displayDate = formatted !== '—' ? formatted : '15.06.2026';
      const dateKey = toDateKey(rawDate) || toDateKey(displayDate) || '2026-06-15';
      const year = dateKey.slice(0, 4) || '2026';
      const month = dateKey.slice(5, 7) || '06';
      const period = `${year}/${month}`;

      return {
        id: patient.id,
        patientId: patient.id,
        patientName: name,
        avatarInitials: name.split(/\s+/).map(part => part[0] || '').join('').slice(0, 2).toUpperCase(),
        avatarColor: styles.avatarTeal,
        age,
        gender: patient.gender,
        tc: patient.tc,
        phone: patient.phone,
        email: patient.email || '',
        address: patient.address || '',
        birthDate: patient.birthDate || '',
        prescriptionNo: patient.prescriptionNo || '—',
        reportNo: patient.reportNo || '—',
        date: displayDate,
        dateKey,
        deviceOperation: patient.currentDevice || '—',
        status,
        period,
        branch: branchesList.find(branch => branch.id === patient.branchId)?.name || patient.branch || '—',
        branchId: patient.branchId,
        doctorName: patient.doctorName || '—',
        hospitalName: '—',
        icdCode: patient.hearingLoss || '—',
        provisionNo: '—',
      };
    }), [allPatients, branchesList]);

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
  const [periodInvoices, setPeriodInvoices] = useState<SGKPeriodInvoice[]>([]);
  const [periodInvoicesLoading, setPeriodInvoicesLoading] = useState(false);
  const [periodInvoicesError, setPeriodInvoicesError] = useState('');

  // Selection states
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [activeItem, setActiveItem] = useState<SGKPrescriptionItem | null>(null);
  const [drawerTab, setDrawerTab] = useState<'genel' | 'recete' | 'surec' | 'evrak' | 'islemler'>('genel');

  // Modals & Menu states
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [prescriptionPatientId, setPrescriptionPatientId] = useState('');
  const [prescriptionError, setPrescriptionError] = useState('');
  const [savingPrescription, setSavingPrescription] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [activeActionMenuId, setActiveActionMenuId] = useState<string | null>(null);

  useEffect(() => {
    setSelectedIds([]);
    setActiveItem(null);
  }, [currentOrgId]);

  useEffect(() => {
    let cancelled = false;
    if (!currentOrgId) {
      setPeriodInvoices([]);
      setPeriodInvoicesError('');
      setPeriodInvoicesLoading(false);
      return;
    }

    setPeriodInvoicesLoading(true);
    setPeriodInvoicesError('');
    void (async () => {
      try {
        const { data, error } = await supabase
          .from('sgk_period_invoices')
          .select('id, branch_id, invoice_month, expected_month, invoice_no, amount, notes, created_at')
          .eq('organization_id', currentOrgId)
          .order('invoice_month', { ascending: false });
        if (cancelled) return;
        if (error) {
          setPeriodInvoices([]);
          setPeriodInvoicesError('SGK fatura kayıtları yüklenemedi. Veritabanı bağlantısını kontrol edin.');
          return;
        }

        const rows = (data || []).filter(row => matches(undefined, row.branch_id)).map(row => ({
          id: row.id,
          branch_id: row.branch_id,
          invoice_month: row.invoice_month,
          expected_month: row.expected_month,
          invoice_no: row.invoice_no,
          amount: Number(row.amount) || 0,
          notes: row.notes || '',
          created_at: row.created_at,
          branchName: branchesList.find(branch => branch.id === row.branch_id)?.name || '—',
        }));
        setPeriodInvoices(rows);
      } catch {
        if (!cancelled) {
          setPeriodInvoices([]);
          setPeriodInvoicesError('SGK fatura kayıtları yüklenemedi. Veritabanı bağlantısını kontrol edin.');
        }
      } finally {
        if (!cancelled) setPeriodInvoicesLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [currentOrgId, branchesList, matches]);

  // New Prescription Form state
  const [formData, setFormData] = useState({
    patientName: '',
    tc: '',
    phone: '',
    prescriptionNo: '',
    reportNo: '',
    deviceOperation: '',
    period: '',
    status: 'İşlemde' as 'Onaylandı' | 'İşlemde' | 'Reddedildi',
    branch: '',
    notes: ''
  });

  // Filtered List
  const filteredList = useMemo(() => {
    const range = dateRange.trim() ? parseRecallDateRange(dateRange) : null;
    return items.filter(item => {
      // Scope match
      if (!matches(item.branch, item.branchId)) return false;

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

      // Date range match
      if (range && (range.from || range.to)) {
        if (!isDateKeyInRange(item.dateKey || item.date, range)) {
          return false;
        }
      }

      return true;
    });
  }, [items, searchTerm, selectedBranch, selectedStatus, dateRange, matches]);
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
    if (savingPrescription) return;
    setPrescriptionError('');
    if (!formData.patientName.trim() || (!prescriptionPatientId && !formData.tc.trim()) || !formData.prescriptionNo.trim() || !formData.reportNo.trim()) {
      setPrescriptionError('Kayıtlı hasta seçimi, reçete no ve rapor no zorunludur.');
      return;
    }
    const matchedPatient = allPatients.find(patient => prescriptionPatientId ? patient.id === prescriptionPatientId : patient.tc === formData.tc.trim());
    if (!matchedPatient || !matches(matchedPatient.branch, matchedPatient.branchId) || (!prescriptionPatientId && `${matchedPatient.firstName} ${matchedPatient.lastName}`.trim().toLocaleLowerCase('tr-TR') !== formData.patientName.trim().toLocaleLowerCase('tr-TR'))) {
      setPrescriptionError('Kayıtlı hasta bulunamadı. Listeden hastayı seçin veya önce Hasta kayıtlarından ekleyin.');
      return;
    }
    setSavingPrescription(true);
    try {
      await approveSGKPrescription(matchedPatient.id, formData.prescriptionNo.trim(), formData.reportNo.trim());
      setSelectedPatientId(matchedPatient.id);
      setIsNewModalOpen(false);
      setPrescriptionPatientId('');
      setFormData({ patientName: '', tc: '', phone: '', prescriptionNo: '', reportNo: '', deviceOperation: '', period: '', status: 'İşlemde', branch: '', notes: '' });
    } catch (error) {
      setPrescriptionError(error instanceof Error ? error.message : 'Reçete bilgileri hasta kaydına yazılamadı.');
    } finally {
      setSavingPrescription(false);
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: SGKPrescriptionItem['status']) => {
    setActiveActionMenuId(null);
    const patient = allPatients.find(p => p.id === id);
    if (!patient) {
      addToast({ type: 'error', message: 'Hasta kaydı bulunamadı.' });
      return;
    }
    const mappedPrescriptionStatus =
      newStatus === 'Onaylandı'
        ? 'SGK Onaylı'
        : newStatus === 'Reddedildi'
          ? 'Reçete Reddedildi'
          : 'İşlemde';

    const nowDotted = new Intl.DateTimeFormat('tr-TR').format(new Date());
    const updatedPatient: Patient = {
      ...patient,
      prescriptionStatus: mappedPrescriptionStatus as any,
      prescriptionNo: patient.prescriptionNo?.trim() || `REC-${patient.id.slice(-6)}`,
      timeline: [
        {
          date: nowDotted,
          action: `SGK reçete durumu "${newStatus}" olarak güncellendi.`,
          icon: newStatus === 'Onaylandı' ? 'Check' : newStatus === 'Reddedildi' ? 'AlertCircle' : 'Clock',
        },
        ...(patient.timeline || []),
      ],
    };

    try {
      await updatePatient(updatedPatient);
      setActiveItem(prev => (prev && prev.id === id ? { ...prev, status: newStatus } : prev));
      
      const branchId = patient.branchId || branchesList[0]?.id || '';
      const fullName = `${patient.firstName} ${patient.lastName}`.trim();
      try {
        if (branchId) {
          await createActivity({
            branchId,
            patientName: fullName,
            patientId: patient.id,
            type: 'Cihaz İşlemi',
            description: `SGK Reçete durumu "${newStatus}" olarak güncellendi.`,
          });
        }
      } catch (actErr) {
        console.warn('Aktivite kaydı oluşturulamadı:', actErr);
      }
      try {
        await dbInsertAuditLog({
          action: 'Reçete Güncelleme',
          module: 'SGK',
          description: `${fullName} reçete durumu "${newStatus}" olarak güncellendi.`,
        });
      } catch (auditErr) {
        console.warn('Denetim kaydı oluşturulamadı:', auditErr);
      }

      addToast({ type: 'success', message: 'Reçete durumu güncellendi.' });
    } catch (err: any) {
      addToast({ type: 'error', message: `Durum değişikliği kaydedilemedi: ${err?.message || 'Bilinmeyen hata'}` });
    }
  };

  const handleDeleteItem = async (id: string) => {
    setActiveActionMenuId(null);
    const patient = allPatients.find(p => p.id === id);
    if (!patient) {
      addToast({ type: 'error', message: 'Hasta kaydı bulunamadı.' });
      return;
    }
    const updatedPatient: Patient = {
      ...patient,
      prescriptionNo: '',
      reportNo: '',
      prescriptionStatus: 'Yok',
    };
    try {
      await updatePatient(updatedPatient);
      setActiveItem(prev => (prev && prev.id === id ? null : prev));
      setSelectedIds(prev => prev.filter(x => x !== id));
      addToast({ type: 'success', message: 'Reçete kaydı kaldırıldı.' });
    } catch (err: any) {
      addToast({ type: 'error', message: `Kayıt silinemedi: ${err?.message || 'Bilinmeyen hata'}` });
    }
  };

  const handleQueryMedula = (item: SGKPrescriptionItem) => {
    addToast({
      type: 'warning',
      message: currentOrgId
        ? 'Medula bağlantısı yapılandırılmadı; provizyon durumu doğrulanamadı.'
        : 'Aktif firma oturumu yok; Medula sorgusu yapılmadı.'
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
              <span className={styles.statSubtext}>Hasta kartı reçete kayıtları</span>
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
              <span className={styles.statSubtext}>Onaylı kayıt</span>
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
              <span className={styles.statSubtext}>İşlem bekleyen kayıt</span>
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
              <span className={styles.statSubtext}>Reddedilen kayıt</span>
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

          {/* Active Filter Summary */}
          {(Boolean(searchTerm.trim()) || selectedBranch !== 'Tüm Şubeler' || selectedStatus !== 'Tüm Durumlar' || Boolean(dateRange.trim())) && (
            <div className={styles.activeFilterSummary} data-testid="sgk-active-filter-summary">
              <span className={styles.filterSummaryTitle}>Aktif Filtreler:</span>
              {Boolean(dateRange.trim()) && (
                <span className={styles.filterChip} data-testid="sgk-filter-date-chip">
                  📅 {dateRange}
                </span>
              )}
              {selectedStatus !== 'Tüm Durumlar' && (
                <span className={styles.filterChip}>
                  Durum: {selectedStatus}
                </span>
              )}
              {selectedBranch !== 'Tüm Şubeler' && (
                <span className={styles.filterChip}>
                  Şube: {selectedBranch}
                </span>
              )}
              {Boolean(searchTerm.trim()) && (
                <span className={styles.filterChip}>
                  Arama: &quot;{searchTerm}&quot;
                </span>
              )}
              <span className={styles.filterResultCount}>
                ({filteredList.length} reçete kaydı listeleniyor)
              </span>
            </div>
          )}

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
                          Eşleşen filtrelerde reçete numarası veya SGK durumu bulunan hasta kaydı yok.
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
                            <td style={{ whiteSpace: 'nowrap' }} data-testid="sgk-record-date" data-date={item.dateKey || item.date}>
                              {item.date}
                            </td>
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

                {filteredList.length > 0 && <div className={styles.pagination}>
                  <button type="button" className={styles.pageBtn} aria-label="Önceki sayfa" disabled={tablePage <= 1} onClick={() => setTablePage(page => Math.max(1, page - 1))}>‹</button>
                  {Array.from({ length: tablePageCount }, (_, index) => index + 1).map(page => <button type="button" key={page} className={`${styles.pageBtn} ${tablePage === page ? styles.pageBtnActive : ''}`} aria-current={tablePage === page ? 'page' : undefined} onClick={() => setTablePage(page)}>{page}</button>)}
                  <button type="button" className={styles.pageBtn} aria-label="Sonraki sayfa" disabled={tablePage >= tablePageCount} onClick={() => setTablePage(page => Math.min(tablePageCount, page + 1))}>›</button>
                </div>}
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
                onClick={() => addToast({ type: 'error', message: 'Bu evrak için kayıtlı dosya bulunmuyor; indirme başlatılmadı.' })}
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
                Kaydedilmiş SGK dönem faturaları ve beklenen ödeme ayları.
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
                  <th>Fatura Dönemi</th>
                  <th>Fatura No</th>
                  <th>Fatura Tutarı</th>
                  <th>Beklenen Ödeme</th>
                  <th>Şube</th>
                  <th>Kayıt Tarihi</th>
                </tr>
              </thead>
              <tbody>
                {periodInvoicesLoading ? (
                  <tr><td colSpan={6} style={{ padding: 24, textAlign: 'center', color: '#64748b' }}>SGK fatura kayıtları yükleniyor…</td></tr>
                ) : periodInvoicesError ? (
                  <tr><td colSpan={6} style={{ padding: 24, textAlign: 'center', color: '#b91c1c' }}>{periodInvoicesError}</td></tr>
                ) : periodInvoices.length === 0 ? (
                  <tr><td colSpan={6} style={{ padding: 24, textAlign: 'center', color: '#64748b' }}>Bu firma ve şube kapsamı için kayıtlı SGK dönem faturası bulunamadı.</td></tr>
                ) : periodInvoices.map(invoice => (
                  <tr key={invoice.id}>
                    <td>{new Intl.DateTimeFormat('tr-TR', { month: 'long', year: 'numeric' }).format(new Date(`${invoice.invoice_month.slice(0, 10)}T12:00:00`))}</td>
                    <td>{invoice.invoice_no}</td>
                    <td>{new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(invoice.amount)}</td>
                    <td>{new Intl.DateTimeFormat('tr-TR', { month: 'long', year: 'numeric' }).format(new Date(`${invoice.expected_month.slice(0, 10)}T12:00:00`))}</td>
                    <td>{invoice.branchName}</td>
                    <td>{invoice.created_at ? new Intl.DateTimeFormat('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(invoice.created_at)) : '—'}</td>
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

          <div className={styles.tableCard} style={{ margin: 0 }}>
            <table className={styles.sgkTable} style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th>Hasta Adı</th>
                  <th>TC Kimlik No</th>
                  <th>Belge Türü</th>
                  <th>Rapor / Reçete No</th>
                  <th>Doktor / Kurum</th>
                  <th>Şube</th>
                  <th>Durum</th>
                  <th style={{ textAlign: 'right' }}>İşlemler</th>
                </tr>
              </thead>
              <tbody>
                {filteredList.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ padding: 24, textAlign: 'center', color: '#64748b' }}>
                      Kayıtlı evrak veya sağlık kurulu raporu bulunamadı.
                    </td>
                  </tr>
                ) : (
                  filteredList.map((docItem) => (
                    <tr key={docItem.id} onClick={() => handleRowClick(docItem)} style={{ cursor: 'pointer' }}>
                      <td style={{ fontWeight: 600, color: '#0f172a' }}>{docItem.patientName}</td>
                      <td>{docItem.tc || '—'}</td>
                      <td>
                        <span className="badge badge-info" style={{ fontSize: '0.72rem' }}>
                          {docItem.reportNo && docItem.reportNo !== '—' ? 'Sağlık Kurulu Raporu' : 'SGK E-Reçete'}
                        </span>
                      </td>
                      <td style={{ fontFamily: 'var(--font-mono, monospace)', fontWeight: 600 }}>
                        {docItem.reportNo && docItem.reportNo !== '—' ? docItem.reportNo : docItem.prescriptionNo || '—'}
                      </td>
                      <td>{docItem.doctorName || 'Prof. Dr. Haluk Özcan'}</td>
                      <td>{docItem.branch}</td>
                      <td>{renderStatusBadge(docItem.status)}</td>
                      <td style={{ textAlign: 'right' }} onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          className="btn btn-sm btn-secondary"
                          style={{ fontSize: '0.75rem', padding: '4px 8px' }}
                          onClick={() => {
                            setActiveItem(docItem);
                            setIsPreviewModalOpen(true);
                          }}
                        >
                          Görüntüle
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
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
                <label>Kayıtlı hasta
                  <select aria-label="Reçete hastası" value={prescriptionPatientId} onChange={event => {
                    const patient = allPatients.find(item => item.id === event.target.value);
                    setPrescriptionPatientId(event.target.value);
                    setPrescriptionError('');
                    if (patient) setFormData(form => ({ ...form, patientName: `${patient.firstName} ${patient.lastName}`.trim(), tc: patient.tc || '', phone: patient.phone || '' }));
                  }}>
                    <option value="">Hasta seçin</option>
                    {allPatients.filter(patient => matches(patient.branch, patient.branchId)).map(patient => <option key={patient.id} value={patient.id}>{patient.firstName} {patient.lastName}</option>)}
                  </select>
                </label>
                {prescriptionError && <p role="alert" style={{ color: '#b91c1c' }}>{prescriptionError}</p>}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#334155', marginBottom: 6 }}>
                      Hasta Adı Soyadı *
                    </label>
                    <input
                      className={styles.searchBox}
                      style={{ width: '100%' }}
                      required
                      placeholder="Hasta adı soyadı"
                      value={formData.patientName}
                      onChange={e => { setPrescriptionPatientId(''); setFormData({ ...formData, patientName: e.target.value }); }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#334155', marginBottom: 6 }}>
                      T.C. Kimlik Numarası *
                    </label>
                    <input
                      className={styles.searchBox}
                      style={{ width: '100%' }}
                      required={!prescriptionPatientId}
                      maxLength={11}
                      placeholder="11 haneli TC no"
                      value={formData.tc}
                      onChange={e => { setPrescriptionPatientId(''); setFormData({ ...formData, tc: e.target.value.replace(/\D/g, '') }); }}
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
                      placeholder="Ürün adı ve adedi"
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
                  disabled={savingPrescription}
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
                  addToast({ type: 'error', message: 'Hasta evrakları için dosya saklama altyapısı yapılandırılmadı; yükleme kaydedilmedi.' });
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
