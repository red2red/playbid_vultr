"use client";

import { useState } from "react";

const mockNotifications = [
    { id: "1", title: "새로운 입찰공고가 등록되었습니다", body: "관심 업종에 새 공고가 있습니다.", sentAt: "2024-12-05 14:30", recipients: 1234, openRate: 45.2 },
    { id: "2", title: "주간 챌린지 시작!", body: "이번 주 미션을 완료하고 보상을 받으세요.", sentAt: "2024-12-04 09:00", recipients: 892, openRate: 62.1 },
    { id: "3", title: "모의입찰 결과 발표", body: "어제 참여한 모의입찰 결과를 확인하세요.", sentAt: "2024-12-03 10:00", recipients: 456, openRate: 78.5 },
];

export default function NotificationsPage() {
    const [showModal, setShowModal] = useState(false);

    return (
        <div className="p-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">푸시 알림 관리</h1>
                    <p className="text-slate-600">사용자에게 푸시 알림을 발송합니다.</p>
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
                    <p className="text-2xl font-bold text-slate-900">2,582</p>
                    <p className="text-sm text-slate-600">총 발송 건수</p>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
                    <p className="text-2xl font-bold text-green-600">58.3%</p>
                    <p className="text-sm text-slate-600">평균 오픈율</p>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
                    <p className="text-2xl font-bold text-blue-600">1,234</p>
                    <p className="text-sm text-slate-600">알림 허용 사용자</p>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
                    <p className="text-2xl font-bold text-amber-600">3</p>
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
                            <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">제목</th>
                            <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">발송 시간</th>
                            <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">수신자</th>
                            <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">오픈율</th>
                            <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">관리</th>
                        </tr>
                    </thead>
                    <tbody>
                        {mockNotifications.map((notif) => (
                            <tr key={notif.id} className="border-b border-slate-100 hover:bg-slate-50">
                                <td className="px-6 py-4">
                                    <p className="font-medium text-slate-900">{notif.title}</p>
                                    <p className="text-sm text-slate-500">{notif.body}</p>
                                </td>
                                <td className="px-6 py-4 text-sm text-slate-600">{notif.sentAt}</td>
                                <td className="px-6 py-4 text-sm text-slate-600">{notif.recipients.toLocaleString()}명</td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2">
                                        <div className="w-16 h-2 bg-slate-200 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-green-500 rounded-full"
                                                style={{ width: `${notif.openRate}%` }}
                                            />
                                        </div>
                                        <span className="text-sm text-slate-600">{notif.openRate}%</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <button className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition">
                                        📋
                                    </button>
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
                            <h2 className="text-xl font-bold text-slate-900">푸시 알림 발송</h2>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">제목</label>
                                <input type="text" className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="알림 제목" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">내용</label>
                                <textarea className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 h-24" placeholder="알림 내용" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">대상</label>
                                <select className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                                    <option value="all">전체 사용자</option>
                                    <option value="premium">프리미엄 구독자</option>
                                    <option value="free">무료 사용자</option>
                                    <option value="inactive">비활성 사용자</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">발송 시간</label>
                                <div className="flex gap-4">
                                    <label className="flex items-center gap-2">
                                        <input type="radio" name="sendTime" value="now" defaultChecked className="text-blue-600" />
                                        <span className="text-sm text-slate-700">즉시 발송</span>
                                    </label>
                                    <label className="flex items-center gap-2">
                                        <input type="radio" name="sendTime" value="scheduled" className="text-blue-600" />
                                        <span className="text-sm text-slate-700">예약 발송</span>
                                    </label>
                                </div>
                            </div>
                        </div>
                        <div className="p-6 border-t border-slate-200 flex justify-end gap-3">
                            <button onClick={() => setShowModal(false)} className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition">취소</button>
                            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">발송</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
