"use client";

const mockInquiries = [
    { id: "1", email: "user1@gmail.com", subject: "결제 오류 문의", status: "pending", createdAt: "2024-12-06 14:30", category: "payment" },
    { id: "2", email: "user2@naver.com", subject: "앱 오류 신고", status: "in_progress", createdAt: "2024-12-05 10:20", category: "bug" },
    { id: "3", email: "user3@kakao.com", subject: "계정 삭제 요청", status: "resolved", createdAt: "2024-12-04 09:15", category: "account" },
    { id: "4", email: "user4@gmail.com", subject: "프리미엄 기능 문의", status: "resolved", createdAt: "2024-12-03 16:45", category: "general" },
];

export default function SupportPage() {
    return (
        <div className="p-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">고객 지원</h1>
                    <p className="text-slate-600">사용자 문의를 관리합니다.</p>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-4 mb-6">
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
                    <p className="text-2xl font-bold text-slate-900">12</p>
                    <p className="text-sm text-slate-600">전체 문의</p>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
                    <p className="text-2xl font-bold text-red-600">3</p>
                    <p className="text-sm text-slate-600">대기 중</p>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
                    <p className="text-2xl font-bold text-amber-600">2</p>
                    <p className="text-sm text-slate-600">처리 중</p>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
                    <p className="text-2xl font-bold text-green-600">7</p>
                    <p className="text-sm text-slate-600">완료</p>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <table className="w-full">
                    <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                            <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">제목</th>
                            <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">이메일</th>
                            <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">카테고리</th>
                            <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">상태</th>
                            <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">접수일</th>
                            <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">관리</th>
                        </tr>
                    </thead>
                    <tbody>
                        {mockInquiries.map((inquiry) => (
                            <tr key={inquiry.id} className="border-b border-slate-100 hover:bg-slate-50">
                                <td className="px-6 py-4 font-medium text-slate-900">{inquiry.subject}</td>
                                <td className="px-6 py-4 text-sm text-slate-600">{inquiry.email}</td>
                                <td className="px-6 py-4">
                                    <CategoryBadge category={inquiry.category} />
                                </td>
                                <td className="px-6 py-4">
                                    <StatusBadge status={inquiry.status} />
                                </td>
                                <td className="px-6 py-4 text-sm text-slate-600">{inquiry.createdAt}</td>
                                <td className="px-6 py-4">
                                    <button className="px-3 py-1 text-sm text-blue-600 border border-blue-300 rounded hover:bg-blue-50 transition">
                                        답변
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* FAQ Section */}
            <div className="mt-6 bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="font-semibold text-slate-900">자주 묻는 질문 (FAQ)</h2>
                    <button className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition">
                        + FAQ 추가
                    </button>
                </div>
                <div className="space-y-2">
                    {[
                        { q: "프리미엄 구독은 어떻게 취소하나요?", category: "payment" },
                        { q: "모의입찰 결과는 언제 확인할 수 있나요?", category: "general" },
                        { q: "앱이 느려요. 어떻게 해야 하나요?", category: "bug" },
                    ].map((faq, idx) => (
                        <div key={idx} className="p-3 bg-slate-50 rounded-lg flex items-center justify-between">
                            <span className="text-sm text-slate-900">{faq.q}</span>
                            <button className="text-sm text-blue-600 hover:text-blue-700">수정</button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

function CategoryBadge({ category }: { category: string }) {
    const config: Record<string, { label: string; color: string }> = {
        payment: { label: "결제", color: "bg-red-100 text-red-700" },
        bug: { label: "버그", color: "bg-orange-100 text-orange-700" },
        account: { label: "계정", color: "bg-purple-100 text-purple-700" },
        general: { label: "일반", color: "bg-slate-100 text-slate-700" },
    };
    const { label, color } = config[category] || { label: category, color: "bg-slate-100 text-slate-600" };

    return <span className={`px-2 py-1 rounded-full text-xs font-medium ${color}`}>{label}</span>;
}

function StatusBadge({ status }: { status: string }) {
    const config: Record<string, { label: string; color: string }> = {
        pending: { label: "대기", color: "bg-red-100 text-red-700" },
        in_progress: { label: "처리중", color: "bg-amber-100 text-amber-700" },
        resolved: { label: "완료", color: "bg-green-100 text-green-700" },
    };
    const { label, color } = config[status] || { label: status, color: "bg-slate-100 text-slate-600" };

    return <span className={`px-2 py-1 rounded-full text-xs font-medium ${color}`}>{label}</span>;
}
