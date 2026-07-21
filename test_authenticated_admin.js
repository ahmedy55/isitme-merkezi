const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://znktitzknixpbakfrnzk.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpua3RpdHprbml4cGJha2ZybnprIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ2Mjc2MjIsImV4cCI6MjEwMDIwMzYyMn0.SjwjwAS4PqhjYKRQdCENSAFTcUtzSj-8AqQkpdeN9WA';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function test() {
  console.log('Verifying authenticated checkAdminStatus for ahmt1965@gmail.com...');
  // Check if we can query platform_admins for user 347aaf8d-9c4c-473a-b966-7eebaa5f98a4
  const uid = '347aaf8d-9c4c-473a-b966-7eebaa5f98a4';
  const { data, error } = await supabase
    .from('platform_admins')
    .select('user_id')
    .eq('user_id', uid)
    .maybeSingle();

  console.log('Query result:', { data, error });
}

test();
