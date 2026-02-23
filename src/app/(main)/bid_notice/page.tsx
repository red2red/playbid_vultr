import Link from 'next/link';

const SAMPLE_NOTICE_IDS = ['20260223-001', '20260223-101', '20260223-102'];

export default function BidNoticeListPage() {
    return (
        <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900">
            <div className="mx-auto max-w-5xl">
                <h1 className="mb-4 text-3xl font-bold">입찰공고</h1>
                <p className="mb-6 text-sm text-slate-600">
                    T-022 구현 전 임시 목록입니다. 상세 페이지 연결 검증을 위해 샘플 항목을 제공합니다.
                </p>
                <div className="space-y-3">
                    {SAMPLE_NOTICE_IDS.map((id) => (
                        <Link
                            key={id}
                            href={`/bid_notice/detail/${id}`}
                            className="block rounded-lg border border-slate-200 bg-white p-4 shadow-sm hover:border-blue-300"
                        >
                            <p className="text-sm font-semibold text-slate-900">샘플 공고 {id}</p>
                            <p className="mt-1 text-xs text-slate-500">입찰공고 상세 화면으로 이동</p>
                        </Link>
                    ))}
                </div>
            </div>
        </main>
    );
}
