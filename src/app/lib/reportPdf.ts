import type { ReportExportData } from './reportExcel';

const transliteratePdfText = (value: string) => value
  .replace(/[₺]/g, 'TRY ')
  .replace(/[ıİ]/g, match => match === 'ı' ? 'i' : 'I')
  .replace(/[şŞ]/g, match => match === 'ş' ? 's' : 'S')
  .replace(/[ğĞ]/g, match => match === 'ğ' ? 'g' : 'G')
  .replace(/[üÜ]/g, match => match === 'ü' ? 'u' : 'U')
  .replace(/[öÖ]/g, match => match === 'ö' ? 'o' : 'O')
  .replace(/[çÇ]/g, match => match === 'ç' ? 'c' : 'C')
  .replace(/[–—]/g, '-')
  .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  .replace(/[^\x20-\x7E]/g, '?');

export function createReportPdf(lines: string[]): Blob {
  const wrappedLines = lines.flatMap(line => {
    const text = transliteratePdfText(line);
    const wrapped: string[] = [];
    for (let index = 0; index < text.length; index += 92) wrapped.push(text.slice(index, index + 92));
    return wrapped.length ? wrapped : [''];
  });
  const pages = Array.from({ length: Math.max(1, Math.ceil(wrappedLines.length / 48)) }, (_, index) => wrappedLines.slice(index * 48, (index + 1) * 48));
  const objects: string[] = [];
  const pageIds = pages.map((_, index) => 4 + index * 2);
  objects[1] = '<< /Type /Catalog /Pages 2 0 R >>';
  objects[2] = `<< /Type /Pages /Kids [${pageIds.map(id => `${id} 0 R`).join(' ')}] /Count ${pages.length} >>`;
  objects[3] = '<< /Type /Font /Subtype /Type1 /BaseFont /Courier /Encoding /WinAnsiEncoding >>';

  pages.forEach((pageLines, index) => {
    const pageId = pageIds[index];
    const contentId = pageId + 1;
    const commands = pageLines.map((line, lineIndex) => {
      const escaped = line.replaceAll('\\', '\\\\').replaceAll('(', '\\(').replaceAll(')', '\\)');
      return `BT /F1 9 Tf 36 ${790 - lineIndex * 15} Td (${escaped}) Tj ET`;
    }).join('\n');
    objects[pageId] = `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 842] /Resources << /Font << /F1 3 0 R >> >> /Contents ${contentId} 0 R >>`;
    objects[contentId] = `<< /Length ${commands.length} >>\nstream\n${commands}\nendstream`;
  });

  let pdf = '%PDF-1.4\n';
  const offsets = [0];
  for (let id = 1; id < objects.length; id += 1) {
    offsets[id] = pdf.length;
    pdf += `${id} 0 obj\n${objects[id]}\nendobj\n`;
  }
  const xrefOffset = pdf.length;
  pdf += `xref\n0 ${objects.length}\n0000000000 65535 f \n`;
  for (let id = 1; id < objects.length; id += 1) pdf += `${String(offsets[id]).padStart(10, '0')} 00000 n \n`;
  pdf += `trailer\n<< /Size ${objects.length} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  return new Blob([pdf], { type: 'application/pdf' });
}

export function buildPdfReportLines(data: ReportExportData): string[] {
  const pad = (str: string, len: number) => (str || '').padEnd(len).slice(0, len);
  const padR = (str: string, len: number) => (str || '').padStart(len).slice(0, len);
  const sep = '='.repeat(84);
  const dash = '-'.repeat(84);

  const lines: string[] = [
    sep,
    `          ${data.clinicName.toUpperCase()} - YONETIM VE FAALIYET RAPORU`,
    sep,
    `Rapor Tarihi: ${data.generatedAt}   |   Donem: ${data.dateRange}`,
    `Kapsam: ${data.branchName || 'Tum Subeler'}   |   Durum: Onayli Resmi Ozet`,
    '',
    dash,
    '1. TEMEL FINANSAL VE OPERASYONEL GOSTERGELER (KPI)',
    dash,
    `  Toplam Ciro           : TRY ${data.kpis.totalRevenue.toLocaleString('tr-TR')}`,
    `  Toplam Gider          : TRY ${data.kpis.totalExpenses.toLocaleString('tr-TR')}`,
    `  Net Faaliyet Kari     : TRY ${data.kpis.netProfit.toLocaleString('tr-TR')}`,
    `  Kayitli Hasta Sayisi  : ${data.kpis.patientCount}`,
    `  Toplam Randevu        : ${data.kpis.appointmentCount}`,
    `  Satilan Cihaz Adedi   : ${data.kpis.deviceSalesCount} Adet`,
    `  Teknik Servis Geliri  : TRY ${data.kpis.serviceRevenue.toLocaleString('tr-TR')}`,
    '',
    dash,
    '2. SUBE BAZLI PERFORMANS DAGILIMI',
    dash,
    `  ${pad('Sube', 28)} ${padR('Hasta', 10)} ${padR('Randevu', 12)} ${padR('Ciro (TRY)', 18)}`,
    `  ${'-'.repeat(72)}`,
  ];

  if (data.branchPerformance.length > 0) {
    data.branchPerformance.forEach(b => {
      lines.push(`  ${pad(b.branch, 28)} ${padR(String(b.patients), 10)} ${padR(String(b.appointments), 12)} ${padR(b.revenue.toLocaleString('tr-TR'), 18)}`);
    });
  } else {
    lines.push('  Veri bulunamadi.');
  }

  lines.push('', dash, '3. DONEM SATISLARI DETAYI', dash);
  lines.push(`  ${pad('Tarih', 12)} ${pad('Hasta', 22)} ${pad('Kalem / Urun', 24)} ${padR('Tutar (TRY)', 14)}`);
  lines.push(`  ${'-'.repeat(76)}`);

  if (data.sales.length > 0) {
    data.sales.slice(0, 30).forEach(s => {
      lines.push(`  ${pad(s.date, 12)} ${pad(s.patientName, 22)} ${pad(s.itemsSummary, 24)} ${padR(s.total.toLocaleString('tr-TR'), 14)}`);
    });
    if (data.sales.length > 30) {
      lines.push(`  ... ve ${data.sales.length - 30} diger satis kaydi`);
    }
  } else {
    lines.push('  Secili donemde satis kaydi bulunamadi.');
  }

  lines.push('', dash, '4. DONEM GIDERLERI DETAYI', dash);
  lines.push(`  ${pad('Tarih', 12)} ${pad('Kategori', 20)} ${pad('Aciklama', 26)} ${padR('Tutar (TRY)', 14)}`);
  lines.push(`  ${'-'.repeat(76)}`);

  if (data.expenses.length > 0) {
    data.expenses.slice(0, 30).forEach(e => {
      lines.push(`  ${pad(e.date, 12)} ${pad(e.category, 20)} ${pad(e.description, 26)} ${padR(e.amount.toLocaleString('tr-TR'), 14)}`);
    });
    if (data.expenses.length > 30) {
      lines.push(`  ... ve ${data.expenses.length - 30} diger gider kaydi`);
    }
  } else {
    lines.push('  Secili donemde gider kaydi bulunamadi.');
  }

  lines.push('', dash, '5. RANDEVU TAKIBI VE ISLEMLER', dash);
  lines.push(`  ${pad('Tarih', 12)} ${pad('Saat', 8)} ${pad('Hasta Adi', 24)} ${pad('Tur', 18)} ${pad('Durum', 10)}`);
  lines.push(`  ${'-'.repeat(76)}`);

  if (data.appointments.length > 0) {
    data.appointments.slice(0, 30).forEach(a => {
      lines.push(`  ${pad(a.date, 12)} ${pad(a.time, 8)} ${pad(a.patientName, 24)} ${pad(a.type, 18)} ${pad(a.status, 10)}`);
    });
    if (data.appointments.length > 30) {
      lines.push(`  ... ve ${data.appointments.length - 30} diger randevu kaydi`);
    }
  } else {
    lines.push('  Secili donemde randevu kaydi bulunamadi.');
  }

  lines.push('', dash, '6. TEKNIK SERVIS VE ARIZA KAYITLARI', dash);
  lines.push(`  ${pad('Tarih', 12)} ${pad('Hasta', 20)} ${pad('Cihaz', 22)} ${pad('Durum', 12)} ${padR('Ucret', 10)}`);
  lines.push(`  ${'-'.repeat(80)}`);

  if (data.serviceTickets.length > 0) {
    data.serviceTickets.slice(0, 20).forEach(t => {
      lines.push(`  ${pad(t.receivedDate || '-', 12)} ${pad(t.patientName, 20)} ${pad(t.device, 22)} ${pad(t.status, 12)} ${padR(t.fee.toLocaleString('tr-TR'), 10)}`);
    });
  } else {
    lines.push('  Secili donemde teknik servis kaydi bulunamadi.');
  }

  lines.push('', sep, 'Rapor Sonu - AudiPro Otomasyon ve Klinik Yonetim Sistemi', sep);
  return lines;
}
