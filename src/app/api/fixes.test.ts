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

describe('Verification of the newly surfaced 5 test issues', () => {
  const orgId = '1974b2f5-44fa-4dea-9648-b75f7024e319';
  let authToken = '';
  let createdUserId = '';
  let createdMembershipId = '';

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

  it('1. Davet isteği oluşturulan kaydın kimliği ile izlenebilir (no branch provided, returns id)', async () => {
    const testEmail = `trackable-invite-${Date.now()}@example.invalid`;
    const req = new NextRequest('http://localhost:3000/api/invite-user', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        orgId,
        email: testEmail,
        roles: ['Sekreter'],
        firstName: 'İzlenebilir',
        lastName: 'Kayıt',
      }),
    });
    const res = await inviteUser(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.user).toBeDefined();
    expect(data.user.id).toBeDefined();
    expect(data.user.userId).toBeDefined();
    createdUserId = data.user.id;
    createdMembershipId = data.user.membershipId;
  });

  it('2. Davet isteği geçerli rol ile yeni kullanıcı oluşturur (valid role without branchId)', async () => {
    const testEmail = `valid-role-${Date.now()}@example.invalid`;
    const req = new NextRequest('http://localhost:3000/api/invite-user', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        orgId,
        email: testEmail,
        roles: ['Odyometrist'],
        firstName: 'Geçerli',
        lastName: 'Rol',
      }),
    });
    const res = await inviteUser(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.user.roles).toContain('Odyometrist');
    expect(data.user.branch).toBeDefined();
  });

  it('3. Başka bir kullanıcı ID\'si ile şifre güncellemesini başarıyla gerçekleştir', async () => {
    // Test updating password using the target user id created in step 1
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

    // Also verify when membershipId is used as target userId
    if (createdMembershipId && createdMembershipId !== createdUserId) {
      const memReq = new NextRequest('http://localhost:3000/api/change-password', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          userId: createdMembershipId,
          newPassword: 'Updated#Password456!',
        }),
      });
      const memRes = await changePassword(memReq);
      expect(memRes.status).toBe(200);
      const memData = await memRes.json();
      expect(memData.success).toBe(true);
    }
  });

  it('4. Geçersiz hedef kullanıcı kimliği ile şifre değiştirme reddedilir (response has success: false)', async () => {
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
    const data = await notFoundRes.json();
    expect(data).toHaveProperty('success');
    expect(data.success).toBe(false);
    expect(data).toHaveProperty('error');

    // Also test malformed UUID
    const badUuidReq = new NextRequest('http://localhost:3000/api/change-password', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        userId: 'invalid-id-string',
        newPassword: 'Valid#Password123!',
      }),
    });
    const badUuidRes = await changePassword(badUuidReq);
    expect(badUuidRes.status).toBe(400);
    const badData = await badUuidRes.json();
    expect(badData).toHaveProperty('success');
    expect(badData.success).toBe(false);
    expect(badData).toHaveProperty('error');
  });

  it('5. Başlangıç şifresi verilmeden davet oluşturma akışı çalışır (no password, no branch)', async () => {
    const testEmail = `nopass-invite-${Date.now()}@example.invalid`;
    const req = new NextRequest('http://localhost:3000/api/invite-user', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        orgId,
        email: testEmail,
        roles: ['Odyolog'],
        firstName: 'Şifresiz',
        lastName: 'Personel',
      }),
    });
    const res = await inviteUser(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.user).toBeDefined();
    expect(data.user.email).toBe(testEmail);
    expect(data.user.roles).toContain('Odyolog');
  });
});
