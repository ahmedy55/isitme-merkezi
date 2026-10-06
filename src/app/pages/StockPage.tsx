'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { useBranch } from '../context/BranchContext';
import { BranchService } from '../services/BranchService';
import { formatCurrency, type StockItem, type Patient } from '../data/mockData';
import { useDebounce } from '../hooks/useDebounce';
import { dbFetchStockMovements } from '../lib/database';
import { matchesInventoryIdentifier } from '../lib/inventorySearch';
import styles from './StockPage.module.css';

interface DisplayStockItem extends StockItem {
  branchStockBreakdown?: { [branchName: string]: number };
  description?: string;
  thumbnail?: string;
}



export default function StockPage() {
  const { stockList, addStockItem, updateStockItem, deleteStockItem, adjustStockItem, addSale, addToast, branchesList, patientsList, currentOrgId, currentUser } = useApp();
  const { activeBranch } = useBranch();
  const activeBranches = useMemo(() => branchesList.filter(branch => branch.status === 'Aktif' || (branch.status as string) === 'active'), [branchesList]);
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
  const [addProductError, setAddProductError] = useState('');
  const [quickSaleForm, setQuickSaleForm] = useState({
    patientId: '', stockItemId: '', paymentMethod: 'Nakit' as 'Nakit' | 'Kredi Kartı' | 'Havale', cashRegisterId: 'kas-1',
  });

  // Adjustment Form
  const [adjustmentQty, setAdjustmentQty] = useState(1);
  const [adjustmentType, setAdjustmentType] = useState<'artir' | 'azalt'>('artir');
  const [adjustmentReason, setAdjustmentReason] = useState('Sayım Düzeltmesi');
  const [isAdjustingStock, setIsAdjustingStock] = useState(false);
  const [adjustmentError, setAdjustmentError] = useState('');

  const openStockAdjustment = () => {
    setAdjustmentError('');
    setShowAdjustmentModal(true);
  };

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
    if (activeBranches.some(branch => branch.id === newItemForm.branch)) return;
    const singleBranchId = activeBranch.mode === 'single' ? activeBranch.branchId : '';
    const preferred = activeBranches.find(branch => branch.id === singleBranchId) || (activeBranches.length === 1 ? activeBranches[0] : undefined);
    setNewItemForm(form => ({ ...form, branch: preferred?.id || '' }));
  }, [activeBranches, activeBranch, newItemForm.branch]);

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
        const q = searchTerm.trim().toLocaleLowerCase('tr-TR');
        const matchName = item.name.toLowerCase().includes(q);
        const matchBrand = (item.brand || '').toLowerCase().includes(q);
        const matchModel = (item.model || '').toLowerCase().includes(q);
        const matchSerial = matchesInventoryIdentifier(item.serialNo, q);
        const matchBarcode = matchesInventoryIdentifier(item.barcode, q);
        const matchQuantity = `${item.quantity} adet`.includes(q);
        if (!matchName && !matchBrand && !matchModel && !matchSerial && !matchBarcode && !matchQuantity) return false;
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
  const quickSalePatients = patientsList.filter(patient => patient.branchId && BranchService.matchesBranch(patient.branch, patient.branchId, activeBranch));
  const quickSalePatient = quickSalePatients.find(patient => patient.id === quickSaleForm.patientId);
  const quickSaleProducts = scopedStockItems.filter(item => item.quantity > 0 && item.status === 'Stokta' && (!quickSalePatient || item.branchId === quickSalePatient.branchId));
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
      setAddProductError('Lütfen ürün adını giriniz.');
      return;
    }
    setAddProductError('');

    const selectedBranch = branchesList.find(branch => branch.id === newItemForm.branch);
    if (!selectedBranch) {
      setAddProductError('Lütfen erişiminiz olan geçerli bir şube seçin.');
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
      branch: selectedBranch.name,
      branchId: selectedBranch.id,
    };

    try {
      const savedItem = await addStockItem(itemToAdd);
      addToast({ type: 'success', message: `${itemToAdd.name} stoğa başarıyla eklendi.` });
      setShowAddModal(false);
      setActiveItem({
        ...savedItem,
        branchStockBreakdown: { [selectedBranch.name]: Number(newItemForm.quantity) },
        description: newItemForm.description || `${itemToAdd.brand} ${itemToAdd.model}`
      });
    } catch (error) {
      setAddProductError(error instanceof Error ? error.message : 'Ürün kaydedilemedi. Lütfen tekrar deneyin.');
    }
  };

  // Stock Adjustment
  const handleStockAdjustment = async () => {
    if (!activeItem || isAdjustingStock) return;
    if (!Number.isInteger(adjustmentQty) || adjustmentQty < 1) {
      setAdjustmentError('Hareket miktarı en az 1 adet tam sayı olmalıdır.');
      return;
    }
    const change = adjustmentType === 'artir' ? adjustmentQty : -adjustmentQty;
    if (change < 0 && activeItem.quantity + change < 0) {
      const message = 'Stok miktarı sıfırın altına düşemez.';
      setAdjustmentError(message);
      addToast({ type: 'error', message });
      return;
    }
    const newQty = activeItem.quantity + change;
    setAdjustmentError('');
    setIsAdjustingStock(true);
    try {
      await adjustStockItem(activeItem.id, change, adjustmentReason, 'Manuel işlem');
      setActiveItem({
        ...activeItem,
        quantity: newQty,
        branchStockBreakdown: {
          ...(activeItem.branchStockBreakdown || {}),
          [activeItem.branch]: newQty,
        },
      });
      setShowAdjustmentModal(false);
      if (drawerTab === 'hareketler') {
        try {
          const movements = await dbFetchStockMovements(activeItem.id);
          setStockMovements(movements as typeof stockMovements);
        } catch {
          addToast({ type: 'info', message: 'Stok güncellendi; hareket geçmişi yenilenemedi. Geçmiş sekmesini yeniden açın.' });
        }
      }
      addToast({ type: 'success', message: `${activeItem.name} stok adedi ${newQty} olarak güncellendi.` });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Stok hareketi kaydedilemedi. Lütfen tekrar deneyin.';
      setAdjustmentError(message);
      addToast({ type: 'error', message });
    } finally {
      setIsAdjustingStock(false);
    }
  };

  const handleQuickSale = async (event: React.FormEvent) => {
    event.preventDefault();
    const patient = patientsList.find(item => item.id === quickSaleForm.patientId);
    const item = stockList.find(stock => stock.id === quickSaleForm.stockItemId);
    if (!currentOrgId || !patient?.branchId || !item) {
      addToast({ type: 'error', message: 'Satış için hasta, ürün ve geçerli şube seçin. Satış kaydedilmedi.' });
      return;
    }
    if (item.branchId !== patient.branchId || !BranchService.matchesBranch(item.branch, item.branchId, activeBranch)) {
      addToast({ type: 'error', message: 'Ürün ve hasta aynı erişilebilir şubede olmalıdır. Satış kaydedilmedi.' });
      return;
    }
    if (item.quantity < 1 || item.status !== 'Stokta') {
      addToast({ type: 'error', message: 'Seçilen ürün stokta değil. Satış kaydedilmedi.' });
      return;
    }
    const saleAmount = Number(item.price);
    if (!Number.isFinite(saleAmount) || saleAmount <= 0) {
      addToast({ type: 'error', message: 'Ürün satış fiyatı geçerli değil. Önce ürün fiyatını düzenleyin.' });
      return;
    }
    try {
      await addSale({
        id: `sale-${crypto.randomUUID()}`,
        idempotencyKey: crypto.randomUUID(),
        patientId: patient.id,
        patientName: `${patient.firstName} ${patient.lastName}`.trim(),
        date: new Date().toISOString().slice(0, 10),
        items: [{ name: item.name, quantity: 1, price: saleAmount, stockItemId: item.id, serialNo: item.serialNo, barcode: item.barcode, type: item.category === 'Cihaz' ? 'Cihaz' : 'Aksesuar' }],
        total: saleAmount,
        sgkAmount: 0,
        patientAmount: saleAmount,
        paymentMethod: quickSaleForm.paymentMethod,
        status: 'Tahsil Edildi',
        branchId: patient.branchId,
      }, item.id, quickSaleForm.cashRegisterId.trim() || 'kas-1');
      setShowQuickSaleModal(false);
      setQuickSaleForm({ patientId: '', stockItemId: '', paymentMethod: 'Nakit', cashRegisterId: 'kas-1' });
    } catch {
      // addSale surfaces the database error and keeps the modal open for correction.
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
            onClick={() => { setAddProductError(''); setShowAddModal(true); }}
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
              if (activeItem) openStockAdjustment();
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
          {activeBranches.map(b => (
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
                                      openStockAdjustment();
                                    }}
                                  >
                                    ⇄ Stok Hareketi Ekle
                                  </button>
                                  <button
                                    className={styles.dropdownItem}
                                    onClick={event => {
                                      event.stopPropagation();
                                      setActiveActionMenuId(null);
                                      setShowQuickSaleModal(true);
                                    }}
                                  >
                                    🛒 Hızlı Satış Yap
                                  </button>
                                  <button
                                    className={styles.dropdownItem}
                                    onClick={event => {
                                      event.stopPropagation();
                                      setActiveActionMenuId(null);
                                      addToast({ type: 'info', message: `${item.name} (${item.serialNo}) için ÜTS durumu: ${item.utsStatus}` });
                                    }}
                                  >
                                    🛡 ÜTS Durumu Sorgula
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
                                    onClick={event => {
                                      event.stopPropagation();
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
              {filteredItems.length > 0 && <><div className={styles.pagination}>
                <button type="button" className={styles.pageBtn} aria-label="Önceki sayfa" disabled={currentTablePage <= 1} onClick={() => setCurrentTablePage(page => Math.max(1, page - 1))}>‹</button>
                {Array.from({ length: tablePageCount }, (_, index) => index + 1).map(page => <button type="button" key={page} className={`${styles.pageBtn} ${currentTablePage === page ? styles.pageBtnActive : ''}`} aria-current={currentTablePage === page ? 'page' : undefined} onClick={() => setCurrentTablePage(page)}>{page}</button>)}
                <button type="button" className={styles.pageBtn} aria-label="Sonraki sayfa" disabled={currentTablePage >= tablePageCount} onClick={() => setCurrentTablePage(page => Math.min(tablePageCount, page + 1))}>›</button>
              </div>

              <select aria-label="Sayfa başına ürün" className={styles.filterSelect} style={{ height: 32, minWidth: 90, padding: '0 8px' }} value={tablePageSize} onChange={event => setTablePageSize(Number(event.target.value))}>
                <option value={10}>10 / sayfa</option>
                <option value={25}>25 / sayfa</option>
                <option value={50}>50 / sayfa</option>
              </select></>}
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
                      {activeBranches.map(branch => (
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
                        onClick={openStockAdjustment}
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
                      placeholder="Örn: İşitme cihazı"
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
                      aria-label="Şube"
                      value={newItemForm.branch}
                      onChange={e => setNewItemForm({ ...newItemForm, branch: e.target.value })}
                    >
                      <option value="" disabled>Şube seçin</option>
                      {activeBranches.map(branch => <option key={branch.id} value={branch.id}>{branch.name}</option>)}
                    </select>
                  </div>
                </div>

                {addProductError && <div role="alert" style={{ color: '#b91c1c', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 12px', fontSize: 13 }}>{addProductError}</div>}

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
              <button type="button" className={styles.btnClear} onClick={() => setShowAdjustmentModal(false)}>Vazgeç</button>
              <button type="button" className={styles.btnPrimaryAction} onClick={() => void handleStockAdjustment()} disabled={isAdjustingStock} aria-busy={isAdjustingStock}>
                {isAdjustingStock ? 'Kaydediliyor…' : 'Hareketi Uygula'}
              </button>
            </div>
            {adjustmentError && <div role="alert" style={{ padding: '0 20px 16px', color: '#b91c1c', fontSize: 13 }}>{adjustmentError}</div>}
          </div>
        </div>
      )}

      {/* ── MODAL: Hızlı Satış ── */}
      {showQuickSaleModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.55)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'grid', placeItems: 'center', padding: 20 }}>
          <div style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 520, overflow: 'hidden', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid #e2e8f0' }}>
              <h3 style={{ margin: 0, fontSize: 17, color: '#0f172a' }}>Hızlı Satış Fişi / Çıkışı</h3>
              <button type="button" aria-label="Hızlı satış penceresini kapat" style={{ border: 'none', background: 'transparent', fontSize: 20, cursor: 'pointer', color: '#94a3b8' }} onClick={() => setShowQuickSaleModal(false)}>✕</button>
            </div>
            <form onSubmit={event => void handleQuickSale(event)} style={{ padding: 20, display: 'grid', gap: 12 }}>
              <div>
                <label htmlFor="quick-sale-patient" style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#334155', marginBottom: 4 }}>Kayıtlı Hasta</label>
                <select id="quick-sale-patient" required className={styles.filterSelect} style={{ width: '100%' }} value={quickSaleForm.patientId} onChange={event => setQuickSaleForm(form => ({ ...form, patientId: event.target.value, stockItemId: '' }))}>
                  <option value="">Satışın bağlanacağı hastayı seçin</option>
                  {quickSalePatients.map(patient => <option key={patient.id} value={patient.id}>{patient.firstName} {patient.lastName} · {patient.phone || patient.tc || 'Kayıtlı hasta'}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="quick-sale-product" style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#334155', marginBottom: 4 }}>Satılacak Ürün / Cihaz</label>
                <select id="quick-sale-product" required className={styles.filterSelect} style={{ width: '100%' }} value={quickSaleForm.stockItemId} disabled={!quickSalePatient} onChange={event => setQuickSaleForm(form => ({ ...form, stockItemId: event.target.value }))}>
                  <option value="">Stoktan ürün seçin</option>
                  {quickSaleProducts.map(i => (
                    <option key={i.id} value={i.id}>{i.name} — {formatCurrency(i.price)} (Stok: {i.quantity}){i.serialNo ? ` · Seri: ${i.serialNo}` : ''}</option>
                  ))}
                </select>
                {quickSalePatient && quickSaleProducts.length === 0 && <small role="status">Bu hastanın şubesinde satışa uygun stok bulunmuyor.</small>}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label htmlFor="quick-sale-payment" style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#334155', marginBottom: 4 }}>Ödeme Yöntemi</label>
                  <select id="quick-sale-payment" className={styles.filterSelect} style={{ width: '100%' }} value={quickSaleForm.paymentMethod} onChange={event => setQuickSaleForm(form => ({ ...form, paymentMethod: event.target.value as typeof form.paymentMethod }))}>
                    <option value="Nakit">Nakit</option>
                    <option value="Kredi Kartı">Kredi Kartı / POS</option>
                    <option value="Havale">Havale / EFT</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="quick-sale-register" style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#334155', marginBottom: 4 }}>Kasa Hesabı</label>
                  <input id="quick-sale-register" required className={styles.filterSelect} style={{ width: '100%' }} value={quickSaleForm.cashRegisterId} onChange={event => setQuickSaleForm(form => ({ ...form, cashRegisterId: event.target.value }))} />
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, paddingTop: 8 }}>
                <button type="button" className={styles.btnClear} onClick={() => setShowQuickSaleModal(false)}>Vazgeç</button>
                <button type="submit" className={styles.btnPrimaryAction} disabled={!quickSalePatient || !quickSaleProducts.length}>Satışı Onayla</button>
              </div>
            </form>
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
                    {activeBranches.map(branch => <option key={branch.id} value={branch.name}>{branch.name}</option>)}
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
