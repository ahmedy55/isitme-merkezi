import { expect, test } from '@playwright/test';
import { restHeaders, signIn, testSupabaseUrl } from './fixtures';

test('TC-STK-01: Aynı tenant içinde mükerrer cihaz seri numarası reddedilir', async ({ request }) => {
  const organizationId = process.env.E2E_TENANT_A_ORGANIZATION_ID;
  const branchId = process.env.E2E_TENANT_A_BRANCH_ID;
  const serialNo = process.env.E2E_EXISTING_DEVICE_SERIAL;
  if (!organizationId || !branchId || !serialNo) {
    throw new Error('E2E_TENANT_A_ORGANIZATION_ID, E2E_TENANT_A_BRANCH_ID and E2E_EXISTING_DEVICE_SERIAL are required.');
  }

  const token = await signIn(request, 'E2E_TENANT_A_EMAIL', 'E2E_TENANT_A_PASSWORD');
  const headers = await restHeaders(token);
  const url = testSupabaseUrl();
  const existingResponse = await request.get(
    `${url}/rest/v1/stock_items?organization_id=eq.${encodeURIComponent(organizationId)}&serial_no=eq.${encodeURIComponent(serialNo)}&deleted_at=is.null&select=id,category,quantity`,
    { headers },
  );
  expect(existingResponse.status()).toBe(200);
  const existingItems = await existingResponse.json() as Array<{ category: string; quantity: number }>;
  expect(existingItems, 'Seed exactly one non-deleted device with this serial in tenant A.').toHaveLength(1);
  expect(existingItems[0].category).toBe('Cihaz');

  const duplicateResponse = await request.post(`${url}/rest/v1/stock_items`, {
    headers: { ...headers, Prefer: 'return=representation' },
    data: {
      organization_id: organizationId,
      branch_id: branchId,
      name: 'QA Duplicate Serial Attempt',
      category: 'Cihaz',
      brand: 'QA',
      model: 'P0 test',
      serial_no: serialNo,
      barcode: `QA-${serialNo}`,
      quantity: 1,
      status: 'Stokta',
      uts_status: 'Bekliyor',
    },
  });

  expect(duplicateResponse.ok(), 'Database accepted a duplicate device serial number.').toBe(false);
  const error = await duplicateResponse.json() as { message?: string; details?: string; hint?: string };
  expect(`${error.message ?? ''} ${error.details ?? ''} ${error.hint ?? ''}`).toMatch(/serial number already exists/i);
});
