"use client";

import { useEffect, useState } from "react";
import { getDashboardStats, getRecentUsers } from "@/lib/database";

interface DashboardStats {
    totalUsers: number;
    todayUsers: number;
    activeUsers: number;
    premiumUsers: number;
}

interface RecentUser {
    id: string;
    email: string;
    username: string;
    provider: string;
    created_at: string;
}

export default function AdminDashboard() {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [recentUsers, setRecentUsers] = useState<RecentUser[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [statsData, usersData] = await Promise.all([
                    getDashboardStats(),
                    getRecentUsers(5),
                ]);
                setStats(statsData);
                setRecentUsers(usersData);
            } catch (error) {
                console.error("Error fetching dashboard data:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, []);

    const formatTimeAgo = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return "방금 전";
        if (diffMins < 60) return `${diffMins}분 전`;
        if (diffHours < 24) return `${diffHours}시간 전`;
        return `${diffDays}일 전`;
    };

    const getProviderLabel = (provider: string) => {
        const providers: Record<string, string> = {
            google: "Google",
            kakao: "Kakao",
            naver: "Naver",
            apple: "Apple",
            email: "Email",
        };
        return providers[provider] || provider;
    };

    if (isLoading) {
        return (
            <div className="p-8 flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                    <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-slate-600">데이터를 불러오는 중...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-8">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-slate-900">대시보드</h1>
                <p className="text-slate-600">PlayBid 서비스 현황을 한눈에 확인하세요.</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatCard
                    title="총 사용자"
                    value={stats?.totalUsers.toLocaleString() ?? "0"}
                    change="+12%"
                    trend="up"
                    icon="👥"
                />
                <StatCard
                    title="오늘 가입자"
                    value={stats?.todayUsers.toLocaleString() ?? "0"}
                    change={`+${stats?.todayUsers ?? 0}`}
                    trend="up"
                    icon="✨"
                />
                <StatCard
                    title="활성 사용자 (DAU)"
                    value={stats?.activeUsers.toLocaleString() ?? "0"}
                    change="+8%"
                    trend="up"
                    icon="📈"
                />
                <StatCard
                    title="프리미엄 구독자"
                    value={stats?.premiumUsers.toLocaleString() ?? "0"}
                    change="+3"
                    trend="up"
                    icon="💎"
                />
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {/* 가입자 추이 */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                    <h2 className="text-lg font-semibold text-slate-900 mb-4">가입자 추이</h2>
                    <div className="h-48 flex items-center justify-center bg-slate-50 rounded-lg">
                        <span className="text-slate-400">📊 차트 영역 (Supabase 연동 후 구현)</span>
                    </div>
                </div>

                {/* 입찰 참여 현황 */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                    <h2 className="text-lg font-semibold text-slate-900 mb-4">모의입찰 참여 현황</h2>
                    <div className="h-48 flex items-center justify-center bg-slate-50 rounded-lg">
                        <span className="text-slate-400">📊 차트 영역 (Supabase 연동 후 구현)</span>
                    </div>
                </div>
            </div>

            {/* Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* 최근 가입 */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                    <h2 className="text-lg font-semibold text-slate-900 mb-4">최근 가입</h2>
                    <div className="space-y-4">
                        {recentUsers.length > 0 ? (
                            recentUsers.map((user) => (
                                <div key={user.id} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center">
                                            <span className="text-sm">👤</span>
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-slate-900">
                                                {user.email?.replace(/(.{3}).*(@.*)/, "$1***$2") ?? "Unknown"}
                                            </p>
                                            <p className="text-xs text-slate-500">{getProviderLabel(user.provider)}</p>
                                        </div>
                                    </div>
                                    <span className="text-xs text-slate-500">{formatTimeAgo(user.created_at)}</span>
                                </div>
                            ))
                        ) : (
                            <p className="text-sm text-slate-500 text-center py-4">아직 가입한 사용자가 없습니다.</p>
                        )}
                    </div>
                </div>

                {/* 최근 활동 */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                    <h2 className="text-lg font-semibold text-slate-900 mb-4">최근 활동</h2>
                    <div className="space-y-4">
                        {[
                            { action: "모의입찰 참여", count: 45, icon: "🎯" },
                            { action: "미션 완료", count: 128, icon: "✅" },
                            { action: "학습 콘텐츠 조회", count: 312, icon: "📖" },
                            { action: "퀴즈 완료", count: 67, icon: "❓" },
                        ].map((activity, idx) => (
                            <div key={idx} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                                <div className="flex items-center gap-3">
                                    <span className="text-lg">{activity.icon}</span>
                                    <span className="text-sm text-slate-900">{activity.action}</span>
                                </div>
                                <span className="text-sm font-semibold text-blue-600">+{activity.count}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Environment Check */}
            {!process.env.NEXT_PUBLIC_SUPABASE_URL && (
                <div className="mt-8 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                    <div className="flex items-start gap-3">
                        <span className="text-2xl">⚠️</span>
                        <div>
                            <h3 className="font-semibold text-amber-900">Supabase 환경 변수 미설정</h3>
                            <p className="text-sm text-amber-700 mt-1">
                                .env.local 파일에 NEXT_PUBLIC_SUPABASE_URL과 NEXT_PUBLIC_SUPABASE_ANON_KEY를 설정해주세요.
                                <br />
                                Flutter 앱의 .env 파일에서 동일한 값을 사용하면 됩니다.
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function StatCard({
    title,
    value,
    change,
    trend,
    icon,
}: {
    title: string;
    value: string;
    change: string;
    trend: "up" | "down";
    icon: string;
}) {
    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-4">
                <span className="text-2xl">{icon}</span>
                <span
                    className={`text-sm font-medium ${trend === "up" ? "text-green-600" : "text-red-600"
                        }`}
                >
                    {change}
                </span>
            </div>
            <p className="text-2xl font-bold text-slate-900">{value}</p>
            <p className="text-sm text-slate-600">{title}</p>
        </div>
    );
}
