export function NoticeStatePreviewDev() {
    return (
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="mb-3 text-sm font-semibold text-slate-900">상태 미리보기 (DEV)</h3>
            <div className="space-y-2 text-xs">
                <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-slate-600">
                    북마크 OFF
                </div>
                <div className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-blue-700">
                    북마크 ON
                </div>
                <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-rose-700">
                    카운트다운: 12:34:56
                </div>
                <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-amber-700">
                    다운로드 실패 → 재시도(최대 3회)
                </div>
            </div>
        </section>
    );
}
