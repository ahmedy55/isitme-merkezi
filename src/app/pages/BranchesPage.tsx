'use client';

import React from 'react';

export default function BranchesPage() {
  const branches = [
    { name: 'Merkez 1 - Kadıköy', address: 'Caferağa Mah. Moda Cad. No:42, Kadıköy', staff: 3, patients: 142, status: 'Aktif' },
    { name: 'Merkez 2 - Beşiktaş', address: 'Sinanpaşa Mah. Çelebioğlu Sok. No:15, Beşiktaş', staff: 2, patients: 86, status: 'Aktif' },
  ];

  const roles = [
    { name: 'Admin', desc: 'Tüm yetkilere sahip, sistem ayarlarını yönetir', users: 1, color: 'var(--danger-500)' },
    { name: 'Yönetici', desc: 'Raporları görür, personel yönetir, fiyat değiştirir', users: 1, color: 'var(--accent-500)' },
    { name: 'Odyolog', desc: 'Hasta kaydı, randevu, test, satış yapabilir', users: 2, color: 'var(--primary-500)' },
    { name: 'Sekreter', desc: 'Randevu ve hasta kaydı alabilir', users: 1, color: 'var(--info-500)' },
    { name: 'Muhasebe', desc: 'Kasa, fatura ve SGK işlemlerini görür', users: 1, color: 'var(--warning-500)' },
  ];

  const users = [
    { name: 'Dr. Elif Arslan', role: 'Odyolog', branch: 'Merkez 1 - Kadıköy', email: 'elif@audiopro.com', active: true },
    { name: 'Dr. Can Yılmaz', role: 'Odyolog', branch: 'Merkez 2 - Beşiktaş', email: 'can@audiopro.com', active: true },
    { name: 'Ahmet Yılmaz', role: 'Admin', branch: 'Tüm Şubeler', email: 'ahmet@audiopro.com', active: true },
    { name: 'Zeynep Demir', role: 'Sekreter', branch: 'Merkez 1 - Kadıköy', email: 'zeynep@audiopro.com', active: true },
    { name: 'Emre Koç', role: 'Muhasebe', branch: 'Tüm Şubeler', email: 'emre@audiopro.com', active: true },
  ];

  return (
    <div className="page">
      <div className="page-header">
        <div className="page-header-left">
          <h2>Şubeler & Yetki Yönetimi</h2>
          <p>Tüm şubelerinizi tek panelden yönetin</p>
        </div>
        <div className="page-header-actions">
          <button className="btn btn-secondary">➕ Yeni Şube</button>
          <button className="btn btn-primary">👤 Kullanıcı Ekle</button>
        </div>
      </div>

      {/* Branches */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
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
          <span className="card-title">🔐 Roller</span>
          <button className="btn btn-sm btn-ghost">➕ Yeni Rol</button>
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
          <span className="card-title">👥 Kullanıcılar</span>
        </div>
        <div className="table-container">
          <table>
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
                  <td className="td-primary">{user.name}</td>
                  <td><span className="badge badge-info">{user.role}</span></td>
                  <td>{user.branch}</td>
                  <td style={{ fontSize: '0.82rem', color: 'var(--gray-500)' }}>{user.email}</td>
                  <td>
                    <span className="badge badge-success">
                      <span className="badge-dot success" />
                      Aktif
                    </span>
                  </td>
                  <td><button className="btn btn-sm btn-ghost">✏️ Düzenle</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
