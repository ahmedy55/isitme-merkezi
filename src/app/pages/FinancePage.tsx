'use client';
import CashPage from './CashPage';
import ExpensesPage from './ExpensesPage';
import { useState } from 'react';

export default function FinancePage() {
  const [section, setSection] = useState<'cash' | 'expenses'>('cash');
  return <>
    <nav aria-label="Kasa ve masraf bölümleri" role="tablist" style={{ display: 'flex', gap: 12, padding: 16, flexWrap: 'wrap' }}>
      <button type="button" role="tab" aria-selected={section === 'cash'} className={`btn ${section === 'cash' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setSection('cash')}>Kasa & Tahsilat</button>
      <button type="button" role="tab" aria-selected={section === 'expenses'} className={`btn ${section === 'expenses' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setSection('expenses')}>Masraflar</button>
    </nav>
    <section role="tabpanel" aria-label={section === 'cash' ? 'Kasa ve tahsilat' : 'Masraflar'}>{section === 'cash' ? <CashPage /> : <ExpensesPage />}</section>
  </>;
}
