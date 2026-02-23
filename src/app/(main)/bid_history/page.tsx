import { BidHistoryPage } from '@/components/bid-history/bid-history-page';
import { getBidHistoryListData } from '@/lib/bid/bid-history-query';

interface BidHistoryRoutePageProps {
    searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

export default async function BidHistoryRoutePage({ searchParams }: BidHistoryRoutePageProps) {
    const resolvedParams = (await searchParams) ?? {};
    const data = await getBidHistoryListData(resolvedParams);

    return <BidHistoryPage data={data} />;
}
