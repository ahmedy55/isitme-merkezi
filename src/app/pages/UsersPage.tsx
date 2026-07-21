'use client';

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { SystemUser, UserRole } from '../data/mockData';
import { IconSearch, IconPlus, IconEdit, IconDelete, IconUsers, IconFilter, IconCheck, IconWarning } from '../components/Icons';

export default function UsersPage() {
  const { usersList, addUser, updateUser, deleteUser, addToast } = useApp();

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('All');
  const [branchFilter, setBranchFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<string>('All');

  // Modal states
  const [showModal, setShowModal] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);

  // Form State
  const [formFirstName, setFormFirstName] = useState('');
  const [formLastName, setFormLastName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formRoles, setFormRoles] = useState<UserRole[]>([]);
  const [formBranch, setFormBranch] = useState<'Merkez 1 - Kadıköy' | 'Merkez 2 - Beşiktaş' | 'Tüm Şubeler'>('Merkez 1 - Kadıköy');
  const [formStatus, setFormStatus] = useState<'Aktif' | 'Pasif'>('Aktif');

  // Form validation errors
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const handleOpenAddModal = () => {
    setIsEditing(false);
    setEditingUserId(null);
    setFormFirstName('');
    setFormLastName('');
    setFormEmail('');
    setFormPhone('');
    setFormRoles([]);
    setFormBranch('Merkez 1 - Kadıköy');
    setFormStatus('Aktif');
    setErrors({});
    setShowModal(true);
  };

  const handleOpenEditModal = (user: SystemUser) => {
    setIsEditing(true);
    setEditingUserId(user.id);
    setFormFirstName(user.firstName);
    setFormLastName(user.lastName);
    setFormEmail(user.email);
    setFormPhone(user.phone);
    setFormRoles(user.roles);
    setFormBranch(user.branch);
    setFormStatus(user.status);
    setErrors({});
    setShowModal(true);
  };

  const handleToggleRole = (role: UserRole) => {
    if (formRoles.includes(role)) {
      setFormRoles(prev => prev.filter(r => r !== role));
    } else {
      setFormRoles(prev => [...prev, role]);
    }
  };

  const validateForm = () => {
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

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    if (isEditing && editingUserId) {
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
        id: 'usr-' + Math.floor(Math.random() * 1000000),
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
    setShowModal(false);
  };

  const handleDelete = (id: string) => {
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

  // Filter logic
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
          <h2>Kullanıcı Yönetimi</h2>
          <p>Personel rolleri, şube yetkileri ve sistem erişimleri</p>
        </div>
        <button className="btn btn-primary" onClick={handleOpenAddModal} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <IconPlus size={16} strokeWidth={2} /> Yeni Kullanıcı Ekle
        </button>
      </div>

      {/* Stats row */}
      <div className="stats-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 20 }}>
        <div className="card stat-card">
          <div className="card-body" style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px 20px' }}>
            <div style={{ padding: 10, borderRadius: 'var(--radius-md)', background: 'var(--primary-50)', color: 'var(--primary-600)' }}>
              <IconUsers size={24} />
            </div>
            <div>
              <div style={{ fontSize: '0.84rem', color: 'var(--gray-500)', fontWeight: 500 }}>Toplam Personel</div>
              <div style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--gray-800)', lineHeight: 1.2 }}>{usersList.length}</div>
            </div>
          </div>
        </div>
        <div className="card stat-card">
          <div className="card-body" style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px 20px' }}>
            <div style={{ padding: 10, borderRadius: 'var(--radius-md)', background: 'var(--success-50)', color: 'var(--success-600)' }}>
              <IconCheck size={24} />
            </div>
            <div>
              <div style={{ fontSize: '0.84rem', color: 'var(--gray-500)', fontWeight: 500 }}>Aktif Kullanıcılar</div>
              <div style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--success-600)', lineHeight: 1.2 }}>
                {usersList.filter(u => u.status === 'Aktif').length}
              </div>
            </div>
          </div>
        </div>
        <div className="card stat-card">
          <div className="card-body" style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px 20px' }}>
            <div style={{ padding: 10, borderRadius: 'var(--radius-md)', background: 'var(--warning-50)', color: 'var(--warning-600)' }}>
              <IconWarning size={24} />
            </div>
            <div>
              <div style={{ fontSize: '0.84rem', color: 'var(--gray-500)', fontWeight: 500 }}>Pasif Kullanıcılar</div>
              <div style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--warning-600)', lineHeight: 1.2 }}>
                {usersList.filter(u => u.status === 'Pasif').length}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters Card */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-body" style={{ padding: 16 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
            {/* Search */}
            <div style={{ flex: 1, minWidth: 240, position: 'relative' }}>
              <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-400)' }}>
                <IconSearch size={18} />
              </span>
              <input
                className="form-input"
                placeholder="İsim, e-posta veya telefon ile ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ paddingLeft: 38, width: '100%', margin: 0 }}
              />
            </div>

            {/* Role Filter */}
            <div style={{ minWidth: 150 }}>
              <select className="form-input" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} style={{ margin: 0 }}>
                <option value="All">Tüm Roller</option>
                <option value="Firma Yöneticisi">Firma Yöneticisi</option>
                <option value="Odyometrist">Odyometrist</option>
                <option value="Sekreter">Sekreter</option>
                <option value="Muhasebe">Muhasebe</option>
              </select>
            </div>

            {/* Branch Filter */}
            <div style={{ minWidth: 160 }}>
              <select className="form-input" value={branchFilter} onChange={(e) => setBranchFilter(e.target.value)} style={{ margin: 0 }}>
                <option value="All">Tüm Şubeler</option>
                <option value="Merkez 1 - Kadıköy">Merkez 1 - Kadıköy</option>
                <option value="Merkez 2 - Beşiktaş">Merkez 2 - Beşiktaş</option>
                <option value="Tüm Şubeler">Tüm Şubeler (Genel)</option>
              </select>
            </div>

            {/* Status Filter */}
            <div style={{ minWidth: 120 }}>
              <select className="form-input" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ margin: 0 }}>
                <option value="All">Tüm Durumlar</option>
                <option value="Aktif">Aktif</option>
                <option value="Pasif">Pasif</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Users List Table */}
      <div className="card">
        <div className="card-body" style={{ padding: 0, overflowX: 'auto' }}>
          <table className="table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: 'var(--gray-50)', borderBottom: '1px solid var(--surface-border)' }}>
                <th style={{ padding: '12px 16px', fontWeight: 600, fontSize: '0.84rem', color: 'var(--gray-600)' }}>Kullanıcı</th>
                <th style={{ padding: '12px 16px', fontWeight: 600, fontSize: '0.84rem', color: 'var(--gray-600)' }}>İletişim</th>
                <th style={{ padding: '12px 16px', fontWeight: 600, fontSize: '0.84rem', color: 'var(--gray-600)' }}>Şube / Atama</th>
                <th style={{ padding: '12px 16px', fontWeight: 600, fontSize: '0.84rem', color: 'var(--gray-600)' }}>Rol(ler)</th>
                <th style={{ padding: '12px 16px', fontWeight: 600, fontSize: '0.84rem', color: 'var(--gray-600)' }}>Durum</th>
                <th style={{ padding: '12px 16px', fontWeight: 600, fontSize: '0.84rem', color: 'var(--gray-600)' }}>Son Giriş</th>
                <th style={{ padding: '12px 16px', fontWeight: 600, fontSize: '0.84rem', color: 'var(--gray-600)', textAlign: 'right' }}>İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: 40, textAlign: 'center', color: 'var(--gray-400)' }}>
                    Kriterlere uygun personel bulunamadı.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} style={{ borderBottom: '1px solid var(--surface-border-light)' }}>
                    <td style={{ padding: '14px 16px' }}>
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
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ fontSize: '0.86rem', color: 'var(--gray-700)' }}>{user.email}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--gray-400)' }}>{user.phone}</div>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span className="badge" style={{
                        background: 'var(--gray-100)',
                        color: 'var(--gray-700)',
                        padding: '4px 8px',
                        borderRadius: 4,
                        fontSize: '0.8rem',
                        fontWeight: 500
                      }}>
                        {user.branch}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
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
                    <td style={{ padding: '14px 16px' }}>
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
                    <td style={{ padding: '14px 16px', fontSize: '0.82rem', color: 'var(--gray-500)' }}>
                      {user.lastLogin ? new Date(user.lastLogin).toLocaleString('tr-TR', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit'
                      }) : 'Hiç Giriş Yapmadı'}
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6 }}>
                        <button
                          className="btn-icon"
                          onClick={() => handleOpenEditModal(user)}
                          style={{ color: 'var(--primary-500)', padding: 6, borderRadius: 4 }}
                          title="Kullanıcıyı Düzenle"
                        >
                          <IconEdit size={16} />
                        </button>
                        <button
                          className="btn-icon"
                          onClick={() => handleDelete(user.id)}
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

      {/* Add / Edit Modal */}
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
                {isEditing ? 'Kullanıcı Bilgilerini Düzenle' : 'Yeni Kullanıcı Oluştur'}
              </span>
              <button onClick={() => setShowModal(false)} style={{ color: 'var(--gray-400)', fontSize: '1.4rem' }}>&times;</button>
            </div>
            <form onSubmit={handleSave}>
              <div className="card-body" style={{ padding: 20 }}>
                <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
                  <div className="form-group" style={{ flex: 1, margin: 0 }}>
                    <label className="form-label">Ad</label>
                    <input
                      className="form-input"
                      value={formFirstName}
                      onChange={(e) => setFormFirstName(e.target.value)}
                    />
                    {errors.firstName && <span style={{ fontSize: '0.78rem', color: 'var(--danger-500)' }}>{errors.firstName}</span>}
                  </div>
                  <div className="form-group" style={{ flex: 1, margin: 0 }}>
                    <label className="form-label">Soyad</label>
                    <input
                      className="form-input"
                      value={formLastName}
                      onChange={(e) => setFormLastName(e.target.value)}
                    />
                    {errors.lastName && <span style={{ fontSize: '0.78rem', color: 'var(--danger-500)' }}>{errors.lastName}</span>}
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: 12 }}>
                  <label className="form-label">E-posta</label>
                  <input
                    type="email"
                    className="form-input"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                  />
                  {errors.email && <span style={{ fontSize: '0.78rem', color: 'var(--danger-500)' }}>{errors.email}</span>}
                </div>

                <div className="form-group" style={{ marginBottom: 12 }}>
                  <label className="form-label">Telefon Numarası</label>
                  <input
                    className="form-input"
                    placeholder="05xx xxx xx xx"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                  />
                  {errors.phone && <span style={{ fontSize: '0.78rem', color: 'var(--danger-500)' }}>{errors.phone}</span>}
                </div>

                <div className="form-group" style={{ marginBottom: 12 }}>
                  <label className="form-label">Şube / Bölge Ataması</label>
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

                {/* Roles checkboxes */}
                <div className="form-group" style={{ marginBottom: 16 }}>
                  <label className="form-label">Sistem Rolleri (Çoklu Seçilebilir)</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 6 }}>
                    {(['Firma Yöneticisi', 'Odyometrist', 'Sekreter', 'Muhasebe'] as UserRole[]).map((role) => (
                      <label
                        key={role}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                          padding: '10px 12px',
                          border: '1px solid var(--surface-border)',
                          borderRadius: 'var(--radius-md)',
                          background: formRoles.includes(role) ? 'var(--primary-50)' : 'var(--surface-white)',
                          cursor: 'pointer',
                          borderColor: formRoles.includes(role) ? 'var(--primary-300)' : 'var(--surface-border)',
                          transition: 'all 120ms'
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={formRoles.includes(role)}
                          onChange={() => handleToggleRole(role)}
                          style={{ accentColor: 'var(--primary-600)' }}
                        />
                        <span style={{ fontSize: '0.86rem', fontWeight: formRoles.includes(role) ? 600 : 500, color: 'var(--gray-800)' }}>
                          {role}
                        </span>
                      </label>
                    ))}
                  </div>
                  {errors.roles && <span style={{ fontSize: '0.78rem', color: 'var(--danger-500)', display: 'block', marginTop: 4 }}>{errors.roles}</span>}
                </div>

                <div className="form-group" style={{ marginBottom: 12 }}>
                  <label className="form-label">Kullanıcı Durumu</label>
                  <div style={{ display: 'flex', gap: 16, marginTop: 4 }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                      <input
                        type="radio"
                        name="status"
                        checked={formStatus === 'Aktif'}
                        onChange={() => setFormStatus('Aktif')}
                        style={{ accentColor: 'var(--primary-600)' }}
                      />
                      <span>Aktif</span>
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                      <input
                        type="radio"
                        name="status"
                        checked={formStatus === 'Pasif'}
                        onChange={() => setFormStatus('Pasif')}
                        style={{ accentColor: 'var(--primary-600)' }}
                      />
                      <span>Pasif</span>
                    </label>
                  </div>
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
