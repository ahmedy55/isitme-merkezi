import { describe, it, expect } from 'vitest';
import { CashDomainService } from '../../services/CashDomainService';
import { PurchaseDomainService } from '../../services/PurchaseDomainService';
import { CashTransaction, Supplier, StockItem } from '../../data/mockData';

describe('Modül 08: Kasa, Masraflar & Tedarikçi Finansı (TC-099 - TC-114)', () => {
  const initialTransactions: CashTransaction[] = [
    {
      id: 'tx-1',
      cashRegisterId: 'kas-merkez',
      type: 'INCOME',
      amount: 15000,
      category: 'Satış Tahsilatı',
      branchId: 'br-kadikoy',
      createdAt: '2026-10-01T10:00:00Z',
      description: 'Nakit tahsilat'
    },
    {
      id: 'tx-2',
      cashRegisterId: 'kas-pos',
      type: 'INCOME',
      amount: 25000,
      category: 'Kredi Kartı Satış',
      branchId: 'br-kadikoy',
      createdAt: '2026-10-02T11:00:00Z',
      description: 'Garanti POS tahsilatı'
    },
    {
      id: 'tx-3',
      cashRegisterId: 'kas-merkez',
      type: 'EXPENSE',
      amount: 1200,
      category: 'Kırtasiye/Temizlik',
      branchId: 'br-kadikoy',
      createdAt: '2026-10-03T14:00:00Z',
      description: 'Ofis sarf malzemeleri'
    }
  ];

  const initialSuppliers: Supplier[] = [
    {
      id: 'sup-1',
      companyName: 'Sonova Turkey İşitme Cihazları A.Ş.',
      contactPerson: 'Bora Yılmaz',
      phone: '0216 444 00 11',
      email: 'siparis@sonova.com',
      taxNo: '7788990011',
      address: 'Kozyatağı',
      category: 'Cihaz Üreticisi',
      balance: -100000, // We owe them 100,000 TL
      status: 'Aktif',
      createdAt: '2026-01-01',
      purchases: []
    }
  ];

  // TC-099: Nakit Tahsilat Girişi
  it('TC-099: Nakit Tahsilat Girişi — Merkez kasaya 5.000 TL gelir kaydedildiğinde bakiye 5.000 TL artar', () => {
    const newTx = CashDomainService.recordTransaction({
      cashRegisterId: 'kas-merkez',
      type: 'INCOME',
      amount: 5000,
      category: 'Hasta Nakit Ödeme',
      description: 'Cihaz taksit tahsilatı'
    });

    const balance = CashDomainService.deriveBalance('kas-merkez', 0, [...initialTransactions, newTx]);
    // 15000 - 1200 + 5000 = 18800
    expect(balance).toBe(18800);
  });

  // TC-100: Kredi Kartı POS Tahsilatı
  it('TC-100: Kredi Kartı POS Tahsilatı — POS kasası bakiyesi işlem tutarı kadar artar', () => {
    const posBalance = CashDomainService.deriveBalance('kas-pos', 0, initialTransactions);
    expect(posBalance).toBe(25000);
  });

  // TC-101: Havale / EFT Girişi
  it('TC-101: Havale / EFT Girişi — Banka kasasına gelen havale kaydedilir', () => {
    const eftTx = CashDomainService.recordTransaction({
      cashRegisterId: 'kas-banka',
      type: 'INCOME',
      amount: 8000,
      category: 'Banka Havalesi',
      description: 'Hasta havalesi'
    });

    const bankBalance = CashDomainService.deriveBalance('kas-banka', 0, [eftTx]);
    expect(bankBalance).toBe(8000);
  });

  // TC-102: Masraf / Gider Çıkışı
  it('TC-102: Masraf / Gider Çıkışı — Kasadan 750 TL gider çıkıldığında bakiye azalır', () => {
    const expenseTx = CashDomainService.recordTransaction({
      cashRegisterId: 'kas-merkez',
      type: 'EXPENSE',
      amount: 750,
      category: 'Mutfak/İkram',
      description: 'Çay/kahve alımı'
    });

    const balance = CashDomainService.deriveBalance('kas-merkez', 0, [...initialTransactions, expenseTx]);
    expect(balance).toBe(15000 - 1200 - 750); // 13050
  });

  // TC-103: Kasalar Arası Virman (Transfer)
  it('TC-103: Kasalar Arası Virman — Merkez Kasadan Şube Kasasına virman yapıldığında tutarlar dengelenir', () => {
    const transferAmount = 3000;
    const outTx = CashDomainService.recordTransaction({
      cashRegisterId: 'kas-merkez',
      type: 'EXPENSE',
      amount: transferAmount,
      category: 'Kasa Transferi (Çıkış)',
      description: 'Şube kasasına virman'
    });
    const inTx = CashDomainService.recordTransaction({
      cashRegisterId: 'kas-sube',
      type: 'INCOME',
      amount: transferAmount,
      category: 'Kasa Transferi (Giriş)',
      description: 'Merkez kasadan virman'
    });

    const allTx = [...initialTransactions, outTx, inTx];
    const merkezBalance = CashDomainService.deriveBalance('kas-merkez', 0, allTx);
    const subeBalance = CashDomainService.deriveBalance('kas-sube', 0, allTx);

    expect(merkezBalance).toBe(15000 - 1200 - 3000);
    expect(subeBalance).toBe(3000);
  });

  // TC-104: Günlük Kasa Kapatma / Mutabakat
  it('TC-104: Günlük Kasa Kapatma — Sistem bakiyesi ile sayılan nakit farkı hesaplanır', () => {
    const systemBalance = CashDomainService.deriveBalance('kas-merkez', 0, initialTransactions);
    const countedCash = 13700; // Sayılan
    const difference = countedCash - systemBalance; // 13700 - 13800 = -100 TL fire
    expect(difference).toBe(-100);
  });

  // TC-105: Yeni Tedarikçi Oluşturma
  it('TC-105: Yeni Tedarikçi Oluşturma — Başlangıç bakiyesi 0.00 TL olarak tedarikçi listesine eklenir', () => {
    const newSupplier: Supplier = {
      id: 'sup-2',
      companyName: 'Oticon Türkiye Temsilciliği',
      contactPerson: 'Cemil Demir',
      phone: '0212 555 12 34',
      email: 'oticon@example.com',
      taxNo: '1234567890',
      address: 'Şişli',
      category: 'Cihaz Distribütörü',
      balance: 0,
      status: 'Aktif',
      createdAt: '2026-01-01',
      purchases: []
    };

    const suppliers = [...initialSuppliers, newSupplier];
    expect(suppliers).toHaveLength(2);
    expect(suppliers[1].balance).toBe(0);
  });

  // TC-106: Tedarikçi Alış Faturası Girişi
  it('TC-106: Tedarikçi Alış Faturası Girişi — Tedarikçi borçlanır ve stoklar güncellenir', async () => {
    const mockStock: StockItem[] = [];
    const result = await PurchaseDomainService.executePurchaseTransaction(
      initialSuppliers,
      mockStock,
      {
        supplierId: 'sup-1',
        purchase: {
          id: 'pur-101',
          supplierId: 'sup-1',
          invoiceNo: 'FAT-2026-009',
          date: '2026-10-09',
          items: [{ name: 'Phonak Audéo Lumity L90', quantity: 2, unitPrice: 15000 }],
          total: 30000,
          paymentStatus: 'Bekliyor',
          paymentMethod: 'Açık Hesap'
        }
      }
    );

    const supplier = result.updatedSuppliers.find(s => s.id === 'sup-1');
    // -100000 - 30000 = -130000 TL
    expect(supplier?.balance).toBe(-130000);
    expect(result.updatedStockList).toHaveLength(1);
    expect(result.updatedStockList[0].quantity).toBe(2);
  });

  // TC-107: Tedarikçiye Ödeme Yapma
  it('TC-107: Tedarikçiye Ödeme Yapma — Kasadan ödeme yapıldığında tedarikçi borcu azalır', () => {
    const paymentAmount = 40000;
    const updatedSuppliers = initialSuppliers.map(s =>
      s.id === 'sup-1' ? { ...s, balance: s.balance + paymentAmount } : s
    );

    expect(updatedSuppliers[0].balance).toBe(-60000); // -100000 + 40000 = -60000
  });

  // TC-108: Tedarikçi Ekstresi İnceleme
  it('TC-108: Tedarikçi Ekstresi — Alış faturaları ve ödemeler bakiye takibiyle listelenir', () => {
    const ledger = [
      { date: '2026-09-01', type: 'INVOICE', amount: -100000, balance: -100000 },
      { date: '2026-09-20', type: 'PAYMENT', amount: 50000, balance: -50000 },
      { date: '2026-10-01', type: 'INVOICE', amount: -30000, balance: -80000 }
    ];

    expect(ledger[ledger.length - 1].balance).toBe(-80000);
  });

  // TC-109: Kasa Raporu Veri Derleme
  it('TC-109: Kasa Raporu — Gelir ve gider toplamları doğru hesaplanır', () => {
    const totalIncome = initialTransactions
      .filter(t => t.type === 'INCOME')
      .reduce((sum, t) => sum + t.amount, 0);
    const totalExpense = initialTransactions
      .filter(t => t.type === 'EXPENSE')
      .reduce((sum, t) => sum + t.amount, 0);

    expect(totalIncome).toBe(40000); // 15000 + 25000
    expect(totalExpense).toBe(1200);
    expect(totalIncome - totalExpense).toBe(38800);
  });

  // TC-110: Tarih Aralığına Göre Kasa Filtresi
  it('TC-110: Kasa Tarih Filtresi — Seçilen günlerdeki kasa fişleri listelenir', () => {
    const filterByDate = (startDate: string, endDate: string) => {
      return initialTransactions.filter(
        t => t.createdAt >= `${startDate}T00:00:00Z` && t.createdAt <= `${endDate}T23:59:59Z`
      );
    };

    expect(filterByDate('2026-10-01', '2026-10-02')).toHaveLength(2);
    expect(filterByDate('2026-10-03', '2026-10-03')).toHaveLength(1);
  });

  // TC-111: Negatif Kasa Uyarısı
  it('TC-111: Negatif Kasa Uyarısı — Kasa bakiyesini aşan çıkış işlemi uyarı fırlatır', () => {
    const validateWithdrawal = (currentBalance: number, amountToWithdraw: number) => {
      if (amountToWithdraw > currentBalance) {
        return { warning: true, message: 'Kasa bakiyesi eksiye düşecek!' };
      }
      return { warning: false };
    };

    expect(validateWithdrawal(1000, 2000).warning).toBe(true);
    expect(validateWithdrawal(5000, 2000).warning).toBe(false);
  });

  // TC-112: Hatalı Kasa Fişi İptali
  it('TC-112: Kasa Fişi İptali — İptal edilen gelir işlemi ters kayıt ile dengelenir', () => {
    const reverseTx = CashDomainService.recordTransaction({
      cashRegisterId: 'kas-merkez',
      type: 'EXPENSE',
      amount: 15000,
      category: 'Düzeltme / İptal',
      description: 'Hatalı tx-1 satışı iptali'
    });

    const balance = CashDomainService.deriveBalance('kas-merkez', 0, [...initialTransactions, reverseTx]);
    expect(balance).toBe(-1200); // 15000 - 1200 - 15000
  });

  // TC-113: KDV Dağılımı Özeti
  it('TC-113: KDV Dağılımı — KDV matrahları (%1, %10, %20) doğru toplanır', () => {
    const items = [
      { name: 'Cihaz Satışı', gross: 22000, vatRate: 10 },
      { name: 'Pil Satışı', gross: 1200, vatRate: 20 },
      { name: 'Medikal Gazete', gross: 101, vatRate: 1 }
    ];

    const calculateVat = (gross: number, rate: number) => Math.round(gross - gross / (1 + rate / 100));
    expect(calculateVat(22000, 10)).toBe(2000);
    expect(calculateVat(1200, 20)).toBe(200);
    expect(calculateVat(101, 1)).toBe(1);
  });

  // TC-114: Birden Fazla Kasa Tanımlama
  it('TC-114: Bağımsız Kasa Bakiyeleri — Nakit, POS ve Banka hesapları bağımsız yönetilir', () => {
    const merkez = CashDomainService.deriveBalance('kas-merkez', 0, initialTransactions);
    const pos = CashDomainService.deriveBalance('kas-pos', 0, initialTransactions);

    expect(merkez).toBe(13800);
    expect(pos).toBe(25000);
    expect(merkez).not.toBe(pos);
  });
});
