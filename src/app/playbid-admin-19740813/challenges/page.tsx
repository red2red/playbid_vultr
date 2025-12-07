"use client";

import { useState } from "react";

const mockMissions = [
    { id: "1", title: "첫 로그인", description: "앱에 처음 로그인하기", xp: 10, type: "daily", isActive: true },
    { id: "2", title: "입찰공고 3개 확인", description: "입찰공고를 3개 이상 확인하기", xp: 20, type: "daily", isActive: true },
    { id: "3", title: "퀴즈 완료", description: "학습 퀴즈 1개 완료하기", xp: 30, type: "daily", isActive: true },
    { id: "4", title: "모의입찰 참여", description: "모의입찰에 1회 참여하기", xp: 50, type: "daily", isActive: true },
    { id: "5", title: "주간 연속 로그인", description: "7일 연속 로그인하기", xp: 100, type: "weekly", isActive: true },
    { id: "6", title: "학습 마스터", description: "학습 콘텐츠 10개 완료하기", xp: 200, type: "achievement", isActive: true },
];

const mockBadges = [
    { id: "1", name: "입찰 입문자", icon: "🏅", description: "첫 모의입찰 참여", earnedCount: 234 },
    { id: "2", name: "학습왕", icon: "📚", description: "학습 콘텐츠 10개 완료", earnedCount: 156 },
    { id: "3", name: "연속출석왕", icon: "🔥", description: "7일 연속 로그인", earnedCount: 89 },
    { id: "4", name: "입찰 전문가", icon: "🎯", description: "예측 정확도 80% 달성", earnedCount: 45 },
];

export default function ChallengesPage() {
    const [activeTab, setActiveTab] = useState<"missions" | "badges" | "leaderboard">("missions");

    return (
        <div className="p-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">챌린지/미션 관리</h1>
                    <p className="text-slate-600">사용자 미션, 뱃지, 리더보드를 관리합니다.</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-slate-200 mb-6">
                <div className="flex gap-4">
                    {[
                        { key: "missions", label: "미션" },
                        { key: "badges", label: "뱃지" },
                        { key: "leaderboard", label: "리더보드" },
                    ].map((tab) => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key as typeof activeTab)}
                            className={`px-4 py-3 text-sm font-medium border-b-2 transition ${activeTab === tab.key
                                    ? "border-blue-600 text-blue-600"
                                    : "border-transparent text-slate-600 hover:text-slate-900"
                                }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Content */}
            {activeTab === "missions" && <MissionsTab missions={mockMissions} />}
            {activeTab === "badges" && <BadgesTab badges={mockBadges} />}
            {activeTab === "leaderboard" && <LeaderboardTab />}
        </div>
    );
}

function MissionsTab({ missions }: { missions: typeof mockMissions }) {
    const getMissionType = (type: string) => {
        const types: Record<string, { label: string; color: string }> = {
            daily: { label: "일일", color: "bg-blue-100 text-blue-700" },
            weekly: { label: "주간", color: "bg-purple-100 text-purple-700" },
            achievement: { label: "업적", color: "bg-amber-100 text-amber-700" },
        };
        return types[type] || { label: type, color: "bg-slate-100 text-slate-700" };
    };

    return (
        <div>
            <div className="flex justify-end mb-4">
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
                    + 미션 추가
                </button>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <table className="w-full">
                    <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                            <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">미션</th>
                            <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">유형</th>
                            <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">보상 XP</th>
                            <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">상태</th>
                            <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">관리</th>
                        </tr>
                    </thead>
                    <tbody>
                        {missions.map((mission) => (
                            <tr key={mission.id} className="border-b border-slate-100 hover:bg-slate-50">
                                <td className="px-6 py-4">
                                    <p className="font-medium text-slate-900">{mission.title}</p>
                                    <p className="text-sm text-slate-500">{mission.description}</p>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getMissionType(mission.type).color}`}>
                                        {getMissionType(mission.type).label}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <span className="text-amber-600 font-semibold">+{mission.xp} XP</span>
                                </td>
                                <td className="px-6 py-4">
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input type="checkbox" defaultChecked={mission.isActive} className="sr-only peer" />
                                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-blue-600 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                                    </label>
                                </td>
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
        </div>
    );
}

function BadgesTab({ badges }: { badges: typeof mockBadges }) {
    return (
        <div>
            <div className="flex justify-end mb-4">
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
                    + 뱃지 추가
                </button>
            </div>
            <div className="grid grid-cols-2 gap-4">
                {badges.map((badge) => (
                    <div key={badge.id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <span className="text-5xl">{badge.icon}</span>
                            <div>
                                <h3 className="font-semibold text-slate-900">{badge.name}</h3>
                                <p className="text-sm text-slate-600">{badge.description}</p>
                                <p className="text-sm text-blue-600 mt-1">{badge.earnedCount}명 획득</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <button className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition">✏️</button>
                            <button className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition">🗑️</button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function LeaderboardTab() {
    return (
        <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">리더보드 설정</h3>
                <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                        <div>
                            <p className="font-medium text-slate-900">주간 리더보드 리셋</p>
                            <p className="text-sm text-slate-600">매주 월요일 00:00에 자동 리셋</p>
                        </div>
                        <button className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition">
                            수동 리셋
                        </button>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                        <div>
                            <p className="font-medium text-slate-900">월간 리더보드 리셋</p>
                            <p className="text-sm text-slate-600">매월 1일 00:00에 자동 리셋</p>
                        </div>
                        <button className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition">
                            수동 리셋
                        </button>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">현재 Top 10</h3>
                <div className="space-y-2">
                    {[
                        { rank: 1, name: "김철수", xp: 2340 },
                        { rank: 2, name: "이영희", xp: 2100 },
                        { rank: 3, name: "박민수", xp: 1980 },
                    ].map((user) => (
                        <div key={user.rank} className="flex items-center gap-4 p-3 bg-slate-50 rounded-lg">
                            <span className={`w-8 h-8 flex items-center justify-center rounded-full font-bold ${user.rank === 1 ? "bg-amber-400 text-white" :
                                    user.rank === 2 ? "bg-slate-300 text-slate-700" :
                                        user.rank === 3 ? "bg-amber-600 text-white" : "bg-slate-200 text-slate-600"
                                }`}>
                                {user.rank}
                            </span>
                            <span className="flex-1 font-medium text-slate-900">{user.name}</span>
                            <span className="text-amber-600 font-semibold">{user.xp.toLocaleString()} XP</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
