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

  const [formData, setFormData] = useState<{
    name: string;
    brand: string;
    category: StockItem['category'];
    quantity: number;
    price: number;
    serialNo: string;
    utsStatus: StockItem['utsStatus'];
    branch: StockItem['branch'];
    criticalLevel: number;
    status: StockItem['status'];
    utsKurumNo: string;
    gln: string;
    mersisNo: string;
  }>({
    name: '',
    brand: '',
    category: 'Cihaz',
    quantity: 1,
    price: 15000,
    serialNo: '',
    utsStatus: 'Bekliyor',
    branch: 'Merkez 1 - Kadıköy',
    criticalLevel: 5,
    status: 'Stokta',
    utsKurumNo: '',
    gln: '',
    mersisNo: ''
  });

  const handleSaveNew = () => {
    if (!formData.name || !formData.brand) {
      alert('Lütfen ürün adı ve markasını girin.');
      return;
    }
    const newItem: StockItem = {
      id: `s-${Date.now().toString().slice(-6)}`,
      name: formData.name,
      brand: formData.brand,
      model: formData.brand,
      category: formData.category,
      quantity: Number(formData.quantity),
      price: Number(formData.price),
      sgkPrice: Number(formData.price) * 0.4,
      warrantyExpiry: '2028-07-10',
      location: 'Depo',
      serialNo: formData.serialNo || `SN-${Math.floor(Math.random() * 900000 + 100000)}`,
      utsStatus: formData.utsStatus,
      branch: formData.branch,
      criticalLevel: Number(formData.criticalLevel),
      status: formData.status,
      utsKurumNo: formData.utsKurumNo || '954201',
    };
    addStockItem(newItem);
    setShowAddModal(false);
    // Reset form
    setFormData({
      name: '',
      brand: '',
      category: 'Cihaz',
      quantity: 1,
      price: 15000,
      serialNo: '',
      utsStatus: 'Bekliyor',
      branch: 'Merkez 1 - Kadıköy',
      criticalLevel: 5,
      status: 'Stokta',
      utsKurumNo: '',
      gln: '',
      mersisNo: ''
    });
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
  const lowStockCount = stockList.filter(s => s.category === 'Pil' && s.quantity <= s.criticalLevel).length;

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

      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon primary">
            <IconStock size={18} />
          </div>
          <div className="stat-content">
            <div className="stat-label">Toplam Ürün Çeşidi</div>
            <div className="stat-value">{stockList.length}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon success">
            <IconCash size={18} />
          </div>
          <div className="stat-content">
            <div className="stat-label">Toplam Stok Değeri</div>
            <div className="stat-value">{formatCurrency(totalValue)}</div>
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
        <div className="stat-card">
          <div className="stat-icon info">
            <IconHearing size={18} />
          </div>
          <div className="stat-content">
            <div className="stat-label">Cihaz Adedi</div>
            <div className="stat-value">{stockList.filter(s => s.category === 'Cihaz').reduce((sum, s) => sum + s.quantity, 0)}</div>
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
                    <td data-label="Fiyat" style={{ fontWeight: 600 }}>{formatCurrency(item.price)}</td>
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
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 600 }}>
            <div className="modal-header">
              <span className="modal-title">Yeni Ürün Ekle</span>
              <button className="modal-close" onClick={() => setShowAddModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Ürün Adı</label>
                <input
                  className="form-input"
                  placeholder="Örn: Phonak Audéo P90"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Kategori</label>
                  <select
                    className="form-select"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as StockItem['category'] })}
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
                    placeholder="Marka adı"
                    value={formData.brand}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Seri No</label>
                  <input
                    className="form-input"
                    placeholder="Seri/garanti numarası"
                    value={formData.serialNo}
                    onChange={(e) => setFormData({ ...formData, serialNo: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">ÜTS Durumu</label>
                  <select
                    className="form-select"
                    value={formData.utsStatus}
                    onChange={(e) => setFormData({ ...formData, utsStatus: e.target.value as StockItem['utsStatus'] })}
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
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Kritik Seviye</label>
                  <input
                    className="form-input"
                    type="number"
                    value={formData.criticalLevel}
                    onChange={(e) => setFormData({ ...formData, criticalLevel: Number(e.target.value) })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Lokasyon / Şube</label>
                  <select
                    className="form-select"
                    value={formData.branch}
                    onChange={(e) => setFormData({ ...formData, branch: e.target.value as StockItem['branch'] })}
                  >
                    <option>Merkez 1 - Kadıköy</option>
                    <option>Merkez 2 - Beşiktaş</option>
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Satış Fiyatı (₺)</label>
                  <input
                    className="form-input"
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Cihaz Statüsü</label>
                  <select
                    className="form-select"
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as StockItem['status'] })}
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
                    placeholder="Örn: 954201"
                    value={formData.utsKurumNo}
                    onChange={(e) => setFormData({ ...formData, utsKurumNo: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">GLN Kodu</label>
                  <input
                    className="form-input"
                    placeholder="Örn: 8680001402361"
                    value={formData.gln}
                    onChange={(e) => setFormData({ ...formData, gln: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">MERSİS No</label>
                  <input
                    className="form-input"
                    placeholder="Örn: 012345..."
                    value={formData.mersisNo}
                    onChange={(e) => setFormData({ ...formData, mersisNo: e.target.value })}
                  />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowAddModal(false)}>İptal</button>
              <button className="btn btn-primary" onClick={handleSaveNew}>Kaydet</button>
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
              <div className="form-row">
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
