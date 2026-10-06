'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { useBranch } from '../context/BranchContext';
import { BranchService } from '../services/BranchService';
import { formatCurrency, formatDate } from '../data/mockData';
import { getNextMaintenanceDate } from '../lib/assetMaintenance';
import { normalizeAssetCategory, normalizeAssetStatus } from '../lib/assetFilters';
import { matchesInventoryIdentifier } from '../lib/inventorySearch';
import { archiveAsset, AssetMaintenanceRecord, AssetRecord, createAssetMaintenance, fetchAssetMaintenance, fetchAssets, saveAsset } from '../repositories/OperationsRepository';
import styles from './AssetsPage.module.css';

interface DisplayAsset {
  id: string;
  name: string;
  category: 'Cihaz' | 'Mobilya' | 'Bilgisayar' | 'Ofis Ekipmanı' | 'Diğer';
  brandModel: string;
  branch: string;
  branchId?: string;
  serialNo: string;
  purchaseDate: string;
  warrantyExpiry: string;
  cost: number;
  status: string;
  calibrationIntervalMonths?: number;
  lastCalibrationDate?: string;
  nextCalibrationDate?: string;
  maintenanceStatus?: string;
  notes?: string;
}

const toIsoDate = (value: string) => {
  if (!value || value === '—') return '';
  if (/^\d{4}-\d{2}-\d{2}/.test(value)) return value.slice(0, 10);
  const tr = value.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})/);
  return tr ? `${tr[3]}-${tr[2].padStart(2, '0')}-${tr[1].padStart(2, '0')}` : '';
};

export default function AssetsPage() {
  const { addToast, currentOrgId, branchesList } = useApp();
  const { activeBranch } = useBranch();
  const activeBranches = useMemo(() => branchesList.filter(branch => branch.status === 'Aktif' || (branch.status as string) === 'active'), [branchesList]);

  // Asset list state
  const [assetList, setAssetList] = useState<DisplayAsset[]>([]);

  // Category pill filter
  const [categoryPill, setCategoryPill] = useState('Tümü');

  // Filter bar states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('Tüm Şubeler');
  const [selectedStatus, setSelectedStatus] = useState('Tüm Durumlar');
  const [selectedCategory, setSelectedCategory] = useState('Tüm Kategoriler');

  // Table selection & active detail item
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [activeItem, setActiveItem] = useState<DisplayAsset | null>(null);
  const [maintenanceHistory, setMaintenanceHistory] = useState<AssetMaintenanceRecord[]>([]);
  const [maintenanceForm, setMaintenanceForm] = useState({ date: new Date().toISOString().slice(0, 10), provider: '', reportNumber: '', notes: '' });
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [drawerTab, setDrawerTab] = useState<'genel' | 'garanti' | 'bakim' | 'dosyalar' | 'gecmis'>('genel');

  // Action menu dropdown
  const [activeActionMenuId, setActiveActionMenuId] = useState<string | null>(null);

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showMaintenanceModal, setShowMaintenanceModal] = useState(false);
  const [showCalibrationModal, setShowCalibrationModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);

  // Form states for new item
  const [newAssetForm, setNewAssetForm] = useState({
    name: '',
    category: 'Cihaz' as DisplayAsset['category'],
    brandModel: '',
    branch: '',
    serialNo: '',
    purchaseDate: new Date().toISOString().split('T')[0],
    warrantyExpiry: '',
    cost: 15000,
    status: 'Aktif' as DisplayAsset['status'],
    notes: ''
  });

  useEffect(() => {
    if (activeBranches.some(branch => branch.name === newAssetForm.branch)) return;
    const singleBranchId = activeBranch.mode === 'single' ? activeBranch.branchId : '';
    const preferred = activeBranches.find(branch => branch.id === singleBranchId) || (activeBranches.length === 1 ? activeBranches[0] : undefined);
    setNewAssetForm(form => ({ ...form, branch: preferred?.name || '' }));
  }, [activeBranches, activeBranch, newAssetForm.branch]);

  // Sync Supabase operations repository if configured
  useEffect(() => {
    let cancelled = false;
    if (currentOrgId) {
      fetchAssets()
        .then(rows => {
          if (!cancelled) {
            const mapped: DisplayAsset[] = rows.map((r: any) => ({
              id: r.id,
              name: r.name,
              category: normalizeAssetCategory(r.category),
              brandModel: r.model || r.name,
              branch: r.branch || '—',
              branchId: r.branchId,
              serialNo: r.serialNo || '—',
              purchaseDate: formatDate(r.purchaseDate || ''),
              warrantyExpiry: formatDate(r.warrantyExpiry || '') || 'Bilgi girilmemiş',
              cost: Number(r.cost) || 0,
              status: normalizeAssetStatus(r.status),
              calibrationIntervalMonths: r.maintenanceIntervalMonths || 12,
              lastCalibrationDate: formatDate(r.lastMaintenance || ''),
              nextCalibrationDate: getNextMaintenanceDate(r.lastMaintenance, r.maintenanceIntervalMonths)?.toLocaleDateString('tr-TR') || '—',
              maintenanceStatus: getNextMaintenanceDate(r.lastMaintenance, r.maintenanceIntervalMonths) && getNextMaintenanceDate(r.lastMaintenance, r.maintenanceIntervalMonths)! < new Date() ? 'Bakım zamanı geçti' : r.lastMaintenance ? 'Bakım takvimde' : 'Son bakım kaydı yok',
              notes: r.notes || ''
            }));
            setAssetList(mapped);
            setSelectedIds([]);
            setActiveItem(null);
          }
        })
        .catch(() => {
          if (!cancelled) setAssetList([]);
        });
    }
    return () => {
      cancelled = true;
    };
  }, [currentOrgId]);

  useEffect(() => {
    setAssetList([]);
    setSelectedIds([]);
    setActiveItem(null);
  }, [currentOrgId]);

  // Filtered Assets list
  const filteredAssets = useMemo(() => {
    return assetList.filter(item => {
      // Branch scope check
      if (!BranchService.matchesBranch(item.branch, item.branchId, activeBranch)) {
        return false;
      }

      // Pill filter
      if (categoryPill !== 'Tümü' && item.category !== categoryPill) {
        return false;
      }

      // Dropdown category
      if (selectedCategory !== 'Tüm Kategoriler' && item.category !== selectedCategory) {
        return false;
      }

      // Dropdown branch
      if (selectedBranch !== 'Tüm Şubeler' && item.branch !== selectedBranch) {
        return false;
      }

      // Dropdown status
      if (selectedStatus !== 'Tüm Durumlar' && item.status !== selectedStatus) {
        return false;
      }

      // Search term
      if (searchTerm.trim()) {
        const q = searchTerm.trim().toLocaleLowerCase('tr-TR');
        const matchName = item.name.toLocaleLowerCase('tr-TR').includes(q);
        const matchBrand = item.brandModel.toLocaleLowerCase('tr-TR').includes(q);
        const matchSerial = matchesInventoryIdentifier(item.serialNo, q);
        if (!matchName && !matchBrand && !matchSerial) return false;
      }

      return true;
    });
  }, [assetList, activeBranch, categoryPill, selectedCategory, selectedBranch, selectedStatus, searchTerm]);

  const pageCount = Math.max(1, Math.ceil(filteredAssets.length / pageSize));
  const pagedAssets = filteredAssets.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  useEffect(() => setCurrentPage(1), [categoryPill, selectedCategory, selectedBranch, selectedStatus, searchTerm, pageSize]);
  useEffect(() => setCurrentPage(page => Math.min(page, pageCount)), [pageCount]);

  useEffect(() => {
    if (activeItem && !filteredAssets.some(asset => asset.id === activeItem.id)) setActiveItem(null);
  }, [activeItem, filteredAssets]);

  useEffect(() => {
    let cancelled = false;
    if (!currentOrgId || !activeItem?.id || drawerTab !== 'gecmis') {
      setMaintenanceHistory([]);
      return;
    }
    void fetchAssetMaintenance(activeItem.id)
      .then(rows => { if (!cancelled) setMaintenanceHistory(rows); })
      .catch(error => {
        if (!cancelled) {
          setMaintenanceHistory([]);
          addToast({ type: 'error', message: error instanceof Error ? error.message : 'Demirbaş işlem geçmişi yüklenemedi.' });
        }
      });
    return () => { cancelled = true; };
  }, [currentOrgId, activeItem?.id, drawerTab, addToast]);

  // Metric counts matching the mockup
  const totalAssetsCount = filteredAssets.length;
  const totalAssetsValue = filteredAssets.reduce((sum, asset) => sum + asset.cost, 0);
  const inMaintenanceCount = filteredAssets.filter(asset => asset.status === 'Bakımda' || asset.status === 'Onarımda').length;
  const calibrationWarningCount = filteredAssets.filter(asset => asset.nextCalibrationDate && new Date(asset.nextCalibrationDate.split('.').reverse().join('-')) <= new Date()).length;
  const calibrationScheduleItems = assetList.filter(asset => {
    const parts = asset.nextCalibrationDate?.split('.');
    if (!parts || parts.length !== 3) return false;
    const dueDate = new Date(`${parts[2]}-${parts[1]}-${parts[0]}T23:59:59`);
    return !Number.isNaN(dueDate.getTime()) && dueDate.getTime() - Date.now() <= 90 * 24 * 60 * 60 * 1000;
  });

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(filteredAssets.map(i => i.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleToggleSelect = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleRowClick = (item: DisplayAsset) => {
    setActiveItem(item);
    if (!selectedIds.includes(item.id)) {
      setSelectedIds([item.id]);
    }
  };

  // Status dot badge helper
  const renderStatusBadge = (status: DisplayAsset['status']) => {
    if (status === 'Aktif') {
      return (
        <span className={`${styles.statusDotBadge} ${styles.statusActive}`}>
          <span className={`${styles.statusDot} ${styles.dotGreen}`} />
          Aktif
        </span>
      );
    }
    if (status === 'Bakımda') {
      return (
        <span className={`${styles.statusDotBadge} ${styles.statusMaintenance}`}>
          <span className={`${styles.statusDot} ${styles.dotOrange}`} />
          Bakımda
        </span>
      );
    }
    if (status === 'Onarımda') return (
      <span className={`${styles.statusDotBadge} ${styles.statusRepair}`}>
        <span className={`${styles.statusDot} ${styles.dotRed}`} />
        Onarımda
      </span>
    );
    return (
      <span className={`${styles.statusDotBadge} ${styles.statusOther}`}>
        <span className={`${styles.statusDot} ${styles.dotOther}`} />
        {status}
      </span>
    );
  };

  // Category badge helper
  const renderCategoryBadge = (category: DisplayAsset['category']) => {
    if (category === 'Cihaz') return <span className={`${styles.badgeCategory} ${styles.badgeCategoryCihaz}`}>Cihaz</span>;
    if (category === 'Bilgisayar') return <span className={`${styles.badgeCategory} ${styles.badgeCategoryBilgisayar}`}>Bilgisayar</span>;
    if (category === 'Ofis Ekipmanı') return <span className={`${styles.badgeCategory} ${styles.badgeCategoryOfis}`}>Ofis Ekipmanı</span>;
    if (category === 'Mobilya') return <span className={`${styles.badgeCategory} ${styles.badgeCategoryMobilya}`}>Mobilya</span>;
    return <span className={`${styles.badgeCategory} ${styles.badgeCategoryDiger}`}>Diğer</span>;
  };

  // Device icon helper
  const renderDeviceIcon = (category: DisplayAsset['category']) => {
    if (category === 'Cihaz') {
      return (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0284c7" strokeWidth="1.8">
          <rect x="2" y="3" width="20" height="14" rx="2" />
          <line x1="8" y1="21" x2="16" y2="21" />
          <line x1="12" y1="17" x2="12" y2="21" />
        </svg>
      );
    }
    if (category === 'Bilgisayar') {
      return (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0369a1" strokeWidth="1.8">
          <rect x="2" y="3" width="20" height="14" rx="2" />
          <line x1="8" y1="21" x2="16" y2="21" />
          <line x1="12" y1="17" x2="12" y2="21" />
        </svg>
      );
    }
    if (category === 'Ofis Ekipmanı') {
      return (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ea580c" strokeWidth="1.8">
          <polyline points="6 9 6 2 18 2 18 9" />
          <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
          <rect x="6" y="14" width="12" height="8" />
        </svg>
      );
    }
    return (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#7e22ce" strokeWidth="1.8">
        <path d="M6 9a6 6 0 0 1 12 0c0 4-3 6-3 9H9c0-3-3-5-3-9z" />
        <path d="M9 18h6" />
        <path d="M10 21h4" />
      </svg>
    );
  };

  // Submit new asset
  const handleAddNewAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentOrgId) { addToast({ type: 'error', message: 'Aktif firma bağlantısı yok; demirbaş kaydedilmedi.' }); return; }
    if (!newAssetForm.name.trim()) {
      addToast({ type: 'warning', message: 'Lütfen demirbaş adını girin.' });
      return;
    }

    const branchRecord = activeBranches.find(branch => branch.name === newAssetForm.branch);
    if (currentOrgId && !branchRecord) {
      addToast({ type: 'error', message: 'Demirbaş için geçerli bir şube seçin.' });
      return;
    }
    const assetId = crypto.randomUUID();
    const record: AssetRecord = {
      id: assetId,
      name: newAssetForm.name.trim(),
      category: newAssetForm.category === 'Cihaz' ? 'Klinik Cihaz' : newAssetForm.category === 'Bilgisayar' ? 'Bilgisayar & Çevre' : newAssetForm.category,
      serialNo: newAssetForm.serialNo.trim(),
      branch: newAssetForm.branch,
      branchId: branchRecord?.id,
      purchaseDate: newAssetForm.purchaseDate,
      cost: Number(newAssetForm.cost) || 0,
      warrantyExpiry: newAssetForm.warrantyExpiry,
      lastMaintenance: '',
      maintenanceIntervalMonths: 12,
      status: newAssetForm.status,
      notes: newAssetForm.notes,
    };
    let savedRecord = record;
    if (currentOrgId) {
      try { savedRecord = await saveAsset(record); }
      catch { addToast({ type: 'error', message: 'Demirbaş kaydedilemedi. Lütfen tekrar deneyin.' }); return; }
    }
    const newAsset: DisplayAsset = {
      id: savedRecord.id,
      name: newAssetForm.name,
      category: newAssetForm.category,
      brandModel: newAssetForm.brandModel || newAssetForm.name,
      branch: savedRecord.branch || newAssetForm.branch,
      branchId: savedRecord.branchId,
      serialNo: newAssetForm.serialNo || '—',
      purchaseDate: formatDate(savedRecord.purchaseDate),
      warrantyExpiry: formatDate(savedRecord.warrantyExpiry) || 'Bilgi girilmemiş',
      cost: savedRecord.cost,
      status: savedRecord.status as DisplayAsset['status'],
      calibrationIntervalMonths: savedRecord.maintenanceIntervalMonths,
      lastCalibrationDate: formatDate(savedRecord.lastMaintenance),
      nextCalibrationDate: getNextMaintenanceDate(savedRecord.lastMaintenance, savedRecord.maintenanceIntervalMonths)?.toLocaleDateString('tr-TR') || '—',
      maintenanceStatus: savedRecord.lastMaintenance ? 'Bakım takvimde' : 'Son bakım kaydı yok',
      notes: newAssetForm.notes
    };

    setAssetList(prev => [newAsset, ...prev]);
    setActiveItem(newAsset);
    setSelectedIds([newAsset.id]);
    setShowAddModal(false);
    addToast({ type: 'success', message: `${newAsset.name} demirbaş kaydı kaydedildi.` });
  };

  const handleDeleteAsset = async (id: string) => {
    if (!currentOrgId) { addToast({ type: 'error', message: 'Aktif firma bağlantısı yok; demirbaş arşivlenmedi.' }); return; }
    if (currentOrgId) {
      try { await archiveAsset(id); }
      catch { addToast({ type: 'error', message: 'Demirbaş arşivlenemedi. Lütfen tekrar deneyin.' }); return; }
    }
    setAssetList(prev => prev.filter(x => x.id !== id));
    if (activeItem?.id === id) setActiveItem(null);
    setSelectedIds(prev => prev.filter(x => x !== id));
    setActiveActionMenuId(null);
    addToast({ type: 'success', message: 'Demirbaş kaydı arşivlendi.' });
  };

  const handleSaveMaintenance = async () => {
    if (!activeItem?.branchId) {
      addToast({ type: 'error', message: 'Demirbaşın kayıtlı aktif şubesi bulunamadı.' });
      return;
    }
    const recordType: AssetMaintenanceRecord['recordType'] = showCalibrationModal ? 'Kalibrasyon' : 'Bakım';
    try {
      const record = await createAssetMaintenance({
        assetId: activeItem.id,
        branchId: activeItem.branchId,
        recordType,
        maintenanceDate: maintenanceForm.date,
        provider: maintenanceForm.provider,
        reportNumber: maintenanceForm.reportNumber,
        notes: maintenanceForm.notes,
      });
      setMaintenanceHistory(previous => [record, ...previous]);
      if (recordType !== 'Kalibrasyon') {
        const updatedItem = { ...activeItem, lastCalibrationDate: formatDate(record.maintenanceDate), maintenanceStatus: 'Bakım kaydı var' };
        setActiveItem(updatedItem);
        setAssetList(previous => previous.map(item => item.id === updatedItem.id ? updatedItem : item));
      }
      setDrawerTab('gecmis');
      setShowMaintenanceModal(false);
      setShowCalibrationModal(false);
      setMaintenanceForm({ date: new Date().toISOString().slice(0, 10), provider: '', reportNumber: '', notes: '' });
      addToast({ type: 'success', message: `${recordType} kaydı demirbaş geçmişine eklendi.` });
    } catch (error) {
      addToast({ type: 'error', message: error instanceof Error ? error.message : 'Demirbaş işlem kaydı kaydedilemedi.' });
    }
  };

  return (
    <div className={styles.assetsPage}>
      {/* ── Breadcrumb ── */}
      <div className={styles.breadcrumb}>
        Demirbaşlar <span>›</span> Demirbaş & Klinik Cihaz Yönetimi
      </div>

      {/* ── Page Heading ── */}
      <div className={styles.pageHeading}>
        <div className={styles.headingCopy}>
          <div className={styles.headingIcon}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
              <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
              <line x1="12" y1="22.08" x2="12" y2="12" />
            </svg>
          </div>
          <div>
            <h1>Demirbaş & Klinik Cihaz Yönetimi</h1>
            <p>Klinik ekipmanları, kalibrasyon periyotları, garanti takibi ve şube demirbaş envanteri.</p>
          </div>
        </div>

        <div className={styles.headerActions}>
          <button
            className={styles.btnNewAsset}
            onClick={() => setShowAddModal(true)}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Yeni Demirbaş Ekle
          </button>
        </div>
      </div>

      {/* ── 4 Stat Metric Cards ── */}
      <div className={styles.statsGrid}>
        {/* Card 1: Toplam Demirbaş */}
        <div className={styles.statCard} onClick={() => setCategoryPill('Tümü')}>
          <div className={`${styles.statIcon} ${styles.iconGreen}`}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
            </svg>
          </div>
          <div>
            <span>Toplam Demirbaş</span>
            <strong>{totalAssetsCount}</strong>
          </div>
        </div>

        {/* Card 2: Envanter Toplam Değeri */}
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.iconBlue}`}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="2" y="6" width="20" height="12" rx="2" />
              <circle cx="12" cy="12" r="2" />
              <path d="M6 12h.01M18 12h.01" />
            </svg>
          </div>
          <div>
            <span>Envanter Toplam Değeri</span>
            <strong>{formatCurrency(totalAssetsValue)}</strong>
          </div>
        </div>

        {/* Card 3: Bakım / Onarımda */}
        <div className={styles.statCard} onClick={() => setSelectedStatus('Bakımda')}>
          <div className={`${styles.statIcon} ${styles.iconRed}`}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
            </svg>
          </div>
          <div>
            <span>Bakım / Onarımda</span>
            <strong>{inMaintenanceCount}</strong>
          </div>
        </div>

        {/* Card 4: Kalibrasyon Uyarısı */}
        <div className={styles.statCard} onClick={() => setShowScheduleModal(true)}>
          <div className={`${styles.statIcon} ${styles.iconRed}`}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          </div>
          <div>
            <span>Kalibrasyon Uyarısı</span>
            <strong>{calibrationWarningCount}</strong>
            <div className={styles.statTrend}>
              <span style={{ color: '#d97706', fontSize: 11 }}>♦ yaklaşan kalibrasyon</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Category Pill Tabs Row + Action Buttons ── */}
      <div className={styles.categoryTabsRow}>
        <div className={styles.categoryPills}>
          {['Tümü', 'Cihaz', 'Mobilya', 'Bilgisayar', 'Ofis Ekipmanı', 'Diğer'].map(cat => (
            <button
              key={cat}
              className={`${styles.categoryPill} ${categoryPill === cat ? styles.categoryPillActive : ''}`}
              onClick={() => setCategoryPill(cat)}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className={styles.categoryRightBtns}>
          <button
            className={styles.btnCategoryAction}
            onClick={() => setShowScheduleModal(true)}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            Bakım Takvimi
          </button>

          <button
            className={styles.btnCategoryAction}
            onClick={() => addToast({ type: 'info', message: 'Seçili demirbaşlar için toplu zimmet veya kalibrasyon işlemi seçin.' })}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="2" y="4" width="20" height="16" rx="2" />
              <path d="M7 15h10M7 9h10" />
            </svg>
            Toplu İşlemler
          </button>

          <button
            className={styles.btnCategoryAction}
            onClick={() => setShowReportModal(true)}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="20" x2="18" y2="10" />
              <line x1="12" y1="20" x2="12" y2="4" />
              <line x1="6" y1="20" x2="6" y2="14" />
            </svg>
            Raporla
          </button>
        </div>
      </div>

      {/* ── Filter Bar ── */}
      <div className={styles.filterBar}>
        <div className={styles.searchBox}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            placeholder="Demirbaş adı, seri no, marka ile ara..."
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
          {activeBranches.map(b => (
            <option key={b.id} value={b.name}>{b.name}</option>
          ))}
        </select>

        <select
          className={styles.filterSelect}
          aria-label="Durum filtresi"
          value={selectedStatus}
          onChange={e => setSelectedStatus(e.target.value)}
        >
          <option value="Tüm Durumlar">Tüm Durumlar</option>
          <option value="Aktif">Aktif</option>
          <option value="Bakımda">Bakımda</option>
          <option value="Onarımda">Onarımda</option>
          <option value="Hek/Iskarta">Hek/Iskarta</option>
          <option value="Hurda">Hurda</option>
          <option value="Satıldı">Satıldı</option>
        </select>

        <select
          className={styles.filterSelect}
          aria-label="Kategori filtresi"
          value={selectedCategory}
          onChange={e => setSelectedCategory(e.target.value)}
        >
          <option value="Tüm Kategoriler">Tüm Kategoriler</option>
          <option value="Cihaz">Cihaz</option>
          <option value="Mobilya">Mobilya</option>
          <option value="Bilgisayar">Bilgisayar</option>
          <option value="Ofis Ekipmanı">Ofis Ekipmanı</option>
          <option value="Diğer">Diğer</option>
        </select>

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
            setSelectedCategory('Tüm Kategoriler');
            setCategoryPill('Tümü');
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

      {/* ── Content Layout: Table + Right Detail Drawer ── */}
      <div className={styles.contentLayout}>
        {/* Table Section */}
        <div className={styles.tableSection}>
          <div className={styles.tableWrap}>
            <table className={styles.assetTable}>
              <thead>
                <tr>
                  <th style={{ width: 40, textAlign: 'center' }}>
                    <input
                      type="checkbox"
                      checked={selectedIds.length > 0 && selectedIds.length === filteredAssets.length}
                      onChange={e => handleSelectAll(e.target.checked)}
                    />
                  </th>
                  <th>DEMİRBAŞ / CİHAZ</th>
                  <th>KATEGORİ</th>
                  <th>ŞUBE</th>
                  <th>SERİ NO</th>
                  <th>SATIN ALMA</th>
                  <th>GARANTİ BİTİŞİ</th>
                  <th>DURUM</th>
                  <th>DEĞER</th>
                  <th style={{ textAlign: 'center' }}>İŞLEMLER</th>
                </tr>
              </thead>
              <tbody>
                {filteredAssets.length === 0 ? (
                  <tr>
                    <td colSpan={10} style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                      Aranan kriterlere uygun demirbaş kaydı bulunamadı.
                    </td>
                  </tr>
                ) : (
                  pagedAssets.map(item => {
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
                        <td>
                          <div className={styles.deviceCell}>
                            <div className={styles.deviceThumb}>
                              {renderDeviceIcon(item.category)}
                            </div>
                            <div className={styles.deviceMeta}>
                              <span className={styles.deviceName}>{item.name}</span>
                              <span className={styles.deviceModelSub}>{item.brandModel}</span>
                            </div>
                          </div>
                        </td>
                        <td>{renderCategoryBadge(item.category)}</td>
                        <td>{item.branch}</td>
                        <td style={{ fontFamily: 'monospace', fontSize: 12.5, color: '#334155' }}>{item.serialNo}</td>
                        <td>{item.purchaseDate}</td>
                        <td>{item.warrantyExpiry}</td>
                        <td>{renderStatusBadge(item.status)}</td>
                        <td style={{ fontWeight: 700, color: '#0f172a' }}>{formatCurrency(item.cost)}</td>
                        <td style={{ textAlign: 'center' }} onClick={e => e.stopPropagation()}>
                          <div className={styles.actionBtns} style={{ justifyContent: 'center', position: 'relative' }}>
                            {/* Eye button */}
                            <button
                              className={styles.btnActionIcon}
                              title="Detay Görüntüle"
                              onClick={() => setActiveItem(item)}
                            >
                              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                <circle cx="12" cy="12" r="3" />
                              </svg>
                            </button>

                            {/* Pencil button */}
                            <button
                              className={styles.btnActionIcon}
                              title="Düzenle"
                              onClick={() => {
                                setActiveItem(item);
                                setShowEditModal(true);
                              }}
                            >
                              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M12 20h9" />
                                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                              </svg>
                            </button>

                            {/* Three dots menu */}
                            <div style={{ position: 'relative' }}>
                              <button
                                className={styles.btnActionIcon}
                                title="İşlemler"
                                aria-expanded={activeActionMenuId === item.id}
                                onClick={event => { event.stopPropagation(); setActiveActionMenuId(activeActionMenuId === item.id ? null : item.id); }}
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
                                    onClick={event => {
                                      event.stopPropagation();
                                      setActiveActionMenuId(null);
                                      setActiveItem(item);
                                      setShowMaintenanceModal(true);
                                    }}
                                  >
                                    🔧 Bakım Kaydı Ekle
                                  </button>
                                  <button
                                    className={styles.dropdownItem}
                                    onClick={event => {
                                      event.stopPropagation();
                                      setActiveActionMenuId(null);
                                      setActiveItem(item);
                                      setShowCalibrationModal(true);
                                    }}
                                  >
                                    🎯 Kalibrasyon Kaydı
                                  </button>
                                  <button
                                    className={styles.dropdownItem}
                                    onClick={event => {
                                      event.stopPropagation();
                                      setActiveActionMenuId(null);
                                      setShowTransferModal(true);
                                    }}
                                  >
                                    ⇄ Şube Transferi
                                  </button>
                                  <hr style={{ margin: '4px 0', border: 'none', borderTop: '1px solid #e2e8f0' }} />
                                  <button
                                    className={`${styles.dropdownItem} ${styles.dropdownItemDanger}`}
                                    onClick={event => { event.stopPropagation(); handleDeleteAsset(item.id); }}
                                  >
                                    🗑 Demirbaşı Sil
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
              Toplam {totalAssetsCount} kayıt | {selectedIds.length} kayıt seçili
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {filteredAssets.length > 0 && <>
                <div className={styles.pagination}>
                  <button type="button" className={styles.pageBtn} disabled={currentPage <= 1} onClick={() => setCurrentPage(page => Math.max(1, page - 1))} aria-label="Önceki sayfa">‹</button>
                  {Array.from({ length: pageCount }, (_, index) => index + 1).map(page => <button type="button" key={page} className={`${styles.pageBtn} ${currentPage === page ? styles.pageBtnActive : ''}`} aria-current={currentPage === page ? 'page' : undefined} onClick={() => setCurrentPage(page)}>{page}</button>)}
                  <button type="button" className={styles.pageBtn} disabled={currentPage >= pageCount} onClick={() => setCurrentPage(page => Math.min(pageCount, page + 1))} aria-label="Sonraki sayfa">›</button>
                </div>
                <select aria-label="Sayfa başına demirbaş" className={styles.filterSelect} style={{ height: 32, minWidth: 90, padding: '0 8px' }} value={pageSize} onChange={event => setPageSize(Number(event.target.value))}>
                  <option value={10}>10 / sayfa</option>
                  <option value={25}>25 / sayfa</option>
                  <option value={50}>50 / sayfa</option>
                </select>
              </>}
            </div>
          </div>
        </div>

        {/* Right Detail Drawer */}
        {activeItem && (
          <div className={styles.detailDrawer}>
            {/* Header */}
            <div className={styles.drawerHeader}>
              <div className={styles.drawerHeaderLeft}>
                <div className={styles.drawerThumb}>
                  {renderDeviceIcon(activeItem.category)}
                </div>
                <div>
                  <div className={styles.drawerDeviceName}>{activeItem.name}</div>
                  <div className={styles.drawerDeviceModel}>{activeItem.brandModel}</div>
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

            {/* Sub-tabs */}
            <div className={styles.drawerTabs}>
              <button
                className={`${styles.drawerTabBtn} ${drawerTab === 'genel' ? styles.drawerTabBtnActive : ''}`}
                onClick={() => setDrawerTab('genel')}
              >
                Genel
              </button>
              <button
                className={`${styles.drawerTabBtn} ${drawerTab === 'garanti' ? styles.drawerTabBtnActive : ''}`}
                onClick={() => setDrawerTab('garanti')}
              >
                Garanti
              </button>
              <button
                className={`${styles.drawerTabBtn} ${drawerTab === 'bakim' ? styles.drawerTabBtnActive : ''}`}
                onClick={() => setDrawerTab('bakim')}
              >
                Bakım
              </button>
              <button
                className={`${styles.drawerTabBtn} ${drawerTab === 'dosyalar' ? styles.drawerTabBtnActive : ''}`}
                onClick={() => setDrawerTab('dosyalar')}
              >
                Dosyalar
              </button>
              <button
                className={`${styles.drawerTabBtn} ${drawerTab === 'gecmis' ? styles.drawerTabBtnActive : ''}`}
                onClick={() => setDrawerTab('gecmis')}
              >
                İşlem Geçmişi
              </button>
            </div>

            {/* Body */}
            <div className={styles.drawerBody}>
              {drawerTab === 'genel' && (
                <>
                  {/* Demirbaş Bilgileri Section */}
                  <div className={styles.drawerSection}>
                    <div className={styles.sectionHeader}>
                      <span className={styles.sectionTitle}>Demirbaş Bilgileri</span>
                      <button
                        className={styles.btnEditLink}
                        onClick={() => setShowEditModal(true)}
                      >
                        Düzenle
                      </button>
                    </div>

                    <div className={styles.infoGrid}>
                      <div className={styles.infoRow}>
                        <span>Kategori</span>
                        <strong>{activeItem.category}</strong>
                      </div>
                      <div className={styles.infoRow}>
                        <span>Marka / Model</span>
                        <strong>{activeItem.brandModel}</strong>
                      </div>
                      <div className={styles.infoRow}>
                        <span>Seri No</span>
                        <strong style={{ fontFamily: 'monospace' }}>{activeItem.serialNo}</strong>
                      </div>
                      <div className={styles.infoRow}>
                        <span>Şube</span>
                        <strong>{activeItem.branch}</strong>
                      </div>
                      <div className={styles.infoRow}>
                        <span>Satın Alma Tarihi</span>
                        <strong>{activeItem.purchaseDate}</strong>
                      </div>
                      <div className={styles.infoRow}>
                        <span>Garanti Bitişi</span>
                        <strong>{activeItem.warrantyExpiry}</strong>
                      </div>
                      <div className={styles.infoRow}>
                        <span>Değer</span>
                        <strong style={{ color: '#08785b' }}>{formatCurrency(activeItem.cost)}</strong>
                      </div>
                      <div style={{ marginTop: 4 }}>
                        <span style={{ display: 'block', fontSize: 11.5, color: '#64748b', marginBottom: 2 }}>Açıklama</span>
                        <div style={{ fontSize: 12, color: '#1e293b', background: '#f8fafc', padding: '8px 10px', borderRadius: 6, border: '1px solid #e2e8f0' }}>
                          {activeItem.notes || `${activeItem.name} cihazı klinik kullanımındadır.`}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Bakım & Kalibrasyon Section */}
                  <div className={styles.drawerSection}>
                    <span className={styles.sectionTitle}>Bakım & Kalibrasyon</span>
                    <div className={styles.maintenanceBox}>
                      <div className={styles.maintenanceRow}>
                        <span>Kalibrasyon Periyodu</span>
                        <strong>{activeItem.calibrationIntervalMonths || 12} Ay</strong>
                      </div>
                      <div className={styles.maintenanceRow}>
                        <span>Son Kalibrasyon</span>
                        <strong>{activeItem.lastCalibrationDate || '—'}</strong>
                      </div>
                      <div className={styles.maintenanceRow}>
                        <span>Sonraki Kalibrasyon</span>
                        <strong style={{ color: activeItem.nextCalibrationDate && activeItem.nextCalibrationDate !== '—' ? '#dc2626' : '#64748b' }}>{activeItem.nextCalibrationDate || '—'}</strong>
                      </div>
                      <div className={styles.maintenanceRow}>
                        <span>Bakım Durumu</span>
                        <span style={{ color: '#08785b', fontWeight: 650, background: '#e6f7f0', padding: '2px 8px', borderRadius: 6, fontSize: 11.5 }}>
                          {activeItem.maintenanceStatus || 'Bakım gerekmiyor'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Hızlı İşlemler Section */}
                  <div className={styles.drawerSection}>
                    <span className={styles.sectionTitle}>Hızlı İşlemler</span>
                    <div className={styles.quickActionsGrid}>
                      <button
                        className={styles.quickActionBtn}
                        onClick={() => setShowMaintenanceModal(true)}
                      >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
                        </svg>
                        Bakım Kaydı
                      </button>

                      <button
                        className={styles.quickActionBtn}
                        onClick={() => setShowCalibrationModal(true)}
                      >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="12" cy="12" r="10" />
                          <circle cx="12" cy="12" r="6" />
                          <circle cx="12" cy="12" r="2" />
                        </svg>
                        Kalibrasyon Kaydı
                      </button>

                      <button
                        className={styles.quickActionBtn}
                        onClick={() => addToast({ type: 'info', message: 'Fatura, garanti belgesi veya kalibrasyon raporu seçin.' })}
                      >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
                        </svg>
                        Dosya Ekle
                      </button>

                      <button
                        className={styles.quickActionBtn}
                        onClick={() => setShowTransferModal(true)}
                      >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M16 3h5v5" />
                          <path d="M4 20L21 3" />
                          <path d="M21 16v5h-5" />
                          <path d="M15 15l6 6" />
                          <path d="M4 4l5 5" />
                        </svg>
                        Transfer Et
                      </button>
                    </div>
                  </div>
                </>
              )}

              {drawerTab === 'garanti' && (
                <div className={styles.drawerSection}>
                  <div className={styles.sectionHeader}>
                    <span className={styles.sectionTitle}>Garanti Bilgileri</span>
                    <button className={styles.btnEditLink} onClick={() => setShowEditModal(true)}>
                      Düzenle
                    </button>
                  </div>
                  {toIsoDate(activeItem.warrantyExpiry) ? (() => {
                    const expiry = toIsoDate(activeItem.warrantyExpiry);
                    const expiryDate = new Date(`${expiry}T23:59:59`);
                    const warrantyTimeRemaining = expiryDate.getTime() - Date.now();
                    const warrantyStatus = warrantyTimeRemaining >= 0 ? 'Kayıtlı bitiş tarihine göre süre devam ediyor' : 'Kayıtlı bitiş tarihine göre süre sona ermiş';
                    return (
                      <div className={styles.maintenanceBox}>
                        <div className={styles.maintenanceRow}>
                          <span>Garanti Durumu</span>
                          <strong>{warrantyStatus}</strong>
                        </div>
                        <div className={styles.maintenanceRow}>
                          <span>Kayıtlı Garanti Bitişi</span>
                          <strong>{activeItem.warrantyExpiry}</strong>
                        </div>
                        <p style={{ margin: '8px 0 0', color: '#64748b', fontSize: 12 }}>
                          Sağlayıcı ve sözleşme kapsamı bu kayıtta tutulmuyor; kapsamı garanti belgesinden teyit edin.
                        </p>
                      </div>
                    );
                  })() : (
                    <div className={styles.maintenanceBox}>
                      <div className={styles.maintenanceRow}>
                        <span>Garanti Durumu</span>
                        <strong>Garanti bilgisi girilmemiş</strong>
                      </div>
                      <div className={styles.maintenanceRow}>
                        <span>Garanti Bitişi</span>
                        <strong>Bilgi yok</strong>
                      </div>
                      <p style={{ margin: '8px 0 0', color: '#64748b', fontSize: 12 }}>
                        Bu demirbaş için garanti tarihi kayıtlı değil. Gerçek bilgiyi eklemek için Düzenle'yi kullanın.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {drawerTab === 'bakim' && (
                <div style={{ display: 'grid', gap: 10, fontSize: 13 }}>
                  <div style={{ padding: 12, background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                    <div style={{ color: '#64748b' }}>Bu demirbaş için kayıtlı bakım/kalibrasyon bilgisi bulunmuyor.</div>
                  </div>
                  <button
                    className={styles.btnFilter}
                    style={{ justifyContent: 'center' }}
                    onClick={() => setShowCalibrationModal(true)}
                  >
                    + Yeni Kalibrasyon Belgesi Gir
                  </button>
                </div>
              )}

              {drawerTab === 'dosyalar' && (
                <div style={{ display: 'grid', gap: 8, fontSize: 12.5 }}>
                  {[
                    ...([] as { name: string; size: string; date: string }[])
                  ].map((f, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                      <div>
                        <div style={{ fontWeight: 600, color: '#0f172a' }}>{f.name}</div>
                        <div style={{ fontSize: 11, color: '#64748b' }}>{f.size} · {f.date}</div>
                      </div>
                      <button
                        className={styles.btnEditLink}
                        onClick={() => addToast({ type: 'error', message: 'Bu dosya için saklanan bir ek bulunmuyor; indirme başlatılmadı.' })}
                      >
                        İndir
                      </button>
                    </div>
                  ))}
                  <div style={{ padding: 12, color: '#64748b' }}>Ekli dosya bulunmuyor.</div>
                </div>
              )}

              {drawerTab === 'gecmis' && (
                <div style={{ display: 'grid', gap: 8, fontSize: 12 }}>
                  {maintenanceHistory.map(record => (
                    <div key={record.id} style={{ padding: 10, background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                      <div style={{ color: '#0f172a', fontWeight: 600 }}>{record.recordType}{record.provider ? ` · ${record.provider}` : ''}</div>
                      <div style={{ color: '#64748b', fontSize: 11, marginTop: 2 }}>{formatDate(record.maintenanceDate)}{record.reportNumber ? ` · Rapor: ${record.reportNumber}` : ''}</div>
                      {record.notes && <div style={{ color: '#334155', marginTop: 5 }}>{record.notes}</div>}
                    </div>
                  ))}
                  {maintenanceHistory.length === 0 && <div style={{ padding: 12, color: '#64748b' }}>Kayıtlı bakım, onarım veya kalibrasyon geçmişi bulunmuyor.</div>}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── MODAL: Yeni Demirbaş Ekle ── */}
      {showAddModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.55)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'grid', placeItems: 'center', padding: 20 }}>
          <div style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 580, overflow: 'hidden', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid #e2e8f0' }}>
              <h3 style={{ margin: 0, fontSize: 17, color: '#0f172a' }}>Yeni Demirbaş / Klinik Cihaz Ekle</h3>
              <button style={{ border: 'none', background: 'transparent', fontSize: 20, cursor: 'pointer', color: '#94a3b8' }} onClick={() => setShowAddModal(false)}>✕</button>
            </div>

            <form onSubmit={handleAddNewAsset}>
              <div style={{ padding: 20, display: 'grid', gap: 12, maxHeight: '75vh', overflowY: 'auto' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#334155', marginBottom: 4 }}>Demirbaş / Cihaz Adı *</label>
                    <input
                      className={styles.filterSelect}
                      style={{ width: '100%' }}
                      required
                      placeholder="Örn: QA Odyometre"
                      value={newAssetForm.name}
                      onChange={e => setNewAssetForm({ ...newAssetForm, name: e.target.value })}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#334155', marginBottom: 4 }}>Kategori</label>
                    <select
                      className={styles.filterSelect}
                      style={{ width: '100%' }}
                      value={newAssetForm.category}
                      onChange={e => setNewAssetForm({ ...newAssetForm, category: e.target.value as any })}
                    >
                      <option value="Cihaz">Cihaz</option>
                      <option value="Mobilya">Mobilya</option>
                      <option value="Bilgisayar">Bilgisayar</option>
                      <option value="Ofis Ekipmanı">Ofis Ekipmanı</option>
                      <option value="Diğer">Diğer</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#334155', marginBottom: 4 }}>Marka / Model</label>
                    <input
                      className={styles.filterSelect}
                      style={{ width: '100%' }}
                      placeholder="Örn: Interacoustics AC40"
                      value={newAssetForm.brandModel}
                      onChange={e => setNewAssetForm({ ...newAssetForm, brandModel: e.target.value })}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#334155', marginBottom: 4 }}>Seri Numarası</label>
                    <input
                      className={styles.filterSelect}
                      style={{ width: '100%' }}
                      placeholder="QA-3B-001"
                      value={newAssetForm.serialNo}
                      onChange={e => setNewAssetForm({ ...newAssetForm, serialNo: e.target.value })}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#334155', marginBottom: 4 }}>Şube</label>
                    <select
                      className={styles.filterSelect}
                      style={{ width: '100%' }}
                      aria-label="Şube"
                      value={newAssetForm.branch}
                      onChange={e => setNewAssetForm({ ...newAssetForm, branch: e.target.value })}
                    >
                      <option value="">Şube seçin</option>
                      {activeBranches.map(branch => <option key={branch.id} value={branch.name}>{branch.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#334155', marginBottom: 4 }}>Maliyet / Değer (₺)</label>
                    <input
                      type="number"
                      className={styles.filterSelect}
                      style={{ width: '100%' }}
                      value={newAssetForm.cost}
                      onChange={e => setNewAssetForm({ ...newAssetForm, cost: Number(e.target.value) })}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#334155', marginBottom: 4 }}>Durum</label>
                    <select
                      className={styles.filterSelect}
                      style={{ width: '100%' }}
                      value={newAssetForm.status}
                      onChange={e => setNewAssetForm({ ...newAssetForm, status: e.target.value as any })}
                    >
                      <option value="Aktif">Aktif</option>
                      <option value="Bakımda">Bakımda</option>
                      <option value="Onarımda">Onarımda</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#334155', marginBottom: 4 }}>Satın Alma Tarihi</label>
                    <input
                      type="date"
                      className={styles.filterSelect}
                      style={{ width: '100%' }}
                      value={newAssetForm.purchaseDate}
                      onChange={e => setNewAssetForm({ ...newAssetForm, purchaseDate: e.target.value })}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#334155', marginBottom: 4 }}>Garanti Bitiş Tarihi</label>
                    <input
                      type="date"
                      className={styles.filterSelect}
                      style={{ width: '100%' }}
                      value={newAssetForm.warrantyExpiry}
                      onChange={e => setNewAssetForm({ ...newAssetForm, warrantyExpiry: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#334155', marginBottom: 4 }}>Notlar / Açıklama</label>
                  <textarea
                    rows={2}
                    className={styles.filterSelect}
                    style={{ width: '100%', height: 'auto', padding: '8px 12px' }}
                    placeholder="Ekipmanla ilgili ek açıklama veya kalibrasyon notları..."
                    value={newAssetForm.notes}
                    onChange={e => setNewAssetForm({ ...newAssetForm, notes: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, padding: '16px 20px', borderTop: '1px solid #e2e8f0', background: '#f8fafc' }}>
                <button type="button" className={styles.btnClear} onClick={() => setShowAddModal(false)}>Vazgeç</button>
                <button type="submit" className={styles.btnNewAsset}>Demirbaşı Kaydet</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: Düzenle ── */}
      {showEditModal && activeItem && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.55)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'grid', placeItems: 'center', padding: 20 }}>
          <div style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 540, overflow: 'hidden', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid #e2e8f0' }}>
              <h3 style={{ margin: 0, fontSize: 17, color: '#0f172a' }}>Demirbaş Bilgilerini Düzenle</h3>
              <button style={{ border: 'none', background: 'transparent', fontSize: 20, cursor: 'pointer', color: '#94a3b8' }} onClick={() => setShowEditModal(false)}>✕</button>
            </div>
            <div style={{ padding: 20, display: 'grid', gap: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#334155', marginBottom: 4 }}>Demirbaş Adı</label>
                <input
                  className={styles.filterSelect}
                  style={{ width: '100%' }}
                  value={activeItem.name}
                  onChange={e => setActiveItem({ ...activeItem, name: e.target.value })}
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#334155', marginBottom: 4 }}>Değer (₺)</label>
                  <input
                    type="number"
                    className={styles.filterSelect}
                    style={{ width: '100%' }}
                    value={activeItem.cost}
                    onChange={e => setActiveItem({ ...activeItem, cost: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#334155', marginBottom: 4 }}>Durum</label>
                  <select
                    className={styles.filterSelect}
                    style={{ width: '100%' }}
                    value={activeItem.status}
                    onChange={e => setActiveItem({ ...activeItem, status: e.target.value as any })}
                  >
                    <option value="Aktif">Aktif</option>
                    <option value="Bakımda">Bakımda</option>
                    <option value="Onarımda">Onarımda</option>
                  </select>
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#334155', marginBottom: 4 }}>Açıklama</label>
                <textarea
                  rows={2}
                  className={styles.filterSelect}
                  style={{ width: '100%', height: 'auto', padding: '8px 12px' }}
                  value={activeItem.notes || ''}
                  onChange={e => setActiveItem({ ...activeItem, notes: e.target.value })}
                />
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, padding: '16px 20px', borderTop: '1px solid #e2e8f0', background: '#f8fafc' }}>
              <button className={styles.btnClear} onClick={() => setShowEditModal(false)}>Vazgeç</button>
              <button
                className={styles.btnNewAsset}
                onClick={async () => {
                  if (!currentOrgId) { addToast({ type: 'error', message: 'Aktif firma bağlantısı yok; demirbaş güncellenmedi.' }); return; }
                  const branch = branchesList.find(item => item.name === activeItem.branch);
                  if (currentOrgId && !branch) { addToast({ type: 'error', message: 'Geçerli bir şube seçin.' }); return; }
                  const record: AssetRecord = {
                    id: activeItem.id, name: activeItem.name, category: activeItem.category === 'Cihaz' ? 'Klinik Cihaz' : activeItem.category === 'Bilgisayar' ? 'Bilgisayar & Çevre' : activeItem.category,
                    serialNo: activeItem.serialNo === '—' ? '' : activeItem.serialNo, branch: activeItem.branch, branchId: branch?.id,
                    purchaseDate: toIsoDate(activeItem.purchaseDate), cost: activeItem.cost, warrantyExpiry: toIsoDate(activeItem.warrantyExpiry),
                    lastMaintenance: toIsoDate(activeItem.lastCalibrationDate || ''), maintenanceIntervalMonths: activeItem.calibrationIntervalMonths || 12,
                    status: activeItem.status, notes: activeItem.notes,
                  };
                  let saved = record;
                  if (currentOrgId) {
                    try { saved = await saveAsset(record); }
                    catch { addToast({ type: 'error', message: 'Demirbaş güncellenemedi. Lütfen tekrar deneyin.' }); return; }
                  }
                  const updated: DisplayAsset = { ...activeItem, branchId: saved.branchId, purchaseDate: formatDate(saved.purchaseDate), warrantyExpiry: formatDate(saved.warrantyExpiry) || 'Bilgi girilmemiş', lastCalibrationDate: formatDate(saved.lastMaintenance), nextCalibrationDate: getNextMaintenanceDate(saved.lastMaintenance, saved.maintenanceIntervalMonths)?.toLocaleDateString('tr-TR') || '—' };
                  setAssetList(prev => prev.map(item => item.id === updated.id ? updated : item));
                  setActiveItem(updated);
                  setShowEditModal(false);
                  addToast({ type: 'success', message: 'Demirbaş bilgileri kaydedildi.' });
                }}
              >
                Kaydet
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: Bakım Takvimi ── */}
      {showScheduleModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.55)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'grid', placeItems: 'center', padding: 20 }}>
          <div style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 560, overflow: 'hidden', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid #e2e8f0' }}>
              <h3 style={{ margin: 0, fontSize: 17, color: '#0f172a' }}>Klinik Bakım & Kalibrasyon Takvimi</h3>
              <button style={{ border: 'none', background: 'transparent', fontSize: 20, cursor: 'pointer', color: '#94a3b8' }} onClick={() => setShowScheduleModal(false)}>✕</button>
            </div>
            <div style={{ padding: 20, display: 'grid', gap: 10 }}>
              {calibrationScheduleItems.length === 0 && <div style={{ padding: 12, color: '#64748b' }}>Önümüzdeki 90 gün içinde bakım tarihi olan kayıtlı demirbaş yok.</div>}
              {calibrationScheduleItems.map((s) => (
                <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                  <div>
                    <div style={{ fontWeight: 650, color: '#0f172a' }}>{s.name}</div>
                    <div style={{ fontSize: 11.5, color: '#64748b' }}>Hedef Tarih: {s.nextCalibrationDate}</div>
                  </div>
                  <span style={{ fontSize: 11.5, fontWeight: 600, color: s.maintenanceStatus === 'Bakım zamanı geçti' ? '#dc2626' : '#08785b', background: s.maintenanceStatus === 'Bakım zamanı geçti' ? '#fee2e2' : '#e6f7f0', padding: '3px 8px', borderRadius: 6 }}>
                    {s.maintenanceStatus}
                  </span>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '16px 20px', borderTop: '1px solid #e2e8f0', background: '#f8fafc' }}>
              <button className={styles.btnNewAsset} onClick={() => setShowScheduleModal(false)}>Kapat</button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: Bakım / Kalibrasyon Kaydı ── */}
      {(showMaintenanceModal || showCalibrationModal) && activeItem && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.55)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'grid', placeItems: 'center', padding: 20 }}>
          <div style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 500, overflow: 'hidden', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid #e2e8f0' }}>
              <h3 style={{ margin: 0, fontSize: 17, color: '#0f172a' }}>
                {showCalibrationModal ? 'Yeni Kalibrasyon Kaydı Gir' : 'Yeni Bakım Kaydı Gir'}
              </h3>
              <button style={{ border: 'none', background: 'transparent', fontSize: 20, cursor: 'pointer', color: '#94a3b8' }} onClick={() => { setShowMaintenanceModal(false); setShowCalibrationModal(false); }}>✕</button>
            </div>
            <div style={{ padding: 20, display: 'grid', gap: 12 }}>
              <div style={{ padding: 12, background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                <div style={{ fontWeight: 650 }}>{activeItem.name} ({activeItem.serialNo})</div>
                <div style={{ fontSize: 12, color: '#64748b' }}>Şube: {activeItem.branch}</div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#334155', marginBottom: 4 }}>İşlem Tarihi</label>
                <input type="date" value={maintenanceForm.date} onChange={event => setMaintenanceForm(form => ({ ...form, date: event.target.value }))} className={styles.filterSelect} style={{ width: '100%' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#334155', marginBottom: 4 }}>Yetkili Kuruluş / Servis</label>
                <input placeholder="Servis / yetkili kuruluş" value={maintenanceForm.provider} onChange={event => setMaintenanceForm(form => ({ ...form, provider: event.target.value }))} className={styles.filterSelect} style={{ width: '100%' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#334155', marginBottom: 4 }}>Sertifika / Rapor No</label>
                <input placeholder="Sertifika / rapor numarası" value={maintenanceForm.reportNumber} onChange={event => setMaintenanceForm(form => ({ ...form, reportNumber: event.target.value }))} className={styles.filterSelect} style={{ width: '100%' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#334155', marginBottom: 4 }}>Not</label>
                <textarea value={maintenanceForm.notes} onChange={event => setMaintenanceForm(form => ({ ...form, notes: event.target.value }))} className={styles.filterSelect} style={{ width: '100%', minHeight: 72 }} />
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, padding: '16px 20px', borderTop: '1px solid #e2e8f0', background: '#f8fafc' }}>
              <button className={styles.btnClear} onClick={() => { setShowMaintenanceModal(false); setShowCalibrationModal(false); }}>Vazgeç</button>
              <button
                className={styles.btnNewAsset}
                onClick={() => void handleSaveMaintenance()}
              >
                Kaydet
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: Transfer Et ── */}
      {showTransferModal && activeItem && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.55)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'grid', placeItems: 'center', padding: 20 }}>
          <div style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 480, overflow: 'hidden', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid #e2e8f0' }}>
              <h3 style={{ margin: 0, fontSize: 17, color: '#0f172a' }}>Şubeler Arası Demirbaş Transferi</h3>
              <button style={{ border: 'none', background: 'transparent', fontSize: 20, cursor: 'pointer', color: '#94a3b8' }} onClick={() => setShowTransferModal(false)}>✕</button>
            </div>
            <div style={{ padding: 20, display: 'grid', gap: 12 }}>
              <div style={{ padding: 12, background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                <div style={{ fontWeight: 650 }}>{activeItem.name}</div>
                <div style={{ fontSize: 12, color: '#64748b' }}>Mevcut Şube: <strong>{activeItem.branch}</strong></div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#334155', marginBottom: 4 }}>Hedef Şube</label>
                <select className={styles.filterSelect} style={{ width: '100%' }} defaultValue="">
                  <option value="" disabled>Şube seçin</option>
                  {activeBranches.filter(branch => branch.name !== activeItem.branch).map(branch => <option key={branch.id} value={branch.id}>{branch.name}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#334155', marginBottom: 4 }}>Transfer Notu / Teslim Alan</label>
                <input placeholder="Teslim alan personel veya oda bilgisi..." className={styles.filterSelect} style={{ width: '100%' }} />
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, padding: '16px 20px', borderTop: '1px solid #e2e8f0', background: '#f8fafc' }}>
              <button className={styles.btnClear} onClick={() => setShowTransferModal(false)}>Vazgeç</button>
              <button
                className={styles.btnNewAsset}
                onClick={() => {
                  setShowTransferModal(false);
                  addToast({ type: 'error', message: 'Demirbaş transfer hareket tablosu bağlı değil; transfer kaydedilmedi.' });
                }}
              >
                Transferi Onayla
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: Rapor ── */}
      {showReportModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.55)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'grid', placeItems: 'center', padding: 20 }}>
          <div style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 520, overflow: 'hidden', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid #e2e8f0' }}>
              <h3 style={{ margin: 0, fontSize: 17, color: '#0f172a' }}>Demirbaş Envanter ve Amortisman Raporu</h3>
              <button style={{ border: 'none', background: 'transparent', fontSize: 20, cursor: 'pointer', color: '#94a3b8' }} onClick={() => setShowReportModal(false)}>✕</button>
            </div>
            <div style={{ padding: 20, display: 'grid', gap: 12 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                <div style={{ padding: 12, background: '#f8fafc', borderRadius: 8, textAlign: 'center' }}>
                  <div style={{ fontSize: 12, color: '#64748b' }}>Kayıtlı Demirbaş</div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: '#0f172a', marginTop: 4 }}>{totalAssetsCount} Adet</div>
                </div>
                <div style={{ padding: 12, background: '#f8fafc', borderRadius: 8, textAlign: 'center' }}>
                  <div style={{ fontSize: 12, color: '#64748b' }}>Toplam Değer</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: '#08785b', marginTop: 4 }}>{formatCurrency(totalAssetsValue)}</div>
                </div>
                <div style={{ padding: 12, background: '#f8fafc', borderRadius: 8, textAlign: 'center' }}>
                  <div style={{ fontSize: 12, color: '#64748b' }}>Faal Cihaz Oranı</div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: '#2563eb', marginTop: 4 }}>{totalAssetsCount ? `%${((filteredAssets.filter(asset => asset.status === 'Aktif').length / totalAssetsCount) * 100).toFixed(1)}` : '—'}</div>
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, padding: '16px 20px', borderTop: '1px solid #e2e8f0', background: '#f8fafc' }}>
              <button
                className={styles.btnClear}
                onClick={() => addToast({ type: 'error', message: 'Rapor dışa aktarma henüz bağlı değil; dosya oluşturulmadı.' })}
              >
                📥 PDF Olarak İndir
              </button>
              <button className={styles.btnNewAsset} onClick={() => setShowReportModal(false)}>Kapat</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
