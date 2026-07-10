'use client';

import React, { useState } from 'react';
import { getAvatarColor, formatDate, formatCurrency } from '../data/mockData';
import { IconPlus, IconService, IconCheck, IconCash, IconShield, IconArrowRight, IconEye } from '../components/Icons';

interface ServiceRecord {
  id: string;
  patientName: string;
  deviceName: string;
  serialNo: string;
  receivedDate: string;
  estimatedDate: string;
  returnedDate: string | null;
  problem: string;
  operations: { description: string; cost: number }[];
  totalCost: number;
  status: 'Alındı' | 'İnceleniyor' | 'Tamir Ediliyor' | 'Hazır' | 'Teslim Edildi';
  technician: string;
  warrantyRepair: boolean;
  notes: string;
}

const serviceRecords: ServiceRecord[] = [
  {
    id: 'srv1',
    patientName: 'Ayşe Yılmaz',
    deviceName: 'Phonak Audéo P90',
    serialNo: 'PH-2024-00142',
    receivedDate: '2026-07-01',
    estimatedDate: '2026-07-10',
    returnedDate: null,
    problem: 'Cihaz zayıf ses veriyor, pil tüketimi artmış',
    operations: [
      { description: 'Mikrofon temizliği', cost: 500 },
      { description: 'Hoparlör değişimi', cost: 1200 },
      { description: 'Yazılım güncellemesi', cost: 300 },
    ],
    totalCost: 2000,
    status: 'Tamir Ediliyor',
    technician: 'Emre Koç',
    warrantyRepair: false,
    notes: 'Hoparlör yurt dışından sipariş edildi.',
  },
  {
    id: 'srv2',
    patientName: 'Mehmet Kaya',
    deviceName: 'Oticon More 1',
    serialNo: 'OT-2024-00089',
    receivedDate: '2026-07-05',
    estimatedDate: '2026-07-08',
    returnedDate: '2026-07-08',
    problem: 'Bluetooth bağlantı sorunu',
    operations: [
      { description: 'Firmware güncellemesi', cost: 0 },
      { description: 'Bluetooth modül kalibrasyonu', cost: 0 },
    ],
    totalCost: 0,
    status: 'Teslim Edildi',
    technician: 'Emre Koç',
    warrantyRepair: true,
    notes: 'Garanti kapsamında ücretsiz onarıldı.',
  },
  {
    id: 'srv3',
    patientName: 'Ali Demir',
    deviceName: 'Phonak Naída P70',
    serialNo: 'PH-2024-00215',
    receivedDate: '2026-07-07',
    estimatedDate: '2026-07-12',
    returnedDate: null,
    problem: 'Cihaz açılmıyor, düşme sonrası hasar',
    operations: [
      { description: 'Kasa değişimi', cost: 2500 },
      { description: 'Devre kartı kontrol', cost: 400 },
    ],
    totalCost: 2900,
    status: 'İnceleniyor',
    technician: 'Emre Koç',
    warrantyRepair: false,
    notes: 'Fiziksel hasar olduğu için garanti kapsamı dışında.',
  },
  {
    id: 'srv4',
    patientName: 'Hasan Çelik',
    deviceName: 'ReSound ONE 9',
    serialNo: 'RS-2024-00331',
    receivedDate: '2026-07-08',
    estimatedDate: '2026-07-09',
    returnedDate: null,
    problem: 'Kulak kalıbı ile uyum sorunu, geri bildirim sesi',
    operations: [
      { description: 'Kalıp uyumu ayarlama', cost: 200 },
      { description: 'Feedback bastırma kalibrasyonu', cost: 300 },
    ],
    totalCost: 500,
    status: 'Hazır',
    technician: 'Emre Koç',
    warrantyRepair: false,
    notes: 'Hasta yarın teslim almaya gelecek.',
  },
  {
    id: 'srv5',
    patientName: 'Fatma Özkan',
    deviceName: 'Signia Pure 7Nx',
    serialNo: 'SG-2024-00176',
    receivedDate: '2026-06-25',
    estimatedDate: '2026-06-28',
    returnedDate: '2026-06-28',
    problem: 'Rutin yıllık bakım',
    operations: [
      { description: 'Genel temizlik', cost: 300 },
      { description: 'Pil yuvası temizliği', cost: 100 },
      { description: 'Tüp değişimi', cost: 150 },
      { description: 'Ses ayarı optimizasyonu', cost: 200 },
    ],
    totalCost: 750,
    status: 'Teslim Edildi',
    technician: 'Emre Koç',
    warrantyRepair: false,
    notes: '',
  },
];

const statusConfig: Record<string, { color: string; icon: string }> = {
  'Alındı': { color: 'neutral', icon: '📥' },
  'İnceleniyor': { color: 'info', icon: '🔍' },
  'Tamir Ediliyor': { color: 'warning', icon: '🔧' },
  'Hazır': { color: 'success', icon: '✅' },
  'Teslim Edildi': { color: 'neutral', icon: '📤' },
};

export default function ServicePage() {
  const [filterStatus, setFilterStatus] = useState('Tümü');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<ServiceRecord | null>(null);

  const filtered = serviceRecords.filter(r =>
    filterStatus === 'Tümü' || r.status === filterStatus
  );

  const activeCount = serviceRecords.filter(r => !['Teslim Edildi'].includes(r.status)).length;
  const waitingCount = serviceRecords.filter(r => r.status === 'Hazır').length;
  const totalRevenue = serviceRecords.reduce((sum, r) => sum + r.totalCost, 0);
  const warrantyCount = serviceRecords.filter(r => r.warrantyRepair).length;

  return (
    <div className="page">
      <div className="page-header">
        <div className="page-header-left">
          <h2>Teknik Servis Takibi</h2>
          <p>{serviceRecords.length} servis kaydı</p>
        </div>
        <div className="page-header-actions">
          <button className="btn btn-primary" onClick={() => setShowAddModal(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <IconPlus size={15} strokeWidth={2} /> Yeni Servis Kaydı
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon warning">
            <IconService size={20} strokeWidth={1.6} />
          </div>
          <div className="stat-content">
            <div className="stat-label">Serviste Bekleyen</div>
            <div className="stat-value">{activeCount}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon success">
            <IconCheck size={20} strokeWidth={1.6} />
          </div>
          <div className="stat-content">
            <div className="stat-label">Teslime Hazır</div>
            <div className="stat-value">{waitingCount}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon primary">
            <IconCash size={20} strokeWidth={1.6} />
          </div>
          <div className="stat-content">
            <div className="stat-label">Toplam Servis Geliri</div>
            <div className="stat-value">{formatCurrency(totalRevenue)}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon info">
            <IconShield size={20} strokeWidth={1.6} />
          </div>
          <div className="stat-content">
            <div className="stat-label">Garanti Kapsamında</div>
            <div className="stat-value">{warrantyCount}</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-body" style={{ display: 'flex', gap: 12 }}>
          <div className="tabs">
            {['Tümü', 'Alındı', 'İnceleniyor', 'Tamir Ediliyor', 'Hazır', 'Teslim Edildi'].map(s => (
              <button
                key={s}
                className={`tab ${filterStatus === s ? 'active' : ''}`}
                onClick={() => setFilterStatus(s)}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Service Table */}
      <div className="card">
        <div className="table-container">
          <table className="mobile-cards">
            <thead>
              <tr>
                <th>Hasta</th>
                <th>Cihaz</th>
                <th>Seri No</th>
                <th>Arıza / Sorun</th>
                <th>Alım Tarihi</th>
                <th>Tahmini Teslim</th>
                <th>Yapılan İşlemler</th>
                <th>Tutar</th>
                <th>Durum</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(record => {
                const cfg = statusConfig[record.status];
                return (
                  <tr key={record.id}>
                    <td data-label="Hasta">
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div className="avatar" style={{ background: getAvatarColor(record.patientName) }}>
                          {record.patientName.split(' ').map(n => n[0]).join('')}
                        </div>
                        <span className="td-primary">{record.patientName}</span>
                      </div>
                    </td>
                    <td data-label="Cihaz" style={{ fontWeight: 600, fontSize: '0.85rem' }}>{record.deviceName}</td>
                    <td data-label="Seri No" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem' }}>{record.serialNo}</td>
                    <td data-label="Arıza" style={{ maxWidth: 200, fontSize: '0.82rem', color: 'var(--gray-600)' }}>
                      {record.problem}
                    </td>
                    <td data-label="Alım Tarihi">{formatDate(record.receivedDate)}</td>
                    <td data-label="Tahmini Teslim">
                      {record.returnedDate ? (
                        <span style={{ color: 'var(--success-600)', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: 4 }}>
                          <IconCheck size={12} strokeWidth={2} /> {formatDate(record.returnedDate)}
                        </span>
                      ) : (
                        formatDate(record.estimatedDate)
                      )}
                    </td>
                    <td data-label="İşlemler">
                      <span style={{ fontSize: '0.78rem', color: 'var(--gray-600)' }}>
                        {record.operations.length} işlem
                      </span>
                    </td>
                    <td data-label="Tutar">
                      {record.warrantyRepair ? (
                        <span className="badge badge-info" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <IconShield size={11} strokeWidth={1.7} /> Garanti
                        </span>
                      ) : (
                        <span style={{ fontWeight: 700 }}>{formatCurrency(record.totalCost)}</span>
                      )}
                    </td>
                    <td data-label="Durum">
                      <span className={`badge badge-${cfg.color}`}>
                        {record.status}
                      </span>
                    </td>
                    <td data-label="">
                      <button
                        className="btn btn-sm btn-ghost"
                        style={{ display: 'flex', alignItems: 'center', gap: 4 }}
                        onClick={() => setSelectedRecord(record)}
                      >
                        Detay <IconArrowRight size={13} strokeWidth={1.8} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal */}
      {selectedRecord && (
        <div className="modal-overlay" onClick={() => setSelectedRecord(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 680 }}>
            <div className="modal-header">
              <span className="modal-title">🔧 Servis Detayı — {selectedRecord.deviceName}</span>
              <button className="modal-close" onClick={() => setSelectedRecord(null)}>✕</button>
            </div>
            <div className="modal-body">
              {/* Device & Patient Info */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
                <div style={{
                  padding: '14px',
                  background: 'var(--gray-50)',
                  borderRadius: 'var(--radius-lg)',
                }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--gray-500)', marginBottom: 8 }}>Hasta & Cihaz</div>
                  <div style={{ display: 'grid', gap: 6 }}>
                    <div>
                      <span style={{ fontSize: '0.78rem', color: 'var(--gray-500)' }}>Hasta: </span>
                      <span style={{ fontWeight: 600 }}>{selectedRecord.patientName}</span>
                    </div>
                    <div>
                      <span style={{ fontSize: '0.78rem', color: 'var(--gray-500)' }}>Cihaz: </span>
                      <span style={{ fontWeight: 600 }}>{selectedRecord.deviceName}</span>
                    </div>
                    <div>
                      <span style={{ fontSize: '0.78rem', color: 'var(--gray-500)' }}>Seri No: </span>
                      <span style={{ fontWeight: 600, fontFamily: 'monospace' }}>{selectedRecord.serialNo}</span>
                    </div>
                    <div>
                      <span style={{ fontSize: '0.78rem', color: 'var(--gray-500)' }}>Teknisyen: </span>
                      <span style={{ fontWeight: 600 }}>{selectedRecord.technician}</span>
                    </div>
                  </div>
                </div>

                <div style={{
                  padding: '14px',
                  background: 'var(--gray-50)',
                  borderRadius: 'var(--radius-lg)',
                }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--gray-500)', marginBottom: 8 }}>Tarihler & Durum</div>
                  <div style={{ display: 'grid', gap: 6 }}>
                    <div>
                      <span style={{ fontSize: '0.78rem', color: 'var(--gray-500)' }}>Alım: </span>
                      <span style={{ fontWeight: 600 }}>{formatDate(selectedRecord.receivedDate)}</span>
                    </div>
                    <div>
                      <span style={{ fontSize: '0.78rem', color: 'var(--gray-500)' }}>Tahmini: </span>
                      <span style={{ fontWeight: 600 }}>{formatDate(selectedRecord.estimatedDate)}</span>
                    </div>
                    {selectedRecord.returnedDate && (
                      <div>
                        <span style={{ fontSize: '0.78rem', color: 'var(--gray-500)' }}>Teslim: </span>
                        <span style={{ fontWeight: 600, color: 'var(--success-600)' }}>{formatDate(selectedRecord.returnedDate)}</span>
                      </div>
                    )}
                    <div>
                      <span style={{ fontSize: '0.78rem', color: 'var(--gray-500)' }}>Garanti: </span>
                      <span className={`badge badge-${selectedRecord.warrantyRepair ? 'success' : 'neutral'}`}>
                        {selectedRecord.warrantyRepair ? '✓ Garanti kapsamında' : 'Garanti dışı'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Problem */}
              <div style={{
                padding: '12px 16px',
                background: 'var(--warning-50)',
                border: '1px solid var(--warning-100)',
                borderRadius: 'var(--radius-md)',
                marginBottom: 16,
              }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--warning-600)', marginBottom: 4, fontWeight: 600 }}>⚠️ Bildirilen Arıza</div>
                <div style={{ fontSize: '0.88rem', color: 'var(--gray-800)' }}>{selectedRecord.problem}</div>
              </div>

              {/* Operations */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: '0.82rem', fontWeight: 700, marginBottom: 8, color: 'var(--gray-700)' }}>
                  🛠️ Yapılan İşlemler
                </div>
                <div style={{ border: '1px solid var(--gray-200)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
                  {selectedRecord.operations.map((op, i) => (
                    <div key={i} style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '10px 14px',
                      borderBottom: i < selectedRecord.operations.length - 1 ? '1px solid var(--gray-100)' : 'none',
                      fontSize: '0.85rem',
                    }}>
                      <span>
                        <span style={{ color: 'var(--primary-500)', marginRight: 6 }}>●</span>
                        {op.description}
                      </span>
                      <span style={{ fontWeight: 600 }}>
                        {op.cost > 0 ? formatCurrency(op.cost) : <span style={{ color: 'var(--success-600)' }}>Ücretsiz</span>}
                      </span>
                    </div>
                  ))}
                  {/* Total */}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '12px 14px',
                    background: 'var(--gray-50)',
                    borderTop: '2px solid var(--gray-200)',
                    fontWeight: 700,
                    fontSize: '0.95rem',
                  }}>
                    <span>Toplam</span>
                    <span style={{ color: 'var(--primary-600)', fontSize: '1.05rem' }}>
                      {selectedRecord.warrantyRepair ? (
                        <span style={{ color: 'var(--success-600)' }}>Garanti — Ücretsiz</span>
                      ) : (
                        formatCurrency(selectedRecord.totalCost)
                      )}
                    </span>
                  </div>
                </div>
              </div>

              {/* Notes */}
              {selectedRecord.notes && (
                <div style={{
                  padding: '10px 14px',
                  background: 'var(--gray-50)',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.82rem',
                  color: 'var(--gray-600)',
                }}>
                  <strong>📝 Not: </strong>{selectedRecord.notes}
                </div>
              )}
            </div>
            <div className="modal-footer">
              {selectedRecord.status === 'Hazır' && (
                <button className="btn btn-primary">📤 Teslim Edildi Olarak İşaretle</button>
              )}
              <button className="btn btn-secondary" onClick={() => setSelectedRecord(null)}>Kapat</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Service Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 640 }}>
            <div className="modal-header">
              <span className="modal-title">➕ Yeni Servis Kaydı</span>
              <button className="modal-close" onClick={() => setShowAddModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Hasta</label>
                <input className="form-input" placeholder="Hasta adı veya TC ile ara..." />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Cihaz</label>
                  <input className="form-input" placeholder="Cihaz adı / modeli" />
                </div>
                <div className="form-group">
                  <label className="form-label">Seri No</label>
                  <input className="form-input" placeholder="Cihaz seri numarası" />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Arıza / Sorun Tanımı</label>
                <textarea className="form-textarea" placeholder="Hastanın bildirdiği sorun..." />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Alım Tarihi</label>
                  <input className="form-input" type="date" />
                </div>
                <div className="form-group">
                  <label className="form-label">Tahmini Teslim Tarihi</label>
                  <input className="form-input" type="date" />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Teknisyen</label>
                  <select className="form-select">
                    <option>Emre Koç</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Garanti Durumu</label>
                  <select className="form-select">
                    <option>Garanti Dışı</option>
                    <option>Garanti Kapsamında</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Notlar</label>
                <textarea className="form-textarea" placeholder="Ek notlar..." />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowAddModal(false)}>İptal</button>
              <button className="btn btn-primary" onClick={() => setShowAddModal(false)}>💾 Kaydı Oluştur</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
