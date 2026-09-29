'use client';

import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
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
  role: 'Firma Yöneticisi' | 'Sekreter' | 'Odyometrist' | 'Muhasebe' | 'Diğer';
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

const INITIAL_BRANCHES: BranchItem[] = [
  {
    id: 'br-1',
    name: 'Merkez',
    cityDistrict: 'İstanbul / Kadıköy',
    status: 'Aktif',
    patientCount: 24,
    staffCount: 3,
    salesCount: 12,
    staffAvatars: [
      { initials: 'AY', color: '#0d9488' },
      { initials: 'MK', color: '#2563eb' },
      { initials: 'SD', color: '#0284c7' },
      { initials: '+1', color: '#64748b' }
    ],
    image: 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=360&auto=format&fit=crop&q=80',
    address: 'Bağdat Caddesi No:142 Kadıköy / İstanbul',
    phone: '0216 345 67 89'
  },
  {
    id: 'br-2',
    name: 'Çankaya',
    cityDistrict: 'Ankara / Çankaya',
    status: 'Aktif',
    patientCount: 18,
    staffCount: 2,
    salesCount: 5,
    staffAvatars: [
      { initials: 'ZG', color: '#64748b' },
      { initials: 'CE', color: '#0284c7' }
    ],
    image: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=360&auto=format&fit=crop&q=80',
    address: 'Tunalı Hilmi Caddesi No:88 Çankaya / Ankara',
    phone: '0312 419 22 33'
  },
  {
    id: 'br-3',
    name: 'Kadıköy',
    cityDistrict: 'İstanbul / Kadıköy',
    status: 'Aktif',
    patientCount: 12,
    staffCount: 3,
    salesCount: 1,
    staffAvatars: [
      { initials: 'AH', color: '#16a34a' },
      { initials: 'ED', color: '#0284c7' },
      { initials: 'SY', color: '#ea580c' }
    ],
    image: 'https://images.unsplash.com/photo-1586773860418-d37222d8fce3?w=360&auto=format&fit=crop&q=80',
    address: 'Moda Caddesi No:56 Kadıköy / İstanbul',
    phone: '0216 418 55 66'
  }
];

const INITIAL_STAFF: StaffUser[] = [
  {
    id: 'usr-1',
    uuid: '999d63b0-2753-4e45',
    firstName: 'Ahmet',
    lastName: 'Yılmaz',
    initials: 'AY',
    avatarColor: '#0d9488',
    email: 'ahmet@isitmemerkezi.com',
    phone: '0532 123 45 67',
    role: 'Firma Yöneticisi',
    branch: 'Merkez',
    status: 'Aktif',
    lastLogin: '29.09.2026 14:32',
    accessLevel: 'Tam Erişim'
  },
  {
    id: 'usr-2',
    uuid: 'a3e9f4c1-1188-4d2c',
    firstName: 'Zeynep',
    lastName: 'Kaya',
    initials: 'ZK',
    avatarColor: '#0284c7',
    email: 'zeynep@isitmemerkezi.com',
    phone: '0533 987 65 43',
    role: 'Sekreter',
    branch: 'Çankaya',
    status: 'Aktif',
    lastLogin: '29.09.2026 11:15',
    accessLevel: 'Sınırlı Erişim'
  },
  {
    id: 'usr-3',
    uuid: 'c8fcb6a9-7765-4e1a',
    firstName: 'Mehmet',
    lastName: 'Arslan',
    initials: 'MK',
    avatarColor: '#16a34a',
    email: 'mehmet@isitmemerkezi.com',
    phone: '0505 111 22 33',
    role: 'Odyometrist',
    branch: 'Kadıköy',
    status: 'Aktif',
    lastLogin: '28.09.2026 16:20',
    accessLevel: 'Sınırlı Erişim'
  },
  {
    id: 'usr-4',
    uuid: '74d3a9e9-c9b1-4d6c',
    firstName: 'Elif',
    lastName: 'Demir',
    initials: 'ED',
    avatarColor: '#ea580c',
    email: 'elif@isitmemerkezi.com',
    phone: '0532 987 65 43',
    role: 'Muhasebe',
    branch: 'Merkez',
    status: 'Pasif',
    lastLogin: '25.09.2026 10:05',
    accessLevel: 'Okuma Yetkisi'
  },
  {
    id: 'usr-5',
    uuid: '5543c1a2-8921-4f11',
    firstName: 'Selin',
    lastName: 'Demir',
    initials: 'SD',
    avatarColor: '#08785b',
    email: 'selin@isitmemerkezi.com',
    phone: '0535 777 88 99',
    role: 'Odyometrist',
    branch: 'Merkez',
    status: 'Aktif',
    lastLogin: '24.09.2026 17:00',
    accessLevel: 'Sınırlı Erişim'
  },
  {
    id: 'usr-6',
    uuid: '6712d9f8-4412-4a09',
    firstName: 'Can',
    lastName: 'Erdem',
    initials: 'CE',
    avatarColor: '#2563eb',
    email: 'can@isitmemerkezi.com',
    phone: '0542 666 55 44',
    role: 'Odyometrist',
    branch: 'Çankaya',
    status: 'Aktif',
    lastLogin: '24.09.2026 15:30',
    accessLevel: 'Sınırlı Erişim'
  },
  {
    id: 'usr-7',
    uuid: '8812e3b4-1190-4c22',
    firstName: 'Ali',
    lastName: 'Hakan',
    initials: 'AH',
    avatarColor: '#10b981',
    email: 'ali@isitmemerkezi.com',
    phone: '0536 444 33 22',
    role: 'Sekreter',
    branch: 'Kadıköy',
    status: 'Aktif',
    lastLogin: '22.09.2026 12:10',
    accessLevel: 'Tam Erişim'
  },
  {
    id: 'usr-8',
    uuid: '9912a7b8-3310-4d55',
    firstName: 'Seda',
    lastName: 'Yıldız',
    initials: 'SY',
    avatarColor: '#64748b',
    email: 'seda@isitmemerkezi.com',
    phone: '0538 999 11 22',
    role: 'Diğer',
    branch: 'Kadıköy',
    status: 'Aktif',
    lastLogin: '20.09.2026 09:45',
    accessLevel: 'Tam Erişim'
  }
];

export default function BranchesPage() {
  const { addToast } = useApp();
  const { matches } = useBranchScope();

  // Active Sub-Tab
  const [activeTab, setActiveTab] = useState('Şube Genel Bakış');

  // Branch and Staff States
  const [branches, setBranches] = useState<BranchItem[]>(INITIAL_BRANCHES);
  const [staffList, setStaffList] = useState<StaffUser[]>(INITIAL_STAFF);

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
    role: 'Odyometrist' as StaffUser['role'],
    branch: 'Merkez',
    accessLevel: 'Sınırlı Erişim' as StaffUser['accessLevel']
  });

  // Donut 1: Şubeler Arası Hasta Dağılımı (Total: 54)
  const branchPatientSlices = [
    { label: 'Merkez', value: 24, color: '#10b981' },
    { label: 'Çankaya', value: 18, color: '#0284c7' },
    { label: 'Kadıköy', value: 12, color: '#f59e0b' }
  ];

  // Donut 2: Yetki Durumu (Total: 8)
  const accessLevelSlices = [
    { label: 'Tam Erişim', value: 3, color: '#10b981' },
    { label: 'Sınırlı Erişim', value: 4, color: '#0284c7' },
    { label: 'Okuma Yetkisi', value: 1, color: '#f59e0b' }
  ];

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
  const handleSaveBranch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBranchForm.name.trim()) {
      addToast({ type: 'error', message: 'Lütfen şube adını girin.' });
      return;
    }

    const newBranch: BranchItem = {
      id: `br-${Date.now()}`,
      name: newBranchForm.name,
      cityDistrict: newBranchForm.cityDistrict || 'İstanbul / Kadıköy',
      status: 'Aktif',
      patientCount: 0,
      staffCount: 1,
      salesCount: 0,
      staffAvatars: [{ initials: 'YK', color: '#0d9488' }],
      image: 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=360&auto=format&fit=crop&q=80',
      address: newBranchForm.address || 'Adres belirtilmedi',
      phone: newBranchForm.phone || '0216 000 00 00'
    };

    setBranches([...branches, newBranch]);
    setShowAddBranchModal(false);
    setNewBranchForm({ name: '', cityDistrict: '', address: '', phone: '' });
    addToast({ type: 'success', message: `${newBranch.name} şubesi başarıyla oluşturuldu.` });
  };

  // Handle Add Staff
  const handleSaveStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStaffForm.firstName || !newStaffForm.lastName) {
      addToast({ type: 'error', message: 'Ad ve soyad zorunludur.' });
      return;
    }

    const initials = (newStaffForm.firstName[0] + newStaffForm.lastName[0]).toUpperCase();
    const newStaff: StaffUser = {
      id: `usr-${Date.now()}`,
      uuid: crypto.randomUUID().slice(0, 18),
      firstName: newStaffForm.firstName,
      lastName: newStaffForm.lastName,
      initials,
      avatarColor: '#0d9488',
      email: newStaffForm.email || `${newStaffForm.firstName.toLowerCase()}@isitmemerkezi.com`,
      phone: newStaffForm.phone || '05XX XXX XX XX',
      role: newStaffForm.role,
      branch: newStaffForm.branch,
      status: 'Aktif',
      lastLogin: new Date().toLocaleDateString('tr-TR') + ' ' + new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
      accessLevel: newStaffForm.accessLevel
    };

    setStaffList([newStaff, ...staffList]);
    setShowAddStaffModal(false);
    setNewStaffForm({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      role: 'Odyometrist',
      branch: 'Merkez',
      accessLevel: 'Sınırlı Erişim'
    });
    addToast({ type: 'success', message: `${newStaff.firstName} ${newStaff.lastName} sisteme eklendi.` });
  };

  // Handle Toggle Staff Status
  const handleToggleStaffStatus = (user: StaffUser) => {
    const nextStatus = user.status === 'Aktif' ? 'Pasif' : 'Aktif';
    setStaffList(staffList.map(u => u.id === user.id ? { ...u, status: nextStatus } : u));
    addToast({ type: 'info', message: `${user.firstName} ${user.lastName} durumu "${nextStatus}" yapıldı.` });
  };

  // Handle Delete Staff
  const handleDeleteStaff = (user: StaffUser) => {
    if (confirm(`${user.firstName} ${user.lastName} adlı kullanıcıyı silmek istediğinize emin misiniz?`)) {
      setStaffList(staffList.filter(u => u.id !== user.id));
      addToast({ type: 'warning', message: 'Personel kaydı silindi.' });
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
            <span className={styles.statValue}>3</span>
            <div className={styles.statTrend}>
              <span className={styles.trendGreen}>↘ %0</span>
              <span className={styles.trendMuted}>geçen aya göre</span>
            </div>
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
            <span className={styles.statValue}>8</span>
            <div className={styles.statTrend}>
              <span className={styles.trendGreen}>↗ %14</span>
              <span className={styles.trendMuted}>geçen aya göre</span>
            </div>
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
            <span className={styles.statValue}>4</span>
            <div className={styles.statTrend}>
              <span className={styles.trendGreen}>↘ %0</span>
              <span className={styles.trendMuted}>geçen aya göre</span>
            </div>
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
            <span className={styles.statValue}>8</span>
            <div className={styles.statTrend}>
              <span className={styles.trendGreen}>↗ %14</span>
              <span className={styles.trendMuted}>geçen aya göre</span>
            </div>
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
      <div className={styles.section1Grid}>
        {/* Left: Şubelerimiz */}
        <div className={styles.branchesContainer}>
          <div className={styles.containerHeader}>
            <span className={styles.containerTitle}>Şubelerimiz</span>
            <span className={styles.badgeMiniCount}>{branches.length} şube</span>
          </div>

          <div className={styles.branchesCardRow}>
            {branches.map(branch => (
              <div key={branch.id} className={styles.branchItemCard}>
                <img
                  src={branch.image}
                  alt={branch.name}
                  className={styles.branchThumbnail}
                />
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
            <select className={styles.miniSelect} defaultValue="Bu Yıl">
              <option value="Bu Yıl">Bu Yıl</option>
              <option value="Bu Ay">Bu Ay</option>
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14, margin: 'auto 0' }}>
            <SvgDonut
              size={130}
              strokeWidth={20}
              slices={branchPatientSlices}
              centerValue="54"
              centerLabel="Toplam Hasta"
            />

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>
              {[
                { name: 'Merkez', count: 24, pct: 44, color: '#10b981' },
                { name: 'Çankaya', count: 18, pct: 33, color: '#0284c7' },
                { name: 'Kadıköy', count: 12, pct: 22, color: '#f59e0b' }
              ].map(item => (
                <div key={item.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: item.color }}></span>
                    <span style={{ color: '#334155' }}>{item.name}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontWeight: 700, color: '#0f172a' }}>{item.count}</span>
                    <span style={{ color: '#64748b', fontSize: 11 }}>%{item.pct}</span>
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
              <option value="Merkez">Merkez</option>
              <option value="Çankaya">Çankaya</option>
              <option value="Kadıköy">Kadıköy</option>
            </select>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', flex: 1 }}>
            {[
              { role: 'Odyometrist', count: 3, max: 5, color: '#10b981' },
              { role: 'Sekreter', count: 2, max: 5, color: '#0284c7' },
              { role: 'Muhasebe', count: 1, max: 5, color: '#f59e0b' },
              { role: 'Firma Yöneticisi', count: 1, max: 5, color: '#8b5cf6' },
              { role: 'Diğer', count: 1, max: 5, color: '#94a3b8' }
            ].map(r => (
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
              slices={accessLevelSlices}
              centerValue="8"
              centerLabel="Toplam Personel"
            />

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>
              {[
                { name: 'Tam Erişim', count: 3, pct: 38, color: '#10b981' },
                { name: 'Sınırlı Erişim', count: 4, pct: 50, color: '#0284c7' },
                { name: 'Okuma Yetkisi', count: 1, pct: 12, color: '#f59e0b' }
              ].map(item => (
                <div key={item.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: item.color }}></span>
                    <span style={{ color: '#334155' }}>{item.name}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontWeight: 700, color: '#0f172a' }}>{item.count}</span>
                    <span style={{ color: '#64748b', fontSize: 11 }}>%{item.pct}</span>
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
              onClick={() => addToast({ type: 'info', message: 'Tüm aktiviteler listeleniyor.' })}
            >
              Tümünü Gör &gt;
            </button>
          </div>

          <div className={styles.timelineList}>
            {[
              { name: 'Ahmet Yılmaz', date: '29.09.2026 14:32', note: 'Kadıköy şubesine atandı.', dotColor: '#10b981' },
              { name: 'Zeynep Kaya', date: '29.09.2026 11:15', note: 'Yeni sekreter rolü verildi.', dotColor: '#f59e0b' },
              { name: 'Mehmet Arslan', date: '28.09.2026 16:20', note: 'Çankaya şubesinde yetki güncellendi.', dotColor: '#10b981' },
              { name: 'Elif Demir', date: '27.09.2026 10:05', note: 'Merkez şubesine atandı.', dotColor: '#10b981' }
            ].map((act, i) => (
              <div key={i} className={styles.timelineItem}>
                <span className={styles.timelineDot} style={{ background: act.dotColor }}></span>
                <div className={styles.timelineItemBody}>
                  <div>
                    <strong>{act.name}</strong>
                    <span className={styles.timelineItemDate}>{act.date}</span>
                  </div>
                  <div className={styles.timelineItemNote}>{act.note}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── SECTION 3: Sistem Personelleri Tablosu ── */}
      <div className={styles.tableContainerCard}>
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
              <option value="Merkez">Merkez</option>
              <option value="Çankaya">Çankaya</option>
              <option value="Kadıköy">Kadıköy</option>
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
              <option value="Diğer">Diğer</option>
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
                      onChange={e => setNewStaffForm({ ...newStaffForm, role: e.target.value as StaffUser['role'] })}
                    >
                      <option value="Odyometrist">Odyometrist</option>
                      <option value="Sekreter">Sekreter</option>
                      <option value="Muhasebe">Muhasebe</option>
                      <option value="Firma Yöneticisi">Firma Yöneticisi</option>
                      <option value="Diğer">Diğer</option>
                    </select>
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Atanacak Şube</label>
                    <select
                      className={styles.formSelect}
                      value={newStaffForm.branch}
                      onChange={e => setNewStaffForm({ ...newStaffForm, branch: e.target.value })}
                    >
                      {branches.map(b => (
                        <option key={b.name} value={b.name}>{b.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Erişim Seviyesi</label>
                  <select
                    className={styles.formSelect}
                    value={newStaffForm.accessLevel}
                    onChange={e => setNewStaffForm({ ...newStaffForm, accessLevel: e.target.value as StaffUser['accessLevel'] })}
                  >
                    <option value="Tam Erişim">Tam Erişim</option>
                    <option value="Sınırlı Erişim">Sınırlı Erişim</option>
                    <option value="Okuma Yetkisi">Okuma Yetkisi</option>
                  </select>
                </div>
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
            <form onSubmit={e => {
              e.preventDefault();
              setStaffList(staffList.map(u => u.id === editingStaff.id ? editingStaff : u));
              setShowEditStaffModal(false);
              addToast({ type: 'success', message: 'Personel bilgileri güncellendi.' });
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
                      <option value="Diğer">Diğer</option>
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
              <h2>🛡️ Şube &amp; Modül Yetki Matrisi</h2>
              <button type="button" className={styles.modalCloseBtn} onClick={() => setShowMatrixModal(false)}>✕</button>
            </div>
            <div className={styles.modalBody}>
              <table className={styles.staffTable}>
                <thead>
                  <tr>
                    <th>MODÜL</th>
                    <th style={{ textAlign: 'center' }}>FİRMA YÖNETİCİSİ</th>
                    <th style={{ textAlign: 'center' }}>ODYOMETRİST</th>
                    <th style={{ textAlign: 'center' }}>SEKRETER</th>
                    <th style={{ textAlign: 'center' }}>MUHASEBE</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { mod: 'Hastalar & CRM', a: 'Tam', b: 'Tam', c: 'Okuma / Ekleme', d: 'Okuma' },
                    { mod: 'Randevular & Takvim', a: 'Tam', b: 'Tam', c: 'Tam', d: 'Okuma' },
                    { mod: 'Kasa, Tahsilat & Masraflar', a: 'Tam', b: 'Yok', c: 'Sadece Tahsilat', d: 'Tam' },
                    { mod: 'Teknik Servis', a: 'Tam', b: 'Tam', c: 'Kabul / Teslim', d: 'Yok' },
                    { mod: 'Stok & Aksesuar', a: 'Tam', b: 'Okuma', c: 'Okuma', d: 'Tam' },
                    { mod: 'Şube & Yetki Yönetimi', a: 'Tam', b: 'Yok', c: 'Yok', d: 'Yok' },
                    { mod: 'Raporlar & Analitik', a: 'Tam', b: 'Kendi Şubesi', c: 'Yok', d: 'Finansal' }
                  ].map((row, i) => (
                    <tr key={i}>
                      <td style={{ fontWeight: 600 }}>{row.mod}</td>
                      <td style={{ textAlign: 'center', color: '#16a34a', fontWeight: 600 }}>{row.a}</td>
                      <td style={{ textAlign: 'center', color: row.b === 'Yok' ? '#94a3b8' : '#0284c7' }}>{row.b}</td>
                      <td style={{ textAlign: 'center', color: row.c === 'Yok' ? '#94a3b8' : '#0284c7' }}>{row.c}</td>
                      <td style={{ textAlign: 'center', color: row.d === 'Yok' ? '#94a3b8' : '#0284c7' }}>{row.d}</td>
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
                {[
                  { role: 'Firma Yöneticisi', desc: 'Sistemdeki tüm şubeler, finansal kayıtlar ve personel yetkilerine tam erişim yetkisi.', count: 1, color: '#ea580c' },
                  { role: 'Odyometrist', desc: 'Hasta kabulü, işitme testleri, cihaz denemeleri, satış ve teknik servis girişleri yapabilir.', count: 3, color: '#10b981' },
                  { role: 'Sekreter', desc: 'Randevu planlama, hasta karşılama, telefon iletişimi ve hızlı tahsilat işlemleri.', count: 2, color: '#0284c7' },
                  { role: 'Muhasebe', desc: 'Kasa giriş/çıkış, masraf yönetimi, faturalar ve tedarikçi borç takibi.', count: 1, color: '#b45309' },
                  { role: 'Diğer Destek', desc: 'Stajyer ve geçici destek personeli için kısıtlı görüntüleme.', count: 1, color: '#64748b' }
                ].map(r => (
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
