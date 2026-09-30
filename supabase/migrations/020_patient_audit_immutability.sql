-- Record patient contact and audiogram changes in the database transaction.
-- This is additive; validate on an isolated Supabase project before production.
BEGIN;

ALTER TABLE public.audit_log
  ADD COLUMN IF NOT EXISTS branch_id uuid REFERENCES public.branches(id),
  ADD COLUMN IF NOT EXISTS client_ip inet;

CREATE OR REPLACE FUNCTION public.audit_patient_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  changed_fields jsonb;
  request_headers jsonb := '{}'::jsonb;
  forwarded_ip text;
  client_address inet;
  audit_org uuid;
  audit_branch uuid;
  audit_patient_id uuid;
BEGIN
  IF TG_OP = 'UPDATE' THEN
    changed_fields := jsonb_strip_nulls(jsonb_build_object(
      'phone', CASE WHEN OLD.phone IS DISTINCT FROM NEW.phone THEN jsonb_build_object('old', OLD.phone, 'new', NEW.phone) END,
      'email', CASE WHEN OLD.email IS DISTINCT FROM NEW.email THEN jsonb_build_object('old', OLD.email, 'new', NEW.email) END,
      'address', CASE WHEN OLD.address IS DISTINCT FROM NEW.address THEN jsonb_build_object('old', OLD.address, 'new', NEW.address) END,
      'deleted_at', CASE WHEN OLD.deleted_at IS DISTINCT FROM NEW.deleted_at THEN jsonb_build_object('old', OLD.deleted_at, 'new', NEW.deleted_at) END,
      'audiogram_left', CASE WHEN OLD.audiogram_left IS DISTINCT FROM NEW.audiogram_left THEN jsonb_build_object('old', OLD.audiogram_left, 'new', NEW.audiogram_left) END,
      'audiogram_right', CASE WHEN OLD.audiogram_right IS DISTINCT FROM NEW.audiogram_right THEN jsonb_build_object('old', OLD.audiogram_right, 'new', NEW.audiogram_right) END
    ));
    IF changed_fields = '{}'::jsonb THEN RETURN NEW; END IF;
    audit_org := NEW.organization_id;
    audit_branch := NEW.branch_id;
    audit_patient_id := NEW.id;
  ELSE
    changed_fields := jsonb_build_object(
      'deleted', jsonb_build_object('old', jsonb_build_object('id', OLD.id, 'phone', OLD.phone, 'email', OLD.email, 'address', OLD.address, 'audiogram_left', OLD.audiogram_left, 'audiogram_right', OLD.audiogram_right), 'new', NULL)
    );
    audit_org := OLD.organization_id;
    audit_branch := OLD.branch_id;
    audit_patient_id := OLD.id;
  END IF;

  BEGIN
    request_headers := coalesce(nullif(current_setting('request.headers', true), '')::jsonb, '{}'::jsonb);
  EXCEPTION WHEN OTHERS THEN
    request_headers := '{}'::jsonb;
  END;
  forwarded_ip := coalesce(request_headers->>'x-real-ip', split_part(request_headers->>'x-forwarded-for', ',', 1));
  IF forwarded_ip IS NOT NULL AND btrim(forwarded_ip) <> '' THEN
    BEGIN
      client_address := forwarded_ip::inet;
    EXCEPTION WHEN OTHERS THEN
      client_address := NULL;
    END;
  END IF;

  INSERT INTO public.audit_log(organization_id, branch_id, user_id, action, module, description, details, client_ip)
  VALUES (
    audit_org,
    audit_branch,
    auth.uid(),
    CASE WHEN TG_OP = 'DELETE' THEN 'Hasta Silme' ELSE 'Hasta Verisi Değişikliği' END,
    'Hastalar',
    'Hasta kaydı güncellendi veya silindi.',
    jsonb_build_object('patient_id', audit_patient_id, 'changed_fields', changed_fields)::text,
    client_address
  );

  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS patient_audit_change ON public.patients;
CREATE TRIGGER patient_audit_change
AFTER UPDATE OR DELETE ON public.patients
FOR EACH ROW EXECUTE FUNCTION public.audit_patient_change();

CREATE OR REPLACE FUNCTION public.prevent_audit_log_mutation()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  RAISE EXCEPTION 'Audit log records are append-only';
END;
$$;

DROP TRIGGER IF EXISTS audit_log_append_only ON public.audit_log;
CREATE TRIGGER audit_log_append_only
BEFORE UPDATE OR DELETE ON public.audit_log
FOR EACH ROW EXECUTE FUNCTION public.prevent_audit_log_mutation();

DROP POLICY IF EXISTS audit_log_update ON public.audit_log;
DROP POLICY IF EXISTS audit_log_delete ON public.audit_log;
DROP POLICY IF EXISTS audit_log_select ON public.audit_log;
DROP POLICY IF EXISTS audit_log_insert ON public.audit_log;
DROP POLICY IF EXISTS audit_read ON public.audit_log;
DROP POLICY IF EXISTS audit_append ON public.audit_log;

CREATE POLICY audit_read ON public.audit_log
  FOR SELECT TO authenticated
  USING (public.tenant_access(organization_id, branch_id, ARRAY['Firma Yöneticisi','Şube Yöneticisi']));
CREATE POLICY audit_append ON public.audit_log
  FOR INSERT TO authenticated
  WITH CHECK (organization_id = public.get_user_org_id() AND user_id = auth.uid());

COMMIT;
