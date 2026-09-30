'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect, useRef } from 'react';
import {
  patients as initialPatients,
  appointments as initialAppointments,
  stockItems as initialStock,
  sales as initialSales,
  recallItems as initialRecall,
  suppliers as initialSuppliers,
  expenses as initialExpenses,
  systemUsers as initialUsers,
  auditLog as initialAuditLog,
  initialBranches,
  Patient, Appointment, StockItem, SaleRecord, RecallItem,
  Supplier, Expense, SystemUser, AuditLogEntry, Branch, SupplierPurchase
} from '../data/mockData';
import { supabase, isConfigured } from '../lib/supabase';
import { logger } from '../lib/logger';
import { SaleDomainService } from '../services/SaleDomainService';
import { StockDomainService } from '../services/StockDomainService';
import { CashDomainService } from '../services/CashDomainService';
import { PurchaseDomainService } from '../services/PurchaseDomainService';
import { ServiceDomainService } from '../services/ServiceDomainService';
import { EventBus } from '../services/EventBus';
import {
  dbFetchPatients, dbInsertPatient, dbUpdatePatient, dbDeletePatient,
  dbFetchAppointments, dbInsertAppointment, dbUpdateAppointmentStatus,
  dbFetchStockItems, dbInsertStockItem, dbUpdateStockItem, dbDeleteStockItem,
  dbAdjustStockItem,
  dbFetchSales, dbInsertSale,
  dbFetchRecallItems, dbUpdateRecallStatus,
  dbFetchSuppliers, dbInsertSupplier, dbUpdateSupplier, dbDeleteSupplier,
  dbFetchExpenses, dbInsertExpense, dbUpdateExpense, dbDeleteExpense,
  dbFetchBranches, dbInsertBranch, dbUpdateBranch,
  dbFetchAuditLogs, dbInsertAuditLog,
  dbFetchMemberships, dbInsertMembership, dbUpdateMembership, dbDeleteMembership,
  dbInsertCashTransaction, dbInsertStockMovement
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
  startDemoSession: () => void;
  dataLoading: boolean;
  refreshOrganizationData: () => Promise<void>;
  
  // Dinamik Veri Eyaletleri
  patientsList: Patient[];
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
  updateAppointmentStatus: (id: string, status: Appointment['status']) => Promise<boolean>;
  addSale: (sale: SaleRecord, stockItemId?: string, cashRegisterId?: string) => Promise<void>;
  addSupplierPurchaseTransaction: (supplierId: string, purchase: SupplierPurchase, cashRegisterId?: string) => Promise<void>;
  approveSGKPrescription: (patientId: string, prescriptionNo: string, reportNo: string) => Promise<void>;
  completeServiceTicket: (ticketId: string, patientName: string, serviceFee: number, partsUsed?: { stockItemId: string; stockItemName: string; quantity: number; price: number }[], cashRegisterId?: string) => Promise<void>;
  addStockItem: (item: StockItem) => Promise<void>;
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
  
  // Demo ve Ayarlar Parametreleri
  demoModeActive: boolean;
  commissionRate: number;
  setCommissionRate: (rate: number) => void;
}

const AppContext = createContext<AppContextType | null>(null);

const fallbackDemoBranches: Branch[] = [
  { id: 'demo-branch-1', name: 'Merkez 1', address: '', phone: '', patientsCount: 0, status: 'Aktif' },
  { id: 'demo-branch-2', name: 'Merkez 2', address: '', phone: '', patientsCount: 0, status: 'Aktif' },
];

export function AppProvider({ children }: { children: ReactNode }) {
  const [currentPage, setCurrentPageState] = useState<Page>('login');
  const currentPageRef = useRef<Page>('login');
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
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
  // Fix #1: State boş başlar, mock data sadece demo modda (orgId yoksa) yüklenir
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
  const [mockDataLoaded, setMockDataLoaded] = useState(false);

  // Auth Eyaletleri State
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [currentOrgId, setCurrentOrgId] = useState<string | null>(null);
  const [currentOrg, setCurrentOrg] = useState<any>(null);
  const [dataLoading, setDataLoading] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  // Demo Ayarları — orgId ve Supabase bağlantısı yoksa demo modda çalış
  const demoModeActive = !isConfigured || process.env.NEXT_PUBLIC_DEMO_MODE === 'true' || !currentOrgId;
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
    } else if (demoModeActive && !mockDataLoaded) {
      clearTenantData();
      // Demo mod: orgId yoksa mock veriyi yükle (sadece bir kez)
      const singleBranchDemo = process.env.NEXT_PUBLIC_DEMO_BRANCH_COUNT === '1';
      const demoBranches = initialBranches.length > 0 ? initialBranches : fallbackDemoBranches;
      const demoBranch = singleBranchDemo ? { ...demoBranches[0], name: 'İşitme Merkezi' } : null;
      const demoBranchId = demoBranch?.id;
      const demoBranchName = demoBranch?.name;
      setPatientsList(singleBranchDemo ? initialPatients.map(patient => ({ ...patient, branchId: demoBranchId, branch: demoBranchName })) : initialPatients);
      setAppointmentsList(singleBranchDemo ? initialAppointments.map(appointment => ({ ...appointment, branchId: demoBranchId, branch: demoBranchName! })) : initialAppointments);
      setStockList(singleBranchDemo ? initialStock.map(item => ({ ...item, branchId: demoBranchId, branch: demoBranchName! })) : initialStock);
      setSalesList(singleBranchDemo ? initialSales.map(sale => ({ ...sale, branchId: demoBranchId })) : initialSales);
      setRecallList(initialRecall);
      setSuppliersList(initialSuppliers);
      setExpensesList(singleBranchDemo ? initialExpenses.map(expense => expense.branch === 'Genel' ? expense : { ...expense, branch: demoBranchName!, branchId: demoBranchId }) : initialExpenses);
      setUsersList(initialUsers);
      setAuditLogList(initialAuditLog);
      setBranchesList(singleBranchDemo && demoBranch ? [demoBranch] : demoBranches);
      setMockDataLoaded(true);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentOrgId, currentUser?.membership?.branch_id, JSON.stringify(currentUser?.membership?.roles)]);

  // Fix #1: İlk yüklemede Auth kontrolü yap (mock data yukarıda orgId yoksa yüklenir)
  useEffect(() => {
    let disposed = false;
    let authVersion = 0;
    const applySession = async (user: any) => {
      if (demoModeActive && !user) return;
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
      if (currentUser?.id !== 'demo-user') {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
      }
      dataGeneration.current++;
      clearTenantData();
      setMockDataLoaded(false);
      setCurrentUser(null);
      setCurrentOrgId(null);
      setCurrentPage('login');
      addToast({ type: 'success', message: currentUser?.id === 'demo-user' ? 'Demo oturumundan çıkış yapıldı.' : 'Güvenli çıkış yapıldı.' });
    } catch (error) {
      logger.warn(`Oturum kapatılamadı: ${String(error)}`, 'AppContext');
      addToast({ type: 'error', message: 'Çıkış yapılamadı. Bağlantınızı kontrol edip tekrar deneyin.' });
    } finally {
      setLoggingOut(false);
    }
  };

  const startDemoSession = () => {
    if (!demoModeActive) return;
    setCurrentUser({
      id: 'demo-user',
      email: 'demo@audipro.local',
      user_metadata: { full_name: 'Demo Kullanıcısı' },
      membership: { roles: ['Firma Yöneticisi'], branch_id: process.env.NEXT_PUBLIC_DEMO_BRANCH_COUNT === '1' ? (initialBranches[0]?.id || fallbackDemoBranches[0].id) : undefined }
    });
    setCurrentPage('dashboard');
  };

  const toggleSidebar = () => setSidebarOpen(prev => !prev);

  const addToast = (toast: Omit<Toast, 'id'>) => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { ...toast, id }]);
    setTimeout(() => removeToast(id), 4000);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };



  // Metotlar
  const addPatient = async (patient: Patient) => {
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
    } else {
      setPatientsList(prev => [patient, ...prev]);
      addToast({ type: 'success', message: `${patient.firstName} ${patient.lastName} hasta kaydı oluşturuldu.` });
      setAuditLogList(prev => [
        {
          id: `audit-${Date.now()}`,
          timestamp: new Date().toISOString(),
          userId: currentUser?.id || 'usr-admin',
          userName: currentUser?.user_metadata?.full_name || 'Ahmet Yılmaz',
          action: 'Ekleme',
          module: 'Hasta',
          description: `Yeni hasta eklendi: ${patient.firstName} ${patient.lastName}`,
          branchId: patient.branchId || 'merkez'
        },
        ...prev
      ]);
    }
  };

  const updatePatient = async (updatedPatient: Patient) => {
    if (currentOrgId && updatedPatient.id) {
      try {
        await dbUpdatePatient(updatedPatient.id, updatedPatient);
        setPatientsList(prev => prev.map(p => p.id === updatedPatient.id ? updatedPatient : p));
        addToast({ type: 'success', message: 'Hasta bilgileri güncellendi.' });
      } catch (err: any) {
        addToast({ type: 'error', message: `Hasta bilgileri kaydedilemedi: ${err.message}` });
        return;
      }
      try { await dbInsertAuditLog({ action: 'Hasta Güncelleme', module: 'Hastalar', description: `${updatedPatient.firstName} ${updatedPatient.lastName} güncellendi.` }); }
      catch (err: any) { logger.warn(`Hasta güncelleme denetim kaydı yazılamadı: ${err.message}`, 'AppContext'); }
    } else {
      setPatientsList(prev => prev.map(p => p.id === updatedPatient.id ? updatedPatient : p));
      addToast({ type: 'success', message: `${updatedPatient.firstName} ${updatedPatient.lastName} bilgileri güncellendi.` });
    }
  };

  const deletePatient = async (id: string) => {
    const patient = patientsList.find(item => item.id === id);
    if (!patient) {
      addToast({ type: 'error', message: 'Hasta kaydı bulunamadı.' });
      return false;
    }

    if (currentOrgId) {
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
    }

    setPatientsList(prev => prev.filter(item => item.id !== id));
    setSelectedPatientId(prev => prev === id ? null : prev);
    addToast({ type: 'success', message: `${patient.firstName} ${patient.lastName} başarıyla silindi.` });
    return true;
  };

  const addAppointment = async (appointment: Appointment) => {
    if (currentOrgId) {
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
    } else {
      const pat = patientsList.find(p => p.id === appointment.patientId);
      const patientName = pat ? `${pat.firstName} ${pat.lastName}` : (appointment.patientName || 'Hasta');
      const createdWithPatName = { ...appointment, patientName };
      setAppointmentsList(prev => [createdWithPatName, ...prev]);
      addToast({ type: 'success', message: `${patientName} için randevu oluşturuldu.` });
      setAuditLogList(prev => [
        {
          id: `audit-${Date.now()}`,
          timestamp: new Date().toISOString(),
          userId: currentUser?.id || 'usr-admin',
          userName: currentUser?.user_metadata?.full_name || 'Ahmet Yılmaz',
          action: 'Ekleme',
          module: 'Randevu',
          description: `Randevu planlandı: ${patientName} (${appointment.date} ${appointment.time})`,
          branchId: appointment.branchId || 'merkez'
        },
        ...prev
      ]);
    }
  };

  const updateAppointmentStatus = async (id: string, status: Appointment['status']) => {
    const targetApt = appointmentsList.find(appointment => appointment.id === id);
    if (!targetApt || targetApt.status === status) return false;
    if (currentOrgId) {
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
    } else {
      setAppointmentsList(prev => prev.map(a => a.id === id ? { ...a, status } : a));
      addToast({ type: 'success', message: `Randevu durumu '${status}' olarak güncellendi.` });

      // If status changed to 'Geldi', automatically spawn a 6-month recall opportunity
      if (status === 'Geldi' && targetApt) {
        const newRecall: RecallItem = {
          id: `rec-${Date.now()}`,
          patientId: targetApt.patientId,
          patientName: targetApt.patientName,
          reason: 'Yıllık Kontrol',
          dueDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          status: 'Bekliyor',
          lastContact: new Date().toISOString().split('T')[0],
          estimatedRevenue: 1500,
          probability: 'Yüksek Olasılık'
        };
        setRecallList(prev => [newRecall, ...prev]);
      }
      return true;
    }
  };

  const addSale = async (sale: SaleRecord, stockItemId?: string, cashRegisterId?: string) => {
    try {
      if (currentOrgId) {
        sale.idempotencyKey ||= crypto.randomUUID();
        const created=await dbInsertSale(sale,stockItemId,cashRegisterId);
        setSalesList(prev=>[created,...prev.filter(s=>s.id!==created.id)]);
        setStockList(await dbFetchStockItems());
      } else {
        const result=await SaleDomainService.executeSaleTransaction(stockList,{sale,stockItemId,cashRegisterId});
        setStockList(result.updatedStockList);
        setSalesList(prev=>[result.createdSale,...prev]);

        // Record Audit Log for the sale
        setAuditLogList(prev => [
          {
            id: `audit-${Date.now()}`,
            timestamp: new Date().toISOString(),
            userId: currentUser?.id || 'usr-admin',
            userName: currentUser?.user_metadata?.full_name || 'Ahmet Yılmaz',
            action: 'Satış',
            module: 'Kasa',
            description: `Satış: ${sale.patientName} adına ₺${sale.total.toLocaleString('tr-TR')} tahsilat yapıldı.`,
            branchId: sale.branchId || 'merkez'
          },
          ...prev
        ]);
      }
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
      if (currentOrgId) {
        throw new Error('Canlı alış faturası kaydı için atomik Supabase işlemi henüz hazır değil. Kayıt yapılmadı.');
      }
      if (!demoModeActive) throw new Error('Alış faturası için demo veya aktif firma gerekli.');
      const result = await PurchaseDomainService.executePurchaseTransaction(suppliersList, stockList, {
        supplierId,
        purchase,
        cashRegisterId,
      });

      setSuppliersList(result.updatedSuppliers);
      setStockList(result.updatedStockList);
      addToast({ type: 'success', message: 'Alış faturası kaydedildi, tedarikçi borcu ve stoklar güncellendi.' });
    } catch (err: any) {
      addToast({ type: 'error', message: `Alış faturası işlenemedi: ${err.message}` });
      throw err;
    }
  };

  const approveSGKPrescription = async (patientId: string, prescriptionNo: string, reportNo: string) => {
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
    cashRegisterId?: string
  ) => {
    try {
      const result = await ServiceDomainService.completeServiceTicket(stockList, {
        ticketId,
        patientName,
        serviceFee,
        partsUsed,
        cashRegisterId,
        organizationId: currentOrgId || undefined
      });

      setStockList(result.updatedStockList);
      addToast({ type: 'success', message: 'Teknik servis işlemi kapatıldı, kullanılan parçalar stoktan düşüldü.' });
    } catch (err: any) {
      addToast({ type: 'error', message: `Teknik servis kapatılamadı: ${err.message}` });
    }
  };

  const addStockItem = async (item: StockItem) => {
    if (currentOrgId) {
      try {
        const created = await dbInsertStockItem(item);
        setStockList(prev => [created, ...prev]);
        addToast({ type: 'success', message: 'Ürün envantere eklendi.' });
      } catch (err: any) {
        addToast({ type: 'error', message: `Ürün eklenemedi: ${err.message}` });
        throw err;
      }
    } else {
      setStockList(prev => [item, ...prev]);
    }
  };

  const updateStockItem = async (updatedItem: StockItem) => {
    if (currentOrgId && updatedItem.id) {
      try {
        const saved = await dbUpdateStockItem(updatedItem.id, updatedItem);
        setStockList(prev => prev.map(s => s.id === saved.id ? saved : s));
        addToast({ type: 'success', message: 'Ürün bilgileri güncellendi.' });
      } catch (err: any) {
        logger.warn(`dbUpdateStockItem background sync error: ${err.message}`, 'AppContext');
        addToast({ type: 'error', message: 'Stok ürünü kaydedilemedi.' });
        throw err;
      }
    } else if (demoModeActive) setStockList(prev => prev.map(s => s.id === updatedItem.id ? updatedItem : s));
  };

  const adjustStockItem = async (itemId: string, delta: number, reason: string, notes = '', isLoss = false) => {
    if (!Number.isInteger(delta) || delta === 0) throw new Error('Stok değişimi sıfırdan farklı tam sayı olmalıdır.');
    if (currentOrgId) {
      const saved = await dbAdjustStockItem(itemId, delta, reason, notes, isLoss);
      setStockList(previous => previous.map(item => item.id === itemId ? { ...item, quantity: saved.quantity, status: saved.status } : item));
    } else if (demoModeActive) {
      setStockList(previous => previous.map(item => item.id === itemId ? { ...item, quantity: item.quantity + delta } : item));
    } else throw new Error('Aktif firma gerekli.');
  };

  // Fix #2: Stok silme artık DB'ye de yazılıyor
  const deleteStockItem = async (id: string) => {
    if (currentOrgId) {
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
    } else if (demoModeActive) {
      setStockList(prev => prev.filter(s => s.id !== id));
      addToast({ type: 'success', message: 'Demo ürün envanterden silindi.' });
    }
  };

  const updateRecallItemStatus = async (id: string, status: RecallItem['status']) => {
    if (currentOrgId) {
      try {
        await dbUpdateRecallStatus(id, status);
        setRecallList(prev => prev.map(r => r.id === id ? { ...r, status, lastContact: new Date().toISOString().split('T')[0] } : r));
        addToast({ type: 'success', message: 'Hatırlatma durumu güncellendi.' });
      } catch (err: any) {
        logger.warn(`dbUpdateRecallStatus background sync error: ${err.message}`, 'AppContext');
        addToast({ type: 'error', message: 'Hatırlatma kaydedilemedi. Lütfen tekrar deneyin.' });
      }
    } else if (demoModeActive) {
      setRecallList(prev => prev.map(r => r.id === id ? { ...r, status, lastContact: new Date().toISOString().split('T')[0] } : r));
      addToast({ type: 'success', message: 'Demo hatırlatma durumu güncellendi.' });
    } else {
      addToast({ type: 'error', message: 'Hatırlatma güncellemek için aktif firma gerekli.' });
    }
  };

  const addRecallItem = async (item: RecallItem) => {
    setRecallList(prev => [item, ...prev]);
    const auditEntry: AuditLogEntry = {
      id: `aud-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
      userId: currentUser?.id || 'usr-admin',
      userName: currentUser?.name || 'Sistem Yöneticisi',
      module: 'Hasta',
      action: 'Ekleme',
      description: `${item.patientName} için ${item.reason} hatırlatması planlandı (Vade: ${item.dueDate}).`,
      details: `Vade: ${item.dueDate}`
    };
    setAuditLogList(prev => [auditEntry, ...prev]);
    addToast({ type: 'success', message: `${item.patientName} için hatırlatma kaydı oluşturuldu.` });
  };

  // P0 — Tedarikçi CRUD
  const addSupplier = async (supplier: Supplier) => {
    if (currentOrgId) {
      try {
        const created = await dbInsertSupplier(supplier);
        setSuppliersList(prev => [created, ...prev]);
        addToast({ type: 'success', message: 'Tedarikçi başarıyla eklendi.' });
      } catch (err: any) {
        addToast({ type: 'error', message: `Tedarikçi eklenemedi: ${err.message}` });
      }
    } else {
      setSuppliersList(prev => [supplier, ...prev]);
    }
  };
  const updateSupplier = async (updatedSupplier: Supplier) => {
    if (currentOrgId && updatedSupplier.id) {
      try {
        const saved = await dbUpdateSupplier(updatedSupplier.id, updatedSupplier);
        if (!saved) throw new Error('Kayıt bulunamadı veya erişim yetkisi yok.');
        setSuppliersList(prev => prev.map(s => s.id === updatedSupplier.id ? saved : s));
        addToast({ type: 'success', message: 'Tedarikçi bilgileri güncellendi.' });
      } catch (err: any) {
        addToast({ type: 'error', message: `Tedarikçi güncellenemedi: ${err.message}` });
      }
    } else if (demoModeActive) {
      setSuppliersList(prev => prev.map(s => s.id === updatedSupplier.id ? updatedSupplier : s));
    }
  };
  const deleteSupplier = async (id: string) => {
    if (currentOrgId) {
      try {
        await dbDeleteSupplier(id);
        setSuppliersList(prev => prev.filter(s => s.id !== id));
        addToast({ type: 'success', message: 'Tedarikçi silindi.' });
      } catch (err: any) {
        addToast({ type: 'error', message: `Tedarikçi silinemedi: ${err.message}` });
      }
    } else {
      setSuppliersList(prev => prev.filter(s => s.id !== id));
    }
  };

  // P0 — Masraf CRUD
  // Fix #12: Interface artık cashRegisterId parametresini de kabul ediyor
  const addExpense = async (expense: Expense & { idempotencyKey?: string }, cashRegisterId?: string) => {
    try {
      if (currentOrgId) {
        const created = await dbInsertExpense({
          ...expense,
          idempotency_key: expense.idempotencyKey
        });
        setExpensesList(prev => [created, ...prev.filter(e => e.id !== created.id)]);
        addToast({ type: 'success', message: 'Gider ve kasa hareketi kaydedildi.' });
        return;
      }
      CashDomainService.recordTransaction({
        cashRegisterId: cashRegisterId || 'kas-1',
        type: 'EXPENSE',
        amount: expense.amount,
        category: expense.category,
        referenceEntity: 'expense',
        referenceId: expense.id,
        organizationId: currentOrgId || undefined,
        description: expense.description,
        idempotencyKey: expense.idempotencyKey
      });
      setExpensesList(prev => [expense, ...prev]);
      addToast({ type: 'success', message: 'Gider başarıyla kaydedildi ve kasadan düşüldü.' });

      await EventBus.publish({
        type: 'EXPENSE_CREATED',
        payload: expense,
        timestamp: new Date().toISOString(),
        organizationId: currentOrgId || undefined
      });
    } catch (err: any) {
      addToast({ type: 'error', message: `Gider eklenemedi: ${err.message}` });
      throw err;
    }
  };
  const updateExpense = async (updatedExpense: Expense) => {
    if (currentOrgId && updatedExpense.id) {
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
    }
  };

  const deleteExpense = async (id: string) => {
    if (currentOrgId) {
      try {
        await dbDeleteExpense(id);
        setExpensesList(prev => prev.filter(e => e.id !== id));
        addToast({ type: 'success', message: 'Gider iptal edildi ve kasa düzeltildi.' });
      } catch (err: any) {
        logger.warn(`dbDeleteExpense background sync error: ${err.message}`, 'AppContext');
        addToast({ type: 'error', message: 'Gider iptal edilemedi; kayıt değiştirilmedi.' });
        throw err;
      }
    }
  };

  // P0 — Kullanıcı / Üyelik (Memberships) CRUD
  const addUser = async (user: SystemUser) => {
    if (currentOrg && usersList.length >= (currentOrg.max_users || 5)) {
      addToast({
        type: 'warning',
        message: `Kullanıcı limitinize ulaştınız (Maksimum ${currentOrg.max_users} kullanıcı). Paketinizi yükseltmek için SaaS yöneticiniz ile iletişime geçin.`
      });
      return;
    }
    if (currentOrgId) {
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
    } else {
      setUsersList(prev => [user, ...prev]);
    }
  };

  const updateUser = async (updatedUser: SystemUser) => {
    try {
      if(currentOrgId) await dbUpdateMembership(updatedUser.id,updatedUser);
      else if(!demoModeActive) throw new Error('Aktif firma gerekli.');
      setUsersList(prev=>prev.map(u=>u.id===updatedUser.id?updatedUser:u));
      addToast({type:'success',message:'Kullanıcı güncellendi.'});
    } catch(err: any){addToast({type:'error',message:err.message});throw err;}
  };
  const deleteUser = async (id: string) => {
    try {
      if(currentOrgId) await dbDeleteMembership(id);
      else if(!demoModeActive) throw new Error('Aktif firma gerekli.');
      setUsersList(prev=>prev.filter(u=>u.id!==id));
      addToast({type:'success',message:'Üyelik kaldırıldı.'});
    } catch(err: any){addToast({type:'error',message:err.message});}
  };

  // Şube CRUD
  const addBranch = async (branch: Branch) => {
    if (currentOrg && branchesList.length >= (currentOrg.max_branches || 2)) {
      addToast({
        type: 'warning',
        message: `Şube limitinize ulaştınız (Maksimum ${currentOrg.max_branches} şube). Paketinizi yükseltmek için SaaS yöneticiniz ile iletişime geçin.`
      });
      return;
    }
    if (currentOrgId) {
      try {
        const created = await dbInsertBranch(branch);
        setBranchesList(prev => [...prev, created]);
        addToast({ type: 'success', message: 'Şube başarıyla oluşturuldu.' });
      } catch (err: any) {
        addToast({ type: 'error', message: `Şube oluşturulamadı: ${err.message}` });
        throw err;
      }
    } else {
      setBranchesList(prev => [...prev, branch]);
    }
  };

  const updateBranch = async (updatedBranch: Branch) => {
    if (currentOrgId && updatedBranch.id) {
      try {
        const saved = await dbUpdateBranch(updatedBranch.id, updatedBranch);
        if (!saved) throw new Error('Kayıt bulunamadı veya erişim yetkisi yok.');
        setBranchesList(prev => prev.map(b => b.id === updatedBranch.id ? saved : b));
        addToast({ type: 'success', message: 'Şube bilgileri güncellendi.' });
      } catch (err: any) {
        addToast({ type: 'error', message: `Şube bilgileri kaydedilemedi: ${err.message}` });
      }
    } else if (demoModeActive) {
      setBranchesList(prev => prev.map(b => b.id === updatedBranch.id ? updatedBranch : b));
      addToast({ type: 'success', message: 'Demo şube bilgileri güncellendi.' });
    }
  };

  return (
    <AppContext.Provider value={{
      currentPage,
      setCurrentPage,
      selectedPatientId,
      setSelectedPatientId,
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
      startDemoSession,
      dataLoading,
      refreshOrganizationData,
      
      patientsList,
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
      
      demoModeActive,
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
