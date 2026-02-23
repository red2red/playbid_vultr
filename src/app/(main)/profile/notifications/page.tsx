import { NotificationCenterPage } from '@/components/notifications/notification-center-page';
import { getNotificationListData } from '@/lib/bid/notification-list-query';

interface ProfileNotificationsRoutePageProps {
    searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

export default async function ProfileNotificationsRoutePage({
    searchParams,
}: ProfileNotificationsRoutePageProps) {
    const resolvedParams = (await searchParams) ?? {};
    const data = await getNotificationListData(resolvedParams);

    return <NotificationCenterPage data={data} />;
}
