'use client';

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useBranch } from '../context/BranchContext';
import { BranchService } from '../services/BranchService';
import { stockItems, formatCurrency, type StockItem, type Patient } from '../data/mockData';
import { useDebounce } from '../hooks/useDebounce';
import { IconPlus, IconUpload, IconEdit, IconStock, IconCash, IconWarning, IconHearing, IconSearch } from '../components/Icons';

export default function StockPage() {
  const { stockList, updateStockItem, addStockItem, deleteStockItem, patientsList, updatePatient, addToast, setCurrentPage } = useApp();
  const { activeBranch } = useBranch();
  const [filterCategory, setFilterCategory] = useState('Tümü');
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState<StockItem | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  const [activeAddTab, setActiveAddTab] = useState<'info' | 'docs'>('info');
  const [activeEditTab, setActiveEditTab] = useState<'info' | 'docs'>('info');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [historyModalItem, setHistoryModalItem] = useState<StockItem | null>(null);
  const [hekModalItem, setHekModalItem] = useState<StockItem | null>(null);
  const [selectedHekType, setSelectedHekType] = useState<string | null>(null);
  const [adjustmentModalItem, setAdjustmentModalItem] = useState<StockItem | null>(null);
  const [showUtsImportModal, setShowUtsImportModal] = useState(false);
  const [autoCreateManufacturerToggle, setAutoCreateManufacturerToggle] = useState(true);
  const [showQuickSaleModal, setShowQuickSaleModal] = useState(false);
  const [quickSaleForm, setQuickSaleForm] = useState({
    customerName: '',
    items: [{ productId: '', qty: 1, price: 0 }],
    cashId: 'ana',
    paymentMethod: 'Nakit',
    paidAmount: 0
  });

  const [formData, setFormData] = useState({
    name: '',
    category: 'Cihaz' as StockItem['category'],
    brand: '',
    model: '',
    sku: '',
    deviceType: '',
    manufacturer: '',
    supplier: '',
    purchasePrice: 0,
    price: 0,
    vatRate: 10,
    quantity: 0,
    criticalLevel: 0,
    isAssigned: 'Evet (Zimmetli)',
    utsTrackType: 'Takip Yok',
    gtin: '',
    serialNo: '',
    productionDate: '',
    expiryDate: '',
    utsStatus: 'Bekliyor' as StockItem['utsStatus'],
    branch: 'Merkez 1 - Kadıköy' as StockItem['branch'],
    status: 'Stokta' as StockItem['status'],
    utsKurumNo: '954201',
    gln: '',
    mersisNo: ''
  });

  const handleSaveNew = () => {
    if (!formData.name) {
      addToast({ type: 'warning', message: 'Lütfen Ürün Adı alanını doldurunuz.' });
      return;
    }
    const newItem: StockItem = {
      id: `s-${Date.now().toString().slice(-6)}`,
      name: formData.name,
      brand: formData.brand || 'Genel',
      model: formData.model || formData.brand || 'Standart',
      category: formData.category,
      quantity: Number(formData.quantity) || 1,
      price: Number(formData.price) || 0,
      purchasePrice: Number(formData.purchasePrice) || 0,
      sgkPrice: Number(formData.price) * 0.4,
      warrantyExpiry: formData.expiryDate || '2028-07-10',
      location: 'Depo',
      serialNo: formData.serialNo || (formData.utsTrackType !== 'Takip Yok' ? `SN-${Math.floor(Math.random() * 900000 + 100000)}` : '—'),
      utsStatus: formData.utsTrackType !== 'Takip Yok' ? 'Bekliyor' : 'Gerekli Değil',
      branch: formData.branch,
      criticalLevel: Number(formData.criticalLevel) || 0,
      status: formData.status,
      utsKurumNo: formData.utsKurumNo || '954201',
      gln: formData.gtin || ''
    };
    addStockItem(newItem);
    setShowAddModal(false);
    // Reset form
    setFormData({
      name: '',
      category: 'Cihaz',
      brand: '',
      model: '',
      sku: '',
      deviceType: '',
      manufacturer: '',
      supplier: '',
      purchasePrice: 0,
      price: 0,
      vatRate: 10,
      quantity: 0,
      criticalLevel: 0,
      isAssigned: 'Evet (Zimmetli)',
      utsTrackType: 'Takip Yok',
      gtin: '',
      serialNo: '',
      productionDate: '',
      expiryDate: '',
      utsStatus: 'Bekliyor',
      branch: 'Merkez 1 - Kadıköy',
      status: 'Stokta',
      utsKurumNo: '954201',
      gln: '',
      mersisNo: ''
    });
    addToast({ type: 'success', message: `${newItem.name} ürünü stoğa başarıyla eklendi.` });
  };

  const handleSaveEdit = () => {
    if (!editingItem) return;
    updateStockItem(editingItem);
    setShowEditModal(false);
    setEditingItem(null);
  };

  // Fix #9: Şube filtresi BranchService.matchesBranch ile çalışıyor
  const branchFilteredStock = stockList.filter((item, index) => 
    BranchService.matchesBranch(item.branch, undefined, activeBranch, index)
  );

  const debouncedSearch = useDebounce(search, 300);

  const filtered = branchFilteredStock.filter(item => {
    const searchLower = debouncedSearch.toLowerCase().trim();
    const matchSearch = !searchLower || item.name.toLowerCase().includes(searchLower) || item.brand.toLowerCase().includes(searchLower);
    const matchCategory = filterCategory === 'Tümü' || item.category === filterCategory;
    return matchSearch && matchCategory;
  });

  const totalValue = branchFilteredStock.reduce((sum, i) => sum + (i.price * i.quantity), 0);
  const totalQuantity = branchFilteredStock.reduce((sum, i) => sum + i.quantity, 0);
  const lowStockCount = branchFilteredStock.filter(s => s.category === 'Pil' && s.quantity <= s.criticalLevel).length;
  const utsCount = branchFilteredStock.filter(s => s.utsStatus === 'Bildirildi').length;
  const utsDisiCount = branchFilteredStock.filter(s => s.utsStatus !== 'Bildirildi').length;

  const handleUtsNotification = (item: StockItem) => {
    if (!item.assignedPatientId) return;

    // 1. ÜTS durumunu bildirildi yap
    const updatedItem = {
      ...item,
      utsStatus: 'Bildirildi' as const
    };
    updateStockItem(updatedItem);

    // 2. Hastanın timeline'ına log ekle
    const p = patientsList.find(pt => pt.id === item.assignedPatientId);
    if (p) {
      const updatedPatient = {
        ...p,
        timeline: [
          { date: '10.07.2026', action: `Sağlık Bakanlığı ÜTS Bildirimi Başarılı. Cihaz: ${item.name}, Seri No: ${item.serialNo}`, icon: 'Check' },
          ...(p.timeline || [])
        ]
      };
      updatePatient(updatedPatient);
    }

    addToast({
      type: 'success',
      message: `${item.name} (${item.serialNo}) için ÜTS bildirim kaydı Sağlık Bakanlığı'na başarıyla iletildi.`
    });
  };

  return (
    <div className="page">
      <div className="page-header">
        <div className="page-header-left">
          <h2>Stok & Aksesuar Yönetimi</h2>
          <p>{stockList.length} ürün kayıtlı</p>
        </div>
        <div className="page-header-actions" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {/* 1. ÜTS'den Sorgula */}
          <button
            type="button"
            className="btn"
            onClick={() => setShowUtsImportModal(true)}
            style={{
              background: '#fff',
              border: '1px solid var(--gray-300)',
              color: '#0284c7',
              fontSize: '0.86rem',
              fontWeight: 500,
              padding: '7px 14px',
              borderRadius: 6,
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="7" />
              <rect x="14" y="3" width="7" height="7" />
              <rect x="14" y="14" width="7" height="7" />
              <rect x="3" y="14" width="7" height="7" />
            </svg>
            <span>ÜTS'den Sorgula</span>
          </button>

          {/* 2. Toplu Ekle */}
          <button
            type="button"
            className="btn"
            onClick={() => addToast({ type: 'info', message: 'Toplu ürün yüklemek için Excel / CSV dosyanızı seçin.' })}
            style={{
              background: '#fff',
              border: '1px solid var(--gray-300)',
              color: '#0284c7',
              fontSize: '0.86rem',
              fontWeight: 500,
              padding: '7px 14px',
              borderRadius: 6,
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            <span>Toplu Ekle</span>
          </button>

          {/* 3. Hızlı Satış */}
          <button
            type="button"
            className="btn"
            onClick={() => setShowQuickSaleModal(true)}
            style={{
              background: '#fff',
              border: '1px solid var(--gray-300)',
              color: '#0284c7',
              fontSize: '0.86rem',
              fontWeight: 500,
              padding: '7px 14px',
              borderRadius: 6,
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
            </svg>
            <span>Hızlı Satış</span>
          </button>

          {/* 4. Yeni Ürün Ekle */}
          <button className="btn btn-primary" onClick={() => setShowAddModal(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 16px', borderRadius: 6, background: '#0284c7', borderColor: '#0284c7' }}>
            <IconPlus size={15} strokeWidth={2} /> Yeni Ürün Ekle
          </button>
        </div>
      </div>

      {/* Stats Widgets */}
      <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginBottom: 20 }}>
        <div className="stat-card">
          <div className="stat-icon primary">
            <IconStock size={18} />
          </div>
          <div className="stat-content">
            <div className="stat-label">Toplam Ürün</div>
            <div className="stat-value">{stockList.length}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon info">
            <IconStock size={18} />
          </div>
          <div className="stat-content">
            <div className="stat-label">Toplam Stok</div>
            <div className="stat-value">{totalQuantity}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon success">
            <IconCash size={18} />
          </div>
          <div className="stat-content">
            <div className="stat-label">Stok Değeri</div>
            <div className="stat-value">{formatCurrency(totalValue)}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon info">
            <IconHearing size={18} />
          </div>
          <div className="stat-content">
            <div className="stat-label">ÜTS Durumu</div>
            <div className="stat-value" style={{ fontSize: '0.86rem', display: 'flex', alignItems: 'center', gap: 5, marginTop: 4, fontWeight: 600 }}>
              <span style={{ color: 'var(--success-600)', display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
                {utsCount} ÜTS'li
              </span>
              <span style={{ color: 'var(--gray-400)' }}>-</span>
              <span style={{ color: 'var(--gray-600)' }}>{utsDisiCount} ÜTS Dışı</span>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon danger">
            <IconWarning size={18} />
          </div>
          <div className="stat-content">
            <div className="stat-label">Kritik Stok</div>
            <div className="stat-value">{lowStockCount}</div>
            <span className="stat-change down">Sipariş gerekli</span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-body" style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <div className="header-search" style={{ flex: 1 }}>
            <span className="header-search-icon">
              <IconSearch size={15} strokeWidth={1.7} />
            </span>
            <input
              type="text"
              placeholder="Ürün adı veya marka ile ara..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: '100%' }}
            />
          </div>
          <div className="tabs">
            {['Tümü', 'Cihaz', 'Pil', 'Kalıp', 'Aksesuar'].map((cat) => (
              <button
                key={cat}
                className={`tab ${filterCategory === cat ? 'active' : ''}`}
                onClick={() => setFilterCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Stock Table */}
      <div className="card">
        <div className="table-container">
          <table className="mobile-cards">
            <thead>
              <tr>
                <th>Ürün</th>
                <th>Kategori</th>
                <th>Seri No / Şube</th>
                <th>Stok Adedi</th>
                <th>Cihaz Durumu</th>
                <th>ÜTS Durumu</th>
                <th>Fiyat</th>
                <th>Hasta (Alıcı)</th>
                <th>İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => {
                return (
                  <tr key={item.id}>
                    <td data-label="Ürün" className="td-primary">
                      <div>
                        <div style={{ fontWeight: 600 }}>{item.name}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--gray-500)' }}>{item.brand} {item.model}</div>
                        {item.utsKurumNo && (
                          <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                            <span style={{ fontSize: '0.64rem', fontFamily: 'var(--font-mono)', background: 'var(--gray-100)', color: 'var(--gray-600)', padding: '2px 4px', borderRadius: '4px' }}>
                              UIK: {item.utsKurumNo}
                            </span>
                            {item.gln && (
                              <span style={{ fontSize: '0.64rem', fontFamily: 'var(--font-mono)', background: 'var(--gray-100)', color: 'var(--gray-600)', padding: '2px 4px', borderRadius: '4px' }}>
                                GLN: {item.gln}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </td>
                    <td data-label="Kategori">
                      <span className={`badge badge-${
                        item.category === 'Cihaz' ? 'info' :
                        item.category === 'Pil' ? 'warning' : 'neutral'
                      }`}>
                        {item.category}
                      </span>
                    </td>
                    <td data-label="Seri No / Şube">
                      <div>
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', fontWeight: 600 }}>{item.serialNo}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--gray-500)' }}>{item.branch}</div>
                      </div>
                    </td>
                    <td data-label="Stok Adedi">
                      <span className={`badge badge-${item.quantity <= item.criticalLevel ? 'danger' : 'neutral'}`} style={{ fontWeight: 700 }}>
                        {item.quantity} Adet
                      </span>
                    </td>
                    <td data-label="Cihaz Durumu">
                      <span className={`badge badge-${
                        item.status === 'Stokta' ? 'success' :
                        item.status === 'Hastaya Ayrıldı' ? 'warning' :
                        item.status === 'Satıldı' ? 'info' : 'danger'
                      }`}>
                        {item.status}
                      </span>
                    </td>
                    <td data-label="ÜTS Durumu">
                      <span className={`badge badge-${
                        item.utsStatus === 'Bildirildi' ? 'success' :
                        item.utsStatus === 'Bekliyor' ? 'warning' : 'neutral'
                      }`}>
                        {item.utsStatus}
                      </span>
                    </td>
                    <td data-label="Fiyat">
                      <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)', marginBottom: 2 }}>
                        Alış: {formatCurrency(item.purchasePrice || Math.round(item.price * 0.1))}
                      </div>
                      <div style={{ fontWeight: 700, fontSize: '0.86rem', color: 'var(--gray-900)' }}>
                        Satış: {formatCurrency(item.price)}
                      </div>
                    </td>
                    <td data-label="Hasta (Alıcı)">
                      <div style={{ fontWeight: 500, fontSize: '0.84rem' }}>
                        {item.assignedPatientName || '—'}
                      </div>
                    </td>
                    <td data-label="İşlemler">
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                        {/* 1. Geçmiş / Hareketler Button */}
                        <button
                          type="button"
                          title="Hareket / İşlem Geçmişi"
                          onClick={() => setHistoryModalItem(item)}
                          style={{
                            width: 30,
                            height: 30,
                            borderRadius: 6,
                            border: '1px solid var(--gray-300)',
                            background: '#fff',
                            color: 'var(--gray-700)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            padding: 0
                          }}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                            <path d="M3 3v5h5" />
                            <path d="M12 7v5l4 2" />
                          </svg>
                        </button>

                        {/* 2. Düzenle Button */}
                        <button
                          type="button"
                          title="Ürünü Düzenle"
                          onClick={() => {
                            setEditingItem(item);
                            setShowEditModal(true);
                          }}
                          style={{
                            width: 30,
                            height: 30,
                            borderRadius: 6,
                            border: '1px solid var(--gray-300)',
                            background: '#fff',
                            color: 'var(--gray-700)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            padding: 0
                          }}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
                          </svg>
                        </button>

                        {/* 3. ÜTS Bildirimi / HEK Zayiat Button (Red Border) */}
                        <button
                          type="button"
                          title="HEK / Zayiat Bildirimi"
                          onClick={() => {
                            setSelectedHekType(null);
                            setHekModalItem(item);
                          }}
                          style={{
                            width: 30,
                            height: 30,
                            borderRadius: 6,
                            border: '1px solid #fca5a5',
                            background: '#fff',
                            color: '#ef4444',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: item.assignedPatientId ? 'pointer' : 'not-allowed',
                            opacity: item.assignedPatientId ? 1 : 0.65,
                            padding: 0
                          }}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                            <line x1="12" y1="9" x2="12" y2="13" />
                            <line x1="12" y1="17" x2="12.01" y2="17" />
                          </svg>
                        </button>

                        {/* 4. Stok Düzeltme / Zayiat (sebepli) Button (Blue Outline) */}
                        <button
                          type="button"
                          title="Stok Düzeltme / Zayiat (sebepli)"
                          onClick={() => setAdjustmentModalItem(item)}
                          style={{
                            width: 30,
                            height: 30,
                            borderRadius: 6,
                            border: '1.5px solid #3b82f6',
                            background: '#fff',
                            color: '#3b82f6',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            padding: 0
                          }}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                            <polyline points="14 2 14 8 20 8" />
                            <line x1="12" y1="18" x2="12" y2="12" />
                            <line x1="9" y1="15" x2="15" y2="15" />
                          </svg>
                        </button>

                        {/* 5. Sil Button (Red Border & Inline Popover Confirmation) */}
                        <div style={{ position: 'relative' }}>
                          <button
                            type="button"
                            title="Ürünü Sil"
                            onClick={() => setDeleteConfirmId(deleteConfirmId === item.id ? null : item.id)}
                            style={{
                              width: 30,
                              height: 30,
                              borderRadius: 6,
                              border: deleteConfirmId === item.id ? '1.5px solid #0284c7' : '1px solid #fca5a5',
                              background: '#fff',
                              color: '#ef4444',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer',
                              padding: 0
                            }}
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="3 6 5 6 21 6" />
                              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                              <line x1="10" y1="11" x2="10" y2="17" />
                              <line x1="14" y1="11" x2="14" y2="17" />
                            </svg>
                          </button>

                          {deleteConfirmId === item.id && (
                            <div style={{
                              position: 'absolute',
                              bottom: '100%',
                              right: 0,
                              marginBottom: 8,
                              background: '#fff',
                              borderRadius: 8,
                              padding: '12px 14px',
                              boxShadow: '0 10px 25px -5px rgba(0,0,0,0.15), 0 8px 10px -6px rgba(0,0,0,0.1)',
                              border: '1px solid var(--gray-200)',
                              zIndex: 50,
                              whiteSpace: 'nowrap',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: 10
                            }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem', fontWeight: 500, color: 'var(--gray-800)' }}>
                                <span style={{
                                  width: 18,
                                  height: 18,
                                  borderRadius: '50%',
                                  background: '#f59e0b',
                                  color: '#fff',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: '0.72rem',
                                  fontWeight: 700
                                }}>!</span>
                                Silmek istediğinize emin misiniz?
                              </div>
                              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                                <button
                                  type="button"
                                  onClick={() => setDeleteConfirmId(null)}
                                  style={{
                                    padding: '4px 12px',
                                    borderRadius: 6,
                                    border: '1px solid var(--gray-300)',
                                    background: '#fff',
                                    fontSize: '0.8rem',
                                    color: 'var(--gray-700)',
                                    cursor: 'pointer',
                                    fontWeight: 500
                                  }}
                                >
                                  Hayır
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    deleteStockItem(item.id);
                                    addToast({ type: 'success', message: `${item.name} stoğundan kaldırıldı.` });
                                    setDeleteConfirmId(null);
                                  }}
                                  style={{
                                    padding: '4px 14px',
                                    borderRadius: 6,
                                    border: 'none',
                                    background: '#0284c7',
                                    color: '#fff',
                                    fontSize: '0.8rem',
                                    cursor: 'pointer',
                                    fontWeight: 600
                                  }}
                                >
                                  Evet
                                </button>
                              </div>

                              {/* Arrow */}
                              <div style={{
                                position: 'absolute',
                                top: '100%',
                                right: 10,
                                width: 0,
                                height: 0,
                                borderLeft: '6px solid transparent',
                                borderRight: '6px solid transparent',
                                borderTop: '6px solid #fff'
                              }} />
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Stock Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 740, width: '95%', maxHeight: '92vh', display: 'flex', flexDirection: 'column' }}>
            <div className="modal-header" style={{ paddingBottom: 12 }}>
              <span className="modal-title" style={{ fontSize: '1.15rem', fontWeight: 700 }}>Yeni Ürün</span>
              <button className="modal-close" onClick={() => setShowAddModal(false)}>✕</button>
            </div>

            {/* Modal Navigation Tabs */}
            <div style={{ display: 'flex', gap: 24, borderBottom: '1px solid var(--gray-200)', padding: '0 24px' }}>
              <button
                type="button"
                onClick={() => setActiveAddTab('info')}
                style={{
                  background: 'none',
                  border: 'none',
                  padding: '10px 0',
                  fontWeight: 600,
                  fontSize: '0.88rem',
                  color: activeAddTab === 'info' ? '#0284c7' : 'var(--gray-500)',
                  borderBottom: activeAddTab === 'info' ? '2.5px solid #0284c7' : '2.5px solid transparent',
                  cursor: 'pointer'
                }}
              >
                Ürün Bilgileri
              </button>
              <button
                type="button"
                onClick={() => setActiveAddTab('docs')}
                style={{
                  background: 'none',
                  border: 'none',
                  padding: '10px 0',
                  fontWeight: 600,
                  fontSize: '0.88rem',
                  color: activeAddTab === 'docs' ? '#0284c7' : 'var(--gray-500)',
                  borderBottom: activeAddTab === 'docs' ? '2.5px solid #0284c7' : '2.5px solid transparent',
                  cursor: 'pointer'
                }}
              >
                Dökümanlar
              </button>
            </div>

            <div className="modal-body" style={{ overflowY: 'auto', padding: '20px 24px' }}>
              {activeAddTab === 'info' ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {/* Row 1: Ürün Adı & Kategori */}
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label" style={{ fontWeight: 600 }}>
                        <span style={{ color: '#ef4444', marginRight: 2 }}>*</span> Ürün Adı
                      </label>
                      <input
                        className="form-input"
                        placeholder="Ürün Adı"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label" style={{ fontWeight: 600 }}>
                        <span style={{ color: '#ef4444', marginRight: 2 }}>*</span> Kategori
                      </label>
                      <select
                        className="form-select"
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      >
                        <optgroup label="Cihazlar">
                          <option value="Cihaz">Cihaz</option>
                          <option value="İkinci El">İkinci El</option>
                          <option value="Yenilenmiş">Yenilenmiş</option>
                          <option value="Receiver (Hoparlörler)">Receiver (Hoparlörler)</option>
                        </optgroup>
                        <optgroup label="Kalıp ve Kulaklık">
                          <option value="Kulak Kalıpları">Kulak Kalıpları</option>
                          <option value="Prop / Dome">Prop / Dome</option>
                          <option value="İnce Tüp ve Hortumlar">İnce Tüp ve Hortumlar</option>
                        </optgroup>
                        <optgroup label="Sarf ve Bakım">
                          <option value="Sarf Malzeme">Sarf Malzeme</option>
                          <option value="Piller">Piller</option>
                          <option value="Filtreler (Wax Guard)">Filtreler (Wax Guard)</option>
                          <option value="Temizlik ve Bakım Ürünleri">Temizlik ve Bakım Ürünleri</option>
                          <option value="Yedek Parçalar">Yedek Parçalar</option>
                        </optgroup>
                        <optgroup label="Aksesuar ve Ekipman">
                          <option value="Aksesuar">Aksesuar</option>
                          <option value="Şarj Cihazları">Şarj Cihazları</option>
                          <option value="Kablosuz Aksesuarlar">Kablosuz Aksesuarlar</option>
                          <option value="Mikrofonlar">Mikrofonlar</option>
                          <option value="Bağlantı Cihazları (TV, Bluetooth vb.)">Bağlantı Cihazları (TV, Bluetooth vb.)</option>
                          <option value="Programlama Ekipmanları">Programlama Ekipmanları</option>
                        </optgroup>
                        <optgroup label="Diğer">
                          <option value="Diğer">Diğer</option>
                          <option value="UTS Dışı">UTS Dışı</option>
                        </optgroup>
                      </select>
                    </div>
                  </div>

                  {/* Row 2: Marka, Model, SKU */}
                  <div className="form-row-3">
                    <div className="form-group">
                      <label className="form-label">Marka</label>
                      <input
                        className="form-input"
                        placeholder="Marka yazın veya seçin"
                        value={formData.brand}
                        onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Model</label>
                      <input
                        className="form-input"
                        placeholder="Model yazın veya seçin"
                        value={formData.model}
                        onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Ürün Kodu (SKU)</label>
                      <input
                        className="form-input"
                        placeholder="SKU"
                        value={formData.sku}
                        onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                      />
                    </div>
                  </div>

                  {/* Row 3: Cihaz Tipi */}
                  <div className="form-group">
                    <label className="form-label">Cihaz Tipi</label>
                    <select
                      className="form-select"
                      value={formData.deviceType}
                      onChange={(e) => setFormData({ ...formData, deviceType: e.target.value })}
                    >
                      <option value="">Cihaz tipi seçin (örn: Kulak Arkası (BTE)...)</option>
                      <option value="Kulak Arkası (BTE)">Kulak Arkası (BTE)</option>
                      <option value="Kulak Arkası (RIC)">Kulak Arkası (RIC)</option>
                      <option value="Kulak İçi (ITE)">Kulak İçi (ITE)</option>
                      <option value="Kulak İçi - Kanal (ITC)">Kulak İçi - Kanal (ITC)</option>
                      <option value="Tam Kanal (CIC)">Tam Kanal (CIC)</option>
                    </select>
                  </div>

                  {/* Row 4: Üretici/İthalatçı & Tedarikçi */}
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        Üretici/İthalatçı (Opsiyonel)
                        <span style={{ cursor: 'help', color: 'var(--gray-400)', fontSize: '0.8rem' }} title="Ürünün üreticisi veya Türkiye ithalatçı firma bilgisi">ⓘ</span>
                      </label>
                      <select
                        className="form-select"
                        value={formData.manufacturer}
                        onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
                      >
                        <option value="">Üretici seçin</option>
                        <option value="Demant / Oticon Turkey">Demant / Oticon Turkey</option>
                        <option value="Sonova / Phonak Turkey">Sonova / Phonak Turkey</option>
                        <option value="GN Hearing / ReSound">GN Hearing / ReSound</option>
                        <option value="WSAudiology / Signia">WSAudiology / Signia</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        Tedarikçi (Opsiyonel)
                        <span style={{ cursor: 'help', color: 'var(--gray-400)', fontSize: '0.8rem' }} title="Ürünün tedarik edildiği toptancı/satıcı">ⓘ</span>
                      </label>
                      <select
                        className="form-select"
                        value={formData.supplier}
                        onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                      >
                        <option value="">Tedarikçi seçin</option>
                        <option value="Ana Depo">Ana Depo</option>
                        <option value="Medikal Tedarik A.Ş.">Medikal Tedarik A.Ş.</option>
                        <option value="Doğrudan İthalat">Doğrudan İthalat</option>
                      </select>
                    </div>
                  </div>

                  {/* Row 5: Alış Fiyatı, Satış Fiyatı, KDV Oranı */}
                  <div className="form-row-3">
                    <div className="form-group">
                      <label className="form-label">Alış Fiyatı</label>
                      <div style={{ position: 'relative' }}>
                        <input
                          className="form-input"
                          type="number"
                          placeholder="Alış Fiyatı"
                          value={formData.purchasePrice || ''}
                          onChange={(e) => setFormData({ ...formData, purchasePrice: Number(e.target.value) })}
                          style={{ paddingRight: 28 }}
                        />
                        <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-400)', fontSize: '0.85rem' }}>₺</span>
                      </div>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Satış Fiyatı</label>
                      <div style={{ position: 'relative' }}>
                        <input
                          className="form-input"
                          type="number"
                          placeholder="Satış Fiyatı"
                          value={formData.price || ''}
                          onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                          style={{ paddingRight: 28 }}
                        />
                        <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-400)', fontSize: '0.85rem' }}>₺</span>
                      </div>
                    </div>
                    <div className="form-group">
                      <label className="form-label">KDV Oranı %</label>
                      <input
                        className="form-input"
                        type="number"
                        placeholder="10"
                        value={formData.vatRate}
                        onChange={(e) => setFormData({ ...formData, vatRate: Number(e.target.value) })}
                      />
                    </div>
                  </div>

                  {/* Row 6: Mevcut Stok, Minimum Stok, Zimmetli mi? */}
                  <div className="form-row-3">
                    <div className="form-group">
                      <label className="form-label">Mevcut Stok</label>
                      <input
                        className="form-input"
                        type="number"
                        placeholder="0"
                        value={formData.quantity}
                        onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Minimum Stok Seviyesi</label>
                      <input
                        className="form-input"
                        type="number"
                        placeholder="0"
                        value={formData.criticalLevel}
                        onChange={(e) => setFormData({ ...formData, criticalLevel: Number(e.target.value) })}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Zimmetli mi?</label>
                      <select
                        className="form-select"
                        value={formData.isAssigned}
                        onChange={(e) => setFormData({ ...formData, isAssigned: e.target.value })}
                      >
                        <option value="Evet (Zimmetli)">Evet (Zimmetli)</option>
                        <option value="Hayır (Zimmetsiz)">Hayır (Zimmetsiz)</option>
                      </select>
                    </div>
                  </div>

                  {/* Section Divider: Ürün Kimlik Bilgileri */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '14px 0 8px' }}>
                    <div style={{ flex: 1, height: 1, background: 'var(--gray-200)' }} />
                    <span style={{ fontSize: '0.86rem', fontWeight: 600, color: 'var(--gray-700)' }}>Ürün Kimlik Bilgileri</span>
                    <div style={{ flex: 1, height: 1, background: 'var(--gray-200)' }} />
                  </div>

                  {/* Blue Info Callout Box */}
                  <div style={{
                    background: '#f0f9ff',
                    border: '1px solid #bae6fd',
                    borderRadius: 8,
                    padding: '12px 14px',
                    display: 'flex',
                    gap: 12,
                    alignItems: 'flex-start'
                  }}>
                    <div style={{
                      width: 22,
                      height: 22,
                      borderRadius: '50%',
                      background: '#0284c7',
                      color: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      flexShrink: 0,
                      marginTop: 1
                    }}>
                      i
                    </div>
                    <div style={{ fontSize: '0.81rem', color: '#0369a1', lineHeight: 1.45 }}>
                      <div style={{ fontWeight: 700, marginBottom: 2 }}>Bu alanlar zorunlu değil</div>
                      Elle eklenen ürüne de seri no / GTIN girebilirsiniz. Bu bilgileri girmeniz ürünü ÜTS'ye BİLDİRMEZ — ÜTS bildirimi yalnızca ÜTS envanterinden gelen ürünlerde yapılır.
                    </div>
                  </div>

                  {/* Row 7: ÜTS Takip Tipi & GTIN / Barkod */}
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label" style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <span style={{ color: '#ef4444' }}>*</span> ÜTS Takip Tipi
                        <span style={{ cursor: 'help', color: 'var(--gray-400)', fontSize: '0.8rem' }} title="ÜTS cihaz ve ürün seri numarası takip şekli">ⓘ</span>
                      </label>
                      <select
                        className="form-select"
                        value={formData.utsTrackType}
                        onChange={(e) => setFormData({ ...formData, utsTrackType: e.target.value })}
                      >
                        <option value="Tekil (Seri No ile Takip)">Tekil (Seri No ile Takip)</option>
                        <option value="Lot (Parti No ile Takip)">Lot (Parti No ile Takip)</option>
                        <option value="Takip Yok">Takip Yok</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        GTIN / Barkod (UNO)
                        <span style={{ cursor: 'help', color: 'var(--gray-400)', fontSize: '0.8rem' }} title="Küresel Ticari Ürün Numarası (GTIN)">ⓘ</span>
                      </label>
                      <div style={{ position: 'relative' }}>
                        <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-400)', fontSize: '0.85rem' }}>║▌</span>
                        <input
                          className="form-input"
                          placeholder="Örn: 05714880198904"
                          value={formData.gtin}
                          onChange={(e) => setFormData({ ...formData, gtin: e.target.value })}
                          style={{ paddingLeft: 34 }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Row 8: Üretim Tarihi & Son Kullanma Tarihi */}
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Üretim Tarihi (URT)</label>
                      <input
                        type="date"
                        className="form-input"
                        value={formData.productionDate}
                        onChange={(e) => setFormData({ ...formData, productionDate: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Son Kullanma Tarihi (SKT)</label>
                      <input
                        type="date"
                        className="form-input"
                        value={formData.expiryDate}
                        onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
              ) : (
                /* Tab 2: Dökümanlar */
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {[
                    { id: 'tech', title: 'Teknik Döküman' },
                    { id: 'manual', title: 'Kullanım Kılavuzu' },
                    { id: 'cert', title: 'Sertifika' },
                    { id: 'warranty', title: 'Garanti' },
                    { id: 'other', title: 'Diğer' }
                  ].map(doc => (
                    <div key={doc.id} style={{
                      border: '1px solid var(--gray-200)',
                      borderRadius: 8,
                      background: '#fff',
                      overflow: 'hidden'
                    }}>
                      <div style={{
                        padding: '10px 16px',
                        borderBottom: '1px solid var(--gray-200)',
                        fontSize: '0.86rem',
                        fontWeight: 600,
                        color: 'var(--gray-800)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6
                      }}>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                          <polyline points="14 2 14 8 20 8" />
                          <line x1="16" y1="13" x2="8" y2="13" />
                          <line x1="16" y1="17" x2="8" y2="17" />
                        </svg>
                        {doc.title}
                      </div>
                      <div style={{ padding: 12 }}>
                        <div style={{
                          border: '2px dashed #cbd5e1',
                          borderRadius: 8,
                          padding: '22px 16px',
                          background: '#f8fafc',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: 6,
                          cursor: 'pointer'
                        }}>
                          <div style={{
                            width: 44,
                            height: 44,
                            borderRadius: 8,
                            border: '1.5px solid #3b82f6',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#3b82f6',
                            background: '#eff6ff',
                            marginBottom: 2
                          }}>
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                            </svg>
                          </div>
                          <div style={{ fontSize: '0.88rem', fontWeight: 500, color: '#334155' }}>
                            PDF dosyasını buraya sürükleyin veya tıklayın
                          </div>
                          <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                            Maksimum dosya boyutu: 10MB
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="modal-footer" style={{ borderTop: '1px solid var(--gray-200)', padding: '12px 24px', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowAddModal(false)}
                style={{ padding: '8px 20px', borderRadius: 6 }}
              >
                İptal
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleSaveNew}
                style={{ padding: '8px 24px', borderRadius: 6, background: '#0284c7', borderColor: '#0284c7' }}
              >
                Tamam
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Stock Modal */}
      {showEditModal && editingItem && (
        <div className="modal-overlay" onClick={() => { setShowEditModal(false); setEditingItem(null); }}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 740, width: '95%', maxHeight: '92vh', display: 'flex', flexDirection: 'column' }}>
            <div className="modal-header" style={{ paddingBottom: 12 }}>
              <span className="modal-title" style={{ fontSize: '1.15rem', fontWeight: 700 }}>Ürün Düzenle</span>
              <button className="modal-close" onClick={() => { setShowEditModal(false); setEditingItem(null); }}>✕</button>
            </div>

            {/* Modal Navigation Tabs */}
            <div style={{ display: 'flex', gap: 24, borderBottom: '1px solid var(--gray-200)', padding: '0 24px' }}>
              <button
                type="button"
                onClick={() => setActiveEditTab('info')}
                style={{
                  background: 'none',
                  border: 'none',
                  padding: '10px 0',
                  fontWeight: 600,
                  fontSize: '0.88rem',
                  color: activeEditTab === 'info' ? '#0284c7' : 'var(--gray-500)',
                  borderBottom: activeEditTab === 'info' ? '2.5px solid #0284c7' : '2.5px solid transparent',
                  cursor: 'pointer'
                }}
              >
                Ürün Bilgileri
              </button>
              <button
                type="button"
                onClick={() => setActiveEditTab('docs')}
                style={{
                  background: 'none',
                  border: 'none',
                  padding: '10px 0',
                  fontWeight: 600,
                  fontSize: '0.88rem',
                  color: activeEditTab === 'docs' ? '#0284c7' : 'var(--gray-500)',
                  borderBottom: activeEditTab === 'docs' ? '2.5px solid #0284c7' : '2.5px solid transparent',
                  cursor: 'pointer'
                }}
              >
                Dökümanlar
              </button>
            </div>

            <div className="modal-body" style={{ overflowY: 'auto', padding: '20px 24px' }}>
              {activeEditTab === 'info' ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {/* Row 1: Ürün Adı & Kategori */}
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label" style={{ fontWeight: 600 }}>
                        <span style={{ color: '#ef4444', marginRight: 2 }}>*</span> Ürün Adı
                      </label>
                      <input
                        className="form-input"
                        placeholder="Ürün Adı"
                        value={editingItem.name}
                        onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label" style={{ fontWeight: 600 }}>
                        <span style={{ color: '#ef4444', marginRight: 2 }}>*</span> Kategori
                      </label>
                      <select
                        className="form-select"
                        value={editingItem.category}
                        onChange={(e) => setEditingItem({ ...editingItem, category: e.target.value })}
                      >
                        <optgroup label="Cihazlar">
                          <option value="Cihaz">Cihaz</option>
                          <option value="İkinci El">İkinci El</option>
                          <option value="Yenilenmiş">Yenilenmiş</option>
                          <option value="Receiver (Hoparlörler)">Receiver (Hoparlörler)</option>
                        </optgroup>
                        <optgroup label="Kalıp ve Kulaklık">
                          <option value="Kulak Kalıpları">Kulak Kalıpları</option>
                          <option value="Prop / Dome">Prop / Dome</option>
                          <option value="İnce Tüp ve Hortumlar">İnce Tüp ve Hortumlar</option>
                        </optgroup>
                        <optgroup label="Sarf ve Bakım">
                          <option value="Sarf Malzeme">Sarf Malzeme</option>
                          <option value="Piller">Piller</option>
                          <option value="Filtreler (Wax Guard)">Filtreler (Wax Guard)</option>
                          <option value="Temizlik ve Bakım Ürünleri">Temizlik ve Bakım Ürünleri</option>
                          <option value="Yedek Parçalar">Yedek Parçalar</option>
                        </optgroup>
                        <optgroup label="Aksesuar ve Ekipman">
                          <option value="Aksesuar">Aksesuar</option>
                          <option value="Şarj Cihazları">Şarj Cihazları</option>
                          <option value="Kablosuz Aksesuarlar">Kablosuz Aksesuarlar</option>
                          <option value="Mikrofonlar">Mikrofonlar</option>
                          <option value="Bağlantı Cihazları (TV, Bluetooth vb.)">Bağlantı Cihazları (TV, Bluetooth vb.)</option>
                          <option value="Programlama Ekipmanları">Programlama Ekipmanları</option>
                        </optgroup>
                        <optgroup label="Diğer">
                          <option value="Diğer">Diğer</option>
                          <option value="UTS Dışı">UTS Dışı</option>
                        </optgroup>
                      </select>
                    </div>
                  </div>

                  {/* Row 2: Marka, Model, SKU */}
                  <div className="form-row-3">
                    <div className="form-group">
                      <label className="form-label">Marka</label>
                      <input
                        className="form-input"
                        placeholder="Marka"
                        value={editingItem.brand}
                        onChange={(e) => setEditingItem({ ...editingItem, brand: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Model</label>
                      <input
                        className="form-input"
                        placeholder="Model"
                        value={editingItem.model}
                        onChange={(e) => setEditingItem({ ...editingItem, model: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Ürün Kodu (SKU)</label>
                      <input
                        className="form-input"
                        placeholder="SKU"
                        value={editingItem.serialNo || '11'}
                        onChange={(e) => setEditingItem({ ...editingItem, serialNo: e.target.value })}
                      />
                    </div>
                  </div>

                  {/* Row 3: Cihaz Tipi */}
                  <div className="form-group">
                    <label className="form-label">Cihaz Tipi</label>
                    <select
                      className="form-select"
                      value={editingItem.category === 'Cihaz' ? 'Kulak Arkası (BTE)' : 'Kulak Arkası (BTE)'}
                      onChange={() => {}}
                    >
                      <option value="Kulak Arkası (BTE)">Kulak Arkası (BTE)</option>
                      <option value="Kulak Arkası (RIC)">Kulak Arkası (RIC)</option>
                      <option value="Kulak İçi (ITE)">Kulak İçi (ITE)</option>
                      <option value="Kulak İçi - Kanal (ITC)">Kulak İçi - Kanal (ITC)</option>
                      <option value="Tam Kanal (CIC)">Tam Kanal (CIC)</option>
                    </select>
                  </div>

                  {/* Row 4: Üretici & Tedarikçi */}
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        Üretici/İthalatçı (Opsiyonel)
                        <span style={{ cursor: 'help', color: 'var(--gray-400)', fontSize: '0.8rem' }} title="Üretici / İthalatçı firma">ⓘ</span>
                      </label>
                      <select className="form-select">
                        <option value="">Üretici seçin</option>
                        <option value="Phonak">Phonak Turkey</option>
                        <option value="Oticon">Oticon İşitme A.Ş.</option>
                        <option value="Signia">Signia Türkiye</option>
                        <option value="Widex">Widex Medikal</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        Tedarikçi (Opsiyonel)
                        <span style={{ cursor: 'help', color: 'var(--gray-400)', fontSize: '0.8rem' }} title="Tedarikçi distribütör firma">ⓘ</span>
                      </label>
                      <select className="form-select">
                        <option value="">Tedarikçi seçin</option>
                        <option value="Ana Distribütör">Ana Distribütör</option>
                        <option value="Yerel Depo">Yerel Depo</option>
                      </select>
                    </div>
                  </div>

                  {/* Row 5: Fiyatlar & KDV */}
                  <div className="form-row-3">
                    <div className="form-group">
                      <label className="form-label">Alış Fiyatı</label>
                      <div style={{ position: 'relative' }}>
                        <input
                          type="number"
                          className="form-input"
                          value={editingItem.purchasePrice || Math.round(editingItem.price * 0.1)}
                          onChange={(e) => setEditingItem({ ...editingItem, purchasePrice: Number(e.target.value) })}
                          style={{ paddingRight: 28 }}
                        />
                        <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-400)', fontSize: '0.88rem' }}>₺</span>
                      </div>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Satış Fiyatı</label>
                      <div style={{ position: 'relative' }}>
                        <input
                          type="number"
                          className="form-input"
                          value={editingItem.price}
                          onChange={(e) => setEditingItem({ ...editingItem, price: Number(e.target.value) })}
                          style={{ paddingRight: 28 }}
                        />
                        <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-400)', fontSize: '0.88rem' }}>₺</span>
                      </div>
                    </div>
                    <div className="form-group">
                      <label className="form-label">KDV Oranı %</label>
                      <input
                        type="number"
                        className="form-input"
                        defaultValue={15}
                      />
                    </div>
                  </div>

                  {/* Row 6: Stok & Zimmet */}
                  <div className="form-row-3">
                    <div className="form-group">
                      <label className="form-label">Mevcut Stok</label>
                      <input
                        type="number"
                        className="form-input"
                        value={editingItem.quantity}
                        onChange={(e) => setEditingItem({ ...editingItem, quantity: Number(e.target.value) })}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Minimum Stok Seviyesi</label>
                      <input
                        type="number"
                        className="form-input"
                        value={editingItem.criticalLevel}
                        onChange={(e) => setEditingItem({ ...editingItem, criticalLevel: Number(e.target.value) })}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Zimmetli mi?</label>
                      <select
                        className="form-select"
                        value={editingItem.assignedPatientId ? 'Evet (Zimmetli)' : 'Evet (Zimmetli)'}
                        onChange={() => {}}
                      >
                        <option value="Evet (Zimmetli)">Evet (Zimmetli)</option>
                        <option value="Hayır (Zimmetsiz)">Hayır (Zimmetsiz)</option>
                      </select>
                    </div>
                  </div>

                  {/* Section Divider */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    margin: '8px 0 4px',
                    color: 'var(--gray-700)',
                    fontSize: '0.9rem',
                    fontWeight: 700
                  }}>
                    <div style={{ flex: 1, height: 1, background: 'var(--gray-200)' }} />
                    Ürün Kimlik Bilgileri
                    <div style={{ flex: 1, height: 1, background: 'var(--gray-200)' }} />
                  </div>

                  {/* Info Callout Box */}
                  <div style={{
                    background: '#f0f9ff',
                    border: '1px solid #bae6fd',
                    borderRadius: 8,
                    padding: '12px 14px',
                    display: 'flex',
                    gap: 10,
                    alignItems: 'flex-start'
                  }}>
                    <div style={{
                      width: 22,
                      height: 22,
                      borderRadius: '50%',
                      background: '#0284c7',
                      color: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      flexShrink: 0,
                      marginTop: 1
                    }}>
                      i
                    </div>
                    <div style={{ fontSize: '0.81rem', color: '#0369a1', lineHeight: 1.45 }}>
                      <div style={{ fontWeight: 700, marginBottom: 2 }}>Bu alanlar zorunlu değil</div>
                      Elle eklenen ürüne de seri no / GTIN girebilirsiniz. Bu bilgileri girmeniz ürünü ÜTS'ye BİLDİRMEZ — ÜTS bildirimi yalnızca ÜTS envanterinden gelen ürünlerde yapılır.
                    </div>
                  </div>

                  {/* Row 7: ÜTS Takip Tipi & GTIN / Barkod */}
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label" style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <span style={{ color: '#ef4444' }}>*</span> ÜTS Takip Tipi
                        <span style={{ cursor: 'help', color: 'var(--gray-400)', fontSize: '0.8rem' }} title="ÜTS cihaz ve ürün seri numarası takip şekli">ⓘ</span>
                      </label>
                      <select
                        className="form-select"
                        value={editingItem.utsStatus === 'Gerekli Değil' ? 'Takip Yok' : 'Takip Yok'}
                        onChange={() => {}}
                      >
                        <option value="Tekil (Seri No ile Takip)">Tekil (Seri No ile Takip)</option>
                        <option value="Lot (Parti No ile Takip)">Lot (Parti No ile Takip)</option>
                        <option value="Takip Yok">Takip Yok</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        GTIN / Barkod (UNO)
                        <span style={{ cursor: 'help', color: 'var(--gray-400)', fontSize: '0.8rem' }} title="Küresel Ticari Ürün Numarası (GTIN)">ⓘ</span>
                      </label>
                      <div style={{ position: 'relative' }}>
                        <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-400)', fontSize: '0.85rem' }}>║▌</span>
                        <input
                          className="form-input"
                          placeholder="Örn: 05714880198904"
                          defaultValue="05714880198904"
                          style={{ paddingLeft: 34 }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Row 8: Üretim Tarihi & Son Kullanma Tarihi */}
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Üretim Tarihi (URT)</label>
                      <input
                        type="date"
                        className="form-input"
                        defaultValue="2026-07-23"
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Son Kullanma Tarihi (SKT)</label>
                      <input
                        type="date"
                        className="form-input"
                        defaultValue="2026-09-30"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                /* Tab 2: Dökümanlar */
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {[
                    { id: 'tech', title: 'Teknik Döküman' },
                    { id: 'manual', title: 'Kullanım Kılavuzu' },
                    { id: 'cert', title: 'Sertifika' },
                    { id: 'warranty', title: 'Garanti' },
                    { id: 'other', title: 'Diğer' }
                  ].map(doc => (
                    <div key={doc.id} style={{
                      border: '1px solid var(--gray-200)',
                      borderRadius: 8,
                      background: '#fff',
                      overflow: 'hidden'
                    }}>
                      <div style={{
                        padding: '10px 16px',
                        borderBottom: '1px solid var(--gray-200)',
                        fontSize: '0.86rem',
                        fontWeight: 600,
                        color: 'var(--gray-800)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6
                      }}>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                          <polyline points="14 2 14 8 20 8" />
                          <line x1="16" y1="13" x2="8" y2="13" />
                          <line x1="16" y1="17" x2="8" y2="17" />
                        </svg>
                        {doc.title}
                      </div>
                      <div style={{ padding: 12 }}>
                        <div style={{
                          border: '2px dashed #cbd5e1',
                          borderRadius: 8,
                          padding: '22px 16px',
                          background: '#f8fafc',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: 6,
                          cursor: 'pointer'
                        }}>
                          <div style={{
                            width: 44,
                            height: 44,
                            borderRadius: 8,
                            border: '1.5px solid #3b82f6',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#3b82f6',
                            background: '#eff6ff',
                            marginBottom: 2
                          }}>
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                            </svg>
                          </div>
                          <div style={{ fontSize: '0.88rem', fontWeight: 500, color: '#334155' }}>
                            PDF dosyasını buraya sürükleyin veya tıklayın
                          </div>
                          <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                            Maksimum dosya boyutu: 10MB
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="modal-footer" style={{ borderTop: '1px solid var(--gray-200)', padding: '12px 24px', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => { setShowEditModal(false); setEditingItem(null); }}
                style={{ padding: '8px 20px', borderRadius: 6 }}
              >
                İptal
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleSaveEdit}
                style={{ padding: '8px 24px', borderRadius: 6, background: '#0284c7', borderColor: '#0284c7' }}
              >
                Tamam
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stock Item History Modal */}
      {historyModalItem && (
        <div className="modal-overlay" onClick={() => setHistoryModalItem(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 520, width: '90%', borderRadius: 12, padding: '24px 28px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, color: 'var(--gray-900)' }}>
                Hareketler - {historyModalItem.name}
              </h3>
              <button
                type="button"
                onClick={() => setHistoryModalItem(null)}
                style={{ background: 'none', border: 'none', fontSize: '1.2rem', color: 'var(--gray-400)', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            {/* Product Summary Header Card */}
            <div style={{
              background: '#f8fafc',
              borderRadius: 10,
              padding: '14px 18px',
              marginBottom: 24,
              border: '1px solid #f1f5f9'
            }}>
              <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--gray-900)' }}>
                {historyModalItem.name}
              </div>
              <div style={{ fontSize: '0.82rem', color: 'var(--gray-500)', marginTop: 2 }}>
                {historyModalItem.brand} - {historyModalItem.model}
              </div>
            </div>

            {/* Empty State Illustration & Text */}
            <div style={{ padding: '20px 20px 30px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
              <div style={{
                width: 72,
                height: 72,
                borderRadius: '50%',
                background: '#f1f5f9',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 4
              }}>
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 8v13H3V8" />
                  <path d="M1 3h22v5H1z" />
                  <path d="M10 12h4" />
                </svg>
              </div>
              <div style={{ fontSize: '0.88rem', color: '#64748b', fontWeight: 500 }}>
                Bu ürün için hareket kaydı bulunamadı
              </div>
            </div>
          </div>
        </div>
      )}

      {/* HEK / Zayiat Bildirimi Modal */}
      {hekModalItem && (
        <div className="modal-overlay" onClick={() => setHekModalItem(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 740, width: '95%', maxHeight: '92vh', display: 'flex', flexDirection: 'column', borderRadius: 12 }}>
            <div className="modal-header" style={{ padding: '16px 24px', borderBottom: '1px solid var(--gray-200)' }}>
              <span className="modal-title" style={{ fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6, color: '#dc2626' }}>
                <span>⚠️</span> HEK / Zayiat Bildirimi
              </span>
              <button className="modal-close" onClick={() => setHekModalItem(null)}>✕</button>
            </div>

            <div className="modal-body" style={{ overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* Red Warning Callout Box */}
              <div style={{
                background: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: 8,
                padding: '16px 18px',
                display: 'flex',
                gap: 12,
                alignItems: 'flex-start'
              }}>
                <div style={{
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  background: '#ef4444',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.9rem',
                  fontWeight: 700,
                  flexShrink: 0,
                  marginTop: 2
                }}>
                  !
                </div>
                <div style={{ fontSize: '0.83rem', color: '#991b1b', lineHeight: 1.5 }}>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: 4, color: '#7f1d1d' }}>
                    Bu işlem geri alınamaz
                  </div>
                  <div>
                    HEK/Zayiat kaydı oluşturulduğunda ürün kalıcı olarak stoktan düşürülür. ÜTS'ye bildirim yapılması durumunda ürün ÜTS'de "HEK" (Hurda/Enkaz/Köhne) durumuna geçer.
                  </div>
                  <div style={{ marginTop: 6, fontSize: '0.78rem', color: '#b91c1c' }}>
                    HEK = Hurda / Enkaz / Köhne kelimelerinin kısaltmasıdır. Ekonomik ömrünü tamamlayan veya zayi olan tıbbi cihazlar için ÜTS'ye yapılan zorunlu bildirimdir.
                  </div>
                </div>
              </div>

              {/* Section 1: Ürün Bilgileri Table Grid */}
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.92rem', marginBottom: 8, color: 'var(--gray-900)' }}>
                  Ürün Bilgileri
                </div>
                <div style={{ border: '1px solid var(--gray-200)', borderRadius: 8, overflow: 'hidden' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', borderBottom: '1px solid var(--gray-200)' }}>
                    <div style={{ padding: '8px 12px', background: '#f8fafc', fontWeight: 600, fontSize: '0.83rem', color: 'var(--gray-600)', borderRight: '1px solid var(--gray-200)' }}>Ürün Adı</div>
                    <div style={{ padding: '8px 12px', fontWeight: 600, fontSize: '0.85rem' }}>{hekModalItem.name}</div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr 100px 1fr' }}>
                    <div style={{ padding: '8px 12px', background: '#f8fafc', fontWeight: 600, fontSize: '0.83rem', color: 'var(--gray-600)', borderRight: '1px solid var(--gray-200)' }}>Marka</div>
                    <div style={{ padding: '8px 12px', fontSize: '0.85rem', borderRight: '1px solid var(--gray-200)' }}>{hekModalItem.brand} / {hekModalItem.model}</div>
                    <div style={{ padding: '8px 12px', background: '#f8fafc', fontWeight: 600, fontSize: '0.83rem', color: 'var(--gray-600)', borderRight: '1px solid var(--gray-200)' }}>Stok</div>
                    <div style={{ padding: '8px 12px', fontSize: '0.85rem', fontWeight: 600 }}>{hekModalItem.quantity}</div>
                  </div>
                </div>
              </div>

              {/* Section 2: HEK/Zayiat Türü */}
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.92rem', marginBottom: 8, color: 'var(--gray-900)' }}>
                  HEK/Zayiat Türü
                </div>

                {/* Blue Info Callout */}
                <div style={{
                  background: '#f0f9ff',
                  border: '1px solid #bae6fd',
                  borderRadius: 8,
                  padding: '10px 14px',
                  display: 'flex',
                  gap: 10,
                  alignItems: 'center',
                  marginBottom: 14
                }}>
                  <div style={{ width: 20, height: 20, borderRadius: '50%', background: '#0284c7', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700 }}>i</div>
                  <div style={{ fontSize: '0.81rem', color: '#0369a1' }}>
                    <span style={{ fontWeight: 600 }}>Ürünün neden kullanım dışı bırakıldığını belirten türü seçin</span>
                    <div style={{ fontSize: '0.76rem', color: '#0284c7', marginTop: 1 }}>Seçtiğiniz tür ÜTS'ye (Ürün Takip Sistemi) bildirilecektir. Her tür için farklı yasal süreçler geçerli olabilir.</div>
                  </div>
                </div>

                {/* Radio Options List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {[
                    { id: 'HEK', title: 'HEK (Hurda/Enkaz/Köhne)', tag: 'HEK', desc: 'Ürün ekonomik ömrünü tamamlamıştır veya tamir edilemez düzeyde arızalıdır. İşitme cihazlarında genellikle tamiri mümkün olmayan elektronik arıza, fiziksel hasar (kırılma, su hasarı) veya teknolojik eskime nedeniyle kullanılır. Ürün artık kullanılamaz durumdadır ve hurdaya ayrılacaktır.' },
                    { id: 'DOGAL_AFET', title: 'Doğal Afet', tag: 'DOGAL_AFET', desc: 'Ürün deprem, sel, fırtına gibi doğal afet nedeniyle zarar görmüştür. Doğal afet sonucu kullanılamaz hale gelen tüm tıbbi cihazlar için bu tür seçilir.' },
                    { id: 'YANGIN', title: 'Yangın', tag: 'YANGIN', desc: 'Ürün yangın nedeniyle hasar görmüş ve kullanılamaz hale gelmiştir. Yangın hasarı sonucu fonksiyonunu yitiren cihazlar için kullanılır.' },
                    { id: 'CALINMA', title: 'Çalınma', tag: 'CALINMA', desc: 'Ürün çalınmıştır. Hırsızlık sonucu kaybedilen tıbbi cihazlar için bu tür seçilir. Çalıntı bildirimi yapıldığında ilgili yasal süreçlerin de başlatılması önerilir.' },
                    { id: 'STOK_DUZELTME', title: 'Stok Düzeltme', tag: 'STOK_DUZELTME', desc: 'Stok sayımı sonucunda fiziksel olarak bulunamayan ürün için kullanılır. Envanter sayımında eksik çıkan, ancak çalıntı veya kayıp olduğu kesin olmayan ürünler için bu tür tercih edilir. Sayım farkını ÜTS ile uyumlu hale getirir.' },
                    { id: 'DIGER', title: 'Diğer', tag: 'DIGER', desc: 'Yukarıdaki kategorilere uymayan durumlar için kullanılır. Bu tür seçildiğinde açıklama alanı zorunludur ve durumun detaylı açıklaması yazılmalıdır. Örneğin: üretici geri çağırma, yasal el koyma, vb.' }
                  ].map((option) => (
                    <label key={option.id} style={{ display: 'flex', gap: 10, cursor: 'pointer', alignItems: 'flex-start' }}>
                      <input
                        type="radio"
                        name="hekType"
                        value={option.id}
                        checked={selectedHekType === option.id}
                        onChange={() => setSelectedHekType(option.id)}
                        style={{ marginTop: 3, accentColor: '#0284c7' }}
                      />
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600, fontSize: '0.88rem', color: 'var(--gray-900)' }}>
                          {option.title}
                          <span style={{ fontSize: '0.66rem', fontWeight: 600, background: '#fecaca', color: '#dc2626', padding: '1px 5px', borderRadius: 4 }}>{option.tag}</span>
                        </div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--gray-500)', lineHeight: 1.45, marginTop: 2 }}>
                          {option.desc}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Section 3: Açıklama (isteğe bağlı) */}
              <div>
                <label className="form-label" style={{ fontWeight: 600 }}>Açıklama (isteğe bağlı)</label>
                <textarea
                  className="form-input"
                  rows={2}
                  placeholder="HEK/Zayiat ile ilgili ek notlar..."
                  style={{ width: '100%', resize: 'vertical' }}
                />
              </div>

              {/* Section 4: UTS Bildirimi */}
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.92rem', marginBottom: 8, color: 'var(--gray-900)' }}>
                  ÜTS Bildirimi
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <label style={{ display: 'flex', gap: 10, cursor: 'pointer', alignItems: 'flex-start' }}>
                    <input type="radio" name="utsOption" defaultChecked style={{ marginTop: 3, accentColor: '#0284c7' }} />
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600, fontSize: '0.88rem', color: 'var(--gray-900)' }}>
                        HEK/Zayiat Bildirimi Gönder
                        <span style={{ fontSize: '0.66rem', fontWeight: 600, background: '#e0f2fe', color: '#0284c7', padding: '1px 6px', borderRadius: 4 }}>Önerilen</span>
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--gray-500)', lineHeight: 1.45, marginTop: 2 }}>
                        ÜTS'ye HEK/Zayiat bildirimi gönderilir. Ürün ÜTS'de kalıcı olarak "HEK" (Hurda/Enkaz/Köhne) durumuna geçer. Bu bildirim, ürünün artık kullanılamaz olduğunu ve stoktan kalıcı olarak çıktığını resmi kayıt altına alır. ÜTS'de bu ürün üzerinde başka bildirim yapılamaz (iptal hariç).
                      </div>
                    </div>
                  </label>
                  <label style={{ display: 'flex', gap: 10, cursor: 'pointer', alignItems: 'flex-start' }}>
                    <input type="radio" name="utsOption" style={{ marginTop: 3, accentColor: '#0284c7' }} />
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600, fontSize: '0.88rem', color: 'var(--gray-900)' }}>
                        ÜTS İşlemi Yapma
                        <span style={{ fontSize: '0.66rem', fontWeight: 600, background: 'var(--gray-100)', color: 'var(--gray-600)', padding: '1px 6px', borderRadius: 4 }}>ÜTS'ye bildirim gitmez</span>
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--gray-500)', lineHeight: 1.45, marginTop: 2 }}>
                        Hiçbir ÜTS bildirimi gönderilmez. Sadece CRM'deki HEK kaydı oluşturulur ve ürün stoktan düşürülür. ÜTS'deki ürün durumu değişmez. Bu seçenek, ÜTS bildirimi daha sonra manuel yapılacaksa kullanılabilir.
                      </div>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            <div className="modal-footer" style={{ borderTop: '1px solid var(--gray-200)', padding: '12px 24px', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setHekModalItem(null)}
                style={{ padding: '8px 20px', borderRadius: 6 }}
              >
                İptal
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                disabled={!selectedHekType}
                onClick={() => {
                  if (!selectedHekType) return;
                  deleteStockItem(hekModalItem.id);
                  addToast({ type: 'warning', message: `${hekModalItem.name} için HEK / Zayiat kaydı oluşturuldu ve ürün stoktan düşürüldü.` });
                  setHekModalItem(null);
                }}
                style={{
                  padding: '8px 20px',
                  borderRadius: 6,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  color: selectedHekType ? '#dc2626' : '#94a3b8',
                  background: selectedHekType ? '#fff' : '#f8fafc',
                  border: selectedHekType ? '1px solid #fca5a5' : '1px solid #e2e8f0',
                  fontWeight: 600,
                  cursor: selectedHekType ? 'pointer' : 'not-allowed',
                  opacity: selectedHekType ? 1 : 0.75
                }}
              >
                <span style={{ opacity: selectedHekType ? 1 : 0.4 }}>⚠️</span> HEK/Zayiat Kaydı Oluştur
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stok Düzeltme / Zayiat Modal */}
      {adjustmentModalItem && (
        <div className="modal-overlay" onClick={() => setAdjustmentModalItem(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 540, width: '92%', borderRadius: 12, padding: '20px 24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
              <div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0, color: 'var(--gray-900)' }}>
                  Stok Düzeltme / Zayiat — {adjustmentModalItem.name}
                </h3>
                <div style={{ fontSize: '0.82rem', color: 'var(--gray-600)', marginTop: 4 }}>
                  Mevcut stok: <strong style={{ color: 'var(--gray-900)' }}>{adjustmentModalItem.quantity}</strong>
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--gray-500)', marginTop: 2, lineHeight: 1.4 }}>
                  Bu işlem satış değildir — stok, seçtiğiniz sebeeple kayıt altına alınarak düşürülür ve ürünün Hareketler penceresinde görünür.
                </div>
              </div>
              <button
                type="button"
                onClick={() => setAdjustmentModalItem(null)}
                style={{ background: 'none', border: 'none', fontSize: '1.2rem', color: 'var(--gray-400)', cursor: 'pointer', padding: 0 }}
              >
                ✕
              </button>
            </div>

            {/* Blue Callout Info Box */}
            <div style={{
              background: '#f0f9ff',
              border: '1px solid #bae6fd',
              borderRadius: 8,
              padding: '12px 14px',
              display: 'flex',
              gap: 10,
              alignItems: 'flex-start',
              margin: '14px 0 18px'
            }}>
              <div style={{ width: 20, height: 20, borderRadius: '50%', background: '#0284c7', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700, flexShrink: 0, marginTop: 1 }}>i</div>
              <div style={{ fontSize: '0.81rem', color: '#0369a1', lineHeight: 1.45 }}>
                <div style={{ fontWeight: 700, marginBottom: 2, color: '#0c4a6e' }}>Bu ekran sarf malzeme ve ÜTS dışı ürünler içindir.</div>
                ÜTS'ye kayıtlı (barkodlu) cihazlar bu ekrandan düzeltilemez; onların zayiatı, Bakanlığa bildirim gönderen HEK / Zayiat işlemiyle yapılır. Bu nedenle ÜTS'li cihazların satırında bu buton görünmez.
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Field 1: İşlem */}
              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 600 }}>
                  <span style={{ color: '#ef4444', marginRight: 2 }}>*</span> İşlem
                </label>
                <select className="form-select">
                  <option value="azalt">Stok Azalt (zayiat/kayıp)</option>
                  <option value="artir">Stok Artır (sayım fazlası)</option>
                  <option value="duzelt">Stok Düzelt (sayım eşitleme)</option>
                </select>
              </div>

              {/* Field 2: Adet */}
              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 600 }}>
                  <span style={{ color: '#ef4444', marginRight: 2 }}>*</span> Adet
                </label>
                <input
                  type="number"
                  className="form-input"
                  defaultValue={1}
                  min={1}
                />
              </div>

              {/* Field 3: Sebep */}
              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 600 }}>
                  <span style={{ color: '#ef4444', marginRight: 2 }}>*</span> Sebep
                </label>
                <select className="form-select" defaultValue="">
                  <option value="" disabled>Sebep seçin</option>
                  <option value="kirilma">Kırılma / Bozulma</option>
                  <option value="kayıp">Kaybolma / Eksik Sayım</option>
                  <option value="tarih">Tarihi Geçti / Bozuldu</option>
                  <option value="test">Test / Numune Kullanımı</option>
                  <option value="sayim">Sayım Düzeltmesi</option>
                  <option value="digar">Diğer</option>
                </select>
              </div>

              {/* Field 4: Açıklama */}
              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 600 }}>Açıklama</label>
                <textarea
                  className="form-input"
                  rows={2}
                  placeholder="Ne oldu? (opsiyonel, Diğer'de zorunlu)"
                  style={{ width: '100%', resize: 'vertical' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20, borderTop: '1px solid var(--gray-100)', paddingTop: 14 }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setAdjustmentModalItem(null)}
                style={{ padding: '8px 20px', borderRadius: 6 }}
              >
                İptal
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  addToast({ type: 'success', message: `${adjustmentModalItem.name} stok düzeltme işlemi kaydedildi.` });
                  setAdjustmentModalItem(null);
                }}
                style={{ padding: '8px 24px', borderRadius: 6, background: '#0284c7', borderColor: '#0284c7' }}
              >
                Kaydet
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ÜTS Envanter İçe Aktar Modal */}
      {showUtsImportModal && (
        <div className="modal-overlay" onClick={() => setShowUtsImportModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 640, width: '92%', borderRadius: 12, padding: '24px 28px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <span className="modal-title" style={{ fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8, color: 'var(--gray-900)' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="7" height="7" />
                  <rect x="14" y="3" width="7" height="7" />
                  <rect x="14" y="14" width="7" height="7" />
                  <rect x="3" y="14" width="7" height="7" />
                </svg>
                ÜTS Envanter İçe Aktar
              </span>
              <button className="modal-close" onClick={() => setShowUtsImportModal(false)} style={{ background: 'none', border: 'none', fontSize: '1.2rem', color: 'var(--gray-400)', cursor: 'pointer' }}>✕</button>
            </div>

            {/* Otomatik Kayıt Tercihleri */}
            <div style={{ background: '#fafafa', borderRadius: 8, padding: '16px 18px', border: '1px solid var(--gray-200)', marginBottom: 20 }}>
              <div style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--gray-900)', marginBottom: 2 }}>
                Otomatik Kayıt Tercihleri
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--gray-500)', marginBottom: 14 }}>
                Marka ve model serbest metin olarak ÜTS ürün tanımından otomatik yazılır (ön kayıt gerekmez).
              </div>

              <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                {/* Toggle Switch */}
                <div
                  onClick={() => setAutoCreateManufacturerToggle(!autoCreateManufacturerToggle)}
                  style={{
                    width: 38,
                    height: 22,
                    borderRadius: 11,
                    background: autoCreateManufacturerToggle ? '#0284c7' : '#cbd5e1',
                    position: 'relative',
                    cursor: 'pointer',
                    transition: 'background 0.2s ease',
                    flexShrink: 0,
                    marginTop: 2
                  }}
                >
                  <div
                    style={{
                      width: 18,
                      height: 18,
                      borderRadius: '50%',
                      background: '#fff',
                      position: 'absolute',
                      top: 2,
                      left: autoCreateManufacturerToggle ? 18 : 2,
                      transition: 'left 0.2s ease',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
                    }}
                  />
                </div>

                <div
                  onClick={() => setAutoCreateManufacturerToggle(!autoCreateManufacturerToggle)}
                  style={{ cursor: 'pointer' }}
                >
                  <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--gray-900)' }}>
                    Eksik üretici/ithalatçıları otomatik oluştur
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--gray-500)', marginTop: 2, lineHeight: 1.4 }}>
                    ÜTS'den gelen üretici/ithalatçı firmalar 'Uyarlamalar &gt; Üretici Yönetimi' sayfasına otomatik eklenecek (firma unvanı ÜTS'den çekilir).
                  </div>
                </div>
              </div>
            </div>

            {/* Red Error Box */}
            <div style={{
              background: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: 8,
              padding: '16px 18px',
              display: 'flex',
              gap: 12,
              alignItems: 'flex-start',
              position: 'relative'
            }}>
              <div style={{
                width: 24,
                height: 24,
                borderRadius: '50%',
                background: '#ef4444',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.82rem',
                fontWeight: 700,
                flexShrink: 0,
                marginTop: 1
              }}>
                ✕
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 700, fontSize: '0.92rem', color: '#991b1b' }}>Hata</span>
                  <span style={{ cursor: 'pointer', color: '#991b1b', fontSize: '0.9rem' }} onClick={() => setShowUtsImportModal(false)}>✕</span>
                </div>
                <div style={{ fontSize: '0.84rem', color: '#b91c1c', marginTop: 4 }}>
                  ÜTS ayarları tamamlanmamış (token + enabled gerekli)
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Hızlı Satış Modal */}
      {showQuickSaleModal && (
        <div className="modal-overlay" onClick={() => setShowQuickSaleModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 740, width: '95%', maxHeight: '92vh', display: 'flex', flexDirection: 'column', borderRadius: 12 }}>
            <div className="modal-header" style={{ padding: '16px 24px', borderBottom: '1px solid var(--gray-200)' }}>
              <span className="modal-title" style={{ fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6, color: 'var(--gray-900)' }}>
                <span>⚡</span> Hızlı Satış
              </span>
              <button className="modal-close" onClick={() => setShowQuickSaleModal(false)}>✕</button>
            </div>

            <div className="modal-body" style={{ overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 18 }}>
              {/* Blue Info Callout */}
              <div style={{
                background: '#f0f9ff',
                border: '1px solid #bae6fd',
                borderRadius: 8,
                padding: '14px 16px',
                display: 'flex',
                gap: 12,
                alignItems: 'flex-start'
              }}>
                <div style={{ width: 22, height: 22, borderRadius: '50%', background: '#0284c7', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.78rem', fontWeight: 700, flexShrink: 0, marginTop: 1 }}>i</div>
                <div style={{ fontSize: '0.83rem', color: '#0369a1', lineHeight: 1.45 }}>
                  <div style={{ fontWeight: 700, fontSize: '0.92rem', marginBottom: 3, color: '#0c4a6e' }}>Hızlı Satış (Hastasız)</div>
                  Hasta/tedarikçi seçmeden yalnızca ÜTS'siz (Takipsiz) ürünler satılır. Belge ve ÜTS bildirimi üretilmez; stok düşer, kasaya işlenir.
                </div>
              </div>

              {/* Müşteri Adı */}
              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 500, color: 'var(--gray-700)' }}>
                  Müşteri Adı <span style={{ color: 'var(--gray-400)', fontWeight: 400 }}>(opsiyonel)</span>
                </label>
                <input
                  className="form-input"
                  placeholder="İsteğe bağlı"
                  value={quickSaleForm.customerName}
                  onChange={(e) => setQuickSaleForm({ ...quickSaleForm, customerName: e.target.value })}
                />
              </div>

              {/* Ürünler Section */}
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.92rem', marginBottom: 10, color: 'var(--gray-900)' }}>
                  Ürünler
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {quickSaleForm.items.map((row, idx) => (
                    <div key={idx} style={{ border: '1px solid var(--gray-200)', borderRadius: 8, overflow: 'hidden', background: '#fff' }}>
                      <div style={{ padding: '8px 14px', background: '#fafafa', borderBottom: '1px solid var(--gray-200)', fontSize: '0.82rem', fontWeight: 600, color: 'var(--gray-700)', display: 'flex', justifyContent: 'space-between' }}>
                        <span>Ürün {idx + 1}</span>
                        {quickSaleForm.items.length > 1 && (
                          <button
                            type="button"
                            onClick={() => {
                              const next = quickSaleForm.items.filter((_, i) => i !== idx);
                              setQuickSaleForm({ ...quickSaleForm, items: next });
                            }}
                            style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '0.78rem' }}
                          >
                            Kaldır
                          </button>
                        )}
                      </div>
                      <div style={{ padding: 14 }}>
                        <div className="form-row-3">
                          <div className="form-group" style={{ gridColumn: 'span 2' }}>
                            <label className="form-label" style={{ fontSize: '0.8rem' }}>Ürün</label>
                            <select
                              className="form-select"
                              value={row.productId}
                              onChange={(e) => {
                                const p = stockList.find(s => s.id === e.target.value);
                                const next = [...quickSaleForm.items];
                                next[idx] = { ...next[idx], productId: e.target.value, price: p ? p.price : 0 };
                                setQuickSaleForm({ ...quickSaleForm, items: next });
                              }}
                            >
                              <option value="">Ürün seçin</option>
                              {stockList.map(s => (
                                <option key={s.id} value={s.id}>{s.name} - {s.brand} (Stok: {s.quantity})</option>
                              ))}
                            </select>
                          </div>
                          <div className="form-group">
                            <label className="form-label" style={{ fontSize: '0.8rem' }}>Adet</label>
                            <input
                              type="number"
                              className="form-input"
                              value={row.qty}
                              onChange={(e) => {
                                const next = [...quickSaleForm.items];
                                next[idx] = { ...next[idx], qty: Number(e.target.value) };
                                setQuickSaleForm({ ...quickSaleForm, items: next });
                              }}
                              min={1}
                            />
                          </div>
                          <div className="form-group">
                            <label className="form-label" style={{ fontSize: '0.8rem' }}>Birim Fiyat</label>
                            <div style={{ position: 'relative' }}>
                              <input
                                type="number"
                                className="form-input"
                                value={row.price}
                                onChange={(e) => {
                                  const next = [...quickSaleForm.items];
                                  next[idx] = { ...next[idx], price: Number(e.target.value) };
                                  setQuickSaleForm({ ...quickSaleForm, items: next });
                                }}
                                style={{ paddingRight: 24 }}
                              />
                              <span style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-400)', fontSize: '0.82rem' }}>₺</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Dashed Add Product Button */}
                  <button
                    type="button"
                    onClick={() => setQuickSaleForm({
                      ...quickSaleForm,
                      items: [...quickSaleForm.items, { productId: '', qty: 1, price: 0 }]
                    })}
                    style={{
                      border: '2px dashed #bae6fd',
                      background: '#f0f9ff',
                      borderRadius: 8,
                      padding: '10px 16px',
                      color: '#0284c7',
                      fontSize: '0.86rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6
                    }}
                  >
                    + Ürün Ekle
                  </button>
                </div>
              </div>

              {/* Ödeme Bilgileri */}
              <div style={{ border: '1px solid var(--gray-200)', borderRadius: 8, padding: 14, background: '#fff' }}>
                <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: 12, color: 'var(--gray-900)' }}>
                  Ödeme Bilgileri
                </div>
                <div className="form-row-3">
                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: '0.8rem' }}>
                      Kasa <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <select
                      className="form-select"
                      value={quickSaleForm.cashId}
                      onChange={(e) => setQuickSaleForm({ ...quickSaleForm, cashId: e.target.value })}
                    >
                      <option value="">Kasa seçin</option>
                      <option value="ana">Ana Kasa</option>
                      <option value="kadikoy">Kadıköy Kasa</option>
                      <option value="besiktas">Beşiktaş Kasa</option>
                      <option value="banka">Banka - Garanti</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: '0.8rem' }}>Ödeme Yöntemi</label>
                    <select
                      className="form-select"
                      value={quickSaleForm.paymentMethod}
                      onChange={(e) => setQuickSaleForm({ ...quickSaleForm, paymentMethod: e.target.value })}
                    >
                      <option value="Nakit">Nakit</option>
                      <option value="Kredi Kartı">Kredi Kartı</option>
                      <option value="Havale / EFT">Havale / EFT</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: '0.8rem' }}>Ödenen Tutar</label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type="number"
                        className="form-input"
                        value={quickSaleForm.paidAmount}
                        onChange={(e) => setQuickSaleForm({ ...quickSaleForm, paidAmount: Number(e.target.value) })}
                        style={{ paddingRight: 24 }}
                      />
                      <span style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-400)', fontSize: '0.82rem' }}>₺</span>
                    </div>
                    <div style={{ textAlign: 'right', marginTop: 4 }}>
                      <span
                        onClick={() => {
                          const total = quickSaleForm.items.reduce((sum, i) => sum + (i.price * i.qty), 0);
                          setQuickSaleForm({ ...quickSaleForm, paidAmount: total });
                        }}
                        style={{ color: '#0284c7', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer' }}
                      >
                        Tamamını Öde
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Total Summary Bar */}
              <div style={{
                border: '1px solid var(--gray-200)',
                borderRadius: 8,
                padding: '16px 20px',
                background: '#fff',
                display: 'grid',
                gridTemplateColumns: '1fr 1fr 1fr',
                gap: 16
              }}>
                <div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--gray-500)', marginBottom: 4 }}>Genel Toplam</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#16a34a' }}>
                    {quickSaleForm.items.reduce((sum, i) => sum + (i.price * i.qty), 0).toFixed(2)} ₺
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--gray-500)', marginBottom: 4 }}>Ödenen</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0284c7' }}>
                    {quickSaleForm.paidAmount.toFixed(2)} ₺
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--gray-500)', marginBottom: 4 }}>Kalan Borç</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#16a34a' }}>
                    {Math.max(0, quickSaleForm.items.reduce((sum, i) => sum + (i.price * i.qty), 0) - quickSaleForm.paidAmount).toFixed(2)} ₺
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-footer" style={{ borderTop: '1px solid var(--gray-200)', padding: '12px 24px', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowQuickSaleModal(false)}
                style={{ padding: '8px 20px', borderRadius: 6 }}
              >
                İptal
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  addToast({ type: 'success', message: 'Hızlı satış başarıyla gerçekleştirildi ve kasaya işlendi.' });
                  setShowQuickSaleModal(false);
                }}
                style={{ padding: '8px 24px', borderRadius: 6, background: '#0284c7', borderColor: '#0284c7' }}
              >
                Satışı Kaydet
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
