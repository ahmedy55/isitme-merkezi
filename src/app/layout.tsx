import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "AudioPro — İşitme Merkezi Yönetim Sistemi",
  description: "İşitme cihazı merkezleri için profesyonel otomasyon yazılımı. Hasta yönetimi, randevu, SGK/Medula entegrasyonu, stok takibi ve daha fazlası.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" className={inter.variable}>
      <body>{children}</body>
    </html>
  );
}
