import { StockItem } from '../data/mockData';
import { StockDomainService } from './StockDomainService';
import { CashDomainService } from './CashDomainService';
import { EventBus } from './EventBus';

export interface CompleteServiceTicketPayload {
  ticketId: string;
  patientName: string;
  serviceFee: number;
  partsUsed?: { stockItemId: string; stockItemName: string; quantity: number; price: number }[];
  cashRegisterId?: string;
  branchId?: string;
  organizationId?: string;
  performedByUserId?: string;
}

export class ServiceDomainService {
  /**
   * Enterprise Atomic Ticket Closure for Technical Service
   */
  static async completeServiceTicket(
    currentStockList: StockItem[],
    payload: CompleteServiceTicketPayload
  ): Promise<{ updatedStockList: StockItem[] }> {
    const { ticketId, patientName, serviceFee, partsUsed = [], cashRegisterId = 'kas-1', branchId, organizationId, performedByUserId } = payload;

    let updatedStockList = currentStockList;

    // 1. Process stock movement for each used part
    for (const part of partsUsed) {
      const result = StockDomainService.processMovement(updatedStockList, {
        stockItemId: part.stockItemId,
        stockItemName: part.stockItemName,
        type: 'SERVICE',
        quantityChange: -part.quantity,
        unitPrice: part.price,
        referenceEntity: 'service',
        referenceId: ticketId,
        branchId,
        organizationId,
        performedByUserId,
        notes: `${patientName} teknik servis tamirinde parça kullanımı`
      });
      updatedStockList = result.updatedStockList;
    }

    // 2. Record service fee in cash register if fee > 0
    if (serviceFee > 0) {
      CashDomainService.recordTransaction({
        cashRegisterId,
        type: 'INCOME',
        amount: serviceFee,
        category: 'Servis Geliri',
        referenceEntity: 'service',
        referenceId: ticketId,
        branchId,
        organizationId,
        performedByUserId,
        description: `${patientName} — Cihaz tamir ve parça değişim servis ücreti`
      });
    }

    // 3. Publish Domain Event
    await EventBus.publish({
      type: 'SERVICE_COMPLETED',
      payload: { ticketId, patientName, serviceFee, partsUsed },
      timestamp: new Date().toISOString(),
      triggeredByUserId: performedByUserId,
      organizationId,
      branchId
    });

    return { updatedStockList };
  }
}
