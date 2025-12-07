"use client";

const mockSubscriptions = [
    { id: "1", email: "user1@gmail.com", name: "김철수", plan: "premium", startDate: "2024-11-01", endDate: "2024-12-01", amount: 9900, status: "active" },
    { id: "2", email: "user2@naver.com", name: "이영희", plan: "premium", startDate: "2024-10-15", endDate: "2024-11-15", amount: 9900, status: "expired" },
    { id: "3", email: "user3@kakao.com", name: "박민수", plan: "premium", startDate: "2024-12-01", endDate: "2025-01-01", amount: 9900, status: "active" },
];

const mockPromoCodes = [
    { code: "WELCOME2024", discount: 50, usedCount: 234, maxUse: 500, expiry: "2024-12-31", isActive: true },
    { code: "NEWYEAR2025", discount: 30, usedCount: 0, maxUse: 1000, expiry: "2025-01-31", isActive: true },
    { code: "SUMMER2024", discount: 20, usedCount: 156, maxUse: 200, expiry: "2024-08-31", isActive: false },
];

export default function SubscriptionsPage() {
    return (
        <div className="p-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">구독 관리</h1>
                    <p className="text-slate-600">프리미엄 구독 및 결제를 관리합니다.</p>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-4 mb-6">
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
                    <p className="text-2xl font-bold text-slate-900">89</p>
                    <p className="text-sm text-slate-600">활성 구독자</p>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
                    <p className="text-2xl font-bold text-green-600">₩881,100</p>
                    <p className="text-sm text-slate-600">이번 달 수익</p>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
                    <p className="text-2xl font-bold text-blue-600">12</p>
                    <p className="text-sm text-slate-600">이번 달 신규</p>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
                    <p className="text-2xl font-bold text-amber-600">5</p>
                    <p className="text-sm text-slate-600">만료 예정</p>
                </div>
            </div>

            {/* Sections */}
            <div className="grid grid-cols-2 gap-6">
                {/* Subscriptions */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200">
                    <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
                        <h2 className="font-semibold text-slate-900">최근 구독</h2>
                        <button className="text-sm text-blue-600 hover:text-blue-700">전체 보기</button>
                    </div>
                    <div className="divide-y divide-slate-100">
                        {mockSubscriptions.map((sub) => (
                            <div key={sub.id} className="px-6 py-4 flex items-center justify-between">
                                <div>
                                    <p className="font-medium text-slate-900">{sub.name}</p>
                                    <p className="text-sm text-slate-500">{sub.email}</p>
                                </div>
                                <div className="text-right">
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${sub.status === "active" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                                        }`}>
                                        {sub.status === "active" ? "활성" : "만료"}
                                    </span>
                                    <p className="text-sm text-slate-500 mt-1">~{sub.endDate}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Promo Codes */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200">
                    <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
                        <h2 className="font-semibold text-slate-900">프로모션 코드</h2>
                        <button className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition">
                            + 코드 생성
                        </button>
                    </div>
                    <div className="divide-y divide-slate-100">
                        {mockPromoCodes.map((promo) => (
                            <div key={promo.code} className="px-6 py-4 flex items-center justify-between">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <code className="px-2 py-1 bg-slate-100 rounded text-sm font-mono">{promo.code}</code>
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${promo.isActive ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-600"
                                            }`}>
                                            {promo.isActive ? "활성" : "비활성"}
                                        </span>
                                    </div>
                                    <p className="text-sm text-slate-500 mt-1">{promo.discount}% 할인 • {promo.usedCount}/{promo.maxUse}회 사용</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm text-slate-500">~{promo.expiry}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Pricing Plan */}
            <div className="mt-6 bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <h2 className="font-semibold text-slate-900 mb-4">구독 플랜 설정</h2>
                <div className="grid grid-cols-2 gap-6">
                    <div className="p-4 border border-slate-200 rounded-xl">
                        <h3 className="font-medium text-slate-900 mb-2">무료 플랜</h3>
                        <p className="text-2xl font-bold text-slate-900 mb-2">₩0<span className="text-sm font-normal text-slate-500">/월</span></p>
                        <ul className="text-sm text-slate-600 space-y-1">
                            <li>• 입찰공고 조회 (제한)</li>
                            <li>• 일일 미션 참여</li>
                            <li>• 기본 학습 콘텐츠</li>
                        </ul>
                    </div>
                    <div className="p-4 border-2 border-blue-500 rounded-xl bg-blue-50">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="font-medium text-slate-900">프리미엄 플랜</h3>
                            <button className="text-sm text-blue-600 hover:text-blue-700">수정</button>
                        </div>
                        <p className="text-2xl font-bold text-blue-600 mb-2">₩9,900<span className="text-sm font-normal text-slate-500">/월</span></p>
                        <ul className="text-sm text-slate-600 space-y-1">
                            <li>• 입찰공고 무제한 조회</li>
                            <li>• AI 예측 분석</li>
                            <li>• 전체 학습 콘텐츠</li>
                            <li>• 우선 고객 지원</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}
