import { OpeningResultsPage } from '@/components/opening-results/opening-results-page';
import { getOpeningResultsListData } from '@/lib/bid/opening-query';

interface BidOpeningPageProps {
    searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

export default async function BidOpeningPage({ searchParams }: BidOpeningPageProps) {
    const resolvedParams = (await searchParams) ?? {};
    const data = await getOpeningResultsListData(resolvedParams);
    return <OpeningResultsPage data={data} />;
}
