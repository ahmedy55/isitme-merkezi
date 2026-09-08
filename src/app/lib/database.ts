import { writePayload } from './writePayload';
import { supabase } from './supabase';
import { encryptText, decryptText } from './cryptoUtils';
import { SystemUser, UserRole } from '../data/mockData';
import { toCamelGeneric, toSnakeGeneric } from '../repositories/BaseRepository';
import { patientRepository } from '../repositories/PatientRepository';
import { StockRepository } from '../repositories/StockRepository';
import { CashRepository } from '../repositories/CashRepository';
import { DatabaseError } from './errors/DatabaseError';
import { logger } from './logger';

// Key Case Converters (snake_case <-> camelCase) with Typesafe Generics <T>
export const toCamel = <T = any>(obj: unknown): T => toCamelGeneric<T>(obj);
export const toSnake = <T = any>(obj: unknown): T => toSnakeGeneric<T>(obj);
export { patientRepository, StockRepository, CashRepository };

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
    const items = toCamel<any[]>(data || []);
    return items.map(p => ({ ...p, tc: decryptText(p.tc) }));
  }, 'dbFetchPatients');
};

export const dbInsertPatient = async (patient: any) => {
  return executeDbQuery(async () => {
    const orgId = await getActiveOrgId();
    if (!orgId) throw new DatabaseError('Aktif organizasyon bulunamadı.');
    
    const { id, timeline, ...payload } = toSnake(patient);
    if (payload.tc) {
      payload.tc = encryptText(payload.tc);
    }
    
    const { data, error } = await supabase
      .from('patients')
      .insert([{ ...await writePayload('patients',payload), organization_id: orgId }])
      .select();
    if (error) throw error;
    const result = toCamel<any>(data?.[0]);
    if (result && result.tc) {
      result.tc = decryptText(result.tc);
    }
    return result;
  }, 'dbInsertPatient');
};

export const dbUpdatePatient = async (id: string, patient: any) => {
  return executeDbQuery(async () => {
    const { id: _, timeline, ...payload } = toSnake(patient);
    if (payload.tc) {
      payload.tc = encryptText(payload.tc);
    }
    const { data, error } = await supabase
      .from('patients')
      .update(await writePayload('patients',payload))
      .eq('id', id)
      .select();
    if (error) throw error;
    const result = toCamel<any>(data?.[0]);
    if (result && result.tc) {
      result.tc = decryptText(result.tc);
    }
    return result;
  }, 'dbUpdatePatient');
};

export const dbDeletePatient = async (id: string) => {
  return executeDbQuery(async () => {
    const { error } = await supabase
      .from('patients')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id);
    if (error) throw error;
  }, 'dbDeletePatient');
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
    
    const { id, patient_name, ...payload } = toSnake(appointment);
    const { data, error } = await supabase
      .from('appointments')
      .insert([{ ...await writePayload('appointments',payload), organization_id: orgId }])
      .select();
    if (error) throw error;
    if (!data?.[0]) throw new DatabaseError('Kayıt bulunamadı veya işlem yetkisi yok.');
    return toCamel(data[0]);
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
    
    const { id, assigned_patient_name, ...payload } = toSnake(item);
    const { data, error } = await supabase
      .from('stock_items')
      .insert([{ ...await writePayload('stock_items',payload), organization_id: orgId }])
      .select();
    if (error) throw error;
    return toCamel(data?.[0]);
  }, 'dbInsertStockItem');
};

export const dbUpdateStockItem = async (id: string, item: any) => {
  return executeDbQuery(async () => {
    const { id: _, assigned_patient_name, ...payload } = toSnake(item);
    const { data, error } = await supabase
      .from('stock_items')
      .update(await writePayload('stock_items',payload))
      .eq('id', id)
      .select();
    if (error) throw error;
    return toCamel(data?.[0]);
  }, 'dbUpdateStockItem');
};

export const dbDeleteStockItem = async (id: string) => {
  return executeDbQuery(async () => {
    const { error } = await supabase
      .from('stock_items')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id);
    if (error) throw error;
  }, 'dbDeleteStockItem');
};

// ═══════════════════════════════════════════════
// 3b. Cash Transactions (Kasa Hareketleri)
// ═══════════════════════════════════════════════
export const dbFetchCashTransactions = async () => {
  return executeDbQuery(async () => {
    const { data, error } = await supabase
      .from('cash_transactions')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return toCamel(data || []);
  }, 'dbFetchCashTransactions');
};

export const dbInsertCashTransaction = async (tx: any) => {
  return executeDbQuery(async () => {
    const orgId = await getActiveOrgId();
    if (!orgId) throw new DatabaseError('Aktif firma gerekli.');
    
    const { id, ...payload } = toSnake(tx);
    const idempotencyKey = payload.idempotency_key || (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : undefined);

    const { data, error } = await supabase
      .from('cash_transactions')
      .insert([{ ...await writePayload('cash_transactions',payload), organization_id: orgId, idempotency_key: idempotencyKey }])
      .select();

    if (error) {
      if (error.code === '23505' && idempotencyKey) {
        throw new DatabaseError('Tekrarlanan işlem veya benzersiz alan çakışması; kaydı yenileyip doğrulayın.', error);
      }
      throw error;
    }
    return toCamel(data?.[0]);
  }, 'dbInsertCashTransaction');
};

// ═══════════════════════════════════════════════
// 3c. Stock Movements (Stok Hareketleri)
// ═══════════════════════════════════════════════
export const dbInsertStockMovement = async (movement: any) => {
  return executeDbQuery(async () => {
    const orgId = await getActiveOrgId();
    if (!orgId) throw new DatabaseError('Aktif firma gerekli.');
    
    const { id, ...payload } = toSnake(movement);
    const { data, error } = await supabase
      .from('stock_movements')
      .insert([{ ...await writePayload('stock_movements',payload), organization_id: orgId }])
      .select();
    if (error) throw error;
    return toCamel(data?.[0]);
  }, 'dbInsertStockMovement');
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

export const dbInsertSale = async (sale: any, stockItemId?: string, cashRegisterId?: string) => {
  const payload=toSnake(sale);
  const {data,error}=await supabase.rpc('complete_sale',{
    p_sale:{patient_id:payload.patient_id,date:payload.date,items:payload.items,installments:payload.installments || [],
      total:payload.total,sgk_amount:payload.sgk_amount || 0,patient_amount:payload.patient_amount ?? payload.total,
      payment_method:payload.payment_method,status:payload.status,audiologist:payload.audiologist},
    p_key:payload.idempotency_key,p_stock:stockItemId || null,p_register:cashRegisterId || 'kas-1',
  });
  if(error) throw new DatabaseError('Satış işlemi tamamlanamadı.',error);
  return {...toCamel(data),items:sale.items,installments:sale.installments || [],patientName:sale.patientName};
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
      .insert([{ ...await writePayload('suppliers',payload), organization_id: orgId }])
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
      .update(await writePayload('suppliers',payload))
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
      .update({ deleted_at: new Date().toISOString() })
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
    const idempotencyKey = payload.idempotency_key || (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : undefined);

    const { data, error } = await supabase
      .from('expenses')
      .insert([{ ...await writePayload('expenses',payload), organization_id: orgId, idempotency_key: idempotencyKey }])
      .select();

    if (error) {
      if (error.code === '23505' && idempotencyKey) {
        throw new DatabaseError('Tekrarlanan işlem veya benzersiz alan çakışması; kaydı yenileyip doğrulayın.', error);
      }
      throw error;
    }
    return toCamel(data?.[0]);
  }, 'dbInsertExpense');
};

export const dbUpdateExpense = async (id: string, expense: any) => {
  return executeDbQuery(async () => {
    const { id: _, ...payload } = toSnake(expense);
    const { data, error } = await supabase
      .from('expenses')
      .update(await writePayload('expenses',payload))
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
      .update({ deleted_at: new Date().toISOString() })
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
    
    const { data: { user } } = await supabase.auth.getUser();
    const { id, timestamp, ...payload } = toSnake({ ...log, userId: user?.id });
    const { error } = await supabase
      .from('audit_log')
      .insert([{ ...await writePayload('audit_log',payload), organization_id: orgId }]);
    if (error) console.error('Audit insert failed',error.code);
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
    
    const { id, patients_count, ...payload } = toSnake(branch);
    const { data, error } = await supabase
      .from('branches')
      .insert([{ ...await writePayload('branches',payload), organization_id: orgId }])
      .select();
    if (error) throw error;
    return toCamel(data?.[0]);
  }, 'dbInsertBranch');
};

export const dbUpdateBranch = async (id: string, branch: any) => {
  return executeDbQuery(async () => {
    const { id: _, patients_count, ...payload } = toSnake(branch);
    const { data, error } = await supabase
      .from('branches')
      .update(await writePayload('branches',payload))
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
      userId: m.user_id,
      branchId: m.branch_id,
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

    if (!user.branchId && user.branch && user.branch !== 'Tüm Şubeler') {
      const { data: branch, error } = await supabase.from('branches').select('id').eq('organization_id', orgId).eq('name', user.branch).single();
      if (error || !branch) throw new DatabaseError('Geçerli bir şube seçin.');
      user = { ...user, branchId: branch.id };
    }
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
        password: user.password,
        branchId: user.branchId || null,
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
    let branchId = user.branchId || null;
    if (user.branch && user.branch !== 'Tüm Şubeler') {
      const {data:branch,error}=await supabase.from('branches').select('id').eq('name',user.branch).single();
      if(error || !branch) throw new DatabaseError('Geçerli bir şube seçin.');
      branchId=branch.id;
    }
    if(user.branch==='Tüm Şubeler') branchId=null;
    const { data, error } = await supabase
      .from('memberships')
      .update({
        roles: user.roles,
        branch_id: branchId,
        status: user.status === 'Pasif' ? 'inactive' : 'active',
        first_name: user.firstName,
        last_name: user.lastName,
        phone: user.phone
      })
      .eq('id', id)
      .select('*, branches(name)');

    if (error) throw error;
    if (!data?.[0]) throw new DatabaseError('Üyelik güncellenemedi.');
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
      .update({ status: 'inactive' })
      .eq('id', id);

    if (error) throw error;
  }, 'dbDeleteMembership');
};
