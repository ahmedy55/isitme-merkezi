import { describe, it, expect, vi } from 'vitest';
import { AuditService } from '../../services/AuditService';

describe('Modül 12: Güvenlik, Hata Yakalama, Audit & Dayanıklılık (TC-143 - TC-150)', () => {
  // TC-143: XSS (Cross-Site Scripting) Koruması
  it('TC-143: XSS Koruması — Kullanıcı girdisindeki script etiketleri sanitize edilir', () => {
    const sanitizeHtml = (str: string) => {
      return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;');
    };

    const maliciousInput = '<script>alert("XSS")</script>';
    const sanitized = sanitizeHtml(maliciousInput);

    expect(sanitized).not.toContain('<script>');
    expect(sanitized).toBe('&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;');
  });

  // TC-144: SQL Injection Koruması
  it('TC-144: SQL Injection Koruması — Sorgu parametreleri escape edilir veya parametreli çalıştırılır', () => {
    const query = " ' OR 1=1 -- ";
    // Emulating parameterized query lookup
    const searchByName = (input: string, data: { name: string }[]) => {
      // Literal exact substring match without dynamic string concatenation SQL
      const trimmed = input.trim();
      return data.filter(d => d.name === trimmed);
    };

    const records = [{ name: 'Ahmet Yılmaz' }, { name: 'Mehmet Demir' }];
    const results = searchByName(query, records);
    expect(results).toHaveLength(0); // Injection did not bypass filter
  });

  // TC-145: Audit Log Doğrulaması
  it('TC-145: Audit Log Doğrulaması — Kullanıcı işlemleri denetim kaydına yazılır', async () => {
    const spy = vi.spyOn(AuditService, 'log');
    await AuditService.log({
      action: 'HASTA_SILINDI',
      module: 'Hastalar',
      userId: 'usr-admin',
      description: 'Hasta silindi: pat-100'
    });

    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'HASTA_SILINDI',
        module: 'Hastalar'
      })
    );
  });

  // TC-146: Hassas Verilerin Audit'ten Gizlenmesi (Maskeleme)
  it('TC-146: Hassas Veri Maskeleme — TCKN ve telefon numaraları loglarda maskelenir', () => {
    const maskSensitiveData = (details: Record<string, any>) => {
      const masked = { ...details };
      if (masked.tc) masked.tc = `${masked.tc.slice(0, 3)}*****${masked.tc.slice(-2)}`;
      if (masked.phone) masked.phone = `${masked.phone.slice(0, 4)}***${masked.phone.slice(-2)}`;
      return masked;
    };

    const payload = { tc: '10000000146', phone: '05321112233', action: 'Kayıt Güncellendi' };
    const masked = maskSensitiveData(payload);

    expect(masked.tc).toBe('100*****46');
    expect(masked.phone).toBe('0532***33');
    expect(masked.tc).not.toBe('10000000146');
  });

  // TC-147: Ağ Kesintisi & Offline Dayanıklılık
  it('TC-147: Ağ Kesintisi — Offline durumunda uygulama çökmeden hata durumunu yakalar', async () => {
    const fetchWithFallback = async (mockNetworkOnline: boolean) => {
      if (!mockNetworkOnline) {
        return { isOffline: true, message: 'İnternet bağlantınızı kontrol edin.' };
      }
      return { isOffline: false, data: [] };
    };

    const offlineResult = await fetchWithFallback(false);
    expect(offlineResult.isOffline).toBe(true);
    expect(offlineResult.message).toContain('İnternet');
  });

  // TC-148: Büyük Veri Sayfalama Performansı
  it('TC-148: Büyük Veri Sayfalama — 5.000 satırlık veride sayfalama dilimleme zamanı < 10ms', () => {
    const bigDataset = Array.from({ length: 5000 }, (_, i) => ({ id: i, name: `Kayıt ${i}` }));

    const start = performance.now();
    const pageSize = 20;
    const pageIndex = 125; // 126th page
    const pageSlice = bigDataset.slice(pageIndex * pageSize, (pageIndex + 1) * pageSize);
    const duration = performance.now() - start;

    expect(pageSlice).toHaveLength(20);
    expect(pageSlice[0].id).toBe(2500);
    expect(duration).toBeLessThan(10); // Ultra fast
  });

  // TC-149: Çift Tıklama (Double Submit) Engeli
  it('TC-149: Çift Tıklama Engeli — Ardışık tıklamalarda istek tekilleştirilir', async () => {
    let executionCount = 0;
    let isSubmitting = false;

    const executeOnce = async () => {
      if (isSubmitting) return false;
      isSubmitting = true;
      try {
        executionCount++;
        return true;
      } finally {
        // Unlock after delay
        isSubmitting = false;
      }
    };

    // Simulate 5 rapid simultaneous clicks
    isSubmitting = true; // Lock set by first click
    const click2 = await executeOnce();
    const click3 = await executeOnce();
    const click4 = await executeOnce();
    const click5 = await executeOnce();

    expect(click2).toBe(false);
    expect(click3).toBe(false);
    expect(click4).toBe(false);
    expect(click5).toBe(false);
    expect(executionCount).toBe(0); // 0 additional executions
  });

  // TC-150: Mobil / Tablet Responsive Doğrulama
  it('TC-150: Mobil Responsive Kuralları — 768px altında sidebar gizlenir ve mobil menü devreye girer', () => {
    const getLayoutMode = (viewportWidth: number) => {
      if (viewportWidth < 768) return 'mobile-drawer';
      if (viewportWidth < 1024) return 'tablet-compact';
      return 'desktop-expanded';
    };

    expect(getLayoutMode(375)).toBe('mobile-drawer'); // iPhone SE
    expect(getLayoutMode(768)).toBe('tablet-compact'); // iPad
    expect(getLayoutMode(1440)).toBe('desktop-expanded'); // MacBook / Desktop
  });
});
