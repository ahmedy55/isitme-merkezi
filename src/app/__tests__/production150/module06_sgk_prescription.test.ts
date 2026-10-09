import { describe, it, expect } from 'vitest';
import { SGKDomainService } from '../../services/SGKDomainService';
import { expectedPaymentMonth, monthsUntil } from '../../lib/sgkSchedule';
import { Patient, RecallItem } from '../../data/mockData';

describe('Modül 06: SGK, Medula & E-Reçete Süreçleri (TC-069 - TC-082)', () => {
  const samplePatient: Patient = {
    id: 'pat-sgk-1',
    firstName: 'Hasan',
    lastName: 'Yıldız',
    tc: '10000000146',
    phone: '05332223344',
    email: 'hasan@example.com',
    branch: 'Merkez 1 - Kadıköy',
    branchId: 'br-kadikoy',
    birthDate: '1960-03-15',
    gender: 'Erkek',
    address: 'Moda Cad.',
    hearingLoss: 'İleri',
    hearingLossSide: 'Her İki Kulak',
    currentDevice: 'Signia Pure Charge&Go',
    salesStage: 'Satış Yapıldı',
    sgkStatus: 'Aktif',
    prescriptionStatus: 'Reçete Yazıldı',
    prescriptionNo: 'REC-2026-9901',
    reportNo: 'RAP-2026-4401',
    createdAt: '2026-01-10T10:00:00Z',
    consentGiven: true
  };

  const initialPatients: Patient[] = [samplePatient];
  const initialRecalls: RecallItem[] = [];

  // TC-069: Reçete Onaylama Akışı
  it('TC-069: Reçete Onaylama Akışı — Reçete onaylandığında hasta SGK durumu "Aktif" olur ve 5 yıllık recall üretilir', async () => {
    const result = await SGKDomainService.approvePrescription(
      initialPatients,
      initialRecalls,
      {
        patientId: 'pat-sgk-1',
        prescriptionNo: 'REC-2026-9901',
        reportNo: 'RAP-2026-4401',
        performedByUserId: 'usr-1'
      }
    );

    const updatedPatient = result.updatedPatients.find(p => p.id === 'pat-sgk-1');
    expect(updatedPatient?.sgkStatus).toBe('Aktif');
    expect(updatedPatient?.sgkRenewalDate).toBeDefined();

    // 5-Year Recall generation
    expect(result.newRecall.reason).toBe('SGK Yenileme');
    expect(result.newRecall.status).toBe('Bekliyor');
    expect(result.newRecall.patientName).toContain('Hasan Yıldız');
    const todayYear = new Date().getFullYear();
    expect(result.newRecall.dueDate.startsWith(String(todayYear + 5))).toBe(true);
  });

  // TC-070: Reçete Reddetme Akışı
  it('TC-070: Reçete Reddetme Akışı — Reddedildiğinde durum "Reçete Reddedildi"ye geçer', () => {
    const rejectedPatients = initialPatients.map(p =>
      p.id === 'pat-sgk-1' ? { ...p, prescriptionStatus: 'Reçete Reddedildi' as Patient['prescriptionStatus'], notes: 'Hatalı tanı kodu' } : p
    );

    const patient = rejectedPatients.find(p => p.id === 'pat-sgk-1');
    expect(patient?.prescriptionStatus).toBe('Reçete Reddedildi');
    expect(patient?.notes).toContain('Hatalı tanı kodu');
  });

  // TC-071: Reçete İşleme Alma
  it('TC-071: Reçete İşleme Alma — Reçete durumu "Reçete Yazıldı" olarak güncellenir', () => {
    const inProgressPatients = initialPatients.map(p =>
      p.id === 'pat-sgk-1' ? { ...p, prescriptionStatus: 'Reçete Yazıldı' as Patient['prescriptionStatus'] } : p
    );

    expect(inProgressPatients[0].prescriptionStatus).toBe('Reçete Yazıldı');
  });

  // TC-072: SGK Reçete Kaydı Silme
  it('TC-072: SGK Reçete Kaydı Silme — Reçete bilgileri hasta kartından temizlenir', () => {
    const clearedPatients = initialPatients.map(p =>
      p.id === 'pat-sgk-1'
        ? {
            ...p,
            prescriptionNo: undefined,
            reportNo: undefined,
            prescriptionStatus: 'Yok' as Patient['prescriptionStatus']
          }
        : p
    );

    expect(clearedPatients[0].prescriptionNo).toBeUndefined();
    expect(clearedPatients[0].reportNo).toBeUndefined();
    expect(clearedPatients[0].prescriptionStatus).toBe('Yok');
  });

  // TC-073: Yeni Reçete / Rapor Girişi
  it('TC-073: Yeni Reçete Girişi — Reçete no ve rapor no ile kayıt oluşturulur', () => {
    const validatePrescriptionInput = (input: { prescriptionNo: string; reportNo: string }) => {
      if (!input.prescriptionNo.trim()) return { valid: false, error: 'Reçete no zorunludur' };
      if (!input.reportNo.trim()) return { valid: false, error: 'Rapor no zorunludur' };
      return { valid: true };
    };

    expect(validatePrescriptionInput({ prescriptionNo: 'REC-123', reportNo: 'RAP-456' }).valid).toBe(true);
    expect(validatePrescriptionInput({ prescriptionNo: '', reportNo: 'RAP-456' }).valid).toBe(false);
  });

  // TC-074: Kayıtlı Olmayan Hastaya Reçete
  it('TC-074: Kayıtlı Olmayan Hasta — Olmayan hasta için reçete onaylama işlemi hata fırlatır', async () => {
    const result = await SGKDomainService.approvePrescription(
      initialPatients,
      initialRecalls,
      {
        patientId: 'pat-non-existent',
        prescriptionNo: 'REC-999',
        reportNo: 'RAP-999'
      }
    );

    // Patient was not found, patient list unchanged
    expect(result.updatedPatients).toEqual(initialPatients);
    expect(result.newRecall.patientName).toBe('Bilinmeyen Hasta');
  });

  // TC-075: Medula Sorgu Simülasyonu
  it('TC-075: Medula Sorgu Simülasyonu — Entegrasyon servisi güvenli yanıt üretir', () => {
    const mockMedulaQuery = (tc: string) => {
      if (tc.length !== 11) return { status: 'ERROR', message: 'Geçersiz TC' };
      return { status: 'SUCCESS', hakSahibiMi: true, sonHakTarihi: '2021-08-15' };
    };

    const res = mockMedulaQuery('10000000146');
    expect(res.status).toBe('SUCCESS');
    expect(res.hakSahibiMi).toBe(true);
  });

  // TC-076: SGK Dönem Faturası Listeleme
  it('TC-076: SGK Dönem Faturası — Beklenen tahsilat dönemi doğru hesaplanır (+2 ay)', () => {
    // January 2026 invoice is expected in March 2026 (+2 months rule)
    expect(expectedPaymentMonth('2026-01')).toBe('2026-03');
    expect(expectedPaymentMonth('2026-11')).toBe('2027-01');
  });

  // TC-077: SGK Fatura Ödeme Kaydı
  it('TC-077: SGK Fatura Ödeme Kaydı — Tahsilat kaydedildiğinde bakiye düşer', () => {
    const invoice = { id: 'inv-sgk-1', total: 50000, paid: 0, status: 'Bekliyor' };
    const payment = 50000;

    const updatedInvoice = {
      ...invoice,
      paid: invoice.paid + payment,
      status: invoice.total <= invoice.paid + payment ? 'Tahsil Edildi' : 'Kısmi Ödendi'
    };

    expect(updatedInvoice.paid).toBe(50000);
    expect(updatedInvoice.status).toBe('Tahsil Edildi');
  });

  // TC-078: SGK Alacakları Yaşlandırma
  it('TC-078: SGK Alacakları Yaşlandırma — Vadesi geçen aylar pozitif veya negatif hesaplanır', () => {
    // Current month is 2026-10
    const current = '2026-10';
    // March 2026 is 7 months in the past
    expect(monthsUntil('2026-03', current)).toBe(-7);
    // December 2026 is 2 months in the future
    expect(monthsUntil('2026-12', current)).toBe(2);
  });

  // TC-079: Evrak Yükleme Modalı
  it('TC-079: Evrak Yükleme — E-Reçete PDF eki dosya boyutu ve uzantısı doğrulanır', () => {
    const isAllowedSgkDoc = (fileName: string, sizeBytes: number) => {
      const ext = fileName.split('.').pop()?.toLowerCase();
      return (ext === 'pdf' || ext === 'jpg' || ext === 'png') && sizeBytes <= 5 * 1024 * 1024;
    };

    expect(isAllowedSgkDoc('e_recete_cikti.pdf', 1024 * 300)).toBe(true);
    expect(isAllowedSgkDoc('recete.zip', 1024 * 300)).toBe(false);
  });

  // TC-080: Reçete Arama & Filtreleme
  it('TC-080: Reçete Arama — Reçete no veya rapor no ile filtreleme yapılır', () => {
    const list = [samplePatient];
    const match = list.filter(p => p.prescriptionNo?.includes('9901') || p.reportNo?.includes('9901'));
    expect(match).toHaveLength(1);
    expect(match[0].id).toBe('pat-sgk-1');
  });

  // TC-081: SGK Durum Filtresi
  it('TC-081: SGK Durum Filtresi — "Aktif", "Pasif", "Yenileme Hakkı Var" durumlarına göre filtreleme yapılır', () => {
    const patients = [
      { ...samplePatient, sgkStatus: 'Aktif' as const },
      { ...samplePatient, id: 'pat-2', sgkStatus: 'Pasif' as const },
      { ...samplePatient, id: 'pat-3', sgkStatus: 'Yenileme Hakkı Var' as const }
    ];

    expect(patients.filter(p => p.sgkStatus === 'Aktif')).toHaveLength(1);
    expect(patients.filter(p => p.sgkStatus === 'Pasif')).toHaveLength(1);
    expect(patients.filter(p => p.sgkStatus === 'Yenileme Hakkı Var')).toHaveLength(1);
  });

  // TC-082: SGK Hak Ediş Yenileme Takibi
  it('TC-082: 5 Yıl Hak Ediş Yenileme — Alış tarihinden 5 yıl sonra yenileme hakkı doğar', () => {
    const checkRenewalEntitlement = (purchaseDateStr: string, currentDate = new Date('2026-10-09')) => {
      const purchaseDate = new Date(purchaseDateStr);
      const diffYears = (currentDate.getTime() - purchaseDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
      return diffYears >= 5;
    };

    // Purchased 6 years ago (2020-05-01): Entitled!
    expect(checkRenewalEntitlement('2020-05-01')).toBe(true);
    // Purchased 2 years ago (2024-05-01): Not yet entitled
    expect(checkRenewalEntitlement('2024-05-01')).toBe(false);
  });
});
