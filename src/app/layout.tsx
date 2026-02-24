import type { Metadata } from "next";
import { Noto_Sans_KR, Inter } from "next/font/google";
import { AuthSessionProvider } from "@/components/providers/auth-session-provider";
import "./globals.css";

const notoSansKr = Noto_Sans_KR({
  variable: "--font-noto-sans-kr",
  subsets: ["latin"],
  weight: ["100", "300", "400", "500", "700", "900"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PlayBid - 공공입찰의 새로운 기준",
  description: "AI 기반 공공입찰 예측 서비스. 빅데이터 분석으로 낙찰 확률을 높이세요.",
  keywords: ["공공입찰", "나라장터", "입찰예측", "AI입찰", "PlayBid", "플레이비드"],
  authors: [{ name: "PlayBid Team" }],
  openGraph: {
    title: "PlayBid - Play Smart, Bid Right!",
    description: "데이터로 증명하는 입찰 훈련 플랫폼",
    type: "website",
    locale: "ko_KR",
    siteName: "PlayBid",
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
        className={`${notoSansKr.variable} ${inter.variable} font-sans antialiased bg-background text-foreground`}
      >
        <AuthSessionProvider>
          <a href="#app-content" className="skip-link">
            본문 바로가기
          </a>
          <div id="app-content">{children}</div>
        </AuthSessionProvider>
      </body>
    </html>
  );
}
