'use client';

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useBranchScope } from '../hooks/useBranchScope';
import styles from './BranchActivitiesPage.module.css';

interface TransferLogItem {
  id: string;
  date: string;
  patientName: string;
  fromBranch: string;
  toBranch: string;
  transferredBy: string;
  status: 'Tamamlandı' | 'İptal Edildi';
  transferType?: 'Cihaz Satışı' | 'Randevu Transferi' | 'Teknik Servis' | 'Diğer';
  notes?: string;
}

// ── Pure SVG Donut Component ──
function SvgDonut({
  size = 130,
  strokeWidth = 20,
  slices,
  centerValue,
  centerLabel
}: {
  size?: number;
  strokeWidth?: number;
  slices: { value: number; color: string; label: string }[];
  centerValue: string | number;
  centerLabel: string;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const total = slices.reduce((acc, s) => acc + s.value, 0) || 1;

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
              />
            );
          })}
        </g>
      </svg>
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
        <span style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a', lineHeight: 1.1 }}>
          {centerValue}
        </span>
        <span style={{ fontSize: '10px', color: '#64748b', marginTop: 2, textAlign: 'center' }}>
          {centerLabel}
        </span>
      </div>
    </div>
  );
}

const INITIAL_TRANSFERS: TransferLogItem[] = [
  {
    id: 'trf-1',
    date: '29.09.2026',
    patientName: 'Ayşe Yılmaz',
    fromBranch: 'Merkez',
    toBranch: 'Çankaya',
    transferredBy: 'Ahmet Yılmaz',
    status: 'Tamamlandı',
    transferType: 'Cihaz Satışı',
    notes: 'Hasta Ankara ikametine taşındı, cihaz takip dosyası aktarıldı.'
  },
  {
    id: 'trf-2',
    date: '26.09.2026',
    patientName: 'Mehmet Kaya',
    fromBranch: 'Kadıköy',
    toBranch: 'Merkez',
    transferredBy: 'Zeynep Kaya',
    status: 'Tamamlandı',
    transferType: 'Randevu Transferi',
    notes: 'Kapsamlı odyometrik test için merkez laboratuvarına yönlendirildi.'
  },
  {
    id: 'trf-3',
    date: '24.09.2026',
    patientName: 'Elif Demir',
    fromBranch: 'Çankaya',
    toBranch: 'Kadıköy',
    transferredBy: 'Mehmet Arslan',
    status: 'Tamamlandı',
    transferType: 'Teknik Servis',
    notes: 'Kalıp revizyonu ve teknik servis bakımı için şube transferi.'
  },
  {
    id: 'trf-4',
    date: '21.09.2026',
    patientName: 'Ali Veli',
    fromBranch: 'Merkez',
    toBranch: 'Çankaya',
    transferredBy: 'Ahmet Yılmaz',
    status: 'İptal Edildi',
    transferType: 'Cihaz Satışı',
    notes: 'Hasta talebi üzerine transfer işlemi iptal edildi.'
  },
  {
    id: 'trf-5',
    date: '18.09.2026',
    patientName: 'Zeynep Güneş',
    fromBranch: 'Kadıköy',
    toBranch: 'Merkez',
    transferredBy: 'Selin Ak',
    status: 'Tamamlandı',
    transferType: 'Diğer',
    notes: 'SGK reçete takibi ve evrak tamamlama.'
  }
];

export default function BranchActivitiesPage() {
  const { addToast } = useApp();
  const { matches } = useBranchScope();

  // State Management
  const [dateRange, setDateRange] = useState('01.01.2026 - 30.09.2026');
  const [transfers, setTransfers] = useState<TransferLogItem[]>(INITIAL_TRANSFERS);
  const [transferMatrixTab, setTransferMatrixTab] = useState<'Şubeler Arası' | 'Giden / Gelen'>('Şubeler Arası');

  // Quick Transfer Form State
  const [searchPatientText, setSearchPatientText] = useState('');
  const [sourceBranch, setSourceBranch] = useState('Merkez');
  const [targetBranch, setTargetBranch] = useState('Çankaya');

  // Modals state
  const [showNewTransferModal, setShowNewTransferModal] = useState(false);
  const [selectedTransferDetail, setSelectedTransferDetail] = useState<TransferLogItem | null>(null);
  const [showDateModal, setShowDateModal] = useState(false);

  // New Transfer Form Modal State
  const [modalPatientName, setModalPatientName] = useState('');
  const [modalSourceBranch, setModalSourceBranch] = useState('Merkez');
  const [modalTargetBranch, setModalTargetBranch] = useState('Çankaya');
  const [modalTransferType, setModalTransferType] = useState<TransferLogItem['transferType']>('Cihaz Satışı');
  const [modalNotes, setModalNotes] = useState('');

  // Transfer Types Donut Slices
  const transferTypeSlices = [
    { label: 'Cihaz Satışı', value: 7, color: '#0d9488' },
    { label: 'Randevu Transferi', value: 3, color: '#0284c7' },
    { label: 'Teknik Servis', value: 1, color: '#f59e0b' },
    { label: 'Diğer', value: 1, color: '#94a3b8' }
  ];

  // Quick Swap Branches
  const handleSwapBranches = () => {
    const temp = sourceBranch;
    setSourceBranch(targetBranch);
    setTargetBranch(temp);
  };

  // Submit Quick Transfer
  const handleQuickTransferSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchPatientText.trim()) {
      addToast({ type: 'error', message: 'Lütfen transfer edilecek hasta adını girin.' });
      return;
    }
    if (sourceBranch === targetBranch) {
      addToast({ type: 'error', message: 'Kaynak şube ile hedef şube aynı olamaz.' });
      return;
    }

    const newTrf: TransferLogItem = {
      id: `trf-${Date.now()}`,
      date: new Date().toLocaleDateString('tr-TR'),
      patientName: searchPatientText.trim(),
      fromBranch: sourceBranch,
      toBranch: targetBranch,
      transferredBy: 'Ahmet Yılmaz',
      status: 'Tamamlandı',
      transferType: 'Cihaz Satışı',
      notes: `${sourceBranch} şubesinden ${targetBranch} şubesine hızlı dosya transferi yapıldı.`
    };

    setTransfers([newTrf, ...transfers]);
    setSearchPatientText('');
    addToast({
      type: 'success',
      message: `${newTrf.patientName} adlı hastanın dosyası ${sourceBranch} ➜ ${targetBranch} şubesine transfer edildi.`
    });
  };

  // Submit Modal Transfer
  const handleModalTransferSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalPatientName.trim()) {
      addToast({ type: 'error', message: 'Lütfen hasta adını girin.' });
      return;
    }
    if (modalSourceBranch === modalTargetBranch) {
      addToast({ type: 'error', message: 'Kaynak şube ile hedef şube aynı olamaz.' });
      return;
    }

    const newTrf: TransferLogItem = {
      id: `trf-${Date.now()}`,
      date: new Date().toLocaleDateString('tr-TR'),
      patientName: modalPatientName.trim(),
      fromBranch: modalSourceBranch,
      toBranch: modalTargetBranch,
      transferredBy: 'Ahmet Yılmaz',
      status: 'Tamamlandı',
      transferType: modalTransferType,
      notes: modalNotes || 'Şubeler arası hasta ve cihaz dosyası transferi gerçekleştirildi.'
    };

    setTransfers([newTrf, ...transfers]);
    setShowNewTransferModal(false);
    setModalPatientName('');
    setModalNotes('');
    addToast({
      type: 'success',
      message: `${newTrf.patientName} transfer işlemi başarıyla tamamlandı.`
    });
  };

  return (
    <div className={styles.branchActivitiesPage}>
      {/* ── Breadcrumb ── */}
      <div className={styles.breadcrumb}>
        <span>Şube Aktiviteleri</span>
        <span>&gt;</span>
        <span>&gt;</span>
        <span style={{ color: '#334155', fontWeight: 500 }}>Şube Performansı</span>
      </div>

      {/* ── Page Heading ── */}
      <div className={styles.pageHeading}>
        <div className={styles.headingCopy}>
          <div className={styles.headingIcon}>
            {/* Branch Transfer Icon */}
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 3h5v5"></path>
              <path d="M4 20L21 3"></path>
              <path d="M21 16v5h-5"></path>
              <path d="M15 15l6 6"></path>
              <path d="M4 4l5 5"></path>
            </svg>
          </div>
          <div>
            <h1>Şube Aktiviteleri</h1>
            <p>Şubeler arası hasta transferlerini, karşılaştırmaları, performans verilerini ve hareket geçmişini takip edin.</p>
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
            className={styles.btnPrimaryAction}
            onClick={() => setShowNewTransferModal(true)}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            Hasta Transfer Et
          </button>
        </div>
      </div>

      {/* ── 4 Stat Cards in 1 Row ── */}
      <div className={styles.statsGrid4}>
        {/* Card 1 */}
        <div className={styles.statCard}>
          <div className={`${styles.statIconBox} ${styles.statIconBoxGreen}`}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="12" y1="18" x2="12" y2="12"></line>
              <line x1="9" y1="15" x2="15" y2="15"></line>
            </svg>
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statLabel}>Toplam Transfer</span>
            <span className={styles.statValue}>12</span>
            <div className={styles.statTrend}>
              <span className={styles.trendGreen}>↑ %20</span>
              <span style={{ color: '#64748b' }}>geçen döneme göre</span>
            </div>
          </div>
        </div>

        {/* Card 2 */}
        <div className={styles.statCard}>
          <div className={`${styles.statIconBox} ${styles.statIconBoxBlue}`}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
              <circle cx="9" cy="7" r="4"></circle>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
            </svg>
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statLabel}>Transfer Edilen Hasta</span>
            <span className={styles.statValue}>18</span>
            <div className={styles.statTrend}>
              <span className={styles.trendGreen}>↑ %12</span>
              <span style={{ color: '#64748b' }}>geçen döneme göre</span>
            </div>
          </div>
        </div>

        {/* Card 3 */}
        <div className={styles.statCard}>
          <div className={`${styles.statIconBox} ${styles.statIconBoxOrange}`}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statLabel}>Transfer Cirosu</span>
            <span className={styles.statValue}>₺42.500</span>
            <div className={styles.statTrend}>
              <span className={styles.trendGreen}>↑ %35</span>
              <span style={{ color: '#64748b' }}>geçen döneme göre</span>
            </div>
          </div>
        </div>

        {/* Card 4 */}
        <div className={styles.statCard}>
          <div className={`${styles.statIconBox} ${styles.statIconBoxPurple}`}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="17 1 21 5 17 9"></polyline>
              <path d="M3 11V9a4 4 0 0 1 4-4h14"></path>
              <polyline points="7 23 3 19 7 15"></polyline>
              <path d="M21 13v2a4 4 0 0 1-4 4H3"></path>
            </svg>
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statLabel}>En Yoğun Transfer</span>
            <span className={styles.statValueText}>Merkez ↔ Çankaya</span>
            <div className={styles.statTrend}>
              <span style={{ color: '#64748b' }}>8 hasta transferi</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── SECTION 1: 3 Branch Cards Grid ── */}
      <div className={styles.branchesGrid3}>
        {/* Card 1: Merkez */}
        <div className={styles.branchCard}>
          <div className={styles.branchHeaderRow}>
            <div className={styles.branchIdentity}>
              <img
                src="https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=100&auto=format&fit=crop&q=80"
                alt="Merkez"
                className={styles.branchThumbMini}
              />
              <div className={styles.branchTitleWrap}>
                <h3>Merkez</h3>
                <p>📍 İstanbul</p>
              </div>
            </div>
            <span className={styles.badgeActive}>● Aktif</span>
          </div>

          <div className={styles.branchMetricsRow}>
            <div className={styles.metricItem}>
              <span>Toplam Hasta</span>
              <strong>24</strong>
            </div>
            <div className={styles.metricItem}>
              <span>Toplam Ciro</span>
              <strong>₺32.000</strong>
            </div>
            <div className={styles.metricItem}>
              <span>Randevu</span>
              <strong>14</strong>
            </div>
            <div className={styles.metricItem}>
              <span>Transfer (Giden)</span>
              <strong>6</strong>
            </div>
            <div className={styles.metricItem}>
              <span>Transfer (Gelen)</span>
              <strong>3</strong>
            </div>
          </div>

          <div className={styles.miniChartContainer}>
            {[
              { m: 'Oca', h: 30 },
              { m: 'Şub', h: 42 },
              { m: 'Mar', h: 38 },
              { m: 'Nis', h: 50 },
              { m: 'May', h: 58 },
              { m: 'Haz', h: 68 },
              { m: 'Tem', h: 46 },
              { m: 'Ağu', h: 60 },
              { m: 'Eyl', h: 95, tooltip: true }
            ].map(col => (
              <div key={col.m} className={styles.miniBarTrack}>
                {col.tooltip && (
                  <div className={styles.miniTooltipBubble}>
                    <div>Eyl 2026</div>
                    <div>₺12.500</div>
                  </div>
                )}
                <div
                  className={styles.miniBarFill}
                  style={{ height: `${col.h}%`, background: '#10b981' }}
                ></div>
                <span className={styles.miniBarMonth}>{col.m}</span>
              </div>
            ))}
            <button type="button" className={styles.btnNextChart} title="İleri">
              ›
            </button>
          </div>
        </div>

        {/* Card 2: Çankaya */}
        <div className={styles.branchCard}>
          <div className={styles.branchHeaderRow}>
            <div className={styles.branchIdentity}>
              <img
                src="https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=100&auto=format&fit=crop&q=80"
                alt="Çankaya"
                className={styles.branchThumbMini}
              />
              <div className={styles.branchTitleWrap}>
                <h3>Çankaya</h3>
                <p>📍 Ankara</p>
              </div>
            </div>
            <span className={styles.badgeActive}>● Aktif</span>
          </div>

          <div className={styles.branchMetricsRow}>
            <div className={styles.metricItem}>
              <span>Toplam Hasta</span>
              <strong>18</strong>
            </div>
            <div className={styles.metricItem}>
              <span>Toplam Ciro</span>
              <strong>₺18.750</strong>
            </div>
            <div className={styles.metricItem}>
              <span>Randevu</span>
              <strong>12</strong>
            </div>
            <div className={styles.metricItem}>
              <span>Transfer (Giden)</span>
              <strong>3</strong>
            </div>
            <div className={styles.metricItem}>
              <span>Transfer (Gelen)</span>
              <strong>5</strong>
            </div>
          </div>

          <div className={styles.miniChartContainer}>
            {[
              { m: 'Oca', h: 40 },
              { m: 'Şub', h: 35 },
              { m: 'Mar', h: 45 },
              { m: 'Nis', h: 55 },
              { m: 'May', h: 70 },
              { m: 'Haz', h: 60 },
              { m: 'Tem', h: 45 },
              { m: 'Ağu', h: 55 },
              { m: 'Eyl', h: 65 }
            ].map(col => (
              <div key={col.m} className={styles.miniBarTrack}>
                <div
                  className={styles.miniBarFill}
                  style={{ height: `${col.h}%`, background: '#38bdf8' }}
                ></div>
                <span className={styles.miniBarMonth}>{col.m}</span>
              </div>
            ))}
            <button type="button" className={styles.btnNextChart} title="İleri">
              ›
            </button>
          </div>
        </div>

        {/* Card 3: Kadıköy */}
        <div className={styles.branchCard}>
          <div className={styles.branchHeaderRow}>
            <div className={styles.branchIdentity}>
              <img
                src="https://images.unsplash.com/photo-1586773860418-d37222d8fce3?w=100&auto=format&fit=crop&q=80"
                alt="Kadıköy"
                className={styles.branchThumbMini}
              />
              <div className={styles.branchTitleWrap}>
                <h3>Kadıköy</h3>
                <p>📍 İstanbul</p>
              </div>
            </div>
            <span className={styles.badgeActive}>● Aktif</span>
          </div>

          <div className={styles.branchMetricsRow}>
            <div className={styles.metricItem}>
              <span>Toplam Hasta</span>
              <strong>12</strong>
            </div>
            <div className={styles.metricItem}>
              <span>Toplam Ciro</span>
              <strong>₺8.250</strong>
            </div>
            <div className={styles.metricItem}>
              <span>Randevu</span>
              <strong>8</strong>
            </div>
            <div className={styles.metricItem}>
              <span>Transfer (Giden)</span>
              <strong>3</strong>
            </div>
            <div className={styles.metricItem}>
              <span>Transfer (Gelen)</span>
              <strong>4</strong>
            </div>
          </div>

          <div className={styles.miniChartContainer}>
            {[
              { m: 'Oca', h: 30 },
              { m: 'Şub', h: 35 },
              { m: 'Mar', h: 40 },
              { m: 'Nis', h: 48 },
              { m: 'May', h: 60 },
              { m: 'Haz', h: 55 },
              { m: 'Tem', h: 40 },
              { m: 'Ağu', h: 50 },
              { m: 'Eyl', h: 60 }
            ].map(col => (
              <div key={col.m} className={styles.miniBarTrack}>
                <div
                  className={styles.miniBarFill}
                  style={{ height: `${col.h}%`, background: '#fb923c' }}
                ></div>
                <span className={styles.miniBarMonth}>{col.m}</span>
              </div>
            ))}
            <button type="button" className={styles.btnNextChart} title="İleri">
              ›
            </button>
          </div>
        </div>
      </div>

      {/* ── SECTION 2: Transfer Form (Left) & Transfer Matrix (Right) ── */}
      <div className={styles.section2Grid}>
        {/* Left: Quick Transfer */}
        <div className={styles.cardWhite}>
          <div className={styles.cardHeaderRow}>
            <div className={styles.cardTitleWrap}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#004d40" strokeWidth="2">
                <path d="M3 21h18"></path>
                <path d="M5 21V7l8-4v18"></path>
                <path d="M19 21V11l-6-3"></path>
              </svg>
              <h3>Şubeler Arası Hasta Transferi</h3>
            </div>
          </div>

          <form onSubmit={handleQuickTransferSubmit} className={styles.quickTransferBody}>
            <div>
              <label className={styles.formLabel}>Hasta Ara</label>
              <div className={styles.searchInputWrapper}>
                <svg className={styles.searchIcon} width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
                <input
                  type="text"
                  placeholder="Hasta adı, TC veya telefon no..."
                  className={styles.searchInput}
                  value={searchPatientText}
                  onChange={e => setSearchPatientText(e.target.value)}
                />
              </div>
            </div>

            <div className={styles.branchSwapRow}>
              <div className={styles.swapCol}>
                <label className={styles.formLabel}>Mevcut Şube</label>
                <select
                  className={styles.branchSelectWithIcon}
                  value={sourceBranch}
                  onChange={e => setSourceBranch(e.target.value)}
                >
                  <option value="Merkez">Merkez</option>
                  <option value="Çankaya">Çankaya</option>
                  <option value="Kadıköy">Kadıköy</option>
                </select>
              </div>

              <button
                type="button"
                className={styles.btnSwap}
                onClick={handleSwapBranches}
                title="Şubeleri Değiştir"
              >
                ⇄
              </button>

              <div className={styles.swapCol}>
                <label className={styles.formLabel}>Hedef Şube</label>
                <select
                  className={styles.branchSelectWithIcon}
                  value={targetBranch}
                  onChange={e => setTargetBranch(e.target.value)}
                >
                  <option value="Çankaya">Çankaya</option>
                  <option value="Merkez">Merkez</option>
                  <option value="Kadıköy">Kadıköy</option>
                </select>
              </div>
            </div>

            <button type="submit" className={styles.btnTransferSubmit}>
              ⇄ Hasta Dosyasını ve Kayıtlarını Transfer Et
            </button>
          </form>
        </div>

        {/* Right: Transfer Dağılımı Matrix */}
        <div className={styles.cardWhite}>
          <div className={styles.cardHeaderRow}>
            <div className={styles.cardTitleWrap}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#004d40" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
              </svg>
              <h3>Transfer Dağılımı</h3>
            </div>

            <div className={styles.cardControls}>
              <div className={styles.pillGroup}>
                <button
                  type="button"
                  className={`${styles.pillSmallBtn} ${transferMatrixTab === 'Şubeler Arası' ? styles.pillSmallBtnActive : ''}`}
                  onClick={() => setTransferMatrixTab('Şubeler Arası')}
                >
                  Şubeler Arası
                </button>
                <button
                  type="button"
                  className={`${styles.pillSmallBtn} ${transferMatrixTab === 'Giden / Gelen' ? styles.pillSmallBtnActive : ''}`}
                  onClick={() => setTransferMatrixTab('Giden / Gelen')}
                >
                  Giden / Gelen
                </button>
              </div>

              <select className={styles.miniSelect} defaultValue="Bu Yıl">
                <option value="Bu Yıl">Bu Yıl</option>
                <option value="Bu Ay">Bu Ay</option>
              </select>
            </div>
          </div>

          <table className={styles.matrixTable}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left' }}>Kaynak → Hedef</th>
                <th>Merkez</th>
                <th>Çankaya</th>
                <th>Kadıköy</th>
                <th>Toplam (Giden)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ textAlign: 'left', fontWeight: 600 }}>Merkez</td>
                <td style={{ color: '#94a3b8' }}>—</td>
                <td className={styles.matrixHighlightCell}>4</td>
                <td className={styles.matrixHighlightCell}>2</td>
                <td className={styles.matrixTotalCell}>6</td>
              </tr>
              <tr>
                <td style={{ textAlign: 'left', fontWeight: 600 }}>Çankaya</td>
                <td className={styles.matrixHighlightCell}>3</td>
                <td style={{ color: '#94a3b8' }}>—</td>
                <td className={styles.matrixHighlightCell}>1</td>
                <td className={styles.matrixTotalCell}>4</td>
              </tr>
              <tr>
                <td style={{ textAlign: 'left', fontWeight: 600 }}>Kadıköy</td>
                <td className={styles.matrixHighlightCell}>1</td>
                <td className={styles.matrixHighlightCell}>3</td>
                <td style={{ color: '#94a3b8' }}>—</td>
                <td className={styles.matrixTotalCell}>4</td>
              </tr>
              <tr style={{ background: '#f8fafc' }}>
                <td style={{ textAlign: 'left', fontWeight: 700 }}>Toplam (Gelen)</td>
                <td className={styles.matrixTotalCell}>4</td>
                <td className={styles.matrixTotalCell}>7</td>
                <td className={styles.matrixTotalCell}>3</td>
                <td style={{ color: '#94a3b8' }}>—</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* ── SECTION 3: Son Transferler Table & Transfer Tipleri Donut ── */}
      <div className={styles.section3Grid}>
        {/* Left: Son Transferler */}
        <div className={styles.cardWhite}>
          <div className={styles.cardHeaderRow}>
            <div className={styles.cardTitleWrap}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#004d40" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <line x1="16" y1="13" x2="8" y2="13"></line>
                <line x1="16" y1="17" x2="8" y2="17"></line>
              </svg>
              <h3>Son Transferler</h3>
            </div>

            <div className={styles.tableToolbarRight}>
              <select className={styles.miniSelect} defaultValue="Tümünü Gör">
                <option value="Tümünü Gör">Tümünü Gör ⌵</option>
                <option value="Tamamlananlar">Tamamlananlar</option>
                <option value="İptal Edilenler">İptal Edilenler</option>
              </select>
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table className={styles.transfersTable}>
              <thead>
                <tr>
                  <th>TARİH</th>
                  <th>HASTA</th>
                  <th>KAYNAK ŞUBE</th>
                  <th style={{ textAlign: 'center' }}>→</th>
                  <th>HEDEF ŞUBE</th>
                  <th>TRANSFER EDEN</th>
                  <th>DURUM</th>
                  <th style={{ textAlign: 'center' }}>İŞLEMLER</th>
                </tr>
              </thead>
              <tbody>
                {transfers.map(t => (
                  <tr key={t.id}>
                    <td>{t.date}</td>
                    <td style={{ fontWeight: 600, color: '#0f172a' }}>{t.patientName}</td>
                    <td>{t.fromBranch}</td>
                    <td style={{ textAlign: 'center', color: '#94a3b8' }}>→</td>
                    <td>{t.toBranch}</td>
                    <td style={{ color: '#475569' }}>{t.transferredBy}</td>
                    <td>
                      <span className={t.status === 'Tamamlandı' ? styles.badgeStatusSuccess : styles.badgeStatusDanger}>
                        {t.status}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <button
                        type="button"
                        className={styles.btnActionEye}
                        title="Detay Görüntüle"
                        onClick={() => setSelectedTransferDetail(t)}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                          <circle cx="12" cy="12" r="3"></circle>
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: Transfer Tipleri Donut */}
        <div className={styles.cardWhite}>
          <div className={styles.cardHeaderRow}>
            <div className={styles.cardTitleWrap}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#004d40" strokeWidth="2">
                <circle cx="12" cy="12" r="10"></circle>
                <path d="M12 2a10 10 0 0 1 10 10"></path>
              </svg>
              <h3>Transfer Tipleri</h3>
            </div>
          </div>

          <div className={styles.donutWithLegend}>
            <SvgDonut
              size={136}
              strokeWidth={20}
              slices={transferTypeSlices}
              centerValue="12"
              centerLabel="Transfer"
            />

            <div className={styles.legendList}>
              {[
                { label: 'Cihaz Satışı', count: 7, pct: 58, color: '#0d9488' },
                { label: 'Randevu Transferi', count: 3, pct: 25, color: '#0284c7' },
                { label: 'Teknik Servis', count: 1, pct: 8, color: '#f59e0b' },
                { label: 'Diğer', count: 1, pct: 8, color: '#94a3b8' }
              ].map(item => (
                <div key={item.label} className={styles.legendItem}>
                  <div className={styles.legendLabelWrap}>
                    <span className={styles.legendColorDot} style={{ background: item.color }}></span>
                    <span>{item.label}</span>
                  </div>
                  <div className={styles.legendNumbers}>
                    <span className={styles.legendAmount}>{item.count}</span>
                    <span className={styles.legendPct}>%{item.pct}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── MODAL 1: Hasta Transfer Et Modalı ── */}
      {showNewTransferModal && (
        <div className={styles.modalOverlay} onClick={() => setShowNewTransferModal(false)}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>🔄 Yeni Hasta Dosyası Transferi</h2>
              <button type="button" className={styles.modalCloseBtn} onClick={() => setShowNewTransferModal(false)}>✕</button>
            </div>
            <form onSubmit={handleModalTransferSubmit}>
              <div className={styles.modalBody}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Hasta Adı Soyadı *</label>
                  <input
                    type="text"
                    required
                    placeholder="Örn: Canan Yıldız"
                    className={styles.formInput}
                    value={modalPatientName}
                    onChange={e => setModalPatientName(e.target.value)}
                  />
                </div>

                <div className={styles.formGrid2}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Kaynak Şube</label>
                    <select
                      className={styles.formSelect}
                      value={modalSourceBranch}
                      onChange={e => setModalSourceBranch(e.target.value)}
                    >
                      <option value="Merkez">Merkez</option>
                      <option value="Çankaya">Çankaya</option>
                      <option value="Kadıköy">Kadıköy</option>
                    </select>
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Hedef Şube</label>
                    <select
                      className={styles.formSelect}
                      value={modalTargetBranch}
                      onChange={e => setModalTargetBranch(e.target.value)}
                    >
                      <option value="Çankaya">Çankaya</option>
                      <option value="Merkez">Merkez</option>
                      <option value="Kadıköy">Kadıköy</option>
                    </select>
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Transfer Sebebi / Tipi</label>
                  <select
                    className={styles.formSelect}
                    value={modalTransferType}
                    onChange={e => setModalTransferType(e.target.value as TransferLogItem['transferType'])}
                  >
                    <option value="Cihaz Satışı">Cihaz Satışı &amp; Teslim</option>
                    <option value="Randevu Transferi">Randevu &amp; Muayene Transferi</option>
                    <option value="Teknik Servis">Teknik Servis &amp; Bakım</option>
                    <option value="Diğer">Diğer İdari İşlemler</option>
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Açıklama &amp; Notlar</label>
                  <textarea
                    rows={3}
                    placeholder="Transfer gerekçesi, doktor ve odyometri notları..."
                    className={styles.formTextarea}
                    value={modalNotes}
                    onChange={e => setModalNotes(e.target.value)}
                  />
                </div>
              </div>
              <div className={styles.modalFooter}>
                <button type="button" className={styles.btnSecondaryAction} onClick={() => setShowNewTransferModal(false)}>İptal</button>
                <button type="submit" className={styles.btnPrimaryAction}>Transferi Başlat</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL 2: Transfer Detayı Modalı ── */}
      {selectedTransferDetail && (
        <div className={styles.modalOverlay} onClick={() => setSelectedTransferDetail(null)}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()} style={{ maxWidth: 480 }}>
            <div className={styles.modalHeader}>
              <h2>📋 Transfer İşlem Detayı</h2>
              <button type="button" className={styles.modalCloseBtn} onClick={() => setSelectedTransferDetail(null)}>✕</button>
            </div>
            <div className={styles.modalBody}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13 }}>
                <div><strong>Hasta:</strong> {selectedTransferDetail.patientName}</div>
                <div><strong>İşlem Tarihi:</strong> {selectedTransferDetail.date}</div>
                <div><strong>Güzergah:</strong> {selectedTransferDetail.fromBranch} ➜ {selectedTransferDetail.toBranch}</div>
                <div><strong>Transfer Eden Personel:</strong> {selectedTransferDetail.transferredBy}</div>
                <div><strong>Transfer Tipi:</strong> {selectedTransferDetail.transferType || 'Genel Transfer'}</div>
                <div><strong>Durum:</strong> <span className={selectedTransferDetail.status === 'Tamamlandı' ? styles.badgeStatusSuccess : styles.badgeStatusDanger}>{selectedTransferDetail.status}</span></div>
                <div style={{ background: '#f8fafc', padding: 12, borderRadius: 8, marginTop: 4 }}>
                  <strong>Açıklama:</strong>
                  <p style={{ margin: '4px 0 0', color: '#475569' }}>{selectedTransferDetail.notes || 'Detaylı not bulunmuyor.'}</p>
                </div>
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button type="button" className={styles.btnPrimaryAction} onClick={() => setSelectedTransferDetail(null)}>Kapat</button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL 3: Tarih Seçici Modalı ── */}
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
                  { label: 'Bu Ay', val: '01.09.2026 - 30.09.2026' },
                  { label: 'Son 3 Ay', val: '01.07.2026 - 30.09.2026' },
                  { label: 'Bu Yıl (2026)', val: '01.01.2026 - 30.09.2026' }
                ].map(opt => (
                  <button
                    key={opt.label}
                    type="button"
                    className={styles.btnSecondaryAction}
                    style={{ fontSize: 12, padding: '10px 8px' }}
                    onClick={() => {
                      setDateRange(opt.val);
                      setShowDateModal(false);
                      addToast({ type: 'info', message: `Tarih aralığı: ${opt.label} olarak güncellendi.` });
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button type="button" className={styles.btnSecondaryAction} onClick={() => setShowDateModal(false)}>Kapat</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
