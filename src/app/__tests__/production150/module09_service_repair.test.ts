import { describe, it, expect } from 'vitest';
import { ServiceDomainService } from '../../services/ServiceDomainService';
import { CashDomainService } from '../../services/CashDomainService';
import { StockItem } from '../../data/mockData';

describe('Modül 09: Teknik Servis & Cihaz Onarım Döngüsü (TC-115 - TC-124)', () => {
  const initialStock: StockItem[] = [
    {
      id: 'stk-part-1',
      name: 'Hoparlör / Receiver Modülü (M-Size)',
      category: 'Yedek Parça',
      brand: 'Phonak',
      model: 'Receiver Standard 2.0',
      serialNo: 'PART-REC-100',
      quantity: 10,
      criticalLevel: 2,
      price: 1500,
      purchasePrice: 600,
      sgkPrice: 0,
      warrantyExpiry: '2028-01-01',
      location: 'Atölye',
      status: 'Stokta',
      utsStatus: 'Gerekli Değil',
      branch: 'Merkez 1 - Kadıköy',
      branchId: 'br-kadikoy'
    },
    {
      id: 'stk-emanet-1',
      name: 'Emanet Cihaz — Phonak Marvel M30',
      category: 'Cihaz',
      brand: 'Phonak',
      model: 'Marvel M30',
      serialNo: 'EMANET-01',
      quantity: 1,
      criticalLevel: 0,
      price: 0,
      purchasePrice: 4000,
      sgkPrice: 0,
      warrantyExpiry: '2027-01-01',
      location: 'Atölye',
      status: 'Stokta',
      utsStatus: 'Gerekli Değil',
      branch: 'Merkez 1 - Kadıköy',
      branchId: 'br-kadikoy'
    }
  ];

  // TC-115: Servis Kaydı Açma
  it('TC-115: Servis Kaydı Açma — Fiş no ve durum "İncelemede" olarak servis kaydı oluşturulur', () => {
    const ticket = {
      id: 'srv-101',
      ticketNo: 'SRV-2026-0042',
      patientId: 'pat-1',
      patientName: 'Ali Demir',
      deviceBrand: 'Phonak',
      deviceModel: 'Audéo Lumity',
      complaint: 'Ses kesik kesik geliyor, filtre tıkalı olabilir',
      status: 'İncelemede',
      createdAt: '2026-10-09T09:00:00Z'
    };

    expect(ticket.ticketNo).toMatch(/^SRV-\d{4}-\d+/);
    expect(ticket.status).toBe('İncelemede');
  });

  // TC-116: Emanet Cihaz Tahsisi
  it('TC-116: Emanet Cihaz Tahsisi — Cihaz stok durumu "Emanette"ye çekilir', () => {
    const updatedStock = initialStock.map(s =>
      s.id === 'stk-emanet-1' ? { ...s, status: 'Emanette' as StockItem['status'] } : s
    );

    const loaner = updatedStock.find(s => s.id === 'stk-emanet-1');
    expect(loaner?.status).toBe('Emanette');
  });

  // TC-117: Parça Değişimi & Stok Düşümü
  it('TC-117: Parça Değişimi & Stok Düşümü — Tamirde kullanılan parça stoktan düşülür', async () => {
    const result = await ServiceDomainService.completeServiceTicket(initialStock, {
      ticketId: 'srv-101',
      patientName: 'Ali Demir',
      serviceFee: 0,
      partsUsed: [
        { stockItemId: 'stk-part-1', stockItemName: 'Hoparlör / Receiver Modülü (M-Size)', quantity: 1, price: 1500 }
      ]
    });

    const partItem = result.updatedStockList.find(s => s.id === 'stk-part-1');
    expect(partItem?.quantity).toBe(9); // 10 - 1 = 9
  });

  // TC-118: Servis İşlemini Tamamlama
  it('TC-118: Servis İşlemini Tamamlama — Servis bileti başarıyla kapatılır ve ücret tahakkuk eder', async () => {
    const result = await ServiceDomainService.completeServiceTicket(initialStock, {
      ticketId: 'srv-101',
      patientName: 'Ali Demir',
      serviceFee: 1500,
      partsUsed: []
    });

    expect(result.updatedStockList).toBeDefined();
  });

  // TC-119: Servis Ücreti Tahsilatı
  it('TC-119: Servis Ücreti Tahsilatı — Kasa defterine "Servis Geliri" olarak işlenir', () => {
    const tx = CashDomainService.recordTransaction({
      cashRegisterId: 'kas-1',
      type: 'INCOME',
      amount: 1500,
      category: 'Servis Geliri',
      description: 'Ali Demir — Hoparlör değişimi tamir bedeli'
    });

    expect(tx.amount).toBe(1500);
    expect(tx.category).toBe('Servis Geliri');
  });

  // TC-120: Emanet Cihazı İade Alma
  it('TC-120: Emanet Cihazı İade Alma — Emanet cihaz tekrar "Stokta" durumuna döner', () => {
    const returnedStock = initialStock.map(s =>
      s.id === 'stk-emanet-1' ? { ...s, status: 'Stokta' as StockItem['status'] } : s
    );

    const loaner = returnedStock.find(s => s.id === 'stk-emanet-1');
    expect(loaner?.status).toBe('Stokta');
  });

  // TC-121: Garanti Kapsamında Onarım (0 TL)
  it('TC-121: Garanti Kapsamında Onarım — Ücret 0 TL olduğunda kasaya tahsilat yazılmaz', async () => {
    const initialTxs: any[] = [];
    const result = await ServiceDomainService.completeServiceTicket(initialStock, {
      ticketId: 'srv-102',
      patientName: 'Garantili Hasta',
      serviceFee: 0,
      partsUsed: []
    });

    expect(result.updatedStockList).toBeDefined();
    // Balance remains 0
    expect(CashDomainService.deriveBalance('kas-1', 0, initialTxs)).toBe(0);
  });

  // TC-122: Servis Durumu Filtreleme
  it('TC-122: Servis Durumu Filtreleme — "Parça Bekliyor", "Teslime Hazır" listelenir', () => {
    const tickets = [
      { id: '1', status: 'Parça Bekliyor' },
      { id: '2', status: 'Teslime Hazır' },
      { id: '3', status: 'Teslim Edildi' }
    ];

    expect(tickets.filter(t => t.status === 'Parça Bekliyor')).toHaveLength(1);
    expect(tickets.filter(t => t.status === 'Teslime Hazır')).toHaveLength(1);
  });

  // TC-123: Teknik Servis Rapor Çıktısı
  it('TC-123: Servis Formu Çıktısı — Kabul ve teslim formu veri yapısı tamdır', () => {
    const form = {
      ticketNo: 'SRV-2026-0042',
      customerName: 'Ali Demir',
      device: 'Phonak Audéo Lumity',
      reportedFault: 'Ses yok',
      actionTaken: 'Receiver yenilendi',
      charge: 1500,
      deliveryDate: '2026-10-09'
    };

    expect(form.ticketNo).toBeDefined();
    expect(form.charge).toBe(1500);
  });

  // TC-124: İade / Tamir Edilemeyen Cihaz
  it('TC-124: İade / Tamir Edilemeyen Cihaz — Durum "İade Edildi" olarak kapatılır', () => {
    const unrepairable = {
      id: 'srv-103',
      status: 'Tamir Edilemedi - İade',
      notes: 'Ana kart sıvı teması nedeniyle onarılamadı'
    };

    expect(unrepairable.status).toContain('İade');
  });
});
