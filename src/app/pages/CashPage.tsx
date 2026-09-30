'use client';

import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { useBranchScope } from '../hooks/useBranchScope';
import { formatCurrency, SaleRecord, Expense } from '../data/mockData';
import styles from './CashPage.module.css';

interface CashMovement {
  id: string;
  date: string;
  account: string;
  type: 'Giriş' | 'Çıkış';
  category: string;
  description: string;
  patientOrEntity: string;
  amount: number;
  paymentMethod: string;
  status: 'Tahsil Edildi' | 'Bekleyen' | 'Bekliyor' | 'Taksitli';
  branch: string;
}

interface ExpenseItem {
  id: string;
  date: string;
  description: string;
  category: 'Kira' | 'Fatura' | 'Maaş' | 'Ofis Gideri' | 'Bakım & Onarım' | 'Hizmet Alımı' | 'Diğer';
  supplier: string;
  invoiceNo: string;
  paymentMethod: string;
  amount: number;
  branch: string;
  status: 'Ödendi' | 'Bekliyor';
  notes?: string;
}

const INITIAL_CASH_MOVEMENTS: CashMovement[] = [
  {
    id: 'csh-1',
    date: '29.09.2026 14:32',
    account: 'Ana Kasa',
    type: 'Giriş',
    category: 'Cihaz Satışı',
    description: 'İşitme cihazı satışı',
    patientOrEntity: 'Test Hasta Üç',
    amount: 12500,
    paymentMethod: 'Nakit',
    status: 'Tahsil Edildi',
    branch: 'Test Şube 1'
  },
  {
    id: 'csh-2',
    date: '28.09.2026 11:15',
    account: 'Ana Kasa',
    type: 'Çıkış',
    category: 'Kira',
    description: 'Şube kira ödemesi',
    patientOrEntity: '—',
    amount: 1000,
    paymentMethod: 'Havale',
    status: 'Tahsil Edildi',
    branch: 'Merkez'
  },
  {
    id: 'csh-3',
    date: '27.09.2026 16:20',
    account: 'Ana Kasa',
    type: 'Giriş',
    category: 'Aksesuar Satışı',
    description: 'Kulak kalıbı satışı',
    patientOrEntity: 'Ayşe Yılmaz',
    amount: 2800,
    paymentMethod: 'Kredi Kartı',
    status: 'Tahsil Edildi',
    branch: 'Merkez'
  },
  {
    id: 'csh-4',
    date: '25.09.2026 10:05',
    account: 'Ana Kasa',
    type: 'Çıkış',
    category: 'Ofis Gideri',
    description: 'Elektrik faturası',
    patientOrEntity: '—',
    amount: 450,
    paymentMethod: 'Havale',
    status: 'Tahsil Edildi',
    branch: 'Çankaya'
  },
  {
    id: 'csh-5',
    date: '24.09.2026 13:40',
    account: 'Banka (İş Bankası)',
    type: 'Giriş',
    category: 'Havale',
    description: 'Hasta tahsilatı',
    patientOrEntity: 'Mehmet Demir',
    amount: 3200,
    paymentMethod: 'Havale',
    status: 'Tahsil Edildi',
    branch: 'Merkez'
  }
];

const INITIAL_EXPENSES: ExpenseItem[] = [
  {
    id: 'exp-1',
    date: '29.09.2026',
    description: 'QA test gideri',
    category: 'Kira',
    supplier: '—',
    invoiceNo: '—',
    paymentMethod: 'Nakit',
    amount: 1000,
    branch: 'Test Şube 1',
    status: 'Ödendi',
    notes: 'Kira ödemesi makbuzu işlendi.'
  },
  {
    id: 'exp-2',
    date: '24.09.2026',
    description: 'Elektrik faturası',
    category: 'Fatura',
    supplier: 'CK Enerji',
    invoiceNo: 'E-2026-0012',
    paymentMethod: 'Banka',
    amount: 850,
    branch: 'Çankaya',
    status: 'Ödendi',
    notes: 'Aylık elektrik tüketim faturası.'
  },
  {
    id: 'exp-3',
    date: '20.09.2026',
    description: 'Personel maaşı',
    category: 'Maaş',
    supplier: '—',
    invoiceNo: '—',
    paymentMethod: 'Banka',
    amount: 15000,
    branch: 'Merkez',
    status: 'Ödendi',
    notes: 'Eylül ayı personel hakediş ödemesi.'
  },
  {
    id: 'exp-4',
    date: '15.09.2026',
    description: 'Ofis malzemeleri',
    category: 'Ofis Gideri',
    supplier: 'Vatan Bilgisayar',
    invoiceNo: 'A-56231',
    paymentMethod: 'Kredi Kartı',
    amount: 2350,
    branch: 'Merkez',
    status: 'Ödendi',
    notes: 'Kırtasiye ve sarf malzemeleri alımı.'
  },
  {
    id: 'exp-5',
    date: '10.09.2026',
    description: 'Cihaz bakım hizmeti',
    category: 'Bakım & Onarım',
    supplier: 'İşitme Servis',
    invoiceNo: 'S-2026-0044',
    paymentMethod: 'Banka',
    amount: 1200,
    branch: 'Çankaya',
    status: 'Ödendi',
    notes: 'Odyometre periyodik bakım servis bedeli.'
  },
  {
    id: 'exp-6',
    date: '05.09.2026',
    description: 'Temizlik hizmeti',
    category: 'Hizmet Alımı',
    supplier: 'Temiz İş A.Ş.',
    invoiceNo: 'E-44123',
    paymentMethod: 'Banka',
    amount: 950,
    branch: 'Kadıköy',
    status: 'Ödendi',
    notes: 'Klinik genel temizlik ve hijyen hizmeti.'
  },
  {
    id: 'exp-7',
    date: '01.09.2026',
    description: 'Su faturası',
    category: 'Fatura',
    supplier: 'İSKİ',
    invoiceNo: 'F-2026-0098',
    paymentMethod: 'Otomatik Ödeme',
    amount: 320,
    branch: 'Merkez',
    status: 'Ödendi',
    notes: 'Klinik su abonelik faturası.'
  }
];

export default function CashPage() {
  const { addToast, branchesList, patientsList, stockList, addSale } = useApp();
  const { matches, activeBranch } = useBranchScope();

  // Active Main Sub-Tab: 'cash' (Kasa & Tahsilat) or 'expenses' (Masraflar)
  const [mainTab, setMainTab] = useState<'cash' | 'expenses' | 'transfers' | 'reports'>('cash');

  // ── KASA & TAHSİLAT STATES ──
  const [cashMovements, setCashMovements] = useState<CashMovement[]>(INITIAL_CASH_MOVEMENTS);
  const [cashFilterPill, setCashFilterPill] = useState('Tümü');
  const [cashSelectedAccount, setCashSelectedAccount] = useState('Tüm Hesaplar');
  const [cashSelectedIds, setCashSelectedIds] = useState<string[]>(['csh-1']);

  // ── MASRAFLAR STATES ──
  const [expenses, setExpenses] = useState<ExpenseItem[]>(INITIAL_EXPENSES);
  const [expenseFilterPill, setExpenseFilterPill] = useState('Tümü');
  const [expenseSearchTerm, setExpenseSearchTerm] = useState('');
  const [expenseSelectedCategory, setExpenseSelectedCategory] = useState('Tüm Kategoriler');
  const [expenseSelectedBranch, setExpenseSelectedBranch] = useState('Tüm Şubeler');
  const [selectedExpense, setSelectedExpense] = useState<ExpenseItem | null>(INITIAL_EXPENSES[0]);
  const [expenseSelectedIds, setExpenseSelectedIds] = useState<string[]>(['exp-1']);

  // Modals state
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showNewSaleModal, setShowNewSaleModal] = useState(false);
  const [showNewExpenseModal, setShowNewExpenseModal] = useState(false);
  const [showEditExpenseModal, setShowEditExpenseModal] = useState(false);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  // New Sale Form State
  const [saleForm, setSaleForm] = useState({
    patientId: '',
    patientName: '',
    productId: '',
    deviceEarSide: 'Sağ' as 'Sağ' | 'Sol',
    paymentMethod: 'Nakit' as 'Nakit' | 'Kredi Kartı' | 'Havale' | 'Taksit',
    amount: 12500,
    account: 'Ana Kasa'
  });
  const salePatient = patientsList.find(patient => patient.id === saleForm.patientId);

  // Deposit/Withdrawal Form State
  const [depositForm, setDepositForm] = useState({
    type: 'Giriş' as 'Giriş' | 'Çıkış',
    account: 'Ana Kasa',
    amount: 1000,
    category: 'Diğer Gelir',
    description: ''
  });

  // New Expense Form State
  const [newExpForm, setNewExpForm] = useState({
    description: '',
    category: 'Kira' as ExpenseItem['category'],
    amount: 1000,
    supplier: '',
    invoiceNo: '',
    paymentMethod: 'Nakit',
    branch: 'Test Şube 1',
    notes: ''
  });

  // Filtered Cash Movements
  const filteredCashMovements = useMemo(() => {
    return cashMovements.filter(item => {
      if (!matches(item.branch)) return false;
      if (cashFilterPill === 'Girişler' && item.type !== 'Giriş') return false;
      if (cashFilterPill === 'Çıkışlar' && item.type !== 'Çıkış') return false;
      if (cashFilterPill === 'Tahsil Edildi' && item.status !== 'Tahsil Edildi') return false;
      if (cashFilterPill === 'Bekleyen' && item.status !== 'Bekleyen' && item.status !== 'Bekliyor') return false;
      if (cashFilterPill === 'Taksitli' && item.status !== 'Taksitli') return false;
      if (cashSelectedAccount !== 'Tüm Hesaplar' && item.account !== cashSelectedAccount) return false;
      return true;
    });
  }, [cashMovements, cashFilterPill, cashSelectedAccount, matches]);

  // Filtered Expenses
  const filteredExpenses = useMemo(() => {
    return expenses.filter(item => {
      if (!matches(item.branch)) return false;
      if (expenseFilterPill !== 'Tümü' && item.category !== expenseFilterPill) return false;
      if (expenseSelectedCategory !== 'Tüm Kategoriler' && item.category !== expenseSelectedCategory) return false;
      if (expenseSelectedBranch !== 'Tüm Şubeler' && item.branch !== expenseSelectedBranch) return false;
      if (expenseSearchTerm.trim()) {
        const q = expenseSearchTerm.toLowerCase();
        const matchDesc = item.description.toLowerCase().includes(q);
        const matchSupp = item.supplier.toLowerCase().includes(q);
        const matchInv = item.invoiceNo.toLowerCase().includes(q);
        if (!matchDesc && !matchSupp && !matchInv) return false;
      }
      return true;
    });
  }, [expenses, expenseFilterPill, expenseSelectedCategory, expenseSelectedBranch, expenseSearchTerm, matches]);

  // Handle Create Deposit/Withdrawal
  const handleCreateDeposit = (e: React.FormEvent) => {
    e.preventDefault();
    const newMovement: CashMovement = {
      id: `csh-${Date.now()}`,
      date: new Date().toLocaleString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
      account: depositForm.account,
      type: depositForm.type,
      category: depositForm.category,
      description: depositForm.description || (depositForm.type === 'Giriş' ? 'Kasa Para Girişi' : 'Kasa Para Çıkışı'),
      patientOrEntity: '—',
      amount: Number(depositForm.amount) || 0,
      paymentMethod: depositForm.account.includes('Banka') ? 'Banka' : 'Nakit',
      status: 'Tahsil Edildi',
      branch: 'Merkez'
    };

    setCashMovements(prev => [newMovement, ...prev]);
    setShowDepositModal(false);
    addToast({ type: 'success', message: `${formatCurrency(newMovement.amount)} ${newMovement.type.toLowerCase()} hareketi kaydedildi.` });
  };

  // Handle New Sale
  const handleCreateSale = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = Number(saleForm.amount) || 0;
    const saleId = `sale-${Date.now()}`;
    const selectedStock = stockList.find(s => s.id === saleForm.productId);
    const selectedPatient = patientsList.find(patient => patient.id === saleForm.patientId);

    if (!selectedPatient) {
      addToast({ type: 'error', message: 'Satış için kayıtlı bir hasta seçin. Satışlar hasta ve şube kaydıyla ilişkilendirilir.' });
      return;
    }

    if (saleForm.productId && selectedStock && (selectedStock.quantity <= 0 || selectedStock.status !== 'Stokta')) {
      addToast({ type: 'error', message: 'Seçilen ürünün stoğu tükenmiş.' });
      return;
    }

    if (selectedStock && (selectedStock.branchId !== selectedPatient.branchId || !matches(selectedStock.branch, selectedStock.branchId))) {
      addToast({ type: 'error', message: 'Seçilen ürün hastanın şubesiyle aynı şubede değil.' });
      return;
    }
    const deviceEarSide = selectedStock?.category === 'Cihaz'
      ? (selectedPatient.hearingLossSide === 'Sağ' || selectedPatient.hearingLossSide === 'Sol'
          ? selectedPatient.hearingLossSide
          : saleForm.deviceEarSide)
      : undefined;

    try {
      await addSale({
        id: saleId,
        idempotencyKey: crypto.randomUUID(),
        patientId: selectedPatient.id,
        patientName: `${selectedPatient.firstName} ${selectedPatient.lastName}`,
        date: new Date().toISOString().split('T')[0],
        items: [
          {
            name: selectedStock ? selectedStock.name : 'İşitme Cihazı Satışı',
            quantity: 1,
            price: amount,
            type: selectedStock?.category === 'Cihaz' ? 'Cihaz' : 'Aksesuar',
            stockItemId: selectedStock?.id,
            serialNo: selectedStock?.serialNo
          }
        ],
        total: amount,
        sgkAmount: 0,
        patientAmount: amount,
        paymentMethod: saleForm.paymentMethod,
        status: 'Tahsil Edildi',
        branchId: selectedPatient.branchId,
        deviceEarSide
      }, selectedStock?.id);

      const branchName = activeBranch.mode === 'single'
        ? (branchesList.find(b => b.id === activeBranch.branchId)?.name || 'Merkez')
        : 'Merkez';

      const newMovement: CashMovement = {
        id: `csh-${Date.now()}`,
        date: new Date().toLocaleString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
        account: saleForm.account,
        type: 'Giriş',
        category: 'Cihaz Satışı',
        description: selectedStock ? `${selectedStock.name} satışı (Stoktan -1 düşüldü)` : 'İşitme cihazı satışı',
        patientOrEntity: `${selectedPatient.firstName} ${selectedPatient.lastName}`,
        amount: amount,
        paymentMethod: saleForm.paymentMethod,
        status: 'Tahsil Edildi',
        branch: branchName
      };

      setCashMovements(prev => [newMovement, ...prev]);
      setShowNewSaleModal(false);
      addToast({ type: 'success', message: `${formatCurrency(amount)} satış tahsilatı kaydedildi ve stoktan düşüldü.` });
    } catch (err: any) {
      addToast({ type: 'error', message: err.message || 'Satış kaydedilemedi.' });
    }
  };

  // Handle New Expense
  const handleCreateExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExpForm.description.trim()) {
      addToast({ type: 'warning', message: 'Lütfen masraf açıklamasını girin.' });
      return;
    }

    const newExpense: ExpenseItem = {
      id: `exp-${Date.now()}`,
      date: new Date().toLocaleDateString('tr-TR'),
      description: newExpForm.description,
      category: newExpForm.category,
      supplier: newExpForm.supplier || '—',
      invoiceNo: newExpForm.invoiceNo || '—',
      paymentMethod: newExpForm.paymentMethod,
      amount: Number(newExpForm.amount) || 0,
      branch: newExpForm.branch,
      status: 'Ödendi',
      notes: newExpForm.notes
    };

    setExpenses(prev => [newExpense, ...prev]);
    setSelectedExpense(newExpense);
    setExpenseSelectedIds([newExpense.id]);
    setShowNewExpenseModal(false);
    addToast({ type: 'success', message: `${newExpense.description} masraf kaydı eklendi.` });
  };

  return (
    <div className={styles.cashPage}>
      {/* ── BREADCRUMB ── */}
      <div className={styles.breadcrumb}>
        Kasa & Tahsilat <span>›</span> {mainTab === 'expenses' ? 'Masraf & Gider Yönetimi' : 'Kasa Yönetimi'}
      </div>

      {/* ── PAGE HEADING ── */}
      <div className={styles.pageHeading}>
        <div className={styles.headingCopy}>
          <div className={`${styles.headingIcon} ${mainTab === 'expenses' ? styles.headingIconRed : ''}`}>
            {mainTab === 'expenses' ? (
              /* Red Document/Expense icon */
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10 9 9 9 8 9" />
              </svg>
            ) : (
              /* Green Coin stack icon */
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <ellipse cx="12" cy="5" rx="9" ry="3" />
                <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
                <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
              </svg>
            )}
          </div>
          <div>
            <h1>{mainTab === 'expenses' ? 'Masraf & Gider Yönetimi' : 'Kasa & Tahsilat'}</h1>
            <p>
              {mainTab === 'expenses'
                ? 'Kira, faturalar, maaşlar ve genel işletme giderlerinizi yönetin.'
                : 'Satış, tahsilat, kasa hareketleri ve masrafları yönetin. Tüm şubelerinizin finansal hareketlerini tek ekranda takip edin.'}
            </p>
          </div>
        </div>

        <div className={styles.headerActions}>
          {mainTab === 'expenses' ? (
            <>
              <button
                className={styles.btnSecondaryAction}
                onClick={() => addToast({ type: 'info', message: 'Gider analitiği ve rapor dökümü hazırlanıyor...' })}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="20" x2="18" y2="10" />
                  <line x1="12" y1="20" x2="12" y2="4" />
                  <line x1="6" y1="20" x2="6" y2="14" />
                </svg>
                Raporla
              </button>
              <button
                className={styles.btnPrimaryAction}
                onClick={() => setShowNewExpenseModal(true)}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                Yeni Gider Kaydet
              </button>
            </>
          ) : (
            <>
              {/* Para Giriş / Çıkış */}
              <button
                className={styles.btnSecondaryAction}
                onClick={() => setShowDepositModal(true)}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="17 1 21 5 17 9" />
                  <path d="M3 11V9a4 4 0 0 1 4-4h14" />
                  <polyline points="7 23 3 19 7 15" />
                  <path d="M21 13v2a4 4 0 0 1-4 4H3" />
                </svg>
                Para Giriş/Çıkış
              </button>

              {/* Masraflar (User asked explicitly for this button's design & switching) */}
              <button
                className={styles.btnSecondaryAction}
                onClick={() => setMainTab('expenses')}
                title="Masraf ve Gider Yönetimi Ekranını Aç"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                </svg>
                Masraflar
              </button>

              {/* Yeni Satış */}
              <button
                className={styles.btnPrimaryAction}
                onClick={() => setShowNewSaleModal(true)}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                Yeni Satış
              </button>
            </>
          )}
        </div>
      </div>

      {/* ── TOP SUB-TABS ── */}
      <div className={styles.navTabs}>
        <button
          className={`${styles.navTabBtn} ${mainTab === 'cash' ? styles.navTabBtnActive : ''}`}
          onClick={() => setMainTab('cash')}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <ellipse cx="12" cy="5" rx="9" ry="3" />
            <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
            <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
          </svg>
          Kasa & Tahsilat
        </button>

        <button
          className={`${styles.navTabBtn} ${mainTab === 'expenses' ? styles.navTabBtnActive : ''}`}
          onClick={() => setMainTab('expenses')}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
          </svg>
          Masraflar
        </button>

        <button
          className={`${styles.navTabBtn} ${mainTab === 'transfers' ? styles.navTabBtnActive : ''}`}
          onClick={() => setMainTab('transfers')}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="2" y="4" width="20" height="16" rx="2" />
            <line x1="2" y1="10" x2="22" y2="10" />
          </svg>
          Banka Transferleri
        </button>

        <button
          className={`${styles.navTabBtn} ${mainTab === 'reports' ? styles.navTabBtnActive : ''}`}
          onClick={() => setMainTab('reports')}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="20" x2="18" y2="10" />
            <line x1="12" y1="20" x2="12" y2="4" />
            <line x1="6" y1="20" x2="6" y2="14" />
          </svg>
          Raporlar
        </button>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          VIEW 1: KASA & TAHSİLAT
         ══════════════════════════════════════════════════════════════════════ */}
      {mainTab === 'cash' && (
        <>
          {/* 4 Stat Cards */}
          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <div className={`${styles.statIcon} ${styles.iconGreen}`}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 7H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z" />
                  <path d="M16 3H4a2 2 0 0 0-2 2v2h18V5a2 2 0 0 0-2-2z" />
                </svg>
              </div>
              <div>
                <span>Ana Kasa Bakiyesi</span>
                <strong>₺11.500</strong>
                <div className={styles.statTrend}>
                  <span className={styles.trendGreen}>↗ %12</span>
                  <span className={styles.statSubtext}>geçen aya göre</span>
                </div>
              </div>
            </div>

            <div className={styles.statCard}>
              <div className={`${styles.statIcon} ${styles.iconBlue}`}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="2" y="4" width="20" height="16" rx="2" />
                  <line x1="2" y1="10" x2="22" y2="10" />
                </svg>
              </div>
              <div>
                <span>Toplam Ciro</span>
                <strong>₺12.500</strong>
                <div className={styles.statTrend}>
                  <span className={styles.trendGreen}>↗ %18</span>
                  <span className={styles.statSubtext}>bu ay</span>
                </div>
              </div>
            </div>

            <div className={styles.statCard}>
              <div className={`${styles.statIcon} ${styles.iconGreen}`}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              </div>
              <div>
                <span>Toplam Tahsilat</span>
                <strong>₺12.500</strong>
                <div className={styles.statTrend}>
                  <span className={styles.trendGreen}>↗ %18</span>
                  <span className={styles.statSubtext}>bu ay</span>
                </div>
              </div>
            </div>

            <div className={styles.statCard}>
              <div className={`${styles.statIcon} ${styles.iconOrange}`}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
              </div>
              <div>
                <span>Bekleyen Tahsilat</span>
                <strong>₺0</strong>
                <span className={styles.statSubtext}>— bu ay</span>
              </div>
            </div>
          </div>

          {/* Middle Row: Chart & Kasa Özeti */}
          <div className={styles.middleGrid}>
            {/* Chart: Aylık Kasa Hareketleri */}
            <div className={styles.chartCard}>
              <div className={styles.chartHeader}>
                <div className={styles.chartTitle}>
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#08785b" strokeWidth="2">
                    <line x1="18" y1="20" x2="18" y2="10" />
                    <line x1="12" y1="20" x2="12" y2="4" />
                    <line x1="6" y1="20" x2="6" y2="14" />
                  </svg>
                  Aylık Kasa Hareketleri
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div className={styles.chartLegend}>
                    <span><span className={styles.legendDotGelir} />Gelir</span>
                    <span><span className={styles.legendDotGider} />Gider</span>
                    <span><span className={styles.legendDotNet} />Net</span>
                  </div>

                  <select className={styles.filterSelect} style={{ height: 32, minWidth: 100 }}>
                    <option>Son 12 Ay</option>
                    <option>Son 6 Ay</option>
                    <option>Bu Yıl (2026)</option>
                  </select>
                </div>
              </div>

              {/* Bar Visualizer */}
              <div className={styles.chartBody}>
                {[
                  { m: 'Oca', g: 50, d: 25 },
                  { m: 'Şub', g: 45, d: 35 },
                  { m: 'Mar', g: 58, d: 38 },
                  { m: 'Nis', g: 42, d: 20 },
                  { m: 'May', g: 52, d: 38 },
                  { m: 'Haz', g: 55, d: 30 },
                  { m: 'Tem', g: 40, d: 22 },
                  { m: 'Ağu', g: 65, d: 42 },
                  { m: 'Eyl', g: 72, d: 40 },
                  { m: 'Eki', g: 68, d: 40 },
                  { m: 'Kas', g: 62, d: 38 },
                  { m: 'Ara', g: 80, d: 42 }
                ].map((item, idx) => (
                  <div key={idx} className={styles.chartCol}>
                    <div className={styles.barsGroup}>
                      <div className={styles.barGelir} style={{ height: `${item.g}%` }} title={`Gelir: %${item.g}`} />
                      <div className={styles.barGider} style={{ height: `${item.d}%` }} title={`Gider: %${item.d}`} />
                    </div>
                    <span className={styles.chartLabel}>{item.m}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Kasa Özeti Card */}
            <div className={styles.summaryCard}>
              <div className={styles.summaryHeader}>
                <div className={styles.summaryTitle}>
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#08785b" strokeWidth="2">
                    <rect x="2" y="4" width="20" height="16" rx="2" />
                    <circle cx="12" cy="12" r="2" />
                  </svg>
                  Kasa Özeti
                </div>
                <select className={styles.filterSelect} style={{ height: 30, minWidth: 100 }}>
                  <option>Tüm Şubeler</option>
                  <option>Merkez</option>
                  <option>Çankaya</option>
                </select>
              </div>

              <div className={styles.summaryList}>
                <div className={styles.summaryRow}>
                  <div className={styles.summaryLabel}>
                    <span style={{ color: '#08785b' }}>💵</span> Nakit
                  </div>
                  <div className={styles.summaryVal}>₺11.500</div>
                </div>

                <div className={styles.summaryRow}>
                  <div className={styles.summaryLabel}>
                    <span style={{ color: '#0284c7' }}>💳</span> Kredi Kartı
                  </div>
                  <div className={styles.summaryVal}>₺0</div>
                </div>

                <div className={styles.summaryRow}>
                  <div className={styles.summaryLabel}>
                    <span style={{ color: '#7e22ce' }}>🏦</span> Havale / EFT
                  </div>
                  <div className={styles.summaryVal}>₺0</div>
                </div>

                <div className={styles.summaryRow}>
                  <div className={styles.summaryLabel}>
                    <span style={{ color: '#475569' }}>📱</span> Diğer
                  </div>
                  <div className={styles.summaryVal}>₺0</div>
                </div>

                <div className={styles.summaryTotalRow}>
                  <div className={styles.summaryTotalLabel}>Toplam Bakiye</div>
                  <div className={styles.summaryTotalVal}>₺11.500</div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Table Section */}
          <div className={styles.pillsRow}>
            <div className={styles.pillsList}>
              {['Tümü', 'Girişler', 'Çıkışlar', 'Tahsil Edildi', 'Bekleyen', 'Taksitli'].map(pill => (
                <button
                  key={pill}
                  className={`${styles.pillBtn} ${cashFilterPill === pill ? styles.pillBtnActive : ''}`}
                  onClick={() => setCashFilterPill(pill)}
                >
                  {pill}
                </button>
              ))}
            </div>

            <div className={styles.filterBar}>
              <div className={styles.dateRangeBox}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                </svg>
                <span>01.09.2026 - 30.09.2026</span>
              </div>

              <select
                className={styles.filterSelect}
                value={cashSelectedAccount}
                onChange={e => setCashSelectedAccount(e.target.value)}
              >
                <option value="Tüm Hesaplar">Tüm Hesaplar</option>
                <option value="Ana Kasa">Ana Kasa</option>
                <option value="Banka (İş Bankası)">Banka (İş Bankası)</option>
              </select>

              <button className={styles.btnFilter} onClick={() => addToast({ type: 'info', message: 'Filtreler uygulandı.' })}>
                Filtrele
              </button>

              <button
                className={styles.btnClear}
                onClick={() => {
                  setCashFilterPill('Tümü');
                  setCashSelectedAccount('Tüm Hesaplar');
                }}
              >
                Temizle
              </button>
            </div>
          </div>

          {/* Kasa Table */}
          <div className={styles.tableSection}>
            <div className={styles.tableWrap}>
              <table className={styles.dataTable}>
                <thead>
                  <tr>
                    <th style={{ width: 40, textAlign: 'center' }}>
                      <input
                        type="checkbox"
                        checked={cashSelectedIds.length > 0 && cashSelectedIds.length === filteredCashMovements.length}
                        onChange={e => {
                          if (e.target.checked) setCashSelectedIds(filteredCashMovements.map(i => i.id));
                          else setCashSelectedIds([]);
                        }}
                      />
                    </th>
                    <th>Tarih</th>
                    <th>Kasa / Hesap</th>
                    <th>İşlem</th>
                    <th>Kategori</th>
                    <th>Açıklama</th>
                    <th>Hasta / Cari</th>
                    <th>Tutar</th>
                    <th>Ödeme Şekli</th>
                    <th>Durum</th>
                    <th style={{ textAlign: 'center' }}>İşlemler</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCashMovements.map(row => {
                    const isSelected = cashSelectedIds.includes(row.id);
                    return (
                      <tr key={row.id} className={isSelected ? styles.selectedRow : ''}>
                        <td style={{ textAlign: 'center' }}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {
                              setCashSelectedIds(prev => prev.includes(row.id) ? prev.filter(x => x !== row.id) : [...prev, row.id]);
                            }}
                          />
                        </td>
                        <td style={{ whiteSpace: 'nowrap' }}>{row.date}</td>
                        <td style={{ fontWeight: 600 }}>{row.account}</td>
                        <td>
                          <span className={row.type === 'Giriş' ? styles.badgeOperationIn : styles.badgeOperationOut}>
                            {row.type}
                          </span>
                        </td>
                        <td>
                          <span className={styles.badgeCategoryPill}>{row.category}</span>
                        </td>
                        <td>{row.description}</td>
                        <td>{row.patientOrEntity}</td>
                        <td style={{ fontWeight: 700, color: row.type === 'Giriş' ? '#08785b' : '#dc2626' }}>
                          {row.type === 'Giriş' ? formatCurrency(row.amount) : `-${formatCurrency(row.amount)}`}
                        </td>
                        <td>{row.paymentMethod}</td>
                        <td>
                          <span className={styles.badgeStatusPaid}>{row.status}</span>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <div className={styles.actionBtns} style={{ justifyContent: 'center' }}>
                            <button className={styles.btnActionIcon} title="Görüntüle" onClick={() => addToast({ type: 'info', message: `${row.description} işlemi detayı açılıyor...` })}>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                <circle cx="12" cy="12" r="3" />
                              </svg>
                            </button>
                            <button className={styles.btnActionIcon} title="Düzenle">
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M12 20h9" />
                                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                              </svg>
                            </button>
                            <button className={styles.btnActionIcon} title="Menü">
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <circle cx="12" cy="12" r="1" />
                                <circle cx="12" cy="5" r="1" />
                                <circle cx="12" cy="19" r="1" />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className={styles.tableFooter}>
              <div>Toplam 24 kayıt | {cashSelectedIds.length} kayıt seçili</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div className={styles.pagination}>
                  <button className={styles.pageBtn}>‹</button>
                  <button className={`${styles.pageBtn} ${styles.pageBtnActive}`}>1</button>
                  <button className={styles.pageBtn}>2</button>
                  <button className={styles.pageBtn}>3</button>
                  <button className={styles.pageBtn}>4</button>
                  <button className={styles.pageBtn}>5</button>
                  <button className={styles.pageBtn}>›</button>
                  <button className={styles.pageBtn}>»</button>
                </div>
                <select className={styles.filterSelect} style={{ height: 30, minWidth: 90 }}>
                  <option>10 / sayfa</option>
                  <option>25 / sayfa</option>
                </select>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          VIEW 2: MASRAF & GİDER YÖNETİMİ (Image 2)
         ══════════════════════════════════════════════════════════════════════ */}
      {mainTab === 'expenses' && (
        <>
          {/* 4 Stat Cards */}
          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <div className={`${styles.statIcon} ${styles.iconRed}`}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </div>
              <div>
                <span>Bu Ay Toplam Gider</span>
                <strong>₺1.000</strong>
                <div className={styles.statTrend}>
                  <span className={styles.trendRed}>↗ %12</span>
                  <span className={styles.statSubtext}>geçen aya göre</span>
                </div>
              </div>
            </div>

            <div className={styles.statCard}>
              <div className={`${styles.statIcon} ${styles.iconGreen}`}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </div>
              <div>
                <span>En Yüksek Gider Kalemi</span>
                <strong>Kira</strong>
                <span className={styles.statSubtext}>₺1.000</span>
              </div>
            </div>

            <div className={styles.statCard}>
              <div className={`${styles.statIcon} ${styles.iconOrange}`}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
              </div>
              <div>
                <span>Ortalama Aylık Gider</span>
                <strong>₺3.250</strong>
                <div className={styles.statTrend}>
                  <span className={styles.trendGreen}>↘ %8</span>
                  <span className={styles.statSubtext}>son 3 aya göre</span>
                </div>
              </div>
            </div>

            <div className={styles.statCard}>
              <div className={`${styles.statIcon} ${styles.iconBlue}`}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                  <polyline points="17 6 23 6 23 12" />
                </svg>
              </div>
              <div>
                <span>Yıllık Toplam Gider</span>
                <strong>₺38.500</strong>
              </div>
            </div>
          </div>

          {/* Pill Tabs */}
          <div className={styles.pillsRow}>
            <div className={styles.pillsList}>
              {['Tümü', 'Kira', 'Faturalar', 'Maaş & Personel', 'Hizmet Alımları', 'Bakım & Onarım', 'Ofis Giderleri', 'Diğer'].map(cat => (
                <button
                  key={cat}
                  className={`${styles.pillBtn} ${expenseFilterPill === cat ? styles.pillBtnActive : ''}`}
                  onClick={() => setExpenseFilterPill(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Filter Bar */}
          <div className={styles.filterBar} style={{ marginBottom: 16 }}>
            <div className={styles.searchBox}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="text"
                placeholder="Açıklama, tedarikçi, fatura no ile ara..."
                value={expenseSearchTerm}
                onChange={e => setExpenseSearchTerm(e.target.value)}
              />
            </div>

            <div className={styles.dateRangeBox}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
              </svg>
              <span>01.09.2026 - 30.09.2026</span>
            </div>

            <select
              className={styles.filterSelect}
              value={expenseSelectedCategory}
              onChange={e => setExpenseSelectedCategory(e.target.value)}
            >
              <option value="Tüm Kategoriler">Tüm Kategoriler</option>
              <option value="Kira">Kira</option>
              <option value="Fatura">Fatura</option>
              <option value="Maaş">Maaş</option>
              <option value="Ofis Gideri">Ofis Gideri</option>
              <option value="Bakım & Onarım">Bakım & Onarım</option>
              <option value="Hizmet Alımı">Hizmet Alımı</option>
            </select>

            <select
              className={styles.filterSelect}
              value={expenseSelectedBranch}
              onChange={e => setExpenseSelectedBranch(e.target.value)}
            >
              <option value="Tüm Şubeler">Tüm Şubeler</option>
              <option value="Test Şube 1">Test Şube 1</option>
              <option value="Merkez">Merkez</option>
              <option value="Çankaya">Çankaya</option>
              <option value="Kadıköy">Kadıköy</option>
            </select>

            <button className={styles.btnFilter} onClick={() => addToast({ type: 'info', message: 'Gider filtreleri uygulandı.' })}>
              Filtrele
            </button>

            <button
              className={styles.btnClear}
              onClick={() => {
                setExpenseSearchTerm('');
                setExpenseSelectedCategory('Tüm Kategoriler');
                setExpenseSelectedBranch('Tüm Şubeler');
                setExpenseFilterPill('Tümü');
              }}
            >
              Temizle
            </button>
          </div>

          {/* Expenses Content Layout: Table + Right Drawer */}
          <div className={styles.contentLayout}>
            {/* Table */}
            <div className={styles.tableSection}>
              <div className={styles.tableWrap}>
                <table className={styles.dataTable}>
                  <thead>
                    <tr>
                      <th style={{ width: 40, textAlign: 'center' }}>
                        <input
                          type="checkbox"
                          checked={expenseSelectedIds.length > 0 && expenseSelectedIds.length === filteredExpenses.length}
                          onChange={e => {
                            if (e.target.checked) setExpenseSelectedIds(filteredExpenses.map(i => i.id));
                            else setExpenseSelectedIds([]);
                          }}
                        />
                      </th>
                      <th>TARİH</th>
                      <th>AÇIKLAMA</th>
                      <th>KATEGORİ</th>
                      <th>TEDARİKÇİ</th>
                      <th>FATURA NO</th>
                      <th>ÖDEME YÖNTEMİ</th>
                      <th>TUTAR</th>
                      <th>ŞUBE</th>
                      <th style={{ textAlign: 'center' }}>İŞLEMLER</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredExpenses.map(row => {
                      const isSelected = expenseSelectedIds.includes(row.id);
                      const isActive = selectedExpense?.id === row.id;
                      return (
                        <tr
                          key={row.id}
                          className={isActive ? styles.selectedRow : ''}
                          onClick={() => {
                            setSelectedExpense(row);
                            if (!expenseSelectedIds.includes(row.id)) setExpenseSelectedIds([row.id]);
                          }}
                          style={{ cursor: 'pointer' }}
                        >
                          <td style={{ textAlign: 'center' }} onClick={e => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => {
                                setExpenseSelectedIds(prev => prev.includes(row.id) ? prev.filter(x => x !== row.id) : [...prev, row.id]);
                              }}
                            />
                          </td>
                          <td style={{ whiteSpace: 'nowrap' }}>{row.date}</td>
                          <td style={{ fontWeight: 600, color: '#0f172a' }}>{row.description}</td>
                          <td>
                            <span className={styles.badgeCategoryPill}>{row.category}</span>
                          </td>
                          <td>{row.supplier}</td>
                          <td style={{ fontFamily: 'monospace' }}>{row.invoiceNo}</td>
                          <td>{row.paymentMethod}</td>
                          <td style={{ fontWeight: 700, color: '#dc2626' }}>
                            {formatCurrency(row.amount)}
                          </td>
                          <td>{row.branch}</td>
                          <td style={{ textAlign: 'center' }} onClick={e => e.stopPropagation()}>
                            <div className={styles.actionBtns} style={{ justifyContent: 'center' }}>
                              <button
                                className={styles.btnActionIcon}
                                title="İncele"
                                onClick={() => setSelectedExpense(row)}
                              >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                  <circle cx="12" cy="12" r="3" />
                                </svg>
                              </button>
                              <button
                                className={styles.btnActionIcon}
                                title="Düzenle"
                                onClick={() => {
                                  setSelectedExpense(row);
                                  setShowEditExpenseModal(true);
                                }}
                              >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M12 20h9" />
                                  <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                                </svg>
                              </button>
                              <button className={styles.btnActionIcon} title="Menü">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                  <circle cx="12" cy="12" r="1" />
                                  <circle cx="12" cy="5" r="1" />
                                  <circle cx="12" cy="19" r="1" />
                                </svg>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className={styles.tableFooter}>
                <div>Toplam 7 kayıt | {expenseSelectedIds.length} kayıt seçili</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div className={styles.pagination}>
                    <button className={styles.pageBtn}>‹</button>
                    <button className={`${styles.pageBtn} ${styles.pageBtnActive}`}>1</button>
                    <button className={styles.pageBtn}>›</button>
                  </div>
                  <select className={styles.filterSelect} style={{ height: 30, minWidth: 90 }}>
                    <option>10 / sayfa</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Right Drawer: QA test gideri */}
            {selectedExpense && (
              <div className={styles.detailDrawer}>
                <div className={styles.drawerHeader}>
                  <div className={styles.drawerHeaderLeft}>
                    <div className={styles.drawerThumbRed}>
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                      </svg>
                    </div>
                    <div>
                      <div className={styles.drawerExpenseName}>{selectedExpense.description}</div>
                      <div className={styles.drawerExpenseCategory}>{selectedExpense.category}</div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span className={styles.badgeStatusPaid}>✓ Ödendi</span>
                    <button className={styles.drawerCloseBtn} onClick={() => setSelectedExpense(null)}>✕</button>
                  </div>
                </div>

                <div className={styles.drawerTabs}>
                  <button className={`${styles.drawerTabBtn} ${styles.drawerTabBtnActive}`}>Genel</button>
                  <button className={styles.drawerTabBtn}>Ödeme Geçmişi</button>
                </div>

                <div className={styles.drawerBody}>
                  <div className={styles.drawerSection}>
                    <div className={styles.sectionHeader}>
                      <span className={styles.sectionTitle}>Genel Bilgiler</span>
                      <button
                        className={styles.btnEditLink}
                        onClick={() => setShowEditExpenseModal(true)}
                      >
                        Düzenle
                      </button>
                    </div>

                    <div className={styles.infoGrid}>
                      <div className={styles.infoRow}>
                        <span>Açıklama</span>
                        <strong>{selectedExpense.description}</strong>
                      </div>
                      <div className={styles.infoRow}>
                        <span>Kategori</span>
                        <strong>{selectedExpense.category}</strong>
                      </div>
                      <div className={styles.infoRow}>
                        <span>Tutar</span>
                        <strong style={{ color: '#dc2626', fontSize: 14 }}>{formatCurrency(selectedExpense.amount)}</strong>
                      </div>
                      <div className={styles.infoRow}>
                        <span>Tarih</span>
                        <strong>{selectedExpense.date}</strong>
                      </div>
                      <div className={styles.infoRow}>
                        <span>Şube</span>
                        <strong>{selectedExpense.branch}</strong>
                      </div>
                      <div className={styles.infoRow}>
                        <span>Ödeme Yöntemi</span>
                        <strong>{selectedExpense.paymentMethod}</strong>
                      </div>
                      <div className={styles.infoRow}>
                        <span>Fatura No</span>
                        <strong style={{ fontFamily: 'monospace' }}>{selectedExpense.invoiceNo}</strong>
                      </div>
                      <div className={styles.infoRow}>
                        <span>Tedarikçi</span>
                        <strong>{selectedExpense.supplier}</strong>
                      </div>
                      <div className={styles.infoRow}>
                        <span>Ek Açıklama</span>
                        <strong>{selectedExpense.notes || '—'}</strong>
                      </div>
                    </div>
                  </div>

                  {/* Hızlı İşlemler */}
                  <div className={styles.drawerSection}>
                    <span className={styles.sectionTitle}>Hızlı İşlemler</span>
                    <div className={styles.quickActionsGrid}>
                      <button
                        className={styles.quickActionBtn}
                        onClick={() => setShowEditExpenseModal(true)}
                      >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M12 20h9" />
                          <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                        </svg>
                        Düzenle
                      </button>

                      <button
                        className={`${styles.quickActionBtn} ${styles.quickActionBtnDanger}`}
                        onClick={() => {
                          setExpenses(prev => prev.filter(x => x.id !== selectedExpense.id));
                          setSelectedExpense(null);
                          addToast({ type: 'success', message: 'Gider kaydı silindi.' });
                        }}
                      >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                        </svg>
                        Sil
                      </button>

                      <button
                        className={styles.quickActionBtn}
                        onClick={() => addToast({ type: 'info', message: 'Fatura dökümü açılıyor...' })}
                      >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                          <polyline points="14 2 14 8 20 8" />
                        </svg>
                        Fatura Görüntüle
                      </button>

                      <button
                        className={styles.quickActionBtn}
                        onClick={() => {
                          setNewExpForm({
                            description: selectedExpense.description,
                            category: selectedExpense.category,
                            amount: selectedExpense.amount,
                            supplier: selectedExpense.supplier !== '—' ? selectedExpense.supplier : '',
                            invoiceNo: '',
                            paymentMethod: selectedExpense.paymentMethod,
                            branch: selectedExpense.branch,
                            notes: ''
                          });
                          setShowNewExpenseModal(true);
                        }}
                      >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <line x1="12" y1="5" x2="12" y2="19" />
                          <line x1="5" y1="12" x2="19" y2="12" />
                        </svg>
                        Benzer Kayıt Ekle
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          VIEW 3: BANKA TRANSFERLERİ
         ══════════════════════════════════════════════════════════════════════ */}
      {mainTab === 'transfers' && (
        <div style={{ background: '#fff', border: '1px solid var(--csh-border)', borderRadius: 14, padding: 24 }}>
          <h3 style={{ margin: '0 0 8px', fontSize: 18, color: '#0f172a' }}>Banka ve POS Hesap Hareketleri</h3>
          <p style={{ color: '#64748b', fontSize: 13, marginBottom: 20 }}>
            İş Bankası, Garanti BBVA ve Yapı Kredi POS hesap mutabakatları ve virman transferleri.
          </p>
          <div style={{ padding: 24, background: '#f8fafc', borderRadius: 10, border: '1px dashed #cbd5e1', textAlign: 'center' }}>
            <div style={{ fontWeight: 650, color: '#475569' }}>Banka API bağlantısı aktif durumdadır.</div>
            <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>Tüm banka tahsilatları otomatik olarak Ana Kasa konsolide hareketlerine yansıtılır.</div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          VIEW 4: RAPORLAR
         ══════════════════════════════════════════════════════════════════════ */}
      {mainTab === 'reports' && (
        <div style={{ background: '#fff', border: '1px solid var(--csh-border)', borderRadius: 14, padding: 24 }}>
          <h3 style={{ margin: '0 0 8px', fontSize: 18, color: '#0f172a' }}>Finansal Kar & Zarar Özeti</h3>
          <p style={{ color: '#64748b', fontSize: 13, marginBottom: 20 }}>
            Şube bazında nakit akışı, hakedişler ve gider analizleri.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
            <div style={{ padding: 16, background: '#f8fafc', borderRadius: 12, border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: 12, color: '#64748b' }}>Aylık Net Kar</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: '#08785b', marginTop: 4 }}>+₺11.500</div>
            </div>
            <div style={{ padding: 16, background: '#f8fafc', borderRadius: 12, border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: 12, color: '#64748b' }}>Gider / Gelir Oranı</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: '#0284c7', marginTop: 4 }}>%8.0</div>
            </div>
            <div style={{ padding: 16, background: '#f8fafc', borderRadius: 12, border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: 12, color: '#64748b' }}>Tahsilat Oranı</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: '#08785b', marginTop: 4 }}>%100</div>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: Para Giriş / Çıkış ── */}
      {showDepositModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.55)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'grid', placeItems: 'center', padding: 20 }}>
          <div style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 480, overflow: 'hidden', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid #e2e8f0' }}>
              <h3 style={{ margin: 0, fontSize: 17, color: '#0f172a' }}>Kasa Para Giriş / Çıkış</h3>
              <button style={{ border: 'none', background: 'transparent', fontSize: 20, cursor: 'pointer', color: '#94a3b8' }} onClick={() => setShowDepositModal(false)}>✕</button>
            </div>
            <form onSubmit={handleCreateDeposit}>
              <div style={{ padding: 20, display: 'grid', gap: 12 }}>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    type="button"
                    style={{ flex: 1, height: 38, borderRadius: 8, border: depositForm.type === 'Giriş' ? '2px solid #08785b' : '1px solid #cbd5e1', background: depositForm.type === 'Giriş' ? '#f0fdf8' : '#fff', color: depositForm.type === 'Giriş' ? '#08785b' : '#334155', fontWeight: 650, cursor: 'pointer' }}
                    onClick={() => setDepositForm({ ...depositForm, type: 'Giriş' })}
                  >
                    + Para Girişi
                  </button>
                  <button
                    type="button"
                    style={{ flex: 1, height: 38, borderRadius: 8, border: depositForm.type === 'Çıkış' ? '2px solid #dc2626' : '1px solid #cbd5e1', background: depositForm.type === 'Çıkış' ? '#fee2e2' : '#fff', color: depositForm.type === 'Çıkış' ? '#dc2626' : '#334155', fontWeight: 650, cursor: 'pointer' }}
                    onClick={() => setDepositForm({ ...depositForm, type: 'Çıkış' })}
                  >
                    - Para Çıkışı
                  </button>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#334155', marginBottom: 4 }}>Hesap</label>
                  <select
                    className={styles.filterSelect}
                    style={{ width: '100%' }}
                    value={depositForm.account}
                    onChange={e => setDepositForm({ ...depositForm, account: e.target.value })}
                  >
                    <option value="Ana Kasa">Ana Kasa</option>
                    <option value="Banka (İş Bankası)">Banka (İş Bankası)</option>
                    <option value="POS Kasası">POS Kasası</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#334155', marginBottom: 4 }}>Tutar (₺)</label>
                  <input
                    type="number"
                    min="1"
                    className={styles.filterSelect}
                    style={{ width: '100%' }}
                    value={depositForm.amount}
                    onChange={e => setDepositForm({ ...depositForm, amount: Number(e.target.value) })}
                    required
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#334155', marginBottom: 4 }}>Açıklama</label>
                  <input
                    type="text"
                    placeholder="İşlem açıklaması..."
                    className={styles.filterSelect}
                    style={{ width: '100%' }}
                    value={depositForm.description}
                    onChange={e => setDepositForm({ ...depositForm, description: e.target.value })}
                  />
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, padding: '16px 20px', borderTop: '1px solid #e2e8f0', background: '#f8fafc' }}>
                <button type="button" className={styles.btnClear} onClick={() => setShowDepositModal(false)}>Vazgeç</button>
                <button type="submit" className={styles.btnPrimaryAction}>İşlemi Kaydet</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: Yeni Satış ── */}
      {showNewSaleModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.55)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'grid', placeItems: 'center', padding: 20 }}>
          <div style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 520, overflow: 'hidden', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid #e2e8f0' }}>
              <h3 style={{ margin: 0, fontSize: 17, color: '#0f172a' }}>Yeni Cihaz / Ürün Satışı & Tahsilat</h3>
              <button style={{ border: 'none', background: 'transparent', fontSize: 20, cursor: 'pointer', color: '#94a3b8' }} onClick={() => setShowNewSaleModal(false)}>✕</button>
            </div>
            <form onSubmit={handleCreateSale}>
              <div style={{ padding: 20, display: 'grid', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#334155', marginBottom: 4 }}>Kayıtlı Hasta <span style={{ color: '#dc2626' }}>*</span></label>
                  <select
                    className={styles.filterSelect}
                    style={{ width: '100%', marginBottom: 6 }}
                    value={saleForm.patientId}
                    onChange={e => {
                      const selectedPatId = e.target.value;
                      const pat = patientsList.find(p => p.id === selectedPatId);
                      setSaleForm({
                        ...saleForm,
                        patientId: selectedPatId,
                        patientName: pat ? `${pat.firstName} ${pat.lastName}` : '',
                        productId: '',
                        deviceEarSide: pat?.hearingLossSide === 'Sol' ? 'Sol' : 'Sağ'
                      });
                    }}
                    required
                  >
                    <option value="">-- Satışın bağlanacağı hastayı seçin --</option>
                    {patientsList.filter(p => matches(p.branch, p.branchId)).map(p => (
                      <option key={p.id} value={p.id}>{p.firstName} {p.lastName} ({p.phone || p.tc || 'Kayıtlı'})</option>
                    ))}
                  </select>
                  <small style={{ color: '#64748b' }}>Satış, fatura ve stok hareketleri seçilen hasta ile aynı şubeye kaydedilir.</small>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#334155', marginBottom: 4 }}>Satılacak Ürün / Cihaz (Stoktan Düşülecek)</label>
                  <select
                    className={styles.filterSelect}
                    style={{ width: '100%' }}
                    value={saleForm.productId}
                    disabled={!salePatient}
                    onChange={e => {
                      const selectedId = e.target.value;
                      const found = stockList.find(s => s.id === selectedId);
                      setSaleForm({
                        ...saleForm,
                        productId: selectedId,
                        amount: found ? found.price : saleForm.amount
                      });
                    }}
                  >
                    <option value="">-- Stoktan Ürün Seçin --</option>
                    {stockList.filter(item => !!salePatient && item.branchId === salePatient.branchId && matches(item.branch, item.branchId)).map(item => (
                      <option key={item.id} value={item.id} disabled={item.quantity <= 0 || item.status !== 'Stokta'}>
                        {item.name} ({item.category}) — Stok: {item.quantity} adet — ₺{item.price.toLocaleString('tr-TR')}
                      </option>
                    ))}
                  </select>
                  {salePatient && stockList.find(item => item.id === saleForm.productId)?.category === 'Cihaz' && salePatient.hearingLossSide === 'Her İki Kulak' && (
                    <div style={{ marginTop: 10 }}>
                      <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#334155', marginBottom: 4 }}>Cihazın atanacağı kulak</label>
                      <select className={styles.filterSelect} style={{ width: '100%' }} value={saleForm.deviceEarSide} onChange={e => setSaleForm({ ...saleForm, deviceEarSide: e.target.value as 'Sağ' | 'Sol' })}>
                        <option value="Sağ">Sağ kulak</option>
                        <option value="Sol">Sol kulak</option>
                      </select>
                    </div>
                  )}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#334155', marginBottom: 4 }}>Satış Tutarı (₺)</label>
                    <input
                      type="number"
                      className={styles.filterSelect}
                      style={{ width: '100%' }}
                      value={saleForm.amount}
                      onChange={e => setSaleForm({ ...saleForm, amount: Number(e.target.value) })}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#334155', marginBottom: 4 }}>Ödeme Yöntemi</label>
                    <select
                      className={styles.filterSelect}
                      style={{ width: '100%' }}
                      value={saleForm.paymentMethod}
                      onChange={e => setSaleForm({ ...saleForm, paymentMethod: e.target.value as 'Nakit' | 'Kredi Kartı' | 'Havale' | 'Taksit' })}
                    >
                      <option value="Nakit">Nakit</option>
                      <option value="Kredi Kartı">Kredi Kartı</option>
                      <option value="Havale">Havale</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#334155', marginBottom: 4 }}>Tahsilat Yapılacak Kasa</label>
                  <select
                    className={styles.filterSelect}
                    style={{ width: '100%' }}
                    value={saleForm.account}
                    onChange={e => setSaleForm({ ...saleForm, account: e.target.value })}
                  >
                    <option value="Ana Kasa">Ana Kasa (Nakit)</option>
                    <option value="Banka (İş Bankası)">Banka (İş Bankası POS/Hesap)</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, padding: '16px 20px', borderTop: '1px solid #e2e8f0', background: '#f8fafc' }}>
                <button type="button" className={styles.btnClear} onClick={() => setShowNewSaleModal(false)}>Vazgeç</button>
                <button type="submit" className={styles.btnPrimaryAction}>Tahsilatı Onayla</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: Yeni Masraf / Gider Kaydet ── */}
      {showNewExpenseModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.55)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'grid', placeItems: 'center', padding: 20 }}>
          <div style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 540, overflow: 'hidden', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid #e2e8f0' }}>
              <h3 style={{ margin: 0, fontSize: 17, color: '#0f172a' }}>Yeni Masraf & Gider Kaydı</h3>
              <button style={{ border: 'none', background: 'transparent', fontSize: 20, cursor: 'pointer', color: '#94a3b8' }} onClick={() => setShowNewExpenseModal(false)}>✕</button>
            </div>
            <form onSubmit={handleCreateExpense}>
              <div style={{ padding: 20, display: 'grid', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#334155', marginBottom: 4 }}>Gider Açıklaması *</label>
                  <input
                    placeholder="Örn: QA test gideri / Elektrik faturası"
                    className={styles.filterSelect}
                    style={{ width: '100%' }}
                    required
                    value={newExpForm.description}
                    onChange={e => setNewExpForm({ ...newExpForm, description: e.target.value })}
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#334155', marginBottom: 4 }}>Kategori</label>
                    <select
                      className={styles.filterSelect}
                      style={{ width: '100%' }}
                      value={newExpForm.category}
                      onChange={e => setNewExpForm({ ...newExpForm, category: e.target.value as any })}
                    >
                      <option value="Kira">Kira</option>
                      <option value="Fatura">Fatura</option>
                      <option value="Maaş">Maaş & Personel</option>
                      <option value="Ofis Gideri">Ofis Giderleri</option>
                      <option value="Bakım & Onarım">Bakım & Onarım</option>
                      <option value="Hizmet Alımı">Hizmet Alımları</option>
                      <option value="Diğer">Diğer</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#334155', marginBottom: 4 }}>Tutar (₺) *</label>
                    <input
                      type="number"
                      min="1"
                      className={styles.filterSelect}
                      style={{ width: '100%' }}
                      required
                      value={newExpForm.amount}
                      onChange={e => setNewExpForm({ ...newExpForm, amount: Number(e.target.value) })}
                    />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#334155', marginBottom: 4 }}>Tedarikçi / Kurum</label>
                    <input
                      placeholder="Örn: CK Enerji"
                      className={styles.filterSelect}
                      style={{ width: '100%' }}
                      value={newExpForm.supplier}
                      onChange={e => setNewExpForm({ ...newExpForm, supplier: e.target.value })}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#334155', marginBottom: 4 }}>Fatura / Fiş No</label>
                    <input
                      placeholder="Örn: E-2026-0012"
                      className={styles.filterSelect}
                      style={{ width: '100%' }}
                      value={newExpForm.invoiceNo}
                      onChange={e => setNewExpForm({ ...newExpForm, invoiceNo: e.target.value })}
                    />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#334155', marginBottom: 4 }}>Ödeme Yöntemi</label>
                    <select
                      className={styles.filterSelect}
                      style={{ width: '100%' }}
                      value={newExpForm.paymentMethod}
                      onChange={e => setNewExpForm({ ...newExpForm, paymentMethod: e.target.value })}
                    >
                      <option value="Nakit">Nakit</option>
                      <option value="Banka">Banka / Havale</option>
                      <option value="Kredi Kartı">Kredi Kartı</option>
                      <option value="Otomatik Ödeme">Otomatik Ödeme</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#334155', marginBottom: 4 }}>Şube</label>
                    <select
                      className={styles.filterSelect}
                      style={{ width: '100%' }}
                      value={newExpForm.branch}
                      onChange={e => setNewExpForm({ ...newExpForm, branch: e.target.value })}
                    >
                      <option value="Test Şube 1">Test Şube 1</option>
                      <option value="Merkez">Merkez</option>
                      <option value="Çankaya">Çankaya</option>
                      <option value="Kadıköy">Kadıköy</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#334155', marginBottom: 4 }}>Notlar</label>
                  <textarea
                    rows={2}
                    className={styles.filterSelect}
                    style={{ width: '100%', height: 'auto', padding: '8px 12px' }}
                    placeholder="Varsa açıklama ekleyin..."
                    value={newExpForm.notes}
                    onChange={e => setNewExpForm({ ...newExpForm, notes: e.target.value })}
                  />
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, padding: '16px 20px', borderTop: '1px solid #e2e8f0', background: '#f8fafc' }}>
                <button type="button" className={styles.btnClear} onClick={() => setShowNewExpenseModal(false)}>Vazgeç</button>
                <button type="submit" className={styles.btnPrimaryAction}>Gideri Kaydet</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: Düzenle Masraf ── */}
      {showEditExpenseModal && selectedExpense && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.55)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'grid', placeItems: 'center', padding: 20 }}>
          <div style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 500, overflow: 'hidden', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid #e2e8f0' }}>
              <h3 style={{ margin: 0, fontSize: 17, color: '#0f172a' }}>Gider Bilgisini Düzenle</h3>
              <button style={{ border: 'none', background: 'transparent', fontSize: 20, cursor: 'pointer', color: '#94a3b8' }} onClick={() => setShowEditExpenseModal(false)}>✕</button>
            </div>
            <div style={{ padding: 20, display: 'grid', gap: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#334155', marginBottom: 4 }}>Açıklama</label>
                <input
                  className={styles.filterSelect}
                  style={{ width: '100%' }}
                  value={selectedExpense.description}
                  onChange={e => setSelectedExpense({ ...selectedExpense, description: e.target.value })}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#334155', marginBottom: 4 }}>Tutar (₺)</label>
                <input
                  type="number"
                  className={styles.filterSelect}
                  style={{ width: '100%' }}
                  value={selectedExpense.amount}
                  onChange={e => setSelectedExpense({ ...selectedExpense, amount: Number(e.target.value) })}
                />
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, padding: '16px 20px', borderTop: '1px solid #e2e8f0', background: '#f8fafc' }}>
              <button className={styles.btnClear} onClick={() => setShowEditExpenseModal(false)}>Vazgeç</button>
              <button
                className={styles.btnPrimaryAction}
                onClick={() => {
                  setExpenses(prev => prev.map(x => x.id === selectedExpense.id ? selectedExpense : x));
                  setShowEditExpenseModal(false);
                  addToast({ type: 'success', message: 'Gider bilgisi güncellendi.' });
                }}
              >
                Kaydet
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
