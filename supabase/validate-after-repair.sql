-- REVIEW ONLY: emits validation statements; does not execute them.
-- Repair legacy violations first using approved, real branch assignments.
SELECT format('ALTER TABLE %s VALIDATE CONSTRAINT %I;',conrelid::regclass,conname)
FROM pg_constraint WHERE connamespace='public'::regnamespace AND NOT convalidated ORDER BY conrelid::regclass::text,conname;
