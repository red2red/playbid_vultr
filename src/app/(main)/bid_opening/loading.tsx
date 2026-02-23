function SkeletonBlock({ className = '' }: { className?: string }) {
    return <div className={`animate-pulse rounded-xl bg-slate-200/80 dark:bg-slate-700/60 ${className}`} />;
}

export default function BidOpeningLoading() {
    return (
        <main className="min-h-screen bg-slate-50 px-4 py-6 md:px-6 lg:px-8 dark:bg-[#0B1121]">
            <div className="mx-auto max-w-[1440px] space-y-4">
                <SkeletonBlock className="h-24 w-full" />
                <SkeletonBlock className="h-20 w-full" />
                <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                    <SkeletonBlock className="h-44 w-full" />
                    <SkeletonBlock className="h-44 w-full" />
                    <SkeletonBlock className="h-44 w-full" />
                    <SkeletonBlock className="h-44 w-full" />
                </div>
            </div>
        </main>
    );
}
