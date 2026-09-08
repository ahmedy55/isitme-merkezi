import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { checkRateLimit, validateBody, InviteUserSchema } from '../../lib/apiSecurity';

export async function POST(request: NextRequest) {
  const rateError=checkRateLimit(request,{maxRequests:10});
  if(rateError) return rateError;
  try {
    const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key=process.env.SUPABASE_SERVICE_ROLE_KEY;
    if(!url || !key) return NextResponse.json({error:'Sunucu yapılandırması eksik.'},{status:500});
    const token=request.headers.get('authorization')?.match(/^Bearer (.+)$/i)?.[1];
    if(!token) return NextResponse.json({error:'Oturum gerekli.'},{status:401});
    const admin=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
    const {data:{user},error:authError}=await admin.auth.getUser(token);
    if(authError || !user) return NextResponse.json({error:'Geçersiz oturum.'},{status:401});
    const {data:body,error:validationError}=await validateBody(request,InviteUserSchema);
    if(validationError) return validationError;
    const {orgId,branchId,roles,email,password,firstName,lastName,phone}=body;
    const {data:member,error:memberError}=await admin.from('memberships').select('roles')
      .eq('user_id',user.id).eq('organization_id',orgId).eq('status','active').maybeSingle();
    if(memberError || !member?.roles.includes('Firma Yöneticisi')) return NextResponse.json({error:'Firma yöneticisi yetkisi gerekli.'},{status:403});
    const {data:org,error:orgError}=await admin.from('organizations').select('subscription_status,plan_type,trial_ends_at').eq('id',orgId).single();
    if(orgError || !org || org.subscription_status!=='active' || (org.plan_type==='trial' && org.trial_ends_at && Date.parse(org.trial_ends_at)<=Date.now())) return NextResponse.json({error:'Firma lisansı aktif değil.'},{status:403});
    if(!branchId && !roles.includes('Firma Yöneticisi')) return NextResponse.json({error:'Personel için bir şube seçilmelidir.'},{status:400});
    if(branchId){
      const {data:branch,error}=await admin.from('branches').select('id').eq('id',branchId).eq('organization_id',orgId).eq('status','active').maybeSingle();
      if(error || !branch) return NextResponse.json({error:'Geçersiz şube.'},{status:400});
    }
    // Never reuse a different tenant's Auth account or mutate its profile.
    const {data:created,error:createError}=await admin.auth.admin.createUser({
      email:email.trim().toLowerCase(),password,email_confirm:true,
      app_metadata:{organization_id:orgId,branch_id:branchId || null,roles},
      user_metadata:{first_name:firstName || '',last_name:lastName || ''},
    });
    if(createError || !created.user) return NextResponse.json({error:'Hesap oluşturulamadı. E-posta kullanımda olabilir.'},{status:409});
    const uid=created.user.id;
    const {data:membership,error:provisionError}=await admin.rpc('provision_member',{
      p_actor:user.id,p_org:orgId,p_user:uid,p_branch:branchId || null,p_roles:roles,
      p_email:email.trim().toLowerCase(),p_first:firstName || '',p_last:lastName || '',p_phone:phone || '',
    });
    if(provisionError || !membership){
      if (!provisionError?.code || !/^(22|23|P0)/.test(provisionError.code)) {
        console.error('Provisioning reconciliation required',uid);
        return NextResponse.json({error:'İşlem sonucu belirsiz; tekrar denemeden yönetici üyelik kaydını kontrol etmelidir.'},{status:503});
      }
      const {error:cleanupError}=await admin.auth.admin.deleteUser(uid);
      if(cleanupError) console.error('Unlinked Auth account requires cleanup',uid);
      return NextResponse.json({error:'Üyelik oluşturulamadı; firma limitini ve şube atamasını kontrol edin.'},{status:409});
    }
    return NextResponse.json({success:true,user:{id:membership.id,userId:uid,firstName,lastName,email,phone,roles,branchId,branch:branchId || 'Tüm Şubeler',status:'Aktif',createdAt:membership.joined_at.split('T')[0]}});
  } catch {return NextResponse.json({error:'Kullanıcı oluşturma işlemi tamamlanamadı.'},{status:500});}
}
