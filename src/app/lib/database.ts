import { supabase } from './supabase';
import { SystemUser, UserRole } from '../data/mockData';

// Key Case Converters (snake_case <-> camelCase)
export const toCamel = (obj: any): any => {
  if (Array.isArray(obj)) {
    return obj.map(v => toCamel(v));
  } else if (obj !== null && typeof obj === 'object' && obj.constructor === Object) {
    return Object.keys(obj).reduce((result, key) => {
      const camelKey = key.replace(/_([a-z])/g, (_, g) => g.toUpperCase());
      return {
        ...result,
        [camelKey]: toCamel(obj[key]),
      };
    }, {});
  }
  return obj;
};

export const toSnake = (obj: any): any => {
  if (Array.isArray(obj)) {
    return obj.map(v => toSnake(v));
  } else if (obj !== null && typeof obj === 'object' && obj.constructor === Object) {
    return Object.keys(obj).reduce((result, key) => {
      const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
      return {
        ...result,
        [snakeKey]: toSnake(obj[key]),
      };
    }, {});
  }
  return obj;
};

// Aktif kullanıcının organizasyon ID'sini JWT oturumundan çeker
export const getActiveOrgId = async (): Promise<string | null> => {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.user.app_metadata?.organization_id || null;
};

// ═══════════════════════════════════════════════
// 1. Patients (Hastalar)
// ═══════════════════════════════════════════════
export const dbFetchPatients = async () => {
  const { data, error } = await supabase
    .from('patients')
    .select('*, patient_timeline(*)')
    .order('created_at', { ascending: false });
  if (error) throw error;
  
  // Format timeline structure if needed to match frontend
  return toCamel(data || []);
};

export const dbInsertPatient = async (patient: any) => {
  const orgId = await getActiveOrgId();
  if (!orgId) throw new Error('Aktif organizasyon bulunamadı.');
  
  const { id, timeline, ...payload } = toSnake(patient);
  
  const { data, error } = await supabase
    .from('patients')
    .insert([{ ...payload, organization_id: orgId }])
    .select();
  if (error) throw error;
  return toCamel(data?.[0]);
};

export const dbUpdatePatient = async (id: string, patient: any) => {
  const { id: _, timeline, ...payload } = toSnake(patient);
  const { data, error } = await supabase
    .from('patients')
    .update(payload)
    .eq('id', id)
    .select();
  if (error) throw error;
  return toCamel(data?.[0]);
};

// ═══════════════════════════════════════════════
// 2. Appointments (Randevular)
// ═══════════════════════════════════════════════
export const dbFetchAppointments = async () => {
  const { data, error } = await supabase
    .from('appointments')
    .select('*, patients(first_name, last_name)')
    .order('date', { ascending: true })
    .order('time', { ascending: true });
  if (error) throw error;
  
  // Map JOIN patient name to patientName for UI compatibility
  const mapped = (data || []).map((app: any) => {
    const firstName = app.patients?.first_name || '';
    const lastName = app.patients?.last_name || '';
    return {
      ...app,
      patientName: `${firstName} ${lastName}`.trim() || 'Bilinmeyen Hasta'
    };
  });
  return toCamel(mapped);
};

export const dbInsertAppointment = async (appointment: any) => {
  const orgId = await getActiveOrgId();
  if (!orgId) throw new Error('Aktif organizasyon bulunamadı.');
  
  const { id, patientName, ...payload } = toSnake(appointment);
  const { data, error } = await supabase
    .from('appointments')
    .insert([{ ...payload, organization_id: orgId }])
    .select();
  if (error) throw error;
  return toCamel(data?.[0]);
};

export const dbUpdateAppointmentStatus = async (id: string, status: string) => {
  const { data, error } = await supabase
    .from('appointments')
    .update({ status })
    .eq('id', id)
    .select();
  if (error) throw error;
  return toCamel(data?.[0]);
};

// ═══════════════════════════════════════════════
// 3. Stock Items (Stok)
// ═══════════════════════════════════════════════
export const dbFetchStockItems = async () => {
  const { data, error } = await supabase
    .from('stock_items')
    .select('*, patients(first_name, last_name)')
    .order('name', { ascending: true });
  if (error) throw error;
  
  const mapped = (data || []).map((item: any) => {
    const firstName = item.patients?.first_name || '';
    const lastName = item.patients?.last_name || '';
    return {
      ...item,
      assignedPatientName: item.assigned_patient_id ? `${firstName} ${lastName}`.trim() : null
    };
  });
  return toCamel(mapped);
};

export const dbInsertStockItem = async (item: any) => {
  const orgId = await getActiveOrgId();
  if (!orgId) throw new Error('Aktif organizasyon bulunamadı.');
  
  const { id, assignedPatientName, ...payload } = toSnake(item);
  const { data, error } = await supabase
    .from('stock_items')
    .insert([{ ...payload, organization_id: orgId }])
    .select();
  if (error) throw error;
  return toCamel(data?.[0]);
};

export const dbUpdateStockItem = async (id: string, item: any) => {
  const { id: _, assignedPatientName, ...payload } = toSnake(item);
  const { data, error } = await supabase
    .from('stock_items')
    .update(payload)
    .eq('id', id)
    .select();
  if (error) throw error;
  return toCamel(data?.[0]);
};

// ═══════════════════════════════════════════════
// 4. Sales Records (Satışlar)
// ═══════════════════════════════════════════════
export const dbFetchSales = async () => {
  const { data, error } = await supabase
    .from('sales')
    .select('*, patients(first_name, last_name), sale_items(*), sale_installments(*)')
    .order('date', { ascending: false });
  if (error) throw error;
  
  const mapped = (data || []).map((sale: any) => {
    const firstName = sale.patients?.first_name || '';
    const lastName = sale.patients?.last_name || '';
    return {
      ...sale,
      patientName: `${firstName} ${lastName}`.trim() || 'Bilinmeyen Hasta'
    };
  });
  return toCamel(mapped);
};

export const dbInsertSale = async (sale: any) => {
  const orgId = await getActiveOrgId();
  if (!orgId) throw new Error('Aktif organizasyon bulunamadı.');
  
  const { id, patientName, items, installments, ...payload } = toSnake(sale);
  
  // 1. Ana satış kaydını oluştur
  const { data: mainSale, error: saleError } = await supabase
    .from('sales')
    .insert([{ ...payload, organization_id: orgId }])
    .select();
    
  if (saleError) throw saleError;
  const createdSale = mainSale?.[0];
  if (!createdSale) throw new Error('Satış kaydı oluşturulamadı.');

  // 2. Satış kalemlerini ekle
  if (items && items.length > 0) {
    const itemsPayload = items.map((item: any) => ({
      sale_id: createdSale.id,
      organization_id: orgId,
      name: item.name,
      quantity: item.quantity,
      price: item.price,
      type: item.type
    }));
    const { error: itemsError } = await supabase.from('sale_items').insert(itemsPayload);
    if (itemsError) throw itemsError;
  }

  // 3. Taksitleri ekle
  if (installments && installments.length > 0) {
    const installmentsPayload = installments.map((inst: any) => ({
      sale_id: createdSale.id,
      organization_id: orgId,
      amount: inst.amount,
      due_date: inst.due_date,
      paid: inst.paid || false
    }));
    const { error: instError } = await supabase.from('sale_installments').insert(installmentsPayload);
    if (instError) throw instError;
  }

  return toCamel(createdSale);
};

// ═══════════════════════════════════════════════
// 5. Recall Items (Hatırlatmalar)
// ═══════════════════════════════════════════════
export const dbFetchRecallItems = async () => {
  const { data, error } = await supabase
    .from('recall_items')
    .select('*, patients(first_name, last_name)')
    .order('due_date', { ascending: true });
  if (error) throw error;
  
  const mapped = (data || []).map((item: any) => {
    const firstName = item.patients?.first_name || '';
    const lastName = item.patients?.last_name || '';
    return {
      ...item,
      patientName: `${firstName} ${lastName}`.trim() || 'Bilinmeyen Hasta'
    };
  });
  return toCamel(mapped);
};

export const dbUpdateRecallStatus = async (id: string, status: string) => {
  const { data, error } = await supabase
    .from('recall_items')
    .update({ status, last_contact: new Date().toISOString().split('T')[0] })
    .eq('id', id)
    .select();
  if (error) throw error;
  return toCamel(data?.[0]);
};

// ═══════════════════════════════════════════════
// 6. Suppliers (Tedarikçiler)
// ═══════════════════════════════════════════════
export const dbFetchSuppliers = async () => {
  const { data, error } = await supabase
    .from('suppliers')
    .select('*, supplier_purchases(*, supplier_purchase_items(*))')
    .order('company_name', { ascending: true });
  if (error) throw error;
  return toCamel(data || []);
};

export const dbInsertSupplier = async (supplier: any) => {
  const orgId = await getActiveOrgId();
  if (!orgId) throw new Error('Aktif organizasyon bulunamadı.');
  
  const { id, purchases, ...payload } = toSnake(supplier);
  const { data, error } = await supabase
    .from('suppliers')
    .insert([{ ...payload, organization_id: orgId }])
    .select();
  if (error) throw error;
  return toCamel(data?.[0]);
};

export const dbUpdateSupplier = async (id: string, supplier: any) => {
  const { id: _, purchases, ...payload } = toSnake(supplier);
  const { data, error } = await supabase
    .from('suppliers')
    .update(payload)
    .eq('id', id)
    .select();
  if (error) throw error;
  return toCamel(data?.[0]);
};

export const dbDeleteSupplier = async (id: string) => {
  const { error } = await supabase
    .from('suppliers')
    .delete()
    .eq('id', id);
  if (error) throw error;
};

// ═══════════════════════════════════════════════
// 7. Expenses (Masraflar)
// ═══════════════════════════════════════════════
export const dbFetchExpenses = async () => {
  const { data, error } = await supabase
    .from('expenses')
    .select('*')
    .order('date', { ascending: false });
  if (error) throw error;
  return toCamel(data || []);
};

export const dbInsertExpense = async (expense: any) => {
  const orgId = await getActiveOrgId();
  if (!orgId) throw new Error('Aktif organizasyon bulunamadı.');
  
  const { id, ...payload } = toSnake(expense);
  const { data, error } = await supabase
    .from('expenses')
    .insert([{ ...payload, organization_id: orgId }])
    .select();
  if (error) throw error;
  return toCamel(data?.[0]);
};

export const dbUpdateExpense = async (id: string, expense: any) => {
  const { id: _, ...payload } = toSnake(expense);
  const { data, error } = await supabase
    .from('expenses')
    .update(payload)
    .eq('id', id)
    .select();
  if (error) throw error;
  return toCamel(data?.[0]);
};

export const dbDeleteExpense = async (id: string) => {
  const { error } = await supabase
    .from('expenses')
    .delete()
    .eq('id', id);
  if (error) throw error;
};

// ═══════════════════════════════════════════════
// 8. Audit Logs (İşlem Kayıtları)
// ═══════════════════════════════════════════════
export const dbFetchAuditLogs = async () => {
  const { data, error } = await supabase
    .from('audit_log')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return toCamel(data || []);
};

export const dbInsertAuditLog = async (log: any) => {
  const orgId = await getActiveOrgId();
  if (!orgId) return; // Silent fail
  
  const { id, timestamp, ...payload } = toSnake(log);
  await supabase
    .from('audit_log')
    .insert([{ ...payload, organization_id: orgId }]);
};

// ═══════════════════════════════════════════════
// 9. Branches (Şubeler)
// ═══════════════════════════════════════════════
export const dbFetchBranches = async () => {
  const { data, error } = await supabase
    .from('branches')
    .select('*')
    .order('name', { ascending: true });
  if (error) throw error;
  return toCamel(data || []);
};

export const dbInsertBranch = async (branch: any) => {
  const orgId = await getActiveOrgId();
  if (!orgId) throw new Error('Aktif organizasyon bulunamadı.');
  
  const { id, patientsCount, ...payload } = toSnake(branch);
  const { data, error } = await supabase
    .from('branches')
    .insert([{ ...payload, organization_id: orgId }])
    .select();
  if (error) throw error;
  return toCamel(data?.[0]);
};

export const dbUpdateBranch = async (id: string, branch: any) => {
  const { id: _, patientsCount, ...payload } = toSnake(branch);
  const { data, error } = await supabase
    .from('branches')
    .update(payload)
    .eq('id', id)
    .select();
  if (error) throw error;
  return toCamel(data?.[0]);
};

// ═══════════════════════════════════════════════
// 10. Memberships (Kullanıcı & Personel Yönetimi)
// ═══════════════════════════════════════════════
export const dbFetchMemberships = async (): Promise<SystemUser[]> => {
  const { data, error } = await supabase
    .from('memberships')
    .select('*, branches(name)')
    .order('joined_at', { ascending: false });

  if (error) {
    console.error('dbFetchMemberships error:', error);
    return [];
  }

  return (data || []).map((m: any) => ({
    id: m.id,
    firstName: m.first_name || m.email?.split('@')[0] || 'Kullanıcı',
    lastName: m.last_name || '',
    email: m.email || 'kullanici@audipro.com',
    phone: m.phone || '',
    roles: (m.roles || ['Odyometrist']) as UserRole[],
    branch: m.branches?.name || 'Tüm Şubeler',
    status: (m.status === 'inactive' ? 'Pasif' : 'Aktif') as 'Aktif' | 'Pasif',
    createdAt: m.joined_at ? m.joined_at.split('T')[0] : new Date().toISOString().split('T')[0],
    lastLogin: m.joined_at ? m.joined_at.split('T')[0] : undefined
  }));
};

export const dbInsertMembership = async (user: any): Promise<SystemUser> => {
  const orgId = await getActiveOrgId();
  if (!orgId) throw new Error('Aktif organizasyon bulunamadı.');

  const res = await fetch('/api/invite-user', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      roles: user.roles,
      orgId
    })
  });

  const resData = await res.json();
  if (!res.ok || !resData.success) {
    throw new Error(resData.error || 'Kullanıcı daveti gönderilemedi.');
  }

  return resData.user;
};

export const dbUpdateMembership = async (id: string, user: any) => {
  const { data, error } = await supabase
    .from('memberships')
    .update({
      roles: user.roles,
      status: user.status === 'Pasif' ? 'inactive' : 'active',
      first_name: user.firstName,
      last_name: user.lastName,
      phone: user.phone
    })
    .eq('id', id)
    .select('*, branches(name)');

  if (error) throw error;
  return {
    ...user,
    branch: data?.[0]?.branches?.name || user.branch
  };
};

export const dbDeleteMembership = async (id: string) => {
  const { error } = await supabase
    .from('memberships')
    .delete()
    .eq('id', id);

  if (error) throw error;
};
