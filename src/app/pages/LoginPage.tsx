import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { supabase } from '../lib/supabase';

export default function LoginPage() {
  const { setCurrentPage, addToast } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      addToast({ type: 'warning', message: 'Lütfen e-posta ve şifrenizi girin.' });
      return;
    }

    setLoading(true);
    try {
      const { data: { session }, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      if (!session) throw new Error('Oturum başlatılamadı.');

      // memberships tablosunu sorgula (Kullanıcı hangi firmalara bağlı?)
      const { data: userOrgs, error: orgsError } = await supabase
        .from('memberships')
        .select('organization_id, status, organizations(name)')
        .eq('user_id', session.user.id);

      if (orgsError) throw orgsError;

      const activeOrgs = userOrgs?.filter(o => o.status === 'active') || [];

      if (activeOrgs.length === 0) {
        // Platform admin mi kontrol et
        const { data: isAdmin } = await supabase
          .from('platform_admins')
          .select('id')
          .eq('user_id', session.user.id)
          .single();

        if (isAdmin) {
          // Platform admin ise, organization_id NULL kalır ama platform yetkisi var
          addToast({ type: 'success', message: 'Platform Yöneticisi olarak giriş yapıldı.' });
          setCurrentPage('dashboard');
          return;
        }

        // Aktif üyeliği yoksa çıkış yap ve uyarı ver
        await supabase.auth.signOut();
        addToast({ type: 'error', message: 'Bu hesaba tanımlı aktif bir klinik üyeliği bulunamadı.' });
        return;
      }

      if (activeOrgs.length === 1) {
        const orgId = activeOrgs[0].organization_id;
        const orgName = (activeOrgs[0].organizations as any)?.name || 'Klinik';

        // Server-side /api/select-org ile app_metadata.organization_id'yi yaz
        const res = await fetch('/api/select-org', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`
          },
          body: JSON.stringify({ orgId })
        });

        if (!res.ok) {
          const errData = await res.json();
          console.error('Server app_metadata orgId update error:', errData);
        }

        // Token cache'ini yenile (Bölüm 5.4 - refreshSession)
        await supabase.auth.refreshSession();

        addToast({ type: 'success', message: `Hoş geldiniz! ${orgName} oturumu açıldı.` });
        setCurrentPage('dashboard');
      } else {
        // 2+ aktif organizasyonu varsa seçim ekranına yönlendir
        setCurrentPage('org-select');
      }
    } catch (err: any) {
      addToast({
        type: 'error',
        message: err.message || 'Giriş yapılırken bir hata oluştu. Lütfen bilgilerinizi kontrol edin.'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'radial-gradient(circle at 10% 20%, rgba(6, 26, 23, 1) 0%, rgba(12, 16, 15, 1) 90%)',
      padding: 20,
      fontFamily: 'var(--font-sans, "Outfit", sans-serif)'
    }}>
      {/* Arka plan partikül/gradient halkaları */}
      <div style={{
        position: 'absolute',
        width: 350,
        height: 350,
        borderRadius: '50%',
        background: 'rgba(31, 96, 89, 0.12)',
        filter: 'blur(80px)',
        top: '20%',
        left: '25%',
        pointerEvents: 'none'
      }} />
      <div style={{
        position: 'absolute',
        width: 300,
        height: 300,
        borderRadius: '50%',
        background: 'rgba(224, 126, 44, 0.07)',
        filter: 'blur(70px)',
        bottom: '20%',
        right: '25%',
        pointerEvents: 'none'
      }} />

      <div style={{
        width: '100%',
        maxWidth: 420,
        background: 'rgba(15, 23, 21, 0.75)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(255, 255, 255, 0.05)',
        borderRadius: 'var(--radius-2xl, 20px)',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
        padding: '40px 32px',
        position: 'relative',
        zIndex: 1
      }}>
        {/* Logo / Başlık */}
        <div style={{ textAlign: 'center', marginBottom: 35 }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 48,
            height: 48,
            borderRadius: '50%',
            background: 'var(--primary-600, #1f6059)',
            color: 'white',
            marginBottom: 16,
            boxShadow: '0 8px 16px rgba(31, 96, 89, 0.3)'
          }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
              <line x1="12" x2="12" y1="19" y2="22" />
            </svg>
          </div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--gray-50, #f9fafb)', margin: '0 0 6px 0', letterSpacing: '-0.5px' }}>
            AudiPro
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--gray-400, #9ca3af)', margin: 0 }}>
            İşitme Merkezi Otomasyon Sistemi
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* E-posta */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--gray-300, #d1d5db)', letterSpacing: '0.3px' }}>
              E-POSTA ADRESİ
            </label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-500, #6b7280)', display: 'flex' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="20" height="16" x="2" y="4" rx="2" />
                  <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                </svg>
              </span>
              <input
                type="email"
                placeholder="ornek@audipro.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={{
                  width: '100%',
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: 'var(--radius-lg, 12px)',
                  padding: '13px 16px 13px 44px',
                  color: 'white',
                  fontSize: '0.9rem',
                  outline: 'none',
                  transition: 'all 0.2s',
                }}
                className="login-input"
              />
            </div>
          </div>

          {/* Şifre */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--gray-300, #d1d5db)', letterSpacing: '0.3px' }}>
                ŞİFRE
              </label>
            </div>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-500, #6b7280)', display: 'flex' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </span>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{
                  width: '100%',
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: 'var(--radius-lg, 12px)',
                  padding: '13px 40px 13px 44px',
                  color: 'white',
                  fontSize: '0.9rem',
                  outline: 'none',
                  transition: 'all 0.2s',
                }}
                className="login-input"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: 14,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: 'var(--gray-500, #6b7280)',
                  cursor: 'pointer',
                  padding: 0,
                  display: 'flex'
                }}
              >
                {showPassword ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
                    <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
                    <path d="M6.61 6.61A13.52 13.52 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
                    <line x1="2" x2="22" y1="2" y2="22" />
                  </svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Giriş Yap Butonu */}
          <button
            type="submit"
            disabled={loading}
            style={{
              background: 'linear-gradient(135deg, var(--primary-600, #1f6059) 0%, var(--primary-700, #164641) 100%)',
              color: 'white',
              border: 'none',
              borderRadius: 'var(--radius-lg, 12px)',
              padding: '14px 16px',
              fontSize: '0.92rem',
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              boxShadow: '0 8px 20px rgba(31, 96, 89, 0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              transition: 'all 0.2s',
              marginTop: 10
            }}
            className="login-btn"
          >
            {loading ? (
              <span style={{
                width: 18,
                height: 18,
                border: '2px solid rgba(255,255,255,0.3)',
                borderTopColor: 'white',
                borderRadius: '50%',
                animation: 'spin 0.8s linear infinite'
              }} />
            ) : 'Giriş Yap'}
          </button>
        </form>
      </div>

      <style jsx global>{`
        .login-input:focus {
          border-color: var(--primary-500, #2c857c) !important;
          background: rgba(255, 255, 255, 0.05) !important;
          box-shadow: 0 0 0 3px rgba(31, 96, 89, 0.15) !important;
        }
        .login-btn:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 10px 24px rgba(31, 96, 89, 0.35) !important;
          filter: brightness(1.05);
        }
        .login-btn:active:not(:disabled) {
          transform: translateY(0);
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
