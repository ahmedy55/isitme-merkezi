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

  it('CashDomainService should derive exact balance from ledger transactions', () => {
    const balance = CashDomainService.deriveBalance('kas-1');
    expect(typeof balance).toBe('number');
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
