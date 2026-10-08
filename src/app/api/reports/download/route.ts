import { NextRequest, NextResponse } from 'next/server';
import ExcelJS from 'exceljs';
import { createReportWorkbook, type ReportExportData } from '../../../lib/reportExcel';
import { createReportPdf, buildPdfReportLines } from '../../../lib/reportPdf';
import { generateCsvContent } from '../../../lib/reportCsv';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const format = (searchParams.get('format') || 'xlsx').toLowerCase();
    const dateRange = searchParams.get('range') || searchParams.get('dateRange') || '01.01.2026 - 31.12.2026';
    const branchName = searchParams.get('branch') || 'Tüm Şubeler (Konsolide)';

    const exportData: ReportExportData = {
      clinicName: 'AudiPro İşitme Merkezi',
      dateRange,
      generatedAt: new Date().toLocaleString('tr-TR', { dateStyle: 'short', timeStyle: 'short' }),
      branchName,
      kpis: {
        totalRevenue: 285400,
        totalExpenses: 74200,
        netProfit: 211200,
        patientCount: 42,
        appointmentCount: 56,
        deviceSalesCount: 18,
        serviceRevenue: 16500,
      },
      branchPerformance: [
        { branch: 'Kadıköy Şubesi', patients: 24, appointments: 32, revenue: 162000 },
        { branch: 'Bakırköy Şubesi', patients: 18, appointments: 24, revenue: 123400 },
      ],
      revenueDistribution: [
        { label: 'Cihaz Satışları', value: 245000 },
        { label: 'Teknik Servis', value: 16500 },
        { label: 'Pil & Aksesuar', value: 23900 },
      ],
      sales: [
        {
          date: '2026-09-15',
          patientName: 'Ahmet Yılmaz',
          branchName: 'Kadıköy Şubesi',
          itemsSummary: 'Oticon Real 1 miniRITE R x2',
          total: 65000,
          sgkAmount: 6480,
          patientAmount: 58520,
          paymentMethod: 'Kredi Kartı',
          status: 'Tahsil Edildi',
        },
        {
          date: '2026-09-18',
          patientName: 'Ayşe Demir',
          branchName: 'Bakırköy Şubesi',
          itemsSummary: 'Phonak Audeo Lumity L90',
          total: 38000,
          sgkAmount: 3240,
          patientAmount: 34760,
          paymentMethod: 'Nakit',
          status: 'Tahsil Edildi',
        },
        {
          date: '2026-10-02',
          patientName: 'Mehmet Kaya',
          branchName: 'Kadıköy Şubesi',
          itemsSummary: 'Signia Pure Charge&Go 7AX',
          total: 42000,
          sgkAmount: 3240,
          patientAmount: 38760,
          paymentMethod: 'Havale / EFT',
          status: 'Tahsil Edildi',
        },
      ],
      expenses: [
        {
          date: '2026-09-01',
          category: 'Kira',
          description: 'Eylül 2026 Şube Kirası',
          branchName: 'Kadıköy Şubesi',
          amount: 35000,
          paymentMethod: 'Banka Transferi',
          receiptNo: 'KIR-2026-09',
        },
        {
          date: '2026-09-05',
          category: 'Sarf Malzeme',
          description: 'Kalıp silikonu ve temizleme seti',
          branchName: 'Bakırköy Şubesi',
          amount: 8500,
          paymentMethod: 'Kredi Kartı',
          receiptNo: 'SRF-8812',
        },
      ],
      appointments: [
        {
          date: '2026-10-10',
          time: '10:30',
          patientName: 'Ahmet Yılmaz',
          branchName: 'Kadıköy Şubesi',
          type: 'Kontrol & İnce Ayar',
          audiologist: 'Ody. Fatma Şen',
          status: 'Tamamlandı',
          notes: '6 aylık kontrol yapıldı.',
        },
        {
          date: '2026-10-12',
          time: '14:00',
          patientName: 'Fatma Çelik',
          branchName: 'Bakırköy Şubesi',
          type: 'İlk Muayene / İşitme Testi',
          audiologist: 'Ody. Emre Can',
          status: 'Tamamlandı',
          notes: 'Saf ses odyometrisi yapıldı.',
        },
      ],
      serviceTickets: [
        {
          receivedDate: '2026-09-20',
          patientName: 'Hasan Ak',
          branchName: 'Kadıköy Şubesi',
          device: 'Oticon OPN 1',
          serialNo: 'SN-992318',
          complaint: 'Hoparlör cızırtısı',
          fee: 1850,
          status: 'Teslim Edildi',
          technician: 'Teknisyen Ali',
        },
      ],
      patients: [
        {
          createdAt: '2026-01-10',
          name: 'Ahmet Yılmaz',
          phone: '0532 111 22 33',
          branchName: 'Kadıköy Şubesi',
          source: 'Doktor Yönlendirmesi',
          hearingLoss: 'İleri Derece Sensörinöral',
          sgkStatus: 'Emekli Sandığı',
        },
        {
          createdAt: '2026-02-14',
          name: 'Ayşe Demir',
          phone: '0533 222 33 44',
          branchName: 'Bakırköy Şubesi',
          source: 'Tavsiye',
          hearingLoss: 'Orta Derece',
          sgkStatus: 'SSK',
        },
      ],
    };

    const dateStamp = new Date().toISOString().slice(0, 10);
    const safeBaseName = `AudiPro_Yonetim_Raporu_${dateStamp}`;

    if (format.includes('csv')) {
      const csv = generateCsvContent(exportData);
      const csvBuffer = Buffer.from(csv, 'utf-8');
      return new NextResponse(csvBuffer, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="${safeBaseName}.csv"`,
          'Content-Length': String(csvBuffer.byteLength),
          'Cache-Control': 'no-store, no-cache, must-revalidate',
        },
      });
    }

    if (format.includes('pdf')) {
      const pdfLines = buildPdfReportLines(exportData);
      const pdfBlob = createReportPdf(pdfLines);
      const pdfBuffer = Buffer.from(await pdfBlob.arrayBuffer());
      return new NextResponse(pdfBuffer, {
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${safeBaseName}.pdf"`,
          'Content-Length': String(pdfBuffer.byteLength),
          'Cache-Control': 'no-store, no-cache, must-revalidate',
        },
      });
    }

    // Default: Excel (XLSX)
    const workbookBlob = await createReportWorkbook(exportData, ExcelJS);
    const xlsxBuffer = Buffer.from(await workbookBlob.arrayBuffer());
    return new NextResponse(xlsxBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${safeBaseName}.xlsx"`,
        'Content-Length': String(xlsxBuffer.byteLength),
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    });
  } catch (error) {
    console.error('Report download API error:', error);
    return NextResponse.json(
      { error: 'Rapor oluşturulamadı', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
