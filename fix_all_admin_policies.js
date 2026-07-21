const { Client } = require('pg');

const connectionString = 'postgresql://postgres.znktitzknixpbakfrnzk:AudiProDbPass2026!%23@aws-0-eu-central-1.pooler.supabase.com:5432/postgres';

const sql = `
-- platform_admins tablosundaki tüm eski politikaları tamamen temizle
DO $$ 
DECLARE 
    pol RECORD;
BEGIN 
    FOR pol IN (SELECT policyname FROM pg_policies WHERE tablename = 'platform_admins') LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON platform_admins', pol.policyname);
    END LOOP;
END $$;

-- Temiz ve dairesiz tek bir SELECT politikası oluştur
CREATE POLICY "platform_admins_select_policy" ON platform_admins
  FOR SELECT USING (user_id = auth.uid());
`;

async function run() {
  const client = new Client({
    connectionString: connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('Clearing all old policies on platform_admins and recreating clean policy...');
    await client.query(sql);
    console.log('All policies cleared and recreated successfully!');
  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}

run();
