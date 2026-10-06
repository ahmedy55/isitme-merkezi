BEGIN;

ALTER TABLE public.sgk_period_invoices
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'Bekliyor';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.sgk_period_invoices'::regclass
      AND conname = 'sgk_period_invoices_status_check'
  ) THEN
    ALTER TABLE public.sgk_period_invoices
      ADD CONSTRAINT sgk_period_invoices_status_check
      CHECK (status IN ('Bekliyor', 'Kısmi Tahsilat', 'Tahsil Edildi'));
  END IF;
END;
$$;

ALTER TABLE public.sgk_period_invoices
  ADD CONSTRAINT sgk_period_invoice_tenant_identity UNIQUE (organization_id, branch_id, id);

CREATE TABLE public.sgk_payment_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  branch_id uuid NOT NULL,
  invoice_id uuid NOT NULL,
  amount numeric(14,2) NOT NULL CHECK (amount > 0),
  payment_date date NOT NULL DEFAULT current_date,
  notes text NOT NULL DEFAULT '' CHECK (length(notes) <= 1000),
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (organization_id, branch_id) REFERENCES public.branches(organization_id, id),
  FOREIGN KEY (organization_id, branch_id, invoice_id)
    REFERENCES public.sgk_period_invoices(organization_id, branch_id, id)
);

CREATE INDEX sgk_payment_records_org_date_idx
  ON public.sgk_payment_records (organization_id, payment_date DESC, id);
CREATE INDEX sgk_payment_records_invoice_idx
  ON public.sgk_payment_records (organization_id, invoice_id);

ALTER TABLE public.sgk_payment_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY sgk_payment_records_read ON public.sgk_payment_records
  FOR SELECT TO authenticated
  USING (public.tenant_access(organization_id, branch_id, ARRAY['Şube Yöneticisi', 'Muhasebe']));
GRANT SELECT ON public.sgk_payment_records TO authenticated;

CREATE FUNCTION public.record_sgk_payment(
  p_invoice_id uuid,
  p_amount numeric,
  p_payment_date date DEFAULT current_date,
  p_notes text DEFAULT ''
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  invoice_row public.sgk_period_invoices%ROWTYPE;
  paid_total numeric(14,2);
  payment_id uuid;
BEGIN
  IF p_amount IS NULL OR p_amount <= 0 THEN
    RAISE EXCEPTION 'Tahsilat tutarı sıfırdan büyük olmalıdır.' USING ERRCODE = '22023';
  END IF;
  IF p_payment_date IS NULL THEN
    RAISE EXCEPTION 'Tahsilat tarihi gereklidir.' USING ERRCODE = '22023';
  END IF;
  IF length(coalesce(p_notes, '')) > 1000 THEN
    RAISE EXCEPTION 'Tahsilat notu 1000 karakteri aşamaz.' USING ERRCODE = '22023';
  END IF;

  SELECT * INTO invoice_row
  FROM public.sgk_period_invoices AS invoice
  WHERE invoice.id = p_invoice_id
    AND public.tenant_access(invoice.organization_id, invoice.branch_id, ARRAY['Şube Yöneticisi', 'Muhasebe'])
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Fatura bulunamadı veya erişim yetkiniz yok.' USING ERRCODE = 'P0002';
  END IF;

  SELECT coalesce(sum(payment.amount), 0)
    INTO paid_total
  FROM public.sgk_payment_records AS payment
  WHERE payment.invoice_id = invoice_row.id
    AND payment.organization_id = invoice_row.organization_id;

  IF paid_total + p_amount > invoice_row.amount THEN
    RAISE EXCEPTION 'Tahsilat tutarı kalan fatura bakiyesini aşamaz.' USING ERRCODE = '22023';
  END IF;

  INSERT INTO public.sgk_payment_records (
    organization_id, branch_id, invoice_id, amount, payment_date, notes, created_by
  ) VALUES (
    invoice_row.organization_id, invoice_row.branch_id, invoice_row.id,
    p_amount, p_payment_date, coalesce(p_notes, ''), auth.uid()
  ) RETURNING id INTO payment_id;

  paid_total := paid_total + p_amount;
  UPDATE public.sgk_period_invoices
  SET status = CASE
    WHEN paid_total >= invoice_row.amount THEN 'Tahsil Edildi'
    ELSE 'Kısmi Tahsilat'
  END
  WHERE id = invoice_row.id;

  RETURN payment_id;
END;
$$;

REVOKE ALL ON FUNCTION public.record_sgk_payment(uuid, numeric, date, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.record_sgk_payment(uuid, numeric, date, text) TO authenticated;

COMMIT;
