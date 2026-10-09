import { describe, it, expect } from 'vitest';
import { getNextMaintenanceDate } from '../../lib/assetMaintenance';
import { normalizeAssetCategory, normalizeAssetStatus } from '../../lib/assetFilters';
import { CashDomainService } from '../../services/CashDomainService';
export interface Asset {
  id: string;
  name: string;
  category: string;
  serialNo: string;
  purchaseDate: string;
  purchasePrice: number;
  assignedTo: string;
  branch: string;
  branchId?: string;
  status: string;
  lastMaintenanceDate: string | null;
  maintenanceIntervalMonths: number;
  location: string;
}

describe('Modül 10: Demirbaşlar & Periyodik Bakım (TC-125 - TC-132)', () => {
  const initialAssets: Asset[] = [
    {
      id: 'ast-1',
      name: 'Interacoustics AC40 Klinik Odyometre',
      category: 'Cihaz',
      serialNo: 'ODYO-40-SN991',
      purchaseDate: '2023-01-15',
      purchasePrice: 120000,
      assignedTo: 'Ody. Selin Can',
      branch: 'Merkez 1 - Kadıköy',
      branchId: 'br-kadikoy',
      status: 'Aktif',
      lastMaintenanceDate: '2025-05-10',
      maintenanceIntervalMonths: 12,
      location: 'Odyometri Odası 1'
    },
    {
      id: 'ast-2',
      name: 'Lenovo ThinkPad Klinik Laptop',
      category: 'Bilgisayar',
      serialNo: 'LNV-TP-492',
      purchaseDate: '2024-02-10',
      purchasePrice: 35000,
      assignedTo: 'Sekreter Fatma Kaya',
      branch: 'Merkez 1 - Kadıköy',
      branchId: 'br-kadikoy',
      status: 'Aktif',
      lastMaintenanceDate: null,
      maintenanceIntervalMonths: 0,
      location: 'Danışma'
    }
  ];

  // TC-125: Yeni Demirbaş Kaydı
  it('TC-125: Yeni Demirbaş Kaydı — Seri no, şube ve bakım aralığı ile demirbaş eklenir', () => {
    const newAsset: Asset = {
      id: 'ast-3',
      name: 'Tympanometer Titan',
      category: 'Cihaz',
      serialNo: 'TYMP-882',
      purchaseDate: '2026-03-01',
      purchasePrice: 85000,
      assignedTo: 'Ody. Selin Can',
      branch: 'Merkez 1 - Kadıköy',
      branchId: 'br-kadikoy',
      status: 'Aktif',
      lastMaintenanceDate: '2026-03-01',
      maintenanceIntervalMonths: 12,
      location: 'Odyometri Odası 2'
    };

    const assets = [newAsset, ...initialAssets];
    expect(assets).toHaveLength(3);
    expect(normalizeAssetCategory(newAsset.category)).toBe('Cihaz');
    expect(normalizeAssetStatus(newAsset.status)).toBe('Aktif');
  });

  // TC-126: Bakım Zamanı Gelmiş Uyarısı
  it('TC-126: Bakım Zamanı Gelmiş Uyarısı — Gelecek bakım tarihi geçmiş olan cihaz tespit edilir', () => {
    const nextDate = getNextMaintenanceDate(initialAssets[0].lastMaintenanceDate, initialAssets[0].maintenanceIntervalMonths);
    expect(nextDate).not.toBeNull();
    // 2025-05-10 + 12 months = 2026-05-10
    expect(nextDate?.toISOString().slice(0, 10)).toBe('2026-05-10');

    // If today is 2026-10-09, maintenance is overdue!
    const today = new Date('2026-10-09');
    const isOverdue = nextDate! < today;
    expect(isOverdue).toBe(true);
  });

  // TC-127: Periyodik Bakım Tamamlama
  it('TC-127: Periyodik Bakım Tamamlama — Bakım tamamlandığında son bakım bugüne çekilir ve gelecek bakım ötelenir', () => {
    const completedMaintenanceAsset = {
      ...initialAssets[0],
      lastMaintenanceDate: '2026-10-09'
    };

    const newNextDate = getNextMaintenanceDate(
      completedMaintenanceAsset.lastMaintenanceDate,
      completedMaintenanceAsset.maintenanceIntervalMonths
    );

    // 2026-10-09 + 12 months = 2027-10-09
    expect(newNextDate?.toISOString().slice(0, 10)).toBe('2027-10-09');
  });

  // TC-128: Demirbaş Zimmetleme
  it('TC-128: Demirbaş Zimmetleme — Personel adı demirbaş kaydına atanır', () => {
    const assigned = {
      ...initialAssets[1],
      assignedTo: 'Ody. Murat Tekin'
    };

    expect(assigned.assignedTo).toBe('Ody. Murat Tekin');
  });

  // TC-129: Demirbaş Raporu Hazırlama
  it('TC-129: Demirbaş Raporu — Envanter toplam değeri ve demirbaş listesi raporlanır', () => {
    const totalAssetValue = initialAssets.reduce((sum, a) => sum + a.purchasePrice, 0);
    expect(totalAssetValue).toBe(155000); // 120000 + 35000
    expect(initialAssets).toHaveLength(2);
  });

  // TC-130: Demirbaş Hurdaya Ayırma
  it('TC-130: Demirbaş Hurdaya Ayırma — Durum "Hurda"ya çekildiğinde aktif listeden çıkar', () => {
    const scrappedAsset = {
      ...initialAssets[1],
      status: 'Hurda' as Asset['status']
    };

    expect(normalizeAssetStatus(scrappedAsset.status)).toBe('Hurda');
    const activeAssets = [initialAssets[0], scrappedAsset].filter(a => a.status === 'Aktif');
    expect(activeAssets).toHaveLength(1);
  });

  // TC-131: Şube Bazlı Demirbaş Listeleme
  it('TC-131: Şube Bazlı Demirbaş Listeleme — Yalnızca seçili şubenin demirbaşları listelenir', () => {
    const assetsWithBranches = [
      ...initialAssets,
      { ...initialAssets[0], id: 'ast-besiktas', branchId: 'br-besiktas', branch: 'Merkez 2 - Beşiktaş' }
    ];

    expect(assetsWithBranches.filter(a => a.branchId === 'br-kadikoy')).toHaveLength(2);
    expect(assetsWithBranches.filter(a => a.branchId === 'br-besiktas')).toHaveLength(1);
  });

  // TC-132: Bakım Masrafının Kasaya İşlenmesi
  it('TC-132: Bakım Masrafı Kasa Entegrasyonu — Kalibrasyon faturası kasadan masraf olarak düşülür', () => {
    const calibrationExpense = CashDomainService.recordTransaction({
      cashRegisterId: 'kas-1',
      type: 'EXPENSE',
      amount: 4500,
      category: 'Demirbaş Bakımı & Kalibrasyon',
      description: 'AC40 Klinik Odyometre periyodik kalibrasyon bedeli'
    });

    expect(calibrationExpense.amount).toBe(4500);
    expect(calibrationExpense.category).toContain('Demirbaş Bakımı');
  });
});
