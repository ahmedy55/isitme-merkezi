'use client';

import React from 'react';
import { useApp } from '../context/AppContext';
import {
  IconDashboard, IconPatients, IconCalendar,
  IconRecall, IconSettings,
} from './Icons';

/** Mobil alt navigasyon — 5 ana öğe */
const bottomNavItems = [
  { id: 'dashboard'    as const, label: 'Ana Sayfa', Icon: IconDashboard },
  { id: 'patients'     as const, label: 'Hastalar',  Icon: IconPatients },
  { id: 'appointments' as const, label: 'Randevu',   Icon: IconCalendar },
  { id: 'recall'       as const, label: 'Recall',    Icon: IconRecall },
  { id: 'settings'     as const, label: 'Ayarlar',   Icon: IconSettings },
];

export default function BottomNav() {
  const { currentPage, setCurrentPage } = useApp();

  return (
    <nav className="bottom-nav" role="navigation" aria-label="Alt navigasyon">
      {bottomNavItems.map(({ id, label, Icon }) => (
        <button
          key={id}
          className={`bottom-nav-item ${currentPage === id ? 'active' : ''}`}
          onClick={() => setCurrentPage(id)}
          aria-label={label}
          aria-current={currentPage === id ? 'page' : undefined}
        >
          <span className="bottom-nav-icon">
            <Icon size={22} strokeWidth={currentPage === id ? 2 : 1.6} />
          </span>
          <span>{label}</span>
        </button>
      ))}
    </nav>
  );
}
