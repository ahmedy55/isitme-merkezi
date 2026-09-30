# P0 Playwright API E2E tests

These tests exercise the real Supabase Auth + PostgREST + RLS/trigger path using Playwright's API request runner. The project has no `/api/patients/:id` or `/api/inventory` routes, so tests target the actual `/auth/v1` and `/rest/v1` endpoints instead.

## Safety / fixtures

Run only against an isolated test Supabase project. Tests intentionally have no service-role key and do not create or delete fixture data. The duplicate-serial test attempts one insert that must be rejected by the database trigger. Seed:

- Tenant A and tenant B test users, each with an active membership.
- An active tenant A Odyometrist account and a finance transaction visible to the tenant manager.
- A patient visible to tenant B and its UUID.
- Exactly one non-deleted `Cihaz` stock row for tenant A with the fixture serial number.
- Tenant A's organization UUID and an authorized branch UUID.

Use credentials and UUIDs from the isolated test project only. Never put secrets in source control or use production accounts/data.

PowerShell example (replace values with isolated-test-project values):

```powershell
$env:E2E_ALLOW_TEST_DATABASE = '1'
$env:E2E_SUPABASE_URL = 'https://<test-project-ref>.supabase.co'
$env:E2E_SUPABASE_ANON_KEY = '<test-project-anon-key>'
$env:E2E_TENANT_A_EMAIL = '<tenant-a-test-user>'
$env:E2E_TENANT_A_PASSWORD = '<tenant-a-test-password>'
$env:E2E_TENANT_B_EMAIL = '<tenant-b-test-user>'
$env:E2E_TENANT_B_PASSWORD = '<tenant-b-test-password>'
$env:E2E_TENANT_A_ODYOMETRIST_EMAIL = '<tenant-a-odyometrist-test-user>'
$env:E2E_TENANT_A_ODYOMETRIST_PASSWORD = '<tenant-a-odyometrist-test-password>'
$env:E2E_FINANCE_TRANSACTION_ID = '<tenant-a-finance-transaction-uuid>'
$env:E2E_TENANT_B_PATIENT_ID = '<tenant-b-patient-uuid>'
$env:E2E_TENANT_A_ORGANIZATION_ID = '<tenant-a-organization-uuid>'
$env:E2E_TENANT_A_BRANCH_ID = '<tenant-a-branch-uuid>'
$env:E2E_EXISTING_DEVICE_SERIAL = '<tenant-a-seeded-serial>'
npm run test:e2e:p0
```

RLS may answer a cross-tenant read with HTTP 200 and an empty array; that is expected and is asserted. The duplicate serial check asserts the database trigger's `Serial number already exists` rejection.
