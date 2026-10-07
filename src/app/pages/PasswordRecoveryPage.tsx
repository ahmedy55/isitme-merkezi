'use client';

import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { supabase } from '../lib/supabase';

export default function PasswordRecoveryPage() {
  const { setCurrentPage, addToast } = useApp();
  const [hasRecoverySession, setHasRecoverySession] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;
    void supabase.auth.getSession().then(({ data }) => {
      if (active) {
        setHasRecoverySession(Boolean(data.session));
        setCheckingSession(false);
      }
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange(event => {
      if (event === 'PASSWORD_RECOVERY' && active) {
        setHasRecoverySession(true);
        setCheckingSession(false);
      }
    });
    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    if (password.length < 8) {
      addToast({ type: 'warning', message: 'Şifreniz en az 8 karakter olmalıdır.' });
      return;
    }
    if (password !== confirmPassword) {
      addToast({ type: 'warning', message: 'Şifreler eşleşmiyor.' });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      await supabase.auth.signOut();
      setCurrentPage('login', true);
      addToast({ type: 'success', message: 'Şifreniz güncellendi. Yeni şifrenizle giriş yapabilirsiniz.' });
    } catch (error: any) {
      addToast({ type: 'error', message: error.message || 'Şifre güncellenemedi. Yeni bir sıfırlama bağlantısı isteyin.' });
    } finally {
      setLoading(false);
    }
  };

  const cardStyle: React.CSSProperties = {
    width: '100%', maxWidth: 440, padding: '36px 32px', position: 'relative', zIndex: 1,
    color: '#f9fafb', background: 'rgba(15, 23, 21, 0.9)', border: '1px solid rgba(255,255,255,.08)',
    borderRadius: 20, boxShadow: '0 25px 50px -12px rgba(0,0,0,.5)', fontFamily: 'var(--font-sans, Outfit, sans-serif)',
  };
  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '13px 14px', color: 'white', background: 'rgba(255,255,255,.04)',
    border: '1px solid rgba(255,255,255,.12)', borderRadius: 10, fontSize: '0.9rem', boxSizing: 'border-box',
  };

  return (
    <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, background: '#061a17' }}>
      <section style={cardStyle}>
        <h1 style={{ margin: '0 0 10px', fontSize: '1.5rem' }}>Yeni şifre belirle</h1>
        {checkingSession ? (
          <p role="status" style={{ color: '#cbd5d1' }}>Sıfırlama bağlantısı doğrulanıyor…</p>
        ) : hasRecoverySession ? (
          <>
            <p style={{ color: '#cbd5d1', fontSize: '0.9rem', marginBottom: 24 }}>Hesabınız için yeni bir şifre oluşturun.</p>
            <form onSubmit={handleSave} style={{ display: 'grid', gap: 14 }}>
              <label style={{ display: 'grid', gap: 7, fontSize: '0.85rem' }}>
                Yeni şifre
                <input autoComplete="new-password" type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={8} style={inputStyle} />
              </label>
              <label style={{ display: 'grid', gap: 7, fontSize: '0.85rem' }}>
                Yeni şifre (tekrar)
                <input autoComplete="new-password" type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required minLength={8} style={inputStyle} />
              </label>
              <button type="submit" disabled={loading} style={{ marginTop: 6, padding: 14, border: 0, borderRadius: 10, background: '#1f6059', color: 'white', fontWeight: 700, cursor: loading ? 'wait' : 'pointer' }}>
                {loading ? 'Kaydediliyor…' : 'Şifremi Güncelle'}
              </button>
            </form>
          </>
        ) : (
          <>
            <p role="alert" style={{ color: '#fca5a5', fontSize: '0.9rem' }}>
              Sıfırlama bağlantısının süresi dolmuş veya bağlantı daha önce kullanılmış. Giriş ekranından yeni bir bağlantı isteyin.
            </p>
            <button type="button" onClick={() => setCurrentPage('login', true)} style={{ marginTop: 8, padding: 13, width: '100%', border: 0, borderRadius: 10, background: '#1f6059', color: 'white', fontWeight: 700, cursor: 'pointer' }}>
              Giriş ekranına dön
            </button>
          </>
        )}
      </section>
    </main>
  );
}
