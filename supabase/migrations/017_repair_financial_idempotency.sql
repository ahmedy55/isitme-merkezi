-- Repair financial idempotency columns expected by migration 005 and the
-- atomic sale RPC. Existing rows receive NULL and remain valid.
ALTER TABLE public.sales
  ADD COLUMN IF NOT EXISTS idempotency_key uuid;

ALTER TABLE public.cash_transactions
  ADD COLUMN IF NOT EXISTS idempotency_key uuid;

ALTER TABLE public.expenses
  ADD COLUMN IF NOT EXISTS idempotency_key uuid;

CREATE UNIQUE INDEX IF NOT EXISTS idx_sales_idempotency
  ON public.sales (idempotency_key)
  WHERE idempotency_key IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_cash_idempotency
  ON public.cash_transactions (idempotency_key)
  WHERE idempotency_key IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_expenses_idempotency
  ON public.expenses (idempotency_key)
  WHERE idempotency_key IS NOT NULL;
