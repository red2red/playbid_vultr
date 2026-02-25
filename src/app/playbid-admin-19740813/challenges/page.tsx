"use client";
/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect } from "react";
import { getMissions, getBadges, createMission, updateMission, deleteMission, getLeaderboard, createBadge, updateBadge, deleteBadge, resetLeaderboard } from "@/lib/database";

type Mission = {
    id: string;
    title: string;
    description: string;
    type: string;
    target_count: number;
    reward_points: number;
    created_at: string;
};

type Badge = {
    id: string;
    name: string;
    description: string;
    icon: string;
    requirement: string;
    created_at: string;
};

type LeaderboardEntry = {
    id: string;
    user_id: string;
    period: string;
    rank: number;
    points: number;
    profiles?: {
        username: string;
        avatar_url?: string;
    };
};

type ChallengeFormData = {
    title?: string;
    description?: string;
    type?: string;
    target_count?: number;
    reward_points?: number;
    name?: string;
    icon?: string;
    requirement?: string;
    [key: string]: string | number | undefined;
};

type EditableChallengeItem = Partial<Mission & Badge> | null;

export default function ChallengesPage() {
    const [activeTab, setActiveTab] = useState<"missions" | "badges" | "leaderboard">("missions");
    const [missions, setMissions] = useState<Mission[]>([]);
    const [badges, setBadges] = useState<Badge[]>([]);
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<EditableChallengeItem>(null);

    const loadData = async () => {
        setLoading(true);
        if (activeTab === "missions") {
            const data = await getMissions();
            setMissions(data as Mission[]);
        } else if (activeTab === "badges") {
            const data = await getBadges();
            setBadges(data as Badge[]);
        } else if (activeTab === "leaderboard") {
            const data = await getLeaderboard("weekly", 10);
            setLeaderboard(data as LeaderboardEntry[]);
        }
        setLoading(false);
    };

    useEffect(() => {
        void loadData();
    }, [activeTab]);

    const handleDeleteMission = async (id: string) => {
        if (!confirm("정말 삭제하시겠습니까?")) return;
        const { error } = await deleteMission(id);
        if (!error) {
            alert("삭제되었습니다.");
            loadData();
        } else alert("오류가 발생했습니다.");
    };

    const handleDeleteBadge = async (id: string) => {
        if (!confirm("정말 삭제하시겠습니까?")) return;
        const { error } = await deleteBadge(id);
        if (!error) {
            alert("삭제되었습니다.");
            loadData();
        } else alert("오류가 발생했습니다.");
    };

    const handleResetLeaderboard = async (period: 'weekly' | 'monthly') => {
        if (!confirm(`${period === 'weekly' ? '주간' : '월간'} 리더보드를 초기화하시겠습니까?`)) return;
        const { error } = await resetLeaderboard(period);
        if (!error) {
            alert("초기화되었습니다.");
            loadData();
        } else alert("오류가 발생했습니다.");
    };

    const handleSave = async (formData: ChallengeFormData) => {
        let error;
        if (activeTab === 'missions') {
            if (editingItem) {
                const res = await updateMission(editingItem.id as string, formData);
                error = res.error;
            } else {
                const res = await createMission(formData as {
                    title: string;
                    description: string;
                    type: string;
                    target_count: number;
                    reward_points: number;
                });
                error = res.error;
            }
        } else if (activeTab === 'badges') {
            if (editingItem) {
                const res = await updateBadge(editingItem.id as string, formData);
                error = res.error;
            } else {
                const res = await createBadge(formData as {
                    name: string;
                    description: string;
                    icon: string;
                    requirement: string;
                });
                error = res.error;
            }
        }

        if (!error) {
            alert("저장되었습니다.");
            setModalOpen(false);
            setEditingItem(null);
            loadData();
        } else {
            alert("저장 중 오류가 발생했습니다.");
        }
    };

    return (
        <div className="p-8">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">챌린지/미션 관리</h1>
                    <p className="text-slate-600">사용자 미션, 뱃지, 리더보드를 관리합니다.</p>
                </div>
            </div>

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

            {loading ? (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center text-slate-500">
                    로딩 중...
                </div>
            ) : (
                <>
                    {activeTab === "missions" && (
                        <MissionsTab
                            missions={missions}
                            onDelete={handleDeleteMission}
                            onEdit={(m) => { setEditingItem(m); setModalOpen(true); }}
                            onAdd={() => { setEditingItem(null); setModalOpen(true); }}
                        />
                    )}
                    {activeTab === "badges" && (
                        <BadgesTab
                            badges={badges}
                            onDelete={handleDeleteBadge}
                            onEdit={(b) => { setEditingItem(b); setModalOpen(true); }}
                            onAdd={() => { setEditingItem(null); setModalOpen(true); }}
                        />
                    )}
                    {activeTab === "leaderboard" && (
                        <LeaderboardTab
                            leaderboard={leaderboard}
                            onReset={handleResetLeaderboard}
                        />
                    )}
                </>
            )}

            {modalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
                        <h2 className="text-xl font-bold mb-6">
                            {activeTab === 'missions' ? (editingItem ? '미션 수정' : '새 미션 작성') : (editingItem ? '뱃지 수정' : '새 뱃지 작성')}
                        </h2>
                        <form onSubmit={(e) => {
                            e.preventDefault();
                            const formData = new FormData(e.currentTarget);
                            const data: ChallengeFormData = {};
                            formData.forEach((value, key) => {
                                if (key === 'target_count' || key === 'reward_points') {
                                    data[key] = parseInt(value as string);
                                } else {
                                    data[key] = String(value);
                                }
                            });
                            handleSave(data);
                        }} className="space-y-4">
                            {activeTab === 'missions' ? (
                                <>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">제목</label>
                                        <input name="title" defaultValue={editingItem?.title} required className="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">설명</label>
                                        <textarea name="description" defaultValue={editingItem?.description} required className="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 h-24" />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">유형</label>
                                            <select name="type" defaultValue={editingItem?.type || 'daily'} className="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500">
                                                <option value="daily">일일</option>
                                                <option value="weekly">주간</option>
                                                <option value="achievement">업적</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">목표 횟수</label>
                                            <input type="number" name="target_count" defaultValue={editingItem?.target_count || 1} required className="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">보상 포인트 (XP)</label>
                                        <input type="number" name="reward_points" defaultValue={editingItem?.reward_points || 10} required className="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">이름</label>
                                        <input name="name" defaultValue={editingItem?.name} required className="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">설명</label>
                                        <textarea name="description" defaultValue={editingItem?.description} required className="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 h-24" />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">아이콘 (이모지)</label>
                                            <input name="icon" defaultValue={editingItem?.icon || '🏅'} required className="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">획득 조건</label>
                                            <input name="requirement" defaultValue={editingItem?.requirement} required placeholder="예: 첫 입찰 1회" className="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
                                        </div>
                                    </div>
                                </>
                            )}
                            <div className="flex gap-3 pt-4">
                                <button type="button" onClick={() => setModalOpen(false)} className="flex-1 px-4 py-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50">취소</button>
                                <button type="submit" className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">저장</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

function MissionsTab({ missions, onDelete, onEdit, onAdd }: { missions: Mission[]; onDelete: (id: string) => void, onEdit: (m: Mission) => void, onAdd: () => void }) {
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
                <button onClick={onAdd} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
                    + 미션 추가
                </button>
            </div>
            {missions.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center text-slate-500">
                    미션이 없습니다.
                </div>
            ) : (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">미션</th>
                                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">유형</th>
                                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">목표</th>
                                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">보상 XP</th>
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
                                    <td className="px-6 py-4 text-sm text-slate-600">
                                        {mission.target_count}회
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-amber-600 font-semibold">+{mission.reward_points} XP</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <button onClick={() => onEdit(mission)} className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition">✏️</button>
                                            <button
                                                onClick={() => onDelete(mission.id)}
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
                </div>
            )}
        </div>
    );
}

function BadgesTab({ badges, onDelete, onEdit, onAdd }: { badges: Badge[]; onDelete: (id: string) => void, onEdit: (b: Badge) => void, onAdd: () => void }) {
    return (
        <div>
            <div className="flex justify-end mb-4">
                <button onClick={onAdd} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
                    + 뱃지 추가
                </button>
            </div>
            {badges.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center text-slate-500">
                    뱃지가 없습니다.
                </div>
            ) : (
                <div className="grid grid-cols-2 gap-4">
                    {badges.map((badge) => (
                        <div key={badge.id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <span className="text-5xl">{badge.icon || "🏅"}</span>
                                <div>
                                    <h3 className="font-semibold text-slate-900">{badge.name}</h3>
                                    <p className="text-sm text-slate-600">{badge.description}</p>
                                    <p className="text-sm text-slate-500 mt-1">조건: {badge.requirement}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button onClick={() => onEdit(badge)} className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition">✏️</button>
                                <button onClick={() => onDelete(badge.id)} className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition">🗑️</button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

function LeaderboardTab({ leaderboard, onReset }: { leaderboard: LeaderboardEntry[]; onReset: (period: 'weekly' | 'monthly') => void }) {
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
                        <button onClick={() => onReset('weekly')} className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition">
                            수동 리셋
                        </button>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                        <div>
                            <p className="font-medium text-slate-900">월간 리더보드 리셋</p>
                            <p className="text-sm text-slate-600">매월 1일 00:00에 자동 리셋</p>
                        </div>
                        <button onClick={() => onReset('monthly')} className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition">
                            수동 리셋
                        </button>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">현재 Top 10</h3>
                {leaderboard.length === 0 ? (
                    <div className="p-4 text-center text-slate-500">리더보드 데이터가 없습니다.</div>
                ) : (
                    <div className="space-y-2">
                        {leaderboard.map((entry) => (
                            <div key={entry.id} className="flex items-center gap-4 p-3 bg-slate-50 rounded-lg">
                                <span className={`w-8 h-8 flex items-center justify-center rounded-full font-bold ${entry.rank === 1 ? "bg-amber-400 text-white" :
                                    entry.rank === 2 ? "bg-slate-300 text-slate-700" :
                                        entry.rank === 3 ? "bg-amber-600 text-white" : "bg-slate-200 text-slate-600"
                                    }`}>
                                    {entry.rank}
                                </span>
                                <span className="flex-1 font-medium text-slate-900">
                                    {entry.profiles?.username || `User ${entry.user_id.slice(0, 8)}`}
                                </span>
                                <span className="text-amber-600 font-semibold">{entry.points.toLocaleString()} XP</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
