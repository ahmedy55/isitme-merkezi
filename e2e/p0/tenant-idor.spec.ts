import { expect, test } from '@playwright/test';
import { restHeaders, signIn, testSupabaseUrl } from './fixtures';

test('TC-SEC-01: Firma A oturumu Firma B hastasının kaydını okuyamaz', async ({ request }) => {
  const patientId = process.env.E2E_TENANT_B_PATIENT_ID;
  if (!patientId) throw new Error('E2E_TENANT_B_PATIENT_ID must identify a seeded patient in tenant B.');

  const tenantBToken = await signIn(request, 'E2E_TENANT_B_EMAIL', 'E2E_TENANT_B_PASSWORD');
  const tenantBResponse = await request.get(
    `${testSupabaseUrl()}/rest/v1/patients?id=eq.${encodeURIComponent(patientId)}&select=id`,
    { headers: await restHeaders(tenantBToken) },
  );
  expect(tenantBResponse.status()).toBe(200);
  expect(await tenantBResponse.json(), 'Fixture patient must exist and be visible to tenant B.').toHaveLength(1);

  const tenantAToken = await signIn(request, 'E2E_TENANT_A_EMAIL', 'E2E_TENANT_A_PASSWORD');
  const attackResponse = await request.get(
    `${testSupabaseUrl()}/rest/v1/patients?id=eq.${encodeURIComponent(patientId)}&select=id,organization_id,first_name,last_name`,
    { headers: await restHeaders(tenantAToken) },
  );

  // Supabase RLS commonly returns HTTP 200 with an empty result instead of 403.
  // The security assertion is that no cross-tenant row or identifying fields escape.
  expect(attackResponse.status()).toBe(200);
  expect(await attackResponse.json(), 'Tenant A received a patient row belonging to tenant B.').toEqual([]);
});
