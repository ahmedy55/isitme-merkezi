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

// Report missing client configuration in the browser, not while Next statically
// evaluates this module during production builds or server-side rendering.
if (!isConfigured && typeof window !== 'undefined') {
  logger.warn(
    'Supabase URL veya Anon Key environment variables eksik. Lütfen .env.local dosyasını yapılandırın.',
    'SupabaseClient'
  );
}

// Singleton Supabase Client — Demo modunda boş URL ile oluşturulur (işlemler graceful fail eder)
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-anon-key'
);

export { isConfigured };
