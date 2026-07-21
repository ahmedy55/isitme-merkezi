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
  const [formCompanyName, setFormCompanyName] = useState('');
  const [formContactPerson, setFormContactPerson] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formAddress, setFormAddress] = useState('');
  const [formTaxNo, setFormTaxNo] = useState('');
  const [formCategory, setFormCategory] = useState<'İşitme Cihazı' | 'Pil & Aksesuar' | 'Kalıp Malzemesi' | 'Teknik Servis' | 'Diğer'>('İşitme Cihazı');
  const [formStatus, setFormStatus] = useState<'Aktif' | 'Pasif'>('Aktif');
  const [formBalance, setFormBalance] = useState<number>(0);
  const [formNotes, setFormNotes] = useState('');

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
    setFormCompanyName('');
    setFormContactPerson('');
    setFormPhone('');
    setFormEmail('');
    setFormAddress('');
    setFormTaxNo('');
    setFormCategory('İşitme Cihazı');
    setFormStatus('Aktif');
    setFormBalance(0);
    setFormNotes('');
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
    setFormCategory(supplier.category);
    setFormStatus(supplier.status);
    setFormBalance(supplier.balance);
    setFormNotes(supplier.notes || '');
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
      s.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.contactPerson.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.phone.includes(searchTerm);

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
                {formatCurrency(Math.abs(suppliersList.reduce((acc, curr) => curr.balance < 0 ? acc + curr.balance : acc, 0)))}
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
                {isEditing ? 'Tedarikçi Bilgilerini Düzenle' : 'Yeni Tedarikçi Firma Ekle'}
              </span>
              <button onClick={() => setShowModal(false)} style={{ color: 'var(--gray-400)', fontSize: '1.4rem' }}>&times;</button>
            </div>
            <form onSubmit={handleSave}>
              <div className="card-body" style={{ padding: 20 }}>
                <div className="form-group" style={{ marginBottom: 12 }}>
                  <label className="form-label">Firma Adı</label>
                  <input
                    className="form-input"
                    value={formCompanyName}
                    onChange={(e) => setFormCompanyName(e.target.value)}
                  />
                  {errors.companyName && <span style={{ fontSize: '0.78rem', color: 'var(--danger-500)' }}>{errors.companyName}</span>}
                </div>

                <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
                  <div className="form-group" style={{ flex: 1, margin: 0 }}>
                    <label className="form-label">Yetkili Kişi (Ad Soyad)</label>
                    <input
                      className="form-input"
                      value={formContactPerson}
                      onChange={(e) => setFormContactPerson(e.target.value)}
                    />
                    {errors.contactPerson && <span style={{ fontSize: '0.78rem', color: 'var(--danger-500)' }}>{errors.contactPerson}</span>}
                  </div>
                  <div className="form-group" style={{ flex: 1, margin: 0 }}>
                    <label className="form-label">Vergi Numarası / TCKN</label>
                    <input
                      className="form-input"
                      value={formTaxNo}
                      onChange={(e) => setFormTaxNo(e.target.value)}
                    />
                    {errors.taxNo && <span style={{ fontSize: '0.78rem', color: 'var(--danger-500)' }}>{errors.taxNo}</span>}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
                  <div className="form-group" style={{ flex: 1, margin: 0 }}>
                    <label className="form-label">Telefon</label>
                    <input
                      className="form-input"
                      value={formPhone}
                      onChange={(e) => setFormPhone(e.target.value)}
                    />
                    {errors.phone && <span style={{ fontSize: '0.78rem', color: 'var(--danger-500)' }}>{errors.phone}</span>}
                  </div>
                  <div className="form-group" style={{ flex: 1, margin: 0 }}>
                    <label className="form-label">E-posta</label>
                    <input
                      type="email"
                      className="form-input"
                      value={formEmail}
                      onChange={(e) => setFormEmail(e.target.value)}
                    />
                    {errors.email && <span style={{ fontSize: '0.78rem', color: 'var(--danger-500)' }}>{errors.email}</span>}
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: 12 }}>
                  <label className="form-label">Tedarik Kapsamı / Kategori</label>
                  <select
                    className="form-input"
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as any)}
                  >
                    <option value="İşitme Cihazı">İşitme Cihazı</option>
                    <option value="Pil & Aksesuar">Pil & Aksesuar</option>
                    <option value="Kalıp Malzemesi">Kalıp Malzemesi</option>
                    <option value="Teknik Servis">Teknik Servis</option>
                    <option value="Diğer">Diğer</option>
                  </select>
                </div>

                <div className="form-group" style={{ marginBottom: 12 }}>
                  <label className="form-label">Adres</label>
                  <textarea
                    className="form-input"
                    rows={2}
                    value={formAddress}
                    onChange={(e) => setFormAddress(e.target.value)}
                    style={{ resize: 'none' }}
                  />
                </div>

                <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
                  <div className="form-group" style={{ flex: 1, margin: 0 }}>
                    <label className="form-label">Bakiye (TL)</label>
                    <input
                      type="number"
                      className="form-input"
                      value={formBalance}
                      onChange={(e) => setFormBalance(Number(e.target.value))}
                      placeholder="Negatif ise borcumuz"
                    />
                    <span style={{ fontSize: '0.74rem', color: 'var(--gray-400)' }}>Negatif = Borcumuz, Pozitif = Alacağımız</span>
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

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Özel Notlar</label>
                  <input
                    className="form-input"
                    value={formNotes}
                    onChange={(e) => setFormNotes(e.target.value)}
                  />
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
