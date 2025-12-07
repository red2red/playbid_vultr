import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "접근 권한 없음 - PlayBid Admin",
};

export default function UnauthorizedLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
