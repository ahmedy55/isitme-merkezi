export type AssetCategory = 'Cihaz' | 'Mobilya' | 'Bilgisayar' | 'Ofis Ekipmanı' | 'Diğer';

const comparisonKey = (value: unknown): string => {
  if (typeof value !== 'string') return '';
  return value
    .trim()
    .toLocaleLowerCase('tr-TR')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ı/g, 'i')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
};

/** Convert persisted and older localized category labels to the filter's canonical values. */
export function normalizeAssetCategory(value: unknown): AssetCategory {
  const key = comparisonKey(value);
  if (['cihaz', 'klinik cihaz', 'isitme cihazi', 'hearing device'].includes(key)) return 'Cihaz';
  if (['mobilya', 'furniture'].includes(key)) return 'Mobilya';
  if (['bilgisayar', 'bilgisayar cevre', 'computer', 'computer peripheral'].includes(key)) return 'Bilgisayar';
  if (['ofis ekipmani', 'office equipment'].includes(key)) return 'Ofis Ekipmanı';
  return 'Diğer';
}

/** Normalize known status aliases without silently treating unknown values as active. */
export function normalizeAssetStatus(value: unknown): string {
  const raw = typeof value === 'string' ? value.trim() : '';
  const key = comparisonKey(raw);
  if (['aktif', 'active'].includes(key)) return 'Aktif';
  if (['bakimda', 'maintenance'].includes(key)) return 'Bakımda';
  if (['onarimda', 'arizali', 'repair', 'broken'].includes(key)) return 'Onarımda';
  if (['hek iskarta', 'hek', 'iskarta'].includes(key)) return 'Hek/Iskarta';
  if (['hurda', 'scrapped', 'retired'].includes(key)) return 'Hurda';
  if (['satildi', 'sold'].includes(key)) return 'Satıldı';
  return raw || 'Belirtilmemiş';
}
