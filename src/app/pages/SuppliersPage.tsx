'use client';

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Supplier, SupplierPurchase } from '../data/mockData';
import { IconSearch, IconPlus, IconEdit, IconDelete, IconFilter, IconCheck, IconWarning, IconDownload } from '../components/Icons';

export default function SuppliersPage() {
  const { suppliersList, addSupplier, updateSupplier, deleteSupplier, addSupplierPurchaseTransaction, addToast } = useApp();

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<string>('All');

  // Modal states
  const [showModal, setShowModal] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editingSupplierId, setEditingSupplierId] = useState<string | null>(null);

  const [pasifConfirmId, setPasifConfirmId] = useState<string | null>(null);
  const [actionsModalSupplier, setActionsModalSupplier] = useState<Supplier | null>(null);

  // Purchase Modal states
  const [showPurchasesModal, setShowPurchasesModal] = useState<boolean>(false);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [showNewPurchaseForm, setShowNewPurchaseForm] = useState<boolean>(false);

  // New Modals: Alış Faturası & Satış/Verme
  const [purchaseModalSupplier, setPurchaseModalSupplier] = useState<Supplier | null>(null);
  const [purInvoiceDate, setPurInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
  const [purItems, setPurItems] = useState([
    {
      name: '',
      category: 'Cihaz',
      brand: '',
      model: '',
      deviceType: '',
      salePrice: 0,
      isAssigned: true,
      trackingType: 'Tekil (Seri Numaralı)',
      gtin: '',
      serials: [] as string[],
      serialInput: '',
      mfgDate: '',
      expDate: '',
      unitPrice: 0,
      discount: 0,
      vat: 0
    }
  ]);
  const [purCashId, setPurCashId] = useState('');
  const [purPaymentMethodModal, setPurPaymentMethodModal] = useState('Nakit');
  const [purPaidAmountModal, setPurPaidAmountModal] = useState(0);
  const [purUtsToggle, setPurUtsToggle] = useState(false);

  const [saleModalSupplier, setSaleModalSupplier] = useState<Supplier | null>(null);
  const [saleItems, setSaleItems] = useState([
    { productId: '', qty: 1, unitPrice: 0, discount: 0, vat: 0 }
  ]);
  const [saleCashId, setSaleCashId] = useState('');
  const [salePaymentMethod, setSalePaymentMethod] = useState('Nakit');
  const [saleCollectedAmount, setSaleCollectedAmount] = useState(0);
  const [saleNotes, setSaleNotes] = useState('');

  // Tahsilat/Tediye State
  const [paymentModalSupplier, setPaymentModalSupplier] = useState<Supplier | null>(null);
  const [payProcessType, setPayProcessType] = useState('Tediye (Tedarikçiye Ödeme - Para Çıkışı)');
  const [payInvoiceId, setPayInvoiceId] = useState('');
  const [payAmount, setPayAmount] = useState<number | ''>('');
  const [payMethod, setPayMethod] = useState('');
  const [payCashId, setPayCashId] = useState('');
  const [payDescription, setPayDescription] = useState('');

  // İade State
  const [returnModalSupplier, setReturnModalSupplier] = useState<Supplier | null>(null);
  const [returnItemName, setReturnItemName] = useState('');
  const [returnQty, setReturnQty] = useState(1);
  const [returnReason, setReturnReason] = useState('Hasarlı / Bozuk');
  const [returnAmount, setReturnAmount] = useState<number | ''>('');
  const [returnCashId, setReturnCashId] = useState('');
  const [returnPaymentMethod, setReturnPaymentMethod] = useState('Nakit');

  // Hareketler Modal State
  const [movementsModalSupplier, setMovementsModalSupplier] = useState<Supplier | null>(null);
  const [movementsTab, setMovementsTab] = useState<'kasa' | 'alis' | 'satis' | 'verilen' | 'gelen'>('kasa');

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

    addSupplierPurchaseTransaction(selectedSupplier.id, newPurchase);
    setShowNewPurchaseForm(false);
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
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6, position: 'relative' }}>
                        {/* 1. Düzenle Button */}
                        <button
                          type="button"
                          className="btn"
                          onClick={() => handleOpenEditModal(sup)}
                          style={{
                            border: '1px solid var(--gray-300)',
                            background: '#fff',
                            color: 'var(--gray-800)',
                            borderRadius: 6,
                            padding: '5px 12px',
                            fontSize: '0.84rem',
                            fontWeight: 500,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6
                          }}
                        >
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
                          </svg>
                          Düzenle
                        </button>

                        {/* 2. Pasife Al / Aktife Al Button with Popover */}
                        <div style={{ position: 'relative' }}>
                          <button
                            type="button"
                            className="btn"
                            onClick={() => {
                              if (sup.status === 'Pasif') {
                                updateSupplier({ ...sup, status: 'Aktif' });
                                addToast({ type: 'success', message: `${sup.companyName} aktife alındı.` });
                              } else {
                                setPasifConfirmId(pasifConfirmId === sup.id ? null : sup.id);
                              }
                            }}
                            style={{
                              border: sup.status === 'Aktif' ? '1px solid #fca5a5' : '1px solid #86efac',
                              background: '#fff',
                              color: sup.status === 'Aktif' ? '#ef4444' : '#16a34a',
                              borderRadius: 6,
                              padding: '5px 12px',
                              fontSize: '0.84rem',
                              fontWeight: 500,
                              display: 'flex',
                              alignItems: 'center',
                              gap: 6
                            }}
                          >
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <circle cx="12" cy="12" r="10" />
                              <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
                            </svg>
                            {sup.status === 'Aktif' ? 'Pasife Al' : 'Aktife Al'}
                          </button>

                          {/* Popover confirmation */}
                          {pasifConfirmId === sup.id && (
                            <div style={{
                              position: 'absolute',
                              bottom: '100%',
                              right: 0,
                              marginBottom: 8,
                              background: '#fff',
                              border: '1px solid var(--gray-200)',
                              borderRadius: 8,
                              padding: '10px 14px',
                              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                              zIndex: 100,
                              whiteSpace: 'nowrap'
                            }}>
                              <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--gray-800)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                                <span>!</span> Pasife almak istediğinize emin misiniz?
                              </div>
                              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6 }}>
                                <button
                                  type="button"
                                  onClick={() => setPasifConfirmId(null)}
                                  style={{ padding: '3px 10px', borderRadius: 4, border: '1px solid var(--gray-300)', background: '#fff', fontSize: '0.78rem', cursor: 'pointer' }}
                                >
                                  Hayır
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    updateSupplier({ ...sup, status: 'Pasif' });
                                    addToast({ type: 'warning', message: `${sup.companyName} pasife alındı.` });
                                    setPasifConfirmId(null);
                                  }}
                                  style={{ padding: '3px 10px', borderRadius: 4, border: 'none', background: '#ef4444', color: '#fff', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer' }}
                                >
                                  Evet
                                </button>
                              </div>
                              <div style={{
                                position: 'absolute',
                                bottom: -5,
                                right: 24,
                                width: 8,
                                height: 8,
                                background: '#fff',
                                borderRight: '1px solid var(--gray-200)',
                                borderBottom: '1px solid var(--gray-200)',
                                transform: 'rotate(45deg)'
                              }} />
                            </div>
                          )}
                        </div>

                        {/* 3. İşlemler Blue Button */}
                        <button
                          type="button"
                          className="btn"
                          onClick={() => setActionsModalSupplier(sup)}
                          style={{
                            background: '#0284c7',
                            color: '#fff',
                            border: 'none',
                            borderRadius: 6,
                            padding: '5px 14px',
                            fontSize: '0.84rem',
                            fontWeight: 600,
                            cursor: 'pointer'
                          }}
                        >
                          İşlemler
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

      {/* Tedarikçi İşlemler Modal */}
      {actionsModalSupplier && (
        <div className="modal-overlay" onClick={() => setActionsModalSupplier(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 540, width: '92%', borderRadius: 12, padding: '24px 28px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0, color: 'var(--gray-900)' }}>
                {actionsModalSupplier.companyName} - İşlemler
              </h3>
              <button
                type="button"
                onClick={() => setActionsModalSupplier(null)}
                style={{ background: 'none', border: 'none', fontSize: '1.2rem', color: 'var(--gray-400)', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              {/* 1. Alış */}
              <div
                onClick={() => {
                  const s = actionsModalSupplier;
                  setActionsModalSupplier(null);
                  setPurchaseModalSupplier(s);
                }}
                style={{
                  border: '1px solid var(--gray-200)',
                  borderRadius: 10,
                  padding: '24px 16px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textAlign: 'center',
                  cursor: 'pointer',
                  background: '#fff'
                }}
              >
                <div style={{ width: 52, height: 52, borderRadius: '50%', background: '#f0f9ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0284c7', marginBottom: 12 }}>
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                    <line x1="3" y1="6" x2="21" y2="6" />
                    <path d="M16 10a4 4 0 0 1-8 0" />
                  </svg>
                </div>
                <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--gray-900)', marginBottom: 4 }}>Alış</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--gray-500)' }}>Yeni alış faturası</div>
              </div>

              {/* 2. Satış / Verme */}
              <div
                onClick={() => {
                  const s = actionsModalSupplier;
                  setActionsModalSupplier(null);
                  setSaleModalSupplier(s);
                }}
                style={{
                  border: '1px solid var(--gray-200)',
                  borderRadius: 10,
                  padding: '24px 16px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textAlign: 'center',
                  cursor: 'pointer',
                  background: '#fff'
                }}
              >
                <div style={{ width: 52, height: 52, borderRadius: '50%', background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0d9488', marginBottom: 12 }}>
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                    <line x1="3" y1="6" x2="21" y2="6" />
                    <path d="M16 10a4 4 0 0 1-8 0" />
                  </svg>
                </div>
                <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--gray-900)', marginBottom: 4 }}>Satış / Verme</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--gray-500)' }}>Tedarikçiye veya dış firmaya ürün ver</div>
              </div>

              {/* 3. Tahsilat/Tediye */}
              <div
                onClick={() => {
                  const s = actionsModalSupplier;
                  setActionsModalSupplier(null);
                  setPaymentModalSupplier(s);
                }}
                style={{
                  border: '1px solid var(--gray-200)',
                  borderRadius: 10,
                  padding: '24px 16px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textAlign: 'center',
                  cursor: 'pointer',
                  background: '#fff'
                }}
              >
                <div style={{ width: 52, height: 52, borderRadius: '50%', background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#16a34a', marginBottom: 12 }}>
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 6v12M15 9.5H10.5a2 2 0 0 0 0 4H13.5a2 2 0 0 1 0 4H9" />
                  </svg>
                </div>
                <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--gray-900)', marginBottom: 4 }}>Tahsilat/Tediye</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--gray-500)' }}>Para giriş/çıkış işlemi</div>
              </div>

              {/* 4. İade */}
              <div
                onClick={() => {
                  const s = actionsModalSupplier;
                  setActionsModalSupplier(null);
                  setReturnModalSupplier(s);
                }}
                style={{
                  border: '1px solid var(--gray-200)',
                  borderRadius: 10,
                  padding: '24px 16px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textAlign: 'center',
                  cursor: 'pointer',
                  background: '#fff'
                }}
              >
                <div style={{ width: 52, height: 52, borderRadius: '50%', background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444', marginBottom: 12 }}>
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9 14 4 9 9 4" />
                    <path d="M20 20v-7a4 4 0 0 0-4-4H4" />
                  </svg>
                </div>
                <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--gray-900)', marginBottom: 4 }}>İade</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--gray-500)' }}>Tedarikçiye ürün iade et</div>
              </div>

              {/* 5. Hareketler */}
              <div
                onClick={() => {
                  const s = actionsModalSupplier;
                  setActionsModalSupplier(null);
                  setMovementsModalSupplier(s);
                  setMovementsTab('kasa');
                }}
                style={{
                  border: '1px solid var(--gray-200)',
                  borderRadius: 10,
                  padding: '24px 16px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textAlign: 'center',
                  cursor: 'pointer',
                  background: '#fff'
                }}
              >
                <div style={{ width: 52, height: 52, borderRadius: '50%', background: '#fff7ed', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f59e0b', marginBottom: 12 }}>
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                  </svg>
                </div>
                <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--gray-900)', marginBottom: 4 }}>Hareketler</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--gray-500)' }}>Tedarikçi hareketleri</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Alış Faturası Modal */}
      {purchaseModalSupplier && (
        <div className="modal-overlay" onClick={() => setPurchaseModalSupplier(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 780, width: '95%', maxHeight: '92vh', display: 'flex', flexDirection: 'column', borderRadius: 12 }}>
            <div className="modal-header" style={{ padding: '16px 24px', borderBottom: '1px solid var(--gray-200)' }}>
              <span className="modal-title" style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--gray-900)' }}>
                Alış Faturası - {purchaseModalSupplier.companyName}
              </span>
              <button className="modal-close" onClick={() => setPurchaseModalSupplier(null)}>✕</button>
            </div>

            <div className="modal-body" style={{ overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* Fatura Tarihi */}
              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 600 }}>
                  <span style={{ color: '#ef4444', marginRight: 2 }}>*</span> Fatura Tarihi
                </label>
                <input
                  type="date"
                  className="form-input"
                  value={purInvoiceDate}
                  onChange={(e) => setPurInvoiceDate(e.target.value)}
                />
              </div>

              {/* Ürünler Section */}
              <div>
                <div style={{ margin: '8px 0 14px', textAlign: 'center', position: 'relative' }}>
                  <hr style={{ border: 'none', borderTop: '1px dashed var(--gray-300)', margin: 0 }} />
                  <span style={{ position: 'relative', top: -10, background: '#fff', padding: '0 14px', fontSize: '0.86rem', fontWeight: 600, color: 'var(--gray-700)' }}>
                    Ürünler
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {purItems.map((item, idx) => {
                    const lineSubtotal = item.unitPrice * (item.serials.length || 1);
                    const lineDiscount = lineSubtotal * (item.discount / 100);
                    const lineVat = (lineSubtotal - lineDiscount) * (item.vat / 100);
                    const lineTotal = lineSubtotal - lineDiscount + lineVat;

                    return (
                      <div key={idx} style={{ border: '1px solid var(--gray-200)', borderRadius: 8, overflow: 'hidden', background: '#fff' }}>
                        <div style={{ padding: '8px 14px', background: '#fafafa', borderBottom: '1px solid var(--gray-200)', fontSize: '0.84rem', fontWeight: 600, color: 'var(--gray-700)', display: 'flex', justifyContent: 'space-between' }}>
                          <span>Ürün {idx + 1}</span>
                          {purItems.length > 1 && (
                            <button
                              type="button"
                              onClick={() => setPurItems(purItems.filter((_, i) => i !== idx))}
                              style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '0.78rem' }}
                            >
                              Kaldır
                            </button>
                          )}
                        </div>

                        <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
                          {/* Row 1: Ürün Adı & Kategori */}
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                            <div className="form-group">
                              <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600 }}>
                                <span style={{ color: '#ef4444' }}>*</span> Ürün Adı
                              </label>
                              <input
                                className="form-input"
                                placeholder="Ürün adı girin"
                                value={item.name}
                                onChange={(e) => {
                                  const next = [...purItems];
                                  next[idx].name = e.target.value;
                                  setPurItems(next);
                                }}
                              />
                            </div>
                            <div className="form-group">
                              <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600 }}>
                                <span style={{ color: '#ef4444' }}>*</span> Kategori
                              </label>
                              <select
                                className="form-select"
                                value={item.category}
                                onChange={(e) => {
                                  const next = [...purItems];
                                  next[idx].category = e.target.value;
                                  setPurItems(next);
                                }}
                              >
                                <option value="Cihaz">Cihaz</option>
                                <option value="Pil & Aksesuar">Pil & Aksesuar</option>
                                <option value="Kalıp Malzemesi">Kalıp Malzemesi</option>
                                <option value="Teknik Servis">Teknik Servis</option>
                                <option value="Diğer">Diğer</option>
                              </select>
                            </div>
                          </div>

                          {/* Row 2: Marka, Model, Cihaz Tipi */}
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                            <div className="form-group">
                              <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600 }}>Marka</label>
                              <input
                                className="form-input"
                                placeholder="Marka yazın veya seçin"
                                value={item.brand}
                                onChange={(e) => {
                                  const next = [...purItems];
                                  next[idx].brand = e.target.value;
                                  setPurItems(next);
                                }}
                              />
                            </div>
                            <div className="form-group">
                              <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600 }}>Model</label>
                              <input
                                className="form-input"
                                placeholder="Model yazın veya seçin"
                                value={item.model}
                                onChange={(e) => {
                                  const next = [...purItems];
                                  next[idx].model = e.target.value;
                                  setPurItems(next);
                                }}
                              />
                            </div>
                            <div className="form-group">
                              <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600 }}>Cihaz Tipi</label>
                              <input
                                className="form-input"
                                placeholder="Cihaz tipi yazın veya seçin"
                                value={item.deviceType}
                                onChange={(e) => {
                                  const next = [...purItems];
                                  next[idx].deviceType = e.target.value;
                                  setPurItems(next);
                                }}
                              />
                            </div>
                          </div>

                          {/* Row 3: Satış Fiyatı & Checkbox */}
                          <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                            <div className="form-group" style={{ flex: 1 }}>
                              <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600 }}>Satış Fiyatı</label>
                              <div style={{ position: 'relative' }}>
                                <input
                                  type="number"
                                  className="form-input"
                                  value={item.salePrice}
                                  onChange={(e) => {
                                    const next = [...purItems];
                                    next[idx].salePrice = Number(e.target.value);
                                    setPurItems(next);
                                  }}
                                  style={{ paddingRight: 24 }}
                                />
                                <span style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-400)', fontSize: '0.82rem' }}>₺</span>
                              </div>
                            </div>
                            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', marginTop: 18 }}>
                              <input
                                type="checkbox"
                                checked={item.isAssigned}
                                onChange={(e) => {
                                  const next = [...purItems];
                                  next[idx].isAssigned = e.target.checked;
                                  setPurItems(next);
                                }}
                                style={{ width: 16, height: 16, accentColor: '#0284c7' }}
                              />
                              <span style={{ fontSize: '0.82rem', fontWeight: 500, color: 'var(--gray-800)' }}>
                                Zimmetli Ürün (Hastaya atanabilir)
                              </span>
                            </label>
                          </div>

                          {/* Divider: ÜTS Bilgileri */}
                          <div style={{ margin: '4px 0', textAlign: 'center', position: 'relative' }}>
                            <hr style={{ border: 'none', borderTop: '1px dashed var(--gray-300)', margin: 0 }} />
                            <span style={{ position: 'relative', top: -9, background: '#fff', padding: '0 10px', fontSize: '0.78rem', fontWeight: 600, color: 'var(--gray-500)' }}>
                              ÜTS Bilgileri
                            </span>
                          </div>

                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.2fr', gap: 12 }}>
                            <div className="form-group">
                              <label className="form-label" style={{ fontSize: '0.78rem', fontWeight: 600 }}>Takip Tipi</label>
                              <select
                                className="form-select"
                                value={item.trackingType}
                                onChange={(e) => {
                                  const next = [...purItems];
                                  next[idx].trackingType = e.target.value;
                                  setPurItems(next);
                                }}
                              >
                                <option value="Tekil (Seri Numaralı)">Tekil (Seri Numaralı)</option>
                                <option value="Lot / Parti">Lot / Parti</option>
                                <option value="Takipsiz">Takipsiz</option>
                              </select>
                            </div>
                            <div className="form-group">
                              <label className="form-label" style={{ fontSize: '0.78rem', fontWeight: 600 }}>GTIN / Barkod</label>
                              <input
                                className="form-input"
                                placeholder="13-14 haneli GTIN"
                                value={item.gtin}
                                onChange={(e) => {
                                  const next = [...purItems];
                                  next[idx].gtin = e.target.value;
                                  setPurItems(next);
                                }}
                              />
                            </div>
                            <div className="form-group">
                              <label className="form-label" style={{ fontSize: '0.78rem', fontWeight: 600 }}>
                                <span style={{ color: '#ef4444' }}>*</span> Seri Numaraları
                              </label>
                              <input
                                className="form-input"
                                placeholder="Seri no yaz + Enter — her seri no bir cihaz"
                                value={item.serialInput}
                                onChange={(e) => {
                                  const next = [...purItems];
                                  next[idx].serialInput = e.target.value;
                                  setPurItems(next);
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' && item.serialInput.trim()) {
                                    e.preventDefault();
                                    const next = [...purItems];
                                    next[idx].serials = [...next[idx].serials, item.serialInput.trim()];
                                    next[idx].serialInput = '';
                                    setPurItems(next);
                                  }
                                }}
                              />
                              <div style={{ fontSize: '0.72rem', color: 'var(--gray-400)', marginTop: 2 }}>
                                {item.serials.length} cihaz — her seri no ayrı kayıt olur, miktar otomatik
                              </div>
                            </div>
                          </div>

                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                            <div className="form-group">
                              <label className="form-label" style={{ fontSize: '0.78rem', fontWeight: 600 }}>Üretim Tarihi</label>
                              <input
                                type="date"
                                className="form-input"
                                value={item.mfgDate}
                                onChange={(e) => {
                                  const next = [...purItems];
                                  next[idx].mfgDate = e.target.value;
                                  setPurItems(next);
                                }}
                              />
                            </div>
                            <div className="form-group">
                              <label className="form-label" style={{ fontSize: '0.78rem', fontWeight: 600 }}>Son Kullanma Tarihi</label>
                              <input
                                type="date"
                                className="form-input"
                                value={item.expDate}
                                onChange={(e) => {
                                  const next = [...purItems];
                                  next[idx].expDate = e.target.value;
                                  setPurItems(next);
                                }}
                              />
                            </div>
                          </div>

                          {/* Divider: Fiyatlandırma */}
                          <div style={{ margin: '4px 0', textAlign: 'center', position: 'relative' }}>
                            <hr style={{ border: 'none', borderTop: '1px dashed var(--gray-300)', margin: 0 }} />
                            <span style={{ position: 'relative', top: -9, background: '#fff', padding: '0 10px', fontSize: '0.78rem', fontWeight: 600, color: 'var(--gray-500)' }}>
                              Fiyatlandırma
                            </span>
                          </div>

                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 10 }}>
                            <div className="form-group">
                              <label className="form-label" style={{ fontSize: '0.78rem', fontWeight: 600 }}>Miktar</label>
                              <input
                                type="number"
                                className="form-input"
                                value={item.serials.length || 1}
                                readOnly
                                style={{ background: '#f8fafc', color: '#ef4444', fontWeight: 600 }}
                              />
                            </div>
                            <div className="form-group">
                              <label className="form-label" style={{ fontSize: '0.78rem', fontWeight: 600 }}>
                                <span style={{ color: '#ef4444' }}>*</span> Alış Fiyatı (Birim)
                              </label>
                              <div style={{ position: 'relative' }}>
                                <input
                                  type="number"
                                  className="form-input"
                                  value={item.unitPrice}
                                  onChange={(e) => {
                                    const next = [...purItems];
                                    next[idx].unitPrice = Number(e.target.value);
                                    setPurItems(next);
                                  }}
                                  style={{ paddingRight: 20 }}
                                />
                                <span style={{ position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-400)', fontSize: '0.78rem' }}>₺</span>
                              </div>
                            </div>
                            <div className="form-group">
                              <label className="form-label" style={{ fontSize: '0.78rem', fontWeight: 600 }}>İskonto %</label>
                              <input
                                type="number"
                                className="form-input"
                                value={item.discount}
                                onChange={(e) => {
                                  const next = [...purItems];
                                  next[idx].discount = Number(e.target.value);
                                  setPurItems(next);
                                }}
                              />
                            </div>
                            <div className="form-group">
                              <label className="form-label" style={{ fontSize: '0.78rem', fontWeight: 600 }}>KDV %</label>
                              <input
                                type="number"
                                className="form-input"
                                value={item.vat}
                                onChange={(e) => {
                                  const next = [...purItems];
                                  next[idx].vat = Number(e.target.value);
                                  setPurItems(next);
                                }}
                              />
                            </div>
                          </div>

                          {/* Line Calculations summary bar */}
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', background: '#fafafa', padding: '8px 12px', borderRadius: 6, color: 'var(--gray-700)' }}>
                            <span>Ara Toplam: <strong>{lineSubtotal.toFixed(2)} ₺</strong></span>
                            <span>İskonto: <strong>{lineDiscount.toFixed(2)} ₺</strong></span>
                            <span>KDV: <strong>{lineVat.toFixed(2)} ₺</strong></span>
                            <span style={{ color: '#16a34a', fontWeight: 700 }}>Toplam: {lineTotal.toFixed(2)} ₺</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {/* Dashed Add Product Button */}
                  <button
                    type="button"
                    onClick={() => setPurItems([...purItems, {
                      name: '',
                      category: 'Cihaz',
                      brand: '',
                      model: '',
                      deviceType: '',
                      salePrice: 0,
                      isAssigned: true,
                      trackingType: 'Tekil (Seri Numaralı)',
                      gtin: '',
                      serials: [],
                      serialInput: '',
                      mfgDate: '',
                      expDate: '',
                      unitPrice: 0,
                      discount: 0,
                      vat: 0
                    }])}
                    style={{
                      border: '2px dashed var(--gray-300)',
                      background: '#fff',
                      borderRadius: 8,
                      padding: '10px 16px',
                      color: 'var(--gray-700)',
                      fontSize: '0.86rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6
                    }}
                  >
                    + Ürün Ekle
                  </button>
                </div>
              </div>

              {/* Ödeme Bilgileri */}
              <div>
                <div style={{ margin: '8px 0 14px', textAlign: 'center', position: 'relative' }}>
                  <hr style={{ border: 'none', borderTop: '1px dashed var(--gray-300)', margin: 0 }} />
                  <span style={{ position: 'relative', top: -10, background: '#fff', padding: '0 14px', fontSize: '0.86rem', fontWeight: 600, color: 'var(--gray-700)' }}>
                    Ödeme Bilgileri
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600 }}>
                      <span style={{ color: '#ef4444' }}>*</span> Kasa
                    </label>
                    <select
                      className="form-select"
                      value={purCashId}
                      onChange={(e) => setPurCashId(e.target.value)}
                    >
                      <option value="">Kasa seçin</option>
                      <option value="ana">Ana Kasa</option>
                      <option value="kadikoy">Kadıköy Kasa</option>
                      <option value="besiktas">Beşiktaş Kasa</option>
                      <option value="banka">Banka - Garanti</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600 }}>Ödeme Yöntemi</label>
                    <select
                      className="form-select"
                      value={purPaymentMethodModal}
                      onChange={(e) => setPurPaymentMethodModal(e.target.value)}
                    >
                      <option value="Nakit">Nakit</option>
                      <option value="Havale / EFT">Havale / EFT</option>
                      <option value="Kredi Kartı">Kredi Kartı</option>
                      <option value="Çek">Çek</option>
                      <option value="Açık Hesap">Açık Hesap</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600 }}>Ödenen Tutar</label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type="number"
                        className="form-input"
                        value={purPaidAmountModal}
                        onChange={(e) => setPurPaidAmountModal(Number(e.target.value))}
                        style={{ paddingRight: 24 }}
                      />
                      <span style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-400)', fontSize: '0.82rem' }}>₺</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Light Yellow Warning Callout Box */}
              <div style={{
                background: '#fefce8',
                border: '1px solid #fef08a',
                borderRadius: 8,
                padding: '14px 16px',
                display: 'flex',
                gap: 12,
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <div style={{ width: 22, height: 22, borderRadius: '50%', background: '#eab308', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.78rem', fontWeight: 700, flexShrink: 0, marginTop: 1 }}>🔌</div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#854d0e', marginBottom: 2 }}>ÜTS Alma Bildirimi (İsteğe Bağlı)</div>
                    <div style={{ fontSize: '0.78rem', color: '#a16207' }}>ÜTS entegrasyonu aktif değil. Alış işlemi yapılabilir ancak ÜTS bildirimi gönderilmeyecektir.</div>
                  </div>
                </div>
                <div
                  onClick={() => setPurUtsToggle(!purUtsToggle)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    cursor: 'pointer'
                  }}
                >
                  <div
                    style={{
                      width: 44,
                      height: 22,
                      borderRadius: 11,
                      background: purUtsToggle ? '#0284c7' : '#cbd5e1',
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
                        left: purUtsToggle ? 24 : 2,
                        transition: 'left 0.2s ease',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
                      }}
                    />
                  </div>
                  <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--gray-500)' }}>
                    {purUtsToggle ? 'Açık' : 'Kapalı'}
                  </span>
                </div>
              </div>

              {/* Total Summary Bar Card */}
              <div style={{
                border: '1px solid var(--gray-200)',
                borderRadius: 8,
                padding: '16px 20px',
                background: '#fff',
                display: 'grid',
                gridTemplateColumns: '1fr 1fr 1fr 1.2fr',
                gap: 16,
                alignItems: 'center'
              }}>
                <div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--gray-500)', marginBottom: 4 }}>Genel Toplam</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#16a34a' }}>
                    {purItems.reduce((sum, item) => {
                      const sub = item.unitPrice * (item.serials.length || 1);
                      const disc = sub * (item.discount / 100);
                      const vat = (sub - disc) * (item.vat / 100);
                      return sum + (sub - disc + vat);
                    }, 0).toFixed(2)} ₺
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--gray-500)', marginBottom: 4 }}>Ödenen</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0284c7' }}>
                    {purPaidAmountModal.toFixed(2)} ₺
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--gray-500)', marginBottom: 4 }}>Kalan Borç</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#16a34a' }}>
                    {Math.max(0, purItems.reduce((sum, item) => {
                      const sub = item.unitPrice * (item.serials.length || 1);
                      const disc = sub * (item.discount / 100);
                      const vat = (sub - disc) * (item.vat / 100);
                      return sum + (sub - disc + vat);
                    }, 0) - purPaidAmountModal).toFixed(2)} ₺
                  </div>
                </div>
                <div style={{ textAlign: 'right', fontSize: '0.78rem', color: 'var(--gray-400)' }}>
                  Tedarikçiye ödenecek tutar
                </div>
              </div>
            </div>

            <div className="modal-footer" style={{ borderTop: '1px solid var(--gray-200)', padding: '12px 24px', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setPurchaseModalSupplier(null)}
                style={{ padding: '8px 20px', borderRadius: 6 }}
              >
                İptal
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  addToast({ type: 'success', message: `${purchaseModalSupplier.companyName} için alış faturası kaydedildi ve stok eklendi.` });
                  setPurchaseModalSupplier(null);
                }}
                style={{ padding: '8px 24px', borderRadius: 6, background: '#0284c7', borderColor: '#0284c7' }}
              >
                Ürün ve Alışı Kaydet
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Satış / Verme Modal */}
      {saleModalSupplier && (
        <div className="modal-overlay" onClick={() => setSaleModalSupplier(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 740, width: '95%', maxHeight: '92vh', display: 'flex', flexDirection: 'column', borderRadius: 12 }}>
            <div className="modal-header" style={{ padding: '16px 24px', borderBottom: '1px solid var(--gray-200)' }}>
              <span className="modal-title" style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--gray-900)' }}>
                Satış / Verme - {saleModalSupplier.companyName}
              </span>
              <button className="modal-close" onClick={() => setSaleModalSupplier(null)}>✕</button>
            </div>

            <div className="modal-body" style={{ overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* Ürünler Section */}
              <div>
                <div style={{ margin: '4px 0 14px', textAlign: 'center', position: 'relative' }}>
                  <hr style={{ border: 'none', borderTop: '1px dashed var(--gray-300)', margin: 0 }} />
                  <span style={{ position: 'relative', top: -10, background: '#fff', padding: '0 14px', fontSize: '0.86rem', fontWeight: 600, color: 'var(--gray-700)' }}>
                    Ürünler
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {saleItems.map((item, idx) => {
                    const sub = item.unitPrice * item.qty;
                    const disc = sub * (item.discount / 100);
                    const vat = (sub - disc) * (item.vat / 100);
                    const tot = sub - disc + vat;

                    return (
                      <div key={idx} style={{ border: '1px solid var(--gray-200)', borderRadius: 8, overflow: 'hidden', background: '#fff' }}>
                        <div style={{ padding: '8px 14px', background: '#fafafa', borderBottom: '1px solid var(--gray-200)', fontSize: '0.84rem', fontWeight: 600, color: 'var(--gray-700)', display: 'flex', justifyContent: 'space-between' }}>
                          <span>Ürün {idx + 1}</span>
                          {saleItems.length > 1 && (
                            <button
                              type="button"
                              onClick={() => setSaleItems(saleItems.filter((_, i) => i !== idx))}
                              style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '0.78rem' }}
                            >
                              Kaldır
                            </button>
                          )}
                        </div>

                        <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 12 }}>
                          <div className="form-group">
                            <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600 }}>Ürün / Cihaz</label>
                            <input
                              className="form-input"
                              placeholder="Cihaz/ürün seçin — birden fazla seçebilirsiniz"
                              value={item.productId}
                              onChange={(e) => {
                                const next = [...saleItems];
                                next[idx].productId = e.target.value;
                                setSaleItems(next);
                              }}
                            />
                          </div>

                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 10 }}>
                            <div className="form-group">
                              <label className="form-label" style={{ fontSize: '0.78rem', fontWeight: 600 }}>Miktar</label>
                              <input
                                type="number"
                                className="form-input"
                                value={item.qty}
                                onChange={(e) => {
                                  const next = [...saleItems];
                                  next[idx].qty = Number(e.target.value);
                                  setSaleItems(next);
                                }}
                                min={1}
                              />
                            </div>
                            <div className="form-group">
                              <label className="form-label" style={{ fontSize: '0.78rem', fontWeight: 600 }}>Birim Fiyat</label>
                              <div style={{ position: 'relative' }}>
                                <input
                                  type="number"
                                  className="form-input"
                                  value={item.unitPrice}
                                  onChange={(e) => {
                                    const next = [...saleItems];
                                    next[idx].unitPrice = Number(e.target.value);
                                    setSaleItems(next);
                                  }}
                                  style={{ paddingRight: 20 }}
                                />
                                <span style={{ position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-400)', fontSize: '0.78rem' }}>₺</span>
                              </div>
                            </div>
                            <div className="form-group">
                              <label className="form-label" style={{ fontSize: '0.78rem', fontWeight: 600 }}>İskonto %</label>
                              <input
                                type="number"
                                className="form-input"
                                value={item.discount}
                                onChange={(e) => {
                                  const next = [...saleItems];
                                  next[idx].discount = Number(e.target.value);
                                  setSaleItems(next);
                                }}
                              />
                            </div>
                            <div className="form-group">
                              <label className="form-label" style={{ fontSize: '0.78rem', fontWeight: 600 }}>KDV %</label>
                              <input
                                type="number"
                                className="form-input"
                                value={item.vat}
                                onChange={(e) => {
                                  const next = [...saleItems];
                                  next[idx].vat = Number(e.target.value);
                                  setSaleItems(next);
                                }}
                              />
                            </div>
                          </div>

                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', background: '#fafafa', padding: '8px 12px', borderRadius: 6, color: 'var(--gray-700)' }}>
                            <span>Ara Toplam: <strong>{sub.toFixed(2)} ₺</strong></span>
                            <span>İskonto: <strong>{disc.toFixed(2)} ₺</strong></span>
                            <span>KDV: <strong>{vat.toFixed(2)} ₺</strong></span>
                            <span style={{ color: '#16a34a', fontWeight: 700 }}>Toplam: {tot.toFixed(2)} ₺</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {/* Dashed Add Product Button */}
                  <button
                    type="button"
                    onClick={() => setSaleItems([...saleItems, { productId: '', qty: 1, unitPrice: 0, discount: 0, vat: 0 }])}
                    style={{
                      border: '2px dashed var(--gray-300)',
                      background: '#fff',
                      borderRadius: 8,
                      padding: '10px 16px',
                      color: 'var(--gray-700)',
                      fontSize: '0.86rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6
                    }}
                  >
                    + Ürün Ekle
                  </button>
                </div>
              </div>

              {/* Ödeme Bilgileri */}
              <div>
                <div style={{ margin: '8px 0 14px', textAlign: 'center', position: 'relative' }}>
                  <hr style={{ border: 'none', borderTop: '1px dashed var(--gray-300)', margin: 0 }} />
                  <span style={{ position: 'relative', top: -10, background: '#fff', padding: '0 14px', fontSize: '0.86rem', fontWeight: 600, color: 'var(--gray-700)' }}>
                    Ödeme Bilgileri
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600 }}>
                      <span style={{ color: '#ef4444' }}>*</span> Kasa
                    </label>
                    <select
                      className="form-select"
                      value={saleCashId}
                      onChange={(e) => setSaleCashId(e.target.value)}
                    >
                      <option value="">Kasa seçin</option>
                      <option value="ana">Ana Kasa</option>
                      <option value="kadikoy">Kadıköy Kasa</option>
                      <option value="besiktas">Beşiktaş Kasa</option>
                      <option value="banka">Banka - Garanti</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600 }}>Ödeme Yöntemi</label>
                    <select
                      className="form-select"
                      value={salePaymentMethod}
                      onChange={(e) => setSalePaymentMethod(e.target.value)}
                    >
                      <option value="Nakit">Nakit</option>
                      <option value="Havale / EFT">Havale / EFT</option>
                      <option value="Kredi Kartı">Kredi Kartı</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600 }}>Peşin Tahsilat Tutarı</label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type="number"
                        className="form-input"
                        value={saleCollectedAmount}
                        onChange={(e) => setSaleCollectedAmount(Number(e.target.value))}
                        style={{ paddingRight: 24 }}
                      />
                      <span style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-400)', fontSize: '0.82rem' }}>₺</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Notlar */}
              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 600 }}>Notlar</label>
                <textarea
                  className="form-input"
                  rows={2}
                  placeholder="Ek notlar (opsiyonel)"
                  value={saleNotes}
                  onChange={(e) => setSaleNotes(e.target.value)}
                  style={{ width: '100%', resize: 'vertical' }}
                />
              </div>

              {/* Total Summary Bar Card */}
              <div style={{
                border: '1px solid var(--gray-200)',
                borderRadius: 8,
                padding: '16px 20px',
                background: '#fff',
                display: 'grid',
                gridTemplateColumns: '1fr 1fr 1fr 1.2fr',
                gap: 16,
                alignItems: 'center'
              }}>
                <div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--gray-500)', marginBottom: 4 }}>Genel Toplam</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#16a34a' }}>
                    {saleItems.reduce((sum, item) => {
                      const sub = item.unitPrice * item.qty;
                      const disc = sub * (item.discount / 100);
                      const vat = (sub - disc) * (item.vat / 100);
                      return sum + (sub - disc + vat);
                    }, 0).toFixed(2)} ₺
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--gray-500)', marginBottom: 4 }}>Tahsil Edilen</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0284c7' }}>
                    {saleCollectedAmount.toFixed(2)} ₺
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--gray-500)', marginBottom: 4 }}>Kalan Alacak</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#16a34a' }}>
                    {Math.max(0, saleItems.reduce((sum, item) => {
                      const sub = item.unitPrice * item.qty;
                      const disc = sub * (item.discount / 100);
                      const vat = (sub - disc) * (item.vat / 100);
                      return sum + (sub - disc + vat);
                    }, 0) - saleCollectedAmount).toFixed(2)} ₺
                  </div>
                </div>
                <div style={{ textAlign: 'right', fontSize: '0.78rem', color: 'var(--gray-400)' }}>
                  Firmadan tahsil edilecek tutar
                </div>
              </div>
            </div>

            <div className="modal-footer" style={{ borderTop: '1px solid var(--gray-200)', padding: '12px 24px', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setSaleModalSupplier(null)}
                style={{ padding: '8px 20px', borderRadius: 6 }}
              >
                İptal
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  addToast({ type: 'success', message: `${saleModalSupplier.companyName} için ürün çıkış / satış kaydı oluşturuldu.` });
                  setSaleModalSupplier(null);
                }}
                style={{ padding: '8px 24px', borderRadius: 6, background: '#0284c7', borderColor: '#0284c7' }}
              >
                Kaydet
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tahsilat / Tediye Modal */}
      {paymentModalSupplier && (
        <div className="modal-overlay" onClick={() => setPaymentModalSupplier(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 540, width: '92%', borderRadius: 12, padding: '24px 28px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0, color: 'var(--gray-900)' }}>
                Tahsilat/Tediye - {paymentModalSupplier.companyName}
              </h3>
              <button
                type="button"
                onClick={() => setPaymentModalSupplier(null)}
                style={{ background: 'none', border: 'none', fontSize: '1.2rem', color: 'var(--gray-400)', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={(e) => {
              e.preventDefault();
              addToast({ type: 'success', message: `${paymentModalSupplier.companyName} için ${payProcessType.startsWith('Tediye') ? 'Tediye (Ödeme)' : 'Tahsilat'} işlemi kaydedildi.` });
              setPaymentModalSupplier(null);
            }} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* 1. İşlem Tipi */}
              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 600 }}>
                  <span style={{ color: '#ef4444', marginRight: 2 }}>*</span> İşlem Tipi
                </label>
                <select
                  className="form-select"
                  value={payProcessType}
                  onChange={(e) => setPayProcessType(e.target.value)}
                >
                  <option value="Tediye (Tedarikçiye Ödeme - Para Çıkışı)">Tediye (Tedarikçiye Ödeme - Para Çıkışı)</option>
                  <option value="Tahsilat (Tedarikçiden Alacak - Para Girişi)">Tahsilat (Tedarikçiden Alacak - Para Girişi)</option>
                </select>
              </div>

              {/* 2. Alış Faturası */}
              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 600 }}>
                  <span style={{ color: '#ef4444', marginRight: 2 }}>*</span> Alış Faturası
                </label>
                <select
                  className="form-select"
                  value={payInvoiceId}
                  onChange={(e) => setPayInvoiceId(e.target.value)}
                >
                  <option value="">Ödeme yapılacak alış faturasını seçin</option>
                  {paymentModalSupplier.purchases.map(p => (
                    <option key={p.id} value={p.id}>{p.invoiceNo} - {p.date} ({p.total} ₺)</option>
                  ))}
                  <option value="serbest">Faturasız Serbest Ödeme</option>
                </select>
              </div>

              {/* 3. Tutar */}
              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 600 }}>
                  <span style={{ color: '#ef4444', marginRight: 2 }}>*</span> Tutar
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="number"
                    className="form-input"
                    placeholder="Tutar"
                    value={payAmount}
                    onChange={(e) => setPayAmount(e.target.value === '' ? '' : Number(e.target.value))}
                    style={{ paddingRight: 24 }}
                    required
                  />
                  <span style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-400)', fontSize: '0.82rem' }}>₺</span>
                </div>
              </div>

              {/* 4. Ödeme Yöntemi & Kasa */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 600 }}>
                    <span style={{ color: '#ef4444', marginRight: 2 }}>*</span> Ödeme Yöntemi
                  </label>
                  <select
                    className="form-select"
                    value={payMethod}
                    onChange={(e) => setPayMethod(e.target.value)}
                    required
                  >
                    <option value="">Ödeme yöntemi</option>
                    <option value="Nakit">Nakit</option>
                    <option value="Havale / EFT">Havale / EFT</option>
                    <option value="Kredi Kartı">Kredi Kartı</option>
                    <option value="Çek">Çek</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 600 }}>
                    <span style={{ color: '#ef4444', marginRight: 2 }}>*</span> Kasa
                  </label>
                  <select
                    className="form-select"
                    value={payCashId}
                    onChange={(e) => setPayCashId(e.target.value)}
                    required
                  >
                    <option value="">Kasa seçin</option>
                    <option value="ana">Ana Kasa</option>
                    <option value="kadikoy">Kadıköy Kasa</option>
                    <option value="besiktas">Beşiktaş Kasa</option>
                    <option value="banka">Banka - Garanti</option>
                  </select>
                </div>
              </div>

              {/* 5. Açıklama */}
              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 600 }}>Açıklama</label>
                <textarea
                  className="form-input"
                  rows={2}
                  placeholder="Açıklama (opsiyonel)"
                  value={payDescription}
                  onChange={(e) => setPayDescription(e.target.value)}
                  style={{ resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setPaymentModalSupplier(null)}
                  style={{ padding: '8px 20px', borderRadius: 6 }}
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ padding: '8px 24px', borderRadius: 6, background: '#0284c7', borderColor: '#0284c7' }}
                >
                  Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tedarikçiye İade Modal */}
      {returnModalSupplier && (
        <div className="modal-overlay" onClick={() => setReturnModalSupplier(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 580, width: '92%', borderRadius: 12, padding: '24px 28px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0, color: 'var(--gray-900)' }}>
                Tedarikçiye İade - {returnModalSupplier.companyName}
              </h3>
              <button
                type="button"
                onClick={() => setReturnModalSupplier(null)}
                style={{ background: 'none', border: 'none', fontSize: '1.2rem', color: 'var(--gray-400)', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            {/* Blue Callout Box */}
            <div style={{
              background: '#f0f9ff',
              border: '1px solid #bae6fd',
              borderRadius: 8,
              padding: '16px 18px',
              display: 'flex',
              gap: 12,
              alignItems: 'flex-start',
              marginBottom: 24
            }}>
              <div style={{ width: 22, height: 22, borderRadius: '50%', background: '#0284c7', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 700, flexShrink: 0, marginTop: 1 }}>i</div>
              <div style={{ fontSize: '0.81rem', lineHeight: 1.5 }}>
                <div style={{ fontWeight: 700, color: '#0c4a6e', fontSize: '0.88rem', marginBottom: 4 }}>
                  Tedarikçiye iade edilecek alış faturasını seçin
                </div>
                <div style={{ fontWeight: 600, color: '#0369a1', marginBottom: 6 }}>
                  Seçtiğiniz faturadaki ürünler stoktan düşürülecek ve tedarikçiye iade kaydı oluşturulacaktır.
                </div>
                <div style={{ color: '#64748b', fontSize: '0.79rem' }}>
                  Bir sonraki adımda UTS (Ürün Takip Sistemi) bildirim seçeneklerini göreceksiniz. UTS bildirimi sayesinde ürünün firma stoğundan çıkarak tedarikçiye geri döndüğü resmi olarak kayıt altına alınır.
                </div>
              </div>
            </div>

            {/* Empty State / Invoices list */}
            {returnModalSupplier.purchases.length === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '30px 20px 20px', textAlign: 'center' }}>
                {/* Tray & Document Illustration */}
                <div style={{ width: 64, height: 64, position: 'relative', marginBottom: 14 }}>
                  <div style={{ width: 44, height: 44, background: '#e2e8f0', borderRadius: 6, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 4, padding: 8 }}>
                    <div style={{ height: 4, background: '#cbd5e1', borderRadius: 2, width: '80%' }} />
                    <div style={{ height: 4, background: '#cbd5e1', borderRadius: 2, width: '60%' }} />
                    <div style={{ height: 4, background: '#cbd5e1', borderRadius: 2, width: '90%' }} />
                  </div>
                  <div style={{ position: 'absolute', top: -6, right: 4, width: 20, height: 16, background: '#cbd5e1', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
                    <div style={{ width: 3, height: 3, borderRadius: '50%', background: '#94a3b8' }} />
                    <div style={{ width: 3, height: 3, borderRadius: '50%', background: '#94a3b8' }} />
                    <div style={{ width: 3, height: 3, borderRadius: '50%', background: '#94a3b8' }} />
                  </div>
                  <div style={{ position: 'absolute', bottom: 6, left: 6, right: 6, height: 16, background: '#cbd5e1', borderRadius: '0 0 6px 6px' }} />
                </div>
                <div style={{ fontSize: '0.86rem', color: 'var(--gray-500)', fontWeight: 500 }}>
                  İade edilebilecek alış faturası bulunamadı
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {returnModalSupplier.purchases.map(p => (
                  <div
                    key={p.id}
                    onClick={() => {
                      addToast({ type: 'success', message: `${p.invoiceNo} numaralı alış faturası için iade talebi oluşturuldu.` });
                      setReturnModalSupplier(null);
                    }}
                    style={{
                      border: '1px solid var(--gray-200)',
                      borderRadius: 8,
                      padding: 12,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      cursor: 'pointer',
                      background: '#fff'
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--gray-900)' }}>Fatura No: {p.invoiceNo}</div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--gray-500)' }}>Tarih: {p.date} · Yöntem: {p.paymentMethod}</div>
                    </div>
                    <div style={{ fontWeight: 700, color: '#0284c7', fontSize: '0.9rem' }}>
                      {formatCurrency(p.total)} ➔ İade Et
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Hareketler Modal */}
      {movementsModalSupplier && (
        <div className="modal-overlay" onClick={() => setMovementsModalSupplier(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 840, width: '95%', maxHeight: '92vh', display: 'flex', flexDirection: 'column', borderRadius: 12 }}>
            {/* Modal Header */}
            <div className="modal-header" style={{ padding: '16px 24px 0', borderBottom: 'none' }}>
              <span className="modal-title" style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--gray-900)' }}>
                Hareketler - {movementsModalSupplier.companyName}
              </span>
              <button className="modal-close" onClick={() => setMovementsModalSupplier(null)}>✕</button>
            </div>

            {/* Sub-Header Tabs */}
            <div style={{ padding: '12px 24px 0', borderBottom: '1px solid var(--gray-200)', display: 'flex', gap: 20 }}>
              <button
                type="button"
                onClick={() => setMovementsTab('kasa')}
                style={{
                  padding: '8px 0',
                  background: 'none',
                  border: 'none',
                  borderBottom: movementsTab === 'kasa' ? '2px solid #0284c7' : '2px solid transparent',
                  fontWeight: 600,
                  fontSize: '0.86rem',
                  color: movementsTab === 'kasa' ? '#0284c7' : 'var(--gray-600)',
                  cursor: 'pointer'
                }}
              >
                Kasa Hareketleri
              </button>
              <button
                type="button"
                onClick={() => setMovementsTab('alis')}
                style={{
                  padding: '8px 0',
                  background: 'none',
                  border: 'none',
                  borderBottom: movementsTab === 'alis' ? '2px solid #0284c7' : '2px solid transparent',
                  fontWeight: 600,
                  fontSize: '0.86rem',
                  color: movementsTab === 'alis' ? '#0284c7' : 'var(--gray-600)',
                  cursor: 'pointer'
                }}
              >
                Alış Hareketleri
              </button>
              <button
                type="button"
                onClick={() => setMovementsTab('satis')}
                style={{
                  padding: '8px 0',
                  background: 'none',
                  border: 'none',
                  borderBottom: movementsTab === 'satis' ? '2px solid #0284c7' : '2px solid transparent',
                  fontWeight: 600,
                  fontSize: '0.86rem',
                  color: movementsTab === 'satis' ? '#0284c7' : 'var(--gray-600)',
                  cursor: 'pointer'
                }}
              >
                Satış Hareketleri
              </button>
              <button
                type="button"
                onClick={() => setMovementsTab('verilen')}
                style={{
                  padding: '8px 0',
                  background: 'none',
                  border: 'none',
                  borderBottom: movementsTab === 'verilen' ? '2px solid #0284c7' : '2px solid transparent',
                  fontWeight: 600,
                  fontSize: '0.86rem',
                  color: movementsTab === 'verilen' ? '#0284c7' : 'var(--gray-600)',
                  cursor: 'pointer'
                }}
              >
                Verilen Cihazlar
              </button>
              <button
                type="button"
                onClick={() => setMovementsTab('gelen')}
                style={{
                  padding: '8px 0',
                  background: 'none',
                  border: 'none',
                  borderBottom: movementsTab === 'gelen' ? '2px solid #0284c7' : '2px solid transparent',
                  fontWeight: 600,
                  fontSize: '0.86rem',
                  color: movementsTab === 'gelen' ? '#0284c7' : 'var(--gray-600)',
                  cursor: 'pointer'
                }}
              >
                Gelen Cihazlar
              </button>
            </div>

            <div className="modal-body" style={{ padding: '16px 24px 30px', overflowY: 'auto' }}>
              {/* Table Header */}
              <div style={{ background: '#fafafa', borderRadius: 8, padding: '10px 14px', border: '1px solid var(--gray-200)', marginBottom: 20 }}>
                {movementsTab === 'kasa' && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1.5fr 1fr 1fr 1.2fr 1fr 1.5fr', fontSize: '0.82rem', fontWeight: 700, color: '#0284c7' }}>
                    <div>İşlem No</div>
                    <div>Tarih ⇅</div>
                    <div>İşlem Tipi</div>
                    <div>Kaynak</div>
                    <div>Tutar ⇅</div>
                    <div>Ödeme Yöntemi</div>
                    <div>Kasa</div>
                    <div>Açıklama</div>
                  </div>
                )}
                {movementsTab === 'alis' && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1.5fr 1fr 1fr 1fr', fontSize: '0.82rem', fontWeight: 700, color: '#0284c7' }}>
                    <div>Fatura No</div>
                    <div>Tarih ⇅</div>
                    <div>Tedarikçi</div>
                    <div>Tutar ⇅</div>
                    <div>Ödeme Yöntemi</div>
                    <div>Ödeme Durumu</div>
                  </div>
                )}
                {movementsTab === 'satis' && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1.5fr 1fr 1fr 1fr', fontSize: '0.82rem', fontWeight: 700, color: '#0284c7' }}>
                    <div>Fatura/İşlem No</div>
                    <div>Tarih ⇅</div>
                    <div>Müşteri/Firma</div>
                    <div>Tutar ⇅</div>
                    <div>Ödeme Yöntemi</div>
                    <div>Durum</div>
                  </div>
                )}
                {movementsTab === 'verilen' && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1.2fr 1fr 1.5fr 1fr 1fr', fontSize: '0.82rem', fontWeight: 700, color: '#0284c7' }}>
                    <div>Cihaz Adı</div>
                    <div>Seri No</div>
                    <div>Tarih ⇅</div>
                    <div>Verilen Taraf</div>
                    <div>Tutar ⇅</div>
                    <div>Durum</div>
                  </div>
                )}
                {movementsTab === 'gelen' && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1.2fr 1fr 1.5fr 1.2fr 1fr', fontSize: '0.82rem', fontWeight: 700, color: '#0284c7' }}>
                    <div>Cihaz Adı</div>
                    <div>Seri No</div>
                    <div>Tarih ⇅</div>
                    <div>Geliş Sebebi</div>
                    <div>Fatura No</div>
                    <div>Durum</div>
                  </div>
                )}
              </div>

              {/* Empty State Tray Graphic */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 20px 20px', textAlign: 'center' }}>
                <div style={{ width: 56, height: 44, background: '#f1f5f9', border: '2px solid #e2e8f0', borderRadius: '4px 4px 8px 8px', position: 'relative', marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ width: 28, height: 6, background: '#cbd5e1', borderRadius: 3, position: 'absolute', top: 6 }} />
                </div>
                <div style={{ fontSize: '0.84rem', color: 'var(--gray-400)', fontWeight: 500 }}>
                  Veri Yok
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
