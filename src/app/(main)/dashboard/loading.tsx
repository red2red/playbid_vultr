function SkeletonBlock({ className = '' }: { className?: string }) {
    return <div className={`animate-pulse rounded-xl bg-slate-200/80 dark:bg-slate-700/60 ${className}`} />;
}

export default function DashboardLoading() {
    return (
        <main className="min-h-screen bg-slate-50 px-4 py-6 md:px-6 lg:px-8 dark:bg-[#0B1121]">
            <div className="mx-auto max-w-[1440px] space-y-4">
                <SkeletonBlock className="h-24 w-full" />
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                    <SkeletonBlock className="h-36 w-full" />
                    <SkeletonBlock className="h-36 w-full" />
                    <SkeletonBlock className="h-36 w-full" />
                    <SkeletonBlock className="h-36 w-full" />
                    <SkeletonBlock className="h-36 w-full" />
                </div>
                <SkeletonBlock className="h-28 w-full" />
            </div>
        </main>
    );
}
