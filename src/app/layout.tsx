import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AudiPro — İşitme Merkezi Yönetim Sistemi",
  description:
    "İşitme cihazı merkezleri için profesyonel otomasyon yazılımı. Hasta yönetimi, randevu, SGK/Medula entegrasyonu, stok ve kasa takibi.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr">
      <head>
        {/* Preconnect for Google Fonts performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="theme-color" content="#061a17" />
      </head>
      <body>{children}</body>
    </html>
  );
}
