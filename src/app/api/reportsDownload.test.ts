import { describe, expect, it } from 'vitest';
import { NextRequest } from 'next/server';
import { GET as downloadReport } from './reports/download/route';

describe('Reports Download API (/api/reports/download)', () => {
  it('returns valid XLSX attachment when requested', async () => {
    const req = new NextRequest('http://localhost:3000/api/reports/download?format=xlsx&range=01.01.2026%20-%2031.12.2026');
    const res = await downloadReport(req);

    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toContain('spreadsheetml.sheet');
    expect(res.headers.get('content-disposition')).toMatch(/attachment;\s*filename="AudiPro_Yonetim_Raporu_.*\.xlsx"/);
    const body = await res.arrayBuffer();
    expect(body.byteLength).toBeGreaterThan(100);
  });

  it('returns valid PDF attachment when requested', async () => {
    const req = new NextRequest('http://localhost:3000/api/reports/download?format=pdf&range=01.01.2026%20-%2031.12.2026');
    const res = await downloadReport(req);

    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toBe('application/pdf');
    expect(res.headers.get('content-disposition')).toMatch(/attachment;\s*filename="AudiPro_Yonetim_Raporu_.*\.pdf"/);
    const body = await res.arrayBuffer();
    expect(body.byteLength).toBeGreaterThan(100);
  });

  it('returns valid CSV attachment with UTF-8 BOM when requested', async () => {
    const req = new NextRequest('http://localhost:3000/api/reports/download?format=csv&range=01.01.2026%20-%2031.12.2026');
    const res = await downloadReport(req);

    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toContain('text/csv');
    expect(res.headers.get('content-disposition')).toMatch(/attachment;\s*filename="AudiPro_Yonetim_Raporu_.*\.csv"/);
    const text = await res.text();
    expect(text).toContain('AudiPro');
    expect(text).toContain('YÖNETİM VE FAALİYET RAPORU');
  });
});
