'use client';

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { IconPlus, IconClose, IconSearch, IconEdit, IconDelete, IconFilter } from '../components/Icons';
import { Branch, SystemUser, UserRole } from '../data/mockData';

export default function BranchesPage() {
  const { 
    stockList, 
    updateStockItem, 
    addToast, 
    branchesList, 
    addBranch, 
    usersList, 
    addUser, 
    updateUser, 
    deleteUser 
  } = useApp();

  // Branch states
  const [showAddBranchModal, setShowAddBranchModal] = useState(false);
  const [transferCompleted, setTransferCompleted] = useState(false);
  const [branchForm, setBranchForm] = useState({ name: '', address: '', phone: '' });

  // Users Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('All');
  const [branchFilter, setBranchFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<string>('All');

  // Users Modal States
  const [showUserModal, setShowUserModal] = useState<boolean>(false);
  const [isEditingUser, setIsEditingUser] = useState<boolean>(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);

  // Users Form State
  const [formFirstName, setFormFirstName] = useState('');
  const [formLastName, setFormLastName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formRoles, setFormRoles] = useState<UserRole[]>([]);
  const [formBranch, setFormBranch] = useState<'Merkez 1 - Kadıköy' | 'Merkez 2 - Beşiktaş' | 'Tüm Şubeler'>('Merkez 1 - Kadıköy');
  const [formStatus, setFormStatus] = useState<'Aktif' | 'Pasif'>('Aktif');

  // Form validation errors
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const handleOpenAddUserModal = () => {
    setIsEditingUser(false);
    setEditingUserId(null);
    setFormFirstName('');
    setFormLastName('');
    setFormEmail('');
    setFormPhone('');
    setFormRoles([]);
    setFormBranch('Merkez 1 - Kadıköy');
    setFormStatus('Aktif');
    setErrors({});
    setShowUserModal(true);
  };

  const handleOpenEditUserModal = (user: SystemUser) => {
    setIsEditingUser(true);
    setEditingUserId(user.id);
    setFormFirstName(user.firstName);
    setFormLastName(user.lastName);
    setFormEmail(user.email);
    setFormPhone(user.phone);
    setFormRoles(user.roles);
    setFormBranch(user.branch);
    setFormStatus(user.status);
    setErrors({});
    setShowUserModal(true);
  };

  const handleToggleRole = (role: UserRole) => {
    if (formRoles.includes(role)) {
      setFormRoles(prev => prev.filter(r => r !== role));
    } else {
      setFormRoles(prev => [...prev, role]);
    }
  };

  const validateUserForm = () => {
    const newErrors: { [key: string]: string } = {};
    if (!formFirstName.trim()) newErrors.firstName = 'Ad zorunludur';
    if (!formLastName.trim()) newErrors.lastName = 'Soyad zorunludur';
    if (!formEmail.trim()) {
      newErrors.email = 'E-posta zorunludur';
    } else if (!/\S+@\S+\.\S+/.test(formEmail)) {
      newErrors.email = 'Geçersiz e-posta formatı';
    }
    if (!formPhone.trim()) newErrors.phone = 'Telefon zorunludur';
    if (formRoles.length === 0) newErrors.roles = 'En az bir rol seçilmelidir';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateUserForm()) return;

    if (isEditingUser && editingUserId) {
      const updated: SystemUser = {
        id: editingUserId,
        firstName: formFirstName,
        lastName: formLastName,
        email: formEmail,
        phone: formPhone,
        roles: formRoles,
        branch: formBranch,
        status: formStatus,
        createdAt: usersList.find(u => u.id === editingUserId)?.createdAt || new Date().toISOString().split('T')[0]
      };
      updateUser(updated);
      addToast({ type: 'success', message: 'Kullanıcı başarıyla güncellendi.' });
    } else {
      const newUser: SystemUser = {
        id: 'usr-' + Date.now(),
        firstName: formFirstName,
        lastName: formLastName,
        email: formEmail,
        phone: formPhone,
        roles: formRoles,
        branch: formBranch,
        status: formStatus,
        createdAt: new Date().toISOString().split('T')[0],
        avatar: (formFirstName[0] + formLastName[0]).toUpperCase()
      };
      addUser(newUser);
      addToast({ type: 'success', message: 'Kullanıcı başarıyla oluşturuldu.' });
    }
    setShowUserModal(false);
  };

  const handleDeleteUser = (id: string) => {
    if (confirm('Bu kullanıcıyı silmek istediğinize emin misiniz?')) {
      deleteUser(id);
      addToast({ type: 'warning', message: 'Kullanıcı silindi.' });
    }
  };

  const handleStatusToggle = (user: SystemUser) => {
    const updated: SystemUser = {
      ...user,
      status: user.status === 'Aktif' ? 'Pasif' : 'Aktif'
    };
    updateUser(updated);
    addToast({
      type: 'info',
      message: `Kullanıcı durumu '${updated.status}' olarak güncellendi.`
    });
  };

  // Branch operations
  const handleConfirmTransfer = () => {
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

  // Dynamic role stats
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

  // Filtering users
  const filteredUsers = usersList.filter(user => {
    const matchesSearch = 
      `${user.firstName} ${user.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.phone.includes(searchTerm);

    const matchesRole = roleFilter === 'All' || user.roles.includes(roleFilter as UserRole);
    const matchesBranch = branchFilter === 'All' || user.branch === branchFilter;
    const matchesStatus = statusFilter === 'All' || user.status === statusFilter;

    return matchesSearch && matchesRole && matchesBranch && matchesStatus;
  });

  return (
    <div className="page">
      <div className="page-header">
        <div className="page-header-left">
          <h2>Şubeler & Yetki Yönetimi</h2>
          <p>Tüm şubelerinizin yönetimi, rol dağılımları ve yetkili personellerin kontrolleri</p>
        </div>
        <div className="page-header-actions">
          <button className="btn btn-secondary" onClick={() => setShowAddBranchModal(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <IconPlus size={15} strokeWidth={1.8} /> Yeni Şube
          </button>
          <button className="btn btn-primary" onClick={handleOpenAddUserModal}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <IconPlus size={15} strokeWidth={2} /> Yeni Personel Ekle
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

      {/* Branches Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, marginBottom: 24 }}>
        {branchesList.map((branch) => {
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

      {/* Roles Grid */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-header">
          <span className="card-title">Sistem Rolleri & Yetki Dağılımı</span>
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

      {/* Personnel/Users Table card with full filters */}
      <div className="card">
        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <span className="card-title">Sistem Personelleri</span>
          <button className="btn btn-sm btn-primary" onClick={handleOpenAddUserModal}>Yeni Personel Ekle</button>
        </div>
        
        {/* Filters Panel */}
        <div style={{ padding: '16px 20px', background: 'var(--gray-25)', borderBottom: '1px solid var(--surface-border-light)' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
            <div style={{ flex: 1, minWidth: 200, position: 'relative' }}>
              <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-400)' }}>
                <IconSearch size={16} />
              </span>
              <input
                className="form-input"
                placeholder="İsim, e-posta veya telefon ile ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ paddingLeft: 36, width: '100%', margin: 0 }}
              />
            </div>
            
            <div style={{ minWidth: 140 }}>
              <select className="form-input" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} style={{ margin: 0 }}>
                <option value="All">Tüm Roller</option>
                <option value="Firma Yöneticisi">Firma Yöneticisi</option>
                <option value="Odyometrist">Odyometrist</option>
                <option value="Sekreter">Sekreter</option>
                <option value="Muhasebe">Muhasebe</option>
              </select>
            </div>

            <div style={{ minWidth: 140 }}>
              <select className="form-input" value={branchFilter} onChange={(e) => setBranchFilter(e.target.value)} style={{ margin: 0 }}>
                <option value="All">Tüm Şubeler</option>
                <option value="Tüm Şubeler">Tüm Şubeler (Genel)</option>
                <option value="Merkez 1 - Kadıköy">Merkez 1 - Kadıköy</option>
                <option value="Merkez 2 - Beşiktaş">Merkez 2 - Beşiktaş</option>
              </select>
            </div>

            <div style={{ minWidth: 120 }}>
              <select className="form-input" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ margin: 0 }}>
                <option value="All">Tüm Durumlar</option>
                <option value="Aktif">Aktif</option>
                <option value="Pasif">Pasif</option>
              </select>
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="table-container">
          <table className="mobile-cards">
            <thead>
              <tr>
                <th>Kullanıcı</th>
                <th>E-posta & Telefon</th>
                <th>Roller</th>
                <th>Şube</th>
                <th>Durum</th>
                <th style={{ textAlign: 'right' }}>İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: 30, color: 'var(--gray-400)' }}>
                    Kriterlere uygun personel kaydı bulunamadı.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id}>
                    <td data-label="Kullanıcı" className="td-primary">
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{
                          width: 36,
                          height: 36,
                          borderRadius: '50%',
                          background: 'var(--primary-100)',
                          color: 'var(--primary-700)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 700,
                          fontSize: '0.9rem'
                        }}>
                          {user.avatar || (user.firstName[0] + user.lastName[0]).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, color: 'var(--gray-800)' }}>{user.firstName} {user.lastName}</div>
                          <div style={{ fontSize: '0.78rem', color: 'var(--gray-400)' }}>ID: {user.id}</div>
                        </div>
                      </div>
                    </td>
                    <td data-label="E-posta & Telefon">
                      <div style={{ fontSize: '0.86rem', color: 'var(--gray-700)' }}>{user.email}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--gray-400)' }}>{user.phone}</div>
                    </td>
                    <td data-label="Roller">
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                        {user.roles.map((role) => (
                          <span key={role} className="badge" style={{
                            background: role === 'Firma Yöneticisi' ? 'var(--accent-100)' : 'var(--primary-50)',
                            color: role === 'Firma Yöneticisi' ? 'var(--accent-700)' : 'var(--primary-700)',
                            padding: '2px 6px',
                            borderRadius: 4,
                            fontSize: '0.76rem',
                            fontWeight: 600
                          }}>
                            {role}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td data-label="Şube">{user.branch}</td>
                    <td data-label="Durum">
                      <button
                        onClick={() => handleStatusToggle(user)}
                        title="Durumu değiştir"
                        style={{
                          background: user.status === 'Aktif' ? 'var(--success-50)' : 'var(--danger-50)',
                          color: user.status === 'Aktif' ? 'var(--success-600)' : 'var(--danger-600)',
                          padding: '4px 8px',
                          borderRadius: 4,
                          fontSize: '0.8rem',
                          fontWeight: 600,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4
                        }}
                      >
                        <span style={{
                          width: 6,
                          height: 6,
                          borderRadius: '50%',
                          background: user.status === 'Aktif' ? 'var(--success-600)' : 'var(--danger-600)'
                        }}></span>
                        {user.status}
                      </button>
                    </td>
                    <td data-label="İşlemler" style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6 }}>
                        <button
                          className="btn-icon"
                          onClick={() => handleOpenEditUserModal(user)}
                          style={{ color: 'var(--primary-500)', padding: 6, borderRadius: 4 }}
                          title="Kullanıcıyı Düzenle"
                        >
                          <IconEdit size={16} />
                        </button>
                        <button
                          className="btn-icon"
                          onClick={() => handleDeleteUser(user.id)}
                          style={{ color: 'var(--danger-500)', padding: 6, borderRadius: 4 }}
                          title="Kullanıcıyı Sil"
                          disabled={user.roles.includes('Firma Yöneticisi') && usersList.filter(u => u.roles.includes('Firma Yöneticisi')).length <= 1}
                        >
                          <IconDelete size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Branch Modal */}
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

      {/* Add / Edit User Modal */}
      {showUserModal && (
        <div className="modal-overlay" onClick={() => setShowUserModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 520 }}>
            <div className="modal-header">
              <span className="modal-title">
                {isEditingUser ? 'Personel Bilgilerini Düzenle' : 'Yeni Personel Yetkilendir'}
              </span>
              <button className="modal-close" onClick={() => setShowUserModal(false)} aria-label="Kapat">
                <IconClose size={16} strokeWidth={2} />
              </button>
            </div>
            <form onSubmit={handleSaveUser}>
              <div className="modal-body">
                <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
                  <div className="form-group" style={{ flex: 1, margin: 0 }}>
                    <label className="form-label">Ad</label>
                    <input
                      className={`form-input ${errors.firstName ? 'input-error' : ''}`}
                      placeholder="Adı"
                      value={formFirstName}
                      onChange={(e) => setFormFirstName(e.target.value)}
                    />
                    {errors.firstName && <span style={{ color: 'var(--danger-600)', fontSize: '0.74rem' }}>{errors.firstName}</span>}
                  </div>
                  <div className="form-group" style={{ flex: 1, margin: 0 }}>
                    <label className="form-label">Soyad</label>
                    <input
                      className={`form-input ${errors.lastName ? 'input-error' : ''}`}
                      placeholder="Soyadı"
                      value={formLastName}
                      onChange={(e) => setFormLastName(e.target.value)}
                    />
                    {errors.lastName && <span style={{ color: 'var(--danger-600)', fontSize: '0.74rem' }}>{errors.lastName}</span>}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
                  <div className="form-group" style={{ flex: 1, margin: 0 }}>
                    <label className="form-label">E-posta</label>
                    <input
                      className={`form-input ${errors.email ? 'input-error' : ''}`}
                      placeholder="ad.soyad@isitmecenter.com"
                      value={formEmail}
                      onChange={(e) => setFormEmail(e.target.value)}
                    />
                    {errors.email && <span style={{ color: 'var(--danger-600)', fontSize: '0.74rem' }}>{errors.email}</span>}
                  </div>
                  <div className="form-group" style={{ flex: 1, margin: 0 }}>
                    <label className="form-label">Telefon</label>
                    <input
                      className={`form-input ${errors.phone ? 'input-error' : ''}`}
                      placeholder="0555 123 45 67"
                      value={formPhone}
                      onChange={(e) => setFormPhone(e.target.value)}
                    />
                    {errors.phone && <span style={{ color: 'var(--danger-600)', fontSize: '0.74rem' }}>{errors.phone}</span>}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
                  <div className="form-group" style={{ flex: 1, margin: 0 }}>
                    <label className="form-label">Atandığı Şube</label>
                    <select
                      className="form-input"
                      value={formBranch}
                      onChange={(e) => setFormBranch(e.target.value as any)}
                    >
                      <option value="Merkez 1 - Kadıköy">Merkez 1 - Kadıköy</option>
                      <option value="Merkez 2 - Beşiktaş">Merkez 2 - Beşiktaş</option>
                      <option value="Tüm Şubeler">Tüm Şubeler (Genel)</option>
                    </select>
                  </div>
                  <div className="form-group" style={{ flex: 1, margin: 0 }}>
                    <label className="form-label">Durum</label>
                    <select
                      className="form-input"
                      value={formStatus}
                      onChange={(e) => setFormStatus(e.target.value as any)}
                    >
                      <option value="Aktif">Aktif</option>
                      <option value="Pasif">Pasif</option>
                    </select>
                  </div>
                </div>

                {/* Role selection using custom multiple checkbox layout */}
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Erişim Rolleri (Birden fazla seçilebilir)</label>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: 8,
                    padding: 12,
                    border: '1px solid var(--surface-border-light)',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--gray-25)'
                  }}>
                    {(['Firma Yöneticisi', 'Odyometrist', 'Sekreter', 'Muhasebe'] as UserRole[]).map((role) => {
                      const isChecked = formRoles.includes(role);
                      return (
                        <label key={role} style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                          cursor: 'pointer',
                          fontSize: '0.84rem',
                          color: 'var(--gray-700)'
                        }}>
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleToggleRole(role)}
                            style={{ cursor: 'pointer' }}
                          />
                          <span>{role}</span>
                        </label>
                      );
                    })}
                  </div>
                  {errors.roles && <span style={{ color: 'var(--danger-600)', fontSize: '0.74rem', display: 'block', marginTop: 4 }}>{errors.roles}</span>}
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowUserModal(false)}>İptal</button>
                <button type="submit" className="btn btn-primary">Kaydet</button>
              </div>
            </form>
          </div>
        </div>
      )}
     </div>
  );
}
