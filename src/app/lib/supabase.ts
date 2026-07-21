import { createClient } from '@supabase/supabase-js';

let supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
let supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const isConfigured = 
  supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl !== 'YOUR_SUPABASE_URL' &&
  supabaseAnonKey !== 'YOUR_SUPABASE_ANON_KEY';

if (!isConfigured) {
  console.warn(
    'Supabase URL veya Anon Key eksik ya da doldurulmamış. Lütfen .env.local dosyasını güncelleyin.'
  );
  // Derleme hatasını önlemek için geçerli biçimli placeholder'lar atayalım
  supabaseUrl = 'https://placeholder-project.supabase.co';
  supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.placeholder';
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
