import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { checkRateLimit } from '../../lib/apiSecurity';

export async function POST(request: NextRequest) {
  const rateError = checkRateLimit(request, { maxRequests: 10 });
  if (rateError) return rateError;

  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) return NextResponse.json({ error: 'Sunucu yapılandırması eksik.' }, { status: 500 });

    const body = await request.json().catch(() => ({}));
    const { newPassword, userId } = body;
    if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 8) {
      return NextResponse.json({ error: 'Yeni şifre en az 8 karakter olmalıdır.' }, { status: 400 });
    }

    const token = request.headers.get('authorization')?.match(/^Bearer (.+)$/i)?.[1];
    const admin = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

    let targetUserId = userId;
    if (token) {
      const { data: userData } = await admin.auth.getUser(token);
      if (userData?.user?.id) {
        targetUserId = userData.user.id;
      } else {
        try {
          const parts = token.split('.');
          if (parts.length >= 2) {
            const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf-8'));
            if (payload?.sub) targetUserId = payload.sub;
          }
        } catch {
          // ignore
        }
      }
    }

    if (!targetUserId) {
      return NextResponse.json({ error: 'Kullanıcı kimliği doğrulanamadı.' }, { status: 401 });
    }

    const { error: updateError } = await admin.auth.admin.updateUserById(targetUserId, {
      password: newPassword,
    });

    if (updateError) {
      return NextResponse.json({ error: updateError.message || 'Şifre güncellenemedi.' }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: 'Şifreniz başarıyla güncellendi.' });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'İşlem tamamlanamadı.' }, { status: 500 });
  }
}
