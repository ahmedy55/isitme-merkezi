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
  currentDevice: string | null;
  deviceDate: string | null;
  sgkStatus: 'Aktif' | 'Pasif' | 'Yenileme Hakkı Var';
  sgkRenewalDate: string | null;
  notes: string;
  createdAt: string;
  lastVisit: string;
  audiogramLeft: number[];
  audiogramRight: number[];
  pastAudiogramLeft?: number[];
  pastAudiogramRight?: number[];
  batterySize?: '10' | '312' | '13' | '675';
  dailyUsageHours?: number;
  lastBatteryPurchaseDate?: string;
  batteryPackCount?: number;
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
}

export interface SaleRecord {
  id: string;
  patientId: string;
  patientName: string;
  date: string;
  items: { name: string; quantity: number; price: number }[];
  total: number;
  sgkAmount: number;
  patientAmount: number;
  paymentMethod: 'Nakit' | 'Kredi Kartı' | 'Havale' | 'Taksit';
  status: 'Tahsil Edildi' | 'Bekliyor' | 'Taksitli';
  installments?: { amount: number; dueDate: string; paid: boolean }[];
}

export interface RecallItem {
  id: string;
  patientId: string;
  patientName: string;
  reason: 'SGK Yenileme' | 'Yıllık Kontrol' | 'Pil Siparişi' | 'Garanti Süresi';
  dueDate: string;
  status: 'Bekliyor' | 'Gönderildi' | 'Randevu Alındı' | 'Tamamlandı';
  lastContact: string | null;
}

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
    batteryPackCount: 2
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
    batteryPackCount: 1
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
  },
  {
    id: 'p4',
    tc: '56789012345',
    firstName: 'Ali',
    lastName: 'Demir',
    phone: '0532 444 5566',
    email: 'ali.demir@email.com',
    birthDate: '1950-07-18',
    gender: 'Erkek',
    address: 'Maltepe, İstanbul',
    hearingLoss: 'Çok İleri',
    hearingLossSide: 'Her İki Kulak',
    currentDevice: 'Phonak Naída P70',
    deviceDate: '2021-03-05',
    sgkStatus: 'Yenileme Hakkı Var',
    sgkRenewalDate: '2026-03-05',
    notes: 'SGK yenileme görüşmesi yapılacak.',
    createdAt: '2018-06-20',
    lastVisit: '2026-06-10',
    audiogramLeft: [45, 55, 65, 75, 85, 90, 95, 100],
    audiogramRight: [40, 50, 60, 70, 80, 85, 90, 95],
  },
  {
    id: 'p5',
    tc: '67890123456',
    firstName: 'Fatma',
    lastName: 'Özkan',
    phone: '0543 555 6677',
    email: 'fatma.ozkan@email.com',
    birthDate: '1980-01-30',
    gender: 'Kadın',
    address: 'Ataşehir, İstanbul',
    hearingLoss: 'Orta',
    hearingLossSide: 'Her İki Kulak',
    currentDevice: 'Signia Pure 7Nx',
    deviceDate: '2022-09-12',
    sgkStatus: 'Aktif',
    sgkRenewalDate: '2027-09-12',
    notes: '',
    createdAt: '2022-08-01',
    lastVisit: '2026-04-20',
    audiogramLeft: [20, 25, 35, 45, 50, 55, 55, 60],
    audiogramRight: [25, 30, 40, 45, 50, 55, 60, 60],
  },
  {
    id: 'p6',
    tc: '78901234567',
    firstName: 'Hasan',
    lastName: 'Çelik',
    phone: '0535 666 7788',
    email: 'hasan.celik@email.com',
    birthDate: '1945-05-10',
    gender: 'Erkek',
    address: 'Bakırköy, İstanbul',
    hearingLoss: 'İleri',
    hearingLossSide: 'Her İki Kulak',
    currentDevice: 'ReSound ONE 9',
    deviceDate: '2023-11-28',
    sgkStatus: 'Aktif',
    sgkRenewalDate: '2028-11-28',
    notes: 'Pil siparişi zamanı geldi.',
    createdAt: '2020-03-15',
    lastVisit: '2026-07-05',
    audiogramLeft: [35, 45, 55, 65, 70, 75, 80, 85],
    audiogramRight: [30, 40, 50, 60, 65, 70, 75, 80],
  },
];

// ── Appointments ──
export const appointments: Appointment[] = [
  {
    id: 'a1',
    patientId: 'p1',
    patientName: 'Ayşe Yılmaz',
    date: '2026-07-09',
    time: '09:30',
    type: 'Kontrol',
    audiologist: 'Dr. Elif Arslan',
    status: 'Geldi',
    branch: 'Merkez 1 - Kadıköy',
    notes: 'Sağ kulak kontrol',
  },
  {
    id: 'a2',
    patientId: 'p2',
    patientName: 'Mehmet Kaya',
    date: '2026-07-09',
    time: '10:15',
    type: 'Cihaz Denemesi',
    audiologist: 'Dr. Elif Arslan',
    status: 'Bekliyor',
    branch: 'Merkez 1 - Kadıköy',
    notes: '',
  },
  {
    id: 'a3',
    patientId: 'p3',
    patientName: 'Hanım Saraç',
    date: '2026-07-09',
    time: '11:00',
    type: 'İşitme Testi',
    audiologist: 'Dr. Can Yılmaz',
    status: 'Hatırlatıldı',
    branch: 'Merkez 1 - Kadıköy',
    notes: 'İlk test',
  },
  {
    id: 'a4',
    patientId: 'p4',
    patientName: 'Ali Demir',
    date: '2026-07-09',
    time: '14:00',
    type: 'SGK Yenileme',
    audiologist: 'Dr. Elif Arslan',
    status: 'Hatırlatıldı',
    branch: 'Merkez 1 - Kadıköy',
    notes: 'SGK yenileme görüşmesi',
  },
  {
    id: 'a5',
    patientId: 'p5',
    patientName: 'Fatma Özkan',
    date: '2026-07-10',
    time: '09:00',
    type: 'Kontrol',
    audiologist: 'Dr. Can Yılmaz',
    status: 'Bekliyor',
    branch: 'Merkez 2 - Beşiktaş',
    notes: '',
  },
  {
    id: 'a6',
    patientId: 'p6',
    patientName: 'Hasan Çelik',
    date: '2026-07-10',
    time: '10:30',
    type: 'Pil Değişimi',
    audiologist: 'Dr. Elif Arslan',
    status: 'Bekliyor',
    branch: 'Merkez 1 - Kadıköy',
    notes: '',
  },
];

// ── Stock ──
export const stockItems: StockItem[] = [
  { id: 's1', name: 'Phonak Audéo P90', category: 'Cihaz', brand: 'Phonak', model: 'Audéo P90', serialNo: 'PH-2024-00142', quantity: 4, criticalLevel: 2, price: 85000, sgkPrice: 6200, warrantyExpiry: '2028-06-01', location: 'Merkez 1' },
  { id: 's2', name: 'Phonak Naída P70', category: 'Cihaz', brand: 'Phonak', model: 'Naída P70', serialNo: 'PH-2024-00215', quantity: 3, criticalLevel: 2, price: 72000, sgkPrice: 6200, warrantyExpiry: '2028-08-15', location: 'Merkez 1' },
  { id: 's3', name: 'Oticon More 1', category: 'Cihaz', brand: 'Oticon', model: 'More 1', serialNo: 'OT-2024-00089', quantity: 2, criticalLevel: 2, price: 92000, sgkPrice: 6200, warrantyExpiry: '2028-04-20', location: 'Merkez 1' },
  { id: 's4', name: 'Signia Pure 7Nx', category: 'Cihaz', brand: 'Signia', model: 'Pure 7Nx', serialNo: 'SG-2024-00176', quantity: 5, criticalLevel: 3, price: 68000, sgkPrice: 6200, warrantyExpiry: '2028-09-10', location: 'Merkez 2' },
  { id: 's5', name: 'Phonak Pil 312', category: 'Pil', brand: 'Phonak', model: 'ZA312', serialNo: '-', quantity: 8, criticalLevel: 15, price: 120, sgkPrice: 0, warrantyExpiry: '-', location: 'Merkez 1' },
  { id: 's6', name: 'Rayovac Pil 13', category: 'Pil', brand: 'Rayovac', model: 'ZA13', serialNo: '-', quantity: 45, criticalLevel: 20, price: 100, sgkPrice: 0, warrantyExpiry: '-', location: 'Merkez 1' },
  { id: 's7', name: 'Standart Kulak Kalıbı', category: 'Kalıp', brand: 'Genel', model: 'Standart Akrilik', serialNo: '-', quantity: 30, criticalLevel: 10, price: 350, sgkPrice: 0, warrantyExpiry: '-', location: 'Merkez 1' },
  { id: 's8', name: 'Kurutma Tableti', category: 'Aksesuar', brand: 'Phonak', model: 'D-Dry', serialNo: '-', quantity: 12, criticalLevel: 5, price: 450, sgkPrice: 0, warrantyExpiry: '-', location: 'Merkez 1' },
  { id: 's9', name: 'ReSound ONE 9', category: 'Cihaz', brand: 'ReSound', model: 'ONE 9', serialNo: 'RS-2024-00331', quantity: 1, criticalLevel: 2, price: 88000, sgkPrice: 6200, warrantyExpiry: '2028-11-01', location: 'Merkez 2' },
];

// ── Sales ──
export const sales: SaleRecord[] = [
  {
    id: 'sl1',
    patientId: 'p2',
    patientName: 'Mehmet Kaya',
    date: '2026-07-05',
    items: [
      { name: 'Oticon More 1 (Sol)', quantity: 1, price: 92000 },
      { name: 'Kulak Kalıbı', quantity: 1, price: 350 },
    ],
    total: 92350,
    sgkAmount: 6200,
    patientAmount: 86150,
    paymentMethod: 'Taksit',
    status: 'Taksitli',
    installments: [
      { amount: 21537, dueDate: '2026-07-05', paid: true },
      { amount: 21537, dueDate: '2026-08-05', paid: false },
      { amount: 21537, dueDate: '2026-09-05', paid: false },
      { amount: 21539, dueDate: '2026-10-05', paid: false },
    ],
  },
  {
    id: 'sl2',
    patientId: 'p5',
    patientName: 'Fatma Özkan',
    date: '2026-07-03',
    items: [
      { name: 'Phonak Pil 312 (x6)', quantity: 6, price: 720 },
    ],
    total: 720,
    sgkAmount: 0,
    patientAmount: 720,
    paymentMethod: 'Nakit',
    status: 'Tahsil Edildi',
  },
  {
    id: 'sl3',
    patientId: 'p1',
    patientName: 'Ayşe Yılmaz',
    date: '2026-06-28',
    items: [
      { name: 'Kurutma Tableti', quantity: 1, price: 450 },
      { name: 'Phonak Pil 312 (x4)', quantity: 4, price: 480 },
    ],
    total: 930,
    sgkAmount: 0,
    patientAmount: 930,
    paymentMethod: 'Kredi Kartı',
    status: 'Tahsil Edildi',
  },
];

// ── Recall ──
export const recallItems: RecallItem[] = [
  { id: 'r1', patientId: 'p1', patientName: 'Ayşe Yılmaz', reason: 'SGK Yenileme', dueDate: '2026-06-20', status: 'Bekliyor', lastContact: null },
  { id: 'r2', patientId: 'p4', patientName: 'Ali Demir', reason: 'SGK Yenileme', dueDate: '2026-03-05', status: 'Randevu Alındı', lastContact: '2026-07-08' },
  { id: 'r3', patientId: 'p6', patientName: 'Hasan Çelik', reason: 'Pil Siparişi', dueDate: '2026-07-15', status: 'Bekliyor', lastContact: null },
  { id: 'r4', patientId: 'p5', patientName: 'Fatma Özkan', reason: 'Yıllık Kontrol', dueDate: '2026-08-01', status: 'Bekliyor', lastContact: null },
  { id: 'r5', patientId: 'p2', patientName: 'Mehmet Kaya', reason: 'Yıllık Kontrol', dueDate: '2026-07-28', status: 'Gönderildi', lastContact: '2026-07-07' },
];

// ── Helpers ──
export const audiologists = ['Dr. Elif Arslan', 'Dr. Can Yılmaz'];
export const branches = ['Merkez 1 - Kadıköy', 'Merkez 2 - Beşiktaş'];

export const appointmentTypeColors: Record<string, string> = {
  'İşitme Testi': 'info',
  'Cihaz Denemesi': 'primary',
  'Kontrol': 'warning',
  'SGK Yenileme': 'success',
  'Kalıp Alma': 'neutral',
  'Pil Değişimi': 'neutral',
};

export const statusColors: Record<string, string> = {
  'Bekliyor': 'warning',
  'Geldi': 'success',
  'Gelmedi': 'danger',
  'İptal': 'neutral',
  'Hatırlatıldı': 'info',
};

export function getAvatarColor(name: string): string {
  const colors = [
    'linear-gradient(135deg, #667eea, #764ba2)',
    'linear-gradient(135deg, #f093fb, #f5576c)',
    'linear-gradient(135deg, #4facfe, #00f2fe)',
    'linear-gradient(135deg, #43e97b, #38f9d7)',
    'linear-gradient(135deg, #fa709a, #fee140)',
    'linear-gradient(135deg, #a18cd1, #fbc2eb)',
  ];
  const index = name.charCodeAt(0) % colors.length;
  return colors[index];
}

export function getInitials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`;
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', minimumFractionDigits: 0 }).format(amount);
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export function calculateAge(birthDate: string): number {
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}
