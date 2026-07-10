'use client';

import React, { useState } from 'react';
import { sales, formatCurrency, formatDate } from '../data/mockData';
import { IconPlus, IconDownload, IconCash, IconCheck, IconRecall, IconShield } from '../components/Icons';

export default function CashPage() {
  const [filterStatus, setFilterStatus] = useState('Tümü');
  const [showSaleModal, setShowSaleModal] = useState(false);

  const filtered = sales.filter(s =>
    filterStatus === 'Tümü' || s.status === filterStatus
  );

  const totalRevenue = sales.reduce((sum, s) => sum + s.total, 0);
  const collected = sales.filter(s => s.status === 'Tahsil Edildi').reduce((sum, s) => sum + s.total, 0);
  const pending = sales.filter(s => s.status !== 'Tahsil Edildi').reduce((sum, s) => sum + s.patientAmount, 0);
  const sgkTotal = sales.reduce((sum, s) => sum + s.sgkAmount, 0);

  return (
    <div className="page">
      <div className="page-header">
        <div className="page-header-left">
          <h2>Kasa & Tahsilat</h2>
          <p>Satış, tahsilat ve prim takibi</p>
        </div>
        <div className="page-header-actions">
          <button className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <IconDownload size={15} strokeWidth={1.7} /> Rapor İndir
          </button>
          <button className="btn btn-primary" onClick={() => setShowSaleModal(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <IconPlus size={15} strokeWidth={2} /> Yeni Satış
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon success">
            <IconCash size={20} strokeWidth={1.6} />
          </div>
          <div className="stat-content">
            <div className="stat-label">Toplam Ciro</div>
            <div className="stat-value">{formatCurrency(totalRevenue)}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon primary">
            <IconCheck size={20} strokeWidth={1.6} />
          </div>
          <div className="stat-content">
            <div className="stat-label">Tahsil Edilen</div>
            <div className="stat-value">{formatCurrency(collected)}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon warning">
            <IconRecall size={20} strokeWidth={1.6} />
          </div>
          <div className="stat-content">
            <div className="stat-label">Bekleyen Tahsilat</div>
            <div className="stat-value">{formatCurrency(pending)}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon info">
            <IconShield size={20} strokeWidth={1.6} />
          </div>
          <div className="stat-content">
            <div className="stat-label">SGK Hak Ediş</div>
            <div className="stat-value">{formatCurrency(sgkTotal)}</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-body" style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <div className="tabs">
            {['Tümü', 'Tahsil Edildi', 'Bekliyor', 'Taksitli'].map((status) => (
              <button
                key={status}
                className={`tab ${filterStatus === status ? 'active' : ''}`}
                onClick={() => setFilterStatus(status)}
              >
                {status}
              </button>
            ))}
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
            <input className="form-input" type="date" style={{ width: 160, height: 36 }} />
            <span style={{ display: 'flex', alignItems: 'center', color: 'var(--gray-500)', fontSize: '0.82rem' }}>—</span>
            <input className="form-input" type="date" style={{ width: 160, height: 36 }} />
          </div>
        </div>
      </div>

      {/* Sales Table */}
      <div className="card">
        <div className="table-container">
          <table className="mobile-cards">
            <thead>
              <tr>
                <th>Tarih</th>
                <th>Hasta</th>
                <th>Ürünler</th>
                <th>Toplam</th>
                <th>SGK</th>
                <th>Hasta Payı</th>
                <th>Ödeme</th>
                <th>Durum</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((sale) => (
                <tr key={sale.id}>
                  <td data-label="Tarih" className="td-primary">{formatDate(sale.date)}</td>
                  <td data-label="Hasta" style={{ fontWeight: 600 }}>{sale.patientName}</td>
                  <td data-label="Ürünler">
                    {sale.items.map((item, i) => (
                      <div key={i} style={{ fontSize: '0.78rem', color: 'var(--gray-600)' }}>
                        {item.name}
                      </div>
                    ))}
                  </td>
                  <td data-label="Toplam" style={{ fontWeight: 700 }}>{formatCurrency(sale.total)}</td>
                  <td data-label="SGK" style={{ color: sale.sgkAmount > 0 ? 'var(--success-600)' : 'var(--gray-400)' }}>
                    {sale.sgkAmount > 0 ? formatCurrency(sale.sgkAmount) : '—'}
                  </td>
                  <td data-label="Hasta Payı" style={{ fontWeight: 600 }}>{formatCurrency(sale.patientAmount)}</td>
                  <td data-label="Ödeme">
                    <span className="badge badge-neutral">{sale.paymentMethod}</span>
                  </td>
                  <td data-label="Durum">
                    <span className={`badge badge-${
                      sale.status === 'Tahsil Edildi' ? 'success' :
                      sale.status === 'Taksitli' ? 'info' : 'warning'
                    }`}>
                      {sale.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Installment Details */}
      {sales.filter(s => s.installments).length > 0 && (
        <div className="card" style={{ marginTop: 20 }}>
          <div className="card-header">
            <span className="card-title">📆 Taksit Takibi</span>
          </div>
          <div className="card-body">
            {sales.filter(s => s.installments).map(sale => (
              <div key={sale.id} style={{ marginBottom: 16 }}>
                <div style={{ fontWeight: 600, marginBottom: 8 }}>
                  {sale.patientName} — {formatCurrency(sale.patientAmount)}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  {sale.installments?.map((inst, i) => (
                    <div key={i} style={{
                      flex: 1,
                      padding: '10px 12px',
                      background: inst.paid ? 'var(--success-50)' : 'var(--gray-50)',
                      border: `1px solid ${inst.paid ? 'var(--success-200)' : 'var(--gray-200)'}`,
                      borderRadius: 'var(--radius-md)',
                      textAlign: 'center',
                    }}>
                      <div style={{ fontSize: '0.72rem', color: 'var(--gray-500)', marginBottom: 2 }}>
                        Taksit {i + 1}
                      </div>
                      <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>
                        {formatCurrency(inst.amount)}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--gray-500)', marginTop: 2 }}>
                        {formatDate(inst.dueDate)}
                      </div>
                      <span className={`badge badge-${inst.paid ? 'success' : 'warning'}`} style={{ marginTop: 4 }}>
                        {inst.paid ? '✓ Ödendi' : 'Bekliyor'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sale Modal */}
      {showSaleModal && (
        <div className="modal-overlay" onClick={() => setShowSaleModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 600 }}>
            <div className="modal-header">
              <span className="modal-title">➕ Yeni Satış Kaydı</span>
              <button className="modal-close" onClick={() => setShowSaleModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Hasta</label>
                <input className="form-input" placeholder="Hasta adı veya TC ile ara..." />
              </div>
              <div className="form-group">
                <label className="form-label">Ürün</label>
                <select className="form-select">
                  <option>Stoktan ürün seçin...</option>
                  <option>Phonak Audéo P90 — ₺85.000</option>
                  <option>Oticon More 1 — ₺92.000</option>
                  <option>Phonak Pil 312 — ₺120</option>
                </select>
              </div>
              <div className="form-row-3">
                <div className="form-group">
                  <label className="form-label">Adet</label>
                  <input className="form-input" type="number" defaultValue="1" />
                </div>
                <div className="form-group">
                  <label className="form-label">Fiyat (₺)</label>
                  <input className="form-input" type="number" placeholder="0" />
                </div>
                <div className="form-group">
                  <label className="form-label">SGK Payı (₺)</label>
                  <input className="form-input" type="number" placeholder="0" />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Ödeme Yöntemi</label>
                  <select className="form-select">
                    <option>Nakit</option>
                    <option>Kredi Kartı</option>
                    <option>Havale</option>
                    <option>Taksit</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Taksit Sayısı</label>
                  <select className="form-select">
                    <option>Tek Çekim</option>
                    <option>2 Taksit</option>
                    <option>3 Taksit</option>
                    <option>4 Taksit</option>
                    <option>6 Taksit</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowSaleModal(false)}>İptal</button>
              <button className="btn btn-primary" onClick={() => setShowSaleModal(false)}>💾 Satışı Kaydet</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
