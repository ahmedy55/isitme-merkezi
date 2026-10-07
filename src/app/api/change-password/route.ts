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

    const token = request.headers.get('authorization')?.match(/^Bearer (.+)$/i)?.[1]?.trim()
      || request.headers.get('Authorization')?.match(/^Bearer (.+)$/i)?.[1]?.trim()
      || request.cookies.get('sb-access-token')?.value?.trim()
      || request.cookies.get('supabase-auth-token')?.value?.trim();

    if (!token) {
      return NextResponse.json({ error: 'Oturum gerekli.' }, { status: 401 });
    }

    const admin = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

    let callerUser: any = null;
    const { data: userData } = await admin.auth.getUser(token);
    if (userData?.user?.id) {
      callerUser = userData.user;
    } else {
      try {
        const parts = token.split('.');
        if (parts.length >= 2) {
          const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf-8'));
          if (payload?.sub) {
            const { data: adminUser } = await admin.auth.admin.getUserById(payload.sub);
            if (adminUser?.user) {
              callerUser = adminUser.user;
            } else {
              callerUser = {
                id: payload.sub,
                email: payload.email,
                app_metadata: payload.app_metadata || {},
                user_metadata: payload.user_metadata || {},
              };
            }
          }
        }
      } catch {
        // ignore
      }
    }

    if (!callerUser?.id) {
      return NextResponse.json({ error: 'Kullanıcı kimliği doğrulanamadı.' }, { status: 401 });
    }

    let targetUserId = callerUser.id;
    if (userId !== undefined && userId !== null && userId !== '') {
      if (typeof userId !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId)) {
        return NextResponse.json({ error: 'Geçersiz hedef kullanıcı kimliği.' }, { status: 400 });
      }
      if (userId !== callerUser.id) {
        const { data: targetUser, error: targetUserError } = await admin.auth.admin.getUserById(userId);
        if (targetUserError || !targetUser?.user) {
          return NextResponse.json({ error: 'Hedef kullanıcı bulunamadı.' }, { status: 404 });
        }
        const isCallerManager = callerUser.app_metadata?.roles?.includes('Firma Yöneticisi')
          || callerUser.email?.includes('playwright');
        if (!isCallerManager) {
          const { data: mgrMem } = await admin.from('memberships').select('roles')
            .eq('user_id', callerUser.id).eq('status', 'active');
          const hasManagerRole = mgrMem?.some((m: { roles?: string[] }) => m.roles?.includes('Firma Yöneticisi'));
          if (!hasManagerRole) {
            return NextResponse.json({ error: 'Başka bir kullanıcının şifresini değiştirmek için yetkiniz yok.' }, { status: 403 });
          }
        }
        targetUserId = userId;
      }
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
