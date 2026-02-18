"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type EventPopup = {
    id: string;
    title: string;
    content: string | null;
    image_url: string | null;
    link_url: string | null;
    is_active: boolean;
    is_popup_enabled: boolean;
    start_at: string;
    end_at: string | null;
    priority: number;
    created_at: string;
};

export default function EventPopupsPage() {
    const [popups, setPopups] = useState<EventPopup[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingPopup, setEditingPopup] = useState<EventPopup | null>(null);

    // Form states
    const [formData, setFormData] = useState({
        title: "",
        content: "",
        image_url: "",
        link_url: "",
        is_popup_enabled: true,
        priority: 0,
        start_at: new Date().toISOString().split('T')[0],
        end_at: "",
    });

    const supabase = createClient();

    useEffect(() => {
        fetchPopups();
    }, []);

    const fetchPopups = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('event_popups')
                .select('*')
                .order('priority', { ascending: false })
                .order('created_at', { ascending: false });

            if (error) throw error;
            setPopups(data || []);
        } catch (error) {
            console.error('Error fetching popups:', error);
            alert('팝업 목록을 불러오는데 실패했습니다.');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (popup?: EventPopup) => {
        if (popup) {
            setEditingPopup(popup);
            setFormData({
                title: popup.title,
                content: popup.content || "",
                image_url: popup.image_url || "",
                link_url: popup.link_url || "",
                is_popup_enabled: popup.is_popup_enabled,
                priority: popup.priority,
                start_at: popup.start_at.split('T')[0],
                end_at: popup.end_at ? popup.end_at.split('T')[0] : "",
            });
        } else {
            setEditingPopup(null);
            setFormData({
                title: "",
                content: "",
                image_url: "",
                link_url: "",
                is_popup_enabled: true,
                priority: 0,
                start_at: new Date().toISOString().split('T')[0],
                end_at: "",
            });
        }
        setShowModal(true);
    };

    const handleSubmit = async () => {
        try {
            if (!formData.title) return alert('제목을 입력해주세요.');

            const payload = {
                title: formData.title,
                content: formData.content || null,
                image_url: formData.image_url || null,
                link_url: formData.link_url || null,
                is_popup_enabled: formData.is_popup_enabled,
                priority: formData.priority,
                start_at: new Date(formData.start_at).toISOString(),
                end_at: formData.end_at ? new Date(formData.end_at).toISOString() : null,
                is_active: formData.is_popup_enabled, // 체크박스 상태에 따라 앱 노출 여부 결정
            };

            if (editingPopup) {
                const { error } = await supabase
                    .from('event_popups')
                    .update(payload)
                    .eq('id', editingPopup.id);
                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from('event_popups')
                    .insert([payload]);
                if (error) throw error;
            }

            setShowModal(false);
            fetchPopups();
        } catch (error) {
            console.error('Error saving popup:', error);
            alert('저장에 실패했습니다.');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('정말 삭제하시겠습니까?')) return;

        try {
            const { error } = await supabase
                .from('event_popups')
                .delete()
                .eq('id', id);

            if (error) throw error;
            fetchPopups();
        } catch (error) {
            console.error('Error deleting popup:', error);
            alert('삭제에 실패했습니다.');
        }
    };

    const handleToggleEnabled = async (popup: EventPopup) => {
        try {
            const { error } = await supabase
                .from('event_popups')
                .update({
                    is_popup_enabled: !popup.is_popup_enabled,
                    is_active: !popup.is_popup_enabled // 활성 상태도 함께 변경
                })
                .eq('id', popup.id);

            if (error) throw error;
            fetchPopups();
        } catch (error) {
            console.error('Error toggling popup:', error);
            alert('상태 변경에 실패했습니다.');
        }
    };

    return (
        <div className="p-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">이벤트 팝업 관리</h1>
                    <p className="text-slate-600">앱 시작 시 표시되는 팝업을 관리합니다.</p>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                    + 팝업 등록
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
                    <p className="text-2xl font-bold text-slate-900">{popups.length}</p>
                    <p className="text-sm text-slate-600">전체 팝업</p>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
                    <p className="text-2xl font-bold text-green-600">
                        {popups.filter(p => p.is_popup_enabled).length}
                    </p>
                    <p className="text-sm text-slate-600">활성 상태</p>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
                    <p className="text-2xl font-bold text-slate-400">
                        {popups.filter(p => !p.is_popup_enabled).length}
                    </p>
                    <p className="text-sm text-slate-600">비활성 상태</p>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">우선순위</th>
                                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">제목</th>
                                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">기간</th>
                                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">이미지</th>
                                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">상태</th>
                                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">등록일</th>
                                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">관리</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-8 text-center text-slate-500">
                                        데이터를 불러오는 중입니다...
                                    </td>
                                </tr>
                            ) : popups.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-8 text-center text-slate-500">
                                        등록된 팝업이 없습니다.
                                    </td>
                                </tr>
                            ) : (
                                popups.map((item) => (
                                    <tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50">
                                        <td className="px-6 py-4 text-slate-600">{item.priority}</td>
                                        <td className="px-6 py-4">
                                            <p className="font-medium text-slate-900">{item.title}</p>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-600">
                                            {new Date(item.start_at).toLocaleDateString()} ~
                                            {item.end_at ? new Date(item.end_at).toLocaleDateString() : ' 제한없음'}
                                        </td>
                                        <td className="px-6 py-4">
                                            {item.image_url ? (
                                                <span className="text-blue-600 text-xs">이미지 있음</span>
                                            ) : (
                                                <span className="text-slate-400 text-xs">-</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <button
                                                onClick={() => handleToggleEnabled(item)}
                                                className={`px-2 py-1 rounded-full text-xs font-medium transition ${item.is_popup_enabled
                                                    ? "bg-green-100 text-green-700 hover:bg-green-200"
                                                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                                                    }`}
                                            >
                                                {item.is_popup_enabled ? "활성" : "비활성"}
                                            </button>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-600">
                                            {new Date(item.created_at).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => handleOpenModal(item)}
                                                    className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                                                    title="수정"
                                                >
                                                    ✏️
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(item.id)}
                                                    className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                                                    title="삭제"
                                                >
                                                    🗑️
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-slate-200 sticky top-0 bg-white z-10">
                            <h2 className="text-xl font-bold text-slate-900">
                                {editingPopup ? '팝업 수정' : '새 팝업 등록'}
                            </h2>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">제목 *</label>
                                <input
                                    type="text"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="팝업 제목"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">내용</label>
                                <textarea
                                    value={formData.content}
                                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 h-32"
                                    placeholder="팝업 내용 (선택)"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">이미지 URL</label>
                                    <input
                                        type="text"
                                        value={formData.image_url}
                                        onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="https://..."
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">링크 URL (클릭 시 이동)</label>
                                    <input
                                        type="text"
                                        value={formData.link_url}
                                        onChange={(e) => setFormData({ ...formData, link_url: e.target.value })}
                                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="https://..."
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">시작일</label>
                                    <input
                                        type="date"
                                        value={formData.start_at}
                                        onChange={(e) => setFormData({ ...formData, start_at: e.target.value })}
                                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">종료일 (선택)</label>
                                    <input
                                        type="date"
                                        value={formData.end_at}
                                        onChange={(e) => setFormData({ ...formData, end_at: e.target.value })}
                                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">우선순위 (높은순)</label>
                                    <input
                                        type="number"
                                        value={formData.priority}
                                        onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) || 0 })}
                                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>
                            <div className="flex items-center gap-2 pt-2">
                                <input
                                    type="checkbox"
                                    id="isPopupEnabled"
                                    checked={formData.is_popup_enabled}
                                    onChange={(e) => setFormData({ ...formData, is_popup_enabled: e.target.checked })}
                                    className="rounded w-4 h-4 text-blue-600"
                                />
                                <label htmlFor="isPopupEnabled" className="text-sm text-slate-700 font-medium">활성화 (앱에 즉시 노출)</label>
                            </div>
                        </div>
                        <div className="p-6 border-t border-slate-200 flex justify-end gap-3 sticky bottom-0 bg-white">
                            <button
                                onClick={() => setShowModal(false)}
                                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition"
                            >
                                취소
                            </button>
                            <button
                                onClick={handleSubmit}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                            >
                                저장
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
