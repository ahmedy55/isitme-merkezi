-- Archive only the synthetic fixed-asset row shown in the QA environment.
-- Keep the row and any maintenance/history references for auditability.
UPDATE public.assets AS a
SET archived_at = now()
WHERE a.name = 'QA Odyometre'
  AND a.serial_no = 'QA-ASSET-3B-001'
  AND a.purchase_price = 50000
  AND upper(btrim(a.notes)) = 'SENTETİK TEST'
  AND a.archived_at IS NULL
  AND EXISTS (
    SELECT 1
    FROM public.branches AS b
    WHERE b.id = a.branch_id
      AND b.organization_id = a.organization_id
      AND b.name = 'Test Şube 1'
  );
