import { describe, expect, it } from 'vitest';
import { NextRequest } from 'next/server';
import { z } from 'zod';
import { validateBody } from './apiSecurity';

const schema = z.object({ value: z.string().max(20_000) });

describe('validateBody request-size guard', () => {
  it('accepts a valid JSON body within the limit', async () => {
    const request = new NextRequest('http://localhost/api/test', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ value: 'ok' }),
    });

    await expect(validateBody(request, schema)).resolves.toEqual({
      data: { value: 'ok' },
      error: null,
    });
  });

  it('rejects oversized bodies even without trusting Content-Length', async () => {
    const request = new NextRequest('http://localhost/api/test', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ value: 'x'.repeat(17 * 1024) }),
    });

    const result = await validateBody(request, schema);
    expect(result.data).toBeNull();
    expect(result.error?.status).toBe(413);
  });

  it('rejects a declared oversized body before reading it', async () => {
    const request = new NextRequest('http://localhost/api/test', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'content-length': String(17 * 1024) },
      body: JSON.stringify({ value: 'ok' }),
    });

    const result = await validateBody(request, schema);
    expect(result.data).toBeNull();
    expect(result.error?.status).toBe(413);
  });
});
