"use client";

const mockBids = [
    { id: "1", title: "서울시 도로보수 공사", organization: "서울특별시", category: "건설", estimatedPrice: 50000000, deadline: "2024-12-10", status: "active", mockBidCount: 45 },
    { id: "2", title: "경기도 교육청 물품구매", organization: "경기도교육청", category: "물품", estimatedPrice: 12000000, deadline: "2024-12-08", status: "active", mockBidCount: 23 },
    { id: "3", title: "부산시 IT 시스템 구축", organization: "부산광역시", category: "용역", estimatedPrice: 85000000, deadline: "2024-12-15", status: "active", mockBidCount: 67 },
    { id: "4", title: "인천공항 청소용역", organization: "인천국제공항공사", category: "용역", estimatedPrice: 30000000, deadline: "2024-12-05", status: "closed", mockBidCount: 89 },
];

export default function BidsPage() {
    return (
        <div className="p-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">입찰 공고 관리</h1>
                    <p className="text-slate-600">나라장터 연동 입찰 공고를 관리합니다.</p>
                </div>
                <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition">
                    🔄 데이터 동기화
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-4 mb-6">
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
                    <p className="text-2xl font-bold text-slate-900">1,234</p>
                    <p className="text-sm text-slate-600">전체 공고</p>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
                    <p className="text-2xl font-bold text-green-600">456</p>
                    <p className="text-sm text-slate-600">진행 중</p>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
                    <p className="text-2xl font-bold text-blue-600">224</p>
                    <p className="text-sm text-slate-600">모의입찰 진행</p>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
                    <p className="text-2xl font-bold text-amber-600">89</p>
                    <p className="text-sm text-slate-600">오늘 마감</p>
                </div>
            </div>

            {/* Sync Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <span className="text-2xl">ℹ️</span>
                    <div>
                        <p className="font-medium text-blue-900">마지막 동기화: 2024-12-06 15:30</p>
                        <p className="text-sm text-blue-700">나라장터 API에서 자동으로 10분마다 동기화됩니다.</p>
                    </div>
                </div>
                <button className="px-3 py-1 text-sm text-blue-700 border border-blue-300 rounded hover:bg-blue-100 transition">
                    설정
                </button>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <table className="w-full">
                    <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                            <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">공고명</th>
                            <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">발주처</th>
                            <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">카테고리</th>
                            <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">추정가</th>
                            <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">마감일</th>
                            <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">모의입찰</th>
                            <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">상태</th>
                        </tr>
                    </thead>
                    <tbody>
                        {mockBids.map((bid) => (
                            <tr key={bid.id} className="border-b border-slate-100 hover:bg-slate-50">
                                <td className="px-6 py-4">
                                    <p className="font-medium text-slate-900 truncate max-w-xs">{bid.title}</p>
                                </td>
                                <td className="px-6 py-4 text-sm text-slate-600">{bid.organization}</td>
                                <td className="px-6 py-4">
                                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                                        {bid.category}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-sm text-slate-900 font-medium">
                                    {(bid.estimatedPrice / 10000).toLocaleString()}만원
                                </td>
                                <td className="px-6 py-4 text-sm text-slate-600">{bid.deadline}</td>
                                <td className="px-6 py-4">
                                    <span className="text-blue-600 font-medium">{bid.mockBidCount}명</span>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${bid.status === "active" ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-600"
                                        }`}>
                                        {bid.status === "active" ? "진행중" : "마감"}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
