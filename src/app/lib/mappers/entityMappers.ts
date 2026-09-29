import { Patient, StockItem, Appointment, AuditLogEntry } from '../../data/mockData';

/**
 * Direct explicit entity mappers (Zero CPU overhead compared to recursive Object.keys)
 */

export const mapPatientRowToDomain = (row: any): Patient => ({
  id: row.id,
  firstName: row.first_name || '',
  lastName: row.last_name || '',
  tc: row.tc || '',
  phone: row.phone || '',
  email: row.email || '',
  birthDate: row.birth_date || '',
  gender: (row.gender as Patient['gender']) || '' as Patient['gender'],
  address: row.address || '',
  hearingLoss: (row.hearing_loss as Patient['hearingLoss']) || '' as Patient['hearingLoss'],
  hearingLossSide: (row.hearing_loss_side as Patient['hearingLossSide']) || '' as Patient['hearingLossSide'],
  currentDevice: row.current_device || undefined,
  sgkStatus: row.sgk_status || undefined,
  sgkRenewalDate: row.sgk_renewal_date || undefined,
  prescriptionNo: row.prescription_no || undefined,
  reportNo: row.report_no || undefined,
  salesStage: row.sales_stage || undefined,
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
  criticalLevel: row.critical_level ?? row.criticalLevel ?? 0,
  purchasePrice: row.purchase_price ?? row.purchasePrice ?? 0,
  price: row.sale_price ?? row.price ?? 0,
  sgkPrice: row.sgk_price ?? row.sgkPrice ?? 0,
  warrantyExpiry: row.warranty_expiry || row.warrantyExpiry || '',
  location: row.location || '',
  status: row.status || 'Stokta',
  utsStatus: row.uts_status || row.utsStatus || 'Bekliyor',
  branch: row.branch || ''
});

export const mapAppointmentRowToDomain = (row: any): Appointment => ({
  id: row.id,
  patientId: row.patient_id || row.patientId || '',
  patientName: row.patient_name || row.patientName || 'Bilinmeyen Hasta',
  date: row.date || '',
  time: row.time || '',
  type: (row.type as Appointment['type']) || 'İşitme Testi',
  audiologist: row.audiologist || row.doctor_name || '',
  status: (row.status as Appointment['status']) || 'Bekliyor',
  branch: row.branch || '',
  notes: row.notes || ''
});

export const mapAuditLogRowToDomain = (row: any): AuditLogEntry => ({
  id: row.id,
  timestamp: row.created_at || row.timestamp || '',
  userId: row.user_id || row.userId || '',
  userName: row.user_name || row.userName || 'Kullanıcı bilgisi yok',
  action: row.action || 'İşlem bilgisi yok',
  module: row.module || 'Modül bilgisi yok',
  description: row.description || '',
  details: row.details || undefined
});
