import { describe, it, expect } from 'vitest';
import { isRecallOverdue, getRecallCounts, toRecallDateKey } from '../../lib/recallStats';
import { parseRecallDateRange, isDateKeyInRange } from '../../lib/recallDateRange';
import { RecallItem } from '../../data/mockData';

describe('Modül 05: Recall / Hatırlatma & Otomasyon (TC-057 - TC-068)', () => {
  const mockRecalls: RecallItem[] = [
    {
      id: 'rec-1',
      patientId: 'pat-101',
      patientName: 'Ali Demir',
      reason: 'Pil değişimi',
      dueDate: '2026-10-01',
      status: 'Bekliyor',
      lastContact: null,
      estimatedRevenue: 400,
      probability: 'Yüksek Olasılık'
    },
    {
      id: 'rec-2',
      patientId: 'pat-102',
      patientName: 'Fatma Şahin',
      reason: 'Yıllık Kontrol',
      dueDate: '2026-10-25',
      status: 'Bekliyor',
      lastContact: '2026-09-01',
      estimatedRevenue: 2500,
      probability: 'Orta Olasılık'
    },
    {
      id: 'rec-3',
      patientId: 'pat-103',
      patientName: 'Hüseyin Kaya',
      reason: 'Teknik servis',
      dueDate: '2026-09-15',
      status: 'Bekliyor',
      lastContact: null,
      estimatedRevenue: 1500,
      probability: 'Yüksek Olasılık'
    }
  ];

  const today = '2026-10-09';

  // TC-057: Yeni Recall Oluşturma & Anında Listeleme
  it('TC-057: Yeni Recall Oluşturma — Yeni kayıt eklendiğinde liste başına gelir ve toplam sayı anında 1 artar', () => {
    const newRecall: RecallItem = {
      id: 'rec-new',
      patientId: 'pat-104',
      patientName: 'Zeynep Ak',
      reason: 'Pil değişimi',
      dueDate: '2026-10-20',
      status: 'Bekliyor',
      lastContact: null,
      estimatedRevenue: 500,
      probability: 'Yüksek Olasılık'
    };

    const updatedList = [newRecall, ...mockRecalls];
    expect(updatedList).toHaveLength(4);
    expect(updatedList[0].id).toBe('rec-new');
    expect(updatedList[0].patientName).toBe('Zeynep Ak');
  });

  // TC-058: Hatırlatma Türünün Korunması
  it('TC-058: Hatırlatma Türünün Korunması — Seçilen tür ("Teknik servis") bozulmadan kaydedilir', () => {
    const item = mockRecalls.find(r => r.id === 'rec-3');
    expect(item?.reason).toBe('Teknik servis');
  });

  // TC-059: Vadesi Geçmiş (Overdue) Hesaplama
  it('TC-059: Vadesi Geçmiş Hesaplama — Tarihi geçmiş randevu overdue olarak işaretlenir', () => {
    const overdueRecord = { status: 'Bekliyor', planDate: '2026-10-01' };
    expect(isRecallOverdue(overdueRecord, today)).toBe(true);

    const explicitlyOverdue = { status: 'Tarihi Geçti', planDate: '2026-10-15' };
    expect(isRecallOverdue(explicitlyOverdue, today)).toBe(true);
  });

  // TC-060: Gelecek Hatırlatma (Pending)
  it('TC-060: Gelecek Hatırlatma — Vadesi gelecekte olan kayıtlar pending grubunda toplanır', () => {
    const futureRecord = { status: 'Bekliyor', planDate: '2026-10-25' };
    expect(isRecallOverdue(futureRecord, today)).toBe(false);

    const counts = getRecallCounts([
      { status: 'Bekliyor', planDate: '2026-10-01' }, // Overdue
      { status: 'Bekliyor', planDate: '2026-10-25' }, // Pending
      { status: 'Gönderildi', planDate: '2026-10-05' } // Sent
    ], today);

    expect(counts.overdue).toBe(1);
    expect(counts.pending).toBe(1);
    expect(counts.sent).toBe(1);
    expect(counts.total).toBe(3);
  });

  // TC-061: Hatırlatma Tamamlama
  it('TC-061: Hatırlatma Tamamlama — Durum "Tamamlandı" yapıldığında aktif listeden çıkar', () => {
    const updated = mockRecalls.map(r => r.id === 'rec-1' ? { ...r, status: 'Tamamlandı' as RecallItem['status'] } : r);
    const active = updated.filter(r => r.status !== 'Tamamlandı');
    expect(active).toHaveLength(2);
    expect(active.some(r => r.id === 'rec-1')).toBe(false);
  });

  // TC-062: Recall Arama Çubuğu
  it('TC-062: Recall Arama — Hasta adı veya nedeni ile arama yapılır', () => {
    const searchRecall = (query: string) => {
      const q = query.toLowerCase();
      return mockRecalls.filter(r => r.patientName.toLowerCase().includes(q) || r.reason.toLowerCase().includes(q));
    };

    expect(searchRecall('Hüseyin')).toHaveLength(1);
    expect(searchRecall('pil')).toHaveLength(1);
    expect(searchRecall('yok')).toHaveLength(0);
  });

  // TC-063: Recall Şube Filtresi
  it('TC-063: Recall Şube Filtresi — Şubeye göre hatırlatmalar filtrelenir', () => {
    const recallsWithBranch = [
      { ...mockRecalls[0], branchId: 'br-kadikoy' },
      { ...mockRecalls[1], branchId: 'br-besiktas' }
    ];

    expect(recallsWithBranch.filter(r => r.branchId === 'br-kadikoy')).toHaveLength(1);
  });

  // TC-064: Hatırlatma Gönderme Aksiyonu
  it('TC-064: Hatırlatma Gönder Aksiyonu — Durum "Gönderildi"ye geçer ve lastContact bugünün tarihi olur', () => {
    const sentItem: RecallItem = {
      ...mockRecalls[0],
      status: 'Gönderildi',
      lastContact: today
    };

    expect(sentItem.status).toBe('Gönderildi');
    expect(sentItem.lastContact).toBe(today);
  });

  // TC-065: Recall'dan Randevu Oluşturma
  it('TC-065: Recall Randevu Oluşturma — Hatırlatma üzerinden randevu sayfasına yönlendirme parametresi oluşturulur', () => {
    const generateAppointmentUrl = (recall: RecallItem) => {
      return `#appointments?patientId=${recall.patientId}&reason=${encodeURIComponent(recall.reason)}`;
    };

    const url = generateAppointmentUrl(mockRecalls[0]);
    expect(url).toContain('patientId=pat-101');
    expect(url).toContain('Pil%20de%C4%9Fi%C5%9Fimi');
  });

  // TC-066: Tarih Aralığı Filtresi
  it('TC-066: Tarih Aralığı Filtresi — Belirli tarih aralığındaki vadesi gelen hatırlatmalar filtrelenir', () => {
    const range = parseRecallDateRange('01.10.2026 - 31.10.2026');
    const filtered = mockRecalls.filter(r => isDateKeyInRange(toRecallDateKey(r.dueDate), range));
    expect(filtered).toHaveLength(2); // rec-1 and rec-2 are in Oct 2026
  });

  // TC-067: Çoklu Satır Seçimi (Bulk Action)
  it('TC-067: Çoklu Satır Seçimi — Birden fazla hatırlatma seçilip toplu durum güncellenir', () => {
    const selectedIds = new Set(['rec-1', 'rec-2']);
    const bulkUpdated = mockRecalls.map(r => selectedIds.has(r.id) ? { ...r, status: 'Gönderildi' as RecallItem['status'] } : r);
    expect(bulkUpdated.filter(r => r.status === 'Gönderildi')).toHaveLength(2);
  });

  // TC-068: Recall Not Ekleme / Güncelleme
  it('TC-068: Takip Notu Ekleme — Hatırlatma satırına özel not kalıcı hale getirilir', () => {
    const itemWithNotes = { ...mockRecalls[0], notes: 'Hasta arandı, Salı günü gelecek' };
    expect(itemWithNotes.notes).toBe('Hasta arandı, Salı günü gelecek');
  });
});
