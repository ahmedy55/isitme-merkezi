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
  paymentRows?: Record<string, unknown>[];
  paymentInsertBodies?: Record<string, unknown>[];
  saleRpcPayloads?: Record<string, unknown>[];
  failStockInsert?: boolean;
  failStockAdjustment?: boolean;
  cashBranchIds?: string[];
  expenseBranchIds?: string[];
  invoiceBranchIds?: string[];
  assetSerial?: string;
  assetWarrantyExpiry?: string | null;
  assetStatus?: string;
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

    if (table === 'memberships') {
      rows = [{ id: '55555555-5555-4555-8555-555555555555', user_id: userId, organization_id: orgId, branch_id: branchId, first_name: 'Playwright', last_name: 'Test', email: 'playwright@example.invalid', roles: ['Firma Yöneticisi'], status: 'active' }];
    } else if (table === 'my_organizations') {
      rows = [{ organization_id: orgId, name: 'Playwright Yalıtılmış Test Firması' }];
    } else if (table === 'branches') {
      rows = [{ id: branchId, organization_id: orgId, name: 'QA Şube', status: 'active', archived_at: null }];
    } else if (table === 'assets' && withAsset) {
      const existingAsset = {
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
      if (route.request().method() === 'POST') {
        const body = route.request().postDataJSON() as Record<string, unknown>;
        Object.assign(existingAsset, body);
        fixtures.assetStatus = String(existingAsset.status);
        await route.fulfill({ status: 200, contentType: 'application/vnd.pgrst.object+json', headers: corsHeaders, body: JSON.stringify(existingAsset) });
        return;
      }
      rows = [existingAsset];
    } else if (table === 'service_tickets') {
      rows = fixtures.serviceRows || [];
    } else if (table === 'sgk_period_invoices') {
      rows = fixtures.invoiceRows || [];
    } else if (table === 'sgk_payment_records') {
      rows = fixtures.paymentRows || [];
    } else if (table === 'patients') {
      rows = fixtures.patientRows || [];
    } else if (table === 'recall_items') {
      rows = fixtures.recallRows || [];
    } else if (table === 'appointments') {
      rows = fixtures.appointmentRows || [];
    } else if (table === 'activity_logs') {
      rows = fixtures.activityRows || [];
    } else if (table === 'decrypt_patient_tcs') {
      const patientIds = (route.request().postDataJSON() as { p_patient_ids?: string[] }).p_patient_ids || [];
      rows = (fixtures.patientRows || []).filter(patient => patientIds.includes(String(patient.id))).map(patient => ({ patient_id: patient.id, tc: patient.decrypted_tc || '' }));
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
}

async function openAssets(page: Page, withAsset: boolean) {
  await mockTenantData(page, withAsset);
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
  await page.getByRole('button', { name: 'Randevular' }).click();
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

test('demirbaş seri numarası araması noktalama farklarını normalize eder', async ({ page }) => {
  await mockTenantData(page, true, { assetSerial: 'QA ASSET 1B 001' });
  await signIn(page);
  await page.getByRole('button', { name: 'Demirbaşlar' }).click();
  await page.getByPlaceholder('Demirbaş adı, seri no, marka ile ara...').fill('QA-ASSET-1B-001');
  const row = page.getByRole('row').filter({ hasText: assetName });
  await expect(row).toBeVisible();
  await expect(row).toContainText('QA ASSET 1B 001');
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
