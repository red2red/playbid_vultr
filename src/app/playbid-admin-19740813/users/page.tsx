"use client";

import { useState, useEffect } from "react";
import { getUsers } from "@/lib/database";

interface User {
    id: string;
    email: string;
    username: string;
    full_name: string;
    provider: string;
    current_level: number;
    total_xp: number;
    subscription: string;
    status: string;
    created_at: string;
}

export default function UsersPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [totalUsers, setTotalUsers] = useState(0);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterStatus, setFilterStatus] = useState("all");
    const [filterSubscription, setFilterSubscription] = useState("all");
    const [isLoading, setIsLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const limit = 20;

    useEffect(() => {
        const fetchUsers = async () => {
            setIsLoading(true);
            try {
                const { users: data, total } = await getUsers({
                    search: searchTerm || undefined,
                    status: filterStatus,
                    subscription: filterSubscription,
                    page: currentPage,
                    limit,
                });
                setUsers(data);
                setTotalUsers(total);
            } catch (error) {
                console.error("Error fetching users:", error);
            } finally {
                setIsLoading(false);
            }
        };

        const debounceTimer = setTimeout(fetchUsers, 300);
        return () => clearTimeout(debounceTimer);
    }, [searchTerm, filterStatus, filterSubscription, currentPage]);

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString("ko-KR");
    };

    return (
        <div className="p-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">사용자 관리</h1>
                    <p className="text-slate-600">전체 사용자: {totalUsers.toLocaleString()}명</p>
                </div>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
                    + 사용자 추가
                </button>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 mb-6">
                <div className="flex flex-wrap gap-4">
                    <div className="flex-1 min-w-[200px]">
                        <input
                            type="text"
                            placeholder="이메일 또는 이름으로 검색..."
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                setCurrentPage(1);
                            }}
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <select
                        value={filterStatus}
                        onChange={(e) => {
                            setFilterStatus(e.target.value);
                            setCurrentPage(1);
                        }}
                        className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="all">모든 상태</option>
                        <option value="active">활성</option>
                        <option value="inactive">비활성</option>
                    </select>
                    <select
                        value={filterSubscription}
                        onChange={(e) => {
                            setFilterSubscription(e.target.value);
                            setCurrentPage(1);
                        }}
                        className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="all">모든 구독</option>
                        <option value="free">무료</option>
                        <option value="premium">프리미엄</option>
                    </select>
                </div>
            </div>

            {/* Users Table */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                {isLoading ? (
                    <div className="p-8 text-center">
                        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                        <p className="text-slate-600">사용자 목록을 불러오는 중...</p>
                    </div>
                ) : users.length === 0 ? (
                    <div className="p-8 text-center">
                        <span className="text-4xl mb-4 block">👥</span>
                        <p className="text-slate-600">
                            {searchTerm ? "검색 결과가 없습니다." : "아직 사용자가 없습니다."}
                        </p>
                    </div>
                ) : (
                    <>
                        <table className="w-full">
                            <thead className="bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">사용자</th>
                                    <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">로그인</th>
                                    <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">레벨</th>
                                    <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">구독</th>
                                    <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">상태</th>
                                    <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">가입일</th>
                                    <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">관리</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map((user) => (
                                    <tr key={user.id} className="border-b border-slate-100 hover:bg-slate-50">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center">
                                                    <span className="text-lg">👤</span>
                                                </div>
                                                <div>
                                                    <p className="font-medium text-slate-900">{user.username || user.full_name || "사용자"}</p>
                                                    <p className="text-sm text-slate-500">{user.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <ProviderBadge provider={user.provider || "email"} />
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <span className="font-semibold text-slate-900">Lv.{user.current_level || 1}</span>
                                                <span className="text-sm text-amber-600">{user.total_xp || 0} XP</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${user.subscription === "premium"
                                                    ? "bg-amber-100 text-amber-700"
                                                    : "bg-slate-100 text-slate-600"
                                                }`}>
                                                {user.subscription === "premium" ? "💎 프리미엄" : "무료"}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${user.status === "active" || !user.status
                                                    ? "bg-green-100 text-green-700"
                                                    : "bg-red-100 text-red-700"
                                                }`}>
                                                {user.status === "active" || !user.status ? "활성" : "비활성"}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-600">{formatDate(user.created_at)}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <button className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition">
                                                    ✏️
                                                </button>
                                                <button className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition">
                                                    🗑️
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {/* Pagination */}
                        <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between">
                            <p className="text-sm text-slate-600">
                                {totalUsers.toLocaleString()}명 중 {((currentPage - 1) * limit) + 1}-{Math.min(currentPage * limit, totalUsers)}명 표시
                            </p>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                    className="px-3 py-1 border border-slate-300 rounded text-sm hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    이전
                                </button>
                                <span className="px-3 py-1 bg-blue-600 text-white rounded text-sm">{currentPage}</span>
                                <button
                                    onClick={() => setCurrentPage(p => p + 1)}
                                    disabled={currentPage * limit >= totalUsers}
                                    className="px-3 py-1 border border-slate-300 rounded text-sm hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    다음
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* Environment Check */}
            {!process.env.NEXT_PUBLIC_SUPABASE_URL && (
                <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                    <div className="flex items-start gap-3">
                        <span className="text-xl">⚠️</span>
                        <p className="text-sm text-amber-700">
                            Supabase 환경 변수가 설정되지 않아 목업 데이터가 표시됩니다.
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}

function ProviderBadge({ provider }: { provider: string }) {
    const config: Record<string, { bg: string; text: string; label: string }> = {
        google: { bg: "bg-red-50", text: "text-red-700", label: "Google" },
        kakao: { bg: "bg-yellow-50", text: "text-yellow-700", label: "Kakao" },
        naver: { bg: "bg-green-50", text: "text-green-700", label: "Naver" },
        apple: { bg: "bg-slate-100", text: "text-slate-700", label: "Apple" },
        email: { bg: "bg-blue-50", text: "text-blue-700", label: "Email" },
    };
    const { bg, text, label } = config[provider] || { bg: "bg-slate-100", text: "text-slate-600", label: provider };

    return (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${bg} ${text}`}>
            {label}
        </span>
    );
}
