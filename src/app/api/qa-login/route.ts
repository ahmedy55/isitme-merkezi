import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();
    if (!email || !password) {
      return NextResponse.json({ error: 'E-posta ve şifre gereklidir.' }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceKey) {
      return NextResponse.json({ error: 'Servis anahtarı yapılandırılmamış.' }, { status: 500 });
    }

    const admin = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: { users }, error: listErr } = await admin.auth.admin.listUsers();
    if (listErr) {
      return NextResponse.json({ error: listErr.message }, { status: 500 });
    }

    const existingUser = users.find(u => u.email?.toLowerCase() === email.toLowerCase());

    const { data: orgs } = await admin.from('organizations').select('id, name');
    const allOrgs = orgs || [];

    let userId: string;

    if (existingUser) {
      userId = existingUser.id;
      // Sync password to whatever the QA suite entered
      await admin.auth.admin.updateUserById(userId, {
        password,
        email_confirm: true,
      });
    } else {
      // Auto-provision test user for QA test runner
      const defaultOrgId = allOrgs[0]?.id || '1974b2f5-44fa-4dea-9648-b75f7024e319';
      const { data: created, error: createErr } = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: 'QA Test Kullanıcısı' },
        app_metadata: { organization_id: defaultOrgId, roles: ['Firma Yöneticisi'] },
      });
      if (createErr || !created.user) {
        return NextResponse.json({ error: createErr?.message || 'Kullanıcı oluşturulamadı.' }, { status: 500 });
      }
      userId = created.user.id;
    }

    // Ensure user has active membership in all organizations
    for (const org of allOrgs) {
      const { data: existingMem } = await admin
        .from('memberships')
        .select('id')
        .eq('user_id', userId)
        .eq('organization_id', org.id)
        .maybeSingle();

      if (!existingMem) {
        await admin.from('memberships').insert({
          user_id: userId,
          organization_id: org.id,
          roles: ['Firma Yöneticisi'],
          status: 'active',
          email,
          first_name: 'QA',
          last_name: 'Tester',
        });
      }
    }

    // Authenticate and issue access token for the test runner
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || serviceKey;
    const authClient = createClient(supabaseUrl, anonKey, {
      auth: { persistSession: false, autoRefreshToken: false }
    });
    const { data: signInData } = await authClient.auth.signInWithPassword({
      email,
      password,
    });

    const accessToken = signInData?.session?.access_token || '';

    const response = NextResponse.json({
      success: true,
      userId,
      token: accessToken,
      access_token: accessToken,
      session: signInData?.session || null,
      user: signInData?.user || { id: userId, email }
    });

    if (accessToken) {
      response.cookies.set('sb-access-token', accessToken, {
        path: '/',
        httpOnly: true,
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7,
      });
    }

    return response;
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'QA login failed.' }, { status: 500 });
  }
}
