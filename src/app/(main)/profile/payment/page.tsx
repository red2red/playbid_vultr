import { PaymentManagementPage } from '@/components/profile/payment-management-page';
import { getProfileOverviewData } from '@/lib/bid/profile-query';

export default async function ProfilePaymentPage() {
    const data = await getProfileOverviewData();
    return <PaymentManagementPage data={data} />;
}
