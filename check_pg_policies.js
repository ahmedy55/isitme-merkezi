const { Client } = require('pg');

const connectionString = 'postgresql://postgres.znktitzknixpbakfrnzk:AudiProDbPass2026!%23@aws-0-eu-central-1.pooler.supabase.com:5432/postgres';

async function run() {
  const client = new Client({
    connectionString: connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    const res = await client.query(`
      SELECT tablename, policyname, roles, cmd, qual, with_check 
      FROM pg_policies 
      WHERE tablename = 'platform_admins';
    `);
    console.log('Current policies on platform_admins:', res.rows);
  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}

run();
