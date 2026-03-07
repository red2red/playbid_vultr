"use client";

import { useState, useEffect } from "react";
import { getUsers, updateUser, deleteUser } from "@/lib/database";

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
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const limit = 20;

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
            setUsers(data as User[]);
            setTotalUsers(total);
        } catch (error) {
            console.error("Error fetching users:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        const debounceTimer = setTimeout(fetchUsers, 300);
        return () => clearTimeout(debounceTimer);
    }, [searchTerm, filterStatus, filterSubscription, currentPage]);

    const handleToggleStatus = async (user: User) => {
        const newStatus = user.status === 'active' ? 'inactive' : 'active';
        if (!confirm(`사용자 상태를 ${newStatus === 'active' ? '활성' : '비활성'}으로 변경하시겠습니까?`)) return;

        const { error } = await updateUser(user.id, { is_active: newStatus === 'active' });
        if (!error) {
            fetchUsers();
        } else {
            alert('상태 변경 중 오류가 발생했습니다.');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('정말로 이 사용자를 비활성화하시겠습니까? (DB에서 삭제되지 않고 is_active가 false로 변경됩니다)')) return;

        const { error } = await deleteUser(id);
        if (!error) {
            fetchUsers();
        } else {
            alert('삭제 중 오류가 발생했습니다.');
        }
    };

    const handleSaveEdit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingUser) return;

        const { error } = await updateUser(editingUser.id, {
            full_name: editingUser.full_name,
            username: editingUser.username,
            subscription: editingUser.subscription,
        });

        if (!error) {
            setEditingUser(null);
            fetchUsers();
        } else {
            alert('저장 중 오류가 발생했습니다.');
        }
    };

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
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900"
                        />
                    </div>
                    <select
                        value={filterStatus}
                        onChange={(e) => {
                            setFilterStatus(e.target.value);
                            setCurrentPage(1);
                        }}
                        className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 bg-white"
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
                        className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 bg-white"
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
                        <table className="w-full text-slate-900">
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
                                                <span className="font-semibold text-slate-900">Lv.{user.current_level}</span>
                                                <span className="text-sm text-amber-600">{user.total_xp} XP</span>
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
                                            <button
                                                onClick={() => handleToggleStatus(user)}
                                                className={`px-2 py-1 rounded-full text-xs font-medium transition cursor-pointer ${user.status === "active"
                                                    ? "bg-green-100 text-green-700 hover:bg-green-200"
                                                    : "bg-red-100 text-red-700 hover:bg-red-200"
                                                    }`}
                                            >
                                                {user.status === "active" ? "활성" : "비활성"}
                                            </button>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-600">{formatDate(user.created_at)}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => setEditingUser(user)}
                                                    className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                                                    title="수정"
                                                >
                                                    ✏️
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(user.id)}
                                                    className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                                                    title="비활성화"
                                                >
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
                                    className="px-3 py-1 border border-slate-300 rounded text-sm hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed text-slate-900"
                                >
                                    이전
                                </button>
                                <span className="px-3 py-1 bg-blue-600 text-white rounded text-sm font-medium">{currentPage}</span>
                                <button
                                    onClick={() => setCurrentPage(p => p + 1)}
                                    disabled={currentPage * limit >= totalUsers}
                                    className="px-3 py-1 border border-slate-300 rounded text-sm hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed text-slate-900"
                                >
                                    다음
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* Edit Modal */}
            {editingUser && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-slate-900">사용자 수정</h2>
                            <button
                                onClick={() => setEditingUser(null)}
                                className="text-slate-400 hover:text-slate-600"
                            >
                                ✕
                            </button>
                        </div>
                        <form onSubmit={handleSaveEdit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">이메일</label>
                                <input
                                    type="text"
                                    value={editingUser.email}
                                    disabled
                                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-500 cursor-not-allowed"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">이름 (Full Name)</label>
                                <input
                                    type="text"
                                    value={editingUser.full_name || ""}
                                    onChange={(e) => setEditingUser({ ...editingUser, full_name: e.target.value })}
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">닉네임 (Username)</label>
                                <input
                                    type="text"
                                    value={editingUser.username || ""}
                                    onChange={(e) => setEditingUser({ ...editingUser, username: e.target.value })}
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">구독 상태</label>
                                <select
                                    value={editingUser.subscription}
                                    onChange={(e) => setEditingUser({ ...editingUser, subscription: e.target.value })}
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 bg-white"
                                >
                                    <option value="free">무료</option>
                                    <option value="premium">프리미엄</option>
                                </select>
                            </div>
                            <div className="pt-4 flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setEditingUser(null)}
                                    className="flex-1 px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 transition font-medium"
                                >
                                    취소
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
                                >
                                    저장
                                </button>
                            </div>
                        </form>
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
