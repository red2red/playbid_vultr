import { PointHistoryPage } from '@/components/profile/point-history-page';
import { getPointHistoryData } from '@/lib/bid/profile-query';

interface PointHistoryRoutePageProps {
    searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

export default async function PointHistoryRoutePage({ searchParams }: PointHistoryRoutePageProps) {
    const resolvedParams = (await searchParams) ?? {};
    const data = await getPointHistoryData(resolvedParams);
    return <PointHistoryPage data={data} />;
}
