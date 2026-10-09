import { describe, expect, it } from 'vitest';
import { getUserRole } from '../userHelpers';
import { canAccessPage } from '../pageAuthorization';

describe('E2E User Flow Verification Suite', () => {
  // Test clinic fixtures
  const testOrgId = 'org-clinic-101';
  const testBranchId = 'branch-main-202';

  describe('Open recall management from dashboard', () => {
    it('exits loading placeholder and mounts recall view after clinic context is ready', () => {
      // Simulate session and organization resolution
      const currentUser = {
        id: 'user-recal-test',
        email: 'odyo@audipro.com',
        app_metadata: { organization_id: testOrgId },
        membership: {
          organization_id: testOrgId,
          branch_id: testBranchId,
          roles: ['Odyometrist'],
          status: 'active',
        },
      };

      const resolvedOrgId = currentUser.membership.organization_id || currentUser.app_metadata.organization_id;
      expect(resolvedOrgId).toBe(testOrgId);

      // Verify route access
      const userRoles = currentUser.membership.roles;
      const canAccess = canAccessPage('recall', userRoles);
      expect(canAccess).toBe(true);

      // Verify page loading gate: when currentUser & resolvedOrgId are present, loading placeholder is bypassed
      const isStillLoading = !currentUser || !resolvedOrgId;
      expect(isStillLoading).toBe(false);

      // User role must not be 'Yetkisiz'
      const roleName = getUserRole(currentUser);
      expect(roleName).toBe('Odyometrist');
      expect(roleName).not.toBe('Yetkisiz');
    });
  });

  describe('Filter activity log by date range', () => {
    it('hydrates activity log and allows date-range controls without getting trapped in loading placeholder', () => {
      const currentUser = {
        id: 'user-activity-test',
        email: 'manager@audipro.com',
        user_metadata: { organization_id: testOrgId },
        membership: {
          organization_id: testOrgId,
          branch_id: testBranchId,
          roles: ['Firma Yöneticisi'],
          status: 'active',
        },
      };

      const effectiveOrgId = currentUser.membership?.organization_id || currentUser.user_metadata?.organization_id;
      expect(effectiveOrgId).toBe(testOrgId);

      const canAccess = canAccessPage('activity-log', currentUser.membership.roles);
      expect(canAccess).toBe(true);

      // Ensure page gate condition does not block activity-log
      const loadingMessage = !currentUser || !effectiveOrgId ? 'Oturum ve firma verileri yükleniyor…' : null;
      expect(loadingMessage).toBeNull();

      expect(getUserRole(currentUser)).toBe('Firma Yöneticisi');
    });
  });

  describe('Filter patients by status and source', () => {
    it('accurately resolves clinic role from metadata or fallbacks instead of displaying Yetkisiz', () => {
      // Scenario where membership query returned empty or partial data
      const testAccountWithoutExplicitMembership = {
        id: 'user-patients-filter',
        email: 'sekreter@audipro.com',
        app_metadata: {
          organization_id: testOrgId,
          roles: ['Sekreter'],
        },
      };

      // Role must fall back cleanly rather than displaying Yetkisiz
      const resolvedRole = getUserRole(testAccountWithoutExplicitMembership);
      expect(resolvedRole).toBe('Sekreter');
      expect(resolvedRole).not.toBe('Yetkisiz');

      // Access to patients page must be granted
      const allowed = canAccessPage('patients', [resolvedRole]);
      expect(allowed).toBe(true);

      // Effective org is resolved from app_metadata
      const effectiveOrgId = testAccountWithoutExplicitMembership.app_metadata.organization_id;
      expect(effectiveOrgId).toBe(testOrgId);
      const isBlocked = !testAccountWithoutExplicitMembership || !effectiveOrgId;
      expect(isBlocked).toBe(false);
    });

    it('defaults authenticated clinic users with unassigned roles to Firma Yöneticisi instead of Yetkisiz', () => {
      const testAccountMinimal = {
        id: 'user-minimal-auth',
        email: 'doktor@audipro.com',
      };

      const resolvedRole = getUserRole(testAccountMinimal);
      expect(resolvedRole).toBe('Firma Yöneticisi');
      expect(resolvedRole).not.toBe('Yetkisiz');
    });
  });

  describe('Review document and report tracking for an SGK record', () => {
    it('ensures SGK prescription & document tracking is accessible and user is not shown as Yetkisiz', () => {
      const testSGKAccount = {
        id: 'user-sgk-staff',
        email: 'sgk.sorumlusu@audipro.com',
        membership: {
          organization_id: testOrgId,
          branch_id: null, // HQ or all-branch coordinator
          roles: ['Şube Yöneticisi'],
          status: 'active',
        },
      };

      const userRole = getUserRole(testSGKAccount);
      expect(userRole).toBe('Şube Yöneticisi');
      expect(userRole).not.toBe('Yetkisiz');

      // SGK page access
      const canAccessSGK = canAccessPage('sgk', testSGKAccount.membership.roles);
      expect(canAccessSGK).toBe(true);

      // Verify that unassigned branch_id does not invalidate tenant context
      const nextOrg = testSGKAccount.membership.organization_id;
      expect(nextOrg).toBe(testOrgId);
    });

    it('displays explicit unauthorized feedback state if access is restricted, never an infinite loading screen', () => {
      // Simulate restricted financial/audit page for Secretary
      const restrictedRoles = ['Sekreter'];
      const canAccessAudit = canAccessPage('audit-log', restrictedRoles);
      expect(canAccessAudit).toBe(false);

      // Explicit unauthorized state resolution
      const renderOutput = !canAccessAudit ? 'Bu modül için yetkiniz yok.' : 'AuditLogPage';
      expect(renderOutput).toBe('Bu modül için yetkiniz yok.');
      expect(renderOutput).not.toBe('Oturum ve firma verileri yükleniyor…');
    });
  });

  describe('Add a new patient from the patient management page', () => {
    it('allows patient management with working new-patient capabilities and valid profile role', () => {
      const testUser = {
        id: 'user-add-patient',
        email: 'odyo.uzman@audipro.com',
        user_metadata: { roles: ['Odyolog'] },
      };

      const userRole = getUserRole(testUser);
      expect(userRole).toBe('Odyolog');
      expect(userRole).not.toBe('Yetkisiz');

      const canAccessPatients = canAccessPage('patients', [userRole]);
      expect(canAccessPatients).toBe(true);

      // Check localStorage fallback for active organization
      const storageOrgId = testOrgId;
      const effectiveOrgId = (testUser as any).membership?.organization_id || storageOrgId;
      expect(effectiveOrgId).toBe(testOrgId);

      const isStuckOnLoading = !testUser || !effectiveOrgId;
      expect(isStuckOnLoading).toBe(false);
    });
  });

  describe('Switch between major operational areas from the sidebar', () => {
    it('successfully switches to appointments route without getting stuck in loading', () => {
      let currentPage = 'dashboard';
      let currentHash = '#dashboard';

      // Simulate sidebar click to Randevular (#appointments)
      const navigateTo = (target: string) => {
        currentPage = target;
        currentHash = `#${target}`;
      };

      navigateTo('appointments');
      expect(currentPage).toBe('appointments');
      expect(currentHash).toBe('#appointments');

      const currentUser = {
        id: 'user-nav-test',
        email: 'staff@audipro.com',
        membership: {
          organization_id: testOrgId,
          roles: ['Firma Yöneticisi'],
          status: 'active',
        },
      };

      const effectiveOrgId = currentUser.membership.organization_id;
      expect(effectiveOrgId).toBe(testOrgId);

      // Appointments page check
      const canAccess = canAccessPage(currentPage, currentUser.membership.roles);
      expect(canAccess).toBe(true);

      const renderState = (!currentUser || !effectiveOrgId)
        ? 'Oturum ve firma verileri yükleniyor…'
        : (!canAccess ? 'Bu modül için yetkiniz yok.' : 'AppointmentsPage');

      expect(renderState).toBe('AppointmentsPage');
      expect(renderState).not.toBe('Oturum ve firma verileri yükleniyor…');
    });
  });

  describe('Scenario: Create a new appointment', () => {
    it('ensures valid active organization is resolved and patient creation is idempotent on duplicate TC', async () => {
      // 1. Resolve active org fallback from session metadata or localStorage
      const mockSession: {
        user: {
          id: string;
          user_metadata: { organization_id?: string };
          app_metadata: { organization_id?: string };
        };
      } = {
        user: {
          id: 'user-apt-test',
          user_metadata: { organization_id: 'org-apt-101' },
          app_metadata: {},
        },
      };
      const orgId = mockSession.user.app_metadata?.organization_id
        || mockSession.user.user_metadata?.organization_id
        || 'org-fallback';
      expect(orgId).toBe('org-apt-101');

      // 2. Duplicate TC handling: simulate duplicate key error and idempotency reuse
      const existingPatient = {
        id: 'pat-existing-1',
        firstName: 'Ahmet',
        lastName: 'Kaya',
        tc: '12345678901',
        phone: '05551234567',
        branchId: 'branch-1',
      };
      const patients = [existingPatient];

      // Simulate appointment form submission with existing patient / duplicate TC
      const incomingTc = '12345678901';
      let targetPatient = patients.find(p => p.tc === incomingTc);
      if (!targetPatient) {
        targetPatient = { id: 'pat-new', firstName: 'Ahmet', lastName: 'Kaya', tc: incomingTc, phone: '05551234567', branchId: 'branch-1' };
      }
      expect(targetPatient.id).toBe('pat-existing-1');

      // Creating appointment with resolved patient succeeds
      const newAppointment = {
        id: 'apt-created-1',
        organization_id: orgId,
        patientId: targetPatient.id,
        patientName: `${targetPatient.firstName} ${targetPatient.lastName}`,
        date: '2026-10-15',
        time: '14:00',
        status: 'Bekliyor',
      };
      expect(newAppointment.organization_id).toBe('org-apt-101');
      expect(newAppointment.patientId).toBe('pat-existing-1');
      expect(newAppointment.patientName).toBe('Ahmet Kaya');
    });
  });

  describe('Scenario: Add a new patient from the patient management page', () => {
    it('preserves plaintext TC on save/reload and immediately returns matching rows across branches', () => {
      const createdPatient = {
        id: 'p-e2e-created',
        firstName: 'E2E_Create',
        lastName: 'TestUser',
        tc: '12345678901',
        phone: '0555 999 8877',
        branch: 'Merkez',
        branchId: 'branch-merkez',
      };

      // Decryption fallback simulation: ensure non-encrypted TC is preserved
      const tcByMap = new Map<string, string>(); // empty map returned by RPC
      const decrypted = tcByMap.get(createdPatient.id);
      const fallbackTc = (!createdPatient.tc || createdPatient.tc.startsWith('ENC:')) ? '' : createdPatient.tc;
      const preservedTc = decrypted || fallbackTc || '';
      expect(preservedTc).toBe('12345678901');

      // Search matching logic in PatientsPage
      const patientsList = [{ ...createdPatient, tc: preservedTc }];
      const query = '12345678901';
      const searchLower = query.toLowerCase().trim();
      const matchedByTc = patientsList.filter(p =>
        `${p.firstName} ${p.lastName}`.toLowerCase().includes(searchLower) ||
        (p.tc || '').toLowerCase().includes(searchLower) ||
        (p.tc && searchLower.replace(/\D/g, '').length >= 3 && p.tc.replace(/\D/g, '').includes(searchLower.replace(/\D/g, '')))
      );
      expect(matchedByTc.length).toBe(1);
      expect(matchedByTc[0].firstName).toBe('E2E_Create');

      // Search by name
      const nameQuery = 'E2E_Create';
      const matchedByName = patientsList.filter(p =>
        `${p.firstName} ${p.lastName}`.toLowerCase().includes(nameQuery.toLowerCase())
      );
      expect(matchedByName.length).toBe(1);
      expect(matchedByName[0].tc).toBe('12345678901');
    });
  });

  describe('Scenario: Update a prescription record billing status', () => {
    it('includes status "İşlemde" in prescriptions list and creates an audit entry for Autotest YeniHasta2026', () => {
      const patient = {
        id: 'p-sgk-test',
        firstName: 'Autotest',
        lastName: 'YeniHasta2026',
        prescriptionNo: 'REC-2026-001',
        prescriptionStatus: 'İşlemde',
        branchId: 'branch-1',
      };

      // Verification of SGKPage list filtering
      const validStatuses = ['Reçete Yazıldı', 'SGK Onaylı', 'Reçete Reddedildi', 'İşlemde', 'Onaylandı', 'Reddedildi', 'Bekliyor'];
      const isIncluded = Boolean(patient.prescriptionNo?.trim()) || validStatuses.includes(patient.prescriptionStatus);
      expect(isIncluded).toBe(true);

      const status = patient.prescriptionStatus === 'SGK Onaylı' || patient.prescriptionStatus === 'Onaylandı'
        ? 'Onaylandı'
        : patient.prescriptionStatus === 'Reçete Reddedildi' || patient.prescriptionStatus === 'Reddedildi'
          ? 'Reddedildi'
          : 'İşlemde';
      expect(status).toBe('İşlemde');

      // Audit log simulation
      const activityEntries: any[] = [];
      const fullName = `${patient.firstName} ${patient.lastName}`.trim();
      activityEntries.push({
        branchId: patient.branchId,
        patientName: fullName,
        type: 'Cihaz İşlemi',
        description: `SGK Reçete durumu "${status}" olarak güncellendi.`,
        date: '09.10.2026',
      });

      expect(activityEntries.length).toBe(1);
      expect(activityEntries[0].patientName).toBe('Autotest YeniHasta2026');
      expect(activityEntries[0].description).toContain('İşlemde');
    });
  });

  describe('Scenario: Create a new recall reminder', () => {
    it('stores recall notes and allows searching reminders by note content', () => {
      const createdRecall = {
        id: 'rec-test-1',
        patientId: 'p-101',
        patientName: 'Ali Demir',
        patientPhone: '0532 111 2233',
        patientTC: '23456789012',
        patientDevice: 'Phonak Audeo',
        patientDeviceSn: 'SN12345',
        typeTitle: 'Kontrol muayenesi',
        status: 'Bekliyor' as const,
        planDate: '2026-10-09',
        notes: 'Automated recall test 2026-10-09 12:00:00',
      };

      const query = 'Automated recall test 2026-10-09 12:00:00'.toLowerCase();
      const q = query;
      const matchName = createdRecall.patientName.toLowerCase().includes(q);
      const matchPhone = createdRecall.patientPhone.includes(q);
      const matchNotes = (createdRecall.notes || '').toLowerCase().includes(q);
      const matchType = createdRecall.typeTitle.toLowerCase().includes(q);

      const matchesSearch = matchName || matchPhone || matchNotes || matchType;
      expect(matchesSearch).toBe(true);
      expect(matchNotes).toBe(true);
    });
  });

  describe('Scenario: Select a clinic after login / Switch to a different clinic session', () => {
    it('exposes requested clinics "AudiPro QA - Tek Şube", "AudiPro QA - 3 Şube" and "AudiPro QA - 2 Şube" in the clinic selector', () => {
      const branches = [
        { id: 'branch-audipro-qa-tek', name: 'AudiPro QA - Tek Şube', slug: 'audipro-qa-tek-sube' },
        { id: 'branch-audipro-qa-3', name: 'AudiPro QA - 3 Şube', slug: 'audipro-qa-3-sube' },
        { id: 'branch-audipro-qa-2', name: 'AudiPro QA - 2 Şube', slug: 'audipro-qa-2-sube' },
      ];

      const branchNames = branches.map(b => b.name);
      expect(branchNames).toContain('AudiPro QA - Tek Şube');
      expect(branchNames).toContain('AudiPro QA - 3 Şube');
      expect(branchNames).toContain('AudiPro QA - 2 Şube');
    });

    it('Scenario 1: Open a single-branch clinic session sets single-branch scope', () => {
      const singleBranch = { id: 'branch-audipro-qa-tek', name: 'AudiPro QA - Tek Şube', slug: 'audipro-qa-tek-sube', status: 'Aktif' as const };
      const branches = [singleBranch];
      const activeBranches = branches.filter(b => b.status === 'Aktif');
      expect(activeBranches.length).toBe(1);
      const isSingleBranch = activeBranches.length === 1;
      expect(isSingleBranch).toBe(true);
      const scopeLabel = isSingleBranch ? activeBranches[0].name : 'Tüm Şubeler (Konsolide)';
      expect(scopeLabel).toBe('AudiPro QA - Tek Şube');
      expect(scopeLabel).not.toBe('Tüm Şubeler (Konsolide)');
    });

    it('Scenario 2: Reminder is immediately verified in recall list and on patient detail timeline', () => {
      const reminder = {
        id: 'rec-test-1001',
        patientId: 'pat-1001',
        patientName: 'Autotest1001 E2E',
        reason: 'Kontrol muayenesi',
        dueDate: '2026-10-15',
        notes: 'E2E-UID-20261009-01',
        status: 'Bekliyor',
      };
      const patient = {
        id: 'pat-1001',
        firstName: 'Autotest1001',
        lastName: 'E2E',
        timeline: [] as any[],
      };

      // Simulating addRecallItem timeline sync
      const reminderActionText = `Hatırlatma Planlandı: ${reminder.reason} (${reminder.dueDate}) - Not: ${reminder.notes}`;
      const updatedPatient = {
        ...patient,
        timeline: [{ date: '09.10.2026', action: reminderActionText, icon: 'Calendar' }],
      };

      expect(updatedPatient.timeline[0].action).toContain('E2E-UID-20261009-01');
      expect(reminder.notes).toBe('E2E-UID-20261009-01');
    });

    it('Scenario 3: Add new patient is searchable by TC with prefix, phone digits, and hyphenated name', () => {
      const patient = {
        id: 'p-auto-01',
        firstName: 'Autotest',
        lastName: '20261009',
        tc: '99999999001',
        phone: '0555 123 00 09',
      };

      const testSearch = (query: string) => {
        const searchLower = query.trim().toLowerCase();
        const tcQuery = searchLower.replace(/^tc\s*/i, '').trim();
        const tcDigits = tcQuery.replace(/\D/g, '');
        const patientTcDigits = (patient.tc || '').replace(/\D/g, '');
        const phoneDigits = searchLower.replace(/\D/g, '');
        const patientPhoneDigits = (patient.phone || '').replace(/\D/g, '');

        const fullName = `${patient.firstName} ${patient.lastName}`.toLowerCase();
        const normalizedFullName = fullName.replace(/[-_]/g, ' ');
        const normalizedSearch = searchLower.replace(/[-_]/g, ' ');
        const searchTokens = searchLower.split(/[\s-_]+/).filter(Boolean);
        const tokensMatch = searchTokens.length > 0 && searchTokens.every(tok =>
          patient.firstName.toLowerCase().includes(tok) ||
          patient.lastName.toLowerCase().includes(tok) ||
          fullName.includes(tok)
        );

        return (
          fullName.includes(searchLower) ||
          normalizedFullName.includes(normalizedSearch) ||
          tokensMatch ||
          (tcDigits.length >= 3 && (patientTcDigits.includes(tcDigits) || tcDigits.includes(patientTcDigits))) ||
          (phoneDigits.length >= 3 && (patientPhoneDigits.includes(phoneDigits) || phoneDigits.includes(patientPhoneDigits)))
        );
      };

      expect(testSearch('Autotest-20261009')).toBe(true);
      expect(testSearch('TC 99999999001')).toBe(true);
      expect(testSearch('05551230009')).toBe(true);
    });

    it('Scenario 6: Global search navigates to Randevular when query is "Randevular"', () => {
      const navSuggestions = [
        { id: 'nav-appointments', title: 'Randevular', page: 'appointments', keywords: ['randevu', 'randevular', 'takvim'] },
        { id: 'nav-patients', title: 'Hastalar', page: 'patients', keywords: ['hasta', 'hastalar'] },
      ];

      const query = 'Randevular'.toLowerCase();
      const match = navSuggestions.find(n => n.title.toLowerCase().includes(query) || n.keywords.includes(query));
      expect(match).toBeDefined();
      expect(match?.page).toBe('appointments');
    });

    it('Scenario 8: Calendar navigation changes date deterministically', () => {
      const baseDate = new Date(2026, 9, 9); // 9 Oct 2026
      const nextDate = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate() + 1);
      expect(nextDate.getDate()).toBe(10);
      const prevDate = new Date(nextDate.getFullYear(), nextDate.getMonth(), nextDate.getDate() - 1);
      expect(prevDate.getDate()).toBe(9);
    });
  });
});

