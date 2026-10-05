'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { useBranchScope } from '../hooks/useBranchScope';
import { formatCurrency } from '../data/mockData';
import styles from './ReportsPage.module.css';
import { fetchServiceTickets, type ServiceRecord } from '../repositories/ServiceTicketRepository';
import { dbFetchCashTransactions } from '../lib/database';

interface DonutSlice {
  value: number;
  color: string;
  label: string;
}

const REPORT_COLORS = ['#0d9488', '#f43f5e', '#f59e0b', '#0284c7', '#8b5cf6', '#64748b'];
const dateKey = (value?: string) => {
  if (!value) return '';
  const iso = value.match(/^(\d{4}-\d{2}-\d{2})/);
  if (iso) return iso[1];
  const tr = value.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})/);
  return tr ? `${tr[3]}-${tr[2].padStart(2, '0')}-${tr[1].padStart(2, '0')}` : '';
};
const formatRangeDate = (date: Date) => new Intl.DateTimeFormat('tr-TR').format(date);

// ── Reusable Pure SVG Donut Component ──
function SvgDonut({
  size = 150,
  strokeWidth = 24,
  slices,
  centerValue,
  centerLabel
}: {
  size?: number;
  strokeWidth?: number;
  slices: DonutSlice[];
  centerValue: string | number;
  centerLabel: string;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const total = useMemo(() => slices.reduce((acc, s) => acc + s.value, 0) || 1, [slices]);

  let accumulated = 0;

  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>
          {slices.map((slice, index) => {
            const sliceLength = (slice.value / total) * circumference;
            const strokeDashoffset = -accumulated;
            accumulated += sliceLength;

            return (
              <circle
                key={index}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke={slice.color}
                strokeWidth={strokeWidth}
                strokeDasharray={`${sliceLength} ${circumference - sliceLength}`}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="butt"
                style={{ transition: 'stroke-dasharray 0.3s ease, stroke 0.2s ease' }}
              />
            );
          })}
        </g>
      </svg>
      {/* Center Label */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          pointerEvents: 'none'
        }}
      >
        <span style={{ fontSize: size > 130 ? '17px' : '15px', fontWeight: 700, color: '#0f172a', lineHeight: 1.1 }}>
          {centerValue}
        </span>
        <span style={{ fontSize: size > 130 ? '11px' : '9px', color: '#64748b', marginTop: 2, textAlign: 'center' }}>
          {centerLabel}
        </span>
      </div>
    </div>
  );
}

export default function ReportsPage() {
  const { addToast, salesList, expensesList, patientsList, stockList, appointmentsList, branchesList, suppliersList, currentOrgId } = useApp();
  const { matches } = useBranchScope();

  // Dynamic Calculated Metrics
  const scopedSales = useMemo(() => salesList.filter(sale => matches(undefined, sale.branchId)), [salesList, matches]);
  const scopedExpenses = useMemo(() => expensesList.filter(expense => matches(expense.branch, expense.branchId)), [expensesList, matches]);
  const scopedPatients = useMemo(() => patientsList.filter(patient => matches(patient.branch, patient.branchId)), [patientsList, matches]);
  const scopedAppointments = useMemo(() => appointmentsList.filter(appointment => matches(appointment.branch, appointment.branchId)), [appointmentsList, matches]);
  const [activeTab, setActiveTab] = useState<string>('Genel Bakış');
  const [dateRange, setDateRange] = useState(() => `01.01.${new Date().getFullYear()} - 31.12.${new Date().getFullYear()}`);
  const [selectedPeriod, setSelectedPeriod] = useState('Bu Yıl');
  const rangeBounds = useMemo(() => {
    const [start, end] = dateRange.split(' - ').map(dateKey);
    return { start, end };
  }, [dateRange]);
  const inRange = (value?: string) => {
    const key = dateKey(value);
    return Boolean(key && (!rangeBounds.start || key >= rangeBounds.start) && (!rangeBounds.end || key <= rangeBounds.end));
  };
  const reportSales = useMemo(() => scopedSales.filter(sale => inRange(sale.date)), [scopedSales, rangeBounds]);
  const reportExpenses = useMemo(() => scopedExpenses.filter(expense => inRange(expense.date)), [scopedExpenses, rangeBounds]);
  const reportPatients = useMemo(() => scopedPatients.filter(patient => inRange(patient.createdAt)), [scopedPatients, rangeBounds]);
  const reportAppointments = useMemo(() => scopedAppointments.filter(appointment => inRange(appointment.date)), [scopedAppointments, rangeBounds]);
  const previousRangeBounds = useMemo(() => {
    if (!rangeBounds.start || !rangeBounds.end) return { start: '', end: '' };
    const start = new Date(`${rangeBounds.start}T00:00:00`);
    const end = new Date(`${rangeBounds.end}T00:00:00`);
    const days = Math.max(1, Math.round((end.getTime() - start.getTime()) / 86400000) + 1);
    const previousEnd = new Date(start); previousEnd.setDate(previousEnd.getDate() - 1);
    const previousStart = new Date(previousEnd); previousStart.setDate(previousStart.getDate() - days + 1);
    return { start: previousStart.toISOString().slice(0, 10), end: previousEnd.toISOString().slice(0, 10) };
  }, [rangeBounds]);
  const inPreviousRange = (value?: string) => {
    const key = dateKey(value);
    return Boolean(key && key >= previousRangeBounds.start && key <= previousRangeBounds.end);
  };
  const previousSales = scopedSales.filter(item => inPreviousRange(item.date));
  const previousExpenses = scopedExpenses.filter(item => inPreviousRange(item.date));
  const previousPatients = scopedPatients.filter(item => inPreviousRange(item.createdAt));
  const previousAppointments = scopedAppointments.filter(item => inPreviousRange(item.date));
  const dynamicTotalExpenses = useMemo(() => {
    return reportExpenses.reduce((acc, expense) => acc + (expense.amount || 0), 0);
  }, [reportExpenses]);

  const dynamicPatientCount = reportPatients.length;
  const dynamicAppointmentCount = reportAppointments.length;
  const dynamicDeviceSalesCount = reportSales.reduce((sum, sale) => sum + sale.items.filter(item => item.type === 'Cihaz').reduce((count, item) => count + item.quantity, 0), 0);
  const [reportCashTransactions, setReportCashTransactions] = useState<Array<Record<string, any>>>([]);
  const reportServiceTransactions = reportCashTransactions.filter(row => row.type === 'INCOME'
    && row.referenceEntity === 'service'
    && matches(undefined, row.branchId)
    && inRange(row.createdAt));
  const previousServiceTransactions = reportCashTransactions.filter(row => row.type === 'INCOME'
    && row.referenceEntity === 'service'
    && matches(undefined, row.branchId)
    && inPreviousRange(row.createdAt));
  const salesServiceRevenue = reportSales.reduce((sum, sale) => sum + sale.items
    .filter(item => item.type === 'Servis Geliri')
    .reduce((lineSum, item) => lineSum + item.price * item.quantity, 0), 0);
  const previousSalesServiceRevenue = previousSales.reduce((sum, sale) => sum + sale.items
    .filter(item => item.type === 'Servis Geliri')
    .reduce((lineSum, item) => lineSum + item.price * item.quantity, 0), 0);
  const dynamicServiceRevenue = salesServiceRevenue + reportServiceTransactions.reduce((sum, row) => sum + (Number(row.amount) || 0), 0);
  const previousServiceRevenue = previousSalesServiceRevenue + previousServiceTransactions.reduce((sum, row) => sum + (Number(row.amount) || 0), 0);
  const dynamicTotalRevenue = reportSales.reduce((sum, sale) => sum + (sale.total || 0), 0)
    + reportServiceTransactions.reduce((sum, row) => sum + (Number(row.amount) || 0), 0);
  const dynamicNetProfit = dynamicTotalRevenue - dynamicTotalExpenses;
  const previousRevenue = previousSales.reduce((sum, item) => sum + item.total, 0)
    + previousServiceTransactions.reduce((sum, row) => sum + (Number(row.amount) || 0), 0);
  const previousExpenseTotal = previousExpenses.reduce((sum, item) => sum + item.amount, 0);
  const previousPatientCount = previousPatients.length;
  const previousDeviceCount = previousSales.reduce((sum, sale) => sum + sale.items.filter(item => item.type === 'Cihaz').reduce((qty, item) => qty + item.quantity, 0), 0);
  const percentageChange = (current: number, previous: number) => previous ? `${current >= previous ? '+' : ''}%${Math.round((current - previous) / previous * 100)}` : 'Önceki dönemde veri yok';
  const compareRows = [
    { label: 'Toplam Ciro', current: dynamicTotalRevenue, previous: previousRevenue, format: formatCurrency },
    { label: 'Toplam Hasta', current: dynamicPatientCount, previous: previousPatientCount, format: (value: number) => String(value) },
    { label: 'Cihaz Satışı', current: dynamicDeviceSalesCount, previous: previousDeviceCount, format: (value: number) => `${value} Adet` },
    { label: 'Teknik Servis Geliri', current: dynamicServiceRevenue, previous: previousServiceRevenue, format: formatCurrency },
  ];
  const [chartMetric, setChartMetric] = useState('Ciro');
  const [showMonthlyTable, setShowMonthlyTable] = useState(false);
  const [hoveredMonth, setHoveredMonth] = useState<string | null>(null);
  const [serviceRecords, setServiceRecords] = useState<ServiceRecord[]>([]);
  useEffect(() => {
    let active = true;
    if (!currentOrgId) { setReportCashTransactions([]); return; }
    dbFetchCashTransactions().then(rows => { if (active) setReportCashTransactions(rows as Array<Record<string, any>>); }).catch(() => {
      console.error('Rapor kasa hareketleri yüklenemedi.');
      if (active) {
        setReportCashTransactions([]);
        addToast({ type: 'error', message: 'Finansal rapor verileri yüklenemedi.' });
      }
    });
    return () => { active = false; };
  }, [currentOrgId]);
  useEffect(() => {
    let active = true;
    if (!currentOrgId) { setServiceRecords([]); return; }
    fetchServiceTickets(currentOrgId).then(records => { if (active) setServiceRecords(records); }).catch(() => {
      console.error('Rapor servis kayıtları yüklenemedi.');
      if (active) addToast({ type: 'error', message: 'Teknik servis rapor verileri yüklenemedi.' });
    });
    return () => { active = false; };
  }, [currentOrgId]);

  // Modals state
  const [showCompareModal, setShowCompareModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showDateModal, setShowDateModal] = useState(false);

  // 12 Months Bar Chart Data
  const monthNames = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
  const reportYear = Number(rangeBounds.start.slice(0, 4)) || new Date().getFullYear();
  const rawMonthlyValues = monthNames.map((_, monthIndex) => {
    const monthKey = `${reportYear}-${String(monthIndex + 1).padStart(2, '0')}`;
    const monthSales = reportSales.filter(sale => dateKey(sale.date).startsWith(monthKey));
    const monthServiceRevenue = reportCashTransactions.filter(row => row.type === 'INCOME' && row.referenceEntity === 'service'
      && matches(undefined, row.branchId) && dateKey(row.createdAt).startsWith(monthKey))
      .reduce((sum, row) => sum + (Number(row.amount) || 0), 0);
    const monthExpenses = reportExpenses.filter(expense => dateKey(expense.date).startsWith(monthKey)).reduce((sum, expense) => sum + expense.amount, 0);
    if (chartMetric === 'Satış Adedi') return monthSales.reduce((sum, sale) => sum + sale.items.reduce((qty, item) => qty + item.quantity, 0), 0);
    if (chartMetric === 'Karlılık') return monthSales.reduce((sum, sale) => sum + sale.total, 0) + monthServiceRevenue - monthExpenses;
    return monthSales.reduce((sum, sale) => sum + sale.total, 0) + monthServiceRevenue;
  });
  const chartScaleMax = Math.max(...rawMonthlyValues.map(value => Math.max(0, value)), 1);
  const monthlyData = monthNames.map((month, index) => ({ month, value: rawMonthlyValues[index], heightPct: Math.max(0, rawMonthlyValues[index]) / chartScaleMax * 100, isCurrent: index === new Date().getMonth() }));
  const chartUnit = chartMetric === 'Satış Adedi' ? 'adet' : '₺';
  const chartTitle = chartMetric === 'Satış Adedi' ? 'Aylık Satış Adedi' : chartMetric === 'Karlılık' ? 'Aylık Karlılık' : 'Aylık Ciro Trendi';
  const chartTickValues = Array.from({ length: 6 }, (_, index) => Math.round(chartScaleMax * (5 - index) / 5));

  // Gelir Dağılımı Donut Data
  const revenueDistributionSlices: DonutSlice[] = useMemo(() => {
    const totals = new Map<string, number>();
    reportSales.forEach(sale => {
      const lineTotals = sale.items.map(item => Math.max(0, item.price * item.quantity));
      const lineTotal = lineTotals.reduce((sum, value) => sum + value, 0);
      sale.items.forEach((item, index) => {
        const label = item.type === 'Cihaz' ? 'Cihaz Satışı' : item.type === 'Aksesuar' || item.type === 'Pil' ? 'Aksesuar Satışı' : item.type === 'Servis Geliri' ? 'Teknik Servis' : 'Hizmet / Diğer';
        const allocated = lineTotal ? (sale.total * lineTotals[index]) / lineTotal : 0;
        totals.set(label, (totals.get(label) || 0) + allocated);
      });
    });
    reportServiceTransactions.forEach(row => {
      totals.set('Teknik Servis', (totals.get('Teknik Servis') || 0) + (Number(row.amount) || 0));
    });
    if (!totals.size) return [];
    if (reportServiceTransactions.length && !totals.has('Teknik Servis')) totals.set('Teknik Servis', reportServiceTransactions.reduce((sum, row) => sum + (Number(row.amount) || 0), 0));
    return [...totals].map(([label, value], index) => ({ label, value, color: REPORT_COLORS[index % REPORT_COLORS.length] }));
  }, [reportSales, reportServiceTransactions]);
  const reportSourceRows = useMemo(() => {
    const totals = new Map<string, number>();
    reportPatients.forEach(patient => {
      const source = patient.source || 'Belirtilmemiş';
      totals.set(source, (totals.get(source) || 0) + 1);
    });
    return [...totals].map(([label, value], index) => ({ label, value, color: REPORT_COLORS[index % REPORT_COLORS.length] }));
  }, [reportPatients]);
  const reportAppointmentRows = useMemo(() => {
    const totals = new Map<string, number>();
    reportAppointments.forEach(item => totals.set(item.status, (totals.get(item.status) || 0) + 1));
    return [...totals].map(([label, value], index) => ({ label, value, color: REPORT_COLORS[index % REPORT_COLORS.length] }));
  }, [reportAppointments]);
  const reportServiceRows = useMemo(() => {
    const totals = new Map<string, number>();
    serviceRecords.filter(item => matches(undefined, item.branchId) && inRange(item.receivedDate)).forEach(item => totals.set(item.status, (totals.get(item.status) || 0) + 1));
    return [...totals].map(([label, value], index) => ({ label, value, color: REPORT_COLORS[index % REPORT_COLORS.length] }));
  }, [serviceRecords, rangeBounds, matches]);
  const topDevices = useMemo(() => {
    const totals = new Map<string, { salesCount: number; revenue: number }>();
    reportSales.forEach(sale => sale.items.filter(item => item.type === 'Cihaz').forEach(item => {
      const current = totals.get(item.name) || { salesCount: 0, revenue: 0 };
      current.salesCount += item.quantity;
      current.revenue += item.price * item.quantity;
      totals.set(item.name, current);
    }));
    const rows = [...totals].map(([name, value]) => ({ name, ...value })).sort((a, b) => b.salesCount - a.salesCount);
    const total = rows.reduce((sum, row) => sum + row.salesCount, 0) || 1;
    return rows.slice(0, 5).map((row, index) => ({ ...row, rank: index + 1, ratio: Math.round(row.salesCount / total * 100) }));
  }, [reportSales]);
  const branchPerformance = useMemo(() => branchesList.filter(branch => matches(branch.name, branch.id)).map(branch => ({
    branch: branch.name,
    patients: reportPatients.filter(patient => matches(patient.branch, patient.branchId) && (patient.branchId === branch.id || (!patient.branchId && patient.branch === branch.name))).length,
    appointments: reportAppointments.filter(item => item.branchId === branch.id || (!item.branchId && item.branch === branch.name)).length,
    revenue: reportSales.filter(sale => sale.branchId === branch.id).reduce((sum, sale) => sum + sale.total, 0)
      + reportServiceTransactions.filter(row => row.branchId === branch.id).reduce((sum, row) => sum + (Number(row.amount) || 0), 0),
    service: serviceRecords.filter(ticket => ticket.branchId === branch.id && inRange(ticket.receivedDate)).length,
  })), [branchesList, reportPatients, reportAppointments, reportSales, reportServiceTransactions, serviceRecords, rangeBounds, matches]);
  const reportStock = stockList.filter(item => matches(item.branch, item.branchId));
  const reportSuppliers = suppliersList;

  const applyReportPeriod = (period: string) => {
    if (period === 'Özel') { setShowDateModal(true); return; }
    const now = new Date();
    const start = new Date(now);
    const end = new Date(now);
    if (period === 'Bu Yıl') { start.setMonth(0, 1); end.setMonth(11, 31); }
    else if (period === 'Bu Ay') { start.setDate(1); end.setMonth(end.getMonth() + 1, 0); }
    else if (period === 'Son 6 Ay') start.setMonth(start.getMonth() - 5, 1);
    else if (period === 'Tüm Zamanlar') { start.setFullYear(2000, 0, 1); }
    setSelectedPeriod(period);
    setDateRange(`${formatRangeDate(start)} - ${formatRangeDate(end)}`);
  };

  const subTabs = [
    'Genel Bakış',
    'Finansal Raporlar',
    'Satış Raporları',
    'Hasta Analizleri',
    'Randevu Raporları',
    'Teknik Servis',
    'Stok & Envanter',
    'Tedarikçi Raporları',
    'Özel Raporlar'
  ];

  const handleExportReport = async (format: string) => {
    try {
      const rows = [
        ['Rapor', 'Değer'], ['Tarih aralığı', dateRange], ['Ciro (₺)', String(dynamicTotalRevenue)],
        ['Gider (₺)', String(dynamicTotalExpenses)], ['Net (₺)', String(dynamicNetProfit)],
        ['Hasta', String(dynamicPatientCount)], ['Randevu', String(dynamicAppointmentCount)],
        ['Satılan cihaz', String(dynamicDeviceSalesCount)], ['Teknik servis geliri (₺)', String(dynamicServiceRevenue)],
        ...branchPerformance.map(branch => [`Şube: ${branch.branch}`, `Hasta ${branch.patients}; randevu ${branch.appointments}; ciro ${branch.revenue} TL`]),
      ];
      const safeName = `rapor-${new Date().toISOString().slice(0, 10)}`;
      let blob: Blob;
      let extension: string;
      if (format === 'CSV') {
        const csv = rows.map(row => row.map(value => `"${String(value).replaceAll('"', '""')}"`).join(';')).join('\r\n');
        blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' });
        extension = 'csv';
      } else if (format === 'Excel (XLSX)') {
        const ExcelJS = (await import('exceljs')).default;
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Rapor');
        worksheet.addRows(rows);
        worksheet.columns = [{ width: 32 }, { width: 72 }];
        const data = await workbook.xlsx.writeBuffer();
        blob = new Blob([data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        extension = 'xlsx';
      } else {
        const popup = window.open('', '_blank');
        if (!popup) throw new Error('PDF çıktısı için açılır pencereye izin verin.');
        popup.document.write(`<html lang="tr"><head><title>İşitme Merkezi Raporu</title><meta charset="utf-8"><style>body{font:14px Arial,sans-serif;padding:32px;color:#152b2a}h1{font-size:22px}table{border-collapse:collapse;width:100%}td{padding:9px;border-bottom:1px solid #ddd}td:first-child{font-weight:bold;width:35%}</style></head><body><h1>Raporlama & Analitik</h1><p>${dateRange}</p><table>${rows.slice(2).map(row => `<tr><td>${row[0]}</td><td>${row[1]}</td></tr>`).join('')}</table><script>window.onload=()=>window.print()</script></body></html>`);
        popup.document.close();
        addToast({ type: 'success', message: 'Yazdır penceresi açıldı; hedef olarak PDF seçebilirsiniz.' });
        setShowExportModal(false);
        return;
      }
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a'); link.href = url; link.download = `${safeName}.${extension}`; link.click();
      URL.revokeObjectURL(url);
      addToast({ type: 'success', message: `${extension.toUpperCase()} raporu indirildi.` });
      setShowExportModal(false);
    } catch {
      addToast({ type: 'error', message: 'Rapor dışa aktarılamadı. Lütfen tekrar deneyin.' });
    }
  };

  return (
    <div className={styles.reportsPage}>
      {/* ── Breadcrumb ── */}
      <div className={styles.breadcrumb}>
        <span>Raporlar</span>
        <span>&gt;</span>
        <span style={{ color: '#334155', fontWeight: 500 }}>Raporlama & Analitik</span>
      </div>

      {/* ── Page Heading ── */}
      <div className={styles.pageHeading}>
        <div className={styles.headingCopy}>
          <div className={styles.headingIcon}>
            {/* Analytics chart icon */}
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
              <line x1="8" y1="21" x2="16" y2="21"></line>
              <line x1="12" y1="17" x2="12" y2="21"></line>
              <path d="M7 11l3-3 2 2 4-4"></path>
            </svg>
          </div>
          <div>
            <h1>Raporlama & Analitik</h1>
            <p>Sistem verilerinize dayalı gerçek zamanlı CRM, finans ve operasyonel analizler.</p>
          </div>
        </div>

        <div className={styles.headerActions}>
          <div className={styles.dateFilterBox} onClick={() => setShowDateModal(true)}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
              <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
            <span>{dateRange}</span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2">
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </div>

          <button
            type="button"
            className={styles.btnSecondaryAction}
            onClick={() => setShowCompareModal(true)}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="7" height="9"></rect>
              <rect x="14" y="3" width="7" height="5"></rect>
              <rect x="14" y="12" width="7" height="9"></rect>
              <rect x="3" y="16" width="7" height="5"></rect>
            </svg>
            Karşılaştır
          </button>

          <button
            type="button"
            className={styles.btnPrimaryAction}
            onClick={() => setShowExportModal(true)}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7 10 12 15 17 10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
            Rapor İndir
          </button>
        </div>
      </div>

      {/* ── 5 Stat Cards Grid in 1 Row ── */}
      <div className={styles.statsGrid5}>
        {/* Card 1 */}
        <div className={styles.statCard}>
          <div className={`${styles.statIconBox} ${styles.statIconBoxGreen}`}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 3v18h18"></path>
              <path d="M18 9l-5 5-4-4-3 3"></path>
            </svg>
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statLabel}>Toplam Ciro</span>
            <span className={styles.statValue}>₺{dynamicTotalRevenue.toLocaleString('tr-TR')}</span>
            <div className={styles.statTrend}>
              <span className={styles.trendMuted}>{percentageChange(dynamicTotalRevenue, previousRevenue)}</span>
              <span className={styles.trendMuted}>önceki eşit döneme göre</span>
            </div>
          </div>
        </div>

        {/* Card 2 */}
        <div className={styles.statCard}>
          <div className={`${styles.statIconBox} ${styles.statIconBoxBlue}`}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statLabel}>Toplam Hasta</span>
            <span className={styles.statValue}>{dynamicPatientCount}</span>
            <div className={styles.statTrend}>
              <span className={styles.trendMuted}>{percentageChange(dynamicPatientCount, previousPatientCount)}</span>
              <span className={styles.trendMuted}>önceki eşit döneme göre</span>
            </div>
          </div>
        </div>

        {/* Card 3 */}
        <div className={styles.statCard}>
          <div className={`${styles.statIconBox} ${styles.statIconBoxOrange}`}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
              <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statLabel}>Toplam Randevu</span>
            <span className={styles.statValue}>{dynamicAppointmentCount}</span>
            <div className={styles.statTrend}>
              <span className={styles.trendMuted}>{percentageChange(dynamicAppointmentCount, previousAppointments.length)}</span>
              <span className={styles.trendMuted}>önceki eşit döneme göre</span>
            </div>
          </div>
        </div>

        {/* Card 4 */}
        <div className={styles.statCard}>
          <div className={`${styles.statIconBox} ${styles.statIconBoxPurple}`}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="9" cy="21" r="1"></circle>
              <circle cx="20" cy="21" r="1"></circle>
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
            </svg>
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statLabel}>Cihaz Satışı</span>
            <span className={styles.statValue}>{dynamicDeviceSalesCount}</span>
            <div className={styles.statTrend}>
              <span className={styles.trendMuted}>{percentageChange(dynamicDeviceSalesCount, previousDeviceCount)}</span>
              <span className={styles.trendMuted}>önceki eşit döneme göre</span>
            </div>
          </div>
        </div>

        {/* Card 5 */}
        <div className={styles.statCard}>
          <div className={`${styles.statIconBox} ${styles.statIconBoxRed}`}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path>
            </svg>
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statLabel}>Teknik Servis Geliri</span>
            <span className={styles.statValue}>₺{dynamicServiceRevenue.toLocaleString('tr-TR')}</span>
            <div className={styles.statTrend}>
              <span className={styles.trendMuted}>{percentageChange(dynamicServiceRevenue, previousServiceRevenue)}</span>
              <span className={styles.trendMuted}>önceki eşit döneme göre</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Sub-Tabs Navigation Pills ── */}
      <div className={styles.subTabsRow}>
        {subTabs.map(tab => (
          <button
            key={tab}
            type="button"
            className={`${styles.subTabBtn} ${activeTab === tab ? styles.subTabBtnActive : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab === 'Genel Bakış' && (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="7" height="7"></rect>
                <rect x="14" y="3" width="7" height="7"></rect>
                <rect x="14" y="14" width="7" height="7"></rect>
                <rect x="3" y="14" width="7" height="7"></rect>
              </svg>
            )}
            {tab === 'Finansal Raporlar' && '💳 '}
            {tab === 'Satış Raporları' && '📈 '}
            {tab === 'Hasta Analizleri' && '👥 '}
            {tab === 'Randevu Raporları' && '📅 '}
            {tab === 'Teknik Servis' && '🔧 '}
            {tab === 'Stok & Envanter' && '📦 '}
            {tab === 'Tedarikçi Raporları' && '🚚 '}
            {tab === 'Özel Raporlar' && '⚙️ '}
            {tab}
          </button>
        ))}
      </div>

      {/* ── ROW 1: Aylık Ciro Trendi (Left) & Gelir Dağılımı (Right) ── */}
      <div className={styles.row1Grid} style={{ display: ['Genel Bakış', 'Finansal Raporlar', 'Satış Raporları'].includes(activeTab) ? undefined : 'none' }}>
        {/* Left: Aylık Ciro Trendi */}
        <div className={styles.analyticsCard}>
          <div className={styles.cardHeaderRow}>
            <div className={styles.cardTitleWrap}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0d9488" strokeWidth="2">
                <path d="M3 3v18h18"></path>
                <path d="M18 9l-5 5-4-4-3 3"></path>
              </svg>
              <h3>{chartTitle} ({reportYear})</h3>
            </div>
            <div className={styles.cardControls}>
              <select
                className={styles.miniSelect}
                value={chartMetric}
                onChange={e => setChartMetric(e.target.value)}
              >
                <option value="Ciro">Ciro</option>
                <option value="Satış Adedi">Satış Adedi</option>
                <option value="Karlılık">Karlılık</option>
              </select>
              <button type="button" className={styles.btnMiniIcon} title={showMonthlyTable ? 'Grafik Görünümü' : 'Tablo Görünümü'} aria-label={showMonthlyTable ? 'Grafik görünümüne geç' : 'Tablo görünümüne geç'} aria-pressed={showMonthlyTable} onClick={() => setShowMonthlyTable(value => !value)}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="20" x2="18" y2="10"></line>
                  <line x1="12" y1="20" x2="12" y2="4"></line>
                  <line x1="6" y1="20" x2="6" y2="14"></line>
                </svg>
              </button>
            </div>
          </div>

          {showMonthlyTable ? <div style={{ overflowX: 'auto' }}><table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead><tr><th style={{ padding: 10 }}>Ay</th><th style={{ padding: 10 }}>{chartTitle}</th></tr></thead>
            <tbody>{monthlyData.map(item => <tr key={item.month} style={{ borderTop: '1px solid #e2e8f0' }}><td style={{ padding: 10 }}>{item.month} {reportYear}</td><td style={{ padding: 10 }}>{chartUnit === '₺' ? formatCurrency(item.value) : `${item.value.toLocaleString('tr-TR')} adet`}</td></tr>)}</tbody>
          </table></div> : <div className={styles.barChartContainer}>
            {/* Y Axis Ticks */}
            <div className={styles.chartAxisY}>
              {chartTickValues.map((tick, index) => <span key={index}>{chartUnit === '₺' ? formatCurrency(tick) : `${tick} adet`}</span>)}
            </div>

            {/* Horizontal Grid lines */}
            <div className={styles.chartGridLines}>
              <div className={styles.gridLine}></div>
              <div className={styles.gridLine}></div>
              <div className={styles.gridLine}></div>
              <div className={styles.gridLine}></div>
              <div className={styles.gridLine}></div>
              <div className={styles.gridLine}></div>
            </div>

            {/* Bars Area */}
            <div className={styles.barsArea}>
              {monthlyData.map(item => {
                const isHovered = hoveredMonth === item.month;
                return (
                  <div
                    key={item.month}
                    className={styles.barCol}
                    onMouseEnter={() => setHoveredMonth(item.month)}
                    onMouseLeave={() => setHoveredMonth('Eyl')}
                  >
                    {isHovered && (
                      <div className={styles.tooltipBubble}>
                        <div className={styles.tooltipBubbleTitle}>{item.month} {reportYear}</div>
                        <div className={styles.tooltipBubbleVal}>{chartUnit === '₺' ? formatCurrency(item.value) : `${item.value.toLocaleString('tr-TR')} adet`}</div>
                      </div>
                    )}
                    <div className={styles.barTrack}>
                      <div
                        className={`${styles.barFill} ${item.isCurrent ? styles.barFillHighlight : ''}`}
                        style={{ height: `${item.heightPct}%` }}
                      ></div>
                    </div>
                    <span className={`${styles.barMonthLabel} ${item.isCurrent ? styles.barMonthLabelActive : ''}`}>
                      {item.month}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>}
        </div>

        {/* Right: Gelir Dağılımı Donut */}
        <div className={styles.analyticsCard}>
          <div className={styles.cardHeaderRow}>
            <div className={styles.cardTitleWrap}>
              <h3>Gelir Dağılımı</h3>
            </div>
            <div className={styles.cardControls}>
              <select className={styles.miniSelect} value={selectedPeriod} onChange={e => applyReportPeriod(e.target.value)}>
                <option value="Bu Yıl">Bu Yıl</option>
                <option value="Son 6 Ay">Son 6 Ay</option>
                <option value="Bu Ay">Bu Ay</option>
                <option value="Özel">Özel</option>
              </select>
            </div>
          </div>

          <div className={styles.donutWithLegend}>
            <SvgDonut
              size={154}
              strokeWidth={22}
              slices={revenueDistributionSlices}
              centerValue={formatCurrency(dynamicTotalRevenue)}
              centerLabel="Toplam Ciro"
            />

            <div className={styles.legendList}>
              {revenueDistributionSlices.length ? revenueDistributionSlices.map(slice => <div className={styles.legendItem} key={slice.label}>
                <div className={styles.legendLabelWrap}><span className={styles.legendColorDot} style={{ background: slice.color }}></span><span>{slice.label}</span></div>
                <div className={styles.legendNumbers}><span className={styles.legendPct}>%{dynamicTotalRevenue ? Math.round(slice.value / dynamicTotalRevenue * 100) : 0}</span><span className={styles.legendAmount}>{formatCurrency(slice.value)}</span></div>
              </div>) : <div className={styles.emptyState}>Bu tarih aralığında gelir kaydı yok.</div>}
            </div>
          </div>
        </div>
      </div>

      {/* ── ROW 2: 3 Analysis Donut Cards ── */}
      <div className={styles.row2Grid} style={{ display: ['Genel Bakış', 'Hasta Analizleri', 'Randevu Raporları', 'Teknik Servis'].includes(activeTab) ? undefined : 'none' }}>
        {/* Card 1: Hasta Kaynak Dağılımı */}
        <div className={styles.analyticsCard}>
          <div className={styles.cardHeaderRow}>
            <div className={styles.cardTitleWrap}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0284c7" strokeWidth="2">
                <path d="M3 21h18"></path>
                <path d="M3 7v1a3 3 0 0 0 6 0V7m0 1a3 3 0 0 0 6 0V7m0 1a3 3 0 0 0 6 0V7H3"></path>
                <path d="M19 21v-7a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v7"></path>
              </svg>
              <h3>Hasta Kaynak Dağılımı</h3>
            </div>
            <div className={styles.cardControls}>
              <select className={styles.miniSelect} value={selectedPeriod} onChange={e => applyReportPeriod(e.target.value)}>
                <option value="Bu Yıl">Bu Yıl</option>
                <option value="Bu Ay">Bu Ay</option>
                <option value="Özel">Özel</option>
              </select>
            </div>
          </div>

          <div className={styles.miniDonutWithLegend}>
            <SvgDonut
              size={120}
              strokeWidth={18}
              slices={reportSourceRows}
              centerValue={reportPatients.length}
              centerLabel="Toplam Hasta"
            />

            <div className={styles.legendList} style={{ gap: 6 }}>
              {reportSourceRows.map(item => (
                <div key={item.label} className={styles.legendItem}>
                  <div className={styles.legendLabelWrap}>
                    <span className={styles.legendColorDot} style={{ background: item.color }}></span>
                    <span style={{ fontSize: 11 }}>{item.label}</span>
                  </div>
                  <div className={styles.legendNumbers} style={{ gap: 8 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#0f172a' }}>{item.value}</span>
                    <span className={styles.legendPct} style={{ fontSize: 10 }}>%{reportPatients.length ? Math.round(item.value / reportPatients.length * 100) : 0}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Card 2: Randevu Durumu */}
        <div className={styles.analyticsCard}>
          <div className={styles.cardHeaderRow}>
            <div className={styles.cardTitleWrap}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
              </svg>
              <h3>Randevu Durumu</h3>
            </div>
            <div className={styles.cardControls}>
              <select className={styles.miniSelect} value={selectedPeriod} onChange={e => applyReportPeriod(e.target.value)}>
                <option value="Bu Yıl">Bu Yıl</option>
                <option value="Bu Ay">Bu Ay</option>
                <option value="Özel">Özel</option>
              </select>
            </div>
          </div>

          <div className={styles.miniDonutWithLegend}>
            <SvgDonut
              size={120}
              strokeWidth={18}
              slices={reportAppointmentRows}
              centerValue={reportAppointments.length}
              centerLabel="Toplam Randevu"
            />

            <div className={styles.legendList} style={{ gap: 6 }}>
              {reportAppointmentRows.map(item => (
                <div key={item.label} className={styles.legendItem}>
                  <div className={styles.legendLabelWrap}>
                    <span className={styles.legendColorDot} style={{ background: item.color }}></span>
                    <span style={{ fontSize: 11 }}>{item.label}</span>
                  </div>
                  <div className={styles.legendNumbers} style={{ gap: 8 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#0f172a' }}>{item.value}</span>
                    <span className={styles.legendPct} style={{ fontSize: 10 }}>%{reportAppointments.length ? Math.round(item.value / reportAppointments.length * 100) : 0}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Card 3: Teknik Servis Durumu */}
        <div className={styles.analyticsCard}>
          <div className={styles.cardHeaderRow}>
            <div className={styles.cardTitleWrap}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ea580c" strokeWidth="2">
                <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path>
              </svg>
              <h3>Teknik Servis Durumu</h3>
            </div>
            <div className={styles.cardControls}>
              <select className={styles.miniSelect} value={selectedPeriod} onChange={e => applyReportPeriod(e.target.value)}>
                <option value="Bu Yıl">Bu Yıl</option>
                <option value="Bu Ay">Bu Ay</option>
                <option value="Özel">Özel</option>
              </select>
            </div>
          </div>

          <div className={styles.miniDonutWithLegend}>
            <SvgDonut
              size={120}
              strokeWidth={18}
              slices={reportServiceRows}
              centerValue={reportServiceRows.reduce((sum, item) => sum + item.value, 0)}
              centerLabel="Toplam Servis"
            />

            <div className={styles.legendList} style={{ gap: 6 }}>
              {reportServiceRows.map(item => (
                <div key={item.label} className={styles.legendItem}>
                  <div className={styles.legendLabelWrap}>
                    <span className={styles.legendColorDot} style={{ background: item.color }}></span>
                    <span style={{ fontSize: 11 }}>{item.label}</span>
                  </div>
                  <div className={styles.legendNumbers} style={{ gap: 8 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#0f172a' }}>{item.value}</span>
                    <span className={styles.legendPct} style={{ fontSize: 10 }}>%{reportServiceRows.length ? Math.round(item.value / reportServiceRows.reduce((sum, row) => sum + row.value, 0) * 100) : 0}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── ROW 3: 2 Performance Tables Grid ── */}
      <div className={styles.row3Grid} style={{ display: ['Genel Bakış', 'Satış Raporları', 'Finansal Raporlar'].includes(activeTab) ? undefined : 'none' }}>
        {/* Left: En Çok Satılan Cihazlar */}
        <div className={styles.analyticsCard}>
          <div className={styles.cardHeaderRow}>
            <div className={styles.cardTitleWrap}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0d9488" strokeWidth="2">
                <line x1="18" y1="20" x2="18" y2="10"></line>
                <line x1="12" y1="20" x2="12" y2="4"></line>
                <line x1="6" y1="20" x2="6" y2="14"></line>
              </svg>
              <h3>En Çok Satılan Cihazlar</h3>
            </div>
            <div className={styles.cardControls}>
              <select className={styles.miniSelect} value={selectedPeriod} onChange={e => applyReportPeriod(e.target.value)}>
                <option value="Bu Yıl">Bu Yıl</option>
                <option value="Son 6 Ay">Son 6 Ay</option>
                <option value="Bu Ay">Bu Ay</option>
                <option value="Özel">Özel</option>
              </select>
            </div>
          </div>

          <table className={styles.perfTable}>
            <thead>
              <tr>
                <th style={{ width: 30 }}>#</th>
                <th>CİHAZ ADI</th>
                <th style={{ textAlign: 'center' }}>SATIŞ ADEDİ</th>
                <th style={{ textAlign: 'right' }}>CİRO</th>
                <th style={{ textAlign: 'right' }}>ORAN</th>
              </tr>
            </thead>
            <tbody>
              {topDevices.map(device => (
                <tr key={device.rank}>
                  <td style={{ color: '#64748b', fontWeight: 600 }}>{device.rank}</td>
                  <td style={{ fontWeight: 600, color: '#0f172a' }}>{device.name}</td>
                  <td style={{ textAlign: 'center' }}>{device.salesCount}</td>
                  <td style={{ textAlign: 'right', fontWeight: 600 }}>₺{device.revenue.toLocaleString('tr-TR')}</td>
                  <td style={{ textAlign: 'right' }}>
                    <div className={styles.progressBarTrack}>
                      <div className={styles.progressBarFill} style={{ width: `${device.ratio * 2.5}%` }}></div>
                    </div>
                    <span style={{ fontSize: 11, color: '#64748b' }}>%{device.ratio}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Right: Şube Bazlı Performans */}
        <div className={styles.analyticsCard}>
          <div className={styles.cardHeaderRow}>
            <div className={styles.cardTitleWrap}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                <polyline points="9 22 9 12 15 12 15 22"></polyline>
              </svg>
              <h3>Şube Bazlı Performans</h3>
            </div>
            <div className={styles.cardControls}>
              <select className={styles.miniSelect} value={selectedPeriod} onChange={e => applyReportPeriod(e.target.value)}>
                <option value="Bu Yıl">Bu Yıl</option>
                <option value="Son 6 Ay">Son 6 Ay</option>
                <option value="Bu Ay">Bu Ay</option>
                <option value="Özel">Özel</option>
              </select>
            </div>
          </div>

          <table className={styles.perfTable}>
            <thead>
              <tr>
                <th>ŞUBE</th>
                <th style={{ textAlign: 'center' }}>HASTA SAYISI</th>
                <th style={{ textAlign: 'center' }}>RANDEVU</th>
                <th style={{ textAlign: 'right' }}>CİRO</th>
                <th style={{ textAlign: 'center' }}>TEKNİK SERVİS</th>
              </tr>
            </thead>
            <tbody>
              {branchPerformance.map(b => (
                <tr key={b.branch}>
                  <td style={{ fontWeight: 600, color: '#0f172a' }}>{b.branch}</td>
                  <td style={{ textAlign: 'center' }}>{b.patients}</td>
                  <td style={{ textAlign: 'center' }}>{b.appointments}</td>
                  <td style={{ textAlign: 'right', fontWeight: 600 }}>₺{b.revenue.toLocaleString('tr-TR')}</td>
                  <td style={{ textAlign: 'center' }}>{b.service}</td>
                </tr>
              ))}
              <tr className={styles.tableTotalRow}>
                <td>Toplam</td>
                <td style={{ textAlign: 'center' }}>{branchPerformance.reduce((sum, branch) => sum + branch.patients, 0)}</td>
                <td style={{ textAlign: 'center' }}>{branchPerformance.reduce((sum, branch) => sum + branch.appointments, 0)}</td>
                <td style={{ textAlign: 'right' }}>{formatCurrency(branchPerformance.reduce((sum, branch) => sum + branch.revenue, 0))}</td>
                <td style={{ textAlign: 'center' }}>{branchPerformance.reduce((sum, branch) => sum + branch.service, 0)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {activeTab === 'Stok & Envanter' && <section className={styles.analyticsCard}>
        <h3>Şube kapsamındaki stok özeti</h3>
        <p>Ürün: {reportStock.length} · Birim: {reportStock.reduce((sum, item) => sum + item.quantity, 0)} · Kritik seviye: {reportStock.filter(item => item.quantity <= item.criticalLevel).length}</p>
        <table className={styles.perfTable}><thead><tr><th>ÜRÜN</th><th>ŞUBE</th><th style={{ textAlign: 'right' }}>ADET</th><th>DURUM</th></tr></thead><tbody>
          {reportStock.map(item => <tr key={item.id}><td>{item.name}</td><td>{item.branch}</td><td style={{ textAlign: 'right' }}>{item.quantity}</td><td>{item.quantity <= item.criticalLevel ? 'Kritik' : 'Normal'}</td></tr>)}
          {reportStock.length === 0 && <tr><td colSpan={4}>Bu kapsamda stok kaydı bulunmuyor.</td></tr>}
        </tbody></table>
      </section>}
      {activeTab === 'Tedarikçi Raporları' && <section className={styles.analyticsCard}>
        <h3>Şube kapsamındaki tedarikçiler</h3>
        <p>{reportSuppliers.length} tedarikçi kaydı</p>
        <table className={styles.perfTable}><thead><tr><th>TEDARİKÇİ</th><th>İLETİŞİM</th><th>ŞUBE</th></tr></thead><tbody>
          {reportSuppliers.map(item => <tr key={item.id}><td>{item.companyName}</td><td>{item.phone || item.email || '—'}</td><td>Firma geneli</td></tr>)}
          {reportSuppliers.length === 0 && <tr><td colSpan={3}>Firma kapsamında tedarikçi kaydı bulunmuyor.</td></tr>}
        </tbody></table>
      </section>}
      {activeTab === 'Özel Raporlar' && <section className={styles.analyticsCard}><h3>Özel rapor tanımı</h3><p>Bu hesapta özel rapor tanımı bulunmuyor. Sonuç üretiyormuş gibi görünen demo metrikleri gösterilmiyor.</p></section>}

      {/* ── MODAL 1: Karşılaştır Modalı ── */}
      {showCompareModal && (
        <div className={styles.modalOverlay} onClick={() => setShowCompareModal(false)}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>📊 Dönemsel Karşılaştırma Analizi</h2>
              <button type="button" className={styles.modalCloseBtn} onClick={() => setShowCompareModal(false)}>✕</button>
            </div>
            <div className={styles.modalBody}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                <div style={{ background: '#f8fafc', padding: 12, borderRadius: 8 }}>
                  <div style={{ fontSize: 11, color: '#64748b' }}>A Dönemi (Mevcut)</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>{rangeBounds.start || '—'} – {rangeBounds.end || '—'}</div>
                </div>
                <div style={{ background: '#f8fafc', padding: 12, borderRadius: 8 }}>
                  <div style={{ fontSize: 11, color: '#64748b' }}>B Dönemi (Geçmiş)</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>{previousRangeBounds.start || '—'} – {previousRangeBounds.end || '—'}</div>
                </div>
              </div>

              <table className={styles.perfTable}>
                <thead>
                  <tr>
                    <th>METRİK</th>
                    <th style={{ textAlign: 'right' }}>Mevcut dönem</th>
                    <th style={{ textAlign: 'right' }}>Önceki dönem</th>
                    <th style={{ textAlign: 'right' }}>DEĞİŞİM</th>
                  </tr>
                </thead>
                <tbody>
                  {compareRows.map(row => <tr key={row.label}>
                    <td style={{ fontWeight: 600 }}>{row.label}</td>
                    <td style={{ textAlign: 'right', fontWeight: 600 }}>{row.format(row.current)}</td>
                    <td style={{ textAlign: 'right' }}>{row.format(row.previous)}</td>
                    <td style={{ textAlign: 'right', color: '#64748b', fontWeight: 700 }}>{percentageChange(row.current, row.previous)}</td>
                  </tr>)}
                </tbody>
              </table>
            </div>
            <div className={styles.modalFooter}>
              <button type="button" className={styles.btnSecondaryAction} onClick={() => setShowCompareModal(false)}>Kapat</button>
              <button
                type="button"
                className={styles.btnPrimaryAction}
                onClick={() => {
                  const rows = [['Metrik', 'Mevcut dönem', 'Önceki dönem', 'Değişim'], ...compareRows.map(row => [row.label, row.format(row.current), row.format(row.previous), percentageChange(row.current, row.previous)])];
                  const csv = rows.map(row => row.map(value => `"${String(value).replaceAll('"', '""')}"`).join(';')).join('\n');
                  const url = URL.createObjectURL(new Blob(['\\uFEFF', csv], { type: 'text/csv;charset=utf-8' }));
                  const link = document.createElement('a'); link.href = url; link.download = 'donemsel-karsilastirma.csv'; link.click(); URL.revokeObjectURL(url);
                  addToast({ type: 'success', message: 'Dönem karşılaştırması CSV olarak indirildi.' });
                  setShowCompareModal(false);
                }}
              >
                Karşılaştırmayı İndir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL 2: Rapor İndir Modalı ── */}
      {showExportModal && (
        <div className={styles.modalOverlay} onClick={() => setShowExportModal(false)}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()} style={{ maxWidth: 480 }}>
            <div className={styles.modalHeader}>
              <h2>📥 Analitik Raporu İndir</h2>
              <button type="button" className={styles.modalCloseBtn} onClick={() => setShowExportModal(false)}>✕</button>
            </div>
            <div className={styles.modalBody}>
              <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>
                {dateRange} aralığındaki tüm CRM, finans ve şube performans verilerini istediğiniz formatta dışa aktarın:
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 10 }}>
                <button
                  type="button"
                  className={styles.btnSecondaryAction}
                  style={{ justifyContent: 'space-between', padding: '12px 16px' }}
                  onClick={() => handleExportReport('PDF')}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 18 }}>📕</span>
                    <strong>PDF Yönetici Sunumu</strong>
                  </div>
                  <span style={{ color: '#0d9488', fontSize: 12 }}>İndir</span>
                </button>

                <button
                  type="button"
                  className={styles.btnSecondaryAction}
                  style={{ justifyContent: 'space-between', padding: '12px 16px' }}
                  onClick={() => handleExportReport('Excel (XLSX)')}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 18 }}>📗</span>
                    <strong>Excel Tablosu (.xlsx)</strong>
                  </div>
                  <span style={{ color: '#0d9488', fontSize: 12 }}>İndir</span>
                </button>

                <button
                  type="button"
                  className={styles.btnSecondaryAction}
                  style={{ justifyContent: 'space-between', padding: '12px 16px' }}
                  onClick={() => handleExportReport('CSV')}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 18 }}>📄</span>
                    <strong>Ham Veri (.csv)</strong>
                  </div>
                  <span style={{ color: '#0d9488', fontSize: 12 }}>İndir</span>
                </button>
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button type="button" className={styles.btnSecondaryAction} onClick={() => setShowExportModal(false)}>Kapat</button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL 3: Tarih Aralığı Seçici ── */}
      {showDateModal && (
        <div className={styles.modalOverlay} onClick={() => setShowDateModal(false)}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()} style={{ maxWidth: 420 }}>
            <div className={styles.modalHeader}>
              <h2>📅 Tarih Aralığı Seç</h2>
              <button type="button" className={styles.modalCloseBtn} onClick={() => setShowDateModal(false)}>✕</button>
            </div>
            <div className={styles.modalBody}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {(() => {
                  const now = new Date();
                  const day = new Date(now); day.setHours(0, 0, 0, 0);
                  const week = new Date(day); week.setDate(week.getDate() - 6);
                  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
                  const threeMonths = new Date(now.getFullYear(), now.getMonth() - 2, 1);
                  const yearStart = new Date(now.getFullYear(), 0, 1);
                  const lastYearStart = new Date(now.getFullYear() - 1, 0, 1);
                  const lastYearEnd = new Date(now.getFullYear() - 1, 11, 31);
                  return [
                    { label: 'Bugün', val: `${formatRangeDate(day)} - ${formatRangeDate(day)}` },
                    { label: 'Son 7 Gün', val: `${formatRangeDate(week)} - ${formatRangeDate(day)}` },
                    { label: 'Bu Ay', val: `${formatRangeDate(monthStart)} - ${formatRangeDate(day)}` },
                    { label: 'Son 3 Ay', val: `${formatRangeDate(threeMonths)} - ${formatRangeDate(day)}` },
                    { label: `Bu Yıl (${now.getFullYear()})`, val: `${formatRangeDate(yearStart)} - ${formatRangeDate(day)}` },
                    { label: `Geçen Yıl (${now.getFullYear() - 1})`, val: `${formatRangeDate(lastYearStart)} - ${formatRangeDate(lastYearEnd)}` }
                  ];
                })().map(opt => (
                  <button
                    key={opt.label}
                    type="button"
                    className={styles.btnSecondaryAction}
                    style={{ fontSize: 12, padding: '10px 8px' }}
                    onClick={() => {
                      setDateRange(opt.val);
                      setSelectedPeriod('Özel');
                      setShowDateModal(false);
                      addToast({ type: 'info', message: `Tarih aralığı: ${opt.label} olarak seçildi.` });
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button type="button" className={styles.btnSecondaryAction} onClick={() => setShowDateModal(false)}>İptal</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
