'use client';

import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { useBranchScope } from '../hooks/useBranchScope';
import { formatCurrency } from '../data/mockData';
import { fetchServiceTickets, ServiceRecord } from '../repositories/ServiceTicketRepository';
import styles from './DashboardPage.module.css';

export default function DashboardPage() {
  const { setCurrentPage, addToast, salesList, appointmentsList, patientsList, branchesList, auditLogList, currentOrgId } = useApp();
  const { matches } = useBranchScope();
  const [serviceRecords, setServiceRecords] = useState<ServiceRecord[]>([]);

  useEffect(() => {
    let active = true;
    if (!currentOrgId) {
      setServiceRecords([]);
      return;
    }
    fetchServiceTickets(currentOrgId)
      .then(records => { if (active) setServiceRecords(records); })
      .catch(() => {
        if (active) addToast({ type: 'error', message: 'Dashboard teknik servis verileri yüklenemedi.' });
      });
    return () => { active = false; };
  }, [currentOrgId]);

  const [activeTimeRange, setActiveTimeRange] = useState<'Bugün' | 'Bu Hafta' | 'Bu Ay' | 'Bu Yıl' | 'Özel'>('Bu Ay');
  const today = new Date();
  const formatDate = (date: Date) => new Intl.DateTimeFormat('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'Europe/Istanbul' }).format(date);
  const [dateRangeText, setDateRangeText] = useState(() => {
    const start = new Date(today.getFullYear(), today.getMonth(), 1);
    return `${formatDate(start)} - ${formatDate(today)}`;
  });
  const [showDateModal, setShowDateModal] = useState(false);
  const toDateInput = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  const [customStartDate, setCustomStartDate] = useState(() => toDateInput(new Date(today.getFullYear(), today.getMonth(), 1)));
  const [customEndDate, setCustomEndDate] = useState(() => toDateInput(today));
  const [dashboardChartMetric, setDashboardChartMetric] = useState<'Ciro' | 'Adet'>('Ciro');
  const [appointmentChartPeriod, setAppointmentChartPeriod] = useState<'Bu Ay' | 'Bu Hafta'>('Bu Ay');
  const [patientChartPeriod, setPatientChartPeriod] = useState<'Bu Ay' | 'Bu Hafta'>('Bu Ay');

  const selectedRange = React.useMemo(() => {
    const [startText, endText] = dateRangeText.split(' - ');
    const parseDate = (text: string) => {
      const [day, month, year] = text.split('.').map(Number);
      return day && month && year ? new Date(year, month - 1, day) : new Date(NaN);
    };
    return { start: parseDate(startText || ''), end: parseDate(endText || '') };
  }, [dateRangeText]);
  const inSelectedRange = (value: string) => {
    if (!value || Number.isNaN(selectedRange.start.getTime()) || Number.isNaN(selectedRange.end.getTime())) return false;
    const date = new Date(`${value.slice(0, 10)}T00:00:00`);
    return date >= selectedRange.start && date <= selectedRange.end;
  };
  const rangeSales = salesList.filter(sale => matches(undefined, sale.branchId) && inSelectedRange(sale.date));
  const rangeAppointments = appointmentsList.filter(appointment => matches(appointment.branch, appointment.branchId) && inSelectedRange(appointment.date));
  const rangePatients = patientsList.filter(patient => matches(patient.branch, patient.branchId) && inSelectedRange(patient.createdAt || patient.lastVisit || ''));
  const dashboardRevenue = rangeSales.reduce((sum, sale) => sum + (sale.total || 0), 0);
  const deviceSales = rangeSales.reduce((sum, sale) => sum + sale.items.filter(item => item.type === 'Cihaz').reduce((qty, item) => qty + item.quantity, 0), 0);
  const rangeServiceRecords = serviceRecords.filter(record =>
    matches(undefined, record.branchId) && inSelectedRange(record.receivedDate),
  );
  const serviceCount = rangeServiceRecords.length;
  const serviceStatusCounts = {
    waiting: rangeServiceRecords.filter(record => record.status === 'Alındı').length,
    inspecting: rangeServiceRecords.filter(record => record.status === 'İnceleniyor').length,
    repairing: rangeServiceRecords.filter(record => record.status === 'Tamir Ediliyor').length,
    readyOrDelivered: rangeServiceRecords.filter(record => record.status === 'Hazır' || record.status === 'Teslim Edildi').length,
  };
  const branchMetrics = branchesList.filter(branch => matches(branch.name, branch.id)).map(branch => {
    const branchSales = rangeSales.filter(sale => sale.branchId === branch.id);
    const branchPatients = rangePatients.filter(patient => patient.branchId === branch.id);
    const branchAppointments = rangeAppointments.filter(appointment => appointment.branchId === branch.id);
    return {
      ...branch,
      revenue: branchSales.reduce((sum, sale) => sum + sale.total, 0),
      patients: branchPatients.length,
      appointments: branchAppointments.length,
      devices: branchSales.reduce((sum, sale) => sum + sale.items.filter(item => item.type === 'Cihaz').reduce((qty, item) => qty + item.quantity, 0), 0),
      services: branchSales.reduce((sum, sale) => sum + sale.items.filter(item => item.type === 'Servis Geliri').reduce((qty, item) => qty + item.quantity, 0), 0),
    };
  });
  const todayKey = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Istanbul' }).format(today);
  const todaysAppointments = appointmentsList
    .filter(appointment => matches(appointment.branch, appointment.branchId) && appointment.date.slice(0, 10) === todayKey)
    .sort((a, b) => a.time.localeCompare(b.time));
  const recentAuditEntries = auditLogList
    .filter(entry => matches(undefined, entry.branchId))
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 5);

  const updateRange = (range: typeof activeTimeRange) => {
    const end = new Date();
    const start = new Date(end);
    if (range === 'Bugün') start.setHours(0, 0, 0, 0);
    if (range === 'Bu Hafta') start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
    if (range === 'Bu Ay') start.setDate(1);
    if (range === 'Bu Yıl') start.setMonth(0, 1);
    setActiveTimeRange(range);
    setDateRangeText(`${formatDate(start)} - ${formatDate(end)}`);
    addToast({ type: 'info', message: `Zaman aralığı: ${range} seçildi` });
  };

  const applyCustomRange = () => {
    const start = new Date(`${customStartDate}T00:00:00`);
    const end = new Date(`${customEndDate}T00:00:00`);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      addToast({ type: 'warning', message: 'Lütfen başlangıç ve bitiş tarihlerini seçin.' });
      return;
    }
    if (start > end) {
      addToast({ type: 'warning', message: 'Başlangıç tarihi bitiş tarihinden sonra olamaz.' });
      return;
    }
    setDateRangeText(`${formatDate(start)} - ${formatDate(end)}`);
    setActiveTimeRange('Özel');
    setShowDateModal(false);
    addToast({ type: 'success', message: `Dashboard ${formatDate(start)} - ${formatDate(end)} aralığına göre güncellendi.` });
  };

  const monthLabels = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
  const reportYear = new Date().getFullYear();
  const chartMonths = Array.from({ length: 12 }, (_, index) => {
    const date = new Date(selectedRange.end.getFullYear(), selectedRange.end.getMonth() - (11 - index), 1);
    return { year: date.getFullYear(), month: date.getMonth(), label: monthLabels[date.getMonth()] };
  });
  const monthlyValues = chartMonths.map(({ year, month }) => rangeSales
    .filter(sale => sale.date.slice(0, 7) === `${year}-${String(month + 1).padStart(2, '0')}`)
    .reduce((sum, sale) => sum + (dashboardChartMetric === 'Ciro' ? sale.total : sale.items.reduce((qty, item) => qty + item.quantity, 0)), 0));
  const monthlyMax = Math.max(...monthlyValues, 1);
  const monthlyData = chartMonths.map((item, index) => ({ month: item.label, value: monthlyValues[index], height: monthlyValues[index] / monthlyMax * 108, isCurrent: index === 11 }));
  const chartEndMonthIndex = 11;

  // Helper to calculate SVG donut slice offsets
  // Circumference for r=38 is 2 * PI * 38 = 238.76
  const cRadius = 38;
  const circ = 2 * Math.PI * cRadius;

  const makeSlices = (entries: { label: string; count: number; color: string }[]) => {
    const total = entries.reduce((sum, entry) => sum + entry.count, 0);
    return entries.map(entry => ({ ...entry, percent: total ? Math.round(entry.count / total * 100) : 0, length: total ? circ * entry.count / total : 0 }));
  };
  const matchesChartPeriod = (value: string, period: 'Bu Ay' | 'Bu Hafta') => {
    const date = new Date(`${value.slice(0, 10)}T00:00:00`);
    if (Number.isNaN(date.getTime())) return false;
    const start = new Date(today);
    if (period === 'Bu Ay') start.setDate(1);
    else start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
    start.setHours(0, 0, 0, 0);
    return date >= start && date <= today;
  };
  const appointmentCounts = [
    { label: 'Tamamlanan', count: rangeAppointments.filter(a => matchesChartPeriod(a.date, appointmentChartPeriod) && a.status === 'Geldi').length, color: '#08785B' },
    { label: 'Bekleyen', count: rangeAppointments.filter(a => matchesChartPeriod(a.date, appointmentChartPeriod) && (a.status === 'Bekliyor' || a.status === 'Hatırlatıldı')).length, color: '#2563EB' },
    { label: 'İptal Edilen', count: rangeAppointments.filter(a => matchesChartPeriod(a.date, appointmentChartPeriod) && a.status === 'İptal').length, color: '#F97316' },
    { label: 'Gelmedi', count: rangeAppointments.filter(a => matchesChartPeriod(a.date, appointmentChartPeriod) && a.status === 'Gelmedi').length, color: '#9CA3AF' },
  ];
  const apptSlices = makeSlices(appointmentCounts);
  const sourceColors = ['#08785B', '#2563EB', '#F97316', '#8B5CF6', '#0EA5E9'];
  const sourcePatients = rangePatients.filter(patient => matchesChartPeriod(patient.createdAt || patient.lastVisit || '', patientChartPeriod));
  const sourceCounts = Array.from(new Set(sourcePatients.map(patient => patient.source || 'Belirtilmemiş'))).map((source, index) => ({
    label: source,
    count: sourcePatients.filter(patient => (patient.source || 'Belirtilmemiş') === source).length,
    color: sourceColors[index % sourceColors.length],
  }));
  const sourceSlices = makeSlices(sourceCounts);

  let apptOffset = 0;
  let sourceOffset = 0;

  return (
    <div className={styles.dashboard}>
      {/* ── Top Welcome & Date Filters ── */}
      <div className={styles.welcomeHeader}>
        <div className={styles.welcomeLeft}>
          <h1>Hoş geldin Ahmet 👋</h1>
          <p className={styles.welcomeSubtitle}>
            İşitme merkezinizin genel durumu burada. Bugünün özetini ve önemli verileri takip edin.
          </p>
        </div>

        <div className={styles.welcomeRight}>
          <button 
            type="button" 
            className={styles.dateRangeBtn}
            onClick={() => {
              setCustomStartDate(toDateInput(selectedRange.start));
              setCustomEndDate(toDateInput(selectedRange.end));
              setShowDateModal(true);
            }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
              <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
            {dateRangeText}
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </button>

          <div className={styles.timePills}>
            {(['Bugün', 'Bu Hafta', 'Bu Ay', 'Bu Yıl'] as const).map(pill => (
              <button
                key={pill}
                type="button"
                className={`${styles.timePill} ${activeTimeRange === pill ? styles.timePillActive : ''}`}
                onClick={() => {
                  updateRange(pill);
                }}
              >
                {pill}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── 5 Stat Cards in Row ── */}
      <div className={styles.statsGrid}>
        {/* Card 1: Toplam Ciro */}
        <div className={styles.statCard} onClick={() => setCurrentPage('cash')}>
          <div className={`${styles.statIconWrap} ${styles.iconBgGreen}`}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="6" width="20" height="12" rx="2"></rect>
              <circle cx="12" cy="12" r="2"></circle>
              <path d="M6 12h.01M18 12h.01"></path>
            </svg>
          </div>
          <div className={styles.statBody}>
            <span className={styles.statLabel}>Toplam Ciro</span>
            <span className={styles.statValue}>{formatCurrency(dashboardRevenue)}</span>
            <div className={styles.statTrend}>
              <span className={styles.trendSub}>Seçili tarih aralığı</span>
            </div>
          </div>
        </div>

        {/* Card 2: Randevu */}
        <div className={styles.statCard} onClick={() => setCurrentPage('appointments')}>
          <div className={`${styles.statIconWrap} ${styles.iconBgRed}`}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
              <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
          </div>
          <div className={styles.statBody}>
            <span className={styles.statLabel}>Randevu</span>
            <span className={styles.statValue}>{rangeAppointments.length}</span>
            <div className={styles.statTrend}>
              <span className={styles.trendSub}>Seçili tarih aralığı</span>
            </div>
          </div>
        </div>

        {/* Card 3: Yeni Hasta */}
        <div className={styles.statCard} onClick={() => setCurrentPage('patients')}>
          <div className={`${styles.statIconWrap} ${styles.iconBgBlue}`}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
              <circle cx="9" cy="7" r="4"></circle>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
            </svg>
          </div>
          <div className={styles.statBody}>
            <span className={styles.statLabel}>Yeni Hasta</span>
            <span className={styles.statValue}>{rangePatients.length}</span>
            <div className={styles.statTrend}>
              <span className={styles.trendSub}>Seçili tarih aralığı</span>
            </div>
          </div>
        </div>

        {/* Card 4: Cihaz Satışı */}
        <div className={styles.statCard} onClick={() => setCurrentPage('stock')}>
          <div className={`${styles.statIconWrap} ${styles.iconBgGreen}`}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="9" cy="21" r="1"></circle>
              <circle cx="20" cy="21" r="1"></circle>
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
            </svg>
          </div>
          <div className={styles.statBody}>
            <span className={styles.statLabel}>Cihaz Satışı</span>
            <span className={styles.statValue}>{deviceSales}</span>
            <div className={styles.statTrend}>
              <span className={styles.trendSub}>Seçili tarih aralığı</span>
            </div>
          </div>
        </div>

        {/* Card 5: Teknik Servis */}
        <div className={styles.statCard} onClick={() => setCurrentPage('service')}>
          <div className={`${styles.statIconWrap} ${styles.iconBgPurple}`}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path>
            </svg>
          </div>
          <div className={styles.statBody}>
            <span className={styles.statLabel}>Teknik Servis</span>
            <span className={styles.statValue}>{serviceCount}</span>
            <div className={styles.statTrend}>
              <span className={styles.trendSub}>Seçili tarih aralığı</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Middle Row: 3 Charts ── */}
      <div className={styles.chartsRow}>
        {/* Chart 1: Aylık Ciro Trendi */}
        <div className={styles.cardBox}>
          <div className={styles.cardBoxHeader}>
            <div className={styles.cardBoxTitleWrap}>
              <span className={styles.cardBoxIcon}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="20" x2="18" y2="10"></line>
                  <line x1="12" y1="20" x2="12" y2="4"></line>
                  <line x1="6" y1="20" x2="6" y2="14"></line>
                </svg>
              </span>
              <span>Aylık Ciro Trendi</span>
            </div>
            <select className={styles.miniSelect} value={dashboardChartMetric} onChange={event => setDashboardChartMetric(event.target.value as 'Ciro' | 'Adet')}>
              <option value="Ciro">Ciro</option>
              <option value="Adet">Adet</option>
            </select>
          </div>

          <div className={styles.barChartWrap}>
            {/* Tooltip Bubble */}
            <div className={styles.tooltipBubble}>
              <div className={styles.tooltipMonth}>{chartMonths[chartEndMonthIndex].label} {chartMonths[chartEndMonthIndex].year}</div>
              <div className={styles.tooltipValue}>{dashboardChartMetric === 'Ciro' ? formatCurrency(monthlyValues[chartEndMonthIndex]) : `${monthlyValues[chartEndMonthIndex]} adet`}</div>
            </div>

            <svg className={styles.barChartSvg} viewBox="0 0 460 140" preserveAspectRatio="none">
              {/* Grid lines and Y axis */}
              <text x="28" y="15" fill="#9CA3AF" fontSize="9" textAnchor="end">{dashboardChartMetric === 'Ciro' ? formatCurrency(monthlyMax) : `${Math.round(monthlyMax)} adet`}</text>
              <line x1="34" y1="12" x2="450" y2="12" stroke="#F3F4F6" strokeWidth="1" strokeDasharray="2,2" />

              <text x="28" y="42" fill="#9CA3AF" fontSize="9" textAnchor="end">{dashboardChartMetric === 'Ciro' ? formatCurrency(monthlyMax * .75) : `${Math.round(monthlyMax * .75)} adet`}</text>
              <line x1="34" y1="39" x2="450" y2="39" stroke="#F3F4F6" strokeWidth="1" strokeDasharray="2,2" />

              <text x="28" y="69" fill="#9CA3AF" fontSize="9" textAnchor="end">{dashboardChartMetric === 'Ciro' ? formatCurrency(monthlyMax * .5) : `${Math.round(monthlyMax * .5)} adet`}</text>
              <line x1="34" y1="66" x2="450" y2="66" stroke="#F3F4F6" strokeWidth="1" strokeDasharray="2,2" />

              <text x="28" y="96" fill="#9CA3AF" fontSize="9" textAnchor="end">{dashboardChartMetric === 'Ciro' ? formatCurrency(monthlyMax * .25) : `${Math.round(monthlyMax * .25)} adet`}</text>
              <line x1="34" y1="93" x2="450" y2="93" stroke="#F3F4F6" strokeWidth="1" strokeDasharray="2,2" />

              <text x="28" y="122" fill="#9CA3AF" fontSize="9" textAnchor="end">{dashboardChartMetric === 'Ciro' ? '₺0' : '0 adet'}</text>
              <line x1="34" y1="120" x2="450" y2="120" stroke="#E5E7EB" strokeWidth="1" />

              {/* Monthly Bars */}
              {monthlyData.map((item, idx) => {
                const xPos = 48 + idx * 34;
                const barWidth = 16;
                const barHeight = item.height;
                const yPos = 120 - barHeight;

                return (
                  <g key={item.month}>
                    <rect
                      x={xPos}
                      y={yPos}
                      width={barWidth}
                      height={barHeight}
                      rx="3"
                      fill={item.isCurrent ? '#08785B' : '#A7F3D0'}
                    />
                    <text
                      x={xPos + barWidth / 2}
                      y="134"
                      fill={item.isCurrent ? '#08785B' : '#6B7280'}
                      fontSize="9.5"
                      fontWeight={item.isCurrent ? '700' : '500'}
                      textAnchor="middle"
                    >
                      {item.month}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>

        {/* Chart 2: Randevu Durumu */}
        <div className={styles.cardBox}>
          <div className={styles.cardBoxHeader}>
            <div className={styles.cardBoxTitleWrap}>
              <span className={styles.cardBoxIcon}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                </svg>
              </span>
              <span>Randevu Durumu</span>
            </div>
            <select className={styles.miniSelect} value={appointmentChartPeriod} onChange={event => setAppointmentChartPeriod(event.target.value as 'Bu Ay' | 'Bu Hafta')}>
              <option value="Bu Ay">Bu Ay</option>
              <option value="Bu Hafta">Bu Hafta</option>
            </select>
          </div>

          <div className={styles.donutFlexWrap}>
            <div className={styles.donutSvgWrap}>
              <svg width="120" height="120" viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)' }}>
                {apptSlices.map(s => {
                  const strokeDasharray = `${s.length} ${circ - s.length}`;
                  const strokeDashoffset = -apptOffset;
                  apptOffset += s.length;
                  return (
                    <circle
                      key={s.label}
                      cx="50"
                      cy="50"
                      r={cRadius}
                      fill="transparent"
                      stroke={s.color}
                      strokeWidth="11"
                      strokeDasharray={strokeDasharray}
                      strokeDashoffset={strokeDashoffset}
                    />
                  );
                })}
              </svg>
              <div className={styles.donutCenterText}>
                <span className={styles.donutBigVal}>{rangeAppointments.length}</span>
                <span className={styles.donutSubVal}>Toplam Randevu</span>
              </div>
            </div>

            <div className={styles.legendList}>
              {apptSlices.map(s => (
                <div key={s.label} className={styles.legendItem}>
                  <div className={styles.legendLeft}>
                    <span className={styles.legendDot} style={{ background: s.color }}></span>
                    <span>{s.label}</span>
                  </div>
                  <div className={styles.legendRight}>
                    <span className={styles.legendCount}>{s.count}</span>
                    <span className={styles.legendPercent}>%{s.percent}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Chart 3: Hasta Kaynak Dağılımı */}
        <div className={styles.cardBox}>
          <div className={styles.cardBoxHeader}>
            <div className={styles.cardBoxTitleWrap}>
              <span className={styles.cardBoxIcon}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                  <line x1="16" y1="2" x2="16" y2="6"></line>
                  <line x1="8" y1="2" x2="8" y2="6"></line>
                  <line x1="3" y1="10" x2="21" y2="10"></line>
                </svg>
              </span>
              <span>Hasta Kaynak Dağılımı</span>
            </div>
            <select className={styles.miniSelect} value={patientChartPeriod} onChange={event => setPatientChartPeriod(event.target.value as 'Bu Ay' | 'Bu Hafta')}>
              <option value="Bu Ay">Bu Ay</option>
              <option value="Bu Hafta">Bu Hafta</option>
            </select>
          </div>

          <div className={styles.donutFlexWrap}>
            <div className={styles.donutSvgWrap}>
              <svg width="120" height="120" viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)' }}>
                {sourceSlices.map(s => {
                  const strokeDasharray = `${s.length} ${circ - s.length}`;
                  const strokeDashoffset = -sourceOffset;
                  sourceOffset += s.length;
                  return (
                    <circle
                      key={s.label}
                      cx="50"
                      cy="50"
                      r={cRadius}
                      fill="transparent"
                      stroke={s.color}
                      strokeWidth="11"
                      strokeDasharray={strokeDasharray}
                      strokeDashoffset={strokeDashoffset}
                    />
                  );
                })}
              </svg>
              <div className={styles.donutCenterText}>
                <span className={styles.donutBigVal}>{rangePatients.length}</span>
                <span className={styles.donutSubVal}>Yeni Hasta</span>
              </div>
            </div>

            <div className={styles.legendList}>
              {sourceSlices.map(s => (
                <div key={s.label} className={styles.legendItem}>
                  <div className={styles.legendLeft}>
                    <span className={styles.legendDot} style={{ background: s.color }}></span>
                    <span>{s.label}</span>
                  </div>
                  <div className={styles.legendRight}>
                    <span className={styles.legendCount}>{s.count}</span>
                    <span className={styles.legendPercent}>%{s.percent}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Lower Middle Row: 2 Cards ── */}
      <div className={styles.midRow}>
        {/* Card 1: Şubelere Göre Özet */}
        <div className={styles.cardBox}>
          <div className={styles.cardBoxHeader}>
            <div className={styles.cardBoxTitleWrap}>
              <span className={styles.cardBoxIcon}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 3v18h18"></path>
                  <path d="M18 17V9"></path>
                  <path d="M13 17V5"></path>
                  <path d="M8 17v-3"></path>
                </svg>
              </span>
              <span>Şubelere Göre Özet</span>
            </div>
            <select className={styles.miniSelect} defaultValue="Bu Ay">
              <option value="Bu Ay">Bu Ay</option>
              <option value="Tüm Dönem">Tüm Dönem</option>
            </select>
          </div>

          <table className={styles.dashTable}>
            <thead>
              <tr>
                <th>ŞUBE</th>
                <th>CİRO</th>
                <th>HASTA</th>
                <th>RANDEVU</th>
                <th>CİHAZ SATIŞI</th>
                <th>TEKNİK SERVİS</th>
                <th style={{ textAlign: 'right' }}></th>
              </tr>
            </thead>
            <tbody>
              {branchMetrics.length === 0 ? <tr><td colSpan={7} style={{ textAlign: 'center' }}>Şube verisi bulunamadı.</td></tr> : branchMetrics.map(branch => (
                <tr key={branch.id}>
                  <td><div className={styles.branchCell}><span className={styles.branchIconBox} style={{ background: '#E6F7F2', color: '#08785B' }}>🏢</span><span>{branch.name}</span></div></td>
                  <td style={{ fontWeight: 700, color: '#111827' }}>{formatCurrency(branch.revenue)}</td>
                  <td>{branch.patients}</td><td>{branch.appointments}</td><td>{branch.devices}</td><td>{branch.services}</td><td>—</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td>Toplam</td>
                <td>{formatCurrency(branchMetrics.reduce((sum, branch) => sum + branch.revenue, 0))}</td>
                <td>{branchMetrics.reduce((sum, branch) => sum + branch.patients, 0)}</td>
                <td>{branchMetrics.reduce((sum, branch) => sum + branch.appointments, 0)}</td>
                <td>{branchMetrics.reduce((sum, branch) => sum + branch.devices, 0)}</td>
                <td>{branchMetrics.reduce((sum, branch) => sum + branch.services, 0)}</td>
                <td>—</td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Card 2: Bugünkü Randevular */}
        <div className={styles.cardBox}>
          <div className={styles.cardBoxHeader}>
            <div className={styles.cardBoxTitleWrap}>
              <span className={styles.cardBoxIcon}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                  <line x1="16" y1="2" x2="16" y2="6"></line>
                  <line x1="8" y1="2" x2="8" y2="6"></line>
                  <line x1="3" y1="10" x2="21" y2="10"></line>
                </svg>
              </span>
              <span>Bugünkü Randevular</span>
            </div>
            <button 
              type="button" 
              className={styles.linkAll} 
              onClick={() => setCurrentPage('appointments')}
            >
              Tümü →
            </button>
          </div>

          <div className={styles.apptList}>
            {todaysAppointments.length === 0 ? <div className={styles.apptRow}>Bugün için randevu bulunmuyor.</div> : todaysAppointments.slice(0, 5).map(appointment => {
              const statusClass = appointment.status === 'Geldi' ? styles.badgeArrived : appointment.status === 'İptal' ? styles.badgeNeutral : appointment.status === 'Gelmedi' ? styles.badgePlanned : styles.badgeWaiting;
              return <div className={styles.apptRow} key={appointment.id}>
                <span className={styles.apptTime}>{appointment.time}</span>
                <div className={styles.apptPatient}><span style={{ color: '#08785B' }}>👤</span><span>{appointment.patientName}</span></div>
                <span className={`${styles.apptBadge} ${statusClass}`}>{appointment.status}</span>
                <div className={styles.apptMeta}><span>{appointment.branch}</span><span>{appointment.type}</span></div>
              </div>;
            })}
          </div>

          <button 
            type="button" 
            className={styles.btnAllAppts}
            onClick={() => setCurrentPage('appointments')}
          >
            Tüm Randevuları Gör →
          </button>
        </div>
      </div>

      {/* ── Bottom Row: 2 Cards (Teknik Servis & Son İşlemler) ── */}
      <div className={styles.bottomRow}>
        {/* Card 1: Teknik Servis Durumu */}
        <div className={styles.cardBox}>
          <div className={styles.cardBoxHeader}>
            <div className={styles.cardBoxTitleWrap}>
              <span className={styles.cardBoxIcon}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path>
                </svg>
              </span>
              <span>Teknik Servis Durumu</span>
            </div>
            <button 
              type="button" 
              className={styles.linkAll} 
              onClick={() => setCurrentPage('service')}
            >
              Tümü →
            </button>
          </div>

          <div className={styles.serviceStatusGrid}>
            <div className={`${styles.serviceMiniCard} ${styles.servCardRed}`}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
              </svg>
              <span className={styles.serviceVal}>{serviceStatusCounts.waiting}</span>
              <span className={styles.serviceLabel}>Bekleyen</span>
            </div>

            <div className={`${styles.serviceMiniCard} ${styles.servCardYellow}`}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3"></circle>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
              </svg>
              <span className={styles.serviceVal}>{serviceStatusCounts.inspecting}</span>
              <span className={styles.serviceLabel}>İnceleniyor</span>
            </div>

            <div className={`${styles.serviceMiniCard} ${styles.servCardBlue}`}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path>
              </svg>
              <span className={styles.serviceVal}>{serviceStatusCounts.repairing}</span>
              <span className={styles.serviceLabel}>Tamir Ediliyor</span>
            </div>

            <div className={`${styles.serviceMiniCard} ${styles.servCardGreen}`}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
              </svg>
              <span className={styles.serviceVal}>{serviceStatusCounts.readyOrDelivered}</span>
              <span className={styles.serviceLabel}>Teslim Edildi</span>
            </div>
          </div>
        </div>

        {/* Card 2: Son İşlemler */}
        <div className={styles.cardBox}>
          <div className={styles.cardBoxHeader}>
            <div className={styles.cardBoxTitleWrap}>
              <span className={styles.cardBoxIcon}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                  <line x1="16" y1="13" x2="8" y2="13"></line>
                  <line x1="16" y1="17" x2="8" y2="17"></line>
                </svg>
              </span>
              <span>Son İşlemler</span>
            </div>
            <button 
              type="button" 
              className={styles.linkAll} 
              onClick={() => setCurrentPage('audit-log')}
            >
              Tümü →
            </button>
          </div>

          <table className={styles.dashTable}>
            <thead>
              <tr>
                <th>TARİH</th>
                <th>İŞLEM</th>
                <th>AÇIKLAMA</th>
                <th>KULLANICI</th>
              </tr>
            </thead>
            <tbody>
              {recentAuditEntries.map(entry => (
                <tr key={entry.id}>
                  <td>{new Date(entry.timestamp).toLocaleString('tr-TR')}</td>
                  <td>{entry.action}</td>
                  <td>{entry.description || '—'}</td>
                  <td>{entry.userName || 'Kullanıcı bilgisi yok'}</td>
                </tr>
              ))}
              {recentAuditEntries.length === 0 && (
                <tr><td colSpan={4} style={{ textAlign: 'center', color: '#6B7280' }}>Bu şubede henüz işlem kaydı bulunmuyor.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Date Range Modal ── */}
      {showDateModal && (
        <div className={styles.modalOverlay} onClick={() => setShowDateModal(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Tarih Aralığı Seçin</h3>
              <button 
                type="button" 
                className={styles.linkAll} 
                onClick={() => setShowDateModal(false)}
              >
                ✕
              </button>
            </div>
            <div className={styles.modalBody}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
                {['Bugün', 'Son 7 Gün', `Bu Ay (${new Intl.DateTimeFormat('tr-TR', { month: 'long' }).format(today)} ${reportYear})`, 'Son 3 Ay', `Bu Yıl (${reportYear})`, 'Tüm Zamanlar'].map((rangeOption) => (
                  <button
                    key={rangeOption}
                    type="button"
                    style={{
                      padding: '10px 14px',
                      borderRadius: 8,
                      border: '1px solid #E5E7EB',
                      background: '#FFFFFF',
                      fontSize: '12px',
                      fontWeight: 500,
                      color: '#374151',
                      cursor: 'pointer',
                      textAlign: 'left'
                    }}
                    onClick={() => {
                      const end = new Date();
                      const start = new Date(end);
                      if (rangeOption === 'Bugün') start.setHours(0, 0, 0, 0);
                      else if (rangeOption === 'Son 7 Gün') start.setDate(start.getDate() - 6);
                      else if (rangeOption.startsWith('Bu Ay')) start.setDate(1);
                      else if (rangeOption === 'Son 3 Ay') start.setMonth(start.getMonth() - 3);
                      else if (rangeOption.startsWith('Bu Yıl')) start.setMonth(0, 1);
                      else if (rangeOption === 'Tüm Zamanlar') {
                        const dates = [...salesList.map(item => item.date), ...appointmentsList.map(item => item.date), ...patientsList.map(item => item.createdAt || '')].filter(Boolean).sort();
                        if (dates[0]) start.setTime(new Date(`${dates[0].slice(0, 10)}T00:00:00`).getTime());
                        else start.setFullYear(2000, 0, 1);
                      }
                      setDateRangeText(`${formatDate(start)} - ${formatDate(end)}`);
                      setActiveTimeRange(rangeOption === 'Bugün' ? 'Bugün' : rangeOption.startsWith('Bu Ay') ? 'Bu Ay' : rangeOption.startsWith('Bu Yıl') ? 'Bu Yıl' : 'Özel');
                      setShowDateModal(false);
                      addToast({ type: 'info', message: `Tarih aralığı güncellendi: ${rangeOption}` });
                    }}
                  >
                    {rangeOption}
                  </button>
                ))}
              </div>
              <div className={styles.customDateSection}>
                <h4>Manuel tarih aralığı</h4>
                <div className={styles.customDateGrid}>
                  <label className={styles.customDateField}>
                    <span>Başlangıç tarihi</span>
                    <input className={styles.customDateInput} type="date" value={customStartDate} onChange={event => setCustomStartDate(event.target.value)} />
                  </label>
                  <label className={styles.customDateField}>
                    <span>Bitiş tarihi</span>
                    <input className={styles.customDateInput} type="date" value={customEndDate} onChange={event => setCustomEndDate(event.target.value)} />
                  </label>
                </div>
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button 
                type="button" 
                className={styles.btnSecondary} 
                onClick={() => setShowDateModal(false)}
              >
                Kapat
              </button>
              <button type="button" className={styles.btnPrimary} onClick={applyCustomRange}>
                Tarih Aralığını Uygula
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
