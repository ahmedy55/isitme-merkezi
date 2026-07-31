'use client';

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Expense } from '../data/mockData';
import { IconSearch, IconPlus, IconEdit, IconDelete, IconFilter, IconCheck, IconWarning, IconDownload } from '../components/Icons';

export default function ExpensesPage() {
  const { expensesList, addExpense, updateExpense, deleteExpense, addToast } = useApp();

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [branchFilter, setBranchFilter] = useState<string>('All');
  const [paymentFilter, setPaymentFilter] = useState<string>('All');

  // Modal states
  const [showModal, setShowModal] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);

  // Form State
  const [formDate, setFormDate] = useState('');
  const [formCategory, setFormCategory] = useState<'Kira' | 'Fatura' | 'Maaş' | 'Malzeme' | 'Bakım & Onarım' | 'Ulaşım' | 'Reklam & Pazarlama' | 'Vergi & Sigorta' | 'Diğer'>('Fatura');
  const [formDescription, setFormDescription] = useState('');
  const [formAmount, setFormAmount] = useState<number>(0);
  const [formPaymentMethod, setFormPaymentMethod] = useState<'Nakit' | 'Havale' | 'Kredi Kartı' | 'Otomatik Ödeme'>('Havale');
  const [formBranch, setFormBranch] = useState<'Merkez 1 - Kadıköy' | 'Merkez 2 - Beşiktaş' | 'Genel'>('Merkez 1 - Kadıköy');
  const [formCreatedBy, setFormCreatedBy] = useState('Dr. Elif Arslan');
  const [formReceiptNo, setFormReceiptNo] = useState('');
  const [formNotes, setFormNotes] = useState('');

  // Form validation errors
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // Component-Level Idempotency Key
  const [formIdempotencyKey, setFormIdempotencyKey] = useState<string>(() =>
    typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `exp-idemp-${Date.now()}`
  );

  const handleOpenAddModal = () => {
    setIsEditing(false);
    setEditingExpenseId(null);
    setFormDate(new Date().toISOString().split('T')[0]);
    setFormCategory('Fatura');
    setFormDescription('');
    setFormAmount(0);
    setFormPaymentMethod('Havale');
    setFormBranch('Merkez 1 - Kadıköy');
    setFormCreatedBy('Dr. Elif Arslan');
    setFormReceiptNo('');
    setFormNotes('');
    setErrors({});
    setFormIdempotencyKey(typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `exp-idemp-${Date.now()}`);
    setShowModal(true);
  };

  const handleOpenEditModal = (expense: Expense) => {
    setIsEditing(true);
    setEditingExpenseId(expense.id);
    setFormDate(expense.date);
    setFormCategory(expense.category);
    setFormDescription(expense.description);
    setFormAmount(expense.amount);
    setFormPaymentMethod(expense.paymentMethod);
    setFormBranch(expense.branch);
    setFormCreatedBy(expense.createdBy);
    setFormReceiptNo(expense.receiptNo || '');
    setFormNotes(expense.notes || '');
    setErrors({});
    setShowModal(true);
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    if (!formDate) newErrors.date = 'Tarih seçilmelidir';
    if (!formDescription.trim()) newErrors.description = 'Açıklama girilmelidir';
    if (formAmount <= 0) newErrors.amount = 'Tutar 0\'dan büyük olmalıdır';
    if (!formCreatedBy.trim()) newErrors.createdBy = 'Masrafı kaydeden kişi zorunludur';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    if (isEditing && editingExpenseId) {
      const updated: Expense = {
        id: editingExpenseId,
        date: formDate,
        category: formCategory,
        description: formDescription,
        amount: formAmount,
        paymentMethod: formPaymentMethod,
        branch: formBranch,
        createdBy: formCreatedBy,
        receiptNo: formReceiptNo || undefined,
        notes: formNotes || undefined
      };
      updateExpense(updated);
      addToast({ type: 'success', message: 'Masraf başarıyla güncellendi.' });
    } else {
      const newExpense: Expense & { idempotencyKey?: string } = {
        id: 'exp-' + Math.floor(Math.random() * 1000000),
        date: formDate,
        category: formCategory,
        description: formDescription,
        amount: formAmount,
        paymentMethod: formPaymentMethod,
        branch: formBranch,
        createdBy: formCreatedBy,
        receiptNo: formReceiptNo || undefined,
        notes: formNotes || undefined,
        idempotencyKey: formIdempotencyKey
      };
      addExpense(newExpense);
      addToast({ type: 'success', message: 'Masraf kaydı başarıyla oluşturuldu.' });
    }
    setShowModal(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('Bu masraf kaydını silmek istediğinize emin misiniz?')) {
      deleteExpense(id);
      addToast({ type: 'warning', message: 'Masraf kaydı silindi.' });
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', minimumFractionDigits: 0 }).format(val);
  };

  // Filters logic
  const filteredExpenses = expensesList.filter(e => {
    const matchesSearch = 
      e.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (e.receiptNo && e.receiptNo.toLowerCase().includes(searchTerm.toLowerCase())) ||
      e.createdBy.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory = categoryFilter === 'All' || e.category === categoryFilter;
    const matchesBranch = branchFilter === 'All' || e.branch === branchFilter;
    const matchesPayment = paymentFilter === 'All' || e.paymentMethod === paymentFilter;

    return matchesSearch && matchesCategory && matchesBranch && matchesPayment;
  });

  const totalExpense = filteredExpenses.reduce((acc, curr) => acc + curr.amount, 0);

  // Group by categories for preview stats
  const categorySummary = filteredExpenses.reduce((acc, curr) => {
    acc[curr.category] = (acc[curr.category] || 0) + curr.amount;
    return acc;
  }, {} as { [key: string]: number });

  return (
    <div className="page">
      <div className="page-header">
        <div className="page-header-left">
          <h2>Masraf & Gider Yönetimi</h2>
          <p>Kira, faturalar, maaşlar ve genel işletme giderleri</p>
        </div>
        <button className="btn btn-primary" onClick={handleOpenAddModal} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <IconPlus size={16} strokeWidth={2} /> Yeni Gider Kaydet
        </button>
      </div>

      {/* Stats Cards */}
      <div className="stats-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 20 }}>
        <div className="card stat-card" style={{ gridColumn: 'span 2' }}>
          <div className="card-body" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px' }}>
            <div>
              <div style={{ fontSize: '0.86rem', color: 'var(--gray-500)', fontWeight: 600 }}>Filtrelenmiş Toplam Harcama</div>
              <div style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--danger-600)', marginTop: 4 }}>
                {formatCurrency(totalExpense)}
              </div>
            </div>
            <div style={{ padding: 14, borderRadius: 'var(--radius-lg)', background: 'var(--danger-50)', color: 'var(--danger-600)' }}>
              <IconDelete size={32} />
            </div>
          </div>
        </div>

        {/* Small breakdowns */}
        <div className="card">
          <div className="card-body" style={{ padding: 14 }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--gray-400)', fontWeight: 600, textTransform: 'uppercase', marginBottom: 8 }}>Kira & Faturalar</div>
            <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--gray-800)' }}>
              {formatCurrency((categorySummary['Kira'] || 0) + (categorySummary['Fatura'] || 0))}
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body" style={{ padding: 14 }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--gray-400)', fontWeight: 600, textTransform: 'uppercase', marginBottom: 8 }}>Maaş & Hizmet</div>
            <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--gray-800)' }}>
              {formatCurrency(categorySummary['Maaş'] || 0)}
            </div>
          </div>
        </div>
      </div>

      {/* Gider Kategori Dağılım Progress Çubukları */}
      {Object.keys(categorySummary).length > 0 && (
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="card-header" style={{ padding: '12px 16px', borderBottom: '1px solid var(--surface-border-light)' }}>
            <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--gray-700)' }}>Kategorilere Göre Dağılım</span>
          </div>
          <div className="card-body" style={{ padding: '16px 20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
            {Object.entries(categorySummary).map(([cat, amt]) => {
              const percentage = Math.round((amt / (totalExpense || 1)) * 100);
              return (
                <div key={cat} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.84rem' }}>
                    <span style={{ fontWeight: 600, color: 'var(--gray-700)' }}>{cat}</span>
                    <span style={{ color: 'var(--gray-500)', fontWeight: 500 }}>{formatCurrency(amt)} ({percentage}%)</span>
                  </div>
                  <div style={{ height: 6, width: '100%', background: 'var(--gray-100)', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${percentage}%`, background: 'var(--danger-500)', borderRadius: 3 }}></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Filters Options */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-body" style={{ padding: 16 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
            <div style={{ flex: 1, minWidth: 240, position: 'relative' }}>
              <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-400)' }}>
                <IconSearch size={18} />
              </span>
              <input
                className="form-input"
                placeholder="Açıklama, Fiş No veya kaydeden ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ paddingLeft: 38, width: '100%', margin: 0 }}
              />
            </div>

            <div style={{ minWidth: 150 }}>
              <select className="form-input" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} style={{ margin: 0 }}>
                <option value="All">Tüm Kategoriler</option>
                <option value="Kira">Kira</option>
                <option value="Fatura">Fatura</option>
                <option value="Maaş">Maaş</option>
                <option value="Malzeme">Malzeme</option>
                <option value="Bakım & Onarım">Bakım & Onarım</option>
                <option value="Ulaşım">Ulaşım</option>
                <option value="Reklam & Pazarlama">Reklam & Pazarlama</option>
                <option value="Vergi & Sigorta">Vergi & Sigorta</option>
                <option value="Diğer">Diğer</option>
              </select>
            </div>

            <div style={{ minWidth: 150 }}>
              <select className="form-input" value={branchFilter} onChange={(e) => setBranchFilter(e.target.value)} style={{ margin: 0 }}>
                <option value="All">Tüm Şubeler</option>
                <option value="Merkez 1 - Kadıköy">Merkez 1 - Kadıköy</option>
                <option value="Merkez 2 - Beşiktaş">Merkez 2 - Beşiktaş</option>
                <option value="Genel">Genel (Tüm Şirket)</option>
              </select>
            </div>

            <div style={{ minWidth: 150 }}>
              <select className="form-input" value={paymentFilter} onChange={(e) => setPaymentFilter(e.target.value)} style={{ margin: 0 }}>
                <option value="All">Tüm Ödeme Türleri</option>
                <option value="Nakit">Nakit</option>
                <option value="Havale">Havale</option>
                <option value="Kredi Kartı">Kredi Kartı</option>
                <option value="Otomatik Ödeme">Otomatik Ödeme</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Expenses Table */}
      <div className="card">
        <div className="card-body" style={{ padding: 0, overflowX: 'auto' }}>
          <table className="table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: 'var(--gray-50)', borderBottom: '1px solid var(--surface-border)' }}>
                <th style={{ padding: '12px 16px', fontWeight: 600, fontSize: '0.84rem', color: 'var(--gray-600)' }}>Açıklama</th>
                <th style={{ padding: '12px 16px', fontWeight: 600, fontSize: '0.84rem', color: 'var(--gray-600)' }}>Kategori</th>
                <th style={{ padding: '12px 16px', fontWeight: 600, fontSize: '0.84rem', color: 'var(--gray-600)' }}>Şube</th>
                <th style={{ padding: '12px 16px', fontWeight: 600, fontSize: '0.84rem', color: 'var(--gray-600)' }}>Tarih</th>
                <th style={{ padding: '12px 16px', fontWeight: 600, fontSize: '0.84rem', color: 'var(--gray-600)' }}>Ödeme Yöntemi</th>
                <th style={{ padding: '12px 16px', fontWeight: 600, fontSize: '0.84rem', color: 'var(--gray-600)' }}>Tutar</th>
                <th style={{ padding: '12px 16px', fontWeight: 600, fontSize: '0.84rem', color: 'var(--gray-600)' }}>Kaydeden</th>
                <th style={{ padding: '12px 16px', fontWeight: 600, fontSize: '0.84rem', color: 'var(--gray-600)', textAlign: 'right' }}>İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ padding: 40, textAlign: 'center', color: 'var(--gray-400)' }}>
                    Filtrelere uygun masraf/gider kaydı bulunamadı.
                  </td>
                </tr>
              ) : (
                filteredExpenses.map((exp) => (
                  <tr key={exp.id} style={{ borderBottom: '1px solid var(--surface-border-light)' }}>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ fontWeight: 600, color: 'var(--gray-800)' }}>{exp.description}</div>
                      {exp.receiptNo && <div style={{ fontSize: '0.78rem', color: 'var(--gray-400)' }}>Evrak/Fiş No: {exp.receiptNo}</div>}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span className="badge" style={{
                        background: 'var(--danger-50)',
                        color: 'var(--danger-600)',
                        padding: '4px 8px',
                        borderRadius: 4,
                        fontSize: '0.8rem',
                        fontWeight: 600
                      }}>
                        {exp.category}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: '0.86rem', color: 'var(--gray-700)' }}>
                      {exp.branch}
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: '0.86rem', color: 'var(--gray-700)' }}>
                      {new Date(exp.date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: '0.86rem', color: 'var(--gray-700)' }}>
                      {exp.paymentMethod}
                    </td>
                    <td style={{ padding: '14px 16px', fontWeight: 700, color: 'var(--danger-600)' }}>
                      {formatCurrency(exp.amount)}
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: '0.82rem', color: 'var(--gray-500)' }}>
                      {exp.createdBy}
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6 }}>
                        <button
                          className="btn-icon"
                          onClick={() => handleOpenEditModal(exp)}
                          style={{ color: 'var(--primary-500)', padding: 6 }}
                          title="Gideri Düzenle"
                        >
                          <IconEdit size={16} />
                        </button>
                        <button
                          className="btn-icon"
                          onClick={() => handleDelete(exp.id)}
                          style={{ color: 'var(--danger-500)', padding: 6 }}
                          title="Gideri Sil"
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

      {/* Add / Edit Expense Modal */}
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
                {isEditing ? 'Gider Kaydını Düzenle' : 'Yeni Gider Kaydı Oluştur'}
              </span>
              <button onClick={() => setShowModal(false)} style={{ color: 'var(--gray-400)', fontSize: '1.4rem' }}>&times;</button>
            </div>
            <form onSubmit={handleSave}>
              <div className="card-body" style={{ padding: 20 }}>
                <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
                  <div className="form-group" style={{ flex: 1, margin: 0 }}>
                    <label className="form-label">Tarih</label>
                    <input
                      type="date"
                      className="form-input"
                      value={formDate}
                      onChange={(e) => setFormDate(e.target.value)}
                    />
                    {errors.date && <span style={{ fontSize: '0.78rem', color: 'var(--danger-500)' }}>{errors.date}</span>}
                  </div>
                  <div className="form-group" style={{ flex: 1, margin: 0 }}>
                    <label className="form-label">Kategori</label>
                    <select
                      className="form-input"
                      value={formCategory}
                      onChange={(e) => setFormCategory(e.target.value as any)}
                    >
                      <option value="Kira">Kira</option>
                      <option value="Fatura">Fatura</option>
                      <option value="Maaş">Maaş</option>
                      <option value="Malzeme">Malzeme</option>
                      <option value="Bakım & Onarım">Bakım & Onarım</option>
                      <option value="Ulaşım">Ulaşım</option>
                      <option value="Reklam & Pazarlama">Reklam & Pazarlama</option>
                      <option value="Vergi & Sigorta">Vergi & Sigorta</option>
                      <option value="Diğer">Diğer</option>
                    </select>
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: 12 }}>
                  <label className="form-label">Açıklama</label>
                  <input
                    className="form-input"
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    placeholder="Örn: Kadıköy şubesi su faturası"
                  />
                  {errors.description && <span style={{ fontSize: '0.78rem', color: 'var(--danger-500)' }}>{errors.description}</span>}
                </div>

                <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
                  <div className="form-group" style={{ flex: 1, margin: 0 }}>
                    <label className="form-label">Tutar (TL)</label>
                    <input
                      type="number"
                      className="form-input"
                      value={formAmount}
                      onChange={(e) => setFormAmount(Number(e.target.value))}
                    />
                    {errors.amount && <span style={{ fontSize: '0.78rem', color: 'var(--danger-500)' }}>{errors.amount}</span>}
                  </div>
                  <div className="form-group" style={{ flex: 1, margin: 0 }}>
                    <label className="form-label">Ödeme Türü</label>
                    <select
                      className="form-input"
                      value={formPaymentMethod}
                      onChange={(e) => setFormPaymentMethod(e.target.value as any)}
                    >
                      <option value="Havale">Havale</option>
                      <option value="Nakit">Nakit</option>
                      <option value="Kredi Kartı">Kredi Kartı</option>
                      <option value="Otomatik Ödeme">Otomatik Ödeme</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
                  <div className="form-group" style={{ flex: 1, margin: 0 }}>
                    <label className="form-label">Şube / Bölüm</label>
                    <select
                      className="form-input"
                      value={formBranch}
                      onChange={(e) => setFormBranch(e.target.value as any)}
                    >
                      <option value="Merkez 1 - Kadıköy">Merkez 1 - Kadıköy</option>
                      <option value="Merkez 2 - Beşiktaş">Merkez 2 - Beşiktaş</option>
                      <option value="Genel">Genel</option>
                    </select>
                  </div>
                  <div className="form-group" style={{ flex: 1, margin: 0 }}>
                    <label className="form-label">Evrak / Fiş No</label>
                    <input
                      className="form-input"
                      value={formReceiptNo}
                      onChange={(e) => setFormReceiptNo(e.target.value)}
                      placeholder="İsteğe bağlı"
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
                  <div className="form-group" style={{ flex: 1, margin: 0 }}>
                    <label className="form-label">Kaydeden Personel</label>
                    <input
                      className="form-input"
                      value={formCreatedBy}
                      onChange={(e) => setFormCreatedBy(e.target.value)}
                    />
                    {errors.createdBy && <span style={{ fontSize: '0.78rem', color: 'var(--danger-500)' }}>{errors.createdBy}</span>}
                  </div>
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Notlar</label>
                  <input
                    className="form-input"
                    value={formNotes}
                    onChange={(e) => setFormNotes(e.target.value)}
                    placeholder="İsteğe bağlı ek açıklama"
                  />
                </div>
              </div>

              <div className="card-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, padding: '12px 20px', borderTop: '1px solid var(--surface-border)' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>İptal</button>
                <button type="submit" className="btn btn-primary">Gideri Kaydet</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
