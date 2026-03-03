"use client";

import { useState, useEffect } from "react";
import { getAnnouncements, createAnnouncement, updateAnnouncement, deleteAnnouncement } from "@/lib/database";

const categories = {
    update: { label: "업데이트", color: "bg-blue-100 text-blue-700" },
    event: { label: "이벤트", color: "bg-purple-100 text-purple-700" },
    maintenance: { label: "점검", color: "bg-orange-100 text-orange-700" },
    notice: { label: "공지", color: "bg-slate-100 text-slate-700" },
};

type Announcement = {
    id: string;
    title: string;
    content: string;
    category: keyof typeof categories;
    is_popup: boolean;
    status: string;
    created_at: string;
    views?: number;
};

export default function AnnouncementsPage() {
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    // Form state
    const [formData, setFormData] = useState({
        title: "",
        content: "",
        category: "notice" as keyof typeof categories,
        status: "draft",
        is_popup: false,
    });

    async function loadAnnouncements() {
        setLoading(true);
        const result = await getAnnouncements();
        setAnnouncements(result.announcements as Announcement[]);
        setTotal(result.total);
        setLoading(false);
    }

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- fetches remote data then updates component state
        loadAnnouncements();
    }, []);

    const handleSubmit = async () => {
        if (!formData.title || !formData.content) {
            alert("제목과 내용을 입력해주세요.");
            return;
        }

        if (editingId) {
            const { error } = await updateAnnouncement(editingId, formData);
            if (!error) {
                alert("공지사항이 수정되었습니다.");
                resetForm();
                loadAnnouncements();
            } else {
                alert("수정 중 오류가 발생했습니다.");
            }
        } else {
            const { error } = await createAnnouncement(formData);
            if (!error) {
                alert("공지사항이 작성되었습니다.");
                resetForm();
                loadAnnouncements();
            } else {
                alert("작성 중 오류가 발생했습니다.");
            }
        }
    };

    const handleEdit = (announcement: Announcement) => {
        setEditingId(announcement.id);
        setFormData({
            title: announcement.title,
            content: announcement.content,
            category: announcement.category,
            status: announcement.status,
            is_popup: announcement.is_popup,
        });
        setShowModal(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm("정말 삭제하시겠습니까?")) return;

        const { error } = await deleteAnnouncement(id);
        if (!error) {
            alert("삭제되었습니다.");
            loadAnnouncements();
        } else {
            alert("삭제 중 오류가 발생했습니다.");
        }
    };

    const resetForm = () => {
        setFormData({
            title: "",
            content: "",
            category: "notice",
            status: "draft",
            is_popup: false,
        });
        setEditingId(null);
        setShowModal(false);
    };

    const stats = {
        total: total,
        published: announcements.filter(a => a.status === "published").length,
        scheduled: announcements.filter(a => a.status === "scheduled").length,
        draft: announcements.filter(a => a.status === "draft").length,
    };

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
                    <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
                    <p className="text-sm text-slate-600">전체 공지</p>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
                    <p className="text-2xl font-bold text-green-600">{stats.published}</p>
                    <p className="text-sm text-slate-600">게시됨</p>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
                    <p className="text-2xl font-bold text-amber-600">{stats.scheduled}</p>
                    <p className="text-sm text-slate-600">예약됨</p>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
                    <p className="text-2xl font-bold text-slate-400">{stats.draft}</p>
                    <p className="text-sm text-slate-600">임시저장</p>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                {loading ? (
                    <div className="p-8 text-center text-slate-500">로딩 중...</div>
                ) : announcements.length === 0 ? (
                    <div className="p-8 text-center text-slate-500">공지사항이 없습니다.</div>
                ) : (
                    <table className="w-full">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">제목</th>
                                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">카테고리</th>
                                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">팝업</th>
                                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">상태</th>
                                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">작성일</th>
                                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">관리</th>
                            </tr>
                        </thead>
                        <tbody>
                            {announcements.map((item) => (
                                <tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50">
                                    <td className="px-6 py-4">
                                        <p className="font-medium text-slate-900">{item.title}</p>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${categories[item.category]?.color}`}>
                                            {categories[item.category]?.label || item.category}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        {item.is_popup ? (
                                            <span className="text-green-600">✅</span>
                                        ) : (
                                            <span className="text-slate-400">-</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        <StatusBadge status={item.status} />
                                    </td>
                                    <td className="px-6 py-4 text-sm text-slate-600">
                                        {new Date(item.created_at).toLocaleDateString('ko-KR')}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => handleEdit(item)}
                                                className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                                            >
                                                ✏️
                                            </button>
                                            <button
                                                onClick={() => handleDelete(item.id)}
                                                className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                                            >
                                                🗑️
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl mx-4">
                        <div className="p-6 border-b border-slate-200">
                            <h2 className="text-xl font-bold text-slate-900">
                                {editingId ? "공지사항 수정" : "새 공지사항 작성"}
                            </h2>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">제목</label>
                                <input
                                    type="text"
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="공지 제목을 입력하세요"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">카테고리</label>
                                    <select
                                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        value={formData.category}
                                        onChange={(e) => setFormData({ ...formData, category: e.target.value as keyof typeof categories })}
                                    >
                                        <option value="notice">공지</option>
                                        <option value="update">업데이트</option>
                                        <option value="event">이벤트</option>
                                        <option value="maintenance">점검</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">상태</label>
                                    <select
                                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        value={formData.status}
                                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                    >
                                        <option value="draft">임시저장</option>
                                        <option value="published">즉시 발행</option>
                                        <option value="scheduled">예약 발행</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">내용</label>
                                <textarea
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 h-40"
                                    placeholder="공지 내용을 입력하세요"
                                    value={formData.content}
                                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="isPopup"
                                    className="rounded"
                                    checked={formData.is_popup}
                                    onChange={(e) => setFormData({ ...formData, is_popup: e.target.checked })}
                                />
                                <label htmlFor="isPopup" className="text-sm text-slate-700">앱 시작 시 팝업으로 표시</label>
                            </div>
                        </div>
                        <div className="p-6 border-t border-slate-200 flex justify-end gap-3">
                            <button
                                onClick={resetForm}
                                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition"
                            >
                                취소
                            </button>
                            <button
                                onClick={handleSubmit}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                            >
                                {editingId ? "수정" : "저장"}
                            </button>
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
