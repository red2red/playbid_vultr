import { getDashboardData } from '@/lib/bid/dashboard-query';
import { DashboardOverviewContent } from '@/components/dashboard/dashboard-overview-content';
import { buildDashboardOverviewViewModel } from '@/lib/bid/dashboard-view-model';
import { getCurrentUserSummary } from '@/lib/bid/current-user-summary-query';

export default async function DashboardPage() {
    const [data, userSummary] = await Promise.all([getDashboardData(), getCurrentUserSummary()]);
    const viewModel = buildDashboardOverviewViewModel(data, {
        userDisplayName: userSummary.displayName,
    });

    return (
        <div className="px-4 py-5 md:px-6 md:py-6 lg:px-8 lg:py-8">
            <DashboardOverviewContent viewModel={viewModel} />
        </div>
    );
}
