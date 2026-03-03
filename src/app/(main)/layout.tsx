import type { ReactNode } from 'react';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import { getCurrentUserSummary } from '@/lib/bid/current-user-summary-query';

interface MainLayoutProps {
    children: ReactNode;
}

export default async function MainLayout({ children }: MainLayoutProps) {
    const userSummary = await getCurrentUserSummary();

    return (
        <DashboardShell
            userDisplayName={userSummary.displayName}
            userLevelLabel={userSummary.levelLabel}
        >
            {children}
        </DashboardShell>
    );
}
