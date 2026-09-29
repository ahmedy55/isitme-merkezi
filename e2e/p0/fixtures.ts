import { expect, type APIRequestContext } from '@playwright/test';

const supabaseUrl = process.env.E2E_SUPABASE_URL?.replace(/\/$/, '');
const anonKey = process.env.E2E_SUPABASE_ANON_KEY;

/**
 * These P0 tests are intentionally limited to an isolated test Supabase project.
 * They do not accept a service-role key and never create or delete fixture data.
 */
export function requireP0TestEnvironment() {
  if (process.env.E2E_ALLOW_TEST_DATABASE !== '1') {
    throw new Error('Set E2E_ALLOW_TEST_DATABASE=1 only after verifying this is an isolated test database.');
  }
  if (!supabaseUrl || !anonKey) {
    throw new Error('E2E_SUPABASE_URL and E2E_SUPABASE_ANON_KEY are required.');
  }

  const url = new URL(supabaseUrl);
  const isLocal = ['localhost', '127.0.0.1', '::1'].includes(url.hostname);
  const isSupabase = url.hostname.endsWith('.supabase.co');
  if ((!isLocal && !isSupabase) || url.hostname === 'isitme-merkezi.vercel.app') {
    throw new Error('Refusing to run P0 tests against an unrecognized or production host.');
  }
  if (url.hostname.startsWith('YOUR_') || anonKey.includes('placeholder')) {
    throw new Error('Supabase test configuration contains a placeholder.');
  }

  return { supabaseUrl, anonKey };
}

export async function signIn(
  request: APIRequestContext,
  emailEnv: string,
  passwordEnv: string,
) {
  const { supabaseUrl, anonKey } = requireP0TestEnvironment();
  const email = process.env[emailEnv];
  const password = process.env[passwordEnv];
  if (!email || !password) throw new Error(`${emailEnv} and ${passwordEnv} are required.`);

  const response = await request.post(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
    headers: { apikey: anonKey, 'Content-Type': 'application/json' },
    data: { email, password },
  });
  expect(response.status(), `Sign-in failed for ${emailEnv}; verify the isolated test account.`).toBe(200);
  const session = await response.json() as { access_token?: string };
  expect(session.access_token, 'Supabase Auth did not return an access token.').toBeTruthy();
  return session.access_token!;
}

export async function restHeaders(accessToken: string) {
  const { anonKey } = requireP0TestEnvironment();
  return {
    apikey: anonKey,
    Authorization: `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
  };
}

export function testSupabaseUrl() {
  return requireP0TestEnvironment().supabaseUrl;
}
