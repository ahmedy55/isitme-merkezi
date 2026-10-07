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

describe('Verification of the 3 latest reported issues', () => {
  const orgId = '1974b2f5-44fa-4dea-9648-b75f7024e319';
  let authToken = '';
  let createdUserId = '';
  const fixedTestEmail = 'reused-test-runner-email@example.com';

  beforeAll(async () => {
    const req = new NextRequest('http://localhost:3000/api/qa-login', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        email: 'playwright@example.invalid',
        password: 'playwright-test-password',
      }),
    });
    const res = await qaLogin(req);
    const data = await res.json();
    authToken = data.token;
  });

  it('1. Invite flow succeeds even when email is reused across runs (Issue 1)', async () => {
    // First invite call
    const req1 = new NextRequest('http://localhost:3000/api/invite-user', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        orgId,
        email: fixedTestEmail,
        roles: ['Sekreter'],
        firstName: 'Test',
        lastName: 'Bir',
      }),
    });
    const res1 = await inviteUser(req1);
    expect(res1.status).toBe(200);
    const data1 = await res1.json();
    expect(data1.success).toBe(true);
    expect(data1.user.email).toBe(fixedTestEmail);
    createdUserId = data1.user.id;

    // Second invite call with the exact same email (simulating repeated test runner execution)
    const req2 = new NextRequest('http://localhost:3000/api/invite-user', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        orgId,
        email: fixedTestEmail,
        roles: ['Odyolog'],
        firstName: 'Test',
        lastName: 'İki',
      }),
    });
    const res2 = await inviteUser(req2);
    // Must NOT return 409 "Hesap oluşturulamadı. E-posta kullanımda olabilir."
    expect(res2.status).toBe(200);
    const data2 = await res2.json();
    expect(data2.success).toBe(true);
    expect(data2.user.email).toBe(fixedTestEmail);
  });

  it('2. Password update with target user ID succeeds (Issue 2)', async () => {
    const req = new NextRequest('http://localhost:3000/api/change-password', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        userId: createdUserId,
        newPassword: 'Updated#Password123!',
      }),
    });
    const res = await changePassword(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.message).toBe('Şifreniz başarıyla güncellendi.');
  });

  it('3. Error response has both message and error fields on invalid target user (Issue 3)', async () => {
    const req = new NextRequest('http://localhost:3000/api/change-password', {
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
    const res = await changePassword(req);
    expect(res.status).toBe(404);
    const data = await res.json();
    expect(data.success).toBe(false);
    expect(data).toHaveProperty('message');
    expect(typeof data.message).toBe('string');
    expect(data).toHaveProperty('error');
    expect(typeof data.error).toBe('string');
  });
});
