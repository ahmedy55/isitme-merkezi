'use client';

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { stockItems, formatCurrency, type StockItem, type Patient } from '../data/mockData';
import { IconPlus, IconUpload, IconEdit, IconStock, IconCash, IconWarning, IconHearing, IconSearch } from '../components/Icons';

export default function StockPage() {
  const { stockList, updateStockItem, addStockItem, patientsList, updatePatient, addToast } = useApp();
  const [filterCategory, setFilterCategory] = useState('Tümü');
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState<StockItem | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  const [activeAddTab, setActiveAddTab] = useState<'info' | 'docs'>('info');

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
      alert('Lütfen Ürün Adı alanını doldurunuz.');
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

  const filtered = stockList.filter(item => {
    const matchSearch = item.name.toLowerCase().includes(search.toLowerCase()) || item.brand.toLowerCase().includes(search.toLowerCase());
    const matchCategory = filterCategory === 'Tümü' || item.category === filterCategory;
    return matchSearch && matchCategory;
  });

  const totalValue = stockList.reduce((sum, i) => sum + (i.price * i.quantity), 0);
  const totalQuantity = stockList.reduce((sum, i) => sum + i.quantity, 0);
  const lowStockCount = stockList.filter(s => s.category === 'Pil' && s.quantity <= s.criticalLevel).length;
  const utsCount = stockList.filter(s => s.utsStatus === 'Bildirildi').length;
  const utsDisiCount = stockList.filter(s => s.utsStatus !== 'Bildirildi').length;

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
        <div className="page-header-actions">
          <button className="btn btn-secondary" 
            onClick={() => addToast({ type: 'success', message: 'Excel/CSV envanter şablonu başarıyla içeri aktarıldı. 14 yeni ürün stoğa eklendi.' })}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <IconUpload size={15} strokeWidth={1.7} /> İçe Aktar
          </button>
          <button className="btn btn-primary" onClick={() => setShowAddModal(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
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
                <th>İşlem</th>
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
                    <td data-label="İşlem">
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        {item.category === 'Cihaz' && item.utsStatus === 'Bekliyor' && (
                          <button 
                            className="btn btn-sm btn-primary"
                            disabled={!item.assignedPatientId}
                            title={!item.assignedPatientId ? "ÜTS bildirimi için önce cihaza hasta atanmalıdır." : ""}
                            onClick={() => handleUtsNotification(item)}
                            style={{ fontSize: '0.72rem', padding: '4px 8px' }}
                          >
                            ÜTS Bildirimi Yap
                          </button>
                        )}
                        <button className="btn btn-sm btn-ghost btn-icon" 
                          onClick={() => {
                            setEditingItem(item);
                            setShowEditModal(true);
                          }}
                          aria-label="Düzenle">
                          <IconEdit size={14} strokeWidth={1.7} />
                        </button>
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
                        onChange={(e) => setFormData({ ...formData, category: e.target.value as StockItem['category'] })}
                      >
                        <option value="Cihaz">Cihaz</option>
                        <option value="Pil">Pil</option>
                        <option value="Kalıp">Kalıp</option>
                        <option value="Aksesuar">Aksesuar</option>
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
                      <option value="Kanal İçi (ITE/CIC/IIC)">Kanal İçi (ITE/CIC/IIC)</option>
                      <option value="Hoparlör Kanal İçinde (RIC/RITE)">Hoparlör Kanal İçinde (RIC/RITE)</option>
                      <option value="İşitme Cihazı Pili">İşitme Cihazı Pili</option>
                      <option value="Kulak Kalıbı / Tıkaç">Kulak Kalıbı / Tıkaç</option>
                      <option value="Temizlik / Bakım Aksesuarı">Temizlik / Bakım Aksesuarı</option>
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
                        <option value="Takip Yok">Takip Yok</option>
                        <option value="Tekil Takip (Seri No)">Tekil Takip (Seri No)</option>
                        <option value="Lot / Parti Takibi">Lot / Parti Takibi</option>
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
                <div style={{ padding: '24px 16px', textAlign: 'center' }}>
                  <div style={{
                    border: '2px dashed var(--gray-300)',
                    borderRadius: 12,
                    padding: '36px 20px',
                    background: 'var(--gray-50)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 12
                  }}>
                    <div style={{ fontSize: '2.4rem' }}>📁</div>
                    <div style={{ fontWeight: 600, fontSize: '0.92rem', color: 'var(--gray-800)' }}>
                      Ürün Broşürü, Kullanım Kılavuzu veya Garanti Belgesi Yükleyin
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--gray-500)', maxWidth: 400 }}>
                      PDF, JPG veya PNG formatındaki belgeleri sürükleyip bırakın veya bilgisayarınızdan seçin.
                    </div>
                    <button type="button" className="btn btn-secondary" style={{ marginTop: 8 }}>
                      Dosya Seç
                    </button>
                  </div>
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
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 600 }}>
            <div className="modal-header">
              <span className="modal-title">Ürün Düzenle — {editingItem.name}</span>
              <button className="modal-close" onClick={() => { setShowEditModal(false); setEditingItem(null); }}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Ürün Adı</label>
                <input
                  className="form-input"
                  value={editingItem.name}
                  onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Kategori</label>
                  <select
                    className="form-select"
                    value={editingItem.category}
                    onChange={(e) => setEditingItem({ ...editingItem, category: e.target.value as StockItem['category'] })}
                  >
                    <option>Cihaz</option>
                    <option>Pil</option>
                    <option>Kalıp</option>
                    <option>Aksesuar</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Marka</label>
                  <input
                    className="form-input"
                    value={editingItem.brand}
                    onChange={(e) => setEditingItem({ ...editingItem, brand: e.target.value })}
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Seri No</label>
                  <input
                    className="form-input"
                    value={editingItem.serialNo}
                    onChange={(e) => setEditingItem({ ...editingItem, serialNo: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">ÜTS Durumu</label>
                  <select
                    className="form-select"
                    value={editingItem.utsStatus}
                    onChange={(e) => setEditingItem({ ...editingItem, utsStatus: e.target.value as StockItem['utsStatus'] })}
                  >
                    <option>Bekliyor</option>
                    <option>Bildirildi</option>
                    <option>Hata</option>
                    <option>Gerekli Değil</option>
                  </select>
                </div>
              </div>
              <div className="form-row-3">
                <div className="form-group">
                  <label className="form-label">Adet</label>
                  <input
                    className="form-input"
                    type="number"
                    value={editingItem.quantity}
                    onChange={(e) => setEditingItem({ ...editingItem, quantity: Number(e.target.value) })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Kritik Seviye</label>
                  <input
                    className="form-input"
                    type="number"
                    value={editingItem.criticalLevel}
                    onChange={(e) => setEditingItem({ ...editingItem, criticalLevel: Number(e.target.value) })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Lokasyon / Şube</label>
                  <select
                    className="form-select"
                    value={editingItem.branch}
                    onChange={(e) => setEditingItem({ ...editingItem, branch: e.target.value as StockItem['branch'] })}
                  >
                    <option>Merkez 1 - Kadıköy</option>
                    <option>Merkez 2 - Beşiktaş</option>
                  </select>
                </div>
              </div>
              <div className="form-row-3">
                <div className="form-group">
                  <label className="form-label">Alış Fiyatı (₺)</label>
                  <input
                    className="form-input"
                    type="number"
                    value={editingItem.purchasePrice || Math.round(editingItem.price * 0.1)}
                    onChange={(e) => setEditingItem({ ...editingItem, purchasePrice: Number(e.target.value) })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Satış Fiyatı (₺)</label>
                  <input
                    className="form-input"
                    type="number"
                    value={editingItem.price}
                    onChange={(e) => setEditingItem({ ...editingItem, price: Number(e.target.value) })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Cihaz Statüsü</label>
                  <select
                    className="form-select"
                    value={editingItem.status}
                    onChange={(e) => setEditingItem({ ...editingItem, status: e.target.value as StockItem['status'] })}
                  >
                    <option>Stokta</option>
                    <option>Hastaya Ayrıldı</option>
                    <option>Satıldı</option>
                    <option>Serviste</option>
                  </select>
                </div>
              </div>

              {/* Yasal ÜTS / GLN / MERSİS Bilgileri */}
              <div className="form-row-3" style={{ marginTop: 12 }}>
                <div className="form-group">
                  <label className="form-label">ÜTS Kurum No (UIK)</label>
                  <input
                    className="form-input"
                    value={editingItem.utsKurumNo || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, utsKurumNo: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">GLN Kodu</label>
                  <input
                    className="form-input"
                    value={editingItem.gln || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, gln: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">MERSİS No</label>
                  <input
                    className="form-input"
                    value={editingItem.mersisNo || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, mersisNo: e.target.value })}
                  />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => { setShowEditModal(false); setEditingItem(null); }}>İptal</button>
              <button className="btn btn-primary" onClick={handleSaveEdit}>Kaydet</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
