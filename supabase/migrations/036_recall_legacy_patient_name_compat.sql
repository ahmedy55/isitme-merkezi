-- A previously deployed browser bundle may still send the denormalized name
-- when creating a recall. Keep an optional compatibility column so those
-- cached clients do not fail with a PostgREST schema-cache error. Current
-- clients resolve the display name through patient_id and omit this column.
ALTER TABLE public.recall_items
  ADD COLUMN IF NOT EXISTS patient_name text;
