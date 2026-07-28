import { Branch } from '../data/mockData';

export type BranchMode = 
  | { mode: 'all' }
  | { mode: 'single'; branchId: string; slug: string; branch?: Branch }
  | { mode: 'region'; regionId: string; regionName: string };

export class BranchService {
  private static STORAGE_KEY = 'isitme_active_branch_slug';

  /**
   * Helper to convert a branch name/ID into an immutable URL slug
   */
  static generateSlug(branch: Partial<Branch>): string {
    if (branch.slug) return branch.slug;
    const name = branch.name || branch.id || '';
    return name
      .toLowerCase()
      .replace(/ğ/g, 'g')
      .replace(/ü/g, 'u')
      .replace(/ş/g, 's')
      .replace(/ı/g, 'i')
      .replace(/ö/g, 'o')
      .replace(/ç/g, 'c')
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }

  /**
   * Resolve active branch using the strict hierarchy:
   * 1. URL parameter (?branch=slug)
   * 2. localStorage
   * 3. User defaultBranchId / First allowed branch
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

    // 1. Try URL Slug
    if (urlSlug) {
      if (urlSlug === 'all') {
        if (!allowedBranchIds || allowedBranchIds.length > 1) {
          return { branchContext: { mode: 'all' }, isFallback: false };
        }
      }
      
      const matchedBranch = branchesList.find(b => this.generateSlug(b) === urlSlug || b.id === urlSlug);
      if (matchedBranch && isAllowed(matchedBranch.id)) {
        return {
          branchContext: {
            mode: 'single',
            branchId: matchedBranch.id,
            slug: this.generateSlug(matchedBranch),
            branch: matchedBranch
          },
          isFallback: false
        };
      } else if (matchedBranch && !isAllowed(matchedBranch.id)) {
        // Unauthorized URL attempt -> Fallback
        const fallback = this.getFallbackBranch(branchesList, allowedBranchIds, defaultBranchId);
        return {
          branchContext: fallback,
          isFallback: true,
          fallbackReason: `"${matchedBranch.name}" şubesine erişim yetkiniz bulunmadığı için varsayılan şubenize yönlendirildiniz.`
        };
      }
    }

    // 2. Try localStorage
    if (typeof window !== 'undefined') {
      const savedSlug = localStorage.getItem(this.STORAGE_KEY);
      if (savedSlug) {
        if (savedSlug === 'all' && (!allowedBranchIds || allowedBranchIds.length > 1)) {
          return { branchContext: { mode: 'all' }, isFallback: false };
        }
        const matched = branchesList.find(b => this.generateSlug(b) === savedSlug || b.id === savedSlug);
        if (matched && isAllowed(matched.id)) {
          return {
            branchContext: {
              mode: 'single',
              branchId: matched.id,
              slug: this.generateSlug(matched),
              branch: matched
            },
            isFallback: false
          };
        }
      }
    }

    // 3. Fallback to defaultBranch / first allowed branch
    const fallback = this.getFallbackBranch(branchesList, allowedBranchIds, defaultBranchId);
    return { branchContext: fallback, isFallback: false };
  }

  /**
   * Helper to get safe default branch
   */
  private static getFallbackBranch(
    branchesList: Branch[],
    allowedBranchIds: string[] | null,
    defaultBranchId?: string
  ): BranchMode {
    if (defaultBranchId) {
      const b = branchesList.find(x => x.id === defaultBranchId);
      if (b) {
        return {
          mode: 'single',
          branchId: b.id,
          slug: this.generateSlug(b),
          branch: b
        };
      }
    }

    if (!allowedBranchIds || allowedBranchIds.length > 1) {
      return { mode: 'all' };
    }

    if (allowedBranchIds.length > 0) {
      const b = branchesList.find(x => x.id === allowedBranchIds[0]);
      if (b) {
        return {
          mode: 'single',
          branchId: b.id,
          slug: this.generateSlug(b),
          branch: b
        };
      }
    }

    return { mode: 'all' };
  }

  /**
   * Persist slug to localStorage
   */
  static persistBranchSlug(slug: string): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(this.STORAGE_KEY, slug);
    }
  }
}
