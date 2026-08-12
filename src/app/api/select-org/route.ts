import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl) {
      return NextResponse.json({ success: false, error: 'Güvenlik Hatası: NEXT_PUBLIC_SUPABASE_URL ortam değişkeni yapılandırılmamış.' }, { status: 500 });
    }

    if (!supabaseServiceKey) {
      return NextResponse.json({ success: false, error: 'Güvenlik Hatası: SUPABASE_SERVICE_ROLE_KEY yapılandırılmamış.' }, { status: 500 });
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

    const { data: { user }, error: authErr } = await supabaseUserClient.auth.getUser(token);

    if (authErr || !user) {
      return NextResponse.json({ error: 'Geçersiz veya süresi dolmuş oturum.' }, { status: 401 });
    }

    const body = await request.json();
    const { orgId } = body;

    if (!orgId) {
      return NextResponse.json({ error: 'Organizasyon ID (orgId) zorunludur.' }, { status: 400 });
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    // 2. Kullanıcının gerçekten bu organizasyona üye olup olmadığını veya platform admin olduğunu doğrula
    const { data: adminData } = await supabaseAdmin
      .from('platform_admins')
      .select('user_id')
      .eq('user_id', user.id)
      .maybeSingle();

    const isPlatformAdmin = !!adminData;

    if (!isPlatformAdmin) {
      const { data: membership } = await supabaseAdmin
        .from('memberships')
        .select('id, status')
        .eq('user_id', user.id)
        .eq('organization_id', orgId)
        .eq('status', 'active')
        .maybeSingle();

      if (!membership) {
        return NextResponse.json({ error: 'Bu organizasyona aktif üyelik erişiminiz bulunmamaktadır.' }, { status: 403 });
      }
    }

    // 3. Server-side Supabase Admin SDK ile app_metadata.organization_id güncellenmesi
    const { error: updateErr } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
      app_metadata: {
        ...user.app_metadata,
        organization_id: orgId
      }
    });

    if (updateErr) {
      throw new Error(`JWT app_metadata organizasyon ID'si güncellenemedi: ${updateErr.message}`);
    }

    return NextResponse.json({
      success: true,
      orgId
    });

  } catch (err: any) {
    console.error('Select org API error:', err);
    return NextResponse.json({ error: err.message || 'Sunucu hatası' }, { status: 500 });
  }
}
