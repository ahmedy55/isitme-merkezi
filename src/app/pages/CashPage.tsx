'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { useBranchScope } from '../hooks/useBranchScope';
import { formatCurrency, SaleRecord, Expense } from '../data/mockData';
import { dbFetchCashTransactions, dbInsertCashTransaction } from '../lib/database';
import styles from './CashPage.module.css';

interface CashMovement {
  id: string;
  date: string;
  dateKey?: string;
  account: string;
  type: 'Giriş' | 'Çıkış';
  category: string;
  description: string;
  patientOrEntity: string;
  amount: number;
  paymentMethod: string;
  status: 'Tahsil Edildi' | 'Bekleyen' | 'Bekliyor' | 'Taksitli';
  branch: string;
  branchId?: string;
  referenceEntity?: string;
  referenceId?: string;
}

interface ExpenseItem {
  id: string;
  branchId?: string;
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

export default function CashPage() {
  const { addToast, branchesList, patientsList, stockList, addSale, addExpense, updateExpense, deleteExpense, expensesList, salesList, currentOrgId, currentPage } = useApp();
  const { matches, activeBranch } = useBranchScope();
  const activeBranches = useMemo(() => {
    const list = branchesList.filter(branch => !(branch as any).archivedAt && (branch.status === 'Aktif' || (branch.status as string) === 'active'));
    if (list.length > 0) return list;
    if (branchesList.length > 0) return branchesList.filter(branch => !(branch as any).archivedAt);
    return [{ id: 'br-default', name: 'Merkez', status: 'Aktif' as const }];
  }, [branchesList]);

  // Active Main Sub-Tab: 'cash' (Kasa & Tahsilat) or 'expenses' (Masraflar)
  const [mainTab, setMainTab] = useState<'cash' | 'expenses' | 'transfers' | 'reports'>(() => currentPage === 'expenses' ? 'expenses' : 'cash');
  useEffect(() => {
    if (currentPage === 'expenses') setMainTab('expenses');
    else if (currentPage === 'cash') setMainTab('cash');
  }, [currentPage]);

  // ── KASA & TAHSİLAT STATES ──
  const [cashMovements, setCashMovements] = useState<CashMovement[]>([]);
  const [cashRevision, setCashRevision] = useState(0);
  const [cashFilterPill, setCashFilterPill] = useState('Tümü');
  const [cashSelectedAccount, setCashSelectedAccount] = useState('Tüm Hesaplar');
  const [cashSelectedBranch, setCashSelectedBranch] = useState('Tüm Şubeler');
  const [summaryBranch, setSummaryBranch] = useState('Tüm Şubeler');
  const [cashSelectedIds, setCashSelectedIds] = useState<string[]>([]);
  const [cashPage, setCashPage] = useState(1);
  const [cashPageSize, setCashPageSize] = useState(10);
  const [selectedCashMovement, setSelectedCashMovement] = useState<CashMovement | null>(null);

  // ── MASRAFLAR STATES ──
  const [expenses, setExpenses] = useState<ExpenseItem[]>([]);
  const [expenseFilterPill, setExpenseFilterPill] = useState('Tümü');
  const [expenseSearchTerm, setExpenseSearchTerm] = useState('');
  const [expenseSelectedCategory, setExpenseSelectedCategory] = useState('Tüm Kategoriler');
  const [expenseSelectedBranch, setExpenseSelectedBranch] = useState('Tüm Şubeler');
  const [selectedExpense, setSelectedExpense] = useState<ExpenseItem | null>(null);
  const [expenseDrawerTab, setExpenseDrawerTab] = useState<'general' | 'payments'>('general');
  const [expenseSelectedIds, setExpenseSelectedIds] = useState<string[]>([]);
  const [expensePage, setExpensePage] = useState(1);
  const [expensePageSize, setExpensePageSize] = useState(10);

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
    amount: 0,
    account: ''
  });
  const salePatient = patientsList.find(patient => patient.id === saleForm.patientId);

  // Deposit/Withdrawal Form State
  const [depositForm, setDepositForm] = useState({
    type: 'Giriş' as 'Giriş' | 'Çıkış',
    branchId: '',
    account: '',
    amount: 0,
    category: 'Diğer Gelir',
    description: ''
  });

  // New Expense Form State
  const [newExpForm, setNewExpForm] = useState({
    description: '',
    category: 'Kira' as Expense['category'],
    amount: 0,
    supplier: '',
    invoiceNo: '',
    paymentMethod: 'Nakit',
    branch: '',
    notes: ''
  });

  useEffect(() => {
    const validBranchId = (id: string) => activeBranches.some(branch => branch.id === id);
    const singleBranchId = activeBranch.mode === 'single' ? activeBranch.branchId : '';
    const defaultBranch = activeBranches.find(branch => branch.id === singleBranchId) || (activeBranches.length === 1 ? activeBranches[0] : undefined);
    if (!validBranchId(depositForm.branchId)) setDepositForm(form => ({ ...form, branchId: defaultBranch?.id || '' }));
    if (!activeBranches.some(branch => branch.name === newExpForm.branch)) {
      setNewExpForm(form => ({ ...form, branch: defaultBranch?.name || '' }));
    }
  }, [activeBranches, activeBranch, depositForm.branchId, newExpForm.branch]);

  useEffect(() => {
    let cancelled = false;
    if (!currentOrgId) { setCashMovements([]); setExpenses([]); setSelectedExpense(null); return; }
    void Promise.all([dbFetchCashTransactions(), Promise.resolve(expensesList)]).then(([transactions, actualExpenses]) => {
      if (cancelled) return;
      const mappedMovements: CashMovement[] = (transactions as any[]).map(row => {
        const sale = row.referenceEntity === 'sale' ? (salesList.find(item => item.id === row.referenceId) as SaleRecord | undefined) : undefined;
        const expense = row.referenceEntity === 'expense' ? actualExpenses.find(item => item.id === row.referenceId) : undefined;
        const branch = branchesList.find(item => item.id === row.branchId || item.name === row.branch)
          || activeBranches.find(item => item.id === row.branchId || item.name === row.branch);
        const isOutgoing = ['EXPENSE', 'PAYOUT'].includes(row.type);
        return {
          id: row.id, date: row.createdAt ? new Date(row.createdAt).toLocaleString('tr-TR') : '—', dateKey: row.createdAt?.slice(0, 10),
          account: row.cashRegisterId || '—', type: isOutgoing ? 'Çıkış' : 'Giriş', category: row.category || '—',
          description: row.description || '—', patientOrEntity: sale?.patientName || expense?.createdBy || '—',
          amount: Number(row.amount) || 0, paymentMethod: row.paymentMethod || sale?.paymentMethod || expense?.paymentMethod || '—',
          status: 'Tahsil Edildi', branch: branch?.name || row.branch || '—', branchId: row.branchId || branch?.id, referenceEntity: row.referenceEntity, referenceId: row.referenceId,
        };
      });
      const mappedExpenses: ExpenseItem[] = actualExpenses.map(expense => ({
        id: expense.id, branchId: expense.branchId, date: expense.date, description: expense.description,
        category: expense.category as ExpenseItem['category'], supplier: '—', invoiceNo: expense.receiptNo || '—',
        paymentMethod: expense.paymentMethod, amount: expense.amount,
        branch: branchesList.find(item => item.id === expense.branchId)?.name || expense.branch || '—',
        status: 'Ödendi', notes: expense.notes,
      }));
      setCashMovements(mappedMovements);
      setExpenses(mappedExpenses);
      setSelectedExpense(current => current ? mappedExpenses.find(item => item.id === current.id) || null : null);
    }).catch(() => { if (!cancelled) { setCashMovements([]); setExpenses([]); } });
    return () => { cancelled = true; };
  }, [currentOrgId, branchesList, expensesList, salesList, cashRevision, activeBranches]);

  // Filtered Cash Movements
  const filteredCashMovements = useMemo(() => {
    return cashMovements.filter(item => {
      if (!matches(item.branch, item.branchId)) return false;
      const targetBranch = cashSelectedBranch !== 'Tüm Şubeler' ? cashSelectedBranch : (summaryBranch !== 'Tüm Şubeler' ? summaryBranch : null);
      if (targetBranch) {
        const foundBranch = activeBranches.find(b => b.name === targetBranch || b.id === targetBranch)
          || branchesList.find(b => b.name === targetBranch || b.id === targetBranch);
        const targetName = foundBranch ? foundBranch.name : targetBranch;
        const targetId = foundBranch ? foundBranch.id : targetBranch;
        if (item.branch !== targetName && item.branchId !== targetId) return false;
      }
      if (cashFilterPill === 'Girişler' && item.type !== 'Giriş') return false;
      if (cashFilterPill === 'Çıkışlar' && item.type !== 'Çıkış') return false;
      if (cashFilterPill === 'Tahsil Edildi' && item.status !== 'Tahsil Edildi') return false;
      if (cashFilterPill === 'Bekleyen' && item.status !== 'Bekleyen' && item.status !== 'Bekliyor') return false;
      if (cashFilterPill === 'Taksitli' && item.status !== 'Taksitli') return false;
      if (cashSelectedAccount !== 'Tüm Hesaplar' && item.account !== cashSelectedAccount) return false;
      return true;
    });
  }, [cashMovements, cashFilterPill, cashSelectedAccount, cashSelectedBranch, summaryBranch, activeBranches, branchesList, matches]);

  const getMethodNet = (method: string) => cashMovements
    .filter(item => (summaryBranch === 'Tüm Şubeler' || item.branch === summaryBranch) && item.paymentMethod === method)
    .reduce((total, item) => total + (item.type === 'Giriş' ? item.amount : -item.amount), 0);
  const cashNetTotal = cashMovements
    .filter(item => summaryBranch === 'Tüm Şubeler' || item.branch === summaryBranch)
    .reduce((total, item) => total + (item.type === 'Giriş' ? item.amount : -item.amount), 0);
  const currentMonthKey = new Date().toISOString().slice(0, 7);
  const currentMonthMovements = cashMovements.filter(item => matches(item.branch, item.branchId) && item.dateKey?.startsWith(currentMonthKey));
  const currentMonthNet = currentMonthMovements.reduce((total, item) => total + (item.type === 'Giriş' ? item.amount : -item.amount), 0);
  const currentMonthSales = salesList.filter(sale => sale.date?.startsWith(currentMonthKey)).reduce((sum, sale) => sum + Number(sale.total || 0), 0);
  const currentMonthCollected = currentMonthMovements.filter(item => item.type === 'Giriş').reduce((sum, item) => sum + item.amount, 0);
  const currentMonthSalesCollected = currentMonthMovements
    .filter(item => item.type === 'Giriş' && item.referenceEntity === 'sale')
    .reduce((sum, item) => sum + item.amount, 0);
  const currentMonthExpenses = expensesList.filter(expense => expense.date?.startsWith(currentMonthKey)).reduce((sum, expense) => sum + Number(expense.amount || 0), 0);
  const currentYearExpenses = expensesList.filter(expense => expense.date?.startsWith(String(new Date().getFullYear()))).reduce((sum, expense) => sum + Number(expense.amount || 0), 0);
  const recentMonths = Array.from({ length: 3 }, (_, index) => {
    const date = new Date(); date.setDate(1); date.setMonth(date.getMonth() - index);
    return date.toISOString().slice(0, 7);
  });
  const averageRecentMonthlyExpenses = recentMonths.reduce((total, month) => total + expensesList.filter(expense => expense.date?.startsWith(month)).reduce((sum, expense) => sum + Number(expense.amount || 0), 0), 0) / recentMonths.length;
  const highestExpenseCategory = expensesList.reduce<{category: string; total: number}>((highest, expense) => {
    const total = expensesList.filter(item => item.category === expense.category && item.date?.startsWith(currentMonthKey)).reduce((sum, item) => sum + Number(item.amount || 0), 0);
    return total > highest.total ? { category: expense.category, total } : highest;
  }, { category: '—', total: 0 });
  const pendingCollections = salesList.filter(sale => sale.status !== 'Tahsil Edildi').reduce((sum, sale) => sum + Number(sale.patientAmount || sale.total || 0), 0);
  const monthlyCollectionRate = currentMonthSales > 0 ? Math.round(currentMonthSalesCollected / currentMonthSales * 100) : null;
  const cashChartMonths = Array.from({ length: 12 }, (_, index) => {
    const date = new Date(); date.setDate(1); date.setMonth(date.getMonth() - 11 + index);
    const key = date.toISOString().slice(0, 7);
    const rows = cashMovements.filter(item => item.dateKey?.startsWith(key));
    return { month: date.toLocaleDateString('tr-TR', { month: 'short' }), income: rows.filter(item => item.type === 'Giriş').reduce((sum, row) => sum + row.amount, 0), expense: rows.filter(item => item.type === 'Çıkış').reduce((sum, row) => sum + row.amount, 0) };
  });
  const cashChartMax = Math.max(1, ...cashChartMonths.flatMap(month => [month.income, month.expense]));
  // Transfer Movements & Summary
  const transferMovements = useMemo(() => {
    return cashMovements.filter(item => {
      const type = (item.type || '').toUpperCase();
      const cat = (item.category || '').toLowerCase();
      const acc = (item.account || '').toLowerCase();
      const method = (item.paymentMethod || '').toLowerCase();
      const desc = (item.description || '').toLowerCase();
      return type === 'TRANSFER'
        || cat.includes('transfer') || cat.includes('havale') || cat.includes('eft')
        || acc.includes('banka') || acc.includes('ziraat') || acc.includes('garanti') || acc.includes('iş') || acc.includes('yapı') || acc.includes('pos')
        || method.includes('havale') || method.includes('eft') || method.includes('banka')
        || desc.includes('transfer') || desc.includes('havale') || desc.includes('eft') || desc.includes('banka');
    });
  }, [cashMovements]);

  const transferTotalAmount = useMemo(() => {
    return transferMovements.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  }, [transferMovements]);

  const havaleEftTotal = useMemo(() => {
    return cashMovements
      .filter(item => {
        const method = (item.paymentMethod || '').toLowerCase();
        const cat = (item.category || '').toLowerCase();
        const acc = (item.account || '').toLowerCase();
        return method.includes('havale') || method.includes('eft') || cat.includes('havale') || cat.includes('eft') || acc.includes('banka') || (item.type || '').toUpperCase() === 'TRANSFER';
      })
      .reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  }, [cashMovements]);

  // Filtered Expenses
  const filteredExpenses = useMemo(() => {
    return expenses.filter(item => {
      if (!matches(item.branch, item.branchId)) return false;
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

  const cashPageCount = Math.max(1, Math.ceil(filteredCashMovements.length / cashPageSize));
  const pagedCashMovements = filteredCashMovements.slice((cashPage - 1) * cashPageSize, cashPage * cashPageSize);
  const expensePageCount = Math.max(1, Math.ceil(filteredExpenses.length / expensePageSize));
  const pagedExpenses = filteredExpenses.slice((expensePage - 1) * expensePageSize, expensePage * expensePageSize);
  useEffect(() => setCashPage(1), [cashFilterPill, cashSelectedAccount, cashPageSize]);
  useEffect(() => setExpensePage(1), [expenseFilterPill, expenseSelectedCategory, expenseSelectedBranch, expenseSearchTerm, expensePageSize]);
  useEffect(() => setCashPage(page => Math.min(page, cashPageCount)), [cashPageCount]);
  useEffect(() => setExpensePage(page => Math.min(page, expensePageCount)), [expensePageCount]);

  // Handle Create Deposit/Withdrawal
  const handleCreateDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = Number(depositForm.amount);
    const branchId = activeBranch.mode === 'single' ? activeBranch.branchId : depositForm.branchId;
    const branchName = activeBranches.find(branch => branch.id === branchId)?.name;
    if (!currentOrgId || !branchId || !branchName || !depositForm.account.trim() || amount <= 0) {
      addToast({ type: 'error', message: 'Firma, şube, kasa hesabı ve sıfırdan büyük tutar gerekli.' });
      return;
    }
    try {
      const saved = await dbInsertCashTransaction({
        branchId, cashRegisterId: depositForm.account.trim(),
        type: depositForm.type === 'Giriş' ? 'INCOME' : 'EXPENSE', amount,
        category: depositForm.category,
        description: depositForm.description.trim() || (depositForm.type === 'Giriş' ? 'Kasa para girişi' : 'Kasa para çıkışı'),
      });
      const newMovement: CashMovement = {
      id: saved.id,
      dateKey: saved.createdAt?.slice(0, 10),
      date: new Date().toLocaleString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
      account: saved.cashRegisterId,
      type: depositForm.type,
      category: depositForm.category,
      description: depositForm.description || (depositForm.type === 'Giriş' ? 'Kasa Para Girişi' : 'Kasa Para Çıkışı'),
      patientOrEntity: '—',
      amount,
      paymentMethod: depositForm.account.includes('Banka') ? 'Banka' : 'Nakit',
      status: 'Tahsil Edildi',
      branch: branchName,
      branchId
    };

    setCashMovements(prev => [newMovement, ...prev.filter(item => item.id !== newMovement.id)]);
    setCashRevision(version => version + 1);
    setShowDepositModal(false);
    addToast({ type: 'success', message: `${formatCurrency(newMovement.amount)} ${newMovement.type.toLowerCase()} hareketi kaydedildi.` });
    } catch (error) {
      addToast({ type: 'error', message: error instanceof Error ? error.message : 'Kasa hareketi kaydedilemedi.' });
    }
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
      }, selectedStock?.id, saleForm.account.trim());

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
  const handleCreateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExpForm.description.trim()) {
      addToast({ type: 'warning', message: 'Lütfen masraf açıklamasını girin.' });
      return;
    }

    const branchRecord = branchesList.find(branch => branch.name === newExpForm.branch)
      || activeBranches.find(b => b.name === newExpForm.branch)
      || activeBranches[0];
    if (!branchRecord) { addToast({ type: 'error', message: 'Gerçek bir şube seçin.' }); return; }
    const newExpense: Expense & { idempotencyKey: string } = {
      id: crypto.randomUUID(),
      idempotencyKey: crypto.randomUUID(),
      date: new Date().toISOString().slice(0, 10),
      description: newExpForm.description,
      category: newExpForm.category as Expense['category'],
      paymentMethod: (newExpForm.paymentMethod === 'Banka' ? 'Havale' : newExpForm.paymentMethod) as Expense['paymentMethod'],
      amount: Number(newExpForm.amount) || 0,
      branch: newExpForm.branch,
      branchId: branchRecord.id,
      createdBy: 'Mevcut kullanıcı',
      receiptNo: newExpForm.invoiceNo || undefined,
      notes: newExpForm.notes || undefined,
    };

    try {
      await addExpense(newExpense);
      setShowNewExpenseModal(false);
      setNewExpForm(form => ({ ...form, description: '', amount: 0, supplier: '', invoiceNo: '', notes: '' }));
    } catch { /* Context error is shown to the user. */ }
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
                onClick={() => {
                  const defaultBranch = activeBranch.mode === 'single'
                    ? activeBranches.find(branch => branch.id === activeBranch.branchId) || activeBranches[0]
                    : activeBranches[0];
                  setNewExpForm({
                    description: '',
                    category: 'Kira',
                    amount: 0,
                    supplier: '',
                    invoiceNo: '',
                    paymentMethod: 'Nakit',
                    branch: defaultBranch?.name || activeBranches[0]?.name || 'Merkez',
                    notes: ''
                  });
                  setShowNewExpenseModal(true);
                }}
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
                <span>Bu Ay Net Kasa Hareketi</span>
                <strong>{formatCurrency(currentMonthNet)}</strong>
                <div className={styles.statTrend}>
                  <span className={styles.statSubtext}>veritabanındaki giriş − çıkış</span>
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
                <strong>{formatCurrency(currentMonthSales)}</strong>
                <div className={styles.statTrend}>
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
                <strong>{formatCurrency(currentMonthCollected)}</strong>
                <div className={styles.statTrend}>
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
                <strong>{formatCurrency(pendingCollections)}</strong>
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
                {cashChartMonths.map((item, idx) => (
                  <div key={idx} className={styles.chartCol}>
                    <div className={styles.barsGroup}>
                      <div className={styles.barGelir} style={{ height: `${item.income / cashChartMax * 100}%` }} title={`Gelir: ${formatCurrency(item.income)}`} />
                      <div className={styles.barGider} style={{ height: `${item.expense / cashChartMax * 100}%` }} title={`Gider: ${formatCurrency(item.expense)}`} />
                    </div>
                    <span className={styles.chartLabel}>{item.month}</span>
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
                <select
                  className={styles.filterSelect}
                  style={{ height: 30, minWidth: 100 }}
                  value={summaryBranch}
                  onChange={event => {
                    setSummaryBranch(event.target.value);
                    setCashSelectedBranch(event.target.value);
                  }}
                >
                  <option value="Tüm Şubeler">Tüm Şubeler</option>
                  {activeBranches.map(branch => <option key={branch.id} value={branch.name}>{branch.name}</option>)}
                </select>
              </div>

              <div className={styles.summaryList}>
                <div className={styles.summaryRow}>
                  <div className={styles.summaryLabel}>
                    <span style={{ color: '#08785b' }}>💵</span> Nakit
                  </div>
                  <div className={styles.summaryVal}>{formatCurrency(getMethodNet('Nakit'))}</div>
                </div>

                <div className={styles.summaryRow}>
                  <div className={styles.summaryLabel}>
                    <span style={{ color: '#0284c7' }}>💳</span> Kredi Kartı
                  </div>
                  <div className={styles.summaryVal}>{formatCurrency(getMethodNet('Kredi Kartı'))}</div>
                </div>

                <div className={styles.summaryRow}>
                  <div className={styles.summaryLabel}>
                    <span style={{ color: '#7e22ce' }}>🏦</span> Havale / EFT
                  </div>
                  <div className={styles.summaryVal}>{formatCurrency(getMethodNet('Havale'))}</div>
                </div>

                <div className={styles.summaryRow}>
                  <div className={styles.summaryLabel}>
                    <span style={{ color: '#475569' }}>📱</span> Diğer
                  </div>
                  <div className={styles.summaryVal}>{formatCurrency(getMethodNet('Diğer'))}</div>
                </div>

                <div className={styles.summaryTotalRow}>
                  <div className={styles.summaryTotalLabel}>Toplam Bakiye</div>
                  <div className={styles.summaryTotalVal}>{formatCurrency(cashNetTotal)}</div>
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
                <span>{new Date(new Date().getFullYear(), new Date().getMonth(), 1).toLocaleDateString('tr-TR')} - {new Date().toLocaleDateString('tr-TR')}</span>
              </div>

              <select
                className={styles.filterSelect}
                aria-label="Şube Filtresi"
                value={cashSelectedBranch}
                onChange={e => {
                  setCashSelectedBranch(e.target.value);
                  setSummaryBranch(e.target.value);
                }}
              >
                <option value="Tüm Şubeler">Tüm Şubeler</option>
                {activeBranches.map(branch => <option key={branch.id} value={branch.name}>{branch.name}</option>)}
              </select>

              <select
                className={styles.filterSelect}
                value={cashSelectedAccount}
                onChange={e => setCashSelectedAccount(e.target.value)}
              >
                <option value="Tüm Hesaplar">Tüm Hesaplar</option>
              {[...new Set(cashMovements.map(item => item.account).filter(Boolean))].map(account => <option key={account} value={account}>{account}</option>)}
              </select>

              <button className={styles.btnFilter} onClick={() => addToast({ type: 'info', message: 'Filtreler uygulandı.' })}>
                Filtrele
              </button>

              <button
                className={styles.btnClear}
                onClick={() => {
                  setCashFilterPill('Tümü');
                  setCashSelectedAccount('Tüm Hesaplar');
                  setCashSelectedBranch('Tüm Şubeler');
                  setSummaryBranch('Tüm Şubeler');
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
                  {pagedCashMovements.length === 0 ? <tr><td colSpan={11} style={{ padding: 32, textAlign: 'center', color: '#64748b' }}>Kriterlere uygun kasa hareketi bulunamadı.</td></tr> : pagedCashMovements.map(row => {
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
                            <button type="button" className={styles.btnActionIcon} title="Görüntüle" onClick={event => { event.stopPropagation(); setSelectedCashMovement(row); }}>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                <circle cx="12" cy="12" r="3" />
                              </svg>
                            </button>
                            <button type="button" className={styles.btnActionIcon} title="Düzenle" onClick={event => {
                              event.stopPropagation();
                              const mappedExpense = row.referenceEntity === 'expense' ? expenses.find(item => item.id === row.referenceId) : undefined;
                              if (mappedExpense) { setSelectedExpense(mappedExpense); setShowEditExpenseModal(true); }
                              else addToast({ type: 'info', message: 'Bu hareketin kaynağı satış veya tahsilat kaydıdır; doğrudan kasa hareketinden düzenlenemez.' });
                            }}>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M12 20h9" />
                                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                              </svg>
                            </button>
                            <div style={{ position: 'relative' }}>
                            <button type="button" className={styles.btnActionIcon} title="Menü" aria-expanded={activeMenuId === row.id} onClick={event => { event.stopPropagation(); setActiveMenuId(activeMenuId === row.id ? null : row.id); }}>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <circle cx="12" cy="12" r="1" />
                                <circle cx="12" cy="5" r="1" />
                                <circle cx="12" cy="19" r="1" />
                              </svg>
                            </button>
                            {activeMenuId === row.id && <div role="menu" style={{ position: 'absolute', right: 0, top: '100%', zIndex: 30, minWidth: 170, padding: 5, border: '1px solid #dbe4ea', borderRadius: 8, background: '#fff', boxShadow: '0 8px 22px rgba(15,23,42,.14)' }}>
                              <button type="button" role="menuitem" className={styles.btnClear} style={{ width: '100%', textAlign: 'left' }} onClick={event => { event.stopPropagation(); setSelectedCashMovement(row); setActiveMenuId(null); }}>İşlem detayını gör</button>
                              <button type="button" role="menuitem" className={styles.btnClear} style={{ width: '100%', textAlign: 'left' }} onClick={event => {
                                event.stopPropagation(); setActiveMenuId(null);
                                const mappedExpense = row.referenceEntity === 'expense' ? expenses.find(item => item.id === row.referenceId) : undefined;
                                if (mappedExpense) { setSelectedExpense(mappedExpense); setShowEditExpenseModal(true); }
                                else addToast({ type: 'info', message: 'Bu hareketin kaynağı satış veya tahsilat kaydıdır; doğrudan kasa hareketinden düzenlenemez.' });
                              }}>Düzenleme seçenekleri</button>
                            </div>}
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className={styles.tableFooter}>
              <div>Toplam {filteredCashMovements.length} kayıt | {cashSelectedIds.length} kayıt seçili</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {filteredCashMovements.length > 0 && <>
                  <div className={styles.pagination}>
                    <button type="button" className={styles.pageBtn} disabled={cashPage <= 1} onClick={() => setCashPage(page => Math.max(1, page - 1))} aria-label="Önceki sayfa">‹</button>
                    {Array.from({ length: cashPageCount }, (_, index) => index + 1).map(page => <button type="button" key={page} className={`${styles.pageBtn} ${cashPage === page ? styles.pageBtnActive : ''}`} aria-current={cashPage === page ? 'page' : undefined} onClick={() => setCashPage(page)}>{page}</button>)}
                    <button type="button" className={styles.pageBtn} disabled={cashPage >= cashPageCount} onClick={() => setCashPage(page => Math.min(cashPageCount, page + 1))} aria-label="Sonraki sayfa">›</button>
                  </div>
                  <select aria-label="Sayfa başına kasa hareketi" className={styles.filterSelect} style={{ height: 30, minWidth: 90 }} value={cashPageSize} onChange={event => setCashPageSize(Number(event.target.value))}>
                    <option value={10}>10 / sayfa</option><option value={25}>25 / sayfa</option><option value={50}>50 / sayfa</option>
                  </select>
                </>}
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
                <strong>{formatCurrency(currentMonthExpenses)}</strong>
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
                <strong>{highestExpenseCategory.total ? highestExpenseCategory.category : '—'}</strong>
                <span className={styles.statSubtext}>{formatCurrency(highestExpenseCategory.total)}</span>
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
                <strong>{formatCurrency(averageRecentMonthlyExpenses)}</strong>
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
                <strong>{formatCurrency(currentYearExpenses)}</strong>
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
              aria-label="Gider şubesi filtresi"
              value={expenseSelectedBranch}
              onChange={e => setExpenseSelectedBranch(e.target.value)}
            >
              <option value="Tüm Şubeler">Tüm Şubeler</option>
              {activeBranches.map(branch => <option key={branch.id} value={branch.name}>{branch.name}</option>)}
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
                    {pagedExpenses.length === 0 ? <tr><td colSpan={10} style={{ padding: 32, textAlign: 'center', color: '#64748b' }}>Kriterlere uygun gider kaydı bulunamadı.</td></tr> : pagedExpenses.map(row => {
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
                              <div style={{ position: 'relative' }}>
                              <button type="button" className={styles.btnActionIcon} title="Menü" aria-expanded={activeMenuId === row.id} onClick={event => { event.stopPropagation(); setActiveMenuId(activeMenuId === row.id ? null : row.id); }}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                  <circle cx="12" cy="12" r="1" />
                                  <circle cx="12" cy="5" r="1" />
                                  <circle cx="12" cy="19" r="1" />
                                </svg>
                              </button>
                              {activeMenuId === row.id && <div role="menu" style={{ position: 'absolute', right: 0, top: '100%', zIndex: 30, minWidth: 170, padding: 5, border: '1px solid #dbe4ea', borderRadius: 8, background: '#fff', boxShadow: '0 8px 22px rgba(15,23,42,.14)' }}>
                                <button type="button" role="menuitem" className={styles.btnClear} style={{ width: '100%', textAlign: 'left' }} onClick={event => { event.stopPropagation(); setSelectedExpense(row); setActiveMenuId(null); }}>Gider detayını gör</button>
                                <button type="button" role="menuitem" className={styles.btnClear} style={{ width: '100%', textAlign: 'left' }} onClick={event => { event.stopPropagation(); setSelectedExpense(row); setShowEditExpenseModal(true); setActiveMenuId(null); }}>Gideri düzenle</button>
                              </div>}
                              </div>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className={styles.tableFooter}>
                <div>Toplam {filteredExpenses.length} kayıt | {expenseSelectedIds.length} kayıt seçili</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  {filteredExpenses.length > 0 && <>
                    <div className={styles.pagination}>
                      <button type="button" className={styles.pageBtn} disabled={expensePage <= 1} onClick={() => setExpensePage(page => Math.max(1, page - 1))} aria-label="Önceki sayfa">‹</button>
                      {Array.from({ length: expensePageCount }, (_, index) => index + 1).map(page => <button type="button" key={page} className={`${styles.pageBtn} ${expensePage === page ? styles.pageBtnActive : ''}`} aria-current={expensePage === page ? 'page' : undefined} onClick={() => setExpensePage(page)}>{page}</button>)}
                      <button type="button" className={styles.pageBtn} disabled={expensePage >= expensePageCount} onClick={() => setExpensePage(page => Math.min(expensePageCount, page + 1))} aria-label="Sonraki sayfa">›</button>
                    </div>
                    <select aria-label="Sayfa başına gider" className={styles.filterSelect} style={{ height: 30, minWidth: 90 }} value={expensePageSize} onChange={event => setExpensePageSize(Number(event.target.value))}>
                      <option value={10}>10 / sayfa</option><option value={25}>25 / sayfa</option><option value={50}>50 / sayfa</option>
                    </select>
                  </>}
                </div>
              </div>
            </div>

            {/* Gider detay paneli */}
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
                  <button type="button" aria-selected={expenseDrawerTab === 'general'} className={`${styles.drawerTabBtn} ${expenseDrawerTab === 'general' ? styles.drawerTabBtnActive : ''}`} onClick={() => setExpenseDrawerTab('general')}>Genel</button>
                  <button type="button" aria-selected={expenseDrawerTab === 'payments'} className={`${styles.drawerTabBtn} ${expenseDrawerTab === 'payments' ? styles.drawerTabBtnActive : ''}`} onClick={() => setExpenseDrawerTab('payments')}>Ödeme Geçmişi</button>
                </div>

                <div className={styles.drawerBody}>
                  {expenseDrawerTab === 'general' ? <>
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
                        onClick={async () => {
                          if (!window.confirm('Bu gider kaydını iptal etmek istediğinize emin misiniz?')) return;
                          await deleteExpense(selectedExpense.id);
                          setSelectedExpense(null);
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
                            category: (selectedExpense.category === 'Ofis Gideri' ? 'Malzeme' : selectedExpense.category === 'Hizmet Alımı' ? 'Diğer' : selectedExpense.category) as Expense['category'],
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
                  </> : <div className={styles.drawerSection}>
                    <span className={styles.sectionTitle}>Ödeme Geçmişi</span>
                    {cashMovements.filter(item => item.referenceEntity === 'expense' && item.referenceId === selectedExpense.id).length ? (
                      cashMovements.filter(item => item.referenceEntity === 'expense' && item.referenceId === selectedExpense.id).map(item => <div key={item.id} className={styles.infoGrid}>
                        <div className={styles.infoRow}><span>Tarih</span><strong>{item.date}</strong></div>
                        <div className={styles.infoRow}><span>Tutar</span><strong>{formatCurrency(item.amount)}</strong></div>
                        <div className={styles.infoRow}><span>Yöntem</span><strong>{item.paymentMethod}</strong></div>
                        <div className={styles.infoRow}><span>Durum</span><strong>{item.status}</strong></div>
                      </div>)
                    ) : <p>Bu gider için kayıtlı ödeme hareketi bulunmuyor.</p>}
                  </div>}
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
        <div style={{ display: 'grid', gap: 20 }}>
          {/* Transfer Summary Area / Kasa Özeti */}
          <div className={styles.summaryCard} style={{ background: '#fff', border: '1px solid var(--csh-border)', borderRadius: 14, padding: 20 }}>
            <div className={styles.summaryHeader} style={{ marginBottom: 16 }}>
              <div className={styles.summaryTitle} style={{ fontSize: 16, fontWeight: 750, display: 'flex', alignItems: 'center', gap: 8 }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#08785b" strokeWidth="2">
                  <rect x="2" y="4" width="20" height="16" rx="2" />
                  <line x1="2" y1="10" x2="22" y2="10" />
                </svg>
                Kasa Özeti & Havale-EFT İşlemleri
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
              <div style={{ padding: 16, background: '#f8fafc', borderRadius: 12, border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: 12, color: '#64748b' }}>Havale-EFT Toplamı</div>
                <div style={{ fontSize: 22, fontWeight: 700, color: '#08785b', marginTop: 4 }}>
                  {formatCurrency(havaleEftTotal || transferTotalAmount)}
                </div>
                <small style={{ color: '#64748b', fontSize: 11 }}>Kasa Özeti / Havale-EFT totals</small>
              </div>
              <div style={{ padding: 16, background: '#f8fafc', borderRadius: 12, border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: 12, color: '#64748b' }}>Toplam Transfer Kaydı</div>
                <div style={{ fontSize: 22, fontWeight: 700, color: '#2563eb', marginTop: 4 }}>
                  {transferMovements.length} adet
                </div>
                <small style={{ color: '#64748b', fontSize: 11 }}>Banka transfer hareketleri</small>
              </div>
              <div style={{ padding: 16, background: '#f8fafc', borderRadius: 12, border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: 12, color: '#64748b' }}>Banka & POS Hesap Toplamı</div>
                <div style={{ fontSize: 22, fontWeight: 700, color: '#7c3aed', marginTop: 4 }}>
                  {formatCurrency(transferTotalAmount)}
                </div>
                <small style={{ color: '#64748b', fontSize: 11 }}>Transfer toplam tutarı</small>
              </div>
            </div>
          </div>

          {/* Detailed Transfer Records Table */}
          <div className={styles.tableSection} style={{ background: '#fff', border: '1px solid var(--csh-border)', borderRadius: 14, padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: 17, color: '#0f172a' }}>Banka Transfer Kayıtları</h3>
              <span style={{ fontSize: 13, color: '#64748b' }}>Toplam {transferMovements.length} transfer kaydı</span>
            </div>
            <div className={styles.tableWrap}>
              <table className={styles.dataTable}>
                <thead>
                  <tr>
                    <th>Tarih</th>
                    <th>Hesap / Banka</th>
                    <th>İşlem Türü</th>
                    <th>Kategori</th>
                    <th>Açıklama</th>
                    <th>Hasta / Cari</th>
                    <th>Tutar</th>
                    <th>Şube</th>
                    <th>Durum</th>
                  </tr>
                </thead>
                <tbody>
                  {transferMovements.length === 0 ? (
                    <tr>
                      <td colSpan={9} style={{ padding: 32, textAlign: 'center', color: '#64748b' }}>
                        Kayıtlı banka transfer hareketi bulunamadı.
                      </td>
                    </tr>
                  ) : (
                    transferMovements.map(row => (
                      <tr key={row.id}>
                        <td style={{ whiteSpace: 'nowrap' }}>{row.date}</td>
                        <td style={{ fontWeight: 600 }}>{row.account}</td>
                        <td>
                          <span className={styles.badgeOperationIn}>
                            {row.type}
                          </span>
                        </td>
                        <td>
                          <span className={styles.badgeCategoryPill}>{row.category}</span>
                        </td>
                        <td>{row.description}</td>
                        <td>{row.patientOrEntity}</td>
                        <td style={{ fontWeight: 700, color: '#08785b' }}>
                          {formatCurrency(row.amount)}
                        </td>
                        <td>{row.branch}</td>
                        <td>
                          <span className={styles.badgeStatusPaid}>{row.status}</span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
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
              <div style={{ fontSize: 22, fontWeight: 700, color: '#08785b', marginTop: 4 }}>{formatCurrency(currentMonthCollected - currentMonthExpenses)}</div>
            </div>
            <div style={{ padding: 16, background: '#f8fafc', borderRadius: 12, border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: 12, color: '#64748b' }}>Gider / Gelir Oranı</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: '#0284c7', marginTop: 4 }}>{currentMonthCollected > 0 ? `%${Math.round(currentMonthExpenses / currentMonthCollected * 100)}` : '—'}</div>
            </div>
            <div style={{ padding: 16, background: '#f8fafc', borderRadius: 12, border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: 12, color: '#64748b' }}>Tahsilat Oranı</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: '#08785b', marginTop: 4 }}>{monthlyCollectionRate === null ? '—' : `%${monthlyCollectionRate}`}</div>
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
                  <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#334155', marginBottom: 4 }}>Şube</label>
                  <select
                    className={styles.filterSelect}
                    style={{ width: '100%' }}
                    aria-label="Şube"
                    value={activeBranch.mode === 'single' ? activeBranch.branchId : depositForm.branchId}
                    disabled={activeBranch.mode === 'single'}
                    onChange={e => setDepositForm({ ...depositForm, branchId: e.target.value })}
                    required
                  >
                    <option value="">Şube seçin</option>
                    {activeBranches.map(branch => <option key={branch.id} value={branch.id}>{branch.name}</option>)}
                  </select>
                  {activeBranches.length === 0 && <small style={{ color: '#b91c1c' }}>İşlem yapabilmek için önce aktif bir şube oluşturun.</small>}
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#334155', marginBottom: 4 }}>Hesap</label>
                  <input
                    type="text"
                    className={styles.filterSelect}
                    style={{ width: '100%' }}
                    value={depositForm.account}
                    placeholder="Kasa hesabı adı"
                    onChange={e => setDepositForm({ ...depositForm, account: e.target.value })}
                  />
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
                  <input
                    type="text"
                    className={styles.filterSelect}
                    style={{ width: '100%' }}
                    value={saleForm.account}
                    placeholder="Kasa hesabı adı"
                    onChange={e => setSaleForm({ ...saleForm, account: e.target.value })}
                  />
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
                    placeholder="Örn: Elektrik faturası, kira, bakım hizmeti"
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
                      aria-label="Gider şubesi"
                      value={newExpForm.branch}
                      onChange={e => setNewExpForm({ ...newExpForm, branch: e.target.value })}
                    >
                      <option value="">Şube seçin</option>
                      {activeBranches.map(branch => <option key={branch.id} value={branch.name}>{branch.name}</option>)}
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
                onClick={async () => {
                  const stored = expensesList.find(item => item.id === selectedExpense.id);
                  if (!stored) { addToast({ type: 'error', message: 'Gider veritabanında bulunamadı.' }); return; }
                  try {
                    await updateExpense({ ...stored, description: selectedExpense.description, amount: selectedExpense.amount });
                    setShowEditExpenseModal(false);
                  } catch { /* Context reports the persistence failure. */ }
                }}
              >
                Kaydet
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedCashMovement && <div role="presentation" onClick={() => setSelectedCashMovement(null)} style={{ position: 'fixed', inset: 0, zIndex: 1100, display: 'grid', placeItems: 'center', padding: 20, background: 'rgba(15,23,42,.55)' }}>
        <section role="dialog" aria-modal="true" aria-labelledby="cash-movement-title" onClick={event => event.stopPropagation()} style={{ width: 'min(100%, 480px)', borderRadius: 14, background: '#fff', boxShadow: '0 20px 48px rgba(0,0,0,.22)', overflow: 'hidden' }}>
          <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid #e2e8f0' }}>
            <h2 id="cash-movement-title" style={{ margin: 0, fontSize: 17 }}>Kasa hareketi detayı</h2>
            <button type="button" className={styles.btnClear} aria-label="Detayı kapat" onClick={() => setSelectedCashMovement(null)}>✕</button>
          </header>
          <dl style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, padding: 20, margin: 0 }}>
            <dt>Tarih</dt><dd>{selectedCashMovement.date}</dd>
            <dt>İşlem</dt><dd>{selectedCashMovement.type} · {selectedCashMovement.category}</dd>
            <dt>Açıklama</dt><dd>{selectedCashMovement.description}</dd>
            <dt>Hasta / Cari</dt><dd>{selectedCashMovement.patientOrEntity}</dd>
            <dt>Tutar</dt><dd>{formatCurrency(selectedCashMovement.amount)}</dd>
            <dt>Ödeme şekli</dt><dd>{selectedCashMovement.paymentMethod}</dd>
            <dt>Şube</dt><dd>{selectedCashMovement.branch}</dd>
            <dt>Durum</dt><dd>{selectedCashMovement.status}</dd>
          </dl>
        </section>
      </div>}
    </div>
  );
}
