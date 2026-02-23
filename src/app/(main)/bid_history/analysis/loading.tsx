export default function BidHistoryAnalysisLoading() {
    return (
        <main className="min-h-screen bg-slate-50 px-4 py-8 dark:bg-[#0B1121]">
            <div className="mx-auto max-w-6xl space-y-4">
                <div className="h-40 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800" />
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
                    {Array.from({ length: 4 }).map((_, index) => (
                        <div
                            key={`bid-history-analysis-skeleton-${index + 1}`}
                            className="h-24 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800"
                        />
                    ))}
                </div>
                <div className="h-64 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800" />
            </div>
        </main>
    );
}
