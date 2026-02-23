import { getOpeningStatusLabel } from '@/lib/bid/opening-query';
import type { OpeningStatus } from '@/lib/bid/opening-types';

interface OpeningStatusBadgeProps {
    status: OpeningStatus;
}

function getStatusClassName(status: OpeningStatus): string {
    if (status === 'awarded') {
        return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300';
    }
    if (status === 'failed') {
        return 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300';
    }
    if (status === 'rebid') {
        return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300';
    }
    return 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200';
}

export function OpeningStatusBadge({ status }: OpeningStatusBadgeProps) {
    return (
        <span
            className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold ${getStatusClassName(
                status
            )}`}
        >
            {getOpeningStatusLabel(status)}
        </span>
    );
}
