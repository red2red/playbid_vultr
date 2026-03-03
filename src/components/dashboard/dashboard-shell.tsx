'use client';

import type { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { DashboardSidebarNav } from './dashboard-sidebar-nav';
import { DashboardTopbar } from './dashboard-topbar';

interface DashboardShellProps {
    children: ReactNode;
    userDisplayName?: string;
    userLevelLabel?: string | null;
}

export function DashboardShell({
    children,
    userDisplayName = '사용자',
    userLevelLabel = null,
}: DashboardShellProps) {
    const pathname = usePathname() ?? '/dashboard';

    return (
        <div className="dashboard-theme min-h-screen bg-[var(--dashboard-bg-main)] text-slate-200">
            <div className="flex min-h-screen">
                <DashboardSidebarNav
                    pathname={pathname}
                    userDisplayName={userDisplayName}
                    userLevelLabel={userLevelLabel}
                />
                <div className="flex-1 lg:ml-[240px]">
                    <DashboardTopbar userDisplayName={userDisplayName} pathname={pathname} />
                    {children}
                </div>
            </div>
        </div>
    );
}
