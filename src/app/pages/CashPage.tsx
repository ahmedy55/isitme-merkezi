'use client';

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { formatCurrency, formatDate, SaleRecord } from '../data/mockData';
import { IconPlus, IconDownload, IconCash, IconCheck, IconRecall, IconShield, IconClose } from '../components/Icons';

export default function CashPage() {
  const { salesList, commissionRate, addSale, addToast } = useApp();
  const [filterStatus, setFilterStatus] = useState('Tümü');
  const [showSaleModal, setShowSaleModal] = useState(false);
  const [selectedSaleForInvoice, setSelectedSaleForInvoice] = useState<SaleRecord | null>(null);

  const filtered = salesList.filter(s =>
    filterStatus === 'Tümü' || s.status === filterStatus
  );

  const totalRevenue = salesList.reduce((sum, s) => sum + s.total, 0);
  const collected = salesList.filter(s => s.status === 'Tahsil Edildi').reduce((sum, s) => sum + s.total, 0);
  const pending = salesList.filter(s => s.status !== 'Tahsil Edildi').reduce((sum, s) => sum + s.patientAmount, 0);
  const sgkTotal = salesList.reduce((sum, s) => sum + s.sgkAmount, 0);
  const totalCommission = totalRevenue * (commissionRate / 100);

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
        <div className="stat-card">
          <div className="stat-icon success" style={{ background: 'var(--accent-50)', color: 'var(--accent-600)' }}>
            <IconCash size={20} strokeWidth={1.6} />
          </div>
          <div className="stat-content">
            <div className="stat-label">Odyolog Prim Havuzu</div>
            <div className="stat-value">{formatCurrency(totalCommission)}</div>
            <span style={{ fontSize: '0.72rem', color: 'var(--gray-500)' }}>Oran: %{commissionRate}</span>
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
                <th>SGK Payı</th>
                <th>Hasta Payı</th>
                <th>Ödeme Şekli</th>
                <th>Durum</th>
                <th>İşlem</th>
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
                        {item.name} {item.quantity > 1 && `(${item.quantity} adet)`}
                      </div>
                    ))}
                  </td>
                  <td data-label="Toplam" style={{ fontWeight: 700 }}>{formatCurrency(sale.total)}</td>
                  <td data-label="SGK Payı" style={{ color: sale.sgkAmount > 0 ? 'var(--success-600)' : 'var(--gray-400)' }}>
                    {sale.sgkAmount > 0 ? formatCurrency(sale.sgkAmount) : '—'}
                  </td>
                  <td data-label="Hasta Payı" style={{ fontWeight: 600 }}>{formatCurrency(sale.patientAmount)}</td>
                  <td data-label="Ödeme Şekli">
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
                  <td data-label="İşlem">
                    <button 
                      className="btn btn-sm btn-secondary" 
                      onClick={() => setSelectedSaleForInvoice(sale)}
                      style={{ fontSize: '0.72rem', padding: '4px 8px' }}
                    >
                      Fatura Görüntüle
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Installment Details */}
      {salesList.filter(s => s.installments).length > 0 && (
        <div className="card" style={{ marginTop: 20 }}>
          <div className="card-header">
            <span className="card-title">Taksit Takibi</span>
          </div>
          <div className="card-body">
            {salesList.filter(s => s.installments).map(sale => (
              <div key={sale.id} style={{ marginBottom: 16 }}>
                <div style={{ fontWeight: 600, marginBottom: 8 }}>
                  {sale.patientName} — Toplam Hasta Borcu: {formatCurrency(sale.patientAmount)}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10 }}>
                  {sale.installments?.map((inst, i) => {
                    const today = new Date('2026-07-10');
                    const due = new Date(inst.dueDate);
                    const isOverdue = !inst.paid && due.getTime() < today.getTime();
                    const isDueToday = !inst.paid && due.getTime() === today.getTime();
                    
                    let bg = 'var(--gray-50)';
                    let border = '1px solid var(--gray-200)';
                    let statusLabel = 'Bekliyor';
                    let badgeType = 'neutral';
                    
                    if (inst.paid) {
                      bg = 'var(--success-50)';
                      border = '1px solid var(--success-200)';
                      statusLabel = 'Ödendi';
                      badgeType = 'success';
                    } else if (isOverdue) {
                      bg = 'var(--danger-50)';
                      border = '1px solid var(--danger-200)';
                      statusLabel = 'Gecikti';
                      badgeType = 'danger';
                    } else if (isDueToday) {
                      bg = 'var(--warning-50)';
                      border = '1px solid var(--warning-200)';
                      statusLabel = 'Vadesi Bugün';
                      badgeType = 'warning';
                    }

                    return (
                      <div key={i} style={{
                        padding: '10px 12px',
                        background: bg,
                        border: border,
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
                          Vade: {formatDate(inst.dueDate)}
                        </div>
                        <span className={`badge badge-${badgeType}`} style={{ marginTop: 6, display: 'inline-block' }}>
                          {statusLabel}
                        </span>
                      </div>
                    );
                  })}
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
              <button className="btn btn-primary" onClick={() => {
                setShowSaleModal(false);
                addToast({ type: 'success', message: 'Satış kaydı kasaya başarıyla işlendi.' });
              }}>Satışı Kaydet</button>
            </div>
          </div>
        </div>
      )}

      {/* E-Arşiv Fatura Modal */}
      {selectedSaleForInvoice && (
        <div className="modal-overlay" onClick={() => setSelectedSaleForInvoice(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 650 }}>
            <div className="modal-header">
              <span className="modal-title">E-Arşiv Fatura Taslağı</span>
              <button className="modal-close" onClick={() => setSelectedSaleForInvoice(null)}>
                <IconClose size={16} strokeWidth={2} />
              </button>
            </div>
            <div className="modal-body" style={{ padding: 24, background: '#fcfbfa', border: '1px solid var(--gray-200)', borderRadius: 'var(--radius-md)' }}>
              {/* Logo / Başlık */}
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid var(--primary-600)', paddingBottom: 16, marginBottom: 20 }}>
                <div>
                  <h3 style={{ margin: 0, color: 'var(--primary-700)', fontWeight: 800 }}>AudioPro İşitme Merkezi</h3>
                  <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)', marginTop: 4 }}>
                    Caferağa Mah. Moda Cad. No:42, Kadıköy / İstanbul<br />
                    Tel: 0216 555 00 00 · Vergi No: 1234567890
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--accent-600)' }}>e-ARŞİV FATURA</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--gray-500)', fontFamily: 'var(--font-mono)', marginTop: 6 }}>
                    Fatura No: AP2026{selectedSaleForInvoice.id.slice(-6).toUpperCase()}<br />
                    Tarih: {formatDate(selectedSaleForInvoice.date)}
                  </div>
                </div>
              </div>

              {/* Müşteri Bilgileri */}
              <div style={{ background: 'white', border: '1px solid var(--gray-200)', borderRadius: 'var(--radius-md)', padding: 12, marginBottom: 20, fontSize: '0.84rem' }}>
                <div style={{ fontWeight: 700, color: 'var(--gray-700)', marginBottom: 6 }}>ALICI BİLGİLERİ</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 16px' }}>
                  <div><strong>Adı Soyadı:</strong> {selectedSaleForInvoice.patientName}</div>
                  <div><strong>Ödeme Yöntemi:</strong> {selectedSaleForInvoice.paymentMethod}</div>
                  <div><strong>SGK Durumu:</strong> {selectedSaleForInvoice.sgkAmount > 0 ? 'SGK Karşılamalı' : 'Şahsi Ödeme'}</div>
                  <div><strong>Durum:</strong> {selectedSaleForInvoice.status}</div>
                </div>
              </div>

              {/* Ürün Tablosu */}
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem', marginBottom: 20 }}>
                <thead>
                  <tr style={{ background: 'var(--primary-50)', borderBottom: '1px solid var(--primary-100)' }}>
                    <th style={{ padding: 8, textAlign: 'left' }}>Açıklama</th>
                    <th style={{ padding: 8, textAlign: 'center' }}>Kategori</th>
                    <th style={{ padding: 8, textAlign: 'center' }}>Adet</th>
                    <th style={{ padding: 8, textAlign: 'right' }}>Birim Fiyat</th>
                    <th style={{ padding: 8, textAlign: 'right' }}>Toplam</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedSaleForInvoice.items.map((item, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid var(--gray-100)' }}>
                      <td style={{ padding: 8 }}>{item.name}</td>
                      <td style={{ padding: 8, textAlign: 'center' }}>{item.type || 'Cihaz'}</td>
                      <td style={{ padding: 8, textAlign: 'center' }}>{item.quantity}</td>
                      <td style={{ padding: 8, textAlign: 'right' }}>{formatCurrency(item.price)}</td>
                      <td style={{ padding: 8, textAlign: 'right' }}>{formatCurrency(item.price * item.quantity)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Matrah & Toplamlar */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', fontSize: '0.84rem' }}>
                <div style={{ width: 280, display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 6, textAlign: 'right' }}>
                  <div>Ara Toplam (KDV Dahil):</div>
                  <div style={{ fontWeight: 600 }}>{formatCurrency(selectedSaleForInvoice.total)}</div>
                  
                  {selectedSaleForInvoice.sgkAmount > 0 && (
                    <>
                      <div style={{ color: 'var(--success-600)' }}>SGK Devlet Katkısı:</div>
                      <div style={{ fontWeight: 600, color: 'var(--success-600)' }}>-{formatCurrency(selectedSaleForInvoice.sgkAmount)}</div>
                    </>
                  )}
                  
                  <div style={{ borderTop: '1px solid var(--gray-300)', paddingTop: 6, fontWeight: 700, fontSize: '0.95rem' }}>Ödenecek Net Tutar:</div>
                  <div style={{ borderTop: '1px solid var(--gray-300)', paddingTop: 6, fontWeight: 700, fontSize: '0.95rem', color: 'var(--accent-600)' }}>
                    {formatCurrency(selectedSaleForInvoice.patientAmount)}
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setSelectedSaleForInvoice(null)}>Kapat</button>
              <button 
                className="btn btn-primary" 
                onClick={() => {
                  setSelectedSaleForInvoice(null);
                  addToast({ type: 'success', message: 'e-Arşiv Fatura resmi olarak imzalandı ve GİB portalına başarıyla iletildi.' });
                }}
              >
                GİB Gönder & Yazdır
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
