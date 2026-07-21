'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { formatCurrency } from '../data/mockData';
import { ResponsiveBar } from '@nivo/bar';
import { ResponsivePie } from '@nivo/pie';
import { IconCash, IconReports, IconPatients, IconRecall, IconBranches } from '../components/Icons';

export default function ReportsPage() {
  const { patientsList, salesList, appointmentsList, recallList, addToast } = useApp();
  const [selectedYear, setSelectedYear] = useState('2026');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // 1. İstatistikleri Gerçek Zamanlı Hesapla
  const stats = useMemo(() => {
    // Seçilen yıla ait satışlar
    const annualSales = salesList.filter(s => s.date.startsWith(selectedYear));
    const annualRevenue = annualSales.reduce((sum, s) => sum + s.total, 0);

    // Dönüşüm Oranı (Satış Yapıldı olan hastaların oranı)
    const totalPatients = patientsList.length;
    const patientsWithSales = patientsList.filter(p => p.salesStage === 'Satış Yapıldı').length;
    const conversionRate = totalPatients > 0 ? Math.round((patientsWithSales / totalPatients) * 100) : 0;

    // Ortalama Hasta Başı Ciro
    const avgRevenuePerPatient = patientsWithSales > 0 ? Math.round(annualRevenue / patientsWithSales) : 0;

    // Recall Başarı Oranı (Tamamlandı veya Randevu Alındı durumundaki recall'lar)
    const totalRecalls = recallList.length;
    const completedRecalls = recallList.filter(r => r.status === 'Tamamlandı' || r.status === 'Randevu Alındı').length;
    const recallSuccessRate = totalRecalls > 0 ? Math.round((completedRecalls / totalRecalls) * 100) : 0;

    return {
      annualRevenue,
      conversionRate,
      avgRevenuePerPatient,
      recallSuccessRate,
      annualSalesCount: annualSales.length
    };
  }, [patientsList, salesList, recallList, selectedYear]);

  // 2. Grafiklerin Data Hazırlıkları
  const monthlyRevenueData = useMemo(() => {
    const months = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
    const monthlyTotals = Array(12).fill(0);

    salesList
      .filter(s => s.date.startsWith(selectedYear))
      .forEach(s => {
        const parts = s.date.split('-');
        if (parts.length === 3) {
          const monthIdx = parseInt(parts[1], 10) - 1;
          if (monthIdx >= 0 && monthIdx < 12) {
            monthlyTotals[monthIdx] += s.total;
          }
        }
      });

    return months.map((label, idx) => ({
      ay: label,
      ciro: monthlyTotals[idx]
    }));
  }, [salesList, selectedYear]);

  const sourcePieData = useMemo(() => {
    const sources = {
      'Doktor': 0,
      'Sosyal Medya': 0,
      'Tavsiye': 0,
      'Yürüyerek': 0,
      'Web': 0
    };

    patientsList.forEach(p => {
      const src = p.source || 'Tavsiye';
      if (src in sources) {
        sources[src as keyof typeof sources]++;
      }
    });

    const displayLabels: Record<string, string> = {
      'Doktor': 'Doktor Yön.',
      'Sosyal Medya': 'Sosyal Medya',
      'Tavsiye': 'Tavsiye',
      'Yürüyerek': 'Yürüyerek',
      'Web': 'Web Sitesi'
    };

    return Object.keys(sources).map(key => ({
      id: displayLabels[key] || key,
      label: displayLabels[key] || key,
      value: sources[key as keyof typeof sources]
    }));
  }, [patientsList]);

  const funnelBarData = useMemo(() => {
    const totalApts = appointmentsList.length;
    const visitedApts = appointmentsList.filter(a => a.status === 'Geldi').length;
    const triedDevice = patientsList.filter(p => p.salesStage === 'Cihaz Denendi' || p.salesStage === 'Teklif Verildi' || p.salesStage === 'Satış Yapıldı').length;
    const soldCount = patientsList.filter(p => p.salesStage === 'Satış Yapıldı').length;

    return [
      { asama: 'Satış', adet: soldCount },
      { asama: 'Deneme', adet: triedDevice },
      { asama: 'Muayene', adet: visitedApts },
      { asama: 'Randevu', adet: totalApts }
    ];
  }, [appointmentsList, patientsList]);

  const audiologistData = useMemo(() => {
    const names = Array.from(new Set([
      ...appointmentsList.map(a => a.audiologist),
      ...salesList.map(s => s.audiologist).filter(Boolean) as string[]
    ]));

    return names.map(name => {
      const doctorSales = salesList.filter(s => s.audiologist === name);
      const revenue = doctorSales.reduce((sum, s) => sum + s.total, 0);
      const salesCount = doctorSales.length;
      
      const doctorApts = appointmentsList.filter(a => a.audiologist === name);
      const aptsCount = doctorApts.length;
      const conversion = aptsCount > 0 ? Math.round((salesCount / aptsCount) * 100) : 0;

      return {
        name,
        sales: salesCount,
        revenue,
        conversion
      };
    });
  }, [appointmentsList, salesList]);

  // CSV Rapor İndirme Fonksiyonu
  const handleDownloadReport = () => {
    if (salesList.length === 0) {
      addToast({ type: 'warning', message: 'İndirilecek ciro/satış verisi bulunamadı.' });
      return;
    }

    const headers = ['Satış ID', 'Hasta Adı', 'Tarih', 'Toplam Tutar', 'SGK Katkısı', 'Hasta Payı', 'Ödeme Yöntemi', 'Odyolog'];
    const rows = salesList.map(sale => [
      sale.id,
      sale.patientName,
      sale.date,
      sale.total,
      sale.sgkAmount,
      sale.patientAmount,
      sale.paymentMethod,
      sale.audiologist || 'Belirtilmemiş'
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(val => `"${val}"`).join(','))
    ].join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `analitik_ciro_raporu_${selectedYear}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    addToast({
      type: 'success',
      message: `${selectedYear} yılına ait ciro raporu (${salesList.length} kayıt) başarıyla bilgisayarınıza indirildi.`
    });
  };

  return (
    <div className="page">
      <div className="page-header">
        <div className="page-header-left">
          <h2>Raporlama & Analitik</h2>
          <p>Sistem verilerine dayalı gerçek zamanlı CRM, finans ve operasyonel analitik</p>
        </div>
        <div className="page-header-actions" style={{ display: 'flex', gap: 10 }}>
          <select
            className="form-select"
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            style={{ width: 100, height: 38, padding: '0 10px' }}
          >
            <option value="2026">2026</option>
            <option value="2025">2025</option>
            <option value="2024">2024</option>
            <option value="2023">2023</option>
          </select>
          <button className="btn btn-secondary" onClick={handleDownloadReport}
            style={{ display: 'flex', alignItems: 'center', gap: 6, height: 38 }}>
            📥 Rapor İndir
          </button>
        </div>
      </div>

      {/* İstatistik Özet Kartları */}
      <div className="stats-grid" style={{ marginBottom: 20 }}>
        <div className="stat-card">
          <div className="stat-icon success" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <IconCash size={22} strokeWidth={1.8} />
          </div>
          <div className="stat-content">
            <div className="stat-label">Yıllık Toplam Ciro ({selectedYear})</div>
            <div className="stat-value">{formatCurrency(stats.annualRevenue)}</div>
            <span className="stat-change up" style={{ fontSize: '0.74rem' }}>
              Toplam {stats.annualSalesCount} satış kaydı üzerinden hesaplandı
            </span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon primary" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <IconReports size={22} strokeWidth={1.8} />
          </div>
          <div className="stat-content">
            <div className="stat-label">Genel CRM Dönüşüm Oranı</div>
            <div className="stat-value">%{stats.conversionRate}</div>
            <span className="stat-change up" style={{ fontSize: '0.74rem' }}>
              Cihaz satılan hastaların toplam hastalara oranı
            </span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon info" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <IconPatients size={22} strokeWidth={1.8} />
          </div>
          <div className="stat-content">
            <div className="stat-label">Müşteri Başı Ortalama Ciro</div>
            <div className="stat-value">{formatCurrency(stats.avgRevenuePerPatient)}</div>
            <span className="stat-change" style={{ fontSize: '0.74rem', color: 'var(--gray-500)' }}>
              Satış yapılan her bir hasta ortalaması
            </span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon accent" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <IconRecall size={22} strokeWidth={1.8} />
          </div>
          <div className="stat-content">
            <div className="stat-label">Recall Randevu Başarı Oranı</div>
            <div className="stat-value">%{stats.recallSuccessRate}</div>
            <span className="stat-change up" style={{ fontSize: '0.74rem' }}>
              Randevuya dönen/tamamlanan hatırlatmalar
            </span>
          </div>
        </div>
      </div>

      {/* Grafikler Grid */}
      <div className="dashboard-grid" style={{ marginBottom: 20 }}>
        {/* Aylık Ciro Trendi */}
        <div className="card">
          <div className="card-header">
            <span className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ color: 'var(--primary-600)', display: 'inline-flex' }}>
                <IconReports size={18} strokeWidth={1.8} />
              </span>
              Aylık Ciro Trendi ({selectedYear})
            </span>
          </div>
          <div className="card-body" style={{ height: 280, position: 'relative' }}>
            {mounted ? (
              <ResponsiveBar
                data={monthlyRevenueData}
                keys={['ciro']}
                indexBy="ay"
                margin={{ top: 20, right: 10, bottom: 40, left: 60 }}
                padding={0.35}
                valueScale={{ type: 'linear' }}
                indexScale={{ type: 'band', round: true }}
                colors="rgba(46, 122, 113, 0.85)"
                borderRadius={4}
                axisLeft={{
                  tickSize: 5,
                  tickPadding: 5,
                  tickRotation: 0,
                  format: (v) => `${(Number(v) / 1000).toFixed(0)}k TL`
                }}
                axisBottom={{
                  tickSize: 5,
                  tickPadding: 5,
                  tickRotation: 0
                }}
                enableLabel={false}
                theme={{
                  axis: {
                    ticks: {
                      text: {
                        fill: "var(--gray-600)",
                        fontSize: 11
                      }
                    }
                  },
                  grid: {
                    line: {
                      stroke: "var(--gray-100)",
                      strokeWidth: 1
                    }
                  }
                }}
              />
            ) : (
              <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: 'var(--gray-400)' }}>
                Grafik Yükleniyor...
              </div>
            )}
          </div>
        </div>

        {/* Satış Hunisi */}
        <div className="card">
          <div className="card-header">
            <span className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ color: 'var(--accent-500)', display: 'inline-flex' }}>
                <IconRecall size={18} strokeWidth={1.8} />
              </span>
              CRM Satış Hunisi
            </span>
          </div>
          <div className="card-body" style={{ height: 280, position: 'relative' }}>
            {mounted ? (
              <ResponsiveBar
                data={funnelBarData}
                keys={['adet']}
                indexBy="asama"
                margin={{ top: 20, right: 10, bottom: 40, left: 70 }}
                padding={0.3}
                layout="horizontal"
                valueScale={{ type: 'linear' }}
                indexScale={{ type: 'band', round: true }}
                colors="rgba(224, 126, 44, 0.85)"
                borderRadius={4}
                axisBottom={{
                  tickSize: 5,
                  tickPadding: 5,
                  tickRotation: 0
                }}
                enableLabel={true}
                labelTextColor="#ffffff"
                theme={{
                  axis: {
                    ticks: {
                      text: {
                        fill: "var(--gray-600)",
                        fontSize: 11
                      }
                    }
                  }
                }}
              />
            ) : (
              <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: 'var(--gray-400)' }}>
                Grafik Yükleniyor...
              </div>
            )}
          </div>
        </div>

        {/* Hasta Kaynağı Dağılımı */}
        <div className="card">
          <div className="card-header">
            <span className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ color: 'var(--info-500)', display: 'inline-flex' }}>
                <IconBranches size={18} strokeWidth={1.8} />
              </span>
              Hasta Kaynak Dağılımı
            </span>
          </div>
          <div className="card-body" style={{ height: 280, position: 'relative' }}>
            {mounted ? (
              <ResponsivePie
                data={sourcePieData}
                margin={{ top: 30, right: 20, bottom: 40, left: 20 }}
                innerRadius={0.45}
                padAngle={0.7}
                cornerRadius={3}
                activeOuterRadiusOffset={8}
                colors={['#1f6059', '#e07e2c', '#2d547a', '#825136', '#4b5842']}
                borderWidth={1}
                borderColor={{ from: 'color', modifiers: [['darker', 0.2]] }}
                arcLinkLabelsSkipAngle={10}
                arcLinkLabelsTextColor="var(--gray-700)"
                arcLinkLabelsThickness={2}
                arcLinkLabelsColor={{ from: 'color' }}
                arcLabelsSkipAngle={10}
                arcLabelsTextColor="#ffffff"
                enableArcLinkLabels={true}
              />
            ) : (
              <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: 'var(--gray-400)' }}>
                Grafik Yükleniyor...
              </div>
            )}
          </div>
        </div>

        {/* Odyolog Performansı */}
        <div className="card">
          <div className="card-header">
            <span className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ color: 'var(--primary-600)', display: 'inline-flex' }}>
                <IconPatients size={18} strokeWidth={1.8} />
              </span>
              Odyolog Performans Tablosu
            </span>
          </div>
          <div className="card-body">
            <div className="table-container" style={{ maxHeight: 280, overflowY: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--gray-200)', textAlign: 'left' }}>
                    <th style={{ padding: '8px 4px', fontSize: '0.8rem', color: 'var(--gray-500)' }}>Ad Soyad</th>
                    <th style={{ padding: '8px 4px', fontSize: '0.8rem', color: 'var(--gray-500)', textAlign: 'center' }}>Randevu</th>
                    <th style={{ padding: '8px 4px', fontSize: '0.8rem', color: 'var(--gray-500)', textAlign: 'center' }}>Satış</th>
                    <th style={{ padding: '8px 4px', fontSize: '0.8rem', color: 'var(--gray-500)', textAlign: 'right' }}>Ciro</th>
                    <th style={{ padding: '8px 4px', fontSize: '0.8rem', color: 'var(--gray-500)', textAlign: 'right' }}>Dönüşüm</th>
                  </tr>
                </thead>
                <tbody>
                  {audiologistData.map((doc, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid var(--gray-100)' }}>
                      <td style={{ padding: '10px 4px', fontWeight: 600, fontSize: '0.88rem' }}>{doc.name}</td>
                      <td style={{ padding: '10px 4px', textAlign: 'center', fontSize: '0.85rem' }}>
                        {appointmentsList.filter(a => a.audiologist === doc.name).length}
                      </td>
                      <td style={{ padding: '10px 4px', textAlign: 'center', fontSize: '0.85rem' }}>{doc.sales}</td>
                      <td style={{ padding: '10px 4px', textAlign: 'right', fontWeight: 700, color: 'var(--primary-600)', fontSize: '0.85rem' }}>
                        {formatCurrency(doc.revenue)}
                      </td>
                      <td style={{ padding: '10px 4px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'flex-end' }}>
                          <span style={{ fontWeight: 600, fontSize: '0.82rem', color: doc.conversion > 50 ? 'var(--success-600)' : 'var(--warning-600)' }}>
                            %{doc.conversion}
                          </span>
                          <div style={{ width: 40, height: 5, background: 'var(--gray-100)', borderRadius: 2, overflow: 'hidden' }}>
                            <div style={{
                              width: `${Math.min(doc.conversion, 100)}%`,
                              height: '100%',
                              background: doc.conversion > 50 ? 'var(--success-500)' : 'var(--warning-500)'
                            }} />
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {audiologistData.length === 0 && (
                    <tr>
                      <td colSpan={5} style={{ padding: 20, textAlign: 'center', color: 'var(--gray-400)' }}>
                        Odyolog performans verisi bulunmamaktadır.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
