import { Branch } from '../data/mockData';

export type BranchMode = 
  | { mode: 'all' }
  | { mode: 'single'; branchId: string; slug: string; branch?: Branch }
  | { mode: 'region'; regionId: string; regionName: string };

export class BranchService {
  private static STORAGE_KEY = 'isitme_active_branch_slug';

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
    defaultBranchId?: string
  ): { branchContext: BranchMode; isFallback: boolean; fallbackReason?: string } {
    const isAllowed = (bId: string) => {
      if (!allowedBranchIds) return true;
      return allowedBranchIds.includes(bId);
    };

    // Fast O(1) Map lookups by ID & Slug
    const byIdMap = new Map<string, Branch>();
    const bySlugMap = new Map<string, Branch>();

    for (const b of branchesList) {
      byIdMap.set(b.id, b);
      bySlugMap.set(this.generateSlug(b), b);
      if (b.slug) bySlugMap.set(b.slug, b);
    }

    // 1. Try URL Slug
    if (urlSlug) {
      if (urlSlug === 'all') {
        if (!allowedBranchIds || allowedBranchIds.length > 1) {
          return { branchContext: { mode: 'all' }, isFallback: false };
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
        const fallback = this.getFallbackBranch(branchesList, allowedBranchIds, defaultBranchId);
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
        const savedSlug = localStorage.getItem(this.STORAGE_KEY);
        if (savedSlug) {
          if (savedSlug === 'all' && (!allowedBranchIds || allowedBranchIds.length > 1)) {
            return { branchContext: { mode: 'all' }, isFallback: false };
          }
          const matched = bySlugMap.get(savedSlug) || byIdMap.get(savedSlug);
          if (matched && isAllowed(matched.id)) {
            return {
              branchContext: this.toSingleBranchContext(matched),
              isFallback: false
            };
          }
        }
      } catch (err) {
        console.warn('[BranchService] localStorage access restricted:', err);
      }
    }

    // 3. Fallback to defaultBranch / first allowed branch
    const fallback = this.getFallbackBranch(branchesList, allowedBranchIds, defaultBranchId);
    return { branchContext: fallback, isFallback: false };
  }

  /**
   * Helper to get safe default branch with strict authorization checks
   */
  private static getFallbackBranch(
    branchesList: Branch[],
    allowedBranchIds: string[] | null,
    defaultBranchId?: string
  ): BranchMode {
    const isAllowed = (bId: string) => {
      if (!allowedBranchIds) return true;
      return allowedBranchIds.includes(bId);
    };

    // Security Check: Verify defaultBranchId is in allowedBranchIds
    if (defaultBranchId && isAllowed(defaultBranchId)) {
      const b = branchesList.find(x => x.id === defaultBranchId);
      if (b) {
        return this.toSingleBranchContext(b);
      }
    }

    if (!allowedBranchIds || allowedBranchIds.length > 1) {
      return { mode: 'all' };
    }

    if (allowedBranchIds.length > 0) {
      const b = branchesList.find(x => x.id === allowedBranchIds[0]);
      if (b) {
        return this.toSingleBranchContext(b);
      }
    }

    return { mode: 'all' };
  }

  /**
   * Persist slug to localStorage safely
   */
  static persistBranchSlug(slug: string): void {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(this.STORAGE_KEY, slug);
      } catch (err) {
        console.warn('[BranchService] Unable to persist branch slug to localStorage:', err);
      }
    }
  }

  /**
   * Robust helper to check if an entity belongs to active branch
   */
  static matchesBranch(
    itemBranch?: string,
    itemBranchId?: string,
    activeBranch?: BranchMode,
    fallbackIndex?: number
  ): boolean {
    if (!activeBranch || activeBranch.mode !== 'single') return true;

    if (activeBranch.branchId && itemBranchId) {
      return itemBranchId === activeBranch.branchId;
    }

    const branchName = activeBranch.branch?.name || '';
    const activeSlug = activeBranch.slug || (activeBranch.branch ? this.generateSlug(activeBranch.branch) : '');

    const isKadikoy = activeBranch.branchId === 'br-1' || activeSlug.includes('kadikoy') || branchName.toLowerCase().includes('kadıköy');
    const isBesiktas = activeBranch.branchId === 'br-2' || activeSlug.includes('besiktas') || branchName.toLowerCase().includes('beşiktaş');
    const isIzmir = activeBranch.branchId === 'br-3' || activeSlug.includes('izmir') || branchName.toLowerCase().includes('izmir');

    if (itemBranch) {
      const itemLower = itemBranch.toLowerCase();
      const itemSlug = this.generateSlug({ name: itemBranch });

      if (isKadikoy) {
        return itemLower.includes('kadıköy') || itemLower.includes('kadikoy') || itemLower.includes('merkez 1') || itemSlug.includes('kadikoy');
      }
      if (isBesiktas) {
        return itemLower.includes('beşiktaş') || itemLower.includes('besiktas') || itemLower.includes('merkez 2') || itemSlug.includes('besiktas');
      }
      if (isIzmir) {
        return itemLower.includes('izmir') || itemSlug.includes('izmir');
      }

      if (branchName && (itemLower.includes(branchName.toLowerCase()) || branchName.toLowerCase().includes(itemLower))) return true;
      if (activeSlug && itemSlug.includes(activeSlug)) return true;

      return false;
    }

    if (typeof fallbackIndex === 'number') {
      if (isKadikoy) return fallbackIndex % 2 === 0;
      if (isBesiktas) return fallbackIndex % 2 !== 0;
      if (isIzmir) return fallbackIndex % 3 === 0;
    }

    return true;
  }
}
