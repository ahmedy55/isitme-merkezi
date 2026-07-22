import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { NewAppointmentModal } from './AppointmentsPage';
import {
  patients, appointments, sales,
  getAvatarColor, getInitials, formatDate, formatCurrency, calculateAge,
  type Patient, type Appointment
} from '../data/mockData';
import {
  IconBack, IconEdit, IconCalendar, IconCheck, IconWarning,
  IconMessage, IconDevice, IconUpload, IconClose, IconPlus, IconArrowRight,
  IconPatients
} from '../components/Icons';

const FREQUENCIES = [250, 500, 1000, 2000, 3000, 4000, 6000, 8000];

export default function PatientDetailPage() {
  const { 
    selectedPatientId, 
    setCurrentPage, 
    addToast, 
    activeDetailTab, 
    setActiveDetailTab, 
    patientsList, 
    updatePatient,
    stockList,
    updateStockItem,
    addSale,
    appointmentsList,
    addAppointment,
    salesList
  } = useApp();

  const [activeTab, setActiveTab] = useState('genel');
  const [comparePast, setComparePast] = useState(false);
  const [isParsingXml, setIsParsingXml] = useState(false);

  const [showEditPatientModal, setShowEditPatientModal] = useState(false);
  const [showQuickAptModal, setShowQuickAptModal] = useState(false);
  const [showServiceModal, setShowServiceModal] = useState(false);

  const [serviceFormData, setServiceFormData] = useState({
    deviceName: '',
    serialNo: '',
    problem: '',
    estimatedDate: '2026-07-15',
    notes: '',
    accessories: [] as string[],
    complaints: [] as string[]
  });

  const toggleDetailAccessory = (acc: string) => {
    const list = serviceFormData.accessories;
    const updated = list.includes(acc) ? list.filter(a => a !== acc) : [...list, acc];
    setServiceFormData({ ...serviceFormData, accessories: updated });
  };

  const toggleDetailComplaint = (comp: string) => {
    const list = serviceFormData.complaints;
    const updated = list.includes(comp) ? list.filter(c => c !== comp) : [...list, comp];
    setServiceFormData({ ...serviceFormData, complaints: updated });
  };

  const [editFormData, setEditFormData] = useState<{
    firstName: string;
    lastName: string;
    tc: string;
    phone: string;
    gender: Patient['gender'];
    birthDate: string;
    email: string;
    address: string;
    hearingLoss: Patient['hearingLoss'];
    hearingLossSide: Patient['hearingLossSide'];
    sgkStatus: NonNullable<Patient['sgkStatus']>;
    emergencyContactName: string;
    emergencyContactPhone: string;
    prescriptionNo: string;
    reportNo: string;
    sgkInsuranceStatus: NonNullable<Patient['sgkInsuranceStatus']>;
    patientStatus: NonNullable<Patient['patientStatus']>;
    source: NonNullable<Patient['source']>;
    notes: string;
  }>({
    firstName: '',
    lastName: '',
    tc: '',
    phone: '',
    gender: 'Erkek',
    birthDate: '',
    email: '',
    address: '',
    hearingLoss: 'Hafif',
    hearingLossSide: 'Sol',
    sgkStatus: 'Aktif',
    emergencyContactName: '',
    emergencyContactPhone: '',
    prescriptionNo: '',
    reportNo: '',
    sgkInsuranceStatus: 'Belirtilmemiş',
    patientStatus: 'Potansiyel',
    source: 'Tavsiye',
    notes: ''
  });

  const [aptFormData, setAptFormData] = useState<{
    date: string;
    time: string;
    type: Appointment['type'];
    audiologist: string;
    branch: Appointment['branch'];
    notes: string;
  }>({
    date: '2026-07-11',
    time: '11:00',
    type: 'Kontrol',
    audiologist: 'Dr. Elif Arslan',
    branch: 'Merkez 1 - Kadıköy',
    notes: ''
  });

  const patient = patientsList.find(p => p.id === selectedPatientId);

  const [audioLeft, setAudioLeft] = useState<number[]>([]);
  const [audioRight, setAudioRight] = useState<number[]>([]);

  const [batterySize, setBatterySize] = useState<'10' | '312' | '13' | '675'>('312');
  const [dailyUsage, setDailyUsage] = useState<number>(8);
  const [lastPurchaseDate, setLastPurchaseDate] = useState<string>('');
  const [packCount, setPackCount] = useState<number>(1);
  
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [notesText, setNotesText] = useState('');
  const lastPatientIdRef = useRef<string | null>(null);

  // Sync tab status with context redirects (only if changed to avoid synchronous rendering warning)
  useEffect(() => {
    if (activeDetailTab && activeDetailTab !== activeTab) {
      setActiveTab(activeDetailTab);
    }
  }, [activeDetailTab, activeTab]);

  useEffect(() => {
    if (patient && lastPatientIdRef.current !== selectedPatientId) {
      lastPatientIdRef.current = selectedPatientId;
      setAudioLeft(patient.audiogramLeft || []);
      setAudioRight(patient.audiogramRight || []);
      setComparePast(false);
      setBatterySize(patient.batterySize || '312');
      setDailyUsage(patient.dailyUsageHours || 8);
      setLastPurchaseDate(patient.lastBatteryPurchaseDate || '');
      setPackCount(patient.batteryPackCount || 1);
      setNotesText(patient.notes || '');
      setIsEditingNotes(false);
      setEditFormData({
        firstName: patient.firstName,
        lastName: patient.lastName,
        tc: patient.tc,
        phone: patient.phone,
        gender: patient.gender,
        birthDate: patient.birthDate,
        email: patient.email,
        address: patient.address,
        hearingLoss: patient.hearingLoss,
        hearingLossSide: patient.hearingLossSide,
        sgkStatus: patient.sgkStatus || 'Aktif',
        emergencyContactName: patient.emergencyContactName || '',
        emergencyContactPhone: patient.emergencyContactPhone || '',
        prescriptionNo: patient.prescriptionNo || '',
        reportNo: patient.reportNo || '',
        sgkInsuranceStatus: patient.sgkInsuranceStatus || 'Belirtilmemiş',
        patientStatus: patient.patientStatus || 'Potansiyel',
        source: patient.source || 'Tavsiye',
        notes: patient.notes || ''
      });
    }
  }, [selectedPatientId, patient]);

  const handleXmlDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsParsingXml(true);
    setTimeout(() => {
      setAudioLeft([25, 35, 45, 55, 65, 70, 75, 80]);
      setAudioRight([20, 30, 40, 50, 60, 65, 70, 75]);
      setIsParsingXml(false);
      addToast({
        type: 'success',
        message: 'Noah XML dosyası başarıyla ayrıştırıldı. Odyogram güncellendi.'
      });
    }, 1200);
  };

  const handleXmlClick = () => {
    setIsParsingXml(true);
    setTimeout(() => {
      setAudioLeft([30, 40, 50, 60, 70, 75, 80, 85]);
      setAudioRight([25, 35, 45, 55, 65, 70, 75, 80]);
      setIsParsingXml(false);
      addToast({
        type: 'success',
        message: 'Noah XML simülasyon verisi başarıyla yüklendi.'
      });
    }, 1200);
  };

  if (!patient) {
    return (
      <div className="page">
        <div className="empty-state">
          <div className="empty-state-icon">
            <IconPatients size={44} />
          </div>
          <h3>Hasta bulunamadı</h3>
          <button className="btn btn-primary" onClick={() => setCurrentPage('patients')}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <IconBack size={15} strokeWidth={2} /> Hasta Listesine Dön
          </button>
        </div>
      </div>
    );
  }

  const handleStartSale = (deviceName: string, price: number) => {
    // Find matching device in stock
    const matchedStockItem = stockList.find(s => s.name.toLowerCase().includes(deviceName.split(' ')[0].toLowerCase()) && (s.status === 'Stokta' || s.status === 'Hastaya Ayrıldı')) 
      || stockList[0];
      
    if (matchedStockItem) {
      const updatedStockItem = {
        ...matchedStockItem,
        status: 'Satıldı' as const,
        utsStatus: 'Bekliyor' as const, // Wait for ÜTS notification
        assignedPatientId: patient.id,
        assignedPatientName: `${patient.firstName} ${patient.lastName}`
      };
      updateStockItem(updatedStockItem);
    }

    const sgkAmount = patient.sgkStatus === 'Yenileme Hakkı Var' ? 6200 : 0;
    const patientAmount = price - sgkAmount;
    const newSale = {
      id: `sl-${Date.now()}`,
      patientId: patient.id,
      patientName: `${patient.firstName} ${patient.lastName}`,
      date: '2026-07-10',
      items: [
        { name: deviceName, quantity: 1, price, type: 'Cihaz' as const }
      ],
      total: price,
      sgkAmount,
      patientAmount,
      paymentMethod: 'Kredi Kartı' as const,
      status: 'Tahsil Edildi' as const,
      audiologist: 'Dr. Elif Arslan'
    };
    addSale(newSale);

    const updatedPatient = {
      ...patient,
      salesStage: 'Satış Yapıldı' as const,
      currentDevice: deviceName,
      deviceDate: '2026-07-10',
      sgkStatus: 'Aktif' as const, // SGK used
      timeline: [
        { date: '10.07.2026', action: `Cihaz satışı tamamlandı. ${deviceName} kasaya işlendi. Fatura oluşturulabilir.`, icon: 'Cash' },
        { date: '10.07.2026', action: `SGK yenileme hakkı kullanıldı. Medula reçete kaydı tamamlandı.`, icon: 'Check' },
        ...(patient.timeline || [])
      ]
    };
    updatePatient(updatedPatient);

    addToast({
      type: 'success',
      message: `${deviceName} cihaz satışı başarıyla tamamlandı! Kasa kaydı oluşturuldu. ÜTS bildirimi yapmak için Stok sayfasına yönlendiriliyorsunuz.`
    });

    setTimeout(() => {
      setCurrentPage('stock');
    }, 2000);
  };

  const handleUpdatePatient = () => {
    if (!patient) return;
    if (!editFormData.firstName.trim() || !editFormData.lastName.trim() || !editFormData.tc.trim() || !editFormData.phone.trim() || !editFormData.address.trim()) {
      alert('Lütfen zorunlu alanları (* işaretli: Ad, Soyad, TC Kimlik No, Telefon, Adres) doldurunuz.');
      return;
    }
    const updated: Patient = {
      ...patient,
      firstName: editFormData.firstName,
      lastName: editFormData.lastName,
      tc: editFormData.tc,
      phone: editFormData.phone,
      gender: editFormData.gender,
      birthDate: editFormData.birthDate,
      email: editFormData.email,
      address: editFormData.address,
      hearingLoss: editFormData.hearingLoss,
      hearingLossSide: editFormData.hearingLossSide,
      sgkStatus: editFormData.sgkStatus,
      emergencyContactName: editFormData.emergencyContactName,
      emergencyContactPhone: editFormData.emergencyContactPhone,
      prescriptionNo: editFormData.prescriptionNo,
      reportNo: editFormData.reportNo,
      sgkInsuranceStatus: editFormData.sgkInsuranceStatus,
      patientStatus: editFormData.patientStatus,
      source: editFormData.source,
      notes: editFormData.notes,
      timeline: [
        { date: '11.07.2026', action: 'Hasta kartı bilgileri güncellendi.', icon: 'Edit' },
        ...(patient.timeline || [])
      ]
    };
    updatePatient(updated);
    setShowEditPatientModal(false);
    addToast({ type: 'success', message: 'Hasta bilgileri başarıyla güncellendi.' });
  };

  const handleSaveService = () => {
    if (!patient) return;
    if (!serviceFormData.deviceName) {
      alert('Lütfen cihaz adı girin.');
      return;
    }

    const updated = {
      ...patient,
      timeline: [
        {
          date: '11.07.2026',
          action: `Teknik Servis Kabulü Yapıldı: ${serviceFormData.deviceName} (${serviceFormData.serialNo || 'SN Belirtilmedi'}). Alınan aksesuarlar: ${serviceFormData.accessories.join(', ') || 'Yok'}. Şikayetler: ${serviceFormData.complaints.join(', ') || 'Belirtilmedi'}`,
          icon: 'Service'
        },
        ...(patient.timeline || [])
      ]
    };
    updatePatient(updated);
    setShowServiceModal(false);
    setServiceFormData({
      deviceName: '',
      serialNo: '',
      problem: '',
      estimatedDate: '2026-07-15',
      notes: '',
      accessories: [],
      complaints: []
    });
    addToast({ type: 'success', message: `${patient.firstName} ${patient.lastName} adına yeni teknik servis kaydı oluşturuldu.` });
  };

  const handleQuickApt = () => {
    if (!patient) return;
    const newApt: Appointment = {
      id: `apt-${Date.now().toString().slice(-6)}`,
      patientId: patient.id,
      patientName: `${patient.firstName} ${patient.lastName}`,
      date: aptFormData.date,
      time: aptFormData.time,
      type: aptFormData.type,
      audiologist: aptFormData.audiologist,
      branch: aptFormData.branch,
      status: 'Bekliyor' as const,
      notes: aptFormData.notes
    };
    addAppointment(newApt);
    
    const updated = {
      ...patient,
      timeline: [
        { date: '11.07.2026', action: `Yeni Randevu Oluşturuldu (${aptFormData.type} - Saat: ${aptFormData.time}).`, icon: 'Calendar' },
        ...(patient.timeline || [])
      ]
    };
    updatePatient(updated);
    
    setShowQuickAptModal(false);
    addToast({ type: 'success', message: 'Randevu başarıyla oluşturuldu ve hasta takvimine eklendi.' });
    setAptFormData({
      date: '2026-07-11',
      time: '11:00',
      type: 'Kontrol',
      audiologist: 'Dr. Elif Arslan',
      branch: 'Merkez 1 - Kadıköy',
      notes: ''
    });
  };

  const patientAppointments = appointmentsList.filter(a => a.patientId === patient.id);
  const patientSales = salesList.filter(s => s.patientId === patient.id);

  return (
    <div className="page">
      {/* Back Button */}
      <button
        className="btn btn-ghost"
        onClick={() => setCurrentPage('patients')}
        style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6 }}
      >
        <IconBack size={16} strokeWidth={1.8} /> Hasta Listesine Dön
      </button>

      {/* Patient Header */}
      <div className="patient-header">
        {patient.photoUrl ? (
          <img
            src={patient.photoUrl}
            alt={patient.firstName}
            style={{ width: 64, height: 64, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--surface-border)' }}
          />
        ) : (
          <div
            className="avatar avatar-xl"
            style={{ background: getAvatarColor(patient.firstName) }}
          >
            {getInitials(patient.firstName, patient.lastName)}
          </div>
        )}
        <div className="patient-header-info">
          <h2>{patient.firstName} {patient.lastName}</h2>
          <div className="patient-header-meta">
            <span style={{ fontFamily: 'var(--font-mono)' }}>{patient.tc}</span>
            <span>{patient.phone}</span>
            <span>{calculateAge(patient.birthDate)} yaşında</span>
            <span>{patient.address}</span>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <span className={`badge badge-${
              patient.hearingLoss === 'Hafif' ? 'success' :
              patient.hearingLoss === 'Orta' ? 'warning' : 'danger'
            }`}>
              {patient.hearingLoss} İşitme Kaybı · {patient.hearingLossSide}
            </span>
            <span className={`badge badge-${
              patient.sgkStatus === 'Aktif' ? 'success' :
              patient.sgkStatus === 'Yenileme Hakkı Var' ? 'warning' : 'neutral'
            }`}>
              SGK: {patient.sgkStatus}
            </span>
          </div>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button className="btn btn-secondary" onClick={() => setShowEditPatientModal(true)} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <IconEdit size={15} strokeWidth={1.8} /> Düzenle
          </button>
          <button className="btn btn-secondary" onClick={() => setShowServiceModal(true)} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <IconPlus size={15} strokeWidth={1.8} /> Servis Kabul
          </button>
          <button className="btn btn-primary" onClick={() => setShowQuickAptModal(true)} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <IconCalendar size={15} strokeWidth={1.8} /> Randevu Oluştur
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs">
        {[
          { id: 'genel', label: 'Genel Bilgiler' },
          { id: 'odyogram', label: 'Odyogram' },
          { id: 'cihaz-onerisi', label: 'Akıllı Cihaz Önerisi' },
          { id: 'pil-takip', label: 'Pil Aboneliği & Takip' },
          { id: 'randevular', label: 'Randevular' },
          { id: 'satis', label: 'Satışlar' },
          { id: 'notlar', label: 'Notlar' },
        ].map((tab) => (
          <button
            key={tab.id}
            className={`tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="patient-tabs-content">
         {activeTab === 'genel' && (
           <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
             <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
               {/* Sol Taraf: Kişisel ve Tıbbi Bilgiler */}
               <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                 <div className="card">
                   <div className="card-header">
                     <span className="card-title">Kişisel Bilgiler</span>
                   </div>
                   <div className="card-body">
                     <div className="responsive-grid-2" style={{ gap: '14px 24px' }}>
                       <div>
                         <div style={{ fontSize: '0.72rem', color: 'var(--gray-500)', marginBottom: 2 }}>Ad Soyad</div>
                         <div style={{ fontWeight: 600 }}>{patient.firstName} {patient.lastName}</div>
                       </div>
                       <div>
                         <div style={{ fontSize: '0.72rem', color: 'var(--gray-500)', marginBottom: 2 }}>TC Kimlik</div>
                         <div style={{ fontWeight: 600, fontFamily: 'monospace' }}>{patient.tc}</div>
                       </div>
                       <div>
                         <div style={{ fontSize: '0.72rem', color: 'var(--gray-500)', marginBottom: 2 }}>Doğum Tarihi</div>
                         <div style={{ fontWeight: 600 }}>{formatDate(patient.birthDate)} ({calculateAge(patient.birthDate)} yaş)</div>
                       </div>
                       <div>
                         <div style={{ fontSize: '0.72rem', color: 'var(--gray-500)', marginBottom: 2 }}>Cinsiyet</div>
                         <div style={{ fontWeight: 600 }}>{patient.gender}</div>
                       </div>
                       <div>
                         <div style={{ fontSize: '0.72rem', color: 'var(--gray-500)', marginBottom: 2 }}>Telefon</div>
                         <div style={{ fontWeight: 600 }}>{patient.phone}</div>
                       </div>
                       <div>
                         <div style={{ fontSize: '0.72rem', color: 'var(--gray-500)', marginBottom: 2 }}>E-posta</div>
                         <div style={{ fontWeight: 600 }}>{patient.email}</div>
                       </div>
                       <div style={{ gridColumn: '1 / -1' }}>
                         <div style={{ fontSize: '0.72rem', color: 'var(--gray-500)', marginBottom: 2 }}>Adres</div>
                         <div style={{ fontWeight: 600 }}>{patient.address}</div>
                       </div>
                     </div>
                   </div>
                 </div>

                 <div className="card">
                   <div className="card-header">
                     <span className="card-title">Cihaz Bilgileri</span>
                   </div>
                   <div className="card-body">
                     <div className="responsive-grid-2" style={{ gap: '14px 24px' }}>
                       <div>
                         <div style={{ fontSize: '0.72rem', color: 'var(--gray-500)', marginBottom: 2 }}>İşitme Kaybı</div>
                         <div style={{ fontWeight: 600 }}>{patient.hearingLoss} · {patient.hearingLossSide}</div>
                       </div>
                       <div>
                         <div style={{ fontSize: '0.72rem', color: 'var(--gray-500)', marginBottom: 2 }}>Mevcut Cihaz</div>
                         <div style={{ fontWeight: 600 }}>{patient.currentDevice || 'Cihaz yok'}</div>
                       </div>
                       {patient.deviceDate && (
                         <div>
                           <div style={{ fontSize: '0.72rem', color: 'var(--gray-500)', marginBottom: 2 }}>Cihaz Alım Tarihi</div>
                           <div style={{ fontWeight: 600 }}>{formatDate(patient.deviceDate)}</div>
                         </div>
                       )}
                       <div>
                         <div style={{ fontSize: '0.72rem', color: 'var(--gray-500)', marginBottom: 2 }}>SGK Durumu</div>
                         <div style={{ fontWeight: 600 }}>{patient.sgkStatus}</div>
                       </div>
                       {patient.sgkRenewalDate && (
                         <div>
                           <div style={{ fontSize: '0.72rem', color: 'var(--gray-500)', marginBottom: 2 }}>SGK Yenileme Tarihi</div>
                           <div style={{ fontWeight: 600 }}>{formatDate(patient.sgkRenewalDate || '')}</div>
                         </div>
                       )}
                       <div>
                         <div style={{ fontSize: '0.72rem', color: 'var(--gray-500)', marginBottom: 2 }}>Kayıt Tarihi</div>
                         <div style={{ fontWeight: 600 }}>{formatDate(patient.createdAt || '')}</div>
                       </div>
                       <div>
                         <div style={{ fontSize: '0.72rem', color: 'var(--gray-500)', marginBottom: 2 }}>Son Ziyaret</div>
                         <div style={{ fontWeight: 600 }}>{formatDate(patient.lastVisit || '')}</div>
                       </div>
                     </div>
                   </div>
                 </div>
               </div>

               {/* Sağ Taraf: CRM & Satış Süreci Takibi */}
               <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                 <div className="card">
                   <div className="card-header">
                     <span className="card-title">CRM & Satış Süreci</span>
                   </div>
                   <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                     <div className="responsive-grid-2" style={{ gap: 14 }}>
                       <div className="form-group">
                         <label className="form-label">Hasta Kaynağı</label>
                         <select 
                           className="form-select"
                           value={patient.source || 'Tavsiye'}
                           onChange={(e) => {
                             const val = e.target.value;
                             const updated = {
                               ...patient,
                               source: val as Patient['source'],
                               timeline: [
                                 { date: '10.07.2026', action: `Hasta kaynağı "${val}" olarak güncellendi.`, icon: 'Edit' },
                                 ...(patient.timeline || [])
                               ]
                             };
                             updatePatient(updated);
                             addToast({ type: 'info', message: 'Hasta kaynağı güncellendi.' });
                           }}
                         >
                           <option value="Doktor">Doktor Yönlendirmesi</option>
                           <option value="Sosyal Medya">Sosyal Medya</option>
                           <option value="Tavsiye">Hasta Tavsiyesi</option>
                           <option value="Yürüyerek">Yürüyerek (Walk-in)</option>
                           <option value="Web">Web Sitesi</option>
                         </select>
                       </div>

                       <div className="form-group">
                         <label className="form-label">Satış Aşaması</label>
                         <select 
                           className="form-select"
                           value={patient.salesStage || 'İlk Görüşme'}
                           onChange={(e) => {
                             const val = e.target.value;
                             const updated = {
                               ...patient,
                               salesStage: val as Patient['salesStage'],
                               timeline: [
                                 { date: '10.07.2026', action: `Satış süreci "${val}" aşamasına taşındı.`, icon: 'Check' },
                                 ...(patient.timeline || [])
                               ]
                             };
                             updatePatient(updated);
                             addToast({ type: 'info', message: `Satış aşaması güncellendi: ${val}` });
                           }}
                         >
                           <option value="İlk Görüşme">İlk Görüşme / Arama</option>
                           <option value="Test Yapıldı">İşitme Testi Yapıldı</option>
                           <option value="Cihaz Denendi">Cihaz Denemesi Yapıldı</option>
                           <option value="Teklif Verildi">Teklif Sunuldu</option>
                           <option value="Satış Yapıldı">Satış Gerçekleşti (Kapandı)</option>
                           <option value="Kaybedildi">Fırsat Kaybedildi</option>
                         </select>
                       </div>
                     </div>

                     <div className="responsive-grid-2" style={{ gap: 14 }}>
                       <div className="form-group">
                         <label className="form-label">Sevk Eden Doktor</label>
                         <input 
                           className="form-input" 
                           defaultValue={patient.doctorName || ''} 
                           placeholder="Doktor Adı"
                           onBlur={(e) => {
                             const val = e.target.value;
                             if (val !== patient.doctorName) {
                               const updated = {
                                 ...patient,
                                 doctorName: val,
                                 timeline: [
                                   { date: '10.07.2026', action: `Muayene doktoru "${val}" olarak eklendi.`, icon: 'Edit' },
                                   ...(patient.timeline || [])
                                 ]
                               };
                               updatePatient(updated);
                               addToast({ type: 'info', message: 'Sevk eden doktor bilgisi güncellendi.' });
                             }
                           }}
                         />
                       </div>

                       <div className="form-group">
                         <label className="form-label">Reçete / Evrak Durumu</label>
                         <select 
                           className="form-select"
                           value={patient.prescriptionStatus || 'Yok'}
                           onChange={(e) => {
                             const val = e.target.value;
                             const updated = {
                               ...patient,
                               prescriptionStatus: val as Patient['prescriptionStatus'],
                               timeline: [
                                 { date: '10.07.2026', action: `Reçete durumu "${val}" olarak güncellendi.`, icon: 'Check' },
                                 ...(patient.timeline || [])
                               ]
                             };
                             updatePatient(updated);
                             addToast({ type: 'info', message: 'Evrak durumu güncellendi.' });
                           }}
                         >
                           <option value="Yok">Reçete Yok / Bekleniyor</option>
                           <option value="Reçete Yazıldı">KBB Reçetesi Yazıldı</option>
                           <option value="SGK Onaylı">Medula / SGK Hak Onaylı</option>
                         </select>
                       </div>
                     </div>

                     <div className="form-group">
                       <label className="form-label">Sonraki Aksiyon Planı</label>
                       <input 
                         className="form-input"
                         defaultValue={patient.nextAction || ''}
                         placeholder="Arayıp teklife dönüş alınacak..."
                         onBlur={(e) => {
                           const val = e.target.value;
                           if (val !== patient.nextAction) {
                             const updated = {
                               ...patient,
                               nextAction: val,
                               timeline: [
                                 { date: '10.07.2026', action: `Gelecek aksiyon güncellendi: "${val}"`, icon: 'Calendar' },
                                 ...(patient.timeline || [])
                               ]
                             };
                             updatePatient(updated);
                             addToast({ type: 'info', message: 'Sonraki aksiyon güncellendi.' });
                           }
                         }}
                       />
                     </div>
                   </div>
                 </div>

                 <div className="card">
                   <div className="card-header">
                     <span className="card-title">Refakatçi & Yakın Bilgisi</span>
                   </div>
                   <div className="card-body">
                     <div className="responsive-grid-2" style={{ gap: '14px 24px' }}>
                       <div>
                         <div style={{ fontSize: '0.72rem', color: 'var(--gray-500)', marginBottom: 2 }}>Yakın Ad Soyad</div>
                         <div style={{ fontWeight: 600 }}>{patient.emergencyContactName || '—'}</div>
                       </div>
                       <div>
                         <div style={{ fontSize: '0.72rem', color: 'var(--gray-500)', marginBottom: 2 }}>Yakınlık Derecesi</div>
                         <div style={{ fontWeight: 600 }}>{patient.emergencyContactRelation || '—'}</div>
                       </div>
                       <div style={{ gridColumn: '1 / -1' }}>
                         <div style={{ fontSize: '0.72rem', color: 'var(--gray-500)', marginBottom: 2 }}>Telefon Numarası</div>
                         <div style={{ fontWeight: 600, fontFamily: 'monospace' }}>{patient.emergencyContactPhone || '—'}</div>
                       </div>
                     </div>
                   </div>
                 </div>
               </div>
             </div>

             {/* Alt Kısım: Zaman Tüneli / Timeline */}
             <div className="card">
               <div className="card-header">
                 <span className="card-title">Hasta İşlem Zaman Çizelgesi (Timeline)</span>
               </div>
                <div className="card-body">
                  <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
                    <input 
                      id="quick-note-input"
                      type="text" 
                      className="form-input" 
                      placeholder="Hastaya ait yeni bir takip notu/sistem notu ekleyin..."
                      style={{ flex: 1 }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          const val = (e.target as HTMLInputElement).value;
                          if (!val.trim()) return;
                          const updated = {
                            ...patient,
                            timeline: [
                              { date: '11.07.2026', action: val, icon: 'Message' },
                              ...(patient.timeline || [])
                            ]
                          };
                          updatePatient(updated);
                          (e.target as HTMLInputElement).value = '';
                          addToast({ type: 'success', message: 'Not başarıyla kaydedildi ve timeline listesine eklendi.' });
                        }
                      }}
                    />
                    <button 
                      className="btn btn-primary"
                      onClick={() => {
                        const input = document.getElementById('quick-note-input') as HTMLInputElement;
                        if (input && input.value.trim()) {
                          const val = input.value;
                          const updated = {
                            ...patient,
                            timeline: [
                              { date: '11.07.2026', action: val, icon: 'Message' },
                              ...(patient.timeline || [])
                            ]
                          };
                          updatePatient(updated);
                          input.value = '';
                          addToast({ type: 'success', message: 'Not başarıyla kaydedildi ve timeline listesine eklendi.' });
                        }
                      }}
                    >
                      Not Ekle
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16, position: 'relative', paddingLeft: 20, borderLeft: '2px solid var(--surface-border-light)', marginLeft: 8 }}>
                   {patient.timeline && patient.timeline.length > 0 ? (
                     patient.timeline.map((event, idx) => (
                       <div key={idx} style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: 4 }}>
                         {/* Timeline Dot */}
                         <div style={{
                           position: 'absolute',
                           left: -27,
                           top: 2,
                           width: 12,
                           height: 12,
                           borderRadius: '50%',
                           backgroundColor: 'var(--primary-600)',
                           border: '2px solid var(--surface-white)',
                         }} />
                         <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                           <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--primary-600)', fontFamily: 'var(--font-mono)' }}>{event.date}</span>
                           <span style={{ fontSize: '0.7rem', color: 'var(--gray-400)' }}>•</span>
                           <span style={{ fontSize: '0.72rem', color: 'var(--gray-500)', fontWeight: 500 }}>Sistem Logu</span>
                         </div>
                         <div style={{ fontSize: '0.84rem', color: 'var(--gray-800)', fontWeight: 500 }}>
                           {event.action}
                         </div>
                       </div>
                     ))
                   ) : (
                     <div style={{ color: 'var(--gray-500)', fontSize: '0.8rem' }}>Hasta için henüz bir sistem hareketi kaydedilmemiş.</div>
                   )}
                 </div>
               </div>
             </div>
           </div>
         )}

        {activeTab === 'odyogram' && (
          <div className="card">
            <div className="card-header">
              <span className="card-title">Odyogram Test Sonuçları</span>
              {patient.pastAudiogramLeft && patient.pastAudiogramRight && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input
                    type="checkbox"
                    id="compare-past"
                    checked={comparePast}
                    onChange={(e) => setComparePast(e.target.checked)}
                    style={{ cursor: 'pointer', width: 16, height: 16 }}
                  />
                  <label htmlFor="compare-past" style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--gray-700)', cursor: 'pointer' }}>
                    1 Yıl Önceki Testle Karşılaştır
                  </label>
                </div>
              )}
            </div>
            <div className="card-body">
              {/* SVG Odyogram Grafiği */}
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24, overflowX: 'auto' }}>
                <svg width="500" height="350" style={{ background: 'var(--surface-white)', border: '1px solid var(--surface-border-light)', borderRadius: 'var(--radius-lg)' }}>
                  {/* Grid Yatay Çizgiler (dB - 0'dan 120'ye) */}
                  {Array.from({ length: 13 }).map((_, idx) => {
                    const db = idx * 10;
                    const y = 30 + (db / 120) * 280;
                    return (
                      <g key={idx}>
                        <line x1="50" y1={y} x2="470" y2={y} stroke="var(--gray-100)" strokeWidth="1" />
                        <text x="40" y={y + 4} fontSize="10" fill="var(--gray-400)" textAnchor="end" style={{ fontFamily: 'var(--font-mono)' }}>
                          {db}
                        </text>
                      </g>
                    );
                  })}

                  {/* Grid Dikey Çizgiler (Frekanslar) */}
                  {FREQUENCIES.map((f, idx) => {
                    const x = 50 + idx * 60;
                    return (
                      <g key={idx}>
                        <line x1={x} y1="30" x2={x} y2="310" stroke="var(--gray-100)" strokeWidth="1" />
                        <text x={x} y="330" fontSize="10" fill="var(--gray-400)" textAnchor="middle" style={{ fontFamily: 'var(--font-mono)' }}>
                          {f}
                        </text>
                      </g>
                    );
                  })}

                  {/* X ve Y eksen etiketleri */}
                  <text x="260" y="345" fontSize="11" fill="var(--gray-500)" textAnchor="middle" fontWeight="600">
                    Frekans (Hz)
                  </text>
                  <text x="15" y="170" fontSize="11" fill="var(--gray-500)" textAnchor="middle" fontWeight="600" transform="rotate(-90 15 170)">
                    İşitme Eşiği (dB)
                  </text>

                  {/* Geçmiş Odyogram Çizgileri */}
                  {comparePast && patient.pastAudiogramRight && (
                    <polyline
                      points={patient.pastAudiogramRight.map((val, i) => `${50 + i * 60},${30 + (val / 120) * 280}`).join(' ')}
                      fill="none"
                      stroke="var(--danger-200)"
                      strokeWidth="1.5"
                      strokeDasharray="4,4"
                    />
                  )}
                  {comparePast && patient.pastAudiogramLeft && (
                    <polyline
                      points={patient.pastAudiogramLeft.map((val, i) => `${50 + i * 60},${30 + (val / 120) * 280}`).join(' ')}
                      fill="none"
                      stroke="var(--info-200)"
                      strokeWidth="1.5"
                      strokeDasharray="4,4"
                    />
                  )}

                  {/* Güncel Odyogram Çizgileri */}
                  {audioRight.length > 0 && (
                    <polyline
                      points={audioRight.map((val, i) => `${50 + i * 60},${30 + (val / 120) * 280}`).join(' ')}
                      fill="none"
                      stroke="var(--danger-500)"
                      strokeWidth="2.2"
                    />
                  )}
                  {audioLeft.length > 0 && (
                    <polyline
                      points={audioLeft.map((val, i) => `${50 + i * 60},${30 + (val / 120) * 280}`).join(' ')}
                      fill="none"
                      stroke="var(--info-500)"
                      strokeWidth="2.2"
                    />
                  )}

                  {/* Geçmiş Noktalar (Daire ve Çarpılar) */}
                  {comparePast && patient.pastAudiogramRight && patient.pastAudiogramRight.map((val, i) => {
                    const cx = 50 + i * 60;
                    const cy = 30 + (val / 120) * 280;
                    return <circle key={`past-r-${i}`} cx={cx} cy={cy} r="4" fill="none" stroke="var(--danger-300)" strokeWidth="1.5" />;
                  })}
                  {comparePast && patient.pastAudiogramLeft && patient.pastAudiogramLeft.map((val, i) => {
                    const cx = 50 + i * 60;
                    const cy = 30 + (val / 120) * 280;
                    return (
                      <g key={`past-l-${i}`}>
                        <line x1={cx - 3.5} y1={cy - 3.5} x2={cx + 3.5} y2={cy + 3.5} stroke="var(--info-300)" strokeWidth="1.5" />
                        <line x1={cx + 3.5} y1={cy - 3.5} x2={cx - 3.5} y2={cy + 3.5} stroke="var(--info-300)" strokeWidth="1.5" />
                      </g>
                    );
                  })}

                  {/* Güncel Noktalar (Daire ve Çarpılar) */}
                  {audioRight.map((val, i) => {
                    const cx = 50 + i * 60;
                    const cy = 30 + (val / 120) * 280;
                    return <circle key={`r-${i}`} cx={cx} cy={cy} r="5" fill="var(--surface-white)" stroke="var(--danger-500)" strokeWidth="2.5" />;
                  })}
                  {audioLeft.map((val, i) => {
                    const cx = 50 + i * 60;
                    const cy = 30 + (val / 120) * 280;
                    return (
                      <g key={`l-${i}`}>
                        <line x1={cx - 5} y1={cy - 5} x2={cx + 5} y2={cy + 5} stroke="var(--info-500)" strokeWidth="2.5" />
                        <line x1={cx + 5} y1={cy - 5} x2={cx - 5} y2={cy + 5} stroke="var(--info-500)" strokeWidth="2.5" />
                      </g>
                    );
                  })}
                </svg>
              </div>

              {/* Sayısal Tablo Görünümü */}
              <div style={{ overflowX: 'auto', marginBottom: 24 }}>
                <table className="mobile-cards">
                  <thead>
                    <tr>
                      <th>Frekans (Hz)</th>
                      {FREQUENCIES.map(f => (
                        <th key={f} style={{ textAlign: 'center' }}>{f}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="td-primary" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ width: 10, height: 10, borderRadius: '50%', border: '2.5px solid var(--danger-500)', display: 'inline-block' }} />
                        Sağ Kulak (dB)
                      </td>
                      {audioRight.map((val, i) => (
                        <td key={i} data-label={`${FREQUENCIES[i]} Hz`} style={{ textAlign: 'center', fontWeight: 600 }}>{val}</td>
                      ))}
                    </tr>
                    <tr>
                      <td className="td-primary" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ color: 'var(--info-500)', fontWeight: 800, fontSize: '14px', lineHeight: '10px' }}>✕</span>
                        Sol Kulak (dB)
                      </td>
                      {audioLeft.map((val, i) => (
                        <td key={i} data-label={`${FREQUENCIES[i]} Hz`} style={{ textAlign: 'center', fontWeight: 600 }}>{val}</td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Noah XML Sürükle Bırak Simülatörü */}
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleXmlDrop}
                onClick={handleXmlClick}
                style={{
                  border: '2px dashed var(--surface-border)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '24px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  background: isParsingXml ? 'var(--primary-50)' : 'var(--gray-50)',
                  borderColor: isParsingXml ? 'var(--primary-400)' : 'var(--surface-border)',
                  color: isParsingXml ? 'var(--primary-700)' : 'var(--gray-600)',
                  transition: 'all 200ms ease',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <IconUpload size={32} strokeWidth={1.5} className={isParsingXml ? 'animate-pulse' : ''} />
                {isParsingXml ? (
                  <div>
                    <h4 style={{ fontWeight: 600, color: 'var(--primary-700)' }}>Noah XML Ayrıştırılıyor...</h4>
                    <p style={{ fontSize: '0.78rem', color: 'var(--primary-500)' }}>Frekans verileri grafik eğrisine aktarılıyor</p>
                  </div>
                ) : (
                  <div>
                    <h4 style={{ fontWeight: 600, color: 'var(--gray-800)' }}>Noah XML / Test Sonucu Yükle</h4>
                    <p style={{ fontSize: '0.78rem', color: 'var(--gray-500)', marginTop: 2 }}>
                      Dosyayı buraya sürükleyin veya simülasyonu çalıştırmak için tıklayın
                    </p>
                  </div>
                )}
              </div>

              {/* Lejant */}
              <div style={{ marginTop: 20, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <span className="badge badge-success">0–25 dB: Normal</span>
                <span className="badge badge-warning">26–40 dB: Hafif</span>
                <span className="badge badge-warning" style={{ background: 'var(--accent-50)', color: 'var(--accent-700)' }}>41–60 dB: Orta</span>
                <span className="badge badge-danger">61–80 dB: İleri</span>
                <span className="badge badge-danger" style={{ background: 'var(--accent-900)', color: 'white' }}>80+ dB: Çok İleri</span>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'cihaz-onerisi' && (() => {
          // Dynamic calculation based on patient profile
          const leftAudio = patient.audiogramLeft || [];
          const rightAudio = patient.audiogramRight || [];
          const leftAvg = leftAudio.length > 0 ? leftAudio.reduce((s,v) => s+v, 0) / leftAudio.length : 0;
          const rightAvg = rightAudio.length > 0 ? rightAudio.reduce((s,v) => s+v, 0) / rightAudio.length : 0;
          const worstAvg = Math.max(leftAvg, rightAvg);
          const age = calculateAge(patient.birthDate);

          // Build suggestions logic
          let suggestedPower = 'M (Standard)';
          let suggestedType = 'RIC (Hoparlör Kulak İçi)';
          let matchingBrands: { name: string; matchPct: number; features: string[]; price: number; reason: string }[] = [];

          if (worstAvg > 80) {
            suggestedPower = 'UP (Ultra Power)';
            suggestedType = 'BTE (Kulak Arkası)';
            matchingBrands = [
              { name: 'Phonak Naída P70 UP', matchPct: 98, price: 72000, features: ['Maksimum kazanç', 'Suya dayanıklılık', 'Yüksek pil ömrü (675)'], reason: 'İleri derece kayıp için güçlü çıkış gücü ve dayanıklı BTE kasa tipi gereklidir.' },
              { name: 'Oticon Xceed 1', matchPct: 92, price: 88000, features: ['BrainHearing™ teknolojisi', '360° ses deneyimi', 'Süper yönlülük'], reason: 'Beyin öncelikli işleme sayesinde çok ileri kayıplarda dahi konuşma anlaşılırlığını korur.' }
            ];
          } else if (worstAvg > 60) {
            suggestedPower = 'P (Power)';
            suggestedType = 'RIC (Hoparlör Kulak İçi) veya BTE';
            matchingBrands = [
              { name: 'Oticon More 1 (P Alıcı)', matchPct: 96, price: 92000, features: ['DNN (Derin Yapay Sinir Ağı)', 'Bluetooth streaming', 'Şarj Edilebilir'], reason: 'Derin Yapay Sinir Ağı, ileri derece kayıplarda gürültü baskılamayı en doğal şekilde yapar.' },
              { name: 'Phonak Audéo P90-R', matchPct: 94, price: 85000, features: ['AutoSense OS 4.0', 'Çift Bluetooth bağlantısı', 'Tap Control'], reason: 'Otomatik ortam adaptasyonu yaşlı hastalarda manuel ayar ihtiyacını ortadan kaldırır.' }
            ];
          } else {
            suggestedPower = 'S (Standard) veya M';
            suggestedType = 'RIC veya IIC (Kanal İçi Görünmez)';
            matchingBrands = [
              { name: 'Signia Pure 7Nx', matchPct: 95, price: 68000, features: ['Kendi sesini doğal işitme (OVP)', 'Ultra küçük tasarım', 'Uzaktan ayar desteği'], reason: 'Hafif-orta kayıplarda hastanın kendi sesinden rahatsız olmasını engelleyen OVP teknolojisine sahiptir.' },
              { name: 'Phonak Audéo P70', matchPct: 91, price: 64000, features: ['Hafif gövde', 'Yüksek konfor', 'Net konuşma sesi'], reason: 'Estetik kaygısı olan ve hafif/orta düzeyde kayba sahip hastalar için konforlu kullanım sağlar.' }
            ];
          }

          return (
            <div className="responsive-grid-1-2">
              {/* Left Column: Rules & Diagnosis Summary */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div className="card" style={{ border: '1px solid var(--gray-200)' }}>
                  <div className="card-header">
                    <span className="card-title">🔬 Hasta Profili Analizi</span>
                  </div>
                  <div className="card-body" style={{ display: 'grid', gap: 10 }}>
                    <div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--gray-500)' }}>Sol Kulak Ortalaması</div>
                      <div style={{ fontWeight: 700, color: 'var(--info-600)' }}>{leftAvg.toFixed(1)} dB</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--gray-500)' }}>Sağ Kulak Ortalaması</div>
                      <div style={{ fontWeight: 700, color: 'var(--danger-600)' }}>{rightAvg.toFixed(1)} dB</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--gray-500)' }}>Önerilen Alıcı Gücü (Receiver)</div>
                      <span className="badge badge-warning" style={{ fontWeight: 600 }}>{suggestedPower}</span>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--gray-500)' }}>Önerilen Kasa Tipi</div>
                      <span className="badge badge-info" style={{ fontWeight: 600 }}>{suggestedType}</span>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--gray-500)' }}>SGK Geri Ödeme Hakkı</div>
                      <span className={`badge badge-${patient.sgkStatus === 'Yenileme Hakkı Var' ? 'success' : 'neutral'}`}>
                        {patient.sgkStatus === 'Yenileme Hakkı Var' ? 'Mevcut (₺6.200 Desteği Açık)' : 'Yok'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="card" style={{ background: 'var(--primary-50)', border: '1px solid var(--primary-100)' }}>
                  <div className="card-body">
                    <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--primary-700)', marginBottom: 6 }}>💡 Odyolog Tavsiye Notu</h4>
                    <p style={{ fontSize: '0.78rem', color: 'var(--primary-600)', lineHeight: 1.5 }}>
                      Hastanın yaş grubu ({age} yaş) ve el motor becerileri göz önüne alındığında, pil değişimi gerektirmeyen <strong>şarj edilebilir (rechargeable)</strong> modeller ve otomatik ortam algılama özellikli (AutoSense/BrainHearing) cihazlar önceliklendirilmelidir.
                    </p>
                  </div>
                </div>
              </div>

              {/* Right Column: AI Suggestions list */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div className="card">
                  <div className="card-header">
                    <span className="card-title">Uyuşan En İyi Modeller</span>
                  </div>
                  <div className="card-body" style={{ display: 'grid', gap: 14 }}>
                    {matchingBrands.map((brand, idx) => (
                      <div key={idx} style={{
                        padding: 16,
                        border: '1px solid var(--gray-200)',
                        borderRadius: 'var(--radius-lg)',
                        background: idx === 0 ? 'linear-gradient(to right, white, var(--success-50))' : 'white',
                        position: 'relative'
                      }}>
                        {idx === 0 && (
                          <span className="badge badge-success" style={{ position: 'absolute', top: 12, right: 12 }}>
                            En Yüksek Eşleşme
                          </span>
                        )}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                          <h4 style={{ fontSize: '1rem', fontWeight: 700 }}>{brand.name}</h4>
                          <span style={{ color: 'var(--success-600)', fontWeight: 700, fontSize: '1.1rem' }}>%{brand.matchPct} Uyum</span>
                        </div>
                        <p style={{ fontSize: '0.82rem', color: 'var(--gray-600)', marginBottom: 12 }}>
                          {brand.reason}
                        </p>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
                          {brand.features.map(f => (
                            <span key={f} className="badge badge-neutral" style={{ fontSize: '0.7rem' }}>✓ {f}</span>
                          ))}
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--gray-100)', paddingTop: 10, flexWrap: 'wrap', gap: 12 }}>
                          <div style={{ display: 'flex', gap: 16 }}>
                            <div>
                              <span style={{ fontSize: '0.72rem', color: 'var(--gray-500)' }}>Brüt: </span>
                              <span style={{ fontWeight: 600 }}>{formatCurrency(brand.price)}</span>
                            </div>
                            <div>
                              <span style={{ fontSize: '0.72rem', color: 'var(--gray-500)' }}>SGK Sonrası Hasta Payı: </span>
                              <span style={{ fontWeight: 700, color: 'var(--primary-600)', fontSize: '1.05rem' }}>
                                {patient.sgkStatus === 'Yenileme Hakkı Var' ? formatCurrency(brand.price - 6200) : formatCurrency(brand.price)}
                              </span>
                            </div>
                          </div>
                          <button className="btn btn-sm btn-primary" onClick={() => handleStartSale(brand.name, brand.price)}>
                            Satışı Başlat
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

        {activeTab === 'pil-takip' && (() => {
          const batteryLifePerHour = { '10': 60, '312': 90, '13': 120, '675': 180 };
          const singleLife = batteryLifePerHour[batterySize] || 90;
          const isDoubleEar = patient.hearingLossSide === 'Her İki Kulak';
          const pillsPerChange = isDoubleEar ? 2 : 1;
          const totalPills = packCount * 6;
          
          const totalDays = dailyUsage > 0 
            ? (totalPills * singleLife) / (dailyUsage * pillsPerChange)
            : 0;

          let passedDays = 0;
          if (lastPurchaseDate) {
            const purchase = new Date(lastPurchaseDate);
            const today = new Date('2026-07-10'); // Sistem tarihi simülasyonu
            const diff = today.getTime() - purchase.getTime();
            passedDays = Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
          }

          const remainingDays = Math.max(0, Math.round(totalDays - passedDays));
          const remainingPercent = totalDays > 0 
            ? Math.max(0, Math.min(100, Math.round((remainingDays / totalDays) * 100)))
            : 0;

          // Son kullanma tarihi hesaplama
          let expiryDateString = '—';
          if (lastPurchaseDate && totalDays > 0) {
            const expDate = new Date(lastPurchaseDate);
            expDate.setDate(expDate.getDate() + Math.round(totalDays));
            expiryDateString = expDate.toISOString().split('T')[0];
          }

          const handleSendWhatsApp = () => {
            addToast({
              type: 'success',
              message: `${patient.firstName} ${patient.lastName} adına WhatsApp hatırlatma mesajı gönderildi: "Değerli hastamız, pillerinizin tahmini bitiş tarihi ${expiryDateString} yaklaşıyor..."`
            });
          };

          const handleCreateShipping = () => {
            addToast({
              type: 'success',
              message: `MNG Kargo entegrasyonu ile kargo takip fişi oluşturuldu. Takip No: MN-${Date.now().toString().slice(-8)}`
            });
          };

          return (
            <div className="responsive-grid-1-15">
              {/* Sol Kolon: Pil Abonelik Tanımları */}
              <div className="card">
                <div className="card-header">
                  <span className="card-title">Pil Abonelik Kartı</span>
                </div>
                <div className="card-body">
                  <div className="form-group">
                    <label className="form-label">Pil Boyutu (Cihaza Göre)</label>
                    <select 
                      className="form-select"
                      value={batterySize}
                      onChange={(e) => setBatterySize(e.target.value as '10' | '312' | '13' | '675')}
                    >
                      <option value="10">10 Numara (Sarı)</option>
                      <option value="312">312 Numara (Kahverengi)</option>
                      <option value="13">13 Numara (Turuncu)</option>
                      <option value="675">675 Numara (Mavi)</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Günlük Kullanım Süresi (Saat)</label>
                    <input 
                      type="number" 
                      className="form-input" 
                      min="1" 
                      max="24"
                      value={dailyUsage}
                      onChange={(e) => setDailyUsage(Math.max(1, Math.min(24, parseInt(e.target.value) || 8)))}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Son Satın Alma Tarihi</label>
                    <input 
                      type="date" 
                      className="form-input"
                      key={patient.id + '_' + (patient.lastBatteryPurchaseDate || '')}
                      defaultValue={lastPurchaseDate}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (!val || val.length === 10) {
                          setLastPurchaseDate(val);
                        }
                      }}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Satın Alınan Paket Sayısı (6'lı)</label>
                    <input 
                      type="number" 
                      className="form-input" 
                      min="1" 
                      max="10"
                      value={packCount}
                      onChange={(e) => setPackCount(Math.max(1, parseInt(e.target.value) || 1))}
                    />
                  </div>
                </div>
              </div>

              {/* Sağ Kolon: Tahminleme ve Aksiyonlar */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div className="card">
                  <div className="card-header">
                    <span className="card-title">📊 Pil Tüketim Analizi</span>
                  </div>
                  <div className="card-body">
                    <div className="responsive-grid-2" style={{ gap: '14px 20px', marginBottom: 20 }}>
                      <div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--gray-500)' }}>Cihaz Kullanım Tarafı</div>
                        <div style={{ fontWeight: 700, color: 'var(--primary-600)' }}>
                          {patient.hearingLossSide} ({isDoubleEar ? 'Aynı Anda 2 Pil Tüketimi' : 'Tek Pil Tüketimi'})
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--gray-500)' }}>Toplam Pil Adedi</div>
                        <div style={{ fontWeight: 700, color: 'var(--gray-800)' }}>
                          {totalPills} Adet Pil ({packCount} Paket)
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--gray-500)' }}>Tahmini Pil Ömrü</div>
                        <div style={{ fontWeight: 700, color: 'var(--gray-800)' }}>
                          {Math.round(totalDays)} Gün Kullanım
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--gray-500)' }}>Kalan Pil Süresi</div>
                        <div style={{ fontWeight: 700, color: remainingDays <= 7 ? 'var(--danger-500)' : 'var(--success-500)' }}>
                          {remainingDays} Gün kaldı
                        </div>
                      </div>
                    </div>

                    <div style={{ marginBottom: 20 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', fontWeight: 600, color: 'var(--gray-600)', marginBottom: 6 }}>
                        <span>Mevcut Pil Kapasitesi</span>
                        <span>%{remainingPercent}</span>
                      </div>
                      <div className="progress-bar" style={{ height: 10 }}>
                        <div 
                          className={`progress-fill ${remainingDays <= 7 ? 'danger' : remainingDays <= 15 ? 'warning' : 'primary'}`}
                          style={{ width: `${remainingPercent}%` }}
                        />
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--surface-border-light)', paddingTop: 14 }}>
                      <div>
                        <span style={{ fontSize: '0.72rem', color: 'var(--gray-500)' }}>Tahmini Pil Bitiş Tarihi:</span>
                        <div style={{ fontWeight: 700, color: 'var(--gray-900)', fontFamily: 'var(--font-mono)' }}>
                          {expiryDateString}
                        </div>
                      </div>
                      <span className={`badge badge-${remainingDays <= 7 ? 'danger' : remainingDays <= 15 ? 'warning' : 'success'}`}>
                        {remainingDays <= 7 ? 'Kritik Seviye' : remainingDays <= 15 ? 'Yenileme Yaklaştı' : 'Yeterli'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Aksiyon Paneli */}
                {remainingDays <= 10 ? (
                  <div className="card" style={{ border: '1px solid var(--warning-100)', background: 'var(--warning-50)' }}>
                    <div className="card-body">
                      <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--warning-600)', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <IconWarning size={16} strokeWidth={2} /> Akıllı Yenileme Aksiyonu Gerekli
                      </h4>
                      <p style={{ fontSize: '0.78rem', color: 'var(--gray-600)', marginBottom: 16 }}>
                        Hastanın pillerinin tükenmesine {remainingDays} gün kalmıştır. İletişime geçerek yeni pil gönderimi teklif edebilirsiniz.
                      </p>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button className="btn btn-sm btn-primary" onClick={handleSendWhatsApp}
                          style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--success-600)', borderColor: 'var(--success-700)' }}>
                          <IconMessage size={14} strokeWidth={2} /> WhatsApp Gönder
                        </button>
                        <button className="btn btn-sm btn-secondary" onClick={handleCreateShipping}
                          style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <IconPlus size={14} strokeWidth={2} /> Kargo Fişi Oluştur
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="card" style={{ border: '1px solid var(--primary-100)', background: 'var(--primary-50)' }}>
                    <div className="card-body">
                      <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--primary-700)', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <IconCheck size={16} strokeWidth={2} /> Abonelik Durumu Aktif
                      </h4>
                      <p style={{ fontSize: '0.78rem', color: 'var(--primary-600)', lineHeight: 1.5 }}>
                        Pil seviyesi güvenli bölgede. Sistem, pil bitimine son 7 gün kala bu alanda otomatik aksiyon butonlarını aktif hale getirecek ve recall ekranına uyarı düşürecektir.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })()}

        {activeTab === 'randevular' && (
          <div className="card">
            <div className="card-header">
              <span className="card-title">📅 Randevu Geçmişi</span>
              <button className="btn btn-sm btn-primary" onClick={() => setShowQuickAptModal(true)}>📅 Yeni Randevu</button>
            </div>
            <div className="card-body">
              {patientAppointments.length > 0 ? (
                <div className="table-container">
                  <table>
                    <thead>
                      <tr>
                        <th>Tarih</th>
                        <th>Saat</th>
                        <th>Tür</th>
                        <th>Odyolog</th>
                        <th>Şube</th>
                        <th>Durum</th>
                      </tr>
                    </thead>
                    <tbody>
                      {patientAppointments.map((apt) => (
                        <tr key={apt.id}>
                          <td className="td-primary">{formatDate(apt.date)}</td>
                          <td>{apt.time}</td>
                          <td><span className="badge badge-info">{apt.type}</span></td>
                          <td>{apt.audiologist}</td>
                          <td>{apt.branch}</td>
                          <td>
                            <span className={`badge badge-${
                              apt.status === 'Geldi' ? 'success' :
                              apt.status === 'Bekliyor' ? 'warning' :
                              apt.status === 'Hatırlatıldı' ? 'info' : 'danger'
                            }`}>{apt.status}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="empty-state">
                  <div className="empty-state-icon">📅</div>
                  <h3>Randevu kaydı yok</h3>
                  <p>Bu hasta için henüz randevu oluşturulmamış.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'satis' && (
          <div className="card">
            <div className="card-header">
              <span className="card-title">💰 Satış Geçmişi</span>
            </div>
            <div className="card-body">
              {patientSales.length > 0 ? (
                patientSales.map((sale) => (
                  <div key={sale.id} style={{
                    padding: '14px',
                    border: '1px solid var(--gray-200)',
                    borderRadius: 'var(--radius-lg)',
                    marginBottom: 12,
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                      <div>
                        <div style={{ fontWeight: 600 }}>{formatDate(sale.date)}</div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--gray-500)' }}>{sale.paymentMethod}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{formatCurrency(sale.total)}</div>
                        <span className={`badge badge-${sale.status === 'Tahsil Edildi' ? 'success' : 'warning'}`}>
                          {sale.status}
                        </span>
                      </div>
                    </div>
                    {sale.items.map((item, i) => (
                      <div key={i} style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontSize: '0.82rem',
                        padding: '4px 0',
                        color: 'var(--gray-600)',
                      }}>
                        <span>{item.name} ×{item.quantity}</span>
                        <span>{formatCurrency(item.price)}</span>
                      </div>
                    ))}
                    {sale.sgkAmount > 0 && (
                      <div style={{
                        marginTop: 8,
                        paddingTop: 8,
                        borderTop: '1px solid var(--gray-100)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontSize: '0.82rem',
                      }}>
                        <span style={{ color: 'var(--success-600)' }}>SGK Karşıladığı:</span>
                        <span style={{ color: 'var(--success-600)', fontWeight: 600 }}>{formatCurrency(sale.sgkAmount)}</span>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="empty-state">
                  <div className="empty-state-icon">💰</div>
                  <h3>Satış kaydı yok</h3>
                  <p>Bu hasta için henüz satış kaydedilmemiş.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'notlar' && (
          <div className="card">
            <div className="card-header">
              <span className="card-title">📝 Notlar</span>
              {!isEditingNotes && (
                <button className="btn btn-sm btn-primary" onClick={() => {
                  setNotesText(patient.notes || '');
                  setIsEditingNotes(true);
                }}>
                  {patient.notes ? '📝 Düzenle' : '➕ Not Ekle'}
                </button>
              )}
            </div>
            <div className="card-body">
              {isEditingNotes ? (
                <div>
                  <textarea
                    className="form-textarea"
                    style={{ width: '100%', height: 160, marginBottom: 12, padding: 12 }}
                    placeholder="Hasta hakkında notlar yazın..."
                    value={notesText}
                    onChange={(e) => setNotesText(e.target.value)}
                  />
                  <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                    <button className="btn btn-secondary" onClick={() => setIsEditingNotes(false)}>İptal</button>
                    <button className="btn btn-primary" onClick={() => {
                      const updated = {
                        ...patient,
                        notes: notesText,
                        timeline: [
                          { date: new Date().toLocaleDateString('tr-TR'), action: 'Hasta notu güncellendi.', icon: 'Edit' },
                          ...(patient.timeline || [])
                        ]
                      };
                      updatePatient(updated);
                      setIsEditingNotes(false);
                      addToast({ type: 'success', message: 'Hasta notu başarıyla kaydedildi.' });
                    }}>Kaydet</button>
                  </div>
                </div>
              ) : patient.notes ? (
                <div style={{
                  padding: '14px',
                  background: 'var(--gray-50)',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.88rem',
                  lineHeight: 1.7,
                  color: 'var(--gray-700)',
                  whiteSpace: 'pre-wrap'
                }}>
                  {patient.notes}
                </div>
              ) : (
                <div className="empty-state">
                  <div className="empty-state-icon">📝</div>
                  <h3>Not yok</h3>
                  <p>Bu hasta için not eklenmemiş.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Patient Edit Modal */}
      {showEditPatientModal && (
        <div className="modal-overlay" onClick={() => setShowEditPatientModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 600 }}>
            <div className="modal-header">
              <span className="modal-title">Hasta Bilgilerini Güncelle</span>
              <button className="modal-close" onClick={() => setShowEditPatientModal(false)}>✕</button>
            </div>
            <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto', paddingRight: 8 }}>
              {/* Temel Bilgiler */}
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label"><span style={{ color: 'var(--danger-500)', marginRight: 2 }}>*</span> Adı</label>
                  <input
                    className="form-input"
                    value={editFormData.firstName}
                    onChange={(e) => setEditFormData({ ...editFormData, firstName: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label"><span style={{ color: 'var(--danger-500)', marginRight: 2 }}>*</span> Soyadı</label>
                  <input
                    className="form-input"
                    value={editFormData.lastName}
                    onChange={(e) => setEditFormData({ ...editFormData, lastName: e.target.value })}
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label"><span style={{ color: 'var(--danger-500)', marginRight: 2 }}>*</span> TC Kimlik No</label>
                  <input
                    className="form-input"
                    value={editFormData.tc}
                    onChange={(e) => setEditFormData({ ...editFormData, tc: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label"><span style={{ color: 'var(--danger-500)', marginRight: 2 }}>*</span> Telefon</label>
                  <input
                    className="form-input"
                    value={editFormData.phone}
                    onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Doğum Tarihi</label>
                  <input
                    className="form-input"
                    type="date"
                    value={editFormData.birthDate}
                    onChange={(e) => setEditFormData({ ...editFormData, birthDate: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Cinsiyet</label>
                  <select
                    className="form-select"
                    value={editFormData.gender}
                    onChange={(e) => setEditFormData({ ...editFormData, gender: e.target.value as Patient['gender'] })}
                  >
                    <option>Erkek</option>
                    <option>Kadın</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">E-Posta</label>
                <input
                  className="form-input"
                  value={editFormData.email}
                  onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label"><span style={{ color: 'var(--danger-500)', marginRight: 2 }}>*</span> Adres</label>
                <textarea
                  className="form-textarea"
                  rows={2}
                  value={editFormData.address}
                  onChange={(e) => setEditFormData({ ...editFormData, address: e.target.value })}
                />
              </div>
              
              <div className="form-row-3">
                <div className="form-group">
                  <label className="form-label">İşitme Kaybı Derecesi</label>
                  <select
                    className="form-select"
                    value={editFormData.hearingLoss}
                    onChange={(e) => setEditFormData({ ...editFormData, hearingLoss: e.target.value as Patient['hearingLoss'] })}
                  >
                    <option>Hafif</option>
                    <option>Orta</option>
                    <option>İleri</option>
                    <option>Çok İleri</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Kulak Tarafı</label>
                  <select
                    className="form-select"
                    value={editFormData.hearingLossSide}
                    onChange={(e) => setEditFormData({ ...editFormData, hearingLossSide: e.target.value as Patient['hearingLossSide'] })}
                  >
                    <option>Sol</option>
                    <option>Sağ</option>
                    <option>Her İki Kulak</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">SGK Cihaz Desteği Durumu</label>
                  <select
                    className="form-select"
                    value={editFormData.sgkStatus}
                    onChange={(e) => setEditFormData({ ...editFormData, sgkStatus: e.target.value as NonNullable<Patient['sgkStatus']> })}
                  >
                    <option>Aktif</option>
                    <option>Yenileme Hakkı Var</option>
                    <option>Pasif</option>
                  </select>
                </div>
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
                    value={editFormData.emergencyContactName}
                    onChange={(e) => setEditFormData({ ...editFormData, emergencyContactName: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Yakın Telefon</label>
                  <input
                    className="form-input"
                    placeholder="05XX XXX XX XX"
                    value={editFormData.emergencyContactPhone}
                    onChange={(e) => setEditFormData({ ...editFormData, emergencyContactPhone: e.target.value })}
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
                    value={editFormData.prescriptionNo}
                    onChange={(e) => setEditFormData({ ...editFormData, prescriptionNo: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Rapor No</label>
                  <input
                    className="form-input"
                    placeholder="Rapor numarası"
                    value={editFormData.reportNo}
                    onChange={(e) => setEditFormData({ ...editFormData, reportNo: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">SGK Sigorta Durumu</label>
                  <select
                    className="form-select"
                    value={editFormData.sgkInsuranceStatus}
                    onChange={(e) => setEditFormData({ ...editFormData, sgkInsuranceStatus: e.target.value as NonNullable<Patient['sgkInsuranceStatus']> })}
                  >
                    <option>Belirtilmemiş</option>
                    <option>Çalışan (sigortalı)</option>
                    <option>Emekli</option>
                    <option>Diğer / Kapsam dışı</option>
                  </select>
                </div>
                
                {/* SGK warning box */}
                {!editFormData.birthDate ? (
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
                  <select
                    className="form-select"
                    value={editFormData.patientStatus}
                    onChange={(e) => setEditFormData({ ...editFormData, patientStatus: e.target.value as NonNullable<Patient['patientStatus']> })}
                  >
                    <option>Potansiyel</option>
                    <option>Deneme Yapıldı</option>
                    <option>Müşteri</option>
                    <option>Satın Almayanlar</option>
                    <option>Genel</option>
                    <option>Tamir için gelen</option>
                    <option>Kalıp Hastası</option>
                    <option>Pil Hastası</option>
                  </select>
                </div>
                
                <div className="form-group">
                  <label className="form-label">Nasıl Duydunuz? (Referans Kaynağı)</label>
                  <select
                    className="form-select"
                    value={editFormData.source}
                    onChange={(e) => setEditFormData({ ...editFormData, source: e.target.value as NonNullable<Patient['source']> })}
                  >
                    <option value="Doktor">Doktor Yönlendirmesi</option>
                    <option value="Sosyal Medya">Sosyal Medya</option>
                    <option value="Tavsiye">Hasta Tavsiyesi</option>
                    <option value="Yürüyerek">Yürüyerek (Walk-in)</option>
                    <option value="Web">Web Sitesi</option>
                  </select>
                </div>
              </div>

              {/* Hasta Notu */}
              <div className="form-group" style={{ marginTop: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <label className="form-label" style={{ marginBottom: 0 }}>Hasta Notu</label>
                  <span style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>{(editFormData.notes || '').length} / 50000</span>
                </div>
                <textarea
                  className="form-textarea"
                  placeholder="Hasta hakkında notlar..."
                  maxLength={50000}
                  value={editFormData.notes || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, notes: e.target.value })}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowEditPatientModal(false)}>İptal</button>
              <button className="btn btn-primary" onClick={handleUpdatePatient}>Kaydet</button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Appointment Modal */}
      {showQuickAptModal && (
        <NewAppointmentModal
          onClose={() => setShowQuickAptModal(false)}
          onSave={(newApt) => {
            addAppointment(newApt);
            setShowQuickAptModal(false);
            addToast({ type: 'success', message: `${patient.firstName} ${patient.lastName} için randevu oluşturuldu.` });
          }}
          patientsList={patientsList}
          addToast={addToast}
        />
      )}
      {/* Quick Service Modal */}
      {showServiceModal && (
        <div className="modal-overlay" onClick={() => setShowServiceModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 640 }}>
            <div className="modal-header">
              <span className="modal-title">Hızlı Teknik Servis Kabul — {patient.firstName} {patient.lastName}</span>
              <button className="modal-close" onClick={() => setShowServiceModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Cihaz</label>
                  <input
                    className="form-input"
                    placeholder="Cihaz adı / modeli"
                    value={serviceFormData.deviceName}
                    onChange={(e) => setServiceFormData({ ...serviceFormData, deviceName: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Seri No</label>
                  <input
                    className="form-input"
                    placeholder="Cihaz seri numarası"
                    value={serviceFormData.serialNo}
                    onChange={(e) => setServiceFormData({ ...serviceFormData, serialNo: e.target.value })}
                  />
                </div>
              </div>

              {/* Teslim Alınan Aksesuarlar */}
              <div className="form-group">
                <label className="form-label">Teslim Alınan Aksesuarlar</label>
                <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 6, marginBottom: 12 }}>
                  {['Pil', 'Cihaz Kutusu', 'Garanti Kartı', 'Kulak Kalıbı'].map(acc => (
                    <label key={acc} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.84rem', cursor: 'pointer', color: 'var(--gray-700)' }}>
                      <input
                        type="checkbox"
                        checked={serviceFormData.accessories.includes(acc)}
                        onChange={() => toggleDetailAccessory(acc)}
                      />
                      {acc}
                    </label>
                  ))}
                </div>
              </div>

              {/* Sık Karşılaşılan Şikayetler */}
              <div className="form-group">
                <label className="form-label">Sık Karşılaşılan Şikayetler (Çeklist)</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 8, marginTop: 6, marginBottom: 12 }}>
                  {[
                    'Çalışmıyor',
                    'Ses Az/Kısık',
                    'Ara Ara Kesiliyor',
                    'Hışırtı/Parazit',
                    'Bluetooth Bağlantı Sorunu',
                    'Feedback (Çınlama)',
                    'Yüksek Pil Tüketimi'
                  ].map(comp => (
                    <label key={comp} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.84rem', cursor: 'pointer', color: 'var(--gray-700)' }}>
                      <input
                        type="checkbox"
                        checked={serviceFormData.complaints.includes(comp)}
                        onChange={() => toggleDetailComplaint(comp)}
                      />
                      {comp}
                    </label>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Ek Sorun Tanımı</label>
                <textarea
                  className="form-textarea"
                  placeholder="Ek şikayetler..."
                  value={serviceFormData.problem}
                  onChange={(e) => setServiceFormData({ ...serviceFormData, problem: e.target.value })}
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Tahmini Teslim</label>
                  <input
                    className="form-input"
                    type="date"
                    value={serviceFormData.estimatedDate}
                    onChange={(e) => setServiceFormData({ ...serviceFormData, estimatedDate: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Ek Notlar</label>
                  <input
                    className="form-input"
                    placeholder="Teknisyene not..."
                    value={serviceFormData.notes}
                    onChange={(e) => setServiceFormData({ ...serviceFormData, notes: e.target.value })}
                  />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowServiceModal(false)}>İptal</button>
              <button className="btn btn-primary" onClick={handleSaveService}>Kaydı Kaydet</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
