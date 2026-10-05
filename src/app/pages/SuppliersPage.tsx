'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { formatCurrency } from '../data/mockData';
import styles from './SuppliersPage.module.css';

export interface SupplierItem {
  id: string;
  companyName: string;
  subtitle: string;
  initials: string;
  avatarColor: string;
  category: 'Cihaz' | 'Pil' | 'Aksesuar' | 'Servis' | 'Diğer';
  contactPerson: string;
  contactTitle?: string;
  phone: string;
  email: string;
  address: string;
  taxNo: string;
  balance: number;
  status: 'Aktif' | 'Pasif';
  branch?: string;
  notes?: string;
  totalPurchases?: number;
  totalPaid?: number;
  invoices?: { id: string; invoiceNo: string; date: string; amount: number; status: string }[];
  payments?: { id: string; date: string; amount: number; method: string }[];
}


export default function SuppliersPage() {
  const { addToast, addSupplier, updateSupplier, suppliersList, currentOrgId } = useApp();

  const suppliers = useMemo<SupplierItem[]>(() => suppliersList.map((supplier, index) => {
    const category: SupplierItem['category'] = supplier.category === 'İşitme Cihazı' ? 'Cihaz'
      : supplier.category === 'Pil & Aksesuar' ? 'Pil'
        : supplier.category === 'Teknik Servis' ? 'Servis'
          : supplier.category === 'Kalıp Malzemesi' ? 'Aksesuar' : 'Diğer';
    const purchases = supplier.purchases || [];
    return {
      id: supplier.id,
      companyName: supplier.companyName,
      subtitle: `${category} Tedarikçisi`,
      initials: supplier.companyName.split(/\\s+/).map(part => part[0] || '').join('').slice(0, 2).toLocaleUpperCase('tr-TR'),
      avatarColor: ['#0d9488', '#2563eb', '#7c3aed', '#d97706'][index % 4],
      category,
      contactPerson: supplier.contactPerson || '—',
      phone: supplier.phone || '—', email: supplier.email || '—', address: supplier.address || '—',
      taxNo: supplier.taxNo || '—', balance: Number(supplier.balance || 0), status: supplier.status,
      branch: '—', notes: supplier.notes,
      totalPurchases: purchases.reduce((sum, purchase) => sum + Number(purchase.total || 0), 0),
      totalPaid: purchases.filter(purchase => purchase.paymentStatus === 'Ödendi').reduce((sum, purchase) => sum + Number(purchase.total || 0), 0),
      invoices: purchases.map(purchase => ({ id: purchase.id, invoiceNo: purchase.invoiceNo, date: purchase.date, amount: purchase.total, status: purchase.paymentStatus })),
      payments: []
    };
  }), [suppliersList]);
  const [filterPill, setFilterPill] = useState<'Tümü' | 'Aktif' | 'Pasif'>('Tümü');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Tüm Kategoriler');
  const [selectedStatusDropdown, setSelectedStatusDropdown] = useState('Tüm Durumlar');

  // Selected item for right detail drawer
  const [selectedSupplier, setSelectedSupplier] = useState<SupplierItem | null>(null);
  const [selectedRowIds, setSelectedRowIds] = useState<string[]>([]);
  const [drawerTab, setDrawerTab] = useState<'Genel' | 'Alış Faturaları' | 'Ödeme Geçmişi' | 'Notlar'>('Genel');

  // Modals state
  const [showNewSupplierModal, setShowNewSupplierModal] = useState(false);
  const [showEditSupplierModal, setShowEditSupplierModal] = useState(false);
  const [showAddInvoiceModal, setShowAddInvoiceModal] = useState(false);
  const [showMakePaymentModal, setShowMakePaymentModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showGroupsModal, setShowGroupsModal] = useState(false);

  // Form states
  const [newSupForm, setNewSupForm] = useState({
    companyName: '',
    subtitle: 'Cihaz Tedarikçisi',
    category: 'Cihaz' as SupplierItem['category'],
    contactPerson: '',
    contactTitle: 'Satış Temsilcisi',
    phone: '',
    email: '',
    address: '',
    taxNo: '',
    status: 'Aktif' as SupplierItem['status'],
    notes: ''
  });

  const [invoiceForm, setInvoiceForm] = useState({
    invoiceNo: '',
    date: new Date().toLocaleDateString('tr-TR'),
    amount: 0,
    description: ''
  });

  const [paymentForm, setPaymentForm] = useState({
    amount: 0,
    method: 'Banka Transferi',
    date: new Date().toLocaleDateString('tr-TR'),
    notes: ''
  });

  useEffect(() => {
    if (selectedSupplier && !suppliers.some(item => item.id === selectedSupplier.id)) setSelectedSupplier(null);
  }, [selectedSupplier, suppliers]);

  // Pill counts calculation
  const pillCounts = useMemo(() => {
    const total = suppliers.length;
    const active = suppliers.filter(s => s.status === 'Aktif').length;
    const passive = suppliers.filter(s => s.status === 'Pasif').length;
    return { total, active, passive };
  }, [suppliers]);
  const supplierTotals = useMemo(() => {
    const monthKey = new Date().toISOString().slice(0, 7);
    const purchasesThisMonth = suppliers.reduce((sum, supplier) => sum + (supplier.invoices || []).reduce((invoiceSum, invoice) => {
      const isoDate = invoice.date.includes('.') ? invoice.date.split('.').reverse().join('-') : invoice.date.slice(0, 10);
      return invoiceSum + (isoDate.startsWith(monthKey) ? Number(invoice.amount || 0) : 0);
    }, 0), 0);
    const balanceOwed = suppliers.reduce((sum, supplier) => sum + Math.max(0, supplier.balance), 0);
    return { purchasesThisMonth, balanceOwed };
  }, [suppliers]);

  // Filtered rows
  const filteredSuppliers = useMemo(() => {
    return suppliers.filter(item => {

      // Filter pill
      if (filterPill === 'Aktif' && item.status !== 'Aktif') return false;
      if (filterPill === 'Pasif' && item.status !== 'Pasif') return false;

      // Dropdowns
      if (selectedCategory !== 'Tüm Kategoriler' && item.category !== selectedCategory) return false;
      if (selectedStatusDropdown !== 'Tüm Durumlar' && item.status !== selectedStatusDropdown) return false;

      // Search term
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchesName = item.companyName.toLowerCase().includes(q) || item.subtitle.toLowerCase().includes(q);
        const matchesPerson = item.contactPerson.toLowerCase().includes(q);
        const matchesTax = item.taxNo.includes(q);
        const matchesPhone = item.phone.includes(q);
        if (!matchesName && !matchesPerson && !matchesTax && !matchesPhone) return false;
      }

      return true;
    });
  }, [suppliers, filterPill, selectedCategory, selectedStatusDropdown, searchTerm]);

  // Toggle selection
  const handleToggleRow = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedRowIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedRowIds.length === filteredSuppliers.length) {
      setSelectedRowIds([]);
    } else {
      setSelectedRowIds(filteredSuppliers.map(s => s.id));
    }
  };

  // Row click opens drawer
  const handleRowClick = (item: SupplierItem) => {
    setSelectedSupplier(item);
    if (!selectedRowIds.includes(item.id)) {
      setSelectedRowIds([item.id]);
    }
  };

  // Category badge class
  const getCategoryBadgeClass = (cat: SupplierItem['category']) => {
    switch (cat) {
      case 'Cihaz': return styles.badgeCatCihaz;
      case 'Pil': return styles.badgeCatPil;
      case 'Aksesuar': return styles.badgeCatAksesuar;
      case 'Servis': return styles.badgeCatServis;
      case 'Diğer': return styles.badgeCatDiger;
      default: return styles.badgeCatDiger;
    }
  };

  // Toggle supplier status between Aktif / Pasif
  const handleToggleStatus = async (supplier: SupplierItem) => {
    const nextStatus = supplier.status === 'Aktif' ? 'Pasif' : 'Aktif';
    const source = suppliersList.find(item => item.id === supplier.id);
    if (!source) return;
    try {
      await updateSupplier({ ...source, status: nextStatus });
      addToast({ type: 'success', message: `${supplier.companyName} durumu güncellendi.` });
    } catch (error) { addToast({ type: 'error', message: error instanceof Error ? error.message : 'Tedarikçi güncellenemedi.' }); }
  };

  // Handle Add New Supplier
  const handleCreateSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSupForm.companyName.trim()) {
      addToast({ type: 'error', message: 'Lütfen firma adını girin.' });
      return;
    }

    const initials = newSupForm.companyName
      .split(' ')
      .map(w => w[0])
      .join('')
      .toUpperCase()
      .substring(0, 2) || 'TD';

    const category = newSupForm.category === 'Cihaz' ? 'İşitme Cihazı' : newSupForm.category === 'Pil' ? 'Pil & Aksesuar' : newSupForm.category === 'Servis' ? 'Teknik Servis' : newSupForm.category === 'Aksesuar' ? 'Kalıp Malzemesi' : 'Diğer';
    try {
      await addSupplier({
        id: crypto.randomUUID(), companyName: newSupForm.companyName.trim(), contactPerson: newSupForm.contactPerson.trim(),
        phone: newSupForm.phone.trim(), email: newSupForm.email.trim(), address: newSupForm.address.trim(), taxNo: newSupForm.taxNo.trim(),
        category, status: newSupForm.status, balance: 0, createdAt: new Date().toISOString(), notes: newSupForm.notes.trim(), purchases: []
      });
    } catch (error) { addToast({ type: 'error', message: error instanceof Error ? error.message : 'Tedarikçi kaydedilemedi.' }); return; }
    setSelectedRowIds([]);
    setShowNewSupplierModal(false);
    setNewSupForm({
      companyName: '',
      subtitle: 'Cihaz Tedarikçisi',
      category: 'Cihaz',
      contactPerson: '',
      contactTitle: 'Satış Temsilcisi',
      phone: '',
      email: '',
      address: '',
      taxNo: '',
      status: 'Aktif',
      notes: ''
    });
    addToast({ type: 'success', message: 'Yeni tedarikçi kaydedildi.' });
  };

  // Handle Add Invoice
  const handleSaveInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSupplier) return;
    const invNo = invoiceForm.invoiceNo.trim() || `ALIS-${Math.floor(1000 + Math.random() * 9000)}`;
    const amt = Number(invoiceForm.amount) || 0;

    if (!currentOrgId || amt <= 0 || !invNo) {
      addToast({ type: 'error', message: 'Geçerli fatura numarası ve sıfırdan büyük tutar girin.' });
      return;
    }
    addToast({ type: 'error', message: 'Alış faturası, stok ve kasa kayıtlarını tek işlemde güvenli kaydeden sunucu işlemi henüz bu ortamda etkin değil. Kayıt oluşturulmadı.' });
  };

  // Handle Make Payment
  const handleSavePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSupplier) return;
    const amt = Number(paymentForm.amount) || 0;

    if (amt <= 0) {
      addToast({ type: 'error', message: 'Ödeme tutarı sıfırdan büyük olmalıdır.' });
      return;
    }
    addToast({ type: 'error', message: 'Tedarikçi ödemesi ile tedarikçi bakiyesi/kasa hareketini birlikte kaydeden sunucu işlemi henüz bu ortamda etkin değil. Ödeme oluşturulmadı.' });
  };

  return (
    <div className={styles.suppliersPage}>
      {/* ── Breadcrumb ── */}
      <div className={styles.breadcrumb}>
        <span>Tedarikçiler</span>
        <span>&gt;</span>
        <span style={{ color: '#334155', fontWeight: 500 }}>Tedarikçi Yönetimi</span>
      </div>

      {/* ── Page Heading ── */}
      <div className={styles.pageHeading}>
        <div className={styles.headingCopy}>
          <div className={styles.headingIcon}>
            {/* Delivery truck icon */}
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="1" y="3" width="15" height="13"></rect>
              <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon>
              <circle cx="5.5" cy="18.5" r="2.5"></circle>
              <circle cx="18.5" cy="18.5" r="2.5"></circle>
            </svg>
          </div>
          <div>
            <h1>Tedarikçiler</h1>
            <p>Cihaz, pil ve aksesuar tedarikçilerinizi yönetin. Alış faturalarını, bakiye durumlarını ve iletişim bilgilerini tek ekranda takip edin.</p>
          </div>
        </div>

        <div className={styles.headerActions}>
          <button
            type="button"
            className={styles.btnSecondaryAction}
            onClick={() => setShowReportModal(true)}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="20" x2="18" y2="10"></line>
              <line x1="12" y1="20" x2="12" y2="4"></line>
              <line x1="6" y1="20" x2="6" y2="14"></line>
            </svg>
            Tedarikçi Raporu
          </button>

          <button
            type="button"
            className={styles.btnPrimaryAction}
            onClick={() => setShowNewSupplierModal(true)}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            Yeni Tedarikçi Ekle
          </button>
        </div>
      </div>

      {/* ── 4 Stat Cards ── */}
      <div className={styles.statsGrid}>
        {/* Card 1 */}
        <div className={styles.statCard}>
          <div className={`${styles.statIconBox} ${styles.statIconBoxBlue}`}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statLabel}>Toplam Tedarikçi</span>
            <span className={styles.statValue}>{pillCounts.total}</span>
          </div>
        </div>

        {/* Card 2 */}
        <div className={styles.statCard}>
          <div className={`${styles.statIconBox} ${styles.statIconBoxRed}`}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
              <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
            </svg>
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statLabel}>Toplam Borcumuz</span>
            <span className={styles.statValue}>{formatCurrency(supplierTotals.balanceOwed)}</span>
          </div>
        </div>

        {/* Card 3 */}
        <div className={styles.statCard}>
          <div className={`${styles.statIconBox} ${styles.statIconBoxGreen}`}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="5" width="20" height="14" rx="2"></rect>
              <line x1="2" y1="10" x2="22" y2="10"></line>
            </svg>
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statLabel}>Bu Ay Alım Tutarı</span>
            <span className={styles.statValue}>{formatCurrency(supplierTotals.purchasesThisMonth)}</span>
          </div>
        </div>

        {/* Card 4 */}
        <div className={styles.statCard}>
          <div className={`${styles.statIconBox} ${styles.statIconBoxPurple}`}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"></polygon>
            </svg>
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statLabel}>Aktif Tedarikçiler</span>
            <span className={styles.statValue}>{pillCounts.active}</span>
            <div className={styles.statTrend}>
              <span className={styles.trendMuted}>Pasif: {pillCounts.passive}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Status Pills & Groups Row ── */}
      <div className={styles.pillsAndGroupsRow}>
        <div className={styles.pillsList}>
          {(['Tümü', 'Aktif', 'Pasif'] as const).map(tab => {
            const count = tab === 'Tümü' ? pillCounts.total : tab === 'Aktif' ? pillCounts.active : pillCounts.passive;
            const isActive = filterPill === tab;
            return (
              <button
                key={tab}
                type="button"
                className={`${styles.pillBtn} ${isActive ? styles.pillBtnActive : ''}`}
                onClick={() => setFilterPill(tab)}
              >
                {tab} ({count})
              </button>
            );
          })}
        </div>

        <button
          type="button"
          className={styles.btnSecondaryAction}
          onClick={() => setShowGroupsModal(true)}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
          </svg>
          Dış Firma Grupları
        </button>
      </div>

      {/* ── Secondary Filter Row ── */}
      <div className={styles.secondaryFilterBar}>
        <div className={styles.searchInputWrapper}>
          <svg className={styles.searchIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input
            type="text"
            placeholder="Firma adı, yetkili veya vergi no ile ara..."
            className={styles.searchInput}
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>

        <select
          className={styles.filterSelect}
          value={selectedCategory}
          onChange={e => setSelectedCategory(e.target.value)}
        >
          <option value="Tüm Kategoriler">Tüm Kategoriler</option>
          <option value="Cihaz">Cihaz</option>
          <option value="Pil">Pil</option>
          <option value="Aksesuar">Aksesuar</option>
          <option value="Servis">Servis</option>
          <option value="Diğer">Diğer</option>
        </select>

        <select
          className={styles.filterSelect}
          value={selectedStatusDropdown}
          onChange={e => setSelectedStatusDropdown(e.target.value)}
        >
          <option value="Tüm Durumlar">Tüm Durumlar</option>
          <option value="Aktif">Aktif</option>
          <option value="Pasif">Pasif</option>
        </select>

        <button
          type="button"
          className={styles.btnFilterOutline}
          onClick={() => addToast({ type: 'info', message: 'Filtreler uygulandı.' })}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
          </svg>
          Filtrele
        </button>

        <button
          type="button"
          className={styles.btnClearOutline}
          onClick={() => {
            setSearchTerm('');
            setFilterPill('Tümü');
            setSelectedCategory('Tüm Kategoriler');
            setSelectedStatusDropdown('Tüm Durumlar');
            addToast({ type: 'info', message: 'Filtreler temizlendi.' });
          }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="1 4 1 10 7 10"></polyline>
            <polyline points="23 20 23 14 17 14"></polyline>
            <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"></path>
          </svg>
          Temizle
        </button>
      </div>

      {/* ── Main Layout: Table + Detail Drawer ── */}
      <div className={styles.mainLayoutContainer}>
        {/* Table Section */}
        <div className={`${styles.tableSection} ${selectedSupplier ? styles.tableSectionWithDrawer : ''}`}>
          <div className={styles.tableWrapper}>
            <table className={styles.supplierTable}>
              <thead>
                <tr>
                  <th style={{ width: 40, textAlign: 'center' }}>
                    <input
                      type="checkbox"
                      className={styles.checkboxInput}
                      checked={selectedRowIds.length === filteredSuppliers.length && filteredSuppliers.length > 0}
                      onChange={handleSelectAll}
                    />
                  </th>
                  <th>FİRMA ADI</th>
                  <th>KATEGORİ</th>
                  <th>YETKİLİ KİŞİ</th>
                  <th>İLETİŞİM</th>
                  <th>VERGİ NO</th>
                  <th>BAKİYE</th>
                  <th>DURUM</th>
                  <th style={{ textAlign: 'center' }}>İŞLEMLER</th>
                </tr>
              </thead>
              <tbody>
                {filteredSuppliers.length === 0 ? (
                  <tr>
                    <td colSpan={9} style={{ textAlign: 'center', padding: '40px 16px', color: '#64748b' }}>
                      Kriterlere uygun tedarikçi bulunamadı.
                    </td>
                  </tr>
                ) : (
                  filteredSuppliers.map(item => {
                    const isSelected = selectedRowIds.includes(item.id);
                    const isCurrentDetail = selectedSupplier?.id === item.id;
                    return (
                      <tr
                        key={item.id}
                        className={`${styles.tableRow} ${isCurrentDetail ? styles.tableRowSelected : ''}`}
                        onClick={() => handleRowClick(item)}
                      >
                        <td style={{ textAlign: 'center' }} onClick={e => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            className={styles.checkboxInput}
                            checked={isSelected}
                            onChange={(e) => handleToggleRow(item.id, e as unknown as React.MouseEvent)}
                          />
                        </td>

                        <td>
                          <div className={styles.firmCell}>
                            <div
                              className={styles.firmAvatar}
                              style={{ background: item.avatarColor }}
                            >
                              {item.initials}
                            </div>
                            <div className={styles.firmMeta}>
                              <span className={styles.firmName}>{item.companyName}</span>
                              <span className={styles.firmSubtitle}>{item.subtitle}</span>
                            </div>
                          </div>
                        </td>

                        <td>
                          <span className={`${styles.badgeCategory} ${getCategoryBadgeClass(item.category)}`}>
                            {item.category}
                          </span>
                        </td>

                        <td>
                          <div className={styles.contactCell}>
                            <span className={styles.contactPerson}>{item.contactPerson}</span>
                            {item.contactTitle && <span className={styles.contactTitle}>{item.contactTitle}</span>}
                          </div>
                        </td>

                        <td>
                          <div className={styles.phoneCell}>{item.phone}</div>
                          <div className={styles.emailCell}>{item.email}</div>
                        </td>

                        <td>
                          <span className={styles.taxNoCell}>{item.taxNo}</span>
                        </td>

                        <td>
                          <span className={item.balance > 0 ? styles.balanceCellRed : styles.balanceCellNormal}>
                            ₺{item.balance.toLocaleString('tr-TR')}
                          </span>
                        </td>

                        <td>
                          <span className={item.status === 'Aktif' ? styles.badgeStatusAktif : styles.badgeStatusPasif}>
                            {item.status}
                          </span>
                        </td>

                        <td style={{ textAlign: 'center' }} onClick={e => e.stopPropagation()}>
                          <div className={styles.actionButtonsCell} style={{ justifyContent: 'center' }}>
                            <button
                              type="button"
                              className={styles.iconBtn}
                              title="Görüntüle"
                              onClick={() => setSelectedSupplier(item)}
                            >
                              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                <circle cx="12" cy="12" r="3"></circle>
                              </svg>
                            </button>

                            <button
                              type="button"
                              className={styles.iconBtn}
                              title="Düzenle"
                              onClick={() => {
                                setSelectedSupplier(item);
                                setShowEditSupplierModal(true);
                              }}
                            >
                              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
                              </svg>
                            </button>

                            <button
                              type="button"
                              className={styles.iconBtn}
                              title="Durum Değiştir"
                              onClick={() => handleToggleStatus(item)}
                            >
                              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="1"></circle>
                                <circle cx="12" cy="5" r="1"></circle>
                                <circle cx="12" cy="19" r="1"></circle>
                              </svg>
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

          {/* ── Table Pagination Bar ── */}
          <div className={styles.paginationRow}>
            <div>
              Toplam {filteredSuppliers.length} kayıt |{' '}
              <span className={styles.selectedCount}>{selectedRowIds.length} kayıt seçili</span>
            </div>

            <div className={styles.pageControls}>
              <button type="button" className={styles.pageBtn} title="İlk Sayfa">«</button>
              <button type="button" className={styles.pageBtn} title="Önceki Sayfa">‹</button>
              <button type="button" className={`${styles.pageBtn} ${styles.pageBtnActive}`}>1</button>
              <button type="button" className={styles.pageBtn}>2</button>
              <button type="button" className={styles.pageBtn}>3</button>
              <button type="button" className={styles.pageBtn} title="Sonraki Sayfa">›</button>
              <button type="button" className={styles.pageBtn} title="Son Sayfa">»</button>

              <select className={styles.pageSizeSelect} defaultValue="10">
                <option value="10">10 / sayfa</option>
                <option value="25">25 / sayfa</option>
                <option value="50">50 / sayfa</option>
              </select>
            </div>
          </div>
        </div>

        {/* ── Right Detail Drawer ── */}
        {selectedSupplier && (
          <div className={styles.detailDrawer}>
            {/* Drawer Header */}
            <div className={styles.drawerHeader}>
              <div className={styles.drawerFirmInfo}>
                <div className={styles.drawerAvatar}>
                  {selectedSupplier.initials}
                </div>
                <div className={styles.drawerTitleWrap}>
                  <h3>{selectedSupplier.companyName}</h3>
                  <p>{selectedSupplier.subtitle}</p>
                </div>
              </div>

              <div className={styles.drawerHeaderRight}>
                <span className={selectedSupplier.status === 'Aktif' ? styles.badgeStatusAktif : styles.badgeStatusPasif}>
                  ● {selectedSupplier.status}
                </span>
                <button
                  type="button"
                  className={styles.drawerCloseBtn}
                  onClick={() => setSelectedSupplier(null)}
                  title="Detayı Kapat"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Drawer Sub-Tabs */}
            <div className={styles.drawerTabs}>
              {(['Genel', 'Alış Faturaları', 'Ödeme Geçmişi', 'Notlar'] as const).map(tab => (
                <button
                  key={tab}
                  type="button"
                  className={`${styles.drawerTabBtn} ${drawerTab === tab ? styles.drawerTabBtnActive : ''}`}
                  onClick={() => setDrawerTab(tab)}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Drawer Content */}
            <div className={styles.drawerBody}>
              {drawerTab === 'Genel' && (
                <>
                  {/* Firma Bilgileri */}
                  <div className={styles.sectionBlock}>
                    <div className={styles.sectionHeaderRow}>
                      <span className={styles.sectionTitle}>Firma Bilgileri</span>
                      <button
                        type="button"
                        className={styles.btnEditMini}
                        onClick={() => setShowEditSupplierModal(true)}
                      >
                        Düzenle
                      </button>
                    </div>

                    <div className={styles.keyValueGrid}>
                      <div className={styles.keyValueRow}>
                        <span className={styles.keyLabel}>Vergi No</span>
                        <span className={styles.keyVal} style={{ fontFamily: 'monospace' }}>{selectedSupplier.taxNo}</span>
                      </div>
                      <div className={styles.keyValueRow}>
                        <span className={styles.keyLabel}>Yetkili Kişi</span>
                        <span className={styles.keyVal}>{selectedSupplier.contactPerson}</span>
                      </div>
                      <div className={styles.keyValueRow}>
                        <span className={styles.keyLabel}>Telefon</span>
                        <span className={styles.keyVal}>{selectedSupplier.phone}</span>
                      </div>
                      <div className={styles.keyValueRow}>
                        <span className={styles.keyLabel}>E-posta</span>
                        <a href={`mailto:${selectedSupplier.email}`} className={styles.keyValLink}>{selectedSupplier.email}</a>
                      </div>
                      <div className={styles.keyValueRow}>
                        <span className={styles.keyLabel}>Adres</span>
                        <span className={styles.keyVal}>{selectedSupplier.address}</span>
                      </div>
                      <div className={styles.keyValueRow}>
                        <span className={styles.keyLabel}>Kategori</span>
                        <span className={styles.keyVal}>{selectedSupplier.subtitle}</span>
                      </div>
                      <div className={styles.keyValueRow}>
                        <span className={styles.keyLabel}>Açıklama</span>
                        <span className={styles.keyVal}>{selectedSupplier.notes || '—'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Finansal Durum */}
                  <div className={styles.sectionBlock}>
                    <div className={styles.sectionHeaderRow}>
                      <span className={styles.sectionTitle}>Finansal Durum</span>
                      <button
                        type="button"
                        className={styles.btnEditMini}
                        onClick={() => setDrawerTab('Alış Faturaları')}
                      >
                        Detay
                      </button>
                    </div>

                    <div className={styles.keyValueGrid}>
                      <div className={styles.keyValueRow}>
                        <span className={styles.keyLabel}>Toplam Alım</span>
                        <span className={styles.keyVal}>₺{(selectedSupplier.totalPurchases || 0).toLocaleString('tr-TR')}</span>
                      </div>
                      <div className={styles.keyValueRow}>
                        <span className={styles.keyLabel}>Toplam Ödeme</span>
                        <span className={styles.keyVal}>₺{(selectedSupplier.totalPaid || 0).toLocaleString('tr-TR')}</span>
                      </div>
                      <div className={styles.keyValueRow}>
                        <span className={styles.keyLabel} style={{ fontWeight: 700, color: '#0f172a' }}>Bakiye</span>
                        <span className={styles.keyVal} style={{ fontWeight: 700, color: selectedSupplier.balance > 0 ? '#dc2626' : '#16a34a' }}>
                          ₺{selectedSupplier.balance.toLocaleString('tr-TR')}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Hızlı İşlemler (2x2 Grid) */}
                  <div className={styles.sectionBlock}>
                    <span className={styles.sectionTitle}>Hızlı İşlemler</span>

                    <div className={styles.quickActionsGrid}>
                      <button
                        type="button"
                        className={styles.quickActionBtn}
                        onClick={() => setShowAddInvoiceModal(true)}
                      >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                          <polyline points="14 2 14 8 20 8"></polyline>
                          <line x1="12" y1="18" x2="12" y2="12"></line>
                          <line x1="9" y1="15" x2="15" y2="15"></line>
                        </svg>
                        Alış Faturası Ekle
                      </button>

                      <button
                        type="button"
                        className={styles.quickActionBtn}
                        onClick={() => setShowMakePaymentModal(true)}
                      >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="2" y="5" width="20" height="14" rx="2"></rect>
                          <line x1="2" y1="10" x2="22" y2="10"></line>
                        </svg>
                        Ödeme Kaydet
                      </button>

                      <button
                        type="button"
                        className={styles.quickActionBtn}
                        onClick={() => setShowEditSupplierModal(true)}
                      >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
                        </svg>
                        Tedarikçi Düzenle
                      </button>

                      <button
                        type="button"
                        className={styles.quickActionBtn}
                        onClick={() => handleToggleStatus(selectedSupplier)}
                      >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="12" cy="12" r="10"></circle>
                          <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line>
                        </svg>
                        {selectedSupplier.status === 'Aktif' ? 'Pasife Al' : 'Aktife Al'}
                      </button>
                    </div>
                  </div>
                </>
              )}

              {drawerTab === 'Alış Faturaları' && (
                <div className={styles.sectionBlock}>
                  <div className={styles.sectionHeaderRow}>
                    <span className={styles.sectionTitle}>Kayıtlı Alış Faturaları</span>
                    <button
                      type="button"
                      className={styles.btnEditMini}
                      onClick={() => setShowAddInvoiceModal(true)}
                    >
                      + Fatura Ekle
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 6 }}>
                    {(selectedSupplier.invoices && selectedSupplier.invoices.length > 0) ? (
                      selectedSupplier.invoices.map((inv, idx) => (
                        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 12px', background: '#f8fafc', borderRadius: 8, fontSize: 12 }}>
                          <div>
                            <div style={{ fontWeight: 600, color: '#0f172a' }}>{inv.invoiceNo}</div>
                            <div style={{ fontSize: 11, color: '#64748b' }}>{inv.date} • {inv.status}</div>
                          </div>
                          <div style={{ fontWeight: 700, color: '#0f766e' }}>
                            ₺{inv.amount.toLocaleString('tr-TR')}
                          </div>
                        </div>
                      ))
                    ) : (
                      <p style={{ color: '#64748b', fontSize: 12 }}>Henüz alış faturası kaydedilmedi.</p>
                    )}
                  </div>
                </div>
              )}

              {drawerTab === 'Ödeme Geçmişi' && (
                <div className={styles.sectionBlock}>
                  <div className={styles.sectionHeaderRow}>
                    <span className={styles.sectionTitle}>Tedarikçi Ödemeleri</span>
                    <button
                      type="button"
                      className={styles.btnEditMini}
                      onClick={() => setShowMakePaymentModal(true)}
                    >
                      + Ödeme Yap
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 6 }}>
                    {(selectedSupplier.payments && selectedSupplier.payments.length > 0) ? (
                      selectedSupplier.payments.map((p, idx) => (
                        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 12px', background: '#f8fafc', borderRadius: 8, fontSize: 12 }}>
                          <div>
                            <div style={{ fontWeight: 600, color: '#0f172a' }}>{p.method}</div>
                            <div style={{ fontSize: 11, color: '#64748b' }}>{p.date}</div>
                          </div>
                          <div style={{ fontWeight: 700, color: '#16a34a' }}>
                            -₺{p.amount.toLocaleString('tr-TR')}
                          </div>
                        </div>
                      ))
                    ) : (
                      <p style={{ color: '#64748b', fontSize: 12 }}>Henüz yapılmış ödeme bulunmuyor.</p>
                    )}
                  </div>
                </div>
              )}

              {drawerTab === 'Notlar' && (
                <div className={styles.sectionBlock}>
                  <span className={styles.sectionTitle}>Tedarikçi Özel Notları</span>
                  <div style={{ background: '#f8fafc', padding: 12, borderRadius: 8, fontSize: 13, color: '#334155', minHeight: 80 }}>
                    {selectedSupplier.notes || 'Bu tedarikçi için özel not bulunmamaktadır.'}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── MODAL 1: Yeni Tedarikçi Ekle ── */}
      {showNewSupplierModal && (
        <div className={styles.modalOverlay} onClick={() => setShowNewSupplierModal(false)}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>➕ Yeni Tedarikçi Ekle</h2>
              <button type="button" className={styles.modalCloseBtn} onClick={() => setShowNewSupplierModal(false)}>✕</button>
            </div>
            <form onSubmit={handleCreateSupplier}>
              <div className={styles.modalBody}>
                <div className={styles.formGrid2}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Firma Adı *</label>
                    <input
                      type="text"
                      required
                      placeholder="Örn: Starkey Türkiye"
                      className={styles.formInput}
                      value={newSupForm.companyName}
                      onChange={e => setNewSupForm({ ...newSupForm, companyName: e.target.value })}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Kategori</label>
                    <select
                      className={styles.formSelect}
                      value={newSupForm.category}
                      onChange={e => setNewSupForm({ ...newSupForm, category: e.target.value as SupplierItem['category'], subtitle: `${e.target.value} Tedarikçisi` })}
                    >
                      <option value="Cihaz">Cihaz</option>
                      <option value="Pil">Pil</option>
                      <option value="Aksesuar">Aksesuar</option>
                      <option value="Servis">Servis</option>
                      <option value="Diğer">Diğer</option>
                    </select>
                  </div>
                </div>

                <div className={styles.formGrid2}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Yetkili Kişi</label>
                    <input
                      type="text"
                      placeholder="Örn: Selin Demir"
                      className={styles.formInput}
                      value={newSupForm.contactPerson}
                      onChange={e => setNewSupForm({ ...newSupForm, contactPerson: e.target.value })}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Telefon</label>
                    <input
                      type="text"
                      placeholder="05XX XXX XX XX"
                      className={styles.formInput}
                      value={newSupForm.phone}
                      onChange={e => setNewSupForm({ ...newSupForm, phone: e.target.value })}
                    />
                  </div>
                </div>

                <div className={styles.formGrid2}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>E-posta</label>
                    <input
                      type="email"
                      placeholder="info@tedarikci.com"
                      className={styles.formInput}
                      value={newSupForm.email}
                      onChange={e => setNewSupForm({ ...newSupForm, email: e.target.value })}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Vergi Kimlik No</label>
                    <input
                      type="text"
                      placeholder="10 haneli VKN"
                      className={styles.formInput}
                      value={newSupForm.taxNo}
                      onChange={e => setNewSupForm({ ...newSupForm, taxNo: e.target.value })}
                    />
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Adres</label>
                  <input
                    type="text"
                    placeholder="Şirket merkez adresi..."
                    className={styles.formInput}
                    value={newSupForm.address}
                    onChange={e => setNewSupForm({ ...newSupForm, address: e.target.value })}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Notlar & Sözleşme Detayları</label>
                  <textarea
                    rows={2}
                    placeholder="Vade, indirim ve bayi koşulları..."
                    className={styles.formTextarea}
                    value={newSupForm.notes}
                    onChange={e => setNewSupForm({ ...newSupForm, notes: e.target.value })}
                  />
                </div>
              </div>
              <div className={styles.modalFooter}>
                <button type="button" className={styles.btnSecondaryAction} onClick={() => setShowNewSupplierModal(false)}>İptal</button>
                <button type="submit" className={styles.btnPrimaryAction}>Tedarikçiyi Kaydet</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL 2: Tedarikçi Düzenle ── */}
      {showEditSupplierModal && selectedSupplier && (
        <div className={styles.modalOverlay} onClick={() => setShowEditSupplierModal(false)}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>✏️ Tedarikçi Bilgilerini Düzenle</h2>
              <button type="button" className={styles.modalCloseBtn} onClick={() => setShowEditSupplierModal(false)}>✕</button>
            </div>
            <form onSubmit={async e => {
              e.preventDefault();
              const source = suppliersList.find(item => item.id === selectedSupplier.id);
              if (!source) return;
              try {
                await updateSupplier({ ...source, companyName: selectedSupplier.companyName, contactPerson: selectedSupplier.contactPerson, phone: selectedSupplier.phone, email: selectedSupplier.email, address: selectedSupplier.address, taxNo: selectedSupplier.taxNo });
                setShowEditSupplierModal(false);
                addToast({ type: 'success', message: 'Tedarikçi bilgileri güncellendi.' });
              } catch (error) { addToast({ type: 'error', message: error instanceof Error ? error.message : 'Tedarikçi güncellenemedi.' }); }
            }}>
              <div className={styles.modalBody}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Firma Adı</label>
                  <input
                    type="text"
                    className={styles.formInput}
                    defaultValue={selectedSupplier.companyName}
                    onChange={e => setSelectedSupplier({ ...selectedSupplier, companyName: e.target.value })}
                  />
                </div>

                <div className={styles.formGrid2}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Yetkili Kişi</label>
                    <input
                      type="text"
                      className={styles.formInput}
                      defaultValue={selectedSupplier.contactPerson}
                      onChange={e => setSelectedSupplier({ ...selectedSupplier, contactPerson: e.target.value })}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Telefon</label>
                    <input
                      type="text"
                      className={styles.formInput}
                      defaultValue={selectedSupplier.phone}
                      onChange={e => setSelectedSupplier({ ...selectedSupplier, phone: e.target.value })}
                    />
                  </div>
                </div>

                <div className={styles.formGrid2}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>E-posta</label>
                    <input
                      type="email"
                      className={styles.formInput}
                      defaultValue={selectedSupplier.email}
                      onChange={e => setSelectedSupplier({ ...selectedSupplier, email: e.target.value })}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Vergi No</label>
                    <input
                      type="text"
                      className={styles.formInput}
                      defaultValue={selectedSupplier.taxNo}
                      onChange={e => setSelectedSupplier({ ...selectedSupplier, taxNo: e.target.value })}
                    />
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Adres</label>
                  <input
                    type="text"
                    className={styles.formInput}
                    defaultValue={selectedSupplier.address}
                    onChange={e => setSelectedSupplier({ ...selectedSupplier, address: e.target.value })}
                  />
                </div>
              </div>
              <div className={styles.modalFooter}>
                <button type="button" className={styles.btnSecondaryAction} onClick={() => setShowEditSupplierModal(false)}>İptal</button>
                <button type="submit" className={styles.btnPrimaryAction}>Güncelle</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL 3: Alış Faturası Ekle ── */}
      {showAddInvoiceModal && selectedSupplier && (
        <div className={styles.modalOverlay} onClick={() => setShowAddInvoiceModal(false)}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>📄 Alış Faturası Girişi — {selectedSupplier.companyName}</h2>
              <button type="button" className={styles.modalCloseBtn} onClick={() => setShowAddInvoiceModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSaveInvoice}>
              <div className={styles.modalBody}>
                <div className={styles.formGrid2}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Fatura No</label>
                    <input
                      type="text"
                      placeholder="Örn: OTC-2026-095"
                      className={styles.formInput}
                      value={invoiceForm.invoiceNo}
                      onChange={e => setInvoiceForm({ ...invoiceForm, invoiceNo: e.target.value })}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Fatura Tarihi</label>
                    <input
                      type="text"
                      className={styles.formInput}
                      value={invoiceForm.date}
                      onChange={e => setInvoiceForm({ ...invoiceForm, date: e.target.value })}
                    />
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Fatura Toplam Tutarı (TL) *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    className={styles.formInput}
                    value={invoiceForm.amount}
                    onChange={e => setInvoiceForm({ ...invoiceForm, amount: Number(e.target.value) })}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Açıklama / Kalem Özeti</label>
                  <textarea
                    rows={2}
                    placeholder="Örn: 5 adet Oticon More 1 ve sarf malzemeleri alımı"
                    className={styles.formTextarea}
                    value={invoiceForm.description}
                    onChange={e => setInvoiceForm({ ...invoiceForm, description: e.target.value })}
                  />
                </div>
              </div>
              <div className={styles.modalFooter}>
                <button type="button" className={styles.btnSecondaryAction} onClick={() => setShowAddInvoiceModal(false)}>İptal</button>
                <button type="submit" className={styles.btnPrimaryAction}>Faturayı Kaydet</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL 4: Ödeme Kaydet ── */}
      {showMakePaymentModal && selectedSupplier && (
        <div className={styles.modalOverlay} onClick={() => setShowMakePaymentModal(false)}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>💳 Tedarikçiye Ödeme Kaydet — {selectedSupplier.companyName}</h2>
              <button type="button" className={styles.modalCloseBtn} onClick={() => setShowMakePaymentModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSavePayment}>
              <div className={styles.modalBody}>
                <div style={{ background: '#f8fafc', padding: 12, borderRadius: 8, fontSize: 13, marginBottom: 8 }}>
                  Mevcut Borç Bakiyesi: <strong style={{ color: '#dc2626' }}>₺{selectedSupplier.balance.toLocaleString('tr-TR')}</strong>
                </div>

                <div className={styles.formGrid2}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Ödeme Tutarı (TL) *</label>
                    <input
                      type="number"
                      min="1"
                      required
                      className={styles.formInput}
                      value={paymentForm.amount}
                      onChange={e => setPaymentForm({ ...paymentForm, amount: Number(e.target.value) })}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Ödeme Yöntemi</label>
                    <select
                      className={styles.formSelect}
                      value={paymentForm.method}
                      onChange={e => setPaymentForm({ ...paymentForm, method: e.target.value })}
                    >
                      <option value="Banka Transferi">Banka Transferi / EFT</option>
                      <option value="Havale">Havale</option>
                      <option value="Kredi Kartı">Kredi Kartı</option>
                      <option value="Nakit">Nakit</option>
                      <option value="Çek">Çek</option>
                    </select>
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>İşlem Tarihi</label>
                  <input
                    type="text"
                    className={styles.formInput}
                    value={paymentForm.date}
                    onChange={e => setPaymentForm({ ...paymentForm, date: e.target.value })}
                  />
                </div>
              </div>
              <div className={styles.modalFooter}>
                <button type="button" className={styles.btnSecondaryAction} onClick={() => setShowMakePaymentModal(false)}>İptal</button>
                <button type="submit" className={styles.btnPrimaryAction}>Ödemeyi Kaydet</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL 5: Tedarikçi Raporu ── */}
      {showReportModal && (
        <div className={styles.modalOverlay} onClick={() => setShowReportModal(false)}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>📊 Tedarikçi ve Alış Raporu</h2>
              <button type="button" className={styles.modalCloseBtn} onClick={() => setShowReportModal(false)}>✕</button>
            </div>
            <div className={styles.modalBody}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
                <div style={{ background: '#f8fafc', padding: 14, borderRadius: 10 }}>
                  <div style={{ fontSize: 12, color: '#64748b' }}>Toplam Tedarikçi</div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: '#0f172a' }}>{suppliers.length} Firma</div>
                </div>
                <div style={{ background: '#fef2f2', padding: 14, borderRadius: 10 }}>
                  <div style={{ fontSize: 12, color: '#dc2626' }}>Toplam Borç Bakiye</div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: '#dc2626' }}>{formatCurrency(supplierTotals.balanceOwed)}</div>
                </div>
                <div style={{ background: '#ecfdf5', padding: 14, borderRadius: 10 }}>
                  <div style={{ fontSize: 12, color: '#16a34a' }}>Bu Ay Alım Hacmi</div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: '#16a34a' }}>{formatCurrency(supplierTotals.purchasesThisMonth)}</div>
                </div>
                <div style={{ background: '#f5f3ff', padding: 14, borderRadius: 10 }}>
                  <div style={{ fontSize: 12, color: '#7e22ce' }}>Aktif Dağıtım Oranı</div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: '#7e22ce' }}>{suppliers.length ? Math.round(suppliers.filter(s => s.status === 'Aktif').length / suppliers.length * 100) : 0}%</div>
                </div>
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button type="button" className={styles.btnSecondaryAction} onClick={() => setShowReportModal(false)}>Kapat</button>
              <button
                type="button"
                className={styles.btnPrimaryAction}
                onClick={() => {
                  addToast({ type: 'error', message: 'PDF dışa aktarma henüz bağlı değil; rapor dosyası oluşturulmadı.' });
                }}
              >
                Raporu İndir (PDF)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL 6: Dış Firma Grupları ── */}
      {showGroupsModal && (
        <div className={styles.modalOverlay} onClick={() => setShowGroupsModal(false)}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>📁 Dış Firma Grupları</h2>
              <button type="button" className={styles.modalCloseBtn} onClick={() => setShowGroupsModal(false)}>✕</button>
            </div>
            <div className={styles.modalBody}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {Array.from(new Set(suppliers.map(supplier => supplier.category))).map((category, i) => {
                  const groupCount = suppliers.filter(supplier => supplier.category === category).length;
                  const color = ['#0284c7', '#ea580c', '#7e22ce', '#e11d48', '#475569'][i % 5];
                  return (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: '#f8fafc', borderRadius: 8, fontSize: 13 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: color }}></span>
                      <strong>{category}</strong>
                    </div>
                    <span style={{ color: '#64748b' }}>{groupCount} Tedarikçi</span>
                  </div>
                  );
                })}
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button type="button" className={styles.btnSecondaryAction} onClick={() => setShowGroupsModal(false)}>Kapat</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
