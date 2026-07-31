-- =========================================================================
-- AudiPro SaaS — Migration 004: Soft-Delete Architecture (004_soft_delete.sql)
-- =========================================================================

-- 1. Add deleted_at column to primary tables
ALTER TABLE patients ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE stock_items ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE sales ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

-- 2. Create indexes for non-deleted records
CREATE INDEX IF NOT EXISTS idx_patients_deleted_at ON patients(organization_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_appointments_deleted_at ON appointments(organization_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_stock_items_deleted_at ON stock_items(organization_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_sales_deleted_at ON sales(organization_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_expenses_deleted_at ON expenses(organization_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_suppliers_deleted_at ON suppliers(organization_id) WHERE deleted_at IS NULL;
