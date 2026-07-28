import { CashTransaction, CashAccount } from '../data/mockData';
import { toCamelGeneric, toSnakeGeneric } from './BaseRepository';

/**
 * Concrete CashRepository handling ledger transactions & vault balance calculations
 */
export class CashRepository {
  static formatTransaction<T = CashTransaction>(raw: unknown): T {
    return toCamelGeneric<T>(raw);
  }

  static formatAccount<T = CashAccount>(raw: unknown): T {
    return toCamelGeneric<T>(raw);
  }

  static prepareForStorage<T = Record<string, unknown>>(entity: unknown): T {
    return toSnakeGeneric<T>(entity);
  }
}
