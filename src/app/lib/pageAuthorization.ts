const managementPages = new Set([
  'branches',
  'settings',
  'suppliers',
  'audit-log',
  'branch-activities',
]);

const financialPages = new Set([
  'cash',
  'expenses',
  'reports',
  'sgk-receivables',
  'assets',
]);

const financialRoles = new Set(['Şube Yöneticisi', 'Muhasebe']);

export function canAccessPage(page: string, roles: readonly string[]): boolean {
  const isCompanyManager = roles.includes('Firma Yöneticisi');

  if (managementPages.has(page)) return isCompanyManager;
  if (financialPages.has(page)) {
    return isCompanyManager || roles.some(role => financialRoles.has(role));
  }
  return true;
}
