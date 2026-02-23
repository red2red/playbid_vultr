export default function ProfileBookmarksLoading() {
    return (
        <main className="min-h-screen bg-slate-50 px-4 py-8 dark:bg-[#0B1121]">
            <div className="mx-auto max-w-[1440px] space-y-4">
                <div className="h-28 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800" />
                <div className="h-24 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800" />
                {Array.from({ length: 4 }).map((_, index) => (
                    <div
                        key={`bookmark-loading-${index + 1}`}
                        className="h-44 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800"
                    />
                ))}
            </div>
        </main>
    );
}
