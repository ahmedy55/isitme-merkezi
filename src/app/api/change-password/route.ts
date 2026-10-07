import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { checkRateLimit } from '../../lib/apiSecurity';

function errorResponse(status: number, message: string) {
  return NextResponse.json({ success: false, message, error: message }, { status });
}

function getBearerToken(request: NextRequest) {
  return request.headers.get('authorization')?.match(/^Bearer\s+(.+)$/i)?.[1]?.trim()
    || request.cookies.get('sb-access-token')?.value?.trim()
    || request.cookies.get('supabase-auth-token')?.value?.trim();
}

export async function POST(request: NextRequest) {
  const rateError = checkRateLimit(request, { maxRequests: 10 });
  if (rateError) return rateError;

  try {
    const body = await request.json().catch(() => ({}));
    const newPassword = body?.newPassword;
    const targetIdInput = body?.userId ?? body?.targetUserId ?? body?.user_id ?? body?.id;

    if (typeof newPassword !== 'string' || newPassword.length < 8 || newPassword.length > 128) {
      return errorResponse(400, 'Yeni şifre 8-128 karakter arasında olmalıdır.');
    }
    if (targetIdInput !== undefined && targetIdInput !== null && targetIdInput !== ''
      && (typeof targetIdInput !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(targetIdInput))) {
      return errorResponse(400, 'Geçersiz hedef kullanıcı kimliği.');
    }

    const token = getBearerToken(request);
    if (!token) return errorResponse(401, 'Oturum gerekli.');

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) return errorResponse(500, 'Sunucu yapılandırması eksik.');

    const admin = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data: userData, error: authError } = await admin.auth.getUser(token);
    const caller = !authError ? userData?.user : null;
    if (!caller?.id) return errorResponse(401, 'Kullanıcı kimliği doğrulanamadı.');

    const targetInput = targetIdInput || caller.id;
    let targetUserId = caller.id;

    if (targetInput !== caller.id) {
      // Manager authority must come from an active database membership, never token metadata.
      const { data: callerMemberships, error: callerMembershipError } = await admin.from('memberships')
        .select('organization_id, roles')
        .eq('user_id', caller.id)
        .eq('status', 'active');
      if (callerMembershipError) return errorResponse(500, 'Kullanıcı yetkisi doğrulanamadı.');

      const managerOrgIds = (callerMemberships || [])
        .filter((membership: { organization_id?: string; roles?: string[] }) => membership.roles?.includes('Firma Yöneticisi'))
        .map((membership: { organization_id?: string }) => membership.organization_id)
        .filter((id: string | undefined): id is string => Boolean(id));
      if (managerOrgIds.length === 0) {
        return errorResponse(403, 'Başka bir kullanıcının şifresini değiştirmek için yetkiniz yok.');
      }

      // Accept either the auth user UUID or a membership UUID returned by the user-management API.
      const { data: targetAuth } = await admin.auth.admin.getUserById(targetInput);
      let resolvedTargetId = targetAuth?.user?.id || null;
      if (!resolvedTargetId) {
        const { data: membership } = await admin.from('memberships').select('user_id')
          .eq('id', targetInput).in('organization_id', managerOrgIds).eq('status', 'active').maybeSingle();
        resolvedTargetId = membership?.user_id || null;
      }
      if (!resolvedTargetId) return errorResponse(404, 'Hedef kullanıcı bulunamadı.');

      // A valid auth account is not sufficient: the target must be an active member of
      // an organization in which the caller is an active manager.
      const { data: targetMembership, error: targetMembershipError } = await admin.from('memberships')
        .select('user_id')
        .eq('user_id', resolvedTargetId)
        .in('organization_id', managerOrgIds)
        .eq('status', 'active')
        .limit(1)
        .maybeSingle();
      if (targetMembershipError) return errorResponse(500, 'Hedef kullanıcı yetkisi doğrulanamadı.');
      if (!targetMembership?.user_id) return errorResponse(404, 'Hedef kullanıcı bulunamadı.');
      targetUserId = resolvedTargetId;
    }

    const { error: updateError } = await admin.auth.admin.updateUserById(targetUserId, { password: newPassword });
    if (updateError) return errorResponse(400, updateError.message || 'Şifre güncellenemedi.');

    return NextResponse.json({
      success: true,
      message: 'Şifreniz başarıyla güncellendi.',
      userId: targetUserId,
    });
  } catch {
    return errorResponse(500, 'İşlem tamamlanamadı.');
  }
}
