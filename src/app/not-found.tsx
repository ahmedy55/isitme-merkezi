import Link from 'next/link';

export default function NotFound() {
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
        <div style={{ fontSize: '4rem', fontWeight: 800, color: '#10b981', lineHeight: 1, marginBottom: 12 }}>
          404
        </div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: 8 }}>
          Sayfa Bulunamadı
        </h1>
        <p style={{ color: '#94a3b8', fontSize: '0.95rem', marginBottom: 24, lineHeight: 1.5 }}>
          Aradığınız sayfa mevcut değil veya taşınmış olabilir. AudiPro klinik yönetim sistemine dönmek için aşağıdaki butonu kullanabilirsiniz.
        </p>
        <Link
          href="/"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            padding: '12px 24px',
            borderRadius: 10,
            background: '#08785b',
            color: '#ffffff',
            fontWeight: 600,
            fontSize: '0.95rem',
            textDecoration: 'none',
            transition: 'background 0.2s ease',
          }}
        >
          Ana Sayfaya Dön
        </Link>
      </div>
    </main>
  );
}
