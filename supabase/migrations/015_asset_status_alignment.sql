BEGIN;

-- Keep both established database values and values shown by the asset form.
ALTER TABLE public.assets DROP CONSTRAINT IF EXISTS assets_status_check;
ALTER TABLE public.assets
  ADD CONSTRAINT assets_status_check
  CHECK (status IN ('Aktif', 'Arızalı', 'Bakımda', 'Hek/Iskarta', 'Hurda', 'Satıldı'));

COMMIT;
