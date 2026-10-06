'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { useBranchScope } from '../hooks/useBranchScope';
import { formatCurrency, getAvatarColor, getInitials } from '../data/mockData';
import { fetchServiceTickets, saveServiceTicket, type ServiceRecord } from '../repositories/ServiceTicketRepository';
import { dbFetchCashTransactions } from '../lib/database';
import styles from './ServicePage.module.css';

export interface ServiceItem {
  id: string;
  patientId?: string;
  branchId?: string;
  patientName: string;
  patientPhone: string;
  patientInitials: string;
  avatarColor: string;
  deviceName: string;
  earSide: 'Sol kulak' | 'Sağ kulak' | 'Binaural';
  serialNo: string;
  barcode: string;
  problem: string;
  receivedDate: string;
  estimatedDeliveryDate: string;
  returnedDate?: string | null;
  status: 'Alındı' | 'İnceleniyor' | 'Tamir Ediliyor' | 'Teslime Hazır' | 'Garanti' | 'Teslim Edildi';
  warrantyStatus: 'Garanti Kapsamında' | 'Garanti Dışı';
  deviceType: string;
  notes?: string;
  technician?: string;
  branch?: string;
  operations?: { description: string; cost: number; date: string }[];
  files?: { name: string; size: string; date: string }[];
  history?: { title: string; date: string; user: string; note: string }[];
}

const toIsoDate = (value: string) => {
  if (!value || value === '—') return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const [day, month, year] = value.split('.');
  return day && month && year ? `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}` : '';
};

const toServiceRecord = (item: ServiceItem): ServiceRecord => ({
  id: item.id, patientId: item.patientId, branchId: item.branchId,
  patientName: item.patientName, deviceName: item.deviceName, serialNo: item.serialNo === '—' ? '' : item.serialNo,
  barcode: item.barcode === '—' ? '' : item.barcode, receivedDate: toIsoDate(item.receivedDate),
  estimatedDate: toIsoDate(item.estimatedDeliveryDate), returnedDate: item.returnedDate || null,
  problem: item.problem, operations: (item.operations || []).map(({ description, cost }) => ({ description, cost })),
  totalCost: (item.operations || []).reduce((sum, operation) => sum + operation.cost, 0),
  status: item.status === 'Teslime Hazır' ? 'Hazır' : item.status === 'Garanti' ? 'Alındı' : item.status,
  technician: item.technician || '', warrantyRepair: item.warrantyStatus === 'Garanti Kapsamında', notes: item.notes || '',
  accessoriesTaken: [], complaints: [],
});

const escapeHtml = (value: unknown) => String(value ?? '—').replace(/[&<>"']/g, character => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
}[character]!));


export default function ServicePage() {
  const { addToast, stockList, patientsList, branchesList, currentOrgId, completeServiceTicket } = useApp();
  const addToastRef = useRef(addToast);
  useEffect(() => { addToastRef.current = addToast; }, [addToast]);
  const { matches } = useBranchScope();

  // State Management
  const [records, setRecords] = useState<ServiceItem[]>([]);
  const [serviceRevenue, setServiceRevenue] = useState(0);
  const [filterStatus, setFilterStatus] = useState<string>('Tümü');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('Tüm Şubeler');
  const [selectedDeviceType, setSelectedDeviceType] = useState('Tüm Cihaz Türleri');
  const [selectedWarranty, setSelectedWarranty] = useState('Tüm Garanti Durumları');

  // Selected item for right detail drawer
  const [selectedItem, setSelectedItem] = useState<ServiceItem | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedRowIds, setSelectedRowIds] = useState<string[]>([]);
  const [drawerTab, setDrawerTab] = useState<'Genel' | 'İşlem Geçmişi' | 'Parça & Maliyet' | 'Dosyalar'>('Genel');

  // Modals state
  const [showNewRecordModal, setShowNewRecordModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showAddPartModal, setShowAddPartModal] = useState(false);
  const [showAddFileModal, setShowAddFileModal] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [reportPreviewItem, setReportPreviewItem] = useState<ServiceItem | null>(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [isCreatingRecord, setIsCreatingRecord] = useState(false);
  const [createRecordError, setCreateRecordError] = useState('');

  const exportServiceReport = () => {
    const item = selectedItem;
    const reportTitle = item ? `Servis Raporu - ${item.deviceName}` : 'Aylık Servis Faaliyet Raporu';
    const reportRows = item
      ? [
          ['Hasta', item.patientName], ['Telefon', item.patientPhone], ['Cihaz', `${item.deviceName} (${item.earSide})`],
          ['Seri No', item.serialNo], ['Barkod', item.barcode],
          ['Arıza / Sorun', item.problem], ['Durum', item.status], ['Şube', item.branch],
          ['Teslim Alınma', item.receivedDate], ['Tahmini Teslim', item.estimatedDeliveryDate],
          ['Garanti', item.warrantyStatus], ['Teknisyen', item.technician], ['Notlar', item.notes],
        ]
      : [
          ['Toplam Kayıt', `${records.length} adet`],
          ['Başarı ile Teslim Edilen', `${records.filter(record => record.status === 'Teslim Edildi').length} adet`],
          ['Garanti Kapsamı Oranı', `%${warrantyRate}`],
        ];
    const content = reportRows.map(([label, value]) => `<tr><th>${escapeHtml(label)}</th><td>${escapeHtml(value)}</td></tr>`).join('');
    const popup = window.open('', '_blank');
    if (!popup) {
      addToast({ type: 'error', message: 'Rapor penceresi açılamadı. Tarayıcı açılır pencere iznini etkinleştirip tekrar deneyin.' });
      return false;
    }
    popup.opener = null;
    popup.document.open();
    popup.document.write(`<!doctype html><html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(reportTitle)}</title><style>body{font:14px Arial,sans-serif;color:#172033;margin:40px auto;max-width:800px;padding:0 24px}h1{font-size:22px;border-bottom:2px solid #08785b;padding-bottom:12px}p{color:#64748b}table{width:100%;border-collapse:collapse;margin-top:24px}th,td{text-align:left;border-bottom:1px solid #dbe3ea;padding:12px;vertical-align:top}th{width:30%;color:#475569}.actions{margin:20px 0}@media print{body{margin:0;max-width:none}.actions{display:none}}</style></head><body><div class="actions"><button onclick="window.print()">Yazdır / PDF olarak kaydet</button></div><h1>${escapeHtml(reportTitle)}</h1><p>Oluşturulma: ${escapeHtml(new Date().toLocaleString('tr-TR'))}</p><table><tbody>${content}</tbody></table></body></html>`);
    popup.document.close();
    popup.focus();
    return true;
  };

  // Form states
  const [statusUpdateVal, setStatusUpdateVal] = useState<ServiceItem['status']>('Alındı');
  const [statusUpdateNote, setStatusUpdateNote] = useState('');

  const closeStatusModal = () => {
    setShowStatusModal(false);
    setStatusUpdateNote('');
    if (selectedItem) setStatusUpdateVal(selectedItem.status);
  };

  const [newPartDesc, setNewPartDesc] = useState('');
  const [newPartCost, setNewPartCost] = useState('450');

  const [newRecordForm, setNewRecordForm] = useState({
    patientName: '',
    patientPhone: '',
    deviceName: '',
    earSide: 'Sol kulak' as ServiceItem['earSide'],
    serialNo: '',
    barcode: '',
    problem: '',
    warrantyStatus: 'Garanti Kapsamında' as ServiceItem['warrantyStatus'],
    deviceType: 'Kulak arkası',
    notes: '',
    estimatedDays: '3'
  });

  useEffect(() => {
    let cancelled = false;
    if (!currentOrgId) { setRecords([]); setSelectedItem(null); return; }
    fetchServiceTickets(currentOrgId).then(rows => {
      if (cancelled) return;
      const mapped: ServiceItem[] = rows.map(row => {
        const patient = patientsList.find(item => item.id === row.patientId);
        const status: ServiceItem['status'] = row.status === 'Hazır' ? 'Teslime Hazır' : row.status;
        return {
          id: row.id, patientId: row.patientId, branchId: row.branchId,
          patientName: patient ? `${patient.firstName} ${patient.lastName}`.trim() : row.patientName,
          patientPhone: patient?.phone || '—', patientInitials: getInitials(row.patientName, ''), avatarColor: getAvatarColor(row.patientName),
          deviceName: row.deviceName, earSide: 'Binaural', serialNo: row.serialNo || '—', barcode: row.barcode || '—',
          problem: row.problem, receivedDate: row.receivedDate ? new Date(`${row.receivedDate}T12:00:00`).toLocaleDateString('tr-TR') : '—',
          estimatedDeliveryDate: row.estimatedDate ? new Date(`${row.estimatedDate}T12:00:00`).toLocaleDateString('tr-TR') : '—',
          returnedDate: row.returnedDate, status, warrantyStatus: row.warrantyRepair ? 'Garanti Kapsamında' : 'Garanti Dışı',
          deviceType: row.deviceName, notes: row.notes, technician: row.technician,
          branch: branchesList.find(branch => branch.id === row.branchId)?.name || '—', operations: row.operations.map(op => ({ ...op, date: row.receivedDate })),
          history: [], files: [],
        };
      });
      setRecords(mapped);
      setSelectedItem(current => current ? mapped.find(item => item.id === current.id) || null : null);
    }).catch(error => { if (!cancelled) { setRecords([]); addToastRef.current({ type: 'error', message: error instanceof Error ? error.message : 'Servis kayıtları yüklenemedi.' }); } });
    return () => { cancelled = true; };
  }, [currentOrgId, patientsList, branchesList]);

  useEffect(() => {
    let cancelled = false;
    if (!currentOrgId) return;
    void dbFetchCashTransactions().then(rows => {
      if (cancelled) return;
      const branchIds = new Set(branchesList.filter(branch => matches(branch.name)).map(branch => branch.id));
      setServiceRevenue((rows as Array<Record<string, unknown>>)
        .filter(row => row.type === 'INCOME' && row.referenceEntity === 'service' && (!row.branchId || branchIds.has(String(row.branchId))))
        .reduce((sum, row) => sum + (Number(row.amount) || 0), 0));
    }).catch(() => { if (!cancelled) setServiceRevenue(0); });
    return () => { cancelled = true; };
  }, [currentOrgId, branchesList, matches]);

  const branchScopedRecords = useMemo(() => records.filter(item => matches(item.branch, item.branchId)), [records, matches]);
  const filterCandidates = useMemo(() => branchScopedRecords.filter(item => {
    if (selectedBranch !== 'Tüm Şubeler' && item.branch !== selectedBranch) return false;
    if (selectedDeviceType !== 'Tüm Cihaz Türleri' && item.deviceType !== selectedDeviceType) return false;
    if (selectedWarranty !== 'Tüm Garanti Durumları' && item.warrantyStatus !== selectedWarranty) return false;
    const query = searchTerm.trim().toLocaleLowerCase('tr-TR');
    return !query || [item.patientName, item.patientPhone, item.deviceName, item.serialNo, item.barcode, item.problem]
      .some(value => (value || '').toLocaleLowerCase('tr-TR').includes(query));
  }), [branchScopedRecords, selectedBranch, selectedDeviceType, selectedWarranty, searchTerm]);
  // Pill counts calculation
  const pillCounts = useMemo(() => {
    const total = filterCandidates.length;
    const alindi = filterCandidates.filter(r => r.status === 'Alındı').length;
    const inceleniyor = filterCandidates.filter(r => r.status === 'İnceleniyor').length;
    const tamir = filterCandidates.filter(r => r.status === 'Tamir Ediliyor').length;
    const hazir = filterCandidates.filter(r => r.status === 'Teslime Hazır').length;
    const teslim = filterCandidates.filter(r => r.status === 'Teslim Edildi').length;
    return {
      all: total,
      alindi,
      inceleniyor,
      tamir,
      hazir,
      teslim
    };
  }, [filterCandidates]);
  const warrantyCount = records.filter(record => record.warrantyStatus === 'Garanti Kapsamında').length;
  const warrantyRate = records.length ? Math.round((warrantyCount / records.length) * 100) : 0;

  // Filtered rows
  const filteredRecords = useMemo(() => filterCandidates.filter(item => filterStatus === 'Tümü' || item.status === filterStatus), [filterCandidates, filterStatus]);

  const pageCount = Math.max(1, Math.ceil(filteredRecords.length / pageSize));
  const pagedRecords = filteredRecords.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  useEffect(() => setCurrentPage(1), [filterStatus, selectedBranch, selectedDeviceType, selectedWarranty, searchTerm, pageSize]);
  useEffect(() => setCurrentPage(page => Math.min(page, pageCount)), [pageCount]);

  // Toggle selection
  const handleToggleRow = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedRowIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedRowIds.length === filteredRecords.length) {
      setSelectedRowIds([]);
    } else {
      setSelectedRowIds(filteredRecords.map(r => r.id));
    }
  };

  // Row click opens drawer
  const handleRowClick = (item: ServiceItem) => {
    setSelectedItem(item);
    if (!selectedRowIds.includes(item.id)) {
      setSelectedRowIds([item.id]);
    }
  };

  // Status badge class
  const getStatusBadgeClass = (status: ServiceItem['status']) => {
    switch (status) {
      case 'Alındı': return styles.badgeAlindi;
      case 'İnceleniyor': return styles.badgeInceleniyor;
      case 'Tamir Ediliyor': return styles.badgeTamirEdiliyor;
      case 'Teslime Hazır': return styles.badgeTeslimeHazir;
      case 'Garanti': return styles.badgeGaranti;
      case 'Teslim Edildi': return styles.badgeTeslimEdildi;
      default: return styles.badgeAlindi;
    }
  };

  // Handle Save Status Update
  const handleSaveStatusUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;
    const updated = records.map(r => {
      if (r.id === selectedItem.id) return { ...r, status: statusUpdateVal, notes: statusUpdateNote.trim() ? [r.notes, statusUpdateNote.trim()].filter(Boolean).join('\n') : r.notes };
      return r;
    });
    const refreshed = updated.find(r => r.id === selectedItem.id);
    if (!refreshed || !currentOrgId || !refreshed.branchId) { addToast({ type: 'error', message: 'Servis kaydı firma/şube bilgisi eksik olduğu için güncellenemedi.' }); return; }
    try { await saveServiceTicket(currentOrgId, toServiceRecord(refreshed)); }
    catch (error) { addToast({ type: 'error', message: error instanceof Error ? error.message : 'Servis kaydı güncellenemedi.' }); return; }
    setRecords(updated);
    if (refreshed) setSelectedItem(refreshed);
    setShowStatusModal(false);
    setStatusUpdateNote('');

    if (statusUpdateVal === 'Teslim Edildi') {
      const totalServiceCost = (selectedItem.operations || []).reduce((acc, op) => acc + (op.cost || 0), 0);
      try {
        await completeServiceTicket(selectedItem.id, selectedItem.patientName, totalServiceCost, [], undefined, selectedItem.branchId);
        addToast({ type: 'success', message: `Servis cihazı teslim edildi, ₺${totalServiceCost.toLocaleString('tr-TR')} servis bedeli kasaya işlendi.` });
      } catch {
        addToast({ type: 'error', message: 'Servis durumu güncellendi ancak kasa hareketi oluşturulamadı; kasa kaydı oluşmadı.' });
      }
    } else {
      addToast({ type: 'success', message: `Servis durumu "${statusUpdateVal}" olarak güncellendi.` });
    }
  };

  // Handle Add Part
  const handleAddPart = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem || !newPartDesc) return;
    const cost = parseFloat(newPartCost) || 0;
    const updated = records.map(r => {
      if (r.id === selectedItem.id) {
        const ops = r.operations || [];
        return {
          ...r,
          operations: [
            ...ops,
            {
              description: newPartDesc,
              cost,
              date: new Date().toLocaleDateString('tr-TR')
            }
          ]
        };
      }
      return r;
    });
    const refreshed = updated.find(r => r.id === selectedItem.id);
    if (!refreshed || !currentOrgId || !refreshed.branchId) { addToast({ type: 'error', message: 'Servis kaydının firma/şube bilgisi eksik.' }); return; }
    try { await saveServiceTicket(currentOrgId, toServiceRecord(refreshed)); }
    catch (error) { addToast({ type: 'error', message: error instanceof Error ? error.message : 'Parça/işlem kaydedilemedi.' }); return; }
    setRecords(updated);
    if (refreshed) setSelectedItem(refreshed);
    setShowAddPartModal(false);
    setNewPartDesc('');
    setNewPartCost('0');
    addToast({ type: 'success', message: 'İşlem/Parça başarıyla kaydedildi.' });
  };

  // Handle Add New Record
  const handleCreateRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isCreatingRecord) return;
    setCreateRecordError('');
    const normalizePatientName = (value: string) => value.trim().replace(/\s+/g, ' ').toLocaleLowerCase('tr-TR');
    const normalizePhone = (value: string) => value.replace(/\D/g, '').replace(/^90(?=\d{10}$)/, '0');
    const patientByName = patientsList.find(item => normalizePatientName(`${item.firstName} ${item.lastName}`) === normalizePatientName(newRecordForm.patientName));
    const submittedPhone = normalizePhone(newRecordForm.patientPhone);
    const patientByPhone = submittedPhone.length >= 10
      ? patientsList.find(item => normalizePhone(item.phone || '') === submittedPhone)
      : undefined;
    const patient = patientByName && patientByPhone && patientByName.id !== patientByPhone.id
      ? undefined
      : patientByName || patientByPhone;
    if (!patient || !newRecordForm.deviceName.trim() || !newRecordForm.serialNo.trim() || !newRecordForm.barcode.trim() || !patient.branchId || !currentOrgId) {
      const message = !patient
        ? 'Hasta adı veya telefonu kayıtlı bir hasta ile eşleşmiyor.'
        : !patient.branchId
          ? 'Seçilen hastanın aktif şube bilgisi bulunamadı.'
          : 'Cihaz modeli, seri numarası ve barkod gereklidir.';
      setCreateRecordError(message);
      addToast({ type: 'error', message });
      return;
    }

    const initials = newRecordForm.patientName
      .split(' ')
      .map(w => w[0])
      .join('')
      .toUpperCase()
      .substring(0, 2) || 'YK';

    const newId = crypto.randomUUID();
    const today = new Date().toISOString().slice(0, 10);

    const newItem: ServiceItem = {
      id: newId,
      patientId: patient.id,
      branchId: patient.branchId,
      patientName: `${patient.firstName} ${patient.lastName}`.trim(),
      patientPhone: patient.phone || '—',
      patientInitials: initials,
      avatarColor: '#0d9488',
      deviceName: newRecordForm.deviceName,
      earSide: newRecordForm.earSide,
      serialNo: newRecordForm.serialNo.trim(),
      barcode: newRecordForm.barcode.trim(),
      problem: newRecordForm.problem || 'Belirtilmedi',
      receivedDate: new Date(`${today}T12:00:00`).toLocaleDateString('tr-TR'),
      estimatedDeliveryDate: new Date(Date.now() + Number(newRecordForm.estimatedDays || 3) * 86400000).toLocaleDateString('tr-TR'),
      status: 'Alındı',
      warrantyStatus: newRecordForm.warrantyStatus,
      deviceType: newRecordForm.deviceType,
      notes: newRecordForm.notes,
      technician: '',
      branch: branchesList.find(branch => branch.id === patient.branchId)?.name || '—',
      operations: [],
      files: [],
      history: [
        {
          title: 'Yeni Servis Kaydı Açıldı',
          date: today,
          user: '—',
          note: newRecordForm.notes || 'Cihaz teslim alındı.'
        }
      ]
    };

    setIsCreatingRecord(true);
    try {
      await saveServiceTicket(currentOrgId, toServiceRecord(newItem));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Yeni servis kaydı kaydedilemedi.';
      setCreateRecordError(message);
      addToast({ type: 'error', message });
      return;
    } finally {
      setIsCreatingRecord(false);
    }
    setRecords([newItem, ...records]);
    setSelectedItem(newItem);
    setSelectedRowIds([newItem.id]);
    setShowNewRecordModal(false);
    setNewRecordForm({
      patientName: '',
      patientPhone: '',
      deviceName: '',
      earSide: 'Sol kulak',
      serialNo: '',
      barcode: '',
      problem: '',
      warrantyStatus: 'Garanti Kapsamında',
      deviceType: 'Kulak arkası',
      notes: '',
      estimatedDays: '3'
    });
    addToast({ type: 'success', message: 'Yeni teknik servis kaydı oluşturuldu.' });
  };

  return (
    <div className={styles.servicePage}>
      {/* ── Breadcrumb ── */}
      <div className={styles.breadcrumb}>
        <span>Teknik Servis</span>
        <span>&gt;</span>
        <span style={{ color: '#334155', fontWeight: 500 }}>Servis Takibi</span>
      </div>

      {/* ── Page Heading ── */}
      <div className={styles.pageHeading}>
        <div className={styles.headingCopy}>
          <div className={styles.headingIcon}>
            {/* Wrench icon */}
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
            </svg>
          </div>
          <div>
            <h1>Teknik Servis</h1>
            <p>Cihaz tamir, bakım ve servis süreçlerinizi tek ekranda yönetin.</p>
          </div>
        </div>

        <div className={styles.headerActions}>
          <button
            type="button"
            className={styles.btnSecondaryAction}
            onClick={() => setShowReportModal(true)}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
              <polyline points="10 9 9 9 8 9"></polyline>
            </svg>
            Servis Raporu
          </button>

          <button
            type="button"
            className={styles.btnPrimaryAction}
            onClick={() => { setCreateRecordError(''); setShowNewRecordModal(true); }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            Yeni Servis Kaydı
          </button>
        </div>
      </div>

      {/* ── 4 Stat Cards ── */}
      <div className={styles.statsGrid}>
        {/* Card 1 */}
        <div className={styles.statCard}>
          <div className={`${styles.statIconBox} ${styles.statIconBoxOrange}`}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
            </svg>
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statLabel}>Serviste Bekleyen</span>
            <span className={styles.statValue}>{pillCounts.alindi + pillCounts.inceleniyor + pillCounts.tamir}</span>
          </div>
        </div>

        {/* Card 2 */}
        <div className={styles.statCard}>
          <div className={`${styles.statIconBox} ${styles.statIconBoxGreen}`}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statLabel}>Teslime Hazır</span>
            <span className={styles.statValue}>{pillCounts.hazir}</span>
          </div>
        </div>

        {/* Card 3 */}
        <div className={styles.statCard}>
          <div className={`${styles.statIconBox} ${styles.statIconBoxBlue}`}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="5" width="20" height="14" rx="2"></rect>
              <line x1="2" y1="10" x2="22" y2="10"></line>
            </svg>
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statLabel}>Toplam Servis Geliri</span>
            <span className={styles.statValue}>{formatCurrency(currentOrgId ? serviceRevenue : 0)}</span>
            <div className={styles.statTrend}><span className={styles.trendMuted}>Tahsil edilen servis ücretleri</span></div>
          </div>
        </div>

        {/* Card 4 */}
        <div className={styles.statCard}>
          <div className={`${styles.statIconBox} ${styles.statIconBoxPurple}`}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
              <polyline points="9 12 11 14 15 10"></polyline>
            </svg>
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statLabel}>Garanti Kapsamında</span>
            <span className={styles.statValue}>{warrantyCount}</span>
            <div className={styles.statTrend}><span className={styles.trendMuted}>Toplamın %{warrantyRate}'si</span></div>
          </div>
        </div>
      </div>

      {/* ── Filter Pills & Quick Search Row ── */}
      <div className={styles.filterPillsRow}>
        <div className={styles.pillsList}>
          {[
            { label: `Tümü (${pillCounts.all})`, key: 'Tümü' },
            { label: `Alındı (${pillCounts.alindi})`, key: 'Alındı' },
            { label: `İnceleniyor (${pillCounts.inceleniyor})`, key: 'İnceleniyor' },
            { label: `Tamir Ediliyor (${pillCounts.tamir})`, key: 'Tamir Ediliyor' },
            { label: `Hazır (${pillCounts.hazir})`, key: 'Teslime Hazır' },
            { label: `Teslim Edildi (${pillCounts.teslim})`, key: 'Teslim Edildi' }
          ].map(pill => {
            const isActive = filterStatus.startsWith(pill.key);
            return (
              <button
                key={pill.key}
                type="button"
                className={`${styles.pillBtn} ${isActive ? styles.pillBtnActive : ''}`}
                onClick={() => setFilterStatus(pill.key)}
              >
                {pill.label}
              </button>
            );
          })}
        </div>

        <div className={styles.quickSearchActions}>
          <div className={styles.searchInputWrapper}>
            <svg className={styles.searchIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <input
              type="text"
              placeholder="Hasta adı, cihaz, seri no ile ara..."
              className={styles.searchInput}
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>

          <button
            type="button"
            className={styles.btnFilterOutline}
            onClick={() => addToast({ type: 'info', message: 'Filtreler uygulandı.' })}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
            </svg>
            Filtrele
          </button>

          <button
            type="button"
            className={styles.btnClearOutline}
            onClick={() => {
              setSearchTerm('');
              setFilterStatus('Tümü');
              setSelectedBranch('Tüm Şubeler');
              setSelectedDeviceType('Tüm Cihaz Türleri');
              setSelectedWarranty('Tüm Garanti Durumları');
              addToast({ type: 'info', message: 'Filtreler sıfırlandı.' });
            }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="1 4 1 10 7 10"></polyline>
              <polyline points="23 20 23 14 17 14"></polyline>
              <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"></path>
            </svg>
            Temizle
          </button>
        </div>
      </div>

      {/* ── Secondary Filter Row ── */}
      <div className={styles.secondaryFilterBar}>
        <div className={styles.dateFilterBox}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="16" y1="2" x2="16" y2="6"></line>
            <line x1="8" y1="2" x2="8" y2="6"></line>
            <line x1="3" y1="10" x2="21" y2="10"></line>
          </svg>
          <span>01.09.2026 - 30.09.2026</span>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2">
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </div>

        <select
          className={styles.filterSelect}
          value={selectedBranch}
          onChange={e => setSelectedBranch(e.target.value)}
        >
          <option value="Tüm Şubeler">Tüm Şubeler</option>
          {branchesList.filter(branch => branch.status === 'Aktif').map(branch => <option key={branch.id} value={branch.name}>{branch.name}</option>)}
        </select>

        <select
          className={styles.filterSelect}
          aria-label="Servis durumu"
          value={filterStatus === 'Tümü' ? 'Tüm Durumlar' : filterStatus}
          onChange={e => setFilterStatus(e.target.value === 'Tüm Durumlar' ? 'Tümü' : e.target.value)}
        >
          <option value="Tüm Durumlar">Tüm Durumlar</option>
          <option value="Alındı">Alındı</option>
          <option value="İnceleniyor">İnceleniyor</option>
          <option value="Tamir Ediliyor">Tamir Ediliyor</option>
          <option value="Teslime Hazır">Teslime Hazır</option>
          <option value="Garanti">Garanti</option>
          <option value="Teslim Edildi">Teslim Edildi</option>
        </select>

        <select
          className={styles.filterSelect}
          value={selectedDeviceType}
          onChange={e => setSelectedDeviceType(e.target.value)}
        >
          <option value="Tüm Cihaz Türleri">Tüm Cihaz Türleri</option>
          <option value="Kulak arkası">Kulak arkası</option>
          <option value="RIC (Hoparlör Kulak İçi)">RIC (Hoparlör Kulak İçi)</option>
          <option value="Kulak içi (ITE)">Kulak içi (ITE)</option>
          <option value="Şarjlı Kulak Arkası">Şarjlı Kulak Arkası</option>
        </select>

        <select
          className={styles.filterSelect}
          value={selectedWarranty}
          onChange={e => setSelectedWarranty(e.target.value)}
        >
          <option value="Tüm Garanti Durumları">Tüm Garanti Durumları</option>
          <option value="Garanti Kapsamında">Garanti Kapsamında</option>
          <option value="Garanti Dışı">Garanti Dışı</option>
        </select>
      </div>

      {/* ── Main Layout: Table + Detail Drawer ── */}
      <div className={styles.mainLayoutContainer}>
        {/* Table Column */}
        <div className={`${styles.tableSection} ${selectedItem ? styles.tableSectionWithDrawer : ''}`}>
          <div className={styles.tableWrapper}>
            <table className={styles.serviceTable}>
              <thead>
                <tr>
                  <th style={{ width: 40, textAlign: 'center' }}>
                    <input
                      type="checkbox"
                      className={styles.checkboxInput}
                      checked={selectedRowIds.length === filteredRecords.length && filteredRecords.length > 0}
                      onChange={handleSelectAll}
                    />
                  </th>
                  <th>HASTA</th>
                  <th>CİHAZ</th>
                  <th>SERİ NO / BARKOD</th>
                  <th>ARIZA / SORUN</th>
                  <th>ALIM TARİHİ</th>
                  <th>TAHMİNİ TESLİM</th>
                  <th>DURUM</th>
                  <th style={{ textAlign: 'center' }}>İŞLEMLER</th>
                </tr>
              </thead>
              <tbody>
                {filteredRecords.length === 0 ? (
                  <tr>
                    <td colSpan={9} style={{ textAlign: 'center', padding: '40px 16px', color: '#64748b' }}>
                      Kriterlere uygun teknik servis kaydı bulunamadı.
                    </td>
                  </tr>
                ) : (
                  pagedRecords.map(item => {
                    const isSelected = selectedRowIds.includes(item.id);
                    const isCurrentDetail = selectedItem?.id === item.id;
                    return (
                      <tr
                        key={item.id}
                        className={`${styles.tableRow} ${isCurrentDetail ? styles.tableRowSelected : ''}`}
                        onClick={() => handleRowClick(item)}
                      >
                        <td style={{ textAlign: 'center' }} onClick={e => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            className={styles.checkboxInput}
                            checked={isSelected}
                            onChange={(e) => handleToggleRow(item.id, e as unknown as React.MouseEvent)}
                          />
                        </td>

                        <td>
                          <div className={styles.patientCell}>
                            <div
                              className={styles.patientAvatar}
                              style={{ background: item.avatarColor }}
                            >
                              {item.patientInitials}
                            </div>
                            <div className={styles.patientMeta}>
                              <span className={styles.patientName}>{item.patientName}</span>
                              <span className={styles.patientPhone}>{item.patientPhone}</span>
                            </div>
                          </div>
                        </td>

                        <td>
                          <div className={styles.deviceCell}>
                            <span className={styles.deviceName}>{item.deviceName}</span>
                            <span className={styles.deviceEar}>{item.earSide}</span>
                          </div>
                        </td>

                        <td>
                          <div className={styles.serialCell}>
                            <span className={styles.serialNo}>SN: {item.serialNo}</span>
                            <span className={styles.barcodeNo}>Barkod: {item.barcode}</span>
                          </div>
                        </td>

                        <td>
                          <div className={styles.problemCell} title={item.problem}>
                            {item.problem}
                          </div>
                        </td>

                        <td>
                          <span className={styles.dateCell}>{item.receivedDate}</span>
                        </td>

                        <td>
                          <span className={styles.dateCell}>{item.estimatedDeliveryDate}</span>
                        </td>

                        <td>
                          <span className={`${styles.badgeStatus} ${getStatusBadgeClass(item.status)}`}>
                            {item.status}
                          </span>
                        </td>

                        <td style={{ textAlign: 'center' }} onClick={e => e.stopPropagation()}>
                          <div className={styles.actionButtonsCell} style={{ justifyContent: 'center' }}>
                            <button
                              type="button"
                              className={styles.iconBtn}
                              title="Görüntüle"
                              onClick={() => setSelectedItem(item)}
                            >
                              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                <circle cx="12" cy="12" r="3"></circle>
                              </svg>
                            </button>

                            <button
                              type="button"
                              className={styles.iconBtn}
                              title="Düzenle"
                              onClick={() => {
                                setSelectedItem(item);
                                setShowEditModal(true);
                              }}
                            >
                              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
                              </svg>
                            </button>

                            <button
                              type="button"
                              className={styles.iconBtn}
                              title="Diğer İşlemler"
                              onClick={() => {
                                setSelectedItem(item);
                                setShowStatusModal(true);
                              }}
                            >
                              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="1"></circle>
                                <circle cx="12" cy="5" r="1"></circle>
                                <circle cx="12" cy="19" r="1"></circle>
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* ── Table Pagination Bar ── */}
          <div className={styles.paginationRow}>
            <div>
              Toplam {filteredRecords.length} kayıt |{' '}
              <span className={styles.selectedCount}>{selectedRowIds.length} kayıt seçili</span>
            </div>

            {filteredRecords.length > 0 && <div className={styles.pageControls}>
              <button type="button" className={styles.pageBtn} title="Önceki Sayfa" aria-label="Önceki sayfa" disabled={currentPage <= 1} onClick={() => setCurrentPage(page => Math.max(1, page - 1))}>‹</button>
              {Array.from({ length: pageCount }, (_, index) => index + 1).map(page => <button type="button" key={page} className={`${styles.pageBtn} ${currentPage === page ? styles.pageBtnActive : ''}`} aria-current={currentPage === page ? 'page' : undefined} onClick={() => setCurrentPage(page)}>{page}</button>)}
              <button type="button" className={styles.pageBtn} title="Sonraki Sayfa" aria-label="Sonraki sayfa" disabled={currentPage >= pageCount} onClick={() => setCurrentPage(page => Math.min(pageCount, page + 1))}>›</button>
              <select className={styles.pageSizeSelect} value={pageSize} onChange={event => setPageSize(Number(event.target.value))} aria-label="Sayfa başına servis kaydı">
                <option value="10">10 / sayfa</option><option value="25">25 / sayfa</option><option value="50">50 / sayfa</option>
              </select>
            </div>}
          </div>
        </div>

        {/* ── Right Detail Drawer ── */}
        {selectedItem && (
          <div className={styles.detailDrawer}>
            {/* Drawer Header */}
            <div className={styles.drawerHeader}>
              <div className={styles.drawerPatientInfo}>
                <div className={styles.drawerAvatar}>
                  {selectedItem.patientInitials}
                </div>
                <div className={styles.drawerTitleWrap}>
                  <h3>{selectedItem.patientName}</h3>
                  <p>{selectedItem.patientPhone}</p>
                </div>
              </div>

              <div className={styles.drawerHeaderRight}>
                <span className={`${styles.badgeStatus} ${getStatusBadgeClass(selectedItem.status)}`}>
                  ● {selectedItem.status}
                </span>
                <button
                  type="button"
                  className={styles.drawerCloseBtn}
                  onClick={() => setSelectedItem(null)}
                  title="Detayı Kapat"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Drawer Sub-Tabs */}
            <div className={styles.drawerTabs}>
              {(['Genel', 'İşlem Geçmişi', 'Parça & Maliyet', 'Dosyalar'] as const).map(tab => (
                <button
                  key={tab}
                  type="button"
                  className={`${styles.drawerTabBtn} ${drawerTab === tab ? styles.drawerTabBtnActive : ''}`}
                  onClick={() => setDrawerTab(tab)}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Drawer Content */}
            <div className={styles.drawerBody}>
              {drawerTab === 'Genel' && (
                <>
                  {/* Cihaz Bilgileri */}
                  <div className={styles.sectionBlock}>
                    <div className={styles.sectionHeaderRow}>
                      <span className={styles.sectionTitle}>Cihaz Bilgileri</span>
                      <button
                        type="button"
                        className={styles.btnEditMini}
                        onClick={() => setShowEditModal(true)}
                      >
                        Düzenle
                      </button>
                    </div>

                    <div className={styles.deviceVisualBox}>
                      <div className={styles.deviceIconPlaceholder}>
                        {/* Hearing Aid Ear Device SVG */}
                        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M6 8.5a6.5 6.5 0 1 1 13 0c0 3-1.5 5.5-3.5 7.5l-.5.5a3 3 0 0 0-1 2.2v.3a1 1 0 0 1-1 1h-2a1 1 0 0 1-1-1v-.8a4.5 4.5 0 0 1 1.3-3.2l.7-.7c1.5-1.5 2.5-3.3 2.5-5.8a4.5 4.5 0 1 0-9 0" />
                          <circle cx="10" cy="14" r="1" />
                        </svg>
                      </div>
                      <div className={styles.deviceVisualInfo}>
                        <h4>{selectedItem.deviceName}</h4>
                        <span>{selectedItem.earSide}</span>
                      </div>
                    </div>

                    <div className={styles.keyValueGrid}>
                      <div className={styles.keyValueRow}>
                        <span className={styles.keyLabel}>Seri No</span>
                        <span className={styles.keyVal} style={{ fontFamily: 'monospace' }}>{selectedItem.serialNo}</span>
                      </div>
                      <div className={styles.keyValueRow}>
                        <span className={styles.keyLabel}>Barkod</span>
                        <span className={styles.keyVal}>{selectedItem.barcode}</span>
                      </div>
                      <div className={styles.keyValueRow}>
                        <span className={styles.keyLabel}>Garanti Durumu</span>
                        <span className={selectedItem.warrantyStatus === 'Garanti Kapsamında' ? styles.badgeGarantiVar : styles.badgeGarantiDisi}>
                          {selectedItem.warrantyStatus}
                        </span>
                      </div>
                      <div className={styles.keyValueRow}>
                        <span className={styles.keyLabel}>Cihaz Türü</span>
                        <span className={styles.keyVal}>{selectedItem.deviceType}</span>
                      </div>
                      <div className={styles.keyValueRow}>
                        <span className={styles.keyLabel}>Alım Tarihi</span>
                        <span className={styles.keyVal}>{selectedItem.receivedDate}</span>
                      </div>
                    </div>
                  </div>

                  {/* Servis Bilgileri */}
                  <div className={styles.sectionBlock}>
                    <span className={styles.sectionTitle}>Servis Bilgileri</span>

                    <div className={styles.keyValueGrid}>
                      <div className={styles.keyValueRow}>
                        <span className={styles.keyLabel}>Arıza / Sorun</span>
                        <span className={styles.keyVal} style={{ fontWeight: 600 }}>{selectedItem.problem}</span>
                      </div>
                      <div className={styles.keyValueRow}>
                        <span className={styles.keyLabel}>Açıklama</span>
                        <span className={styles.keyVal}>{selectedItem.notes || '—'}</span>
                      </div>
                      <div className={styles.keyValueRow}>
                        <span className={styles.keyLabel}>Alım Tarihi</span>
                        <span className={styles.keyVal}>{selectedItem.receivedDate}</span>
                      </div>
                      <div className={styles.keyValueRow}>
                        <span className={styles.keyLabel}>Tahmini Teslim</span>
                        <span className={styles.keyVal}>{selectedItem.estimatedDeliveryDate}</span>
                      </div>
                      <div className={styles.keyValueRow}>
                        <span className={styles.keyLabel}>Sorumlu</span>
                        <span className={styles.keyVal}>{selectedItem.technician || 'Teknik Servis'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Hızlı İşlemler (2x2 Grid) */}
                  <div className={styles.sectionBlock}>
                    <span className={styles.sectionTitle}>Hızlı İşlemler</span>

                    <div className={styles.quickActionsGrid}>
                      <button
                        type="button"
                        className={styles.quickActionBtn}
                        onClick={() => {
                          setStatusUpdateVal(selectedItem.status);
                          setShowStatusModal(true);
                        }}
                      >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="23 4 23 10 17 10"></polyline>
                          <polyline points="1 20 1 14 7 14"></polyline>
                          <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
                        </svg>
                        Durum Güncelle
                      </button>

                      <button
                        type="button"
                        className={styles.quickActionBtn}
                        onClick={() => setShowAddPartModal(true)}
                      >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="12" cy="12" r="3"></circle>
                          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                        </svg>
                        Parça Ekle
                      </button>

                      <button
                        type="button"
                        className={styles.quickActionBtn}
                        onClick={() => setShowAddFileModal(true)}
                      >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path>
                        </svg>
                        Dosya Ekle
                      </button>

                      <button
                        type="button"
                        className={styles.quickActionBtn}
                        onClick={() => setShowPrintModal(true)}
                      >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="6 9 6 2 18 2 18 9"></polyline>
                          <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
                          <rect x="6" y="14" width="12" height="8"></rect>
                        </svg>
                        Servis Formu Yazdır
                      </button>
                    </div>
                  </div>
                </>
              )}

              {drawerTab === 'İşlem Geçmişi' && (
                <div className={styles.sectionBlock}>
                  <span className={styles.sectionTitle}>Servis Zaman Çizelgesi</span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 6 }}>
                    {(selectedItem.history && selectedItem.history.length > 0) ? (
                      selectedItem.history.map((hist, idx) => (
                        <div key={idx} style={{ borderLeft: '2px solid #0d9488', paddingLeft: 12, position: 'relative' }}>
                          <div style={{ fontWeight: 600, fontSize: 13, color: '#0f172a' }}>{hist.title}</div>
                          <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{hist.date} • {hist.user}</div>
                          <div style={{ fontSize: 12, color: '#334155', marginTop: 4 }}>{hist.note}</div>
                        </div>
                      ))
                    ) : (
                      <p style={{ color: '#64748b', fontSize: 12 }}>Henüz geçmiş kaydı bulunmuyor.</p>
                    )}
                  </div>
                </div>
              )}

              {drawerTab === 'Parça & Maliyet' && (
                <div className={styles.sectionBlock}>
                  <div className={styles.sectionHeaderRow}>
                    <span className={styles.sectionTitle}>Kullanılan Parçalar ve Ücretler</span>
                    <button
                      type="button"
                      className={styles.btnEditMini}
                      onClick={() => setShowAddPartModal(true)}
                    >
                      + Ekle
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 6 }}>
                    {(selectedItem.operations && selectedItem.operations.length > 0) ? (
                      selectedItem.operations.map((op, idx) => (
                        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 10px', background: '#f8fafc', borderRadius: 6, fontSize: 12 }}>
                          <div>
                            <div style={{ fontWeight: 600, color: '#1e293b' }}>{op.description}</div>
                            <div style={{ fontSize: 10, color: '#64748b' }}>{op.date}</div>
                          </div>
                          <div style={{ fontWeight: 700, color: op.cost > 0 ? '#0f766e' : '#16a34a' }}>
                            {op.cost > 0 ? formatCurrency(op.cost) : 'Ücretsiz'}
                          </div>
                        </div>
                      ))
                    ) : (
                      <p style={{ color: '#64748b', fontSize: 12 }}>Henüz parça veya işlem eklenmedi.</p>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #e2e8f0', paddingTop: 10, marginTop: 6, fontWeight: 700, fontSize: 13 }}>
                      <span>Toplam Tutar:</span>
                      <span style={{ color: '#0d9488' }}>
                        {formatCurrency((selectedItem.operations || []).reduce((acc, o) => acc + o.cost, 0))}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {drawerTab === 'Dosyalar' && (
                <div className={styles.sectionBlock}>
                  <div className={styles.sectionHeaderRow}>
                    <span className={styles.sectionTitle}>Ekli Dosyalar & Belgeler</span>
                    <button
                      type="button"
                      className={styles.btnEditMini}
                      onClick={() => setShowAddFileModal(true)}
                    >
                      + Yükle
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 6 }}>
                    {(selectedItem.files && selectedItem.files.length > 0) ? (
                      selectedItem.files.map((file, idx) => (
                        <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 10px', background: '#f8fafc', borderRadius: 6, fontSize: 12 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2">
                              <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path>
                              <polyline points="13 2 13 9 20 9"></polyline>
                            </svg>
                            <div>
                              <div style={{ fontWeight: 600, color: '#1e293b' }}>{file.name}</div>
                              <div style={{ fontSize: 10, color: '#64748b' }}>{file.size} • {file.date}</div>
                            </div>
                          </div>
                          <button
                            type="button"
                            className={styles.iconBtn}
                            onClick={() => addToast({ type: 'info', message: `${file.name} indiriliyor...` })}
                          >
                            ↓
                          </button>
                        </div>
                      ))
                    ) : (
                      <p style={{ color: '#64748b', fontSize: 12 }}>Ekli dosya bulunmuyor.</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── MODAL 1: Durum Güncelle ── */}
      {showStatusModal && selectedItem && (
        <div className={styles.modalOverlay} onClick={closeStatusModal}>
          <div
            className={styles.modalContent}
            role="dialog"
            aria-modal="true"
            aria-labelledby="service-status-dialog-title"
            onClick={e => e.stopPropagation()}
          >
            <div className={styles.modalHeader}>
              <h2 id="service-status-dialog-title">🔄 Servis Durumu Güncelle — {selectedItem.patientName}</h2>
              <button type="button" className={styles.modalCloseBtn} aria-label="Durum penceresini kapat" onClick={closeStatusModal}>✕</button>
            </div>
            <form onSubmit={handleSaveStatusUpdate}>
              <div className={styles.modalBody}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Yeni Durum Seçin</label>
                  <select
                    className={styles.formSelect}
                    value={statusUpdateVal}
                    onChange={e => setStatusUpdateVal(e.target.value as ServiceItem['status'])}
                  >
                    <option value="Alındı">Alındı</option>
                    <option value="İnceleniyor">İnceleniyor</option>
                    <option value="Tamir Ediliyor">Tamir Ediliyor</option>
                    <option value="Teslime Hazır">Teslime Hazır</option>
                    <option value="Garanti">Garanti</option>
                    <option value="Teslim Edildi">Teslim Edildi</option>
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>İşlem / Teknisyen Notu</label>
                  <textarea
                    rows={3}
                    className={styles.formTextarea}
                    placeholder="Durum değişikliği ile ilgili açıklama yazın..."
                    value={statusUpdateNote}
                    onChange={e => setStatusUpdateNote(e.target.value)}
                  />
                </div>
              </div>
              <div className={styles.modalFooter}>
                <button type="button" className={styles.btnSecondaryAction} onClick={closeStatusModal}>İptal</button>
                <button type="submit" className={styles.btnPrimaryAction}>Güncellemeyi Kaydet</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL 2: Parça & İşlem Ekle ── */}
      {showAddPartModal && selectedItem && (
        <div className={styles.modalOverlay} onClick={() => setShowAddPartModal(false)}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>⚙️ Parça veya İşlem Ekle — {selectedItem.deviceName}</h2>
              <button type="button" className={styles.modalCloseBtn} onClick={() => setShowAddPartModal(false)}>✕</button>
            </div>
            <form onSubmit={handleAddPart}>
              <div className={styles.modalBody}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>İşlem / Parça Adı</label>
                  <input
                    type="text"
                    required
                    className={styles.formInput}
                    placeholder="Örn: Mikrofon filtresi değişimi"
                    value={newPartDesc}
                    onChange={e => setNewPartDesc(e.target.value)}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Ücret (TL) — Garanti kapsamında ise 0 yazabilirsiniz</label>
                  <input
                    type="number"
                    min="0"
                    step="50"
                    className={styles.formInput}
                    value={newPartCost}
                    onChange={e => setNewPartCost(e.target.value)}
                  />
                </div>
              </div>
              <div className={styles.modalFooter}>
                <button type="button" className={styles.btnSecondaryAction} onClick={() => setShowAddPartModal(false)}>İptal</button>
                <button type="submit" className={styles.btnPrimaryAction}>Parçayı Ekle</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL 3: Dosya Ekle ── */}
      {showAddFileModal && selectedItem && (
        <div className={styles.modalOverlay} onClick={() => setShowAddFileModal(false)}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>📎 Dosya & Belge Ekle</h2>
              <button type="button" className={styles.modalCloseBtn} onClick={() => setShowAddFileModal(false)}>✕</button>
            </div>
            <div className={styles.modalBody}>
              <div style={{ border: '2px dashed #cbd5e1', borderRadius: 12, padding: 30, textAlign: 'center', background: '#f8fafc' }}>
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="1.8" style={{ margin: '0 auto 10px' }}>
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="17 8 12 3 7 8"></polyline>
                  <line x1="12" y1="3" x2="12" y2="15"></line>
                </svg>
                <div style={{ fontWeight: 600, fontSize: 14, color: '#1e293b' }}>Belge veya fotoğrafı buraya sürükleyin</div>
                <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>PNG, JPG, PDF (maks 10MB)</div>
                <button
                  type="button"
                  className={styles.btnSecondaryAction}
                  style={{ marginTop: 14 }}
                  onClick={() => {
                    addToast({ type: 'error', message: 'Servis dosyaları için dosya saklama altyapısı yapılandırılmadı; dosya yüklenmedi.' });
                  }}
                >
                  Dosya Seçin
                </button>
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button type="button" className={styles.btnSecondaryAction} onClick={() => setShowAddFileModal(false)}>Kapat</button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL 4: Servis Formu Yazdır ── */}
      {showPrintModal && selectedItem && (
        <div className={styles.modalOverlay} onClick={() => setShowPrintModal(false)}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()} style={{ maxWidth: 540 }}>
            <div className={styles.modalHeader}>
              <h2>🖨️ Servis Kabul & Teslim Formu</h2>
              <button type="button" className={styles.modalCloseBtn} onClick={() => setShowPrintModal(false)}>✕</button>
            </div>
            <div className={styles.modalBody}>
              <div style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: 18, background: '#ffffff', fontFamily: 'sans-serif' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #004d40', paddingBottom: 10, marginBottom: 14 }}>
                  <div>
                    <h3 style={{ margin: 0, color: '#004d40', fontSize: 16 }}>İŞİTME MERKEZİ TEKNİK SERVİS</h3>
                    <p style={{ margin: '2px 0 0', fontSize: 11, color: '#64748b' }}>Servis Takip Fişi: #{selectedItem.barcode}</p>
                  </div>
                  <div style={{ textAlign: 'right', fontSize: 11, color: '#64748b' }}>
                    Tarih: {selectedItem.receivedDate}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, fontSize: 12, marginBottom: 14 }}>
                  <div><strong>Hasta:</strong> {selectedItem.patientName}</div>
                  <div><strong>Telefon:</strong> {selectedItem.patientPhone}</div>
                  <div><strong>Cihaz:</strong> {selectedItem.deviceName} ({selectedItem.earSide})</div>
                  <div><strong>Seri No:</strong> {selectedItem.serialNo}</div>
                  <div><strong>Garanti:</strong> {selectedItem.warrantyStatus}</div>
                  <div><strong>Tahmini Teslim:</strong> {selectedItem.estimatedDeliveryDate}</div>
                </div>

                <div style={{ background: '#f8fafc', padding: 10, borderRadius: 6, fontSize: 12, marginBottom: 14 }}>
                  <strong>Bildirilen Arıza / Sorun:</strong>
                  <div style={{ marginTop: 4, color: '#334155' }}>{selectedItem.problem}</div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 30, fontSize: 11, color: '#64748b', textAlign: 'center' }}>
                  <div style={{ width: 140, borderTop: '1px solid #cbd5e1', paddingTop: 4 }}>Teslim Eden (Hasta/Yakını)</div>
                  <div style={{ width: 140, borderTop: '1px solid #cbd5e1', paddingTop: 4 }}>Teslim Alan (Teknisyen)</div>
                </div>
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button type="button" className={styles.btnSecondaryAction} onClick={() => setShowPrintModal(false)}>Kapat</button>
              <button
                type="button"
                className={styles.btnPrimaryAction}
                onClick={() => {
                  setReportPreviewItem(selectedItem);
                  setShowPrintModal(false);
                }}
              >
                Yazdır / PDF İndir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL 5: Servis Raporu ── */}
      {showReportModal && (
        <div className={styles.modalOverlay} onClick={() => setShowReportModal(false)}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>📊 Aylık Servis Faaliyet Raporu</h2>
              <button type="button" className={styles.modalCloseBtn} onClick={() => setShowReportModal(false)}>✕</button>
            </div>
            <div className={styles.modalBody}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
                <div style={{ background: '#f8fafc', padding: 14, borderRadius: 10 }}>
                  <div style={{ fontSize: 12, color: '#64748b' }}>Toplam Kayıt</div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: '#0f172a' }}>{records.length} adet</div>
                </div>
                <div style={{ background: '#f0fdf4', padding: 14, borderRadius: 10 }}>
                  <div style={{ fontSize: 12, color: '#16a34a' }}>Başarı ile Teslim Edilen</div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: '#16a34a' }}>{records.filter(r => r.status === 'Teslim Edildi').length} adet</div>
                </div>
                <div style={{ background: '#eff6ff', padding: 14, borderRadius: 10 }}>
                  <div style={{ fontSize: 12, color: '#2563eb' }}>Garanti Kapsamı Oranı</div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: '#2563eb' }}>%{warrantyRate}</div>
                </div>
                <div style={{ background: '#fef3c7', padding: 14, borderRadius: 10 }}>
                  <div style={{ fontSize: 12, color: '#b45309' }}>Ortalama Onarım Süresi</div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: '#b45309' }}>—</div>
                </div>
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button type="button" className={styles.btnSecondaryAction} onClick={() => setShowReportModal(false)}>Kapat</button>
              <button
                type="button"
                className={styles.btnPrimaryAction}
                onClick={exportServiceReport}
              >
                Raporu Dışa Aktar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL 6: Yeni Servis Kaydı ── */}
      {showNewRecordModal && (
        <div className={styles.modalOverlay} onClick={() => setShowNewRecordModal(false)}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>➕ Yeni Teknik Servis Kaydı</h2>
              <button type="button" className={styles.modalCloseBtn} onClick={() => setShowNewRecordModal(false)}>✕</button>
            </div>
            <form onSubmit={handleCreateRecord}>
              <div className={styles.modalBody}>
                {createRecordError && <div role="alert" className={styles.formGroup} style={{ color: '#b42318', background: '#fef3f2', border: '1px solid #fecdca', borderRadius: 8, padding: '10px 12px' }}>{createRecordError}</div>}
                <div className={styles.formGrid2}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Hasta Adı Soyadı *</label>
                    <input
                      type="text"
                      required
                      placeholder="Örn: Ahmet Can"
                      className={styles.formInput}
                      value={newRecordForm.patientName}
                      list="service-patient-options"
                      onChange={e => { setCreateRecordError(''); setNewRecordForm({ ...newRecordForm, patientName: e.target.value }); }}
                    />
                    <datalist id="service-patient-options">
                      {patientsList.map(patient => <option key={patient.id} value={`${patient.firstName} ${patient.lastName}`.trim()} />)}
                    </datalist>
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Hasta Telefon</label>
                    <input
                      type="text"
                      placeholder="05XX XXX XX XX"
                      className={styles.formInput}
                      value={newRecordForm.patientPhone}
                      onChange={e => setNewRecordForm({ ...newRecordForm, patientPhone: e.target.value })}
                    />
                  </div>
                </div>

                <div className={styles.formGrid2}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Cihaz Modeli *</label>
                    <input
                      type="text"
                      required
                      placeholder="Örn: Oticon Real 1"
                      className={styles.formInput}
                      value={newRecordForm.deviceName}
                      onChange={e => setNewRecordForm({ ...newRecordForm, deviceName: e.target.value })}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Kulak Yönü</label>
                    <select
                      className={styles.formSelect}
                      value={newRecordForm.earSide}
                      onChange={e => setNewRecordForm({ ...newRecordForm, earSide: e.target.value as ServiceItem['earSide'] })}
                    >
                      <option value="Sol kulak">Sol kulak</option>
                      <option value="Sağ kulak">Sağ kulak</option>
                      <option value="Binaural">Binaural (Çift)</option>
                    </select>
                  </div>
                </div>

                <div className={styles.formGrid2}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Seri No</label>
                    <input
                      type="text"
                      required
                      placeholder="Örn: 1234567890"
                      className={styles.formInput}
                      value={newRecordForm.serialNo}
                      onChange={e => setNewRecordForm({ ...newRecordForm, serialNo: e.target.value })}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Barkod No</label>
                    <input
                      type="text"
                      required
                      placeholder="Örn: OT-001"
                      className={styles.formInput}
                      value={newRecordForm.barcode}
                      onChange={e => setNewRecordForm({ ...newRecordForm, barcode: e.target.value })}
                    />
                  </div>
                </div>

                <div className={styles.formGrid2}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Garanti Durumu</label>
                    <select
                      className={styles.formSelect}
                      value={newRecordForm.warrantyStatus}
                      onChange={e => setNewRecordForm({ ...newRecordForm, warrantyStatus: e.target.value as ServiceItem['warrantyStatus'] })}
                    >
                      <option value="Garanti Kapsamında">Garanti Kapsamında</option>
                      <option value="Garanti Dışı">Garanti Dışı</option>
                    </select>
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Cihaz Türü</label>
                    <select
                      className={styles.formSelect}
                      value={newRecordForm.deviceType}
                      onChange={e => setNewRecordForm({ ...newRecordForm, deviceType: e.target.value })}
                    >
                      <option value="Kulak arkası">Kulak arkası</option>
                      <option value="RIC (Hoparlör Kulak İçi)">RIC (Hoparlör Kulak İçi)</option>
                      <option value="Kulak içi (ITE)">Kulak içi (ITE)</option>
                      <option value="Şarjlı Kulak Arkası">Şarjlı Kulak Arkası</option>
                    </select>
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Arıza / Sorun Tanımı *</label>
                  <input
                    type="text"
                    required
                    placeholder="Örn: Ses kesilmesi, cızırtı, cihaz açılmıyor..."
                    className={styles.formInput}
                    value={newRecordForm.problem}
                    onChange={e => setNewRecordForm({ ...newRecordForm, problem: e.target.value })}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Ek Açıklama & Notlar</label>
                  <textarea
                    rows={2}
                    placeholder="Müşterinin belirttiği ek detaylar..."
                    className={styles.formTextarea}
                    value={newRecordForm.notes}
                    onChange={e => setNewRecordForm({ ...newRecordForm, notes: e.target.value })}
                  />
                </div>
              </div>
              <div className={styles.modalFooter}>
                <button type="button" className={styles.btnSecondaryAction} onClick={() => setShowNewRecordModal(false)}>İptal</button>
                <button type="submit" className={styles.btnPrimaryAction} disabled={isCreatingRecord}>
                  {isCreatingRecord ? 'Kaydediliyor…' : 'Servis Kaydını Aç'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL 7: Düzenle ── */}
      {showEditModal && selectedItem && (
        <div className={styles.modalOverlay} onClick={() => setShowEditModal(false)}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>✏️ Cihaz & Servis Bilgilerini Düzenle</h2>
              <button type="button" className={styles.modalCloseBtn} onClick={() => setShowEditModal(false)}>✕</button>
            </div>
            <form onSubmit={e => {
              e.preventDefault();
              setShowEditModal(false);
              addToast({ type: 'success', message: 'Kayıt bilgileri başarıyla güncellendi.' });
            }}>
              <div className={styles.modalBody}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Cihaz Modeli</label>
                  <input
                    type="text"
                    className={styles.formInput}
                    defaultValue={selectedItem.deviceName}
                    onChange={e => setSelectedItem({ ...selectedItem, deviceName: e.target.value })}
                  />
                </div>
                <div className={styles.formGrid2}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Seri No</label>
                    <input
                      type="text"
                      className={styles.formInput}
                      defaultValue={selectedItem.serialNo}
                      onChange={e => setSelectedItem({ ...selectedItem, serialNo: e.target.value })}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Barkod</label>
                    <input
                      type="text"
                      className={styles.formInput}
                      defaultValue={selectedItem.barcode}
                      onChange={e => setSelectedItem({ ...selectedItem, barcode: e.target.value })}
                    />
                  </div>
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Arıza / Sorun</label>
                  <input
                    type="text"
                    className={styles.formInput}
                    defaultValue={selectedItem.problem}
                    onChange={e => setSelectedItem({ ...selectedItem, problem: e.target.value })}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Ek Not</label>
                  <textarea
                    rows={2}
                    className={styles.formTextarea}
                    defaultValue={selectedItem.notes || ''}
                    onChange={e => setSelectedItem({ ...selectedItem, notes: e.target.value })}
                  />
                </div>
              </div>
              <div className={styles.modalFooter}>
                <button type="button" className={styles.btnSecondaryAction} onClick={() => setShowEditModal(false)}>İptal</button>
                <button type="submit" className={styles.btnPrimaryAction}>Kaydet</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {reportPreviewItem && (
        <div
          className={styles.reportPreviewOverlay}
          role="dialog"
          aria-modal="true"
          aria-label={`Servis Raporu - ${reportPreviewItem.deviceName}`}
        >
          <article className={styles.reportPreview}>
            <header className={styles.reportPreviewHeader}>
              <div>
                <p>İŞİTME MERKEZİ · TEKNİK SERVİS</p>
                <h2>Servis Raporu - {reportPreviewItem.deviceName}</h2>
                <span>Rapor tarihi: {new Date().toLocaleDateString('tr-TR')}</span>
              </div>
              <button
                type="button"
                className={styles.reportCloseButton}
                aria-label="Raporu kapat"
                onClick={() => setReportPreviewItem(null)}
              >
                ✕
              </button>
            </header>
            <table className={styles.reportPreviewTable}>
              <tbody>
                <tr><th>Hasta</th><td>{reportPreviewItem.patientName || '—'}</td></tr>
                <tr><th>Telefon</th><td>{reportPreviewItem.patientPhone || '—'}</td></tr>
                <tr><th>Cihaz</th><td>{reportPreviewItem.deviceName} ({reportPreviewItem.earSide})</td></tr>
                <tr><th>Seri No</th><td>{reportPreviewItem.serialNo || '—'}</td></tr>
                <tr><th>Barkod</th><td>{reportPreviewItem.barcode || '—'}</td></tr>
                <tr><th>Arıza / Sorun</th><td>{reportPreviewItem.problem || '—'}</td></tr>
                <tr><th>Durum</th><td>{reportPreviewItem.status}</td></tr>
                <tr><th>Şube</th><td>{reportPreviewItem.branch || '—'}</td></tr>
                <tr><th>Teslim Alınma</th><td>{reportPreviewItem.receivedDate || '—'}</td></tr>
                <tr><th>Tahmini Teslim</th><td>{reportPreviewItem.estimatedDeliveryDate || '—'}</td></tr>
                <tr><th>Garanti</th><td>{reportPreviewItem.warrantyStatus}</td></tr>
                <tr><th>Teknisyen</th><td>{reportPreviewItem.technician || '—'}</td></tr>
                <tr><th>Notlar</th><td>{reportPreviewItem.notes || '—'}</td></tr>
              </tbody>
            </table>
            <footer className={styles.reportPreviewActions}>
              <button type="button" className={styles.btnSecondaryAction} onClick={() => setReportPreviewItem(null)}>Kapat</button>
              <button type="button" className={styles.btnPrimaryAction} onClick={() => window.print()}>Yazdır / PDF olarak kaydet</button>
            </footer>
          </article>
        </div>
      )}
    </div>
  );
}
