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
  const [branch, setBranch] = useState(activeBranchId || '');
  const [invoiceNo, setInvoiceNo] = useState('');
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [filter, setFilter] = useState('');
  const [requestId, setRequestId] = useState(() => crypto.randomUUID());
  useEffect(() => {
    let cancelled = false;
    setLoading(true); setRows([]); setError('');
    if (!currentOrgId) { setLoading(false); return; }
    supabase.from('sgk_period_invoices').select('*').eq('organization_id', currentOrgId).order('invoice_month', { ascending: false })
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) setError('SGK fatura kayıtları yüklenemedi. Bağlantıyı ve veritabanı kurulumunu kontrol edin.');
        else setRows(data || []);
        setLoading(false);
      });
    return () => { cancelled = true; };
  }, [currentOrgId, revision]);
  const scoped = rows.filter(row => matches(undefined, row.branch_id));
  const current = monthKey();
  const total = (month: string) => scoped.filter(r => r.expected_month.slice(0, 7) === month).reduce((sum, r) => sum + Number(r.amount), 0);
  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    const selectedBranch = activeBranchId || branch;
    if (!currentOrgId || !selectedBranch || !invoiceNo.trim() || !Number.isFinite(Number(amount)) || Number(amount) <= 0) {
      addToast({ type: 'error', message: 'Şube, fatura numarası, dönem ve pozitif tutar gerekli.' }); return;
    }
    setSaving(true);
    try {
      expectedPaymentMonth(period);
      const payload = { branch_id: selectedBranch, invoice_month: `${period}-01`, invoice_no: invoiceNo.trim(), amount: Number(amount), notes: notes.trim() };
      const query = editing
        ? supabase.from('sgk_period_invoices').update(payload).eq('id', editing).eq('organization_id', currentOrgId)
        : supabase.from('sgk_period_invoices').upsert({ ...payload, id: requestId, organization_id: currentOrgId }, { onConflict: 'id' });
      const { data, error } = await query.select('id').single();
      if (error || !data) throw new Error(error?.code === '23505' ? 'Bu fatura numarası zaten kayıtlı.' : 'Fatura kaydedilemedi. Bilgilerinizi koruduk; tekrar deneyebilirsiniz.');
      setEditing(null); setInvoiceNo(''); setAmount(''); setNotes(''); setRequestId(crypto.randomUUID()); setRevision(n => n + 1);
      addToast({ type: 'success', message: 'Dönem faturası ve beklenen ödeme ayı kaydedildi.' });
    } catch (e) { addToast({ type: 'error', message: (e as Error).message }); }
    finally { setSaving(false); }
  };
  return <div className="page-content">
    <div className="page-header"><div><h1>SGK Ödeme Takvimi</h1><p>Dönem sonunda kestiğiniz faturayı girin, beklenen ödeme ayını takip edin.</p></div></div>
    <p style={{ marginBottom: 20 }}>Ocak faturası mart ayında beklenir. Tutarlar sizin kaydettiğiniz faturalardır; SGK’dan ödeme veya kesinti bilgisi alınmaz.</p>
    <div className="stats-grid">
      <div className="card" style={{ padding: 20 }}><p>Bu ay beklenen · {monthLabel(current)}</p><h2>{formatCurrency(total(current))}</h2></div>
      <div className="card" style={{ padding: 20 }}><p>Gelecek ay beklenen</p><h2>{formatCurrency(total(new Date(Date.UTC(Number(current.slice(0, 4)), Number(current.slice(5)), 1)).toISOString().slice(0, 7)))}</h2></div>
    </div>
    <form className="card" onSubmit={save} style={{ padding: 20, marginBlock: 20 }}>
      <h2>{editing ? 'Faturayı düzenle' : 'Dönem faturası ekle'}</h2>
      <div className="form-row">
        <label className="form-group">Fatura dönemi<input required className="form-input" type="month" value={period} onChange={e => setPeriod(e.target.value)} /></label>
        <label className="form-group">Fatura numarası<input required maxLength={100} className="form-input" value={invoiceNo} onChange={e => setInvoiceNo(e.target.value)} /></label>
        <label className="form-group">Tutar (₺)<input required className="form-input" type="number" min="0.01" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} /></label>
      </div>
      <div className="form-row">
        <label className="form-group">Şube<select required disabled={!!activeBranchId || !!editing} className="form-select" value={activeBranchId || branch} onChange={e => setBranch(e.target.value)}><option value="">Şube seçin</option>{branchesList.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}</select></label>
        <label className="form-group">Not<input className="form-input" maxLength={1000} value={notes} onChange={e => setNotes(e.target.value)} /></label>
      </div>
      {period && /^\d{4}-(0[1-9]|1[0-2])$/.test(period) && <p>Beklenen ödeme: <strong>{monthLabel(expectedPaymentMonth(period))}</strong></p>}
      <button className="btn btn-primary" disabled={saving || loading || !!error}>{saving ? 'Kaydediliyor…' : 'Faturayı kaydet'}</button>
      {editing && <button type="button" className="btn btn-secondary" disabled={saving} onClick={() => { setEditing(null); setInvoiceNo(''); setAmount(''); setNotes(''); }}>Vazgeç</button>}
    </form>
    {error && <div role="alert">{error} <button className="btn btn-secondary" onClick={() => setRevision(n => n + 1)}>Tekrar dene</button></div>}
    <label>Ödeme ayına göre filtrele<input className="form-input" type="month" value={filter} onChange={e => setFilter(e.target.value)} /></label>
    <div className="table-container"><table className="data-table"><thead><tr><th>Fatura dönemi</th><th>Fatura no</th><th>Tutar</th><th>Beklenen ödeme</th><th>Geri sayım</th><th /></tr></thead><tbody>
      {scoped.filter(r => !filter || r.expected_month.slice(0, 7) === filter).map(row => {
        const remaining = monthsUntil(row.expected_month.slice(0, 7), current);
        return <tr key={row.id}><td>{monthLabel(row.invoice_month.slice(0, 7))}</td><td>{row.invoice_no}</td><td>{formatCurrency(Number(row.amount))}</td><td>{monthLabel(row.expected_month.slice(0, 7))}</td><td>{remaining > 0 ? `${remaining} ay sonra` : remaining === 0 ? 'Bu ay bekleniyor' : 'Planlanan ay geçti'}</td><td><button className="btn btn-secondary" disabled={saving} onClick={() => { setEditing(row.id); setPeriod(row.invoice_month.slice(0, 7)); setBranch(row.branch_id); setInvoiceNo(row.invoice_no); setAmount(String(row.amount)); setNotes(row.notes); }}>Düzenle</button></td></tr>;
      })}
      {!scoped.length && <tr><td colSpan={6}>{loading ? 'Yükleniyor…' : 'Henüz dönem faturası yok.'}</td></tr>}
    </tbody></table></div>
  </div>;
}
