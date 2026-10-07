import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  getUserById: vi.fn(),
  updateUserById: vi.fn(),
  createUser: vi.fn(),
  deleteUser: vi.fn(),
  from: vi.fn(),
  rpc: vi.fn(),
  passwordFlow: false,
}));

vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    auth: {
      getUser: mocks.getUser,
      admin: {
        getUserById: mocks.getUserById,
        updateUserById: mocks.updateUserById,
        createUser: mocks.createUser,
        deleteUser: mocks.deleteUser,
      },
    },
    from: mocks.from,
    rpc: mocks.rpc,
  }),
}));

vi.mock('../lib/apiSecurity', async () => {
  const actual = await vi.importActual<typeof import('../lib/apiSecurity')>('../lib/apiSecurity');
  return { ...actual, checkRateLimit: () => null };
});

import { POST as changePassword } from './change-password/route';
import { POST as inviteUser } from './invite-user/route';
import { POST as qaLogin } from './qa-login/route';

const orgId = '00000000-0000-4000-8000-000000000001';
const branchId = '00000000-0000-4000-8000-000000000011';
const actorId = '00000000-0000-4000-8000-000000000021';
const targetId = '00000000-0000-4000-8000-000000000022';

function queryResult(data: unknown, error: unknown = null) {
  const query: Record<string, unknown> = {};
  for (const method of ['select', 'eq', 'in', 'limit', 'order']) query[method] = () => query;
  query.maybeSingle = async () => ({ data, error });
  query.single = async () => ({ data, error });
  query.then = (resolve: (value: unknown) => unknown) => Promise.resolve({ data, error }).then(resolve);
  return query;
}

function request(url: string, body: unknown, token = true) {
  return new NextRequest(url, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      ...(token ? { authorization: 'Bearer verified-test-token' } : {}),
    },
    body: JSON.stringify(body),
  });
}

const validInvite = {
  orgId,
  branchId,
  email: 'new.member@example.test',
  password: 'A-Strong-Initial-Password-7!',
  firstName: 'Yeni',
  lastName: 'Kullanıcı',
  phone: '05551234567',
  roles: ['Sekreter'],
};

describe('retired QA login endpoint', () => {
  it('returns a JSON 404 without creating or authenticating a user', async () => {
    const response = await qaLogin();
    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toMatchObject({ success: false });
  });
});

beforeEach(() => {
  vi.clearAllMocks();
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co';
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'unit-test-only';
  mocks.getUser.mockResolvedValue({ data: { user: { id: actorId } }, error: null });
  mocks.getUserById.mockResolvedValue({ data: { user: { id: targetId } }, error: null });
  mocks.updateUserById.mockResolvedValue({ data: { user: { id: targetId } }, error: null });
  mocks.createUser.mockResolvedValue({ data: { user: { id: targetId } }, error: null });
  mocks.deleteUser.mockResolvedValue({ error: null });
  mocks.rpc.mockResolvedValue({ data: { id: 'membership-id', joined_at: '2026-10-07T00:00:00Z' }, error: null });
  mocks.passwordFlow = false;
  let membershipQueryCount = 0;
  mocks.from.mockImplementation((table: string) => {
    if (table === 'memberships') {
      membershipQueryCount += 1;
      if (mocks.passwordFlow && membershipQueryCount === 1) return queryResult([{ organization_id: orgId, roles: ['Firma Yöneticisi'] }]);
      if (mocks.passwordFlow && membershipQueryCount === 2) return queryResult({ user_id: targetId });
      if (mocks.passwordFlow) return queryResult(null);
      if (membershipQueryCount === 1) return queryResult({ roles: ['Firma Yöneticisi'] });
      return queryResult({ user_id: targetId });
    }
    if (table === 'organizations') return queryResult({ subscription_status: 'active', plan_type: 'pro' });
    if (table === 'branches') return queryResult({ id: branchId, name: 'Merkez', status: 'active' });
    return queryResult(null);
  });
});

describe('invite-user request validation', () => {
  it('rejects a missing initial password before creating any user', async () => {
    const { password: _password, ...withoutPassword } = validInvite;
    const response = await inviteUser(request('http://localhost/api/invite-user', withoutPassword));

    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({ success: false });
    expect(mocks.createUser).not.toHaveBeenCalled();
  });

  it('rejects missing required identity/contact fields before side effects', async () => {
    const response = await inviteUser(request('http://localhost/api/invite-user', {
      ...validInvite,
      firstName: '',
      lastName: '',
      phone: '',
    }));

    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({ success: false });
    expect(mocks.createUser).not.toHaveBeenCalled();
    expect(mocks.rpc).not.toHaveBeenCalled();
  });

  it('rejects a missing organization id before side effects', async () => {
    const { orgId: _orgId, ...withoutOrgId } = validInvite;
    const response = await inviteUser(request('http://localhost/api/invite-user', withoutOrgId));

    expect(response.status).toBe(400);
    expect(mocks.createUser).not.toHaveBeenCalled();
    expect(mocks.rpc).not.toHaveBeenCalled();
  });

  it('creates an invitation only when all required fields are valid', async () => {
    const response = await inviteUser(request('http://localhost/api/invite-user', validInvite));

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ success: true, userId: targetId });
    expect(mocks.createUser).toHaveBeenCalledWith(expect.objectContaining({ password: validInvite.password }));
    expect(mocks.rpc).toHaveBeenCalledWith('provision_member', expect.objectContaining({ p_actor: actorId, p_org: orgId }));
  });
});

describe('change-password target lookup', () => {
  it('updates another active user in the manager organization', async () => {
    mocks.passwordFlow = true;
    const response = await changePassword(request('http://localhost/api/change-password', {
      userId: targetId,
      newPassword: 'A-New-Strong-Password-8!',
    }));

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ success: true, userId: targetId });
    expect(mocks.updateUserById).toHaveBeenCalledWith(targetId, { password: 'A-New-Strong-Password-8!' });
  });

  it('does not provision a missing target account', async () => {
    mocks.passwordFlow = true;
    mocks.getUserById.mockResolvedValue({ data: { user: null }, error: { message: 'not found' } });
    const response = await changePassword(request('http://localhost/api/change-password', {
      userId: targetId,
      newPassword: 'A-New-Strong-Password-8!',
    }));

    expect(response.status).toBe(404);
    expect(mocks.createUser).not.toHaveBeenCalled();
    expect(mocks.updateUserById).not.toHaveBeenCalled();
  });
});
