import { ProfileOverviewPage } from '@/components/profile/profile-overview-page';
import { getProfileOverviewData } from '@/lib/bid/profile-query';

export default async function ProfilePage() {
    const data = await getProfileOverviewData();
    return <ProfileOverviewPage data={data} />;
}
