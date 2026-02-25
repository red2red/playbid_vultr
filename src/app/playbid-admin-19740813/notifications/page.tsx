"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import { useState, useEffect } from "react";
import { getPushNotifications, sendPushNotification, getPushStats } from "@/lib/database";

type PushHistory = {
    id: string;
    title: string;
    body: string;
    target_type: string;
    recipient_count: number;
    open_count: number;
    status: string;
    sent_at: string;
};

export default function NotificationsPage() {
    const [history, setHistory] = useState<PushHistory[]>([]);
    const [stats, setStats] = useState({ enabledUsers: 0, totalSentCount: 0 });
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        title: "",
        body: "",
        target_type: "all",
    });

    const loadData = async () => {
        setLoading(true);
        const [historyRes, statsRes] = await Promise.all([
            getPushNotifications(),
            getPushStats()
        ]);
        setHistory(historyRes.notifications as PushHistory[]);
        setStats(statsRes);
        setLoading(false);
    };

    useEffect(() => {
        void loadData();
    }, []);

    const handleSend = async () => {
        if (!formData.title || !formData.body) {
            alert("제목과 내용을 입력해주세요.");
            return;
        }

        const { error } = await sendPushNotification(formData);
        if (!error) {
            alert("알림 발송 요청이 저장되었습니다.");
            setShowModal(false);
            setFormData({ title: "", body: "", target_type: "all" });
            loadData();
        } else {
            alert("발송 중 오류가 발생했습니다.");
        }
    };

    const getTargetLabel = (type: string) => {
        const labels: Record<string, string> = {
            all: "전체 사용자",
            premium: "프리미엄",
            free: "무료 사용자",
            inactive: "비활성",
        };
        return labels[type] || type;
    };

    return (
        <div className="p-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">푸시 알림 관리</h1>
                    <p className="text-slate-600">사용자에게 푸시 알림을 발송하고 이력을 관리합니다.</p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                    + 알림 발송
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-4 mb-6">
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
                    <p className="text-2xl font-bold text-slate-900">{stats.totalSentCount.toLocaleString()}</p>
                    <p className="text-sm text-slate-600">누적 발송 건수</p>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
                    <p className="text-2xl font-bold text-blue-600">{stats.enabledUsers.toLocaleString()}</p>
                    <p className="text-sm text-slate-600">알림 가능 기기 (FCM)</p>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
                    <p className="text-2xl font-bold text-green-600">
                        {history.length > 0 ? (history.reduce((a, b) => a + b.open_count, 0) / history.reduce((a, b) => a + (b.recipient_count || 1), 0) * 100).toFixed(1) : 0}%
                    </p>
                    <p className="text-sm text-slate-600">평균 오픈율</p>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
                    <p className="text-2xl font-bold text-amber-600">
                        {history.filter(h => h.status === 'scheduled').length}
                    </p>
                    <p className="text-sm text-slate-600">예약된 알림</p>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-200">
                    <h2 className="font-semibold text-slate-900">발송 이력</h2>
                </div>
                <table className="w-full">
                    <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                            <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">제목 / 내용</th>
                            <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">대상</th>
                            <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">발송 일시</th>
                            <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">수신/오픈</th>
                            <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">상태</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={5} className="p-8 text-center text-slate-500">로딩 중...</td></tr>
                        ) : history.length === 0 ? (
                            <tr><td colSpan={5} className="p-8 text-center text-slate-500">발송 이력이 없습니다.</td></tr>
                        ) : (
                            history.map((notif) => (
                                <tr key={notif.id} className="border-b border-slate-100 hover:bg-slate-50">
                                    <td className="px-6 py-4">
                                        <p className="font-medium text-slate-900">{notif.title}</p>
                                        <p className="text-sm text-slate-500 truncate max-w-xs">{notif.body}</p>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-slate-600">
                                        {getTargetLabel(notif.target_type)}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-slate-600">
                                        {new Date(notif.sent_at).toLocaleString('ko-KR')}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm text-slate-900 font-medium">
                                            {notif.recipient_count}명 수신
                                        </div>
                                        <div className="text-xs text-slate-500">
                                            오픈: {notif.open_count}명 ({notif.recipient_count > 0 ? (notif.open_count / notif.recipient_count * 100).toFixed(1) : 0}%)
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${notif.status === 'sent' ? 'bg-green-100 text-green-700' :
                                                notif.status === 'sending' ? 'bg-blue-100 text-blue-700' :
                                                    'bg-slate-100 text-slate-600'
                                            }`}>
                                            {notif.status === 'sent' ? '발송완료' : notif.status === 'sending' ? '발송중' : notif.status}
                                        </span>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl mx-4">
                        <div className="p-6 border-b border-slate-200">
                            <h2 className="text-xl font-bold text-slate-900">푸시 알림 발송</h2>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">제목</label>
                                <input
                                    type="text"
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="사용자 기기에 표시될 제목"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">내용</label>
                                <textarea
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 h-24"
                                    placeholder="알림 상세 내용을 입력하세요"
                                    value={formData.body}
                                    onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">발송 대상</label>
                                    <select
                                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        value={formData.target_type}
                                        onChange={(e) => setFormData({ ...formData, target_type: e.target.value })}
                                    >
                                        <option value="all">전체 사용자 ({stats.enabledUsers}명)</option>
                                        <option value="premium">프리미엄 구독자</option>
                                        <option value="free">무료 사용자</option>
                                        <option value="inactive">30일 이상 미접속자</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">발송 시점</label>
                                    <select className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" disabled>
                                        <option value="now">즉시 발송</option>
                                        <option value="scheduled">예약 발송 (준비 중)</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                        <div className="p-6 border-t border-slate-200 flex justify-end gap-3">
                            <button onClick={() => setShowModal(false)} className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition">취소</button>
                            <button
                                onClick={handleSend}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                            >
                                발송하기
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
