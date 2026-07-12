'use client';

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
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
  accessoriesTaken?: string[];
  complaints?: string[];
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
  const { addSale, addToast } = useApp();
  const [filterStatus, setFilterStatus] = useState('Tümü');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<ServiceRecord | null>(null);
  const [records, setRecords] = useState<ServiceRecord[]>(serviceRecords);

  const [newRecordForm, setNewRecordForm] = useState({
    patientName: '',
    deviceName: '',
    serialNo: '',
    problem: '',
    receivedDate: '2026-07-10',
    estimatedDate: '2026-07-15',
    technician: 'Emre Koç',
    warrantyRepair: false,
    notes: '',
    accessories: [] as string[],
    complaints: [] as string[]
  });

  const toggleAccessory = (acc: string) => {
    const list = newRecordForm.accessories;
    const updated = list.includes(acc) ? list.filter(a => a !== acc) : [...list, acc];
    setNewRecordForm({ ...newRecordForm, accessories: updated });
  };

  const toggleComplaint = (comp: string) => {
    const list = newRecordForm.complaints;
    const updated = list.includes(comp) ? list.filter(c => c !== comp) : [...list, comp];
    setNewRecordForm({ ...newRecordForm, complaints: updated });
  };

  const handleSaveNewRecord = () => {
    if (!newRecordForm.patientName || !newRecordForm.deviceName) {
      alert('Lütfen hasta ve cihaz adı girin.');
      return;
    }
    const newRec: ServiceRecord = {
      id: `srv-${Date.now().toString().slice(-6)}`,
      patientName: newRecordForm.patientName,
      deviceName: newRecordForm.deviceName,
      serialNo: newRecordForm.serialNo || 'SN-UNKNOWN',
      receivedDate: newRecordForm.receivedDate,
      estimatedDate: newRecordForm.estimatedDate,
      returnedDate: null,
      problem: newRecordForm.problem || (newRecordForm.complaints.length > 0 ? newRecordForm.complaints.join(', ') : 'Arıza belirtilmedi'),
      operations: [],
      totalCost: 0,
      status: 'Alındı',
      technician: newRecordForm.technician,
      warrantyRepair: newRecordForm.warrantyRepair,
      notes: newRecordForm.notes,
      accessoriesTaken: newRecordForm.accessories,
      complaints: newRecordForm.complaints
    };

    setRecords([newRec, ...records]);
    setShowAddModal(false);
    setNewRecordForm({
      patientName: '',
      deviceName: '',
      serialNo: '',
      problem: '',
      receivedDate: '2026-07-10',
      estimatedDate: '2026-07-15',
      technician: 'Emre Koç',
      warrantyRepair: false,
      notes: '',
      accessories: [],
      complaints: []
    });
    addToast({ type: 'success', message: `${newRec.patientName} adına yeni teknik servis kaydı oluşturuldu.` });
  };

  const handleDeliver = (record: ServiceRecord) => {
    const updatedRecords = records.map(r => 
      r.id === record.id 
        ? { ...r, status: 'Teslim Edildi' as const, returnedDate: '2026-07-10' }
        : r
    );
    setRecords(updatedRecords);
    setSelectedRecord({ ...record, status: 'Teslim Edildi', returnedDate: '2026-07-10' });

    if (!record.warrantyRepair && record.totalCost > 0) {
      const newSale = {
        id: `s-srv-${Date.now().toString().slice(-6)}`,
        patientId: 'p-unknown',
        date: '2026-07-10',
        patientName: record.patientName,
        items: [
          { name: `Teknik Servis Onarım: ${record.deviceName}`, quantity: 1, price: record.totalCost }
        ],
        total: record.totalCost,
        sgkAmount: 0,
        patientAmount: record.totalCost,
        paymentMethod: 'Nakit' as const,
        status: 'Tahsil Edildi' as const
      };
      addSale(newSale);
      addToast({
        type: 'success',
        message: `${record.patientName} adına servis teslim kaydı yapıldı. ${formatCurrency(record.totalCost)} tutarındaki teknik servis geliri kasaya işlendi.`
      });
    } else {
      addToast({
        type: 'success',
        message: `${record.patientName} adına servis teslim kaydı tamamlandı (Garanti Kapsamı - Ücretsiz).`
      });
    }
  };

  const filtered = records.filter(r =>
    filterStatus === 'Tümü' || r.status === filterStatus
  );

  const activeCount = records.filter(r => !['Teslim Edildi'].includes(r.status)).length;
  const waitingCount = records.filter(r => r.status === 'Hazır').length;
  const totalRevenue = records.reduce((sum, r) => sum + r.totalCost, 0);
  const warrantyCount = records.filter(r => r.warrantyRepair).length;

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
              <div className="responsive-grid-2" style={{ marginBottom: 20 }}>
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
                <div style={{ fontSize: '0.72rem', color: 'var(--warning-600)', marginBottom: 4, fontWeight: 600 }}>Bildirilen Arıza</div>
                <div style={{ fontSize: '0.88rem', color: 'var(--gray-800)' }}>{selectedRecord.problem}</div>
              </div>

              {/* Accessories and Checklist */}
              {((selectedRecord.accessoriesTaken && selectedRecord.accessoriesTaken.length > 0) || 
                (selectedRecord.complaints && selectedRecord.complaints.length > 0)) && (
                <div className="responsive-grid-2" style={{ marginBottom: 16 }}>
                  {selectedRecord.accessoriesTaken && selectedRecord.accessoriesTaken.length > 0 && (
                    <div style={{
                      padding: '12px 14px',
                      background: 'var(--primary-50)',
                      border: '1px solid var(--primary-100)',
                      borderRadius: 'var(--radius-md)',
                    }}>
                      <div style={{ fontSize: '0.72rem', color: 'var(--primary-600)', marginBottom: 6, fontWeight: 600 }}>Teslim Alınan Aksesuarlar</div>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {selectedRecord.accessoriesTaken.map((acc, index) => (
                          <span key={index} className="badge badge-info" style={{ fontSize: '0.74rem' }}>{acc}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {selectedRecord.complaints && selectedRecord.complaints.length > 0 && (
                    <div style={{
                      padding: '12px 14px',
                      background: 'var(--danger-50)',
                      border: '1px solid var(--danger-100)',
                      borderRadius: 'var(--radius-md)',
                    }}>
                      <div style={{ fontSize: '0.72rem', color: 'var(--danger-600)', marginBottom: 6, fontWeight: 600 }}>Çeklist Şikayetleri</div>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {selectedRecord.complaints.map((comp, index) => (
                          <span key={index} className="badge badge-neutral" style={{ fontSize: '0.74rem', background: 'var(--gray-200)', color: 'var(--gray-700)' }}>{comp}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

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
                <button className="btn btn-primary" onClick={() => handleDeliver(selectedRecord)}>
                  Teslim Edildi Olarak İşaretle
                </button>
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
              <span className="modal-title">Yeni Servis Kaydı</span>
              <button className="modal-close" onClick={() => setShowAddModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Hasta Adı Soyadı</label>
                <input
                  className="form-input"
                  placeholder="Hasta adı soyadı girin..."
                  value={newRecordForm.patientName}
                  onChange={(e) => setNewRecordForm({ ...newRecordForm, patientName: e.target.value })}
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Cihaz</label>
                  <input
                    className="form-input"
                    placeholder="Cihaz adı / modeli"
                    value={newRecordForm.deviceName}
                    onChange={(e) => setNewRecordForm({ ...newRecordForm, deviceName: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Seri No</label>
                  <input
                    className="form-input"
                    placeholder="Cihaz seri numarası"
                    value={newRecordForm.serialNo}
                    onChange={(e) => setNewRecordForm({ ...newRecordForm, serialNo: e.target.value })}
                  />
                </div>
              </div>

              {/* Teslim Alınan Aksesuarlar */}
              <div className="form-group">
                <label className="form-label">Teslim Alınan Aksesuarlar</label>
                <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 6, marginBottom: 12 }}>
                  {['Pil', 'Cihaz Kutusu', 'Garanti Kartı', 'Kulak Kalıbı'].map(acc => (
                    <label key={acc} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.84rem', cursor: 'pointer', color: 'var(--gray-700)' }}>
                      <input
                        type="checkbox"
                        checked={newRecordForm.accessories.includes(acc)}
                        onChange={() => toggleAccessory(acc)}
                      />
                      {acc}
                    </label>
                  ))}
                </div>
              </div>

              {/* Sık Karşılaşılan Şikayetler */}
              <div className="form-group">
                <label className="form-label">Sık Karşılaşılan Şikayetler (Çeklist)</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 8, marginTop: 6, marginBottom: 12 }}>
                  {[
                    'Çalışmıyor',
                    'Ses Az/Kısık',
                    'Ara Ara Kesiliyor',
                    'Hışırtı/Parazit',
                    'Bluetooth Bağlantı Sorunu',
                    'Feedback (Çınlama)',
                    'Yüksek Pil Tüketimi'
                  ].map(comp => (
                    <label key={comp} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.84rem', cursor: 'pointer', color: 'var(--gray-700)' }}>
                      <input
                        type="checkbox"
                        checked={newRecordForm.complaints.includes(comp)}
                        onChange={() => toggleComplaint(comp)}
                      />
                      {comp}
                    </label>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Ek Arıza / Sorun Tanımı</label>
                <textarea
                  className="form-textarea"
                  placeholder="Hastanın bildirdiği ek sorunlar..."
                  value={newRecordForm.problem}
                  onChange={(e) => setNewRecordForm({ ...newRecordForm, problem: e.target.value })}
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Alım Tarihi</label>
                  <input
                    className="form-input"
                    type="date"
                    value={newRecordForm.receivedDate}
                    onChange={(e) => setNewRecordForm({ ...newRecordForm, receivedDate: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Tahmini Teslim Tarihi</label>
                  <input
                    className="form-input"
                    type="date"
                    value={newRecordForm.estimatedDate}
                    onChange={(e) => setNewRecordForm({ ...newRecordForm, estimatedDate: e.target.value })}
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Teknisyen</label>
                  <select
                    className="form-select"
                    value={newRecordForm.technician}
                    onChange={(e) => setNewRecordForm({ ...newRecordForm, technician: e.target.value })}
                  >
                    <option>Emre Koç</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Garanti Durumu</label>
                  <select
                    className="form-select"
                    value={newRecordForm.warrantyRepair ? 'Garanti Kapsamında' : 'Garanti Dışı'}
                    onChange={(e) => setNewRecordForm({ ...newRecordForm, warrantyRepair: e.target.value === 'Garanti Kapsamında' })}
                  >
                    <option>Garanti Dışı</option>
                    <option>Garanti Kapsamında</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Notlar</label>
                <textarea
                  className="form-textarea"
                  placeholder="Ek notlar..."
                  value={newRecordForm.notes}
                  onChange={(e) => setNewRecordForm({ ...newRecordForm, notes: e.target.value })}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowAddModal(false)}>İptal</button>
              <button className="btn btn-primary" onClick={handleSaveNewRecord}>Kaydı Oluştur</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
