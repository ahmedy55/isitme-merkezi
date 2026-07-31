-- =========================================================================
-- AudiPro SaaS — Migration 002: Audit Fix - Missing Columns & Tables
-- Fixes: #5 (purchase_price), #17 (branch text→FK), #20 (missing tables)
-- =========================================================================

-- ═══════════════════════════════════════════════
-- 1. stock_items: add purchase_price column
-- ═══════════════════════════════════════════════
ALTER TABLE stock_items ADD COLUMN IF NOT EXISTS purchase_price NUMERIC DEFAULT 0;

-- ═══════════════════════════════════════════════
-- 2. cash_transactions table (Kasa Hareketleri)
-- ═══════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS cash_transactions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  branch_id       UUID REFERENCES branches(id),
  cash_register_id TEXT NOT NULL DEFAULT 'kas-1',
  type            TEXT NOT NULL CHECK (type IN ('INCOME', 'EXPENSE', 'PAYOUT', 'TRANSFER', 'REFUND')),
  amount          NUMERIC NOT NULL CHECK (amount > 0),
  category        TEXT NOT NULL,
  reference_entity TEXT CHECK (reference_entity IN ('sale', 'expense', 'purchase', 'service')),
  reference_id    TEXT,
  performed_by    UUID REFERENCES auth.users(id),
  description     TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cash_transactions_org ON cash_transactions(organization_id);
CREATE INDEX IF NOT EXISTS idx_cash_transactions_date ON cash_transactions(organization_id, created_at DESC);

ALTER TABLE cash_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cash_transactions_select" ON cash_transactions FOR SELECT USING (organization_id = get_user_org_id() OR (select auth.uid()) IN (SELECT user_id FROM platform_admins));
CREATE POLICY "cash_transactions_insert" ON cash_transactions FOR INSERT WITH CHECK (organization_id = get_user_org_id());
CREATE POLICY "cash_transactions_update" ON cash_transactions FOR UPDATE USING (organization_id = get_user_org_id());
CREATE POLICY "cash_transactions_delete" ON cash_transactions FOR DELETE USING (organization_id = get_user_org_id());

-- ═══════════════════════════════════════════════
-- 3. stock_movements table (Stok Hareketleri)
-- ═══════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS stock_movements (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  branch_id       UUID REFERENCES branches(id),
  stock_item_id   UUID NOT NULL REFERENCES stock_items(id) ON DELETE CASCADE,
  stock_item_name TEXT NOT NULL,
  type            TEXT NOT NULL CHECK (type IN ('PURCHASE', 'SALE', 'TRANSFER', 'RETURN', 'ADJUSTMENT', 'SERVICE', 'LOSS')),
  quantity_change INT NOT NULL,
  unit_price      NUMERIC DEFAULT 0,
  reference_entity TEXT CHECK (reference_entity IN ('sale', 'purchase', 'service', 'adjustment')),
  reference_id    TEXT,
  performed_by    UUID REFERENCES auth.users(id),
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_stock_movements_org ON stock_movements(organization_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_item ON stock_movements(stock_item_id);

ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "stock_movements_select" ON stock_movements FOR SELECT USING (organization_id = get_user_org_id() OR (select auth.uid()) IN (SELECT user_id FROM platform_admins));
CREATE POLICY "stock_movements_insert" ON stock_movements FOR INSERT WITH CHECK (organization_id = get_user_org_id());
CREATE POLICY "stock_movements_update" ON stock_movements FOR UPDATE USING (organization_id = get_user_org_id());
CREATE POLICY "stock_movements_delete" ON stock_movements FOR DELETE USING (organization_id = get_user_org_id());

-- ═══════════════════════════════════════════════
-- 4. service_tickets table (Teknik Servis Kayıtları)
-- ═══════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS service_tickets (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  branch_id       UUID REFERENCES branches(id),
  patient_id      UUID REFERENCES patients(id),
  patient_name    TEXT,
  device_name     TEXT NOT NULL,
  device_serial   TEXT,
  complaint       TEXT NOT NULL,
  diagnosis       TEXT,
  repair_details  TEXT,
  parts_used      JSONB DEFAULT '[]'::JSONB,
  service_fee     NUMERIC DEFAULT 0,
  status          TEXT DEFAULT 'Bekliyor' CHECK (status IN ('Bekliyor', 'İşlemde', 'Tamamlandı', 'Teslim Edildi', 'İptal')),
  received_date   DATE NOT NULL DEFAULT CURRENT_DATE,
  completed_date  DATE,
  delivered_date  DATE,
  technician      TEXT,
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_service_tickets_org ON service_tickets(organization_id);
CREATE INDEX IF NOT EXISTS idx_service_tickets_status ON service_tickets(organization_id, status);

ALTER TABLE service_tickets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_tickets_select" ON service_tickets FOR SELECT USING (organization_id = get_user_org_id() OR (select auth.uid()) IN (SELECT user_id FROM platform_admins));
CREATE POLICY "service_tickets_insert" ON service_tickets FOR INSERT WITH CHECK (organization_id = get_user_org_id());
CREATE POLICY "service_tickets_update" ON service_tickets FOR UPDATE USING (organization_id = get_user_org_id());
CREATE POLICY "service_tickets_delete" ON service_tickets FOR DELETE USING (organization_id = get_user_org_id());

-- ═══════════════════════════════════════════════
-- 5. assets table (Demirbaşlar)
-- ═══════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS assets (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  branch_id       UUID REFERENCES branches(id),
  name            TEXT NOT NULL,
  category        TEXT NOT NULL,
  brand           TEXT,
  model           TEXT,
  serial_no       TEXT,
  purchase_date   DATE,
  purchase_price  NUMERIC DEFAULT 0,
  current_value   NUMERIC DEFAULT 0,
  location        TEXT,
  status          TEXT DEFAULT 'Aktif' CHECK (status IN ('Aktif', 'Bakımda', 'Hurda', 'Satıldı')),
  assigned_to     TEXT,
  warranty_expiry DATE,
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_assets_org ON assets(organization_id);

ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "assets_select" ON assets FOR SELECT USING (organization_id = get_user_org_id() OR (select auth.uid()) IN (SELECT user_id FROM platform_admins));
CREATE POLICY "assets_insert" ON assets FOR INSERT WITH CHECK (organization_id = get_user_org_id());
CREATE POLICY "assets_update" ON assets FOR UPDATE USING (organization_id = get_user_org_id());
CREATE POLICY "assets_delete" ON assets FOR DELETE USING (organization_id = get_user_org_id());

-- ═══════════════════════════════════════════════
-- 6. organization_settings table (Firma Ayarları)
-- ═══════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS organization_settings (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE UNIQUE,
  firm_name       TEXT,
  tax_no          TEXT,
  phone           TEXT,
  email           TEXT,
  address         TEXT,
  medula_username TEXT,
  medula_password TEXT,
  medula_facility_code TEXT,
  uts_kurum_no    TEXT,
  uts_gln         TEXT,
  uts_mersis_no   TEXT,
  efatura_enabled BOOLEAN DEFAULT FALSE,
  whatsapp_api_key TEXT,
  sms_api_key     TEXT,
  commission_rate NUMERIC DEFAULT 3,
  notification_settings JSONB DEFAULT '{}'::JSONB,
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE organization_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "org_settings_select" ON organization_settings FOR SELECT USING (organization_id = get_user_org_id() OR (select auth.uid()) IN (SELECT user_id FROM platform_admins));
CREATE POLICY "org_settings_insert" ON organization_settings FOR INSERT WITH CHECK (organization_id = get_user_org_id());
CREATE POLICY "org_settings_update" ON organization_settings FOR UPDATE USING (organization_id = get_user_org_id());
