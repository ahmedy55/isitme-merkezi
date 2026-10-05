import type { CashTransaction, CashTransactionType } from '../data/mockData';

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
 * Pure helpers for constructing cash-ledger entries and deriving balances.
 * Persisted production balances must come from the Supabase cash_transactions table.
 */
export class CashDomainService {
  /**
   * Construct an immutable cash transaction. Persistence is performed separately
   * by the database transaction workflow; this helper never keeps local ledger state.
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

    return tx;
  }

  /**
   * Derive real-time balance for a given cash register.
   * Accepts an explicit transaction list (normally loaded from Supabase).
   * No synthetic fallback data is used when the list is absent.
   */
  static deriveBalance(
    cashRegisterId: string,
    initialBalance: number = 0,
    externalTransactions?: CashTransaction[]
  ): number {
    const txList = externalTransactions || [];
    return txList
      .filter(tx => tx.cashRegisterId === cashRegisterId)
      .reduce((sum, tx) => {
        if (tx.type === 'INCOME') return sum + tx.amount;
        if (tx.type === 'EXPENSE' || tx.type === 'PAYOUT' || tx.type === 'REFUND') return sum - tx.amount;
        return sum;
      }, initialBalance);
  }
}
