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
  Supplier, Expense, SystemUser, AuditLogEntry, Branch
} from '../data/mockData';
import { supabase } from '../lib/supabase';
import {
  dbFetchPatients, dbInsertPatient, dbUpdatePatient,
  dbFetchAppointments, dbInsertAppointment, dbUpdateAppointmentStatus,
  dbFetchStockItems, dbInsertStockItem, dbUpdateStockItem,
  dbFetchSales, dbInsertSale,
  dbFetchRecallItems, dbUpdateRecallStatus,
  dbFetchSuppliers, dbInsertSupplier, dbUpdateSupplier, dbDeleteSupplier,
  dbFetchExpenses, dbInsertExpense, dbUpdateExpense, dbDeleteExpense,
  dbFetchBranches, dbInsertBranch, dbUpdateBranch,
  dbFetchAuditLogs, dbInsertAuditLog,
  dbFetchMemberships, dbInsertMembership, dbUpdateMembership, dbDeleteMembership
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
  addSale: (sale: SaleRecord) => void;
  addStockItem: (item: StockItem) => void;
  updateStockItem: (item: StockItem) => void;
  updateRecallItemStatus: (id: string, status: RecallItem['status']) => void;
  
  // P0 — Tedarikçi
  addSupplier: (supplier: Supplier) => void;
  updateSupplier: (supplier: Supplier) => void;
  deleteSupplier: (id: string) => void;
  
  // P0 — Masraf
  addExpense: (expense: Expense) => void;
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

  // Organizasyon seçimi değiştiğinde verileri otomatik yükle
  useEffect(() => {
    if (currentOrgId) {
      loadAllData();
    }
  }, [currentOrgId]);

  // İlk yüklemede mock verileri set et & Auth kontrolü yap
  useEffect(() => {
    // 1. Mock veriler
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

  const handleSetCurrentPage = (page: Page) => {
    setCurrentPage(page);
    setSidebarOpen(false);
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
    if (currentOrgId && updatedPatient.id) {
      try {
        const updated = await dbUpdatePatient(updatedPatient.id, updatedPatient);
        setPatientsList(prev => prev.map(p => p.id === updated.id ? updated : p));
        addToast({ type: 'success', message: 'Hasta bilgileri güncellendi.' });
        await dbInsertAuditLog({
          action: 'Hasta Güncelleme',
          module: 'Hastalar',
          description: `${updatedPatient.firstName} ${updatedPatient.lastName} güncellendi.`
        });
      } catch (err: any) {
        addToast({ type: 'error', message: `Hasta güncellenemedi: ${err.message}` });
      }
    } else {
      setPatientsList(prev => prev.map(p => p.id === updatedPatient.id ? updatedPatient : p));
    }
  };

  const addAppointment = async (appointment: Appointment) => {
    if (currentOrgId) {
      try {
        const created = await dbInsertAppointment(appointment);
        // dbInsertAppointment patientName'i JOIN ile getirmez, bu yüzden yerel eşleme yapalım
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
    if (currentOrgId) {
      try {
        const updated = await dbUpdateAppointmentStatus(id, status);
        setAppointmentsList(prev => prev.map(a => a.id === id ? { ...a, status } : a));
        addToast({ type: 'success', message: `Randevu durumu '${status}' olarak güncellendi.` });
      } catch (err: any) {
        addToast({ type: 'error', message: `Randevu güncellenemedi: ${err.message}` });
      }
    } else {
      setAppointmentsList(prev => prev.map(a => a.id === id ? { ...a, status } : a));
    }
  };

  const addSale = async (sale: SaleRecord) => {
    if (currentOrgId) {
      try {
        const created = await dbInsertSale(sale);
        // patientName JOIN eşlemesi yapalım
        const pat = patientsList.find(p => p.id === sale.patientId);
        const patientName = pat ? `${pat.firstName} ${pat.lastName}` : 'Bilinmeyen Hasta';
        const createdWithPatName = { ...created, patientName };

        setSalesList(prev => [createdWithPatName, ...prev]);
        addToast({ type: 'success', message: 'Satış işlemi başarıyla kaydedildi.' });
        await dbInsertAuditLog({
          action: 'Satış Ekleme',
          module: 'Kasa',
          description: `${patientName} adına ${sale.total} TL tutarında satış.`
        });
      } catch (err: any) {
        addToast({ type: 'error', message: `Satış kaydedilemedi: ${err.message}` });
      }
    } else {
      setSalesList(prev => [sale, ...prev]);
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
    if (currentOrgId && updatedItem.id) {
      try {
        const updated = await dbUpdateStockItem(updatedItem.id, updatedItem);
        setStockList(prev => prev.map(s => s.id === updated.id ? updated : s));
        addToast({ type: 'success', message: 'Ürün bilgileri güncellendi.' });
      } catch (err: any) {
        addToast({ type: 'error', message: `Ürün güncellenemedi: ${err.message}` });
      }
    } else {
      setStockList(prev => prev.map(s => s.id === updatedItem.id ? updatedItem : s));
    }
  };

  const updateRecallItemStatus = async (id: string, status: RecallItem['status']) => {
    if (currentOrgId) {
      try {
        const updated = await dbUpdateRecallStatus(id, status);
        setRecallList(prev => prev.map(r => r.id === id ? { ...r, status, lastContact: updated.lastContact } : r));
        addToast({ type: 'success', message: 'Hatırlatma durumu güncellendi.' });
      } catch (err: any) {
        addToast({ type: 'error', message: `Durum güncellenemedi: ${err.message}` });
      }
    } else {
      setRecallList(prev => prev.map(r => r.id === id ? { ...r, status, lastContact: '2026-07-10' } : r));
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
    if (currentOrgId && updatedSupplier.id) {
      try {
        const updated = await dbUpdateSupplier(updatedSupplier.id, updatedSupplier);
        setSuppliersList(prev => prev.map(s => s.id === updated.id ? updated : s));
        addToast({ type: 'success', message: 'Tedarikçi bilgileri güncellendi.' });
      } catch (err: any) {
        addToast({ type: 'error', message: `Tedarikçi güncellenemedi: ${err.message}` });
      }
    } else {
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
  const addExpense = async (expense: Expense) => {
    if (currentOrgId) {
      try {
        const created = await dbInsertExpense(expense);
        setExpensesList(prev => [created, ...prev]);
        addToast({ type: 'success', message: 'Gider başarıyla kaydedildi.' });
      } catch (err: any) {
        addToast({ type: 'error', message: `Gider eklenemedi: ${err.message}` });
      }
    } else {
      setExpensesList(prev => [expense, ...prev]);
    }
  };
  const updateExpense = async (updatedExpense: Expense) => {
    if (currentOrgId && updatedExpense.id) {
      try {
        const updated = await dbUpdateExpense(updatedExpense.id, updatedExpense);
        setExpensesList(prev => prev.map(e => e.id === updated.id ? updated : e));
        addToast({ type: 'success', message: 'Gider kaydı güncellendi.' });
      } catch (err: any) {
        addToast({ type: 'error', message: `Gider güncellenemedi: ${err.message}` });
      }
    } else {
      setExpensesList(prev => prev.map(e => e.id === updatedExpense.id ? updatedExpense : e));
    }
  };
  const deleteExpense = async (id: string) => {
    if (currentOrgId) {
      try {
        await dbDeleteExpense(id);
        setExpensesList(prev => prev.filter(e => e.id !== id));
        addToast({ type: 'success', message: 'Gider kaydı silindi.' });
      } catch (err: any) {
        addToast({ type: 'error', message: `Gider silinemedi: ${err.message}` });
      }
    } else {
      setExpensesList(prev => prev.filter(e => e.id !== id));
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
    if (currentOrgId && updatedUser.id) {
      try {
        const updated = await dbUpdateMembership(updatedUser.id, updatedUser);
        setUsersList(prev => prev.map(u => u.id === updated.id ? updated : u));
        addToast({ type: 'success', message: 'Kullanıcı bilgileri ve rolü güncellendi.' });
      } catch (err: any) {
        addToast({ type: 'error', message: `Kullanıcı güncellenemedi: ${err.message}` });
      }
    } else {
      setUsersList(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
    }
  };

  const deleteUser = async (id: string) => {
    if (currentOrgId) {
      try {
        await dbDeleteMembership(id);
        setUsersList(prev => prev.filter(u => u.id !== id));
        addToast({ type: 'success', message: 'Kullanıcı üyeliği kaldırıldı.' });
      } catch (err: any) {
        addToast({ type: 'error', message: `Kullanıcı kaldırılamadı: ${err.message}` });
      }
    } else {
      setUsersList(prev => prev.filter(u => u.id !== id));
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
    if (currentOrgId && updatedBranch.id) {
      try {
        const updated = await dbUpdateBranch(updatedBranch.id, updatedBranch);
        setBranchesList(prev => prev.map(b => b.id === updated.id ? updated : b));
        addToast({ type: 'success', message: 'Şube bilgileri güncellendi.' });
      } catch (err: any) {
        addToast({ type: 'error', message: `Şube güncellenemedi: ${err.message}` });
      }
    } else {
      setBranchesList(prev => prev.map(b => b.id === updatedBranch.id ? updatedBranch : b));
    }
  };

  return (
    <AppContext.Provider value={{
      currentPage,
      setCurrentPage: handleSetCurrentPage,
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
      addStockItem,
      updateStockItem,
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
