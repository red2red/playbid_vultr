import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "로그인 - PlayBid Admin",
    description: "PlayBid 관리자 로그인",
};

export default function AdminLoginLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    // 로그인 페이지는 사이드바 없이 전체 화면으로 표시
    return <>{children}</>;
}
