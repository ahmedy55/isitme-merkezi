-- Encrypt patient TCKN values in Postgres; never ship the key to browser code.
BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM vault.secrets WHERE name = 'audiopro_patient_tc_key') THEN
    PERFORM vault.create_secret(
      encode(gen_random_bytes(32), 'hex'),
      'audiopro_patient_tc_key',
      'Server-side key for encrypting patient TCKN values'
    );
  END IF;
END
$$;

CREATE OR REPLACE FUNCTION public.encrypt_patient_tc()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, vault, pg_temp
AS $$
DECLARE encryption_key text;
BEGIN
  IF NEW.tc IS NULL OR btrim(NEW.tc) = '' OR NEW.tc LIKE 'ENC:v2:%' THEN
    RETURN NEW;
  END IF;

  SELECT decrypted_secret INTO STRICT encryption_key
  FROM vault.decrypted_secrets
  WHERE name = 'audiopro_patient_tc_key';

  NEW.tc := 'ENC:v2:' || encode(pgp_sym_encrypt(NEW.tc, encryption_key, 'cipher-algo=aes256'), 'base64');
  RETURN NEW;
END
$$;

DROP TRIGGER IF EXISTS encrypt_patient_tc_before_write ON public.patients;
CREATE TRIGGER encrypt_patient_tc_before_write
BEFORE INSERT OR UPDATE OF tc ON public.patients
FOR EACH ROW EXECUTE FUNCTION public.encrypt_patient_tc();

-- All existing patient values were verified to be plaintext before this migration.
UPDATE public.patients SET tc = tc WHERE tc IS NOT NULL AND btrim(tc) <> '' AND tc NOT LIKE 'ENC:v2:%';

CREATE OR REPLACE FUNCTION public.decrypt_patient_tcs(p_patient_ids uuid[])
RETURNS TABLE(patient_id uuid, tc text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, extensions, vault, pg_temp
AS $$
  SELECT p.id,
         CASE WHEN p.tc LIKE 'ENC:v2:%'
              THEN pgp_sym_decrypt(decode(substr(p.tc, 8), 'base64'), secret.decrypted_secret)
              ELSE p.tc
         END
  FROM public.patients AS p
  CROSS JOIN (
    SELECT decrypted_secret
    FROM vault.decrypted_secrets
    WHERE name = 'audiopro_patient_tc_key'
  ) AS secret
  WHERE p.id = ANY(COALESCE(p_patient_ids, ARRAY[]::uuid[]))
    AND p.deleted_at IS NULL
    AND public.tenant_access(
      p.organization_id,
      p.branch_id,
      ARRAY['Şube Yöneticisi','Odyolog','Odyometrist','Sekreter','Resepsiyon']
    );
$$;

REVOKE ALL ON FUNCTION public.encrypt_patient_tc() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.decrypt_patient_tcs(uuid[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.decrypt_patient_tcs(uuid[]) TO authenticated;

COMMENT ON COLUMN public.patients.tc IS 'AES-256 PGP ciphertext with ENC:v2: prefix; plaintext is returned only by tenant-scoped decrypt_patient_tcs RPC.';
COMMIT;
