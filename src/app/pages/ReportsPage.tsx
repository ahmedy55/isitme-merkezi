'use client';

import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { useBranchScope } from '../hooks/useBranchScope';
import { formatCurrency } from '../data/mockData';
import styles from './ReportsPage.module.css';

interface DonutSlice {
  value: number;
  color: string;
  label: string;
}

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
  const { addToast, salesList, expensesList, patientsList, stockList, appointmentsList } = useApp();
  const { matches } = useBranchScope();

  // Dynamic Calculated Metrics
  const scopedSales = useMemo(() => salesList.filter(sale => matches(undefined, sale.branchId)), [salesList, matches]);
  const scopedExpenses = useMemo(() => expensesList.filter(expense => matches(expense.branch, expense.branchId)), [expensesList, matches]);
  const scopedPatients = useMemo(() => patientsList.filter(patient => matches(patient.branch, patient.branchId)), [patientsList, matches]);
  const scopedAppointments = useMemo(() => appointmentsList.filter(appointment => matches(appointment.branch, appointment.branchId)), [appointmentsList, matches]);
  const dynamicTotalRevenue = useMemo(() => scopedSales.reduce((acc, sale) => acc + (sale.total || 0), 0), [scopedSales]);

  const dynamicTotalExpenses = useMemo(() => {
    return scopedExpenses.reduce((acc, expense) => acc + (expense.amount || 0), 0);
  }, [scopedExpenses]);

  const dynamicNetProfit = dynamicTotalRevenue - dynamicTotalExpenses;
  const dynamicPatientCount = scopedPatients.length;
  const dynamicAppointmentCount = scopedAppointments.length;
  const dynamicDeviceSalesCount = scopedSales.reduce((sum, sale) => sum + sale.items.filter(item => item.type === 'Cihaz').reduce((count, item) => count + item.quantity, 0), 0);
  const dynamicServiceRevenue = scopedSales.filter(sale => sale.items?.some(item => item.type === 'Servis Geliri')).reduce((acc, sale) => acc + sale.total, 0);

  // Active Sub-Tab
  const [activeTab, setActiveTab] = useState<string>('Genel Bakış');

  // Date Range and Filters
  const [dateRange, setDateRange] = useState('01.01.2026 - 31.12.2026');
  const [selectedPeriod, setSelectedPeriod] = useState('Bu Yıl');
  const [chartMetric, setChartMetric] = useState('Ciro');
  const [hoveredMonth, setHoveredMonth] = useState<string | null>('Eyl');

  // Modals state
  const [showCompareModal, setShowCompareModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showDateModal, setShowDateModal] = useState(false);

  // 12 Months Bar Chart Data
  const monthNames = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
  const reportYear = new Date().getFullYear();
  const rawMonthlyValues = monthNames.map((_, monthIndex) => {
    const monthKey = `${reportYear}-${String(monthIndex + 1).padStart(2, '0')}`;
    const monthSales = scopedSales.filter(sale => sale.date.startsWith(monthKey));
    const monthExpenses = scopedExpenses.filter(expense => expense.date.startsWith(monthKey)).reduce((sum, expense) => sum + expense.amount, 0);
    if (chartMetric === 'Satış Adedi') return monthSales.reduce((sum, sale) => sum + sale.items.reduce((qty, item) => qty + item.quantity, 0), 0);
    if (chartMetric === 'Karlılık') return monthSales.reduce((sum, sale) => sum + sale.total, 0) - monthExpenses;
    return monthSales.reduce((sum, sale) => sum + sale.total, 0);
  });
  const chartScaleMax = Math.max(...rawMonthlyValues.map(value => Math.max(0, value)), 1);
  const monthlyData = monthNames.map((month, index) => ({ month, value: rawMonthlyValues[index], heightPct: Math.max(0, rawMonthlyValues[index]) / chartScaleMax * 100, isCurrent: index === new Date().getMonth() }));
  const chartUnit = chartMetric === 'Satış Adedi' ? 'adet' : '₺';
  const chartTitle = chartMetric === 'Satış Adedi' ? 'Aylık Satış Adedi' : chartMetric === 'Karlılık' ? 'Aylık Karlılık' : 'Aylık Ciro Trendi';
  const chartTickValues = Array.from({ length: 6 }, (_, index) => Math.round(chartScaleMax * (5 - index) / 5));

  // Gelir Dağılımı Donut Data
  const revenueDistributionSlices: DonutSlice[] = [
    { label: 'Cihaz Satışı', value: 60, color: '#0d9488' },
    { label: 'Teknik Servis', value: 16, color: '#f43f5e' },
    { label: 'Aksesuar Satışı', value: 12, color: '#f59e0b' },
    { label: 'Hizmet / Diğer', value: 8, color: '#0284c7' }
  ];

  // Hasta Kaynak Dağılımı Slices
  const patientSourceSlices: DonutSlice[] = [
    { label: 'Google', value: 41, color: '#3b82f6' },
    { label: 'Referans', value: 24, color: '#10b981' },
    { label: 'Doktor Yönlendirmesi', value: 18, color: '#f87171' },
    { label: 'Sosyal Medya', value: 12, color: '#38bdf8' },
    { label: 'Diğer', value: 6, color: '#94a3b8' }
  ];

  // Randevu Durumu Slices
  const appointmentStatusSlices: DonutSlice[] = [
    { label: 'Tamamlanan', value: 73, color: '#10b981' },
    { label: 'Bekleyen', value: 13, color: '#f59e0b' },
    { label: 'İptal Edilen', value: 10, color: '#ef4444' },
    { label: 'Gelmedi', value: 4, color: '#64748b' }
  ];

  // Teknik Servis Durumu Slices
  const serviceStatusSlices: DonutSlice[] = [
    { label: 'Teslim Edildi', value: 50, color: '#10b981' },
    { label: 'Tamir Ediliyor', value: 25, color: '#14b8a6' },
    { label: 'İnceleniyor', value: 17, color: '#0ea5e9' },
    { label: 'Arızalı / Beklemede', value: 8, color: '#f87171' }
  ];

  // En Çok Satılan Cihazlar Data
  const topDevices = [
    { rank: 1, name: 'Oticon More 1', salesCount: 8, revenue: 4000, ratio: 32 },
    { rank: 2, name: 'Phonak Audeo L', salesCount: 5, revenue: 2500, ratio: 20 },
    { rank: 3, name: 'Widex Moment', salesCount: 4, revenue: 2000, ratio: 16 },
    { rank: 4, name: 'Signia Pure 312', salesCount: 3, revenue: 1500, ratio: 12 },
    { rank: 5, name: 'Diğer', salesCount: 5, revenue: 2500, ratio: 20 }
  ];

  // Şube Bazlı Performans Data
  const branchPerformance = [
    { branch: 'Merkez', patients: 18, appointments: 26, revenue: 7500, service: 12, satisfaction: 95 },
    { branch: 'Çankaya', patients: 8, appointments: 14, revenue: 2500, service: 6, satisfaction: 90 },
    { branch: 'Kadıköy', patients: 6, appointments: 10, revenue: 1500, service: 4, satisfaction: 87 },
    { branch: 'Test Şube 1', patients: 2, appointments: 5, revenue: 1000, service: 2, satisfaction: 92 }
  ];

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

  const handleExportReport = (format: string) => {
    addToast({ type: 'success', message: `${format} formatında rapor dışa aktarılıyor...` });
    setShowExportModal(false);
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
              <span className={styles.trendUpGreen}>↑ %18</span>
              <span className={styles.trendMuted}>geçen yıla göre</span>
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
              <span className={styles.trendUpGreen}>↑ %12</span>
              <span className={styles.trendMuted}>geçen yıla göre</span>
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
              <span className={styles.trendUpGreen}>↑ %7</span>
              <span className={styles.trendMuted}>geçen yıla göre</span>
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
              <span className={styles.trendUpGreen}>↑ %28</span>
              <span className={styles.trendMuted}>geçen yıla göre</span>
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
              <span className={styles.trendDownRed}>↓ %10</span>
              <span className={styles.trendMuted}>geçen yıla göre</span>
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
      <div className={styles.row1Grid}>
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
              <button type="button" className={styles.btnMiniIcon} title="Grafik Görünümü">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="20" x2="18" y2="10"></line>
                  <line x1="12" y1="20" x2="12" y2="4"></line>
                  <line x1="6" y1="20" x2="6" y2="14"></line>
                </svg>
              </button>
            </div>
          </div>

          <div className={styles.barChartContainer}>
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
          </div>
        </div>

        {/* Right: Gelir Dağılımı Donut */}
        <div className={styles.analyticsCard}>
          <div className={styles.cardHeaderRow}>
            <div className={styles.cardTitleWrap}>
              <h3>Gelir Dağılımı</h3>
            </div>
            <div className={styles.cardControls}>
              <select className={styles.miniSelect} defaultValue="Bu Yıl">
                <option value="Bu Yıl">Bu Yıl</option>
                <option value="Son 6 Ay">Son 6 Ay</option>
                <option value="Bu Ay">Bu Ay</option>
              </select>
            </div>
          </div>

          <div className={styles.donutWithLegend}>
            <SvgDonut
              size={154}
              strokeWidth={22}
              slices={revenueDistributionSlices}
              centerValue="₺12.500"
              centerLabel="Toplam Ciro"
            />

            <div className={styles.legendList}>
              <div className={styles.legendItem}>
                <div className={styles.legendLabelWrap}>
                  <span className={styles.legendColorDot} style={{ background: '#0d9488' }}></span>
                  <span>Cihaz Satışı</span>
                </div>
                <div className={styles.legendNumbers}>
                  <span className={styles.legendPct}>%60</span>
                  <span className={styles.legendAmount}>₺7.500</span>
                </div>
              </div>

              <div className={styles.legendItem}>
                <div className={styles.legendLabelWrap}>
                  <span className={styles.legendColorDot} style={{ background: '#f59e0b' }}></span>
                  <span>Aksesuar Satışı</span>
                </div>
                <div className={styles.legendNumbers}>
                  <span className={styles.legendPct}>%12</span>
                  <span className={styles.legendAmount}>₺1.500</span>
                </div>
              </div>

              <div className={styles.legendItem}>
                <div className={styles.legendLabelWrap}>
                  <span className={styles.legendColorDot} style={{ background: '#f43f5e' }}></span>
                  <span>Teknik Servis</span>
                </div>
                <div className={styles.legendNumbers}>
                  <span className={styles.legendPct}>%16</span>
                  <span className={styles.legendAmount}>₺2.000</span>
                </div>
              </div>

              <div className={styles.legendItem}>
                <div className={styles.legendLabelWrap}>
                  <span className={styles.legendColorDot} style={{ background: '#0284c7' }}></span>
                  <span>Hizmet / Diğer</span>
                </div>
                <div className={styles.legendNumbers}>
                  <span className={styles.legendPct}>%8</span>
                  <span className={styles.legendAmount}>₺1.000</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── ROW 2: 3 Analysis Donut Cards ── */}
      <div className={styles.row2Grid}>
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
              <select className={styles.miniSelect} defaultValue="Bu Yıl">
                <option value="Bu Yıl">Bu Yıl</option>
                <option value="Bu Ay">Bu Ay</option>
              </select>
            </div>
          </div>

          <div className={styles.miniDonutWithLegend}>
            <SvgDonut
              size={120}
              strokeWidth={18}
              slices={patientSourceSlices}
              centerValue="34"
              centerLabel="Toplam Hasta"
            />

            <div className={styles.legendList} style={{ gap: 6 }}>
              {[
                { label: 'Google', count: 14, pct: 41, color: '#3b82f6' },
                { label: 'Referans', count: 8, pct: 24, color: '#10b981' },
                { label: 'Doktor Yönlendirmesi', count: 6, pct: 18, color: '#f87171' },
                { label: 'Sosyal Medya', count: 4, pct: 12, color: '#38bdf8' },
                { label: 'Diğer', count: 2, pct: 6, color: '#94a3b8' }
              ].map(item => (
                <div key={item.label} className={styles.legendItem}>
                  <div className={styles.legendLabelWrap}>
                    <span className={styles.legendColorDot} style={{ background: item.color }}></span>
                    <span style={{ fontSize: 11 }}>{item.label}</span>
                  </div>
                  <div className={styles.legendNumbers} style={{ gap: 8 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#0f172a' }}>{item.count}</span>
                    <span className={styles.legendPct} style={{ fontSize: 10 }}>%{item.pct}</span>
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
              <select className={styles.miniSelect} defaultValue="Bu Yıl">
                <option value="Bu Yıl">Bu Yıl</option>
                <option value="Bu Ay">Bu Ay</option>
              </select>
            </div>
          </div>

          <div className={styles.miniDonutWithLegend}>
            <SvgDonut
              size={120}
              strokeWidth={18}
              slices={appointmentStatusSlices}
              centerValue="52"
              centerLabel="Toplam Randevu"
            />

            <div className={styles.legendList} style={{ gap: 6 }}>
              {[
                { label: 'Tamamlanan', count: 38, pct: 73, color: '#10b981' },
                { label: 'Bekleyen', count: 7, pct: 13, color: '#f59e0b' },
                { label: 'İptal Edilen', count: 5, pct: 10, color: '#ef4444' },
                { label: 'Gelmedi', count: 2, pct: 4, color: '#64748b' }
              ].map(item => (
                <div key={item.label} className={styles.legendItem}>
                  <div className={styles.legendLabelWrap}>
                    <span className={styles.legendColorDot} style={{ background: item.color }}></span>
                    <span style={{ fontSize: 11 }}>{item.label}</span>
                  </div>
                  <div className={styles.legendNumbers} style={{ gap: 8 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#0f172a' }}>{item.count}</span>
                    <span className={styles.legendPct} style={{ fontSize: 10 }}>%{item.pct}</span>
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
              <select className={styles.miniSelect} defaultValue="Bu Yıl">
                <option value="Bu Yıl">Bu Yıl</option>
                <option value="Bu Ay">Bu Ay</option>
              </select>
            </div>
          </div>

          <div className={styles.miniDonutWithLegend}>
            <SvgDonut
              size={120}
              strokeWidth={18}
              slices={serviceStatusSlices}
              centerValue="24"
              centerLabel="Toplam Servis"
            />

            <div className={styles.legendList} style={{ gap: 6 }}>
              {[
                { label: 'Teslim Edildi', count: 12, pct: 50, color: '#10b981' },
                { label: 'Tamir Ediliyor', count: 6, pct: 25, color: '#14b8a6' },
                { label: 'İnceleniyor', count: 4, pct: 17, color: '#0ea5e9' },
                { label: 'Arızalı / Beklemede', count: 2, pct: 8, color: '#f87171' }
              ].map(item => (
                <div key={item.label} className={styles.legendItem}>
                  <div className={styles.legendLabelWrap}>
                    <span className={styles.legendColorDot} style={{ background: item.color }}></span>
                    <span style={{ fontSize: 11 }}>{item.label}</span>
                  </div>
                  <div className={styles.legendNumbers} style={{ gap: 8 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#0f172a' }}>{item.count}</span>
                    <span className={styles.legendPct} style={{ fontSize: 10 }}>%{item.pct}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── ROW 3: 2 Performance Tables Grid ── */}
      <div className={styles.row3Grid}>
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
              <select className={styles.miniSelect} defaultValue="Bu Yıl">
                <option value="Bu Yıl">Bu Yıl</option>
                <option value="Son 6 Ay">Son 6 Ay</option>
                <option value="Bu Ay">Bu Ay</option>
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
              <select className={styles.miniSelect} defaultValue="Bu Yıl">
                <option value="Bu Yıl">Bu Yıl</option>
                <option value="Son 6 Ay">Son 6 Ay</option>
                <option value="Bu Ay">Bu Ay</option>
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
                <th style={{ textAlign: 'right' }}>MEMNUNİYET</th>
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
                  <td style={{ textAlign: 'right' }}>
                    <div className={styles.progressBarTrack}>
                      <div className={styles.progressBarFill} style={{ width: `${b.satisfaction}%` }}></div>
                    </div>
                    <span style={{ fontSize: 11, color: '#64748b' }}>%{b.satisfaction}</span>
                  </td>
                </tr>
              ))}
              <tr className={styles.tableTotalRow}>
                <td>Toplam</td>
                <td style={{ textAlign: 'center' }}>34</td>
                <td style={{ textAlign: 'center' }}>52</td>
                <td style={{ textAlign: 'right' }}>₺12.500</td>
                <td style={{ textAlign: 'center' }}>24</td>
                <td style={{ textAlign: 'right' }}>%91</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

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
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>2026 Yılı (Oca - Ara)</div>
                </div>
                <div style={{ background: '#f8fafc', padding: 12, borderRadius: 8 }}>
                  <div style={{ fontSize: 11, color: '#64748b' }}>B Dönemi (Geçmiş)</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>2025 Yılı (Oca - Ara)</div>
                </div>
              </div>

              <table className={styles.perfTable}>
                <thead>
                  <tr>
                    <th>METRİK</th>
                    <th style={{ textAlign: 'right' }}>2026</th>
                    <th style={{ textAlign: 'right' }}>2025</th>
                    <th style={{ textAlign: 'right' }}>DEĞİŞİM</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ fontWeight: 600 }}>Toplam Ciro</td>
                    <td style={{ textAlign: 'right', fontWeight: 600 }}>₺12.500</td>
                    <td style={{ textAlign: 'right' }}>₺10.590</td>
                    <td style={{ textAlign: 'right', color: '#16a34a', fontWeight: 700 }}>+ %18</td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 600 }}>Toplam Hasta</td>
                    <td style={{ textAlign: 'right', fontWeight: 600 }}>34</td>
                    <td style={{ textAlign: 'right' }}>30</td>
                    <td style={{ textAlign: 'right', color: '#16a34a', fontWeight: 700 }}>+ %12</td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 600 }}>Cihaz Satışı</td>
                    <td style={{ textAlign: 'right', fontWeight: 600 }}>18 Adet</td>
                    <td style={{ textAlign: 'right' }}>14 Adet</td>
                    <td style={{ textAlign: 'right', color: '#16a34a', fontWeight: 700 }}>+ %28</td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 600 }}>Teknik Servis Geliri</td>
                    <td style={{ textAlign: 'right', fontWeight: 600 }}>₺3.250</td>
                    <td style={{ textAlign: 'right' }}>₺3.610</td>
                    <td style={{ textAlign: 'right', color: '#dc2626', fontWeight: 700 }}>- %10</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className={styles.modalFooter}>
              <button type="button" className={styles.btnSecondaryAction} onClick={() => setShowCompareModal(false)}>Kapat</button>
              <button
                type="button"
                className={styles.btnPrimaryAction}
                onClick={() => {
                  addToast({ type: 'success', message: 'Karşılaştırma raporu indirildi.' });
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
                {[
                  { label: 'Bugün', val: '29.09.2026 - 29.09.2026' },
                  { label: 'Bu Hafta', val: '22.09.2026 - 29.09.2026' },
                  { label: 'Bu Ay', val: '01.09.2026 - 30.09.2026' },
                  { label: 'Son 3 Ay', val: '01.07.2026 - 30.09.2026' },
                  { label: 'Bu Yıl (2026)', val: '01.01.2026 - 31.12.2026' },
                  { label: 'Geçen Yıl (2025)', val: '01.01.2025 - 31.12.2025' }
                ].map(opt => (
                  <button
                    key={opt.label}
                    type="button"
                    className={styles.btnSecondaryAction}
                    style={{ fontSize: 12, padding: '10px 8px' }}
                    onClick={() => {
                      setDateRange(opt.val);
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
