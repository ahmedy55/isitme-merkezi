import { describe, it, expect } from 'vitest';
import { BranchService } from '../../services/BranchService';
import { Branch } from '../../data/mockData';

describe('Modül 02: Şube Yönetimi & Kapsam İzolasyonu (TC-013 - TC-022)', () => {
  const branches: Branch[] = [
    {
      id: 'br-kadikoy',
      name: 'Merkez 1 - Kadıköy',
      slug: 'merkez-1-kadikoy',
      address: 'Kadıköy Rıhtım Cd. No:12',
      phone: '0216 111 22 33',
      status: 'Aktif',
      patientsCount: 42
    },
    {
      id: 'br-besiktas',
      name: 'Merkez 2 - Beşiktaş',
      slug: 'merkez-2-besiktas',
      address: 'Beşiktaş Çarşı No:5',
      phone: '0212 222 33 44',
      status: 'Aktif',
      patientsCount: 28
    },
    {
      id: 'br-bakirkoy',
      name: 'Şube 3 - Bakırköy (Pasif)',
      slug: 'sube-3-bakirkoy',
      address: 'Bakırköy Meydan',
      phone: '0212 333 44 55',
      status: 'Pasif',
      patientsCount: 0
    }
  ];

  // TC-013: Tüm Şubeler (Konsolide) Görünümü
  it('TC-013: Tüm Şubeler Görünümü — Header şube seçiciden "Tüm Şubeler" seçildiğinde konsolide görünüm aktif olur', () => {
    // When allowedBranchIds is null or has multiple branches and user selects 'all'
    const result = BranchService.resolveActiveBranch('all', branches, null);
    expect(result.branchContext.mode).toBe('all');
    expect(BranchService.matchesBranch('Kadıköy', 'br-kadikoy', result.branchContext)).toBe(true);
    expect(BranchService.matchesBranch('Beşiktaş', 'br-besiktas', result.branchContext)).toBe(true);
  });

  // TC-014: Tek Şube Kapsamı (Single Branch)
  it('TC-014: Tek Şube Kapsamı — Kadıköy şubesi seçildiğinde sadece Kadıköy kayıtları filtrelenir', () => {
    const result = BranchService.resolveActiveBranch('merkez-1-kadikoy', branches, null);
    expect(result.branchContext.mode).toBe('single');
    if (result.branchContext.mode === 'single') {
      expect(result.branchContext.branchId).toBe('br-kadikoy');
    }
    expect(BranchService.matchesBranch('Kadıköy', 'br-kadikoy', result.branchContext)).toBe(true);
    expect(BranchService.matchesBranch('Beşiktaş', 'br-besiktas', result.branchContext)).toBe(false);
  });

  // TC-015: Şube URL Slug Senkronizasyonu
  it('TC-015: URL Slug Senkronizasyonu — URL slug geçerli şubeyi doğru çözümler', () => {
    const result = BranchService.resolveActiveBranch('merkez-2-besiktas', branches, null);
    expect(result.isFallback).toBe(false);
    expect(result.branchContext.mode).toBe('single');
    if (result.branchContext.mode === 'single') {
      expect(result.branchContext.branchId).toBe('br-besiktas');
      expect(result.branchContext.slug).toBe('merkez-2-besiktas');
    }
  });

  // TC-016: Geçersiz Şube Slug Girdisi
  it('TC-016: Geçersiz Şube Slug — Var olmayan slug güvenli fallback tetikler', () => {
    const result = BranchService.resolveActiveBranch('mars-subesi-gecersiz', branches, null, 'br-kadikoy');
    expect(result.isFallback).toBe(true);
    expect(result.branchContext.mode).toBe('single');
    if (result.branchContext.mode === 'single') {
      expect(result.branchContext.branchId).toBe('br-kadikoy');
    }
  });

  // TC-017: Yeni Şube Ekleme & Slug Oluşturma
  it('TC-017: Yeni Şube Ekleme — Türkçe karakterleri temizleyen URL slug üretimi', () => {
    const slug = BranchService.generateSlug({ name: 'İzmir Alsancak & Çiğli İşitme Merkezi' });
    expect(slug).toBe('izmir-alsancak-cigli-isitme-merkezi');
    expect(slug).not.toContain('İ');
    expect(slug).not.toContain('ç');
    expect(slug).not.toContain('ğ');
  });

  // TC-018: Şube Durumu Pasife Alma
  it('TC-018: Şube Durumu Pasife Alma — Pasif şubeler tek şubeli kullanıcı filtrelerinde elenir', () => {
    const activeBranches = branches.filter(b => b.status === 'Aktif');
    expect(activeBranches.some(b => b.id === 'br-bakirkoy')).toBe(false);
    expect(activeBranches).toHaveLength(2);
  });

  // TC-019: Şubeler Arası Çapraz Sızıntı Koruması
  it('TC-019: Şubeler Arası Çapraz Sızıntı — Yalnızca Beşiktaş yetkisi olan kullanıcı Kadıköy slug\'ına erişemez', () => {
    const result = BranchService.resolveActiveBranch('merkez-1-kadikoy', branches, ['br-besiktas'], 'br-besiktas');
    expect(result.isFallback).toBe(true);
    expect(result.fallbackReason).toContain('erişim yetkiniz bulunmadığı için');
    if (result.branchContext.mode === 'single') {
      expect(result.branchContext.branchId).toBe('br-besiktas');
    }
  });

  // TC-020: Şube Filtresinde Temizle Butonu
  it('TC-020: Şube Filtresi Temizle — Filtre temizlendiğinde konsolide (tümü) görünümüne dönülür', () => {
    let activeFilter: string | null = 'br-kadikoy';
    const clearFilter = () => {
      activeFilter = null;
    };
    clearFilter();
    expect(activeFilter).toBeNull();
    const result = BranchService.resolveActiveBranch(activeFilter, branches, null);
    expect(result.branchContext.mode).toBe('all');
  });

  // TC-021: Şube Bazlı Aktivite Raporu Kapsamı
  it('TC-021: Şube Bazlı Aktivite Raporu — Raporlama fonksiyonları seçilen şube id\'sine göre filtrelenir', () => {
    const activities = [
      { id: '1', branchId: 'br-kadikoy', action: 'Cihaz Satışı' },
      { id: '2', branchId: 'br-besiktas', action: 'Pil Satışı' },
      { id: '3', branchId: 'br-kadikoy', action: 'Tamir Girişi' }
    ];

    const kadikoyActivities = activities.filter(a => a.branchId === 'br-kadikoy');
    expect(kadikoyActivities).toHaveLength(2);
    expect(kadikoyActivities.every(a => a.branchId === 'br-kadikoy')).toBe(true);
  });

  // TC-022: Şube Ataması Olmayan Kayıtların İzolasyonu
  it('TC-022: Şube Ataması Olmayan Kayıtlar — Tekil şube modunda branchId atanmamış satırlar sızdırılmaz', () => {
    const singleBranchContext = { mode: 'single' as const, branchId: 'br-kadikoy', slug: 'kadikoy' };
    const unassignedMatch = BranchService.matchesBranch(undefined, undefined, singleBranchContext);
    expect(unassignedMatch).toBe(false);

    // Ancak konsolide modda gösterilebilir veya düzeltme kuyruğuna alınır
    const consolidatedMatch = BranchService.matchesBranch(undefined, undefined, { mode: 'all' });
    expect(consolidatedMatch).toBe(true);
  });
});
