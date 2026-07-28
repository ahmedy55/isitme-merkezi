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
}

export class CashDomainService {
  private static transactions: CashTransaction[] = [
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
   * Record an immutable cash transaction in the ledger
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

    this.transactions.unshift(tx);
    return tx;
  }

  /**
   * Derive real-time balance for a given cash register from immutable transactions
   */
  static deriveBalance(cashRegisterId: string, initialBalance: number = 0): number {
    return this.transactions
      .filter(tx => tx.cashRegisterId === cashRegisterId)
      .reduce((sum, tx) => {
        if (tx.type === 'INCOME') return sum + tx.amount;
        if (tx.type === 'EXPENSE' || tx.type === 'PAYOUT' || tx.type === 'REFUND') return sum - tx.amount;
        return sum;
      }, initialBalance);
  }

  static getTransactions(): CashTransaction[] {
    return this.transactions;
  }
}
