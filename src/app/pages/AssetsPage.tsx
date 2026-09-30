'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { useBranch } from '../context/BranchContext';
import { BranchService } from '../services/BranchService';
import { formatCurrency, formatDate } from '../data/mockData';
import { getNextMaintenanceDate } from '../lib/assetMaintenance';
import { archiveAsset, AssetRecord, fetchAssets, saveAsset } from '../repositories/OperationsRepository';
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
  status: 'Aktif' | 'Bakımda' | 'Onarımda' | 'Hek/Iskarta';
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

const INITIAL_MOCK_ASSETS: DisplayAsset[] = [
  {
    id: 'ast-1',
    name: 'QA Odyometre',
    category: 'Cihaz',
    brandModel: 'Interacoustics AC40',
    branch: 'Test Şube 1',
    serialNo: 'QA-3B-001',
    purchaseDate: '30.08.2023',
    warrantyExpiry: '30.08.2026',
    cost: 250000,
    status: 'Aktif',
    calibrationIntervalMonths: 12,
    lastCalibrationDate: '10.08.2025',
    nextCalibrationDate: '10.08.2026',
    maintenanceStatus: 'Bakım gerekmiyor',
    notes: 'Klinik odyometre cihazı.'
  },
  {
    id: 'ast-2',
    name: 'Otoskop',
    category: 'Cihaz',
    brandModel: 'Heine Mini 3000',
    branch: 'Merkez',
    serialNo: 'HE-4587',
    purchaseDate: '12.04.2024',
    warrantyExpiry: '12.04.2026',
    cost: 12500,
    status: 'Aktif',
    calibrationIntervalMonths: 12,
    lastCalibrationDate: '12.04.2024',
    nextCalibrationDate: '12.04.2025',
    maintenanceStatus: 'Bakım gerekmiyor',
    notes: 'Fiber optik aydınlatmalı tanı otoskopu.'
  },
  {
    id: 'ast-3',
    name: 'Bilgisayar',
    category: 'Bilgisayar',
    brandModel: 'Lenovo ThinkCentre',
    branch: 'Çankaya',
    serialNo: 'LNV-2024-01',
    purchaseDate: '05.01.2024',
    warrantyExpiry: '05.01.2027',
    cost: 28000,
    status: 'Aktif',
    calibrationIntervalMonths: 24,
    lastCalibrationDate: '05.01.2024',
    nextCalibrationDate: '05.01.2026',
    maintenanceStatus: 'Bakım gerekmiyor',
    notes: 'Klinik hasta kayıt ve odyogram arşivleme terminali.'
  },
  {
    id: 'ast-4',
    name: 'Yazıcı',
    category: 'Ofis Ekipmanı',
    brandModel: 'HP LaserJet M404',
    branch: 'Merkez',
    serialNo: 'HP404-9987',
    purchaseDate: '20.03.2023',
    warrantyExpiry: '20.03.2026',
    cost: 9500,
    status: 'Bakımda',
    calibrationIntervalMonths: 12,
    lastCalibrationDate: '20.03.2024',
    nextCalibrationDate: '20.03.2025',
    maintenanceStatus: 'Toner ve tambur bakımı yapılıyor',
    notes: 'Reçete ve fatura döküm yazıcısı.'
  },
  {
    id: 'ast-5',
    name: 'Klinik Koltuğu',
    category: 'Mobilya',
    brandModel: 'Özel Üretim',
    branch: 'Kadıköy',
    serialNo: 'KK-001',
    purchaseDate: '10.11.2022',
    warrantyExpiry: '—',
    cost: 35000,
    status: 'Aktif',
    maintenanceStatus: 'Bakım gerekmiyor',
    notes: 'Hidrolik ayarlı hasta muayene koltuğu.'
  },
  {
    id: 'ast-6',
    name: 'Dry&Store Kurutucu',
    category: 'Cihaz',
    brandModel: 'Cedis Dry&Store',
    branch: 'Merkez',
    serialNo: 'CD-2023-55',
    purchaseDate: '14.06.2023',
    warrantyExpiry: '14.05.2026',
    cost: 18000,
    status: 'Onarımda',
    calibrationIntervalMonths: 12,
    lastCalibrationDate: '14.06.2024',
    nextCalibrationDate: '14.06.2025',
    maintenanceStatus: 'UV lamba değişimi serviste',
    notes: 'Klinik tipi kurutma ve UV dezenfeksiyon cihazı.'
  },
  {
    id: 'ast-7',
    name: 'UV Temizleme Cihazı',
    category: 'Cihaz',
    brandModel: 'Widex UV Clean',
    branch: 'Çankaya',
    serialNo: 'WD-UV-778',
    purchaseDate: '07.02.2024',
    warrantyExpiry: '07.02.2026',
    cost: 6500,
    status: 'Aktif',
    calibrationIntervalMonths: 12,
    lastCalibrationDate: '07.02.2024',
    nextCalibrationDate: '07.02.2025',
    maintenanceStatus: 'Bakım gerekmiyor',
    notes: 'Hızlı ultraviyole prob sterilizasyon kutusu.'
  },
  {
    id: 'ast-8',
    name: 'Ofis Masası',
    category: 'Mobilya',
    brandModel: 'Ikea',
    branch: 'Test Şube 1',
    serialNo: '—',
    purchaseDate: '15.09.2022',
    warrantyExpiry: '—',
    cost: 4000,
    status: 'Aktif',
    maintenanceStatus: 'Bakım gerekmiyor',
    notes: 'Danışma ve sekreterya çalışma masası.'
  }
];

export default function AssetsPage() {
  const { addToast, currentOrgId, branchesList } = useApp();
  const { activeBranch } = useBranch();

  // Asset list state
  const [assetList, setAssetList] = useState<DisplayAsset[]>(currentOrgId ? [] : INITIAL_MOCK_ASSETS);

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
  const [drawerTab, setDrawerTab] = useState<'genel' | 'bakim' | 'dosyalar' | 'gecmis'>('genel');

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
    if (!newAssetForm.branch && branchesList[0]) setNewAssetForm(form => ({ ...form, branch: branchesList[0].name }));
  }, [branchesList, newAssetForm.branch]);

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
              category: r.category === 'Klinik Cihaz' ? 'Cihaz' : r.category === 'Bilgisayar & Çevre' ? 'Bilgisayar' : r.category || 'Cihaz',
              brandModel: r.model || r.name,
              branch: r.branch || '—',
              branchId: r.branchId,
              serialNo: r.serialNo || '—',
              purchaseDate: formatDate(r.purchaseDate || ''),
              warrantyExpiry: r.warrantyExpiry || '—',
              cost: Number(r.cost) || 0,
              status: r.status === 'Arızalı' ? 'Onarımda' : r.status || 'Aktif',
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
    if (!currentOrgId) {
      setAssetList(INITIAL_MOCK_ASSETS);
      return;
    }
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
        const q = searchTerm.toLowerCase();
        const matchName = item.name.toLowerCase().includes(q);
        const matchBrand = item.brandModel.toLowerCase().includes(q);
        const matchSerial = item.serialNo.toLowerCase().includes(q);
        if (!matchName && !matchBrand && !matchSerial) return false;
      }

      return true;
    });
  }, [assetList, activeBranch, categoryPill, selectedCategory, selectedBranch, selectedStatus, searchTerm]);

  useEffect(() => {
    if (!activeItem || !filteredAssets.some(asset => asset.id === activeItem.id)) {
      setActiveItem(filteredAssets[0] ?? null);
      setSelectedIds(filteredAssets[0] ? [filteredAssets[0].id] : []);
    }
  }, [activeItem, filteredAssets]);

  // Metric counts matching the mockup
  const totalAssetsCount = filteredAssets.length;
  const totalAssetsValue = filteredAssets.reduce((sum, asset) => sum + asset.cost, 0);
  const inMaintenanceCount = filteredAssets.filter(asset => asset.status === 'Bakımda' || asset.status === 'Onarımda').length;
  const calibrationWarningCount = filteredAssets.filter(asset => asset.nextCalibrationDate && new Date(asset.nextCalibrationDate.split('.').reverse().join('-')) <= new Date()).length;

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
    return (
      <span className={`${styles.statusDotBadge} ${styles.statusRepair}`}>
        <span className={`${styles.statusDot} ${styles.dotRed}`} />
        Onarımda
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
    if (!newAssetForm.name.trim()) {
      addToast({ type: 'warning', message: 'Lütfen demirbaş adını girin.' });
      return;
    }

    const branchRecord = branchesList.find(branch => branch.name === newAssetForm.branch);
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
      catch (error) { addToast({ type: 'error', message: error instanceof Error ? error.message : 'Demirbaş kaydedilemedi.' }); return; }
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
      warrantyExpiry: formatDate(savedRecord.warrantyExpiry),
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
    if (currentOrgId) {
      try { await archiveAsset(id); }
      catch (error) { addToast({ type: 'error', message: error instanceof Error ? error.message : 'Demirbaş arşivlenemedi.' }); return; }
    }
    setAssetList(prev => prev.filter(x => x.id !== id));
    if (activeItem?.id === id) setActiveItem(null);
    setSelectedIds(prev => prev.filter(x => x !== id));
    setActiveActionMenuId(null);
    addToast({ type: 'success', message: 'Demirbaş kaydı arşivlendi.' });
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
            <div className={styles.statTrend}>
              <span className={styles.trendGreen}>↗ %9</span>
              <span className={styles.statSubtext}>geçen aya göre</span>
            </div>
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
            <div className={styles.statTrend}>
              <span className={styles.trendGreen}>↘ %12</span>
              <span className={styles.statSubtext}>geçen aya göre</span>
            </div>
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
            <div className={styles.statTrend}>
              <span className={styles.trendRed}>↗ %50</span>
              <span className={styles.statSubtext}>cihaz</span>
            </div>
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
          {branchesList.map(b => (
            <option key={b.id} value={b.name}>{b.name}</option>
          ))}
          {branchesList.length === 0 && !currentOrgId && (
            <>
              <option value="Test Şube 1">Test Şube 1</option>
              <option value="Merkez">Merkez</option>
              <option value="Çankaya">Çankaya</option>
              <option value="Kadıköy">Kadıköy</option>
            </>
          )}
        </select>

        <select
          className={styles.filterSelect}
          value={selectedStatus}
          onChange={e => setSelectedStatus(e.target.value)}
        >
          <option value="Tüm Durumlar">Tüm Durumlar</option>
          <option value="Aktif">Aktif</option>
          <option value="Bakımda">Bakımda</option>
          <option value="Onarımda">Onarımda</option>
        </select>

        <select
          className={styles.filterSelect}
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
                  filteredAssets.map(item => {
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
                                      setActiveActionMenuId(null);
                                      setShowMaintenanceModal(true);
                                    }}
                                  >
                                    🔧 Bakım Kaydı Ekle
                                  </button>
                                  <button
                                    className={styles.dropdownItem}
                                    onClick={() => {
                                      setActiveActionMenuId(null);
                                      setShowCalibrationModal(true);
                                    }}
                                  >
                                    🎯 Kalibrasyon Kaydı
                                  </button>
                                  <button
                                    className={styles.dropdownItem}
                                    onClick={() => {
                                      setActiveActionMenuId(null);
                                      setShowTransferModal(true);
                                    }}
                                  >
                                    ⇄ Şube Transferi
                                  </button>
                                  <hr style={{ margin: '4px 0', border: 'none', borderTop: '1px solid #e2e8f0' }} />
                                  <button
                                    className={`${styles.dropdownItem} ${styles.dropdownItemDanger}`}
                                    onClick={() => handleDeleteAsset(item.id)}
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
              <div className={styles.pagination}>
                <button className={styles.pageBtn}>‹</button>
                <button className={`${styles.pageBtn} ${styles.pageBtnActive}`}>1</button>
                <button className={styles.pageBtn}>2</button>
                <button className={styles.pageBtn}>3</button>
                <button className={styles.pageBtn}>4</button>
                <button className={styles.pageBtn}>5</button>
                <button className={styles.pageBtn}>›</button>
                <button className={styles.pageBtn}>»</button>
              </div>

              <select className={styles.filterSelect} style={{ height: 32, minWidth: 90, padding: '0 8px' }}>
                <option>10 / sayfa</option>
                <option>25 / sayfa</option>
                <option>50 / sayfa</option>
              </select>
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

              {drawerTab === 'bakim' && (
                <div style={{ display: 'grid', gap: 10, fontSize: 13 }}>
                  <div style={{ padding: 12, background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                    <div style={{ fontWeight: 650, color: '#0f172a' }}>Yıllık Kalibrasyon ve Akustik Test</div>
                    <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>Tarih: 10.08.2025 · Yapan: Meditest Kalibrasyon Lab</div>
                    <div style={{ fontSize: 11.5, color: '#08785b', fontWeight: 600, marginTop: 4 }}>✓ Sertifika No: CAL-2025-8841 (Geçerli)</div>
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
                    { name: 'Kullanım Kılavuzu.pdf', size: '3.4 MB', date: '30.08.2023' },
                    { name: 'Fatura ve Garanti Belgesi.pdf', size: '820 KB', date: '30.08.2023' },
                    { name: 'Kalibrasyon Sertifikası 2025.pdf', size: '1.1 MB', date: '10.08.2025' }
                  ].map((f, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                      <div>
                        <div style={{ fontWeight: 600, color: '#0f172a' }}>{f.name}</div>
                        <div style={{ fontSize: 11, color: '#64748b' }}>{f.size} · {f.date}</div>
                      </div>
                      <button
                        className={styles.btnEditLink}
                        onClick={() => addToast({ type: 'success', message: `${f.name} indiriliyor...` })}
                      >
                        İndir
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {drawerTab === 'gecmis' && (
                <div style={{ display: 'grid', gap: 8, fontSize: 12 }}>
                  {[
                    { text: 'Demirbaş envantere eklendi.', date: '30.08.2023 11:20', user: 'Ahmet Yılmaz' },
                    { text: 'Periyodik kalibrasyon tamamlandı.', date: '10.08.2025 15:40', user: 'Servis Teknisyeni' },
                    { text: 'Odyometri kabini yanına konumlandırıldı.', date: '15.08.2025 09:10', user: 'Ahmet Yılmaz' }
                  ].map((log, idx) => (
                    <div key={idx} style={{ padding: 10, background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                      <div style={{ color: '#0f172a', fontWeight: 600 }}>{log.text}</div>
                      <div style={{ color: '#64748b', fontSize: 11, marginTop: 2 }}>{log.date} · {log.user}</div>
                    </div>
                  ))}
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
                      value={newAssetForm.branch}
                      onChange={e => setNewAssetForm({ ...newAssetForm, branch: e.target.value })}
                    >
                      <option value="">Şube seçin</option>
                      {branchesList.map(branch => <option key={branch.id} value={branch.name}>{branch.name}</option>)}
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
                    catch (error) { addToast({ type: 'error', message: error instanceof Error ? error.message : 'Demirbaş güncellenemedi.' }); return; }
                  }
                  const updated: DisplayAsset = { ...activeItem, branchId: saved.branchId, purchaseDate: formatDate(saved.purchaseDate), warrantyExpiry: formatDate(saved.warrantyExpiry), lastCalibrationDate: formatDate(saved.lastMaintenance), nextCalibrationDate: getNextMaintenanceDate(saved.lastMaintenance, saved.maintenanceIntervalMonths)?.toLocaleDateString('tr-TR') || '—' };
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
              <div style={{ padding: 12, background: '#fef3c7', borderRadius: 10, border: '1px solid #fde68a', color: '#b45309', fontSize: 13 }}>
                <strong>Yaklaşan 2 Kalibrasyon:</strong> Odyometre ve Otoskop için periyodik kalibrasyon süreleri yaklaşıyor.
              </div>
              {[
                { name: 'QA Odyometre', date: '10.08.2026', status: 'Planlandı', lab: 'Meditest Lab' },
                { name: 'Otoskop Heine', date: '12.04.2025', status: 'Süresi Yakın', lab: 'Teknik Servis' },
                { name: 'UV Temizleme Cihazı', date: '07.02.2025', status: 'Tamamlandı', lab: 'Klinik İçi' }
              ].map((s, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                  <div>
                    <div style={{ fontWeight: 650, color: '#0f172a' }}>{s.name}</div>
                    <div style={{ fontSize: 11.5, color: '#64748b' }}>Hedef Tarih: {s.date} · {s.lab}</div>
                  </div>
                  <span style={{ fontSize: 11.5, fontWeight: 600, color: s.status === 'Süresi Yakın' ? '#dc2626' : '#08785b', background: s.status === 'Süresi Yakın' ? '#fee2e2' : '#e6f7f0', padding: '3px 8px', borderRadius: 6 }}>
                    {s.status}
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
                <input type="date" defaultValue={new Date().toISOString().split('T')[0]} className={styles.filterSelect} style={{ width: '100%' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#334155', marginBottom: 4 }}>Yetkili Kuruluş / Servis</label>
                <input placeholder="Örn: Meditest Akustik Kalibrasyon Laboratuvarı" className={styles.filterSelect} style={{ width: '100%' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#334155', marginBottom: 4 }}>Sertifika / Rapor No</label>
                <input placeholder="CAL-2025-XXXX" className={styles.filterSelect} style={{ width: '100%' }} />
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, padding: '16px 20px', borderTop: '1px solid #e2e8f0', background: '#f8fafc' }}>
              <button className={styles.btnClear} onClick={() => { setShowMaintenanceModal(false); setShowCalibrationModal(false); }}>Vazgeç</button>
              <button
                className={styles.btnNewAsset}
                onClick={() => {
                  setShowMaintenanceModal(false);
                  setShowCalibrationModal(false);
                  addToast({ type: 'success', message: `${activeItem.name} için işlem başarıyla kaydedildi.` });
                }}
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
                <select className={styles.filterSelect} style={{ width: '100%' }}>
                  <option value="Çankaya">Çankaya</option>
                  <option value="Kadıköy">Kadıköy</option>
                  <option value="Merkez">Merkez</option>
                  <option value="Test Şube 1">Test Şube 1</option>
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
                  addToast({ type: 'success', message: `${activeItem.name} transfer fişi oluşturuldu.` });
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
                onClick={() => addToast({ type: 'success', message: 'Demirbaş raporu indiriliyor...' })}
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
