import { describe, it, expect } from 'vitest';
import { BranchService } from '../BranchService';
import { Branch } from '../../data/mockData';

describe('BranchService Production Architecture', () => {
  const mockBranches: Branch[] = [
    {
      id: 'br-1',
      name: 'Merkez 1 - Kadıköy',
      slug: 'merkez-1-kadikoy',
      address: 'Kadıköy',
      phone: '0216 111 22 33',
      city: 'İstanbul',
      status: 'Aktif',
      patientsCount: 25
    },
    {
      id: 'br-2',
      name: 'Merkez 2 - Beşiktaş',
      slug: 'merkez-2-besiktas',
      address: 'Beşiktaş',
      phone: '0212 222 33 44',
      city: 'İstanbul',
      status: 'Aktif',
      patientsCount: 15
    }
  ];

  it('generateSlug should correctly convert Turkish & Unicode characters', () => {
    const slug = BranchService.generateSlug({ name: 'İstanbul Şişli & Çankaya Mağazası' });
    expect(slug).toBe('istanbul-sisli-cankaya-magazasi');
  });

  it('resolveActiveBranch should resolve valid URL slug', () => {
    const result = BranchService.resolveActiveBranch('merkez-1-kadikoy', mockBranches, null);
    expect(result.isFallback).toBe(false);
    expect(result.branchContext.mode).toBe('single');
    if (result.branchContext.mode === 'single') {
      expect(result.branchContext.branchId).toBe('br-1');
    }
  });

  it('resolveActiveBranch should fallback and return warning when user accesses unauthorized URL branch', () => {
    // User only has access to br-2 (Beşiktaş), but tries to access br-1 (Kadıköy) via URL
    const result = BranchService.resolveActiveBranch('merkez-1-kadikoy', mockBranches, ['br-2'], 'br-2');
    expect(result.isFallback).toBe(true);
    expect(result.fallbackReason).toContain('erişim yetkiniz bulunmadığı için');
    if (result.branchContext.mode === 'single') {
      expect(result.branchContext.branchId).toBe('br-2');
    }
  });

  it('getFallbackBranch should NOT return defaultBranchId if it is NOT in allowedBranchIds', () => {
    // defaultBranchId is set to br-1, but allowedBranchIds only includes br-2
    const result = BranchService.resolveActiveBranch(null, mockBranches, ['br-2'], 'br-1');
    if (result.branchContext.mode === 'single') {
      expect(result.branchContext.branchId).toBe('br-2');
    }
  });
});
