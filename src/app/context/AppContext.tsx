'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

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
  | 'settings';

interface AppContextType {
  currentPage: Page;
  setCurrentPage: (page: Page) => void;
  selectedPatientId: string | null;
  setSelectedPatientId: (id: string | null) => void;
  showModal: string | null;
  setShowModal: (modal: string | null) => void;
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
}

interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [showModal, setShowModal] = useState<string | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = (toast: Omit<Toast, 'id'>) => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { ...toast, id }]);
    setTimeout(() => removeToast(id), 4000);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  return (
    <AppContext.Provider value={{
      currentPage, setCurrentPage,
      selectedPatientId, setSelectedPatientId,
      showModal, setShowModal,
      toasts, addToast, removeToast,
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
