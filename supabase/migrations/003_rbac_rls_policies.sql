-- =========================================================================
-- AudiPro SaaS — Migration 003: Backend Role-Based Access Control & Branch Isolation (003_rbac_rls_policies.sql)
-- =========================================================================

-- ═══════════════════════════════════════════════
-- 1. Helper Functions for User Roles and Branch ID
-- ═══════════════════════════════════════════════

CREATE OR REPLACE FUNCTION get_user_roles()
RETURNS TEXT[] AS $$
DECLARE
  v_roles TEXT[];
BEGIN
  SELECT roles INTO v_roles
  FROM memberships
  WHERE user_id = auth.uid()
    AND organization_id = get_user_org_id()
    AND status = 'active'
  LIMIT 1;

  RETURN COALESCE(v_roles, '{}'::TEXT[]);
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_user_branch_id()
RETURNS UUID AS $$
DECLARE
  v_branch_id UUID;
BEGIN
  SELECT branch_id INTO v_branch_id
  FROM memberships
  WHERE user_id = auth.uid()
    AND organization_id = get_user_org_id()
    AND status = 'active'
  LIMIT 1;

  RETURN v_branch_id;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION has_any_role(required_roles TEXT[])
RETURNS BOOLEAN AS $$
DECLARE
  user_r TEXT[];
  r TEXT;
BEGIN
  -- Platform Admin bypass
  IF auth.uid() IN (SELECT user_id FROM platform_admins) THEN
    RETURN TRUE;
  END IF;

  user_r := get_user_roles();
  
  -- Firma Yöneticisi bypasses role restrictions within their org
  IF 'Firma Yöneticisi' = ANY(user_r) OR 'firma_yoneticisi' = ANY(user_r) THEN
    RETURN TRUE;
  END IF;

  FOREACH r IN ARRAY required_roles LOOP
    IF r = ANY(user_r) THEN
      RETURN TRUE;
    END IF;
  END LOOP;

  RETURN FALSE;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION matches_user_branch(item_branch_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  user_r TEXT[];
  u_branch UUID;
BEGIN
  -- Platform Admin bypass
  IF auth.uid() IN (SELECT user_id FROM platform_admins) THEN
    RETURN TRUE;
  END IF;

  user_r := get_user_roles();

  -- Firma Yöneticisi sees ALL branches (Consolidated View)
  IF 'Firma Yöneticisi' = ANY(user_r) OR 'firma_yoneticisi' = ANY(user_r) THEN
    RETURN TRUE;
  END IF;

  u_branch := get_user_branch_id();

  -- If user has no specific branch assigned or item has no branch, or matches user branch
  IF u_branch IS NULL OR item_branch_id IS NULL OR item_branch_id = u_branch THEN
    RETURN TRUE;
  END IF;

  RETURN FALSE;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- ═══════════════════════════════════════════════
-- 2. Update RLS Policies for Patients & Timeline (Klinik Tablolar)
-- Excluded roles: Muhasebe
-- Allowed roles: Firma Yöneticisi, Şube Yöneticisi, Odyometrist, Odyolog, Sekreter, Resepsiyon
-- ═══════════════════════════════════════════════

DROP POLICY IF EXISTS "patients_select" ON patients;
DROP POLICY IF EXISTS "patients_insert" ON patients;
DROP POLICY IF EXISTS "patients_update" ON patients;
DROP POLICY IF EXISTS "patients_delete" ON patients;

CREATE POLICY "patients_select" ON patients FOR SELECT USING (
  organization_id = get_user_org_id()
  AND has_any_role(ARRAY['Şube Yöneticisi', 'Odyometrist', 'Odyolog', 'Sekreter', 'Resepsiyon'])
  AND matches_user_branch(branch_id)
);

CREATE POLICY "patients_insert" ON patients FOR INSERT WITH CHECK (
  organization_id = get_user_org_id()
  AND has_any_role(ARRAY['Şube Yöneticisi', 'Odyometrist', 'Odyolog', 'Sekreter', 'Resepsiyon'])
);

CREATE POLICY "patients_update" ON patients FOR UPDATE USING (
  organization_id = get_user_org_id()
  AND has_any_role(ARRAY['Şube Yöneticisi', 'Odyometrist', 'Odyolog', 'Sekreter', 'Resepsiyon'])
  AND matches_user_branch(branch_id)
);

CREATE POLICY "patients_delete" ON patients FOR DELETE USING (
  organization_id = get_user_org_id()
  AND has_any_role(ARRAY['Şube Yöneticisi'])
);

-- ═══════════════════════════════════════════════
-- 3. Update RLS Policies for Financial Tables (Expenses, Sales, Cash, Suppliers)
-- Excluded roles: Odyolog, Sekreter
-- Allowed roles: Firma Yöneticisi, Şube Yöneticisi, Muhasebe
-- ═══════════════════════════════════════════════

DROP POLICY IF EXISTS "expenses_select" ON expenses;
DROP POLICY IF EXISTS "expenses_insert" ON expenses;
DROP POLICY IF EXISTS "expenses_update" ON expenses;
DROP POLICY IF EXISTS "expenses_delete" ON expenses;

CREATE POLICY "expenses_select" ON expenses FOR SELECT USING (
  organization_id = get_user_org_id()
  AND has_any_role(ARRAY['Şube Yöneticisi', 'Muhasebe'])
  AND matches_user_branch(branch_id)
);

CREATE POLICY "expenses_insert" ON expenses FOR INSERT WITH CHECK (
  organization_id = get_user_org_id()
  AND has_any_role(ARRAY['Şube Yöneticisi', 'Muhasebe'])
);

CREATE POLICY "expenses_update" ON expenses FOR UPDATE USING (
  organization_id = get_user_org_id()
  AND has_any_role(ARRAY['Şube Yöneticisi', 'Muhasebe'])
  AND matches_user_branch(branch_id)
);

CREATE POLICY "expenses_delete" ON expenses FOR DELETE USING (
  organization_id = get_user_org_id()
  AND has_any_role(ARRAY['Şube Yöneticisi', 'Muhasebe'])
);

-- Sales
DROP POLICY IF EXISTS "sales_select" ON sales;
DROP POLICY IF EXISTS "sales_insert" ON sales;
DROP POLICY IF EXISTS "sales_update" ON sales;
DROP POLICY IF EXISTS "sales_delete" ON sales;

CREATE POLICY "sales_select" ON sales FOR SELECT USING (
  organization_id = get_user_org_id()
  AND has_any_role(ARRAY['Şube Yöneticisi', 'Muhasebe', 'Odyolog', 'Odyometrist', 'Sekreter'])
  AND matches_user_branch(branch_id)
);

CREATE POLICY "sales_insert" ON sales FOR INSERT WITH CHECK (
  organization_id = get_user_org_id()
  AND has_any_role(ARRAY['Şube Yöneticisi', 'Muhasebe', 'Odyometrist', 'Odyolog'])
);

-- Cash Transactions
DROP POLICY IF EXISTS "cash_transactions_select" ON cash_transactions;
DROP POLICY IF EXISTS "cash_transactions_insert" ON cash_transactions;
DROP POLICY IF EXISTS "cash_transactions_update" ON cash_transactions;
DROP POLICY IF EXISTS "cash_transactions_delete" ON cash_transactions;

CREATE POLICY "cash_transactions_select" ON cash_transactions FOR SELECT USING (
  organization_id = get_user_org_id()
  AND has_any_role(ARRAY['Şube Yöneticisi', 'Muhasebe'])
  AND matches_user_branch(branch_id)
);

CREATE POLICY "cash_transactions_insert" ON cash_transactions FOR INSERT WITH CHECK (
  organization_id = get_user_org_id()
  AND has_any_role(ARRAY['Şube Yöneticisi', 'Muhasebe'])
);

-- Suppliers
DROP POLICY IF EXISTS "suppliers_select" ON suppliers;
DROP POLICY IF EXISTS "suppliers_insert" ON suppliers;
DROP POLICY IF EXISTS "suppliers_update" ON suppliers;
DROP POLICY IF EXISTS "suppliers_delete" ON suppliers;

CREATE POLICY "suppliers_select" ON suppliers FOR SELECT USING (
  organization_id = get_user_org_id()
  AND has_any_role(ARRAY['Şube Yöneticisi', 'Muhasebe'])
);

CREATE POLICY "suppliers_insert" ON suppliers FOR INSERT WITH CHECK (
  organization_id = get_user_org_id()
  AND has_any_role(ARRAY['Şube Yöneticisi', 'Muhasebe'])
);
