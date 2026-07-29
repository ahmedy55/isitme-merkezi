import { supabase } from './supabase';
import { SystemUser, UserRole } from '../data/mockData';
import { toCamelGeneric, toSnakeGeneric } from '../repositories/BaseRepository';
import { DatabaseError } from './errors/DatabaseError';
import { logger } from './logger';

// Key Case Converters (snake_case <-> camelCase) with Typesafe Generics <T>
export const toCamel = <T = any>(obj: unknown): T => toCamelGeneric<T>(obj);
export const toSnake = <T = any>(obj: unknown): T => toSnakeGeneric<T>(obj);

/**
 * Universal Database Query Executor with Exception Catching & Slow Query Logging (>500ms)
 */
export const executeDbQuery = async <T>(queryFn: () => Promise<T>, queryName: string): Promise<T> => {
  const startTime = Date.now();
  try {
    const result = await queryFn();
    const durationMs = Date.now() - startTime;
    if (durationMs > 500) {
      logger.warn(`[Database Slow Query Alert] ${queryName} executed in ${durationMs}ms`, 'Database', durationMs);
    }
    return result;
  } catch (error: any) {
    logger.error(`[DatabaseError in ${queryName}]: ${error.message || 'Bilinmeyen veritabanı hatası'}`, error, 'Database');
    if (error instanceof DatabaseError) throw error;
    throw new DatabaseError(`Veritabanı işlem hatası (${queryName}): ${error.message || 'Bilinmeyen hata'}`, error);
  }
};

// Aktif kullanıcının organizasyon ID'sini JWT oturumundan çeker
export const getActiveOrgId = async (): Promise<string | null> => {
  return executeDbQuery(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.user.app_metadata?.organization_id || null;
  }, 'getActiveOrgId');
};

// ═══════════════════════════════════════════════
// 1. Patients (Hastalar)
// ═══════════════════════════════════════════════
export const dbFetchPatients = async () => {
  return executeDbQuery(async () => {
    const { data, error } = await supabase
      .from('patients')
      .select('*, patient_timeline(*)')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return toCamel(data || []);
  }, 'dbFetchPatients');
};

export const dbInsertPatient = async (patient: any) => {
  return executeDbQuery(async () => {
    const orgId = await getActiveOrgId();
    if (!orgId) throw new DatabaseError('Aktif organizasyon bulunamadı.');
    
    const { id, timeline, ...payload } = toSnake(patient);
    
    const { data, error } = await supabase
      .from('patients')
      .insert([{ ...payload, organization_id: orgId }])
      .select();
    if (error) throw error;
    return toCamel(data?.[0]);
  }, 'dbInsertPatient');
};

export const dbUpdatePatient = async (id: string, patient: any) => {
  return executeDbQuery(async () => {
    const { id: _, timeline, ...payload } = toSnake(patient);
    const { data, error } = await supabase
      .from('patients')
      .update(payload)
      .eq('id', id)
      .select();
    if (error) throw error;
    return toCamel(data?.[0]);
  }, 'dbUpdatePatient');
};

// ═══════════════════════════════════════════════
// 2. Appointments (Randevular)
// ═══════════════════════════════════════════════
export const dbFetchAppointments = async () => {
  return executeDbQuery(async () => {
    const { data, error } = await supabase
      .from('appointments')
      .select('*, patients(first_name, last_name)')
      .order('date', { ascending: true })
      .order('time', { ascending: true });
    if (error) throw error;
    
    const mapped = (data || []).map((app: any) => {
      const firstName = app.patients?.first_name || '';
      const lastName = app.patients?.last_name || '';
      return {
        ...app,
        patientName: `${firstName} ${lastName}`.trim() || 'Bilinmeyen Hasta'
      };
    });
    return toCamel(mapped);
  }, 'dbFetchAppointments');
};

export const dbInsertAppointment = async (appointment: any) => {
  return executeDbQuery(async () => {
    const orgId = await getActiveOrgId();
    if (!orgId) throw new DatabaseError('Aktif organizasyon bulunamadı.');
    
    const { id, patientName, ...payload } = toSnake(appointment);
    const { data, error } = await supabase
      .from('appointments')
      .insert([{ ...payload, organization_id: orgId }])
      .select();
    if (error) throw error;
    return toCamel(data?.[0]);
  }, 'dbInsertAppointment');
};

export const dbUpdateAppointmentStatus = async (id: string, status: string) => {
  return executeDbQuery(async () => {
    const { data, error } = await supabase
      .from('appointments')
      .update({ status })
      .eq('id', id)
      .select();
    if (error) throw error;
    return toCamel(data?.[0]);
  }, 'dbUpdateAppointmentStatus');
};

// ═══════════════════════════════════════════════
// 3. Stock Items (Stok)
// ═══════════════════════════════════════════════
export const dbFetchStockItems = async () => {
  return executeDbQuery(async () => {
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
  }, 'dbFetchStockItems');
};

export const dbInsertStockItem = async (item: any) => {
  return executeDbQuery(async () => {
    const orgId = await getActiveOrgId();
    if (!orgId) throw new DatabaseError('Aktif organizasyon bulunamadı.');
    
    const { id, assignedPatientName, ...payload } = toSnake(item);
    const { data, error } = await supabase
      .from('stock_items')
      .insert([{ ...payload, organization_id: orgId }])
      .select();
    if (error) throw error;
    return toCamel(data?.[0]);
  }, 'dbInsertStockItem');
};

export const dbUpdateStockItem = async (id: string, item: any) => {
  return executeDbQuery(async () => {
    const { id: _, assignedPatientName, ...payload } = toSnake(item);
    const { data, error } = await supabase
      .from('stock_items')
      .update(payload)
      .eq('id', id)
      .select();
    if (error) throw error;
    return toCamel(data?.[0]);
  }, 'dbUpdateStockItem');
};

// ═══════════════════════════════════════════════
// 4. Sales Records (Satışlar)
// ═══════════════════════════════════════════════
export const dbFetchSales = async () => {
  return executeDbQuery(async () => {
    const { data, error } = await supabase
      .from('sales')
      .select('*, patients(first_name, last_name), sale_items(*), sale_installments(*)')
      .order('date', { ascending: false });
    if (error) throw error;
    
    const mapped = (data || []).map((sale: any) => {
      const firstName = sale.patients?.first_name || '';
      const lastName = sale.patients?.last_name || '';
      const camelSale = toCamel(sale);
      return {
        ...camelSale,
        patientName: `${firstName} ${lastName}`.trim() || 'Bilinmeyen Hasta',
        items: camelSale.saleItems || camelSale.items || [],
        installments: camelSale.saleInstallments || camelSale.installments || []
      };
    });
    return mapped;
  }, 'dbFetchSales');
};

export const dbInsertSale = async (sale: any) => {
  return executeDbQuery(async () => {
    const orgId = await getActiveOrgId();
    if (!orgId) throw new DatabaseError('Aktif organizasyon bulunamadı.');
    
    const { id, patientName, items, installments, ...payload } = toSnake(sale);
    
    const { data: mainSale, error: saleError } = await supabase
      .from('sales')
      .insert([{ ...payload, organization_id: orgId }])
      .select();
      
    if (saleError) throw saleError;
    const createdSale = mainSale?.[0];
    if (!createdSale) throw new DatabaseError('Satış kaydı oluşturulamadı.');

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
  }, 'dbInsertSale');
};

// ═══════════════════════════════════════════════
// 5. Recall Items (Hatırlatmalar)
// ═══════════════════════════════════════════════
export const dbFetchRecallItems = async () => {
  return executeDbQuery(async () => {
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
  }, 'dbFetchRecallItems');
};

export const dbUpdateRecallStatus = async (id: string, status: string) => {
  return executeDbQuery(async () => {
    const { data, error } = await supabase
      .from('recall_items')
      .update({ status, last_contact: new Date().toISOString().split('T')[0] })
      .eq('id', id)
      .select();
    if (error) throw error;
    return toCamel(data?.[0]);
  }, 'dbUpdateRecallStatus');
};

// ═══════════════════════════════════════════════
// 6. Suppliers (Tedarikçiler)
// ═══════════════════════════════════════════════
export const dbFetchSuppliers = async () => {
  return executeDbQuery(async () => {
    const { data, error } = await supabase
      .from('suppliers')
      .select('*, supplier_purchases(*, supplier_purchase_items(*))')
      .order('company_name', { ascending: true });
    if (error) throw error;
    
    const mapped = (data || []).map((sup: any) => {
      const camelSup = toCamel(sup);
      const purchases = (camelSup.supplierPurchases || camelSup.purchases || []).map((pur: any) => ({
        ...pur,
        items: pur.supplierPurchaseItems || pur.items || []
      }));
      return {
        ...camelSup,
        purchases
      };
    });
    return mapped;
  }, 'dbFetchSuppliers');
};

export const dbInsertSupplier = async (supplier: any) => {
  return executeDbQuery(async () => {
    const orgId = await getActiveOrgId();
    if (!orgId) throw new DatabaseError('Aktif organizasyon bulunamadı.');
    
    const { id, purchases, ...payload } = toSnake(supplier);
    const { data, error } = await supabase
      .from('suppliers')
      .insert([{ ...payload, organization_id: orgId }])
      .select();
    if (error) throw error;
    return toCamel(data?.[0]);
  }, 'dbInsertSupplier');
};

export const dbUpdateSupplier = async (id: string, supplier: any) => {
  return executeDbQuery(async () => {
    const { id: _, purchases, ...payload } = toSnake(supplier);
    const { data, error } = await supabase
      .from('suppliers')
      .update(payload)
      .eq('id', id)
      .select();
    if (error) throw error;
    return toCamel(data?.[0]);
  }, 'dbUpdateSupplier');
};

export const dbDeleteSupplier = async (id: string) => {
  return executeDbQuery(async () => {
    const { error } = await supabase
      .from('suppliers')
      .delete()
      .eq('id', id);
    if (error) throw error;
  }, 'dbDeleteSupplier');
};

// ═══════════════════════════════════════════════
// 7. Expenses (Masraflar)
// ═══════════════════════════════════════════════
export const dbFetchExpenses = async () => {
  return executeDbQuery(async () => {
    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .order('date', { ascending: false });
    if (error) throw error;
    return toCamel(data || []);
  }, 'dbFetchExpenses');
};

export const dbInsertExpense = async (expense: any) => {
  return executeDbQuery(async () => {
    const orgId = await getActiveOrgId();
    if (!orgId) throw new DatabaseError('Aktif organizasyon bulunamadı.');
    
    const { id, ...payload } = toSnake(expense);
    const { data, error } = await supabase
      .from('expenses')
      .insert([{ ...payload, organization_id: orgId }])
      .select();
    if (error) throw error;
    return toCamel(data?.[0]);
  }, 'dbInsertExpense');
};

export const dbUpdateExpense = async (id: string, expense: any) => {
  return executeDbQuery(async () => {
    const { id: _, ...payload } = toSnake(expense);
    const { data, error } = await supabase
      .from('expenses')
      .update(payload)
      .eq('id', id)
      .select();
    if (error) throw error;
    return toCamel(data?.[0]);
  }, 'dbUpdateExpense');
};

export const dbDeleteExpense = async (id: string) => {
  return executeDbQuery(async () => {
    const { error } = await supabase
      .from('expenses')
      .delete()
      .eq('id', id);
    if (error) throw error;
  }, 'dbDeleteExpense');
};

// ═══════════════════════════════════════════════
// 8. Audit Logs (İşlem Kayıtları)
// ═══════════════════════════════════════════════
export const dbFetchAuditLogs = async (): Promise<any[]> => {
  return executeDbQuery(async () => {
    const { data, error } = await supabase
      .from('audit_log')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    const rawList = toCamel(data || []);
    return rawList.map((item: any) => ({
      ...item,
      timestamp: item.timestamp || item.createdAt || new Date().toISOString(),
      userName: item.userName || item.userId || 'Dr. Elif Arslan'
    }));
  }, 'dbFetchAuditLogs');
};

export const dbInsertAuditLog = async (log: any) => {
  return executeDbQuery(async () => {
    const orgId = await getActiveOrgId();
    if (!orgId) return;
    
    const { id, timestamp, ...payload } = toSnake(log);
    await supabase
      .from('audit_log')
      .insert([{ ...payload, organization_id: orgId }]);
  }, 'dbInsertAuditLog');
};

// ═══════════════════════════════════════════════
// 9. Branches (Şubeler)
// ═══════════════════════════════════════════════
export const dbFetchBranches = async () => {
  return executeDbQuery(async () => {
    const { data, error } = await supabase
      .from('branches')
      .select('*')
      .order('name', { ascending: true });
    if (error) throw error;
    return toCamel(data || []);
  }, 'dbFetchBranches');
};

export const dbInsertBranch = async (branch: any) => {
  return executeDbQuery(async () => {
    const orgId = await getActiveOrgId();
    if (!orgId) throw new DatabaseError('Aktif organizasyon bulunamadı.');
    
    const { id, patientsCount, ...payload } = toSnake(branch);
    const { data, error } = await supabase
      .from('branches')
      .insert([{ ...payload, organization_id: orgId }])
      .select();
    if (error) throw error;
    return toCamel(data?.[0]);
  }, 'dbInsertBranch');
};

export const dbUpdateBranch = async (id: string, branch: any) => {
  return executeDbQuery(async () => {
    const { id: _, patientsCount, ...payload } = toSnake(branch);
    const { data, error } = await supabase
      .from('branches')
      .update(payload)
      .eq('id', id)
      .select();
    if (error) throw error;
    return toCamel(data?.[0]);
  }, 'dbUpdateBranch');
};

// ═══════════════════════════════════════════════
// 10. Memberships (Kullanıcı & Personel Yönetimi)
// ═══════════════════════════════════════════════
export const dbFetchMemberships = async (): Promise<SystemUser[]> => {
  return executeDbQuery(async () => {
    const { data, error } = await supabase
      .from('memberships')
      .select('*, branches(name)')
      .order('joined_at', { ascending: false });

    if (error) throw error;

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
  }, 'dbFetchMemberships');
};

export const dbInsertMembership = async (user: any): Promise<SystemUser> => {
  return executeDbQuery(async () => {
    const orgId = await getActiveOrgId();
    if (!orgId) throw new DatabaseError('Aktif organizasyon bulunamadı.');

    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token || '';

    const res = await fetch('/api/invite-user', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
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
      throw new DatabaseError(resData.error || 'Kullanıcı daveti gönderilemedi.');
    }

    return resData.user;
  }, 'dbInsertMembership');
};

export const dbUpdateMembership = async (id: string, user: any) => {
  return executeDbQuery(async () => {
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
  }, 'dbUpdateMembership');
};

export const dbDeleteMembership = async (id: string) => {
  return executeDbQuery(async () => {
    const { error } = await supabase
      .from('memberships')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }, 'dbDeleteMembership');
};
