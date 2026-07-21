const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://znktitzknixpbakfrnzk.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpua3RpdHprbml4cGJha2ZybnprIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ2Mjc2MjIsImV4cCI6MjEwMDIwMzYyMn0.SjwjwAS4PqhjYKRQdCENSAFTcUtzSj-8AqQkpdeN9WA';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function test() {
  console.log('Testing login for ahmt1965@gmail.com...');
  // Note: we can test anon query directly if we pass session or check RLS
  const { data: adminData, error: adminErr } = await supabase
    .from('platform_admins')
    .select('user_id');

  console.log('Anon select platform_admins:', { adminData, adminErr });
}

test();
