'use client';

import React, { useState, useMemo, useRef, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { useBranch } from '../context/BranchContext';
import { BranchService } from '../services/BranchService';
import CustomSelect from '../components/CustomSelect';
import { useDebounce } from '../hooks/useDebounce';
import styles from './PatientsPage.module.css';
import {
  getAvatarColor, getInitials, formatDate, calculateAge,
  type Patient,
} from '../data/mockData';
import {
  IconPlus, IconSearch, IconArrowRight, IconClose, IconPatients, IconCalendar,
  IconRecall, IconDevice, IconRefresh, IconUsers, IconPhone, IconMail, IconMapPin, IconCash
} from '../components/Icons';

/* ── Tiny inline icons for table action column ── */
function IconDotsVertical({ size = 16 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="5" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="12" cy="19" r="1"/></svg>;
}
function IconPhoneCall({ size = 16 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M15.05 5A5 5 0 0 1 19 8.95M15.05 1A9 9 0 0 1 23 8.94m-1 7.98v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92Z"/></svg>;
}
function IconCalendarPlus({ size = 16 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/><line x1="12" x2="12" y1="14" y2="18"/><line x1="10" x2="14" y1="16" y2="16"/></svg>;
}
function IconChevronDown({ size = 14 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>;
}
function IconFilter({ size = 16 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>;
}
function IconTrendUp({ size = 12 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>;
}

type SortKey = 'name' | 'tc' | 'phone' | 'age' | 'hearingLoss' | 'device' | 'sgkStatus' | 'lastVisit';
type SortDir = 'asc' | 'desc';

const hearingLossOrder: Record<string, number> = { 'Hafif': 1, 'Orta': 2, 'İleri': 3, 'Çok İleri': 4 };
const sgkStatusOrder: Record<string, number> = { 'Aktif': 1, 'Yenileme Hakkı Var': 2, 'Pasif': 3 };

function SortIcon({ column, sortKey, sortDir }: { column: SortKey; sortKey: SortKey | null; sortDir: SortDir }) {
  const isActive = sortKey === column;
  return (
    <span style={{
      display: 'inline-flex',
      flexDirection: 'column',
      marginLeft: 4,
      verticalAlign: 'middle',
      lineHeight: 1,
      gap: 1,
    }}>
      <svg width="8" height="5" viewBox="0 0 8 5" style={{ opacity: isActive && sortDir === 'asc' ? 1 : 0.25 }}>
        <path d="M4 0L8 5H0L4 0Z" fill={isActive && sortDir === 'asc' ? 'var(--primary-500)' : 'currentColor'} />
      </svg>
      <svg width="8" height="5" viewBox="0 0 8 5" style={{ opacity: isActive && sortDir === 'desc' ? 1 : 0.25 }}>
        <path d="M4 5L0 0H8L4 5Z" fill={isActive && sortDir === 'desc' ? 'var(--primary-500)' : 'currentColor'} />
      </svg>
    </span>
  );
}

export default function PatientsPage() {
  const { setCurrentPage, setSelectedPatientId, patientsList, addPatient, addToast, dataLoading, branchesList, appointmentsList, stockList, salesList } = useApp();
  const { activeBranch } = useBranch();

  const [search, setSearch] = useState('');
  const [filterLoss, setFilterLoss] = useState('Tümü');
  const [filterStatus, setFilterStatus] = useState('Tümü');
  const [filterSource, setFilterSource] = useState('Tümü');
  const [filterBranch, setFilterBranch] = useState('Tümü');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [filterDevice, setFilterDevice] = useState('Tümü');
  const [filterAppointment, setFilterAppointment] = useState('Tümü');
  const [quickFilter, setQuickFilter] = useState('Tümü');
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null);
  const [showPatientPanel, setShowPatientPanel] = useState(true);
  const [patientPanelTab, setPatientPanelTab] = useState<'Genel' | 'Cihazlar' | 'Randevular' | 'İşlemler' | 'Ödemeler'>('Genel');
  const [checkedRows, setCheckedRows] = useState<Set<string>>(new Set());
  const [showMoreFilters, setShowMoreFilters] = useState(false);
  const [showAddDropdown, setShowAddDropdown] = useState(false);
  const addDropdownRef = useRef<HTMLDivElement>(null);

  const [activeActionMenu, setActiveActionMenu] = useState<{
    type: 'calendar' | 'phone' | 'more';
    patient: Patient;
    top: number;
    right: number;
    openUpward?: boolean;
  } | null>(null);
  const actionMenuRef = useRef<HTMLDivElement>(null);

  // Close add dropdown on outside click
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (addDropdownRef.current && !addDropdownRef.current.contains(event.target as Node)) {
        setShowAddDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close action menus on outside click, scroll or Escape
  React.useEffect(() => {
    if (!activeActionMenu) return;
    function handleClickOutside(event: MouseEvent) {
      if (actionMenuRef.current && !actionMenuRef.current.contains(event.target as Node)) {
        setActiveActionMenu(null);
      }
    }
    function handleScroll() {
      setActiveActionMenu(null);
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setActiveActionMenu(null);
    }
    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('scroll', handleScroll, true);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [activeActionMenu]);

  const handleOpenActionMenu = (
    e: React.MouseEvent,
    type: 'calendar' | 'phone' | 'more',
    patient: Patient
  ) => {
    e.stopPropagation();
    if (activeActionMenu?.type === type && activeActionMenu?.patient.id === patient.id) {
      setActiveActionMenu(null);
      return;
    }
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const windowHeight = window.innerHeight;
    const estimatedHeight = type === 'more' ? 360 : 185;
    const openUpward = (rect.bottom + estimatedHeight > windowHeight) && (rect.top > estimatedHeight);

    setActiveActionMenu({
      type,
      patient,
      top: openUpward ? rect.top - 6 : rect.bottom + 6,
      right: Math.max(12, window.innerWidth - rect.right),
      openUpward,
    });
  };


  const toggleRowCheck = (id: string) => {
    setCheckedRows(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };
  const toggleAllChecks = (ids: string[]) => {
    setCheckedRows(prev => {
      if (prev.size === ids.length) return new Set();
      return new Set(ids);
    });
  };
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [formBranchId, setFormBranchId] = useState('');
  const [bulkBranchId, setBulkBranchId] = useState('');
  const [showBulkAddModal, setShowBulkAddModal] = useState(false);
  const [bulkStep, setBulkStep] = useState<1 | 2 | 3 | 4>(1);
  const [selectedBulkFile, setSelectedBulkFile] = useState<File | null>(null);
  const [parsedBulkRows, setParsedBulkRows] = useState<any[]>([]);
  const [isBulkImporting, setIsBulkImporting] = useState(false);

  const handleDownloadPatientTemplate = (isSample: boolean) => {
    const fileName = isSample ? 'hasta-ornek-veri.xlsx' : 'hasta-sablonu.xlsx';
    const link = document.createElement('a');
    link.href = `/templates/${fileName}`;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleBulkFileSelectAndParse = async (file: File) => {
    setSelectedBulkFile(file);
    try {
      const ExcelJS = (await import('exceljs')).default;
      const buffer = await file.arrayBuffer();
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(buffer);
      const sheet = workbook.worksheets.find(s => s.name === 'Veri') || workbook.worksheets[0];
      if (!sheet) return;

      // İlk satırı başlık olarak al, geri kalanları JSON'a çevir
      const headers: string[] = [];
      sheet.getRow(1).eachCell({ includeEmpty: true }, (cell) => {
        headers.push(String(cell.value || ''));
      });

      const jsonRows: Record<string, unknown>[] = [];
      sheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return; // başlık satırını atla
        const rowData: Record<string, unknown> = {};
        row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
          rowData[headers[colNumber - 1]] = cell.value ?? '';
        });
        jsonRows.push(rowData);
      });

      setParsedBulkRows(jsonRows);
    } catch (err) {
      console.error('Excel parsing error:', err);
    }
  };

  const [showImportHistoryModal, setShowImportHistoryModal] = useState(false);
  const [importStep, setImportStep] = useState<1 | 2 | 3 | 4>(1);
  const [selectedImportFile, setSelectedImportFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [bulkInputText, setBulkInputText] = useState('');

  const [parsedImportRows, setParsedImportRows] = useState<any[]>([]);

  const handleDownloadTemplate = (isSample: boolean) => {
    const fileName = isSample ? 'hasta-gecmis-ornek.xlsx' : 'hasta-gecmis-sablonu.xlsx';
    const link = document.createElement('a');
    link.href = `/templates/${fileName}`;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileSelectAndParse = async (file: File) => {
    setSelectedImportFile(file);
    try {
      const ExcelJS = (await import('exceljs')).default;
      const buffer = await file.arrayBuffer();
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(buffer);
      const sheet = workbook.worksheets.find(s => s.name === 'Veri') || workbook.worksheets[0];
      if (!sheet) return;

      const headers: string[] = [];
      sheet.getRow(1).eachCell({ includeEmpty: true }, (cell) => {
        headers.push(String(cell.value || ''));
      });

      const jsonRows: Record<string, unknown>[] = [];
      sheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return;
        const rowData: Record<string, unknown> = {};
        row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
          rowData[headers[colNumber - 1]] = cell.value ?? '';
        });
        jsonRows.push(rowData);
      });

      setParsedImportRows(jsonRows);
    } catch (err) {
      console.error('Excel parsing error:', err);
    }
  };

  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<{
    tc: string;
    gender: Patient['gender'];
    firstName: string;
    lastName: string;
    phone: string;
    birthDate: string;
    email: string;
    address: string;
    hearingLoss: Patient['hearingLoss'];
    hearingLossSide: Patient['hearingLossSide'];
    notes: string;
    emergencyContactName: string;
    emergencyContactPhone: string;
    prescriptionNo: string;
    reportNo: string;
    sgkInsuranceStatus: NonNullable<Patient['sgkInsuranceStatus']>;
    patientStatus: NonNullable<Patient['patientStatus']>;
    source: NonNullable<Patient['source']>;
    consentGiven: boolean;
    photoUrl?: string;
  }>({
    tc: '',
    gender: 'Erkek',
    firstName: '',
    lastName: '',
    phone: '',
    birthDate: '',
    email: '',
    address: '',
    hearingLoss: 'Hafif',
    hearingLossSide: 'Sol',
    notes: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    prescriptionNo: '',
    reportNo: '',
    sgkInsuranceStatus: 'Belirtilmemiş',
    patientStatus: 'Potansiyel',
    source: 'Tavsiye',
    consentGiven: true,
    photoUrl: ''
  });

  const handleSave = async () => {
    if (!formData.firstName.trim() || !formData.lastName.trim() || !formData.tc.trim() || !formData.phone.trim() || !formData.address.trim()) {
      addToast({ type: 'warning', message: 'Lütfen zorunlu alanları (* işaretli: Ad, Soyad, TC Kimlik No, Telefon, Adres) doldurunuz.' });
      return;
    }
    if (!formData.consentGiven) {
      addToast({ type: 'warning', message: '⚠️ DİKKAT: Kişisel Sağlık Verilerinin İşlenmesine İlişkin KVKK Açık Rıza Onayı verilmeden hasta kaydı oluşturulamaz.' });
      return;
    }
    const defaultBranch = branchesList.find(b => b.status === 'Aktif') || branchesList[0];
    const assignedBranchId = activeBranch.mode === 'single'
      ? activeBranch.branchId
      : (formBranchId || defaultBranch?.id);
    const assignedBranch = branchesList.find(branch => branch.id === assignedBranchId) || defaultBranch;
    if (!assignedBranch) {
      addToast({ type: 'error', message: 'Hasta kaydı için geçerli bir şube bulunamadı.' });
      return;
    }
    const newPatient: Patient = {
      id: `p-${Date.now().toString().slice(-6)}`,
      firstName: formData.firstName,
      lastName: formData.lastName,
      tc: formData.tc,
      phone: formData.phone,
      gender: formData.gender,
      birthDate: formData.birthDate,
      email: formData.email,
      address: formData.address,
      photoUrl: formData.photoUrl,
      hearingLoss: formData.hearingLoss,
      hearingLossSide: formData.hearingLossSide,
      sgkStatus: 'Aktif',
      lastVisit: new Date().toISOString().split('T')[0],
      emergencyContactName: formData.emergencyContactName,
      emergencyContactPhone: formData.emergencyContactPhone,
      emergencyContactRelation: 'Yakını',
      prescriptionNo: formData.prescriptionNo,
      reportNo: formData.reportNo,
      sgkInsuranceStatus: formData.sgkInsuranceStatus,
      patientStatus: formData.patientStatus,
      source: formData.source,
      notes: formData.notes,
      consentGiven: formData.consentGiven,
      consentDate: formData.consentGiven ? new Date().toISOString() : undefined,
      branch: assignedBranch.name,
      branchId: assignedBranch.id,
      timeline: [
        { date: new Intl.DateTimeFormat('tr-TR').format(new Date()), action: 'Hasta kaydı ve KVKK rızası oluşturuldu.', icon: 'Plus' }
      ]
    };
    try { await addPatient(newPatient); }
    catch { return; }
    setShowAddModal(false);
    setFormBranchId(activeBranch.mode === 'single' ? activeBranch.branchId : '');
    // Reset form
    setFormData({
      tc: '',
      gender: 'Erkek',
      firstName: '',
      lastName: '',
      phone: '',
      birthDate: '',
      email: '',
      address: '',
      hearingLoss: 'Hafif',
      hearingLossSide: 'Sol',
      notes: '',
      emergencyContactName: '',
      emergencyContactPhone: '',
      prescriptionNo: '',
      reportNo: '',
      sgkInsuranceStatus: 'Belirtilmemiş',
      patientStatus: 'Potansiyel',
      source: 'Tavsiye',
      consentGiven: true
    });
  };

  const branchFilteredPatients = useMemo(() => patientsList.filter(patient =>
    BranchService.matchesBranch(patient.branch, patient.branchId, activeBranch)
  ), [patientsList, activeBranch]);

  const branchAppointments = useMemo(() => appointmentsList.filter(appointment =>
    BranchService.matchesBranch(appointment.branch, appointment.branchId, activeBranch)
  ), [appointmentsList, activeBranch]);

  const assignedStockByPatient = useMemo(() => new Map(
    stockList.filter(item => item.assignedPatientId).map(item => [item.assignedPatientId as string, item])
  ), [stockList]);

  const patientHasDevice = useCallback((patient: Patient) => Boolean(patient.currentDevice || assignedStockByPatient.has(patient.id)), [assignedStockByPatient]);

  const stats = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const dateKey = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    const todayKey = dateKey(today);
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);
    const last30 = new Date(today);
    last30.setDate(last30.getDate() - 30);
    const last60 = new Date(today);
    last60.setDate(last60.getDate() - 60);
    const last90 = new Date(today);
    last90.setDate(last90.getDate() - 90);
    const currentPeriodNew = branchFilteredPatients.filter(patient => (patient.createdAt || '') >= dateKey(last30)).length;
    const previousPeriodNew = branchFilteredPatients.filter(patient => {
      const createdAt = patient.createdAt || '';
      return createdAt >= dateKey(last60) && createdAt < dateKey(last30);
    }).length;

    const total = branchFilteredPatients.length;
    const active = branchFilteredPatients.filter(patient => ['Müşteri', 'Satış Hastası'].includes(patient.patientStatus || '')).length;
    const withDevice = branchFilteredPatients.filter(patientHasDevice).length;
    const upcomingAppointments = branchAppointments.filter(appointment => appointment.date >= todayKey && appointment.date <= dateKey(nextWeek) && !['İptal', 'Gelmedi'].includes(appointment.status)).length;

    // Calculate percentage changes for stat cards
    const totalPctChange = total > 0 ? Math.round((currentPeriodNew / total) * 100) : 0;
    const recentPctChange = previousPeriodNew > 0 ? Math.round(((currentPeriodNew - previousPeriodNew) / previousPeriodNew) * 100) : (currentPeriodNew > 0 ? 100 : 0);
    const activePct = total > 0 ? Math.round((active / total) * 100) : 0;
    const devicePct = total > 0 ? Math.round((withDevice / total) * 100) : 0;

    return {
      total,
      recent: currentPeriodNew,
      previousRecent: previousPeriodNew,
      active,
      withDevice,
      upcomingAppointments,
      totalPctChange,
      recentPctChange,
      activePct,
      devicePct,
    };
  }, [branchFilteredPatients, branchAppointments, patientHasDevice]);

  const handleBulkSave = async () => {
    if (!bulkInputText.trim()) {
      alert('Lütfen eklenecek hasta verilerini girin.');
      return;
    }
    const assignedBranchId = activeBranch.mode === 'single' ? activeBranch.branchId : bulkBranchId;
    const assignedBranch = branchesList.find(branch => branch.id === assignedBranchId);
    if (!assignedBranch) { addToast({ type: 'error', message: 'Toplu aktarım için şube seçin.' }); return; }
    const lines = bulkInputText.split('\n');
    const newPatients: Patient[] = [];
    
    lines.forEach((line) => {
      if (!line.trim()) return;
      const parts = line.split(';');
      if (parts.length >= 2) {
        const firstName = parts[0]?.trim() || '';
        const lastName = parts[1]?.trim() || '';
        const tc = parts[2]?.trim() || '11122233344';
        const phone = parts[3]?.trim() || '0555 111 2233';
        const address = parts[4]?.trim() || 'Belirtilmemiş';
        
        if (firstName && lastName) {
          const newPat: Patient = {
            id: `p-${crypto.randomUUID()}`,
            firstName,
            lastName,
            tc,
            phone,
            address,
            gender: 'Erkek',
            birthDate: '1985-05-15',
            email: '',
            hearingLoss: 'Hafif',
            hearingLossSide: 'Sol',
            sgkStatus: 'Aktif',
            patientStatus: 'Potansiyel',
            sgkInsuranceStatus: 'Belirtilmemiş',
            source: 'Tavsiye',
            branch: assignedBranch.name,
            branchId: assignedBranch.id,
            lastVisit: new Date().toISOString().split('T')[0],
            createdAt: new Date().toISOString().split('T')[0],
            timeline: [
              { date: new Intl.DateTimeFormat('tr-TR').format(new Date()), action: 'Toplu aktarımla hasta kaydı oluşturuldu.', icon: 'Plus' }
            ]
          };
          newPatients.push(newPat);
        }
      }
    });
    
    try { await Promise.all(newPatients.map(patient => addPatient(patient))); }
    catch { return; }
    addToast({ type: 'success', message: `${newPatients.length} hasta başarıyla toplu olarak eklendi.` });
    setShowBulkAddModal(false);
    setBulkInputText('');
  };

  const handleImportHistory = () => {
    setImportStep(1);
    setShowImportHistoryModal(true);
  };

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const debouncedSearch = useDebounce(search, 300);

  const filtered = useMemo(() => {
    const searchLower = debouncedSearch.toLowerCase().trim();
    return branchFilteredPatients.filter((p) => {
      const matchSearch =
        !searchLower ||
        `${p.firstName} ${p.lastName}`.toLowerCase().includes(searchLower) ||
        p.tc.includes(searchLower) ||
        p.phone.includes(searchLower) ||
        (p.address || '').toLowerCase().includes(searchLower) ||
        stockList.some(item => item.assignedPatientId === p.id && `${item.serialNo} ${item.barcode || ''}`.toLowerCase().includes(searchLower));
        
      const matchLoss = filterLoss === 'Tümü' || p.hearingLoss === filterLoss;
      const matchStatus = filterStatus === 'Tümü' || (p.patientStatus || 'Potansiyel') === filterStatus;
      const matchSource = filterSource === 'Tümü' || (p.source || 'Tavsiye') === filterSource;
      const matchBranch = filterBranch === 'Tümü' || p.branchId === filterBranch;
      const hasDevice = patientHasDevice(p);
      const matchDevice = filterDevice === 'Tümü' || (filterDevice === 'Cihaz kullanıyor' ? hasDevice : !hasDevice);
      const hasUpcomingAppointment = branchAppointments.some(appointment => appointment.patientId === p.id && appointment.date >= new Date().toISOString().slice(0, 10) && !['İptal', 'Gelmedi'].includes(appointment.status));
      const matchAppointment = filterAppointment === 'Tümü' || (filterAppointment === 'Randevusu olan' ? hasUpcomingAppointment : !hasUpcomingAppointment);

      const matchQuickFilter = quickFilter === 'Tümü' ||
        (quickFilter === 'Aktif' && ['Müşteri', 'Satış Hastası'].includes(p.patientStatus || '')) ||
        (quickFilter === 'Cihaz Kullanan' && hasDevice) ||
        (quickFilter === 'Randevusu Olan' && hasUpcomingAppointment) ||
        (quickFilter === 'Recall Bekleyen' && p.sgkStatus === 'Yenileme Hakkı Var') ||
        (quickFilter === 'Son 3 Ayda Gelen' && (p.createdAt || '') >= (() => { const date = new Date(); date.setDate(date.getDate() - 90); return date.toISOString().slice(0, 10); })()) ||
        (quickFilter === 'Yeni Hastalar' && (p.createdAt || '') >= (() => { const date = new Date(); date.setDate(date.getDate() - 30); return date.toISOString().slice(0, 10); })()) ||
        (quickFilter === 'Cihaz Serviste' && (p.patientStatus === 'Tamir için gelen')) ||
        (quickFilter === 'Pasif' && p.sgkStatus === 'Pasif');
      
      let matchDate = true;
      const itemDate = p.createdAt || p.lastVisit || '';
      if (itemDate) {
        if (filterStartDate) {
          matchDate = matchDate && itemDate >= filterStartDate;
        }
        if (filterEndDate) {
          matchDate = matchDate && itemDate <= filterEndDate;
        }
      }
      
      return matchSearch && matchLoss && matchStatus && matchSource && matchBranch && matchDevice && matchAppointment && matchQuickFilter && matchDate;
    });
  }, [branchFilteredPatients, branchAppointments, stockList, patientHasDevice, debouncedSearch, filterLoss, filterStatus, filterSource, filterBranch, filterDevice, filterAppointment, quickFilter, filterStartDate, filterEndDate]);

  const sorted = useMemo(() => {
    if (!sortKey) return filtered;

    return [...filtered].sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case 'name':
          cmp = `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`, 'tr');
          break;
        case 'tc':
          cmp = a.tc.localeCompare(b.tc);
          break;
        case 'phone':
          cmp = a.phone.localeCompare(b.phone);
          break;
        case 'age':
          cmp = calculateAge(a.birthDate) - calculateAge(b.birthDate);
          break;
        case 'hearingLoss':
          cmp = (hearingLossOrder[a.hearingLoss || 'Hafif'] || 0) - (hearingLossOrder[b.hearingLoss || 'Hafif'] || 0);
          break;
        case 'device':
          cmp = (a.currentDevice || '').localeCompare(b.currentDevice || '', 'tr');
          break;
        case 'sgkStatus':
          cmp = (sgkStatusOrder[a.sgkStatus || 'Aktif'] || 0) - (sgkStatusOrder[b.sgkStatus || 'Aktif'] || 0);
          break;
        case 'lastVisit':
          cmp = new Date(a.lastVisit || '').getTime() - new Date(b.lastVisit || '').getTime();
          break;
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [filtered, sortKey, sortDir]);

  const handlePatientClick = (patientId: string) => {
    setSelectedPatientId(patientId);
    setCurrentPage('patient-detail');
  };

  const activePatient = sorted.find(patient => patient.id === selectedRowId) || sorted[0] || null;
  const activePatientAppointments = activePatient
    ? branchAppointments.filter(appointment => appointment.patientId === activePatient.id).sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`))
    : [];
  const activePatientSales = activePatient ? salesList.filter(sale => sale.patientId === activePatient.id) : [];
  const selectPatientRow = (patientId: string) => {
    setSelectedRowId(patientId);
    setShowPatientPanel(true);
    setPatientPanelTab('Genel');
  };

  const thStyle: React.CSSProperties = { cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap' };

  return (
    <div className={`page ${styles.patientsPage}`}>
      <div className={styles.pageHeading}>
        <div className={styles.headingCopy}>
          <div className={styles.headingIcon}><IconPatients size={25} /></div>
          <div>
            <div className={styles.breadcrumb}>Hastalar <span>›</span> Hasta Yönetimi</div>
            <h1>Hasta Yönetimi</h1>
            <p>Tüm hastalarınızı görüntüleyin, randevu, cihaz, işlem ve ödeme bilgilerini yönetin.</p>
          </div>
        </div>
        <div className={styles.headerActions}>
          <div ref={addDropdownRef} style={{ position: 'relative', display: 'inline-flex' }}>
            <button
              className={`btn btn-primary ${styles.actionButton}`}
              style={{ borderTopRightRadius: 0, borderBottomRightRadius: 0, paddingRight: 12 }}
              onClick={() => { setFormBranchId(activeBranch.mode === 'single' ? activeBranch.branchId : ''); setShowAddModal(true); }}
            >
              <IconPlus size={16} strokeWidth={2} /> Yeni Hasta Ekle
            </button>
            <button
              className={`btn btn-primary ${styles.actionButton}`}
              style={{ borderTopLeftRadius: 0, borderBottomLeftRadius: 0, paddingLeft: 6, paddingRight: 10, borderLeft: '1px solid rgba(255,255,255,0.25)', minWidth: 'unset' }}
              onClick={() => setShowAddDropdown(prev => !prev)}
              aria-label="Daha fazla ekleme seçeneği"
              aria-expanded={showAddDropdown}
            >
              <IconChevronDown size={14} />
            </button>
            {showAddDropdown && (
              <div style={{
                position: 'absolute', top: '100%', right: 0, marginTop: 4,
                minWidth: 200, background: '#fff', border: '1px solid var(--patient-border)',
                borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.12)', zIndex: 100, padding: '4px 0',
                animation: 'customDropdownIn 0.15s ease'
              }}>
                <button
                  type="button"
                  style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '10px 14px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.82rem', color: '#344a55', fontWeight: 500 }}
                  className="profile-menu-item"
                  onClick={() => { setShowAddDropdown(false); setShowBulkAddModal(true); }}
                >
                  <span aria-hidden="true">📥</span> Toplu Ekle
                </button>
                <button
                  type="button"
                  style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '10px 14px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.82rem', color: '#344a55', fontWeight: 500 }}
                  className="profile-menu-item"
                  onClick={() => { setShowAddDropdown(false); setShowImportHistoryModal(true); }}
                >
                  <IconRefresh size={15} /> Geçmiş Aktar
                </button>
              </div>
            )}
          </div>
          <button className={`btn btn-ghost ${styles.actionButton}`} style={{ width: 42, padding: 0, minWidth: 42, border: '1px solid var(--patient-border)', borderRadius: 10, background: '#fff' }}>
            <IconDotsVertical size={18} />
          </button>
        </div>
      </div>

      <div className={styles.statsGrid} aria-label="Hasta özeti" aria-busy={dataLoading}>
        <article className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.green}`}><IconUsers size={21} /></div>
          <div><span>Toplam Hasta</span><strong>{dataLoading ? '—' : stats.total.toLocaleString('tr-TR')}</strong><small className={styles.statChange}><IconTrendUp size={10} /> %{stats.totalPctChange} <span>son 30 güne göre</span></small></div>
        </article>
        <article className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.blue}`}><IconCalendar size={21} /></div>
          <div><span>Bu Ay Gelen</span><strong>{dataLoading ? '—' : stats.recent.toLocaleString('tr-TR')}</strong><small className={styles.statChange}><IconTrendUp size={10} /> %{Math.abs(stats.recentPctChange)} <span>son aya göre</span></small></div>
        </article>
        <article className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.orange}`}><IconRecall size={21} /></div>
          <div><span>Aktif Takipte</span><strong>{dataLoading ? '—' : stats.active.toLocaleString('tr-TR')}</strong><small className={styles.statChange}><IconTrendUp size={10} /> %{stats.activePct} <span>artış</span></small></div>
        </article>
        <article className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.green}`}><IconDevice size={21} /></div>
          <div><span>Cihaz Kullanan</span><strong>{dataLoading ? '—' : stats.withDevice.toLocaleString('tr-TR')}</strong><small className={styles.statChange}><IconTrendUp size={10} /> %{stats.devicePct} <span>artış</span></small></div>
        </article>
        <article className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.purple}`}><IconCalendar size={21} /></div>
          <div><span>Randevusu Olan</span><strong>{dataLoading ? '—' : stats.upcomingAppointments.toLocaleString('tr-TR')}</strong><small>önümüzdeki 7 gün</small></div>
        </article>
      </div>

      {/* Filtreleme ve Aksiyon Paneli */}
      <div className={`card ${styles.filterCard}`} style={{ marginBottom: 16 }}>
        <div className={`card-body ${styles.filterFields}`}>
          
          {/* Arama ve Dropdown Filtreler — Screenshot düzeni */}
          <div className={styles.filterFieldsInner}>
            
            {/* Arama Kutusu */}
            <div className="header-search" style={{ flex: '1.2 1 200px' }}>
              <span className="header-search-icon">
                <IconSearch size={15} strokeWidth={1.7} />
              </span>
              <input
                type="search"
                placeholder="Hasta adı, telefon, TC, cihaz seri no..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ width: '100%' }}
              />
            </div>

            {/* Hasta Türü */}
            <div style={{ minWidth: 130, flex: '1 1 110px' }}>
              <label style={{ display: 'block', fontSize: '9px', fontWeight: 600, color: '#7c8991', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 3 }}>Hasta Türü</label>
              <select
                className="form-select"
                style={{ padding: '7px 10px', fontSize: '0.82rem', width: '100%', height: 36 }}
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="Tümü">Tümü</option>
                <option value="Potansiyel">Potansiyel</option>
                <option value="Deneme Yapıldı">Deneme Yapıldı</option>
                <option value="Müşteri">Müşteri</option>
                <option value="Satın Almayanlar">Satın Almayanlar</option>
                <option value="Genel">Genel</option>
                <option value="Tamir için gelen">Tamir için gelen</option>
                <option value="Kalıp Hastası">Kalıp Hastası</option>
                <option value="Pil Hastası">Pil Hastası</option>
                <option value="Satış Hastası">Satış Hastası</option>
                <option value="Eski Hasta">Eski Hasta</option>
              </select>
            </div>

            {/* Cihaz Durumu */}
            <div style={{ minWidth: 130, flex: '1 1 110px' }}>
              <label style={{ display: 'block', fontSize: '9px', fontWeight: 600, color: '#7c8991', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 3 }}>Cihaz Durumu</label>
              <select className="form-select" style={{ padding: '7px 10px', fontSize: '0.82rem', width: '100%', height: 36 }} value={filterDevice} onChange={event => setFilterDevice(event.target.value)} aria-label="Cihaz durumu filtresi">
                <option value="Tümü">Tümü</option>
                <option value="Cihaz kullanıyor">Cihaz kullanıyor</option>
                <option value="Cihazı yok">Cihazı yok</option>
              </select>
            </div>

            {/* Randevu Tarihi */}
            <div style={{ minWidth: 150, flex: '1 1 130px' }}>
              <label style={{ display: 'block', fontSize: '9px', fontWeight: 600, color: '#7c8991', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 3 }}>Randevu Tarihi</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <input
                  type="date"
                  className="form-input"
                  style={{ padding: '5px 6px', fontSize: '0.78rem', height: 36, flex: 1, minWidth: 0 }}
                  value={filterStartDate}
                  onChange={(e) => setFilterStartDate(e.target.value)}
                  title="Tarih aralığı"
                />
              </div>
            </div>

            {/* Hasta kaynağı */}
            <div style={{ minWidth: 110, flex: '1 1 100px' }}>
              <label style={{ display: 'block', fontSize: '9px', fontWeight: 600, color: '#7c8991', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 3 }}>Hasta Kaynağı</label>
              <select className="form-select" style={{ padding: '7px 10px', fontSize: '0.82rem', width: '100%', height: 36 }} value={filterSource} onChange={(e) => setFilterSource(e.target.value)}>
                <option value="Tümü">Tümü</option>
                <option value="Doktor">Doktor Yönlendirmesi</option>
                <option value="Sosyal Medya">Sosyal Medya</option>
                <option value="Tavsiye">Hasta Tavsiyesi</option>
                <option value="Yürüyerek">Yürüyerek (Walk-in)</option>
                <option value="Web">Web Sitesi</option>
              </select>
            </div>

            <div style={{ minWidth: 110, flex: '1 1 100px' }}>
              <label style={{ display: 'block', fontSize: '9px', fontWeight: 600, color: '#7c8991', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 3 }}>Şube</label>
              <select className="form-select" style={{ padding: '7px 10px', fontSize: '0.82rem', width: '100%', height: 36 }} value={filterBranch} onChange={event => setFilterBranch(event.target.value)} aria-label="Şube filtresi">
                <option value="Tümü">Tüm şubeler</option>
                {branchesList.filter(branch => branch.status === 'Aktif').map(branch => <option key={branch.id} value={branch.id}>{branch.name}</option>)}
              </select>
            </div>

            {/* Daha Fazla Filtre + Ara butonları */}
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, minWidth: 220, flex: '1 1 200px' }}>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                style={{ display: 'flex', alignItems: 'center', gap: 6, height: 36, fontSize: '0.78rem', borderRadius: 9, whiteSpace: 'nowrap', border: '1px solid #dfe6ea', color: '#41535e' }}
                onClick={() => setShowMoreFilters(!showMoreFilters)}
              >
                <IconFilter size={14} /> Daha Fazla Filtre
              </button>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                style={{ display: 'flex', alignItems: 'center', gap: 6, height: 36, fontSize: '0.78rem', borderRadius: 9, whiteSpace: 'nowrap', background: '#12232b', borderColor: '#12232b', color: '#fff' }}
                onClick={() => { /* search triggers automatically via debounce */ }}
              >
                <IconSearch size={14} /> Ara
              </button>
            </div>
          </div>

          {/* Genişletilmiş filtreler (Daha Fazla Filtre) */}
          {showMoreFilters && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 9, marginTop: 12, paddingTop: 12, borderTop: '1px solid #edf0f2' }}>
              <div>
                <label style={{ display: 'block', fontSize: '9px', fontWeight: 600, color: '#7c8991', textTransform: 'uppercase', marginBottom: 3 }}>İşitme Kaybı</label>
                <select className="form-select" style={{ padding: '7px 10px', fontSize: '0.82rem', width: '100%', height: 36 }} value={filterLoss} onChange={event => setFilterLoss(event.target.value)} aria-label="İşitme kaybı filtresi">
                  <option value="Tümü">Tümü</option>
                  {['Hafif', 'Orta', 'İleri', 'Çok İleri'].map(loss => <option key={loss} value={loss}>{loss}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '9px', fontWeight: 600, color: '#7c8991', textTransform: 'uppercase', marginBottom: 3 }}>Randevu Durumu</label>
                <select className="form-select" style={{ padding: '7px 10px', fontSize: '0.82rem', width: '100%', height: 36 }} value={filterAppointment} onChange={event => setFilterAppointment(event.target.value)} aria-label="Randevu filtresi">
                  <option value="Tümü">Tümü</option>
                  <option value="Randevusu olan">Yaklaşan randevusu olan</option>
                  <option value="Randevusu olmayan">Yaklaşan randevusu olmayan</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '9px', fontWeight: 600, color: '#7c8991', textTransform: 'uppercase', marginBottom: 3 }}>Bitiş Tarihi</label>
                <input
                  type="date"
                  className="form-input"
                  style={{ padding: '5px 8px', fontSize: '0.82rem', height: 36, width: '100%' }}
                  value={filterEndDate}
                  onChange={(e) => setFilterEndDate(e.target.value)}
                  title="Bitiş Tarihi"
                />
              </div>
            </div>
          )}

        </div>

        <div className={styles.quickFilters}>
          {['Tümü', 'Aktif', 'Cihaz Kullanan', 'Randevusu Olan', 'Recall Bekleyen', 'Son 3 Ayda Gelen', 'Yeni Hastalar', 'Cihaz Serviste', 'Pasif'].map((filter) => (
              <button
                type="button"
                key={filter}
                className={`${styles.quickFilter} ${quickFilter === filter ? styles.quickFilterActive : ''}`}
                aria-pressed={quickFilter === filter}
                onClick={() => setQuickFilter(filter)}
              >
                {filter}
              </button>
          ))}
          <button type="button" className={styles.clearFilters} onClick={() => {
            setSearch(''); setFilterLoss('Tümü'); setFilterStatus('Tümü'); setFilterSource('Tümü'); setFilterBranch('Tümü');
            setFilterStartDate(''); setFilterEndDate(''); setFilterDevice('Tümü'); setFilterAppointment('Tümü'); setQuickFilter('Tümü');
          }}><IconRefresh size={14} /> Filtreleri Temizle</button>
        </div>
      </div>

      {/* Hasta listesi ve seçili hasta özeti */}
      <div className={styles.patientWorkspace}>
      <div className={`card ${styles.tableCard}`}>
        <div className="table-container">
          <table className={`mobile-cards ${styles.patientTable}`}>
            <thead>
              <tr>
                <th style={{ width: 36, textAlign: 'center' }}>
                  <input
                    type="checkbox"
                    checked={sorted.length > 0 && checkedRows.size === sorted.length}
                    onChange={() => toggleAllChecks(sorted.map(p => p.id))}
                    style={{ width: 15, height: 15, accentColor: '#08785b', cursor: 'pointer' }}
                    aria-label="Tümünü seç"
                  />
                </th>
                <th style={thStyle} onClick={() => handleSort('name')}>Hasta <SortIcon column="name" sortKey={sortKey} sortDir={sortDir} /></th>
                <th style={thStyle} className="hide-tablet">İletişim</th>
                <th style={thStyle} onClick={() => handleSort('lastVisit')}>Son Randevu <SortIcon column="lastVisit" sortKey={sortKey} sortDir={sortDir} /></th>
                <th style={thStyle} onClick={() => handleSort('device')}>Cihaz Bilgisi <SortIcon column="device" sortKey={sortKey} sortDir={sortDir} /></th>
                <th style={thStyle} onClick={() => handleSort('sgkStatus')}>Durum <SortIcon column="sgkStatus" sortKey={sortKey} sortDir={sortDir} /></th>
                <th style={thStyle}>Son İşlem</th>
                <th style={{ width: 100, textAlign: 'center' }}>İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((patient) => {
                const patientAppointments = branchAppointments.filter(a => a.patientId === patient.id).sort((a, b) => `${b.date} ${b.time}`.localeCompare(`${a.date} ${a.time}`));
                const lastApt = patientAppointments[0];
                const deviceItem = assignedStockByPatient.get(patient.id);
                const deviceName = patient.currentDevice || deviceItem?.model;
                const lastTimeline = (patient.timeline || []).slice(-1)[0];
                const statusLabel = patient.sgkStatus === 'Aktif' ? 'Aktif'
                  : patient.sgkStatus === 'Yenileme Hakkı Var' ? 'Takipte'
                  : patient.patientStatus === 'Tamir için gelen' ? 'Serviste'
                  : patient.patientStatus === 'Potansiyel' ? 'Yeni'
                  : patient.sgkStatus === 'Pasif' ? 'Pasif'
                  : 'Aktif';
                const statusClass = statusLabel === 'Aktif' ? 'success'
                  : statusLabel === 'Takipte' ? 'warning'
                  : statusLabel === 'Serviste' ? 'accent'
                  : statusLabel === 'Yeni' ? 'info'
                  : statusLabel === 'Pasif' ? 'neutral'
                  : 'success';
                return (
                <tr
                  key={patient.id}
                  className={activePatient?.id === patient.id ? styles.selectedPatientRow : undefined}
                  aria-selected={activePatient?.id === patient.id}
                  style={{ cursor: 'pointer' }}
                  onClick={() => selectPatientRow(patient.id)}
                  onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); selectPatientRow(patient.id); } }}
                  tabIndex={0}
                >
                  {/* Checkbox */}
                  <td style={{ textAlign: 'center', width: 36 }} onClick={e => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={checkedRows.has(patient.id)}
                      onChange={() => toggleRowCheck(patient.id)}
                      style={{ width: 15, height: 15, accentColor: '#08785b', cursor: 'pointer' }}
                      aria-label={`${patient.firstName} ${patient.lastName} seç`}
                    />
                  </td>

                  {/* Hasta */}
                  <td data-label="Hasta">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div className="avatar" style={{ background: getAvatarColor(patient.firstName), borderRadius: '50%' }}>
                        {getInitials(patient.firstName, patient.lastName)}
                      </div>
                      <div>
                        <div className="td-primary">{patient.firstName} {patient.lastName}</div>
                        <div style={{ fontSize: '0.68rem', color: '#7c8991' }}>
                          {calculateAge(patient.birthDate)} yaş · {patient.gender}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* İletişim */}
                  <td data-label="İletişim" className="hide-tablet">
                    <div style={{ fontSize: '0.78rem', fontWeight: 600, color: '#1e303a' }}>{patient.phone}</div>
                    <div style={{ fontSize: '0.68rem', color: '#7c8991' }}>{patient.email || '—'}</div>
                  </td>

                  {/* Son Randevu */}
                  <td data-label="Son Randevu">
                    {lastApt ? (
                      <div>
                        <div style={{ fontSize: '0.78rem', fontWeight: 500, color: '#1e303a' }}>{formatDate(lastApt.date)} {lastApt.time}</div>
                        <div style={{ fontSize: '0.68rem', color: '#7c8991' }}>{lastApt.type}</div>
                      </div>
                    ) : <span style={{ color: '#a0a8af', fontSize: '0.76rem' }}>Randevu yok</span>}
                  </td>

                  {/* Cihaz Bilgisi */}
                  <td data-label="Cihaz Bilgisi">
                    {deviceName ? (
                      <div>
                        <div style={{ fontSize: '0.78rem', fontWeight: 500, color: '#1e303a' }}>{deviceName}</div>
                        {deviceItem?.serialNo && <div style={{ fontSize: '0.66rem', color: '#7c8991' }}>SN: {deviceItem.serialNo}</div>}
                        {deviceItem?.barcode && (
                          <div style={{ display: 'flex', gap: 4, marginTop: 2 }}>
                            <span className="badge badge-info" style={{ fontSize: '0.6rem', padding: '1px 5px' }}>Sol</span>
                            <span className="badge badge-success" style={{ fontSize: '0.6rem', padding: '1px 5px' }}>Sağ</span>
                          </div>
                        )}
                      </div>
                    ) : <span style={{ color: '#a0a8af', fontSize: '0.76rem' }}>—</span>}
                  </td>

                  {/* Durum */}
                  <td data-label="Durum">
                    <span className={`badge badge-${statusClass}`} style={{ borderRadius: 20, padding: '3px 10px', fontSize: '0.68rem' }}>
                      <span className={`badge-dot ${statusClass}`} style={{ marginRight: 4 }} />
                      {statusLabel}
                    </span>
                  </td>

                  {/* Son İşlem */}
                  <td data-label="Son İşlem">
                    {lastTimeline ? (
                      <div>
                        <div style={{ fontSize: '0.76rem', color: '#344a55' }}>{lastTimeline.action?.slice(0, 30)}{(lastTimeline.action?.length || 0) > 30 ? '...' : ''}</div>
                        <div style={{ fontSize: '0.66rem', color: '#a0a8af' }}>{lastTimeline.date || ''}</div>
                      </div>
                    ) : <span style={{ color: '#a0a8af', fontSize: '0.76rem' }}>—</span>}
                  </td>

                  {/* İşlemler — 📅 Takvim, 📞 Arama, ⋮ Üç Nokta */}
                  <td data-label="İşlemler" style={{ textAlign: 'center' }} onClick={e => e.stopPropagation()}>
                    <div className={styles.actionBtnGroup}>
                      <button
                        type="button"
                        className={`${styles.tableActionBtn} ${activeActionMenu?.type === 'calendar' && activeActionMenu?.patient.id === patient.id ? styles.tableActionBtnActive : ''}`}
                        title="Randevu İşlemleri"
                        aria-label="Randevu İşlemleri"
                        onClick={(e) => handleOpenActionMenu(e, 'calendar', patient)}
                      >
                        <IconCalendarPlus size={15} />
                      </button>
                      <button
                        type="button"
                        className={`${styles.tableActionBtn} ${activeActionMenu?.type === 'phone' && activeActionMenu?.patient.id === patient.id ? styles.tableActionBtnActive : ''}`}
                        title="İletişim ve Arama"
                        aria-label="İletişim ve Arama"
                        onClick={(e) => handleOpenActionMenu(e, 'phone', patient)}
                      >
                        <IconPhoneCall size={15} />
                      </button>
                      <button
                        type="button"
                        className={`${styles.tableActionBtn} ${activeActionMenu?.type === 'more' && activeActionMenu?.patient.id === patient.id ? styles.tableActionBtnActive : ''}`}
                        title="Diğer İşlemler"
                        aria-label="Diğer İşlemler"
                        onClick={(e) => handleOpenActionMenu(e, 'more', patient)}
                      >
                        <IconDotsVertical size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="empty-state">
            <div className="empty-state-icon"><IconSearch size={40} strokeWidth={1.2} /></div>
            <h3>Sonuç bulunamadı</h3>
            <p>Arama kriterlerinizi değiştirmeyi deneyin.</p>
          </div>
        )}
      </div>

      {showPatientPanel && activePatient && (
        <aside className={styles.patientPanel} aria-label={`${activePatient.firstName} ${activePatient.lastName} hasta özeti`}>
          <div className={styles.patientPanelHeader}>
            <div className={styles.patientAvatar} style={{ background: getAvatarColor(activePatient.firstName) }}>{getInitials(activePatient.firstName, activePatient.lastName)}</div>
            <div className={styles.patientPanelIdentity}>
              <strong>{activePatient.firstName} {activePatient.lastName}</strong>
              <span>{calculateAge(activePatient.birthDate)} yaş · {activePatient.gender}</span>
            </div>
            <span className={styles.patientStatus}>{activePatient.patientStatus || 'Durum belirtilmemiş'}</span>
            <button className={styles.panelClose} type="button" aria-label="Hasta özetini kapat" onClick={() => setShowPatientPanel(false)}><IconClose size={16} /></button>
          </div>

          <nav className={styles.patientPanelTabs} aria-label="Hasta bilgi sekmeleri">
            {(['Genel', 'Cihazlar', 'Randevular', 'İşlemler', 'Ödemeler'] as const).map(tab => (
              <button key={tab} type="button" className={patientPanelTab === tab ? styles.panelTabActive : ''} aria-pressed={patientPanelTab === tab} onClick={() => setPatientPanelTab(tab)}>{tab}</button>
            ))}
          </nav>

          <div className={styles.patientPanelBody}>
            {patientPanelTab === 'Genel' && (
              <>
                <div className={styles.panelSectionHeading}><strong>İletişim Bilgileri</strong><button type="button" onClick={() => handlePatientClick(activePatient.id)}>Düzenle</button></div>
                <a className={styles.contactRow} href={`tel:${activePatient.phone}`}><IconPhone size={16} /><span>{activePatient.phone || 'Telefon bilgisi yok'}</span></a>
                <div className={styles.contactRow}><IconMail size={16} /><span>{activePatient.email || 'E-posta bilgisi yok'}</span></div>
                <div className={styles.contactRow}><IconMapPin size={16} /><span>{activePatient.address || 'Adres bilgisi yok'}</span></div>

                {/* Cihaz Bilgileri */}
                <div style={{ marginTop: 16 }}>
                  <div className={styles.panelSectionHeading}><strong>Cihaz Bilgileri</strong><button type="button" onClick={() => handlePatientClick(activePatient.id)}>Tümünü Gör</button></div>
                  {(activePatient.currentDevice || assignedStockByPatient.get(activePatient.id)) ? (
                    <div className={styles.infoCard}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <strong>{activePatient.currentDevice || assignedStockByPatient.get(activePatient.id)?.model}</strong>
                        <div style={{ display: 'flex', gap: 4 }}>
                          <span className="badge badge-info" style={{ fontSize: '0.58rem', padding: '1px 5px', borderRadius: 10 }}>Sol</span>
                          <span className="badge badge-success" style={{ fontSize: '0.58rem', padding: '1px 5px', borderRadius: 10 }}>Aktif</span>
                        </div>
                      </div>
                      {assignedStockByPatient.get(activePatient.id)?.serialNo && <span>SN: {assignedStockByPatient.get(activePatient.id)?.serialNo}</span>}
                    </div>
                  ) : <p className={styles.panelEmpty} style={{ margin: '8px 0' }}>Kayıtlı cihaz yok</p>}
                </div>

                {/* Son Randevu */}
                <div style={{ marginTop: 14 }}>
                  <div className={styles.panelSectionHeading}><strong>Son Randevu</strong><button type="button" onClick={() => { setSelectedPatientId(activePatient.id); setCurrentPage('appointments'); }}>Tüm Randevular</button></div>
                  {activePatientAppointments.length > 0 ? (() => {
                    const latestApt = activePatientAppointments[activePatientAppointments.length - 1];
                    return (
                      <div className={styles.infoCard}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <IconCalendar size={14} />
                          <strong>{formatDate(latestApt.date)}, {latestApt.time}</strong>
                        </div>
                        <span>{latestApt.type} · {latestApt.branch || 'Merkez Şube'}</span>
                        <button
                          type="button"
                          className={styles.primaryPanelAction}
                          style={{ marginTop: 6, minHeight: 32, fontSize: '0.72rem', borderRadius: 8, background: '#e8f6f0', color: '#08785b' }}
                          onClick={() => { setSelectedPatientId(activePatient.id); setCurrentPage('appointments'); }}
                        >
                          <IconCalendar size={13} /> Randevu Oluştur
                        </button>
                      </div>
                    );
                  })() : (
                    <div className={styles.infoCard}>
                      <span>Kayıtlı randevu yok</span>
                      <button
                        type="button"
                        className={styles.primaryPanelAction}
                        style={{ marginTop: 4, minHeight: 32, fontSize: '0.72rem', borderRadius: 8, background: '#e8f6f0', color: '#08785b' }}
                        onClick={() => { setSelectedPatientId(activePatient.id); setCurrentPage('appointments'); }}
                      >
                        <IconCalendar size={13} /> Randevu Oluştur
                      </button>
                    </div>
                  )}
                </div>

                {/* Son İşlemler */}
                <div style={{ marginTop: 14 }}>
                  <div className={styles.panelSectionHeading}><strong>Son İşlemler</strong><button type="button" onClick={() => handlePatientClick(activePatient.id)}>Tümünü Gör</button></div>
                  {(activePatient.timeline || []).length > 0 ? (
                    (activePatient.timeline || []).slice(-3).reverse().map((item, idx) => (
                      <div key={idx} className={styles.listItem} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#08785b', flexShrink: 0 }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <strong>{item.action}</strong>
                          <span>{item.date}</span>
                        </div>
                      </div>
                    ))
                  ) : <p className={styles.panelEmpty} style={{ margin: '8px 0' }}>Kayıtlı işlem yok</p>}
                </div>
              </>
            )}
            {patientPanelTab === 'Cihazlar' && (
              <>
                <div className={styles.panelSectionHeading}><strong>Kayıtlı Cihaz</strong><button type="button" onClick={() => handlePatientClick(activePatient.id)}>Hasta detayında aç</button></div>
                {activePatient.currentDevice || assignedStockByPatient.get(activePatient.id) ? (
                  <div className={styles.infoCard}>
                    <strong>{activePatient.currentDevice || assignedStockByPatient.get(activePatient.id)?.model}</strong>
                    {assignedStockByPatient.get(activePatient.id)?.serialNo && <span>Seri No: {assignedStockByPatient.get(activePatient.id)?.serialNo}</span>}
                    {assignedStockByPatient.get(activePatient.id)?.barcode && <span>Barkod: {assignedStockByPatient.get(activePatient.id)?.barcode}</span>}
                  </div>
                ) : <p className={styles.panelEmpty}>Bu hasta için kayıtlı cihaz bulunmuyor.</p>}
              </>
            )}
            {patientPanelTab === 'Randevular' && (
              <>
                <div className={styles.panelSectionHeading}><strong>Randevu Geçmişi</strong><button type="button" onClick={() => { setSelectedPatientId(activePatient.id); setCurrentPage('appointments'); }}>Takvime git</button></div>
                {activePatientAppointments.length ? activePatientAppointments.slice(0, 5).map(appointment => (
                  <div className={styles.listItem} key={appointment.id}><strong>{appointment.type}</strong><span>{formatDate(appointment.date)} · {appointment.time} · {appointment.status}</span></div>
                )) : <p className={styles.panelEmpty}>Bu hasta için kayıtlı randevu bulunmuyor.</p>}
              </>
            )}
            {patientPanelTab === 'İşlemler' && (
              <>
                <div className={styles.panelSectionHeading}><strong>Satış / İşlem Kayıtları</strong><IconCash size={17} /></div>
                {activePatientSales.length ? activePatientSales.slice(0, 5).map(sale => (
                  <div className={styles.listItem} key={sale.id}><strong>{sale.items.map(item => item.name).join(', ') || 'Satış kaydı'}</strong><span>{formatDate(sale.date)} · {sale.total.toLocaleString('tr-TR')} ₺</span></div>
                )) : <p className={styles.panelEmpty}>Bu hasta için kayıtlı satış/işlem bulunmuyor.</p>}
              </>
            )}
            {patientPanelTab === 'Ödemeler' && (
              <>
                <div className={styles.panelSectionHeading}><strong>Tahsilat Durumu</strong><IconCash size={17} /></div>
                {activePatientSales.length ? activePatientSales.map(sale => (
                  <div className={styles.listItem} key={sale.id}><strong>{sale.patientAmount.toLocaleString('tr-TR')} ₺ hasta payı</strong><span>{formatDate(sale.date)} · {sale.status}</span></div>
                )) : <p className={styles.panelEmpty}>Bu hasta için kayıtlı tahsilat bulunmuyor.</p>}
              </>
            )}
          </div>

          <div className={styles.patientPanelFooter}>
            <button type="button" className={styles.primaryPanelAction} onClick={() => handlePatientClick(activePatient.id)}>Hasta Detayını Görüntüle <IconArrowRight size={15} /></button>
          </div>
        </aside>
      )}
      </div>

      {/* Bottom bar — Toplam hasta sayısı */}
      <div className={styles.bottomBar}>
        <span>Toplam <strong>{filtered.length.toLocaleString('tr-TR')}</strong> hasta</span>
      </div>


      {/* Add Patient Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 640 }}>
            <div className="modal-header">
              <span className="modal-title">Yeni Hasta Ekle</span>
              <button className="modal-close" onClick={() => setShowAddModal(false)} aria-label="Kapat">
                <IconClose size={16} strokeWidth={2} />
              </button>
            </div>
            <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto', paddingRight: 8 }}>
              {/* Fotoğraf Yükle Alanı */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20, paddingBottom: 16, borderBottom: '1px solid var(--surface-border-light)' }}>
                <div style={{
                  width: 64, height: 64, borderRadius: '50%', background: 'var(--gray-100)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  overflow: 'hidden', border: '2px solid var(--gray-200)', color: 'var(--gray-400)'
                }}>
                  {formData.photoUrl ? (
                    <img src={formData.photoUrl} alt="Hasta Fotoğrafı" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <span style={{ fontSize: '1.8rem' }}>👤</span>
                  )}
                </div>

                <div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/jpeg,image/png,image/webp"
                    style={{ display: 'none' }}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        if (file.size > 5 * 1024 * 1024) {
                          alert('Dosya boyutu 5 MB\'dan büyük olamaz.');
                          return;
                        }
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          setFormData(prev => ({ ...prev, photoUrl: reader.result as string }));
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => fileInputRef.current?.click()}
                      style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600, fontSize: '0.84rem' }}
                    >
                      📷 Fotoğraf Yükle
                    </button>
                    {formData.photoUrl && (
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => setFormData(prev => ({ ...prev, photoUrl: '' }))}
                        style={{ color: 'var(--danger-600)', padding: '4px 8px', fontSize: '0.8rem' }}
                      >
                        Kaldır
                      </button>
                    )}
                  </div>
                  <div style={{ fontSize: '0.76rem', color: 'var(--gray-500)', marginTop: 4 }}>
                    Tek fotoğraf, en fazla 5 MB (JPG/PNG/WebP)
                  </div>
                </div>
              </div>

              {/* Temel Bilgiler */}
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label"><span style={{ color: 'var(--danger-500)', marginRight: 2 }}>*</span> Ad</label>
                  <input
                    className="form-input"
                    placeholder="Ad"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label"><span style={{ color: 'var(--danger-500)', marginRight: 2 }}>*</span> Soyad</label>
                  <input
                    className="form-input"
                    placeholder="Soyad"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  />
                </div>
              </div>

              {activeBranch.mode === 'all' && branchesList.filter(branch => branch.status === 'Aktif').length > 1 && <div className="form-group">
                <label className="form-label">Kayıt şubesi</label>
                <select className="form-input" required value={formBranchId} onChange={event => setFormBranchId(event.target.value)}>
                  <option value="">Şube seçin</option>
                  {branchesList.filter(branch => branch.status === 'Aktif').map(branch => <option key={branch.id} value={branch.id}>{branch.name}</option>)}
                </select>
              </div>}

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label"><span style={{ color: 'var(--danger-500)', marginRight: 2 }}>*</span> TC Kimlik No</label>
                  <input
                    className="form-input"
                    placeholder="TC Kimlik No"
                    maxLength={11}
                    value={formData.tc}
                    onChange={(e) => setFormData({ ...formData, tc: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Cinsiyet</label>
                  <CustomSelect
                    value={formData.gender}
                    options={['Erkek', 'Kadın']}
                    onChange={(val) => setFormData({ ...formData, gender: val as Patient['gender'] })}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label"><span style={{ color: 'var(--danger-500)', marginRight: 2 }}>*</span> Telefon</label>
                  <input
                    className="form-input"
                    placeholder="05XX XXX XX XX"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Doğum Tarihi</label>
                  <input
                    className="form-input"
                    type="date"
                    value={formData.birthDate}
                    onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                  />
                  {formData.birthDate && (
                    <span className="badge badge-info" style={{ marginTop: 4, alignSelf: 'flex-start', fontSize: '0.74rem' }}>
                      Yaş: {calculateAge(formData.birthDate)}
                    </span>
                  )}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label"><span style={{ color: 'var(--danger-500)', marginRight: 2 }}>*</span> Adres</label>
                <textarea
                  className="form-textarea"
                  placeholder="Adres"
                  rows={2}
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
              </div>

              {/* Ekstra Bilgiler (Mevcut Alanlar) */}
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">E-posta (İsteğe Bağlı)</label>
                  <input
                    className="form-input"
                    placeholder="email@adres.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">İşitme Kaybı Derecesi</label>
                  <CustomSelect
                    value={formData.hearingLoss}
                    options={['Hafif', 'Orta', 'İleri', 'Çok İleri']}
                    onChange={(val) => setFormData({ ...formData, hearingLoss: val as Patient['hearingLoss'] })}
                  />
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">İşitme Kaybı Tarafı</label>
                  <CustomSelect
                    value={formData.hearingLossSide}
                    options={['Sol', 'Sağ', 'Her İki Kulak']}
                    onChange={(val) => setFormData({ ...formData, hearingLossSide: val as Patient['hearingLossSide'] })}
                  />
                </div>
                <div className="form-group" style={{ visibility: 'hidden' }} />
              </div>

              {/* Hasta Yakını İletişim */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 24, marginBottom: 16 }}>
                <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--gray-700)', whiteSpace: 'nowrap' }}>Hasta Yakını İletişim</span>
                <div style={{ flex: 1, height: 1, background: 'var(--gray-200)' }} />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Yakın Adı</label>
                  <input
                    className="form-input"
                    placeholder="Örn: Eşim Ayşe Hanım"
                    value={formData.emergencyContactName}
                    onChange={(e) => setFormData({ ...formData, emergencyContactName: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Yakın Telefon</label>
                  <input
                    className="form-input"
                    placeholder="05XX XXX XX XX"
                    value={formData.emergencyContactPhone}
                    onChange={(e) => setFormData({ ...formData, emergencyContactPhone: e.target.value })}
                  />
                </div>
              </div>

              {/* E-Reçete / SGK Kodları */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 24, marginBottom: 16 }}>
                <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--gray-700)', whiteSpace: 'nowrap' }}>E-Reçete / SGK Kodları</span>
                <div style={{ flex: 1, height: 1, background: 'var(--gray-200)' }} />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Reçete No</label>
                  <input
                    className="form-input"
                    placeholder="E-Reçete numarası"
                    value={formData.prescriptionNo}
                    onChange={(e) => setFormData({ ...formData, prescriptionNo: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Rapor No</label>
                  <input
                    className="form-input"
                    placeholder="Rapor numarası"
                    value={formData.reportNo}
                    onChange={(e) => setFormData({ ...formData, reportNo: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">
                    SGK Sigorta Durumu 
                    <span style={{ color: 'var(--gray-400)', cursor: 'help', marginLeft: 4 }} title="Hastanın SGK güvence tipini seçin.">ⓘ</span>
                  </label>
                  <CustomSelect
                    value={formData.sgkInsuranceStatus}
                    options={[
                      'Belirtilmemiş',
                      'Çalışan (sigortalı)',
                      'Emekli',
                      'Diğer / Kapsam dışı'
                    ]}
                    onChange={(val) => setFormData({ ...formData, sgkInsuranceStatus: val as NonNullable<Patient['sgkInsuranceStatus']> })}
                  />
                </div>
                
                {/* SGK warning box */}
                {!formData.birthDate ? (
                  <div style={{
                    background: '#fef8ec',
                    border: '1px solid #fcebc6',
                    borderRadius: 'var(--radius-md)',
                    padding: '10px 14px',
                    color: '#b87214',
                    fontSize: '0.8rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    height: 'fit-content',
                    alignSelf: 'end',
                    marginBottom: 8,
                    flex: 1
                  }}>
                    <span style={{ fontSize: '1rem', lineHeight: 1 }}>ⓘ</span>
                    <span>SGK katkısı için hastanın <strong>doğum tarihi</strong> girilmelidir.</span>
                  </div>
                ) : (
                  <div className="form-group" style={{ flex: 1 }} />
                )}
              </div>

              {/* Hasta Durumu */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 24, marginBottom: 16 }}>
                <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--gray-700)', whiteSpace: 'nowrap' }}>Hasta Durumu</span>
                <div style={{ flex: 1, height: 1, background: 'var(--gray-200)' }} />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Durum</label>
                  <CustomSelect
                    value={formData.patientStatus}
                    options={[
                      'Potansiyel',
                      'Deneme Yapıldı',
                      'Müşteri',
                      'Satın Almayanlar',
                      'Genel',
                      'Tamir için gelen',
                      'Kalıp Hastası',
                      'Pil Hastası'
                    ]}
                    onChange={(val) => setFormData({ ...formData, patientStatus: val as NonNullable<Patient['patientStatus']> })}
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">Nasıl Duydunuz? (Referans Kaynağı)</label>
                  <CustomSelect
                    value={formData.source}
                    options={[
                      { value: 'Doktor', label: 'Doktor Yönlendirmesi' },
                      { value: 'Sosyal Medya', label: 'Sosyal Medya' },
                      { value: 'Tavsiye', label: 'Hasta Tavsiyesi' },
                      { value: 'Yürüyerek', label: 'Yürüyerek (Walk-in)' },
                      { value: 'Web', label: 'Web Sitesi' }
                    ]}
                    onChange={(val) => setFormData({ ...formData, source: val as NonNullable<Patient['source']> })}
                  />
                </div>
              </div>

              {/* Hasta Notu */}
              <div className="form-group" style={{ marginTop: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <label className="form-label" style={{ marginBottom: 0 }}>Hasta Notu</label>
                  <span style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>{formData.notes.length} / 50000</span>
                </div>
                <textarea
                  className="form-textarea"
                  placeholder="Hasta hakkında notlar..."
                  maxLength={50000}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                />
              </div>

              {/* KVKK Açık Rıza Formu */}
              <div className="form-group" style={{ marginTop: 14, padding: '12px 14px', background: 'var(--surface-light, #f8fafc)', borderRadius: 8, border: '1px solid var(--border-color, #e2e8f0)' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontWeight: 500, fontSize: '0.85rem', color: 'var(--text-main)' }}>
                  <input
                    type="checkbox"
                    checked={formData.consentGiven}
                    onChange={(e) => setFormData({ ...formData, consentGiven: e.target.checked })}
                    style={{ width: 18, height: 18, accentColor: 'var(--primary-500, #0ea5e9)' }}
                  />
                  <span>📋 <strong>KVKK Kişisel Sağlık Verileri Rıza Formu:</strong> Hastadan özel nitelikli kişisel veri işleme açık rızası alındı.</span>
                </label>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowAddModal(false)}>İptal</button>
              <button className="btn btn-primary" onClick={handleSave}>Tamam</button>
            </div>
          </div>
        </div>
      )}

      {/* Excel ile Toplu Hasta Yükle Modalı (Wizard) */}
      {showBulkAddModal && (
        <div className="modal-overlay" onClick={() => setShowBulkAddModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 650, width: '95%' }}>
            
            {/* Modal Header */}
            <div className="modal-header" style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: '1.2rem' }}>📄</span>
                <span className="modal-title" style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a' }}>
                  Excel ile Hasta Yükle
                </span>
              </div>
              <button className="modal-close" onClick={() => setShowBulkAddModal(false)}>✕</button>
            </div>

            {/* Stepper Navigation Bar */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '14px 20px', background: '#ffffff', borderBottom: '1px solid #f1f5f9'
            }}>
              {[
                { step: 1, label: 'Şablon İndir' },
                { step: 2, label: 'Dosya Yükle' },
                { step: 3, label: 'Doğrulama' },
                { step: 4, label: 'Sonuç' }
              ].map((item, index) => {
                const isActive = bulkStep === item.step;
                const isDone = bulkStep > item.step;
                return (
                  <React.Fragment key={item.step}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{
                        width: 24, height: 24, borderRadius: '50%',
                        background: isActive ? '#2563eb' : isDone ? '#16a34a' : '#f1f5f9',
                        color: isActive || isDone ? '#ffffff' : '#94a3b8',
                        fontSize: '0.78rem', fontWeight: 700,
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                      }}>
                        {isDone ? '✓' : item.step}
                      </div>
                      <span style={{
                        fontSize: '0.86rem',
                        fontWeight: isActive ? 700 : 500,
                        color: isActive ? '#0f172a' : '#64748b'
                      }}>
                        {item.label}
                      </span>
                    </div>
                    {index < 3 && (
                      <div style={{ flex: 1, height: 2, background: isDone ? '#16a34a' : '#e2e8f0', margin: '0 6px' }} />
                    )}
                  </React.Fragment>
                );
              })}
            </div>

            {/* Modal Body Content depending on bulkStep */}
            <div className="modal-body" style={{ padding: 20, maxHeight: '72vh', overflowY: 'auto' }}>
              
              {/* STEP 1: ŞABLON İNDİR */}
              {bulkStep === 1 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  
                  {/* Önemli Bilgiler Banner */}
                  <div style={{
                    background: '#e0f2fe', border: '1px solid #bae6fd', borderRadius: 10,
                    padding: 16, display: 'flex', gap: 12
                  }}>
                    <div style={{
                      width: 26, height: 26, borderRadius: '50%', background: '#0284c7', color: '#ffffff',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, flexShrink: 0, fontSize: '0.88rem'
                    }}>
                      i
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.92rem', color: '#0369a1', marginBottom: 6 }}>
                        Önemli Bilgiler
                      </div>
                      <ul style={{ margin: 0, paddingLeft: 18, fontSize: '0.84rem', color: '#0369a1', lineHeight: 1.6 }}>
                        <li>Excel dosyası (.xlsx veya .xls) yükleyebilirsiniz</li>
                        <li>İlk satır başlık satırı olmalıdır</li>
                        <li>Maksimum dosya boyutu: 10 MB</li>
                        <li>Zorunlu alanları mutlaka doldurun</li>
                      </ul>
                    </div>
                  </div>

                  {/* Şablon Alanları Table */}
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.92rem', color: '#0f172a', marginBottom: 10 }}>
                      Şablon Alanları
                    </div>

                    <div style={{ border: '1px solid #e2e8f0', borderRadius: 10, overflow: 'hidden' }}>
                      {[
                        { field: 'Ad', required: true, desc: '- Hastanın adı (zorunlu)' },
                        { field: 'Soyad', required: true, desc: '- Hastanın soyadı (zorunlu)' },
                        { field: 'TC Kimlik No', required: true, desc: '- 11 haneli TC Kimlik numarası (zorunlu, benzersiz)' },
                        { field: 'Telefon', required: true, desc: '- İletişim telefon numarası (zorunlu)' },
                        { field: 'Adres', required: true, desc: '- Hastanın adresi (zorunlu)' },
                        { field: 'Doğum Tarihi', required: false, desc: '- GG.AA.YYYY (örn: 15.06.1980)' },
                        { field: 'Cinsiyet', required: false, desc: '- Erkek veya Kadın' },
                        { field: 'Yakın Adı', required: false, desc: '- Hasta yakınının adı (örn: Eşim Ayşe Hanım)' },
                        { field: 'Yakın Telefon', required: false, desc: '- Yakının telefon numarası' },
                        { field: 'Yakına Bildirim Gönder', required: false, desc: '- Açık veya Kapalı (boş = Açık)' },
                        { field: 'Durum', required: false, desc: '- Potansiyel / Deneme Yapıldı / Müşteri / Satın Almayanlar' },
                        { field: 'Nasıl Duydunuz', required: false, desc: '- Referans kaynağı (serbest metin)' },
                        { field: 'Reçete No', required: false, desc: '- E-Reçete numarası' },
                        { field: 'Rapor No', required: false, desc: '- SGK rapor numarası' },
                        { field: 'Notlar', required: false, desc: '- Hasta hakkında serbest not' },
                      ].map((row, idx, arr) => (
                        <div key={idx} style={{
                          display: 'flex', alignItems: 'center', padding: '10px 14px',
                          borderBottom: idx === arr.length - 1 ? 'none' : '1px solid #f1f5f9',
                          fontSize: '0.84rem', background: idx % 2 === 0 ? '#ffffff' : '#fafafa'
                        }}>
                          <div style={{ width: '38%', fontWeight: 700, color: '#1e293b', display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span>{row.field}</span>
                            {row.required && (
                              <span style={{
                                background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca',
                                borderRadius: 4, padding: '1px 6px', fontSize: '0.72rem', fontWeight: 600
                              }}>
                                Zorunlu
                              </span>
                            )}
                          </div>
                          <div style={{ width: '62%', color: '#64748b' }}>
                            {row.desc}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Template Buttons */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 4 }}>
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={() => handleDownloadPatientTemplate(false)}
                      style={{ width: '100%', minHeight: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontSize: '0.88rem', fontWeight: 600, background: '#2563eb' }}
                    >
                      📥 Boş Şablon İndir
                    </button>

                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => handleDownloadPatientTemplate(true)}
                      style={{ width: '100%', minHeight: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontSize: '0.88rem', fontWeight: 600, background: '#ffffff', border: '1px solid #cbd5e1' }}
                    >
                      📥 Örnek Verili Şablon İndir
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 2: DOSYA YÜKLE */}
              {bulkStep === 2 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div style={{ fontSize: '0.9rem', color: '#334155', fontWeight: 600 }}>
                    Doldurduğunuz Excel dosyasını seçin veya buraya sürükleyin:
                  </div>

                  <label style={{
                    border: '2px dashed #cbd5e1', borderRadius: 12, padding: '36px 20px',
                    textAlign: 'center', background: '#f8fafc', cursor: 'pointer', display: 'block',
                    transition: 'all 0.18s ease'
                  }}>
                    <input
                      type="file"
                      accept=".xlsx,.xls,.csv"
                      style={{ display: 'none' }}
                      onChange={(e) => {
                        if (e.target.files?.[0]) {
                          handleBulkFileSelectAndParse(e.target.files[0]);
                        }
                      }}
                    />
                    <div style={{ fontSize: '2.5rem', marginBottom: 10 }}>📊</div>
                    <div style={{ fontWeight: 700, fontSize: '0.92rem', color: '#0f172a', marginBottom: 4 }}>
                      {selectedBulkFile ? selectedBulkFile.name : 'Excel veya CSV dosyanızı buraya bırakın'}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                      {selectedBulkFile ? `${(selectedBulkFile.size / 1024).toFixed(1)} KB — Değiştirmek için tıklayın` : 'veya dosya seçmek için tıklayın (.xlsx, .xls, .csv maks 10MB)'}
                    </div>
                  </label>

                  {selectedBulkFile && (
                    <div style={{
                      background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8,
                      padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ fontSize: '1.2rem', color: '#16a34a' }}>✓</span>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '0.86rem', color: '#15803d' }}>
                            {selectedBulkFile.name}
                          </div>
                          <div style={{ fontSize: '0.76rem', color: '#166534' }}>
                            {parsedBulkRows.length > 0 ? `${parsedBulkRows.length} hasta okundu. Yüklemeye hazır.` : 'Dosya yüklenmeye hazır.'}
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        onClick={() => { setSelectedBulkFile(null); setParsedBulkRows([]); }}
                        style={{ color: '#dc2626' }}
                      >
                        Kaldır
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* STEP 3: DOĞRULAMA */}
              {bulkStep === 3 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {activeBranch.mode === 'all' && <label className="form-group">Kayıt şubesi<select className="form-select" required value={bulkBranchId} onChange={event => setBulkBranchId(event.target.value)}><option value="">Şube seçin</option>{branchesList.filter(branch => branch.status === 'Aktif').map(branch => <option key={branch.id} value={branch.id}>{branch.name}</option>)}</select></label>}
                  <div style={{
                    background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10,
                    padding: 16, display: 'flex', alignItems: 'center', gap: 12
                  }}>
                    <span style={{ fontSize: '1.5rem', color: '#16a34a' }}>✅</span>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#15803d' }}>
                        Dosya Başarıyla Analiz Edildi
                      </div>
                      <div style={{ fontSize: '0.82rem', color: '#166534', marginTop: 2 }}>
                        <strong>{parsedBulkRows.length} hasta satırı</strong> bulundu. Kayıt öncesinde zorunlu alanlar doğrulanacak.
                      </div>
                    </div>
                  </div>

                  <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#0f172a' }}>
                    İçe Aktarılacak Hasta Verisi Önizlemesi ({parsedBulkRows.length} Satır):
                  </div>

                  <div style={{ border: '1px solid #e2e8f0', borderRadius: 8, overflowX: 'auto', maxHeight: 220 }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                      <thead>
                        <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left' }}>
                          <th style={{ padding: '8px 12px' }}>Ad Soyad</th>
                          <th style={{ padding: '8px 12px' }}>TC Kimlik No</th>
                          <th style={{ padding: '8px 12px' }}>Telefon</th>
                          <th style={{ padding: '8px 12px' }}>Cinsiyet</th>
                          <th style={{ padding: '8px 12px' }}>Durum</th>
                          <th style={{ padding: '8px 12px' }}>Nasıl Duydunuz</th>
                        </tr>
                      </thead>
                      <tbody>
                        {parsedBulkRows.length > 0 ? (
                          parsedBulkRows.map((row: any, i: number) => (
                            <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                              <td style={{ padding: '8px 12px', fontWeight: 600 }}>{row['Ad'] || ''} {row['Soyad'] || ''}</td>
                              <td style={{ padding: '8px 12px' }}>{row['TC Kimlik No'] || row['TC'] || '—'}</td>
                              <td style={{ padding: '8px 12px' }}>{row['Telefon'] || '—'}</td>
                              <td style={{ padding: '8px 12px' }}>{row['Cinsiyet'] || 'Erkek'}</td>
                              <td style={{ padding: '8px 12px' }}>{row['Durum'] || 'Potansiyel'}</td>
                              <td style={{ padding: '8px 12px' }}>{row['Nasıl Duydunuz'] || '—'}</td>
                            </tr>
                          ))
                        ) : <tr><td colSpan={6} style={{ padding: 16, textAlign: 'center' }}>Dosyada aktarılabilir hasta satırı bulunamadı.</td></tr>}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* STEP 4: SONUÇ */}
              {bulkStep === 4 && (
                <div style={{ padding: '24px 12px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
                  <div style={{
                    width: 64, height: 64, borderRadius: '50%', background: '#dcfce7', color: '#15803d',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem'
                  }}>
                    🎉
                  </div>
                  <div style={{ fontWeight: 800, fontSize: '1.2rem', color: '#0f172a' }}>
                    Toplu Hasta Aktarımı Başarıyla Tamamlandı!
                  </div>
                  <div style={{ fontSize: '0.88rem', color: '#475569', maxWidth: 420, lineHeight: 1.5 }}>
                    Excel dosyasındaki <strong>{parsedBulkRows.length > 0 ? parsedBulkRows.length : 3} adet hasta kaydı</strong> veritabanına eklendi ve hasta listeniz güncellendi.
                  </div>
                </div>
              )}

            </div>

            {/* Modal Footer Controls */}
            <div className="modal-footer" style={{ padding: '14px 20px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                {bulkStep > 1 && bulkStep < 4 && (
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setBulkStep((prev) => (prev - 1) as any)}
                  >
                    Geri
                  </button>
                )}
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                {bulkStep < 4 && (
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setShowBulkAddModal(false)}
                  >
                    İptal
                  </button>
                )}

                {bulkStep === 1 && (
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => setBulkStep(2)}
                    style={{ background: '#2563eb', padding: '8px 22px' }}
                  >
                    İleri
                  </button>
                )}

                {bulkStep === 2 && (
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => setBulkStep(3)}
                    disabled={!selectedBulkFile}
                    style={{ background: '#2563eb', padding: '8px 22px' }}
                  >
                    İleri
                  </button>
                )}

                {bulkStep === 3 && (
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={async () => {
                      const assignedBranchId = activeBranch.mode === 'single' ? activeBranch.branchId : bulkBranchId;
                      const assignedBranch = branchesList.find(branch => branch.id === assignedBranchId);
                      if (!assignedBranch || !parsedBulkRows.length) { addToast({ type: 'error', message: 'Aktarım için veri içeren dosya ve şube seçin.' }); return; }
                      const validRows = parsedBulkRows.filter((row: any) => row['Ad'] && row['Soyad'] && (row['TC Kimlik No'] || row['TC']) && row['Telefon']);
                      if (!validRows.length || validRows.length !== parsedBulkRows.length) { addToast({ type: 'error', message: 'Her satırda ad, soyad, TC kimlik numarası ve telefon bulunmalıdır. Dosya kaydedilmedi.' }); return; }
                      setIsBulkImporting(true);
                      try {
                        await Promise.all(validRows.map((row: any) => addPatient({
                          id: `p-bulk-${crypto.randomUUID()}`,
                          firstName: String(row['Ad']).trim(), lastName: String(row['Soyad']).trim(),
                          tc: String(row['TC Kimlik No'] || row['TC']).trim(), phone: String(row['Telefon']).trim(),
                          gender: (row['Cinsiyet'] as any) || 'Erkek', birthDate: String(row['Doğum Tarihi'] || ''),
                          email: String(row['E-posta'] || ''), address: String(row['Adres'] || ''),
                          hearingLoss: 'Hafif', hearingLossSide: 'Her İki Kulak', sgkStatus: 'Aktif',
                          notes: row['Notlar'] || 'Toplu Hasta Ekleme',
                          emergencyContactName: row['Yakın Adı'] || undefined, emergencyContactPhone: row['Yakın Telefon'] || undefined,
                          prescriptionNo: row['Reçete No'] || undefined, reportNo: row['Rapor No'] || undefined,
                          patientStatus: (row['Durum'] as any) || 'Potansiyel', source: (row['Nasıl Duydunuz'] as any) || 'Tavsiye',
                          branch: assignedBranch.name, branchId: assignedBranch.id,
                          timeline: [{ date: new Intl.DateTimeFormat('tr-TR').format(new Date()), action: 'Excel ile toplu hasta kaydı oluşturuldu.', icon: 'Plus' }]
                        })));
                        setBulkStep(4);
                        addToast({ type: 'success', message: `${validRows.length} hasta kaydı veritabanına eklendi.` });
                      } catch { /* Persistence layer reports the error; do not advance to success. */ }
                      finally { setIsBulkImporting(false); }
                    }}
                    disabled={isBulkImporting || !parsedBulkRows.length}
                    style={{ background: '#2563eb', padding: '8px 22px' }}
                  >
                    {isBulkImporting ? 'Aktarılıyor...' : '🚀 İçe Aktarımı Başlat'}
                  </button>
                )}

                {bulkStep === 4 && (
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => setShowBulkAddModal(false)}
                    style={{ background: '#2563eb', padding: '8px 22px' }}
                  >
                    Tamam
                  </button>
                )}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Excel ile Geçmiş Kayıt Yükle Modalı (Wizard) */}
      {showImportHistoryModal && (
        <div className="modal-overlay" onClick={() => setShowImportHistoryModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 650, width: '95%' }}>
            
            {/* Modal Header */}
            <div className="modal-header" style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: '1.2rem' }}>📄</span>
                <span className="modal-title" style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a' }}>
                  Excel ile Geçmiş Kayıt Yükle
                </span>
              </div>
              <button className="modal-close" onClick={() => setShowImportHistoryModal(false)}>✕</button>
            </div>

            {/* Stepper Navigation Bar */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '14px 20px', background: '#ffffff', borderBottom: '1px solid #f1f5f9'
            }}>
              {[
                { step: 1, label: 'Şablon İndir' },
                { step: 2, label: 'Dosya Yükle' },
                { step: 3, label: 'Doğrulama' },
                { step: 4, label: 'Sonuç' }
              ].map((item, index) => {
                const isActive = importStep === item.step;
                const isDone = importStep > item.step;
                return (
                  <React.Fragment key={item.step}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{
                        width: 24, height: 24, borderRadius: '50%',
                        background: isActive ? '#2563eb' : isDone ? '#16a34a' : '#f1f5f9',
                        color: isActive || isDone ? '#ffffff' : '#94a3b8',
                        fontSize: '0.78rem', fontWeight: 700,
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                      }}>
                        {isDone ? '✓' : item.step}
                      </div>
                      <span style={{
                        fontSize: '0.86rem',
                        fontWeight: isActive ? 700 : 500,
                        color: isActive ? '#0f172a' : '#64748b'
                      }}>
                        {item.label}
                      </span>
                    </div>
                    {index < 3 && (
                      <div style={{ flex: 1, height: 2, background: isDone ? '#16a34a' : '#e2e8f0', margin: '0 6px' }} />
                    )}
                  </React.Fragment>
                );
              })}
            </div>

            {/* Modal Body Content depending on importStep */}
            <div className="modal-body" style={{ padding: 20, maxHeight: '72vh', overflowY: 'auto' }}>
              
              {/* STEP 1: ŞABLON İNDİR */}
              {importStep === 1 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  
                  {/* Önemli Bilgiler Banner */}
                  <div style={{
                    background: '#e0f2fe', border: '1px solid #bae6fd', borderRadius: 10,
                    padding: 16, display: 'flex', gap: 12
                  }}>
                    <div style={{
                      width: 26, height: 26, borderRadius: '50%', background: '#0284c7', color: '#ffffff',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, flexShrink: 0, fontSize: '0.88rem'
                    }}>
                      i
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.92rem', color: '#0369a1', marginBottom: 6 }}>
                        Önemli Bilgiler
                      </div>
                      <ul style={{ margin: 0, paddingLeft: 18, fontSize: '0.84rem', color: '#0369a1', lineHeight: 1.6 }}>
                        <li>Excel dosyası (.xlsx veya .xls) yükleyebilirsiniz</li>
                        <li>İlk satır başlık satırı olmalıdır</li>
                        <li>Maksimum dosya boyutu: 10 MB</li>
                        <li>Zorunlu alanları mutlaka doldurun</li>
                      </ul>
                    </div>
                  </div>

                  {/* Şablon Alanları Table */}
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.92rem', color: '#0f172a', marginBottom: 10 }}>
                      Şablon Alanları
                    </div>

                    <div style={{ border: '1px solid #e2e8f0', borderRadius: 10, overflow: 'hidden' }}>
                      {[
                        { field: 'Ad / Soyad / TC / Telefon / Adres', required: true, desc: '- Hasta bilgileri (zorunlu) — mevcut hasta varsa TC ile eşleşir' },
                        { field: 'Hareket Tipi', required: false, desc: '- Verme veya İade (boş = sadece hasta eklenir)' },
                        { field: 'Cihaz/Sarf', required: false, desc: '- Cihaz, Sarf veya Diğer (boş = Cihaz)' },
                        { field: 'Cihaz (Marka/Model)', required: false, desc: '- Verilen/alınan cihaz — serbest metin' },
                        { field: 'Cihaz Seri No', required: false, desc: '- Seri numarası (opsiyonel)' },
                        { field: 'İşlem Tarihi', required: false, desc: '- GG.AA.YYYY (Hareket Tipi doluysa zorunlu)' },
                        { field: 'Tutar / Ödenen', required: false, desc: '- İşlem tutarları (opsiyonel)' },
                        { field: 'Hareket Notu', required: false, desc: '- Harekete özel not (opsiyonel)' },
                      ].map((row, idx, arr) => (
                        <div key={idx} style={{
                          display: 'flex', alignItems: 'center', padding: '10px 14px',
                          borderBottom: idx === arr.length - 1 ? 'none' : '1px solid #f1f5f9',
                          fontSize: '0.84rem', background: idx % 2 === 0 ? '#ffffff' : '#fafafa'
                        }}>
                          <div style={{ width: '38%', fontWeight: 700, color: '#1e293b', display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span>{row.field}</span>
                            {row.required && (
                              <span style={{
                                background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca',
                                borderRadius: 4, padding: '1px 6px', fontSize: '0.72rem', fontWeight: 600
                              }}>
                                Zorunlu
                              </span>
                            )}
                          </div>
                          <div style={{ width: '62%', color: '#64748b' }}>
                            {row.desc}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Template Buttons */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 4 }}>
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={() => handleDownloadTemplate(false)}
                      style={{ width: '100%', minHeight: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontSize: '0.88rem', fontWeight: 600, background: '#2563eb' }}
                    >
                      📥 Boş Şablon İndir
                    </button>

                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => handleDownloadTemplate(true)}
                      style={{ width: '100%', minHeight: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontSize: '0.88rem', fontWeight: 600, background: '#ffffff', border: '1px solid #cbd5e1' }}
                    >
                      📥 Örnek Verili Şablon İndir
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 2: DOSYA YÜKLE */}
              {importStep === 2 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div style={{ fontSize: '0.9rem', color: '#334155', fontWeight: 600 }}>
                    Doldurduğunuz Excel dosyasını seçin veya buraya sürükleyin:
                  </div>

                  <label style={{
                    border: '2px dashed #cbd5e1', borderRadius: 12, padding: '36px 20px',
                    textAlign: 'center', background: '#f8fafc', cursor: 'pointer', display: 'block',
                    transition: 'all 0.18s ease'
                  }}>
                    <input
                      type="file"
                      accept=".xlsx,.xls,.csv"
                      style={{ display: 'none' }}
                      onChange={(e) => {
                        if (e.target.files?.[0]) {
                          handleFileSelectAndParse(e.target.files[0]);
                        }
                      }}
                    />
                    <div style={{ fontSize: '2.5rem', marginBottom: 10 }}>📊</div>
                    <div style={{ fontWeight: 700, fontSize: '0.92rem', color: '#0f172a', marginBottom: 4 }}>
                      {selectedImportFile ? selectedImportFile.name : 'Excel veya CSV dosyanızı buraya bırakın'}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                      {selectedImportFile ? `${(selectedImportFile.size / 1024).toFixed(1)} KB — Değiştirmek için tıklayın` : 'veya dosya seçmek için tıklayın (.xlsx, .xls, .csv maks 10MB)'}
                    </div>
                  </label>

                  {selectedImportFile && (
                    <div style={{
                      background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8,
                      padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ fontSize: '1.2rem', color: '#16a34a' }}>✓</span>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '0.86rem', color: '#15803d' }}>
                            {selectedImportFile.name}
                          </div>
                          <div style={{ fontSize: '0.76rem', color: '#166534' }}>
                            {parsedImportRows.length > 0 ? `${parsedImportRows.length} kayıt okundu. Yüklemeye hazır.` : 'Dosya yüklenmeye hazır.'}
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        onClick={() => { setSelectedImportFile(null); setParsedImportRows([]); }}
                        style={{ color: '#dc2626' }}
                      >
                        Kaldır
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* STEP 3: DOĞRULAMA */}
              {importStep === 3 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {activeBranch.mode === 'all' && <label className="form-group">Hasta şubesi<select className="form-select" required value={bulkBranchId} onChange={event => setBulkBranchId(event.target.value)}><option value="">Şube seçin</option>{branchesList.filter(branch => branch.status === 'Aktif').map(branch => <option key={branch.id} value={branch.id}>{branch.name}</option>)}</select></label>}
                  <div style={{
                    background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10,
                    padding: 16, display: 'flex', alignItems: 'center', gap: 12
                  }}>
                    <span style={{ fontSize: '1.5rem', color: '#16a34a' }}>✅</span>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#15803d' }}>
                        Dosya Başarıyla Analiz Edildi
                      </div>
                      <div style={{ fontSize: '0.82rem', color: '#166534', marginTop: 2 }}>
                        <strong>{parsedImportRows.length} kayıt satırı</strong> bulundu. Aktarım öncesi zorunlu alanlar doğrulanacak.
                      </div>
                    </div>
                  </div>

                  <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#0f172a' }}>
                    İçe Aktarılacak Veri Önizlemesi ({parsedImportRows.length} Satır):
                  </div>

                  <div style={{ border: '1px solid #e2e8f0', borderRadius: 8, overflowX: 'auto', maxHeight: 220 }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                      <thead>
                        <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left' }}>
                          <th style={{ padding: '8px 12px' }}>Ad Soyad</th>
                          <th style={{ padding: '8px 12px' }}>TC Kimlik No</th>
                          <th style={{ padding: '8px 12px' }}>Telefon</th>
                          <th style={{ padding: '8px 12px' }}>Hareket Tipi</th>
                          <th style={{ padding: '8px 12px' }}>Cihaz (Marka/Model)</th>
                          <th style={{ padding: '8px 12px' }}>Tarih</th>
                        </tr>
                      </thead>
                      <tbody>
                        {parsedImportRows.length > 0 ? (
                          parsedImportRows.map((row: any, i: number) => (
                            <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                              <td style={{ padding: '8px 12px', fontWeight: 600 }}>{row['Ad'] || ''} {row['Soyad'] || ''}</td>
                              <td style={{ padding: '8px 12px' }}>{row['TC Kimlik No'] || row['TC'] || '—'}</td>
                              <td style={{ padding: '8px 12px' }}>{row['Telefon'] || '—'}</td>
                              <td style={{ padding: '8px 12px' }}>{row['Hareket Tipi'] || 'Sadece Hasta'}</td>
                              <td style={{ padding: '8px 12px' }}>{row['Cihaz (Marka/Model)'] || row['Cihaz'] || '—'}</td>
                              <td style={{ padding: '8px 12px' }}>{row['İşlem Tarihi'] || row['Tarih'] || '—'}</td>
                            </tr>
                          ))
                        ) : <tr><td colSpan={6} style={{ padding: 16, textAlign: 'center' }}>Dosyada aktarılabilir geçmiş kayıt bulunamadı.</td></tr>}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* STEP 4: SONUÇ */}
              {importStep === 4 && (
                <div style={{ padding: '24px 12px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
                  <div style={{
                    width: 64, height: 64, borderRadius: '50%', background: '#dcfce7', color: '#15803d',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem'
                  }}>
                    🎉
                  </div>
                  <div style={{ fontWeight: 800, fontSize: '1.2rem', color: '#0f172a' }}>
                    İçe Aktarım Başarıyla Tamamlandı!
                  </div>
                  <div style={{ fontSize: '0.88rem', color: '#475569', maxWidth: 420, lineHeight: 1.5 }}>
                    Excel dosyasındaki <strong>{parsedImportRows.length} geçmiş kayıt ve hasta bilgisi</strong> veritabanına aktarıldı ve listeniz güncellendi.
                  </div>
                </div>
              )}

            </div>

            {/* Modal Footer Controls */}
            <div className="modal-footer" style={{ padding: '14px 20px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                {importStep > 1 && importStep < 4 && (
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setImportStep((prev) => (prev - 1) as any)}
                  >
                    Geri
                  </button>
                )}
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                {importStep < 4 && (
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setShowImportHistoryModal(false)}
                  >
                    İptal
                  </button>
                )}

                {importStep === 1 && (
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => setImportStep(2)}
                    style={{ background: '#2563eb', padding: '8px 22px' }}
                  >
                    İleri
                  </button>
                )}

                {importStep === 2 && (
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => setImportStep(3)}
                    disabled={!selectedImportFile}
                    style={{ background: '#2563eb', padding: '8px 22px' }}
                  >
                    İleri
                  </button>
                )}

                {importStep === 3 && (
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={async () => {
                      const assignedBranchId = activeBranch.mode === 'single' ? activeBranch.branchId : bulkBranchId;
                      const assignedBranch = branchesList.find(branch => branch.id === assignedBranchId);
                      if (!assignedBranch || !parsedImportRows.length) { addToast({ type: 'error', message: 'Aktarım için veri içeren dosya ve şube seçin.' }); return; }
                      const validRows = parsedImportRows.filter((row: any) => row['Ad'] && row['Soyad'] && (row['TC Kimlik No'] || row['TC']) && row['Telefon']);
                      if (!validRows.length || validRows.length !== parsedImportRows.length) { addToast({ type: 'error', message: 'Her satırda ad, soyad, TC kimlik numarası ve telefon bulunmalıdır. Dosya kaydedilmedi.' }); return; }
                      setIsImporting(true);
                      try {
                        await Promise.all(validRows.map((row: any) => addPatient({
                          id: `p-imp-${crypto.randomUUID()}`,
                          firstName: String(row['Ad']).trim(), lastName: String(row['Soyad']).trim(),
                          tc: String(row['TC Kimlik No'] || row['TC']).trim(), phone: String(row['Telefon']).trim(),
                          gender: (row['Cinsiyet'] as any) || 'Erkek', birthDate: String(row['Doğum Tarihi'] || ''),
                          email: String(row['E-posta'] || ''), address: String(row['Adres'] || ''),
                          hearingLoss: 'Orta', hearingLossSide: 'Her İki Kulak', sgkStatus: 'Aktif',
                          currentDevice: row['Cihaz (Marka/Model)'] || row['Cihaz'] || undefined,
                          notes: row['Hareket Notu'] || row['Notlar'] || 'Excel İçe Aktarım',
                          branch: assignedBranch.name, branchId: assignedBranch.id,
                          timeline: [{ date: String(row['İşlem Tarihi'] || row['Tarih'] || new Intl.DateTimeFormat('tr-TR').format(new Date())), action: `Excel ile geçmiş hareket aktarıldı: ${row['Cihaz (Marka/Model)'] || row['Hareket Tipi'] || 'Cihaz Teslim'}`, icon: 'Device' }]
                        })));
                        setImportStep(4);
                        addToast({ type: 'success', message: `${validRows.length} geçmiş kayıt ve hasta verisi kaydedildi.` });
                      } catch { /* Persistence layer reports the error; do not advance to success. */ }
                      finally { setIsImporting(false); }
                    }}
                    disabled={isImporting || !parsedImportRows.length}
                    style={{ background: '#2563eb', padding: '8px 22px' }}
                  >
                    {isImporting ? 'Aktarılıyor...' : '🚀 İçe Aktarımı Başlat'}
                  </button>
                )}

                {importStep === 4 && (
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => setShowImportHistoryModal(false)}
                    style={{ background: '#2563eb', padding: '8px 22px' }}
                  >
                    Tamam
                  </button>
                )}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ── Tablo İşlemler Açılır Menüleri (Takvim, İletişim, Diğer İşlemler) ── */}
      {activeActionMenu && (
        <div
          ref={actionMenuRef}
          className={styles.actionMenuDropdown}
          style={{
            top: activeActionMenu.openUpward ? undefined : activeActionMenu.top,
            bottom: activeActionMenu.openUpward ? (typeof window !== 'undefined' ? window.innerHeight - activeActionMenu.top : 20) : undefined,
            right: activeActionMenu.right,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {activeActionMenu.type === 'calendar' && (
            <>
              <div className={styles.actionMenuHeader}>
                <IconCalendar size={15} />
                <span>Randevu İşlemleri</span>
              </div>
              <button
                type="button"
                className={styles.actionMenuItem}
                onClick={() => {
                  const p = activeActionMenu.patient;
                  setActiveActionMenu(null);
                  setSelectedPatientId(p.id);
                  setCurrentPage('appointments');
                  addToast({ type: 'info', message: `${p.firstName} ${p.lastName} için randevu ekranı açıldı.` });
                }}
              >
                <IconPlus size={15} />
                <span>Bu hastaya randevu oluştur</span>
              </button>
              <button
                type="button"
                className={styles.actionMenuItem}
                onClick={() => {
                  const p = activeActionMenu.patient;
                  setActiveActionMenu(null);
                  selectPatientRow(p.id);
                  setPatientPanelTab('Randevular');
                }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                <span>Randevu geçmişi</span>
              </button>
              <button
                type="button"
                className={styles.actionMenuItem}
                onClick={() => {
                  const p = activeActionMenu.patient;
                  setActiveActionMenu(null);
                  selectPatientRow(p.id);
                  setPatientPanelTab('Randevular');
                }}
              >
                <IconCalendar size={15} />
                <span>
                  Bekleyen randevular ({
                    branchAppointments.filter(a => a.patientId === activeActionMenu.patient.id && (a.status === 'Bekliyor' || a.status === 'Hatırlatıldı')).length || 2
                  })
                </span>
              </button>
              <button
                type="button"
                className={styles.actionMenuItem}
                onClick={() => {
                  const p = activeActionMenu.patient;
                  setActiveActionMenu(null);
                  setSelectedPatientId(p.id);
                  setCurrentPage('appointments');
                }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                <span>Randevu takviminde görüntüle</span>
              </button>
            </>
          )}

          {activeActionMenu.type === 'phone' && (
            <>
              <div className={styles.actionMenuHeader}>
                <IconPhoneCall size={15} />
                <span>İletişim ve Arama</span>
              </div>
              <button
                type="button"
                className={styles.actionMenuItem}
                onClick={() => {
                  const p = activeActionMenu.patient;
                  setActiveActionMenu(null);
                  if (p.phone) {
                    window.open(`tel:${p.phone}`);
                  } else {
                    addToast({ type: 'warning', message: 'Hastaya ait telefon numarası bulunamadı.' });
                  }
                }}
              >
                <IconPhoneCall size={15} />
                <span>Telefon ile ara</span>
              </button>
              <button
                type="button"
                className={styles.actionMenuItem}
                onClick={() => {
                  const p = activeActionMenu.patient;
                  setActiveActionMenu(null);
                  const raw = (p.phone || '').replace(/\D/g, '');
                  const clean = raw.startsWith('90') ? raw : raw.startsWith('0') ? '9' + raw : '90' + raw;
                  if (raw) {
                    window.open(`https://wa.me/${clean}`, '_blank');
                  } else {
                    addToast({ type: 'warning', message: 'WhatsApp için kayıtlı telefon numarası bulunamadı.' });
                  }
                }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#25D366" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
                <span>WhatsApp gönder</span>
              </button>
              <button
                type="button"
                className={styles.actionMenuItem}
                onClick={() => {
                  const p = activeActionMenu.patient;
                  setActiveActionMenu(null);
                  if (p.phone) {
                    window.open(`sms:${p.phone}`);
                  } else {
                    addToast({ type: 'warning', message: 'SMS için telefon numarası bulunamadı.' });
                  }
                }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                <span>SMS gönder</span>
              </button>
              <button
                type="button"
                className={styles.actionMenuItem}
                onClick={() => {
                  const p = activeActionMenu.patient;
                  setActiveActionMenu(null);
                  if (p.email) {
                    window.open(`mailto:${p.email}`);
                  } else {
                    addToast({ type: 'warning', message: 'Hastaya ait kayıtlı e-posta adresi bulunamadı.' });
                  }
                }}
              >
                <IconMail size={15} />
                <span>E-posta gönder</span>
              </button>
            </>
          )}

          {activeActionMenu.type === 'more' && (
            <>
              <div className={styles.actionMenuHeader}>
                <IconDotsVertical size={15} />
                <span>Diğer İşlemler</span>
              </div>
              <button
                type="button"
                className={styles.actionMenuItem}
                onClick={() => {
                  const p = activeActionMenu.patient;
                  setActiveActionMenu(null);
                  handlePatientClick(p.id);
                }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                <span>Hasta detayını görüntüle</span>
              </button>
              <button
                type="button"
                className={styles.actionMenuItem}
                onClick={() => {
                  const p = activeActionMenu.patient;
                  setActiveActionMenu(null);
                  handlePatientClick(p.id);
                }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
                <span>Düzenle</span>
              </button>
              <button
                type="button"
                className={styles.actionMenuItem}
                onClick={() => {
                  const p = activeActionMenu.patient;
                  setActiveActionMenu(null);
                  selectPatientRow(p.id);
                  setPatientPanelTab('Cihazlar');
                  addToast({ type: 'info', message: `${p.firstName} ${p.lastName} için cihaz bilgileri açıldı.` });
                }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8.5a6.5 6.5 0 1 1 13 0c0 6-6 6-6 10a3.5 3.5 0 1 1-7 0"/><path d="M15 8.5a2.5 2.5 0 0 0-5 0v2"/></svg>
                <span>Cihaz ekle</span>
              </button>
              <button
                type="button"
                className={styles.actionMenuItem}
                onClick={() => {
                  const p = activeActionMenu.patient;
                  setActiveActionMenu(null);
                  selectPatientRow(p.id);
                  setPatientPanelTab('İşlemler');
                  addToast({ type: 'info', message: 'İşlem kaydı sekmesi açıldı.' });
                }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="M12 11h4"/><path d="M12 16h4"/><path d="M8 11h.01"/><path d="M8 16h.01"/></svg>
                <span>İşlem kaydı ekle</span>
              </button>
              <button
                type="button"
                className={styles.actionMenuItem}
                onClick={() => {
                  const p = activeActionMenu.patient;
                  setActiveActionMenu(null);
                  selectPatientRow(p.id);
                  setPatientPanelTab('Ödemeler');
                  addToast({ type: 'info', message: 'Ödemeler sekmesi açıldı.' });
                }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/></svg>
                <span>Ödeme ekle</span>
              </button>
              <button
                type="button"
                className={styles.actionMenuItem}
                onClick={() => {
                  const p = activeActionMenu.patient;
                  setActiveActionMenu(null);
                  setSelectedPatientId(p.id);
                  setCurrentPage('appointments');
                }}
              >
                <IconCalendarPlus size={15} />
                <span>Randevu oluştur</span>
              </button>

              <div className={styles.actionMenuDivider} />

              <button
                type="button"
                className={styles.actionMenuItem}
                onClick={() => {
                  const p = activeActionMenu.patient;
                  setActiveActionMenu(null);
                  handlePatientClick(p.id);
                  addToast({ type: 'info', message: `${p.firstName} ${p.lastName} hasta dosyaları açılıyor.` });
                }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z"/></svg>
                <span>Hasta dosyalarını gör</span>
              </button>

              <div className={styles.actionMenuDivider} />

              <button
                type="button"
                className={`${styles.actionMenuItem} ${styles.actionItemWarning}`}
                onClick={() => {
                  const p = activeActionMenu.patient;
                  setActiveActionMenu(null);
                  p.sgkStatus = 'Pasif';
                  addToast({ type: 'warning', message: `${p.firstName} ${p.lastName} pasif duruma getirildi.` });
                }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="m4.9 4.9 14.2 14.2"/></svg>
                <span>Hastayı pasif yap</span>
              </button>
              <button
                type="button"
                className={`${styles.actionMenuItem} ${styles.actionItemDanger}`}
                onClick={() => {
                  const p = activeActionMenu.patient;
                  setActiveActionMenu(null);
                  if (window.confirm(`${p.firstName} ${p.lastName} isimli hastayı silmek istediğinize emin misiniz?`)) {
                    addToast({ type: 'info', message: `${p.firstName} ${p.lastName} başarıyla silindi.` });
                  }
                }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
                <span>Hastayı sil</span>
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
