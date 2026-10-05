import { describe, it, expect } from 'vitest';
import { EventBus } from '../EventBus';
import { StockDomainService } from '../StockDomainService';
import { CashDomainService } from '../CashDomainService';
import { SGKDomainService } from '../SGKDomainService';
import { StockItem, Patient } from '../../data/mockData';

describe('Enterprise ERP Architecture Domain Services', () => {
  it('EventBus should correctly publish and subscribe to domain events', async () => {
    let eventReceived = false;
    const unsubscribe = EventBus.on('SALE_COMPLETED', (event) => {
      expect(event.type).toBe('SALE_COMPLETED');
      eventReceived = true;
    });

    await EventBus.publish({
      type: 'SALE_COMPLETED',
      payload: { saleId: 'test-1', amount: 15000 },
      timestamp: new Date().toISOString()
    });

    expect(eventReceived).toBe(true);
    unsubscribe();
  });

  it('StockDomainService should update stock and prevent negative stock concurrency error', async () => {
    const mockStock: StockItem[] = [
      {
        id: 'stk-test',
        name: 'Test Device',
        category: 'Cihaz',
        brand: 'Phonak',
        model: 'Audéo',
        serialNo: 'SN-100',
        quantity: 1,
        criticalLevel: 2,
        purchasePrice: 5000,
        price: 12000,
        branch: 'Kadıköy',
        status: 'Stokta',
        sgkPrice: 6200,
        warrantyExpiry: '2028-01-01',
        location: 'Depo',
        utsStatus: 'Bekliyor'
      }
    ];

    // Deduction of 1 item
    const result = StockDomainService.processMovement(mockStock, {
      stockItemId: 'stk-test',
      stockItemName: 'Test Device',
      type: 'SALE',
      quantityChange: -1,
      unitPrice: 12000,
      referenceEntity: 'sale',
      referenceId: 'sal-1'
    });

    expect(result.updatedStockList[0].quantity).toBe(0);
    expect(result.updatedStockList[0].status).toBe('Satıldı');

    // Trying to deduct when stock is 0 should throw negative stock error
    expect(() =>
      StockDomainService.processMovement(result.updatedStockList, {
        stockItemId: 'stk-test',
        stockItemName: 'Test Device',
        type: 'SALE',
        quantityChange: -1,
        unitPrice: 12000,
        referenceEntity: 'sale',
        referenceId: 'sal-2'
      })
    ).toThrow('Yetersiz stok!');
  });

  it('CashDomainService never invents balances when no ledger rows are supplied', () => {
    expect(CashDomainService.deriveBalance('kas-1')).toBe(0);
    expect(CashDomainService.deriveBalance('kas-1', 500)).toBe(500);
  });

  it('CashDomainService derives a balance only from supplied ledger rows', () => {
    const balance = CashDomainService.deriveBalance('kas-1', 100, [
      { id: '1', cashRegisterId: 'kas-1', type: 'INCOME', amount: 750, category: 'Satış', createdAt: '2026-01-01' },
      { id: '2', cashRegisterId: 'kas-1', type: 'EXPENSE', amount: 250, category: 'Gider', createdAt: '2026-01-02' },
      { id: '3', cashRegisterId: 'kas-2', type: 'INCOME', amount: 9000, category: 'Satış', createdAt: '2026-01-03' },
    ]);
    expect(balance).toBe(600);
  });

  it('SGKDomainService should approve prescription and return 5-year renewal date', async () => {
    const mockPatient: Patient = {
      id: 'pat-1',
      firstName: 'Ayşe',
      lastName: 'Yılmaz',
      tc: '11111111111',
      phone: '05321112233',
      sgkStatus: 'Aktif',
      salesStage: 'Satış Yapıldı',
      email: 'ayse@example.com',
      birthDate: '1985-01-01',
      gender: 'Kadın',
      address: 'İstanbul',
      hearingLoss: 'Orta',
      hearingLossSide: 'Her İki Kulak'
    };

    const sgkResult = await SGKDomainService.approvePrescription([mockPatient], [], {
      patientId: 'pat-1',
      prescriptionNo: 'REC-2026-100',
      reportNo: 'RAP-2026-100'
    });

    const expectedRenewalYear = new Date().getFullYear() + 5;
    expect(sgkResult.newRecall.dueDate).toContain(String(expectedRenewalYear));
  });
});
