-- Remove only the QA expense explicitly labelled as test data in the UI.
-- Preserve the expense row as archived history, but remove its synthetic
-- expense and reversal ledger rows so they no longer affect cash totals.
BEGIN;

UPDATE public.expenses AS e
SET deleted_at = now()
FROM public.branches AS b
WHERE b.id = e.branch_id
  AND b.organization_id = e.organization_id
  AND b.name = 'Test Şube 1'
  AND e.description = 'QA test gideri'
  AND e.category = 'Kira'
  AND e.amount = 1000
  AND e.date = DATE '2026-09-29'
  AND e.notes = 'Kira ödemesi makbuzu işlendi.'
  AND e.deleted_at IS NULL;

DELETE FROM public.cash_transactions AS ct
USING public.expenses AS e, public.branches AS b
WHERE b.id = e.branch_id
  AND b.organization_id = e.organization_id
  AND b.name = 'Test Şube 1'
  AND e.description = 'QA test gideri'
  AND e.category = 'Kira'
  AND e.amount = 1000
  AND e.date = DATE '2026-09-29'
  AND e.notes = 'Kira ödemesi makbuzu işlendi.'
  AND e.deleted_at IS NOT NULL
  AND ct.organization_id = e.organization_id
  AND ct.branch_id = e.branch_id
  AND ct.reference_entity = 'expense'
  AND ct.reference_id = e.id::text
  AND ct.category = e.category
  AND ct.amount = e.amount
  AND ct.description IN (e.description, 'Gider düzeltmesi: ' || e.description);

COMMIT;
