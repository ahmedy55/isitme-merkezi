-- =========================================================================
-- AudiPro SaaS — Supabase Initial Multi-Tenant Schema (001_initial_schema.sql)
-- =========================================================================

-- Enable moddatetime extension if needed (we'll write custom updated_at trigger for simplicity)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ═══════════════════════════════════════════════
-- 1. Tablo Oluşturma
-- ═══════════════════════════════════════════════

-- 1.1 organizations (Firmalar / Kiracılar)
CREATE TABLE organizations (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  slug          TEXT UNIQUE NOT NULL,
  logo_url      TEXT,
  phone         TEXT,
  email         TEXT,
  address       TEXT,
  tax_no        TEXT,
  plan_type     TEXT DEFAULT 'trial' CHECK (plan_type IN ('trial', 'basic', 'pro', 'enterprise')),
  subscription_status TEXT DEFAULT 'active' CHECK (subscription_status IN ('active', 'suspended', 'cancelled')),
  trial_ends_at TIMESTAMPTZ,
  max_users     INT DEFAULT 5,
  max_branches  INT DEFAULT 2,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- 1.2 branches (Şubeler)
CREATE TABLE branches (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  address         TEXT,
  phone           TEXT,
  status          TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- 1.3 memberships (Kullanıcı ↔ Firma ↔ Rol bağı)
CREATE TABLE memberships (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  roles           TEXT[] NOT NULL DEFAULT '{}'::TEXT[],
  branch_id       UUID REFERENCES branches(id) ON DELETE SET NULL,
  status          TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'invited')),
  invited_at      TIMESTAMPTZ,
  joined_at       TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, organization_id)
);

-- 1.4 patients (Hastalar)
CREATE TABLE patients (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id     UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  tc                  TEXT NOT NULL,
  first_name          TEXT NOT NULL,
  last_name           TEXT NOT NULL,
  phone               TEXT NOT NULL,
  email               TEXT,
  birth_date          DATE,
  gender              TEXT CHECK (gender IN ('Erkek', 'Kadın')),
  address             TEXT,
  hearing_loss        TEXT CHECK (hearing_loss IN ('Hafif', 'Orta', 'İleri', 'Çok İleri')),
  hearing_loss_side   TEXT CHECK (hearing_loss_side IN ('Sol', 'Sağ', 'Her İki Kulak')),
  current_device      TEXT,
  device_date         DATE,
  sgk_status          TEXT CHECK (sgk_status IN ('Aktif', 'Pasif', 'Yenileme Hakkı Var')),
  sgk_renewal_date    DATE,
  sgk_insurance_status TEXT,
  patient_status      TEXT DEFAULT 'Potansiyel',
  source              TEXT,
  sales_stage         TEXT,
  doctor_name         TEXT,
  prescription_status TEXT,
  prescription_no     TEXT,
  report_no           TEXT,
  battery_size        TEXT,
  daily_usage_hours   NUMERIC,
  last_battery_purchase DATE,
  battery_pack_count  INT,
  emergency_contact_name  TEXT,
  emergency_contact_phone TEXT,
  emergency_contact_relation TEXT,
  next_action         TEXT,
  notes               TEXT,
  audiogram_left      NUMERIC[],
  audiogram_right     NUMERIC[],
  past_audiogram_left NUMERIC[],
  past_audiogram_right NUMERIC[],
  last_visit          DATE,
  consent_given       BOOLEAN DEFAULT FALSE,
  consent_date        TIMESTAMPTZ,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, tc)
);

-- 1.5 patient_timeline (Hasta Zaman Çizelgesi)
CREATE TABLE patient_timeline (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  patient_id      UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  date            TEXT NOT NULL,
  action          TEXT NOT NULL,
  icon            TEXT DEFAULT 'Plus',
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- 1.6 appointments (Randevular)
CREATE TABLE appointments (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  patient_id      UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  branch_id       UUID REFERENCES branches(id),
  date            DATE NOT NULL,
  time            TIME NOT NULL,
  type            TEXT NOT NULL,
  audiologist     TEXT,
  status          TEXT DEFAULT 'Bekliyor' CHECK (status IN ('Bekliyor', 'Geldi', 'Gelmedi', 'İptal', 'Hatırlatıldı')),
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- 1.7 stock_items (Stok)
CREATE TABLE stock_items (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id     UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  branch_id           UUID REFERENCES branches(id),
  name                TEXT NOT NULL,
  category            TEXT NOT NULL CHECK (category IN ('Cihaz', 'Pil', 'Kalıp', 'Aksesuar')),
  brand               TEXT,
  model               TEXT,
  serial_no           TEXT,
  quantity            INT DEFAULT 0,
  critical_level      INT DEFAULT 0,
  price               NUMERIC DEFAULT 0,
  sgk_price           NUMERIC DEFAULT 0,
  warranty_expiry     DATE,
  location            TEXT,
  status              TEXT DEFAULT 'Stokta' CHECK (status IN ('Stokta', 'Hastaya Ayrıldı', 'Satıldı', 'Serviste')),
  uts_status          TEXT DEFAULT 'Bekliyor' CHECK (uts_status IN ('Bekliyor', 'Bildirildi', 'Hata', 'Gerekli Değil')),
  assigned_patient_id UUID REFERENCES patients(id),
  uts_kurum_no        TEXT,
  gln                 TEXT,
  mersis_no           TEXT,
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

-- 1.8 sales (Satışlar)
CREATE TABLE sales (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  patient_id      UUID NOT NULL REFERENCES patients(id),
  date            DATE NOT NULL,
  total           NUMERIC NOT NULL DEFAULT 0,
  sgk_amount      NUMERIC DEFAULT 0,
  patient_amount  NUMERIC DEFAULT 0,
  payment_method  TEXT CHECK (payment_method IN ('Nakit', 'Kredi Kartı', 'Havale', 'Taksit')),
  status          TEXT DEFAULT 'Bekliyor' CHECK (status IN ('Tahsil Edildi', 'Bekliyor', 'Taksitli')),
  audiologist     TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- 1.9 sale_items (Satış Kalemleri)
CREATE TABLE sale_items (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id         UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  quantity        INT DEFAULT 1,
  price           NUMERIC NOT NULL,
  type            TEXT CHECK (type IN ('Cihaz', 'Pil', 'Servis Geliri', 'Aksesuar'))
);

-- 1.10 sale_installments (Taksitler)
CREATE TABLE sale_installments (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id         UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  amount          NUMERIC NOT NULL,
  due_date        DATE NOT NULL,
  paid            BOOLEAN DEFAULT FALSE
);

-- 1.11 recall_items (Hatırlatmalar)
CREATE TABLE recall_items (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id   UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  patient_id        UUID NOT NULL REFERENCES patients(id),
  reason            TEXT NOT NULL,
  due_date          DATE NOT NULL,
  status            TEXT DEFAULT 'Bekliyor',
  last_contact      DATE,
  estimated_revenue NUMERIC DEFAULT 0,
  probability       TEXT,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

-- 1.12 suppliers (Tedarikçiler)
CREATE TABLE suppliers (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  company_name    TEXT NOT NULL,
  contact_person  TEXT,
  phone           TEXT,
  email           TEXT,
  address         TEXT,
  tax_no          TEXT,
  category        TEXT,
  status          TEXT DEFAULT 'Aktif' CHECK (status IN ('Aktif', 'Pasif')),
  balance         NUMERIC DEFAULT 0,
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- 1.13 supplier_purchases (Tedarikçi Alımları)
CREATE TABLE supplier_purchases (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id     UUID NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  date            DATE NOT NULL,
  invoice_no      TEXT,
  total           NUMERIC DEFAULT 0,
  payment_status  TEXT CHECK (payment_status IN ('Ödendi', 'Bekliyor', 'Kısmi Ödendi')),
  payment_method  TEXT
);

-- 1.14 supplier_purchase_items (Tedarikçi Alım Kalemleri)
CREATE TABLE supplier_purchase_items (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_id     UUID NOT NULL REFERENCES supplier_purchases(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  quantity        INT DEFAULT 1,
  unit_price      NUMERIC NOT NULL
);

-- 1.15 expenses (Masraflar)
CREATE TABLE expenses (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  branch_id       UUID REFERENCES branches(id),
  date            DATE NOT NULL,
  category        TEXT NOT NULL,
  description     TEXT,
  amount          NUMERIC NOT NULL,
  payment_method  TEXT,
  created_by      TEXT,
  receipt_no      TEXT,
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- 1.16 audit_log (Audit Log / İşlem Kayıtları)
CREATE TABLE audit_log (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id         UUID REFERENCES auth.users(id),
  user_name       TEXT,
  action          TEXT NOT NULL,
  module          TEXT NOT NULL,
  description     TEXT,
  details         TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- 1.17 platform_admins (SaaS Platform Yöneticileri)
CREATE TABLE platform_admins (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id   UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════════════
-- 2. Trigger ve Yardımcı Fonksiyonlar
-- ═══════════════════════════════════════════════

-- 2.1 updated_at Otomatik Güncelleme Triggerı
CREATE OR REPLACE FUNCTION trigger_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at BEFORE UPDATE ON organizations
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON patients
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- 2.2 Billing/Plan Koruma Triggerı (Firma yöneticileri kritik alanları güncelleyemez)
CREATE OR REPLACE FUNCTION trigger_protect_organization_billing()
RETURNS TRIGGER AS $$
BEGIN
  -- Platform admin (platform_admins tablosunda olanlar) ise her değişikliğe izin ver
  IF EXISTS (SELECT 1 FROM platform_admins WHERE user_id = (select auth.uid())) THEN
    RETURN NEW;
  END IF;

  -- Kritik alanların değişimini kısıtla
  IF (OLD.plan_type IS DISTINCT FROM NEW.plan_type) OR
     (OLD.subscription_status IS DISTINCT FROM NEW.subscription_status) OR
     (OLD.trial_ends_at IS DISTINCT FROM NEW.trial_ends_at) OR
     (OLD.max_users IS DISTINCT FROM NEW.max_users) OR
     (OLD.max_branches IS DISTINCT FROM NEW.max_branches) THEN
    RAISE EXCEPTION 'Plan ve abonelik limitleri sadece platform yöneticisi tarafından güncellenebilir.';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER protect_organization_billing BEFORE UPDATE ON organizations
  FOR EACH ROW EXECUTE FUNCTION trigger_protect_organization_billing();

-- ═══════════════════════════════════════════════
-- 3. İndeksler (Performans)
-- ═══════════════════════════════════════════════

CREATE INDEX idx_organizations_slug ON organizations(slug);
CREATE INDEX idx_platform_admins_user ON platform_admins(user_id);

CREATE INDEX idx_patients_org      ON patients(organization_id);
CREATE INDEX idx_appointments_org  ON appointments(organization_id);
CREATE INDEX idx_stock_items_org   ON stock_items(organization_id);
CREATE INDEX idx_sales_org         ON sales(organization_id);
CREATE INDEX idx_sale_items_org    ON sale_items(organization_id);
CREATE INDEX idx_sale_installments_org ON sale_installments(organization_id);
CREATE INDEX idx_recall_items_org  ON recall_items(organization_id);
CREATE INDEX idx_suppliers_org     ON suppliers(organization_id);
CREATE INDEX idx_supplier_purchases_org ON supplier_purchases(organization_id);
CREATE INDEX idx_supplier_purchase_items_org ON supplier_purchase_items(organization_id);
CREATE INDEX idx_expenses_org      ON expenses(organization_id);
CREATE INDEX idx_audit_log_org     ON audit_log(organization_id);
CREATE INDEX idx_branches_org      ON branches(organization_id);
CREATE INDEX idx_memberships_org   ON memberships(organization_id);
CREATE INDEX idx_memberships_user  ON memberships(user_id);
CREATE INDEX idx_patient_timeline_org ON patient_timeline(organization_id);
CREATE INDEX idx_patient_timeline_patient ON patient_timeline(patient_id);

CREATE INDEX idx_patients_tc       ON patients(organization_id, tc);
CREATE INDEX idx_patients_status   ON patients(organization_id, patient_status);
CREATE INDEX idx_appointments_date ON appointments(organization_id, date);
CREATE INDEX idx_stock_category    ON stock_items(organization_id, category);
CREATE INDEX idx_sales_date        ON sales(organization_id, date);
CREATE INDEX idx_expenses_date     ON expenses(organization_id, date);
CREATE INDEX idx_audit_log_time    ON audit_log(organization_id, created_at DESC);

-- ═══════════════════════════════════════════════
-- 4. Row Level Security (RLS) Tanımlamaları
-- ═══════════════════════════════════════════════

-- 4.1 Aktif Organizasyon JWT Helper Fonksiyonu
CREATE OR REPLACE FUNCTION get_user_org_id()
RETURNS UUID AS $$
  SELECT ((auth.jwt() -> 'app_metadata') ->> 'organization_id')::UUID;
$$ LANGUAGE sql STABLE;

-- 4.2 Tablolara RLS Uygulanması ve Politikaları

-- 4.2.1 platform_admins (SaaS Platform Yöneticileri)
ALTER TABLE platform_admins ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Sadece platform admin kendi listesini görebilir" ON platform_admins
  FOR SELECT USING ((select auth.uid()) IN (SELECT user_id FROM platform_admins));

-- 4.2.2 organizations (Organizasyonlar)
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Kullanıcı kendi firmasının bilgilerini görebilir" ON organizations
  FOR SELECT USING (id = get_user_org_id());
CREATE POLICY "Firma yöneticisi kendi firma bilgilerini güncelleyebilir" ON organizations
  FOR UPDATE USING (
    id = get_user_org_id()
    AND (
      EXISTS (
        SELECT 1 FROM memberships 
        WHERE user_id = (select auth.uid()) 
          AND organization_id = id 
          AND 'Firma Yöneticisi' = ANY(roles)
          AND status = 'active'
      )
    )
  );
CREATE POLICY "Platform admin tüm firmaları yönetebilir" ON organizations
  FOR ALL USING ((select auth.uid()) IN (SELECT user_id FROM platform_admins));

-- 4.2.3 memberships (Kullanıcı-Firma Üyelikleri)
ALTER TABLE memberships ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Kullanıcı kendi üyeliklerini her zaman görebilir" ON memberships
  FOR SELECT USING (user_id = (select auth.uid()) OR (select auth.uid()) IN (SELECT user_id FROM platform_admins));
CREATE POLICY "Firma yöneticisi kendi firmasına üye ekleyebilir" ON memberships
  FOR INSERT WITH CHECK (organization_id = get_user_org_id());
CREATE POLICY "Firma yöneticisi kendi firmasının üyeliklerini güncelleyebilir" ON memberships
  FOR UPDATE USING (organization_id = get_user_org_id());
CREATE POLICY "Firma yöneticisi kendi firmasından üye çıkarabilir" ON memberships
  FOR DELETE USING (organization_id = get_user_org_id());

-- 4.2.4 patients (Hastalar)
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "patients_select" ON patients FOR SELECT USING (organization_id = get_user_org_id() OR (select auth.uid()) IN (SELECT user_id FROM platform_admins));
CREATE POLICY "patients_insert" ON patients FOR INSERT WITH CHECK (organization_id = get_user_org_id());
CREATE POLICY "patients_update" ON patients FOR UPDATE USING (organization_id = get_user_org_id());
CREATE POLICY "patients_delete" ON patients FOR DELETE USING (organization_id = get_user_org_id());

-- 4.2.5 patient_timeline (Hasta Geçmişi)
ALTER TABLE patient_timeline ENABLE ROW LEVEL SECURITY;
CREATE POLICY "patient_timeline_select" ON patient_timeline FOR SELECT USING (organization_id = get_user_org_id() OR (select auth.uid()) IN (SELECT user_id FROM platform_admins));
CREATE POLICY "patient_timeline_insert" ON patient_timeline FOR INSERT WITH CHECK (organization_id = get_user_org_id());
CREATE POLICY "patient_timeline_update" ON patient_timeline FOR UPDATE USING (organization_id = get_user_org_id());
CREATE POLICY "patient_timeline_delete" ON patient_timeline FOR DELETE USING (organization_id = get_user_org_id());

-- 4.2.6 appointments (Randevular)
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "appointments_select" ON appointments FOR SELECT USING (organization_id = get_user_org_id() OR (select auth.uid()) IN (SELECT user_id FROM platform_admins));
CREATE POLICY "appointments_insert" ON appointments FOR INSERT WITH CHECK (organization_id = get_user_org_id());
CREATE POLICY "appointments_update" ON appointments FOR UPDATE USING (organization_id = get_user_org_id());
CREATE POLICY "appointments_delete" ON appointments FOR DELETE USING (organization_id = get_user_org_id());

-- 4.2.7 stock_items (Stok)
ALTER TABLE stock_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "stock_items_select" ON stock_items FOR SELECT USING (organization_id = get_user_org_id() OR (select auth.uid()) IN (SELECT user_id FROM platform_admins));
CREATE POLICY "stock_items_insert" ON stock_items FOR INSERT WITH CHECK (organization_id = get_user_org_id());
CREATE POLICY "stock_items_update" ON stock_items FOR UPDATE USING (organization_id = get_user_org_id());
CREATE POLICY "stock_items_delete" ON stock_items FOR DELETE USING (organization_id = get_user_org_id());

-- 4.2.8 sales (Satışlar)
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sales_select" ON sales FOR SELECT USING (organization_id = get_user_org_id() OR (select auth.uid()) IN (SELECT user_id FROM platform_admins));
CREATE POLICY "sales_insert" ON sales FOR INSERT WITH CHECK (organization_id = get_user_org_id());
CREATE POLICY "sales_update" ON sales FOR UPDATE USING (organization_id = get_user_org_id());
CREATE POLICY "sales_delete" ON sales FOR DELETE USING (organization_id = get_user_org_id());

-- 4.2.9 sale_items (Satış Detay Kalemleri)
ALTER TABLE sale_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sale_items_select" ON sale_items FOR SELECT USING (organization_id = get_user_org_id() OR (select auth.uid()) IN (SELECT user_id FROM platform_admins));
CREATE POLICY "sale_items_insert" ON sale_items FOR INSERT WITH CHECK (organization_id = get_user_org_id());
CREATE POLICY "sale_items_update" ON sale_items FOR UPDATE USING (organization_id = get_user_org_id());
CREATE POLICY "sale_items_delete" ON sale_items FOR DELETE USING (organization_id = get_user_org_id());

-- 4.2.10 sale_installments (Satış Taksitleri)
ALTER TABLE sale_installments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sale_installments_select" ON sale_installments FOR SELECT USING (organization_id = get_user_org_id() OR (select auth.uid()) IN (SELECT user_id FROM platform_admins));
CREATE POLICY "sale_installments_insert" ON sale_installments FOR INSERT WITH CHECK (organization_id = get_user_org_id());
CREATE POLICY "sale_installments_update" ON sale_installments FOR UPDATE USING (organization_id = get_user_org_id());
CREATE POLICY "sale_installments_delete" ON sale_installments FOR DELETE USING (organization_id = get_user_org_id());

-- 4.2.11 recall_items (Hatırlatmalar)
ALTER TABLE recall_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "recall_items_select" ON recall_items FOR SELECT USING (organization_id = get_user_org_id() OR (select auth.uid()) IN (SELECT user_id FROM platform_admins));
CREATE POLICY "recall_items_insert" ON recall_items FOR INSERT WITH CHECK (organization_id = get_user_org_id());
CREATE POLICY "recall_items_update" ON recall_items FOR UPDATE USING (organization_id = get_user_org_id());
CREATE POLICY "recall_items_delete" ON recall_items FOR DELETE USING (organization_id = get_user_org_id());

-- 4.2.12 suppliers (Tedarikçiler)
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "suppliers_select" ON suppliers FOR SELECT USING (organization_id = get_user_org_id() OR (select auth.uid()) IN (SELECT user_id FROM platform_admins));
CREATE POLICY "suppliers_insert" ON suppliers FOR INSERT WITH CHECK (organization_id = get_user_org_id());
CREATE POLICY "suppliers_update" ON suppliers FOR UPDATE USING (organization_id = get_user_org_id());
CREATE POLICY "suppliers_delete" ON suppliers FOR DELETE USING (organization_id = get_user_org_id());

-- 4.2.13 supplier_purchases (Tedarikçi Siparişleri)
ALTER TABLE supplier_purchases ENABLE ROW LEVEL SECURITY;
CREATE POLICY "supplier_purchases_select" ON supplier_purchases FOR SELECT USING (organization_id = get_user_org_id() OR (select auth.uid()) IN (SELECT user_id FROM platform_admins));
CREATE POLICY "supplier_purchases_insert" ON supplier_purchases FOR INSERT WITH CHECK (organization_id = get_user_org_id());
CREATE POLICY "supplier_purchases_update" ON supplier_purchases FOR UPDATE USING (organization_id = get_user_org_id());
CREATE POLICY "supplier_purchases_delete" ON supplier_purchases FOR DELETE USING (organization_id = get_user_org_id());

-- 4.2.14 supplier_purchase_items (Sipariş Kalemleri)
ALTER TABLE supplier_purchase_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "supplier_purchase_items_select" ON supplier_purchase_items FOR SELECT USING (organization_id = get_user_org_id() OR (select auth.uid()) IN (SELECT user_id FROM platform_admins));
CREATE POLICY "supplier_purchase_items_insert" ON supplier_purchase_items FOR INSERT WITH CHECK (organization_id = get_user_org_id());
CREATE POLICY "supplier_purchase_items_update" ON supplier_purchase_items FOR UPDATE USING (organization_id = get_user_org_id());
CREATE POLICY "supplier_purchase_items_delete" ON supplier_purchase_items FOR DELETE USING (organization_id = get_user_org_id());

-- 4.2.15 expenses (Masraflar)
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "expenses_select" ON expenses FOR SELECT USING (organization_id = get_user_org_id() OR (select auth.uid()) IN (SELECT user_id FROM platform_admins));
CREATE POLICY "expenses_insert" ON expenses FOR INSERT WITH CHECK (organization_id = get_user_org_id());
CREATE POLICY "expenses_update" ON expenses FOR UPDATE USING (organization_id = get_user_org_id());
CREATE POLICY "expenses_delete" ON expenses FOR DELETE USING (organization_id = get_user_org_id());

-- 4.2.16 audit_log (İşlem Günlükleri)
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "audit_log_select" ON audit_log FOR SELECT USING (organization_id = get_user_org_id() OR (select auth.uid()) IN (SELECT user_id FROM platform_admins));
CREATE POLICY "audit_log_insert" ON audit_log FOR INSERT WITH CHECK (organization_id = get_user_org_id());
CREATE POLICY "audit_log_update" ON audit_log FOR UPDATE USING (organization_id = get_user_org_id());
CREATE POLICY "audit_log_delete" ON audit_log FOR DELETE USING (organization_id = get_user_org_id());

-- 4.2.17 branches (Şubeler)
ALTER TABLE branches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "branches_select" ON branches FOR SELECT USING (organization_id = get_user_org_id() OR (select auth.uid()) IN (SELECT user_id FROM platform_admins));
CREATE POLICY "branches_insert" ON branches FOR INSERT WITH CHECK (organization_id = get_user_org_id());
CREATE POLICY "branches_update" ON branches FOR UPDATE USING (organization_id = get_user_org_id());
CREATE POLICY "branches_delete" ON branches FOR DELETE USING (organization_id = get_user_org_id());
