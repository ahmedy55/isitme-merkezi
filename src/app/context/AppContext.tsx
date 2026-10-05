'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect, useRef } from 'react';
import {
  Patient, Appointment, StockItem, SaleRecord, RecallItem,
  Supplier, Expense, SystemUser, AuditLogEntry, Branch, SupplierPurchase
} from '../data/mockData';
import { supabase } from '../lib/supabase';
import { logger } from '../lib/logger';
import { StockDomainService } from '../services/StockDomainService';
import { ServiceDomainService } from '../services/ServiceDomainService';
import { EventBus } from '../services/EventBus';
import { validateAppointmentDateTime } from '../lib/validation';
import {
  dbFetchPatients, dbFetchPatientTimeline, dbInsertPatientTimeline, dbInsertPatient, dbUpdatePatient, dbDeletePatient,
  dbFetchAppointments, dbInsertAppointment, dbUpdateAppointment, dbUpdateAppointmentStatus,
  dbFetchStockItems, dbInsertStockItem, dbUpdateStockItem, dbDeleteStockItem,
  dbAdjustStockItem,
  dbFetchSales, dbInsertSale,
  dbFetchRecallItems, dbInsertRecallItem, dbUpdateRecallStatus,
  dbFetchSuppliers, dbInsertSupplier, dbUpdateSupplier, dbDeleteSupplier,
  dbFetchExpenses, dbInsertExpense, dbUpdateExpense, dbDeleteExpense,
  dbFetchBranches, dbInsertBranch, dbUpdateBranch,
  dbFetchAuditLogs, dbInsertAuditLog,
  dbFetchMemberships, dbInsertMembership, dbUpdateMembership, dbDeleteMembership,
  dbFetchCashTransactions, dbInsertCashTransaction, dbInsertStockMovement
} from '../lib/database';

type Page = 
  | 'dashboard'
  | 'patients'
  | 'patient-detail'
  | 'appointments'
  | 'recall'
  | 'sgk'
  | 'stock'
  | 'cash'
  | 'service'
  | 'reports'
  | 'branches'
  | 'settings'
  | 'suppliers'
  | 'expenses'
  | 'audit-log'
  | 'sgk-receivables'
  | 'assets'
  | 'support'
  | 'activity-log'
  | 'branch-activities'
  | 'profile'
  | 'login'
  | 'org-select';

interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
}

interface AppContextType {
  currentPage: Page;
  setCurrentPage: (page: Page | ((prev: Page) => Page), replace?: boolean) => void;
  selectedPatientId: string | null;
  setSelectedPatientId: (id: string | null) => void;
  appointmentCreatePatientId: string | null;
  requestAppointmentCreation: (patientId: string) => void;
  clearAppointmentCreationRequest: () => void;
  activeDetailTab: string;
  setActiveDetailTab: (tab: string) => void;
  showModal: string | null;
  setShowModal: (modal: string | null) => void;
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  
  // Auth Eyaletleri
  currentUser: any;
  currentOrgId: string | null;
  currentOrg?: any;
  logout: () => Promise<void>;
  loggingOut: boolean;
  dataLoading: boolean;
  refreshOrganizationData: () => Promise<void>;
  
  // Dinamik Veri Eyaletleri
  patientsList: Patient[];
  loadPatientTimeline: (patientId: string) => Promise<void>;
  appointmentsList: Appointment[];
  stockList: StockItem[];
  salesList: SaleRecord[];
  recallList: RecallItem[];
  suppliersList: Supplier[];
  expensesList: Expense[];
  usersList: SystemUser[];
  auditLogList: AuditLogEntry[];
  branchesList: Branch[];
  
  // Veri Güncelleme Metotları
  addPatient: (patient: Patient) => Promise<void>;
  updatePatient: (patient: Patient) => void;
  deletePatient: (id: string) => Promise<boolean>;
  addAppointment: (appointment: Appointment) => Promise<void>;
  updateAppointment: (appointment: Appointment) => Promise<boolean>;
  updateAppointmentStatus: (id: string, status: Appointment['status']) => Promise<boolean>;
  addSale: (sale: SaleRecord, stockItemId?: string, cashRegisterId?: string) => Promise<void>;
  addSupplierPurchaseTransaction: (supplierId: string, purchase: SupplierPurchase, cashRegisterId?: string) => Promise<void>;
  approveSGKPrescription: (patientId: string, prescriptionNo: string, reportNo: string) => Promise<void>;
  completeServiceTicket: (ticketId: string, patientName: string, serviceFee: number, partsUsed?: { stockItemId: string; stockItemName: string; quantity: number; price: number }[], cashRegisterId?: string, branchId?: string) => Promise<void>;
  addStockItem: (item: StockItem) => Promise<StockItem>;
  updateStockItem: (item: StockItem) => Promise<void>;
  adjustStockItem: (itemId: string, delta: number, reason: string, notes?: string, isLoss?: boolean) => Promise<void>;
  deleteStockItem: (id: string) => void;
  updateRecallItemStatus: (id: string, status: RecallItem['status']) => void;
  addRecallItem: (item: RecallItem) => Promise<void>;
  
  // P0 — Tedarikçi
  addSupplier: (supplier: Supplier) => void;
  updateSupplier: (supplier: Supplier) => void;
  deleteSupplier: (id: string) => void;
  
  // P0 — Masraf
  addExpense: (expense: Expense, cashRegisterId?: string) => Promise<void>;
  updateExpense: (expense: Expense) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
  
  // P0 — Kullanıcı
  addUser: (user: SystemUser) => void;
  updateUser: (user: SystemUser) => void;
  deleteUser: (id: string) => void;
  
  // Şube
  addBranch: (branch: Branch) => void;
  updateBranch: (branch: Branch) => void;
  
  // Ayarlar Parametreleri
  commissionRate: number;
  setCommissionRate: (rate: number) => void;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [currentPage, setCurrentPageState] = useState<Page>('login');
  const currentPageRef = useRef<Page>('login');
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [appointmentCreatePatientId, setAppointmentCreatePatientId] = useState<string | null>(null);
  const [activeDetailTab, setActiveDetailTab] = useState<string>('genel');
  const [showModal, setShowModal] = useState<string | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Tarayıcı Geri/İleri butonları & URL Hash (#page) entegrasyonu
  const setCurrentPage = (pageOrFn: Page | ((prev: Page) => Page), replace = false) => {
    const nextPage = typeof pageOrFn === 'function' ? pageOrFn(currentPageRef.current) : pageOrFn;
    currentPageRef.current = nextPage;
    setCurrentPageState(nextPage);
    if (typeof window !== 'undefined') {
      const hash = `#${nextPage}`;
      if (window.location.hash !== hash) {
        if (replace) {
          window.history.replaceState({ page: nextPage }, '', hash);
        } else {
          window.history.pushState({ page: nextPage }, '', hash);
        }
      }
    }
  };

  const requestAppointmentCreation = (patientId: string) => setAppointmentCreatePatientId(patientId);
  const clearAppointmentCreationRequest = () => setAppointmentCreatePatientId(null);

  // Tarayıcının Geri (<-) / İleri (->) butonlarına tıklandığında sayfayı değiştir
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handlePopState = (e: PopStateEvent) => {
      const hash = window.location.hash.replace('#', '') as Page;
      if (hash) {
        currentPageRef.current = hash;
        setCurrentPageState(hash);
      } else if (e.state?.page) {
        currentPageRef.current = e.state.page;
        setCurrentPageState(e.state.page);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Veri Listeleri State
  // Tenant data starts empty and is populated only after an authenticated organization is selected.
  const [patientsList, setPatientsList] = useState<Patient[]>([]);
  const [appointmentsList, setAppointmentsList] = useState<Appointment[]>([]);
  const [stockList, setStockList] = useState<StockItem[]>([]);
  const [salesList, setSalesList] = useState<SaleRecord[]>([]);
  const [recallList, setRecallList] = useState<RecallItem[]>([]);
  const [suppliersList, setSuppliersList] = useState<Supplier[]>([]);
  const [expensesList, setExpensesList] = useState<Expense[]>([]);
  const [usersList, setUsersList] = useState<SystemUser[]>([]);
  const [auditLogList, setAuditLogList] = useState<AuditLogEntry[]>([]);
  const [branchesList, setBranchesList] = useState<Branch[]>([]);

  // Auth Eyaletleri State
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [currentOrgId, setCurrentOrgId] = useState<string | null>(null);
  const [currentOrg, setCurrentOrg] = useState<any>(null);
  const [dataLoading, setDataLoading] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const dataGeneration = useRef(0);
  const identityRef = useRef('');
  const clearTenantData = () => {
    setPatientsList([]); setAppointmentsList([]); setStockList([]); setSalesList([]);
    setRecallList([]); setSuppliersList([]); setExpensesList([]); setBranchesList([]);
    setAuditLogList([]); setUsersList([]); setCurrentOrg(null); setSelectedPatientId(null);
  };
  const [commissionRate, setCommissionRate] = useState(3);

  // Supabase'den tüm verileri tek hamlede çek
  const loadAllData = async () => {
    const generation = dataGeneration.current;
    setDataLoading(true);
    try {
      if (currentOrgId) {
        const { data: orgData } = await supabase
          .from('organizations')
          .select('*')
          .eq('id', currentOrgId)
          .maybeSingle();
        if (orgData && generation === dataGeneration.current) setCurrentOrg(orgData);
      }

      const [
        patients,
        appointments,
        stock,
        sales,
        recall,
        suppliers,
        expenses,
        branches,
        auditLogs,
        users
      ] = await Promise.all([
        dbFetchPatients(),
        dbFetchAppointments(),
        dbFetchStockItems(),
        dbFetchSales(),
        dbFetchRecallItems(),
        dbFetchSuppliers(),
        dbFetchExpenses(),
        dbFetchBranches(),
        dbFetchAuditLogs(),
        dbFetchMemberships()
      ]);

      if (generation !== dataGeneration.current) return;
      setPatientsList(patients);
      setAppointmentsList(appointments);
      setStockList(stock);
      setSalesList(sales);
      setRecallList(recall);
      setSuppliersList(suppliers);
      setExpensesList(expenses);
      setBranchesList(branches);
      setAuditLogList(auditLogs);
      setUsersList(users);
    } catch {
      console.error('Klinik verileri yüklenemedi.');
      addToast({ type: 'error', message: 'Klinik verileri veritabanından çekilemedi.' });
    } finally {
      if (generation === dataGeneration.current) setDataLoading(false);
    }
  };
  const refreshOrganizationData = async () => {
    if (currentOrgId) await loadAllData();
  };

  // Fix #1: Organizasyon seçimi değiştiğinde verileri otomatik yükle
  useEffect(() => {
    if (currentOrgId) {
      clearTenantData();
      loadAllData();
    } else {
      clearTenantData();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentOrgId, currentUser?.membership?.branch_id, JSON.stringify(currentUser?.membership?.roles)]);

  // Resolve the authenticated user and active organization before loading tenant data.
  useEffect(() => {
    let disposed = false;
    let authVersion = 0;
    const applySession = async (user: any) => {
      const version = ++authVersion;
      let membership = null;
      const orgId = user?.app_metadata?.organization_id;
      if (user && orgId) {
        const {data,error}=await supabase.from('memberships').select('organization_id,branch_id,roles,status')
          .eq('user_id',user.id).eq('organization_id',orgId).eq('status','active').maybeSingle();
        if (!error) membership=data;
      }
      if (disposed || version !== authVersion) return;
      const nextOrg=membership && (membership.roles.includes('Firma Yöneticisi') || membership.branch_id) ? orgId : null;
      const identity=JSON.stringify([user?.id,nextOrg,membership]);
      if (identity !== identityRef.current) {
        dataGeneration.current++; identityRef.current=identity; clearTenantData();
      }
      setCurrentUser(user ? {...user,membership} : null);
      setCurrentOrgId(nextOrg);
      if (!user) setCurrentPage('login');
      else if (!nextOrg) setCurrentPage('org-select',true);
      else setCurrentPage((prev: Page)=>(prev==='login'||prev==='org-select'?'dashboard':prev));
    };
    supabase.auth.getUser().then(({data})=>applySession(data.user));
    // Do not await Supabase queries inside its Auth callback (auth lock deadlock).
    const {data:{subscription}}=supabase.auth.onAuthStateChange((_event,session)=>{
      setTimeout(()=>{ if(!disposed) void applySession(session?.user || null); },0);
    });

    return () => {
      disposed = true;
      subscription.unsubscribe();
    };
  }, []);

  const logout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      dataGeneration.current++;
      clearTenantData();
      setCurrentUser(null);
      setCurrentOrgId(null);
      setCurrentPage('login');
      addToast({ type: 'success', message: 'Güvenli çıkış yapıldı.' });
    } catch (error) {
      logger.warn(`Oturum kapatılamadı: ${String(error)}`, 'AppContext');
      addToast({ type: 'error', message: 'Çıkış yapılamadı. Bağlantınızı kontrol edip tekrar deneyin.' });
    } finally {
      setLoggingOut(false);
    }
  };

  const toggleSidebar = () => setSidebarOpen(prev => !prev);

  const addToast = (toast: Omit<Toast, 'id'>) => {
    const id = typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    setToasts(prev => [...prev, { ...toast, id }]);
    setTimeout(() => removeToast(id), 4000);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const requireActiveOrganization = () => {
    if (!currentOrgId) throw new Error('Veri kaydetmek için oturum açıp aktif bir firma seçin.');
  };



  // Metotlar
  const addPatient = async (patient: Patient) => {
    requireActiveOrganization();
    if (currentOrg && currentOrg.plan_type === 'trial' && patientsList.length >= 50) {
      addToast({
        type: 'warning',
        message: 'Deneme sürümü (Trial) hasta limitinize ulaştınız (Maksimum 50 hasta). Üst pakete geçmek için SaaS yöneticiniz ile iletişime geçin.'
      });
      throw new Error('Deneme paketi hasta kayıt limitine ulaştı.');
    }
    if (currentOrgId) {
      let created: Patient;
      try {
        created = await dbInsertPatient(patient);
        setPatientsList(prev => [created, ...prev]);
        addToast({ type: 'success', message: 'Hasta başarıyla eklendi.' });
      } catch (err: any) {
        addToast({ type: 'error', message: `Hasta eklenemedi: ${err.message}` });
        throw err;
      }
      try { await dbInsertAuditLog({ action: 'Hasta Ekleme', module: 'Hastalar', description: `${patient.firstName} ${patient.lastName} eklendi.` }); }
      catch (auditError: any) { logger.warn(`Hasta denetim kaydı yazılamadı: ${auditError.message}`, 'AppContext'); }
    }
  };

  const updatePatient = async (updatedPatient: Patient) => {
    requireActiveOrganization();
    if (!updatedPatient.id) throw new Error('Hasta kaydı kimliği zorunludur.');
    const existingTimeline = patientsList.find(patient => patient.id === updatedPatient.id)?.timeline || [];
    const existingTimelineKeys = new Set(existingTimeline.map(event => `${event.id || ''}|${event.date}|${event.icon}|${event.action}`));
    const newEvents = (updatedPatient.timeline || []).filter(event =>
      !existingTimelineKeys.has(`${event.id || ''}|${event.date}|${event.icon}|${event.action}`),
    );
    try {
      const saved = await dbUpdatePatient(updatedPatient.id, updatedPatient);
      const insertedEvents = [];
      for (const event of newEvents) insertedEvents.push(await dbInsertPatientTimeline(updatedPatient.id, event));
      const savedPatient = { ...saved, timeline: [...insertedEvents, ...existingTimeline] } as Patient;
      setPatientsList(prev => prev.map(patient => patient.id === savedPatient.id ? savedPatient : patient));
      addToast({ type: 'success', message: 'Hasta bilgileri güncellendi.' });
    } catch (err: any) {
      addToast({ type: 'error', message: `Hasta bilgileri kaydedilemedi: ${err.message}` });
      return;
    }
    try { await dbInsertAuditLog({ action: 'Hasta Güncelleme', module: 'Hastalar', description: `${updatedPatient.firstName} ${updatedPatient.lastName} güncellendi.` }); }
    catch (err: any) { logger.warn(`Hasta güncelleme denetim kaydı yazılamadı: ${err.message}`, 'AppContext'); }
  };

  const loadPatientTimeline = async (patientId: string) => {
    requireActiveOrganization();
    try {
      const timeline = await dbFetchPatientTimeline(patientId);
      const serverKeys = new Set(timeline.map(event => `${event.id || ''}|${event.date}|${event.icon}|${event.action}`));
      setPatientsList(prev => prev.map(patient => {
        if (patient.id !== patientId) return patient;
        const localOnly = (patient.timeline || []).filter(event =>
          !serverKeys.has(`${event.id || ''}|${event.date}|${event.icon}|${event.action}`),
        );
        return { ...patient, timeline: [...localOnly, ...timeline] };
      }));
    } catch (err: any) {
      addToast({ type: 'error', message: 'Hasta işlem geçmişi yüklenemedi.' });
      logger.warn(`Hasta zaman çizelgesi yüklenemedi: ${err.message}`, 'AppContext');
    }
  };

  const deletePatient = async (id: string) => {
    requireActiveOrganization();
    const patient = patientsList.find(item => item.id === id);
    if (!patient) {
      addToast({ type: 'error', message: 'Hasta kaydı bulunamadı.' });
      return false;
    }

    try {
      await dbDeletePatient(id);
      try {
        await dbInsertAuditLog({ action: 'Hasta Silme', module: 'Hastalar', description: `${patient.firstName} ${patient.lastName} silindi.` });
      } catch (auditError: any) {
        logger.warn(`Hasta silme denetim kaydı yazılamadı: ${auditError.message}`, 'AppContext');
      }
    } catch (err: any) {
      addToast({ type: 'error', message: `Hasta silinemedi: ${err.message}` });
      return false;
    }

    setPatientsList(prev => prev.filter(item => item.id !== id));
    setSelectedPatientId(prev => prev === id ? null : prev);
    addToast({ type: 'success', message: `${patient.firstName} ${patient.lastName} başarıyla silindi.` });
    return true;
  };

  const addAppointment = async (appointment: Appointment) => {
    requireActiveOrganization();
    const appointmentValidation = validateAppointmentDateTime(appointment.date, appointment.time);
    if (!appointmentValidation.isValid) {
      const message = appointmentValidation.error || 'Geçmiş bir saate randevu oluşturulamaz.';
      addToast({ type: 'error', message });
      throw new Error(message);
    }
    try {
        const created = await dbInsertAppointment(appointment);
        const pat = patientsList.find(p => p.id === appointment.patientId);
        const patientName = pat ? `${pat.firstName} ${pat.lastName}` : 'Bilinmeyen Hasta';
        const createdWithPatName = { ...created, patientName };

        setAppointmentsList(prev => [...prev, createdWithPatName]);
        addToast({ type: 'success', message: 'Randevu başarıyla oluşturuldu.' });
        try { await dbInsertAuditLog({ action: 'Randevu Ekleme', module: 'Randevular', description: `Randevu tarihi: ${appointment.date}` }); }
        catch (auditError: any) { logger.warn(`Randevu denetim kaydı yazılamadı: ${auditError.message}`, 'AppContext'); }
      } catch (err: any) {
        addToast({ type: 'error', message: `Randevu eklenemedi: ${err.message}` });
        throw err;
    }
  };

  const updateAppointment = async (appointment: Appointment) => {
    requireActiveOrganization();
    const existing = appointmentsList.find(item => item.id === appointment.id);
    if (!existing) {
      addToast({ type: 'error', message: 'Düzenlenecek randevu bulunamadı.' });
      return false;
    }
    const appointmentValidation = validateAppointmentDateTime(appointment.date, appointment.time);
    const scheduleChanged = existing.date !== appointment.date || existing.time !== appointment.time;
    if (!appointmentValidation.isValid && scheduleChanged) {
      addToast({ type: 'error', message: appointmentValidation.error || 'Geçmiş bir saate randevu oluşturulamaz.' });
      return false;
    }
    {
      try {
        const updated = await dbUpdateAppointment(appointment);
        setAppointmentsList(prev => prev.map(item => item.id === appointment.id ? { ...item, ...updated, patientName: appointment.patientName } : item));
      } catch (err: any) {
        logger.warn(`dbUpdateAppointment error: ${err.message}`, 'AppContext');
        addToast({ type: 'error', message: 'Randevu güncellenemedi. Lütfen tekrar deneyin.' });
        return false;
      }
    }
    addToast({ type: 'success', message: 'Randevu başarıyla güncellendi.' });
    return true;
  };

  const updateAppointmentStatus = async (id: string, status: Appointment['status']) => {
    requireActiveOrganization();
    const targetApt = appointmentsList.find(appointment => appointment.id === id);
    if (!targetApt || targetApt.status === status) return false;
    {
      try {
        await dbUpdateAppointmentStatus(id, status);
        setAppointmentsList(prev => prev.map(a => a.id === id ? { ...a, status } : a));
        addToast({ type: 'success', message: `Randevu durumu '${status}' olarak güncellendi.` });
        return true;
      } catch (err: any) {
        logger.warn(`dbUpdateAppointmentStatus background sync error: ${err.message}`, 'AppContext');
        addToast({ type: 'error', message: 'Randevu durumu kaydedilemedi. Lütfen tekrar deneyin.' });
        return false;
      }
    }
  };

  const addSale = async (sale: SaleRecord, stockItemId?: string, cashRegisterId?: string) => {
    try {
      requireActiveOrganization();
      sale.idempotencyKey ||= crypto.randomUUID();
      const created = await dbInsertSale(sale, stockItemId, cashRegisterId);
      setSalesList(prev => [created, ...prev.filter(item => item.id !== created.id)]);
      setStockList(await dbFetchStockItems());
      addToast({type:'success',message:'Satış başarıyla kaydedildi ve stoktan düşüldü.'});
    } catch (err: any) {
      addToast({type:'error',message:err.message || 'Satış kaydedilemedi.'});
      throw err;
    }
  };

  const addSupplierPurchaseTransaction = async (supplierId: string, purchase: SupplierPurchase, cashRegisterId?: string) => {
    try {
      // Purchases currently have no server-side transaction/RPC. Never simulate
      // stock, supplier debt, or cash changes against a live organization.
      requireActiveOrganization();
      void supplierId;
      void purchase;
      void cashRegisterId;
      throw new Error('Tedarikçi alış faturası için atomik veritabanı işlemi henüz uygulanmadı. Kayıt yapılmadı.');
    } catch (err: any) {
      addToast({ type: 'error', message: `Alış faturası işlenemedi: ${err.message}` });
      throw err;
    }
  };

  const approveSGKPrescription = async (patientId: string, prescriptionNo: string, reportNo: string) => {
    requireActiveOrganization();
    const patient = patientsList.find(item => item.id === patientId);
    if (!patient) throw new Error('Hasta kaydı bulunamadı.');
    if (!prescriptionNo.trim() || !reportNo.trim()) throw new Error('Reçete ve rapor numarası zorunludur.');
    const updatedPatient = { ...patient, prescriptionNo: prescriptionNo.trim(), reportNo: reportNo.trim() };
    if (currentOrgId) await dbUpdatePatient(patientId, updatedPatient);
    setPatientsList(previous => previous.map(item => item.id === patientId ? updatedPatient : item));
    addToast({ type: 'success', message: 'Reçete ve rapor numarası hasta kaydına eklendi. SGK/Medula uygunluk onayı verilmedi.' });
  };

  const completeServiceTicket = async (
    ticketId: string,
    patientName: string,
    serviceFee: number,
    partsUsed: { stockItemId: string; stockItemName: string; quantity: number; price: number }[] = [],
    cashRegisterId?: string,
    branchId?: string
  ) => {
    try {
      requireActiveOrganization();
      const result = await ServiceDomainService.completeServiceTicket(stockList, {
        ticketId,
        patientName,
        serviceFee,
        partsUsed,
        cashRegisterId,
        branchId,
        organizationId: currentOrgId || undefined
      });

      if (currentOrgId && serviceFee > 0) {
        if (!branchId) throw new Error('Servis kaydının şube bilgisi eksik; tahsilat kaydedilemedi.');
        const transactions = await dbFetchCashTransactions();
        const alreadyRecorded = transactions.some((transaction: Record<string, unknown>) => transaction.referenceEntity === 'service' && transaction.referenceId === ticketId && transaction.type === 'INCOME');
        if (!alreadyRecorded) {
          await dbInsertCashTransaction({
            cashRegisterId: cashRegisterId || 'kas-1', type: 'INCOME', amount: serviceFee,
            category: 'Servis Geliri', referenceEntity: 'service', referenceId: ticketId,
            branchId, description: `${patientName} — Teknik servis ücreti`,
            idempotencyKey: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : undefined,
          });
        }
      }

      setStockList(result.updatedStockList);
      addToast({ type: 'success', message: 'Teknik servis işlemi kapatıldı, kullanılan parçalar stoktan düşüldü.' });
    } catch (err: any) {
      addToast({ type: 'error', message: `Teknik servis kapatılamadı: ${err.message}` });
      throw err;
    }
  };

  const addStockItem = async (item: StockItem): Promise<StockItem> => {
    requireActiveOrganization();
    try {
      const created = await dbInsertStockItem(item);
      if (!created?.id) throw new Error('Ürün kaydı veritabanından doğrulanamadı.');
      setStockList(prev => [created, ...prev]);
      addToast({ type: 'success', message: 'Ürün envantere eklendi.' });
      return created;
    } catch (err: any) {
      addToast({ type: 'error', message: `Ürün eklenemedi: ${err.message}` });
      throw err;
    }
  };

  const updateStockItem = async (updatedItem: StockItem) => {
    requireActiveOrganization();
    if (!updatedItem.id) throw new Error('Stok kaydı kimliği zorunludur.');
    try {
      const saved = await dbUpdateStockItem(updatedItem.id, updatedItem);
      setStockList(prev => prev.map(s => s.id === saved.id ? saved : s));
      addToast({ type: 'success', message: 'Ürün bilgileri güncellendi.' });
    } catch (err: any) {
      logger.warn(`dbUpdateStockItem background sync error: ${err.message}`, 'AppContext');
      addToast({ type: 'error', message: 'Stok ürünü kaydedilemedi.' });
      throw err;
    }
  };

  const adjustStockItem = async (itemId: string, delta: number, reason: string, notes = '', isLoss = false) => {
    requireActiveOrganization();
    if (!Number.isInteger(delta) || delta === 0) throw new Error('Stok değişimi sıfırdan farklı tam sayı olmalıdır.');
    const saved = await dbAdjustStockItem(itemId, delta, reason, notes, isLoss);
    setStockList(previous => previous.map(item => item.id === itemId ? { ...item, quantity: saved.quantity, status: saved.status } : item));
  };

  // Fix #2: Stok silme artık DB'ye de yazılıyor
  const deleteStockItem = async (id: string) => {
    requireActiveOrganization();
    try {
      await dbDeleteStockItem(id);
      setStockList(prev => prev.filter(s => s.id !== id));
      addToast({ type: 'success', message: 'Ürün envanterden silindi.' });
      await dbInsertAuditLog({
        action: 'Stok Silme',
        module: 'Stok',
        description: `Stok ürünü (${id}) envanterden silindi.`
      });
    } catch (err: any) {
      logger.warn(`dbDeleteStockItem background sync error: ${err.message}`, 'AppContext');
      addToast({ type: 'error', message: 'Ürün silinemedi. Kayıt listede tutuldu.' });
      throw err;
    }
  };

  const updateRecallItemStatus = async (id: string, status: RecallItem['status']) => {
    requireActiveOrganization();
    try {
      await dbUpdateRecallStatus(id, status);
      setRecallList(prev => prev.map(r => r.id === id ? { ...r, status, lastContact: new Date().toISOString().split('T')[0] } : r));
      addToast({ type: 'success', message: 'Hatırlatma durumu güncellendi.' });
    } catch (err: any) {
      logger.warn(`dbUpdateRecallStatus background sync error: ${err.message}`, 'AppContext');
      addToast({ type: 'error', message: 'Hatırlatma kaydedilemedi. Lütfen tekrar deneyin.' });
      throw err;
    }
  };

  const addRecallItem = async (item: RecallItem) => {
    if (!currentOrgId) throw new Error('Hatırlatma oluşturmak için aktif firma oturumu gerekli.');
    try {
      const created = await dbInsertRecallItem(item);
      setRecallList(prev => [created, ...prev.filter(recall => recall.id !== created.id)]);
      addToast({ type: 'success', message: `${created.patientName} için hatırlatma kaydedildi.` });
      try {
        await dbInsertAuditLog({ action: 'Hatırlatma Ekleme', module: 'Recall', description: `${created.patientName} için ${created.reason} hatırlatması planlandı (${created.dueDate}).` });
      } catch (auditError: any) {
        logger.warn(`Hatırlatma denetim kaydı yazılamadı: ${auditError.message}`, 'AppContext');
      }
    } catch (err: any) {
      addToast({ type: 'error', message: `Hatırlatma kaydedilemedi: ${err.message}` });
      throw err;
    }
  };

  // P0 — Tedarikçi CRUD
  const addSupplier = async (supplier: Supplier) => {
    requireActiveOrganization();
    try {
      const created = await dbInsertSupplier(supplier);
      setSuppliersList(prev => [created, ...prev]);
      addToast({ type: 'success', message: 'Tedarikçi başarıyla eklendi.' });
    } catch (err: any) {
      addToast({ type: 'error', message: `Tedarikçi eklenemedi: ${err.message}` });
      throw err;
    }
  };
  const updateSupplier = async (updatedSupplier: Supplier) => {
    requireActiveOrganization();
    if (!updatedSupplier.id) throw new Error('Tedarikçi kaydı kimliği zorunludur.');
    try {
      const saved = await dbUpdateSupplier(updatedSupplier.id, updatedSupplier);
      if (!saved) throw new Error('Kayıt bulunamadı veya erişim yetkisi yok.');
      setSuppliersList(prev => prev.map(s => s.id === updatedSupplier.id ? saved : s));
      addToast({ type: 'success', message: 'Tedarikçi bilgileri güncellendi.' });
    } catch (err: any) {
      addToast({ type: 'error', message: `Tedarikçi güncellenemedi: ${err.message}` });
      throw err;
    }
  };
  const deleteSupplier = async (id: string) => {
    requireActiveOrganization();
    try {
      await dbDeleteSupplier(id);
      setSuppliersList(prev => prev.filter(s => s.id !== id));
      addToast({ type: 'success', message: 'Tedarikçi silindi.' });
    } catch (err: any) {
      addToast({ type: 'error', message: `Tedarikçi silinemedi: ${err.message}` });
      throw err;
    }
  };

  // P0 — Masraf CRUD
  // Fix #12: Interface artık cashRegisterId parametresini de kabul ediyor
  const addExpense = async (expense: Expense & { idempotencyKey?: string }, cashRegisterId?: string) => {
    try {
      requireActiveOrganization();
      const created = await dbInsertExpense({
        ...expense,
        idempotency_key: expense.idempotencyKey
      });
      setExpensesList(prev => [created, ...prev.filter(e => e.id !== created.id)]);
      addToast({ type: 'success', message: 'Gider ve kasa hareketi kaydedildi.' });
      await EventBus.publish({
        type: 'EXPENSE_CREATED',
        payload: created,
        timestamp: new Date().toISOString(),
        organizationId: currentOrgId || undefined
      });
    } catch (err: any) {
      addToast({ type: 'error', message: `Gider eklenemedi: ${err.message}` });
      throw err;
    }
  };
  const updateExpense = async (updatedExpense: Expense) => {
    requireActiveOrganization();
    if (!updatedExpense.id) throw new Error('Gider kaydı kimliği zorunludur.');
    try {
      const saved = await dbUpdateExpense(updatedExpense.id, updatedExpense);
      if (!saved) throw new Error('Kayıt bulunamadı.');
      setExpensesList(prev => prev.map(e => e.id === updatedExpense.id ? saved : e));
      addToast({ type: 'success', message: 'Gider ve kasa hareketi güncellendi.' });
    } catch (err: any) {
      logger.warn(`dbUpdateExpense background sync error: ${err.message}`, 'AppContext');
      addToast({ type: 'error', message: 'Gider güncellenemedi; kayıt değiştirilmedi.' });
      throw err;
    }
  };

  const deleteExpense = async (id: string) => {
    requireActiveOrganization();
    try {
      await dbDeleteExpense(id);
      setExpensesList(prev => prev.filter(e => e.id !== id));
      addToast({ type: 'success', message: 'Gider iptal edildi ve kasa düzeltildi.' });
    } catch (err: any) {
      logger.warn(`dbDeleteExpense background sync error: ${err.message}`, 'AppContext');
      addToast({ type: 'error', message: 'Gider iptal edilemedi; kayıt değiştirilmedi.' });
      throw err;
    }
  };

  // P0 — Kullanıcı / Üyelik (Memberships) CRUD
  const addUser = async (user: SystemUser) => {
    requireActiveOrganization();
    if (currentOrg && usersList.length >= (currentOrg.max_users || 5)) {
      addToast({
        type: 'warning',
        message: `Kullanıcı limitinize ulaştınız (Maksimum ${currentOrg.max_users} kullanıcı). Paketinizi yükseltmek için SaaS yöneticiniz ile iletişime geçin.`
      });
      return;
    }
    try {
      const created = await dbInsertMembership(user);
      setUsersList(prev => [created, ...prev]);
      addToast({ type: 'success', message: 'Personel / Üye başarıyla davet edildi.' });
      await dbInsertAuditLog({
        action: 'Kullanıcı Ekledi',
        module: 'Kullanıcı Yönetimi',
        description: `${user.firstName} ${user.lastName} (${user.roles.join(', ')}) ekleme işlemi yapıldı.`
      });
    } catch (err: any) {
      addToast({ type: 'error', message: `Kullanıcı eklenemedi: ${err.message}` });
      throw err;
    }
  };

  const updateUser = async (updatedUser: SystemUser) => {
    requireActiveOrganization();
    try {
      await dbUpdateMembership(updatedUser.id,updatedUser);
      setUsersList(prev=>prev.map(u=>u.id===updatedUser.id?updatedUser:u));
      addToast({type:'success',message:'Kullanıcı güncellendi.'});
    } catch(err: any){addToast({type:'error',message:err.message});throw err;}
  };
  const deleteUser = async (id: string) => {
    requireActiveOrganization();
    try {
      await dbDeleteMembership(id);
      setUsersList(prev=>prev.filter(u=>u.id!==id));
      addToast({type:'success',message:'Üyelik kaldırıldı.'});
    } catch(err: any){addToast({type:'error',message:err.message});throw err;}
  };

  // Şube CRUD
  const addBranch = async (branch: Branch) => {
    requireActiveOrganization();
    if (currentOrg && branchesList.length >= (currentOrg.max_branches || 2)) {
      addToast({
        type: 'warning',
        message: `Şube limitinize ulaştınız (Maksimum ${currentOrg.max_branches} şube). Paketinizi yükseltmek için SaaS yöneticiniz ile iletişime geçin.`
      });
      return;
    }
    try {
      const created = await dbInsertBranch(branch);
      setBranchesList(prev => [...prev, created]);
      addToast({ type: 'success', message: 'Şube başarıyla oluşturuldu.' });
    } catch (err: any) {
      addToast({ type: 'error', message: `Şube oluşturulamadı: ${err.message}` });
      throw err;
    }
  };

  const updateBranch = async (updatedBranch: Branch) => {
    requireActiveOrganization();
    if (!updatedBranch.id) throw new Error('Şube kaydı kimliği zorunludur.');
    try {
      const saved = await dbUpdateBranch(updatedBranch.id, updatedBranch);
      if (!saved) throw new Error('Kayıt bulunamadı veya erişim yetkisi yok.');
      setBranchesList(prev => prev.map(b => b.id === updatedBranch.id ? saved : b));
      addToast({ type: 'success', message: 'Şube bilgileri güncellendi.' });
    } catch (err: any) {
      addToast({ type: 'error', message: `Şube bilgileri kaydedilemedi: ${err.message}` });
      throw err;
    }
  };

  return (
    <AppContext.Provider value={{
      currentPage,
      setCurrentPage,
      selectedPatientId,
      setSelectedPatientId,
      appointmentCreatePatientId,
      requestAppointmentCreation,
      clearAppointmentCreationRequest,
      activeDetailTab,
      setActiveDetailTab,
      showModal,
      setShowModal,
      toasts,
      addToast,
      removeToast,
      sidebarOpen,
      setSidebarOpen,
      toggleSidebar,
      
      currentUser,
      currentOrgId,
      currentOrg,
      logout,
      loggingOut,
      dataLoading,
      refreshOrganizationData,
      
      patientsList,
      loadPatientTimeline,
      appointmentsList,
      stockList,
      salesList,
      recallList,
      suppliersList,
      expensesList,
      usersList,
      auditLogList,
      branchesList,
      
      addPatient,
      updatePatient,
      deletePatient,
      addAppointment,
      updateAppointment,
      updateAppointmentStatus,
      addSale,
      addSupplierPurchaseTransaction,
      approveSGKPrescription,
      completeServiceTicket,
      addStockItem,
      updateStockItem,
      adjustStockItem,
      deleteStockItem,
      updateRecallItemStatus,
      addRecallItem,
      
      addSupplier,
      updateSupplier,
      deleteSupplier,
      addExpense,
      updateExpense,
      deleteExpense,
      addUser,
      updateUser,
      deleteUser,
      addBranch,
      updateBranch,
      
      commissionRate,
      setCommissionRate
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
}
