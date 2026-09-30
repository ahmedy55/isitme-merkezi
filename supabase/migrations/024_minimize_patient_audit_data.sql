-- Do not duplicate patient contact/health values into immutable audit history.
-- Existing 020 audit rows are intentionally untouched; see the security review
-- before any historical redaction because audit_log is append-only.
BEGIN;

CREATE OR REPLACE FUNCTION public.audit_patient_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  changed_fields jsonb;
  audit_org uuid;
  audit_branch uuid;
  audit_patient_id uuid;
BEGIN
  IF TG_OP = 'UPDATE' THEN
    changed_fields := jsonb_strip_nulls(jsonb_build_object(
      'phone', CASE WHEN OLD.phone IS DISTINCT FROM NEW.phone THEN true END,
      'email', CASE WHEN OLD.email IS DISTINCT FROM NEW.email THEN true END,
      'address', CASE WHEN OLD.address IS DISTINCT FROM NEW.address THEN true END,
      'deleted_at', CASE WHEN OLD.deleted_at IS DISTINCT FROM NEW.deleted_at THEN true END,
      'audiogram_left', CASE WHEN OLD.audiogram_left IS DISTINCT FROM NEW.audiogram_left THEN true END,
      'audiogram_right', CASE WHEN OLD.audiogram_right IS DISTINCT FROM NEW.audiogram_right THEN true END
    ));
    IF changed_fields = '{}'::jsonb THEN RETURN NEW; END IF;
    audit_org := NEW.organization_id;
    audit_branch := NEW.branch_id;
    audit_patient_id := NEW.id;
  ELSE
    changed_fields := jsonb_build_object('record_deleted', true);
    audit_org := OLD.organization_id;
    audit_branch := OLD.branch_id;
    audit_patient_id := OLD.id;
  END IF;

  INSERT INTO public.audit_log(organization_id, branch_id, user_id, action, module, description, details)
  VALUES (
    audit_org,
    audit_branch,
    auth.uid(),
    CASE WHEN TG_OP = 'DELETE' THEN 'Hasta Silme' ELSE 'Hasta Verisi Değişikliği' END,
    'Hastalar',
    'Hasta kaydı güncellendi veya silindi.',
    jsonb_build_object('patient_id', audit_patient_id, 'changed_fields', changed_fields)::text
  );

  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.audit_patient_change() FROM PUBLIC, anon, authenticated;

COMMIT;
