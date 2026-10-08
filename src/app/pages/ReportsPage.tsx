'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { useBranchScope } from '../hooks/useBranchScope';
import { formatCurrency } from '../data/mockData';
import styles from './ReportsPage.module.css';
import { createReportPdf, buildPdfReportLines } from '../lib/reportPdf';
import { createReportWorkbook, type ReportExportData } from '../lib/reportExcel';
import { generateCsvContent } from '../lib/reportCsv';
import { downloadFile } from '../lib/downloadFile';
import { fetchServiceTickets, type ServiceRecord } from '../repositories/ServiceTicketRepository';
import { dbFetchCashTransactions } from '../lib/database';

let cachedExcelJS: typeof import('exceljs') | null = null;
const getExcelJS = async () => {
  if (!cachedExcelJS) {
    const mod = await import('exceljs');
    cachedExcelJS = (mod.default || mod) as unknown as typeof import('exceljs');
  }
  return cachedExcelJS;
};

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
const formatIsoToDisplay = (isoStr?: string) => {
  if (!isoStr) return '—';
  const match = isoStr.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return isoStr;
  return `${match[3]}.${match[2]}.${match[1]}`;
};

export type CardPeriodType = 'Genel Dönem' | 'Bu Yıl' | 'Son 6 Ay' | 'Bu Ay' | 'Özel';

export interface CardFilterState {
  period: CardPeriodType;
  startDate: string;
  endDate: string;
}

const defaultCardFilter = (): CardFilterState => ({
  period: 'Genel Dönem',
  startDate: '',
  endDate: '',
});

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

  // Modals state
  const [showCompareModal, setShowCompareModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showDateModal, setShowDateModal] = useState(false);

  const [customStartDate, setCustomStartDate] = useState(() => {
    const [start] = dateRange.split(' - ').map(dateKey);
    return start || `${new Date().getFullYear()}-01-01`;
  });
  const [customEndDate, setCustomEndDate] = useState(() => {
    const [, end] = dateRange.split(' - ').map(dateKey);
    return end || `${new Date().getFullYear()}-12-31`;
  });

  useEffect(() => {
    if (showDateModal) {
      if (rangeBounds.start) setCustomStartDate(rangeBounds.start);
      if (rangeBounds.end) setCustomEndDate(rangeBounds.end);
    }
  }, [showDateModal, rangeBounds.start, rangeBounds.end]);

  // Comparison period states
  const [compareAStart, setCompareAStart] = useState(() => {
    const [start] = dateRange.split(' - ').map(dateKey);
    return start || `${new Date().getFullYear()}-01-01`;
  });
  const [compareAEnd, setCompareAEnd] = useState(() => {
    const [, end] = dateRange.split(' - ').map(dateKey);
    return end || `${new Date().getFullYear()}-12-31`;
  });
  const [compareBStart, setCompareBStart] = useState(() => {
    const y = new Date().getFullYear() - 1;
    return `${y}-01-01`;
  });
  const [compareBEnd, setCompareBEnd] = useState(() => {
    const y = new Date().getFullYear() - 1;
    return `${y}-12-31`;
  });

  useEffect(() => {
    if (showCompareModal) {
      if (rangeBounds.start) setCompareAStart(rangeBounds.start);
      if (rangeBounds.end) setCompareAEnd(rangeBounds.end);
      if (previousRangeBounds.start) setCompareBStart(previousRangeBounds.start);
      if (previousRangeBounds.end) setCompareBEnd(previousRangeBounds.end);
    }
  }, [showCompareModal]);

  // Card-specific filter states for individual analytics cards
  const [patientSourceFilter, setPatientSourceFilter] = useState<CardFilterState>(defaultCardFilter);
  const [appointmentFilter, setAppointmentFilter] = useState<CardFilterState>(defaultCardFilter);
  const [serviceFilter, setServiceFilter] = useState<CardFilterState>(defaultCardFilter);
  const [topDevicesFilter, setTopDevicesFilter] = useState<CardFilterState>(defaultCardFilter);
  const [branchPerfFilter, setBranchPerfFilter] = useState<CardFilterState>(defaultCardFilter);
  const [revenueDistFilter, setRevenueDistFilter] = useState<CardFilterState>(defaultCardFilter);

  const [cardDateModal, setCardDateModal] = useState<{
    isOpen: boolean;
    cardId: 'patientSource' | 'appointment' | 'service' | 'topDevices' | 'branchPerf' | 'revenueDist';
    cardTitle: string;
    startDate: string;
    endDate: string;
  }>({
    isOpen: false,
    cardId: 'patientSource',
    cardTitle: '',
    startDate: '',
    endDate: '',
  });

  const getCardBounds = (filter: CardFilterState) => {
    if (filter.period === 'Bu Yıl') {
      const y = new Date().getFullYear();
      return { start: `${y}-01-01`, end: `${y}-12-31` };
    }
    if (filter.period === 'Bu Ay') {
      const now = new Date();
      const y = now.getFullYear();
      const m = String(now.getMonth() + 1).padStart(2, '0');
      const lastDay = new Date(y, now.getMonth() + 1, 0).getDate();
      return { start: `${y}-${m}-01`, end: `${y}-${m}-${String(lastDay).padStart(2, '0')}` };
    }
    if (filter.period === 'Son 6 Ay') {
      const now = new Date();
      const end = now.toISOString().slice(0, 10);
      const startObj = new Date(now);
      startObj.setMonth(startObj.getMonth() - 5, 1);
      const start = startObj.toISOString().slice(0, 10);
      return { start, end };
    }
    if (filter.period === 'Özel' && filter.startDate && filter.endDate) {
      return { start: filter.startDate, end: filter.endDate };
    }
    return { start: rangeBounds.start || '', end: rangeBounds.end || '' };
  };

  const isDateInBounds = (val?: string, bounds?: { start?: string; end?: string }) => {
    const k = dateKey(val);
    return Boolean(k && (!bounds?.start || k >= bounds.start) && (!bounds?.end || k <= bounds.end));
  };

  const openCardDateModal = (
    cardId: 'patientSource' | 'appointment' | 'service' | 'topDevices' | 'branchPerf' | 'revenueDist',
    cardTitle: string
  ) => {
    let current = defaultCardFilter();
    if (cardId === 'patientSource') current = patientSourceFilter;
    else if (cardId === 'appointment') current = appointmentFilter;
    else if (cardId === 'service') current = serviceFilter;
    else if (cardId === 'topDevices') current = topDevicesFilter;
    else if (cardId === 'branchPerf') current = branchPerfFilter;
    else if (cardId === 'revenueDist') current = revenueDistFilter;

    const effective = getCardBounds(current);
    setCardDateModal({
      isOpen: true,
      cardId,
      cardTitle,
      startDate: current.startDate || effective.start || `${new Date().getFullYear()}-01-01`,
      endDate: current.endDate || effective.end || `${new Date().getFullYear()}-12-31`,
    });
  };

  const handleCardPeriodChange = (
    cardId: 'patientSource' | 'appointment' | 'service' | 'topDevices' | 'branchPerf' | 'revenueDist',
    cardTitle: string,
    newPeriod: string
  ) => {
    if (newPeriod === 'Özel') {
      openCardDateModal(cardId, cardTitle);
      return;
    }

    const updated: CardFilterState = {
      period: newPeriod as CardPeriodType,
      startDate: '',
      endDate: '',
    };

    if (cardId === 'patientSource') setPatientSourceFilter(updated);
    else if (cardId === 'appointment') setAppointmentFilter(updated);
    else if (cardId === 'service') setServiceFilter(updated);
    else if (cardId === 'topDevices') setTopDevicesFilter(updated);
    else if (cardId === 'branchPerf') setBranchPerfFilter(updated);
    else if (cardId === 'revenueDist') setRevenueDistFilter(updated);

    addToast({ type: 'info', message: `${cardTitle}: "${newPeriod}" filtresi uygulandı.` });
  };

  const handleApplyCardCustomDate = () => {
    if (!cardDateModal.startDate || !cardDateModal.endDate) {
      addToast({ type: 'error', message: 'Lütfen hem başlangıç hem de bitiş tarihini seçin.' });
      return;
    }
    let s = cardDateModal.startDate;
    let e = cardDateModal.endDate;
    if (s > e) [s, e] = [e, s];

    const updated: CardFilterState = {
      period: 'Özel',
      startDate: s,
      endDate: e,
    };

    const id = cardDateModal.cardId;
    if (id === 'patientSource') setPatientSourceFilter(updated);
    else if (id === 'appointment') setAppointmentFilter(updated);
    else if (id === 'service') setServiceFilter(updated);
    else if (id === 'topDevices') setTopDevicesFilter(updated);
    else if (id === 'branchPerf') setBranchPerfFilter(updated);
    else if (id === 'revenueDist') setRevenueDistFilter(updated);

    addToast({ type: 'success', message: `${cardDateModal.cardTitle} için özel tarih uygulandı: ${formatIsoToDisplay(s)} – ${formatIsoToDisplay(e)}` });
    setCardDateModal(prev => ({ ...prev, isOpen: false }));
  };

  const handleResetCardToGlobal = () => {
    const updated: CardFilterState = {
      period: 'Genel Dönem',
      startDate: '',
      endDate: '',
    };

    const id = cardDateModal.cardId;
    if (id === 'patientSource') setPatientSourceFilter(updated);
    else if (id === 'appointment') setAppointmentFilter(updated);
    else if (id === 'service') setServiceFilter(updated);
    else if (id === 'topDevices') setTopDevicesFilter(updated);
    else if (id === 'branchPerf') setBranchPerfFilter(updated);
    else if (id === 'revenueDist') setRevenueDistFilter(updated);

    addToast({ type: 'info', message: `${cardDateModal.cardTitle} genel rapor dönemine sıfırlandı.` });
    setCardDateModal(prev => ({ ...prev, isOpen: false }));
  };

  const renderCardPeriodControl = (
    cardId: 'patientSource' | 'appointment' | 'service' | 'topDevices' | 'branchPerf' | 'revenueDist',
    cardTitle: string,
    filter: CardFilterState,
    allowSixMonths = false
  ) => {
    const isCustom = filter.period === 'Özel';
    const hasCustomDates = isCustom && filter.startDate && filter.endDate;
    const customLabel = hasCustomDates
      ? `Özel (${formatIsoToDisplay(filter.startDate)} - ${formatIsoToDisplay(filter.endDate)})`
      : 'Özel (Tarih Seç)...';

    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        {hasCustomDates && (
          <span
            title="Özel tarih aralığını düzenlemek için tıklayın"
            style={{
              fontSize: 10,
              padding: '2px 6px',
              borderRadius: 4,
              background: '#ccfbf1',
              color: '#0f766e',
              fontWeight: 700,
              cursor: 'pointer',
              border: '1px solid #99f6e4',
              whiteSpace: 'nowrap',
            }}
            onClick={() => openCardDateModal(cardId, cardTitle)}
          >
            {formatIsoToDisplay(filter.startDate)} – {formatIsoToDisplay(filter.endDate)}
          </span>
        )}
        <select
          className={styles.miniSelect}
          data-testid={`card-select-${cardId}`}
          aria-label={`${cardTitle} dönem seçimi`}
          value={filter.period}
          onChange={e => handleCardPeriodChange(cardId, cardTitle, e.target.value)}
          style={{
            borderColor: isCustom ? '#0d9488' : undefined,
            background: isCustom ? '#f0fdfa' : undefined,
            color: isCustom ? '#0f766e' : undefined,
            fontWeight: isCustom ? 600 : undefined,
          }}
        >
          <option value="Genel Dönem">Genel ({dateRange})</option>
          <option value="Bu Yıl">Bu Yıl</option>
          {allowSixMonths && <option value="Son 6 Ay">Son 6 Ay</option>}
          <option value="Bu Ay">Bu Ay</option>
          <option value="Özel">{customLabel}</option>
        </select>
        <button
          type="button"
          className={styles.btnMiniIcon}
          data-testid={`card-calendar-btn-${cardId}`}
          title={`${cardTitle} için özel tarih aralığı seç`}
          aria-label={`${cardTitle} için özel tarih aralığı seç`}
          onClick={() => openCardDateModal(cardId, cardTitle)}
          style={{
            background: isCustom ? '#0d9488' : undefined,
            color: isCustom ? '#ffffff' : undefined,
            borderColor: isCustom ? '#0d9488' : undefined,
          }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
        </button>
      </div>
    );
  };

  const handleApplyCustomDateRange = () => {
    if (!customStartDate || !customEndDate) {
      addToast({ type: 'error', message: 'Lütfen hem başlangıç hem de bitiş tarihini seçin.' });
      return;
    }
    let startIso = customStartDate;
    let endIso = customEndDate;
    if (startIso > endIso) {
      [startIso, endIso] = [endIso, startIso];
      setCustomStartDate(startIso);
      setCustomEndDate(endIso);
    }
    const [sy, sm, sd] = startIso.split('-');
    const [ey, em, ed] = endIso.split('-');
    const formattedRange = `${sd.padStart(2, '0')}.${sm.padStart(2, '0')}.${sy} - ${ed.padStart(2, '0')}.${em.padStart(2, '0')}.${ey}`;
    setDateRange(formattedRange);
    setSelectedPeriod('Özel');
    setShowDateModal(false);
    addToast({ type: 'success', message: `Tarih aralığı güncellendi: ${formattedRange}` });
  };
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

  // Dynamic Comparison Calculator for any two custom date ranges
  const calculateMetricsForRange = (startIso: string, endIso: string) => {
    const isWithin = (val?: string) => {
      const k = dateKey(val);
      return Boolean(k && (!startIso || k >= startIso) && (!endIso || k <= endIso));
    };

    const periodSales = scopedSales.filter(s => isWithin(s.date));
    const periodExpenses = scopedExpenses.filter(e => isWithin(e.date));
    const periodPatients = scopedPatients.filter(p => isWithin(p.createdAt));
    const periodAppointments = scopedAppointments.filter(a => isWithin(a.date));

    const periodServiceTx = reportCashTransactions.filter(row => row.type === 'INCOME'
      && row.referenceEntity === 'service'
      && matches(undefined, row.branchId)
      && isWithin(row.createdAt));

    const periodSalesServiceRevenue = periodSales.reduce((sum, sale) => sum + sale.items
      .filter(item => item.type === 'Servis Geliri')
      .reduce((lineSum, item) => lineSum + item.price * item.quantity, 0), 0);

    const serviceRevenue = periodSalesServiceRevenue + periodServiceTx.reduce((sum, row) => sum + (Number(row.amount) || 0), 0);
    const totalRevenue = periodSales.reduce((sum, sale) => sum + (sale.total || 0), 0)
      + periodServiceTx.reduce((sum, row) => sum + (Number(row.amount) || 0), 0);
    const totalExpenses = periodExpenses.reduce((sum, expense) => sum + (expense.amount || 0), 0);
    const netProfit = totalRevenue - totalExpenses;
    const patientCount = periodPatients.length;
    const appointmentCount = periodAppointments.length;
    const deviceSalesCount = periodSales.reduce((sum, sale) => sum + sale.items.filter(item => item.type === 'Cihaz').reduce((count, item) => count + item.quantity, 0), 0);

    return {
      totalRevenue,
      totalExpenses,
      netProfit,
      patientCount,
      appointmentCount,
      deviceSalesCount,
      serviceRevenue,
    };
  };

  const dynamicCompareRows = useMemo(() => {
    let aStart = compareAStart;
    let aEnd = compareAEnd;
    if (aStart && aEnd && aStart > aEnd) [aStart, aEnd] = [aEnd, aStart];

    let bStart = compareBStart;
    let bEnd = compareBEnd;
    if (bStart && bEnd && bStart > bEnd) [bStart, bEnd] = [bEnd, bStart];

    const a = calculateMetricsForRange(aStart, aEnd);
    const b = calculateMetricsForRange(bStart, bEnd);

    const computeChange = (current: number, previous: number) => {
      if (previous === 0) {
        if (current === 0) return 'Değişim yok';
        return '+%100 (Yeni)';
      }
      const pct = Math.round(((current - previous) / previous) * 100);
      return `${pct >= 0 ? '+' : ''}%${pct}`;
    };

    return [
      { label: 'Toplam Ciro', a: a.totalRevenue, b: b.totalRevenue, diff: a.totalRevenue - b.totalRevenue, change: computeChange(a.totalRevenue, b.totalRevenue), format: formatCurrency, higherIsBetter: true },
      { label: 'Toplam Gider', a: a.totalExpenses, b: b.totalExpenses, diff: a.totalExpenses - b.totalExpenses, change: computeChange(a.totalExpenses, b.totalExpenses), format: formatCurrency, higherIsBetter: false },
      { label: 'Net Faaliyet Kârı', a: a.netProfit, b: b.netProfit, diff: a.netProfit - b.netProfit, change: computeChange(a.netProfit, b.netProfit), format: formatCurrency, higherIsBetter: true },
      { label: 'Kayıtlı Hasta Sayısı', a: a.patientCount, b: b.patientCount, diff: a.patientCount - b.patientCount, change: computeChange(a.patientCount, b.patientCount), format: (v: number) => `${v} Hasta`, higherIsBetter: true },
      { label: 'Toplam Randevu', a: a.appointmentCount, b: b.appointmentCount, diff: a.appointmentCount - b.appointmentCount, change: computeChange(a.appointmentCount, b.appointmentCount), format: (v: number) => `${v} Randevu`, higherIsBetter: true },
      { label: 'Cihaz Satışı', a: a.deviceSalesCount, b: b.deviceSalesCount, diff: a.deviceSalesCount - b.deviceSalesCount, change: computeChange(a.deviceSalesCount, b.deviceSalesCount), format: (v: number) => `${v} Adet`, higherIsBetter: true },
      { label: 'Teknik Servis Geliri', a: a.serviceRevenue, b: b.serviceRevenue, diff: a.serviceRevenue - b.serviceRevenue, change: computeChange(a.serviceRevenue, b.serviceRevenue), format: formatCurrency, higherIsBetter: true },
    ];
  }, [compareAStart, compareAEnd, compareBStart, compareBEnd, scopedSales, scopedExpenses, scopedPatients, scopedAppointments, reportCashTransactions, matches]);

  const setComparePreset = (type: string) => {
    const now = new Date();
    if (type === 'year-vs-last-year') {
      const y = now.getFullYear();
      setCompareAStart(`${y}-01-01`);
      setCompareAEnd(`${y}-12-31`);
      setCompareBStart(`${y - 1}-01-01`);
      setCompareBEnd(`${y - 1}-12-31`);
    } else if (type === 'month-vs-last-month') {
      const y = now.getFullYear();
      const m = now.getMonth();
      const aStart = new Date(y, m, 1);
      const aEnd = new Date(y, m + 1, 0);
      const bStart = new Date(y, m - 1, 1);
      const bEnd = new Date(y, m, 0);
      setCompareAStart(aStart.toISOString().slice(0, 10));
      setCompareAEnd(aEnd.toISOString().slice(0, 10));
      setCompareBStart(bStart.toISOString().slice(0, 10));
      setCompareBEnd(bEnd.toISOString().slice(0, 10));
    } else if (type === 'last-30-days') {
      const aEnd = new Date(now);
      const aStart = new Date(now); aStart.setDate(aStart.getDate() - 29);
      const bEnd = new Date(aStart); bEnd.setDate(bEnd.getDate() - 1);
      const bStart = new Date(bEnd); bStart.setDate(bStart.getDate() - 29);
      setCompareAStart(aStart.toISOString().slice(0, 10));
      setCompareAEnd(aEnd.toISOString().slice(0, 10));
      setCompareBStart(bStart.toISOString().slice(0, 10));
      setCompareBEnd(bEnd.toISOString().slice(0, 10));
    } else if (type === 'last-3-months') {
      const aEnd = new Date(now);
      const aStart = new Date(now); aStart.setMonth(aStart.getMonth() - 3);
      const bEnd = new Date(aStart); bEnd.setDate(bEnd.getDate() - 1);
      const bStart = new Date(bEnd); bStart.setMonth(bStart.getMonth() - 3);
      setCompareAStart(aStart.toISOString().slice(0, 10));
      setCompareAEnd(aEnd.toISOString().slice(0, 10));
      setCompareBStart(bStart.toISOString().slice(0, 10));
      setCompareBEnd(bEnd.toISOString().slice(0, 10));
    }
  };

  const handleExportComparison = async (format: 'XLSX' | 'CSV') => {
    try {
      const dateStamp = new Date().toISOString().slice(0, 10);
      const aLabel = `${formatIsoToDisplay(compareAStart)} - ${formatIsoToDisplay(compareAEnd)}`;
      const bLabel = `${formatIsoToDisplay(compareBStart)} - ${formatIsoToDisplay(compareBEnd)}`;
      const rows = [
        ['Metrik', `A Dönemi (${aLabel})`, `B Dönemi (${bLabel})`, 'Net Fark', 'Değişim Oranı'],
        ...dynamicCompareRows.map(row => [
          row.label,
          row.format(row.a),
          row.format(row.b),
          row.diff >= 0 ? `+${row.format(row.diff)}` : `-${row.format(Math.abs(row.diff))}`,
          row.change
        ])
      ];

      if (format === 'CSV') {
        const headerLines = [
          `"AUDIPRO İŞİTME MERKEZİ - DÖNEMSEL KARŞILAŞTIRMA ANALİZİ";;;;`,
          `"A Dönemi: ${aLabel}";"B Dönemi: ${bLabel}";"Rapor Tarihi: ${new Date().toLocaleDateString('tr-TR')}";;`,
          ``
        ];
        const csvContent = headerLines.join('\r\n') + '\r\n' + rows.map(r => r.map(v => `"${String(v ?? '').replaceAll('"', '""')}"`).join(';')).join('\r\n');
        const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8' });
        downloadFile(blob, `AudiPro_Donemsel_Karsilastirma_${dateStamp}.csv`);
        addToast({ type: 'success', message: 'Karşılaştırma CSV tablosu (.csv) olarak başarıyla indirildi.' });
      } else {
        const ExcelJS = await getExcelJS();
        const workbook = new ExcelJS.Workbook();
        workbook.creator = 'AudiPro İşitme Merkezi';
        const worksheet = workbook.addWorksheet('Karşılaştırma');
        worksheet.columns = [
          { width: 28 }, // Metrik
          { width: 26 }, // A Dönemi
          { width: 26 }, // B Dönemi
          { width: 20 }, // Net Fark
          { width: 18 }, // Değişim Oranı
        ];

        // Header Title
        worksheet.mergeCells('A1:E1');
        const titleCell = worksheet.getCell('A1');
        titleCell.value = 'AUDIPRO İŞİTME MERKEZİ - DÖNEMSEL KARŞILAŞTIRMA ANALİZİ';
        titleCell.font = { bold: true, size: 13, color: { argb: 'FFFFFFFF' } };
        titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F766E' } };
        titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
        worksheet.getRow(1).height = 32;

        // Subtitle
        worksheet.mergeCells('A2:E2');
        const subCell = worksheet.getCell('A2');
        subCell.value = `A Dönemi: ${aLabel}   |   B Dönemi: ${bLabel}   |   Rapor Tarihi: ${new Date().toLocaleDateString('tr-TR')}`;
        subCell.font = { italic: true, size: 10, color: { argb: 'FF475569' } };
        subCell.alignment = { horizontal: 'center', vertical: 'middle' };
        worksheet.getRow(2).height = 22;

        worksheet.addRow([]); // empty row

        const headerRow = worksheet.addRow(['Metrik', `A Dönemi (${aLabel})`, `B Dönemi (${bLabel})`, 'Net Fark', 'Değişim Oranı']);
        headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF134E4A' } };
        headerRow.height = 26;

        dynamicCompareRows.forEach(row => {
          const dataRow = worksheet.addRow([
            row.label,
            row.format(row.a),
            row.format(row.b),
            row.diff >= 0 ? `+${row.format(row.diff)}` : `-${row.format(Math.abs(row.diff))}`,
            row.change
          ]);
          dataRow.getCell(1).font = { bold: true };
          [1, 2, 3, 4, 5].forEach(col => {
            dataRow.getCell(col).border = {
              top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
              left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
              bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
              right: { style: 'thin', color: { argb: 'FFE2E8F0' } }
            };
          });
        });

        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        downloadFile(blob, `AudiPro_Donemsel_Karsilastirma_${dateStamp}.xlsx`);
        addToast({ type: 'success', message: 'Karşılaştırma Excel tablosu (.xlsx) olarak başarıyla indirildi.' });
      }
      setShowCompareModal(false);
    } catch (err) {
      console.error('Karşılaştırma dışa aktarma hatası:', err);
      addToast({ type: 'error', message: 'Karşılaştırma raporu indirilemedi.' });
    }
  };
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

  // Gelir Dağılımı Donut Data (Card Filter Reactive)
  const revenueDistributionSlices: DonutSlice[] = useMemo(() => {
    const cardBounds = getCardBounds(revenueDistFilter);
    const cardSales = scopedSales.filter(sale => isDateInBounds(sale.date, cardBounds));
    const cardServiceTx = reportCashTransactions.filter(row => row.type === 'INCOME' && row.referenceEntity === 'service'
      && matches(undefined, row.branchId) && isDateInBounds(row.createdAt, cardBounds));
    const totals = new Map<string, number>();
    cardSales.forEach(sale => {
      const lineTotals = sale.items.map(item => Math.max(0, item.price * item.quantity));
      const lineTotal = lineTotals.reduce((sum, value) => sum + value, 0);
      sale.items.forEach((item, index) => {
        const label = item.type === 'Cihaz' ? 'Cihaz Satışı' : item.type === 'Aksesuar' || item.type === 'Pil' ? 'Aksesuar Satışı' : item.type === 'Servis Geliri' ? 'Teknik Servis' : 'Hizmet / Diğer';
        const allocated = lineTotal ? (sale.total * lineTotals[index]) / lineTotal : 0;
        totals.set(label, (totals.get(label) || 0) + allocated);
      });
    });
    cardServiceTx.forEach(row => {
      totals.set('Teknik Servis', (totals.get('Teknik Servis') || 0) + (Number(row.amount) || 0));
    });
    if (!totals.size) return [];
    if (cardServiceTx.length && !totals.has('Teknik Servis')) totals.set('Teknik Servis', cardServiceTx.reduce((sum, row) => sum + (Number(row.amount) || 0), 0));
    return [...totals].map(([label, value], index) => ({ label, value, color: REPORT_COLORS[index % REPORT_COLORS.length] }));
  }, [scopedSales, reportCashTransactions, revenueDistFilter, rangeBounds, matches]);

  const cardRevenueTotal = useMemo(() => {
    return revenueDistributionSlices.reduce((sum, s) => sum + s.value, 0);
  }, [revenueDistributionSlices]);

  // Hasta Kaynak Dağılımı (Card Filter Reactive)
  const cardPatientSourceData = useMemo(() => {
    const cardBounds = getCardBounds(patientSourceFilter);
    const cardPatients = scopedPatients.filter(patient => isDateInBounds(patient.createdAt, cardBounds));
    const totals = new Map<string, number>();
    cardPatients.forEach(patient => {
      const source = patient.source || 'Belirtilmemiş';
      totals.set(source, (totals.get(source) || 0) + 1);
    });
    const rows = [...totals].map(([label, value], index) => ({ label, value, color: REPORT_COLORS[index % REPORT_COLORS.length] }));
    return { patients: cardPatients, rows };
  }, [scopedPatients, patientSourceFilter, rangeBounds]);
  const reportSourceRows = cardPatientSourceData.rows;
  const cardPatientsCount = cardPatientSourceData.patients.length;

  // Randevu Durumu (Card Filter Reactive)
  const cardAppointmentData = useMemo(() => {
    const cardBounds = getCardBounds(appointmentFilter);
    const cardAppointments = scopedAppointments.filter(item => isDateInBounds(item.date, cardBounds));
    const totals = new Map<string, number>();
    cardAppointments.forEach(item => totals.set(item.status, (totals.get(item.status) || 0) + 1));
    const rows = [...totals].map(([label, value], index) => ({ label, value, color: REPORT_COLORS[index % REPORT_COLORS.length] }));

    const start = cardBounds.start ? new Date(`${cardBounds.start}T00:00:00`) : null;
    const end = cardBounds.end ? new Date(`${cardBounds.end}T00:00:00`) : null;
    const spanDays = start && end ? Math.max(1, Math.round((end.getTime() - start.getTime()) / 86400000) + 1) : 0;
    const monthly = spanDays > 62;
    const trendTotals = new Map<string, number>();
    cardAppointments.forEach(appointment => {
      const key = dateKey(appointment.date);
      if (!key) return;
      const group = monthly ? key.slice(0, 7) : key;
      trendTotals.set(group, (trendTotals.get(group) || 0) + 1);
    });
    const groups = [...trendTotals].sort(([left], [right]) => left.localeCompare(right));
    const maximum = Math.max(1, ...groups.map(([, value]) => value));
    const trend = groups.map(([key, value]) => ({
      key,
      value,
      label: monthly
        ? new Intl.DateTimeFormat('tr-TR', { month: 'short', year: '2-digit' }).format(new Date(`${key}-01T12:00:00`))
        : new Intl.DateTimeFormat('tr-TR', { day: '2-digit', month: 'short' }).format(new Date(`${key}T12:00:00`)),
      height: Math.max(4, value / maximum * 100),
    }));

    return { appointments: cardAppointments, rows, trend };
  }, [scopedAppointments, appointmentFilter, rangeBounds]);
  const reportAppointmentRows = cardAppointmentData.rows;
  const appointmentTrend = cardAppointmentData.trend;
  const cardAppointmentsCount = cardAppointmentData.appointments.length;

  // Teknik Servis Durumu (Card Filter Reactive)
  const cardServiceData = useMemo(() => {
    const cardBounds = getCardBounds(serviceFilter);
    const cardTickets = serviceRecords.filter(item => matches(undefined, item.branchId) && isDateInBounds(item.receivedDate, cardBounds));
    const totals = new Map<string, number>();
    cardTickets.forEach(item => totals.set(item.status, (totals.get(item.status) || 0) + 1));
    const rows = [...totals].map(([label, value], index) => ({ label, value, color: REPORT_COLORS[index % REPORT_COLORS.length] }));
    return { tickets: cardTickets, rows, totalCount: cardTickets.length };
  }, [serviceRecords, serviceFilter, rangeBounds, matches]);
  const reportServiceRows = cardServiceData.rows;
  const cardServiceCount = cardServiceData.totalCount;

  // En Çok Satılan Cihazlar (Card Filter Reactive)
  const topDevices = useMemo(() => {
    const cardBounds = getCardBounds(topDevicesFilter);
    const cardSales = scopedSales.filter(sale => isDateInBounds(sale.date, cardBounds));
    const totals = new Map<string, { salesCount: number; revenue: number }>();
    cardSales.forEach(sale => sale.items.filter(item => item.type === 'Cihaz').forEach(item => {
      const current = totals.get(item.name) || { salesCount: 0, revenue: 0 };
      current.salesCount += item.quantity;
      current.revenue += item.price * item.quantity;
      totals.set(item.name, current);
    }));
    const rows = [...totals].map(([name, value]) => ({ name, ...value })).sort((a, b) => b.salesCount - a.salesCount);
    const total = rows.reduce((sum, row) => sum + row.salesCount, 0) || 1;
    return rows.slice(0, 5).map((row, index) => ({ ...row, rank: index + 1, ratio: Math.round(row.salesCount / total * 100) }));
  }, [scopedSales, topDevicesFilter, rangeBounds]);

  // Şube Bazlı Performans (Card Filter Reactive)
  const cardBranchPerformance = useMemo(() => {
    const cardBounds = getCardBounds(branchPerfFilter);
    const activeBranches = branchesList.filter(branch => matches(branch.name, branch.id));
    const targetBranches = activeBranches.length > 0 ? activeBranches : branchesList;

    const cardSales = scopedSales.filter(sale => isDateInBounds(sale.date, cardBounds));
    const cardPatients = scopedPatients.filter(patient => isDateInBounds(patient.createdAt, cardBounds));
    const cardAppointments = scopedAppointments.filter(appointment => isDateInBounds(appointment.date, cardBounds));
    const cardServiceTickets = serviceRecords.filter(ticket => isDateInBounds(ticket.receivedDate, cardBounds));
    const cardServiceTx = reportCashTransactions.filter(row => row.type === 'INCOME' && row.referenceEntity === 'service'
      && matches(undefined, row.branchId) && isDateInBounds(row.createdAt, cardBounds));

    const branchRevMap = new Map<string, number>();
    targetBranches.forEach(b => branchRevMap.set(b.id, 0));

    cardSales.forEach(sale => {
      let bId = sale.branchId;
      if (!bId && (sale as any).branch) {
        bId = targetBranches.find(b => b.name === (sale as any).branch)?.id;
      }
      if (!bId && sale.patientId) {
        const p = patientsList.find(pt => pt.id === sale.patientId);
        if (p?.branchId) bId = p.branchId;
        else if (p?.branch) bId = targetBranches.find(b => b.name === p.branch)?.id;
      }
      if (!bId && targetBranches.length > 0) {
        bId = targetBranches[0].id;
      }
      if (bId) {
        branchRevMap.set(bId, (branchRevMap.get(bId) || 0) + (sale.total || 0));
      }
    });

    cardServiceTx.forEach(row => {
      let bId = row.branchId;
      if (!bId && row.branch) {
        bId = targetBranches.find(b => b.name === row.branch)?.id;
      }
      if (!bId && targetBranches.length > 0) {
        bId = targetBranches[0].id;
      }
      if (bId) {
        branchRevMap.set(bId, (branchRevMap.get(bId) || 0) + (Number(row.amount) || 0));
      }
    });

    const cardTotalRevenue = cardSales.reduce((sum, sale) => sum + (sale.total || 0), 0)
      + cardServiceTx.reduce((sum, row) => sum + (Number(row.amount) || 0), 0);
    const sumRev = Array.from(branchRevMap.values()).reduce((a, b) => a + b, 0);
    if (sumRev === 0 && cardTotalRevenue > 0 && targetBranches.length > 0) {
      branchRevMap.set(targetBranches[0].id, cardTotalRevenue);
    }

    const rows = targetBranches.map(branch => ({
      branch: branch.name,
      patients: cardPatients.filter(patient => matches(patient.branch, patient.branchId) && (patient.branchId === branch.id || (!patient.branchId && (patient.branch === branch.name || targetBranches.length === 1)))).length,
      appointments: cardAppointments.filter(item => item.branchId === branch.id || (!item.branchId && (item.branch === branch.name || targetBranches.length === 1))).length,
      revenue: branchRevMap.get(branch.id) || 0,
      service: cardServiceTickets.filter(ticket => (ticket.branchId === branch.id || (!ticket.branchId && ((ticket as any).branch === branch.name || targetBranches.length === 1)))).length,
    }));

    return {
      rows,
      totalPatients: cardPatients.length,
      totalAppointments: cardAppointments.length,
      totalRevenue: cardTotalRevenue,
      totalService: cardServiceTickets.length,
    };
  }, [branchesList, scopedPatients, scopedAppointments, scopedSales, reportCashTransactions, serviceRecords, patientsList, branchPerfFilter, rangeBounds, matches]);
  const branchPerformance = cardBranchPerformance.rows;
  const reportStock = stockList.filter(item => matches(item.branch, item.branchId));
  const reportSuppliers = suppliersList;

  const applyReportPeriod = (period: string) => {
    if (period === 'Özel') {
      setSelectedPeriod('Özel');
      setShowDateModal(true);
      return;
    }
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

  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    // Pre-warm ExcelJS in background so click gesture is preserved when exporting
    getExcelJS().catch(() => {});
  }, []);



  const handleExportReport = async (format: string) => {
    setIsExporting(true);
    try {
      const activeBranchName = branchesList.find(b => matches(b.name, b.id))?.name;
      const exportData: ReportExportData = {
        clinicName: 'AudiPro İşitme Merkezi',
        dateRange,
        generatedAt: new Date().toLocaleString('tr-TR', { dateStyle: 'short', timeStyle: 'short' }),
        branchName: activeBranchName || 'Tüm Şubeler',
        kpis: {
          totalRevenue: dynamicTotalRevenue,
          totalExpenses: dynamicTotalExpenses,
          netProfit: dynamicNetProfit,
          patientCount: dynamicPatientCount,
          appointmentCount: dynamicAppointmentCount,
          deviceSalesCount: dynamicDeviceSalesCount,
          serviceRevenue: dynamicServiceRevenue,
        },
        branchPerformance: branchPerformance.map(b => ({
          branch: b.branch,
          patients: b.patients,
          appointments: b.appointments,
          revenue: b.revenue,
        })),
        revenueDistribution: revenueDistributionSlices.map(s => ({
          label: s.label,
          value: s.value,
        })),
        sales: reportSales.map(s => ({
          date: s.date,
          patientName: s.patientName || 'İsimsiz Hasta',
          branchName: branchesList.find(b => b.id === s.branchId)?.name || 'Merkez',
          itemsSummary: s.items.map(i => `${i.name}${i.quantity > 1 ? ` x${i.quantity}` : ''}`).join(', ') || 'Cihaz / Hizmet',
          total: s.total || 0,
          sgkAmount: s.sgkAmount || 0,
          patientAmount: s.patientAmount || s.total,
          paymentMethod: s.paymentMethod || 'Nakit',
          status: s.status || 'Tahsil Edildi',
        })),
        expenses: reportExpenses.map(e => ({
          date: e.date,
          category: e.category,
          description: e.description,
          branchName: branchesList.find(b => b.id === e.branchId)?.name || e.branch || 'Merkez',
          amount: e.amount || 0,
          paymentMethod: e.paymentMethod || 'Nakit',
          receiptNo: e.receiptNo || '-',
        })),
        appointments: reportAppointments.map(a => ({
          date: a.date,
          time: a.time,
          patientName: a.patientName || 'İsimsiz',
          branchName: a.branch || branchesList.find(b => b.id === a.branchId)?.name || 'Merkez',
          type: a.type,
          audiologist: a.audiologist || '-',
          status: a.status,
          notes: a.notes || '-',
        })),
        serviceTickets: serviceRecords
          .filter(item => matches(undefined, item.branchId) && inRange(item.receivedDate))
          .map(t => ({
            receivedDate: t.receivedDate || '-',
            patientName: t.patientName || 'İsimsiz',
            branchName: branchesList.find(b => b.id === t.branchId)?.name || 'Merkez',
            device: `${t.deviceName || 'Cihaz'}`,
            serialNo: t.serialNo || '-',
            complaint: t.problem || (t.complaints ? t.complaints.join(', ') : '-'),
            fee: t.totalCost || 0,
            status: t.status,
            technician: t.technician || '-',
          })),
        patients: reportPatients.map(p => ({
          createdAt: p.createdAt || '-',
          name: `${p.firstName || ''} ${p.lastName || ''}`.trim() || 'İsimsiz',
          phone: p.phone || '-',
          branchName: p.branch || branchesList.find(b => b.id === p.branchId)?.name || 'Merkez',
          source: p.source || '-',
          hearingLoss: p.hearingLoss || '-',
          sgkStatus: p.sgkStatus || '-',
        })),
      };

      const dateStamp = new Date().toISOString().slice(0, 10);
      const safeName = `AudiPro_Yonetim_Raporu_${dateStamp}`;
      let blob: Blob;
      let extension: string;
      const normalizedFormat = (format || '').toUpperCase();

      if (normalizedFormat.includes('CSV')) {
        const csv = generateCsvContent(exportData);
        blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
        extension = 'csv';
      } else if (normalizedFormat.includes('EXCEL') || normalizedFormat.includes('XLSX')) {
        const ExcelJS = await getExcelJS();
        blob = await createReportWorkbook(exportData, ExcelJS);
        extension = 'xlsx';
      } else {
        const pdfLines = buildPdfReportLines(exportData);
        blob = createReportPdf(pdfLines);
        extension = 'pdf';
      }

      downloadFile(blob, `${safeName}.${extension}`);
      addToast({ type: 'success', message: `${extension.toUpperCase()} raporu başarıyla indirildi.` });
      setShowExportModal(false);
    } catch (err) {
      console.error('Rapor dışa aktarma hatası:', err);
      addToast({ type: 'error', message: 'Rapor dışa aktarılamadı. Lütfen tekrar deneyin.' });
    } finally {
      setIsExporting(false);
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
              {renderCardPeriodControl('revenueDist', 'Gelir Dağılımı', revenueDistFilter, true)}
            </div>
          </div>

          <div className={styles.donutWithLegend}>
            <SvgDonut
              size={154}
              strokeWidth={22}
              slices={revenueDistributionSlices}
              centerValue={formatCurrency(revenueDistFilter.period === 'Genel Dönem' ? dynamicTotalRevenue : cardRevenueTotal)}
              centerLabel="Toplam Ciro"
            />

            <div className={styles.legendList}>
              {revenueDistributionSlices.length ? revenueDistributionSlices.map(slice => <div className={styles.legendItem} key={slice.label}>
                <div className={styles.legendLabelWrap}><span className={styles.legendColorDot} style={{ background: slice.color }}></span><span>{slice.label}</span></div>
                <div className={styles.legendNumbers}>
                  <span className={styles.legendPct}>%{(revenueDistFilter.period === 'Genel Dönem' ? dynamicTotalRevenue : cardRevenueTotal) ? Math.round(slice.value / (revenueDistFilter.period === 'Genel Dönem' ? dynamicTotalRevenue : cardRevenueTotal) * 100) : 0}</span>
                  <span className={styles.legendAmount}>{formatCurrency(slice.value)}</span>
                </div>
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
              {renderCardPeriodControl('patientSource', 'Hasta Kaynak Dağılımı', patientSourceFilter)}
            </div>
          </div>

          <div className={styles.miniDonutWithLegend}>
            <SvgDonut
              size={120}
              strokeWidth={18}
              slices={reportSourceRows}
              centerValue={cardPatientsCount}
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
                    <span className={styles.legendPct} style={{ fontSize: 10 }}>%{cardPatientsCount ? Math.round(item.value / cardPatientsCount * 100) : 0}</span>
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
              {renderCardPeriodControl('appointment', 'Randevu Durumu', appointmentFilter)}
            </div>
          </div>

          <div className={styles.miniDonutWithLegend}>
            <SvgDonut
              size={120}
              strokeWidth={18}
              slices={reportAppointmentRows}
              centerValue={cardAppointmentsCount}
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
                    <span className={styles.legendPct} style={{ fontSize: 10 }}>%{cardAppointmentsCount ? Math.round(item.value / cardAppointmentsCount * 100) : 0}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <section aria-label="Randevu Trendleri" style={{ marginTop: 18, paddingTop: 14, borderTop: '1px solid #e2e8f0' }}>
            <h4 style={{ margin: '0 0 12px', fontSize: 13, color: '#13232c' }}>Randevu Trendi</h4>
            {appointmentTrend.length ? <div role="img" aria-label={`Randevu trendi: ${appointmentTrend.map(point => `${point.label} ${point.value}`).join(', ')}`} style={{ height: 132, display: 'flex', alignItems: 'end', gap: 8, overflowX: 'auto', padding: '0 2px 2px', borderBottom: '1px solid #cbd5e1' }}>
              {appointmentTrend.map(point => <div key={point.key} title={`${point.label}: ${point.value} randevu`} style={{ minWidth: 32, flex: '1 0 32px', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'end', alignItems: 'center', gap: 5 }}>
                <span style={{ fontSize: 10, color: '#334155', fontWeight: 650 }}>{point.value}</span>
                <div aria-hidden="true" style={{ width: 'min(28px, 80%)', height: `${point.height}%`, minHeight: 4, borderRadius: '5px 5px 0 0', background: '#0d9488' }} />
                <span style={{ fontSize: 9, color: '#64748b', whiteSpace: 'nowrap' }}>{point.label}</span>
              </div>)}
            </div> : <p style={{ margin: 0, color: '#64748b', fontSize: 12 }}>Seçili tarih aralığında randevu trendi için veri yok.</p>}
          </section>
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
              {renderCardPeriodControl('service', 'Teknik Servis Durumu', serviceFilter)}
            </div>
          </div>

          <div className={styles.miniDonutWithLegend}>
            <SvgDonut
              size={120}
              strokeWidth={18}
              slices={reportServiceRows}
              centerValue={cardServiceCount}
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
                    <span className={styles.legendPct} style={{ fontSize: 10 }}>%{cardServiceCount ? Math.round(item.value / cardServiceCount * 100) : 0}</span>
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
              {renderCardPeriodControl('topDevices', 'En Çok Satılan Cihazlar', topDevicesFilter, true)}
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
              {renderCardPeriodControl('branchPerf', 'Şube Bazlı Performans', branchPerfFilter, true)}
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
                <td style={{ textAlign: 'center' }}>{cardBranchPerformance.totalPatients}</td>
                <td style={{ textAlign: 'center' }}>{cardBranchPerformance.totalAppointments}</td>
                <td style={{ textAlign: 'right' }}>{formatCurrency(cardBranchPerformance.totalRevenue)}</td>
                <td style={{ textAlign: 'center' }}>{cardBranchPerformance.totalService}</td>
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
          <div className={styles.modalContent} onClick={e => e.stopPropagation()} style={{ maxWidth: 680 }}>
            <div className={styles.modalHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 20 }}>📊</span>
                <div>
                  <h2 style={{ margin: 0, fontSize: 16 }}>Dönemsel Karşılaştırma Analizi</h2>
                  <div style={{ fontSize: 11, color: '#64748b' }}>İki bağımsız tarih aralığını karşılaştırın ve analizi dışa aktarın</div>
                </div>
              </div>
              <button type="button" className={styles.modalCloseBtn} onClick={() => setShowCompareModal(false)}>✕</button>
            </div>
            <div className={styles.modalBody} style={{ padding: '16px 20px', maxHeight: 'calc(90vh - 130px)', overflowY: 'auto' }}>
              {/* Hızlı Karşılaştırma Şablonları */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 14, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#475569' }}>Hızlı Kıyaslama:</span>
                <button
                  type="button"
                  className={styles.btnSecondaryAction}
                  style={{ fontSize: 11, padding: '4px 10px', minHeight: 28, height: 28 }}
                  onClick={() => setComparePreset('year-vs-last-year')}
                >
                  Bu Yıl vs Geçen Yıl
                </button>
                <button
                  type="button"
                  className={styles.btnSecondaryAction}
                  style={{ fontSize: 11, padding: '4px 10px', minHeight: 28, height: 28 }}
                  onClick={() => setComparePreset('month-vs-last-month')}
                >
                  Bu Ay vs Geçen Ay
                </button>
                <button
                  type="button"
                  className={styles.btnSecondaryAction}
                  style={{ fontSize: 11, padding: '4px 10px', minHeight: 28, height: 28 }}
                  onClick={() => setComparePreset('last-30-days')}
                >
                  Son 30 Gün vs Önceki 30 Gün
                </button>
                <button
                  type="button"
                  className={styles.btnSecondaryAction}
                  style={{ fontSize: 11, padding: '4px 10px', minHeight: 28, height: 28 }}
                  onClick={() => setComparePreset('last-3-months')}
                >
                  Son 3 Ay vs Önceki 3 Ay
                </button>
              </div>

              {/* İki Dönem Seçici Kartları */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                {/* A Dönemi */}
                <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '12px 14px', borderRadius: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#166534' }}>🅰️ A Dönemi (Hedef)</span>
                    <span style={{ fontSize: 10, color: '#15803d', fontWeight: 600 }}>{formatIsoToDisplay(compareAStart)} – {formatIsoToDisplay(compareAEnd)}</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    <div>
                      <span style={{ fontSize: 10, color: '#166534', display: 'block', marginBottom: 3, fontWeight: 600 }}>Başlangıç</span>
                      <input
                        type="date"
                        data-testid="compare-a-start-date"
                        className={styles.customDateInput}
                        style={{ height: 34, fontSize: 12, background: '#ffffff', borderColor: '#86efac' }}
                        value={compareAStart}
                        onChange={e => setCompareAStart(e.target.value)}
                      />
                    </div>
                    <div>
                      <span style={{ fontSize: 10, color: '#166534', display: 'block', marginBottom: 3, fontWeight: 600 }}>Bitiş</span>
                      <input
                        type="date"
                        data-testid="compare-a-end-date"
                        className={styles.customDateInput}
                        style={{ height: 34, fontSize: 12, background: '#ffffff', borderColor: '#86efac' }}
                        value={compareAEnd}
                        onChange={e => setCompareAEnd(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                {/* B Dönemi */}
                <div style={{ background: '#f8fafc', border: '1px solid #cbd5e1', padding: '12px 14px', borderRadius: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#334155' }}>🅱️ B Dönemi (Kıyas)</span>
                    <span style={{ fontSize: 10, color: '#64748b', fontWeight: 600 }}>{formatIsoToDisplay(compareBStart)} – {formatIsoToDisplay(compareBEnd)}</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    <div>
                      <span style={{ fontSize: 10, color: '#475569', display: 'block', marginBottom: 3, fontWeight: 600 }}>Başlangıç</span>
                      <input
                        type="date"
                        data-testid="compare-b-start-date"
                        className={styles.customDateInput}
                        style={{ height: 34, fontSize: 12, background: '#ffffff' }}
                        value={compareBStart}
                        onChange={e => setCompareBStart(e.target.value)}
                      />
                    </div>
                    <div>
                      <span style={{ fontSize: 10, color: '#475569', display: 'block', marginBottom: 3, fontWeight: 600 }}>Bitiş</span>
                      <input
                        type="date"
                        data-testid="compare-b-end-date"
                        className={styles.customDateInput}
                        style={{ height: 34, fontSize: 12, background: '#ffffff' }}
                        value={compareBEnd}
                        onChange={e => setCompareBEnd(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Karşılaştırma Tablosu */}
              <div style={{ border: '1px solid var(--rep-border)', borderRadius: 10, overflow: 'hidden' }}>
                <table className={styles.perfTable} style={{ margin: 0 }}>
                  <thead>
                    <tr style={{ background: '#f8fafc' }}>
                      <th style={{ padding: '10px 12px' }}>METRİK</th>
                      <th style={{ textAlign: 'right', padding: '10px 12px', color: '#166534' }}>A DÖNEMİ</th>
                      <th style={{ textAlign: 'right', padding: '10px 12px', color: '#475569' }}>B DÖNEMİ</th>
                      <th style={{ textAlign: 'right', padding: '10px 12px' }}>FARK</th>
                      <th style={{ textAlign: 'right', padding: '10px 12px' }}>DEĞİŞİM</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dynamicCompareRows.map(row => {
                      const isPositive = row.diff > 0;
                      const isNegative = row.diff < 0;
                      const badgeColor = row.higherIsBetter
                        ? (isPositive ? '#166534' : isNegative ? '#991b1b' : '#64748b')
                        : (isPositive ? '#991b1b' : isNegative ? '#166534' : '#64748b');
                      const badgeBg = row.higherIsBetter
                        ? (isPositive ? '#dcfce7' : isNegative ? '#fee2e2' : '#f1f5f9')
                        : (isPositive ? '#fee2e2' : isNegative ? '#dcfce7' : '#f1f5f9');

                      return (
                        <tr key={row.label}>
                          <td style={{ fontWeight: 600, padding: '10px 12px', color: '#0f172a' }}>{row.label}</td>
                          <td style={{ textAlign: 'right', fontWeight: 700, padding: '10px 12px', color: '#166534' }}>
                            {row.format(row.a)}
                          </td>
                          <td style={{ textAlign: 'right', padding: '10px 12px', color: '#475569' }}>
                            {row.format(row.b)}
                          </td>
                          <td style={{ textAlign: 'right', padding: '10px 12px', fontWeight: 600, color: row.diff >= 0 ? '#0f766e' : '#e11d48' }}>
                            {row.diff >= 0 ? `+${row.format(row.diff)}` : `-${row.format(Math.abs(row.diff))}`}
                          </td>
                          <td style={{ textAlign: 'right', padding: '10px 12px' }}>
                            <span style={{
                              display: 'inline-block',
                              padding: '2px 8px',
                              borderRadius: 6,
                              fontSize: 11,
                              fontWeight: 700,
                              background: badgeBg,
                              color: badgeColor
                            }}>
                              {row.change}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
            <div className={styles.modalFooter} style={{ justifyContent: 'space-between', padding: '12px 20px', borderTop: '1px solid var(--rep-border)', background: '#f8fafc' }}>
              <button type="button" className={styles.btnSecondaryAction} onClick={() => setShowCompareModal(false)}>Kapat</button>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  type="button"
                  data-testid="download-compare-csv"
                  className={styles.btnSecondaryAction}
                  style={{ gap: 6 }}
                  onClick={() => handleExportComparison('CSV')}
                >
                  <span>📄</span> Ham Veri (.csv)
                </button>
                <button
                  type="button"
                  data-testid="download-compare-excel"
                  className={styles.btnPrimaryAction}
                  style={{ gap: 6 }}
                  onClick={() => handleExportComparison('XLSX')}
                >
                  <span>📗</span> Karşılaştırmayı İndir (.xlsx)
                </button>
              </div>
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
                <a
                  href={`/api/reports/download?format=pdf&range=${encodeURIComponent(dateRange)}&branch=${encodeURIComponent(branchesList.find(b => matches(b.name, b.id))?.name || 'Tüm Şubeler')}`}
                  download={`AudiPro_Yonetim_Raporu_${new Date().toISOString().slice(0, 10)}.pdf`}
                  data-testid="download-report-pdf"
                  className={styles.btnSecondaryAction}
                  aria-label="PDF Yönetici Sunumu İndir"
                  role="button"
                  style={{ justifyContent: 'space-between', padding: '12px 16px', textDecoration: 'none', color: 'inherit' }}
                  onClick={() => {
                    addToast({ type: 'success', message: 'PDF raporu indirildi.' });
                    setShowExportModal(false);
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 18 }}>📕</span>
                    <div style={{ textAlign: 'left' }}>
                      <strong>PDF Yönetici Raporu (.pdf)</strong>
                      <div style={{ fontSize: 11, color: '#64748b' }}>Yönetim sunumu, KPI ve operasyonel özet</div>
                    </div>
                  </div>
                  <span style={{ color: '#0d9488', fontSize: 12, fontWeight: 600 }}>İndir</span>
                </a>

                <a
                  href={`/api/reports/download?format=xlsx&range=${encodeURIComponent(dateRange)}&branch=${encodeURIComponent(branchesList.find(b => matches(b.name, b.id))?.name || 'Tüm Şubeler')}`}
                  download={`AudiPro_Yonetim_Raporu_${new Date().toISOString().slice(0, 10)}.xlsx`}
                  data-testid="download-report-excel"
                  className={styles.btnSecondaryAction}
                  aria-label="Excel Tablosu (.xlsx) İndir"
                  role="button"
                  style={{ justifyContent: 'space-between', padding: '12px 16px', textDecoration: 'none', color: 'inherit' }}
                  onClick={() => {
                    addToast({ type: 'success', message: 'Excel tablosu indirildi.' });
                    setShowExportModal(false);
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 18 }}>📗</span>
                    <div style={{ textAlign: 'left' }}>
                      <strong>Detaylı Excel Tablosu (.xlsx)</strong>
                      <div style={{ fontSize: 11, color: '#64748b' }}>6 Sayfa: Özet, Satışlar, Giderler, Randevular, Servis, Hastalar</div>
                    </div>
                  </div>
                  <span style={{ color: '#0d9488', fontSize: 12, fontWeight: 600 }}>İndir</span>
                </a>

                <a
                  href={`/api/reports/download?format=csv&range=${encodeURIComponent(dateRange)}&branch=${encodeURIComponent(branchesList.find(b => matches(b.name, b.id))?.name || 'Tüm Şubeler')}`}
                  download={`AudiPro_Yonetim_Raporu_${new Date().toISOString().slice(0, 10)}.csv`}
                  data-testid="download-report-csv"
                  className={styles.btnSecondaryAction}
                  aria-label="Ham Veri (.csv) İndir"
                  role="button"
                  style={{ justifyContent: 'space-between', padding: '12px 16px', textDecoration: 'none', color: 'inherit' }}
                  onClick={() => {
                    addToast({ type: 'success', message: 'CSV tablosu indirildi.' });
                    setShowExportModal(false);
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 18 }}>📄</span>
                    <div style={{ textAlign: 'left' }}>
                      <strong>Ham Veri Tablosu (.csv)</strong>
                      <div style={{ fontSize: 11, color: '#64748b' }}>Excel uyumlu Türkçe UTF-8 veri dökümü</div>
                    </div>
                  </div>
                  <span style={{ color: '#0d9488', fontSize: 12, fontWeight: 600 }}>İndir</span>
                </a>
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
          <div className={styles.modalContent} onClick={e => e.stopPropagation()} style={{ maxWidth: 460 }}>
            <div className={styles.modalHeader}>
              <h2>📅 Tarih Aralığı Seç</h2>
              <button type="button" className={styles.modalCloseBtn} onClick={() => setShowDateModal(false)}>✕</button>
            </div>
            <div className={styles.modalBody}>
              <div>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 8 }}>
                  Hızlı Seçenekler
                </span>
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
                      { label: 'Bugün', val: `${formatRangeDate(day)} - ${formatRangeDate(day)}`, start: day, end: day },
                      { label: 'Son 7 Gün', val: `${formatRangeDate(week)} - ${formatRangeDate(day)}`, start: week, end: day },
                      { label: 'Bu Ay', val: `${formatRangeDate(monthStart)} - ${formatRangeDate(day)}`, start: monthStart, end: day },
                      { label: 'Son 3 Ay', val: `${formatRangeDate(threeMonths)} - ${formatRangeDate(day)}`, start: threeMonths, end: day },
                      { label: `Bu Yıl (${now.getFullYear()})`, val: `${formatRangeDate(yearStart)} - ${formatRangeDate(day)}`, start: yearStart, end: day },
                      { label: `Geçen Yıl (${now.getFullYear() - 1})`, val: `${formatRangeDate(lastYearStart)} - ${formatRangeDate(lastYearEnd)}`, start: lastYearStart, end: lastYearEnd }
                    ];
                  })().map(opt => (
                    <button
                      key={opt.label}
                      type="button"
                      className={styles.btnSecondaryAction}
                      style={{ fontSize: 12, padding: '9px 10px', justifyContent: 'center' }}
                      onClick={() => {
                        setDateRange(opt.val);
                        setSelectedPeriod('Özel');
                        const sKey = dateKey(formatRangeDate(opt.start));
                        const eKey = dateKey(formatRangeDate(opt.end));
                        if (sKey) setCustomStartDate(sKey);
                        if (eKey) setCustomEndDate(eKey);
                        setShowDateModal(false);
                        addToast({ type: 'info', message: `Tarih aralığı: ${opt.label} olarak seçildi.` });
                      }}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className={styles.customDateSection}>
                <h4>İki Tarih Arası (Özel Seçim)</h4>
                <div className={styles.customDateGrid}>
                  <label className={styles.customDateField}>
                    <span>Başlangıç Tarihi</span>
                    <input
                      type="date"
                      data-testid="reports-custom-start-date"
                      className={styles.customDateInput}
                      value={customStartDate}
                      onChange={e => setCustomStartDate(e.target.value)}
                    />
                  </label>
                  <label className={styles.customDateField}>
                    <span>Bitiş Tarihi</span>
                    <input
                      type="date"
                      data-testid="reports-custom-end-date"
                      className={styles.customDateInput}
                      value={customEndDate}
                      onChange={e => setCustomEndDate(e.target.value)}
                    />
                  </label>
                </div>
              </div>
            </div>
            <div className={styles.modalFooter} style={{ justifyContent: 'space-between' }}>
              <button type="button" className={styles.btnSecondaryAction} onClick={() => setShowDateModal(false)}>İptal</button>
              <button
                type="button"
                data-testid="reports-apply-custom-date"
                className={styles.btnPrimaryAction}
                onClick={handleApplyCustomDateRange}
              >
                Tarih Aralığını Uygula
              </button>
            </div>
          </div>
        </div>
      )}
      {/* ── MODAL 4: Kart Özel Tarih Aralığı Seçici ── */}
      {cardDateModal.isOpen && (
        <div className={styles.modalOverlay} onClick={() => setCardDateModal(prev => ({ ...prev, isOpen: false }))}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()} style={{ maxWidth: 480 }}>
            <div className={styles.modalHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 20 }}>📅</span>
                <div>
                  <h2 style={{ margin: 0, fontSize: 16 }}>{cardDateModal.cardTitle}</h2>
                  <div style={{ fontSize: 11, color: '#64748b' }}>Bu kart için bağımsız özel tarih aralığı belirleyin</div>
                </div>
              </div>
              <button
                type="button"
                className={styles.modalCloseBtn}
                onClick={() => setCardDateModal(prev => ({ ...prev, isOpen: false }))}
              >
                ✕
              </button>
            </div>
            <div className={styles.modalBody}>
              <div>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 8 }}>
                  Hızlı Seçenekler
                </span>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                  {(() => {
                    const now = new Date();
                    const y = now.getFullYear();
                    const m = now.getMonth();
                    const monthStart = new Date(y, m, 1);
                    const monthEnd = new Date(y, m + 1, 0);
                    const last30Start = new Date(now); last30Start.setDate(last30Start.getDate() - 29);
                    const last3MonthsStart = new Date(y, m - 2, 1);
                    const yearStart = new Date(y, 0, 1);
                    const yearEnd = new Date(y, 11, 31);
                    const lastYearStart = new Date(y - 1, 0, 1);
                    const lastYearEnd = new Date(y - 1, 11, 31);
                    return [
                      { label: 'Bu Ay', start: monthStart.toISOString().slice(0, 10), end: monthEnd.toISOString().slice(0, 10) },
                      { label: 'Son 30 Gün', start: last30Start.toISOString().slice(0, 10), end: now.toISOString().slice(0, 10) },
                      { label: 'Son 3 Ay', start: last3MonthsStart.toISOString().slice(0, 10), end: now.toISOString().slice(0, 10) },
                      { label: `Bu Yıl (${y})`, start: yearStart.toISOString().slice(0, 10), end: yearEnd.toISOString().slice(0, 10) },
                      { label: `Geçen Yıl (${y - 1})`, start: lastYearStart.toISOString().slice(0, 10), end: lastYearEnd.toISOString().slice(0, 10) },
                    ];
                  })().map(opt => (
                    <button
                      key={opt.label}
                      type="button"
                      className={styles.btnSecondaryAction}
                      style={{ fontSize: 11, padding: '7px 8px', justifyContent: 'center', whiteSpace: 'nowrap' }}
                      onClick={() => {
                        setCardDateModal(prev => ({
                          ...prev,
                          startDate: opt.start,
                          endDate: opt.end,
                        }));
                      }}
                    >
                      {opt.label}
                    </button>
                  ))}
                  <button
                    type="button"
                    className={styles.btnSecondaryAction}
                    style={{ fontSize: 11, padding: '7px 8px', justifyContent: 'center', color: '#0f766e', fontWeight: 600 }}
                    onClick={() => {
                      if (rangeBounds.start && rangeBounds.end) {
                        setCardDateModal(prev => ({
                          ...prev,
                          startDate: rangeBounds.start,
                          endDate: rangeBounds.end,
                        }));
                      }
                    }}
                  >
                    Genel Dönem
                  </button>
                </div>
              </div>

              <div className={styles.customDateSection} style={{ marginTop: 14 }}>
                <h4>Özel Tarih Aralığı (Başlangıç &amp; Bitiş)</h4>
                <div className={styles.customDateGrid}>
                  <label className={styles.customDateField}>
                    <span>Başlangıç Tarihi</span>
                    <input
                      type="date"
                      data-testid="card-custom-start-date"
                      className={styles.customDateInput}
                      value={cardDateModal.startDate}
                      onChange={e => setCardDateModal(prev => ({ ...prev, startDate: e.target.value }))}
                    />
                  </label>
                  <label className={styles.customDateField}>
                    <span>Bitiş Tarihi</span>
                    <input
                      type="date"
                      data-testid="card-custom-end-date"
                      className={styles.customDateInput}
                      value={cardDateModal.endDate}
                      onChange={e => setCardDateModal(prev => ({ ...prev, endDate: e.target.value }))}
                    />
                  </label>
                </div>
              </div>
            </div>
            <div className={styles.modalFooter} style={{ justifyContent: 'space-between' }}>
              <button
                type="button"
                className={styles.btnSecondaryAction}
                onClick={handleResetCardToGlobal}
                title="Genel rapor dönemine dön"
              >
                Genel Döneme Sıfırla
              </button>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  type="button"
                  className={styles.btnSecondaryAction}
                  onClick={() => setCardDateModal(prev => ({ ...prev, isOpen: false }))}
                >
                  İptal
                </button>
                <button
                  type="button"
                  data-testid="card-apply-custom-date"
                  className={styles.btnPrimaryAction}
                  onClick={handleApplyCardCustomDate}
                >
                  Tarih Aralığını Uygula
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
