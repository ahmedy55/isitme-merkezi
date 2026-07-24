'use client';

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Supplier, SupplierPurchase } from '../data/mockData';
import { IconSearch, IconPlus, IconEdit, IconDelete, IconFilter, IconCheck, IconWarning, IconDownload } from '../components/Icons';

export default function SuppliersPage() {
  const { suppliersList, addSupplier, updateSupplier, deleteSupplier, addToast } = useApp();

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<string>('All');

  // Modal states
  const [showModal, setShowModal] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editingSupplierId, setEditingSupplierId] = useState<string | null>(null);

  // Purchase Modal states
  const [showPurchasesModal, setShowPurchasesModal] = useState<boolean>(false);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [showNewPurchaseForm, setShowNewPurchaseForm] = useState<boolean>(false);

  // Form State
  const [addModalTab, setAddModalTab] = useState<'elle' | 'uts'>('elle');
  const [formCompanyName, setFormCompanyName] = useState('');
  const [formContactPerson, setFormContactPerson] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formAddress, setFormAddress] = useState('');
  const [formTaxNo, setFormTaxNo] = useState('');
  const [formVergiDairesi, setFormVergiDairesi] = useState('');
  const [formCategory, setFormCategory] = useState<'İşitme Cihazı' | 'Pil & Aksesuar' | 'Kalıp Malzemesi' | 'Teknik Servis' | 'Diğer'>('İşitme Cihazı');
  const [formStatus, setFormStatus] = useState<'Aktif' | 'Pasif'>('Aktif');
  const [formBalance, setFormBalance] = useState<number>(0);
  const [formNotes, setFormNotes] = useState('');

  // UTS Bilgileri & Bayilik Bilgileri States
  const [formUtsKurumNo, setFormUtsKurumNo] = useState('');
  const [formMersisNo, setFormMersisNo] = useState('');
  const [formGln, setFormGln] = useState('');
  const [formBayilikBasvuruDate, setFormBayilikBasvuruDate] = useState('');
  const [formBayilikKararDate, setFormBayilikKararDate] = useState('');
  const [formBayilikBaslangicDate, setFormBayilikBaslangicDate] = useState('');
  const [formBayilikBitisDate, setFormBayilikBitisDate] = useState('');
  const [formBayilikDurum, setFormBayilikDurum] = useState('');
  const [formBayilikIller, setFormBayilikIller] = useState('');
  const [formIthalatYetkisi, setFormIthalatYetkisi] = useState(false);

  // UTS Search State (in UTS tab)
  const [utsSearchMersis, setUtsSearchMersis] = useState('');
  const [utsSearchVergiNo, setUtsSearchVergiNo] = useState('');
  const [utsSearchTitle, setUtsSearchTitle] = useState('');

  // Purchase Form State
  const [purInvoiceNo, setPurInvoiceNo] = useState('');
  const [purDate, setPurDate] = useState('');
  const [purTotal, setPurTotal] = useState<number>(0);
  const [purPaymentStatus, setPurPaymentStatus] = useState<'Ödendi' | 'Bekliyor' | 'Kısmi Ödendi'>('Bekliyor');
  const [purPaymentMethod, setPurPaymentMethod] = useState<'Nakit' | 'Havale' | 'Çek' | 'Açık Hesap'>('Havale');

  // Form validation errors
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const handleOpenAddModal = () => {
    setIsEditing(false);
    setEditingSupplierId(null);
    setAddModalTab('elle');
    setFormCompanyName('');
    setFormContactPerson('');
    setFormPhone('');
    setFormEmail('');
    setFormAddress('');
    setFormTaxNo('');
    setFormVergiDairesi('');
    setFormCategory('İşitme Cihazı');
    setFormStatus('Aktif');
    setFormBalance(0);
    setFormNotes('');

    setFormUtsKurumNo('');
    setFormMersisNo('');
    setFormGln('');
    setFormBayilikBasvuruDate('');
    setFormBayilikKararDate('');
    setFormBayilikBaslangicDate('');
    setFormBayilikBitisDate('');
    setFormBayilikDurum('');
    setFormBayilikIller('');
    setFormIthalatYetkisi(false);

    setUtsSearchMersis('');
    setUtsSearchVergiNo('');
    setUtsSearchTitle('');

    setErrors({});
    setShowModal(true);
  };

  const handleOpenEditModal = (supplier: Supplier) => {
    setIsEditing(true);
    setEditingSupplierId(supplier.id);
    setFormCompanyName(supplier.companyName);
    setFormContactPerson(supplier.contactPerson);
    setFormPhone(supplier.phone);
    setFormEmail(supplier.email);
    setFormAddress(supplier.address);
    setFormTaxNo(supplier.taxNo);
    setFormVergiDairesi((supplier as any).vergiDairesi || '');
    setFormCategory(supplier.category as any);
    setFormStatus(supplier.status);
    setFormBalance(supplier.balance);
    setFormNotes(supplier.notes || '');

    setFormUtsKurumNo((supplier as any).utsKurumNo || '');
    setFormMersisNo((supplier as any).mersisNo || '');
    setFormGln((supplier as any).gln || '');
    setFormBayilikBasvuruDate((supplier as any).bayilikBasvuruDate || '');
    setFormBayilikKararDate((supplier as any).bayilikKararDate || '');
    setFormBayilikBaslangicDate((supplier as any).bayilikBaslangicDate || '');
    setFormBayilikBitisDate((supplier as any).bayilikBitisDate || '');
    setFormBayilikDurum((supplier as any).bayilikDurum || '');
    setFormBayilikIller((supplier as any).bayilikIller || '');
    setFormIthalatYetkisi((supplier as any).ithalatYetkisi || false);

    setErrors({});
    setShowModal(true);
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    if (!formCompanyName.trim()) newErrors.companyName = 'Firma adı zorunludur';
    if (!formContactPerson.trim()) newErrors.contactPerson = 'Yetkili kişi zorunludur';
    if (!formPhone.trim()) newErrors.phone = 'Telefon zorunludur';
    if (!formTaxNo.trim()) newErrors.taxNo = 'Vergi No zorunludur';
    
    if (formEmail.trim() && !/\S+@\S+\.\S+/.test(formEmail)) {
      newErrors.email = 'Geçersiz e-posta formatı';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    if (isEditing && editingSupplierId) {
      const orig = suppliersList.find(s => s.id === editingSupplierId);
      const updated: Supplier = {
        id: editingSupplierId,
        companyName: formCompanyName,
        contactPerson: formContactPerson,
        phone: formPhone,
        email: formEmail,
        address: formAddress,
        taxNo: formTaxNo,
        category: formCategory,
        status: formStatus,
        balance: formBalance,
        notes: formNotes,
        createdAt: orig?.createdAt || new Date().toISOString().split('T')[0],
        purchases: orig?.purchases || []
      };
      updateSupplier(updated);
      addToast({ type: 'success', message: 'Tedarikçi başarıyla güncellendi.' });
    } else {
      const newSupplier: Supplier = {
        id: 'sup-' + Math.floor(Math.random() * 1000000),
        companyName: formCompanyName,
        contactPerson: formContactPerson,
        phone: formPhone,
        email: formEmail,
        address: formAddress,
        taxNo: formTaxNo,
        category: formCategory,
        status: formStatus,
        balance: formBalance,
        notes: formNotes,
        createdAt: new Date().toISOString().split('T')[0],
        purchases: []
      };
      addSupplier(newSupplier);
      addToast({ type: 'success', message: 'Tedarikçi başarıyla oluşturuldu.' });
    }
    setShowModal(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('Bu tedarikçiyi silmek istediğinize emin misiniz?')) {
      deleteSupplier(id);
      addToast({ type: 'warning', message: 'Tedarikçi kaydı silindi.' });
    }
  };

  const handleOpenPurchases = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setShowNewPurchaseForm(false);
    setPurInvoiceNo('');
    setPurDate(new Date().toISOString().split('T')[0]);
    setPurTotal(0);
    setPurPaymentStatus('Bekliyor');
    setPurPaymentMethod('Havale');
    setShowPurchasesModal(true);
  };

  const handleSavePurchase = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSupplier) return;
    if (!purInvoiceNo.trim()) {
      alert('Fatura No zorunludur');
      return;
    }
    if (purTotal <= 0) {
      alert('Tutar 0-dan büyük olmalıdır');
      return;
    }

    const newPurchase: SupplierPurchase = {
      id: 'pur-' + Math.floor(Math.random() * 1000000),
      supplierId: selectedSupplier.id,
      date: purDate,
      invoiceNo: purInvoiceNo,
      items: [{ name: 'Fatura Girişi', quantity: 1, unitPrice: purTotal }],
      total: purTotal,
      paymentStatus: purPaymentStatus,
      paymentMethod: purPaymentMethod
    };

    // Calculate new balance
    // If not paid, our debt increases (balance goes down/negative)
    let balanceChange = 0;
    if (purPaymentStatus === 'Bekliyor') {
      balanceChange = -purTotal;
    } else if (purPaymentStatus === 'Kısmi Ödendi') {
      balanceChange = -(purTotal / 2); // Simüle yarısı
    }

    const updatedSupplier: Supplier = {
      ...selectedSupplier,
      balance: selectedSupplier.balance + balanceChange,
      purchases: [newPurchase, ...selectedSupplier.purchases]
    };

    updateSupplier(updatedSupplier);
    setSelectedSupplier(updatedSupplier); // Refresh view
    setShowNewPurchaseForm(false);
    addToast({ type: 'success', message: 'Fatura/Alış kaydı başarıyla eklendi.' });
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(val);
  };

  // Filters logic
  const filteredSuppliers = suppliersList.filter(s => {
    const matchesSearch = 
      (s.companyName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.contactPerson || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.phone || '').includes(searchTerm);

    const matchesCategory = categoryFilter === 'All' || s.category === categoryFilter;
    const matchesStatus = statusFilter === 'All' || s.status === statusFilter;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  return (
    <div className="page">
      <div className="page-header">
        <div className="page-header-left">
          <h2>Tedarikçi & Dış Firmalar</h2>
          <p>Cihaz, pil ve aksesuar tedarikçileri, alış faturaları ve bakiye durumları</p>
        </div>
        <button className="btn btn-primary" onClick={handleOpenAddModal} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <IconPlus size={16} strokeWidth={2} /> Yeni Tedarikçi Ekle
        </button>
      </div>

      {/* Summary Stats Row */}
      <div className="stats-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16, marginBottom: 20 }}>
        <div className="card stat-card">
          <div className="card-body" style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px 20px' }}>
            <div style={{ padding: 10, borderRadius: 'var(--radius-md)', background: 'var(--primary-50)', color: 'var(--primary-600)' }}>
              <IconPlus size={24} />
            </div>
            <div>
              <div style={{ fontSize: '0.84rem', color: 'var(--gray-500)', fontWeight: 500 }}>Toplam Tedarikçi</div>
              <div style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--gray-800)', lineHeight: 1.2 }}>{suppliersList.length}</div>
            </div>
          </div>
        </div>
        <div className="card stat-card">
          <div className="card-body" style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px 20px' }}>
            <div style={{ padding: 10, borderRadius: 'var(--radius-md)', background: 'var(--danger-50)', color: 'var(--danger-600)' }}>
              <IconWarning size={24} />
            </div>
            <div>
              <div style={{ fontSize: '0.84rem', color: 'var(--gray-500)', fontWeight: 500 }}>Toplam Borcumuz</div>
              <div style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--danger-600)', lineHeight: 1.2 }}>
                {formatCurrency(Math.abs(suppliersList.reduce((acc, curr) => (curr.balance || 0) < 0 ? acc + (curr.balance || 0) : acc, 0)))}
              </div>
            </div>
          </div>
        </div>
        <div className="card stat-card">
          <div className="card-body" style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px 20px' }}>
            <div style={{ padding: 10, borderRadius: 'var(--radius-md)', background: 'var(--success-50)', color: 'var(--success-600)' }}>
              <IconCheck size={24} />
            </div>
            <div>
              <div style={{ fontSize: '0.84rem', color: 'var(--gray-500)', fontWeight: 500 }}>Aktif Firmalar</div>
              <div style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--success-600)', lineHeight: 1.2 }}>
                {suppliersList.filter(s => s.status === 'Aktif').length} adet
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Options */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-body" style={{ padding: 16 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
            <div style={{ flex: 1, minWidth: 240, position: 'relative' }}>
              <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-400)' }}>
                <IconSearch size={18} />
              </span>
              <input
                className="form-input"
                placeholder="Firma adı veya yetkili ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ paddingLeft: 38, width: '100%', margin: 0 }}
              />
            </div>

            <div style={{ minWidth: 160 }}>
              <select className="form-input" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} style={{ margin: 0 }}>
                <option value="All">Tüm Kategoriler</option>
                <option value="İşitme Cihazı">İşitme Cihazı</option>
                <option value="Pil & Aksesuar">Pil & Aksesuar</option>
                <option value="Kalıp Malzemesi">Kalıp Malzemesi</option>
                <option value="Teknik Servis">Teknik Servis</option>
                <option value="Diğer">Diğer</option>
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
      </div>

      {/* Suppliers Table */}
      <div className="card">
        <div className="card-body" style={{ padding: 0, overflowX: 'auto' }}>
          <table className="table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: 'var(--gray-50)', borderBottom: '1px solid var(--surface-border)' }}>
                <th style={{ padding: '12px 16px', fontWeight: 600, fontSize: '0.84rem', color: 'var(--gray-600)' }}>Firma Adı</th>
                <th style={{ padding: '12px 16px', fontWeight: 600, fontSize: '0.84rem', color: 'var(--gray-600)' }}>Kategori</th>
                <th style={{ padding: '12px 16px', fontWeight: 600, fontSize: '0.84rem', color: 'var(--gray-600)' }}>Yetkili & İletişim</th>
                <th style={{ padding: '12px 16px', fontWeight: 600, fontSize: '0.84rem', color: 'var(--gray-600)' }}>Vergi No</th>
                <th style={{ padding: '12px 16px', fontWeight: 600, fontSize: '0.84rem', color: 'var(--gray-600)' }}>Bakiye</th>
                <th style={{ padding: '12px 16px', fontWeight: 600, fontSize: '0.84rem', color: 'var(--gray-600)' }}>Durum</th>
                <th style={{ padding: '12px 16px', fontWeight: 600, fontSize: '0.84rem', color: 'var(--gray-600)', textAlign: 'right' }}>İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {filteredSuppliers.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: 40, textAlign: 'center', color: 'var(--gray-400)' }}>
                    Aranan kriterlere uygun tedarikçi firması bulunamadı.
                  </td>
                </tr>
              ) : (
                filteredSuppliers.map((sup) => (
                  <tr key={sup.id} style={{ borderBottom: '1px solid var(--surface-border-light)' }}>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ fontWeight: 600, color: 'var(--gray-800)' }}>{sup.companyName}</div>
                      {sup.notes && <div style={{ fontSize: '0.78rem', color: 'var(--gray-400)', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{sup.notes}</div>}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span className="badge" style={{
                        background: 'var(--primary-50)',
                        color: 'var(--primary-700)',
                        padding: '4px 8px',
                        borderRadius: 4,
                        fontSize: '0.8rem',
                        fontWeight: 600
                      }}>
                        {sup.category}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ fontSize: '0.86rem', fontWeight: 500, color: 'var(--gray-700)' }}>{sup.contactPerson}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--gray-400)' }}>{sup.phone} · {sup.email}</div>
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: '0.86rem', color: 'var(--gray-600)' }}>
                      {sup.taxNo}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{
                        fontWeight: 600,
                        color: sup.balance < 0 ? 'var(--danger-600)' : sup.balance > 0 ? 'var(--success-600)' : 'var(--gray-600)'
                      }}>
                        {sup.balance === 0 ? 'Dengede' : formatCurrency(sup.balance)}
                      </span>
                      {sup.balance < 0 && <div style={{ fontSize: '0.74rem', color: 'var(--danger-500)' }}>Borcumuz Var</div>}
                      {sup.balance > 0 && <div style={{ fontSize: '0.74rem', color: 'var(--success-500)' }}>Alacağımız Var</div>}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{
                        background: sup.status === 'Aktif' ? 'var(--success-50)' : 'var(--gray-100)',
                        color: sup.status === 'Aktif' ? 'var(--success-600)' : 'var(--gray-500)',
                        padding: '4px 8px',
                        borderRadius: 4,
                        fontSize: '0.8rem',
                        fontWeight: 600
                      }}>
                        {sup.status}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6 }}>
                        <button
                          className="btn btn-secondary"
                          onClick={() => handleOpenPurchases(sup)}
                          style={{ padding: '4px 8px', fontSize: '0.8rem' }}
                        >
                          Faturalar ({sup.purchases.length})
                        </button>
                        <button
                          className="btn-icon"
                          onClick={() => handleOpenEditModal(sup)}
                          style={{ color: 'var(--primary-500)', padding: 6 }}
                          title="Tedarikçiyi Düzenle"
                        >
                          <IconEdit size={16} />
                        </button>
                        <button
                          className="btn-icon"
                          onClick={() => handleDelete(sup.id)}
                          style={{ color: 'var(--danger-500)', padding: 6 }}
                          title="Tedarikçiyi Sil"
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

      {/* Add / Edit Tedarikçi Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 680, width: '95%', maxHeight: '92vh', display: 'flex', flexDirection: 'column', borderRadius: 12 }}>
            <div className="modal-header" style={{ padding: '16px 24px', borderBottom: '1px solid var(--gray-200)' }}>
              <span className="modal-title" style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--gray-900)' }}>
                {isEditing ? 'Tedarikçi Bilgilerini Düzenle' : 'Yeni Tedarikçi'}
              </span>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>

            {/* Sub-Header Tabs: Elle Ekle / ÜTS'den Ekle */}
            {!isEditing && (
              <div style={{ padding: '12px 24px 0', background: '#fafafa', borderBottom: '1px solid var(--gray-200)' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, background: '#f1f5f9', padding: 4, borderRadius: 8 }}>
                  <button
                    type="button"
                    onClick={() => setAddModalTab('elle')}
                    style={{
                      padding: '8px 16px',
                      borderRadius: 6,
                      border: 'none',
                      background: addModalTab === 'elle' ? '#fff' : 'transparent',
                      fontWeight: 600,
                      fontSize: '0.86rem',
                      color: addModalTab === 'elle' ? 'var(--gray-900)' : 'var(--gray-600)',
                      boxShadow: addModalTab === 'elle' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6
                    }}
                  >
                    Elle Ekle
                  </button>
                  <button
                    type="button"
                    onClick={() => setAddModalTab('uts')}
                    style={{
                      padding: '8px 16px',
                      borderRadius: 6,
                      border: 'none',
                      background: addModalTab === 'uts' ? '#fff' : 'transparent',
                      fontWeight: 600,
                      fontSize: '0.86rem',
                      color: addModalTab === 'uts' ? '#0284c7' : 'var(--gray-600)',
                      boxShadow: addModalTab === 'uts' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6
                    }}
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                    </svg>
                    ÜTS'den Ekle
                  </button>
                </div>
              </div>
            )}

            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
              <div className="modal-body" style={{ overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
                
                {/* ÜTS Firma Sorgu Box (Only in ÜTS tab) */}
                {addModalTab === 'uts' && !isEditing && (
                  <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: 14 }}>
                    <div style={{ fontWeight: 700, fontSize: '0.86rem', color: 'var(--gray-900)', marginBottom: 10 }}>
                      UTS Firma Sorgu
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 8, marginBottom: 8 }}>
                      <input
                        className="form-input"
                        placeholder="MERSİS No"
                        value={utsSearchMersis}
                        onChange={(e) => setUtsSearchMersis(e.target.value)}
                      />
                      <input
                        className="form-input"
                        placeholder="Vergi No"
                        value={utsSearchVergiNo}
                        onChange={(e) => setUtsSearchVergiNo(e.target.value)}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          addToast({ type: 'info', message: 'ÜTS veritabanında firma sorgulaması yapılıyor...' });
                        }}
                        style={{
                          background: '#0284c7',
                          color: '#fff',
                          border: 'none',
                          borderRadius: 6,
                          padding: '0 16px',
                          fontWeight: 600,
                          fontSize: '0.85rem',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6
                        }}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="11" cy="11" r="8" />
                          <line x1="21" y1="21" x2="16.65" y2="16.65" />
                        </svg>
                        Sorgula
                      </button>
                    </div>
                    <input
                      className="form-input"
                      placeholder="Ünvan (opsiyonel daraltma)"
                      value={utsSearchTitle}
                      onChange={(e) => setUtsSearchTitle(e.target.value)}
                    />
                  </div>
                )}

                {/* 1. Firma Adı */}
                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 600 }}>
                    <span style={{ color: '#ef4444', marginRight: 2 }}>*</span> Firma Adı
                  </label>
                  <input
                    className="form-input"
                    placeholder="Firma Adı"
                    value={formCompanyName}
                    onChange={(e) => setFormCompanyName(e.target.value)}
                  />
                  {errors.companyName && <span style={{ fontSize: '0.78rem', color: '#ef4444' }}>{errors.companyName}</span>}
                </div>

                {/* 2. Yetkili Kişi */}
                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 600 }}>
                    <span style={{ color: '#ef4444', marginRight: 2 }}>*</span> Yetkili Kişi
                  </label>
                  <input
                    className="form-input"
                    placeholder="Yetkili Kişi"
                    value={formContactPerson}
                    onChange={(e) => setFormContactPerson(e.target.value)}
                  />
                  {errors.contactPerson && <span style={{ fontSize: '0.78rem', color: '#ef4444' }}>{errors.contactPerson}</span>}
                </div>

                {/* 3. Telefon & Email */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div className="form-group">
                    <label className="form-label" style={{ fontWeight: 600 }}>
                      <span style={{ color: '#ef4444', marginRight: 2 }}>*</span> Telefon
                    </label>
                    <input
                      className="form-input"
                      placeholder="05XX XXX XX XX"
                      value={formPhone}
                      onChange={(e) => setFormPhone(e.target.value)}
                    />
                    {errors.phone && <span style={{ fontSize: '0.78rem', color: '#ef4444' }}>{errors.phone}</span>}
                  </div>
                  <div className="form-group">
                    <label className="form-label" style={{ fontWeight: 600 }}>Email</label>
                    <input
                      type="email"
                      className="form-input"
                      placeholder="Email"
                      value={formEmail}
                      onChange={(e) => setFormEmail(e.target.value)}
                    />
                    {errors.email && <span style={{ fontSize: '0.78rem', color: '#ef4444' }}>{errors.email}</span>}
                  </div>
                </div>

                {/* 4. Adres */}
                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 600 }}>
                    <span style={{ color: '#ef4444', marginRight: 2 }}>*</span> Adres
                  </label>
                  <textarea
                    className="form-input"
                    rows={2}
                    placeholder="Adres"
                    value={formAddress}
                    onChange={(e) => setFormAddress(e.target.value)}
                    style={{ resize: 'vertical' }}
                  />
                </div>

                {/* 5. Vergi Numarası & Vergi Dairesi */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div className="form-group">
                    <label className="form-label" style={{ fontWeight: 600 }}>Vergi Numarası</label>
                    <input
                      className="form-input"
                      placeholder="Vergi Numarası"
                      value={formTaxNo}
                      onChange={(e) => setFormTaxNo(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label" style={{ fontWeight: 600 }}>Vergi Dairesi</label>
                    <input
                      className="form-input"
                      placeholder="Vergi Dairesi"
                      value={formVergiDairesi}
                      onChange={(e) => setFormVergiDairesi(e.target.value)}
                    />
                  </div>
                </div>

                {/* 6. Kategori */}
                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                    Kategori <span style={{ fontSize: '0.75rem', color: 'var(--gray-400)' }} title="Tedarikçinin hizmet alanı">ⓘ</span>
                  </label>
                  <select
                    className="form-select"
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as any)}
                  >
                    <option value="" disabled>Kategori seçin</option>
                    <option value="Cihaz Üreticisi">Cihaz Üreticisi</option>
                    <option value="İşitme Cihazı">İşitme Cihazı</option>
                    <option value="Pil & Aksesuar">Pil & Aksesuar</option>
                    <option value="Kalıp Malzemesi">Kalıp Malzemesi</option>
                    <option value="Teknik Servis">Teknik Servis</option>
                    <option value="Diğer">Diğer</option>
                  </select>
                </div>

                {/* Section 7: UTS Bilgileri Divider */}
                <div style={{ margin: '8px 0 4px', textAlign: 'center', position: 'relative' }}>
                  <hr style={{ border: 'none', borderTop: '1px dashed var(--gray-300)', margin: 0 }} />
                  <span style={{ position: 'relative', top: -10, background: '#fff', padding: '0 12px', fontSize: '0.82rem', fontWeight: 600, color: 'var(--gray-500)' }}>
                    UTS Bilgileri
                  </span>
                </div>

                {/* UTS Bilgileri 3 columns */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: '0.78rem', fontWeight: 600 }}>
                      UTS Kurum No (UIK) <span style={{ fontSize: '0.72rem', color: 'var(--gray-400)' }}>ⓘ</span>
                    </label>
                    <input
                      className="form-input"
                      placeholder="UTS Kurum Numarası"
                      value={formUtsKurumNo}
                      onChange={(e) => setFormUtsKurumNo(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: '0.78rem', fontWeight: 600 }}>MERSİS No</label>
                    <input
                      className="form-input"
                      placeholder="MERSİS Numarası"
                      value={formMersisNo}
                      onChange={(e) => setFormMersisNo(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: '0.78rem', fontWeight: 600 }}>
                      GLN <span style={{ fontSize: '0.72rem', color: 'var(--gray-400)' }}>ⓘ</span>
                    </label>
                    <input
                      className="form-input"
                      placeholder="GLN (13 haneli)"
                      value={formGln}
                      onChange={(e) => setFormGln(e.target.value)}
                    />
                  </div>
                </div>

                {/* Section 8: Bayilik Bilgileri Divider */}
                <div style={{ margin: '12px 0 4px', textAlign: 'center', position: 'relative' }}>
                  <hr style={{ border: 'none', borderTop: '1px dashed var(--gray-300)', margin: 0 }} />
                  <span style={{ position: 'relative', top: -10, background: '#fff', padding: '0 12px', fontSize: '0.82rem', fontWeight: 600, color: 'var(--gray-500)' }}>
                    Bayilik Bilgileri
                  </span>
                </div>

                {/* Blue Info Callout Box */}
                <div style={{
                  background: '#f0f9ff',
                  border: '1px solid #bae6fd',
                  borderRadius: 8,
                  padding: '12px 14px',
                  display: 'flex',
                  gap: 10,
                  alignItems: 'flex-start'
                }}>
                  <div style={{ width: 20, height: 20, borderRadius: '50%', background: '#0284c7', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700, flexShrink: 0, marginTop: 1 }}>i</div>
                  <div style={{ fontSize: '0.81rem', color: '#0369a1', lineHeight: 1.45 }}>
                    <div style={{ fontWeight: 700, marginBottom: 2, color: '#0c4a6e' }}>Bu bilgiler ÜTS'den otomatik alınamıyor</div>
                    ÜTS web servisi bayilik sorgulamayı desteklemiyor. Bilgileri <strong>ÜTS portalı ➔ Bayilik Bilgileri</strong> ekranından bakıp bir kez buraya girin; hasta belgelerindeki <strong>Bayilik Bilgisi</strong> ve <strong>Tıbbi Cihaz Durumu</strong> evrakları bu kayıttan doldurulur.
                  </div>
                </div>

                {/* Dates Row 1 */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div className="form-group">
                    <label className="form-label" style={{ fontWeight: 600, fontSize: '0.82rem' }}>Bayilik Başvuru Tarihi</label>
                    <input
                      type="date"
                      className="form-input"
                      value={formBayilikBasvuruDate}
                      onChange={(e) => setFormBayilikBasvuruDate(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label" style={{ fontWeight: 600, fontSize: '0.82rem' }}>Karar Tarihi</label>
                    <input
                      type="date"
                      className="form-input"
                      value={formBayilikKararDate}
                      onChange={(e) => setFormBayilikKararDate(e.target.value)}
                    />
                  </div>
                </div>

                {/* Dates Row 2 */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div className="form-group">
                    <label className="form-label" style={{ fontWeight: 600, fontSize: '0.82rem' }}>Bayilik Başlangıç Tarihi</label>
                    <input
                      type="date"
                      className="form-input"
                      value={formBayilikBaslangicDate}
                      onChange={(e) => setFormBayilikBaslangicDate(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label" style={{ fontWeight: 600, fontSize: '0.82rem' }}>
                      Planlanan Bitiş Tarihi <span style={{ color: 'var(--gray-400)' }}>ⓘ</span>
                    </label>
                    <input
                      type="date"
                      className="form-input"
                      value={formBayilikBitisDate}
                      onChange={(e) => setFormBayilikBitisDate(e.target.value)}
                    />
                  </div>
                </div>

                {/* Durum, İller & İthalat Bildirimi Yetkisi */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr 1fr', gap: 12, alignItems: 'center' }}>
                  <div className="form-group">
                    <label className="form-label" style={{ fontWeight: 600, fontSize: '0.82rem' }}>Durum</label>
                    <select
                      className="form-select"
                      value={formBayilikDurum}
                      onChange={(e) => setFormBayilikDurum(e.target.value)}
                    >
                      <option value="">Seçiniz</option>
                      <option value="Aktif">Aktif</option>
                      <option value="Pasif">Pasif</option>
                      <option value="Onay Bekliyor">Onay Bekliyor</option>
                      <option value="İptal">İptal</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label" style={{ fontWeight: 600, fontSize: '0.82rem' }}>
                      İller <span style={{ color: 'var(--gray-400)' }}>ⓘ</span>
                    </label>
                    <select
                      className="form-select"
                      value={formBayilikIller}
                      onChange={(e) => setFormBayilikIller(e.target.value)}
                    >
                      <option value="">Örn: İZMİR</option>
                      <option value="İZMİR">İZMİR</option>
                      <option value="İSTANBUL">İSTANBUL</option>
                      <option value="ANKARA">ANKARA</option>
                      <option value="BURSA">BURSA</option>
                      <option value="TÜM TÜRKİYE">TÜM TÜRKİYE</option>
                    </select>
                  </div>
                  <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <label className="form-label" style={{ fontWeight: 600, fontSize: '0.82rem', marginBottom: 0 }}>
                      İthalat Bildirimi Yetkisi
                    </label>
                    <div
                      onClick={() => setFormIthalatYetkisi(!formIthalatYetkisi)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        cursor: 'pointer'
                      }}
                    >
                      <div
                        style={{
                          width: 44,
                          height: 22,
                          borderRadius: 11,
                          background: formIthalatYetkisi ? '#0284c7' : '#cbd5e1',
                          position: 'relative',
                          transition: 'background 0.2s ease',
                          flexShrink: 0
                        }}
                      >
                        <div
                          style={{
                            width: 18,
                            height: 18,
                            borderRadius: '50%',
                            background: '#fff',
                            position: 'absolute',
                            top: 2,
                            left: formIthalatYetkisi ? 24 : 2,
                            transition: 'left 0.2s ease',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
                          }}
                        />
                      </div>
                      <span style={{ fontSize: '0.82rem', fontWeight: 600, color: formIthalatYetkisi ? '#0284c7' : 'var(--gray-500)' }}>
                        {formIthalatYetkisi ? 'Evet' : 'Hayır'}
                      </span>
                    </div>
                  </div>
                </div>

              </div>

              <div className="modal-footer" style={{ borderTop: '1px solid var(--gray-200)', padding: '12px 24px', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowModal(false)}
                  style={{ padding: '8px 20px', borderRadius: 6 }}
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ padding: '8px 24px', borderRadius: 6, background: '#0284c7', borderColor: '#0284c7' }}
                >
                  Tamam
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* purchases Modal */}
      {showPurchasesModal && selectedSupplier && (
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
          <div className="card" style={{ width: 650, maxWidth: '90%', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid var(--surface-border)', flexShrink: 0 }}>
              <div>
                <span className="card-title" style={{ fontSize: '1.2rem', fontWeight: 700 }}>
                  Fatura & Satın Almalar: {selectedSupplier.companyName}
                </span>
                <div style={{ fontSize: '0.8rem', color: 'var(--gray-500)', marginTop: 2 }}>Mevcut Bakiye: {formatCurrency(selectedSupplier.balance)}</div>
              </div>
              <button onClick={() => setShowPurchasesModal(false)} style={{ color: 'var(--gray-400)', fontSize: '1.4rem' }}>&times;</button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
              {!showNewPurchaseForm ? (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>Geçmiş Faturalar</h3>
                    <button className="btn btn-primary" onClick={() => setShowNewPurchaseForm(true)} style={{ padding: '6px 12px', fontSize: '0.84rem' }}>
                      <IconPlus size={14} /> Fatura / Alış Gir
                    </button>
                  </div>

                  {selectedSupplier.purchases.length === 0 ? (
                    <div style={{ padding: '30px 0', textAlign: 'center', color: 'var(--gray-400)' }}>
                      Kayıtlı alış faturası bulunmamaktadır.
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      {selectedSupplier.purchases.map((pur) => (
                        <div key={pur.id} style={{ border: '1px solid var(--surface-border-light)', borderRadius: 'var(--radius-md)', padding: 12, background: 'var(--gray-25)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                              <div style={{ fontWeight: 600, color: 'var(--gray-800)', fontSize: '0.9rem' }}>Fatura No: {pur.invoiceNo}</div>
                              <div style={{ fontSize: '0.78rem', color: 'var(--gray-400)' }}>Tarih: {pur.date} · Yöntem: {pur.paymentMethod}</div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              <div style={{ fontWeight: 700, color: 'var(--gray-900)' }}>{formatCurrency(pur.total)}</div>
                              <span className="badge" style={{
                                fontSize: '0.74rem',
                                padding: '2px 6px',
                                borderRadius: 4,
                                background: pur.paymentStatus === 'Ödendi' ? 'var(--success-50)' : pur.paymentStatus === 'Kısmi Ödendi' ? 'var(--warning-50)' : 'var(--danger-50)',
                                color: pur.paymentStatus === 'Ödendi' ? 'var(--success-600)' : pur.paymentStatus === 'Kısmi Ödendi' ? 'var(--warning-600)' : 'var(--danger-600)',
                              }}>{pur.paymentStatus}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <form onSubmit={handleSavePurchase}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 14 }}>Yeni Alış Faturası Ekle</h3>
                  
                  <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
                    <div className="form-group" style={{ flex: 1, margin: 0 }}>
                      <label className="form-label">Fatura Numarası</label>
                      <input
                        className="form-input"
                        placeholder="Örn: PH-2026-0001"
                        required
                        value={purInvoiceNo}
                        onChange={(e) => setPurInvoiceNo(e.target.value)}
                      />
                    </div>
                    <div className="form-group" style={{ flex: 1, margin: 0 }}>
                      <label className="form-label">Fatura Tarihi</label>
                      <input
                        type="date"
                        className="form-input"
                        required
                        value={purDate}
                        onChange={(e) => setPurDate(e.target.value)}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
                    <div className="form-group" style={{ flex: 1, margin: 0 }}>
                      <label className="form-label">Toplam Tutar (TL)</label>
                      <input
                        type="number"
                        className="form-input"
                        required
                        min={1}
                        value={purTotal}
                        onChange={(e) => setPurTotal(Number(e.target.value))}
                      />
                    </div>
                    <div className="form-group" style={{ flex: 1, margin: 0 }}>
                      <label className="form-label">Ödeme Yöntemi</label>
                      <select
                        className="form-input"
                        value={purPaymentMethod}
                        onChange={(e) => setPurPaymentMethod(e.target.value as any)}
                      >
                        <option value="Havale">Havale</option>
                        <option value="Nakit">Nakit</option>
                        <option value="Çek">Çek</option>
                        <option value="Açık Hesap">Açık Hesap</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-group" style={{ marginBottom: 16 }}>
                    <label className="form-label">Ödeme Durumu</label>
                    <select
                      className="form-input"
                      value={purPaymentStatus}
                      onChange={(e) => setPurPaymentStatus(e.target.value as any)}
                    >
                      <option value="Bekliyor">Bekliyor (Borca Yazılacak)</option>
                      <option value="Ödendi">Ödendi</option>
                      <option value="Kısmi Ödendi">Kısmi Ödendi</option>
                    </select>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                    <button type="button" className="btn btn-secondary" onClick={() => setShowNewPurchaseForm(false)}>İptal</button>
                    <button type="submit" className="btn btn-primary">Faturayı Kaydet</button>
                  </div>
                </form>
              )}
            </div>

            <div className="card-footer" style={{ padding: '12px 20px', borderTop: '1px solid var(--surface-border)', display: 'flex', justifyContent: 'flex-end', flexShrink: 0 }}>
              <button className="btn btn-secondary" onClick={() => setShowPurchasesModal(false)}>Kapat</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
