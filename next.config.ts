import type { NextConfig } from "next";

const securityHeaders = [
  {
    // XSS saldırılarını engeller: hangi kaynaklardan script/style/media yüklenebileceğini kısıtlar
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://fonts.googleapis.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: blob: https:",
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://fonts.googleapis.com",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; '),
  },
  {
    // Clickjacking saldırısını engeller: sayfanın başka bir sitede iframe içine alınmasını yasaklar
    key: 'X-Frame-Options',
    value: 'DENY',
  },
  {
    // MIME sniffing saldırısını engeller: tarayıcı Content-Type'ı tahmin etmeye çalışmaz
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  {
    // HTTP downgrade saldırılarını engeller: 1 yıl boyunca sadece HTTPS bağlantısı kabul et
    key: 'Strict-Transport-Security',
    value: 'max-age=31536000; includeSubDomains; preload',
  },
  {
    // Referrer bilgisinin 3. taraf sitelere sızmasını engeller
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin',
  },
  {
    // Tarayıcının izin istemeden kamera/mikrofon/konum gibi özelliklere erişmesini engeller
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
  },
  {
    // XSS koruması: eski tarayıcılar için (modern tarayıcılarda CSP bunu karşılar)
    key: 'X-XSS-Protection',
    value: '1; mode=block',
  },
  {
    // DNS prefetching yoluyla veri sızıntısını önler
    key: 'X-DNS-Prefetch-Control',
    value: 'on',
  },
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        // Tüm rotalar için güvenlik başlıklarını uygula
        source: '/(.*)',
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
