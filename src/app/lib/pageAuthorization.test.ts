import { describe, expect, it } from 'vitest';
import { canAccessPage } from './pageAuthorization';

describe('page authorization', () => {
  it('denies finance and management pages to an audiometrist', () => {
    for (const page of ['cash', 'expenses', 'reports', 'sgk-receivables', 'assets', 'branches', 'settings', 'suppliers', 'audit-log']) {
      expect(canAccessPage(page, ['Odyometrist'])).toBe(false);
    }
  });

  it('allows finance pages to accounting staff but not management pages', () => {
    expect(canAccessPage('cash', ['Muhasebe'])).toBe(true);
    expect(canAccessPage('reports', ['Muhasebe'])).toBe(true);
    expect(canAccessPage('settings', ['Muhasebe'])).toBe(false);
  });

  it('allows company managers and leaves clinical pages available to clinical roles', () => {
    expect(canAccessPage('settings', ['Firma Yöneticisi'])).toBe(true);
    expect(canAccessPage('cash', ['Firma Yöneticisi'])).toBe(true);
    expect(canAccessPage('patients', ['Odyometrist'])).toBe(true);
  });
});
