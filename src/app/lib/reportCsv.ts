import type { ReportExportData } from './reportExcel';

export const generateCsvContent = (data: ReportExportData): string => {
  const sanitize = (val: unknown) => `"${String(val ?? '').replaceAll('"', '""')}"`;
  const lines: string[] = [];

  lines.push(`${sanitize(`${data.clinicName} - YÖNETİM VE FAALİYET RAPORU`)};;`);
  lines.push(`${sanitize(`Rapor Tarihi: ${data.generatedAt}`)};${sanitize(`Tarih Aralığı: ${data.dateRange}`)};${sanitize(`Kapsam: ${data.branchName || 'Tüm Şubeler'}`)}`);
  lines.push('');

  lines.push(`${sanitize('=== TEMEL GÖSTERGELER (KPI) ===')};;`);
  lines.push(`${sanitize('Metrik')};${sanitize('Değer')};${sanitize('Açıklama')}`);
  lines.push(`${sanitize('Toplam Ciro')};${sanitize(`₺${data.kpis.totalRevenue.toLocaleString('tr-TR')}`)};${sanitize('Satış, aksesuar ve servis tahsilatları')}`);
  lines.push(`${sanitize('Toplam Gider')};${sanitize(`₺${data.kpis.totalExpenses.toLocaleString('tr-TR')}`)};${sanitize('Operasyonel ve sabit giderler')}`);
  lines.push(`${sanitize('Net Faaliyet Kârı')};${sanitize(`₺${data.kpis.netProfit.toLocaleString('tr-TR')}`)};${sanitize('Toplam Ciro - Toplam Gider')}`);
  lines.push(`${sanitize('Kayıtlı Hasta Sayısı')};${sanitize(data.kpis.patientCount)};${sanitize('Kişi')}`);
  lines.push(`${sanitize('Toplam Randevu')};${sanitize(data.kpis.appointmentCount)};${sanitize('Adet')}`);
  lines.push(`${sanitize('Satılan Cihaz Adedi')};${sanitize(data.kpis.deviceSalesCount)};${sanitize('Adet')}`);
  lines.push(`${sanitize('Teknik Servis Geliri')};${sanitize(`₺${data.kpis.serviceRevenue.toLocaleString('tr-TR')}`)};${sanitize('Bakım, onarım ve parça geliri')}`);
  lines.push('');

  lines.push(`${sanitize('=== ŞUBE PERFORMANSI ===')};;;`);
  lines.push(`${sanitize('Şube Adı')};${sanitize('Hasta Sayısı')};${sanitize('Randevu Sayısı')};${sanitize('Toplam Ciro (₺)')}`);
  data.branchPerformance.forEach(b => {
    lines.push(`${sanitize(b.branch)};${sanitize(b.patients)};${sanitize(b.appointments)};${sanitize(`₺${b.revenue.toLocaleString('tr-TR')}`)}`);
  });
  lines.push('');

  lines.push(`${sanitize('=== SATIŞ DETAYLARI ===')};;;;;;;`);
  lines.push(`${sanitize('Tarih')};${sanitize('Hasta Adı')};${sanitize('Şube')};${sanitize('Ürün / Kalemler')};${sanitize('Toplam Tutar (₺)')};${sanitize('SGK Katkısı (₺)')};${sanitize('Ödeme Yöntemi')};${sanitize('Durum')}`);
  data.sales.forEach(s => {
    lines.push(`${sanitize(s.date)};${sanitize(s.patientName)};${sanitize(s.branchName || 'Merkez')};${sanitize(s.itemsSummary)};${sanitize(s.total)};${sanitize(s.sgkAmount || 0)};${sanitize(s.paymentMethod)};${sanitize(s.status)}`);
  });
  lines.push('');

  lines.push(`${sanitize('=== GİDER DETAYLARI ===')};;;;;;`);
  lines.push(`${sanitize('Tarih')};${sanitize('Kategori')};${sanitize('Açıklama')};${sanitize('Şube')};${sanitize('Tutar (₺)')};${sanitize('Ödeme Türü')};${sanitize('Belge No')}`);
  data.expenses.forEach(e => {
    lines.push(`${sanitize(e.date)};${sanitize(e.category)};${sanitize(e.description)};${sanitize(e.branchName || 'Merkez')};${sanitize(e.amount)};${sanitize(e.paymentMethod || 'Nakit')};${sanitize(e.receiptNo || '-')}`);
  });
  lines.push('');

  lines.push(`${sanitize('=== RANDEVULAR ===')};;;;;;;`);
  lines.push(`${sanitize('Tarih')};${sanitize('Saat')};${sanitize('Hasta Adı')};${sanitize('Şube')};${sanitize('Randevu Türü')};${sanitize('Sorumlu')};${sanitize('Durum')};${sanitize('Notlar')}`);
  data.appointments.forEach(a => {
    lines.push(`${sanitize(a.date)};${sanitize(a.time)};${sanitize(a.patientName)};${sanitize(a.branchName || 'Merkez')};${sanitize(a.type)};${sanitize(a.audiologist || '-')};${sanitize(a.status)};${sanitize(a.notes || '-')}`);
  });

  return `\uFEFF${lines.join('\r\n')}`;
};
