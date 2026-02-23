import { OpeningResultDetailPage } from '@/components/opening-results/opening-result-detail-page';
import { getOpeningResultDetailData } from '@/lib/bid/opening-query';

type PageParams = {
    id: string;
};

interface BidOpeningDetailPageProps {
    params: PageParams | Promise<PageParams>;
}

export default async function BidOpeningDetailPage({ params }: BidOpeningDetailPageProps) {
    const resolvedParams = await params;
    const data = await getOpeningResultDetailData(resolvedParams.id);
    return <OpeningResultDetailPage data={data} />;
}
