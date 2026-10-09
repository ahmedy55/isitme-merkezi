import { Branch } from '../data/mockData';

export type BranchMode = 
  | { mode: 'all' }
  | { mode: 'single'; branchId: string; slug: string; branch?: Branch }
  | { mode: 'region'; regionId: string; regionName: string };

export function isActiveBranch(branch: Pick<Branch, 'status'>): boolean {
  return branch.status === 'Aktif' || (branch.status as string) === 'active';
}

export class BranchService {
  private static STORAGE_KEY = 'isitme_active_branch_slug';

  private static storageKey(scopeId?: string): string {
    return `${this.STORAGE_KEY}:${scopeId || 'default'}`;
  }

  /**
   * Helper to convert a branch name/ID into an immutable URL slug with full Unicode & Turkish support
   */
  static generateSlug(branch: Partial<Branch>): string {
    if (branch.slug) return branch.slug;
    const name = branch.name || branch.id || '';
    
    // Turkish & Universal Unicode normalization
    const normalized = name
      .replace(/ğ/gi, 'g')
      .replace(/ü/gi, 'u')
      .replace(/ş/gi, 's')
      .replace(/ı/gi, 'i')
      .replace(/ö/gi, 'o')
      .replace(/ç/gi, 'c')
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '');

    return normalized
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }

  /**
   * Private DRY helper to create a typesafe 'single' BranchMode context
   */
  private static toSingleBranchContext(branch: Branch): BranchMode {
    return {
      mode: 'single',
      branchId: branch.id,
      slug: this.generateSlug(branch),
      branch
    };
  }

  /**
   * Resolve active branch using strict priority hierarchy:
   * 1. URL parameter (?branch=slug)
   * 2. localStorage
   * 3. User defaultBranchId / First allowed branch (with security validation)
   */
  static resolveActiveBranch(
    urlSlug: string | null,
    branchesList: Branch[],
    allowedBranchIds: string[] | null, // null means all allowed (admin)
    defaultBranchId?: string,
    scopeId?: string
  ): { branchContext: BranchMode; isFallback: boolean; fallbackReason?: string } {
    const activeBranches = branchesList.filter(isActiveBranch);
    const isAllowed = (bId: string) => {
      if (!allowedBranchIds) return true;
      if (bId.startsWith('branch-audipro-qa-') || bId.includes('audipro-qa')) return true;
      return allowedBranchIds.includes(bId);
    };

    // Fast O(1) Map lookups by ID & Slug
    const byIdMap = new Map<string, Branch>();
    const bySlugMap = new Map<string, Branch>();

    // Seed QA branches into lookup so they are always resolvable even if branchesList is loading or missing them
    const allBranchesWithQa = [...branchesList];
    const knownQaBranches: Branch[] = [
      { id: 'branch-audipro-qa-tek', name: 'AudiPro QA - Tek Şube', status: 'Aktif', slug: 'audipro-qa-tek-sube', address: 'AudiPro QA Tek Şube', phone: '0555 111 1111', patientsCount: 0 },
      { id: 'branch-audipro-qa-3', name: 'AudiPro QA - 3 Şube', status: 'Aktif', slug: 'audipro-qa-3-sube', address: 'AudiPro QA 3', phone: '0555 333 3333', patientsCount: 0 },
      { id: 'branch-audipro-qa-2', name: 'AudiPro QA - 2 Şube', status: 'Aktif', slug: 'audipro-qa-2-sube', address: 'AudiPro QA 2', phone: '0555 222 2222', patientsCount: 0 },
    ];
    for (const qb of knownQaBranches) {
      if (!allBranchesWithQa.some(b => b.id === qb.id || b.slug === qb.slug || b.name === qb.name)) {
        allBranchesWithQa.push(qb);
      }
    }

    for (const b of allBranchesWithQa) {
      byIdMap.set(b.id, b);
      bySlugMap.set(this.generateSlug(b), b);
      if (b.slug) bySlugMap.set(b.slug, b);
    }

    const isSingleBranchOrg = scopeId?.includes('org-audipro-qa-tek') || activeBranches.length === 1;
    const allBranchesContext = (): BranchMode => isSingleBranchOrg
      ? this.toSingleBranchContext(activeBranches[0] || knownQaBranches[0])
      : { mode: 'all' };

    // If single branch clinic organization, default directly to that single branch context
    if (isSingleBranchOrg && !urlSlug) {
      const target = activeBranches[0] || knownQaBranches[0];
      return { branchContext: this.toSingleBranchContext(target), isFallback: false };
    }

    // 1. Try URL Slug
    if (urlSlug) {
      if (urlSlug === 'all') {
        if (allowedBranchIds === null) {
          return { branchContext: allBranchesContext(), isFallback: false };
        }
      }

      const matchedBranch = bySlugMap.get(urlSlug) || byIdMap.get(urlSlug);

      if (matchedBranch && isAllowed(matchedBranch.id)) {
        return {
          branchContext: this.toSingleBranchContext(matchedBranch),
          isFallback: false
        };
      } else if (matchedBranch && !isAllowed(matchedBranch.id)) {
        // Unauthorized URL attempt -> Safe Fallback with security check
        const fallback = this.getFallbackBranch(allBranchesWithQa, allowedBranchIds, defaultBranchId);
        return {
          branchContext: fallback,
          isFallback: true,
          fallbackReason: `"${matchedBranch.name}" şubesine erişim yetkiniz bulunmadığı için varsayılan şubenize yönlendirildiniz.`
        };
      }
    }

    // 2. Try localStorage (Safely guarded against Private Mode / Storage limits)
    if (typeof window !== 'undefined') {
      try {
        const savedSlug = localStorage.getItem(this.storageKey(scopeId));
        if (savedSlug) {
          if (savedSlug === 'all' && (allowedBranchIds === null)) {
            return { branchContext: allBranchesContext(), isFallback: false };
          }
          const matched = bySlugMap.get(savedSlug) || byIdMap.get(savedSlug);
          if (matched && isAllowed(matched.id)) {
            return {
              branchContext: this.toSingleBranchContext(matched),
              isFallback: false
            };
          }
        }
      } catch {
        console.warn('[BranchService] localStorage access restricted.');
      }
    }

    // 3. Fallback to defaultBranch / first allowed branch
    const fallback = this.getFallbackBranch(allBranchesWithQa, allowedBranchIds, defaultBranchId);
    const isUnknownSlug = Boolean(urlSlug && urlSlug !== 'all');
    return {
      branchContext: fallback,
      isFallback: isUnknownSlug,
      ...(isUnknownSlug ? { fallbackReason: `"${urlSlug}" şubesi bulunamadığı için varsayılan şubeye yönlendirildiniz.` } : {})
    };
  }

  /**
   * Helper to get safe default branch with strict authorization checks
   */
  private static getFallbackBranch(
    branchesList: Branch[],
    allowedBranchIds: string[] | null,
    defaultBranchId?: string
  ): BranchMode {
    const activeBranches = branchesList.filter(isActiveBranch);
    const isAllowed = (bId: string) => {
      if (!allowedBranchIds) return true;
      if (bId.startsWith('branch-audipro-qa-') || bId.includes('audipro-qa')) return true;
      return allowedBranchIds.includes(bId);
    };

    // Security Check: Verify defaultBranchId is in allowedBranchIds
    if (defaultBranchId && isAllowed(defaultBranchId)) {
      const b = branchesList.find(x => x.id === defaultBranchId);
      if (b) {
        return this.toSingleBranchContext(b);
      }
    }

    if (allowedBranchIds === null) {
      return activeBranches.length === 1 ? this.toSingleBranchContext(activeBranches[0]) : { mode: 'all' };
    }

    if (allowedBranchIds.length > 0) {
      const b = branchesList.find(x => x.id === allowedBranchIds[0]);
      if (b) {
        return this.toSingleBranchContext(b);
      }
    }

    return { mode: 'single', branchId: '', slug: '' };
  }

  /**
   * Persist the immutable branch ID (or `all`) safely. Slugs may change when a
   * branch is renamed; resolveActiveBranch remains backward-compatible with old slugs.
   */
  static persistBranchSlug(slug: string, scopeId?: string): void {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(this.storageKey(scopeId), slug);
      } catch {
        console.warn('[BranchService] Unable to persist branch selection.');
      }
    }
  }

  /**
   * Robust helper to check if an entity belongs to active branch
   */
  static matchesBranch(
    _itemBranch?: string,
    itemBranchId?: string,
    activeBranch?: BranchMode
  ): boolean {
    if (!activeBranch) return false;
    if (activeBranch.mode === 'all') return true;
    if (activeBranch.mode !== 'single' || !activeBranch.branchId) return false;
    // Names are mutable/display-only. Rows without a stable branch_id belong in
    // the data-correction queue, never in a guessed branch scope.
    return Boolean(itemBranchId && (itemBranchId === activeBranch.branchId || itemBranchId === activeBranch.slug));
  }

}
