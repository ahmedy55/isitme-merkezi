import { describe, expect, it } from 'vitest';
import { createReportPdf } from './reportPdf';

describe('createReportPdf', () => {
  it('creates a valid downloadable PDF with indexed objects and Turkish text transliteration', async () => {
    const pdf = await createReportPdf(['İşitme Merkezi', 'Tahsilat: ₺1.250']).text();
    expect(pdf.startsWith('%PDF-1.4')).toBe(true);
    expect(pdf).toContain('Isitme Merkezi');
    expect(pdf).toContain('Tahsilat: TRY 1.250');

    const xrefOffset = Number(pdf.match(/startxref\n(\d+)/)?.[1]);
    expect(pdf.slice(xrefOffset)).toMatch(/^xref\n/);
    const xref = pdf.slice(xrefOffset).split('\n');
    const objectCount = Number(xref[1].split(' ')[1]);
    for (let id = 1; id < objectCount; id += 1) {
      const offset = Number(xref[id + 2].slice(0, 10));
      expect(pdf.slice(offset).startsWith(`${id} 0 obj`)).toBe(true);
    }
  });

  it('splits larger reports across multiple pages', async () => {
    const lines = Array.from({ length: 50 }, (_, index) => `Satır ${index + 1}`);
    const pdf = await createReportPdf(lines).text();
    expect(pdf).toContain('/Count 2');
    expect(pdf).toContain('Satir 50');
  });
});
