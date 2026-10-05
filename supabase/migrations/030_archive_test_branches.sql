-- Hide the explicitly synthetic QA branches while preserving their records and
-- all patient, appointment, sales, and audit relationships for recovery/history.
ALTER TABLE public.branches
  ADD COLUMN IF NOT EXISTS archived_at timestamptz DEFAULT NULL;

UPDATE public.branches
SET archived_at = now()
WHERE name IN ('Test Şube 1', 'Test Şube 2', 'Test Şube 3')
  AND archived_at IS NULL;
