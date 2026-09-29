import { describe, it, expect } from 'vitest';
import { BranchService } from '../BranchService';
import { Branch } from '../../data/mockData';

describe('BranchService Production Architecture', () => {
  it('empty branch permission never falls back to all', () => {
    const result=BranchService.resolveActiveBranch('all',[],[]);
    expect(result.branchContext.mode).toBe('single');
    expect(BranchService.matchesBranch(undefined,undefined,result.branchContext)).toBe(false);
  });
  it('single active branch owners resolve directly to that branch, even for all-branches URL state', () => {
    const branch = { ...mockBranches[0], status: 'Aktif' as const };
    const result = BranchService.resolveActiveBranch('all', [branch], null);
    expect(result.branchContext.mode).toBe('single');
    if (result.branchContext.mode === 'single') expect(result.branchContext.branchId).toBe(branch.id);
  });
  it('single-branch view rejects unassigned data and fuzzy demo names', () => {
    const context={mode:'single' as const,branchId:'a',slug:'kadikoy'};
    expect(BranchService.matchesBranch(undefined,undefined,context)).toBe(false);
    expect(BranchService.matchesBranch('Kadıköy', 'b',context)).toBe(false);
    expect(BranchService.matchesBranch(undefined,'a',context)).toBe(true);
    expect(BranchService.matchesBranch('Kadıköy', undefined, context)).toBe(false);
    expect(BranchService.matchesBranch('Kadıköy', 'a', context)).toBe(true);
  });
  it('branch scope follows immutable IDs, not duplicate or renamed display names', () => {
    const context = { mode: 'single' as const, branchId: 'br-1', slug: 'new-branch-name' };
    expect(BranchService.matchesBranch('Former name', 'br-1', context)).toBe(true);
    expect(BranchService.matchesBranch('New name', 'br-2', context)).toBe(false);
    expect(BranchService.matchesBranch('New name', undefined, context)).toBe(false);
  });
  it('all-branch scope includes every authorized row, including rows queued for correction', () => {
    expect(BranchService.matchesBranch(undefined, undefined, { mode: 'all' })).toBe(true);
    expect(BranchService.matchesBranch('Kadıköy', 'br-2', { mode: 'all' })).toBe(true);
  });
  const mockBranches: Branch[] = [
    {
      id: 'br-1',
      name: 'Merkez 1 - Kadıköy',
      slug: 'merkez-1-kadikoy',
      address: 'Kadıköy',
      phone: '0216 111 22 33',
      status: 'Aktif',
      patientsCount: 25
    },
    {
      id: 'br-2',
      name: 'Merkez 2 - Beşiktaş',
      slug: 'merkez-2-besiktas',
      address: 'Beşiktaş',
      phone: '0212 222 33 44',
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
