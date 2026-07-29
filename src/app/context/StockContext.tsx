'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { StockItem, initialStock } from '../data/mockData';
import { dbInsertStockItem, dbUpdateStockItem } from '../lib/database';
import { logger } from '../lib/logger';

interface StockContextType {
  stockList: StockItem[];
  setStockList: React.Dispatch<React.SetStateAction<StockItem[]>>;
  addStockItem: (item: StockItem, currentOrgId: string | null, addToast: (t: any) => void) => Promise<void>;
  updateStockItem: (item: StockItem, currentOrgId: string | null, addToast: (t: any) => void) => Promise<void>;
  deleteStockItem: (id: string, addToast: (t: any) => void) => void;
}

const StockContext = createContext<StockContextType | null>(null);

export function StockProvider({ children }: { children: ReactNode }) {
  const [stockList, setStockList] = useState<StockItem[]>(initialStock);

  const addStockItem = async (item: StockItem, currentOrgId: string | null, addToast: (t: any) => void) => {
    if (currentOrgId) {
      try {
        const created = await dbInsertStockItem(item);
        setStockList(prev => [created, ...prev]);
        addToast({ type: 'success', message: 'Ürün envantere eklendi.' });
      } catch (err: any) {
        logger.error('addStockItem error', err, 'StockContext');
        addToast({ type: 'error', message: `Ürün eklenemedi: ${err.message}` });
      }
    } else {
      setStockList(prev => [item, ...prev]);
    }
  };

  const updateStockItem = async (updatedItem: StockItem, currentOrgId: string | null, addToast: (t: any) => void) => {
    setStockList(prev => prev.map(s => s.id === updatedItem.id ? updatedItem : s));
    addToast({ type: 'success', message: 'Ürün bilgileri güncellendi.' });
    if (currentOrgId && updatedItem.id) {
      try {
        await dbUpdateStockItem(updatedItem.id, updatedItem);
      } catch (err: any) {
        logger.warn(`dbUpdateStockItem background sync error: ${err.message}`, 'StockContext');
        addToast({ type: 'warning', message: 'Stok ürünü yerelde güncellendi ancak veritabanına eşlenemedi.' });
      }
    }
  };

  const deleteStockItem = (id: string, addToast: (t: any) => void) => {
    setStockList(prev => prev.filter(s => s.id !== id));
    addToast({ type: 'success', message: 'Ürün envanterden silindi.' });
  };

  return (
    <StockContext.Provider value={{
      stockList,
      setStockList,
      addStockItem,
      updateStockItem,
      deleteStockItem
    }}>
      {children}
    </StockContext.Provider>
  );
}

export function useStockContext() {
  const context = useContext(StockContext);
  if (!context) throw new Error('useStockContext must be used within StockProvider');
  return context;
}
