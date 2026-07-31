-- =========================================================================
-- AudiPro SaaS — Migration 005: Idempotency Keys for Financial Records (005_idempotency_keys.sql)
-- =========================================================================

-- Add idempotency_key column with UNIQUE constraint to prevent duplicate financial submissions
ALTER TABLE sales ADD COLUMN IF NOT EXISTS idempotency_key UUID UNIQUE;
ALTER TABLE cash_transactions ADD COLUMN IF NOT EXISTS idempotency_key UUID UNIQUE;
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS idempotency_key UUID UNIQUE;

CREATE INDEX IF NOT EXISTS idx_sales_idempotency ON sales(idempotency_key) WHERE idempotency_key IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_cash_idempotency ON cash_transactions(idempotency_key) WHERE idempotency_key IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_expenses_idempotency ON expenses(idempotency_key) WHERE idempotency_key IS NOT NULL;
