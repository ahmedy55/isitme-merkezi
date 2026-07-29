import { createClient } from '@supabase/supabase-js';
import { logger } from './logger';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const isConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl !== 'YOUR_SUPABASE_URL' &&
  supabaseAnonKey !== 'YOUR_SUPABASE_ANON_KEY'
);

if (!isConfigured) {
  logger.warn(
    'Supabase URL veya Anon Key environment variables eksik. Lütfen .env.local dosyasını yapılandırın.',
    'SupabaseClient'
  );
}

// Singleton Supabase Client
export const supabase = createClient(
  isConfigured ? supabaseUrl : 'https://znktitzknixpbakfrnzk.supabase.co',
  isConfigured ? supabaseAnonKey : 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSJ9.demo'
);
