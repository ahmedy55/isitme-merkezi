import { supabase } from '../lib/supabase';

export interface ServiceRecord {
  id: string; patientId?: string; branchId?: string; stockItemId?: string;
  patientName: string; deviceName: string; serialNo: string; barcode?: string;
  receivedDate: string; estimatedDate: string; returnedDate: string | null;
  problem: string; operations: { description: string; cost: number }[]; totalCost: number;
  status: 'Alındı' | 'İnceleniyor' | 'Tamir Ediliyor' | 'Hazır' | 'Teslim Edildi';
  technician: string; warrantyRepair: boolean; notes: string;
  accessoriesTaken?: string[]; complaints?: string[];
}
const statusToDb: Record<ServiceRecord['status'], string> = { 'Alındı': 'Bekliyor', 'İnceleniyor': 'İşlemde', 'Tamir Ediliyor': 'İşlemde', 'Hazır': 'Tamamlandı', 'Teslim Edildi': 'Teslim Edildi' };
const dbToStatus: Record<string, ServiceRecord['status']> = { 'Bekliyor': 'Alındı', 'İşlemde': 'İnceleniyor', 'Tamamlandı': 'Hazır', 'Teslim Edildi': 'Teslim Edildi' };
export async function fetchServiceTickets(orgId: string): Promise<ServiceRecord[]> {
  let { data, error } = await supabase.from('service_tickets').select('*').eq('organization_id', orgId).is('deleted_at', null).order('received_date', { ascending: false });
  // Stay compatible during deployment while the archive migration is still pending.
  if (error && (error.code === '42703' || error.message.includes('deleted_at'))) {
    ({ data, error } = await supabase.from('service_tickets').select('*').eq('organization_id', orgId).order('received_date', { ascending: false }));
  }
  if (error) throw new Error('Servis kayıtları yüklenemedi.');
  return (data || []).map(row => ({
    ...row.details, id: row.id, patientId: row.patient_id, branchId: row.branch_id, stockItemId: row.stock_item_id,
    patientName: row.patient_name, deviceName: row.device_name, serialNo: row.device_serial || '', barcode: row.barcode || '',
    receivedDate: row.received_date, returnedDate: row.delivered_date, problem: row.complaint,
    totalCost: Number(row.service_fee), status: row.details?.status || dbToStatus[row.status] || 'Alındı',
    technician: row.technician || '', notes: row.notes || '', operations: row.details?.operations || [],
    estimatedDate: row.details?.estimatedDate || '', warrantyRepair: row.details?.warrantyRepair ?? false,
  }));
}
export async function saveServiceTicket(orgId: string, record: ServiceRecord): Promise<ServiceRecord> {
  if (!record.branchId || !record.deviceName.trim() || !record.serialNo.trim() || !record.barcode?.trim()) throw new Error('Şube, cihaz, barkod ve seri numarası gerekli.');
  const { data, error } = await supabase.from('service_tickets').upsert({
    id: record.id, organization_id: orgId, branch_id: record.branchId, patient_id: record.patientId || null,
    stock_item_id: record.stockItemId || null, patient_name: record.patientName, device_name: record.deviceName,
    device_serial: record.serialNo.trim(), barcode: record.barcode.trim(), received_date: record.receivedDate,
    delivered_date: record.returnedDate, complaint: record.problem || 'Belirtilmedi', service_fee: record.totalCost,
    status: statusToDb[record.status], technician: record.technician, notes: record.notes,
    details: { estimatedDate: record.estimatedDate, operations: record.operations, status: record.status,
      warrantyRepair: record.warrantyRepair, accessoriesTaken: record.accessoriesTaken, complaints: record.complaints },
  }).select('id').single();
  if (error || !data) throw new Error('Servis kaydı saklanamadı. Bilgileri ve bağlantıyı kontrol edin.');
  return record;
}
