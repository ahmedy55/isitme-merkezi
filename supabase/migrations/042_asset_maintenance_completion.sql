ALTER TABLE public.asset_maintenance_records
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'completed';

UPDATE public.asset_maintenance_records
SET status = 'planned'
WHERE maintenance_date > CURRENT_DATE
  AND status = 'completed';

ALTER TABLE public.asset_maintenance_records
  DROP CONSTRAINT IF EXISTS asset_maintenance_records_status_check;
ALTER TABLE public.asset_maintenance_records
  ADD CONSTRAINT asset_maintenance_records_status_check
  CHECK (status IN ('planned', 'completed', 'cancelled'));

CREATE INDEX IF NOT EXISTS idx_asset_maintenance_planned
  ON public.asset_maintenance_records (organization_id, branch_id, maintenance_date)
  WHERE status = 'planned';

DROP POLICY IF EXISTS scope_update ON public.asset_maintenance_records;
CREATE POLICY scope_update ON public.asset_maintenance_records
  FOR UPDATE TO authenticated
  USING (
    tenant_access(organization_id, branch_id, ARRAY['Şube Yöneticisi', 'Muhasebe'])
    AND EXISTS (
      SELECT 1 FROM public.assets a
      WHERE a.id = asset_maintenance_records.asset_id
        AND a.organization_id = asset_maintenance_records.organization_id
        AND a.branch_id = asset_maintenance_records.branch_id
        AND a.archived_at IS NULL
    )
  )
  WITH CHECK (
    tenant_access(organization_id, branch_id, ARRAY['Şube Yöneticisi', 'Muhasebe'])
    AND EXISTS (
      SELECT 1 FROM public.assets a
      WHERE a.id = asset_maintenance_records.asset_id
        AND a.organization_id = asset_maintenance_records.organization_id
        AND a.branch_id = asset_maintenance_records.branch_id
        AND a.archived_at IS NULL
    )
  );

GRANT SELECT, INSERT, UPDATE ON public.asset_maintenance_records TO authenticated;

CREATE OR REPLACE FUNCTION public.sync_asset_last_maintenance()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE affected_asset uuid;
BEGIN
  affected_asset := NEW.asset_id;
  UPDATE public.assets a
  SET last_maintenance = GREATEST(
    COALESCE(a.last_maintenance, NEW.maintenance_date),
    NEW.maintenance_date
  )
  WHERE a.id = affected_asset
    AND NEW.status = 'completed'
    AND NEW.record_type IN ('Bakım', 'Onarım', 'Kalibrasyon');

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.sync_asset_last_maintenance() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS trg_sync_asset_last_maintenance ON public.asset_maintenance_records;
CREATE TRIGGER trg_sync_asset_last_maintenance
  AFTER INSERT OR UPDATE OF status, maintenance_date, record_type
  ON public.asset_maintenance_records
  FOR EACH ROW EXECUTE FUNCTION public.sync_asset_last_maintenance();
