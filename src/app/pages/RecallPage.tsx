'use client';

import React, { useMemo, useState } from 'react';
import { RecallItem } from '../data/mockData';
import { formatDate } from '../data/mockData';
import { IconCalendar, IconCheck, IconWarning } from '../components/Icons';
import { useApp } from '../context/AppContext';
import { useBranchScope } from '../hooks/useBranchScope';

const statusFilters = ['Tümü', 'Bekliyor', 'Gönderildi', 'Randevu Alındı', 'Tamamlandı'] as const;
type StatusFilter = typeof statusFilters[number];

const statusBadgeClass: Record<RecallItem['status'], string> = {
  'Bekliyor': 'warning',
  'Gönderildi': 'info',
  'Randevu Alındı': 'success',
  'Tamamlandı': 'neutral',
};

export default function RecallPage() {
  const { recallList, patientsList, updateRecallItemStatus, dataLoading, currentOrgId } = useApp();
  const { matches } = useBranchScope();
  const [filterStatus, setFilterStatus] = useState<StatusFilter>('Tümü');

  // Recall rows belong to patients, so use the same branch visibility rule as the sidebar badge.
  const visibleRecallItems = useMemo(() => {
    const visiblePatientIds = new Set(
      patientsList.filter(patient => matches(patient.branch, patient.branchId)).map(patient => patient.id),
    );
    return recallList.filter(item => visiblePatientIds.has(item.patientId));
  }, [recallList, patientsList, matches]);

  const filteredRecallItems = useMemo(() => (
    filterStatus === 'Tümü'
      ? visibleRecallItems
      : visibleRecallItems.filter(item => item.status === filterStatus)
  ), [visibleRecallItems, filterStatus]);

  const pendingCount = visibleRecallItems.filter(item => item.status === 'Bekliyor').length;
  const appointmentCount = visibleRecallItems.filter(item => item.status === 'Randevu Alındı').length;
  const today = new Date().toLocaleDateString('en-CA');
  const overdueCount = visibleRecallItems.filter(item => item.status === 'Bekliyor' && item.dueDate < today).length;

  return (
    <div className="page">
      <div className="page-header">
        <div className="page-header-left">
          <h2>Recall / Hatırlatmalar</h2>
          <p>Hasta kayıtlarına bağlı hatırlatma ve takip durumları</p>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon warning"><IconCalendar size={20} /></div>
          <div className="stat-content">
            <div className="stat-label">Bekleyen Hatırlatma</div>
            <div className="stat-value">{pendingCount}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon danger"><IconWarning size={20} /></div>
          <div className="stat-content">
            <div className="stat-label">Tarihi Geçen</div>
            <div className="stat-value">{overdueCount}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon success"><IconCheck size={20} /></div>
          <div className="stat-content">
            <div className="stat-label">Randevuya Dönüşen</div>
            <div className="stat-value">{appointmentCount}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon primary"><IconCalendar size={20} /></div>
          <div className="stat-content">
            <div className="stat-label">Toplam Kayıt</div>
            <div className="stat-value">{visibleRecallItems.length}</div>
          </div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-body">
          <div className="tabs" role="tablist" aria-label="Hatırlatma durumuna göre filtrele">
            {statusFilters.map(status => (
              <button
                key={status}
                type="button"
                role="tab"
                aria-selected={filterStatus === status}
                className={`tab ${filterStatus === status ? 'active' : ''}`}
                onClick={() => setFilterStatus(status)}
              >
                {status}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="table-container">
          <table className="mobile-cards">
            <thead>
              <tr>
                <th>Hasta</th>
                <th>Sebep</th>
                <th>Hatırlatma Tarihi</th>
                <th>Son İletişim</th>
                <th>Durum</th>
                <th>İşlem</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecallItems.map(item => (
                <tr key={item.id}>
                  <td data-label="Hasta" className="td-primary">{item.patientName}</td>
                  <td data-label="Sebep">{item.reason}</td>
                  <td data-label="Hatırlatma Tarihi">{formatDate(item.dueDate)}</td>
                  <td data-label="Son İletişim">{item.lastContact ? formatDate(item.lastContact) : '—'}</td>
                  <td data-label="Durum">
                    <span className={`badge badge-${statusBadgeClass[item.status]}`}>{item.status}</span>
                  </td>
                  <td data-label="İşlem">
                    <select
                      className="form-control"
                      aria-label={`${item.patientName} hatırlatma durumu`}
                      value={item.status}
                      onChange={event => updateRecallItemStatus(item.id, event.target.value as RecallItem['status'])}
                      style={{ minWidth: 160 }}
                    >
                      <option value="Bekliyor">Bekliyor</option>
                      <option value="Gönderildi">Gönderildi</option>
                      <option value="Randevu Alındı">Randevu Alındı</option>
                      <option value="Tamamlandı">Tamamlandı</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {!dataLoading && filteredRecallItems.length === 0 && (
            <div className="empty-state" style={{ padding: '48px 20px', textAlign: 'center' }}>
              <div style={{ fontWeight: 600, marginBottom: 6 }}>
                {visibleRecallItems.length === 0
                  ? 'Bu kapsamda kayıtlı hatırlatma yok.'
                  : 'Bu filtrede hatırlatma bulunamadı.'}
              </div>
              <div style={{ color: 'var(--gray-500)', fontSize: '0.9rem' }}>
                {currentOrgId
                  ? 'Gösterilen kayıtlar hasta ve şube verilerinizden alınır.'
                  : 'Demo verileri yalnızca demo ortamında gösterilir.'}
              </div>
            </div>
          )}
          {dataLoading && <div className="empty-state" style={{ padding: '32px 20px', textAlign: 'center' }}>Hatırlatmalar yükleniyor…</div>}
        </div>
      </div>
    </div>
  );
}
