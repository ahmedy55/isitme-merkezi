ALTER TABLE public.recall_items
  ADD COLUMN IF NOT EXISTS notes TEXT;
