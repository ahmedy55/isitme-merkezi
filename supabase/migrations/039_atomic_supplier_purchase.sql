-- Migration 039: Atomic record_supplier_purchase RPC
BEGIN;

CREATE OR REPLACE FUNCTION public.record_supplier_purchase(
  p_supplier uuid,
  p_purchase jsonb,
  p_branch uuid DEFAULT NULL,
  p_register text DEFAULT 'kas-1',
  p_key uuid DEFAULT NULL
)
RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path=public,pg_temp AS $$
DECLARE
  org uuid := public.get_user_org_id();
  sup public.suppliers;
  purchase_id uuid := coalesce((p_purchase->>'id')::uuid, gen_random_uuid());
  p_date date := coalesce((p_purchase->>'date')::date, CURRENT_DATE);
  p_invoice text := coalesce(p_purchase->>'invoice_no', p_purchase->>'invoiceNo', '');
  p_total numeric := coalesce((p_purchase->>'total')::numeric, 0);
  p_status text := coalesce(p_purchase->>'payment_status', p_purchase->>'paymentStatus', 'Bekliyor');
  p_method text := coalesce(p_purchase->>'payment_method', p_purchase->>'paymentMethod', 'Açık Hesap');
  item jsonb;
  item_name text;
  item_qty int;
  item_price numeric;
  branch_to_use uuid := coalesce(p_branch, public.get_user_branch_id());
  key_to_use uuid := coalesce(p_key, gen_random_uuid());
BEGIN
  IF org IS NULL OR NOT public.has_any_role(ARRAY['Şube Yöneticisi','Muhasebe']) THEN
    RAISE EXCEPTION 'Purchase permission required';
  END IF;

  SELECT * INTO sup FROM public.suppliers WHERE id = p_supplier AND organization_id = org FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Supplier not found';
  END IF;

  -- Insert purchase record
  INSERT INTO public.supplier_purchases(
    id, supplier_id, organization_id, date, invoice_no, total, payment_status, payment_method
  )
  VALUES(
    purchase_id, p_supplier, org, p_date, p_invoice, p_total, p_status, p_method
  );

  -- Insert purchase items
  IF p_purchase->'items' IS NOT NULL AND jsonb_typeof(p_purchase->'items') = 'array' THEN
    FOR item IN SELECT * FROM jsonb_array_elements(p_purchase->'items') LOOP
      item_name := coalesce(item->>'name', 'Ürün');
      item_qty := coalesce((item->>'quantity')::int, 1);
      item_price := coalesce((item->>'unit_price')::numeric, (item->>'unitPrice')::numeric, 0);

      INSERT INTO public.supplier_purchase_items(
        purchase_id, organization_id, name, quantity, unit_price
      )
      VALUES(
        purchase_id, org, item_name, item_qty, item_price
      );
    END LOOP;
  END IF;

  -- Update supplier balance (-total means we owe supplier or balance updated)
  UPDATE public.suppliers
  SET balance = coalesce(balance, 0) - p_total
  WHERE id = p_supplier;

  -- If marked as paid, record cash transaction
  IF p_status = 'Ödendi' AND p_total > 0 AND branch_to_use IS NOT NULL THEN
    INSERT INTO public.cash_transactions(
      organization_id, branch_id, cash_register_id, type, amount, category,
      reference_entity, reference_id, description, performed_by, idempotency_key
    )
    VALUES(
      org, branch_to_use, coalesce(p_register, 'kas-1'), 'EXPENSE', p_total, 'Tedarikçi Ödemesi',
      'purchase', purchase_id::text, sup.company_name || ' — Alış faturası (' || p_invoice || ')',
      auth.uid(), key_to_use
    );
  END IF;

  INSERT INTO public.audit_log(organization_id, user_id, action, module, description)
  VALUES(org, auth.uid(), 'Alış Faturası', 'Tedarikçiler', sup.company_name || ' için fatura kaydedildi: ' || p_invoice || ' (₺' || p_total || ')');

  RETURN jsonb_build_object('success', true, 'purchase_id', purchase_id);
END $$;

REVOKE ALL ON FUNCTION public.record_supplier_purchase(uuid, jsonb, uuid, text, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.record_supplier_purchase(uuid, jsonb, uuid, text, uuid) TO authenticated;

COMMIT;
