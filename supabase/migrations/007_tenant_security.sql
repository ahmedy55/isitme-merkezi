-- Apply only to AudiPro, after 001-006. Review on a staging clone first.
-- Legacy null-branch rows remain visible only to company managers; no guessed backfill.
BEGIN;
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS branch_id uuid REFERENCES public.branches(id);
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS branch_id uuid REFERENCES public.branches(id);

CREATE OR REPLACE FUNCTION public.get_user_org_id() RETURNS uuid
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
 SELECT m.organization_id FROM public.memberships m
 JOIN public.organizations o ON o.id=m.organization_id
 WHERE m.user_id=auth.uid() AND m.status='active'
 AND m.organization_id::text=auth.jwt()->'app_metadata'->>'organization_id'
 AND o.subscription_status='active'
 AND (o.plan_type <> 'trial' OR o.trial_ends_at IS NULL OR o.trial_ends_at > now())
 LIMIT 1
$$;
CREATE OR REPLACE FUNCTION public.get_user_roles() RETURNS text[]
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
 SELECT coalesce((SELECT roles FROM public.memberships WHERE user_id=auth.uid()
 AND organization_id=public.get_user_org_id() AND status='active'), '{}'::text[])
$$;
CREATE OR REPLACE FUNCTION public.get_user_branch_id() RETURNS uuid
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
 SELECT branch_id FROM public.memberships WHERE user_id=auth.uid()
 AND organization_id=public.get_user_org_id() AND status='active'
$$;
CREATE OR REPLACE FUNCTION public.has_any_role(required_roles text[]) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
 SELECT public.get_user_roles() && (required_roles || ARRAY['Firma Yöneticisi'])
$$;
CREATE OR REPLACE FUNCTION public.matches_user_branch(item_branch_id uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
 SELECT public.has_any_role('{}'::text[]) OR
 (item_branch_id IS NOT NULL AND item_branch_id=public.get_user_branch_id())
$$;
CREATE OR REPLACE FUNCTION public.tenant_access(org uuid, branch uuid, allowed text[]) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
 SELECT coalesce(org=public.get_user_org_id() AND public.has_any_role(allowed)
 AND public.matches_user_branch(branch),false)
$$;

-- Canonicalize only known historical company-manager aliases.
UPDATE public.memberships SET roles=array_replace(array_replace(roles,'admin','Firma Yöneticisi'),'firma_yoneticisi','Firma Yöneticisi')
WHERE roles && ARRAY['admin','firma_yoneticisi'];

-- Explicit policies replace ALL previous policies (permissive policies combine with OR).
DO $$ DECLARE r record; BEGIN
 FOR r IN SELECT schemaname,tablename,policyname FROM pg_policies WHERE schemaname='public'
 AND tablename IN ('organizations','memberships','profiles','branches','patients','patient_timeline','appointments',
 'stock_items','sales','sale_items','sale_installments','recall_items','suppliers','supplier_purchases',
 'supplier_purchase_items','expenses','audit_log','cash_transactions','stock_movements','service_tickets',
 'assets','organization_settings','platform_admins') LOOP
 EXECUTE format('DROP POLICY %I ON %I.%I',r.policyname,r.schemaname,r.tablename);
 END LOOP;
END $$;

ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
CREATE POLICY scope_read ON public.patients FOR SELECT TO authenticated USING (public.tenant_access(organization_id,branch_id,ARRAY['Şube Yöneticisi','Odyolog','Odyometrist','Sekreter','Resepsiyon']) AND deleted_at IS NULL);
CREATE POLICY scope_insert ON public.patients FOR INSERT TO authenticated WITH CHECK (public.tenant_access(organization_id,branch_id,ARRAY['Şube Yöneticisi','Odyolog','Odyometrist','Sekreter','Resepsiyon']));
CREATE POLICY scope_update ON public.patients FOR UPDATE TO authenticated USING (public.tenant_access(organization_id,branch_id,ARRAY['Şube Yöneticisi','Odyolog','Odyometrist','Sekreter','Resepsiyon'])) WITH CHECK (public.tenant_access(organization_id,branch_id,ARRAY['Şube Yöneticisi','Odyolog','Odyometrist','Sekreter','Resepsiyon']));
CREATE POLICY scope_delete ON public.patients FOR DELETE TO authenticated USING (public.tenant_access(organization_id,branch_id,ARRAY['Şube Yöneticisi','Odyolog','Odyometrist','Sekreter','Resepsiyon']));

ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
CREATE POLICY scope_read ON public.appointments FOR SELECT TO authenticated USING (public.tenant_access(organization_id,branch_id,ARRAY['Şube Yöneticisi','Odyolog','Odyometrist','Sekreter','Resepsiyon']) AND deleted_at IS NULL);
CREATE POLICY scope_insert ON public.appointments FOR INSERT TO authenticated WITH CHECK (public.tenant_access(organization_id,branch_id,ARRAY['Şube Yöneticisi','Odyolog','Odyometrist','Sekreter','Resepsiyon']));
CREATE POLICY scope_update ON public.appointments FOR UPDATE TO authenticated USING (public.tenant_access(organization_id,branch_id,ARRAY['Şube Yöneticisi','Odyolog','Odyometrist','Sekreter','Resepsiyon'])) WITH CHECK (public.tenant_access(organization_id,branch_id,ARRAY['Şube Yöneticisi','Odyolog','Odyometrist','Sekreter','Resepsiyon']));
CREATE POLICY scope_delete ON public.appointments FOR DELETE TO authenticated USING (public.tenant_access(organization_id,branch_id,ARRAY['Şube Yöneticisi','Odyolog','Odyometrist','Sekreter','Resepsiyon']));

ALTER TABLE public.stock_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY scope_read ON public.stock_items FOR SELECT TO authenticated USING (public.tenant_access(organization_id,branch_id,ARRAY['Şube Yöneticisi','Odyolog','Odyometrist','Sekreter','Resepsiyon']) AND deleted_at IS NULL);
CREATE POLICY scope_insert ON public.stock_items FOR INSERT TO authenticated WITH CHECK (public.tenant_access(organization_id,branch_id,ARRAY['Şube Yöneticisi','Odyolog','Odyometrist','Sekreter','Resepsiyon']));
CREATE POLICY scope_update ON public.stock_items FOR UPDATE TO authenticated USING (public.tenant_access(organization_id,branch_id,ARRAY['Şube Yöneticisi','Odyolog','Odyometrist','Sekreter','Resepsiyon'])) WITH CHECK (public.tenant_access(organization_id,branch_id,ARRAY['Şube Yöneticisi','Odyolog','Odyometrist','Sekreter','Resepsiyon']));
CREATE POLICY scope_delete ON public.stock_items FOR DELETE TO authenticated USING (public.tenant_access(organization_id,branch_id,ARRAY['Şube Yöneticisi','Odyolog','Odyometrist','Sekreter','Resepsiyon']));

ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
CREATE POLICY scope_read ON public.sales FOR SELECT TO authenticated USING (public.tenant_access(organization_id,branch_id,ARRAY['Şube Yöneticisi','Muhasebe']) AND deleted_at IS NULL);
CREATE POLICY scope_insert ON public.sales FOR INSERT TO authenticated WITH CHECK (public.tenant_access(organization_id,branch_id,ARRAY['Şube Yöneticisi','Muhasebe']));
CREATE POLICY scope_update ON public.sales FOR UPDATE TO authenticated USING (public.tenant_access(organization_id,branch_id,ARRAY['Şube Yöneticisi','Muhasebe'])) WITH CHECK (public.tenant_access(organization_id,branch_id,ARRAY['Şube Yöneticisi','Muhasebe']));
CREATE POLICY scope_delete ON public.sales FOR DELETE TO authenticated USING (public.tenant_access(organization_id,branch_id,ARRAY['Şube Yöneticisi','Muhasebe']));

ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
CREATE POLICY scope_read ON public.expenses FOR SELECT TO authenticated USING (public.tenant_access(organization_id,branch_id,ARRAY['Şube Yöneticisi','Muhasebe']) AND deleted_at IS NULL);
CREATE POLICY scope_insert ON public.expenses FOR INSERT TO authenticated WITH CHECK (public.tenant_access(organization_id,branch_id,ARRAY['Şube Yöneticisi','Muhasebe']));
CREATE POLICY scope_update ON public.expenses FOR UPDATE TO authenticated USING (public.tenant_access(organization_id,branch_id,ARRAY['Şube Yöneticisi','Muhasebe'])) WITH CHECK (public.tenant_access(organization_id,branch_id,ARRAY['Şube Yöneticisi','Muhasebe']));
CREATE POLICY scope_delete ON public.expenses FOR DELETE TO authenticated USING (public.tenant_access(organization_id,branch_id,ARRAY['Şube Yöneticisi','Muhasebe']));

ALTER TABLE public.cash_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY scope_read ON public.cash_transactions FOR SELECT TO authenticated USING (public.tenant_access(organization_id,branch_id,ARRAY['Şube Yöneticisi','Muhasebe']));
CREATE POLICY scope_insert ON public.cash_transactions FOR INSERT TO authenticated WITH CHECK (public.tenant_access(organization_id,branch_id,ARRAY['Şube Yöneticisi','Muhasebe']));
CREATE POLICY scope_update ON public.cash_transactions FOR UPDATE TO authenticated USING (public.tenant_access(organization_id,branch_id,ARRAY['Şube Yöneticisi','Muhasebe'])) WITH CHECK (public.tenant_access(organization_id,branch_id,ARRAY['Şube Yöneticisi','Muhasebe']));
CREATE POLICY scope_delete ON public.cash_transactions FOR DELETE TO authenticated USING (public.tenant_access(organization_id,branch_id,ARRAY['Şube Yöneticisi','Muhasebe']));

ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;
CREATE POLICY scope_read ON public.stock_movements FOR SELECT TO authenticated USING (public.tenant_access(organization_id,branch_id,ARRAY['Şube Yöneticisi','Muhasebe']));
CREATE POLICY scope_insert ON public.stock_movements FOR INSERT TO authenticated WITH CHECK (public.tenant_access(organization_id,branch_id,ARRAY['Şube Yöneticisi','Muhasebe']));
CREATE POLICY scope_update ON public.stock_movements FOR UPDATE TO authenticated USING (public.tenant_access(organization_id,branch_id,ARRAY['Şube Yöneticisi','Muhasebe'])) WITH CHECK (public.tenant_access(organization_id,branch_id,ARRAY['Şube Yöneticisi','Muhasebe']));
CREATE POLICY scope_delete ON public.stock_movements FOR DELETE TO authenticated USING (public.tenant_access(organization_id,branch_id,ARRAY['Şube Yöneticisi','Muhasebe']));

ALTER TABLE public.service_tickets ENABLE ROW LEVEL SECURITY;
CREATE POLICY scope_read ON public.service_tickets FOR SELECT TO authenticated USING (public.tenant_access(organization_id,branch_id,ARRAY['Şube Yöneticisi','Odyolog','Odyometrist','Sekreter','Resepsiyon']));
CREATE POLICY scope_insert ON public.service_tickets FOR INSERT TO authenticated WITH CHECK (public.tenant_access(organization_id,branch_id,ARRAY['Şube Yöneticisi','Odyolog','Odyometrist','Sekreter','Resepsiyon']));
CREATE POLICY scope_update ON public.service_tickets FOR UPDATE TO authenticated USING (public.tenant_access(organization_id,branch_id,ARRAY['Şube Yöneticisi','Odyolog','Odyometrist','Sekreter','Resepsiyon'])) WITH CHECK (public.tenant_access(organization_id,branch_id,ARRAY['Şube Yöneticisi','Odyolog','Odyometrist','Sekreter','Resepsiyon']));
CREATE POLICY scope_delete ON public.service_tickets FOR DELETE TO authenticated USING (public.tenant_access(organization_id,branch_id,ARRAY['Şube Yöneticisi','Odyolog','Odyometrist','Sekreter','Resepsiyon']));

ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;
CREATE POLICY scope_read ON public.assets FOR SELECT TO authenticated USING (public.tenant_access(organization_id,branch_id,ARRAY['Şube Yöneticisi','Muhasebe']));
CREATE POLICY scope_insert ON public.assets FOR INSERT TO authenticated WITH CHECK (public.tenant_access(organization_id,branch_id,ARRAY['Şube Yöneticisi','Muhasebe']));
CREATE POLICY scope_update ON public.assets FOR UPDATE TO authenticated USING (public.tenant_access(organization_id,branch_id,ARRAY['Şube Yöneticisi','Muhasebe'])) WITH CHECK (public.tenant_access(organization_id,branch_id,ARRAY['Şube Yöneticisi','Muhasebe']));
CREATE POLICY scope_delete ON public.assets FOR DELETE TO authenticated USING (public.tenant_access(organization_id,branch_id,ARRAY['Şube Yöneticisi','Muhasebe']));

ALTER TABLE public.patient_timeline ENABLE ROW LEVEL SECURITY;
CREATE POLICY scope_read ON public.patient_timeline FOR SELECT TO authenticated USING (organization_id=public.get_user_org_id() AND EXISTS(SELECT 1 FROM public.patients p WHERE p.id=patient_timeline.patient_id AND p.organization_id=patient_timeline.organization_id AND public.tenant_access(p.organization_id,p.branch_id,ARRAY['Şube Yöneticisi','Odyolog','Odyometrist','Sekreter','Resepsiyon'])));
CREATE POLICY scope_insert ON public.patient_timeline FOR INSERT TO authenticated WITH CHECK (organization_id=public.get_user_org_id() AND EXISTS(SELECT 1 FROM public.patients p WHERE p.id=patient_timeline.patient_id AND p.organization_id=patient_timeline.organization_id AND public.tenant_access(p.organization_id,p.branch_id,ARRAY['Şube Yöneticisi','Odyolog','Odyometrist','Sekreter','Resepsiyon'])));
CREATE POLICY scope_update ON public.patient_timeline FOR UPDATE TO authenticated USING (organization_id=public.get_user_org_id() AND EXISTS(SELECT 1 FROM public.patients p WHERE p.id=patient_timeline.patient_id AND p.organization_id=patient_timeline.organization_id AND public.tenant_access(p.organization_id,p.branch_id,ARRAY['Şube Yöneticisi','Odyolog','Odyometrist','Sekreter','Resepsiyon']))) WITH CHECK (organization_id=public.get_user_org_id() AND EXISTS(SELECT 1 FROM public.patients p WHERE p.id=patient_timeline.patient_id AND p.organization_id=patient_timeline.organization_id AND public.tenant_access(p.organization_id,p.branch_id,ARRAY['Şube Yöneticisi','Odyolog','Odyometrist','Sekreter','Resepsiyon'])));
CREATE POLICY scope_delete ON public.patient_timeline FOR DELETE TO authenticated USING (organization_id=public.get_user_org_id() AND EXISTS(SELECT 1 FROM public.patients p WHERE p.id=patient_timeline.patient_id AND p.organization_id=patient_timeline.organization_id AND public.tenant_access(p.organization_id,p.branch_id,ARRAY['Şube Yöneticisi','Odyolog','Odyometrist','Sekreter','Resepsiyon'])));

ALTER TABLE public.recall_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY scope_read ON public.recall_items FOR SELECT TO authenticated USING (organization_id=public.get_user_org_id() AND EXISTS(SELECT 1 FROM public.patients p WHERE p.id=recall_items.patient_id AND p.organization_id=recall_items.organization_id AND public.tenant_access(p.organization_id,p.branch_id,ARRAY['Şube Yöneticisi','Odyolog','Odyometrist','Sekreter','Resepsiyon'])));
CREATE POLICY scope_insert ON public.recall_items FOR INSERT TO authenticated WITH CHECK (organization_id=public.get_user_org_id() AND EXISTS(SELECT 1 FROM public.patients p WHERE p.id=recall_items.patient_id AND p.organization_id=recall_items.organization_id AND public.tenant_access(p.organization_id,p.branch_id,ARRAY['Şube Yöneticisi','Odyolog','Odyometrist','Sekreter','Resepsiyon'])));
CREATE POLICY scope_update ON public.recall_items FOR UPDATE TO authenticated USING (organization_id=public.get_user_org_id() AND EXISTS(SELECT 1 FROM public.patients p WHERE p.id=recall_items.patient_id AND p.organization_id=recall_items.organization_id AND public.tenant_access(p.organization_id,p.branch_id,ARRAY['Şube Yöneticisi','Odyolog','Odyometrist','Sekreter','Resepsiyon']))) WITH CHECK (organization_id=public.get_user_org_id() AND EXISTS(SELECT 1 FROM public.patients p WHERE p.id=recall_items.patient_id AND p.organization_id=recall_items.organization_id AND public.tenant_access(p.organization_id,p.branch_id,ARRAY['Şube Yöneticisi','Odyolog','Odyometrist','Sekreter','Resepsiyon'])));
CREATE POLICY scope_delete ON public.recall_items FOR DELETE TO authenticated USING (organization_id=public.get_user_org_id() AND EXISTS(SELECT 1 FROM public.patients p WHERE p.id=recall_items.patient_id AND p.organization_id=recall_items.organization_id AND public.tenant_access(p.organization_id,p.branch_id,ARRAY['Şube Yöneticisi','Odyolog','Odyometrist','Sekreter','Resepsiyon'])));

ALTER TABLE public.sale_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY scope_read ON public.sale_items FOR SELECT TO authenticated USING (organization_id=public.get_user_org_id() AND EXISTS(SELECT 1 FROM public.sales p WHERE p.id=sale_items.sale_id AND p.organization_id=sale_items.organization_id AND public.tenant_access(p.organization_id,p.branch_id,ARRAY['Şube Yöneticisi','Muhasebe'])));
CREATE POLICY scope_insert ON public.sale_items FOR INSERT TO authenticated WITH CHECK (organization_id=public.get_user_org_id() AND EXISTS(SELECT 1 FROM public.sales p WHERE p.id=sale_items.sale_id AND p.organization_id=sale_items.organization_id AND public.tenant_access(p.organization_id,p.branch_id,ARRAY['Şube Yöneticisi','Muhasebe'])));
CREATE POLICY scope_update ON public.sale_items FOR UPDATE TO authenticated USING (organization_id=public.get_user_org_id() AND EXISTS(SELECT 1 FROM public.sales p WHERE p.id=sale_items.sale_id AND p.organization_id=sale_items.organization_id AND public.tenant_access(p.organization_id,p.branch_id,ARRAY['Şube Yöneticisi','Muhasebe']))) WITH CHECK (organization_id=public.get_user_org_id() AND EXISTS(SELECT 1 FROM public.sales p WHERE p.id=sale_items.sale_id AND p.organization_id=sale_items.organization_id AND public.tenant_access(p.organization_id,p.branch_id,ARRAY['Şube Yöneticisi','Muhasebe'])));
CREATE POLICY scope_delete ON public.sale_items FOR DELETE TO authenticated USING (organization_id=public.get_user_org_id() AND EXISTS(SELECT 1 FROM public.sales p WHERE p.id=sale_items.sale_id AND p.organization_id=sale_items.organization_id AND public.tenant_access(p.organization_id,p.branch_id,ARRAY['Şube Yöneticisi','Muhasebe'])));

ALTER TABLE public.sale_installments ENABLE ROW LEVEL SECURITY;
CREATE POLICY scope_read ON public.sale_installments FOR SELECT TO authenticated USING (organization_id=public.get_user_org_id() AND EXISTS(SELECT 1 FROM public.sales p WHERE p.id=sale_installments.sale_id AND p.organization_id=sale_installments.organization_id AND public.tenant_access(p.organization_id,p.branch_id,ARRAY['Şube Yöneticisi','Muhasebe'])));
CREATE POLICY scope_insert ON public.sale_installments FOR INSERT TO authenticated WITH CHECK (organization_id=public.get_user_org_id() AND EXISTS(SELECT 1 FROM public.sales p WHERE p.id=sale_installments.sale_id AND p.organization_id=sale_installments.organization_id AND public.tenant_access(p.organization_id,p.branch_id,ARRAY['Şube Yöneticisi','Muhasebe'])));
CREATE POLICY scope_update ON public.sale_installments FOR UPDATE TO authenticated USING (organization_id=public.get_user_org_id() AND EXISTS(SELECT 1 FROM public.sales p WHERE p.id=sale_installments.sale_id AND p.organization_id=sale_installments.organization_id AND public.tenant_access(p.organization_id,p.branch_id,ARRAY['Şube Yöneticisi','Muhasebe']))) WITH CHECK (organization_id=public.get_user_org_id() AND EXISTS(SELECT 1 FROM public.sales p WHERE p.id=sale_installments.sale_id AND p.organization_id=sale_installments.organization_id AND public.tenant_access(p.organization_id,p.branch_id,ARRAY['Şube Yöneticisi','Muhasebe'])));
CREATE POLICY scope_delete ON public.sale_installments FOR DELETE TO authenticated USING (organization_id=public.get_user_org_id() AND EXISTS(SELECT 1 FROM public.sales p WHERE p.id=sale_installments.sale_id AND p.organization_id=sale_installments.organization_id AND public.tenant_access(p.organization_id,p.branch_id,ARRAY['Şube Yöneticisi','Muhasebe'])));

ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
CREATE POLICY scope_read ON public.suppliers FOR SELECT TO authenticated USING (organization_id=public.get_user_org_id() AND public.has_any_role('{}'::text[]) AND deleted_at IS NULL);
CREATE POLICY scope_insert ON public.suppliers FOR INSERT TO authenticated WITH CHECK (organization_id=public.get_user_org_id() AND public.has_any_role('{}'::text[]));
CREATE POLICY scope_update ON public.suppliers FOR UPDATE TO authenticated USING (organization_id=public.get_user_org_id() AND public.has_any_role('{}'::text[])) WITH CHECK (organization_id=public.get_user_org_id() AND public.has_any_role('{}'::text[]));
CREATE POLICY scope_delete ON public.suppliers FOR DELETE TO authenticated USING (organization_id=public.get_user_org_id() AND public.has_any_role('{}'::text[]));

ALTER TABLE public.supplier_purchases ENABLE ROW LEVEL SECURITY;
CREATE POLICY scope_read ON public.supplier_purchases FOR SELECT TO authenticated USING (organization_id=public.get_user_org_id() AND public.has_any_role('{}'::text[]));
CREATE POLICY scope_insert ON public.supplier_purchases FOR INSERT TO authenticated WITH CHECK (organization_id=public.get_user_org_id() AND public.has_any_role('{}'::text[]));
CREATE POLICY scope_update ON public.supplier_purchases FOR UPDATE TO authenticated USING (organization_id=public.get_user_org_id() AND public.has_any_role('{}'::text[])) WITH CHECK (organization_id=public.get_user_org_id() AND public.has_any_role('{}'::text[]));
CREATE POLICY scope_delete ON public.supplier_purchases FOR DELETE TO authenticated USING (organization_id=public.get_user_org_id() AND public.has_any_role('{}'::text[]));

ALTER TABLE public.supplier_purchase_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY scope_read ON public.supplier_purchase_items FOR SELECT TO authenticated USING (organization_id=public.get_user_org_id() AND public.has_any_role('{}'::text[]));
CREATE POLICY scope_insert ON public.supplier_purchase_items FOR INSERT TO authenticated WITH CHECK (organization_id=public.get_user_org_id() AND public.has_any_role('{}'::text[]));
CREATE POLICY scope_update ON public.supplier_purchase_items FOR UPDATE TO authenticated USING (organization_id=public.get_user_org_id() AND public.has_any_role('{}'::text[])) WITH CHECK (organization_id=public.get_user_org_id() AND public.has_any_role('{}'::text[]));
CREATE POLICY scope_delete ON public.supplier_purchase_items FOR DELETE TO authenticated USING (organization_id=public.get_user_org_id() AND public.has_any_role('{}'::text[]));

ALTER TABLE public.organization_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY scope_read ON public.organization_settings FOR SELECT TO authenticated USING (organization_id=public.get_user_org_id() AND public.has_any_role('{}'::text[]));
CREATE POLICY scope_insert ON public.organization_settings FOR INSERT TO authenticated WITH CHECK (organization_id=public.get_user_org_id() AND public.has_any_role('{}'::text[]));
CREATE POLICY scope_update ON public.organization_settings FOR UPDATE TO authenticated USING (organization_id=public.get_user_org_id() AND public.has_any_role('{}'::text[])) WITH CHECK (organization_id=public.get_user_org_id() AND public.has_any_role('{}'::text[]));
CREATE POLICY scope_delete ON public.organization_settings FOR DELETE TO authenticated USING (organization_id=public.get_user_org_id() AND public.has_any_role('{}'::text[]));

ALTER TABLE public.branches ENABLE ROW LEVEL SECURITY;
CREATE POLICY scope_read ON public.branches FOR SELECT TO authenticated USING (public.tenant_access(organization_id,id,ARRAY['Şube Yöneticisi','Odyolog','Odyometrist','Sekreter','Resepsiyon'] || ARRAY['Şube Yöneticisi','Muhasebe']));
CREATE POLICY scope_insert ON public.branches FOR INSERT TO authenticated WITH CHECK (organization_id=public.get_user_org_id() AND public.has_any_role('{}'::text[]));
CREATE POLICY scope_update ON public.branches FOR UPDATE TO authenticated USING (public.tenant_access(organization_id,id,ARRAY['Şube Yöneticisi','Odyolog','Odyometrist','Sekreter','Resepsiyon'] || ARRAY['Şube Yöneticisi','Muhasebe'])) WITH CHECK (organization_id=public.get_user_org_id() AND public.has_any_role('{}'::text[]));
CREATE POLICY scope_delete ON public.branches FOR DELETE TO authenticated USING (public.tenant_access(organization_id,id,ARRAY['Şube Yöneticisi','Odyolog','Odyometrist','Sekreter','Resepsiyon'] || ARRAY['Şube Yöneticisi','Muhasebe']));
DROP POLICY scope_update ON public.branches; DROP POLICY scope_delete ON public.branches;
CREATE POLICY branch_update ON public.branches FOR UPDATE TO authenticated USING (organization_id=public.get_user_org_id() AND public.has_any_role('{}')) WITH CHECK (organization_id=public.get_user_org_id() AND public.has_any_role('{}'));
CREATE POLICY branch_delete ON public.branches FOR DELETE TO authenticated USING (organization_id=public.get_user_org_id() AND public.has_any_role('{}'));
ALTER TABLE public.memberships ENABLE ROW LEVEL SECURITY;
CREATE POLICY membership_read ON public.memberships FOR SELECT TO authenticated USING (user_id=auth.uid() OR (organization_id=public.get_user_org_id() AND public.has_any_role('{}')));
CREATE POLICY membership_update ON public.memberships FOR UPDATE TO authenticated USING (organization_id=public.get_user_org_id() AND public.has_any_role('{}')) WITH CHECK (organization_id=public.get_user_org_id() AND public.has_any_role('{}'));
CREATE POLICY membership_delete ON public.memberships FOR DELETE TO authenticated USING (organization_id=public.get_user_org_id() AND public.has_any_role('{}') AND user_id<>auth.uid());
-- Membership creation goes through the authenticated server provisioning endpoint only.
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
CREATE POLICY organization_read ON public.organizations FOR SELECT TO authenticated USING (id=public.get_user_org_id());
CREATE POLICY organization_update ON public.organizations FOR UPDATE TO authenticated USING (id=public.get_user_org_id() AND public.has_any_role('{}')) WITH CHECK (id=public.get_user_org_id() AND public.has_any_role('{}'));
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY profile_read ON public.profiles FOR SELECT TO authenticated USING (id=auth.uid() OR EXISTS (SELECT 1 FROM public.memberships m WHERE m.user_id=profiles.id AND m.organization_id=public.get_user_org_id() AND public.has_any_role('{}')));
CREATE POLICY profile_insert ON public.profiles FOR INSERT TO authenticated WITH CHECK (id=auth.uid());
CREATE POLICY profile_update ON public.profiles FOR UPDATE TO authenticated USING (id=auth.uid()) WITH CHECK (id=auth.uid());
ALTER TABLE public.platform_admins ENABLE ROW LEVEL SECURITY;
CREATE POLICY own_platform_marker ON public.platform_admins FOR SELECT TO authenticated USING (user_id=auth.uid());
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY audit_read ON public.audit_log FOR SELECT TO authenticated USING (organization_id=public.get_user_org_id() AND public.has_any_role('{}'));
CREATE POLICY audit_append ON public.audit_log FOR INSERT TO authenticated WITH CHECK (organization_id=public.get_user_org_id() AND user_id=auth.uid());

CREATE OR REPLACE FUNCTION public.trigger_protect_organization_billing() RETURNS trigger
LANGUAGE plpgsql SET search_path=public,pg_temp AS $$ BEGIN
 IF auth.role()='service_role' THEN RETURN NEW; END IF;
 IF (OLD.plan_type,OLD.subscription_status,OLD.trial_ends_at,OLD.max_users,OLD.max_branches)
 IS DISTINCT FROM (NEW.plan_type,NEW.subscription_status,NEW.trial_ends_at,NEW.max_users,NEW.max_branches)
 THEN RAISE EXCEPTION 'Billing fields require service role'; END IF;
 RETURN NEW;
END $$;

-- Tenant IDs are immutable. Membership identities cannot be reassigned to another Auth user.
CREATE OR REPLACE FUNCTION public.guard_tenant_identity() RETURNS trigger
LANGUAGE plpgsql SET search_path=public,pg_temp AS $$ BEGIN
 IF NEW.organization_id IS DISTINCT FROM OLD.organization_id THEN RAISE EXCEPTION 'Tenant is immutable'; END IF;
 IF TG_TABLE_NAME='memberships' AND to_jsonb(NEW)->>'user_id' IS DISTINCT FROM to_jsonb(OLD)->>'user_id' THEN RAISE EXCEPTION 'Membership user is immutable'; END IF;
 RETURN NEW;
END $$;

CREATE OR REPLACE FUNCTION public.guard_membership() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE o public.organizations; BEGIN
 SELECT * INTO o FROM public.organizations WHERE id=NEW.organization_id FOR UPDATE;
 IF NEW.roles IS NULL OR cardinality(NEW.roles)=0 OR NOT NEW.roles <@ ARRAY['Firma Yöneticisi','Şube Yöneticisi','Odyolog','Odyometrist','Sekreter','Resepsiyon','Muhasebe'] THEN RAISE EXCEPTION 'Invalid roles'; END IF;
 IF NOT ('Firma Yöneticisi'=ANY(NEW.roles)) AND NEW.branch_id IS NULL THEN RAISE EXCEPTION 'Branch assignment required'; END IF;
 IF NEW.status='active' AND (TG_OP='INSERT' OR OLD.status IS DISTINCT FROM 'active') AND
 (SELECT count(*) FROM public.memberships WHERE organization_id=NEW.organization_id AND status='active' AND id<>NEW.id)>=o.max_users THEN RAISE EXCEPTION 'User quota exceeded'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER membership_guard BEFORE INSERT OR UPDATE ON public.memberships FOR EACH ROW EXECUTE FUNCTION public.guard_membership();
CREATE OR REPLACE FUNCTION public.guard_branch_quota() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE o public.organizations; BEGIN
 SELECT * INTO o FROM public.organizations WHERE id=NEW.organization_id FOR UPDATE;
 IF NEW.status='active' AND (TG_OP='INSERT' OR OLD.status IS DISTINCT FROM 'active') AND
 (SELECT count(*) FROM public.branches WHERE organization_id=NEW.organization_id AND status='active' AND id<>NEW.id)>=o.max_branches THEN RAISE EXCEPTION 'Branch quota exceeded'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER branch_quota_guard BEFORE INSERT OR UPDATE ON public.branches FOR EACH ROW EXECUTE FUNCTION public.guard_branch_quota();

-- Validate every existing FK carrying a tenant reference; NOT VALID checks new writes immediately.
-- Existing violations must be repaired and VALIDATE CONSTRAINT executed before release.
DO $$ DECLARE r record; BEGIN
 FOR r IN SELECT table_name FROM information_schema.columns WHERE table_schema='public' AND column_name='organization_id' LOOP
 EXECUTE format('ALTER TABLE public.%I ADD CONSTRAINT %I UNIQUE(organization_id,id)',r.table_name,r.table_name||'_tenant_id_unique');
 EXECUTE format('CREATE TRIGGER tenant_identity_guard BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.guard_tenant_identity()',r.table_name);
 END LOOP;
 FOR r IN SELECT c.conrelid::regclass AS child,c.confrelid::regclass AS parent,a.attname AS col,c.conname,c.confdeltype
 FROM pg_constraint c JOIN pg_attribute a ON a.attrelid=c.conrelid AND a.attnum=c.conkey[1]
 WHERE c.contype='f' AND cardinality(c.conkey)=1
 AND c.connamespace='public'::regnamespace
 AND EXISTS(SELECT 1 FROM pg_attribute WHERE attrelid=c.conrelid AND attname='organization_id')
 AND EXISTS(SELECT 1 FROM pg_attribute WHERE attrelid=c.confrelid AND attname='organization_id') LOOP
 EXECUTE format('ALTER TABLE %s ADD CONSTRAINT %I FOREIGN KEY(organization_id,%I) REFERENCES %s(organization_id,id)%s NOT VALID',r.child,r.conname||'_tenant',r.col,r.parent,CASE WHEN r.confdeltype='c' THEN ' ON DELETE CASCADE' ELSE '' END);
 -- Keep one relationship per edge so PostgREST embedded queries are unambiguous.
 EXECUTE format('ALTER TABLE %s DROP CONSTRAINT %I',r.child,r.conname);
 END LOOP;
END $$;

-- Resolve branch on inserts from a parent or live membership, never from user-editable metadata.
CREATE OR REPLACE FUNCTION public.guard_record_branch() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE parent_branch uuid; parent_org uuid; ref text; BEGIN
 IF TG_NARGS=2 THEN
 ref=to_jsonb(NEW)->>TG_ARGV[1];
 IF ref IS NOT NULL THEN
 EXECUTE format('SELECT branch_id,organization_id FROM public.%I WHERE id=$1',TG_ARGV[0]) INTO parent_branch,parent_org USING ref::uuid;
 IF parent_org IS DISTINCT FROM NEW.organization_id THEN RAISE EXCEPTION 'Invalid tenant reference'; END IF;
 IF NEW.branch_id IS NULL THEN NEW.branch_id=parent_branch; END IF;
 IF NEW.branch_id IS DISTINCT FROM parent_branch THEN RAISE EXCEPTION 'Cross-branch reference denied'; END IF;
 END IF;
 END IF;
 IF TG_OP='INSERT' AND NEW.branch_id IS NULL AND NEW.organization_id=public.get_user_org_id() THEN NEW.branch_id=public.get_user_branch_id(); END IF;
 IF TG_OP='INSERT' AND NEW.branch_id IS NULL THEN RAISE EXCEPTION 'Explicit branch required'; END IF;
 IF TG_OP='UPDATE' AND NEW.branch_id IS DISTINCT FROM OLD.branch_id THEN RAISE EXCEPTION 'Use a reviewed branch transfer workflow'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER record_branch_guard BEFORE INSERT OR UPDATE ON public.patients FOR EACH ROW EXECUTE FUNCTION public.guard_record_branch();
CREATE TRIGGER record_branch_guard BEFORE INSERT OR UPDATE ON public.appointments FOR EACH ROW EXECUTE FUNCTION public.guard_record_branch('patients','patient_id');
CREATE TRIGGER record_branch_guard BEFORE INSERT OR UPDATE ON public.stock_items FOR EACH ROW EXECUTE FUNCTION public.guard_record_branch('patients','assigned_patient_id');
CREATE TRIGGER record_branch_guard BEFORE INSERT OR UPDATE ON public.sales FOR EACH ROW EXECUTE FUNCTION public.guard_record_branch('patients','patient_id');
CREATE TRIGGER record_branch_guard BEFORE INSERT OR UPDATE ON public.expenses FOR EACH ROW EXECUTE FUNCTION public.guard_record_branch();
CREATE TRIGGER record_branch_guard BEFORE INSERT OR UPDATE ON public.cash_transactions FOR EACH ROW EXECUTE FUNCTION public.guard_record_branch();
CREATE TRIGGER record_branch_guard BEFORE INSERT OR UPDATE ON public.stock_movements FOR EACH ROW EXECUTE FUNCTION public.guard_record_branch('stock_items','stock_item_id');
CREATE TRIGGER record_branch_guard BEFORE INSERT OR UPDATE ON public.service_tickets FOR EACH ROW EXECUTE FUNCTION public.guard_record_branch('patients','patient_id');
CREATE TRIGGER record_branch_guard BEFORE INSERT OR UPDATE ON public.assets FOR EACH ROW EXECUTE FUNCTION public.guard_record_branch();
ALTER TABLE public.stock_items ADD CONSTRAINT stock_nonnegative CHECK(quantity>=0 AND price>=0 AND purchase_price>=0) NOT VALID;
ALTER TABLE public.sales ADD CONSTRAINT sale_nonnegative CHECK(total>=0 AND sgk_amount>=0 AND patient_amount>=0) NOT VALID;
ALTER TABLE public.sale_items ADD CONSTRAINT item_positive CHECK(quantity>0 AND price>=0) NOT VALID;
ALTER TABLE public.expenses ADD CONSTRAINT expense_positive CHECK(amount>0) NOT VALID;
ALTER TABLE public.organizations ADD CONSTRAINT positive_quotas CHECK(max_users>0 AND max_branches>0) NOT VALID;
COMMIT;
