import { SaleRecord, StockItem } from '../data/mockData';
import { StockDomainService } from './StockDomainService';
import { CashDomainService } from './CashDomainService';
import { EventBus } from './EventBus';

export interface CreateSalePayload {
  sale: SaleRecord;
  stockItemId?: string;
  cashRegisterId?: string;
  branchId?: string;
  organizationId?: string;
  performedByUserId?: string;
}

export class SaleDomainService {
  /**
   * Enterprise Atomic Transaction for Sale Completion
   */
  static async executeSaleTransaction(
    currentStockList: StockItem[],
    payload: CreateSalePayload
  ): Promise<{ updatedStockList: StockItem[]; createdSale: SaleRecord }> {
    const { sale, stockItemId, cashRegisterId = 'kas-1', branchId, organizationId, performedByUserId } = payload;

    let updatedStockList = currentStockList;

    // 1. If a specific StockItem is specified, process atomic stock movement (-quantity)
    if (stockItemId) {
      const stockItem = currentStockList.find(s => s.id === stockItemId);
      if (stockItem) {
        const result = StockDomainService.processMovement(currentStockList, {
          stockItemId: stockItem.id,
          stockItemName: stockItem.name,
          type: 'SALE',
          quantityChange: -1,
          unitPrice: sale.total,
          referenceEntity: 'sale',
          referenceId: sale.id,
          branchId,
          organizationId,
          performedByUserId,
          notes: `${sale.patientName} adına cihaz/pil satışı`
        });
        updatedStockList = result.updatedStockList;
      }
    }

    // 2. Record immutable cash transaction (+income)
    CashDomainService.recordTransaction({
      cashRegisterId,
      type: 'INCOME',
      amount: sale.total,
      category: 'Cihaz Satışı',
      referenceEntity: 'sale',
      referenceId: sale.id,
      branchId,
      organizationId,
      performedByUserId,
      description: `${sale.patientName} — Satış tahsilatı`
    });

    // 3. Publish Domain Event
    await EventBus.publish({
      type: 'SALE_COMPLETED',
      payload: { sale, stockItemId, branchId },
      timestamp: new Date().toISOString(),
      triggeredByUserId: performedByUserId,
      organizationId,
      branchId
    });

    return { updatedStockList, createdSale: sale };
  }
}
