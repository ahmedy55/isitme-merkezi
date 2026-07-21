'use client';

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { IconPlus, IconClose } from '../components/Icons';
import { Branch } from '../data/mockData';

export default function BranchesPage() {
  const { stockList, updateStockItem, addToast, branchesList, addBranch, usersList, setCurrentPage } = useApp();
  const [showAddBranchModal, setShowAddBranchModal] = useState(false);
  const [transferCompleted, setTransferCompleted] = useState(false);
  const [branchForm, setBranchForm] = useState({ name: '', address: '', phone: '' });

  const handleConfirmTransfer = () => {
    // Find device in Beşiktaş (Merkez 2 - Beşiktaş)
    const matchedDevice = stockList.find(s => s.branch === 'Merkez 2 - Beşiktaş' && s.category === 'Cihaz');
    if (matchedDevice) {
      const updated = {
        ...matchedDevice,
        branch: 'Merkez 1 - Kadıköy' as const
      };
      updateStockItem(updated);
      addToast({
        type: 'success',
        message: `${matchedDevice.name} (${matchedDevice.serialNo}) başarıyla Beşiktaş şubesinden Kadıköy şubesine transfer edildi.`
      });
      setTransferCompleted(true);
    } else {
      addToast({
        type: 'info',
        message: 'Transfer edilecek uygun cihaz bulunamadı.'
      });
    }
  };

  const handleSaveBranch = () => {
    if (!branchForm.name) {
      alert('Lütfen şube adı girin.');
      return;
    }
    const newBranch: Branch = {
      id: 'br-' + Date.now(),
      name: branchForm.name,
      address: branchForm.address,
      phone: branchForm.phone,
      patientsCount: 0,
      status: 'Aktif'
    };
    addBranch(newBranch);
    setShowAddBranchModal(false);
    setBranchForm({ name: '', address: '', phone: '' });
    addToast({ type: 'success', message: 'Yeni şube kaydı başarıyla oluşturuldu.' });
  };

  // Dinamik Rol Dağılım Özeti (canonical UserRole tiplerinden hesaplanır)
  const rolesSummary = [
    {
      name: 'Firma Yöneticisi',
      desc: 'Tüm şube ve izinlere tam erişim. Sistem ayarlarını yönetir.',
      users: usersList.filter(u => u.roles.includes('Firma Yöneticisi')).length,
      color: 'var(--danger-500)'
    },
    {
      name: 'Odyometrist',
      desc: 'Hasta kaydı, randevu, işitme testleri ve cihaz satışlarını yapar.',
      users: usersList.filter(u => u.roles.includes('Odyometrist')).length,
      color: 'var(--primary-500)'
    },
    {
      name: 'Sekreter',
      desc: 'Hasta kabul, randevu planlama ve ön büro işlerini yönetir.',
      users: usersList.filter(u => u.roles.includes('Sekreter')).length,
      color: 'var(--info-500)'
    },
    {
      name: 'Muhasebe',
      desc: 'Kasa hesapları, ödemeler, masraflar ve faturaları takip eder.',
      users: usersList.filter(u => u.roles.includes('Muhasebe')).length,
      color: 'var(--warning-500)'
    }
  ];

  return (
    <div className="page">
      <div className="page-header">
        <div className="page-header-left">
          <h2>Şubeler & Yetki Yönetimi</h2>
          <p>Şube listesi, stok transferleri ve yetki rolleri dağılımı</p>
        </div>
        <div className="page-header-actions">
          <button className="btn btn-secondary" onClick={() => setShowAddBranchModal(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <IconPlus size={15} strokeWidth={1.8} /> Yeni Şube
          </button>
          <button className="btn btn-primary" onClick={() => setCurrentPage('users')}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <IconPlus size={15} strokeWidth={2} /> Kullanıcıları Yönet
          </button>
        </div>
      </div>

      {/* Akıllı Stok Transfer Önerisi Banner'ı */}
      <div className="card" style={{
        marginBottom: 24,
        background: 'linear-gradient(to right, var(--primary-50), white)',
        border: '1px solid var(--primary-200)',
        padding: '16px 20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 16
      }}>
        <div style={{ flex: 1, minWidth: 280 }}>
          <h4 style={{ color: 'var(--primary-700)', fontWeight: 700, margin: '0 0 4px 0', fontSize: '0.95rem' }}>
            Akıllı Şubeler Arası Stok Transfer Önerisi
          </h4>
          <p style={{ color: 'var(--gray-600)', fontSize: '0.84rem', margin: 0 }}>
            Kadıköy şubesinde cihaz stoğu kritik düzeye düştü. Beşiktaş şubesinde ihtiyaç fazlası 1 adet cihaz tespit edildi. Transfer öneriliyor.
          </p>
        </div>
        <div>
          {transferCompleted ? (
            <span className="badge badge-success" style={{ padding: '8px 12px', fontSize: '0.82rem', fontWeight: 600 }}>
              Transfer Başarıyla Tamamlandı
            </span>
          ) : (
            <button className="btn btn-primary" onClick={handleConfirmTransfer} style={{ fontSize: '0.84rem' }}>
              Transferi Onayla ve Stokları Güncelle
            </button>
          )}
        </div>
      </div>

      {/* Branches */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, marginBottom: 24 }}>
        {branchesList.map((branch) => {
          // Personel sayısını dinamik hesapla
          const staffCount = usersList.filter(u => u.branch === branch.name || u.branch === 'Tüm Şubeler').length;
          return (
            <div key={branch.id} className="card">
              <div className="card-body">
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '1.05rem', marginBottom: 2 }}>{branch.name}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--gray-500)' }}>{branch.address}</div>
                  </div>
                  <span className="badge badge-success">
                    <span className="badge-dot success" />
                    {branch.status}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: 24 }}>
                  <div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--gray-500)' }}>Aktif Personel</div>
                    <div style={{ fontWeight: 700, fontSize: '1.2rem' }}>{staffCount}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--gray-500)' }}>Toplam Hasta</div>
                    <div style={{ fontWeight: 700, fontSize: '1.2rem' }}>{branch.patientsCount}</div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Roles */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-header">
          <span className="card-title">Sistem Rolleri & Dağılımı</span>
        </div>
        <div className="card-body">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
            {rolesSummary.map((role, i) => (
              <div key={i} style={{
                padding: '14px',
                border: '1px solid var(--gray-200)',
                borderRadius: 'var(--radius-lg)',
                borderLeft: `4px solid ${role.color}`,
                background: 'var(--surface-card)'
              }}>
                <div style={{ fontWeight: 700, marginBottom: 4, color: 'var(--gray-800)' }}>{role.name}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)', marginBottom: 8, minHeight: 36 }}>{role.desc}</div>
                <span className="badge badge-neutral" style={{ fontWeight: 600 }}>{role.users} personel</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Users List (Dinamik Context Verisinden) */}
      <div className="card">
        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span className="card-title">Sistem Kullanıcıları</span>
          <button className="btn btn-sm btn-ghost" onClick={() => setCurrentPage('users')}>Kullanıcıları Yönet</button>
        </div>
        <div className="table-container">
          <table className="mobile-cards">
            <thead>
              <tr>
                <th>Kullanıcı</th>
                <th>Roller</th>
                <th>Atandığı Şube</th>
                <th>E-posta</th>
                <th>Durum</th>
                <th>İşlem</th>
              </tr>
            </thead>
            <tbody>
              {usersList.map((user) => (
                <tr key={user.id}>
                  <td data-label="Kullanıcı" className="td-primary" style={{ fontWeight: 600 }}>
                    {user.firstName} {user.lastName}
                  </td>
                  <td data-label="Roller">
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                      {user.roles.map(r => (
                        <span key={r} className="badge badge-info" style={{ fontSize: '0.74rem' }}>{r}</span>
                      ))}
                    </div>
                  </td>
                  <td data-label="Şube">{user.branch}</td>
                  <td data-label="E-posta" style={{ fontSize: '0.82rem', color: 'var(--gray-500)' }}>{user.email}</td>
                  <td data-label="Durum">
                    <span className={`badge badge-${user.status === 'Aktif' ? 'success' : 'danger'}`}>
                      <span className={`badge-dot ${user.status === 'Aktif' ? 'success' : 'danger'}`} />
                      {user.status}
                    </span>
                  </td>
                  <td data-label="İşlem">
                    <button className="btn btn-sm btn-secondary" 
                      onClick={() => setCurrentPage('users')}
                      style={{ fontSize: '0.72rem', padding: '4px 8px' }}>
                      Detay / Yönet
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Yeni Şube Modal */}
      {showAddBranchModal && (
        <div className="modal-overlay" onClick={() => setShowAddBranchModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 480 }}>
            <div className="modal-header">
              <span className="modal-title">Yeni Şube Ekle</span>
              <button className="modal-close" onClick={() => setShowAddBranchModal(false)} aria-label="Kapat">
                <IconClose size={16} strokeWidth={2} />
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Şube Adı</label>
                <input
                  className="form-input"
                  placeholder="Örn: Merkez 3 - Kadıköy"
                  value={branchForm.name}
                  onChange={(e) => setBranchForm({ ...branchForm, name: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Telefon</label>
                <input
                  className="form-input"
                  placeholder="Örn: 0216 555 00 00"
                  value={branchForm.phone}
                  onChange={(e) => setBranchForm({ ...branchForm, phone: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Adres</label>
                <textarea
                  className="form-textarea"
                  placeholder="Şube açık adresi..."
                  rows={3}
                  value={branchForm.address}
                  onChange={(e) => setBranchForm({ ...branchForm, address: e.target.value })}
                  style={{ width: '100%', resize: 'none' }}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowAddBranchModal(false)}>İptal</button>
              <button className="btn btn-primary" onClick={handleSaveBranch}>Şubeyi Kaydet</button>
            </div>
          </div>
        </div>
      )}
     </div>
  );
}
