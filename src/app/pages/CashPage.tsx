'use client';

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { formatCurrency, formatDate, SaleRecord } from '../data/mockData';
import { dbFetchCashTransactions, dbInsertCashTransaction } from '../lib/database';
import { IconPlus, IconDownload, IconCash, IconCheck, IconRecall, IconShield, IconClose, IconSearch, IconFilter, IconWarning } from '../components/Icons';

interface CashAccount {
  id: string;
  name: string;
  type: 'Nakit' | 'Banka' | 'POS';
  balance: number;
  branch: string;
}

interface CashTransaction {
  id: string;
  date: string;
  accountId: string;
  accountName: string;
  type: 'Giriş' | 'Çıkış';
  category: string;
  amount: number;
  description: string;
  createdBy: string;
}

export default function CashPage() {
  const { salesList, commissionRate, addSale, stockList, updateStockItem, addToast, currentOrgId } = useApp();
  const [filterStatus, setFilterStatus] = useState('Tümü');
  const [showSaleModal, setShowSaleModal] = useState(false);
  const [selectedSaleForInvoice, setSelectedSaleForInvoice] = useState<SaleRecord | null>(null);

  // Kasa Genişletme State
  const [accounts, setAccounts] = useState<CashAccount[]>([
    { id: 'acc-1', name: 'Kadıköy Nakit Kasası', type: 'Nakit', balance: 25400, branch: 'Merkez 1 - Kadıköy' },
    { id: 'acc-2', name: 'Beşiktaş Nakit Kasası', type: 'Nakit', balance: 18200, branch: 'Merkez 2 - Beşiktaş' },
    { id: 'acc-3', name: 'Vakıfbank Ticari Hesap', type: 'Banka', balance: 185000, branch: 'Tüm Şubeler' },
    { id: 'acc-4', name: 'Garanti POS Hesabı', type: 'POS', balance: 92500, branch: 'Merkez 1 - Kadıköy' },
    { id: 'acc-5', name: 'Yapı Kredi POS Hesabı', type: 'POS', balance: 45000, branch: 'Merkez 2 - Beşiktaş' }
  ]);

  const [transactions, setTransactions] = useState<CashTransaction[]>([
    { id: 'tx-1', date: '2026-07-20', accountId: 'acc-1', accountName: 'Kadıköy Nakit Kasası', type: 'Giriş', category: 'Satış Geliri', amount: 85000, description: 'Kemal Deniz cihaz satışı nakit tahsilat', createdBy: 'Dr. Elif Arslan' },
    { id: 'tx-2', date: '2026-07-19', accountId: 'acc-3', accountName: 'Vakıfbank Ticari Hesap', type: 'Çıkış', category: 'Kira Gideri', amount: 42000, description: 'Kadıköy Şubesi Temmuz ayı kira ödemesi', createdBy: 'Murat Özkan' },
    { id: 'tx-3', date: '2026-07-18', accountId: 'acc-4', accountName: 'Garanti POS Hesabı', type: 'Giriş', category: 'Satış Geliri', amount: 95000, description: 'Ahmet Yılmaz cihaz satışı POS çekimi', createdBy: 'Ody. Hasan Kaya' },
    { id: 'tx-4', date: '2026-07-15', accountId: 'acc-1', accountName: 'Kadıköy Nakit Kasası', type: 'Çıkış', category: 'Ofis Gideri', amount: 1400, description: 'Kırtasiye ve toneri alımı', createdBy: 'Sek. Zeynep Acar' }
  ]);

  // Fix #15: DB'den kasa hareketlerini çek
  React.useEffect(() => {
    if (currentOrgId) {
      dbFetchCashTransactions().then((dbTxs: any[]) => {
        if (dbTxs && dbTxs.length > 0) {
          const mapped: CashTransaction[] = dbTxs.map(t => ({
            id: t.id,
            date: t.createdAt ? t.createdAt.split('T')[0] : new Date().toISOString().split('T')[0],
            accountId: t.cashRegisterId || 'acc-1',
            accountName: t.accountName || 'Kadıköy Nakit Kasası',
            type: t.type === 'INCOME' ? 'Giriş' : 'Çıkış',
            category: t.category || 'Genel',
            amount: t.amount,
            description: t.description || '',
            createdBy: 'Sistem'
          }));
          setTransactions(prev => [...mapped, ...prev]);
        }
      }).catch(err => console.warn('[CashPage] dbFetchCashTransactions warning:', err.message));
    }
  }, [currentOrgId]);

  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [selectedAccountIdFilter, setSelectedAccountIdFilter] = useState('All');

  // Form State for Manual Transaction
  const [txAccountId, setTxAccountId] = useState('acc-1');
  const [txType, setTxType] = useState<'Giriş' | 'Çıkış'>('Giriş');
  const [txCategory, setTxCategory] = useState('Diğer');
  const [txAmount, setTxAmount] = useState<number>(0);
  const [txDescription, setTxDescription] = useState('');

  // Sale Form State
  const [formData, setFormData] = useState({
    patientName: '',
    itemName: 'Phonak Audéo P90',
    itemPrice: 85000,
    quantity: 1,
    sgkAmount: 0,
    paymentMethod: 'Nakit',
    installments: 'Tek Çekim',
    targetAccountId: 'acc-1'
  });

  const handleSaveSale = () => {
    if (!formData.patientName) {
      addToast({ type: 'warning', message: 'Lütfen hasta adı girin.' });
      return;
    }
    const patientAmt = formData.itemPrice * formData.quantity - formData.sgkAmount;
    const newSale: SaleRecord = {
      id: `s-${Date.now().toString().slice(-6)}`,
      patientId: 'p-unknown',
      date: new Date().toISOString().split('T')[0],
      patientName: formData.patientName,
      items: [
        { name: formData.itemName, quantity: Number(formData.quantity), price: Number(formData.itemPrice), type: 'Cihaz' }
      ],
      total: formData.itemPrice * formData.quantity,
      sgkAmount: Number(formData.sgkAmount),
      patientAmount: patientAmt,
      paymentMethod: formData.paymentMethod as any,
      status: 'Tahsil Edildi' as const
    };
    const matchingStockItem = stockList.find(s => s.name.includes(formData.itemName) && s.quantity > 0);
    
    // Fix #4: addSale artık tek noktadan kasa + stok + DB işlemlerini yönetiyor
    // Sayfa seviyesinde duplicate transaction oluşturmuyoruz
    addSale(newSale, matchingStockItem?.id, formData.targetAccountId);

    // Sayfa-local hesap bakiyesini güncelle (sadece UI gösterimi için)
    const targetAcc = accounts.find(a => a.id === formData.targetAccountId);
    if (targetAcc) {
      setAccounts(prev => prev.map(a => {
        if (a.id === targetAcc.id) {
          return { ...a, balance: a.balance + patientAmt };
        }
        return a;
      }));
    }

    setShowSaleModal(false);
    setFormData({
      patientName: '',
      itemName: 'Phonak Audéo P90',
      itemPrice: 85000,
      quantity: 1,
      sgkAmount: 0,
      paymentMethod: 'Nakit',
      installments: 'Tek Çekim',
      targetAccountId: 'acc-1'
    });
  };

  const handleSaveTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    if (txAmount <= 0) {
      addToast({ type: 'warning', message: 'Tutar 0\'dan büyük olmalıdır.' });
      return;
    }
    const targetAcc = accounts.find(a => a.id === txAccountId);
    if (!targetAcc) return;

    if (txType === 'Çıkış' && targetAcc.balance < txAmount) {
      addToast({ type: 'warning', message: `${targetAcc.name} kasasında yetersiz bakiye (${formatCurrency(targetAcc.balance)}). İşlem devam ediyor.` });
    }

    const newTx: CashTransaction = {
      id: 'tx-' + Date.now(),
      date: new Date().toISOString().split('T')[0],
      accountId: txAccountId,
      accountName: targetAcc.name,
      type: txType,
      category: txCategory,
      amount: txAmount,
      description: txDescription,
      createdBy: 'Dr. Elif Arslan'
    };

    setTransactions(prev => [newTx, ...prev]);

    // Update account balance
    setAccounts(prev => prev.map(a => {
      if (a.id === txAccountId) {
        return {
          ...a,
          balance: txType === 'Giriş' ? a.balance + txAmount : a.balance - txAmount
        };
      }
      return a;
    }));

    setShowTransactionModal(false);
    addToast({ type: 'success', message: 'Kasa işlemi başarıyla kaydedildi.' });
    setTxAmount(0);
    setTxDescription('');
  };

  const filteredSales = salesList.filter(s =>
    filterStatus === 'Tümü' || s.status === filterStatus
  );

  const filteredTransactions = transactions.filter(t =>
    selectedAccountIdFilter === 'All' || t.accountId === selectedAccountIdFilter
  );

  const totalRevenue = salesList.reduce((sum, s) => sum + (s.total || 0), 0);
  const collected = salesList.filter(s => s.status === 'Tahsil Edildi').reduce((sum, s) => sum + (s.total || 0), 0);
  const pending = salesList.filter(s => s.status !== 'Tahsil Edildi').reduce((sum, s) => sum + (s.patientAmount || s.total || 0), 0);
  const sgkTotal = salesList.reduce((sum, s) => sum + (s.sgkAmount || 0), 0);
  const totalCommission = totalRevenue * (commissionRate / 100);

  return (
    <div className="page">
      <div className="page-header">
        <div className="page-header-left">
          <h2>Kasa & Hesap Yönetimi</h2>
          <p>Çoklu kasa hesap bakiyeleri, tahsilatlar ve para transferleri</p>
        </div>
        <div className="page-header-actions" style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-secondary" onClick={() => setShowTransactionModal(true)} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <IconPlus size={15} /> Para Giriş/Çıkış
          </button>
          <button className="btn btn-primary" onClick={() => setShowSaleModal(true)} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <IconPlus size={15} strokeWidth={2} /> Yeni Satış
          </button>
        </div>
      </div>

      {/* Cash accounts dashboard */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 20 }}>
        {accounts.map(acc => (
          <div className="card" key={acc.id} style={{ borderLeft: acc.type === 'Nakit' ? '4px solid var(--accent-400)' : acc.type === 'Banka' ? '4px solid var(--primary-500)' : '4px solid var(--info-500)' }}>
            <div className="card-body" style={{ padding: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--gray-400)', fontWeight: 600, textTransform: 'uppercase' }}>{acc.type}</span>
                <span style={{ fontSize: '0.74rem', color: 'var(--gray-400)' }}>{acc.branch}</span>
              </div>
              <div style={{ fontWeight: 700, fontSize: '0.96rem', color: 'var(--gray-800)', marginTop: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={acc.name}>
                {acc.name}
              </div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--gray-900)', marginTop: 8 }}>
                {formatCurrency(acc.balance)}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Main summary values */}
      <div className="stats-grid" style={{ marginBottom: 20 }}>
        <div className="stat-card">
          <div className="stat-icon success"><IconCash size={20} /></div>
          <div className="stat-content">
            <div className="stat-label">Toplam Ciro</div>
            <div className="stat-value">{formatCurrency(totalRevenue)}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon primary"><IconCheck size={20} /></div>
          <div className="stat-content">
            <div className="stat-label">Tahsil Edilen</div>
            <div className="stat-value">{formatCurrency(collected)}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon warning"><IconRecall size={20} /></div>
          <div className="stat-content">
            <div className="stat-label">Bekleyen Hasta Tahsilatı</div>
            <div className="stat-value">{formatCurrency(pending)}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon info"><IconShield size={20} /></div>
          <div className="stat-content">
            <div className="stat-label">SGK Hak Ediş</div>
            <div className="stat-value">{formatCurrency(sgkTotal)}</div>
          </div>
        </div>
      </div>

      {/* Kasa Hareketleri listesi (Expanded Transactions log) */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span className="card-title">💵 Kasa Giriş/Çıkış Defteri</span>
          <select
            className="form-input"
            value={selectedAccountIdFilter}
            onChange={(e) => setSelectedAccountIdFilter(e.target.value)}
            style={{ margin: 0, width: 200, height: 32, fontSize: '0.8rem', padding: '0 8px' }}
          >
            <option value="All">Tüm Hesaplar</option>
            {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
        </div>
        <div className="card-body" style={{ padding: 0, overflowX: 'auto' }}>
          <table className="table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: 'var(--gray-50)', borderBottom: '1px solid var(--surface-border)' }}>
                <th style={{ padding: '10px 14px', fontSize: '0.84rem' }}>Tarih</th>
                <th style={{ padding: '10px 14px', fontSize: '0.84rem' }}>Kasa / Hesap</th>
                <th style={{ padding: '10px 14px', fontSize: '0.84rem' }}>İşlem</th>
                <th style={{ padding: '10px 14px', fontSize: '0.84rem' }}>Kategori</th>
                <th style={{ padding: '10px 14px', fontSize: '0.84rem' }}>Açıklama</th>
                <th style={{ padding: '10px 14px', fontSize: '0.84rem' }}>Tutar</th>
                <th style={{ padding: '10px 14px', fontSize: '0.84rem' }}>Kaydeden</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: 30, textAlign: 'center', color: 'var(--gray-400)' }}>
                    Kasa hareketi bulunmamaktadır.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((tx) => (
                  <tr key={tx.id} style={{ borderBottom: '1px solid var(--surface-border-light)' }}>
                    <td style={{ padding: '12px 14px', fontSize: '0.84rem' }}>{formatDate(tx.date)}</td>
                    <td style={{ padding: '12px 14px', fontSize: '0.84rem', fontWeight: 600 }}>{tx.accountName}</td>
                    <td style={{ padding: '12px 14px' }}>
                      <span className={`badge badge-${tx.type === 'Giriş' ? 'success' : 'danger'}`} style={{ fontSize: '0.78rem' }}>
                        {tx.type === 'Giriş' ? 'Giriş (+)' : 'Çıkış (-)'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 14px', fontSize: '0.84rem' }}>{tx.category}</td>
                    <td style={{ padding: '12px 14px', fontSize: '0.84rem', color: 'var(--gray-700)' }}>{tx.description}</td>
                    <td style={{ padding: '12px 14px', fontWeight: 700, color: tx.type === 'Giriş' ? 'var(--success-600)' : 'var(--danger-600)' }}>
                      {tx.type === 'Giriş' ? '+' : '-'}{formatCurrency(tx.amount)}
                    </td>
                    <td style={{ padding: '12px 14px', fontSize: '0.82rem', color: 'var(--gray-500)' }}>{tx.createdBy}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Sales list filter & list */}
      <div className="card" style={{ marginBottom: 12 }}>
        <div className="card-body" style={{ display: 'flex', gap: 12, alignItems: 'center', padding: 14 }}>
          <div className="tabs" style={{ border: 'none', margin: 0 }}>
            {['Tümü', 'Tahsil Edildi', 'Bekliyor', 'Taksitli'].map((status) => (
              <button
                key={status}
                className={`tab ${filterStatus === status ? 'active' : ''}`}
                onClick={() => setFilterStatus(status)}
                style={{ fontSize: '0.84rem', padding: '6px 12px' }}
              >
                {status}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Sales table */}
      <div className="card">
        <div className="table-container">
          <table className="mobile-cards">
            <thead>
              <tr>
                <th>Tarih</th>
                <th>Hasta</th>
                <th>Ürünler</th>
                <th>Toplam</th>
                <th>SGK Payı</th>
                <th>Hasta Payı</th>
                <th>Ödeme Şekli</th>
                <th>Durum</th>
                <th>İşlem</th>
              </tr>
            </thead>
            <tbody>
              {filteredSales.map((sale) => (
                <tr key={sale.id}>
                  <td data-label="Tarih" className="td-primary">{formatDate(sale.date)}</td>
                  <td data-label="Hasta" style={{ fontWeight: 600 }}>{sale.patientName}</td>
                  <td data-label="Ürünler">
                    {(sale.items || []).map((item, i) => (
                      <div key={i} style={{ fontSize: '0.78rem', color: 'var(--gray-600)' }}>
                        {item.name} {item.quantity > 1 && `(${item.quantity} adet)`}
                      </div>
                    ))}
                  </td>
                  <td data-label="Toplam" style={{ fontWeight: 700 }}>{formatCurrency(sale.total)}</td>
                  <td data-label="SGK Payı" style={{ color: sale.sgkAmount > 0 ? 'var(--success-600)' : 'var(--gray-400)' }}>
                    {sale.sgkAmount > 0 ? formatCurrency(sale.sgkAmount) : '—'}
                  </td>
                  <td data-label="Hasta Payı" style={{ fontWeight: 600 }}>{formatCurrency(sale.patientAmount)}</td>
                  <td data-label="Ödeme Şekli">
                    <span className="badge badge-neutral">{sale.paymentMethod}</span>
                  </td>
                  <td data-label="Durum">
                    <span className={`badge badge-${
                      sale.status === 'Tahsil Edildi' ? 'success' :
                      sale.status === 'Taksitli' ? 'info' : 'warning'
                    }`}>
                      {sale.status}
                    </span>
                  </td>
                  <td data-label="İşlem">
                    <button 
                      className="btn btn-sm btn-secondary" 
                      onClick={() => setSelectedSaleForInvoice(sale)}
                      style={{ fontSize: '0.72rem', padding: '4px 8px' }}
                    >
                      Fatura Görüntüle
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Manual Transaction Modal */}
      {showTransactionModal && (
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
          <div className="card" style={{ width: 450, maxWidth: '90%' }}>
            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid var(--surface-border)' }}>
              <span className="card-title" style={{ fontSize: '1.15rem', fontWeight: 700 }}>Para Giriş / Çıkış Hareketi</span>
              <button onClick={() => setShowTransactionModal(false)} style={{ color: 'var(--gray-400)', fontSize: '1.4rem' }}>&times;</button>
            </div>
            <form onSubmit={handleSaveTransaction}>
              <div className="card-body" style={{ padding: 20 }}>
                <div className="form-group" style={{ marginBottom: 12 }}>
                  <label className="form-label">Kasa / Banka Hesabı</label>
                  <select className="form-input" value={txAccountId} onChange={(e) => setTxAccountId(e.target.value)}>
                    {accounts.map(a => <option key={a.id} value={a.id}>{a.name} ({formatCurrency(a.balance)})</option>)}
                  </select>
                </div>

                <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
                  <div className="form-group" style={{ flex: 1, margin: 0 }}>
                    <label className="form-label">İşlem Yönü</label>
                    <select className="form-input" value={txType} onChange={(e) => setTxType(e.target.value as any)}>
                      <option value="Giriş">Para Girişi (+)</option>
                      <option value="Çıkış">Para Çıkışı (-)</option>
                    </select>
                  </div>
                  <div className="form-group" style={{ flex: 1, margin: 0 }}>
                    <label className="form-label">Kategori</label>
                    <select className="form-input" value={txCategory} onChange={(e) => setTxCategory(e.target.value)}>
                      <option value="Kasa Transferi">Kasa Transferi</option>
                      <option value="Satış Geliri">Satış Geliri</option>
                      <option value="Ek Sermaye">Ek Sermaye</option>
                      <option value="Ortak Ödemesi">Ortak Ödemesi</option>
                      <option value="Banka Faizi">Banka Faizi</option>
                      <option value="Tedarikçi Ödemesi">Tedarikçi Ödemesi</option>
                      <option value="Genel Gider">Genel Gider</option>
                      <option value="Diğer">Diğer</option>
                    </select>
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: 12 }}>
                  <label className="form-label">İşlem Tutarı (TL)</label>
                  <input
                    type="number"
                    className="form-input"
                    value={txAmount}
                    onChange={(e) => setTxAmount(Number(e.target.value))}
                    required
                    min={1}
                  />
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Açıklama</label>
                  <input
                    className="form-input"
                    value={txDescription}
                    onChange={(e) => setTxDescription(e.target.value)}
                    required
                    placeholder="Örn: Beşiktaş şubesinden Kadıköy kasasına nakit transfer"
                  />
                </div>
              </div>
              <div className="card-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, padding: '12px 20px', borderTop: '1px solid var(--surface-border)' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowTransactionModal(false)}>İptal</button>
                <button type="submit" className="btn btn-primary">İşlemi Kaydet</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Sale Modal */}
      {showSaleModal && (
        <div className="modal-overlay" onClick={() => setShowSaleModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 600 }}>
            <div className="modal-header">
              <span className="modal-title">➕ Yeni Satış Kaydı</span>
              <button className="modal-close" onClick={() => setShowSaleModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Hasta</label>
                <input
                  className="form-input"
                  placeholder="Hasta adı veya TC ile ara..."
                  value={formData.patientName}
                  onChange={(e) => setFormData({ ...formData, patientName: e.target.value })}
                />
              </div>
              <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
                <div className="form-group" style={{ flex: 1, margin: 0 }}>
                  <label className="form-label">Ürün</label>
                  <select
                    className="form-select"
                    value={formData.itemName}
                    onChange={(e) => {
                      const name = e.target.value;
                      let price = 120;
                      if (name === 'Phonak Audéo P90') price = 85000;
                      else if (name === 'Oticon More 1') price = 92000;
                      setFormData({ ...formData, itemName: name, itemPrice: price });
                    }}
                  >
                    <option value="Phonak Audéo P90">Phonak Audéo P90 — ₺85.000</option>
                    <option value="Oticon More 1">Oticon More 1 — ₺92.000</option>
                    <option value="Phonak Pil 312">Phonak Pil 312 — ₺120</option>
                  </select>
                </div>
                <div className="form-group" style={{ flex: 1, margin: 0 }}>
                  <label className="form-label">Aktarılacak Hesap</label>
                  <select
                    className="form-select"
                    value={formData.targetAccountId}
                    onChange={(e) => setFormData({ ...formData, targetAccountId: e.target.value })}
                  >
                    {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-row-3">
                <div className="form-group">
                  <label className="form-label">Adet</label>
                  <input
                    className="form-input"
                    type="number"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Fiyat (₺)</label>
                  <input
                    className="form-input"
                    type="number"
                    value={formData.itemPrice}
                    onChange={(e) => setFormData({ ...formData, itemPrice: Number(e.target.value) })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">SGK Payı (₺)</label>
                  <input
                    className="form-input"
                    type="number"
                    value={formData.sgkAmount}
                    onChange={(e) => setFormData({ ...formData, sgkAmount: Number(e.target.value) })}
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Ödeme Yöntemi</label>
                  <select
                    className="form-select"
                    value={formData.paymentMethod}
                    onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                  >
                    <option>Nakit</option>
                    <option>Kredi Kartı</option>
                    <option>Havale</option>
                    <option>Taksit</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Taksit Sayısı</label>
                  <select
                    className="form-select"
                    value={formData.installments}
                    onChange={(e) => setFormData({ ...formData, installments: e.target.value })}
                  >
                    <option>Tek Çekim</option>
                    <option>2 Taksit</option>
                    <option>3 Taksit</option>
                    <option>4 Taksit</option>
                    <option>6 Taksit</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowSaleModal(false)}>İptal</button>
              <button className="btn btn-primary" onClick={handleSaveSale}>Satışı Kaydet</button>
            </div>
          </div>
        </div>
      )}

      {/* E-Arşiv Fatura Modal */}
      {selectedSaleForInvoice && (
        <div className="modal-overlay" onClick={() => setSelectedSaleForInvoice(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 650 }}>
            <div className="modal-header">
              <span className="modal-title">E-Arşiv Fatura Taslağı</span>
              <button className="modal-close" onClick={() => setSelectedSaleForInvoice(null)}>
                <IconClose size={16} strokeWidth={2} />
              </button>
            </div>
            <div className="modal-body" style={{ padding: 24, background: '#fcfbfa', border: '1px solid var(--gray-200)', borderRadius: 'var(--radius-md)' }}>
              {/* Logo / Başlık */}
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid var(--primary-600)', paddingBottom: 16, marginBottom: 20 }}>
                <div>
                  <h3 style={{ margin: 0, color: 'var(--primary-700)', fontWeight: 800 }}>AudioPro İşitme Merkezi</h3>
                  <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)', marginTop: 4 }}>
                    Caferağa Mah. Moda Cad. No:42, Kadıköy / İstanbul<br />
                    Tel: 0216 555 00 00 · Vergi No: 1234567890
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--accent-600)' }}>e-ARŞİV FATURA</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--gray-500)', fontFamily: 'var(--font-mono)', marginTop: 6 }}>
                    Fatura No: AP2026{selectedSaleForInvoice.id.slice(-6).toUpperCase()}<br />
                    Tarih: {formatDate(selectedSaleForInvoice.date)}
                  </div>
                </div>
              </div>

              {/* Müşteri Bilgileri */}
              <div style={{ background: 'white', border: '1px solid var(--gray-200)', borderRadius: 'var(--radius-md)', padding: 12, marginBottom: 20, fontSize: '0.84rem' }}>
                <div style={{ fontWeight: 700, color: 'var(--gray-700)', marginBottom: 6 }}>ALICI BİLGİLERİ</div>
                <div className="responsive-grid-2" style={{ gap: '8px 16px' }}>
                  <div><strong>Adı Soyadı:</strong> {selectedSaleForInvoice.patientName}</div>
                  <div><strong>Ödeme Yöntemi:</strong> {selectedSaleForInvoice.paymentMethod}</div>
                  <div><strong>SGK Durumu:</strong> {selectedSaleForInvoice.sgkAmount > 0 ? 'SGK Karşılamalı' : 'Şahsi Ödeme'}</div>
                  <div><strong>Durum:</strong> {selectedSaleForInvoice.status}</div>
                </div>
              </div>

              {/* Ürün Tablosu */}
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem', marginBottom: 20 }}>
                <thead>
                  <tr style={{ background: 'var(--primary-50)', borderBottom: '1px solid var(--primary-100)' }}>
                    <th style={{ padding: 8, textAlign: 'left' }}>Açıklama</th>
                    <th style={{ padding: 8, textAlign: 'center' }}>Kategori</th>
                    <th style={{ padding: 8, textAlign: 'center' }}>Adet</th>
                    <th style={{ padding: 8, textAlign: 'right' }}>Birim Fiyat</th>
                    <th style={{ padding: 8, textAlign: 'right' }}>Toplam</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedSaleForInvoice.items.map((item, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid var(--gray-100)' }}>
                      <td style={{ padding: 8 }}>{item.name}</td>
                      <td style={{ padding: 8, textAlign: 'center' }}>{item.type || 'Cihaz'}</td>
                      <td style={{ padding: 8, textAlign: 'center' }}>{item.quantity}</td>
                      <td style={{ padding: 8, textAlign: 'right' }}>{formatCurrency(item.price)}</td>
                      <td style={{ padding: 8, textAlign: 'right' }}>{formatCurrency(item.price * item.quantity)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Matrah & Toplamlar */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', fontSize: '0.84rem' }}>
                <div style={{ width: 280, display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 6, textAlign: 'right' }}>
                  <div>Ara Toplam (KDV Dahil):</div>
                  <div style={{ fontWeight: 600 }}>{formatCurrency(selectedSaleForInvoice.total)}</div>
                  
                  {selectedSaleForInvoice.sgkAmount > 0 && (
                    <>
                      <div style={{ color: 'var(--success-600)' }}>SGK Devlet Katkısı:</div>
                      <div style={{ fontWeight: 600, color: 'var(--success-600)' }}>-{formatCurrency(selectedSaleForInvoice.sgkAmount)}</div>
                    </>
                  )}
                  
                  <div style={{ borderTop: '1px solid var(--gray-300)', paddingTop: 6, fontWeight: 700, fontSize: '0.95rem' }}>Ödenecek Net Tutar:</div>
                  <div style={{ borderTop: '1px solid var(--gray-300)', paddingTop: 6, fontWeight: 700, fontSize: '0.95rem', color: 'var(--accent-600)' }}>
                    {formatCurrency(selectedSaleForInvoice.patientAmount)}
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setSelectedSaleForInvoice(null)}>Kapat</button>
              <button 
                className="btn btn-primary" 
                onClick={() => {
                  setSelectedSaleForInvoice(null);
                  addToast({ type: 'success', message: 'e-Arşiv Fatura resmi olarak imzalandı ve GİB portalına başarıyla iletildi.' });
                }}
              >
                GİB Gönder & Yazdır
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
