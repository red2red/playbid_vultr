"use client";

import { useState, useEffect } from "react";
import { getBidNotices, getBidNoticeStats, syncBidNotices } from "@/lib/database";

type BidNotice = {
    bid_ntce_no: string;
    bid_ntce_nm: string;
    ntce_instt_nm: string;
    api_category: string;
    presmpt_prce: number;
    bid_clse_dt: string;
    created_at: string;
};

type BidStats = {
    total: number;
    active: number;
    todayDeadline: number;
    mockBidActive: number;
};

type StatCardColor = "slate" | "emerald" | "blue" | "amber";

export default function BidsPage() {
    const [notices, setNotices] = useState<BidNotice[]>([]);
    const [stats, setStats] = useState<BidStats>({
        total: 0,
        active: 0,
        todayDeadline: 0,
        mockBidActive: 0,
    });
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [lastSync, setLastSync] = useState<string>("");

    async function loadData() {
        setLoading(true);
        const result = await getBidNotices({ status: statusFilter === "all" ? undefined : statusFilter });
        const fetchedNotices = result.notices as BidNotice[];
        setNotices(fetchedNotices);

        // 마지막 동기화 시간 (가장 최근 데이터 기준)
        if (fetchedNotices.length > 0) {
            const latest = fetchedNotices.reduce((prev, curr) =>
                new Date(prev.created_at) > new Date(curr.created_at) ? prev : curr
            );
            setLastSync(new Date(latest.created_at).toLocaleString('ko-KR'));
        }

        setLoading(false);
    }

    async function loadStats() {
        const statsData = await getBidNoticeStats();
        setStats(statsData);
    }

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- fetches remote data then updates component state
        loadData();
        // eslint-disable-next-line react-hooks/set-state-in-effect -- fetches remote data then updates component state
        loadStats();
    }, [statusFilter]);

    const handleSync = async () => {
        if (!confirm("나라장터와 데이터 동기화를 진행하시겠습니까? 약 1~2분이 소요될 수 있습니다.")) return;

        setLoading(true);
        const { error } = await syncBidNotices();

        if (!error) {
            alert("동기화가 완료되었습니다.");
            loadData();
            loadStats();
        } else {
            alert("동기화 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
            setLoading(false);
        }
    };

    return (
        <div className="p-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">입찰 공고 관리</h1>
                    <p className="text-slate-600">나라장터 연동 입찰 공고를 관리합니다.</p>
                </div>
                <button
                    onClick={handleSync}
                    className="group relative flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200"
                >
                    <span className="text-lg">🔄</span>
                    <span className="font-semibold">데이터 동기화</span>
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-6 mb-8">
                <StatCard title="전체 공고" value={stats.total} color="slate" icon="📋" />
                <StatCard title="진행 중" value={stats.active} color="emerald" icon="⚡" />
                <StatCard title="모의입찰 진행" value={stats.mockBidActive} color="blue" icon="🎯" />
                <StatCard title="오늘 마감" value={stats.todayDeadline} color="amber" icon="⏰" />
            </div>

            {/* Sync Info */}
            <div className="bg-indigo-50/50 border border-indigo-100 rounded-2xl p-5 mb-8 flex items-center justify-between backdrop-blur-sm">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center text-2xl">
                        📡
                    </div>
                    <div>
                        <p className="text-sm font-medium text-indigo-600 mb-0.5">최근 동기화 상태</p>
                        <p className="font-bold text-indigo-950">
                            {lastSync ? `${lastSync}` : "동기화 이력 없음"}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-xs text-indigo-400">자동 동기화 활성화됨</span>
                    <button className="px-4 py-2 text-sm font-semibold text-indigo-700 bg-white border border-indigo-200 rounded-lg hover:bg-indigo-50 transition shadow-sm">
                        설정 관리
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="mb-6 flex p-1 bg-slate-100 rounded-xl w-fit">
                <FilterTab label="전체" active={statusFilter === "all"} onClick={() => setStatusFilter("all")} />
                <FilterTab label="진행 중" active={statusFilter === "active"} onClick={() => setStatusFilter("active")} />
                <FilterTab label="마감" active={statusFilter === "closed"} onClick={() => setStatusFilter("closed")} />
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-200 overflow-hidden">
                {loading ? (
                    <div className="p-20 text-center">
                        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                        <p className="text-slate-500 font-medium tracking-tight">강력한 데이터를 불러오는 중...</p>
                    </div>
                ) : notices.length === 0 ? (
                    <div className="p-20 text-center">
                        <div className="text-6xl mb-6">🔍</div>
                        <p className="text-slate-900 font-bold text-xl mb-2">조회된 공고가 없습니다.</p>
                        <p className="text-slate-500">동기화 버튼을 눌러 최신 데이터를 가져와보세요.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-slate-900">
                            <thead>
                                <tr className="bg-slate-50/50 border-b border-slate-200">
                                    <th className="text-left px-8 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">공고 상세</th>
                                    <th className="text-left px-8 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">발주기관</th>
                                    <th className="text-left px-8 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">카테고리</th>
                                    <th className="text-left px-8 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest text-right">추정가</th>
                                    <th className="text-left px-8 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">마감일시</th>
                                    <th className="text-center px-8 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">상태</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {notices.map((bid) => {
                                    const isActive = new Date(bid.bid_clse_dt) > new Date();
                                    return (
                                        <tr key={bid.bid_ntce_no} className="hover:bg-slate-50/80 transition-colors group">
                                            <td className="px-8 py-5">
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-mono text-slate-400 mb-1">{bid.bid_ntce_no}</span>
                                                    <p className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1">
                                                        {bid.bid_ntce_nm}
                                                    </p>
                                                </div>
                                            </td>
                                            <td className="px-8 py-5 text-sm font-medium text-slate-600">{bid.ntce_instt_nm}</td>
                                            <td className="px-8 py-5">
                                                <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold">
                                                    {bid.api_category || "기타"}
                                                </span>
                                            </td>
                                            <td className="px-8 py-5 text-right font-mono font-bold text-slate-900">
                                                {bid.presmpt_prce ? `${(Number(bid.presmpt_prce) / 100000000).toFixed(1)}억` : "-"}
                                            </td>
                                            <td className="px-8 py-5 text-sm font-medium text-slate-500">
                                                {new Date(bid.bid_clse_dt).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                            </td>
                                            <td className="px-8 py-5 text-center">
                                                <span className={`inline-flex px-3 py-1 rounded-full text-xs font-black uppercase tracking-tighter ${isActive
                                                    ? "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200"
                                                    : "bg-slate-100 text-slate-500 ring-1 ring-slate-200"
                                                    }`}>
                                                    {isActive ? "ONGOING" : "CLOSED"}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}

function StatCard({ title, value, color, icon }: { title: string; value: number; color: StatCardColor; icon: string }) {
    const colors: Record<StatCardColor, string> = {
        slate: "text-slate-900 bg-slate-50 border-slate-200",
        emerald: "text-emerald-600 bg-emerald-50 border-emerald-100",
        blue: "text-blue-600 bg-blue-50 border-blue-100",
        amber: "text-amber-600 bg-amber-50 border-amber-100"
    };
    return (
        <div className={`bg-white rounded-2xl shadow-sm border p-6 hover:shadow-md transition-shadow`}>
            <div className="flex justify-between items-start mb-4">
                <span className="text-2xl">{icon}</span>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{title}</span>
            </div>
            <p className={`text-3xl font-black ${colors[color].split(' ')[0]}`}>{value.toLocaleString()}</p>
        </div>
    );
}

function FilterTab({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${active
                ? "bg-white text-indigo-600 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
                }`}
        >
            {label}
        </button>
    );
}
