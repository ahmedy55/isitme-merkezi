-- 041_add_efatura_provider.sql
ALTER TABLE IF EXISTS public.organization_settings
  ADD COLUMN IF NOT EXISTS efatura_provider text;
