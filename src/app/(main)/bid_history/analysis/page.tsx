import { BidHistoryAnalysisPage } from '@/components/bid-history/bid-history-analysis-page';
import { getBidHistoryAnalysisData } from '@/lib/bid/bid-history-query';

interface BidHistoryAnalysisRoutePageProps {
    searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

function getQueryParam(
    params: Record<string, string | string[] | undefined>,
    key: string
): string {
    const value = params[key];
    if (typeof value === 'string') {
        return value;
    }
    if (Array.isArray(value)) {
        return value[0] ?? '';
    }
    return '';
}

export default async function BidHistoryAnalysisRoutePage({
    searchParams,
}: BidHistoryAnalysisRoutePageProps) {
    const resolvedParams = (await searchParams) ?? {};
    const id = getQueryParam(resolvedParams, 'id');

    const data = await getBidHistoryAnalysisData(id);

    return <BidHistoryAnalysisPage data={data} />;
}
