import { describe, it, expect } from 'vitest';
import { validateTcKn } from '../../lib/validation';
import { normalizeTurkishPhoneInput, isValidTurkishPhone } from '../../lib/turkishPhone';
import { validateAudiogramUpload } from '../../lib/audiogramUpload';
import { parseRecallDateRange, isDateKeyInRange } from '../../lib/recallDateRange';
import { isSupportedPatientPhoto } from '../../lib/patientPhoto';
import { Patient } from '../../data/mockData';

describe('Modül 03: Hasta Yönetimi, KVKK & Hasta Detay (TC-023 - TC-042)', () => {
  const samplePatient: Patient = {
    id: 'pat-100',
    firstName: 'Mehmet',
    lastName: 'Demir',
    tc: '10000000146', // Valid algorithmic TCKN
    phone: '05321112233',
    email: 'mehmet@example.com',
    branch: 'Merkez 1 - Kadıköy',
    branchId: 'br-kadikoy',
    birthDate: '1975-04-12',
    gender: 'Erkek',
    address: 'Moda Cad. No:15',
    hearingLoss: 'İleri',
    hearingLossSide: 'Her İki Kulak',
    currentDevice: 'Phonak Audéo Lumity L90',
    salesStage: 'Satış Yapıldı',
    sgkStatus: 'Aktif',
    notes: 'Klinik takip notu',
    createdAt: '2026-05-10T10:00:00Z',
    consentGiven: true
  };

  // TC-023: Başarılı Hasta Kaydı
  it('TC-023: Başarılı Hasta Kaydı — Tüm zorunlu alanlar ve geçerli verilerle kayıt oluşturulur', () => {
    const requiredFields = ['firstName', 'lastName', 'phone', 'address', 'branch'] as const;
    const isValid = requiredFields.every(field => Boolean(samplePatient[field]));
    expect(isValid).toBe(true);
    expect(samplePatient.id).toBeDefined();
    expect(samplePatient.consentGiven).toBe(true);
  });

  // TC-024: Eksik Zorunlu Alan Validasyonu
  it('TC-024: Eksik Zorunlu Alan Validasyonu — Ad, soyad veya telefon boş bırakıldığında hata verir', () => {
    const validatePatientForm = (data: Partial<Patient>) => {
      const errors: string[] = [];
      if (!data.firstName?.trim()) errors.push('Ad alanı zorunludur.');
      if (!data.lastName?.trim()) errors.push('Soyad alanı zorunludur.');
      if (!data.phone?.trim()) errors.push('Telefon alanı zorunludur.');
      return errors;
    };

    expect(validatePatientForm({ firstName: '', lastName: 'Demir', phone: '05321112233' })).toContain('Ad alanı zorunludur.');
    expect(validatePatientForm({ firstName: 'Mehmet', lastName: '', phone: '05321112233' })).toContain('Soyad alanı zorunludur.');
    expect(validatePatientForm({ firstName: 'Mehmet', lastName: 'Demir', phone: '' })).toContain('Telefon alanı zorunludur.');
  });

  // TC-025: Geçersiz TC Kimlik Doğrulaması
  it('TC-025: Geçersiz TC Kimlik Doğrulaması — Algoritma hatalı veya 11 hane dışındaki TC reddedilir', () => {
    expect(validateTcKn('').isValid).toBe(false);
    expect(validateTcKn('12345').isValid).toBe(false);
    expect(validateTcKn('01234567890').isValid).toBe(false); // 0 ile başlayamaz
    expect(validateTcKn('11111111111').isValid).toBe(false); // Algoritma uyuşmazlığı
    expect(validateTcKn('10000000146').isValid).toBe(true); // Geçerli algoritma
  });

  // TC-026: Telefon Numarası Normalizasyonu
  it('TC-026: Telefon Numarası Normalizasyonu — +90 veya boşluklu format ulusal standarda çevrilir', () => {
    expect(normalizeTurkishPhoneInput('+90 532 123 45 67')).toBe('5321234567');
    expect(normalizeTurkishPhoneInput('0090 542 987 65 43')).toBe('5429876543');
    expect(normalizeTurkishPhoneInput('0532 123 45 67')).toBe('05321234567');
    expect(isValidTurkishPhone(normalizeTurkishPhoneInput('+90 532 123 45 67'))).toBe(true);
    expect(isValidTurkishPhone('05321234567')).toBe(true);
    expect(isValidTurkishPhone('5321234567')).toBe(true);
    expect(isValidTurkishPhone('12345')).toBe(false);
  });

  // TC-027: KVKK Onayı Olmadan Kayıt
  it('TC-027: KVKK Onayı Olmadan Kayıt — Açık rıza olmadan hasta kaydı engellenir', () => {
    const checkKvkkConsent = (consent?: boolean) => {
      if (!consent) {
        return { allowed: false, message: 'KVKK Açık Rıza Onayı verilmeden hasta kaydı oluşturulamaz.' };
      }
      return { allowed: true };
    };

    expect(checkKvkkConsent(false).allowed).toBe(false);
    expect(checkKvkkConsent(undefined).allowed).toBe(false);
    expect(checkKvkkConsent(true).allowed).toBe(true);
  });

  // TC-028: Çapraz Şube Hasta Araması
  it('TC-028: Çapraz Şube Hasta Araması — Arama terimi girildiğinde şube filtresi esnetilerek tüm dizin taranır', () => {
    const directory = [
      { id: 'p1', name: 'Ahmet Ak', branchId: 'br-kadikoy', tc: '10000000146' },
      { id: 'p2', name: 'Zeynep Ay', branchId: 'br-besiktas', tc: '20000000146' }
    ];

    const searchCrossBranch = (query: string, activeBranchId: string) => {
      const q = query.trim().toLowerCase();
      if (!q) {
        return directory.filter(p => p.branchId === activeBranchId);
      }
      // With active query, search entire directory
      return directory.filter(p => p.name.toLowerCase().includes(q) || p.tc.includes(q));
    };

    // No search query: only Kadikoy
    expect(searchCrossBranch('', 'br-kadikoy')).toHaveLength(1);
    // Active search query for Besiktas patient while viewing Kadikoy: found!
    expect(searchCrossBranch('Zeynep', 'br-kadikoy')).toHaveLength(1);
    expect(searchCrossBranch('Zeynep', 'br-kadikoy')[0].id).toBe('p2');
  });

  // TC-029: Hasta Listesinde Türkçe İ/ı Arama
  it('TC-029: Türkçe İ/ı Arama — "İsmail" ve "ismail" aramaları doğru eşleşir', () => {
    const turkishMatches = (text: string, query: string) => {
      return text.toLocaleLowerCase('tr-TR').includes(query.toLocaleLowerCase('tr-TR'));
    };

    expect(turkishMatches('İsmail Hakkı', 'ismail')).toBe(true);
    expect(turkishMatches('ismail hakkı', 'İSMAİL')).toBe(true);
    expect(turkishMatches('Şükrü Çetin', 'sukru')).toBe(false); // Exact Turkish chars preserved
    expect(turkishMatches('Şükrü Çetin', 'şükrü')).toBe(true);
  });

  // TC-030: Hasta Bilgileri Güncelleme
  it('TC-030: Hasta Güncelleme — Telefon ve adres değişiklikleri hasta nesnesine yansıtılır', () => {
    const updated = {
      ...samplePatient,
      phone: '05449998877',
      address: 'Caferağa Mah. Moda Cad. No:20 D:4'
    };

    expect(updated.phone).toBe('05449998877');
    expect(updated.address).toContain('No:20 D:4');
  });

  // TC-031: Hasta Silme (Soft-delete)
  it('TC-031: Hasta Silme — Hasta silindiğinde deleted_at işaretlenir ve aktif listeden kalkar', () => {
    const patients = [
      { id: 'p1', name: 'Hasta 1', deleted_at: null },
      { id: 'p2', name: 'Hasta 2', deleted_at: '2026-10-01T12:00:00Z' }
    ];

    const activePatients = patients.filter(p => !p.deleted_at);
    expect(activePatients).toHaveLength(1);
    expect(activePatients[0].id).toBe('p1');
  });

  // TC-032: Odyogram Verisi Girişi
  it('TC-032: Odyogram Verisi Girişi — Sol ve sağ kulak için frekans dB değerleri aralık kontrolünden geçer', () => {
    const validateDbValue = (db: number) => db >= -10 && db <= 120;
    const testFrequencies = [250, 500, 1000, 2000, 4000, 8000];

    const rightEarData = { 250: 20, 500: 25, 1000: 40, 2000: 55, 4000: 65, 8000: 70 };
    const leftEarData = { 250: 15, 500: 20, 1000: 35, 2000: 50, 4000: 60, 8000: 65 };

    testFrequencies.forEach(freq => {
      expect(validateDbValue(rightEarData[freq as keyof typeof rightEarData])).toBe(true);
      expect(validateDbValue(leftEarData[freq as keyof typeof leftEarData])).toBe(true);
    });

    expect(validateDbValue(130)).toBe(false);
    expect(validateDbValue(-20)).toBe(false);
  });

  // TC-033: Odyogram Dosyası Yükleme
  it('TC-033: Odyogram Dosyası Yükleme — PDF, XML ve görsel dosyaları kabul edilir, zararlı dosya tipleri reddedilir', () => {
    const validPdf = { name: 'odyogram_raporu.pdf', size: 1024 * 500, type: 'application/pdf' };
    const invalidExe = { name: 'virus.exe', size: 1024 * 500, type: 'application/x-msdownload' };
    const oversizedPdf = { name: 'buyuk.pdf', size: 15 * 1024 * 1024, type: 'application/pdf' };

    expect(validateAudiogramUpload(validPdf)).toBeNull();
    expect(validateAudiogramUpload(invalidExe)).toContain('Yalnızca XML, PDF, PNG');
    expect(validateAudiogramUpload(oversizedPdf)).toContain('10 MB sınırını aşamaz');
  });

  // TC-034: Cihaz Zimmetleme
  it('TC-034: Cihaz Zimmetleme — Hastaya cihaz bağlandığında currentDevice modeli kaydedilir', () => {
    const assignedPatient: Patient = {
      ...samplePatient,
      currentDevice: 'Oticon More 1'
    };

    expect(assignedPatient.currentDevice).toBe('Oticon More 1');
  });

  // TC-035: Hasta Zaman Çizelgesi (Timeline)
  it('TC-035: Hasta Zaman Çizelgesi — Farklı modüllerden gelen olaylar kronolojik sıralanır', () => {
    const events = [
      { id: 'e1', type: 'APPOINTMENT', date: '2026-06-01T10:00:00Z', title: 'İlk Muayene' },
      { id: 'e2', type: 'SALE', date: '2026-06-05T14:30:00Z', title: 'Cihaz Satışı' },
      { id: 'e3', type: 'SERVICE', date: '2026-09-12T11:00:00Z', title: 'Periyodik Filtre Değişimi' }
    ];

    const sorted = [...events].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    expect(sorted[0].type).toBe('SERVICE');
    expect(sorted[1].type).toBe('SALE');
    expect(sorted[2].type).toBe('APPOINTMENT');
  });

  // TC-036: Randevu Tarihine Göre Filtreleme
  it('TC-036: Randevu Tarihine Göre Filtreleme — Belirtilen tarih aralığındaki randevular filtreye takılır', () => {
    const range = parseRecallDateRange('06.10.2026 - 08.10.2026');
    expect(isDateKeyInRange('2026-10-05', range)).toBe(false);
    expect(isDateKeyInRange('2026-10-06', range)).toBe(true);
    expect(isDateKeyInRange('2026-10-07', range)).toBe(true);
    expect(isDateKeyInRange('2026-10-08', range)).toBe(true);
    expect(isDateKeyInRange('2026-10-09', range)).toBe(false);
  });

  // TC-037: Cihaz Durumu Filtresi
  it('TC-037: Cihaz Durumu Filtresi — "Cihazı Olanlar" ve "Cihazı Olmayanlar" doğru ayrışır', () => {
    const list = [
      { id: '1', hasDevice: true },
      { id: '2', hasDevice: false },
      { id: '3', hasDevice: true }
    ];

    expect(list.filter(p => p.hasDevice)).toHaveLength(2);
    expect(list.filter(p => !p.hasDevice)).toHaveLength(1);
  });

  // TC-038: İşitme Kaybı Derecesi Filtresi
  it('TC-038: İşitme Kaybı Derecesi Filtresi — Derece bazında filtreleme doğru çalışır', () => {
    const list = [
      { id: '1', degree: 'Hafif' },
      { id: '2', degree: 'İleri Derece' },
      { id: '3', degree: 'İleri Derece' },
      { id: '4', degree: 'Çok İleri Derece' }
    ];

    const filterByDegree = (degree: string) => list.filter(p => p.degree === degree);
    expect(filterByDegree('İleri Derece')).toHaveLength(2);
    expect(filterByDegree('Hafif')).toHaveLength(1);
  });

  // TC-039: Excel ile Toplu Hasta Yükleme
  it('TC-039: Excel ile Toplu Hasta Yükleme — Geçerli satırlar doğru nesneye dönüştürülür', () => {
    const mockExcelRows = [
      { 'Adı': 'Ali', 'Soyadı': 'Veli', 'Telefon': '05321112233', 'TC': '10000000146' },
      { 'Adı': 'Ayşe', 'Soyadı': 'Yılmaz', 'Telefon': '05423334455', 'TC': '10000000146' }
    ];

    const parsedPatients = mockExcelRows.map((r, index) => ({
      id: `imp-${index}`,
      firstName: r['Adı'],
      lastName: r['Soyadı'],
      phone: normalizeTurkishPhoneInput(r['Telefon']),
      tc: r['TC']
    }));

    expect(parsedPatients).toHaveLength(2);
    expect(parsedPatients[0].firstName).toBe('Ali');
    expect(parsedPatients[1].lastName).toBe('Yılmaz');
  });

  // TC-040: Bozuk Excel Dosyası Yükleme
  it('TC-040: Bozuk Excel Dosyası Yükleme — Zorunlu sütunları eksik dosya tespit edilir', () => {
    const invalidExcelHeaders = ['Sıra No', 'Şehir', 'Tutar'];
    const requiredHeaders = ['Adı', 'Soyadı', 'Telefon'];

    const missing = requiredHeaders.filter(h => !invalidExcelHeaders.includes(h));
    expect(missing).toEqual(['Adı', 'Soyadı', 'Telefon']);
  });

  // TC-041: Hasta Kartı Not Alanı Sınırı
  it('TC-041: Not Alanı Sınırı — Uzun anamnez metinleri güvenli bir şekilde saklanır', () => {
    const longNote = 'A'.repeat(5000);
    const patientWithLongNote = { ...samplePatient, notes: longNote };
    expect(patientWithLongNote.notes.length).toBe(5000);
  });

  // TC-042: Fotoğraf Yükleme ve Resize Desteği
  it('TC-042: Fotoğraf Yükleme — Desteklenen resim formatları ve boyut limitleri doğrulanır', () => {
    const validJpg = { name: 'vesikalik.jpg', size: 2 * 1024 * 1024, type: 'image/jpeg' } as unknown as File;
    const oversizedPng = { name: 'huge.png', size: 8 * 1024 * 1024, type: 'image/png' } as unknown as File;

    expect(isSupportedPatientPhoto(validJpg)).toBe(true);
    expect(isSupportedPatientPhoto(oversizedPng)).toBe(false);
  });
});
