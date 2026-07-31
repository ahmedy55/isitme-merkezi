'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
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
import { SGKDomainService } from '../services/SGKDomainService';
import { ServiceDomainService } from '../services/ServiceDomainService';
import { EventBus } from '../services/EventBus';
import {
  dbFetchPatients, dbInsertPatient, dbUpdatePatient,
  dbFetchAppointments, dbInsertAppointment, dbUpdateAppointmentStatus,
  dbFetchStockItems, dbInsertStockItem, dbUpdateStockItem, dbDeleteStockItem,
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
  | 'login'
  | 'org-select'
  | 'super-admin';

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
  dataLoading: boolean;
  isPlatformAdmin: boolean;
  
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
  addPatient: (patient: Patient) => void;
  updatePatient: (patient: Patient) => void;
  addAppointment: (appointment: Appointment) => void;
  updateAppointmentStatus: (id: string, status: Appointment['status']) => void;
  addSale: (sale: SaleRecord, stockItemId?: string, cashRegisterId?: string) => Promise<void>;
  addSupplierPurchaseTransaction: (supplierId: string, purchase: SupplierPurchase, cashRegisterId?: string) => Promise<void>;
  approveSGKPrescription: (patientId: string, prescriptionNo: string, reportNo: string) => Promise<void>;
  completeServiceTicket: (ticketId: string, patientName: string, serviceFee: number, partsUsed?: { stockItemId: string; stockItemName: string; quantity: number; price: number }[], cashRegisterId?: string) => Promise<void>;
  addStockItem: (item: StockItem) => void;
  updateStockItem: (item: StockItem) => void;
  deleteStockItem: (id: string) => void;
  updateRecallItemStatus: (id: string, status: RecallItem['status']) => void;
  
  // P0 — Tedarikçi
  addSupplier: (supplier: Supplier) => void;
  updateSupplier: (supplier: Supplier) => void;
  deleteSupplier: (id: string) => void;
  
  // P0 — Masraf
  addExpense: (expense: Expense, cashRegisterId?: string) => void;
  updateExpense: (expense: Expense) => void;
  deleteExpense: (id: string) => void;
  
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

export function AppProvider({ children }: { children: ReactNode }) {
  const [currentPage, setCurrentPageState] = useState<Page>('login');
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [activeDetailTab, setActiveDetailTab] = useState<string>('genel');
  const [showModal, setShowModal] = useState<string | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Tarayıcı Geri/İleri butonları & URL Hash (#page) entegrasyonu
  const setCurrentPage = (pageOrFn: Page | ((prev: Page) => Page), replace = false) => {
    setCurrentPageState(prev => {
      const nextPage = typeof pageOrFn === 'function' ? pageOrFn(prev) : pageOrFn;
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
      return nextPage;
    });
  };

  // Tarayıcının Geri (<-) / İleri (->) butonlarına tıklandığında sayfayı değiştir
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handlePopState = (e: PopStateEvent) => {
      const hash = window.location.hash.replace('#', '') as Page;
      if (hash) {
        setCurrentPageState(hash);
      } else if (e.state?.page) {
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
  const [isPlatformAdmin, setIsPlatformAdmin] = useState(false);
  const [dataLoading, setDataLoading] = useState(false);

  // Demo Ayarları
  const [demoModeActive] = useState(true);
  const [commissionRate, setCommissionRate] = useState(3);

  // Supabase'den tüm verileri tek hamlede çek
  const loadAllData = async () => {
    setDataLoading(true);
    try {
      if (currentOrgId) {
        const { data: orgData } = await supabase
          .from('organizations')
          .select('*')
          .eq('id', currentOrgId)
          .maybeSingle();
        if (orgData) setCurrentOrg(orgData);
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
    } catch (err: any) {
      console.error('Veriler Supabase\'den çekilirken hata oluştu:', err);
      addToast({ type: 'error', message: 'Klinik verileri veritabanından çekilemedi.' });
    } finally {
      setDataLoading(false);
    }
  };

  // Fix #1: Organizasyon seçimi değiştiğinde verileri otomatik yükle
  useEffect(() => {
    if (currentOrgId) {
      loadAllData();
    } else if (!mockDataLoaded) {
      // Demo mod: orgId yoksa mock veriyi yükle (sadece bir kez)
      setPatientsList(initialPatients);
      setAppointmentsList(initialAppointments);
      setStockList(initialStock);
      setSalesList(initialSales);
      setRecallList(initialRecall);
      setSuppliersList(initialSuppliers);
      setExpensesList(initialExpenses);
      setUsersList(initialUsers);
      setAuditLogList(initialAuditLog);
      setBranchesList(initialBranches);
      setMockDataLoaded(true);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentOrgId]);

  // Fix #1: İlk yüklemede Auth kontrolü yap (mock data yukarıda orgId yoksa yüklenir)
  useEffect(() => {
    // Platform admin kontrol helper'ı
    const checkAdminStatus = async (uid: string) => {
      try {
        const { data } = await supabase
          .from('platform_admins')
          .select('user_id')
          .eq('user_id', uid)
          .maybeSingle();
        return !!data;
      } catch (err) {
        console.error('Admin status check failed:', err);
        return false;
      }
    };

    // 2. İlk açılışta aktif oturum kontrolü
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setCurrentUser(session.user);
        const admin = await checkAdminStatus(session.user.id);
        setIsPlatformAdmin(admin);
        
        const orgId = session.user.app_metadata?.organization_id;
        if (orgId) {
          setCurrentOrgId(orgId);
          const initialHash = (typeof window !== 'undefined' ? window.location.hash.replace('#', '') : '') as Page;
          setCurrentPage(initialHash || 'dashboard', true);
        } else {
          setCurrentPage('org-select', true);
        }
      } else {
        setCurrentUser(null);
        setCurrentOrgId(null);
        setIsPlatformAdmin(false);
        setCurrentPage('login');
      }
    };

    checkSession();

    // 3. Auth State Dinleyicisi
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session) {
        setCurrentUser(session.user);
        const admin = await checkAdminStatus(session.user.id);
        setIsPlatformAdmin(admin);

        const orgId = session.user.app_metadata?.organization_id;
        if (orgId) {
          setCurrentOrgId(orgId);
          setCurrentPage((prev: Page) => (prev === 'login' || prev === 'org-select' ? 'dashboard' : prev));
        } else {
          setCurrentOrgId(null);
          setCurrentPage((prev: Page) => (prev === 'login' ? 'org-select' : prev));
        }
      } else {
        setCurrentUser(null);
        setCurrentOrgId(null);
        setIsPlatformAdmin(false);
        setCurrentPage('login');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const logout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      addToast({ type: 'error', message: 'Çıkış yapılırken bir hata oluştu.' });
    } else {
      addToast({ type: 'success', message: 'Güvenli çıkış yapıldı.' });
      setCurrentUser(null);
      setCurrentOrgId(null);
      setIsPlatformAdmin(false);
      setCurrentPage('login');
    }
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
      return;
    }
    if (currentOrgId) {
      try {
        const created = await dbInsertPatient(patient);
        setPatientsList(prev => [created, ...prev]);
        addToast({ type: 'success', message: 'Hasta başarıyla eklendi.' });
        await dbInsertAuditLog({
          action: 'Hasta Ekleme',
          module: 'Hastalar',
          description: `${patient.firstName} ${patient.lastName} eklendi.`
        });
      } catch (err: any) {
        addToast({ type: 'error', message: `Hasta eklenemedi: ${err.message}` });
      }
    } else {
      setPatientsList(prev => [patient, ...prev]);
    }
  };

  const updatePatient = async (updatedPatient: Patient) => {
    setPatientsList(prev => prev.map(p => p.id === updatedPatient.id ? updatedPatient : p));
    addToast({ type: 'success', message: 'Hasta bilgileri güncellendi.' });
    if (currentOrgId && updatedPatient.id) {
      try {
        await dbUpdatePatient(updatedPatient.id, updatedPatient);
        await dbInsertAuditLog({
          action: 'Hasta Güncelleme',
          module: 'Hastalar',
          description: `${updatedPatient.firstName} ${updatedPatient.lastName} güncellendi.`
        });
      } catch (err: any) {
        logger.warn(`dbUpdatePatient background sync error: ${err.message}`, 'AppContext');
        addToast({ type: 'warning', message: 'Hasta verisi yerelde güncellendi ancak veritabanına eşlenemedi.' });
      }
    }
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
        await dbInsertAuditLog({
          action: 'Randevu Ekleme',
          module: 'Randevular',
          description: `Randevu tarihi: ${appointment.date}`
        });
      } catch (err: any) {
        addToast({ type: 'error', message: `Randevu eklenemedi: ${err.message}` });
      }
    } else {
      setAppointmentsList(prev => [appointment, ...prev]);
    }
  };

  const updateAppointmentStatus = async (id: string, status: Appointment['status']) => {
    setAppointmentsList(prev => prev.map(a => a.id === id ? { ...a, status } : a));
    addToast({ type: 'success', message: `Randevu durumu '${status}' olarak güncellendi.` });
    if (currentOrgId) {
      try {
        await dbUpdateAppointmentStatus(id, status);
      } catch (err: any) {
        logger.warn(`dbUpdateAppointmentStatus background sync error: ${err.message}`, 'AppContext');
        addToast({ type: 'warning', message: 'Randevu durumu yerelde güncellendi ancak veritabanına eşlenemedi.' });
      }
    }
  };

  const addSale = async (sale: SaleRecord, stockItemId?: string, cashRegisterId?: string) => {
    try {
      const result = await SaleDomainService.executeSaleTransaction(stockList, {
        sale,
        stockItemId,
        cashRegisterId,
        organizationId: currentOrgId || undefined
      });

      setStockList(result.updatedStockList);
      setSalesList(prev => [result.createdSale, ...prev]);
      addToast({ type: 'success', message: 'Satış kaydedildi, stok ve kasa bakiyesi güncellendi.' });

      if (currentOrgId) {
        await dbInsertSale({
          ...sale,
          idempotency_key: sale.idempotencyKey
        });
        // Kasa hareketini DB'ye persist et
        await dbInsertCashTransaction({
          cashRegisterId: cashRegisterId || 'kas-1',
          type: 'INCOME',
          amount: sale.total,
          category: 'Cihaz Satışı',
          referenceEntity: 'sale',
          referenceId: sale.id,
          description: `${sale.patientName} — Satış tahsilatı`,
          idempotency_key: sale.idempotencyKey ? `tx-${sale.idempotencyKey}` : undefined
        });
        await dbInsertAuditLog({
          action: 'Satış Ekleme',
          module: 'Kasa',
          description: `${sale.patientName} adına ${sale.total} TL tutarında atomik satış.`
        });
      }
    } catch (err: any) {
      addToast({ type: 'error', message: `Satış kaydedilemedi: ${err.message}` });
      console.error('[addSale Exception]', err);
    }
  };

  const addSupplierPurchaseTransaction = async (supplierId: string, purchase: SupplierPurchase, cashRegisterId?: string) => {
    try {
      const result = await PurchaseDomainService.executePurchaseTransaction(suppliersList, stockList, {
        supplierId,
        purchase,
        cashRegisterId,
        organizationId: currentOrgId || undefined
      });

      setSuppliersList(result.updatedSuppliers);
      setStockList(result.updatedStockList);
      addToast({ type: 'success', message: 'Alış faturası kaydedildi, tedarikçi borcu ve stoklar güncellendi.' });
    } catch (err: any) {
      addToast({ type: 'error', message: `Alış faturası işlenemedi: ${err.message}` });
    }
  };

  const approveSGKPrescription = async (patientId: string, prescriptionNo: string, reportNo: string) => {
    try {
      const result = await SGKDomainService.approvePrescription(patientsList, recallList, {
        patientId,
        prescriptionNo,
        reportNo,
        organizationId: currentOrgId || undefined
      });

      setPatientsList(result.updatedPatients);
      setRecallList(result.updatedRecalls);
      addToast({ type: 'success', message: 'SGK Reçetesi onaylandı ve 5 yıllık yenileme takibi kuruldu.' });
    } catch (err: any) {
      addToast({ type: 'error', message: `SGK Reçetesi onaylanamadı: ${err.message}` });
    }
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
      }
    } else {
      setStockList(prev => [item, ...prev]);
    }
  };

  const updateStockItem = async (updatedItem: StockItem) => {
    setStockList(prev => prev.map(s => s.id === updatedItem.id ? updatedItem : s));
    addToast({ type: 'success', message: 'Ürün bilgileri güncellendi.' });
    if (currentOrgId && updatedItem.id) {
      try {
        await dbUpdateStockItem(updatedItem.id, updatedItem);
      } catch (err: any) {
        logger.warn(`dbUpdateStockItem background sync error: ${err.message}`, 'AppContext');
        addToast({ type: 'warning', message: 'Stok ürünü yerelde güncellendi ancak veritabanına eşlenemedi.' });
      }
    }
  };

  // Fix #2: Stok silme artık DB'ye de yazılıyor
  const deleteStockItem = async (id: string) => {
    setStockList(prev => prev.filter(s => s.id !== id));
    addToast({ type: 'success', message: 'Ürün envanterden silindi.' });
    if (currentOrgId) {
      try {
        await dbDeleteStockItem(id);
        await dbInsertAuditLog({
          action: 'Stok Silme',
          module: 'Stok',
          description: `Stok ürünü (${id}) envanterden silindi.`
        });
      } catch (err: any) {
        logger.warn(`dbDeleteStockItem background sync error: ${err.message}`, 'AppContext');
        addToast({ type: 'warning', message: 'Ürün yerelde silindi ancak veritabanına eşlenemedi.' });
      }
    }
  };

  const updateRecallItemStatus = async (id: string, status: RecallItem['status']) => {
    setRecallList(prev => prev.map(r => r.id === id ? { ...r, status, lastContact: new Date().toISOString().split('T')[0] } : r));
    addToast({ type: 'success', message: 'Hatırlatma durumu güncellendi.' });
    if (currentOrgId) {
      try {
        await dbUpdateRecallStatus(id, status);
      } catch (err: any) {
        logger.warn(`dbUpdateRecallStatus background sync error: ${err.message}`, 'AppContext');
        addToast({ type: 'warning', message: 'Hatırlatma kaydı yerelde güncellendi ancak veritabanına eşlenemedi.' });
      }
    }
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
    setSuppliersList(prev => prev.map(s => s.id === updatedSupplier.id ? updatedSupplier : s));
    if (currentOrgId && updatedSupplier.id) {
      try {
        await dbUpdateSupplier(updatedSupplier.id, updatedSupplier);
      } catch (err: any) {
        logger.warn(`dbUpdateSupplier background sync error: ${err.message}`, 'AppContext');
        addToast({ type: 'warning', message: 'Tedarikçi bilgileri yerelde güncellendi ancak veritabanına eşlenemedi.' });
      }
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
        await dbInsertExpense({
          ...expense,
          idempotency_key: expense.idempotencyKey
        });
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

      if (currentOrgId) {
        await dbInsertExpense(expense);
        // Fix #3: Kasa hareketini DB'ye persist et
        await dbInsertCashTransaction({
          cashRegisterId: cashRegisterId || 'kas-1',
          type: 'EXPENSE',
          amount: expense.amount,
          category: expense.category,
          referenceEntity: 'expense',
          referenceId: expense.id,
          description: expense.description
        });
      }

      await EventBus.publish({
        type: 'EXPENSE_CREATED',
        payload: expense,
        timestamp: new Date().toISOString(),
        organizationId: currentOrgId || undefined
      });
    } catch (err: any) {
      addToast({ type: 'error', message: `Gider eklenemedi: ${err.message}` });
    }
  };
  const updateExpense = async (updatedExpense: Expense) => {
    setExpensesList(prev => prev.map(e => e.id === updatedExpense.id ? updatedExpense : e));
    addToast({ type: 'success', message: 'Gider kaydı güncellendi.' });
    if (currentOrgId && updatedExpense.id) {
      try {
        await dbUpdateExpense(updatedExpense.id, updatedExpense);
      } catch (err: any) {
        logger.warn(`dbUpdateExpense background sync error: ${err.message}`, 'AppContext');
        addToast({ type: 'warning', message: 'Gider kaydı yerelde güncellendi ancak veritabanına eşlenemedi.' });
      }
    }
  };

  const deleteExpense = async (id: string) => {
    setExpensesList(prev => prev.filter(e => e.id !== id));
    addToast({ type: 'success', message: 'Gider kaydı silindi.' });
    if (currentOrgId) {
      try {
        await dbDeleteExpense(id);
      } catch (err: any) {
        logger.warn(`dbDeleteExpense background sync error: ${err.message}`, 'AppContext');
        addToast({ type: 'warning', message: 'Gider silme işlemi yerelde gerçekleşti ancak veritabanına eşlenemedi.' });
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
      }
    } else {
      setUsersList(prev => [user, ...prev]);
    }
  };

  const updateUser = async (updatedUser: SystemUser) => {
    setUsersList(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
    addToast({ type: 'success', message: 'Kullanıcı bilgileri ve rolü güncellendi.' });
    if (currentOrgId && updatedUser.id) {
      try {
        await dbUpdateMembership(updatedUser.id, updatedUser);
      } catch (err: any) {
        logger.warn(`dbUpdateMembership background sync error: ${err.message}`, 'AppContext');
        addToast({ type: 'warning', message: 'Kullanıcı bilgileri yerelde güncellendi ancak veritabanına eşlenemedi.' });
      }
    }
  };

  const deleteUser = async (id: string) => {
    setUsersList(prev => prev.filter(u => u.id !== id));
    addToast({ type: 'success', message: 'Kullanıcı üyeliği kaldırıldı.' });
    if (currentOrgId) {
      try {
        await dbDeleteMembership(id);
      } catch (err: any) {
        logger.warn(`dbDeleteMembership background sync error: ${err.message}`, 'AppContext');
        addToast({ type: 'warning', message: 'Kullanıcı silme işlemi yerelde gerçekleşti ancak veritabanına eşlenemedi.' });
      }
    }
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
      }
    } else {
      setBranchesList(prev => [...prev, branch]);
    }
  };

  const updateBranch = async (updatedBranch: Branch) => {
    setBranchesList(prev => prev.map(b => b.id === updatedBranch.id ? updatedBranch : b));
    addToast({ type: 'success', message: 'Şube bilgileri güncellendi.' });
    if (currentOrgId && updatedBranch.id) {
      try {
        await dbUpdateBranch(updatedBranch.id, updatedBranch);
      } catch (err: any) {
        logger.warn(`dbUpdateBranch background sync error: ${err.message}`, 'AppContext');
        addToast({ type: 'warning', message: 'Şube bilgileri yerelde güncellendi ancak veritabanına eşlenemedi.' });
      }
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
      dataLoading,
      isPlatformAdmin,
      
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
      addAppointment,
      updateAppointmentStatus,
      addSale,
      addSupplierPurchaseTransaction,
      approveSGKPrescription,
      completeServiceTicket,
      addStockItem,
      updateStockItem,
      deleteStockItem,
      updateRecallItemStatus,
      
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
