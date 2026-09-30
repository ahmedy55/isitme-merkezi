-- Keep uploaded audiogram/test-result files private and scoped to the patient's tenant and branch.
BEGIN;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'patient-audiograms',
  'patient-audiograms',
  false,
  10485760,
  ARRAY['application/xml', 'text/xml', 'application/pdf', 'image/png', 'image/jpeg']::text[]
)
ON CONFLICT (id) DO UPDATE
SET public = false,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS patient_audiogram_read ON storage.objects;
DROP POLICY IF EXISTS patient_audiogram_insert ON storage.objects;
DROP POLICY IF EXISTS patient_audiogram_delete ON storage.objects;

CREATE POLICY patient_audiogram_read ON storage.objects
FOR SELECT TO authenticated
USING (
  bucket_id = 'patient-audiograms'
  AND cardinality(storage.foldername(name)) = 3
  AND EXISTS (
    SELECT 1
    FROM public.patients p
    WHERE p.id::text = (storage.foldername(name))[3]
      AND p.organization_id::text = (storage.foldername(name))[1]
      AND p.branch_id::text = (storage.foldername(name))[2]
      AND p.deleted_at IS NULL
      AND public.tenant_access(
        p.organization_id,
        p.branch_id,
        ARRAY['Şube Yöneticisi', 'Odyolog', 'Odyometrist', 'Sekreter', 'Resepsiyon']
      )
  )
);

CREATE POLICY patient_audiogram_insert ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'patient-audiograms'
  AND cardinality(storage.foldername(name)) = 3
  AND CASE lower(regexp_replace(name, '^.*\.', ''))
    WHEN 'xml' THEN lower(coalesce(metadata->>'mimetype', '')) IN ('application/xml', 'text/xml')
    WHEN 'pdf' THEN lower(coalesce(metadata->>'mimetype', '')) = 'application/pdf'
    WHEN 'png' THEN lower(coalesce(metadata->>'mimetype', '')) = 'image/png'
    WHEN 'jpg' THEN lower(coalesce(metadata->>'mimetype', '')) = 'image/jpeg'
    WHEN 'jpeg' THEN lower(coalesce(metadata->>'mimetype', '')) = 'image/jpeg'
    ELSE false
  END
  AND EXISTS (
    SELECT 1
    FROM public.patients p
    WHERE p.id::text = (storage.foldername(name))[3]
      AND p.organization_id::text = (storage.foldername(name))[1]
      AND p.branch_id::text = (storage.foldername(name))[2]
      AND p.deleted_at IS NULL
      AND public.tenant_access(
        p.organization_id,
        p.branch_id,
        ARRAY['Şube Yöneticisi', 'Odyolog', 'Odyometrist', 'Sekreter', 'Resepsiyon']
      )
  )
);

CREATE POLICY patient_audiogram_delete ON storage.objects
FOR DELETE TO authenticated
USING (
  bucket_id = 'patient-audiograms'
  AND cardinality(storage.foldername(name)) = 3
  AND EXISTS (
    SELECT 1
    FROM public.patients p
    WHERE p.id::text = (storage.foldername(name))[3]
      AND p.organization_id::text = (storage.foldername(name))[1]
      AND p.branch_id::text = (storage.foldername(name))[2]
      AND public.tenant_access(
        p.organization_id,
        p.branch_id,
        ARRAY['Şube Yöneticisi', 'Odyolog', 'Odyometrist', 'Sekreter', 'Resepsiyon']
      )
  )
);

COMMIT;
