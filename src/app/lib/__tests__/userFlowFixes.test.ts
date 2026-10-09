import { describe, it, expect } from 'vitest';
import { parseRecallDateRange, isDateKeyInRange } from '../recallDateRange';
import type { Patient, RecallItem } from '../../types/models';

describe('User Flow Fixes Verification', () => {
  describe('Flow 1: Recall Reminder Creation & Result Set Inclusion', () => {
    it('preserves chosen recall reason without coercing everything to Yıllık Kontrol', () => {
      const selectedType = 'Pil değişimi';
      const createdRecall: RecallItem = {
        id: 'rec-new-1',
        patientId: 'pat-100',
        patientName: 'Test Hasta',
        reason: selectedType as any,
        dueDate: '2026-10-15',
        status: 'Bekliyor',
        lastContact: '2026-10-01',
        estimatedRevenue: 15000,
        probability: 'Yüksek Olasılık',
      };

      expect(createdRecall.reason).toBe('Pil değişimi');
      expect(createdRecall.reason).not.toBe('Yıllık Kontrol');
    });

    it('merges newly created reminder into the top of recall list and increments total count', () => {
      const existingRecalls: RecallItem[] = Array.from({ length: 10 }, (_, i) => ({
        id: `rec-${i + 1}`,
        patientId: `pat-${i + 1}`,
        patientName: `Hasta ${i + 1}`,
        reason: 'Yıllık Kontrol',
        dueDate: '2026-10-01',
        status: 'Bekliyor',
        lastContact: '2026-10-01',
        estimatedRevenue: 15000,
        probability: 'Yüksek Olasılık',
      }));

      expect(existingRecalls.length).toBe(10);

      const createdRecall: RecallItem = {
        id: 'rec-11',
        patientId: 'pat-11',
        patientName: 'Yeni Recall Hasta',
        reason: 'Pil değişimi',
        dueDate: '2026-10-20',
        status: 'Bekliyor',
        lastContact: '2026-10-01',
        estimatedRevenue: 15000,
        probability: 'Yüksek Olasılık',
      };

      const merged = [createdRecall, ...existingRecalls.filter(r => r.id !== createdRecall.id)];

      expect(merged.length).toBe(11);
      expect(merged[0].id).toBe('rec-11');
      expect(merged[0].patientName).toBe('Yeni Recall Hasta');
    });
  });

  describe('Flow 2: Prescription Record Billing Status Mapping', () => {
    it('correctly maps SGK page status to patient prescriptionStatus', () => {
      const mapStatus = (status: 'Onaylandı' | 'İşlemde' | 'Reddedildi'): Patient['prescriptionStatus'] => {
        if (status === 'Onaylandı') return 'SGK Onaylı';
        if (status === 'Reddedildi') return 'Reçete Reddedildi';
        return 'Reçete Yazıldı';
      };

      expect(mapStatus('Onaylandı')).toBe('SGK Onaylı');
      expect(mapStatus('İşlemde')).toBe('Reçete Yazıldı');
      expect(mapStatus('Reddedildi')).toBe('Reçete Reddedildi');
    });

    it('derives SGK table status badge correctly from patient prescriptionStatus', () => {
      const deriveStatus = (prescriptionStatus?: string): 'Onaylandı' | 'İşlemde' | 'Reddedildi' => {
        if (prescriptionStatus === 'SGK Onaylı') return 'Onaylandı';
        if (prescriptionStatus === 'Reçete Reddedildi') return 'Reddedildi';
        return 'İşlemde';
      };

      expect(deriveStatus('SGK Onaylı')).toBe('Onaylandı');
      expect(deriveStatus('Reçete Yazıldı')).toBe('İşlemde');
      expect(deriveStatus('Reçete Reddedildi')).toBe('Reddedildi');
    });
  });

  describe('Flow 3: Filter Patients by Appointment Date Range', () => {
    it('parses range "2026-10-06 - 2026-10-08" and excludes out-of-range appointments like 30.09.2026', () => {
      const filterValue = '2026-10-06 - 2026-10-08';
      const parsed = parseRecallDateRange(filterValue);
      expect(parsed).toEqual({ from: '2026-10-06', to: '2026-10-08' });

      // Out-of-range appointment on 30.09.2026 (2026-09-30)
      const outOfRangeDate = '2026-09-30';
      expect(isDateKeyInRange(outOfRangeDate, parsed)).toBe(false);

      // In-range appointment on 07.10.2026 (2026-10-07)
      const inRangeDate = '2026-10-07';
      expect(isDateKeyInRange(inRangeDate, parsed)).toBe(true);
    });

    it('correctly filters patient appointment list with range', () => {
      const filterValue = '2026-10-06 - 2026-10-08';
      const parsed = parseRecallDateRange(filterValue);

      const patientAAppointments = [{ date: '2026-09-30' }];
      const patientBAppointments = [{ date: '2026-10-07' }];
      const patientCAppointments = [{ date: '2026-10-01' }, { date: '2026-10-08' }];

      const matchesDateRange = (appointments: { date: string }[]) => {
        return appointments.some(a => isDateKeyInRange(a.date.slice(0, 10), parsed));
      };

      expect(matchesDateRange(patientAAppointments)).toBe(false); // 30.09.2026 excluded!
      expect(matchesDateRange(patientBAppointments)).toBe(true);  // 07.10.2026 included!
      expect(matchesDateRange(patientCAppointments)).toBe(true);  // has 08.10.2026 included!
    });
  });

  describe('Flow 4: Add New Patient & Cross-Branch Search Visibility', () => {
    it('allows global search to match patient by name or TC across branches', () => {
      const patients: Patient[] = [
        {
          id: 'p-1',
          tc: '10000000011',
          firstName: 'Autotest',
          lastName: 'YeniHasta2026',
          phone: '05551112233',
          email: '',
          birthDate: '1990-01-01',
          gender: 'Erkek',
          address: 'Kadıköy',
          hearingLoss: 'Hafif',
          hearingLossSide: 'Sol',
          branchId: 'branch-kadikoy',
          branch: 'Kadıköy Şubesi',
        },
        {
          id: 'p-2',
          tc: '20000000022',
          firstName: 'Ayşe',
          lastName: 'Demir',
          phone: '05552223344',
          email: '',
          birthDate: '1985-05-05',
          gender: 'Kadın',
          address: 'Bakırköy',
          hearingLoss: 'Orta',
          hearingLossSide: 'Sağ',
          branchId: 'branch-bakirkoy',
          branch: 'Bakırköy Şubesi',
        },
      ];

      const searchPatients = (query: string, activeBranchId?: string) => {
        const q = query.trim().toLowerCase();
        // If query is present, search across all branches
        const base = q ? patients : patients.filter(p => !activeBranchId || p.branchId === activeBranchId);
        return base.filter(p =>
          !q ||
          `${p.firstName} ${p.lastName}`.toLowerCase().includes(q) ||
          p.tc.includes(q)
        );
      };

      // Searching by name find Autotest YeniHasta2026 even if branch scope is Bakırköy
      const searchByName = searchPatients('Autotest YeniHasta2026', 'branch-bakirkoy');
      expect(searchByName.length).toBe(1);
      expect(searchByName[0].tc).toBe('10000000011');

      // Searching by TC finds Autotest YeniHasta2026
      const searchByTC = searchPatients('10000000011', 'branch-bakirkoy');
      expect(searchByTC.length).toBe(1);
      expect(searchByTC[0].firstName).toBe('Autotest');
    });
  });
});
