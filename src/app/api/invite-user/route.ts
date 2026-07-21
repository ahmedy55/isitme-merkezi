import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://znktitzknixpbakfrnzk.supabase.co';
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

    if (!supabaseUrl) {
      return NextResponse.json({ error: 'Supabase URL yapılandırılmamış.' }, { status: 500 });
    }

    // 1. Yetki Kontrolü: İsteği atan kullanıcının Bearer JWT Token kontrolü
    const authHeader = request.headers.get('authorization') || request.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '').trim();

    if (!token) {
      return NextResponse.json({ error: 'Yetkisiz erişim. Lütfen oturum açın.' }, { status: 401 });
    }

    const supabaseUserClient = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '', {
      auth: { persistSession: false }
    });

    const { data: { user: requesterUser }, error: authErr } = await supabaseUserClient.auth.getUser(token);

    if (authErr || !requesterUser) {
      return NextResponse.json({ error: 'Geçersiz veya süresi dolmuş oturum.' }, { status: 401 });
    }

    const body = await request.json();
    const { email, firstName, lastName, phone, roles, branchId, orgId } = body;

    if (!email || !orgId) {
      return NextResponse.json({ error: 'E-posta ve Organizasyon ID zorunludur.' }, { status: 400 });
    }

    // 2. Rol Yetki Denetimi: İsteği atan kullanıcı bu organizasyonun "Firma Yöneticisi" mi veya Platform Admin mi?
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    // Platform admin kontrolü
    const { data: adminData } = await supabaseAdmin
      .from('platform_admins')
      .select('user_id')
      .eq('user_id', requesterUser.id)
      .maybeSingle();

    const isPlatformAdmin = !!adminData;

    if (!isPlatformAdmin) {
      // Firma Yöneticisi yetki kontrolü
      const { data: membership } = await supabaseAdmin
        .from('memberships')
        .select('roles, status')
        .eq('user_id', requesterUser.id)
        .eq('organization_id', orgId)
        .eq('status', 'active')
        .maybeSingle();

      const isOrgManager = membership?.roles?.includes('Firma Yöneticisi');

      if (!isOrgManager) {
        return NextResponse.json({ 
          error: 'Yetkisiz işlem. Kullanıcı davet etme yetkisi sadece Firma Yöneticisi veya Platform Yöneticisine aittir.' 
        }, { status: 403 });
      }
    }

    // 3. Supabase Auth Admin SDK ile Güvenli Kullanıcı Daveti / Hesabı (auth.users + auth.identities)
    let invitedUserId: string;

    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    const foundUser = existingUsers?.users?.find(u => u.email?.toLowerCase() === email.toLowerCase().trim());

    if (foundUser) {
      invitedUserId = foundUser.id;
    } else {
      const { data: newAuthUser, error: createErr } = await supabaseAdmin.auth.admin.createUser({
        email: email.toLowerCase().trim(),
        email_confirm: true,
        user_metadata: {
          first_name: firstName || '',
          last_name: lastName || '',
          phone: phone || ''
        },
        app_metadata: {
          organization_id: orgId
        }
      });

      if (createErr || !newAuthUser.user) {
        throw new Error(`Kullanıcı hesabı oluşturulamadı: ${createErr?.message}`);
      }

      invitedUserId = newAuthUser.user.id;
    }

    // 4. Profiles tablosuna profil verisini işleme
    await supabaseAdmin.from('profiles').upsert({
      id: invitedUserId,
      first_name: firstName || '',
      last_name: lastName || '',
      phone: phone || ''
    });

    // 5. Memberships tablosuna ilişkili organizasyon kaydı ekleme
    const { data: memData, error: memErr } = await supabaseAdmin
      .from('memberships')
      .upsert({
        user_id: invitedUserId,
        organization_id: orgId,
        roles: roles || ['Odyometrist'],
        branch_id: branchId || null,
        status: 'active',
        first_name: firstName || '',
        last_name: lastName || '',
        email: email.toLowerCase().trim(),
        phone: phone || ''
      }, { onConflict: 'user_id, organization_id' })
      .select('id, joined_at');

    if (memErr) {
      throw new Error(`Üyelik kaydı oluşturulamadı: ${memErr.message}`);
    }

    return NextResponse.json({
      success: true,
      user: {
        id: memData?.[0]?.id || invitedUserId,
        userId: invitedUserId,
        firstName,
        lastName,
        email: email.toLowerCase().trim(),
        phone,
        roles: roles || ['Odyometrist'],
        branch: 'Tüm Şubeler',
        status: 'Aktif',
        createdAt: memData?.[0]?.joined_at ? new Date(memData[0].joined_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
      }
    });

  } catch (err: any) {
    console.error('Invite API secure route error:', err);
    return NextResponse.json({ error: err.message || 'Sunucu hatası' }, { status: 500 });
  }
}
