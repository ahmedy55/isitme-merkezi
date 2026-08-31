-- =========================================================================
-- AudiPro SaaS — KVKK Column Encryption Migration (006_encrypt_patient_tc.sql)
-- =========================================================================

-- 1. pgcrypto eklentisini etkinleştir (Veritabanı seviyesinde kriptografi desteği)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Hasta TC Kimlik alanına şifrelenmiş veri notasyonu açıklama yorumu ekle
COMMENT ON COLUMN patients.tc IS 'KVKK gereğince AES-256 algoritması ile şifrelenmiş TCKN verisi (ENC: prefixli)';

-- 3. Yetkisiz doğrudan SQL sorgularında TCKN maskeleme fonksiyonu (PostgreSQL Helper)
CREATE OR REPLACE FUNCTION mask_tc_kn(input_tc TEXT)
RETURNS TEXT AS $$
BEGIN
  IF input_tc IS NULL OR length(input_tc) < 11 THEN
    return '***';
  END IF;
  RETURN substring(input_tc FROM 1 FOR 3) || '*****' || substring(input_tc FROM 9 FOR 3);
END;
$$ LANGUAGE plpgsql IMMUTABLE SECURITY DEFINER;
