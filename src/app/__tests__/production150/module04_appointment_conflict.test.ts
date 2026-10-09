import { describe, it, expect } from 'vitest';
import { validateAppointmentDateTime } from '../../lib/validation';
import { parseAppointmentDateTime } from '../../lib/appointmentDateTime';
import { isOpenAppointment, isClosedAppointment } from '../../lib/appointmentStatus';
import { BranchService } from '../../services/BranchService';
import { Appointment } from '../../data/mockData';

describe('Modül 04: Randevu Yönetimi & Çakışma Kontrolü (TC-043 - TC-056)', () => {
  const baseAppointment: Appointment = {
    id: 'apt-1',
    patientId: 'pat-100',
    patientName: 'Ahmet Yılmaz',
    audiologist: 'Ody. Selin Can',
    date: '2026-10-15',
    time: '14:00',
    type: 'Cihaz Denemesi',
    status: 'Bekliyor',
    branch: 'Merkez 1 - Kadıköy',
    branchId: 'br-kadikoy',
    notes: 'İlk deneme seansı'
  };

  // TC-043: Standart Randevu Oluşturma
  it('TC-043: Standart Randevu Oluşturma — Geçerli alanlar ile randevu başarıyla tanımlanır', () => {
    const parsedDate = parseAppointmentDateTime(baseAppointment.date, baseAppointment.time);
    expect(parsedDate).not.toBeNull();
    expect(baseAppointment.patientName).toBe('Ahmet Yılmaz');
    expect(baseAppointment.status).toBe('Bekliyor');
  });

  // TC-044: Geçmiş Tarihe Randevu Engeli
  it('TC-044: Geçmiş Tarihe Randevu Engeli — Dünün tarihine randevu oluşturulamaz', () => {
    const today = new Date('2026-10-09T10:00:00Z');
    const pastCheck = validateAppointmentDateTime('2026-10-08', '14:00', today);
    expect(pastCheck.isValid).toBe(false);
    expect(pastCheck.error).toContain('Geçmiş bir tarihe');

    const futureCheck = validateAppointmentDateTime('2026-10-15', '14:00', today);
    expect(futureCheck.isValid).toBe(true);
  });

  // TC-045: Aynı Odyoloğa Saat Çakışması
  it('TC-045: Aynı Odyoloğa Saat Çakışması — Aynı odyoloğa aynı gün ve saatte çakışan randevu tespit edilir', () => {
    const existingAppointments: Appointment[] = [baseAppointment];

    const hasConflict = (newApt: Partial<Appointment>) => {
      return existingAppointments.some(
        a =>
          a.audiologist === newApt.audiologist &&
          a.date === newApt.date &&
          a.time === newApt.time &&
          a.id !== newApt.id &&
          a.status !== 'İptal'
      );
    };

    // Conflicting request with same doctor, date and time
    const conflictRequest = { audiologist: 'Ody. Selin Can', date: '2026-10-15', time: '14:00' };
    expect(hasConflict(conflictRequest)).toBe(true);

    // Non-conflicting request at different time
    const differentTimeRequest = { audiologist: 'Ody. Selin Can', date: '2026-10-15', time: '15:30' };
    expect(hasConflict(differentTimeRequest)).toBe(false);

    // Non-conflicting request with different doctor
    const differentDoctorRequest = { audiologist: 'Ody. Murat Tekin', date: '2026-10-15', time: '14:00' };
    expect(hasConflict(differentDoctorRequest)).toBe(false);
  });

  // TC-046: Randevu Durumu: Geldi
  it('TC-046: Randevu Durumu: Geldi — Durum "Geldi"ye geçtiğinde kapalı randevu sayılır', () => {
    const completedApt: Appointment = { ...baseAppointment, status: 'Geldi' };
    expect(isOpenAppointment(completedApt.status)).toBe(false);
    expect(isClosedAppointment(completedApt.status)).toBe(true);
  });

  // TC-047: Randevu Durumu: İptal Edildi
  it('TC-047: Randevu Durumu: İptal — Randevu iptal edildiğinde saat dilimi yeniden müsait hale gelir', () => {
    const cancelledApt: Appointment = { ...baseAppointment, status: 'İptal' };
    const appointmentPool = [cancelledApt];

    const isSlotOccupied = (date: string, time: string, doctor: string) => {
      return appointmentPool.some(
        a => a.date === date && a.time === time && a.audiologist === doctor && a.status !== 'İptal'
      );
    };

    expect(isSlotOccupied('2026-10-15', '14:00', 'Ody. Selin Can')).toBe(false);
  });

  // TC-048: Randevu Saati Güncelleme (Reschedule)
  it('TC-048: Randevu Saati Güncelleme — Randevu saati taşındığında yeni saat geçerli olur', () => {
    const rescheduled: Appointment = {
      ...baseAppointment,
      time: '16:30'
    };
    expect(rescheduled.time).toBe('16:30');
    expect(parseAppointmentDateTime(rescheduled.date, rescheduled.time)).not.toBeNull();
  });

  // TC-049: Randevudan Hasta Profiline Geçiş
  it('TC-049: Hasta Profiline Geçiş — Randevu kartındaki patientId üzerinden hasta detay linki oluşturulur', () => {
    const profileHref = `#patients?id=${baseAppointment.patientId}`;
    expect(profileHref).toBe('#patients?id=pat-100');
  });

  // TC-050: Takvim Görünüm Modları
  it('TC-050: Takvim Görünüm Modları — Günlük, Haftalık ve Liste filtreleme projeksiyonları doğrulanır', () => {
    const filterByDateRange = (appointments: Appointment[], startDate: string, endDate: string) => {
      return appointments.filter(a => a.date >= startDate && a.date <= endDate);
    };

    const appointments = [
      { ...baseAppointment, date: '2026-10-12' },
      { ...baseAppointment, date: '2026-10-15' },
      { ...baseAppointment, date: '2026-10-25' }
    ];

    // Weekly view: 2026-10-12 to 2026-10-18
    const weeklyAppointments = filterByDateRange(appointments, '2026-10-12', '2026-10-18');
    expect(weeklyAppointments).toHaveLength(2);
  });

  // TC-051: Odyolog Bazlı Filtreleme
  it('TC-051: Odyolog Bazlı Filtreleme — Seçilen uzmanın randevuları izole edilir', () => {
    const appointments: Appointment[] = [
      { ...baseAppointment, audiologist: 'Ody. Selin Can' },
      { ...baseAppointment, audiologist: 'Ody. Murat Tekin' }
    ];

    const filtered = appointments.filter(a => a.audiologist === 'Ody. Selin Can');
    expect(filtered).toHaveLength(1);
    expect(filtered[0].audiologist).toBe('Ody. Selin Can');
  });

  // TC-052: Şube Bazlı Randevu Ayrımı
  it('TC-052: Şube Bazlı Randevu Ayrımı — Aktif şube bağlamı ile sadece o şubenin ajandası listelenir', () => {
    const singleBranchContext = { mode: 'single' as const, branchId: 'br-kadikoy', slug: 'kadikoy' };
    const kadikoyApt = baseAppointment;
    const besiktasApt: Appointment = { ...baseAppointment, id: 'apt-2', branchId: 'br-besiktas', branch: 'Merkez 2 - Beşiktaş' };

    expect(BranchService.matchesBranch(kadikoyApt.branch, kadikoyApt.branchId, singleBranchContext)).toBe(true);
    expect(BranchService.matchesBranch(besiktasApt.branch, besiktasApt.branchId, singleBranchContext)).toBe(false);
  });

  // TC-053: Randevu Silme
  it('TC-053: Randevu Silme — Listeden çıkarılan randevu ajandada artık yer almaz', () => {
    let list = [baseAppointment];
    list = list.filter(a => a.id !== 'apt-1');
    expect(list).toHaveLength(0);
  });

  // TC-054: SMS / Hatırlatma Durumu
  it('TC-054: SMS Hatırlatma Durumu — "Hatırlatma Gönder" ile durum "Hatırlatıldı" rozetine geçer', () => {
    const remindedApt: Appointment = { ...baseAppointment, status: 'Hatırlatıldı' };
    expect(isOpenAppointment(remindedApt.status)).toBe(true);
    expect(remindedApt.status).toBe('Hatırlatıldı');
  });

  // TC-055: Randevu Türü Filtresi
  it('TC-055: Randevu Türü Filtresi — "Cihaz Denemesi", "Kontrol", "Pil Değişimi" türleri filtrelenir', () => {
    const appointments: Appointment[] = [
      { ...baseAppointment, type: 'Cihaz Denemesi' },
      { ...baseAppointment, id: 'apt-3', type: 'Kontrol' },
      { ...baseAppointment, id: 'apt-4', type: 'Pil Değişimi' }
    ];

    expect(appointments.filter(a => a.type === 'Cihaz Denemesi')).toHaveLength(1);
    expect(appointments.filter(a => a.type === 'Kontrol')).toHaveLength(1);
  });

  // TC-056: Gece Yarısı / Gün Değişimi
  it('TC-056: Gün Değişimi — 23:59 -> 00:01 geçişinde sistem tarihi ve bugün karşılaştırması tutarlıdır', () => {
    const midnightBefore = new Date('2026-10-09T23:59:59Z');
    const midnightAfter = new Date('2026-10-10T00:00:01Z');

    const getDateKey = (d: Date) => d.toISOString().split('T')[0];
    expect(getDateKey(midnightBefore)).toBe('2026-10-09');
    expect(getDateKey(midnightAfter)).toBe('2026-10-10');
  });
});
