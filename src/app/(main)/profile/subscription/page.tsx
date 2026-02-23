import { SubscriptionManagementPage } from '@/components/profile/subscription-management-page';
import { getProfileOverviewData } from '@/lib/bid/profile-query';

export default async function ProfileSubscriptionPage() {
    const data = await getProfileOverviewData();
    return <SubscriptionManagementPage data={data} />;
}
