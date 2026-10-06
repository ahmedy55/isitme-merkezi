-- Migration 037: Enforce trial patient quota at database level
BEGIN;

CREATE OR REPLACE FUNCTION public.guard_patient_quota() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE
  o public.organizations;
  patient_count bigint;
BEGIN
  SELECT * INTO o FROM public.organizations WHERE id = NEW.organization_id FOR UPDATE;
  
  -- If trial plan, check patient count limit (max 50)
  IF o.plan_type = 'trial' AND (TG_OP = 'INSERT' OR (OLD.deleted_at IS NOT NULL AND NEW.deleted_at IS NULL)) THEN
    SELECT count(*) INTO patient_count
    FROM public.patients
    WHERE organization_id = NEW.organization_id AND deleted_at IS NULL AND id <> coalesce(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid);

    IF patient_count >= 50 THEN
      RAISE EXCEPTION 'Deneme sürümü (Trial) hasta limitinize ulaştınız (Maksimum 50 hasta).';
    END IF;
  END IF;

  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS patient_quota_guard ON public.patients;
CREATE TRIGGER patient_quota_guard
BEFORE INSERT OR UPDATE ON public.patients
FOR EACH ROW EXECUTE FUNCTION public.guard_patient_quota();

COMMIT;
