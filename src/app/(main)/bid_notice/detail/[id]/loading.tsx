function SkeletonBlock({ className = '' }: { className?: string }) {
    return <div className={`animate-pulse rounded-lg bg-slate-200 ${className}`} />;
}

export default function BidNoticeDetailLoading() {
    return (
        <main className="min-h-screen bg-slate-50 px-4 py-6">
            <div className="mx-auto w-full max-w-[1440px]">
                <div className="space-y-4">
                    <SkeletonBlock className="h-24 w-full" />
                    <SkeletonBlock className="h-40 w-full" />
                    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(300px,1fr)]">
                        <div className="space-y-4">
                            <SkeletonBlock className="h-64 w-full" />
                            <SkeletonBlock className="h-48 w-full" />
                            <SkeletonBlock className="h-64 w-full" />
                        </div>
                        <div className="space-y-4">
                            <SkeletonBlock className="h-52 w-full" />
                            <SkeletonBlock className="h-48 w-full" />
                            <SkeletonBlock className="h-56 w-full" />
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
