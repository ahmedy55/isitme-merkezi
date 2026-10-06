import { describe, expect, it } from 'vitest';
import { normalizeAssetCategory, normalizeAssetStatus } from '../assetFilters';

describe('asset filter values', () => {
  it.each([
    ['Klinik Cihaz', 'Cihaz'],
    ['cihaz', 'Cihaz'],
    ['Bilgisayar & Çevre', 'Bilgisayar'],
    ['ofis ekipmani', 'Ofis Ekipmanı'],
    ['bilinmeyen kategori', 'Diğer'],
  ])('normalizes category %s to %s', (value, expected) => {
    expect(normalizeAssetCategory(value)).toBe(expected);
  });

  it.each([
    ['Aktif', 'Aktif'],
    ['active', 'Aktif'],
    ['Bakımda', 'Bakımda'],
    ['Arızalı', 'Onarımda'],
    ['hurda', 'Hurda'],
    [null, 'Belirtilmemiş'],
  ])('normalizes status %s to %s', (value, expected) => {
    expect(normalizeAssetStatus(value)).toBe(expected);
  });
});
