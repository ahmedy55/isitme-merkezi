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
  Patient, Appointment, StockItem, SaleRecord, RecallItem,
  Supplier, Expense, SystemUser, AuditLogEntry
} from '../data/mockData';

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
  | 'users'
  | 'suppliers'
  | 'expenses'
  | 'audit-log';

interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
}

interface AppContextType {
  currentPage: Page;
  setCurrentPage: (page: Page) => void;
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
  
  // Demo ve Ayarlar Parametreleri
  demoModeActive: boolean;
  commissionRate: number;
  setCommissionRate: (rate: number) => void;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [activeDetailTab, setActiveDetailTab] = useState<string>('genel');
  const [showModal, setShowModal] = useState<string | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);

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

  // Demo Ayarları
  const [demoModeActive] = useState(true);
  const [commissionRate, setCommissionRate] = useState(3);

  // İlk yüklemede mock verileri set et
  useEffect(() => {
    setPatientsList(initialPatients);
    setAppointmentsList(initialAppointments);
    setStockList(initialStock);
    setSalesList(initialSales);
    setRecallList(initialRecall);
    setSuppliersList(initialSuppliers);
    setExpensesList(initialExpenses);
    setUsersList(initialUsers);
    setAuditLogList(initialAuditLog);
  }, []);

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
  const addPatient = (patient: Patient) => {
    setPatientsList(prev => [patient, ...prev]);
  };

  const updatePatient = (updatedPatient: Patient) => {
    setPatientsList(prev => prev.map(p => p.id === updatedPatient.id ? updatedPatient : p));
  };

  const addAppointment = (appointment: Appointment) => {
    setAppointmentsList(prev => [appointment, ...prev]);
  };

  const updateAppointmentStatus = (id: string, status: Appointment['status']) => {
    setAppointmentsList(prev => prev.map(a => a.id === id ? { ...a, status } : a));
  };

  const addSale = (sale: SaleRecord) => {
    setSalesList(prev => [sale, ...prev]);
  };

  const addStockItem = (item: StockItem) => {
    setStockList(prev => [item, ...prev]);
  };

  const updateStockItem = (updatedItem: StockItem) => {
    setStockList(prev => prev.map(s => s.id === updatedItem.id ? updatedItem : s));
  };

  const updateRecallItemStatus = (id: string, status: RecallItem['status']) => {
    setRecallList(prev => prev.map(r => r.id === id ? { ...r, status, lastContact: '2026-07-10' } : r));
  };

  // P0 — Tedarikçi CRUD
  const addSupplier = (supplier: Supplier) => {
    setSuppliersList(prev => [supplier, ...prev]);
  };
  const updateSupplier = (updatedSupplier: Supplier) => {
    setSuppliersList(prev => prev.map(s => s.id === updatedSupplier.id ? updatedSupplier : s));
  };
  const deleteSupplier = (id: string) => {
    setSuppliersList(prev => prev.filter(s => s.id !== id));
  };

  // P0 — Masraf CRUD
  const addExpense = (expense: Expense) => {
    setExpensesList(prev => [expense, ...prev]);
  };
  const updateExpense = (updatedExpense: Expense) => {
    setExpensesList(prev => prev.map(e => e.id === updatedExpense.id ? updatedExpense : e));
  };
  const deleteExpense = (id: string) => {
    setExpensesList(prev => prev.filter(e => e.id !== id));
  };

  // P0 — Kullanıcı CRUD
  const addUser = (user: SystemUser) => {
    setUsersList(prev => [user, ...prev]);
  };
  const updateUser = (updatedUser: SystemUser) => {
    setUsersList(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
  };
  const deleteUser = (id: string) => {
    setUsersList(prev => prev.filter(u => u.id !== id));
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
      
      patientsList,
      appointmentsList,
      stockList,
      salesList,
      recallList,
      suppliersList,
      expensesList,
      usersList,
      auditLogList,
      
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
