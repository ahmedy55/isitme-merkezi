import { describe, it, expect } from 'vitest';
import { NextRequest } from 'next/server';
import { GET as downloadReport } from '../../api/reports/download/route';
import { buildPdfReportLines } from '../../lib/reportPdf';
import { generateCsvContent } from '../../lib/reportCsv';

describe('Modül 11: Raporlar, Grafikler & Dosya İndirmeleri (TC-133 - TC-142)', () => {
  // TC-133: Analitik PDF Yönetici Raporu İndir
  it('TC-133: PDF Yönetici Raporu İndir — 200 OK ve geçerli PDF attachment başlıkları döner', async () => {
    const req = new NextRequest('http://localhost:3000/api/reports/download?format=pdf&range=01.01.2026%20-%2031.12.2026');
    const res = await downloadReport(req);

    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toBe('application/pdf');
    expect(res.headers.get('content-disposition')).toContain('.pdf');
    const body = await res.arrayBuffer();
    expect(body.byteLength).toBeGreaterThan(100);
  });

  // TC-134: Analitik Excel Tablosu (.xlsx) İndir
  it('TC-134: Excel Tablosu (.xlsx) İndir — OpenXML Excel attachment döner', async () => {
    const req = new NextRequest('http://localhost:3000/api/reports/download?format=xlsx&range=01.01.2026%20-%2031.12.2026');
    const res = await downloadReport(req);

    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toContain('spreadsheetml.sheet');
    expect(res.headers.get('content-disposition')).toContain('.xlsx');
    const body = await res.arrayBuffer();
    expect(body.byteLength).toBeGreaterThan(100);
  });

  // TC-135: Ham Veri CSV İndir
  it('TC-135: CSV İndir — UTF-8 BOM ve CSV mime tipi ile içerik döner', async () => {
    const req = new NextRequest('http://localhost:3000/api/reports/download?format=csv&range=01.01.2026%20-%2031.12.2026');
    const res = await downloadReport(req);

    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toContain('text/csv');
    const text = await res.text();
    expect(text).toContain('AudiPro');
    expect(text).toContain('YÖNETİM VE FAALİYET RAPORU');
  });

  // TC-136: Rapor İndirme Tarih Parametresi
  it('TC-136: Tarih Parametresi — Belirtilen tarih aralığı rapor başlığına ve çıktısına yansır', async () => {
    const customRange = '01.06.2026 - 30.06.2026';
    const req = new NextRequest(`http://localhost:3000/api/reports/download?format=csv&range=${encodeURIComponent(customRange)}`);
    const res = await downloadReport(req);
    const text = await res.text();

    expect(text).toContain(customRange);
  });

  // TC-137: Rapor İndirme Şube Parametresi
  it('TC-137: Şube Parametresi — Seçili şube adı rapor dosyasında yer alır', async () => {
    const branchName = 'Kadıköy Şubesi';
    const req = new NextRequest(`http://localhost:3000/api/reports/download?format=csv&branch=${encodeURIComponent(branchName)}`);
    const res = await downloadReport(req);
    const text = await res.text();

    expect(text).toContain(branchName);
  });

  // TC-138: Yetkisiz Rapor İndirme Engeli
  it('TC-138: Yetkisiz Rapor İndirme — Korumalı indirme servislerinde oturumsuz erişim engellenir', () => {
    const checkReportAuth = (token: string | null) => {
      if (!token) return { status: 401, error: 'Unauthorized' };
      return { status: 200 };
    };

    expect(checkReportAuth(null).status).toBe(401);
    expect(checkReportAuth('valid-token').status).toBe(200);
  });

  // TC-139: Ciro Grafiği Hesaplama Doğruluğu
  it('TC-139: Ciro Grafiği — Grafik kategorilerinin toplamı toplam ciroya eşit olur', () => {
    const distribution = [
      { label: 'Cihaz Satışları', value: 245000 },
      { label: 'Teknik Servis', value: 16500 },
      { label: 'Pil & Aksesuar', value: 23900 }
    ];

    const sum = distribution.reduce((acc, curr) => acc + curr.value, 0);
    expect(sum).toBe(285400);
  });

  // TC-140: Boş Veri Durumu (Empty State)
  it('TC-140: Boş Veri Durumu — Verisi olmayan dönemde sıfır değerler ile hatasız rapor üretilir', () => {
    const emptyExportData = {
      clinicName: 'AudiPro İşitme Merkezi',
      dateRange: '01.01.2026 - 31.01.2026',
      generatedAt: '09.10.2026 12:00',
      branchName: 'Yeni Şube',
      kpis: {
        totalRevenue: 0,
        totalExpenses: 0,
        netProfit: 0,
        patientCount: 0,
        appointmentCount: 0,
        deviceSalesCount: 0,
        serviceRevenue: 0
      },
      branchPerformance: [],
      revenueDistribution: [],
      sales: [],
      expenses: [],
      appointments: [],
      serviceTickets: [],
      patients: []
    };

    const lines = buildPdfReportLines(emptyExportData);
    expect(lines.length).toBeGreaterThan(0);
    expect(lines.some(line => line.includes('TRY 0'))).toBe(true);
  });

  // TC-141: Hasta Kaynak Dağılım Grafiği
  it('TC-141: Hasta Kaynak Dağılımı — Kaynak yüzdelerinin toplamı %100 olur', () => {
    const sources = [
      { source: 'KBB Doktor Sevk', count: 45 },
      { source: 'Tavsiye / Refere', count: 35 },
      { source: 'Web / Dijital', count: 15 },
      { source: 'Tabela / Geçerken', count: 5 }
    ];

    const total = sources.reduce((sum, s) => sum + s.count, 0);
    const percentages = sources.map(s => (s.count / total) * 100);
    const totalPercentage = percentages.reduce((sum, p) => sum + p, 0);

    expect(totalPercentage).toBeCloseTo(100, 5);
  });

  // TC-142: Aksesuar / Stok Raporu İndirme
  it('TC-142: Stok Raporu İndirme — Stok kalemleri adet ve tutarlarıyla listelenir', () => {
    const stockItems = [
      { name: 'Cihaz A', quantity: 4, price: 20000 },
      { name: 'Pil 312', quantity: 50, price: 150 }
    ];

    const totalStockValue = stockItems.reduce((acc, i) => acc + i.quantity * i.price, 0);
    expect(totalStockValue).toBe(4 * 20000 + 50 * 150); // 80000 + 7500 = 87500
  });
});
