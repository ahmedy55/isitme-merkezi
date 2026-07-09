'use client';

import React from 'react';
import { formatCurrency } from '../data/mockData';

export default function ReportsPage() {
  return (
    <div className="page">
      <div className="page-header">
        <div className="page-header-left">
          <h2>Raporlama & Analitik</h2>
          <p>Veriye dayalı karar verin</p>
        </div>
        <div className="page-header-actions">
          <button className="btn btn-secondary">📥 Rapor İndir</button>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon success">💰</div>
          <div className="stat-content">
            <div className="stat-label">Yıllık Ciro (2026)</div>
            <div className="stat-value">{formatCurrency(1417000)}</div>
            <span className="stat-change up">↑ 23% geçen yıla göre</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon primary">📊</div>
          <div className="stat-content">
            <div className="stat-label">Dönüşüm Oranı</div>
            <div className="stat-value">%68</div>
            <span className="stat-change up">↑ 5% iyileşme</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon info">👤</div>
          <div className="stat-content">
            <div className="stat-label">Ortalama Hasta Başı Ciro</div>
            <div className="stat-value">{formatCurrency(47200)}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon accent">🔄</div>
          <div className="stat-content">
            <div className="stat-label">Recall Başarı Oranı</div>
            <div className="stat-value">%42</div>
            <span className="stat-change up">↑ 8%</span>
          </div>
        </div>
      </div>

      <div className="dashboard-grid">
        {/* Revenue Chart */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">📈 Aylık Ciro Trendi</span>
          </div>
          <div className="card-body">
            <div className="chart-placeholder">
              {[
                { month: 'Oca', value: 185000 },
                { month: 'Şub', value: 210000 },
                { month: 'Mar', value: 195000 },
                { month: 'Nis', value: 240000 },
                { month: 'May', value: 228000 },
                { month: 'Haz', value: 265000 },
                { month: 'Tem', value: 94000 },
              ].map((d) => (
                <div
                  key={d.month}
                  className="chart-bar"
                  style={{ height: `${(d.value / 265000) * 100}%` }}
                >
                  <span className="chart-bar-label">{d.month}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Conversion Funnel */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">🔄 Satış Hunisi</span>
          </div>
          <div className="card-body">
            {[
              { label: 'Toplam Randevu', value: 248, pct: 100, color: 'var(--info-500)' },
              { label: 'Test Yapıldı', value: 195, pct: 78, color: 'var(--primary-500)' },
              { label: 'Cihaz Denendi', value: 142, pct: 57, color: 'var(--accent-500)' },
              { label: 'Satış Gerçekleşti', value: 98, pct: 39, color: 'var(--success-500)' },
            ].map((item, i) => (
              <div key={i} style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: '0.82rem', fontWeight: 600 }}>{item.label}</span>
                  <span style={{ fontSize: '0.82rem', color: 'var(--gray-500)' }}>{item.value} (%{item.pct})</span>
                </div>
                <div className="progress-bar" style={{ height: 10 }}>
                  <div style={{
                    width: `${item.pct}%`,
                    height: '100%',
                    borderRadius: 'var(--radius-full)',
                    background: item.color,
                    transition: 'width 1s ease',
                  }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Patient Sources */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">📍 Hasta Kaynağı</span>
          </div>
          <div className="card-body">
            {[
              { source: 'SGK Yenileme (Recall)', count: 42, pct: 43 },
              { source: 'Yürüyerek Gelen', count: 28, pct: 29 },
              { source: 'Doktor Yönlendirme', count: 18, pct: 18 },
              { source: 'Web Sitesi', count: 7, pct: 7 },
              { source: 'Diğer', count: 3, pct: 3 },
            ].map((item, i) => (
              <div key={i} style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '8px 0',
                borderBottom: i < 4 ? '1px solid var(--gray-100)' : 'none',
              }}>
                <span style={{ fontSize: '0.85rem', flex: 1 }}>{item.source}</span>
                <span style={{ fontWeight: 700, fontSize: '0.9rem', width: 30, textAlign: 'right' }}>{item.count}</span>
                <div style={{ width: 80 }}>
                  <div className="progress-bar" style={{ height: 6 }}>
                    <div className="progress-fill primary" style={{ width: `${item.pct}%` }} />
                  </div>
                </div>
                <span style={{ fontSize: '0.78rem', color: 'var(--gray-500)', width: 36, textAlign: 'right' }}>%{item.pct}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Audiologist Performance */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">👩‍⚕️ Odyolog Performansı</span>
          </div>
          <div className="card-body">
            {[
              { name: 'Dr. Elif Arslan', sales: 62, revenue: 845000, conversion: 72 },
              { name: 'Dr. Can Yılmaz', sales: 36, revenue: 572000, conversion: 64 },
            ].map((doc, i) => (
              <div key={i} style={{
                padding: '14px',
                background: 'var(--gray-50)',
                borderRadius: 'var(--radius-lg)',
                marginBottom: i === 0 ? 12 : 0,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                  <span style={{ fontWeight: 700 }}>{doc.name}</span>
                  <span style={{ fontWeight: 700, color: 'var(--primary-600)' }}>{formatCurrency(doc.revenue)}</span>
                </div>
                <div style={{ display: 'flex', gap: 16 }}>
                  <div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--gray-500)' }}>Satış</div>
                    <div style={{ fontWeight: 700 }}>{doc.sales}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--gray-500)' }}>Dönüşüm</div>
                    <div style={{ fontWeight: 700, color: 'var(--success-600)' }}>%{doc.conversion}</div>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--gray-500)', marginBottom: 4 }}>Hedef Durumu</div>
                    <div className="progress-bar" style={{ height: 8 }}>
                      <div className="progress-fill primary" style={{ width: `${doc.conversion}%` }} />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
