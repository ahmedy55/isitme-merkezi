'use client';

import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { useBranchScope } from '../hooks/useBranchScope';
import styles from './AuditLogPage.module.css';

interface AuditItem {
  id: string;
  date: string;
  userName: string;
  userRole: string;
  userInitials: string;
  userAvatarBg: string;
  userAvatarColor: string;
  action: string;
  actionTypeKey: string;
  module: string;
  description: string;
  status: 'Başarılı' | 'Hatalı' | '—';
  ipAddress: string;
  device: string;
  detailsJson: Record<string, any>;
  timestampISO?: string;
}

const DETAIL_LABELS: Record<string, string> = {
  amount: 'Tutar', total: 'Toplam', total_amount: 'Toplam tutar', payment_method: 'Ödeme yöntemi',
  method: 'Yöntem', branch: 'Şube', branch_name: 'Şube', created_at: 'İşlem tarihi', date: 'Tarih',
  status: 'Durum', result: 'Sonuç', patient_name: 'Hasta', device_name: 'Cihaz', serial_no: 'Seri numarası',
  barcode: 'Barkod', description: 'Açıklama', reason: 'Neden', note: 'Not', quantity: 'Adet',
  discount: 'İndirim', tax: 'Vergi', old_value: 'Önceki değer', new_value: 'Yeni değer',
  entity: 'Kayıt türü', entity_name: 'Kayıt adı',
};

const formatDetailLabel = (key: string) => DETAIL_LABELS[key] || key
  .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
  .replace(/[_-]+/g, ' ')
  .replace(/\b\w/g, letter => letter.toLocaleUpperCase('tr-TR'));

const formatDetailValue = (key: string, value: unknown) => {
  if (value === null || value === undefined || value === '') return '—';
  if (typeof value === 'boolean') return value ? 'Evet' : 'Hayır';
  if (typeof value === 'number' && /(amount|total|price|cost|discount|tax|tutar|fiyat|ücret)/i.test(key)) {
    return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 2 }).format(value);
  }
  if (typeof value === 'string' && /(created_at|updated_at|date|tarih)/i.test(key)) {
    const date = new Date(value);
    if (!Number.isNaN(date.getTime())) return new Intl.DateTimeFormat('tr-TR', { dateStyle: 'medium', timeStyle: 'short' }).format(date);
  }
  if (Array.isArray(value)) return value.map(item => typeof item === 'object' && item ? Object.values(item).join(' · ') : String(item)).join(', ');
  if (typeof value === 'object') return Object.entries(value as Record<string, unknown>).map(([name, item]) => `${formatDetailLabel(name)}: ${String(item)}`).join(' · ');
  return String(value);
};

const INITIAL_AUDIT_LOGS: AuditItem[] = [
  {
    id: 'audit-1',
    date: '29.09.2026 13:47:22',
    userName: 'Ahmet Yılmaz',
    userRole: 'Firma Yöneticisi',
    userInitials: 'AY',
    userAvatarBg: '#D1E7DD',
    userAvatarColor: '#0F5132',
    action: 'Satış Ekleme',
    actionTypeKey: 'sale_add',
    module: 'Kasa',
    description: 'Satış: 559fecee-c123-4220-88bb-00edc98873fc',
    status: 'Başarılı',
    ipAddress: '192.168.1.45',
    device: 'Chrome / Windows',
    detailsJson: {
      sale_id: '559fecee-c123-4220-88bb-00edc98873fc',
      patient_id: '123a4567-e89b-12d3',
      amount: 12500,
      payment_method: 'nakit',
      branch_id: 'merkez',
      created_at: '2026-09-29T13:47:22Z'
    }
  },
  {
    id: 'audit-2',
    date: '29.09.2026 12:11:08',
    userName: 'Zeynep Kaya',
    userRole: 'Sekreter',
    userInitials: 'ZK',
    userAvatarBg: '#E0E7FF',
    userAvatarColor: '#3730A3',
    action: 'Randevu Güncelleme',
    actionTypeKey: 'appointment_update',
    module: 'Randevu',
    description: 'Randevu #1245 tarihi değiştirildi',
    status: 'Başarılı',
    ipAddress: '192.168.1.52',
    device: 'Firefox / Windows',
    detailsJson: {
      appointment_id: '1245',
      old_date: '2026-09-29T10:00:00Z',
      new_date: '2026-09-30T14:30:00Z',
      patient_name: 'Mustafa Öztürk',
      branch_id: 'cankaya'
    }
  },
  {
    id: 'audit-3',
    date: '28.09.2026 17:06:33',
    userName: 'Mehmet Kaya',
    userRole: 'Odyometrist',
    userInitials: 'MK',
    userAvatarBg: '#E5E7EB',
    userAvatarColor: '#374151',
    action: 'Hasta Güncelleme',
    actionTypeKey: 'patient_update',
    module: 'Hastalar',
    description: 'Hasta bilgileri güncellendi (TC: 123******90)',
    status: 'Başarılı',
    ipAddress: '192.168.1.61',
    device: 'Chrome / Windows',
    detailsJson: {
      patient_id: 'pat-883',
      tc_no: '123******90',
      fields_updated: ['phone', 'address'],
      updated_at: '2026-09-28T17:06:33Z'
    }
  },
  {
    id: 'audit-4',
    date: '28.09.2026 15:22:14',
    userName: 'Elif Demir',
    userRole: 'Muhasebe',
    userInitials: 'ED',
    userAvatarBg: '#E7E5E4',
    userAvatarColor: '#44403C',
    action: 'Ödeme Ekleme',
    actionTypeKey: 'payment_add',
    module: 'Kasa',
    description: 'Tahsilat #785 - ₺2.500 (Nakit)',
    status: 'Başarılı',
    ipAddress: '192.168.1.33',
    device: 'Safari / macOS',
    detailsJson: {
      receipt_no: '#785',
      amount: 2500,
      currency: 'TRY',
      type: 'nakit',
      patient: 'Hülya Aslan',
      created_at: '2026-09-28T15:22:14Z'
    }
  },
  {
    id: 'audit-5',
    date: '27.09.2026 11:45:09',
    userName: 'Ahmet Yılmaz',
    userRole: 'Firma Yöneticisi',
    userInitials: 'AY',
    userAvatarBg: '#D1E7DD',
    userAvatarColor: '#0F5132',
    action: 'Cihaz Ekleme',
    actionTypeKey: 'device_add',
    module: 'Stok',
    description: 'Cihaz: Oticon More 1 (SN: 9876543210)',
    status: 'Başarılı',
    ipAddress: '192.168.1.45',
    device: 'Chrome / Windows',
    detailsJson: {
      brand: 'Oticon',
      model: 'More 1',
      serial_no: '9876543210',
      stock_id: 'stk-092',
      branch: 'Merkez'
    }
  },
  {
    id: 'audit-6',
    date: '26.09.2026 16:18:27',
    userName: 'Zeynep Güneş',
    userRole: 'Teknik Servis',
    userInitials: 'ZG',
    userAvatarBg: '#CCFBF1',
    userAvatarColor: '#115E59',
    action: 'Servis Kaydı Ekleme',
    actionTypeKey: 'service_add',
    module: 'Teknik Servis',
    description: 'Servis #2026-015 oluşturuldu',
    status: 'Başarılı',
    ipAddress: '192.168.1.78',
    device: 'Chrome / Windows',
    detailsJson: {
      service_no: '2026-015',
      device: 'Phonak Audeo Paradise P90',
      issue: 'Mikrofon arızası ve filtre değişimi',
      technician: 'Zeynep Güneş'
    }
  },
  {
    id: 'audit-7',
    date: '26.09.2026 14:03:11',
    userName: 'Mehmet Kaya',
    userRole: 'Odyometrist',
    userInitials: 'MK',
    userAvatarBg: '#E5E7EB',
    userAvatarColor: '#374151',
    action: 'Muayene Kaydı Ekleme',
    actionTypeKey: 'exam_add',
    module: 'Hastalar',
    description: 'Muayene kaydı eklendi - Test Hasta Üç',
    status: 'Başarılı',
    ipAddress: '192.168.1.61',
    device: 'Chrome / Windows',
    detailsJson: {
      patient_name: 'Test Hasta Üç',
      audiometry_score_r: '45 dB',
      audiometry_score_l: '40 dB',
      recommendation: 'Bilateral RIC işitme cihazı'
    }
  },
  {
    id: 'audit-8',
    date: '25.09.2026 10:25:46',
    userName: 'Ahmet Yılmaz',
    userRole: 'Firma Yöneticisi',
    userInitials: 'AY',
    userAvatarBg: '#D1E7DD',
    userAvatarColor: '#0F5132',
    action: 'Personel Ekleme',
    actionTypeKey: 'staff_add',
    module: 'Şube & Yetki',
    description: 'Yeni personel eklendi: Selin Ak (Teknik Servis)',
    status: 'Başarılı',
    ipAddress: '192.168.1.45',
    device: 'Chrome / Windows',
    detailsJson: {
      personnel_name: 'Selin Ak',
      role: 'Teknik Servis',
      branch: 'Kadıköy',
      added_by: 'Ahmet Yılmaz'
    }
  },
  {
    id: 'audit-9',
    date: '24.09.2026 18:12:03',
    userName: 'Cem Doğan',
    userRole: 'Sekreter',
    userInitials: 'CD',
    userAvatarBg: '#DBEAFE',
    userAvatarColor: '#1E40AF',
    action: 'Fatura Silme',
    actionTypeKey: 'invoice_delete',
    module: 'Kasa',
    description: 'Fatura #F-2026-442 silindi',
    status: 'Hatalı',
    ipAddress: '192.168.1.88',
    device: 'Chrome / Windows',
    detailsJson: {
      invoice_no: 'F-2026-442',
      error_code: 'ERR_AUTH_DENIED',
      error_message: 'Sekreter rolü ile kesilmiş fatura silinemez. Firma Yöneticisi onayı gerekir.',
      attempted_at: '2026-09-24T18:12:03Z'
    }
  },
  {
    id: 'audit-10',
    date: '24.09.2026 16:45:10',
    userName: 'Zeynep Kaya',
    userRole: 'Sekreter',
    userInitials: 'ZK',
    userAvatarBg: '#E0E7FF',
    userAvatarColor: '#3730A3',
    action: 'Hasta Ekleme',
    actionTypeKey: 'patient_add',
    module: 'Hastalar',
    description: 'Yeni hasta eklendi: Ali Demir',
    status: 'Başarılı',
    ipAddress: '192.168.1.52',
    device: 'Firefox / Windows',
    detailsJson: {
      patient_name: 'Ali Demir',
      phone: '0532 555 12 34',
      branch: 'Çankaya',
      registration_date: '2026-09-24T16:45:10Z'
    }
  }
];

export default function AuditLogPage() {
  const { addToast, auditLogList, usersList } = useApp();
  const { activeBranch } = useBranchScope();

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [moduleFilter, setModuleFilter] = useState('All');
  const [actionFilter, setActionFilter] = useState('All');
  const [userFilter, setUserFilter] = useState('All');
  const [resultFilter, setResultFilter] = useState('All');
  const [dateRange, setDateRange] = useState(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const format = (date: Date) => date.toLocaleDateString('tr-TR');
    return `${format(start)} - ${format(end)}`;
  });

  // Selection & Detail Panel State
  const [selectedRowId, setSelectedRowId] = useState<string>('');
  const [checkedIds, setCheckedIds] = useState<string[]>([]);
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  const [isJsonExpanded, setIsJsonExpanded] = useState<boolean>(false);

  // Pagination
  const [currentPageNum, setCurrentPageNum] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  // Modals
  const [showExportModal, setShowExportModal] = useState<boolean>(false);
  const [showDateModal, setShowDateModal] = useState<boolean>(false);
  const [exportFormat, setExportFormat] = useState<'csv' | 'excel' | 'pdf'>('excel');

  // Filtered List
  const filteredLogs = useMemo(() => {
    const liveLogs: AuditItem[] = auditLogList.map(item => {
      const user = usersList.find(candidate => candidate.userId === item.userId || candidate.id === item.userId);
      let detailsJson: Record<string, any> = {};
      if (item.details) {
        try { detailsJson = JSON.parse(item.details); }
        catch { detailsJson = { details: item.details }; }
      }
      return {
        id: item.id,
        date: item.timestamp ? new Date(item.timestamp).toLocaleString('tr-TR') : '—',
        timestampISO: item.timestamp,
        userName: item.userName,
        userRole: user?.roles?.join(', ') || '—',
        userInitials: item.userName.split(/\s+/).map(part => part[0]).join('').slice(0, 2).toLocaleUpperCase('tr-TR'),
        userAvatarBg: '#e6f4ef', userAvatarColor: '#08785b',
        action: `${item.module} ${item.action}`,
        actionTypeKey: item.action.toLocaleLowerCase('tr-TR'),
        module: item.module,
        description: item.description,
        status: '—',
        ipAddress: '—', device: '—', detailsJson,
      };
    });
    return liveLogs.filter(item => {
      const q = searchTerm.toLowerCase().trim();
      const matchesSearch = !q ||
        item.description.toLowerCase().includes(q) ||
        item.userName.toLowerCase().includes(q) ||
        item.action.toLowerCase().includes(q) ||
        item.module.toLowerCase().includes(q) ||
        JSON.stringify(item.detailsJson).toLowerCase().includes(q);

      const matchesModule = moduleFilter === 'All' || item.module === moduleFilter;
      const matchesAction = actionFilter === 'All' || item.action === actionFilter;
      const matchesUser = userFilter === 'All' || item.userName === userFilter;
      const matchesResult = resultFilter === 'All' || item.status === resultFilter;
      const [startText, endText] = dateRange.split(' - ');
      const asISO = (text: string) => {
        const [day, month, year] = text.split('.');
        return day && month && year ? `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}` : '';
      };
      const fromISO = asISO(startText || '');
      const toISO = asISO(endText || '');
      const recordDate = item.timestampISO?.slice(0, 10) || '';
      const matchesDate = (!fromISO || recordDate >= fromISO) && (!toISO || recordDate <= toISO);

      return matchesSearch && matchesModule && matchesAction && matchesUser && matchesResult && matchesDate;
    });
  }, [auditLogList, usersList, searchTerm, moduleFilter, actionFilter, userFilter, resultFilter, dateRange]);

  // Selected Log Object for Drawer
  const activeLog = useMemo(() => {
    return auditLogList.find(l => l.id === selectedRowId) ? filteredLogs.find(l => l.id === selectedRowId) : undefined;
  }, [auditLogList, filteredLogs, selectedRowId]);

  const todayLogs = auditLogList.filter(item => item.timestamp?.slice(0, 10) === new Date().toISOString().slice(0, 10));
  const todayAuditCount = new Set(todayLogs.map(item => item.userId).filter(Boolean)).size;
  const moduleCount = new Set(filteredLogs.map(item => item.module).filter(Boolean)).size;

  // Selection Handlers
  const handleToggleCheck = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setCheckedIds(prev => {
      if (prev.includes(id)) {
        return prev.filter(x => x !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  const handleSelectAll = () => {
    if (checkedIds.length === filteredLogs.length && filteredLogs.length > 0) {
      setCheckedIds([]);
    } else {
      setCheckedIds(filteredLogs.map(l => l.id));
    }
  };

  const handleRowClick = (item: AuditItem) => {
    setSelectedRowId(item.id);
    setIsDrawerOpen(true);
    if (!checkedIds.includes(item.id)) {
      setCheckedIds([item.id]);
    }
  };

  const handleCopyJson = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (activeLog) {
      navigator.clipboard.writeText(JSON.stringify(activeLog.detailsJson, null, 2));
      addToast({ type: 'success', message: 'Detay JSON verisi panoya kopyalandı!' });
    }
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setModuleFilter('All');
    setActionFilter('All');
    setUserFilter('All');
    setResultFilter('All');
    addToast({ type: 'info', message: 'Filtreler temizlendi' });
  };

  const handleExportConfirm = () => {
    setShowExportModal(false);
    addToast({ type: 'success', message: `İşlem kayıtları ${exportFormat.toUpperCase()} formatında dışa aktarıldı.` });
  };

  // Helper for Module badge style
  const getModuleBadgeClass = (mod: string) => {
    switch (mod) {
      case 'Kasa': return styles.modKasa;
      case 'Randevu': return styles.modRandevu;
      case 'Hastalar': return styles.modHastalar;
      case 'Stok': return styles.modStok;
      case 'Teknik Servis': return styles.modServis;
      case 'Şube & Yetki': return styles.modSube;
      default: return styles.modDefault;
    }
  };

  // Helper for Action Icon
  const renderActionIcon = (action: string) => {
    if (action.includes('Satış')) {
      return (
        <span style={{ color: '#2563EB', display: 'inline-flex' }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <path d="M16 10a4 4 0 0 1-8 0"></path>
          </svg>
        </span>
      );
    }
    if (action.includes('Randevu')) {
      return (
        <span style={{ color: '#EA580C', display: 'inline-flex' }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="16" y1="2" x2="16" y2="6"></line>
            <line x1="8" y1="2" x2="8" y2="6"></line>
            <line x1="3" y1="10" x2="21" y2="10"></line>
          </svg>
        </span>
      );
    }
    if (action.includes('Ödeme')) {
      return (
        <span style={{ color: '#08785B', display: 'inline-flex' }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
            <line x1="1" y1="10" x2="23" y2="10"></line>
          </svg>
        </span>
      );
    }
    if (action.includes('Cihaz')) {
      return (
        <span style={{ color: '#EA580C', display: 'inline-flex' }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
            <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
            <line x1="12" y1="22.08" x2="12" y2="12"></line>
          </svg>
        </span>
      );
    }
    if (action.includes('Servis')) {
      return (
        <span style={{ color: '#2563EB', display: 'inline-flex' }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
            <line x1="8" y1="21" x2="16" y2="21"></line>
            <line x1="12" y1="17" x2="12" y2="21"></line>
          </svg>
        </span>
      );
    }
    if (action.includes('Muayene')) {
      return (
        <span style={{ color: '#2563EB', display: 'inline-flex' }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
            <line x1="16" y1="13" x2="8" y2="13"></line>
            <line x1="16" y1="17" x2="8" y2="17"></line>
            <polyline points="10 9 9 9 8 9"></polyline>
          </svg>
        </span>
      );
    }
    if (action.includes('Silme')) {
      return (
        <span style={{ color: '#DC2626', display: 'inline-flex' }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6"></polyline>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
          </svg>
        </span>
      );
    }
    if (action.includes('Personel')) {
      return (
        <span style={{ color: '#EA580C', display: 'inline-flex' }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
            <circle cx="8.5" cy="7" r="4"></circle>
            <line x1="20" y1="8" x2="20" y2="14"></line>
            <line x1="23" y1="11" x2="17" y2="11"></line>
          </svg>
        </span>
      );
    }
    return (
      <span style={{ color: '#2563EB', display: 'inline-flex' }}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
          <circle cx="12" cy="7" r="4"></circle>
        </svg>
      </span>
    );
  };

  return (
    <div className={styles.auditPage}>
      {/* ── Breadcrumb & Page Heading ── */}
      <div className={styles.breadcrumb}>
        <span>İşlem Kayıtları</span>
        <span className={styles.breadcrumbArrow}>›</span>
        <span>Audit Log</span>
      </div>

      <div className={styles.pageHeader}>
        <div className={styles.pageHeaderLeft}>
          <div className={styles.headerIconBadge}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
              <polyline points="10 9 9 9 8 9"></polyline>
            </svg>
          </div>
          <div>
            <h1 className={styles.pageTitle}>İşlem Kayıtları (Audit Log)</h1>
            <p className={styles.pageSubtitle}>
              Sistemde yapılan tüm ekleme, düzenleme, silme ve giriş/çıkış hareketlerini takip edin.
            </p>
          </div>
        </div>

        <div className={styles.pageHeaderRight}>
          <button 
            type="button" 
            className={styles.btnExport} 
            onClick={() => setShowExportModal(true)}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7 10 12 15 17 10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
            Dışa Aktar
          </button>

          <button 
            type="button" 
            className={styles.btnDateRange} 
            onClick={() => setShowDateModal(true)}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
              <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
            {dateRange}
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </button>
        </div>
      </div>

      {/* ── 5 Stat Cards in One Row ── */}
      <div className={styles.statsGrid}>
        {/* Card 1 */}
        <div className={styles.statCard}>
          <div className={`${styles.statIconWrap} ${styles.statIconGreen}`}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
              <polyline points="10 9 9 9 8 9"></polyline>
            </svg>
          </div>
          <div className={styles.statBody}>
            <span className={styles.statLabel}>Toplam İşlem</span>
            <span className={styles.statValue}>{filteredLogs.length}</span>
            <div className={styles.statTrend}><span className={styles.trendSub}>Seçilen filtrelerde</span></div>
          </div>
        </div>

        {/* Card 2 */}
        <div className={styles.statCard}>
          <div className={`${styles.statIconWrap} ${styles.statIconBlue}`}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
              <circle cx="9" cy="7" r="4"></circle>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
            </svg>
          </div>
          <div className={styles.statBody}>
            <span className={styles.statLabel}>Aktif Kullanıcı</span>
            <span className={styles.statValue}>{todayAuditCount}</span>
            <div className={styles.statTrend}><span className={styles.trendSub}>Bugün işlem yapan farklı kullanıcı</span></div>
          </div>
        </div>

        {/* Card 3 */}
        <div className={styles.statCard}>
          <div className={`${styles.statIconWrap} ${styles.statIconBlue}`}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <ellipse cx="12" cy="5" rx="9" ry="3"></ellipse>
              <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"></path>
              <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path>
            </svg>
          </div>
          <div className={styles.statBody}>
            <span className={styles.statLabel}>Etkilenen Modül</span>
            <span className={styles.statValue}>{moduleCount}</span>
            <div className={styles.statTrend}><span className={styles.trendSub}>Seçilen kayıtlardaki modül</span></div>
          </div>
        </div>

        {/* Card 4 */}
        <div className={styles.statCard}>
          <div className={`${styles.statIconWrap} ${styles.statIconGreen}`}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
              <polyline points="9 12 11 14 15 10"></polyline>
            </svg>
          </div>
          <div className={styles.statBody}>
            <span className={styles.statLabel}>Başarılı İşlem</span>
            <span className={styles.statValue}>—</span>
            <div className={styles.statTrend}><span className={styles.trendSub}>Başarı durumu veritabanında tutulmuyor</span></div>
          </div>
        </div>

        {/* Card 5 */}
        <div className={styles.statCard}>
          <div className={`${styles.statIconWrap} ${styles.statIconRed}`}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
              <line x1="12" y1="9" x2="12" y2="13"></line>
              <line x1="12" y1="17" x2="12.01" y2="17"></line>
            </svg>
          </div>
          <div className={styles.statBody}>
            <span className={styles.statLabel}>Hatalı İşlem</span>
            <span className={styles.statValue}>—</span>
            <div className={styles.statTrend}><span className={styles.trendSub}>Hata durumu veritabanında tutulmuyor</span></div>
          </div>
        </div>
      </div>

      {/* ── Filter Bar Card ── */}
      <div className={styles.filterCard}>
        <div className={styles.filterRow}>
          <div className={styles.searchInputWrap}>
            <span className={styles.searchIcon}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
            </span>
            <input 
              type="text" 
              className={styles.searchInput}
              placeholder="Kullanıcı, açıklama, hasta adı, modül veya detay ara..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <select 
            className={styles.filterSelect}
            value={moduleFilter}
            onChange={(e) => setModuleFilter(e.target.value)}
          >
            <option value="All">Tüm Modüller</option>
            {[...new Set(auditLogList.map(item => item.module).filter(Boolean))].map(module => <option key={module} value={module}>{module}</option>)}
          </select>

          <select 
            className={styles.filterSelect}
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
          >
            <option value="All">Tüm İşlem Türleri</option>
            {[...new Set(auditLogList.map(item => `${item.module} ${item.action}`.trim()).filter(Boolean))].map(action => <option key={action} value={action}>{action}</option>)}
          </select>

          <select 
            className={styles.filterSelect}
            value={userFilter}
            onChange={(e) => setUserFilter(e.target.value)}
          >
            <option value="All">Tüm Kullanıcılar</option>
            {[...new Set(auditLogList.map(item => item.userName))].map(name => <option key={name} value={name}>{name}</option>)}
          </select>

          <select 
            className={styles.filterSelect}
            value={resultFilter}
            onChange={(e) => setResultFilter(e.target.value)}
          >
            <option value="All">Tüm Sonuçlar</option>
          </select>

          <button 
            type="button" 
            className={styles.btnFilter}
            onClick={() => addToast({ type: 'info', message: 'Filtreler uygulandı' })}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
            </svg>
            Filtrele
          </button>

          <button 
            type="button" 
            className={styles.btnClear}
            onClick={handleResetFilters}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="1 4 1 10 7 10"></polyline>
              <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path>
            </svg>
            Temizle
          </button>
        </div>
      </div>

      {/* ── Main Content Area: Table + Right Drawer ── */}
      <div className={styles.contentLayout}>
        {/* Left Side: Table */}
        <div className={styles.tableSection}>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th style={{ width: 40, textAlign: 'center' }}>
                    <div 
                      className={`${styles.customCheckbox} ${checkedIds.length === filteredLogs.length && filteredLogs.length > 0 ? styles.checkboxChecked : ''}`}
                      onClick={handleSelectAll}
                    >
                      {checkedIds.length === filteredLogs.length && filteredLogs.length > 0 && (
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                      )}
                    </div>
                  </th>
                  <th>TARİH / SAAT</th>
                  <th>KULLANICI</th>
                  <th>İŞLEM</th>
                  <th>MODÜL</th>
                  <th>AÇIKLAMA</th>
                  <th>SONUÇ</th>
                  <th style={{ textAlign: 'center' }}>DETAYLAR</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ padding: 40, textAlign: 'center', color: '#9ca3af' }}>
                      Kriterlere uygun işlem kaydı bulunamadı.
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map(item => {
                    const isSelected = selectedRowId === item.id;
                    const isChecked = checkedIds.includes(item.id);

                    return (
                      <tr 
                        key={item.id} 
                        className={isSelected ? styles.rowSelected : ''}
                        onClick={() => handleRowClick(item)}
                      >
                        <td style={{ textAlign: 'center' }}>
                          <div 
                            className={`${styles.customCheckbox} ${isChecked ? styles.checkboxChecked : ''}`}
                            onClick={(e) => handleToggleCheck(item.id, e)}
                          >
                            {isChecked && (
                              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="20 6 9 17 4 12"></polyline>
                              </svg>
                            )}
                          </div>
                        </td>
                        <td style={{ color: '#4b5563', whiteSpace: 'nowrap', fontSize: '11.5px' }}>
                          {item.date}
                        </td>
                        <td>
                          <div className={styles.userCell}>
                            <div 
                              className={styles.userAvatar} 
                              style={{ background: item.userAvatarBg, color: item.userAvatarColor }}
                            >
                              {item.userInitials}
                            </div>
                            <div className={styles.userInfo}>
                              <span className={styles.userName}>{item.userName}</span>
                              <span className={styles.userRole}>{item.userRole}</span>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div className={styles.actionCell}>
                            <span className={styles.actionIconWrap}>
                              {renderActionIcon(item.action)}
                            </span>
                            <span>{item.action}</span>
                          </div>
                        </td>
                        <td>
                          <span className={`${styles.modPill} ${getModuleBadgeClass(item.module)}`}>
                            {item.module}
                          </span>
                        </td>
                        <td style={{ color: '#374151', fontSize: '11.5px', maxWidth: 300 }}>
                          {item.description}
                        </td>
                        <td>
                          <span className={`${styles.statusPill} ${item.status === 'Başarılı' ? styles.statusSuccess : styles.statusError}`}>
                            {item.status}
                          </span>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <button 
                            type="button" 
                            className={styles.btnViewDetails}
                            title="İşlem Detayını Görüntüle"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedRowId(item.id);
                              setIsDrawerOpen(true);
                            }}
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                              <circle cx="12" cy="12" r="3"></circle>
                            </svg>
                          </button>
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
            <div className={styles.footerSelectionInfo}>
              <span>Toplam 156 kayıt</span>
              <span>|</span>
              <span className={styles.footerSelectedBadge}>{checkedIds.length} kayıt seçili</span>
            </div>

            <div className={styles.paginationControls}>
              <button 
                type="button" 
                className={styles.pageBtn} 
                disabled={currentPageNum === 1}
                onClick={() => setCurrentPageNum(1)}
              >
                «
              </button>
              <button 
                type="button" 
                className={styles.pageBtn} 
                disabled={currentPageNum === 1}
                onClick={() => setCurrentPageNum(prev => Math.max(1, prev - 1))}
              >
                ‹
              </button>
              <button 
                type="button" 
                className={`${styles.pageBtn} ${currentPageNum === 1 ? styles.pageBtnActive : ''}`}
                onClick={() => setCurrentPageNum(1)}
              >
                1
              </button>
              <button 
                type="button" 
                className={`${styles.pageBtn} ${currentPageNum === 2 ? styles.pageBtnActive : ''}`}
                onClick={() => setCurrentPageNum(2)}
              >
                2
              </button>
              <button 
                type="button" 
                className={`${styles.pageBtn} ${currentPageNum === 3 ? styles.pageBtnActive : ''}`}
                onClick={() => setCurrentPageNum(3)}
              >
                3
              </button>
              <button 
                type="button" 
                className={`${styles.pageBtn} ${currentPageNum === 4 ? styles.pageBtnActive : ''}`}
                onClick={() => setCurrentPageNum(4)}
              >
                4
              </button>
              <button 
                type="button" 
                className={`${styles.pageBtn} ${currentPageNum === 5 ? styles.pageBtnActive : ''}`}
                onClick={() => setCurrentPageNum(5)}
              >
                5
              </button>
              <span className={styles.pageEllipsis}>...</span>
              <button 
                type="button" 
                className={`${styles.pageBtn} ${currentPageNum === 16 ? styles.pageBtnActive : ''}`}
                onClick={() => setCurrentPageNum(16)}
              >
                16
              </button>
              <button 
                type="button" 
                className={styles.pageBtn} 
                disabled={currentPageNum === 16}
                onClick={() => setCurrentPageNum(prev => Math.min(16, prev + 1))}
              >
                ›
              </button>
              <button 
                type="button" 
                className={styles.pageBtn} 
                disabled={currentPageNum === 16}
                onClick={() => setCurrentPageNum(16)}
              >
                »
              </button>

              <select 
                className={styles.perPageSelect}
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
              >
                <option value={10}>10 / sayfa</option>
                <option value={25}>25 / sayfa</option>
                <option value={50}>50 / sayfa</option>
              </select>
            </div>
          </div>
        </div>

        {/* Right Side: Detail Drawer (İşlem Detayı) */}
        {isDrawerOpen && activeLog && (
          <aside className={styles.detailDrawer}>
            <div className={styles.drawerHeader}>
              <h3 className={styles.drawerTitle}>İşlem Detayı</h3>
              <button 
                type="button" 
                className={styles.btnCloseDrawer}
                onClick={() => setIsDrawerOpen(false)}
                title="Kapat"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>

            <div className={styles.drawerBody}>
              {/* Top Banner Card */}
              <div className={styles.drawerBanner}>
                <div className={styles.drawerBannerLeft}>
                  <div className={styles.drawerDocIcon}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                      <polyline points="14 2 14 8 20 8"></polyline>
                      <line x1="16" y1="13" x2="8" y2="13"></line>
                      <line x1="16" y1="17" x2="8" y2="17"></line>
                      <polyline points="10 9 9 9 8 9"></polyline>
                    </svg>
                  </div>
                  <div>
                    <div className={styles.drawerBannerTitle}>{activeLog.action}</div>
                    <div className={styles.drawerBannerTime}>{activeLog.date}</div>
                  </div>
                </div>
                <div>
                  <span className={`${styles.statusPill} ${activeLog.status === 'Başarılı' ? styles.statusSuccess : styles.statusError}`}>
                    {activeLog.status}
                  </span>
                </div>
              </div>

              {/* Section 1: Kullanıcı Bilgileri */}
              <div className={styles.drawerSection}>
                <h4 className={styles.drawerSectionTitle}>Kullanıcı Bilgileri</h4>
                <div className={styles.drawerKeyValueList}>
                  <div className={styles.drawerKeyValueRow}>
                    <span className={styles.drawerKey}>Ad Soyad</span>
                    <span className={styles.drawerValue}>{activeLog.userName}</span>
                  </div>
                  <div className={styles.drawerKeyValueRow}>
                    <span className={styles.drawerKey}>Rol</span>
                    <span className={styles.drawerValue}>{activeLog.userRole}</span>
                  </div>
                  <div className={styles.drawerKeyValueRow}>
                    <span className={styles.drawerKey}>IP Adresi</span>
                    <span className={styles.drawerValue}>{activeLog.ipAddress}</span>
                  </div>
                  <div className={styles.drawerKeyValueRow}>
                    <span className={styles.drawerKey}>Cihaz</span>
                    <span className={styles.drawerValue}>{activeLog.device}</span>
                  </div>
                </div>
              </div>

              {/* Section 2: İşlem Bilgileri */}
              <div className={styles.drawerSection}>
                <h4 className={styles.drawerSectionTitle}>İşlem Bilgileri</h4>
                <div className={styles.drawerKeyValueList}>
                  <div className={styles.drawerKeyValueRow}>
                    <span className={styles.drawerKey}>Modül</span>
                    <span className={styles.drawerValue}>{activeLog.module}</span>
                  </div>
                  <div className={styles.drawerKeyValueRow}>
                    <span className={styles.drawerKey}>İşlem Türü</span>
                    <span className={styles.drawerValue}>{activeLog.action}</span>
                  </div>
                  <div className={styles.drawerKeyValueRow}>
                    <span className={styles.drawerKey}>Açıklama</span>
                    <span className={styles.drawerValue}>{activeLog.description}</span>
                  </div>
                  <div className={styles.drawerKeyValueRow}>
                    <span className={styles.drawerKey}>Sonuç</span>
                    <span className={`${styles.drawerValue} ${activeLog.status === 'Başarılı' ? styles.drawerValueGreen : ''}`}>
                      {activeLog.status}
                    </span>
                  </div>
                </div>
              </div>

              {/* Kullanıcı dostu işlem alanları; teknik JSON yalnızca isteğe bağlı açılır. */}
              <div className={styles.drawerSection}>
                <h4 className={styles.drawerSectionTitle}>İşlem Detayları</h4>
                <div className={styles.drawerKeyValueList}>
                  {Object.entries(activeLog.detailsJson || {})
                    .filter(([key, value]) => value !== null && value !== undefined && value !== '' && !/(^id$|_id$|^organization|^tenant|^metadata$)/i.test(key))
                    .map(([key, value]) => (
                      <div className={styles.drawerKeyValueRow} key={key}>
                        <span className={styles.drawerKey}>{formatDetailLabel(key)}</span>
                        <span className={styles.drawerValue}>{formatDetailValue(key, value)}</span>
                      </div>
                    ))}
                  {Object.entries(activeLog.detailsJson || {}).filter(([key, value]) => value !== null && value !== undefined && value !== '' && !/(^id$|_id$|^organization|^tenant|^metadata$)/i.test(key)).length === 0 && (
                    <p className={styles.emptyDetailText}>Bu işlem için ek detay bulunmuyor.</p>
                  )}
                </div>
              </div>

              <div className={styles.drawerJsonSection}>
                <div
                  className={styles.drawerJsonHeader}
                  onClick={() => setIsJsonExpanded(!isJsonExpanded)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); setIsJsonExpanded(!isJsonExpanded); } }}
                  aria-expanded={isJsonExpanded}
                >
                  <div className={styles.drawerJsonTitleWrap}><span>Ham teknik veri (JSON)</span></div>
                  <div className={styles.drawerJsonActions}>
                    <button
                      type="button"
                      className={styles.btnCopyJson}
                      title="JSON Kopyala"
                      aria-label="Ham JSON verisini kopyala"
                      onClick={handleCopyJson}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                      </svg>
                    </button>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: isJsonExpanded ? 'rotate(0deg)' : 'rotate(180deg)', transition: 'transform 0.2s' }}>
                      <polyline points="18 15 12 9 6 15"></polyline>
                    </svg>
                  </div>
                </div>
                {isJsonExpanded && <pre className={styles.jsonCodeBlock}>{JSON.stringify(activeLog.detailsJson, null, 2)}</pre>}
              </div>
            </div>
          </aside>
        )}
      </div>

      {/* ── Export Modal ── */}
      {showExportModal && (
        <div className={styles.modalOverlay} onClick={() => setShowExportModal(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>İşlem Kayıtlarını Dışa Aktar</h3>
              <button 
                type="button" 
                className={styles.btnCloseDrawer}
                onClick={() => setShowExportModal(false)}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            <div className={styles.modalBody}>
              <p style={{ margin: 0, fontSize: '13px', color: '#4b5563' }}>
                Filtrelenen <strong>{filteredLogs.length}</strong> adet işlem kaydını seçtiğiniz formatta indirebilirsiniz.
              </p>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#374151', marginBottom: 8 }}>
                  Dışa Aktarma Formatı
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                  <button 
                    type="button"
                    style={{
                      padding: '12px',
                      border: exportFormat === 'excel' ? '2px solid #08785B' : '1px solid #E5E7EB',
                      borderRadius: 8,
                      background: exportFormat === 'excel' ? '#E5F4EF' : '#FFFFFF',
                      color: exportFormat === 'excel' ? '#08785B' : '#374151',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                    onClick={() => setExportFormat('excel')}
                  >
                    Excel (.xlsx)
                  </button>
                  <button 
                    type="button"
                    style={{
                      padding: '12px',
                      border: exportFormat === 'csv' ? '2px solid #08785B' : '1px solid #E5E7EB',
                      borderRadius: 8,
                      background: exportFormat === 'csv' ? '#E5F4EF' : '#FFFFFF',
                      color: exportFormat === 'csv' ? '#08785B' : '#374151',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                    onClick={() => setExportFormat('csv')}
                  >
                    CSV (.csv)
                  </button>
                  <button 
                    type="button"
                    style={{
                      padding: '12px',
                      border: exportFormat === 'pdf' ? '2px solid #08785B' : '1px solid #E5E7EB',
                      borderRadius: 8,
                      background: exportFormat === 'pdf' ? '#E5F4EF' : '#FFFFFF',
                      color: exportFormat === 'pdf' ? '#08785B' : '#374151',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                    onClick={() => setExportFormat('pdf')}
                  >
                    PDF (.pdf)
                  </button>
                </div>
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button 
                type="button" 
                className={styles.btnSecondary} 
                onClick={() => setShowExportModal(false)}
              >
                İptal
              </button>
              <button 
                type="button" 
                className={styles.btnPrimary} 
                onClick={handleExportConfirm}
              >
                İndir ve Dışa Aktar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Date Range Modal ── */}
      {showDateModal && (
        <div className={styles.modalOverlay} onClick={() => setShowDateModal(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Tarih Aralığı Seçin</h3>
              <button 
                type="button" 
                className={styles.btnCloseDrawer}
                onClick={() => setShowDateModal(false)}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            <div className={styles.modalBody}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
                {['Bugün', 'Son 7 Gün', `Bu Ay (${new Intl.DateTimeFormat('tr-TR', { month: 'long', year: 'numeric' }).format(new Date())})`, 'Son 3 Ay', `Bu Yıl (${new Date().getFullYear()})`, 'Tüm Zamanlar'].map((rangeOption) => (
                  <button
                    key={rangeOption}
                    type="button"
                    style={{
                      padding: '10px 14px',
                      borderRadius: 8,
                      border: '1px solid #E5E7EB',
                      background: '#FFFFFF',
                      fontSize: '12px',
                      fontWeight: 500,
                      color: '#374151',
                      cursor: 'pointer',
                      textAlign: 'left'
                    }}
                    onClick={() => {
                      const now = new Date();
                      const start = new Date(now);
                      const end = new Date(now);
                      if (rangeOption === 'Bugün') start.setHours(0, 0, 0, 0);
                      else if (rangeOption === 'Son 7 Gün') start.setDate(now.getDate() - 6);
                      else if (rangeOption.startsWith('Bu Ay')) start.setDate(1);
                      else if (rangeOption === 'Son 3 Ay') start.setMonth(now.getMonth() - 2, 1);
                      else if (rangeOption.startsWith('Bu Yıl')) start.setMonth(0, 1);
                      const format = (date: Date) => date.toLocaleDateString('tr-TR');
                      setDateRange(rangeOption === 'Tüm Zamanlar' ? 'Tüm Zamanlar' : `${format(start)} - ${format(end)}`);
                      setShowDateModal(false);
                      addToast({ type: 'info', message: `Tarih filtresi güncellendi: ${rangeOption}` });
                    }}
                  >
                    {rangeOption}
                  </button>
                ))}
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button 
                type="button" 
                className={styles.btnSecondary} 
                onClick={() => setShowDateModal(false)}
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
