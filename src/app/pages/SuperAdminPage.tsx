import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useApp } from '../context/AppContext';

export default function SuperAdminPage() {
  const { addToast, isPlatformAdmin } = useApp();
  const [orgs, setOrgs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState<any | null>(null);
  
  // Create Form State
  const [newName, setNewName] = useState('');
  const [newPlan, setNewPlan] = useState('pro');
  const [newMaxUsers, setNewMaxUsers] = useState(5);
  const [newMaxBranches, setNewMaxBranches] = useState(2);
  const [createLoading, setCreateLoading] = useState(false);

  // Edit Form State
  const [editPlan, setEditPlan] = useState('pro');
  const [editStatus, setEditStatus] = useState('active');
  const [editMaxUsers, setEditMaxUsers] = useState(5);
  const [editMaxBranches, setEditMaxBranches] = useState(2);
  const [editLoading, setEditLoading] = useState(false);

  const fetchOrganizations = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setOrgs(data || []);
    } catch (err: any) {
      console.error(err);
      addToast({ type: 'error', message: `Organizasyonlar yüklenemedi: ${err.message}` });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrganizations();
  }, []);

  const handleCreateOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    setCreateLoading(true);
    try {
      const slug = newName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

      const { data, error } = await supabase
        .from('organizations')
        .insert([{
          name: newName,
          slug,
          plan_type: newPlan,
          subscription_status: 'trial',
          max_users: newMaxUsers,
          max_branches: newMaxBranches
        }])
        .select();

      if (error) throw error;

      addToast({ type: 'success', message: `"${newName}" organizasyonu başarıyla oluşturuldu.` });
      setShowCreateModal(false);
      setNewName('');
      fetchOrganizations();
    } catch (err: any) {
      addToast({ type: 'error', message: `Organizasyon oluşturulamadı: ${err.message}` });
    } finally {
      setCreateLoading(false);
    }
  };

  const handleUpdateOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showEditModal) return;

    setEditLoading(true);
    try {
      const { error } = await supabase
        .from('organizations')
        .update({
          plan_type: editPlan,
          subscription_status: editStatus,
          max_users: editMaxUsers,
          max_branches: editMaxBranches
        })
        .eq('id', showEditModal.id);

      if (error) throw error;

      addToast({ type: 'success', message: 'Organizasyon limitleri güncellendi.' });
      setShowEditModal(null);
      fetchOrganizations();
    } catch (err: any) {
      addToast({ type: 'error', message: `Limitler güncellenemedi: ${err.message}` });
    } finally {
      setEditLoading(false);
    }
  };

  const openEditModal = (org: any) => {
    setShowEditModal(org);
    setEditPlan(org.plan_type);
    setEditStatus(org.subscription_status);
    setEditMaxUsers(org.max_users);
    setEditMaxBranches(org.max_branches);
  };

  // Filter organizations
  const filteredOrgs = orgs.filter(org => 
    org.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    org.slug.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Stats
  const activeCount = orgs.filter(o => o.subscription_status === 'active').length;
  const proCount = orgs.filter(o => o.plan_type === 'pro').length;
  const enterpriseCount = orgs.filter(o => o.plan_type === 'enterprise').length;
  if (!isPlatformAdmin) {
    return (
      <div className="page" style={{ padding: 40, textAlign: 'center' }}>
        <div style={{ fontSize: '3rem', marginBottom: 16 }}>🔒</div>
        <h2>Yetkisiz Erişim (403)</h2>
        <p style={{ color: 'var(--gray-500)', marginTop: 8 }}>
          SaaS Yönetim Paneline sadece platform yöneticileri erişebilir.
        </p>
      </div>
    );
  }

  return (
    <div className="page-container" style={{ padding: '24px', animation: 'fadeIn 0.3s ease' }}>
      
      {/* SaaS Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '24px' }}>
        <div style={{ background: 'white', padding: '20px', borderRadius: '16px', border: '1px solid var(--gray-100)', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--gray-400)', textTransform: 'uppercase' }}>Toplam Organizasyon</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--gray-800)', marginTop: '8px' }}>{orgs.length}</div>
        </div>
        <div style={{ background: 'white', padding: '20px', borderRadius: '16px', border: '1px solid var(--gray-100)', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--gray-400)', textTransform: 'uppercase' }}>Aktif Abonelik</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--success-600)', marginTop: '8px' }}>{activeCount}</div>
        </div>
        <div style={{ background: 'white', padding: '20px', borderRadius: '16px', border: '1px solid var(--gray-100)', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--gray-400)', textTransform: 'uppercase' }}>Pro Plan</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--primary-600)', marginTop: '8px' }}>{proCount}</div>
        </div>
        <div style={{ background: 'white', padding: '20px', borderRadius: '16px', border: '1px solid var(--gray-100)', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--gray-400)', textTransform: 'uppercase' }}>Enterprise Plan</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--warning-600)', marginTop: '8px' }}>{enterpriseCount}</div>
        </div>
      </div>

      {/* Control Bar */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', width: '320px' }}>
          <input
            type="text"
            placeholder="Firma veya slug ara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 16px',
              borderRadius: '10px',
              border: '1px solid var(--gray-200)',
              fontSize: '0.88rem',
              outline: 'none',
              transition: 'all 0.2s'
            }}
          />
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          style={{
            background: 'linear-gradient(135deg, var(--primary-500), var(--primary-600))',
            color: 'white',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '10px',
            fontWeight: 600,
            fontSize: '0.88rem',
            cursor: 'pointer',
            boxShadow: 'var(--shadow-sm)',
            transition: 'transform 0.15s ease'
          }}
          onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.97)'}
          onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          Yeni Organizasyon Ekle
        </button>
      </div>

      {/* Table Card */}
      <div style={{ background: 'white', borderRadius: '16px', border: '1px solid var(--gray-100)', boxShadow: 'var(--shadow-sm)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
          <thead>
            <tr style={{ background: 'var(--gray-50)', borderBottom: '1px solid var(--gray-100)', color: 'var(--gray-500)', fontWeight: 600 }}>
              <th style={{ padding: '16px' }}>Klinik Adı / Slug</th>
              <th style={{ padding: '16px' }}>Plan</th>
              <th style={{ padding: '16px' }}>Durum</th>
              <th style={{ padding: '16px' }}>Kullanıcı Limiti</th>
              <th style={{ padding: '16px' }}>Şube Limiti</th>
              <th style={{ padding: '16px' }}>Kayıt Tarihi</th>
              <th style={{ padding: '16px', textAlign: 'right' }}>Aksiyonlar</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: 'var(--gray-400)' }}>
                  Yükleniyor...
                </td>
              </tr>
            ) : filteredOrgs.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: 'var(--gray-400)' }}>
                  Organizasyon bulunamadı.
                </td>
              </tr>
            ) : (
              filteredOrgs.map((org) => (
                <tr key={org.id} style={{ borderBottom: '1px solid var(--gray-100)', transition: 'background 0.2s' }} className="table-row">
                  <td style={{ padding: '16px' }}>
                    <div style={{ fontWeight: 600, color: 'var(--gray-800)' }}>{org.name}</div>
                    <div style={{ fontSize: '0.74rem', color: 'var(--gray-400)' }}>{org.slug}</div>
                  </td>
                  <td style={{ padding: '16px' }}>
                    <span style={{
                      padding: '4px 8px',
                      borderRadius: '6px',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      background: org.plan_type === 'enterprise' ? 'var(--warning-50)' : org.plan_type === 'pro' ? 'var(--primary-50)' : 'var(--gray-100)',
                      color: org.plan_type === 'enterprise' ? 'var(--warning-700)' : org.plan_type === 'pro' ? 'var(--primary-700)' : 'var(--gray-700)'
                    }}>
                      {org.plan_type}
                    </span>
                  </td>
                  <td style={{ padding: '16px' }}>
                    <span style={{
                      padding: '4px 8px',
                      borderRadius: '6px',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      background: org.subscription_status === 'active' ? 'var(--success-50)' : 'var(--error-50)',
                      color: org.subscription_status === 'active' ? 'var(--success-700)' : 'var(--error-700)'
                    }}>
                      {org.subscription_status}
                    </span>
                  </td>
                  <td style={{ padding: '16px', fontWeight: 500, color: 'var(--gray-700)' }}>{org.max_users} Kullanıcı</td>
                  <td style={{ padding: '16px', fontWeight: 500, color: 'var(--gray-700)' }}>{org.max_branches} Şube</td>
                  <td style={{ padding: '16px', color: 'var(--gray-400)' }}>
                    {new Date(org.created_at).toLocaleDateString('tr-TR')}
                  </td>
                  <td style={{ padding: '16px', textAlign: 'right' }}>
                    <button
                      onClick={() => openEditModal(org)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--primary-600)',
                        fontWeight: 600,
                        cursor: 'pointer',
                        padding: '4px 8px',
                        fontSize: '0.84rem'
                      }}
                    >
                      Limitleri Düzenle
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* CREATE MODAL */}
      {showCreateModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div style={{ background: 'white', padding: '28px', borderRadius: '20px', width: '450px', boxShadow: 'var(--shadow-xl)' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--gray-800)', marginBottom: '16px' }}>Yeni Organizasyon Oluştur</h3>
            <form onSubmit={handleCreateOrg} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--gray-500)', display: 'block', marginBottom: '6px' }}>KLİNİK ADI</label>
                <input
                  type="text"
                  required
                  placeholder="örn. Kadıköy İşitme Merkezi"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--gray-200)', outline: 'none' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--gray-500)', display: 'block', marginBottom: '6px' }}>PLAN TİPİ</label>
                  <select
                    value={newPlan}
                    onChange={(e) => setNewPlan(e.target.value)}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--gray-200)', outline: 'none' }}
                  >
                    <option value="free">Free</option>
                    <option value="pro">Pro</option>
                    <option value="enterprise">Enterprise</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--gray-500)', display: 'block', marginBottom: '6px' }}>ŞUBE LİMİTİ</label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={newMaxBranches}
                    onChange={(e) => setNewMaxBranches(parseInt(e.target.value))}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--gray-200)', outline: 'none' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--gray-500)', display: 'block', marginBottom: '6px' }}>MAKSİMUM KULLANICI</label>
                <input
                  type="number"
                  min={1}
                  required
                  value={newMaxUsers}
                  onChange={(e) => setNewMaxUsers(parseInt(e.target.value))}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--gray-200)', outline: 'none' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid var(--gray-200)', background: 'none', fontWeight: 600, cursor: 'pointer' }}
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  disabled={createLoading}
                  style={{
                    flex: 1, padding: '10px', borderRadius: '8px', border: 'none',
                    background: 'var(--primary-600)', color: 'white', fontWeight: 600, cursor: 'pointer'
                  }}
                >
                  {createLoading ? 'Ekleniyor...' : 'Kaydet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {showEditModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div style={{ background: 'white', padding: '28px', borderRadius: '20px', width: '450px', boxShadow: 'var(--shadow-xl)' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--gray-800)', marginBottom: '16px' }}>Limitleri Düzenle: {showEditModal.name}</h3>
            <form onSubmit={handleUpdateOrg} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--gray-500)', display: 'block', marginBottom: '6px' }}>PLAN TİPİ</label>
                  <select
                    value={editPlan}
                    onChange={(e) => setEditPlan(e.target.value)}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--gray-200)', outline: 'none' }}
                  >
                    <option value="free">Free</option>
                    <option value="pro">Pro</option>
                    <option value="enterprise">Enterprise</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--gray-500)', display: 'block', marginBottom: '6px' }}>DURUM</label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value)}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--gray-200)', outline: 'none' }}
                  >
                    <option value="active">Active</option>
                    <option value="suspended">Suspended</option>
                    <option value="trial">Trial</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--gray-500)', display: 'block', marginBottom: '6px' }}>KULLANICI LİMİTİ</label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={editMaxUsers}
                    onChange={(e) => setEditMaxUsers(parseInt(e.target.value))}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--gray-200)', outline: 'none' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--gray-500)', display: 'block', marginBottom: '6px' }}>ŞUBE LİMİTİ</label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={editMaxBranches}
                    onChange={(e) => setEditMaxBranches(parseInt(e.target.value))}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--gray-200)', outline: 'none' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowEditModal(null)}
                  style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid var(--gray-200)', background: 'none', fontWeight: 600, cursor: 'pointer' }}
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  disabled={editLoading}
                  style={{
                    flex: 1, padding: '10px', borderRadius: '8px', border: 'none',
                    background: 'var(--primary-600)', color: 'white', fontWeight: 600, cursor: 'pointer'
                  }}
                >
                  {editLoading ? 'Güncelleniyor...' : 'Güncelle'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
