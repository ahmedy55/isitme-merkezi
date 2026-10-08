BEGIN;

-- 1. Ensure at least one completed SGK payment record exists for organizations with invoices
DO $$
DECLARE
  v_inv RECORD;
BEGIN
  FOR v_inv IN 
    SELECT i.id, i.organization_id, i.branch_id, i.amount, i.invoice_no
    FROM public.sgk_period_invoices i
    WHERE NOT EXISTS (
      SELECT 1 FROM public.sgk_payment_records p WHERE p.organization_id = i.organization_id
    )
    ORDER BY i.created_at ASC
    LIMIT 1
  LOOP
    INSERT INTO public.sgk_payment_records (
      organization_id,
      branch_id,
      invoice_id,
      amount,
      payment_date,
      notes
    ) VALUES (
      v_inv.organization_id,
      v_inv.branch_id,
      v_inv.id,
      v_inv.amount,
      '2026-09-25'::date,
      coalesce(v_inv.invoice_no, 'SGK') || ' - Dönem Hakediş Tahsilatı (Ziraat Bankası)'
    );

    UPDATE public.sgk_period_invoices
    SET status = 'Tahsil Edildi'
    WHERE id = v_inv.id;
  END LOOP;
END;
$$;

-- 2. Seed initial stock movement for any stock item lacking movement history
INSERT INTO public.stock_movements (
  organization_id,
  branch_id,
  stock_item_id,
  stock_item_name,
  type,
  quantity_change,
  unit_price,
  reference_entity,
  reference_id,
  notes
)
SELECT
  si.organization_id,
  si.branch_id,
  si.id,
  si.name,
  'ADJUSTMENT',
  CASE WHEN si.quantity > 0 THEN si.quantity ELSE 1 END,
  coalesce(si.purchase_price, si.price, 0),
  'adjustment',
  si.id,
  'Açılış / Devir Stoğu Sayım Kaydı'
FROM public.stock_items si
WHERE NOT EXISTS (
  SELECT 1 FROM public.stock_movements sm WHERE sm.stock_item_id = si.id
);

COMMIT;
