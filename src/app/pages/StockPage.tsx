'use client';

import React, { useState } from 'react';
import { stockItems, formatCurrency } from '../data/mockData';

export default function StockPage() {
  const [filterCategory, setFilterCategory] = useState('Tümü');
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  const filtered = stockItems.filter(item => {
    const matchSearch = item.name.toLowerCase().includes(search.toLowerCase()) || item.brand.toLowerCase().includes(search.toLowerCase());
    const matchCategory = filterCategory === 'Tümü' || item.category === filterCategory;
    return matchSearch && matchCategory;
  });

  const totalValue = stockItems.reduce((sum, i) => sum + (i.price * i.quantity), 0);
  const lowStockCount = stockItems.filter(s => s.quantity <= s.criticalLevel).length;

  return (
    <div className="page">
      <div className="page-header">
        <div className="page-header-left">
          <h2>Stok & Aksesuar Yönetimi</h2>
          <p>{stockItems.length} ürün kayıtlı</p>
        </div>
        <div className="page-header-actions">
          <button className="btn btn-secondary">📥 İçe Aktar</button>
          <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
            ➕ Yeni Ürün Ekle
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
          <table>
            <thead>
              <tr>
                <th>Ürün</th>
                <th>Kategori</th>
                <th>Marka / Model</th>
                <th>Seri No</th>
                <th>Adet</th>
                <th>Durum</th>
                <th>Fiyat</th>
                <th>SGK Fiyatı</th>
                <th>Lokasyon</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => {
                const isLow = item.quantity <= item.criticalLevel;
                const isCritical = item.quantity <= item.criticalLevel / 2;
                return (
                  <tr key={item.id}>
                    <td className="td-primary">{item.name}</td>
                    <td>
                      <span className={`badge badge-${
                        item.category === 'Cihaz' ? 'info' :
                        item.category === 'Pil' ? 'warning' :
                        item.category === 'Kalıp' ? 'success' : 'neutral'
                      }`}>
                        {item.category}
                      </span>
                    </td>
                    <td>{item.brand} {item.model}</td>
                    <td style={{ fontFamily: 'monospace', fontSize: '0.78rem' }}>{item.serialNo}</td>
                    <td>
                      <span style={{
                        fontWeight: 700,
                        color: isCritical ? 'var(--danger-600)' : isLow ? 'var(--warning-600)' : 'var(--gray-800)',
                      }}>
                        {item.quantity}
                      </span>
                    </td>
                    <td>
                      {isCritical ? (
                        <span className="badge badge-danger">🔴 Kritik</span>
                      ) : isLow ? (
                        <span className="badge badge-warning">🟡 Düşük</span>
                      ) : (
                        <span className="badge badge-success">🟢 Yeterli</span>
                      )}
                    </td>
                    <td style={{ fontWeight: 600 }}>{formatCurrency(item.price)}</td>
                    <td>{item.sgkPrice > 0 ? formatCurrency(item.sgkPrice) : '—'}</td>
                    <td style={{ fontSize: '0.78rem' }}>{item.location}</td>
                    <td>
                      <button className="btn btn-sm btn-ghost">✏️</button>
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
