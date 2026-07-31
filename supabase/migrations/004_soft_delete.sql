-- =========================================================================
-- AudiPro SaaS — Migration 004: Soft-Delete Architecture & RLS Filtering (004_soft_delete.sql)
-- =========================================================================

-- 1. Add deleted_at column to primary tables
ALTER TABLE patients ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE stock_items ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE sales ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

-- 2. Create partial indexes for non-deleted records
CREATE INDEX IF NOT EXISTS idx_patients_deleted_at ON patients(organization_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_appointments_deleted_at ON appointments(organization_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_stock_items_deleted_at ON stock_items(organization_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_sales_deleted_at ON sales(organization_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_expenses_deleted_at ON expenses(organization_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_suppliers_deleted_at ON suppliers(organization_id) WHERE deleted_at IS NULL;

-- 3. Update RLS Policies to Enforce DB-Level Soft-Delete Filtering (AND deleted_at IS NULL)
DROP POLICY IF EXISTS "patients_select" ON patients;
CREATE POLICY "patients_select" ON patients FOR SELECT USING (
  organization_id = get_user_org_id()
  AND deleted_at IS NULL
  AND has_any_role(ARRAY['Şube Yöneticisi', 'Odyometrist', 'Odyolog', 'Sekreter', 'Resepsiyon'])
  AND matches_user_branch(branch_id)
);

DROP POLICY IF EXISTS "expenses_select" ON expenses;
CREATE POLICY "expenses_select" ON expenses FOR SELECT USING (
  organization_id = get_user_org_id()
  AND deleted_at IS NULL
  AND has_any_role(ARRAY['Şube Yöneticisi', 'Muhasebe'])
  AND matches_user_branch(branch_id)
);

DROP POLICY IF EXISTS "sales_select" ON sales;
CREATE POLICY "sales_select" ON sales FOR SELECT USING (
  organization_id = get_user_org_id()
  AND deleted_at IS NULL
  AND has_any_role(ARRAY['Şube Yöneticisi', 'Muhasebe', 'Odyolog', 'Odyometrist', 'Sekreter'])
  AND matches_user_branch(branch_id)
);

DROP POLICY IF EXISTS "suppliers_select" ON suppliers;
CREATE POLICY "suppliers_select" ON suppliers FOR SELECT USING (
  organization_id = get_user_org_id()
  AND deleted_at IS NULL
  AND has_any_role(ARRAY['Şube Yöneticisi', 'Muhasebe'])
);
