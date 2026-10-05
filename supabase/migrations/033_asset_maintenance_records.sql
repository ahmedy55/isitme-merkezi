CREATE TABLE IF NOT EXISTS public.asset_maintenance_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  branch_id uuid NOT NULL REFERENCES public.branches(id),
  asset_id uuid NOT NULL REFERENCES public.assets(id),
  record_type text NOT NULL CHECK (record_type IN ('Bakım', 'Onarım', 'Kalibrasyon')),
  maintenance_date date NOT NULL,
  provider text NOT NULL DEFAULT '',
  report_number text,
  notes text NOT NULL DEFAULT '',
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT asset_maintenance_branch_consistency
    CHECK (organization_id IS NOT NULL AND branch_id IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS idx_asset_maintenance_asset_date
  ON public.asset_maintenance_records (organization_id, asset_id, maintenance_date DESC, id);

ALTER TABLE public.asset_maintenance_records ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS scope_read ON public.asset_maintenance_records;
DROP POLICY IF EXISTS scope_insert ON public.asset_maintenance_records;

CREATE POLICY scope_read ON public.asset_maintenance_records
  FOR SELECT TO authenticated
  USING (tenant_access(organization_id, branch_id, ARRAY['Şube Yöneticisi', 'Muhasebe']));

CREATE POLICY scope_insert ON public.asset_maintenance_records
  FOR INSERT TO authenticated
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

CREATE OR REPLACE FUNCTION public.sync_asset_last_maintenance()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NEW.record_type IN ('Bakım', 'Onarım') THEN
    UPDATE public.assets
    SET last_maintenance = GREATEST(COALESCE(last_maintenance, NEW.maintenance_date), NEW.maintenance_date)
    WHERE id = NEW.asset_id AND organization_id = NEW.organization_id AND branch_id = NEW.branch_id;
  END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.sync_asset_last_maintenance() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_sync_asset_last_maintenance ON public.asset_maintenance_records;
CREATE TRIGGER trg_sync_asset_last_maintenance
  AFTER INSERT ON public.asset_maintenance_records
  FOR EACH ROW EXECUTE FUNCTION public.sync_asset_last_maintenance();
