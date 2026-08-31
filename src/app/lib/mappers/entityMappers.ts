import { Patient, StockItem, Appointment, AuditLogEntry } from '../../data/mockData';
import { decryptText } from '../cryptoUtils';

/**
 * Direct explicit entity mappers (Zero CPU overhead compared to recursive Object.keys)
 */

export const mapPatientRowToDomain = (row: any): Patient => ({
  id: row.id,
  firstName: row.first_name || '',
  lastName: row.last_name || '',
  tc: decryptText(row.tc || ''),
  phone: row.phone || '',
  email: row.email || '',
  birthDate: row.birth_date || '1985-01-01',
  gender: (row.gender as 'Erkek' | 'Kadın') || 'Erkek',
  address: row.address || 'İstanbul',
  hearingLoss: (row.hearing_loss as Patient['hearingLoss']) || 'Orta',
  hearingLossSide: (row.hearing_loss_side as Patient['hearingLossSide']) || 'Her İki Kulak',
  currentDevice: row.current_device || undefined,
  sgkStatus: row.sgk_status || 'Aktif',
  sgkRenewalDate: row.sgk_renewal_date || undefined,
  prescriptionNo: row.prescription_no || undefined,
  reportNo: row.report_no || undefined,
  salesStage: row.sales_stage || 'Potansiyel',
  notes: row.notes || undefined,
  branchId: row.branch_id || undefined,
  createdAt: row.created_at || undefined
});

export const mapStockRowToDomain = (row: any): StockItem => ({
  id: row.id,
  name: row.name || '',
  category: row.category || 'Cihaz',
  brand: row.brand || '',
  model: row.model || '',
  serialNo: row.serial_number || row.serialNo || '',
  quantity: row.stock_count ?? row.quantity ?? 0,
  criticalLevel: row.critical_level ?? row.criticalLevel ?? 2,
  purchasePrice: row.purchase_price ?? row.purchasePrice ?? 0,
  price: row.sale_price ?? row.price ?? 0,
  sgkPrice: row.sgk_price ?? row.sgkPrice ?? 6200,
  warrantyExpiry: row.warranty_expiry || row.warrantyExpiry || '2028-01-01',
  location: row.location || 'Ana Depo',
  status: row.status || 'Stokta',
  utsStatus: row.uts_status || row.utsStatus || 'Bekliyor',
  branch: row.branch || 'Merkez 1 - Kadıköy'
});

export const mapAppointmentRowToDomain = (row: any): Appointment => ({
  id: row.id,
  patientId: row.patient_id || row.patientId || '',
  patientName: row.patient_name || row.patientName || 'Bilinmeyen Hasta',
  date: row.date || new Date().toISOString().split('T')[0],
  time: row.time || '10:00',
  type: (row.type as Appointment['type']) || 'İşitme Testi',
  audiologist: row.audiologist || row.doctor_name || 'Dr. Elif Arslan',
  status: (row.status as Appointment['status']) || 'Bekliyor',
  branch: row.branch || 'Merkez 1 - Kadıköy',
  notes: row.notes || ''
});

export const mapAuditLogRowToDomain = (row: any): AuditLogEntry => ({
  id: row.id,
  timestamp: row.created_at || row.timestamp || new Date().toISOString(),
  userId: row.user_id || row.userId || 'usr-1',
  userName: row.user_name || row.userName || 'Dr. Elif Arslan',
  action: row.action || 'Ekleme',
  module: row.module || 'Sistem',
  description: row.description || '',
  details: row.details || undefined
});
