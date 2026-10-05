-- Hide the explicitly synthetic QA branches while preserving their records and
-- all patient, appointment, sales, and audit relationships for recovery/history.
ALTER TABLE public.branches
  ADD COLUMN IF NOT EXISTS archived_at timestamptz DEFAULT NULL;

ALTER TABLE public.branch_transfers
  ADD COLUMN IF NOT EXISTS archived_at timestamptz DEFAULT NULL;

UPDATE public.branch_transfers AS transfer
SET archived_at = now()
WHERE transfer.archived_at IS NULL
  AND EXISTS (
    SELECT 1
    FROM public.branches AS source_branch
    JOIN public.branches AS target_branch
      ON target_branch.organization_id = source_branch.organization_id
    WHERE source_branch.id = transfer.source_branch_id
      AND target_branch.id = transfer.target_branch_id
      AND source_branch.organization_id = transfer.organization_id
      AND target_branch.organization_id = transfer.organization_id
      AND source_branch.name IN ('Test Şube 1', 'Test Şube 2', 'Test Şube 3')
      AND target_branch.name IN ('Test Şube 1', 'Test Şube 2', 'Test Şube 3')
  );

UPDATE public.branches
SET archived_at = now()
WHERE name IN ('Test Şube 1', 'Test Şube 2', 'Test Şube 3')
  AND archived_at IS NULL;
