'use client';

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { stockItems, formatCurrency } from '../data/mockData';
import { IconPlus, IconUpload, IconEdit } from '../components/Icons';

export default function StockPage() {
  const { stockList, updateStockItem, patientsList, updatePatient, addToast } = useApp();
  const [filterCategory, setFilterCategory] = useState('Tümü');
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  const filtered = stockList.filter(item => {
    const matchSearch = item.name.toLowerCase().includes(search.toLowerCase()) || item.brand.toLowerCase().includes(search.toLowerCase());
    const matchCategory = filterCategory === 'Tümü' || item.category === filterCategory;
    return matchSearch && matchCategory;
  });

  const totalValue = stockList.reduce((sum, i) => sum + (i.price * i.quantity), 0);
  const lowStockCount = stockList.filter(s => s.category === 'Pil' && s.quantity <= s.criticalLevel).length;

  const handleUtsNotification = (item: any) => {
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
          <p>{stockItems.length} ürün kayıtlı</p>
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
          <div className="stat-icon primary">📦</div>
          <div className="stat-content">
            <div className="stat-label">Toplam Ürün Çeşidi</div>
            <div className="stat-value">{stockItems.length}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon success">💎</div>
          <div className="stat-content">
            <div className="stat-label">Toplam Stok Değeri</div>
            <div className="stat-value">{formatCurrency(totalValue)}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon danger">⚠️</div>
          <div className="stat-content">
            <div className="stat-label">Kritik Stok</div>
            <div className="stat-value">{lowStockCount}</div>
            <span className="stat-change down">Sipariş gerekli</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon info">🏥</div>
          <div className="stat-content">
            <div className="stat-label">Cihaz Adedi</div>
            <div className="stat-value">{stockItems.filter(s => s.category === 'Cihaz').reduce((sum, s) => sum + s.quantity, 0)}</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-body" style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <div className="header-search" style={{ flex: 1 }}>
            <span className="header-search-icon">🔍</span>
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
                        <button className="btn btn-sm btn-ghost btn-icon" aria-label="Düzenle">
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
              <span className="modal-title">➕ Yeni Ürün Ekle</span>
              <button className="modal-close" onClick={() => setShowAddModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Ürün Adı</label>
                <input className="form-input" placeholder="Örn: Phonak Audéo P90" />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Kategori</label>
                  <select className="form-select">
                    <option>Cihaz</option>
                    <option>Pil</option>
                    <option>Kalıp</option>
                    <option>Aksesuar</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Marka</label>
                  <input className="form-input" placeholder="Marka adı" />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Model</label>
                  <input className="form-input" placeholder="Model adı" />
                </div>
                <div className="form-group">
                  <label className="form-label">Seri No</label>
                  <input className="form-input" placeholder="Seri/garanti numarası" />
                </div>
              </div>
              <div className="form-row-3">
                <div className="form-group">
                  <label className="form-label">Adet</label>
                  <input className="form-input" type="number" placeholder="0" />
                </div>
                <div className="form-group">
                  <label className="form-label">Kritik Seviye</label>
                  <input className="form-input" type="number" placeholder="0" />
                </div>
                <div className="form-group">
                  <label className="form-label">Lokasyon</label>
                  <select className="form-select">
                    <option>Merkez 1</option>
                    <option>Merkez 2</option>
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Satış Fiyatı (₺)</label>
                  <input className="form-input" type="number" placeholder="0" />
                </div>
                <div className="form-group">
                  <label className="form-label">SGK Fiyatı (₺)</label>
                  <input className="form-input" type="number" placeholder="0" />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowAddModal(false)}>İptal</button>
              <button className="btn btn-primary" onClick={() => setShowAddModal(false)}>💾 Kaydet</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
