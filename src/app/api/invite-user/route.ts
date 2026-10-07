import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { checkRateLimit, validateBody, InviteUserSchema } from '../../lib/apiSecurity';

function errorResponse(status: number, message: string) {
  return NextResponse.json({ success: false, message, error: message }, { status });
}

export async function POST(request: NextRequest) {
  const rateError = checkRateLimit(request, { maxRequests: 10 });
  if (rateError) return rateError;

  try {
    const { data: body, error: validationError } = await validateBody(request, InviteUserSchema);
    if (validationError) return validationError;

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) {
      return errorResponse(500, 'Sunucu yapılandırması eksik.');
    }

    const token = request.headers.get('authorization')?.match(/^Bearer (.+)$/i)?.[1]?.trim()
      || request.headers.get('Authorization')?.match(/^Bearer (.+)$/i)?.[1]?.trim()
      || request.cookies.get('sb-access-token')?.value?.trim()
      || request.cookies.get('supabase-auth-token')?.value?.trim();

    if (!token) {
      return errorResponse(401, 'Oturum gerekli.');
    }

    const admin = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

    const { data: userData, error: authError } = await admin.auth.getUser(token);
    const user = !authError ? userData?.user : null;
    if (!user?.id) {
      return errorResponse(401, 'Geçersiz oturum.');
    }

    const { orgId, branchId, roles, email, password, firstName, lastName, phone } = body;

    const targetOrgId = orgId;

    const { data: member, error: memberError } = await admin.from('memberships').select('roles')
      .eq('user_id', user.id).eq('organization_id', targetOrgId).eq('status', 'active').maybeSingle();

    if (memberError) return errorResponse(500, 'Üyelik yetkisi doğrulanamadı.');
    if (!member?.roles?.includes('Firma Yöneticisi')) {
      return errorResponse(403, 'Firma yöneticisi yetkisi gerekli.');
    }

    const { data: org, error: orgError } = await admin.from('organizations')
      .select('subscription_status,plan_type,trial_ends_at,max_branches').eq('id', targetOrgId).single();

    if (orgError || !org || org.subscription_status !== 'active' || (org.plan_type === 'trial' && org.trial_ends_at && Date.parse(org.trial_ends_at) <= Date.now())) {
      return errorResponse(403, 'Firma lisansı aktif değil.');
    }

    // Map synonym roles to DB trigger supported roles
    const DB_ALLOWED_ROLES = ['Firma Yöneticisi', 'Şube Yöneticisi', 'Odyolog', 'Odyometrist', 'Sekreter', 'Resepsiyon', 'Muhasebe'];
    const ROLE_SYNONYMS: Record<string, string> = {
      'Şube Müdürü': 'Şube Yöneticisi',
      'Stajyer': 'Sekreter',
      'Teknik Servis': 'Sekreter',
      'Satış Danışmanı': 'Sekreter',
      'Admin': 'Firma Yöneticisi',
      'Manager': 'Şube Yöneticisi',
      'Audiologist': 'Odyolog',
      'Audiometrist': 'Odyometrist',
      'Secretary': 'Sekreter',
      'Receptionist': 'Resepsiyon',
      'Accounting': 'Muhasebe',
    };
    const mappedRoles = Array.from(new Set(roles.map((r: string) => ROLE_SYNONYMS[r] || r))).filter((r: string) => DB_ALLOWED_ROLES.includes(r));
    const effectiveRoles = mappedRoles.length > 0 ? mappedRoles : ['Sekreter'];

    let resolvedBranchId: string | null = branchId || null;
    let branchName = 'Şube';

    if (resolvedBranchId) {
      let { data: branch } = await admin.from('branches').select('id, name, status')
        .eq('id', resolvedBranchId).eq('organization_id', targetOrgId).maybeSingle();

      if (!branch) {
        // Try lookup by branch name
        const { data: bByName } = await admin.from('branches').select('id, name, status')
          .eq('name', resolvedBranchId).eq('organization_id', targetOrgId).maybeSingle();
        if (bByName) branch = bByName;
      }

      if (!branch || (branch.status && !['active', 'aktif'].includes(branch.status.toLowerCase()))) {
        return errorResponse(400, 'Geçersiz şube.');
      }
      resolvedBranchId = branch.id;
      branchName = branch.name || 'Şube';
    } else if (!roles.includes('Firma Yöneticisi') && !effectiveRoles.includes('Firma Yöneticisi')) {
      // Personnel role without explicit branch: auto-assign default branch for organization
      let branchQuery: any = admin.from('branches')
        .select('id, name, status')
        .eq('organization_id', targetOrgId)
        .eq('status', 'active');
      if (typeof branchQuery.order === 'function') {
        branchQuery = branchQuery.order('created_at', { ascending: true });
      }
      if (typeof branchQuery.limit === 'function') {
        branchQuery = branchQuery.limit(1);
      }
      const { data: defaultBranch } = await branchQuery.maybeSingle();

      if (defaultBranch) {
        resolvedBranchId = defaultBranch.id;
        branchName = defaultBranch.name || 'Ana Şube';
      }
    }

    const { data: created, error: createError } = await admin.auth.admin.createUser({
      email: email.trim().toLowerCase(),
      password,
      email_confirm: true,
      app_metadata: { organization_id: targetOrgId, branch_id: resolvedBranchId, roles },
      user_metadata: { first_name: firstName || '', last_name: lastName || '' },
    });

    let uid: string;
    if (createError || !created?.user) {
      return errorResponse(409, 'Hesap oluşturulamadı. E-posta kullanımda olabilir.');
    } else {
      uid = created.user.id;
    }

    let membership: any = null;
    const { data: rpcMembership, error: provisionError } = await admin.rpc('provision_member', {
      p_actor: user.id,
      p_org: targetOrgId,
      p_user: uid,
      p_branch: resolvedBranchId,
      p_roles: effectiveRoles,
      p_email: email.trim().toLowerCase(),
      p_first: firstName || '',
      p_last: lastName || '',
      p_phone: phone || '',
    });

    if (!provisionError && rpcMembership) membership = rpcMembership;

    if (!membership) {
      const { error: cleanupError } = await admin.auth.admin.deleteUser(uid);
      if (cleanupError) console.error('Unlinked Auth account requires cleanup');
      return errorResponse(provisionError?.code && /^(22|23|P0)/.test(provisionError.code) ? 409 : 503,
        'Üyelik oluşturulamadı; firma limitini ve şube atamasını kontrol edin.');
    }

    const joinedAt = membership.joined_at ? membership.joined_at.split('T')[0] : new Date().toISOString().split('T')[0];
    return NextResponse.json({
      success: true,
      id: uid,
      userId: uid,
      membershipId: membership.id,
      message: 'Kullanıcı daveti başarıyla oluşturuldu.',
      user: {
        id: uid,
        userId: uid,
        membershipId: membership.id,
        firstName: firstName || '',
        lastName: lastName || '',
        email: email.trim().toLowerCase(),
        phone: phone || '',
        roles,
        branchId: resolvedBranchId,
        branch: branchName || (resolvedBranchId ? 'Şube' : 'Tüm Şubeler'),
        status: 'Aktif',
        createdAt: joinedAt
      }
    });
  } catch {
    return errorResponse(500, 'Kullanıcı oluşturma işlemi tamamlanamadı.');
  }
}
