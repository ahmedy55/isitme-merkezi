-- Migration 038: Atomic complete_service_ticket RPC
BEGIN;

CREATE OR REPLACE FUNCTION public.complete_service_ticket(
  p_ticket uuid,
  p_fee numeric,
  p_parts jsonb DEFAULT '[]'::jsonb,
  p_register text DEFAULT 'kas-1',
  p_key uuid DEFAULT NULL
)
RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path=public,pg_temp AS $$
DECLARE
  org uuid := public.get_user_org_id();
  ticket public.service_tickets;
  part jsonb;
  part_stock_id uuid;
  part_qty int;
  part_price numeric;
  part_name text;
  st public.stock_items;
  key_to_use uuid := coalesce(p_key, gen_random_uuid());
BEGIN
  IF org IS NULL OR NOT public.has_any_role(ARRAY['Şube Yöneticisi','Odyolog','Odyometrist','Sekreter','Resepsiyon','Muhasebe']) THEN
    RAISE EXCEPTION 'Service permission required';
  END IF;

  SELECT * INTO ticket FROM public.service_tickets WHERE id = p_ticket AND organization_id = org FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Service ticket not found';
  END IF;

  IF ticket.branch_id IS NULL THEN
    RAISE EXCEPTION 'Ticket branch is required';
  END IF;

  -- Process parts deduction
  IF p_parts IS NOT NULL AND jsonb_typeof(p_parts) = 'array' THEN
    FOR part IN SELECT * FROM jsonb_array_elements(p_parts) LOOP
      part_stock_id := (part->>'stock_item_id')::uuid;
      part_qty := coalesce((part->>'quantity')::int, 1);
      part_price := coalesce((part->>'price')::numeric, 0);
      part_name := coalesce(part->>'name', part->>'stock_item_name', 'Yedek Parça');

      IF part_stock_id IS NOT NULL THEN
        SELECT * INTO st FROM public.stock_items
        WHERE id = part_stock_id AND organization_id = org AND branch_id = ticket.branch_id
        FOR UPDATE;

        IF NOT FOUND THEN
          RAISE EXCEPTION 'Stock item not accessible or in different branch';
        END IF;

        IF st.quantity < part_qty THEN
          RAISE EXCEPTION 'Insufficient stock for %: available %, requested %', st.name, st.quantity, part_qty;
        END IF;

        UPDATE public.stock_items
        SET quantity = quantity - part_qty,
            status = CASE WHEN quantity - part_qty = 0 THEN 'Tükendi' ELSE status END
        WHERE id = part_stock_id;

        INSERT INTO public.stock_movements(
          organization_id, branch_id, stock_item_id, stock_item_name,
          type, quantity_change, unit_price, reference_entity, reference_id, performed_by
        )
        VALUES(
          org, ticket.branch_id, part_stock_id, st.name,
          'SERVICE', -part_qty, part_price, 'service', ticket.id::text, auth.uid()
        );
      END IF;
    END LOOP;
  END IF;

  -- Record cash transaction if service fee > 0
  IF p_fee > 0 THEN
    -- Check if already recorded
    IF NOT EXISTS (
      SELECT 1 FROM public.cash_transactions
      WHERE organization_id = org AND reference_entity = 'service' AND reference_id = ticket.id::text AND type = 'INCOME'
    ) THEN
      INSERT INTO public.cash_transactions(
        organization_id, branch_id, cash_register_id, type, amount, category,
        reference_entity, reference_id, description, performed_by, idempotency_key
      )
      VALUES(
        org, ticket.branch_id, coalesce(p_register, 'kas-1'), 'INCOME', p_fee, 'Servis Geliri',
        'service', ticket.id::text, coalesce(ticket.patient_name, 'Hasta') || ' — Teknik servis ücreti',
        auth.uid(), key_to_use
      );
    END IF;
  END IF;

  -- Update service ticket status
  UPDATE public.service_tickets
  SET status = 'Tamamlandı',
      delivered_date = coalesce(delivered_date, CURRENT_DATE),
      service_fee = p_fee
  WHERE id = p_ticket;

  INSERT INTO public.audit_log(organization_id, user_id, action, module, description)
  VALUES(org, auth.uid(), 'Servis Kapatma', 'Teknik Servis', 'Servis tamamlandı: ' || coalesce(ticket.device_name, '') || ' (' || ticket.id::text || ')');

  RETURN jsonb_build_object('success', true, 'ticket_id', p_ticket);
END $$;

REVOKE ALL ON FUNCTION public.complete_service_ticket(uuid, numeric, jsonb, text, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.complete_service_ticket(uuid, numeric, jsonb, text, uuid) TO authenticated;

COMMIT;
