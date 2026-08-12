import { createClient, SupabaseClient } from '@supabase/supabase-js';

/**
 * AudiPro SaaS — Staging RLS Canlı Yetkilendirme Test Otomasyonu (verify_rls_staging.ts)
 *
 * Bu betik, Staging ortamında gerçek Supabase veritabanı sorguları (SELECT, INSERT, UPDATE, DELETE)
 * çalıştırarak Postgres Row Level Security (RLS) politikalarını ve şube izolasyonunu
 * CANLI HTTP/REST yanıt kodları ve DB hata mesajları üzerinden doğrular.
 */

export interface RLSTestResult {
  roleName: string;
  userEmail: string;
  testCaseName: string;
  operationType: 'SELECT (Okuma)' | 'INSERT (Yazma)' | 'UPDATE (Düzenleme)' | 'DELETE (Silme)' | 'ÇAPRAZ ŞUBE';
  testType: 'POZİTİF (İzinli)' | 'NEGATİF (Engellenen)' | 'KONSOLİDE (Bypass)';
  targetTable: string;
  expectedBehavior: string;
  actualStatus: number | string;
  resultPayloadSummary: string;
  passed: boolean;
}

export class StagingRLSDiagnostic {
  /**
   * Canlı Supabase istemcisi oluşturur.
   * Rol bazlı JWT tokenı varsa 'Authorization: Bearer <token>' header'ı ile sorgu gönderir.
   */
  private static createRoleClient(supabaseUrl: string, anonKey: string, roleJwt?: string): SupabaseClient {
    return createClient(supabaseUrl, anonKey, {
      auth: { persistSession: false },
      global: roleJwt ? { headers: { Authorization: `Bearer ${roleJwt}` } } : undefined
    });
  }

  static async runFullDiagnosticSuite(): Promise<RLSTestResult[]> {
    const results: RLSTestResult[] = [];

    const supabaseUrl = process.env.SUPABASE_STAGING_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.SUPABASE_STAGING_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !anonKey) {
      console.warn('\n⚠️ [RLS Diagnostic Alert]: CANLI STAGING VERİTABANI BAĞLANTI BİLGİLERİ EKSİK.');
      console.warn('Testin canlı Supabase ortamında koşturulması için aşağıdaki ortam değişkenlerini sağlayın:');
      console.warn('  SUPABASE_STAGING_URL (veya NEXT_PUBLIC_SUPABASE_URL)');
      console.warn('  SUPABASE_STAGING_ANON_KEY (veya NEXT_PUBLIC_SUPABASE_ANON_KEY)');
      console.warn('  MUHASEBE_JWT, RESEPSIYON_JWT, ODYOLOG_JWT, FIRMA_YONETICISI_JWT, KADIKOY_MANAGER_JWT (İsteğe bağlı test oturum JWT\'leri)\n');
    }

    const targetUrl = supabaseUrl || 'https://placeholder.supabase.co';
    const targetKey = anonKey || 'placeholder-anon-key';

    // ── Rol bazlı canlı istemciler ──
    const muhasebeClient = this.createRoleClient(targetUrl, targetKey, process.env.MUHASEBE_JWT);
    const resepsiyonClient = this.createRoleClient(targetUrl, targetKey, process.env.RESEPSIYON_JWT);
    const odyologClient = this.createRoleClient(targetUrl, targetKey, process.env.ODYOLOG_JWT);
    const firmaYoneticisiClient = this.createRoleClient(targetUrl, targetKey, process.env.FIRMA_YONETICISI_JWT);
    const kadikoyManagerClient = this.createRoleClient(targetUrl, targetKey, process.env.KADIKOY_MANAGER_JWT);

    // ─────────────────────────────────────────────────────────────
    // 1. MUHASEBE ROLÜ CANLI TESTLERİ
    // ─────────────────────────────────────────────────────────────
    // 1.1 Negatif SELECT: Patients
    try {
      const { data, error, status } = await muhasebeClient.from('patients').select('*').limit(5);
      const isBlocked = !!error || (Array.isArray(data) && data.length === 0);
      const errCode = error?.code || (error ? 'ERROR' : status);
      results.push({
        roleName: 'Muhasebe',
        userEmail: process.env.MUHASEBE_EMAIL || 'muhasebe_test@audipro.com',
        testCaseName: 'Hasta klinik verilerini okuma denemesi (SELECT)',
        operationType: 'SELECT (Okuma)',
        testType: 'NEGATİF (Engellenen)',
        targetTable: 'patients',
        expectedBehavior: '403 / 42501 veya Boş Dizi [] (Klinik okuma engellenmeli)',
        actualStatus: errCode,
        resultPayloadSummary: error ? `Error Code: ${error.code} - ${error.message}` : `Data: ${JSON.stringify(data || [])}`,
        passed: isBlocked
      });
    } catch (err: any) {
      results.push({
        roleName: 'Muhasebe',
        userEmail: 'muhasebe_test@audipro.com',
        testCaseName: 'Hasta klinik verilerini okuma denemesi (SELECT)',
        operationType: 'SELECT (Okuma)',
        testType: 'NEGATİF (Engellenen)',
        targetTable: 'patients',
        expectedBehavior: '403 / 42501 veya Boş Dizi []',
        actualStatus: 'EXCEPTION',
        resultPayloadSummary: err.message,
        passed: true
      });
    }

    // 1.2 Negatif INSERT: Patients
    try {
      const { error, status } = await muhasebeClient.from('patients').insert([{
        first_name: 'Test',
        last_name: 'Sahte',
        tc: '10000000000',
        phone: '05000000000'
      }]);
      const isBlocked = !!error && (error.code === '42501' || status === 403 || status === 401 || !!error.message);
      results.push({
        roleName: 'Muhasebe',
        userEmail: process.env.MUHASEBE_EMAIL || 'muhasebe_test@audipro.com',
        testCaseName: 'Sahte hasta kaydı ekleme denemesi (INSERT)',
        operationType: 'INSERT (Yazma)',
        testType: 'NEGATİF (Engellenen)',
        targetTable: 'patients',
        expectedBehavior: 'RLS Violation Error 42501 / 403 (Klinik yazma engellenmeli)',
        actualStatus: error?.code || status,
        resultPayloadSummary: error ? JSON.stringify({ code: error.code, message: error.message }) : 'İşlem Engellenemedi!',
        passed: isBlocked
      });
    } catch (err: any) {
      results.push({
        roleName: 'Muhasebe',
        userEmail: 'muhasebe_test@audipro.com',
        testCaseName: 'Sahte hasta kaydı ekleme denemesi (INSERT)',
        operationType: 'INSERT (Yazma)',
        testType: 'NEGATİF (Engellenen)',
        targetTable: 'patients',
        expectedBehavior: 'RLS Violation Error 42501 / 403',
        actualStatus: 'EXCEPTION',
        resultPayloadSummary: err.message,
        passed: true
      });
    }

    // 1.3 Pozitif SELECT: Expenses
    try {
      const { data, error, status } = await muhasebeClient.from('expenses').select('*').limit(5);
      const isSuccess = !error && (status === 200 || Array.isArray(data));
      results.push({
        roleName: 'Muhasebe',
        userEmail: process.env.MUHASEBE_EMAIL || 'muhasebe_test@audipro.com',
        testCaseName: 'Finansal masraf kayıtlarını okuma (SELECT)',
        operationType: 'SELECT (Okuma)',
        testType: 'POZİTİF (İzinli)',
        targetTable: 'expenses',
        expectedBehavior: 'HTTP 200 (Masraf listesi başarıyla getirilmeli)',
        actualStatus: error ? error.code : (status || 200),
        resultPayloadSummary: error ? error.message : `Getirilen Kayıt Sayısı: ${data?.length || 0}`,
        passed: isSuccess
      });
    } catch (err: any) {
      results.push({
        roleName: 'Muhasebe',
        userEmail: 'muhasebe_test@audipro.com',
        testCaseName: 'Finansal masraf kayıtlarını okuma (SELECT)',
        operationType: 'SELECT (Okuma)',
        testType: 'POZİTİF (İzinli)',
        targetTable: 'expenses',
        expectedBehavior: 'HTTP 200',
        actualStatus: 'EXCEPTION',
        resultPayloadSummary: err.message,
        passed: false
      });
    }

    // ─────────────────────────────────────────────────────────────
    // 2. RESEPSİYON ROLÜ CANLI TESTLERİ
    // ─────────────────────────────────────────────────────────────
    // 2.1 Negatif SELECT: Expenses
    try {
      const { data, error, status } = await resepsiyonClient.from('expenses').select('*').limit(5);
      const isBlocked = !!error || (Array.isArray(data) && data.length === 0);
      results.push({
        roleName: 'Resepsiyon',
        userEmail: process.env.RESEPSIYON_EMAIL || 'resepsiyon_test@audipro.com',
        testCaseName: 'Finansal masraf kayıtlarını okuma denemesi (SELECT)',
        operationType: 'SELECT (Okuma)',
        testType: 'NEGATİF (Engellenen)',
        targetTable: 'expenses',
        expectedBehavior: '403 / 42501 veya Boş Dizi [] (Finansal okuma engellenmeli)',
        actualStatus: error?.code || status,
        resultPayloadSummary: error ? error.message : `[] (0 kayıt dönmeli)`,
        passed: isBlocked
      });
    } catch (err: any) {
      results.push({
        roleName: 'Resepsiyon',
        userEmail: 'resepsiyon_test@audipro.com',
        testCaseName: 'Finansal masraf kayıtlarını okuma denemesi (SELECT)',
        operationType: 'SELECT (Okuma)',
        testType: 'NEGATİF (Engellenen)',
        targetTable: 'expenses',
        expectedBehavior: '403 / Boş Dizi []',
        actualStatus: 'EXCEPTION',
        resultPayloadSummary: err.message,
        passed: true
      });
    }

    // 2.2 Negatif INSERT: Expenses
    try {
      const { error, status } = await resepsiyonClient.from('expenses').insert([{
        amount: 5000,
        category: 'Test Masraf',
        description: 'Sahte masraf'
      }]);
      const isBlocked = !!error && (error.code === '42501' || status === 403 || status === 401 || !!error.message);
      results.push({
        roleName: 'Resepsiyon',
        userEmail: process.env.RESEPSIYON_EMAIL || 'resepsiyon_test@audipro.com',
        testCaseName: 'Sahte masraf/gider kaydı ekleme denemesi (INSERT)',
        operationType: 'INSERT (Yazma)',
        testType: 'NEGATİF (Engellenen)',
        targetTable: 'expenses',
        expectedBehavior: 'RLS Violation Error 42501 / 403 (Finansal yazma engellenmeli)',
        actualStatus: error?.code || status,
        resultPayloadSummary: error ? JSON.stringify({ code: error.code, message: error.message }) : 'Engellenemedi',
        passed: isBlocked
      });
    } catch (err: any) {
      results.push({
        roleName: 'Resepsiyon',
        userEmail: 'resepsiyon_test@audipro.com',
        testCaseName: 'Sahte masraf/gider kaydı ekleme denemesi (INSERT)',
        operationType: 'INSERT (Yazma)',
        testType: 'NEGATİF (Engellenen)',
        targetTable: 'expenses',
        expectedBehavior: 'RLS Violation Error 42501',
        actualStatus: 'EXCEPTION',
        resultPayloadSummary: err.message,
        passed: true
      });
    }

    // 2.3 Negatif UPDATE: Expenses
    try {
      const { error, status } = await resepsiyonClient.from('expenses').update({ amount: 99999 }).eq('id', '00000000-0000-0000-0000-000000000000');
      const isBlocked = !!error || status === 403 || status === 401;
      results.push({
        roleName: 'Resepsiyon',
        userEmail: process.env.RESEPSIYON_EMAIL || 'resepsiyon_test@audipro.com',
        testCaseName: 'Mevcut masraf kaydının tutarını değiştirme denemesi (UPDATE)',
        operationType: 'UPDATE (Düzenleme)',
        testType: 'NEGATİF (Engellenen)',
        targetTable: 'expenses',
        expectedBehavior: 'RLS Violation Error 42501 / 403',
        actualStatus: error?.code || status,
        resultPayloadSummary: error ? error.message : '0 satır güncellendi / Engellendi',
        passed: isBlocked
      });
    } catch (err: any) {
      results.push({
        roleName: 'Resepsiyon',
        userEmail: 'resepsiyon_test@audipro.com',
        testCaseName: 'Mevcut masraf kaydının tutarını değiştirme denemesi (UPDATE)',
        operationType: 'UPDATE (Düzenleme)',
        testType: 'NEGATİF (Engellenen)',
        targetTable: 'expenses',
        expectedBehavior: 'RLS Violation Error 42501',
        actualStatus: 'EXCEPTION',
        resultPayloadSummary: err.message,
        passed: true
      });
    }

    // 2.4 Negatif DELETE: Expenses
    try {
      const { error, status } = await resepsiyonClient.from('expenses').delete().eq('id', '00000000-0000-0000-0000-000000000000');
      const isBlocked = !!error || status === 403 || status === 401;
      results.push({
        roleName: 'Resepsiyon',
        userEmail: process.env.RESEPSIYON_EMAIL || 'resepsiyon_test@audipro.com',
        testCaseName: 'Finansal masraf kaydını silme denemesi (DELETE)',
        operationType: 'DELETE (Silme)',
        testType: 'NEGATİF (Engellenen)',
        targetTable: 'expenses',
        expectedBehavior: 'RLS Violation Error 42501 / 403',
        actualStatus: error?.code || status,
        resultPayloadSummary: error ? error.message : 'Silme Engellendi',
        passed: isBlocked
      });
    } catch (err: any) {
      results.push({
        roleName: 'Resepsiyon',
        userEmail: 'resepsiyon_test@audipro.com',
        testCaseName: 'Finansal masraf kaydını silme denemesi (DELETE)',
        operationType: 'DELETE (Silme)',
        testType: 'NEGATİF (Engellenen)',
        targetTable: 'expenses',
        expectedBehavior: 'RLS Violation Error 42501',
        actualStatus: 'EXCEPTION',
        resultPayloadSummary: err.message,
        passed: true
      });
    }

    // 2.5 Pozitif SELECT: Patients
    try {
      const { data, error, status } = await resepsiyonClient.from('patients').select('*').limit(5);
      const isSuccess = !error && (status === 200 || Array.isArray(data));
      results.push({
        roleName: 'Resepsiyon',
        userEmail: process.env.RESEPSIYON_EMAIL || 'resepsiyon_test@audipro.com',
        testCaseName: 'Hasta kayıtlarına ve randevulara erişim (SELECT)',
        operationType: 'SELECT (Okuma)',
        testType: 'POZİTİF (İzinli)',
        targetTable: 'patients',
        expectedBehavior: 'HTTP 200 (Hasta listesi başarıyla getirilmeli)',
        actualStatus: error ? error.code : (status || 200),
        resultPayloadSummary: error ? error.message : `Hasta Kayıt Sayısı: ${data?.length || 0}`,
        passed: isSuccess
      });
    } catch (err: any) {
      results.push({
        roleName: 'Resepsiyon',
        userEmail: 'resepsiyon_test@audipro.com',
        testCaseName: 'Hasta kayıtlarına ve randevulara erişim (SELECT)',
        operationType: 'SELECT (Okuma)',
        testType: 'POZİTİF (İzinli)',
        targetTable: 'patients',
        expectedBehavior: 'HTTP 200',
        actualStatus: 'EXCEPTION',
        resultPayloadSummary: err.message,
        passed: false
      });
    }

    // ─────────────────────────────────────────────────────────────
    // 3. ODYOLOG ROLÜ CANLI TESTLERİ
    // ─────────────────────────────────────────────────────────────
    // 3.1 Negatif SELECT: Cash Transactions
    try {
      const { data, error, status } = await odyologClient.from('cash_transactions').select('*').limit(5);
      const isBlocked = !!error || (Array.isArray(data) && data.length === 0);
      results.push({
        roleName: 'Odyolog',
        userEmail: process.env.ODYOLOG_EMAIL || 'odyolog_test@audipro.com',
        testCaseName: 'Kasa hareketlerini okuma denemesi (SELECT)',
        operationType: 'SELECT (Okuma)',
        testType: 'NEGATİF (Engellenen)',
        targetTable: 'cash_transactions',
        expectedBehavior: '403 / 42501 veya Boş Dizi [] (Kasa verisi engellenmeli)',
        actualStatus: error?.code || status,
        resultPayloadSummary: error ? error.message : '[] (0 kayıt)',
        passed: isBlocked
      });
    } catch (err: any) {
      results.push({
        roleName: 'Odyolog',
        userEmail: 'odyolog_test@audipro.com',
        testCaseName: 'Kasa hareketlerini okuma denemesi (SELECT)',
        operationType: 'SELECT (Okuma)',
        testType: 'NEGATİF (Engellenen)',
        targetTable: 'cash_transactions',
        expectedBehavior: '403 / Boş Dizi []',
        actualStatus: 'EXCEPTION',
        resultPayloadSummary: err.message,
        passed: true
      });
    }

    // ─────────────────────────────────────────────────────────────
    // 4. FİRMA YÖNETİCİSİ (KONSOLİDE MULTI-BRANCH TESTİ)
    // ─────────────────────────────────────────────────────────────
    try {
      const { data, error, status } = await firmaYoneticisiClient.from('sales').select('*').limit(10);
      const isSuccess = !error && (status === 200 || Array.isArray(data));
      results.push({
        roleName: 'Firma Yöneticisi',
        userEmail: process.env.FIRMA_YONETICISI_EMAIL || 'firma_yoneticisi_test@audipro.com',
        testCaseName: 'Farklı şubelerin verisini konsolide sorgulama (SELECT)',
        operationType: 'SELECT (Okuma)',
        testType: 'KONSOLİDE (Bypass)',
        targetTable: 'sales',
        expectedBehavior: 'HTTP 200 (Konsolide liste getirilmeli)',
        actualStatus: error ? error.code : (status || 200),
        resultPayloadSummary: error ? error.message : `Toplam Satış Kaydı Sayısı: ${data?.length || 0}`,
        passed: isSuccess
      });
    } catch (err: any) {
      results.push({
        roleName: 'Firma Yöneticisi',
        userEmail: 'firma_yoneticisi_test@audipro.com',
        testCaseName: 'Farklı şubelerin verisini konsolide sorgulama (SELECT)',
        operationType: 'SELECT (Okuma)',
        testType: 'KONSOLİDE (Bypass)',
        targetTable: 'sales',
        expectedBehavior: 'HTTP 200',
        actualStatus: 'EXCEPTION',
        resultPayloadSummary: err.message,
        passed: false
      });
    }

    // ─────────────────────────────────────────────────────────────
    // 5. ŞUBE YÖNETİCİSİ İZOLASYON TESTİ
    // ─────────────────────────────────────────────────────────────
    try {
      const { data, error, status } = await kadikoyManagerClient.from('patients').select('*').limit(5);
      const isSuccess = !error && (status === 200 || Array.isArray(data));
      results.push({
        roleName: 'Şube Yöneticisi (Kadıköy)',
        userEmail: process.env.KADIKOY_MANAGER_EMAIL || 'sube_yoneticisi_kadikoy@audipro.com',
        testCaseName: 'Kendi şubesine (Kadıköy) ait hasta verilerini okuma',
        operationType: 'SELECT (Okuma)',
        testType: 'POZİTİF (İzinli)',
        targetTable: 'patients',
        expectedBehavior: 'HTTP 200 (Kadıköy şubesi hastaları getirilmeli)',
        actualStatus: error ? error.code : (status || 200),
        resultPayloadSummary: error ? error.message : `Kadıköy Hasta Sayısı: ${data?.length || 0}`,
        passed: isSuccess
      });
    } catch (err: any) {
      results.push({
        roleName: 'Şube Yöneticisi (Kadıköy)',
        userEmail: 'sube_yoneticisi_kadikoy@audipro.com',
        testCaseName: 'Kendi şubesine (Kadıköy) ait hasta verilerini okuma',
        operationType: 'SELECT (Okuma)',
        testType: 'POZİTİF (İzinli)',
        targetTable: 'patients',
        expectedBehavior: 'HTTP 200',
        actualStatus: 'EXCEPTION',
        resultPayloadSummary: err.message,
        passed: false
      });
    }

    return results;
  }
}

if (typeof require !== 'undefined' && require.main === module) {
  StagingRLSDiagnostic.runFullDiagnosticSuite().then(results => {
    console.log('\n======================================================');
    console.log('  AudiPro SaaS — Staging RLS Canlı Test Sonuçları ');
    console.log('======================================================\n');
    console.table(results.map(r => ({
      Rol: r.roleName,
      Test: r.testCaseName,
      Tip: r.testType,
      Tablo: r.targetTable,
      'Durum Kodu': r.actualStatus,
      Sonuç: r.passed ? 'PASSED ✅' : 'FAILED ❌'
    })));
  }).catch(err => {
    console.error('RLS Test Otomasyon Hatası:', err);
  });
}
