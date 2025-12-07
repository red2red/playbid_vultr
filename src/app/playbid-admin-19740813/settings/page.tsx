"use client";

import { useState } from "react";

export default function SettingsPage() {
    const [maintenanceMode, setMaintenanceMode] = useState(false);

    return (
        <div className="p-8">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-slate-900">설정</h1>
                <p className="text-slate-600">시스템 및 앱 설정을 관리합니다.</p>
            </div>

            <div className="space-y-6">
                {/* Admin Accounts */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="font-semibold text-slate-900">관리자 계정</h2>
                        <button className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition">
                            + 관리자 추가
                        </button>
                    </div>
                    <div className="space-y-3">
                        {[
                            { email: "admin@playbid.kr", role: "Super Admin", lastLogin: "2024-12-06 15:30" },
                            { email: "manager@playbid.kr", role: "Manager", lastLogin: "2024-12-05 10:20" },
                        ].map((admin, idx) => (
                            <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                                <div>
                                    <p className="font-medium text-slate-900">{admin.email}</p>
                                    <p className="text-sm text-slate-500">마지막 로그인: {admin.lastLogin}</p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                                        {admin.role}
                                    </span>
                                    <button className="text-sm text-slate-500 hover:text-red-600">삭제</button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* App Version */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                    <h2 className="font-semibold text-slate-900 mb-4">앱 버전 관리</h2>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">최신 버전</label>
                            <input
                                type="text"
                                defaultValue="1.8.3"
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">최소 지원 버전</label>
                            <input
                                type="text"
                                defaultValue="1.5.0"
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>
                    <div className="mt-4 flex items-center gap-4">
                        <label className="flex items-center gap-2">
                            <input type="checkbox" className="rounded text-blue-600" />
                            <span className="text-sm text-slate-700">강제 업데이트 활성화</span>
                        </label>
                    </div>
                    <button className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
                        저장
                    </button>
                </div>

                {/* Maintenance Mode */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                    <h2 className="font-semibold text-slate-900 mb-4">점검 모드</h2>
                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                        <div>
                            <p className="font-medium text-slate-900">서버 점검 모드</p>
                            <p className="text-sm text-slate-600">활성화 시 모든 사용자에게 점검 안내 화면이 표시됩니다.</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                checked={maintenanceMode}
                                onChange={(e) => setMaintenanceMode(e.target.checked)}
                                className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-red-600 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                        </label>
                    </div>
                    {maintenanceMode && (
                        <div className="mt-4">
                            <label className="block text-sm font-medium text-slate-700 mb-2">점검 안내 메시지</label>
                            <textarea
                                defaultValue="서버 점검 중입니다. 잠시 후 다시 시도해주세요."
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                rows={2}
                            />
                        </div>
                    )}
                </div>

                {/* API Keys */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                    <h2 className="font-semibold text-slate-900 mb-4">외부 서비스 연동</h2>
                    <div className="space-y-4">
                        {[
                            { name: "Supabase", status: "connected", icon: "🔗" },
                            { name: "Firebase (FCM)", status: "connected", icon: "🔔" },
                            { name: "나라장터 API", status: "connected", icon: "🏛️" },
                            { name: "Google Analytics", status: "not_connected", icon: "📊" },
                        ].map((service, idx) => (
                            <div key={idx} className="flex items-center justify-between p-3 border border-slate-200 rounded-lg">
                                <div className="flex items-center gap-3">
                                    <span className="text-2xl">{service.icon}</span>
                                    <span className="font-medium text-slate-900">{service.name}</span>
                                </div>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${service.status === "connected" ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-600"
                                    }`}>
                                    {service.status === "connected" ? "연결됨" : "미연결"}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Danger Zone */}
                <div className="bg-red-50 rounded-xl border border-red-200 p-6">
                    <h2 className="font-semibold text-red-900 mb-4">⚠️ 위험 영역</h2>
                    <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-red-200">
                            <div>
                                <p className="font-medium text-slate-900">캐시 초기화</p>
                                <p className="text-sm text-slate-600">모든 캐시 데이터를 삭제합니다.</p>
                            </div>
                            <button className="px-3 py-1 text-sm text-red-600 border border-red-300 rounded hover:bg-red-50 transition">
                                초기화
                            </button>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-red-200">
                            <div>
                                <p className="font-medium text-slate-900">모든 세션 종료</p>
                                <p className="text-sm text-slate-600">모든 사용자의 로그인 세션을 강제 종료합니다.</p>
                            </div>
                            <button className="px-3 py-1 text-sm text-red-600 border border-red-300 rounded hover:bg-red-50 transition">
                                종료
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
