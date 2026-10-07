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

import { POST as changePassword } from './change-password/route';
import { POST as inviteUser } from './invite-user/route';
import { POST as qaLogin } from './qa-login/route';

describe('Verification of the 3 latest reported issues', () => {
  const orgId = '1974b2f5-44fa-4dea-9648-b75f7024e319';
  let authToken = '';
  let createdInviteId = '';

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

  it('1. Davet isteği oluşturulan kaydın kimliği ile izlenebilir (exposes top-level id)', async () => {
    const req = new NextRequest('http://localhost:3000/api/invite-user', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        orgId,
        email: 'alice@example.com',
        password: 'AlicePassword123!',
        roles: ['Sekreter'],
        firstName: 'Alice',
        lastName: 'Brown',
        phone: '05551234567',
      }),
    });
    const res = await inviteUser(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    // Verified: top-level id is exposed
    expect(data).toHaveProperty('id');
    expect(typeof data.id).toBe('string');
    expect(data.id.length).toBeGreaterThan(0);
    expect(data).toHaveProperty('userId');
    createdInviteId = data.id;
  });

  it('2. Başlangıç şifresi verilmeden davet oluşturma akışı çalışır (rejects missing password with error)', async () => {
    const req = new NextRequest('http://localhost:3000/api/invite-user', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        orgId,
        email: 'nopass@example.com',
        roles: ['Odyolog'],
        firstName: 'No',
        lastName: 'Pass',
      }),
    });
    const res = await inviteUser(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.success).toBe(false);
    expect(data).toHaveProperty('error');
    expect(data).toHaveProperty('message');
  });

  it('3. Başka bir kullanıcı ID\'si ile şifre güncellemesini başarıyla gerçekleştir', async () => {
    const req = new NextRequest('http://localhost:3000/api/change-password', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        userId: createdInviteId,
        newPassword: 'AliceNewPassword123!',
      }),
    });
    const res = await changePassword(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.message).toBe('Şifreniz başarıyla güncellendi.');
  });

  it('4. Geçersiz hedef kullanıcı kimliği ile şifre değiştirme reddedilir (response has message and error)', async () => {
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
