'use client';

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { IconSearch } from '../components/Icons';

export default function AuditLogPage() {
  const { auditLogList } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('All');
  const [moduleFilter, setModuleFilter] = useState('All');

  // Filter logs
  const filteredLogs = auditLogList.filter(log => {
    const matchesSearch = 
      log.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.details && log.details.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesAction = actionFilter === 'All' || log.action === actionFilter;
    const matchesModule = moduleFilter === 'All' || log.module === moduleFilter;

    return matchesSearch && matchesAction && matchesModule;
  });

  const formatDateDisplay = (timestampRaw?: string, createdAtRaw?: string) => {
    const dateVal = timestampRaw || createdAtRaw;
    if (!dateVal) return new Date().toLocaleString('tr-TR');
    const cleanIso = dateVal.includes('T') ? dateVal : dateVal.replace(' ', 'T');
    const d = new Date(cleanIso);
    if (isNaN(d.getTime())) {
      return new Date().toLocaleString('tr-TR');
    }
    return d.toLocaleString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="page">
      <div className="page-header">
        <div className="page-header-left">
          <h2>İşlem Kayıtları (Audit Log)</h2>
          <p>Sistem genelinde yapılan tüm ekleme, düzenleme, silme ve giriş/çıkış hareketleri</p>
        </div>
      </div>

      {/* Filter Options */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-body" style={{ padding: 16 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
            <div style={{ flex: 1, minWidth: 240, position: 'relative' }}>
              <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-400)' }}>
                <IconSearch size={18} />
              </span>
              <input
                className="form-input"
                placeholder="İşlem açıklaması, personel adı veya detay ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ paddingLeft: 38, width: '100%', margin: 0 }}
              />
            </div>

            <div style={{ minWidth: 150 }}>
              <select className="form-input" value={actionFilter} onChange={(e) => setActionFilter(e.target.value)} style={{ margin: 0 }}>
                <option value="All">Tüm İşlem Türleri</option>
                <option value="Ekleme">Ekleme</option>
                <option value="Düzenleme">Düzenleme</option>
                <option value="Silme">Silme</option>
                <option value="Giriş">Giriş</option>
                <option value="Satış">Satış</option>
                <option value="Stok Hareketi">Stok Hareketi</option>
              </select>
            </div>

            <div style={{ minWidth: 150 }}>
              <select className="form-input" value={moduleFilter} onChange={(e) => setModuleFilter(e.target.value)} style={{ margin: 0 }}>
                <option value="All">Tüm Modüller</option>
                <option value="Hasta">Hasta</option>
                <option value="Hastalar">Hastalar</option>
                <option value="Randevu">Randevu</option>
                <option value="Stok">Stok</option>
                <option value="Satış">Satış</option>
                <option value="Tedarikçi">Tedarikçi</option>
                <option value="Masraf">Masraf</option>
                <option value="Kullanıcı">Kullanıcı</option>
                <option value="Sistem">Sistem</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Logs Table */}
      <div className="card">
        <div className="card-body" style={{ padding: 0, overflowX: 'auto' }}>
          <table className="table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: 'var(--gray-50)', borderBottom: '1px solid var(--surface-border)' }}>
                <th style={{ padding: '12px 16px', fontWeight: 600, fontSize: '0.84rem', color: 'var(--gray-600)' }}>Tarih / Saat</th>
                <th style={{ padding: '12px 16px', fontWeight: 600, fontSize: '0.84rem', color: 'var(--gray-600)' }}>Kullanıcı</th>
                <th style={{ padding: '12px 16px', fontWeight: 600, fontSize: '0.84rem', color: 'var(--gray-600)' }}>İşlem</th>
                <th style={{ padding: '12px 16px', fontWeight: 600, fontSize: '0.84rem', color: 'var(--gray-600)' }}>Modül</th>
                <th style={{ padding: '12px 16px', fontWeight: 600, fontSize: '0.84rem', color: 'var(--gray-600)' }}>Açıklama</th>
                <th style={{ padding: '12px 16px', fontWeight: 600, fontSize: '0.84rem', color: 'var(--gray-600)' }}>Detaylar</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: 40, textAlign: 'center', color: 'var(--gray-400)' }}>
                    Kriterlere uygun sistem işlem kaydı bulunamadı.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} style={{ borderBottom: '1px solid var(--surface-border-light)' }}>
                    <td style={{ padding: '14px 16px', fontSize: '0.86rem', color: 'var(--gray-700)', whiteSpace: 'nowrap' }}>
                      {formatDateDisplay(log.timestamp, (log as any).createdAt)}
                    </td>
                    <td style={{ padding: '14px 16px', fontWeight: 600, color: 'var(--gray-800)' }}>
                      {log.userName || log.userId || 'Dr. Elif Arslan'}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span className="badge" style={{
                        background: 
                          log.action === 'Ekleme' ? 'var(--success-50)' :
                          log.action === 'Düzenleme' ? 'var(--info-50)' :
                          log.action === 'Silme' ? 'var(--danger-50)' : 'var(--gray-100)',
                        color:
                          log.action === 'Ekleme' ? 'var(--success-600)' :
                          log.action === 'Düzenleme' ? 'var(--info-600)' :
                          log.action === 'Silme' ? 'var(--danger-600)' : 'var(--gray-700)',
                        padding: '4px 8px',
                        borderRadius: 4,
                        fontSize: '0.8rem',
                        fontWeight: 600
                      }}>
                        {log.action}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span className="badge" style={{
                        background: 'var(--primary-50)',
                        color: 'var(--primary-700)',
                        padding: '4px 8px',
                        borderRadius: 4,
                        fontSize: '0.8rem',
                        fontWeight: 600
                      }}>
                        {log.module}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: '0.86rem', color: 'var(--gray-800)' }}>
                      {log.description}
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: '0.82rem', color: 'var(--gray-500)', fontStyle: 'italic' }}>
                      {log.details || '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
