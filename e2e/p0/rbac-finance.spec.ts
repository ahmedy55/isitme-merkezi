import { expect, test } from '@playwright/test';
import { restHeaders, signIn, testSupabaseUrl } from './fixtures';

test('TC-SEC-02: Odyometrist muhasebe hareketlerini API üzerinden okuyamaz', async ({ request }) => {
  const transactionId = process.env.E2E_FINANCE_TRANSACTION_ID;
  if (!transactionId) throw new Error('E2E_FINANCE_TRANSACTION_ID must identify a seeded transaction in tenant A.');

  const managerToken = await signIn(request, 'E2E_TENANT_A_EMAIL', 'E2E_TENANT_A_PASSWORD');
  const target = `${testSupabaseUrl()}/rest/v1/cash_transactions?id=eq.${encodeURIComponent(transactionId)}&select=id,amount,description`;
  const managerResponse = await request.get(target, { headers: await restHeaders(managerToken) });
  expect(managerResponse.status()).toBe(200);
  expect(await managerResponse.json(), 'Finance fixture must exist and be visible to the tenant manager.').toHaveLength(1);

  const audiometristToken = await signIn(request, 'E2E_TENANT_A_ODYOMETRIST_EMAIL', 'E2E_TENANT_A_ODYOMETRIST_PASSWORD');
  const restrictedResponse = await request.get(target, { headers: await restHeaders(audiometristToken) });

  // Supabase RLS may mask a forbidden row as an empty 200 response.
  expect(restrictedResponse.status()).toBe(200);
  expect(await restrictedResponse.json(), 'Odyometrist read a finance row despite the role policy.').toEqual([]);
});
