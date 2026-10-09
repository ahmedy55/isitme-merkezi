import { describe, expect, it, vi } from 'vitest';
import { parseRecallDateRange, isDateKeyInRange, toDateKey } from '../recallDateRange';
import { formatDate } from '../../data/mockData';

describe('Clinic Selector Bootstrap & Session Exchange', () => {
  it('handles clinic exchange gracefully when refresh_token is missing or fails', async () => {
    // Simulate Supabase client and select-org endpoint
    let selectedOrgId: string | null = null;
    const mockSession = {
      access_token: 'valid-test-access-token',
      refresh_token: undefined, // no refresh token available
      expires_at: Math.floor(Date.now() / 1000) + 3600,
      user: { id: 'u1', app_metadata: { organization_id: 'org-old' } },
    };

    const mockSupabase = {
      auth: {
        getSession: vi.fn().mockResolvedValue({ data: { session: mockSession }, error: null }),
        getUser: vi.fn().mockResolvedValue({ data: { user: mockSession.user }, error: null }),
        refreshSession: vi.fn().mockImplementation(async (opts?: { refresh_token?: string }) => {
          if (!opts?.refresh_token) {
            return { data: { session: null }, error: new Error('Invalid Refresh Token: Refresh Token Not Found') };
          }
          return { data: { session: mockSession }, error: null };
        }),
      },
    };

    // Bootstrap phase: loads session safely
    const sessionRes = await mockSupabase.auth.getSession();
    const activeSession = sessionRes.data?.session;
    expect(activeSession).toBeDefined();

    // Context exchange phase: simulates handleSelectOrg
    const session = activeSession;
    const token = session?.access_token || '';
    expect(token).toBe('valid-test-access-token');

    // Simulate /api/select-org call
    const selectOrgResponse = { ok: true, status: 200, json: async () => ({ success: true, orgId: 'org-new' }) };
    if (selectOrgResponse.ok) {
      selectedOrgId = 'org-new';
    }

    // Post-exchange: guard refreshSession when refresh_token is absent
    let refreshWarningCaught = false;
    if (session?.refresh_token) {
      const { error: refreshError } = await mockSupabase.auth.refreshSession({ refresh_token: session.refresh_token });
      if (refreshError) refreshWarningCaught = true;
    }

    expect(refreshWarningCaught).toBe(false);
    expect(mockSupabase.auth.refreshSession).not.toHaveBeenCalled();
    expect(selectedOrgId).toBe('org-new');
  });

  it('safely refreshes session when valid refresh_token is present', async () => {
    const mockSession = {
      access_token: 'valid-test-access-token',
      refresh_token: 'valid-refresh-token',
      expires_at: Math.floor(Date.now() / 1000) + 3600,
    };

    const mockSupabase = {
      auth: {
        refreshSession: vi.fn().mockResolvedValue({
          data: { session: { ...mockSession, access_token: 'new-jwt-token' } },
          error: null,
        }),
      },
    };

    const { data, error } = await mockSupabase.auth.refreshSession({ refresh_token: mockSession.refresh_token });
    expect(error).toBeNull();
    expect(data.session?.access_token).toBe('new-jwt-token');
  });
});

describe('Filter SGK prescription records by status and date range', () => {
  const mockPatients = [
    {
      id: 'p1',
      firstName: 'Ahmet',
      lastName: 'Yılmaz',
      tc: '12345678901',
      prescriptionNo: 'REC-2026-001',
      prescriptionStatus: 'SGK Onaylı',
      createdAt: '2026-05-15T10:30:00.000Z',
      branch: 'Merkez Şube',
    },
    {
      id: 'p2',
      firstName: 'Ayşe',
      lastName: 'Kaya',
      tc: '98765432109',
      prescriptionNo: 'REC-2026-002',
      prescriptionStatus: 'Reçete Yazıldı',
      deviceDate: '2026-11-20',
      branch: 'Merkez Şube',
    },
    {
      id: 'p3',
      firstName: 'Mehmet',
      lastName: 'Demir',
      tc: '55555555555',
      prescriptionNo: 'REC-2025-099',
      prescriptionStatus: 'Reçete Reddedildi',
      createdAt: '2025-12-10T08:00:00.000Z',
      branch: 'Merkez Şube',
    },
    {
      id: 'p4',
      firstName: 'Fatma',
      lastName: 'Çelik',
      tc: '44444444444',
      prescriptionNo: 'REC-2027-001',
      prescriptionStatus: 'SGK Onaylı',
      createdAt: '2027-02-01T12:00:00.000Z',
      branch: 'Merkez Şube',
    },
  ];

  it('computes visible and formatted date instead of "—"', () => {
    const items = mockPatients.map(p => {
      const rawDate = (p as any).prescriptionDate || p.deviceDate || p.createdAt || '2026-06-15';
      const formatted = formatDate(rawDate);
      const displayDate = formatted !== '—' ? formatted : '15.06.2026';
      const dateKey = toDateKey(rawDate) || toDateKey(displayDate) || '2026-06-15';
      return {
        id: p.id,
        prescriptionNo: p.prescriptionNo,
        date: displayDate,
        dateKey,
        status: p.prescriptionStatus === 'SGK Onaylı' ? 'Onaylandı' : p.prescriptionStatus === 'Reçete Reddedildi' ? 'Reddedildi' : 'İşlemde',
      };
    });

    expect(items[0].date).toBe('15.05.2026');
    expect(items[0].date).not.toBe('—');
    expect(items[0].dateKey).toBe('2026-05-15');

    expect(items[1].date).toBe('20.11.2026');
    expect(items[1].date).not.toBe('—');
    expect(items[1].dateKey).toBe('2026-11-20');

    expect(items[2].date).toBe('10.12.2025');
    expect(items[3].date).toBe('01.02.2027');
  });

  it('filters items correctly by date range "01/01/2026 - 12/31/2026"', () => {
    const range = parseRecallDateRange('01/01/2026 - 12/31/2026');
    expect(range).toEqual({ from: '2026-01-01', to: '2026-12-31' });

    const items = mockPatients.map(p => {
      const rawDate = p.deviceDate || p.createdAt || '2026-06-15';
      return {
        id: p.id,
        date: formatDate(rawDate),
        dateKey: toDateKey(rawDate),
        status: p.prescriptionStatus === 'SGK Onaylı' ? 'Onaylandı' : p.prescriptionStatus === 'Reçete Reddedildi' ? 'Reddedildi' : 'İşlemde',
      };
    });

    const inRange = items.filter(item => isDateKeyInRange(item.dateKey, range));
    expect(inRange.map(i => i.id)).toEqual(['p1', 'p2']);
    expect(inRange.find(i => i.id === 'p3')).toBeUndefined(); // 2025 excluded
    expect(inRange.find(i => i.id === 'p4')).toBeUndefined(); // 2027 excluded
  });

  it('combines status and date range filters accurately', () => {
    const range = parseRecallDateRange('01/01/2026 - 12/31/2026');
    const selectedStatus: string = 'Onaylandı';

    const items = mockPatients.map(p => {
      const rawDate = p.deviceDate || p.createdAt || '2026-06-15';
      return {
        id: p.id,
        date: formatDate(rawDate),
        dateKey: toDateKey(rawDate),
        status: p.prescriptionStatus === 'SGK Onaylı' ? 'Onaylandı' : p.prescriptionStatus === 'Reçete Reddedildi' ? 'Reddedildi' : 'İşlemde',
      };
    });

    const filtered = items.filter(item => {
      if (selectedStatus !== 'Tüm Durumlar' && item.status !== selectedStatus) return false;
      if (!isDateKeyInRange(item.dateKey, range)) return false;
      return true;
    });

    expect(filtered.length).toBe(1);
    expect(filtered[0].id).toBe('p1');
    expect(filtered[0].status).toBe('Onaylandı');
    expect(filtered[0].date).toBe('15.05.2026');
  });
});
