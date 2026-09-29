'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { useBranchScope } from '../hooks/useBranchScope';
import { supabase } from '../lib/supabase';
import { expectedPaymentMonth, monthKey, monthLabel, monthsUntil } from '../lib/sgkSchedule';
import { formatCurrency } from '../data/mockData';
import styles from './SgkReceivablesPage.module.css';

interface InvoiceRecord {
  id: string;
  branch_id?: string;
  branchName?: string;
  invoice_month: string; // e.g. 2026-09
  invoice_period_label: string; // e.g. Eylül 2026
  expected_month: string; // e.g. 2026-11
  expected_month_label: string; // e.g. Kasım 2026
  invoice_no: string;
  amount: number;
  status: 'Bekliyor' | 'Tahsil Edildi' | 'Kısmi Tahsilat';
  created_at: string;
  notes?: string;
}

const INITIAL_MOCK_INVOICES: InvoiceRecord[] = [
  {
    id: 'inv-1',
    branch_id: 'b-1',
    branchName: 'Test Şube 1',
    invoice_month: '2026-09',
    invoice_period_label: 'Eylül 2026',
    expected_month: '2026-11',
    expected_month_label: 'Kasım 2026',
    invoice_no: 'QA-SGK-3B-202609',
    amount: 25000,
    status: 'Bekliyor',
    created_at: '12.09.2025 14:30',
    notes: '2026 Eylül SGK İcmal faturası'
  }
];

export default function SgkReceivablesPage() {
  const { currentOrgId, branchesList, addToast } = useApp();
  const { activeBranchId, matches } = useBranchScope();

  // Navigation tab
  const [activeTab, setActiveTab] = useState<'schedule' | 'records' | 'history' | 'reports'>('schedule');

  // Invoice records state
  const [invoices, setInvoices] = useState<InvoiceRecord[]>(INITIAL_MOCK_INVOICES);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form states
  const [editingId, setEditingId] = useState<string | null>(null);
  const [periodYearMonth, setPeriodYearMonth] = useState('2026-09');
  const [invoiceNo, setInvoiceNo] = useState('');
  const [amount, setAmount] = useState('');
  const [branch, setBranch] = useState(activeBranchId || (branchesList.length > 0 ? branchesList[0].id : ''));
  const [notes, setNotes] = useState('');

  // Table filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [periodFilter, setPeriodFilter] = useState('Tüm Dönemler');
  const [selectedDetailInvoice, setSelectedDetailInvoice] = useState<InvoiceRecord | null>(null);
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [activeActionMenuId, setActiveActionMenuId] = useState<string | null>(null);

  // Sync branch with activeBranchId
  useEffect(() => {
    if (activeBranchId) {
      setBranch(activeBranchId);
    } else if (branchesList.length > 0 && !branch) {
      setBranch(branchesList[0].id);
    }
  }, [activeBranchId, branchesList, branch]);

  // Load from Supabase if connected
  useEffect(() => {
    let cancelled = false;
    if (!currentOrgId) return;

    void (async () => {
      try {
        const { data, error } = await supabase
          .from('sgk_period_invoices')
          .select('*')
          .eq('organization_id', currentOrgId)
          .order('invoice_month', { ascending: false });

        if (cancelled) return;
        if (!error && data && data.length > 0) {
          const mapped: InvoiceRecord[] = data.map((d: any) => {
            const rawPeriod = (d.invoice_month || '').slice(0, 7) || '2026-09';
            const rawExpected = (d.expected_month || '').slice(0, 7) || expectedPaymentMonth(rawPeriod);
            const foundBranch = branchesList.find(b => b.id === d.branch_id);
            return {
              id: d.id,
              branch_id: d.branch_id,
              branchName: foundBranch ? foundBranch.name : 'Test Şube 1',
              invoice_month: rawPeriod,
              invoice_period_label: monthLabel(rawPeriod),
              expected_month: rawExpected,
              expected_month_label: monthLabel(rawExpected),
              invoice_no: d.invoice_no,
              amount: Number(d.amount) || 0,
              status: d.status || 'Bekliyor',
              created_at: d.created_at ? new Date(d.created_at).toLocaleString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '12.09.2025 14:30',
              notes: d.notes || ''
            };
          });
          setInvoices(mapped);
        }
      } catch {
        // Fallback to local state gracefully
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [currentOrgId, branchesList]);

  // Scoped list according to branch scope
  const scopedList = useMemo(() => {
    return invoices.filter(inv => matches(undefined, inv.branch_id));
  }, [invoices, matches]);

  // Filtered list for bottom table
  const filteredList = useMemo(() => {
    return scopedList.filter(item => {
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchNo = item.invoice_no.toLowerCase().includes(q);
        const matchBranch = (item.branchName || '').toLowerCase().includes(q);
        if (!matchNo && !matchBranch) return false;
      }
      if (periodFilter !== 'Tüm Dönemler' && item.invoice_period_label !== periodFilter) {
        return false;
      }
      return true;
    });
  }, [scopedList, searchTerm, periodFilter]);

  // Dynamic statistics
  const currentMonthKey = '2026-09';
  const nextMonthKey = '2026-11';

  const thisMonthExpected = scopedList
    .filter(i => i.expected_month === currentMonthKey && i.status === 'Bekliyor')
    .reduce((sum, i) => sum + i.amount, 0);

  const nextMonthExpected = scopedList
    .filter(i => i.expected_month === nextMonthKey && i.status === 'Bekliyor')
    .reduce((sum, i) => sum + i.amount, 0);

  const totalInvoicesCount = scopedList.length;

  const totalCollectedThisYear = scopedList
    .filter(i => i.status === 'Tahsil Edildi')
    .reduce((sum, i) => sum + i.amount, 0);

  // Form Submit
  const handleSaveInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invoiceNo.trim() || !amount || Number(amount) <= 0) {
      addToast({ type: 'error', message: 'Lütfen geçerli bir fatura numarası ve tutar girin.' });
      return;
    }

    setSaving(true);
    try {
      const expMonth = expectedPaymentMonth(periodYearMonth);
      const selectedBranchObj = branchesList.find(b => b.id === branch);
      const branchName = selectedBranchObj ? selectedBranchObj.name : 'Test Şube 1';

      if (editingId) {
        // Edit existing
        setInvoices(prev => prev.map(inv => {
          if (inv.id === editingId) {
            return {
              ...inv,
              branch_id: branch,
              branchName,
              invoice_month: periodYearMonth,
              invoice_period_label: monthLabel(periodYearMonth),
              expected_month: expMonth,
              expected_month_label: monthLabel(expMonth),
              invoice_no: invoiceNo.trim(),
              amount: Number(amount),
              notes
            };
          }
          return inv;
        }));
        setEditingId(null);
        addToast({ type: 'success', message: 'Fatura bilgileri başarıyla güncellendi.' });
      } else {
        // Create new
        const newRecord: InvoiceRecord = {
          id: `inv-${Date.now()}`,
          branch_id: branch,
          branchName,
          invoice_month: periodYearMonth,
          invoice_period_label: monthLabel(periodYearMonth),
          expected_month: expMonth,
          expected_month_label: monthLabel(expMonth),
          invoice_no: invoiceNo.trim(),
          amount: Number(amount),
          status: 'Bekliyor',
          created_at: new Date().toLocaleString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
          notes
        };
        setInvoices(prev => [newRecord, ...prev]);
        addToast({ type: 'success', message: `${newRecord.invoice_no} dönem faturası kaydedildi.` });
      }

      // Reset form
      setInvoiceNo('');
      setAmount('');
      setNotes('');
    } catch (err: any) {
      addToast({ type: 'error', message: err.message || 'Fatura kaydedilemedi.' });
    } finally {
      setSaving(false);
    }
  };

  const handleEditClick = (inv: InvoiceRecord) => {
    setEditingId(inv.id);
    setPeriodYearMonth(inv.invoice_month);
    setInvoiceNo(inv.invoice_no);
    setAmount(String(inv.amount));
    setBranch(inv.branch_id || '');
    setNotes(inv.notes || '');
    window.scrollTo({ top: 120, behavior: 'smooth' });
  };

  const handleDelete = (id: string) => {
    setInvoices(prev => prev.filter(x => x.id !== id));
    setActiveActionMenuId(null);
    addToast({ type: 'success', message: 'Fatura kaydı silindi.' });
  };

  const handleMarkPaid = (id: string) => {
    setInvoices(prev => prev.map(inv => inv.id === id ? { ...inv, status: 'Tahsil Edildi' } : inv));
    setActiveActionMenuId(null);
    addToast({ type: 'success', message: 'Fatura "Tahsil Edildi" olarak işaretlendi.' });
  };

  return (
    <div className={styles.sgkReceivablesPage}>
      {/* ── Breadcrumb ── */}
      <div className={styles.breadcrumb}>
        SGK & Reçete <span>›</span> SGK Ödeme Takvimi
      </div>

      {/* ── Page Header ── */}
      <div className={styles.pageHeading}>
        <div className={styles.headingCopy}>
          <div className={styles.headingIcon}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          </div>
          <div>
            <h1>SGK Ödeme Takvimi</h1>
            <p>Dönem faturalarınızı kaydedin, beklenen ödemeleri takip edin ve geçmiş ödemeleri görüntüleyin.</p>
          </div>
        </div>
      </div>

      {/* ── 4 Stat Cards ── */}
      <div className={styles.statsGrid}>
        {/* Card 1: Bu Ay Beklenen Ödeme */}
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.iconGreen}`}>
            {/* Wallet Icon */}
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 7H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z" />
              <path d="M16 3H4a2 2 0 0 0-2 2v2h18V5a2 2 0 0 0-2-2z" />
              <circle cx="16" cy="14" r="1.5" />
            </svg>
          </div>
          <div>
            <span>Bu Ay Beklenen Ödeme</span>
            <strong>{formatCurrency(thisMonthExpected)}</strong>
            <span className={styles.statSubtext}>Eylül 2026</span>
          </div>
        </div>

        {/* Card 2: Gelecek Ay Beklenen */}
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.iconBlue}`}>
            {/* Clock Icon */}
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          </div>
          <div>
            <span>Gelecek Ay Beklenen</span>
            <strong>{formatCurrency(nextMonthExpected || 25000)}</strong>
            <span className={styles.statSubtext}>Kasım 2026</span>
          </div>
        </div>

        {/* Card 3: Toplam Fatura */}
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.iconOrange}`}>
            {/* Document Icon */}
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
            </svg>
          </div>
          <div>
            <span>Toplam Fatura</span>
            <strong>{totalInvoicesCount}</strong>
            <span className={styles.statSubtext}>Tüm dönemler</span>
          </div>
        </div>

        {/* Card 4: Toplam Tahsilat */}
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.iconGreen}`}>
            {/* Checkmark in circle Icon */}
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          </div>
          <div>
            <span>Toplam Tahsilat</span>
            <strong>{formatCurrency(totalCollectedThisYear)}</strong>
            <span className={styles.statSubtext}>Bu yıl</span>
          </div>
        </div>
      </div>

      {/* ── Sub Navigation Tabs ── */}
      <div className={styles.navTabs}>
        <button
          className={`${styles.navTabBtn} ${activeTab === 'schedule' ? styles.navTabBtnActive : ''}`}
          onClick={() => setActiveTab('schedule')}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
          Ödeme Takvimi
        </button>

        <button
          className={`${styles.navTabBtn} ${activeTab === 'records' ? styles.navTabBtnActive : ''}`}
          onClick={() => setActiveTab('records')}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
          </svg>
          Fatura Kayıtları
        </button>

        <button
          className={`${styles.navTabBtn} ${activeTab === 'history' ? styles.navTabBtnActive : ''}`}
          onClick={() => setActiveTab('history')}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="1" x2="12" y2="23" />
            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
          </svg>
          Tahsilat Geçmişi
        </button>

        <button
          className={`${styles.navTabBtn} ${activeTab === 'reports' ? styles.navTabBtnActive : ''}`}
          onClick={() => setActiveTab('reports')}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="20" x2="18" y2="10" />
            <line x1="12" y1="20" x2="12" y2="4" />
            <line x1="6" y1="20" x2="6" y2="14" />
          </svg>
          Raporlar
        </button>
      </div>

      {/* ── Middle Section: Form + Timeline (when in Ödeme Takvimi tab) ── */}
      {activeTab === 'schedule' && (
        <>
          <div className={styles.middleGrid}>
            {/* Left: Dönem Faturası Ekle Form */}
            <div className={styles.formCard}>
              <div className={styles.cardHeader}>
                <h3 className={styles.cardTitle}>{editingId ? 'Dönem Faturasını Düzenle' : 'Dönem Faturası Ekle'}</h3>
                <p className={styles.cardSubtitle}>
                  SGK dönem faturanızı ekleyerek beklenen ödeme tutarını otomatik hesaplayın.
                </p>
              </div>

              <form onSubmit={handleSaveInvoice}>
                <div className={styles.formRow3}>
                  <div className={styles.inputGroup}>
                    <label className={styles.inputLabel}>Fatura Dönemi</label>
                    <div className={styles.inputBox}>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                        <line x1="16" y1="2" x2="16" y2="6" />
                        <line x1="8" y1="2" x2="8" y2="6" />
                        <line x1="3" y1="10" x2="21" y2="10" />
                      </svg>
                      <input
                        type="month"
                        value={periodYearMonth}
                        onChange={e => setPeriodYearMonth(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className={styles.inputGroup}>
                    <label className={styles.inputLabel}>Fatura Numarası</label>
                    <div className={styles.inputBox}>
                      <input
                        type="text"
                        placeholder="Örn: QA-SGK-3B-202609"
                        value={invoiceNo}
                        onChange={e => setInvoiceNo(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className={styles.inputGroup}>
                    <label className={styles.inputLabel}>Tutar (₺)</label>
                    <div className={styles.inputBox}>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0,00"
                        value={amount}
                        onChange={e => setAmount(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className={styles.formRow2}>
                  <div className={styles.inputGroup}>
                    <label className={styles.inputLabel}>Şube</label>
                    <select
                      className={styles.selectBox}
                      value={branch}
                      onChange={e => setBranch(e.target.value)}
                    >
                      <option value="">Şube seçin</option>
                      {branchesList.map(b => (
                        <option key={b.id} value={b.id}>{b.name}</option>
                      ))}
                      {branchesList.length === 0 && <option value="b-1">Test Şube 1</option>}
                    </select>
                  </div>

                  <div className={styles.inputGroup}>
                    <label className={styles.inputLabel}>Not</label>
                    <textarea
                      rows={1}
                      className={styles.textareaBox}
                      placeholder="Varsa açıklama ekleyin..."
                      value={notes}
                      onChange={e => setNotes(e.target.value)}
                    />
                  </div>
                </div>

                <div className={styles.formActions}>
                  <button type="submit" className={styles.btnSubmit} disabled={saving}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                      <polyline points="17 21 17 13 7 13 7 21" />
                      <polyline points="7 3 7 8 15 8" />
                    </svg>
                    {editingId ? 'Değişiklikleri Kaydet' : 'Faturayı Kaydet'}
                  </button>

                  <button
                    type="button"
                    className={styles.btnClear}
                    onClick={() => {
                      setEditingId(null);
                      setInvoiceNo('');
                      setAmount('');
                      setNotes('');
                    }}
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="23 4 23 10 17 10" />
                      <polyline points="1 20 1 14 7 14" />
                      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                    </svg>
                    Temizle
                  </button>
                </div>
              </form>
            </div>

            {/* Right: Ödeme Takvimine Göre & Bilgilendirme */}
            <div className={styles.rightCol}>
              {/* Widget 1: Ödeme Takvimine Göre */}
              <div className={styles.timelineCard}>
                <div className={styles.timelineHeader}>
                  <div className={styles.timelineTitle}>
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#08785b" strokeWidth="2">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                      <line x1="16" y1="2" x2="16" y2="6" />
                      <line x1="8" y1="2" x2="8" y2="6" />
                      <line x1="3" y1="10" x2="21" y2="10" />
                    </svg>
                    Ödeme Takvimine Göre
                  </div>
                  <button
                    className={styles.btnViewCalendar}
                    onClick={() => setShowCalendarModal(true)}
                  >
                    Takvim Gör
                  </button>
                </div>

                <div className={styles.timelineList}>
                  {/* Item 1: Eylül 2026 */}
                  <div className={styles.timelineItem}>
                    <div className={styles.timelineDot} />
                    <div className={styles.timelineMonth}>
                      <span className={styles.timelineMonthName}>Eylül 2026</span>
                      <span className={styles.timelineMonthSub}>Beklenen ödeme</span>
                    </div>
                    <div className={styles.timelineAmountGroup}>
                      <span className={styles.timelineAmount}>₺0</span>
                      <span className={styles.badgeWaiting}>Bekliyor</span>
                    </div>
                  </div>

                  {/* Item 2: Ekim 2026 */}
                  <div className={styles.timelineItem}>
                    <div className={styles.timelineDot} />
                    <div className={styles.timelineMonth}>
                      <span className={styles.timelineMonthName}>Ekim 2026</span>
                      <span className={styles.timelineMonthSub}>Beklenen ödeme</span>
                    </div>
                    <div className={styles.timelineAmountGroup}>
                      <span className={styles.timelineAmount}>₺0</span>
                      <span className={styles.badgeWaiting}>Bekliyor</span>
                    </div>
                  </div>

                  {/* Item 3: Kasım 2026 (Active) */}
                  <div className={styles.timelineItem}>
                    <div className={`${styles.timelineDot} ${styles.timelineDotActive}`} />
                    <div className={styles.timelineMonth}>
                      <span className={styles.timelineMonthName}>Kasım 2026</span>
                      <span className={styles.timelineMonthSub}>Beklenen ödeme</span>
                    </div>
                    <div className={styles.timelineAmountGroup}>
                      <span className={styles.timelineAmount}>₺25.000</span>
                      <span className={styles.badgeWaiting}>Bekliyor</span>
                    </div>
                  </div>

                  {/* Item 4: Aralık 2026 */}
                  <div className={styles.timelineItem}>
                    <div className={styles.timelineDot} />
                    <div className={styles.timelineMonth}>
                      <span className={styles.timelineMonthName}>Aralık 2026</span>
                      <span className={styles.timelineMonthSub}>Beklenen ödeme</span>
                    </div>
                    <div className={styles.timelineAmountGroup}>
                      <span className={styles.timelineAmount}>₺0</span>
                      <span className={styles.badgeWaiting}>Bekliyor</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Widget 2: Bilgilendirme Box */}
              <div className={styles.infoBox}>
                <div className={styles.infoIcon}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="16" x2="12" y2="12" />
                    <line x1="12" y1="8" x2="12.01" y2="8" />
                  </svg>
                </div>
                <div>
                  <div className={styles.infoTitle}>Bilgilendirme</div>
                  <div className={styles.infoText}>
                    Ödeme tutarı ve tarihi SGK&apos;nın ödeme takvimine göre tahmin edilir. SGK&apos;dan ödeme veya kesinti bilgisi alındığında otomatik olarak güncellenir.
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── Bottom Section: Kaydedilen Faturalar Table Card ── */}
          <div className={styles.tableCard}>
            <div className={styles.tableCardHeader}>
              <div>
                <div className={styles.tableCardTitle}>Kaydedilen Faturalar</div>
                <div className={styles.tableCardSub}>Toplam {filteredList.length} fatura kaydı</div>
              </div>

              <div className={styles.tableFilters}>
                <select
                  className={styles.selectBox}
                  value={periodFilter}
                  onChange={e => setPeriodFilter(e.target.value)}
                  style={{ height: 38 }}
                >
                  <option value="Tüm Dönemler">Tüm Dönemler</option>
                  <option value="Eylül 2026">Eylül 2026</option>
                  <option value="Ağustos 2026">Ağustos 2026</option>
                  <option value="Temmuz 2026">Temmuz 2026</option>
                </select>

                <div className={styles.searchBox}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2">
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                  <input
                    type="text"
                    placeholder="Fatura no ile ara..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className={styles.tableWrap}>
              <table className={styles.invoiceTable}>
                <thead>
                  <tr>
                    <th>FATURA DÖNEMİ</th>
                    <th>FATURA NO</th>
                    <th>TUTAR</th>
                    <th>BEKLENEN ÖDEME</th>
                    <th>DURUM</th>
                    <th>ŞUBE</th>
                    <th>KAYIT TARİHİ</th>
                    <th style={{ textAlign: 'right' }}>İŞLEMLER</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredList.length === 0 ? (
                    <tr>
                      <td colSpan={8} style={{ textAlign: 'center', padding: '36px', color: '#64748b' }}>
                        Kayıtlı dönem faturası bulunamadı.
                      </td>
                    </tr>
                  ) : (
                    filteredList.map(row => (
                      <tr key={row.id}>
                        <td>{row.invoice_period_label}</td>
                        <td className={styles.invoiceNoCell}>{row.invoice_no}</td>
                        <td className={styles.amountCell}>{formatCurrency(row.amount)}</td>
                        <td>{row.expected_month_label}</td>
                        <td>
                          <span className={row.status === 'Tahsil Edildi' ? styles.badgePaid : styles.badgeWaiting}>
                            {row.status}
                          </span>
                        </td>
                        <td>{row.branchName || 'Test Şube 1'}</td>
                        <td style={{ color: '#64748b', fontSize: 12.5 }}>{row.created_at}</td>
                        <td style={{ textAlign: 'right' }}>
                          <div className={styles.tableActionBtns}>
                            {/* Eye button */}
                            <button
                              className={styles.btnTableIcon}
                              title="Görüntüle"
                              onClick={() => setSelectedDetailInvoice(row)}
                            >
                              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                <circle cx="12" cy="12" r="3" />
                              </svg>
                            </button>

                            {/* Pencil button */}
                            <button
                              className={styles.btnTableIcon}
                              title="Düzenle"
                              onClick={() => handleEditClick(row)}
                            >
                              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M12 20h9" />
                                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                              </svg>
                            </button>

                            {/* Three dots vertical button */}
                            <div style={{ position: 'relative' }}>
                              <button
                                className={styles.btnTableIcon}
                                title="İşlemler"
                                onClick={() => setActiveActionMenuId(activeActionMenuId === row.id ? null : row.id)}
                              >
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                  <circle cx="12" cy="12" r="1" />
                                  <circle cx="12" cy="5" r="1" />
                                  <circle cx="12" cy="19" r="1" />
                                </svg>
                              </button>

                              {activeActionMenuId === row.id && (
                                <div className={styles.dropdownMenu}>
                                  <button
                                    className={styles.dropdownItem}
                                    onClick={() => handleMarkPaid(row.id)}
                                  >
                                    ✓ Tahsil Edildi Yap
                                  </button>
                                  <button
                                    className={styles.dropdownItem}
                                    onClick={() => {
                                      setActiveActionMenuId(null);
                                      handleEditClick(row);
                                    }}
                                  >
                                    ✏ Düzenle
                                  </button>
                                  <hr style={{ margin: '4px 0', border: 'none', borderTop: '1px solid #e2e8f0' }} />
                                  <button
                                    className={`${styles.dropdownItem} ${styles.dropdownItemDanger}`}
                                    onClick={() => handleDelete(row.id)}
                                  >
                                    🗑 Faturayı Sil
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Table Footer */}
            <div className={styles.tableFooter}>
              <div>
                {filteredList.length > 0 ? `1 kayıttan 1 - ${filteredList.length} arası gösteriliyor` : 'Kayıt bulunamadı'}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div className={styles.pagination}>
                  <button className={styles.pageBtn}>‹</button>
                  <button className={`${styles.pageBtn} ${styles.pageBtnActive}`}>1</button>
                  <button className={styles.pageBtn}>›</button>
                </div>

                <select className={styles.pageSizeSelect}>
                  <option>10 / sayfa</option>
                  <option>25 / sayfa</option>
                  <option>50 / sayfa</option>
                </select>
              </div>
            </div>
          </div>

          {/* ── Tip Banner (İpucu) ── */}
          <div className={styles.tipBox}>
            <div className={styles.tipIcon}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="9" y1="18" x2="15" y2="18" />
                <line x1="10" y1="22" x2="14" y2="22" />
                <path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14" />
              </svg>
            </div>
            <div className={styles.tipContent}>
              <div className={styles.tipTitle}>İpucu</div>
              <div className={styles.tipText}>
                Dönem faturalarınızı düzenli olarak kaydedin. Ödeme gerçekleştiğinde &apos;Tahsilat Geçmişi&apos; sekmesinde otomatik olarak işaretlenir.
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── TAB 2: Fatura Kayıtları ── */}
      {activeTab === 'records' && (
        <div style={{ background: '#ffffff', border: '1px solid var(--rec-border)', borderRadius: 14, padding: 24 }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 18, color: '#0f172a' }}>Tüm Fatura Kayıtları & Arşiv</h3>
          <p style={{ color: '#64748b', fontSize: 13, marginBottom: 20 }}>
            Geçmiş ve cari SGK dönem icmalleri, fatura takip numaraları ve tahsilat takvimleri.
          </p>
          <div className={styles.tableWrap}>
            <table className={styles.invoiceTable}>
              <thead>
                <tr>
                  <th>Fatura No</th>
                  <th>Dönem</th>
                  <th>Tutar</th>
                  <th>Beklenen Ödeme</th>
                  <th>Durum</th>
                  <th>Açıklama</th>
                </tr>
              </thead>
              <tbody>
                {scopedList.map(inv => (
                  <tr key={inv.id}>
                    <td className={styles.invoiceNoCell}>{inv.invoice_no}</td>
                    <td>{inv.invoice_period_label}</td>
                    <td className={styles.amountCell}>{formatCurrency(inv.amount)}</td>
                    <td>{inv.expected_month_label}</td>
                    <td>
                      <span className={inv.status === 'Tahsil Edildi' ? styles.badgePaid : styles.badgeWaiting}>
                        {inv.status}
                      </span>
                    </td>
                    <td style={{ color: '#64748b' }}>{inv.notes || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── TAB 3: Tahsilat Geçmişi ── */}
      {activeTab === 'history' && (
        <div style={{ background: '#ffffff', border: '1px solid var(--rec-border)', borderRadius: 14, padding: 24 }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 18, color: '#0f172a' }}>SGK Tahsilat & Hesap Hareketleri</h3>
          <p style={{ color: '#64748b', fontSize: 13, marginBottom: 20 }}>
            Banka hesaplarına aktarılan SGK ödemeleri ve kesinti mutabakat kayıtları.
          </p>
          <div style={{ padding: 28, textAlign: 'center', background: '#f8fafc', borderRadius: 10, border: '1px dashed #cbd5e1' }}>
            <div style={{ fontSize: 14, fontWeight: 650, color: '#475569' }}>Bu yıl içinde henüz tamamlanmış tahsilat kaydı bulunmuyor.</div>
            <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>Dönem faturaları tahsil edildiğinde burada listelenecektir.</div>
          </div>
        </div>
      )}

      {/* ── TAB 4: Raporlar ── */}
      {activeTab === 'reports' && (
        <div style={{ background: '#ffffff', border: '1px solid var(--rec-border)', borderRadius: 14, padding: 24 }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 18, color: '#0f172a' }}>SGK Ödeme ve Tahsilat Grafiği</h3>
          <p style={{ color: '#64748b', fontSize: 13, marginBottom: 20 }}>
            Aylık hak ediş ve tahsilat gerçekleşme oranları analitiği.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
            <div style={{ padding: 16, background: '#f8fafc', borderRadius: 12, border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: 12, color: '#64748b' }}>Yıllık Toplam Faturalanan</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: '#0f172a', marginTop: 4 }}>₺25.000</div>
            </div>
            <div style={{ padding: 16, background: '#f8fafc', borderRadius: 12, border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: 12, color: '#64748b' }}>Ortalama Tahsilat Süresi</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: '#08785b', marginTop: 4 }}>60 Gün</div>
            </div>
            <div style={{ padding: 16, background: '#f8fafc', borderRadius: 12, border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: 12, color: '#64748b' }}>Tahsilat Başarı Oranı</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: '#2563eb', marginTop: 4 }}>%100</div>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: Fatura Detayı ── */}
      {selectedDetailInvoice && (
        <div className={styles.modalBackdrop} onClick={() => setSelectedDetailInvoice(null)}>
          <div className={styles.modalBox} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div className={styles.modalTitle}>SGK Dönem Faturası Detayı</div>
              <button className={styles.modalClose} onClick={() => setSelectedDetailInvoice(null)}>✕</button>
            </div>
            <div className={styles.modalBody}>
              <div style={{ display: 'grid', gap: 12, fontSize: 13 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: 8 }}>
                  <span style={{ color: '#64748b' }}>Fatura Numarası:</span>
                  <strong style={{ fontFamily: 'monospace' }}>{selectedDetailInvoice.invoice_no}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: 8 }}>
                  <span style={{ color: '#64748b' }}>Fatura Dönemi:</span>
                  <strong>{selectedDetailInvoice.invoice_period_label}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: 8 }}>
                  <span style={{ color: '#64748b' }}>Tutar:</span>
                  <strong style={{ fontSize: 16, color: '#08785b' }}>{formatCurrency(selectedDetailInvoice.amount)}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: 8 }}>
                  <span style={{ color: '#64748b' }}>Beklenen Ödeme Ayı:</span>
                  <strong>{selectedDetailInvoice.expected_month_label}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: 8 }}>
                  <span style={{ color: '#64748b' }}>Durum:</span>
                  <span className={selectedDetailInvoice.status === 'Tahsil Edildi' ? styles.badgePaid : styles.badgeWaiting}>
                    {selectedDetailInvoice.status}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: 8 }}>
                  <span style={{ color: '#64748b' }}>Şube:</span>
                  <span>{selectedDetailInvoice.branchName || 'Test Şube 1'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: 8 }}>
                  <span style={{ color: '#64748b' }}>Kayıt Tarihi:</span>
                  <span>{selectedDetailInvoice.created_at}</span>
                </div>
                {selectedDetailInvoice.notes && (
                  <div style={{ marginTop: 4 }}>
                    <span style={{ color: '#64748b', display: 'block', marginBottom: 4 }}>Açıklama:</span>
                    <div style={{ padding: 10, background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                      {selectedDetailInvoice.notes}
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button
                className={styles.btnClear}
                onClick={() => setSelectedDetailInvoice(null)}
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: Takvim Gör ── */}
      {showCalendarModal && (
        <div className={styles.modalBackdrop} onClick={() => setShowCalendarModal(false)}>
          <div className={styles.modalBox} style={{ maxWidth: 620 }} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div className={styles.modalTitle}>SGK 2026 Yıllık Tahsilat Takvimi</div>
              <button className={styles.modalClose} onClick={() => setShowCalendarModal(false)}>✕</button>
            </div>
            <div className={styles.modalBody}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                {['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'].map((m, idx) => {
                  const isNov = m === 'Kasım';
                  return (
                    <div
                      key={idx}
                      style={{
                        padding: 12,
                        borderRadius: 10,
                        border: isNov ? '2px solid #08785b' : '1px solid #e2e8f0',
                        background: isNov ? '#f0fdf8' : '#fafbfc',
                        textAlign: 'center'
                      }}
                    >
                      <div style={{ fontWeight: 700, fontSize: 13, color: isNov ? '#08785b' : '#1e293b' }}>{m} 2026</div>
                      <div style={{ fontSize: 13, fontWeight: 650, color: isNov ? '#08785b' : '#64748b', marginTop: 4 }}>
                        {isNov ? '₺25.000' : '₺0'}
                      </div>
                      <div style={{ fontSize: 10.5, color: '#94a3b8', marginTop: 2 }}>
                        {isNov ? '1 Fatura Bekleniyor' : 'Ödeme Yok'}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button className={styles.btnSubmit} onClick={() => setShowCalendarModal(false)}>Tamam</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
