'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Kök uygulama hatası:', error);
  }, [error]);

  return (
    <main style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'radial-gradient(circle at 10% 20%, rgba(6, 26, 23, 1) 0%, rgba(12, 16, 15, 1) 90%)',
      color: '#f9fafb',
      fontFamily: 'var(--font-sans, "Outfit", sans-serif)',
      padding: '2rem',
      textAlign: 'center',
    }}>
      <div style={{
        background: 'rgba(15, 23, 21, 0.75)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: 20,
        padding: '40px 32px',
        maxWidth: 480,
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
      }}>
        <div style={{ fontSize: '3rem', marginBottom: 12 }}>
          ⚠️
        </div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: 8, color: '#f87171' }}>
          Beklenmeyen Bir Hata Oluştu
        </h1>
        <p style={{ color: '#94a3b8', fontSize: '0.95rem', marginBottom: 24, lineHeight: 1.5 }}>
          Uygulama çalışırken beklenmedik bir sorun meydana geldi. Sayfayı yeniden yükleyebilir veya tekrar deneyebilirsiniz.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          <button
            type="button"
            onClick={() => reset()}
            style={{
              padding: '12px 24px',
              borderRadius: 10,
              background: '#08785b',
              color: '#ffffff',
              fontWeight: 600,
              fontSize: '0.95rem',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            Yeniden Dene
          </button>
          <button
            type="button"
            onClick={() => { window.location.href = '/'; }}
            style={{
              padding: '12px 24px',
              borderRadius: 10,
              background: 'transparent',
              color: '#94a3b8',
              fontWeight: 600,
              fontSize: '0.95rem',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              cursor: 'pointer',
            }}
          >
            Ana Sayfaya Git
          </button>
        </div>
      </div>
    </main>
  );
}
