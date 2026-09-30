-- Track serialized-device trials without booking a sale or reducing on-hand stock.
BEGIN;

CREATE TABLE IF NOT EXISTS public.device_trials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id),
  branch_id uuid NOT NULL,
  patient_id uuid NOT NULL,
  stock_item_id uuid NOT NULL,
  barcode text NOT NULL,
  serial_no text NOT NULL,
  request_id uuid NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'Denemede' CHECK (status IN ('Denemede', 'İade Edildi', 'Satışa Dönüştü')),
  started_at timestamptz NOT NULL DEFAULT now(),
  due_at date NOT NULL,
  closed_at timestamptz,
  sale_id uuid,
  performed_by uuid NOT NULL DEFAULT auth.uid(),
  FOREIGN KEY (organization_id, branch_id) REFERENCES public.branches(organization_id, id),
  FOREIGN KEY (organization_id, patient_id) REFERENCES public.patients(organization_id, id),
  FOREIGN KEY (organization_id, stock_item_id) REFERENCES public.stock_items(organization_id, id),
  FOREIGN KEY (organization_id, sale_id) REFERENCES public.sales(organization_id, id)
);

CREATE UNIQUE INDEX IF NOT EXISTS one_active_trial_per_device
  ON public.device_trials(stock_item_id) WHERE status = 'Denemede';
CREATE INDEX IF NOT EXISTS device_trials_patient_active
  ON public.device_trials(organization_id, patient_id, started_at DESC) WHERE status = 'Denemede';

ALTER TABLE public.device_trials ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS device_trials_read ON public.device_trials;
DROP POLICY IF EXISTS device_trials_insert ON public.device_trials;
DROP POLICY IF EXISTS device_trials_update ON public.device_trials;
CREATE POLICY device_trials_read ON public.device_trials FOR SELECT TO authenticated
  USING (public.tenant_access(organization_id, branch_id, ARRAY['Şube Yöneticisi', 'Odyolog', 'Odyometrist', 'Sekreter', 'Resepsiyon']));
CREATE POLICY device_trials_insert ON public.device_trials FOR INSERT TO authenticated
  WITH CHECK (public.tenant_access(organization_id, branch_id, ARRAY['Şube Yöneticisi', 'Odyolog', 'Odyometrist', 'Sekreter', 'Resepsiyon']) AND performed_by = auth.uid());
CREATE POLICY device_trials_update ON public.device_trials FOR UPDATE TO authenticated
  USING (public.tenant_access(organization_id, branch_id, ARRAY['Şube Yöneticisi', 'Odyolog', 'Odyometrist', 'Sekreter', 'Resepsiyon']))
  WITH CHECK (public.tenant_access(organization_id, branch_id, ARRAY['Şube Yöneticisi', 'Odyolog', 'Odyometrist', 'Sekreter', 'Resepsiyon']));
CREATE TRIGGER tenant_identity_guard BEFORE UPDATE ON public.device_trials FOR EACH ROW EXECUTE FUNCTION public.guard_tenant_identity();
CREATE TRIGGER record_branch_guard BEFORE INSERT OR UPDATE ON public.device_trials FOR EACH ROW EXECUTE FUNCTION public.guard_record_branch();
GRANT SELECT, INSERT, UPDATE ON public.device_trials TO authenticated;

CREATE OR REPLACE FUNCTION public.start_device_trial(p_patient uuid, p_stock uuid, p_due_at date, p_request uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path = public, pg_temp AS $$
DECLARE org uuid := public.get_user_org_id(); patient public.patients; item public.stock_items; prior public.device_trials; trial public.device_trials;
BEGIN
  IF org IS NULL OR NOT public.has_any_role(ARRAY['Şube Yöneticisi', 'Odyolog', 'Odyometrist', 'Sekreter']) THEN RAISE EXCEPTION 'Device trial permission required'; END IF;
  IF p_request IS NULL OR p_due_at IS NULL OR p_due_at < current_date THEN RAISE EXCEPTION 'Valid request ID and due date required'; END IF;
  SELECT * INTO prior FROM public.device_trials WHERE request_id = p_request AND organization_id = org;
  IF FOUND THEN
    IF prior.patient_id <> p_patient OR prior.stock_item_id <> p_stock THEN RAISE EXCEPTION 'Trial request mismatch'; END IF;
    RETURN to_jsonb(prior);
  END IF;
  SELECT * INTO patient FROM public.patients WHERE id = p_patient AND organization_id = org AND deleted_at IS NULL FOR SHARE;
  IF NOT FOUND OR patient.branch_id IS NULL THEN RAISE EXCEPTION 'Accessible patient and branch required'; END IF;
  SELECT * INTO item FROM public.stock_items WHERE id = p_stock AND organization_id = org AND branch_id = patient.branch_id AND deleted_at IS NULL FOR UPDATE;
  IF NOT FOUND OR item.category <> 'Cihaz' OR item.quantity <> 1 OR item.status <> 'Stokta'
    OR coalesce(nullif(btrim(item.serial_no), ''), '—') IN ('—', 'SN-UNKNOWN') OR btrim(coalesce(item.barcode, '')) = '' THEN
    RAISE EXCEPTION 'Only an available serialized device can be placed on trial';
  END IF;
  INSERT INTO public.device_trials(organization_id, branch_id, patient_id, stock_item_id, barcode, serial_no, request_id, due_at, performed_by)
  VALUES (org, patient.branch_id, patient.id, item.id, item.barcode, item.serial_no, p_request, p_due_at, auth.uid()) RETURNING * INTO trial;
  UPDATE public.stock_items SET status = 'Hastaya Ayrıldı', assigned_patient_id = patient.id WHERE id = item.id;
  RETURN to_jsonb(trial);
END;
$$;
REVOKE ALL ON FUNCTION public.start_device_trial(uuid, uuid, date, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.start_device_trial(uuid, uuid, date, uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.return_device_trial(p_trial uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path = public, pg_temp AS $$
DECLARE org uuid := public.get_user_org_id(); trial public.device_trials; item public.stock_items;
BEGIN
  IF org IS NULL OR NOT public.has_any_role(ARRAY['Şube Yöneticisi', 'Odyolog', 'Odyometrist', 'Sekreter']) THEN RAISE EXCEPTION 'Device trial permission required'; END IF;
  SELECT * INTO trial FROM public.device_trials WHERE id = p_trial AND organization_id = org FOR UPDATE;
  IF NOT FOUND OR trial.status <> 'Denemede' THEN RAISE EXCEPTION 'Active device trial not found'; END IF;
  SELECT * INTO item FROM public.stock_items WHERE id = trial.stock_item_id AND organization_id = org FOR UPDATE;
  IF NOT FOUND OR item.status <> 'Hastaya Ayrıldı' OR item.assigned_patient_id <> trial.patient_id OR item.quantity <> 1 THEN
    RAISE EXCEPTION 'Trial device stock state mismatch';
  END IF;
  UPDATE public.stock_items SET status = 'Stokta', assigned_patient_id = NULL WHERE id = item.id;
  UPDATE public.device_trials SET status = 'İade Edildi', closed_at = now() WHERE id = trial.id RETURNING * INTO trial;
  RETURN to_jsonb(trial);
END;
$$;
REVOKE ALL ON FUNCTION public.return_device_trial(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.return_device_trial(uuid) TO authenticated;

-- Do not let a different patient sell a device currently checked out on trial.
CREATE OR REPLACE FUNCTION public.complete_sale(p_sale jsonb, p_key uuid, p_stock uuid DEFAULT NULL, p_register text DEFAULT 'kas-1')
RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path = public, pg_temp AS $$
DECLARE
  org uuid := public.get_user_org_id(); pat public.patients; st public.stock_items; s public.sales;
  item jsonb; inst jsonb; total_amount numeric := 0; qty int; stock_qty int := 0;
  request jsonb := jsonb_build_object('sale', p_sale, 'stock', p_stock, 'register', p_register);
BEGIN
  IF org IS NULL OR NOT public.has_any_role(ARRAY['Şube Yöneticisi', 'Muhasebe']) THEN RAISE EXCEPTION 'Finance permission required'; END IF;
  IF p_key IS NULL THEN RAISE EXCEPTION 'Idempotency key required'; END IF;
  PERFORM pg_advisory_xact_lock(hashtextextended(org::text || p_key::text, 0));
  SELECT * INTO s FROM public.sales WHERE organization_id = org AND idempotency_key = p_key;
  IF FOUND THEN
    IF s.request_payload IS DISTINCT FROM request THEN RAISE EXCEPTION 'Idempotency payload mismatch'; END IF;
    RETURN to_jsonb(s);
  END IF;
  SELECT * INTO pat FROM public.patients WHERE id = (p_sale->>'patient_id')::uuid AND organization_id = org FOR SHARE;
  IF NOT FOUND OR pat.branch_id IS NULL THEN RAISE EXCEPTION 'Accessible patient and branch required'; END IF;
  IF jsonb_typeof(p_sale->'items') IS DISTINCT FROM 'array' OR jsonb_array_length(p_sale->'items') = 0 THEN RAISE EXCEPTION 'Sale items required'; END IF;
  IF p_stock IS NOT NULL THEN
    SELECT * INTO st FROM public.stock_items WHERE id = p_stock AND organization_id = org AND branch_id = pat.branch_id FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'Accessible stock required'; END IF;
    IF st.status = 'Hastaya Ayrıldı' AND NOT EXISTS (
      SELECT 1 FROM public.device_trials d WHERE d.organization_id = org AND d.stock_item_id = st.id AND d.patient_id = pat.id AND d.status = 'Denemede'
    ) THEN RAISE EXCEPTION 'Device is reserved for another patient trial'; END IF;
  END IF;
  FOR item IN SELECT * FROM jsonb_array_elements(p_sale->'items') LOOP
    qty := (item->>'quantity')::int;
    IF qty IS NULL OR qty <= 0 OR (item->>'price')::numeric IS NULL OR (item->>'price')::numeric < 0 THEN RAISE EXCEPTION 'Invalid item'; END IF;
    total_amount := total_amount + qty * (item->>'price')::numeric;
    IF p_stock IS NOT NULL AND item->>'name' = st.name THEN stock_qty := stock_qty + qty; END IF;
  END LOOP;
  IF total_amount IS DISTINCT FROM (p_sale->>'total')::numeric OR coalesce((p_sale->>'sgk_amount')::numeric, 0) + coalesce((p_sale->>'patient_amount')::numeric, total_amount) <> total_amount THEN RAISE EXCEPTION 'Invalid sale totals'; END IF;
  IF p_stock IS NOT NULL AND (stock_qty <= 0 OR st.quantity < stock_qty) THEN RAISE EXCEPTION 'Insufficient/mismatched stock'; END IF;
  INSERT INTO public.sales(organization_id, branch_id, patient_id, date, total, sgk_amount, patient_amount, payment_method, status, audiologist, idempotency_key, request_payload)
  VALUES(org, pat.branch_id, pat.id, (p_sale->>'date')::date, total_amount, coalesce((p_sale->>'sgk_amount')::numeric, 0), coalesce((p_sale->>'patient_amount')::numeric, total_amount), p_sale->>'payment_method', p_sale->>'status', p_sale->>'audiologist', p_key, request)
  RETURNING * INTO s;
  FOR item IN SELECT * FROM jsonb_array_elements(p_sale->'items') LOOP
    INSERT INTO public.sale_items(sale_id, organization_id, name, quantity, price, type)
    VALUES(s.id, org, item->>'name', (item->>'quantity')::int, (item->>'price')::numeric, item->>'type');
  END LOOP;
  FOR inst IN SELECT * FROM jsonb_array_elements(coalesce(p_sale->'installments', '[]'::jsonb)) LOOP
    IF (inst->>'amount')::numeric <= 0 THEN RAISE EXCEPTION 'Invalid installment'; END IF;
    INSERT INTO public.sale_installments(sale_id, organization_id, amount, due_date, paid)
    VALUES(s.id, org, (inst->>'amount')::numeric, (inst->>'due_date')::date, coalesce((inst->>'paid')::boolean, false));
  END LOOP;
  IF p_stock IS NOT NULL THEN
    UPDATE public.stock_items SET quantity = quantity - stock_qty,
      assigned_patient_id = CASE WHEN quantity - stock_qty = 0 AND st.category = 'Cihaz' THEN pat.id ELSE assigned_patient_id END,
      status = CASE WHEN quantity - stock_qty = 0 THEN 'Satıldı' ELSE status END
    WHERE id = p_stock;
    INSERT INTO public.stock_movements(organization_id, branch_id, stock_item_id, stock_item_name, type, quantity_change, unit_price, reference_entity, reference_id, performed_by)
    VALUES(org, pat.branch_id, p_stock, st.name, 'SALE', -stock_qty, total_amount, 'sale', s.id::text, auth.uid());
    UPDATE public.device_trials SET status = 'Satışa Dönüştü', closed_at = now(), sale_id = s.id
      WHERE organization_id = org AND stock_item_id = p_stock AND patient_id = pat.id AND status = 'Denemede';
  END IF;
  IF s.status = 'Tahsil Edildi' AND s.patient_amount > 0 THEN
    INSERT INTO public.cash_transactions(organization_id, branch_id, cash_register_id, type, amount, category, reference_entity, reference_id, performed_by, idempotency_key)
    VALUES(org, pat.branch_id, p_register, 'INCOME', s.patient_amount, 'Cihaz Satışı', 'sale', s.id::text, auth.uid(), p_key);
  END IF;
  INSERT INTO public.audit_log(organization_id, user_id, action, module, description)
  VALUES(org, auth.uid(), 'Satış Ekleme', 'Kasa', 'Satış: ' || s.id::text);
  RETURN to_jsonb(s);
END;
$$;
REVOKE ALL ON FUNCTION public.complete_sale(jsonb, uuid, uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.complete_sale(jsonb, uuid, uuid, text) TO authenticated;

COMMIT;
