import { NextResponse } from 'next/server';
import { Client } from 'pg';

const connectionString = 'postgresql://postgres.znktitzknixpbakfrnzk:AudiProDbPass2026!%23@aws-0-eu-central-1.pooler.supabase.com:5432/postgres';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, firstName, lastName, phone, roles, branchId, orgId } = body;

    if (!email || !orgId) {
      return NextResponse.json({ error: 'E-posta ve Organizasyon ID zorunludur.' }, { status: 400 });
    }

    const client = new Client({
      connectionString,
      ssl: { rejectUnauthorized: false }
    });

    await client.connect();

    try {
      // 1. auth.users içinde kullanıcı var mı kontrol et
      let userRes = await client.query('SELECT id FROM auth.users WHERE email = $1', [email.toLowerCase().trim()]);
      let userId = userRes.rows[0]?.id;

      // 2. Kullanıcı yoksa auth.users tablosunda yeni yetkili kullanıcı hesabı oluştur
      if (!userId) {
        const insertUserSql = `
          INSERT INTO auth.users (
            instance_id, id, aud, role, email, encrypted_password, 
            email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at
          ) VALUES (
            '00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', $1,
            crypt('AudiPro123!', gen_salt('bf')), NOW(),
            json_build_object('provider','email','providers',ARRAY['email'],'organization_id',$5),
            json_build_object('first_name', $2, 'last_name', $3, 'phone', $4),
            NOW(), NOW()
          ) RETURNING id;
        `;
        const newUserRes = await client.query(insertUserSql, [
          email.toLowerCase().trim(), 
          firstName || '', 
          lastName || '', 
          phone || '',
          orgId
        ]);
        userId = newUserRes.rows[0]?.id;
      }

      // 3. Profiles tablosuna profil bilgisi ekle
      await client.query(`
        INSERT INTO public.profiles (id, first_name, last_name, phone)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (id) DO UPDATE SET
          first_name = EXCLUDED.first_name,
          last_name = EXCLUDED.last_name,
          phone = EXCLUDED.phone;
      `, [userId, firstName || '', lastName || '', phone || '']);

      // 4. Memberships kaydı ekle
      const memRes = await client.query(`
        INSERT INTO memberships (user_id, organization_id, roles, branch_id, status, first_name, last_name, email, phone)
        VALUES ($1, $2, $3, $4, 'active', $5, $6, $7, $8)
        ON CONFLICT (user_id, organization_id) DO UPDATE SET
          roles = EXCLUDED.roles,
          first_name = EXCLUDED.first_name,
          last_name = EXCLUDED.last_name,
          phone = EXCLUDED.phone,
          status = 'active'
        RETURNING id, joined_at;
      `, [
        userId, 
        orgId, 
        roles || ['Odyometrist'], 
        branchId || null, 
        firstName || '', 
        lastName || '', 
        email.toLowerCase().trim(), 
        phone || ''
      ]);

      const mem = memRes.rows[0];

      return NextResponse.json({
        success: true,
        user: {
          id: mem.id,
          userId,
          firstName,
          lastName,
          email: email.toLowerCase().trim(),
          phone,
          roles: roles || ['Odyometrist'],
          branch: 'Tüm Şubeler',
          status: 'Aktif',
          createdAt: mem.joined_at ? new Date(mem.joined_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
        }
      });
    } finally {
      await client.end();
    }
  } catch (err: any) {
    console.error('Invite API error:', err);
    return NextResponse.json({ error: err.message || 'Davet oluşturulamadı' }, { status: 500 });
  }
}
