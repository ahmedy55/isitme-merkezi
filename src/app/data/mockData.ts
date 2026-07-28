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
  patientStatus?: 'Potansiyel' | 'Deneme Yapıldı' | 'Müşteri' | 'Satın Almayanlar' | 'Genel' | 'Tamir için gelen' | 'Kalıp Hastası' | 'Pil Hastası' | 'Satış Hastası' | 'Eski Hasta';
  consentGiven?: boolean;
  consentDate?: string;
  photoUrl?: string;
  branchId?: string;
  branch?: string;
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
  branchId?: string;
  notes: string;
}

export interface StockItem {
  id: string;
  name: string;
  category: string;
  brand: string;
  model: string;
  serialNo: string;
  quantity: number;
  criticalLevel: number;
  price: number;
  purchasePrice?: number;
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

// ── Enterprise Domain Ledgers & Policies ──
export type StockMovementType = 'PURCHASE' | 'SALE' | 'TRANSFER' | 'RETURN' | 'ADJUSTMENT' | 'SERVICE' | 'LOSS';

export interface StockMovement {
  id: string;
  organizationId?: string;
  branchId?: string;
  stockItemId: string;
  stockItemName: string;
  type: StockMovementType;
  quantityChange: number;
  unitPrice: number;
  referenceEntity: 'sale' | 'purchase' | 'service' | 'adjustment';
  referenceId: string;
  performedByUserId?: string;
  createdAt: string;
  notes?: string;
}

export type CashTransactionType = 'INCOME' | 'EXPENSE' | 'PAYOUT' | 'TRANSFER' | 'REFUND';

export interface CashTransaction {
  id: string;
  organizationId?: string;
  branchId?: string;
  cashRegisterId: string;
  type: CashTransactionType;
  amount: number;
  category: string;
  referenceEntity?: 'sale' | 'expense' | 'purchase' | 'service';
  referenceId?: string;
  performedByUserId?: string;
  createdAt: string;
  description?: string;
}

export interface RecallPolicy {
  policyType: 'SGK' | 'PRIVATE_INSURANCE' | 'DEVICE_CHECK' | 'TRIAL';
  durationYears: number;
  durationMonths: number;
  description: string;
}

export const RECALL_POLICIES: Record<string, RecallPolicy> = {
  SGK: { policyType: 'SGK', durationYears: 5, durationMonths: 0, description: 'SGK 5 Yıllık Cihaz Yenileme Hakkı' },
  PRIVATE_INSURANCE: { policyType: 'PRIVATE_INSURANCE', durationYears: 2, durationMonths: 0, description: 'Özel Sigorta Yenileme' },
  DEVICE_CHECK: { policyType: 'DEVICE_CHECK', durationYears: 1, durationMonths: 0, description: 'Yıllık Cihaz Kontrolü' },
  TRIAL: { policyType: 'TRIAL', durationYears: 0, durationMonths: 1, description: 'Cihaz Deneme Takibi' }
};

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
    prescriptionNo: 'REC-2026-9938',
    reportNo: 'RAP-2026-1122',
    sgkInsuranceStatus: 'Emekli',
    patientStatus: 'Müşteri',
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
    prescriptionNo: 'REC-2026-5544',
    reportNo: 'RAP-2026-8877',
    sgkInsuranceStatus: 'Çalışan (sigortalı)',
    patientStatus: 'Deneme Yapıldı',
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
    prescriptionNo: '',
    reportNo: '',
    sgkInsuranceStatus: 'Belirtilmemiş',
    patientStatus: 'Potansiyel',
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
    purchasePrice: 4800,
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
    purchasePrice: 5000,
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
    purchasePrice: 3600,
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
    purchasePrice: 45,
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
    purchasePrice: 45,
    sgkPrice: 0,
    warrantyExpiry: '2029-10-30',
    location: 'Pil Kutusu B',
    status: 'Stokta',
    utsStatus: 'Gerekli Değil',
    branch: 'Merkez 1 - Kadıköy'
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
    purchasePrice: 45,
    sgkPrice: 0,
    warrantyExpiry: '2029-10-30',
    location: 'Pil Kutusu B',
    status: 'Stokta',
    utsStatus: 'Gerekli Değil',
    branch: 'Merkez 2 - Beşiktaş'
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

/* ══════════════════════════════════════════════
   P0 Modülleri — Yeni Tipler ve Mock Veriler
   ══════════════════════════════════════════════ */

// ─── Tedarikçi / Dış Firma ─────────────────
export interface Supplier {
  id: string;
  companyName: string;
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
  taxNo: string;
  category: 'İşitme Cihazı' | 'Pil & Aksesuar' | 'Kalıp Malzemesi' | 'Teknik Servis' | 'Diğer';
  status: 'Aktif' | 'Pasif';
  balance: number; // Pozitif = bize borcu, negatif = bizim borcumuz
  createdAt: string;
  notes?: string;
  purchases: SupplierPurchase[];
}

export interface SupplierPurchase {
  id: string;
  supplierId: string;
  date: string;
  invoiceNo: string;
  items: { name: string; quantity: number; unitPrice: number }[];
  total: number;
  paymentStatus: 'Ödendi' | 'Bekliyor' | 'Kısmi Ödendi';
  paymentMethod: 'Nakit' | 'Havale' | 'Çek' | 'Açık Hesap';
}

export const suppliers: Supplier[] = [
  {
    id: 'sup-1',
    companyName: 'Phonak Türkiye A.Ş.',
    contactPerson: 'Caner Yıldız',
    phone: '0212 555 01 01',
    email: 'caner@phonak.com.tr',
    address: 'Maslak, Sarıyer, İstanbul',
    taxNo: '1234567890',
    category: 'İşitme Cihazı',
    status: 'Aktif',
    balance: -45000,
    createdAt: '2025-01-15',
    notes: 'Ana cihaz tedarikçisi. Aylık sipariş sözleşmesi mevcut.',
    purchases: [
      {
        id: 'pur-1',
        supplierId: 'sup-1',
        date: '2026-06-20',
        invoiceNo: 'PH-2026-0412',
        items: [
          { name: 'Phonak Audéo L90-R', quantity: 3, unitPrice: 28000 },
          { name: 'Phonak Slim L90', quantity: 2, unitPrice: 32000 }
        ],
        total: 148000,
        paymentStatus: 'Kısmi Ödendi',
        paymentMethod: 'Havale'
      }
    ]
  },
  {
    id: 'sup-2',
    companyName: 'Rayovac Pil Dağıtım',
    contactPerson: 'Sevgi Demir',
    phone: '0216 444 22 33',
    email: 'sevgi@rayovac.com.tr',
    address: 'Ataşehir, İstanbul',
    taxNo: '9876543210',
    category: 'Pil & Aksesuar',
    status: 'Aktif',
    balance: 0,
    createdAt: '2025-03-10',
    purchases: [
      {
        id: 'pur-2',
        supplierId: 'sup-2',
        date: '2026-07-05',
        invoiceNo: 'RV-2026-0088',
        items: [
          { name: 'Rayovac 312 (60lı Paket)', quantity: 20, unitPrice: 180 },
          { name: 'Rayovac 13 (60lı Paket)', quantity: 10, unitPrice: 190 }
        ],
        total: 5500,
        paymentStatus: 'Ödendi',
        paymentMethod: 'Nakit'
      }
    ]
  },
  {
    id: 'sup-3',
    companyName: 'Widex İşitme Sistemleri',
    contactPerson: 'Berk Aydın',
    phone: '0212 333 44 55',
    email: 'berk@widex.com.tr',
    address: 'Levent, Beşiktaş, İstanbul',
    taxNo: '5678901234',
    category: 'İşitme Cihazı',
    status: 'Aktif',
    balance: -12000,
    createdAt: '2025-06-01',
    purchases: []
  },
  {
    id: 'sup-4',
    companyName: 'Kalıp Malzeme San. Tic.',
    contactPerson: 'Melek Koç',
    phone: '0312 111 22 33',
    email: 'melek@kalipmalzeme.com',
    address: 'Yenimahalle, Ankara',
    taxNo: '3456789012',
    category: 'Kalıp Malzemesi',
    status: 'Pasif',
    balance: 0,
    createdAt: '2024-11-20',
    notes: 'Sözleşme yenilenmedi — alternatif tedarikçi aranıyor.',
    purchases: []
  }
];

// ─── Masraf Yönetimi ─────────────────
export interface Expense {
  id: string;
  date: string;
  category: 'Kira' | 'Fatura' | 'Maaş' | 'Malzeme' | 'Bakım & Onarım' | 'Ulaşım' | 'Reklam & Pazarlama' | 'Vergi & Sigorta' | 'Diğer';
  description: string;
  amount: number;
  paymentMethod: 'Nakit' | 'Havale' | 'Kredi Kartı' | 'Otomatik Ödeme';
  branch: 'Merkez 1 - Kadıköy' | 'Merkez 2 - Beşiktaş' | 'Genel';
  createdBy: string;
  receiptNo?: string;
  notes?: string;
}

export const expenses: Expense[] = [
  {
    id: 'exp-1',
    date: '2026-07-01',
    category: 'Kira',
    description: 'Kadıköy Şubesi Temmuz ayı kira ödemesi',
    amount: 42000,
    paymentMethod: 'Havale',
    branch: 'Merkez 1 - Kadıköy',
    createdBy: 'Dr. Elif Arslan',
    receiptNo: 'KR-2026-07'
  },
  {
    id: 'exp-2',
    date: '2026-07-01',
    category: 'Kira',
    description: 'Beşiktaş Şubesi Temmuz ayı kira ödemesi',
    amount: 38000,
    paymentMethod: 'Havale',
    branch: 'Merkez 2 - Beşiktaş',
    createdBy: 'Dr. Elif Arslan',
    receiptNo: 'KR-2026-07B'
  },
  {
    id: 'exp-3',
    date: '2026-07-03',
    category: 'Fatura',
    description: 'Kadıköy şube elektrik faturası (Haziran dönemi)',
    amount: 4200,
    paymentMethod: 'Otomatik Ödeme',
    branch: 'Merkez 1 - Kadıköy',
    createdBy: 'Dr. Elif Arslan'
  },
  {
    id: 'exp-4',
    date: '2026-07-05',
    category: 'Maaş',
    description: 'Ody. Hasan Kaya — Temmuz maaşı',
    amount: 52000,
    paymentMethod: 'Havale',
    branch: 'Genel',
    createdBy: 'Dr. Elif Arslan'
  },
  {
    id: 'exp-5',
    date: '2026-07-05',
    category: 'Maaş',
    description: 'Sek. Zeynep Acar — Temmuz maaşı',
    amount: 32000,
    paymentMethod: 'Havale',
    branch: 'Genel',
    createdBy: 'Dr. Elif Arslan'
  },
  {
    id: 'exp-6',
    date: '2026-07-10',
    category: 'Reklam & Pazarlama',
    description: 'Google Ads Temmuz kampanya ödemesi',
    amount: 8500,
    paymentMethod: 'Kredi Kartı',
    branch: 'Genel',
    createdBy: 'Dr. Elif Arslan',
    notes: 'İşitme testi kampanyası — hedef: Kadıköy çevresi'
  },
  {
    id: 'exp-7',
    date: '2026-07-12',
    category: 'Bakım & Onarım',
    description: 'Odyometre cihazı yıllık kalibrasyon ücreti',
    amount: 3200,
    paymentMethod: 'Nakit',
    branch: 'Merkez 1 - Kadıköy',
    createdBy: 'Ody. Hasan Kaya'
  },
  {
    id: 'exp-8',
    date: '2026-07-15',
    category: 'Malzeme',
    description: 'Ofis kırtasiye ve yazıcı toneri',
    amount: 1400,
    paymentMethod: 'Nakit',
    branch: 'Merkez 1 - Kadıköy',
    createdBy: 'Sek. Zeynep Acar'
  }
];

// ─── Kullanıcı Yönetimi ─────────────────
export type UserRole = 'Firma Yöneticisi' | 'Odyometrist' | 'Sekreter' | 'Muhasebe';

export interface SystemUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  roles: UserRole[];
  branch: 'Merkez 1 - Kadıköy' | 'Merkez 2 - Beşiktaş' | 'Tüm Şubeler';
  status: 'Aktif' | 'Pasif';
  createdAt: string;
  lastLogin?: string;
  avatar?: string;
}

export const systemUsers: SystemUser[] = [
  {
    id: 'usr-1',
    firstName: 'Elif',
    lastName: 'Arslan',
    email: 'elif.arslan@audipro.com.tr',
    phone: '0532 111 22 33',
    roles: ['Firma Yöneticisi'],
    branch: 'Tüm Şubeler',
    status: 'Aktif',
    createdAt: '2024-06-01',
    lastLogin: '2026-07-20T14:35:00'
  },
  {
    id: 'usr-2',
    firstName: 'Hasan',
    lastName: 'Kaya',
    email: 'hasan.kaya@audipro.com.tr',
    phone: '0533 222 33 44',
    roles: ['Odyometrist'],
    branch: 'Merkez 1 - Kadıköy',
    status: 'Aktif',
    createdAt: '2024-08-15',
    lastLogin: '2026-07-20T09:10:00'
  },
  {
    id: 'usr-3',
    firstName: 'Zeynep',
    lastName: 'Acar',
    email: 'zeynep.acar@audipro.com.tr',
    phone: '0534 333 44 55',
    roles: ['Sekreter'],
    branch: 'Merkez 1 - Kadıköy',
    status: 'Aktif',
    createdAt: '2025-01-10',
    lastLogin: '2026-07-19T17:22:00'
  },
  {
    id: 'usr-4',
    firstName: 'Murat',
    lastName: 'Özkan',
    email: 'murat.ozkan@audipro.com.tr',
    phone: '0535 444 55 66',
    roles: ['Muhasebe'],
    branch: 'Tüm Şubeler',
    status: 'Aktif',
    createdAt: '2025-03-20',
    lastLogin: '2026-07-18T11:05:00'
  },
  {
    id: 'usr-5',
    firstName: 'Ayşe',
    lastName: 'Yılmaz',
    email: 'ayse.yilmaz@audipro.com.tr',
    phone: '0536 555 66 77',
    roles: ['Odyometrist'],
    branch: 'Merkez 2 - Beşiktaş',
    status: 'Aktif',
    createdAt: '2025-06-01',
    lastLogin: '2026-07-20T10:45:00'
  },
  {
    id: 'usr-6',
    firstName: 'Fatma',
    lastName: 'Demir',
    email: 'fatma.demir@audipro.com.tr',
    phone: '0537 666 77 88',
    roles: ['Sekreter', 'Muhasebe'],
    branch: 'Merkez 2 - Beşiktaş',
    status: 'Pasif',
    createdAt: '2025-02-15',
    lastLogin: '2026-05-10T16:30:00'
  }
];

// ─── İşlem Kayıtları (Audit Log) ─────────────────
export interface AuditLogEntry {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  action: 'Ekleme' | 'Düzenleme' | 'Silme' | 'Giriş' | 'Çıkış' | 'Satış' | 'Tahsilat' | 'Stok Hareketi';
  module: 'Hasta' | 'Randevu' | 'Stok' | 'Satış' | 'Kasa' | 'Tedarikçi' | 'Masraf' | 'Kullanıcı' | 'Ayarlar' | 'Sistem';
  description: string;
  details?: string;
}

export const auditLog: AuditLogEntry[] = [
  {
    id: 'log-1',
    timestamp: '2026-07-20T14:35:00',
    userId: 'usr-1',
    userName: 'Dr. Elif Arslan',
    action: 'Giriş',
    module: 'Sistem',
    description: 'Sisteme giriş yapıldı.',
    details: 'IP: 85.107.xx.xx · Tarayıcı: Chrome 126'
  },
  {
    id: 'log-2',
    timestamp: '2026-07-20T14:40:00',
    userId: 'usr-1',
    userName: 'Dr. Elif Arslan',
    action: 'Ekleme',
    module: 'Hasta',
    description: 'Yeni hasta kaydı oluşturuldu: Kemal Deniz',
  },
  {
    id: 'log-3',
    timestamp: '2026-07-20T10:15:00',
    userId: 'usr-2',
    userName: 'Ody. Hasan Kaya',
    action: 'Satış',
    module: 'Satış',
    description: 'Cihaz satışı tamamlandı: Ahmet Yılmaz — Phonak Audéo L90',
    details: 'Toplam: 95.000 TL · SGK: 5.621 TL · Hasta Payı: 89.379 TL'
  },
  {
    id: 'log-4',
    timestamp: '2026-07-19T16:20:00',
    userId: 'usr-4',
    userName: 'Murat Özkan',
    action: 'Ekleme',
    module: 'Masraf',
    description: 'Yeni masraf kaydı: Google Ads Temmuz kampanya ödemesi — 8.500 TL',
  },
  {
    id: 'log-5',
    timestamp: '2026-07-19T14:50:00',
    userId: 'usr-3',
    userName: 'Zeynep Acar',
    action: 'Ekleme',
    module: 'Randevu',
    description: 'Yeni randevu oluşturuldu: Fatma Kaya — 21.07.2026 11:00',
  },
  {
    id: 'log-6',
    timestamp: '2026-07-18T09:30:00',
    userId: 'usr-1',
    userName: 'Dr. Elif Arslan',
    action: 'Stok Hareketi',
    module: 'Stok',
    description: 'Yeni ürün eklendi: Phonak Slim L70 — SN: PH-SL70-2026-005',
  },
  {
    id: 'log-7',
    timestamp: '2026-07-17T11:00:00',
    userId: 'usr-5',
    userName: 'Ayşe Yılmaz',
    action: 'Düzenleme',
    module: 'Hasta',
    description: 'Hasta bilgileri güncellendi: Mehmet Demir — Adres ve telefon değişikliği',
  }
];

// ─── Şube Tanımı ─────────────────
export interface Branch {
  id: string;
  name: string;
  slug?: string;
  address: string;
  phone: string;
  patientsCount: number;
  status: 'Aktif' | 'Pasif';
}

export const initialBranches: Branch[] = [
  {
    id: 'br-1',
    name: 'Merkez 1 - Kadıköy',
    address: 'Caferağa Mah. Moda Cad. No:42, Kadıköy',
    phone: '0216 555 00 00',
    patientsCount: 142,
    status: 'Aktif'
  },
  {
    id: 'br-2',
    name: 'Merkez 2 - Beşiktaş',
    address: 'Sinanpaşa Mah. Çelebioğlu Sok. No:15, Beşiktaş',
    phone: '0212 222 11 11',
    patientsCount: 86,
    status: 'Aktif'
  }
];

