// Mock data for the hearing center management app

export interface Patient {
  id: string;
  tc: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  birthDate: string;
  gender: 'Erkek' | 'Kadın';
  address: string;
  hearingLoss: 'Hafif' | 'Orta' | 'İleri' | 'Çok İleri';
  hearingLossSide: 'Sol' | 'Sağ' | 'Her İki Kulak';
  currentDevice?: string | null;
  deviceDate?: string | null;
  sgkStatus?: 'Aktif' | 'Pasif' | 'Yenileme Hakkı Var';
  sgkRenewalDate?: string | null;
  notes?: string;
  createdAt?: string;
  lastVisit?: string;
  audiogramLeft?: number[];
  audiogramRight?: number[];
  pastAudiogramLeft?: number[];
  pastAudiogramRight?: number[];
  batterySize?: '10' | '312' | '13' | '675';
  dailyUsageHours?: number;
  lastBatteryPurchaseDate?: string;
  batteryPackCount?: number;

  // CRM Yeni Alanları
  source?: 'Doktor' | 'Sosyal Medya' | 'Tavsiye' | 'Yürüyerek' | 'Web';
  salesStage?: 'İlk Görüşme' | 'Test Yapıldı' | 'Cihaz Denendi' | 'Teklif Verildi' | 'Satış Yapıldı' | 'Kaybedildi';
  doctorName?: string;
  prescriptionStatus?: 'Yok' | 'Reçete Yazıldı' | 'SGK Onaylı';
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  emergencyContactRelation?: string;
  nextAction?: string;
  timeline?: { date: string; action: string; icon: string }[];
  prescriptionNo?: string;
  reportNo?: string;
  sgkInsuranceStatus?: 'Belirtilmemiş' | 'Çalışan (sigortalı)' | 'Emekli' | 'Diğer / Kapsam dışı';
  patientStatus?: 'Potansiyel' | 'Deneme Yapıldı' | 'Müşteri' | 'Satın Almayanlar' | 'Genel' | 'Tamir için gelen' | 'Kalıp Hastası' | 'Pil Hastası';
}

export interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  date: string;
  time: string;
  type: 'İşitme Testi' | 'Cihaz Denemesi' | 'Kontrol' | 'SGK Yenileme' | 'Kalıp Alma' | 'Pil Değişimi';
  audiologist: string;
  status: 'Bekliyor' | 'Geldi' | 'Gelmedi' | 'İptal' | 'Hatırlatıldı';
  branch: string;
  notes: string;
}

export interface StockItem {
  id: string;
  name: string;
  category: 'Cihaz' | 'Pil' | 'Kalıp' | 'Aksesuar';
  brand: string;
  model: string;
  serialNo: string;
  quantity: number;
  criticalLevel: number;
  price: number;
  sgkPrice: number;
  warrantyExpiry: string;
  location: string;
  
  // ÜTS ve Satış Ayrımı Yeni Alanları
  status: 'Stokta' | 'Hastaya Ayrıldı' | 'Satıldı' | 'Serviste';
  utsStatus: 'Bekliyor' | 'Bildirildi' | 'Hata' | 'Gerekli Değil';
  assignedPatientId?: string;
  assignedPatientName?: string;
  branch: 'Merkez 1 - Kadıköy' | 'Merkez 2 - Beşiktaş';
  utsKurumNo?: string;
  gln?: string;
  mersisNo?: string;
}

export interface SaleRecord {
  id: string;
  patientId: string;
  patientName: string;
  date: string;
  items: { name: string; quantity: number; price: number; type?: 'Cihaz' | 'Pil' | 'Servis Geliri' | 'Aksesuar' }[];
  total: number;
  sgkAmount: number;
  patientAmount: number;
  paymentMethod: 'Nakit' | 'Kredi Kartı' | 'Havale' | 'Taksit';
  status: 'Tahsil Edildi' | 'Bekliyor' | 'Taksitli';
  installments?: { amount: number; dueDate: string; paid: boolean }[];
  audiologist?: string;
}

export interface RecallItem {
  id: string;
  patientId: string;
  patientName: string;
  reason: 'SGK Yenileme' | 'Yıllık Kontrol' | 'Pil Siparişi' | 'Garanti Süresi' | 'Cihaz Denedi Almadı' | 'Teklif Verildi';
  dueDate: string;
  status: 'Bekliyor' | 'Gönderildi' | 'Randevu Alındı' | 'Tamamlandı';
  lastContact: string | null;
  
  // Gelir Fırsatı Yeni Alanları
  estimatedRevenue: number;
  probability: 'Yüksek Olasılık' | 'Orta Olasılık' | 'Düşük Olasılık';
}

export const getAvatarColor = (name: string) => {
  const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const colors = [
    '#1f6059', // Lagün Petrol/Teal
    '#e07e2c', // Bakır/Rose-gold
    '#2d547a', // Soft Mavi
    '#825136', // Çikolata/Bronz
    '#4b5842', // Haki/Zeytin
  ];
  return colors[hash % colors.length];
};

export const getInitials = (first: string, last: string) => {
  return `${first[0] || ''}${last[0] || ''}`.toUpperCase();
};

export const formatDate = (dateStr: string) => {
  if (!dateStr) return '—';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  return `${parts[2]}.${parts[1]}.${parts[0]}`;
};

export const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', minimumFractionDigits: 0 }).format(value);
};

export const calculateAge = (birthDate: string) => {
  if (!birthDate) return 0;
  const today = new Date('2026-07-10'); // Demo günü
  const birth = new Date(birthDate);
  if (isNaN(birth.getTime())) return 0;
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
};

// ── Patients ──
export const patients: Patient[] = [
  {
    id: 'p1',
    tc: '12345678901',
    firstName: 'Ayşe',
    lastName: 'Yılmaz',
    phone: '0532 111 2233',
    email: 'ayse.yilmaz@email.com',
    birthDate: '1958-03-15',
    gender: 'Kadın',
    address: 'Kadıköy, İstanbul',
    hearingLoss: 'Orta',
    hearingLossSide: 'Her İki Kulak',
    currentDevice: 'Phonak Audéo P90',
    deviceDate: '2021-06-20',
    sgkStatus: 'Yenileme Hakkı Var',
    sgkRenewalDate: '2026-06-20',
    notes: 'Yenileme hakkı yaklaşıyor, bilgilendirme yapılmalı.',
    createdAt: '2019-02-10',
    lastVisit: '2026-05-15',
    audiogramLeft: [20, 25, 35, 45, 55, 60, 65, 70],
    audiogramRight: [15, 20, 30, 40, 50, 55, 60, 65],
    pastAudiogramLeft: [15, 20, 25, 35, 45, 50, 55, 60],
    pastAudiogramRight: [10, 15, 20, 30, 40, 45, 50, 55],
    batterySize: '312',
    dailyUsageHours: 12,
    lastBatteryPurchaseDate: '2026-07-01',
    batteryPackCount: 2,
    source: 'Tavsiye',
    salesStage: 'Teklif Verildi',
    doctorName: 'Dr. Serkan Koç',
    prescriptionStatus: 'Reçete Yazıldı',
    emergencyContactName: 'Ahmet Yılmaz',
    emergencyContactPhone: '0532 222 3344',
    emergencyContactRelation: 'Oğlu',
    nextAction: 'SGK yenileme evrakları Medula üzerinden kontrol edilecek.',
    timeline: [
      { date: '10.02.2019', action: 'İlk hasta kaydı oluşturuldu.', icon: 'Patients' },
      { date: '20.06.2021', action: 'Phonak Audéo P90 cihaz satışı yapıldı.', icon: 'Cash' },
      { date: '15.05.2026', action: 'Yıllık cihaz kontrol randevusu tamamlandı.', icon: 'Check' },
      { date: '01.07.2026', action: '2 paket 312 numara pil sipariş edildi.', icon: 'Plus' }
    ]
  },
  {
    id: 'p2',
    tc: '98765432109',
    firstName: 'Mehmet',
    lastName: 'Kaya',
    phone: '0544 222 3344',
    email: 'mehmet.kaya@email.com',
    birthDate: '1972-09-22',
    gender: 'Erkek',
    address: 'Beşiktaş, İstanbul',
    hearingLoss: 'İleri',
    hearingLossSide: 'Sol',
    currentDevice: 'Oticon More 1',
    deviceDate: '2023-01-10',
    sgkStatus: 'Aktif',
    sgkRenewalDate: '2028-01-10',
    notes: 'Sol kulak ameliyat geçmişi mevcut.',
    createdAt: '2022-11-05',
    lastVisit: '2026-06-28',
    audiogramLeft: [30, 40, 55, 65, 75, 80, 85, 90],
    audiogramRight: [10, 15, 15, 20, 25, 25, 30, 35],
    pastAudiogramLeft: [25, 30, 45, 55, 65, 70, 75, 80],
    pastAudiogramRight: [10, 10, 15, 15, 20, 20, 25, 30],
    batterySize: '13',
    dailyUsageHours: 10,
    lastBatteryPurchaseDate: '2026-05-10',
    batteryPackCount: 1,
    source: 'Doktor',
    salesStage: 'Satış Yapıldı',
    doctorName: 'Prof. Dr. Levent Acar',
    prescriptionStatus: 'SGK Onaylı',
    emergencyContactName: 'Merve Kaya',
    emergencyContactPhone: '0544 333 4455',
    emergencyContactRelation: 'Eşi',
    nextAction: '6 ay sonra rutin kontrol araması yapılacak.',
    timeline: [
      { date: '05.11.2022', action: 'İlk muayene kaydı yapıldı.', icon: 'Patients' },
      { date: '10.01.2023', action: 'Oticon More 1 cihaz satışı ve ÜTS bildirimi tamamlandı.', icon: 'Check' },
      { date: '28.06.2026', action: 'Sol cihaz hoparlör değişimi için teknik servise alındı.', icon: 'Warning' }
    ]
  },
  {
    id: 'p3',
    tc: '45678901234',
    firstName: 'Hanım',
    lastName: 'Saraç',
    phone: '0555 333 4455',
    email: 'hanim.sarac@email.com',
    birthDate: '1965-12-01',
    gender: 'Kadın',
    address: 'Üsküdar, İstanbul',
    hearingLoss: 'Hafif',
    hearingLossSide: 'Sağ',
    currentDevice: null,
    deviceDate: null,
    sgkStatus: 'Aktif',
    sgkRenewalDate: null,
    notes: 'İlk kez başvurdu, cihaz denemesi planlanacak.',
    createdAt: '2026-07-01',
    lastVisit: '2026-07-01',
    audiogramLeft: [10, 10, 15, 15, 20, 20, 25, 25],
    audiogramRight: [15, 20, 25, 30, 35, 40, 45, 45],
    source: 'Sosyal Medya',
    salesStage: 'İlk Görüşme',
    doctorName: 'Uzm. Dr. Aylin Kaya',
    prescriptionStatus: 'Yok',
    emergencyContactName: 'Can Saraç',
    emergencyContactPhone: '0555 444 5566',
    emergencyContactRelation: 'Kardeşi',
    nextAction: 'Cihaz denemesi için randevu verilecek.',
    timeline: [
      { date: '01.07.2026', action: 'Hasta kliniğe ilk kez gelerek işitme testi yaptırdı.', icon: 'Patients' }
    ]
  }
];

// ── Appointments ──
export const appointments: Appointment[] = [
  {
    id: 'a1',
    patientId: 'p1',
    patientName: 'Ayşe Yılmaz',
    date: '2026-07-10',
    time: '10:00',
    type: 'SGK Yenileme',
    audiologist: 'Dr. Elif Arslan',
    status: 'Bekliyor',
    branch: 'Merkez 1 - Kadıköy',
    notes: 'Medula sorgusu ve cihaz denemesi yapılacak.'
  },
  {
    id: 'a2',
    patientId: 'p2',
    patientName: 'Mehmet Kaya',
    date: '2026-07-10',
    time: '11:30',
    type: 'Kontrol',
    audiologist: 'Dr. Can Yılmaz',
    status: 'Hatırlatıldı',
    branch: 'Merkez 2 - Beşiktaş',
    notes: 'Teknik servisten çıkan cihaz teslim edilecek.'
  },
  {
    id: 'a3',
    patientId: 'p3',
    patientName: 'Hanım Saraç',
    date: '2026-07-10',
    time: '14:00',
    type: 'Cihaz Denemesi',
    audiologist: 'Dr. Elif Arslan',
    status: 'Bekliyor',
    branch: 'Merkez 1 - Kadıköy',
    notes: 'Hafif işitme kaybına uygun RIC kasa tipi denenecek.'
  }
];

// ── Stock Items ──
export const stockItems: StockItem[] = [
  {
    id: 's1',
    name: 'Phonak Audéo P90',
    category: 'Cihaz',
    brand: 'Phonak',
    model: 'Audéo P90-R',
    serialNo: 'PH-2024-00142',
    quantity: 1,
    criticalLevel: 0,
    price: 48000,
    sgkPrice: 6200,
    warrantyExpiry: '2028-07-10',
    location: 'A-Rafı, Kutu 4',
    status: 'Stokta',
    utsStatus: 'Bekliyor',
    branch: 'Merkez 1 - Kadıköy'
  },
  {
    id: 's2',
    name: 'Oticon More 1',
    category: 'Cihaz',
    brand: 'Oticon',
    model: 'More 1 miniRITE',
    serialNo: 'OT-2024-00089',
    quantity: 1,
    criticalLevel: 0,
    price: 52000,
    sgkPrice: 6200,
    warrantyExpiry: '2028-05-15',
    location: 'B-Rafı, Kutu 2',
    status: 'Hastaya Ayrıldı',
    assignedPatientId: 'p1',
    assignedPatientName: 'Ayşe Yılmaz',
    utsStatus: 'Bekliyor',
    branch: 'Merkez 1 - Kadıköy'
  },
  {
    id: 's3',
    name: 'Phonak Naída P70',
    category: 'Cihaz',
    brand: 'Phonak',
    model: 'Naída P70-UP',
    serialNo: 'PH-2024-00215',
    quantity: 1,
    criticalLevel: 0,
    price: 36000,
    sgkPrice: 6200,
    warrantyExpiry: '2027-11-20',
    location: 'A-Rafı, Kutu 9',
    status: 'Stokta',
    utsStatus: 'Bekliyor',
    branch: 'Merkez 2 - Beşiktaş'
  },
  {
    id: 's4',
    name: 'Rayovac 312 Numara Pil',
    category: 'Pil',
    brand: 'Rayovac',
    model: 'Active Core 312',
    serialNo: 'RY-312-BATCH12',
    quantity: 120,
    criticalLevel: 50,
    price: 150,
    sgkPrice: 0,
    warrantyExpiry: '2029-12-31',
    location: 'Pil Kutusu A',
    status: 'Stokta',
    utsStatus: 'Gerekli Değil',
    branch: 'Merkez 1 - Kadıköy'
  },
  {
    id: 's5',
    name: 'Rayovac 13 Numara Pil',
    category: 'Pil',
    brand: 'Rayovac',
    model: 'Active Core 13',
    serialNo: 'RY-13-BATCH08',
    quantity: 15,
    criticalLevel: 40,
    price: 150,
    sgkPrice: 0,
    warrantyExpiry: '2029-10-30',
    location: 'Pil Kutusu B',
    status: 'Stokta',
    utsStatus: 'Gerekli Değil',
    branch: 'Merkez 1 - Kadıköy' // Kadıköy stok kritik (15 adet var, kritik seviye 40), Beşiktaş'ta fazla olabilir
  },
  {
    id: 's6',
    name: 'Rayovac 13 Numara Pil (Beşiktaş)',
    category: 'Pil',
    brand: 'Rayovac',
    model: 'Active Core 13',
    serialNo: 'RY-13-BATCH09',
    quantity: 80,
    criticalLevel: 10,
    price: 150,
    sgkPrice: 0,
    warrantyExpiry: '2029-10-30',
    location: 'Pil Kutusu B',
    status: 'Stokta',
    utsStatus: 'Gerekli Değil',
    branch: 'Merkez 2 - Beşiktaş' // Beşiktaş'ta fazla stok var, transfer önerilebilir
  }
];

// ── Sales Records ──
export const sales: SaleRecord[] = [
  {
    id: 'sl1',
    patientId: 'p1',
    patientName: 'Ayşe Yılmaz',
    date: '2026-07-01',
    items: [
      { name: 'Rayovac 312 Numara Pil (60 adet)', quantity: 10, price: 150, type: 'Pil' }
    ],
    total: 1500,
    sgkAmount: 0,
    patientAmount: 1500,
    paymentMethod: 'Kredi Kartı',
    status: 'Tahsil Edildi',
    audiologist: 'Dr. Elif Arslan'
  },
  {
    id: 'sl2',
    patientId: 'p2',
    patientName: 'Mehmet Kaya',
    date: '2023-01-10',
    items: [
      { name: 'Oticon More 1 miniRITE', quantity: 1, price: 52000, type: 'Cihaz' }
    ],
    total: 52000,
    sgkAmount: 6200,
    patientAmount: 45800,
    paymentMethod: 'Taksit',
    status: 'Taksitli',
    installments: [
      { amount: 15266, dueDate: '2026-06-10', paid: true },
      { amount: 15267, dueDate: '2026-07-10', paid: false }, // Vadesi Bugün olan taksit
      { amount: 15267, dueDate: '2026-08-10', paid: false }
    ],
    audiologist: 'Dr. Can Yılmaz'
  }
];

// ── Recall Items ──
export const recallItems: RecallItem[] = [
  {
    id: 'r1',
    patientId: 'p1',
    patientName: 'Ayşe Yılmaz',
    reason: 'SGK Yenileme',
    dueDate: '2026-06-20',
    status: 'Bekliyor',
    lastContact: null,
    estimatedRevenue: 75000,
    probability: 'Yüksek Olasılık'
  },
  {
    id: 'r2',
    patientId: 'p2',
    patientName: 'Mehmet Kaya',
    reason: 'Pil Siparişi',
    dueDate: '2026-07-21',
    status: 'Bekliyor',
    lastContact: null,
    estimatedRevenue: 1200,
    probability: 'Yüksek Olasılık'
  },
  {
    id: 'r3',
    patientId: 'p3',
    patientName: 'Hanım Saraç',
    reason: 'Cihaz Denedi Almadı',
    dueDate: '2026-07-05',
    status: 'Bekliyor',
    lastContact: null,
    estimatedRevenue: 85000,
    probability: 'Orta Olasılık'
  }
];
