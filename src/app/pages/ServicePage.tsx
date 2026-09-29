'use client';

import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { useBranchScope } from '../hooks/useBranchScope';
import { formatCurrency } from '../data/mockData';
import styles from './ServicePage.module.css';

export interface ServiceItem {
  id: string;
  patientId?: string;
  patientName: string;
  patientPhone: string;
  patientInitials: string;
  avatarColor: string;
  deviceName: string;
  earSide: 'Sol kulak' | 'Sağ kulak' | 'Binaural';
  serialNo: string;
  barcode: string;
  problem: string;
  receivedDate: string;
  estimatedDeliveryDate: string;
  returnedDate?: string | null;
  status: 'Alındı' | 'İnceleniyor' | 'Tamir Ediliyor' | 'Teslime Hazır' | 'Garanti' | 'Teslim Edildi';
  warrantyStatus: 'Garanti Kapsamında' | 'Garanti Dışı';
  deviceType: string;
  notes?: string;
  technician?: string;
  branch?: string;
  operations?: { description: string; cost: number; date: string }[];
  files?: { name: string; size: string; date: string }[];
  history?: { title: string; date: string; user: string; note: string }[];
}

const INITIAL_SERVICE_RECORDS: ServiceItem[] = [
  {
    id: 'srv-1',
    patientName: 'Test Hasta Üç',
    patientPhone: '0532 123 45 67',
    patientInitials: 'TH',
    avatarColor: '#0d9488',
    deviceName: 'Oticon More 1',
    earSide: 'Sol kulak',
    serialNo: '1234567890',
    barcode: 'OT-001',
    problem: 'Ses kesilmesi',
    receivedDate: '29.09.2026',
    estimatedDeliveryDate: '02.10.2026',
    status: 'Alındı',
    warrantyStatus: 'Garanti Dışı',
    deviceType: 'Kulak arkası',
    notes: 'Zaman zaman ses kesiliyor.',
    technician: 'Teknik Servis',
    branch: 'Test Şube 1',
    operations: [
      { description: 'Giriş kontrolü ve akustik test', cost: 0, date: '29.09.2026' }
    ],
    files: [
      { name: 'Giriş_Kabul_Fotoğrafı.jpg', size: '1.8 MB', date: '29.09.2026' }
    ],
    history: [
      { title: 'Servis Kabul Edildi', date: '29.09.2026 14:10', user: 'Ahmet Yılmaz', note: 'Cihaz teslim alındı, genel kontrol başlatıldı.' }
    ]
  },
  {
    id: 'srv-2',
    patientName: 'Ayşe Yılmaz',
    patientPhone: '0533 222 11 44',
    patientInitials: 'AY',
    avatarColor: '#2563eb',
    deviceName: 'Phonak Audeo L',
    earSide: 'Sağ kulak',
    serialNo: '9876543210',
    barcode: 'PH-002',
    problem: 'Cihaz açılmıyor',
    receivedDate: '28.09.2026',
    estimatedDeliveryDate: '04.10.2026',
    status: 'İnceleniyor',
    warrantyStatus: 'Garanti Kapsamında',
    deviceType: 'RIC (Hoparlör Kulak İçi)',
    notes: 'Şarj ünitesine takıldığında tepki vermiyor.',
    technician: 'Teknik Servis',
    branch: 'Merkez Şube',
    operations: [
      { description: 'Batarya ve devre kontrolü', cost: 0, date: '28.09.2026' }
    ],
    files: [],
    history: [
      { title: 'İncelemeye Alındı', date: '28.09.2026 11:30', user: 'Emre Koç', note: 'Elektronik test ünitesine bağlandı.' }
    ]
  },
  {
    id: 'srv-3',
    patientName: 'Mehmet Kaya',
    patientPhone: '0505 111 22 33',
    patientInitials: 'MK',
    avatarColor: '#10b981',
    deviceName: 'Widex Moment',
    earSide: 'Binaural',
    serialNo: '4567891234',
    barcode: 'WD-003',
    problem: 'Ses cızırtısı',
    receivedDate: '26.09.2026',
    estimatedDeliveryDate: '—',
    status: 'Tamir Ediliyor',
    warrantyStatus: 'Garanti Dışı',
    deviceType: 'Kulak arkası',
    notes: 'Yüksek frekanslarda parazit ve cızırtı mevcut.',
    technician: 'Teknik Servis',
    branch: 'Merkez Şube',
    operations: [
      { description: 'Mikrofon filtre değişimi', cost: 450, date: '27.09.2026' },
      { description: 'Akustik kalibrasyon', cost: 300, date: '28.09.2026' }
    ],
    files: [],
    history: [
      { title: 'Onarım Başladı', date: '27.09.2026 09:15', user: 'Teknik Servis', note: 'Parça değişimi yapılıyor.' }
    ]
  },
  {
    id: 'srv-4',
    patientName: 'Elif Demir',
    patientPhone: '0532 987 65 43',
    patientInitials: 'ED',
    avatarColor: '#b45309',
    deviceName: 'Signia Pure 312',
    earSide: 'Sol kulak',
    serialNo: '3216549870',
    barcode: 'SG-004',
    problem: 'Pil problemi',
    receivedDate: '24.09.2026',
    estimatedDeliveryDate: '01.10.2026',
    status: 'Teslime Hazır',
    warrantyStatus: 'Garanti Kapsamında',
    deviceType: 'Kulak arkası',
    notes: 'Pil yuvası korozyonu temizlendi, yeni pil kapağı takıldı.',
    technician: 'Teknik Servis',
    branch: 'Kadıköy Şube',
    operations: [
      { description: 'Pil yuvası revizyonu', cost: 0, date: '25.09.2026' }
    ],
    files: [],
    history: [
      { title: 'Tamamlandı & Teslime Hazır', date: '26.09.2026 16:00', user: 'Ahmet Yılmaz', note: 'Hasta bilgilendirme SMS gönderildi.' }
    ]
  },
  {
    id: 'srv-5',
    patientName: 'Ahmet Yılmaz',
    patientPhone: '0530 555 44 33',
    patientInitials: 'AH',
    avatarColor: '#0f766e',
    deviceName: 'Resound Nexia',
    earSide: 'Sağ kulak',
    serialNo: '1597534862',
    barcode: 'RS-005',
    problem: 'Temizlik bakımı',
    receivedDate: '22.09.2026',
    estimatedDeliveryDate: '24.09.2026',
    status: 'Tamir Ediliyor',
    warrantyStatus: 'Garanti Dışı',
    deviceType: 'Kulak içi (ITE)',
    notes: 'Kulak kiri filtresi ve mikrofon portları temizleniyor.',
    technician: 'Teknik Servis',
    branch: 'Merkez Şube',
    operations: [
      { description: 'Ultrasonik temizlik ve kurutma', cost: 350, date: '23.09.2026' }
    ],
    files: [],
    history: [
      { title: 'Bakım Başlatıldı', date: '23.09.2026 10:00', user: 'Teknik Servis', note: 'Temizlik havuzuna alındı.' }
    ]
  },
  {
    id: 'srv-6',
    patientName: 'Zeynep Güneş',
    patientPhone: '0531 444 77 11',
    patientInitials: 'ZG',
    avatarColor: '#7e22ce',
    deviceName: 'Starkey Evolv',
    earSide: 'Binaural',
    serialNo: '7539514563',
    barcode: 'ST-006',
    problem: 'Mikrofon sorunu',
    receivedDate: '20.09.2026',
    estimatedDeliveryDate: '—',
    status: 'Garanti',
    warrantyStatus: 'Garanti Kapsamında',
    deviceType: 'RIC (Hoparlör Kulak İçi)',
    notes: 'Distribütör garantisi kapsamında üreticiye gönderildi.',
    technician: 'Distribütör Servis',
    branch: 'Çankaya Şube',
    operations: [
      { description: 'Fabrika garantili mikrofon kartı değişimi', cost: 0, date: '22.09.2026' }
    ],
    files: [],
    history: [
      { title: 'Garanti Kapsamına Alındı', date: '21.09.2026 11:20', user: 'Ahmet Yılmaz', note: 'Merkez distribütöre sevk edildi.' }
    ]
  },
  {
    id: 'srv-7',
    patientName: 'Cem Doğan',
    patientPhone: '0544 333 22 11',
    patientInitials: 'CD',
    avatarColor: '#16a34a',
    deviceName: 'Unitron Moxi',
    earSide: 'Sol kulak',
    serialNo: '9513571598',
    barcode: 'UN-007',
    problem: 'Parça değişimi',
    receivedDate: '18.09.2026',
    estimatedDeliveryDate: '25.09.2026',
    returnedDate: '25.09.2026',
    status: 'Teslim Edildi',
    warrantyStatus: 'Garanti Dışı',
    deviceType: 'Kulak arkası',
    notes: 'Hoparlör kordonu ve boynuz parçası yenilendi.',
    technician: 'Teknik Servis',
    branch: 'Kadıköy Şube',
    operations: [
      { description: 'Hoparlör değişimi', cost: 1250, date: '20.09.2026' },
      { description: 'Genel test', cost: 200, date: '24.09.2026' }
    ],
    files: [],
    history: [
      { title: 'Hastaya Teslim Edildi', date: '25.09.2026 17:30', user: 'Kadıköy Şube', note: 'Ödeme tahsil edildi ve teslim edildi.' }
    ]
  },
  {
    id: 'srv-8',
    patientName: 'Seda Yıldız',
    patientPhone: '0538 999 11 22',
    patientInitials: 'SY',
    avatarColor: '#64748b',
    deviceName: 'Bernafon Alpha',
    earSide: 'Sağ kulak',
    serialNo: '6549873210',
    barcode: 'BE-008',
    problem: 'Su teması',
    receivedDate: '15.09.2026',
    estimatedDeliveryDate: '30.09.2026',
    status: 'İnceleniyor',
    warrantyStatus: 'Garanti Dışı',
    deviceType: 'Kulak arkası',
    notes: 'Yağmur suyu teması sonucu nem alma işlemi uygulanıyor.',
    technician: 'Teknik Servis',
    branch: 'Merkez Şube',
    operations: [
      { description: 'Nem alma ve anakart temizliği', cost: 600, date: '16.09.2026' }
    ],
    files: [],
    history: [
      { title: 'Nem Fırınına Alındı', date: '16.09.2026 14:00', user: 'Teknik Servis', note: '24 saatlik nem giderme fırınında.' }
    ]
  },
  {
    id: 'srv-9',
    patientName: 'Fatma Kaya',
    patientPhone: '0535 777 88 99',
    patientInitials: 'FK',
    avatarColor: '#d97706',
    deviceName: 'Oticon Real 1',
    earSide: 'Sağ kulak',
    serialNo: '8529637410',
    barcode: 'OT-009',
    problem: 'Hoparlör arızası',
    receivedDate: '12.09.2026',
    estimatedDeliveryDate: '18.09.2026',
    status: 'Alındı',
    warrantyStatus: 'Garanti Dışı',
    deviceType: 'RIC (Hoparlör Kulak İçi)',
    notes: 'Hoparlör membranı patlak.',
    technician: 'Teknik Servis',
    branch: 'Test Şube 1'
  },
  {
    id: 'srv-10',
    patientName: 'Ali Öztürk',
    patientPhone: '0542 666 55 44',
    patientInitials: 'AO',
    avatarColor: '#4f46e5',
    deviceName: 'Phonak Lumity 90',
    earSide: 'Sol kulak',
    serialNo: '7418529630',
    barcode: 'PH-010',
    problem: 'Şarj olmuyor',
    receivedDate: '10.09.2026',
    estimatedDeliveryDate: '16.09.2026',
    status: 'Tamir Ediliyor',
    warrantyStatus: 'Garanti Kapsamında',
    deviceType: 'Şarjlı Kulak Arkası',
    notes: 'Kontak pinleri lehimleniyor.',
    technician: 'Teknik Servis',
    branch: 'Merkez Şube'
  },
  {
    id: 'srv-11',
    patientName: 'Burak Akın',
    patientPhone: '0532 444 33 22',
    patientInitials: 'BA',
    avatarColor: '#059669',
    deviceName: 'Widex Magnify',
    earSide: 'Binaural',
    serialNo: '9638527410',
    barcode: 'WD-011',
    problem: 'Filtre tıkanıklığı',
    receivedDate: '08.09.2026',
    estimatedDeliveryDate: '10.09.2026',
    status: 'Teslime Hazır',
    warrantyStatus: 'Garanti Dışı',
    deviceType: 'Kulak arkası',
    notes: 'Filtreler değiştirildi ve temizlik yapıldı.',
    technician: 'Teknik Servis',
    branch: 'Çankaya Şube'
  },
  {
    id: 'srv-12',
    patientName: 'Ece Çelik',
    patientPhone: '0533 111 22 33',
    patientInitials: 'EC',
    avatarColor: '#db2777',
    deviceName: 'Signia Styletto',
    earSide: 'Sağ kulak',
    serialNo: '1472583690',
    barcode: 'SG-012',
    problem: 'Kalıp uyumsuzluğu',
    receivedDate: '06.09.2026',
    estimatedDeliveryDate: '12.09.2026',
    status: 'İnceleniyor',
    warrantyStatus: 'Garanti Dışı',
    deviceType: 'Kulak arkası',
    notes: 'Yeni kalıp ölçüsü alındı.',
    technician: 'Teknik Servis',
    branch: 'Kadıköy Şube'
  },
  {
    id: 'srv-13',
    patientName: 'Mustafa Arslan',
    patientPhone: '0555 888 77 66',
    patientInitials: 'MA',
    avatarColor: '#475569',
    deviceName: 'Resound Key 4',
    earSide: 'Sol kulak',
    serialNo: '3692581470',
    barcode: 'RS-013',
    problem: 'Genel revizyon',
    receivedDate: '04.09.2026',
    estimatedDeliveryDate: '08.09.2026',
    returnedDate: '08.09.2026',
    status: 'Teslim Edildi',
    warrantyStatus: 'Garanti Dışı',
    deviceType: 'Kulak arkası',
    notes: 'Yıllık periyodik bakım yapıldı.',
    technician: 'Teknik Servis',
    branch: 'Merkez Şube'
  },
  {
    id: 'srv-14',
    patientName: 'Selin Kurt',
    patientPhone: '0537 999 44 55',
    patientInitials: 'SK',
    avatarColor: '#ea580c',
    deviceName: 'Oticon Zircon 2',
    earSide: 'Binaural',
    serialNo: '2581473690',
    barcode: 'OT-014',
    problem: 'Bluetooth kesintisi',
    receivedDate: '02.09.2026',
    estimatedDeliveryDate: '07.09.2026',
    status: 'Alındı',
    warrantyStatus: 'Garanti Kapsamında',
    deviceType: 'Kulak arkası',
    notes: 'Telefon bağlantısında kopmalar yaşanıyor.',
    technician: 'Teknik Servis',
    branch: 'Test Şube 1'
  },
  {
    id: 'srv-15',
    patientName: 'Hakan Yıldırım',
    patientPhone: '0539 333 55 77',
    patientInitials: 'HY',
    avatarColor: '#0284c7',
    deviceName: 'Phonak Terra+',
    earSide: 'Sağ kulak',
    serialNo: '7894561230',
    barcode: 'PH-015',
    problem: 'Ses distorsiyonu',
    receivedDate: '01.09.2026',
    estimatedDeliveryDate: '05.09.2026',
    status: 'İnceleniyor',
    warrantyStatus: 'Garanti Dışı',
    deviceType: 'Kulak arkası',
    notes: 'Yüksek frekans kazancı kontrol edilecek.',
    technician: 'Teknik Servis',
    branch: 'Merkez Şube'
  }
];

export default function ServicePage() {
  const { addToast, stockList, patientsList, completeServiceTicket } = useApp();
  const { matches } = useBranchScope();

  // State Management
  const [records, setRecords] = useState<ServiceItem[]>(INITIAL_SERVICE_RECORDS);
  const [filterStatus, setFilterStatus] = useState<string>('Tümü (15)');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('Tüm Şubeler');
  const [selectedStatusDropdown, setSelectedStatusDropdown] = useState('Tüm Durumlar');
  const [selectedDeviceType, setSelectedDeviceType] = useState('Tüm Cihaz Türleri');
  const [selectedWarranty, setSelectedWarranty] = useState('Tüm Garanti Durumları');

  // Selected item for right detail drawer
  const [selectedItem, setSelectedItem] = useState<ServiceItem | null>(INITIAL_SERVICE_RECORDS[0]);
  const [selectedRowIds, setSelectedRowIds] = useState<string[]>(['srv-1']);
  const [drawerTab, setDrawerTab] = useState<'Genel' | 'İşlem Geçmişi' | 'Parça & Maliyet' | 'Dosyalar'>('Genel');

  // Modals state
  const [showNewRecordModal, setShowNewRecordModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showAddPartModal, setShowAddPartModal] = useState(false);
  const [showAddFileModal, setShowAddFileModal] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  // Form states
  const [statusUpdateVal, setStatusUpdateVal] = useState<ServiceItem['status']>('Alındı');
  const [statusUpdateNote, setStatusUpdateNote] = useState('');

  const [newPartDesc, setNewPartDesc] = useState('');
  const [newPartCost, setNewPartCost] = useState('450');

  const [newRecordForm, setNewRecordForm] = useState({
    patientName: '',
    patientPhone: '',
    deviceName: '',
    earSide: 'Sol kulak' as ServiceItem['earSide'],
    serialNo: '',
    barcode: '',
    problem: '',
    warrantyStatus: 'Garanti Kapsamında' as ServiceItem['warrantyStatus'],
    deviceType: 'Kulak arkası',
    notes: '',
    estimatedDays: '3'
  });

  // Pill counts calculation
  const pillCounts = useMemo(() => {
    const total = records.length;
    const alindi = records.filter(r => r.status === 'Alındı').length;
    const inceleniyor = records.filter(r => r.status === 'İnceleniyor').length;
    const tamir = records.filter(r => r.status === 'Tamir Ediliyor').length;
    const hazir = records.filter(r => r.status === 'Teslime Hazır').length;
    const teslim = records.filter(r => r.status === 'Teslim Edildi').length;
    return {
      all: total,
      alindi,
      inceleniyor,
      tamir,
      hazir,
      teslim
    };
  }, [records]);

  // Filtered rows
  const filteredRecords = useMemo(() => {
    return records.filter(item => {
      if (!matches(item.branch)) return false;

      // Status pill filter
      if (filterStatus.startsWith('Alındı') && item.status !== 'Alındı') return false;
      if (filterStatus.startsWith('İnceleniyor') && item.status !== 'İnceleniyor') return false;
      if (filterStatus.startsWith('Tamir Ediliyor') && item.status !== 'Tamir Ediliyor') return false;
      if (filterStatus.startsWith('Hazır') && item.status !== 'Teslime Hazır') return false;
      if (filterStatus.startsWith('Teslim Edildi') && item.status !== 'Teslim Edildi') return false;

      // Dropdown filters
      if (selectedBranch !== 'Tüm Şubeler' && item.branch !== selectedBranch) return false;
      if (selectedStatusDropdown !== 'Tüm Durumlar' && item.status !== selectedStatusDropdown) return false;
      if (selectedDeviceType !== 'Tüm Cihaz Türleri' && item.deviceType !== selectedDeviceType) return false;
      if (selectedWarranty !== 'Tüm Garanti Durumları' && item.warrantyStatus !== selectedWarranty) return false;

      // Search query
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchesPatient = item.patientName.toLowerCase().includes(q) || item.patientPhone.includes(q);
        const matchesDevice = item.deviceName.toLowerCase().includes(q) || item.serialNo.toLowerCase().includes(q) || item.barcode.toLowerCase().includes(q);
        const matchesProblem = item.problem.toLowerCase().includes(q);
        if (!matchesPatient && !matchesDevice && !matchesProblem) return false;
      }

      return true;
    });
  }, [records, filterStatus, selectedBranch, selectedStatusDropdown, selectedDeviceType, selectedWarranty, searchTerm, matches]);

  // Toggle selection
  const handleToggleRow = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedRowIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedRowIds.length === filteredRecords.length) {
      setSelectedRowIds([]);
    } else {
      setSelectedRowIds(filteredRecords.map(r => r.id));
    }
  };

  // Row click opens drawer
  const handleRowClick = (item: ServiceItem) => {
    setSelectedItem(item);
    if (!selectedRowIds.includes(item.id)) {
      setSelectedRowIds([item.id]);
    }
  };

  // Status badge class
  const getStatusBadgeClass = (status: ServiceItem['status']) => {
    switch (status) {
      case 'Alındı': return styles.badgeAlindi;
      case 'İnceleniyor': return styles.badgeInceleniyor;
      case 'Tamir Ediliyor': return styles.badgeTamirEdiliyor;
      case 'Teslime Hazır': return styles.badgeTeslimeHazir;
      case 'Garanti': return styles.badgeGaranti;
      case 'Teslim Edildi': return styles.badgeTeslimEdildi;
      default: return styles.badgeAlindi;
    }
  };

  // Handle Save Status Update
  const handleSaveStatusUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;
    const updated = records.map(r => {
      if (r.id === selectedItem.id) {
        const history = r.history || [];
        return {
          ...r,
          status: statusUpdateVal,
          history: [
            {
              title: `Durum güncellendi: ${statusUpdateVal}`,
              date: new Date().toLocaleDateString('tr-TR') + ' ' + new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
              user: 'Ahmet Yılmaz',
              note: statusUpdateNote || 'Durum değişikliği yapıldı.'
            },
            ...history
          ]
        };
      }
      return r;
    });
    setRecords(updated);
    const refreshed = updated.find(r => r.id === selectedItem.id);
    if (refreshed) setSelectedItem(refreshed);
    setShowStatusModal(false);
    setStatusUpdateNote('');

    if (statusUpdateVal === 'Teslim Edildi') {
      const totalServiceCost = (selectedItem.operations || []).reduce((acc, op) => acc + (op.cost || 0), 0);
      try {
        await completeServiceTicket(selectedItem.id, selectedItem.patientName, totalServiceCost);
      } catch {
        // Fallback silently if offline
      }
      addToast({ type: 'success', message: `Servis cihazı teslim edildi, ₺${totalServiceCost.toLocaleString('tr-TR')} servis bedeli kasaya işlendi.` });
    } else {
      addToast({ type: 'success', message: `Servis durumu "${statusUpdateVal}" olarak güncellendi.` });
    }
  };

  // Handle Add Part
  const handleAddPart = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem || !newPartDesc) return;
    const cost = parseFloat(newPartCost) || 0;
    const updated = records.map(r => {
      if (r.id === selectedItem.id) {
        const ops = r.operations || [];
        return {
          ...r,
          operations: [
            ...ops,
            {
              description: newPartDesc,
              cost,
              date: new Date().toLocaleDateString('tr-TR')
            }
          ]
        };
      }
      return r;
    });
    setRecords(updated);
    const refreshed = updated.find(r => r.id === selectedItem.id);
    if (refreshed) setSelectedItem(refreshed);
    setShowAddPartModal(false);
    setNewPartDesc('');
    setNewPartCost('0');
    addToast({ type: 'success', message: 'İşlem/Parça başarıyla kaydedildi.' });
  };

  // Handle Add New Record
  const handleCreateRecord = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRecordForm.patientName || !newRecordForm.deviceName) {
      addToast({ type: 'error', message: 'Lütfen hasta adı ve cihaz bilgisini girin.' });
      return;
    }

    const initials = newRecordForm.patientName
      .split(' ')
      .map(w => w[0])
      .join('')
      .toUpperCase()
      .substring(0, 2) || 'YK';

    const newId = `srv-${Date.now()}`;
    const today = new Date().toLocaleDateString('tr-TR');

    const newItem: ServiceItem = {
      id: newId,
      patientName: newRecordForm.patientName,
      patientPhone: newRecordForm.patientPhone || '05XX XXX XX XX',
      patientInitials: initials,
      avatarColor: '#0d9488',
      deviceName: newRecordForm.deviceName,
      earSide: newRecordForm.earSide,
      serialNo: newRecordForm.serialNo || 'SN-' + Math.floor(1000000000 + Math.random() * 9000000000),
      barcode: newRecordForm.barcode || 'BC-' + Math.floor(100 + Math.random() * 900),
      problem: newRecordForm.problem || 'Genel kontrol ve bakım',
      receivedDate: today,
      estimatedDeliveryDate: new Date(Date.now() + 3 * 86400000).toLocaleDateString('tr-TR'),
      status: 'Alındı',
      warrantyStatus: newRecordForm.warrantyStatus,
      deviceType: newRecordForm.deviceType,
      notes: newRecordForm.notes,
      technician: 'Teknik Servis',
      branch: 'Merkez Şube',
      operations: [],
      files: [],
      history: [
        {
          title: 'Yeni Servis Kaydı Açıldı',
          date: today,
          user: 'Ahmet Yılmaz',
          note: newRecordForm.notes || 'Cihaz teslim alındı.'
        }
      ]
    };

    setRecords([newItem, ...records]);
    setSelectedItem(newItem);
    setSelectedRowIds([newItem.id]);
    setShowNewRecordModal(false);
    setNewRecordForm({
      patientName: '',
      patientPhone: '',
      deviceName: '',
      earSide: 'Sol kulak',
      serialNo: '',
      barcode: '',
      problem: '',
      warrantyStatus: 'Garanti Kapsamında',
      deviceType: 'Kulak arkası',
      notes: '',
      estimatedDays: '3'
    });
    addToast({ type: 'success', message: 'Yeni teknik servis kaydı oluşturuldu.' });
  };

  return (
    <div className={styles.servicePage}>
      {/* ── Breadcrumb ── */}
      <div className={styles.breadcrumb}>
        <span>Teknik Servis</span>
        <span>&gt;</span>
        <span style={{ color: '#334155', fontWeight: 500 }}>Servis Takibi</span>
      </div>

      {/* ── Page Heading ── */}
      <div className={styles.pageHeading}>
        <div className={styles.headingCopy}>
          <div className={styles.headingIcon}>
            {/* Wrench icon */}
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
            </svg>
          </div>
          <div>
            <h1>Teknik Servis</h1>
            <p>Cihaz tamir, bakım ve servis süreçlerinizi tek ekranda yönetin.</p>
          </div>
        </div>

        <div className={styles.headerActions}>
          <button
            type="button"
            className={styles.btnSecondaryAction}
            onClick={() => setShowReportModal(true)}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
              <polyline points="10 9 9 9 8 9"></polyline>
            </svg>
            Servis Raporu
          </button>

          <button
            type="button"
            className={styles.btnPrimaryAction}
            onClick={() => setShowNewRecordModal(true)}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            Yeni Servis Kaydı
          </button>
        </div>
      </div>

      {/* ── 4 Stat Cards ── */}
      <div className={styles.statsGrid}>
        {/* Card 1 */}
        <div className={styles.statCard}>
          <div className={`${styles.statIconBox} ${styles.statIconBoxOrange}`}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
            </svg>
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statLabel}>Serviste Bekleyen</span>
            <span className={styles.statValue}>4</span>
            <div className={styles.statTrend}>
              <span className={styles.trendUpRed}>↑ %33</span>
              <span className={styles.trendMuted}>geçen aya göre</span>
            </div>
          </div>
        </div>

        {/* Card 2 */}
        <div className={styles.statCard}>
          <div className={`${styles.statIconBox} ${styles.statIconBoxGreen}`}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statLabel}>Teslime Hazır</span>
            <span className={styles.statValue}>2</span>
            <div className={styles.statTrend}>
              <span className={styles.trendUpRed}>↑ %100</span>
              <span className={styles.trendMuted}>geçen aya göre</span>
            </div>
          </div>
        </div>

        {/* Card 3 */}
        <div className={styles.statCard}>
          <div className={`${styles.statIconBox} ${styles.statIconBoxBlue}`}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="5" width="20" height="14" rx="2"></rect>
              <line x1="2" y1="10" x2="22" y2="10"></line>
            </svg>
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statLabel}>Toplam Servis Geliri</span>
            <span className={styles.statValue}>₺8.750</span>
            <div className={styles.statTrend}>
              <span className={styles.trendUpGreen}>↑ %25</span>
              <span className={styles.trendMuted}>bu ay</span>
            </div>
          </div>
        </div>

        {/* Card 4 */}
        <div className={styles.statCard}>
          <div className={`${styles.statIconBox} ${styles.statIconBoxPurple}`}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
              <polyline points="9 12 11 14 15 10"></polyline>
            </svg>
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statLabel}>Garanti Kapsamında</span>
            <span className={styles.statValue}>3</span>
            <div className={styles.statTrend}>
              <span className={styles.trendMuted}>Toplamın %27'si</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Filter Pills & Quick Search Row ── */}
      <div className={styles.filterPillsRow}>
        <div className={styles.pillsList}>
          {[
            { label: `Tümü (${pillCounts.all})`, key: 'Tümü' },
            { label: `Alındı (${pillCounts.alindi})`, key: 'Alındı' },
            { label: `İnceleniyor (${pillCounts.inceleniyor})`, key: 'İnceleniyor' },
            { label: `Tamir Ediliyor (${pillCounts.tamir})`, key: 'Tamir Ediliyor' },
            { label: `Hazır (${pillCounts.hazir})`, key: 'Hazır' },
            { label: `Teslim Edildi (${pillCounts.teslim})`, key: 'Teslim Edildi' }
          ].map(pill => {
            const isActive = filterStatus.startsWith(pill.key);
            return (
              <button
                key={pill.key}
                type="button"
                className={`${styles.pillBtn} ${isActive ? styles.pillBtnActive : ''}`}
                onClick={() => setFilterStatus(pill.label)}
              >
                {pill.label}
              </button>
            );
          })}
        </div>

        <div className={styles.quickSearchActions}>
          <div className={styles.searchInputWrapper}>
            <svg className={styles.searchIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <input
              type="text"
              placeholder="Hasta adı, cihaz, seri no ile ara..."
              className={styles.searchInput}
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>

          <button
            type="button"
            className={styles.btnFilterOutline}
            onClick={() => addToast({ type: 'info', message: 'Filtreler uygulandı.' })}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
            </svg>
            Filtrele
          </button>

          <button
            type="button"
            className={styles.btnClearOutline}
            onClick={() => {
              setSearchTerm('');
              setFilterStatus('Tümü (15)');
              setSelectedBranch('Tüm Şubeler');
              setSelectedStatusDropdown('Tüm Durumlar');
              setSelectedDeviceType('Tüm Cihaz Türleri');
              setSelectedWarranty('Tüm Garanti Durumları');
              addToast({ type: 'info', message: 'Filtreler sıfırlandı.' });
            }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="1 4 1 10 7 10"></polyline>
              <polyline points="23 20 23 14 17 14"></polyline>
              <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"></path>
            </svg>
            Temizle
          </button>
        </div>
      </div>

      {/* ── Secondary Filter Row ── */}
      <div className={styles.secondaryFilterBar}>
        <div className={styles.dateFilterBox}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="16" y1="2" x2="16" y2="6"></line>
            <line x1="8" y1="2" x2="8" y2="6"></line>
            <line x1="3" y1="10" x2="21" y2="10"></line>
          </svg>
          <span>01.09.2026 - 30.09.2026</span>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2">
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </div>

        <select
          className={styles.filterSelect}
          value={selectedBranch}
          onChange={e => setSelectedBranch(e.target.value)}
        >
          <option value="Tüm Şubeler">Tüm Şubeler</option>
          <option value="Merkez Şube">Merkez Şube</option>
          <option value="Kadıköy Şube">Kadıköy Şube</option>
          <option value="Çankaya Şube">Çankaya Şube</option>
          <option value="Test Şube 1">Test Şube 1</option>
        </select>

        <select
          className={styles.filterSelect}
          value={selectedStatusDropdown}
          onChange={e => setSelectedStatusDropdown(e.target.value)}
        >
          <option value="Tüm Durumlar">Tüm Durumlar</option>
          <option value="Alındı">Alındı</option>
          <option value="İnceleniyor">İnceleniyor</option>
          <option value="Tamir Ediliyor">Tamir Ediliyor</option>
          <option value="Teslime Hazır">Teslime Hazır</option>
          <option value="Garanti">Garanti</option>
          <option value="Teslim Edildi">Teslim Edildi</option>
        </select>

        <select
          className={styles.filterSelect}
          value={selectedDeviceType}
          onChange={e => setSelectedDeviceType(e.target.value)}
        >
          <option value="Tüm Cihaz Türleri">Tüm Cihaz Türleri</option>
          <option value="Kulak arkası">Kulak arkası</option>
          <option value="RIC (Hoparlör Kulak İçi)">RIC (Hoparlör Kulak İçi)</option>
          <option value="Kulak içi (ITE)">Kulak içi (ITE)</option>
          <option value="Şarjlı Kulak Arkası">Şarjlı Kulak Arkası</option>
        </select>

        <select
          className={styles.filterSelect}
          value={selectedWarranty}
          onChange={e => setSelectedWarranty(e.target.value)}
        >
          <option value="Tüm Garanti Durumları">Tüm Garanti Durumları</option>
          <option value="Garanti Kapsamında">Garanti Kapsamında</option>
          <option value="Garanti Dışı">Garanti Dışı</option>
        </select>
      </div>

      {/* ── Main Layout: Table + Detail Drawer ── */}
      <div className={styles.mainLayoutContainer}>
        {/* Table Column */}
        <div className={`${styles.tableSection} ${selectedItem ? styles.tableSectionWithDrawer : ''}`}>
          <div className={styles.tableWrapper}>
            <table className={styles.serviceTable}>
              <thead>
                <tr>
                  <th style={{ width: 40, textAlign: 'center' }}>
                    <input
                      type="checkbox"
                      className={styles.checkboxInput}
                      checked={selectedRowIds.length === filteredRecords.length && filteredRecords.length > 0}
                      onChange={handleSelectAll}
                    />
                  </th>
                  <th>HASTA</th>
                  <th>CİHAZ</th>
                  <th>SERİ NO / BARKOD</th>
                  <th>ARIZA / SORUN</th>
                  <th>ALIM TARİHİ</th>
                  <th>TAHMİNİ TESLİM</th>
                  <th>DURUM</th>
                  <th style={{ textAlign: 'center' }}>İŞLEMLER</th>
                </tr>
              </thead>
              <tbody>
                {filteredRecords.length === 0 ? (
                  <tr>
                    <td colSpan={9} style={{ textAlign: 'center', padding: '40px 16px', color: '#64748b' }}>
                      Kriterlere uygun teknik servis kaydı bulunamadı.
                    </td>
                  </tr>
                ) : (
                  filteredRecords.map(item => {
                    const isSelected = selectedRowIds.includes(item.id);
                    const isCurrentDetail = selectedItem?.id === item.id;
                    return (
                      <tr
                        key={item.id}
                        className={`${styles.tableRow} ${isCurrentDetail ? styles.tableRowSelected : ''}`}
                        onClick={() => handleRowClick(item)}
                      >
                        <td style={{ textAlign: 'center' }} onClick={e => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            className={styles.checkboxInput}
                            checked={isSelected}
                            onChange={(e) => handleToggleRow(item.id, e as unknown as React.MouseEvent)}
                          />
                        </td>

                        <td>
                          <div className={styles.patientCell}>
                            <div
                              className={styles.patientAvatar}
                              style={{ background: item.avatarColor }}
                            >
                              {item.patientInitials}
                            </div>
                            <div className={styles.patientMeta}>
                              <span className={styles.patientName}>{item.patientName}</span>
                              <span className={styles.patientPhone}>{item.patientPhone}</span>
                            </div>
                          </div>
                        </td>

                        <td>
                          <div className={styles.deviceCell}>
                            <span className={styles.deviceName}>{item.deviceName}</span>
                            <span className={styles.deviceEar}>{item.earSide}</span>
                          </div>
                        </td>

                        <td>
                          <div className={styles.serialCell}>
                            <span className={styles.serialNo}>SN: {item.serialNo}</span>
                            <span className={styles.barcodeNo}>Barkod: {item.barcode}</span>
                          </div>
                        </td>

                        <td>
                          <div className={styles.problemCell} title={item.problem}>
                            {item.problem}
                          </div>
                        </td>

                        <td>
                          <span className={styles.dateCell}>{item.receivedDate}</span>
                        </td>

                        <td>
                          <span className={styles.dateCell}>{item.estimatedDeliveryDate}</span>
                        </td>

                        <td>
                          <span className={`${styles.badgeStatus} ${getStatusBadgeClass(item.status)}`}>
                            {item.status}
                          </span>
                        </td>

                        <td style={{ textAlign: 'center' }} onClick={e => e.stopPropagation()}>
                          <div className={styles.actionButtonsCell} style={{ justifyContent: 'center' }}>
                            <button
                              type="button"
                              className={styles.iconBtn}
                              title="Görüntüle"
                              onClick={() => setSelectedItem(item)}
                            >
                              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                <circle cx="12" cy="12" r="3"></circle>
                              </svg>
                            </button>

                            <button
                              type="button"
                              className={styles.iconBtn}
                              title="Düzenle"
                              onClick={() => {
                                setSelectedItem(item);
                                setShowEditModal(true);
                              }}
                            >
                              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
                              </svg>
                            </button>

                            <button
                              type="button"
                              className={styles.iconBtn}
                              title="Diğer İşlemler"
                              onClick={() => {
                                setSelectedItem(item);
                                setShowStatusModal(true);
                              }}
                            >
                              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="1"></circle>
                                <circle cx="12" cy="5" r="1"></circle>
                                <circle cx="12" cy="19" r="1"></circle>
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* ── Table Pagination Bar ── */}
          <div className={styles.paginationRow}>
            <div>
              Toplam {filteredRecords.length} kayıt |{' '}
              <span className={styles.selectedCount}>{selectedRowIds.length} kayıt seçili</span>
            </div>

            <div className={styles.pageControls}>
              <button type="button" className={styles.pageBtn} title="İlk Sayfa">«</button>
              <button type="button" className={styles.pageBtn} title="Önceki Sayfa">‹</button>
              <button type="button" className={`${styles.pageBtn} ${styles.pageBtnActive}`}>1</button>
              <button type="button" className={styles.pageBtn}>2</button>
              <button type="button" className={styles.pageBtn} title="Sonraki Sayfa">›</button>
              <button type="button" className={styles.pageBtn} title="Son Sayfa">»</button>

              <select className={styles.pageSizeSelect} defaultValue="10">
                <option value="10">10 / sayfa</option>
                <option value="25">25 / sayfa</option>
                <option value="50">50 / sayfa</option>
              </select>
            </div>
          </div>
        </div>

        {/* ── Right Detail Drawer ── */}
        {selectedItem && (
          <div className={styles.detailDrawer}>
            {/* Drawer Header */}
            <div className={styles.drawerHeader}>
              <div className={styles.drawerPatientInfo}>
                <div className={styles.drawerAvatar}>
                  {selectedItem.patientInitials}
                </div>
                <div className={styles.drawerTitleWrap}>
                  <h3>{selectedItem.patientName}</h3>
                  <p>{selectedItem.patientPhone}</p>
                </div>
              </div>

              <div className={styles.drawerHeaderRight}>
                <span className={`${styles.badgeStatus} ${getStatusBadgeClass(selectedItem.status)}`}>
                  ● {selectedItem.status}
                </span>
                <button
                  type="button"
                  className={styles.drawerCloseBtn}
                  onClick={() => setSelectedItem(null)}
                  title="Detayı Kapat"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Drawer Sub-Tabs */}
            <div className={styles.drawerTabs}>
              {(['Genel', 'İşlem Geçmişi', 'Parça & Maliyet', 'Dosyalar'] as const).map(tab => (
                <button
                  key={tab}
                  type="button"
                  className={`${styles.drawerTabBtn} ${drawerTab === tab ? styles.drawerTabBtnActive : ''}`}
                  onClick={() => setDrawerTab(tab)}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Drawer Content */}
            <div className={styles.drawerBody}>
              {drawerTab === 'Genel' && (
                <>
                  {/* Cihaz Bilgileri */}
                  <div className={styles.sectionBlock}>
                    <div className={styles.sectionHeaderRow}>
                      <span className={styles.sectionTitle}>Cihaz Bilgileri</span>
                      <button
                        type="button"
                        className={styles.btnEditMini}
                        onClick={() => setShowEditModal(true)}
                      >
                        Düzenle
                      </button>
                    </div>

                    <div className={styles.deviceVisualBox}>
                      <div className={styles.deviceIconPlaceholder}>
                        {/* Hearing Aid Ear Device SVG */}
                        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M6 8.5a6.5 6.5 0 1 1 13 0c0 3-1.5 5.5-3.5 7.5l-.5.5a3 3 0 0 0-1 2.2v.3a1 1 0 0 1-1 1h-2a1 1 0 0 1-1-1v-.8a4.5 4.5 0 0 1 1.3-3.2l.7-.7c1.5-1.5 2.5-3.3 2.5-5.8a4.5 4.5 0 1 0-9 0" />
                          <circle cx="10" cy="14" r="1" />
                        </svg>
                      </div>
                      <div className={styles.deviceVisualInfo}>
                        <h4>{selectedItem.deviceName}</h4>
                        <span>{selectedItem.earSide}</span>
                      </div>
                    </div>

                    <div className={styles.keyValueGrid}>
                      <div className={styles.keyValueRow}>
                        <span className={styles.keyLabel}>Seri No</span>
                        <span className={styles.keyVal} style={{ fontFamily: 'monospace' }}>{selectedItem.serialNo}</span>
                      </div>
                      <div className={styles.keyValueRow}>
                        <span className={styles.keyLabel}>Barkod</span>
                        <span className={styles.keyVal}>{selectedItem.barcode}</span>
                      </div>
                      <div className={styles.keyValueRow}>
                        <span className={styles.keyLabel}>Garanti Durumu</span>
                        <span className={selectedItem.warrantyStatus === 'Garanti Kapsamında' ? styles.badgeGarantiVar : styles.badgeGarantiDisi}>
                          {selectedItem.warrantyStatus}
                        </span>
                      </div>
                      <div className={styles.keyValueRow}>
                        <span className={styles.keyLabel}>Cihaz Türü</span>
                        <span className={styles.keyVal}>{selectedItem.deviceType}</span>
                      </div>
                      <div className={styles.keyValueRow}>
                        <span className={styles.keyLabel}>Alım Tarihi</span>
                        <span className={styles.keyVal}>{selectedItem.receivedDate}</span>
                      </div>
                    </div>
                  </div>

                  {/* Servis Bilgileri */}
                  <div className={styles.sectionBlock}>
                    <span className={styles.sectionTitle}>Servis Bilgileri</span>

                    <div className={styles.keyValueGrid}>
                      <div className={styles.keyValueRow}>
                        <span className={styles.keyLabel}>Arıza / Sorun</span>
                        <span className={styles.keyVal} style={{ fontWeight: 600 }}>{selectedItem.problem}</span>
                      </div>
                      <div className={styles.keyValueRow}>
                        <span className={styles.keyLabel}>Açıklama</span>
                        <span className={styles.keyVal}>{selectedItem.notes || '—'}</span>
                      </div>
                      <div className={styles.keyValueRow}>
                        <span className={styles.keyLabel}>Alım Tarihi</span>
                        <span className={styles.keyVal}>{selectedItem.receivedDate}</span>
                      </div>
                      <div className={styles.keyValueRow}>
                        <span className={styles.keyLabel}>Tahmini Teslim</span>
                        <span className={styles.keyVal}>{selectedItem.estimatedDeliveryDate}</span>
                      </div>
                      <div className={styles.keyValueRow}>
                        <span className={styles.keyLabel}>Sorumlu</span>
                        <span className={styles.keyVal}>{selectedItem.technician || 'Teknik Servis'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Hızlı İşlemler (2x2 Grid) */}
                  <div className={styles.sectionBlock}>
                    <span className={styles.sectionTitle}>Hızlı İşlemler</span>

                    <div className={styles.quickActionsGrid}>
                      <button
                        type="button"
                        className={styles.quickActionBtn}
                        onClick={() => {
                          setStatusUpdateVal(selectedItem.status);
                          setShowStatusModal(true);
                        }}
                      >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="23 4 23 10 17 10"></polyline>
                          <polyline points="1 20 1 14 7 14"></polyline>
                          <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
                        </svg>
                        Durum Güncelle
                      </button>

                      <button
                        type="button"
                        className={styles.quickActionBtn}
                        onClick={() => setShowAddPartModal(true)}
                      >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="12" cy="12" r="3"></circle>
                          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                        </svg>
                        Parça Ekle
                      </button>

                      <button
                        type="button"
                        className={styles.quickActionBtn}
                        onClick={() => setShowAddFileModal(true)}
                      >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path>
                        </svg>
                        Dosya Ekle
                      </button>

                      <button
                        type="button"
                        className={styles.quickActionBtn}
                        onClick={() => setShowPrintModal(true)}
                      >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="6 9 6 2 18 2 18 9"></polyline>
                          <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
                          <rect x="6" y="14" width="12" height="8"></rect>
                        </svg>
                        Servis Formu Yazdır
                      </button>
                    </div>
                  </div>
                </>
              )}

              {drawerTab === 'İşlem Geçmişi' && (
                <div className={styles.sectionBlock}>
                  <span className={styles.sectionTitle}>Servis Zaman Çizelgesi</span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 6 }}>
                    {(selectedItem.history && selectedItem.history.length > 0) ? (
                      selectedItem.history.map((hist, idx) => (
                        <div key={idx} style={{ borderLeft: '2px solid #0d9488', paddingLeft: 12, position: 'relative' }}>
                          <div style={{ fontWeight: 600, fontSize: 13, color: '#0f172a' }}>{hist.title}</div>
                          <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{hist.date} • {hist.user}</div>
                          <div style={{ fontSize: 12, color: '#334155', marginTop: 4 }}>{hist.note}</div>
                        </div>
                      ))
                    ) : (
                      <p style={{ color: '#64748b', fontSize: 12 }}>Henüz geçmiş kaydı bulunmuyor.</p>
                    )}
                  </div>
                </div>
              )}

              {drawerTab === 'Parça & Maliyet' && (
                <div className={styles.sectionBlock}>
                  <div className={styles.sectionHeaderRow}>
                    <span className={styles.sectionTitle}>Kullanılan Parçalar ve Ücretler</span>
                    <button
                      type="button"
                      className={styles.btnEditMini}
                      onClick={() => setShowAddPartModal(true)}
                    >
                      + Ekle
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 6 }}>
                    {(selectedItem.operations && selectedItem.operations.length > 0) ? (
                      selectedItem.operations.map((op, idx) => (
                        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 10px', background: '#f8fafc', borderRadius: 6, fontSize: 12 }}>
                          <div>
                            <div style={{ fontWeight: 600, color: '#1e293b' }}>{op.description}</div>
                            <div style={{ fontSize: 10, color: '#64748b' }}>{op.date}</div>
                          </div>
                          <div style={{ fontWeight: 700, color: op.cost > 0 ? '#0f766e' : '#16a34a' }}>
                            {op.cost > 0 ? formatCurrency(op.cost) : 'Ücretsiz'}
                          </div>
                        </div>
                      ))
                    ) : (
                      <p style={{ color: '#64748b', fontSize: 12 }}>Henüz parça veya işlem eklenmedi.</p>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #e2e8f0', paddingTop: 10, marginTop: 6, fontWeight: 700, fontSize: 13 }}>
                      <span>Toplam Tutar:</span>
                      <span style={{ color: '#0d9488' }}>
                        {formatCurrency((selectedItem.operations || []).reduce((acc, o) => acc + o.cost, 0))}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {drawerTab === 'Dosyalar' && (
                <div className={styles.sectionBlock}>
                  <div className={styles.sectionHeaderRow}>
                    <span className={styles.sectionTitle}>Ekli Dosyalar & Belgeler</span>
                    <button
                      type="button"
                      className={styles.btnEditMini}
                      onClick={() => setShowAddFileModal(true)}
                    >
                      + Yükle
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 6 }}>
                    {(selectedItem.files && selectedItem.files.length > 0) ? (
                      selectedItem.files.map((file, idx) => (
                        <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 10px', background: '#f8fafc', borderRadius: 6, fontSize: 12 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2">
                              <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path>
                              <polyline points="13 2 13 9 20 9"></polyline>
                            </svg>
                            <div>
                              <div style={{ fontWeight: 600, color: '#1e293b' }}>{file.name}</div>
                              <div style={{ fontSize: 10, color: '#64748b' }}>{file.size} • {file.date}</div>
                            </div>
                          </div>
                          <button
                            type="button"
                            className={styles.iconBtn}
                            onClick={() => addToast({ type: 'info', message: `${file.name} indiriliyor...` })}
                          >
                            ↓
                          </button>
                        </div>
                      ))
                    ) : (
                      <p style={{ color: '#64748b', fontSize: 12 }}>Ekli dosya bulunmuyor.</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── MODAL 1: Durum Güncelle ── */}
      {showStatusModal && selectedItem && (
        <div className={styles.modalOverlay} onClick={() => setShowStatusModal(false)}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>🔄 Servis Durumu Güncelle — {selectedItem.patientName}</h2>
              <button type="button" className={styles.modalCloseBtn} onClick={() => setShowStatusModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSaveStatusUpdate}>
              <div className={styles.modalBody}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Yeni Durum Seçin</label>
                  <select
                    className={styles.formSelect}
                    value={statusUpdateVal}
                    onChange={e => setStatusUpdateVal(e.target.value as ServiceItem['status'])}
                  >
                    <option value="Alındı">Alındı</option>
                    <option value="İnceleniyor">İnceleniyor</option>
                    <option value="Tamir Ediliyor">Tamir Ediliyor</option>
                    <option value="Teslime Hazır">Teslime Hazır</option>
                    <option value="Garanti">Garanti</option>
                    <option value="Teslim Edildi">Teslim Edildi</option>
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>İşlem / Teknisyen Notu</label>
                  <textarea
                    rows={3}
                    className={styles.formTextarea}
                    placeholder="Durum değişikliği ile ilgili açıklama yazın..."
                    value={statusUpdateNote}
                    onChange={e => setStatusUpdateNote(e.target.value)}
                  />
                </div>
              </div>
              <div className={styles.modalFooter}>
                <button type="button" className={styles.btnSecondaryAction} onClick={() => setShowStatusModal(false)}>İptal</button>
                <button type="submit" className={styles.btnPrimaryAction}>Güncellemeyi Kaydet</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL 2: Parça & İşlem Ekle ── */}
      {showAddPartModal && selectedItem && (
        <div className={styles.modalOverlay} onClick={() => setShowAddPartModal(false)}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>⚙️ Parça veya İşlem Ekle — {selectedItem.deviceName}</h2>
              <button type="button" className={styles.modalCloseBtn} onClick={() => setShowAddPartModal(false)}>✕</button>
            </div>
            <form onSubmit={handleAddPart}>
              <div className={styles.modalBody}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>İşlem / Parça Adı</label>
                  <input
                    type="text"
                    required
                    className={styles.formInput}
                    placeholder="Örn: Mikrofon filtresi değişimi"
                    value={newPartDesc}
                    onChange={e => setNewPartDesc(e.target.value)}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Ücret (TL) — Garanti kapsamında ise 0 yazabilirsiniz</label>
                  <input
                    type="number"
                    min="0"
                    step="50"
                    className={styles.formInput}
                    value={newPartCost}
                    onChange={e => setNewPartCost(e.target.value)}
                  />
                </div>
              </div>
              <div className={styles.modalFooter}>
                <button type="button" className={styles.btnSecondaryAction} onClick={() => setShowAddPartModal(false)}>İptal</button>
                <button type="submit" className={styles.btnPrimaryAction}>Parçayı Ekle</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL 3: Dosya Ekle ── */}
      {showAddFileModal && selectedItem && (
        <div className={styles.modalOverlay} onClick={() => setShowAddFileModal(false)}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>📎 Dosya & Belge Ekle</h2>
              <button type="button" className={styles.modalCloseBtn} onClick={() => setShowAddFileModal(false)}>✕</button>
            </div>
            <div className={styles.modalBody}>
              <div style={{ border: '2px dashed #cbd5e1', borderRadius: 12, padding: 30, textAlign: 'center', background: '#f8fafc' }}>
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="1.8" style={{ margin: '0 auto 10px' }}>
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="17 8 12 3 7 8"></polyline>
                  <line x1="12" y1="3" x2="12" y2="15"></line>
                </svg>
                <div style={{ fontWeight: 600, fontSize: 14, color: '#1e293b' }}>Belge veya fotoğrafı buraya sürükleyin</div>
                <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>PNG, JPG, PDF (maks 10MB)</div>
                <button
                  type="button"
                  className={styles.btnSecondaryAction}
                  style={{ marginTop: 14 }}
                  onClick={() => {
                    const newFile = {
                      name: 'Cihaz_Durum_Raporu.pdf',
                      size: '1.2 MB',
                      date: new Date().toLocaleDateString('tr-TR')
                    };
                    const updated = records.map(r => r.id === selectedItem.id ? { ...r, files: [...(r.files || []), newFile] } : r);
                    setRecords(updated);
                    setSelectedItem(updated.find(r => r.id === selectedItem.id) || null);
                    setShowAddFileModal(false);
                    addToast({ type: 'success', message: 'Dosya başarıyla yüklendi.' });
                  }}
                >
                  Dosya Seçin
                </button>
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button type="button" className={styles.btnSecondaryAction} onClick={() => setShowAddFileModal(false)}>Kapat</button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL 4: Servis Formu Yazdır ── */}
      {showPrintModal && selectedItem && (
        <div className={styles.modalOverlay} onClick={() => setShowPrintModal(false)}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()} style={{ maxWidth: 540 }}>
            <div className={styles.modalHeader}>
              <h2>🖨️ Servis Kabul & Teslim Formu</h2>
              <button type="button" className={styles.modalCloseBtn} onClick={() => setShowPrintModal(false)}>✕</button>
            </div>
            <div className={styles.modalBody}>
              <div style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: 18, background: '#ffffff', fontFamily: 'sans-serif' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #004d40', paddingBottom: 10, marginBottom: 14 }}>
                  <div>
                    <h3 style={{ margin: 0, color: '#004d40', fontSize: 16 }}>İŞİTME MERKEZİ TEKNİK SERVİS</h3>
                    <p style={{ margin: '2px 0 0', fontSize: 11, color: '#64748b' }}>Servis Takip Fişi: #{selectedItem.barcode}</p>
                  </div>
                  <div style={{ textAlign: 'right', fontSize: 11, color: '#64748b' }}>
                    Tarih: {selectedItem.receivedDate}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, fontSize: 12, marginBottom: 14 }}>
                  <div><strong>Hasta:</strong> {selectedItem.patientName}</div>
                  <div><strong>Telefon:</strong> {selectedItem.patientPhone}</div>
                  <div><strong>Cihaz:</strong> {selectedItem.deviceName} ({selectedItem.earSide})</div>
                  <div><strong>Seri No:</strong> {selectedItem.serialNo}</div>
                  <div><strong>Garanti:</strong> {selectedItem.warrantyStatus}</div>
                  <div><strong>Tahmini Teslim:</strong> {selectedItem.estimatedDeliveryDate}</div>
                </div>

                <div style={{ background: '#f8fafc', padding: 10, borderRadius: 6, fontSize: 12, marginBottom: 14 }}>
                  <strong>Bildirilen Arıza / Sorun:</strong>
                  <div style={{ marginTop: 4, color: '#334155' }}>{selectedItem.problem}</div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 30, fontSize: 11, color: '#64748b', textAlign: 'center' }}>
                  <div style={{ width: 140, borderTop: '1px solid #cbd5e1', paddingTop: 4 }}>Teslim Eden (Hasta/Yakını)</div>
                  <div style={{ width: 140, borderTop: '1px solid #cbd5e1', paddingTop: 4 }}>Teslim Alan (Teknisyen)</div>
                </div>
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button type="button" className={styles.btnSecondaryAction} onClick={() => setShowPrintModal(false)}>Kapat</button>
              <button
                type="button"
                className={styles.btnPrimaryAction}
                onClick={() => {
                  window.print();
                  setShowPrintModal(false);
                }}
              >
                Yazdır / PDF İndir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL 5: Servis Raporu ── */}
      {showReportModal && (
        <div className={styles.modalOverlay} onClick={() => setShowReportModal(false)}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>📊 Aylık Servis Faaliyet Raporu</h2>
              <button type="button" className={styles.modalCloseBtn} onClick={() => setShowReportModal(false)}>✕</button>
            </div>
            <div className={styles.modalBody}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
                <div style={{ background: '#f8fafc', padding: 14, borderRadius: 10 }}>
                  <div style={{ fontSize: 12, color: '#64748b' }}>Toplam Kayıt</div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: '#0f172a' }}>{records.length} adet</div>
                </div>
                <div style={{ background: '#f0fdf4', padding: 14, borderRadius: 10 }}>
                  <div style={{ fontSize: 12, color: '#16a34a' }}>Başarı ile Teslim Edilen</div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: '#16a34a' }}>{records.filter(r => r.status === 'Teslim Edildi').length} adet</div>
                </div>
                <div style={{ background: '#eff6ff', padding: 14, borderRadius: 10 }}>
                  <div style={{ fontSize: 12, color: '#2563eb' }}>Garanti Kapsamı Oranı</div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: '#2563eb' }}>%27</div>
                </div>
                <div style={{ background: '#fef3c7', padding: 14, borderRadius: 10 }}>
                  <div style={{ fontSize: 12, color: '#b45309' }}>Ortalama Onarım Süresi</div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: '#b45309' }}>2.4 Gün</div>
                </div>
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button type="button" className={styles.btnSecondaryAction} onClick={() => setShowReportModal(false)}>Kapat</button>
              <button
                type="button"
                className={styles.btnPrimaryAction}
                onClick={() => {
                  addToast({ type: 'success', message: 'Rapor PDF formatında dışa aktarıldı.' });
                  setShowReportModal(false);
                }}
              >
                Raporu Dışa Aktar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL 6: Yeni Servis Kaydı ── */}
      {showNewRecordModal && (
        <div className={styles.modalOverlay} onClick={() => setShowNewRecordModal(false)}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>➕ Yeni Teknik Servis Kaydı</h2>
              <button type="button" className={styles.modalCloseBtn} onClick={() => setShowNewRecordModal(false)}>✕</button>
            </div>
            <form onSubmit={handleCreateRecord}>
              <div className={styles.modalBody}>
                <div className={styles.formGrid2}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Hasta Adı Soyadı *</label>
                    <input
                      type="text"
                      required
                      placeholder="Örn: Ahmet Can"
                      className={styles.formInput}
                      value={newRecordForm.patientName}
                      onChange={e => setNewRecordForm({ ...newRecordForm, patientName: e.target.value })}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Hasta Telefon</label>
                    <input
                      type="text"
                      placeholder="05XX XXX XX XX"
                      className={styles.formInput}
                      value={newRecordForm.patientPhone}
                      onChange={e => setNewRecordForm({ ...newRecordForm, patientPhone: e.target.value })}
                    />
                  </div>
                </div>

                <div className={styles.formGrid2}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Cihaz Modeli *</label>
                    <input
                      type="text"
                      required
                      placeholder="Örn: Oticon Real 1"
                      className={styles.formInput}
                      value={newRecordForm.deviceName}
                      onChange={e => setNewRecordForm({ ...newRecordForm, deviceName: e.target.value })}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Kulak Yönü</label>
                    <select
                      className={styles.formSelect}
                      value={newRecordForm.earSide}
                      onChange={e => setNewRecordForm({ ...newRecordForm, earSide: e.target.value as ServiceItem['earSide'] })}
                    >
                      <option value="Sol kulak">Sol kulak</option>
                      <option value="Sağ kulak">Sağ kulak</option>
                      <option value="Binaural">Binaural (Çift)</option>
                    </select>
                  </div>
                </div>

                <div className={styles.formGrid2}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Seri No</label>
                    <input
                      type="text"
                      placeholder="Örn: 1234567890"
                      className={styles.formInput}
                      value={newRecordForm.serialNo}
                      onChange={e => setNewRecordForm({ ...newRecordForm, serialNo: e.target.value })}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Barkod No</label>
                    <input
                      type="text"
                      placeholder="Örn: OT-001"
                      className={styles.formInput}
                      value={newRecordForm.barcode}
                      onChange={e => setNewRecordForm({ ...newRecordForm, barcode: e.target.value })}
                    />
                  </div>
                </div>

                <div className={styles.formGrid2}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Garanti Durumu</label>
                    <select
                      className={styles.formSelect}
                      value={newRecordForm.warrantyStatus}
                      onChange={e => setNewRecordForm({ ...newRecordForm, warrantyStatus: e.target.value as ServiceItem['warrantyStatus'] })}
                    >
                      <option value="Garanti Kapsamında">Garanti Kapsamında</option>
                      <option value="Garanti Dışı">Garanti Dışı</option>
                    </select>
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Cihaz Türü</label>
                    <select
                      className={styles.formSelect}
                      value={newRecordForm.deviceType}
                      onChange={e => setNewRecordForm({ ...newRecordForm, deviceType: e.target.value })}
                    >
                      <option value="Kulak arkası">Kulak arkası</option>
                      <option value="RIC (Hoparlör Kulak İçi)">RIC (Hoparlör Kulak İçi)</option>
                      <option value="Kulak içi (ITE)">Kulak içi (ITE)</option>
                      <option value="Şarjlı Kulak Arkası">Şarjlı Kulak Arkası</option>
                    </select>
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Arıza / Sorun Tanımı *</label>
                  <input
                    type="text"
                    required
                    placeholder="Örn: Ses kesilmesi, cızırtı, cihaz açılmıyor..."
                    className={styles.formInput}
                    value={newRecordForm.problem}
                    onChange={e => setNewRecordForm({ ...newRecordForm, problem: e.target.value })}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Ek Açıklama & Notlar</label>
                  <textarea
                    rows={2}
                    placeholder="Müşterinin belirttiği ek detaylar..."
                    className={styles.formTextarea}
                    value={newRecordForm.notes}
                    onChange={e => setNewRecordForm({ ...newRecordForm, notes: e.target.value })}
                  />
                </div>
              </div>
              <div className={styles.modalFooter}>
                <button type="button" className={styles.btnSecondaryAction} onClick={() => setShowNewRecordModal(false)}>İptal</button>
                <button type="submit" className={styles.btnPrimaryAction}>Servis Kaydını Aç</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL 7: Düzenle ── */}
      {showEditModal && selectedItem && (
        <div className={styles.modalOverlay} onClick={() => setShowEditModal(false)}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>✏️ Cihaz & Servis Bilgilerini Düzenle</h2>
              <button type="button" className={styles.modalCloseBtn} onClick={() => setShowEditModal(false)}>✕</button>
            </div>
            <form onSubmit={e => {
              e.preventDefault();
              setShowEditModal(false);
              addToast({ type: 'success', message: 'Kayıt bilgileri başarıyla güncellendi.' });
            }}>
              <div className={styles.modalBody}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Cihaz Modeli</label>
                  <input
                    type="text"
                    className={styles.formInput}
                    defaultValue={selectedItem.deviceName}
                    onChange={e => setSelectedItem({ ...selectedItem, deviceName: e.target.value })}
                  />
                </div>
                <div className={styles.formGrid2}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Seri No</label>
                    <input
                      type="text"
                      className={styles.formInput}
                      defaultValue={selectedItem.serialNo}
                      onChange={e => setSelectedItem({ ...selectedItem, serialNo: e.target.value })}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Barkod</label>
                    <input
                      type="text"
                      className={styles.formInput}
                      defaultValue={selectedItem.barcode}
                      onChange={e => setSelectedItem({ ...selectedItem, barcode: e.target.value })}
                    />
                  </div>
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Arıza / Sorun</label>
                  <input
                    type="text"
                    className={styles.formInput}
                    defaultValue={selectedItem.problem}
                    onChange={e => setSelectedItem({ ...selectedItem, problem: e.target.value })}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Ek Not</label>
                  <textarea
                    rows={2}
                    className={styles.formTextarea}
                    defaultValue={selectedItem.notes || ''}
                    onChange={e => setSelectedItem({ ...selectedItem, notes: e.target.value })}
                  />
                </div>
              </div>
              <div className={styles.modalFooter}>
                <button type="button" className={styles.btnSecondaryAction} onClick={() => setShowEditModal(false)}>İptal</button>
                <button type="submit" className={styles.btnPrimaryAction}>Kaydet</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
