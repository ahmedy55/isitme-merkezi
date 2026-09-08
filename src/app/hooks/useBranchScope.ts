'use client';

import { useCallback } from 'react';
import { useBranch } from '../context/BranchContext';
import { BranchService } from '../services/BranchService';

export function useBranchScope() {
  const { activeBranch } = useBranch();

  const matches = useCallback((branchName?: string | null, branchId?: string | null) =>
    BranchService.matchesBranch(branchName || undefined, branchId || undefined, activeBranch), [activeBranch]);

  return {
    activeBranch,
    activeBranchId: activeBranch.mode === 'single' ? activeBranch.branchId : undefined,
    activeBranchName: activeBranch.mode === 'single' ? activeBranch.branch?.name : undefined,
    matches,
  };
}
