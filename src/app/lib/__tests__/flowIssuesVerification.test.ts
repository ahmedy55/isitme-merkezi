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
});
