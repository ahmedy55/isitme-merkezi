import { StockItem, Supplier, SupplierPurchase } from '../data/mockData';
import { StockDomainService } from './StockDomainService';
import { CashDomainService } from './CashDomainService';
import { EventBus } from './EventBus';

export interface CreatePurchasePayload {
  supplierId: string;
  purchase: SupplierPurchase;
  cashRegisterId?: string;
  branchId?: string;
  organizationId?: string;
  performedByUserId?: string;
}

export class PurchaseDomainService {
  /**
   * Enterprise Atomic Transaction for Supplier Purchase Fatura
   */
  static async executePurchaseTransaction(
    currentSuppliers: Supplier[],
    currentStockList: StockItem[],
    payload: CreatePurchasePayload
  ): Promise<{ updatedSuppliers: Supplier[]; updatedStockList: StockItem[] }> {
    const { supplierId, purchase, cashRegisterId = 'kas-1', branchId, organizationId, performedByUserId } = payload;

    let updatedStockList = currentStockList;

    // 1. Process stock movement for each purchased item
    for (const item of purchase.items) {
      // Find matching item or create new
      const existing = updatedStockList.find(s => s.name.toLowerCase().includes(item.name.toLowerCase()));
      const stockId = existing ? existing.id : `stk-${Date.now()}-${Math.random().toString(36).substr(2, 3)}`;

      const result = StockDomainService.processMovement(updatedStockList, {
        stockItemId: stockId,
        stockItemName: item.name,
        type: 'PURCHASE',
        quantityChange: item.quantity,
        unitPrice: item.unitPrice,
        referenceEntity: 'purchase',
        referenceId: purchase.id,
        branchId,
        organizationId,
        performedByUserId,
        notes: `Fatura No: ${purchase.invoiceNo}`
      });
      updatedStockList = result.updatedStockList;
    }

    // 2. Update Supplier Balance (-purchase.total)
    const updatedSuppliers = currentSuppliers.map(sup => {
      if (sup.id === supplierId) {
        return {
          ...sup,
          balance: sup.balance - purchase.total,
          purchases: [purchase, ...sup.purchases]
        };
      }
      return sup;
    });

    // 3. Record Payout if paid
    if (purchase.paymentStatus === 'Ödendi') {
      CashDomainService.recordTransaction({
        cashRegisterId,
        type: 'PAYOUT',
        amount: purchase.total,
        category: 'Tedarikçi Ödemesi',
        referenceEntity: 'purchase',
        referenceId: purchase.id,
        branchId,
        organizationId,
        performedByUserId,
        description: `Tedarikçi Alış Faturası Ödemesi — Fatura: ${purchase.invoiceNo}`
      });
    }

    // 4. Publish Domain Event
    await EventBus.publish({
      type: 'PURCHASE_COMPLETED',
      payload: { purchase, supplierId, branchId },
      timestamp: new Date().toISOString(),
      triggeredByUserId: performedByUserId,
      organizationId,
      branchId
    });

    return { updatedSuppliers, updatedStockList };
  }
}
