'use client';

import React, { useMemo, useEffect, useRef, useState } from 'react';
import { useApp } from '../context/AppContext';
import { formatCurrency } from '../data/mockData';
import { Chart } from 'chart.js/auto';
import { IconCash, IconReports, IconPatients, IconRecall, IconBranches } from '../components/Icons';

export default function ReportsPage() {
  const { patientsList, salesList, appointmentsList, recallList, addToast } = useApp();
  const [selectedYear, setSelectedYear] = useState('2026');

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

    return {
      labels: months,
      values: monthlyTotals
    };
  }, [salesList, selectedYear]);

  const sourceData = useMemo(() => {
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

    return {
      labels: ['Doktor Yönlendirmesi', 'Sosyal Medya', 'Hasta Tavsiyesi', 'Yürüyerek (Walk-in)', 'Web Sitesi'],
      values: [sources['Doktor'], sources['Sosyal Medya'], sources['Tavsiye'], sources['Yürüyerek'], sources['Web']]
    };
  }, [patientsList]);

  const funnelData = useMemo(() => {
    const totalApts = appointmentsList.length;
    const visitedApts = appointmentsList.filter(a => a.status === 'Geldi').length;
    const triedDevice = patientsList.filter(p => p.salesStage === 'Cihaz Denendi' || p.salesStage === 'Teklif Verildi' || p.salesStage === 'Satış Yapıldı').length;
    const soldCount = patientsList.filter(p => p.salesStage === 'Satış Yapıldı').length;

    return {
      labels: ['Toplam Randevu', 'Gelen Hasta (Muayene/Test)', 'Cihaz Deneme', 'Satış Gerçekleşti'],
      values: [totalApts, visitedApts, triedDevice, soldCount]
    };
  }, [appointmentsList, patientsList]);

  const audiologistData = useMemo(() => {
    // Benzersiz odyologlar
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

  // Refs for Charts
  const revenueChartRef = useRef<HTMLCanvasElement | null>(null);
  const sourceChartRef = useRef<HTMLCanvasElement | null>(null);
  const funnelChartRef = useRef<HTMLCanvasElement | null>(null);

  // Instantiated Chart Instances
  const chartInstances = useRef<Record<string, Chart | null>>({
    revenue: null,
    source: null,
    funnel: null
  });

  // Render Charts
  useEffect(() => {
    // 1. Monthly Revenue Chart (Bar)
    if (revenueChartRef.current) {
      if (chartInstances.current.revenue) chartInstances.current.revenue.destroy();
      
      chartInstances.current.revenue = new Chart(revenueChartRef.current, {
        type: 'bar',
        data: {
          labels: monthlyRevenueData.labels,
          datasets: [{
            label: 'Ciro (TL)',
            data: monthlyRevenueData.values,
            backgroundColor: 'rgba(46, 122, 113, 0.75)',
            borderColor: 'var(--primary-600)',
            borderWidth: 1.5,
            borderRadius: 4
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false }
          },
          scales: {
            y: {
              beginAtZero: true,
              grid: { color: 'var(--gray-100)' },
              ticks: {
                callback: (val) => `${val.toLocaleString('tr-TR')} TL`
              }
            },
            x: {
              grid: { display: false }
            }
          }
        }
      });
    }

    // 2. Patient Source Chart (Doughnut)
    if (sourceChartRef.current) {
      if (chartInstances.current.source) chartInstances.current.source.destroy();

      chartInstances.current.source = new Chart(sourceChartRef.current, {
        type: 'doughnut',
        data: {
          labels: sourceData.labels,
          datasets: [{
            data: sourceData.values,
            backgroundColor: [
              'rgba(46, 122, 113, 0.85)', // primary
              'rgba(224, 126, 44, 0.85)',  // accent
              'rgba(46, 120, 196, 0.85)',  // info
              'rgba(217, 140, 26, 0.85)',  // warning
              'rgba(201, 69, 53, 0.85)'    // danger
            ],
            borderWidth: 1
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'bottom',
              labels: {
                boxWidth: 12,
                font: { size: 11 }
              }
            }
          }
        }
      });
    }

    // 3. Sales Funnel Chart (Horizontal Bar)
    if (funnelChartRef.current) {
      if (chartInstances.current.funnel) chartInstances.current.funnel.destroy();

      chartInstances.current.funnel = new Chart(funnelChartRef.current, {
        type: 'bar',
        data: {
          labels: funnelData.labels,
          datasets: [{
            label: 'Hasta Sayısı',
            data: funnelData.values,
            backgroundColor: [
              'rgba(46, 120, 196, 0.75)',  // info
              'rgba(46, 122, 113, 0.75)',  // primary
              'rgba(224, 126, 44, 0.75)',  // accent
              'rgba(46, 180, 100, 0.75)'   // success
            ],
            borderColor: 'var(--gray-200)',
            borderWidth: 1,
            borderRadius: 4
          }]
        },
        options: {
          indexAxis: 'y',
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false }
          },
          scales: {
            x: {
              beginAtZero: true,
              grid: { color: 'var(--gray-100)' }
            },
            y: {
              grid: { display: false }
            }
          }
        }
      });
    }

    return () => {
      Object.values(chartInstances.current).forEach(chart => {
        if (chart) chart.destroy();
      });
    };
  }, [monthlyRevenueData, sourceData, funnelData]);

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

    // UTF-8 BOM ekleyerek Türkçe karakter desteği sağlama
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
          <div className="card-body" style={{ height: 260 }}>
            <canvas ref={revenueChartRef} />
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
          <div className="card-body" style={{ height: 260 }}>
            <canvas ref={funnelChartRef} />
          </div>
        </div>

        {/* Hasta Kaynağı Dağılımı */}
        <div className="card">
          <div className="card-header">
            <span className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ color: 'var(--info-500)', display: 'inline-flex' }}>
                <IconBranches size={18} strokeWidth={1.8} />
              </span>
              Hasta Kaynak Dağılımı (Doughnut)
            </span>
          </div>
          <div className="card-body" style={{ height: 280 }}>
            <canvas ref={sourceChartRef} />
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
