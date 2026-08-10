import { CashTransaction, CashTransactionType } from '../data/mockData';

export interface RecordCashTransactionPayload {
  cashRegisterId: string;
  type: CashTransactionType;
  amount: number;
  category: string;
  referenceEntity?: 'sale' | 'expense' | 'purchase' | 'service';
  referenceId?: string;
  branchId?: string;
  organizationId?: string;
  performedByUserId?: string;
  description?: string;
  idempotencyKey?: string;
}

/**
 * CashDomainService — Immutable Kasa Defteri (Ledger) Servisi
 *
 * In-memory ledger YALNIZCA demo/offline modda kullanılır.
 * Production'da (currentOrgId varsa) gerçek bakiye ve hareketler
 * Supabase cash_transactions tablosundan çekilir (dbFetchCashTransactions).
 * Bu servis, yeni kayıt oluşturma ve local (demo) bakiye türetme için kullanılır.
 */
export class CashDomainService {
  // Demo mod için başlangıç hareketleri — production'da Supabase'den gelir
  private static demoTransactions: CashTransaction[] = [
    {
      id: 'tx-1',
      cashRegisterId: 'kas-1',
      type: 'INCOME',
      amount: 48000,
      category: 'Cihaz Satışı',
      referenceEntity: 'sale',
      referenceId: 'sal-1',
      createdAt: '2026-07-10T10:30:00Z',
      description: 'Ayşe Yılmaz — Phonak Audéo P90 peşin satış'
    },
    {
      id: 'tx-2',
      cashRegisterId: 'kas-2',
      type: 'INCOME',
      amount: 36000,
      category: 'Cihaz Satışı',
      referenceEntity: 'sale',
      referenceId: 'sal-2',
      createdAt: '2026-07-11T14:15:00Z',
      description: 'Mehmet Kaya — Oticon More 1 cihaz satışı'
    },
    {
      id: 'tx-3',
      cashRegisterId: 'kas-1',
      type: 'EXPENSE',
      amount: 8500,
      category: 'Reklam & Pazarlama',
      referenceEntity: 'expense',
      referenceId: 'exp-6',
      createdAt: '2026-07-10T16:00:00Z',
      description: 'Google Ads Temmuz kampanya ödemesi'
    }
  ];

  /**
   * Record an immutable cash transaction in the local ledger (demo/offline mode)
   * In production, the actual DB persist is handled by dbInsertCashTransaction in database.ts
   */
  static recordTransaction(payload: RecordCashTransactionPayload): CashTransaction {
    if (payload.amount <= 0) {
      throw new Error(`[CashDomainService Error] Tutar 0'dan büyük olmalıdır.`);
    }

    const tx: CashTransaction = {
      id: `tx-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      cashRegisterId: payload.cashRegisterId,
      type: payload.type,
      amount: payload.amount,
      category: payload.category,
      referenceEntity: payload.referenceEntity,
      referenceId: payload.referenceId,
      branchId: payload.branchId,
      organizationId: payload.organizationId,
      performedByUserId: payload.performedByUserId,
      createdAt: new Date().toISOString(),
      description: payload.description
    };

    this.demoTransactions.unshift(tx);
    return tx;
  }

  /**
   * Derive real-time balance for a given cash register.
   * Accepts an external transaction list (from Supabase DB) for production mode.
   * Falls back to in-memory demo ledger if no external list is provided.
   */
  static deriveBalance(
    cashRegisterId: string,
    initialBalance: number = 0,
    externalTransactions?: CashTransaction[]
  ): number {
    const txList = externalTransactions || this.demoTransactions;
    return txList
      .filter(tx => tx.cashRegisterId === cashRegisterId)
      .reduce((sum, tx) => {
        if (tx.type === 'INCOME') return sum + tx.amount;
        if (tx.type === 'EXPENSE' || tx.type === 'PAYOUT' || tx.type === 'REFUND') return sum - tx.amount;
        return sum;
      }, initialBalance);
  }

  /**
   * Get all transactions. In production, prefer dbFetchCashTransactions() from database.ts instead.
   */
  static getTransactions(): CashTransaction[] {
    return this.demoTransactions;
  }
}
