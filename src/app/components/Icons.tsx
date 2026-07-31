/**
 * AudiPro — Özel SVG İkon Seti
 * Minimal, stroke tabanlı, 24x24 grid — hiçbir bağımlılık gerektirmez
 * Tüm ikonlar tek dosyada, tutarlı stroke-width=1.6
 */

import React from 'react';

interface IconProps {
  size?: number;
  className?: string;
  strokeWidth?: number;
  color?: string;
}

const defaultProps = {
  size: 20,
  className: '',
  strokeWidth: 1.65,
  color: 'currentColor'
};

/* ── Temel SVG Sarmalayıcı ── */
const Svg: React.FC<{ size: number; className: string; color?: string; children: React.ReactNode }> = ({
  size, className, color = 'currentColor', children
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    className={className}
  >
    {children}
  </svg>
);

/* ============================================================
   NAVIGASYON & LAYOUT
   ============================================================ */

/** Dashboard / Ana Sayfa */
export const IconDashboard: React.FC<IconProps> = (p = {}) => {
  const { size, className, strokeWidth } = { ...defaultProps, ...p };
  return (
    <Svg size={size} className={className}>
      <rect x="3" y="3" width="7.5" height="7.5" rx="1.5" strokeWidth={strokeWidth} />
      <rect x="13.5" y="3" width="7.5" height="7.5" rx="1.5" strokeWidth={strokeWidth} />
      <rect x="3" y="13.5" width="7.5" height="7.5" rx="1.5" strokeWidth={strokeWidth} />
      <rect x="13.5" y="13.5" width="7.5" height="7.5" rx="1.5" strokeWidth={strokeWidth} />
    </Svg>
  );
};

/** Hastalar */
export const IconPatients: React.FC<IconProps> = (p = {}) => {
  const { size, className, strokeWidth } = { ...defaultProps, ...p };
  return (
    <Svg size={size} className={className}>
      <circle cx="12" cy="8" r="3.5" strokeWidth={strokeWidth} />
      <path d="M4.5 20c0-4.142 3.358-7.5 7.5-7.5s7.5 3.358 7.5 7.5" strokeWidth={strokeWidth} />
    </Svg>
  );
};

/** Randevular / Takvim */
export const IconCalendar: React.FC<IconProps> = (p = {}) => {
  const { size, className, strokeWidth } = { ...defaultProps, ...p };
  return (
    <Svg size={size} className={className}>
      <rect x="3" y="4.5" width="18" height="16.5" rx="2" strokeWidth={strokeWidth} />
      <path d="M3 9.5h18" strokeWidth={strokeWidth} />
      <path d="M8 3v3M16 3v3" strokeWidth={strokeWidth} />
      <path d="M7.5 14h3M13.5 14h3M7.5 18h3" strokeWidth={strokeWidth} />
    </Svg>
  );
};

/** Recall / Yenileme */
export const IconRecall: React.FC<IconProps> = (p = {}) => {
  const { size, className, strokeWidth } = { ...defaultProps, ...p };
  return (
    <Svg size={size} className={className}>
      <path d="M20.5 12a8.5 8.5 0 11-2-5.5" strokeWidth={strokeWidth} />
      <path d="M20.5 5.5v3.5H17" strokeWidth={strokeWidth} />
      <path d="M12 8v4l3 2" strokeWidth={strokeWidth} />
    </Svg>
  );
};

/** SGK / Evrak */
export const IconSGK: React.FC<IconProps> = (p = {}) => {
  const { size, className, strokeWidth } = { ...defaultProps, ...p };
  return (
    <Svg size={size} className={className}>
      <path d="M14.5 3H6.5A1.5 1.5 0 005 4.5v15A1.5 1.5 0 006.5 21h11a1.5 1.5 0 001.5-1.5V7.5L14.5 3z" strokeWidth={strokeWidth} />
      <path d="M14 3v5h5" strokeWidth={strokeWidth} />
      <path d="M8.5 13h7M8.5 16.5h5" strokeWidth={strokeWidth} />
    </Svg>
  );
};

/** Stok / Kutu */
export const IconStock: React.FC<IconProps> = (p = {}) => {
  const { size, className, strokeWidth } = { ...defaultProps, ...p };
  return (
    <Svg size={size} className={className}>
      <path d="M21 8l-9-5-9 5v8l9 5 9-5V8z" strokeWidth={strokeWidth} />
      <path d="M12 3v18M3 8l9 5 9-5" strokeWidth={strokeWidth} />
    </Svg>
  );
};

/** Kasa / Para */
export const IconCash: React.FC<IconProps> = (p = {}) => {
  const { size, className, strokeWidth } = { ...defaultProps, ...p };
  return (
    <Svg size={size} className={className}>
      <rect x="2.5" y="5.5" width="19" height="13" rx="2" strokeWidth={strokeWidth} />
      <circle cx="12" cy="12" r="3" strokeWidth={strokeWidth} />
      <path d="M6.5 5.5v13M17.5 5.5v13" strokeWidth={strokeWidth} />
    </Svg>
  );
};

/** Teknik Servis / Anahtar */
export const IconService: React.FC<IconProps> = (p = {}) => {
  const { size, className, strokeWidth } = { ...defaultProps, ...p };
  return (
    <Svg size={size} className={className}>
      <path
        d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l2.8-2.8a7 7 0 01-8.6 8.6L6 20a2 2 0 01-2.83-2.83l5.9-5.9a7 7 0 018.6-8.6L14.7 6.3z"
        strokeWidth={strokeWidth}
      />
    </Svg>
  );
};

/** Raporlar / Analitik */
export const IconReports: React.FC<IconProps> = (p = {}) => {
  const { size, className, strokeWidth } = { ...defaultProps, ...p };
  return (
    <Svg size={size} className={className}>
      <path d="M3 20h18M8 20V10M12 20V6M16 20V13M20 20V4" strokeWidth={strokeWidth} />
    </Svg>
  );
};

/** Şubeler / Bina */
export const IconBranches: React.FC<IconProps> = (p = {}) => {
  const { size, className, strokeWidth } = { ...defaultProps, ...p };
  return (
    <Svg size={size} className={className}>
      <path d="M3 21h18M5 21V7l7-4 7 4v14" strokeWidth={strokeWidth} />
      <rect x="9.5" y="14" width="5" height="7" rx="0.5" strokeWidth={strokeWidth} />
      <rect x="7" y="10" width="3" height="2.5" rx="0.5" strokeWidth={strokeWidth} />
      <rect x="14" y="10" width="3" height="2.5" rx="0.5" strokeWidth={strokeWidth} />
    </Svg>
  );
};

/** Ayarlar / Dişli */
export const IconSettings: React.FC<IconProps> = (p = {}) => {
  const { size, className, strokeWidth } = { ...defaultProps, ...p };
  return (
    <Svg size={size} className={className}>
      <circle cx="12" cy="12" r="3" strokeWidth={strokeWidth} />
      <path
        d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"
        strokeWidth={strokeWidth}
      />
    </Svg>
  );
};

/* ============================================================
   GENEL ARAYÜZ İKONLARI
   ============================================================ */

/** Hamburger Menü */
export const IconMenu: React.FC<IconProps> = (p = {}) => {
  const { size, className, strokeWidth } = { ...defaultProps, ...p };
  return (
    <Svg size={size} className={className}>
      <path d="M3 6h18M3 12h18M3 18h18" strokeWidth={strokeWidth} />
    </Svg>
  );
};

/** Kapat (X) */
export const IconClose: React.FC<IconProps> = (p = {}) => {
  const { size, className, strokeWidth } = { ...defaultProps, ...p };
  return (
    <Svg size={size} className={className}>
      <path d="M18 6L6 18M6 6l12 12" strokeWidth={strokeWidth} />
    </Svg>
  );
};

/** Geri */
export const IconBack: React.FC<IconProps> = (p = {}) => {
  const { size, className, strokeWidth } = { ...defaultProps, ...p };
  return (
    <Svg size={size} className={className}>
      <path d="M19 12H5M5 12l6-6M5 12l6 6" strokeWidth={strokeWidth} />
    </Svg>
  );
};

/** Ara / Büyüteç */
export const IconSearch: React.FC<IconProps> = (p = {}) => {
  const { size, className, strokeWidth } = { ...defaultProps, ...p };
  return (
    <Svg size={size} className={className}>
      <circle cx="10.5" cy="10.5" r="6.5" strokeWidth={strokeWidth} />
      <path d="M15.5 15.5L21 21" strokeWidth={strokeWidth} />
    </Svg>
  );
};

/** Bildirim / Zil */
export const IconBell: React.FC<IconProps> = (p = {}) => {
  const { size, className, strokeWidth } = { ...defaultProps, ...p };
  return (
    <Svg size={size} className={className}>
      <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" strokeWidth={strokeWidth} />
      <path d="M13.73 21a2 2 0 01-3.46 0" strokeWidth={strokeWidth} />
    </Svg>
  );
};

/** Artı / Ekle */
export const IconPlus: React.FC<IconProps> = (p = {}) => {
  const { size, className, strokeWidth } = { ...defaultProps, ...p };
  return (
    <Svg size={size} className={className}>
      <path d="M12 5v14M5 12h14" strokeWidth={strokeWidth} />
    </Svg>
  );
};

/** Düzenle / Kalem */
export const IconEdit: React.FC<IconProps> = (p = {}) => {
  const { size, className, strokeWidth } = { ...defaultProps, ...p };
  return (
    <Svg size={size} className={className}>
      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" strokeWidth={strokeWidth} />
      <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" strokeWidth={strokeWidth} />
    </Svg>
  );
};

/** Sil / Çöp */
export const IconDelete: React.FC<IconProps> = (p = {}) => {
  const { size, className, strokeWidth } = { ...defaultProps, ...p };
  return (
    <Svg size={size} className={className}>
      <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2" strokeWidth={strokeWidth} />
      <path d="M10 11v6M14 11v6" strokeWidth={strokeWidth} />
    </Svg>
  );
};

/** Filtre */
export const IconFilter: React.FC<IconProps> = (p = {}) => {
  const { size, className, strokeWidth } = { ...defaultProps, ...p };
  return (
    <Svg size={size} className={className}>
      <path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z" strokeWidth={strokeWidth} />
    </Svg>
  );
};

/** İndir / Export */
export const IconDownload: React.FC<IconProps> = (p = {}) => {
  const { size, className, strokeWidth } = { ...defaultProps, ...p };
  return (
    <Svg size={size} className={className}>
      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" strokeWidth={strokeWidth} />
      <path d="M7 10l5 5 5-5M12 15V3" strokeWidth={strokeWidth} />
    </Svg>
  );
};

/** Yükle / Import */
export const IconUpload: React.FC<IconProps> = (p = {}) => {
  const { size, className, strokeWidth } = { ...defaultProps, ...p };
  return (
    <Svg size={size} className={className}>
      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" strokeWidth={strokeWidth} />
      <path d="M17 8l-5-5-5 5M12 3v12" strokeWidth={strokeWidth} />
    </Svg>
  );
};

/** Yenile */
export const IconRefresh: React.FC<IconProps> = (p = {}) => {
  const { size, className, strokeWidth } = { ...defaultProps, ...p };
  return (
    <Svg size={size} className={className}>
      <path d="M23 4v6h-6M1 20v-6h6" strokeWidth={strokeWidth} />
      <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" strokeWidth={strokeWidth} />
    </Svg>
  );
};

/** Onay / Çek */
export const IconCheck: React.FC<IconProps> = (p = {}) => {
  const { size, className, strokeWidth } = { ...defaultProps, ...p };
  return (
    <Svg size={size} className={className}>
      <path d="M20 6L9 17l-5-5" strokeWidth={strokeWidth} />
    </Svg>
  );
};

/** Uyarı / Üçgen */
export const IconWarning: React.FC<IconProps> = (p = {}) => {
  const { size, className, strokeWidth } = { ...defaultProps, ...p };
  return (
    <Svg size={size} className={className}>
      <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" strokeWidth={strokeWidth} />
      <path d="M12 9v4M12 17h.01" strokeWidth={strokeWidth} />
    </Svg>
  );
};

/** Bilgi */
export const IconInfo: React.FC<IconProps> = (p = {}) => {
  const { size, className, strokeWidth } = { ...defaultProps, ...p };
  return (
    <Svg size={size} className={className}>
      <circle cx="12" cy="12" r="9" strokeWidth={strokeWidth} />
      <path d="M12 8h.01M11 12h1v4h1" strokeWidth={strokeWidth} />
    </Svg>
  );
};

/** Sağ Ok / Detay */
export const IconArrowRight: React.FC<IconProps> = (p = {}) => {
  const { size, className, strokeWidth } = { ...defaultProps, ...p };
  return (
    <Svg size={size} className={className}>
      <path d="M5 12h14M12 5l7 7-7 7" strokeWidth={strokeWidth} />
    </Svg>
  );
};

/** Üçgen Aşağı / Chevron */
export const IconChevronDown: React.FC<IconProps> = (p = {}) => {
  const { size, className, strokeWidth } = { ...defaultProps, ...p };
  return (
    <Svg size={size} className={className}>
      <path d="M6 9l6 6 6-6" strokeWidth={strokeWidth} />
    </Svg>
  );
};

/** Telefon */
export const IconPhone: React.FC<IconProps> = (p = {}) => {
  const { size, className, strokeWidth } = { ...defaultProps, ...p };
  return (
    <Svg size={size} className={className}>
      <path
        d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"
        strokeWidth={strokeWidth}
      />
    </Svg>
  );
};

/** İşitme / Kulak */
export const IconHearing: React.FC<IconProps> = (p = {}) => {
  const { size, className, strokeWidth } = { ...defaultProps, ...p };
  return (
    <Svg size={size} className={className}>
      {/* Kulak şekli */}
      <path
        d="M12 3a7 7 0 017 7c0 3-1.5 5.5-3 7-1 1-1.5 2-1.5 3a2.5 2.5 0 01-5 0"
        strokeWidth={strokeWidth}
      />
      <circle cx="12" cy="10" r="2.5" strokeWidth={strokeWidth} />
      <path d="M12 7.5v1.5" strokeWidth={strokeWidth} />
    </Svg>
  );
};

/** WhatsApp-benzeri / Mesaj */
export const IconMessage: React.FC<IconProps> = (p = {}) => {
  const { size, className, strokeWidth } = { ...defaultProps, ...p };
  return (
    <Svg size={size} className={className}>
      <path
        d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2v10z"
        strokeWidth={strokeWidth}
      />
    </Svg>
  );
};

/** Konuma / Şube */
export const IconLocation: React.FC<IconProps> = (p = {}) => {
  const { size, className, strokeWidth } = { ...defaultProps, ...p };
  return (
    <Svg size={size} className={className}>
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" strokeWidth={strokeWidth} />
      <circle cx="12" cy="9" r="2.5" strokeWidth={strokeWidth} />
    </Svg>
  );
};

/** Kullanıcı Grubu / Ekip */
export const IconTeam: React.FC<IconProps> = (p = {}) => {
  const { size, className, strokeWidth } = { ...defaultProps, ...p };
  return (
    <Svg size={size} className={className}>
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" strokeWidth={strokeWidth} />
      <circle cx="9" cy="7" r="4" strokeWidth={strokeWidth} />
      <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" strokeWidth={strokeWidth} />
    </Svg>
  );
};

/** Zil + Yıldırım / Akıllı Hatırlatma */
export const IconSmartRecall: React.FC<IconProps> = (p = {}) => {
  const { size, className, strokeWidth } = { ...defaultProps, ...p };
  return (
    <Svg size={size} className={className}>
      <path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V4a2 2 0 10-4 0v1.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5" strokeWidth={strokeWidth} />
      <path d="M13.73 21a2 2 0 01-3.46 0" strokeWidth={strokeWidth} />
      <path d="M18 8l2-3M20 8l-2-3" strokeWidth={strokeWidth} />
    </Svg>
  );
};

/** Cihaz / Kulaklık */
export const IconDevice: React.FC<IconProps> = (p = {}) => {
  const { size, className, strokeWidth } = { ...defaultProps, ...p };
  return (
    <Svg size={size} className={className}>
      <path d="M3 18v-6a9 9 0 0118 0v6" strokeWidth={strokeWidth} />
      <path
        d="M21 19a2 2 0 01-2 2h-1a2 2 0 01-2-2v-3a2 2 0 012-2h3zM3 19a2 2 0 002 2h1a2 2 0 002-2v-3a2 2 0 00-2-2H3z"
        strokeWidth={strokeWidth}
      />
    </Svg>
  );
};

/** Logo İkonu (Ses dalgası) */
export const IconLogo: React.FC<IconProps> = (p = {}) => {
  const { size, className, strokeWidth } = { ...defaultProps, ...p };
  return (
    <Svg size={size} className={className}>
      {/* Ses dalgaları */}
      <path d="M12 5v14" strokeWidth={strokeWidth + 0.2} strokeLinecap="round" />
      <path d="M8.5 8v8" strokeWidth={strokeWidth} strokeLinecap="round" />
      <path d="M15.5 8v8" strokeWidth={strokeWidth} strokeLinecap="round" />
      <path d="M5.5 10.5v3" strokeWidth={strokeWidth} strokeLinecap="round" />
      <path d="M18.5 10.5v3" strokeWidth={strokeWidth} strokeLinecap="round" />
    </Svg>
  );
};

/** Göz / Görüntüle */
export const IconEye: React.FC<IconProps> = (p = {}) => {
  const { size, className, strokeWidth } = { ...defaultProps, ...p };
  return (
    <Svg size={size} className={className}>
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" strokeWidth={strokeWidth} />
      <circle cx="12" cy="12" r="3" strokeWidth={strokeWidth} />
    </Svg>
  );
};

/** Yıldız / Favori */
export const IconStar: React.FC<IconProps> = (p = {}) => {
  const { size, className, strokeWidth } = { ...defaultProps, ...p };
  return (
    <Svg size={size} className={className}>
      <polygon
        points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"
        strokeWidth={strokeWidth}
      />
    </Svg>
  );
};

/** SGK / Kalkan */
export const IconShield: React.FC<IconProps> = (p = {}) => {
  const { size, className, strokeWidth } = { ...defaultProps, ...p };
  return (
    <Svg size={size} className={className}>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" strokeWidth={strokeWidth} />
      <path d="M9 12l2 2 4-4" strokeWidth={strokeWidth} />
    </Svg>
  );
};

/** Yüzde / Prim */
export const IconPercent: React.FC<IconProps> = (p = {}) => {
  const { size, className, strokeWidth } = { ...defaultProps, ...p };
  return (
    <Svg size={size} className={className}>
      <path d="M19 5L5 19" strokeWidth={strokeWidth} />
      <circle cx="6.5" cy="6.5" r="2.5" strokeWidth={strokeWidth} />
      <circle cx="17.5" cy="17.5" r="2.5" strokeWidth={strokeWidth} />
    </Svg>
  );
};

/** Trendup */
export const IconTrendUp: React.FC<IconProps> = (p = {}) => {
  const { size, className, strokeWidth } = { ...defaultProps, ...p };
  return (
    <Svg size={size} className={className}>
      <path d="M23 6l-9.5 9.5-5-5L1 18" strokeWidth={strokeWidth} />
      <path d="M17 6h6v6" strokeWidth={strokeWidth} />
    </Svg>
  );
};

/** Trenddown */
export const IconTrendDown: React.FC<IconProps> = (p = {}) => {
  const { size, className, strokeWidth } = { ...defaultProps, ...p };
  return (
    <Svg size={size} className={className}>
      <path d="M23 18l-9.5-9.5-5 5L1 6" strokeWidth={strokeWidth} />
      <path d="M17 18h6v-6" strokeWidth={strokeWidth} />
    </Svg>
  );
};

/** Kullanıcılar / Users */
export const IconUsers: React.FC<IconProps> = (p = {}) => {
  const { size, className, strokeWidth } = { ...defaultProps, ...p };
  return (
    <Svg size={size} className={className}>
      <path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2" strokeWidth={strokeWidth} />
      <circle cx="9" cy="7" r="4" strokeWidth={strokeWidth} />
      <path d="M22 21v-2a4 4 0 00-3-3.87" strokeWidth={strokeWidth} />
      <path d="M16 3.13a4 4 0 010 7.75" strokeWidth={strokeWidth} />
    </Svg>
  );
};

/** Tedarikçi / Truck */
export const IconTruck: React.FC<IconProps> = (p = {}) => {
  const { size, className, strokeWidth } = { ...defaultProps, ...p };
  return (
    <Svg size={size} className={className}>
      <rect x="1" y="3" width="15" height="13" rx="1" strokeWidth={strokeWidth} />
      <path d="M16 8h4l3 3v5h-7V8z" strokeWidth={strokeWidth} />
      <circle cx="5.5" cy="18.5" r="2.5" strokeWidth={strokeWidth} />
      <circle cx="18.5" cy="18.5" r="2.5" strokeWidth={strokeWidth} />
    </Svg>
  );
};

/** Masraflar / Wallet */
export const IconWallet: React.FC<IconProps> = (p = {}) => {
  const { size, className, strokeWidth } = { ...defaultProps, ...p };
  return (
    <Svg size={size} className={className}>
      <path d="M21 12V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2h14a2 2 0 002-2v-1" strokeWidth={strokeWidth} />
      <path d="M16 12h5v4h-5a2 2 0 010-4z" strokeWidth={strokeWidth} />
      <path d="M3 7l9-4 9 4" strokeWidth={strokeWidth} />
    </Svg>
  );
};

/** İşlem Kayıtları / Audit Log */
export const IconAuditLog: React.FC<IconProps> = (p = {}) => {
  const { size, className, strokeWidth } = { ...defaultProps, ...p };
  return (
    <Svg size={size} className={className}>
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" strokeWidth={strokeWidth} />
      <path d="M14 2v6h6" strokeWidth={strokeWidth} />
      <path d="M12 18v-6" strokeWidth={strokeWidth} />
      <path d="M9.5 15.5L12 18l2.5-2.5" strokeWidth={strokeWidth} />
    </Svg>
  );
};

/* ============================================================
   İKON HARİTASI — Sidebar için
   ============================================================ */
/** Demirbaş / Asset Display */
export const IconAsset: React.FC<IconProps> = (p = {}) => {
  const { size, className, strokeWidth } = { ...defaultProps, ...p };
  return (
    <Svg size={size} className={className}>
      <rect x="2" y="3" width="20" height="14" rx="2" strokeWidth={strokeWidth} />
      <line x1="8" y1="21" x2="16" y2="21" strokeWidth={strokeWidth} />
      <line x1="12" y1="17" x2="12" y2="21" strokeWidth={strokeWidth} />
    </Svg>
  );
};

/** Destek / Support Headset */
export const IconSupport: React.FC<IconProps> = (p = {}) => {
  const { size, className, strokeWidth } = { ...defaultProps, ...p };
  return (
    <Svg size={size} className={className}>
      <path d="M3 18v-6a9 9 0 0118 0v6" strokeWidth={strokeWidth} />
      <path d="M21 19a2 2 0 01-2 2h-1a2 2 0 01-2-2v-3a2 2 0 012-2h3zM3 19a2 2 0 002 2h1a2 2 0 002-2v-3a2 2 0 00-2-2H3z" strokeWidth={strokeWidth} />
      <path d="M12 21a9.004 9.004 0 01-9-9" strokeWidth={strokeWidth} />
    </Svg>
  );
};

/** Aktivite / Pulse Line */
export const IconActivity: React.FC<IconProps> = (p = {}) => {
  const { size, className, strokeWidth } = { ...defaultProps, ...p };
  return (
    <Svg size={size} className={className}>
      <path d="M22 12h-4l-3 9L9 3l-3 9H2" strokeWidth={strokeWidth} />
    </Svg>
  );
};

/** Şube Aktivite / Bar Chart Comparison */
export const IconBranchActivity: React.FC<IconProps> = (p = {}) => {
  const { size, className, strokeWidth } = { ...defaultProps, ...p };
  return (
    <Svg size={size} className={className}>
      <path d="M18 20V10M12 20V4M6 20v10" strokeWidth={strokeWidth} />
      <rect x="3" y="3" width="18" height="18" rx="2" strokeWidth={strokeWidth} />
    </Svg>
  );
};

export const IconCrown: React.FC<IconProps> = (p = {}) => {
  const { size = 18, color = 'currentColor', strokeWidth = 1.8, className = '' } = p;
  return (
    <Svg size={size} color={color} className={className}>
      <path d="M11.562 3.266a.5.5 0 0 1 .876 0L15.3 8.87l5.443-2.722a.5.5 0 0 1 .715.545l-1.636 11.455A2 2 0 0 1 17.84 20H6.16a2 2 0 0 1-1.982-1.852L2.542 6.693a.5.5 0 0 1 .715-.545L8.7 8.87l2.862-5.604Z" strokeWidth={strokeWidth} fill="currentColor" />
    </Svg>
  );
};

export const IconStore: React.FC<IconProps> = (p = {}) => {
  const { size = 18, color = 'currentColor', strokeWidth = 1.8, className = '' } = p;
  return (
    <Svg size={size} color={color} className={className}>
      <path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7" strokeWidth={strokeWidth} />
      <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" strokeWidth={strokeWidth} />
      <path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4" strokeWidth={strokeWidth} />
      <path d="M2 7h20v3a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V7Z" strokeWidth={strokeWidth} />
    </Svg>
  );
};

export const IconStethoscope: React.FC<IconProps> = (p = {}) => {
  const { size = 18, color = 'currentColor', strokeWidth = 1.8, className = '' } = p;
  return (
    <Svg size={size} color={color} className={className}>
      <path d="M4.8 2.3A.3.3 0 0 0 4.5 2.6V11a5 5 0 0 0 10 0V2.6a.3.3 0 0 0-.3-.3h-1.4a.3.3 0 0 0-.3.3V11a3 3 0 0 1-6 0V2.6a.3.3 0 0 0-.3-.3H4.8Z" strokeWidth={strokeWidth} />
      <path d="M9.5 16v3a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2v-3" strokeWidth={strokeWidth} />
      <circle cx="15.5" cy="14.5" r="2.5" strokeWidth={strokeWidth} />
    </Svg>
  );
};

export const IconCalculator: React.FC<IconProps> = (p = {}) => {
  const { size = 18, color = 'currentColor', strokeWidth = 1.8, className = '' } = p;
  return (
    <Svg size={size} color={color} className={className}>
      <rect width="16" height="20" x="4" y="2" rx="2" strokeWidth={strokeWidth} />
      <line x1="8" x2="16" y1="6" y2="6" strokeWidth={strokeWidth} />
      <line x1="16" x2="16" y1="14" y2="18" strokeWidth={strokeWidth} />
      <path d="M16 10h.01" strokeWidth={strokeWidth} />
      <path d="M12 10h.01" strokeWidth={strokeWidth} />
      <path d="M8 10h.01" strokeWidth={strokeWidth} />
      <path d="M12 14h.01" strokeWidth={strokeWidth} />
      <path d="M8 14h.01" strokeWidth={strokeWidth} />
      <path d="M12 18h.01" strokeWidth={strokeWidth} />
      <path d="M8 18h.01" strokeWidth={strokeWidth} />
    </Svg>
  );
};

export const IconBuilding: React.FC<IconProps> = (p = {}) => {
  const { size = 18, color = 'currentColor', strokeWidth = 1.8, className = '' } = p;
  return (
    <Svg size={size} color={color} className={className}>
      <rect width="16" height="20" x="4" y="2" rx="2" strokeWidth={strokeWidth} />
      <path d="M9 22v-4h6v4" strokeWidth={strokeWidth} />
      <path d="M8 6h.01M16 6h.01M8 10h.01M16 10h.01M8 14h.01M16 14h.01" strokeWidth={strokeWidth} />
    </Svg>
  );
};

export const IconTag: React.FC<IconProps> = (p = {}) => {
  const { size = 18, color = 'currentColor', strokeWidth = 1.8, className = '' } = p;
  return (
    <Svg size={size} color={color} className={className}>
      <path d="M12 2H2v10l10 10 10-10L12 2Z" strokeWidth={strokeWidth} />
      <circle cx="7" cy="7" r="1.5" strokeWidth={strokeWidth} />
    </Svg>
  );
};

export const IconDocument: React.FC<IconProps> = (p = {}) => {
  const { size = 18, color = 'currentColor', strokeWidth = 1.8, className = '' } = p;
  return (
    <Svg size={size} color={color} className={className}>
      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2Z" strokeWidth={strokeWidth} />
      <polyline points="14 2 14 8 20 8" strokeWidth={strokeWidth} />
      <line x1="8" x2="16" y1="13" y2="13" strokeWidth={strokeWidth} />
      <line x1="8" x2="14" y1="17" y2="17" strokeWidth={strokeWidth} />
    </Svg>
  );
};

export const IconLock: React.FC<IconProps> = (p = {}) => {
  const { size = 18, color = 'currentColor', strokeWidth = 1.8, className = '' } = p;
  return (
    <Svg size={size} color={color} className={className}>
      <rect width="18" height="11" x="3" y="11" rx="2" ry="2" strokeWidth={strokeWidth} />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" strokeWidth={strokeWidth} />
    </Svg>
  );
};

export const IconMail: React.FC<IconProps> = (p = {}) => {
  const { size = 18, color = 'currentColor', strokeWidth = 1.8, className = '' } = p;
  return (
    <Svg size={size} color={color} className={className}>
      <rect width="20" height="16" x="2" y="4" rx="2" strokeWidth={strokeWidth} />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" strokeWidth={strokeWidth} />
    </Svg>
  );
};

export const IconMapPin: React.FC<IconProps> = (p = {}) => {
  const { size = 18, color = 'currentColor', strokeWidth = 1.8, className = '' } = p;
  return (
    <Svg size={size} color={color} className={className}>
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" strokeWidth={strokeWidth} />
      <circle cx="12" cy="10" r="3" strokeWidth={strokeWidth} />
    </Svg>
  );
};

export const IconSave: React.FC<IconProps> = (p = {}) => {
  const { size = 18, color = 'currentColor', strokeWidth = 1.8, className = '' } = p;
  return (
    <Svg size={size} color={color} className={className}>
      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2Z" strokeWidth={strokeWidth} />
      <polyline points="17 21 17 13 7 13 7 21" strokeWidth={strokeWidth} />
      <polyline points="7 3 7 8 15 8" strokeWidth={strokeWidth} />
    </Svg>
  );
};

export const IconDatabase: React.FC<IconProps> = (p = {}) => {
  const { size = 18, color = 'currentColor', strokeWidth = 1.8, className = '' } = p;
  return (
    <Svg size={size} color={color} className={className}>
      <ellipse cx="12" cy="5" rx="9" ry="3" strokeWidth={strokeWidth} />
      <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" strokeWidth={strokeWidth} />
      <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" strokeWidth={strokeWidth} />
    </Svg>
  );
};

/* ============================================================
   İKON HARİTASI — Sidebar için
   ============================================================ */
export const navIcons = {
  dashboard:    IconDashboard,
  patients:     IconPatients,
  appointments: IconCalendar,
  recall:       IconRecall,
  sgk:          IconSGK,
  stock:        IconStock,
  cash:         IconCash,
  service:      IconService,
  reports:      IconReports,
  branches:     IconBranches,
  settings:     IconSettings,
  users:        IconUsers,
  suppliers:    IconTruck,
  expenses:     IconWallet,
  'audit-log':  IconAuditLog,
  'sgk-receivables': IconShield,
  assets:       IconAsset,
  support:      IconSupport,
  'activity-log': IconActivity,
  'branch-activities': IconBranchActivity,
  'super-admin': IconShield,
} as const;

export type NavIconKey = keyof typeof navIcons;
