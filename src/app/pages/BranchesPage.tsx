'use client';

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { IconPlus, IconClose } from '../components/Icons';

export default function BranchesPage() {
  const { stockList, updateStockItem, addToast } = useApp();
  const [showAddBranchModal, setShowAddBranchModal] = useState(false);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [transferCompleted, setTransferCompleted] = useState(false);

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

  const [branches, setBranches] = useState([
    { name: 'Merkez 1 - Kadıköy', address: 'Caferağa Mah. Moda Cad. No:42, Kadıköy', staff: 3, patients: 142, status: 'Aktif' },
    { name: 'Merkez 2 - Beşiktaş', address: 'Sinanpaşa Mah. Çelebioğlu Sok. No:15, Beşiktaş', staff: 2, patients: 86, status: 'Aktif' },
  ]);

  const [roles, setRoles] = useState([
    { name: 'Admin', desc: 'Tüm yetkilere sahip, sistem ayarlarını yönetir', users: 1, color: 'var(--danger-500)' },
    { name: 'Yönetici', desc: 'Raporları görür, personel yönetir, fiyat değiştirir', users: 1, color: 'var(--accent-500)' },
    { name: 'Odyolog', desc: 'Hasta kaydı, randevu, test, satış yapabilir', users: 2, color: 'var(--primary-500)' },
    { name: 'Sekreter', desc: 'Randevu ve hasta kaydı alabilir', users: 1, color: 'var(--info-500)' },
    { name: 'Muhasebe', desc: 'Kasa, fatura ve SGK işlemlerini görür', users: 1, color: 'var(--warning-500)' },
  ]);

  const [users, setUsers] = useState([
    { name: 'Dr. Elif Arslan', role: 'Odyolog', branch: 'Merkez 1 - Kadıköy', email: 'elif@audiopro.com', active: true },
    { name: 'Dr. Can Yılmaz', role: 'Odyolog', branch: 'Merkez 2 - Beşiktaş', email: 'can@audiopro.com', active: true },
    { name: 'Ahmet Yılmaz', role: 'Admin', branch: 'Tüm Şubeler', email: 'ahmet@audiopro.com', active: true },
    { name: 'Zeynep Demir', role: 'Sekreter', branch: 'Merkez 1 - Kadıköy', email: 'zeynep@audiopro.com', active: true },
    { name: 'Emre Koç', role: 'Muhasebe', branch: 'Tüm Şubeler', email: 'emre@audiopro.com', active: true },
  ]);

  const [showAddRoleModal, setShowAddRoleModal] = useState(false);
  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [showEditUserModal, setShowEditUserModal] = useState(false);

  const [branchForm, setBranchForm] = useState({ name: '', address: '', phone: '' });
  const [userForm, setUserForm] = useState({ name: '', role: 'Odyolog', branch: 'Merkez 1 - Kadıköy', email: '' });
  const [roleForm, setRoleForm] = useState({ name: '', desc: '', color: 'var(--primary-500)' });

  const handleUpdateUser = () => {
    if (!editingUser) return;
    setUsers(users.map(u => u.email === editingUser.email ? editingUser : u));
    setShowEditUserModal(false);
    setEditingUser(null);
    addToast({ type: 'success', message: 'Kullanıcı yetkileri başarıyla güncellendi.' });
  };

  const handleSaveBranch = () => {
    if (!branchForm.name) {
      alert('Lütfen şube adı girin.');
      return;
    }
    setBranches([...branches, { name: branchForm.name, address: branchForm.address, staff: 0, patients: 0, status: 'Aktif' }]);
    setShowAddBranchModal(false);
    setBranchForm({ name: '', address: '', phone: '' });
    addToast({ type: 'success', message: 'Yeni şube kaydı başarıyla oluşturuldu.' });
  };

  const handleSaveUser = () => {
    if (!userForm.name || !userForm.email) {
      alert('Lütfen ad soyad ve e-posta girin.');
      return;
    }
    setUsers([...users, { name: userForm.name, role: userForm.role, branch: userForm.branch, email: userForm.email, active: true }]);
    setShowAddUserModal(false);
    setUserForm({ name: '', role: 'Odyolog', branch: 'Merkez 1 - Kadıköy', email: '' });
    addToast({ type: 'success', message: 'Yeni personel kaydı oluşturuldu ve aktivasyon e-postası gönderildi.' });
  };

  const handleSaveRole = () => {
    if (!roleForm.name) {
      alert('Lütfen rol adı girin.');
      return;
    }
    setRoles([...roles, { name: roleForm.name, desc: roleForm.desc, users: 0, color: roleForm.color }]);
    setShowAddRoleModal(false);
    setRoleForm({ name: '', desc: '', color: 'var(--primary-500)' });
    addToast({ type: 'success', message: 'Yeni yetki rolü başarıyla oluşturuldu.' });
  };

  return (
    <div className="page">
      <div className="page-header">
        <div className="page-header-left">
          <h2>Şubeler & Yetki Yönetimi</h2>
          <p>Tüm şubelerinizi tek panelden yönetin</p>
        </div>
        <div className="page-header-actions">
          <button className="btn btn-secondary" onClick={() => setShowAddBranchModal(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <IconPlus size={15} strokeWidth={1.8} /> Yeni Şube
          </button>
          <button className="btn btn-primary" onClick={() => setShowAddUserModal(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <IconPlus size={15} strokeWidth={2} /> Kullanıcı Ekle
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
        {branches.map((branch, i) => (
          <div key={i} className="card">
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
                  <div style={{ fontSize: '0.7rem', color: 'var(--gray-500)' }}>Personel</div>
                  <div style={{ fontWeight: 700, fontSize: '1.2rem' }}>{branch.staff}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--gray-500)' }}>Toplam Hasta</div>
                  <div style={{ fontWeight: 700, fontSize: '1.2rem' }}>{branch.patients}</div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Roles */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-header">
          <span className="card-title">Roller</span>
          <button className="btn btn-sm btn-ghost" onClick={() => setShowAddRoleModal(true)}>Yeni Rol</button>
        </div>
        <div className="card-body">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
            {roles.map((role, i) => (
              <div key={i} style={{
                padding: '14px',
                border: '1px solid var(--gray-200)',
                borderRadius: 'var(--radius-lg)',
                borderLeft: `4px solid ${role.color}`,
              }}>
                <div style={{ fontWeight: 700, marginBottom: 4 }}>{role.name}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)', marginBottom: 8 }}>{role.desc}</div>
                <span className="badge badge-neutral">{role.users} kullanıcı</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Users */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">Kullanıcılar</span>
        </div>
        <div className="table-container">
          <table className="mobile-cards">
            <thead>
              <tr>
                <th>Kullanıcı</th>
                <th>Rol</th>
                <th>Şube</th>
                <th>E-posta</th>
                <th>Durum</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {users.map((user, i) => (
                <tr key={i}>
                  <td data-label="Kullanıcı" className="td-primary">{user.name}</td>
                  <td data-label="Rol"><span className="badge badge-info">{user.role}</span></td>
                  <td data-label="Şube">{user.branch}</td>
                  <td data-label="E-posta" style={{ fontSize: '0.82rem', color: 'var(--gray-500)' }}>{user.email}</td>
                  <td data-label="Durum">
                    <span className="badge badge-success">
                      <span className="badge-dot success" />
                      Aktif
                    </span>
                  </td>
                  <td data-label="">
                    <button className="btn btn-sm btn-ghost" 
                      onClick={() => {
                        setEditingUser(user);
                        setShowEditUserModal(true);
                      }}
                      style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      Düzenle
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
                  placeholder="Örn: Kadıköy Şubesi"
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

      {/* Kullanıcı Ekle Modal */}
      {showAddUserModal && (
        <div className="modal-overlay" onClick={() => setShowAddUserModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 520 }}>
            <div className="modal-header">
              <span className="modal-title">Sisteme Kullanıcı Ekle</span>
              <button className="modal-close" onClick={() => setShowAddUserModal(false)} aria-label="Kapat">
                <IconClose size={16} strokeWidth={2} />
              </button>
            </div>
            <div className="modal-body">
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Ad Soyad</label>
                  <input
                    className="form-input"
                    placeholder="Kullanıcı adı"
                    value={userForm.name}
                    onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Rolü</label>
                  <select
                    className="form-select"
                    value={userForm.role}
                    onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}
                  >
                    <option>Odyolog</option>
                    <option>Sekreter</option>
                    <option>Yönetici</option>
                    <option>Muhasebe</option>
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">E-posta</label>
                  <input
                    className="form-input"
                    type="email"
                    placeholder="kullanici@isitmecihazi.com"
                    value={userForm.email}
                    onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Atanacak Şube</label>
                  <select
                    className="form-select"
                    value={userForm.branch}
                    onChange={(e) => setUserForm({ ...userForm, branch: e.target.value })}
                  >
                    <option>Tüm Şubeler</option>
                    <option>Merkez 1 - Kadıköy</option>
                    <option>Merkez 2 - Beşiktaş</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowAddUserModal(false)}>İptal</button>
              <button className="btn btn-primary" onClick={handleSaveUser}>Kullanıcıyı Kaydet</button>
            </div>
          </div>
        </div>
      )}

      {/* Rol Ekle Modal */}
      {showAddRoleModal && (
        <div className="modal-overlay" onClick={() => setShowAddRoleModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 480 }}>
            <div className="modal-header">
              <span className="modal-title">Yeni Yetki Rolü Tanımla</span>
              <button className="modal-close" onClick={() => setShowAddRoleModal(false)} aria-label="Kapat">
                <IconClose size={16} strokeWidth={2} />
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Rol Adı</label>
                <input
                  className="form-input"
                  placeholder="Örn: Stajyer"
                  value={roleForm.name}
                  onChange={(e) => setRoleForm({ ...roleForm, name: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Açıklama / İzinler</label>
                <textarea
                  className="form-textarea"
                  placeholder="Bu role ait erişim yetkisi tanımları..."
                  rows={2}
                  value={roleForm.desc}
                  onChange={(e) => setRoleForm({ ...roleForm, desc: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Renk Etiketi</label>
                <select
                  className="form-select"
                  value={roleForm.color}
                  onChange={(e) => setRoleForm({ ...roleForm, color: e.target.value })}
                >
                  <option value="var(--primary-500)">Mavi (Varsayılan)</option>
                  <option value="var(--success-500)">Yeşil</option>
                  <option value="var(--warning-500)">Sarı</option>
                  <option value="var(--danger-500)">Kırmızı</option>
                  <option value="var(--accent-500)">Mor</option>
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowAddRoleModal(false)}>İptal</button>
              <button className="btn btn-primary" onClick={handleSaveRole}>Rolü Kaydet</button>
            </div>
          </div>
        </div>
      )}

      {/* Kullanıcı Düzenle Modal */}
      {showEditUserModal && editingUser && (
        <div className="modal-overlay" onClick={() => { setShowEditUserModal(false); setEditingUser(null); }}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 520 }}>
            <div className="modal-header">
              <span className="modal-title">Kullanıcı Yetki Ayarları — {editingUser.name}</span>
              <button className="modal-close" onClick={() => { setShowEditUserModal(false); setEditingUser(null); }} aria-label="Kapat">
                <IconClose size={16} strokeWidth={2} />
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Ad Soyad</label>
                <input
                  className="form-input"
                  value={editingUser.name}
                  onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Rolü</label>
                  <select
                    className="form-select"
                    value={editingUser.role}
                    onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value })}
                  >
                    <option>Odyolog</option>
                    <option>Sekreter</option>
                    <option>Yönetici</option>
                    <option>Muhasebe</option>
                    <option>Admin</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Atandığı Şube</label>
                  <select
                    className="form-select"
                    value={editingUser.branch}
                    onChange={(e) => setEditingUser({ ...editingUser, branch: e.target.value })}
                  >
                    <option>Tüm Şubeler</option>
                    <option>Merkez 1 - Kadıköy</option>
                    <option>Merkez 2 - Beşiktaş</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">E-posta</label>
                <input
                  className="form-input"
                  type="email"
                  value={editingUser.email}
                  onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => { setShowEditUserModal(false); setEditingUser(null); }}>İptal</button>
              <button className="btn btn-primary" onClick={handleUpdateUser}>Değişiklikleri Kaydet</button>
            </div>
          </div>
        </div>
      )}
     </div>
   );
 }
