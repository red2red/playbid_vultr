'use client';

import { useEffect, useMemo, useState } from 'react';

interface NoticeDeadlineCardProps {
    bidDeadlineAtIso: string;
    bidDeadlineAtLabel: string;
}

function formatCountdown(ms: number): string {
    const totalSeconds = Math.max(0, Math.floor(ms / 1000));
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export function NoticeDeadlineCard({
    bidDeadlineAtIso,
    bidDeadlineAtLabel,
}: NoticeDeadlineCardProps) {
    const [now, setNow] = useState(() => Date.now());

    useEffect(() => {
        const timer = window.setInterval(() => setNow(Date.now()), 1000);
        return () => window.clearInterval(timer);
    }, []);

    const { mainLabel, helperLabel, progress } = useMemo(() => {
        const target = new Date(bidDeadlineAtIso).getTime();
        if (Number.isNaN(target)) {
            return {
                mainLabel: '-',
                helperLabel: '마감 시간 계산 불가',
                progress: 0,
            };
        }

        const remaining = target - now;
        if (remaining <= 0) {
            return {
                mainLabel: '마감',
                helperLabel: '마감 시간이 지났습니다.',
                progress: 100,
            };
        }

        const oneDayMs = 24 * 60 * 60 * 1000;
        if (remaining <= oneDayMs) {
            return {
                mainLabel: formatCountdown(remaining),
                helperLabel: '마감 24시간 이내',
                progress: 90,
            };
        }

        const day = Math.ceil(remaining / oneDayMs);
        const progressValue = Math.min(85, Math.max(5, 100 - day * 12));
        return {
            mainLabel: `D-${day}`,
            helperLabel: '마감까지 남은 시간',
            progress: progressValue,
        };
    }, [bidDeadlineAtIso, now]);

    return (
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-[#151E32]">
            <h2 className="mb-3 text-lg font-semibold text-slate-900 dark:text-slate-100">마감 정보</h2>
            <p className="mb-1 text-center text-5xl font-bold text-amber-500" aria-live="polite">
                {mainLabel}
            </p>
            <p className="mb-3 text-center text-xs font-semibold text-slate-500 dark:text-slate-400">{helperLabel}</p>
            <div
                role="progressbar"
                aria-label="마감 진행률"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round(progress)}
                aria-valuetext={`${Math.round(progress)}%`}
                className="mb-2 h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700"
            >
                <div className="h-2 rounded-full bg-gradient-to-r from-emerald-500 to-amber-500" style={{ width: `${progress}%` }} />
            </div>
            <p className="text-center text-xs text-slate-500 dark:text-slate-400">마감일시: {bidDeadlineAtLabel}</p>
        </section>
    );
}
