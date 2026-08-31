/**
 * AudiPro SaaS — API Güvenlik Katmanı (apiSecurity.ts)
 *
 * Rate Limiting: IP bazlı istek sayısı sınırlandırması (brute-force, DoS koruması)
 * Zod Validasyonu: Tüm API route'larına uygulanabilir şema doğrulama
 */

import { NextRequest, NextResponse } from 'next/server';
import { z, ZodSchema } from 'zod';

// ─────────────────────────────────────────────────────────────────
// 1. IN-MEMORY RATE LIMITER (Edge uyumlu, Redis gerekmez)
// ─────────────────────────────────────────────────────────────────

interface RateLimitEntry {
  count: number;
  firstRequestAt: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

export interface RateLimitOptions {
  /** Zaman penceresi (milisaniye cinsinden) */
  windowMs?: number;
  /** Zaman penceresi içinde izin verilen maksimum istek sayısı */
  maxRequests?: number;
}

/**
 * IP bazlı rate limiting kontrolü.
 * Limit aşılırsa 429 HTTP yanıtı döndürür.
 */
export function checkRateLimit(
  request: NextRequest,
  options: RateLimitOptions = {}
): NextResponse | null {
  const windowMs = options.windowMs ?? 60_000; // Varsayılan: 1 dakika
  const maxRequests = options.maxRequests ?? 10; // Varsayılan: 10 istek/dakika

  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    request.headers.get('x-real-ip') ||
    'anonymous';

  const now = Date.now();
  const existing = rateLimitStore.get(ip);

  if (existing) {
    const elapsed = now - existing.firstRequestAt;
    if (elapsed < windowMs) {
      existing.count++;
      if (existing.count > maxRequests) {
        const retryAfterSecs = Math.ceil((windowMs - elapsed) / 1000);
        return NextResponse.json(
          {
            success: false,
            error: `Çok fazla istek gönderildi. ${retryAfterSecs} saniye sonra tekrar deneyin.`,
            retryAfterSeconds: retryAfterSecs,
          },
          {
            status: 429,
            headers: {
              'Retry-After': String(retryAfterSecs),
              'X-RateLimit-Limit': String(maxRequests),
              'X-RateLimit-Remaining': '0',
            },
          }
        );
      }
    } else {
      // Zaman penceresi geçmiş, sayacı sıfırla
      rateLimitStore.set(ip, { count: 1, firstRequestAt: now });
    }
  } else {
    rateLimitStore.set(ip, { count: 1, firstRequestAt: now });
  }

  // Bellek temizliği: çok eski kayıtları sil
  if (rateLimitStore.size > 10_000) {
    for (const [key, entry] of rateLimitStore.entries()) {
      if (now - entry.firstRequestAt > windowMs) {
        rateLimitStore.delete(key);
      }
    }
  }

  return null;
}

// ─────────────────────────────────────────────────────────────────
// 2. ZOD ŞEMA DOĞRULAMA (Server-Side Input Validation)
// ─────────────────────────────────────────────────────────────────

/**
 * API isteği gövdesini Zod şemasıyla doğrular.
 * Hata varsa 400 HTTP yanıtı döndürür, yoksa parse edilmiş veriyi döndürür.
 */
export async function validateBody<T>(
  request: NextRequest,
  schema: ZodSchema<T>
): Promise<{ data: T; error: null } | { data: null; error: NextResponse }> {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return {
      data: null,
      error: NextResponse.json(
        { success: false, error: 'Geçersiz JSON formatı.' },
        { status: 400 }
      ),
    };
  }

  const result = schema.safeParse(body);

  if (!result.success) {
    const details = result.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`);
    return {
      data: null,
      error: NextResponse.json(
        { success: false, error: 'Geçersiz veri formatı.', details },
        { status: 400 }
      ),
    };
  }

  return { data: result.data, error: null };
}

// ─────────────────────────────────────────────────────────────────
// 3. ZOD ŞEMAları — API Route Doğrulama Şemaları
// ─────────────────────────────────────────────────────────────────

export const InviteUserSchema = z.object({
  email: z.string().email('Geçerli bir e-posta adresi giriniz.').max(254),
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  phone: z.string().max(20).optional(),
  roles: z.array(z.string().min(1).max(100)).min(1, 'En az bir rol seçilmelidir.'),
  branchId: z.string().uuid().optional().nullable(),
  orgId: z.string().uuid('Geçerli bir organizasyon ID giriniz.'),
});

export const SelectOrgSchema = z.object({
  orgId: z.string().uuid('Geçerli bir organizasyon ID giriniz.'),
});

export type InviteUserInput = z.infer<typeof InviteUserSchema>;
export type SelectOrgInput = z.infer<typeof SelectOrgSchema>;
