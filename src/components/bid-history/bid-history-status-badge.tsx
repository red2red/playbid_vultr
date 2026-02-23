import type { BidHistoryStatus } from '@/lib/bid/bid-history-types';
import { getBidHistoryStatusLabel } from '@/lib/bid/bid-history-query';

interface BidHistoryStatusBadgeProps {
    status: BidHistoryStatus;
}

function getStatusClassName(status: BidHistoryStatus): string {
    if (status === 'success') {
        return 'border-emerald-200 bg-emerald-100 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300';
    }

    if (status === 'fail') {
        return 'border-rose-200 bg-rose-100 text-rose-700 dark:border-rose-800 dark:bg-rose-900/40 dark:text-rose-300';
    }

    if (status === 'pending') {
        return 'border-blue-200 bg-blue-100 text-blue-700 dark:border-blue-800 dark:bg-blue-900/40 dark:text-blue-300';
    }

    if (status === 'void') {
        return 'border-amber-200 bg-amber-100 text-amber-700 dark:border-amber-800 dark:bg-amber-900/40 dark:text-amber-300';
    }

    return 'border-slate-200 bg-slate-100 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300';
}

export function BidHistoryStatusBadge({ status }: BidHistoryStatusBadgeProps) {
    return (
        <span
            className={`inline-flex items-center rounded-full border px-2 py-1 text-[11px] font-semibold ${getStatusClassName(
                status
            )}`}
        >
            {getBidHistoryStatusLabel(status)}
        </span>
    );
}
