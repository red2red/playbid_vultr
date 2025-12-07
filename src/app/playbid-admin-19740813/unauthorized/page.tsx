import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "접근 권한 없음 - PlayBid Admin",
    description: "관리자 권한이 필요합니다",
};

export default function UnauthorizedPage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
            <div className="text-center">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-red-500/20 rounded-full mb-6">
                    <span className="text-5xl">🚫</span>
                </div>
                <h1 className="text-3xl font-bold text-white mb-4">접근 권한이 없습니다</h1>
                <p className="text-slate-400 mb-8 max-w-md">
                    이 페이지는 관리자만 접근할 수 있습니다.
                    <br />
                    관리자 권한이 필요하면 시스템 관리자에게 문의하세요.
                </p>
                <div className="flex gap-4 justify-center">
                    <Link
                        href="/"
                        className="px-6 py-3 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition"
                    >
                        홈으로 돌아가기
                    </Link>
                    <Link
                        href="/playbid-admin-19740813/login"
                        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                    >
                        다른 계정으로 로그인
                    </Link>
                </div>
            </div>
        </div>
    );
}
