'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { getAvatarColor, formatDate, formatCurrency } from '../data/mockData';
import { IconPlus, IconService, IconCheck, IconCash, IconShield, IconArrowRight, IconEye, IconSearch } from '../components/Icons';

interface ServiceRecord {
  id: string;
  patientName: string;
  deviceName: string;
  serialNo: string;
  receivedDate: string;
  estimatedDate: string;
  returnedDate: string | null;
  problem: string;
  operations: { description: string; cost: number }[];
  totalCost: number;
  status: 'Alındı' | 'İnceleniyor' | 'Tamir Ediliyor' | 'Hazır' | 'Teslim Edildi';
  technician: string;
  warrantyRepair: boolean;
  notes: string;
  accessoriesTaken?: string[];
  complaints?: string[];
}

const serviceRecords: ServiceRecord[] = [
  {
    id: 'srv1',
    patientName: 'Ayşe Yılmaz',
    deviceName: 'Phonak Audéo P90',
    serialNo: 'PH-2024-00142',
    receivedDate: '2026-07-01',
    estimatedDate: '2026-07-10',
    returnedDate: null,
    problem: 'Cihaz zayıf ses veriyor, pil tüketimi artmış',
    operations: [
      { description: 'Mikrofon temizliği', cost: 500 },
      { description: 'Hoparlör değişimi', cost: 1200 },
      { description: 'Yazılım güncellemesi', cost: 300 },
    ],
    totalCost: 2000,
    status: 'Tamir Ediliyor',
    technician: 'Emre Koç',
    warrantyRepair: false,
    notes: 'Hoparlör yurt dışından sipariş edildi.',
  },
  {
    id: 'srv2',
    patientName: 'Mehmet Kaya',
    deviceName: 'Oticon More 1',
    serialNo: 'OT-2024-00089',
    receivedDate: '2026-07-05',
    estimatedDate: '2026-07-08',
    returnedDate: '2026-07-08',
    problem: 'Bluetooth bağlantı sorunu',
    operations: [
      { description: 'Firmware güncellemesi', cost: 0 },
      { description: 'Bluetooth modül kalibrasyonu', cost: 0 },
    ],
    totalCost: 0,
    status: 'Teslim Edildi',
    technician: 'Emre Koç',
    warrantyRepair: true,
    notes: 'Garanti kapsamında ücretsiz onarıldı.',
  },
  {
    id: 'srv3',
    patientName: 'Ali Demir',
    deviceName: 'Phonak Naída P70',
    serialNo: 'PH-2024-00215',
    receivedDate: '2026-07-07',
    estimatedDate: '2026-07-12',
    returnedDate: null,
    problem: 'Cihaz açılmıyor, düşme sonrası hasar',
    operations: [
      { description: 'Kasa değişimi', cost: 2500 },
      { description: 'Devre kartı kontrol', cost: 400 },
    ],
    totalCost: 2900,
    status: 'İnceleniyor',
    technician: 'Emre Koç',
    warrantyRepair: false,
    notes: 'Fiziksel hasar olduğu için garanti kapsamı dışında.',
  },
  {
    id: 'srv4',
    patientName: 'Hasan Çelik',
    deviceName: 'ReSound ONE 9',
    serialNo: 'RS-2024-00331',
    receivedDate: '2026-07-08',
    estimatedDate: '2026-07-09',
    returnedDate: null,
    problem: 'Kulak kalıbı ile uyum sorunu, geri bildirim sesi',
    operations: [
      { description: 'Kalıp uyumu ayarlama', cost: 200 },
      { description: 'Feedback bastırma kalibrasyonu', cost: 300 },
    ],
    totalCost: 500,
    status: 'Hazır',
    technician: 'Emre Koç',
    warrantyRepair: false,
    notes: 'Hasta yarın teslim almaya gelecek.',
  },
  {
    id: 'srv5',
    patientName: 'Fatma Özkan',
    deviceName: 'Signia Pure 7Nx',
    serialNo: 'SG-2024-00176',
    receivedDate: '2026-06-25',
    estimatedDate: '2026-06-28',
    returnedDate: '2026-06-28',
    problem: 'Rutin yıllık bakım',
    operations: [
      { description: 'Genel temizlik', cost: 300 },
      { description: 'Pil yuvası temizliği', cost: 100 },
      { description: 'Tüp değişimi', cost: 150 },
      { description: 'Ses ayarı optimizasyonu', cost: 200 },
    ],
    totalCost: 750,
    status: 'Teslim Edildi',
    technician: 'Emre Koç',
    warrantyRepair: false,
    notes: '',
  },
];

const statusConfig: Record<string, { color: string; icon: string }> = {
  'Alındı': { color: 'neutral', icon: '📥' },
  'İnceleniyor': { color: 'info', icon: '🔍' },
  'Tamir Ediliyor': { color: 'warning', icon: '🔧' },
  'Hazır': { color: 'success', icon: '✅' },
  'Teslim Edildi': { color: 'neutral', icon: '📤' },
};

export default function ServicePage() {
  const { addSale, addToast } = useApp();
  const [filterStatus, setFilterStatus] = useState<string>('Tümü');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<ServiceRecord | null>(null);
  const [records, setRecords] = useState<ServiceRecord[]>(serviceRecords);

  const [newRecordForm, setNewRecordForm] = useState({
    patientName: '',
    unregisteredPatient: false,
    unregisteredPhone: '',
    unregisteredTC: '',
    unregisteredAddress: '',
    deviceName: '',
    externalDevice: false,
    externalMarka: '',
    externalModel: '',
    externalSeriNo: '',
    externalTip: '',
    serialNo: '',
    accessories: [] as string[],
    moldModel: '',
    customerComplaints: [] as string[],
    technicianComplaints: [] as string[],
    problem: '',
    extraDescription: '',
    warrantyRepair: true,
    warrantyEndDate: '',
    receivedDate: '2026-07-22',
    estimatedDate: '2026-07-27',
    serviceTarget: 'Hedef',
    serviceTargetName: '',
    deliveredBy: '',
    technician: 'Emre Koç',
    notes: ''
  });

  const [patientSearchText, setPatientSearchText] = useState('');
  const [isPatientDropdownOpen, setIsPatientDropdownOpen] = useState(false);
  const [moldSearchText, setMoldSearchText] = useState('');
  const [isMoldDropdownOpen, setIsMoldDropdownOpen] = useState(false);

  const [showReminderModal, setShowReminderModal] = useState(false);
  const [reminderDate, setReminderDate] = useState('2026-07-25');
  const [reminderNote, setReminderNote] = useState('');

  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [appointmentDateTime, setAppointmentDateTime] = useState('');
  const [appointmentType, setAppointmentType] = useState('Servis');
  const [appointmentNotes, setAppointmentNotes] = useState('');
  const [createFollowupPlan, setCreateFollowupPlan] = useState(false);
  const [followupPeriods, setFollowupPeriods] = useState<string[]>([
    '1 Hafta Kontrol',
    '1 Ay Kontrol',
    '3 Ay Kontrol',
    '6 Ay Kontrol',
    '1 Yıl Kontrol'
  ]);
  const [followupNote, setFollowupNote] = useState('');
  const [sendWhatsappReminder, setSendWhatsappReminder] = useState(true);
  const [sendWhatsappMessageOnCreate, setSendWhatsappMessageOnCreate] = useState(false);
  const [selectedRemindersList, setSelectedRemindersList] = useState<string[]>(['1 saat önce', '2 saat önce']);
  const [customTimeVal, setCustomTimeVal] = useState('30');
  const [customTimeUnit, setCustomTimeUnit] = useState('Dakika');

  const [showAddOperationModal, setShowAddOperationModal] = useState(false);
  const [opStatus, setOpStatus] = useState('');
  const [opShortNote, setOpShortNote] = useState('');
  const [opDecision, setOpDecision] = useState('');
  const [opDiagnosis, setOpDiagnosis] = useState('');
  const [opAction, setOpAction] = useState('');
  const [opLaborCost, setOpLaborCost] = useState<number | string>(0);
  const [opPartCost, setOpPartCost] = useState<number | string>(0);
  const [showExternalDispatch, setShowExternalDispatch] = useState(false);
  const [externalDispatchCompany, setExternalDispatchCompany] = useState('');
  const [externalDispatchTrackingNo, setExternalDispatchTrackingNo] = useState('');

  const patientDropdownRef = useRef<HTMLDivElement>(null);
  const moldDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (patientDropdownRef.current && !patientDropdownRef.current.contains(event.target as Node)) {
        setIsPatientDropdownOpen(false);
      }
      if (moldDropdownRef.current && !moldDropdownRef.current.contains(event.target as Node)) {
        setIsMoldDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const patientsListMock = [
    { name: 'Ayşe Demir', tc: '22222222222', device: 'Phonak Audéo P90 (SN: PH-2024-00142)', serial: 'PH-2024-00142' },
    { name: 'Ali Yılmaz', tc: '11111111111', device: 'Oticon More 1 (SN: OT-2024-00089)', serial: 'OT-2024-00089' },
    { name: 'SAMET ALTOK', tc: '12638639514', device: 'Signia Pure 7Nx (SN: SG-2024-00176)', serial: 'SG-2024-00176' },
    { name: 'Mehmet Kaya', tc: '33333333333', device: 'ReSound ONE 9 (SN: RS-2024-00331)', serial: 'RS-2024-00331' },
    { name: 'Hasan Çelik', tc: '44444444444', device: '', serial: '' },
    { name: 'Fatma Özkan', tc: '55555555555', device: 'Starkey Evolv AI 2400 (SN: ST-2024-00998)', serial: 'ST-2024-00998' }
  ];

  const moldOptions = [
    'Prob',
    'Kısa Destekli Akrilik',
    'Yarım Konka İskelet',
    'Yarım Konka',
    'İskelet',
    'Tam Konka',
    'Destekli',
    'Receiver'
  ];

  const toggleAccessory = (acc: string) => {
    const list = newRecordForm.accessories;
    const updated = list.includes(acc) ? list.filter(a => a !== acc) : [...list, acc];
    setNewRecordForm({ ...newRecordForm, accessories: updated });
  };

  const toggleCustomerComplaint = (comp: string) => {
    const list = newRecordForm.customerComplaints;
    const updated = list.includes(comp) ? list.filter(c => c !== comp) : [...list, comp];
    setNewRecordForm({ ...newRecordForm, customerComplaints: updated });
  };

  const toggleTechnicianComplaint = (comp: string) => {
    const list = newRecordForm.technicianComplaints;
    const updated = list.includes(comp) ? list.filter(c => c !== comp) : [...list, comp];
    setNewRecordForm({ ...newRecordForm, technicianComplaints: updated });
  };

  const handleSaveNewRecord = () => {
    if (!newRecordForm.patientName || !newRecordForm.deviceName) {
      alert('Lütfen hasta ve cihaz adı girin.');
      return;
    }
    const newRec: ServiceRecord = {
      id: `srv-${Date.now().toString().slice(-6)}`,
      patientName: newRecordForm.patientName,
      deviceName: newRecordForm.deviceName,
      serialNo: newRecordForm.serialNo || 'SN-UNKNOWN',
      receivedDate: newRecordForm.receivedDate,
      estimatedDate: newRecordForm.estimatedDate,
      returnedDate: null,
      problem: newRecordForm.problem || (newRecordForm.customerComplaints.length > 0 ? newRecordForm.customerComplaints.join(', ') : 'Arıza belirtilmedi'),
      operations: [],
      totalCost: 0,
      status: 'Alındı',
      technician: newRecordForm.technician,
      warrantyRepair: newRecordForm.warrantyRepair,
      notes: newRecordForm.notes,
      accessoriesTaken: newRecordForm.accessories,
      complaints: [...newRecordForm.customerComplaints, ...newRecordForm.technicianComplaints]
    };

    setRecords([newRec, ...records]);
    setShowAddModal(false);
    setNewRecordForm({
      patientName: '',
      unregisteredPatient: false,
      unregisteredPhone: '',
      unregisteredTC: '',
      unregisteredAddress: '',
      deviceName: '',
      externalDevice: false,
      externalMarka: '',
      externalModel: '',
      externalSeriNo: '',
      externalTip: '',
      serialNo: '',
      accessories: [],
      moldModel: '',
      customerComplaints: [],
      technicianComplaints: [],
      problem: '',
      extraDescription: '',
      warrantyRepair: true,
      warrantyEndDate: '',
      receivedDate: '2026-07-22',
      estimatedDate: '2026-07-27',
      serviceTarget: 'Hedef',
      serviceTargetName: '',
      deliveredBy: '',
      technician: 'Emre Koç',
      notes: ''
    });
    addToast({ type: 'success', message: `${newRec.patientName} adına yeni teknik servis kaydı oluşturuldu.` });
  };

  const handleDeliver = (record: ServiceRecord) => {
    const updatedRecords = records.map(r => 
      r.id === record.id 
        ? { ...r, status: 'Teslim Edildi' as const, returnedDate: '2026-07-10' }
        : r
    );
    setRecords(updatedRecords);
    setSelectedRecord({ ...record, status: 'Teslim Edildi', returnedDate: '2026-07-10' });

    if (!record.warrantyRepair && record.totalCost > 0) {
      const newSale = {
        id: `s-srv-${Date.now().toString().slice(-6)}`,
        patientId: 'p-unknown',
        date: '2026-07-10',
        patientName: record.patientName,
        items: [
          { name: `Teknik Servis Onarım: ${record.deviceName}`, quantity: 1, price: record.totalCost }
        ],
        total: record.totalCost,
        sgkAmount: 0,
        patientAmount: record.totalCost,
        paymentMethod: 'Nakit' as const,
        status: 'Tahsil Edildi' as const
      };
      addSale(newSale);
      addToast({
        type: 'success',
        message: `${record.patientName} adına servis teslim kaydı yapıldı. ${formatCurrency(record.totalCost)} tutarındaki teknik servis geliri kasaya işlendi.`
      });
    } else {
      addToast({
        type: 'success',
        message: `${record.patientName} adına servis teslim kaydı tamamlandı (Garanti Kapsamı - Ücretsiz).`
      });
    }
  };

  const handlePrintForm = (record: ServiceRecord) => {
    const printWindow = window.open('', '_blank', 'width=900,height=1000');
    if (!printWindow) return;

    const formNo = record.id.toUpperCase().startsWith('SRV-') 
      ? `TMR-ENGI-20260722-${record.id.replace('srv-', '00')}`
      : `TMR-ENGI-20260722-0001`;

    const accessoriesList = ['Pil', 'Garanti Kartı', 'Kutu', 'Kulak Kalıbı'];
    const accTaken = record.accessoriesTaken || [];

    const complaintsList = record.complaints && record.complaints.length > 0 
      ? record.complaints 
      : [record.problem || 'Filtre tıkalı / problemi (müşteri beyanı)'];

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Tamir Formu - ${record.patientName}</title>
        <style>
          @page { size: A4; margin: 15mm; }
          body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #1e293b; margin: 0; padding: 20px; font-size: 13px; line-height: 1.4; }
          .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #2563eb; padding-bottom: 12px; margin-bottom: 16px; }
          .company-name { font-size: 18px; font-weight: 800; color: #0f172a; text-transform: uppercase; line-height: 1.2; }
          .title-box { text-align: center; }
          .form-title { font-size: 24px; font-weight: 900; color: #1e3a8a; letter-spacing: 1px; margin: 0; }
          .form-no { font-size: 13px; font-weight: 700; color: #2563eb; margin-top: 4px; }
          .brand-logo { font-size: 22px; font-weight: 900; color: #1e3a8a; background: #eff6ff; padding: 6px 16px; border-radius: 6px; letter-spacing: 1px; }
          
          .section-header { background: #f1f5f9; padding: 6px 10px; font-size: 12px; font-weight: 800; color: #2563eb; text-transform: uppercase; margin-top: 14px; margin-bottom: 8px; border-radius: 4px; }
          .info-table { width: 100%; border-collapse: collapse; margin-bottom: 10px; }
          .info-table td { padding: 4px 6px; vertical-align: top; }
          .label { font-size: 11px; color: #64748b; font-weight: 600; display: block; }
          .value { font-size: 13px; font-weight: 700; color: #0f172a; }
          
          .checkbox-group { display: flex; gap: 18px; flex-wrap: wrap; margin-top: 4px; }
          .checkbox-item { display: flex; align-items: center; gap: 6px; font-size: 12px; font-weight: 600; }
          .box { width: 14px; height: 14px; border: 1px solid #64748b; display: inline-flex; align-items: center; justify-content: center; font-size: 10px; border-radius: 2px; }
          .box.checked { background: #0f172a; color: #fff; border-color: #0f172a; }

          .signature-container { display: flex; justify-content: space-between; margin-top: 24px; padding-top: 10px; }
          .signature-box { width: 45%; }
          .signature-title { font-weight: 800; font-size: 12px; border-bottom: 1px solid #cbd5e1; padding-bottom: 4px; margin-bottom: 8px; color: #0f172a; }
          .signature-line { margin-top: 6px; font-size: 11px; color: #475569; }

          .terms-container { margin-top: 24px; border-top: 1px solid #e2e8f0; padding-top: 10px; }
          .terms-title { font-weight: 800; font-size: 11px; color: #2563eb; margin-bottom: 6px; text-transform: uppercase; }
          .terms-list { font-size: 9.5px; color: #64748b; margin: 0; padding-left: 14px; line-height: 1.35; }
          .terms-list li { margin-bottom: 3px; }

          @media print {
            body { padding: 0; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="company-name">ENGİNSES İŞİTME<br/>CİHAZLARI</div>
          <div class="title-box">
            <div class="form-title">TAMİR FORMU</div>
            <div class="form-no">No: ${formNo}</div>
          </div>
          <div class="brand-logo">AUDIPRO</div>
        </div>

        <div class="section-header">MÜŞTERİ & CİHAZ BİLGİLERİ</div>
        <table class="info-table">
          <tr>
            <td style="width: 50%;">
              <span class="label">Bayi / Firma</span>
              <span class="value">ENGİNSES İŞİTME CİHAZLARI</span>
            </td>
            <td style="width: 50%;">
              <span class="label">Cihaz Modeli</span>
              <span class="value">${record.deviceName || '-'}</span>
            </td>
          </tr>
          <tr>
            <td>
              <span class="label">Hasta</span>
              <span class="value">${record.patientName}</span>
            </td>
            <td>
              <span class="label">Seri Numarası</span>
              <span class="value">${record.serialNo || '-'}</span>
            </td>
          </tr>
          <tr>
            <td>
              <span class="label">Telefon</span>
              <span class="value">05459111099</span>
            </td>
            <td>
              <span class="label">Teslim Eden</span>
              <span class="value">-</span>
            </td>
          </tr>
          <tr>
            <td colspan="2">
              <span class="label">Adres</span>
              <span class="value">KALE MAH KAPTANAĞA SOK DR TEVFİK TÜRKER İŞ HANI NO:8/1 İLKADIM/SAMSUN</span>
            </td>
          </tr>
        </table>

        <div class="section-header">CİHAZLA BİRLİKTE ALINAN AKSESUARLAR</div>
        <div class="checkbox-group" style="padding: 4px 6px;">
          ${accessoriesList.map(acc => `
            <div class="checkbox-item">
              <span class="box ${accTaken.includes(acc) ? 'checked' : ''}">${accTaken.includes(acc) ? '✓' : ''}</span>
              <span>${acc}</span>
            </div>
          `).join('')}
        </div>

        <div class="section-header">MÜŞTERİ ŞİKAYETLERİ / TESPİT</div>
        <div style="padding: 4px 6px; display: flex; flex-direction: column; gap: 6px;">
          ${complaintsList.map(comp => `
            <div class="checkbox-item">
              <span class="box checked">✓</span>
              <span>${comp}</span>
            </div>
          `).join('')}
        </div>

        <div class="section-header">GARANTİ & TEKLİF / ONAY</div>
        <table class="info-table">
          <tr>
            <td style="width: 40%;">
              <div class="checkbox-group">
                <div class="checkbox-item">
                  <span class="box ${record.warrantyRepair ? 'checked' : ''}">${record.warrantyRepair ? '✓' : ''}</span>
                  <span>Garanti İçinde</span>
                </div>
                <div class="checkbox-item">
                  <span class="box ${!record.warrantyRepair ? 'checked' : ''}">${!record.warrantyRepair ? '✓' : ''}</span>
                  <span>Garanti Dışında</span>
                </div>
              </div>
            </td>
            <td style="width: 30%;">
              <span class="label">Giriş Tarihi</span>
              <span class="value">${formatDate(record.receivedDate)}</span>
              <span class="label" style="margin-top:4px;">Çıkış Tarihi</span>
              <span class="value">${record.returnedDate ? formatDate(record.returnedDate) : '-'}</span>
            </td>
            <td style="width: 30%;">
              <span class="label">Ücret</span>
              <span class="value">₺${record.totalCost.toFixed(2)}</span>
              <span class="label" style="margin-top:4px;">Karar</span>
              <div class="checkbox-group" style="margin-top:2px;">
                <div class="checkbox-item"><span class="box checked">✓</span> Tamir</div>
                <div class="checkbox-item"><span class="box"></span> İade</div>
              </div>
            </td>
          </tr>
        </table>

        ${record.operations && record.operations.length > 0 ? `
          <div class="section-header">YAPILAN İŞLEMLER</div>
          <div style="padding: 4px 6px;">
            ${record.operations.map(op => `<div>• ${op.description} - ₺${op.cost.toFixed(2)}</div>`).join('')}
          </div>
        ` : ''}

        <div class="signature-container">
          <div class="signature-box">
            <div class="signature-title">TESLİM EDEN</div>
            <div class="signature-line">Adı Soyadı: ............................................</div>
            <div class="signature-line">Tarih: ..... / ..... / ..........</div>
            <div class="signature-line">İmza: ................................................</div>
          </div>
          <div class="signature-box">
            <div class="signature-title">TESLİM ALAN</div>
            <div class="signature-line">Adı Soyadı: ............................................</div>
            <div class="signature-line">Tarih: ..... / ..... / ..........</div>
            <div class="signature-line">İmza: ................................................</div>
          </div>
        </div>

        <div class="terms-container">
          <div class="terms-title">İŞİTME CİHAZI TAMİR ŞARTLARI</div>
          <ol class="terms-list">
            <li>Garanti süresi devam eden ürünlerin tamirinde garanti belgesinin ibrazı şarttır.</li>
            <li>Garanti süresi devam eden ürünlerde, kullanım kılavuzunda belirtilen kullanıcı kaynaklı arızaların dışında kalan arızalarda tamir ücreti talep edilmez.</li>
            <li>Garanti kapsamı dışında olan ürünlerde, "muayene ücreti" ödemek koşuluyla arıza tespiti istenebilir.</li>
            <li>Garanti kapsamı dışında olan ürünlerde arıza tespiti yapılarak belirlenen tamir ücreti müşteriye iletilir.</li>
            <li>Müşteri tarafından tamir onayı verilmesi durumunda belirlenen işlemler uygulanır, son kontrol ve testler yapılarak onaylanan tutar müşteriye fatura edilir.</li>
            <li>Toplam maliyeti 100 TL'yi geçmeyen tamirlerde onay almadan doğrudan işlem yapılır.</li>
            <li>Değiştirilen yedek parçaların 6 ay ek garanti süresi bulunmaktadır.</li>
            <li>Tamir formunun dikkatli muhafaza edilmesi ve cihazı teslim alacak kişi tarafından ibraz edilmesi gereklidir. Tamir formu bulunmayan cihazlar teslim edilmez.</li>
            <li>Olumlu veya olumsuz sonuç bilgisi müşteriye iletilmiş olan cihazlar 3 ay içerisinde alınmadığı takdirde hiçbir şekilde sorumluluk kabul edilmeyecektir.</li>
            <li>Kullanım hataları, fiziksel darbeler, sıvı teması gibi sebepler dışında oluşan arızaların 1 yıl içerisinde tekrarlaması durumunda verilen bakım, onarım, tamir ücreti alınmaz.</li>
            <li>Ürünlerin arızasının 10 (on) iş günü içerisinde giderilmemesi halinde, imalatçı-üretici veya ithalatçı, ürünlerin tamiri tamamlanıncaya kadar benzer özelliklere sahip başka bir ürünü tüketicinin kullanımına tahsis etmek zorundadır.</li>
          </ol>
        </div>

        <script>
          window.onload = function() {
            window.print();
          };
        </script>
      </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  const handleAddOperation = () => {
    if (!selectedRecord) return;

    const labor = Number(opLaborCost) || 0;
    const part = Number(opPartCost) || 0;
    const total = labor + part;

    const actionText = opAction || opDiagnosis || 'Servis İşlemi Yapıldı';

    const newOp = {
      description: actionText,
      cost: total
    };

    const updatedOperations = [...selectedRecord.operations, newOp];
    const newTotalCost = selectedRecord.warrantyRepair ? 0 : updatedOperations.reduce((sum, o) => sum + o.cost, 0);

    const updatedStatus = opStatus && opStatus !== 'Durum değiştir'
      ? (opStatus as any)
      : selectedRecord.status;

    const updatedRecord: ServiceRecord = {
      ...selectedRecord,
      operations: updatedOperations,
      totalCost: newTotalCost,
      status: updatedStatus,
      notes: opShortNote ? (selectedRecord.notes ? `${selectedRecord.notes} | ${opShortNote}` : opShortNote) : selectedRecord.notes
    };

    const updatedRecords = records.map(r => r.id === selectedRecord.id ? updatedRecord : r);
    setRecords(updatedRecords);
    setSelectedRecord(updatedRecord);
    setShowAddOperationModal(false);

    setOpStatus('');
    setOpShortNote('');
    setOpDecision('');
    setOpDiagnosis('');
    setOpAction('');
    setOpLaborCost(0);
    setOpPartCost(0);
    setShowExternalDispatch(false);

    addToast({ type: 'success', message: `${selectedRecord.patientName} kaydına yeni servis işlemi eklendi.` });
  };

  const filtered = records.filter(r => {
    const matchesStatus = filterStatus === 'Tümü' || r.status === filterStatus;
    const q = searchQuery.toLowerCase().trim();
    if (!q) return matchesStatus;

    const matchesName = (r.patientName || '').toLowerCase().includes(q);
    const matchesDevice = (r.deviceName || '').toLowerCase().includes(q);
    const matchesSerial = (r.serialNo || '').toLowerCase().includes(q);
    const matchesProblem = (r.problem || '').toLowerCase().includes(q);
    const matchesTechnician = (r.technician || '').toLowerCase().includes(q);

    return matchesStatus && (matchesName || matchesDevice || matchesSerial || matchesProblem || matchesTechnician);
  });

  const activeCount = records.filter(r => !['Teslim Edildi'].includes(r.status)).length;
  const waitingCount = records.filter(r => r.status === 'Hazır').length;
  const totalRevenue = records.reduce((sum, r) => sum + r.totalCost, 0);
  const warrantyCount = records.filter(r => r.warrantyRepair).length;

  return (
    <div className="page">
      <div className="page-header">
        <div className="page-header-left">
          <h2>Teknik Servis Takibi</h2>
          <p>{serviceRecords.length} servis kaydı</p>
        </div>
        <div className="page-header-actions">
          <button className="btn btn-primary" onClick={() => setShowAddModal(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <IconPlus size={15} strokeWidth={2} /> Yeni Servis Kaydı
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon warning">
            <IconService size={20} strokeWidth={1.6} />
          </div>
          <div className="stat-content">
            <div className="stat-label">Serviste Bekleyen</div>
            <div className="stat-value">{activeCount}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon success">
            <IconCheck size={20} strokeWidth={1.6} />
          </div>
          <div className="stat-content">
            <div className="stat-label">Teslime Hazır</div>
            <div className="stat-value">{waitingCount}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon primary">
            <IconCash size={20} strokeWidth={1.6} />
          </div>
          <div className="stat-content">
            <div className="stat-label">Toplam Servis Geliri</div>
            <div className="stat-value">{formatCurrency(totalRevenue)}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon info">
            <IconShield size={20} strokeWidth={1.6} />
          </div>
          <div className="stat-content">
            <div className="stat-label">Garanti Kapsamında</div>
            <div className="stat-value">{warrantyCount}</div>
          </div>
        </div>
      </div>

      {/* Filters & Search Bar */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-body" style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 16,
          flexWrap: 'wrap'
        }}>
          <div className="tabs" style={{ margin: 0 }}>
            {['Tümü', 'Alındı', 'İnceleniyor', 'Tamir Ediliyor', 'Hazır', 'Teslim Edildi'].map(s => (
              <button
                key={s}
                className={`tab ${filterStatus === s ? 'active' : ''}`}
                onClick={() => setFilterStatus(s)}
              >
                {s}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div style={{ position: 'relative', width: 340, maxWidth: '100%' }}>
            <div style={{
              position: 'absolute',
              left: 12,
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--gray-400)',
              display: 'flex',
              alignItems: 'center',
              pointerEvents: 'none'
            }}>
              <IconSearch size={16} strokeWidth={2} />
            </div>
            <input
              type="text"
              className="form-input"
              placeholder="Hasta adı, cihaz veya seri no ile ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                paddingLeft: 36,
                paddingRight: searchQuery ? 32 : 12,
                height: 38,
                fontSize: '0.84rem',
                borderRadius: 'var(--radius-md)',
                borderColor: 'var(--gray-200)',
                background: 'var(--gray-50)',
                transition: 'all 0.15s ease'
              }}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                style={{
                  position: 'absolute',
                  right: 10,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: 'var(--gray-400)',
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                  padding: 2,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                title="Aramayı Temizle"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Service Table */}
      <div className="card">
        <div className="table-container">
          <table className="mobile-cards">
            <thead>
              <tr>
                <th>Hasta</th>
                <th>Cihaz</th>
                <th>Seri No</th>
                <th>Arıza / Sorun</th>
                <th>Alım Tarihi</th>
                <th>Tahmini Teslim</th>
                <th>Yapılan İşlemler</th>
                <th>Tutar</th>
                <th>Durum</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={10} style={{ textAlign: 'center', padding: '36px 16px', color: 'var(--gray-500)' }}>
                    <div style={{ fontSize: '1.5rem', marginBottom: 6 }}>🔍</div>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--gray-700)' }}>Aranan kriterlere uygun servis kaydı bulunamadı</div>
                    <div style={{ fontSize: '0.8rem', marginTop: 4 }}>Arama terimini veya durum filtresini değiştirerek tekrar deneyebilirsiniz.</div>
                  </td>
                </tr>
              ) : (
                filtered.map(record => {
                const cfg = statusConfig[record.status];
                return (
                  <tr key={record.id}>
                    <td data-label="Hasta">
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div className="avatar" style={{ background: getAvatarColor(record.patientName) }}>
                          {record.patientName.split(' ').map(n => n[0]).join('')}
                        </div>
                        <span className="td-primary">{record.patientName}</span>
                      </div>
                    </td>
                    <td data-label="Cihaz" style={{ fontWeight: 600, fontSize: '0.85rem' }}>{record.deviceName}</td>
                    <td data-label="Seri No" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem' }}>{record.serialNo}</td>
                    <td data-label="Arıza" style={{ maxWidth: 200, fontSize: '0.82rem', color: 'var(--gray-600)' }}>
                      {record.problem}
                    </td>
                    <td data-label="Alım Tarihi">{formatDate(record.receivedDate)}</td>
                    <td data-label="Tahmini Teslim">
                      {record.returnedDate ? (
                        <span style={{ color: 'var(--success-600)', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: 4 }}>
                          <IconCheck size={12} strokeWidth={2} /> {formatDate(record.returnedDate)}
                        </span>
                      ) : (
                        formatDate(record.estimatedDate)
                      )}
                    </td>
                    <td data-label="İşlemler">
                      <span style={{ fontSize: '0.78rem', color: 'var(--gray-600)' }}>
                        {record.operations.length} işlem
                      </span>
                    </td>
                    <td data-label="Tutar">
                      {record.warrantyRepair ? (
                        <span className="badge badge-info" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <IconShield size={11} strokeWidth={1.7} /> Garanti
                        </span>
                      ) : (
                        <span style={{ fontWeight: 700 }}>{formatCurrency(record.totalCost)}</span>
                      )}
                    </td>
                    <td data-label="Durum">
                      <span className={`badge badge-${cfg.color}`}>
                        {record.status}
                      </span>
                    </td>
                    <td data-label="">
                      <button
                        className="btn btn-sm btn-ghost"
                        style={{ display: 'flex', alignItems: 'center', gap: 4 }}
                        onClick={() => setSelectedRecord(record)}
                      >
                        Detay <IconArrowRight size={13} strokeWidth={1.8} />
                      </button>
                    </td>
                  </tr>
                );
              }))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal */}
      {selectedRecord && (
        <div className="modal-overlay" onClick={() => setSelectedRecord(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 680 }}>
            <div className="modal-header">
              <span className="modal-title">🔧 Servis Detayı — {selectedRecord.deviceName}</span>
              <button className="modal-close" onClick={() => setSelectedRecord(null)}>✕</button>
            </div>
            <div className="modal-body">
              {/* Device & Patient Info */}
              <div className="responsive-grid-2" style={{ marginBottom: 20 }}>
                <div style={{
                  padding: '14px',
                  background: 'var(--gray-50)',
                  borderRadius: 'var(--radius-lg)',
                }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--gray-500)', marginBottom: 8 }}>Hasta & Cihaz</div>
                  <div style={{ display: 'grid', gap: 6 }}>
                    <div>
                      <span style={{ fontSize: '0.78rem', color: 'var(--gray-500)' }}>Hasta: </span>
                      <span style={{ fontWeight: 600 }}>{selectedRecord.patientName}</span>
                    </div>
                    <div>
                      <span style={{ fontSize: '0.78rem', color: 'var(--gray-500)' }}>Cihaz: </span>
                      <span style={{ fontWeight: 600 }}>{selectedRecord.deviceName}</span>
                    </div>
                    <div>
                      <span style={{ fontSize: '0.78rem', color: 'var(--gray-500)' }}>Seri No: </span>
                      <span style={{ fontWeight: 600, fontFamily: 'monospace' }}>{selectedRecord.serialNo}</span>
                    </div>
                    <div>
                      <span style={{ fontSize: '0.78rem', color: 'var(--gray-500)' }}>Teknisyen: </span>
                      <span style={{ fontWeight: 600 }}>{selectedRecord.technician}</span>
                    </div>
                  </div>
                </div>

                <div style={{
                  padding: '14px',
                  background: 'var(--gray-50)',
                  borderRadius: 'var(--radius-lg)',
                }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--gray-500)', marginBottom: 8 }}>Tarihler & Durum</div>
                  <div style={{ display: 'grid', gap: 6 }}>
                    <div>
                      <span style={{ fontSize: '0.78rem', color: 'var(--gray-500)' }}>Alım: </span>
                      <span style={{ fontWeight: 600 }}>{formatDate(selectedRecord.receivedDate)}</span>
                    </div>
                    <div>
                      <span style={{ fontSize: '0.78rem', color: 'var(--gray-500)' }}>Tahmini: </span>
                      <span style={{ fontWeight: 600 }}>{formatDate(selectedRecord.estimatedDate)}</span>
                    </div>
                    {selectedRecord.returnedDate && (
                      <div>
                        <span style={{ fontSize: '0.78rem', color: 'var(--gray-500)' }}>Teslim: </span>
                        <span style={{ fontWeight: 600, color: 'var(--success-600)' }}>{formatDate(selectedRecord.returnedDate)}</span>
                      </div>
                    )}
                    <div>
                      <span style={{ fontSize: '0.78rem', color: 'var(--gray-500)' }}>Garanti: </span>
                      <span className={`badge badge-${selectedRecord.warrantyRepair ? 'success' : 'neutral'}`}>
                        {selectedRecord.warrantyRepair ? '✓ Garanti kapsamında' : 'Garanti dışı'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Action Buttons: Hatırlatma Ekle & Randevu Oluştur */}
              <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowReminderModal(true)}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '0.82rem', padding: '6px 14px', borderRadius: 6 }}
                >
                  🔔 Hatırlatma Ekle
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowAppointmentModal(true)}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '0.82rem', padding: '6px 14px', borderRadius: 6 }}
                >
                  📅 Randevu Oluştur
                </button>
              </div>

              {/* Problem */}
              <div style={{
                padding: '12px 16px',
                background: 'var(--warning-50)',
                border: '1px solid var(--warning-100)',
                borderRadius: 'var(--radius-md)',
                marginBottom: 16,
              }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--warning-600)', marginBottom: 4, fontWeight: 600 }}>Bildirilen Arıza</div>
                <div style={{ fontSize: '0.88rem', color: 'var(--gray-800)' }}>{selectedRecord.problem}</div>
              </div>

              {/* Accessories and Checklist */}
              {((selectedRecord.accessoriesTaken && selectedRecord.accessoriesTaken.length > 0) || 
                (selectedRecord.complaints && selectedRecord.complaints.length > 0)) && (
                <div className="responsive-grid-2" style={{ marginBottom: 16 }}>
                  {selectedRecord.accessoriesTaken && selectedRecord.accessoriesTaken.length > 0 && (
                    <div style={{
                      padding: '12px 14px',
                      background: 'var(--primary-50)',
                      border: '1px solid var(--primary-100)',
                      borderRadius: 'var(--radius-md)',
                    }}>
                      <div style={{ fontSize: '0.72rem', color: 'var(--primary-600)', marginBottom: 6, fontWeight: 600 }}>Teslim Alınan Aksesuarlar</div>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {selectedRecord.accessoriesTaken.map((acc, index) => (
                          <span key={index} className="badge badge-info" style={{ fontSize: '0.74rem' }}>{acc}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {selectedRecord.complaints && selectedRecord.complaints.length > 0 && (
                    <div style={{
                      padding: '12px 14px',
                      background: 'var(--danger-50)',
                      border: '1px solid var(--danger-100)',
                      borderRadius: 'var(--radius-md)',
                    }}>
                      <div style={{ fontSize: '0.72rem', color: 'var(--danger-600)', marginBottom: 6, fontWeight: 600 }}>Çeklist Şikayetleri</div>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {selectedRecord.complaints.map((comp, index) => (
                          <span key={index} className="badge badge-neutral" style={{ fontSize: '0.74rem', background: 'var(--gray-200)', color: 'var(--gray-700)' }}>{comp}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Operations */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--gray-700)' }}>
                    🛠️ Yapılan İşlemler
                  </div>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => setShowAddOperationModal(true)}
                    style={{ fontSize: '0.78rem', padding: '4px 12px', borderRadius: 6, display: 'inline-flex', alignItems: 'center', gap: 4 }}
                  >
                    + İşlem Ekle
                  </button>
                </div>
                <div style={{ border: '1px solid var(--gray-200)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
                  {selectedRecord.operations.map((op, i) => (
                    <div key={i} style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '10px 14px',
                      borderBottom: i < selectedRecord.operations.length - 1 ? '1px solid var(--gray-100)' : 'none',
                      fontSize: '0.85rem',
                    }}>
                      <span>
                        <span style={{ color: 'var(--primary-500)', marginRight: 6 }}>●</span>
                        {op.description}
                      </span>
                      <span style={{ fontWeight: 600 }}>
                        {op.cost > 0 ? formatCurrency(op.cost) : <span style={{ color: 'var(--success-600)' }}>Ücretsiz</span>}
                      </span>
                    </div>
                  ))}
                  {/* Total */}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '12px 14px',
                    background: 'var(--gray-50)',
                    borderTop: '2px solid var(--gray-200)',
                    fontWeight: 700,
                    fontSize: '0.95rem',
                  }}>
                    <span>Toplam</span>
                    <span style={{ color: 'var(--primary-600)', fontSize: '1.05rem' }}>
                      {selectedRecord.warrantyRepair ? (
                        <span style={{ color: 'var(--success-600)' }}>Garanti — Ücretsiz</span>
                      ) : (
                        formatCurrency(selectedRecord.totalCost)
                      )}
                    </span>
                  </div>
                </div>
              </div>

              {/* Notes */}
              {selectedRecord.notes && (
                <div style={{
                  padding: '10px 14px',
                  background: 'var(--gray-50)',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.82rem',
                  color: 'var(--gray-600)',
                }}>
                  <strong>📝 Not: </strong>{selectedRecord.notes}
                </div>
              )}
            </div>
            <div className="modal-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', gap: 8 }}>
                {selectedRecord.status === 'Hazır' && (
                  <button className="btn btn-primary" onClick={() => handleDeliver(selectedRecord)}>
                    Teslim Edildi Olarak İşaretle
                  </button>
                )}
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => handlePrintForm(selectedRecord)}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '0.84rem' }}
                >
                  🖨️ Form (PDF)
                </button>
                <button className="btn btn-secondary" onClick={() => setSelectedRecord(null)}>Kapat</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tamir Kabul - Yeni Kayıt Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 680, width: '95%' }}>
            
            {/* Modal Header */}
            <div className="modal-header" style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: '1.2rem' }}>🔑</span>
                <span className="modal-title" style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a' }}>
                  Tamir Kabul - Yeni Kayıt
                </span>
              </div>
              <button className="modal-close" onClick={() => setShowAddModal(false)}>✕</button>
            </div>

            {/* Modal Body */}
            <div className="modal-body" style={{ padding: 20, maxHeight: '78vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
              
              {/* 1. HASTA SECTION */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <label className="form-label" style={{ fontWeight: 700, color: '#0f172a', margin: 0 }}>
                    Hasta
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.82rem', color: '#475569', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={newRecordForm.unregisteredPatient}
                      onChange={(e) => setNewRecordForm({ ...newRecordForm, unregisteredPatient: e.target.checked })}
                    />
                    Kayıtsız hasta (dışarıdan geldi)
                  </label>
                </div>

                {newRecordForm.unregisteredPatient ? (
                  /* Kayıtsız Hasta Inputs (Matching Screenshot 2) */
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="Ad Soyad *"
                        value={newRecordForm.patientName}
                        onChange={(e) => setNewRecordForm({ ...newRecordForm, patientName: e.target.value })}
                      />
                      <input
                        type="text"
                        className="form-input"
                        placeholder="Telefon"
                        value={newRecordForm.unregisteredPhone}
                        onChange={(e) => setNewRecordForm({ ...newRecordForm, unregisteredPhone: e.target.value })}
                      />
                      <input
                        type="text"
                        className="form-input"
                        placeholder="TC No"
                        value={newRecordForm.unregisteredTC}
                        onChange={(e) => setNewRecordForm({ ...newRecordForm, unregisteredTC: e.target.value })}
                      />
                    </div>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Adres"
                      value={newRecordForm.unregisteredAddress}
                      onChange={(e) => setNewRecordForm({ ...newRecordForm, unregisteredAddress: e.target.value })}
                    />
                    <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: 4 }}>
                      Kaydedince hasta "Tamir için gelen" durumuyla oluşturulur.
                    </div>
                  </div>
                ) : (
                  /* Searchable Patient Dropdown (Matching Screenshot 1) */
                  <div ref={patientDropdownRef} style={{ position: 'relative' }}>
                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                      <input
                        type="text"
                        className="form-input"
                        style={{ paddingRight: 36, borderColor: isPatientDropdownOpen ? '#0091ff' : undefined }}
                        placeholder="Hasta ara ve seç"
                        value={patientSearchText || newRecordForm.patientName}
                        onFocus={() => setIsPatientDropdownOpen(true)}
                        onChange={(e) => {
                          setPatientSearchText(e.target.value);
                          setNewRecordForm({ ...newRecordForm, patientName: e.target.value });
                          setIsPatientDropdownOpen(true);
                        }}
                      />
                      <span style={{ position: 'absolute', right: 12, color: '#94a3b8', pointerEvents: 'none', fontSize: '0.88rem' }}>🔍</span>
                    </div>

                    {isPatientDropdownOpen && (
                      <div style={{
                        position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 30,
                        background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 8,
                        boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)', marginTop: 4, maxHeight: 180, overflowY: 'auto'
                      }}>
                        {patientsListMock
                          .filter(p => `${p.name} ${p.tc}`.toLowerCase().includes((patientSearchText || '').toLowerCase()))
                          .map((p, idx) => (
                            <div
                              key={idx}
                              onClick={() => {
                                setNewRecordForm({
                                  ...newRecordForm,
                                  patientName: p.name,
                                  deviceName: p.device || '',
                                  serialNo: p.serial || ''
                                });
                                setPatientSearchText(`${p.name} (${p.tc})`);
                                setIsPatientDropdownOpen(false);
                              }}
                              style={{
                                padding: '10px 14px', fontSize: '0.84rem', cursor: 'pointer',
                                color: '#1e293b', borderBottom: idx < patientsListMock.length - 1 ? '1px solid #f1f5f9' : 'none',
                                background: newRecordForm.patientName === p.name ? '#f8fafc' : '#ffffff'
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.background = '#f1f5f9'}
                              onMouseLeave={(e) => e.currentTarget.style.background = newRecordForm.patientName === p.name ? '#f8fafc' : '#ffffff'}
                            >
                              {p.name} ({p.tc})
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* 2. CİHAZ SECTION */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <label className="form-label" style={{ fontWeight: 700, color: '#0f172a', margin: 0 }}>
                    Cihaz
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.82rem', color: '#475569', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={newRecordForm.externalDevice}
                      onChange={(e) => setNewRecordForm({ ...newRecordForm, externalDevice: e.target.checked })}
                    />
                    Dış cihaz (bizim sattığımız değil)
                  </label>
                </div>

                {newRecordForm.externalDevice ? (
                  /* External Device 4 Inputs (Matching Screenshot 4) */
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 10 }}>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Marka"
                      value={newRecordForm.externalMarka}
                      onChange={(e) => setNewRecordForm({ ...newRecordForm, externalMarka: e.target.value, deviceName: `${e.target.value} ${newRecordForm.externalModel}` })}
                    />
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Model"
                      value={newRecordForm.externalModel}
                      onChange={(e) => setNewRecordForm({ ...newRecordForm, externalModel: e.target.value, deviceName: `${newRecordForm.externalMarka} ${e.target.value}` })}
                    />
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Seri No"
                      value={newRecordForm.externalSeriNo}
                      onChange={(e) => setNewRecordForm({ ...newRecordForm, externalSeriNo: e.target.value, serialNo: e.target.value })}
                    />
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Tip"
                      value={newRecordForm.externalTip}
                      onChange={(e) => setNewRecordForm({ ...newRecordForm, externalTip: e.target.value })}
                    />
                  </div>
                ) : (
                  /* Standard Device Form Input */
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Bu hastaya ait cihaz bulunamadı — dış cihaz işaretleyin"
                    value={newRecordForm.deviceName}
                    onChange={(e) => setNewRecordForm({ ...newRecordForm, deviceName: e.target.value })}
                  />
                )}
              </div>

              {/* 3. BİRLİKTE ALINAN AKSESUARLAR */}
              <div>
                <label className="form-label" style={{ fontWeight: 700, color: '#0f172a', marginBottom: 8 }}>
                  Birlikte alınan aksesuarlar
                </label>
                <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', fontSize: '0.86rem', color: '#334155' }}>
                  {['Pil', 'Garanti Kartı', 'Kutu', 'Kulak Kalıbı'].map((acc) => (
                    <label key={acc} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={newRecordForm.accessories.includes(acc)}
                        onChange={() => toggleAccessory(acc)}
                      />
                      {acc}
                    </label>
                  ))}
                </div>
              </div>

              {/* 4. KALIP MODELİ (Matching Screenshot 5) */}
              <div>
                <label className="form-label" style={{ fontWeight: 700, color: '#0f172a', marginBottom: 6 }}>
                  Kalıp Modeli <span style={{ fontWeight: 400, color: '#64748b', fontSize: '0.78rem' }}>(kalıp siparişi değilse boş bırakın)</span>
                </label>

                <div ref={moldDropdownRef} style={{ position: 'relative' }}>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <input
                      type="text"
                      className="form-input"
                      style={{ paddingRight: 36, borderColor: isMoldDropdownOpen ? '#0091ff' : undefined }}
                      placeholder="Kalıp modeli seçin"
                      value={moldSearchText || newRecordForm.moldModel}
                      onFocus={() => setIsMoldDropdownOpen(true)}
                      onChange={(e) => {
                        setMoldSearchText(e.target.value);
                        setNewRecordForm({ ...newRecordForm, moldModel: e.target.value });
                        setIsMoldDropdownOpen(true);
                      }}
                    />
                    <span style={{ position: 'absolute', right: 12, color: '#94a3b8', pointerEvents: 'none', fontSize: '0.88rem' }}>🔍</span>
                  </div>

                  {isMoldDropdownOpen && (
                    <div style={{
                      position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 30,
                      background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 8,
                      boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)', marginTop: 4, maxHeight: 180, overflowY: 'auto'
                    }}>
                      {moldOptions
                        .filter(m => m.toLowerCase().includes((moldSearchText || '').toLowerCase()))
                        .map((m, idx) => (
                          <div
                            key={idx}
                            onClick={() => {
                              setNewRecordForm({ ...newRecordForm, moldModel: m });
                              setMoldSearchText(m);
                              setIsMoldDropdownOpen(false);
                            }}
                            style={{
                              padding: '10px 14px', fontSize: '0.84rem', cursor: 'pointer',
                              color: '#1e293b', borderBottom: idx < moldOptions.length - 1 ? '1px solid #f1f5f9' : 'none',
                              background: newRecordForm.moldModel === m ? '#f8fafc' : '#ffffff'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.background = '#f1f5f9'}
                            onMouseLeave={(e) => e.currentTarget.style.background = newRecordForm.moldModel === m ? '#f8fafc' : '#ffffff'}
                          >
                            {m}
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              </div>

              {/* 5. ŞİKAYET / ARIZA CHECKLIST MATRIX (MÜŞTERİ / TEKNİSYEN) */}
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#0f172a', marginBottom: 8 }}>
                  Şikayet / Arıza
                </div>
                <div style={{ border: '1px solid #e2e8f0', borderRadius: 8, overflow: 'hidden' }}>
                  <div style={{
                    display: 'flex', background: '#f8fafc', padding: '8px 14px', borderBottom: '1px solid #e2e8f0',
                    fontSize: '0.78rem', fontWeight: 700, color: '#475569'
                  }}>
                    <div style={{ flex: 1 }}>Arıza Tanımı</div>
                    <div style={{ width: 90, textAlign: 'center' }}>Müşteri</div>
                    <div style={{ width: 90, textAlign: 'center' }}>Teknisyen</div>
                  </div>
                  {[
                    'Çalışmıyor',
                    'Ara ara kesiliyor',
                    'Açma-kapama anahtarı arızalı',
                    'Ses kontrol düğmesi arızalı',
                    'Yüksek pil tüketimi',
                    'Feedback (çınlama)',
                    'Program geçişi yapmıyor'
                  ].map((comp, idx, arr) => (
                    <div key={idx} style={{
                      display: 'flex', alignItems: 'center', padding: '8px 14px',
                      borderBottom: idx === arr.length - 1 ? 'none' : '1px solid #f1f5f9',
                      fontSize: '0.84rem', background: idx % 2 === 0 ? '#ffffff' : '#fafafa'
                    }}>
                      <div style={{ flex: 1, color: '#334155' }}>{comp}</div>
                      <div style={{ width: 90, textAlign: 'center' }}>
                        <input
                          type="checkbox"
                          checked={newRecordForm.customerComplaints.includes(comp)}
                          onChange={() => toggleCustomerComplaint(comp)}
                        />
                      </div>
                      <div style={{ width: 90, textAlign: 'center' }}>
                        <input
                          type="checkbox"
                          checked={newRecordForm.technicianComplaints.includes(comp)}
                          onChange={() => toggleTechnicianComplaint(comp)}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <textarea
                  className="form-textarea"
                  style={{ marginTop: 10, height: 70, fontSize: '0.84rem' }}
                  placeholder="Ek açıklama (opsiyonel)"
                  value={newRecordForm.extraDescription}
                  onChange={(e) => setNewRecordForm({ ...newRecordForm, extraDescription: e.target.value })}
                />
              </div>

              {/* 6. GARANTİ KAPSAMINDA TOGGLE SWITCH & BİTİŞ TARİHİ */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, background: '#f8fafc', padding: '14px 16px', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <button
                    type="button"
                    onClick={() => setNewRecordForm({ ...newRecordForm, warrantyRepair: !newRecordForm.warrantyRepair })}
                    style={{
                      width: 44, height: 24, borderRadius: 12,
                      background: newRecordForm.warrantyRepair ? '#2563eb' : '#cbd5e1',
                      border: 'none', cursor: 'pointer', position: 'relative',
                      transition: 'all 0.2s ease', padding: 2, flexShrink: 0
                    }}
                  >
                    <div style={{
                      width: 20, height: 20, borderRadius: '50%', background: '#ffffff',
                      position: 'absolute', top: 2,
                      left: newRecordForm.warrantyRepair ? 22 : 2,
                      transition: 'all 0.2s ease', boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
                    }} />
                  </button>
                  <span style={{ fontWeight: 600, fontSize: '0.88rem', color: '#0f172a' }}>
                    Garanti kapsamında
                  </span>
                </div>

                {newRecordForm.warrantyRepair && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                    <span style={{ fontSize: '0.82rem', color: '#475569', fontWeight: 500 }}>Garanti bitiş:</span>
                    <input
                      type="date"
                      className="form-input"
                      style={{ padding: '6px 10px', fontSize: '0.84rem', width: 160 }}
                      value={newRecordForm.warrantyEndDate}
                      onChange={(e) => setNewRecordForm({ ...newRecordForm, warrantyEndDate: e.target.value })}
                    />
                  </div>
                )}
              </div>

              {/* 7. TAMİRE TESLİM TARİHİ */}
              <div>
                <label className="form-label" style={{ fontWeight: 700, color: '#0f172a', marginBottom: 6 }}>
                  Tamire teslim tarihi
                </label>
                <input
                  type="date"
                  className="form-input"
                  value={newRecordForm.receivedDate}
                  onChange={(e) => setNewRecordForm({ ...newRecordForm, receivedDate: e.target.value })}
                />
              </div>

              {/* 8. TEKNİK SERVİSE GÖNDERİLECEKSE (OPSİYONEL) */}
              <div>
                <label className="form-label" style={{ fontWeight: 700, color: '#0f172a', marginBottom: 6 }}>
                  Teknik servise gönderilecekse <span style={{ fontWeight: 400, color: '#64748b', fontSize: '0.78rem' }}>(opsiyonel)</span>
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: 10 }}>
                  <select
                    className="form-select"
                    value={newRecordForm.serviceTarget}
                    onChange={(e) => setNewRecordForm({ ...newRecordForm, serviceTarget: e.target.value })}
                  >
                    <option value="Hedef">Hedef</option>
                    <option value="Merkez Servis">Merkez Servis</option>
                    <option value="Tedarikçi Servis">Tedarikçi Servis</option>
                    <option value="Şube İçi">Şube İçi</option>
                  </select>

                  <input
                    type="text"
                    className="form-input"
                    placeholder="Hangi teknik servis (ad)"
                    value={newRecordForm.serviceTargetName}
                    onChange={(e) => setNewRecordForm({ ...newRecordForm, serviceTargetName: e.target.value })}
                  />
                </div>
              </div>

              {/* 9. TESLİM EDEN (CİHAZI BIRAKAN KİŞİ) */}
              <div>
                <label className="form-label" style={{ fontWeight: 700, color: '#0f172a', marginBottom: 6 }}>
                  Teslim eden <span style={{ fontWeight: 400, color: '#64748b', fontSize: '0.78rem' }}>(cihazı bırakan kişi / opsiyonel)</span>
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Teslim eden adı / yakını (örn: Oğlu Mehmet)"
                  value={newRecordForm.deliveredBy}
                  onChange={(e) => setNewRecordForm({ ...newRecordForm, deliveredBy: e.target.value })}
                />
              </div>

            </div>

            {/* Modal Footer Controls */}
            <div className="modal-footer" style={{ padding: '14px 20px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowAddModal(false)}
              >
                İptal
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleSaveNewRecord}
                style={{ background: '#2563eb', padding: '8px 22px' }}
              >
                Kaydet / Tamir Kaydı Oluştur
              </button>
            </div>

          </div>
        </div>
      )}

      {/* 1. HATIRLATMA EKLE MODAL (Matching Screenshot 1) */}
      {showReminderModal && selectedRecord && (
        <div className="modal-overlay" onClick={() => setShowReminderModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 440, width: '90%', borderRadius: 12 }}>
            <div className="modal-header" style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0' }}>
              <span className="modal-title" style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>
                Hatırlatma Ekle
              </span>
              <button className="modal-close" onClick={() => setShowReminderModal(false)}>✕</button>
            </div>

            <div className="modal-body" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Info Callout Box */}
              <div style={{
                background: '#e0f2fe', border: '1px solid #bae6fd', borderRadius: 8,
                padding: '12px 14px', display: 'flex', gap: 10, alignItems: 'flex-start'
              }}>
                <span style={{ fontSize: '1.1rem', color: '#0284c7' }}>ℹ️</span>
                <span style={{ fontSize: '0.8rem', color: '#0369a1', lineHeight: 1.35 }}>
                  Bu hatırlatma yalnızca size (merkez personeline) düşer; hastaya mesaj gönderilmez.
                </span>
              </div>

              {/* Tarih Input */}
              <div>
                <label className="form-label" style={{ fontWeight: 600, fontSize: '0.82rem', color: '#64748b', marginBottom: 4 }}>
                  Tarih
                </label>
                <input
                  type="date"
                  className="form-input"
                  value={reminderDate}
                  onChange={(e) => setReminderDate(e.target.value)}
                />
              </div>

              {/* Hatırlatma Notu Textarea */}
              <div>
                <label className="form-label" style={{ fontWeight: 600, fontSize: '0.82rem', color: '#64748b', marginBottom: 4 }}>
                  Hatırlatma notu
                </label>
                <textarea
                  className="form-textarea"
                  style={{ height: 80, fontSize: '0.84rem' }}
                  placeholder="Örn: Tedarikçiyi ara — parça geldi mi kontrol et"
                  value={reminderNote}
                  onChange={(e) => setReminderNote(e.target.value)}
                />
              </div>
            </div>

            <div className="modal-footer" style={{ padding: '12px 20px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button className="btn btn-secondary" onClick={() => setShowReminderModal(false)}>Vazgeç</button>
              <button
                className="btn btn-primary"
                onClick={() => {
                  setShowReminderModal(false);
                  addToast({ type: 'success', message: `${selectedRecord.patientName} için personel hatırlatması oluşturuldu.` });
                  setReminderNote('');
                }}
              >
                Ekle
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. YENİ RANDEVU MODAL (Matching Screenshots 2 & 3) */}
      {showAppointmentModal && selectedRecord && (
        <div className="modal-overlay" onClick={() => setShowAppointmentModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 540, width: '95%', borderRadius: 12 }}>
            <div className="modal-header" style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span>📅</span>
                <span className="modal-title" style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>
                  Yeni Randevu
                </span>
              </div>
              <button className="modal-close" onClick={() => setShowAppointmentModal(false)}>✕</button>
            </div>

            <div className="modal-body" style={{ padding: 20, maxHeight: '78vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Hasta Dropdown & Selected Card */}
              <div>
                <label className="form-label" style={{ fontWeight: 600, fontSize: '0.82rem', color: '#0f172a', marginBottom: 4 }}>
                  <span style={{ color: '#ef4444' }}>*</span> 👤 Hasta
                </label>
                <select
                  className="form-select"
                  value={selectedRecord.patientName}
                  disabled
                  style={{ background: '#e2e8f0', color: '#475569', cursor: 'not-allowed', borderColor: '#cbd5e1', fontWeight: 500 }}
                >
                  <option>{selectedRecord.patientName} - 05459111099</option>
                </select>

                <div style={{
                  background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8,
                  padding: '12px 14px', marginTop: 8, fontSize: '0.84rem', color: '#1e293b'
                }}>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: 4 }}>{selectedRecord.patientName}</div>
                  <div style={{ color: '#64748b', fontSize: '0.8rem' }}>📞 05459111099</div>
                  <div style={{ color: '#64748b', fontSize: '0.8rem' }}>TC: 12638639514</div>
                </div>
              </div>

              {/* Grid: Tarih ve Saat | Randevu Tipi */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label className="form-label" style={{ fontWeight: 600, fontSize: '0.82rem', color: '#0f172a', marginBottom: 4 }}>
                    <span style={{ color: '#ef4444' }}>*</span> 📅 Tarih ve Saat
                  </label>
                  <input
                    type="datetime-local"
                    className="form-input"
                    value={appointmentDateTime}
                    onChange={(e) => setAppointmentDateTime(e.target.value)}
                  />
                </div>

                <div>
                  <label className="form-label" style={{ fontWeight: 600, fontSize: '0.82rem', color: '#0f172a', marginBottom: 4 }}>
                    <span style={{ color: '#ef4444' }}>*</span> 🏥 Randevu Tipi
                  </label>
                  <select
                    className="form-select"
                    value={appointmentType}
                    onChange={(e) => setAppointmentType(e.target.value)}
                  >
                    <option value="Muayene">● Muayene</option>
                    <option value="Kontrol">● Kontrol</option>
                    <option value="Test">● Test</option>
                    <option value="Cihaz Denemesi">● Cihaz Denemesi</option>
                    <option value="Cihaz Teslim">● Cihaz Teslim</option>
                    <option value="Servis">● Servis</option>
                  </select>
                </div>
              </div>

              {/* Notlar */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <label className="form-label" style={{ fontWeight: 600, fontSize: '0.82rem', color: '#0f172a', margin: 0 }}>
                    Notlar
                  </label>
                  <span style={{ fontSize: '0.74rem', color: '#94a3b8' }}>{appointmentNotes.length} / 500</span>
                </div>
                <textarea
                  className="form-textarea"
                  style={{ height: 75, fontSize: '0.84rem' }}
                  placeholder="Randevu ile ilgili notlar..."
                  maxLength={500}
                  value={appointmentNotes}
                  onChange={(e) => setAppointmentNotes(e.target.value)}
                />
              </div>

              {/* Takip Planı Section (Matching Screenshot 2) */}
              <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: 12 }}>
                <div style={{ textAlign: 'center', fontSize: '0.8rem', fontWeight: 700, color: '#2563eb', marginBottom: 8 }}>
                  📅 Takip Planı
                </div>
                <label style={{ display: 'flex', alignItems: 'flex-start', gap: 8, cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={createFollowupPlan}
                    onChange={(e) => setCreateFollowupPlan(e.target.checked)}
                    style={{ marginTop: 2, width: 16, height: 16, accentColor: '#2563eb' }}
                  />
                  <div>
                    <div style={{ fontSize: '0.84rem', fontWeight: 600, color: '#0f172a' }}>Takip planı oluştur</div>
                    <div style={{ fontSize: '0.76rem', color: '#64748b' }}>
                      Randevu tarihinden itibaren periyodik kontrol hatırlatmaları oluşturulur
                    </div>
                  </div>
                </label>

                {createFollowupPlan && (
                  <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: 14, marginTop: 10, display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div style={{ fontWeight: 700, fontSize: '0.84rem', color: '#0f172a' }}>Kontrol Dönemleri</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {['1 Hafta Kontrol', '1 Ay Kontrol', '3 Ay Kontrol', '6 Ay Kontrol', '1 Yıl Kontrol'].map((period) => (
                        <label key={period} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.84rem', color: '#1e293b', cursor: 'pointer' }}>
                          <input
                            type="checkbox"
                            checked={followupPeriods.includes(period)}
                            onChange={() => {
                              if (followupPeriods.includes(period)) {
                                setFollowupPeriods(followupPeriods.filter(p => p !== period));
                              } else {
                                setFollowupPeriods([...followupPeriods, period]);
                              }
                            }}
                            style={{ width: 16, height: 16, accentColor: '#2563eb' }}
                          />
                          {period}
                        </label>
                      ))}
                    </div>

                    <div>
                      <div style={{ fontSize: '0.78rem', color: '#64748b', marginBottom: 4 }}>Takip Notu (opsiyonel)</div>
                      <textarea
                        className="form-textarea"
                        style={{ height: 65, fontSize: '0.82rem' }}
                        placeholder="Takip planı için not..."
                        value={followupNote}
                        onChange={(e) => setFollowupNote(e.target.value)}
                      />
                      <div style={{ fontSize: '0.72rem', color: '#94a3b8', textAlign: 'right', marginTop: 2 }}>{followupNote.length} / 500</div>
                    </div>

                    {/* Info Callout */}
                    <div style={{ background: '#e0f2fe', border: '1px solid #bae6fd', borderRadius: 6, padding: '8px 12px', fontSize: '0.76rem', color: '#0369a1', lineHeight: 1.35 }}>
                      📅 Seçilen dönemlerde personele hatırlatma bildirimi gönderilir. Aynı gün randevu hatırlatması varsa çift mesaj gitmez.
                    </div>
                  </div>
                )}
              </div>

              {/* WhatsApp Hatırlatma Section */}
              <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: 12 }}>
                <div style={{ textAlign: 'center', fontSize: '0.8rem', fontWeight: 700, color: '#16a34a', marginBottom: 8 }}>
                  💬 WhatsApp Hatırlatma
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <span style={{ fontSize: '0.84rem', fontWeight: 600, color: '#0f172a' }}>Hatırlatma Gönder</span>
                  <button
                    type="button"
                    onClick={() => setSendWhatsappReminder(!sendWhatsappReminder)}
                    style={{
                      width: 44, height: 24, borderRadius: 12,
                      background: sendWhatsappReminder ? '#2563eb' : '#cbd5e1',
                      border: 'none', cursor: 'pointer', position: 'relative',
                      transition: 'all 0.2s ease', padding: 2
                    }}
                  >
                    <div style={{
                      width: 20, height: 20, borderRadius: '50%', background: '#ffffff',
                      position: 'absolute', top: 2,
                      left: sendWhatsappReminder ? 22 : 2,
                      transition: 'all 0.2s ease', boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
                    }} />
                  </button>
                </div>

                {sendWhatsappReminder && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {/* Hızlı Ekle Badges */}
                    <div>
                      <div style={{ fontSize: '0.78rem', color: '#64748b', marginBottom: 6 }}>Hızlı Ekle:</div>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {['15 dakika önce', '30 dakika önce', '1 saat önce', '2 saat önce', '1 gün önce'].map((timeStr) => (
                          <button
                            key={timeStr}
                            type="button"
                            onClick={() => {
                              if (!selectedRemindersList.includes(timeStr)) {
                                setSelectedRemindersList([...selectedRemindersList, timeStr]);
                              }
                            }}
                            style={{
                              padding: '4px 10px', fontSize: '0.78rem', background: '#f1f5f9',
                              border: '1px solid #cbd5e1', borderRadius: 6, cursor: 'pointer', color: '#1e293b'
                            }}
                          >
                            {timeStr}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Özel Zaman Ekle */}
                    <div>
                      <div style={{ fontSize: '0.78rem', color: '#64748b', marginBottom: 4 }}>Özel Zaman Ekle:</div>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <input
                          type="text"
                          className="form-input"
                          style={{ width: 60, padding: '4px 8px', fontSize: '0.82rem' }}
                          value={customTimeVal}
                          onChange={(e) => setCustomTimeVal(e.target.value)}
                        />
                        <select
                          className="form-select"
                          style={{ width: 100, padding: '4px 8px', fontSize: '0.82rem' }}
                          value={customTimeUnit}
                          onChange={(e) => setCustomTimeUnit(e.target.value)}
                        >
                          <option value="Dakika">Dakika</option>
                          <option value="Saat">Saat</option>
                          <option value="Gün">Gün</option>
                        </select>
                        <button
                          type="button"
                          className="btn btn-secondary"
                          style={{ padding: '4px 12px', fontSize: '0.82rem' }}
                          onClick={() => {
                            const newReminderStr = `${customTimeVal} ${customTimeUnit.toLowerCase()} önce`;
                            if (!selectedRemindersList.includes(newReminderStr)) {
                              setSelectedRemindersList([...selectedRemindersList, newReminderStr]);
                            }
                          }}
                        >
                          + Ekle
                        </button>
                      </div>
                    </div>

                    {/* Seçili Hatırlatmalar */}
                    <div style={{ background: '#f8fafc', padding: 10, borderRadius: 8, border: '1px solid #e2e8f0' }}>
                      <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0f172a', marginBottom: 6 }}>
                        ⏰ Seçili Hatırlatmalar ({selectedRemindersList.length})
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {selectedRemindersList.map((rem, idx) => (
                          <div key={idx} style={{
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            background: '#ffffff', border: '1px solid #e2e8f0', padding: '6px 10px', borderRadius: 6, fontSize: '0.8rem'
                          }}>
                            <span style={{ color: '#1e293b' }}>🔔 {rem}</span>
                            <button
                              type="button"
                              onClick={() => setSelectedRemindersList(selectedRemindersList.filter((_, i) => i !== idx))}
                              style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '0.9rem' }}
                            >
                              🗑️
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* WhatsApp Mesajı Warning Callout & Toggle */}
              <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: 12 }}>
                <div style={{ textAlign: 'center', fontSize: '0.8rem', fontWeight: 700, color: '#0284c7', marginBottom: 8 }}>
                  ✈️ Randevu Mesajı
                </div>

                <div style={{
                  background: '#fefce8', border: '1px solid #fef08a', borderRadius: 8,
                  padding: '12px 14px', marginBottom: 12
                }}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', fontWeight: 700, color: '#854d0e', fontSize: '0.82rem', marginBottom: 4 }}>
                    <span>⚠️</span> WhatsApp bağlı değil — bilgilendirme mesajı gönderilmeyecek
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#a16207', lineHeight: 1.35 }}>
                    Bu şubede WhatsApp entegrasyonu kapalı. Randevu normal şekilde kaydedilir, ancak hastaya otomatik mesaj gitmez. Mesaj göndermek için Uyarlamalar {'>'} WhatsApp bölümünden bağlantı kurun.
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.84rem', fontWeight: 600, color: '#0f172a' }}>Oluştururken WhatsApp Mesajı Gönder</span>
                  <button
                    type="button"
                    onClick={() => setSendWhatsappMessageOnCreate(!sendWhatsappMessageOnCreate)}
                    style={{
                      width: 44, height: 24, borderRadius: 12,
                      background: sendWhatsappMessageOnCreate ? '#2563eb' : '#cbd5e1',
                      border: 'none', cursor: 'pointer', position: 'relative',
                      transition: 'all 0.2s ease', padding: 2
                    }}
                  >
                    <div style={{
                      width: 20, height: 20, borderRadius: '50%', background: '#ffffff',
                      position: 'absolute', top: 2,
                      left: sendWhatsappMessageOnCreate ? 22 : 2,
                      transition: 'all 0.2s ease', boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
                    }} />
                  </button>
                </div>
              </div>
            </div>

            <div className="modal-footer" style={{ padding: '12px 20px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button className="btn btn-secondary" onClick={() => setShowAppointmentModal(false)}>Vazgeç</button>
              <button
                className="btn btn-primary"
                onClick={() => {
                  setShowAppointmentModal(false);
                  addToast({ type: 'success', message: `${selectedRecord.patientName} adına yeni servis randevusu oluşturuldu.` });
                }}
              >
                📅 Randevu Oluştur
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. İŞLEM EKLE MODAL (Matching Screenshots 2, 3, 4) */}
      {showAddOperationModal && selectedRecord && (
        <div className="modal-overlay" onClick={() => setShowAddOperationModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 520, width: '95%', borderRadius: 12 }}>
            <div className="modal-header" style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0' }}>
              <span className="modal-title" style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>
                İşlem Ekle
              </span>
              <button className="modal-close" onClick={() => setShowAddOperationModal(false)}>✕</button>
            </div>

            <div className="modal-body" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Row 1: Durum (opsiyonel) | Not */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label className="form-label" style={{ fontWeight: 600, fontSize: '0.82rem', color: '#64748b', marginBottom: 4 }}>
                    Durum (opsiyonel)
                  </label>
                  <select
                    className="form-select"
                    value={opStatus}
                    onChange={(e) => setOpStatus(e.target.value)}
                  >
                    <option value="">Durum değiştir</option>
                    <option value="İnceleniyor">İnceleniyor</option>
                    <option value="Tamir Ediliyor">Tamir Ediliyor</option>
                    <option value="Dışarı Gönderildi">Dışarı Gönderildi</option>
                    <option value="Hazır">Hazır</option>
                    <option value="Teslim Edildi">Teslim Edildi</option>
                    <option value="İptal">İptal</option>
                  </select>
                </div>

                <div>
                  <label className="form-label" style={{ fontWeight: 600, fontSize: '0.82rem', color: '#64748b', marginBottom: 4 }}>
                    Not
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Kısa not (opsiyonel)"
                    value={opShortNote}
                    onChange={(e) => setOpShortNote(e.target.value)}
                  />
                </div>
              </div>

              {/* Row 2: Karar (Teklif & Onay) */}
              <div style={{ width: '50%' }}>
                <label className="form-label" style={{ fontWeight: 600, fontSize: '0.82rem', color: '#64748b', marginBottom: 4 }}>
                  Karar (Teklif & Onay)
                </label>
                <select
                  className="form-select"
                  value={opDecision}
                  onChange={(e) => setOpDecision(e.target.value)}
                >
                  <option value="">Tamir / İade</option>
                  <option value="Tamir">Tamir</option>
                  <option value="İade">İade (tamir edilmeden)</option>
                </select>
              </div>

              {/* Teşhis & Yapılan İşlem Section */}
              <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: 10 }}>
                <div style={{ fontSize: '0.84rem', fontWeight: 700, color: '#0f172a', marginBottom: 8 }}>
                  Teşhis & Yapılan İşlem
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <textarea
                    className="form-textarea"
                    style={{ height: 60, fontSize: '0.82rem' }}
                    placeholder="Teşhis (teknisyen tespiti)"
                    value={opDiagnosis}
                    onChange={(e) => setOpDiagnosis(e.target.value)}
                  />
                  <textarea
                    className="form-textarea"
                    style={{ height: 60, fontSize: '0.82rem' }}
                    placeholder="Yapılan işlem / kullanılan parça"
                    value={opAction}
                    onChange={(e) => setOpAction(e.target.value)}
                  />
                </div>
              </div>

              {/* Costs Row: İşçilik | Parça | Toplam */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 4 }}>
                <div style={{ flex: 1 }}>
                  <label className="form-label" style={{ fontWeight: 600, fontSize: '0.78rem', color: '#64748b', marginBottom: 2 }}>
                    İşçilik
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <input
                      type="number"
                      className="form-input"
                      style={{ fontSize: '0.85rem' }}
                      value={opLaborCost}
                      onChange={(e) => setOpLaborCost(e.target.value)}
                    />
                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>₺</span>
                  </div>
                </div>

                <div style={{ flex: 1 }}>
                  <label className="form-label" style={{ fontWeight: 600, fontSize: '0.78rem', color: '#64748b', marginBottom: 2 }}>
                    Parça
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <input
                      type="number"
                      className="form-input"
                      style={{ fontSize: '0.85rem' }}
                      value={opPartCost}
                      onChange={(e) => setOpPartCost(e.target.value)}
                    />
                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>₺</span>
                  </div>
                </div>

                <div style={{ flex: 1 }}>
                  <label className="form-label" style={{ fontWeight: 600, fontSize: '0.78rem', color: '#64748b', marginBottom: 2 }}>
                    Toplam
                  </label>
                  <div style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a', paddingTop: 6 }}>
                    {formatCurrency((Number(opLaborCost) || 0) + (Number(opPartCost) || 0))}
                  </div>
                </div>
              </div>

              {/* Link: + Dışarı gönderim bilgisi ekle */}
              <div>
                <button
                  type="button"
                  onClick={() => setShowExternalDispatch(!showExternalDispatch)}
                  style={{ background: 'none', border: 'none', color: '#64748b', fontSize: '0.78rem', cursor: 'pointer', padding: 0 }}
                >
                  + Dışarı gönderim bilgisi ekle
                </button>
                {showExternalDispatch && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 8, background: '#f8fafc', padding: 10, borderRadius: 6 }}>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Firma / Lab adı"
                      value={externalDispatchCompany}
                      onChange={(e) => setExternalDispatchCompany(e.target.value)}
                    />
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Takip / Kargo No"
                      value={externalDispatchTrackingNo}
                      onChange={(e) => setExternalDispatchTrackingNo(e.target.value)}
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="modal-footer" style={{ padding: '12px 20px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button className="btn btn-secondary" onClick={() => setShowAddOperationModal(false)}>Vazgeç</button>
              <button
                className="btn btn-primary"
                onClick={handleAddOperation}
              >
                Ekle
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
