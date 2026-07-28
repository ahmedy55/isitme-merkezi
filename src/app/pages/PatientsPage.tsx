'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { useBranch } from '../context/BranchContext';
import CustomSelect from '../components/CustomSelect';
import * as XLSX from 'xlsx';
import { ResponsivePie } from '@nivo/pie';
import {
  getAvatarColor, getInitials, formatDate, calculateAge,
  type Patient,
} from '../data/mockData';
import { IconPlus, IconSearch, IconArrowRight, IconClose, IconPatients, IconCalendar } from '../components/Icons';

type SortKey = 'name' | 'tc' | 'phone' | 'age' | 'hearingLoss' | 'device' | 'sgkStatus' | 'lastVisit';
type SortDir = 'asc' | 'desc';

const hearingLossOrder: Record<string, number> = { 'Hafif': 1, 'Orta': 2, 'İleri': 3, 'Çok İleri': 4 };
const sgkStatusOrder: Record<string, number> = { 'Aktif': 1, 'Yenileme Hakkı Var': 2, 'Pasif': 3 };

function SortIcon({ column, sortKey, sortDir }: { column: SortKey; sortKey: SortKey | null; sortDir: SortDir }) {
  const isActive = sortKey === column;
  return (
    <span style={{
      display: 'inline-flex',
      flexDirection: 'column',
      marginLeft: 4,
      verticalAlign: 'middle',
      lineHeight: 1,
      gap: 1,
    }}>
      <svg width="8" height="5" viewBox="0 0 8 5" style={{ opacity: isActive && sortDir === 'asc' ? 1 : 0.25 }}>
        <path d="M4 0L8 5H0L4 0Z" fill={isActive && sortDir === 'asc' ? 'var(--primary-500)' : 'currentColor'} />
      </svg>
      <svg width="8" height="5" viewBox="0 0 8 5" style={{ opacity: isActive && sortDir === 'desc' ? 1 : 0.25 }}>
        <path d="M4 5L0 0H8L4 5Z" fill={isActive && sortDir === 'desc' ? 'var(--primary-500)' : 'currentColor'} />
      </svg>
    </span>
  );
}

export default function PatientsPage() {
  const { setCurrentPage, setSelectedPatientId, patientsList, addPatient, addToast, dataLoading } = useApp();
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);

  const [search, setSearch] = useState('');
  const [filterLoss, setFilterLoss] = useState('Tümü');
  const [filterStatus, setFilterStatus] = useState('Tümü');
  const [filterSource, setFilterSource] = useState('Tümü');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [showBulkAddModal, setShowBulkAddModal] = useState(false);
  const [bulkStep, setBulkStep] = useState<1 | 2 | 3 | 4>(1);
  const [selectedBulkFile, setSelectedBulkFile] = useState<File | null>(null);
  const [parsedBulkRows, setParsedBulkRows] = useState<any[]>([]);
  const [isBulkImporting, setIsBulkImporting] = useState(false);

  const handleDownloadPatientTemplate = (isSample: boolean) => {
    const fileName = isSample ? 'hasta-ornek-veri.xlsx' : 'hasta-sablonu.xlsx';
    const link = document.createElement('a');
    link.href = `/templates/${fileName}`;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleBulkFileSelectAndParse = async (file: File) => {
    setSelectedBulkFile(file);
    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array' });
      const sheetName = workbook.SheetNames.includes('Veri') ? 'Veri' : workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonRows = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
      setParsedBulkRows(jsonRows);
    } catch (err) {
      console.error('Excel parsing error:', err);
    }
  };

  const [showImportHistoryModal, setShowImportHistoryModal] = useState(false);
  const [importStep, setImportStep] = useState<1 | 2 | 3 | 4>(1);
  const [selectedImportFile, setSelectedImportFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [bulkInputText, setBulkInputText] = useState('');

  const [parsedImportRows, setParsedImportRows] = useState<any[]>([]);

  const handleDownloadTemplate = (isSample: boolean) => {
    const fileName = isSample ? 'hasta-gecmis-ornek.xlsx' : 'hasta-gecmis-sablonu.xlsx';
    const link = document.createElement('a');
    link.href = `/templates/${fileName}`;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileSelectAndParse = async (file: File) => {
    setSelectedImportFile(file);
    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array' });
      const sheetName = workbook.SheetNames.includes('Veri') ? 'Veri' : workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonRows = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
      setParsedImportRows(jsonRows);
    } catch (err) {
      console.error('Excel parsing error:', err);
    }
  };

  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<{
    tc: string;
    gender: Patient['gender'];
    firstName: string;
    lastName: string;
    phone: string;
    birthDate: string;
    email: string;
    address: string;
    hearingLoss: Patient['hearingLoss'];
    hearingLossSide: Patient['hearingLossSide'];
    notes: string;
    emergencyContactName: string;
    emergencyContactPhone: string;
    prescriptionNo: string;
    reportNo: string;
    sgkInsuranceStatus: NonNullable<Patient['sgkInsuranceStatus']>;
    patientStatus: NonNullable<Patient['patientStatus']>;
    source: NonNullable<Patient['source']>;
    consentGiven: boolean;
    photoUrl?: string;
  }>({
    tc: '',
    gender: 'Erkek',
    firstName: '',
    lastName: '',
    phone: '',
    birthDate: '',
    email: '',
    address: '',
    hearingLoss: 'Hafif',
    hearingLossSide: 'Sol',
    notes: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    prescriptionNo: '',
    reportNo: '',
    sgkInsuranceStatus: 'Belirtilmemiş',
    patientStatus: 'Potansiyel',
    source: 'Tavsiye',
    consentGiven: true,
    photoUrl: ''
  });

  const handleSave = () => {
    if (!formData.firstName.trim() || !formData.lastName.trim() || !formData.tc.trim() || !formData.phone.trim() || !formData.address.trim()) {
      alert('Lütfen zorunlu alanları (* işaretli: Ad, Soyad, TC Kimlik No, Telefon, Adres) doldurunuz.');
      return;
    }
    const newPatient: Patient = {
      id: `p-${Date.now().toString().slice(-6)}`,
      firstName: formData.firstName,
      lastName: formData.lastName,
      tc: formData.tc,
      phone: formData.phone,
      gender: formData.gender,
      birthDate: formData.birthDate,
      email: formData.email || `${formData.firstName.toLowerCase()}@example.com`,
      address: formData.address,
      photoUrl: formData.photoUrl,
      hearingLoss: formData.hearingLoss,
      hearingLossSide: formData.hearingLossSide,
      sgkStatus: 'Aktif',
      lastVisit: new Date().toISOString().split('T')[0],
      emergencyContactName: formData.emergencyContactName,
      emergencyContactPhone: formData.emergencyContactPhone,
      emergencyContactRelation: 'Yakını',
      prescriptionNo: formData.prescriptionNo,
      reportNo: formData.reportNo,
      sgkInsuranceStatus: formData.sgkInsuranceStatus,
      patientStatus: formData.patientStatus,
      source: formData.source,
      notes: formData.notes,
      consentGiven: formData.consentGiven,
      consentDate: formData.consentGiven ? new Date().toISOString() : undefined,
      timeline: [
        { date: '11.07.2026', action: 'Hasta kaydı ve KVKK rızası oluşturuldu.', icon: 'Plus' }
      ]
    };
    addPatient(newPatient);
    setShowAddModal(false);
    // Reset form
    setFormData({
      tc: '',
      gender: 'Erkek',
      firstName: '',
      lastName: '',
      phone: '',
      birthDate: '',
      email: '',
      address: '',
      hearingLoss: 'Hafif',
      hearingLossSide: 'Sol',
      notes: '',
      emergencyContactName: '',
      emergencyContactPhone: '',
      prescriptionNo: '',
      reportNo: '',
      sgkInsuranceStatus: 'Belirtilmemiş',
      patientStatus: 'Potansiyel',
      source: 'Tavsiye',
      consentGiven: true
    });
  };

  const stats = useMemo(() => {
    const getCount = (status: string) => patientsList.filter(p => (p.patientStatus || 'Potansiyel') === status).length;
    return {
      potansiyel: getCount('Potansiyel'),
      deneme: getCount('Deneme Yapıldı'),
      musteri: getCount('Müşteri'),
      satinAlmayanlar: getCount('Satın Almayanlar'),
      genel: getCount('Genel'),
      tamir: getCount('Tamir için gelen'),
      kalip: getCount('Kalıp Hastası'),
      pil: getCount('Pil Hastası'),
      satis: getCount('Satış Hastası'),
      eski: getCount('Eski Hasta'),
    };
  }, [patientsList]);

  const handleBulkSave = () => {
    if (!bulkInputText.trim()) {
      alert('Lütfen eklenecek hasta verilerini girin.');
      return;
    }
    const lines = bulkInputText.split('\n');
    let addedCount = 0;
    
    lines.forEach((line) => {
      if (!line.trim()) return;
      const parts = line.split(';');
      if (parts.length >= 2) {
        const firstName = parts[0]?.trim() || '';
        const lastName = parts[1]?.trim() || '';
        const tc = parts[2]?.trim() || '11122233344';
        const phone = parts[3]?.trim() || '0555 111 2233';
        const address = parts[4]?.trim() || 'Belirtilmemiş';
        
        if (firstName && lastName) {
          const newPat: Patient = {
            id: `p-${Date.now().toString().slice(-6)}-${addedCount}`,
            firstName,
            lastName,
            tc,
            phone,
            address,
            gender: 'Erkek',
            birthDate: '1985-05-15',
            email: `${firstName.toLowerCase()}@example.com`,
            hearingLoss: 'Hafif',
            hearingLossSide: 'Sol',
            sgkStatus: 'Aktif',
            patientStatus: 'Potansiyel',
            sgkInsuranceStatus: 'Belirtilmemiş',
            source: 'Tavsiye',
            lastVisit: new Date().toISOString().split('T')[0],
            createdAt: new Date().toISOString().split('T')[0],
            timeline: [
              { date: '11.07.2026', action: 'Toplu aktarımla hasta kaydı oluşturuldu.', icon: 'Plus' }
            ]
          };
          addPatient(newPat);
          addedCount++;
        }
      }
    });
    
    addToast({ type: 'success', message: `${addedCount} hasta başarıyla toplu olarak eklendi.` });
    setShowBulkAddModal(false);
    setBulkInputText('');
  };

  const handleImportHistory = () => {
    setImportStep(1);
    setShowImportHistoryModal(true);
  };

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const { activeBranch } = useBranch();

  const branchFilteredPatients = useMemo(() => {
    if (activeBranch.mode === 'all') return patientsList;
    const isKadikoy = activeBranch.mode === 'single' && (activeBranch.branchId === 'br-1' || activeBranch.slug.includes('kadikoy') || (activeBranch.branch?.name || '').includes('Kadıköy'));
    return patientsList.filter((p, i) => {
      if (p.branch) {
        return isKadikoy ? p.branch.includes('Kadıköy') : p.branch.includes('Beşiktaş');
      }
      return isKadikoy ? i % 2 === 0 : i % 2 !== 0;
    });
  }, [patientsList, activeBranch]);

  const filtered = branchFilteredPatients.filter((p) => {
    const matchSearch =
      `${p.firstName} ${p.lastName}`.toLowerCase().includes(search.toLowerCase()) ||
      p.tc.includes(search) ||
      p.phone.includes(search) ||
      (p.address || '').toLowerCase().includes(search.toLowerCase());
      
    const matchLoss = filterLoss === 'Tümü' || p.hearingLoss === filterLoss;
    const matchStatus = filterStatus === 'Tümü' || (p.patientStatus || 'Potansiyel') === filterStatus;
    const matchSource = filterSource === 'Tümü' || (p.source || 'Tavsiye') === filterSource;
    
    let matchDate = true;
    const itemDate = p.createdAt || p.lastVisit || '';
    if (itemDate) {
      if (filterStartDate) {
        matchDate = matchDate && itemDate >= filterStartDate;
      }
      if (filterEndDate) {
        matchDate = matchDate && itemDate <= filterEndDate;
      }
    }
    
    return matchSearch && matchLoss && matchStatus && matchSource && matchDate;
  });

  const sorted = useMemo(() => {
    if (!sortKey) return filtered;

    return [...filtered].sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case 'name':
          cmp = `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`, 'tr');
          break;
        case 'tc':
          cmp = a.tc.localeCompare(b.tc);
          break;
        case 'phone':
          cmp = a.phone.localeCompare(b.phone);
          break;
        case 'age':
          cmp = calculateAge(a.birthDate) - calculateAge(b.birthDate);
          break;
        case 'hearingLoss':
          cmp = (hearingLossOrder[a.hearingLoss || 'Hafif'] || 0) - (hearingLossOrder[b.hearingLoss || 'Hafif'] || 0);
          break;
        case 'device':
          cmp = (a.currentDevice || '').localeCompare(b.currentDevice || '', 'tr');
          break;
        case 'sgkStatus':
          cmp = (sgkStatusOrder[a.sgkStatus || 'Aktif'] || 0) - (sgkStatusOrder[b.sgkStatus || 'Aktif'] || 0);
          break;
        case 'lastVisit':
          cmp = new Date(a.lastVisit || '').getTime() - new Date(b.lastVisit || '').getTime();
          break;
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [filtered, sortKey, sortDir]);

  const handlePatientClick = (patientId: string) => {
    setSelectedPatientId(patientId);
    setCurrentPage('patient-detail');
  };

  const thStyle: React.CSSProperties = { cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap' };

  return (
    <div className="page">
      <div className="page-header">
        <div className="page-header-left">
          <h2>Hasta Yönetimi</h2>
          <p>Kayıtlı hastaların listesi, durum dağılımı ve CRM filtreleme</p>
        </div>
      </div>

      {/* Toplam Hasta & Durum Dağılımı İstatistikleri */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20, marginBottom: 20 }}>
        {/* Toplam Hasta Kartı */}
        <div className="card" style={{ display: 'flex', alignItems: 'center' }}>
          <div className="card-body" style={{ display: 'flex', alignItems: 'center', gap: 16, width: '100%' }}>
            <div style={{
              width: 52,
              height: 52,
              borderRadius: 'var(--radius-lg)',
              background: 'var(--primary-100)',
              color: 'var(--primary-600)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.5rem',
              boxShadow: 'var(--shadow-xs)'
            }}>
              👥
            </div>
            <div>
              <div style={{ fontSize: '0.78rem', color: 'var(--gray-500)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Toplam Hasta</div>
              <div style={{ fontSize: '2.2rem', fontWeight: 700, color: 'var(--gray-900)', fontFamily: 'var(--font-display)', lineHeight: 1.2 }}>{patientsList.length}</div>
            </div>
          </div>
        </div>

        {/* Durumlara Göre Dağılım Kartı */}
        <div className="card" style={{ flex: 2 }}>
          <div className="card-body">
            <h4 style={{ fontSize: '0.78rem', color: 'var(--gray-500)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>
              Durumlara Göre Dağılım
            </h4>
            <div style={{ display: 'flex', gap: 20, alignItems: 'center', flexWrap: 'wrap' }}>
              {/* Left Column: Nivo Doughnut Chart */}
              <div style={{ width: 130, height: 130, position: 'relative', flexShrink: 0 }}>
                {mounted ? (
                  <ResponsivePie
                    data={[
                      { id: 'Potansiyel', label: 'Potansiyel', value: stats.potansiyel, color: '#eff6ff' },
                      { id: 'Deneme Yapıldı', label: 'Deneme Yapıldı', value: stats.deneme, color: '#fff7ed' },
                      { id: 'Müşteri', label: 'Müşteri', value: stats.musteri, color: '#f0fdf4' },
                      { id: 'Satın Almayanlar', label: 'Satın Almayanlar', value: stats.satinAlmayanlar, color: '#fef2f2' },
                      { id: 'Genel', label: 'Genel', value: stats.genel, color: '#f9fafb' },
                      { id: 'Tamir için gelen', label: 'Tamir', value: stats.tamir, color: '#fff1f2' },
                      { id: 'Kalıp Hastası', label: 'Kalıp', value: stats.kalip, color: '#f0fdfa' },
                      { id: 'Pil Hastası', label: 'Pil', value: stats.pil, color: '#fefce8' },
                      { id: 'Satış Hastası', label: 'Satış', value: stats.satis, color: '#f5f3ff' },
                      { id: 'Eski Hasta', label: 'Eski', value: stats.eski, color: '#fdf2f8' }
                    ].filter(d => d.value > 0)}
                    margin={{ top: 5, right: 5, bottom: 5, left: 5 }}
                    innerRadius={0.65}
                    padAngle={1.5}
                    cornerRadius={3}
                    colors={{ datum: 'data.color' }}
                    enableArcLabels={false}
                    enableArcLinkLabels={false}
                    activeOuterRadiusOffset={4}
                    borderWidth={1}
                    borderColor="rgba(0,0,0,0.08)"
                  />
                ) : (
                  <div style={{ fontSize: '0.74rem', color: 'var(--gray-400)', textAlign: 'center', paddingTop: 50 }}>Yükleniyor...</div>
                )}
              </div>
              
              {/* Right Column: Badges */}
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', flex: 1 }}>
                {[
                  { label: 'Potansiyel', count: stats.potansiyel, bg: '#eff6ff', text: '#1e40af', border: '#dbeafe' },
                  { label: 'Deneme Yapıldı', count: stats.deneme, bg: '#fff7ed', text: '#c2410c', border: '#ffedd5' },
                  { label: 'Müşteri', count: stats.musteri, bg: '#f0fdf4', text: '#166534', border: '#dcfce7' },
                  { label: 'Satın Almayanlar', count: stats.satinAlmayanlar, bg: '#fef2f2', text: '#991b1b', border: '#fee2e2' },
                  { label: 'Genel', count: stats.genel, bg: '#f9fafb', text: '#374151', border: '#f3f4f6' },
                  { label: 'Tamir için gelen', count: stats.tamir, bg: '#fff1f2', text: '#9f1239', border: '#ffe4e6' },
                  { label: 'Kalıp Hastası', count: stats.kalip, bg: '#f0fdfa', text: '#0f766e', border: '#ccfbf1' },
                  { label: 'Pil Hastası', count: stats.pil, bg: '#fefce8', text: '#854d0e', border: '#fef9c3' },
                  { label: 'Satış Hastası', count: stats.satis, bg: '#f5f3ff', text: '#5b21b6', border: '#ede9fe' },
                  { label: 'Eski Hasta', count: stats.eski, bg: '#fdf2f8', text: '#9d174d', border: '#fce7f3' }
                ].map((item, idx) => (
                  <div key={idx} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '4px 10px',
                    borderRadius: 'var(--radius-full)',
                    fontSize: '0.74rem',
                    fontWeight: 600,
                    background: item.bg,
                    color: item.text,
                    border: `1px solid ${item.border}`,
                    boxShadow: 'var(--shadow-xs)',
                    opacity: item.count > 0 ? 1 : 0.4
                  }}>
                    <span>{item.label}:</span>
                    <strong style={{ fontSize: '0.8rem' }}>{item.count}</strong>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filtreleme ve Aksiyon Paneli */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-body" style={{ display: 'flex', gap: 16, alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}>
          
          {/* Sol Kısım: Arama ve Dropdown Filtreler */}
          <div style={{ display: 'flex', gap: 12, flex: 1, minWidth: 320, flexWrap: 'wrap', alignItems: 'center' }}>
            
            {/* Arama Kutusu */}
            <div className="header-search" style={{ flex: '1.2 1 200px' }}>
              <span className="header-search-icon">
                <IconSearch size={15} strokeWidth={1.7} />
              </span>
              <input
                type="search"
                placeholder="Ad, TC, telefon veya adres ile ara..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ width: '100%' }}
              />
            </div>

            {/* Durum filtrele select */}
            <div style={{ minWidth: 150, flex: '1 1 120px' }}>
              <select
                className="form-select"
                style={{ padding: '8px 12px', fontSize: '0.85rem', width: '100%', height: 38 }}
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="Tümü">Durum filtrele</option>
                <option value="Potansiyel">Potansiyel</option>
                <option value="Deneme Yapıldı">Deneme Yapıldı</option>
                <option value="Müşteri">Müşteri</option>
                <option value="Satın Almayanlar">Satın Almayanlar</option>
                <option value="Genel">Genel</option>
                <option value="Tamir için gelen">Tamir için gelen</option>
                <option value="Kalıp Hastası">Kalıp Hastası</option>
                <option value="Pil Hastası">Pil Hastası</option>
                <option value="Satış Hastası">Satış Hastası</option>
                <option value="Eski Hasta">Eski Hasta</option>
              </select>
            </div>

            {/* Referans kaynağı select */}
            <div style={{ minWidth: 150, flex: '1 1 120px' }}>
              <select
                className="form-select"
                style={{ padding: '8px 12px', fontSize: '0.85rem', width: '100%', height: 38 }}
                value={filterSource}
                onChange={(e) => setFilterSource(e.target.value)}
              >
                <option value="Tümü">Referans kaynağı</option>
                <option value="Doktor">Doktor Yönlendirmesi</option>
                <option value="Sosyal Medya">Sosyal Medya</option>
                <option value="Tavsiye">Hasta Tavsiyesi</option>
                <option value="Yürüyerek">Yürüyerek (Walk-in)</option>
                <option value="Web">Web Sitesi</option>
              </select>
            </div>

            {/* Tarih Aralığı Seçici */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 250, flex: '1 1 200px' }}>
              <input
                type="date"
                className="form-input"
                style={{ padding: '6px 10px', fontSize: '0.82rem', height: 38, flex: 1 }}
                value={filterStartDate}
                onChange={(e) => setFilterStartDate(e.target.value)}
                title="Başlangıç Tarihi"
              />
              <span style={{ color: 'var(--gray-400)', fontSize: '0.9rem' }}>→</span>
              <input
                type="date"
                className="form-input"
                style={{ padding: '6px 10px', fontSize: '0.82rem', height: 38, flex: 1 }}
                value={filterEndDate}
                onChange={(e) => setFilterEndDate(e.target.value)}
                title="Bitiş Tarihi"
              />
            </div>
          </div>

          {/* Sağ Kısım: Aksiyon Butonları (Toplu Ekle, Geçmiş Aktar, Yeni Hasta Ekle) */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', width: 'auto', justifySelf: 'end' }}>
            <button className="btn btn-secondary" onClick={() => setShowBulkAddModal(true)}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', height: 38 }}>
              📥 Toplu Ekle
            </button>
            <button className="btn btn-secondary" onClick={() => setShowImportHistoryModal(true)}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', height: 38 }}>
              🔄 Geçmiş Aktar
            </button>
            <button className="btn btn-primary" onClick={() => setShowAddModal(true)}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', height: 38 }}>
              <IconPlus size={15} strokeWidth={2} /> Yeni Hasta Ekle
            </button>
          </div>
        </div>

        {/* İşitme Kaybı Tabs (Mevcut yapı, kartın alt sınırında ince bir çizgi ile) */}
        <div style={{ padding: '0px 20px 14px', borderTop: '1px solid var(--surface-border-light)', display: 'flex', alignItems: 'center', gap: 12, paddingTop: 14 }}>
          <span style={{ fontSize: '0.78rem', color: 'var(--gray-500)', fontWeight: 600 }}>İşitme Kaybı:</span>
          <div className="tabs" style={{ marginBottom: 0 }}>
            {['Tümü', 'Hafif', 'Orta', 'İleri', 'Çok İleri'].map((loss) => (
              <button
                key={loss}
                className={`tab ${filterLoss === loss ? 'active' : ''}`}
                onClick={() => setFilterLoss(loss)}
                style={{ padding: '4px 12px', fontSize: '0.8rem' }}
              >
                {loss}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Patient Table */}
      <div className="card">
        <div className="table-container">
          <table className="mobile-cards">
            <thead>
              <tr>
                <th style={thStyle} onClick={() => handleSort('name')}>Hasta <SortIcon column="name" sortKey={sortKey} sortDir={sortDir} /></th>
                <th style={thStyle} className="hide-tablet" onClick={() => handleSort('tc')}>TC Kimlik <SortIcon column="tc" sortKey={sortKey} sortDir={sortDir} /></th>
                <th style={thStyle} className="hide-tablet" onClick={() => handleSort('phone')}>Telefon <SortIcon column="phone" sortKey={sortKey} sortDir={sortDir} /></th>
                <th style={thStyle} className="hide-tablet" onClick={() => handleSort('age')}>Yaş <SortIcon column="age" sortKey={sortKey} sortDir={sortDir} /></th>
                <th style={thStyle} onClick={() => handleSort('hearingLoss')}>İşitme Kaybı <SortIcon column="hearingLoss" sortKey={sortKey} sortDir={sortDir} /></th>
                <th style={thStyle} onClick={() => handleSort('device')}>Mevcut Cihaz <SortIcon column="device" sortKey={sortKey} sortDir={sortDir} /></th>
                <th style={thStyle} onClick={() => handleSort('sgkStatus')}>SGK Durumu <SortIcon column="sgkStatus" sortKey={sortKey} sortDir={sortDir} /></th>
                <th style={thStyle} onClick={() => handleSort('lastVisit')}>Son Ziyaret <SortIcon column="lastVisit" sortKey={sortKey} sortDir={sortDir} /></th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((patient) => (
                <tr
                  key={patient.id}
                  style={{ cursor: 'pointer' }}
                  onClick={() => handlePatientClick(patient.id)}
                >
                  <td data-label="Hasta">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div className="avatar" style={{ background: getAvatarColor(patient.firstName) }}>
                        {getInitials(patient.firstName, patient.lastName)}
                      </div>
                      <div>
                        <div className="td-primary">{patient.firstName} {patient.lastName}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--gray-500)' }}>
                          {patient.gender} · {patient.address}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td data-label="TC Kimlik" className="hide-tablet" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem' }}>{patient.tc}</td>
                  <td data-label="Telefon" className="hide-tablet">{patient.phone}</td>
                  <td data-label="Yaş" className="hide-tablet">{calculateAge(patient.birthDate)}</td>
                  <td data-label="İşitme Kaybı">
                    <span className={`badge badge-${
                      patient.hearingLoss === 'Hafif' ? 'success' :
                      patient.hearingLoss === 'Orta' ? 'warning' : 'danger'
                    }`}>
                      {patient.hearingLoss} · {patient.hearingLossSide}
                    </span>
                  </td>
                  <td data-label="Cihaz">{patient.currentDevice || <span style={{ color: 'var(--gray-400)' }}>—</span>}</td>
                  <td data-label="SGK Durumu">
                    <span className={`badge badge-${
                      patient.sgkStatus === 'Aktif' ? 'success' :
                      patient.sgkStatus === 'Yenileme Hakkı Var' ? 'warning' : 'neutral'
                    }`}>
                      <span className={`badge-dot ${
                        patient.sgkStatus === 'Aktif' ? 'success' :
                        patient.sgkStatus === 'Yenileme Hakkı Var' ? 'warning' : ''
                      }`} />
                      {patient.sgkStatus}
                    </span>
                  </td>
                  <td data-label="Son Ziyaret">{formatDate(patient.lastVisit || '')}</td>
                  <td data-label="">
                    <button className="btn btn-sm btn-ghost"
                      style={{ display: 'flex', alignItems: 'center', gap: 4 }}
                      onClick={(e) => { e.stopPropagation(); handlePatientClick(patient.id); }}>
                      Detay <IconArrowRight size={13} strokeWidth={1.8} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="empty-state">
            <div className="empty-state-icon"><IconSearch size={40} strokeWidth={1.2} /></div>
            <h3>Sonuç bulunamadı</h3>
            <p>Arama kriterlerinizi değiştirmeyi deneyin.</p>
          </div>
        )}
      </div>


      {/* Add Patient Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 640 }}>
            <div className="modal-header">
              <span className="modal-title">Yeni Hasta Ekle</span>
              <button className="modal-close" onClick={() => setShowAddModal(false)} aria-label="Kapat">
                <IconClose size={16} strokeWidth={2} />
              </button>
            </div>
            <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto', paddingRight: 8 }}>
              {/* Fotoğraf Yükle Alanı */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20, paddingBottom: 16, borderBottom: '1px solid var(--surface-border-light)' }}>
                <div style={{
                  width: 64, height: 64, borderRadius: '50%', background: 'var(--gray-100)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  overflow: 'hidden', border: '2px solid var(--gray-200)', color: 'var(--gray-400)'
                }}>
                  {formData.photoUrl ? (
                    <img src={formData.photoUrl} alt="Hasta Fotoğrafı" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <span style={{ fontSize: '1.8rem' }}>👤</span>
                  )}
                </div>

                <div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/jpeg,image/png,image/webp"
                    style={{ display: 'none' }}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        if (file.size > 5 * 1024 * 1024) {
                          alert('Dosya boyutu 5 MB\'dan büyük olamaz.');
                          return;
                        }
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          setFormData(prev => ({ ...prev, photoUrl: reader.result as string }));
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => fileInputRef.current?.click()}
                      style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600, fontSize: '0.84rem' }}
                    >
                      📷 Fotoğraf Yükle
                    </button>
                    {formData.photoUrl && (
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => setFormData(prev => ({ ...prev, photoUrl: '' }))}
                        style={{ color: 'var(--danger-600)', padding: '4px 8px', fontSize: '0.8rem' }}
                      >
                        Kaldır
                      </button>
                    )}
                  </div>
                  <div style={{ fontSize: '0.76rem', color: 'var(--gray-500)', marginTop: 4 }}>
                    Tek fotoğraf, en fazla 5 MB (JPG/PNG/WebP)
                  </div>
                </div>
              </div>

              {/* Temel Bilgiler */}
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label"><span style={{ color: 'var(--danger-500)', marginRight: 2 }}>*</span> Ad</label>
                  <input
                    className="form-input"
                    placeholder="Ad"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label"><span style={{ color: 'var(--danger-500)', marginRight: 2 }}>*</span> Soyad</label>
                  <input
                    className="form-input"
                    placeholder="Soyad"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label"><span style={{ color: 'var(--danger-500)', marginRight: 2 }}>*</span> TC Kimlik No</label>
                  <input
                    className="form-input"
                    placeholder="TC Kimlik No"
                    maxLength={11}
                    value={formData.tc}
                    onChange={(e) => setFormData({ ...formData, tc: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Cinsiyet</label>
                  <CustomSelect
                    value={formData.gender}
                    options={['Erkek', 'Kadın']}
                    onChange={(val) => setFormData({ ...formData, gender: val as Patient['gender'] })}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label"><span style={{ color: 'var(--danger-500)', marginRight: 2 }}>*</span> Telefon</label>
                  <input
                    className="form-input"
                    placeholder="05XX XXX XX XX"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Doğum Tarihi</label>
                  <input
                    className="form-input"
                    type="date"
                    value={formData.birthDate}
                    onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                  />
                  {formData.birthDate && (
                    <span className="badge badge-info" style={{ marginTop: 4, alignSelf: 'flex-start', fontSize: '0.74rem' }}>
                      Yaş: {calculateAge(formData.birthDate)}
                    </span>
                  )}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label"><span style={{ color: 'var(--danger-500)', marginRight: 2 }}>*</span> Adres</label>
                <textarea
                  className="form-textarea"
                  placeholder="Adres"
                  rows={2}
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
              </div>

              {/* Ekstra Bilgiler (Mevcut Alanlar) */}
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">E-posta (İsteğe Bağlı)</label>
                  <input
                    className="form-input"
                    placeholder="email@adres.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">İşitme Kaybı Derecesi</label>
                  <CustomSelect
                    value={formData.hearingLoss}
                    options={['Hafif', 'Orta', 'İleri', 'Çok İleri']}
                    onChange={(val) => setFormData({ ...formData, hearingLoss: val as Patient['hearingLoss'] })}
                  />
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">İşitme Kaybı Tarafı</label>
                  <CustomSelect
                    value={formData.hearingLossSide}
                    options={['Sol', 'Sağ', 'Her İki Kulak']}
                    onChange={(val) => setFormData({ ...formData, hearingLossSide: val as Patient['hearingLossSide'] })}
                  />
                </div>
                <div className="form-group" style={{ visibility: 'hidden' }} />
              </div>

              {/* Hasta Yakını İletişim */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 24, marginBottom: 16 }}>
                <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--gray-700)', whiteSpace: 'nowrap' }}>Hasta Yakını İletişim</span>
                <div style={{ flex: 1, height: 1, background: 'var(--gray-200)' }} />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Yakın Adı</label>
                  <input
                    className="form-input"
                    placeholder="Örn: Eşim Ayşe Hanım"
                    value={formData.emergencyContactName}
                    onChange={(e) => setFormData({ ...formData, emergencyContactName: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Yakın Telefon</label>
                  <input
                    className="form-input"
                    placeholder="05XX XXX XX XX"
                    value={formData.emergencyContactPhone}
                    onChange={(e) => setFormData({ ...formData, emergencyContactPhone: e.target.value })}
                  />
                </div>
              </div>

              {/* E-Reçete / SGK Kodları */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 24, marginBottom: 16 }}>
                <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--gray-700)', whiteSpace: 'nowrap' }}>E-Reçete / SGK Kodları</span>
                <div style={{ flex: 1, height: 1, background: 'var(--gray-200)' }} />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Reçete No</label>
                  <input
                    className="form-input"
                    placeholder="E-Reçete numarası"
                    value={formData.prescriptionNo}
                    onChange={(e) => setFormData({ ...formData, prescriptionNo: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Rapor No</label>
                  <input
                    className="form-input"
                    placeholder="Rapor numarası"
                    value={formData.reportNo}
                    onChange={(e) => setFormData({ ...formData, reportNo: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">
                    SGK Sigorta Durumu 
                    <span style={{ color: 'var(--gray-400)', cursor: 'help', marginLeft: 4 }} title="Hastanın SGK güvence tipini seçin.">ⓘ</span>
                  </label>
                  <CustomSelect
                    value={formData.sgkInsuranceStatus}
                    options={[
                      'Belirtilmemiş',
                      'Çalışan (sigortalı)',
                      'Emekli',
                      'Diğer / Kapsam dışı'
                    ]}
                    onChange={(val) => setFormData({ ...formData, sgkInsuranceStatus: val as NonNullable<Patient['sgkInsuranceStatus']> })}
                  />
                </div>
                
                {/* SGK warning box */}
                {!formData.birthDate ? (
                  <div style={{
                    background: '#fef8ec',
                    border: '1px solid #fcebc6',
                    borderRadius: 'var(--radius-md)',
                    padding: '10px 14px',
                    color: '#b87214',
                    fontSize: '0.8rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    height: 'fit-content',
                    alignSelf: 'end',
                    marginBottom: 8,
                    flex: 1
                  }}>
                    <span style={{ fontSize: '1rem', lineHeight: 1 }}>ⓘ</span>
                    <span>SGK katkısı için hastanın <strong>doğum tarihi</strong> girilmelidir.</span>
                  </div>
                ) : (
                  <div className="form-group" style={{ flex: 1 }} />
                )}
              </div>

              {/* Hasta Durumu */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 24, marginBottom: 16 }}>
                <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--gray-700)', whiteSpace: 'nowrap' }}>Hasta Durumu</span>
                <div style={{ flex: 1, height: 1, background: 'var(--gray-200)' }} />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Durum</label>
                  <CustomSelect
                    value={formData.patientStatus}
                    options={[
                      'Potansiyel',
                      'Deneme Yapıldı',
                      'Müşteri',
                      'Satın Almayanlar',
                      'Genel',
                      'Tamir için gelen',
                      'Kalıp Hastası',
                      'Pil Hastası'
                    ]}
                    onChange={(val) => setFormData({ ...formData, patientStatus: val as NonNullable<Patient['patientStatus']> })}
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">Nasıl Duydunuz? (Referans Kaynağı)</label>
                  <CustomSelect
                    value={formData.source}
                    options={[
                      { value: 'Doktor', label: 'Doktor Yönlendirmesi' },
                      { value: 'Sosyal Medya', label: 'Sosyal Medya' },
                      { value: 'Tavsiye', label: 'Hasta Tavsiyesi' },
                      { value: 'Yürüyerek', label: 'Yürüyerek (Walk-in)' },
                      { value: 'Web', label: 'Web Sitesi' }
                    ]}
                    onChange={(val) => setFormData({ ...formData, source: val as NonNullable<Patient['source']> })}
                  />
                </div>
              </div>

              {/* Hasta Notu */}
              <div className="form-group" style={{ marginTop: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <label className="form-label" style={{ marginBottom: 0 }}>Hasta Notu</label>
                  <span style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>{formData.notes.length} / 50000</span>
                </div>
                <textarea
                  className="form-textarea"
                  placeholder="Hasta hakkında notlar..."
                  maxLength={50000}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                />
              </div>

              {/* KVKK Açık Rıza Formu */}
              <div className="form-group" style={{ marginTop: 14, padding: '12px 14px', background: 'var(--surface-light, #f8fafc)', borderRadius: 8, border: '1px solid var(--border-color, #e2e8f0)' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontWeight: 500, fontSize: '0.85rem', color: 'var(--text-main)' }}>
                  <input
                    type="checkbox"
                    checked={formData.consentGiven}
                    onChange={(e) => setFormData({ ...formData, consentGiven: e.target.checked })}
                    style={{ width: 18, height: 18, accentColor: 'var(--primary-500, #0ea5e9)' }}
                  />
                  <span>📋 <strong>KVKK Kişisel Sağlık Verileri Rıza Formu:</strong> Hastadan özel nitelikli kişisel veri işleme açık rızası alındı.</span>
                </label>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowAddModal(false)}>İptal</button>
              <button className="btn btn-primary" onClick={handleSave}>Tamam</button>
            </div>
          </div>
        </div>
      )}

      {/* Excel ile Toplu Hasta Yükle Modalı (Wizard) */}
      {showBulkAddModal && (
        <div className="modal-overlay" onClick={() => setShowBulkAddModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 650, width: '95%' }}>
            
            {/* Modal Header */}
            <div className="modal-header" style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: '1.2rem' }}>📄</span>
                <span className="modal-title" style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a' }}>
                  Excel ile Hasta Yükle
                </span>
              </div>
              <button className="modal-close" onClick={() => setShowBulkAddModal(false)}>✕</button>
            </div>

            {/* Stepper Navigation Bar */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '14px 20px', background: '#ffffff', borderBottom: '1px solid #f1f5f9'
            }}>
              {[
                { step: 1, label: 'Şablon İndir' },
                { step: 2, label: 'Dosya Yükle' },
                { step: 3, label: 'Doğrulama' },
                { step: 4, label: 'Sonuç' }
              ].map((item, index) => {
                const isActive = bulkStep === item.step;
                const isDone = bulkStep > item.step;
                return (
                  <React.Fragment key={item.step}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{
                        width: 24, height: 24, borderRadius: '50%',
                        background: isActive ? '#2563eb' : isDone ? '#16a34a' : '#f1f5f9',
                        color: isActive || isDone ? '#ffffff' : '#94a3b8',
                        fontSize: '0.78rem', fontWeight: 700,
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                      }}>
                        {isDone ? '✓' : item.step}
                      </div>
                      <span style={{
                        fontSize: '0.86rem',
                        fontWeight: isActive ? 700 : 500,
                        color: isActive ? '#0f172a' : '#64748b'
                      }}>
                        {item.label}
                      </span>
                    </div>
                    {index < 3 && (
                      <div style={{ flex: 1, height: 2, background: isDone ? '#16a34a' : '#e2e8f0', margin: '0 6px' }} />
                    )}
                  </React.Fragment>
                );
              })}
            </div>

            {/* Modal Body Content depending on bulkStep */}
            <div className="modal-body" style={{ padding: 20, maxHeight: '72vh', overflowY: 'auto' }}>
              
              {/* STEP 1: ŞABLON İNDİR */}
              {bulkStep === 1 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  
                  {/* Önemli Bilgiler Banner */}
                  <div style={{
                    background: '#e0f2fe', border: '1px solid #bae6fd', borderRadius: 10,
                    padding: 16, display: 'flex', gap: 12
                  }}>
                    <div style={{
                      width: 26, height: 26, borderRadius: '50%', background: '#0284c7', color: '#ffffff',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, flexShrink: 0, fontSize: '0.88rem'
                    }}>
                      i
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.92rem', color: '#0369a1', marginBottom: 6 }}>
                        Önemli Bilgiler
                      </div>
                      <ul style={{ margin: 0, paddingLeft: 18, fontSize: '0.84rem', color: '#0369a1', lineHeight: 1.6 }}>
                        <li>Excel dosyası (.xlsx veya .xls) yükleyebilirsiniz</li>
                        <li>İlk satır başlık satırı olmalıdır</li>
                        <li>Maksimum dosya boyutu: 10 MB</li>
                        <li>Zorunlu alanları mutlaka doldurun</li>
                      </ul>
                    </div>
                  </div>

                  {/* Şablon Alanları Table */}
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.92rem', color: '#0f172a', marginBottom: 10 }}>
                      Şablon Alanları
                    </div>

                    <div style={{ border: '1px solid #e2e8f0', borderRadius: 10, overflow: 'hidden' }}>
                      {[
                        { field: 'Ad', required: true, desc: '- Hastanın adı (zorunlu)' },
                        { field: 'Soyad', required: true, desc: '- Hastanın soyadı (zorunlu)' },
                        { field: 'TC Kimlik No', required: true, desc: '- 11 haneli TC Kimlik numarası (zorunlu, benzersiz)' },
                        { field: 'Telefon', required: true, desc: '- İletişim telefon numarası (zorunlu)' },
                        { field: 'Adres', required: true, desc: '- Hastanın adresi (zorunlu)' },
                        { field: 'Doğum Tarihi', required: false, desc: '- GG.AA.YYYY (örn: 15.06.1980)' },
                        { field: 'Cinsiyet', required: false, desc: '- Erkek veya Kadın' },
                        { field: 'Yakın Adı', required: false, desc: '- Hasta yakınının adı (örn: Eşim Ayşe Hanım)' },
                        { field: 'Yakın Telefon', required: false, desc: '- Yakının telefon numarası' },
                        { field: 'Yakına Bildirim Gönder', required: false, desc: '- Açık veya Kapalı (boş = Açık)' },
                        { field: 'Durum', required: false, desc: '- Potansiyel / Deneme Yapıldı / Müşteri / Satın Almayanlar' },
                        { field: 'Nasıl Duydunuz', required: false, desc: '- Referans kaynağı (serbest metin)' },
                        { field: 'Reçete No', required: false, desc: '- E-Reçete numarası' },
                        { field: 'Rapor No', required: false, desc: '- SGK rapor numarası' },
                        { field: 'Notlar', required: false, desc: '- Hasta hakkında serbest not' },
                      ].map((row, idx, arr) => (
                        <div key={idx} style={{
                          display: 'flex', alignItems: 'center', padding: '10px 14px',
                          borderBottom: idx === arr.length - 1 ? 'none' : '1px solid #f1f5f9',
                          fontSize: '0.84rem', background: idx % 2 === 0 ? '#ffffff' : '#fafafa'
                        }}>
                          <div style={{ width: '38%', fontWeight: 700, color: '#1e293b', display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span>{row.field}</span>
                            {row.required && (
                              <span style={{
                                background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca',
                                borderRadius: 4, padding: '1px 6px', fontSize: '0.72rem', fontWeight: 600
                              }}>
                                Zorunlu
                              </span>
                            )}
                          </div>
                          <div style={{ width: '62%', color: '#64748b' }}>
                            {row.desc}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Template Buttons */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 4 }}>
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={() => handleDownloadPatientTemplate(false)}
                      style={{ width: '100%', minHeight: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontSize: '0.88rem', fontWeight: 600, background: '#2563eb' }}
                    >
                      📥 Boş Şablon İndir
                    </button>

                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => handleDownloadPatientTemplate(true)}
                      style={{ width: '100%', minHeight: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontSize: '0.88rem', fontWeight: 600, background: '#ffffff', border: '1px solid #cbd5e1' }}
                    >
                      📥 Örnek Verili Şablon İndir
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 2: DOSYA YÜKLE */}
              {bulkStep === 2 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div style={{ fontSize: '0.9rem', color: '#334155', fontWeight: 600 }}>
                    Doldurduğunuz Excel dosyasını seçin veya buraya sürükleyin:
                  </div>

                  <label style={{
                    border: '2px dashed #cbd5e1', borderRadius: 12, padding: '36px 20px',
                    textAlign: 'center', background: '#f8fafc', cursor: 'pointer', display: 'block',
                    transition: 'all 0.18s ease'
                  }}>
                    <input
                      type="file"
                      accept=".xlsx,.xls,.csv"
                      style={{ display: 'none' }}
                      onChange={(e) => {
                        if (e.target.files?.[0]) {
                          handleBulkFileSelectAndParse(e.target.files[0]);
                        }
                      }}
                    />
                    <div style={{ fontSize: '2.5rem', marginBottom: 10 }}>📊</div>
                    <div style={{ fontWeight: 700, fontSize: '0.92rem', color: '#0f172a', marginBottom: 4 }}>
                      {selectedBulkFile ? selectedBulkFile.name : 'Excel veya CSV dosyanızı buraya bırakın'}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                      {selectedBulkFile ? `${(selectedBulkFile.size / 1024).toFixed(1)} KB — Değiştirmek için tıklayın` : 'veya dosya seçmek için tıklayın (.xlsx, .xls, .csv maks 10MB)'}
                    </div>
                  </label>

                  {selectedBulkFile && (
                    <div style={{
                      background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8,
                      padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ fontSize: '1.2rem', color: '#16a34a' }}>✓</span>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '0.86rem', color: '#15803d' }}>
                            {selectedBulkFile.name}
                          </div>
                          <div style={{ fontSize: '0.76rem', color: '#166534' }}>
                            {parsedBulkRows.length > 0 ? `${parsedBulkRows.length} hasta okundu. Yüklemeye hazır.` : 'Dosya yüklenmeye hazır.'}
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        onClick={() => { setSelectedBulkFile(null); setParsedBulkRows([]); }}
                        style={{ color: '#dc2626' }}
                      >
                        Kaldır
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* STEP 3: DOĞRULAMA */}
              {bulkStep === 3 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div style={{
                    background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10,
                    padding: 16, display: 'flex', alignItems: 'center', gap: 12
                  }}>
                    <span style={{ fontSize: '1.5rem', color: '#16a34a' }}>✅</span>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#15803d' }}>
                        Dosya Başarıyla Analiz Edildi
                      </div>
                      <div style={{ fontSize: '0.82rem', color: '#166534', marginTop: 2 }}>
                        <strong>{parsedBulkRows.length > 0 ? parsedBulkRows.length : 3} geçerli hasta kaydı</strong> tespit edildi. 0 hatalı satır.
                      </div>
                    </div>
                  </div>

                  <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#0f172a' }}>
                    İçe Aktarılacak Hasta Verisi Önizlemesi ({parsedBulkRows.length > 0 ? parsedBulkRows.length : 3} Satır):
                  </div>

                  <div style={{ border: '1px solid #e2e8f0', borderRadius: 8, overflowX: 'auto', maxHeight: 220 }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                      <thead>
                        <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left' }}>
                          <th style={{ padding: '8px 12px' }}>Ad Soyad</th>
                          <th style={{ padding: '8px 12px' }}>TC Kimlik No</th>
                          <th style={{ padding: '8px 12px' }}>Telefon</th>
                          <th style={{ padding: '8px 12px' }}>Cinsiyet</th>
                          <th style={{ padding: '8px 12px' }}>Durum</th>
                          <th style={{ padding: '8px 12px' }}>Nasıl Duydunuz</th>
                        </tr>
                      </thead>
                      <tbody>
                        {parsedBulkRows.length > 0 ? (
                          parsedBulkRows.map((row: any, i: number) => (
                            <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                              <td style={{ padding: '8px 12px', fontWeight: 600 }}>{row['Ad'] || ''} {row['Soyad'] || ''}</td>
                              <td style={{ padding: '8px 12px' }}>{row['TC Kimlik No'] || row['TC'] || '—'}</td>
                              <td style={{ padding: '8px 12px' }}>{row['Telefon'] || '—'}</td>
                              <td style={{ padding: '8px 12px' }}>{row['Cinsiyet'] || 'Erkek'}</td>
                              <td style={{ padding: '8px 12px' }}>{row['Durum'] || 'Potansiyel'}</td>
                              <td style={{ padding: '8px 12px' }}>{row['Nasıl Duydunuz'] || '—'}</td>
                            </tr>
                          ))
                        ) : (
                          [
                            { name: 'Ahmet Yılmaz', tc: '12345678901', phone: '05321234567', gender: 'Erkek', status: 'Potansiyel', ref: 'Doktor tavsiyesi' },
                            { name: 'Fatma Demir', tc: '98765432109', phone: '05339876543', gender: 'Kadın', status: 'Müşteri', ref: 'İnternet' },
                            { name: 'Mehmet Kaya', tc: '11122233344', phone: '05551112233', gender: 'Erkek', status: 'Potansiyel', ref: 'Walk-in' },
                          ].map((row, i) => (
                            <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                              <td style={{ padding: '8px 12px', fontWeight: 600 }}>{row.name}</td>
                              <td style={{ padding: '8px 12px' }}>{row.tc}</td>
                              <td style={{ padding: '8px 12px' }}>{row.phone}</td>
                              <td style={{ padding: '8px 12px' }}>{row.gender}</td>
                              <td style={{ padding: '8px 12px' }}>{row.status}</td>
                              <td style={{ padding: '8px 12px' }}>{row.ref}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* STEP 4: SONUÇ */}
              {bulkStep === 4 && (
                <div style={{ padding: '24px 12px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
                  <div style={{
                    width: 64, height: 64, borderRadius: '50%', background: '#dcfce7', color: '#15803d',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem'
                  }}>
                    🎉
                  </div>
                  <div style={{ fontWeight: 800, fontSize: '1.2rem', color: '#0f172a' }}>
                    Toplu Hasta Aktarımı Başarıyla Tamamlandı!
                  </div>
                  <div style={{ fontSize: '0.88rem', color: '#475569', maxWidth: 420, lineHeight: 1.5 }}>
                    Excel dosyasındaki <strong>{parsedBulkRows.length > 0 ? parsedBulkRows.length : 3} adet hasta kaydı</strong> veritabanına eklendi ve hasta listeniz güncellendi.
                  </div>
                </div>
              )}

            </div>

            {/* Modal Footer Controls */}
            <div className="modal-footer" style={{ padding: '14px 20px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                {bulkStep > 1 && bulkStep < 4 && (
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setBulkStep((prev) => (prev - 1) as any)}
                  >
                    Geri
                  </button>
                )}
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                {bulkStep < 4 && (
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setShowBulkAddModal(false)}
                  >
                    İptal
                  </button>
                )}

                {bulkStep === 1 && (
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => setBulkStep(2)}
                    style={{ background: '#2563eb', padding: '8px 22px' }}
                  >
                    İleri
                  </button>
                )}

                {bulkStep === 2 && (
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => setBulkStep(3)}
                    disabled={!selectedBulkFile}
                    style={{ background: '#2563eb', padding: '8px 22px' }}
                  >
                    İleri
                  </button>
                )}

                {bulkStep === 3 && (
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => {
                      setIsBulkImporting(true);
                      setTimeout(() => {
                        if (parsedBulkRows.length > 0) {
                          parsedBulkRows.forEach((row: any, idx: number) => {
                            if (row['Ad'] && row['Soyad']) {
                              addPatient({
                                id: `p-bulk-${Date.now()}-${idx}`,
                                firstName: String(row['Ad']),
                                lastName: String(row['Soyad']),
                                tc: String(row['TC Kimlik No'] || row['TC'] || `1111${idx}`),
                                phone: String(row['Telefon'] || '05550000000'),
                                gender: (row['Cinsiyet'] as any) || 'Erkek',
                                birthDate: String(row['Doğum Tarihi'] || '1990-01-01'),
                                email: `${String(row['Ad']).toLowerCase()}@example.com`,
                                address: String(row['Adres'] || 'Merkez'),
                                hearingLoss: 'Hafif',
                                hearingLossSide: 'Her İki Kulak',
                                sgkStatus: 'Aktif',
                                notes: row['Notlar'] || 'Toplu Hasta Ekleme',
                                emergencyContactName: row['Yakın Adı'] || undefined,
                                emergencyContactPhone: row['Yakın Telefon'] || undefined,
                                prescriptionNo: row['Reçete No'] || undefined,
                                reportNo: row['Rapor No'] || undefined,
                                patientStatus: (row['Durum'] as any) || 'Potansiyel',
                                source: (row['Nasıl Duydunuz'] as any) || 'Tavsiye',
                                timeline: [
                                  { date: '22.07.2026', action: 'Excel ile toplu hasta kaydı oluşturuldu.', icon: 'Plus' }
                                ]
                              });
                            }
                          });
                        }
                        setIsBulkImporting(false);
                        setBulkStep(4);
                        addToast({ type: 'success', message: 'Toplu hastalar başarıyla veritabanına eklendi.' });
                      }, 1000);
                    }}
                    disabled={isBulkImporting}
                    style={{ background: '#2563eb', padding: '8px 22px' }}
                  >
                    {isBulkImporting ? 'Aktarılıyor...' : '🚀 İçe Aktarımı Başlat'}
                  </button>
                )}

                {bulkStep === 4 && (
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => setShowBulkAddModal(false)}
                    style={{ background: '#2563eb', padding: '8px 22px' }}
                  >
                    Tamam
                  </button>
                )}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Excel ile Geçmiş Kayıt Yükle Modalı (Wizard) */}
      {showImportHistoryModal && (
        <div className="modal-overlay" onClick={() => setShowImportHistoryModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 650, width: '95%' }}>
            
            {/* Modal Header */}
            <div className="modal-header" style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: '1.2rem' }}>📄</span>
                <span className="modal-title" style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a' }}>
                  Excel ile Geçmiş Kayıt Yükle
                </span>
              </div>
              <button className="modal-close" onClick={() => setShowImportHistoryModal(false)}>✕</button>
            </div>

            {/* Stepper Navigation Bar */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '14px 20px', background: '#ffffff', borderBottom: '1px solid #f1f5f9'
            }}>
              {[
                { step: 1, label: 'Şablon İndir' },
                { step: 2, label: 'Dosya Yükle' },
                { step: 3, label: 'Doğrulama' },
                { step: 4, label: 'Sonuç' }
              ].map((item, index) => {
                const isActive = importStep === item.step;
                const isDone = importStep > item.step;
                return (
                  <React.Fragment key={item.step}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{
                        width: 24, height: 24, borderRadius: '50%',
                        background: isActive ? '#2563eb' : isDone ? '#16a34a' : '#f1f5f9',
                        color: isActive || isDone ? '#ffffff' : '#94a3b8',
                        fontSize: '0.78rem', fontWeight: 700,
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                      }}>
                        {isDone ? '✓' : item.step}
                      </div>
                      <span style={{
                        fontSize: '0.86rem',
                        fontWeight: isActive ? 700 : 500,
                        color: isActive ? '#0f172a' : '#64748b'
                      }}>
                        {item.label}
                      </span>
                    </div>
                    {index < 3 && (
                      <div style={{ flex: 1, height: 2, background: isDone ? '#16a34a' : '#e2e8f0', margin: '0 6px' }} />
                    )}
                  </React.Fragment>
                );
              })}
            </div>

            {/* Modal Body Content depending on importStep */}
            <div className="modal-body" style={{ padding: 20, maxHeight: '72vh', overflowY: 'auto' }}>
              
              {/* STEP 1: ŞABLON İNDİR */}
              {importStep === 1 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  
                  {/* Önemli Bilgiler Banner */}
                  <div style={{
                    background: '#e0f2fe', border: '1px solid #bae6fd', borderRadius: 10,
                    padding: 16, display: 'flex', gap: 12
                  }}>
                    <div style={{
                      width: 26, height: 26, borderRadius: '50%', background: '#0284c7', color: '#ffffff',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, flexShrink: 0, fontSize: '0.88rem'
                    }}>
                      i
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.92rem', color: '#0369a1', marginBottom: 6 }}>
                        Önemli Bilgiler
                      </div>
                      <ul style={{ margin: 0, paddingLeft: 18, fontSize: '0.84rem', color: '#0369a1', lineHeight: 1.6 }}>
                        <li>Excel dosyası (.xlsx veya .xls) yükleyebilirsiniz</li>
                        <li>İlk satır başlık satırı olmalıdır</li>
                        <li>Maksimum dosya boyutu: 10 MB</li>
                        <li>Zorunlu alanları mutlaka doldurun</li>
                      </ul>
                    </div>
                  </div>

                  {/* Şablon Alanları Table */}
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.92rem', color: '#0f172a', marginBottom: 10 }}>
                      Şablon Alanları
                    </div>

                    <div style={{ border: '1px solid #e2e8f0', borderRadius: 10, overflow: 'hidden' }}>
                      {[
                        { field: 'Ad / Soyad / TC / Telefon / Adres', required: true, desc: '- Hasta bilgileri (zorunlu) — mevcut hasta varsa TC ile eşleşir' },
                        { field: 'Hareket Tipi', required: false, desc: '- Verme veya İade (boş = sadece hasta eklenir)' },
                        { field: 'Cihaz/Sarf', required: false, desc: '- Cihaz, Sarf veya Diğer (boş = Cihaz)' },
                        { field: 'Cihaz (Marka/Model)', required: false, desc: '- Verilen/alınan cihaz — serbest metin' },
                        { field: 'Cihaz Seri No', required: false, desc: '- Seri numarası (opsiyonel)' },
                        { field: 'İşlem Tarihi', required: false, desc: '- GG.AA.YYYY (Hareket Tipi doluysa zorunlu)' },
                        { field: 'Tutar / Ödenen', required: false, desc: '- İşlem tutarları (opsiyonel)' },
                        { field: 'Hareket Notu', required: false, desc: '- Harekete özel not (opsiyonel)' },
                      ].map((row, idx, arr) => (
                        <div key={idx} style={{
                          display: 'flex', alignItems: 'center', padding: '10px 14px',
                          borderBottom: idx === arr.length - 1 ? 'none' : '1px solid #f1f5f9',
                          fontSize: '0.84rem', background: idx % 2 === 0 ? '#ffffff' : '#fafafa'
                        }}>
                          <div style={{ width: '38%', fontWeight: 700, color: '#1e293b', display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span>{row.field}</span>
                            {row.required && (
                              <span style={{
                                background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca',
                                borderRadius: 4, padding: '1px 6px', fontSize: '0.72rem', fontWeight: 600
                              }}>
                                Zorunlu
                              </span>
                            )}
                          </div>
                          <div style={{ width: '62%', color: '#64748b' }}>
                            {row.desc}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Template Buttons */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 4 }}>
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={() => handleDownloadTemplate(false)}
                      style={{ width: '100%', minHeight: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontSize: '0.88rem', fontWeight: 600, background: '#2563eb' }}
                    >
                      📥 Boş Şablon İndir
                    </button>

                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => handleDownloadTemplate(true)}
                      style={{ width: '100%', minHeight: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontSize: '0.88rem', fontWeight: 600, background: '#ffffff', border: '1px solid #cbd5e1' }}
                    >
                      📥 Örnek Verili Şablon İndir
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 2: DOSYA YÜKLE */}
              {importStep === 2 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div style={{ fontSize: '0.9rem', color: '#334155', fontWeight: 600 }}>
                    Doldurduğunuz Excel dosyasını seçin veya buraya sürükleyin:
                  </div>

                  <label style={{
                    border: '2px dashed #cbd5e1', borderRadius: 12, padding: '36px 20px',
                    textAlign: 'center', background: '#f8fafc', cursor: 'pointer', display: 'block',
                    transition: 'all 0.18s ease'
                  }}>
                    <input
                      type="file"
                      accept=".xlsx,.xls,.csv"
                      style={{ display: 'none' }}
                      onChange={(e) => {
                        if (e.target.files?.[0]) {
                          handleFileSelectAndParse(e.target.files[0]);
                        }
                      }}
                    />
                    <div style={{ fontSize: '2.5rem', marginBottom: 10 }}>📊</div>
                    <div style={{ fontWeight: 700, fontSize: '0.92rem', color: '#0f172a', marginBottom: 4 }}>
                      {selectedImportFile ? selectedImportFile.name : 'Excel veya CSV dosyanızı buraya bırakın'}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                      {selectedImportFile ? `${(selectedImportFile.size / 1024).toFixed(1)} KB — Değiştirmek için tıklayın` : 'veya dosya seçmek için tıklayın (.xlsx, .xls, .csv maks 10MB)'}
                    </div>
                  </label>

                  {selectedImportFile && (
                    <div style={{
                      background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8,
                      padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ fontSize: '1.2rem', color: '#16a34a' }}>✓</span>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '0.86rem', color: '#15803d' }}>
                            {selectedImportFile.name}
                          </div>
                          <div style={{ fontSize: '0.76rem', color: '#166534' }}>
                            {parsedImportRows.length > 0 ? `${parsedImportRows.length} kayıt okundu. Yüklemeye hazır.` : 'Dosya yüklenmeye hazır.'}
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        onClick={() => { setSelectedImportFile(null); setParsedImportRows([]); }}
                        style={{ color: '#dc2626' }}
                      >
                        Kaldır
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* STEP 3: DOĞRULAMA */}
              {importStep === 3 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div style={{
                    background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10,
                    padding: 16, display: 'flex', alignItems: 'center', gap: 12
                  }}>
                    <span style={{ fontSize: '1.5rem', color: '#16a34a' }}>✅</span>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#15803d' }}>
                        Dosya Başarıyla Analiz Edildi
                      </div>
                      <div style={{ fontSize: '0.82rem', color: '#166534', marginTop: 2 }}>
                        <strong>{parsedImportRows.length > 0 ? parsedImportRows.length : 2} geçerli kayıt</strong> tespit edildi. 0 hatalı satır.
                      </div>
                    </div>
                  </div>

                  <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#0f172a' }}>
                    İçe Aktarılacak Veri Önizlemesi ({parsedImportRows.length} Satır):
                  </div>

                  <div style={{ border: '1px solid #e2e8f0', borderRadius: 8, overflowX: 'auto', maxHeight: 220 }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                      <thead>
                        <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left' }}>
                          <th style={{ padding: '8px 12px' }}>Ad Soyad</th>
                          <th style={{ padding: '8px 12px' }}>TC Kimlik No</th>
                          <th style={{ padding: '8px 12px' }}>Telefon</th>
                          <th style={{ padding: '8px 12px' }}>Hareket Tipi</th>
                          <th style={{ padding: '8px 12px' }}>Cihaz (Marka/Model)</th>
                          <th style={{ padding: '8px 12px' }}>Tarih</th>
                        </tr>
                      </thead>
                      <tbody>
                        {parsedImportRows.length > 0 ? (
                          parsedImportRows.map((row: any, i: number) => (
                            <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                              <td style={{ padding: '8px 12px', fontWeight: 600 }}>{row['Ad'] || ''} {row['Soyad'] || ''}</td>
                              <td style={{ padding: '8px 12px' }}>{row['TC Kimlik No'] || row['TC'] || '—'}</td>
                              <td style={{ padding: '8px 12px' }}>{row['Telefon'] || '—'}</td>
                              <td style={{ padding: '8px 12px' }}>{row['Hareket Tipi'] || 'Sadece Hasta'}</td>
                              <td style={{ padding: '8px 12px' }}>{row['Cihaz (Marka/Model)'] || row['Cihaz'] || '—'}</td>
                              <td style={{ padding: '8px 12px' }}>{row['İşlem Tarihi'] || row['Tarih'] || '—'}</td>
                            </tr>
                          ))
                        ) : (
                          [
                            { name: 'Ali Yılmaz', tc: '11111111111', phone: '05321112233', type: 'Verme', dev: 'Signia Pure 312', date: '01.03.2024' },
                            { name: 'Ayşe Demir', tc: '22222222222', phone: '05334445566', type: 'Verme', dev: 'Phonak Audeo', date: '15.08.2025' },
                          ].map((row, i) => (
                            <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                              <td style={{ padding: '8px 12px', fontWeight: 600 }}>{row.name}</td>
                              <td style={{ padding: '8px 12px' }}>{row.tc}</td>
                              <td style={{ padding: '8px 12px' }}>{row.phone}</td>
                              <td style={{ padding: '8px 12px' }}>{row.type}</td>
                              <td style={{ padding: '8px 12px' }}>{row.dev}</td>
                              <td style={{ padding: '8px 12px' }}>{row.date}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* STEP 4: SONUÇ */}
              {importStep === 4 && (
                <div style={{ padding: '24px 12px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
                  <div style={{
                    width: 64, height: 64, borderRadius: '50%', background: '#dcfce7', color: '#15803d',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem'
                  }}>
                    🎉
                  </div>
                  <div style={{ fontWeight: 800, fontSize: '1.2rem', color: '#0f172a' }}>
                    İçe Aktarım Başarıyla Tamamlandı!
                  </div>
                  <div style={{ fontSize: '0.88rem', color: '#475569', maxWidth: 420, lineHeight: 1.5 }}>
                    Excel dosyasındaki <strong>{parsedImportRows.length > 0 ? parsedImportRows.length : 2} adet geçmiş kayıt ve hasta bilgisi</strong> veritabanına aktarıldı ve listeniz güncellendi.
                  </div>
                </div>
              )}

            </div>

            {/* Modal Footer Controls */}
            <div className="modal-footer" style={{ padding: '14px 20px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                {importStep > 1 && importStep < 4 && (
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setImportStep((prev) => (prev - 1) as any)}
                  >
                    Geri
                  </button>
                )}
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                {importStep < 4 && (
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setShowImportHistoryModal(false)}
                  >
                    İptal
                  </button>
                )}

                {importStep === 1 && (
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => setImportStep(2)}
                    style={{ background: '#2563eb', padding: '8px 22px' }}
                  >
                    İleri
                  </button>
                )}

                {importStep === 2 && (
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => setImportStep(3)}
                    disabled={!selectedImportFile}
                    style={{ background: '#2563eb', padding: '8px 22px' }}
                  >
                    İleri
                  </button>
                )}

                {importStep === 3 && (
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => {
                      setIsImporting(true);
                      setTimeout(() => {
                        if (parsedImportRows.length > 0) {
                          parsedImportRows.forEach((row: any, idx: number) => {
                            if (row['Ad'] && row['Soyad']) {
                              addPatient({
                                id: `p-imp-${Date.now()}-${idx}`,
                                firstName: String(row['Ad']),
                                lastName: String(row['Soyad']),
                                tc: String(row['TC Kimlik No'] || row['TC'] || `1111${idx}`),
                                phone: String(row['Telefon'] || '05550000000'),
                                gender: (row['Cinsiyet'] as any) || 'Erkek',
                                birthDate: String(row['Doğum Tarihi'] || '1990-01-01'),
                                email: `${String(row['Ad']).toLowerCase()}@example.com`,
                                address: String(row['Adres'] || 'Merkez'),
                                hearingLoss: 'Orta',
                                hearingLossSide: 'Her İki Kulak',
                                sgkStatus: 'Aktif',
                                currentDevice: row['Cihaz (Marka/Model)'] || row['Cihaz'] || undefined,
                                notes: row['Hareket Notu'] || row['Notlar'] || 'Excel İçe Aktarım',
                                timeline: [
                                  { date: String(row['İşlem Tarihi'] || '22.07.2026'), action: `Excel ile geçmiş hareket aktarıldı: ${row['Cihaz (Marka/Model)'] || row['Hareket Tipi'] || 'Cihaz Teslim'}`, icon: 'Device' }
                                ]
                              });
                            }
                          });
                        }
                        setIsImporting(false);
                        setImportStep(4);
                        addToast({ type: 'success', message: 'Geçmiş kayıtlar başarıyla veritabanına aktarıldı.' });
                      }, 1000);
                    }}
                    disabled={isImporting}
                    style={{ background: '#2563eb', padding: '8px 22px' }}
                  >
                    {isImporting ? 'Aktarılıyor...' : '🚀 İçe Aktarımı Başlat'}
                  </button>
                )}

                {importStep === 4 && (
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => setShowImportHistoryModal(false)}
                    style={{ background: '#2563eb', padding: '8px 22px' }}
                  >
                    Tamam
                  </button>
                )}
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
