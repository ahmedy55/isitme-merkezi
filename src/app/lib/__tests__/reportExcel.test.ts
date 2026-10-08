import { describe, expect, it } from 'vitest';
import ExcelJS from 'exceljs';
import { createReportWorkbook, type ReportExportData } from '../reportExcel';

describe('createReportWorkbook', () => {
  const sampleData: ReportExportData = {
    clinicName: 'AudiPro İşitme Merkezi',
    dateRange: '01.01.2026 - 31.12.2026',
    generatedAt: '08.10.2026 21:00',
    branchName: 'Tüm Şubeler',
    kpis: {
      totalRevenue: 25000,
      totalExpenses: 5000,
      netProfit: 20000,
      patientCount: 15,
      appointmentCount: 20,
      deviceSalesCount: 4,
      serviceRevenue: 1500,
    },
    branchPerformance: [
      { branch: 'Kadıköy', patients: 10, appointments: 12, revenue: 15000 },
      { branch: 'Beşiktaş', patients: 5, appointments: 8, revenue: 10000 },
    ],
    revenueDistribution: [
      { label: 'Cihaz Satışı', value: 20000 },
      { label: 'Aksesuar Satışı', value: 3500 },
      { label: 'Teknik Servis', value: 1500 },
    ],
    sales: [
      {
        date: '2026-09-15',
        patientName: 'Ahmet Yılmaz',
        branchName: 'Kadıköy',
        itemsSummary: 'Oticon Real 1 x 2',
        total: 15000,
        sgkAmount: 3000,
        patientAmount: 12000,
        paymentMethod: 'Kredi Kartı',
        status: 'Tahsil Edildi',
      },
    ],
    expenses: [
      {
        date: '2026-09-10',
        category: 'Kira',
        description: 'Eylül Kira Ödemesi',
        branchName: 'Kadıköy',
        amount: 5000,
        paymentMethod: 'Havale',
        receiptNo: 'FAT-2026-091',
      },
    ],
    appointments: [
      {
        date: '2026-09-15',
        time: '14:30',
        patientName: 'Ahmet Yılmaz',
        branchName: 'Kadıköy',
        type: 'Cihaz Denemesi',
        audiologist: 'Ody. Zeynep',
        status: 'Geldi',
        notes: 'Deneme başarılı',
      },
    ],
    serviceTickets: [
      {
        receivedDate: '2026-09-12',
        patientName: 'Mehmet Demir',
        branchName: 'Kadıköy',
        device: 'Phonak Audeo',
        serialNo: 'PH-98721',
        complaint: 'Hoparlör cızırtısı',
        fee: 750,
        status: 'Teslim Edildi',
        technician: 'Caner Teknisyen',
      },
    ],
    patients: [
      {
        createdAt: '2026-09-01T10:00:00Z',
        name: 'Ahmet Yılmaz',
        phone: '05551234567',
        branchName: 'Kadıköy',
        source: 'Tavsiye',
        hearingLoss: 'İleri',
        sgkStatus: 'Aktif',
      },
    ],
  };

  it('generates a valid Excel spreadsheet blob containing multiple formatted worksheets', async () => {
    const blob = await createReportWorkbook(sampleData, ExcelJS);
    expect(blob).toBeDefined();
    expect(blob.type).toBe('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    expect(blob.size).toBeGreaterThan(1000);

    // Verify it can be read back by ExcelJS
    const arrayBuffer = await blob.arrayBuffer();
    const readWorkbook = new ExcelJS.Workbook();
    await readWorkbook.xlsx.load(arrayBuffer);

    expect(readWorkbook.worksheets.length).toBe(6);
    expect(readWorkbook.worksheets.map(w => w.name)).toEqual([
      'Yönetici Özeti',
      'Satışlar',
      'Giderler',
      'Randevular',
      'Teknik Servis',
      'Hastalar',
    ]);

    const summary = readWorkbook.getWorksheet('Yönetici Özeti')!;
    expect(summary.getCell('A1').value).toContain('AUDIPRO');

    const sales = readWorkbook.getWorksheet('Satışlar')!;
    expect(sales.rowCount).toBeGreaterThanOrEqual(2);
  });
});
