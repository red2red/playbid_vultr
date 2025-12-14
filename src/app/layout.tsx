import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PlayBid - Play Smart, Bid Right!",
  description: "AI 기반 공공입찰 예측 서비스. 입찰 전문가로 성장하세요!",
  keywords: ["공공입찰", "나라장터", "입찰예측", "AI입찰", "PlayBid"],
  authors: [{ name: "PlayBid" }],
  openGraph: {
    title: "PlayBid - Play Smart, Bid Right!",
    description: "AI 기반 공공입찰 예측 서비스",
    type: "website",
    locale: "ko_KR",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
