'use client';

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import styles from './DashboardPage.module.css';

export default function DashboardPage() {
  const { setCurrentPage, addToast } = useApp();

  const [activeTimeRange, setActiveTimeRange] = useState<'Bugün' | 'Bu Hafta' | 'Bu Ay' | 'Bu Yıl'>('Bu Ay');
  const [dateRangeText, setDateRangeText] = useState('01.09.2026 - 30.09.2026');
  const [showDateModal, setShowDateModal] = useState(false);

  // Month bars data for Aylık Ciro Trendi (Max scale 15K)
  const monthlyData = [
    { month: 'Oca', value: 3.5, height: 23 },
    { month: 'Şub', value: 4.8, height: 32 },
    { month: 'Mar', value: 6.2, height: 41 },
    { month: 'Nis', value: 7.9, height: 53 },
    { month: 'May', value: 8.5, height: 57 },
    { month: 'Haz', value: 7.2, height: 48 },
    { month: 'Tem', value: 9.1, height: 61 },
    { month: 'Ağu', value: 10.4, height: 69 },
    { month: 'Eyl', value: 12.5, height: 83, isCurrent: true },
    { month: 'Eki', value: 9.8, height: 65 },
    { month: 'Kas', value: 8.6, height: 57 },
    { month: 'Ara', value: 6.9, height: 46 },
  ];

  // Helper to calculate SVG donut slice offsets
  // Circumference for r=38 is 2 * PI * 38 = 238.76
  const cRadius = 38;
  const circ = 2 * Math.PI * cRadius;

  // Randevu Durumu: Total 52
  // Tamamlanan: 38 (73.08%), Bekleyen: 8 (15.38%), İptal: 4 (7.69%), Gelmedi: 2 (3.85%)
  const apptSlices = [
    { label: 'Tamamlanan', count: 38, percent: 73, color: '#08785B', length: circ * 0.7308 },
    { label: 'Bekleyen', count: 8, percent: 15, color: '#2563EB', length: circ * 0.1538 },
    { label: 'İptal Edilen', count: 4, percent: 8, color: '#F97316', length: circ * 0.0769 },
    { label: 'Gelmedi', count: 2, percent: 4, color: '#9CA3AF', length: circ * 0.0385 },
  ];

  // Hasta Kaynak Dağılımı: Total 18
  // Referans: 8 (44.4%), Web Site: 4 (22.2%), Walk-in: 3 (16.7%), Doktor: 3 (16.7%)
  const sourceSlices = [
    { label: 'Referans', count: 8, percent: 44, color: '#08785B', length: circ * 0.444 },
    { label: 'Web Site', count: 4, percent: 22, color: '#2563EB', length: circ * 0.222 },
    { label: 'Walk-in', count: 3, percent: 17, color: '#F97316', length: circ * 0.167 },
    { label: 'Doktor Yönlendirme', count: 3, percent: 17, color: '#8B5CF6', length: circ * 0.167 },
  ];

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
            onClick={() => setShowDateModal(true)}
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
                  setActiveTimeRange(pill);
                  if (pill === 'Bugün') setDateRangeText('29.09.2026 - 29.09.2026');
                  else if (pill === 'Bu Hafta') setDateRangeText('23.09.2026 - 29.09.2026');
                  else if (pill === 'Bu Ay') setDateRangeText('01.09.2026 - 30.09.2026');
                  else if (pill === 'Bu Yıl') setDateRangeText('01.01.2026 - 31.12.2026');
                  addToast({ type: 'info', message: `Zaman aralığı: ${pill} seçildi` });
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
            <span className={styles.statValue}>₺12.500</span>
            <div className={styles.statTrend}>
              <span className={styles.trendGreen}>↑ %12</span>
              <span className={styles.trendSub}>geçen aya göre</span>
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
            <span className={styles.statValue}>52</span>
            <div className={styles.statTrend}>
              <span className={styles.trendGreen}>↑ %8</span>
              <span className={styles.trendSub}>geçen aya göre</span>
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
            <span className={styles.statValue}>18</span>
            <div className={styles.statTrend}>
              <span className={styles.trendGreen}>↑ %28</span>
              <span className={styles.trendSub}>geçen aya göre</span>
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
            <span className={styles.statValue}>12</span>
            <div className={styles.statTrend}>
              <span className={styles.trendGreen}>↑ %20</span>
              <span className={styles.trendSub}>geçen aya göre</span>
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
            <span className={styles.statValue}>6</span>
            <div className={styles.statTrend}>
              <span className={styles.trendRed}>↓ %14</span>
              <span className={styles.trendSub}>geçen aya göre</span>
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
            <select className={styles.miniSelect} defaultValue="Ciro">
              <option value="Ciro">Ciro</option>
              <option value="Adet">Adet</option>
            </select>
          </div>

          <div className={styles.barChartWrap}>
            {/* Tooltip Bubble */}
            <div className={styles.tooltipBubble}>
              <div className={styles.tooltipMonth}>Eylül 2026</div>
              <div className={styles.tooltipValue}>₺12.500</div>
            </div>

            <svg className={styles.barChartSvg} viewBox="0 0 460 140" preserveAspectRatio="none">
              {/* Grid lines and Y axis */}
              <text x="28" y="15" fill="#9CA3AF" fontSize="9" textAnchor="end">15K ₺</text>
              <line x1="34" y1="12" x2="450" y2="12" stroke="#F3F4F6" strokeWidth="1" strokeDasharray="2,2" />

              <text x="28" y="42" fill="#9CA3AF" fontSize="9" textAnchor="end">12K ₺</text>
              <line x1="34" y1="39" x2="450" y2="39" stroke="#F3F4F6" strokeWidth="1" strokeDasharray="2,2" />

              <text x="28" y="69" fill="#9CA3AF" fontSize="9" textAnchor="end">9K ₺</text>
              <line x1="34" y1="66" x2="450" y2="66" stroke="#F3F4F6" strokeWidth="1" strokeDasharray="2,2" />

              <text x="28" y="96" fill="#9CA3AF" fontSize="9" textAnchor="end">6K ₺</text>
              <line x1="34" y1="93" x2="450" y2="93" stroke="#F3F4F6" strokeWidth="1" strokeDasharray="2,2" />

              <text x="28" y="122" fill="#9CA3AF" fontSize="9" textAnchor="end">0 ₺</text>
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
            <select className={styles.miniSelect} defaultValue="Bu Ay">
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
                <span className={styles.donutBigVal}>52</span>
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
            <select className={styles.miniSelect} defaultValue="Bu Ay">
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
                <span className={styles.donutBigVal}>18</span>
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
              <tr>
                <td>
                  <div className={styles.branchCell}>
                    <span className={styles.branchIconBox} style={{ background: '#EFF6FF', color: '#2563EB' }}>
                      🏢
                    </span>
                    <span>Merkez</span>
                  </div>
                </td>
                <td style={{ fontWeight: 700, color: '#111827' }}>₺8.250</td>
                <td>12</td>
                <td>28</td>
                <td>8</td>
                <td>3</td>
                <td style={{ textAlign: 'right', color: '#08785B', fontWeight: 600 }}>↑ %15</td>
              </tr>
              <tr>
                <td>
                  <div className={styles.branchCell}>
                    <span className={styles.branchIconBox} style={{ background: '#E6F7F2', color: '#08785B' }}>
                      🏢
                    </span>
                    <span>Çankaya</span>
                  </div>
                </td>
                <td style={{ fontWeight: 700, color: '#111827' }}>₺3.750</td>
                <td>5</td>
                <td>16</td>
                <td>3</td>
                <td>2</td>
                <td style={{ textAlign: 'right', color: '#08785B', fontWeight: 600 }}>↑ %9</td>
              </tr>
              <tr>
                <td>
                  <div className={styles.branchCell}>
                    <span className={styles.branchIconBox} style={{ background: '#FFF7ED', color: '#EA580C' }}>
                      🏢
                    </span>
                    <span>Kadıköy</span>
                  </div>
                </td>
                <td style={{ fontWeight: 700, color: '#111827' }}>₺500</td>
                <td>1</td>
                <td>8</td>
                <td>1</td>
                <td>1</td>
                <td style={{ textAlign: 'right', color: '#DC2626', fontWeight: 600 }}>↓ %12</td>
              </tr>
            </tbody>
            <tfoot>
              <tr>
                <td>Toplam</td>
                <td>₺12.500</td>
                <td>18</td>
                <td>52</td>
                <td>12</td>
                <td>6</td>
                <td style={{ textAlign: 'right', color: '#08785B' }}>↑ %12</td>
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
            {/* Row 1 */}
            <div className={styles.apptRow}>
              <span className={styles.apptTime}>09:30</span>
              <div className={styles.apptPatient}>
                <span style={{ color: '#EA580C' }}>👤</span>
                <span>Ayşe Yılmaz</span>
              </div>
              <span className={`${styles.apptBadge} ${styles.badgeWaiting}`}>Bekliyor</span>
              <div className={styles.apptMeta}>
                <span>Merkez</span>
                <span>Kontrol</span>
              </div>
            </div>

            {/* Row 2 */}
            <div className={styles.apptRow}>
              <span className={styles.apptTime}>10:15</span>
              <div className={styles.apptPatient}>
                <span style={{ color: '#EA580C' }}>👤</span>
                <span>Mehmet Kaya</span>
              </div>
              <span className={`${styles.apptBadge} ${styles.badgeArrived}`}>Geldi</span>
              <div className={styles.apptMeta}>
                <span>Çankaya</span>
                <span>Cihaz Ayarı</span>
              </div>
            </div>

            {/* Row 3 */}
            <div className={styles.apptRow}>
              <span className={styles.apptTime}>11:00</span>
              <div className={styles.apptPatient}>
                <span style={{ color: '#8B5CF6' }}>👤</span>
                <span>Elif Demir</span>
              </div>
              <span className={`${styles.apptBadge} ${styles.badgeArrived}`}>Geldi</span>
              <div className={styles.apptMeta}>
                <span>Merkez</span>
                <span>İlk Muayene</span>
              </div>
            </div>

            {/* Row 4 */}
            <div className={styles.apptRow}>
              <span className={styles.apptTime}>13:30</span>
              <div className={styles.apptPatient}>
                <span style={{ color: '#08785B' }}>👤</span>
                <span>Zeynep Güneş</span>
              </div>
              <span className={`${styles.apptBadge} ${styles.badgeNeutral}`}>Beklemede</span>
              <div className={styles.apptMeta}>
                <span>Kadıköy</span>
                <span>Cihaz Teslimi</span>
              </div>
            </div>

            {/* Row 5 */}
            <div className={styles.apptRow}>
              <span className={styles.apptTime}>15:00</span>
              <div className={styles.apptPatient}>
                <span style={{ color: '#2563EB' }}>👤</span>
                <span>Ali Veli</span>
              </div>
              <span className={`${styles.apptBadge} ${styles.badgePlanned}`}>Planlandı</span>
              <div className={styles.apptMeta}>
                <span>Merkez</span>
                <span>Kontrol</span>
              </div>
            </div>
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
              <span className={styles.serviceVal}>1</span>
              <span className={styles.serviceLabel}>Bekleyen</span>
            </div>

            <div className={`${styles.serviceMiniCard} ${styles.servCardYellow}`}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3"></circle>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
              </svg>
              <span className={styles.serviceVal}>2</span>
              <span className={styles.serviceLabel}>İnceleniyor</span>
            </div>

            <div className={`${styles.serviceMiniCard} ${styles.servCardBlue}`}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path>
              </svg>
              <span className={styles.serviceVal}>1</span>
              <span className={styles.serviceLabel}>Tamir Ediliyor</span>
            </div>

            <div className={`${styles.serviceMiniCard} ${styles.servCardGreen}`}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
              </svg>
              <span className={styles.serviceVal}>2</span>
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
              <tr>
                <td style={{ fontSize: '11px', color: '#6B7280', whiteSpace: 'nowrap' }}>29.09.2026 13:47</td>
                <td>
                  <div className={styles.actionItemCell}>
                    <span style={{ color: '#08785B' }}>🛒</span>
                    <span>Satış Ekleme</span>
                  </div>
                </td>
                <td style={{ fontSize: '11px', color: '#6B7280' }}>Satış: 559fecee-c123-4220-88bb-00edc98873fc</td>
                <td style={{ fontWeight: 600, color: '#111827' }}>Ahmet Yılmaz</td>
              </tr>
              <tr>
                <td style={{ fontSize: '11px', color: '#6B7280', whiteSpace: 'nowrap' }}>29.09.2026 12:11</td>
                <td>
                  <div className={styles.actionItemCell}>
                    <span style={{ color: '#EA580C' }}>📅</span>
                    <span>Randevu Güncelleme</span>
                  </div>
                </td>
                <td style={{ fontSize: '11px', color: '#6B7280' }}>Randevu #1245 tarihi değiştirildi</td>
                <td style={{ fontWeight: 600, color: '#111827' }}>Zeynep Kaya</td>
              </tr>
              <tr>
                <td style={{ fontSize: '11px', color: '#6B7280', whiteSpace: 'nowrap' }}>28.09.2026 17:06</td>
                <td>
                  <div className={styles.actionItemCell}>
                    <span style={{ color: '#2563EB' }}>👤</span>
                    <span>Hasta Güncelleme</span>
                  </div>
                </td>
                <td style={{ fontSize: '11px', color: '#6B7280' }}>Hasta bilgileri güncellendi</td>
                <td style={{ fontWeight: 600, color: '#111827' }}>Mehmet Kaya</td>
              </tr>
              <tr>
                <td style={{ fontSize: '11px', color: '#6B7280', whiteSpace: 'nowrap' }}>28.09.2026 15:22</td>
                <td>
                  <div className={styles.actionItemCell}>
                    <span style={{ color: '#08785B' }}>💵</span>
                    <span>Ödeme Ekleme</span>
                  </div>
                </td>
                <td style={{ fontSize: '11px', color: '#6B7280' }}>Tahsilat #785 - ₺2.500 (Nakit)</td>
                <td style={{ fontWeight: 600, color: '#111827' }}>Elif Demir</td>
              </tr>
              <tr>
                <td style={{ fontSize: '11px', color: '#6B7280', whiteSpace: 'nowrap' }}>27.09.2026 11:45</td>
                <td>
                  <div className={styles.actionItemCell}>
                    <span style={{ color: '#EA580C' }}>📦</span>
                    <span>Cihaz Ekleme</span>
                  </div>
                </td>
                <td style={{ fontSize: '11px', color: '#6B7280' }}>Cihaz: Oticon More 1 (SN: 9876543210)</td>
                <td style={{ fontWeight: 600, color: '#111827' }}>Ahmet Yılmaz</td>
              </tr>
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
                {['Bugün', 'Son 7 Gün', 'Bu Ay (Eylül 2026)', 'Son 3 Ay', 'Bu Yıl (2026)', 'Tüm Zamanlar'].map((rangeOption) => (
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
                      if (rangeOption.includes('Bu Ay')) {
                        setDateRangeText('01.09.2026 - 30.09.2026');
                      } else if (rangeOption === 'Son 7 Gün') {
                        setDateRangeText('23.09.2026 - 30.09.2026');
                      } else {
                        setDateRangeText(rangeOption);
                      }
                      setShowDateModal(false);
                      addToast({ type: 'info', message: `Tarih aralığı güncellendi: ${rangeOption}` });
                    }}
                  >
                    {rangeOption}
                  </button>
                ))}
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
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
