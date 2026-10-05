import { supabase } from '../lib/supabase';
import { fetchAllPages, getActiveOrgId } from '../lib/database';

export interface AssetRecord {
  id: string; name: string; category: string; serialNo: string; branch: string;
  branchId?: string; purchaseDate: string; cost: number; warrantyExpiry: string;
  lastMaintenance: string; maintenanceIntervalMonths: number; status: string; notes?: string;
}
const assetFromDb = (r: any): AssetRecord => ({
  id: r.id, name: r.name, category: r.category, serialNo: r.serial_no || '',
  branch: r.branches?.name || '', branchId: r.branch_id, purchaseDate: r.purchase_date || '',
  cost: Number(r.purchase_price || 0), warrantyExpiry: r.warranty_expiry || '',
  lastMaintenance: r.last_maintenance || '', maintenanceIntervalMonths: r.maintenance_interval_months || 12,
  status: r.status, notes: r.notes || '',
});
export async function fetchAssets(): Promise<AssetRecord[]> {
  try {
    const data = await fetchAllPages((from, to) => supabase.from('assets').select('*, branches(name)').is('archived_at', null).order('created_at', { ascending: false }).order('id', { ascending: true }).range(from, to));
    return data.map(assetFromDb);
  } catch {
    throw new Error('Demirbaşlar yüklenemedi.');
  }
}
export async function saveAsset(asset: AssetRecord): Promise<AssetRecord> {
  const orgId = await getActiveOrgId();
  if (!orgId || !asset.branchId) throw new Error('Firma ve şube seçimi gerekli.');
  const { data, error } = await supabase.from('assets').upsert({
    id: asset.id, organization_id: orgId, branch_id: asset.branchId, name: asset.name,
    category: asset.category, serial_no: asset.serialNo, purchase_date: asset.purchaseDate || null,
    purchase_price: asset.cost, warranty_expiry: asset.warrantyExpiry || null,
    last_maintenance: asset.lastMaintenance || null, maintenance_interval_months: asset.maintenanceIntervalMonths,
    status: asset.status, notes: asset.notes || '',
  }).select('*, branches(name)').single();
  if (error || !data) throw new Error('Demirbaş kaydedilemedi.');
  return assetFromDb(data);
}
export async function archiveAsset(id: string): Promise<void> {
  const { error } = await supabase.from('assets').update({ archived_at: new Date().toISOString() }).eq('id', id);
  if (error) throw new Error('Demirbaş arşivlenemedi.');
}

export interface ActivityRecord {
  id: string; timestamp: string; userName: string; userRole: string; type: string;
  patientName: string; description: string; duration?: string; branchId?: string;
}
export async function fetchActivities(): Promise<ActivityRecord[]> {
  let data;
  try {
    data = await fetchAllPages((from, to) => supabase.from('activity_logs').select('*, actor:memberships!activity_member_fk(first_name,last_name,roles), branches(name)').order('created_at', { ascending: false }).order('id', { ascending: true }).range(from, to));
  } catch {
    throw new Error('Aktiviteler yüklenemedi.');
  }
  return data.map((r: any) => ({
    id: r.id, timestamp: r.created_at,
    userName: [r.actor?.first_name, r.actor?.last_name].filter(Boolean).join(' ') || 'Personel',
    userRole: r.actor?.roles?.join(', ') || 'Personel', type: r.activity_type,
    patientName: r.patient_name, description: r.description, branchId: r.branch_id, branchName: r.branches?.name || '',
    duration: r.duration_minutes ? `${r.duration_minutes} dk` : undefined,
  }));
}
export async function createActivity(input: { branchId: string; patientName: string; patientId?: string; type: string; description: string; duration?: number }): Promise<void> {
  const orgId = await getActiveOrgId();
  if (!orgId || !input.branchId) throw new Error('Firma ve şube seçimi gerekli.');
  const { error } = await supabase.from('activity_logs').insert({
    organization_id: orgId, branch_id: input.branchId, patient_id: input.patientId || null,
    patient_name: input.patientName, activity_type: input.type, description: input.description,
    duration_minutes: input.duration || null,
  });
  if (error) throw new Error('Aktivite kaydedilemedi.');
}

export async function fetchBranchTransfers(): Promise<any[]> {
  let data: any[];
  let branches: any[];
  try {
    [data, branches] = await Promise.all([
      fetchAllPages((from, to) => supabase.from('branch_transfers').select('*').order('created_at', { ascending: false }).order('id', { ascending: true }).range(from, to)),
      fetchAllPages((from, to) => supabase.from('branches').select('id,name,archived_at').order('id', { ascending: true }).range(from, to)),
    ]);
  } catch {
    throw new Error('Şube transferleri veya şube bilgileri yüklenemedi.');
  }
  const names = new Map((branches || []).map((b: any) => [b.id, b.name]));
  const activeBranchIds = new Set((branches || []).filter((b: any) => !b.archived_at).map((b: any) => b.id));
  const visibleTransfers = (data || []).filter((row: any) => activeBranchIds.has(row.source_branch_id) && activeBranchIds.has(row.target_branch_id));
  const actorIds = visibleTransfers.map((row: any) => row.transferred_by).filter(Boolean);
  const uniqueActorIds = [...new Set(actorIds)];
  const actors = (await Promise.all(Array.from({ length: Math.ceil(uniqueActorIds.length / 100) }, (_, index) =>
    supabase.from('memberships').select('user_id,first_name,last_name').in('user_id', uniqueActorIds.slice(index * 100, (index + 1) * 100)),
  ))).flatMap(({ data: actorBatch, error }) => {
    if (error) throw new Error('Transfer personeli yüklenemedi.');
    return actorBatch || [];
  });
  const actorNames = new Map((actors || []).map((actor: any) => [actor.user_id, `${actor.first_name || ''} ${actor.last_name || ''}`.trim()]));
  return visibleTransfers.map((r: any) => ({
    id: r.id, patientName: r.patient_name, sourceBranchId: r.source_branch_id, targetBranchId: r.target_branch_id,
    fromBranch: names.get(r.source_branch_id) || '', toBranch: names.get(r.target_branch_id) || '',
    patientId: r.patient_id, date: r.created_at.slice(0, 10), transferredBy: actorNames.get(r.transferred_by) || 'Personel', status: 'Tamamlandı',
    transferType: 'Diğer', notes: 'Hasta kaydı hedef şubeye aktarıldı.',
  }));
}
export async function transferPatient(patientId: string, targetBranchId: string, requestId: string): Promise<void> {
  const { error } = await supabase.rpc('transfer_patient_branch', { p_patient: patientId, p_target: targetBranchId, p_request: requestId });
  if (error) throw new Error('Hasta transferi yapılamadı. Hasta, kaynak şube ve hedef şube bilgilerini kontrol edin.');
}
