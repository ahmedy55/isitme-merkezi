import { expect, test, type Page } from '@playwright/test';

const orgId = '11111111-1111-4111-8111-111111111111';
const branchId = '22222222-2222-4222-8222-222222222222';
const userId = '33333333-3333-4333-8333-333333333333';
const assetId = '44444444-4444-4444-8444-444444444444';
const assetName = 'QA Playwright Demirbaşı';
const corsHeaders = {
  'Access-Control-Allow-Origin': 'http://localhost:3001',
  'Access-Control-Allow-Headers': 'apikey, authorization, content-type, x-client-info, prefer, range',
  'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
};

type ExtraFixtures = {
  stockRows?: Record<string, unknown>[];
  stockMovementRows?: Record<string, unknown>[];
  patientRows?: Record<string, unknown>[];
  recallRows?: Record<string, unknown>[];
  activityRows?: Record<string, unknown>[];
  activityInsertBodies?: Record<string, unknown>[];
  recallInsertBodies?: Record<string, unknown>[];
  appointmentRows?: Record<string, unknown>[];
  maintenanceRows?: Record<string, unknown>[];
  serviceRows?: Record<string, unknown>[];
  serviceInsertBodies?: Record<string, unknown>[];
  failServiceInsert?: boolean;
  invoiceRows?: Record<string, unknown>[];
  hideInvoiceRowsFromList?: boolean;
  paymentRows?: Record<string, unknown>[];
  paymentInsertBodies?: Record<string, unknown>[];
  saleRpcPayloads?: Record<string, unknown>[];
  failStockInsert?: boolean;
  failStockAdjustment?: boolean;
  cashBranchIds?: string[];
  cashRows?: Record<string, unknown>[];
  failPatientUpdate?: boolean;
  expenseBranchIds?: string[];
  invoiceBranchIds?: string[];
  assetSerial?: string;
  assetWarrantyExpiry?: string | null;
  assetStatus?: string;
  additionalAssetRows?: Record<string, unknown>[];
  assetUpdateBodies?: Record<string, unknown>[];
  transferRows?: Record<string, unknown>[];
  orgSettings?: Record<string, unknown>;
  memberRows?: Record<string, unknown>[];
  branchRows?: Record<string, unknown>[];
  supplierRows?: Record<string, unknown>[];
};

function base64Url(value: unknown) {
  return Buffer.from(JSON.stringify(value)).toString('base64url');
}

function sessionForUser() {
  const now = Math.floor(Date.now() / 1000);
  const user = {
    id: userId,
    aud: 'authenticated',
    role: 'authenticated',
    email: 'playwright@example.invalid',
    app_metadata: { provider: 'email', providers: ['email'], organization_id: orgId },
    user_metadata: { full_name: 'Playwright Test' },
    created_at: new Date(now * 1000).toISOString(),
  };
  const payload = {
    sub: userId,
    aud: 'authenticated',
    role: 'authenticated',
    email: user.email,
    app_metadata: user.app_metadata,
    user_metadata: user.user_metadata,
    iat: now,
    exp: now + 60 * 60 * 24,
  };
  return {
    access_token: `${base64Url({ alg: 'HS256', typ: 'JWT' })}.${base64Url(payload)}.playwright-signature`,
    refresh_token: 'playwright-refresh-token',
    token_type: 'bearer',
    expires_in: 60 * 60 * 24,
    expires_at: now + 60 * 60 * 24,
    user,
  };
}

async function mockTenantData(page: Page, withAsset: boolean, fixtures: ExtraFixtures = {}) {
  const session = sessionForUser();
  await page.route('**/auth/v1/user**', route => route.fulfill({
    status: 200,
    contentType: 'application/json',
    headers: corsHeaders,
    body: JSON.stringify(session.user),
  }));
  await page.route('**/auth/v1/token**', route => route.fulfill({
    status: 200,
    contentType: 'application/json',
    headers: corsHeaders,
    body: JSON.stringify(session),
  }));
  await page.route('**/api/select-org', route => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ success: true }),
  }));

  await page.route('**/rest/v1/**', async route => {
    const url = new URL(route.request().url());
    const table = url.pathname.split('/').filter(Boolean).at(-1);
    let rows: unknown[] = [];
    if (table === 'patients' && ['POST', 'PATCH'].includes(route.request().method())) {
      const method = route.request().method();
      const body = route.request().postDataJSON();
      if (method === 'PATCH' && fixtures.failPatientUpdate) {
        await route.fulfill({ status: 400, contentType: 'application/json', headers: corsHeaders, body: JSON.stringify({ message: 'Reçete kaydı reddedildi.' }) });
        return;
      }
      const id = method === 'PATCH' ? url.searchParams.get('id')?.replace('eq.', '') : 'cdcdcdcd-cdcd-4dcd-8dcd-cdcdcdcdcdcd';
      const record = { ...(fixtures.patientRows?.find(row => row.id === id) || {}), ...(Array.isArray(body) ? body[0] : body), id };
      fixtures.patientRows = [record, ...(fixtures.patientRows || []).filter(row => row.id !== id)];
      await route.fulfill({ status: 200, contentType: 'application/json', headers: corsHeaders, body: JSON.stringify(method === 'POST' ? [record] : record) });
      return;
    }

    if (table === 'suppliers' && route.request().method() === 'POST') {
      const body = route.request().postDataJSON();
      const payload = (Array.isArray(body) ? body[0] : body) as Record<string, unknown>;
      const row = { ...payload, id: 'abababab-abab-4bab-8bab-abababababab' };
      fixtures.supplierRows = [row, ...(fixtures.supplierRows || [])];
      await route.fulfill({ status: 201, contentType: 'application/json', headers: corsHeaders, body: JSON.stringify([row]) });
      return;
    }

    if (table === 'record_sgk_payment' && route.request().method() === 'POST') {
      const body = route.request().postDataJSON() as Record<string, unknown>;
      fixtures.paymentInsertBodies?.push(body);
      const invoice = fixtures.invoiceRows?.find(item => item.id === body.p_invoice_id);
      if (invoice) invoice.status = 'Tahsil Edildi';
      const paymentId = 'bcbcbcbc-bcbc-4bcb-8bcb-bcbcbcbcbcbc';
      fixtures.paymentRows = [{
        id: paymentId,
        invoice_id: body.p_invoice_id,
        branch_id: branchId,
        amount: body.p_amount,
        payment_date: body.p_payment_date,
        notes: body.p_notes || '',
        created_at: new Date().toISOString(),
      }, ...(fixtures.paymentRows || [])];
      await route.fulfill({ status: 200, contentType: 'application/json', headers: corsHeaders, body: JSON.stringify(paymentId) });
      return;
    }

    if (table === 'complete_sale' && route.request().method() === 'POST') {
      const body = route.request().postDataJSON() as Record<string, unknown>;
      fixtures.saleRpcPayloads?.push(body);
      const stock = fixtures.stockRows?.find(row => row.id === body.p_stock);
      const sale = body.p_sale as Record<string, unknown>;
      if (stock?.category === 'Cihaz' && !['Sağ', 'Sol'].includes(String(sale.device_ear_side))) {
        await route.fulfill({ status: 400, contentType: 'application/json', headers: corsHeaders, body: JSON.stringify({ message: 'Select right or left ear for the device' }) });
        return;
      }
      if (stock) {
        stock.quantity = Math.max(0, Number(stock.quantity || 0) - 1);
        if (stock.quantity === 0) stock.status = 'Satıldı';
        fixtures.stockMovementRows = [{ id: '78787878-7878-4787-8787-787878787878', stock_item_id: stock.id, type: 'SALE', quantity_change: -1, created_at: new Date().toISOString() }];
      }
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        headers: corsHeaders,
        body: JSON.stringify({ id: 'abababab-abab-4bab-8bab-abababababab', ...((body.p_sale || {}) as Record<string, unknown>) }),
      });
      return;
    }

    if (table === 'adjust_stock_item') {
      const body = route.request().postDataJSON() as { p_item: string; p_delta: number; p_reason: string; p_notes?: string; p_is_loss?: boolean };
      if (fixtures.failStockAdjustment) {
        await route.fulfill({
          status: 400,
          contentType: 'application/json',
          headers: corsHeaders,
          body: JSON.stringify({ code: 'P0001', message: 'Stock item is unavailable in this branch' }),
        });
        return;
      }
      const product = fixtures.stockRows?.find(row => row.id === body.p_item);
      const updated = product ? { ...product, quantity: Number(product.quantity || 0) + body.p_delta } : null;
      if (product && updated) {
        Object.assign(product, updated);
        fixtures.stockMovementRows = [{
          id: '78787878-7878-4787-8787-787878787878',
          organization_id: orgId,
          branch_id: product.branch_id,
          stock_item_id: product.id,
          stock_item_name: product.name,
          type: body.p_is_loss ? 'LOSS' : 'ADJUSTMENT',
          quantity_change: body.p_delta,
          unit_price: product.price || 0,
          reference_entity: 'adjustment',
          reference_id: product.id,
          notes: `${body.p_reason}${body.p_notes ? `: ${body.p_notes}` : ''}`,
          created_at: new Date().toISOString(),
          branches: { name: 'QA Şube' },
        }, ...(fixtures.stockMovementRows || [])];
      }
      await route.fulfill({ status: 200, contentType: 'application/json', headers: corsHeaders, body: JSON.stringify(updated) });
      return;
    }
    if (table === 'stock_movements') {
      rows = fixtures.stockMovementRows || [];
    }
    if (table === 'stock_items') {
      if (route.request().method() === 'POST') {
        if (fixtures.failStockInsert) {
          await route.fulfill({ status: 400, contentType: 'application/json', headers: corsHeaders, body: JSON.stringify({ code: '23514', message: 'Ürün kategorisi veritabanı kuralına uymuyor.' }) });
          return;
        }
        const body = route.request().postDataJSON() as Record<string, unknown>[];
        rows = [{ ...body[0], id: '66666666-6666-4666-8666-666666666666' }];
      } else {
        rows = fixtures.stockRows || [];
      }
    }
    if (table === 'appointments' && route.request().method() === 'POST') {
      const body = route.request().postDataJSON() as Record<string, unknown>[];
      const row = { ...body[0], id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb' };
      fixtures.appointmentRows = [...(fixtures.appointmentRows || []), row];
      rows = [row];
    }
    if (table === 'recall_items' && route.request().method() === 'POST') {
      const body = route.request().postDataJSON() as Record<string, unknown> | Record<string, unknown>[];
      const insertBody = Array.isArray(body) ? body[0] : body;
      const recall = {
        ...insertBody,
        id: 'edededed-eded-4ded-8ded-edededededed',
        patients: { first_name: 'Test Hasta', last_name: 'Tek Şube Bir' },
      };
      fixtures.recallInsertBodies?.push(insertBody);
      fixtures.recallRows = [...(fixtures.recallRows || []), recall];
      await route.fulfill({
        status: 201,
        contentType: 'application/vnd.pgrst.object+json',
        headers: corsHeaders,
        body: JSON.stringify(recall),
      });
      return;
    }
    if (table === 'activity_logs' && route.request().method() === 'POST') {
      const body = route.request().postDataJSON() as Record<string, unknown>;
      fixtures.activityInsertBodies?.push(body);
      fixtures.activityRows = [{
        ...body,
        id: 'abababab-abab-4bab-8bab-abababababab',
        created_at: new Date().toISOString(),
        actor: { first_name: 'Playwright', last_name: 'Test', roles: ['Firma Yöneticisi'] },
        branches: { name: 'QA Şube' },
      }, ...(fixtures.activityRows || [])];
      await route.fulfill({ status: 201, contentType: 'application/json', headers: corsHeaders, body: JSON.stringify(fixtures.activityRows[0]) });
      return;
    }
    if (table === 'service_tickets' && route.request().method() === 'POST') {
      const body = route.request().postDataJSON() as Record<string, unknown>;
      fixtures.serviceInsertBodies?.push(body);
      if (fixtures.failServiceInsert) {
        await route.fulfill({
          status: 400,
          contentType: 'application/json',
          headers: corsHeaders,
          body: JSON.stringify({ code: '23514', message: 'Servis durumu veritabanı kuralına uymuyor.' }),
        });
        return;
      }
      const serviceId = String(body.id || '99999999-9999-4999-8999-999999999999');
      const currentService = fixtures.serviceRows?.find(row => row.id === serviceId) || {};
      fixtures.serviceRows = [
        { ...currentService, ...body, id: serviceId },
        ...(fixtures.serviceRows || []).filter(row => row.id !== serviceId),
      ];
      await route.fulfill({
        status: 201,
        contentType: 'application/vnd.pgrst.object+json',
        headers: corsHeaders,
        body: JSON.stringify({ id: body.id }),
      });
      return;
    }
    if (table === 'asset_maintenance_records') {
      if (route.request().method() === 'POST') {
        const body = route.request().postDataJSON() as Record<string, unknown>;
        const row = { ...body, id: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc', created_at: new Date().toISOString() };
        fixtures.maintenanceRows = [...(fixtures.maintenanceRows || []), row];
        rows = [row];
      } else rows = fixtures.maintenanceRows || [];
    }
    if (table === 'cash_transactions' && route.request().method() === 'POST') {
      const body = route.request().postDataJSON() as Record<string, unknown>[];
      const transaction = body[0];
      if (typeof transaction.branch_id === 'string') fixtures.cashBranchIds?.push(transaction.branch_id);
      rows = [{ ...transaction, id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', created_at: new Date().toISOString() }];
      fixtures.cashRows = [...rows as Record<string, unknown>[], ...(fixtures.cashRows || [])];
    } else if (table === 'cash_transactions') {
      rows = fixtures.cashRows || [];
    }
    if (table === 'expenses' && route.request().method() === 'POST') {
      const body = route.request().postDataJSON() as Record<string, unknown>[];
      if (typeof body[0].branch_id === 'string') fixtures.expenseBranchIds?.push(body[0].branch_id);
      rows = [{ ...body[0], id: 'abababab-abab-4bab-8bab-abababababab', created_at: new Date().toISOString() }];
    }
    if (table === 'sgk_period_invoices' && route.request().method() === 'POST') {
      const body = route.request().postDataJSON() as Record<string, unknown>;
      if (typeof body.branch_id === 'string') fixtures.invoiceBranchIds?.push(body.branch_id);
      rows = [{ ...body, id: 'acacacac-acac-4cac-8cac-acacacacacac', created_at: new Date().toISOString() }];
    }

    if (table === 'organization_settings') {
      if (['POST', 'PATCH', 'PUT'].includes(route.request().method())) {
        const body = route.request().postDataJSON();
        const payload = Array.isArray(body) ? body[0] : body;
        fixtures.orgSettings = { ...(fixtures.orgSettings || {}), ...payload, organization_id: orgId };
        await route.fulfill({ status: 200, contentType: 'application/json', headers: corsHeaders, body: JSON.stringify([fixtures.orgSettings]) });
        return;
      }
      if (route.request().headers()['accept']?.includes('vnd.pgrst.object+json')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/vnd.pgrst.object+json',
          headers: corsHeaders,
          body: JSON.stringify(fixtures.orgSettings || { organization_id: orgId, notification_settings: null }),
        });
        return;
      }
      rows = fixtures.orgSettings ? [fixtures.orgSettings] : [{ organization_id: orgId, notification_settings: null }];
    } else if (table === 'memberships') {
      if (['POST', 'PATCH', 'PUT'].includes(route.request().method())) {
        const body = route.request().postDataJSON();
        const payload = Array.isArray(body) ? body[0] : body;
        const currentMember = (fixtures.memberRows || [{ id: '55555555-5555-4555-8555-555555555555', user_id: userId, organization_id: orgId, branch_id: branchId, first_name: 'Playwright', last_name: 'Test', email: 'playwright@example.invalid', roles: ['Firma Yöneticisi'], status: 'active' }])[0];
        const updatedMember = { ...currentMember, ...payload };
        fixtures.memberRows = [updatedMember];
        await route.fulfill({ status: 200, contentType: 'application/json', headers: corsHeaders, body: JSON.stringify([updatedMember]) });
        return;
      }
      rows = fixtures.memberRows || [{ id: '55555555-5555-4555-8555-555555555555', user_id: userId, organization_id: orgId, branch_id: branchId, first_name: 'Playwright', last_name: 'Test', email: 'playwright@example.invalid', roles: ['Firma Yöneticisi'], status: 'active' }];
    } else if (table === 'my_organizations') {
      rows = [{ organization_id: orgId, name: 'Playwright Yalıtılmış Test Firması' }];
    } else if (table === 'branches') {
      rows = fixtures.branchRows || [
        { id: branchId, organization_id: orgId, name: 'QA Şube', status: 'active', archived_at: null },
      ];
    } else if (table === 'assets' && withAsset) {
      const existingAsset: any = {
        id: assetId,
        organization_id: orgId,
        branch_id: branchId,
        name: assetName,
        category: 'Klinik Cihaz',
        model: 'Test Model',
        serial_no: fixtures.assetSerial || 'PW-ONLY-001',
        purchase_date: '2026-01-10',
        purchase_price: 12000,
        warranty_expiry: fixtures.assetWarrantyExpiry === undefined ? '2027-01-10' : fixtures.assetWarrantyExpiry,
        status: fixtures.assetStatus || 'Aktif',
        archived_at: null,
        branches: { name: 'QA Şube' },
      };
      if (['POST', 'PATCH', 'PUT'].includes(route.request().method())) {
        const body = route.request().postDataJSON();
        const payload = (Array.isArray(body) ? body[0] : body) as Record<string, unknown>;
        const requestedId = url.searchParams.get('id')?.replace(/^eq\./, '') || String(payload.id || existingAsset.id);
        fixtures.assetUpdateBodies?.push({ ...payload, id: requestedId });
        existingAsset.id = requestedId;
        Object.assign(existingAsset, payload);
        if (payload.branch_id) {
          existingAsset.branch_id = payload.branch_id;
          const matchedBranch = (fixtures.branchRows || [
            { id: branchId, name: 'QA Şube' },
            { id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', name: 'Şube 2 (Kadıköy)' }
          ]).find((b: any) => b.id === payload.branch_id);
          existingAsset.branches = { name: String((matchedBranch as any)?.name || 'Şube 2 (Kadıköy)') };
        }
        fixtures.assetStatus = String(existingAsset.status);
        await route.fulfill({ status: 200, contentType: 'application/vnd.pgrst.object+json', headers: corsHeaders, body: JSON.stringify(existingAsset) });
        return;
      }
      rows = [existingAsset, ...(fixtures.additionalAssetRows || [])];
    } else if (table === 'service_tickets') {
      rows = fixtures.serviceRows || [];
    } else if (table === 'suppliers') {
      rows = fixtures.supplierRows || [];
    } else if (table === 'sgk_period_invoices') {
      const isInvoiceNumberLookup = url.searchParams.has('invoice_no');
      rows = isInvoiceNumberLookup || !fixtures.hideInvoiceRowsFromList ? fixtures.invoiceRows || [] : [];
    } else if (table === 'sgk_payment_records') {
      rows = fixtures.paymentRows || [];
    } else if (table === 'patients') {
      rows = fixtures.patientRows || [];
    } else if (table === 'recall_items') {
      rows = (fixtures.recallRows || []).map(row => ({
        ...row,
        patients: fixtures.patientRows?.find(patient => patient.id === row.patient_id) || (row as any).patients,
      }));
    } else if (table === 'appointments') {
      rows = (fixtures.appointmentRows || []).map(row => ({ ...row, patients: fixtures.patientRows?.find(patient => patient.id === row.patient_id) || row.patients }));
    } else if (table === 'activity_logs') {
      rows = fixtures.activityRows || [];
    } else if (table === 'decrypt_patient_tcs') {
      const patientIds = (route.request().postDataJSON() as { p_patient_ids?: string[] }).p_patient_ids || [];
      rows = (fixtures.patientRows || []).filter(patient => patientIds.includes(String(patient.id))).map(patient => ({ patient_id: patient.id, tc: patient.decrypted_tc || '' }));
    } else if (table === 'transfer_patient_branch') {
      const body = route.request().postDataJSON() as Record<string, unknown>;
      const transferRecord = {
        id: '61616161-6161-4161-8161-616161616161',
        organization_id: orgId,
        patient_id: body.p_patient,
        patient_name: 'Test Hasta Tek Şube Bir',
        source_branch_id: branchId,
        target_branch_id: body.p_target,
        transferred_by: userId,
        created_at: new Date().toISOString(),
        notes: 'Hasta şube transferi tamamlandı.'
      };
      fixtures.transferRows = [transferRecord, ...(fixtures.transferRows || [])];
      await route.fulfill({ status: 200, contentType: 'application/json', headers: corsHeaders, body: JSON.stringify(null) });
      return;
    } else if (table === 'branch_transfers') {
      rows = fixtures.transferRows || [
        {
          id: '51515151-5151-4151-8151-515151515151',
          organization_id: orgId,
          patient_id: '11111111-1111-4111-8111-111111111111',
          patient_name: 'Test Hasta Tek Şube Bir',
          source_branch_id: branchId,
          target_branch_id: branchId,
          transferred_by: userId,
          created_at: new Date().toISOString(),
          notes: 'Şubeler arası transfer tamamlandı.'
        }
      ];
    }

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      headers: { ...corsHeaders, 'Content-Range': `0-${Math.max(rows.length - 1, 0)}/${rows.length}` },
      body: JSON.stringify(rows),
    });
  });
}

async function signIn(page: Page) {
  await page.goto('/');
  await page.getByPlaceholder('ornek@audipro.com').fill('playwright@example.invalid');
  await page.getByPlaceholder('••••••••').fill('playwright-test-password');
  await page.getByRole('button', { name: 'Giriş Yap' }).click();
  try {
    await expect(page.getByRole('button', { name: 'Giriş Yap' })).not.toBeVisible({ timeout: 5000 });
  } catch {
    await page.getByPlaceholder('ornek@audipro.com').fill('playwright@example.invalid');
    await page.getByPlaceholder('••••••••').fill('playwright-test-password');
    await page.getByRole('button', { name: 'Giriş Yap' }).click();
    await expect(page.getByRole('button', { name: 'Giriş Yap' })).not.toBeVisible({ timeout: 15000 });
  }
}

async function openAssets(page: Page, withAsset: boolean, fixtures: ExtraFixtures = {}) {
  await mockTenantData(page, withAsset, fixtures);
  await signIn(page);
  await expect(page.getByRole('button', { name: 'Demirbaşlar' })).toBeVisible();
  await page.getByRole('button', { name: 'Demirbaşlar' }).click();
  await expect(page.getByRole('heading', { name: 'Demirbaş & Klinik Cihaz Yönetimi' })).toBeVisible();
}

test('aktivite formunda etiketli aktif şube seçilir ve not kaydedilir', async ({ page }) => {
  const patientId = 'abababab-abab-4bab-8bab-abababababab';
  const activityInsertBodies: Record<string, unknown>[] = [];
  await mockTenantData(page, false, {
    patientRows: [{
      id: patientId, organization_id: orgId, branch_id: branchId,
      first_name: 'Test', last_name: 'Hasta', phone: '05000000001',
      patient_status: 'Aktif', deleted_at: null,
    }],
    activityRows: [],
    activityInsertBodies,
  });
  await signIn(page);
  await page.getByRole('button', { name: 'Aktivite Kaydı' }).click();
  await page.getByRole('button', { name: 'Yeni Aktivite Gir' }).click();

  const dialog = page.getByRole('dialog', { name: 'Yeni Aktivite Kaydı Gir' });
  const branchSelect = dialog.getByRole('combobox', { name: 'Şube' });
  await expect(branchSelect).toBeEnabled();
  await branchSelect.selectOption(branchId);
  await dialog.getByLabel('Personel').selectOption('55555555-5555-4555-8555-555555555555');
  await dialog.getByLabel('Hasta Adı Soyadı *').fill('Test Hasta');
  await dialog.getByRole('option', { name: /Test Hasta/ }).click();
  await dialog.getByPlaceholder('Görüşme veya işlem özetini girin...').fill('E2E aktivite notu');
  await dialog.getByRole('button', { name: 'Kaydet' }).click();

  await expect.poll(() => activityInsertBodies.length).toBe(1);
  expect(activityInsertBodies[0]).toMatchObject({
    organization_id: orgId,
    branch_id: branchId,
    patient_id: patientId,
    activity_type: 'Arama',
    description: 'E2E aktivite notu',
  });
  await expect(dialog).toHaveCount(0);
});

const stockId = '77777777-7777-4777-8777-777777777777';
const stockFixture = {
  id: stockId,
  organization_id: orgId,
  branch_id: branchId,
  name: 'E2E Test Cihazı',
  category: 'Cihaz',
  brand: 'Test',
  model: 'Model 1',
  serial_no: 'E2E-001',
  barcode: 'E2E-BAR-001',
  quantity: 0,
  critical_level: 1,
  price: 1000,
  purchase_price: 700,
  status: 'Stokta',
  uts_status: 'Gerekli Değil',
};

test('ürün ekleme formu kaydedilen ürünü envantere ekler ve veritabanı hatasını görünür kılar', async ({ page }) => {
  await mockTenantData(page, false);
  await signIn(page);
  await page.getByRole('button', { name: 'Stok & Aksesuar' }).click();
  await page.getByRole('button', { name: 'Yeni Ürün Ekle' }).click();
  await page.getByPlaceholder('Örn: İşitme cihazı').fill('E2E Yeni Ürün');
  await page.getByRole('button', { name: 'Ürünü Kaydet' }).click();
  await expect(page.getByText('E2E Yeni Ürün').first()).toBeVisible();
});

test('ürün kaydı reddedildiğinde gerçek sunucu doğrulama hatası form içinde görünür', async ({ page }) => {
  await mockTenantData(page, false, { failStockInsert: true });
  await signIn(page);
  await page.getByRole('button', { name: 'Stok & Aksesuar' }).click();
  await page.getByRole('button', { name: 'Yeni Ürün Ekle' }).click();
  await page.getByPlaceholder('Örn: İşitme cihazı').fill('E2E Hatalı Ürün');
  await page.getByRole('button', { name: 'Ürünü Kaydet' }).click();
  await expect(page.locator('div[role="alert"]').filter({ hasText: 'Ürün kategorisi veritabanı kuralına uymuyor.' }).first()).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Yeni Ürün / Stok Kartı Ekle' })).toBeVisible();
});

test('stok hareketi delta ve hareket geçmişi kaydedilir, satır/drawer miktarı anında güncellenir', async ({ page }) => {
  await mockTenantData(page, false, { stockRows: [{ ...stockFixture, category: 'Pil', serial_no: '' }] });
  await signIn(page);
  await page.getByRole('button', { name: 'Stok & Aksesuar' }).click();
  const row = page.getByRole('row').filter({ hasText: 'E2E Test Cihazı' });
  await row.getByTitle('İşlemler').click();
  await page.getByRole('button', { name: /Stok Hareketi Ekle/ }).click();
  await page.getByText('Hareket Miktarı (Adet)').locator('..').locator('input').fill('3');
  await page.getByRole('button', { name: 'Hareketi Uygula' }).click();
  await expect(row).toContainText('3');
  await expect(page.getByText('E2E Test Cihazı stok adedi 3 olarak güncellendi.')).toBeVisible();
  await page.getByRole('button', { name: 'Hareketler', exact: true }).click();
  await expect(page.getByText('+3 Adet')).toBeVisible();
  await expect(page.getByText('Sayım Düzeltmesi: Manuel işlem')).toBeVisible();
  await page.getByRole('button', { name: 'Stok', exact: true }).click();
  await expect(page.getByText('3 Adet')).toBeVisible();
  await page.getByPlaceholder('Ürün adı, marka, seri no veya barkod ile ara...').fill('3 Adet');
  await expect(row).toBeVisible();
});

test('stok hareketi RPC hatası görünür olur ve başarısız güncelleme miktarı değiştirmez', async ({ page }) => {
  await mockTenantData(page, false, { stockRows: [{ ...stockFixture, category: 'Pil', serial_no: '', quantity: 1 }], failStockAdjustment: true });
  await signIn(page);
  await page.getByRole('button', { name: 'Stok & Aksesuar' }).click();
  const row = page.getByRole('row').filter({ hasText: 'E2E Test Cihazı' });
  await row.getByTitle('İşlemler').click();
  await page.getByRole('button', { name: /Stok Hareketi Ekle/ }).click();
  await page.getByText('Hareket Miktarı (Adet)').locator('..').locator('input').fill('3');
  await page.getByRole('button', { name: 'Hareketi Uygula' }).click();
  await expect(page.getByRole('alert').filter({ hasText: 'Stock item is unavailable in this branch' }).first()).toBeVisible();
  await expect(page.getByRole('button', { name: 'Hareketi Uygula' })).toBeVisible();
  await expect(row).toContainText('1');
});

test('seri numaralı cihaz miktarı çoğaltılmaz ve yeni seri girişine geçilebilir', async ({ page }) => {
  await mockTenantData(page, false, { stockRows: [{ ...stockFixture, quantity: 1 }] });
  await signIn(page);
  await page.getByRole('button', { name: 'Stok & Aksesuar' }).click();
  await page.getByRole('row').filter({ hasText: stockFixture.name }).getByTitle('İşlemler').click();
  await page.getByRole('button', { name: /Stok Hareketi Ekle/ }).click();
  await page.getByText('Hareket Miktarı (Adet)').locator('..').locator('input').fill('3');
  await page.getByRole('button', { name: 'Hareketi Uygula' }).click();
  await expect(page.getByRole('alert').filter({ hasText: 'Bu seri numarası tek bir cihaza aittir.' })).toBeVisible();
  await page.getByRole('button', { name: 'Yeni seri numaralı cihaz ekle' }).click();
  await expect(page.getByRole('heading', { name: 'Yeni Ürün / Stok Kartı Ekle' })).toBeVisible();
  await expect(page.getByPlaceholder('Örn: İşitme cihazı')).toHaveValue(stockFixture.name);
});

test('hızlı satış seçilen hasta ve ürünü ilişkili satış RPCsiyle kaydeder', async ({ page }) => {
  const patientId = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd';
  const saleRpcPayloads: Record<string, unknown>[] = [];
  await mockTenantData(page, false, {
    patientRows: [{ id: patientId, organization_id: orgId, branch_id: branchId, first_name: 'E2E', last_name: 'Satış Hastası', phone: '05000000001', patient_status: 'Aktif', deleted_at: null }],
    stockRows: [{ ...stockFixture, quantity: 1 }],
    saleRpcPayloads,
  });
  await signIn(page);
  await page.getByRole('button', { name: 'Stok & Aksesuar' }).click();
  await page.getByRole('button', { name: 'Hızlı Satış' }).first().click();
  await page.getByLabel('Kayıtlı Hasta').selectOption(patientId);
  await page.getByLabel('Satılacak Ürün / Cihaz').selectOption(stockId);
  await page.getByLabel('Cihazın takılacağı kulak').selectOption('Sağ');
  await page.getByRole('button', { name: 'Satışı Onayla' }).click();
  await expect.poll(() => saleRpcPayloads.length).toBe(1);
  expect(saleRpcPayloads[0]).toMatchObject({ p_stock: stockId, p_register: 'kas-1' });
  expect(saleRpcPayloads[0].p_sale).toMatchObject({ patient_id: patientId, status: 'Tahsil Edildi', device_ear_side: 'Sağ' });
  await expect(page.getByRole('heading', { name: 'Hızlı Satış Fişi / Çıkışı' })).toHaveCount(0);
  await page.reload();
  await page.getByRole('button', { name: 'Stok & Aksesuar' }).click();
  const row = page.getByRole('row').filter({ hasText: 'E2E Test Cihazı' });
  await expect(row).toContainText('Stok Yok');
  await row.click();
  await page.getByRole('button', { name: 'Hareketler', exact: true }).click();
  await expect(page.getByText('-1 Adet')).toBeVisible();
});

test('envanter seri numarası araması ayraç ve boşluk farklarını normalize eder', async ({ page }) => {
  await mockTenantData(page, false, {
    stockRows: [{ ...stockFixture, serial_no: 'QA SN 1B 001' }],
  });
  await signIn(page);
  await page.getByRole('button', { name: 'Stok & Aksesuar' }).click();
  await page.getByPlaceholder('Ürün adı, marka, seri no veya barkod ile ara...').fill('QA-SN-1B-001');
  const row = page.getByRole('row').filter({ hasText: 'E2E Test Cihazı' });
  await expect(row).toBeVisible();
  await expect(row).toContainText('QA SN 1B 001');
});

test('randevu formu gecikmeli yüklenen tek aktif şubeyi seçip kaydı takvime ekler', async ({ page }) => {
  const patientId = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd';
  const appointmentFixture: ExtraFixtures = {
    patientRows: [{ id: patientId, organization_id: orgId, branch_id: branchId, first_name: 'E2E', last_name: 'Hasta', phone: '05000000001', tc: '0000000001', patient_status: 'Aktif', deleted_at: null }],
    appointmentRows: [],
  };
  await mockTenantData(page, false, appointmentFixture);
  await signIn(page);
  await page.getByRole('button', { name: 'Randevular', exact: true }).click();
  await page.getByRole('button', { name: /Yeni Randevu/ }).click();
  await page.getByPlaceholder('Hasta seçin veya arayın...').fill('E2E Hasta');
  await page.getByText('E2E Hasta - 05000000001', { exact: true }).click();
  await page.getByRole('button', { name: 'Randevu Oluştur' }).click();
  await expect.poll(() => appointmentFixture.appointmentRows?.length).toBe(1);
  expect(appointmentFixture.appointmentRows?.[0].branch_id).toBe(branchId);
  await expect(page.getByText('E2E Hasta').first()).toBeVisible();
});

test('hatırlatma araması kayıtlı hastanın TC kimlik numarasını eşleştirir', async ({ page }) => {
  const patientId = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd';
  await mockTenantData(page, false, {
    patientRows: [{ id: patientId, organization_id: orgId, branch_id: branchId, first_name: 'E2E', last_name: 'Hasta', phone: '05000000001', tc: 'ENC:v2:test', decrypted_tc: '0000000001', patient_status: 'Aktif', deleted_at: null }],
    recallRows: [{ id: 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee', organization_id: orgId, patient_id: patientId, patients: { first_name: 'E2E', last_name: 'Hasta' }, reason: 'Pil değişimi', due_date: '2026-12-01', status: 'Bekliyor', last_contact: null, estimated_revenue: 0, probability: null }],
  });
  await signIn(page);
  await page.getByRole('button', { name: 'Recall' }).click();
  await page.getByPlaceholder('Hasta adı, telefon, TC veya cihaz seri no...').fill('0000000001');
  await expect(page.getByText('E2E Hasta').first()).toBeVisible();
});

test('hatırlatma tarih filtresi Türkçe aralığı doğru uygular', async ({ page }) => {
  const patientId = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd';
  await mockTenantData(page, false, {
    patientRows: [{ id: patientId, organization_id: orgId, branch_id: branchId, first_name: 'E2E', last_name: 'Ekim Hastası', phone: '05000000001', patient_status: 'Aktif', deleted_at: null }],
    recallRows: [{ id: 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee', organization_id: orgId, patient_id: patientId, patients: { first_name: 'E2E', last_name: 'Ekim Hastası' }, reason: 'Pil değişimi', due_date: '2026-10-29', status: 'Bekliyor' }],
  });
  await signIn(page);
  await page.getByRole('button', { name: 'Recall' }).click();
  await page.getByPlaceholder('Tarih Aralığı: Başlangıç → Bitiş 📅').fill('01.11.2026 - 30.11.2026');
  await expect(page.getByText('E2E Ekim Hastası')).toHaveCount(0);
  await expect(page.getByText('Filtrelere uyan hatırlatma bulunamadı.')).toBeVisible();
});

test('servis durum kartı ve tablo aynı aktif şube kayıtlarını gösterir', async ({ page }) => {
  await mockTenantData(page, false, {
    serviceRows: [{
      id: '99999999-9999-4999-8999-999999999999', organization_id: orgId, branch_id: branchId,
      patient_name: 'E2E Servis Hastası', device_name: 'E2E Servis Cihazı', device_serial: 'E2E-SVC-1', barcode: 'E2E-SVC-BAR',
      received_date: '2026-10-01', delivered_date: null, complaint: 'Kontrol', service_fee: 0,
      status: 'Bekliyor', technician: 'Teknik Servis', notes: '', details: { status: 'Alındı', operations: [], warrantyRepair: false },
    }],
  });
  await signIn(page);
  await page.getByRole('button', { name: 'Teknik Servis' }).click();
  await page.getByLabel('Servis durumu').selectOption('Teslim Edildi');
  await expect(page.getByText('Kriterlere uygun teknik servis kaydı bulunamadı.')).toBeVisible();
  await page.getByRole('button', { name: 'Alındı (1)' }).click();
  await expect(page.getByLabel('Servis durumu')).toHaveValue('Alındı');
  await expect(page.getByRole('row').filter({ hasText: 'E2E Servis Cihazı' })).toBeVisible();
  await expect(page.getByText('Kriterlere uygun teknik servis kaydı bulunamadı.')).toHaveCount(0);
  await page.getByPlaceholder('Hasta adı, cihaz, seri no ile ara...').fill('eşleşmeyen-seri');
  await expect(page.getByRole('button', { name: 'Alındı (0)' })).toBeVisible();
  await expect(page.getByText('Kriterlere uygun teknik servis kaydı bulunamadı.')).toBeVisible();
});

test('/hastalar doğrudan adresi hasta yönetimine yönlendirir', async ({ page }) => {
  const patientId = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd';
  await mockTenantData(page, false, { patientRows: [{ id: patientId, organization_id: orgId, branch_id: branchId, first_name: 'E2E', last_name: 'Rota Hastası', patient_status: 'Aktif', deleted_at: null }] });
  await page.goto('/hastalar');
  await expect(page.getByPlaceholder('ornek@audipro.com')).toBeVisible();
  await page.getByPlaceholder('ornek@audipro.com').fill('playwright@example.invalid');
  await page.getByPlaceholder('••••••••').fill('playwright-test-password');
  await page.getByRole('button', { name: 'Giriş Yap' }).click();
  await expect(page.getByRole('heading', { name: 'Hasta Yönetimi' })).toBeVisible();
  await expect(page.getByText('E2E Rota Hastası')).toBeVisible();
});

test('yeni hatırlatma hastaya bağlanır ve şemada olmayan hasta_adı alanı gönderilmez', async ({ page }) => {
  const patientId = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd';
  const recallInsertBodies: Record<string, unknown>[] = [];
  await mockTenantData(page, false, {
    patientRows: [{
      id: patientId,
      organization_id: orgId,
      branch_id: branchId,
      first_name: 'Test Hasta',
      last_name: 'Tek Şube Bir',
      phone: '05000000001',
      tc: 'ENC:v2:test',
      patient_status: 'Aktif',
      deleted_at: null,
    }],
    recallRows: [],
    recallInsertBodies,
  });
  await signIn(page);
  await page.getByRole('button', { name: 'Recall' }).click();
  await page.getByRole('button', { name: 'Yeni Hatırlatma' }).click();
  await page.getByRole('combobox', { name: 'Hasta Adı *' }).fill('Test Hasta Tek Şube Bir');
  await page.getByRole('option', { name: /Test Hasta Tek Şube Bir/ }).click();
  await page.locator('input[type="date"]').fill('2026-10-10');
  await page.getByRole('button', { name: 'Kaydet' }).click();

  await expect.poll(() => recallInsertBodies.length).toBe(1);
  expect(recallInsertBodies[0]).toMatchObject({
    patient_id: patientId,
    organization_id: orgId,
    due_date: '2026-10-10',
  });
  expect(recallInsertBodies[0]).not.toHaveProperty('patient_name');
  await expect(page.getByText('Test Hasta Tek Şube Bir').first()).toBeVisible();
  await expect(page.getByRole('dialog')).toHaveCount(0);
});

test('hasta listesi telefon aramasını boşluk, tire ve ülke kodu biçimlerinden bağımsız eşleştirir', async ({ page }) => {
  const patientId = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd';
  await mockTenantData(page, false, {
    patientRows: [{
      id: patientId,
      organization_id: orgId,
      branch_id: branchId,
      first_name: 'QA Telefon',
      last_name: 'Hastası',
      phone: '+90 (000) 000-00-06',
      tc: 'ENC:v2:test',
      decrypted_tc: '',
      patient_status: 'Aktif',
      deleted_at: null,
    }],
  });
  await signIn(page);
  await page.getByRole('button', { name: 'Hastalar' }).click();
  await page.getByPlaceholder('Hasta adı, telefon, TC, cihaz seri no...').fill('0000000006');
  const row = page.getByRole('row').filter({ hasText: 'QA Telefon Hastası' });
  await expect(row).toBeVisible();
  await expect(page.getByText('Toplam 1 hasta')).toBeVisible();
});

test('SGK ödeme zaman çizelgesi, seçilen dönem için hesaplanır', async ({ page }) => {
  await mockTenantData(page, false, {
    invoiceRows: [{
      id: '88888888-8888-4888-8888-888888888888', organization_id: orgId, branch_id: branchId,
      invoice_month: '2026-09-01', expected_month: '2026-11-01', invoice_no: 'QA-SEP', amount: 25000,
      status: 'Bekliyor', created_at: '2026-09-01T12:00:00Z', notes: '',
    }],
  });
  await signIn(page);
  await page.getByRole('button', { name: 'SGK Ödeme Takvimi' }).click();
  await page.locator('input[type="month"]').fill('2026-09');
  const timeline = page.locator('[class*="timelineCard"]');
  await expect(timeline).toContainText('25.000');
  await page.locator('input[type="month"]').fill('2026-08');
  await expect(timeline).not.toContainText('25.000');
});

test('SGK Ağustos dönemi ödeme zaman çizelgesi Kasım 2026 ayını ve yıllık takvimi aynı kuralla gösterir', async ({ page }) => {
  await mockTenantData(page, false, {
    invoiceRows: [{
      id: '88888888-8888-4888-8888-888888888888', organization_id: orgId, branch_id: branchId,
      invoice_month: '2026-08-01', expected_month: '2026-10-01', invoice_no: 'QA-AUG', amount: 0,
      status: 'Bekliyor', created_at: '2026-08-01T12:00:00Z', notes: '',
    }],
  });
  await signIn(page);
  await page.getByRole('button', { name: 'SGK Ödeme Takvimi' }).click();
  await page.locator('input[type="month"]').fill('2026-08');

  const november = page.locator('[data-payment-month="2026-11"]');
  await expect(november).toBeVisible();
  await expect(november).toContainText('Beklenen ödeme');

  await page.getByRole('button', { name: 'Takvim Gör' }).click();
  const yearlyNovember = page.locator('[data-payment-month="2026-11"]').last();
  await expect(yearlyNovember).toBeVisible();
  await expect(yearlyNovember).toContainText('Beklenen ödeme');
});

test('SGK faturası tahsil edildiğinde ödeme geçmişinde gerçek tahsilat satırı oluşur', async ({ page }) => {
  const invoiceId = '88888888-8888-4888-8888-888888888888';
  const paymentInsertBodies: Record<string, unknown>[] = [];
  await mockTenantData(page, false, {
    invoiceRows: [{
      id: invoiceId, organization_id: orgId, branch_id: branchId,
      invoice_month: '2026-09-01', expected_month: '2026-11-01', invoice_no: 'QA-SGK-3B-202609', amount: 25000,
      status: 'Bekliyor', created_at: '2026-09-01T12:00:00Z', notes: 'E2E tahsilat doğrulaması',
    }],
    paymentRows: [],
    paymentInsertBodies,
  });
  await signIn(page);
  await page.getByRole('button', { name: 'SGK Ödeme Takvimi' }).click();
  const invoiceRow = page.getByRole('row').filter({ hasText: 'QA-SGK-3B-202609' });
  await expect(invoiceRow).toContainText('Bekliyor');
  await invoiceRow.locator('button[title="İşlemler"]').click();
  await page.getByRole('button', { name: /Tahsil Edildi Yap/ }).click();

  await expect.poll(() => paymentInsertBodies.length).toBe(1);
  expect(paymentInsertBodies[0]).toMatchObject({ p_invoice_id: invoiceId, p_amount: 25000 });
  await expect(invoiceRow).toContainText('Tahsil Edildi');

  await page.getByRole('button', { name: 'Tahsilat Geçmişi' }).click();
  const paymentRow = page.getByRole('row').filter({ hasText: 'QA-SGK-3B-202609' });
  await expect(paymentRow).toBeVisible();
  await expect(paymentRow).toContainText('25.000');
  await expect(page.getByText('Toplam 1 tahsilat kaydı')).toBeVisible();
});

test('servis raporu dışa aktarma gerçek, yazdırılabilir rapor görüntüleyici açar', async ({ page }) => {
  await mockTenantData(page, false, {
    serviceRows: [{
      id: '99999999-9999-4999-8999-999999999999', organization_id: orgId, branch_id: branchId,
      patient_name: 'E2E Hasta', device_name: 'E2E Cihaz', device_serial: 'E2E-SN', barcode: 'E2E-BC',
      received_date: '2026-09-20', delivered_date: null, complaint: 'Ses kesilmesi', service_fee: 0,
      status: 'Bekliyor', technician: 'Teknik Servis', notes: '', details: { status: 'Alındı', operations: [], warrantyRepair: true },
    }],
  });
  await signIn(page);
  await page.getByRole('button', { name: 'Teknik Servis' }).click();
  await page.getByRole('row').filter({ hasText: 'E2E Cihaz' }).click();
  await page.getByRole('button', { name: 'Servis Raporu' }).click();
  const popupPromise = page.waitForEvent('popup');
  await page.getByRole('button', { name: 'Raporu Dışa Aktar' }).click();
  const report = await popupPromise;
  await expect(report.getByRole('heading', { name: 'Servis Raporu - E2E Cihaz' })).toBeVisible();
  await expect(report.getByText('E2E Hasta')).toBeVisible();
  await expect(report.getByRole('button', { name: 'Yazdır / PDF olarak kaydet' })).toBeVisible();
});

test('tekil servis formu pop-up gerektirmeden yazdırılabilir rapor görüntüleyicisini açar', async ({ page }) => {
  const patientId = 'abababab-abab-4bab-8bab-abababababab';
  await mockTenantData(page, false, {
    patientRows: [{ id: patientId, organization_id: orgId, branch_id: branchId, first_name: 'E2E', last_name: 'Hasta', phone: '05000000001', patient_status: 'Aktif', deleted_at: null }],
    serviceRows: [{
      id: '99999999-9999-4999-8999-999999999999', organization_id: orgId, branch_id: branchId, patient_id: patientId,
      patient_name: 'E2E Hasta', patient_phone: '05000000001', device_name: 'E2E Cihaz', device_serial: 'E2E-SN', barcode: 'E2E-BC',
      received_date: '2026-09-20', delivered_date: null, complaint: 'Ses kesilmesi', service_fee: 0,
      status: 'Bekliyor', technician: 'Teknik Servis', notes: '', details: { status: 'Alındı', operations: [], warrantyRepair: true },
    }],
  });
  await signIn(page);
  await page.getByRole('button', { name: 'Teknik Servis' }).click();
  await page.getByRole('row').filter({ hasText: 'E2E Cihaz' }).click();
  await page.getByRole('button', { name: 'Servis Formu Yazdır' }).click();
  await page.getByRole('button', { name: 'Yazdır / PDF İndir' }).click();
  const report = page.getByRole('dialog', { name: 'Servis Raporu - E2E Cihaz' });
  await expect(report).toBeVisible();
  await expect(report.getByRole('heading', { name: 'Servis Raporu - E2E Cihaz' })).toBeVisible();
  await expect(report.getByText('E2E-SN')).toBeVisible();
  await expect(report.getByRole('button', { name: 'Yazdır / PDF olarak kaydet' })).toBeVisible();
  await report.getByRole('button', { name: 'Kapat', exact: true }).click();
  await expect(report).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Yazdır / PDF İndir' })).toHaveCount(0);
});

test('teknik servis durum penceresi iptal ile kapanır ve iptal edilen seçim kaydedilmez', async ({ page }) => {
  const serviceInsertBodies: Record<string, unknown>[] = [];
  await mockTenantData(page, false, {
    serviceRows: [{
      id: '99999999-9999-4999-8999-999999999999', organization_id: orgId, branch_id: branchId,
      patient_name: 'E2E Hasta', device_name: 'E2E Cihaz', device_serial: 'E2E-SN', barcode: 'E2E-BC',
      received_date: '2026-09-20', delivered_date: null, complaint: 'Ses kesilmesi', service_fee: 0,
      status: 'Bekliyor', technician: 'Teknik Servis', notes: '', details: { status: 'Alındı', operations: [], warrantyRepair: true },
    }],
    serviceInsertBodies,
  });
  await signIn(page);
  await page.getByRole('button', { name: 'Teknik Servis' }).click();
  const serviceRow = page.getByRole('row').filter({ hasText: 'E2E-SN' });
  await serviceRow.click();

  await page.getByRole('button', { name: 'Durum Güncelle' }).click();
  const statusDialog = page.getByRole('dialog', { name: /Servis Durumu Güncelle/ });
  await expect(statusDialog).toBeVisible();
  await statusDialog.locator('select').selectOption('Tamir Ediliyor');
  await statusDialog.getByRole('button', { name: 'İptal' }).click();
  await expect(statusDialog).toHaveCount(0);
  await expect(serviceRow).toContainText('Alındı');
  expect(serviceInsertBodies).toHaveLength(0);

  await page.getByRole('button', { name: 'Durum Güncelle' }).click();
  const reopenedDialog = page.getByRole('dialog', { name: /Servis Durumu Güncelle/ });
  await expect(reopenedDialog.locator('select')).toHaveValue('Alındı');
  await reopenedDialog.locator('select').selectOption('Tamir Ediliyor');
  await reopenedDialog.getByRole('button', { name: 'Güncellemeyi Kaydet' }).click();

  await expect(reopenedDialog).toHaveCount(0);
  await expect.poll(() => serviceInsertBodies.length).toBe(1);
  expect(serviceInsertBodies[0]).toMatchObject({
    status: 'İşlemde',
    details: { status: 'Tamir Ediliyor' },
  });
  await expect(serviceRow).toContainText('Tamir Ediliyor');
});

test('teknik servis kabul formu kaydı gerçek hasta ve şubeyle oluşturup modalı kapatır', async ({ page }) => {
  const patientId = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd';
  const serviceInsertBodies: Record<string, unknown>[] = [];
  await mockTenantData(page, false, {
    patientRows: [{
      id: patientId,
      organization_id: orgId,
      branch_id: branchId,
      first_name: 'Test Hasta',
      last_name: 'Tek Şube Bir',
      phone: '05000000001',
      patient_status: 'Aktif',
      deleted_at: null,
    }],
    serviceRows: [],
    serviceInsertBodies,
  });
  await signIn(page);
  await page.getByRole('button', { name: 'Teknik Servis' }).click();
  await page.getByRole('button', { name: 'Yeni Servis Kaydı' }).click();
  await page.getByPlaceholder('Örn: Ahmet Can').fill('Test Hasta Tek Şube Bir');
  await page.getByPlaceholder('05XX XXX XX XX').fill('05000000001');
  await page.getByPlaceholder('Örn: Oticon Real 1').fill('E2E Servis Cihazı');
  await page.getByPlaceholder('Örn: 1234567890').fill('QA-SN-SERVICE-CREATE-001');
  await page.getByPlaceholder('Örn: OT-001').fill('QA-SERVICE-CREATE-001');
  await page.getByPlaceholder('Örn: Ses kesilmesi, cızırtı, cihaz açılmıyor...').fill('E2E kabul arızası');
  await page.getByRole('button', { name: 'Servis Kaydını Aç' }).click();

  await expect.poll(() => serviceInsertBodies.length).toBe(1);
  expect(serviceInsertBodies[0]).toMatchObject({
    organization_id: orgId,
    branch_id: branchId,
    patient_id: patientId,
    patient_name: 'Test Hasta Tek Şube Bir',
    device_serial: 'QA-SN-SERVICE-CREATE-001',
    barcode: 'QA-SERVICE-CREATE-001',
    status: 'Bekliyor',
  });
  await expect(page.getByText('Yeni teknik servis kaydı oluşturuldu.')).toBeVisible();
  await expect(page.getByRole('heading', { name: /Yeni Teknik Servis Kaydı/ })).toHaveCount(0);
  await expect(page.getByRole('row').filter({ hasText: 'QA-SN-SERVICE-CREATE-001' })).toBeVisible();
});

test('teknik servis veritabanı hatası modalda gösterilir ve tekrar gönderim kilitlenmez', async ({ page }) => {
  const patientId = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd';
  await mockTenantData(page, false, {
    patientRows: [{ id: patientId, organization_id: orgId, branch_id: branchId, first_name: 'Test Hasta', last_name: 'Tek Şube Bir', phone: '05000000001', patient_status: 'Aktif', deleted_at: null }],
    serviceRows: [],
    serviceInsertBodies: [],
    failServiceInsert: true,
  });
  await signIn(page);
  await page.getByRole('button', { name: 'Teknik Servis' }).click();
  await page.getByRole('button', { name: 'Yeni Servis Kaydı' }).click();
  await page.getByPlaceholder('Örn: Ahmet Can').fill('Test Hasta Tek Şube Bir');
  await page.getByPlaceholder('Örn: Oticon Real 1').fill('E2E Servis Cihazı');
  await page.getByPlaceholder('Örn: 1234567890').fill('QA-SN-SERVICE-ERROR-001');
  await page.getByPlaceholder('Örn: OT-001').fill('QA-SERVICE-ERROR-001');
  await page.getByPlaceholder('Örn: Ses kesilmesi, cızırtı, cihaz açılmıyor...').fill('Test doğrulama');
  await page.getByRole('button', { name: 'Servis Kaydını Aç' }).click();
  await expect(page.getByRole('alert').filter({ hasText: 'Servis durumu veritabanı kuralına uymuyor.' }).first()).toBeVisible();
  await expect(page.getByRole('heading', { name: /Yeni Teknik Servis Kaydı/ })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Servis Kaydını Aç' })).toBeEnabled();
});

test('demirbaş, SGK fatura ve kasa tahsilat akışları gerçek aktif şubeyi kullanır', async ({ page }) => {
  const cashBranchIds: string[] = [];
  const expenseBranchIds: string[] = [];
  const invoiceBranchIds: string[] = [];
  await mockTenantData(page, false, { cashBranchIds, expenseBranchIds, invoiceBranchIds });
  await signIn(page);

  await page.getByRole('button', { name: 'Demirbaşlar' }).click();
  await page.getByRole('button', { name: 'Yeni Demirbaş Ekle' }).click();
  const assetBranch = page.locator('select').filter({ hasText: 'QA Şube' }).last();
  await expect(assetBranch).toContainText('QA Şube');
  await assetBranch.selectOption({ label: 'QA Şube' });
  await expect(assetBranch).toHaveValue('QA Şube');
  await page.getByRole('button', { name: '✕' }).last().click();

  await page.getByRole('button', { name: 'SGK Ödeme Takvimi' }).click();
  const sgkBranch = page.locator('select').filter({ hasText: 'QA Şube' }).first();
  await expect(sgkBranch).toContainText('QA Şube');
  await sgkBranch.selectOption({ label: 'QA Şube' });
  await expect(sgkBranch).toHaveValue(branchId);
  await page.getByPlaceholder('Örn: QA-SGK-3B-202609').fill('E2E-SGK-202609');
  await page.locator('form').filter({ has: page.getByPlaceholder('Örn: QA-SGK-3B-202609') }).locator('input[type="number"]').fill('1000');
  await page.getByRole('button', { name: 'Faturayı Kaydet' }).click();
  await expect.poll(() => invoiceBranchIds).toContain(branchId);

  await page.getByRole('button', { name: 'Kasa, Tahsilat & Masraflar' }).click();
  await page.getByRole('button', { name: 'Para Giriş/Çıkış' }).click();
  await page.getByPlaceholder('Kasa hesabı adı').fill('Ana Kasa');
  await page.locator('form').last().locator('input[type="number"]').fill('150');
  await page.getByRole('button', { name: 'İşlemi Kaydet' }).click();
  await expect.poll(() => cashBranchIds).toContain(branchId);

  await page.getByRole('button', { name: 'Masraflar' }).last().click();
  await page.getByRole('button', { name: 'Yeni Gider Kaydet' }).click();
  await page.getByPlaceholder('Örn: Elektrik faturası, kira, bakım hizmeti').fill('E2E Gider');
  await page.locator('form').last().locator('input[type="number"]').fill('250');
  await page.getByRole('button', { name: 'Gideri Kaydet' }).click();
  await expect.poll(() => expenseBranchIds).toContain(branchId);
});

test('boş demirbaş verisinde seçim paneli ve pagination görünmez', async ({ page }) => {
  await openAssets(page, false);

  await expect(page.getByText('Aranan kriterlere uygun demirbaş kaydı bulunamadı.')).toBeVisible();
  await expect(page.getByLabel('Sayfa başına demirbaş')).toHaveCount(0);
  await expect(page.getByText('Demirbaş Bilgileri')).toHaveCount(0);
  await expect(page.getByText('Toplam 0 kayıt')).toBeVisible();
});

test('demirbaş kategorisi ve durumu veritabanı etiketlerinden normalize edilerek filtrelenir', async ({ page }) => {
  await openAssets(page, true);

  await page.getByRole('combobox', { name: 'Durum filtresi' }).selectOption('Aktif');
  await page.getByRole('combobox', { name: 'Kategori filtresi' }).selectOption('Cihaz');

  const row = page.getByRole('row').filter({ hasText: assetName });
  await expect(row).toBeVisible();
  await expect(row).toContainText('Cihaz');
  await expect(row).toContainText('Aktif');

  await page.getByRole('combobox', { name: 'Kategori filtresi' }).selectOption('Mobilya');
  await expect(page.getByText('Aranan kriterlere uygun demirbaş kaydı bulunamadı.')).toBeVisible();
});

test('demirbaş durum düzenlemesi kayıttan sonra tablo ve detay durumunu eşitler', async ({ page }) => {
  await openAssets(page, true);
  const row = page.getByRole('row').filter({ hasText: assetName });
  await row.getByTitle('Düzenle').click();
  await page.locator('select').last().selectOption('Bakımda');
  await page.getByRole('button', { name: 'Kaydet', exact: true }).last().click();
  await expect(row).toContainText('Bakımda');
  await row.click();
  await expect(page.getByText('Bakımda', { exact: true }).last()).toBeVisible();
  await page.reload();
  await page.getByRole('button', { name: 'Demirbaşlar' }).click();
  await expect(row).toContainText('Bakımda');
});

test('demirbaş Garanti sekmesi kayıtlı bitiş tarihini ve kapsam sınırlarını gösterir', async ({ page }) => {
  await openAssets(page, true);
  await page.getByRole('row').filter({ hasText: assetName }).click();
  await page.getByRole('button', { name: 'Garanti' }).click();
  await expect(page.getByText('Garanti Bilgileri')).toBeVisible();
  await expect(page.getByText('10.01.2027').last()).toBeVisible();
  await expect(page.getByText(/kapsamı garanti belgesinden teyit edin/)).toBeVisible();
});

test('garanti bitiş tarihi olmayan demirbaşta eksik bilgi açıkça belirtilir', async ({ page }) => {
  await mockTenantData(page, true, { assetWarrantyExpiry: null });
  await signIn(page);
  await page.getByRole('button', { name: 'Demirbaşlar' }).click();
  await page.getByRole('row').filter({ hasText: assetName }).click();
  await page.getByRole('button', { name: 'Garanti' }).click();
  await expect(page.getByText('Garanti bilgisi girilmemiş')).toBeVisible();
  await expect(page.getByText('Bilgi yok')).toBeVisible();
});

test('Record warranty information for an asset', async ({ page }) => {
  await mockTenantData(page, true, { assetWarrantyExpiry: null });
  await signIn(page);
  await page.getByRole('button', { name: 'Demirbaşlar' }).click();
  await page.getByRole('row').filter({ hasText: assetName }).click();
  await page.getByRole('button', { name: 'Garanti' }).click();
  await expect(page.getByText('Garanti bilgisi girilmemiş')).toBeVisible();

  await page.getByRole('button', { name: 'Düzenle' }).first().click();
  await expect(page.getByText('Demirbaş Bilgilerini Düzenle')).toBeVisible();

  await page.locator('#edit-asset-warranty-start-date').fill('2026-05-15');
  await page.locator('#edit-asset-warranty-end-date').fill('2028-05-15');

  await page.getByRole('button', { name: 'Kaydet' }).click();

  await expect(page.locator('.toast.success').first()).toBeVisible();
  await expect(page.getByText('Garanti bilgisi girilmemiş')).not.toBeVisible();
  await expect(page.getByText('15.05.2028').last()).toBeVisible();
});

test('demirbaş seri numarası araması noktalama farklarını normalize eder', async ({ page }) => {
  await mockTenantData(page, true, { assetSerial: 'QA ASSET 1B 001' });
  await signIn(page);
  await page.getByRole('button', { name: 'Demirbaşlar' }).click();
  await page.getByPlaceholder('Demirbaş adı, seri no, marka ile ara...').fill('QA-ASSET-1B-001');
  const row = page.getByRole('row').filter({ hasText: assetName });
  await expect(row).toBeVisible();
  await expect(row).toContainText('QA ASSET 1B 001');
});

test('Register a cash collection and confirm it is tracked', async ({ page }) => {
  await mockTenantData(page, false);
  await signIn(page);
  await page.getByRole('button', { name: 'Kasa, Tahsilat & Masraflar' }).click();
  await page.getByRole('button', { name: 'Para Giriş/Çıkış' }).click();
  await page.getByPlaceholder('Kasa hesabı adı').fill('Tahsilat Test Hesabı');
  await page.locator('form').last().locator('input[type="number"]').fill('100');
  await page.getByRole('button', { name: 'İşlemi Kaydet' }).click();
  for (let pass = 0; pass < 2; pass++) {
    await page.getByRole('button', { name: 'Girişler', exact: true }).click();
    await page.locator('select').filter({ has: page.locator('option', { hasText: 'Tüm Hesaplar' }) }).selectOption('Tahsilat Test Hesabı');
    await expect(page.getByRole('row').filter({ hasText: 'Tahsilat Test Hesabı' })).toContainText('100');
    await expect(page.getByText('Toplam Tahsilat', { exact: true }).locator('..')).toContainText('₺100');
    if (pass === 0) { await page.reload(); await page.getByRole('button', { name: 'Kasa, Tahsilat & Masraflar' }).click(); }
  }
});

test('Create a new appointment', async ({ page }) => {
  const fixtures: ExtraFixtures = { patientRows: [], appointmentRows: [] };
  await mockTenantData(page, false, fixtures);
  await signIn(page);
  await page.getByRole('button', { name: 'Randevular', exact: true }).click();
  await page.getByRole('button', { name: /Yeni Randevu/ }).click();
  await page.getByPlaceholder('Hasta seçin veya arayın...').click();
  await page.getByText('+ 👤 Yeni Hasta Ekle', { exact: true }).click();
  await page.getByPlaceholder('Hasta Adı Soyadı *').fill('Yeni Randevu Hastası');
  await page.getByPlaceholder('Telefon (Örn: 0555...)').fill('05000000001');
  await page.getByRole('button', { name: 'Randevu Oluştur' }).click();
  await expect.poll(() => fixtures.appointmentRows?.length).toBe(1);
  await expect(page.getByRole('status').filter({ hasText: 'Randevu başarıyla oluşturuldu.' })).toBeVisible();
  expect(fixtures.appointmentRows?.[0].patient_id).toBe(fixtures.patientRows?.[0].id);
  expect(fixtures.appointmentRows?.[0].patient_id).toMatch(/^[0-9a-f-]{36}$/);
  await page.reload();
  await page.getByRole('button', { name: 'Randevular', exact: true }).click();
  await expect(page.getByText('Yeni Randevu Hastası').first()).toBeVisible();
});

test('Review appointment reports and download Excel/CSV files', async ({ page }) => {
  await mockTenantData(page, false, {
    appointmentRows: [{ id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', organization_id: orgId, branch_id: branchId, date: new Date().toISOString().slice(0, 10), time: '10:00', status: 'Bekliyor', patient_name: 'Rapor Hastası' }],
  });
  await signIn(page);
  await page.getByRole('button', { name: 'Raporlar', exact: true }).click();
  await page.getByRole('button', { name: /Randevu Raporları/ }).click();
  await expect(page.getByRole('heading', { name: 'Randevu Trendi' })).toBeVisible();
  await expect(page.getByRole('img', { name: /Randevu trendi/ })).toBeVisible();

  await page.getByRole('button', { name: 'Rapor İndir' }).click();
  const csvDownloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Ham Veri (.csv) İndir' }).click();
  const csvDownload = await csvDownloadPromise;
  expect(csvDownload.suggestedFilename()).toMatch(/^AudiPro_Yonetim_Raporu_\d{4}-\d{2}-\d{2}\.csv$/);

  await page.getByRole('button', { name: 'Rapor İndir' }).click();
  const xlsxDownloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Excel Tablosu (.xlsx) İndir' }).click();
  const xlsxDownload = await xlsxDownloadPromise;
  expect(xlsxDownload.suggestedFilename()).toMatch(/^AudiPro_Yonetim_Raporu_\d{4}-\d{2}-\d{2}\.xlsx$/);

  await page.getByRole('button', { name: 'Rapor İndir' }).click();
  const pdfDownloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: /PDF Yönetici Sunumu/ }).click();
  const pdfDownload = await pdfDownloadPromise;
  expect(pdfDownload.suggestedFilename()).toMatch(/^AudiPro_Yonetim_Raporu_\d{4}-\d{2}-\d{2}\.pdf$/);
});

test('service status, inspection note and warranty changes persist', async ({ page }) => {
  const serviceId = '99999999-9999-4999-8999-999999999999';
  const serviceInsertBodies: Record<string, unknown>[] = [];
  await mockTenantData(page, false, {
    serviceInsertBodies,
    serviceRows: [{
      id: serviceId, organization_id: orgId, branch_id: branchId, patient_name: 'E2E Hasta',
      device_name: 'E2E Cihaz', device_serial: 'E2E-SN', barcode: 'E2E-BC', received_date: '2026-09-20',
      delivered_date: null, complaint: 'Kontrol', service_fee: 0, status: 'Bekliyor', technician: 'Teknik Servis',
      notes: '', details: { status: 'Tamir Ediliyor', operations: [], warrantyRepair: true, history: [] },
    }],
  });
  await signIn(page);
  await page.getByRole('button', { name: 'Teknik Servis' }).click();
  let serviceRow = page.getByRole('row').filter({ hasText: 'E2E-SN' });
  await serviceRow.click();
  await page.getByRole('button', { name: 'Durum Güncelle' }).click();
  const statusDialog = page.getByRole('dialog', { name: /Servis Durumu Güncelle/ });
  await statusDialog.locator('select').selectOption('Teslime Hazır');
  const inspectionNote = 'Teslim öncesi cihaz kontrolü tamamlandı.';
  await statusDialog.locator('textarea').fill(inspectionNote);
  await statusDialog.getByRole('button', { name: 'Güncellemeyi Kaydet' }).click();
  await expect(serviceRow).toContainText('Teslime Hazır');
  await page.getByRole('button', { name: 'İşlem Geçmişi', exact: true }).click();
  await expect(page.getByText(inspectionNote, { exact: true })).toBeVisible();
  expect(serviceInsertBodies.at(-1)).toMatchObject({ details: { status: 'Hazır', history: [{ note: inspectionNote }] } });

  await page.getByRole('button', { name: 'Genel', exact: true }).click();
  await page.getByRole('button', { name: 'Düzenle', exact: true }).last().click();
  const editDialog = page.getByRole('heading', { name: 'Cihaz & Servis Bilgilerini Düzenle' }).locator('..').locator('..');
  await editDialog.getByLabel('Garanti Durumu').selectOption('Garanti Dışı');
  await editDialog.getByRole('button', { name: 'Kaydet' }).click();
  await expect(page.locator('span').filter({ hasText: 'Garanti Dışı' }).last()).toBeVisible();
  expect(serviceInsertBodies.at(-1)).toMatchObject({ details: { warrantyRepair: false } });

  await page.reload();
  await page.getByRole('button', { name: 'Teknik Servis' }).click();
  serviceRow = page.getByRole('row').filter({ hasText: 'E2E-SN' });
  await expect(serviceRow).toContainText('Teslime Hazır');
  await serviceRow.click();
  await expect(page.locator('span').filter({ hasText: 'Garanti Dışı' }).last()).toBeVisible();
  await page.getByRole('button', { name: 'İşlem Geçmişi', exact: true }).click();
  await expect(page.getByText(inspectionNote, { exact: true })).toBeVisible();
});

test('Create a new SGK prescription record', async ({ page }) => {
  const id = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd';
  const fixtures: ExtraFixtures = { patientRows: [{ id, organization_id: orgId, branch_id: branchId, first_name: 'Reçete', last_name: 'Hastası', patient_status: 'Aktif', deleted_at: null }], failPatientUpdate: true };
  await mockTenantData(page, false, fixtures);
  await signIn(page);
  await page.getByRole('button', { name: 'SGK & Reçete', exact: true }).click();
  await page.getByRole('button', { name: /Yeni Reçete Kaydı/ }).click();
  await page.getByLabel('Reçete hastası').selectOption(id);
  await page.getByPlaceholder('R-2025-XXXX').fill('REC-E2E-001');
  await page.getByPlaceholder('RAP-2025-XXXX').fill('RAP-E2E-001');
  await page.getByRole('button', { name: 'Reçeteyi Kaydet' }).click();
  await expect(page.getByRole('alert').filter({ hasText: /Reçete kaydı reddedildi/ })).toBeVisible();
  fixtures.failPatientUpdate = false;
  await page.getByRole('button', { name: 'Reçeteyi Kaydet' }).click();
  await expect(page.getByText('Yeni SGK Reçete Kaydı', { exact: true })).toHaveCount(0);
  await expect(page.getByRole('row').filter({ hasText: 'REC-E2E-001' })).toBeVisible();
  await page.reload();
  await page.getByRole('button', { name: 'SGK & Reçete', exact: true }).click();
  await expect(page.getByRole('row').filter({ hasText: 'REC-E2E-001' })).toBeVisible();
});

test('Review SGK invoice records', async ({ page }) => {
  await mockTenantData(page, false, { invoiceRows: [{ id: '88888888-8888-4888-8888-888888888888', organization_id: orgId, branch_id: branchId, invoice_month: '2026-10-01', expected_month: '2026-12-01', invoice_no: 'QA-SGK-TEST-202610', amount: 100, status: 'Bekliyor', created_at: '2026-10-01T12:00:00Z' }] });
  await signIn(page);
  await page.getByRole('button', { name: 'SGK Ödeme Takvimi' }).click();
  await page.getByRole('button', { name: 'Fatura Kayıtları', exact: true }).click();
  await page.getByRole('button', { name: 'QA-SGK-TEST-202610 fatura detayını aç' }).click();
  await expect(page.getByRole('dialog', { name: 'SGK Dönem Faturası Detayı' })).toContainText('QA-SGK-TEST-202610');
});

test('Review a service record details view', async ({ page }) => {
  await mockTenantData(page, true, { maintenanceRows: [{ id: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc', asset_id: assetId, record_type: 'Kalibrasyon', maintenance_date: '2026-10-01', provider: 'Test Laboratuvarı', report_number: 'KAL-001', notes: 'Kalibrasyon tamamlandı.' }] });
  await signIn(page);
  await page.getByRole('button', { name: 'Demirbaşlar' }).click();
  await page.getByRole('row').filter({ hasText: assetName }).click();
  await page.getByRole('button', { name: 'Bakım', exact: true }).click();
  await expect(page.getByText('Kalibrasyon · Test Laboratuvarı')).toBeVisible();
  await expect(page.getByText('Kalibrasyon tamamlandı.')).toBeVisible();
  await expect(page.getByText('Bu demirbaş için kayıtlı bakım/kalibrasyon bilgisi bulunmuyor.')).toHaveCount(0);
});

test('Open maintenance schedule for an asset', async ({ page }) => {
  await mockTenantData(page, true, {
    maintenanceRows: [{
      id: 'm-plan', organization_id: orgId, branch_id: branchId, asset_id: assetId,
      record_type: 'Bakım', status: 'planned', maintenance_date: '2026-11-07',
      provider: 'Planlı E2E Servisi', report_number: 'PLAN-001', notes: 'Planlı kontrol',
    }],
  });
  await signIn(page);
  await page.getByRole('button', { name: 'Demirbaşlar' }).click();
  await page.getByRole('button', { name: 'Bakım Takvimi' }).click();
  await expect(page.getByText('Planlı E2E Servisi')).toBeVisible();
});

test('Open stock movement records', async ({ page }) => {
  await mockTenantData(page, false, {
    stockRows: [stockFixture],
    stockMovementRows: [{
      id: 'movement-1', organization_id: orgId, branch_id: branchId, stock_item_id: stockId,
      type: 'ADJUSTMENT', quantity_change: 2, created_at: '2026-10-06T10:30:00.000Z',
      notes: 'Sayım düzeltmesi', branches: { name: 'QA Şube' },
    }],
  });
  await signIn(page);
  await page.getByRole('button', { name: 'Stok & Aksesuar' }).click();
  await page.getByRole('row').filter({ hasText: stockFixture.name }).click();
  await page.getByRole('button', { name: 'Hareketler', exact: true }).click();
  await expect(page.getByText('Sayım düzeltmesi')).toBeVisible();
  await expect(page.getByText('Bu ürün için kaydedilmiş stok hareketi bulunmuyor.')).toHaveCount(0);
});

test('Use bulk actions on selected assets', async ({ page }) => {
  await mockTenantData(page, true, {
    additionalAssetRows: [{
      id: 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee', organization_id: orgId, branch_id: branchId,
      name: 'QA İkinci Demirbaş', category: 'Klinik Cihaz', model: 'Test Model 2', serial_no: 'PW-ONLY-002',
      purchase_date: '2026-01-11', purchase_price: 9000, warranty_expiry: '2027-01-11', status: 'Aktif',
      archived_at: null, branches: { name: 'QA Şube' },
    }],
    maintenanceRows: [],
  });
  await signIn(page);
  await page.getByRole('button', { name: 'Demirbaşlar' }).click();
  const checkboxes = page.locator('table tbody tr input[type="checkbox"]');
  await checkboxes.nth(0).check();
  await checkboxes.nth(1).check();
  await page.getByRole('button', { name: 'Toplu İşlemler (2 seçili)' }).click();
  const menu = page.getByRole('menu', { name: 'Toplu demirbaş işlemleri' });
  await expect(menu.getByRole('menuitem', { name: 'Toplu Zimmet' })).toBeVisible();
  await expect(menu.getByRole('menuitem', { name: 'Toplu Kalibrasyon' })).toBeVisible();
  await menu.getByRole('menuitem', { name: 'Toplu Kalibrasyon' }).click();
  const dialog = page.getByRole('dialog', { name: 'Toplu Kalibrasyon' });
  await expect(dialog).toContainText('2 seçili demirbaş');
  await dialog.getByLabel('Kalibrasyon tarihi').fill('2026-11-05');
  await dialog.getByRole('button', { name: 'Toplu Kalibrasyon Kaydet' }).click();
  await expect(page.getByRole('alert').filter({ hasText: '2 demirbaş için kalibrasyon kaydı oluşturuldu.' })).toBeVisible();
  await expect(dialog).toHaveCount(0);
});

test('Toplu Zimmet assigns every selected asset and persists the custodian', async ({ page }) => {
  const assetUpdateBodies: Record<string, unknown>[] = [];
  await mockTenantData(page, true, {
    assetUpdateBodies,
    additionalAssetRows: [{
      id: 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee', organization_id: orgId, branch_id: branchId,
      name: 'QA Zimmet İkinci Demirbaş', category: 'Klinik Cihaz', model: 'Test Model 2', serial_no: 'PW-ASSIGN-002',
      purchase_date: '2026-01-11', purchase_price: 9000, warranty_expiry: '2027-01-11', status: 'Aktif', archived_at: null,
      branches: { name: 'QA Şube' },
    }],
  });
  await signIn(page);
  await page.getByRole('button', { name: 'Demirbaşlar' }).click();
  const checkboxes = page.locator('table tbody tr input[type="checkbox"]');
  await checkboxes.nth(0).check();
  await checkboxes.nth(1).check();
  await page.getByRole('button', { name: 'Toplu İşlemler (2 seçili)' }).click();
  await page.getByRole('menuitem', { name: 'Toplu Zimmet' }).click();
  const dialog = page.getByRole('dialog', { name: 'Toplu Zimmet' });
  await dialog.getByLabel('Zimmet yapılacak personel').fill('Ayşe Yılmaz');
  await dialog.getByRole('button', { name: 'Zimmeti Kaydet' }).click();
  await expect(page.getByRole('alert').filter({ hasText: '2 demirbaş Ayşe Yılmaz kişisine zimmetlendi.' })).toBeVisible();
  expect(assetUpdateBodies).toHaveLength(2);
  expect(assetUpdateBodies.map(body => body.assigned_to)).toEqual(['Ayşe Yılmaz', 'Ayşe Yılmaz']);
  expect(new Set(assetUpdateBodies.map(body => body.id))).toEqual(new Set([assetId, 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee']));
});

test('satır üç nokta menüsü drawer açmadan görüntülenir; satır tıklaması drawer açar', async ({ page }) => {
  await mockTenantData(page, true, { maintenanceRows: [] });
  await signIn(page);
  await expect(page.getByRole('button', { name: 'Demirbaşlar' })).toBeVisible();
  await page.getByRole('button', { name: 'Demirbaşlar' }).click();
  await expect(page.getByRole('heading', { name: 'Demirbaş & Klinik Cihaz Yönetimi' })).toBeVisible();
  const row = page.getByRole('row').filter({ hasText: assetName });
  await expect(row).toBeVisible();

  await row.getByTitle('İşlemler').click();
  await expect(page.getByRole('button', { name: 'Bakım Kaydı Ekle' })).toBeVisible();
  await expect(page.getByText('Demirbaş Bilgileri')).toHaveCount(0);

  await page.getByRole('button', { name: /Bakım Kaydı Ekle/ }).click();
  await expect(page.getByRole('heading', { name: 'Yeni Bakım Kaydı Gir' })).toBeVisible();
  await page.getByPlaceholder('Servis / yetkili kuruluş').fill('E2E Bakım Servisi');
  await page.getByRole('button', { name: 'Kaydet' }).click();
  await expect(page.getByText('Demirbaş Bilgileri')).toBeVisible();
  await expect(page.getByText('Bakım · E2E Bakım Servisi')).toBeVisible();
  await page.getByRole('button', { name: 'Genel' }).click();
  await expect(page.getByText('10.01.2027')).toHaveCount(2);
});

test('Quick sell a stock item', async ({ page }) => {
  const patientId = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd';
  const saleRpcPayloads: Record<string, unknown>[] = [];
  const fixtures: ExtraFixtures = {
    patientRows: [{ id: patientId, organization_id: orgId, branch_id: branchId, first_name: 'Test', last_name: 'Hasta Tek Şube Bir', phone: '05000000001', hearing_loss_side: 'Sağ', patient_status: 'Aktif', deleted_at: null }],
    stockRows: [{ ...stockFixture, quantity: 1, price: 5000 }],
    stockMovementRows: [],
    saleRpcPayloads,
  };
  await mockTenantData(page, false, fixtures);
  await signIn(page);
  await page.getByRole('button', { name: 'Stok & Aksesuar' }).click();
  await page.getByRole('button', { name: 'Hızlı Satış' }).first().click();
  await page.getByLabel('Kayıtlı Hasta').selectOption(patientId);
  await page.getByLabel('Satılacak Ürün / Cihaz').selectOption(stockId);
  await page.getByRole('button', { name: 'Satışı Onayla' }).click();

  await expect.poll(() => saleRpcPayloads.length).toBe(1);
  await expect(page.getByRole('heading', { name: 'Hızlı Satış Fişi / Çıkışı' })).toHaveCount(0);
});

test('Show and hide the password during sign-in', async ({ page }) => {
  await page.goto('/');
  const passwordInput = page.getByPlaceholder('••••••••');
  await expect(passwordInput).toHaveAttribute('type', 'password');
  const toggleBtn = page.locator('#toggle-password-visibility');
  await toggleBtn.click();
  await expect(passwordInput).toHaveAttribute('type', 'text');
  await toggleBtn.click();
  await expect(passwordInput).toHaveAttribute('type', 'password');
});

test('Create a new patient recall reminder', async ({ page }) => {
  const patientId = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd';
  const fixtures: ExtraFixtures = {
    patientRows: [{ id: patientId, organization_id: orgId, branch_id: branchId, first_name: 'Test Hasta', last_name: 'Tek Şube Bir', phone: '05000000001', patient_status: 'Aktif', deleted_at: null }],
    recallRows: [],
  };
  await mockTenantData(page, false, fixtures);
  await signIn(page);
  await page.getByRole('button', { name: 'Recall' }).click();
  await page.getByRole('button', { name: 'Yeni Hatırlatma' }).click();
  await page.locator('#recall-patient-search').fill('Test Hasta');
  await page.locator('#recall-patient-suggestions button').first().click();
  await page.getByRole('button', { name: 'Kaydet' }).click();

  await expect(page.locator('.toast.success').filter({ hasText: 'kaydedildi' })).toBeVisible();
  await expect(page.getByText('Test Hasta Tek Şube Bir').first()).toBeVisible();
});

test('Review overdue recall reminders', async ({ page }) => {
  const patientId = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd';
  await mockTenantData(page, false, {
    patientRows: [{ id: patientId, organization_id: orgId, branch_id: branchId, first_name: 'Gecikmiş', last_name: 'Hasta', phone: '05000000001', patient_status: 'Aktif', deleted_at: null }],
    recallRows: [{ id: 'rec-overdue', organization_id: orgId, patient_id: patientId, patients: { first_name: 'Gecikmiş', last_name: 'Hasta' }, reason: 'Yıllık Kontrol', due_date: '2026-09-01', status: 'Bekliyor' }],
  });
  await signIn(page);
  await page.getByRole('button', { name: 'Recall' }).click();
  await expect(page.getByText('Tarihi Geçen').first()).toBeVisible();
  await page.getByText('Tarihi Geçen').first().click();
  await expect(page.getByText('Gecikmiş Hasta')).toBeVisible();
});

test('Mark a recall reminder as completed', async ({ page }) => {
  const patientId = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd';
  await mockTenantData(page, false, {
    patientRows: [{ id: patientId, organization_id: orgId, branch_id: branchId, first_name: 'Tamamlanacak', last_name: 'Hasta', phone: '05000000001', patient_status: 'Aktif', deleted_at: null }],
    recallRows: [{ id: 'rec-complete', organization_id: orgId, patient_id: patientId, patients: { first_name: 'Tamamlanacak', last_name: 'Hasta' }, reason: 'Kontrol', due_date: '2026-10-20', status: 'Bekliyor' }],
  });
  await signIn(page);
  await page.getByRole('button', { name: 'Recall' }).click();
  await page.getByRole('button', { name: /için diğer işlemler/ }).click();
  await page.getByRole('menuitem', { name: 'Tamamlandı Olarak İşaretle' }).click();
  await expect(page.locator('.toast.success').filter({ hasText: 'tamamlandı olarak işaretlendi' })).toBeVisible();
});

test('Filter patients by appointment status', async ({ page }) => {
  const patientA = '11111111-1111-4111-8111-111111111101';
  const patientB = '11111111-1111-4111-8111-111111111102';
  await mockTenantData(page, false, {
    patientRows: [
      { id: patientA, organization_id: orgId, branch_id: branchId, first_name: 'Randevulu', last_name: 'Hasta', phone: '05000000001', patient_status: 'Aktif', deleted_at: null },
      { id: patientB, organization_id: orgId, branch_id: branchId, first_name: 'Randevusuz', last_name: 'Hasta', phone: '05000000002', patient_status: 'Aktif', deleted_at: null },
    ],
    appointmentRows: [
      { id: '22222222-2222-4222-8222-222222222201', organization_id: orgId, branch_id: branchId, patient_id: patientA, date: '2026-10-25', time: '10:00', status: 'Onaylandı', type: 'Kontrol' }
    ]
  });
  await signIn(page);
  await page.getByRole('button', { name: 'Hastalar' }).click();
  await expect(page.getByText('Randevulu Hasta')).toBeVisible();
  await expect(page.getByText('Randevusuz Hasta')).toBeVisible();

  await page.getByRole('button', { name: 'Daha Fazla Filtre' }).click();
  await page.getByRole('combobox', { name: 'Randevu filtresi' }).selectOption('Randevusu olan');
  await expect(page.getByText('Randevulu Hasta')).toBeVisible();
  await expect(page.getByText('Randevusuz Hasta')).toHaveCount(0);
});

test('View dashboard overview metrics', async ({ page }) => {
  await mockTenantData(page, false, {
    patientRows: [{ id: '11111111-1111-4111-8111-111111111101', organization_id: orgId, branch_id: branchId, first_name: 'Test', last_name: 'Hasta', phone: '05000000001', patient_status: 'Aktif', deleted_at: null }],
    appointmentRows: [{ id: '22222222-2222-4222-8222-222222222201', organization_id: orgId, branch_id: branchId, date: new Date().toISOString().slice(0, 10), time: '11:00', status: 'Onaylandı', type: 'Kontrol' }],
  });
  await signIn(page);
  await expect(page.getByRole('button', { name: 'Dashboard' })).toBeVisible();
  await page.getByRole('button', { name: 'Dashboard' }).click();
  await expect(page.getByText('Toplam Ciro')).toBeVisible();
  await expect(page.getByRole('main').getByText('Randevu', { exact: true })).toBeVisible();
});

test('Filter cash activity by branch', async ({ page }) => {
  const branchB = '33333333-3333-4333-8333-333333333333';
  await mockTenantData(page, false, {
    cashRows: [
      { id: 'c1', organization_id: orgId, branch_id: branchId, type: 'INCOME', amount: 500, category: 'Cihaz Satışı', cash_register_id: 'kas-1', created_at: new Date().toISOString() },
      { id: 'c2', organization_id: orgId, branch_id: branchB, type: 'INCOME', amount: 800, category: 'Pil Satışı', cash_register_id: 'kas-2', created_at: new Date().toISOString() },
    ]
  });
  await signIn(page);
  await page.getByRole('button', { name: 'Kasa, Tahsilat & Masraflar' }).click();
  await expect(page.getByRole('heading', { name: /Kasa/ })).toBeVisible();
  const branchSelect = page.locator('select').filter({ has: page.locator('option', { hasText: 'Tüm Şubeler' }) }).first();
  await expect(branchSelect).toBeVisible();
  await branchSelect.selectOption('QA Şube');
  await expect(page.getByText('Cihaz Satışı')).toBeVisible();
  await expect(page.getByText('Pil Satışı')).toHaveCount(0);
});

test('Browse SGK document and report tracking', async ({ page }) => {
  const patientId = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd';
  await mockTenantData(page, false, {
    patientRows: [{
      id: patientId, organization_id: orgId, branch_id: branchId, first_name: 'SGK', last_name: 'Takip Hastası',
      prescription_no: 'R-2026-001', report_no: 'RAP-2026-001', sgk_status: 'Aktif', patient_status: 'Aktif', deleted_at: null
    }]
  });
  await signIn(page);
  await page.getByRole('button', { name: 'SGK & Reçete', exact: true }).click();
  await expect(page.getByRole('row').filter({ hasText: 'R-2026-001' })).toBeVisible();
});

test('Add an SGK invoice period', async ({ page }) => {
  const invoiceBranchIds: string[] = [];
  await mockTenantData(page, false, { invoiceBranchIds });
  await signIn(page);
  await page.getByRole('button', { name: 'SGK Ödeme Takvimi' }).click();
  const branchSelect = page.locator('select').filter({ hasText: 'QA Şube' }).first();
  await expect(branchSelect).toBeVisible();
  await branchSelect.selectOption(branchId);
  await page.getByPlaceholder('Örn: QA-SGK-3B-202609').fill('SGK-PERIOD-202610');
  await page.locator('form').filter({ has: page.getByPlaceholder('Örn: QA-SGK-3B-202609') }).locator('input[type="number"]').fill('2000');
  await page.getByRole('button', { name: 'Faturayı Kaydet' }).click();
  await expect.poll(() => invoiceBranchIds).toContain(branchId);
});

test('Add an SGK period invoice with a duplicate number shows a clear warning', async ({ page }) => {
  const invoiceBranchIds: string[] = [];
  await mockTenantData(page, false, {
    invoiceBranchIds,
    hideInvoiceRowsFromList: true,
    invoiceRows: [{ id: 'duplicate-invoice', organization_id: orgId, branch_id: branchId, invoice_month: '2026-09-01', expected_month: '2026-11-01', invoice_no: 'QA-SGK-3B-202609', amount: 25000, status: 'Bekliyor', created_at: '2026-09-01T12:00:00Z' }],
  });
  await signIn(page);
  await page.getByRole('button', { name: 'SGK Ödeme Takvimi' }).click();
  await page.getByPlaceholder('Örn: QA-SGK-3B-202609').fill('QA-SGK-3B-202609');
  await page.locator('form').filter({ has: page.getByPlaceholder('Örn: QA-SGK-3B-202609') }).locator('input[type="number"]').fill('25000');
  await page.getByRole('button', { name: 'Faturayı Kaydet' }).click();
  await expect(page.locator('#sgk-invoice-number-error')).toContainText(/fatura numarası bu firmada zaten kayıtlı/i);
  expect(invoiceBranchIds).toHaveLength(0);
});

test('Review collection history for SGK payments', async ({ page }) => {
  const invoiceId = '88888888-8888-4888-8888-888888888888';
  await mockTenantData(page, false, {
    invoiceRows: [{ id: invoiceId, organization_id: orgId, branch_id: branchId, invoice_month: '2026-10-01', expected_month: '2026-12-01', invoice_no: 'QA-SGK-TAHSILAT-01', amount: 1500, status: 'Tahsil Edildi', created_at: '2026-10-01T12:00:00Z' }],
    paymentRows: [{ id: 'p1', invoice_id: invoiceId, branch_id: branchId, amount: 1500, payment_date: '2026-10-05', notes: 'Hakediş Tahsilatı' }]
  });
  await signIn(page);
  await page.getByRole('button', { name: 'SGK Ödeme Takvimi' }).click();
  await page.getByRole('button', { name: 'Tahsilat Geçmişi', exact: true }).click();
  const paymentRow = page.getByRole('row').filter({ hasText: 'QA-SGK-TAHSILAT-01' });
  await expect(paymentRow).toBeVisible();
  await expect(paymentRow).toContainText('₺1.500');
  await expect(page.getByText('Henüz tamamlanmış tahsilat kaydı bulunmuyor.')).toHaveCount(0);
  await page.getByRole('button', { name: 'Fatura Kayıtları', exact: true }).click();
  await expect(page.getByRole('row').filter({ hasText: 'QA-SGK-TAHSILAT-01' })).toBeVisible();
  await expect(page.getByText('Tahsil Edildi').first()).toBeVisible();
  await page.getByRole('button', { name: 'QA-SGK-TAHSILAT-01' }).click();
  await expect(page.getByRole('dialog', { name: 'SGK Dönem Faturası Detayı' })).toBeVisible();
});

test('Review bank transfer records', async ({ page }) => {
  await mockTenantData(page, false, {
    cashRows: [{
      id: 'tx-1', organization_id: orgId, branch_id: branchId, cash_register_id: 'Ana Kasa',
      type: 'TRANSFER', amount: 5000, category: 'Diğer', description: 'Şube içi hareket', created_at: new Date().toISOString()
    }]
  });
  await signIn(page);
  await page.getByRole('button', { name: 'Kasa, Tahsilat & Masraflar' }).click();
  await page.getByRole('button', { name: 'Banka Transferleri' }).click();
  await expect(page.getByText('Havale-EFT Toplamı')).toBeVisible();
  await expect(page.getByRole('row').filter({ hasText: 'Ana Kasa' })).toBeVisible();
});

test('Open cash reports and filter metrics by date range', async ({ page }) => {
  await mockTenantData(page, false, {
    cashRows: [{ id: 'report-inflow', organization_id: orgId, branch_id: branchId, cash_register_id: 'Ana Kasa', type: 'INCOME', amount: 750, category: 'Diğer Gelir', description: 'Rapor aralığı testi', created_at: '2026-10-05T12:00:00.000Z' }],
  });
  await signIn(page);
  await page.getByRole('button', { name: 'Kasa, Tahsilat & Masraflar' }).click();
  await page.getByRole('button', { name: 'Kasa raporları' }).click();
  await expect(page.getByRole('group', { name: 'Rapor Tarih Aralığı' })).toBeVisible();
  const startDate = page.getByLabel('Rapor başlangıç tarihi');
  const endDate = page.getByLabel('Rapor bitiş tarihi');
  await startDate.fill('2026-10-05');
  await endDate.fill('2026-10-05');
  await expect(page.getByText('₺750', { exact: true })).toBeVisible();
  await startDate.fill('2026-10-06');
  await expect(page.getByText('₺0', { exact: true })).toBeVisible();
});

test('Create a new supplier category', async ({ page }) => {
  await mockTenantData(page, false);
  await signIn(page);
  await page.getByRole('button', { name: 'Tedarikçiler' }).click();
  await page.getByRole('button', { name: 'Yeni Tedarikçi Ekle' }).click();
  await page.getByPlaceholder('Örn: Starkey Türkiye').fill('QA Özel Kategori Tedarikçisi');
  await page.getByLabel('Tedarikçi kategorisi seçin').selectOption('__new_category__');
  await page.getByLabel('Yeni tedarikçi kategorisi').fill('Dijital Sağlık');
  await page.getByRole('button', { name: 'Tedarikçiyi Kaydet' }).click();
  await expect(page.getByRole('row').filter({ hasText: 'QA Özel Kategori Tedarikçisi' })).toContainText('Dijital Sağlık');
});

test('Add an expense and verify it appears in the expenses view', async ({ page }) => {
  await mockTenantData(page, false, {});
  await signIn(page);
  await page.getByRole('button', { name: 'Kasa, Tahsilat & Masraflar' }).click();
  await expect(page.getByRole('heading', { name: /Kasa/ })).toBeVisible();
  await page.getByRole('button', { name: 'Masraflar', exact: true }).first().click();
  await expect(page.getByRole('heading', { name: 'Masraf & Gider Yönetimi' })).toBeVisible();
  await page.getByRole('button', { name: 'Yeni Gider Kaydet' }).click();
  const branchSelect = page.locator('select[aria-label="Gider şubesi"]');
  await expect(branchSelect).toBeVisible();
  const options = await branchSelect.locator('option').allTextContents();
  expect(options.filter(o => o.trim() && o !== 'Şube seçin').length).toBeGreaterThan(0);
});

test('Review an asset\'s maintenance schedule', async ({ page }) => {
  await mockTenantData(page, true, {
    maintenanceRows: [{
      id: 'm1', asset_id: assetId, record_type: 'Periyodik Bakım', maintenance_date: '2026-10-01',
      provider: 'Yetkili Odyometri Servisi', report_number: 'SRV-001', notes: 'Genel kontrol yapıldı.'
    }]
  });
  await signIn(page);
  await page.getByRole('button', { name: 'Demirbaşlar' }).click();
  await page.getByRole('row').filter({ hasText: assetName }).click();
  await page.getByRole('button', { name: 'Bakım', exact: true }).click();
  await expect(page.getByText('Yetkili Odyometri Servisi')).toBeVisible();
  await expect(page.getByText('Genel kontrol yapıldı.')).toBeVisible();
});

test('View assets that are due for calibration', async ({ page }) => {
  await mockTenantData(page, true, {
    maintenanceRows: [{
      id: 'cal-1', asset_id: assetId, record_type: 'Kalibrasyon', maintenance_date: '2025-10-01',
      provider: 'TÜBİTAK UME', report_number: 'KAL-001', notes: 'Kalibrasyon süresi dolmak üzere.'
    }]
  });
  await signIn(page);
  await page.getByRole('button', { name: 'Demirbaşlar' }).click();
  await expect(page.getByRole('heading', { name: 'Demirbaş & Klinik Cihaz Yönetimi' })).toBeVisible();
  const row = page.getByRole('row').filter({ hasText: assetName });
  await expect(row).toBeVisible();
  await row.click();
  await page.getByRole('button', { name: 'Bakım', exact: true }).click();
  await expect(page.getByText('Kalibrasyon · TÜBİTAK UME')).toBeVisible();
});

test('Create a new recall reminder', async ({ page }) => {
  await mockTenantData(page, false, {
    recallRows: [{
      id: 'r-test-1',
      patient_id: '11111111-1111-4111-8111-111111111101',
      organization_id: orgId,
      branch_id: branchId,
      due_date: '2026-11-01',
      status: 'Bekliyor',
      notes: 'Yıllık kontrol',
      recall_type: 'Periyodik Kontrol',
    }],
    patientRows: [{
      id: '11111111-1111-4111-8111-111111111101',
      organization_id: orgId,
      branch_id: branchId,
      first_name: 'Kemal',
      last_name: 'Hatirlatma',
      phone: '05550001234',
      patient_status: 'Müşteri',
      deleted_at: null,
    }],
  });
  await signIn(page);
  await page.getByRole('button', { name: 'Recall' }).click();
  await expect(page.getByText('Oturum ve firma verileri yükleniyor…')).not.toBeVisible();
  await expect(page.getByText('Kemal Hatirlatma')).toBeVisible();
});

test('Open an appointment from the list and review details', async ({ page }) => {
  await mockTenantData(page, false, {
    patientRows: [{
      id: 'p-apt-1',
      organization_id: orgId,
      branch_id: branchId,
      first_name: 'Ahmet',
      last_name: 'Detay',
      phone: '05551112233',
      patient_status: 'Müşteri',
      deleted_at: null,
    }],
    appointmentRows: [{
      id: 'apt-detail-1',
      organization_id: orgId,
      branch_id: branchId,
      patient_id: 'p-apt-1',
      date: new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Istanbul' }).format(new Date()),
      time: '14:00',
      type: 'Muayene',
      status: 'Bekliyor',
      audiologist: 'Odyolog',
    }],
  });
  await signIn(page);
  await page.getByRole('button', { name: 'Randevular', exact: true }).click();
  await page.getByRole('button', { name: 'Liste' }).click();
  const row = page.getByRole('row').filter({ hasText: 'Ahmet Detay' });
  await expect(row).toBeVisible();
  await row.click();
  await expect(page.getByText('Randevu Detayı')).toBeVisible();
  await expect(page.getByText('Ahmet Detay').nth(1)).toBeVisible();
});

test('Use quick segments to switch patient directory views', async ({ page }) => {
  const in2Days = new Date(Date.now() + 86400000 * 2).toISOString().slice(0, 10);
  const in20Days = new Date(Date.now() + 86400000 * 20).toISOString().slice(0, 10);
  await mockTenantData(page, false, {
    patientRows: [
      { id: 'p-seg-1', organization_id: orgId, branch_id: branchId, first_name: 'Ali', last_name: 'Aktif', patient_status: 'Müşteri', phone: '05550001111', deleted_at: null },
      { id: 'p-seg-2', organization_id: orgId, branch_id: branchId, first_name: 'Can', last_name: 'Cihaz', patient_status: 'Müşteri', current_device: 'Phonak L90', phone: '05550002222', deleted_at: null },
      { id: 'p-seg-3', organization_id: orgId, branch_id: branchId, first_name: 'Riza', last_name: 'Randevu', patient_status: 'Müşteri', phone: '05550003333', deleted_at: null },
      { id: 'p-seg-4', organization_id: orgId, branch_id: branchId, first_name: 'Uzak', last_name: 'Randevu', patient_status: 'Müşteri', phone: '05550004444', deleted_at: null },
    ],
    appointmentRows: [
      { id: 'apt-seg-3', organization_id: orgId, branch_id: branchId, patient_id: 'p-seg-3', date: in2Days, time: '10:00', status: 'Bekliyor', type: 'Kontrol' },
      { id: 'apt-seg-4', organization_id: orgId, branch_id: branchId, patient_id: 'p-seg-4', date: in20Days, time: '11:00', status: 'Bekliyor', type: 'Kontrol' },
    ],
  });
  await signIn(page);
  await page.getByRole('button', { name: 'Hastalar' }).click();
  await expect(page.getByText('Ali Aktif')).toBeVisible();
  await page.getByRole('button', { name: 'Cihaz Kullanan' }).click();
  await expect(page.getByText('Sonuç bulunamadı')).not.toBeVisible();
  await expect(page.getByText('Can Cihaz')).toBeVisible();
  await page.getByRole('button', { name: 'Randevusu Olan' }).click();
  await expect(page.getByText('Sonuç bulunamadı')).not.toBeVisible();
  await expect(page.getByText('Riza Randevu')).toBeVisible();
  await expect(page.getByText('Uzak Randevu')).not.toBeVisible();
});

test('Select a multi-branch organization and enter consolidated workspace', async ({ page }) => {
  await mockTenantData(page, false);
  await signIn(page);
  await expect(page.getByRole('button', { name: 'Dashboard' })).toBeVisible();
});

test('View SGK document and report tracking', async ({ page }) => {
  await mockTenantData(page, false, {
    patientRows: [{
      id: 'p-sgk-doc-1',
      organization_id: orgId,
      branch_id: branchId,
      first_name: 'Selin',
      last_name: 'Evrakli',
      phone: '05559990011',
      report_no: 'RAP-2026-99',
      prescription_no: 'REC-2026-99',
      deleted_at: null,
    }],
  });
  await signIn(page);
  await page.getByRole('button', { name: 'SGK & Reçete', exact: true }).click();
  await page.getByRole('button', { name: /Evrak.*Rapor Takibi/i }).click();
  await expect(page.getByText('Evrak ve rapor verisi bağlı bir tablo bulunmadığı için kayıt listesi gösterilemiyor.')).not.toBeVisible();
  await expect(page.getByText('Selin Evrakli')).toBeVisible();
  await expect(page.getByText('RAP-2026-99')).toBeVisible();
});

test('Move an appointment to a different date or time', async ({ page }) => {
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Istanbul' }).format(new Date());
  await mockTenantData(page, false, {
    patientRows: [{
      id: 'p-resched-1',
      organization_id: orgId,
      branch_id: branchId,
      first_name: 'Guncel',
      last_name: 'Hasta',
      phone: '05553334455',
      patient_status: 'Müşteri',
      deleted_at: null,
    }],
    appointmentRows: [{
      id: 'apt-resched-1',
      organization_id: orgId,
      branch_id: branchId,
      patient_id: 'p-resched-1',
      date: today,
      time: '10:00',
      type: 'Muayene',
      status: 'Bekliyor',
      audiologist: 'Odyolog',
    }],
  });
  await signIn(page);
  await page.getByRole('button', { name: 'Randevular', exact: true }).click();
  await page.getByRole('button', { name: 'Liste' }).click();
  await page.getByRole('row').filter({ hasText: 'Guncel Hasta' }).click();
  await page.getByRole('button', { name: 'Randevuyu Düzenle' }).click();
  await page.getByRole('button', { name: 'Değişiklikleri Kaydet' }).click();
  await expect(page.getByText('Randevu başarıyla güncellendi.')).toBeVisible();
});

test('Search for a stock item', async ({ page }) => {
  await mockTenantData(page, false, {
    stockRows: [{
      id: 'stk-qa-1',
      organization_id: orgId,
      branch_id: branchId,
      name: 'Automated QA Item - Inventory Details Test',
      category: 'Cihaz',
      quantity: 5,
      critical_level: 1,
      price: 15000,
      status: 'Stokta',
      uts_status: 'Bildirildi',
      deleted_at: null,
    }],
  });
  await signIn(page);
  await page.getByRole('button', { name: 'Stok & Aksesuar' }).click();
  const searchInput = page.getByPlaceholder('Ürün adı, marka, seri no veya barkod ile ara...');
  await searchInput.fill('Automated QA Item - Inventory Details Test');
  await expect(page.getByText('Aranan kriterlere uygun stok kaydı bulunamadı.')).not.toBeVisible();
  await expect(page.getByText('Automated QA Item - Inventory Details Test').first()).toBeVisible();
});

test('Filter the patient directory by status and appointment context', async ({ page }) => {
  await mockTenantData(page, false, {
    patientRows: [
      { id: 'p-match-1', organization_id: orgId, branch_id: branchId, first_name: 'Randevusu', last_name: 'Var', phone: '05550001001', patient_status: 'Müşteri', current_device: 'Phonak L90', last_visit: '2026-10-06', deleted_at: null },
      { id: 'p-nomatch-2', organization_id: orgId, branch_id: branchId, first_name: 'Randevusu', last_name: 'Yok1', phone: '05550001002', patient_status: 'Müşteri', last_visit: null, deleted_at: null },
      { id: 'p-nomatch-3', organization_id: orgId, branch_id: branchId, first_name: 'Randevusu', last_name: 'Yok2', phone: '05550001003', patient_status: 'Müşteri', last_visit: null, deleted_at: null },
    ],
    appointmentRows: [
      { id: 'apt-filter-1', organization_id: orgId, branch_id: branchId, patient_id: 'p-match-1', date: '2026-10-06', time: '11:00', status: 'Bekliyor', type: 'Muayene' },
    ],
  });
  await signIn(page);
  await page.getByRole('button', { name: 'Hastalar' }).click();
  await expect(page.getByText('Var')).toBeVisible();
  await expect(page.getByText('Yok1')).toBeVisible();
  const deviceSelect = page.getByRole('combobox', { name: 'Cihaz durumu filtresi' });
  await deviceSelect.selectOption('Cihaz kullanıyor');
  const dateInput = page.getByTitle('Tarih aralığı');
  await dateInput.fill('2026-10-06');
  await page.getByRole('button', { name: 'Ara', exact: true }).click();
  await expect(page.getByText('Var')).toBeVisible();
  await expect(page.getByText('Yok1')).not.toBeVisible();
  await expect(page.getByText('Yok2')).not.toBeVisible();
});

test('Cancel an appointment from the schedule', async ({ page }) => {
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Istanbul' }).format(new Date());
  await mockTenantData(page, false, {
    patientRows: [{
      id: 'p-cancel-1',
      organization_id: orgId,
      branch_id: branchId,
      first_name: 'Ahmet',
      last_name: 'Test',
      phone: '05557778899',
      patient_status: 'Müşteri',
      deleted_at: null,
    }],
    appointmentRows: [{
      id: 'apt-cancel-1',
      organization_id: orgId,
      branch_id: branchId,
      patient_id: 'p-cancel-1',
      date: today,
      time: '14:00',
      type: 'Muayene',
      status: 'Bekliyor',
      audiologist: 'Odyolog',
    }],
  });
  await signIn(page);
  await page.getByRole('button', { name: 'Randevular', exact: true }).click();
  await page.getByRole('button', { name: 'Liste' }).click();
  await expect(page.getByText('Ahmet Test')).toBeVisible();
  await page.getByRole('button', { name: 'İptal Et' }).click();
  await expect(page.getByText('Randevu başarıyla iptal edildi.')).toBeVisible();
  await expect(page.getByRole('row').filter({ hasText: 'Ahmet Test' })).not.toBeVisible();
});

test('Review transfer history across branches', async ({ page }) => {
  await mockTenantData(page, true);
  await signIn(page);

  await page.getByRole('button', { name: 'Şube Aktiviteleri' }).click();
  await page.getByRole('button', { name: 'Şubeler Arası' }).click();

  const statusSelect = page.locator('select').filter({ has: page.locator('option', { hasText: 'Tamamlananlar' }) });
  await statusSelect.selectOption('Tamamlananlar');

  await expect(page.getByText('Bu filtrede transfer kaydı yok.')).not.toBeVisible();

  await expect(page.getByRole('columnheader', { name: 'TARİH' })).toBeVisible();
  await expect(page.getByRole('columnheader', { name: 'HASTA' })).toBeVisible();
  await expect(page.getByRole('columnheader', { name: 'KAYNAK ŞUBE' })).toBeVisible();
  await expect(page.getByRole('columnheader', { name: 'HEDEF ŞUBE' })).toBeVisible();
  await expect(page.getByRole('columnheader', { name: 'TRANSFER EDEN' })).toBeVisible();
  await expect(page.getByRole('columnheader', { name: 'DURUM' })).toBeVisible();
  await expect(page.getByRole('columnheader', { name: 'İŞLEMLER' })).toBeVisible();

  await expect(page.getByText('Tamamlandı').first()).toBeVisible();
});

test('Enable WhatsApp and SMS notification preferences', async ({ page }) => {
  await mockTenantData(page, true);
  await signIn(page);

  await page.getByRole('button', { name: 'Ayarlar' }).click();
  await page.getByRole('button', { name: 'WhatsApp / SMS' }).click();

  await page.getByRole('button', { name: 'Değişiklikleri kaydet' }).click();
  await expect(page.getByText('WhatsApp / SMS ayarları başarıyla kaydedildi.')).toBeVisible();
  await expect(page.getByText('WhatsApp bağlantısı henüz uygulanmadı.')).not.toBeVisible();
});

test('Update alert and security preferences', async ({ page }) => {
  await mockTenantData(page, true);
  await signIn(page);

  await page.getByRole('button', { name: 'Ayarlar' }).click();
  await page.getByRole('navigation', { name: 'Ayar kategorileri' }).getByRole('button', { name: 'Bildirimler' }).click();

  const toggle = page.getByTestId('toggle-sale_create');
  await toggle.click();

  await page.getByRole('button', { name: 'Bildirim ayarlarını kaydet' }).click();
  await expect(page.getByText('Bildirim ayarları başarıyla kaydedildi.')).toBeVisible();

  // Switch to Firma Bilgileri and return to Bildirimler
  await page.getByRole('navigation', { name: 'Ayar kategorileri' }).getByRole('button', { name: 'Firma Bilgileri' }).click();
  await page.getByRole('navigation', { name: 'Ayar kategorileri' }).getByRole('button', { name: 'Bildirimler' }).click();
  await expect(page.getByTestId('toggle-sale_create')).toHaveAttribute('aria-checked', 'true');
});

test('Add a new staff member', async ({ page }) => {
  await mockTenantData(page, true, {
    branchRows: [
      { id: branchId, organization_id: orgId, name: 'QA Şube', status: 'active', archived_at: null },
      { id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', organization_id: orgId, name: 'Şube 2 (Kadıköy)', status: 'active', archived_at: null },
    ],
  });
  await page.route('**/api/invite-user', route => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({
      success: true,
      user: {
        id: 'user-new-staff-1',
        email: 'burak.test@example.invalid',
        firstName: 'Burak',
        lastName: 'Akın',
        roles: ['Odyometrist'],
        branch: 'QA Şube',
        branchId,
        status: 'Aktif',
      }
    })
  }));
  await signIn(page);

  await page.getByRole('button', { name: 'Şubeler & Yetki' }).click();
  await page.getByRole('button', { name: 'Yeni Personel Ekle' }).click();

  await page.getByPlaceholder('Örn: Burak').fill('Burak');
  await page.getByPlaceholder('Örn: Akın').fill('Akın');
  await page.getByPlaceholder('burak@isitmemerkezi.com').fill('burak.test@example.invalid');
  await page.getByPlaceholder('05XX XXX XX XX').fill('05551234567');

  const branchSelect = page.locator('select').filter({ has: page.locator('option', { hasText: 'QA Şube' }) }).last();
  await branchSelect.selectOption({ label: 'QA Şube' });

  await page.getByRole('button', { name: 'Personeli Kaydet' }).click();
  await expect(page.getByText('Kullanıcı eklenemedi: Geçersiz veri formatı.')).not.toBeVisible();

  await page.getByRole('button', { name: /Personel Yönetimi/ }).click();
  await expect(page.getByText('Burak Akın').first()).toBeVisible();
});

test('Remove a role from personnel', async ({ page }) => {
  await mockTenantData(page, true, {
    branchRows: [
      { id: branchId, organization_id: orgId, name: 'QA Şube', status: 'active', archived_at: null },
      { id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', organization_id: orgId, name: 'Şube 2 (Kadıköy)', status: 'active', archived_at: null },
    ],
  });
  await signIn(page);

  await page.getByRole('button', { name: 'Şubeler & Yetki' }).click();
  await page.getByRole('button', { name: /Personel Yönetimi/ }).click();
  await page.getByRole('button', { name: 'Düzenle' }).first().click();

  const roleSelect = page.locator('select').filter({ has: page.locator('option', { hasText: 'Odyometrist' }) }).first();
  await roleSelect.selectOption('Odyometrist');

  await page.getByRole('button', { name: 'Güncelle' }).click();
  await expect(page.getByText('Geçerli bir şube seçin.')).not.toBeVisible();
  await expect(page.getByRole('dialog')).not.toBeVisible();
});

test('Assign a clinic asset to another branch', async ({ page }) => {
  await openAssets(page, true, {
    branchRows: [
      { id: branchId, organization_id: orgId, name: 'QA Şube', status: 'active', archived_at: null },
      { id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', organization_id: orgId, name: 'Şube 2 (Kadıköy)', status: 'active', archived_at: null },
    ],
  });

  const row = page.getByRole('row').filter({ hasText: assetName });
  await row.click();
  await page.getByRole('button', { name: 'Transfer Et' }).click();

  const targetSelect = page.locator('select[aria-label="Hedef Şube"]');
  await targetSelect.selectOption({ label: 'Şube 2 (Kadıköy)' });

  await page.getByRole('button', { name: 'Transferi Onayla' }).click();
  await expect(page.getByText('Demirbaş kaydedilemedi.')).not.toBeVisible();
  await expect(page.getByText(/başarıyla Şube 2 \(Kadıköy\) şubesine transfer edildi\./)).toBeVisible();
});

test('Edit an existing clinic asset', async ({ page }) => {
  await openAssets(page, true);

  const row = page.getByRole('row').filter({ hasText: assetName });
  await row.getByTitle('Düzenle').click();

  const warrantyEnd = page.getByLabel('Garanti Bitiş Tarihi');
  await warrantyEnd.fill('2027-10-06');

  await page.getByRole('button', { name: 'Kaydet' }).click();
  await expect(page.getByText('Demirbaş kaydedilemedi.')).not.toBeVisible();
  await expect(page.getByText('Demirbaş bilgileri kaydedildi.')).toBeVisible();
  await expect(page.getByText('06.10.2027').first()).toBeVisible();
});

test('Transfer a patient with related records between branches', async ({ page }) => {
  await mockTenantData(page, true, {
    patientRows: [{
      id: 'patient-transfer-1',
      organization_id: orgId,
      branch_id: branchId,
      first_name: 'Test Hasta',
      last_name: 'Tek Şube Bir',
      branch: 'QA Şube',
      patient_status: 'Müşteri',
      deleted_at: null,
    }],
    branchRows: [
      { id: branchId, organization_id: orgId, name: 'QA Şube', status: 'active', archived_at: null },
      { id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', organization_id: orgId, name: 'Şube 2 (Kadıköy)', status: 'active', archived_at: null }
    ]
  });
  await signIn(page);

  await page.getByRole('button', { name: 'Şube Aktiviteleri' }).click();

  await page.getByPlaceholder('Hasta adı, TC veya telefon no...').fill('Test Hasta');
  const currentBranchSelect = page.locator('select').filter({ has: page.locator('option', { hasText: 'QA Şube' }) }).first();
  await currentBranchSelect.selectOption({ label: 'QA Şube' });

  const targetBranchSelect = page.locator('select').filter({ has: page.locator('option', { hasText: 'Şube 2 (Kadıköy)' }) }).last();
  await targetBranchSelect.selectOption({ label: 'Şube 2 (Kadıköy)' });

  await page.getByRole('button', { name: 'Hasta Dosyasını ve Kayıtlarını Transfer Et' }).click();
  await expect(page.getByText('Hastanın mevcut şubesi seçilen kaynak şube değil.')).not.toBeVisible();
  await expect(page.getByText(/şubesine aktarıldı\./)).toBeVisible();
});
