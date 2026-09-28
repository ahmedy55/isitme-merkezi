BEGIN;
ALTER TABLE public.assets ADD COLUMN IF NOT EXISTS last_maintenance date;
ALTER TABLE public.assets ADD COLUMN IF NOT EXISTS maintenance_interval_months integer NOT NULL DEFAULT 12 CHECK(maintenance_interval_months BETWEEN 1 AND 120);
ALTER TABLE public.assets ADD COLUMN IF NOT EXISTS archived_at timestamptz;
DROP POLICY IF EXISTS scope_read ON public.assets;
CREATE POLICY scope_read ON public.assets FOR SELECT TO authenticated USING(public.tenant_access(organization_id,branch_id,ARRAY['Şube Yöneticisi','Muhasebe']) AND archived_at IS NULL);

ALTER TABLE public.memberships ADD CONSTRAINT membership_org_user_unique UNIQUE(organization_id,user_id);
CREATE TABLE public.activity_logs(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 organization_id uuid NOT NULL REFERENCES public.organizations(id),
 branch_id uuid NOT NULL,
 patient_id uuid,
 patient_name text NOT NULL CHECK(length(btrim(patient_name)) BETWEEN 1 AND 200),
 activity_type text NOT NULL CHECK(activity_type IN ('Arama','Randevu','Not Ekleme','Satış','Hasta Girişi')),
 description text NOT NULL CHECK(length(btrim(description)) BETWEEN 1 AND 3000),
 duration_minutes integer CHECK(duration_minutes BETWEEN 1 AND 1440),
 created_by uuid NOT NULL DEFAULT auth.uid(),
 created_at timestamptz NOT NULL DEFAULT now(),
 FOREIGN KEY(organization_id,branch_id) REFERENCES public.branches(organization_id,id),
 FOREIGN KEY(organization_id,patient_id) REFERENCES public.patients(organization_id,id),
 CONSTRAINT activity_member_fk FOREIGN KEY(organization_id,created_by) REFERENCES public.memberships(organization_id,user_id)
);
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY activity_read ON public.activity_logs FOR SELECT TO authenticated USING(public.tenant_access(organization_id,branch_id,ARRAY['Şube Yöneticisi','Odyolog','Odyometrist','Sekreter','Resepsiyon']));
CREATE POLICY activity_insert ON public.activity_logs FOR INSERT TO authenticated WITH CHECK(public.tenant_access(organization_id,branch_id,ARRAY['Şube Yöneticisi','Odyolog','Odyometrist','Sekreter','Resepsiyon']) AND created_by=auth.uid());
CREATE INDEX activity_logs_branch_date ON public.activity_logs(organization_id,branch_id,created_at DESC);
CREATE TRIGGER tenant_identity_guard BEFORE UPDATE ON public.activity_logs FOR EACH ROW EXECUTE FUNCTION public.guard_tenant_identity();
CREATE TRIGGER record_branch_guard BEFORE INSERT OR UPDATE ON public.activity_logs FOR EACH ROW EXECUTE FUNCTION public.guard_record_branch();
GRANT SELECT,INSERT ON public.activity_logs TO authenticated;

CREATE TABLE public.branch_transfers(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 organization_id uuid NOT NULL REFERENCES public.organizations(id),
 patient_id uuid NOT NULL,
 patient_name text NOT NULL,
 source_branch_id uuid NOT NULL,
 target_branch_id uuid NOT NULL,
 transferred_by uuid NOT NULL DEFAULT auth.uid(),
 created_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(organization_id,id),
 FOREIGN KEY(organization_id,patient_id) REFERENCES public.patients(organization_id,id),
 FOREIGN KEY(organization_id,source_branch_id) REFERENCES public.branches(organization_id,id),
 FOREIGN KEY(organization_id,target_branch_id) REFERENCES public.branches(organization_id,id),
 CHECK(source_branch_id<>target_branch_id)
);
ALTER TABLE public.branch_transfers ENABLE ROW LEVEL SECURITY;
CREATE POLICY transfer_read ON public.branch_transfers FOR SELECT TO authenticated USING(public.tenant_access(organization_id,source_branch_id,ARRAY['Firma Yöneticisi']) OR public.tenant_access(organization_id,target_branch_id,ARRAY['Firma Yöneticisi']));
CREATE POLICY transfer_insert ON public.branch_transfers FOR INSERT TO authenticated WITH CHECK(public.tenant_access(organization_id,source_branch_id,ARRAY['Firma Yöneticisi']) AND transferred_by=auth.uid());
CREATE TRIGGER tenant_identity_guard BEFORE UPDATE ON public.branch_transfers FOR EACH ROW EXECUTE FUNCTION public.guard_tenant_identity();
GRANT SELECT,INSERT ON public.branch_transfers TO authenticated;

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
 IF TG_OP='UPDATE' AND NEW.branch_id IS DISTINCT FROM OLD.branch_id AND NOT(
   TG_TABLE_NAME='patients' AND current_setting('app.patient_branch_transfer',true)=OLD.id::text AND public.has_any_role('{}'::text[])
 ) THEN RAISE EXCEPTION 'Use the authorized patient transfer workflow'; END IF;
 RETURN NEW;
END $$;

CREATE FUNCTION public.transfer_patient_branch(p_patient uuid,p_target uuid,p_request uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path=public,pg_temp AS $$
DECLARE org uuid:=public.get_user_org_id(); patient public.patients; target public.branches; prior public.branch_transfers; created public.branch_transfers;
BEGIN
 IF org IS NULL OR NOT public.has_any_role('{}'::text[]) THEN RAISE EXCEPTION 'Company manager permission required'; END IF;
 IF p_request IS NULL THEN RAISE EXCEPTION 'Request ID required'; END IF;
 SELECT * INTO prior FROM public.branch_transfers WHERE organization_id=org AND id=p_request;
 IF FOUND THEN
   IF prior.patient_id<>p_patient OR prior.target_branch_id<>p_target THEN RAISE EXCEPTION 'Transfer request mismatch'; END IF;
   RETURN to_jsonb(prior);
 END IF;
 SELECT * INTO patient FROM public.patients WHERE id=p_patient AND organization_id=org AND deleted_at IS NULL FOR UPDATE;
 IF NOT FOUND OR patient.branch_id IS NULL THEN RAISE EXCEPTION 'Patient or source branch missing'; END IF;
 SELECT * INTO target FROM public.branches WHERE id=p_target AND organization_id=org AND status='active';
 IF NOT FOUND OR target.id=patient.branch_id THEN RAISE EXCEPTION 'Target branch invalid'; END IF;
 INSERT INTO public.branch_transfers(id,organization_id,patient_id,patient_name,source_branch_id,target_branch_id,transferred_by)
 VALUES(p_request,org,patient.id,patient.first_name||' '||patient.last_name,patient.branch_id,target.id,auth.uid()) RETURNING * INTO created;
 PERFORM set_config('app.patient_branch_transfer',patient.id::text,true);
 UPDATE public.patients SET branch_id=target.id WHERE id=patient.id AND organization_id=org;
 RETURN to_jsonb(created);
END $$;
REVOKE ALL ON FUNCTION public.transfer_patient_branch(uuid,uuid,uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.transfer_patient_branch(uuid,uuid,uuid) TO authenticated;
COMMIT;
