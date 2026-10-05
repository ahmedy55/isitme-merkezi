'use client';

import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import type { Branch, SystemUser } from '../data/mockData';
import { canAccessPage } from '../lib/pageAuthorization';
import { useBranchScope } from '../hooks/useBranchScope';
import styles from './BranchesPage.module.css';

interface StaffUser {
  id: string;
  uuid: string;
  firstName: string;
  lastName: string;
  initials: string;
  avatarColor: string;
  email: string;
  phone: string;
  role: SystemUser['roles'][number] | 'Diğer';
  branch: string;
  status: 'Aktif' | 'Pasif';
  lastLogin: string;
  accessLevel: 'Tam Erişim' | 'Sınırlı Erişim' | 'Okuma Yetkisi';
}

interface BranchItem {
  id: string;
  name: string;
  cityDistrict: string;
  status: 'Aktif' | 'Pasif';
  patientCount: number;
  staffCount: number;
  salesCount: number;
  staffAvatars: { initials: string; color: string }[];
  image: string;
  address: string;
  phone: string;
}

// ── Reusable Pure SVG Donut Component ──
function SvgDonut({
  size = 130,
  strokeWidth = 20,
  slices,
  centerValue,
  centerLabel
}: {
  size?: number;
  strokeWidth?: number;
  slices: { value: number; color: string; label: string }[];
  centerValue: string | number;
  centerLabel: string;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const total = slices.reduce((acc, s) => acc + s.value, 0) || 1;

  let accumulated = 0;

  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>
          {slices.map((slice, index) => {
            const sliceLength = (slice.value / total) * circumference;
            const strokeDashoffset = -accumulated;
            accumulated += sliceLength;

            return (
              <circle
                key={index}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke={slice.color}
                strokeWidth={strokeWidth}
                strokeDasharray={`${sliceLength} ${circumference - sliceLength}`}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="butt"
              />
            );
          })}
        </g>
      </svg>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          pointerEvents: 'none'
        }}
      >
        <span style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a', lineHeight: 1.1 }}>
          {centerValue}
        </span>
        <span style={{ fontSize: '10px', color: '#64748b', marginTop: 2, textAlign: 'center' }}>
          {centerLabel}
        </span>
      </div>
    </div>
  );
}

export default function BranchesPage() {
  const { addToast, setCurrentPage, branchesList, usersList, patientsList, salesList, auditLogList, currentOrgId, addBranch, addUser, updateUser, deleteUser } = useApp();
  const { matches } = useBranchScope();

  // Active Sub-Tab
  const [activeTab, setActiveTab] = useState('Şube Genel Bakış');

  // Branch and Staff States
  const branches = useMemo<BranchItem[]>(() => {
    const source = branchesList;
    return source.map(branch => {
      const assigned = usersList.filter(user => user.branchId === branch.id || (!user.branchId && user.branch === branch.name));
      const patientCount = patientsList.filter(patient => patient.branchId === branch.id || (!patient.branchId && patient.branch === branch.name)).length;
      const salesCount = salesList.filter(sale => sale.branchId === branch.id).reduce((sum, sale) => sum + sale.items.reduce((qty, item) => qty + item.quantity, 0), 0);
      return { id: branch.id, name: branch.name, cityDistrict: branch.address || 'Adres belirtilmedi', status: branch.status, patientCount, staffCount: assigned.length, salesCount, staffAvatars: assigned.slice(0, 4).map(user => ({ initials: `${user.firstName[0] || ''}${user.lastName[0] || ''}`.toUpperCase(), color: '#0d9488' })), image: '', address: branch.address, phone: branch.phone };
    });
  }, [branchesList, usersList, patientsList, salesList, currentOrgId]);
  const staffList = useMemo<StaffUser[]>(() => {
    const source: SystemUser[] = usersList;
    return source.map(user => {
      const role: StaffUser['role'] = user.roles[0] || 'Odyometrist';
      return { id: user.id, uuid: user.userId || user.id, firstName: user.firstName, lastName: user.lastName, initials: `${user.firstName[0] || ''}${user.lastName[0] || ''}`.toUpperCase(), avatarColor: '#0d9488', email: user.email, phone: user.phone, role, branch: user.branch, status: user.status, lastLogin: user.lastLogin ? new Date(user.lastLogin).toLocaleString('tr-TR') : '—', accessLevel: role === 'Firma Yöneticisi' ? 'Tam Erişim' : 'Sınırlı Erişim' };
    });
  }, [usersList, currentOrgId]);

  // Search & Filters for Staff Table
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBranchFilter, setSelectedBranchFilter] = useState('Tüm Şubeler');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState('Tüm Roller');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('Tüm Durumlar');
  const [selectedBranchForRoleProgress, setSelectedBranchForRoleProgress] = useState('Tüm Şubeler');

  // Modals state
  const [showAddBranchModal, setShowAddBranchModal] = useState(false);
  const [showAddStaffModal, setShowAddStaffModal] = useState(false);
  const [showEditStaffModal, setShowEditStaffModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffUser | null>(null);
  const [showMatrixModal, setShowMatrixModal] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showBranchDetailModal, setShowBranchDetailModal] = useState<BranchItem | null>(null);

  // Forms
  const [newBranchForm, setNewBranchForm] = useState({
    name: '',
    cityDistrict: '',
    address: '',
    phone: ''
  });

  const [newStaffForm, setNewStaffForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    role: 'Odyometrist' as SystemUser['roles'][number],
    branch: '',
  });

  // Donut 1: Şubeler Arası Hasta Dağılımı (Total: 54)
  const visibleBranches = branches.filter(branch => matches(branch.name, branch.id));
  const branchPatientSlices = visibleBranches.map((branch, index) => ({ label: branch.name, value: branch.patientCount, color: ['#10b981', '#0284c7', '#f59e0b', '#8b5cf6'][index % 4] }));
  const roleStaffList = staffList.filter(user => matches(user.branch) && (selectedBranchForRoleProgress === 'Tüm Şubeler' || user.branch === selectedBranchForRoleProgress));
  const roleCountRows = [...new Set(roleStaffList.map(user => user.role))].map((role, index) => ({ role, count: roleStaffList.filter(user => user.role === role).length, max: Math.max(1, roleStaffList.length), color: ['#10b981', '#0284c7', '#f59e0b', '#8b5cf6', '#94a3b8'][index % 5] }));
  const roleSlices = roleCountRows.map(row => ({ label: row.role, value: row.count, color: row.color }));
  const authorizationRoles = ['Firma Yöneticisi', 'Şube Yöneticisi', 'Odyolog', 'Odyometrist', 'Sekreter', 'Resepsiyon', 'Muhasebe'];
  const authorizationPages = [
    { label: 'Şube & Yetki Yönetimi', page: 'branches' }, { label: 'Ayarlar', page: 'settings' },
    { label: 'Tedarikçiler', page: 'suppliers' }, { label: 'İşlem Kayıtları', page: 'audit-log' },
    { label: 'Şube Aktiviteleri', page: 'branch-activities' }, { label: 'Kasa', page: 'cash' },
    { label: 'Masraflar', page: 'expenses' }, { label: 'Raporlar', page: 'reports' },
    { label: 'SGK Ödeme Takvimi', page: 'sgk-receivables' }, { label: 'Demirbaşlar', page: 'assets' },
  ];
  const roleDescriptions: Record<string, string> = {
    'Firma Yöneticisi': 'Firma ve şube yönetimi dahil tüm sayfa kapsamlarına erişebilir.',
    'Şube Yöneticisi': 'Finansal sayfalara rol kuralı kapsamında erişebilir; yönetim sayfaları firma yöneticisine özeldir.',
    'Muhasebe': 'Finansal sayfalara erişebilir; yönetim sayfaları firma yöneticisine özeldir.',
    'Odyolog': 'Yönetim ve finans sayfaları bu uygulama kuralında kapalıdır.',
    'Odyometrist': 'Yönetim ve finans sayfaları bu uygulama kuralında kapalıdır.',
    'Sekreter': 'Yönetim ve finans sayfaları bu uygulama kuralında kapalıdır.',
    'Resepsiyon': 'Yönetim ve finans sayfaları bu uygulama kuralında kapalıdır.',
  };

  // Filtered Staff
  const filteredStaff = useMemo(() => {
    return staffList.filter(user => {
      if (!matches(user.branch)) return false;

      if (selectedBranchFilter !== 'Tüm Şubeler' && user.branch !== selectedBranchFilter) return false;
      if (selectedRoleFilter !== 'Tüm Roller' && user.role !== selectedRoleFilter) return false;
      if (selectedStatusFilter !== 'Tüm Durumlar' && user.status !== selectedStatusFilter) return false;

      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchesName = `${user.firstName} ${user.lastName}`.toLowerCase().includes(q);
        const matchesEmail = user.email.toLowerCase().includes(q);
        const matchesPhone = user.phone.includes(q);
        if (!matchesName && !matchesEmail && !matchesPhone) return false;
      }

      return true;
    });
  }, [staffList, selectedBranchFilter, selectedRoleFilter, selectedStatusFilter, searchTerm, matches]);

  // Handle Add Branch
  const handleSaveBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBranchForm.name.trim()) {
      addToast({ type: 'error', message: 'Lütfen şube adını girin.' });
      return;
    }

    const newBranch: Branch = {
      id: crypto.randomUUID(),
      name: newBranchForm.name,
      address: newBranchForm.address || newBranchForm.cityDistrict || '',
      phone: newBranchForm.phone,
      patientsCount: 0,
      status: 'Aktif',
    };

    try {
      await addBranch(newBranch);
      setShowAddBranchModal(false);
      setNewBranchForm({ name: '', cityDistrict: '', address: '', phone: '' });
    } catch { /* Context displays the persistence error. */ }
  };

  // Handle Add Staff
  const handleSaveStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStaffForm.firstName || !newStaffForm.lastName) {
      addToast({ type: 'error', message: 'Ad ve soyad zorunludur.' });
      return;
    }
    if (!newStaffForm.branch || !branchesList.some(branch => branch.name === newStaffForm.branch) && currentOrgId) {
      addToast({ type: 'error', message: 'Lütfen mevcut bir şube seçin.' });
      return;
    }

    if (!newStaffForm.email.trim()) {
      addToast({ type: 'error', message: 'Kullanıcı daveti için e-posta adresi zorunludur.' });
      return;
    }
    const newStaff: SystemUser = {
      id: crypto.randomUUID(),
      firstName: newStaffForm.firstName,
      lastName: newStaffForm.lastName,
      email: newStaffForm.email,
      phone: newStaffForm.phone,
      roles: [newStaffForm.role],
      branch: newStaffForm.branch,
      branchId: branchesList.find(branch => branch.name === newStaffForm.branch)?.id || null,
      status: 'Aktif',
      createdAt: new Date().toISOString(),
    };

    try {
      await addUser(newStaff);
      setShowAddStaffModal(false);
    } catch { return; }
    setNewStaffForm({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      role: 'Odyometrist',
      branch: '',
    });
  };

  // Handle Toggle Staff Status
  const handleToggleStaffStatus = async (user: StaffUser) => {
    const nextStatus = user.status === 'Aktif' ? 'Pasif' : 'Aktif';
    const original = usersList.find(item => item.id === user.id);
    if (original) await updateUser({ ...original, status: nextStatus });
  };

  // Handle Delete Staff
  const handleDeleteStaff = (user: StaffUser) => {
    if (confirm(`${user.firstName} ${user.lastName} adlı kullanıcıyı silmek istediğinize emin misiniz?`)) {
      void deleteUser(user.id);
    }
  };

  // Get Role Badge Style
  const getRoleBadgeClass = (role: StaffUser['role']) => {
    switch (role) {
      case 'Firma Yöneticisi': return styles.badgeRoleAdmin;
      case 'Sekreter': return styles.badgeRoleSekreter;
      case 'Odyometrist': return styles.badgeRoleOdyometrist;
      case 'Muhasebe': return styles.badgeRoleMuhasebe;
      default: return styles.badgeRoleSekreter;
    }
  };

  return (
    <div className={styles.branchesPage}>
      {/* ── Breadcrumb ── */}
      <div className={styles.breadcrumb}>
        <span>Şubeler &amp; Yetki</span>
        <span>&gt;</span>
        <span style={{ color: '#334155', fontWeight: 500 }}>Şube ve Rol Yönetimi</span>
      </div>

      {/* ── Page Heading ── */}
      <div className={styles.pageHeading}>
        <div className={styles.headingCopy}>
          <div className={styles.headingIcon}>
            {/* Building/Branch icon */}
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 21h18"></path>
              <path d="M5 21V7l8-4v18"></path>
              <path d="M19 21V11l-6-3"></path>
              <path d="M9 9v.01"></path>
              <path d="M9 13v.01"></path>
              <path d="M9 17v.01"></path>
            </svg>
          </div>
          <div>
            <h1>Şubeler &amp; Yetki Yönetimi</h1>
            <p>Tüm şubelerinizin yönetimi, rol dağılımları ve yetkili personellerin kontrollerini sağlayın.</p>
          </div>
        </div>

        <div className={styles.headerActions}>
          <button
            type="button"
            className={styles.btnSecondaryAction}
            onClick={() => setShowRoleModal(true)}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
              <circle cx="9" cy="7" r="4"></circle>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
            </svg>
            Rol Yönetimi
          </button>

          <button
            type="button"
            className={styles.btnSecondaryAction}
            onClick={() => setShowMatrixModal(true)}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
              <polyline points="9 12 11 14 15 10"></polyline>
            </svg>
            Yetki Matrisini Gör
          </button>

          <button
            type="button"
            className={styles.btnSecondaryAction}
            onClick={() => setShowAddBranchModal(true)}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            Yeni Şube
          </button>

          <button
            type="button"
            className={styles.btnPrimaryAction}
            onClick={() => setShowAddStaffModal(true)}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            Yeni Personel Ekle
          </button>
        </div>
      </div>

      {/* ── 4 Stat Cards in 1 Row ── */}
      <div className={styles.statsGrid4}>
        {/* Card 1 */}
        <div className={styles.statCard}>
          <div className={`${styles.statIconBox} ${styles.statIconBoxGreen}`}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 21h18"></path>
              <path d="M5 21V7l8-4v18"></path>
              <path d="M19 21V11l-6-3"></path>
            </svg>
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statLabel}>Toplam Şube</span>
          <span className={styles.statValue}>{visibleBranches.length}</span>
          </div>
        </div>

        {/* Card 2 */}
        <div className={styles.statCard}>
          <div className={`${styles.statIconBox} ${styles.statIconBoxBlue}`}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statLabel}>Toplam Personel</span>
          <span className={styles.statValue}>{staffList.length}</span>
          </div>
        </div>

        {/* Card 3 */}
        <div className={styles.statCard}>
          <div className={`${styles.statIconBox} ${styles.statIconBoxOrange}`}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
            </svg>
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statLabel}>Aktif Roller</span>
          <span className={styles.statValue}>{new Set(staffList.map(user => user.role)).size}</span>
          </div>
        </div>

        {/* Card 4 */}
        <div className={styles.statCard}>
          <div className={`${styles.statIconBox} ${styles.statIconBoxPurple}`}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statLabel}>Yetkilendirilmiş Personel</span>
          <span className={styles.statValue}>{staffList.filter(user => user.status === 'Aktif').length}</span>
          </div>
        </div>
      </div>

      {/* ── Sub-Tabs Navigation Pills ── */}
      <div className={styles.subTabsRow}>
        {[
          { label: 'Şube Genel Bakış', icon: '🏢' },
          { label: 'Personel Yönetimi', icon: '👤' },
          { label: 'Rol & Yetkiler', icon: '🛡️' },
          { label: 'Şube Aktiviteleri', icon: '📅' },
          { label: 'Erişim Logları', icon: '🕒' }
        ].map(tab => (
          <button
            key={tab.label}
            type="button"
            className={`${styles.subTabBtn} ${activeTab === tab.label ? styles.subTabBtnActive : ''}`}
            onClick={() => setActiveTab(tab.label)}
          >
            <span>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── SECTION 1: Şubelerimiz Grid + Hasta Dağılımı Donut ── */}
      <div className={styles.section1Grid} style={{ display: ['Şube Genel Bakış', 'Şube Aktiviteleri', 'Erişim Logları'].includes(activeTab) ? undefined : 'none' }}>
        {/* Left: Şubelerimiz */}
        <div className={styles.branchesContainer}>
          <div className={styles.containerHeader}>
            <span className={styles.containerTitle}>Şubelerimiz</span>
            <span className={styles.badgeMiniCount}>{branches.length} şube</span>
          </div>

          <div className={styles.branchesCardRow}>
            {visibleBranches.map(branch => (
              <div key={branch.id} className={styles.branchItemCard}>
                {branch.image ? <img
                  src={branch.image}
                  alt={branch.name}
                  className={styles.branchThumbnail}
                /> : <div className={styles.branchThumbnail} aria-hidden="true" style={{ display: 'grid', placeItems: 'center', background: '#eaf6f2', color: '#08785b', fontSize: 32 }}>⌂</div>}
                <div className={styles.branchCardBody}>
                  <div className={styles.branchHeadLine}>
                    <div className={styles.branchTitleWrap}>
                      <h4>{branch.name}</h4>
                      <p>{branch.cityDistrict}</p>
                    </div>
                    <span className={styles.badgeBranchActive}>● {branch.status}</span>
                  </div>

                  <div className={styles.branchMetricsGrid}>
                    <div className={styles.metricCol}>
                      <span>Hasta</span>
                      <strong>{branch.patientCount}</strong>
                    </div>
                    <div className={styles.metricCol}>
                      <span>Personel</span>
                      <strong>{branch.staffCount}</strong>
                    </div>
                    <div className={styles.metricCol}>
                      <span>Cihaz Satışı</span>
                      <strong>{branch.salesCount}</strong>
                    </div>
                  </div>

                  <div className={styles.branchCardFooter}>
                    <div className={styles.staffAvatarsList}>
                      {branch.staffAvatars.map((st, i) => (
                        <div
                          key={i}
                          className={styles.miniStaffAvatar}
                          style={{ background: st.color }}
                        >
                          {st.initials}
                        </div>
                      ))}
                    </div>

                    <button
                      type="button"
                      className={styles.btnDetailMini}
                      onClick={() => setShowBranchDetailModal(branch)}
                    >
                      Detay &gt;
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Şubeler Arası Hasta Dağılımı Donut */}
        <div className={styles.cardWhite}>
          <div className={styles.cardHeaderRow}>
            <h3>Şubeler Arası Hasta Dağılımı</h3>
            <span style={{ color: '#64748b', fontSize: 12 }}>Firma kapsamındaki mevcut hasta kayıtları</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14, margin: 'auto 0' }}>
            <SvgDonut
              size={130}
              strokeWidth={20}
              slices={branchPatientSlices}
              centerValue={visibleBranches.reduce((sum, branch) => sum + branch.patientCount, 0)}
              centerLabel="Toplam Hasta"
            />

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>
              {branchPatientSlices.map(item => (
                <div key={item.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: item.color }}></span>
                    <span style={{ color: '#334155' }}>{item.label}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontWeight: 700, color: '#0f172a' }}>{item.value}</span>
                    <span style={{ color: '#64748b', fontSize: 11 }}>%{visibleBranches.reduce((sum, branch) => sum + branch.patientCount, 0) ? Math.round(item.value / visibleBranches.reduce((sum, branch) => sum + branch.patientCount, 0) * 100) : 0}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── SECTION 2: 3 Cards Grid (Rol Dağılımı, Yetki Durumu, Son Aktiviteler) ── */}
      <div className={styles.section2Grid}>
        {/* Card 1: Rol Dağılımı */}
        <div className={styles.cardWhite}>
          <div className={styles.cardHeaderRow}>
            <h3>Rol Dağılımı</h3>
            <select
              className={styles.miniSelect}
              value={selectedBranchForRoleProgress}
              onChange={e => setSelectedBranchForRoleProgress(e.target.value)}
            >
              <option value="Tüm Şubeler">Tüm Şubeler</option>
              {branches.map(branch => <option key={branch.id} value={branch.name}>{branch.name}</option>)}
            </select>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', flex: 1 }}>
            {roleCountRows.map(r => (
              <div key={r.role} className={styles.roleProgressRow}>
                <span className={styles.roleLabel}>{r.role}</span>
                <span className={styles.roleCount}>{r.count}</span>
                <div className={styles.roleProgressBarTrack}>
                  <div
                    className={styles.roleProgressBarFill}
                    style={{ width: `${(r.count / r.max) * 100}%`, background: r.color }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Card 2: Yetki Durumu */}
        <div className={styles.cardWhite}>
          <div className={styles.cardHeaderRow}>
            <h3>Yetki Durumu</h3>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14, margin: 'auto 0' }}>
            <SvgDonut
              size={120}
              strokeWidth={18}
              slices={roleSlices}
              centerValue={roleStaffList.length}
              centerLabel="Toplam Personel"
            />

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>
              {roleSlices.map(item => (
                <div key={item.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: item.color }}></span>
                    <span style={{ color: '#334155' }}>{item.label}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontWeight: 700, color: '#0f172a' }}>{item.value}</span>
                    <span style={{ color: '#64748b', fontSize: 11 }}>%{roleStaffList.length ? Math.round(item.value / roleStaffList.length * 100) : 0}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Card 3: Son Aktiviteler */}
        <div className={styles.cardWhite}>
          <div className={styles.cardHeaderRow}>
            <h3>Son Aktiviteler</h3>
            <button
              type="button"
              className={styles.btnDetailMini}
              onClick={() => setCurrentPage('audit-log')}
            >
              Tümünü Gör &gt;
            </button>
          </div>

          <div className={styles.timelineList}>
            {auditLogList.slice(0, 4).map((act) => (
              <div key={act.id} className={styles.timelineItem}>
                <span className={styles.timelineDot} style={{ background: '#10b981' }}></span>
                <div className={styles.timelineItemBody}>
                  <div>
                    <strong>{act.userName}</strong>
                    <span className={styles.timelineItemDate}>{new Date(act.timestamp).toLocaleString('tr-TR')}</span>
                  </div>
                  <div className={styles.timelineItemNote}>{act.description}</div>
                </div>
              </div>
            ))}
            {auditLogList.length === 0 && <p>Bu firma için görüntülenecek denetim kaydı yok.</p>}
          </div>
        </div>
      </div>

      {/* ── SECTION 3: Sistem Personelleri Tablosu ── */}
      <div className={styles.tableContainerCard} style={{ display: activeTab === 'Personel Yönetimi' || activeTab === 'Rol & Yetkiler' ? undefined : 'none' }}>
        <div className={styles.tableToolbar}>
          <div className={styles.tableToolbarLeft}>
            <span className={styles.tableTitle}>Sistem Personelleri</span>
            <div className={styles.searchInputWrapper}>
              <svg className={styles.searchIcon} width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
              <input
                type="text"
                placeholder="İsim, e-posta veya telefon ile ara..."
                className={styles.searchInput}
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className={styles.tableToolbarRight}>
            <select
              className={styles.toolbarSelect}
              value={selectedBranchFilter}
              onChange={e => setSelectedBranchFilter(e.target.value)}
            >
              <option value="Tüm Şubeler">Tüm Şubeler</option>
              {branches.map(branch => <option key={branch.id} value={branch.name}>{branch.name}</option>)}
            </select>

            <select
              className={styles.toolbarSelect}
              value={selectedRoleFilter}
              onChange={e => setSelectedRoleFilter(e.target.value)}
            >
              <option value="Tüm Roller">Tüm Roller</option>
              <option value="Firma Yöneticisi">Firma Yöneticisi</option>
              <option value="Odyometrist">Odyometrist</option>
              <option value="Sekreter">Sekreter</option>
              <option value="Muhasebe">Muhasebe</option>
              <option value="Odyolog">Odyolog</option>
              <option value="Resepsiyon">Resepsiyon</option>
              <option value="Şube Yöneticisi">Şube Yöneticisi</option>
            </select>

            <select
              className={styles.toolbarSelect}
              value={selectedStatusFilter}
              onChange={e => setSelectedStatusFilter(e.target.value)}
            >
              <option value="Tüm Durumlar">Tüm Durumlar</option>
              <option value="Aktif">Aktif</option>
              <option value="Pasif">Pasif</option>
            </select>

            <button
              type="button"
              className={styles.btnSecondaryAction}
              onClick={() => addToast({ type: 'success', message: 'Personel listesi dışa aktarıldı.' })}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7 10 12 15 17 10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
              </svg>
              Dışa Aktar
            </button>
          </div>
        </div>

        <div className={styles.staffTableWrapper}>
          <table className={styles.staffTable}>
            <thead>
              <tr>
                <th>KULLANICI</th>
                <th>AD SOYAD</th>
                <th>E-POSTA &amp; TELEFON</th>
                <th>ROL</th>
                <th>ŞUBE</th>
                <th>DURUM</th>
                <th>SON GİRİŞ</th>
                <th style={{ textAlign: 'center' }}>İŞLEMLER</th>
              </tr>
            </thead>
            <tbody>
              {filteredStaff.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '30px 14px', color: '#64748b' }}>
                    Kriterlere uygun personel bulunamadı.
                  </td>
                </tr>
              ) : (
                filteredStaff.map(user => (
                  <tr key={user.id}>
                    <td>
                      <div
                        className={styles.userAvatar}
                        style={{ background: user.avatarColor }}
                      >
                        {user.initials}
                      </div>
                    </td>

                    <td>
                      <div className={styles.userMeta}>
                        <span className={styles.userName}>{user.firstName} {user.lastName}</span>
                        <span className={styles.userId}>ID: {user.uuid}</span>
                      </div>
                    </td>

                    <td>
                      <div>
                        <a href={`mailto:${user.email}`} className={styles.contactEmail}>{user.email}</a>
                        <div className={styles.contactPhone}>{user.phone}</div>
                      </div>
                    </td>

                    <td>
                      <span className={`${styles.badgeRole} ${getRoleBadgeClass(user.role)}`}>
                        {user.role}
                      </span>
                    </td>

                    <td>{user.branch}</td>

                    <td>
                      <span className={user.status === 'Aktif' ? styles.badgeStatusAktif : styles.badgeStatusPasif}>
                        ● {user.status}
                      </span>
                    </td>

                    <td style={{ color: '#64748b', fontSize: 11 }}>{user.lastLogin}</td>

                    <td>
                      <div className={styles.actionBtnGroup} style={{ justifyContent: 'center' }}>
                        <button
                          type="button"
                          className={styles.actionBtnMini}
                          title="Düzenle"
                          onClick={() => {
                            setEditingStaff(user);
                            setShowEditStaffModal(true);
                          }}
                        >
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
                          </svg>
                        </button>

                        <button
                          type="button"
                          className={styles.actionBtnMini}
                          title="Yetkileri Yönet"
                          onClick={() => setShowMatrixModal(true)}
                        >
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M21 2l-2 2m-1-1l-3 3m5 5l-2 2m-1-1l-3 3M3 21l8-8m0 0l4-4m-4 4l-4 4"></path>
                          </svg>
                        </button>

                        <button
                          type="button"
                          className={`${styles.actionBtnMini} ${styles.actionBtnMiniRed}`}
                          title="Sil"
                          onClick={() => handleDeleteStaff(user)}
                        >
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                          </svg>
                        </button>

                        <button
                          type="button"
                          className={styles.actionBtnMini}
                          title="Durum Değiştir"
                          onClick={() => handleToggleStaffStatus(user)}
                        >
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="1"></circle>
                            <circle cx="12" cy="5" r="1"></circle>
                            <circle cx="12" cy="19" r="1"></circle>
                          </svg>
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

      {/* ── MODAL 1: Yeni Şube Modalı ── */}
      {showAddBranchModal && (
        <div className={styles.modalOverlay} onClick={() => setShowAddBranchModal(false)}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>➕ Yeni Şube Tanımla</h2>
              <button type="button" className={styles.modalCloseBtn} onClick={() => setShowAddBranchModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSaveBranch}>
              <div className={styles.modalBody}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Şube Adı *</label>
                  <input
                    type="text"
                    required
                    placeholder="Örn: Alsancak Şube"
                    className={styles.formInput}
                    value={newBranchForm.name}
                    onChange={e => setNewBranchForm({ ...newBranchForm, name: e.target.value })}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>İl / İlçe *</label>
                  <input
                    type="text"
                    required
                    placeholder="Örn: İzmir / Konak"
                    className={styles.formInput}
                    value={newBranchForm.cityDistrict}
                    onChange={e => setNewBranchForm({ ...newBranchForm, cityDistrict: e.target.value })}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Açık Adres</label>
                  <input
                    type="text"
                    placeholder="Klinik açık adresi..."
                    className={styles.formInput}
                    value={newBranchForm.address}
                    onChange={e => setNewBranchForm({ ...newBranchForm, address: e.target.value })}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Şube Telefonu</label>
                  <input
                    type="text"
                    placeholder="0232 XXX XX XX"
                    className={styles.formInput}
                    value={newBranchForm.phone}
                    onChange={e => setNewBranchForm({ ...newBranchForm, phone: e.target.value })}
                  />
                </div>
              </div>
              <div className={styles.modalFooter}>
                <button type="button" className={styles.btnSecondaryAction} onClick={() => setShowAddBranchModal(false)}>İptal</button>
                <button type="submit" className={styles.btnPrimaryAction}>Şubeyi Kaydet</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL 2: Yeni Personel Ekle ── */}
      {showAddStaffModal && (
        <div className={styles.modalOverlay} onClick={() => setShowAddStaffModal(false)}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>➕ Yeni Personel Tanımla</h2>
              <button type="button" className={styles.modalCloseBtn} onClick={() => setShowAddStaffModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSaveStaff}>
              <div className={styles.modalBody}>
                <div className={styles.formGrid2}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Ad *</label>
                    <input
                      type="text"
                      required
                      placeholder="Örn: Burak"
                      className={styles.formInput}
                      value={newStaffForm.firstName}
                      onChange={e => setNewStaffForm({ ...newStaffForm, firstName: e.target.value })}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Soyad *</label>
                    <input
                      type="text"
                      required
                      placeholder="Örn: Akın"
                      className={styles.formInput}
                      value={newStaffForm.lastName}
                      onChange={e => setNewStaffForm({ ...newStaffForm, lastName: e.target.value })}
                    />
                  </div>
                </div>

                <div className={styles.formGrid2}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>E-posta</label>
                    <input
                      type="email"
                      required
                      placeholder="burak@isitmemerkezi.com"
                      className={styles.formInput}
                      value={newStaffForm.email}
                      onChange={e => setNewStaffForm({ ...newStaffForm, email: e.target.value })}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Telefon</label>
                    <input
                      type="text"
                      placeholder="05XX XXX XX XX"
                      className={styles.formInput}
                      value={newStaffForm.phone}
                      onChange={e => setNewStaffForm({ ...newStaffForm, phone: e.target.value })}
                    />
                  </div>
                </div>

                <div className={styles.formGrid2}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Sistem Rolü</label>
                    <select
                      className={styles.formSelect}
                      value={newStaffForm.role}
                      onChange={e => setNewStaffForm({ ...newStaffForm, role: e.target.value as SystemUser['roles'][number] })}
                    >
                      <option value="Odyometrist">Odyometrist</option>
                      <option value="Sekreter">Sekreter</option>
                      <option value="Muhasebe">Muhasebe</option>
                      <option value="Şube Yöneticisi">Şube Yöneticisi</option>
                      <option value="Odyolog">Odyolog</option>
                      <option value="Resepsiyon">Resepsiyon</option>
                    </select>
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Atanacak Şube</label>
                    <select
                      className={styles.formSelect}
                      value={newStaffForm.branch}
                      onChange={e => setNewStaffForm({ ...newStaffForm, branch: e.target.value })}
                    >
                      <option value="">Şube seçin</option>
                      {branches.map(b => (
                        <option key={b.name} value={b.name}>{b.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                  <p role="note" style={{ fontSize: 12, color: '#64748b' }}>Erişim, atanan sistem rolü ve şube kapsamı üzerinden belirlenir.</p>
              </div>
              <div className={styles.modalFooter}>
                <button type="button" className={styles.btnSecondaryAction} onClick={() => setShowAddStaffModal(false)}>İptal</button>
                <button type="submit" className={styles.btnPrimaryAction}>Personeli Kaydet</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL 3: Personel Düzenle ── */}
      {showEditStaffModal && editingStaff && (
        <div className={styles.modalOverlay} onClick={() => setShowEditStaffModal(false)}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>✏️ Personel Düzenle — {editingStaff.firstName} {editingStaff.lastName}</h2>
              <button type="button" className={styles.modalCloseBtn} onClick={() => setShowEditStaffModal(false)}>✕</button>
            </div>
            <form onSubmit={async e => {
              e.preventDefault();
              const original = usersList.find(user => user.id === editingStaff.id);
              if (!original) return;
              const branchId = branchesList.find(branch => branch.name === editingStaff.branch)?.id || null;
              try {
                await updateUser({ ...original, firstName: editingStaff.firstName, lastName: editingStaff.lastName, phone: editingStaff.phone, roles: [editingStaff.role === 'Diğer' ? 'Odyometrist' : editingStaff.role], branch: editingStaff.branch, branchId });
                setShowEditStaffModal(false);
              } catch { /* Context displays the persistence error. */ }
            }}>
              <div className={styles.modalBody}>
                <div className={styles.formGrid2}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Ad</label>
                    <input
                      type="text"
                      className={styles.formInput}
                      value={editingStaff.firstName}
                      onChange={e => setEditingStaff({ ...editingStaff, firstName: e.target.value })}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Soyad</label>
                    <input
                      type="text"
                      className={styles.formInput}
                      value={editingStaff.lastName}
                      onChange={e => setEditingStaff({ ...editingStaff, lastName: e.target.value })}
                    />
                  </div>
                </div>

                <div className={styles.formGrid2}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Rol</label>
                    <select
                      className={styles.formSelect}
                      value={editingStaff.role}
                      onChange={e => setEditingStaff({ ...editingStaff, role: e.target.value as StaffUser['role'] })}
                    >
                      <option value="Odyometrist">Odyometrist</option>
                      <option value="Sekreter">Sekreter</option>
                      <option value="Muhasebe">Muhasebe</option>
                      <option value="Firma Yöneticisi">Firma Yöneticisi</option>
                      <option value="Odyolog">Odyolog</option>
                      <option value="Resepsiyon">Resepsiyon</option>
                      <option value="Şube Yöneticisi">Şube Yöneticisi</option>
                    </select>
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Şube</label>
                    <select
                      className={styles.formSelect}
                      value={editingStaff.branch}
                      onChange={e => setEditingStaff({ ...editingStaff, branch: e.target.value })}
                    >
                      {branches.map(b => (
                        <option key={b.name} value={b.name}>{b.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Telefon</label>
                  <input
                    type="text"
                    className={styles.formInput}
                    value={editingStaff.phone}
                    onChange={e => setEditingStaff({ ...editingStaff, phone: e.target.value })}
                  />
                </div>
              </div>
              <div className={styles.modalFooter}>
                <button type="button" className={styles.btnSecondaryAction} onClick={() => setShowEditStaffModal(false)}>İptal</button>
                <button type="submit" className={styles.btnPrimaryAction}>Güncelle</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL 4: Yetki Matrisi ── */}
      {showMatrixModal && (
        <div className={styles.modalOverlay} onClick={() => setShowMatrixModal(false)}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()} style={{ maxWidth: 680 }}>
            <div className={styles.modalHeader}>
              <h2>🛡️ Sayfa Erişim Kuralları</h2>
              <button type="button" className={styles.modalCloseBtn} onClick={() => setShowMatrixModal(false)}>✕</button>
            </div>
            <div className={styles.modalBody}>
              <p style={{ fontSize: 12, color: '#64748b' }}>Bu görünüm uygulamadaki sayfa erişim kuralını gösterir; kayıt ekleme/düzenleme gibi işlem izinlerini temsil etmez.</p>
              <table className={styles.staffTable}>
                <thead>
                  <tr>
                    <th>MODÜL</th>
                    {authorizationRoles.map(role => <th key={role} style={{ textAlign: 'center' }}>{role}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {authorizationPages.map((row, i) => (
                    <tr key={i}>
                      <td style={{ fontWeight: 600 }}>{row.label}</td>
                      {authorizationRoles.map(role => { const allowed = canAccessPage(row.page, [role]); return <td key={role} style={{ textAlign: 'center', color: allowed ? '#16a34a' : '#94a3b8', fontWeight: 600 }}>{allowed ? 'Erişim var' : 'Yok'}</td>; })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className={styles.modalFooter}>
              <button type="button" className={styles.btnSecondaryAction} onClick={() => setShowMatrixModal(false)}>Kapat</button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL 5: Rol Yönetimi ── */}
      {showRoleModal && (
        <div className={styles.modalOverlay} onClick={() => setShowRoleModal(false)}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>👥 Sistem Rolleri &amp; Açıklamaları</h2>
              <button type="button" className={styles.modalCloseBtn} onClick={() => setShowRoleModal(false)}>✕</button>
            </div>
            <div className={styles.modalBody}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {authorizationRoles.map((role, index) => ({ role, desc: roleDescriptions[role], count: staffList.filter(user => user.role === role).length, color: ['#ea580c', '#0d9488', '#0284c7', '#10b981', '#64748b', '#2563eb', '#b45309'][index] })).map(r => (
                  <div key={r.role} style={{ padding: '12px 14px', background: '#f8fafc', borderRadius: 8, borderLeft: `4px solid ${r.color}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <strong style={{ color: '#0f172a' }}>{r.role}</strong>
                      <span style={{ fontSize: 11, color: '#64748b' }}>{r.count} Personel</span>
                    </div>
                    <p style={{ margin: '4px 0 0', fontSize: 12, color: '#475569' }}>{r.desc}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button type="button" className={styles.btnSecondaryAction} onClick={() => setShowRoleModal(false)}>Kapat</button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL 6: Şube Detay Modalı ── */}
      {showBranchDetailModal && (
        <div className={styles.modalOverlay} onClick={() => setShowBranchDetailModal(null)}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()} style={{ maxWidth: 500 }}>
            <div className={styles.modalHeader}>
              <h2>🏢 {showBranchDetailModal.name} Şubesi Detayları</h2>
              <button type="button" className={styles.modalCloseBtn} onClick={() => setShowBranchDetailModal(null)}>✕</button>
            </div>
            <div className={styles.modalBody}>
              <img
                src={showBranchDetailModal.image}
                alt={showBranchDetailModal.name}
                style={{ width: '100%', height: 160, objectFit: 'cover', borderRadius: 10 }}
              />
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, textAlign: 'center', background: '#f8fafc', padding: 12, borderRadius: 8, marginTop: 10 }}>
                <div>
                  <span style={{ fontSize: 11, color: '#64748b' }}>Toplam Hasta</span>
                  <div style={{ fontSize: 18, fontWeight: 700, color: '#0f172a' }}>{showBranchDetailModal.patientCount}</div>
                </div>
                <div>
                  <span style={{ fontSize: 11, color: '#64748b' }}>Personel</span>
                  <div style={{ fontSize: 18, fontWeight: 700, color: '#0f172a' }}>{showBranchDetailModal.staffCount}</div>
                </div>
                <div>
                  <span style={{ fontSize: 11, color: '#64748b' }}>Cihaz Satışı</span>
                  <div style={{ fontSize: 18, fontWeight: 700, color: '#0f172a' }}>{showBranchDetailModal.salesCount}</div>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13, marginTop: 8 }}>
                <div><strong>Adres:</strong> {showBranchDetailModal.address}</div>
                <div><strong>Telefon:</strong> {showBranchDetailModal.phone}</div>
                <div><strong>Durum:</strong> <span style={{ color: '#16a34a', fontWeight: 600 }}>● {showBranchDetailModal.status}</span></div>
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button type="button" className={styles.btnSecondaryAction} onClick={() => setShowBranchDetailModal(null)}>Kapat</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
