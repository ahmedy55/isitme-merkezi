'use client';
import { useState } from 'react';
import type { StockItem } from '../data/mockData';
import { findScannedDevices } from '../lib/deviceIdentity';

export default function DevicePicker({ items, value, onChange }: { items: StockItem[]; value: string; onChange: (item: StockItem) => void }) {
  const [scan, setScan] = useState('');
  const [message, setMessage] = useState('');
  const [candidates, setCandidates] = useState<StockItem[] | null>(null);
  const selected = items.find(i => i.id === value);
  const lookup = () => {
    try {
      const matches = findScannedDevices(items, scan);
      setCandidates(matches.length ? matches : null);
      if (matches.length === 1) { onChange(matches[0]); setMessage('Cihaz seçildi.'); }
      else setMessage(matches.length ? 'Bu barkoda ait birden fazla cihaz var. Seri numarasını okutun veya aşağıdan cihazı seçin.' : 'Eşleşen cihaz yok. Barkod veya seri numarasını kontrol edin.');
      setScan('');
    } catch (e) { setMessage((e as Error).message); }
  };
  return <div className="form-group">
    <label className="form-label">Cihaz bul: barkod veya seri numarası
      <input className="form-input" value={scan} onChange={e => setScan(e.target.value)} autoComplete="off"
        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); lookup(); } }} placeholder="Okutun ve Enter'a basın" />
    </label>
    <button type="button" className="btn btn-secondary" onClick={lookup}>Cihazı bul</button>
    {message && <p role="status">{message}</p>}
    <label className="form-label">Stoktaki cihaz
      <select className="form-select" value={value} onChange={e => { const item = items.find(i => i.id === e.target.value); if (item) { onChange(item); setCandidates(null); } }}>
        <option value="">Cihaz seçin</option>
        {(candidates || items).map(item => <option key={item.id} value={item.id}>{item.name} — Seri: {item.serialNo || 'Yok'} — Barkod: {item.barcode || 'Yok'}</option>)}
      </select>
    </label>
    {selected && <p>Seri: <strong>{selected.serialNo || 'Kaydedilmemiş'}</strong> · Barkod: <strong>{selected.barcode || 'Kaydedilmemiş'}</strong></p>}
  </div>;
}
