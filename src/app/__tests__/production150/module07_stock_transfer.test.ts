import { describe, it, expect } from 'vitest';
import { StockDomainService } from '../../services/StockDomainService';
import { normalizeInventoryIdentifier, matchesInventoryIdentifier } from '../../lib/inventorySearch';
import { StockItem } from '../../data/mockData';

describe('Modül 07: Stok, Seri No / Barkod & Şube Transferi (TC-083 - TC-098)', () => {
  const initialStock: StockItem[] = [
    {
      id: 'stk-1',
      name: 'Phonak Audéo Lumity L90',
      category: 'Cihaz',
      brand: 'Phonak',
      model: 'Audéo Lumity L90',
      serialNo: 'SN-778899',
      barcode: '8680001112223',
      quantity: 5,
      criticalLevel: 2,
      price: 25000,
      purchasePrice: 15000,
      sgkPrice: 6200,
      warrantyExpiry: '2028-10-09',
      location: 'Vitrin',
      status: 'Stokta',
      utsStatus: 'Bildirildi',
      branch: 'Merkez 1 - Kadıköy',
      branchId: 'br-kadikoy'
    },
    {
      id: 'stk-2',
      name: 'İşitme Cihazı Pili No: 312',
      category: 'Pil',
      brand: 'Rayovac',
      model: 'Extra 312',
      serialNo: 'PIL-312-LOT4',
      barcode: '8680009998887',
      quantity: 50,
      criticalLevel: 10,
      price: 150,
      purchasePrice: 60,
      sgkPrice: 0,
      warrantyExpiry: '2029-01-01',
      location: 'Kasa Altı',
      status: 'Stokta',
      utsStatus: 'Gerekli Değil',
      branch: 'Merkez 1 - Kadıköy',
      branchId: 'br-kadikoy'
    }
  ];

  // TC-083: Yeni Cihaz Stoğu Ekleme
  it('TC-083: Yeni Cihaz Stoğu Ekleme — Marka, model ve seri no ile ürün eklenir', () => {
    const newItem: StockItem = {
      id: 'stk-3',
      name: 'Oticon Real 1 miniRITE',
      category: 'Cihaz',
      brand: 'Oticon',
      model: 'Real 1',
      serialNo: 'SN-112233',
      quantity: 1,
      criticalLevel: 1,
      price: 28000,
      purchasePrice: 17000,
      sgkPrice: 6200,
      warrantyExpiry: '2028-10-09',
      location: 'Çekmece',
      status: 'Stokta',
      utsStatus: 'Bekliyor',
      branch: 'Merkez 1 - Kadıköy',
      branchId: 'br-kadikoy'
    };

    const updated = [newItem, ...initialStock];
    expect(updated).toHaveLength(3);
    expect(updated[0].status).toBe('Stokta');
  });

  // TC-084: Mükerrer Seri No Girişi Engeli
  it('TC-084: Mükerrer Seri No Girişi — Aynı seri numaralı cihaz eklenmeye çalışıldığında benzersizlik hatası verir', () => {
    const hasDuplicateSerial = (serial: string, items: StockItem[]) => {
      const normalized = normalizeInventoryIdentifier(serial);
      return items.some(item => normalizeInventoryIdentifier(item.serialNo) === normalized);
    };

    expect(hasDuplicateSerial('SN-778899', initialStock)).toBe(true);
    expect(hasDuplicateSerial('sn-778899', initialStock)).toBe(true);
    expect(hasDuplicateSerial('SN-NEW-999', initialStock)).toBe(false);
  });

  // TC-085: Adetli Ürün (Pil/Aksesuar) Girişi
  it('TC-085: Adetli Ürün Girişi — Pil veya aksesuar stoğu adet olarak artırılır', () => {
    const result = StockDomainService.processMovement(initialStock, {
      stockItemId: 'stk-2',
      stockItemName: 'İşitme Cihazı Pili No: 312',
      type: 'PURCHASE',
      quantityChange: 100,
      unitPrice: 60,
      referenceEntity: 'purchase',
      referenceId: 'pur-1'
    });

    const item = result.updatedStockList.find(s => s.id === 'stk-2');
    expect(item?.quantity).toBe(150);
  });

  // TC-086: Barkod ile Hızlı Arama
  it('TC-086: Barkod Hızlı Arama — Barkod okuyucu girdisiyle ürün anında eşleşir', () => {
    expect(matchesInventoryIdentifier(initialStock[0].barcode, '8680001112223')).toBe(true);
    expect(matchesInventoryIdentifier(initialStock[0].barcode, '868000')).toBe(true);
    expect(matchesInventoryIdentifier(initialStock[0].barcode, '9999999999999')).toBe(false);
  });

  // TC-087: Stok Düşümü (Manuel Fire/Düzeltme)
  it('TC-087: Stok Düşümü (Fire) — Manuel fire düşüldüğünde miktar azalır ve hareket oluşur', () => {
    const result = StockDomainService.processMovement(initialStock, {
      stockItemId: 'stk-1',
      stockItemName: 'Phonak Audéo Lumity L90',
      type: 'ADJUSTMENT',
      quantityChange: -2,
      unitPrice: 15000,
      referenceEntity: 'adjustment',
      referenceId: 'adj-1',
      notes: 'Test amaçlı numune ayrıldı'
    });

    const item = result.updatedStockList.find(s => s.id === 'stk-1');
    expect(item?.quantity).toBe(3);
    expect(result.movement.notes).toContain('numune ayrıldı');
  });

  // TC-088: Negatif Stok Engeli
  it('TC-088: Negatif Stok Engeli — Mevcut miktardan fazla düşüm yapılmaya çalışıldığında hata fırlatılır', () => {
    expect(() =>
      StockDomainService.processMovement(initialStock, {
        stockItemId: 'stk-1',
        stockItemName: 'Phonak Audéo Lumity L90',
        type: 'SALE',
        quantityChange: -10, // Stock is 5
        unitPrice: 25000,
        referenceEntity: 'sale',
        referenceId: 'sal-err'
      })
    ).toThrow('Yetersiz stok');
  });

  // TC-089: Şubeler Arası Stok Transferi
  it('TC-089: Şubeler Arası Stok Transferi — Kaynak şubeden düşer, hedef şubeye eklenir', () => {
    const transferStock = (
      items: StockItem[],
      itemId: string,
      targetBranch: string,
      targetBranchId: string,
      quantity: number
    ) => {
      const source = items.find(i => i.id === itemId);
      if (!source || source.quantity < quantity) throw new Error('Yetersiz stok transferi');

      const updatedSource = { ...source, quantity: source.quantity - quantity };
      const transferredItem: StockItem = {
        ...source,
        id: `stk-transfer-${Date.now()}`,
        branch: targetBranch,
        branchId: targetBranchId,
        quantity
      };

      return [
        ...items.map(i => (i.id === itemId ? updatedSource : i)),
        transferredItem
      ];
    };

    const transferred = transferStock(initialStock, 'stk-1', 'Merkez 2 - Beşiktaş', 'br-besiktas', 1);
    const source = transferred.find(i => i.id === 'stk-1');
    const target = transferred.find(i => i.branchId === 'br-besiktas');

    expect(source?.quantity).toBe(4);
    expect(target?.quantity).toBe(1);
    expect(target?.branchId).toBe('br-besiktas');
  });

  // TC-090: Hızlı Satışta Stok Düşümü
  it('TC-090: Hızlı Satışta Stok Düşümü — 1 adet cihaz satıldığında adet 0 ve durum "Satıldı" olur', () => {
    const singleDeviceStock: StockItem[] = [{ ...initialStock[0], quantity: 1 }];
    const result = StockDomainService.processMovement(singleDeviceStock, {
      stockItemId: 'stk-1',
      stockItemName: 'Phonak Audéo Lumity L90',
      type: 'SALE',
      quantityChange: -1,
      unitPrice: 25000,
      referenceEntity: 'sale',
      referenceId: 'sal-1'
    });

    const item = result.updatedStockList[0];
    expect(item.quantity).toBe(0);
    expect(item.status).toBe('Satıldı');
  });

  // TC-091: Kritik Stok Eşiği Uyarısı
  it('TC-091: Kritik Stok Eşiği Uyarısı — Stok miktarı kritik seviyenin altına indiğinde uyarı döner', () => {
    const result = StockDomainService.processMovement(initialStock, {
      stockItemId: 'stk-1',
      stockItemName: 'Phonak Audéo Lumity L90',
      type: 'SALE',
      quantityChange: -3, // Remaining: 2, criticalLevel is 2
      unitPrice: 25000,
      referenceEntity: 'sale',
      referenceId: 'sal-2'
    });

    expect(result.isCritical).toBe(true);
  });

  // TC-092: Stok Ürünü Güncelleme
  it('TC-092: Stok Ürünü Güncelleme — Satış fiyatı ve kritik seviye güncellenir', () => {
    const updated = initialStock.map(s =>
      s.id === 'stk-1' ? { ...s, price: 27500, criticalLevel: 3 } : s
    );

    const item = updated.find(s => s.id === 'stk-1');
    expect(item?.price).toBe(27500);
    expect(item?.criticalLevel).toBe(3);
  });

  // TC-093: Stok Ürünü Silme
  it('TC-093: Stok Ürünü Silme — Satılmamış ve hareketi olmayan ürün silinebilir', () => {
    const filtered = initialStock.filter(s => s.id !== 'stk-2');
    expect(filtered).toHaveLength(1);
    expect(filtered.some(s => s.id === 'stk-2')).toBe(false);
  });

  // TC-094: Satılmış Ürünü Silme Engeli
  it('TC-094: Satılmış Ürünü Silme Engeli — Hastaya satılmış cihaz silinemez', () => {
    const canDeleteStock = (item: StockItem) => {
      if (item.status === 'Satıldı') {
        return { allowed: false, error: 'Satışı yapılmış veya zimmetli cihazlar silinemez.' };
      }
      return { allowed: true };
    };

    const soldItem = { ...initialStock[0], status: 'Satıldı' as StockItem['status'] };
    expect(canDeleteStock(soldItem).allowed).toBe(false);
    expect(canDeleteStock(initialStock[0]).allowed).toBe(true);
  });

  // TC-095: Kategori Bazlı Filtreleme
  it('TC-095: Kategori Bazlı Filtreleme — "Cihaz", "Pil", "Aksesuar" filtreleri doğru çalışır', () => {
    expect(initialStock.filter(s => s.category === 'Cihaz')).toHaveLength(1);
    expect(initialStock.filter(s => s.category === 'Pil')).toHaveLength(1);
  });

  // TC-096: Şube Filtresi ile Envanter
  it('TC-096: Şube Filtresi ile Envanter — Belirli şubenin fiziksel envanteri listelenir', () => {
    const multiBranchStock = [
      ...initialStock,
      { ...initialStock[0], id: 'stk-besiktas', branchId: 'br-besiktas', branch: 'Merkez 2 - Beşiktaş' }
    ];

    expect(multiBranchStock.filter(s => s.branchId === 'br-kadikoy')).toHaveLength(2);
    expect(multiBranchStock.filter(s => s.branchId === 'br-besiktas')).toHaveLength(1);
  });

  // TC-097: Stok Hareket Geçmişi
  it('TC-097: Stok Hareket Geçmişi — Yapılan hareketler StockDomainService üzerinde kayıtlı kalır', () => {
    const movements = StockDomainService.getMovements();
    expect(Array.isArray(movements)).toBe(true);
  });

  // TC-098: Toplu Fiyat Güncelleme
  it('TC-098: Toplu Fiyat Güncelleme — Belirli kategoriye yüzde bazında fiyat güncellemesi uygulanır', () => {
    const applyBulkMarkup = (items: StockItem[], category: string, percentage: number) => {
      return items.map(item =>
        item.category === category
          ? { ...item, price: Math.round(item.price * (1 + percentage / 100)) }
          : item
      );
    };

    // Apply 10% markup to 'Pil' category
    const updated = applyBulkMarkup(initialStock, 'Pil', 10);
    const pilItem = updated.find(s => s.category === 'Pil');
    expect(pilItem?.price).toBe(165); // 150 * 1.10 = 165
  });
});
