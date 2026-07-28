import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin", "latin-ext"],
  variable: "--font-inter",
  display: "swap",
});

const outfit = Outfit({
  subsets: ["latin", "latin-ext"],
  variable: "--font-outfit",
  display: "swap",
});

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
    <html lang="tr" className={`${inter.variable} ${outfit.variable}`}>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="theme-color" content="#061a17" />
      </head>
      <body>{children}</body>
    </html>
  );
}
