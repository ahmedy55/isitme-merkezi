import { describe, expect, it } from 'vitest';
import type { Appointment } from '../../data/mockData';
import { countOpenAppointments, isClosedAppointment, isOpenAppointment } from '../appointmentStatus';

const appointment = (id: string, status: Appointment['status'], branchId = 'branch-a'): Appointment => ({
  id,
  patientId: `patient-${id}`,
  patientName: 'Test Hasta',
  date: '2026-09-30',
  time: '09:00',
  type: 'Kontrol',
  audiologist: 'Test Odyolog',
  status,
  branch: branchId,
  branchId,
  notes: '',
});

describe('appointment status badges and open-count rules', () => {
  it('counts only open appointments within the selected branch', () => {
    const appointments = [
      appointment('1', 'Bekliyor', 'branch-a'),
      appointment('2', 'Hatırlatıldı', 'branch-a'),
      appointment('3', 'İptal', 'branch-a'),
      appointment('4', 'Geldi', 'branch-b'),
    ];

    expect(countOpenAppointments(appointments, { mode: 'all' })).toBe(2);
    expect(countOpenAppointments(appointments, { mode: 'single', branchId: 'branch-a', slug: 'branch-a' })).toBe(2);
    expect(countOpenAppointments(appointments, { mode: 'single', branchId: 'branch-b', slug: 'branch-b' })).toBe(0);
  });

  it('removes a canceled appointment from the open badge count and marks it closed', () => {
    const before = [appointment('1', 'Bekliyor')];
    const after = [appointment('1', 'İptal')];

    expect(countOpenAppointments(before, { mode: 'all' })).toBe(1);
    expect(countOpenAppointments(after, { mode: 'all' })).toBe(0);
    expect(isOpenAppointment('İptal')).toBe(false);
    expect(isClosedAppointment('İptal')).toBe(true);
  });
});
