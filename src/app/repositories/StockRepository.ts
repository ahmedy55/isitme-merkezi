import { StockItem, StockMovement } from '../data/mockData';
import { toCamelGeneric, toSnakeGeneric } from './BaseRepository';

/**
 * Concrete StockRepository handling envanter movements & stock persistence
 */
export class StockRepository {
  static formatStockItem<T = StockItem>(raw: unknown): T {
    return toCamelGeneric<T>(raw);
  }

  static formatStockMovement<T = StockMovement>(raw: unknown): T {
    return toCamelGeneric<T>(raw);
  }

  static prepareForStorage<T = Record<string, unknown>>(entity: unknown): T {
    return toSnakeGeneric<T>(entity);
  }
}
