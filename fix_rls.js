const { Client } = require('pg');

const connectionString = 'postgresql://postgres.znktitzknixpbakfrnzk:AudiProDbPass2026!%23@aws-0-eu-central-1.pooler.supabase.com:5432/postgres';

const sql = `
-- platform_admins tablosundaki dairesel RLS sorgu hatasını düzelt
DROP POLICY IF EXISTS "Sadece platform admin kendi listesini görebilir" ON platform_admins;

CREATE POLICY "Sadece platform admin kendi listesini görebilir" ON platform_admins
  FOR SELECT USING (user_id = auth.uid());
`;

async function run() {
  const client = new Client({
    connectionString: connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('Fixing platform_admins SELECT policy to remove circular dependency recursion...');
    await client.query(sql);
    console.log('Policy fixed successfully!');
  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}

run();
