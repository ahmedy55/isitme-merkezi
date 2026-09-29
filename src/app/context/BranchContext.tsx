'use client';

import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import { Branch } from '../data/mockData';
import { BranchMode, BranchService } from '../services/BranchService';
import { AuditService } from '../services/AuditService';

interface BranchContextType {
  activeBranch: BranchMode;
  setActiveBranch: (mode: BranchMode) => void;
  selectBranchBySlug: (slug: string) => void;
  isLoadingBranch: boolean;
  allowedBranches: string[] | null; // null = all
  isFallbackRedirected: boolean;
  fallbackMessage: string | null;
  clearFallbackMessage: () => void;
}

const BranchContext = createContext<BranchContextType | undefined>(undefined);

export function BranchProvider({
  children,
  branchesList = [],
  currentUser,
  currentOrgId
}: {
  children: ReactNode;
  branchesList?: Branch[];
  currentUser?: any;
  currentOrgId?: string | null;
}) {
  const [activeBranch, setActiveBranchState] = useState<BranchMode>(() => currentUser?.membership?.branch_id
    ? { mode: 'single', branchId: currentUser.membership.branch_id, slug: currentUser.membership.branch_id }
    : { mode: 'all' });
  const [isLoadingBranch, setIsLoadingBranch] = useState<boolean>(false);
  const [isFallbackRedirected, setIsFallbackRedirected] = useState<boolean>(false);
  const [fallbackMessage, setFallbackMessage] = useState<string | null>(null);

  // Extract allowed branches from user metadata
  const allowedBranches: string[] | null = useMemo(() => currentUser?.membership?.roles?.includes('Firma Yöneticisi')
    ? null
    : currentUser?.membership?.branch_id ? [currentUser.membership.branch_id] : [], [currentUser]);
  const defaultBranchId: string | undefined = currentUser?.membership?.branch_id;

  const scopeId = `${currentOrgId || 'no-org'}:${currentUser?.id || 'anonymous'}`;

  // Resolve active branch whenever tenant data or browser history changes.
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const resolve = () => {
      const urlSlug = new URLSearchParams(window.location.search).get('branch');
      const result = BranchService.resolveActiveBranch(urlSlug, branchesList, allowedBranches, defaultBranchId, scopeId);
      setActiveBranchState(result.branchContext);
      if (result.branchContext.mode === 'single') BranchService.persistBranchSlug(result.branchContext.branchId, scopeId);
      else if (result.branchContext.mode === 'all') BranchService.persistBranchSlug('all', scopeId);
      setIsFallbackRedirected(result.isFallback);
      setFallbackMessage(result.isFallback ? result.fallbackReason || null : null);
    };
    resolve();
    window.addEventListener('popstate', resolve);
    return () => window.removeEventListener('popstate', resolve);
  }, [branchesList, currentUser, currentOrgId, scopeId, allowedBranches, defaultBranchId]);

  const selectBranchBySlug = (slug: string) => {
    setIsLoadingBranch(true);
    const prevSlug = activeBranch.mode === 'single' ? activeBranch.slug : 'all';

    if (slug === 'all' && allowedBranches !== null) { setIsLoadingBranch(false); return; }
    if (slug === 'all') {
      const newMode: BranchMode = { mode: 'all' };
      setActiveBranchState(newMode);
      BranchService.persistBranchSlug('all', scopeId);
      updateUrlQuery('all');

      AuditService.logBranchChange(currentUser?.id, currentOrgId, prevSlug, 'all');

      setTimeout(() => setIsLoadingBranch(false), 250);
      return;
    }

    const targetBranch = branchesList.find(b => BranchService.generateSlug(b) === slug || b.id === slug);
    if (targetBranch && (allowedBranches === null || allowedBranches.includes(targetBranch.id))) {
      const targetSlug = BranchService.generateSlug(targetBranch);
      const newMode: BranchMode = {
        mode: 'single',
        branchId: targetBranch.id,
        slug: targetSlug,
        branch: targetBranch
      };
      setActiveBranchState(newMode);
      BranchService.persistBranchSlug(targetBranch.id, scopeId);
      updateUrlQuery(targetSlug);

      AuditService.logBranchChange(currentUser?.id, currentOrgId, prevSlug, targetSlug);
    }

    setTimeout(() => setIsLoadingBranch(false), 250);
  };

  const updateUrlQuery = (slug: string) => {
    if (typeof window === 'undefined') return;
    const url = new URL(window.location.href);
    if (slug === 'all') {
      url.searchParams.delete('branch');
    } else {
      url.searchParams.set('branch', slug);
    }
    window.history.pushState({}, '', url.toString());
  };

  const clearFallbackMessage = () => {
    setFallbackMessage(null);
    setIsFallbackRedirected(false);
  };

  return (
    <BranchContext.Provider
      value={{
        activeBranch,
        setActiveBranch: (mode) => {
          if (mode.mode === 'all') {
            selectBranchBySlug('all');
          } else if (mode.mode === 'single') {
            selectBranchBySlug(mode.slug);
          }
        },
        selectBranchBySlug,
        isLoadingBranch,
        allowedBranches,
        isFallbackRedirected,
        fallbackMessage,
        clearFallbackMessage
      }}
    >
      {children}
    </BranchContext.Provider>
  );
}

export function useBranch() {
  const context = useContext(BranchContext);
  if (!context) {
    throw new Error('useBranch must be used within a BranchProvider');
  }
  return context;
}
