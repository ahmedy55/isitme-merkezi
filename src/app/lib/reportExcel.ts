import type ExcelJS from 'exceljs';

export interface ReportExportData {
  clinicName: string;
  dateRange: string;
  generatedAt: string;
  branchName?: string;
  kpis: {
    totalRevenue: number;
    totalExpenses: number;
    netProfit: number;
    patientCount: number;
    appointmentCount: number;
    deviceSalesCount: number;
    serviceRevenue: number;
  };
  branchPerformance: Array<{
    branch: string;
    patients: number;
    appointments: number;
    revenue: number;
  }>;
  revenueDistribution: Array<{
    label: string;
    value: number;
  }>;
  sales: Array<{
    date: string;
    patientName: string;
    branchName?: string;
    itemsSummary: string;
    total: number;
    sgkAmount?: number;
    patientAmount?: number;
    paymentMethod: string;
    status: string;
  }>;
  expenses: Array<{
    date: string;
    category: string;
    description: string;
    branchName?: string;
    amount: number;
    paymentMethod?: string;
    receiptNo?: string;
  }>;
  appointments: Array<{
    date: string;
    time: string;
    patientName: string;
    branchName?: string;
    type: string;
    audiologist?: string;
    status: string;
    notes?: string;
  }>;
  serviceTickets: Array<{
    receivedDate?: string;
    patientName: string;
    branchName?: string;
    device: string;
    serialNo?: string;
    complaint?: string;
    fee: number;
    status: string;
    technician?: string;
  }>;
  patients: Array<{
    createdAt?: string;
    name: string;
    phone?: string;
    branchName?: string;
    source?: string;
    hearingLoss?: string;
    sgkStatus?: string;
  }>;
}

const HEADER_FILL: ExcelJS.Fill = {
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb: 'FF0F766E' } // Teal 700
};

const HEADER_FONT: Partial<ExcelJS.Font> = {
  bold: true,
  color: { argb: 'FFFFFFFF' },
  size: 11
};

const TITLE_FILL: ExcelJS.Fill = {
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb: 'FF134E4A' } // Teal 900
};

const BORDER_STYLE: Partial<ExcelJS.Borders> = {
  top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
  left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
  bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
  right: { style: 'thin', color: { argb: 'FFE2E8F0' } }
};

export async function createReportWorkbook(
  data: ReportExportData,
  ExcelJSModule: typeof ExcelJS
): Promise<Blob> {
  const workbook = new ExcelJSModule.Workbook();
  workbook.creator = data.clinicName;
  workbook.created = new Date();

  // ──────────────────────────────────────────
  // SAYFA 1: YÖNETİCİ ÖZETİ
  // ──────────────────────────────────────────
  const summarySheet = workbook.addWorksheet('Yönetici Özeti');
  summarySheet.columns = [
    { width: 34 },
    { width: 22 },
    { width: 40 },
    { width: 18 },
    { width: 18 }
  ];

  // Banner
  summarySheet.mergeCells('A1:E1');
  const bannerCell = summarySheet.getCell('A1');
  bannerCell.value = `${data.clinicName.toUpperCase()} - YÖNETİM VE FAALİYET ANALİZ RAPORU`;
  bannerCell.font = { bold: true, size: 14, color: { argb: 'FFFFFFFF' } };
  bannerCell.fill = TITLE_FILL;
  bannerCell.alignment = { horizontal: 'center', vertical: 'middle' };
  summarySheet.getRow(1).height = 36;

  // Metadata
  summarySheet.mergeCells('A2:E2');
  const metaCell = summarySheet.getCell('A2');
  metaCell.value = `Rapor Tarihi: ${data.generatedAt}   |   Kapsam: ${data.branchName || 'Tüm Şubeler'}   |   Seçili Tarih Aralığı: ${data.dateRange}`;
  metaCell.font = { italic: true, size: 10, color: { argb: 'FF475569' } };
  metaCell.alignment = { horizontal: 'center', vertical: 'middle' };
  summarySheet.getRow(2).height = 24;

  // Boş satır
  summarySheet.addRow([]);

  // KPI Başlığı
  const kpiTitleRow = summarySheet.addRow(['TEMEL FİNANSAL VE OPERASYONEL GÖSTERGELER (KPI)', '', '']);
  summarySheet.mergeCells(`A${kpiTitleRow.number}:C${kpiTitleRow.number}`);
  kpiTitleRow.getCell(1).font = { bold: true, size: 12, color: { argb: 'FF0F766E' } };

  // KPI Tablo Başlıkları
  const kpiHeaderRow = summarySheet.addRow(['Gösterge / Metrik', 'Değer', 'Açıklama']);
  ['A', 'B', 'C'].forEach(col => {
    const cell = summarySheet.getCell(`${col}${kpiHeaderRow.number}`);
    cell.fill = HEADER_FILL;
    cell.font = HEADER_FONT;
    cell.alignment = { vertical: 'middle' };
  });

  const kpiRows = [
    ['Toplam Ciro', `₺${data.kpis.totalRevenue.toLocaleString('tr-TR')}`, 'Cihaz satışı, aksesuar ve servis tahsilatları toplamı'],
    ['Toplam Gider', `₺${data.kpis.totalExpenses.toLocaleString('tr-TR')}`, 'Kira, personel, fatura ve operasyonel harcamalar'],
    ['Net Faaliyet Kârı', `₺${data.kpis.netProfit.toLocaleString('tr-TR')}`, 'Toplam Ciro - Toplam Gider'],
    ['Kayıtlı Hasta Sayısı', `${data.kpis.patientCount}`, 'Dönem içinde sistemde kayıtlı hasta sayısı'],
    ['Toplam Randevu', `${data.kpis.appointmentCount}`, 'İşitme testi, deneme, kontrol ve bakım randevuları'],
    ['Satılan Cihaz Adedi', `${data.kpis.deviceSalesCount} Adet`, 'Satışı tamamlanan işitme cihazları'],
    ['Teknik Servis Geliri', `₺${data.kpis.serviceRevenue.toLocaleString('tr-TR')}`, 'Servis, arıza ve bakım işlemlerinden elde edilen gelir']
  ];

  kpiRows.forEach(([metric, val, desc]) => {
    const row = summarySheet.addRow([metric, val, desc]);
    row.getCell(1).font = { bold: true, color: { argb: 'FF1E293B' } };
    row.getCell(2).font = { bold: true, color: { argb: 'FF0F766E' } };
    row.getCell(3).font = { color: { argb: 'FF64748B' } };
    [1, 2, 3].forEach(c => { row.getCell(c).border = BORDER_STYLE; });
  });

  summarySheet.addRow([]);

  // Şube Performansı Başlığı
  const branchTitleRow = summarySheet.addRow(['ŞUBE BAZLI PERFORMANS DAĞILIMI', '', '', '']);
  summarySheet.mergeCells(`A${branchTitleRow.number}:D${branchTitleRow.number}`);
  branchTitleRow.getCell(1).font = { bold: true, size: 12, color: { argb: 'FF0F766E' } };

  const branchHeaderRow = summarySheet.addRow(['Şube Adı', 'Hasta Sayısı', 'Randevu Sayısı', 'Toplam Ciro (₺)']);
  ['A', 'B', 'C', 'D'].forEach(col => {
    const cell = summarySheet.getCell(`${col}${branchHeaderRow.number}`);
    cell.fill = HEADER_FILL;
    cell.font = HEADER_FONT;
    cell.alignment = { vertical: 'middle' };
  });

  if (data.branchPerformance.length > 0) {
    data.branchPerformance.forEach(b => {
      const row = summarySheet.addRow([
        b.branch,
        b.patients,
        b.appointments,
        `₺${b.revenue.toLocaleString('tr-TR')}`
      ]);
      row.getCell(1).font = { bold: true };
      row.getCell(4).font = { bold: true, color: { argb: 'FF0F766E' } };
      [1, 2, 3, 4].forEach(c => { row.getCell(c).border = BORDER_STYLE; });
    });
  } else {
    const emptyRow = summarySheet.addRow(['Veri bulunamadı', '-', '-', '-']);
    [1, 2, 3, 4].forEach(c => { emptyRow.getCell(c).border = BORDER_STYLE; });
  }

  summarySheet.addRow([]);

  // Gelir Dağılımı Başlığı
  if (data.revenueDistribution.length > 0) {
    const revTitleRow = summarySheet.addRow(['GELİR KALEMLERİ DAĞILIMI', '', '']);
    summarySheet.mergeCells(`A${revTitleRow.number}:B${revTitleRow.number}`);
    revTitleRow.getCell(1).font = { bold: true, size: 12, color: { argb: 'FF0F766E' } };

    const revHeaderRow = summarySheet.addRow(['Kategori', 'Tutar (₺)']);
    ['A', 'B'].forEach(col => {
      const cell = summarySheet.getCell(`${col}${revHeaderRow.number}`);
      cell.fill = HEADER_FILL;
      cell.font = HEADER_FONT;
      cell.alignment = { vertical: 'middle' };
    });

    data.revenueDistribution.forEach(rev => {
      const row = summarySheet.addRow([rev.label, `₺${Math.round(rev.value).toLocaleString('tr-TR')}`]);
      row.getCell(1).font = { bold: true };
      row.getCell(2).font = { bold: true, color: { argb: 'FF0F766E' } };
      [1, 2].forEach(c => { row.getCell(c).border = BORDER_STYLE; });
    });
  }

  // ──────────────────────────────────────────
  // SAYFA 2: SATIŞLAR DETAYI
  // ──────────────────────────────────────────
  const salesSheet = workbook.addWorksheet('Satışlar');
  salesSheet.columns = [
    { header: 'Tarih', key: 'date', width: 14 },
    { header: 'Hasta Adı', key: 'patientName', width: 24 },
    { header: 'Şube', key: 'branchName', width: 18 },
    { header: 'Satılan Kalemler / Ürünler', key: 'itemsSummary', width: 36 },
    { header: 'Toplam Tutar (₺)', key: 'total', width: 18 },
    { header: 'SGK Katkısı (₺)', key: 'sgkAmount', width: 16 },
    { header: 'Hasta Payı (₺)', key: 'patientAmount', width: 16 },
    { header: 'Ödeme Yöntemi', key: 'paymentMethod', width: 16 },
    { header: 'Tahsilat Durumu', key: 'status', width: 16 }
  ];

  const salesHeaderRow = salesSheet.getRow(1);
  salesHeaderRow.font = HEADER_FONT;
  salesHeaderRow.fill = HEADER_FILL;
  salesHeaderRow.height = 26;

  let totalSalesAmount = 0;
  data.sales.forEach(s => {
    totalSalesAmount += s.total || 0;
    const row = salesSheet.addRow({
      date: s.date,
      patientName: s.patientName,
      branchName: s.branchName || 'Merkez',
      itemsSummary: s.itemsSummary,
      total: s.total,
      sgkAmount: s.sgkAmount || 0,
      patientAmount: s.patientAmount || s.total,
      paymentMethod: s.paymentMethod,
      status: s.status
    });
    row.getCell('total').numFmt = '#,##0.00 "₺"';
    row.getCell('sgkAmount').numFmt = '#,##0.00 "₺"';
    row.getCell('patientAmount').numFmt = '#,##0.00 "₺"';
    [1, 2, 3, 4, 5, 6, 7, 8, 9].forEach(c => { row.getCell(c).border = BORDER_STYLE; });
  });

  // Toplam Satırı
  const salesSummaryRow = salesSheet.addRow({
    date: 'GENEL TOPLAM',
    patientName: `${data.sales.length} İşlem`,
    branchName: '',
    itemsSummary: '',
    total: totalSalesAmount,
    sgkAmount: '',
    patientAmount: '',
    paymentMethod: '',
    status: ''
  });
  salesSummaryRow.font = { bold: true };
  salesSummaryRow.getCell('total').numFmt = '#,##0.00 "₺"';
  salesSummaryRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
  [1, 2, 3, 4, 5, 6, 7, 8, 9].forEach(c => { salesSummaryRow.getCell(c).border = BORDER_STYLE; });

  // ──────────────────────────────────────────
  // SAYFA 3: GİDERLER DETAYI
  // ──────────────────────────────────────────
  const expensesSheet = workbook.addWorksheet('Giderler');
  expensesSheet.columns = [
    { header: 'Tarih', key: 'date', width: 14 },
    { header: 'Kategori', key: 'category', width: 22 },
    { header: 'Açıklama', key: 'description', width: 36 },
    { header: 'Şube', key: 'branchName', width: 18 },
    { header: 'Tutar (₺)', key: 'amount', width: 18 },
    { header: 'Ödeme Türü', key: 'paymentMethod', width: 16 },
    { header: 'Fiş / Fatura No', key: 'receiptNo', width: 18 }
  ];

  const expHeaderRow = expensesSheet.getRow(1);
  expHeaderRow.font = HEADER_FONT;
  expHeaderRow.fill = HEADER_FILL;
  expHeaderRow.height = 26;

  let totalExpensesAmount = 0;
  data.expenses.forEach(e => {
    totalExpensesAmount += e.amount || 0;
    const row = expensesSheet.addRow({
      date: e.date,
      category: e.category,
      description: e.description,
      branchName: e.branchName || 'Merkez',
      amount: e.amount,
      paymentMethod: e.paymentMethod || 'Nakit',
      receiptNo: e.receiptNo || '-'
    });
    row.getCell('amount').numFmt = '#,##0.00 "₺"';
    [1, 2, 3, 4, 5, 6, 7].forEach(c => { row.getCell(c).border = BORDER_STYLE; });
  });

  const expSummaryRow = expensesSheet.addRow({
    date: 'GENEL TOPLAM',
    category: `${data.expenses.length} Kalem`,
    description: '',
    branchName: '',
    amount: totalExpensesAmount,
    paymentMethod: '',
    receiptNo: ''
  });
  expSummaryRow.font = { bold: true };
  expSummaryRow.getCell('amount').numFmt = '#,##0.00 "₺"';
  expSummaryRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
  [1, 2, 3, 4, 5, 6, 7].forEach(c => { expSummaryRow.getCell(c).border = BORDER_STYLE; });

  // ──────────────────────────────────────────
  // SAYFA 4: RANDEVULAR DETAYI
  // ──────────────────────────────────────────
  const appSheet = workbook.addWorksheet('Randevular');
  appSheet.columns = [
    { header: 'Tarih', key: 'date', width: 14 },
    { header: 'Saat', key: 'time', width: 10 },
    { header: 'Hasta Adı', key: 'patientName', width: 24 },
    { header: 'Şube', key: 'branchName', width: 18 },
    { header: 'Randevu Türü', key: 'type', width: 20 },
    { header: 'Odyolog / Sorumlu', key: 'audiologist', width: 22 },
    { header: 'Durum', key: 'status', width: 16 },
    { header: 'Notlar', key: 'notes', width: 34 }
  ];

  const appHeaderRow = appSheet.getRow(1);
  appHeaderRow.font = HEADER_FONT;
  appHeaderRow.fill = HEADER_FILL;
  appHeaderRow.height = 26;

  data.appointments.forEach(a => {
    const row = appSheet.addRow({
      date: a.date,
      time: a.time,
      patientName: a.patientName,
      branchName: a.branchName || 'Merkez',
      type: a.type,
      audiologist: a.audiologist || '-',
      status: a.status,
      notes: a.notes || '-'
    });
    [1, 2, 3, 4, 5, 6, 7, 8].forEach(c => { row.getCell(c).border = BORDER_STYLE; });
  });

  // ──────────────────────────────────────────
  // SAYFA 5: TEKNİK SERVİS
  // ──────────────────────────────────────────
  const serviceSheet = workbook.addWorksheet('Teknik Servis');
  serviceSheet.columns = [
    { header: 'Kayıt Tarihi', key: 'receivedDate', width: 14 },
    { header: 'Hasta Adı', key: 'patientName', width: 24 },
    { header: 'Şube', key: 'branchName', width: 18 },
    { header: 'Cihaz / Model', key: 'device', width: 24 },
    { header: 'Seri No', key: 'serialNo', width: 18 },
    { header: 'Şikayet / Arıza', key: 'complaint', width: 32 },
    { header: 'Teknisyen', key: 'technician', width: 20 },
    { header: 'Servis Ücreti (₺)', key: 'fee', width: 18 },
    { header: 'Durum', key: 'status', width: 16 }
  ];

  const serviceHeaderRow = serviceSheet.getRow(1);
  serviceHeaderRow.font = HEADER_FONT;
  serviceHeaderRow.fill = HEADER_FILL;
  serviceHeaderRow.height = 26;

  let totalServiceFee = 0;
  data.serviceTickets.forEach(t => {
    totalServiceFee += t.fee || 0;
    const row = serviceSheet.addRow({
      receivedDate: t.receivedDate || '-',
      patientName: t.patientName,
      branchName: t.branchName || 'Merkez',
      device: t.device,
      serialNo: t.serialNo || '-',
      complaint: t.complaint || '-',
      technician: t.technician || '-',
      fee: t.fee,
      status: t.status
    });
    row.getCell('fee').numFmt = '#,##0.00 "₺"';
    [1, 2, 3, 4, 5, 6, 7, 8, 9].forEach(c => { row.getCell(c).border = BORDER_STYLE; });
  });

  if (data.serviceTickets.length > 0) {
    const serviceSummaryRow = serviceSheet.addRow({
      receivedDate: 'TOPLAM',
      patientName: `${data.serviceTickets.length} Servis Kaydı`,
      branchName: '',
      device: '',
      serialNo: '',
      complaint: '',
      technician: '',
      fee: totalServiceFee,
      status: ''
    });
    serviceSummaryRow.font = { bold: true };
    serviceSummaryRow.getCell('fee').numFmt = '#,##0.00 "₺"';
    serviceSummaryRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
    [1, 2, 3, 4, 5, 6, 7, 8, 9].forEach(c => { serviceSummaryRow.getCell(c).border = BORDER_STYLE; });
  }

  // ──────────────────────────────────────────
  // SAYFA 6: HASTALAR
  // ──────────────────────────────────────────
  const patientsSheet = workbook.addWorksheet('Hastalar');
  patientsSheet.columns = [
    { header: 'Kayıt Tarihi', key: 'createdAt', width: 14 },
    { header: 'Hasta Adı Soyadı', key: 'name', width: 26 },
    { header: 'Telefon', key: 'phone', width: 18 },
    { header: 'Şube', key: 'branchName', width: 18 },
    { header: 'Kayıt Kaynağı', key: 'source', width: 18 },
    { header: 'İşitme Kaybı', key: 'hearingLoss', width: 18 },
    { header: 'SGK Durumu', key: 'sgkStatus', width: 18 }
  ];

  const patHeaderRow = patientsSheet.getRow(1);
  patHeaderRow.font = HEADER_FONT;
  patHeaderRow.fill = HEADER_FILL;
  patHeaderRow.height = 26;

  data.patients.forEach(p => {
    const row = patientsSheet.addRow({
      createdAt: p.createdAt ? p.createdAt.slice(0, 10) : '-',
      name: p.name,
      phone: p.phone || '-',
      branchName: p.branchName || 'Merkez',
      source: p.source || '-',
      hearingLoss: p.hearingLoss || '-',
      sgkStatus: p.sgkStatus || '-'
    });
    [1, 2, 3, 4, 5, 6, 7].forEach(c => { row.getCell(c).border = BORDER_STYLE; });
  });

  const buffer = await workbook.xlsx.writeBuffer();
  return new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  });
}
