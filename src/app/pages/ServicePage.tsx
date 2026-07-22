'use client';

import React, { useState, useEffect, useRef } from 'react';
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
    unregisteredPatient: false,
    unregisteredPhone: '',
    unregisteredTC: '',
    unregisteredAddress: '',
    deviceName: '',
    externalDevice: false,
    externalMarka: '',
    externalModel: '',
    externalSeriNo: '',
    externalTip: '',
    serialNo: '',
    accessories: [] as string[],
    moldModel: '',
    customerComplaints: [] as string[],
    technicianComplaints: [] as string[],
    problem: '',
    extraDescription: '',
    warrantyRepair: true,
    warrantyEndDate: '',
    receivedDate: '2026-07-22',
    estimatedDate: '2026-07-27',
    serviceTarget: 'Hedef',
    serviceTargetName: '',
    deliveredBy: '',
    technician: 'Emre Koç',
    notes: ''
  });

  const [patientSearchText, setPatientSearchText] = useState('');
  const [isPatientDropdownOpen, setIsPatientDropdownOpen] = useState(false);
  const [moldSearchText, setMoldSearchText] = useState('');
  const [isMoldDropdownOpen, setIsMoldDropdownOpen] = useState(false);

  const patientDropdownRef = useRef<HTMLDivElement>(null);
  const moldDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (patientDropdownRef.current && !patientDropdownRef.current.contains(event.target as Node)) {
        setIsPatientDropdownOpen(false);
      }
      if (moldDropdownRef.current && !moldDropdownRef.current.contains(event.target as Node)) {
        setIsMoldDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const patientsListMock = [
    { name: 'Ayşe Demir', tc: '22222222222' },
    { name: 'Ali Yılmaz', tc: '11111111111' },
    { name: 'SAMET ALTOK', tc: '12638639514' },
    { name: 'Mehmet Kaya', tc: '33333333333' },
    { name: 'Hasan Çelik', tc: '44444444444' },
    { name: 'Fatma Özkan', tc: '55555555555' }
  ];

  const moldOptions = [
    'Prob',
    'Kısa Destekli Akrilik',
    'Yarım Konka İskelet',
    'Yarım Konka',
    'İskelet',
    'Tam Konka',
    'Destekli',
    'Receiver'
  ];

  const toggleAccessory = (acc: string) => {
    const list = newRecordForm.accessories;
    const updated = list.includes(acc) ? list.filter(a => a !== acc) : [...list, acc];
    setNewRecordForm({ ...newRecordForm, accessories: updated });
  };

  const toggleCustomerComplaint = (comp: string) => {
    const list = newRecordForm.customerComplaints;
    const updated = list.includes(comp) ? list.filter(c => c !== comp) : [...list, comp];
    setNewRecordForm({ ...newRecordForm, customerComplaints: updated });
  };

  const toggleTechnicianComplaint = (comp: string) => {
    const list = newRecordForm.technicianComplaints;
    const updated = list.includes(comp) ? list.filter(c => c !== comp) : [...list, comp];
    setNewRecordForm({ ...newRecordForm, technicianComplaints: updated });
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
      problem: newRecordForm.problem || (newRecordForm.customerComplaints.length > 0 ? newRecordForm.customerComplaints.join(', ') : 'Arıza belirtilmedi'),
      operations: [],
      totalCost: 0,
      status: 'Alındı',
      technician: newRecordForm.technician,
      warrantyRepair: newRecordForm.warrantyRepair,
      notes: newRecordForm.notes,
      accessoriesTaken: newRecordForm.accessories,
      complaints: [...newRecordForm.customerComplaints, ...newRecordForm.technicianComplaints]
    };

    setRecords([newRec, ...records]);
    setShowAddModal(false);
    setNewRecordForm({
      patientName: '',
      unregisteredPatient: false,
      unregisteredPhone: '',
      unregisteredTC: '',
      unregisteredAddress: '',
      deviceName: '',
      externalDevice: false,
      externalMarka: '',
      externalModel: '',
      externalSeriNo: '',
      externalTip: '',
      serialNo: '',
      accessories: [],
      moldModel: '',
      customerComplaints: [],
      technicianComplaints: [],
      problem: '',
      extraDescription: '',
      warrantyRepair: true,
      warrantyEndDate: '',
      receivedDate: '2026-07-22',
      estimatedDate: '2026-07-27',
      serviceTarget: 'Hedef',
      serviceTargetName: '',
      deliveredBy: '',
      technician: 'Emre Koç',
      notes: ''
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

      {/* Tamir Kabul - Yeni Kayıt Modal (Authentic Odimax UI) */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 680, width: '95%' }}>
            
            {/* Modal Header */}
            <div className="modal-header" style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: '1.2rem' }}>🔑</span>
                <span className="modal-title" style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a' }}>
                  Tamir Kabul - Yeni Kayıt
                </span>
              </div>
              <button className="modal-close" onClick={() => setShowAddModal(false)}>✕</button>
            </div>

            {/* Modal Body */}
            <div className="modal-body" style={{ padding: 20, maxHeight: '78vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
              
              {/* 1. HASTA SECTION */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <label className="form-label" style={{ fontWeight: 700, color: '#0f172a', margin: 0 }}>
                    Hasta
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.82rem', color: '#475569', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={newRecordForm.unregisteredPatient}
                      onChange={(e) => setNewRecordForm({ ...newRecordForm, unregisteredPatient: e.target.checked })}
                    />
                    Kayıtsız hasta (dışarıdan geldi)
                  </label>
                </div>

                {newRecordForm.unregisteredPatient ? (
                  /* Kayıtsız Hasta Inputs (Matching Screenshot 2) */
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="Ad Soyad *"
                        value={newRecordForm.patientName}
                        onChange={(e) => setNewRecordForm({ ...newRecordForm, patientName: e.target.value })}
                      />
                      <input
                        type="text"
                        className="form-input"
                        placeholder="Telefon"
                        value={newRecordForm.unregisteredPhone}
                        onChange={(e) => setNewRecordForm({ ...newRecordForm, unregisteredPhone: e.target.value })}
                      />
                      <input
                        type="text"
                        className="form-input"
                        placeholder="TC No"
                        value={newRecordForm.unregisteredTC}
                        onChange={(e) => setNewRecordForm({ ...newRecordForm, unregisteredTC: e.target.value })}
                      />
                    </div>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Adres"
                      value={newRecordForm.unregisteredAddress}
                      onChange={(e) => setNewRecordForm({ ...newRecordForm, unregisteredAddress: e.target.value })}
                    />
                    <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: 4 }}>
                      Kaydedince hasta "Tamir için gelen" durumuyla oluşturulur.
                    </div>
                  </div>
                ) : (
                  /* Searchable Patient Dropdown (Matching Screenshot 1) */
                  <div ref={patientDropdownRef} style={{ position: 'relative' }}>
                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                      <input
                        type="text"
                        className="form-input"
                        style={{ paddingRight: 36, borderColor: isPatientDropdownOpen ? '#0091ff' : undefined }}
                        placeholder="Hasta ara ve seç"
                        value={patientSearchText || newRecordForm.patientName}
                        onFocus={() => setIsPatientDropdownOpen(true)}
                        onChange={(e) => {
                          setPatientSearchText(e.target.value);
                          setNewRecordForm({ ...newRecordForm, patientName: e.target.value });
                          setIsPatientDropdownOpen(true);
                        }}
                      />
                      <span style={{ position: 'absolute', right: 12, color: '#94a3b8', pointerEvents: 'none', fontSize: '0.88rem' }}>🔍</span>
                    </div>

                    {isPatientDropdownOpen && (
                      <div style={{
                        position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 30,
                        background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 8,
                        boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)', marginTop: 4, maxHeight: 180, overflowY: 'auto'
                      }}>
                        {patientsListMock
                          .filter(p => `${p.name} ${p.tc}`.toLowerCase().includes((patientSearchText || '').toLowerCase()))
                          .map((p, idx) => (
                            <div
                              key={idx}
                              onClick={() => {
                                setNewRecordForm({ ...newRecordForm, patientName: p.name });
                                setPatientSearchText(`${p.name} (${p.tc})`);
                                setIsPatientDropdownOpen(false);
                              }}
                              style={{
                                padding: '10px 14px', fontSize: '0.84rem', cursor: 'pointer',
                                color: '#1e293b', borderBottom: idx < patientsListMock.length - 1 ? '1px solid #f1f5f9' : 'none',
                                background: newRecordForm.patientName === p.name ? '#f8fafc' : '#ffffff'
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.background = '#f1f5f9'}
                              onMouseLeave={(e) => e.currentTarget.style.background = newRecordForm.patientName === p.name ? '#f8fafc' : '#ffffff'}
                            >
                              {p.name} ({p.tc})
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* 2. CİHAZ SECTION */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <label className="form-label" style={{ fontWeight: 700, color: '#0f172a', margin: 0 }}>
                    Cihaz
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.82rem', color: '#475569', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={newRecordForm.externalDevice}
                      onChange={(e) => setNewRecordForm({ ...newRecordForm, externalDevice: e.target.checked })}
                    />
                    Dış cihaz (bizim sattığımız değil)
                  </label>
                </div>

                {newRecordForm.externalDevice ? (
                  /* External Device 4 Inputs (Matching Screenshot 4) */
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 10 }}>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Marka"
                      value={newRecordForm.externalMarka}
                      onChange={(e) => setNewRecordForm({ ...newRecordForm, externalMarka: e.target.value, deviceName: `${e.target.value} ${newRecordForm.externalModel}` })}
                    />
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Model"
                      value={newRecordForm.externalModel}
                      onChange={(e) => setNewRecordForm({ ...newRecordForm, externalModel: e.target.value, deviceName: `${newRecordForm.externalMarka} ${e.target.value}` })}
                    />
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Seri No"
                      value={newRecordForm.externalSeriNo}
                      onChange={(e) => setNewRecordForm({ ...newRecordForm, externalSeriNo: e.target.value, serialNo: e.target.value })}
                    />
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Tip"
                      value={newRecordForm.externalTip}
                      onChange={(e) => setNewRecordForm({ ...newRecordForm, externalTip: e.target.value })}
                    />
                  </div>
                ) : (
                  /* Standard Device Dropdown (Matching Odimax UI) */
                  <select
                    className="form-select"
                    value={newRecordForm.deviceName}
                    onChange={(e) => setNewRecordForm({ ...newRecordForm, deviceName: e.target.value })}
                  >
                    <option value="">Bu hastaya ait cihaz bulunamadı — dış cihaz işaretleyin</option>
                    <option value="Phonak Audéo P90 (SN: PH-2024-00142)">Phonak Audéo P90 (SN: PH-2024-00142)</option>
                    <option value="Oticon More 1 (SN: OT-2024-00089)">Oticon More 1 (SN: OT-2024-00089)</option>
                    <option value="Signia Pure 7Nx (SN: SG-2024-00176)">Signia Pure 7Nx (SN: SG-2024-00176)</option>
                  </select>
                )}
              </div>

              {/* 3. BİRLİKTE ALINAN AKSESUARLAR */}
              <div>
                <label className="form-label" style={{ fontWeight: 700, color: '#0f172a', marginBottom: 8 }}>
                  Birlikte alınan aksesuarlar
                </label>
                <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', fontSize: '0.86rem', color: '#334155' }}>
                  {['Pil', 'Garanti Kartı', 'Kutu', 'Kulak Kalıbı'].map((acc) => (
                    <label key={acc} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
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

              {/* 4. KALIP MODELİ (Matching Screenshot 5) */}
              <div>
                <label className="form-label" style={{ fontWeight: 700, color: '#0f172a', marginBottom: 6 }}>
                  Kalıp Modeli <span style={{ fontWeight: 400, color: '#64748b', fontSize: '0.78rem' }}>(kalıp siparişi değilse boş bırakın)</span>
                </label>

                <div ref={moldDropdownRef} style={{ position: 'relative' }}>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <input
                      type="text"
                      className="form-input"
                      style={{ paddingRight: 36, borderColor: isMoldDropdownOpen ? '#0091ff' : undefined }}
                      placeholder="Kalıp modeli seçin"
                      value={moldSearchText || newRecordForm.moldModel}
                      onFocus={() => setIsMoldDropdownOpen(true)}
                      onChange={(e) => {
                        setMoldSearchText(e.target.value);
                        setNewRecordForm({ ...newRecordForm, moldModel: e.target.value });
                        setIsMoldDropdownOpen(true);
                      }}
                    />
                    <span style={{ position: 'absolute', right: 12, color: '#94a3b8', pointerEvents: 'none', fontSize: '0.88rem' }}>🔍</span>
                  </div>

                  {isMoldDropdownOpen && (
                    <div style={{
                      position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 30,
                      background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 8,
                      boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)', marginTop: 4, maxHeight: 180, overflowY: 'auto'
                    }}>
                      {moldOptions
                        .filter(m => m.toLowerCase().includes((moldSearchText || '').toLowerCase()))
                        .map((m, idx) => (
                          <div
                            key={idx}
                            onClick={() => {
                              setNewRecordForm({ ...newRecordForm, moldModel: m });
                              setMoldSearchText(m);
                              setIsMoldDropdownOpen(false);
                            }}
                            style={{
                              padding: '10px 14px', fontSize: '0.84rem', cursor: 'pointer',
                              color: '#1e293b', borderBottom: idx < moldOptions.length - 1 ? '1px solid #f1f5f9' : 'none',
                              background: newRecordForm.moldModel === m ? '#f8fafc' : '#ffffff'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.background = '#f1f5f9'}
                            onMouseLeave={(e) => e.currentTarget.style.background = newRecordForm.moldModel === m ? '#f8fafc' : '#ffffff'}
                          >
                            {m}
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              </div>

              {/* 5. ŞİKAYET / ARIZA CHECKLIST MATRIX (MÜŞTERİ / TEKNİSYEN) */}
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#0f172a', marginBottom: 8 }}>
                  Şikayet / Arıza
                </div>
                <div style={{ border: '1px solid #e2e8f0', borderRadius: 8, overflow: 'hidden' }}>
                  <div style={{
                    display: 'flex', background: '#f8fafc', padding: '8px 14px', borderBottom: '1px solid #e2e8f0',
                    fontSize: '0.78rem', fontWeight: 700, color: '#475569'
                  }}>
                    <div style={{ flex: 1 }}>Arıza Tanımı</div>
                    <div style={{ width: 90, textAlign: 'center' }}>Müşteri</div>
                    <div style={{ width: 90, textAlign: 'center' }}>Teknisyen</div>
                  </div>
                  {[
                    'Çalışmıyor',
                    'Ara ara kesiliyor',
                    'Açma-kapama anahtarı arızalı',
                    'Ses kontrol düğmesi arızalı',
                    'Yüksek pil tüketimi',
                    'Feedback (çınlama)',
                    'Program geçişi yapmıyor'
                  ].map((comp, idx, arr) => (
                    <div key={idx} style={{
                      display: 'flex', alignItems: 'center', padding: '8px 14px',
                      borderBottom: idx === arr.length - 1 ? 'none' : '1px solid #f1f5f9',
                      fontSize: '0.84rem', background: idx % 2 === 0 ? '#ffffff' : '#fafafa'
                    }}>
                      <div style={{ flex: 1, color: '#334155' }}>{comp}</div>
                      <div style={{ width: 90, textAlign: 'center' }}>
                        <input
                          type="checkbox"
                          checked={newRecordForm.customerComplaints.includes(comp)}
                          onChange={() => toggleCustomerComplaint(comp)}
                        />
                      </div>
                      <div style={{ width: 90, textAlign: 'center' }}>
                        <input
                          type="checkbox"
                          checked={newRecordForm.technicianComplaints.includes(comp)}
                          onChange={() => toggleTechnicianComplaint(comp)}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <textarea
                  className="form-textarea"
                  style={{ marginTop: 10, height: 70, fontSize: '0.84rem' }}
                  placeholder="Ek açıklama (opsiyonel)"
                  value={newRecordForm.extraDescription}
                  onChange={(e) => setNewRecordForm({ ...newRecordForm, extraDescription: e.target.value })}
                />
              </div>

              {/* 6. GARANTİ KAPSAMINDA TOGGLE SWITCH & BİTİŞ TARİHİ */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, background: '#f8fafc', padding: '14px 16px', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <button
                    type="button"
                    onClick={() => setNewRecordForm({ ...newRecordForm, warrantyRepair: !newRecordForm.warrantyRepair })}
                    style={{
                      width: 44, height: 24, borderRadius: 12,
                      background: newRecordForm.warrantyRepair ? '#2563eb' : '#cbd5e1',
                      border: 'none', cursor: 'pointer', position: 'relative',
                      transition: 'all 0.2s ease', padding: 2, flexShrink: 0
                    }}
                  >
                    <div style={{
                      width: 20, height: 20, borderRadius: '50%', background: '#ffffff',
                      position: 'absolute', top: 2,
                      left: newRecordForm.warrantyRepair ? 22 : 2,
                      transition: 'all 0.2s ease', boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
                    }} />
                  </button>
                  <span style={{ fontWeight: 600, fontSize: '0.88rem', color: '#0f172a' }}>
                    Garanti kapsamında
                  </span>
                </div>

                {newRecordForm.warrantyRepair && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                    <span style={{ fontSize: '0.82rem', color: '#475569', fontWeight: 500 }}>Garanti bitiş:</span>
                    <input
                      type="date"
                      className="form-input"
                      style={{ padding: '6px 10px', fontSize: '0.84rem', width: 160 }}
                      value={newRecordForm.warrantyEndDate}
                      onChange={(e) => setNewRecordForm({ ...newRecordForm, warrantyEndDate: e.target.value })}
                    />
                  </div>
                )}
              </div>

              {/* 7. TAMİRE TESLİM TARİHİ */}
              <div>
                <label className="form-label" style={{ fontWeight: 700, color: '#0f172a', marginBottom: 6 }}>
                  Tamire teslim tarihi
                </label>
                <input
                  type="date"
                  className="form-input"
                  value={newRecordForm.receivedDate}
                  onChange={(e) => setNewRecordForm({ ...newRecordForm, receivedDate: e.target.value })}
                />
              </div>

              {/* 8. TEKNİK SERVİSE GÖNDERİLECEKSE (OPSİYONEL) */}
              <div>
                <label className="form-label" style={{ fontWeight: 700, color: '#0f172a', marginBottom: 6 }}>
                  Teknik servise gönderilecekse <span style={{ fontWeight: 400, color: '#64748b', fontSize: '0.78rem' }}>(opsiyonel)</span>
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: 10 }}>
                  <select
                    className="form-select"
                    value={newRecordForm.serviceTarget}
                    onChange={(e) => setNewRecordForm({ ...newRecordForm, serviceTarget: e.target.value })}
                  >
                    <option value="Hedef">Hedef</option>
                    <option value="Merkez Servis">Merkez Servis</option>
                    <option value="Tedarikçi Servis">Tedarikçi Servis</option>
                    <option value="Şube İçi">Şube İçi</option>
                  </select>

                  <input
                    type="text"
                    className="form-input"
                    placeholder="Hangi teknik servis (ad)"
                    value={newRecordForm.serviceTargetName}
                    onChange={(e) => setNewRecordForm({ ...newRecordForm, serviceTargetName: e.target.value })}
                  />
                </div>
              </div>

              {/* 9. TESLİM EDEN (CİHAZI BIRAKAN KİŞİ) */}
              <div>
                <label className="form-label" style={{ fontWeight: 700, color: '#0f172a', marginBottom: 6 }}>
                  Teslim eden <span style={{ fontWeight: 400, color: '#64748b', fontSize: '0.78rem' }}>(cihazı bırakan kişi / opsiyonel)</span>
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Teslim eden adı / yakını (örn: Oğlu Mehmet)"
                  value={newRecordForm.deliveredBy}
                  onChange={(e) => setNewRecordForm({ ...newRecordForm, deliveredBy: e.target.value })}
                />
              </div>

            </div>

            {/* Modal Footer Controls */}
            <div className="modal-footer" style={{ padding: '14px 20px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowAddModal(false)}
              >
                İptal
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleSaveNewRecord}
                style={{ background: '#2563eb', padding: '8px 22px' }}
              >
                Kaydet / Tamir Kaydı Oluştur
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
