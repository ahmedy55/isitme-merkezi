-- Archive the exact supplier fixture shown in the original supplier demo list.
-- Do not alter other suppliers that happen to share a similar company name.
BEGIN;

UPDATE public.suppliers
SET deleted_at = now()
WHERE company_name = 'Demo Medikal'
  AND contact_person = 'Ahmet Polat'
  AND phone = '0507 555 33 22'
  AND email = 'ahmet@demomedikal.com'
  AND tax_no = '1472583690'
  AND deleted_at IS NULL;

COMMIT;
