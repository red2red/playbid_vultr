"use client";

import { useState } from "react";

const mockAnnouncements = [
    { id: "1", title: "서비스 업데이트 안내", category: "update", isPopup: true, status: "published", createdAt: "2024-12-05", views: 234 },
    { id: "2", title: "연말 이벤트 안내", category: "event", isPopup: false, status: "published", createdAt: "2024-12-01", views: 512 },
    { id: "3", title: "서버 점검 예정", category: "maintenance", isPopup: true, status: "scheduled", createdAt: "2024-12-10", views: 0 },
    { id: "4", title: "신규 학습 콘텐츠 추가", category: "update", isPopup: false, status: "draft", createdAt: "2024-12-03", views: 0 },
];

const categories = {
    update: { label: "업데이트", color: "bg-blue-100 text-blue-700" },
    event: { label: "이벤트", color: "bg-purple-100 text-purple-700" },
    maintenance: { label: "점검", color: "bg-orange-100 text-orange-700" },
    notice: { label: "공지", color: "bg-slate-100 text-slate-700" },
};

export default function AnnouncementsPage() {
    const [showModal, setShowModal] = useState(false);

    return (
        <div className="p-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">공지사항 관리</h1>
                    <p className="text-slate-600">앱 내 공지사항을 관리합니다.</p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                    + 공지 작성
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-4 mb-6">
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
                    <p className="text-2xl font-bold text-slate-900">{mockAnnouncements.length}</p>
                    <p className="text-sm text-slate-600">전체 공지</p>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
                    <p className="text-2xl font-bold text-green-600">{mockAnnouncements.filter(a => a.status === "published").length}</p>
                    <p className="text-sm text-slate-600">게시됨</p>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
                    <p className="text-2xl font-bold text-amber-600">{mockAnnouncements.filter(a => a.status === "scheduled").length}</p>
                    <p className="text-sm text-slate-600">예약됨</p>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
                    <p className="text-2xl font-bold text-slate-400">{mockAnnouncements.filter(a => a.status === "draft").length}</p>
                    <p className="text-sm text-slate-600">임시저장</p>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <table className="w-full">
                    <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                            <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">제목</th>
                            <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">카테고리</th>
                            <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">팝업</th>
                            <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">상태</th>
                            <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">조회수</th>
                            <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">작성일</th>
                            <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">관리</th>
                        </tr>
                    </thead>
                    <tbody>
                        {mockAnnouncements.map((item) => (
                            <tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50">
                                <td className="px-6 py-4">
                                    <p className="font-medium text-slate-900">{item.title}</p>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${categories[item.category as keyof typeof categories]?.color}`}>
                                        {categories[item.category as keyof typeof categories]?.label}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    {item.isPopup ? (
                                        <span className="text-green-600">✅</span>
                                    ) : (
                                        <span className="text-slate-400">-</span>
                                    )}
                                </td>
                                <td className="px-6 py-4">
                                    <StatusBadge status={item.status} />
                                </td>
                                <td className="px-6 py-4 text-sm text-slate-600">{item.views.toLocaleString()}</td>
                                <td className="px-6 py-4 text-sm text-slate-600">{item.createdAt}</td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2">
                                        <button className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition">✏️</button>
                                        <button className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition">🗑️</button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl mx-4">
                        <div className="p-6 border-b border-slate-200">
                            <h2 className="text-xl font-bold text-slate-900">새 공지사항 작성</h2>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">제목</label>
                                <input type="text" className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="공지 제목을 입력하세요" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">카테고리</label>
                                    <select className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                                        <option value="notice">공지</option>
                                        <option value="update">업데이트</option>
                                        <option value="event">이벤트</option>
                                        <option value="maintenance">점검</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">상태</label>
                                    <select className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                                        <option value="draft">임시저장</option>
                                        <option value="published">즉시 발행</option>
                                        <option value="scheduled">예약 발행</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">내용</label>
                                <textarea className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 h-40" placeholder="공지 내용을 입력하세요" />
                            </div>
                            <div className="flex items-center gap-2">
                                <input type="checkbox" id="isPopup" className="rounded" />
                                <label htmlFor="isPopup" className="text-sm text-slate-700">앱 시작 시 팝업으로 표시</label>
                            </div>
                        </div>
                        <div className="p-6 border-t border-slate-200 flex justify-end gap-3">
                            <button onClick={() => setShowModal(false)} className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition">취소</button>
                            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">저장</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function StatusBadge({ status }: { status: string }) {
    const config: Record<string, { bg: string; text: string; label: string }> = {
        published: { bg: "bg-green-100", text: "text-green-700", label: "게시됨" },
        scheduled: { bg: "bg-amber-100", text: "text-amber-700", label: "예약됨" },
        draft: { bg: "bg-slate-100", text: "text-slate-600", label: "임시저장" },
    };
    const { bg, text, label } = config[status] || { bg: "bg-slate-100", text: "text-slate-600", label: status };

    return (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${bg} ${text}`}>
            {label}
        </span>
    );
}
