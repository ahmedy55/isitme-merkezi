'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { useBranch } from '../context/BranchContext';
import { BranchService } from '../services/BranchService';
import { formatCurrency, type StockItem, type Patient } from '../data/mockData';
import { useDebounce } from '../hooks/useDebounce';
import { dbFetchStockMovements } from '../lib/database';
import styles from './StockPage.module.css';

interface DisplayStockItem extends StockItem {
  branchStockBreakdown?: { [branchName: string]: number };
  description?: string;
  thumbnail?: string;
}

const DEFAULT_MOCK_ITEMS: DisplayStockItem[] = [
  {
    id: 'stk-1',
    name: 'Oticon More 1',
    category: 'Cihaz',
    brand: 'Oticon',
    model: 'More 1',
    serialNo: '1234567890',
    barcode: 'OT-001',
    quantity: 2,
    criticalLevel: 1,
    price: 12500,
    purchasePrice: 9000,
    sgkPrice: 6200,
    warrantyExpiry: '2028-09-15',
    location: 'A-Rafı, Kutu 1',
    status: 'Stokta',
    utsStatus: 'Bildirildi',
    branch: 'Merkez',
    description: 'RITE, şarjlı, BT özellikli işitme cihazı.',
    branchStockBreakdown: { 'Merkez': 1, 'Çankaya': 1, 'Kadıköy': 0 }
  },
  {
    id: 'stk-2',
    name: 'Phonak Audéo L',
    category: 'Cihaz',
    brand: 'Phonak',
    model: 'Audéo L',
    serialNo: '9876543210',
    barcode: 'PH-002',
    quantity: 1,
    criticalLevel: 1,
    price: 13750,
    purchasePrice: 9800,
    sgkPrice: 6200,
    warrantyExpiry: '2028-08-20',
    location: 'A-Rafı, Kutu 2',
    status: 'Stokta',
    utsStatus: 'Bildirildi',
    branch: 'Merkez',
    description: 'RIC tipi, Bluetooth özellikli şarjlı işitme cihazı.',
    branchStockBreakdown: { 'Merkez': 1, 'Çankaya': 0, 'Kadıköy': 0 }
  },
  {
    id: 'stk-3',
    name: 'Widex Moment',
    category: 'Cihaz',
    brand: 'Widex',
    model: 'Moment',
    serialNo: '4567891234',
    barcode: 'WD-003',
    quantity: 0,
    criticalLevel: 1,
    price: 11900,
    purchasePrice: 8500,
    sgkPrice: 6200,
    warrantyExpiry: '2028-06-10',
    location: 'B-Rafı, Kutu 1',
    status: 'Satıldı',
    utsStatus: 'Bekliyor',
    branch: 'Çankaya',
    description: 'Doğal ses deneyimi sunan PureSound teknolojisi.',
    branchStockBreakdown: { 'Merkez': 0, 'Çankaya': 0, 'Kadıköy': 0 }
  },
  {
    id: 'stk-4',
    name: 'Signia Pure 312',
    category: 'Cihaz',
    brand: 'Signia',
    model: 'Pure 312',
    serialNo: '3216549870',
    barcode: 'SG-004',
    quantity: 3,
    criticalLevel: 1,
    price: 12800,
    purchasePrice: 9100,
    sgkPrice: 6200,
    warrantyExpiry: '2028-07-05',
    location: 'A-Rafı, Kutu 3',
    status: 'Stokta',
    utsStatus: 'Bildirildi',
    branch: 'Merkez',
    description: 'Kompakt RIC tipi, 312 pilli işitme cihazı.',
    branchStockBreakdown: { 'Merkez': 2, 'Çankaya': 1, 'Kadıköy': 0 }
  },
  {
    id: 'stk-5',
    name: '312 Numara Pil',
    category: 'Pil',
    brand: 'Rayovac',
    model: 'Extra 312',
    serialNo: '—',
    barcode: 'RV-312',
    quantity: 45,
    criticalLevel: 10,
    price: 250,
    purchasePrice: 140,
    sgkPrice: 0,
    warrantyExpiry: '2027-12-31',
    location: 'Çekmece 1',
    status: 'Stokta',
    utsStatus: 'Gerekli Değil',
    branch: 'Merkez',
    description: 'Uzun ömürlü çinko-hava 312 numara işitme cihazı pili (6\'lı paket).',
    branchStockBreakdown: { 'Merkez': 25, 'Çankaya': 15, 'Kadıköy': 5 }
  },
  {
    id: 'stk-6',
    name: '13 Numara Pil',
    category: 'Pil',
    brand: 'Duracell',
    model: 'Hearing Aid 13',
    serialNo: '—',
    barcode: 'DC-013',
    quantity: 8,
    criticalLevel: 10,
    price: 250,
    purchasePrice: 145,
    sgkPrice: 0,
    warrantyExpiry: '2027-11-30',
    location: 'Çekmece 1',
    status: 'Stokta',
    utsStatus: 'Gerekli Değil',
    branch: 'Çankaya',
    description: '13 numara turuncu renk kodlu işitme cihazı pili (6\'lı paket).',
    branchStockBreakdown: { 'Merkez': 4, 'Çankaya': 3, 'Kadıköy': 1 }
  },
  {
    id: 'stk-7',
    name: 'Kulak Kalıbı - Akrilik',
    category: 'Kalıp',
    brand: 'Kişiye Özel',
    model: 'Akrilik',
    serialNo: 'KK-2025-001',
    barcode: '—',
    quantity: 4,
    criticalLevel: 2,
    price: 1200,
    purchasePrice: 600,
    sgkPrice: 0,
    warrantyExpiry: '2026-09-01',
    location: 'Laboratuvar',
    status: 'Stokta',
    utsStatus: 'Gerekli Değil',
    branch: 'Merkez',
    description: 'BTE cihazlar için kişiye özel sert akrilik kulak kalıbı.',
    branchStockBreakdown: { 'Merkez': 2, 'Çankaya': 2, 'Kadıköy': 0 }
  },
  {
    id: 'stk-8',
    name: 'Oticon Temizlik Kiti',
    category: 'Aksesuar',
    brand: 'Oticon',
    model: 'Care Kit',
    serialNo: '—',
    barcode: 'OT-AKS-01',
    quantity: 10,
    criticalLevel: 3,
    price: 450,
    purchasePrice: 220,
    sgkPrice: 0,
    warrantyExpiry: '2028-01-01',
    location: 'Aksesuar Dolabı',
    status: 'Stokta',
    utsStatus: 'Gerekli Değil',
    branch: 'Merkez',
    description: 'Filtre, fırça ve nem alıcı tablet içeren kapsamlı bakım seti.',
    branchStockBreakdown: { 'Merkez': 6, 'Çankaya': 4, 'Kadıköy': 0 }
  },
  {
    id: 'stk-9',
    name: 'Dry&Store Kurutucu',
    category: 'Aksesuar',
    brand: 'Cedis',
    model: 'Dry&Store',
    serialNo: '—',
    barcode: 'CD-DS-01',
    quantity: 2,
    criticalLevel: 3,
    price: 2900,
    purchasePrice: 1800,
    sgkPrice: 0,
    warrantyExpiry: '2027-05-15',
    location: 'Aksesuar Dolabı',
    status: 'Stokta',
    utsStatus: 'Gerekli Değil',
    branch: 'Merkez',
    description: 'UV-C ışınlı elektrikli işitme cihazı kurutma ve dezenfeksiyon kutusu.',
    branchStockBreakdown: { 'Merkez': 1, 'Çankaya': 1, 'Kadıköy': 0 }
  },
  {
    id: 'stk-10',
    name: 'Widex Temizlik Fırçası',
    category: 'Aksesuar',
    brand: 'Widex',
    model: 'Cleaning Brush',
    serialNo: '—',
    barcode: 'WD-CB-01',
    quantity: 0,
    criticalLevel: 5,
    price: 120,
    purchasePrice: 45,
    sgkPrice: 0,
    warrantyExpiry: '2028-01-01',
    location: 'Aksesuar Dolabı',
    status: 'Satıldı',
    utsStatus: 'Gerekli Değil',
    branch: 'Çankaya',
    description: 'Manyetik uçlu, havalandırma kanalı temizleme misinası olan fırça.',
    branchStockBreakdown: { 'Merkez': 0, 'Çankaya': 0, 'Kadıköy': 0 }
  }
];

export default function StockPage() {
  const { stockList, addStockItem, updateStockItem, deleteStockItem, adjustStockItem, addToast, branchesList, currentOrgId, currentUser } = useApp();
  const { activeBranch } = useBranch();
  const addToastRef = useRef(addToast);
  useEffect(() => { addToastRef.current = addToast; }, [addToast]);
  const [stockMovements, setStockMovements] = useState<Array<{id: string; type: string; quantityChange: number; createdAt: string; notes?: string; branchName?: string}>>([]);

  // Envanter yalnızca aktif firmadan yüklenen kayıtları kullanır.
  const allStockItems = useMemo(() => {
    if (stockList && stockList.length > 0) {
      return stockList.map(item => ({
        ...item,
        branchStockBreakdown: { [item.branch]: item.quantity },
        description: item.brand && item.model ? `${item.brand} ${item.model} ${item.category}` : item.name
      }));
    }
    return [];
  }, [stockList]);

  // Pill tab filter (Tümü, Cihaz, Pil, Kalıp, Aksesuar)
  const [categoryPill, setCategoryPill] = useState('Tümü');

  // Filter bar states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('Tüm Şubeler');
  const [selectedCategory, setSelectedCategory] = useState('Tüm Kategoriler');
  const [selectedStatus, setSelectedStatus] = useState('Tüm Durumlar');
  const [currentTablePage, setCurrentTablePage] = useState(1);
  const [tablePageSize, setTablePageSize] = useState(10);

  // Table selection and drawer active item
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [activeItem, setActiveItem] = useState<DisplayStockItem | null>(null);
  const [drawerTab, setDrawerTab] = useState<'genel' | 'stok' | 'uts' | 'hareketler' | 'iliskili'>('genel');

  useEffect(() => {
    let cancelled = false;
    if (!currentOrgId || !activeItem?.id || drawerTab !== 'hareketler') { setStockMovements([]); return; }
    dbFetchStockMovements(activeItem.id)
      .then(rows => { if (!cancelled) setStockMovements(rows as typeof stockMovements); })
      .catch(error => { if (!cancelled) { setStockMovements([]); addToastRef.current({ type: 'error', message: error instanceof Error ? error.message : 'Stok hareketleri yüklenemedi.' }); } });
    return () => { cancelled = true; };
  }, [currentOrgId, activeItem?.id, drawerTab]);

  // Action Menu dropdown state
  const [activeActionMenuId, setActiveActionMenuId] = useState<string | null>(null);

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showQuickSaleModal, setShowQuickSaleModal] = useState(false);
  const [showUtsModal, setShowUtsModal] = useState(false);
  const [showAdjustmentModal, setShowAdjustmentModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);

  // Adjustment Form
  const [adjustmentQty, setAdjustmentQty] = useState(1);
  const [adjustmentType, setAdjustmentType] = useState<'artir' | 'azalt'>('artir');
  const [adjustmentReason, setAdjustmentReason] = useState('Sayım Düzeltmesi');

  // New Item Form
  const [newItemForm, setNewItemForm] = useState({
    name: '',
    category: 'Cihaz',
    brand: '',
    model: '',
    serialNo: '',
    barcode: '',
    quantity: 1,
    price: 0,
    purchasePrice: 0,
    branch: '',
    description: ''
  });
  useEffect(() => {
    if (!newItemForm.branch && branchesList.length) setNewItemForm(form => ({ ...form, branch: branchesList[0].name }));
  }, [branchesList, newItemForm.branch]);

  // Filter logic
  const filteredItems = useMemo(() => {
    return allStockItems.filter(item => {
      // Branch scope check
      if (!BranchService.matchesBranch(item.branch, item.branchId, activeBranch)) {
        return false;
      }

      // Pill tab filter
      if (categoryPill !== 'Tümü' && item.category !== categoryPill) {
        return false;
      }

      // Category dropdown filter
      if (selectedCategory !== 'Tüm Kategoriler' && item.category !== selectedCategory) {
        return false;
      }

      // Branch dropdown filter
      if (selectedBranch !== 'Tüm Şubeler' && item.branch !== selectedBranch) {
        return false;
      }

      // Status dropdown filter
      if (selectedStatus !== 'Tüm Durumlar') {
        const itemStockStatus = item.quantity === 0 ? 'Stok Yok' : item.quantity <= item.criticalLevel ? 'Azaldı' : 'Stokta';
        if (selectedStatus === 'Kritik Stok') {
          if (item.quantity > item.criticalLevel) return false;
        } else if (itemStockStatus !== selectedStatus) return false;
      }

      // Search term
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchName = item.name.toLowerCase().includes(q);
        const matchBrand = (item.brand || '').toLowerCase().includes(q);
        const matchModel = (item.model || '').toLowerCase().includes(q);
        const matchSerial = (item.serialNo || '').toLowerCase().includes(q);
        const matchBarcode = (item.barcode || '').toLowerCase().includes(q);
        if (!matchName && !matchBrand && !matchModel && !matchSerial && !matchBarcode) return false;
      }

      return true;
    });
  }, [allStockItems, activeBranch, categoryPill, selectedCategory, selectedBranch, selectedStatus, searchTerm]);

  useEffect(() => setCurrentTablePage(1), [categoryPill, selectedCategory, selectedBranch, selectedStatus, searchTerm, tablePageSize]);
  const tablePageCount = Math.max(1, Math.ceil(filteredItems.length / tablePageSize));
  const pagedItems = useMemo(() => filteredItems.slice((currentTablePage - 1) * tablePageSize, currentTablePage * tablePageSize), [filteredItems, currentTablePage, tablePageSize]);

  // Keep the detail drawer bound to a row that is actually present in the current scope.
  useEffect(() => {
    if (filteredItems.length === 0) {
      setActiveItem(null);
      return;
    }
    if (!activeItem || !filteredItems.some(item => item.id === activeItem.id)) {
      setActiveItem(filteredItems[0]);
    }
  }, [filteredItems, activeItem]);

  // Statistics are derived from the same tenant/branch-scoped inventory as the table.
  const scopedStockItems = useMemo(() => allStockItems.filter(item =>
    BranchService.matchesBranch(item.branch, item.branchId, activeBranch)
  ), [allStockItems, activeBranch]);
  const totalProducts = scopedStockItems.length;
  const totalStockQty = scopedStockItems.reduce((sum, item) => sum + Math.max(0, Number(item.quantity) || 0), 0);
  const totalStockValue = scopedStockItems.reduce((sum, item) => sum + Math.max(0, Number(item.quantity) || 0) * (Number(item.purchasePrice) || Number(item.price) || 0), 0);
  const utsRegisteredCount = scopedStockItems.filter(item => item.utsStatus === 'Bildirildi').length;
  const utsRate = totalProducts ? Math.round((utsRegisteredCount / totalProducts) * 100) : 0;
  const criticalStockCount = scopedStockItems.filter(item => item.quantity <= item.criticalLevel).length;

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(filteredItems.map(i => i.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleToggleSelect = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleRowClick = (item: DisplayStockItem) => {
    setActiveItem(item);
    if (!selectedIds.includes(item.id)) {
      setSelectedIds([item.id]);
    }
  };

  // Status badge helper with colored dot
  const renderStatusBadge = (quantity: number, criticalLevel: number) => {
    if (quantity === 0) {
      return (
        <span className={`${styles.statusDotBadge} ${styles.statusOutOfStock}`}>
          <span className={`${styles.statusDot} ${styles.dotRed}`} />
          Stok Yok
        </span>
      );
    }
    if (quantity <= criticalLevel) {
      return (
        <span className={`${styles.statusDotBadge} ${styles.statusLowStock}`}>
          <span className={`${styles.statusDot} ${styles.dotOrange}`} />
          Azaldı
        </span>
      );
    }
    return (
      <span className={`${styles.statusDotBadge} ${styles.statusInStock}`}>
        <span className={`${styles.statusDot} ${styles.dotGreen}`} />
        Stokta
      </span>
    );
  };

  // Category pill badge helper
  const renderCategoryBadge = (category: string) => {
    if (category === 'Cihaz') return <span className={`${styles.badgeCategory} ${styles.badgeCategoryCihaz}`}>Cihaz</span>;
    if (category === 'Pil') return <span className={`${styles.badgeCategory} ${styles.badgeCategoryPil}`}>Pil</span>;
    if (category === 'Kalıp') return <span className={`${styles.badgeCategory} ${styles.badgeCategoryKalip}`}>Kalıp</span>;
    return <span className={`${styles.badgeCategory} ${styles.badgeCategoryAksesuar}`}>Aksesuar</span>;
  };

  // Stock Qty styling
  const renderQtyCell = (quantity: number, criticalLevel: number) => {
    if (quantity === 0) return <span className={`${styles.qtyCell} ${styles.qtyRed}`}>0</span>;
    if (quantity <= criticalLevel) return <span className={`${styles.qtyCell} ${styles.qtyOrange}`}>{quantity}</span>;
    if (quantity > 10) return <span className={`${styles.qtyCell} ${styles.qtyGreen}`}>{quantity}</span>;
    return <span className={styles.qtyCell}>{quantity}</span>;
  };

  // Product thumbnail helper
  const renderProductThumbnail = (category: string) => {
    if (category === 'Cihaz') {
      return (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="1.8">
          <path d="M12 2a5 5 0 0 0-5 5v3a7 7 0 0 0 14 0V7a5 5 0 0 0-5-5z" />
          <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
          <line x1="12" y1="19" x2="12" y2="23" />
          <line x1="8" y1="23" x2="16" y2="23" />
        </svg>
      );
    }
    if (category === 'Pil') {
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="1.8">
          <circle cx="12" cy="12" r="10" />
          <circle cx="12" cy="12" r="5" />
          <line x1="12" y1="2" x2="12" y2="4" />
        </svg>
      );
    }
    if (category === 'Kalıp') {
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#7e22ce" strokeWidth="1.8">
          <path d="M6 9a6 6 0 0 1 12 0c0 4-3 6-3 9H9c0-3-3-5-3-9z" />
          <path d="M9 18h6" />
          <path d="M10 21h4" />
        </svg>
      );
    }
    return (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#08785b" strokeWidth="1.8">
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      </svg>
    );
  };

  // Submit new product
  const handleAddNewProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemForm.name.trim()) {
      addToast({ type: 'warning', message: 'Lütfen ürün adını giriniz.' });
      return;
    }

    const itemToAdd: StockItem = {
      id: `stk-${Date.now()}`,
      name: newItemForm.name,
      category: newItemForm.category,
      brand: newItemForm.brand.trim(),
      model: newItemForm.model.trim(),
      serialNo: newItemForm.serialNo,
      barcode: newItemForm.barcode,
      quantity: Number(newItemForm.quantity) || 1,
      criticalLevel: 1,
      price: Number(newItemForm.price) || 0,
      purchasePrice: Number(newItemForm.purchasePrice) || 0,
      sgkPrice: 0,
      warrantyExpiry: '',
      location: 'Depo',
      status: 'Stokta',
      utsStatus: 'Bekliyor',
      branch: newItemForm.branch
    };

    try {
      await addStockItem(itemToAdd);
      addToast({ type: 'success', message: `${itemToAdd.name} stoğa başarıyla eklendi.` });
      setShowAddModal(false);
      setActiveItem({
        ...itemToAdd,
        branchStockBreakdown: { [newItemForm.branch]: Number(newItemForm.quantity) },
        description: newItemForm.description || `${itemToAdd.brand} ${itemToAdd.model}`
      });
    } catch {
      // gracefully handled
    }
  };

  // Stock Adjustment
  const handleStockAdjustment = async () => {
    if (!activeItem) return;
    const change = adjustmentType === 'artir' ? adjustmentQty : -adjustmentQty;
    const newQty = Math.max(0, activeItem.quantity + change);
    try {
      await adjustStockItem(activeItem.id, newQty, adjustmentReason, 'Manuel işlem');
      setActiveItem({ ...activeItem, quantity: newQty });
      setShowAdjustmentModal(false);
      addToast({ type: 'success', message: `${activeItem.name} stok adedi ${newQty} olarak güncellendi.` });
    } catch {
      //
    }
  };

  return (
    <div className={styles.stockPage}>
      {/* ── Breadcrumb ── */}
      <div className={styles.breadcrumb}>
        Stok & Aksesuar <span>›</span> Stok Yönetimi
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
            <h1>Stok & Aksesuar Yönetimi</h1>
            <p>Cihaz, pil, kulak kalıbı ve aksesuar envanterinizi yönetin. Şube bazlı stokları takip edin.</p>
          </div>
        </div>

        <div className={styles.headerActions}>
          {/* 1. ÜTS Entegrasyonu */}
          <button
            className={styles.btnSecondaryAction}
            onClick={() => setShowUtsModal(true)}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#0284c7" strokeWidth="2">
              <path d="M23 4v6h-6" />
              <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
            </svg>
            ÜTS Entegrasyonu
          </button>

          {/* 2. Toplu Ekle */}
          <button
            className={styles.btnSecondaryAction}
            onClick={() => addToast({ type: 'info', message: 'Toplu ürün yüklemek için Excel / CSV dosyanızı seçin.' })}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            Toplu Ekle
          </button>

          {/* 3. Hızlı Satış */}
          <button
            className={styles.btnSecondaryAction}
            onClick={() => setShowQuickSaleModal(true)}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#0284c7" strokeWidth="2">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
            </svg>
            Hızlı Satış
          </button>

          {/* 4. Yeni Ürün Ekle */}
          <button
            className={styles.btnPrimaryAction}
            onClick={() => setShowAddModal(true)}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Yeni Ürün Ekle
          </button>
        </div>
      </div>

      {/* ── 5 Stat Metric Cards ── */}
      <div className={styles.statsGrid}>
        {/* Card 1: Toplam Ürün */}
        <div className={styles.statCard} onClick={() => setCategoryPill('Tümü')}>
          <div className={`${styles.statIcon} ${styles.iconGreen}`}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
            </svg>
          </div>
          <div>
            <span>Toplam Ürün</span>
            <strong>{totalProducts}</strong>
          </div>
        </div>

        {/* Card 2: Toplam Stok Adedi */}
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.iconBlue}`}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <ellipse cx="12" cy="5" rx="9" ry="3" />
              <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
              <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
            </svg>
          </div>
          <div>
            <span>Toplam Stok Adedi</span>
            <strong>{totalStockQty}</strong>
          </div>
        </div>

        {/* Card 3: Stok Değeri */}
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.iconGreen}`}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="2" y="6" width="20" height="12" rx="2" />
              <circle cx="12" cy="12" r="2" />
              <path d="M6 12h.01M18 12h.01" />
            </svg>
          </div>
          <div>
            <span>Stok Değeri</span>
            <strong>{formatCurrency(totalStockValue)}</strong>
          </div>
        </div>

        {/* Card 4: ÜTS Durumu */}
        <div className={styles.statCard} onClick={() => setShowUtsModal(true)}>
          <div className={`${styles.statIcon} ${styles.iconTeal}`}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              <polyline points="9 12 11 14 15 10" />
            </svg>
          </div>
          <div>
            <span>ÜTS Durumu</span>
            <strong>{utsRegisteredCount} Ürün</strong>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 11, color: '#08785b', fontWeight: 650 }}>%{utsRate} kayıtlı</span>
            </div>
            <div className={styles.progressBarContainer}>
              <div className={styles.progressBarFill} style={{ width: `${utsRate}%` }} />
            </div>
          </div>
        </div>

        {/* Card 5: Kritik Stok */}
        <div className={styles.statCard} onClick={() => setSelectedStatus('Kritik Stok')}>
          <div className={`${styles.statIcon} ${styles.iconRed}`}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </div>
          <div>
            <span>Kritik Stok</span>
            <strong>{criticalStockCount} Ürün</strong>
            <div className={styles.statTrend}>
              <span className={styles.trendRed}>♦ stok azalıyor</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Category Pill Tabs Row + Action Buttons ── */}
      <div className={styles.categoryTabsRow}>
        <div className={styles.categoryPills}>
          {['Tümü', 'Cihaz', 'Pil', 'Kalıp', 'Aksesuar'].map(cat => (
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
            onClick={() => {
              if (activeItem) setShowAdjustmentModal(true);
              else addToast({ type: 'info', message: 'Lütfen tablodan bir ürün seçin.' });
            }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            Stok Hareketleri
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
            Stok Raporu
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
            placeholder="Ürün adı, marka, seri no veya barkod ile ara..."
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
        </select>

        <select
          className={styles.filterSelect}
          value={selectedCategory}
          onChange={e => setSelectedCategory(e.target.value)}
        >
          <option value="Tüm Kategoriler">Tüm Kategoriler</option>
          <option value="Cihaz">Cihaz</option>
          <option value="Pil">Pil</option>
          <option value="Kalıp">Kalıp</option>
          <option value="Aksesuar">Aksesuar</option>
        </select>

        <select
          className={styles.filterSelect}
          value={selectedStatus}
          onChange={e => setSelectedStatus(e.target.value)}
        >
          <option value="Tüm Durumlar">Tüm Durumlar</option>
          <option value="Stokta">Stokta</option>
          <option value="Azaldı">Azaldı</option>
          <option value="Kritik Stok">Kritik Stok (azaldı ve stok yok)</option>
          <option value="Stok Yok">Stok Yok</option>
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
            setSelectedCategory('Tüm Kategoriler');
            setSelectedStatus('Tüm Durumlar');
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
            <table className={styles.stockTable}>
              <thead>
                <tr>
                  <th style={{ width: 40, textAlign: 'center' }}>
                    <input
                      type="checkbox"
                      checked={selectedIds.length > 0 && selectedIds.length === filteredItems.length}
                      onChange={e => handleSelectAll(e.target.checked)}
                    />
                  </th>
                  <th>ÜRÜN</th>
                  <th>KATEGORİ</th>
                  <th>MARKA / MODEL</th>
                  <th>SERİ NO / BARKOD</th>
                  <th>STOK ADEDİ</th>
                  <th>FİYAT</th>
                  <th>DURUM</th>
                  <th style={{ textAlign: 'center' }}>İŞLEMLER</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.length === 0 ? (
                  <tr>
                    <td colSpan={9} style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                      Aranan kriterlere uygun stok kaydı bulunamadı.
                    </td>
                  </tr>
                ) : (
                  pagedItems.map(item => {
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
                          <div className={styles.productCell}>
                            <div className={styles.productThumb}>
                              {renderProductThumbnail(item.category)}
                            </div>
                            <div className={styles.productMeta}>
                              <span className={styles.productName}>{item.name}</span>
                              <span className={styles.productCategorySub}>{item.category === 'Cihaz' ? 'İşitme Cihazı' : item.category}</span>
                            </div>
                          </div>
                        </td>
                        <td>{renderCategoryBadge(item.category)}</td>
                        <td>
                          <div style={{ fontWeight: 600, color: '#0f172a' }}>{item.brand}</div>
                          <div style={{ fontSize: 11.5, color: '#64748b' }}>{item.model}</div>
                        </td>
                        <td>
                          {item.serialNo && item.serialNo !== '—' && (
                            <div style={{ fontSize: 12, fontFamily: 'monospace', color: '#334155' }}>
                              SN: {item.serialNo}
                            </div>
                          )}
                          {item.barcode && item.barcode !== '—' && (
                            <div style={{ fontSize: 11.5, color: '#64748b' }}>
                              Barkod: {item.barcode}
                            </div>
                          )}
                        </td>
                        <td>{renderQtyCell(item.quantity, item.criticalLevel)}</td>
                        <td style={{ fontWeight: 700, color: '#0f172a' }}>{formatCurrency(item.price)}</td>
                        <td>{renderStatusBadge(item.quantity, item.criticalLevel)}</td>
                        <td style={{ textAlign: 'center' }} onClick={e => e.stopPropagation()}>
                          <div className={styles.actionBtns} style={{ justifyContent: 'center', position: 'relative' }}>
                            {/* Eye icon button */}
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

                            {/* Pencil icon button */}
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

                            {/* Three dots vertical menu */}
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
                                      setActiveItem(item);
                                      setShowAdjustmentModal(true);
                                    }}
                                  >
                                    ⇄ Stok Hareketi Ekle
                                  </button>
                                  <button
                                    className={styles.dropdownItem}
                                    onClick={() => {
                                      setActiveActionMenuId(null);
                                      setShowQuickSaleModal(true);
                                    }}
                                  >
                                    🛒 Hızlı Satış Yap
                                  </button>
                                  <button
                                    className={styles.dropdownItem}
                                    onClick={() => {
                                      setActiveActionMenuId(null);
                                      addToast({ type: 'info', message: `${item.name} (${item.serialNo}) için ÜTS durumu: ${item.utsStatus}` });
                                    }}
                                  >
                                    🛡 ÜTS Durumu Sorgula
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
                                    onClick={() => {
                                      setActiveActionMenuId(null);
                                      deleteStockItem(item.id);
                                      addToast({ type: 'success', message: `${item.name} ürünü silindi.` });
                                    }}
                                  >
                                    🗑 Ürünü Sil
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
              Toplam {totalProducts} ürün | {selectedIds.length} ürün seçili
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div className={styles.pagination}>
                <button type="button" className={styles.pageBtn} aria-label="Önceki sayfa" disabled={currentTablePage <= 1} onClick={() => setCurrentTablePage(page => Math.max(1, page - 1))}>‹</button>
                {Array.from({ length: tablePageCount }, (_, index) => index + 1).map(page => <button type="button" key={page} className={`${styles.pageBtn} ${currentTablePage === page ? styles.pageBtnActive : ''}`} aria-current={currentTablePage === page ? 'page' : undefined} onClick={() => setCurrentTablePage(page)}>{page}</button>)}
                <button type="button" className={styles.pageBtn} aria-label="Sonraki sayfa" disabled={currentTablePage >= tablePageCount} onClick={() => setCurrentTablePage(page => Math.min(tablePageCount, page + 1))}>›</button>
              </div>

              <select aria-label="Sayfa başına ürün" className={styles.filterSelect} style={{ height: 32, minWidth: 90, padding: '0 8px' }} value={tablePageSize} onChange={event => setTablePageSize(Number(event.target.value))}>
                <option value={10}>10 / sayfa</option>
                <option value={25}>25 / sayfa</option>
                <option value={50}>50 / sayfa</option>
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
                  {renderProductThumbnail(activeItem.category)}
                </div>
                <div>
                  <div className={styles.drawerProductName}>{activeItem.name}</div>
                  <div className={styles.drawerProductCategory}>
                    {activeItem.category === 'Cihaz' ? 'İşitme Cihazı' : activeItem.category}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {renderStatusBadge(activeItem.quantity, activeItem.criticalLevel)}
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
                className={`${styles.drawerTabBtn} ${drawerTab === 'stok' ? styles.drawerTabBtnActive : ''}`}
                onClick={() => setDrawerTab('stok')}
              >
                Stok
              </button>
              <button
                className={`${styles.drawerTabBtn} ${drawerTab === 'uts' ? styles.drawerTabBtnActive : ''}`}
                onClick={() => setDrawerTab('uts')}
              >
                ÜTS
              </button>
              <button
                className={`${styles.drawerTabBtn} ${drawerTab === 'hareketler' ? styles.drawerTabBtnActive : ''}`}
                onClick={() => setDrawerTab('hareketler')}
              >
                Hareketler
              </button>
              <button
                className={`${styles.drawerTabBtn} ${drawerTab === 'iliskili' ? styles.drawerTabBtnActive : ''}`}
                onClick={() => setDrawerTab('iliskili')}
              >
                İle İlişkili
              </button>
            </div>

            {/* Body */}
            <div className={styles.drawerBody}>
              {drawerTab === 'genel' && (
                <>
                  {/* Genel Bilgiler Section */}
                  <div className={styles.drawerSection}>
                    <div className={styles.sectionHeader}>
                      <span className={styles.sectionTitle}>Genel Bilgiler</span>
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
                        <strong>{activeItem.brand} {activeItem.model}</strong>
                      </div>
                      <div className={styles.infoRow}>
                        <span>Seri No</span>
                        <strong style={{ fontFamily: 'monospace' }}>{activeItem.serialNo || '—'}</strong>
                      </div>
                      <div className={styles.infoRow}>
                        <span>Barkod</span>
                        <strong style={{ fontFamily: 'monospace' }}>{activeItem.barcode || '—'}</strong>
                      </div>
                      <div className={styles.infoRow}>
                        <span>Fiyat</span>
                        <strong style={{ color: '#08785b' }}>{formatCurrency(activeItem.price)}</strong>
                      </div>
                      <div style={{ marginTop: 4 }}>
                        <span style={{ display: 'block', fontSize: 11.5, color: '#64748b', marginBottom: 2 }}>Açıklama</span>
                        <div style={{ fontSize: 12, color: '#1e293b', background: '#f8fafc', padding: '8px 10px', borderRadius: 6, border: '1px solid #e2e8f0' }}>
                          {activeItem.description || `${activeItem.name} envanter kaydı.`}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Stok Bilgileri Section */}
                  <div className={styles.drawerSection}>
                    <div className={styles.sectionHeader}>
                      <span className={styles.sectionTitle}>Stok Bilgileri</span>
                      <button
                        className={styles.btnEditLink}
                        onClick={() => setShowTransferModal(true)}
                      >
                        Şube Bazlı Stok
                      </button>
                    </div>

                    <div className={styles.branchStockBox}>
                      {branchesList.filter(branch => branch.status === 'Aktif').map(branch => (
                        <div className={styles.branchStockRow} key={branch.id}>
                          <span>{branch.name}</span>
                          <strong>{activeItem.branchStockBreakdown?.[branch.name] ?? 0}</strong>
                        </div>
                      ))}
                      <hr style={{ border: 'none', borderTop: '1px solid #e2e8f0', margin: '4px 0' }} />
                      <div className={styles.branchStockRow}>
                        <span style={{ fontWeight: 700, color: '#0f172a' }}>Toplam</span>
                        <strong style={{ fontSize: 14, color: '#08785b' }}>{activeItem.quantity}</strong>
                      </div>
                    </div>
                  </div>

                  {/* Hızlı İşlemler Section */}
                  <div className={styles.drawerSection}>
                    <span className={styles.sectionTitle}>Hızlı İşlemler</span>
                    <div className={styles.quickActionsGrid}>
                      <button
                        className={styles.quickActionBtn}
                        onClick={() => setShowAdjustmentModal(true)}
                      >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="17 1 21 5 17 9" />
                          <path d="M3 11V9a4 4 0 0 1 4-4h14" />
                          <polyline points="7 23 3 19 7 15" />
                          <path d="M21 13v2a4 4 0 0 1-4 4H3" />
                        </svg>
                        Stok Hareketi
                      </button>

                      <button
                        className={styles.quickActionBtn}
                        onClick={() => setShowQuickSaleModal(true)}
                      >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="9" cy="21" r="1" />
                          <circle cx="20" cy="21" r="1" />
                          <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                        </svg>
                        Hızlı Satış
                      </button>

                      <button
                        className={styles.quickActionBtn}
                        onClick={() => addToast({ type: 'error', message: 'ÜTS bağlantısı yapılandırılmadı; ürün doğrulanmadı.' })}
                      >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                        </svg>
                        ÜTS&apos;de Sorgula
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

              {drawerTab === 'stok' && (
                <div style={{ display: 'grid', gap: 10, fontSize: 13 }}>
                  <div className={styles.branchStockBox}>
                    <div className={styles.branchStockRow}>
                      <span>Mevcut Adet:</span>
                      <strong>{activeItem.quantity} Adet</strong>
                    </div>
                    <div className={styles.branchStockRow}>
                      <span>Kritik Eşik Seviyesi:</span>
                      <strong>{activeItem.criticalLevel} Adet</strong>
                    </div>
                    <div className={styles.branchStockRow}>
                      <span>Raf / Depo Konumu:</span>
                      <span>{activeItem.location || 'A-Rafı, Kutu 1'}</span>
                    </div>
                    <div className={styles.branchStockRow}>
                      <span>Alış Birim Fiyatı:</span>
                      <span>{formatCurrency(activeItem.purchasePrice || 0)}</span>
                    </div>
                    <div className={styles.branchStockRow}>
                      <span>Garanti Bitiş:</span>
                      <span>{activeItem.warrantyExpiry || '2028-12-31'}</span>
                    </div>
                  </div>
                </div>
              )}

              {drawerTab === 'uts' && (
                <div style={{ display: 'grid', gap: 10, fontSize: 13 }}>
                  <div style={{ padding: 14, background: '#f0fdf8', borderRadius: 10, border: '1px solid #bbf7d0' }}>
                    <div style={{ fontWeight: 700, color: '#08785b', marginBottom: 4 }}>ÜTS Durumu: {activeItem.utsStatus}</div>
                    <div style={{ fontSize: 12, color: '#065f46' }}>Kayıtlı durum: {activeItem.utsStatus || '—'}</div>
                  </div>
                  <div className={styles.branchStockBox}>
                    <div className={styles.branchStockRow}>
                      <span>UIK Kurum No:</span>
                      <strong style={{ fontFamily: 'monospace' }}>{activeItem.utsKurumNo || '—'}</strong>
                    </div>
                    <div className={styles.branchStockRow}>
                      <span>GLN Numarası:</span>
                      <strong style={{ fontFamily: 'monospace' }}>{activeItem.gln || '—'}</strong>
                    </div>
                    <div className={styles.branchStockRow}>
                      <span>Barkod:</span>
                      <strong style={{ fontFamily: 'monospace' }}>{activeItem.barcode || '—'}</strong>
                    </div>
                  </div>
                </div>
              )}

              {drawerTab === 'hareketler' && (
                <div style={{ display: 'grid', gap: 8, fontSize: 12.5 }}>
                  {stockMovements.length ? stockMovements.map(movement => (
                    <div key={movement.id} style={{ padding: 10, background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 650, color: '#0f172a' }}>
                        <span>{movement.notes || movement.type}</span>
                        <span style={{ color: movement.quantityChange >= 0 ? '#08785b' : '#dc2626' }}>{movement.quantityChange > 0 ? '+' : ''}{movement.quantityChange} Adet</span>
                      </div>
                      <div style={{ fontSize: 11, color: '#64748b', marginTop: 3 }}>{new Date(movement.createdAt).toLocaleString('tr-TR')}{movement.branchName ? ` · ${movement.branchName}` : ''}</div>
                    </div>
                  )) : <div style={{ padding: 12, color: '#64748b' }}>Bu ürün için kaydedilmiş stok hareketi bulunmuyor.</div>}
                </div>
              )}

              {drawerTab === 'iliskili' && (
                <div style={{ padding: 16, textAlign: 'center', background: '#f8fafc', borderRadius: 10, border: '1px dashed #cbd5e1', fontSize: 13, color: '#64748b' }}>
                  {activeItem.assignedPatientName ? (
                    <div>Bu cihaz <strong>{activeItem.assignedPatientName}</strong> isimli hastaya zimmetlenmiştir.</div>
                  ) : (
                    <div>Bu ürün şu anda serbest stoktadır, herhangi bir hasta veya servis formuna bağlanmamıştır.</div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── MODAL: Yeni Ürün Ekle ── */}
      {showAddModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.55)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'grid', placeItems: 'center', padding: 20 }}>
          <div style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 580, overflow: 'hidden', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid #e2e8f0' }}>
              <h3 style={{ margin: 0, fontSize: 17, color: '#0f172a' }}>Yeni Ürün / Stok Kartı Ekle</h3>
              <button style={{ border: 'none', background: 'transparent', fontSize: 20, cursor: 'pointer', color: '#94a3b8' }} onClick={() => setShowAddModal(false)}>✕</button>
            </div>

            <form onSubmit={handleAddNewProduct}>
              <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 14, maxHeight: '75vh', overflowY: 'auto' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#334155', marginBottom: 6 }}>Ürün Adı *</label>
                    <input
                      className={styles.filterSelect}
                      style={{ width: '100%' }}
                      required
                      placeholder="Örn: Oticon More 1"
                      value={newItemForm.name}
                      onChange={e => setNewItemForm({ ...newItemForm, name: e.target.value })}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#334155', marginBottom: 6 }}>Kategori</label>
                    <select
                      className={styles.filterSelect}
                      style={{ width: '100%' }}
                      value={newItemForm.category}
                      onChange={e => setNewItemForm({ ...newItemForm, category: e.target.value })}
                    >
                      <option value="Cihaz">Cihaz</option>
                      <option value="Pil">Pil</option>
                      <option value="Kalıp">Kalıp</option>
                      <option value="Aksesuar">Aksesuar</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#334155', marginBottom: 6 }}>Marka</label>
                    <input
                      className={styles.filterSelect}
                      style={{ width: '100%' }}
                      placeholder="Örn: Oticon"
                      value={newItemForm.brand}
                      onChange={e => setNewItemForm({ ...newItemForm, brand: e.target.value })}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#334155', marginBottom: 6 }}>Model</label>
                    <input
                      className={styles.filterSelect}
                      style={{ width: '100%' }}
                      placeholder="Örn: More 1 miniRITE"
                      value={newItemForm.model}
                      onChange={e => setNewItemForm({ ...newItemForm, model: e.target.value })}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#334155', marginBottom: 6 }}>Seri Numarası</label>
                    <input
                      className={styles.filterSelect}
                      style={{ width: '100%' }}
                      placeholder="1234567890"
                      value={newItemForm.serialNo}
                      onChange={e => setNewItemForm({ ...newItemForm, serialNo: e.target.value })}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#334155', marginBottom: 6 }}>Barkod (GTIN)</label>
                    <input
                      className={styles.filterSelect}
                      style={{ width: '100%' }}
                      placeholder="OT-001"
                      value={newItemForm.barcode}
                      onChange={e => setNewItemForm({ ...newItemForm, barcode: e.target.value })}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#334155', marginBottom: 6 }}>Stok Adedi</label>
                    <input
                      type="number"
                      min="0"
                      className={styles.filterSelect}
                      style={{ width: '100%' }}
                      value={newItemForm.quantity}
                      onChange={e => setNewItemForm({ ...newItemForm, quantity: Number(e.target.value) })}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#334155', marginBottom: 6 }}>Satış Fiyatı (₺)</label>
                    <input
                      type="number"
                      min="0"
                      className={styles.filterSelect}
                      style={{ width: '100%' }}
                      value={newItemForm.price}
                      onChange={e => setNewItemForm({ ...newItemForm, price: Number(e.target.value) })}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#334155', marginBottom: 6 }}>Şube</label>
                    <select
                      className={styles.filterSelect}
                      style={{ width: '100%' }}
                      value={newItemForm.branch}
                      onChange={e => setNewItemForm({ ...newItemForm, branch: e.target.value })}
                    >
                      <option value="" disabled>Şube seçin</option>
                      {branchesList.filter(branch => branch.status === 'Aktif').map(branch => <option key={branch.id} value={branch.name}>{branch.name}</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#334155', marginBottom: 6 }}>Açıklama</label>
                  <textarea
                    rows={2}
                    className={styles.filterSelect}
                    style={{ width: '100%', height: 'auto', padding: '8px 12px' }}
                    placeholder="Ürün teknik özellikleri veya detaylar..."
                    value={newItemForm.description}
                    onChange={e => setNewItemForm({ ...newItemForm, description: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, padding: '16px 20px', borderTop: '1px solid #e2e8f0', background: '#f8fafc' }}>
                <button type="button" className={styles.btnClear} onClick={() => setShowAddModal(false)}>Vazgeç</button>
                <button type="submit" className={styles.btnPrimaryAction}>Ürünü Kaydet</button>
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
              <h3 style={{ margin: 0, fontSize: 17, color: '#0f172a' }}>Ürün Bilgilerini Düzenle</h3>
              <button style={{ border: 'none', background: 'transparent', fontSize: 20, cursor: 'pointer', color: '#94a3b8' }} onClick={() => setShowEditModal(false)}>✕</button>
            </div>
            <div style={{ padding: 20, display: 'grid', gap: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#334155', marginBottom: 4 }}>Ürün Adı</label>
                <input
                  className={styles.filterSelect}
                  style={{ width: '100%' }}
                  value={activeItem.name}
                  onChange={e => setActiveItem({ ...activeItem, name: e.target.value })}
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#334155', marginBottom: 4 }}>Satış Fiyatı (₺)</label>
                  <input
                    type="number"
                    className={styles.filterSelect}
                    style={{ width: '100%' }}
                    value={activeItem.price}
                    onChange={e => setActiveItem({ ...activeItem, price: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#334155', marginBottom: 4 }}>Stok Adedi</label>
                  <input
                    type="number"
                    className={styles.filterSelect}
                    style={{ width: '100%' }}
                    value={activeItem.quantity}
                    onChange={e => setActiveItem({ ...activeItem, quantity: Number(e.target.value) })}
                  />
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#334155', marginBottom: 4 }}>Açıklama</label>
                <textarea
                  rows={2}
                  className={styles.filterSelect}
                  style={{ width: '100%', height: 'auto', padding: '8px 12px' }}
                  value={activeItem.description || ''}
                  onChange={e => setActiveItem({ ...activeItem, description: e.target.value })}
                />
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, padding: '16px 20px', borderTop: '1px solid #e2e8f0', background: '#f8fafc' }}>
              <button className={styles.btnClear} onClick={() => setShowEditModal(false)}>Vazgeç</button>
              <button
                className={styles.btnPrimaryAction}
                onClick={async () => {
                  await updateStockItem(activeItem);
                  setShowEditModal(false);
                  addToast({ type: 'success', message: 'Ürün bilgileri güncellendi.' });
                }}
              >
                Kaydet
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: Stok Hareketi / Düzeltme ── */}
      {showAdjustmentModal && activeItem && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.55)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'grid', placeItems: 'center', padding: 20 }}>
          <div style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 480, overflow: 'hidden', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid #e2e8f0' }}>
              <h3 style={{ margin: 0, fontSize: 17, color: '#0f172a' }}>Stok Hareketi Ekle</h3>
              <button style={{ border: 'none', background: 'transparent', fontSize: 20, cursor: 'pointer', color: '#94a3b8' }} onClick={() => setShowAdjustmentModal(false)}>✕</button>
            </div>
            <div style={{ padding: 20, display: 'grid', gap: 14 }}>
              <div style={{ padding: 12, background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                <div style={{ fontWeight: 650, color: '#0f172a' }}>{activeItem.name}</div>
                <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>Mevcut Stok: <strong>{activeItem.quantity} Adet</strong></div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  type="button"
                  style={{ flex: 1, height: 38, borderRadius: 8, border: adjustmentType === 'artir' ? '2px solid #08785b' : '1px solid #cbd5e1', background: adjustmentType === 'artir' ? '#f0fdf8' : '#fff', color: adjustmentType === 'artir' ? '#08785b' : '#334155', fontWeight: 650, cursor: 'pointer' }}
                  onClick={() => setAdjustmentType('artir')}
                >
                  + Stok Artır (Giriş)
                </button>
                <button
                  type="button"
                  style={{ flex: 1, height: 38, borderRadius: 8, border: adjustmentType === 'azalt' ? '2px solid #dc2626' : '1px solid #cbd5e1', background: adjustmentType === 'azalt' ? '#fee2e2' : '#fff', color: adjustmentType === 'azalt' ? '#dc2626' : '#334155', fontWeight: 650, cursor: 'pointer' }}
                  onClick={() => setAdjustmentType('azalt')}
                >
                  - Stok Azalt (Çıkış)
                </button>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#334155', marginBottom: 4 }}>Hareket Miktarı (Adet)</label>
                <input
                  type="number"
                  min="1"
                  className={styles.filterSelect}
                  style={{ width: '100%' }}
                  value={adjustmentQty}
                  onChange={e => setAdjustmentQty(Math.max(1, Number(e.target.value)))}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#334155', marginBottom: 4 }}>İşlem Nedeni</label>
                <select
                  className={styles.filterSelect}
                  style={{ width: '100%' }}
                  value={adjustmentReason}
                  onChange={e => setAdjustmentReason(e.target.value)}
                >
                  <option value="Sayım Düzeltmesi">Sayım Düzeltmesi</option>
                  <option value="Tedarikçiden İade Alındı">Tedarikçiden İade Alındı</option>
                  <option value="Hasar / Zayiat">Hasar / Zayiat</option>
                  <option value="Numune / Hediye">Numune / Hediye</option>
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, padding: '16px 20px', borderTop: '1px solid #e2e8f0', background: '#f8fafc' }}>
              <button className={styles.btnClear} onClick={() => setShowAdjustmentModal(false)}>Vazgeç</button>
              <button className={styles.btnPrimaryAction} onClick={handleStockAdjustment}>Hareketi Uygula</button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: Hızlı Satış ── */}
      {showQuickSaleModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.55)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'grid', placeItems: 'center', padding: 20 }}>
          <div style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 520, overflow: 'hidden', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid #e2e8f0' }}>
              <h3 style={{ margin: 0, fontSize: 17, color: '#0f172a' }}>Hızlı Satış Fişi / Çıkışı</h3>
              <button style={{ border: 'none', background: 'transparent', fontSize: 20, cursor: 'pointer', color: '#94a3b8' }} onClick={() => setShowQuickSaleModal(false)}>✕</button>
            </div>
            <div style={{ padding: 20, display: 'grid', gap: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#334155', marginBottom: 4 }}>Müşteri / Hasta Adı</label>
                <input className={styles.filterSelect} style={{ width: '100%' }} placeholder="Örn: Ayşe Yılmaz (veya Boş: Perakende)" />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#334155', marginBottom: 4 }}>Satılacak Ürün</label>
                <select className={styles.filterSelect} style={{ width: '100%' }}>
                  {filteredItems.map(i => (
                    <option key={i.id} value={i.id}>{i.name} — {formatCurrency(i.price)} (Stok: {i.quantity})</option>
                  ))}
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#334155', marginBottom: 4 }}>Ödeme Yöntemi</label>
                  <select className={styles.filterSelect} style={{ width: '100%' }}>
                    <option>Nakit</option>
                    <option>Kredi Kartı / POS</option>
                    <option>Havale / EFT</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#334155', marginBottom: 4 }}>Kasa Seçimi</label>
                  <div className={styles.filterSelect} style={{ width: '100%', color: '#64748b' }}>Kasa seçimi mevcut değil</div>
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, padding: '16px 20px', borderTop: '1px solid #e2e8f0', background: '#f8fafc' }}>
              <button className={styles.btnClear} onClick={() => setShowQuickSaleModal(false)}>Vazgeç</button>
              <button
                className={styles.btnPrimaryAction}
                onClick={() => {
                  addToast({ type: 'error', message: 'Hızlı satış formu hasta, ödeme ve kasa kayıtlarını ilişkili tablolarla kaydetmiyor. Kayıt oluşturulmadı; satış için Satış modülünü kullanın.' });
                }}
              >
                Satışı Onayla
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: ÜTS Entegrasyonu ── */}
      {showUtsModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.55)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'grid', placeItems: 'center', padding: 20 }}>
          <div style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 520, overflow: 'hidden', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid #e2e8f0' }}>
              <h3 style={{ margin: 0, fontSize: 17, color: '#0f172a' }}>T.C. Sağlık Bakanlığı ÜTS Entegrasyonu</h3>
              <button style={{ border: 'none', background: 'transparent', fontSize: 20, cursor: 'pointer', color: '#94a3b8' }} onClick={() => setShowUtsModal(false)}>✕</button>
            </div>
            <div style={{ padding: 20, display: 'grid', gap: 12 }}>
              <div style={{ padding: 14, background: '#f0fdf8', borderRadius: 10, border: '1px solid #bbf7d0', fontSize: 13 }}>
                <div style={{ fontWeight: 700, color: '#08785b' }}>Kayıtlı ÜTS Bilgisi</div>
                <div style={{ color: '#065f46', marginTop: 4 }}>{utsRegisteredCount} / {totalProducts} üründe ÜTS bildirildi durumu kayıtlı.</div>
              </div>
              <div className={styles.branchStockBox}>
                <div className={styles.branchStockRow}>
                  <span>Firma Tanımlayıcı Kodu:</span>
                  <strong>{stockList.find(item => item.utsKurumNo)?.utsKurumNo || '—'}</strong>
                </div>
                <div className={styles.branchStockRow}>
                  <span>Yetkili Kimlik:</span>
                  <strong>{currentUser?.name || '—'}</strong>
                </div>
                <div className={styles.branchStockRow}>
                  <span>Son Eşitleme:</span>
                  <span>—</span>
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, padding: '16px 20px', borderTop: '1px solid #e2e8f0', background: '#f8fafc' }}>
              <button
                className={styles.btnPrimaryAction}
                onClick={() => {
                  setShowUtsModal(false);
                  addToast({ type: 'error', message: 'Harici ÜTS bağlantısı yapılandırılmamış. Eşitleme yapılmadı.' });
                }}
              >
                ÜTS Bildirimlerini Eşitle
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: Şube Transferi ── */}
      {showTransferModal && activeItem && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.55)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'grid', placeItems: 'center', padding: 20 }}>
          <div style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 480, overflow: 'hidden', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid #e2e8f0' }}>
              <h3 style={{ margin: 0, fontSize: 17, color: '#0f172a' }}>Şubeler Arası Stok Transferi</h3>
              <button style={{ border: 'none', background: 'transparent', fontSize: 20, cursor: 'pointer', color: '#94a3b8' }} onClick={() => setShowTransferModal(false)}>✕</button>
            </div>
            <div style={{ padding: 20, display: 'grid', gap: 12 }}>
              <div style={{ padding: 12, background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                <div style={{ fontWeight: 650 }}>{activeItem.name}</div>
                <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>Mevcut Toplam: {activeItem.quantity} Adet</div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#334155', marginBottom: 4 }}>Kaynak Şube</label>
                  <select className={styles.filterSelect} style={{ width: '100%' }} defaultValue={activeItem.branch}>
                    {branchesList.filter(branch => branch.status === 'Aktif').map(branch => <option key={branch.id} value={branch.name}>{branch.name}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#334155', marginBottom: 4 }}>Hedef Şube</label>
                  <select className={styles.filterSelect} style={{ width: '100%' }} defaultValue={branchesList.find(branch => branch.name !== activeItem.branch)?.name || ''}>
                    {branchesList.filter(branch => branch.status === 'Aktif' && branch.name !== activeItem.branch).map(branch => <option key={branch.id} value={branch.name}>{branch.name}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#334155', marginBottom: 4 }}>Transfer Adedi</label>
                <input type="number" min="1" max={activeItem.quantity || 1} defaultValue={1} className={styles.filterSelect} style={{ width: '100%' }} />
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, padding: '16px 20px', borderTop: '1px solid #e2e8f0', background: '#f8fafc' }}>
              <button className={styles.btnClear} onClick={() => setShowTransferModal(false)}>Vazgeç</button>
              <button
                className={styles.btnPrimaryAction}
                onClick={() => {
                  setShowTransferModal(false);
                  addToast({ type: 'error', message: 'Stok transferi için şube bazlı stok miktarı ve atomik hareket kaydı veritabanında desteklenmiyor. Kayıt oluşturulmadı.' });
                }}
              >
                Transferi Başlat
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: Stok Raporu ── */}
      {showReportModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.55)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'grid', placeItems: 'center', padding: 20 }}>
          <div style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 540, overflow: 'hidden', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid #e2e8f0' }}>
              <h3 style={{ margin: 0, fontSize: 17, color: '#0f172a' }}>Stok Envanter & Değer Raporu</h3>
              <button style={{ border: 'none', background: 'transparent', fontSize: 20, cursor: 'pointer', color: '#94a3b8' }} onClick={() => setShowReportModal(false)}>✕</button>
            </div>
            <div style={{ padding: 20, display: 'grid', gap: 12 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                <div style={{ padding: 12, background: '#f8fafc', borderRadius: 8, textAlign: 'center' }}>
                  <div style={{ fontSize: 12, color: '#64748b' }}>Toplam Çeşit</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: '#0f172a', marginTop: 4 }}>{scopedStockItems.length}</div>
                </div>
                <div style={{ padding: 12, background: '#f8fafc', borderRadius: 8, textAlign: 'center' }}>
                  <div style={{ fontSize: 12, color: '#64748b' }}>Fiziksel Adet</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: '#0f172a', marginTop: 4 }}>{scopedStockItems.reduce((sum, item) => sum + Math.max(0, Number(item.quantity) || 0), 0)}</div>
                </div>
                <div style={{ padding: 12, background: '#f8fafc', borderRadius: 8, textAlign: 'center' }}>
                  <div style={{ fontSize: 12, color: '#64748b' }}>Toplam Değer</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: '#08785b', marginTop: 4 }}>{formatCurrency(totalStockValue)}</div>
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, padding: '16px 20px', borderTop: '1px solid #e2e8f0', background: '#f8fafc' }}>
              <button
                className={styles.btnClear}
                onClick={() => addToast({ type: 'error', message: 'PDF dışa aktarma henüz bağlı değil; dosya oluşturulmadı.' })}
              >
                📥 PDF İndir
              </button>
              <button className={styles.btnPrimaryAction} onClick={() => setShowReportModal(false)}>Kapat</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
