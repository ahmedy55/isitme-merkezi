-- Archived branches remain available for historical relationships, but they
-- must not consume a tenant's active-branch quota or prevent a replacement
-- real branch from being created.
CREATE OR REPLACE FUNCTION public.guard_branch_quota() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE
  organization public.organizations;
BEGIN
  SELECT * INTO organization
  FROM public.organizations
  WHERE id = NEW.organization_id
  FOR UPDATE;

  IF NEW.status = 'active'
    AND NEW.archived_at IS NULL
    AND (TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM 'active' OR OLD.archived_at IS NOT NULL)
    AND (
      SELECT count(*)
      FROM public.branches
      WHERE organization_id = NEW.organization_id
        AND status = 'active'
        AND archived_at IS NULL
        AND id <> NEW.id
    ) >= organization.max_branches
  THEN
    RAISE EXCEPTION 'Branch quota exceeded';
  END IF;

  RETURN NEW;
END;
$$;
