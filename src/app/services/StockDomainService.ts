import { StockItem, StockMovement, StockMovementType } from '../data/mockData';
import { EventBus } from './EventBus';

export interface RecordStockMovementPayload {
  stockItemId: string;
  stockItemName: string;
  type: StockMovementType;
  quantityChange: number; // e.g. -1 for sale, +10 for purchase
  unitPrice: number;
  referenceEntity: 'sale' | 'purchase' | 'service' | 'adjustment';
  referenceId: string;
  branchId?: string;
  organizationId?: string;
  performedByUserId?: string;
  notes?: string;
}

export class StockDomainService {
  private static movements: StockMovement[] = [];

  /**
   * Process an atomic stock movement and return the updated StockItem quantity
   */
  static processMovement(
    currentStockList: StockItem[],
    payload: RecordStockMovementPayload
  ): { updatedStockList: StockItem[]; movement: StockMovement; isCritical: boolean } {
    const item = currentStockList.find(s => s.id === payload.stockItemId);
    if (!item && payload.type !== 'PURCHASE') {
      throw new Error(`[StockDomainService] Stock item with ID ${payload.stockItemId} not found.`);
    }

    // Atomic Concurrency Guard: Check negative stock
    const currentQuantity = item ? item.quantity : 0;
    const newQuantity = currentQuantity + payload.quantityChange;

    if (newQuantity < 0) {
      throw new Error(
        `[StockDomainService Concurrency Error] Yetersiz stok! Mevcut stok: ${currentQuantity}, İstenen: ${Math.abs(payload.quantityChange)}`
      );
    }

    const movement: StockMovement = {
      id: `mov-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      stockItemId: payload.stockItemId,
      stockItemName: payload.stockItemName,
      type: payload.type,
      quantityChange: payload.quantityChange,
      unitPrice: payload.unitPrice,
      referenceEntity: payload.referenceEntity,
      referenceId: payload.referenceId,
      branchId: payload.branchId,
      organizationId: payload.organizationId,
      performedByUserId: payload.performedByUserId,
      createdAt: new Date().toISOString(),
      notes: payload.notes
    };

    this.movements.unshift(movement);

    let updatedStockList: StockItem[];
    if (item) {
      const isSold = newQuantity === 0 && payload.type === 'SALE';
      updatedStockList = currentStockList.map(s =>
        s.id === item.id
          ? {
              ...s,
              quantity: newQuantity,
              status: isSold ? ('Satıldı' as StockItem['status']) : s.status
            }
          : s
      );
    } else {
      // New stock item from purchase
      const newStockItem: StockItem = {
        id: payload.stockItemId,
        name: payload.stockItemName,
        category: 'Cihaz',
        brand: 'Tedarikçi',
        model: 'Standart',
        serialNo: `SN-${Date.now().toString().slice(-6)}`,
        quantity: newQuantity,
        criticalLevel: 2,
        price: payload.unitPrice * 1.3,
        purchasePrice: payload.unitPrice,
        sgkPrice: 6200,
        warrantyExpiry: new Date(Date.now() + 2 * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        location: 'Ana Depo',
        status: 'Stokta',
        utsStatus: 'Bekliyor',
        branch: 'Merkez 1 - Kadıköy'
      };
      updatedStockList = [newStockItem, ...currentStockList];
    }

    const isCritical = item ? newQuantity <= item.criticalLevel : false;

    if (isCritical) {
      EventBus.publish({
        type: 'CRITICAL_STOCK_ALERT',
        payload: { stockItem: item || payload.stockItemName, currentQuantity: newQuantity },
        timestamp: new Date().toISOString(),
        branchId: payload.branchId
      });
    }

    return { updatedStockList, movement, isCritical };
  }

  static getMovements(): StockMovement[] {
    return this.movements;
  }
}
