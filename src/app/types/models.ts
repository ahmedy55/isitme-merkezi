// Clean domain models and types for AudiPro SaaS

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

  source?: 'Doktor' | 'Sosyal Medya' | 'Tavsiye' | 'Yürüyerek' | 'Web';
  salesStage?: 'İlk Görüşme' | 'Test Yapıldı' | 'Cihaz Denendi' | 'Teklif Verildi' | 'Satış Yapıldı' | 'Kaybedildi';
  doctorName?: string;
  prescriptionStatus?: 'Yok' | 'Reçete Yazıldı' | 'SGK Onaylı';
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  emergencyContactRelation?: string;
  nextAction?: string;
  timeline?: { id?: string; date: string; action: string; icon: string }[];
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
  barcode?: string;
  quantity: number;
  criticalLevel: number;
  price: number;
  purchasePrice?: number;
  sgkPrice: number;
  warrantyExpiry: string;
  location: string;
  
  status: 'Stokta' | 'Hastaya Ayrıldı' | 'Satıldı' | 'Serviste';
  utsStatus: 'Bekliyor' | 'Bildirildi' | 'Hata' | 'Gerekli Değil';
  assignedPatientId?: string;
  assignedPatientName?: string;
  assignedEar?: 'Sağ' | 'Sol' | null;
  branch: string;
  branchId?: string;
  utsKurumNo?: string;
  gln?: string;
  mersisNo?: string;
}

export interface SaleRecord {
  id: string;
  patientId: string;
  patientName: string;
  date: string;
  items: { name: string; quantity: number; price: number; stockItemId?: string; barcode?: string; serialNo?: string; type?: 'Cihaz' | 'Pil' | 'Servis Geliri' | 'Aksesuar' }[];
  total: number;
  sgkAmount: number;
  patientAmount: number;
  paymentMethod: 'Nakit' | 'Kredi Kartı' | 'Havale' | 'Taksit';
  status: 'Tahsil Edildi' | 'Bekliyor' | 'Taksitli';
  installments?: { amount: number; dueDate: string; paid: boolean }[];
  audiologist?: string;
  idempotencyKey?: string;
  branchId?: string;
  deviceEarSide?: 'Sağ' | 'Sol';
}

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
  patientTC?: string;
  reason: 'SGK Yenileme' | 'Yıllık Kontrol' | 'Pil Siparişi' | 'Garanti Süresi' | 'Cihaz Denedi Almadı' | 'Teklif Verildi' | 'Pil değişimi' | 'Cihaz kontrolü' | 'Temizlik & Bakım' | 'Kontrol muayenesi' | 'Cihaz ayarı' | 'Teknik servis';
  dueDate: string;
  status: 'Bekliyor' | 'Gönderildi' | 'Randevu Alındı' | 'Tamamlandı';
  lastContact: string | null;
  estimatedRevenue: number;
  probability: 'Yüksek Olasılık' | 'Orta Olasılık' | 'Düşük Olasılık';
  notes?: string;
}

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
  balance: number;
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

export interface Expense {
  id: string;
  date: string;
  category: 'Kira' | 'Fatura' | 'Maaş' | 'Malzeme' | 'Bakım & Onarım' | 'Ulaşım' | 'Reklam & Pazarlama' | 'Vergi & Sigorta' | 'Diğer';
  description: string;
  amount: number;
  paymentMethod: 'Nakit' | 'Havale' | 'Kredi Kartı' | 'Otomatik Ödeme';
  branch: string;
  branchId?: string;
  createdBy: string;
  receiptNo?: string;
  notes?: string;
}

export type UserRole = 'Firma Yöneticisi' | 'Şube Yöneticisi' | 'Odyolog' | 'Odyometrist' | 'Sekreter' | 'Resepsiyon' | 'Muhasebe';

export interface SystemUser {
  password?: string;
  userId?: string;
  branchId?: string | null;
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  roles: UserRole[];
  branch: string;
  status: 'Aktif' | 'Pasif';
  createdAt: string;
  lastLogin?: string;
  avatar?: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  action: string;
  module: string;
  description: string;
  details?: string;
  clientIp?: string | null;
  branchId?: string | null;
}

export interface Branch {
  id: string;
  name: string;
  slug?: string;
  address: string;
  phone: string;
  patientsCount: number;
  status: 'Aktif' | 'Pasif';
}

export const getAvatarColor = (name: string) => {
  const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const colors = [
    '#1f6059',
    '#e07e2c',
    '#2d547a',
    '#825136',
    '#4b5842',
  ];
  return colors[hash % colors.length];
};

export const getInitials = (first: string, last: string) => {
  return `${first[0] || ''}${last[0] || ''}`.toUpperCase();
};

export const formatDate = (dateStr: string) => {
  if (!dateStr) return '—';
  const isoDate = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoDate) return `${isoDate[3]}.${isoDate[2]}.${isoDate[1]}`;
  const trDate = dateStr.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})/);
  if (trDate) return `${trDate[1].padStart(2, '0')}.${trDate[2].padStart(2, '0')}.${trDate[3]}`;
  return dateStr;
};

export const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', minimumFractionDigits: 0 }).format(value);
};

export const calculateAge = (birthDate: string) => {
  if (!birthDate) return 0;
  const match = birthDate.match(/^(\d{4})-(\d{2})-(\d{2})/);
  const birth = match
    ? new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
    : new Date(birthDate);
  if (isNaN(birth.getTime()) || birth > new Date()) return 0;
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
};
