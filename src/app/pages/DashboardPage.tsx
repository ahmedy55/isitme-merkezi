'use client';

import React from 'react';
import { useApp } from '../context/AppContext';
import {
  patients, appointments, recallItems, sales, stockItems,
  getAvatarColor, formatCurrency,
  statusColors,
} from '../data/mockData';
import {
  IconPatients, IconCalendar, IconCash, IconRecall,
  IconPlus, IconSGK, IconArrowRight,
  IconTrendUp, IconWarning, IconCheck, IconReports,
} from '../components/Icons';

export default function DashboardPage() {
  const { setCurrentPage, addToast } = useApp();

  const todayAppointments = appointments.filter(a => a.date === '2026-07-09');
  const pendingRecalls = recallItems.filter(r => r.status === 'Bekliyor');
  const lowStockItems = stockItems.filter(s => s.quantity <= s.criticalLevel);
  const monthRevenue = sales.reduce((sum, s) => sum + s.total, 0);

  const monthlyData = [
    { month: 'Oca', value: 185000 },
    { month: 'Şub', value: 210000 },
    { month: 'Mar', value: 195000 },
    { month: 'Nis', value: 240000 },
    { month: 'May', value: 228000 },
    { month: 'Haz', value: 265000 },
    { month: 'Tem', value: monthRevenue },
  ];
  const maxRevenue = Math.max(...monthlyData.map(d => d.value));

  return (
    <div className="page">
      {/* İstatistik Kartları — 1 kolon mobil, 2 tablet, 4 masaüstü */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon primary">
            <IconPatients size={20} strokeWidth={1.6} />
          </div>
          <div className="stat-content">
            <div className="stat-label">Toplam Hasta</div>
            <div className="stat-value">{patients.length.toLocaleString('tr-TR')}</div>
            <span className="stat-change up">
              <IconTrendUp size={10} strokeWidth={2} />
              12% bu ay
            </span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon info">
            <IconCalendar size={20} strokeWidth={1.6} />
          </div>
          <div className="stat-content">
            <div className="stat-label">Bugünkü Randevu</div>
            <div className="stat-value">{todayAppointments.length}</div>
            <span className="stat-change up">2 onay bekliyor</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon success">
            <IconCash size={20} strokeWidth={1.6} />
          </div>
          <div className="stat-content">
            <div className="stat-label">Temmuz Ciro</div>
            <div className="stat-value">{formatCurrency(monthRevenue)}</div>
            <span className="stat-change up">
              <IconTrendUp size={10} strokeWidth={2} />
              8% geçen aya göre
            </span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon warning">
            <IconRecall size={20} strokeWidth={1.6} />
          </div>
          <div className="stat-content">
            <div className="stat-label">Geri Kazanım Fırsatı</div>
            <div className="stat-value">{pendingRecalls.length}</div>
            <span className="stat-change down">Aksiyon bekliyor</span>
          </div>
        </div>
      </div>

      {/* Hızlı İşlemler */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-header">
          <span className="card-title">Hızlı İşlemler</span>
        </div>
        <div className="card-body">
          <div className="quick-actions">
            <button className="quick-action-btn" onClick={() => setCurrentPage('patients')}>
              <div className="quick-action-icon">
                <IconPlus size={18} strokeWidth={1.7} />
              </div>
              <span className="quick-action-label">Yeni Hasta</span>
            </button>
            <button className="quick-action-btn" onClick={() => setCurrentPage('appointments')}>
              <div className="quick-action-icon">
                <IconCalendar size={18} strokeWidth={1.7} />
              </div>
              <span className="quick-action-label">Randevu Oluştur</span>
            </button>
            <button className="quick-action-btn" onClick={() => setCurrentPage('sgk')}>
              <div className="quick-action-icon">
                <IconSGK size={18} strokeWidth={1.7} />
              </div>
              <span className="quick-action-label">SGK Sorgula</span>
            </button>
            <button className="quick-action-btn" onClick={() => setCurrentPage('cash')}>
              <div className="quick-action-icon">
                <IconCash size={18} strokeWidth={1.7} />
              </div>
              <span className="quick-action-label">Satış Kaydı</span>
            </button>
          </div>
        </div>
      </div>

      {/* Ana İçerik Grid */}
      <div className="dashboard-grid">
        {/* Bugünün Randevuları */}
        <div className="card">
          <div className="card-header">
            <span className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <IconCalendar size={16} strokeWidth={1.7} />
              Bugünün Randevuları
            </span>
            <button className="btn btn-sm btn-ghost" onClick={() => setCurrentPage('appointments')}
              style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              Tümü <IconArrowRight size={14} strokeWidth={1.8} />
            </button>
          </div>
          <div className="card-body">
            {todayAppointments.length > 0 ? (
              todayAppointments.map((apt) => (
                <div key={apt.id} className="appointment-item">
                  <div className="appointment-time">{apt.time}</div>
                  <div className="avatar" style={{ background: getAvatarColor(apt.patientName) }}>
                    {apt.patientName.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div className="appointment-info">
                    <div className="appointment-name">{apt.patientName}</div>
                    <div className="appointment-type">{apt.type}</div>
                  </div>
                  <span className={`badge badge-${statusColors[apt.status] || 'neutral'}`}>
                    {apt.status}
                  </span>
                </div>
              ))
            ) : (
              <div className="empty-state">
                <div className="empty-state-icon">
                  <IconCalendar size={40} strokeWidth={1.2} />
                </div>
                <h3>Bugün randevu yok</h3>
                <p>Takvimden yeni randevu oluşturabilirsiniz.</p>
              </div>
            )}
          </div>
        </div>

        {/* Recall Sırası */}
        <div className="card">
          <div className="card-header">
            <span className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <IconRecall size={16} strokeWidth={1.7} />
              Recall Sırası
              <span className="badge badge-danger">{pendingRecalls.length} fırsat</span>
            </span>
            <button className="btn btn-sm btn-ghost" onClick={() => setCurrentPage('recall')}
              style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              Tümü <IconArrowRight size={14} strokeWidth={1.8} />
            </button>
          </div>
          <div className="card-body">
            {recallItems.slice(0, 4).map((item) => (
              <div key={item.id} className="recall-item">
                <div className="avatar" style={{ background: getAvatarColor(item.patientName) }}>
                  {item.patientName.split(' ').map(n => n[0]).join('')}
                </div>
                <div className="recall-info">
                  <div className="recall-name">{item.patientName}</div>
                  <div className="recall-reason">{item.reason}</div>
                </div>
                {item.status === 'Bekliyor' ? (
                   <button className="btn btn-sm btn-primary"
                     onClick={() => addToast({ type: 'success', message: `${item.patientName} için otomatik ${item.reason === 'Pil Siparişi' ? 'Pil Sipariş' : item.reason} hatırlatma mesajı WhatsApp üzerinden başarıyla gönderildi.` })}>
                     Gönder
                   </button>
                ) : (
                  <span className={`badge badge-${item.status === 'Randevu Alındı' ? 'success' : 'info'}`}>
                    {item.status}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Aylık Ciro Grafiği */}
        <div className="card">
          <div className="card-header">
            <span className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <IconReports size={16} strokeWidth={1.7} />
              Aylık Ciro
            </span>
            <button className="btn btn-sm btn-ghost" onClick={() => setCurrentPage('reports')}
              style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              Detay <IconArrowRight size={14} strokeWidth={1.8} />
            </button>
          </div>
          <div className="card-body">
            <div className="chart-placeholder">
              {monthlyData.map((d, i) => (
                <div
                  key={d.month}
                  className="chart-bar"
                  style={{
                    height: `${(d.value / maxRevenue) * 100}%`,
                    opacity: i === monthlyData.length - 1 ? 1 : 0.65,
                  }}
                >
                  <span className="chart-bar-label">{d.month}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Stok Uyarıları */}
        <div className="card">
          <div className="card-header">
            <span className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <IconWarning size={16} strokeWidth={1.7} />
              Stok Uyarıları
            </span>
            <button className="btn btn-sm btn-ghost" onClick={() => setCurrentPage('stock')}
              style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              Yönet <IconArrowRight size={14} strokeWidth={1.8} />
            </button>
          </div>
          <div className="card-body">
            {lowStockItems.length > 0 ? (
              lowStockItems.map((item) => (
                <div key={item.id} className="stock-warning">
                  <span className="stock-warning-icon">
                    <IconWarning size={16} strokeWidth={1.7} />
                  </span>
                  <div className="stock-warning-text">
                    <strong>{item.name}</strong>
                    <span>{item.quantity} adet kaldı · Kritik: {item.criticalLevel}</span>
                  </div>
                  <div style={{ width: 72, flexShrink: 0 }}>
                    <div className="progress-bar">
                      <div
                        className={`progress-fill ${item.quantity <= item.criticalLevel / 2 ? 'danger' : 'warning'}`}
                        style={{ width: `${Math.min((item.quantity / item.criticalLevel) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="empty-state">
                <div className="empty-state-icon">
                  <IconCheck size={40} strokeWidth={1.2} />
                </div>
                <h3>Stok durumu iyi</h3>
                <p>Kritik seviyenin altında ürün yok.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
