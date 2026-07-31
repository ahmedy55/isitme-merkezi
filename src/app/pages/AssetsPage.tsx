'use client';

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useBranch } from '../context/BranchContext';
import { BranchService } from '../services/BranchService';
import { IconSearch, IconPlus, IconEdit, IconDelete, IconCheck, IconWarning, IconRefresh } from '../components/Icons';

interface Asset {
  id: string;
  name: string;
  category: 'Klinik Cihaz' | 'Ofis Ekipmanı' | 'Bilgisayar & Çevre' | 'Mobilya' | 'Diğer';
  serialNo: string;
  branch: 'Merkez 1 - Kadıköy' | 'Merkez 2 - Beşiktaş' | 'Genel';
  purchaseDate: string;
  cost: number;
  warrantyExpiry: string;
  lastMaintenance: string;
  maintenanceIntervalMonths: number; // örn: 12 ayda bir
  status: 'Aktif' | 'Arızalı' | 'Bakımda' | 'Hek/Iskarta';
  notes?: string;
}

export default function AssetsPage() {
  const { addToast } = useApp();
  const { activeBranch } = useBranch();

  const [assets, setAssets] = useState<Asset[]>([
    {
      id: 'ast-1',
      name: 'Interacoustics AD629 Odyometre',
      category: 'Klinik Cihaz',
      serialNo: 'IA-2024-0091',
      branch: 'Merkez 1 - Kadıköy',
      purchaseDate: '2024-03-12',
      cost: 145000,
      warrantyExpiry: '2026-03-12',
      lastMaintenance: '2025-03-10',
      maintenanceIntervalMonths: 12,
      status: 'Aktif',
      notes: 'Kalibrasyonu her yıl mart ayında yapılmaktadır.'
    },
    {
      id: 'ast-2',
      name: 'Titan Timpanometre Cihazı',
      category: 'Klinik Cihaz',
      serialNo: 'TT-2025-0044',
      branch: 'Merkez 1 - Kadıköy',
      purchaseDate: '2025-01-15',
      cost: 95000,
      warrantyExpiry: '2027-01-15',
      lastMaintenance: '2025-01-15',
      maintenanceIntervalMonths: 12,
      status: 'Aktif'
    },
    {
      id: 'ast-3',
      name: 'Dell OptiPlex Odyoloji Bilgisayarı',
      category: 'Bilgisayar & Çevre',
      serialNo: 'DL-8H2G9K3',
      branch: 'Merkez 2 - Beşiktaş',
      purchaseDate: '2025-05-10',
      cost: 32000,
      warrantyExpiry: '2027-05-10',
      lastMaintenance: '2025-05-10',
      maintenanceIntervalMonths: 24,
      status: 'Aktif',
      notes: 'Nuh Odyo ölçüm yazılımı yüklü.'
    },
    {
      id: 'ast-4',
      name: 'KBB Hasta Muayene Koltuğu',
      category: 'Mobilya',
      serialNo: 'MB-2023-010',
      branch: 'Merkez 2 - Beşiktaş',
      purchaseDate: '2023-11-20',
      cost: 18000,
      warrantyExpiry: '2025-11-20',
      lastMaintenance: '2024-11-20',
      maintenanceIntervalMonths: 12,
      status: 'Bakımda',
      notes: 'Yükseklik ayar motoru dişlisi kontrol ediliyor.'
    },
    {
      id: 'ast-5',
      name: 'Eski HP LaserJet Yazıcı',
      category: 'Bilgisayar & Çevre',
      serialNo: 'HP-LJP1102',
      branch: 'Merkez 1 - Kadıköy',
      purchaseDate: '2020-02-10',
      cost: 2500,
      warrantyExpiry: '2022-02-10',
      lastMaintenance: '2023-08-12',
      maintenanceIntervalMonths: 12,
      status: 'Hek/Iskarta',
      notes: 'Kartuş arızası var, yedek parça olarak saklanıyor.'
    }
  ]);

  // Search & Filters State
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [branchFilter, setBranchFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingAssetId, setEditingAssetId] = useState<string | null>(null);

  // Form State
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState<'Klinik Cihaz' | 'Ofis Ekipmanı' | 'Bilgisayar & Çevre' | 'Mobilya' | 'Diğer'>('Ofis Ekipmanı');
  const [formSerialNo, setFormSerialNo] = useState('');
  const [formBranch, setFormBranch] = useState<'Merkez 1 - Kadıköy' | 'Merkez 2 - Beşiktaş' | 'Genel'>('Merkez 1 - Kadıköy');
  const [formPurchaseDate, setFormPurchaseDate] = useState('');
  const [formCost, setFormCost] = useState<number>(0);
  const [formWarrantyExpiry, setFormWarrantyExpiry] = useState('');
  const [formLastMaintenance, setFormLastMaintenance] = useState('');
  const [formInterval, setFormInterval] = useState<number>(12);
  const [formStatus, setFormStatus] = useState<'Aktif' | 'Arızalı' | 'Bakımda' | 'Hek/Iskarta'>('Aktif');
  const [formNotes, setFormNotes] = useState('');

  const handleOpenAddModal = () => {
    setIsEditing(false);
    setEditingAssetId(null);
    setFormName('');
    setFormCategory('Ofis Ekipmanı');
    setFormSerialNo('');
    setFormBranch('Merkez 1 - Kadıköy');
    setFormPurchaseDate(new Date().toISOString().split('T')[0]);
    setFormCost(0);
    setFormWarrantyExpiry('');
    setFormLastMaintenance('');
    setFormInterval(12);
    setFormStatus('Aktif');
    setFormNotes('');
    setShowModal(true);
  };

  const handleOpenEditModal = (asset: Asset) => {
    setIsEditing(true);
    setEditingAssetId(asset.id);
    setFormName(asset.name);
    setFormCategory(asset.category);
    setFormSerialNo(asset.serialNo);
    setFormBranch(asset.branch);
    setFormPurchaseDate(asset.purchaseDate);
    setFormCost(asset.cost);
    setFormWarrantyExpiry(asset.warrantyExpiry);
    setFormLastMaintenance(asset.lastMaintenance);
    setFormInterval(asset.maintenanceIntervalMonths);
    setFormStatus(asset.status);
    setFormNotes(asset.notes || '');
    setShowModal(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      alert('Demirbaş adı zorunludur');
      return;
    }

    if (isEditing && editingAssetId) {
      setAssets(prev => prev.map(a => {
        if (a.id === editingAssetId) {
          return {
            ...a,
            name: formName,
            category: formCategory,
            serialNo: formSerialNo,
            branch: formBranch,
            purchaseDate: formPurchaseDate,
            cost: formCost,
            warrantyExpiry: formWarrantyExpiry,
            lastMaintenance: formLastMaintenance,
            maintenanceIntervalMonths: formInterval,
            status: formStatus,
            notes: formNotes
          };
        }
        return a;
      }));
      addToast({ type: 'success', message: 'Demirbaş kaydı güncellendi.' });
    } else {
      const newAsset: Asset = {
        id: 'ast-' + Date.now(),
        name: formName,
        category: formCategory,
        serialNo: formSerialNo,
        branch: formBranch,
        purchaseDate: formPurchaseDate,
        cost: formCost,
        warrantyExpiry: formWarrantyExpiry,
        lastMaintenance: formLastMaintenance,
        maintenanceIntervalMonths: formInterval,
        status: formStatus,
        notes: formNotes
      };
      setAssets(prev => [newAsset, ...prev]);
      addToast({ type: 'success', message: 'Yeni demirbaş kaydı oluşturuldu.' });
    }
    setShowModal(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('Bu demirbaş kaydını silmek istediğinize emin misiniz?')) {
      setAssets(prev => prev.filter(a => a.id !== id));
      addToast({ type: 'warning', message: 'Demirbaş kaydı silindi.' });
    }
  };

  const handleMaintenanceDone = (id: string) => {
    setAssets(prev => prev.map(a => {
      if (a.id === id) {
        return {
          ...a,
          lastMaintenance: new Date().toISOString().split('T')[0]
        };
      }
      return a;
    }));
    addToast({ type: 'success', message: 'Cihaz bakım/kalibrasyon tarihi bugüne güncellendi.' });
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', minimumFractionDigits: 0 }).format(val);
  };

  // Branch Filtered Assets
  const branchFilteredAssets = assets.filter((a, index) => 
    BranchService.matchesBranch(a.branch, undefined, activeBranch, index)
  );

  // Filter Logic
  const filteredAssets = branchFilteredAssets.filter(a => {
    const matchesSearch = 
      a.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.serialNo.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory = categoryFilter === 'All' || a.category === categoryFilter;
    const matchesLocalBranch = branchFilter === 'All' || a.branch === branchFilter;
    const matchesStatus = statusFilter === 'All' || a.status === statusFilter;

    return matchesSearch && matchesCategory && matchesLocalBranch && matchesStatus;
  });

  // Calculate metrics
  const totalValue = branchFilteredAssets.filter(a => a.status !== 'Hek/Iskarta').reduce((sum, a) => sum + a.cost, 0);
  const maintenanceAlertsCount = branchFilteredAssets.filter(a => {
    if (a.status !== 'Aktif') return false;
    const lastDate = new Date(a.lastMaintenance);
    const nextDate = new Date(lastDate.setMonth(lastDate.getMonth() + a.maintenanceIntervalMonths));
    return nextDate.getTime() < new Date().getTime();
  }).length;

  return (
    <div className="page">
      <div className="page-header">
        <div className="page-header-left">
          <h2>Demirbaş & Klinik Cihaz Yönetimi</h2>
          <p>Klinik ekipmanları, kalibrasyon periyotları, garanti takipleri ve şube demirbaş envanteri</p>
        </div>
        <button className="btn btn-primary" onClick={handleOpenAddModal} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <IconPlus size={16} strokeWidth={2} /> Yeni Demirbaş Ekle
        </button>
      </div>

      {/* Summary Row */}
      <div className="stats-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 20 }}>
        <div className="card">
          <div className="card-body" style={{ padding: '16px 20px' }}>
            <div style={{ fontSize: '0.82rem', color: 'var(--gray-500)', fontWeight: 500 }}>Envanter Toplam Değeri</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--gray-800)', marginTop: 4 }}>
              {formatCurrency(totalValue)}
            </div>
            <div style={{ fontSize: '0.74rem', color: 'var(--gray-400)', marginTop: 2 }}>Aktif demirbaşların maliyeti</div>
          </div>
        </div>

        <div className="card">
          <div className="card-body" style={{ padding: '16px 20px' }}>
            <div style={{ fontSize: '0.82rem', color: 'var(--gray-500)', fontWeight: 500 }}>Kalibrasyon Uyarısı</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: maintenanceAlertsCount > 0 ? 'var(--danger-600)' : 'var(--success-600)', marginTop: 4 }}>
              {maintenanceAlertsCount} Cihaz
            </div>
            <div style={{ fontSize: '0.74rem', color: 'var(--gray-400)', marginTop: 2 }}>Bakım zamanı geçmiş cihaz sayısı</div>
          </div>
        </div>

        <div className="card">
          <div className="card-body" style={{ padding: '16px 20px' }}>
            <div style={{ fontSize: '0.82rem', color: 'var(--gray-500)', fontWeight: 500 }}>Bakım & Onarımda</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--warning-600)', marginTop: 4 }}>
              {assets.filter(a => a.status === 'Bakımda').length} adet
            </div>
            <div style={{ fontSize: '0.74rem', color: 'var(--gray-400)', marginTop: 2 }}>Geçici servis dışı envanter</div>
          </div>
        </div>
      </div>

      {/* Filters Options */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-body" style={{ padding: 16 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
            <div style={{ flex: 1, minWidth: 240, position: 'relative' }}>
              <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-400)' }}>
                <IconSearch size={18} />
              </span>
              <input
                className="form-input"
                placeholder="Demirbaş adı veya Seri No ile ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ paddingLeft: 38, width: '100%', margin: 0 }}
              />
            </div>

            <div style={{ minWidth: 150 }}>
              <select className="form-input" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} style={{ margin: 0 }}>
                <option value="All">Tüm Kategoriler</option>
                <option value="Klinik Cihaz">Klinik Cihaz</option>
                <option value="Ofis Ekipmanı">Ofis Ekipmanı</option>
                <option value="Bilgisayar & Çevre">Bilgisayar & Çevre</option>
                <option value="Mobilya">Mobilya</option>
                <option value="Diğer">Diğer</option>
              </select>
            </div>

            <div style={{ minWidth: 150 }}>
              <select className="form-input" value={branchFilter} onChange={(e) => setBranchFilter(e.target.value)} style={{ margin: 0 }}>
                <option value="All">Tüm Şubeler</option>
                <option value="Merkez 1 - Kadıköy">Merkez 1 - Kadıköy</option>
                <option value="Merkez 2 - Beşiktaş">Merkez 2 - Beşiktaş</option>
                <option value="Genel">Genel</option>
              </select>
            </div>

            <div style={{ minWidth: 130 }}>
              <select className="form-input" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ margin: 0 }}>
                <option value="All">Tüm Durumlar</option>
                <option value="Aktif">Aktif</option>
                <option value="Arızalı">Arızalı</option>
                <option value="Bakımda">Bakımda</option>
                <option value="Hek/Iskarta">Hek / Iskarta</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Assets List */}
      <div className="card">
        <div className="card-body" style={{ padding: 0, overflowX: 'auto' }}>
          <table className="table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: 'var(--gray-50)', borderBottom: '1px solid var(--surface-border)' }}>
                <th style={{ padding: '12px 16px', fontWeight: 600, fontSize: '0.84rem' }}>Ekipman / Cihaz</th>
                <th style={{ padding: '12px 16px', fontWeight: 600, fontSize: '0.84rem' }}>Kategori</th>
                <th style={{ padding: '12px 16px', fontWeight: 600, fontSize: '0.84rem' }}>Şube</th>
                <th style={{ padding: '12px 16px', fontWeight: 600, fontSize: '0.84rem' }}>Satın Alma & Garanti</th>
                <th style={{ padding: '12px 16px', fontWeight: 600, fontSize: '0.84rem' }}>Son / Gelecek Bakım</th>
                <th style={{ padding: '12px 16px', fontWeight: 600, fontSize: '0.84rem' }}>Maliyet</th>
                <th style={{ padding: '12px 16px', fontWeight: 600, fontSize: '0.84rem' }}>Durum</th>
                <th style={{ padding: '12px 16px', fontWeight: 600, fontSize: '0.84rem', textAlign: 'right' }}>İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {filteredAssets.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ padding: 40, textAlign: 'center', color: 'var(--gray-400)' }}>
                    Kriterlere uygun demirbaş envanteri bulunamadı.
                  </td>
                </tr>
              ) : (
                filteredAssets.map((asset) => {
                  const lastDate = new Date(asset.lastMaintenance);
                  const nextDate = new Date(lastDate.setMonth(lastDate.getMonth() + asset.maintenanceIntervalMonths));
                  const isMaintenanceOverdue = asset.status === 'Aktif' && nextDate.getTime() < new Date().getTime();

                  return (
                    <tr key={asset.id} style={{ borderBottom: '1px solid var(--surface-border-light)' }}>
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ fontWeight: 600, color: 'var(--gray-800)' }}>{asset.name}</div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--gray-400)', fontFamily: 'monospace' }}>SN: {asset.serialNo}</div>
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <span className="badge" style={{ background: 'var(--gray-100)', color: 'var(--gray-700)', padding: '4px 8px', borderRadius: 4, fontSize: '0.8rem' }}>
                          {asset.category}
                        </span>
                      </td>
                      <td style={{ padding: '14px 16px', fontSize: '0.86rem', color: 'var(--gray-700)' }}>
                        {asset.branch}
                      </td>
                      <td style={{ padding: '14px 16px', fontSize: '0.82rem', color: 'var(--gray-700)' }}>
                        <div>Alış: {asset.purchaseDate}</div>
                        <div style={{ color: 'var(--gray-400)' }}>Garanti: {asset.warrantyExpiry}</div>
                      </td>
                      <td style={{ padding: '14px 16px', fontSize: '0.82rem', color: 'var(--gray-700)' }}>
                        <div>Bakım: {asset.lastMaintenance}</div>
                        <div style={{ fontWeight: isMaintenanceOverdue ? 700 : 500, color: isMaintenanceOverdue ? 'var(--danger-600)' : 'var(--gray-400)' }}>
                          Sonraki: {nextDate.toISOString().split('T')[0]} {isMaintenanceOverdue && '⚠️'}
                        </div>
                      </td>
                      <td style={{ padding: '14px 16px', fontWeight: 600, color: 'var(--gray-800)' }}>
                        {formatCurrency(asset.cost)}
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <span className={`badge badge-${
                          asset.status === 'Aktif' ? 'success' :
                          asset.status === 'Bakımda' ? 'warning' :
                          asset.status === 'Arızalı' ? 'danger' : 'neutral'
                        }`} style={{ padding: '4px 8px', borderRadius: 4, fontSize: '0.8rem' }}>
                          {asset.status}
                        </span>
                      </td>
                      <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6 }}>
                          {asset.status === 'Aktif' && (
                            <button
                              className="btn btn-sm btn-secondary"
                              onClick={() => handleMaintenanceDone(asset.id)}
                              style={{ padding: '2px 6px', fontSize: '0.78rem' }}
                              title="Kalibrasyon/Bakım Yapıldı İşaretle"
                            >
                              Bakım Yapıldı
                            </button>
                          )}
                          <button
                            className="btn-icon"
                            onClick={() => handleOpenEditModal(asset)}
                            style={{ color: 'var(--primary-500)', padding: 6 }}
                            title="Düzenle"
                          >
                            <IconEdit size={16} />
                          </button>
                          <button
                            className="btn-icon"
                            onClick={() => handleDelete(asset.id)}
                            style={{ color: 'var(--danger-500)', padding: 6 }}
                            title="Sil"
                          >
                            <IconDelete size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Asset Modal */}
      {showModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          backgroundColor: 'rgba(0,0,0,0.4)',
          backdropFilter: 'blur(3px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 9999
        }}>
          <div className="card" style={{ width: 500, maxWidth: '90%', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid var(--surface-border)' }}>
              <span className="card-title" style={{ fontSize: '1.2rem', fontWeight: 700 }}>
                {isEditing ? 'Demirbaş Bilgilerini Düzenle' : 'Yeni Demirbaş Kaydı Oluştur'}
              </span>
              <button onClick={() => setShowModal(false)} style={{ color: 'var(--gray-400)', fontSize: '1.4rem' }}>&times;</button>
            </div>
            <form onSubmit={handleSave}>
              <div className="card-body" style={{ padding: 20 }}>
                <div className="form-group" style={{ marginBottom: 12 }}>
                  <label className="form-label">Cihaz / Ekipman Adı</label>
                  <input
                    className="form-input"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    required
                    placeholder="Örn: Interacoustics Odyometre"
                  />
                </div>

                <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
                  <div className="form-group" style={{ flex: 1, margin: 0 }}>
                    <label className="form-label">Kategori</label>
                    <select className="form-input" value={formCategory} onChange={(e) => setFormCategory(e.target.value as any)}>
                      <option value="Klinik Cihaz">Klinik Cihaz</option>
                      <option value="Ofis Ekipmanı">Ofis Ekipmanı</option>
                      <option value="Bilgisayar & Çevre">Bilgisayar & Çevre</option>
                      <option value="Mobilya">Mobilya</option>
                      <option value="Diğer">Diğer</option>
                    </select>
                  </div>
                  <div className="form-group" style={{ flex: 1, margin: 0 }}>
                    <label className="form-label">Seri Numarası</label>
                    <input
                      className="form-input"
                      value={formSerialNo}
                      onChange={(e) => setFormSerialNo(e.target.value)}
                      placeholder="Barkod veya Seri No"
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
                  <div className="form-group" style={{ flex: 1, margin: 0 }}>
                    <label className="form-label">Bulunduğu Şube</label>
                    <select className="form-input" value={formBranch} onChange={(e) => setFormBranch(e.target.value as any)}>
                      <option value="Merkez 1 - Kadıköy">Merkez 1 - Kadıköy</option>
                      <option value="Merkez 2 - Beşiktaş">Merkez 2 - Beşiktaş</option>
                      <option value="Genel">Genel (Tüm Şirket)</option>
                    </select>
                  </div>
                  <div className="form-group" style={{ flex: 1, margin: 0 }}>
                    <label className="form-label">Satın Alma Maliyeti (TL)</label>
                    <input
                      type="number"
                      className="form-input"
                      value={formCost}
                      onChange={(e) => setFormCost(Number(e.target.value))}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
                  <div className="form-group" style={{ flex: 1, margin: 0 }}>
                    <label className="form-label">Satın Alma Tarihi</label>
                    <input
                      type="date"
                      className="form-input"
                      value={formPurchaseDate}
                      onChange={(e) => setFormPurchaseDate(e.target.value)}
                    />
                  </div>
                  <div className="form-group" style={{ flex: 1, margin: 0 }}>
                    <label className="form-label">Garanti Bitiş Tarihi</label>
                    <input
                      type="date"
                      className="form-input"
                      value={formWarrantyExpiry}
                      onChange={(e) => setFormWarrantyExpiry(e.target.value)}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
                  <div className="form-group" style={{ flex: 1, margin: 0 }}>
                    <label className="form-label">Son Bakım/Kalibrasyon</label>
                    <input
                      type="date"
                      className="form-input"
                      value={formLastMaintenance}
                      onChange={(e) => setFormLastMaintenance(e.target.value)}
                    />
                  </div>
                  <div className="form-group" style={{ flex: 1, margin: 0 }}>
                    <label className="form-label">Bakım Periyodu (Ay)</label>
                    <input
                      type="number"
                      className="form-input"
                      value={formInterval}
                      onChange={(e) => setFormInterval(Number(e.target.value))}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
                  <div className="form-group" style={{ flex: 1, margin: 0 }}>
                    <label className="form-label">Kullanım Durumu</label>
                    <select className="form-input" value={formStatus} onChange={(e) => setFormStatus(e.target.value as any)}>
                      <option value="Aktif">Aktif</option>
                      <option value="Arızalı">Arızalı</option>
                      <option value="Bakımda">Bakımda</option>
                      <option value="Hek/Iskarta">Hek / Iskarta</option>
                    </select>
                  </div>
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Özel Açıklamalar</label>
                  <textarea
                    className="form-input"
                    rows={2}
                    value={formNotes}
                    onChange={(e) => setFormNotes(e.target.value)}
                    style={{ resize: 'none' }}
                  />
                </div>
              </div>

              <div className="card-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, padding: '12px 20px', borderTop: '1px solid var(--surface-border)' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>İptal</button>
                <button type="submit" className="btn btn-primary">Kaydet</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
