-- Archive the clearly synthetic sale shown in Kasa and remove its linked
-- cash receipt. Restore and archive the QA stock device, retaining history.
BEGIN;

CREATE TEMP TABLE qa_sale_to_archive ON COMMIT DROP AS
SELECT s.id AS sale_id, s.organization_id, s.branch_id, s.patient_id,
       si.stock_item_id, si.quantity AS sold_quantity
FROM public.sales AS s
JOIN public.patients AS p
  ON p.id = s.patient_id AND p.organization_id = s.organization_id
JOIN public.sale_items AS si
  ON si.sale_id = s.id AND si.organization_id = s.organization_id
JOIN public.stock_items AS st
  ON st.id = si.stock_item_id AND st.organization_id = si.organization_id
JOIN public.branches AS b
  ON b.id = s.branch_id AND b.organization_id = s.organization_id
WHERE b.name = 'Test Şube 1'
  AND btrim(concat_ws(' ', p.first_name, p.last_name)) = 'Test Hasta Üç'
  AND s.date = DATE '2026-09-29'
  AND s.total = 12500
  AND s.patient_amount = 12500
  AND s.payment_method = 'Nakit'
  AND s.status = 'Tahsil Edildi'
  AND s.deleted_at IS NULL
  AND si.name = 'QA İşitme Cihazı'
  AND si.quantity = 1
  AND si.price = 12500
  AND si.serial_no = 'QA-SN-3B-001'
  AND si.barcode = 'QA-BC-3B-001'
  AND st.name = 'QA İşitme Cihazı'
  AND st.serial_no = 'QA-SN-3B-001'
  AND st.barcode = 'QA-BC-3B-001'
  AND st.quantity = 0
  AND st.status = 'Satıldı'
  AND st.assigned_patient_id = p.id
  AND st.deleted_at IS NULL;

UPDATE public.sales AS s
SET deleted_at = now()
FROM qa_sale_to_archive AS q
WHERE s.id = q.sale_id AND s.organization_id = q.organization_id;

DELETE FROM public.cash_transactions AS ct
USING qa_sale_to_archive AS q
WHERE ct.organization_id = q.organization_id
  AND ct.branch_id = q.branch_id
  AND ct.reference_entity = 'sale'
  AND ct.reference_id = q.sale_id::text
  AND ct.type = 'INCOME'
  AND ct.category = 'Cihaz Satışı'
  AND ct.amount = 12500;

DELETE FROM public.stock_movements AS sm
USING qa_sale_to_archive AS q
WHERE sm.organization_id = q.organization_id
  AND sm.branch_id = q.branch_id
  AND sm.stock_item_id = q.stock_item_id
  AND sm.reference_entity = 'sale'
  AND sm.reference_id = q.sale_id::text
  AND sm.type = 'SALE'
  AND sm.quantity_change = -q.sold_quantity
  AND sm.unit_price = 12500;

UPDATE public.stock_items AS st
SET quantity = st.quantity + q.sold_quantity,
    status = 'Stokta',
    assigned_patient_id = NULL,
    deleted_at = now()
FROM qa_sale_to_archive AS q
WHERE st.id = q.stock_item_id
  AND st.organization_id = q.organization_id
  AND st.quantity = 0
  AND st.status = 'Satıldı'
  AND st.assigned_patient_id = q.patient_id
  AND st.deleted_at IS NULL;

COMMIT;
