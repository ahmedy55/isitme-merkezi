'use client';
import { useRef, useState } from 'react';
import { DeviceIdentity, parseDeviceScan } from '../lib/deviceIdentity';

export default function DeviceIdentityFields({ value, onChange }: { value: DeviceIdentity; onChange: (next: DeviceIdentity) => void }) {
  const serialRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState('');
  const scan = (raw: string, target: 'barcode' | 'serialNo') => {
    try {
      const next = parseDeviceScan(raw, target);
      onChange({ ...value, ...next }); setError('');
      if (target === 'barcode' && !next.serialNo) serialRef.current?.focus();
    } catch (e) { setError((e as Error).message); }
  };
  return <fieldset style={{ border: '1px solid var(--gray-200)', padding: 12, borderRadius: 10, marginBottom: 16 }}>
    <legend>Cihaz kimliği</legend>
    <p style={{ fontSize: '0.8rem', marginBottom: 10 }}>Barkodu okutun, ardından seri numarasını okutun. Elle de girebilirsiniz.</p>
    <div className="form-row">
      <label className="form-group">Ürün barkodu / GTIN<input className="form-input" value={value.barcode || ''} autoComplete="off"
        onChange={e => onChange({ ...value, barcode: e.target.value })}
        onKeyDown={e => { if (e.key === 'Enter' || e.key === 'Tab') { if (e.key === 'Enter') e.preventDefault(); scan(e.currentTarget.value, 'barcode'); } }} /></label>
      <label className="form-group">Seri numarası<input ref={serialRef} className="form-input" value={value.serialNo || ''} autoComplete="off"
        onChange={e => onChange({ ...value, serialNo: e.target.value })}
        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); scan(e.currentTarget.value, 'serialNo'); } }} /></label>
    </div>
    {error && <p role="alert">{error}</p>}
  </fieldset>;
}
