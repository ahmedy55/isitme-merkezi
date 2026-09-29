'use client';
import { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { useBranchScope } from '../hooks/useBranchScope';
import { supabase } from '../lib/supabase';
import { expectedPaymentMonth, monthKey, monthLabel, monthsUntil } from '../lib/sgkSchedule';
import { formatCurrency } from '../data/mockData';

interface Invoice { id: string; branch_id: string; invoice_month: string; expected_month: string; invoice_no: string; amount: number; notes: string }
export default function SgkReceivablesPage() {
  const { currentOrgId, branchesList, addToast } = useApp();
  const { activeBranchId, matches } = useBranchScope();
  const [rows, setRows] = useState<Invoice[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [revision, setRevision] = useState(0);
  const [editing, setEditing] = useState<string | null>(null);
  const [period, setPeriod] = useState(monthKey());
  const [branch, setBranch] = useState(activeBranchId || (branchesList.length === 1 ? branchesList[0].id : ''));
  const [invoiceNo, setInvoiceNo] = useState('');
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [filter, setFilter] = useState('');
  const [requestId, setRequestId] = useState(() => crypto.randomUUID());
  useEffect(() => {
    setBranch(activeBranchId || (branchesList.length === 1 ? branchesList[0].id : ''));
    setEditing(null);
  }, [activeBranchId, branchesList]);
  useEffect(() => {
    let cancelled = false;
    setLoading(true); setRows([]); setError('');
    if (!currentOrgId) { setLoading(false); return; }
    void (async () => {
      try {
        const { data, error } = await supabase.from('sgk_period_invoices').select('*').eq('organization_id', currentOrgId).order('invoice_month', { ascending: false });
        if (cancelled) return;
        if (error) setError('SGK fatura kayıtları yüklenemedi. Bağlantıyı ve veritabanı kurulumunu kontrol edin.');
        else setRows(data || []);
      } catch {
        if (!cancelled) setError('SGK fatura kayıtlarına ulaşılamadı. Bağlantınızı kontrol edip tekrar deneyin.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [currentOrgId, revision]);
  const scoped = rows.filter(row => matches(undefined, row.branch_id));
  const current = monthKey();
  const total = (month: string) => scoped.filter(r => r.expected_month.slice(0, 7) === month).reduce((sum, r) => sum + Number(r.amount), 0);
  const save = async (e: React.FormEvent) => {
    e.preventDefault();
      const selectedBranch = editing ? branch : activeBranchId || branch;
    if (!currentOrgId || !selectedBranch || !invoiceNo.trim() || !Number.isFinite(Number(amount)) || Number(amount) <= 0) {
      addToast({ type: 'error', message: 'Şube, fatura numarası, dönem ve pozitif tutar gerekli.' }); return;
    }
    setSaving(true);
    try {
      expectedPaymentMonth(period);
      const payload = { branch_id: selectedBranch, invoice_month: `${period}-01`, invoice_no: invoiceNo.trim(), amount: Number(amount), notes: notes.trim() };
      const query = editing
        ? supabase.from('sgk_period_invoices').update(payload).eq('id', editing).eq('organization_id', currentOrgId).eq('branch_id', branch)
        : supabase.from('sgk_period_invoices').upsert({ ...payload, id: requestId, organization_id: currentOrgId }, { onConflict: 'id' });
      const { data, error } = await query.select('id').single();
      if (error || !data) throw new Error(error?.code === '23505' ? 'Bu fatura numarası zaten kayıtlı.' : 'Fatura kaydedilemedi. Bilgilerinizi koruduk; tekrar deneyebilirsiniz.');
      setEditing(null); setInvoiceNo(''); setAmount(''); setNotes(''); setRequestId(crypto.randomUUID()); setRevision(n => n + 1);
      addToast({ type: 'success', message: 'Dönem faturası ve beklenen ödeme ayı kaydedildi.' });
    } catch (e) { addToast({ type: 'error', message: (e as Error).message }); }
    finally { setSaving(false); }
  };
  const nextMonth = (() => { const date = new Date(Number(current.slice(0, 4)), Number(current.slice(5)) + 1, 1); return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`; })();
  const visibleRows = scoped.filter(row => !filter || row.expected_month.slice(0, 7) === filter);

  return <div className="page">
    <div className="page-header"><div className="page-header-left"><h2>SGK Ödeme Takvimi</h2><p>Dönem sonunda kestiğiniz faturayı kaydedin ve beklenen ödeme ayını takip edin.</p></div></div>
    <div className="sgk-schedule-note"><strong>Bilgilendirme:</strong> Ödeme tutarı ve tarihi sizin girdiğiniz fatura kaydına göre tahmin edilir. SGK’dan ödeme veya kesinti bilgisi alınmaz. Örneğin ocak faturası mart ayında beklenir.</div>
    <div className="stats-grid sgk-schedule-stats">
      <div className="card sgk-schedule-stat"><p>Bu ay beklenen <span>{monthLabel(current)}</span></p><h2>{formatCurrency(total(current))}</h2></div>
      <div className="card sgk-schedule-stat"><p>Gelecek ay beklenen <span>{monthLabel(nextMonth)}</span></p><h2>{formatCurrency(total(nextMonth))}</h2></div>
    </div>
    <form className="card sgk-invoice-form" onSubmit={save}>
      <div className="sgk-invoice-form-heading"><h3>{editing ? 'Faturayı düzenle' : 'Dönem faturası ekle'}</h3><p>Fatura bilgilerini girin; beklenen ödeme ayı otomatik hesaplanır.</p></div>
      <div className="form-row-3">
        <label className="form-group">Fatura dönemi<input required className="form-input" type="month" value={period} onChange={e => setPeriod(e.target.value)} /></label>
        <label className="form-group">Fatura numarası<input required maxLength={100} className="form-input" value={invoiceNo} onChange={e => setInvoiceNo(e.target.value)} /></label>
        <label className="form-group">Tutar (₺)<input required className="form-input" type="number" min="0.01" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} /></label>
      </div>
      <div className="form-row sgk-invoice-form-notes">
        {!activeBranchId && branchesList.filter(item => item.status === 'Aktif').length > 1 && <label className="form-group">Şube<select required disabled={!!editing} className="form-select" value={branch} onChange={e => setBranch(e.target.value)}><option value="">Şube seçin</option>{branchesList.filter(b => b.status === 'Aktif').map(b => <option key={b.id} value={b.id}>{b.name}</option>)}</select></label>}
        <label className="form-group">Not<input className="form-input" maxLength={1000} value={notes} onChange={e => setNotes(e.target.value)} /></label>
      </div>
      {period && /^\d{4}-(0[1-9]|1[0-2])$/.test(period) && <p className="sgk-expected-date">Beklenen ödeme ayı: <strong>{monthLabel(expectedPaymentMonth(period))}</strong></p>}
      <div className="sgk-form-actions"><button className="btn btn-primary" disabled={saving || loading || !!error}>{saving ? 'Kaydediliyor…' : editing ? 'Değişiklikleri kaydet' : 'Faturayı kaydet'}</button>
      {editing && <button type="button" className="btn btn-secondary" disabled={saving} onClick={() => { setEditing(null); setInvoiceNo(''); setAmount(''); setNotes(''); }}>Vazgeç</button>}</div>
    </form>
    {error && <div className="sgk-schedule-error" role="alert"><span>{error}</span><button className="btn btn-secondary" onClick={() => setRevision(n => n + 1)}>Tekrar dene</button></div>}
    <section className="card sgk-invoice-list">
      <div className="sgk-invoice-list-heading"><div><h3>Kaydedilen faturalar</h3><p>{scoped.length} fatura kaydı</p></div><label className="sgk-month-filter">Beklenen ödeme ayı<input className="form-input" type="month" value={filter} onChange={e => setFilter(e.target.value)} /></label></div>
      <div className="table-container"><table className="data-table mobile-cards"><thead><tr><th>Fatura dönemi</th><th>Fatura no</th><th>Tutar</th><th>Beklenen ödeme</th><th>Geri sayım</th>{!activeBranchId && <th>Şube</th>}<th /></tr></thead><tbody>
      {visibleRows.map(row => {
        const remaining = monthsUntil(row.expected_month.slice(0, 7), current);
        const rowBranch = branchesList.find(item => item.id === row.branch_id)?.name || 'Şube bilgisi yok';
        return <tr key={row.id}><td data-label="Fatura dönemi">{monthLabel(row.invoice_month.slice(0, 7))}</td><td data-label="Fatura no">{row.invoice_no}</td><td data-label="Tutar">{formatCurrency(Number(row.amount))}</td><td data-label="Beklenen ödeme">{monthLabel(row.expected_month.slice(0, 7))}</td><td data-label="Geri sayım">{remaining > 0 ? `${remaining} ay sonra` : remaining === 0 ? 'Bu ay bekleniyor' : 'Planlanan ay geçti'}</td>{!activeBranchId && <td data-label="Şube">{rowBranch}</td>}<td data-label="İşlem"><button className="btn btn-secondary" disabled={saving} onClick={() => { setEditing(row.id); setPeriod(row.invoice_month.slice(0, 7)); setBranch(row.branch_id); setInvoiceNo(row.invoice_no); setAmount(String(row.amount)); setNotes(row.notes); }}>{'Düzenle'}</button></td></tr>;
      })}
      {!visibleRows.length && <tr><td colSpan={activeBranchId ? 6 : 7}><div className="sgk-empty-state">{loading ? 'Faturalar yükleniyor…' : error ? 'Kayıtlar şu anda görüntülenemiyor.' : scoped.length ? 'Seçilen ödeme ayı için fatura bulunamadı.' : 'Henüz dönem faturası eklenmemiş.'}</div></td></tr>}
      </tbody></table></div>
    </section>
  </div>;
}
