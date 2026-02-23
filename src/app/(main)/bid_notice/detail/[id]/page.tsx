import { NoticeDetailPage } from '@/components/notice-detail/notice-detail-page';
import { getNoticeDetailPageData } from '@/lib/bid/notice-detail-query';

type PageParams = { id: string };

interface BidNoticeDetailPageProps {
    params: PageParams | Promise<PageParams>;
    searchParams?: Promise<{ print?: string }>;
}

export default async function BidNoticeDetailPage({
    params,
    searchParams,
}: BidNoticeDetailPageProps) {
    const resolvedParams = await params;
    const resolvedSearchParams = (await searchParams) ?? {};
    const noticeId = resolvedParams.id;
    const data = await getNoticeDetailPageData(noticeId);
    const showPrintPreview = resolvedSearchParams.print === '1';

    return <NoticeDetailPage noticeId={noticeId} data={data} showPrintPreview={showPrintPreview} />;
}
