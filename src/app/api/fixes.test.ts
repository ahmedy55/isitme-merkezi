import { beforeAll, describe, expect, it } from 'vitest';
import { NextRequest } from 'next/server';
import fs from 'node:fs';

try {
  const envFile = fs.readFileSync('.env.local', 'utf-8');
  for (const line of envFile.split('\n')) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const idx = trimmed.indexOf('=');
      if (idx !== -1) {
        const key = trimmed.slice(0, idx).trim();
        const val = trimmed.slice(idx + 1).trim().replace(/^["']|["']$/g, '');
        if (!process.env[key]) process.env[key] = val;
      }
    }
  }
} catch {}

import { POST as selectOrg } from './select-org/route';
import { POST as changePassword } from './change-password/route';
import { POST as inviteUser } from './invite-user/route';
import { POST as qaLogin } from './qa-login/route';

describe('Verification of the 5 reported issues', () => {
  const orgId = '1974b2f5-44fa-4dea-9648-b75f7024e319';
  const branchId = '22222222-2222-4222-8222-222222222222';
  let authToken = '';

  it('1. QA login issues valid token and sets cookie', async () => {
    const req = new NextRequest('http://localhost:3000/api/qa-login', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        email: 'playwright@example.invalid',
        password: 'playwright-test-password',
      }),
    });
    const res = await qaLogin(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.token).toBeDefined();
    expect(typeof data.token).toBe('string');
    authToken = data.token;
  });

  it('2. Organization selection succeeds with valid session (Issue 1)', async () => {
    const req = new NextRequest('http://localhost:3000/api/select-org', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({ orgId }),
    });
    const res = await selectOrg(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.orgId).toBe(orgId);
    expect(data.organization).toBeDefined();
  });

  it('3. Password change rejects invalid target user ID (Issue 2)', async () => {
    // Malformed UUID
    const badUuidReq = new NextRequest('http://localhost:3000/api/change-password', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        userId: 'invalid-nonexistent-id',
        newPassword: 'Valid#Password123!',
      }),
    });
    const badUuidRes = await changePassword(badUuidReq);
    expect(badUuidRes.status).toBe(400);

    // Nonexistent UUID
    const notFoundReq = new NextRequest('http://localhost:3000/api/change-password', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        userId: '00000000-0000-0000-0000-000000000000',
        newPassword: 'Valid#Password123!',
      }),
    });
    const notFoundRes = await changePassword(notFoundReq);
    expect(notFoundRes.status).toBe(404);
  });

  it('4. Invite creation works with fixture branch without initial password (Issue 3)', async () => {
    const testEmail = `test-invite-${Date.now()}@example.invalid`;
    const req = new NextRequest('http://localhost:3000/api/invite-user', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        orgId,
        branchId,
        email: testEmail,
        roles: ['Sekreter'],
        firstName: 'Otomatik',
        lastName: 'Test',
      }),
    });
    const res = await inviteUser(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.user).toBeDefined();
    expect(data.user.email).toBe(testEmail);
  });

  it('5. Multi-role invite with Şube Müdürü / multi-role is accepted (Issue 4 & 5)', async () => {
    const testEmail = `test-multirole-${Date.now()}@example.invalid`;
    const req = new NextRequest('http://localhost:3000/api/invite-user', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        orgId,
        branchId,
        email: testEmail,
        roles: ['Şube Müdürü', 'Odyometrist'],
        firstName: 'Multi',
        lastName: 'Role',
      }),
    });
    const res = await inviteUser(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.user).toBeDefined();
    expect(data.user.roles).toContain('Şube Müdürü');
  });
});
