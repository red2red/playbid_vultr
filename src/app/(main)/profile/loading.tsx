export default function ProfileLoading() {
    return (
        <main className="min-h-screen bg-slate-50 px-4 py-6 text-slate-900 md:px-6 lg:px-8 dark:bg-[#0B1121] dark:text-slate-100">
            <div className="mx-auto max-w-[1440px] space-y-4 animate-pulse">
                <section className="h-24 rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-[#151E32]" />
                <section className="grid grid-cols-1 gap-4 xl:grid-cols-[1.8fr_1fr]">
                    <div className="space-y-4">
                        <div className="h-64 rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-[#151E32]" />
                        <div className="h-56 rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-[#151E32]" />
                        <div className="h-56 rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-[#151E32]" />
                    </div>
                    <div className="space-y-4">
                        <div className="h-48 rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-[#151E32]" />
                        <div className="h-48 rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-[#151E32]" />
                        <div className="h-36 rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-[#151E32]" />
                    </div>
                </section>
            </div>
        </main>
    );
}
