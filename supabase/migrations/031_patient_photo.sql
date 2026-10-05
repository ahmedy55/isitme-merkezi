-- Persist a resized patient portrait on the tenant-protected patient record.
ALTER TABLE public.patients
  ADD COLUMN IF NOT EXISTS photo_url TEXT;
